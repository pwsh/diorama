# Diorama

A living model of your Home Assistant home — design your floor plan, drop in
your devices, and watch state in their actual spatial context. Click anything
to control it. The 3D view renders in a 2000-era *Sims* cartoon style, with the
people (and pets) moving through the house shown as animated figures with green
plumbobs over their heads.

Built as a TypeScript + Vite + Lit project. First-class support for HLK-LD2450
mmWave radar (multi-sensor, multi-target, in-place zone editing, animated
figures that walk, sit, and do contextual activities) — but the model is
generic: any HA entity can be placed and bound, from lights and fans to media
players and environmental sensors.

![Overview](docs/images/overview-iso.png)

## Documentation

**[Full documentation site → https://pwsh.github.io/diorama/](https://pwsh.github.io/diorama/)**
— a home page, the **user guide** (getting started, the 2D editor, the 3D view,
devices & bindings, avatars & people, outdoor/weather/geo, kiosk & display
modes, configurations & offline), the **model gallery** (an animated preview of
every furniture kind, fixture, sensor, and avatar Diorama can render), and the
**floor-plan library** (importable demo homes).

**[User guide with screenshots →](docs/GUIDE.md)** — building walls & rooms,
furniture & custom objects, lighting, sensors, presence & avatars, GPS &
weather, 3D cameras, kiosk modes, HA binding, and hotkeys.

The site is generated from repo sources — `npm run docs:site` builds the home
page + guide, `npm run docs:gallery` regenerates the model gallery, and
`npm run docs:floorplans` builds the floor-plan library. `npm run docs:publish`
pushes the whole site to GitHub Pages.

## Features

- **The Sims, for your house** — flat toon shading, cartoon outlines, blob
  shadows, a dimetric "Sims cam" with 45° snap, a glass-house / wall-cutaway
  doll's-house view, and an auto-follow camera.
- **Live presence with personality** — mmWave figures **walk around furniture
  and through doorways**, sit down, and run contextual activities: making
  coffee, loading the dishwasher, watching a TV that's actually on, working
  out, getting **censored in the shower**, and hiding under the **covers**
  two-to-a-bed. Idle fidgets, shared **props** (broom, watering can, umbrella,
  snacks), automatic **costume swaps** (pyjamas at night, an apron while
  cooking), and time- and place-aware thought bubbles. Avatars ship as
  **loadable packs** — 9 always-on base packs plus 52 opt-in franchise packs —
  and motion sensors can drive room-confined **AI avatars** or always-on
  **demo avatars**; **roamers** need no sensor at all.
- **Know who's who** — a **People** registry (avatars, colors, pets), **BLE /
  Bermuda** indoor positioning solved panel-side from your Bluetooth proxies,
  and **identity fusion** that dresses a precise radar figure in a person's
  avatar and floating **name label**. **Pets** render as cat/dog rigs.
- **The world outside** — **GPS device pins** in the yard with a landmark
  calibration flow (CSV import, per-pin alignment exclusion), an on-screen
  **compass** and north marker, **weather** (entity / local sensors / keyless
  Open-Meteo) with a corner chip, government **weather alerts**, and 3D rain,
  snow, fog, wind and lightning under an astronomically-correct **night sky**
  (real constellations, planets, and moon phase).
- **Beyond the property line** — a **neighborhood overlay** that pulls the real
  surrounding buildings, roads and water from OpenFreeMap/OSM vector tiles, and
  live **flight tracking** — ADS-B aircraft and the ISS rendered in the sky,
  with archetype-accurate models, callsign labels, status beacons and
  user-defined glow rules.
- **Real floor plans** — walls with 15° snapping and auto-welding, half walls,
  railings, fences and hedges, **8 door kinds** and **5 window styles** that cut
  real openings, curtains and blinds, stairs with landings and descending
  flights, floor voids, per-floor elevations, floors clipped to your rooms,
  named rooms, a ruler tool with CAD dimensions, item locking, undo/redo, and
  smart alignment guides.
- **A full catalog + custom objects** — ~96 furniture kinds across furniture,
  appliance, bathroom, outdoor, theater and vehicle categories: seating,
  sectionals, beds, casework with door pulls, spec-size appliances, mechanical
  plant (water heaters, HVAC, pumps, a 3D printer), home-theater seating,
  vehicles and EV chargers — plus a form-based editor to build your own objects
  from primitives, and a **Sweet Home 3D importer** that turns a `.sh3d` file
  into real editable walls, rooms, openings and furniture.
- **Every kind of light** — 26 fixture kinds: recessed cans, pendants, sconces,
  step lights, LED strips and strings, under-cabinet lighting, floodlights,
  in-ground uplights, heat lamps, exhaust fans, ceiling fans that spin at the
  fan's real speed, and a crackling wall-snapping fireplace. Lights can also be
  driven by **logic rules** off any entity's value.
- **The yard** — ground paint (grass / rock / concrete / blacktop / mulch /
  sand / water), terraced elevations, paths and driveways, pools and spas,
  sprinkler zones, and a flagpole with 16 flags.
- **Synced through HA** — the whole model lives in Home Assistant user data as
  a registry of **named configurations**, so every browser and tablet sees the
  same home, and you can keep several plans side by side.
- **Kiosk & view-only modes** — pin a wall tablet to a configured view via URL,
  or drop the **Lovelace card** onto any dashboard.

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

Three build entries share one code-split three.js chunk: the standalone/iframe
page, the HA `panel_custom` module, and the Lovelace card.

```
.
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html              # entry 1 — standalone / iframe; mounts <diorama-app>
├── test-pages/             # deterministic renderer + logic test harnesses
└── src/
    ├── main.ts             # bootstrap
    ├── panel.ts            # entry 2 — HA panel_custom → dist/diorama-panel.js
    ├── card.ts             # entry 3 — Lovelace card → dist/diorama-card.js
    ├── types.ts            # domain types (Floor, Sensor, MotionSensor, Light,
    │                       # SwitchFixture, Furniture, FurnitureKind, LightIconKind, ...)
    ├── storage.ts          # localStorage cache (key: diorama:store:v1)
    ├── geometry.ts         # transforms, snap, point-in-polygon, fixture defaults,
    │                       # FURNITURE_KINDS, SENSOR_PALETTE, hex/lighten utilities
    ├── ha-client.ts        # HA WebSocket client + device/entity registry + user-data store
    ├── ha-panel-adapter.ts # HaApi over the hass object HA injects into panels
    ├── ha-local.ts         # offline / standalone HaApi (localStorage-backed)
    ├── sensor-discovery.ts # LD2450 entity discovery per device
    ├── three-renderer.ts   # Three.js 3D scene + raycast click + animated humanoids
    ├── planner.ts          # central state class (events: live, config, conn)
    ├── canvas-render.ts    # 2D canvas drawing
    ├── canvas-hit.ts       # 2D hit tests
    ├── canvas-interact.ts  # mouse / touch handlers, zone editor, fixture click-vs-drag
    ├── avatars.ts          # avatar-pack registry + resolution (three.js-free)
    ├── avatar-packs/       # built-in avatar packs (lazy-loaded bodies)
    ├── sh3d.ts             # Sweet Home 3D .sh3d structural importer
    ├── geo.ts              # lat/lon ↔ plan fit, landmarks, GPS pins
    ├── weather.ts          # weather normalization + Open-Meteo (pure + isolated fetch)
    ├── flights.ts          # ADS-B normalization, label + glow resolution (pure)
    ├── neighborhood.ts     # OSM/OpenFreeMap tile extraction (pure)
    ├── mqtt-ws.ts          # MQTT 3.1.1 codec + WS client (Frigate / Valetudo bridge)
    ├── value-rules.ts      # shared rule engine (info cards, action buttons, logic lights)
    ├── styles.ts           # shared CSS (light-DOM components)
    └── ui/
        ├── app.ts          # <diorama-app> root
        ├── auth-screen.ts  # <diorama-auth>
        ├── topbar.ts       # <diorama-topbar>
        ├── sidebar.ts      # <diorama-sidebar>
        ├── toolbar.ts      # <diorama-toolbar> visual placement dock
        ├── canvas-2d.ts    # <diorama-canvas-2d>
        ├── three-view.ts   # <diorama-three-view>
        ├── card-editor.ts  # <diorama-card-editor> (Lovelace visual editor)
        └── modals.ts       # floor settings, entity picker, light config,
                            # zone-edit bar, settings drawer, fixture cards
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

**5. Optional: add the Lovelace card**

Diorama also ships a **dashboard card** — drop a single floor (2D) or a
kiosk-framed 3D room view onto any Lovelace dashboard, alongside the panel.
It rides HA's own connection (no token) and is read-only: build/edit the
plan in the panel, then *show* it in cards.

Register the card module once as a dashboard resource:

- **Settings → Dashboards → ⋮ (top right) → Resources → Add resource**
- URL: `/hacsfiles/diorama/diorama-card.js`
- Type: **JavaScript Module**

Then add a card from the picker (search "Diorama") or in YAML:

```yaml
type: custom:diorama-card
view: 2d          # 2d (floor plan) | 3d (room view)   — default 2d
mode: kiosk       # kiosk (tap to control) | view (display only) — default kiosk
floor: Kitchen    # floor name or id (optional; default = current/first floor)
layers: simple    # a 2D-layer preset name/id, or "simple" | "full" (optional)
view3d: Iso       # a saved 3D view name/id (3D only, optional)
cam: [x,y,z,tx,ty,tz]   # explicit 3D camera pose (3D only, optional)
compact: false    # hide the overlay chrome; auto-on below ~360px wide
panelPath: /diorama     # href for the ⤢ "open full panel" link (default /diorama)
```

| Field | Values | Default | Notes |
|---|---|---|---|
| `view` | `2d` \| `3d` | `2d` | 3D lazy-loads the renderer only when a 3D card mounts. |
| `mode` | `kiosk` \| `view` | `kiosk` | `edit` is rejected — a card never edits/saves the plan. `view` disables tap-to-control. |
| `floor` | floor name or id | current/first | Shared across cards on a tab (last-applied wins). |
| `layers` | preset name/id, `simple`, `full` | plan default | Same presets as the panel's 2D Layers. |
| `view3d` | saved view name/id | iso framing | 3D only. |
| `cam` | 6 numbers | — | 3D only; explicit pose, wins over `view3d`. |
| `compact` | `true` \| `false` | auto (<360px) | Hides the view-preset bar / reset button / weather chip / compass. |
| `panelPath` | url path | `/diorama` | The `url_path` of your `panel_custom` panel. |

Every Diorama card on a tab shares **one** live connection and one Planner —
add as many as you like (a 2D card beside a 3D card, several rooms) at no
extra connection cost.

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

### Standalone / offline (no Home Assistant)

Diorama also runs as a plain web page with no HA connection at all — for
designing a floor plan, building a demo, or trying it out before wiring
anything up. Serve `dist/` from any static file server (or unzip the HACS
release and open it directly) and load `index.html`:

```bash
npm run build
cd dist && python3 -m http.server 8080   # or any static server
# open http://localhost:8080/index.html
```

On the connect screen, click **Use offline — no Home Assistant**. The full
editor works: place walls, furniture, roamers, demo avatars, and unbound
fixtures (which you can still toggle locally); weather can pull from
Open-Meteo directly. Device bindings simply show no live state. Everything —
including multiple named configurations — is stored **in this browser**
(localStorage), so use **Settings ▸ Data ▸ Export / Import** to move a
configuration between browsers or machines. To reconnect to Home Assistant
later, open **Settings ▸ Connection** and click **Exit offline mode**.

## Sweet Home 3D import

Three ways in, from cheapest to most useful:

- **Structural import (recommended)**: **Settings ▸ Data ▸ Import Sweet Home 3D
  (`.sh3d`)** reads the native archive and builds **real, editable Diorama
  data** — levels become floors (stacked and registered), walls become walls,
  rooms become named rooms, doors and windows snap onto their host walls, and
  furniture maps to the closest Diorama kind at its real footprint. Unmatched
  pieces are skipped rather than dropped in as blank blocks, and anything
  ambiguous (an open-plan room with no enclosing walls, say) is reported as a
  warning instead of failing the import.
- **Plan underlay (2D)**: export your plan as SVG (Plan → Export to SVG
  format), then upload via the sidebar's **Background image** section. SVG
  stays crisp at any zoom.
- **Full 3D model (visual shell)**: export via 3D view → Export to OBJ format,
  then import the `.obj` (plus `.mtl` for colors) in the sidebar's **3D Model**
  section. Sweet Home 3D exports centimeters, so the default 10 mm/unit scale
  is 1:1. Adjust X/Y offset + rotation to line the model up with your floor.
  Imported materials are converted to the toon look so the shell matches the
  rest of the scene. Model geometry is stored in the browser (IndexedDB);
  placement settings sync through HA.

## 3D scene appearance

**Settings ▸ Display**: lighting presets (Night / Day / Dusk), floor color,
procedural floor textures (wood / tile / concrete), wall color. Night keeps the
original dark look where bound HA lights dominate; Day/Dusk add hemisphere +
sun lighting for exterior-style renders. Lighting can also follow the clock
(via `sun.sun`) or a lux sensor automatically, and each floor can override the
global colors.

Also here: the **glass-house** doll's-house view and wall cutaway, auto-follow
and cinematic-orbit cameras, camera pivot / free-movement and FOV, the sky
backdrop, ground level, the compass, and background text. Per-floor elevations
and the yard fill live in the sidebar's **Floors** section.

## Storage

**Home Assistant is the source of truth.** The full diorama (floors, walls,
furniture, sensors, motion sensors, lights, switches, bg images) is persisted
in HA's `frontend.user_data` table — the same plumbing HA's own UI uses for
sidebar order / theme prefs. This means:

- Data syncs across browsers / devices automatically.
- It survives browser data clear.
- It's included in HA backups.

Diorama stores a **registry of named configurations**, not a single plan: an
index at `diorama-configs` plus one full body per configuration at
`diorama-cfg-<id>`. Manage them under **Settings ▸ Data ▸ Configurations**
(save as, new, rename, import, export, delete) — handy for keeping a
work-in-progress redesign beside your live home.

`localStorage` (key `diorama:store:v1`) is the **local cache** of the active
configuration so the panel paints instantly on load, then reconciles with HA
once the WebSocket auth completes. If HA returns a payload, it replaces the
cache. If HA is empty (first launch), the local cache is pushed up.

Saves are debounced 600 ms before being pushed to HA so rapid edits (dragging
a vertex, sliding the opacity slider) don't hammer the WS.

Connection settings live in `localStorage` under `diorama:url` and
`diorama:token`.

## Supported entity kinds

| Element       | Bind to              | What it surfaces |
|---------------|----------------------|------------------|
| mmWave sensor | LD2450 ESPHome device| Live multi-target tracking, in-place zone/object editing, object halos, sensor pose (height + tilt from HA), animated figures in 3D. Per-sensor color + avatar pool. |
| Motion sensor | `binary_sensor.*` (or any entity) | Configurable detection cone (heading / FOV / range); cone glows when ON. Per-sensor **color** + **intensity**. Optional room-confined **AI avatar** or always-on **demo avatar**. |
| Env sensor    | any `sensor.*`       | Value chip (temperature / humidity / CO₂ / CO / PM / VOC / pressure / illuminance / radon / sound / NO₂ / O₃ / AQI); icon + color auto-detected from device class; health-threshold amber/red. Also feeds the per-room temperature heat-map. |
| Info card     | any entity (or none) | Generic value plaque — live state + unit as crisp text, colored/flashing by **value rules**; entity-free clock and date modes. Wall-mounts, table-mounts or stands on the floor. |
| Action button | any service target   | A dispatcher, not an entity: fires `button.press`, `scene.turn_on`, `script.turn_on`, `automation.trigger`, a domain-aware toggle, or any custom `domain.service` with JSON data. Optional confirm. |
| Alarm keypad  | `alarm_control_panel.*` | State-colored wall plate (arming / pending / triggered pulses); tap opens a Disarm / Arm Home / Arm Away card with optional code. |
| Thermostat    | `climate.*`          | Wall plate showing current → target, mode-colored; tap opens setpoint steppers, HVAC modes, fan and preset. Active heating/cooling blows visible **airflow particles** from a vent. |
| Wall calendar | one or more `calendar.*` | Read-only agenda plaque; polls `calendar.get_events` for the real upcoming list, not just the next-event state. |
| Safety sensor | `binary_sensor.*`    | Smoke / CO / gas ceiling detectors and floor **leak** pucks; alarm pulses rings, and a leak grows a spreading puddle. |
| Alert beacon  | `alert.*` or any `binary_sensor.*` | Ceiling beacon: active (pulsing red) / acknowledged (amber) / idle. Tap acknowledges. Pairs with the topbar **Alert Center** (HA persistent notifications + Repairs). |
| Robot         | `vacuum.*` / `lawn_mower.*` | Dock fixture plus a live rig that roams: real Roborock map position when calibrated, GPS for mowers, simulated otherwise. Tap starts or docks. Optional **Valetudo** room map with tap-to-clean. |
| Camera        | `camera.*`           | Body + lens with a FOV wedge; sidebar snapshot, alert popups from a bound motion `binary_sensor`, and optional **Frigate** calibration turning detection boxes into real floor targets. |
| Projector     | `media_player.*` / `switch.*` / `light.*` | Ceiling projector with a throw wedge onto a chosen TV/screen piece while projecting. |
| Water valve   | `valve.*` / `switch.*` / `binary_sensor.*` | Pipe run + hand-wheel that rotates with openness; animated water flow while open. State-aware open/close (never a blind toggle). |
| Smart plug    | `switch.*` / `light.*` (+ optional power `sensor.*`) | Wall outlet that wall-snaps flush; energized glow scaled by live watts. |
| Sprinkler zone| `switch.*` / `valve.*` / `binary_sensor.*` | Head with a spray arc — pulse, sweeping rotor, or drip — throwing real droplets in 3D while running. |
| Flagpole      | optional percent / `cover.*` | Waving cloth flag from a 16-flag library, at full or half mast, rippling with the live wind. |
| Presence zone | `binary_sensor.*`    | A drawn polygon (FP2 / Frigate zone shape) that glows when occupied, in 2D and 3D. |
| BLE proxy     | ESPHome/Shelly proxy device | Antenna puck fixture; its Bermuda distances feed panel-side trilateration for indoor Bluetooth positioning. |
| Light         | `light.*`, or **logic rules** on any entity | Click toggles; dblclick → color/brightness/temp. Per-fixture height, radius, intensity, tilt, and **26 kinds** — bulb, pendant, spot, recessed, round, tiered, sconce/wall-sconce, step, bowl/jar/oval, strip, under-cabinet, LED string, floor lamp, ceiling fan (+ light), floodlight, in-ground uplight, ground spot, heat lamp, exhaust (ceiling/wall/+light), fireplace. |
| Switch        | `switch.*` *or* `light.*` | Click toggles; wall-snaps and gangs. Fans expose power + % slider; TVs (`media_player`) expose play/pause, volume, source. |
| Furniture     | (optional appliance / TV / media entity) | ~96 kinds across furniture, appliance, bathroom, outdoor, theater and vehicle: seating, sectionals, tables/desks, beds, casework (drawer pulls), spec-size appliances, mechanical plant, bathroom fixtures, stairs, counter-mounted gadgets, rugs, plants, trees, vehicles and EV chargers — plus **custom objects** built from primitives. Sittable pieces anchor seating; some anchor activities. Per-piece extras bind too: fridge door sensors, oven temperature, plant soil moisture, appliance power, mail counts, TV bias light and **screen surfaces** (now-playing / news ticker / weather). |
| Doors         | `binary_sensor.*` / `cover.*` (+ optional `lock.*`) | **8 kinds** — swing, garage, gate, sliding, pocket, double, french, sliding-glass — cutting real wall openings and opening proportionally to a cover's position. Clickable deadbolts; doorbell bindings ring visible pulses. |
| Windows       | `binary_sensor.*` (+ optional shade / curtain `cover.*`) | **5 styles** — single, double-hung, casement pair, sliding, picture — with per-window sill/height, roller shades, and interior curtains in three styles. |
| Person / pet  | Bluetooth device + `person.*`/`device_tracker.*` | Registry entry with a name, color, and avatar (incl. cat/dog pet rigs); drives BLE figures, fused radar figures, and GPS pins. |

Drop on the canvas from the sidebar or the visual **placement toolbar** (a
bottom dock with category tabs and real 3D thumbnails), then bind via the
entity picker (filterable by domain or by HA device, searchable by entity /
friendly / device name). Click toggles, double-click opens the deeper config or
the bind picker. **Unbound** fixtures stay interactive — they hold a local
state you can toggle, so you can design and demo a home before wiring anything
up.

Not everything is a bound fixture. Rooms, **ground paint** (grass / rock /
concrete / blacktop / mulch / sand / water, with terraced elevations), paths
and driveways, **pools and spas**, floor voids, geo **landmarks**, rulers, and
decorative **background text** (skywriting, a banner-towing plane, mowed lawn
text, a message train, a news chopper) are all placed the same way and need no
entity at all.

## Interactions

### 2D
- **Wheel**: zoom anchored at cursor.
- **Drag with middle / right mouse, or Space + left**: pan.
- **Touch**: 1 finger = mouse-equivalent; 2 fingers = pinch-zoom + pan.
- **⟳ Reset view** (bottom-left button) or **Ctrl/Cmd + 0**: re-fit to floor.
- **Click on a bound light/switch**: toggle (small movement ≤ 30 mm = click; larger = drag-to-move).
- **Double-click on a bound light**: color/brightness/temp modal.
- **Double-click on an unbound fixture**: open the entity picker.
- **Tools**: Select, Wall, mmWave, Motion, Env, Info, Action, BLE, Alarm,
  Calendar, Thermostat, Safety/Siren, Alert beacon, Robot, Camera, Projector,
  Valve, Sprinkler, Flagpole, Plug, Presence zone, Ground area, Path/drive,
  Pool/spa, Floor void, Ruler, Furniture, Light, Switch, Door, Window, Delete.
  Keyboard shortcuts cover the eight most-used: `1` Select, `2` Wall,
  `3` mmWave, `4` Motion, `5` Furniture, `6` Light, `7` Switch, `8` Delete
  (`m` also picks Motion). Hotkeys are ignored while you're typing in a field.
- **Delete / Backspace**: removes the current selection (vertex → furniture →
  sensor → fixture → zone → ground → void), and **Ctrl/Cmd + Z** / **Shift+Z**
  undo and redo.

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
- **Zone polygon round-trip**: ESPHome treats vertex `(0, 0)` after slot 0 as
  a sentinel for "no more vertices" — don't place a real vertex at origin
  past the first slot.
