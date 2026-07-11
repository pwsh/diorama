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
lives in `docs/DESIGN-sims.md`. The next arc (BLE identity/trilateration, GPS
geo-calibration, weather) is planned in `docs/DESIGN-world.md`. Deterministic renderer test pages (the
verification harness) live in `test-pages/` (see its README).

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
- **Rendering method**: the Sims toon path (see "Sims-style rendering" above) — `_mat()` `MeshToonMaterial` factory + shared gradient map, `NoToneMapping`, no `scene.environment`, blob-shadow decals, inverted-hull outlines. There is NO PBR / PMREM / tone-mapping path anymore; preset light levels in `applyScenePreset` are tuned so a strong directional sun makes the toon bands read.
- **Glass house & wall cutaway** (`Scene3D.glassHouse` / `Scene3D.wallCutaway`, ride the whole-object scene3d persistence): `updateGhostFloors(floors, currentId, scene3d, customObjects)` stacks every non-active floor as a translucent shell (slab 0.30 / walls 0.15 / furniture boxes 0.18, STORY_H = 3000 mm, each ghost centered using its OWN w/d — never `_w`, which reads the active floor's dims) into `_ghostGroup` under the `_keyGhost` dirty key. Wall cutaway defaults ON (`!== false`): solid wall pieces are tagged `userData.wallCut` + `baseOpacity` at build, collected into `_cutawayWalls`/`_cutawayGhostWalls`, and `_updateWallCutaway()` (per frame from `_animate`) fades foreground walls to 0.06 — predicate: camera on the wall's outward side AND wall roughly between camera and floor center, with an overhead guard so top views hide nothing. Toggles: 🏠 button in the 3D bar + 3D Scene sidebar checkboxes.
- **Target pathfinding** (all renderer-internal): `_buildNav` (end of `updateFloor`) rasterizes a 150 mm nav grid — furniture footprints inflated by `PERSON_R = 170` block (rugs/stairs/BEDS/`elevation ≥ 300` don't — beds are occupiable), solid wall runs block, door/window openings stay walkable — then flood-fills free cells into connectivity **regions** (`_nav.region`). All snap/retarget searches are region-aware (`_nearestFreeCellInRegion`) so avatars never land on the far side of a wall; a goal unreachable for >3 s (`h.stuckT`) fast-fades the rig and respawns it in the goal's region (same key). Movement is a **carrot-chaser**: the carrot walks the A*-string-pulled polyline by arc-length (the carrot IS the pathfinding walker); `navX/navZ` chase it with a critically damped spring (`nvx/nvz`, ω = 9, substepped ω·h ≤ 0.36 — same divergence gotcha as stepLerp). **Two speeds**: `navSpeed` (nav deltas) drives gait/facing; `rawSpeed` (raw radar deltas) drives sit/activity/bubble triggers — don't cross them. Anchored rigs (`sit/act/lie > 0.3`) bypass nav; pairwise separation holds figures ~380 mm apart (skips lying rigs). 2D dots stay raw radar truth.
- **Despawn modes**: `TargetWorld.edge` (computed in three-view from sensor-local coords: near range/fov boundary) picks the mode when a target vanishes — `fast` (~0.4 s scale-out, walked out of coverage with velocity) vs `slow` (10 s opacity fade, scale held; per-rig outline-material CLONES make the fade possible — the shared `_outlineMaterial` must never be mutated per rig). Re-acquire mid-fade restores.
- **Lying in bed**: solo occupant settled >2 s → `h.lie` blend: root pitch +π/2 (face up), yaw toward the headboard, y = mattress top; plumbob hidden, bubble repinned in world space. `Furniture.sharedBedCovers === false` disables the two-person blanket (both occupants lie side by side instead); sidebar checkbox on bed pieces.
- **AI avatars** (`MotionSensor.avatar` + bound entity on): three-view appends synthetic targets (`key: 'ai_<id>'`, `TargetWorld.ai`); a renderer-side controller owns a virtual raw position walking A*-verified goals (WANDER → IDLE 4–15 s → ENGAGED 20–45 s when sit/activity/lie captures it). Goals are **hard-confined to the sensor's home room** — the closed wall loop containing the sensor (`_aiHomeLoop` on `_wallLoops`, cached in `updateFloor`; spawn/goal snapping via `_nearestFreeCellInLoop`) — because a simple presence sensor only vouches for its own room; sensors outside every loop roam their nav region. Radar targets from positional (mmWave) sensors are never confined — they follow the radar into adjacent rooms. Everything downstream (nav, dwell, activities, bubbles, despawn fade) treats the AI position as radar truth.
- **BLE trilaterated people** (World Outside arc, Feature B — `MotionSensor`-style but from Bermuda BLE distances, not radar): the solver `src/trilateration.ts` (pure, deterministic; test page `test-pages/trilateration.html`) runs weighted Gauss-Newton on ring residuals `d_i = ‖p − p_i‖` (mm), weight `w_i/(d_i+1000)²` where `w_i` is a linear staleness decay; warm-started, step-clamped ≤1500 mm/iter, ≤8 iters, Levenberg-damped so collinear proxies don't blow up. Degenerate: 2 fresh proxies → distance-ratio point on the segment; 1 → constraint-only (hold last position, confidence = the ring). `Planner` tracks the latest distance per (device × scanner) from `state_changed` for the entities in `Planner.bermuda` (LIVE path only — never slow/config; `stateMm`-normalized, dropped >30 s), re-solves per FLOOR on new samples (~0.1 Hz, `_solveBle` — proxies via scanner-link `proxyId` → `BleProxy`), and picks the floor with the best weighted RMS (gn > segment > single). Identity: a `Store.people` entry with `bermudaDeviceId === device.deviceId`, else "unknown" (rendered only when `Store.bleShowUnknown !== false`). `Planner.blePeople` (runtime getter; feeds a per-device lerp slot `ble_<deviceKey>` so 2D dots and 3D rigs read one smoothed source; retires devices unheard-from >120 s). three-view appends synthetic targets (`key: 'ble_<deviceKey>'`, `TargetWorld.ble`) for people on the current floor; the renderer's AI controller runs them in **GOAL mode** (`AiState.mode`) — `_advanceBleGoal` A*-replans (`_bleReplan`) when the solve jumps >400 mm and carrot-walks the rig there at human speed, idling when close (dwell systems may capture it — sitting near the fix is GOOD). No random wander, NO room confinement (real device). 2D: person-colored dot + initials chip + faint confidence circle (`canvas-render.drawBlePeople`, `targets` layer). Renderer smoke test: `test-pages/ble-walk-test.html`.
- **Idle fidgets** (all rigs, when `sit/act/lie < 0.1` + dwell): ambient look-around yaw wobble + weight-shift sway, a picker rotating stretch / phone-check every 8–20 s, and a wave-on-spawn one-shot. Anchor activities `browse_bookshelf` / `tend_plant` ride the standard activity tier.
- **Auto-follow camera** (`Scene3D.autoFollow`, 🎥 button + sidebar checkbox): per-frame in `_animate`, eases the camera (τ ≈ 1.2 s, current azimuth kept, elevation → ~35°) to frame the bbox of active rigs — one cluster = tight, spread figures = wide, none = full-floor sims pose. Manual orbit pauses it 6 s (OrbitControls start/end).
- **Camera views**: renderer exposes `cameraView()` / `setCameraView(pos, target)` / `applyViewPreset('iso'|'top'|'front'|'back'|'left'|'right'|'sims')` (framed to floor extents). The three-view overlay buttons apply them; 💾 saves the current pose into `Store.views3d` (global, scene coords). **Sims cam**: `applyViewPreset('sims')` frames a dimetric pose (45° azimuth, elevation `atan(1/√2)`≈35.26°, distance `max(fw,fd)*1.35`, target `y≈600`). `setSimsCam(on)` toggles azimuth snapping: a single OrbitControls `'end'` listener (registered at init, gated on the `_simsCam` flag) sets `_snapAzimuth` to the nearest 45°, and `_animate` eases the camera about the target toward it (cleared within ~0.5°). Only azimuth snaps — polar/zoom stay free. The three-view "💎 Sims" button applies the preset + enables snap on first click, disables on the next (runtime-only, `_simsCamOn`; not persisted).

### Geo reference & GPS device pins (World Outside, Feature G)
Landmarks (`Store.geo.landmarks`, property-wide/store-level — NOT per-floor) are placed on the plan and calibrated to real-world lat/lon (`src/geo.ts` pure math: equirectangular projection, 2D Procrustes fit scale-locked at 1 + `fittedScale` diagnostic, single-landmark `northDeg` path, median lat/lon; test page `geo-test.html`). `Planner.geoFit()` returns the fitted `GeoTransform` (+ calibrated landmark list). **GPS device pins (G2)**: `Planner.gpsPins` (runtime getter, cheap, safe per frame) resolves each `Store.people` entry with a GPS source (prefer `person.*` via `haPersonId`, else `device_tracker.*` via `gpsTrackerId`) — reads `latitude`/`longitude`/`gps_accuracy` off the entity, projects via `latLonToPlan`, and classifies vs the CURRENT floor rect:
- `indoor` — inside `0..fw × 0..fd` (GPS indoors is tens of metres off → the pin is a "find my phone" hint, drawn dimmed with a `~±N m indoors` caution, not a placement).
- `yard` — within that rect inflated by `geo.boundaryM` (default 30 m); drawn at true position with an accuracy ring (capped at the boundary so a huge ±m circle can't blow up).
- `beyond` — outside the boundary; `clampToBoundary(fw, fd, boundaryMm, x, y)` (pure helper in geo.ts) clamps to the inflated-rect edge along the ray from the floor **centre**, keeping the true compass bearing (`planBearingDeg(thetaRad, dx, dy)` — inverse-rotates the plan vector into geo E/N; `compass8` for the label) + distance in m for the `Name · 320 m NE` label.

`stale` from the entity's `last_updated` (>15 min). Bound GPS source ids are **config-path** (`_isSlowEntity` returns true for a person's `haPersonId`/`gpsTrackerId`) so the sidebar GPS status re-renders on a new fix (GPS pushes are minutes apart — negligible churn); the 2D canvas RAF reads `gpsPins` live regardless. **2D** (`canvas-render.drawGpsPins`, gated `on(L.geo)`, drawn with landmarks): person-colored teardrop + initials, accuracy ring (not for `beyond`), indoor/stale dimming, age caption. **3D**: camera-facing text sprites in `_gpsGroup` (`updateGpsPins(pins, landmarks)`, reuses `_makeTextSprite`) — GPS pins at `y≈1800` (yard true pos / boundary edge for `beyond`), landmark 📍 sprites near ground; **sprites need `_disposeSpriteMaps` before `_clearGroup`** (same gotcha as env). Dirty key `_keyGps` in three-view: `configRev` + coarse hash (positions rounded to 500 mm + zone + stale) + `layers.geo`; `_gpsGroup.visible` folds into `setLayerVisibility`. The floor rect does NOT grow — `beyond` pins clamp to the ring, `yard` pins render over the void outside the slab (design: no yard slab in v1). Pins render in kiosk/view modes too (display, not editing). Test page `gps-test.html`.

### 3D weather effects (World Outside, Feature W — phase W2)
Outdoor effects driven by `Planner.weatherNow` (W1). three-view's `_weatherFxState(layers)` shapes a `WeatherFxState` (`condition`, `intensity01`, `windKmh`, `windBearingPlanRad`, `isDay`) — effects are live only when `layers.weatherFx !== false` **and** `weather.effects3d !== false` **and** a live `weatherNow` exists (else a no-effect `sunny` state clears everything). `conditionIntensity(condition)` in `weather.ts` (pure, testable) maps condition → 0..1 (pouring/hail 1.0, lightning-rainy 0.8, windy 0.65, lightning 0.6, rainy/snowy/snowy-rainy 0.55, fog 0.5, clear/cloudy/exceptional 0, unknown 0.4). Wind bearing (meteorological FROM-degrees) → plan frame: three-view maps `bearing+180` (blow-toward) through the geo transform θ (`geoFit().transform.thetaRad` when `quality !== 'none'`, else 0 = plan-north-relative).

- **Renderer** `_weatherGroup` + `updateWeather(fx)`: rebuilt only under three-view's `_keyWeather` (`configRev|floorId|condition|round(intensity·4)|windBucket|weatherFx-flag`). Per-frame motion is `_advanceWeather(dt, nowS)` called every frame from `_animate` — **zero allocation after build**: it mutates each cloud's `position` buffer in place (`needsUpdate = true`), never reallocates.
- **Precipitation** — ONE `THREE.Points` cloud per precip type (`_buildPrecipCloud`): count `600 + intensity·1900` (dust `40 + intensity·80`), **DPR-capped ×0.6 on hi-density displays** (retina/iPad, `min(devicePixelRatio,2) >= 2`); spawn box = floor bbox inflated 6 m, vertical **recycle band 0..4000 mm** (fall subtracts, `< 0` adds 4000); horizontal wind drift + snow/dust sinusoidal wobble, wrapped in the spawn box so drift never walks the cloud off-screen. Rain = streak texture (fast), snow = soft round flake (slow + wobble), hail = small hard dot (fast), `snowy-rainy` = one rain + one snow cloud at half counts each, `windy`/`windy-variant` = drifting dust (no fall).
- **Fog** — scene-level `FogExp2` (target density `0.00018`) **eased in/out over ~2 s** in `_advanceWeather` (τ ≈ 2 s; nulled below `1e-5` when leaving — never a pop) + two large translucent ground planes (via `_mat`) scrolling in opposite directions outside the walls.
- **Lightning** (`lightning`/`lightning-rainy`) — a dedicated flash `DirectionalLight` (intensity 0 at rest, `_buildFlash`), pulsed every 8–25 s with a **double-flash decay envelope** (pure function of age-since-strike; only the gap uses `Math.random()`, the fireplace-flicker idiom). Peak ~6.5 at night / ~2.2 by day. NO audio (permanent decision).
- **Lighting modulation** (`weather.affectLighting !== false`): `resolveScenePreset(sc, states, weather?)` — the **single** mechanism is a day→dusk preset DOWNGRADE for overcast/precip/fog/lightning conditions (`WEATHER_DIM_CONDITIONS`); night/dusk/partlycloudy/clear stay put. three-view's `_effectivePreset` passes the weather mod, so the dim already folds into `_keyFloor` — no new dirty key.
- **Materials**: `PointsMaterial` / `SpriteMaterial` are the documented **exemption** from the `_mat` toon factory (billboarded point sprites, not lit surfaces — flat color + a tiny `CanvasTexture`). Shared particle/fog maps (`_rainTex`/`_snowTex`/`_hailTex`/`_dustTex`/`_fogPlaneTex`) are built once and disposed only in `destroy()` (like the gradient/blob maps); `_clearWeather` tears the group down via `_clearGroup` (which disposes Points geometry + material but NOT the shared maps) and resets the tracking lists. Weather resets on floor switch (spawn box refits). Test page `weather-fx-test.html` (`?c=pouring|fog|lightning|sunny`).

### UI modes (edit / kiosk / view) & URL templates
`Planner.uiMode` (runtime + URL only, never persisted): `edit` (default), `kiosk` (views + device interaction, no editing), `view` (no interaction either). Enforcement layers: `Planner.save()` **no-ops outside edit** (kiosk devices must never write back — not even localStorage), `toggleEntity` refuses in view mode, `onCanvasMouseDown` returns early outside edit (no drags/selections), `onCanvasClick`/`onCanvasDblClick` have kiosk branches (toggle / light-config only), tool + Delete hotkeys are edit-only, and the sidebar / floor buttons / settings / save-view buttons render only in edit. URL params parsed in `app._applyUrlParams`: `mode`, `lock=1` (sets `uiModeLocked`, hides the switcher), `view`, `floor`, `layers` (preset name/id or `simple`/`full`), `view3d` (saved view name/id), `cam=x,y,z,tx,ty,tz`. Floor/layers apply via retry-on-config (store loads async, 20 s window, then defaults stand); `view3d`/`cam` apply in `three-view._applyUrlTemplate` (15 s, then iso fallback). `Planner.lastCam3d` is refreshed each 3D tick so the topbar "Kiosk link" button can mint a `cam=` URL.

### Device-local view + touch guards
`Planner.view` defaults from `localStorage['diorama:view']` (written in `setView`, try/catch-guarded) so a tablet reopens in its last 2D/3D view; the `?view=` URL param still wins. Both canvases stop touch propagation so two-finger gestures can't open HA's drawer — EXCEPT touches starting within 24 px of the left window edge (intentional edge-swipes still open the sidebar). The latch is per-gesture: set at touchstart only if every point clears the edge.

### View layers & presets (2D + 3D)
`Store.layers2d` (`Layers2D`) gates `drawAll` per layer and the 3D scene: group-scoped layers (lights/sensors/motion/env/zones/targets/geo/weatherFx) flip `group.visible` each tick via `renderer.setLayerVisibility` (hidden lights also stop being raycast click targets; `weatherFx` off also hides the effect group + stops its per-frame particle motion); `furniture` + `bg` + `labels` (room-name labels; hiding them keeps `_roomZones` alive for activity/TV room resolution) are gated at build time inside `updateFloor` (they live in `_floorGroup`) and are part of `_keyFloor`. Hiding furniture also removes sit spots, terrain, and stairwell floor holes. 2D: gates `drawAll` per layer (bg, furniture, labels, lights, sensors, motion, env, zones, targets — absent = on) plus `activity` (default OFF): glow pools where lights are ON / motion is firing, so the built-in "Simple floorplan" preset (everything off + targets + activity) still shows living rooms. Walls/doors/windows always draw. User presets persist in `Store.layerPresets2d`; sidebar "2D Layers" section.

### Item locking
Every placeable (walls, mmWave sensors, motion, env, furniture, lights, switches, doors, windows) has `locked?: boolean`. Guards live in canvas-interact's mousemove drag cases (`item && !item.locked`) and the delete-tool branches — locked items can't be moved/rotated/resized/deleted **on the canvas**, but sidebar editing (incl. the 🔒 toggle via `_lockRow`) still works, and click-to-toggle on locked fixtures stays live. Walls have a bulk lock/unlock button in the tools area (no per-wall editor exists).

### Wall kinds & clipped floor
`Wall.kind` (`WallKind`): `full` (2743 mm / 9 ft, default), `half` (1372), `railing` (914 / 3 ft — posts + top/bottom rails + balusters in 3D, thin line + ticks in 2D), `invisible` (renders as a faint dashed 2D line, nothing in 3D). New walls take `planner.pendingWallKind` (picker appears in the tools area when the Wall tool is active); double-clicking a wall body in Select mode cycles the kind. The 3D floor is **clipped to closed wall loops**: `closedWallLoops` (geometry.ts) traces self-closed polylines plus chains stitched at exactly-equal endpoints (welding guarantees exactness) — each loop becomes a `ShapeGeometry` floor patch (texture repeat 1/800 to match the plane path's mm scale). Invisible walls count toward loops — that's their purpose (close a floor region without drawing a wall). No closed loops → classic full-rectangle floor.

### Wall openings (doors / windows)
Doors and windows **snap onto the nearest wall** on drop and on move-release (`snapOpeningToWall`, ≤500 mm: position lands on the wall axis, rotation aligns to the segment keeping the nearer of the two directions so the hinge side survives). `wallCutsForSegment` (geometry.ts) computes the solid sub-intervals of each wall segment minus door/window spans — note a door's (x, y) is its **hinge**, so its span center is offset via `doorSpanCenter`. 2D strokes only the solid intervals (visible breaks); 3D builds solid runs full-height (walls are 2743 mm ≈ 9 ft), windows get a sill (0–900) + header (1700→top), doors get a lintel (2050→top) above the 2000 mm panel. Open door/window panels swing/tilt out of a real gap.

### Wall endpoint welding
`connectWallEnds` (canvas-interact) welds a wall's endpoints within 250 mm onto other unlocked walls — endpoint-to-endpoint (corner joins, preferred) or onto the closest point anywhere along a segment (T-junctions), plus a wall's own far endpoint (closing room loops). Runs after vertex drags and draw-finish (per-endpoint weld) and after whole-wall moves (single-delta translate so the shape isn't distorted). Welding wins over the 15° angle snap at connection points.

### Imported 3D model (Sweet Home 3D)
`Floor.model3d` (`Model3D`) holds placement metadata only (name, rev, scale mm/unit, x/y offset, rotation, opacity, visible). The OBJ/MTL **text lives in IndexedDB** (`model-store.ts`, db `diorama-models`) keyed by floor id — multi-MB exports don't fit HA user_data or localStorage. `three-view._syncModel` loads text async when `rev` changes and calls `updateModel3D`. SH3D exports **cm with Y-up**; default scale 10 mm/unit. The renderer scales X and Z by `-scale` (double mirror, determinant positive) to line up with the 2D plan. Re-import per browser; placement syncs via HA.

### HA = source of truth (storage)
The store is persisted via HA's `frontend.user_data` table under the key `diorama` (the same WS commands HA's own UI uses for sidebar order / theme prefs). `localStorage` (`diorama:store:v1`) is the local cache — paints instantly on load, then reconciles with HA after auth. Saves are debounced 600 ms before the HA push so rapid edits don't hammer the WS.

Connection settings (URL + token) use `diorama:url` / `diorama:token` in localStorage.

### Sync on bind
`Planner.bindSensor(sensorId, deviceSlug)` runs discovery + `_syncZonesObjects` immediately and schedules retries at 500 ms / 2 s / 5 s. Each retry calls `disc.invalidate()` first so any entities ESPHome pushes after the initial `get_states` snapshot get picked up. The sidebar binding dropdown calls this — zones / objects load without a manual click.

### Local visual occupancy
Inclusion-zone glow and object-halo glow are computed locally in `canvas-render.ts` from the lerped target positions (point-in-polygon / radius test), **not** from HA's `target_count` / `*_halo_occupied`. Reason: HA's WS push order can race target X/Y updates with count updates, briefly highlighting a zone before the dot has moved. Local testing keeps the glow in sync with what the user sees. The HA-derived counts are still kept on `z.targetCount` for numeric labels.

### Entity picker
`<diorama-entity-picker>` pulls HA's `config/device_registry/list` + `config/entity_registry/list` on first open. Lets the user filter by domain (default to the appropriate one for the call site, e.g. `binary_sensor` for motion, `light` for light fixtures), filter by HA device, or search by entity / friendly / device name. Each row shows the parent device name as a subtitle.

### Toggle dispatch
`Planner.toggleEntity(entity_id)` reads the domain from the entity_id and calls the matching `<domain>.toggle` (with `homeassistant.toggle` as fallback). This means a "switch" fixture bound to `light.foo` calls `light.toggle`, not `switch.toggle`. `Planner.isLightEntity(entity_id)` is the boolean used by sidebar + dblclick handlers to decide whether to offer the LightConfig modal (color/brightness/temp).

### 2D pan / zoom
`Planner.viewCenter` (mm in world frame) and `Planner.zoom` are runtime state, not persisted. `computeView(canvas, fw, fd, viewCenter, zoom)` derives the actual `View` (`ox`, `oy`, `scale`). Wheel zooms anchored at cursor. Middle/right-mouse OR Space+left pans. Two-finger touch pinches and pans. `Ctrl/Cmd+0` or the bottom-left "⟳ Reset view" button resets. View is also reset on floor switch (so a stale center from another floor's coord space doesn't leave the new floor offscreen).

### 3D fixture click
`<diorama-three-view>` registers `click` and `dblclick` on the WebGL canvas. The renderer raycasts into `_lightGroup.children` **recursively** (light bodies are now `THREE.Group`s containing per-kind sub-meshes — pendant stem + sphere, lamp pole + shade + bulb, etc.). The hit-walker climbs parents to find the first ancestor with `userData.kind === 'light' | 'switch'`. Click → `planner.toggleEntity`. Dblclick on a `light.*` entity → light config modal; dblclick on unbound → entity picker. Both light **body** and **floor disc** carry the same `userData`, so a click anywhere in the lit pool toggles the light.

### 3D fixture rendering with user-set props
- **Light**: `lightHeight(l)` (mm above floor, default 2500), `lightRadius(l)` (floor-pool size, default 900), `lightIntensity(l)` (0..2 multiplier on HA brightness, default 1), `lightIconKind(l)` (default `'bulb'`). All adjustable per-fixture in the sidebar editor.
- **Light icon kinds** (`LightIconKind` in `types.ts`):
  - `bulb` — single ceiling sphere (default).
  - `spot` — cone tip-up at `lightHeight`, opens downward.
  - `pendant` — sphere on a stem hanging from the ceiling. Group origin sits at the bulb's hang height; stem reaches up to `lightHeight`.
  - `sconce` — half-sphere mounted at `lightHeight`. **Skips the floor disc** since it lights walls, not the floor below.
  - `strip` — long thin LED bar.
  - `fireplace` — hearth slab at floor level with an inner glow box. Forces warm orange-red regardless of HA color, plus per-frame `Math.random()` flicker on emissive intensity, point-light intensity, and floor-pool opacity. Cheap because the renderer rebuilds every tick.
  - `lamp` — floor lamp: pole + base disc + cone shade + bulb. `lightHeight` ≈ pole height.
- **Switch**: `switchHeight(s)` (default 1200), `switchRotation(s)` (deg, 0 = +Y world, default 0). Box mesh rotated to match.
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

Beyond the classics above there are casework kinds (coffee_table, tv_stand, dresser, nightstand, wardrobe, ottoman, stool, plant, counter, island, cabinet), **appliances** (fridge, stove, dishwasher, washer, dryer, microwave, tv — `cat: 'appliance'`, spec-sheet default sizes), **bathroom** kinds (toilet, sink, bathtub, shower — `cat: 'bathroom'`), and **countertop/fitness** kinds (`coffee_maker`, `toaster` — `mountable`; `exercise_equipment`). `furnitureCat(def)` groups the sidebar kind dropdowns into optgroups. A def with `seat` set is **sittable** (humanoid seating anchors — see below).

`FurnitureKindDef` (geometry.ts) carries the Sims metadata: `activity?` (`ActivityKind` this piece anchors — see "Activity system"), `surface?` (counter-height top other pieces can sit ON), `mountable?` (sits on a surface piece, not the floor), `frontArrow?` (show the 2D front chevron on select; default on, off on symmetric kinds). **Mountable auto-snap**: dropping/moving a mountable piece near a `surface` host lands it on the top (`elevation` = host top; `mountOnId` bookkeeping only — NOT live-parented, so moving the host later needs a re-drag). The 2D front **chevron** draws on the selected piece toward local **−Z** — the FUNCTIONAL front (cabinet doors, screens, seat openings, humanoid faces), which is the opposite edge from the backrest/headboard (+Z) decorations.

Defaults (footprint, height, seat height, back size, tint) live in `FURNITURE_KINDS` in `geometry.ts`. The drop flow uses `pendingFurnitureKind` (or `pendingCustomObjectId`) to pick the kind + its default `w` / `h`. The sidebar Furniture section lets the user re-label, change kind (auto-resizes if dimensions still match the previous kind's defaults), tune width/depth, and 🔗 **Bind** an appliance/TV entity.

### Custom objects (recipes)
User-authored objects live in `Store.customObjects: ObjectRecipe[]` (`ObjectRecipe extends FurnitureKindDef` + `id` + `primitives: RecipePrimitive[]`). Each primitive is a `box`/`cylinder`/`sphere`/`cone` with `size`/`pos`/`rot?`/`color?` in local mm (origin = piece center at floor level, **+Z = front**). A `Furniture` instance references one via `customKindId` (its `kind` stays as a `block` fallback). `resolveFurnitureDef(fu, customObjects)` returns the recipe def or `FURNITURE_KINDS[kind]`. 3D: a generic recipe builder in `_buildFurniture` walks `primitives`; 2D: a labeled rect. The sidebar "Custom Objects" section is the **form editor** (label, w/h/ht, surface/mountable checkboxes, activity dropdown, seat, and a parts list with numeric fields) — a new object is auto-placed at the view center so the live scene is the preview. Recipes sync in the store like everything else. **Adding a `Store` field reminder**: `customObjects`, `people`, `bleShowUnknown` (and per-floor `Floor.rooms` / `Floor.bleProxies`) must be in `Planner._loadFromHa`'s explicit field list / `repairFloor` + `defaultFloor` or they reset on load.

### Animated humanoid targets (3D)
Target positions come from `Planner.stepLerp` — a critically damped spring (ω = 9 rad/s) with velocity state on each `LerpSlot` (`vx`/`vy`), so on-screen motion stays velocity-continuous between HA's few-Hz coordinate pushes. (A plain exponential ease surged after every push and stalled before the next; the walk cycle inherited the lurch — don't regress to one.) The integrator **substeps so ω·h ≤ ~0.36** — a single semi-implicit Euler step at the 0.1 s dt clamp (10 fps device) makes the spring *diverge*, not just ring. `stepLerp` is driven by the 2D canvas RAF, which keeps running (hidden) while the 3D view is up.

Targets render as persistent stick-figure rigs (head + torso + 2 arms + 2 legs, two-segment limbs with elbow / knee pivots, face features, hands, shoes). Per-target `Humanoid` state in `_humanoids` keyed by `target.key` carries:
- `vx`, `vz` — smoothed 3D velocity (low-pass, time constant ~0.25 s) from the rig's own position deltas. **Gait and facing are both derived from this on-screen displacement, not HA's speed entity** — that entity updates on its own cadence and made feet pump while standing / skate while moving.
- `phase` — walk-cycle radians. Cadence = `max(speed / 1.2, 0.7)` cycles/s while walking: low speeds shorten the stride at near-normal cadence instead of slowing the legs to glacial giant steps.
- `facing` — body yaw, **eased along the shortest arc** (τ ≈ 0.13 s) toward `atan2(-vx, -vz)` so body-local **−Z** (where face/eyes/toes/leading-leg position all live) aligns with the velocity vector without frame-to-frame whip. Held below ~5 cm/s.
- `amp` — eased swing amplitude, **stride-matched**: `amp = v / (4·L·cadence)` (L = 0.81 m hip height, clamped 0.05–0.55 rad) so foot arc travel equals ground travel at every speed — a fixed amplitude made feet skate ~6× at low speeds where the cadence floor dominates.
- `scale` — eased spawn/despawn scale. Despawn shrinks out over ~0.4 s instead of popping, so brief LD2450 target flicker barely dents the figure and re-acquire recovers the same rig.
- `torso` (breathing scale) and `idleOffset` (desyncs idle sway / breathing between rigs).
- `sit` / `dwell` / `sitSpot` — **seating v1**: sittable furniture (`def.seat`) registers `SitSpot`s during `updateFloor`; a target dwelling >1.2 s (raw speed <0.15 m/s) within a spot's radius eases (`sit` 0→1) into a seated pose — root drops so the 870 mm hip pivot lands on the seat, hips +1.45 / knees −1.45 rad, arms to lap, x/z pull to the seat center, facing turns to the seat's front. Raw speed >0.4 m/s or leaving the radius stands it back up. All triggers use the RAW target position so the visual blend can't feed back.
- Velocity divides by the UNCLAMPED frame gap (`dtFull`) — dividing by the 0.1 s animation clamp overestimated speed after tab-resume / on slow devices and broke facing + sit detection.
- Hip / knee / shoulder / elbow joint groups for limb animation.

Root rotation order is **YXZ**: yaw = facing, pitch = forward lean (∝ speed), roll = lateral sway once per stride. Limb math: positive `rotation.x` on a downward limb cylinder moves the foot to body-local **−Z** per Three's right-handed rotation matrix; this is the body-forward direction in this rig. Knees flex (`max(0, sin(phase)) · 0.9 · ampNorm`) only during forward swing; arms counter-swing at 0.8× hip amplitude with a baseline elbow flex plus extra during forward swing; shoulders carry a small static `rotation.z` splay (relaxed A-pose). Vertical bob `|sin(phase)| · 40 mm · ampNorm`.

Rigs are persistent across frames (no rebuild churn). Cleaned up when a target disappears (after the scale-out grace) or via `clearTransientGroups()` on floor switch.

**Quadruped rigs (pets)**: avatar kinds `cat` / `dog` build a **separate** rig via `_buildQuadruped` (horizontal torso, 4 two-segment legs, head with ears + snout, 2-segment tail; cat ≈ 58% of the dog, dog ≈ beagle ~520 mm shoulder height). Body-forward is local **−Z** like humanoids, so the shared facing/nav/carrot/spring, scale/despawn-fade, blob shadow, outline-shell, and plumbob (scaled ~0.7×) machinery is reused unchanged. A `quad` flag on the `Humanoid` (the 4 leg pivots alias the humanoid joint fields to satisfy the interface) switches the per-frame pose to `_applyQuadPose`: a **trot** (diagonal leg pairs antiphase, stride-matched amp off `h.vx/vz`) + tail sway + head bob + idle ear-flick; **sit** (haunches down, front legs straight) and **curl/lie** (all legs tucked) blends driven by the SAME `h.sit` / `h.lie` triggers as humanoids — soft lounge SitSpots (`SitSpot.soft`: sofa/chaise/ottoman/bed) route the sit blend into the curl pose so a pet curls up rather than sitting upright. Pets NEVER trigger privacy blur, standing activity anchors, or thought bubbles (all gated on `!h.quad`). `cat`/`dog` are valid selectable avatar kinds (`AVATAR_KIND_SET`) but kept OUT of the `AVATAR_KINDS` random-human fallback pool. A `DioramaPerson` with `isPet` and no explicit `avatarKind` renders as `cat` (three-view BLE-target default). Test page `test-pages/pet-test.html`.

### Rooms
`Floor.rooms: Room[]` (`{id, name, anchor}`, persisted via `repairFloor`/`defaultFloor` backfill of `[]`). The anchor is a world-mm point; `resolveRoomForPoint(rooms, loops, x, y)` (geometry.ts) maps it to whichever **live closed wall loop** (`closedWallLoops`) contains it, so room identity survives wall edits. Created via the sidebar "Rooms" section: **+ Add room** then `placingRoomId` arms a click-to-anchor on the 2D canvas — the room is created **unnamed** (no prompt); `roomLabel(rm)` (geometry.ts) supplies an italic/dimmer "Unnamed room" placeholder until the sidebar input names it, and an anchor outside every loop draws an amber "not enclosed by walls" marker at the anchor in 2D. Labels render centered per loop in 2D and as a `THREE.Sprite` in 3D, both gated by the `labels` layer. Room names feed the activity + bubble systems — a name containing the substring **`kitchen`** (case-insensitive) gates the snack/coffee bubbles, and the seated-person's room scopes TV watching.

### Geo reference (GPS landmarks & lat/lon↔plan — Feature G, phase G1)
`Store.geo` (`GeoConfig`: `landmarks[]`, `northDeg?`, `boundaryM?` default 30, `accuracyGateM?` default 30) — **store-level (property-wide), NOT per-floor**; added to `Planner._loadFromHa`'s explicit field list (`geo: remote.geo ?? undefined`) or it resets on load. A `GeoLandmark` (`{id, name, x, y, lat?, lon?, accuracy?, sampleCount?, sampledAt?, hidden?}`) is a plan point (world mm) that gets a real-world lat/lon by calibration; absent lat/lon = placed but uncalibrated.

**Transform math** lives in `src/geo.ts` — **pure, deterministic, ZERO imports** (same shape as `trilateration.ts`; the test page transpiles it with `esbuild --format=esm` *no* `--bundle`). Conventions: `projectLatLon(lat,lon,lat0,lon0)` returns local **metres**, x = east, **y = NORTH-positive** (an ENU tangent plane; the caller absorbs the plan↔north rotation into the fit — projection never pre-rotates). Plan world frame is +X right / +Y up in **mm**. `fitGeoTransform(pairs, northDeg?)` → `GeoTransform {originLat, originLon, thetaRad, tx, ty, rmsMm, residualsMm[], fittedScale, quality}` mapping **geo→plan** (project → ×1000 mm → rotate θ → translate). **Scale is FIXED at 1** (plan mm are physical); `fittedScale` (Horn RMS ratio √(Σ‖q′‖²/Σ‖p′‖²)) is a **diagnostic only** — far from 1 ⇒ a bad landmark. ≥2 calibrated → 2D Procrustes closed form (`θ = atan2(Σ(pₓ·q_y − p_y·qₓ), Σ(pₓ·qₓ + p_y·q_y))`, `t = q̄ − R·p̄`); 1 → translation + rotation from `northDeg` (**compass bearing, ° CW from true north, of plan +Y**; default 0 → plan +Y faces true north); 0 → quality `'none'`. `latLonToPlan`/`planToLatLon` apply/invert it; `medianLatLon(samples)` takes independent lat + lon medians (robust to outliers) plus count + median gps_accuracy. Test page `test-pages/geo-test.html` → **`GEO PASS 38/38`**.

**Calibration flow** (`Planner.startGeoCalibration`/`finishGeoCalibration`/`cancelGeoCalibration`, sidebar "GPS / Geo" section, **edit-only** — the whole sidebar renders only in edit mode). Pick a `device_tracker`, Start records `startedAt` and fires the Android companion-app `command_high_accuracy_mode` `force_on` + `high_accuracy_set_update_interval` 5 s via `notify.mobile_app_<slug>` (slug auto-derived from the tracker id, user-overridable); **fire-and-forget, try/catch, never blocks the UI** (harmless no-op on iOS — guidance line shown). A live sample counter (`geoCalib.liveCount`, bumped on the LIVE path in `_onStates` via `_geoCalibSample`) ticks while the panel is open; closing it is fine because Finish pulls the whole window from recorder history (`HaApi.getHistory` → WS `history/history_during_period`, `significant_changes_only:false`, normalized from compressed rows `s/a/lu/lc` with attributes forward-filled), filters `source_type==='gps'` (missing tolerated) AND `gps_accuracy ≤ accuracyGateM`, and requires **≥5 usable samples** (else keeps old values + explains). `getHistory` is implemented in **both** `HassClient` and `HassPanelAdapter` (`normalizeHistory` shared from `ha-client.ts`).

**Geo layer**: `Layers2D.geo` (default on) gates `drawGeoLandmarks` in canvas-render. Placement reuses the room latch pattern (`Planner.placingLandmarkId`, `NEW_LANDMARK` sentinel): "+ Add landmark" arms a 2D canvas click; landmarks are **2D-only in G1** (📍 pin + name + ±accuracy caption; calibrated solid, uncalibrated dashed/dim) — no 3D pins yet (G2; the fold-in point is commented at `three-view._keyFloor`). The section shows per-landmark status, a fit readout (quality, RMS m, fittedScale with a warning when |fittedScale−1|>0.15, worst-outlier name), a `northDeg` input (only when exactly 1 calibrated), and boundary + accuracy-gate inputs.

### Activity system (Sims contextual behavior)
The state machine lives in `three-renderer.ts` (`updateTargets`) fed by an `ActivityContext` (`{ entityOn, roomNames, timeBucket }`) that `three-view._tickOnce` builds cheaply every frame — `entityOn` from bound furniture entity states, `timeBucket` from `resolveTimeBucket` (time-of-day.ts). `updateTargets(targets, ctx?)` runs **every frame** (never dirty-keyed); a missing ctx (stale-chunk pairing) falls back to empty maps + `'day'`.

- **Anchors & spots**: `updateFloor` collects `_activityAnchors` (from furniture whose def has `activity`) alongside `_sitSpots` (from `def.seat`), each tagged with `roomId` (live-loop resolve) + `hasEntity`. `_tvsByRoom` groups bound TVs by room for watch_tv.
- **Solo (standing) activities** (`PHASE4_ACTIVITIES`: shower/bathe/toilet/wash_hands/load_dishwasher/make_coffee/forage_fridge/exercise): a target dwelling ~1.2 s near an anchor eases an `act` 0→1 pose blend and turns to face the appliance, standing off to the side. `ENTITY_GATED_ACTIVITIES` (load_dishwasher, make_coffee) engage only while the bound entity is on.
- **Seated (contextual) activities**: resolved from the `SitSpot.hostActivity` once `sit > 0.5` — `eat_at_table` / `work_at_desk` from the seat's own def; `watch_tv` only when a **bound, ON** TV sits in the seat's room; otherwise plain sitting. Sitting and standing-activities are mutually exclusive (anchor only acquired while `sit ≈ 0`).
- **Privacy blur**: shower/bathe/toilet ease a `privacy` 0→1 blend; above ~0.5 a lazily-built pixel-silhouette `blurSprite` (standing/seated static textures) is swapped in over the rig.
- **Bed covers**: per-bed occupancy by footprint containment (raw positions) in `_beds`/`_bedDwell`/`_bedCovers`; at ≥2 settled occupants the rigs hide and a vertex-displaced blanket plane breathes (`_animateBedCover`).
- **Thought bubbles** (`_resolveBubbleKind` → per-frame `bubbleWant`, 2.5 s hysteresis before committing `bubbleKind` + rebuilding the sprite): suppressed during any engaged activity / privacy blur / under-covers; else 🍪 (night+kitchen+standing idle), ☕ (morning+kitchen+standing idle), 📖 (evening/night+seated, TV off), 📱 (sole occupant idling in a bed).
- **Anti-feedback rule**: every trigger (dwell, sit, bed occupancy, activity radius) reads the **RAW** target position / speed, never the eased visual pose, so the blend can't feed itself. Poses use the sit-blend idiom (`joint = walkValue·(1−blend) + POSE·blend`).
- **Dispose rules**: `_disposeHumanoid` frees the rig's `blurSprite` + `bubble` sprite maps (sprite `CanvasTexture`s are NOT freed by `_clearGroup`); keep that pairing. Shared style textures (gradient/blob/outline) are never per-rig disposed.

### Per-sensor target color
`Sensor.color` (hex, optional) tints all targets seen by that sensor in both 2D and 3D. Default falls through to `SENSOR_PALETTE[idx % palette.length]` (where `idx` is the sensor's index in `floor.sensors`). In 2D, T2 / T3 within a sensor are `lighten()`-shaded variants of the base so they stay distinguishable while sharing the sensor hue. Detail tooltip frames (when `showDetails` is on) use `hexToRgba(tintColor, …)` for stroke at 0.53 / 0.80 alpha.

### People registry & BLE identity ("World Outside" arc — see `docs/DESIGN-world.md`)
- **People** (`Store.people: DioramaPerson[]`): the shared identity concept. Each person has `id`, `name`, optional `color`, `avatarKind` (single pick from the 22-model list), `isPet`, and three HA bindings (`haPersonId` person entity, `bermudaDeviceId` HA device id of the tracked BLE device, `gpsTrackerId` device_tracker). BLE trilateration and GPS both resolve to a person; rendering resolves a person to an avatar (fusion / rendering land in B2+). Sidebar "People" section is the CRUD (`Planner.addPerson/updatePerson/deletePerson`, `activePersonId` for list expansion). `Store.bleShowUnknown` (absent = true) gates showing configured-but-unmapped BLE devices — persisted now, consumed in B2.
- **BLE proxies** (`Floor.bleProxies: BleProxy[]`, `{id, name, x, y, height?, haDeviceId?, locked?, hidden?}`): a near-clone of the motion-sensor fixture flow (place with the **BLE** tool → 2D antenna puck in `drawBleProxies` + `hitBleProxy` + `ble` drag kind → 3D mast+bead in `updateBleProxies` under the `_keyBle` dirty key). Visibility **rides the `sensors` layer** in both views (`_bleGroup.visible = v.sensors`). Binding picks the physical proxy **device** (entity-picker device mode) — the scanner-MAC ↔ fixture match runs through that device's registry `connections`.
- **Bermuda discovery** (`Planner.scanBermuda()`, runtime-only, `Planner.bermuda`): scans the entity registry for `platform === 'bermuda'`, groups per-tracked-device, parses per-scanner distance unique_ids `{device_mac}_{scanner_mac}_range[_raw]` (colon-MAC token regex), records each smoothed-range entity's `disabled_by`, and matches scanner MACs to placed proxies via device `connections` (normalized through `normMac`). The sidebar's Bermuda subsection lists devices + disabled-entity counts; `enableBermudaDevice(dev)` flips `disabled_by: null` via `config/entity_registry/update` (consent button; HA needs ~30 s / an integration reload to start reporting). The solver + BLE targets are B2.
- **Entity-picker device mode**: `EntityPicker.showDevices(devices, onPick, title)` renders a flat device list (returns a device id). The `open-entity-picker` event carries a `devices` array for this mode; a bare `domain` stays the classic entity mode. Used for the BLE-proxy device bind and the person→Bermuda-device bind.
- **HaApi additions** (both `HassClient` + `HassPanelAdapter`): `getDevices` now returns `connections`; `getEntityRegistry` now returns `platform`/`unique_id`/`disabled_by`/`original_name`/`name` (all additive); new `updateEntityRegistry(entityId, changes)` → `config/entity_registry/update`.

### Weather core (Feature W — see `docs/DESIGN-world.md`)
- **Config** (`Store.weather: WeatherConfig`, optional/opt-in): `source` (`'entity' | 'sensors' | 'openmeteo'`), `entityId` (weather.*), `sensors` (`{precip, windSpeed, temp, lightning}` entity ids), `zip`/`lat`/`lon`/`placeLabel` (Open-Meteo location; zip geocoded once → lat/lon cached), `chip` (default true), `effects3d` + `affectLighting` (default true — **persisted now, consumed in W2**). In `_loadFromHa`'s explicit field list; no per-floor fields.
- **Normalization** (`src/weather.ts`, pure + two isolated fetch helpers — the codebase's FIRST third-party network call): every source maps to a runtime `WeatherNow {condition, tempC, windKmh, windBearing, isDay, stale, label?}` where `condition` is HA's 15-state vocabulary (`HaCondition`). `resolveWeatherEntity` reads a weather.* entity (unit-normalizes temp/wind from its own attrs); `deriveFromSensors` runs the station heuristic (precip>0.1→rainy, >7.6→pouring, cold precip→snowy, wind>38 km/h→windy, lightning→storm, else clear); `wmoToCondition(code,isDay)` is HA core's exact WMO→HA table; `fetchOpenMeteo`/`geocodeZip` hit Open-Meteo (keyless, CORS *) and **return null on any failure**. `toCelsius`/`toKmh`/`toMmPerH` are the unit normalizers. sunny↔clear-night is always re-gated through `isDay` (exported from `time-of-day.ts` — do NOT duplicate the sun read).
- **Planner integration**: `Planner.weatherNow` (runtime). Entity/sensors sources recompute in `_onStates` on a bound-entity change or full refresh (those ids are added to `_isSlowEntity` so the chip + sidebar re-render). Open-Meteo polls on connect + every 15 min (`setInterval`, cleared on reconfigure); zip geocoded once then cached via `save()` (no-op outside edit) with a `zone.home` fallback. Offline tolerance: `weatherNow` holds its last value and is marked `stale` after 45 min. All network work stays inside `weather.ts` try/catch — a fetch failure never reaches the RAF/tick paths. `setWeather(mut)` (sidebar edits) + `refreshWeatherLocation()` (zip Search) are the entry points; `_reconfigureWeather()` restarts/stops the poll on a source switch.
- **Chip** (`<diorama-weather-chip>`, light DOM via `define.ts`): mounted ONCE in `app.ts`'s shared canvas container (top-right) so it overlays both 2D and 3D without a duplicate interval. Glyph + temp (respects `store.imperial` for °F) + place/entity label; dims when stale; hidden when `weather.chip === false` or no source resolved. Non-interactive except an edit-mode click → `open-weather` event → `app` opens the sidebar and scrolls `#diorama-weather-section` into view. Sidebar "Weather" section is the source radio + pickers + zip search + toggles + a live preview line. Test page `test-pages/weather-test.html` (`WEATHER PASS 48/48`: WMO table, sensor heuristic, unit normalization, entity sun-gating) — bundle `weather.ts` via `esbuild --bundle` like `trilateration.html`.

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
- Adding a new `FurnitureKind`: extend `FURNITURE_KINDS` in `geometry.ts`, the `switch (kind)` block in `canvas-render.ts.drawFurniturePrimitive`, and the `switch (kind)` block in `three-renderer.ts._buildFurniture`. The sidebar dropdown enumerates `Object.keys(FURNITURE_KINDS)` so it's automatic.
- Adding a canvas fixture (mirror the **motion-sensor / BLE-proxy** flow): types → geometry defaults → `canvas-render` draw + `drawAll` gating → `canvas-hit` hit test → `canvas-interact` (mousedown/move/up drag case + place-tool + delete-tool + cursor) → sidebar section + `TOOLS` entry + tool hint → three-renderer group (declared, added to `scene.add`, `clearTransientGroups`, `destroy`, `setLayerVisibility`) + `update*` builder → three-view dirty key. BLE proxies ride the existing `sensors` layer instead of owning one.
- `HaApi` additions must land in **both** `HassClient` and `HassPanelAdapter` (panel adapter goes through `hass.connection.sendMessagePromise`). Extend the shared return types in `ha-client.ts` (`HaDevice` / `HaEntityReg`) additively.
- When changing the rotation convention or the body-forward axis of the humanoid, **also** flip the limb-rotation signs and the body `atan2` argument signs together — they're coupled.
- Local-storage migration is **not** in place: changing the `diorama:store:v1` key, or the HA `frontend.user_data` key (`diorama`), would orphan existing data. Bump version + migrate, or get user buy-in.
- `Planner._loadFromHa` reconstructs the store from an **explicit field list** — any new top-level `Store` field MUST be added there or it silently resets on every load (this happened to `scene3d` for a while). Same for new per-floor fields in `repairFloor`.
- `lighten()` returns hex on purpose — earlier it returned `rgb(...)` and broke callers that piped its output back through `hexToRgba`. Don't change it back without auditing every call site.
- Light bodies in 3D are now `THREE.Group`s (multi-mesh per kind). Raycaster must use `intersectObjects(_lightGroup.children, true)` (recursive) and walk parents to find `userData`. Reverting to `false` will silently break click-toggle on lamp / pendant / fireplace / spot / sconce / strip.
- LD2450 firmware-side gotchas (vertex (0,0) sentinel, max 8 verts, max 3 zones / 3 objects, hardware vs software zone filter) still apply on the firmware side — see that repo.
