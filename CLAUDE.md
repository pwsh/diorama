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

### Shadows
`renderer.shadowMap` is always enabled; only the **day** preset sets `sun.castShadow = true` (night/dusk pay zero shadow cost). Mesh flags are set at build time via `_shadowFlags(subtree)` — walls/furniture/doors/windows/models cast+receive, floor plane receives only, humanoids cast only. New mesh builders must call `_shadowFlags` (or set flags) or the geometry won't shadow in day mode.

### HACS
`hacs.json` uses `zip_release: true` + `filename: diorama.zip`; `.github/workflows/release.yml` builds and attaches the zip on each GitHub release. Module URL under HACS is `/hacsfiles/diorama/diorama-panel.js`. The zip mode is required because the build is multi-chunk (code-split three.js) — single-file HACS plugin mode would break the dynamic import.

### 3D dirty-key rebuilds (perf — load-bearing)
`three-view.ts._tickOnce` does NOT rebuild the scene every frame. Each group has a dirty key (`_keyFloor`, `_keyDoors`, `_keySensors`, `_keyMotion`, `_keyLights`, `_keyZones`, `_keyHalos`, `_keyModel`); the corresponding `update*` renderer call only fires when its key changes. Keys combine `planner.configRev` (bumped in every `emitConfig`) + the relevant bound-entity states. Exceptions:
- Targets (`updateTargets`) run every frame — persistent humanoid rigs mutate in place.
- An ON fireplace light forces `updateLightsSwitches` every frame (flicker comes from `Math.random()` in the builder).
If you add a renderer input (new prop, new entity dependency), **add it to the corresponding key** or the scene won't update.

### 3D scene appearance
`Store.scene3d` (`Scene3D` in types.ts): lighting `preset` (`night` default / `day` / `dusk`), `floorColor`, `floorTex` (`none|wood|tile|concrete` — procedural canvas textures, cached in `_texCache`), `wallColor`. Applied in `updateFloor(f, scene3d)` + `applyScenePreset`. Sidebar "3D Scene" section edits it.

- **Auto lighting modes**: `scene3d.lightMode` = `manual` (default) / `clock` / `lux`. `three-view._effectivePreset` resolves the preset each tick — clock mode reads HA's `sun.sun` elevation (>10° day, >−4° dusk, else night; local-clock fallback), lux mode maps `scene3d.luxEntity` (≥3000 lx day, ≥300 dusk). The resolved preset is part of `_keyFloor`, so the scene rebuilds only when it flips.
- **Per-floor look overrides**: `Floor.look3d` (`FloorLook3D`: floorColor/floorTex/wallColor) is spread over the global scene3d in the `updateFloor` call. Edited in the "This floor only" subsection of 3D Scene.
- **Rendering method**: ACES filmic tone mapping + a PMREM-baked `RoomEnvironment` map on `scene.environment` (per-preset `environmentIntensity`: day 0.85 / dusk 0.3 / night 0.15). Furniture materials are opaque PBR (wood/cushion/steel/porcelain/screen/glass) — chosen over post-processing (tablet perf) and GLTF assets (no asset pipeline).
- **Camera views**: renderer exposes `cameraView()` / `setCameraView(pos, target)` / `applyViewPreset('iso'|'top'|'front'|'back'|'left'|'right')` (framed to floor extents). The three-view overlay buttons apply them; 💾 saves the current pose into `Store.views3d` (global, scene coords).

### UI modes (edit / kiosk / view) & URL templates
`Planner.uiMode` (runtime + URL only, never persisted): `edit` (default), `kiosk` (views + device interaction, no editing), `view` (no interaction either). Enforcement layers: `Planner.save()` **no-ops outside edit** (kiosk devices must never write back — not even localStorage), `toggleEntity` refuses in view mode, `onCanvasMouseDown` returns early outside edit (no drags/selections), `onCanvasClick`/`onCanvasDblClick` have kiosk branches (toggle / light-config only), tool + Delete hotkeys are edit-only, and the sidebar / floor buttons / settings / save-view buttons render only in edit. URL params parsed in `app._applyUrlParams`: `mode`, `lock=1` (sets `uiModeLocked`, hides the switcher), `view`, `floor`, `layers` (preset name/id or `simple`/`full`), `view3d` (saved view name/id), `cam=x,y,z,tx,ty,tz`. Floor/layers apply via retry-on-config (store loads async, 20 s window, then defaults stand); `view3d`/`cam` apply in `three-view._applyUrlTemplate` (15 s, then iso fallback). `Planner.lastCam3d` is refreshed each 3D tick so the topbar "Kiosk link" button can mint a `cam=` URL.

