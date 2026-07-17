# DESIGN — Config notes, demo floorplan library, unified docs site

*Authored 2026-07-17 (Fable). Status: **shipped**.*

Four deliverables in one arc:
1. **Config notes** — a free-text notes field on every configuration, shown in
   Settings when a plan is selected, riding export/import.
2. **Demo floorplan library** — ≥10 complete, importable floorplan configs
   built from the `docs/demo-houses/` specs, each with a notes description
   (total area, rooms, per-room elements) and placeholder roaming avatars.
3. **Floorplan capture pipeline** — scripted screenshots (2D per floor, 3D iso
   per floor, glass-house overview) + a page per plan + a library index with
   large thumbnails + a JSON download link per plan.
4. **Unified docs site** — the GitHub Pages site becomes real product
   documentation (home + user guide), with the models gallery and the new
   floorplan library as sections of it rather than standalone pages.

## 1. Config notes

- `Store.notes?: string` (top-level). **Must** be added to
  `Planner._loadFromHa`'s explicit field list (the reset-on-load gotcha).
- Export needs no change — `exportConfig` serializes the whole store. Import
  routes through the same load normalization, so the field list addition
  covers it.
- Settings ▸ Data ▸ Configurations: below the dropdown/buttons, a "Notes"
  block for the ACTIVE config — read-only `<div>` rendering the text (plain
  text, pre-wrap) in non-edit modes is moot (settings tabs beyond Connection
  are edit-only), so: a `<textarea>` (~5 rows) bound to `store.notes`,
  `@change` → `planner.setNotes(v)` (`store.notes = v || undefined; save();
  emitConfig()`). Switching configs re-renders with the new store's notes.
- Config-test: notes survive save→switch→switch-back, export→import, and the
  legacy-migration path (absent → undefined).

## 2. Demo floorplan library (`docs/floorplans/`)

**Authoring = builder scripts, not hand-written JSON.** Each plan is a small
JS module under `scripts/floorplans/plans/<id>.mjs` exporting
`{ id, name, build() }` where `build()` returns a full `Store` object. Shared
helpers in `scripts/floorplans/lib.mjs` (`floor()`, `wall(points, kind?)`,
`room(name, x, y)`, `door(x, y, rot, opts)`, `win(x, y, rot, opts)`,
`furn(kind, x, y, opts)`, `light(kind, x, y, opts)`, `roamer(name, kinds)`,
id generation, mm helpers). `scripts/floorplans/build.mjs` runs every plan →
writes `docs/floorplans/<id>.json` as the standard export envelope
`{ diorama: 2, name, exportedAt, store }` (fixed `exportedAt` per build run).
The JSONs are **committed** (they're the downloadable artifacts).

**Validation** (`scripts/floorplans/validate.mjs`, run by build): esbuild-
bundles `src/geometry.ts` + `src/storage.ts` helpers to a temp module (the
proven harness pattern), then asserts per plan: envelope shape; unique ids;
every wall point inside the floor rect; every `Room.anchor` inside a
`closedWallLoops` loop; every door/window within 500 mm of a wall segment;
every furniture `kind` ∈ `FURNITURE_KINDS` (or a custom object it ships);
stairs on multi-floor plans carry matching `stairLinkId` pairs; roamer avatar
ids resolve against builtin packs; `notes` non-empty. Exit nonzero on any
failure. npm script: `floorplans:build`.

**Content** — 12 plans: the 8 `docs/demo-houses/` specs (studio, one-bed,
small-bungalow, ranch-3bed, open-concept-modern, townhouse-3level,
two-story-colonial, large-multilevel) + 4 variations reusing a base geometry
with different furnishing/skin/extras (bungalow-cottage-yard: ground areas +
outdoor kinds; ranch-smart-home: lights/motion/env/robot fixture kit;
open-concept-entertainer: media/theater furnishing + scene tuning;
townhouse-minimal: alternate skin + sparse furnishing). Every plan: full
walls/rooms/doors/windows/furniture/lighting per its spec, `scene3d` skin
from the spec's appearance section, 1–3 **roamers** (named, themed avatar
pools from base packs — placeholder presence out of the box), and `notes` =
description with total area, per-room list, and elements per room.

## 3. Floorplan capture pipeline (`scripts/docs-site/floorplans.mjs`)

Drives the **real built app in offline mode** over CDP (reusing the
docs-gallery chrome/CDP/static-server plumbing):

- Serve `dist/`. For each plan JSON: `Page.addScriptToEvaluateOnNewDocument`
  seeds localStorage — `diorama:offline=1`,
  `diorama:local:diorama-configs` (index, activeId=plan id),
  `diorama:local:diorama-cfg-<id>` (the store body; **variant** bodies bake
  per-shot overrides like `scene3d.glassHouse=true`), `diorama:view`.
