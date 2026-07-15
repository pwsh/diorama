# Climate / Thermostat / HVAC Wall Control — Research

## 1. Summary

Diorama already renders positional presence (mmWave/BLE), environmental readings
(`EnvSensor`, including a `temperature` `EnvKind`), and several "wall fixture +
popup modal" devices (alarm keypad, safety detectors). Climate control is the
natural next wall fixture: a **thermostat** is a physical object every house has,
it is usually mounted at a fixed, meaningful point on a wall, and its state
(heating/cooling/idle, setpoint, mode) is exactly the kind of *spatial + at-a-
glance* information Diorama is built to show — "is the living room thermostat
calling for heat right now" reads far better as a red glow on a wall plate in
the room than as a dashboard card.

This feature has two independent parts that should be designed together but can
ship independently:

1. **A `ThermostatFixture` wall fixture** bound to a `climate.*` entity: 2D wall
   plate + readout, 3D wall unit + a popup control panel (mirrors the existing
   `<diorama-alarm-modal>` recipe) to change mode/setpoint, and a vent-glow /
   airflow cue driven by `hvac_action` (the *actual* runtime activity, not the
   requested mode).
2. **A per-room temperature heat-map** derived from already-placed `EnvSensor`
   temperature pucks (and optionally a bound climate entity's
   `current_temperature`), shading each room's wall-loop floor patch (2D) /
   floor polygon (3D) by warmth — a purely-derived visual layer, no new entity
   binding required beyond what's already placed.

Both slot cleanly into the existing canvas-fixture recipe and dirty-key
rebuild architecture; nothing here requires a new persistence key class beyond
one new `Floor.thermostats: ThermostatFixture[]` array (+ optionally a `Room`
field for an explicit climate→room binding, since climate entities do not
reliably map 1:1 to rooms — see §2 and §7).

## 2. Home Assistant data model

### 2.1 The `climate` domain (core, first-party — `homeassistant/components/climate`)

Reference: [Climate entity | Home Assistant Developer Docs](https://developers.home-assistant.io/docs/core/entity/climate/), [Climate integration](https://www.home-assistant.io/integrations/climate/), [`climate.set_temperature` action docs](https://www.home-assistant.io/actions/climate.set_temperature/), and `homeassistant/components/climate/const.py` in home-assistant/core.

**State** — the entity's `state` string is the *current HVAC mode* (this is a
quirk worth flagging: `hvac_mode` is not a separate attribute, it *is* the
entity state):

| State value | Meaning |
|---|---|
| `off` | Device off |
| `heat` | Heating to `temperature` |
| `cool` | Cooling to `temperature` |
| `heat_cool` | Heating/cooling to a range (`target_temp_low`/`target_temp_high`) |
| `auto` | Following a schedule / learned behavior |
| `dry` | Dehumidify-only |
| `fan_only` | Fan runs without conditioning |
| `unavailable` / `unknown` | No data |

**Attributes** (all optional except where a feature is supported; read via the
normal `state_changed` WS event, no special API needed):

| Attribute | Type | Notes |
|---|---|---|
| `hvac_modes` | `string[]` | Modes this device supports (subset of the state table above) |
| `hvac_action` | string \| null | **The runtime truth** — `off`, `preheating`, `heating`, `cooling`, `drying`, `fan`, `idle`, `defrosting`. This is what should drive vent/airflow animation, NOT the mode. A unit can be in mode `heat` with `hvac_action: idle` (setpoint satisfied) |
| `current_temperature` | float \| null | Live room reading from the unit's own sensor |
| `temperature` | float \| null | Single target setpoint (heat/cool modes) |
| `target_temp_low` / `target_temp_high` | float \| null | Range setpoints (`heat_cool` mode) |
| `target_temp_step` | float | Setpoint UI increment (often 0.5) |
| `current_humidity` | float \| null | Live humidity reading |
| `humidity` | float \| null | Target humidity |
| `min_temp` / `max_temp` | float | Slider bounds |
| `min_humidity` / `max_humidity` | float | Slider bounds |
| `fan_mode` | string \| null | Active fan setting |
| `fan_modes` | `string[]` \| null | e.g. `auto`, `on`, `low`, `medium`, `high`, `top`, `middle`, `focus`, `diffuse` |
| `preset_mode` | string \| null | Active preset |
| `preset_modes` | `string[]` \| null | `none`, `eco`, `away`, `boost`, `comfort`, `home`, `sleep`, `activity` |
| `swing_mode` / `swing_modes` | string / `string[]` | Vertical louver oscillation |
| `swing_horizontal_mode` / `swing_horizontal_modes` | string / `string[]` | Some units (mini-splits) support horizontal swing separately |
| `supported_features` | int (bitmask) | See below |

