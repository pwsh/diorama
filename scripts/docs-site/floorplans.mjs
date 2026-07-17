#!/usr/bin/env node
// Floor-plan capture pipeline for the Diorama documentation site.
//
//   node scripts/docs-site/floorplans.mjs [flags]
//
// Drives the REAL built app in offline mode over CDP (reusing the docs-gallery
// chrome / CDP / static-server plumbing) to screenshot every committed plan in
// docs/floorplans/*.json, then emits a page per plan + a library index — all
// through the shared site shell (scripts/docs-site/shell.mjs).
//
// Per plan, per shot, a fresh page is navigated with localStorage pre-seeded
// (via Page.addScriptToEvaluateOnNewDocument, BEFORE app code runs) so the
// offline Planner loads the plan as its active configuration:
//   diorama:offline                     = '1'
//   diorama:local:diorama-configs       = { version:1, activeId:<id>, configs:[…] }
//   diorama:local:diorama-cfg-<id>      = the store body (per-shot mutated)
//   diorama:view                        = '2d' | '3d'
//   (diorama:store:v1 removed)
// Key formats confirmed against src/ha-local.ts (LOCAL_PREFIX = 'diorama:local:')
// + src/planner.ts (INDEX_KEY='diorama-configs', cfgBodyKey='diorama-cfg-'+id).
//
// Shots per plan:
//   2d-<n>.png    — 2D plan, view mode, one per floor (n = floor index)
//   iso-<n>.png   — 3D dimetric iso, one per floor (cam computed from w/d)
//   glasshouse.png — one per plan: topmost floor active, scene3d.glassHouse on
//
// Flags:
//   --no-build     skip `npm run build` (reuse existing dist/)
//   --pages-only   regenerate ONLY the pages from existing PNGs (no browser)
//   --only <id>    restrict to the plan whose id === <id>
//   --force        re-capture even if the PNG already exists
//   --keep         keep the chrome profile + serve dir on exit (debugging)
//
// No runtime deps: static server + CDP client use Node built-ins (global fetch +
// WebSocket, Node ≥ 22). Output (docs-site/) is gitignored by design.

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { sitePage, writeSharedAssets, htmlEsc } from './shell.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const DIST = path.join(REPO, 'dist');
const SITE_ROOT = path.join(REPO, 'docs-site');
const OUT = path.join(SITE_ROOT, 'floorplans');
const IMG = path.join(OUT, 'img');
const PLANS_DIR = path.join(REPO, 'docs', 'floorplans');
const PKG = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'));

// ── args ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const val = (n, d) => { const i = argv.indexOf(n); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d; };
const OPTS = {
  build: !flag('--no-build'),
  pagesOnly: flag('--pages-only'),
  only: val('--only', null),
  force: flag('--force'),
  keep: flag('--keep'),
};

const log = (...a) => console.log('[docs-floorplans]', ...a);
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function isoDate(d = new Date()) { return d.toISOString().slice(0, 10); }

// ── capture geometry (viewport + camera) ──────────────────────────────────────
const VIEW_W = 1280, VIEW_H = 960;
const CLIP_TOP = 50;   // hidden topbar's reserved layout band, cropped from every shot
const STORY_H = 3000;   // matches three-renderer updateGhostFloors

// Dimetric iso pose in SCENE coordinates, matching three-renderer's
// applyViewPreset('sims'/'iso') math: azimuth 45°, elevation atan(1/√2)≈35.26°,
// distance max(fw,fd)*1.35, target = floor centre (scene origin) at y≈600.
// cam= is applied verbatim by three-view._applyUrlTemplate → setCameraView.
function isoCam(fw, fd, { distMul = 1.35, targetY = 600 } = {}) {
  const d = Math.max(fw, fd) * distMul;
  const el = Math.atan(1 / Math.SQRT2);
  const r = d * Math.cos(el), h = d * Math.sin(el);
  const a = Math.PI / 4;
  const tx = 0, ty = targetY, tz = 0;
  return [tx - r * Math.sin(a), ty + h, tz - r * Math.cos(a), tx, ty, tz];
}