- Navigate `index.html?mode=view&lock=1&floor=<fid>&view=2d|3d[&cam=…]`.
  `cam=` for iso shots computed from the floor's w/d with the documented iso
  pose (azimuth 45°, elevation ≈35.26°, distance `max(fw,fd)*1.35`, target
  floor centre, y≈600); glass-house overview uses a higher/farther pose on
  the LAST floor with `glassHouse: true` baked in.
- Readiness: `app.ts` exposes `window.__dioramaPlanner` (tiny debug handle,
  assigned wherever the planner is created/adopted) — poll
  `__dioramaPlanner.store.floors.length` + one settled RAF pair, hide chrome
  (topbar/overlay buttons/weather chip) via injected CSS, then
  `Page.captureScreenshot` (viewport 1280×960, DPR 1). PNG per shot →
  `docs-site/floorplans/img/<plan>/{plan2d|iso}-<floorIdx>.png` +
  `glasshouse.png`; index thumbnail = the level-1 2D shot (or glasshouse for
  multi-floor).
- Pages: `docs-site/floorplans/<id>.html` (all shots, notes text, room table
  from the store, download link to `<id>.json` copied beside the page) +
  `docs-site/floorplans/index.html` (large thumbnail grid). Both through the
  shared shell (§4). Flags: `--only <id>`, `--force`, `--no-build`,
  `--pages-only`. npm script: `docs:floorplans`.

## 4. Unified docs site

Layout of the published site (`docs-site/`, still gitignored; publish.mjs
unchanged — orphan `gh-pages`, github remote only):

```
docs-site/
├── index.html            # home: hero, feature overview, install, links
├── assets/site.css       # one shared stylesheet (existing dark theme, extended)
├── guide/*.html          # user guide (authored markdown → HTML)
├── models/**             # the existing GIF gallery, MOVED under /models/
└── floorplans/**         # the new library (§3)
```

- **Shared shell**: `scripts/docs-site/shell.mjs` exports
  `pageShell({ title, active, depth, content, subnav? })` — one top nav
  (Home · Guide · Models · Floor plans) with `depth` computing relative
  hrefs. ALL page emitters (site build, gallery, floorplans) route through
  it.
- **Gallery move**: `generate.mjs` OUT → `docs-site/models/` (catalog cache
  + gifs move with it; the script relocates an existing root-level `gifs/`
  dir + catalog on first run so only changed subjects re-capture). Its page
  emitters adopt `pageShell`.
- **Guide**: authored markdown in `scripts/docs-site/guide/*.md` (committed
  source of truth), built by `scripts/docs-site/build.mjs` (home +
  guide pages; reuses the gallery's md→html converter, extracted into
  `shell.mjs`). Pages: getting-started, editor, 3d-view, devices,
  avatars-people, outdoor-weather, kiosk-modes, configurations. Content
  authored fresh from CLAUDE.md/STATUS/README so it reflects v0.17.x truth
  (this IS the staleness review), user-voice, no internal codenames.
- npm scripts: `docs:site` (home+guide), `docs:gallery` (models),
  `docs:floorplans`, `docs:publish` (unchanged), and `docs:all` (site +
  gallery pages-only + floorplans pages-only sanity, then publish is manual).
- README.md gains a "Documentation" section linking the Pages site;
  docs/GALLERY.md updated for the /models/ move + floorplans pipeline.

## Batches / ownership

- **A (notes)**: types.ts, planner.ts, ui/modals.ts, test-pages/config-test.
- **B (floorplan toolkit)**: scripts/floorplans/** (lib, validate, build,
  plans/studio + plans/ranch-3bed as references), package.json script.
- **C1–C3 (plans fan-out)**: remaining 10 plan modules, using B's helpers.
- **D (captures)**: scripts/docs-site/floorplans.mjs, `__dioramaPlanner`
  handle in app.ts, package.json script.
- **E (site)**: scripts/docs-site/build.mjs + guide/*.md, gallery move in
  generate.mjs, README/GALLERY.md.
- Shell (`scripts/docs-site/shell.mjs`): authored up front (Fable), shared.

Gotchas: `notes` in the `_loadFromHa` field list; plan JSONs must import
through the REAL import path (`importConfig` accepts the envelope);
`floor=` URL param ignores disabled floors outside edit mode (plans must not
ship disabled floors); view-mode topbar/chip hidden via CSS injection, not
DOM surgery; gallery GIF references are relative so the /models/ move is a
directory move + emitter-path change, not a GIF regen (only the equine mane
fix re-captures via `--only`); Pages propagation delay — poll until 200.