**`supported_features` bitmask** (`ClimateEntityFeature` `IntFlag`, from
`climate/const.py`):

| Flag | Value |
|---|---|
| `TARGET_TEMPERATURE` | 1 |
| `TARGET_TEMPERATURE_RANGE` | 2 |
| `TARGET_HUMIDITY` | 4 |
| `FAN_MODE` | 8 |
| `PRESET_MODE` | 16 |
| `SWING_MODE` | 32 |
| `TURN_OFF` | 128 |
| `TURN_ON` | 256 |
| `SWING_HORIZONTAL_MODE` | 512 |

Decode with `(supported_features & FLAG) !== 0` — same idiom Diorama would use
for any other bitmask; there is no existing bitmask consumer in the codebase
today (closest analog: `Door`/`Window` kind enums are plain strings, not
bitmasks), so this is a new but simple pattern — a single `climateFeature(cs,
flag)` pure helper in `geometry.ts` mirroring `envKindOf`/`motionColor` style.

**Services / actions** (`homeassistant.services.climate`, called via
`call_service` over the WS exactly like every other Diorama toggle):

| Action | Target | Data | Notes |
|---|---|---|---|
| `climate.set_hvac_mode` | entity_id | `hvac_mode: string` | Must be one of `hvac_modes` |
| `climate.set_temperature` | entity_id | `temperature?`, `target_temp_low?`, `target_temp_high?`, `hvac_mode?` | Use `temperature` alone for single-setpoint modes; use `target_temp_low`+`target_temp_high` together for `heat_cool`; HA validates `low ≤ high`; optionally switches mode first |
| `climate.set_fan_mode` | entity_id | `fan_mode: string` | Must be one of `fan_modes` |
| `climate.set_humidity` | entity_id | `humidity: number` | Only if `TARGET_HUMIDITY` |
| `climate.set_preset_mode` | entity_id | `preset_mode: string` | Must be one of `preset_modes` |
| `climate.set_swing_mode` | entity_id | `swing_mode: string` | |
| `climate.set_swing_horizontal_mode` | entity_id | `swing_horizontal_mode: string` | |
| `climate.turn_on` / `climate.turn_off` / `climate.toggle` | entity_id | — | Only if `TURN_ON`/`TURN_OFF` supported |

Example (mirrors the doc's canonical YAML, translated to a WS `call_service`
Diorama would send):
```json
{
  "type": "call_service",
  "domain": "climate",
  "service": "set_temperature",
  "service_data": { "temperature": 21, "hvac_mode": "heat" },
  "target": { "entity_id": "climate.living_room" }
}
```

### 2.2 Everything here is core / WS-native — no gaps

Unlike weather (which needed a new `HaApi.getWeatherForecasts` WS call) and
history-backed geo calibration (`getHistory`), **climate needs no new `HaApi`
method**. State comes through the existing `state_changed` subscription (same
as any bound entity); all six services are called through the *existing*
generic `call_service` path Diorama already uses for `alarm_control_panel.*`,
`vacuum.*`, `lock.*`, etc. — no new WS command shape, so `HassClient` and
`HassPanelAdapter` need zero new plumbing, only the call sites in
`Planner`/modals. This is the cheapest "new domain" Diorama has integrated to
date.

One thing that IS unavailable over the state/attribute surface: **schedules**.
Thermostat schedule/program data (weekly setback programs) lives inside each
integration's own config/backend (Nest, Ecobee, generic thermostat `helper`)
and is not exposed as a generic climate attribute — there is no
`climate.schedule` attribute. If a future iteration wants to show "next
setback in 40 min," that has to come from vendor-specific sensors some
integrations expose as separate `sensor.*` entities (e.g., Ecobee exposes
`sensor.ecobee_*_next_transition` on some setups) — not reliable, not designed
here. Flag as out of scope (§7).

