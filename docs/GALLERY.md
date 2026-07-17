# Documentation gallery pipeline

`npm run docs:gallery` regenerates a complete **local** documentation site with a
per-model animated GIF for every model Diorama can render — furniture,
appliances, lighting, switches/controls, sensors, doors/windows, robots, and
every avatar pack member. One command, fully automated, always current.

```bash
npm run docs:gallery            # full run: build + capture every subject + write markdown
npm run docs:gallery -- --smoke # fast end-to-end proof (curated subset + GIF assertions)
```

Output lands in `docs-site/` (gitignored — regenerable, host or commit by choice):

```
docs-site/
  index.md   index.html         # TOC / landing (markdown + HTML both emitted)
  furniture.* appliances.* bathroom.* outdoor.*   # one page per furnitureCat (.md + .html)
  lighting.* switches-controls.* sensors.* doors-windows.* robots.*
  avatars/
    index.*  base.* sci-fi.* pop-culture.* video-games.* cartoons.*   # one page per top-level pack group
  assets/site.css               # single shared stylesheet for the HTML site
  media/**/*.gif                # one GIF per model
  .catalog.json                 # cached catalog (enables `--pages-only`)
```

Every run emits **both** a markdown page and a self-contained HTML page for each
category. The HTML site is a dark, editor-themed static site: a responsive card
grid (GIF on top, label + id + meta below), a sticky left nav with the avatar
packs nested (collapses to a toggle menu on narrow screens), lazy-loaded GIFs,
and per-card anchor ids. It has no external fonts / CDNs / JS frameworks — just
`assets/site.css` and a few lines of inline vanilla JS for the mobile nav. Open
`docs-site/index.html` directly, or publish it (below).

Every markdown page carries a `GENERATED — DO NOT EDIT BY HAND` header. Pages are
regenerated from the live catalog on every run, so a new furniture kind, light
icon, env kind, safety kind, window style, or avatar pack member appears
automatically the next time you run it — nothing to hand-maintain.

## How it stays automatically current

The catalog is enumerated **dynamically** at capture time from the shipped source
of truth — `FURNITURE_KINDS` + `furnitureCat`, the light-icon kind list,
`ENV_KINDS`, the safety/door/window kind unions, and **every** avatar pack in
`src/avatar-packs/manifest.ts` (all packs registered + force-activated so
franchise members resolve to their real rigs). The doc generator consumes that
catalog; it never hard-codes a model list.

## Architecture

- **`scripts/docs-gallery/capture.html` + `capture-main.ts`** — the off-screen
  capture stage. esbuild bundles `capture-main.ts` (with `gifenc` + the avatar
  manifest/pack data + the geometry catalog) into the temp serve dir at run time;
  it loads the **built** dist renderer chunk (`./assets/three-renderer.js`) via a
  runtime dynamic import so both share one avatars/registry instance — exactly the
  test-pages idiom. It exposes `window.dgCatalog()` (enumerate every subject) and
  `window.dgCapture(subject, opts)` (build the subject's scene, run its animation
  script, snapshot ~24–34 frames off the WebGL canvas, encode an animated GIF
  in-page with gifenc, stash base64 for chunked read). It is **never** part of the
  app build graph (it lives under `scripts/`; `npm run build` never sees it).
- **`scripts/docs-gallery/generate.mjs`** — the Node driver (built-ins only: a tiny
  static server + a minimal CDP client over the global `WebSocket`). It builds the
  app, esbuilds the capture bundle, serves it, launches headless Chrome with
  software WebGL, pulls the catalog, captures each subject (chunked base64 transfer
  for large GIFs), writes `docs-site/media/…`, then generates all markdown.

Each animation script maps to real renderer machinery — the same `updateFloor`,
`updateLightsSwitches`, `updateTargets`, `updateSafetySensors`, `updateAlarmPanels`,
`updateRobotRigs`, `_advanceApplianceDoors`, `_syncBubble`, `resolveDef`/rig
builders the live panel uses — never a reimplementation:

| Subject | Animation |
|---|---|
| furniture / bathroom / outdoor | 360° turntable of the default-size piece |
| appliance | fixed 3/4 view; door open→close via `_applianceDoors` (fridge door-sensor / others via `entityOn`), in-use LED/screen lit |
| lighting | corner environment; off → on → RGB color sweep → dim → off (fireplace flickers; wall kinds wall-mounted) |
| switch / alarm / door lock | plate + bound light toggling; alarm disarmed→arming→armed_away→triggered; lock locked↔unlocked |
| mmWave / motion | body + coverage/cone + a live radar/AI target moving through |
| env | chip value ramp crossing warn/danger bands |
| safety | smoke/co/gas idle→alarm rings; leak puddle grow |
| bins | lid flip empty↔full (state folded into the floor build) |
| doors / windows | smooth open→close via a cover-position ramp |
| robot | dock + roaming rig cycling docked/cleaning/returning LED states |
| avatar | idle rig (subtle weight-shift), 360° camera orbit, personality bubble forced visible; quadrupeds & hover rigs use their own rig behavior |