// Glass-house overview: iso pose pulled back ×1.6 on the TOP floor. Ghost floors
// stack BELOW (negative y, STORY_H apart), so drop the target toward the stack
// centre and grow the framing span to cover the vertical extent.
function glassCam(floors, topFloor) {
  const fw = topFloor.w, fd = topFloor.d;
  const nBelow = Math.max(0, floors.length - 1);
  const stackH = nBelow * STORY_H;
  const targetY = 600 - stackH / 2;
  const span = Math.max(fw, fd, stackH + Math.max(fw, fd) * 0.4) * 1.6;
  const el = Math.atan(1 / Math.SQRT2);
  const r = span * Math.cos(el), h = span * Math.sin(el);
  const a = Math.PI / 4;
  return [-r * Math.sin(a), targetY + h, -r * Math.cos(a), 0, targetY, 0];
}

// Produce a DISPLAY-CLEAN store body from a plan store + per-shot overrides.
// canvas-render draws blue wall-vertex + furniture-corner handles for every
// UNLOCKED placeable regardless of UI mode (pre-existing app behavior), and a
// persisted activeSensorId would draw a selection outline — neither wanted in a
// docs screenshot. Locking every placeable and clearing the active selection is
// purely visual: `locked` is never read by the 3D renderer or nav, so it changes
// nothing in the iso/glass shots. Deep-cloned so the source store is untouched.
const PLACEABLE_ARRAYS = [
  'walls', 'furniture', 'lights', 'switches', 'doors', 'windows', 'sensors',
  'motionSensors', 'envSensors', 'bleProxies', 'cameras', 'robots',
  'safetySensors', 'alarmPanels',
];
function displayBody(store, extra = {}) {
  const body = JSON.parse(JSON.stringify(store));
  body.activeSensorId = undefined;
  for (const fl of body.floors) {
    for (const key of PLACEABLE_ARRAYS) {
      if (Array.isArray(fl[key])) for (const item of fl[key]) item.locked = true;
    }
  }
  return { ...body, ...extra };
}

// ── plan enumeration ──────────────────────────────────────────────────────────
function loadPlans() {
  if (!fs.existsSync(PLANS_DIR)) return [];
  const files = fs.readdirSync(PLANS_DIR).filter((f) => f.endsWith('.json')).sort();
  const plans = [];
  for (const f of files) {
    const full = path.join(PLANS_DIR, f);
    let env;
    try { env = JSON.parse(fs.readFileSync(full, 'utf8')); }
    catch (e) { log(`SKIP ${f}: bad JSON (${e.message})`); continue; }
    if (env.diorama !== 2 || !env.store || !Array.isArray(env.store.floors) || !env.store.floors.length) {
      log(`SKIP ${f}: not a diorama:2 envelope with floors`); continue;
    }
    const id = path.basename(f, '.json');
    plans.push({ id, file: full, name: env.name || id, store: env.store, envRaw: fs.readFileSync(full, 'utf8') });
  }
  return plans;
}

// ── minimal static file server (dist/) ────────────────────────────────────────
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.map': 'application/json', '.json': 'application/json', '.css': 'text/css',
  '.gif': 'image/gif', '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm',
  '.ico': 'image/x-icon',
};
function startServer(root) {
  const server = http.createServer((req, res) => {
    try {
      const url = decodeURIComponent(req.url.split('?')[0]);   // strip ?v= chunk-pin queries
      let file = path.join(root, url === '/' ? '/index.html' : url);
      if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

// ── minimal CDP client (browser ws + per-shot page targets) ──────────────────
async function findChrome() {
  const cands = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome'];
  for (const c of cands) {
    const r = spawnSync('which', [c], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  throw new Error('no chromium/google-chrome found on PATH');
}
async function launchChrome(headless) {
  const bin = await findChrome();
  const port = 9300 + Math.floor(Math.random() * 600);
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'df-chrome-'));
  const args = [
    ...(headless ? ['--headless=new'] : []),
    `--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`,
    '--no-sandbox', '--disable-gpu-sandbox', '--hide-scrollbars', '--mute-audio',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--window-size=1300,1000', 'about:blank',
  ];
  const proc = spawn(bin, args, { stdio: 'ignore' });
  let ws = null;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      const j = await r.json();
      if (j.webSocketDebuggerUrl) { ws = j.webSocketDebuggerUrl; break; }
    } catch { /* not up yet */ }
    await sleep(100);
  }
  if (!ws) { proc.kill('SIGKILL'); throw new Error('chrome devtools endpoint never came up'); }
  return { proc, ws, userDir, port };
}

class CDP {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 0; this.pending = new Map(); this.sessionId = null; }
  async connect() {
    this.sock = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => { this.sock.onopen = res; this.sock.onerror = rej; });
    this.sock.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === 'Runtime.consoleAPICalled' && this.onConsole) this.onConsole(msg.params);
      if (msg.id != null && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
      }
    };
  }
  send(method, params = {}, useSession = true) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (useSession && this.sessionId) payload.sessionId = this.sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.sock.send(JSON.stringify(payload));
    });
  }
  // Create a blank target, attach, and enable the domains a shot needs. Returns
  // the targetId; sessionId is stashed on `this` for subsequent session sends.
  async openTarget() {
    const { targetId } = await this.send('Target.createTarget', { url: 'about:blank' }, false);
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true }, false);
    this.sessionId = sessionId;
    await this.send('Runtime.enable');
    await this.send('Page.enable');
    return targetId;
  }
  async closeTarget(targetId) {
    this.sessionId = null;
    try { await this.send('Target.closeTarget', { targetId }, false); } catch { /* ignore */ }
  }
  async eval(expression, awaitPromise = false) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error(d.exception?.description || d.text || 'eval error');
    }
    return r.result?.value;
  }
  close() { try { this.sock.close(); } catch { /* ignore */ } }
}

