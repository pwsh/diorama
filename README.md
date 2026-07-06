# Diorama

A living model of your Home Assistant home — design your floor plan, drop in
your devices, and watch state in their actual spatial context. Click anything
to control it.

Built as a TypeScript + Vite + Lit project. Currently ships with first-class
support for HLK-LD2450 mmWave radar sensors (multi-sensor on a shared floor,
zone editing, object halos, live tracking, animated humanoid targets in 3D)
but the model is generic — any HA entity can be placed and bound.

## Documentation

**[User guide with screenshots →](docs/GUIDE.md)** — furniture, lighting,
walls & rooms, sensors, target rendering, HA binding, hotkeys, and views.

### Kiosk & view-only modes

The topbar mode selector (or URL parameters) switches between **Edit**,
**Kiosk** (views + device control, nothing editable, nothing persisted) and
**View only** (pure visualization). Boot a wall tablet straight into a
configured view:

```text
/diorama?mode=kiosk&lock=1&view=3d&floor=First&view3d=Living%20room
/diorama?mode=view&lock=1&view=2d&layers=simple
```

Supported parameters: `mode`, `lock`, `view`, `floor`, `layers`, `view3d`,
`cam` — named templates fall back to defaults if they no longer exist. The
**🔗 Kiosk link** topbar button copies a URL reproducing your current view.
See the [full parameter table](docs/GUIDE.md#kiosk--view-only-modes).

## Layout

```
.
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html              # entry; mounts <diorama-app>
└── src/
    ├── main.ts             # bootstrap
    ├── types.ts            # domain types (Floor, Sensor, MotionSensor, Light,
    │                       # SwitchFixture, Furniture, FurnitureKind, LightIconKind, ...)
    ├── storage.ts          # localStorage cache (key: diorama:store:v1)
    ├── geometry.ts         # transforms, snap, point-in-polygon, fixture defaults,
    │                       # FURNITURE_KINDS, SENSOR_PALETTE, hex/lighten utilities
    ├── ha-client.ts        # HA WebSocket client + device/entity registry + user-data store
    ├── sensor-discovery.ts # LD2450 entity discovery per device
    ├── three-renderer.ts   # Three.js 3D scene + raycast click + animated humanoids
    ├── planner.ts          # central state class (events: live, config, conn)
    ├── canvas-render.ts    # 2D canvas drawing
    ├── canvas-hit.ts       # 2D hit tests
    ├── canvas-interact.ts  # mouse / touch handlers, zone editor, fixture click-vs-drag
    ├── styles.ts           # shared CSS (light-DOM components)
    └── ui/
        ├── app.ts          # <diorama-app> root
        ├── auth-screen.ts  # <diorama-auth>
        ├── topbar.ts       # <diorama-topbar>
        ├── sidebar.ts      # <diorama-sidebar>
        ├── canvas-2d.ts    # <diorama-canvas-2d>
        ├── three-view.ts   # <diorama-three-view>
        └── modals.ts       # floor settings, entity picker, light config,
                            # zone-edit bar, settings drawer
```

## Develop

Requires Node 20.19+ or 22.12+ (Vite 8).

```bash
npm install
npm run dev          # hot-reload at http://localhost:5173
npm run typecheck
npm run build        # → ./dist
```

Paste your HA URL + Long-Lived Access Token into the auth screen on first
load.

## Install via HACS (recommended)

Diorama is distributed as a HACS **custom repository** (it is not in the
HACS default store). You need [HACS](https://hacs.xyz) installed first.

**1. Add the custom repository**

- Open **HACS** in the Home Assistant sidebar.
- Click the **⋮** menu (top right) → **Custom repositories**.
- Repository: `https://github.com/pwsh/diorama`
- Type: **Dashboard**
- Click **Add**, then close the dialog.

**2. Install Diorama**

- Search HACS for **Diorama** and open it (the store page shows the
  feature overview).
- Click **Download** and pick the latest release. HACS unpacks the release
  zip into `config/www/community/diorama/`.

**3. Register the panel**

Add this to `configuration.yaml` and **restart Home Assistant**
(`panel_custom` is only read at startup):

```yaml
panel_custom:
  - name: diorama-panel
    sidebar_title: "Diorama"
    sidebar_icon: mdi:floor-plan
    url_path: diorama
    module_url: /hacsfiles/diorama/diorama-panel.js
    embed_iframe: false
```

**4. Open it**

**Diorama** appears in the HA sidebar. Panel mode rides HA's own
authentication — no tokens needed. Draw walls, place devices, and bind
entities (see the [user guide](docs/GUIDE.md)).

**Updating**: HACS shows updates when new releases are published — update
from HACS, then hard-refresh the browser (or bump a `?v=` query on
`module_url` + restart) if the panel looks stale; HA caches panel modules
aggressively.

**Troubleshooting**
- *"Unable to load custom panel"* — the release zip didn't land in
  `config/www/community/diorama/` (re-download in HACS) or the
  `module_url` doesn't match; it must be exactly
  `/hacsfiles/diorama/diorama-panel.js`.
- *Panel shows an old version after updating* — browser/service-worker
  cache; do a hard refresh, or clear site data for your HA origin once.
- *No versions offered in HACS* — the repository has no published release
  yet; HACS `zip_release` installs only from releases.

Releases are built + zipped automatically by GitHub Actions
(`.github/workflows/release.yml`); `hacs.json` uses `zip_release` so the
multi-chunk build (code-split three.js) ships intact.

## Manual deploy

```bash
npm run build
# Copy the entire dist/ folder to HA:
#   config/www/diorama/
```

### Native panel (recommended)

No iframe, no token — Diorama rides Home Assistant's own authenticated
connection. Add to `configuration.yaml`:

```yaml
panel_custom:
  - name: diorama-panel
    sidebar_title: "Diorama"
    sidebar_icon: mdi:floor-plan
    url_path: diorama
    module_url: /local/diorama/diorama-panel.js
    embed_iframe: false
```

### Iframe fallback

```yaml
panel_iframe:
  diorama:
    title: "Diorama"
    icon: mdi:floor-plan
    url: "/local/diorama/index.html"
    require_admin: false
```

Reload HA. In iframe mode, paste a Long-Lived Access Token on first load.

## Sweet Home 3D import

- **Plan underlay (2D)**: export your plan as SVG (Plan → Export to SVG
  format), then upload via the sidebar's **Background image** section. SVG
  stays crisp at any zoom.
- **Full 3D model**: export via 3D view → Export to OBJ format, then import
  the `.obj` (plus `.mtl` for colors) in the sidebar's **3D Model** section.
  Sweet Home 3D exports centimeters, so the default 10 mm/unit scale is 1:1.
  Adjust X/Y offset + rotation to line the model up with your floor. Model
  geometry is stored in the browser (IndexedDB); placement settings sync
  through HA.

## 3D scene appearance

Sidebar **3D Scene** section: lighting presets (Night / Day / Dusk), floor
color, procedural floor textures (wood / tile / concrete), wall color. Night
keeps the original dark look where bound HA lights dominate; Day/Dusk add
hemisphere + sun lighting for exterior-style renders.

## Storage

**Home Assistant is the source of truth.** The full diorama (floors, walls,
furniture, sensors, motion sensors, lights, switches, bg images) is persisted
in HA's `frontend.user_data` table under the key `diorama` — the same plumbing
HA's own UI uses for sidebar order / theme prefs. This means:

- Data syncs across browsers / devices automatically.
- It survives browser data clear.
- It's included in HA backups.

`localStorage` (key `diorama:store:v1`) is the **local cache** so the panel
paints instantly on load, then reconciles with HA once the WebSocket auth
completes. If HA returns a payload, it replaces the cache. If HA is empty
(first launch), the local cache is pushed up.

Saves are debounced 600 ms before being pushed to HA so rapid edits (dragging
a vertex, sliding the opacity slider) don't hammer the WS.

Connection settings live in `localStorage` under `diorama:url` and
`diorama:token`.

## Supported entity kinds

| Element       | Bind to              | What it surfaces |
|---------------|----------------------|------------------|
| LD2450 sensor | LD2450 ESPHome device| Live target tracking, in-place zone editing, object halos, sensor pose (height + tilt from HA), animated humanoid targets in 3D. Per-sensor color tints all of that sensor's targets in 2D + 3D. |
| Motion sensor | `binary_sensor.*` (or any entity) | Configurable detection cone (heading / FOV / range); cone glows when ON; muted/dashed when OFF; red body when unavailable. Per-sensor **color** + **intensity** (0..2) tune the highlight in both 2D and 3D. |
| Light         | `light.*`            | Click toggles. Dblclick → color / brightness / color-temp config. Per-fixture height (mm), radius (mm pool of light), intensity multiplier (0..2), and **icon kind** — bulb / spot / pendant / sconce / strip / fireplace / lamp. Fireplace forces warm + flickers. |
| Switch        | `switch.*` *or* `light.*` (wall-switch wiring) | Click toggles. Dblclick → light config when bound to a light entity. Per-fixture height + rotation. |
| Furniture     | (no entity)          | Block / table / chair / rocking chair / chaise / bench / desk / sofa / bed / rug / bookshelf. Each kind renders distinct 2D plan-view shape and 3D composite mesh (legs, backrests, headboards, pillows, shelves, etc.). Editable label, kind, width, depth. |

Drop on the canvas, bind via the entity picker (filterable by domain or by HA
device, searchable by entity / friendly / device name). Click toggles,
double-click opens the deeper config or the bind picker (for unbound
fixtures). The Furniture tool exposes a kind dropdown so the next drop uses
that kind's default footprint.

## Interactions

### 2D
- **Wheel**: zoom anchored at cursor.
- **Drag with middle / right mouse, or Space + left**: pan.
- **Touch**: 1 finger = mouse-equivalent; 2 fingers = pinch-zoom + pan.
- **⟳ Reset view** (bottom-left button) or **Ctrl/Cmd + 0**: re-fit to floor.
- **Click on a bound light/switch**: toggle (small movement ≤ 30 mm = click; larger = drag-to-move).
- **Double-click on a bound light**: color/brightness/temp modal.
- **Double-click on an unbound fixture**: open the entity picker.
- **Tools** (sidebar or 1–8 / `m` shortcuts): Select / Wall / LD2450 / Motion / Furniture / Light / Switch / Delete.

### 3D
- **Orbit / pan / zoom**: standard Three.js OrbitControls (touch-friendly).
- **Click on a light or switch mesh**: toggles via raycast. Light bodies are
  multi-mesh `THREE.Group`s (e.g. lamp = pole + base + shade + bulb), so the
  raycast is recursive and walks parents to find the click target. The floor
  pool below the light also clicks. Sconce skips the floor pool (it lights
  walls, not the floor below).
- **Double-click**: same dispatch as 2D — light config or bind picker.
- **Sensors** show heading via a forward-pointing nub; tilt + height pulled
  from HA's `number.<slug>_sensor_height` and `number.<slug>_mount_angle`.
- **Fireplace lights** flicker every render frame (warm orange-red, ignores
  the HA color attribute).

### Background image (per floor)
Upload from the sidebar's **Background image** section. Drag to reposition,
drag corners to scale (Shift = preserve aspect). Adjust opacity / rotation in
the sidebar. Visible / Locked toggles for live preview without losing the
edit. Image stored as a data URL in HA along with the rest of the diorama.

## Architecture notes (load-bearing)

- **Single source of truth**: the `Planner` class owns the store, HA client,
  per-sensor live state, drag/edit state, view, and tool. UI components are
  thin Lit wrappers that read planner state and dispatch CustomEvents (which
  bubble) back. Lit renders to **light DOM** so shared CSS applies.
- **Two event channels**:
  - `live` fires on every HA state event (~10 Hz). The 2D canvas RAF reads
    planner state on each frame; this event exists for non-canvas consumers
    that want live updates.
  - `config` fires on structural / `number.*` / `switch.*` changes. Sidebar
    and topbar subscribe; Lit reconciles, focused inputs survive.
- **Drag fence**: slow-path HA sync is skipped while a drag or zone-edit is in
  flight so HA's stale read doesn't clobber an in-progress edit.
- **Sync on bind**: `Planner.bindSensor` runs discovery + `_syncZonesObjects`
  immediately and schedules retries at 500 ms / 2 s / 5 s. Each retry
  invalidates the discovery cache so any entities ESPHome publishes after the
  initial `get_states` snapshot get picked up — no manual click needed to
  surface zones / objects.
- **Local visual occupancy**: zone-glow and halo-glow are computed locally
  from lerped target positions (point-in-polygon / radius), not from HA's
  `target_count` / `*_halo_occupied`. HA's WS push order can race target X/Y
  with count updates, so the local test keeps the highlight in sync with the
  dot the user actually sees.
- **Domain-aware toggle**: `Planner.toggleEntity(entity_id)` reads the domain
  from the entity_id and calls the matching `<domain>.toggle` (with
  `homeassistant.toggle` fallback). A "switch" fixture bound to `light.foo`
  calls `light.toggle`, not `switch.toggle`.
- **Per-sensor target color**: `Sensor.color` (hex, optional) tints all of
  that sensor's targets in 2D and 3D. Default falls through to
  `SENSOR_PALETTE[idx]`. T1 / T2 / T3 within one sensor stay distinguishable
  because T2 / T3 are `lighten()` shades of the base.
- **Furniture composites (3D)**: each piece is a `THREE.Group` built per
  `FurnitureKind` — table = top + 4 legs, chair = seat + back + legs,
  bed = mattress + headboard + pillows, etc. Backrests / headboards /
  pillows live on local +Z (= world +Y, the "front" side).
- **Animated humanoids (3D)**: persistent rigs per target keyed by
  `target.key` carry walk-cycle phase + smoothed velocity. Limbs are
  two-segment chains (hip → knee → foot, shoulder → elbow → hand) with
  knees / elbows that flex during forward swing. Body faces the smoothed
  velocity vector. Vertical bob `|sin(phase)| · 30 mm` while walking. Cleaned
  up on disappearance and on floor switch.
- **Robust RAF**: 2D canvas tick and 3D `_tickOnce` schedule the next frame
  before the work and wrap the body in `try/catch`. One bad frame logs and
  recovers; subsequent frames clear and rebuild as normal. Floor-switch hard
  resets all per-floor groups via `clearTransientGroups`.
- **Mobile**: `touchAction: 'none'` on both canvases. DPR capped at 2 in 3D
  to keep tablets from rendering 4× pixels and dropping frames.
  `webglcontextlost` listener prevents iOS Safari blackouts.

## Conventions

- All length units are **mm**. Headings / rotations are degrees,
  0 = +Y world, increasing clockwise on screen.
- World floor frame: `+X` right, `+Y` up. Canvas Y is flipped so world `+Y`
  is screen-up.
- The 3D renderer flips X (`_w(wx, wy, h) = (fw/2 − wx, h, wy − fd/2)`) so
  screen-right matches 2D world `+X` regardless of camera azimuth.
- Custom element prefix is `diorama-*`. CSS `floor-planner-*` selectors no
  longer exist.
- LD2450 device-specific naming (slugs, entity prefixes, the "LD2450" tool
  button label) stays — that's hardware naming.

## Known gaps / future work

- **Multi-device sync**: changes from another browser / device aren't pulled
  mid-session; the panel only fetches HA data on initial connect. A
  `frontend.user_data` change made elsewhere shows up after a panel reload.
- **Storage migration**: `diorama:store:v1` and the HA key `diorama` have no
  migration code. Bumping either would orphan existing data.
- **Zone polygon round-trip**: ESPHome treats vertex `(0, 0)` after slot 0 as
  a sentinel for "no more vertices" — don't place a real vertex at origin
  past the first slot.