### 2.3 Core vs custom

- The `climate` domain and all six services are **core** (`homeassistant/components/climate`), available regardless of which brand integration backs the entity (Nest, Ecobee, generic_thermostat helper, Z-Wave, ESPHome, Tuya-local, MELCloud, etc.) — Diorama's design should treat `climate.*` generically and never assume a specific integration, exactly like it already treats `light.*`/`switch.*` generically.
- Individual **brand integrations** (Nest, Ecobee) may add integration-specific extra attributes (not part of the shared schema) — do not depend on them; the fixture must degrade gracefully to whatever the shared schema exposes.
- `generic_thermostat` (core helper, wraps a temperature sensor + a switch/heater) is a common no-vendor path a Diorama user might have; it supports a subset (`TARGET_TEMPERATURE`, `heat`/`off` only, no fan/preset) — the fixture design must not assume every feature bit is set.

## 3. Real-world / visual reference

Wall thermostats are small (roughly palm-sized), flush-or-near-flush wall
plates, almost always at a fixed adult-eye-level height, in a hallway or main
living space (rarely bedrooms), away from direct sun/drafts/doorways.

**Sizes** (for 3D model proportions; Diorama's furniture/fixture builders work
in mm):

| Product | Shape | Face size | Depth | Trim plate |
|---|---|---|---|---|
| Nest Learning Thermostat (3rd/4th gen) | Round dial | ⌀ 98 mm (4th gen) / ⌀ 84 mm (3rd gen) | 29 mm / 31 mm | 150.4 × 110.4 mm |
| Nest Thermostat (2020, budget) | Round-ish/rect display, mirror finish | ⌀ 84 mm | 27 mm | 180 × 112 mm |
| ecobee Smart Thermostat (Premium/Pro) | Square-ish rounded rect, glass touchscreen | 104 × 104 mm | 26 mm | 159.9 × 143.5 mm trim |
| Honeywell T-series (T4/T6 Pro) | Rectangular, small LCD | ≈120 × 120 mm | ≈25 mm | similar, rectangular backplate |
| Classic mechanical dial (Honeywell round) | Round beige dial | ⌀ ≈130 mm | ≈35 mm | round backplate ⌀ ~150 mm |

For a stylized Sims-toon fixture, a good generic model: a flat rounded-rect (or
disc) wall plate ~110×110×25 mm on a slightly larger square backplate
(~150×150×5 mm), matching the scale Diorama already uses for switch plates
(40 mm deep) and alarm panels — thicker than a switch, thinner/smaller than a
TV.

**Colors/materials**: matte white/black/graphite plastic or brushed metal
bezel is dominant; the *display* itself is the expressive part — warm
amber/orange for heat, cool blue/cyan for cool, plain white/grey for fan-only
or idle, dim/off for `off`. This maps directly onto the toon-material tinting
Diorama already uses for lights/switches/alarm screens.