// ── seed script + chrome-hiding CSS ────────────────────────────────────────────
// Wipe any stale diorama:* keys (localStorage is shared across a profile's
// tabs), then seed the offline config registry + the plan body. The page always
// boots in 2D edit (offline standalone never runs App._applyUrlParams, so URL
// params like ?mode=view&cam= are inert here); mode/view/camera are driven via
// window.__dioramaPlanner AFTER load. Booting in 2D means a later switch to 3D
// mounts <diorama-three-view> FRESH, so its _applyUrlTemplate picks up the cam
// we set on planner.urlTemplate — the one window when cam is applied.
function seedScript(planId, name, body) {
  const index = { version: 1, activeId: planId, configs: [{ id: planId, name, updatedAt: 0 }] };
  return `(function(){try{
    var ls=window.localStorage;
    Object.keys(ls).forEach(function(k){ if(k.indexOf('diorama')===0) ls.removeItem(k); });
    ls.setItem('diorama:offline','1');
    ls.setItem('diorama:local:diorama-configs', ${JSON.stringify(JSON.stringify(index))});
    ls.setItem('diorama:local:diorama-cfg-'+${JSON.stringify(planId)}, ${JSON.stringify(JSON.stringify(body))});
    ls.setItem('diorama:view','2d');
    ls.removeItem('diorama:store:v1');
  }catch(e){}})();`;
}

// Injected before capture. `visibility:hidden` (not display:none) so layout —
// and the canvas backing-store size — is untouched. Selectors verified in
// src/ui/*.ts: topbar (carries the Offline pill), weather chip, the 3D
// view-controls overlay (the only non-#three-area child div of three-view),
// the 2D "⟳ Reset view" button, and the bottom-right floor caption.
const HIDE_CSS = `
diorama-topbar,
diorama-weather-chip,
diorama-three-view > div:not(#three-area),
diorama-canvas-2d .btn-sm,
div[style*="bottom:10px;right:10px"] { visibility: hidden !important; }
`;

