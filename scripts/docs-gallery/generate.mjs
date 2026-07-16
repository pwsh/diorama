#!/usr/bin/env node
// Docs-gallery driver — one command regenerates the whole local documentation
// site with a per-model animated GIF for every enumerable subject.
//
//   node scripts/docs-gallery/generate.mjs [flags]
//
// Flags:
//   --no-build        skip `npm run build` (reuse existing dist/)
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const DIST = path.join(REPO, 'dist');
const OUT = path.join(REPO, 'docs-site');
const ESBUILD = path.join(REPO, 'node_modules', '.bin', 'esbuild');

// ── args ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const val = (n, d) => { const i = argv.indexOf(n); return i >= 0 && i + 1 < argv.length ? argv[i + 1] : d; };
const OPTS = {
  build: !flag('--no-build'),
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
  lighting: 'Lighting', 'switches-controls': 'Switches & controls', sensors: 'Sensors',
  'doors-windows': 'Doors & windows', robots: 'Robots',
};
const PAGE_INTRO = {
  furniture: 'General furniture kinds. Each is a 360° turntable of the default-size 3D piece.',
  appliances: 'Appliance kinds — fixed 3/4 view; the door opens then closes and the in-use LED / screen is lit.',
  bathroom: 'Bathroom fixtures. 360° turntable of the default-size 3D piece.',
  outdoor: 'Outdoor & yard pieces. 360° turntable of the default-size 3D piece.',
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
async function main() {
  const t0 = Date.now();
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

  // Markdown always reflects the FULL catalog (generated docs stay complete even
  // on a partial capture run).
  fs.mkdirSync(OUT, { recursive: true });
  writeMarkdown(subjects);

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
