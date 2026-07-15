# EV Charger Fixture — Research

## 1. Summary

An EV charger ("EVSE" — Electric Vehicle Supply Equipment) fixture places a Level-2
home/garage charging unit on the plan, bound to whatever HA integration the user
happens to have (Wallbox, Peblar, OCPP, OpenEVSE, ChargePoint, …), and gives it a
spatial presence: a wall- or pedestal-mounted box near the garage/driveway wall,
a coiled cable that pays out and animates while charging, a status LED that
changes color with charger state, and live power/current/energy readouts.

This fits Diorama's spatial-panel thesis exactly the way robot vacuums, safety
sensors, and the alarm keypad already do: an entity list buried in a dashboard
card tells you a number, but a charger *is* a real object bolted to a real wall
in a real spot in the garage — seeing its LED glow green from across the 3D
scene, and seeing the cable go taut when the car starts pulling power, is
legible in a way `sensor.wallbox_charging_power: 7.4 kW` isn't. It also slots
cleanly next to the already-shipped robot vacuum/mower fixtures (device with a
dock position + live state) and the alarm keypad (wall fixture + state-colored
screen + click-to-actuate modal) — this feature is mostly recombining patterns
Diorama already has, not inventing new ones.

## 2. Home Assistant data model

There is **no single "EV charger" domain or device_class** in HA — every
vendor integration expresses charging state through its own mix of `sensor`,
`binary_sensor`, `switch`, `number`, and `lock` entities. The right design is a
**normalized shape** (below) that Diorama's fixture binds to via a handful of
optional entity-id fields, mirroring how `weather.ts` normalizes
entity/sensors/Open-Meteo into one `WeatherNow`, and how the alarm/lock/robot
fixtures already bind heterogeneous vendor entities into one state resolver.

### 2.1 Core vs custom integrations

