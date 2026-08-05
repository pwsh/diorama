#!/usr/bin/env node
// Docs-gallery driver — one command regenerates the whole local documentation
// site with a per-model animated GIF for every enumerable subject.
//
//   node scripts/docs-gallery/generate.mjs [flags]
//
// Flags:
//   --no-build        skip `npm run build` (reuse existing dist/)
//   --pages-only      regenerate ONLY the pages (markdown + HTML) from existing media
//                     and the cached catalog (docs-site/.catalog.json); no build, no
//                     browser, no capture. Verifies every referenced GIF exists on disk
//                     and exits nonzero if any reference is broken.
//   --only <sel>      only subjects whose page, packId, type, or id starts with <sel>
//   --limit <N>       cap subjects PER PAGE at N (after --only)
//   --fps <N>         GIF frame rate (default per-subject; overrides all)
//   --size <N>        GIF pixel size (square; default per-subject)
//   --render-px <N>   off-screen render resolution (default 480; downscaled to size)
//   --force           re-capture even if the GIF already exists
//   --smoke           curated cross-section (≥1 of each hard type) + assertion mode;
//                     verifies each GIF is GIF89a, >10 KB, >4 frames
//   --keep-serve      don't delete the temp serve dir on exit (debugging)
//
// No runtime deps: static server + CDP client use Node built-ins (global fetch +
// WebSocket, present in Node ≥ 22). Bundling uses the devDep esbuild binary;
// gifenc is bundled into the capture chunk (never into dist). Output is gitignored
// (docs-site/) by design — see docs/GALLERY.md.

import { spawnSync } from 'node:child_process';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { sitePage, writeSharedAssets } from '../docs-site/shell.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const DIST = path.join(REPO, 'dist');
const SITE_ROOT = path.join(REPO, 'docs-site');
// The model gallery is a SECTION of the unified docs site, living under
// docs-site/models/. GIFs (media/) + the catalog cache move with it; the site
// root (docs-site/) is owned by the home page + guide + floorplans + shared
// assets/site.css.
const OUT = path.join(SITE_ROOT, 'models');
const ESBUILD = path.join(REPO, 'node_modules', '.bin', 'esbuild');
const CATALOG_CACHE = path.join(OUT, '.catalog.json');
const PKG = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'));

// ── args ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const val = (n, d) => { const i = argv.indexOf(n); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d; };
const OPTS = {
  build: !flag('--no-build'),
  pagesOnly: flag('--pages-only'),
  only: val('--only', null),
  limit: val('--limit', null) != null ? parseInt(val('--limit'), 10) : null,
  fps: val('--fps', null) != null ? parseInt(val('--fps'), 10) : null,
  size: val('--size', null) != null ? parseInt(val('--size'), 10) : null,
  renderPx: parseInt(val('--render-px', '480'), 10),
  force: flag('--force'),
  smoke: flag('--smoke'),
  keepServe: flag('--keep-serve'),
};

const log = (...a) => console.log('[docs-gallery]', ...a);

// One-time relocation: the gallery used to emit at the docs-site/ ROOT. Now it
// lives under docs-site/models/. On any run, move legacy root-level GIF dir(s) +
// the catalog cache under models/, and delete the stale root gallery pages
// (root index.html is now owned by the home page; docs-site/avatars/ was
// entirely gallery-owned). GIF references inside the catalog are relative
// (media/…) so this is a directory move — no GIF regen. Idempotent.
function relocateLegacy() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const dirName of ['media', 'gifs']) {
    const legacy = path.join(SITE_ROOT, dirName);
    const dest = path.join(OUT, dirName);
    if (fs.existsSync(legacy) && !fs.existsSync(dest)) {
      fs.renameSync(legacy, dest);
      log(`relocated ${dirName}/ → models/${dirName}/`);
    }
  }
  const legacyCat = path.join(SITE_ROOT, '.catalog.json');
  if (fs.existsSync(legacyCat) && !fs.existsSync(CATALOG_CACHE)) {
    fs.renameSync(legacyCat, CATALOG_CACHE);
    log('relocated .catalog.json → models/.catalog.json');
  }
  const legacyAvatars = path.join(SITE_ROOT, 'avatars');
  if (fs.existsSync(legacyAvatars)) {
    fs.rmSync(legacyAvatars, { recursive: true, force: true });
    log('removed stale docs-site/avatars/');
  }
  // Delete stale root-level gallery pages, precisely: .md pages carry the
  // gallery generator header; .html pages carry the "Diorama Model Gallery"
  // title. Neither marker appears in the home page or floorplan pages.
  for (const e of fs.readdirSync(SITE_ROOT, { withFileTypes: true })) {
    if (!e.isFile()) continue;
    const full = path.join(SITE_ROOT, e.name);
    if (e.name.endsWith('.md')) {
      if (fs.readFileSync(full, 'utf8').includes('scripts/docs-gallery/generate.mjs')) fs.unlinkSync(full);
    } else if (e.name.endsWith('.html')) {
      if (fs.readFileSync(full, 'utf8').includes('Diorama Model Gallery')) fs.unlinkSync(full);
    }
  }
}

