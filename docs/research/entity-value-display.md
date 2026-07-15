# Generic Entity Value Display ("Info Card" fixture)

Research doc — build-ready reference. Status: research only, not yet implemented.

## 1. Summary

A placeable Diorama object — working name **`InfoCard`** (`FurnitureKind`-adjacent
but with its own top-level array, see §5) — that shows the live state + unit of
**any** HA entity the user binds to it, as crisp text rendered in the 3D scene
(and a compact 2D chip), with optional value→color rules and an optional
merged clock/date mode that needs no entity at all.

This generalizes the existing `EnvSensor` fixture (`src/types.ts:390`,
`ENV_KINDS`/`envKindOf`/`envColor`/`envValueText` in `geometry.ts:1115-1193`),
which is hard-wired to `sensor.*` domain + a fixed glyph/threshold table per
`EnvKind`. `EnvSensor` is good product design for "this is a temperature puck"
but can't show a battery %, a vacuum's `status`, a person's `state`, a
countdown timer, or "3:45 PM" — anything outside its seven-ish kinds. An
`InfoCard` is the escape hatch: pick **any** entity via the existing
`<diorama-entity-picker>` (no domain filter needed — or default to no filter),
choose a display format, done.

Why it fits Diorama specifically: Diorama's whole thesis is *spatial context*
for HA state — put the thermostat reading on the thermostat's wall, the
washer's cycle-remaining time on the washer, a "days since last watered" counter
stuck in the plant pot, a doorbell battery % by the door. A generic value
display is the connective tissue between "I have 40 sensors in HA" and "I can
see the ones I actually care about, physically located, at a glance" — without
Diorama's maintainers hand-rolling a bespoke fixture kind per entity type.
It also subsumes the "clock/date on the wall" ask cheaply, since the renderer
for both is "put formatted text on a plane/sprite in the scene."

Framed against the shipped feature set: this is *not* a sensor with a fixed
taxonomy (unlike `EnvSensor`/safety sensors), not a device with physical
behavior (unlike appliances/robots), and not spatial-inference (unlike
presence zones/BLE). It is closest in spirit to the **now-playing card sprite**
(`_nowPlayingGroup`, three-renderer.ts ~5182) and the **env sensor sprite**
(`updateEnvSensors`) — both already prove out "read a bound entity's state,
paint it into a canvas-texture sprite above/near a fixture" as a cheap,
established Diorama idiom. `InfoCard` turns that idiom into a first-class,
user-configurable fixture instead of a one-off per feature.

## 2. Home Assistant data model

### 2.1 State object shape (what's on the WebSocket)

Every entity's live state, as pushed by `state_changed` events and returned by
`get_states`, has this shape (confirmed against the WS API docs' worked
example):

```json
{
  "entity_id": "light.bed_light",
  "state": "on",
  "attributes": {
    "rgb_color": [254, 208, 0],
    "brightness": 180,
    "friendly_name": "Bed Light",
    "unit_of_measurement": "°C",
    "device_class": "temperature"
  },
  "last_changed": "2016-11-26T01:37:24.265390+00:00",
  "last_updated": "2016-11-26T01:37:24.265390+00:00",
  "context": { "id": "...", "parent_id": null, "user_id": "..." }
}
```

`state_changed` event `data` carries `{entity_id, old_state, new_state}`
(new_state null on entity removal) — this is exactly what Diorama's
`HassClient`/`HassPanelAdapter` already subscribe to and what `Planner`
iterates in `_onStates`. **Everything this feature needs is already flowing
through Diorama's existing state pipe** — no new WS subscription, no new
`HaApi` method. (Source: developers.home-assistant.io/docs/api/websocket/.)

Attributes relevant to formatting, all optional and entity/integration-supplied:
- `unit_of_measurement` — string, used verbatim (`°F`, `%`, `kWh`, `hPa`, …).
- `friendly_name` — display label fallback when the user doesn't set a custom label.
- `device_class` — governs special-case formatting (see 2.2).
- `suggested_display_precision` (int) — integrations SHOULD set this on numeric
  sensors; HA core 2025.6+ also derives a **default precision per device_class**
  when the integration doesn't (table `UNITS_PRECISION` in
  `homeassistant/components/sensor/const.py`). Since HA 2025.6.0, sensor
  **state values are no longer pre-rounded** during unit conversion — the raw
  unrounded float is what's actually in `state`, so display-side rounding is now
  load-bearing, not optional, if you want output to match HA's own dashboards.
  (Source: developers.home-assistant.io/blog/2025/05/26/sensor-default-display-precision/.)
- `display_precision` — a **per-entity user override** stored in the entity
  registry (set via entity settings "Display Precision" dialog), NOT delivered
  on the plain state object — it lives on entity registry entries, which
  Diorama's `HaEntityReg` (`ha-client.ts`) does not currently fetch. If exact
  parity with HA's own display precision is wanted, this would need a new
  additive field on `HaEntityReg` (`config/entity_registry/list` already
  returns it per HA frontend source) in both `HassClient`+`HassPanelAdapter`.
  **v1 recommendation: skip this** — round numeric values with a simple
  `EnvSensor`-style heuristic (see §4) and let the user override decimals in
  the InfoCard's own format field; exact HA-precision parity is a nice-to-have,
  not required.

### 2.2 HA frontend's state-display formatting (for reference/parity, not a dependency)

HA's frontend computes the human string for a state in
`src/common/entity/compute_state_display.ts` (home-assistant/frontend, `dev`
branch). Key special cases worth mirroring loosely in Diorama's own (much
simpler) formatter:
- **`device_class: "duration"`** with a duration-shaped unit → formatted via
  `formatDuration()` (locale + optional precision), not raw seconds.
- **`device_class: "monetary"`** → `Intl.NumberFormat` with
  `style: "currency", currency: unit_of_measurement` (unit IS the ISO currency
  code for monetary sensors), `minimumFractionDigits: 2`.
- **Timestamp domains/device_class** (`device_class: "timestamp"`, or any
  entity in `TIMESTAMP_STATE_DOMAINS`) → `new Date(state)` through
  `formatDateTime(date, locale, config)` — the raw `state` string for these is
  an ISO-8601 datetime, not a display string.