### 2D layers & presets
`Store.layers2d` (`Layers2D`) gates `drawAll` per layer (bg, furniture, lights, sensors, motion, env, zones, targets — absent = on) plus `activity` (default OFF): glow pools where lights are ON / motion is firing, so the built-in "Simple floorplan" preset (everything off + targets + activity) still shows living rooms. Walls/doors/windows always draw. User presets persist in `Store.layerPresets2d`; sidebar "2D Layers" section.

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

Beyond the classics above there are casework kinds (coffee_table, tv_stand, dresser, nightstand, wardrobe, ottoman, stool, plant, counter, island, cabinet), **appliances** (fridge, stove, dishwasher, washer, dryer, microwave, tv — `cat: 'appliance'`, spec-sheet default sizes) and **bathroom** kinds (toilet, sink, bathtub, shower — `cat: 'bathroom'`). `furnitureCat(def)` groups the sidebar kind dropdowns into optgroups. A def with `seat` set is **sittable** (humanoid seating anchors — see below).

Defaults (footprint, height, seat height, back size, tint) live in `FURNITURE_KINDS` in `geometry.ts`. The drop flow uses `pendingFurnitureKind` to pick the kind + its default `w` / `h`. The sidebar Furniture section lets the user re-label, change kind (auto-resizes if dimensions still match the previous kind's defaults), and tune width/depth.

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

### Per-sensor target color
`Sensor.color` (hex, optional) tints all targets seen by that sensor in both 2D and 3D. Default falls through to `SENSOR_PALETTE[idx % palette.length]` (where `idx` is the sensor's index in `floor.sensors`). In 2D, T2 / T3 within a sensor are `lighten()`-shaded variants of the base so they stay distinguishable while sharing the sensor hue. Detail tooltip frames (when `showDetails` is on) use `hexToRgba(tintColor, …)` for stroke at 0.53 / 0.80 alpha.

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
- Stable filenames alone allowed **mixed-version module graphs**: the browser could pair a fresh `app.js` with a stale cached `assets/three-renderer.js` across the lazy dynamic import. This bit for real: removing `speed` from `TargetWorld` made a stale renderer compute `Math.abs(undefined)` → `h.phase = NaN` → humanoid limbs (whose joint rotations went NaN) vanished while head/torso kept rendering. The `chunkVersionQuery` plugin in `vite.config.ts` now appends a per-build `?v=` query to every chunk import specifier + index.html src/preload, pinning each build's graph together. Keep it when touching the build config, and don't assume interface changes across the app ↔ three-renderer boundary are safe without it.
- Never add an npm dependency literally named `node` — it downloads a full Node.js binary into node_modules (this happened once).
- Three.js scene rebuilds MUST go through `_clearGroup` (disposes geometry + materials); raw `g.remove(child)` leaks WebGL buffers and eventually freezes the tab on view switch.
- Adding HA-side props to a fixture (e.g. light radius) → also update the 2D / 3D renderers to actually use the field, not just the type.
- Adding a new `LightIconKind`: extend `LIGHT_GLYPH` in `canvas-render.ts`, the `switch (kind)` block in `three-renderer.ts.updateLightsSwitches` (build the body + decide whether to keep the floor disc), and `LIGHT_KINDS` in `sidebar.ts` (UI selector).
- Adding a new `FurnitureKind`: extend `FURNITURE_KINDS` in `geometry.ts`, the `switch (kind)` block in `canvas-render.ts.drawFurniturePrimitive`, and the `switch (kind)` block in `three-renderer.ts._buildFurniture`. The sidebar dropdown enumerates `Object.keys(FURNITURE_KINDS)` so it's automatic.
- When changing the rotation convention or the body-forward axis of the humanoid, **also** flip the limb-rotation signs and the body `atan2` argument signs together — they're coupled.
- Local-storage migration is **not** in place: changing the `diorama:store:v1` key, or the HA `frontend.user_data` key (`diorama`), would orphan existing data. Bump version + migrate, or get user buy-in.
- `Planner._loadFromHa` reconstructs the store from an **explicit field list** — any new top-level `Store` field MUST be added there or it silently resets on every load (this happened to `scene3d` for a while). Same for new per-floor fields in `repairFloor`.
- `lighten()` returns hex on purpose — earlier it returned `rgb(...)` and broke callers that piped its output back through `hexToRgba`. Don't change it back without auditing every call site.
- Light bodies in 3D are now `THREE.Group`s (multi-mesh per kind). Raycaster must use `intersectObjects(_lightGroup.children, true)` (recursive) and walk parents to find `userData`. Reverting to `false` will silently break click-toggle on lamp / pendant / fireplace / spot / sconce / strip.
- LD2450 firmware-side gotchas (vertex (0,0) sentinel, max 8 verts, max 3 zones / 3 objects, hardware vs software zone filter) still apply on the firmware side — see that repo.