async function shoot(cdp, { origin, planId, planName, body, cam, is3d }) {
  const targetId = await cdp.openTarget();
  const consoleMsgs = [];
  cdp.onConsole = (p) => { consoleMsgs.push(p); };
  try {
    await cdp.send('Emulation.setDeviceMetricsOverride',
      { width: VIEW_W, height: VIEW_H, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: seedScript(planId, planName, body) });
    const fid = body.currentFloorId;
    await cdp.send('Page.navigate', { url: origin + '/index.html' });

    // Readiness: planner exists, plan loaded, and the correct floor is active.
    let ready = false;
    for (let i = 0; i < 300; i++) {
      try {
        ready = await cdp.eval(
          `!!(window.__dioramaPlanner && window.__dioramaPlanner.store &&
             Array.isArray(window.__dioramaPlanner.store.floors) &&
             window.__dioramaPlanner.store.floors.length > 0 &&
             window.__dioramaPlanner.store.currentFloorId === ${JSON.stringify(fid)})`);
      } catch { ready = false; }
      if (ready) break;
      await sleep(100);
    }
    if (!ready) throw new Error(`plan/floor never became active (${planId} @ ${fid})`);

    // Drive UI mode + view + camera through the exposed handle (URL params are
    // inert in offline standalone). For 3D, set urlTemplate.cam BEFORE switching
    // to 3D so the freshly-mounted three-view applies it.
    const drive = is3d
      ? `p.uiModeLocked=true; p.setUiMode('view'); p.urlTemplate={cam:${JSON.stringify(cam)}}; p.setView('3d');`
      : `p.uiModeLocked=true; p.setUiMode('view'); p.setView('2d');`;
    await cdp.eval(`(function(){var p=window.__dioramaPlanner; ${drive} })()`);

    if (is3d) {
      // Wait for the three canvas to mount (lazy chunk), then settle.
      let canvas = false;
      for (let i = 0; i < 150; i++) {
        try {
          canvas = await cdp.eval(
            `!!(document.querySelector('#three-area canvas') &&
               document.querySelector('#three-area canvas').width > 0)`);
        } catch { canvas = false; }
        if (canvas) break;
        await sleep(100);
      }
      if (!canvas) throw new Error(`three canvas never mounted (${planId})`);
      // 3 rAF pairs + 600 ms — toon scene + cam template settle.
      await cdp.eval(
        `new Promise(function(r){setTimeout(function(){
           requestAnimationFrame(function(){requestAnimationFrame(function(){r(true);});});
         },600);})`, true);
    } else {
      await cdp.eval(
        `new Promise(function(r){setTimeout(function(){
           requestAnimationFrame(function(){requestAnimationFrame(function(){r(true);});});
         },250);})`, true);
    }

    // Hide chrome, one more frame, screenshot.
    await cdp.eval(
      `(function(){var s=document.getElementById('df-hide')||document.createElement('style');
         s.id='df-hide';s.textContent=${JSON.stringify(HIDE_CSS)};document.head.appendChild(s);})()`);
    await cdp.eval(`new Promise(function(r){requestAnimationFrame(function(){requestAnimationFrame(function(){r(true);});});})`, true);
    // Clip below the hidden topbar's reserved band (visibility:hidden keeps its
    // layout height — a black strip atop every shot otherwise).
    const { data } = await cdp.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: false,
      clip: { x: 0, y: CLIP_TOP, width: VIEW_W, height: VIEW_H - CLIP_TOP, scale: 1 },
    });
    return Buffer.from(data, 'base64');
  } catch (e) {
    if (consoleMsgs.length) {
      const errs = consoleMsgs.filter((m) => m.type === 'error').slice(0, 4)
        .map((m) => (m.args || []).map((a) => a.value ?? a.description ?? '').join(' '));
      if (errs.length) log('  page console errors:', errs.join(' | '));
    }
    throw e;
  } finally {
    cdp.onConsole = null;
    await cdp.closeTarget(targetId);
  }
}

// ── per-floor room / footprint stats (from the store) ─────────────────────────
function floorStats(fl) {
  const rooms = Array.isArray(fl.rooms) ? fl.rooms.length : 0;
  const m2 = Math.round((fl.w / 1000) * (fl.d / 1000));
  return { rooms, m2 };
}

// ── page emission ─────────────────────────────────────────────────────────────
function firstLine(notes) {
  const t = String(notes || '').trim();
  return t ? t.split('\n')[0].trim() : '';
}

function planNav(plans, activeId) {
  let s = '<nav class="nav">';
  s += `<a class="nav-link${activeId === '__index' ? ' active' : ''}" href="index.html">All floor plans</a>`;
  for (const p of plans) {
    const active = p.id === activeId ? ' active' : '';
    s += `<a class="nav-link${active}" href="${p.id}.html">${htmlEsc(p.name)}</a>`;
  }
  return s + '</nav>';
}

function imgExists(planId, rel) { return fs.existsSync(path.join(IMG, planId, rel)); }