- Plain numeric sensors → `formatNumber()` with precision resolved from
  `entity.display_precision` (registry override) → `suggested_display_precision`
  → device-class default → else raw.
- Units are appended as a separate token with locale-aware spacing
  (`blankBeforeUnit()` — some locales/units get no space, e.g. `%`).
(Source: github.com/home-assistant/frontend `src/common/entity/compute_state_display.ts`.)

Diorama does **not** need to reimplement this whole pipeline — it already has
a working, much simpler analog in `envValueText()` (round to 0 decimals above
100, else 1 decimal, append unit if present, `—` for unavailable/unknown). The
recommendation for InfoCard (§4) is to generalize that function with a couple
of `device_class`-aware branches (timestamp, duration, monetary-ish) rather
than pull in HA's Intl-heavy formatter.

**`binary_sensor.*` domain — the other big formatting special case.** A
`binary_sensor`'s `state` is only ever `'on'`/`'off'`/`'unavailable'`/
`'unknown'` — the entire semantic meaning ("open" vs "detected" vs "low") is
carried by `attributes.device_class`, and this is a domain InfoCard is
explicitly meant to reach that `EnvSensor` never touches (locks, doors,
windows, presence, problem/safety sensors are all `binary_sensor`s a user will
want a plaque for). The authoritative on/off meaning per device_class, from
[Binary sensor entity | Home Assistant Developer Docs](https://developers.home-assistant.io/docs/core/entity/binary-sensor/):

| device_class | on | off |
|---|---|---|
| battery | low | normal |
| battery_charging | charging | not charging |
| co | carbon monoxide detected | no carbon monoxide (clear) |
| cold | cold | normal |
| connectivity | connected | disconnected |
| door | open | closed |
| garage_door | open | closed |
| gas | gas detected | no gas (clear) |
| heat | hot | normal |
| light | light detected | no light |
| lock | open (unlocked) | closed (locked) |
| moisture | wet | dry |
| motion | motion detected | no motion (clear) |
| moving | moving | not moving (stopped) |
| occupancy | occupied | not occupied (clear) |
| opening | open | closed |
| plug | plugged in | unplugged |
| power | power detected | no power |
| presence | home | away |
| problem | problem detected | no problem (OK) |
| running | running | not running |
| safety | unsafe | safe |
| smoke | smoke detected | no smoke (clear) |
| sound | sound detected | no sound (clear) |
| tamper | tampering detected | no tampering (clear) |
| update | update available | up-to-date |
| vibration | vibration detected | no vibration |
| window | open | closed |

This is HA's documented *semantic* meaning, not necessarily the exact
localized string HA's own frontend renders (that's translation-file-driven —
see the enum-translation gap in §2.3/§7). For a small plaque the verbose
phrasing above ("no carbon monoxide (clear)") won't fit; recommend Diorama
bake its **own short-label table** off this same device_class key (Open/
Closed, Wet/Dry, Home/Away, Unlocked/Locked, …), exactly the same "own small
hardcoded table instead of depending on HA i18n" tradeoff `ENV_KINDS` already
makes, falling back to plain `On`/`Off` for unrecognized/absent device_class.
`infoCardValueText()` should special-case `entity_id.startsWith('binary_sensor.')`
alongside its timestamp/duration/monetary branches.

### 2.3 What's a Home/Not-available over the WS API

- `friendly_name`, `unit_of_measurement`, `device_class`, `state`,
  `last_changed`/`last_updated` — all on the plain state object, already in
  Diorama's `hass.states` map. **Available.**
- `display_precision` (entity registry override) — **not on the state
  object**; would need `config/entity_registry/list` (Diorama's
  `getEntityRegistry` already exists and could be extended additively) plus a
  join by `entity_id`. Currently unused by Diorama for anything display-side
  (only `platform`/`unique_id`/`disabled_by`/`original_device_class`/`name`
  are read). Optional/deferred, see 2.1.
- **Enum device_class friendly labels** (e.g. `vacuum.state = "returning"` →
  "Returning to dock") are translation-key driven inside HA's frontend
  (`state.<domain>.<device_class>.<state>` translation strings) and are
  **not exposed as data over the WS API** — they live in the frontend's
  bundled translation JSON, which Diorama does not ship. **Not available**
  without hardcoding a small translation table or just showing the raw
  `state` string (e.g. `"returning"` instead of "Returning to dock"). v1
  recommendation: show the raw state string, `snake_case` → `Title Case`'d
  for readability (`returning` → `Returning`), which covers 90% of the visual
  gap cheaply and needs no data HA doesn't already send.
- `sensor.get_statistics` / long-term statistics (for sparkline-style displays)
  is a WS command (`history/statistics_during_period`) that exists but is a
  materially different data path (pre-aggregated, not raw state) — out of
  scope for v1, listed under §6.

### 2.4 Value→color convention prior art (HA core + HACS)

HA has no core WS-level concept of "ranges to color" — it's purely a
**Lovelace card config schema** convention, reusable as a schema template:

**Gauge card (core, `home-assistant.io/dashboards/gauge/`):**
```yaml
type: gauge
entity: sensor.cpu_usage
unit: '%'
min: 0        # default 0
max: 100      # default 100
needle: false # default false
severity:
  green: 0
  yellow: 45
  red: 85
# OR (mutually exclusive with severity, requires needle: true):
segments:
  - from: 0
    color: var(--error-color)
    label: Low
  - from: 35
    color: var(--warning-color)
  - from: 40
    color: var(--success-color)
```
`severity` is exactly 3 fixed named stops (green/yellow/red thresholds, value
≥ threshold takes that color going up the list). `segments` is the more
general N-stop "from this value upward until the next stop, use this color"
form and accepts arbitrary CSS colors including HA's `var(--error-color)`
theme tokens. (Source: home-assistant.io/dashboards/gauge/.)

**bar-card (popular HACS custom card, `custom-cards/bar-card`):** uses an
explicit **closed range** form instead of open "from" stops:
```yaml
severity:
  - color: red
    from: 0
    to: 25
  - color: orange
    from: 26
    to: 50
  - color: green
    from: 51
    to: 100
```
`{color, from, to}` triples, each an inclusive closed interval. (Source:
github.com/custom-cards/bar-card README / DeimosMH/HACS-bar-card mirror.)