**Mounting height**: traditional residential practice mounts thermostats at
**~60 in (1500 mm) AFF** (measure representative room air, reachable while
standing); current ADA guidance (2010 ADA Standards, forward-reach) caps
*accessible* operable controls at **48 in (1220 mm) AFF**, with a 15–48 in
reach range. Diorama should default the fixture height to **1500 mm** (matches
the pre-existing `AlarmPanel` default of 1400 mm and reads as "chest/eye
level," clearly above switches which sit at ~1200 mm) with the same
free-height-override field every other wall fixture has.

**Placement**: typically a hallway or main living space wall, NOT inside a
bedroom/bathroom/closet, away from windows, exterior doors, supply vents, and
direct sunlight (all of which cause bad readings) — not enforceable data, just
informs example plans/docs.

## 4. Diorama visualization & animation design

### 4.1 New type: `ThermostatFixture` (mirrors `AlarmPanel`)

```ts
// Wall-mounted climate control fixture, bound to a climate.* entity. Snaps
// flush to the nearest wall like a switch/alarm panel (no ganging). Clicking
// opens the thermostat control modal.
export interface ThermostatFixture {
  id: string;
  x: number; y: number;
  rotation?: number;         // deg, wall-plate convention (0 = +Y world), like switches/alarm
  height?: number;           // mm above floor; default 1500
  entity_id: string | null;  // climate.*
  allowControl?: boolean;    // permit mode/setpoint changes from the panel (default false = view only)
  localState?: string;       // unbound synthetic hvac_mode ('off'|'heat'|'cool'|...) for demo/local control
  localTemp?: number;        // unbound synthetic setpoint (°C, converted for display like elsewhere)
  label?: string;
  roomId?: string | null;    // OPTIONAL explicit room binding — see §7; null = auto-resolve via wall loop
  locked?: boolean;
}
```

Add `Floor.thermostats?: ThermostatFixture[]` (repairFloor + defaultFloor
backfill `[]`, exactly like `alarmPanels`).

### 4.2 2D representation (`canvas-render.ts` / `canvas-hit.ts` / `canvas-interact.ts`)

- `drawThermostats(ctx, view, thermostats, states)` — a small rounded-rect
  wall-plate icon (mirrors `drawAlarmPanels`'s screen-band idiom): background
  plate color neutral grey, a colored "screen" band showing:
  - Band color from `hvac_action` (see palette below), pulsing softly like the
    alarm arming/triggered pulse when actively heating/cooling (reuse the
    `performance.now()`-based pulse idiom from `drawSafetySensors`/`drawAlarmPanels`).
  - A small numeric readout: current temp (°) and target temp, e.g. `71°→72°`.
  - Unbound → dim/grey, `local: <mode>` badge like other unbound fixtures.
- `hitThermostat` — same box-hit as `hitAlarmPanel`.
- Drag kind `thermostat`; wall-snap via a new `snapThermostatToWall` (geometry.ts)
  cloned from `snapSwitchToWall`/`snapAlarmToWall` — flush like a switch, offset
  `WALL_HALF + plateDepth/2`, rotation `atan2(nx, ny)`; **no ganging** (like alarm).
- Tool entry: `TOOLS` gains `thermostat` (🌡, matches the emoji already used for
  the `temperature` `EnvKind` glyph — reuse `ENV_KINDS.temperature.glyph` value
  `'🌡'` for visual consistency between the env puck and the wall unit).
- Rides the **sensors** layer (like alarm panels / BLE proxies / safety
  sensors) — no new layer needed.

### 4.3 3D representation (`three-renderer.ts`)

- `_thermostatGroup` (new `THREE.Group`), added to `scene.add`,
  `clearTransientGroups`, `destroy`, and `setLayerVisibility` (`v.sensors`),
  exactly following the `_alarmGroup` wiring (four call sites — see §5).
- `updateThermostats(units, stateProvider)` (mirrors `updateAlarmPanels`):
  builds a `_mat()`-toned plate box + a raised inset "screen" quad; screen
  material color/emissive driven by `hvac_action`; small readout via a
  camera-facing `CanvasTexture` `THREE.Sprite` (same idiom as env-sensor
  sprites / now-playing cards — remember `_disposeSpriteMaps` before
  `_clearGroup` on rebuild).
- **Vent/airflow animation** (the interesting bit): when `hvac_action` is
  `heating`/`cooling`/`fan`, spawn a small **billboarded particle wisp**
  drifting up from the unit — reuse the weather system's documented
  `PointsMaterial`/`SpriteMaterial` *toon-factory exemption* (flat-color point
  sprites are already an approved pattern for precipitation/dust). A handful
  (~6–10) of soft dots drift upward and fade, colored:
  - `heating` → warm red/orange (`#ff6d4d`-ish), gentle upward drift + slight
    outward flare (convection cue).
  - `cooling` → cool blue/cyan (`#4dd0ff`-ish), drift downward-and-out (cold
    air sinks cue) — a nice, cheap, physically-suggestive differentiator from
    heat.
  - `fan` (fan_only, no heat/cool) → plain white/grey dots, straight-out drift,
    no vertical bias.
  - `idle`/`off`/`dry`/`defrosting` → no particles (dry could get a faint blue
    shimmer later; not in v1).
  - This can literally be a smaller instance of the existing weather-particle
    builder pattern (`_buildPrecipCloud`-style: one `THREE.Points` cloud per
    active unit, recycle band instead of a whole-floor spawn box, near-zero
    per-frame cost) rather than a wholly new system.
- Click routing: raycast walk to `userData.kind === 'thermostat'` (extend the
  existing fixture raycaster the same way `alarm`/`safety`/`robot` were added)
  → open `<diorama-thermostat-modal>`.

### 4.4 Popup control modal — `<diorama-thermostat-modal>` (mirrors `<diorama-alarm-modal>`)

- Bound + `allowControl` → full control surface:
  - Mode selector restricted to the entity's own `hvac_modes` (never offer a
    mode the device doesn't support).
  - Setpoint stepper(s): single `temperature` OR dual
    `target_temp_low`/`target_temp_high` slider depending on current mode
    (`heat_cool` → range UI; else single value UI) — step by
    `target_temp_step` (default 0.5/1° if absent), clamp to `min_temp`/`max_temp`.
  - Fan mode dropdown (only if `FAN_MODE` bit set), preset dropdown (only if
    `PRESET_MODE` bit set), each restricted to the entity's own `_modes` list —
    same "never invent an option the device didn't advertise" rule as HA's own
    thermostat card.
  - Calls: `climate.set_hvac_mode`, `climate.set_temperature`,
    `climate.set_fan_mode`, `climate.set_preset_mode` — fire-and-forget,
    exactly like the alarm modal's `alarm_control_panel.*` calls.
  - Live readout of `current_temperature`/`current_humidity`/`hvac_action` at
    the top (view-only fields even when control is allowed).
- Bound + view-only (no `allowControl`) → readout only, matches alarm's
  read-only branch.
- Unbound → the same **local control** idiom used everywhere else
  (`localState`/`localTemp`) — buttons flip the local synthetic state; `save()`
  no-ops outside edit so kiosk flips are session-only, matching the documented
  local-control semantics for doors/lights/switches/alarm.
- View mode never opens it (same guard as the alarm modal / every other modal).

### 4.5 Per-room temperature heat-map (derived visual layer, no new binding)

This is intentionally **not** a new bound-entity feature — it's a rendering
pass over data Diorama already has: placed `EnvSensor`s with `kind ===
'temperature'` (and, when a `ThermostatFixture` is bound and has a room
resolved, its own `current_temperature` folds in as another sample in that
room).

- **Aggregation**: for each `Room`, gather every `temperature`-kind `EnvSensor`
  and every `ThermostatFixture` whose fuzzy-resolved room
  (`resolveRoomForPointFuzzy`) equals that room; average their
  `current_temperature`/state values (ignore sensors with no reading). Rooms
  with zero samples get no shading (not "cold" — *unknown*, an important
  distinction to avoid misleading blue-washing a room nobody measured).
- **Color scale**: reuse the existing warm/cool language already established
  by `ENV_KINDS.temperature` (`#ff8a65` warm-orange base) and the new
  heat/cool vent palette from §4.3 for consistency — a simple 3-stop gradient
  (cool blue → neutral → warm red/orange) centered on a configurable "neutral"
  temp (default 21 °C / 70 °F), same idea as any diverging heat-map but kept
  crude/toon-flat (2–3 color bands, not a smooth gradient) to match the Sims
  aesthetic and avoid a photorealistic tone-map creeping into the flat-toon
  renderer.
- **2D**: a low-alpha warm/cool fill over the room's wall-loop polygon,
  drawn in the same pass as `Room.occupancyEntity`'s glow (`activity` layer —
  reuse that gate rather than inventing a new layer; occupancy glow and temp
  shading are both "ambient room truth" and a user who turns off `activity`
  presumably wants a clean plan view of either).
- **3D**: a flat `ShapeGeometry` patch per room loop at a low y (like
  `Room.occupancyEntity`'s "matching loop patch... with warm emissive when
  on" pattern, and like ground-area patches) — same `loopContaining`-derived
  polygon, warm/cool flat-toon material, no bound-entity semantics of its own
  (its color is *computed*, so it only needs to ride `_keyFloor`'s existing
  configRev + a coarse rounded-temperature-per-room hash term, not a whole new
  dirty key).
- **Gate**: a `Store.scene3d` (or a lighter per-floor) boolean,
  `showTempHeatmap` (default off — this is visually busy and should be opt-in,
  unlike occupancy glow which is subtle), sidebar checkbox near "3D Scene" or
  inside the Rooms section next to the existing occupancy bind row.
- **No new `_isSlowEntity` needs**: `EnvSensor` bound ids are *already*
  slow-path (documented: "Bound env entity ids are slow-path entities... so
  sidebar readings re-render on change") — the heat-map free-rides that
  existing routing; climate `current_temperature` on a bound thermostat should
  be added to `_isSlowEntity` the same way (config-path, scoped to the current
  floor's bound climate ids) so both the sidebar chip and the heat-map repaint
  on a new reading without hammering the live 10 Hz path.

## 5. Integration steps (canvas-fixture recipe checklist)

1. **types.ts** — add `ThermostatFixture` interface; add
   `thermostats?: ThermostatFixture[]` to `Floor`.
2. **geometry.ts** — thermostat wall-plate defaults (size/height/depth
   constants); `snapThermostatToWall` (clone of `snapAlarmToWall`); a
   `climateFeature(supportedFeatures, flag)` bitmask-check helper;
   `hvacActionColor(action)` / `HVAC_ACTION_COLORS` palette (heat/cool/fan/idle
   — shared 2D+3D like `ALARM_STATE_COLORS`); temperature heat-map color scale
   helper (`tempHeatColor(tempC, neutralC)`).
3. **Planner** — `repairFloor`/`defaultFloor` backfill `thermostats: []`;
   `_isSlowEntity` scoped addition for bound thermostat entity ids (config
   path, like alarm/safety ids); `Planner.toggleItem`-style helpers aren't
   needed (climate has its own multi-field service calls, not a single
   toggle) — add `Planner.setClimateMode(item, mode)` /
   `setClimateTemp(item, temp[, low, high])` etc. that route bound → real
   service calls via `HaApi`, unbound → mutate `localState`/`localTemp` +
   `save()` (no-op outside edit) + `emitConfig()`, matching the alarm pattern
   exactly.
4. **canvas-render.ts** — `drawThermostats` (screen-band + readout, pulse while
   active) + `drawAll` gating (rides `sensors` layer, no new layer flag);
   optional `drawRoomTempHeatmap` under the `activity` layer gate (or new
   opt-in flag per §4.5).
5. **canvas-hit.ts** — `hitThermostat`.
6. **canvas-interact.ts** — mousedown/move/up drag case (`thermostat` kind),
   place-tool click-to-drop, delete-tool branch, cursor, click-vs-drag → open
   modal.
7. **sidebar.ts** — `_section('thermostats', 'Thermostats', …)` (bind row,
   Allow control checkbox, height, rotation, label, lock, local badge when
   unbound); `TOOLS` entry (🌡) + tool hint text; Rooms section gains the
   heat-map opt-in checkbox (and, if explicit room binding is chosen over
   auto-resolve, a room `<select>` on each thermostat row — see §7 open
   question).
8. **ui/modals.ts** — new `<diorama-thermostat-modal>` component (mirrors
   `AlarmModal` structure: header temp/mode readout, mode buttons restricted
   to `hvac_modes`, setpoint stepper(s), fan/preset dropdowns gated on
   `supported_features`, Close).
9. **three-renderer.ts** —
   - Declare `_thermostatGroup`; add to `scene.add`, the recursive raycast
     root list, `clearTransientGroups`, `destroy`, `setLayerVisibility`
     (`v.sensors`).
   - `updateThermostats(units, stateProvider)` builder (plate + screen +
     readout sprite; `_disposeSpriteMaps` pairing).
   - Per-unit airflow particle system (small `THREE.Points` cloud, built once
     per active unit under the dirty key, advanced per-frame like the weather
     precip clouds — zero-allocation mutate-in-place).
   - Raycast click → `userData.kind === 'thermostat'` → open modal (route
     through the same fixture-click event three-view already dispatches for
     alarm/safety).
   - `updateRoomTempHeatmap` builder (flat loop patches, §4.5), gated by its
     opt-in flag.
10. **three-view.ts** — new dirty key `_keyThermostats` = `configRev` +
    per-unit `hvac_mode|hvac_action|temperature|current_temperature|target_temp_low|target_temp_high` hash (bucket temps to ~0.5° to avoid float jitter rebuilds); airflow particle *advance* runs every frame (like weather) but the cloud *build* only on key change. If the heat-map is added, fold a coarse per-room rounded-temperature hash into `_keyFloor` (documented pattern: "If you add a renderer input... add it to the corresponding key").
11. **Docs** — update `CLAUDE.md`'s Layout/Architecture sections once shipped (new fixture family bullet, like the alarm/safety/robot entries already there), plus bump `docs/STATUS.md`.

## 6. Potential additional features

- **Room↔thermostat explicit binding** for multi-zone homes (see §7) instead
  of relying solely on wall-loop auto-resolve.
- **Schedule/setback timeline strip** in the modal if/when a specific
  integration exposes next-transition data (Nest/Ecobee-specific — not
  general, see §2.2).
- **Humidity control** surface (`target_humidity`, `set_humidity`) as a second
  slider in the modal — trivial once the modal exists, gated on
  `TARGET_HUMIDITY`.
- **Away/eco automation hook**: a "when everyone leaves" preset button that
  calls `set_preset_mode('away')` on every placed thermostat at once — pure
  Planner convenience, no new HA plumbing.
- **Outdoor-temp-aware heat-map** blending in `Planner.weatherNow.tempC` for
  unmeasured rooms adjacent to exterior walls (extrapolated, clearly marked as
  an estimate) — nice-to-have, adds complexity, defer.
- **Vent register fixtures** (separate small floor/ceiling grille objects that
  glow with the same airflow-direction cue) — a natural companion fixture but
  out of scope for this feature; could reuse the airflow-particle code from
  §4.3 wholesale.
- **Multi-thermostat conflict indicator**: if two zone thermostats in the same
  auto-resolved room disagree (one heating, one idle), show a subtle warning —
  edge case, low priority.

## 7. Open questions & risks

- **One climate entity ≠ one room, and Diorama has no reliable way to know the
  mapping automatically.** Cases to support:
  - *Single whole-house thermostat*: one `climate.*` entity, no natural
    "room" at all — placing the fixture is cosmetic/representative, and the
    heat-map (if it existed) would need to either shade every room from the
    one reading or (better) simply not attempt whole-house heat-mapping when
    only one unmapped thermostat exists (v1 should special-case: heat-map
    needs ≥1 `temperature` `EnvSensor` per room; a lone whole-house climate
    entity should NOT bleed into every room's color).
  - *Zoned system* (multiple physical thermostats, one per zone/floor, each
    controlling dampers for several rooms): still not 1:1 with a Diorama
    `Room` — one climate entity may legitimately govern 3 rooms.
  - *Per-room mini-splits*: here it genuinely is 1:1, and auto-resolve via
    wall-loop (like `Room.occupancyEntity`) works well.
  - **Recommendation**: do NOT auto-couple `current_temperature` into the
    heat-map from a climate entity by default. Treat the heat-map purely as an
    `EnvSensor`-driven feature (temperature pucks the user already placed with
    clear per-sensor room membership via wall-loop resolve); let a
    thermostat's own reading optionally count as *one more sample* only when
    the user has *explicitly* placed that fixture inside that room's wall
    loop (physical placement = implicit consent), never for a whole-house unit
    with no strong spatial position. This sidesteps needing an explicit
    `roomId` field/UI for v1 — ship auto-resolve only, revisit explicit
    binding if users report the wall-loop guess is wrong for their zoned
    system.
- **Unit conversion**: HA climate attributes are in the SYSTEM's configured
  unit (°C or °F per `hass.config.units`, not per-entity like some domains) —
  Diorama already has an `imperial` store flag (used by the weather chip);
  reuse that same conversion path rather than inventing a second one. Verify
  `temperature_unit` attribute exists on the entity for a safe per-entity
  read instead of assuming global config leaks through correctly.
- **`supported_features` correctness across integrations is inconsistent** —
  some third-party/cloud integrations under-report bits (e.g., a device that
  supports fan modes but omits the `FAN_MODE` bit due to a lagging integration
  version). The modal should degrade gracefully (hide the control) rather than
  ever assume a feature is present; a genuinely broken integration will just
  hide a control the physical device has, which is the safe failure mode.
- **`heat_cool` UI complexity**: dual-setpoint range control is fiddlier to
  build well (two thumbs, min-gap enforcement) than a single stepper — budget
  real design time for the modal's range-slider component; HA's own
  thermostat card is a reasonable reference implementation to study when
  building it, not to copy pixel-for-pixel (Diorama's modal style should match
  the alarm modal's plainer look).
- **Vendor fragmentation for anything beyond the shared schema** (Nest's
  Sunblock/eco-temperature-range quirks, Ecobee's separate `SmartSensor`
  weighted-average occupancy-based temperature blending, mini-split
  `swing_horizontal_mode` support) — v1 should target only the documented
  shared `climate` schema and treat every device identically; do not chase
  brand-specific attributes.
- **No schedule data available generically** (§2.2) — do not promise a
  "next setback" UI without confirming the specific user's integration
  exposes it as its own sensor; treat as integration-specific, not core.
- **Dirty-key cost of frequent temperature ticks**: `current_temperature`
  changes fairly often (every fraction of a degree from some integrations) —
  bucket it (e.g., round to nearest 0.5°) before folding into
  `_keyThermostats`/`_keyFloor` the same way the appliance-state hash and
  weather key already bucket their noisy inputs, or the 3D scene will rebuild
  far more than necessary.
- **Airflow particle cost**: if a house has many bound thermostats all
  actively heating/cooling at once, N small particle clouds is still cheap
  (weather's precipitation clouds already run at `600+` points **per floor**;
  a thermostat cloud would be ~6–10 points **per unit**) but worth a sanity
  cap (e.g., only animate airflow for thermostats on the *current* floor, like
  every other per-floor group).

## 8. Sources

- [Climate entity | Home Assistant Developer Docs](https://developers.home-assistant.io/docs/core/entity/climate/)
- [Climate — Home Assistant integration docs](https://www.home-assistant.io/integrations/climate/)
- [Set thermostat target temperature — `climate.set_temperature` action docs](https://www.home-assistant.io/actions/climate.set_temperature/)
- [`homeassistant/components/climate/const.py` — home-assistant/core (GitHub)](https://github.com/home-assistant/core/blob/dev/homeassistant/components/climate/const.py) (HVACMode, HVACAction, ClimateEntityFeature enum values)
- [Thermostat card — Home Assistant dashboards docs](https://www.home-assistant.io/dashboards/thermostat/)
- [Google Nest thermostat technical specifications](https://support.google.com/googlehome/answer/9230098?hl=en)
- [ecobee Smart Thermostat Premium product page](https://www.ecobee.com/en-us/smart-thermostats/smart-thermostat-premium/) / [ecobee Pro tech specs PDF](https://www.ecobee.com/wp-content/themes/ecobee/dist/files/PROSmartThermostatTechSpecs.pdf)
- Thermostat mounting height / ADA reach-range summaries: [Thermostat Height by Code — Accelerate Net Zero](https://acceleratenetzero.com/thermostat-height-code-accessibility-practices/), [U.S. Access Board — Chapter 3: Operable Parts](https://www.access-board.gov/ada/guides/chapter-3-operable-parts/)
- Diorama codebase (this repo): `src/types.ts` (`AlarmPanel`, `SafetySensor`, `Room`, `EnvSensor`), `src/geometry.ts` (`ENV_KINDS`, `snapSwitchToWall`/`snapAlarmToWall` pattern), `src/three-renderer.ts` (`_alarmGroup`/`updateAlarmPanels` pattern, weather `_buildPrecipCloud`/particle idiom), `src/ui/modals.ts` (`AlarmModal`), `CLAUDE.md` (architecture conventions cited throughout)
