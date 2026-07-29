#!/usr/bin/env node
// Builds the Diorama documentation SITE's home page + user guide into docs-site/.
//
//   node scripts/docs-site/build.mjs [--allow-missing]
//
// Guide markdown lives (committed) in scripts/docs-site/guide/*.md and renders
// through the shared shell (scripts/docs-site/shell.mjs) so home, guide, model
// gallery (scripts/docs-gallery/generate.mjs), and floor plans
// (scripts/docs-site/floorplans.mjs) all share one topbar + one stylesheet.
//
// Flags:
//   --allow-missing   skip guide pages whose markdown file is absent (with a
//                     warning) instead of erroring. INTERIM verification aid
//                     only — a normal build requires every guide page to exist.
//
// No runtime deps (Node built-ins + shell.mjs). Output (docs-site/) is
// gitignored; publish with scripts/docs-gallery/publish.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sitePage, mdToHtml, writeSharedAssets, htmlEsc } from './shell.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const SITE_ROOT = path.join(REPO, 'docs-site');
const GUIDE_SRC = path.join(__dirname, 'guide');
const PKG = JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8'));

const ALLOW_MISSING = process.argv.includes('--allow-missing');
const log = (...a) => console.log('[docs-site]', ...a);
function isoDate(d = new Date()) { return d.toISOString().slice(0, 10); }

// Guide manifest — order, url slug, page title, and source markdown filename.
const GUIDE = [
  { slug: 'getting-started', title: 'Getting started', md: 'getting-started.md' },
  { slug: 'editor', title: 'The 2D editor', md: 'editor.md' },
  { slug: '3d-view', title: 'The 3D view', md: '3d-view.md' },
  { slug: 'devices', title: 'Devices & bindings', md: 'devices.md' },
  { slug: 'info-displays', title: 'Info displays & alerts', md: 'info-displays.md' },
  { slug: 'avatars-people', title: 'Avatars & people', md: 'avatars-people.md' },
  { slug: 'yard-terrain', title: 'Yard & terrain', md: 'yard-terrain.md' },
  { slug: 'outdoor-weather', title: 'Weather, sky & geo', md: 'outdoor-weather.md' },
  { slug: 'neighborhood-flights', title: 'Neighborhood & flights', md: 'neighborhood-flights.md' },
  { slug: 'kiosk-modes', title: 'Kiosk & display modes', md: 'kiosk-modes.md' },
  { slug: 'configurations', title: 'Configurations, notes & offline', md: 'configurations.md' },
];

// Guide sidebar nav — one link per GUIDE entry, active one highlighted. depth is the
// guide page's directory depth below the site root (guide/*.html → 1), so links
// to sibling guide pages are bare slugs.
function guideNav(activeSlug) {
  let s = '<nav class="nav">';
  for (const g of GUIDE) {
    const active = g.slug === activeSlug ? ' active' : '';
    s += `<a class="nav-link${active}" href="${g.slug}.html">${htmlEsc(g.title)}</a>`;
  }
  return s + '</nav>';
}

function buildGuide(version, date) {
  fs.mkdirSync(path.join(SITE_ROOT, 'guide'), { recursive: true });
  let built = 0, skipped = 0;
  for (const g of GUIDE) {
    const src = path.join(GUIDE_SRC, g.md);
    if (!fs.existsSync(src)) {
      if (ALLOW_MISSING) { log(`WARNING: missing guide markdown ${g.md} — skipping (--allow-missing)`); skipped++; continue; }
      console.error(`[docs-site] FATAL: guide markdown not found: ${src}\n` +
        '  Author it under scripts/docs-site/guide/, or pass --allow-missing for an interim build.');
      process.exit(1);
    }
    const md = fs.readFileSync(src, 'utf8');
    const main = `<div class="prose">${mdToHtml(md)}</div>`;
    const html = sitePage({
      title: g.title, section: 'guide', depth: 1,
      sidebar: guideNav(g.slug), main, version, date,
    });
    fs.writeFileSync(path.join(SITE_ROOT, 'guide', `${g.slug}.html`), html);
    built++;
  }
  return { built, skipped };
}

// Guide screenshots live (committed) in scripts/docs-site/guide/img/ and are
// referenced from the markdown as bare `img/<name>.png`, which resolves next to
// the rendered guide/*.html. Copy the whole directory verbatim.
//
// Tolerant by design: the captures are produced by a separate pipeline, so the
// directory may be absent or empty (only a .gitkeep) when the site is built.
// A missing image is a missing picture, never a failed build.
function copyGuideImages() {
  const src = path.join(GUIDE_SRC, 'img');
  const dest = path.join(SITE_ROOT, 'guide', 'img');
  if (!fs.existsSync(src)) { log('no guide/img directory — skipping screenshots'); return 0; }
  fs.mkdirSync(dest, { recursive: true });
  let n = 0;
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;              // .gitkeep and friends
    const from = path.join(src, ent.name);
    const to = path.join(dest, ent.name);
    try {
      if (ent.isDirectory()) fs.cpSync(from, to, { recursive: true });
      else { fs.copyFileSync(from, to); n++; }
    } catch (err) {
      log(`WARNING: could not copy guide image ${ent.name}: ${err.message}`);
    }
  }
  if (n === 0) log('guide/img is empty — screenshots will render as broken images until captured');
  return n;
}

