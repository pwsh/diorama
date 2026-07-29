# Documentation gallery pipeline

`npm run docs:gallery` regenerates the **model gallery** section of the unified
documentation site — a per-model animated GIF for every model Diorama can
render: furniture, appliances, lighting, switches/controls, sensors,
doors/windows, robots, and every avatar pack member. One command, fully
automated, always current.

The gallery is one **section** of the documentation site (`docs-site/`),
alongside the home page + user guide (`npm run docs:site`) and the floor-plan
library (`npm run docs:floorplans`). All three share one topbar and one
stylesheet via `scripts/docs-site/shell.mjs`, and `npm run docs:publish` pushes
the whole `docs-site/` tree to GitHub Pages.

```bash
npm run docs:gallery            # full run: build + capture every subject + write markdown
npm run docs:gallery -- --smoke # fast end-to-end proof (curated subset + GIF assertions)
```

Gallery output lands under `docs-site/models/` (the whole `docs-site/` tree is
gitignored — regenerable, host or commit by choice):

```
docs-site/
  index.html                    # site home (npm run docs:site)
  guide/*.html                  # user guide (npm run docs:site)
  floorplans/**                 # floor-plan library (npm run docs:floorplans)
  assets/site.css               # single shared stylesheet for the whole site
  models/                       # ← the model gallery (this pipeline)
    index.md   index.html       # gallery TOC / landing (markdown + HTML both emitted)
    furniture.* appliances.* bathroom.* outdoor.*   # one page per furnitureCat (.md + .html)
    lighting.* switches-controls.* sensors.* doors-windows.* robots.*
    avatars/
      index.*  base.* sci-fi.* pop-culture.* video-games.* cartoons.*   # one page per top-level pack group
    media/**/*.gif              # one GIF per model
    .catalog.json               # cached catalog (enables `--pages-only`)
```

**Relocation note:** the gallery used to emit at the `docs-site/` root. It now
lives under `docs-site/models/`; on the next run the generator moves any legacy
root-level `media/` + `.catalog.json` into `models/` and removes the stale
root-level gallery pages automatically — GIF references are relative, so this is
a directory move, not a re-capture.

Every run emits **both** a markdown page and a self-contained HTML page for each
category. The HTML pages render through the shared site shell
(`scripts/docs-site/shell.mjs`): the site topbar (Home · Guide · Models · Floor
plans) plus the gallery's own left nav (category pages with the avatar packs
nested; collapses to a toggle menu on narrow screens), a responsive card grid
(GIF on top, label + id + meta below), lazy-loaded GIFs, and per-card anchor
ids. It has no external fonts / CDNs / JS frameworks — just the shared
`assets/site.css` and a few lines of inline vanilla JS for the mobile nav. Open
`docs-site/models/index.html` directly, or publish the whole site (below).

Every markdown page carries a `GENERATED — DO NOT EDIT BY HAND` header. Pages are
regenerated from the live catalog on every run, so a new furniture kind, light
icon, env kind, safety kind, window style, or avatar pack member appears
automatically the next time you run it — nothing to hand-maintain.

## How it stays automatically current

The catalog is enumerated **dynamically** at capture time from the shipped source
of truth where the runtime allows it — `FURNITURE_KINDS` + `furnitureCat`,
`ENV_KINDS`, and **every** avatar pack in `src/avatar-packs/manifest.ts` (all
packs registered + force-activated so franchise members resolve to their real
rigs; the core `adult` rig is pushed explicitly — 512/512). The light-icon,
safety, door and window lists are hand-typed in `capture-main.ts` (type unions
are erased at runtime and can't be enumerated), but `generate.mjs` cross-checks
their counts against the real unions parsed from `src/types.ts` on EVERY run —
a new kind that misses the capture list fails the build loudly instead of
silently getting no GIF (added 2026-07-29 after 5 of 8 door kinds shipped
without gallery entries).

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

`docs:publish` pushes the **whole** `docs-site/` tree — the home page, user
guide, model gallery, and floor-plan library — as one GitHub Pages site.
Regenerate each section first, then publish:

```bash
npm run docs:site                                      # home page + user guide
npm run docs:gallery                                   # model gallery (docs-site/models/)
npm run docs:floorplans                                # floor-plan library
npm run docs:publish                                   # publish the whole docs-site/ tree
node scripts/docs-gallery/publish.mjs --dry-run        # build the commit + print the plan; push nothing
```

`docs:publish` (`scripts/docs-gallery/publish.mjs`) serves the generated site
from GitHub Pages:

1. Requires `docs-site/index.html` — the home page built by `docs:site` (tells
   you to generate the site otherwise).
2. Writes a `.nojekyll` marker into `docs-site/` so Pages serves every path
   (including `assets/`) verbatim without a Jekyll build.
3. Publishes `docs-site/` as a **single-commit orphan `gh-pages` branch**. Because
   `docs-site/` is gitignored in the main repo, the branch is built in a throwaway
   temp git repo (copy in → one orphan commit → `git push --force`), so the
   ~160 MB of GIFs + screenshots **never enter `main`** and no history
   accumulates. Commit message is `docs-site <version> <date>`.
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