**Recommendation for Diorama's own schema** (§4/§5): adopt the **closed-range**
triple form (`{min, max, color, label?}`) — it's unambiguous (no "value below
the first stop" edge case to resolve) and matches bar-card's proven UX,
which Diorama users coming from Lovelace will already recognize. Continuous
**gradient** mode (linear interpolation between 2+ `{value, color}` stops) is
a second, orthogonal mode — same "stops" list shape, different interpolation
rule, worth sharing one editor UI with a mode toggle.

### 2.5 Clock/date — no HA entity required

HA core ships a **Clock card** (`home-assistant.io/dashboards/clock/`) that
needs **no entity at all** — it renders the current time client-side:
```yaml
type: clock
clock_style: digital   # | analog
clock_size: small       # | medium | large
show_seconds: false
time_format: ...        # overrides user profile
time_zone: ...           # overrides user profile
analog_options: { border: false, ticks: hour }  # analog only
```
This confirms: **a Diorama clock/date InfoCard should use `new Date()` /
`Intl.DateTimeFormat` client-side, not an HA entity** — it needs no `entity_id`,
no WS traffic, updates every render tick for free, and trivially supports a
custom timezone the same way the Clock card's `time_zone` override does
(`Intl.DateTimeFormat(locale, {timeZone})`). HA's separate **Time & Date
integration** (`homeassistant.io/integrations/time_date/`) does expose
`sensor.time`, `sensor.date`, `sensor.date_time`, etc. as bindable entities
(useful if a user wants automations off them), but InfoCard should NOT require
one — clock mode should be a `displayMode: 'clock'` on the InfoCard that
bypasses `entity_id` entirely, exactly mirroring how `MotionSensor.demo` or
`Furniture.localState` let a fixture operate with zero HA binding. This is the
natural merge point the research brief asked about: same fixture type, same
renderer, `entity_id == null && displayMode === 'clock'` short-circuits to
`Intl.DateTimeFormat`.
(Sources: home-assistant.io/dashboards/clock/, homeassistant.io/integrations/time_date/.)

### 2.6 Services/actions needed

**None.** This is a read-only display fixture — no `call_service` is needed
to show a value (unlike the alarm keypad, door lock, or vacuum fixtures, which
call actions on click). Clicking an InfoCard could optionally open the
existing entity picker (rebind) in edit mode, or do nothing in kiosk/view mode
— there's no natural "action" for a value display the way there is for a
switch or lock. (Possible exception under §6: tap-to-toggle for a boolean
entity, but that duplicates the switch fixture and is likely scope creep.)

## 3. Real-world / visual reference

There isn't a single real-world object this maps to — it's closer to a class
of objects: wall-mounted digital thermostats/displays, kitchen/office label
tags, small e-ink price/info tags, and "smart mirror" style dashboard tiles.
Concrete references useful for sizing/材 the 3D model:

- **Wall-mounted thermostat display** (e.g. Nest/Ecobee/Honeywell puck):
  ~80–100 mm diameter or ~110×110 mm square, ~25 mm proud of the wall,
  mounted ~1400–1500 mm AFF (average eye-level-ish mounting height for
  thermostats). Text panel is the whole face.
- **E-ink shelf label / info tag** (retail price tags, Govee/Aqara-style
  sensor displays): small rectangular plaque, ~60×40 mm to ~120×80 mm, flush
  or near-flush mount, black-on-white segmented or dot-matrix look.
- **Desk/tabletop smart display** (e.g. small "smart photo frame" style
  temp/time displays): ~100×70×15 mm plaque standing on a small kickstand/
  easel foot, sits ON furniture rather than mounted to a wall.