// ── minimal static file server ──────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.map': 'application/json', '.json': 'application/json', '.css': 'text/css',
  '.gif': 'image/gif', '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm',
};
function startServer(root) {
  const server = http.createServer((req, res) => {
    try {
      const url = decodeURIComponent(req.url.split('?')[0]);   // strip ?v= chunk-pin queries
      let file = path.join(root, url === '/' ? '/capture.html' : url);
      if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

// ── minimal CDP client (browser ws + flatten sessions) ────────────────────────────
async function findChrome() {
  const cands = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome'];
  for (const c of cands) {
    const r = spawnSync('which', [c], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  throw new Error('no chromium/google-chrome found on PATH');
}
async function launchChrome(pageUrl) {
  const bin = await findChrome();
  const port = 9200 + Math.floor(Math.random() * 700);
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dg-chrome-'));
  const args = [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`,
    '--no-sandbox', '--disable-gpu-sandbox', '--hide-scrollbars', '--mute-audio',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    // Software WebGL so headless has a GL context.
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--window-size=520,520', pageUrl,
  ];
  const proc = spawn(bin, args, { stdio: 'ignore' });
  // Wait for the devtools endpoint.
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

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

class CDP {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 0; this.pending = new Map(); this.sessionId = null; }
  async connect() {
    this.sock = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => { this.sock.onopen = res; this.sock.onerror = rej; });
    this.sock.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
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
  async attachPage(pageUrl) {
    const { targetId } = await this.send('Target.createTarget', { url: pageUrl }, false);
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true }, false);
    this.sessionId = sessionId;
    await this.send('Runtime.enable');
    await this.send('Page.enable');
  }
  async eval(expression, awaitPromise = false) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, allowUnsafeEvalBlocking: true });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error(d.exception?.description || d.text || 'eval error');
    }
    return r.result?.value;
  }
  close() { try { this.sock.close(); } catch { /* ignore */ } }
}

// ── GIF sanity (magic + frame count) ─────────────────────────────────────────────
function inspectGif(buf) {
  const magic = buf.slice(0, 6).toString('latin1');
  const ok = magic === 'GIF89a' || magic === 'GIF87a';
  // gifenc writes a Graphic Control Extension (21 F9 04) per frame.
  let frames = 0;
  for (let i = 0; i + 2 < buf.length; i++) {
    if (buf[i] === 0x21 && buf[i + 1] === 0xF9 && buf[i + 2] === 0x04) frames++;
  }
  return { ok, magic, frames, bytes: buf.length };
}

// ── markdown generation ───────────────────────────────────────────────────────────
const PAGE_TITLE = {
  furniture: 'Furniture', appliances: 'Appliances', bathroom: 'Bathroom', outdoor: 'Outdoor & yard',
  theater: 'Home theater', vehicle: 'Vehicle / garage', 'vehicle-models': 'Vehicle models',
  lighting: 'Lighting', 'switches-controls': 'Switches & controls', sensors: 'Sensors',
  'doors-windows': 'Doors & windows', robots: 'Robots',
};
const PAGE_INTRO = {
  furniture: 'General furniture kinds. Each is a 360° turntable of the default-size 3D piece.',
  appliances: 'Appliance kinds — fixed 3/4 view; the door opens then closes and the in-use LED / screen is lit.',
  bathroom: 'Bathroom fixtures. 360° turntable of the default-size 3D piece.',
  outdoor: 'Outdoor & yard pieces. 360° turntable of the default-size 3D piece.',
  theater: 'Home-theater seating and speakers. 360° turntable of the default-size 3D piece.',
  vehicle: 'Garage vehicle and EV-charging pieces. 360° turntable of the default-size 3D piece.',
  'vehicle-models': 'Ground vehicles from the vehicle model packs — place them like any furniture piece from the toolbar\'s Vehicles tab. Load and activate packs in Settings ▸ Vehicles; the Fiction pack is opt-in and ships unloaded. 360° turntable of each model at its real size. (The aircraft and space packs are sky props — they fly as banner tow craft and as live-flight skins, so they are not in this gallery.)',
  lighting: 'Light-fixture icon kinds in a corner environment: off → on → color sweep → dim → off (fireplace flickers).',
  'switches-controls': 'Wall controls: switch plate, alarm keypad, and door lock — each cycling its states.',
  sensors: 'Presence, environment, safety, and bin sensors — each showing its live-state animation.',
  'doors-windows': 'Door kinds and window glazing styles, opening then closing.',
  robots: 'Robot vacuum and lawn mower — dock plus a roaming rig cycling LED states.',
};
function pageTitleFor(page) {
  if (page.startsWith('avatars/')) return 'Avatars · ' + cap(page.slice('avatars/'.length).replace(/-/g, ' '));
  return PAGE_TITLE[page] || cap(page.replace(/-/g, ' '));
}
function cap(s) { return s.replace(/\b\w/g, (c) => c.toUpperCase()); }
const GEN_HEADER = '<!-- GENERATED by scripts/docs-gallery/generate.mjs — DO NOT EDIT BY HAND. Re-run `npm run docs:gallery`. -->\n';

function relGif(page, gif) {
  const depth = (page.match(/\//g) || []).length;
  return '../'.repeat(depth) + gif;
}
function mdTable(page, subs) {
  let s = '| Preview | Model | Details |\n|---|---|---|\n';
  for (const su of subs) {
    const img = `![${su.label}](${relGif(page, su.gif)})`;
    s += `| ${img} | **${esc(su.label)}**<br>\`${esc(su.id)}\` | ${esc(su.notes || '')} |\n`;
  }
  return s + '\n';
}
function esc(s) { return String(s).replace(/\|/g, '\\|'); }

function writeMarkdown(subjects) {
  // Group subjects by page, then by `group`.
  const byPage = new Map();
  for (const su of subjects) {
    if (!byPage.has(su.page)) byPage.set(su.page, []);
    byPage.get(su.page).push(su);
  }
  const pages = [...byPage.keys()];
  const topPages = pages.filter((p) => !p.startsWith('avatars/')).sort();
  const avatarPages = pages.filter((p) => p.startsWith('avatars/')).sort();

  for (const page of pages) {
    const subs = byPage.get(page);
    const file = path.join(OUT, page + '.md');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    let md = GEN_HEADER + `\n# ${pageTitleFor(page)}\n\n`;
    if (PAGE_INTRO[page]) md += PAGE_INTRO[page] + '\n\n';
    else if (page.startsWith('avatars/')) md += 'Avatar rigs, grouped by pack. Idle rig with a 360° camera orbit; personality bubble shown.\n\n';
    // Group ordering: preserve first-seen order of `group`.
    const groups = [];
    const seen = new Set();
    for (const su of subs) { if (!seen.has(su.group)) { seen.add(su.group); groups.push(su.group); } }
    for (const g of groups) {
      md += `## ${g}\n\n`;
      md += mdTable(page, subs.filter((s) => s.group === g));
    }
    fs.writeFileSync(file, md);
  }

  // Avatars index.
  if (avatarPages.length) {
    let md = GEN_HEADER + '\n# Avatars\n\nAvatar packs by top-level group.\n\n';
    for (const p of avatarPages) md += `- [${pageTitleFor(p)}](${p.slice('avatars/'.length)}.md)\n`;
    fs.mkdirSync(path.join(OUT, 'avatars'), { recursive: true });
    fs.writeFileSync(path.join(OUT, 'avatars', 'index.md'), md);
  }

  // Root TOC.
  let idx = GEN_HEADER + '\n# Diorama model gallery\n\nAuto-generated catalog of every documentable model, with an animated preview GIF each. Regenerate with `npm run docs:gallery`.\n\n## Pages\n\n';
  for (const p of topPages) idx += `- [${pageTitleFor(p)}](${p}.md)\n`;
  if (avatarPages.length) idx += `- [Avatars](avatars/index.md)\n`;
  fs.writeFileSync(path.join(OUT, 'index.md'), idx);
}

// ── HTML site generation ──────────────────────────────────────────────────────────
// Emits a self-contained static site alongside the markdown: index.html, one
// <page>.html per category page, avatars/index.html + one avatars/<group>.html per
// pack group, and a single shared assets/site.css (dark editor-vibe theme). No
// external fonts / CDNs / JS frameworks — a few lines of vanilla JS drive the mobile
// nav toggle. GIFs lazy-load (~710 of them). Every card carries an anchor id.

let NAV_TOP = [];   // sorted top-level page keys (set by writeHtml)
let NAV_AV = [];    // sorted avatar page keys ('avatars/<group>')

function htmlEsc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
// Card anchor id — unique within a page (avatar ids carry a '/').
function anchorId(su) {
  return 'm-' + String(su.id).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}
function avatarShortTitle(page) { return pageTitleFor(page).replace(/^Avatars · /, ''); }

function navLink(prefix, page, label, current, extraCls = '') {
  const href = prefix + (page === 'index' ? 'index.html' : page + '.html');
  const active = page === current ? ' active' : '';
  const cls = ('nav-link ' + extraCls).trim();
  return `<a class="${cls}${active}" href="${href}">${htmlEsc(label)}</a>`;
}
function renderNav(current, prefix) {
  let s = '<nav class="nav">';
  for (const p of NAV_TOP) s += navLink(prefix, p, pageTitleFor(p), current);
  const avActive = current === 'avatars/index' || current.startsWith('avatars/');
  s += `<div class="nav-group${avActive ? ' open' : ''}">`;
  s += navLink(prefix, 'avatars/index', 'Avatars', current, 'nav-group-head');
  s += '<div class="nav-sub">';
  for (const p of NAV_AV) s += navLink(prefix, p, avatarShortTitle(p), current);
  s += '</div></div>';
  return s + '</nav>';
}
// Wrap a gallery page in the shared site shell. `current`/`navPrefix` drive the
// gallery's OWN sidebar (renderNav), which lives WITHIN the models/ subtree —
// its prefix counts directory depth below models/ (0 for top pages, 1 for
// avatars/*). The shell's `depth` is the page's depth below the SITE root, one
// level deeper because everything sits under models/. GIF hrefs stay relative
// within models/ (media/…), so they need no site-depth adjustment.
function galleryPage({ current, title, pageDepth, bodyMain, version, date }) {
  return sitePage({
    title, section: 'models', depth: 1 + pageDepth,
    sidebar: renderNav(current, '../'.repeat(pageDepth)),
    main: bodyMain, version, date,
  });
}
// Types whose `su.id` is a FurnitureKind (furniture/appliance/bin) or a
// LightIconKind (light) — the kinds ?model=<kind> renders as a single scratch
// piece. Others (avatars/sensors/doors/robots/…) get no demo link (the app would
// only fall back to a random home, which reads as broken).
const MODEL_DEMO_TYPES = new Set(['furniture', 'appliance', 'bin', 'light']);

// `demoPrefix` reaches the site-root demo/ page from this model page (one level
// up from the gallery prefix, which is relative WITHIN models/).
function renderCard(su, gifHref, demoPrefix) {
  const id = anchorId(su);
  const demo = MODEL_DEMO_TYPES.has(su.type)
    ? `<a class="demo-btn card-demo" href="${htmlEsc(demoPrefix)}?model=${encodeURIComponent(su.id)}">▶ View in demo</a>`
    : '';
  return `<article class="card" id="${id}">`
    + `<a class="card-img" href="#${id}"><img loading="lazy" src="${htmlEsc(gifHref)}" alt="${htmlEsc(su.label)}" width="240" height="240"></a>`
    + `<div class="card-body">`
    + `<div class="card-label">${htmlEsc(su.label)}</div>`
    + `<code class="card-id">${htmlEsc(su.id)}</code>`
    + (su.notes ? `<div class="card-notes">${htmlEsc(su.notes)}</div>` : '')
    + demo
    + `</div></article>`;
}

function writeHtml(subjects, version, date) {
  const byPage = new Map();
  for (const su of subjects) {
    if (!byPage.has(su.page)) byPage.set(su.page, []);
    byPage.get(su.page).push(su);
  }
  const pages = [...byPage.keys()];
  NAV_TOP = pages.filter((p) => !p.startsWith('avatars/')).sort();
  NAV_AV = pages.filter((p) => p.startsWith('avatars/')).sort();

  // Shared stylesheet lives at the SITE root (docs-site/assets/site.css) and is
  // shared with the home page + guide + floorplans.
  writeSharedAssets(SITE_ROOT);

  // Content pages (top-level categories + avatar group pages).
  for (const page of pages) {
    const subs = byPage.get(page);
    const pageDepth = (page.match(/\//g) || []).length;
    const prefix = '../'.repeat(pageDepth);
    // Site-root demo/ is one level above the gallery's own models/ subtree.
    const demoPrefix = '../'.repeat(pageDepth + 1) + 'demo/index.html';
    const groups = [];
    const seen = new Set();
    for (const su of subs) { if (!seen.has(su.group)) { seen.add(su.group); groups.push(su.group); } }
    let main = `<div class="page-head"><h1>${htmlEsc(pageTitleFor(page))}</h1>`;
    const intro = PAGE_INTRO[page]
      || (page.startsWith('avatars/') ? 'Avatar rigs, grouped by pack. Idle rig with a 360° camera orbit; personality bubble shown.' : '');
    if (intro) main += `<p class="intro">${htmlEsc(intro)}</p>`;
    main += '</div>';
    for (const g of groups) {
      main += `<section class="group"><h2>${htmlEsc(g)}</h2><div class="grid">`;
      for (const su of subs.filter((s) => s.group === g)) main += renderCard(su, prefix + su.gif, demoPrefix);
      main += '</div></section>';
    }
    const file = path.join(OUT, page + '.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, galleryPage({ current: page, title: pageTitleFor(page), pageDepth, bodyMain: main, version, date }));
  }

  // Avatars index.
  if (NAV_AV.length) {
    let main = '<div class="page-head"><h1>Avatars</h1><p class="intro">Avatar packs by top-level group.</p></div>';
    main += '<section class="group"><h2>Packs</h2><div class="index-grid">';
    for (const p of NAV_AV) {
      const n = byPage.get(p).length;
      main += `<a class="tile" href="${p.slice('avatars/'.length)}.html"><span class="tile-title">${htmlEsc(avatarShortTitle(p))}</span><span class="tile-count">${n} model${n === 1 ? '' : 's'}</span></a>`;
    }
    main += '</div></section>';
    fs.mkdirSync(path.join(OUT, 'avatars'), { recursive: true });
    fs.writeFileSync(path.join(OUT, 'avatars', 'index.html'),
      galleryPage({ current: 'avatars/index', title: 'Avatars', pageDepth: 1, bodyMain: main, version, date }));
  }

  // Root index.
  const total = subjects.length;
  let main = `<div class="page-head"><h1>Diorama model gallery</h1>`
    + `<p class="intro">Auto-generated catalog of every documentable model, with an animated preview GIF each — ${total} models across ${NAV_TOP.length + (NAV_AV.length ? 1 : 0)} pages.</p></div>`;
  main += '<section class="group"><h2>Pages</h2><div class="index-grid">';
  for (const p of NAV_TOP) {
    const n = byPage.get(p).length;
    main += `<a class="tile" href="${p}.html"><span class="tile-title">${htmlEsc(pageTitleFor(p))}</span><span class="tile-count">${n} model${n === 1 ? '' : 's'}</span></a>`;
  }
  if (NAV_AV.length) {
    const n = NAV_AV.reduce((a, p) => a + byPage.get(p).length, 0);
    main += `<a class="tile" href="avatars/index.html"><span class="tile-title">Avatars</span><span class="tile-count">${n} models · ${NAV_AV.length} packs</span></a>`;
  }
  main += '</div></section>';
  fs.writeFileSync(path.join(OUT, 'index.html'),
    galleryPage({ current: 'index', title: 'Model gallery', pageDepth: 0, bodyMain: main, version, date }));
}

// Verify every referenced GIF exists on disk. Returns { broken: [{id, gif}], checked }.
function verifyRefs(subjects) {
  const broken = [];
  for (const su of subjects) {
    if (!fs.existsSync(path.join(OUT, su.gif))) broken.push({ id: su.id, page: su.page, gif: su.gif });
  }
  return { broken, checked: subjects.length };
}

// ── hand-maintained-list guard ─────────────────────────────────────────────────
// capture-main.ts's LIGHT_KINDS array and its safety / door / window kind loops
// are hand-typed lists that are supposed to mirror src/types.ts's
// `LightIconKind` / `SafetyKind` / `DoorKind` / `WindowKind` unions, but
// capture-main.ts is NEVER type-checked: it lives outside
// tsconfig.json's `include: ["src"]`, and esbuild (its only compile step, run
// below) transpiles TS syntax without verifying types at all. So a future kind
// added to either union with no matching row in capture-main.ts would silently
// under-document itself forever — no `npm run typecheck`, no build, no test
// suite would ever catch it. Cross-check the CAPTURED catalog's subject counts
// against the real union member count parsed straight out of src/types.ts (the
// actual source of truth) so a mismatch fails the run loudly instead.
function countTypeUnionMembers(typeName) {
  const src = fs.readFileSync(path.join(REPO, 'src', 'types.ts'), 'utf8');
  const m = src.match(new RegExp(`export type ${typeName}\\s*=([\\s\\S]*?);`));
  if (!m) throw new Error(`hand-maintained-list guard: could not locate "export type ${typeName}" in src/types.ts`);
  const members = new Set((m[1].match(/'[^']+'/g) || []).map((s) => s.slice(1, -1)));
  if (members.size === 0) throw new Error(`hand-maintained-list guard: parsed zero members for ${typeName} — regex out of sync with src/types.ts?`);
  return members.size;
}
function verifyHandMaintainedLists(subjects) {
  const checks = [
    { subjectType: 'light', typeName: 'LightIconKind' },
    { subjectType: 'safety', typeName: 'SafetyKind' },
    // The doors + windows page enumerates its kinds by hand too — same guard,
    // so adding a DoorKind / WindowKind without a capture subject fails loudly
    // instead of silently shipping a gallery page missing the new kind.
    { subjectType: 'door', typeName: 'DoorKind' },
    { subjectType: 'window', typeName: 'WindowKind' },
  ];
  for (const { subjectType, typeName } of checks) {
    const expected = countTypeUnionMembers(typeName);
    const got = subjects.filter((s) => s.type === subjectType).length;
    if (got !== expected) {
      throw new Error(
        `hand-maintained-list guard FAILED: catalog has ${got} '${subjectType}' subject(s) but ` +
        `src/types.ts's ${typeName} union has ${expected} member(s) — a kind was added to (or ` +
        `removed from) the type without updating scripts/docs-gallery/capture-main.ts, or vice versa.`);
    }
    log(`hand-maintained-list guard OK: ${subjectType} (${typeName}) = ${got}`);
  }
}

// ── smoke subset ──────────────────────────────────────────────────────────────────
function smokeSelect(subjects) {
  const pick = [];
  const take = (pred) => { const s = subjects.find(pred); if (s) pick.push(s); };
  // ≥1 avatar humanoid + 1 quadruped + 1 hover.
  take((s) => s.type === 'avatar' && s.rig === 'humanoid');
  take((s) => s.type === 'avatar' && s.rig === 'quadruped');
  const hover = subjects.find((s) => s.type === 'avatar' && s.id === 'astronaut')
    || subjects.find((s) => s.type === 'avatar' && /ghost|hover|drone/.test(s.id));
  if (hover) pick.push(hover);
  // 2 furniture, 1 appliance (fridge), 2 lights (bulb + fireplace), 1 switch,
  // 1 alarm, 1 safety, 1 door, 1 robot.
  const furns = subjects.filter((s) => s.type === 'furniture').slice(0, 2);
  pick.push(...furns);
  take((s) => s.type === 'appliance' && s.id === 'fridge');
  take((s) => s.type === 'light' && s.id === 'bulb');
  take((s) => s.type === 'light' && s.id === 'fireplace');
  take((s) => s.type === 'switch');
  take((s) => s.type === 'alarm');
  take((s) => s.type === 'safety');
  take((s) => s.type === 'door');
  take((s) => s.type === 'robot');
  // de-dupe by gif
  const seen = new Set();
  return pick.filter((s) => s && !seen.has(s.gif) && seen.add(s.gif));
}

// ── capture one subject over CDP (chunked base64) ────────────────────────────────
async function captureOne(cdp, su) {
  const opts = {};
  if (OPTS.fps != null) opts.fps = OPTS.fps;
  if (OPTS.size != null) opts.size = OPTS.size;
  const meta = await cdp.eval(
    `window.dgCapture(${JSON.stringify(su)}, ${JSON.stringify(opts)})`, true);
  const len = meta.len;
  const CH = 512 * 1024;
  let b64 = '';
  for (let off = 0; off < len; off += CH) {
    b64 += await cdp.eval(`window.__dgChunk(${off}, ${CH})`);
  }
  return Buffer.from(b64, 'base64');
}

// ── main ────────────────────────────────────────────────────────────────────────
function isoDate(d = new Date()) { return d.toISOString().slice(0, 10); }

// Regenerate ONLY the pages (markdown + HTML) from the cached catalog + existing media.
function pagesOnly() {
  relocateLegacy();
  if (!fs.existsSync(CATALOG_CACHE)) {
    console.error(`[docs-gallery] no cached catalog at ${CATALOG_CACHE}\n` +
      '  Run a full/partial capture first (npm run docs:gallery) — it persists the catalog.');
    process.exit(2);
  }
  const cached = JSON.parse(fs.readFileSync(CATALOG_CACHE, 'utf8'));
  const subjects = cached.subjects || [];
  const version = cached.version || PKG.version;
  const date = cached.generatedAt ? cached.generatedAt.slice(0, 10) : isoDate();
  log(`pages-only: ${subjects.length} subjects from cached catalog (captured ${date}, v${version})`);
  verifyHandMaintainedLists(subjects);
  writeMarkdown(subjects);
  writeHtml(subjects, version, date);

  const mdPages = new Set(subjects.map((s) => s.page)).size;
  const htmlPages = mdPages + 2; // + avatars/index + root index
  const { broken, checked } = verifyRefs(subjects);
  console.log('\n──────── pages-only summary ────────');
  console.log(`markdown pages: ${mdPages + 2} (incl. avatars/index + root index)`);
  console.log(`html pages:     ${htmlPages}  + assets/site.css`);
  console.log(`gif refs checked: ${checked}   broken: ${broken.length}`);
  if (broken.length) {
    console.log('BROKEN REFERENCES (missing GIF on disk):');
    for (const b of broken.slice(0, 40)) console.log(`  - ${b.page}:${b.id}  →  ${b.gif}`);
    if (broken.length > 40) console.log(`  … and ${broken.length - 40} more`);
    console.log('PAGES-ONLY FAIL');
    process.exit(1);
  }
  console.log('PAGES-ONLY PASS');
  process.exit(0);
}

async function main() {
  const t0 = Date.now();
  if (OPTS.pagesOnly) { pagesOnly(); return; }
  relocateLegacy();
  if (OPTS.build) {
    log('building app (npm run build)…');
    const r = spawnSync('npm', ['run', 'build'], { cwd: REPO, stdio: 'inherit' });
    if (r.status !== 0) throw new Error('npm run build failed');
  }
  if (!fs.existsSync(path.join(DIST, 'assets', 'three-renderer.js'))) {
    throw new Error('dist/assets/three-renderer.js missing — run without --no-build');
  }

  // Prepare serve dir: dist + capture bundle + capture.html.
  const serve = fs.mkdtempSync(path.join(os.tmpdir(), 'dg-serve-'));
  copyDir(DIST, serve);
  log('bundling capture-main.ts…');
  const eb = spawnSync(ESBUILD, [
    path.join(__dirname, 'capture-main.ts'), '--bundle', '--format=esm',
    `--outfile=${path.join(serve, 'capture-main.js')}`,
  ], { cwd: REPO, stdio: 'inherit' });
  if (eb.status !== 0) throw new Error('esbuild capture bundle failed');
  fs.copyFileSync(path.join(__dirname, 'capture.html'), path.join(serve, 'capture.html'));

  const { server, port } = await startServer(serve);
  const pageUrl = `http://127.0.0.1:${port}/capture.html`;
  log('serve dir', serve, '→', pageUrl);

  const chrome = await launchChrome(pageUrl);
  const cdp = new CDP(chrome.ws);
  await cdp.connect();
  await cdp.attachPage(pageUrl);

  // Wait for the harness to be live, then push the render resolution and pull the catalog.
  for (let i = 0; i < 200; i++) {
    const ready = await cdp.eval('typeof window.dgCatalog === "function"');
    if (ready) break;
    await sleep(100);
  }
  await cdp.eval(`window.__DG_RENDER_PX = ${OPTS.renderPx}`);
  log('loading catalog (registering all avatar packs)…');
  const catalog = await cdp.eval('window.dgCatalog()', true);
  let subjects = catalog.subjects;
  log(`catalog: ${subjects.length} subjects across ${new Set(subjects.map((s) => s.page)).size} pages`);
  verifyHandMaintainedLists(subjects);

  // Markdown + HTML always reflect the FULL catalog (generated docs stay complete
  // even on a partial capture run). Persist the catalog so `--pages-only` can
  // rebuild the pages later without a browser/capture pass.
  fs.mkdirSync(OUT, { recursive: true });
  const genDate = isoDate();
  fs.writeFileSync(CATALOG_CACHE, JSON.stringify(
    { version: PKG.version, generatedAt: new Date().toISOString(), subjects }, null, 0));
  writeMarkdown(subjects);
  writeHtml(subjects, PKG.version, genDate);

  // Select which subjects to CAPTURE this run.
  let toCapture = subjects;
  if (OPTS.smoke) toCapture = smokeSelect(subjects);
  else {
    if (OPTS.only) toCapture = toCapture.filter((s) =>
      s.page.startsWith(OPTS.only) || (s.packId || '').startsWith(OPTS.only) ||
      s.type.startsWith(OPTS.only) || s.id.startsWith(OPTS.only));
    if (OPTS.limit != null) {
      const perPage = new Map();
      toCapture = toCapture.filter((s) => {
        const n = perPage.get(s.page) || 0;
        if (n >= OPTS.limit) return false;
        perPage.set(s.page, n + 1); return true;
      });
    }
  }

  const results = { captured: [], skipped: [], failed: [] };
  let idx = 0;
  for (const su of toCapture) {
    idx++;
    const dest = path.join(OUT, su.gif);
    if (!OPTS.force && !OPTS.smoke && fs.existsSync(dest)) { results.skipped.push(su); continue; }
    const tag = `[${idx}/${toCapture.length}] ${su.type}:${su.id}`;
    try {
      const buf = await captureOne(cdp, su);
      const info = inspectGif(buf);
      if (OPTS.smoke) {
        if (!info.ok) throw new Error(`bad magic ${info.magic}`);
        if (info.bytes <= 10 * 1024) throw new Error(`too small ${info.bytes}B`);
        if (info.frames <= 4) throw new Error(`too few frames ${info.frames}`);
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
      results.captured.push({ su, info });
      log(`${tag} → ${(info.bytes / 1024).toFixed(0)} KB, ${info.frames} frames`);
    } catch (e) {
      results.failed.push({ su, error: String(e.message || e) });
      log(`${tag} FAILED: ${e.message || e}`);
    }
  }

  // Teardown.
  cdp.close();
  chrome.proc.kill('SIGKILL');
  server.close();
  try { fs.rmSync(chrome.userDir, { recursive: true, force: true }); } catch { /* ignore */ }
  if (!OPTS.keepServe) { try { fs.rmSync(serve, { recursive: true, force: true }); } catch { /* ignore */ } }

  // Summary.
  const total = toCapture.length;
  const cap = results.captured.length, sk = results.skipped.length, fa = results.failed.length;
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n──────── docs-gallery summary ────────');
  console.log(`captured: ${cap}   skipped(existing): ${sk}   failed: ${fa}   of ${total} selected  (${secs}s)`);
  if (results.captured.length) {
    const sizes = results.captured.slice(0, 6).map((r) => `${r.su.id}=${(r.info.bytes / 1024).toFixed(0)}KB/${r.info.frames}f`);
    console.log('samples:', sizes.join('  '));
  }
  if (results.failed.length) {
    console.log('failures:');
    for (const f of results.failed) console.log(`  - ${f.su.type}:${f.su.id}  ${f.error}`);
  }
  const attempted = cap + fa;
  const failRate = attempted ? fa / attempted : 0;
  if (OPTS.smoke) {
    console.log(fa === 0 ? 'SMOKE PASS' : 'SMOKE FAIL');
    process.exit(fa === 0 ? 0 : 1);
  }
  process.exit(failRate > 0.05 ? 1 : 0);
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

main().catch((e) => { console.error('[docs-gallery] FATAL', e); process.exit(2); });