function buildHome(version, date) {
  const features = [
    ['The Sims, for your house',
      'The 3D view renders in a 2000-era Sims cartoon style — flat toon shading, cartoon outlines, blob shadows, a dimetric camera, and a glass-house / wall-cutaway doll’s-house view.'],
    ['Live presence with personality',
      'Figures walk around furniture and through doorways, sit down, and run contextual activities — making coffee, watching a TV that’s actually on, working out, sleeping two-to-a-bed — with time- and place-aware thought bubbles.'],
    ['First-class mmWave radar',
      'Multi-sensor, multi-target HLK-LD2450 tracking with in-place zone and object editing, per-sensor colors, and animated figures that reflect where people actually are.'],
    ['Build it fast, bind anything',
      'A visual toolbar with real 3D thumbnails for every piece, live dimensions as you drag, rulers and CAD dimension lines — then bind lights, switches, fans, media players, sensors, cameras, locks, covers, thermostats, alarm keypads, vacuums and mowers, and click to control. Bind rooms to your Home Assistant areas and the entity pickers narrow themselves.'],
    ['Know who’s who',
      'A People registry (names, colors, pets), BLE / Bermuda indoor positioning solved from your Bluetooth proxies, and identity fusion that dresses a precise radar figure in a person’s avatar and name label.'],
    ['Your yard, in full',
      'Ground coverings and raised terraces, fences, hedges and gates, paths and driveways, sprinklers, flagpoles, and pools and spas with heater, pump, light, and water-chemistry bindings.'],
    ['The neighborhood & the sky',
      'Surrounding buildings, roads, and water from OpenStreetMap; live aircraft and the ISS overhead; an astronomically correct night sky for your latitude; and weather with 3D rain, snow, fog, wind, and lightning.'],
    ['On the wall or on a dashboard',
      'Lock a plan into a live wall display with URL templates for mode, floor, view, layers, and camera — or drop a read-only Diorama card straight onto a Lovelace dashboard.'],
    ['Try it, or run it offline',
      'A full editable demo runs in your browser with no install at all — and Diorama works the same served statically with no Home Assistant, with multiple named configurations and export / import.'],
  ];

  const tiles = features.map(([t, d]) =>
    `<div class="tile"><span class="tile-title">${htmlEsc(t)}</span><span class="tile-count">${htmlEsc(d)}</span></div>`).join('');

  const cta = [
    ['▶ Try the live demo', 'demo/index.html?demo=ranch-3bed'],
    ['Get started', 'guide/getting-started.html'],
    ['Model gallery', 'models/index.html'],
    ['Floor plans', 'floorplans/index.html'],
    ['GitHub', 'https://github.com/pwsh/diorama'],
  ].map(([label, href]) => `<a class="dl-btn" href="${href}">${htmlEsc(label)}</a>`).join('');

  const install = `panel_custom:
  - name: diorama-panel
    sidebar_title: "Diorama"
    sidebar_icon: mdi:floor-plan
    url_path: diorama
    module_url: /hacsfiles/diorama/diorama-panel.js
    embed_iframe: false`;

  const main = `<section class="hero">
<h1>Diorama — a graphical dashboard for Home Assistant</h1>
<p class="tag">Build a virtual copy of your home — walls, rooms, furniture, and devices — and see live Home Assistant state in its actual spatial context. Click anything to control it. The 3D view renders in a 2000-era <em>Sims</em> cartoon style, with the people and pets moving through your home shown as animated figures.</p>
<div class="cta-row">${cta}</div>
</section>
<section class="group"><h2>Try it in your browser</h2>
<p>The <a href="demo/index.html?demo=ranch-3bed">live demo</a> runs the <strong>full app entirely in your browser</strong> — no Home Assistant, no install, no account. It loads in offline mode preloaded with a dozen sample homes you can switch between and edit freely: move walls, drop furniture and devices, and orbit the Sims-style 3D view. Every change is saved only in <em>your</em> browser's local storage; a <strong>Reset demo</strong> button restores the samples at any time.</p>
<p><a class="dl-btn" href="demo/index.html?demo=ranch-3bed">▶ Open the live demo</a></p>
</section>
<section class="group"><h2>What it does</h2>
<div class="feature-grid">${tiles}</div>
</section>
<section class="group"><h2>Install</h2>
<p>Diorama installs through <a href="https://hacs.xyz">HACS</a> as a custom repository (<code>https://github.com/pwsh/diorama</code>, type <strong>Dashboard</strong>). After downloading it, register the native panel in <code>configuration.yaml</code> and restart Home Assistant:</p>
<pre><code>${htmlEsc(install)}</code></pre>
<p>Panel mode rides Home Assistant’s own authentication — no tokens needed. Full steps, the iframe fallback, and offline standalone mode are in the <a href="guide/getting-started.html">Getting started</a> guide.</p>
</section>`;

  fs.writeFileSync(path.join(SITE_ROOT, 'index.html'),
    sitePage({ title: 'Home', section: 'home', depth: 0, main, version, date }));
}

function main() {
  fs.mkdirSync(SITE_ROOT, { recursive: true });
  writeSharedAssets(SITE_ROOT);
  const version = PKG.version;
  const date = isoDate();
  buildHome(version, date);
  const { built, skipped } = buildGuide(version, date);
  const images = copyGuideImages();
  console.log('\n──────── docs-site summary ────────');
  console.log(`home page:  docs-site/index.html`);
  console.log(`guide pages: ${built}/${GUIDE.length} built${skipped ? `, ${skipped} skipped (--allow-missing)` : ''}`);
  console.log(`guide images: ${images} copied → docs-site/guide/img/`);
  console.log(`assets:     docs-site/assets/site.css`);
  console.log('DOCS-SITE OK');
}

main();