- **Digital picture frame / label tag on furniture** (for the "sitting on a
  table" placement): a thin flat plaque, ~150×100×10 mm, resting flat or
  tilted slightly back (~10–15°) like a photo frame, matching Diorama's
  existing `mountable` piece convention (nightstand-top items).
- **Floor-standing sign** (for the "floor placement" option — e.g. a small
  A-frame sign or pedestal plaque): ~300×150 mm footprint, ~900–1100 mm tall
  to a readable panel — closer to Diorama's existing floor lamp/pedestal
  scale than a wall tile.

Recommended Diorama defaults (following the existing furniture-default
pattern in `FURNITURE_KINDS`): a single new lightweight primitive rather than
three separate kinds — width/height/depth **user-configurable per instance**
(sidebar w/h inputs, matching `EnvSensor.scale` and furniture w/d editors),
with a `mount: 'wall' | 'surface' | 'floor'` field driving default size +
placement geometry:
- `wall` default: 200×120×20 mm plaque, flush-snapped like a switch/floodlight.
- `surface` default: 150×100×10 mm plaque, tilted 12° back, `mountable: true`
  auto-snapping onto a `surface` host furniture piece (desk/counter/nightstand)
  exactly like `coffee_maker`/`toaster`.
- `floor` default: 250×150 footprint × 1000 mm tall pedestal/kiosk shape,
  free-placed like generic block furniture.

Color/material: a dark bezel (`#22262a`-ish, matching the existing "screen"
material used for stove/microwave control panels — three-renderer.ts ~3640
`const screen = this._mat({...})`) with an emissive text panel — this reuses
an existing shared toon material idiom rather than inventing a new one.

## 4. Diorama visualization & animation design

### 4.1 Data model (`types.ts`)

New top-level array on `Floor` (mirrors `EnvSensor`, `SafetySensor`, `BleProxy`
placement — a per-floor placeable, NOT a Store-level or per-entity singleton):

```ts
export type InfoCardMount = 'wall' | 'surface' | 'floor';
export type InfoCardDisplayMode = 'entity' | 'clock' | 'date' | 'clock_date';

export interface InfoCardFormatStop {
  min: number; max: number; color: string; label?: string; // closed range
}
export interface InfoCardFormat {
  mode?: 'ranges' | 'gradient';       // default 'ranges'
  stops?: InfoCardFormatStop[];       // ranges mode
  gradientStops?: { value: number; color: string }[]; // gradient mode, ≥2, sorted
  decimals?: number;                  // manual override; default heuristic (envValueText-style)
  prefix?: string; suffix?: string;   // e.g. "$", " remaining"
  showUnit?: boolean;                 // default true
}

export interface InfoCard {
  id: string;
  x: number; y: number;
  rotation: number;              // degrees, screen-CW (matches Furniture/Door convention)
  mount: InfoCardMount;          // default 'wall'
  w?: number; h?: number;        // plaque footprint mm; default from `mount`
  height?: number;               // mm above floor for wall/floor text center; default per-mount
  displayMode: InfoCardDisplayMode; // default 'entity'
  entity_id: string | null;      // null when displayMode is clock/date/clock_date
  label?: string;                // user override of friendly_name
  format?: InfoCardFormat;
  billboard?: boolean;           // default false — camera-facing text instead of fixed
  fontScale?: number;            // 0.4..4, default 1 (mirrors EnvSensor.scale)
  locked?: boolean;
  hidden?: boolean;
  mountOnId?: string;            // bookkeeping when mount === 'surface' (mirrors Furniture.mountOnId)
}
```

Add `infoCards: InfoCard[]` to `Floor`, backfilled `[]` in `repairFloor` +
`defaultFloor` (the standard per-floor-field gotcha called out in CLAUDE.md).
No new `Store`-level field needed (this is per-floor placement, not
property-wide config like `geo`).

### 4.2 Value resolution + formatting (`geometry.ts`, pure functions)

```ts
export function infoCardValueText(st: HassStateLike | null, ic: InfoCard): string { ... }
export function infoCardColor(numericValue: number | null, format?: InfoCardFormat): string | null { ... }
export function infoCardClockText(ic: InfoCard, now: Date): string { ... }
```
- `infoCardValueText`: for `displayMode === 'entity'`, mirror `envValueText`
  but add device_class branches: `timestamp` → `new Date(state).toLocaleString()`
  (or a compact time-only format), `duration`-shaped unit → `mm:ss`/`Hh Mm`
  compact string, else numeric-with-unit or raw `state` (snake_case→Title Case
  for non-numeric enum-y strings, e.g. vacuum `returning` → `Returning`).
  Unavailable/unknown → `—` (matches `envValueText`'s existing convention).
- `infoCardColor`: only applies to numeric values; `ranges` mode picks the
  matching `{min,max}` stop (closed interval, last match wins on overlap —
  document this rule explicitly in the code comment since bar-card's own docs
  are silent on overlap behavior); `gradient` mode linearly interpolates RGB
  between the two bracketing stops (clamped at the ends) — reuse `hexToRgb`/
  lerp, output through the existing hex convention (`lighten()`'s "always
  return hex" precedent — see CLAUDE.md gotchas) so callers can pipe the
  result into `hexToRgba`/`hexToInt` uniformly.
- `infoCardClockText`: `Intl.DateTimeFormat`/`toLocaleTimeString` for `clock`,
  `toLocaleDateString` for `date`, both for `clock_date` — client-side, driven
  by the RAF/tick's own `Date.now()`, NO entity, no WS traffic (§2.5).

### 4.3 2D rendering (`canvas-render.ts` + `canvas-hit.ts` + `canvas-interact.ts`)

- `drawInfoCards(ctx, view, cards, states, layers)`: a small rounded-rect chip
  at each card's (x,y) — bezel fill + colored value text (from
  `infoCardColor`) + optional unit, sized by `fontScale`. Gated by a **new
  `Layers2D.infoCards?: boolean`** key (default on) — following the
  `env`/`battery` precedent of a dedicated layer flag rather than folding into
  `furniture` (this is a "readout", conceptually closer to env sensors than
  decor).
- `hitInfoCard(cards, wx, wy)`: rect hit test against `w/h`, standard pattern
  copied from `hitSafetySensor`/`hitEnvSensor` (radius or box, whichever
  matches the mount's rect).
- `canvas-interact.ts`: new `place`/`drag`/`delete` branches for the `infocard`
  tool + drag kind, matching the BLE-proxy/env-sensor recipe exactly. Wall
  mount pieces get `snapInfoCardToWall` (new function in geometry.ts, a
  near-clone of `snapSwitchToWall`/`snapFloodlightToWall`: flush at
  `WALL_HALF (50) + plateDepth/2`, rotation `atan2(nx, ny)`) run on drop +
  move-release; `surface` mount pieces get the existing generic
  mountable-auto-snap-to-`surface`-host logic (already generalized for
  `coffee_maker`/`toaster`/`microwave` — InfoCard's `surface` mount is just
  another `mountable: true`-shaped consumer, though since `InfoCard` isn't a
  `Furniture`, the auto-snap helper needs a small generalization or a
  parallel path — see §7 open question); `floor` mount pieces free-place like
  generic furniture blocks.

### 4.4 3D rendering (`three-renderer.ts`)

New `_infoCardGroup`, declared/added/cleared/destroyed/layer-gated exactly
like `_envGroup`/`_safetyGroup` (`scene.add`, `clearTransientGroups`,
`destroy()`, `setLayerVisibility`).

**`updateInfoCards(cards, stateProvider)`** (rebuilt only under a new
`_keyInfoCards` dirty key — `configRev` + each bound entity's rounded value +
color bucket + clock cards' minute bucket, mirroring the `_keyEnv`/appliance-
hash idiom):

- **Bezel/plaque body**: a thin box via `_mat({...})` (toon-shaded, matches
  every other fixture) sized `w × h × ~20mm`, positioned/rotated per
  `mount`/`rotation` (wall: flush + `_addOutlines` inverted-hull shell like
  furniture; surface: sits on the host top like `coffee_maker`; floor:
  pedestal box + plaque head).
- **Text panel — fixed-orientation (default) vs billboard**: this is the
  crux of the "3D text technique" research question (§4.5). Recommendation:
  render the value text as a **`CanvasTexture` on a small unlit `PlaneGeometry`
  mesh** (NOT a `THREE.Sprite`) glued to the plaque face for the default
  (`billboard: false`) fixed-orientation mode, and instead use the existing
  `_makeTextSprite`-style Sprite (already billboard-by-construction — Sprites
  always face camera in three.js) when `billboard: true`. This means the
  renderer needs **two small builder branches sharing one canvas-paint
  helper**, not two independent code paths — see §4.5/§5 for the concrete
  material choice.
- Materials: the plaque's text plane is the **one new documented exemption**
  from the `_mat()` MeshToonMaterial factory (joining `PointsMaterial`/
  `SpriteMaterial` for weather particles) — text needs to read as a **flat,
  self-lit digital readout**, not a toon-shaded surface; use
  `MeshBasicMaterial({map: tex, transparent: true})` (or `emissiveMap` on a
  otherwise-black `_mat()` material, if consistency with the "everything is
  toon" rule matters more than a plaque — recommend `MeshBasicMaterial`,
  simpler, and screens/HUD-style elements reads correctly unlit regardless of
  scene lighting, same reasoning as the weather particle exemption).
- **CanvasTexture repaint discipline**: paint the canvas only when the
  formatted text or color actually changed (compare a cached string, same
  idiom as `_syncNameLabel`'s "(re)paints only when name/color changes"), not
  every dirty-key rebuild — clock mode repaints once a display-relevant unit
  changes (every second if `show_seconds`-equivalent, else every minute).
  **Texture disposal**: since this is a plain `Mesh` (not a `Sprite`), it is
  **NOT** covered by the existing `_disposeSpriteMaps` (which is
  `isSprite`-guarded) — `updateInfoCards`/`_clearGroup` needs its own explicit
  `mesh.material.map?.dispose()` sweep before `_clearGroup`, OR the simpler
  fix: keep using `THREE.Sprite` even for "fixed orientation" but freeze its
  quaternion to the plaque's world rotation each dirty-key rebuild instead of
  the default camera-facing billboard math. **This second approach is
  recommended** — it reuses `_makeTextSprite` + `_disposeSpriteMaps` verbatim
  (zero new disposal code, zero new material type), and "fixed orientation"
  becomes just "don't let this particular sprite look at the camera" rather
  than a whole parallel mesh/material/dispose path. See §4.5 for why a Sprite
  can still be non-billboarded (Sprites are literally always camera-facing by
  three.js design **unless** you bypass `Sprite` and use a plain `Mesh` — so
  achieving TRUE fixed-orientation text requires the Plane+CanvasTexture
  approach after all; a Sprite cannot be "un-billboarded". This is flagged as
  an explicit open contradiction in §7 — pick one before implementation).
- Per-frame: nothing needs continuous animation except an optional gentle
  emissive pulse to mirror the appliance-LED idiom (skip — over-engineering
  for a readout), and the billboard variant (if kept as `THREE.Sprite`)
  needs no per-frame code (Sprites billboard for free every frame via three.js
  internals, same as every other sprite in the codebase).

### 4.5 Text rendering technique comparison (the core research question)

| Technique | How it works | Crispness | Bundle cost | Fixed-orientation? | Fits Diorama? |
|---|---|---|---|---|---|
| **CanvasTexture → `PlaneGeometry` + `MeshBasicMaterial`** | Paint text on a 2D `<canvas>`, wrap as `THREE.CanvasTexture`, map onto a plane mesh. | Good at typical furniture-viewing distances; blurs on close zoom or steep angle because it's a raster bitmap — mitigated with `texture.anisotropy = renderer.capabilities.getMaxAnisotropy()` and 2× oversampling the canvas resolution vs its world-mm size. | **Zero** — no new dependency; identical to `_makeTextSprite`/`_makeRoomLabelSprite`/env sprite/GPS sprite/now-playing sprite, all already shipping. | **Yes, natively** — it's a normal `Mesh`, rotates/orients like any furniture piece, no billboard behavior unless you explicitly add a `lookAt` each frame. | **Best fit.** Matches 6+ existing call sites verbatim; the codebase's whole sprite-text idiom already IS this technique (just always used as `THREE.Sprite`, which is the same underlying `CanvasTexture` but wrapped in a `Sprite` object that forces camera-facing — swap `Sprite`→`Mesh` and you get fixed orientation for free with the exact same canvas-paint code). |
| **`THREE.Sprite` + `SpriteMaterial`** (current codebase idiom) | Same CanvasTexture, but `THREE.Sprite` always orients to face the camera (billboard) — this is intrinsic to the `Sprite` class, not a configurable option. | Same raster crispness tradeoffs as above. | Zero (already used). | **No** — Sprites cannot be fixed-orientation; this is a hard three.js constraint, not a missing option. | Good fit for the **billboard mode only**. |
| **`troika-three-text`** (npm `troika-three-text`, MIT, protectwise/troika) | Parses `.ttf`/`.otf`/`.woff` directly (via bundled Typr parser) and generates a **signed-distance-field (SDF) glyph atlas on the fly in a Web Worker**, then patches a real three.js `Material` (works with any of them, including `MeshBasicMaterial`/`MeshStandardMaterial`) to render the SDF with proper anti-aliasing via shader derivatives. Ships as a real `THREE.Object3D` (`new Text()`) you position/rotate normally — no billboard behavior, fully fixed-orientation by default. | **Excellent** — SDF text stays crisp at any zoom/angle/scale, the whole point of SDF techniques (this is the standard "game engine crisp text" solution). | **Not zero** — could not get an exact bundlephobia number during this research pass (bundlephobia's page didn't return the number through fetch), but troika-three-text pulls in `troika-three-utils`, `troika-worker-utils`, `bidi-js`, and a font parser (`typr.ts`); it is a real, multi-file, several-tens-of-KB-gzip dependency, not a trivial add — needs a real bundle-size check (`npm ls` + a build) before committing. Also note: **unicode fallback font data loads from a jsDelivr CDN by default** (`unicodeFontsURL`) and the **default font is Roboto fetched from Google Fonts' CDN** unless you supply a local `font` URL — both are **network fetches at runtime**, which conflicts with Diorama's fully-offline/self-contained operation model (it's a HA panel, often used on a local network with no internet egress) unless a font file is vendored into `public/` and pinned via the `font` prop. | Fixed-orientation, higher quality, but real integration cost: (1) audit/vendor a font file to avoid the CDN fetch, (2) verify Worker use doesn't fight Diorama's CSP/sandboxing (HACS-served panel), (3) new dependency to track in `package.json`/CI. **Worth prototyping if InfoCard's text needs to look genuinely crisp up close** (e.g. a thermostat-style hero number), but NOT needed for a first cut. |
| **`TextGeometry` + `FontLoader`** (three.js core, `three/examples/jsm/geometries/TextGeometry.js`) | Extrudes actual 3D vector geometry from a converted `typeface.json` font — real triangulated 3D letterforms. | Poor at small sizes/glancing angles without heavy MSAA — this is vector *geometry*, not a raster/SDF technique, so "crispness" is a mesh-density/anti-aliasing problem, and it's the **heaviest** option per glyph (real triangle counts, one draw call setup per string rebuild). | Zero new npm dep (ships in three.js's `examples/jsm`), but requires a font conversion step (`facetype.js` or similar) to produce the `typeface.json`, and adds real per-frame triangle count for something that's supposed to be a cheap readout. | Yes — real mesh, fixed-orientation natively. | **Poor fit** — over-engineered for "print a number and a unit"; the codebase has zero use of extruded text anywhere, and it doesn't fit the "cheap flat plane" aesthetic used everywhere else in the Sims-toon renderer (this would be the only extruded-3D-lettering object in the whole scene, visually inconsistent with everything else). |

**Recommendation (resolved, not left open — see §7's prior framing of this as
an "explicit contradiction to pick before implementation"):** ship v1 with the
**existing Sprite/CanvasTexture idiom verbatim** for `billboard: true`, and
for `billboard: false` (the requested default) use the **same CanvasTexture
technique on a `THREE.Mesh` + `PlaneGeometry`** instead of `Sprite` — this is
a ~10-line variant of `_makeTextSprite` (build the same canvas/texture, but
return `new THREE.Mesh(new THREE.PlaneGeometry(w, h), new
THREE.MeshBasicMaterial({map:tex, transparent:true}))` instead of `new
THREE.Sprite(...)`, then position/rotate it as a normal child of the plaque
group instead of letting Sprite's internal billboard math run). There is no
third option here: `THREE.Sprite` is *hard-constrained* to always face the
camera (that's what makes it a `Sprite` and not a `Mesh` in three.js's object
model — its world matrix composition intentionally discards rotation), so
"fixed orientation by default, billboard as an opt-in" is only achievable by
branching on the object type, not by configuring one object type two ways.
Concretely: **billboard mesh selection happens once, at build time, in
`updateInfoCards`** — `billboard ? new THREE.Sprite(...) : new THREE.Mesh(new
THREE.PlaneGeometry(...), ...)` — not a per-frame decision, so this costs
nothing beyond the one-time branch.

This choice adds **zero new dependencies** and reuses the disposal idiom with
one required extension: `_disposeSpriteMaps` is currently `isSprite`-gated
(`s.isSprite`), so it will silently skip the new fixed-orientation `Mesh`'s
`CanvasTexture` map, leaking a GPU texture on every rebuild. Broaden its
traversal predicate to also catch the tagged plane (e.g. `s.isSprite ||
(o as THREE.Mesh).userData?.textPlane`) and dispose `.material.map` there too
— a one-line, one-time fix to make at implementation time, not a design
question to defer. Revisit `troika-three-text` later ONLY if user feedback
says raster text isn't crisp enough up close — flagged as a clean, isolated
upgrade path since it plugs in as a straight `Object3D` swap for either
branch.

### 4.6 Live vs slow entity routing

Bound InfoCard entity ids should be **config-path** in `_isSlowEntity` (add
`this.floor().infoCards.some(c => c.entity_id === id)` alongside the existing
`envSensors` check) — matches the `env`/battery precedent: sidebar readings
and the 3D dirty key both need a repaint on change, and InfoCard values are
inherently "read occasionally, not every 10 Hz frame" (weather, thermostat,
battery %, vacuum status — nothing here is a 10 Hz stream). Clock-mode cards
need no entity binding at all, so they're simply excluded from that check and
instead repaint on their own minute/second cadence inside `updateInfoCards`
(driven by the tick's own `Date.now()`, not a dirty-key input — same pattern
as the fireplace-flicker "force every frame" exception, but on a much coarser
cadence: only repaint the canvas when the formatted string changes).

### 4.7 Unbound / local-state interactivity

Unlike doors/lights/switches, an InfoCard bound to nothing has no meaningful
`localState` to toggle — it's read-only by nature. Clicking an unbound
InfoCard in edit mode should just select it for the sidebar editor (like
clicking an unbound `EnvSensor`); no click behavior in kiosk/view mode is
needed (contrast with `Furniture`/`Door`/`Light`, which get local on/off
toggles specifically because binary on/off is a real physical action —
"today's date" isn't). This keeps InfoCard out of the
`Planner.toggleItem`/`effectiveState` local-control machinery entirely, which
simplifies the implementation versus e.g. the appliance/fireplace fixtures.

## 5. Integration steps (canvas-fixture recipe)

1. **`types.ts`**: add `InfoCardMount`, `InfoCardDisplayMode`,
   `InfoCardFormatStop`, `InfoCardFormat`, `InfoCard` interfaces; add
   `infoCards: InfoCard[]` to `Floor`; add `infoCards?: boolean` to
   `Layers2D`.
2. **`geometry.ts`**: `INFO_CARD_MOUNT_DEFAULTS` (size/height per mount, mirrors
   `FURNITURE_KINDS` defaults); `infoCardValueText()`, `infoCardColor()`,
   `infoCardClockText()`; `snapInfoCardToWall()` (clone of
   `snapSwitchToWall`/`snapFloodlightToWall`, no ganging needed — mirrors the
   alarm panel's "no ganging" precedent, since stacking two readouts on one
   wall spot isn't a real use case).
3. **`repairFloor` + `defaultFloor`** (`planner.ts` or wherever those live):
   backfill `infoCards: []` for older persisted floors.
4. **`canvas-render.ts`**: `drawInfoCards()` (bezel + value text + color),
   gated in `drawAll` by `layers.infoCards !== false`.
5. **`canvas-hit.ts`**: `hitInfoCard()`.
6. **`canvas-interact.ts`**: `infocard` tool place-on-click, drag-move case
   (`item && !item.locked`), delete-tool branch, cursor hint, wall/surface
   auto-snap wiring on drop + move-release.
7. **`ui/sidebar.ts`**: `TOOLS` entry (`{id:'infocard', label:'Info'}` — glyph
   suggestion 🔢 or 🏷️), tool hint string, a new `_section('infoCards', 'Info
   Cards', …)` (entity picker with NO domain filter — the whole point is
   "any entity" — label override, mount dropdown, displayMode dropdown,
   format editor: range/gradient stop list with color pickers, decimals/
   prefix/suffix inputs, billboard checkbox, fontScale slider, lock toggle),
   `_groupedList('infoCards', …)` for room-bucketed sidebar rows (matching
   the `env`/`safety` pattern), layer entry in the 2D Layers section.
8. **`three-renderer.ts`**: declare `_infoCardGroup` (scene.add, `clearTransientGroups`,
   `destroy()`, `setLayerVisibility` under `layers.infoCards`); `updateInfoCards(cards, stateProvider)`
   builder per §4.4 (plaque body + `_addOutlines` for wall/floor mounts + text
   Sprite variant, billboard flag deciding whether the sprite's quaternion is
   left alone (camera-facing) or explicitly locked to the plaque's world
   rotation each rebuild).
9. **`three-view.ts`**: `_keyInfoCards` dirty key (`configRev` + per-card
   bound-value-bucket + color-bucket + clock-minute-bucket + `layers.infoCards`
   flag); call `updateInfoCards` when it changes; fold `layers.infoCards` into
   `setLayerVisibility`.
10. **`planner.ts`**: add the `infoCards`-bound-entity check to `_isSlowEntity`
    (§4.6); no new `HaApi` method, no new `Store` field, no new WS subscription.
11. **Sidebar "2D Layers" section**: add `infoCards` layer definition entry so
    presets (`Store.layerPresets2d`) can include/exclude it.
12. **Test coverage**: given "No test suite exists; `npm run typecheck` +
    `npm run build` are the verification gates" (CLAUDE.md), this feature is
    numeric/formatting-heavy enough (range matching, gradient interpolation,
    clock formatting) that it's a strong candidate for a small deterministic
    **test-pages/infocard-test.html** in the existing style (pure-function
    assertions against `infoCardValueText`/`infoCardColor`/`infoCardClockText`,
    transpiled with `esbuild --bundle`, following the `weather-test.html`/
    `fusion-test.html` precedent) even though it's optional — the codebase's
    convention for "new pure logic module" is clearly to ship one of these.

## 6. Potential additional features

- **Sparkline/history mini-graph** on the plaque via `history/history_during_period`
  (Diorama's `getHistory` already exists in both `HaApi` impls, shipped for
  geo calibration) — a tiny in-scene trend line, no new WS command needed.
- **Multi-entity "dashboard tile"**: one InfoCard showing 2-4 stacked
  entity readouts (e.g. temp + humidity on one plaque) — would need
  `entity_id: string` → `entity_ids: string[]` generalization; keep v1 single-
  entity and revisit if requested.
- **Tap-to-open more info**: clicking a bound InfoCard (edit mode) could open
  a lightweight read-only modal with the entity's full attributes — useful for
  power users, low cost given `<diorama-entity-picker>` already round-trips
  entity metadata.
- **Boolean-entity glyph mode**: for `binary_sensor`/`switch`-domain entities,
  show an icon (✓/✗ or on/off glyph) instead of raw `"on"`/`"off"` text —
  small addition to `infoCardValueText`.
- **Unit conversion / imperial toggle**: `Store.imperial` already exists
  (used by the weather chip) — InfoCard could respect it for temperature-ish
  units, converting °C→°F client-side the same way weather does.
- **Per-instance font/weight choice** — probably overkill; a single house
  style (matches every other sprite in the scene) is more in keeping with the
  Sims-toon aesthetic than a rich typography picker.
- **Alert flash**: a range stop flagged `alert: true` could pulse the plaque
  (reusing the safety-sensor pulse-ring idiom) when the value enters a
  dangerous band — natural extension of the ranges format, no new mechanism.
- **Countdown/timer entities** (`timer.*` domain: `remaining` attribute,
  `finishes_at`) — a dedicated `duration`-aware branch in
  `infoCardValueText` for a live-counting-down MM:SS display would need a
  per-frame (not dirty-keyed) repaint path, similar exception to the
  fireplace-flicker "force every frame" rule.

## 7. Open questions & risks

- **Sprite-vs-Mesh: resolved in §4.5, restated here so it isn't lost.**
  `THREE.Sprite` is *incapable* of fixed orientation (it's always camera-
  facing by three.js design) — so "default non-billboard" as specified in the
  brief **requires** the Plane+`Mesh` approach for `billboard: false`, with
  `Sprite` reserved for `billboard: true`. The one required follow-through:
  extend `_disposeSpriteMaps`'s `isSprite` guard to also sweep the tagged
  fixed-orientation plane mesh (§4.5) — don't let "just reuse
  `_makeTextSprite`" quietly regress fixed-orientation into always-billboard,
  and don't ship the Mesh branch without extending the disposal sweep (it
  would leak a `CanvasTexture` per rebuild otherwise).
- **Dirty-key rebuild granularity — the value-bucket-in-`_keyInfoCards`
  design (§4.4/§4.6) forces a full plaque **rebuild** (new geometry/materials,
  not just a texture repaint) on every bound-value change**, the same cost
  class `EnvSensor` already accepts for a handful of environmental pucks. For
  InfoCard this is riskier: it's explicitly meant to bind to *any* entity
  including chatty ones (a power meter updating every few seconds, a
  `timer.*` counting down every second, a future clock-mode card ticking
  every minute), and users may place many instances. **Worth reconsidering
  before implementation**: split into a **structural** dirty key
  (`configRev` + placement/format-config only — position, mount, rotation,
  size, format rules) that rebuilds the plaque body/bezel/outline shell, plus
  a **cheap per-frame or throttled (~2–4 Hz) texture-repaint pass** (reading
  `stateProvider` directly, repainting the existing canvas + `tex.needsUpdate
  = true` only when the formatted text/color actually changed) that runs
  independently of the structural rebuild — mirroring the "mutate persistent
  objects in place" strategy already used for humanoids/robots/now-playing
  cards rather than the "rebuild-on-dirty-key" strategy used for build-time
  fixtures. This also solves the clock/timer/countdown per-second-update need
  (§6) for free, without a fireplace-style "force every frame" exception on
  the whole group. Flagged as a concrete design improvement over copying
  `EnvSensor`'s pattern verbatim, not just a hypothetical concern.
- **`mountable`/`surface` auto-snap is currently `Furniture`-only** (the
  auto-snap logic keys off `Furniture.mountOnId` against `Floor.furniture`
  hosts) — `InfoCard` sitting on a desk/counter needs either (a) a small
  generalization of that snap helper to accept any placeable with
  `{x,y,w,h}`, or (b) treating "surface" InfoCards as a variant furniture
  kind instead of a wholly separate array. **Recommendation leans (a)** to
  keep InfoCard's own array/type clean, but this is real design work, not a
  mechanical copy — flag for the implementer to actually look at
  `mountOnId` resolution code before assuming it "just works."
- **Overlap/gap behavior in `ranges` format** is unspecified by both prior-art
  schemas (gauge card's `severity` assumes monotonic non-overlapping
  thresholds; bar-card's closed `{from,to}` triples don't document what
  happens on overlap or gaps). Diorama's own schema needs an explicit,
  documented tie-break (recommendation: first matching stop in array order
  wins; gaps fall through to a default/neutral color) — write this into the
  `infoCardColor` doc-comment so it isn't silently ambiguous.
- **`display_precision` entity-registry parity** (§2.1) is a deliberate v1
  scope cut — if a user compares InfoCard's rounding to their Lovelace
  dashboard's rounding and they differ, that's expected, not a bug, unless a
  follow-up pulls registry `display_precision` in. Document this expectation
  in-product (or just accept the mismatch — it's minor).
- **Enum-state translation gap** (§2.3): showing raw `state` strings
  Title-Cased is a lossy approximation of HA's real translated enum labels
  (which can differ substantially from the raw string, e.g. some vacuum
  `error` states have long human descriptions in `attributes` rather than a
  friendly `state` mapping) — acceptable for v1, but don't oversell it as
  "shows exactly what HA's dashboard shows."
- **troika-three-text vendoring cost was not fully resolved this pass** —
  bundlephobia's exact minzip number didn't come back through automated fetch;
  before reviving that path (§4.5's "revisit later"), get a real number via
  `npm i troika-three-text && npm run build` and diff the resulting
  `three-renderer`-chunk size, and vendor a font file locally to kill the
  Google Fonts CDN fetch (Diorama's CSP/self-contained assumption — see the
  Artifact tooling's own "no external host" pattern elsewhere in this
  ecosystem — a HA panel shouldn't depend on internet egress at runtime for a
  digit label).
- **Clock timezone edge case**: if a user wants a clock showing a *different*
  timezone than the browser's local one (e.g. a wall display for a remote
  property), `Intl.DateTimeFormat(locale, {timeZone: 'America/New_York'})`
  handles it cleanly client-side — worth exposing an optional `timeZone`
  field on `InfoCard` mirroring the Clock card's `time_zone` override, cheap
  to add now vs. later.
- **Naming collision risk**: "InfoCard" is a generic enough name that it's
  worth double-checking it doesn't collide with an existing internal concept
  before implementation (a quick grep of the codebase at build time is cheap
  insurance — this research pass found no existing `InfoCard` symbol, but
  naming should be locked at implementation start, not research time).

## 8. Sources

- Home Assistant WebSocket API — state object / `state_changed` event shape:
  https://developers.home-assistant.io/docs/api/websocket/
- Binary sensor entity device_class → on/off semantic table:
  https://developers.home-assistant.io/docs/core/entity/binary-sensor/
- HA frontend state-display formatting logic (`compute_state_display.ts`):
  https://github.com/home-assistant/frontend/blob/dev/src/common/entity/compute_state_display.ts
- Sensor default display precision (HA 2025.6.0 change, `suggested_display_precision`,
  `UNITS_PRECISION`, raw-value unit-conversion change):
  https://developers.home-assistant.io/blog/2025/05/26/sensor-default-display-precision/
- Display precision discussion (entity registry override UX):
  https://github.com/home-assistant/frontend/discussions/25769
- Gauge card config schema (`severity`, `segments`, `min`/`max`/`needle`):
  https://www.home-assistant.io/dashboards/gauge/
- bar-card (HACS) severity `{color, from, to}` schema:
  https://github.com/custom-cards/bar-card
  https://github.com/DeimosMH/HACS-bar-card/blob/master/README.md
- Clock card (core, no-entity client-side clock):
  https://www.home-assistant.io/dashboards/clock/
- Time & Date integration (`sensor.time`/`sensor.date`/`sensor.date_time` entities):
  https://www.home-assistant.io/integrations/time_date/
- Time domain (core building-block integration, `HH:MM:SS` state):
  https://www.home-assistant.io/integrations/time/
- troika-three-text (SDF text for three.js) — package + docs:
  https://www.npmjs.com/package/troika-three-text
  https://protectwise.github.io/troika/troika-three-text/
  https://github.com/protectwise/troika/blob/main/packages/troika-three-text/README.md
- Diorama codebase (internal, cited throughout for existing idioms/hooks):
  `src/types.ts` (`EnvSensor`, `Layers2D`), `src/geometry.ts` (`ENV_KINDS`,
  `envValueText`, `FURNITURE_KINDS`, wall-snap helpers), `src/three-renderer.ts`
  (`updateEnvSensors`, `_makeTextSprite`, `_disposeSpriteMaps`,
  `_nowPlayingGroup`, `screen` material idiom), `src/planner.ts`
  (`_isSlowEntity`).