function writePlanPage(plan, plans, version, date) {
  const store = plan.store;
  const floors = store.floors;
  // Copy the downloadable JSON beside the page.
  fs.copyFileSync(plan.file, path.join(OUT, plan.id + '.json'));

  let main = `<div class="page-head"><h1>${htmlEsc(plan.name)}</h1></div>`;
  main += `<a class="dl-btn" href="${plan.id}.json" download>Download floorplan JSON</a>`;
  main += `<p class="intro">Import it in Diorama under <strong>Settings ▸ Data ▸ Configurations ▸ Import</strong>.</p>`;
  if (store.notes) main += `<div class="plan-notes">${htmlEsc(store.notes)}</div>`;

  floors.forEach((fl, n) => {
    const { rooms, m2 } = floorStats(fl);
    main += `<section class="group"><h2>${htmlEsc(fl.name || ('Floor ' + (n + 1)))}</h2>`;
    main += `<p class="intro">${rooms} room${rooms === 1 ? '' : 's'} · ${m2} m² footprint</p>`;
    main += '<div class="shot-grid">';
    if (imgExists(plan.id, `2d-${n}.png`))
      main += `<figure class="shot"><img loading="lazy" src="img/${plan.id}/2d-${n}.png" alt="${htmlEsc(fl.name)} — 2D plan"><figcaption>2D plan</figcaption></figure>`;
    if (imgExists(plan.id, `iso-${n}.png`))
      main += `<figure class="shot"><img loading="lazy" src="img/${plan.id}/iso-${n}.png" alt="${htmlEsc(fl.name)} — 3D isometric"><figcaption>3D isometric</figcaption></figure>`;
    main += '</section>';
  });

  if (imgExists(plan.id, 'glasshouse.png')) {
    main += `<section class="group"><h2>Glass-house overview</h2>`;
    main += `<figure class="shot"><img loading="lazy" src="img/${plan.id}/glasshouse.png" alt="${htmlEsc(plan.name)} — glass-house overview"><figcaption>All stories at once, other floors translucent.</figcaption></figure>`;
    main += '</section>';
  }

  fs.writeFileSync(path.join(OUT, plan.id + '.html'), sitePage({
    title: plan.name, section: 'floorplans', depth: 1,
    sidebar: planNav(plans, plan.id), main, version, date,
  }));
}

function writeIndexPage(plans, version, date) {
  let main = `<div class="page-head"><h1>Floor plans</h1>`
    + `<p class="intro">A library of complete, importable Diorama configurations — ${plans.length} plan${plans.length === 1 ? '' : 's'}. Download any plan's JSON and import it under Settings ▸ Data ▸ Configurations ▸ Import.</p></div>`;
  main += '<div class="plan-grid">';
  for (const p of plans) {
    const multi = p.store.floors.length > 1;
    const thumbRel = multi && imgExists(p.id, 'glasshouse.png') ? 'glasshouse.png' : '2d-0.png';
    const thumb = imgExists(p.id, thumbRel) ? `img/${p.id}/${thumbRel}`
      : (imgExists(p.id, '2d-0.png') ? `img/${p.id}/2d-0.png` : null);
    const meta = firstLine(p.store.notes);
    main += `<a class="plan-tile" href="${p.id}.html">`;
    if (thumb) main += `<img loading="lazy" src="${thumb}" alt="${htmlEsc(p.name)}">`;
    main += `<div class="plan-tile-body"><span class="plan-tile-title">${htmlEsc(p.name)}</span>`;
    if (meta) main += `<span class="plan-tile-meta">${htmlEsc(meta)}</span>`;
    main += '</div></a>';
  }
  main += '</div>';
  fs.writeFileSync(path.join(OUT, 'index.html'), sitePage({
    title: 'Floor plans', section: 'floorplans', depth: 1,
    sidebar: planNav(plans, '__index'), main, version, date,
  }));
}

