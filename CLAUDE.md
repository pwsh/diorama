# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Repo at a glance

This repo is the **Diorama** TypeScript + Vite + Lit panel. It is a graphical
design interface for Home Assistant: build a virtual copy of your home, see
live device state in spatial context, click anything to control it. First-class
LD2450 mmWave radar support; generic for any HA entity.

The companion LD2450 ESPHome firmware lives in a separate repo / paths and is
not present here. Diorama still expects LD2450 entity naming conventions when
binding (see `sensor-discovery.ts`).

---

**Project status & pick-up guide**: `docs/STATUS.md` — current state, release
runbook, working practices, open threads. The original Sims-2000 arc plan
lives in `docs/DESIGN-sims.md`. The "World Outside" arc (BLE identity/trilateration
+ identity fusion, GPS geo-calibration, weather) is planned in `docs/DESIGN-world.md`
and **shipped through B3** (all phases). Deterministic renderer test pages (the
verification harness) live in `test-pages/` (see its README).

**Future-work references**: `docs/ROADMAP.md` ranks unshipped HA integrations;
`docs/models/` holds model/animation build references for household categories
(appliances, furniture, lighting, decorations, plants, misc); `docs/research/`
holds build-ready per-item research for every outstanding roadmap/backlog item
(HA data model + Diorama design + integration checklist) plus deployment/design
guides (kiosk platforms, home theater, skinning textures) — start at
`docs/research/README.md` (index + cross-cutting primitives + build order);
`docs/demo-houses/` holds 8 reconstruction-ready floor-plan specs (studio →
large multilevel) buildable straight into the `Floor`/`Room`/`Wall`/`Furniture`
model — see `docs/demo-houses/README.md`.

**Docs site & demo floorplans**: the published documentation site
(https://pwsh.github.io/diorama/ — home + user guide + model-GIF gallery under
`/models/` + floor-plan library under `/floorplans/` + the **live editable demo**
under `/demo/`, see "GitHub Pages live demo") is generated into the
gitignored `docs-site/` by `npm run docs:site` (home + guide from
`scripts/docs-site/guide/*.md`), `docs:gallery` (GIF gallery),
`docs:floorplans` (per-plan screenshots — 2D + iso per floor + glass-house —
captured from the REAL built app in offline mode over CDP, driven through the
`window.__dioramaPlanner` handle), and `docs:demo` (copies `dist/` + floorplan
envelopes into `docs-site/demo/`), all sharing `scripts/docs-site/shell.mjs`;
`docs:publish` force-pushes the tree to the `gh-pages` orphan branch (github
remote only). See `docs/GALLERY.md`. The 12 importable demo floorplan configs
in `docs/floorplans/*.json` (committed; export-envelope format) are GENERATED —
edit the builder modules in `scripts/floorplans/plans/*.mjs` and re-run
`npm run floorplans:build` (validates against the real `geometry.ts`: closed
loops, room anchors, opening snap distance, kinds, stair-link pairs).
**Physical-plausibility checks (2026-07-20, `scripts/floorplans/physical.mjs`
+ validate.mjs checks 9–12)**: doorway clearance (no nav-blocking piece in a
door's span × 2·`DOOR_CLEAR` 600 mm OBB — same block/exempt rules as
`_buildNav`), furniture-vs-solid-wall overlap (openings excised via the real
`wallCutsForSegment`; elevated/mountable/wall-plane/stairs exempt), **nav
reachability** (a faithful `_buildNav` replica — 150 mm grid, `PERSON_R` 170
inflation, wall capsules, 8-neighbour fill — asserting every room resolves to
ONE region per floor, tiny closets under `MIN_STANDING_CELLS` exempt), and
seat alignment (a table-captured chair must aim its −Z front at the tabletop's
NEAREST point within 35°, not overlap it). `lib.mjs`'s `floor()` also runs a
deterministic **settle pass** (`settle:false` opts out) mirroring the app's
on-drop behavior: chairs rotate to face their host edge + tuck, wall-colliding
pieces nudge out along the normal. That pass fixed ~150 wall-sunk pieces and
~50 backwards chairs — **the plans had been authored "+Y = front" while the
renderer's SitSpot normal, 2D chevron and humanoid facing are all local −Z**.
Build output is byte-deterministic (re-run + diff).

## Layout

```
.
├── package.json               # name: diorama; vite ^8 (needs node 20.19+ or 22.12+)
├── tsconfig.json
├── vite.config.ts             # base: './'; two entries; STABLE unhashed output filenames (see gotchas)
├── index.html                 # mounts <diorama-app> (iframe/standalone entry)
├── hacs.json                  # HACS zip_release config
├── .github/workflows/         # ci.yml (typecheck+build on push/PR), release.yml (HACS zip)
├── public/                    # favicon
├── sweethome3d/               # example SH3D OBJ/MTL export for testing model import
└── src/
    ├── main.ts                # bootstrap (just imports ./ui/app.js)
    ├── panel.ts               # panel_custom entry → dist/diorama-panel.js (HA injects hass)
    ├── types.ts               # domain types: Floor, Sensor, MotionSensor, Light,
    │                          # SwitchFixture, Furniture, FurnitureKind, LightIconKind, BgImage, Store, ...
    ├── storage.ts             # localStorage cache (key: diorama:store:v1)
    ├── model-store.ts         # IndexedDB store for imported OBJ/MTL text (db: diorama-models)
    ├── avatars.ts             # avatar-pack types + registry + core pack + resolve fns
    │                          # (pure, three.js-FREE — shared by app graph AND renderer chunk)
    ├── avatar-store.ts        # IndexedDB store for user-imported avatar packs (db: diorama-avatars)
    ├── avatar-packs/          # built-in pack data (manifest.ts eager; bodies lazy chunks)
    ├── geometry.ts            # transforms, snap, point-in-polygon, fixture-prop defaults,
    │                          # FURNITURE_KINDS, SENSOR_PALETTE, hex/lighten utilities
    ├── ha-client.ts           # HA WebSocket client + getDevices/getEntityRegistry/get|setUserData
    ├── ha-panel-adapter.ts    # HaApi impl riding the hass object HA injects (panel mode)
    ├── sensor-discovery.ts    # LD2450 entity discovery per device (slug regexes)
    ├── three-renderer.ts      # Three.js 3D scene + raycast click handling + animated humanoids
    ├── planner.ts             # central state class, source of truth for store + per-sensor live state
    ├── canvas-render.ts       # 2D canvas drawing functions
    ├── canvas-hit.ts          # 2D hit tests
    ├── canvas-interact.ts     # mouse/touch handlers, zone editor, fixture click-vs-drag
    ├── time-of-day.ts         # resolveScenePreset (lighting) + resolveTimeBucket
    │                          # (morning/day/evening/night/late_night) — shared by
    │                          # lighting, activities, bubbles; prefers sun.sun elevation
    ├── styles.ts              # shared CSS (injected at document level; light-DOM components)
    └── ui/
        ├── app.ts             # <diorama-app> root
        ├── auth-screen.ts     # <diorama-auth>
        ├── topbar.ts          # <diorama-topbar>
        ├── sidebar.ts         # <diorama-sidebar>  (tools, sensors, motion sensors, furniture, fixtures, bg, data)
        ├── canvas-2d.ts       # <diorama-canvas-2d> wrapper (RAF loop + interactions)
        ├── three-view.ts      # <diorama-three-view> wrapper (mounts ThreeDRenderer + raycast routing)
        └── modals.ts          # <diorama-floor-modal>, <diorama-zone-edit-bar>,
                               # <diorama-entity-picker>, <diorama-light-config>,
                               # <diorama-settings-drawer>
```

## Commands

```bash
npm install
npm run dev          # vite dev server, hot reload at http://localhost:5173
npm run typecheck    # tsc --noEmit (run before assuming a feature works)
npm run build        # tsc -b && vite build → ./dist (two entries, see below)
npm run preview      # vite preview of the build
npm run deploy       # build + copy dist/ to the live HA instance (HACS dir on the SMB share)
npm run deploy:watch # save → rebuild → redeploy loop against live HA (no tsc; typecheck separately)
```

No test suite exists; `npm run typecheck` + `npm run build` are the verification gates. CI (`.github/workflows/ci.yml`) runs exactly those two on every push / PR (Node 22).

The deploy scripts drive the `haDeploy` plugin in `vite.config.ts` (gated on `DIORAMA_DEPLOY=1`): after each build it copies `dist/` to HA's `www/community/diorama/` — where the HACS-installed panel (`/hacsfiles/diorama/diorama-panel.js`) loads from. The target is machine-specific and intentionally not committed: set `HA_WWW_DIR` (+ optional `HA_SMB` for gio auto-mounting of the Samba share) or create the gitignored `deploy.local.json` (copy `deploy.local.example.json`). It copies file-by-file — `fs.cpSync` dies with ENOTSUP on GVFS FUSE mounts. A HACS update/reinstall overwrites that dir; redeploy after. Hard-refresh the browser after a deploy (stable filenames + aggressive caching).

## Deploy

```bash
npm run build
# Copy dist/ to HA: config/www/diorama/
```

Two integration modes (both built from the same dist/):

**Native panel (preferred — no token, HA handles auth):**
```yaml
panel_custom:
  - name: diorama-panel
    sidebar_title: "Diorama"
    sidebar_icon: mdi:floor-plan
    url_path: diorama
    module_url: /local/diorama/diorama-panel.js
    embed_iframe: false
```

**Iframe fallback (long-lived token pasted into the auth screen):**
```yaml
panel_iframe:
  diorama:
    title: "Diorama"
    icon: mdi:floor-plan
    url: "/local/diorama/index.html"
    require_admin: false
```

---

## Architecture (load-bearing)

### Single source of truth
`Planner` (in `planner.ts`) owns:
- `store` — persisted state (floors, sensors, walls, furniture, motion sensors, lights, switches, bg images).
- `hass` — WebSocket client.
- Per-sensor live state (`discBy`, `zonesBy`, `objectsBy`, `lerpBy`, expansion sets, edit-object indices).
- Drag / edit-zone / drawing-wall transient state.
- View, tool, active-sensor / active-motion ids, pan/zoom (`viewCenter`, `zoom`).
- `pendingFurnitureKind` — runtime-only, controls which furniture kind the next drop creates.

UI Lit components are thin wrappers that read planner state and dispatch events (CustomEvents that bubble) back. Lit renders to **light DOM** (`createRenderRoot() { return this; }`) so shared CSS applies and native form behavior is preserved.

### Two event channels
- `live` — fires on every HA `state_changed` event (~10 Hz). The 2D canvas RAF reads planner state every frame, so it doesn't usually need to subscribe; the event exists for non-canvas consumers.
- `config` — fires only on structural changes / `number.*` / `switch.*` updates. Sidebar + topbar subscribe; Lit reconciles surgically and focused inputs survive.

`_isSlowEntity(id)` decides which channel: `number.*` and `switch.*` go through both (slow path triggers config), everything else stays live-only. Slow-path sync is skipped while a drag or zone-edit is in flight to avoid HA's stale read clobbering an in-progress edit.

### Two connection modes
`HaApi` (interface in `ha-client.ts`) is the connection surface Planner + UI use. Two implementations:
- `HassClient` — standalone WS + long-lived token (iframe mode, `index.html` entry).
- `HassPanelAdapter` (`ha-panel-adapter.ts`) — rides the authenticated `hass` object HA injects into `panel_custom` panels (`src/panel.ts` entry → `dist/diorama-panel.js`). First `set hass` grabs `hass.connection`, subscribes to `state_changed`, maintains its own states map so Planner semantics match both modes.

`Planner.connect(url, token)` wraps `connectWith(new HassClient(...))`; panel mode calls `connectWith(adapter)` directly and `App.adoptPlanner(p)` (skips the token auth screen).

### Lazy 3D chunk (code splitting)
`three-view.ts` imports `three-renderer.js` **type-only** at the top and does the real `await import('../three-renderer.js')` inside `firstUpdated`. That keeps three.js (~600 kB minified / ~157 kB gzip) out of the startup bundle — the 2D-only path loads ~178 kB. Don't add a static value import of `three-renderer.js` (or `three`) anywhere outside that dynamic import or the split silently collapses.

### Sims-style rendering (the whole 3D look — load-bearing)
The 3D view renders in a 2000-era-Sims style. There is NO PBR path anymore:

- **Materials**: everything goes through `ThreeDRenderer._mat(params)` — a factory
  returning `MeshToonMaterial` with one shared 4-step `DataTexture` gradient map
  (NearestFilter, cached in `_gradientMapTex`). It accepts
  `MeshStandardMaterialParameters` so legacy call sites converted mechanically;
  PBR-only knobs (`roughness`/`metalness`/`envMapIntensity`) are silently dropped.
  Colors get a saturation push in `_simsColor`. **Never construct
  `MeshStandardMaterial` directly** — new builders call `this._mat({...})`.
- **No tone mapping, no PMREM environment** (`NoToneMapping`; `scene.environment`
  unset). Preset light levels in `applyScenePreset` are tuned for this — a strong
  directional sun component is what makes the toon bands show.
- **Shadows**: `renderer.shadowMap` is **disabled**. `_shadowFlags` is a kept-for-
  interface-stability no-op. Soft radial **blob-shadow decals** replace shadow maps:
  `_blobShadow(rx, rz)` returns an alpha quad using the shared `_blobTex`
  CanvasTexture. Furniture builders add one automatically (skipped for rugs, the
  stairs family, and elevated pieces); each humanoid rig carries one (`h.blob`),
  re-grounded every frame in `updateTargets` so it stays on the walking surface
  while the body bobs / sits. Don't give blob quads a negative renderOrder — the
  opaque floor would paint over them.
- **Cartoon outlines**: `_addOutlines(root, thick, minDim)` adds inverted-hull
  shells — child meshes SHARING the host geometry, `BackSide`, one shared dark
  `_outlineMaterial` (polygonOffset on), scaled outward per-axis about the
  geometry bbox center. Applied to furniture groups, door panels, light-fixture
  bodies, and humanoids. Transparent materials, thin sheets (<8 mm), and small
  parts (<minDim) are skipped; `userData.outline` marks shells,
  `userData.outlineSkip` opts a mesh out. Thickness staggers 3 mm per shell —
  shells of ABUTTING boxes can land coplanar and z-fight (the shared
  polygonOffset can't break a shell-vs-shell tie).
- **Coincident-face gotcha**: composite builders must NOT give two sibling boxes
  exactly coplanar visible faces (e.g. sofa plinth vs armrest, bed blanket vs
  mattress foot — both fixed). PBR shading used to mask these; flat toon banding
  makes them hatch visibly.
- **Humanoids** are Sims-flavored: oversized head/hands, a spinning green
  **plumbob** octahedron above the head (`h.plumbob`, spun from the absolute
  clock in `updateTargets`).
- **Faces** (built in `_buildHumanoid`, front = local −Z): every rig gets
  readable features scaled to the oversized head — a white-sclera eye sphere +
  proud dark iris/pupil (`makeEye`), an angled dark brow (`makeBrow`), a small
  darkened-skin nose bump (`noseMat` = skin ×0.8 so it catches its own toon
  band), and a slim dark smile (mid segment + up-turned corner segments). Skin
  ears (`makeEar`) are added on the sides EXCEPT for kinds wearing side-covering
  hair/hood/helmet/animal-ears (`EAR_SKIP`); cyborg shows only its organic (−x)
  ear. Kind-specific eyes (visor / almond / shades / slit / redvisor / halfred)
  keep their look and skip the generic eyes; robot (visor) and ninja (slit) stay
  faceless/masked. Eye whites + emissive eyes carry `userData.outlineSkip`.
  **Hats/hair must clear the eye band**: any accessory dome (hacker hood,
  supermodel hair cap) is a downward bowl whose rim is horizontal, so it's
  raised + tilted back (`rotation.x`) with a trimmed `phiLength` so the front
  rim rides above the brow instead of draping to eye level.
- Shared style resources (`_gradientMapTex`, `_blobTex`, `_outlineMaterial`) are
  created once and disposed only in `destroy()` — per-instance disposal must NOT
  touch them (`_disposeSubtree` disposes materials but not maps, which is what
  makes the shared textures safe).

### HACS
`hacs.json` uses `zip_release: true` + `filename: diorama.zip`; `.github/workflows/release.yml` builds and attaches the zip on each GitHub release. Module URL under HACS is `/hacsfiles/diorama/diorama-panel.js`. The zip mode is required because the build is multi-chunk (code-split three.js) — single-file HACS plugin mode would break the dynamic import.

### 3D dirty-key rebuilds (perf — load-bearing)
`three-view.ts._tickOnce` does NOT rebuild the scene every frame. Each group has a dirty key (`_keyFloor`, `_keyDoors`, `_keySensors`, `_keyMotion`, `_keyLights`, `_keyZones`, `_keyHalos`, `_keyModel`); the corresponding `update*` renderer call only fires when its key changes. Keys combine `planner.configRev` (bumped in every `emitConfig`) + the relevant bound-entity states. Exceptions:
- Targets (`updateTargets`) run every frame — persistent humanoid rigs mutate in place.
- An ON fireplace light forces `updateLightsSwitches` every frame (flicker comes from `Math.random()` in the builder).
If you add a renderer input (new prop, new entity dependency), **add it to the corresponding key** or the scene won't update.

### 3D scene appearance
`Store.scene3d` (`Scene3D` in types.ts): lighting `preset` (`night` default / `day` / `dusk`), `floorColor`, `floorTex` (`none|wood|tile|concrete` — procedural canvas textures, cached in `_texCache`), `wallColor`. Applied in `updateFloor(f, scene3d)` + `applyScenePreset`. Sidebar "3D Scene" section edits it.

- **Auto lighting modes**: `scene3d.lightMode` = `manual` (default) / `clock` / `lux`. `resolveScenePreset(sc, states)` in `src/time-of-day.ts` resolves the preset (clock mode reads HA's `sun.sun` elevation >10° day / >−4° dusk / else night, local-clock fallback; lux mode maps `scene3d.luxEntity` ≥3000 lx day / ≥300 dusk). `three-view._tickOnce` calls it each tick and folds the result into `_keyFloor`, so the scene rebuilds only when the preset flips.
- **Per-floor look overrides**: `Floor.look3d` (`FloorLook3D`: floorColor/floorTex/wallColor) is spread over the global scene3d in the `updateFloor` call. Edited in the "This floor only" subsection of 3D Scene.
- **Ground level — a FIXED WORLD PLANE with per-floor elevations** (user-reported: "the ground plane changes depending on which floor is selected"). `Floor.elevationMm?` (per-floor, in `repairFloor`'s field list; **absent = AUTO = index-in-`store.floors` × `STORY_H_MM` 3000** — index 0 sits ON the ground, single-floor configs byte-identical; negative = basement; the ground may bisect a floor) resolved by the pure `floorElevationMm(floors, id)` (geometry.ts — AUTO must resolve against the FULL floors array, never the enabled-filtered list, or disabling a floor re-stacks the others; pinned by ghost-align T5f). **ONE injection site** (three-view `_tickOnce`, at `scMerged`): `effGroundMm = resolveGroundLevelMm(user value) − floorElevationMm(floors, activeId)` overwrites `groundLevelMm` in the merged scene3d — every downstream consumer (grid y, `_neighborhoodGroup` y, `_groundYAt`/`_itemGroundY`/`_yardGroundY`, ground areas, bg-text) inherits it UNCHANGED; `_keyFloor`/`_keyGround`/`_keyBgText` carry the effective value, `_keyGhost` a per-floor elevation term. **`resolveGroundLevelMm` (±10 000 clamp) MOVED to geometry.ts** (three-view can't import the lazy chunk; three-renderer re-exports it) and clamps the USER value only — the EFFECTIVE value legitimately exceeds it (3rd story = −9000 before the offset); renderer-internal sites use a finite-guard `sanitizeGroundLevelMm`, never a re-clamp. `_flightsGroup.position.y` = the grade (the flight shell + clearMm floor are GROUND-relative). Sidebar Floors: "Elevation above ground (mm)" input, placeholder `auto: N`, blank → auto. `Scene3D.groundLevelMm` (Settings ▸ Display "Ground level (mm)") remains the whole-property grade offset ON TOP, and moves the **SURROUNDINGS** relative to the house — the backdrop `GridHelper`, the whole `_neighborhoodGroup` (a group offset — the overlay's internal landuse/water/road y=1/2/3 stack + podium `baseMm` are preserved) and the `Floor.yardFill` underlay (`2 + level`) — while the floor slab, walls, furniture, fixtures and every authored `GroundArea`/terrace/pool/path stay put. NEGATIVE = surroundings below the slab (raised-foundation / hilltop look); user value clamped ±10 000 mm by the pure `resolveGroundLevelMm` (geometry.ts). `_groundYAt` returns the level for points **outside every closed wall loop** (via `_outdoors`; a loop-less floor reads as indoors, matching the full-rect slab) so rigs, blob shadows and robot rigs settle onto the lowered yard — the eased `h.groundY` covers the doorway step — while terrain (terraces/stairs/risers) keeps its authored height. Yard-fill wall-loop **holes are punched only at level ≥ 0**: below it the grade must run continuously under the raised pad or a low camera sees the grid through them. Rides `scene3d`'s whole-object persistence (no `_loadFromHa` change) + configRev (`_keyFloor`/`_keyGround`/`_keyNeighborhood` all rebuild); `updateGroundAreas`'s trailing `groundLevelMm?` falls back to the level `updateFloor` resolved (stale-caller safe). v1 limit: no foundation-skirt geometry (a very low camera sees the slab plane's underside). Test `terrain-test.html` (`TERRAIN PASS 103/103`, sections G+H+I+J+K).
- **Ground level, part 2 — free-standing content follows the grade** (user-reported, grass text first). One renderer rule: `_itemGroundY(wx, wy)` (pure app-side MIRROR: `resolveItemGroundMm` in geometry.ts, pinned by stairs-fit-test — change both together) — **TERRACE-first, grade-second** (user-reported: trees in a −950 mm sunken backyard floated at grade while avatars stood on the lawn): the highest registered `terrace` `_terrain` entry containing the point wins (flat top `elevation + ht`, already grade-composed at registration — never stacked), else `groundLevelMm` when outside every closed wall loop, else slab 0 (the fallback is the extracted `_gradeY()`, the verbatim old rule; `_groundYAt`'s no-terrain fallback routes THROUGH it — nav ground truth and visual builds can't diverge). Stairs treads/landings/`riser_platform` are EXCLUDED from item grounding (recliners on risers carry a manual `elevation`; auto-grounding would double it — avatars still climb them via `_groundYAt`). Terrace `_terrain` registration moved to the TOP of `updateFloor` (right after `_wallLoops`) so the wall/opening base pass and furniture loop see it; loop-less floors still ground items on terraces (`_insideWallLoop`, not `!_outdoors`). `groundAreaSkirtBase` picks the reference tier by ENCLOSURE (smallest strictly-larger containing polygon, any elevation sign) — a raised pad drawn INSIDE a sunken tier now skirts down to that lawn instead of clamping at 0 (the "just increases the thickness" report); `_yardGroundY()` = the grade unconditionally, for content that ENCIRCLES the property (bg-text train loop, banner-plane/chopper/sky orbits — constant AGL). Applied at build time to: furniture groups (`grp.position.y += furnGY` — blob shadows / door + plant + sink pivots / decals inherit; `SitSpot.seatY`, bed mattress top, riser terrain take the same offset so an avatar sits ON an outdoor lawn chair), ground areas + terrace terrain (`gl + elevationMm + 4`, skirt base shifted equally, CENTROID used in both the visual and terrain paths), pools (whole basin off the shifted rim), ground-standing lights (`GROUND_STANDING_LIGHT_KINDS` = lamp/inground/ground_spot only) + their floor pools, flagpoles, robot docks, cameras (+ FOV wedge), valves, projectors (each beam end resolves its own grade), leak floor pucks, GPS/landmark/geo-event sprites (per-pin — indoor "find my phone" pins stay slab-relative), and the grass lawn decal (`_groundYAt + 6`, covering margin-strip AND grassAreaId placements in one expression). **Never moves**: wall-plane furniture (`HOUSE_MOUNTED_FURNITURE_KINDS`) + stairs family, wall/ceiling light kinds, wall plates, ceiling detectors/beacons, room-bound zones/occupancy/heatmap, anything indoors. **Walls/doors/windows are NO LONGER blanket-exempt** (user-reported: with story-sized elevations a newly drawn yard wall floated at the slab plane): `_wallSegmentBaseY(kind, a, b, loops)` — fence family (`fence_picket|fence_privacy|fence_chainlink|hedge`) ALWAYS bases at `_itemGroundY(mid)` per segment; solid kinds (`full|half|railing`) follow the grade ONLY when free-standing — the pure `wallSegmentInLoops(a, b, loops, weld=25)` (geometry.ts) runs FIRST and wins (a loop member stays at slab 0; ordering is load-bearing because a perimeter wall's midpoint lies ON its own loop boundary, which `pointInPolygon` excludes — an outdoors-only predicate would sink the whole house a storey). Membership = exact adjacent-loop-pair match within the weld, PLUS a sampled-points superset path (17 points within weld of the union of all loop boundaries) because `closedWallLoops` splits a perimeter wall at interior tees into edges belonging to DIFFERENT loops. Doors/windows inherit the host segment's base via `_wallSegBases` (recorded for EVERY wall in updateFloor incl. invisible/layer-hidden) + `_openingBaseY(x,y)` (nearest segment ≤ 500 mm, the snapOpeningToWall reach) — the hinge/pane GROUP is offset so panels, garage slats, gate pickets, deadbolts, shades and curtains ride along; `_keyDoors` carries effGroundMm explicitly. `_groundLevel === 0` short-circuits both to 0 (byte-identical; terrain J16–J19 + fence-gate `grade_zero_identical` pin it; a loop-less floor moves nothing). Terrace-aware wall bases SHIPPED (the fence branch steps onto terraces per segment via the terrace-aware `_itemGroundY`); doorbell pulse rings still ring at slab height for graded gates; mmWave/motion/env coverage-wedge floor decals stay slab-relative (noted follow-up for pole-mounted outdoor sensors). `groundLevelMm = 0` short-circuits **only when no terraces exist** (`groundLevel === 0 && !_hasTerrace`) — at grade 0 a terrace still lifts its content (terrace height is authored, not grade; terrain K8/K8b pin both).
- **Chopper tow point**: the chopper's banner builds with `originCorner = true` — the banner Group origin IS its leading TOP corner (cloth occupies local x ∈ [−len, 0], y ∈ [−bh, 0]; after the +π/2 broadside yaw local +X is the leading direction), the tow wire ends there and the sway pivots there. The PLANE's banner stays centre-origin. (The original build called `_buildBanner` without the corner flag despite the comment describing corner-origin — the wire met the middle.)
- **`_keyBgText` carries NO configRev** (a chatty config-path entity — weather entity, number/switch, GPS fix — rebuilt the rigs every ~25–30 s and snapped the plane/train to their build angle; the v0.29.1 lesson applied to the bg-text group): key = `floorId | w×d | storm | groundLevelMm | wallHash | resolved-entry hash` — exactly what the builders consume (`bgTextsResolved()` was already computed per tick). Belt-and-braces: per-entry animation phase lives in the persistent `_bgTextPhase` (orbit angle / train arc position + wheel spin / sky drift), re-seeded by `_seedBgPhase` so even a legitimate rebuild (text edit) resumes mid-course; survives floor switches, cleared only in `destroy()`. Tests: `bgtext-multi-test.html` (`BGTEXTMULTI PASS 193/193`).
- **Rendering method**: the Sims toon path (see "Sims-style rendering" above) — `_mat()` `MeshToonMaterial` factory + shared gradient map, `NoToneMapping`, no `scene.environment`, blob-shadow decals, inverted-hull outlines. There is NO PBR / PMREM / tone-mapping path anymore; preset light levels in `applyScenePreset` are tuned so a strong directional sun makes the toon bands read.
- **Glass house & wall cutaway** (`Scene3D.glassHouse` / `Scene3D.wallCutaway`, ride the whole-object scene3d persistence): `updateGhostFloors(floors, currentId, scene3d, customObjects, layers, elevMm?)` stacks every non-active floor as a translucent shell (slab 0.30 / walls 0.10 / furniture boxes 0.18) into `_ghostGroup` under the `_keyGhost` dirty key — **story offsets are ELEVATION-driven**: `floorElevationMm(ghost) − floorElevationMm(active)` via the trailing `elevMm` map three-view builds from the FULL `store.floors` (absent map → the legacy `(i − curIdx)·STORY_H` stack, stale-chunk safe and identical under auto elevations); `renderOrder` stays index-based (transparent sort, not height). **Ghost content maps through the ACTIVE floor's world frame** (`asx(wx) = activeFw/2 − wx`, `asz(wy) = wy − activeFd/2`; active dims resolved from the passed floors list, `_fw/_fd` fallback) so identical world coords land at identical scene X/Z across stories — cross-floor registration matches the 2D peek underlay + world-frame geo landmarks (the pre-2026-07-20 own-center mapping misregistered floors with DIFFERENT rect dims by half the dim difference; equal dims masked it). The ghost's OWN w/d only SIZES its slab (rect 0..w×0..d positioned in the shared frame). The transit puppet already used `_w` — one frame now. Test `ghost-align-test.html` (`GHOSTALIGN PASS 22/22`). **Ghost compositing**: every ghost mesh gets `renderOrder = storyIdx − activeIdx` (below-stories draw BEFORE the active transparent pass, above after — pins the transparent sort against the off-origin slab centers; ghost materials were already `depthWrite:false`). **Loop-slab shape-y sign**: a ShapeGeometry rotated −π/2 maps shape (sx, sy) → scene (sx, 0, −sy), so the ghost loop-slab uses `sy = −asz(wy)` = `afd/2 − wy` (same negation the active loop builder documents) — feeding `asz` directly Z-MIRRORED every loop-clipped ghost slab (walls were right, slab mirrored; caught only by an off-center-loop fixture, ghost-align test 4). **Glass-house see-through** (`glass-see-test.html`, `GLASSSEE PASS 26/26`): under glassHouse the dark stairwell/void **void plane** builds `transparent 0.18, depthWrite:false` (opaque otherwise — wells must read as pits); `updateGroundAreas`/`updatePools` take a `glassHouse?` param (stale-chunk-safe default) — yardFill/terrace patches/skirts build `transparent 0.45, depthWrite:true` (the active-slab idiom), water/pool surfaces `min(existing, 0.45)`; no new dirty-key inputs (the toggle rides configRev). Ghost **furniture boxes obey the same layer gates as the active floor** — appliance-category pieces + bins ride `layers.appliances`, everything else `layers.furniture` (both flags folded into `_keyGhost`); ghost slabs + walls always draw (there is no Walls layer; walls always draw on the active floor too). Glass-house mode also drops the ACTIVE floor's wall build opacity 0.45 → 0.22 so rear walls don't cloud the see-through view. Wall cutaway defaults ON (`!== false`): solid wall pieces are tagged `userData.wallCut` + `baseOpacity` at build, collected into `_cutawayWalls`/`_cutawayGhostWalls`, and `_updateWallCutaway()` (per frame from `_animate`) fades foreground walls to 0.06 — predicate: camera on the wall's outward side AND wall roughly between camera and floor center, with an overhead guard so top views hide nothing. Toggles: 🏠 button in the 3D bar + 3D Scene sidebar checkboxes.
- **Target pathfinding** (all renderer-internal): `_buildNav` (end of `updateFloor`) rasterizes a 150 mm nav grid — furniture footprints inflated by `PERSON_R = 170` block (rugs/stairs/BEDS/`elevation ≥ 300` don't — beds are occupiable), solid wall runs block, door/window openings stay walkable — then flood-fills free cells into connectivity **regions** (`_nav.region`, sizes in `_nav.regionSize`). All snap/retarget searches are region-aware (`_nearestFreeCellInRegion`) so avatars never land on the far side of a wall; the base `_nearestFreeCell` is additionally **region-size-aware** — after the first ring `r0` with a free candidate it scans through `r0+4` rings and returns the candidate in the LARGEST region (tie-break nearest), so spawns / retargets / `_regionOfWorld` snaps prefer the real open room over a tiny sliver channel (e.g. the strip between a sofa's inflated footprint and the wall behind it) while never failing when only a sliver exists; a goal unreachable for >3 s (`h.stuckT`) fast-fades the rig and respawns it in the goal's region (same key). Movement is a **carrot-chaser**: the carrot walks the A*-string-pulled polyline by arc-length (the carrot IS the pathfinding walker); `navX/navZ` chase it with a critically damped spring (`nvx/nvz`, ω = 9, substepped ω·h ≤ 0.36 — same divergence gotcha as stepLerp). **Two speeds**: `navSpeed` (nav deltas) drives gait/facing; `rawSpeed` (raw radar deltas) drives sit/activity/bubble triggers — don't cross them. Anchored rigs (`sit/act/lie > 0.3`) bypass nav; pairwise separation holds figures ~380 mm apart (skips lying rigs). 2D dots stay raw radar truth.
- **Despawn modes**: `TargetWorld.edge` (computed in three-view from sensor-local coords: near range/fov boundary) picks the mode when a target vanishes — `fast` (~0.4 s scale-out, walked out of coverage with velocity) vs `slow` (10 s opacity fade, scale held; per-rig outline-material CLONES make the fade possible — the shared `_outlineMaterial` must never be mutated per rig). Re-acquire mid-fade restores.
- **Lying in bed**: settled occupant (>2 s) within the bed's lane capacity (`max(1, floor(bedWidth/700))` side-by-side lanes) → `h.lie` blend: root pitch +π/2 (face up), yaw toward the headboard, y = mattress top, x offset into the assigned lane; enters from the FOOT end (never through the headboard); plumbob hidden, bubble repinned in world space. Occupants beyond capacity stand (no stacking). `Furniture.sharedBedCovers === false` disables the two-person blanket (occupants lie in their lanes instead); sidebar checkbox on bed pieces.
- **AI avatars** (`MotionSensor.avatar` + bound entity on, OR `MotionSensor.demo` for an always-on display presence with no binding — see "AI avatars & demo mode"): three-view appends synthetic targets (`key: 'ai_<id>'`, `TargetWorld.ai`); a renderer-side controller owns a virtual raw position walking A*-verified goals (WANDER → IDLE 4–15 s → ENGAGED 20–45 s when sit/activity/lie captures it). Goals are **hard-confined to the sensor's home room** — the closed wall loop containing the sensor (`_aiHomeLoop` on `_wallLoops`, cached in `updateFloor`; spawn/goal snapping via `_nearestFreeCellInLoop`) — because a simple presence sensor only vouches for its own room; sensors outside every loop roam their nav region. Radar targets from positional (mmWave) sensors are never confined — they follow the radar into adjacent rooms. Everything downstream (nav, dwell, activities, bubbles, despawn fade) treats the AI position as radar truth.
- **AI avatars & demo mode + respawn re-roll**: `MotionSensor.demo` (item-level, persisted; sidebar "Demo avatar" checkbox in the motion editor) makes three-view append the synthetic AI target **regardless of entity binding/state** — `m.demo || (m.avatar && bound entity on)`. A demo rig is pure display (rendered in kiosk/view modes too) and uses the sensor's avatar pool + home-room confinement exactly like a normal AI avatar. **Re-roll**: when a rig is created FRESH (no existing `Humanoid` for the key) and its avatar spec is a POOL (`avatars` array of ≥2, or `'random'`/unknown), `resolveAvatar(..., Math.random)` picks RANDOMLY instead of the stable djb2 hash, so a respawn looks different. `avatarFromPool()` gates this AND exempts pool rigs from the kind-mismatch rebuild (the per-frame stable pick must not fight the rolled kind); a recolor carries the rolled kind over (`forcedKind`). Explicit single kinds and identified people (`person.avatarKind`/pet) never re-roll. Mid-fade re-acquire keeps the same rig unchanged.
- **BLE trilaterated people** (World Outside arc, Feature B — `MotionSensor`-style but from Bermuda BLE distances, not radar): the solver `src/trilateration.ts` (pure, deterministic; test page `test-pages/trilateration.html`) runs weighted Gauss-Newton on ring residuals `d_i = ‖p − p_i‖` (mm), weight `w_i/(d_i+1000)²` where `w_i` is a linear staleness decay; warm-started, step-clamped ≤1500 mm/iter, ≤8 iters, Levenberg-damped so collinear proxies don't blow up. Degenerate: 2 fresh proxies → distance-ratio point on the segment; 1 → constraint-only (hold last position, confidence = the ring). `Planner` tracks the latest distance per (device × scanner) from `state_changed` for the entities in `Planner.bermuda` (LIVE path only — never slow/config; `stateMm`-normalized, dropped >30 s), re-solves per FLOOR on new samples (~0.1 Hz, `_solveBle` — proxies via scanner-link `proxyId` → `BleProxy`), and picks the floor with the best weighted RMS (gn > segment > single). Identity: a `Store.people` entry with `bermudaDeviceId === device.deviceId`, else "unknown" (rendered only when `Store.bleShowUnknown !== false`). `Planner.blePeople` (runtime getter; feeds a per-device lerp slot `ble_<deviceKey>` so 2D dots and 3D rigs read one smoothed source; retires devices unheard-from >120 s). three-view appends synthetic targets (`key: 'ble_<deviceKey>'`, `TargetWorld.ble`) for people on the current floor; the renderer's AI controller runs them in **GOAL mode** (`AiState.mode`) — `_advanceBleGoal` A*-replans (`_bleReplan`) when the solve jumps >400 mm and carrot-walks the rig there at human speed, idling when close (dwell systems may capture it — sitting near the fix is GOOD). No random wander, NO room confinement (real device). 2D: person-colored dot + initials chip + faint confidence circle (`canvas-render.drawBlePeople`, `targets` layer). Renderer smoke test: `test-pages/ble-walk-test.html`. **Identity fusion (B3)** hides a person's BLE ghost once their identity fuses onto a live mmWave target — three-view/2D iterate `Planner.bleUnfused`, not `blePeople` (see "Identity fusion" below).
- **Idle fidgets** (all rigs, when `sit/act/lie < 0.1` + dwell): ambient look-around yaw wobble + weight-shift sway, a picker every 8–20 s rotating through eight one-shots (`IDLE_FIDGETS`: stretch / phone / yawn / scratch_head / check_watch / cross_arms / foot_tap / glance — durations in `IDLE_FIDGET_DUR`), and a wave-on-spawn one-shot. Each composes from the existing hip/knee/shoulder/elbow channels + root pitch/roll (no new joints), blended in/out with a trapezoid envelope × `idleBlend` via the sit-blend idiom (`bl(cur,tgt,w)`). Anchor activities `browse_bookshelf` / `tend_plant` ride the standard activity tier.
  - **`dance`** is a NINTH one-shot (`IDLE_FIDGET_DUR.dance` 4 s) that is deliberately NOT in the `IDLE_FIDGETS` random pool: the picker rolls it (~45 %) ONLY when the rig is standing-idle in a room whose bound TV is ON (a per-frame `danceRoom` flag from the `_tvsByRoom`/`entityOn` check that `watch_tv` uses, read off the RAW target position). Because it's a fidget gated on `idleStanding` (needs `sit < 0.1`), it can NEVER fire while seated — that's the watch_tv disambiguation (dance = standing near a playing TV; watch_tv = seated in its room). Pose = alternating L/R arm pumps + hip sway + knee-bounce + roll on a ~2.2 Hz beat. Being a fidget (not an activity, `h.activity` stays null), it does not suppress thought bubbles.
- **Auto-follow camera** (`Scene3D.autoFollow`, 🎥 button + sidebar checkbox): per-frame in `_animate`, eases the camera (τ ≈ 1.2 s, current azimuth kept, elevation → ~35°) to frame the bbox of active rigs — one cluster = tight, spread figures = wide, none = full-floor sims pose. Manual orbit pauses it 6 s (OrbitControls start/end).
- **Camera views**: renderer exposes `cameraView()` / `setCameraView(pos, target)` / `applyViewPreset('iso'|'top'|'front'|'back'|'left'|'right'|'sims')` (framed to floor extents). The three-view overlay buttons apply them; 💾 saves the current pose into `Store.views3d` (global, scene coords). **Sims cam**: `applyViewPreset('sims')` frames a dimetric pose (45° azimuth, elevation `atan(1/√2)`≈35.26°, distance `max(fw,fd)*1.35`, target `y≈600`). `setSimsCam(on)` toggles azimuth snapping: a single OrbitControls `'end'` listener (registered at init, gated on the `_simsCam` flag) sets `_snapAzimuth` to the nearest 45°, and `_animate` eases the camera about the target toward it (cleared within ~0.5°). Only azimuth snaps — polar/zoom stay free. The three-view "💎 Sims" button applies the preset + enables snap on first click, disables on the next (runtime-only, `_simsCamOn`; not persisted).
- **Below-horizon orbit + independent H/V FOV** (`Scene3D.belowHorizon`/`fovV`/`fovH`, all optional/opt-out, whole-object through `scene3d`; Settings ▸ Display "Camera" subsection): `setBelowHorizon(on)` sets `_controls.maxPolarAngle = on ? π−0.02 : π·0.49` (below the horizon you see the DoubleSide slab underside — intended). `setFov(fovV, fovH)` decouples horizontal from vertical WITHOUT a custom projection matrix by driving the camera's EFFECTIVE aspect: `_camera.fov = clamp(fovV,10,120)`; `_camera.aspect = fovH==null ? _lastCanvasW/_lastCanvasH (auto, today's behavior) : tan(clamp(fovH,10,150)/2) / tan(fovV/2)` (a fixed frustum — the canvas letterboxes/stretches if its shape differs; that's the feature). `resize(w,h)` stores `_lastCanvasW/H` then routes through the shared `_applyCameraFov()` so a resize never clobbers a custom H FOV. three-view calls both setters per tick guarded by last-applied values (no dirty key). applyViewPreset/setCameraView/Sims cam never touch fov/aspect. (The auto-follow `aspectAdjust = min(1, cam.aspect)` framing-fit reads the now-FOV-derived aspect — acceptable, framing just tunes to the fixed frustum.)
- **Camera pivot / free movement** (`Scene3D.pivotLocked?` **absent = true** + `Scene3D.freeMovement?` **absent = false** — two INDEPENDENT booleans; `Scene3D.cameraPivot` is DEPRECATED, still READ for back-compat, never written again; ✋ free-movement + 📌 pivot-lock 3D-bar buttons + two checkboxes in Settings ▸ Display Camera; rides scene3d whole-object + the card `scene3dOverride` merge, NOT in the card editor/validator). Resolution is the pure `resolvePivotMode(sc3)` (geometry.ts, types-only): either new field present ⇒ use them (defaults above), else legacy `cameraPivot === 'free'` ⇒ `{locked:false, free:true}`, else `{locked:true, free:false}`. `setCameraPivot(locked, free, cx, cz)` (self-guarding per tick like setFov; the CENTRE refreshes unconditionally — it moves with the floor rect / glass-house union) drives the matrix:
  - **locked + !free** (the DEFAULT): `enablePan false` (kills mouse + two-finger pan) + per-frame `_updateCameraPivot` (τ≈0.5 s) easing `target.x/z` home while translating the camera by the IDENTICAL delta (azimuth/elevation/distance preserved — the view slides home, the world doesn't rotate; snap-stop <1 mm; `target.y` never touched).
  - **locked + free**: pan ENABLED, but OrbitControls' rotate is SURRENDERED (`enableRotate = false` — it can only ever spin about its own target, which the pan just moved) and `_installPivotRotate`'s own pointer gesture rotates the {camera.position, controls.target} pair RIGIDLY about the plan centre instead. Deltas mirror OrbitControls exactly (`dAz = −2π·dx/clientHeight`, `dPol = −2π·dy/clientHeight`, rotateSpeed 1); azimuth = `makeRotationY(dAz)` about the vertical through P (increases `atan2(x,z)` by dAz = OC's `theta -= …`); polar axis = `normalize(Ŷ × û)` where û is the unit HORIZONTAL part of (camera − P), with the camera's own right-vector horizontal projection as the |û|<1e-6 fallback; the polar delta is CLAMPED by computing the post-rotation angle and REDUCING dPol into [0.05, `controls.maxPolarAngle`] (so it honours `belowHorizon`), never by snapping after. **P's HEIGHT is captured at pointerdown**, not re-read per move — a rigid rotation gives an off-pivot target a y component, so re-reading `target.y` would walk the pivot and sink/raise the view through a long drag. `_updateCameraPivot` is INERT here (easing home would undo the pan, which is the point). Gesture rules: PRIMARY unmodified button or a single touch pointer; a SECOND pointer abandons the gesture to OrbitControls' 2-finger dolly/pan; zero per-move allocation (module scratch `_pvt*`). Coexists with the tap gate (which discards anything past its movement slop) and pauses autoFollow/cinematic 6 s explicitly, because OC dispatches no `'start'` when `enableRotate` is false (it DOES still dispatch `'end'`, so the sims-cam 45° snap composes as it does for a pan today).
  - **!locked + free** = classic OrbitControls, byte-identical. **!locked + !free** = degenerate but defined (pan off, stock rotate, no enforcement).
  Pivot centre = current floor centre (scene (0,0)), or `floorsUnionCenter(enabledFloors)` (pure, geometry.ts — origin-anchored rects ⇒ `max(w)/2, max(d)/2`) mapped through the ACTIVE floor's `_w()` frame under glassHouse. **Precedence**: `_updateCameraPivot` early-returns while autoFollow OR cinematicOrbit (they own the target; pan stays disabled) — the custom rotate deliberately still WORKS during them and pauses them, exactly as stock rotate does. Presets/`cam=` poses set their own target and then ease home (accepted, mode-consistent). Test `camera-test.html` (`CAMERA PASS 60/60`).

### Neighborhood overlay (OpenFreeMap/OSM — roadmap P5)
`Store.neighborhood?: NeighborhoodConfig` (opt-in `enabled`, in `_normalizeStore`'s field list — covers load + undo; research `docs/research/neighborhood-openfreemap.md`): surrounding buildings/roads/water/landuse from OpenFreeMap vector tiles (z14; custom `{z}/{x}/{y}` template with http(s)-only scheme check), positioned by the landmark `geoFit` (feature inert when quality 'none' / disabled / `isOffline`). **Data layer** (all three-free): `src/mvt-decode.ts` (zero-import hand-rolled MVT/protobuf decoder, mqtt-ws discipline — never throws, garbage → empty; real-tile fixture corpus in `test-pages/fixtures/mvt/` incl. a dense-Brooklyn tile), `src/neighborhood.ts` (tile math, height resolution `render_height` → `levels × defaultLevelHeightM` → 1 storey with `verticalScale` folded AT EXTRACTION, road `widthMm` by class, exclusion helpers — buildings drop on footprint intersection, road segments filter by midpoint, `capBuildings(list, origin, n = MAX_BUILDINGS)` nearest-first with **radius-scaled caps** `buildingCapForRadius(r) = clamp(round(400·r/500), 400, 1600)` / `roadCapForRadius` (600→1800), `align` dx/dy/rot post-transform), `src/neighborhood-store.ts` (IDB `diorama-tiles`, 30-day TTL, `clearNeighborhoodTiles`). **Planner**: `_reconfigureNeighborhood` (fetch/decode; warm per-session decoded cache + TileJSON template cache) vs `_extractNeighborhood` (pure re-extract — align/verticalScale/exclusion changes NEVER refetch); runtime `neighborhoodData` + `neighborhoodRev`; `setNeighborhood(mut)` / `clearNeighborhoodCache()`. **Renderer** `_neighborhoodGroup` (active-floor world frame — the ghost-floor `asx/asz` mapping incl. the shape-y NEGATION; cleared on floor switch): toon-extruded building prisms (ONE shared `_mat()` per update, default concrete `0x9aa2ab`, podium `baseMm` support, self-intersecting rings pre-rejected, NO outline shells/blob shadows, all outlineSkip), road ribbons via `bufferPolyline` at **y=3**, water **y=2**, landuse (opt-in, default off) **y=1** — below user ground paint (elev+4) so the user's own yard always wins; road-ribbon cap passed as `cfg.maxRoads` (three-view sends `roadCapForRadius`; renderer default stays 600 — neighborhood.ts stays a TYPE-only import in the renderer so the pure module never enters the lazy chunk). **Camera-distance-tracking frustum for far radii** (`_applyFrustumForRange(req|null)` + per-frame `_updateDynamicFrustum`): the stock camera triple (near 10 / far 150000 / maxDistance 45000) is LOAD-BEARING (far raised in v0.24 for banner orbits; 15000:1 depth ratio protects the polygonOffset outline shells) and restores EXACTLY (strict ===) whenever the overlay is off/empty/near-only. `_applyFrustumForRange` is only a REQUIREMENT RECORDER — stores `req` (content max extent from the scene origin, computed in `updateNeighborhood`), raises `maxDistance = clamp(req·2.2, 45000, 8500000)` (2.2 ≈ 1/tan(fov/2) at the 50° default + margin — the whole extent is frameable), force-applies one update. The far plane is measured FROM THE CAMERA, so the governing invariant is **`far ≥ camDist + 1.25·req + 30000`** — the previous STATIC far violated it on zoom-out, dragging the far-clip boundary in through the tile content so the horizon crept toward the property (user-reported, fixed). `_updateDynamicFrustum` runs each frame from `_animate` (after `controls.update()`, before render; inert with no recorded requirement; zero alloc): `far = clamp(camDist + 1.25·req + 30000, 150000, 13500000)`, `near = max(10, far/15000)` (ratio pinned), projection rewritten only past 5 % hysteresis. **Per-source requirement union**: reach is recorded PER SOURCE via `_recordFrustumReq('nbhd'|'flights', mm)` (`_frustumReqNbhd`/`_frustumReqFlights`); far/near widen to their MAX; the stock triple restores (strict ===) only when BOTH are absent. The flight shell records `flightShellReachMm(_flightShellMm)` (≈342 383 at the 300 m default draw radius, ≈1.14e6 at the 1000 m max) while aircraft are drawn AND the Flights layer is visible (re-evaluated in `setLayerVisibility`; cleared in `clearTransientGroups`/`destroy`). **Asymmetry** (documented at the recorder): only the neighborhood requirement raises `controls.maxDistance` — `_applyFrustumForRange(requiredMm, orbitMm)` takes the orbit term separately (framing a km-scale overlay needs the pull-back; a transient overflight must not change zoom feel). Ceilings sized for the 3 km worst case (reach ≈3.8e6 → maxDist 8.36e6, far 13.14e6); at the far ceiling `near = 900`, still under the controls' `minDistance` 1000 — do NOT raise `CAM_FAR_CEIL` without also raising `minDistance`. `resize`/`setFov`/presets never touch near/far (verified); the stock restore always wins over a pending dynamic value; auto-follow/cinematic orbit just get tracked; the sky dome needs no change (`depthWrite:false` + renderOrder −10 — buildings overdraw it at any far plane). Radius clamped 100–3000 m in ONE place — `Planner.neighborhoodRadiusM()` (tilesForRadius ~16–36 tiles at 3 km by latitude). Dirty key `_keyNeighborhood` (configRev | neighborhoodRev | layer flags | opacity/colors | maxRoads); `Layers2D.neighborhood` (absent = on) in setLayerVisibility + the sidebar layer defs. **2D** `drawNeighborhood` (early in drawAll, after bg before ground): muted water fill, faint building fill+outline, px-clamped road centerlines, dashed-red exclusion masks (edit mode). **Exclusions**: draw-latch `drawingExclusion` (tool `nbhd_excl`, presence-zone idiom; 3–12 verts, dblclick/Enter finish, ESC cancel; no vertex-drag v1 — delete + redraw). **Sidebar** `_section('neighborhood', …)` (the user-pinned home for overlay/alignment controls): enable, fit-dependency status, layer checkboxes, verticalScale 0.2–3 + defaultLevelHeightM 2–5 + the "most OSM buildings carry no height data" honesty hint, align nudges (dx/dy arrows + ↺/↻ 0.5°/5°, shares `diorama:moveStep`, one undo step each, Reset), opacity 0.3–1, color rows, exclusion list, Refresh tiles. **Settings ▸ Integrations** "Neighborhood (OpenFreeMap)" block (enable/source/custom URL/radius 100–3000 m + tile-volume note/Clear cache/usage note). **Attribution (compliance, non-configurable — but layer-following)**: fixed bottom-left chip in app.ts — `© OpenStreetMap · OpenFreeMap` links — whenever enabled + data present AND `layers2d.neighborhood !== false` (a hidden layer displays nothing, so its line hides too and returns with the layer; the flights line likewise follows `layers2d.flights`), all UI modes. Tests: `neighborhood-test.html` (`NEIGHBORHOOD PASS 95/95`), `neighborhood-render-test.html` (`NBHDRENDER PASS 95/95` incl. the asymmetric-footprint mirror catch + the dynamic-frustum invariant/hysteresis/restore matrix).

### Flight & satellite tracking (roadmap P4)
`Store.flights?: FlightsConfig` (opt-in `enabled`, in `_normalizeStore`'s field list; research
`docs/research/flight-tracking.md` — live-curl-verified source landscape — plus
`docs/research/flight-fields-models.md` for the field/archetype enhancement): live ADS-B aircraft +
the ISS rendered in the 3D sky. **Sources**: `cloud` (default — **airplanes.live**, the ONLY
CORS-open keyless ADS-B API; adsb.lol/adsb.fi send no CORS header, OpenSky is CORS-locked to its
own origin AND ToS-forbidden — never add it), `local` (the user's receiver `aircraft.json` URL —
tar1090/readsb need a user-added lighttpd CORS block, documented in the research doc; the Settings
block shows a LIVE mixed-content warning when an https panel binds an http URL), `entity` (HA
rest-sensor proxy — attributes carry an aircraft array under `aircraft`/`ac`/`flights`; the bound
id is config-path in `_isSlowEntity`). **Pure data layer** `src/flights.ts` (ZERO-import,
importable by BOTH the app graph and the renderer chunk — the avatars.ts precedent):
`FlightPoint` (incl. `reg`/`typeCode` uppercased/`typeDesc`/`operator`/`emergency` (`"none"`→null)/
`squawk` + `military`/`interesting`/`pia`/`ladd` from the `dbFlags` bits 1/2/4/8),
`normalizeAircraftList` (mqtt-ws discipline — `{aircraft}`/`{ac}`/bare-array +
fr24 aliases, no-position + `alt_baro === 'ground'` filtered, **`C*`/`B3` non-aircraft categories
dropped** (ground vehicles/obstructions — the ground sentinel can't catch airborne-flagged ones),
never throws), `isEmergency` (enum non-null OR squawk 7500/7600/7700), `FLIGHT_LABEL_FIELDS` +
`sanitizeLabelFields` (keys `callsign|reg|type|operator|alt|speed|trend|squawk|dist`, default
`['callsign','alt']`), `aircraftModelKind` (legacy 3-way — provably `legacyModelKind(aircraftArchetype(null, cat))`),
`MAX_AIRCRAFT` 50 nearest-first, and the **display-shell compression** (deliberately NOT to scale — the neighborhood honesty precedent): `compressRadiusMm`
(**radius-anchored PIECEWISE-LINEAR mapping**: `u = clamp(d/R, 0, 1.05)`, `f(u) = 0.75·u` for
u ≤ 2/3 else `1.5·u − 0.5`, `r = shellMm·f(u)`) — the two slopes are DERIVED, not tuned, from the
user's two anchors `f(1) = 1` and `f(2/3) = 1/2` ("an aircraft at the configured radius renders
AT the rim; 10 of 15 nm renders half way out"), so the shell is a scale model of whatever radius
is typed and 10-of-15 reads identically to 20-of-30. Both predecessors are user-reported
failures: the asymptotic `rMax·d/(d+K)` never reached the rim (10 nm sat at 71 %), and the power
law `u^P` (P = ln2/ln1.5) hit the anchors but COLLAPSED the near field (2 nm of 15 ⇒ 3 % of the
shell, "rendering over the house") — see the piecewise-linear note further down. The 1.05
headroom is dead-reckoning slack past the rim (the planner filters d > radiusNm); zero/garbage
radius falls back to `FLIGHTS_DEFAULT_RADIUS_NM`. Plus
`compressAltitudeMm` (log 2 500–**66 000** mm band over 0–45 000 ft) — **but the two curves are NOT
independent**: `flightDisplayAltitudeMm(altFt, distNm, rMm)` (the ONE place display height is
composed) caps the log curve at the TRUE elevation angle, `dispY = max(clearMm,
min(compressAltitudeMm(alt), r·altM/distM))`. Under the piecewise-linear mapping the cap's
algebra is simple: on the sub-midpoint branch (r ∝ d) `dispY_elev = shell·0.75·altM/(NM_M·R)` —
EXACTLY constant in d (test-asserted, spread ~2e-11 mm), rising only above the midpoint —
"farther = lower in the sky" is purely an ANGLE property (angle == true on the elevation branch,
and TRUE angle falls with distance) — the tests assert the display elevation ANGLE sweep, never
dispY monotonicity. At the
default radius the elevation branch (or the clearMm floor) always wins; the log curve governs
only at small radii (both branches stay test-witnessed via a radius-swept parity grid). A plane
genuinely overhead still reads overhead; elsewhere the display angle can only be ≤ the true one.
**`FLIGHT_SHELL.clearMm` (6500) is the hard property-clearance render floor** and the single
exception to angle-honesty: NOTHING may draw lower (a plane must never be able to hit the house).
The elevation cap made the old 2500 mm `yMinMm` floor reachable for ALL distant low traffic —
approach traffic at 1500–2000 ft skimmed the yard (user-reported, second report of the batch);
`yMinMm` survives only as the altitude-curve 0-ft anchor, never the render floor. Aircraft
≲1316 ft can never clear the floor from the elevation branch (max elev term = 16.2·altM at
rMax 120 000), so very low traffic rides the floor by design. (Before the
cap the altitude band was comparable to the radial shell, so every cruise-altitude jet read
40–60° up at ANY range — user-reported as "all directly above the property".)
**Shell SIZE (third user report of the arc)**: the original 24 000 mm shell put a 7 nm airliner
15 m from the house — absurd once the neighborhood overlay drew real-scale streets, and no longer
disguised once the elevation cap flattened distant traffic into a narrow vertical band ("bunched
up in a much smaller area"). On the base shell 7 nm @ radius 15 ⇒ 42 m (35 %), 10 nm ⇒ 60 m
midpoint, 15 nm ⇒ the 120 m rim (golden-pinned at radius 5/15/30/100). **The mapping is
PIECEWISE-LINEAR through the two user anchors** (fifth report of the arc: the earlier power law
`u^P`, P = ln2/ln1.5, satisfied the anchors but COLLAPSED the near field — 6.5 of 15 nm at 24 %
of the shell "in the backyard", 2 nm at 3 % "over the house"): `f(u) = 0.75·u` for u ≤ 2/3,
`1.5·u − 0.5` above, u clamped to `radialHeadroom` 1.05 (f = 1.075 max); anchors
`radialMidU: 2/3, radialMidF: 0.5` in FLIGHT_SHELL (`radialExponent` is GONE), slopes DERIVED
from them, f(1) = 1 and f(2/3) = 1/2 bit-exact, near field PROPORTIONAL (f′(0) = 0.75 — 6.5 of
15 nm ⇒ 32.5 %, 2 nm ⇒ 10 %, regression-pinned ±1 mm), kink at 2/3 imperceptible
(continuity asserted), radius-invariant in u. The shell
EXCEEDS the 30 000 mm sky dome — harmless: the dome is camera-centered `depthWrite:false`
`renderOrder −10` and can never occlude. `flightDisplayScale(rMm, shellMm) = 1 +
FLIGHT_SCALE_GAIN(0.8)·min(1, rMm/shellMm)` (rim 1.8× — was 2.2/3.2×; a rim aircraft must read
"fairly small", perspective does the work, `modelScale` composes for taste; shell-invariant at
equal u — see the no-similarity note below), composed
MULTIPLICATIVELY with the spawn/fade scale in `_advanceFlights` (read off the eased radius);
`flightShellReachMm(shellMm)` is the frustum requirement both sides share.
**Shell RADIUS is USER-DEFINABLE (fourth user report — "the maximum draw distance needs to be
doubled or tripled; make a user definable draw radius that aircraft will be scaled into")**:
`FlightsConfig.shellRadiusM` (metres, **default 300**, clamp **60–1000**, exactly-the-default →
undefined in `setFlights`, the modelScale idiom; Settings ▸ Flight tracking "Draw radius (m)").
120 000 mm is now the AUTHORED REFERENCE (`FLIGHT_SHELL_BASE_MM`) — every FLIGHT_SHELL mm figure
is a BASE value and every shell-geometry function takes a TRAILING optional `shellMm =
flightShellMm()` (`compressRadiusMm` / `compressAltitudeMm` / `flightDisplayAltitudeMm` /
`flightDisplayScale` / `flightDisplayPos`; absent = the 300 m default, so every stale caller
still agrees). POSITIONS are a **similarity transform** by `s = shellMm / FLIGHT_SHELL_BASE_MM`
(planX/planY/dispY all carry the factor) — but **`flightDisplayScale` deliberately does NOT**
(= `1 + gain·min(1, r/shellMm)`, shell-invariant at equal u; rim 1.8×). This has now flipped
BOTH ways, so pin the reasoning: a leading `s` on the model scale makes position AND size scale
together, which preserves every apparent angle and apparent size from the house viewpoint — the
"Draw radius (m)" knob became a perceptual NO-OP (user-reported: "setting the draw distance
larger or smaller doesn't change how far it is away"). Without it, a bigger draw radius
genuinely reads farther (perspective shrinks the model); `modelScale` is the size-taste lever.
Elevation-angle honesty is untouched EXCEPT where the floor bites. Two things deliberately do NOT scale: **`clearMm` (absolute physical clearance over
a physical house — load-bearing now that the shell is configurable)** and the altitude anchors
`altRefFt`/`altMaxFt` (real-world feet). `flightShellReachMm(shellMm)` scales the reach (≈342 383
at 300 m, ≈1.14e6 at 1 000 m — far inside CAM_FAR_CEIL 13.5e6); the `FLIGHT_SHELL_REACH_MM`
CONSTANT stays exported unchanged as the base reach (stale-chunk back-compat) and the renderer
records `_recordFrustumReq('flights', flightShellReachMm(this._flightShellMm))`. Plumbing:
three-view passes `shellMm: flightShellMm(cfg.shellRadiusM)` in the `updateFlights` opts
(config-path → configRev → `_keyFlights`, no new dirty-key input), the renderer stores ONE
`_flightShellMm` read by `_flightScenePos` + `_flightRigScale` + the frustum recorder, and
canvas-render resolves the same value for `flightDisplayPos` so the 2D dot and the 3D rig can
never sit at different distances. A live rig EASES onto a changed shell (a poll is a correction,
never a jump cut). `FlightsConfig.modelScale` (0.5–4, default 1; clamped in `setFlights` AND the renderer,
exactly-1 → undefined) folds into `_flightRigScale` as a THIRD multiplicative term — `fade ×
flightDisplayScale(r) × modelScale` — the ONE site build/rebuild/advance all read; plumbed via
the `updateFlights` opts (stale-chunk default 1); "Model size ×" in Settings ▸ Flight tracking. Deliberate trade: flights do NOT raise `controls.maxDistance` (a transient overflight must
not change the scene's zoom feel), so a down-tilted default pose may need an upward orbit to see
the traffic band. The renderer's
zero-alloc `_flightScenePos` calls the SAME helper (it MIRRORS, not calls, `flightDisplayPos` —
flights-render-test pins the two together). **`FLIGHTS_DEFAULT_RADIUS_NM` = 15** (was 30),
exported from flights.ts and consumed by the planner (query + filter), both renderers (the
compression knee K) and the Settings input, so the shell can never disagree with the aircraft
actually fetched; clamp stays 5–100, stored `radiusNm` untouched. Plus `flightBearingDistance`/
`flightDisplayPos` (plan-frame mm relative to the HOME anchor). **`src/aircraft-types.ts`** (pure,
zero-import, lands only in the RENDERER chunk): `AircraftArchetype` (8: `ga-high`/`ga-low`/
`twin-prop`/`turboprop`/`narrowbody`/`widebody`/`bizjet`/`heli`), `TYPE_ARCHETYPE` (184 ICAO type
designators — CRJ/ERJ135-145 are BIZJET geometry (rear pods + T-tail), E-Jets narrowbody, PC-12/
King Air low-wing), `aircraftArchetype(typeCode, category)` (table first, then the category
ladder A7→heli/A5→widebody/A4|A3→narrowbody/A2→twin-prop/A1→ga-high/A6→bizjet/none→narrowbody;
never throws), `legacyModelKind`. `src/adsb-sources.ts` is the ONLY
fetch site (weather.ts isolation; wheretheiss.at velocity arrives km/h → normalized km/s).
`satAltAz(obsLat, obsLon, satLat, satLon, altKm)` in sky-astro.ts (spherical-earth ECEF→ENU, az
CW-from-north matching `raDecToAltAz`). **NOTE: planner imports `satAltAz`, which moved sky-astro
+ sky-catalog into the STARTUP chunk** (net shipped bytes unchanged — the renderer shares the
copy; chunk split verified intact). **Planner**: `_reconfigureFlights`/`_flightsInited` (weather
idiom; offline does NOT block — the cloud source works in the gh-pages demo; only `enabled` +
origin gate), poll clamp 5–60 s default 8, ISS on its own 10 s timer for all sources (`iss !==
false`); runtime `flightsNow`/`flightsAt`/`flightsRev` (bumps on ISS changes too — ONE dirty-key
input)/`issNow`/`flightsStatus` (`off|no-origin|ok|error`; 'error' only when nothing cached —
stale-tolerant) + public `flightsOrigin()` (geo-fit origin → `weather.lat/lon` → null — the
observer chain, do not fork a second one). **Routine polls are LIVE-path — they must NEVER
`emitConfig()`** (user-reported regression: a per-poll configRev bump rebuilt every
configRev-keyed 3D group each 8 s — weather particles re-seeded, the decorative bg-text
plane/train snapped back to their build angle). The renderer needs no config event —
`_tickOnce` recomputes `_keyFlights` every tick, so `flightsRev` alone drives `updateFlights`;
the 2D RAF reads `flightsNow` per frame. `emitConfig` fires ONLY on structural transitions:
`flightsStatus` change, `flightsNow`/`issNow` null-transitions (the attribution chip), and
`_computeFlightAlerts()` returning changed. The entity source needs no emit of its own — the
bound id is config-path in `_isSlowEntity`, so HA's state_changed already emitted (cadence =
the rest sensor's user-controlled scan_interval). Regression-pinned: flights-test asserts two
routine polls leave `configRev` UNCHANGED while `flightsRev` advances twice. **Renderer**: `_flightsGroup` positioned at the home
anchor's scene coords (anchor = geo `tx/ty` when fit exists, else floor centre; rig offsets =
`(−planX, dispY, +planY)`), **NOT in `clearTransientGroups`** (home-relative, persists across
floor switches like `_skyGroup`), in `destroy()`, `layers.flights` via setLayerVisibility.
Persistent `_flightRigs` keyed by ICAO hex (humanoid idiom — mutate in place): `_buildAircraftModel`
is **8-way archetype-driven** (the RENDERER resolves `aircraftArchetype(fp.typeCode, fp.category)` —
rebuild-on-change lives in one place; `_flightArchetypeMetrics` is the single source of truth for
fuselage dims + attachment points; military → olive tint), ~2× the original scale with the
identifier (callsign else reg else hex) painted on BOTH fuselage flanks via the two-FrontSide-plane
technique (`_buildFlightIdPlanes`, un-mirrored glyphs, one shared map, dedup-freed); an archetype/
military/privacy change REBUILDS that hex's rig in place without losing motion state. Piston
archetypes (ga-high/ga-low) + callsign tow the REAL banner (`_buildBanner` +
`_makeBgTextTexture('banner')`), everything else gets a camera-facing sprite label plate rendering
`sanitizeLabelFields(flights.labelFields)` (absent = callsign + **real altitude ft** — honest where
the shell is not; alt/speed/dist bucketed for repaint discipline); labels repaint only on text
change, per-rig CanvasTextures freed on rig dispose. **Status beacons** (`flights.beacons !==
false`): ONE emissive bead + additive glow sprite per flagged aircraft, priority **emergency red >
interesting yellow > military green > LADD white**, pulsed ~1.2 Hz in `_advanceFlights` off a
per-rig phase (zero-alloc); the glow wraps a renderer-lifetime shared texture —
`_disposeSpriteMaps` gained a `userData.sharedMap` opt-out so the per-rig sprite sweep never frees
it. **Privacy dimming** (`flights.privacyDim !== false`, research §4.2): PIA/LADD rigs build
translucent at 0.45 (which also skips outline shells) with a 🔒 label badge; PIA additionally
blanks identity everywhere (fuselage + label show the hex, no towed banner); LADD keeps its
identity + white beacon. Config plumbing rides an optional trailing `updateFlights` opts arg
(stale-chunk safe; labelFields/beacons/privacyDim are config-path → `configRev` already covers
them, no new dirty-key inputs). `_advanceFlights(dt)` (from
`_animate`, zero-alloc): dead reckoning in REAL space (per-rig `latPerS/lonPerS` from gs/track),
display pos eased τ≈1.5 s (poll corrections glide), yaw shortest-arc τ≈0.3 s — `rotation.y =
atan2(px, −py)`, the SAME convention as the bg tow-plane's tangent formula; `rotation.order='YXZ'`
(XYZ would bank a climbing turn); pitch `clamp(vertRate/6000)·0.12`; prop/rotor spin accumulates
per-rig (never the absolute clock — fresh rigs would pop phase); removal = 0.8 s scale-out then
dispose. **ISS**: `_issGroup` camera-recentered (self-contained in `_advanceFlights` — NOT the
`_skyBuilt`-gated sky block), one sprite (`_issTex` built once, disposed in destroy), position =
`satAltAz` + `_skyScenePos(alt, az, 26000, out, rotRad)` — `_skyScenePos` gained an optional
trailing `rotRad` (defaults `_skyRotRad`; flights pass geo θ explicitly so there's no stale-0 /
double-rotation), dead-reckoned between 10 s fixes from the fix-pair delta, visible only above
the horizon with a ramp-in. three-view `_keyFlights` = `configRev|flightsRev|layers.flights`
(in the floor-switch blank list; disabled/no-origin → empty list = cheap inert). **2D**
`drawFlights` (late in drawAll, `flights` layer absent = on, sidebar layer "Flights"): dart glyph
rotated to track, labelFields-driven text, olive military, pulsing priority-colored beacon ring,
privacy dim (glyph/text at 0.45/0.5 alpha); canvas-render exports the pure `flightBeaconColor`/
`flightFieldText`/`flightLabelLines` (mirrored ~6/20-line copies of the renderer's resolvers —
canvas-render must never import the three.js chunk; hoisting both into `flights.ts` is a noted
follow-up). **Alerts**: `AlertSource` gained
`'flight'`; `buildAlertFeed(notifications, repairs, cfg?, extra?)` — the optional 4th channel
appends already-built CLIENT-LOCAL alerts verbatim (source toggles/severity floor deliberately
don't apply). `Planner._computeFlightAlerts()` (after each aircraft poll + ISS update): low
overflight (`alerts.lowAltFt`, within 3 nm, severity warning, 10 min/hex cooldown), watch-list
(uppercase callsign-prefix or exact hex, info, 30 min/hex), ISS rise (alt crossing 10°, edge
detector `_issWasUp`, info), **emergency** (`flight:emerg:<hex>`, severity `error`, no 3-nm gate,
exempt from the 15-min prune AND the newest-wins cap eviction while active, refreshed IN PLACE so
routine polls still report "unchanged" — live-path emit discipline intact; dismissal re-arms after
10 min); prune 15 min cap 8; `dismissAlert` 'flight' branch is hass-free and
a dismissal RE-ARMS once the cooldown passes (stable per-hex ids would otherwise mute forever);
returns `changed` — call sites own the single `emitConfig`. A low overflight also pushes
`householdEvents` kind `flyover` (x/y null = house-wide) → `BUBBLE_POOL_EVENT.flyover` ✈️👀🛩️.
**Settings ▸ Integrations "Flight tracking"** block (status line w/ aircraft count + poll age,
source radios w/ the airplanes.live privacy disclosure + CORS/mixed-content hints, radius 5–100 nm default 15,
poll, min/max alt filters, "Callsign labels" + a 9-checkbox "Label fields" grid (canonical order,
gated behind "Callsign labels") + "Status beacons" + "Dim privacy-flagged aircraft" + "Track the
ISS", alerts sub-group — the watch-list normalizes in `setFlights` (trim/uppercase), and
`setFlights` sanitizes `labelFields`, not the UI, so imports get the same shape).
**Display + inspection wave.** `FlightsConfig.banners?` (absent = ON) makes the piston tow-banner
optional (`updateFlights` opts, stale-chunk-safe; "Tow banners (small planes)" under the labels
master). **Fuselage lettering follows real livery**: `_flightFuselageText` puts the OPERATOR on
both flanks and the IDENTIFICATION on a flat **spine plane** for `FLIGHT_BIG_FUSELAGE`
(narrowbody/widebody/bizjet/turboprop/twin-prop) whenever an operator is known; no operator →
identity back on the flanks with no spine plane; GA singles + helis keep flanks-only; PIA still
shows the hex and withholds the operator on every surface. The spine plane is
`rotation.order='YXZ'; set(−π/2, −π/2, 0)` (local +X → world +Z, +Y → world +X = nose-to-tail
from above); metrics gained `topY/topZ/topH/topLen` — `topLen` is per-silhouette because the fin
root, cockpit glass and the turboprop's HIGH wing sit ON the spine, and the pure `fitTextPlane()`
shrinks BOTH dimensions so a long operator never squashes. `idKey` is `"flank|top"`. **Every
flight material carries `fog:false`** — aircraft are sky objects past the weather FogExp2
falloff; the outline shells use a PER-MODEL clone (the shared `_outlineMaterial` must keep
fogging for ground geometry, and `_disposeSubtree` would free it). **Aircraft are clickable**:
`_tagFlightAsm` tags the rig ASSEMBLY only (`kind:'flight'` + `hex`), so any part — airframe,
label sprite, banner — walks up to one aircraft; the fixture-click union is the exported
`FixtureClickKind`/`FixtureClickInfo` (+ optional `hex`) tested via `FIXTURE_CLICK_KINDS`, and
`_flightsGroup` joins the raycast roots when visible. three-view dispatches `open-flight-info
{hex}` (view refuses; dblclick ignores flights). **Touch tap gate + fat-finger pick** (user-
reported: phone taps on planes never opened the card): the manual pointerdown/up tap gate is
POINTER-TYPE aware — touch gets 12 px / 600 ms (canvas-2d's synthesis constants; `TAP_SLOP_PX_*`/
`TAP_MAX_MS_*`), mouse/pen keep 5 px / 500 ms — and when the precise raycast misses,
`_raycastFlightNear(x, y, maxPx)` (28 px touch / 12 px mouse) picks the nearest on-screen,
non-faded, in-front-of-camera flight rig by projected screen distance (the 3D analog of
`flightHitPx`; zero-alloc `_v3pick*` scratch). Runs AFTER `_raycastFixture` and BEFORE
`_raycastVacSeg` — a fixture under the finger always beats a distant dart; a proximity hit clears
the dblclick timer (flights have no dblclick, a second tap re-opens the card). 2D: `drawFlights` publishes `flightHitPx`
(world anchor + px radius, the `envChipHalfPx` idiom) which `drawAll` clears OUTSIDE the layer
gate so a hidden layer is untappable; `hitFlight` + `tryOpenFlightInfo` run LOW priority in both
click branches. `<diorama-flight-modal>` (modals.ts, alarm/thermostat recipe, mounted in app.ts)
is a READ-ONLY card — real altitude/speed/distance/bearing/fix-age, status chips, PIA
anonymization, "signal lost" when the aircraft leaves the feed — fed by the new
`Planner.flightByHex(hex)` and repainted on the LIVE channel while open. NB flights-ui-test's
`canvas-render.mod.js` is a COMBINED bundle of canvas-render + canvas-hit + canvas-interact from
one temp entry (separate bundles would each get their own `flightHitPx` module instance).
**User glow rules** (`Store.flights.glowRules?: FlightGlowRule[]`, cap 30, research
`docs/research/flight-glow-rules.md`): an ordered, FIRST-MATCH-WINS list (the `evalRules` idiom)
assigning a colour + animation pattern to matching aircraft. Whole surface is pure, in
**`src/flights.ts`** (still zero-import, shared by both graphs): `globMatch` (hybrid wildcard —
plain text = substring, any `*`/`?` = ANCHORED, `?` = exactly one char, case-insensitive;
hand-walked + escaped so user text NEVER reaches `new RegExp` unescaped — this must not become a
second real-regex surface), `matchesGlowCriteria` (AND across present criteria: 6 wildcard
strings / 3 numeric min-max pairs — a null live field FAILS rather than passing / 5 tri-state
flags), `resolveFlightGlow(fp, rules, beaconsOn)` (**the one home for the whole ladder**, called
by 3D AND 2D: master `beacons` gate → EMERGENCY unconditionally, before any rule → first enabled
match REPLACES the default → today's unchanged interesting/military/LADD; `pattern:'none'` →
null = a supported mute), `flightGlowFrame(pattern, tSec) → {alpha, glow, mix}` (7 patterns:
none/solid/flash/strobe/rotate/fade/alternate; `flash` IS the shipped 1.2 Hz envelope verbatim,
`glow` is a genuine SECOND curve because bead and halo were always driven differently; `rotate`
floor-clamps at 0.35 — real beacons never go fully dark), `lerpHexColor`,
`sanitizeFlightGlowRules` (run in `setFlights`; **a blank text criterion collapses to
`undefined` — never a match-everything `**`**). Renderer: matching runs at POLL cadence in
`_syncFlightBeacon` (guard widened to `pattern|colorA|colorB`), storing `glowPattern`/
`glowTwoColor` + three persistent `THREE.Color`s on the rig; `_advanceFlights` only samples the
envelope and writes opacity/colour in place (`beaconPhase` accumulates in SECONDS, unwrapped —
`alternate`/`flash` count whole cycles). Zero rules configured is byte-for-byte the shipped
behavior. `glowRules` rides `updateFlights` opts (stale-chunk default = none) + configRev — no
new dirty-key input. 2D `drawFlights` calls the same pair (`solid`+colorB = two rings) — the old
"mirrored ~6 lines" ladder duplication between canvas-render and three-renderer is RETIRED; both
call `resolveFlightGlow`, never re-derive locally. Settings ▸ Flight tracking "Glow rules"
editor (collapsed summary rows, ✎ expand, ▲▼ reorder — order materially changes behaviour).
**Attribution**: "Flight data © airplanes.live" joins the fixed bottom-left chip (stacked with the
OSM line) whenever cloud + enabled + data. Tests: `flights-test.html` (`FLIGHTS PASS 577/577` —
fixture = a REAL 94-aircraft airplanes.live LAX capture; incl. the live-path emit matrix, the
archetype golden matrix, the emergency-alert lifecycle, the shell-rescale golden/property suite,
and §6e's draw-radius clamp matrix + similarity law — the pre-existing derivation goldens run
through an `FB` wrapper that pins `shellMm` to FLIGHT_SHELL_BASE_MM and stay byte-identical), `flights-render-test.html` (`FLIGHTSRENDER PASS 393/393` — heading/pitch signs asserted
via `getWorldDirection`; archetype geometry, livery text layout, beacon priority/gating, privacy
dim, in-place rebuild, distance scale, fog exemption, flight raycast, §4d's non-default-shell
position/scale/frustum parity), `flights-ui-test.html`
(`FLIGHTSUI 271/271` — settings round-trips, flight modal matrix, 2D hit routing; alert-center
67/67 stays green).

### Geo reference & GPS device pins (World Outside, Feature G)
Landmarks (`Store.geo.landmarks`, property-wide/store-level — NOT per-floor) are placed on the plan and calibrated to real-world lat/lon (`src/geo.ts` pure math: equirectangular projection, 2D Procrustes fit scale-locked at 1 + `fittedScale` diagnostic, single-landmark `northDeg` path, median lat/lon, `parseLatLon` manual-entry parse; test page `geo-test.html`). `Planner.geoFit()` returns the fitted `GeoTransform` (+ calibrated landmark list). Landmarks calibrate via GPS sampling OR manual lat/lon entry in the sidebar (paste a `lat, lon` pair into the Latitude field to split both); **manual entry sets `sampledAt` but CLEARS `accuracy`/`sampleCount`** (no sampling run happened — absent `sampleCount` + present `lat` is the "manual" sentinel, shown as `manual · <date>`), so the fit-quality readout stays honest. **GPS device pins (G2)**: `Planner.gpsPins` (runtime getter, cheap, safe per frame) resolves each `Store.people` entry with a GPS source (prefer `person.*` via `haPersonId`, else `device_tracker.*` via `gpsTrackerId`) — reads `latitude`/`longitude`/`gps_accuracy` off the entity, projects via `latLonToPlan`, and classifies vs the CURRENT floor rect:
- `indoor` — inside `0..fw × 0..fd` (GPS indoors is tens of metres off → the pin is a "find my phone" hint, drawn dimmed with a `~±N m indoors` caution, not a placement).
- `yard` — within that rect inflated by `geo.boundaryM` (default 30 m); drawn at true position with an accuracy ring (capped at the boundary so a huge ±m circle can't blow up).
- `beyond` — outside the boundary; `clampToBoundary(fw, fd, boundaryMm, x, y)` (pure helper in geo.ts) clamps to the inflated-rect edge along the ray from the floor **centre**, keeping the true compass bearing (`planBearingDeg(thetaRad, dx, dy)` — inverse-rotates the plan vector into geo E/N; `compass8` for the label) + distance in m for the `Name · 320 m NE` label.

**Landmark CSV import** (sidebar GPS/Geo "⤓ Import CSV" beside "+ Add landmark"): pure `parseLandmarkCsv(text)` in geo.ts (zero-import kept — RFC-4180-ish quoting incl. embedded newlines/`""` escapes, CRLF, header in any order matching `label|name|title` / `lat|latitude` / `lon|lng|long|longitude`, headerless `label,lat,lon` fallback where the first row is data iff its lat/lon parse, per-row `line N:` errors with partial success, 200-row cap, never throws). `Planner.importLandmarksCsv(text)` → `{added, updated, pending, errors}` (edit-only, ONE save/undo step): label-keyed case-insensitive UPDATE follows the manual-entry sentinel exactly (`sampledAt` set, `accuracy`/`sampleCount` cleared); in-file duplicate labels collapse onto one landmark. **Fit-poisoning guard**: with a live fit (snapshotted ONCE before the loop) new rows project via `latLonToPlan` onto their correct plan spots (zero-residual — fit-neutral); with NO fit they import as **`GeoLandmark.pendingPlace`** pins in a spaced row at floor center — `geoFit()` EXCLUDES `pendingPlace` landmarks (the one-line filter) so unplaced imports can never corrupt the transform. Landmarks are NOT canvas-draggable; the only user path writing landmark x/y is the `placingLandmarkId` latch, which now clears the flag (canvas-interact) — placing a pending pin turns it into a real calibrated pair. 2D: pending pins draw amber dashed + `imported · place me`; sidebar rows caption `not placed — imported from CSV`, and the import shows a dismissible added/updated/pending/errors summary. Test `landmark-csv-test.html` (`LANDMARKCSV PASS 147/147`). NB the `record-pin-test.html` fixture's typed lat/lon separation is metrically implausible vs its plan coords (~10× scale mismatch, baseline RMS 9.2 m) — harmless there, but never reuse it for fit-residual assertions.

**Per-landmark alignment exclusion** (`GeoLandmark.excluded?`, absent = participates): a "Use in alignment" checkbox on each calibrated landmark row keeps the pin AND its coordinates but drops it from the fit — the escape hatch for one mis-sampled landmark rotating everything (user-reported: north off 25–30°). `Planner.geoFit()`'s calibrated filter is the ONE site (`!l.pendingPlace && !l.excluded`), so `importLandmarksCsv`'s snapshot fit and every consumer (compass, GPS pins, recorded pins, neighborhood, flights) inherit it; `geo` rides the whole-object passthrough in `_loadFromHa` — no field-list change needed. Distinct from `hidden` (which suppresses the 2D draw entirely): an excluded pin still draws, dashed + dimmed but in its calibrated cyan, captioned `excluded from alignment`. To FIND the culprit, the sidebar shows each participating landmark's reprojection residual (`off by N m`, `fmtDistanceM`, imperial-aware) with the worst in red + ⚠ — from `Sidebar._fitResiduals(fit)`, the single place residuals + the worst-outlier id derive (`_geoFitReadout` shares it so "worst" can't diverge); `transform.residualsMm` is index-aligned with `geoFit().landmarks` by construction. `calCount` (gating the single-landmark north-bearing input) counts only participating landmarks. Everything rides configRev via `updateLandmark`; no new dirty key. landmark-csv-test §8: excluding is fit-identical to deleting, re-including restores θ bit-for-bit, and a 3-landmark fixture whose bad pin drags θ 25°→47° recovers θ = 25.000000° when switched off.

**Suggested landmark position (alignment repair)**: `Planner.landmarkSuggestId` (runtime-only latch, never persisted; cleared in `setUiMode`/`_clearTransientSelection`/`_applyLoadedStore`/`deleteLandmark`) + `landmarkSuggestion()` → `{id, x, y, curX, curY, distMm} | null` — the latched landmark's stored lat/lon projected BACK onto the plan via `latLonToPlan(geoFit().transform, …)`, i.e. the exact endpoint the per-row "off by N m" residual measures against. **Consistency rule: always the FULL current fit, never a leave-one-out refit** — the ghost and the residual readout can never disagree. Fails soft to null (no fit / quality 'none' / unknown id / uncalibrated / pendingPlace / non-finite). `applyLandmarkSuggestion(id)` (edit-only) recomputes the projection FRESH, clears the latch, and rides `updateLandmark` → ONE undo step. Sidebar: a 🎯 "Suggested position" toggle on calibrated rows when a fit exists (latch + `emitConfig` — the `placingLandmarkId` idiom, the 2D canvas reads the latch too) opening a card with the offset (`fmtDistanceM`, imperial-aware), the mm delta, Apply, Cancel. 2D: `drawLandmarkSuggestion` at the tail of `drawGeoLandmarks` (geo layer, EDIT MODE ONLY, zero cost with no latch) — dashed cyan connector + hollow dashed ghost pin + midpoint distance chip. No 3D (2D-first, G1 precedent), no persisted fields, no dirty keys. An EXCLUDED landmark still gets a suggestion — the repair flow for one mis-sampled pin is **exclude → inspect the ghost → apply → re-include**, and because the fit is independent of it the applied position lands exactly right (asserted: θ unchanged, ~0 residual after re-include). NB applying on a PARTICIPATING landmark cannot zero its residual (scale locked at 1 — moving it onto its own reprojection re-pulls the fit); the test asserts a strict rms reduction instead. Test `landmark-csv-test.html` §9 (`LANDMARKCSV PASS 147/147`).

`stale` from the entity's `last_updated` (>15 min). Bound GPS source ids are **config-path** (`_isSlowEntity` returns true for a person's `haPersonId`/`gpsTrackerId`) so the sidebar GPS status re-renders on a new fix (GPS pushes are minutes apart — negligible churn); the 2D canvas RAF reads `gpsPins` live regardless. `Planner.gpsFixFor(pe)` reads the RAW fix (entity/lat/lon/accuracy/age/stale) **independent of geo calibration** — `gpsPins` routes through it, and the sidebar People status line uses it to report honestly ("entity not found" / "no location from <id>" / "fix ±Nm · age — calibrate a landmark to map it" / full zone line) instead of a blanket "no current fix" whenever the transform quality is `'none'`. **2D** (`canvas-render.drawGpsPins`, gated `on(L.geo)`, drawn with landmarks): person-colored teardrop + initials, accuracy ring (not for `beyond`), indoor/stale dimming, age caption. **3D**: camera-facing text sprites in `_gpsGroup` (`updateGpsPins(pins, landmarks)`, reuses `_makeTextSprite`) — GPS pins at `y≈1800` (yard true pos / boundary edge for `beyond`), landmark 📍 sprites near ground; **sprites need `_disposeSpriteMaps` before `_clearGroup`** (same gotcha as env). Dirty key `_keyGps` in three-view: `configRev` + coarse hash (positions rounded to 500 mm + zone + stale) + `layers.geo`; `_gpsGroup.visible` folds into `setLayerVisibility`. The floor rect does NOT grow — `beyond` pins clamp to the ring, `yard` pins render over the void outside the slab (design: no yard slab in v1). Pins render in kiosk/view modes too (display, not editing). Test page `gps-test.html`.

### On-screen compass & north marker
`Store.compass?: CompassConfig` (`{show?, source?: 'auto'|'manual', manualNorthDeg?, anchor?, custom?, showNorthMarker?}` — opt-in, default hidden; in `_loadFromHa`'s explicit field list; `Planner.setCompass(mut)` mirrors `setWeather`). Pure math in **`src/compass.ts`** (three-free, imports only types): `resolveNorth(cfg, geoFit)` → unit true-north vector in the plan frame — `'auto'` (default) uses the landmark fit when `quality !== 'none'`, else `manualNorthDeg`, else plan +Y; `'manual'` always uses the degrees. **Convention**: `manualNorthDeg = B` (the `geo.northDeg` convention — bearing plan +Y faces) ⇒ north = `(−sin B, cos B)`, identical to the single-landmark `R(θ)·(0,1)` path so both sources agree by construction (`planBearingDeg(θ, nx, ny) = 0`). `compassScreenAngle(nx, ny, view, camAz)`: 2D = `atan2(nx, ny)` (CW from screen-up); 3D = `α + atan2(nx,ny) + π` normalized, where `α = atan2(camX−tgtX, camZ−tgtZ)` (derived from the renderer's plan→scene mirror; front preset α=π reduces to the 2D formula). `northMarkerPos(fw, fd, nx, ny, margin=900)` = ray-from-floor-centre rect exit pushed outside the slab. **Widget** `<diorama-compass>` (`src/ui/compass.ts`, light DOM, mounted once in app.ts beside the weather chip, ALL UI modes): pseudo-3D rose on its own DPR-capped canvas (tilted dial, rotated cardinals, two-tone needle) — NO three.js (lazy-chunk rule); positioned via the shared pure `chipAnchorStyle` (default `'tr'`; chip default `'br'` — no collision); self-owned rAF redraws only when the angle moves >0.005 rad (idle frames free; `geoFit` cached per `configRev`); dim `manual`/`unset` caption; edit-mode click → `open-settings` `{tab:'display'}`. **North marker** (gated `showNorthMarker === true`, all modes; NO "N" letter — arrow only, two-tone for dusk contrast): 2D screen-fixed circled arrowhead late in `drawAll` — near-white halo stroke (`rgba(245,245,245,0.9)`) behind a saturated red `#e6291a` glyph; 3D `_compassGroup` + `updateNorthMarker(show, fw, fd, nx, ny, scale)` — TWO stacked flat MeshBasicMaterial chevron decals (documented `_mat()` exemption, outlineSkip; near-white 1.25× backing at y=10 under the red chevron at y=11, renderOrder 2/3; maps from the PASSED fw/fd, never `_w()` — the ghost-floor gotcha; no sprites, the `_disposeSpriteMaps` pairing kept harmlessly), under three-view `_keyCompass` (`configRev | show | nx/ny·1000 | markerScale`). `CompassConfig.markerScale?` (0.5–4, default 1 via pure `markerScaleOf`, envScale idiom) sizes the icon in BOTH views — 2D multiplies the screen-fixed metrics, 3D scales the decal footprints (`updateNorthMarker`'s trailing `scale = 1` param stays stale-chunk-safe); folded into `_keyCompass`. `Store.showFloorStats?` (absent = true, in `_loadFromHa`'s list) gates the bottom-right floor-stats readout in app.ts (name — sensors, walls, W × D; overlays both views); "Show floor info readout" checkbox in Settings ▸ Display. Settings ▸ Display "Compass" block (`_compassBlock`): show, source, manual degrees (dimmed under an active fit), live resolution line, anchor grid + custom x/y, north-icon checkbox + size input. Test page `compass-test.html` (`COMPASS PASS 54/54`; serve the harness over `python3 -m http.server` — Chrome CORS-blocks dynamic module imports on `file://`).

### Weather visuals W3: per-effect toggles + attribute-driven effects
- **Per-effect toggles**: `WeatherConfig.effects?: Partial<Record<WeatherEffectKey, boolean>>` — keys `precip|fog|lightning|wind|clouds|sunPosition|sunDisc|frost|puddles|precipForecast`, resolved by the pure `weatherEffectEnabled(cfg, key)` (weather.ts; defaults ON except `frost`/`precipForecast`). `effects3d` stays the master kill-switch and `layers.weatherFx` the layer gate for GROUP members; **`sunPosition` (orients the sun LIGHT) and `sunDisc` (the sky backdrop's warm sun-glow sprite) are lighting/sky behaviors, NOT group members** — each gated only on its own key + a live source. `sunDisc` zeroes the sprite's opacity TARGET so the existing τ≈2 s ease fades it out rather than popping; the renderer tests `eff.sunDisc !== false` so a stale three-view chunk still shows it; moon/stars/dome are unaffected (`skyBackdrop` remains their gate). three-view folds the resolved booleans into `WeatherFxState.effects`; a stale renderer chunk without `effects` treats all group members as on. Sidebar: indented per-effect checkboxes under "3D effects" (dimmed when master off; sunPosition/sunDisc stay live).
- **New WeatherNow fields** (all optional, null when the provider lacks them): `cloudCoverage`, `visibilityKm` (`toKm` normalizes mi/m), `uvIndex`, `windGustKmh`, `apparentC`, `humidity`, `rainSoon`. Entity source reads public converted attributes (`wind_bearing` may be a cardinal STRING — `parseWindBearing` handles both); Open-Meteo `current=` gained cloud_cover/relative_humidity_2m/apparent_temperature/wind_gusts_10m/visibility + `hourly=precipitation_probability,weather_code&forecast_hours=4` for `rainSoon`.
- **New visuals** (in `_weatherGroup` unless noted; zero per-frame allocation; shared `_cloudShadowTex`/`_puddleTex` disposed only in destroy): cloud-shadow decals drifting with wind scaled by `cloudCoverage` (<30% none) — the shared `_cloudShadowTex` is **pure-black rgb with a soft alpha ramp**, so NormalBlending reduces to an exact multiply by `(1−a)`: darkens any surface, can never lighten one. A dark-but-nonzero rgb is NOT a shadow — textures carry no colorSpace tag, so linear→sRGB output lifts e.g. rgb(20,24,32) to mid-grey ≈(76,84,92), which read as WHITE circles over dark ground (user-reported, fixed). Never tint the decal material; `_buildStormBank` shares the map, so its sprite `color` is multiplied against zero by design; fog density continuously from `visibilityToFogDensity(vis)` (condition `fog` is a floor; 2 s ease kept); **true sun position** — `sun.sun` azimuth (mapped through geo θ in three-view like wind) + elevation orient the preset sun light, eased τ≈2 s in `_animate`; gust bursts (gust > wind+15 → scheduled 1.5 s ~2× drift multiplier); frost icicles + rim at `apparentC ≤ −3` (build-time); **rain puddles** — deterministic seeded decals whose per-floor `_puddleFade` SURVIVES `_keyWeather` rebuilds, lingering ~10 min after rain stops; forecast storm-brewing (rainSoon + dry now → upwind horizon cloud bank + eased sky-tint darken). `_keyWeather` gained bucketed terms (cloud%/10, vis/2 km, gust/10, apparent/3°, sun-az/5°, elevation sign, rainSoon, effects bitmask).
- **Forecast plumbing**: `HaApi.getWeatherForecasts(entityId, 'daily'|'hourly')` in BOTH clients — WS `call_service` `weather.get_forecasts` with `return_response: true`, normalized by the shared `normalizeForecasts` (null on any failure). Planner refreshes entity-source forecasts every 30 min + on reconfigure (`_refreshEntityForecasts` → `forecastCondition` from daily, `rainSoon` from hourly, re-applied over recomputes via `_applyForecastToNow`); the legacy `forecast` attribute read remains only as a pre-2024.4 fallback. **DC-C forecast cache**: `_refreshEntityForecasts` now ALSO retains the full normalized arrays in runtime `Planner.forecastDaily`/`forecastHourly` (`ForecastRecord[] | null`, not persisted; entity temps normalized to °C via the entity's `temperature_unit` so `tempText` stays imperial-correct), `emitConfig`-ing on any array refresh; the Open-Meteo poll fills the same two fields from `weather.ts`'s wider `fetchOpenMeteoForecast` (24 h hourly + 7 d daily, parsed by the pure `parseOpenMeteoForecast`); the sensors source leaves them null; both reset on a source switch. The chip's forecast strip reads them. Test pages: weather-test `WEATHER PASS 200/200`; weather-fx-test gained `?c=w3` (20/20) + `?c=alert` (7/7).

### Sky backdrop, sun & moon props (phase 3)
The scene's flat `THREE.Color` background gains a living sky, all in a dedicated
**`_skyGroup`** (added to `scene.add` + `destroy()`, but **NOT** to
`clearTransientGroups` — the sky isn't floor-relative, so it's built ONCE lazily
via `_ensureSky()` and left alone across floor switches). Config: `Scene3D.skyBackdrop`
(Display ▸ "Sky backdrop" checkbox; **default ON when a weather source is configured**,
resolved in three-view's `_weatherFxState` as `sc3?.skyBackdrop ?? (w != null)` and
passed as `WeatherFxState.skyBackdrop` — a concrete boolean) gates the whole group;
`WeatherConfig.moonEntity` (Weather tab bind row, `sensor.*` from HA's core `moon`
integration) drives the moon phase.
- **Gradient dome**: an inverted `SphereGeometry(30000)` (`BackSide`) with a custom
  two-uniform (`uTop`/`uBottom`) vertex-lerp `ShaderMaterial` — a **documented `_mat()`
  exemption** alongside the weather Points/Sprite materials (a toon-shaded sky is
  nonsense). `depthWrite:false` + `renderOrder -10` so it paints behind everything (grid
  + opaque geometry draw over it; the flat `scene.background` survives as a fallback).
  Colors come from `_skyColorsFor(preset, condition, cloudCoverage)` (`SKY_PRESET` day/dusk/
  night base + `_overcastAmt` grey-out + `WEATHER_WET_SKY` darken); `_refreshSkyTargets`
  sets targets, eased per-frame (τ≈2 s) in `_advanceWeather`. `uStormDir`/`uStormAmt`
  darken the **upwind horizon band** when a storm brews (`uStormAmt = _stormDarkAmt`,
  the same rainSoon signal that drives `_buildStormBank`; `uStormDir` = upwind).
- **Sun disc**: a warm radial-glow `THREE.Sprite` positioned via `_sunTargetFromSky(az,
  elev, R=26000)` (same `sun.sun` az/elev source as the W3 sun-light `sunPosition`
  effect, larger radius). Visible only when `elevation > 0` AND preset ≠ night AND
  `skyBackdrop`; opacity ramps in over the first ~6° above the horizon, dims under
  overcast. Eased opacity + position (snaps into place while invisible to avoid a
  swoop-in). **Look (user-reported "purposeless white ball", fixed)**: `_sunGlowTexture`
  is a small hot core + a long soft WARM tail (warm `r>g>b` at every gradient stop),
  sprite 5000 mm (mostly halo), **AdditiveBlending** — a sun ADDS light to its sky;
  NormalBlending pasted a hard-edged white ball over the dome. Tint stays warm at every
  elevation (`0xffeec4` high end) and peak opacity eases back ~28 % as the sun climbs
  (midday = glare, not a bright ball).
- **Moon disc**: a `THREE.Sprite` whose per-phase `CanvasTexture` (cached in `_moonTexCache`)
  is drawn from `moonPhaseFraction(state)` (pure, in `weather.ts`; state → signed
  illuminated fraction, magnitude 0=new..1=full, sign +waxing/−waning). Drawn as a lit
  disc + a dark unlit-semicircle + terminator half-ellipse (correct for all 8 phases,
  both limbs). Positioned **opposite the sun azimuth** (`az+180`, an honest approximation
  — HA exposes no real moon position) at a fixed pleasant elevation arc; visible only at
  the `night` preset. Unbound `moonEntity` → default full moon.
- **Starfield**: one `THREE.Points` (~140–220 dots, DPR-capped, built once on the dome),
  opacity ramped by `(1 − dayness)`. **Daylight star gate (load-bearing, user-reported
  "constellations in daytime", fixed)**: dayness is `max(preset dayness, sun-up amount)` —
  the preset ramp alone (day=1/dusk=0.4/night=0) FAILED because `resolveScenePreset`
  downgrades an overcast DAY to the `dusk` preset, pinning the ramp at 0.6 and painting a
  full constellation sky over a bright grey daytime dome. A live `sunElevationDeg` folds
  in (starless at/above the horizon, ramping through civil twilight 0°→−6°; no elevation
  data → the preset ramp stands, keeping fixtures/no-weather setups unchanged). Below
  `STAR_RAMP_MIN` (0.02) the whole starfield/catalog group flips `visible = false` (the
  exponential ease asymptotes, never reaching 0), and the FIRST dayness target SNAPS so a
  panel opened in daylight never fades a full star sky out over ~8 s. Lines + planet
  sprites ride the same ramp as the stars. **Horizon-ring
  fix**: the old build sampled `y = max(0.06, rnd·2−1)` — the whole lower hemisphere CLAMPED
  onto one latitude (alt≈3.4°) = a dense ring. Now `capSampleAltAz` (area-uniform on the
  ≥8° cap, `asin(mix(sin8°,1,rnd))`) + a per-vertex brightness fade below 15°.
- **Real night sky (astronomically correct — constellations + planets + moon)**: pure
  `src/sky-astro.ts` (three-free, geo.ts idiom — every fn takes an explicit epoch ms, never
  reads the clock) + data-only `src/sky-catalog.ts` (145 J2000 bright stars ≤ mag 3.71, 92
  constellation line segments, 19 figures — Orion/Dippers/Cassiopeia/Cygnus/Lyra/Aquila/
  Taurus/Gemini/Leo/Scorpius/Sagittarius/Canis Major/Auriga/Boötes/Pegasus/Andromeda/Crux/
  Centaurus). `julianDay`/`gmstRad`/`raDecToAltAz` (az CW from N) + Schlyter low-precision
  ephemerides (Sun, 5 naked-eye planets w/ Jupiter–Saturn mutual perturbations, Moon full
  perturbation set); `skySnapshot(ms, lat, lon)`. **Observer** resolved three-view-side:
  `geoFit().originLat/Lon` (calibrated) → `weather.lat/lon` → null; passed as optional
  `WeatherFxState.observer` (+`skyRotRad` = geo θ; stale-chunk-safe → decorative). With an
  observer, night swaps the decorative starfield for the catalog sky — one Points (mag
  buckets), one LineSegments (faint slate, `LineBasicMaterial` flat exemption), 5 tinted
  planet sprites, and the moon at its REAL `moonAltAz` (was `sunAz+180`; phase still from HA
  `moonPhase`). Recompute is a 60 s slow tick (`_recomputeRealSky` rewrites buffers in place,
  `new Date()` read only there; `setSkyEpochOverride` test hook), catalog subgroup
  camera-recentered, same night/`skyBackdrop` gating + `(1−dayness)` fade, zero per-frame
  alloc, shared textures disposed only in `destroy()`. No new config. Test pages
  `sky-astro-test.html` (`SKYASTRO PASS 36/36` — JD/GMST goldens, Polaris alt≈lat, Mercury
  RA/Dec to 4 dp, eclipse-node geometry, solstice sun dec, cap-sampling histogram) +
  `sky-real-test.html` (`SKYREAL PASS 32/32`).
- **Shared textures** (`_sunGlowTex`, `_starTex`, `_moonTexCache`) are built once and
  disposed only in `destroy()` (like `_blobTex`/`_gradientMapTex`). Per-frame motion is
  all in `_advanceWeather` (ABOVE the `_weatherGroup.visible` early-return — the sky is
  lighting-adjacent, independent of the weatherFx layer), zero allocation.
- **`_keyWeather`** gained `effPreset:moonPhase:skyBackdrop` (`skyBucket`) so the sky
  rebuilds on a preset flip / phase change / toggle. Test pages: `weather-fx-test.html?c=sky`
  (45/45 — sun position recomputed, moon phase pixel-sampled, dome colors differ day/night/
  overcast, easing verified, upwind storm darkening); `weather-test.html` moon-phase matrix.

### Playful background text (skywriting / banner plane / grass / TRAIN / CHOPPER — multi-entry)
`Store.bgTexts?: BgTextEntry[]` (cap 6) — `{id, mode: 'sky'|'banner'|'grass'|'train'|'chopper',
text?, entityId?, format?, maxCars?}` — decorative messages written INTO the 3D world.
Store-level, in `_loadFromHa`'s explicit list. **Legacy `Store.bgText` (single) migrates once**
in `_normalizeStore` (`_migrateBgTexts`, idempotent; the old field is read for migration only,
never written). `Planner.bgTextsResolved()` resolves per entry (bound entity's
`formatEntityValue` state wins over static `text`, capped **PER MODE — grass 160, all other
modes 40** chars, empty/off skipped; grass entries also resolve `grassAreaId` →
`_grassAreaRect` = the CURRENT floor's GroundArea bbox inset 10 %, failing soft on a stale id);
every entry's bound id is **config-path** in `_isSlowEntity`. Renderer `updateBgTexts(entries,
storm, windRad, windKmh)` builds per-entry rigs keyed by id (legacy `updateBgText` wrapper kept
for stale-chunk/test pairing); multi-instance stagger: sky sprites offset x/y/z per index,
aircraft vary radius/altitude/phase, grass takes successive margin strips (exclusion-list
extension of `_bgGrassPlacement`). Storm hides sky/banner/CHOPPER; grass + TRAIN stay. **Ground
writing is MULTI-LINE** (user-facing label "Ground writing"; mode key stays `'grass'`) — the
shared `_fitLawnText` word-wrap/largest-font fit (40 px floor + ellipsis) feeds TWO painters:
`_makeGrassTextTexture` (opaque mowed-grass rect, the AUTO margin-strip path, byte-identical)
and `_makeGroundTextTexture` (area-bound path, 640² square, TRANSPARENT background). **An
area-bound entry (`grassAreaId`) is truly constrained to the area's POLYGON** (user-reported —
was a bbox rect painted grass-green over any material): `bgTextsResolved()` carries
`points`/`kind`/`elevationMm` on `grassArea` (rect cx/cy/w/h kept — stale-chunk BOTH ways:
renderer without points-support ignores them; a row without `points` takes the legacy rect
path, which the pre-existing tests still pin) → `_buildBgGroundPoly` builds a ShapeGeometry
in LOCAL coords about the bbox centre (`sx = cx − px, sy = cy − py` — round-trips to
`_w(px,py,y)` exactly, index-matched against the real `updateGroundAreas` patch verts), the
area's own patch material shows THROUGH the transparent canvas, and text ink comes from the
pure `groundTextInk(kind)`/`GROUND_TEXT_INK` (geometry.ts — grass keeps the shipped mowed
pair; concrete/blacktop etched greys, sand/mulch browns, water blues). **Camera-facing on the
polygon path rotates the TEXTURE, not the mesh** (the polygon must stay on the area): UVs map
a SQUARE window of side S = the polygon's FULL bbox diagonal (isotropic — no shear, uv stays
[0,1] at any rotation; the 10 %-inset rect's diagonal would NOT contain all verts) centred on
(cx,cy), `u = 0.5 + sx/S, v = 0.5 + sy/S`; `tex.center=(0.5,0.5)` and `_applyGrassYaw` eases
`tex.rotation = ψ` (SAME value as the mesh-yaw path — derived via setUvTransform's inverse
sampling; no flip/offset), `mesh.rotation.y` pinned 0, `grassTexRot` flags the rig. `scale` on
an area-bound entry multiplies the PAINTED text (mesh scale stays 1 — clipping at polygon
edges is deliberate); auto placement keeps the mesh-scale spill. Else the auto margin strip. Skywriting is weight-400 with ~0.12 em
per-char letter spacing (not bold — pinned typography) and `frustumCulled = false` (a
one-depth sprite otherwise pops in/out at the far plane). **Camera far = 150000** (was 60000
— at maxDistance 45000 the banner orbit/train loop far arcs clipped while the camera-centered
sky dome still painted, reading as "vanishing behind the sky"). Chopper banner hangs from its
LEADING TOP CORNER (the banner group origin — sway pivots there, wire belly→corner is rigid).
Train vehicles are ×1.8 scale (spacing 1480, wheelR 162).
**Tow-aircraft model** (`BgTextEntry.aircraft`, banner mode only): one of the eight FLIGHT
archetypes (`src/aircraft-types.ts`) builds the tow plane via the SAME `_buildAircraftModel` the
ADS-B rigs use — civil paint, no beacons/livery lettering (a message prop, not traffic).
Absent/unknown → the classic toy plane, byte-identical. Banner standoff = `fusLen/2 + 500 +
halfBannerLen` (a widebody doesn't swallow its message). `heli` flies the ordinary BANNER orbit
with `rig.rotorY` flipping the disc spin Z→Y (tail rotor keeps X); `mode:'chopper'` stays the
dedicated news build and IGNORES `aircraft`. `BgRig.props[]` spins every disc.
**Per-entry model size** (`BgTextEntry.scale`, 0.5–5 default 1, pure `bgModelScale`): a
group-level BUILD-time multiplier on the whole rig — plane/chopper asm, sky sprite, grass decal
(deliberately spills past the fitted rect at >1), and the train's ×1.8 base WITH spacing/wheelR
scaled alongside. Flight paths/orbit radius/altitude/train loop untouched (the world grew ~190×
across the frustum work; the toys never shrank). Per-frame advances write position/rotation/
opacity only, never scale. `aircraft` + `scale` fold into `_keyBgText`'s entry hash + pass
through `bgTextsResolved`. UI: "Aircraft" dropdown (banner rows) + "Model size ×" (every row) in
Settings ▸ Display. **`Layers2D.bgText`** (absent = ON, label "Background text", in the shared `LAYER_DEFS` + `bgText: false` in `SIMPLE_LAYERS`): three-view folds the flag into `_keyBgText` and passes an EMPTY entries list when off — rigs dispose through the normal rebuild path, `_bgTextPhase` survives so re-enabling resumes mid-course. Tests: `bgtext-multi-test.html` (`BGTEXTMULTI PASS 193/193`).
- **`train`**: a toy toon train (engine + N cars, darker last car) circling a rounded-rect loop
  ~1800 mm OUTSIDE the floor rect (ellipse fallback for tiny floors), arc-length walked at
  ~1.1 m/s — each car independently posed on the loop so the train bends around corners; wheels
  spin ∝ speed. `N = clamp(ceil(len/6), 1, maxCars ?? 8)`, `maxCars` clamped 2..12 (sidebar
  input on train rows). **Both-sides readability**: each car carries FrontSide text planes on
  local ±X flanks (±90° Y-rotations — glyphs never mirrored); the −X (train-left) flank gets
  chunks engine→tail (`chunk[i]`), the +X flank gets `chunk[N−1−i]`, so BOTH viewers read
  left-to-right. Planes tagged `userData.textPlane` (+ test hooks `userData.flank/chunk`).
  No smoke puffs v1 (chimney geometry present; add a 3-sprite recycler later if wanted).
- **`chopper`**: toy news helicopter (cabin bubble + tail boom + skids + NEWS stripes) — main
  rotor spun fast about Y + tail rotor about X per frame; tows the double-sided banner
  BELOW-and-behind on a tow-line cylinder with trailing sway; orbits OPPOSITE the banner
  plane's direction, higher (~7500 mm), tighter (radius ·0.6), with ±150 mm hover bob.
Settings ▸ Display "Background text" is a 6-entry list editor (mode/static/entity/maxCars/
delete + "+ Add"). Test pages: `bgtext-test.html` (29/29, legacy wrapper) +
`bgtext-multi-test.html` (`BGTEXTMULTI PASS 193/193`).

- **Renderer** `_bgTextGroup` (added to `scene.add`/`clearTransientGroups`/`destroy` — cheap +
  floor-tied, UNLIKE `_skyGroup` which is not) + `updateBgText(text, mode, storm, windRad,
  windKmh)`: rebuilt only under three-view's **`_keyBgText`** (`configRev|floorId|mode|text|
  storm`). Per-frame motion is `_advanceBgText(dt, nowS)` from `_animate` (alongside
  `_advanceWeather`) — **zero allocation after build** (transform + opacity only). The per-text
  `CanvasTexture` (`_makeBgTextTexture`, DETERMINISTIC — sky wobble is hash-based, no
  `Math.random`) is freed on rebuild via the `_disposeSpriteMaps` + `_clearGroup` pairing (sky
  sprite via the `isSprite` branch; banner/grass meshes tagged `userData.textPlane`).
- **`sky`** (skywriting): one additive-blended `THREE.Sprite` billboard high in the sky
  (`opacity 0.9`, `AdditiveBlending`, glow baked as canvas `shadowBlur` — a flat-material
  exemption from `_mat`, consistent with `NoToneMapping`); `_advanceBgText` drifts it
  horizontally with the wind (bounded oscillation) + a slow opacity twinkle.
- **`banner`**: a toy `_mat()` toon tow-plane (fuselage + wing + tail + spinning prop) towing a
  wide double-sided text `PlaneGeometry` banner (normal = local +X so it's broadside-readable);
  `_advanceBgText` flies it on a slow horizontal orbit (`radius ≈ floor-diag·0.75`, alt ~6000 mm,
  ω 0.12 rad/s) yawing the assembly so its nose (local −Z) tracks the tangent, + prop spin.
- **`grass`**: a flat text decal on the ground at **y≈6** (between ground patches y=4 + blob
  shadows y=8) that **FACES THE CAMERA** (user request "easy to read"): the mesh keeps its own
  position with `rotation.order='YXZ'` (= `Ry(yaw)·Rx(−π/2)` — mathematically a yaw group at the
  rect centre with one fewer node; a real parent group would have broken terrain-test/bgtext-test
  reads of `_bgTextGroup.children[0]`), and per-frame `_advanceBgGrass` eases
  `yaw = atan2(camX−cx, camZ−cz)` (shortest arc, τ≈0.6 s, snap <0.5°) so text-top points AWAY
  from the viewer (page-on-the-floor; `cross(textRight, textUp) = +Y` ⇒ never mirrored at any
  yaw — world-space-asserted at 4 azimuths). Eased state = `BgRig.grassYaw`; `undefined` = first
  advance SNAPS, so a `_keyBgText` rebuild re-acquires the camera pose instantly. MESH yaw is
  the AUTO-placement path only — an area-bound POLYGON decal eases `tex.rotation` instead
  (`grassTexRot`, same ψ/easing — see the ground-writing paragraph above); both pivot about
  their rect/bbox centre. `_bgGrassPlacement` picks the WIDEST of the four margin strips around the
  wall-loop bbox and fits an aspect-locked rect inside it — the center is always OUTSIDE the
  footprint bbox (hence outside every wall loop) and inside the floor rect (`_bgGrassInfo`
  exposes it for the test). Mowed-relief canvas: grass-green base + lighter/darker strokes.
- **Weather interplay**: sky + banner HIDE during `pouring`/`lightning`/`lightning-rainy` (they
  read wrong in a downpour — three-view passes `storm`); grass (a ground decal) always shows.
- **UI**: Settings ▸ Display "Background text" block — mode select, static message input (capped
  40, disabled when an entity is bound), entity bind 🔗 / clear ✕, live-resolved hint. Renders in
  **all UI modes** (a display prop; no Layers2D entry — `mode` is the gate). Test:
  `test-pages/bgtext-test.html` (`BGTEXT PASS 29/29`; needs `value-rules.mod.js` via
  `esbuild --bundle` like rooms-test's geometry.mod.js).

### 3D weather effects (World Outside, Feature W — phase W2)
Outdoor effects driven by `Planner.weatherNow` (W1). three-view's `_weatherFxState(layers)` shapes a `WeatherFxState` (`condition`, `intensity01`, `windKmh`, `windBearingPlanRad`, `isDay`) — effects are live only when `layers.weatherFx !== false` **and** `weather.effects3d !== false` **and** a live `weatherNow` exists (else a no-effect `sunny` state clears everything). `conditionIntensity(condition)` in `weather.ts` (pure, testable) maps condition → 0..1 (pouring/hail 1.0, lightning-rainy 0.8, windy 0.65, lightning 0.6, rainy/snowy/snowy-rainy 0.55, fog 0.5, clear/cloudy/exceptional 0, unknown 0.4). Wind bearing (meteorological FROM-degrees) → plan frame: three-view maps `bearing+180` (blow-toward) through the geo transform θ (`geoFit().transform.thetaRad` when `quality !== 'none'`, else 0 = plan-north-relative).

- **Renderer** `_weatherGroup` + `updateWeather(fx)`: rebuilt only under three-view's `_keyWeather` (`configRev|floorId|condition|round(intensity·4)|windBucket|weatherFx-flag`). Per-frame motion is `_advanceWeather(dt, nowS)` called every frame from `_animate` — **zero allocation after build**: it mutates each cloud's `position` buffer in place (`needsUpdate = true`), never reallocates.
- **Precipitation** — ONE `THREE.Points` cloud per precip type (`_buildPrecipCloud`): count `600 + intensity·1900` (dust `40 + intensity·80`), **DPR-capped ×0.6 on hi-density displays** (retina/iPad, `min(devicePixelRatio,2) >= 2`); spawn box = floor bbox inflated 6 m, vertical **recycle band 0..4000 mm** (fall subtracts, `< 0` adds 4000); horizontal wind drift + snow/dust sinusoidal wobble, wrapped in the spawn box so drift never walks the cloud off-screen. Rain = streak texture (fast), snow = soft round flake (slow + wobble), hail = small hard dot (fast), `snowy-rainy` = one rain + one snow cloud at half counts each, `windy`/`windy-variant` = drifting dust (no fall).
- **Fog** — scene-level `FogExp2` (target density `0.00018`) **eased in/out over ~2 s** in `_advanceWeather` (τ ≈ 2 s; nulled below `1e-5` when leaving — never a pop) + two large translucent ground planes (via `_mat`) scrolling in opposite directions outside the walls. **Zoom-compensated**: the EASED density (`_fogEased`, the authored-strength source of truth; teardown gates on it, never on the applied value) is multiplied per frame by `clamp(REF_DIST / camDist, 0.15, 1)` — `REF_DIST = max(max(fw,fd)·1.35, 8000)` (the applyViewPreset framing distance) — so exponential distance fog doesn't grey-wash the whole plan at kiosk zoom; fully zoomed out keeps a faint 0.15 hint, zooming in never exceeds authored strength (weather-fx `?c=fog` 12/12).
- **Lightning** (`lightning`/`lightning-rainy`) — a dedicated flash `DirectionalLight` (intensity 0 at rest, `_buildFlash`), pulsed every 8–25 s with a **double-flash decay envelope** (pure function of age-since-strike; only the gap uses `Math.random()`, the fireplace-flicker idiom). Peak ~6.5 at night / ~2.2 by day. NO audio (permanent decision).
- **Lighting modulation** (`weather.affectLighting !== false`): `resolveScenePreset(sc, states, weather?)` — the **single** mechanism is a day→dusk preset DOWNGRADE for overcast/precip/fog/lightning conditions (`WEATHER_DIM_CONDITIONS`); night/dusk/partlycloudy/clear stay put. three-view's `_effectivePreset` passes the weather mod, so the dim already folds into `_keyFloor` — no new dirty key.
- **Materials**: `PointsMaterial` / `SpriteMaterial` are the documented **exemption** from the `_mat` toon factory (billboarded point sprites, not lit surfaces — flat color + a tiny `CanvasTexture`). Shared particle/fog maps (`_rainTex`/`_snowTex`/`_hailTex`/`_dustTex`/`_fogPlaneTex`) are built once and disposed only in `destroy()` (like the gradient/blob maps); `_clearWeather` tears the group down via `_clearGroup` (which disposes Points geometry + material but NOT the shared maps) and resets the tracking lists. Weather resets on floor switch (spawn box refits). Test page `weather-fx-test.html` (`?c=pouring|fog|lightning|sunny`).

### UI modes (edit / kiosk / view) & URL templates
`Planner.uiMode` (runtime + URL only, never persisted): `edit` (default), `kiosk` (views + device interaction, no editing), `view` (no interaction either). Enforcement layers: `Planner.save()` **no-ops outside edit** (kiosk devices must never write back — not even localStorage), `toggleEntity` refuses in view mode, `onCanvasMouseDown` returns early outside edit (no drags/selections), `onCanvasClick`/`onCanvasDblClick` have kiosk branches (toggle / light-config only), tool + Delete hotkeys are edit-only, and the sidebar / floor buttons / settings / save-view buttons render only in edit. URL params parsed in `app._applyUrlParams`: `mode`, `lock=1` (sets `uiModeLocked`, hides the switcher), `view`, `floor`, `layers` (preset name/id or `simple`/`full`), `view3d` (saved view name/id), `cam=x,y,z,tx,ty,tz`. Floor/layers apply via retry-on-config (store loads async, 20 s window, then defaults stand); `view3d`/`cam` apply in `three-view._applyUrlTemplate` (15 s, then iso fallback). `Planner.lastCam3d` is refreshed each 3D tick so the topbar "Kiosk link" button can mint a `cam=` URL.

### Device-local view + touch guards
`Planner.view` defaults from `localStorage['diorama:view']` (written in `setView`, try/catch-guarded) so a tablet reopens in its last 2D/3D view; the `?view=` URL param still wins. Both canvases stop touch propagation so two-finger gestures can't open HA's drawer — EXCEPT touches starting within 24 px of the left window edge (intentional edge-swipes still open the sidebar). The latch is per-gesture: set at touchstart only if every point clears the edge.

**Touch → click synthesis (load-bearing for iOS / HA app):** the 1-finger touch handlers `preventDefault`, which suppresses the browser's compatibility `click` on iOS — so anything living only in `onCanvasClick` (geo-landmark / room placement, kiosk tap-to-toggle, tap-to-place for every tool) would never fire from touch. `canvas-2d.ts` therefore records a tap candidate at touchstart (invalidated by a 2nd finger, >12 px move, or >600 ms) and, on a clean single-finger lift, synthesizes a click via the shared `_dispatchClick` (the native `'click'` listener also routes through it). This runs **AFTER `onCanvasMouseUp`** so the mouseup→click ordering — and the `dragJustEnded` swallow — matches a real mouse. `_lastSyntheticClick` timestamps each synthetic dispatch; the native listener ignores clicks within 700 ms of one (drops a duplicate Android compatibility click; desktop starts at `-Infinity` so real clicks always pass). Double-tap (2 valid taps <350 ms and <24 px apart) synthesizes `dblclick` instead of a second click (light-config on tablets). Arming a placement latch from the sidebar calls `maybeCloseSidebarForPlacement()` (auto-closes the overlay sidebar under the 900 px breakpoint) so the first tap lands on the canvas, not the backdrop.

### Plan rotation (set a new default top)
`Planner.rotateFloorContent(phiDeg)` (edit-only; sidebar Floors "Rotate plan" row: `↺ 15° · ↺ 1° · ↻ 1° · ↻ 15°`, ↻ = screen-CW = positive φ) — a one-shot DATA mutation mirroring `translateFloorContent`'s coverage: every placeable's x/y rotates about the current floor's centre via the pure `rotPointDeg(x, y, cx, cy, phiDeg)` (geometry.ts; screen-CW matrix `[[cosφ,sinφ],[−sinφ,cosφ]]`, EXACT 0/±1 factors on quarter turns) and every Diorama-owned angle field (`rotation`/`heading`, "0 = +Y world screen-CW" convention) gets `+= φ` — wall points, room anchors, zone/ground/void/pool polygons (+ path centerlines re-buffered), camCalib plan points (u/v fixed), bg (x/y + rotation), model3d. **Sign exceptions**: vacuum calibration `posRotDeg −= φ` (`vacuumRawToWorld` is CCW) + `posOffset` rotated as a world point; `geo.northDeg`/`compass.manualNorthDeg` `−= φ` (bearing plan +Y faces) so the compass keeps pointing at true north — INVARIANT: `resolveNorth` output rotates by exactly φ, both source paths. Geo landmarks rotate ONLY single-floor (translateFloorContent precedent); bearings bump regardless. mmWave `Sensor.heading` untouched (firmware `number.*_mount_angle` — position only; UI hint says re-check) and `Light.tilt` untouched (elevation, not yaw). LOCKED items rotate (frame change). Floor rect only GROWS to fit (grid-rounded, via `floorContentBbox`) — +φ/−φ never ratchets. One undo step per click (`save()` + `emitConfig()`; configRev drives every 3D key). Test `plan-rotate-test.html` (`PLANROTATE PASS 68/68`).

### Ruler tool & wall/structure dimensions (2D-ONLY — no three-renderer changes)
Both ride the `Layers2D.dimensions` layer (absent = ON, label "Dimensions") and draw LATE in `drawAll`.
- **Ruler** (`Floor.rulers: Ruler[]`, repairFloor + defaultFloor backfill `[]`; tool `ruler` 📏 in TOOLS + the toolbar Structure tab): each end is a `RulerEnd` — `{kind:'point', x, y}` | `{kind:'wall', wallId}` | `{kind:'furniture', furnitureId}`. Object-anchored ends re-resolve from LIVE geometry at draw time (`resolveRulerEnds(ruler, floor)` in geometry.ts, pure), so a ruler locked to two walls tracks their moves for free; a dangling id → null = "broken" (dim red dashed + "?" chip, never throws). Wall↔wall shows the INSIDE/clear dimension: `wallClearance` = `polylineClosestPair` centerline distance − 2·`WALL_HALF` clamped ≥0, endpoints pulled to the faces; `furnitureClearance` = rotated-rect min edge distance (SAT overlap → 0). Placement is a 2-click PARALLEL latch (`Planner.drawingRuler`, wall-draw idiom — stays armed for more rulers; ESC/tool-switch cancels): each click anchors to a hit wall body → wall end, furniture body → furniture end, else grid-snapped point. Select mode: point-end HANDLES drag (`rulerEnd` drag kind, hit first via `hitRulerEnd`); body select via `hitRulerBody` → `activeRulerId`. `deleteSelection` priority: right after vertex, before furniture. `rulerSetLength(ruler, floor, mm)` (pure) moves end b along the current bearing — ONLY when b is a point (sidebar length input disabled + "anchored" note otherwise); `Planner.setRulerLength` wraps it. Point ends ride `translateFloorContent` + `rotateFloorContent`. Sidebar `_section('rulers', …)`: live `fmtLen` distance, mm length input, end captions, lock, delete, "+ Add ruler" (arms the tool + `maybeCloseSidebarForPlacement`).
- **Wall dimensions** (`Floor.dimensionMode: 'off'|'all'|'outside'|'custom'`, absent = off, in repairFloor's list; `Wall.dimension?: boolean` item-level custom flag): `drawWallDimensions` draws CAD dims per wall SEGMENT — offset line to the `wallDimSide` outward side, extension ticks, `fmtLen` label rotated along the line (flipped so never upside-down), segments <300 mm skipped — plus overall STRUCTURE extents (total W below the south edge + total D along the west edge from `structureExtents`) in `all`/`outside` modes. **Exterior classification** (`outerWallSegments`): `closedWallLoops` returns minimal interior faces (rooms), so a segment is exterior when its midpoint lies on exactly ONE loop (two = interior partition, zero = standalone ≠ exterior) — a wall spanning the full structure with a CENTERED interior tee is a known midpoint-heuristic limitation. Sidebar `_section('dimensions', …)`: mode dropdown + (custom) a "Pick walls" latch (`Planner.pickingDimWalls`, runtime — while armed a Select-mode wall click TOGGLES `wall.dimension` instead of selecting; ESC/mode/tool change disarms) + selected count. Test pages: `ruler-dims-test.html` (`RULERDIMS PASS 55/55`), toolbar-test grew 41→42.

### GPS/geo distance readouts respect `store.imperial`
`fmtDistanceM(meters, imperial)` + `fmtAccuracyM(meters, imperial)` (pure, in geo.ts — still zero-import so the standalone no-bundle transpile works): metric `<1000 m` → `N m` else `N.N km`; imperial `<1000 m` → `N ft` else `N.NN mi` (the ft/mi boundary is the SAME underlying 1000 m as the metric branch — deliberate symmetry). Converted READOUTS (config inputs — boundary/gate m, lat/lon — stay metric): 2D `drawGpsPins` beyond-distance + indoor caution, `drawGeoLandmarks` ±accuracy, 3D GPS pin sprite labels (three-view), geo EVENT pin labels (composed once planner-side in `_computeGeoEventPins` — covers 2D+3D), sidebar People GPS status + `_gpsPinsPreview` + landmark accuracy + `_geoFitReadout` RMS/worst-outlier, calibration finish toast. geo-test grew to `GEO PASS 68/68`.

### Floor boundary editing (drag the canvas edges)
The floor rect (`0..w × 0..d` mm) is editable by dragging its four boundary edges (EDIT + Select only). Hover within ~10 px (screen) of an edge — after all item hits fail, before the pan fallback — shows a resize cursor (`hitFloorEdge` in canvas-hit.ts); mid-edge square handles always draw so the affordance is discoverable (`drawFloorEditHandles` in canvas-render.ts). Mousedown starts a `floorEdge` `Drag` (`{edge, startClient, startScale, startW, startD, startBbox, applied}`). Input is measured in **frozen start-of-drag screen space** (`startClient`/`startScale`), NOT live world coords, because resizing rescales the fit-to-canvas view and live coords would feed back. Grid-snapped to `GRID_MM`. `resolveFloorEdgeDrag` (geometry.ts, pure) resolves new `w/d` + a content translation `tx/ty`: `right`/`top` edges only resize; `left`/`bottom` edges resize AND translate all content so the plan stays glued to the opposite edge. Minimum size 2000 mm; shrinking clamps against the content bbox (`floorContentBbox` — wall points + item centers) + 100 mm margin so nothing strands. `Planner.translateFloorContent(dx,dy)` moves every placeable + wall points + room anchors + `bg.x/y` + `model3d.x/y`; it's a **frame change, so LOCKED items translate too**. Geo landmarks (`Store.geo.landmarks`, world-frame, shared across floors) translate ONLY when `store.floors.length === 1` — a multi-floor origin edit must not silently shift the shared geo frame. Release rounds `w/d` to grid + `save()` + `emitConfig()` (configRev → `_keyFloor` → 3D/nav rebuild); `viewCenter` is untouched.

### Visual placement toolbar (bottom dock)
`<diorama-toolbar>` (`src/ui/toolbar.ts`; design `docs/DESIGN-toolbar.md`) —
edit-mode-only bottom dock, a flex-column LAYOUT SIBLING below the canvas (the
canvas shrinks; the weather chip + 2D reset button clear it for free).
Category tabs (11: furniture cats via `furnitureCat` + Lights + Controls &
Sensors + Structure + Ground + Custom) → scrollable ~72 px item cards →
variant CHIP row (door/window/wall/ground kinds). Model + arming live in the
pure `src/ui/tool-arm.ts` (`buildToolbarModel(planner)`; arm fns call the SAME
planner mutations as the sidebar — never fork semantics). Cards show REAL 3D
thumbnails from `src/ui/thumbs.ts`: ONE hidden 128×128 `ThreeDRenderer` via
the SAME dynamic-import specifier as three-view (never a static import — the
chunk-split check greps `dist/assets/app.js` for `MeshToonMaterial` = 0),
rAF-batched captures for furniture/lights/custom, authored glyph tiles for
sensor/control fixtures + all fallbacks (`src/ui/thumbs-cache.ts`; cache key =
`__DIORAMA_VERSION__` build tag + per-descriptor key + recipe hash for custom
objects; localStorage-persisted). Collapse persists in
`localStorage['diorama:toolbar:collapsed']`. Variant arming uses four
RUNTIME-ONLY planner fields (`pendingLightKind`/`pendingWindowKind`/
`pendingDoorKind`/`pendingGroundKind` — defaults reproduce classic drops;
never persisted, invisible to undo/config). Armed card ring tracks external
tool changes via the config channel. Test `toolbar-test.html` (41/41).

### Collapsible sidebar sections
Every `.section` renders through `Sidebar._section(slug, title, bodyThunk, opts?)` (light-DOM wrapper: clickable `<h3 class="collapsible-header">` + `▸`/rotated arrow; the body thunk is only invoked while expanded). Collapsed keys persist **device-local** in `localStorage['diorama:sidebar:collapsed']` (JSON array, try/catch-guarded — NOT the HA store); absent from the set = expanded (default). Section keys are the stable per-section slugs (`floors`, `tools`, `sensors`, `motion`, `env`, `ble`, `alarm`, `thermostats`, `people`, `doors`, `windows`, `furniture`, `custom`, `rooms`, `voids`, `roamers`, `fixtures`, `layers`, `geo`, `model3d`, `bg`) — NOT the display title (which can change). The former `scene3d` / `weather` / `data` sidebar sections MOVED into the tabbed settings drawer (Display / Weather / Data tabs — see "Settings drawer & avatar packs"); the per-floor `look3d` overrides moved into the Floors section. Stale slugs in a persisted collapsed set are harmless. Room-grouped lists (`_groupedList(sectionSlug, …)`) get per-room-group collapse rows keyed `<sectionSlug>/<roomId>` (the "— No room —" bucket = `/none`). **mmWave detail editors are inline**: the selected sensor's per-sensor config editor (`_activeSensorSection()`) and its HA-data block (`_haSections()` — zones / objects / targets / sensor config) render as plain bordered **sub-blocks** directly beneath the selected sensor's row *inside* the `sensors` section (matching how the Motion section edits inline via `_motionItem`), NOT as separate `_section`s. There are no longer `active-sensor`/`ha-sensor` section slugs (stale keys in a persisted collapsed set are harmless).

`_autoExpandActive()` (called at the top of `render`) expands a section **only when its active id CHANGES** from the previous render: it keeps `_lastActiveSnapshot` (map of section slug → active id it read: `sensors`=`activeSensorId`, `motion`=`activeMotionId`, `env`/`ble`/`people`/`furniture` likewise) and, for each slug whose current id is set *and differs* from the snapshot, removes that slug from the collapsed set, then records the new snapshot. This fixes a bug where a **persisted** active id (`activeSensorId` is always set) re-expanded a just-collapsed section on the very next render — collapse could never stick. Now selecting an item on the canvas auto-expands once; collapsing while it stays selected sticks; selecting a *different* item expands again. It only ever *expands* — never force-collapses. Because every expanded section renders through the same `_section`/body-thunk call site in a fixed `render` hole (and the inline sensor sub-blocks keep stable identity while the same sensor stays active), Lit's surgical config-channel reconciliation (focused-input survival) is unaffected.

### View layers & presets (2D + 3D)
`Store.layers2d` (`Layers2D`) gates `drawAll` per layer and the 3D scene: group-scoped layers (lights/**switches** (own `_switchGroup` since the split — hidden switches also drop out of raycast, like hidden lights)/sensors/motion/env/**info** (info-card plaques, own `_infoGroup`)/zones/targets/geo/weatherFx) flip `group.visible` each tick via `renderer.setLayerVisibility` (hidden lights also stop being raycast click targets; `weatherFx` off also hides the effect group + stops its per-frame particle motion); `furniture` (NON-appliance pieces) + **`appliances`** (appliance-category pieces incl. appliance custom objects — hiding them also drops their anchors/door pivots/nav footprints, same semantics as furniture) + `bg` + `labels` (room-name labels; hiding them keeps `_roomZones` alive for activity/TV room resolution) are gated at build time inside `updateFloor` (they live in `_floorGroup`) and are part of `_keyFloor`. Hiding furniture also removes sit spots, terrain, and stairwell floor holes. The `targets` layer's display label is **"Avatars"** (key unchanged for preset compat). 2D: gates `drawAll` per layer (bg, furniture, appliances, labels, lights, switches, sensors, motion, env, info, zones, targets — absent = on) plus `activity` (default OFF): glow pools where lights are ON / motion is firing, so the built-in "Simple floorplan" preset (everything off + targets + activity) still shows living rooms. Walls/doors/windows always draw. `nameLabels` (default on) is a special case — it gates confident-rig name sprites (3D) + name text under fused/identified dots (2D); the 3D side is NOT a group flip (labels live inside `_targetGroup`) but a per-frame `sprite.visible` gate that `setLayerVisibility` folds into `_showNameLabels` (see Identity fusion). User presets persist in `Store.layerPresets2d`; sidebar "2D Layers" section. **The layer catalog lives in `src/layer-defs.ts`** (pure): `LAYER_DEFS` (key+label list — the sidebar grid AND the card editor's Custom… grid both enumerate it; a NEW layer needs exactly one entry there), `SIMPLE_LAYERS` (the one shared "Simple floorplan" literal — sidebar + app.ts `?layers=simple` + card-shared all consume it), `DEFAULT_OFF_LAYERS`/`layerIsOn()` (the default-off ladder — activity/vacuumMap/heatmap are opt-IN; both surfaces delegate so they can't diverge).

### Device-state bindings on structural items (appliance in-use / fridge door / door lock)
- **Appliance in-use**: appliance-category furniture (`cat: 'appliance'`) with an ON/playing `effectiveState` shows a pulsing green LED + soft glow in 2D (`drawFurniture`, time-based alpha — the RAF redraws every frame) and an emissive green indicator in 3D (`_buildFurniture`, build-time). Because furniture builds under `_keyFloor` and `configRev` alone doesn't see state changes, three-view folds a **compact appliance-state hash** (each appliance's effective state + fridge door state) into `_keyFloor` and passes a `stateProvider` as `updateFloor`'s 5th param — a bound TV/washer now rebuilds in 3D on state change.
- **Fridge door** (`Furniture.doorEntity`, item-level; UI only on fridge kinds): binary_sensor 'on' = open → 3D door panel swung ~70° about its hinge edge (build-time, panel held proud — coincident-face gotcha), 2D amber swing wedge. Sidebar fridge editor has a "Door sensor" bind row.
- **Door lock** (`Door.lockEntity`, item-level, **display-only** — no toggle): lock.* state → 2D padlock glyph near the hinge (red locked / green-outline unlocked / grey unknown) + 3D emissive deadbolt box near the free edge. Folded into `_keyDoors` (which already hashed door/window open states).
- **Plant droop** (`Furniture.moistureEntity` + optional `moistureThreshold` default 20 %, item-level; UI + effect only on `isDroopPlant` pieces = `plant`/`flower_bed`/any `tend_plant` custom recipe): a bound soil-moisture `sensor.*` (device_class `moisture`, or a mislabeled `humidity` probe) reading below threshold → **THIRSTY**. **3D** foliage droops: `plant` leaf clumps and `flower_bed` stems each build on a **pivot group** (leaf/stem offset up from the pivot; radial direction from piece center) collected via `_buildFurniture`'s `plantSink` and registered in `_plants` with a build-time `thirsty` flag. Per-frame `_advancePlantDroop(dt)` (called from `updateTargets` beside `_advanceApplianceDoors`) eases a per-fixture-id blend (`_plantBlend`, τ = `PLANT_DROOP_TAU` = 2.2 s — slow wilt-in/perk-up, appliance-door idiom, **survives `_keyFloor` rebuilds**) tipping each pivot outward+down `PLANT_DROOP_ANGLE` (0.35 rad) + sagging ~40 mm + lerping the (per-piece) leaf/stem material toward `PLANT_WILT_COLOR` in place (no rebuild). `thirsty` is folded into three-view's `_keyFloor` **appliance-state hash** (`'t'`/`'h'`/`'x'` — a boolean, only flips on a threshold crossing) so a state flip rebuilds; the ease itself is per-frame. **2D**: a small 💧 chip near the pot when thirsty (self-gating like a battery badge — `drawFurniture`, screen-space, `plantThirsty` gate). Unbound plants show the effect only via the `plantDemoThirsty` "Test thirsty" sidebar toggle. `moistureEntity` is display/animation-only (never feeds `effectiveState`/activities) + config-path in `_isSlowEntity`. A sibling battery sensor auto-surfaces a 🔋 badge for free. Sidebar `_moistureBindRow` (bind + threshold input + demo toggle) on plant kinds.
- All the above binding ids are config-path in `_isSlowEntity` (scoped to the current floor's bound ids, never blanket domain rules).

### Info cards (Display & Controls arc — batch DC-A)
`InfoCard` (`Floor.infoCards`, repairFloor + defaultFloor backfill `[]`) — a generic
value-display plaque showing the live state + unit of ANY bound HA entity (no domain
filter) as crisp text (2D chip + 3D sprite/plane), or an entity-free clock/date mode.
Generalizes `EnvSensor` (which is hard-wired to `sensor.*` + a fixed kind table).
Built via the canvas-fixture recipe: tool `infocard` (🔢 Info), `drawInfoCards` (2D
bezel + auto-fit value text, color from rules; `infoCardHalfPx` px extents exported for
hit-testing), `hitInfoCard`, drag kind `info`, own **`info`** layer (default on — sidebar
Layers def), 3D `_infoGroup` + `updateInfoCards` under `_keyInfo` (three-view: configRev +
per-card bound state + `layers.info` flag; clock cards carry a static `clk` token — no
per-minute rebuild). Wall-mount cards flush-snap on drop/move-release via `snapInfoCardToWall`
(geometry.ts, no ganging; offset `WALL_HALF + 10` = 60 mm).

- **Shared rule engine** `src/value-rules.ts` (PURE, three-free, imports nothing —
  DC-B's ActionButton + logical lights consume it too): `ValueRule {op:
  lt|lte|gt|gte|eq|neq|between|contains|regex, value, value2?, color?, flash?, label?}`
  + `evalRules(rules, raw)` (first-match-wins; numeric ops coerce via parseFloat, NaN →
  no match; eq/neq numeric when both coerce else string; contains is case-insensitive;
  regex is try/caught). `formatEntityValue(st, fmt, {imperial, now})` (mapping →
  binary_sensor short labels → enum Title Case → numeric+unit; °C→°F when
  imperial; prefix/suffix; relativeTime for ISO timestamps). **The numeric branch is
  STRICT-gated**: it fires only when the ENTIRE trimmed state matches
  `/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i` — a digit-PREFIXED state ("14:35",
  "2026-07-20", "12 kWh today") passes through VERBATIM (the old parseFloat prefix-parse
  truncated times to the hour / dates to the year across info cards + bgTexts). Title
  Case likewise applies only to enum-ish tokens (`/^[a-z][a-z0-9_-]*$/`) so dates/free
  text keep their dashes/colons. `BgTextEntry.format` (already plumbed through
  `bgTextsResolved`) gained its UI: prefix/suffix inputs + unit checkbox on entity-bound
  background-text rows (Settings ▸ Display). value-rules-test 74/74, bgtext-multi 61/61. `formatClock(mode, now,
  {clockFormat, dateFormat, timeZone})` + token formatter (`formatDateTokens`, LOCAL
  getters or Intl when a tz is given) — deterministic, `now` is always caller-supplied
  (never `Date.now()` inside a pure fn). geometry.ts wraps these as `infoCardText`/
  `infoCardRule` + `INFO_CARD_MOUNT_DEFAULTS` (wall/surface/floor size+height).
- **3D**: each card = a toon bezel box + a text carrier — a **camera-facing `THREE.Sprite`
  when `billboard !== false` (the default)**, else a fixed-orientation **`THREE.Mesh` +
  `PlaneGeometry` + `MeshBasicMaterial`** oriented to `rotation` (tagged
  `userData.textPlane` + `outlineSkip`). `_disposeSpriteMaps` extended to sweep the
  text-plane mesh's map (the `isSprite` guard would skip it — a leak per rebuild).
  Persistent per-card rigs (`_infoRigs`); `_advanceInfoCards(now)` (per frame from
  `_animate`) repaints clock/date cards WHEN their formatted text flips (minute/second
  boundary — text compare, `tex.version` bumps only on real change) and pulses the
  opacity of any card whose matched rule flagged `flash` — no rebuild, zero alloc.
  MeshBasicMaterial text is a documented `_mat()` exemption (flat self-lit readout, like
  the weather-particle sprites).
- **Bound ids config-path** in `_isSlowEntity` (scoped to current-floor info-card ids).
  Clock/date cards bind nothing. Display-only everywhere (no click behavior beyond
  selection in edit); no `localState`/`toggleItem`. Test pages: `value-rules-test.html`
  (`VALUERULES PASS 65/65`, pure engine matrix — transpile `value-rules.ts` standalone
  via `esbuild --format=esm`), `infocard-test.html` (`INFOCARD PASS 26/26`, renderer
  harness: build/text/rule-color/flash-pulse/billboard-vs-plane/clock-repaint/layer-hide).

### Alarm keypad fixture
`AlarmPanel` (`Floor.alarmPanels`, repairFloor backfills `[]`) — a wall-plate fixture bound to `alarm_control_panel.*`, built via the standard canvas-fixture recipe: tool `alarm` (🚨), `drawAlarmPanels` (2D state-colored screen band; arming/pending amber pulse, triggered red pulse; unbound dims), `hitAlarmPanel`, drag kind `alarm`, sidebar `_section('alarm', …)` (bind, "Allow arm/disarm" checkbox, label, lock), 3D `_alarmGroup` + `updateAlarmPanels` under `_keyAlarm` (configRev + alarm entity states), visibility riding the **sensors** layer (like BLE proxies). Wall-snap: `snapAlarmToWall` (geometry.ts) — flush like a switch (offset `WALL_HALF + 15` = 65 mm, rotation `atan2(nx, ny)`), **no ganging**. State colors live in `ALARM_STATE_COLORS`/`alarmStateColor` (geometry.ts, shared 2D+3D; covers armed_night/vacation/custom_bypass too). Clicking (2D click-vs-drag + kiosk branch, 3D raycast `userData.kind='alarm'`) opens `<diorama-alarm-modal>`: bound+`allowControl` → Disarm/Arm Home/Arm Away call `alarm_control_panel.alarm_disarm|alarm_arm_home|alarm_arm_away` (fire-and-forget, optional `code`); bound view-only → read-only status; unbound → the buttons flip `localState` (demo; save() no-ops outside edit so kiosk flips are session-only). View mode never opens it.

### Wall calendar & TV surfaces (research `docs/research/calendar-tv-surfaces.md`)
Two related "information surface" features. Pure rendering/parsing logic lives in
**`src/surfaces.ts`** (DOM-canvas only, NO three.js / Planner — shared by the
renderer, 2D canvas, AND the `calendar-tv-test.html` harness; imports `weather.ts`
for `CONDITION_GLYPH`, ha-client TYPE-only for `ForecastRecord`).

- **Wall calendar fixture** (`CalendarPanel`, `Floor.calendarPanels`, repairFloor +
  defaultFloor backfill `[]`) — a read-only wall plaque bound to one or more
  `calendar.*` entities, built via the standard canvas-fixture recipe: tool
  `calendar` (📅), `drawCalendarPanels` (2D plaque + today-accent header +
  next-event line), `hitCalendarPanel`, drag kind `calendar`, sidebar
  `_section('calendar', 'Wall Calendar', …)` (multi-bind via **repeated single-pick
  rows** — domain `calendar`; label, lock, height, live event preview), 3D
  `_calendarGroup` + `updateCalendarPanels(panels, eventsById)` (flat plaque box +
  a camera-facing `CanvasTexture` sprite painted by `surfaces.paintCalendarCanvas`)
  under `_keyCalendar` (configRev + per-panel `calendarIds` + event count +
  first-event start/summary), visibility riding the **sensors** layer. Wall-snap:
  `snapCalendarToWall` (geometry.ts) — flush like a switch/alarm (offset
  `WALL_HALF + CALENDAR_PLATE_DEPTH/2`, `atan2(nx, ny)`, no ganging). Click just
  selects (read-only — the sidebar section is the detail view; no modal).
  **Fetch mechanism (NOT `state_changed`)**: calendars don't push their full
  agenda — the entity state only carries the single next event. `HaApi.getCalendarEvents(entityIds, startISO, endISO)`
  (in BOTH clients + LocalApi inert `[]`) calls the `calendar.get_events` action
  (`return_response: true`) and normalizes via `surfaces.normalizeCalendarEvents`
  (flat chronologically-merged `CalEvent[]`, tolerates `{date}`/`{dateTime}`
  wrappers + `message` fallback). `Planner._refreshCalendars()` polls every bound
  calendar across ALL floors' panels, caching per-panel in `Planner.calendarEvents`
  (runtime-only, never persisted), repainting (`emitConfig`) only when a list
  changes. **Cadence**: `_startCalendarPoll()` (immediate + `CALENDAR_POLL_MS` =
  10 min timer) on connect + `_applyLoadedStore`; a bound calendar's `on`↔`off`
  state flip (visible over `state_changed`) is a cheap nudge to re-poll sooner —
  bound calendar ids are **config-path** in `_isSlowEntity`.
- **TV screen surfaces** (news ticker / weather card) — a **content mode on
  existing bound-TV furniture**, not a new fixture. `Furniture.screenMode?`
  (`'off'|'now_playing'|'news'|'weather'|'auto'`, item-level — no repairFloor) +
  `Furniture.newsEntity?` (any `sensor.*`/`event.*`; config-path in `_isSlowEntity`).
  **Precedence** (`surfaces.resolveScreenContent(mode, hasMedia, tvOn)`): a bound
  media_player presenting media (playing OR paused → `parseNowPlaying` non-null)
  ALWAYS wins (now-playing card hides the surface); else if the TV is on
  (`effectiveState` not off/standby/unavailable), `news`/`weather` render; else
  nothing. three-view resolves this per tv/wall_tv and folds a screen hash into
  `_keyNowPlaying` (NOT a parallel key — research doc §4.2), passing `screenData`
  to `updateNowPlaying`. **Renderer**: screen surfaces are flat **planes** (not
  sprites) oriented to the TV's front face (local −Z), proud ~2 mm (coincident-face
  gotcha), textured with a `CanvasTexture` via a **flat unlit `MeshBasicMaterial`
  — a documented `_mat()` exemption** (same as `PointsMaterial`/`SpriteMaterial`;
  a toon material would band a self-emitting screen wrong). They live in
  `_nowPlayingGroup` (tracked in `_tvScreens`, tagged `userData.textPlane` so
  `_disposeSpriteMaps` frees the map). **News ticker** scroll is per-frame in
  `_advanceTvScreens` (repaints the CanvasTexture at ~12 Hz with an advanced
  `surfaces.tickerScrollX` offset, rotating headlines every 10 s via
  `tickerHeadlineIndex`) — a cosmetic accumulator, NOT a dirty-key input;
  `surfaces.parseHeadlines` reads headline-shaped attributes defensively
  (feedparser list / event.* single / template — missing attrs tolerated).
  **Weather-on-TV** paints `surfaces.paintWeatherCardCanvas` from
  `Planner.weatherNow` + `Planner.forecastDaily` (repaint on data change only).
  **2D**: a glanceable `📰`/`⛅` line under the TV footprint (mirrors the `♪`
  now-playing line). Sidebar: TV furniture editor "Screen" subsection (mode
  dropdown + news-entity bind; weather needs no binding — global source). Test:
  `calendar-tv-test.html` (`CALTV PASS n/n`).

### Per-room temperature heat-map (derived visual layer)
A DERIVED analysis layer — no new binding (research `docs/research/climate-hvac-controls.md` §4.5). For each room on the current floor it gathers temperature readings from placed `EnvSensor`s whose kind resolves to `temperature` (via `envKindOf`) AND whose position fuzzy-resolves into that room's wall loop, PLUS each bound `ThermostatFixture`'s `current_temperature` **only when the fixture sits inside a room's wall loop** (physical placement = implicit consent; never a whole-house bleed — §7). Readings normalize to °C via `tempToCelsius(value, unit)`; the mean is the room's temperature; rooms with ZERO samples render **nothing** (unknown ≠ cold — no interpolation, honest). Pure core in geometry.ts: `aggregateRoomTemps(rooms, loops, samples)` → `RoomTemp[]` (`{roomId, loop, cx, cy, tempC}`, in `rooms` order, only sensor-bearing rooms) and `heatmapColor(tempC, comfortLo, comfortHi)` → `{band, color}` — a crude toon-flat 5-band diverging ramp (`cold #1e5fd0` / `cool #4dd0ff` = vent-cool / `comfort #7ec87e` faint / `warm #ffb74d` = env warn / `hot #ef5350` = env danger), `HEATMAP_BAND_SPREAD` = 3 °C past each comfort-band edge before the extreme. `Planner.roomHeatmap()` (runtime getter, gated on the layer — returns `[]` when off) reads live states + calls the pure aggregate; both the 2D RAF and the 3D key consume it. Comfort band lives in `Store.heatmap` (`{comfortLo?=20, comfortHi?=24}` in °C; in `_loadFromHa`'s field list; edited in Settings ▸ Display, °F-converted when `store.imperial`). **Layer** `Layers2D.heatmap` (DEFAULT OFF, like `activity`/`vacuumMap` — sidebar "Temperature heat-map"): 2D `drawHeatmap` fills each room's wall-loop at low alpha + a temp label near the centroid (after ground / before walls; RAF tracks live temps); 3D `_heatmapGroup` + `updateRoomHeatmap(rooms, comfortLo, comfortHi)` builds flat translucent `ShapeGeometry` patches at y≈5 (occupancy/ground-patch idiom), under the `_keyHeatmap` dirty key (`configRev + comfortLo/Hi + per-room 0.5°-bucketed temp` — jitter under 0.5° doesn't rebuild), visibility via `setLayerVisibility` (`v.heatmap === true`). Temperature EnvSensor + thermostat ids are **already** config-path in `_isSlowEntity` (no change).

### Water valves & smart plugs (Phase 2b)
Two per-floor bindable-control fixtures, built via the standard canvas-fixture
recipe. Both persist per-floor (`Floor.valves` / `Floor.plugs`, repairFloor +
defaultFloor backfill `[]`) and translate with `translateFloorContent`; both
click-to-toggle from every path (2D click-vs-drag + kiosk branch, 3D raycast).

- **Water valve** (`ValveFixture`, tool `valve` 🚰): a floor pipe run + valve
  wheel, **free placement with a rotation** (no wall snap). Bindable to a
  `valve.*` (open/opening/closed/closing + optional `current_position`), a
  `switch.*` (irrigation-zone pattern — `switch.*` is already slow-path), OR a
  `binary_sensor.*` (display-only). State resolves through the pure
  `valveOpenness(st)` (geometry.ts, 0..1, mirrors `doorOpenFraction`
  conventions) + `valveIsOpen`/`valveFlowing`/`valveTransitional`. **2D**
  (`drawValves`, sensors layer): pipe + hand-wheel (rotates ∝ openness), OPEN =
  blue water-flow dashes animating along the pipe (RAF `lineDashOffset`),
  opening/closing pulses; unbound dims. **3D** (`_valveGroup` +
  `updateValves(valves, stateProvider)` under three-view `_keyValves` =
  configRev + resolved state + 5%-bucketed openness): two pipe cylinders + a
  valve body + a hand-wheel torus whose `rotation.z` encodes openness; while
  OPEN a translucent blue flow segment is laid over the pipe and its material
  enrolled in `_valveFlows` for a per-frame opacity pulse via `_advanceValves()`
  (called from `updateTargets`, the `_evPulses` zero-alloc idiom; `_valveFlows`
  reset in `clearTransientGroups`). Rides the **sensors** layer; raycast
  `userData.kind='valve'`. **Toggle**: `Planner.toggleValve(v)` — valve domain →
  **`valve.open_valve`/`close_valve` picked by current state (NEVER a blind
  toggle)**; `switch` → `switch.toggle`; `binary_sensor` → display-only; unbound
  → flip `localState`. Gated by `allowControl !== false` + uiMode (view refuses,
  kiosk fires; save() no-ops outside edit → kiosk flips session-only). Valve
  entity ids are **config-path** in `_isSlowEntity` (scoped to current floor).
  Sidebar `_section('valves', …)`: label, rotation, "Allow open/close", bind
  (domains `['valve','switch','binary_sensor']`), lock, delete.
- **Smart plug** (`PlugFixture`, tool `plug` 🔌): a wall outlet plate,
  **wall-snaps flush like a switch (no ganging)** via `snapPlugToWall`
  (geometry.ts, offset `WALL_HALF + PLUG_PLATE_DEPTH_MM/2`, rotation
  `atan2(nx,ny)`) at `height` default 300 mm. Bindable to `switch.*`/`light.*`
  (the outlet load) + an optional `powerEntity` (sensor W) — **`powerEntity`
  stays LIVE-path** (chatty; the 3D key folds a 50 W-bucketed reading recomputed
  each tick, like `Furniture.powerEntity`), the main entity id is config-path.
  **2D** (`drawPlugs`, switches layer): outlet plate + socket slots + LED; ON =
  green energized glow scaled by `powerGlowScale(W)` + a `NW` chip when a power
  sensor is bound. **3D** (`_plugGroup` + `updatePlugs` under `_keyPlugs` =
  configRev + on/off + bucketed W): plate + slots + LED + cord hint, emissive
  green while on (intensity ∝ power glow). Rides the **switches** layer; raycast
  `userData.kind='plug'`. **Toggle**: exactly a switch — `Planner.toggleItem`
  (bound → `toggleEntity` domain-aware; unbound → flip `localState`), gated at
  every call site by `allowControl !== false` (toggleItem itself has no
  allowControl notion, so the guard lives in the click paths). Sidebar
  `_section('plugs', …)`: label, height, "Allow toggle", bind (`['switch','light']`),
  power bind (`sensor`), lock, delete.

Test page `test-pages/valve-plug-test.html` (`VALVEPLUG PASS 53/53`): pure
`valveOpenness`/`valveIsOpen`/flowing/transitional matrix + `snapPlugToWall`
flush offset; renderer wheel-rotation-differs + flow-segment-only-while-open +
flow-pulse + plug on/off emissive + layer gating; real-Planner `toggleValve`
dispatch (open_valve vs close_valve by state, switch.toggle, binary display-only,
allowControl refuse, unbound localState, view refuse / kiosk fire) + plug toggle.

### Projector fixture & screen bias lighting (home-theater arc)
`ProjectorFixture` (`Floor.projectors`, repairFloor + defaultFloor backfill `[]`) — a ceiling/shelf-mounted projector built via the camera-fixture recipe (free placement, no wall snap): tool `projector` (📽), `drawProjectors` (2D 📽 lens glyph + label; while PROJECTING a translucent **dashed throw wedge** toward the target screen — or along the `rotation` heading if none — the perpendicular half-spread at the screen ≈ `len/(2·throwRatio)`), `hitProjector`, drag kind `projector` (click-vs-drag: tiny move → `toggleItem`, real move → grid snap; **free placement, no wall snap** like a camera/safety sensor), sidebar `_section('projectors', …)` (bind via entity-picker domain `['media_player','switch','light']`, **screen picker dropdown** listing the floor's `wall_tv`/`tv` pieces, height, rotation (shown only when no screen bound), throwRatio, beam color, lock, delete), 3D `_projGroup` + `updateProjectors(projectors, furniture, stateProvider)` under `_keyProjectors` (three-view: configRev + bound on/off state + `localState` + the aimed screen's plan geometry so the beam recomputes when the screen moves), visibility riding the **sensors** layer, raycast `userData.kind='projector'` → `toggleItem` (kiosk toggles session-only; view refuses). **Projecting** = `projectorProjecting(effectiveState?.state)` ('on'/'playing'); unbound pieces click-toggle `localState` (the "local control of unbound interactive objects" pattern). The 3D build = a small dark body + emissive lens; while projecting, a translucent **light-frustum cone** from the lens (apex) to the aim point (base) + a soft additive **glow quad** on the screen face — both flat additive `MeshBasicMaterial` (the documented weather/fog exemption; `userData.outlineSkip`, NO inverted-hull shell; the cone carries `userData.dir` = the lens→screen unit vector as a test hook). **Aim math** is the pure `projectorAim(proj, screen|null)` (geometry.ts): screen present → its center (`screenCenterHeight(kind)`: wall_tv 1350 / tv 700); else a heading-based default throw (`sin θ, cos θ` plan dir, distance = `throwRatio × PROJECTOR_DEFAULTS.reachImgW`). Bound projector entity ids are config-path in `_isSlowEntity` (scoped to the current floor). **Screen bias lighting**: `Furniture.biasLight?: { entityId?; color? }` on `tv`/`wall_tv` pieces — a bound light/switch `entityId` 'on' (else no entityId = AUTO while the TV itself plays/on) adds a soft **emissive halo plane BEHIND the screen** (proud toward the wall at +Z, larger than the panel — mind the coincident-face gotcha; `userData.biasHalo`, outline-skipped) in the config color (default warm white `#fff1d6`, `biasLightColor`), + a 2D halo-ring stroke around the footprint (`drawFurniture`). Bias state folds into three-view's `_keyFloor` appliance hash (`updateFloor` resolves `biasOn`/`biasColor` and passes them through `_buildFurniture`'s `opts`); the bias entity id is config-path too. Sidebar: a "Bias light" checkbox + color + optional entity bind on the tv/wall_tv furniture editor. Test page `test-pages/theater-test.html` (`THEATER PASS 30/30` — pure aim/throw/projecting helpers, projector body + beam-only-while-projecting + cone-aims-at-screen (dot ≈ 1) + glow overlay, unbound `localState` toggle, bias halo AUTO/entity/off/none).

### HVAC thermostat wall control fixture
`ThermostatFixture` (`Floor.thermostats`, repairFloor + defaultFloor backfill `[]`) — a wall-plate fixture bound to `climate.*`, built via the alarm-keypad recipe: tool `thermostat` (🌡), `drawThermostats` (2D plate with a **mode-colored screen band** (`hvacModeColor`: heat `#ff7043` / cool `#42a5f5` / heat_cool magenta / auto green / dry teal / fan_only grey / off dim) showing `cur°→target°`; while `hvac_action` is active it pulses (`performance.now()` alpha) + animates airflow arcs below the plate in the vent color), `hitThermostat`, drag kind `thermostat`, sidebar `_section('thermostats', …)` (bind via entity-picker domain `climate`, "Allow control" checkbox **default ON** (`allowControl !== false`), height, label, lock), 3D `_thermoGroup` + `updateThermostats` under `_keyThermo` (three-view: configRev + per-unit `mode|hvac_action|temps(bucketed 0.5°)|localTemp`), visibility riding the **sensors** layer, raycast `userData.kind='thermostat'`. Wall-snap: `snapThermostatToWall` (geometry.ts) — flush like a switch/alarm (offset `WALL_HALF + THERMO_PLATE_DEPTH_MM/2` = 63 mm), **no ganging**. Clicking (2D click-vs-drag + kiosk branch, 3D raycast) opens `<diorama-thermostat-modal>`: bound+`allowControl` → current/target temp with +/− steppers (single OR `target_temp_low/high` range), HVAC-mode buttons restricted to the entity's `hvac_modes`, fan/preset dropdowns gated on `supported_features` (`climateFeature`/`CLIMATE_FEATURE` bitmask) — setpoint taps are **optimistic + debounced ~400 ms** before the `climate.set_temperature` call; `climate.set_hvac_mode`/`set_fan_mode`/`set_preset_mode` fire immediately (all fire-and-forget). Bound view-only → readout only; unbound → local demo (`localState` mode + `localTemp` setpoint; single-setpoint only). View mode never opens it; kiosk opens it. **Planner dispatch**: `setThermostatMode`/`setThermostatTemp(id, temp[, low, high])`/`setThermostatFanMode`/`setThermostatPresetMode` — bound+allowControl → real service calls, unbound → mutate localState/localTemp + save (no-op outside edit → kiosk session-only) + emitConfig; **all refuse in view mode**. Bound climate ids are config-path in `_isSlowEntity` (scoped to the current floor). **Vent airflow** (the headline effect — `hvacAirflow(mode, action)` resolves `heat`/`cool`/`fan`/null; action wins, mode is the fallback for integrations w/o `hvac_action` + unbound demo): a slatted wall vent below the plate glows in the vent color (`HVAC_VENT_COLORS`) and, while airflow is active, emits ONE small `THREE.Points` cloud (~26 pts, `PointsMaterial` — the documented toon-factory exemption; shared `_ventTex` built once, disposed only in `destroy()`) built under `_keyThermo` and advanced every frame by `_advanceVents(dt)` from `_animate` — **zero allocation**: mutate the position buffer in place, recycling each particle at the vent origin once `life > _VENT_LIFE`. Heat rises + flares, cool sinks + spreads, fan blows straight out. `_ventClouds` is reset in `clearTransientGroups` (floor switch) so `_advanceVents` never iterates freed geometry. Colors + feature bitmask + `clampSetpoint` (shared modal stepper math) live in geometry.ts (pure, 2D+3D+modal). Test page `test-pages/thermostat-test.html` (`THERMO PASS 65/65`).

### Action buttons (Display & Controls arc, batch DC-B)
`ActionButton` (`Floor.actionButtons`, repairFloor + defaultFloor backfill `[]`) — a generic "any-action" button (wall plate / table / floor puck) that DISPATCHES a configurable HA service; NOT an entity to bind but a dispatcher UI. Canvas-fixture recipe: tool `action` (🔘), `drawActionButtons` (2D rounded plate + accent-colored circular cap + glyph + label; press flash = cap shrink 15 % ≤300 ms then expanding ring pulse ≤800 ms, read from `Planner.actionPressFx`; steady glow while a bound `script.*` is `on`), `hitActionButton` (square half-extent from `actionButtonHalfPx`, drawn last frame), drag kind `action`, sidebar `_section('actions', …)` (action-kind dropdown, per-kind target picker, custom domain/service + JSON service-data with inline validation, glyph/color, wallMount + confirm toggles, Test button, lock), 3D `_actionGroup` + `updateActionButtons` under `_keyActions` (three-view; configRev + fixture list + bound-script running state) with raycast `userData.kind='action'`, **rides the `switches` layer** (2D `drawAll` gate + 3D `setLayerVisibility`). Wall-snap `snapActionButtonToWall` (geometry.ts) — flush like a switch/alarm (offset 65 mm), **no ganging**; `wallMount:false` = free table/floor puck (3D pedestal + blob shadow, plate faces up). **Dispatch** `Planner.fireAction(btn, skipConfirm?)` (research §2.1 table): `button_press`→`<button|input_button>.press`, `scene`→`scene.turn_on`, `script`→`script.turn_on`, `automation_trigger`→`automation.trigger`, `toggle`→`toggleEntity` (domain-aware + `homeassistant.toggle` fallback), `custom`→chosen `domain.service` with optional entity target + parsed `serviceData` JSON. Fire-and-forget try/catch; **view refuses, kiosk fires** (like alarm/lock/robot — "no write-back" is Diorama's own store); `confirm` → browser `confirm()` (edit+kiosk; the sidebar Test button + `skipConfirm` bypass it); unbound non-custom → flip `localState 'on'` for a standalone pulse. No `save()`/`emitConfig()` on fire (nothing persisted mutates); `actionPressFx` is runtime-only (pruned >900 ms) — 2D reads it directly, 3D `advanceActionButtons` eases the cap depress + emissive pulse per-frame from a renderer press-time map three-view syncs (`syncActionPresses` each tick; `pressActionButton` on 3D click). Bound target ids are config-path in `_isSlowEntity` (scoped to the current floor). **Double-fire cooldown**: `fireAction` has a per-button ~500 ms cooldown (`_actionCooldownAt`, `performance.now()`) armed only once committed to fire (a cancelled confirm never arms it) — the 700 ms synthetic-click de-dupe only covers the 2D canvas layer, so the 3D-raycast + sidebar-Test + 2D-click paths could otherwise each dispatch the same press (asserted in `action-button-test.html`). **Last-fired affordance**: the sidebar action row shows a dim "fired N ago" line from `actionLastFired(st)` (geometry.ts, pure) — scene/button/input_button state IS the last-activation timestamp; script/automation carry `attributes.last_triggered`; relative-time via `relTimeText`; re-renders on the config channel (ids already config-path). **Recent-trigger bubble tier**: a press feeds the thought-bubble trigger tier as kind `action_button` (`BUBBLE_POOL_TRIGGER.action_button` = ✨💡🎬👍) — three-view's `_recentTrigs` scan reads `Planner.actionPressFx`, de-dupes on the press timestamp (`_actionTrigAt`, cleared on floor switch), and pushes one 45 s entry per press at the button's world x/y so nearby avatars react. Test page `action-button-test.html` (`ACTIONBTN PASS 32/32`).

### Vehicle, EV charging & mailbox (phase 1b)
Three state-driven `FurnitureKind`s riding the existing furniture pipeline
(types → `FURNITURE_KINDS` → `drawFurniturePrimitiveLocal` → `_buildFurniture`
→ appliance-state hash), all item-level bindings (no `repairFloor`), all bound
ids config-path in `_isSlowEntity` (the dedicated fields; the car's presence
`entity_id` stays live-path like other furniture — the hash reads it each tick).
The **`vehicle` cat** (new; `furnitureCat` optgroup "Vehicle / garage") groups
`car` + `ev_charger`; `mailbox` rides the **`outdoor`** cat.
- **Garage-bay vehicle** (`car`, ~1850×4800×1450): `isVehicleKind`. Binds a
  binary_sensor **presence** via the generic `entity_id` (picker domain
  `binary_sensor`). Bound + state ≠ `'on'` → renders **GHOSTED** (3D:
  translucent 0.15 — transparent materials auto-skip outline shells + the blob
  shadow is suppressed; 2D: dim dashed outline + "away" caption). Bound-on OR
  **unbound** → solid (unbound cars are plain furniture, never ghosted). 3D:
  body + cabin + dark glass band + 4 wheels + emissive head/tail light hints.
  Cars are NOT raycast-clickable (tagged with `fixtureId` only, no `userData.kind`).
- **EV charging status** (`Furniture.evCharger?: {statusEntity?; powerEntity?}`
  on `car` + the small `ev_charger` post fixture ~350×250×1200): status resolved
  by the pure **`evStatusOf(state)`** (geometry.ts) mapping ANY vendor's state
  STRING defensively (design around the common shape, never one vendor's ids —
  see `docs/research/ev-charger.md`): `charging` (green pulse) / `full` (steady
  green) / `error` (red) / `idle` (dim slate) via `EV_STATUS_COLORS`/`evStatusColor`.
  The `ev_charger` fixture shows a state-colored port LED + hanging cable hint.
  `carChargeState(car, furniture, stateOf)` (shared 2D+3D, geometry.ts) resolves
  whether a car should show a charge indicator: its OWN `evCharger` binding
  charging OR any charger piece within `EV_CAR_RANGE_MM` (1500) charging → a 2D
  bolt (+SoC % from a battery attr via `evChargePercent`, or kW) + a 3D emissive
  green **port glow** on the car. Charging ports (car + charger LED) register in
  `_evPulses`, pulsed per frame by `_advanceEvPulses` (fireplace-flicker idiom;
  reset each `updateFloor` like `_speakerPulses`).
- **Mail/packages badge** (`Furniture.mailCount?: {countEntity?; flagEntity?}` on
  `mailbox` ~250×350×1100 post box): `countEntity` (Mail-and-Packages numeric
  sensor) > 0 → floating count badge (2D chip + 3D `_makeTextSprite`, freed by
  the `_floorGroup` `_disposeSpriteMaps` pairing) + the flag raised; `flagEntity`
  (binary_sensor lid) `'on'` tilts the lid open (build-time). Zero/unbound =
  plain closed mailbox, flag down, no badge.
- **Hash + keys**: three-view's appliance-state hash predicate widened to
  `isVehicleKind || ev_charger || mailbox || evCharger || mailCount`; it folds
  the car presence (`on`), ev status+power bucket, and mail count+lid states so
  `_keyFloor` rebuilds the whole floor on any change (which also refreshes an
  adjacent car's indicator when a charger's status flips). Sidebar: car gets the
  generic bind row (binary_sensor); car+ev_charger get `_evChargerRows`; mailbox
  gets `_mailboxRows`. Test page `vehicle-mail-test.html` (`VEHICLEMAIL PASS 25/25`).

### Alert center & beacons (Alert Center feature — see `docs/research/log-events-alerting.md`)
Surfaces HA's "needs a human's attention" streams (persistent notifications +
the Repairs issue registry) into the panel. Pure normalization lives in
**`src/alerts.ts`** (three.js-FREE, deterministic, testable — same shape as
weather.ts/geo.ts): the `PanelAlert {id, source, severity, title, message?,
createdAt, dismissible, domain?/issueId?/notificationId?/learnMoreUrl?}` shape,
`buildAlertFeed(notifications, repairs, cfg)` (per-source toggles, Repairs
severity floor, sorted most-severe-then-newest), the severity ladder
(`info<warning<error<critical`, `severityRank`/`SEVERITY_COLOR`),
`classifyNotificationSeverity` (heuristic — persistent_notification has NO
severity, inferred from title/message substrings, APPROXIMATE by design),
`repairSeverity`, `worstSeverity`/`unreadCount`, `alertCenterEnabled`/
`alertBellVisible`, plus the placeable beacon's state resolution
(`alertBeaconState`/`ALERT_STATE_COLORS`/`alertBeaconAlarming`/`isAlertDomain`).

- **HaApi additions** (all three clients + LocalApi inert): `subscribePersistentNotifications(cb)`
  (WS `persistent_notification/subscribe` — non-admin-safe, pushes a `current`
  snapshot then add/update/remove deltas keyed by id; resolves to an unsubscribe
  handle, never throws), `listRepairsIssues()` (WS `repairs/list_issues` —
  **admin-only**; catch → `[]` so a non-admin kiosk degrades to no repairs),
  `ignoreRepairsIssue(domain, issueId, ignore)` (WS `repairs/ignore_issue`).
  `normalizeRepairs` (shared in ha-client.ts) maps `dismissed_version` →
  `ignored`. Notification dismiss rides the existing `callService`
  (`persistent_notification.dismiss`) — no new HaApi method. Repairs have **no
  push** — polled on `Planner.ALERT_REPAIRS_POLL_MS` (3 min), same idiom as the
  Open-Meteo poll.
- **Store.alerts** (`AlertsConfig`, optional/opt-out, in `_loadFromHa`'s explicit
  field list): `enabled?` (absent = on), `showPersistentNotifications?`/
  `showRepairs?` (default true), `minRepairSeverity?` (default 'warning'),
  `showInKiosk?` (default false — §7: Repairs/notification text can be
  instance-specific, so the bell is edit-only unless opted into kiosk/view).
- **Planner** (runtime-only, mirrors weatherNow/blePeople): `notifications`
  (kept live by the subscription — a Map maintained from the deltas, `emitConfig`
  on each change → the bell pulses), `repairIssues` (polled), the derived
  `alertFeed` getter, `setAlertsConfig(mut)`, `dismissAlert(a)` (routes by source;
  view mode refuses; optimistic local removal), `acknowledgeAlertBeacon(b)`
  (bound alert.* → `alert.turn_off` = ACKNOWLEDGE when active; bound
  binary_sensor = display-only; unbound → `toggleItem` demo flip). Collectors
  start one-time on the first full state load (auth done, states arrived — same
  hook as `_weatherInited`) via `_reconfigureAlertCenter`; re-run on
  `_applyLoadedStore` + `setAlertsConfig`; `_stopAlertCenter` tears the
  subscription + poll down when disabled.
- **Global Alert Center UI** (`<diorama-alert-center>`, light-DOM, self-contained
  like the weather chip): a topbar 🔔 bell + severity/unread badge that opens a
  screen-space dropdown of severity-tinted alert rows (relative time, per-source
  Dismiss/Ignore, "view in Repairs →" deep-link). A new unread alert PULSES the
  bell (CSS keyframe injected once). "Seen" ids are client-local
  (`localStorage['diorama:alerts:seen']`, never HA). Visibility via
  `alertBellVisible` (edit always; kiosk/view only with `showInKiosk`; hidden
  offline). Mounted in `topbar.ts` next to the conn pill. Settings ▸ Integrations
  gains an "Alert Center" block (per-source toggles + severity floor +
  showInKiosk). **Deferred (noted, not built): the separate bottom-right toast
  tray and the recent-trigger thought-bubble tie-in** (§4.1) — the bell+badge+
  drawer is the authoritative core; the bubble hook touches three-view._tickOnce
  (owned by a concurrent surface).
- **Alert Beacon fixture** (`AlertBeacon`, `Floor.alertBeacons`, repairFloor +
  defaultFloor backfill `[]`) — a near-clone of the Safety Sensor recipe (ceiling
  puck, free placement, no wall snap; rides the `sensors` layer). Tool
  `alertbeacon` (🔔), drag/userData kind `alert`. Bind an `alert.*` (ideal —
  three-state acknowledge) or ANY binary_sensor (§4.2, NOT domain-locked). 2D
  `drawAlertBeacons` + `hitAlertBeacon`; 3D `_alertGroup` + `updateAlertBeacons`
  (disc + LED + expanding rings while ACTIVE) under three-view's `_keyAlert`
  (configRev + per-beacon resolved state, **forced every frame while any beacon
  is active** — the safety/fireplace idiom). State via
  `effectiveState → alertBeaconState`: alert.* `on`→active (pulsing red), `off`→
  ack (steady amber), else idle (dim); binary_sensor only on(active)/off(idle).
  Clicking (2D click-vs-drag + kiosk + 3D raycast `userData.kind==='alert'`) →
  `acknowledgeAlertBeacon`. **Delta vs the task brief**: the doc (§4.2) binds an
  ENTITY (like the Safety Sensor), not a global-feed pattern-matching rule — the
  beacon is entity-bound, so "rule matching" reduces to entity-state resolution.
- **Explicitly NOT built** (§4.3): no beacon for system_log (no room association)
  or logbook (a query, not a live alert); those stay out of the scene.
- Test page `test-pages/alert-center-test.html` (`ALERTCENTER PASS 67/67`) —
  bundles the pure `alerts.ts` (feed/severity/floor/badge/beacon-state matrices)
  + the REAL Planner over an in-page fake HaApi (collector subscription snapshot/
  add/remove deltas, repairs poll, dismiss round-trips, view-mode refusal, beacon
  acknowledge routing). Build: two `esbuild --bundle` bundles like config-test.

### Yard flagpole fixture & ground light kinds
- **Flagpole** (`FlagpoleFixture`, `Floor.flagpoles`, repairFloor + defaultFloor backfill `[]`; tool `flagpole` 🚩, free placement, no wall snap): a tapered two-cylinder pole + gold finial + a waving cloth flag. The flag design comes from the **pure flag library `src/flags.ts`** (`FLAG_PAINTERS: Record<id, {label, dominant, paint(g,w,h)}>` — canvas painters, ZERO three.js; 16 flags incl. country + novelty; default `usa`). 3D `_flagpoleGroup` + `updateFlagpoles(list, stateProvider, windRad, windKmh)` under three-view `_keyFlagpoles` (configRev + windBucket + per-pole flag/height/halfMast/bucketed-hoist); rides the **`furniture`** layer (yard decor). Flag = TWO FrontSide planes sharing ONE geometry + ONE `CanvasTexture` (back rotated π, un-mirrored — the sky-banner technique), rippled per-frame in `_advanceFlagpoles` (shared-buffer vertex displacement, the `_animateBedCover` idiom; zero alloc) with an eased hoist blend (appliance-door idiom, survives rebuilds) + a slight eased wind yaw. Per-flag CanvasTextures cached in `_flagTexCache`, disposed only in `destroy()`. **Hoist fraction** (1 full / 0.5 half / 0 down) via pure `flagpoleHoistFraction(fp, st)` (geometry.ts): bound `entityId` (sensor/number percent 0..100, or cover.* position) → else `halfMast` → else full; entity is config-path in `_isSlowEntity`. Display-only (no click-to-toggle). Wind is reached cheaply from the same `_weatherFxState` (`windBearingPlanRad`/`windKmh`) that feeds bg-text — no new plumbing (0 / no yaw when no weather source). 2D `drawFlagpoles` (furniture layer): base dot + pole + waving-flag glyph tinted by the flag `dominant` + ½ half-mast mark. **Adding a flag = one painter + one `FLAG_PAINTERS` entry, nothing else** — see `docs/FLAGS.md`. Test page `test-pages/flagpole-test.html` (`FLAGPOLE PASS n/n`).
- **Ground `LightIconKind`s** `inground` (⤒) + `ground_spot` (⟰): `inground` = recessed flush trim ring + emissive lens beaming UP (widening translucent cone, apex at ground) + a TIGHT glow ring around the lens INSTEAD of the standard floor pool (both in the pool-skip list, like sconce). `ground_spot` = a stake + aimable head using `lightRotation` (azimuth) + the NEW `Light.tilt?` (deg above horizon, default 35, clamp 5..85 via `lightTilt`; sidebar slider shown only for this kind) → a focused beam cone (carries `userData.dir` = world aim [fdx·cosT, sinT, fdz·cosT]) + an elongated ground pool ellipse offset along the azimuth by throw = `lr/tan(tilt)` (low tilt → long throw; `userData.poolOffset` test hook). `Light.tilt` rides `_keyLights` via configRev.

### Yard arc: ground coverings, outdoor objects, grid layer (batch K)
- **Ground areas** (`Floor.groundAreas`, repairFloor backfill; `GroundKind` grass/rock/concrete/blacktop/mulch/sand/water): polygon paint on the ground plane. Draw latch `drawingGroundArea` (PARALLEL field mirroring `drawingPresenceZone` — the codebase convention is parallel latch fields, not a shared-kind refactor), `ground` tool, `groundVert` vertex drag, low-priority hit-testing (after ALL item hits — paint never swallows fixture clicks). 3D: `updateGroundAreas` — one ShapeGeometry patch per area at **y=4** with procedural `_groundTexture(kind)` toon textures (`_groundTexCache`, disposed only in destroy; `_texCache` disposal was also added there); water = opacity 0.85. Blob shadows (transparent, y=8) always paint over patches. 2D: flat kind-colored fills right after the floor. Own layer key `ground` (absent = on); NON-nav (paint only). Note: like presence zones, a big area captures select-mode left-clicks — hide the layer to click through.
- **Ground grid**: the 3D backdrop is a single `THREE.GridHelper` on `_scene`, previously visible iff no bg image. Now `(layers.grid !== false) && !bgVisible` — gated in updateFloor (cached `_bgVisibleNow`) AND reapplied per tick in setLayerVisibility; `layers.grid` in `_keyFloor`; sidebar layer "3D grid". There is NO 2D plan grid (nothing to gate).
- **Outdoor FurnitureKinds** (`outdoor` cat — the optgroup label entry was also missing and is now added, surfacing the bins too): `tree`, `pine_tree`, `bush`, `flower_bed`, `bird_bath`, `fountain` (static translucent water column — no particles v1), `swingset`, `lawn_chair` (`seat: 380` — real SitSpot, avatars sit outdoors), `picnic_table` (plain `surface` + `activity: eat_at_table`, NO seat — a centered SitSpot would land on the tabletop; sit at it via lawn_chairs). Standard blob shadows + outlines. Test page `yard-test.html` (YARD PASS 4/4).

### Terraced terrain & yard fill (batch T1) + fences & gates (batch T2)
Design `docs/DESIGN-terrain.md`; research `docs/research/terrain-enhancements.md`.
- **Terraces**: `GroundArea.elevationMm?` (item-level, absent = 0 = flat) — the
  top patch builds at `elevationMm + 4` plus a per-edge quad-strip **skirt ring**
  down to `groundAreaSkirtBase(area, all)` (geometry.ts, pure — the elevation of
  the ENCLOSING tier: the smallest strictly-larger containing polygon, any
  elevation sign; nested tiers stack correctly, and a raised pad inside a sunken
  tier skirts down to that lawn instead of clamping at 0).
  Skirts are ANGLED (base out-flared `|Δh|×1.5`) for grass/mulch/sand, VERTICAL
  for rock/concrete/blacktop/water; same `_mat()`/`_groundTexture`; `outlineSkip`;
  concave self-intersection is an accepted v1 artifact. Hills = hand-nested
  polygons (no auto offsetting). **Nav**: `updateFloor` (which owns `_terrain`)
  registers each non-zero area top as `_terrain` kind `'terrace'` carrying its
  real polygon (bbox pre-filter + point-in-polygon), and `_groundYAt`'s flat-top
  branch includes it — avatars/blob shadows/ROBOT RIGS (now re-grounded via
  `_groundYAt` in `updateRobotRigs`) ride terrace tops; no slope walking (the
  stairs/riser precedent). GroundAreas still never block nav. 2D: inset
  lighter/darker contour ring + selected `±N mm` caption. Sidebar elevation input.
- **Yard fill**: `Floor.yardFill?: GroundKind` (optional pass-through, no
  repairFloor) — opt-in underlay patch at y=2 (2D analog) covering the floor rect
  MINUS closed wall loops (earcut holes), under user paint at y=4; "Yard fill"
  dropdown in the Floors section. `_keyGround` folds yardFill + floor dims + wall
  hash + per-area elevationMm.
- **Fences/hedge**: `WallKind` + `fence_picket` (rails+posts+flat pickets,
  h 1100) / `fence_privacy` (solid extrusion, h 1800, 60 thick) / `fence_chainlink`
  (posts + semi-transparent diamond-mesh plane — flat `MeshBasicMaterial`
  DoubleSide, a documented `_mat()` exemption; plane UVs scale per segment, never
  `texture.repeat` on the shared `_fenceMeshTexture`) / `hedge` (green solid
  extrusion + crown box, h 900, 450 thick, `_hedgeTexture` speckle). Shared
  textures disposed only in `destroy()`. Openings punch through privacy/hedge via
  the kind-agnostic `wallCutsForSegment`; fences block nav like solid walls
  (rasterizer only skips `invisible`). Wall-kind picker in sidebar is HAND-LISTED
  (not enumerated) — new kinds must be added there.
- **Gates**: `Door.kind: 'gate'` — picket-styled ~1100 swinging panel on the
  shared swing/lock/doorbell/`doorOpenFraction` machinery (cover.* with
  device_class `gate` binds like any cover). Doors snapped onto a fence/hedge
  wall DEFAULT to `'gate'` silently (`nearestWallKind` in canvas-interact);
  override via the Doors Kind dropdown (now swing/garage/gate).
- Test pages `terrain-test.html` (103/103), `fence-gate-test.html` (37/37).

### Yard life (batch T3): water shimmer, fountain spray, sprinklers, rock_cluster
Design `docs/DESIGN-terrain.md` (T3 bullet); research `docs/research/terrain-enhancements.md`
§3.4a/§3.4b/§3.5/§3.7 + `docs/research/irrigation-sprinklers.md` (authoritative sprinkler design).
- **Water shimmer**: each `water`-kind GroundArea patch/skirt/yardFill gets a cheap
  build-time CLONE of the shared `_groundTexture('water')` (shares the source canvas,
  own `offset`/`repeat`) tracked in `_waterPatchTextures`; `_advanceGroundWater(dt)`
  (from `_animate`, early-returns when none) drifts each clone's `offset.y` per frame
  (zero alloc). Clones are NOT freed by `_clearGroup` (it disposes materials, not maps —
  the shared cache must survive) so they're disposed explicitly at the top of every
  `updateGroundAreas` rebuild + in `clearTransientGroups`/`destroy` (`_disposeWaterPatchTextures`).
  A patch + its skirt share one clone (ripple in unison).
- **Fountain spray**: the `fountain` FurnitureKind builds a ~40-pt `THREE.Points` plume
  (PointsMaterial — the documented `_mat()` exemption; reuses `_rainTexture()`) arcing up
  from the spout + recycling at basin height, registered in `_fountains` (reset in
  `updateFloor` + `clearTransientGroups`); `_advanceFountains(dt)` integrates ballistic
  motion + gravity in place (zero alloc, `BufferAttribute`-by-reference idiom like weather
  precip). Always-on v1 (no binding). Points are `outlineSkip`, not counted by `isMesh`.
- **Sprinkler zones** (`SprinklerZone`, `Floor.sprinklerZones`, repairFloor/defaultFloor
  backfill `[]`): canvas-fixture recipe mirroring the valve/safety-sensor flow — tool
  `sprinkler` (🚿, free placement, no wall snap), `drawSprinklerZones` (head disc + spray
  wedge while running: spray = pulse, rotor = sweeping sub-arc, drip = no wedge; 2D rides
  the **`ground`** layer), `hitSprinklerZone` (point-in-circle on the head; wedge non-
  interactive), drag kind `sprinkler` (click-vs-drag → `toggleItem`), delete-tool branch,
  cursor, kiosk click, sidebar `_section('sprinklers', …)` (bind `['switch','valve',
  'binary_sensor']`, head kind, arc/throw/heading, zone #, lock, delete). State via the
  pure `sprinklerRunning(st)` (geometry.ts, mirrors valveIsOpen; switch on / valve
  open+opening / position>0 / binary on). 3D `_sprinklerGroup` (rides the `ground` layer)
  + `updateSprinklerZones(zones, stateProvider)` builds a head nub (Y via **`_groundYAt`**
  so a head on a terrace sprays from terrace height — the T3 delta) + a per-RUNNING-zone
  `THREE.Points` fan (SCENE-coord velocities; rotor jets bias toward a `Math.sin` sweep);
  `_advanceSprinklers(dt)` recycles droplets in place (guarded on "any cloud exists" =
  "any zone running"). Dirty key `_keySprinklers` (three-view) = configRev + keyGround +
  per-zone geometry + a bucketed running boolean (spray animation is per-frame, NOT keyed).
  Raycast `userData.kind='sprinkler'` → `toggleItem`. Zone entity ids are **LIVE-path**
  (NOT added to `_isSlowEntity`) so the spray starts/stops promptly; toggle uses the
  domain-sniffing `toggleEntity` (switch.toggle/valve.toggle), NOT the valve's
  open_valve/close_valve state pick.
- **`rock_cluster`** FurnitureKind (~800×600×500, `outdoor` cat): 4 overlapping low-poly
  grey icosahedron boulders (3D) / overlapping ellipse blobs (2D), deterministic offsets
  (no `Math.random` — survives `_keyFloor` rebuilds), ordinary nav-blocking (no exemption),
  no binding, no activity.
- Test page `yardlife-test.html` (`YARDLIFE PASS 36/36`).

### Authoring polish + pool (batch T4): path/driveway ribbon + pool/spa basin
Design `docs/DESIGN-terrain.md` (T4 bullet + pinned decision 3); research
`docs/research/terrain-enhancements.md` §3.6 + `docs/research/pool-spa.md` (authoritative pool design).
- **Path/driveway ribbon**: `GroundArea.path?: {centerline: Vec2[]; width: number}` — a
  pure AUTHORING convenience layered on the ordinary `GroundArea` pipeline (zero renderer/
  hit/3D changes; `elevationMm` terraces compose for free). `bufferPolyline(centerline,
  width)` (geometry.ts, pure — mitered-offset ribbon, flat end caps, `PATH_MITER_LIMIT` 4
  clamps sharp bends, `PATH_MIN_WIDTH` 100 clamp; returns a closed polygon left-forward +
  right-backward, `[]` when <2 pts). `points` is a CACHE regenerated by `regenGroundAreaPath`
  on every centerline/width edit (never authoritative). New `path` tool (draw latch
  `drawingPath` records CENTERLINE clicks — PARALLEL latch field per convention; dblclick/
  Enter finish ≥2 pts → `finishPath` buffers into a `concrete`-kind path-backed area, ESC
  cancels), `pathVert` drag kind (regen on release + live during drag). Pinned decision 3:
  path-backed areas SUPPRESS raw polygon vertex handles (`hitGroundAreaVertex` bails on
  `g.path`) and show CENTERLINE handles instead (`hitPathVertex`, dashed polyline); sidebar
  gains a width input + "Detach shape" (`detachGroundAreaPath` clears `path`, keeps points →
  plain editable polygon) + "Redraw path" + a "+ Add path" button in Ground/Yard. Deleting a
  selected centerline vertex regens (min 2 pts). Kind defaults `concrete`, user-editable.
- **Pool / spa** (`Pool`, `Floor.pools`, repairFloor + defaultFloor backfill `[]`): a
  polygon water body (parallel latch `drawingPoolArea`, `pool` tool 🏊, `poolVert` drag,
  low-priority `hitPool`/`hitPoolVertex` AFTER all item hits — pool body-select/delete run
  BEFORE ground so a pool over grass selects the pool; selecting clears ground/void). Rides
  the **`ground`** layer (2D `drawPools` + 3D `_poolGroup` visibility — the "wet" sibling of
  ground paint, per pool-doc §4.2). **3D basin** (`updatePools(pools, stateProvider)` under
  three-view `_keyPool` = configRev + per-pool heater-state/pump-on/light-bitmask/water-temp/
  depth/raised/color/points): a dark **basin floor** plane at `poolBasinFloorY` (= `raised −
  depth`), a **vertical skirt** quad-strip (pool-tile toon walls, generalizes T1's terrace-
  skirt builder — answers pool-doc §7's "does the recess technique generalize to an arbitrary
  polygon" = YES), a **coping** ring (radial-outset lip at the rim), a shimmering **water
  surface** at `poolWaterSurfaceY` (= `raised − POOL_WATERLINE_DROP` 100 mm) using the T3
  water-texture CLONE idiom in a SEPARATE `_poolWaterTextures` list (pools rebuild under their
  own key — reusing `_waterPatchTextures` would let `updateGroundAreas` free a pool's clone;
  disposed in updatePools rebuild + clearTransientGroups + destroy), drifted per-frame by
  `_advancePoolWater` (zero alloc). **Heater glow**: `poolHeaterState(st)` (pure, three-state
  off/idle/heating — `hvac_action` wins, else non-off → heating) tints the water material's
  emissive (`POOL_HEAT_GLOW`; heating full / idle dim / off none). **Underwater light**: a
  toon-blue emissive disc mid-basin when any bound `light.*` is on (ScreenLogic lights are
  on/off only → fixed glow). **NAV BLOCKS** the pool footprint in `_buildNav` (void-poly
  idiom, no inflation — avatars path around water). **2D** `drawPools`: water fill + coping
  ring + pump-on ripple bands (RAF) + heater amber glow pulse + a water-quality chip (temp ·
  pH · ORP · salt from bound sensors) + vertex handles + draw preview. **Bindings** (all
  optional, domain-flexible per pool-doc §7): heater `climate.*`|`water_heater.*`, pump
  `switch.*`, 0..n underwater `light.*`, chemistry `sensor.*` (waterTemp/pH/ORP/salt) — all
  config-path in `_isSlowEntity`. A Pool has a `localState` MAP (`{heater?, pump?}`, unlike
  every prior single-`localState` fixture) — `poolHeaterStateOf`/`poolPumpOnOf` resolve
  bound-entity-else-localState; `togglePoolHeater`/`togglePoolPump` flip the sub-field
  (session-only in kiosk). Sidebar `_section('pools', 'Pool & Spa', …)`: kind/name/color/
  depth/raised + equipment binds + chemistry binds + unbound demo toggles.
- **Consciously trimmed from pool-spa.md** (report): the equipment-pad `FurnitureKind`s
  (`pool_pump`/`pool_filter`/`pool_heater`/`pool_chlorinator`, §4.4 — independent furniture
  kinds, addable later via the standard recipe; the pool's own heater binding drives the hero
  water glow); spa bubble/steam `THREE.Points` clouds (§4.3 — `spa` kind is supported as data
  + visual defaults, no particle FX); 3D pump-ripple amplitude modulation (the 3D shimmer is
  always-on; the 2D pump ripple is the pump read); per-light distinct discs + real light
  color + `colorModeEntity` (single fixed-glow disc; ScreenLogic can't report color anyway).
- Test page `path-pool-test.html` (`PATHPOOL PASS 50/50`).

### Bins, floodlight, camera alerts (batch J)
- **Trash/recycle bins**: FurnitureKinds `trash_bin`/`recycle_bin` under the NEW `outdoor` cat (600×700×1100 wheeled curbside; recycle = blue + emblem panel). Bound entity 'on'/'full' = FULL → lid props −15° + overflow lump (3D) / fill-dot (2D); unbound click-toggles localState. Bins are click-tagged `kind:'media'` (its click path is plain toggleItem — `'appliance'` would flip doorOpen; the media dblclick is guarded to bind `binary_sensor` for bins). The `_keyFloor` appliance hash filter is `cat==='appliance' || isBinKind(kind)` — bins fold their state in.
- **Floodlight**: `LightIconKind 'flood'` — mount plate + twin angled emissive heads, pool disc ×1.4 + elliptical (no cone hint; toon pool carries it); wall-snaps flush on drop/release via `snapFloodlightToWall` (offset 70 = WALL_HALF 50 + plate 20, front local −Z, no ganging); glyph 🔆.
- **Camera alert popups**: `CameraFixture.alertEntity` (binary_sensor, config-path like camera ids). Planner `_detectCameraAlerts` (LIVE path) + `cameraAlerting()` with a 6 s linger. 2D: pulsing FOV wedge + a screen-fixed 220×140 snapshot card beside the marker (module image cache keyed by a 3 s cache-bust bucket; ALERT text fallback; drawImage try/caught). 3D: `_camAlertGroup` sprite cards (now-playing mechanics; `_keyCamAlerts` = configRev | sensors flag | per-camera picture + 3 s bucket → rebuilds every 3 s while alerting, clears after linger; `_disposeSpriteMaps` pairing). Renders in all UI modes. Test page `batchn-test.html` (13/13).

### Continuous walls, interactive locks, oven, bg-image fixes (batch I)
- **Walls are ONE extruded mesh per segment** (`_buildSolidWallSegment`): a 2D along-wall × height profile with door openings notching the bottom edge, window openings as interior HOLES, extruded wallT — replaces the old per-run/sub-sill/header/lintel BOX composition whose internal faces showed as horizontal/vertical seams at translucent opacities. `JAMB_OVL` is GONE. `wallCutsForSegment` still supplies the intervals; cutaway tags apply to the single mesh; railings keep their composite build; nav/floor-clip read wall DATA (unchanged). window-test asserts `wall_single_mesh`.
- **Interactive locks**: deadbolt boxes on BOTH door faces (`userData.kind='lock'`, `_doorGroup` in the raycast walker; 2D `hitDoorLock` wins over the panel) — click calls `lock.unlock`/`lock.lock` when bound, flips `Door.lockLocalState` when unbound (view mode refuses; kiosk allowed). `Planner.doorLockState`/`toggleDoorLock`. Sidebar lock badge is clickable. **`Door.lockControl?: 'full'|'display'`** (absent = 'full', today's behavior): `'display'` = the padlock/deadbolt is a PASSIVE state indicator — `toggleDoorLock` refuses (single choke point: `if (uiMode==='view' || door.lockControl==='display') return`), covering the 2D badge, 3D raycast, and sidebar-badge paths in EVERY ui mode incl. edit/kiosk; 2D `hitDoorLock` also skips display-mode doors so the padlock loses its click-priority (clicks fall through to the door open/close beneath, cursor stays `grab`) and draws at ~70 % alpha, and the 3D bolt drops emissiveIntensity ×0.65 as a "look-but-don't-touch" cue. Sidebar Doors editor shows a "Lock control" dropdown when a lock is bound or `lockLocalState` exists. **Lock state → visual resolution** is one shared helper in geometry.ts (mirrors `alarmStateColor`): `normalizeLockState` maps HA's full vocabulary, `lockGlyphColor` (locked=red, unlocked/open=green, **jammed=amber alert** distinct from locked, locking/unlocking/opening=target-state color, unavailable/unknown=grey), `lockGlyphTransitional` (dims the glyph/bolt), `lockGlyphJammed` (2D pulse), `lockGlyphSecured` (closed-shackle/filled 2D body). Consumed by `drawPadlock` (2D), the 3D deadbolt material, and the sidebar badge. `lockControl` folds into `_keyDoors`. Test page `lockoven-test.html` (`LOCKOVEN PASS 31/31`).
- **Oven**: `Furniture.tempEntity` (stove/fridge; config-path) → 2D `N°` chip + 3D temp sprite (env-sprite idiom; temp rounded into the `_keyFloor` appliance hash); stoves are click-tagged `kind='appliance'` — click toggles persisted `Furniture.doorOpen` (ORed into the appliance-door blend as forceOpen; avatar proximity still works), dblclick binds.
- **Bg image fixes**: `_applyBg` re-enables the `bg` layer (primary bug — a preset with bg off silently hid new images; section shows an amber hint when image-present-but-layer-off), names unsupported formats on decode error, downscales >2.5 MB rasters to ≤2000 px JPEG 0.85 before storing (the HA push failed SILENTLY on huge dataURLs — `save()` only console.warns), and sizes zero-intrinsic SVGs to the floor rect. Test page `lockoven-test.html` (8/8); window-test now 15/15.

### Roborock live position & media now-playing (batch H)
- **Vacuum live position**: `RobotFixture.posEntity` (Roborock map camera/image entity) + calibration `posScale`/`posOffsetX/Y`/`posFlipY`/`posRotDeg`. Pure helpers in geometry.ts: `parseVacuumPosition` (object/array/JSON-string, `robot_position`/`position` fallbacks, null on garbage), `vacuumRawToWorld` (`world = R(rot)·S(scale, flipY)·raw + offset`), `vacuumRawHeadingRad`, `solveVacuumDockOffset` (the sidebar "Set dock as reference" one-click solve: offset = dock − R·S·rawDock, reading the live raw at click). LIVE mode in `Planner._stepVacuum` eases to the projected point (no snap-park on docked; parse failure falls back to the simulated roam seamlessly). `posEntity` stays LIVE-path (frequent pushes; the calibration RAW readout refreshes on render).
- **Now-playing**: ANY furniture bound to a `media_player.*` shows, while playing/buffering (paused = dimmed), a camera-facing card sprite above the piece (title — artist, truncated; album art best-effort via `Image` `crossOrigin='anonymous'` from `haBaseUrl + entity_picture`, repainted only on successful load, drawImage try/caught → text-only fallback) + a 2D `♪ title` line. Sprites live in a dedicated `_nowPlayingGroup` OUTSIDE `_floorGroup` (so `_keyFloor` rebuilds don't churn them) under `_keyNowPlaying` = configRev + layer flags + per-media `id:state:title:picture` hash; `_disposeSpriteMaps` pairing on clear/destroy. `parseNowPlaying`/`isMediaPlayerId` are pure (geometry.ts). Media/furniture `entity_id`s remain LIVE-path. Tests: robot-test 48/48, `nowplaying-test.html` 15/15; media-raycast-test expectation corrected to 3 clickables (unbound TVs are intentionally clickable since the local-control batch).

### Presence zones, geo events, cameras, plumbob colors (batch G)
- **Presence zones** (`Floor.presenceZones`, repairFloor backfill; FP2/Frigate-style): user-drawn 3–12-vertex polygons bound to a binary_sensor. Draw latch `drawingPresenceZone` (click verts, dblclick/Enter finish, ESC cancel — wall-draw idiom); selected zones get draggable orange VERTEX handles (`pzoneVert` drag) + a Redraw button; body click selects only. 2D outline (dashed unbound) + occupancy fill glow, 3D flat ShapeGeometry patch at y≈8 glowing when on — both ride the `zones` layer (+`zonesInteractive` gating); `_keyPzones` = configRev + bound states; ids config-path.
- **Geo event pins** (`Planner.geoEventPins`, runtime): scans `geo_location.*` states with numeric lat/lon; needs geoFit; projects/classifies/clamps like gpsPins; label = name + `M<mag> · N km <dir>`; cap 20 nearest; cache `{at, rev, pins}` (configRev + 60 s TTL). `Store.geo.showEvents` (absent = on) toggle in the GPS/Geo section. 2D warning-diamond per source color under the `geo` layer; 3D sprites through the `updateGpsPins` pipeline (sprite-dispose gotcha applies); LIVE-path entities.
- **Camera fixtures** (`Floor.cameras`, tool `camera` 📷): body + lens at `height` (default 2200) with a translucent FOV wedge (fov 90 / range 6000 / rotation like motion sensors) in both views, red tint while `recording`; `_cameraGroup` under `_keyCameras`, `sensors` layer; camera ids config-path. Sidebar row shows a snapshot `<img>` from `haBaseUrl + attributes.entity_picture` + cache-bust ↻ (`Planner.haBaseUrl` = '' in panel/iframe modes (same-origin), the stored connection origin in standalone mode; img `@error` hides — never breaks the sidebar). No in-scene video.
- **Plumbob colors**: `Sensor.plumbobColor` / `MotionSensor.plumbobColor` (optional per-fixture override) — sidebar color rows in the mmWave + motion editors. `TargetWorld.plumbobColor` (additive, optional) is stamped by three-view ONLY for an explicit override (radar/AI/demo/roamer read the fixture's `plumbobColor`; a **fused** radar target stamps the fused person's color when the sensor set none). When unset it is left undefined and **the renderer defaults the plumbob to the target's IDENTITY color** — `wantPlumbob = t.plumbobColor ?? t.color ?? PLUMBOB_GREEN` in `updateTargets`: `t.color` is the sensor tint (`sensorColor(s,idx)`) for radar, the motion/roamer `color` for AI/demo/roam, the person color for BLE — so every avatar's plumbob visually matches the source it originated from without any config. An EXPLICIT `plumbobColor` always wins; `PLUMBOB_GREEN` (0x2ee56a) is now only the build-time seed + a defensive last-ditch fallback for a color-less target. Plumbob materials are per-rig already — recolored IN PLACE via the `h.plumbobColor` compare (which starts undefined on a fresh rig, so the set/identity color **re-applies after every rebuild/respawn/re-roll/fade-reacquire**, no rebuild); pets ride along. Test pages: `roadmap-geom-test.html` 25/25, `geoevents-test.html` 16/16, `plumbob-color-test.html` 19/19.

### Covers & doorbell (batch F)
- **`doorOpenFraction(st)`** (geometry.ts, pure) is THE openness resolver for doors/windows/covers — takes the RESOLVED state (effectiveState/itemState fold localState first): 'on'→1, off/unknown/null→0; cover 'open'→position/100 (else 1), 'closed'→position/100 (else 0), 'opening'/'closing'→position/100 (else 0.5). Swing doors now open PROPORTIONALLY to the fraction. `_keyDoors` folds bucketed `current_position` (5% steps, `openKey`); cover/doorbell ids stay LIVE-path (matching door open-sensors).
- **Garage doors**: `Door.kind?: 'swing'|'garage'` — 5 horizontal slats in a 2100 mm opening (`WallOpeningCut.head` carries the taller lintel); openFraction lifts the bottom edge and folds slats past the lintel flat onto a ceiling track. 2D: retracting dashed line + % pill. Sidebar Kind dropdown auto-bumps default w 800→2400 on switch.
- **Window blinds**: `Window.coverEntity?` (cover.*) — 3D roller shade descends from the header ((1−fraction)·glassH + weight bar, proud of the glass); 2D closedness tick. Fraction 1 = shade UP (HA position 100 = open).
- **Doorbell pulses**: `Door.doorbellEntity?` (event/binary_sensor/button/input_button — picker now accepts `string | string[]` domains). Planner `_detectDoorbells` (LIVE path) pushes `{doorId, at}` into `Planner.doorbellRings` on state-string change (silent first-seed; prune >8 s cap 8). 2D expanding rings + 🔔; 3D generic **transient-pulse primitive** `TransientPulse {x,y,ageS,kind}` → `updateDoorbellPulses`/`_pulseGroup` (rebuilds only while pulses exist; RingGeometry/MeshBasicMaterial is a documented flat-material exemption). Rings feed the bubble trigger tier (`BUBBLE_POOL_TRIGGER.doorbell` 🔔🚪👀). Test page `covers-test.html` (`COVERS PASS 22/22`).

### Stairs rise, autofit & ramp (short flights between levels)
The stairs family is FOUR kinds — `stairs`/`stairs_half`/`stair_landing`/**`ramp`**
(`STAIRS_KINDS` in geometry.ts; **`isStairsKind` is a TYPE GUARD and the canonical
membership test** — the literal kind-triples were purged from three-renderer/
canvas-interact/physical.mjs; `STEP_LIGHT_EDGE_KINDS` deliberately stays
treads-only, a ramp has no tread to mount a step light on). **Per-piece rise**:
`Furniture.ht?` (item-level, no repairFloor) — resolved by the pure
`stairsRiseMm(fu, defHt)` which honours it ONLY on the family (absent /
non-finite / <50 mm → kind default; deliberately NOT a blanket all-kinds
override so `mountable` host-top math keeps reading `def.ht`); sidebar "Rise
(mm)" input on family pieces (min 50, placeholder = default, blank/default
clears). **Tread count** is the ONE pure rule `stairsTreadCount(depthMm,
riseMm) = min(max(3, round(depth/280)), max(1, floor(rise/130)))`
(`STAIRS_TREAD_DEPTH_MM` 280 / `STAIRS_MIN_RISER_MM` 130) consumed in exactly
three places — the 3D builder, `_groundYAt`'s tread quantization (the
`_terrain` entry now carries the RESOLVED rise), and the 2D stairs glyph — so
a 200 mm rise builds 1 step, 350 mm builds 2, while default flights keep 13/6
treads byte-identically (the rise cap only bites below ~390 mm). **Autofit**:
`Planner.autofitStairs(fu)` (edit-only, one undo step; sidebar "⇅ Fit between
levels" button, refusal reason shown dim) probes the ground just beyond the
foot (local −Z) and head (+Z) edges at `±(h/2 + 150)` via the pure
`resolveItemGroundMm(floor, floors, groundLevelMm, x, y)` (geometry.ts — the
app-side MIRROR of the renderer's `_itemGroundY`, terrace-first/grade/indoor
semantics pinned by test; any change to one must land in both), then sets
`elevation = footGround`, `ht = diff`; `|diff| < 50` refuses ("ends are
level"); a NEGATIVE diff auto-rotates the piece 180° and fits from the true
lower end; values landing exactly on defaults are stored as `undefined`.
**Ramp**: a toon right-triangle `ExtrudeGeometry` wedge (sloped top y=0 at the
−Z foot → HT at the +Z head) — a BARE wedge, no side curbs; `_groundYAt` has a
LINEAR `t.kind === 'ramp'` branch (`elevation + ht·frac`, no quantization —
rigs walk a smooth slope); 2D = rectangle + 3 chevrons toward the high end
(flipped + `DN` when sunk); rides the whole family contract (nav exemption,
blob-shadow skip, house-mounted set, rise input, autofit) via `isStairsKind`.
**No side walls on the family (2026-07-28 user request "remove the sides")**:
the ramp's curbs AND the sunken-flight dark shaft side walls (stairs/ramp/
landing, with their `faceOpen` adjacency probe) were REMOVED — outdoor flights
fitted between yard levels grew ugly flanking walls; the stairwell hole + dark
void plane still mark indoor wells, and `_buildFurniture`'s `neighbors` param
stays for interface stability. Test `stairs-fit-test.html` (`STAIRSFIT PASS
62/62` — D3 now pins the curb-less wedge).

### Descending stairs (below floor level)
Stairs-family pieces with `elevation < 0` cut their own stairwell hole and
build treads below the slab (dark void plane beneath); `_groundYAt` returns
NEGATIVE tread heights and rigs ease `h.groundY` onto them. `_buildNav` adds
**rails** around sunken flights: a one-cell blocked band on the two long
sides + deep end, top edge open (abutting sunken stairs-family footprints
keep shared edges open for chained flight→landing→flight), so nav can only
enter/leave a descending flight at the top — no sideways pop-through-the-slab.
`_nav.sunkenFlights` precomputes each flight's deepest walkable tread; the
AI/demo controller occasionally (~1/6 goal rolls) walks a rig down to it,
dwells ~1.5 s, fast-fades + disposes ("went downstairs" — normal spawn
re-seeds), and ~1/4 of fresh wander spawns EMERGE at the deepest tread and
walk up/out. Radar/BLE targets are never despawned/redirected by stairs (raw
truth wins; they just track tread heights). Ascending stairs unchanged.
Test page `stairs-descend-test.html`.

**Floor voids** (`Floor.voidAreas`, repairFloor/defaultFloor backfill; v2):
user-drawn 3–12-vertex "no floor here" polygons (presence-zone latch idiom:
`drawingVoidArea`, `void` tool, `voidVert` drag, low-priority hit; sidebar
`_section('voids', …)`). 2D dark hatched fill riding the **ground** layer;
3D the polygon is cut from the floor patches as a HOLE (same earcut path as
stairwell wells; shared dark void plane activates). **Nav: void cells are
BLOCKED** — except cells on any stairs-family footprint (a flight bridges
the void), so avatars route around missing floor and take the stairs when
that's the only connection. Radar/BLE raw positions never remapped. Ghost
floors ignore voids. Test page `void-test.html`.

**Stair links & cross-floor transits** (`Furniture.stairLinkId`, item-level —
the same opaque id on exactly two stairs-family pieces on two floors; role
derives from `Store.floors` order (higher index = higher story), no offset
needed): sidebar "Linked stairs" picker (writes/clears BOTH sides; broken
links inert + clearable). `Planner.floorTransits` (runtime-only, keyed by
person id): `_watchFloorTransits` on `_solveBle` completion commits a
transit when an identified BLE person's solved floor changes with
fusion-style hysteresis (≥2 consecutive solves + ≥4 s; prune 30 s;
`viaLinkId` when both floors carry the linked pair; disabled floors skip).
Renderer handoff via OPTIONAL `TargetWorld.spawnAt`/`leaveVia` (stale-chunk
safe): arriving rigs fade in AT the linked stair and walk to the live solve;
leaving rigs walk to the stair and fast-fade there (cap 6 s; `_leftAt`
guard stops respawn while three-view still emits). 2D: linked stairs draw a
▲/▼ chip (`stairChipArrow`, geometry.ts); People rows show "on <floor>"
when a person's solved floor ≠ current. **Glass-house transit puppet**
(best-effort theater): one scripted rig in the always-on `_transitGroup`
walks the source flight while y interpolates across the two linked floors' elevation delta (~8 s), then
disposes — gated on glassHouse, cleared in clearTransientGroups/destroy.
Test page `stair-link-test.html`.

### Nav snap wall-LOS filter (bookcase pass-through fix)
`_nearestFreeCell`'s largest-region preference used to jump WALLS (a raw point in a wall-backed bookcase footprint snapped to the big outdoor region → rig locked outside). `_buildNav` now precomputes `_nav.wallSolids` (solid wall runs, openings excised via `wallCutsForSegment`, invisible walls excluded — consistent with the rasterizer) and `_nearestFreeCell` filters ring candidates to those with clear wall-LOS from the query point BEFORE the largest-region tie-break, falling back to unfiltered only when every candidate is walled off (never fails where the old code succeeded). `_regionOfWorld` (and through it the stuck-respawn + radar/AI goal-region resolution) inherits; `_nearestFreeCellInRegion`/`InLoop` were already constrained-safe. Door openings pass LOS, so walking out through a door still tracks. Regression: `test-pages/bookcase-los-test.html` (`BOOKCASE-LOS PASS 11/11`).

### Roadmap quick wins (batch E)
- **EnvKinds**: `radon` (☢ 100/300 Bq/m³), `sound` (🔊 `sound_pressure` 70/85 dB), `no2` (40/200 µg/m³), `o3` (100/180), `aqi` (100/150) — pure `ENV_KINDS`/`envKindOf` extensions; nothing enumerates EnvKind exhaustively.
- **Safety kinds `gas` + `leak`**: sidebar section retitled "Safety sensors" (slug `safety` unchanged). Gas = ceiling ring beacon (amber-green). Leak = FLOOR puck (y≈15, `safetyIsFloor`) whose alarm grows a blue puddle ~30 s (2D spreading ellipse + 💧; 3D flat decal on the shared `_puddleTexture` — never disposed per-fixture); rides the existing force-rebuild-while-alarming key.
- **Battery badges**: `Planner.scanBatteryRegistry()` on first full snapshot + every refreshStates → `_entityToDevice`/`_deviceSensors`/`_entityDeviceClass` caches (registry `original_device_class` added ADDITIVELY to `HaEntityReg` in both clients); `batteryFor(entityId)`/`batteryForDevice(deviceId)` resolve a sibling battery-class sensor (memoized in `_batteryResolve`, cleared per rescan; deprecated tracker `battery_level` attrs never read). 2D `drawBatteryBadge*` (self-gating: `battery` layer, ≤20 %) on mmWave/motion/env/BLE/alarm/safety/robots/locked doors; sidebar `🔋 N%` rows. `Layers2D.battery` absent = on.
- **Power glow**: `Furniture.powerEntity?` (visual-only, never feeds effectiveState/activities) — `powerGlowScale(W)` sqrt ramp (full ~1500 W) scales the 2D in-use glow + 3D LED `emissiveIntensity`; unbound appliance >10 W renders in-use. Power ids stay LIVE-path (chatty) — `_keyFloor` recomputes each tick from live states and folds the 50 W-bucketed reading.
- **Room occupancy glow**: `Room.occupancyEntity?` (binary_sensor; Frigate zone / FP2 / any occupancy) — 2D fills the room's wall-loop at low warm alpha under the `activity` layer; 3D builds the matching loop patch (`loopContaining(anchor)`) with warm emissive when on, hashed into `_keyFloor`; ids are config-path. Sidebar Rooms rows gain the bind + a ● occupied dot.
- **Bubble tail centering**: the bubble sprite's TAIL TIP anchors at head center via `spr.center` (position.x = 0; cloud body floats up-right); lying-pose repin + dispose lifecycle untouched; name label unaffected.

### Robot vacuum & lawn mower fixtures
`RobotFixture` (`Floor.robots`, repairFloor + defaultFloor backfill `[]`; tool `robot` 🤖, sidebar `_section('robots', …)`): the placed x/y is the DOCK. Kind `vacuum` binds `vacuum.*` (VacuumActivity), `mower` binds `lawn_mower.*` (LawnMowerActivity) + optional GPS: `trackerEntity` (device_tracker with latitude/longitude attrs + optional `direction` heading — Mammotion `<name>_gps` shape; its gps_accuracy is hard-coded 0, never draw accuracy rings) OR `latEntity`+`lonEntity` sensor pair (tracker wins). All bound ids config-path in `_isSlowEntity`. **Movement controller lives in the PLANNER** (`Planner.stepRobots(dt)`, advanced from the 2D RAF right after `stepLerp`; `Planner.robotStates` is the single source of truth read by BOTH `drawRobots` (2D) and three-view→`updateRobotRigs` (3D) — a robot moves even if 3D was never opened). Steering is **straight-line LOS with wall avoidance, NOT A***: goals validated/re-picked against the pure `segCrossesSolidWall` (geometry.ts — wall runs minus door/window openings via `wallCutsForSegment`; invisible walls passable). Vacuum roams indoor goals ~0.30 m/s with a serpentine wiggle; mower in **GPS mode** (bound + `geoFit()` quality ≠ none) eases to `latLonToPlan`-projected, boundary-clamped fixes, else **simulated** boustrophedon over cells outside all wall loops (`mowerSweepWaypoints`, ellipse-ring fallback when loops fill the rect). Unbound = autonomous demo (run 90–180 s → return → dock 60–120 s, hash-desynced; runs in kiosk/view). Click (2D + 3D `userData.kind='robot'`): bound → `vacuum.return_to_base`/`lawn_mower.dock` when active else `vacuum.start`/`lawn_mower.start_mowing`; unbound → flip run↔return. LED/state palette via `robotLedColor` (cleaning/mowing green + spin/bob, returning blue, docked amber breathing, paused amber, idle dim, error red blink). 3D: docks build under `_keyRobots`; rigs are persistent per-frame objects (`_robotRigs`, `_robotRigGroup`) mutated in place like humanoids; both ride the **sensors** layer. Test page `robot-test.html` (`ROBOT PASS 24/24`).

### Smoke / CO detector fixtures
`SafetySensor` (`Floor.safetySensors`, repairFloor + defaultFloor backfill `[]`) — ceiling-mounted detector, kind `smoke` (red) / `co` (amber), bound to a binary_sensor ('on' = ALARM). Standard canvas-fixture recipe: tool `safety` (⚠️ Smoke/CO; free placement, NO wall snap), `drawSafetySensors` (2D disc; alarming → expanding pulse rings + halo, `performance.now()`-based), `hitSafetySensor`, drag kind `safety`, sidebar `_section('safety', 'Smoke / CO', …)` (kind dropdown, bind, Test button — disabled when bound), 3D `_safetyGroup` (ceiling disc at 2743 + LED; alarming → emissive glow + 3 expanding flat rings) riding the **sensors** layer under `_keySafety` — which three-view **forces every frame while any detector alarms** (the fireplace idiom; ring animation needs per-frame rebuild). Unbound: clicking the detector (2D + 3D, `userData.kind='safety'`) or the sidebar Test button flips `localState` (manual trigger); bound detectors are display-only. Bound ids are config-path in `_isSlowEntity`.

### Appliance door animation (unbound liveliness)
Appliance doors are **pivot groups built CLOSED** in `_buildFurniture` and registered in `_applianceDoors` (fridge side-hinge ~76°, dishwasher + stove fold-down ~79°, microwave side 90°, washer porthole ~99°; dryer/tv skipped). `_advanceApplianceDoors` (end of `updateTargets`, per-frame) eases a fixture-id-keyed blend (τ≈0.25 s, survives `_keyFloor` rebuilds — re-applied at registration so no pop) toward OPEN when: (a) bound fridge `doorEntity` on (via `ctx.doorSensorOpen` — this replaced Batch A's build-time swung door), (b) unbound + `localState` on/playing (manual click trigger via `toggleItem`), or (c) unbound + a rig ANCHORED to that furniture id (`h.activityAnchor.furnitureId`) OR any RAW target within 1100 mm dwelling >1.2 s (anti-feedback rule: raw positions only). The `_keyFloor` appliance hash still contains the fridge door term (harmless — rebuild re-applies the blend).

### Glass-house floor/stairs transparency + stair cutaway
Under `glassHouse`: the active floor slab builds `transparent, opacity 0.45, depthWrite ON` (all three slab paths; blob-shadow decals still read), and stairs-family meshes build at 0.35. Stairs-family materials (outline shells skipped; one tag per unique material) are enrolled in the cutaway system with `userData.cutFloor = 0.12` — `_updateWallCutaway` now honors a per-mesh `cutFloor` (walls keep the 0.06 default), so foreground stairs fade but stay legible. `baseOpacity` respects the glass-house build opacity (no pop on toggle); glassHouse reaches `_keyFloor` via `configRev`.

### Cinematic slow-orbit camera
`Scene3D.cinematicOrbit?` (persisted; 🎬 overlay button next to 🎥 + a "Cinematic orbit" 3D Scene checkbox). `_updateCinematicOrbit` (in `_animate`, after `_updateAutoFollow`) advances camera azimuth ~0.08 rad/s (~78 s/rev) preserving horizontal radius + height ("current zoom"). Composes cleanly with auto-follow because auto-follow preserves the current azimuth each frame (target + distance from auto-follow, azimuth from the orbit); auto-follow off → orbit center eases toward the active-rig bbox (floor center if none). Shares the manual-orbit 6 s pause timer; the Sims-cam 45° azimuth snap glide is SKIPPED while orbiting (the `_simsCam` flag itself is left intact).

### Floor ordering & per-floor disable
`Store.floors` array order is the canonical floor order (index 0 = LOWEST story) — glass-house ghost stacking, stair-link roles, and BLE floor ranking read array order, and `Planner.moveFloor(id, ±1)` (splice-swap + save + emitConfig) reorders everything at once. **DISPLAY is reversed**: the sidebar Floors list + the kiosk/view topbar select render via the pure `floorsDisplayOrder(floors)` (geometry.ts, reversed shallow copy — highest story on top, elevator-panel intuition); the ▲ button = `moveFloor(id, +1)` (up the DISPLAYED list = higher story = higher index), ▼ = `−1`. **Move plan nudges**: a "Move plan" row under "Rotate plan" — ↑↓←→ buttons calling `translateFloorContent` (↑ = +Y, world +Y is screen-up) + `save()`/`emitConfig()` (one undo step each; no rect change/clamp), step select fixed METRIC (10/100/500 mm, 1 m — deliberately ignores `store.imperial`; structural units), persisted device-local in `localStorage['diorama:moveStep']`.

**Three-state visibility — show / peek / hide**: `Floor.peek2d?: boolean` (in repairFloor's list) + the existing `disabled`. Derived tri-state: `disabled` → hide (exactly the old disable — all gates unchanged); else `peek2d` → peek; else show. `Planner.cycleFloorVisibility(id)` cycles show→peek→hide→show (invariant: never both flags). Sidebar button icons: 👁 show / an authored inline SVG peeking-monkey glyph (`_peekGlyph` — no such emoji exists) / 🙈 hide. **Peek** = enabled (appears in pickers, BLE, etc.) AND its wall polylines draw as a 2D onion-skin underlay when viewing OTHER floors — `drawPeekFloors` (canvas-render; pure selection `peekFloors(floors, currentId)` in geometry.ts): thin dashed `rgba(148,163,184,0.35)` ghost strokes + a dim floor-name tag, drawn after ground/heatmap before active walls, same world coords (stacked stories register when dims match), ALL UI modes, structure outline only (no doors/furniture, v1), NO 3D changes (glass house covers 3D). Test `floors-view-test.html` (`FLOORSVIEW PASS 32/32`). `Floor.disabled?: boolean` (in `repairFloor`'s explicit list) hides a floor from the live experience while keeping it editable — the point is coexisting test iterations of a plan. Gates: the kiosk/view topbar select lists `Planner.enabledFloors()` (falls back to ALL floors if every floor is disabled — never an empty picker); `setUiMode` to a non-edit mode `switchFloor`s off a disabled current floor (full switch semantics — view reset included); the `floor=` URL param ignores disabled floors outside edit mode; `three-view` filters disabled floors out of the `updateGhostFloors` call (keeping the current floor for index sanity — the builder skips `currentId` anyway); and Planner's cross-floor BLE loops skip disabled floors (`scanBermuda` proxy-MAC claiming, `_solveBle` floor ranking — a test copy with duplicate proxies must not win the floor pick — and `_fuseIdentities` radar gathering). Toggling rides `configRev`, which `_keyGhost` already hashes. Sidebar Floors section = clickable row list (click switches; ▲/▼ reorder; 👁/🚫 disable toggle; disabled rows dim with a "(disabled)" hint).

### Item locking
Every placeable (walls, mmWave sensors, motion, env, furniture, lights, switches, doors, windows) has `locked?: boolean`. Guards live in canvas-interact's mousemove drag cases (`item && !item.locked`) and the delete-tool branches — locked items can't be moved/rotated/resized/deleted **on the canvas**, but sidebar editing (incl. the 🔒 toggle via `_lockRow`) still works, and click-to-toggle on locked fixtures stays live. Walls have a bulk lock/unlock button in the tools area (no per-wall editor exists).

### Undo/redo & delete key
**Undo/redo** (`Planner`, runtime-only, NEVER persisted). Snapshot history of serialized `Store` JSON: `_undoStack` / `_redoStack` + `_lastSnapshotJson` baseline. The single hook is **`save()`** — the choke point every store mutation funnels through (edit-mode only; `save()` no-ops outside edit). `_pushUndoSnapshot()` there pushes the PREVIOUS serialization onto `_undoStack` when it differs from `_lastSnapshotJson`, clears `_redoStack`, and re-baselines. Because drags `save()` only on **release** (verified — `onCanvasMouseMove` never calls `save()`), a whole drag is ONE undo step; identical/no-op saves coalesce (serialize equality). Caps: `UNDO_CAP` = 50 entries AND `UNDO_BYTES_CAP` = 8 MB per stack, oldest dropped (`_trimUndoStacks`). `undo()`/`redo()` (edit-only, `canUndo`/`canRedo` getters) swap the displaced state onto the opposite stack and apply the snapshot through **`_applyHistorySnapshot`** → `_normalizeStore` (the SAME explicit field-list + `repairFloor` normalization loads use — extracted so the field list lives in ONE place, shared with `_applyLoadedStore`) but PRESERVING the current view (keeps the current floor id when it still exists, else floors[0]; keeps tool/pan/zoom; only clears transient drag/edit state + selections via `_clearTransientSelection`). Stacks CLEAR via `_resetUndoHistory()` called at the end of `_applyLoadedStore` — the single funnel for **initial load + switchConfig + newConfig + saveConfigAs + importConfig + importSh3dConfig + deleteConfig** (all route through `_applyLoadedStore`). Caveat: a firmware-driven `zoneCache` write (`_onStates` → `save()`) can record a snapshot, but only on an actual zone-polygon change (rare), not per frame. UI: topbar ↶/↷ buttons (edit-only, disabled on empty stacks); keyboard **Ctrl/Cmd+Z** = undo, **Ctrl/Cmd+Shift+Z** / **Ctrl/Cmd+Y** = redo (in `canvas-2d._onKey`, after the edit-mode guard, ignored when focus is in a form control — see below).

**Delete key** deletes the CURRENT selection. `Planner.deleteSelection(): boolean` (edit-only) removes the highest-priority current selection — the same removal the delete TOOL performs, but keyed off the active-selection ids, not a cursor hit. Priority: **selected vertex → furniture → mmWave sensor → fixtures (motion/env/ble/alarm/calendar/thermostat/safety/alert/robot/camera/projector/valve/plug/info/action) → presence zone → ground area → void area** (declarative table; robot delete also drops its `robotStates`). Stale active ids (item no longer on the floor) are cleared and skipped; a **locked** top selection refuses (returns false, no crash, no fall-through). A removal `save()`s (→ one undo snapshot) + `emitConfig()`s. **Vertex selection**: `Planner.selectedVertex` (`{kind:'pzone'|'ground'|'void'|'wall', itemId, index}`) is set on a vertex mousedown in canvas-interact (the `pzoneVert`/`groundVert`/`voidVert`/`wallv` drag branches), cleared on any fresh select-tool mousedown, `setTool`, and store load. Delete on a selected vertex removes THAT vertex: polygons refuse when it would drop below 3 points (return false; vertex kept); a wall vertex follows the delete-tool rule (2-point wall → whole wall removed, longer polyline → vertex dropped). Keyboard hotkeys (Delete/Backspace, tool picks, undo/redo) share the `isEditableTarget()` guard (`src/dom-utils.ts`, pure/dependency-free so tests bundle just it) so nothing fires while typing in an INPUT/TEXTAREA/SELECT/contentEditable. Test page `test-pages/undo-test.html` (`UNDO PASS 44/44`; bundles the real `Planner` + `dom-utils` via esbuild + fake HaApi, same harness as config-test).

**Hot-selection gate + placement autofocus** (the "typing a name deletes the sensor" fix): the Delete/Backspace HOTKEY additionally requires `Planner.selectionHot` — a runtime boolean set by `markSelectionHot()` from every interactive selection path (the 23 deletable `setActive*` setters + all canvas-interact selection/vertex sites), reset cold in `_applyLoadedStore` + `setUiMode` — so a PERSISTED selection (`activeSensorId` survives reloads) can never be deleted by a stray keypress in a fresh session (the delete TOOL + sidebar buttons bypass the gate; `deleteSelection` itself unchanged). Root cause of the report was typing into a never-focused field: keys fell through to body → hotkeys. Primary fix: every named-fixture PLACEMENT (18 canvas-interact creation sites) calls `markNewlyPlaced(kind, id)` (runtime `Planner.newlyPlacedFocus`, also heats the selection); `Sidebar.updated()`'s `_maybeFocusNewlyPlaced()` focuses + selects the editor's Label input (tagged `data-label-for=${id}`; ~3-frame retry; SKIPPED under 900 px where the overlay sidebar closes after placement) — typing after placing lands in the name field. Re-selection of an existing item never steals focus. **Focusin cooling (the "renaming a yard area deletes it" fix)**: canvas-2d's window `focusin` listener (`_onFocusIn`) sets `selectionHot = false` whenever ANY editable target gains focus — the in-input keystroke was already guarded by `isEditableTarget`, but the selection stayed hot through a typing session, so a stray blur (tap-away, Tab, tablet keyboard dismissing) + Backspace hit the body and fired `deleteSelection` on the still-selected item. A typing session now DISARMS the delete hotkey until a canvas / sidebar-row re-selection re-heats (the placement autofocus therefore also cools — protective; delete TOOL + sidebar Delete buttons unaffected). NB `setActiveGroundArea` TOGGLES (second call with the same id deselects) and `deleteSelection` is a PRIORITY list where the always-set `activeSensorId` outranks ground areas — both bit the regression test. Tests: `sensor-focus-test.html` (`SENSORFOCUS PASS 14/14` — bundles the REAL sidebar AND canvas-2d (`import './canvas-2d.js'` in the entry): copy `tsconfig.json` into the temp src dir (else esbuild leaves raw decorators → parse error) + `--alias:lit=...node_modules/lit/index.js` + `--alias:lit/decorators.js=...`; fake HaApi needs `states:{}` and the `onState`/`onConn` method names; run with `--window-size=1200,900`); ruler-dims-test grew to 63/63 (hot-flag transitions).

### Wall kinds & clipped floor
`Wall.kind` (`WallKind`): `full` (2743 mm / 9 ft, default), `half` (1372), `railing` (914 / 3 ft — posts + top/bottom rails + balusters in 3D, thin line + ticks in 2D), `invisible` (renders as a faint dashed 2D line, nothing in 3D). New walls take `planner.pendingWallKind` (picker appears in the tools area when the Wall tool is active); double-clicking a wall body in Select mode cycles the kind. The 3D floor is **clipped to closed wall loops**: `closedWallLoops` (geometry.ts) traces self-closed polylines plus chains stitched by **nearest-node clustering within 25 mm** (`WELD`/`EPS`, raised from 1.5 mm so it heals the small 3–22 mm gaps already baked into saved plans — safe because the 2D grid snap is 100 mm and walls are 80+ mm thick, so no distinct parallel walls fall within 25 mm) — each loop becomes a `ShapeGeometry` floor patch (texture repeat 1/800 to match the plane path's mm scale). Invisible walls count toward loops — that's their purpose (close a floor region without drawing a wall). No closed loops → classic full-rectangle floor.

### Wall openings (doors / windows)
Doors and windows **snap onto the nearest wall** on drop and on move-release (`snapOpeningToWall`, ≤500 mm: position lands on the wall axis, rotation aligns to the segment keeping the nearer of the two directions so the hinge side survives). `wallCutsForSegment` (geometry.ts) computes the solid sub-intervals of each wall segment minus door/window spans, and carries each **window's `sill`/`height`** on its `WallOpeningCut` so the 3D builder can size the runs per-window — note a door's (x, y) is its **hinge**, so its span center is offset via `doorSpanCenter`. 2D strokes only the solid intervals (visible breaks; the 2D plan is unaffected by sill/height). 3D builds solid runs full-height (walls are 2743 mm ≈ 9 ft); a window keeps a **sub-sill (0→`sill`) + header (`sill`+`height`→top)** — both per-window, defaulting to 900 / 800 → 900 / 1700 (`WINDOW_DEFAULTS` in geometry.ts) — and a door keeps a lintel (2050→top) above the 2000 mm panel. Each sub-sill/header/lintel is extended **~3 mm INTO the abutting jamb runs** (`JAMB_OVL`) so its end-cap faces aren't coplanar with the jamb (coincident transparent faces hatch into thin vertical seams up the wall — the coincident-face gotcha; overlap buries the caps, never a gap). Open door/window panels swing/tilt/slide out of a real gap.

**Window kinds** (`Window.kind`: `single` (default, legacy one-pane) / `double_hung` / `casement_pair` / `sliding` / `picture`) drive the 3D pane composition in `_buildWindows` (all item-level, no `repairFloor`): single tilts outward when open; double_hung stacks two sashes at offset depths split by a horizontal meeting rail and slides the lower sash up behind the upper on open; casement_pair splits a vertical center mullion with two leaves hinged on their outer edges that swing open symmetrically; sliding places two side-by-side sashes at offset depths and slides the movable one behind its neighbor on open; picture is a fixed pane (open = tint only). Mullions/rails are **opaque frame bars, thicker than and overlapping the glass** so their shared planes hide (no coincident-face hatching against the transparent sashes). Sidebar Windows editor adds the kind dropdown + sill/height (mm) inputs. Window kind/sill/height changes ride `configRev` (already in `_keyDoors`).

### Window glass & curtains
Glass across all five window kinds is LIGHT GREY `#c9ced4`, opacity 0.16
closed → 0.08 open (interpolated by `doorOpenFraction`), and **0.42
near-opaque behind a CLOSED curtain** (the daylight-block cue — daylight is
the preset sun, there is no per-window light to occlude; ghost floors build
no windows). **Curtains** are per-window config, NOT a fixture:
`Window.curtain?: {style: 'horizontal'|'vertical'|'split', side?, entityId?,
color?}` + `Window.curtainPos?` (0..100 unbound slider). Styles: roman shade
rising with fold ridges / one drape drawing to `side` / center-split pair;
interior-face rod, panels proud of the glass (coincident-face safe). Openness
= bound entity through `doorOpenFraction` (cover/binary_sensor/switch) else
`curtainPos`; eased via `_curtainBlend` (survives rebuilds, reset on floor
switch). `curtain.entityId` is config-path; state hashed into `_keyDoors`
(coverEntity idiom). 2D: interior curtain tick (solid closed / dashed open).
Sidebar Windows editor "Curtain" sub-block. Test `curtain-test.html` (25/25).

### Wall endpoint welding
`connectWallEnds` (canvas-interact) welds a wall's endpoints within 250 mm onto other walls — endpoint-to-endpoint (corner joins, preferred) or onto the closest point anywhere along a segment (T-junctions), plus a wall's own far endpoint (closing room loops). LOCKED walls are still valid weld **targets** (`bestWeldTarget` no longer skips them — being snapped ONTO doesn't mutate them, so an invisible room-divider can weld onto a locked structural wall); the locked wall just can't be a weld **source** (the `wall.locked` guard in `connectWallEnds` / the drag flow keeps it put). Runs after vertex drags and draw-finish (per-endpoint weld) and after whole-wall moves (single-delta translate so the shape isn't distorted). Welding wins over the 15° angle snap at connection points.

### Imported 3D model (Sweet Home 3D)
`Floor.model3d` (`Model3D`) holds placement metadata only (name, rev, scale mm/unit, x/y offset, rotation, opacity, visible). The OBJ/MTL **text lives in IndexedDB** (`model-store.ts`, db `diorama-models`) keyed by floor id — multi-MB exports don't fit HA user_data or localStorage. `three-view._syncModel` loads text async when `rev` changes and calls `updateModel3D`. SH3D exports **cm with Y-up**; default scale 10 mm/unit. The renderer scales X and Z by `-scale` (double mirror, determinant positive) to line up with the 2D plan. Re-import per browser; placement syncs via HA. **Imported materials are toon-converted** — `updateModel3D` calls `_toonConvertModel(obj)` after parse, replacing each mesh material with a `_mat({...})` toon material carrying the source diffuse `color` (MTL `Kd`) + `opacity` (`d`), CACHED per source-material uuid (shared MTL entries stay shared) and disposing the replaced originals; a material with a texture `map` is left alone (this text-only MTL path never loads maps, but the guard keeps a future textured import legible). So SH3D shells shade with the same toon bands as everything else. `meta.opacity` is applied over the converted materials.

**Structural `.sh3d` importer (`src/sh3d.ts`)** — a SEPARATE path that reads the native `.sh3d` archive and builds REAL editable Diorama data (floors / walls / rooms / doors / windows / furniture) as a NEW config, distinct from the OBJ visual shell above. Zero deps (imports only pure `geometry.ts`). Flow: `analyzeSh3dFile(File)` → `readSh3dHomeXml` → `convertSh3dHome(doc)`. **ZIP reader** (`readZipEntries`) is hand-rolled — EOCD scan → central directory → per-entry local header → method 0 (stored) / method 8 (deflate via native `DecompressionStream('deflate-raw')`); sizes/method read from the CENTRAL dir (local header may zero them via a data descriptor); encryption (flag bit 0) and ZIP64 (`0xFFFF*`) error clearly; a missing `Home.xml` → "older save, re-save with SH3D 5.3+". **Conversion**: SH3D coords are **cm** (×10 → mm) with plan **y-DOWN**; a SINGLE shared transform `tx=xCm·10−globalMinX+500`, `ty=globalMaxY−yCm·10+500` (Y-flip + 500 mm margin) is applied to EVERY level from the GLOBAL bbox, so stacked levels REGISTER and all floors get identical `w`/`d` (bbox + 2·margin, min 2000, grid-rounded up). `<level>` (sorted by elevation, lowest-first → `Store.floors` order) buckets `<wall>`/`<room>`/`<doorOrWindow>`/`<pieceOfFurniture>` by their `level` attr (no levels → one "Floor 1"). Walls → 2-point `Wall` kind `full` (zero-length skipped). Rooms → `Room{name, anchor}` where anchor = area centroid, or (concave) the first interior vertex-pair-diagonal midpoint (`interiorPoint`). Openings → nearest wall within 500 mm via `snapOpeningToWallLocal` (MIRRORS canvas-interact's `snapOpeningToWall` — kept dep-free so the module + test stay UI-free); `name`/`catalogId` matches window/fenetre OR `elevation>0` → `Window` (sill from elevation, height from the `height` attr) else `Door` (SH3D x/y is the piece CENTER; snap the center to the wall then offset back by w/2 so `doorSpanCenter(hinge)` recovers the center). Furniture → best-effort ordered keyword table (`FURNITURE_KEYWORDS`, specific-before-generic + a few FR terms) → `FurnitureKind` at its real width/depth footprint; unmatched pieces are SKIPPED (never spam blocks); gated behind an "import furniture" checkbox default ON. **Validation**: after conversion `closedWallLoops` + a room-anchor-in-loop test appends an "not enclosed by walls (open plan)" warning per open room (imported anyway). Every anomaly → `warnings[]`; the function never throws. **Planner**: `importSh3dConfig(name, floors)` mirrors `newConfig` but seeds `defaultStore()` then replaces floors (each through `repairFloor`) + switches. **UI**: Settings ▸ Data "Import Sweet Home 3D (.sh3d)" button (furniture checkbox + a confirm summary "`N levels, W walls, R rooms, O doors/windows, F furniture`" + a dismissible warnings list) AND a sidebar "3D Model" section button (distinguished from the visual OBJ import by a hint). Test page `sh3d-test.html` (`SH3D PASS 48/48` — ZIP stored+deflate roundtrip, 2-level conversion counts + y-flip/translate/registration coords, door center→hinge round-trip, furniture mapping, open-room warning, old-format-no-Home.xml error).

### HA = source of truth (storage) — multi-configuration registry
The store persists via HA's `frontend.user_data` table as a **config registry** (`docs/DESIGN-roamers-config.md` § B): an index at key `diorama-configs` (`{version, activeId, configs:[{id,name,updatedAt}]}`) + one full-Store body per config at `diorama-cfg-<id>`. The legacy single `diorama` key migrates once (→ config 'Default') and is never written again. `localStorage['diorama:store:v1']` stays the ACTIVE body cache (instant paint) + `diorama:configs` mirrors the index; the index's `activeId` is the last-active config restored on next load. Saves debounce 600 ms; `switchConfig`/`saveConfigAs` FLUSH the pending save first (edits land on the old config) and rewrite the active-body cache (no stale bleed). Planner API: `listConfigs`/`switchConfig`/`saveConfigNow`/`saveConfigAs`/`newConfig` (fresh `defaultStore()` body, no bleed; flushes the old config's pending save first, then switches)/`renameConfig`/`deleteConfig` (refuses the last; tombstones the body `{}`)/`exportConfig`/`importConfig` — edit-mode-guarded; UI in Settings ▸ Data ("Configurations": dropdown, Save, Save as…, New… (prompt → brand-new blank config), Rename, Import ADDS a config + switches, Export, Delete w/ confirm, disabled at 1). **Export envelope** `{diorama:2, name, exportedAt, store, userAvatarPacks?}` serializes the WHOLE store (roamers, avatar pools, bound entity ids, people, avatarPacks config, weather/geo/layers/customObjects/views3d) + user-imported avatar-pack bodies from IndexedDB — a fresh-browser import is self-contained; legacy bare-store JSON still imports (wrapped). **`Store.notes`** (free text) is a per-configuration description carried in `_loadFromHa`'s explicit field list (absent → undefined; `Planner.setNotes` trims-or-clears), edited via the Settings ▸ Data "Notes" textarea, and rides export/import with the rest of the store. Test pages `config-test.html` (fake-HaApi Map stub), `offline-test.html`.

Connection settings (URL + token) use `diorama:url` / `diorama:token` in localStorage.

### Roaming AI avatars (`Floor.roamers`)
Persistent, sensor-free display presences (`Roamer {id, name?, avatarKind?, avatarKinds?, plumbobColor?, color?, enabled?}`, per-floor, repairFloor/defaultFloor backfill). Avatar selection = the motion-sensor model exactly (shared `_avatarGrid`; pool → stable hash pick + respawn re-roll, single → that one, none/invalid → adult). three-view appends `key:'roam_<id>'` targets (`ai:true, roam:true`) in ALL UI modes. The AI controller gives `roam` rigs NO home-loop confinement + an interior-activity goal bias (~50 % activity anchor/sit spot → ~35 % free cell inside a wall loop → ~15 % anywhere), so they mostly live indoors (sitting/TV/appliances) with occasional yard excursions; stairs descend/emerge applies. Never enters fusion/BLE paths. Sidebar `_section('roamers', …)` after People. Test page `roamer-test.html`.

### Avatar device interactions (synthetic rigs use UNBOUND devices, contemplate BOUND ones)
Only SYNTHETIC rigs act: `ai` (presence/demo avatars) and `roam` (roamers) — NEVER radar/BLE/cam rigs (real people mirror reality, not fiction). Gate: `Store.avatarInteractions` (absent = ON; Settings ▸ Display "Avatars use unbound devices"; in `_loadFromHa`'s explicit field list). three-view builds a per-floor `ActivityContext.interactive: InteractiveItem[]` (lights incl. fireplaces minus read-only logic lights, switches, appliance-category/TV furniture — same set `toggleItem` covers; namespaced ids `L`/`S`/`F`, world pos, `ctrl`, `fkind`, `bound`, `on`) + `avatarInteract` flag. **Actuation** (session-only): `Planner.avatarToggleItem(item)` flips `localState` IN MEMORY + `emitConfig()` but NEVER `save()` (avatar antics must not dirty the store, sync to HA, or push an undo snapshot — undo snapshots on real edits + save(), not emitConfig); HARD-refuses BOUND items (`entity_id`) and computed logic lights. **Interaction flow** (renderer): `_aiPickGoal` gains a ~1/8 goal branch targeting a random UNBOUND `interactive` item (home-loop confinement still applies to `ai`; roamers unrestricted; per-item **90 s** + per-rig **45 s** cooldowns; **time-of-day flavor** — a LIGHT is only eligible when toggling FIXES it for the hour: wants ON evening/night, OFF morning/day; switches/appliances/TVs either-way). On arrival the rig dwells ~1.3 s, faces the device, plays a **reach one-shot** (`Humanoid.reachT/reachDur/reachFacing`, arm-raise, independent of the idle-fidget gate), and fires ONCE via the `onAvatarInteract(id)` callback (three-view wires it to `avatarToggleItem` — mirrors the `onFixtureClick`→`toggleItem` flow; the renderer never imports the planner). The flipped `localState` then feeds `ctx.entityOn`/`recentTriggers` (via `effectiveState`), so the recent-trigger bubble tier + appliance-door animation + entityOn-gated activities react organically. **Status contemplation**: a new bubble sub-tier (BELOW recent-trigger + ctx tiers, ABOVE idle chatter) — a synthetic rig standing idle within ~1.8 m of a BOUND interactive device, during a chatter window (`chatterT > 0`), bubbles the device's CURRENT status glyph (`_deviceStatusGlyph`: light 💡/🌙, fireplace 🔥/🌙, TV 📺, dishwasher/microwave 🍽, washer/dryer 👕, stove/oven 🍳, fridge 🧊, generic ⚡/🔌); reads state, never actuates. The picker uses a seedable RNG (`setInteractRng`, tests only). Test page `avatar-interact-test.html` (`AVINTERACT PASS 19/19`).

### Lovelace card (`<diorama-card>` — third build entry)
`src/card.ts` → `dist/diorama-card.js` (Vite third entry; chunkVersionQuery covers it generically — its generateBundle busts every chunk's imports, entry-agnostic; ONE shared three-renderer chunk across all three entries). Registered on `window.customCards`; resource `/hacsfiles/diorama/diorama-card.js` (README "Lovelace card" section has the YAML + config table). **Shared planner**: `card-shared.ts`'s `getOrCreatePlanner(hass)` — ONE module-level Planner + HassPanelAdapter per tab, shared by every card instance, **forced `uiMode='kiosk'` permanently** (save() no-ops; dashboards can never write the store). **Mode is CARD-LOCAL**: `mode:'view'` suppresses interaction via a per-component `interactive` prop on `<diorama-canvas-2d>`/`<diorama-three-view>` (never flips the shared planner's uiMode); `mode:'edit'` is rejected by `validateCardConfig` (card-config.ts, pure). Cards mount by CARD-local view (different cards can show 2D and 3D simultaneously; FLOOR stays planner-global — documented shared-planner limitation). Config `{floor?, view?, mode?, layers?, view3d?, cam?, compact?, panelPath?, scene?}` applied via `applyCardConfig` (retry-on-config floor/layers; view3d/cam through `urlTemplate`). **`layers` accepts a preset-name string OR an explicit `{layerKey: boolean}` object** (object applies immediately, no retry — still planner-GLOBAL like the string path). **`scene?: CardSceneConfig`** (card-config.ts; `CARD_SCENE_BOOLS` = glassHouse/wallCutaway/autoFollow/cinematicOrbit/simsCam/plumbobs/skyBackdrop + fovV 10–120/fovH 10–150, throw-on-invalid) = CARD-LOCAL 3D overrides: three-view gained reactive `scene3dOverride: Partial<Scene3D> | null` merged over `store.scene3d` by the private `_sc3()` (override wins; ALL ~19 former `p.store.scene3d` reads route through it; no-override path returns the store object by IDENTITY so the panel is byte-identical; the 3D-bar toggles still mutate the store — an overridden key just pins the effective value) + `simsCamOverride: boolean | null` (NOT a Scene3D field — drives the runtime azimuth-snap; `true` enables snap always but applies the 'sims' pose ONLY when the card gave no cam/view3d; re-applied on live editor edits). 2D cards ignore `scene`. `compact` (or auto <~360 px) hides the 3D bar / reset button / floor chip / ⤢ expand link. Sizing: BOTH `getCardSize()` (masonry) + `getGridOptions()` (sections; HA floor 2024.6.0 already exceeds the sections introduction — hacs.json unchanged). **Reconnect**: three-view gained `_setup()` re-run on `connectedCallback` + canvas-2d restarts its RAF (cards detach/reattach on view switches; `firstUpdated` alone was one-shot). Editor: hand-rolled `<diorama-card-editor>` (ui/card-editor.ts, dynamically imported → own chunk; floor picker from the live store w/ text fallback; **Layers = preset dropdown** ((unchanged)/Full/Simple/store `layerPresets2d` by name/Custom…) where Custom… reveals a `LAYER_DEFS` checkbox grid emitting the explicit all-keys object (seeded from the LIVE store's layers so Custom starts from what's on screen); **Scene (3D) block** (rendered only when view:'3d') = tri-state (inherit)/On/Off selects for the 7 `CARD_SCENE_BOOLS` + fovV/fovH inputs — `_emit` sweeps undefined keys inside the nested `scene` and drops the block when empty, on top of the type-first spread). **`type` must survive the editor round-trip** (user-reported "No type provided" wedged the visual editor): `validateCardConfig` carries `c.type` through, `STUB_CONFIG` includes it, and the editor's `_emit` spreads `{type:'custom:diorama-card', ...}` FIRST so even a pre-fix stored config re-emits complete. Test `card-test.html` (`CARD PASS 92/92`; bundle needs the lit + three + tsconfig aliases — the sensor-focus recipe plus three aliases; editor elements must be `stage.appendChild`ed BEFORE awaiting `updateComplete` — Lit never starts updating a disconnected element, the page hangs).

### Recorded position pins (reverse landmarks — boundary walking)
`GeoConfig.recorded?: RecordedPin[]` + `recordedClosed?` + `calibTracker?` (geo whole-object through `_loadFromHa`). A `RecordedPin` stores **lat/lon as SOURCE OF TRUTH — never plan x/y**; pins re-project through `geoFit()` at READ time (`projectRecordedPins(pins, fit)` in geo.ts, zero-import; `ok:false` when quality 'none'), so recalibrating landmarks retroactively corrects every recorded pin. Planner: `recordPositionPin(trackerId?)` (edit-only; tracker resolves arg → persisted `geo.calibTracker` → first person's tracker; reads the raw fix; **records past the accuracy gate with a `warn` return — never refuses mid-walk**), `addManualRecordedPin` (parseLatLon; no accuracy = manual sentinel), update/delete/`moveRecordedPin` (order = the boundary), `setRecordedClosed`, `clearRecordedPins`, and `recordedChainToGroundArea(kind)` (fit≠none + ≥3 projected pins → appends an EXACT-coordinate `GroundArea` on the current floor, no grid rounding; chain retained). 2D `drawRecordedPins` (geo layer): amber diamonds + index numbers + dashed chain (+ closing segment) + per-segment `fmtLen` labels + `fmtAccuracyM`/manual captions; nothing drawn when the fit can't project (the sidebar explains). 3D skipped v1. Sidebar: "Recorded positions (boundary)" sub-block in GPS/Geo (record button w/ fix readout + reason-disabled state, manual add, list w/ ↑/↓ reorder, close-chain, total length, convert w/ kind dropdown, clear). Tests: geo-test → `GEO PASS 80/80`; `record-pin-test.html` (`RECORDPIN PASS 53/53`).

### Docs tiles deep-link into the live demo (`?model=` boot)
Floor-plan pages carry "▶ Open in live demo" → `../demo/index.html?demo=<slug>`; model-gallery cards for the DEMO-RENDERABLE types only (furniture/appliance/bin/light — others get no link) carry "▶ View in demo" → `?model=<kind>`. `shouldStartOffline` honors `?model=` too. `seedModelViewer(planner, kind)` (demo-seed.ts): upserts ONE reusable "Model viewer" config (6000×5000 scratch floor, one centered instance — furniture at default dims, or a light with `iconKind` + `localState:'on'`), replaces content on reuse (no config spam), boots 3D with the dimetric sims cam via `urlTemplate.cam` (the floorplans-capture 2D-first flip idiom); unknown kind → plain `?demo` first-home fallback. Emitters have light `--pages-only` modes (floorplans.mjs 13 pages / generate.mjs 18 pages) to regen tile HTML WITHOUT the heavy CDP captures. demo-boot-test → `DEMOBOOT PASS 50/50`.

### GitHub Pages live demo (editable offline playground)
The full app runs client-side on the docs site (`pwsh.github.io/diorama/demo/`) — the real production build in offline mode, no HA. **Auto-start**: `shouldStartOffline(storage?, search?)` now also returns true for `?offline=1` or ANY `?demo=` param (not just the localStorage flag), so a first-time visitor boots offline with zero clicks (panel mode never consults it). **Demo seeding** (`src/demo-seed.ts` — DOM-free, type-only Planner import, NOT in the 3D chunk): `_launchOffline` sets `Planner.demoMode` + `_bootDemo` (app.ts, standalone only) when `?demo` present — waits for `configIndex`, fetches `./floorplans/index.json` + the envelope files (relative → resolves under the gh-pages subpath; all try/caught), then `seedDemoConfigs(planner, manifest, envelopes, requestedSlug)` imports the 12 `docs/floorplans/*.json` envelopes as configs **idempotently** (skips names already present) and `switchConfig`s to `?demo=<slug>` (unknown → first). Re-seed is gated by `demoSeedHash(manifest)` in `localStorage['diorama:demo:seeded']` (new build with more homes adds the missing ones; a reload doesn't duplicate); `_applyUrlParams` (view/mode/floor/cam) still applies on top. **Reset demo** button (topbar, gated on `demoMode`) → `clearDemoStorage(localStorage)` (surgical: removes `diorama:local:*` + `diorama:configs` + `diorama:store:v1` + `diorama:demo:seeded`, leaves the offline flag / view pref / unrelated keys) + reload. **Docs build**: `scripts/docs-site/demo.mjs` (`npm run docs:demo`) copies `dist/` → `docs-site/demo/` + the envelopes + a `floorplans/index.json` manifest; shell.mjs nav gains a "Live demo" link, build.mjs a home CTA. Build order: `build → docs:site → docs:gallery → docs:floorplans → docs:demo → docs:publish` (demo before publish; publish's recursive `cpSync` sweeps `docs-site/demo/` with no filter). Test `demo-boot-test.html` (`DEMOBOOT PASS 28/28`).

### Offline / standalone mode (`src/ha-local.ts`)
`LocalApi implements HaApi` (`readonly offline = true`): user_data → `localStorage['diorama:local:<key>']` (the whole config registry works offline unchanged), states empty, subscriptions/services/registries inert, `connect()` emits a deferred connected + empty snapshot matching the WS boot shape. The auth screen offers "Use offline — no Home Assistant" (persists `diorama:offline=1`; startup checks `shouldStartOffline()` in the STANDALONE entry only — panel mode adopts a planner first and never sees the flag); topbar shows an **Offline** pill; Settings ▸ Connection swaps to "Exit offline mode". Binding-driven features are inert-but-safe (`effectiveState` null; `localState` interactivity + Open-Meteo weather still work). Never import LocalApi into the renderer chunk. Test page `offline-test.html`; README documents serving `dist/` statically.

### Sync on bind
`Planner.bindSensor(sensorId, deviceSlug)` runs discovery + `_syncZonesObjects` immediately and schedules retries at 500 ms / 2 s / 5 s. Each retry calls `disc.invalidate()` first so any entities ESPHome pushes after the initial `get_states` snapshot get picked up. The sidebar binding dropdown calls this — zones / objects load without a manual click.

### Local visual occupancy
Inclusion-zone glow and object-halo glow are computed locally in `canvas-render.ts` from the lerped target positions (point-in-polygon / radius test), **not** from HA's `target_count` / `*_halo_occupied`. Reason: HA's WS push order can race target X/Y updates with count updates, briefly highlighting a zone before the dot has moved. Local testing keeps the glow in sync with what the user sees. The HA-derived counts are still kept on `z.targetCount` for numeric labels.

### Entity picker
`<diorama-entity-picker>` pulls HA's `config/device_registry/list` + `config/entity_registry/list` on first open. Lets the user filter by domain (default to the appropriate one for the call site, e.g. `binary_sensor` for motion, `light` for light fixtures), filter by HA device, or search by entity / friendly / device name. Each row shows the parent device name as a subtitle.

### Toggle dispatch
`Planner.toggleEntity(entity_id)` reads the domain from the entity_id and calls the matching `<domain>.toggle` (with `homeassistant.toggle` as fallback). This means a "switch" fixture bound to `light.foo` calls `light.toggle`, not `switch.toggle`. `Planner.isLightEntity(entity_id)` is the boolean used by sidebar + dblclick handlers to decide whether to offer the LightConfig modal (color/brightness/temp).

#### Local control of unbound interactive objects
Interactive placeables — `Door`, `Window`, `Light`, `SwitchFixture`, and `Furniture` (TVs / appliances) — carry an **item-level** optional `localState?: string` so an object with **no** `entity_id` can still be controlled from the panel. Semantics match the entity state it stands in for: doors/windows `'on'`(open)/`'off'`, lights/switches/fireplaces `'on'`/`'off'`, media/appliance furniture `'on'`/`'off'`/`'playing'` (playing = on). It's item-level, so no `repairFloor` / `_loadFromHa` changes are needed (those pass item arrays through, never reconstruct them field-by-field).

- **One resolver**: `Planner.effectiveState(item)` → `HassState | null`. Bound → `hass.states[entity_id] ?? null` (exactly the pre-existing semantics). Unbound → a synthetic `{ state: localState, attributes: {} }` when `localState` is set, else `null`. **Every** render + interaction consumer routes through it: 2D `canvas-render` (lights on-glow + activity pools, switches, door open-swing, window open, fireplace flicker), 3D `three-renderer` (via the module-level `itemState(item, stateProvider)` mirror — the same `id => states[id]` closures already flow through it) for doors/windows/lights/switches, the three-view `entityOn` ActivityContext map (a locally-ON dishwasher/TV gates activities + `watch_tv` — furniture `hasEntity` in `updateFloor` is now `entity_id != null || localState != null`), and the fireplace force-every-frame check. Unbound brightness/color falls back to defaults (attributes `{}` → the existing missing-attr defaults; no NaN paths).
- **Toggle routing**: `Planner.toggleItem(item)` — bound → `toggleEntity`; unbound → flip `localState` (`'on'`↔`'off'`, `'playing'` counts as on) + `save()` + `emitConfig()`. Wired into every click path: 2D fixture/door/window click-vs-drag (edit) **and** the kiosk click branch, and the 3D raycast `onFixtureClick` (light/switch/media walker — unbound now resolves the item by `kind`+`fixtureId` and toggles locally; unbound TVs are tagged clickable in `_buildFurniture` regardless of binding). Dirty keys need no new inputs — `emitConfig` bumps `configRev`, which `_keyDoors`/`_keyLights` already hash. Fan/TV **dblclick** still opens the config/entity-picker modal; unbound single-click just toggles.
- **Binding transition**: binding an entity makes `localState` **inert** (the resolver prefers the bound entity) but leaves the field in place — so **unbinding returns to the last local state**.
- **Kiosk semantics (honest)**: local toggles in kiosk mode are **session-only**. `toggleItem` calls `save()`, but `Planner.save()` no-ops outside `edit` mode, so the flipped `localState` lives on the in-memory object for the session and is never written to HA or localStorage. **View** mode makes no changes at all (`toggleItem`/`toggleEntity` both refuse).
- **UI**: sidebar door/window/light/switch rows show a dim, clickable **`local: on/off`** badge (`_localBadge`) in place of the `—` when unbound + `localState` is set, so the user understands why it renders active without HA (and can flip it there too).

### 2D pan / zoom
`Planner.viewCenter` (mm in world frame) and `Planner.zoom` are runtime state, not persisted. `computeView(canvas, fw, fd, viewCenter, zoom)` derives the actual `View` (`ox`, `oy`, `scale`). Wheel zooms anchored at cursor. Middle/right-mouse OR Space+left pans. Two-finger touch pinches and pans. `Ctrl/Cmd+0` or the bottom-left "⟳ Reset view" button resets.

**Floor switches RETAIN pan/zoom** (both views). Stacked stories share ONE world-mm frame — the ghost-floor stacking + 2D peek underlay both depend on identical world coords landing at identical positions — so a floor switch does not change the coordinate frame; floors differ only in rect SIZE. `switchFloor` keeps `viewCenter`/`zoom`, resetting only when the retained centre fails the pure `viewCenterFitsFloor(w, d, cx, cy)` guard (planner.ts: the new floor's rect inflated by `VIEW_RETAIN_MARGIN_FRAC` = 0.5 × `max(w, d)` on every side — the margin keys off the LARGER dimension in BOTH axes) or the id is unknown; `viewCenter === null` (never panned) stays null and fit-to-canvas self-adapts. `resetView()`, `_applyLoadedStore`, and every config switch still reset — a different CONFIG genuinely is a different plan. **3D** compensates the floor-dim-derived scene frame: because `_w(wx, wy, h) = (fw/2 − wx, h, wy − fd/2)`, a floor with different `w`/`d` shifts all content in scene coords, so three-view's `_lastFloorId` block translates BOTH `cameraView().pos` and `.target` by the pure `floorSwitchCameraDelta(prevW, prevD, nextW, nextD, prevElevMm?, nextElevMm?)` = `{(nextW−prevW)/2, −(nextD−prevD)/2, dy: prevElev−nextElev}` via `setCameraView` (equal dims + elevs → exact no-op; the **dy term keeps the camera's height above the FIXED GROUND PLANE constant**, so the grade/neighborhood/ghost stack visually stay put across a floor switch; `_lastFloorW/D/_lastFloorElev` refresh every tick so a floor-edge resize or elevation edit can't stale them; non-finite elevs → dy 0). Auto-follow / cinematic orbit / sims-cam snap ease from the current pose, so they continue from the compensated one. NB the `floor=` URL param does NOT route through `switchFloor` (app.ts / card-shared.ts set `currentFloorId` directly and reset the view — boot-time, unpanned anyway). NB `zoom` is a multiplier over fit-to-canvas (`baseScale` derives from fw/fd), so a DIFFERENT-dims switch preserves the centre but the effective mm/px shifts with the fit — pre-existing semantics. Test `floors-view-test.html` (`FLOORSVIEW PASS 86/86`).

### Smart alignment guides (2D drag)
While DRAGGING a single placeable in edit mode (lights/switches as one "fixtures" pool, furniture, env, motion, mmWave, BLE proxy — NOT wall vertices/doors/windows/zones), the dragged item's center snaps to align with peer centers of the SAME category on X / Y independently. Tolerance is 8 screen px converted to mm via `view.scale` (`nearestAlign`, geometry.ts), applied AFTER the per-kind move so guideline snap wins over grid intent. Candidate peer centers are snapshotted once at drag START into `Planner.alignCandidates` (not rescanned per frame); active guides land in `Planner.alignGuides` (`{axis, mm}[]`, runtime-only, cleared on release / mode change). `drawAlignGuides` (canvas-render, end of `drawAll`) draws a dashed accent line through each aligned coordinate spanning the full canvas — edit mode only, only while `p.drag` is a move-kind. Release snaps (fireplace/switch wall lock) run afterward and win.

### 3D fixture click
`<diorama-three-view>` registers `click` and `dblclick` on the WebGL canvas. The renderer raycasts into `_lightGroup.children` **recursively** (light bodies are now `THREE.Group`s containing per-kind sub-meshes — pendant stem + sphere, lamp pole + shade + bulb, etc.). The hit-walker climbs parents to find the first ancestor with `userData.kind === 'light' | 'switch' | 'media'`. Click → `planner.toggleItem` (bound → `toggleEntity`; unbound → flip `localState` — see "Local control of unbound interactive objects"). Dblclick on a `light.*` entity → light config modal; dblclick on unbound → entity picker. Both light **body** and **floor disc** carry the same `userData`, so a click anywhere in the lit pool toggles the light.

### 3D fixture rendering with user-set props
- **Light**: `lightHeight(l)` (mm above floor, default 2500), `lightRadius(l)` (floor-pool size, default 900), `lightIntensity(l)` (0..2 multiplier on HA brightness, default 1), `lightIconKind(l)` (default `'bulb'`). All adjustable per-fixture in the sidebar editor.
  - **Logical-state lights** (`Light.logic?: { entityId; rules: ValueRule[]; offColor? }`, batch DC-B): the light's ON / color / flash DERIVES from ANY entity's raw state through the shared `evalRules` engine (`src/value-rules.ts` — no second rule syntax) instead of a `light.*` binding. Resolution is planner/geometry-side: the pure `resolveLightLogic(logic, raw)` / `logicLightState(logic, raw)` (geometry.ts, reuses `ruleMatches`) package a synthetic HA state envelope — matched rule → `state:'on'` with the rule color as `rgb_color` (+ `_flash` marker); no match + `offColor` → dim `on` (brightness 40, `_dim`); no match + no offColor → `off`. `Planner.effectiveState(light)` **and** the renderer's module-level `itemState(item, stateOf)` both route through it (logic WINS over `entity_id`/`localState` when set), so 2D + 3D and the `_keyLights` hash all resolve identically with no new render path. **Flash**: a matched-flash rule pulses the existing light visuals — 2D per-frame alpha (`attrs._flash`), 3D per-frame emissive (three-view force-rebuilds `updateLightsSwitches` while any logic light flashes, the fireplace idiom). Logic entity ids are config-path in `_isSlowEntity`. **A logic light is read-only** — `toggleItem` no-ops when `logic.entityId` is set (its state is computed), so clicks in 2D/3D/kiosk do nothing. Sidebar Lights editor gains a "Logic binding" sub-block (source pick + the shared `_ruleRows` editor extracted from the info-card editor + offColor + clear). Test: `test-pages/logical-light-test.html` (`LOGICLIGHT PASS 22/22`).
- **Light icon kinds** (`LightIconKind` in `types.ts`):
  - `bulb` — single ceiling sphere (default).
  - `spot` — cone tip-up at `lightHeight`, opens downward.
  - `pendant` — sphere on a stem hanging from the ceiling. Group origin sits at the bulb's hang height; stem reaches up to `lightHeight`.
  - `sconce` — half-sphere mounted at `lightHeight`. **Skips the floor disc** since it lights walls, not the floor below.
  - `strip` — long thin LED bar.
  - `fireplace` — open-front firebox (`W2`=1000 × `H2`=1000 × `D2`=450 mm) with a mantel + animated flames. Forces warm orange-red regardless of HA color, plus per-frame `Math.random()` flicker on emissive intensity, point-light intensity, and floor-pool opacity. Cheap because the renderer rebuilds every tick. The **mantel's back is aligned FLUSH with the firebox back plane (`+D2/2`), never proud of it** (its extra depth overhangs the FRONT toward the opening) so a wall-snapped fireplace doesn't poke the shelf through the wall. The 2D hearth footprint (`drawFireplace2D`, canvas-render.ts) is 1000 × 450 mm to match `W2`×`D2` and the flush-snap assumption. **Wall lock**: `snapFireplaceToWall` (geometry.ts) runs on DROP + MOVE-RELEASE — the 450 mm-deep firebox (`D2`, `FIREBOX_DEPTH_MM`) snaps flush to the nearest wall within 500 mm (`snapToWallEdge`), its BACK on the wall face and its opening (local −Z) into the room: center = wall axis + normal·(wallT/2 + D2/2) = axis + normal·**275** (wallT = 100), rotation = `atan2(−nx, −ny)` (light front-axis convention). Skips invisible walls; locked walls are valid targets. No wall in range → free placement.
  - `lamp` — floor lamp: pole + base disc + cone shade + bulb. `lightHeight` ≈ pole height.
  - `fan` / `fan_light` — ceiling fan (downrod + motor hub + 4-blade rotor; `fan_light` adds a center globe), bound via `Light.fanEntity` (falls back to the light's own `entity_id`). **Blade spin ∝ the fan entity's `percentage` attribute** (0–100 → 0–`MAX_FAN_RPS` = 2.5 rev/s; no `percentage` attr → the legacy fixed 1 rev/s; off → 0). `direction === 'reverse'` **negates the sign**. Speed is seeded at BUILD time as the SIGNED nominal `rps` on each `_fanRotors` entry (three-view's `keyLights` folds `fanSt.state` + `percentage` + `direction` so a change reseeds it); the per-frame `_advanceFanSpin(dt)` (called from `_animate`) EASES each fan's live velocity toward that nominal (`_fanSpin[fixtureId]`, τ = `FAN_SPIN_TAU` = 0.5 s) and INTEGRATES the angle — so a speed change ramps, a reverse glides through zero, and turning off spins DOWN smoothly instead of hard-stopping. `_fanSpin` is keyed by fixture id so it survives `keyLights` rebuilds (continuous phase); reset on floor switch. `percentage_step`/preset modes are NOT surfaced (out of scope). 2D shows only the static glyph (`❋`/`✺`). NB: the `_fanRotors` entry field is named `rps` (not `targetRps`) because the docs-gallery capture reads `rot.rps` for its own absolute-clock spin — keep that name.
- **Switch**: `switchHeight(s)` (default 1200), `switchRotation(s)` (deg, 0 = +Y world, default 0). Box mesh rotated to match. **Wall lock + ganging** (`snapSwitchToWall`, geometry.ts, on DROP + MOVE-RELEASE): the 40 mm-deep plate snaps flush to the nearest wall within 500 mm — center = axis + normal·(wallT/2 + 40/2) = axis + normal·**70**, rotation = `atan2(nx, ny)` (plate front = local +Z; 0 = +Y world, vertical wall → 90). Then it **gangs** with other switches already on the same segment (rotation ±5°, perpendicular offset ±50 mm, within 2.5 gang pitches along the wall): the new plate aligns onto that gang's offset + rotation at the nearest FREE along-wall slot on the drop side (`gangSlot`), walking outward past occupied slots. `gangPitch = max(sizeA, sizeB) + 75` (defaults 320+75 = 395).
- **Sensor**: pose from HA's `number.<slug>_sensor_height` + `number.<slug>_mount_angle`. Heading rotates the body around Y; tilt rotates a child group around local X; nub indicator on the front face. `store.coverage` (topbar "Cov" toggle, same flag as 2D) adds a flat floor wedge (unlit translucent fill + `LineLoop` rim) from `s.fov`/`s.range`/`s.heading` — the flag is part of `_keySensors`. Targets seen by this sensor are tinted by `Sensor.color` (default from `SENSOR_PALETTE[idx]`); see "Per-sensor target color" below.
- **Motion sensor**: `MotionSensor.color` (hex, default `#ba68c8`) and `MotionSensor.intensity` (0..2, default 1). Color drives both 2D fill/stroke and 3D body emissive + cone material color. Intensity scales 2D fill alpha + glow blur, and 3D emissive intensity + opacity.
- **Environmental sensor** (`EnvSensor`, "Env" tool): bound to any `sensor.*` entity; shows the live reading. `kind` (`EnvKind`: temperature/humidity/co2/co/pm/voc/pressure/illuminance/generic) is auto-derived from the entity's `device_class` via `envKindOf`, overridable per fixture. `ENV_KINDS` in `geometry.ts` maps kind → glyph/color plus `warn`/`danger` thresholds (CO₂ ≥1000/1500 ppm, CO ≥9/35 ppm, PM ≥12/35) that escalate the color amber/red via `envColor`. 2D: value chip (`drawEnvSensors`). 3D: emissive puck at `height` (default 1500 mm) + camera-facing canvas-text `THREE.Sprite` (`updateEnvSensors`, keyed by `_keyEnv`). `scale` (0.4–4, default 1, clamped via `envScale`) multiplies the 2D chip metrics and the 3D puck/sprite size; editable via the sidebar Size slider or by dragging the orange handle on the selected chip's right edge (2D). Chip hit-testing reads the px extents canvas-render exported into `envChipHalfPx` during the last frame's draw. Sprite `CanvasTexture`s are NOT disposed by `_clearGroup` — `_disposeSpriteMaps` (isSprite-guarded) runs before every env rebuild / transient clear / destroy; keep that pairing if you add sprites elsewhere. Bound env entity ids are slow-path entities in `Planner._isSlowEntity` so sidebar readings re-render on change.

### 3D furniture rendering
Each piece becomes a `THREE.Group` built by `_buildFurniture` (in `three-renderer.ts`). World mapping: `_w(wx, wy, h) = (fw/2 − wx, h, wy − fd/2)` mirrors X, so **local +Z = world +Y** — the "front" side where backrests, headboards, and pillows live. Per-kind composites:

| Kind | Composition |
|------|------------|
| `block` | Single box (legacy default) |
| `table` / `desk` | 60 mm top + 4 corner legs |
| `chair` | Seat + tall backrest on +Z + 4 legs |
| `rocking_chair` | Seat + tall backrest on +Z + 2 thin rockers along X (in place of legs) |
| `chaise` | Long seat + low back at the head end (-X side) + low base plate |
| `bench` | Thin seat + 4 legs |
| `sofa` | Cushion seat + back band on +Z + armrests on -X / +X |
| `bed` | Mattress + headboard on +Z + two pillows |
| `rug` | Flat 5 mm slab (opaque, depthWrite on, doesn't z-fight the floor) |
| `bookshelf` | Solid box + 2 horizontal shelf hints |
| `speaker_tower` | Slim cabinet + 3 stacked driver rings on the front (−Z); playing → emissive pulse |
| `speaker_bookshelf` | Compact cabinet + 2 drivers; `mountable` (lands on a surface host) |
| `subwoofer` | Squat cube + one big front driver; playing → slower/deeper pulse |
| `center_channel` | Wide short horizontal cabinet + 2 woofers + a tweeter; `mountable` |
| `theater_recliner` | Plinth + seat cushion + tall back band + 2 thick arms + cupholder; single SitSpot |
| `recliner_row3` | Three-seat shared-arm recliner row; registers 3 SitSpots (arm-excluded pitch) |
| `riser_platform` | Low (220 mm) dark carpeted deck + front step-edge lip; walkable (see below) |

Beyond the classics above there are casework kinds (coffee_table, tv_stand, dresser, nightstand, wardrobe, ottoman, stool, plant, counter, island, cabinet), **appliances** (fridge, stove, dishwasher, washer, dryer, microwave, tv — `cat: 'appliance'`, spec-sheet default sizes), **bathroom** kinds (toilet, sink, bathtub, shower — `cat: 'bathroom'`), **countertop/fitness** kinds (`coffee_maker`, `toaster` — `mountable`; `exercise_equipment`), and **home-theater** kinds — speakers/sub/center under the new `cat: 'theater'` optgroup (`isSpeakerKind`), recliners + riser under the default `furniture` cat (grouped with sofas). `furnitureCat(def)` groups the sidebar kind dropdowns into optgroups. A def with `seat` set is **sittable** (humanoid seating anchors — see below).

**Home-theater kinds**: speakers bound to a `media_player.*` show the shipped now-playing card (kind-agnostic `isMediaPlayerId` path) and, while `'playing'`/`'buffering'`, an emissive **driver pulse** — three-view folds their state into the `_keyFloor` appliance hash (alongside appliances/bins via `isSpeakerKind`) so the pulse rebuilds on a playback change; the pulse itself breathes per frame in `_advanceSpeakerPulses` (subwoofers slower + deeper), enrolling each playing speaker's driver material in `_speakerPulses` (cleared each `updateFloor`, so idle speakers never glow). `theater_recliner` leaves `activity` undefined so `watch_tv` resolves from the room's ON TV via the seated-context SitSpot path; `recliner_row3` is a fixed 3-across row mirroring the sofa multi-seat SitSpot distribution. The **`riser_platform` is walkable**: `isRiserKind` exempts its footprint from `_buildNav`'s block rasterization (like rugs/beds) and it's registered as flat **terrain** (`_groundYAt` returns `elevation + ht` like a landing) so avatars climb onto it; place recliners on top with their own `elevation` set to the riser height. It skips the blob shadow (a floor-like deck).

`FurnitureKindDef` (geometry.ts) carries the Sims metadata: `activity?` (`ActivityKind` this piece anchors — see "Activity system"), `surface?` (counter-height top other pieces can sit ON), `mountable?` (sits on a surface piece, not the floor), `frontArrow?` (show the 2D front chevron on select; default on, off on symmetric kinds). **Mountable auto-snap**: dropping/moving a mountable piece near a `surface` host lands it on the top (`elevation` = host top; `mountOnId` records the host). **Live-parenting**: moving a `surface` host carries every furniture with `mountOnId === host.id` — the `furnMove` mousemove case translates them by the host's exact per-frame delta (captured `furnHostPrev`, applied AFTER the align-snap so they stay glued), and on release `snapFurnitureToSurface` re-settles each mounted piece's elevation/mountOnId. LOCKED mounted pieces do NOT follow (mount-on-host is not a frame change like `translateFloorContent`); they keep their `mountOnId` and re-snap on their next drag. Similarly, moving a table/desk (`activity` `eat_at_table`/`work_at_desk`) carries the chairs (seat-bearing kinds) that were tucked to its OLD position — `seatBelongsToTable` (geometry.ts, host footprint inflated by `TABLE_CARRY_MARGIN_MM` = 450 mm) selects them, they translate by the table's move delta then re-`resolveSeatTableCollision`, so a dining set moves as a unit (locked chairs stay put). Both are release/per-frame moves only, never rotate (furniture has no canvas rotate handle). The 2D front **chevron** draws on the selected piece toward local **−Z** — the FUNCTIONAL front (cabinet doors, screens, seat openings, humanoid faces), which is the opposite edge from the backrest/headboard (+Z) decorations.

Defaults (footprint, height, seat height, back size, tint) live in `FURNITURE_KINDS` in `geometry.ts`. The drop flow uses `pendingFurnitureKind` (or `pendingCustomObjectId`) to pick the kind + its default `w` / `h`. The sidebar Furniture section lets the user re-label, change kind (auto-resizes if dimensions still match the previous kind's defaults), tune width/depth, and 🔗 **Bind** an appliance/TV entity.

### Custom objects (recipes)
User-authored objects live in `Store.customObjects: ObjectRecipe[]` (`ObjectRecipe extends FurnitureKindDef` + `id` + `primitives: RecipePrimitive[]`). Each primitive is a `box`/`cylinder`/`sphere`/`cone` with `size`/`pos`/`rot?`/`color?` in local mm (origin = piece center at floor level, **+Z = front**). A `Furniture` instance references one via `customKindId` (its `kind` stays as a `block` fallback). `resolveFurnitureDef(fu, customObjects)` returns the recipe def or `FURNITURE_KINDS[kind]`. 3D: a generic recipe builder in `_buildFurniture` walks `primitives`; 2D: a top-down primitive projection (each primitive's footprint — box → rotated rect, cylinder/cone/sphere → circle — at its local x/z, painted by vertical center so upper parts win; labeled rect only when the recipe has no primitives). **3D front-arrow indicator**: when a custom-recipe piece is the SELECTED furniture, `updateFloor` (5th–6th params: `stateProvider`, `selectedFurnitureId`) drops a flat accent chevron (`_frontArrowDecal(fu.h)`) on the floor just outside the piece's functional front (local −Z, matching the 2D chevron convention). It's a flat `MeshBasicMaterial` (documented `_mat` exemption, like the TransientPulse rings — an unlit ground decal), `outlineSkip`, added AFTER `_buildFurniture` ran its outlines so no inverted-hull shell wraps it, no blob shadow. Selection (`activeFurnitureId`) is runtime-only and does NOT bump `configRev`, so three-view folds the selected custom piece's id into `_keyFloor` explicitly (scoped to custom pieces so selecting an ordinary piece never churns the rebuild). `_frontArrowMat` is shared, disposed only in `destroy()`. The sidebar "Custom Objects" section is the **form editor** (label, w/h/ht, surface/mountable checkboxes, activity dropdown, seat, and a parts list with numeric fields) — a new object is auto-placed at the view center so the live scene is the preview. Recipes sync in the store like everything else. **Adding a `Store` field reminder**: `customObjects`, `people`, `bleShowUnknown`, `bermudaEnabled` (and per-floor `Floor.rooms` / `Floor.bleProxies`) must be in `Planner._loadFromHa`'s explicit field list / `repairFloor` + `defaultFloor` or they reset on load.

### Animated humanoid targets (3D)
Target positions come from `Planner.stepLerp` — a critically damped spring (ω = 9 rad/s) with velocity state on each `LerpSlot` (`vx`/`vy`), so on-screen motion stays velocity-continuous between HA's few-Hz coordinate pushes. (A plain exponential ease surged after every push and stalled before the next; the walk cycle inherited the lurch — don't regress to one.) The integrator **substeps so ω·h ≤ ~0.36** — a single semi-implicit Euler step at the 0.1 s dt clamp (10 fps device) makes the spring *diverge*, not just ring. `stepLerp` is driven by the 2D canvas RAF, which keeps running (hidden) while the 3D view is up.

Targets render as persistent stick-figure rigs (head + torso + 2 arms + 2 legs, two-segment limbs with elbow / knee pivots, face features, hands, shoes). The torso carries the full identity tint (per-sensor / person color); rigs whose legs would otherwise render in that same raw tint (`spec.legColor == null && spec.skin === color` — adult / child / professional / movie_star / cowboy / farmer / athlete / cyborg / …) instead get **pants**: both leg segments (not the shoes) in a derived trouser tone via `trouserTone(color)` — bright tints (luma ≥ 110) use the tint × 0.5; DARK tints (whose halved tone would still read as the avatar color) deterministically pick the farthest neutral from a small trouser palette (navy/charcoal/khaki/olive), no `Math.random` so pants stay stable across rebuilds — computed in `_buildHumanoid` from the passed-in `color` so it rides every recolor path (per-sensor tint, fused person, BLE person). Kinds with an explicit `spec.legColor` (duck) or a non-tint skin (robot / alien / hacker / ninja / wise_oracle / astronaut / mascots) keep their costume legs untouched. Per-target `Humanoid` state in `_humanoids` keyed by `target.key` carries:
- `vx`, `vz` — smoothed 3D velocity (low-pass, time constant ~0.25 s) from the rig's own position deltas. **Gait and facing are both derived from this on-screen displacement, not HA's speed entity** — that entity updates on its own cadence and made feet pump while standing / skate while moving.
- `phase` — walk-cycle radians. Cadence = `max(speed / 1.2, 0.7)` cycles/s while walking: low speeds shorten the stride at near-normal cadence instead of slowing the legs to glacial giant steps.
- `facing` — body yaw, **eased along the shortest arc** (τ ≈ 0.13 s) toward `atan2(-vx, -vz)` so body-local **−Z** (where face/eyes/toes/leading-leg position all live) aligns with the velocity vector without frame-to-frame whip. Held below ~5 cm/s.
- `amp` — eased swing amplitude, **stride-matched**: `amp = v / (4·L·cadence)` (L = 0.81 m hip height, clamped 0.05–0.55 rad) so foot arc travel equals ground travel at every speed — a fixed amplitude made feet skate ~6× at low speeds where the cadence floor dominates.
- `scale` — eased spawn/despawn scale. Despawn shrinks out over ~0.4 s instead of popping, so brief LD2450 target flicker barely dents the figure and re-acquire recovers the same rig.
- `torso` (breathing scale) and `idleOffset` (desyncs idle sway / breathing between rigs).
- `sit` / `dwell` / `sitSpot` / `sitSpotId` — **seating v2**: sittable furniture (`def.seat`) registers one or more `SitSpot`s during `updateFloor`; a target dwelling >1.2 s (raw speed <0.15 m/s) within a spot's radius eases (`sit` 0→1) into a seated pose — root drops so the (per-rig) hip pivot lands on the seat, hips +1.45 / knees −1.45 rad, arms to lap, facing turns to the seat's front. Raw speed >0.4 m/s or leaving the radius stands it back up. All dwell/speed triggers use the RAW target position so the visual blend can't feed back. Three v2 refinements:
  - **Claims (never sit on each other)**: each `SitSpot` has a stable `id` (`${furnitureId}:${i}`) and each rig stores `sitSpotId`. A per-frame `seatClaims` map (spot id → rig key) is rebuilt from every LIVE rig at the top of `updateTargets` (so a despawned/disposed rig can't leak a claim) and updated in-loop as rigs capture; the capture scan skips spots another rig claims. Released the instant `sit` hits 0 (also on despawn — the rig drops out of the rebuild). `sitSpot` is re-resolved from the live `_sitSpots` by `sitSpotId` each frame so it survives furniture rebuilds (cleared if the piece was deleted). AI/BLE avatars sit via the same dwell path, so claims cover them too.
  - **Multi-seat pieces**: sofas register `floor(W/600)` spots distributed across the arm-excluded usable width (`W − 2·armW`, `armW = W·0.08` → ~504 mm pitch); benches `floor(W/600)` across the full width; sectionals (`sofa_l_*`/`sofa_u`) spread spots along the main run (X, near the back) plus one per return arm (skipping the corner the return serves); everything else is one centered spot. A dwelling rig captures the NEAREST FREE spot; if all are claimed it keeps standing/wandering. Beds carry `floor(bedWidth/700)` lie-lanes (min 1) — occupants beyond capacity do NOT lie (stand, no stacking); the ≥2-occupant shared-covers effect still hides in-capacity rigs.
  - **Front-only entry + leg clearance**: each spot carries a scene-XZ front normal (`frontNx/frontNz`) and an `approachX/approachZ` staging point ~350 mm in front of the cushion edge. Capture is gated to the seat's front halfspace (dot the seat→NAV vector with the front normal) OR the approach zone — a rig behind the backrest is rejected and its nav walks it around; the exception is a RAW position already on the cushion (<500 mm from the spot, since nav may have been snapped off the blocked footprint). The seated x/z blend routes THROUGH the approach point (nav→approach over `sit` 0→0.5, approach→seat 0.5→1) so the root never crosses the backrest; bed lie enters the lane from the FOOT end the same way. Lounge seats forward-shift the hip toward the cushion front by `depth/2 − 140` (parametrized off the actual seat depth per anchor) so the knees clear the cushion box; eat/work seats keep centered (legs tuck under the table, host-outside clamp governs).
- Velocity divides by the UNCLAMPED frame gap (`dtFull`) — dividing by the 0.1 s animation clamp overestimated speed after tab-resume / on slow devices and broke facing + sit detection.
- Hip / knee / shoulder / elbow joint groups for limb animation.

Root rotation order is **YXZ**: yaw = facing, pitch = forward lean (∝ speed), roll = lateral sway once per stride. Limb math: positive `rotation.x` on a downward limb cylinder moves the foot to body-local **−Z** per Three's right-handed rotation matrix; this is the body-forward direction in this rig. Knees flex (`max(0, sin(phase)) · 0.9 · ampNorm`) only during forward swing; arms counter-swing at 0.8× hip amplitude with a baseline elbow flex plus extra during forward swing; shoulders carry a small static `rotation.z` splay (relaxed A-pose). Vertical bob `|sin(phase)| · 40 mm · ampNorm`.

Rigs are persistent across frames (no rebuild churn). Cleaned up when a target disappears (after the scale-out grace) or via `clearTransientGroups()` on floor switch.

**Quadruped rigs (pets)**: avatar kinds `cat` / `dog` build a **separate** rig via `_buildQuadruped` (horizontal torso, 4 two-segment legs, head with ears + snout, 2-segment tail; cat ≈ 58% of the dog, dog ≈ beagle ~520 mm shoulder height). Body-forward is local **−Z** like humanoids, so the shared facing/nav/carrot/spring, scale/despawn-fade, blob shadow, outline-shell, and plumbob (scaled ~0.7×) machinery is reused unchanged. A `quad` flag on the `Humanoid` (the 4 leg pivots alias the humanoid joint fields to satisfy the interface) switches the per-frame pose to `_applyQuadPose`: a **trot** (diagonal leg pairs antiphase, stride-matched amp off `h.vx/vz`) + tail sway + head bob + idle ear-flick; **sit** (haunches down, front legs straight) and **curl/lie** (all legs tucked) blends driven by the SAME `h.sit` / `h.lie` triggers as humanoids — soft lounge SitSpots (`SitSpot.soft`: sofa/chaise/ottoman/bed) route the sit blend into the curl pose so a pet curls up rather than sitting upright. Pets NEVER trigger privacy blur, standing activity anchors, or thought bubbles (all gated on `!h.quad`). `cat`/`dog` (and every `pet: true` pack member) are valid selectable avatar ids but kept OUT of the random-human fallback pool (see "Avatar packs"). A `DioramaPerson` with `isPet` and no explicit `avatarKind` renders as `cat` (three-view BLE-target default). Test page `test-pages/pet-test.html`.

### Mechanical & utility appliances (water heater / HVAC plant / pumps / 3D printer)
Ten `FurnitureKind`s, all `cat: 'appliance'` (they ride the appliances layer + the three-view
appliance-state hash with no predicate change): `water_heater`, `air_handler`, `floor_radiator`,
`wall_radiator` (default elevation 200), `boiler`, `ac_condenser`, `heat_pump`, `sump_pump`,
`recirc_pump`, `printer_3d` (`mountable`). Gate helper `isMechanicalApplianceKind` (+ `isPumpKind`);
per-kind picker domains from the pure `mechanicalBindDomains` (water_heater accepts HA's
`water_heater` domain; air handler/heat pump `climate|fan|switch`; condenser/radiators/boiler
`climate|switch|binary_sensor`; pumps `switch|binary_sensor`; printer `switch|binary_sensor|sensor`).
**State + glow** resolve through the pure `mechanicalRun(st, kind)` → `{running, glow:
'heat'|'cool'|'fan'|'none', progress}` off the RESOLVED envelope (`effectiveState`/`itemState`,
localState folded): airflow via the shared `hvacAirflow` (action beats mode, `action:'idle'` =
honest dark radiator), then single-purpose plant is pinned to its one color — a condenser bound to
a plain switch still glows cool, radiator/boiler/water_heater always heat; heat_pump/air_handler in
a non-airflow mode glow white. `MECH_GLOW_COLORS` reuses the HVAC vent palette. **The glow IS the
state language** — these kinds are excluded from the generic green in-use LED (3D) and green halo
(2D; they get a kind-colored pulsing halo instead, + pump flow dashes + a printer `N%` chip). All
ten click-tag `'media'` (single click → `toggleItem`; unbound flips `localState`; the 3D dblclick
binder has a mechanical branch using `mechanicalBindDomains`, never a media_player). 3D:
`_mechGlowMat` enrols a RUNNING glow in `_climateGlows` for the per-frame breathe (space-heater
ember idiom); condenser/heat-pump rotors register in `_floorFans` (the condenser's rotor sits in a
holder rotated −90°/X so the shared spin-about-local-Z code drives a horizontal fan); **pumps**
scroll a per-pump CLONE of the shared `_flowTexture()` (`_pumpFlowTextures`, the
`_waterPatchTextures` dispose discipline — rebuild + floor switch + destroy; only RUNNING pumps
enrol, so a stopped pump's water is frozen by construction); the **3D printer** oscillates its
gantry head and grows a print box — height from a bound numeric progress (entity state, or
`Furniture.printProgressEntity`, or a progress-shaped attribute via the defensive
`printerProgress`), else a deterministic ~60 s loop — head phase in `_printerPhase` (survives
`_keyFloor` rebuilds, never the absolute clock). The three-view `clim` hash term is gated
`isClimateApplianceKind || isMechanicalApplianceKind` (a same-mode `hvac_action` flip rebuilds) and
folds `printProgressEntity`'s state (live-path, the powerEntity idiom). Test `mechanical-test.html`
(`MECHANICAL PASS 100/100`).

### Climate & airflow appliances (AC / floor fans / heaters / exhaust)
Eleven `FurnitureKind`s + four `LightIconKind`s, all state-animated:
- **AC** (`cat:'appliance'`, bind `['climate','fan','switch']`): `window_ac`
  (elevation 900, cool-air particle wisp + LED), `mini_split` (elevation 2100,
  louver bar rotates open ~35° while running — eased blend survives rebuilds —
  + airflow particles colored by `hvacAirflow` heat/cool), `portable_ac`
  (caster tower + exhaust-hose hint + top-vent particles).
- **Floor fans**: `floor_fan` (caged stand), `retro_fan` (brass, `mountable`),
  `modern_fan` (bladed trio — all three spin via `_floorFans`/`_floorFanSpin`/
  `_advanceFloorFans`, signed rps from a bound `fan.*` percentage/direction or
  ~1.2 rev/s fixed; **`Furniture.oscillate?`** (sidebar checkbox on bladed
  kinds) sweeps the HEAD subgroup ±45° at 0.15 Hz while running); `tower_fan`
  (bladeless slot shimmer strip); `bladeless_fan` (ring + pulsing translucent
  air disc). Climate kinds are EXCLUDED from the generic `applianceOn` LED gate
  — a dedicated LED reads `climateApplianceRun` (a `climate.*` unit in
  cool/heat never has state 'on').
- **Heaters** (bind `['climate','switch']`): `space_heater` (breathing ember
  coil, ev-pulse idiom), `wall_heater` (elevation 200, glow + rising heat
  shimmer), `towel_warmer` (`cat:'bathroom'` — the appliance-hash predicate is
  widened for it; bar glow eases up ~4 s / down ~6 s, blend survives rebuilds).
- **Exhaust light kinds**: `heatlamp` (ceiling red domes, fireplace-style
  forced warm-red + pool + breathe; in the per-frame force-rebuild set),
  `exhaust` (ceiling grille, blades spin via `_fanRotors`/`fanEntity`-fallback,
  no floor disc), `exhaust_wall` (wall-snapped flush via `snapExhaustToWall`,
  offset 70, louver props open), `exhaust_light` (grille + center globe — light
  entity lights the globe, fanEntity spins blades; `fan_light` precedent).
  Glyphs: ♨ ❊ ⊛ ❈. three-view appliance hash gained a `clim` term
  (hvac_action/percentage/direction). Test `climate-appliance-test.html`
  (64/64).

### Sinks v2 (basins, running water, fill/drain)
Five sink kinds (`isSinkKind`, geometry.ts): `sink` (compact vanity),
`sink_vanity` (wide), `pedestal_sink`, `kitchen_sink` (double-bowl, stays
`cat:'appliance'`, `surface:true`, NOT mountable — it builds its own cabinet),
`utility_sink` (deep tub). All: open recessed bowl (floor well below rim,
coincident-face-safe), faucet + spout, and WATER — a stream mesh + a fill plane
that eases up (~8 s) while RUNNING and drains (~6 s) when off. Running =
`effectiveState` on (bound switch/binary_sensor OR unbound `localState` —
sinks are click-tagged `'media'` so clicking toggles; dblclick binds) OR a rig
engaged in `wash_hands` at the sink (appliance-door proximity idiom, raw
positions). Registered in `_sinks` (rebuilt per `updateFloor`); the per-fixture
fill blend `_sinkFill` survives `_keyFloor` rebuilds (plant-droop idiom);
`_advanceSinks` per frame, zero-alloc; kitchen_sink registers two water rigs.
Run-state folds into three-view's appliance hash via `isSinkKind`. 2D: blue
basin tint ∝ fill + flow ticks (entity/localState only — the wash-hands run is
3D-side). Test `sink-test.html` (48/48).

### Shared avatar props (chores, snacks, umbrella, fetch)
Research `docs/research/shared-props.md` (+ one pinned delta below).
`PROP_DEFS` (three-renderer): 13 props — vacuum_cleaner, broom, dish_towel,
window_squeegee, watering_can, snow_shovel, umbrella, plate_of_food,
ice_cream_cone, drink_cup, popcorn_bucket, book, fetch_toy. Eligibility
`propEligible`: tier `'hands'` (every non-sessile non-quad humanoid INCLUDING
`hover` rigs) / `'quad'` (fetch_toy only, mouth-carried at `qhead`) / none
(sessile, `AvatarDef.noProps`). Four trigger classes: (1) chore GOAL sessions
(~1/10 `_aiPickGoal` branch, cooldowns, session persists across wander repicks
with the held pose), (2) idle ambient snacks/book (new `idleSeated` gate;
mutually exclusive with fidgets), (3) **umbrella — ALL rigs incl. radar/BLE/cam
(pinned delta: passive weather garment like costumes; checked BEFORE the
synthetic gate)** when outdoors + rainy, (4) quad carry. Classes 1/2/4 are
synthetic-only (`ai`/`roam`). Prop-swap: authored HAND accessories (tracked via
`handAccessories` — ALL accessories are declarative since the 2026-07-20
migration, so the coverage is complete) hide during a session, restore after; per-session meshes build
via the extracted `_buildPrimitiveMesh` (shared with `_addDeclarativeAccessories`)
and dispose sparkle-style (hex materials owned; `'tint'`/shared never disposed).
Gate: `Store.avatarProps` (absent = ON, in `_loadFromHa`; Settings ▸ Display
"Avatars use props") → `ActivityContext.props`. Pose overrides compose via the
fidget-envelope idiom (`PropPoseDelta` incl. yaw); `_advanceAnimPrims`/
`_advanceTwoHandProps` take array params now (prop prims ride the same
machinery).

**Hand-frame conventions (2026-07-20 fix — load-bearing).** The rig has NO
WRIST: a hand group's world orientation is exactly `Rx(shoulder + elbow)`, so
a prim authored "hanging below the hand" (`[0,−h,0]`) actually points wherever
the FOREARM points. That silently inverted most props (watering can upside
down, umbrella canopy BELOW the raised hand, plate/bucket inverted, book facing
away, vacuum floating at chest height). Two mechanisms fix it:
- **`PropDef.handPitch?`** — the pose's nominal `shoulder + elbow`.
  `_startPropSession` counter-rotates every prim by `−handPitch`, so prop prims
  are authored in an UPRIGHT frame (+Y = world up, −Z = rig front) and the
  residual (pose pitch − handPitch) becomes the natural pour / sip / bite tilt.
  Animate-base transforms are re-captured AFTER that rotation. Two-handed props
  deliberately opt out.
- **Handle convention** (`_attachToHandle`, build-time only): the `twoHanded`
  prim IS the prop's handle and **must be authored FIRST**; every later prim on
  the SAME hand anchor is re-parented onto it transform-preservingly
  (`p' = qH⁻¹(p−pH)`, `q' = qH⁻¹q`) so attachments ride the per-frame re-aim
  rigidly. Before this the broom's brush / shovel's blade stayed pinned to the
  HAND while the shaft re-aimed — they detached by ~800 mm.
  `_advanceTwoHandProps` itself is unchanged (still zero-alloc).
Broom sweep is arm-driven (upper hand tucked at the chest, lower hand pushing
out front, brush ON the floor ahead-left, ~220 mm stroke); the torso only
contributes `yaw ±0.12`/`rollZ ±0.05` (the old ±0.3 yaw spun the whole avatar).
11 of 13 props were corrected in the same pass (window_squeegee + fetch_toy were
already right). Test `props-test.html` (`PROPS PASS 96/96` — section 15b drives
real `poseHold` curves and measures WORLD geometry: head constant in the handle
frame across poses, brush at floor level, canopy above the head, eating props
reaching mouth height, plate level, book facing the reader).

### Rooms
`Floor.rooms: Room[]` (`{id, name, anchor}`, persisted via `repairFloor`/`defaultFloor` backfill of `[]`). The anchor is a world-mm point; `resolveRoomForPoint(rooms, loops, x, y)` (geometry.ts) maps it to whichever **live closed wall loop** (`closedWallLoops`) contains it, so room identity survives wall edits. `resolveRoomForPointFuzzy(rooms, loops, x, y, probeMm = 250)` is the boundary-tolerant variant: it tries the exact point, then probes a ring of offsets (order: +y, -y, +x, -x, then the four diagonals) and returns the first room hit — needed because doors, windows, and flush wall-mounted fixtures (switches, fireplaces) sit exactly ON a wall line, which `pointInPolygon` excludes, so an exact resolve would drop them into "No room". The sidebar `_groupByRoom` bucketing uses the **fuzzy** resolver for all item kinds; a boundary item touching two rooms goes to whichever probe lands first (deterministic, acceptable). Created via the sidebar "Rooms" section: **+ Add room** then `placingRoomId` arms a click-to-anchor on the 2D canvas — the room is created **unnamed** (no prompt); `roomLabel(rm)` (geometry.ts) supplies an italic/dimmer "Unnamed room" placeholder until the sidebar input names it, and an anchor outside every loop draws an amber "not enclosed by walls" marker at the anchor in 2D. Labels render centered per loop in 2D and as a `THREE.Sprite` in 3D, both gated by the `labels` layer. Room names feed the activity + bubble systems — a name containing the substring **`kitchen`** (case-insensitive) gates the snack/coffee bubbles, and the seated-person's room scopes TV watching.

### Geo reference (GPS landmarks & lat/lon↔plan — Feature G, phase G1)
`Store.geo` (`GeoConfig`: `landmarks[]`, `northDeg?`, `boundaryM?` default 30, `accuracyGateM?` default 30) — **store-level (property-wide), NOT per-floor**; added to `Planner._loadFromHa`'s explicit field list (`geo: remote.geo ?? undefined`) or it resets on load. A `GeoLandmark` (`{id, name, x, y, lat?, lon?, accuracy?, sampleCount?, sampledAt?, hidden?}`) is a plan point (world mm) that gets a real-world lat/lon by calibration; absent lat/lon = placed but uncalibrated.

**Transform math** lives in `src/geo.ts` — **pure, deterministic, ZERO imports** (same shape as `trilateration.ts`; the test page transpiles it with `esbuild --format=esm` *no* `--bundle`). Conventions: `projectLatLon(lat,lon,lat0,lon0)` returns local **metres**, x = east, **y = NORTH-positive** (an ENU tangent plane; the caller absorbs the plan↔north rotation into the fit — projection never pre-rotates). Plan world frame is +X right / +Y up in **mm**. `fitGeoTransform(pairs, northDeg?)` → `GeoTransform {originLat, originLon, thetaRad, tx, ty, rmsMm, residualsMm[], fittedScale, quality}` mapping **geo→plan** (project → ×1000 mm → rotate θ → translate). **Scale is FIXED at 1** (plan mm are physical); `fittedScale` (Horn RMS ratio √(Σ‖q′‖²/Σ‖p′‖²)) is a **diagnostic only** — far from 1 ⇒ a bad landmark. ≥2 calibrated → 2D Procrustes closed form (`θ = atan2(Σ(pₓ·q_y − p_y·qₓ), Σ(pₓ·qₓ + p_y·q_y))`, `t = q̄ − R·p̄`); 1 → translation + rotation from `northDeg` (**compass bearing, ° CW from true north, of plan +Y**; default 0 → plan +Y faces true north); 0 → quality `'none'`. `latLonToPlan`/`planToLatLon` apply/invert it; `medianLatLon(samples)` takes independent lat + lon medians (robust to outliers) plus count + median gps_accuracy. Test page `test-pages/geo-test.html` → **`GEO PASS 38/38`**.

Every calibrated landmark row (manual AND sampled) shows a dimmed monospace `lat, lon` (6 dp) readout line beside its status caption; the manual "Set coordinates" card inputs prefill from stored values (display-only — no mutation until a user change event).

**Calibration flow** (`Planner.startGeoCalibration`/`finishGeoCalibration`/`cancelGeoCalibration`, sidebar "GPS / Geo" section, **edit-only** — the whole sidebar renders only in edit mode). Pick a `device_tracker`, Start records `startedAt` and fires the Android companion-app `command_high_accuracy_mode` `force_on` + `high_accuracy_set_update_interval` 5 s via `notify.mobile_app_<slug>` (slug auto-derived from the tracker id, user-overridable); it ALSO pumps a documented `request_location_update` notify (message-only, works on iOS + Android) immediately and every **25 s** on `geoCalib.reqTimer` (`setInterval`, stored on the session, cleared in BOTH finish + cancel via `_clearGeoCalibTimer`, and again at the top of any new `startGeoCalibration`). All sends are **fire-and-forget, try/catch, never block the UI**. Live accounting on the session (bumped on the LIVE path in `_onStates` via `_geoCalibSample`, classified by `_geoSampleClass`): `seen` (every fix with lat/lon), `used` (passes), `exclAccuracy` (`gps_accuracy > gate`), `exclSource` (`source_type` present and ≠ `gps`), `lastSeenAt` (ISO of last fix) — buckets are exclusive so `seen = used + exclAccuracy + exclSource`. The card shows a pulsing dot + elapsed `m:ss` + "last fix Ns ago" + the running counts, driven by a 1 s `setInterval` on the sidebar (`_calibLiveTimer`, reconciled in `updated()` while the active card is visible, cleared on disconnect/collapse/finish) so a zero-sample window never looks frozen. Closing the panel is still fine because Finish pulls the whole window from recorder history (`HaApi.getHistory` → WS `history/history_during_period`, `significant_changes_only:false`, normalized from compressed rows `s/a/lu/lc` with attributes forward-filled), filters `source_type==='gps'` (missing tolerated) AND `gps_accuracy ≤ accuracyGateM`, and requires **≥5 usable samples** (else keeps old values); the finish summary (success OR failure) states "N used / M excluded (accuracy: k, source: j)" so a failure is explainable. `getHistory` is implemented in **both** `HassClient` and `HassPanelAdapter` (`normalizeHistory` shared from `ha-client.ts`).

**Geo layer**: `Layers2D.geo` (default on) gates `drawGeoLandmarks` in canvas-render. Placement reuses the room latch pattern (`Planner.placingLandmarkId`, `NEW_LANDMARK` sentinel): "+ Add landmark" arms a 2D canvas click; landmarks are **2D-only in G1** (📍 pin + name + ±accuracy caption; calibrated solid, uncalibrated dashed/dim) — no 3D pins yet (G2; the fold-in point is commented at `three-view._keyFloor`). The section shows per-landmark status, a fit readout (quality, RMS m, fittedScale with a warning when |fittedScale−1|>0.15, worst-outlier name), a `northDeg` input (only when exactly 1 calibrated), and boundary + accuracy-gate inputs.

### Activity system (Sims contextual behavior)
The state machine lives in `three-renderer.ts` (`updateTargets`) fed by an `ActivityContext` (`{ entityOn, roomNames, timeBucket }`) that `three-view._tickOnce` builds cheaply every frame — `entityOn` from bound furniture entity states, `timeBucket` from `resolveTimeBucket` (time-of-day.ts). `updateTargets(targets, ctx?)` runs **every frame** (never dirty-keyed); a missing ctx (stale-chunk pairing) falls back to empty maps + `'day'`.

- **Anchors & spots**: `updateFloor` collects `_activityAnchors` (from furniture whose def has `activity`) alongside `_sitSpots` (from `def.seat`), each tagged with `roomId` (live-loop resolve) + `hasEntity`. `_tvsByRoom` groups bound TVs by room for watch_tv.
- **Ambient idle-activity anchors** (renderer-synthesized, NOT authored on furniture defs — the kinds `warm_hands` / `gaze_window` live in a renderer-local `ExtActivityKind`, not `types.ts`): `updateFloor` also pushes into `_activityAnchors` a **`warm_hands`** anchor ~700 mm in front of each fireplace-`iconKind` LIGHT's opening (opening dir = `(sin lr, −cos lr)` scene, `lr = lightRotation·rad`; `facing = atan2(offsetDir.x, offsetDir.z)`, `standOff` 0, `lightId` stamped) and, for the **6 largest windows per floor**, a **`gaze_window`** anchor 600 mm inside the room (interior side = the window normal whose inset point falls in a closed wall loop, floor-center fallback; faces the glass). Both ride the standard PHASE4 standing-dwell machinery (`>1.2 s`, RAW pos, single-occupancy), so AI/roamer goal rolls pick them for free (window share ∝ count, small). The `warm_hands` anchor is built regardless of on/off; it's ACTIVE only per-frame when `ctx.fireplaceOn[lightId]` (from three-view's fireplace-light effective state) — checked in the dwell scan + engagement release, NOT baked at build, so it deactivates the instant the fire goes out. Poses: warm_hands = both arms forward toward the fire (shoulder ≈1.1, elbows ≈0.5, slight forward lean); gaze_window = still, one hand drifting up to the pane (shoulder ≈0.7–1.05), other arm relaxed.
- **Solo (standing) activities** (`PHASE4_ACTIVITIES`: shower/bathe/toilet/wash_hands/load_dishwasher/make_coffee/forage_fridge/exercise/warm_hands/gaze_window): a target dwelling ~1.2 s near an anchor eases an `act` 0→1 pose blend and turns to face the appliance, standing off to the side. `ENTITY_GATED_ACTIVITIES` (load_dishwasher, make_coffee) engage only while the bound entity is on; `warm_hands` gates on the fireplace light being lit (see above).
- **Seated (contextual) activities**: resolved from the `SitSpot.hostActivity` once `sit > 0.5` — `eat_at_table` / `work_at_desk` from the seat's own def; `watch_tv` only when a **bound, ON** TV sits in the seat's room; otherwise plain sitting. Sitting and standing-activities are mutually exclusive (anchor only acquired while `sit ≈ 0`).
- **Seated table arms (IK)**: for eat/work seats the arms rest ON the tabletop via a sagittal law-of-cosines solve (`tableArmIK`, hand target `hostTopY + 40`). Two clamps keep the whole forearm above the slab, not just the hand: (1) the seat is lifted (`seatYeff`) so the seated **shoulder clears the tabletop by `SH_CLEAR` = 150 mm** — derived from the rig's own torso-sit height (`shoulderY − hipY`), generalizing the old fixed "bar/island barstool" cheat to every rig size; (2) an elbow-above-slab minimum shoulder angle (`shMin`) that **wins over the 1.4 rad sanity ceiling** (`Math.min(Math.max(1.4, shMin), sh)`). Both were needed — without the seat lift a short rig's (child) seated shoulder landed ≈16 mm above a normal table, forcing `shMin` past 1.4 and dropping the elbow through the slab (the forearm-ghosting bug). `tabletest.html` asserts elbow AND hand above `top − 10` across adult+child × eat/work/tall.
- **Privacy blur**: shower/bathe/toilet ease a `privacy` 0→1 blend; above ~0.5 a lazily-built `blurSprite` is swapped in over the rig (the body meshes are hidden from the main camera). It shows a **live render-to-texture MOSAIC**: a shared 24×32 `WebGLRenderTarget` (`_privRT` + `_privCam` + a tiny lit `_privScene`, all ONE-per-renderer, disposed only in `destroy()` via `_disposePrivMosaic`) into which ONLY the rig body is rendered in isolation (reparented into `_privScene` for the capture, body shown / sprite+plumbob+blob+name hidden, then reparented back + visibility restored — all synchronous, render state saved/restored), displayed on the sprite with `NearestFilter` so it reads as chunky live pixels. Throttled to ~4 Hz per rig (`h.privMosaicT`) and the target is SHARED across privacy rigs (last-captured wins; rare). Falls back to the static pixel-silhouette `_blurTexture` (standing/seated hand-coded masks) when render-target creation fails (`_privMosaicOK` latches false). The RT texture is shared — `_disposeHumanoid` must NOT free it (guarded alongside the blur silhouette maps).
- **Bed covers**: per-bed occupancy by footprint containment (raw positions) in `_beds`/`_bedDwell`/`_bedCovers`; at ≥2 settled occupants the rigs hide and a vertex-displaced blanket plane breathes (`_animateBedCover`).
- **Thought bubbles** (`_resolveBubbleKind` → per-frame `bubbleWant`, 2.5 s hysteresis before committing `bubbleKind` + rebuilding the sprite): suppressed during any engaged activity / privacy blur / under-covers; else the matching context tier picks from a **weighted POOL** (not one fixed glyph). Tiers, top priority first: **event** (Phase 2a — the NEW top tier: a real house-wide "moment" that hijacks the bubble for a bounded window; `BUBBLE_POOL_EVENT` keyed `dishwasher_done`🍽️✅✨ / `laundry_done`🧺✅👕 / `oven_done`🍞😋✅ / `appliance_done`✅🎉 / `rain_start`🌧️☔ / `severe_weather`⛈️⚡😰 / `severe_alert`🚨⚠️; fed by `ctx.eventTriggers`. Fixture-anchored appliance events keep a generous 6000 mm radius; house-wide weather events (`x/y == null`) skip the distance gate so EVERY rig on the floor reacts. Per-rig **adoption stagger** 0–`EVENT_STAGGER_S`=4 s keyed off `h.idleOffset` (deterministic, no `Math.random`) so figures don't all snap to the same glyph on the same frame; events **expire after `EVENT_TTL_S`=40 s** ("urgent, then gone"). The 2.5 s commit hysteresis still applies unchanged. Source: `Planner.householdEvents` — `_detectApplianceEvents` (a bound `Furniture.jobStateEntity` — Home Connect operation_state / a `running` binary_sensor / a `*_program_finished` event sensor — else a job-capable kind's own `entity_id` auto-watched — leaving a RUNNING state for a terminal after a ≥5 min run; `jobDoneValue` gates the terminal, default `'finished'`; PAUSE keeps the run alive) + `_detectWeatherEvents` (`weatherNow.condition` dry→precip = `rain_start`; `conditionIntensity` crossing 0.6 = `severe_weather`; `weatherAlerts` empty→non-empty / worst-severity up = `severe_alert`), both LIVE-path like `_detectDoorbells`, pruned >45 s cap 8, runtime-only. A finished appliance also shows a **BLUE "done" badge** (2D front-right LED / 3D emissive dot — distinct from the green in-use LED) via `Planner.applianceJustFinished(fu)`, folded into three-view's appliance-state hash → `_keyFloor` (no new dirty key)), then **recent-trigger** (a fixture toggled in the last 45 s within 3500 mm of the rig's RAW world pos: `BUBBLE_POOL_TRIGGER` keyed `light_on`💡💡✨😲 / `light_off`🌙 / `fireplace`🔥🔥😎🕯️ / `tv`📺🍿 / `doorbell`🔔🚪👀 / `action_button`✨💡🎬👍; fed by `ctx.recentTriggers`), then kitchen-night (`BUBBLE_POOL_KITCHEN_NIGHT` 🍪🍕🧀🍫🍿🍦, night+kitchen+standing idle), kitchen-morning (`BUBBLE_POOL_KITCHEN_MORNING` ☕🥞🍳🧇🥐🍊, morning+kitchen+standing idle), seated-evening (`BUBBLE_POOL_SEATED_EVE` 📖📱🎵📺🍪💤💭🎧📻🍷🎮, evening/night+seated, TV off — so a seated avatar is no longer *always* reading), bed (`BUBBLE_POOL_BED` 📱💤💭⭐🛌🧸🌜, sole occupant idling in a bed). `_pickCtxBubble` rolls the glyph ONCE when a tier engages and holds it (`ctxBubbleTier`/`ctxBubbleGlyph`) while the tier holds, so the pick stays stable for the 2.5 s commit and doesn't reroll every frame; a tier change re-rolls, anything else clears. Below the tiers sits the **generalized idle roll** (`_rollIdleBubble`, replaces the old plain personality pick; keeps the 25–60 s chatter timer + 7.5 s hold, allowed while walking): one glyph from a composite pool = per-kind personality (`AVATAR_BUBBLES`, listed TWICE for prominence) + `BUBBLE_POOL_GENERAL` (22 everyday glyphs) + `weatherBubblePool(ctx.weather)` (current condition + 🥵≥30°/🥶≤0° + forecast anticipation ☔/⛄ when tomorrow turns wet/snowy) when weather is present + a social pool (`BUBBLE_POOL_SOCIAL` / `_SOCIAL_PET`) when another live rig (visible, scale>0.5) is within 3000 mm and in this rig's front hemisphere (±~75° of `h.facing`, body-forward = scene −Z). The O(n²) neighbor scan runs ONLY at chatter-roll time (~30 s apart), never per frame. New glyphs ride the same canvas-sprite pipeline (Noto/Segoe emoji font stack) and their per-rig CanvasTextures are freed in `_disposeHumanoid`. `ActivityContext` carries three OPTIONAL additive fields for these tiers — `weather` ({condition, tempC, forecastCondition}), `recentTriggers` ({kind, x/y WORLD mm, ageS}), and `eventTriggers` ({kind, x/y WORLD mm **or null**, ageS}) — all built cheaply each tick in three-view `_tickOnce` (weather from `p.weatherNow`; triggers from a persistent `_trigPrevOn` prev-on map + `_recentTrigs` rolling list scanning current-floor lights/switches/TVs on on/off flips, pruned to 45 s / 8 entries, cleared on floor switch; events mapped from `p.householdEvents` — furniture-anchored ones resolved to the current floor's fixture x/y, weather ones passed with x/y null, pruned >45 s); all optional so a stale renderer chunk still animates. The bubble's local Y is **anchored per-rig off `h.plumbob.position.y`** (`+ BUBBLE_ABOVE_PLUMBOB` = 460 mm; the plumbob already sits head-top + margin), NOT a fixed constant — so it tracks child / teddy / supermodel proportions and drops with the root when seated instead of floating detached over short rigs (adult resolves to ≈ 2462, the old constant). The B3 name label rides the same anchor (`+ NAME_ABOVE_PLUMBOB` = 318). The lying pose still repins the bubble in world space via `worldToLocal`.
- **Anti-feedback rule**: every trigger (dwell, sit, bed occupancy, activity radius) reads the **RAW** target position / speed, never the eased visual pose, so the blend can't feed itself. Poses use the sit-blend idiom (`joint = walkValue·(1−blend) + POSE·blend`).
- **Dispose rules**: `_disposeHumanoid` frees the rig's `blurSprite` + `bubble` sprite maps (sprite `CanvasTexture`s are NOT freed by `_clearGroup`); keep that pairing. Shared style textures (gradient/blob/outline) are never per-rig disposed.

### Per-sensor target color
`Sensor.color` (hex, optional) tints all targets seen by that sensor in both 2D and 3D. Default falls through to `SENSOR_PALETTE[idx % palette.length]` (where `idx` is the sensor's index in `floor.sensors`). In 2D, T2 / T3 within a sensor are `lighten()`-shaded variants of the base so they stay distinguishable while sharing the sensor hue. Detail tooltip frames (when `showDetails` is on) use `hexToRgba(tintColor, …)` for stroke at 0.53 / 0.80 alpha.

### Avatar packs & settings drawer (see `docs/DESIGN-avatars.md`)
Avatars are organized into **packs** that load/unload and activate/deactivate at
runtime (Settings ▸ Avatars). Reference research for every pack lives in
`docs/avatars/**` (59 regeneration-ready group/franchise docs). **Authoring a
new pack** (schema, categorization taxonomy + placement tiebreaks, member
template, conventions, checklist): `docs/avatars/AUTHORING.md` — the canonical
reference; keep it updated when the schema grows.

- **`src/avatars.ts`** (pure, three.js-FREE, shared chunk — imported by BOTH the
  app graph and the lazy renderer chunk; never import three.js or renderer code
  into it): `AvatarDef`/`AvatarPackDef`/`AvatarPrimitive` types, the registry
  singleton, and `resolveDef`/`resolveAvatar`/`avatarFromPool`. `AvatarKind` is
  now a plain `string` (`AvatarId`); legacy kinds keep their bare ids, pack
  members are namespaced `'<packId>/<member>'`. `resolveDef(unknown)` → core
  `adult` (never throws) — that IS the stale-chunk / unloaded-pack fallback.
- **Core pack** = `adult` ONLY (`locked: true`, always loaded+active — the
  irremovable default). The other 23 legacy kinds live in the 9 `base-*` packs
  (builtin, default loaded+active → out-of-the-box parity with the pre-split
  app: same 24 avatars, same 22-humanoid random pool). **Franchise packs**
  (`franchise: true`, 52 packs incl. fallout-tv/sesame-street/wall-e) default UNLOADED — opt-in novelty.
- **Random/stranger fallback pool** = active humanoid non-pet members of
  builtin NON-franchise packs (franchise members never surprise an
  unidentified person); degrades to `['adult']`. Sensor/motion `avatarKinds`
  pools may hold ANY id; resolution filters to loaded+active (+ `members`
  subset), so deactivating a pack silently drops its members from every pool.
- **Persistence**: `Store.avatarPacks?: Record<packId, {loaded?, active?, members?}>`
  (in `_loadFromHa`'s explicit list). Pack BODIES are not in the store:
  builtins ship as lazy chunks (`src/avatar-packs/manifest.ts` is the eager
  index; bodies are dynamic-import-only — never static-import one into the
  startup graph), user-imported packs live in IndexedDB
  (`avatar-store.ts`, db `diorama-avatars`) as raw JSON. Planner hydrates on
  connect (`_hydrateAvatarPacks`) + `setPackLoaded/Active/Members` helpers;
  import validates via `validatePackJson` (never throws).
- **Declarative accessories** (`AvatarPrimitive[]` on a def): box/sphere/
  cylinder/cone at anchors `crown|head|face|chest|back|hip|root|handL|handR|
  shoulderL|shoulderR|neck|tailbone` (+ quad `qhead|qneck|qback|qrump`), sizes
  mm at sk=1 (cone accepts 2-tuple `[r,h]`), colors hex/`'tint'`/`'skin'`/
  `'body'`/`'dark'`/`'accent'`, optional `sphereArc`, `'torus'` shape
  (`size:[radius, tube, arc?]`), per-prim `opacity` (transparent → auto
  outline-skip) + `segments` (cone/cylinder radial count — the professional's
  flat shirt-V is a 3-segment cone). Built via `_mat()`, parented to the rig
  root (outline/fade/privacy pick them up automatically).
  **The imperative legacy path is GONE (2026-07-20 migration)**: ALL ~625
  members incl. the original 24 base kinds are fully declarative —
  `_addAvatarAccessories` + `legacyAccessories` + every kind-string rig branch
  were deleted. The former special cases are now def fields: `gown?: boolean`
  (wise_oracle), `earSkip: boolean | 'left' | 'right'` ('right' = skip the +x
  ear; cyborg keeps its −x organic ear), and `limbColors` entries widened to
  `number | {color, metalness?, roughness?, emissiveIntensity?}` (object form
  = prosthetic — recolors the whole arm INCLUDING the hand; number form =
  flat recolor, hand stays skin; note `_mat()` is MeshToonMaterial and DROPS
  metalness/roughness — steel is observable only via color+emissive).
  Hand-anchored declarative accessories register in `handAccessories` and
  hide/restore during prop sessions — the old "legacy imperative hand props"
  prop-swap gap is CLOSED. Parity is locked by
  `test-pages/legacy-migration-test.html` + the IMMUTABLE fixture
  `test-pages/fixtures/legacy-accessory-parity.json` (world-geometry
  signatures captured from the pre-migration build; `LEGACYMIG PASS 187/187`
  at ≤0.05 mm; regen procedure in the page header — only regenerate if a
  deliberate visual change to those members is intended). Migration inventory:
  `docs/research/legacy-accessory-migration.md`. Humanoid rig note: there is
  NO independent head group (head accessories parent to root at fixed offsets
  — a hat never head-tracks); the QUAD `qhead` anchor DOES ride the nodding
  head group.
  **ANCHOR ASYMMETRY (2026-07-20 fix — the "invisible accessory" trap)**:
  `chest` resolves to the torso FRONT face (`z = −TORSO_D/2` = −70 at sk 1) so
  a chest tie needs only −6…−16 more, but `neck` resolves to the torso CENTRE
  in z (`z = 0`, y = torso top) so neck-ENCIRCLING pieces can be authored
  symmetrically. Authoring a FRONT accessory on `neck` with a chest-sized
  offset builds it INSIDE the 140·sk-deep torso → never renders. 45 prims
  across 34 members in 17 packs were invisible this way; fixed by one uniform
  rule — a front accessory on `neck` carries the missing half-depth itself
  (`pos.z −= 70`). Sibling rule for neck-encircling RINGS: size them, don't
  move them — half-extent along z ≥ `TORSO_D/2 + 8` (= 78 authored mm) so the
  band overhangs front AND back (8 rings were authored smaller than the torso
  and showed only their top edge; a ring exactly tangent at r=70 also hatches
  — the coincident-face gotcha). Both rules are documented in
  `docs/avatars/AUTHORING.md` and at the `neck` case in `anchorOf`. Legacy
  `professional`/`magician` had a related bug: a 3-segment `ConeGeometry`
  V-neck needs `rotation.y = π/3` (vertices every 120°), NOT π/4, to put a
  flat face on body-front, and the tie must clear the cone's inradius
  (`TORSO_W·0.17`) or it renders buried behind the shirt. Test
  `necktie-test.html` (`NECKTIE PASS 155/155`, world-vertex measurements +
  a negative control).
- **Rig extensions** (batch C1): `headShape 'cylinder'|'oval'`; `eyes 'none'`
  + `noFace`; `opacity` (transparent materials — outline shells auto-skip);
  `hover` (mm — legs omitted, root floated, constant bob; every leg-joint
  access in updateTargets is null-guarded); `limbColors {armL,armR,legL,legR}`;
  `posture.pitch` (static root-pitch bias, both rigs); parameterized
  quadruped (`bodyLen/W/H, legLen, headR, headScale, neckLen, ears
  pointy|floppy|round|long|none, tail up|down|curl|tuft|none, snout, coat,
  belly, earColor, snoutColor, pawColor, tailTipColor`) — cat/dog are now
  data with today's exact proportions; quads read `def.personality` (walk
  multipliers) but still never bubble.
- **Animated appendages & gait (Phase 4b)**: `AvatarPrimitive.animate {kind:
  'sway'|'flap'|'orbit'|'spin', speed?, amp?, phase?}` registers a prim for
  per-frame motion — `_addDeclarativeAccessories` captures its base transform
  ONCE into `Humanoid.animPrims` (`{mesh,kind,speed,amp,sk,t,baseRot*,basePos*}`;
  `t` is an ACCUMULATED phase, init = the prim's `phase`), and `_advanceAnimPrims`
  (called every frame in updateTargets for BOTH rigs, `t += dt·speed`) oscillates
  it — **zero per-frame alloc, no new resources** (prims are rig-root children →
  outline/fade/dispose pick them up). `sway` = rotation.x sin (amp rad); `flap` =
  rotation.z |sin|, mirrored wings author +amp/−amp, speed DOUBLES while
  `walking`; `orbit` = position circles the base in x/z, radius amp·sk mm; `spin`
  = continuous rotation.y. Defaults speed 2, amp sway 0.3/flap 0.6/orbit 60,
  phase 0. `HumanoidFields.gait 'walk'|'hop'|'knuckle'` (stored on `Humanoid.gait`;
  absent = `'walk'`, a HARD gate leaving the classic walk-pose formulas
  byte-identical): the gait block reshapes the `w*` walk-pose values ONLY while
  walking (`hop` = phase-locked legs + `hopBob` 2.1× the shared bob term + tucked
  arms; `knuckle` = short leg swing + arm swing >leg + `wLeanX −= 0.5·ampNorm`
  torso pitch); sit/activity/lie blends + idle fidgets compose on top unchanged.
  `QuadrupedFields.earAnimate 'flick'|'swivel'|'none'` (→ `Humanoid.earAnim`) in
  `_applyQuadPose`: `swivel` = slow independent per-ear yaw wander. Test page
  `avatar-anim-test` (`AVATARANIM PASS 32/32`).
- **Torso decals & two-handed props (rig-gap batch)**: **STYLE RULE — prints /
  text / glyphs ship as crisp canvas-painted DECAL PLANES, NEVER a texture map
  on the flat-toon BODY mesh** (the no-body-texture house style is deliberate;
  decal planes are their own family like the blob / pulse / front-arrow decals).
  `HumanoidFields.decals?: AvatarDecal[]` (cap **2**; `{kind:'text'|'glyph'|
  'print', text?, glyph?, print?:'dots'|'stripes'|'check'|'heart-scatter', color?:
  hex|'tint'|'dark', bg?, scale?, anchor?:'chest'|'back'}`): `_addDecals` builds a
  thin `PlaneGeometry` quad ~8 mm proud of the torso chest (−Z, `rotation.y=π`) /
  back (+Z) face, with a per-rig `CanvasTexture` painted ONCE (`_decalTexture` →
  jersey-uppercase text / one big emoji glyph / deterministic tiled `print` via
  `_paintPrint`, no `Math.random`). Material = flat **`MeshBasicMaterial`** (a
  documented `_mat()`-toon exemption — the 4-step toon gradient muddies fine art);
  `userData.outlineSkip` + `userData.decal` (the latter flags the per-rig map for
  disposal). `_disposeHumanoid`'s MESH branch now frees `material.map` when
  `userData.decal` (guarded so the shared `_blobTex` on the blob shadow is never
  touched). `AvatarPrimitive.twoHanded?: true` (valid only on a `handL`/`handR`
  prim): registered into `Humanoid.twoHandProps` (`{mesh, otherHand}`);
  `_advanceTwoHandProps` (every frame in updateTargets, after `_advanceAnimPrims`;
  reused module-scope `_thp*` scratch vectors/quaternions — zero alloc) re-aims
  the prop's local **+Y** from the anchor hand toward the other hand so a staff /
  broom stays two-hand-gripped through walk/sit/activity poses. Position stays at
  the anchor hand — author ONE centered cylinder (origin = grip). Plain one-handed
  hand props (no flag) stay rigidly parented in the single hand group. Test page
  `avatar-build-test` covers decal builds + canvas readback + chest/back proud
  offset + cap 2 + per-rig map disposal + two-handed aim + one-handed sit-attach.
- **Costume swaps (look variants)**: a rig keeps ONE identity (kind + color)
  but can wear an alternate **look** — an OVERLAY spread over the base def at
  build time, never a sibling member. `resolveLook(def, look)` (avatars.ts,
  pure): member-authored `AvatarDef.variants` (matching `id`) WINS, else the
  universal look applies only when `universalLookEligible` (the trousers
  predicate: tint skin + no explicit legColor + not pet/quad + no `hover` —
  costume-identity kinds like robot never take universals). Overlay keys are
  whitelisted (`skin`/`legColor`/`limbColors` numeric hex; `decals`/`prims`
  REPLACE, `addPrims` APPEND). Three auto-triggered `LookKey`s (v1, no manual
  selection): `sleep` (lie > 0.5 + evening/night/late_night — day naps keep
  day clothes; pajama legColor + dot-print decal + nightcap), `exercise`
  (engaged `exercise` activity; headband + charcoal shorts), `cooking`
  (engaged load_dishwasher/make_coffee/forage_fridge; stripe-print apron
  decal). Renderer: `Humanoid.look/lookWant/lookHoldT`, `_resolveLookWant` +
  `_advanceLook` (2 s commit / 3 s clear hysteresis), swap rides the EXISTING
  kind-rebuild path with `_carryLookState` preserving sit/lie/act/nav/claims
  (runs on every rebuild — fused kind swaps also keep pose now) and the
  `forcedKind` pool carry-over; a committed swap fires a sparkle one-shot
  (shared `_sparkleTex` disposed only in `destroy()`; per-swap rig-parented
  sprite self-disposes ~0.6 s). Gates: `Store.avatarCostumes` (absent = ON,
  in `_loadFromHa`'s list; Settings ▸ Display "Avatars change outfits") +
  `DioramaPerson.allowCostumes` (item-level; People editor) → three-view
  builds `ActivityContext.costumes` + stamps `TargetWorld.noCostumes` on
  identified targets (fused/BLE/cam) — all optional/stale-chunk-safe. Quads/
  pets never swap. Test page `costume-test.html` (`COSTUME PASS 47/47`).
- **Settings drawer** (`<diorama-settings-drawer>`, ~560 px, tabbed:
  Connection | Display | Weather | Avatars | Integrations | Data; non-edit
  modes see Connection only). Display/Weather/Data tabs hold the sections
  moved off the sidebar; Avatars is the pack manager (path-grouped tree,
  Loaded/Active toggles, per-member subsets with color swatches, Import/
  Export/Remove JSON packs; core row locked). `show(tab?)`; the weather chip's
  `open-weather` opens the Weather tab.
- Test pages: `avatar-pack-test` (registry/config math), `avatar-build-test`
  (declarative builds + rig extensions), `avatar-store-test` (IDB + validator),
  `avatar-content-test` (builds EVERY member of every builtin pack).

### People registry & BLE identity ("World Outside" arc — see `docs/DESIGN-world.md`)
- **People** (`Store.people: DioramaPerson[]`): the shared identity concept. Each person has `id`, `name`, optional `color`, `avatarKind` (single pick — any avatar id from a loaded+active pack), `isPet`, and three HA bindings (`haPersonId` person entity, `bermudaDeviceId` HA device id of the tracked BLE device, `gpsTrackerId` device_tracker). BLE trilateration and GPS both resolve to a person; rendering resolves a person to an avatar (fusion / rendering land in B2+). Sidebar "People" section is the CRUD (`Planner.addPerson/updatePerson/deletePerson`, `activePersonId` for list expansion). `Store.bleShowUnknown` (absent = true) gates showing configured-but-unmapped BLE devices — persisted now, consumed in B2.
- **BLE proxies** (`Floor.bleProxies: BleProxy[]`, `{id, name, x, y, height?, haDeviceId?, locked?, hidden?}`): a near-clone of the motion-sensor fixture flow (place with the **BLE** tool → 2D antenna puck in `drawBleProxies` + `hitBleProxy` + `ble` drag kind → 3D mast+bead in `updateBleProxies` under the `_keyBle` dirty key). Visibility **rides the `sensors` layer** in both views (`_bleGroup.visible = v.sensors`). Binding picks the physical proxy **device** (entity-picker device mode) — the scanner-MAC ↔ fixture match runs through that device's registry `connections`.
- **Bermuda enable/disable** (`Store.bermudaEnabled?`, absent/true = enabled): the Settings drawer "Integrations" block (edit mode only) toggles it. When `=== false` the whole Bermuda BLE path is inert — `scanBermuda()` early-returns, the one-time auto-scan is skipped, the `state_changed` hook skips BLE sample recording + `_solveBle`, and `blePeople` returns `[]` (which empties `bleUnfused` + no-ops fusion downstream, hiding all BLE targets/2D dots). Sidebar-side: the People "Bermuda BLE" subsection + "Show unknown BLE devices" toggle + per-person Bermuda-device binding row are hidden; the BLE Proxies section still renders (user-placed fixtures) but shows a dim "(Bermuda integration disabled in Settings)" hint.
- **Bermuda discovery** (`Planner.scanBermuda()`, runtime-only, `Planner.bermuda`): scans the entity registry for `platform === 'bermuda'`, groups per-tracked-device, parses per-scanner distance unique_ids `{device_mac}_{scanner_mac}_range[_raw]` (colon-MAC token regex), records each smoothed-range entity's `disabled_by`, and matches scanner MACs to placed proxies via device `connections` (normalized through `normMac`). The sidebar's Bermuda subsection lists devices + disabled-entity counts; `enableBermudaDevice(dev)` flips `disabled_by: null` via `config/entity_registry/update` (consent button; HA needs ~30 s / an integration reload to start reporting). The solver + BLE targets are B2.
- **Entity-picker device mode**: `EntityPicker.showDevices(devices, onPick, title)` renders a flat device list (returns a device id). The `open-entity-picker` event carries a `devices` array for this mode; a bare `domain` stays the classic entity mode. Used for the BLE-proxy device bind and the person→Bermuda-device bind.
- **HaApi additions** (both `HassClient` + `HassPanelAdapter`): `getDevices` now returns `connections`; `getEntityRegistry` now returns `platform`/`unique_id`/`disabled_by`/`original_name`/`name` (all additive); new `updateEntityRegistry(entityId, changes)` → `config/entity_registry/update`.

### Identity fusion (Feature B, phase B3 — mmWave precision + BLE identity)
- **Matcher core** (`src/fusion.ts`, pure + deterministic — no `Date`/`Math.random`, the caller passes candidate distances + a `dtMs`; test-driven in `test-pages/fusion-test.html`). `stepFusion(state, {cands, presentPersons, stalePersons, presentTargets}, dtMs, cfg)` mutates + returns the persistent `FusionState` (`pending` per candidate pair + committed `fused` targetKey→person). A radar target adopts a BLE person's identity when the (person,target) pair is the **unique** in-gate candidate — the person's nearest target AND the target's nearest person, with **no** second candidate for either side within `gate×AMBIG_FACTOR` — held **continuously** for `FUSE_HOLD_MS`. Every threshold carries hysteresis so it can never oscillate: `BASE_GATE_MM 1500` (widened per pair to `max(1500, confidenceMm)`), `FUSE_HOLD_MS 4000`, `AMBIG_FACTOR 1.25` (ambiguity blocks NEW fusion but does NOT touch an existing fusion's timers), `RELEASE_FACTOR 2.0` + `RELEASE_HOLD_MS 6000` (a fused pair releases only after separating past `gate×2` for 6 s), plus **instant** release on radar-target-gone / BLE-person-stale / person-gone. All constants are documented at the top of `fusion.ts`.
- **Planner integration** (`_fuseIdentities`, runtime-only): runs on each BLE solve **and** a ~2 s timer (`FUSION_TICK_MS`; both no-op when no BLE people exist). It gathers candidates from **LERPED** radar positions (`lerpBy[s.id]` → `localToWorld`, key `<sensorId>_<i>` — the same source the renderer/2D see) × `blePeople` on the **same floor**, keying persons by `BlePerson.key` (so unknown devices with no `personId` still take part), then decorates the committed pairs into `Planner.fusions: Record<targetKey, Fusion>` (`{personId?, name, color, avatarKind?, isPet?, since}`) + `Planner.fusedPersonIds: Set<BlePerson.key>`. `since` is stamped once per pair. Repaints (`emitConfig`) only when the fused set changes, so the 2 s timer doesn't churn. `Planner.bleUnfused` = `blePeople` minus fused ones — **renderers draw BLE ghost rigs only for these** (a fused person's ghost hides; the radar target now carries their identity, so nobody renders twice). Fusion state is **never persisted**.
- **3D rendering**: three-view stamps `TargetWorld.person` (from `fusions[key]`) on radar targets and builds BLE targets from `p.bleUnfused` instead of `p.blePeople`. In `updateTargets` a fused target's `wantKind`/`wantColor` come from the person (their avatar, else a pet default → quadruped, else keep the sensor pool pick; color = `hexToInt(person.color)`) — the existing rebuild-on-kind/color-change path swaps the rig cleanly, **including humanoid⇄quadruped** for a pet fused onto a radar target.
- **Name labels** (`Layers2D.nameLabels`, default on — sidebar layer def + presets like geo/weatherFx): a camera-facing sprite at `NAME_LOCAL_Y` (above the plumbob) showing the person name + a colored underline, shown ONLY when **confident** — a fused radar target OR an identified (`personId != null`) BLE rig; NOT unknown devices. `_syncNameLabel(h, t)` runs every frame for ALL rigs (pets included — outside the non-quad bubble block); it (re)paints the canvas **only when the name/color changes** (cached in `h.nameText`/`h.nameColor`), gates `sprite.visible` on `_showNameLabels` (`setLayerVisibility(v.nameLabels)`) + rig visibility + `lie < 0.5`, and follows the **bubble sprite lifecycle exactly**: the sprite is a child of `h.group` so it **fades with the rig** via `_fadeRig` and its per-rig `CanvasTexture` is freed by `_disposeHumanoid`'s sprite traverse (never a shared map — the blur/gradient/blob textures are exempt).
- **2D rendering**: fused radar dots (`drawTargets`) adopt the person color, draw the shared initials chip (`drawInitialsChip`) instead of the `T#` label, and — when `nameLabels` is on — a dim person-colored name line under the chip. `drawBlePeople` iterates `p.bleUnfused` and adds a name label for identified people only. Both share `nameInitials`/`drawInitialsChip`/`drawNameLabel` helpers.

### Weather core (Feature W — see `docs/DESIGN-world.md`)
- **Config** (`Store.weather: WeatherConfig`, optional/opt-in): `source` (`'entity' | 'sensors' | 'openmeteo'`), `entityId` (weather.*), `sensors` (`{precip, windSpeed, temp, lightning}` entity ids), `zip`/`lat`/`lon`/`placeLabel` (Open-Meteo location; zip geocoded once → lat/lon cached), `chip` (default true), `effects3d` + `affectLighting` (default true — **persisted now, consumed in W2**). In `_loadFromHa`'s explicit field list; no per-floor fields.
- **Normalization** (`src/weather.ts`, pure + two isolated fetch helpers — the codebase's FIRST third-party network call): every source maps to a runtime `WeatherNow {condition, tempC, windKmh, windBearing, isDay, stale, label?, forecastCondition?}` where `condition` is HA's 15-state vocabulary (`HaCondition`). `forecastCondition` is tomorrow's condition (Open-Meteo `daily=weather_code&forecast_days=2` → `weather_code[1]` through `wmoToCondition(code,true)` day-framed; entity source reads the legacy `attributes.forecast[0].condition` best-effort, accepted only if a known `HaCondition`; sensors source leaves it undefined) — feeds forecast-anticipation thought bubbles. `resolveWeatherEntity` reads a weather.* entity (unit-normalizes temp/wind from its own attrs); `deriveFromSensors` runs the station heuristic (precip>0.1→rainy, >7.6→pouring, cold precip→snowy, wind>38 km/h→windy, lightning→storm, else clear); `wmoToCondition(code,isDay)` is HA core's exact WMO→HA table; `fetchOpenMeteo`/`geocodeZip` hit Open-Meteo (keyless, CORS *) and **return null on any failure**. `toCelsius`/`toKmh`/`toMmPerH` are the unit normalizers. sunny↔clear-night is always re-gated through `isDay` (exported from `time-of-day.ts` — do NOT duplicate the sun read).
- **Planner integration**: `Planner.weatherNow` (runtime). Entity/sensors sources recompute in `_onStates` on a bound-entity change or full refresh (those ids are added to `_isSlowEntity` so the chip + sidebar re-render). Open-Meteo polls on connect + every 15 min (`setInterval`, cleared on reconfigure); zip geocoded once then cached via `save()` (no-op outside edit) with a `zone.home` fallback. Offline tolerance: `weatherNow` holds its last value and is marked `stale` after 45 min. All network work stays inside `weather.ts` try/catch — a fetch failure never reaches the RAF/tick paths. `setWeather(mut)` (sidebar edits) + `refreshWeatherLocation()` (zip Search) are the entry points; `_reconfigureWeather()` restarts/stops the poll on a source switch.
- **Chip** (`<diorama-weather-chip>`, light DOM via `define.ts`): mounted ONCE in `app.ts`'s shared canvas container so it overlays both 2D and 3D without a duplicate interval. Glyph + temp (respects `store.imperial` for °F) + place/entity label; dims when stale; hidden when `weather.chip === false` or no source resolved. Non-interactive except an edit-mode click → `open-weather` event → the Settings drawer's Weather tab. **DC-C position/content/forecast** (all on `WeatherConfig`, additive, whole-object through `_loadFromHa`): `chipAnchor` (`'tl'|'tm'|'tr'|'bl'|'bm'|'br'`, default `'br'` = the legacy bottom-right; TOP anchors clear the 3D view-controls bar — at `top:8px`, ~30 px tall — via a `barOffsetPx` default 44), `chipCustom {x,y}` (px offsets from the anchor's edges, WINS over the pure anchor), and `chipContent {apparent?, humidity?, wind?, hourly?, daily?}` (extra rows + forecast-strip entry counts, 0/absent = hidden). The chip stays a compact pill until any content/forecast is enabled, then grows a panel: current row + optional feels-like/humidity/wind rows + a horizontal hourly strip (hour/glyph/temp) + a vertical daily list (day/glyph/hi-lo), reading `Planner.forecastHourly`/`forecastDaily`. Position CSS comes from the PURE `chipAnchorStyle(anchor, custom, barOffsetPx)` in `weather.ts` (shared with the test page); content defaults from `resolveChipContent` (counts clamped 0..12 / 0..7). Settings ▸ Weather tab has a "Chip appearance" block (`_weatherAppearance` in modals.ts): 6-anchor button grid + custom x/y inputs (+ Clear) + content checkboxes + hourly/daily count inputs. Test page `test-pages/weather-test.html` (`WEATHER PASS 200/200`: WMO table, sensor heuristic, unit normalization, entity sun-gating, forecast extraction, chip anchor/content resolution, Open-Meteo forecast parse, alert parse matrix) — bundle `weather.ts` via `esbuild --bundle` like `trilateration.html`.

### Weather alerts (DC-D — see `docs/research/weather-alerts.md` + `docs/DESIGN-display-controls.md` §8)
Government/agency weather WARNINGS (tornado warning, flood watch, heat advisory…) surfaced from a user-picked HA alert entity. Distinct from the forecast *condition* — discrete, severity-ranked, time-bounded events. **Own feature parallel to the weather chip/FX**, but v1 rides the chip (badge + panel) + a 3D beacon; the standalone HUD banner from the research doc is DEFERRED.
- **Normalizer** (`src/weather.ts`, pure, no network — every source is an HA entity read): `WeatherAlert {event, severity: 'advisory'|'watch'|'warning', headline?, expires?}` + `parseWeatherAlerts(state): WeatherAlert[]`. 3-level scale = the NWS product tier users recognize (advisory<watch<warning). Auto-detects the major shapes **defensively, first-nonempty-wins**: (1) an `alerts` array of CAP-ish dicts or title strings (NWS custom `nws_alerts`, Environment Canada `{title, alert_colour_level, expiry_time}`, cap_alerts); (2) DWD indexed `warning_count` + `warning_N_level/name/headline/end` (level 1–4 ladder); (3) MeteoAlarm binary_sensor `awareness_level`/`awareness_type` pair (single alert; strips the numeric code, off/'' = inactive); (4) NWS legacy pipe-joined parallel `event|severity|expires` strings; (5) a generic `event`/`headline`/`severity` single-alert fallback. Severity resolution: **event-name tier word wins** (`tierFromText`: warning/emergency→warning, watch→watch, advisory/statement→advisory) → else the explicit severity FIELD (`severityFromField`: CAP Extreme/Severe→warning, Moderate→watch, Minor→advisory; color words red/orange/yellow; numeric level ≥4/3/≤2) → else `'advisory'`. CAP `status`/`messageType` non-`Actual`/cancel entries dropped (test-alert filter). Absent/unavailable/unknown entity → `[]`; anything unparseable → skipped. Helpers: `alertSeverityRank`, `worstAlertSeverity`, `ALERT_SEVERITY_COLOR` (yellow `#f5c400`/orange `#ff8c00`/red `#e6291a`, MeteoAlarm ramp).
- **Config**: `WeatherConfig.alerts?: {entityId?, beacon?}` (additive, whole-object through `_loadFromHa`'s `weather:` passthrough; `beacon` default ON). **Planner**: runtime `weatherAlerts: WeatherAlert[]` (NOT persisted), recomputed in `_onStates` on the alert entity's change or a full refresh + in `_reconfigureWeather` (so a settings edit repaints), cleared when unconfigured. The alert entity id is **config-path** in `_isSlowEntity` (any domain — scoped to that one bound id) so the chip badge + sidebar preview repaint on a fire/clear.
- **Chip** (`weather-chip.ts`): a severity-tinted `⚠ N` badge (highest severity color) when alerts exist. Clicking the **badge** (a distinct target, `stopPropagation`) toggles an expanded alerts panel in EVERY mode — severity pill + event + headline + relative expiry per alert, capped 4. Clicking the chip **body** in edit mode still opens the Weather settings tab (`open-weather`); in non-edit modes the body toggles the panel too. The chip becomes pointer-interactive in non-edit mode only when alerts exist (else display-only as before). (Chip still requires a resolved `weatherNow` to show at all — alerts configured with no weather source won't badge; the 3D beacon is independent.)
- **Settings ▸ Weather** (`_weatherAlertsBlock` in modals.ts): an "Alerts" block — alert entity picker (entity mode, domain `['sensor','binary_sensor']`) + Clear + beacon checkbox + a live preview (`N alerts · worst: <sev>` / `none parsed`).
- **3D beacon** (`three-renderer.ts` + `three-view.ts`): `WeatherFxState.alertSeverity?` (stale-chunk safe — absent = none), stamped by `_weatherFxState` from `worstAlertSeverity(planner.weatherAlerts)` gated by the weatherFx LAYER + effects3d MASTER + `alerts.beacon` (but NOT on a live weather source — an alert shows under "Clear"). Renderer: `_alertPulseLight` — a low colored `PointLight` above floor center (built lazily, disposed only in `destroy()`, lives on `_scene` outside `_weatherGroup`), color/peak/period per severity (`ALERT_BEACON`); `_setAlertBeacon` sets the target in `updateWeather`, `_advanceWeather` eases presence in/out (τ≈1.5 s) and sine-pulses intensity (~0.2 Hz warning → slower/dimmer advisory) — a faint edge-of-vision wash, NOT a strobe, zero geometry/allocation. Severity folded into `_keyWeather` so the light rebuilds only on a transition. Test pages: `weather-test.html` (alert parse matrix, part of `164/164`) + `weather-fx-test.html?c=alert` (beacon builds/pulses/color/clears, `WFX PASS alert 7/7`).

### MQTT bridge (phase 5 — see `docs/DESIGN-mqtt-bridge.md` + `docs/research/frigate-mqtt-bridge.md`)
Reads genuinely-spatial MQTT topics HA's WebSocket API doesn't expose — **Frigate** raw bounding boxes and **Valetudo** room maps. Batch M-A is the **bridge core only** (no Frigate/Valetudo consumers yet; those are Batches M-B / M-C). Two transport paths converge on one internal shape: per-topic-filter callbacks fed `{topic, payloadString}`.
- **Two transport paths** (`docs/research` §2.5): **Path A `'ha-relay'`** rides HA's own `mqtt/subscribe` WS command over the already-authenticated connection — no new credentials, but **admin-gated** (`raise Unauthorized` for a non-admin HA user → the bridge surfaces status `'unauthorized'` and the UI suggests direct mode). Publishing is the ordinary `mqtt.publish` service (not admin-restricted). **Path B `'direct'`** connects straight to the broker over MQTT-over-WebSocket (browsers can't speak raw TCP MQTT) — needs the broker's **websocket listener** enabled (mosquitto add-on does NOT by default; user edits its config), **`wss://`** when the panel is served over HTTPS (mixed-content otherwise), and separate host/port/user/pass.
- **`src/mqtt-ws.ts`** (ZERO imports — the codec half runs under node for tests; only the client class touches `WebSocket`, inside methods): a pure MQTT 3.1.1 packet codec — `encodeConnect/Subscribe/Publish/PingReq/Disconnect` (QoS 0 only, clean session, no will), incremental `decodePackets(buffer) → {packets, rest}` (CONNACK/SUBACK/PUBLISH/PINGRESP decoded, others gracefully skipped as `'other'`, malformed → structured `'error'` packet, **never throws**; a partial trailing packet becomes `rest` for the next chunk), and `matchTopicFilter(filter, topic)` (`+`/`#` semantics: `#` must be last + matches parent, `+` = one level, `$`-topics excluded from a wildcard root per §4.7.2). `MqttWsClient` over native WebSocket (`binaryType='arraybuffer'`, subprotocol `'mqtt'`): connect/CONNACK handshake with timeout, keepalive PINGREQ timer, subscribe/publish, onMessage/onStatus. **Reconnect is NOT the client's job.** Lazy-chunked — `mqtt-bridge.ts` does `await import('./mqtt-ws.js')` only in the direct path, so it stays out of the startup graph.
- **`src/mqtt-bridge.ts`** (weather.ts-style isolation; itself dynamic-imported by the Planner): `startBridge(cfg, api, handlers) → {subscribe(filter,cb), publish(topic,payload,retain?), stop(), status}`. Status ladder `idle | connecting | up | error | unauthorized` via `onStatus`. Path A subscribes per-filter through `HaApi.subscribeMqtt` (HA matches server-side; a probe subscription up front lets the status pill report before any consumer subscribes; a subscribe error containing "unauthorized" → `'unauthorized'`). Path B owns the **reconnect backoff (2→30 s, cap)** + resubscribes every registered filter on reconnect + dispatches inbound PUBLISHes through `matchTopicFilter`; **broker creds read from localStorage `diorama:mqtt:user`/`diorama:mqtt:pass` ONLY** (never the synced Store — mirrors `diorama:token`). `BridgeApi` is a narrow `subscribeMqtt`/`publishMqtt` subset (fake-able in tests).
- **HaApi additions (BOTH clients + LocalApi inert)**: `subscribeMqtt(topic, cb): Promise<() => void>` — the WS `{type:'mqtt/subscribe', topic}` subscription command (HassClient adds a generic id-keyed `_subscriptions` map routing `{type:'event', id, event}` messages + `unsubscribe_events` cancel; HassPanelAdapter rides `connection.subscribeMessage`; **neither swallows the rejection** so the admin gate surfaces) — and `publishMqtt(topic, payload, retain?)` via `call_service` `mqtt.publish`. `LocalApi` returns a no-op unsub / no-ops.
- **Config**: `Store.mqttBridge?: {mode?: 'off'|'ha-relay'|'direct'; brokerHost?; brokerPort? (9001); useTls?; frigateTopic? ('frigate'); valetudoNs? ('valetudo')}` — in `_loadFromHa`'s explicit list (`mode` syncs; **secrets never here**). **Planner**: `_reconfigureMqtt()` (async — dynamic-imports the bridge; inert when mode off/absent or `isOffline`; stop-then-start idempotent; re-checks config after the await) wired into `_applyLoadedStore` + a one-time `_mqttInited` first-load init (mirrors `_weatherInited`); runtime `mqttStatus` getter; `setMqttBridge(mut)` mutator; `restartMqtt()` (Settings "Test connection"); `mqttSubscribe(filter, cb)` — the consumer seam (Batches B/C) that **queues subscriptions and replays them on every bridge restart**.
- **Settings ▸ Integrations** (`_mqttBlock` in modals.ts, edit-only): mode radio + live status pill (with the admin-gate hint on `'unauthorized'`) + direct-mode fields (host, port 9001, TLS, username/password → **localStorage only, "stored on this device only"** hint) + frigate-topic / valetudo-namespace inputs + Test-connection button.
- **Tests**: `test-pages/mqtt-codec-test.html` (`MQTTCODEC PASS 45/45` — encode goldens incl. creds, SUBSCRIBE, binary-safe PUBLISH; remaining-length multi-byte at 127/128/16383/16384; decode roundtrips; PUBLISH split across chunk boundaries incl. mid-varint; malformed-frame tolerance; ~18-case topic-filter matrix — transpile `mqtt-ws.ts` with plain `esbuild --format=esm`, no bundle, like trilateration) and `test-pages/mqtt-bridge-test.html` (`MQTTBRIDGE PASS 18/18` — fake HaApi relay incl. unauthorized surfacing; fake WebSocket direct path via the real codec incl. reconnect/backoff/resubscribe + queued-subscription replay — bundle `mqtt-bridge.ts` with `esbuild --bundle` to inline its dynamic import, plus `mqtt-ws.mod.js` for the fake socket's wire protocol).

### Frigate ground-truth targets (phase 5, Batch M-B — Frigate raw boxes → floor targets)
Turns a camera's Frigate detection bounding boxes into real `(x,y)` floor-plan targets — feeding the SAME humanoid-rig/target pipeline mmWave + BLE drive, but for yard/driveway/porch areas no radar or BLE covers. Consumes `<frigateTopic>/events` off the MQTT bridge (Batch M-A).
- **`src/homography.ts`** (pure, ZERO imports — the geo.ts/trilateration.ts idiom; test page transpiles it with `esbuild --format=esm`, no bundle): `solveHomography(pairs: {u,v,x,y}[]) → number[9] | null` (planar DLT, h33=1; 8×8 Gaussian elimination with partial pivoting at exactly 4 points, normal equations `AᵀA h = Aᵀb` for N>4; null on <4 points, singular/collinear-degenerate, or non-finite input), `applyHomography(h, u, v) → {x,y} | null` (null when the projective denominator `h31·u+h32·v+1 ≈ 0`), `homographyResidualsMm(h, pairs)` (per-pair reprojection error mm; Infinity for a point that fails to project). The solved matrix is **derived, never persisted** — only the raw points are stored.
- **Calibration data** (`CameraFixture.camCalib?: {detectW?, detectH?, points: {u,v,x,y}[]}`, item-level; plus `CameraFixture.frigateName?` + `CameraFixture.color?`): image↔floor correspondences. `u,v` are **DETECT-resolution** pixels (the frame Frigate reports boxes against — often lower than the stream; surfaced in the UI copy). Planner memoizes the solved homography per camera on a points-hash (`_camHomography`).
- **Calibration UI** (`_cameraFrigateBlock` in the camera sidebar editor): Frigate-name input (default = `slugifyFrigateName(label)`), dot-color picker (`cameraColor(cam, idx)` — SENSOR_PALETTE by fixture index), detect W×H inputs (auto-default from the snapshot's natural size on `@load`), and a **clickable snapshot** — a click records `u/v` scaled displayed→detect (`fraction × detectW/H`) into `Planner.pendingCamCalibUV` and ARMS a plan click via the geo-landmark latch idiom (`Planner.placingCamCalibId`; canvas-interact's click branch + mousedown early-return + tool/uiMode resets mirror `placingLandmarkId`), whose next 2D click pushes the `{u,v,x,y}` pair. Numbered pair list w/ per-row delete + a live fit readout (`solved · max residual N mm` / `need ≥4 points` / `degenerate`). 2D `drawCameras` draws numbered ⌖ crosshairs at calibrated plan points while the camera is selected.
- **Runtime consumption** (Planner, LIVE path — NEVER `emitConfig` per detection): `ensureFrigateSub()` subscribes `<frigateTopic>/events` ONCE (idempotent `_frigateSubscribed` guard) the first time the bridge is configured AND some enabled-floor camera has a solvable homography — called from `_reconfigureMqtt`, and from canvas-interact/sidebar after a calibration edit; queues via `mqttSubscribe` until the bridge is up. `_onFrigateEvent(payloadString)` (all try/caught): parse `{type, before, after}`, use `after ?? before`, skip `false_positive === true`, accept `type` new/update (`end` releases the slot), label allow-list `['person','dog','cat','car']`, match `after.camera` to a `CameraFixture` via `frigateName ?? slugify(label)` (unmatched cameras **ignored**, never guessed), project `((box[0]+box[2])/2, box[3])` (bottom-center = foot-contact, coords already at detect res) through the homography. `Planner.camTargets` map keyed `cam_<cameraId>_<label>_<slot>` (max 3 slots/camera/label; assignment = exact event-id match → nearest existing slot within `CAM_MATCH_MM`=2500 mm (successor match across Frigate's event-id churn) → free slot → drop). Each key feeds a `cam_`-prefixed lerp slot (mirrors the `ble_` pattern in stepLerp — snap on first activation) so 2D + 3D read one smoothed source. Release = `type:'end'` for the event id OR `CAM_RETIRE_MS`=8 s without an update (pruned in the `camPeople` runtime getter, which also drops the lerp slot → renderer fades the rig).
- **Rendering**: three-view appends synthetic `TargetWorld` targets (origin flag `cam: true` — a DISTINCT flag from `ble` so despawn/labels behave; GOAL mode via the existing `_advanceBleGoal` posture — `goalMode = !!t.ble || !!t.cam`, advance gate `(t.ai||t.ble||t.cam)`) for `camPeople` on the current floor: `person` → humanoid (`'random'` pool), `dog`/`cat` → the matching quadruped default kind, **`car` → NO rig (2D dot only)**. Color = the owning camera's tint. 2D `drawCamTargets` (targets layer): tinted dot + a small 📷 badge; a fused cam target adopts the person color + initials chip + name label.
- **Fusion** (LANDED, clean): `_fuseIdentities` gathers cam targets (excluding `car`) into the SAME radar candidate pool (lerped world pos, key = the cam key, floorId) so a BLE person walking from the yard (camera-only) through the door (BLE/radar) carries one identity — the fused cam target then renders with the person's avatar/label (2D + 3D) exactly like a fused radar target. Only runs when BLE people exist (the early-return guard is upstream).
- Tests: `test-pages/homography-test.html` (`HOMOGRAPHY PASS 15/15` — exact 4-pt roundtrip + matrix-entry match, overdetermined 6-pt noisy residuals, collinear/<4/NaN → null, apply denom≈0 → null, detect-scale invariance) and `test-pages/frigate-target-test.html` (`FRIGATE PASS 30/30` — real Planner + fake HaApi with a subscribeMqtt relay surface, calibrated camera, faked `Date.now`: spawn/update/second-slot/handoff/end/8 s-timeout lifecycle, projection within tolerance, successor matching, false_positive/unmatched-camera/non-allowlist/malformed skips, car target). Bundle the planner via esbuild like config-test.

### Valetudo map overlay (phase 5, Batch M-C — SLAM room segmentation → floor overlay + clean-this-room)
Draws a robot vacuum's own Valetudo SLAM room segmentation as a translucent per-segment floor overlay (a "does my plan match reality" diagnostic), glows the room being cleaned, and lets you tap a room to send the vacuum there. Consumes `<valetudoNs>/+/MapData/map-data` + `.../StatusStateAttribute/{value,flag}` off the MQTT bridge (Batch M-A). Reuses each robot's EXISTING `posScale/posOffsetX/Y/posFlipY/posRotDeg` dock calibration for the map→plan transform (calibrate once via the vacuum editor's "Set dock as reference").
- **`src/valetudo-map.ts`** (pure/ZERO imports — geo.ts/trilateration.ts idiom; test transpiles it with `esbuild --bundle --format=esm`): `parseValetudoMap(json) → ParsedVacMap | null` (deterministic; extracts `pixelSize`, `size`, `metaData.nonce`, and every `type==='segment'` layer with a `metaData.segmentId` → `VacSegment {id, name, runs, pixelCount, bbox, centroidPx}`). **compressedPixels decode**: the flat array is `[xStart, y, count, …]` triples — each a HORIZONTAL run of `count` pixels starting at `(xStart, y)`; `pixels` (flat `[x,y,…]`) coalesces same-row adjacent pixels into runs (verified against Hypfer/Valetudo `MapLayer.js`). `decodeMapDataPayload(payloadString) → Promise<ParsedVacMap|null>` tries `JSON.parse` first (uncompressed sender / fixtures) then native `DecompressionStream` in order **`deflate` → `gzip` → `deflate-raw`** (Valetudo's backend zlib-deflates → the zlib-wrapped `'deflate'` wins; the string is reconstructed to bytes latin1-style since MQTT delivers binary as a string); unsupported browser / all-fail → null (quiet). `vacMapAffine(pixelSize, cal)` → the pixel→world affine `{A,B,C,D,E,F}` derived to be IDENTICAL to `geometry.vacuumRawToWorld({x:px·pixelSize, y:py·pixelSize}, cal)` (so 2D + 3D + hit-test all line up); `vacPixelToWorld` / `vacWorldToPixel` (inverse, for hit-testing) / `vacSegHasPixel`. `cleanSegmentPayload(id)` → the clean/set JSON (see below). `vacSegColor(i)` = a 15-hue palette.
- **Types**: `RobotFixture.valetudoId?` (the topic identifier segment; vacuum-only sidebar input). `Layers2D.vacuumMap?` — DEFAULT **OFF** (absent = off, like `activity`); the sidebar `isOn` + 2D `drawAll` (`L.vacuumMap === true`) + 3D `setLayerVisibility` (`v.vacuumMap === true`) all special-case it.
- **Planner** (runtime-only, never persisted): `vacuumMaps` / `vacuumMapRev` (monotonic revision → dirty key + 3D texture disposal) / `vacuumStatus` (`{value, flag}`) / `lastCommandedSegments`, all keyed by robot id. `ensureVacuumSubs()` (called from `_reconfigureMqtt`) registers **wildcard** subscriptions per namespace (`<ns>/+/MapData/map-data`, `.../StatusStateAttribute/value`, `.../flag`) ONCE — NOT per robot id (research §6) — so adding a robot / editing `valetudoId` needs no re-subscribe; inbound topics resolve to a `RobotFixture` at message time (`_robotForVacTopic`). `_onVacMapData` decodes async, stores + bumps the revision (skipping same-nonce republishes), `emitConfig`s. `vacuumGlowSegments(robotId)` → the glow set: `value==='cleaning' && flag==='segment'` → the `lastCommandedSegments` ids, else cleaning-without-known-segments → ALL segments (soft glow), else null. `cleanVacuumSegment(robot, segId)` publishes `<ns>/<valetudoId>/MapSegmentationCapability/clean/set` (view mode refused) + records `lastCommandedSegments`. New `mqttPublish(topic, payload, retain?)` fire-and-forget wrapper.
- **Publish payload** (`cleanSegmentPayload`): `{"segment_ids":["<id>"],"iterations":1,"customOrder":false}` — Valetudo's `MapSegmentationCapabilityMqttHandle` requires a `segment_ids` string array (iterations/customOrder optional; the explicit full shape is sent so a strict handler never rejects).
- **Rendering** (groundAreas idiom): **2D** `drawVacuumMaps` (canvas-render, gated `L.vacuumMap === true`, drawn as floor paint under walls) — per-segment tinted offscreen canvas cached by `<robotId>:<rev>:<segId>` (built once per map revision, NEVER re-tinted per frame), drawn via a `setTransform` composing the pixel→world affine with the view + a centroid name label; glow = draw-time `globalAlpha` pulse (RAF). **3D** `updateVacuumMaps` (three-renderer, `_vacMapGroup` at y≈6, under `_keyVacMap` = configRev|layer|per-robot rev+cal+glow) — one translucent quad per segment (4 world corners from the segment bbox affine + a `CanvasTexture` of the tinted raster, `flipY=false`, Nearest) + a camera-facing name sprite; glowing segment materials collected into `_vacGlowMats` and opacity-pulsed each frame in `_advanceVacMap`. CanvasTextures are NOT freed by `_clearGroup` (same as sprite maps) — `_clearVacMap` disposes them explicitly (probe `vacMapTexDisposals`) on every rebuild/floor-switch/destroy.
- **Tap-to-clean**: 2D `hitVacuumSegment` (canvas-hit — world→pixel inverse affine then `vacSegHasPixel`) wired LOW-priority in `onCanvasClick` (kiosk branch after all fixtures; edit + select after the placement latches — draggable fixtures start a drag so their click is swallowed by `dragJustEnded` and never reaches it) via `tryVacuumSegmentClean` (gated on the layer being on, `confirm()` then `cleanVacuumSegment`). 3D: patches carry `userData.kind='vacseg'`; a dedicated `_raycastVacSeg` + `onVacSegClick` (kept OUT of the shared fixture-click union) fires only when `_raycastFixture` misses. Renders + taps in kiosk too; view refuses.
- **Sidebar**: the vacuum editor gains a "Valetudo room map" block (topic-id input + helper copy pointing at the MQTT bridge + the shared map calibration). The layer list gains "Vacuum room map".
- Test: `test-pages/valetudo-map-test.html` (`VALETUDO PASS 32/32` — uncompressed 2-segment fixture: parse counts/names/bbox/centroid, `compressedPixels`-run raster hits, transform-through-known-cal centroid == `vacuumRawToWorld` + inverse roundtrip + rot/flip consistency, async plain-JSON decode + garbage→null, publish payload shape via a fake bridge, renderer layer-flag gating both directions, glow only on the commanded segment, texture-dispose-count bump on map-revision rebuild, glow opacity pulse). Bundle `valetudo-map.ts` + `geometry.ts` via esbuild, import the built renderer for the 3D assertions.

### Mobile / robustness
- `touchAction: 'none'` on both 2D and 3D canvases so default touch gestures don't fight orbit / pan.
- DPR cap of 2 in the 3D renderer to keep iPad / tablet frame rates sane.
- `webglcontextlost` listener prevents iOS Safari blackouts.
- 2D canvas RAF and 3D `_tickOnce` are wrapped in `try/catch`; the next frame is scheduled **before** the work, so one bad frame can't pause the loop and leave stale meshes / pixels visible.

## Conventions

- All length units are **mm**. Time units mostly seconds. HA may report distances in user-locale units; the panel's `Planner.stateMm(entityId, nativeToMM)` normalizes via `attributes.unit_of_measurement`.
- World floor frame: `+X` right, `+Y` up. Canvas Y is flipped so world `+Y` is screen-up.
- 3D renderer mirrors X (`_w(wx, wy, h) = (fw/2 − wx, h, wy − fd/2)`) so screen-right matches 2D world `+X` regardless of camera azimuth. **Local +Z = world +Y** — that's where furniture backrests / headboards live and where humanoid faces / toes point.
- Custom element prefix is `diorama-*`. CSS `floor-planner-*` selectors do not exist anymore.
- User-facing copy calls positional radar sensors **"mmWave"** (tool button, sidebar section, Cov tooltip) to distinguish them from binary motion sensors. LD2450-specific naming survives only where it's hardware-derived: entity slugs / prefixes in `sensor-discovery.ts` and firmware entity conventions.

## Color helpers (`geometry.ts`)

- `hexToRgb(hex)` / `hexToRgba(hex, a)` / `hexToInt(hex)` — parse `#rgb` or `#rrggbb`.
- `lighten(hex, t)` — returns a **hex** (not `rgb(...)`) lightened toward white by factor `t`. Returning hex matters because callers feed the result back into `hexToRgba` / `hexToInt`.
- `motionColor(m)` / `motionIntensity(m)` / `sensorColor(s, idx)` / `lightIconKind(l)` / `furnitureKind(f)` / `furnitureDef(f)` — per-element default-aware getters.

## Common gotchas

- Vite ^8 needs Node 20.19+ or 22.12+. On older Node, pin `vite: ^6.x` and add an `overrides.esbuild: ^0.25.x` to close the dev-server CVE.
- Build has **two entries** (`index.html` + `src/panel.ts` → `diorama-panel.js` at dist root). Don't collapse `rollupOptions.input` back to a single entry — panel_custom mode loads `diorama-panel.js` directly.
- Output filenames are deliberately **stable / unhashed** (`entryFileNames` / `chunkFileNames` / `assetFileNames` in `vite.config.ts`). HA + browsers cache module URLs aggressively; with content hashes, a cached `diorama-panel.js` imports a chunk filename that no longer exists after redeploy → "Unable to load custom panel". Don't reintroduce `[hash]`.
- Stable filenames alone allowed **mixed-version module graphs**: the browser could pair a fresh `app.js` with a stale cached `assets/three-renderer.js` across the lazy dynamic import. This bit for real: removing `speed` from `TargetWorld` made a stale renderer compute `Math.abs(undefined)` → `h.phase = NaN` → humanoid limbs (whose joint rotations went NaN) vanished while head/torso kept rendering. The `chunkVersionQuery` plugin in `vite.config.ts` now appends a per-build `?v=` query to every chunk import specifier + index.html src/preload, pinning each build's graph together. Keep it when touching the build config, and don't assume interface changes across the app ↔ three-renderer boundary are safe without it. Flip side: a STALE entry + fresh renderer chunk can load a SECOND app.js instance (different ?v= = different module identity) whose re-run element registrations threw on iOS — all `customElement` registrations therefore go through `src/ui/define.ts` (idempotent; first definition wins). Never import `customElement` from `lit/decorators.js` directly.
- Never add an npm dependency literally named `node` — it downloads a full Node.js binary into node_modules (this happened once).
- Three.js scene rebuilds MUST go through `_clearGroup` (disposes geometry + materials); raw `g.remove(child)` leaks WebGL buffers and eventually freezes the tab on view switch.
- Adding HA-side props to a fixture (e.g. light radius) → also update the 2D / 3D renderers to actually use the field, not just the type.
- Adding a new `LightIconKind`: extend `LIGHT_GLYPH` in `canvas-render.ts`, the `switch (kind)` block in `three-renderer.ts.updateLightsSwitches` (build the body + decide whether to keep the floor disc), and `LIGHT_KINDS` in `sidebar.ts` (UI selector).
- Adding a new `FurnitureKind`: extend `FURNITURE_KINDS` in `geometry.ts`, the `switch (kind)` block in `canvas-render.ts.drawFurniturePrimitive`, and the `switch (kind)` block in `three-renderer.ts._buildFurniture`. Stairs-family membership goes through `STAIRS_KINDS`/`isStairsKind` (a type guard — the canonical test; never re-introduce literal kind lists). The sidebar dropdown enumerates `Object.keys(FURNITURE_KINDS)` so it's automatic — EXCEPT a **new `cat`** (e.g. `vehicle`) also needs a `FurnitureCat` union member + a `_kindOptions` optgroup entry in `sidebar.ts` (else its kinds silently don't surface), and if its bound state drives the 3D build it must be added to the three-view appliance-state-hash predicate (alongside `cat==='appliance' || isBinKind || isSpeakerKind || isVehicleKind || …`) or `_keyFloor` won't rebuild on a state change. Item-level binding fields on `Furniture` need no `repairFloor`; new bound ids that should refresh the sidebar go into `Planner._isSlowEntity` (config-path).
- Adding a canvas fixture (mirror the **motion-sensor / BLE-proxy** flow): types → geometry defaults → `canvas-render` draw + `drawAll` gating → `canvas-hit` hit test → `canvas-interact` (mousedown/move/up drag case + place-tool + delete-tool + cursor) → sidebar section + `TOOLS` entry + tool hint → three-renderer group (declared, added to `scene.add`, `clearTransientGroups`, `destroy`, `setLayerVisibility`) + `update*` builder → three-view dirty key. BLE proxies ride the existing `sensors` layer instead of owning one.
- `HaApi` additions must land in **both** `HassClient` and `HassPanelAdapter` (panel adapter goes through `hass.connection.sendMessagePromise`). Extend the shared return types in `ha-client.ts` (`HaDevice` / `HaEntityReg`) additively.
- When changing the rotation convention or the body-forward axis of the humanoid, **also** flip the limb-rotation signs and the body `atan2` argument signs together — they're coupled.
- Local-storage migration is **not** in place: changing the `diorama:store:v1` key, or the HA `frontend.user_data` key (`diorama`), would orphan existing data. Bump version + migrate, or get user buy-in.
- `Planner._loadFromHa` reconstructs the store from an **explicit field list** — any new top-level `Store` field MUST be added there or it silently resets on every load (this happened to `scene3d` for a while). Same for new per-floor fields in `repairFloor`.
- `lighten()` returns hex on purpose — earlier it returned `rgb(...)` and broke callers that piped its output back through `hexToRgba`. Don't change it back without auditing every call site.
- Light bodies in 3D are now `THREE.Group`s (multi-mesh per kind). Raycaster must use `intersectObjects(_lightGroup.children, true)` (recursive) and walk parents to find `userData`. Reverting to `false` will silently break click-toggle on lamp / pendant / fireplace / spot / sconce / strip.
- LD2450 firmware-side gotchas (vertex (0,0) sentinel, max 8 verts, max 3 zones / 3 objects, hardware vs software zone filter) still apply on the firmware side — see that repo.
