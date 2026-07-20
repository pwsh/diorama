#!/usr/bin/env node
// Stages the full Diorama app into the docs site as an editable offline demo.
//
//   node scripts/docs-site/demo.mjs
//
// Copies the built dist/ tree into docs-site/demo/ (the app's Vite base:'./'
// makes it run under the gh-pages /diorama/demo/ subpath), then copies every
// committed demo floorplan (docs/floorplans/*.json) into
// docs-site/demo/floorplans/<slug>.json and writes a manifest index.json =
// [{slug, name}]. app.ts's ?demo boot fetches ./floorplans/index.json + the
// envelopes and seeds them as offline configs.
//
// Assumes dist/ already exists — the npm chain runs `npm run build` first (see
// package.json). Output (docs-site/) is gitignored; publish with
// scripts/docs-gallery/publish.mjs (which copies the whole tree, demo/ included).
// No runtime deps (Node built-ins only).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const DIST = path.join(REPO, 'dist');
const SITE_ROOT = path.join(REPO, 'docs-site');
const DEMO_ROOT = path.join(SITE_ROOT, 'demo');
const DEMO_PLANS = path.join(DEMO_ROOT, 'floorplans');
const PLANS_SRC = path.join(REPO, 'docs', 'floorplans');

const log = (...a) => console.log('[docs-demo]', ...a);

function main() {
  // 1. Require a build.
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('[docs-demo] dist/index.html not found — build first:  npm run build');
    process.exit(2);
  }

  // 2. Copy dist/ → docs-site/demo/ (fresh; drop any stale prior copy so removed
  //    build artifacts don't linger). Normal local FS → cpSync is safe here.
  fs.rmSync(DEMO_ROOT, { recursive: true, force: true });
  fs.mkdirSync(DEMO_ROOT, { recursive: true });
  let distFiles = 0;
  for (const e of fs.readdirSync(DIST, { withFileTypes: true })) {
    fs.cpSync(path.join(DIST, e.name), path.join(DEMO_ROOT, e.name), { recursive: true });
  }
  const countFiles = (dir) => {
    let n = 0;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) n += countFiles(path.join(dir, e.name));
      else n++;
    }
    return n;
  };
  distFiles = countFiles(DEMO_ROOT);

  // 3. Copy demo floorplans + build the manifest.
  fs.mkdirSync(DEMO_PLANS, { recursive: true });
  const manifest = [];
  const jsons = fs.readdirSync(PLANS_SRC).filter(f => f.endsWith('.json')).sort();
  for (const f of jsons) {
    const slug = f.replace(/\.json$/, '');
    const raw = fs.readFileSync(path.join(PLANS_SRC, f), 'utf8');
    let env;
    try { env = JSON.parse(raw); }
    catch (err) { console.warn(`[docs-demo] skipping ${f} (invalid JSON): ${err.message}`); continue; }
    const name = typeof env.name === 'string' && env.name.trim() ? env.name : slug;
    fs.writeFileSync(path.join(DEMO_PLANS, `${slug}.json`), raw);
    manifest.push({ slug, name });
  }
  fs.writeFileSync(path.join(DEMO_PLANS, 'index.json'), JSON.stringify(manifest, null, 2));

  // 4. Summary.
  console.log('\n──────── docs-demo summary ────────');
  console.log(`app copied:  docs-site/demo/ (${distFiles} files)`);
  console.log(`floorplans:  ${manifest.length} → docs-site/demo/floorplans/`);
  console.log(`manifest:    docs-site/demo/floorplans/index.json`);
  console.log('DOCS-DEMO OK');
}

main();