## Flags

| Flag | Effect |
|---|---|
| `--no-build` | reuse existing `dist/` (skip `npm run build`) |
| `--pages-only` | regenerate ONLY the pages (markdown + HTML) from existing media + the cached `.catalog.json` — no build, no browser, no capture. Verifies every referenced GIF exists on disk and exits nonzero on any broken reference. |
| `--only <sel>` | capture only subjects whose page, packId, type, or id starts with `<sel>` (e.g. `--only lighting`, `--only base`, `--only avatar`) |
| `--limit <N>` | cap subjects per page at N |
| `--fps <N>` / `--size <N>` | override GIF frame rate / pixel size |
| `--render-px <N>` | off-screen render resolution (default 480, downscaled to `--size`) |
| `--force` | re-capture even if the GIF already exists (default: idempotent skip) |
| `--smoke` | curated cross-section + assertion mode (each GIF must be GIF89a, >10 KB, >4 frames); exits nonzero on any failure |
| `--keep-serve` | keep the temp serve dir for debugging |

Runs are **idempotent**: existing GIFs are skipped unless `--force`, so a partial
or resumed run is cheap. Capture is **robust** — a failing subject is recorded and
the run continues; the final summary table reports captured / skipped / failed and
the run exits nonzero only if more than 5% of attempted captures failed.

## Size & time expectations

Roughly **0.8 s per subject** (software-WebGL headless Chrome). The catalog is
~580 subjects, so a full run is on the order of **8–12 minutes** plus a ~1 s build.
GIFs are typically 150–850 KB (400 px, 24–34 frames). `--smoke` finishes in ~25 s
including the build. Use `--only` / `--limit` to iterate on one page quickly.

## Publishing to GitHub Pages

```bash
npm run docs:gallery                                   # (re)generate docs-site/, incl. index.html
npm run docs:publish                                   # publish to the gh-pages branch
node scripts/docs-gallery/publish.mjs --dry-run        # build the commit + print the plan; push nothing
```

`docs:publish` (`scripts/docs-gallery/publish.mjs`) serves the generated HTML site
from GitHub Pages:

1. Requires `docs-site/index.html` (tells you to run `docs:gallery` / `--pages-only`
   otherwise).
2. Writes a `.nojekyll` marker into `docs-site/` so Pages serves every path
   (including `assets/`) verbatim without a Jekyll build.
3. Publishes `docs-site/` as a **single-commit orphan `gh-pages` branch**. Because
   `docs-site/` is gitignored in the main repo, the branch is built in a throwaway
   temp git repo (copy in → one orphan commit → `git push --force`), so the 163 MB
   of GIFs **never enter `main`** and no history accumulates. Commit message is
   `docs-site <version> <date>`.
4. Pushes to the **`github` remote only** (`git remote get-url github`) — never
   `origin`. The push is re-runnable: each run force-overwrites the remote branch
   with a fresh single commit.

`--dry-run` does everything up to the push (builds the local commit, prints the
remote, branch, commit sha, payload size, and the exact `git push` command) but
sends nothing to any remote — use it to preview.

After the first publish, enable Pages for the repo (Settings → Pages → Deploy from
branch → `gh-pages` / root). The site is then served at
`https://<owner>.github.io/diorama/` (e.g. `https://pwsh.github.io/diorama/`).

## Notes

- Output (`docs-site/`) is **gitignored by design**. It is regenerable at any time;
  host it (GitHub Pages, an internal wiki) or commit it deliberately if you want it
  versioned.
- `gifenc` is a **devDependency**, bundled only into the capture chunk — it never
  reaches `dist/`. The driver itself adds no runtime dependencies.
- The renderer exposes one capture-only hook: `new ThreeDRenderer(el, {
  preserveDrawingBuffer: true })` (default false, renderer-internal-safe) so the
  harness can read finished frames off the canvas. The live panel never sets it.
- The core `adult` rig is the default fallback and is not a manifest pack member, so
  it is represented by the base-pack humanoids rather than its own gallery entry.