function emitPages(plans, version, date) {
  fs.mkdirSync(OUT, { recursive: true });
  writeSharedAssets(SITE_ROOT);
  for (const p of plans) writePlanPage(p, plans, version, date);
  writeIndexPage(plans, version, date);
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  const t0 = Date.now();
  const allPlans = loadPlans();
  if (!allPlans.length) { console.error('[docs-floorplans] no plans found in docs/floorplans/'); process.exit(2); }
  // Pages ALWAYS reflect every committed plan (like the gallery's full catalog);
  // --only restricts CAPTURE, not the emitted library.
  const plans = OPTS.only ? allPlans.filter((p) => p.id === OPTS.only) : allPlans;
  if (OPTS.only && !plans.length) { console.error(`[docs-floorplans] --only ${OPTS.only} matched no plan`); process.exit(2); }
  const version = PKG.version, date = isoDate();

  if (OPTS.pagesOnly) {
    log(`pages-only: ${allPlans.length} plan(s)`);
    emitPages(allPlans, version, date);
    // Report missing imgs (non-fatal — pages still emit, just without those shots).
    let missing = 0;
    for (const p of allPlans) {
      for (let n = 0; n < p.store.floors.length; n++) {
        if (!imgExists(p.id, `2d-${n}.png`)) { missing++; log(`  missing img/${p.id}/2d-${n}.png`); }
        if (!imgExists(p.id, `iso-${n}.png`)) { missing++; log(`  missing img/${p.id}/iso-${n}.png`); }
      }
      if (!imgExists(p.id, 'glasshouse.png')) { missing++; log(`  missing img/${p.id}/glasshouse.png`); }
    }
    console.log('\n──────── floorplans pages-only ────────');
    console.log(`plans: ${allPlans.length}   pages: ${allPlans.length + 1} (+ index)   missing imgs: ${missing}`);
    console.log('FLOORPLANS PAGES-ONLY OK');
    process.exit(0);
  }

  if (OPTS.build) {
    log('building app (npm run build)…');
    const r = spawnSync('npm', ['run', 'build'], { cwd: REPO, stdio: 'inherit' });
    if (r.status !== 0) throw new Error('npm run build failed');
  }
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    throw new Error('dist/index.html missing — run without --no-build');
  }

  const { server, port } = await startServer(DIST);
  const origin = `http://127.0.0.1:${port}`;
  log('serving dist/ →', origin);

  const chrome = await launchChrome(!OPTS.keep ? true : true);   // headless always (GL via swiftshader)
  const cdp = new CDP(chrome.ws);
  await cdp.connect();

  // Build the shot list.
  const shots = [];
  for (const p of plans) {
    const floors = p.store.floors;
    floors.forEach((fl, n) => {
      const base = { origin, planId: p.id, planName: p.name };
      // 2D per floor.
      shots.push({
        ...base, kind: '2d', floorIdx: n, out: `2d-${n}.png`, is3d: false, cam: null,
        body: displayBody(p.store, { currentFloorId: fl.id }),
      });
      // 3D iso per floor.
      shots.push({
        ...base, kind: 'iso', floorIdx: n, out: `iso-${n}.png`, is3d: true,
        cam: isoCam(fl.w, fl.d).map((v) => Math.round(v)),
        body: displayBody(p.store, { currentFloorId: fl.id }),
      });
    });
    // Glass-house overview (one per plan, topmost floor active).
    const topFloor = floors[floors.length - 1];
    shots.push({
      origin, planId: p.id, planName: p.name, kind: 'glass', out: 'glasshouse.png', is3d: true,
      cam: glassCam(floors, topFloor).map((v) => Math.round(v)),
      body: displayBody(p.store, {
        currentFloorId: topFloor.id, scene3d: { ...(p.store.scene3d || {}), glassHouse: true },
      }),
    });
  }

  const results = { captured: [], skipped: [], failed: [] };
  let idx = 0;
  for (const s of shots) {
    idx++;
    const dest = path.join(IMG, s.planId, s.out);
    if (!OPTS.force && fs.existsSync(dest)) { results.skipped.push(s); continue; }
    const tag = `[${idx}/${shots.length}] ${s.planId}/${s.out}`;
    try {
      const buf = await shoot(cdp, s);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
      results.captured.push({ s, bytes: buf.length });
      log(`${tag} → ${(buf.length / 1024).toFixed(0)} KB`);
    } catch (e) {
      results.failed.push({ s, error: String(e.message || e) });
      log(`${tag} FAILED: ${e.message || e}`);
    }
  }

  // Teardown.
  cdp.close();
  chrome.proc.kill('SIGKILL');
  server.close();
  if (!OPTS.keep) { try { fs.rmSync(chrome.userDir, { recursive: true, force: true }); } catch { /* ignore */ } }

  // Emit pages for EVERY plan (reflecting whatever imgs now exist on disk).
  emitPages(allPlans, version, date);

  const cap = results.captured.length, sk = results.skipped.length, fa = results.failed.length;
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n──────── docs-floorplans summary ────────');
  console.log(`captured: ${cap}   skipped(existing): ${sk}   failed: ${fa}   of ${shots.length} shots  (${secs}s)`);
  if (results.captured.length) {
    const small = results.captured.filter((r) => r.bytes < 20 * 1024);
    if (small.length) {
      console.log('WARNING — shots under 20 KB (possibly blank):');
      for (const r of small) console.log(`  - ${r.s.planId}/${r.s.out} = ${(r.bytes / 1024).toFixed(1)} KB`);
    }
  }
  if (results.failed.length) {
    console.log('failures:');
    for (const f of results.failed) console.log(`  - ${f.s.planId}/${f.s.out}  ${f.error}`);
  }
  console.log(`pages: ${allPlans.length + 1} (${allPlans.length} plan + index)  → docs-site/floorplans/`);
  process.exit(fa > 0 ? 1 : 0);
}

main().catch((e) => { console.error('[docs-floorplans] FATAL', e); process.exit(2); });