| Integration | Core or HACS | Notes |
|---|---|---|
| **Wallbox** | Core (`homeassistant/components/wallbox`) | Cloud polling (MyWallbox portal), ~90 s refresh per charger. [home-assistant.io/integrations/wallbox](https://www.home-assistant.io/integrations/wallbox/) |
| **Peblar** | Core (`homeassistant/components/peblar`) | Local REST polling: 10 s (sensors/binary_sensors), 5 min (config), 2 h (firmware). [home-assistant.io/integrations/peblar](https://www.home-assistant.io/integrations/peblar/) |
| **OpenEVSE** | Core (`homeassistant/components/openevse`) | Local Push (WebSocket) with a 5-min poll fallback. [home-assistant.io/integrations/openevse](https://www.home-assistant.io/integrations/openevse/) |
| **OCPP** (`lbbrhzn/ocpp`) | HACS (custom) | Generic bridge for any OCPP 1.6j/2.0.1/2.1 charger — this is the closest thing to a *protocol-level* vendor-agnostic source, since OCPP itself standardizes status/measurand vocabularies. [github.com/lbbrhzn/ocpp](https://github.com/lbbrhzn/ocpp), [docs](https://lbbrhzn.github.io/ocpp/) |
| **ChargePoint** (`mbillow/ha-chargepoint`) | HACS (custom) | Cloud polling against the ChargePoint consumer account API. |

Given the brief (Wallbox + Peblar are the only *core* integrations), the
fixture's field set is scoped to what those two — plus OpenEVSE and OCPP as
useful cross-checks for a truly vendor-agnostic shape — actually expose. All
four agree closely enough that one normalized model covers them.

### 2.2 Normalized entity roles

Every field below is **optional** on the fixture (unbound = fixture renders in
a neutral "unbound/demo" look, exactly like Diorama's other optional-binding
fixtures). Bind by entity id via the standard `<diorama-entity-picker>`
(domain-filtered).

| Diorama field | Domain | Vendor examples | Unit / values |
|---|---|---|---|
| `stateEntity` | `sensor` | Wallbox `sensor.<x>_status_description` (free text: e.g. Charging, Ready, Paused, Waiting in Queue, Locked, Error, Discharging — see 2.3); Peblar `sensor.<x>_state` (`charging`/`error`/`fault`/`no_ev_connected`/`suspended`/`invalid`); OCPP `sensor.<x>_status_connector` (OCPP `ChargePointStatus` enum: `Available`/`Preparing`/`Charging`/`SuspendedEV`/`SuspendedEVSE`/`Finishing`/`Reserved`/`Unavailable`/`Faulted`) | free-form string, vendor-specific |
| `connectedEntity` | `binary_sensor` | OpenEVSE "Vehicle Connected"; ChargePoint "cable state" | on = plugged in |
| `errorEntity` | `binary_sensor` | Peblar "Active error" (disabled by default); OpenEVSE safety-trip diagnostics | on = fault |
| `powerEntity` | `sensor`, `device_class: power` | Wallbox `sensor.<x>_charging_power` (kW); Peblar `sensor.<x>_power` (W, + per-phase); OCPP `Power.Active.Import`; OpenEVSE `power` | W (normalize kW→W like `stateMm` normalizes distance units) |
| `currentEntity` | `sensor`, `device_class: current` | Peblar `sensor.<x>_current` (+ phase 1/2/3); OCPP `Current.Import`; OpenEVSE `amps` | A |
| `currentLimitEntity` | `number` | Wallbox "Max Charging Current" (admin-gated); Peblar "Charge limit" (6A..max, 1A step); OCPP "Maximum Current" number; OpenEVSE "Charge Rate" | A — **writable**, see 2.4 |
| `sessionEnergyEntity` | `sensor`, `device_class: energy` | Peblar "Session energy" (resets per session); Wallbox `added_energy`; OCPP `Energy.Session` | kWh |
| `lifetimeEnergyEntity` | `sensor`, `device_class: energy`, `state_class: total_increasing` | Peblar "Lifetime energy" (HA energy-dashboard recommended sensor); OCPP `Energy.Active.Import.Register` | kWh |
| `socEntity` | `sensor`, `device_class: battery` | **Vendor-fragmented — see 2.5.** OpenEVSE exposes vehicle "State of charge (%)" when the EVSE itself has vehicle telemetry; otherwise this must come from a *vehicle* integration (Tesla, Kia Uvo, Mercedes ME, …) or a manual `input_number` helper, not from the charger integration | % |
| `chargeSwitchEntity` | `switch` | Wallbox "Pause/Resume charging"; Peblar "Charge" switch; OCPP "Charge Control" switch | on = charging enabled/active |
| `lockEntity` | `lock` | Wallbox "Charger lock" (connector/charger lock, admin-gated) | locked/unlocked — same domain Diorama already drives for door locks |
| `costEntity` | `sensor` | Wallbox "Cost" (session cost, local currency) | optional cost chip |

### 2.3 Status vocabularies (why a normalizer is needed)

- **Peblar** `State`: `charging`, `error`, `fault`, `no_ev_connected`,
  `suspended`, `invalid`.
- **OCPP** connector status (`sensor.<id>_status_connector`, entity-id pattern
  `sensor.<charger_id>_status_connector` single-connector or
  `sensor.<charger_id>_connector_<n>_status_connector` multi-connector):
  `Available`, `Preparing`, `Charging`, `SuspendedEV`, `SuspendedEVSE`,
  `Finishing`, `Reserved`, `Unavailable`, `Faulted` — this is literally the
  OCPP 1.6 `ChargePointStatus` enum, so it's the most standardized vocabulary
  available and a good Rosetta stone for the others.
- **Wallbox** `status_description` is free text pulled from the MyWallbox
  cloud and has drifted over time (community threads document strings like
  "Waiting in queue by Eco-Smart", "Locked", historically-missing
  "waiting_to_unlock" — see [GH #69617](https://github.com/home-assistant/core/issues/69617)); treat it as a
  best-effort *label* and derive the actual state machine from
  `connectedEntity` + `powerEntity` + `chargeSwitchEntity` where possible.
  The full `ChargerStatus` enum, read directly from
  [`homeassistant/components/wallbox/const.py`](https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/wallbox/const.py)
  (`CHARGER_STATUS_DESCRIPTION_KEY = "status_description"`,
  `CHARGER_STATUS_ID_KEY = "status_id"`), is: `Charging`, `Discharging`,
  `Paused`, `Scheduled`, `Waiting for car demand`, `Waiting`, `Disconnected`,
  `Error`, `Ready`, `Locked`, `Locked, car connected`, `Updating`, `Waiting in
  queue by Power Sharing`, `Waiting in queue by Power Boost`, `Waiting MID
  failed`, `Waiting MID safety margin exceeded`, `Waiting in queue by
  Eco-Smart`, `Unknown` — these are plain strings (no `device_class`/
  `state_class` typing), so match them verbatim/case-sensitively. Note
  `Locked, car connected` is the one string that distinguishes "plugged in,
  idle" from `Ready`/`Disconnected` for this vendor — there is still no
  discrete boolean for it.
- **OpenEVSE** exposes a `Status` sensor plus dedicated binary sensors
  (`Vehicle Connected`, `Divert Active`, `Shaper Active`, `Limit Active`).

Recommended normalized enum (`EvChargerState`):
`unavailable | idle | plugged_idle | charging | finishing | error`, resolved
in priority order: `errorEntity`/error-ish state string → `error`;
`stateEntity` unavailable/offline → `unavailable`; `stateEntity` matches a
charging-family string OR (`powerEntity` reading > ~50 W) → `charging`;
`connectedEntity` on OR a "preparing/suspended/waiting" family string →
`plugged_idle`; else → `idle`. This mirrors the exact shape of
`resolveScenePreset`/`weather.ts`'s vendor-normalization heuristics already in
the codebase — build it as a small pure function (e.g.
`resolveChargerState(states, cfg)` in `geometry.ts` or a new `ev-charger.ts`)
so it's unit-testable the same way `fusion.ts`/`weather.ts`/`geo.ts` are, with
its own `ev-charger-test.html` page.

### 2.4 Actions / services

No new bespoke services are needed — every control surface is a standard HA
domain action Diorama already knows how to call:

- **Start/stop charging** → `switch.turn_on` / `switch.turn_off` /
  `switch.toggle` on `chargeSwitchEntity`
  ([switch domain docs](https://www.home-assistant.io/integrations/switch/)).
  This is exactly `Planner.toggleEntity`'s existing generic domain dispatch —
  **zero new code** for basic start/stop.
- **Lock/unlock the connector** → `lock.lock` / `lock.unlock` on
  `lockEntity` — Diorama already implements this exact call pair for door
  locks (`Planner.doorLockState`/`toggleDoorLock`); the EV charger lock is a
  copy of that, not a new HA integration point.
- **Set current limit** → `number.set_value` on `currentLimitEntity` with
  `{ value: <amps> }` — Diorama already has a generic writer for this,
  `Planner.writeCoord(entityId, value)` (currently used for LD2450 sensor
  mount height/angle numbers), directly reusable for the charge-current
  slider.
- **OCPP-only extras** (HACS integration, not required for the vendor-agnostic
  fixture, but worth knowing about): `ocpp.set_charge_rate` (`devid`,
  `limit_amps`/`limit_watts`, `conn_id`, `custom_profile`),
  `ocpp.clear_profile`, `ocpp.trigger_message`, `ocpp.update_firmware`,
  `ocpp.configure`, `ocpp.get_configuration`, `ocpp.request_diagnostics`,
  `ocpp.data_transfer` — service names + params per
  [`services.yaml`](https://github.com/lbbrhzn/ocpp/blob/main/custom_components/ocpp/services.yaml).
  Out of scope for v1; `set_charge_rate` is a reasonable v2 "Target power"
  slider hook if the OCPP path is prioritized later.

### 2.5 What's NOT available over the HA WebSocket API (gaps)

- **Target state-of-charge is not a charger concept.** None of Wallbox,
  Peblar, OCPP, or ChargePoint expose a "charge to N%" control — that
  requires the *car* to negotiate it (ISO 15118 / vendor telematics), which is
  why HA's EV-smart-charging ecosystem (`evcc`, `ev_smart_charging`,
  Mercedes-ME's `mbapi2020.battery_max_soc_configure`) treats target-SoC as a
  **vehicle-integration** field (Tesla, Kia Uvo, Mercedes ME) or a manual
  `input_number` helper the user wires up themselves, never as part of the
  charger device. **Design implication:** `socEntity` and an optional
  `targetSocEntity` should be modeled as loosely-coupled optional bindings —
  "if you happen to have a sensor/number that reports it, plug it in" — not as
  something the charger fixture can assume exists. This is analogous to how
  Diorama's `People` registry loosely binds a `person`/`device_tracker` entity
  rather than assuming HA has one canonical "person" source.
- Wallbox's cloud-polling nature means state lags real-world plug/unplug
  events by up to ~90 s; there's no local push option for Wallbox today.
- OCPP's per-connector device split (one HA *device* per connector on
  multi-connector chargers) means a single physical charger can appear as N
  devices; the fixture's binding UI should filter to one connector's entities,
  same problem class as Roborock's map-camera entity picking.
- No integration surfaces cable-plugged-but-not-authorized vs.
  plugged-and-charging as a single clean boolean — that distinction is
  reconstructed from the state-string enum (2.3), not a dedicated attribute.

## 3. Real-world / visual reference

**Wall-mounted units** (the common home Level-2 charger form factor):

| Unit | W × H × D | Cable length | Mount |
|---|---|---|---|
| Wallbox Pulsar Plus | ~198 × 201 × 99 mm | 7.6 m (25 ft) | wall, vertical rectangle, rounded corners, LED halo ring around a circular badge on the face |
| ChargePoint Home Flex | 179 × 180 × 132 mm | 7.0 m (23 ft) | wall, similar squat rectangular box, status LED bar |

General shape: a flat-fronted rounded-corner box roughly 180–200 mm square and
100–130 mm deep, mounted to a wall, with a cable management hook/holster
below or beside it, and the charging cable coiled when idle (looping down and
back up, hung on the holster) or hanging loose/extended when in use, ending in
a J1772 (US) or Type 2 (EU) connector head — a chunky plug roughly the size of
a hand, held in a cradle on the unit when parked.

**Mounting height** (NEC 625.29 / general practice): connector should sit
**450–1200 mm (18–48 in)** above grade — 450 mm minimum indoors, 600 mm
minimum outdoors, 1200 mm max for reach/ADA. A reasonable default mount
height for the fixture's origin is **~900 mm** (comfortable garage height, the
same neighborhood as a light switch/socket fixture already in Diorama).

**Pedestal / bollard units** (garage-less driveway installs, less common for
residential but real — commercial Level-2 stations like ClipperCreek's
pedestal line, or a home install on a detached post): a ~150 mm square post
roughly 1000–1200 mm tall topped with a similar head unit to the wall-mount,
same cable/holster arrangement, freestanding rather than wall-snapped.

**Color / LED conventions** (varies by vendor but a broadly consistent
pattern worth encoding as *defaults*, overridable like other Diorama fixture
colors):
- **White/dim** or **off** — idle / powered, not connected.
- **Green** (steady) — ready/idle plugged in *or* charge complete, depending
  on vendor (Wallbox: steady green = ready to charge before connecting).
- **Blue** (steady or slow pulse) — connected/authenticated, not yet drawing
  power, or scheduled/waiting (Wallbox uses blinking turquoise for
  "waiting for schedule").
- **Green pulse/blink** — actively charging (most common convention;
  Wallbox blinks dark blue instead — vendor split, so treat this as a
  **configurable per-fixture accent**, defaulting to the green-pulse
  convention already used elsewhere in Diorama for "active" states, e.g.
  appliance-in-use LEDs).
- **Red** (blink) — fault/error.

## 4. Diorama visualization & animation design

### 4.1 Data & types

- New per-floor array `Floor.evChargers: EvCharger[]`, `repairFloor` +
  `defaultFloor` backfill `[]` — floor-scoped exactly like `RobotFixture`,
  `AlarmPanel`, `SafetySensor`, `CameraFixture`.
- `EvCharger` fields: `id`, `x`, `y`, `rotation` (deg, wall-normal like
  switches/alarm panels), `mount: 'wall' | 'pedestal'` (default `'wall'`,
  picker like `Door.kind`), `height?` (mm above floor, default 900 wall /
  1200 pedestal top), `label?`, `locked?`, `hidden?`, plus the optional
  binding ids from §2.2 (`stateEntity`, `connectedEntity`, `errorEntity`,
  `powerEntity`, `currentEntity`, `currentLimitEntity`, `sessionEnergyEntity`,
  `lifetimeEnergyEntity`, `socEntity`, `chargeSwitchEntity`, `lockEntity`,
  `costEntity`), `lockLocalState?` (mirrors `Door.lockLocalState` for the
  unbound-lock case), `localState?: 'idle' | 'charging'` (unbound
  demo/local-control, joining the existing Door/Window/Light/Switch/Furniture
  `localState` convention), `chargeAmps?` (last-known current-limit value for
  the unbound demo slider), `color?` (accent override, default a warm green
  like the appliance-in-use LED).
- All bound ids go into `Planner._isSlowEntity` as config-path (matches every
  other fixture's bound-id list) — `powerEntity`/`currentEntity` readings are
  chatty but only the *sidebar readout* needs the config-path re-render (the
  2D RAF reads state live regardless, same rule already stated for `env`
  sensors and `powerEntity` on furniture).

### 4.2 2D canvas

- `drawEvChargers(ctx, view, chargers, states)` in `canvas-render.ts`, called
  from `drawAll` gated on a `evChargers` — or, following the established
  convention that new small device fixtures ride the **`sensors`** layer
  rather than inventing a new layer key (alarm panels, robots, safety
  sensors, cameras, BLE proxies all do this) — gate on `layers.sensors`.
- Icon: a small rounded rect (wall-mount, drawn flush against the nearest
  wall like a switch plate) or a post+head glyph (pedestal), state-colored
  face swatch via a new `EV_CHARGER_STATE_COLORS` map in `geometry.ts`
  (same idiom as `ALARM_STATE_COLORS`/`alarmStateColor`).
- A short coiled-cable glyph (simple nested-arc doodle) beside the unit when
  `idle`/`plugged_idle`; when `charging`, draw a cable **curve** (quadratic
  Bezier sagging toward the ground) from the unit to a point ~1.2–1.8 m out
  along its front normal (the "parking spot" — see §6 for a future
  vehicle-anchor upgrade) with a small traveling highlight dash animated via
  `performance.now()` (identical technique to the alarm arming pulse / doorbell
  expanding rings / safety-sensor alarm rings — all already `performance.now()`-
  driven, RAF-repainted).
- Chips: `kW`/`A` text chip while charging (same chip idiom as the oven temp
  chip / env sensor value chip); a thin battery-fill bar under the unit only
  when `socEntity` is bound (else omitted entirely — don't imply a
  capability that isn't there).
- Click-vs-drag: standard fixture recipe. Click → `Planner.toggleItem`-style
  dispatch to the charge switch (bound) or flip `localState` (unbound);
  dblclick → open a small `<diorama-ev-charger-modal>` (mirrors
  `<diorama-alarm-modal>`) with live numbers + Start/Stop + a current-limit
  slider (`writeCoord`) + Lock/Unlock (mirrors the door-lock badge action).
- Battery badge system does **not** apply (chargers are mains-powered, not
  battery devices) — no `batteryFor` hookup needed.

### 4.3 3D scene

- New group `_evChargerGroup` (declared, `scene.add`'d, cleared in
  `clearTransientGroups`, disposed in `destroy`, visibility folded into
  `setLayerVisibility` under the `sensors` flag — exact same wiring as
  `_bleGroup`/`_safetyGroup`/`_alarmGroup`).
- `updateEvChargers(chargers, stateProvider)` builder, dirty key
  `_keyEvCharger` = `configRev` + a compact per-charger state hash (state
  enum + power bucket (50 W steps, matching the existing power-glow bucketing
  convention) + current bucket + soc bucket) — same "hash the live-state
  inputs into the dirty key" pattern already used for the appliance-state
  hash and camera-alert picture+bucket hash.
- **Body** (through `_mat()` `MeshToonMaterial`, never `MeshStandardMaterial`):
  wall mount = a flush-mounted box (~200×200×110 mm) with a circular emissive
  LED badge on the face (state color) — built and wall-snapped on
  drop/move-release exactly like `snapSwitchToWall`/`snapFloodlightToWall`
  (flush offset = `WALL_HALF + halfDepth`, rotation `atan2(nx, ny)`, no
  ganging needed — chargers don't cluster like switches). Pedestal mount =
  a post (150×150×~1100 mm) + the same head unit on top, freestanding like a
  robot dock (no wall-snap).
- Inverted-hull outline shell via `_addOutlines` (skip the LED badge —
  emissive small parts already carry `userData.outlineSkip` like other
  emissive eyes/badges in the codebase).
- **Cable + connector prop**: a `TubeGeometry` along a `CatmullRomCurve3`
  (2–3 control points) — idle state: a short coiled/looped static curve
  hanging from a holster hook beside the unit (no animation, built once per
  key change). Charging state: the curve's end control point eases (own
  lerp, τ ≈ 0.3 s, NOT part of the dirty key — persistent per-instance mutation
  like the humanoid rig springs) out toward the ground-level "parking spot"
  point, sagging under a simple mid-point droop; a small emissive bead
  (reuse the blob-shadow-texture-style shared `CanvasTexture` idiom, or a tiny
  sphere) travels along the curve's arc length via `(nowS % period)/period`,
  the same technique as the fireplace flicker / fused-target scan visuals.
  **A charging charger must force its per-frame update every tick** the same
  documented way an ON fireplace forces `updateLightsSwitches` every frame —
  add this as a new named exception alongside the fireplace one in the
  dirty-key rebuild rules, since the traveling-bead animation needs
  per-frame position updates that a `configRev`-gated dirty key won't give it.
- Blob shadow: wall mount skips it (like sconce lights skip the floor disc);
  pedestal mount gets one (it's a floor-standing object).
- Optional status **text sprite** (kW reading) above the unit while
  charging, built via the same camera-facing `CanvasTexture` `THREE.Sprite`
  idiom as env sensors/now-playing cards, disposed via `_disposeSpriteMaps`
  before every rebuild/clear/destroy (same pairing rule).
- Raycast: `userData.kind = 'evcharger'` on both body and LED badge (same
  "hit anywhere in the fixture" pattern as lights); walker climbs to the
  first `evcharger`-tagged ancestor. Click → `toggleItem`-equivalent (charge
  switch or `localState`); dblclick → the ev-charger modal.

### 4.4 Sidebar

- `_section('evcharger', 'EV Charger', …)` (or grouped under a new "Vehicle"
  slug if a future car/garage batch wants to share it — but ship standalone
  first). Tool button in `TOOLS` (glyph suggestion: 🔌 or 🚗 — 🔌 reads more
  clearly at small size against the existing glyph set).
- Mount dropdown (wall/pedestal, auto-adjusts default height like the garage
  door width auto-bump), height input, rotation (wall mount only, or derived
  from wall-snap), label, lock toggle.
- Binding rows for every optional entity in §2.2, using
  `<diorama-entity-picker>` domain-filtered per field (`sensor` for
  state/power/current/energy/soc/cost, `binary_sensor` for
  connected/error, `number` for current limit, `switch` for the charge
  switch, `lock` for the connector lock) — this is the same multi-row
  binding block pattern the robot-vacuum and camera sections already use for
  their several optional entity ids.
- Live readout lines (kW / A / kWh session / kWh lifetime / SoC % if bound),
  a `local: on/off` badge when unbound (matches the existing
  Door/Window/Light/Switch local-control badge convention).

## 5. Integration steps (canvas-fixture recipe checklist)

1. **types.ts** — add `EvCharger` interface + `mount`/binding fields;
   `Floor.evChargers: EvCharger[]`.
2. **geometry.ts** — `EV_CHARGER_STATE_COLORS` + `evChargerStateColor()`
   (mirror `ALARM_STATE_COLORS`); default dims/height constants; a pure
   `resolveChargerState(states, cfg)` normalizer (§2.3) — unit-test it in a
   new `test-pages/ev-charger-test.html` the same way `fusion.ts`/`geo.ts`
   have dedicated pure-function test pages; `snapEvChargerToWall()` (mirror
   `snapFloodlightToWall`/`snapSwitchToWall`, no ganging).
3. **repairFloor / defaultFloor** — backfill `evChargers: []`.
4. **canvas-render.ts** — `drawEvChargers()`; register in `drawAll` under the
   `sensors` layer gate; export chip/hit-rect metrics if needed like the env
   sensor scale-handle pattern.
5. **canvas-hit.ts** — `hitEvCharger()`.
6. **canvas-interact.ts** — mousedown/move/up drag case (`evcharger` kind),
   wall-snap on drop/release for `mount==='wall'`, free placement for
   `mount==='pedestal'`, delete-tool branch, `evcharger` tool cursor, click-vs-
   drag → `toggleItem`-style dispatch, dblclick → modal open.
7. **modals.ts** — `<diorama-ev-charger-modal>` (status, Start/Stop,
   current-limit slider via `Planner.writeCoord`, Lock/Unlock via
   `lock.lock`/`lock.unlock`, mirrors `<diorama-alarm-modal>` structure).
8. **sidebar.ts** — `_section('evcharger', …)`, `TOOLS` entry, binding rows,
   mount/height/label/lock controls, live readouts, local badge.
9. **planner.ts** — bound ids into `_isSlowEntity`; `Planner.evChargerState`
   / `toggleEvCharger` / `evChargerLockState` / `toggleEvChargerLock` (thin
   wrappers mirroring the existing door-lock pair); no new `HaApi` methods
   needed (switch/lock/number domains are already generically callable).
10. **three-renderer.ts** — `_evChargerGroup` declared + added to
    `scene.add`/`clearTransientGroups`/`destroy`; `updateEvChargers()`
    builder (body, LED badge, cable curve + traveling bead, outline shell,
    blob shadow for pedestal, optional kW sprite); raycast tagging +
    walker case; register the per-frame "charging forces rebuild" exception
    next to the fireplace one.
11. **three-view.ts** — `_keyEvCharger` dirty key wiring (configRev + state
    hash), `setLayerVisibility` folds `_evChargerGroup.visible` into
    `sensors`, call `updateEvChargers` from `_tickOnce`.
12. **CLAUDE.md** — add a short load-bearing section once shipped (mirrors
    every other batch's write-up) so future sessions know the dirty-key/
    per-frame exception exists.

## 6. Potential additional features

- **Vehicle/car anchor**: a new lightweight `outdoor`/`garage` FurnitureKind
  (a parked-car box, or a simple wedge silhouette) that the charging cable
  could route to precisely, rather than a fixed offset point — turns the
  cable animation from "generic gesture" into "actually plugged into that
  car". Needs a car object to exist first (doesn't today — flagged as an
  open dependency, not a blocker for v1).
- **Home energy dashboard cross-reference**: since `lifetimeEnergyEntity` is
  explicitly the HA energy-dashboard-recommended sensor for at least Peblar,
  a small "adds to your HA Energy dashboard" hint in the sidebar could help
  users realize they should also add it there — informational only, no
  Diorama-side energy math.
- **Solar-charging mode indicator**: Wallbox exposes an Eco/Full-Solar/Off
  select; Peblar exposes a similar `Smart charging` select
  (`default`/`fast_solar`/`smart_solar`/`pure_solar`/`scheduled`) — a small
  sun glyph badge when in a solar-priority mode would be a cheap, legible
  add reusing the existing glyph-badge idiom (battery badge, alarm badge).
- **Cost/session chip**: Wallbox's `cost` sensor (session cost in local
  currency) could feed a small `$` chip next to the kW chip while charging.
- **Scheduled-charge indicator**: several vendors report a "waiting for
  schedule" state distinctly from "plugged in idle" — worth a distinct LED
  treatment (slow amber pulse) if bindable, since it explains to a user why
  a plugged-in car isn't charging.
- **Multi-connector (OCPP) support**: if a user has a commercial-style
  multi-port charger, the fixture could support binding N independent
  connector entity-sets to one physical fixture with a small per-port LED
  row — deferred, since it's an OCPP-only concern and single-port covers the
  home use case in the brief.
- **Charge-session history sparkline**: `HaApi.getHistory` already exists
  (used by geo calibration) and could pull the power sensor's recent history
  for a tiny session graph in the sidebar/modal — no new HA plumbing needed,
  just a new consumer of an existing method.

## 7. Open questions & risks

- **Vendor fragmentation of the status string** (§2.3) means the normalizer
  will always be a best-effort heuristic for Wallbox specifically (free-text,
  observed to have changed/had gaps historically per HA core issue trackers)
  — decide whether to lean harder on `connectedEntity`+`powerEntity` as the
  ground truth and treat `stateEntity` as a display-only label rather than
  the state-machine driver, to reduce vendor-string brittleness.
  Recommendation: yes, prefer numeric/boolean signals for the *state
  machine*, text only for a tooltip.
- **Target SoC is out of scope for a pure "charger" fixture** (§2.5) — decide
  whether v1 ships `socEntity` only (current battery %, works if the user's
  charger or car exposes it) and defers `targetSocEntity` to whenever a
  vehicle/car concept exists in Diorama, or ships both now as inert optional
  bindings. Recommendation: ship both fields now (cheap, optional,
  forward-compatible) but don't build any UI/animation that assumes
  `targetSocEntity` is ever set.
- **No car object exists yet** — the "cable to the car" visual is
  necessarily a fixed-offset "parking spot" point in v1, not a real vehicle
  anchor (§6). Confirm this MVP scope is acceptable before promising a
  car-following cable.
- **Wall-mount vs. pedestal defaults** — need a decision on whether pedestal
  mount should reuse the light-pole/floodlight aesthetic (post + head) or
  get a bespoke bollard model; recommend reusing the floodlight-post pattern
  since it already exists and looks right.
- **Which switch is "the" start/stop control** differs by vendor semantics:
  Wallbox's is literally called "Pause/Resume" (defaults to charging,
  toggle *pauses*), Peblar's "Charge" switch is a plain on/off, OCPP's
  "Charge Control" ends the whole session on off. The generic
  `switch.toggle` dispatch is semantically fine for all three, but the
  sidebar copy/icon should say "Pause/Resume" generically rather than
  "Start/Stop" to avoid over-promising (e.g. resuming from pause may not
  re-authorize a fully-ended OCPP session). Confirm acceptable wording with
  product before shipping copy.
- **OCPP's per-connector device split** complicates "one fixture = one
  physical charger" for multi-port chargers — decide whether v1 explicitly
  only targets single-connector home chargers (recommended) and documents
  multi-connector as unsupported.
- **Number entity permission gating**: Wallbox's current-limit number
  entities only exist "if the supplied username has sufficient rights" —
  the sidebar binding row should tolerate a picker showing zero `number`
  entities for that device gracefully (same class of problem as any
  optional-permission integration).
- **LED color convention differs by vendor** (Wallbox blinks blue while
  charging; many others use green) — ship the fixture's accent as a
  per-fixture override with a green-pulse default, don't hard-code a single
  "this is what charging looks like" mapping as universal truth.

## 8. Sources

- [Wallbox — Home Assistant integration docs](https://www.home-assistant.io/integrations/wallbox/)
- [Peblar — Home Assistant integration docs](https://www.home-assistant.io/integrations/peblar/)
- [OpenEVSE — Home Assistant integration docs](https://www.home-assistant.io/integrations/openevse/)
- [lbbrhzn/ocpp — GitHub repo](https://github.com/lbbrhzn/ocpp)
- [lbbrhzn/ocpp — user guide (GitHub docs)](https://github.com/lbbrhzn/ocpp/blob/main/docs/user-guide.md)
- [lbbrhzn/ocpp — services.yaml (service/action definitions)](https://github.com/lbbrhzn/ocpp/blob/main/custom_components/ocpp/services.yaml)
- [Wallbox "waiting to unlock" missing status — home-assistant/core#69617](https://github.com/home-assistant/core/issues/69617)
- [Wallbox integration errors — home-assistant/core#73214](https://github.com/home-assistant/core/issues/73214)
- [mbillow/ha-chargepoint — GitHub repo (ChargePoint HACS integration)](https://github.com/mbillow/ha-chargepoint)
- [HA switch domain docs](https://www.home-assistant.io/integrations/switch/)
- [HA Sensor entity developer docs (device_class/state_class)](https://developers.home-assistant.io/docs/core/entity/sensor/)
- [evcc Home Assistant vehicle docs — `limitSoc` target-SoC entity convention](https://docs.evcc.io/en/vehicles/home-assistant/)
- [jonasbkarlsson/ev_smart_charging — GitHub repo (target-SoC as external entity)](https://github.com/jonasbkarlsson/ev_smart_charging)
- [Mercedes ME `battery_max_soc_configure` service example](https://dev.sequr.be/blog/2023/02/manage-mercedes-ev-battery-charge-target-from-home-assistant/)
- [Wallbox Pulsar Plus LED status lights — Wallbox support](https://support.wallbox.com/na/knowledge-base/understanding-the-pulsar-plus-led-status-lights/)
- [Wallbox Pulsar Plus dimensions — EV Pulse review](https://www.evpulse.com/reviews/wallbox-pulsar-plus-review)
- [ChargePoint Home Flex datasheet](https://www.chargepoint.com/resources/chargepoint-home-flex-cph50-datasheet)
- [EV charger mounting height / NEC 625.29 — Complete Guide to EV Charging Station Dimensions](https://linkpowercharging.com/the-complete-guide-to-ev-charging-station-dimensions-2025/)
- [`wallbox/const.py` raw source (`ChargerStatus` enum, full status-string list)](https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/wallbox/const.py)
- [Tesla Energy Library — Gen 3 Wall Connector install/spec docs (cross-check dimensions)](https://energylibrary.tesla.com/docs/Public/Charging/WallConnector/Gen3/Install/UniversalWC/en-us/GUID-4A3BDFAA-7DBB-48CB-852C-BF1473EC4945.html)
