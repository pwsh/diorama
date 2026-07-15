# Moon Phase, UV Index, and Garage-Bay Vehicle Presence

Tier-3 research bundle: three small, independent, build-ready features.

## Summary

These are three low-effort, high-charm additions that lean on Diorama's core
premise — spatial context for live HA state — without inventing new subsystems:

1. **Moon phase prop.** HA's built-in `Moon` integration exposes an 8-state
   lunar phase sensor computed locally (no network, no API key). Diorama
   already renders a night-preset sky (`night` lighting preset, `NoToneMapping`,
   strong directional "sun" light doubling as day/night driver) and already
   reads `sun.sun` for true sun position (see "3D weather effects" /
   `resolveScenePreset` in CLAUDE.md). A small moon prop that swaps shape/
   shading by phase is a natural, cheap companion — it's a static decorative
   sky object, not a new sensor-binding fixture, so it's mostly a
   three-renderer-only feature plus one optional sidebar bind.
2. **UV index.** Diorama's weather core (`src/weather.ts`) already normalizes
   `WeatherNow` and the task brief states **`WeatherNow.uvIndex` already
   exists** — meaning the type-level plumbing may already be stubbed but (per
   the current CLAUDE.md, which enumerates the W3-batch `WeatherNow` fields
   without listing `uvIndex`) it is very likely **not actually populated by
   any source yet**. This research treats it as: confirm at implementation
   time whether `weather.ts`'s normalizers populate it, then wire it from
   (a) a HA `weather.*` entity's `uv_index` attribute when present, and (b)
   Open-Meteo's `daily.uv_index_max` / `hourly.uv_index` (Diorama already
   calls Open-Meteo directly — see below). Payoff: a chip readout + a small
   parasol/sun-ray flourish, reusing the existing `weatherEffectEnabled`/
   `envColor` idioms rather than inventing new mechanics.
3. **Garage-bay vehicle presence.** No official HA integration exists for
   "is my car in the garage" — it's a DIY ultrasonic/ToF sensor project
   (HC-SR04 or VL53L0X/VL53L1X via ESPHome) that ultimately lands in HA as a
   plain `binary_sensor` (occupancy-style on/off). In Diorama this is **not** a
   new canvas-fixture category — it's a new `FurnitureKind` (a car silhouette)
   that binds to that `binary_sensor` through the *existing* generic furniture
   `entity_id` + `effectiveState` machinery, the same way appliances already
   bind. The one genuinely new rendering behavior is **hiding/showing the
   whole piece** based on state, rather than just lighting an LED — everything
   else (drag/place/bind/lock) is free from the existing furniture recipe.

All three are optional, additive, and read-only from HA's perspective (moon
and UV are pure display; vehicle presence never writes back to HA — same
"read-only bound entity" pattern as EnvSensors / safety sensors).

---

## Home Assistant data model

### 1. Moon phase

- **Integration**: [`moon`](https://www.home-assistant.io/integrations/moon/) —
  **core**, built into HA, zero config beyond adding it (`Settings → Devices &
  Services → Add Integration → Moon`, or `moon:` in YAML). No API key, no
  network call — phase is computed from the system clock only (no lat/lon
  input at all, so it is *not* geographically accurate to the user's
  hemisphere — see the Southern-Hemisphere icon caveat below).
- **Entity**: a single `sensor.moon_phase` (naming may vary slightly by HA
  version/friendly-name), platform `moon`.
- **State values** (8, machine/enum form — literal state strings, not display
  labels):
  `new_moon`, `waxing_crescent`, `first_quarter`, `waxing_gibbous`,
  `full_moon`, `waning_gibbous`, `last_quarter`, `waning_crescent`.
  (Source: [home-assistant.io/integrations/moon](https://www.home-assistant.io/integrations/moon/).)
- **Attributes**: none beyond the standard entity attributes (no illumination
  percentage, no rise/set time, no azimuth/elevation). This is a real
  limitation — see Open Questions.
- **Update cadence**: changes at most once per day; a plain polled/derived
  sensor that shows up over the WebSocket `state_changed` API exactly like any
  other sensor — no special handling needed. Treat as **live-path**; churn is
  negligible either way since it changes ~daily.
- **Icons**: HA/MDI ship one icon per phase (`mdi:moon-new`,
  `mdi:moon-waxing-crescent`, `mdi:moon-first-quarter`,
  `mdi:moon-waxing-gibbous`, `mdi:moon-full`, `mdi:moon-waning-gibbous`,
  `mdi:moon-last-quarter`, `mdi:moon-waning-crescent`) — a useful shape
  reference for phase→rendering mapping, not directly consumable (Diorama
  doesn't render MDI glyphs in 3D).
- **Known caveat**: MDI's waxing/waning crescent glyphs assume the **Northern
  Hemisphere** convention (in the south, waxing looks like a "C", waning like
  a "D" — reversed). See
  [home-assistant/core#74722](https://github.com/home-assistant/core/issues/74722).
  If Diorama's moon prop mimics a crescent shape rather than just tinting a
  disc, this is worth a one-line note/toggle (see Open Questions).
- **NOT available over WebSocket / at all**: real moon **azimuth/elevation**
  (where in the sky it currently sits) and **illumination fraction** are
  simply not exposed by the core Moon integration — it is phase-only. A
  community "Lunar Phase" custom integration and various template-sensor
  recipes exist that add illumination % via `astral`/ephemeris math, but
  that's HACS/custom, not core — flag as optional/custom if pursued. Real
  moon position would require Diorama to run its own ephemeris calc
  client-side (same shape of problem as `sun.sun` already solved by HA core
  for the sun) — out of scope for a Tier-3 pass; see recommended
  simplification in the visualization section.

### 2. UV index

- **Where it lives**: `uv_index` is a **current-condition attribute on the
  core `weather` entity platform**
  ([Weather entity developer docs](https://developers.home-assistant.io/docs/core/entity/weather/)):
  type `float`, no fixed unit (the UV index is unitless, roughly 0–11+),
  default `None`. It is one of roughly 15 optional current-condition
  attributes (`native_temperature`, `humidity`, `cloud_coverage`, `ozone`,
  `uv_index`, `wind_bearing`, etc.) — **a weather integration may or may not
  populate it**; it's entirely provider-dependent (per the dev docs, "a
  weather entity may not support all state attributes").
  - Providers that DO expose it as a live attribute include Met.no
    ([`met`](https://www.home-assistant.io/integrations/met/), core) — Diorama's
    "entity" weather source already reads a `weather.*` entity's attributes in
    `resolveWeatherEntity`, so `uv_index` just needs to be added to the field
    list read there (additive — mirrors how `cloudCoverage` /
    `windGustKmh` / etc. were added in the W3 batch per CLAUDE.md).
  - The **same field name (`uv_index`) also appears per-period inside forecast
    data** via the
    [`weather.get_forecasts`](https://www.home-assistant.io/actions/weather.get_forecasts/)
    action: `action: weather.get_forecasts`, `data: { type: daily|hourly|
    twice_daily }`, targets one or more `weather.*` entities, requires
    `return_response: true`, returns
    `{ "weather.xxx": { "forecast": [ {..., "uv_index": <float>, ...}, ... ] } }`.
    Diorama's `HaApi.getWeatherForecasts(entityId, 'daily'|'hourly')` (already
    implemented in both `HassClient` and `HassPanelAdapter`, per CLAUDE.md) is
    therefore **already the correct call** to pull a forecast `uv_index`
    series — no new HA action needed, just read one more field out of the
    already-normalized forecast rows.
  - There is **no separate `uv_index_max` attribute anywhere in HA core's
    weather-entity model** — that name only exists on the raw Open-Meteo HTTP
    API (see next bullet). Do not invent a `uv_index_max` HA attribute; when
    the source is an `entity`, "today's max" must be derived by scanning the
    daily forecast array Diorama already fetches, or simply showing the
    current `uv_index` live value (simpler, and arguably matches what a UV
    chip realistically needs).
- **Open-Meteo (direct HTTP, not the HA integration)**: Diorama's
  `weather.ts` already makes its own Open-Meteo calls (documented in
  CLAUDE.md as "the codebase's FIRST third-party network call"). The public
  Open-Meteo Forecast API ([open-meteo.com/en/docs](https://open-meteo.com/en/docs))
  supports requesting `hourly=uv_index` and `daily=uv_index_max` directly as
  query params, e.g.:
  `https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&daily=uv_index_max&hourly=uv_index&timezone=auto`.
  **Verified live during this research pass**: response shape is
  `daily.uv_index_max: number[]` and `hourly.uv_index: number[]`, with
  `daily_units.uv_index_max` and `hourly_units.uv_index` both **empty
  strings** (the index is a unitless scale, consistent with HA's own
  attribute). This slots directly into Diorama's existing `fetchOpenMeteo` —
  add `uv_index` to the existing `hourly=` param list (already has
  `precipitation_probability,weather_code` per CLAUDE.md) and `uv_index_max`
  to the existing `daily=` list (currently `weather_code&forecast_days=2`) —
  no new fetch, just wider query params + two more parsed fields.
  - There is a separate core **`open_meteo`** HA integration too
    ([home-assistant.io/integrations/open_meteo](https://www.home-assistant.io/integrations/open_meteo/)),
    but per its docs it exposes only a single weather entity with condition /
    temperature / wind / precipitation — **no UV index** surfaced through
    that integration's entity. This is irrelevant to Diorama anyway since
    Diorama bypasses it and hits the Open-Meteo HTTP API directly.
  - A separate, more UV-specific core integration exists:
    [`OpenUV`](https://www.home-assistant.io/integrations/openuv/) (needs a
    free API key from openuv.io) — exposes richer `sensor.openuv_current_uv_index`
    plus max-UV-today and "safe exposure time" sensors. Worth a mention as an
    alternate/richer **entity** source in Open Questions, but not required
    since Open-Meteo's `uv_index`/`uv_index_max` covers the baseline ask with
    zero API key, matching Diorama's existing no-key Open-Meteo philosophy.
- **Not available over WebSocket**: nothing hidden here — `uv_index` is a
  plain state attribute (weather entity) or a plain forecast field
  (`get_forecasts` action, itself over the same WS RPC style Diorama already
  uses) or a plain HTTP JSON field (Open-Meteo direct fetch, no HA
  involvement at all). No gaps.

### 3. Garage-bay vehicle presence

- **No official/core HA integration** for "is a car in this bay" — this is
  squarely DIY-sensor territory. The common recipes
  ([adonno.com/car-presence-position-detection](https://adonno.com/car-presence-position-detection/),
  the HA community "Garage parking aid to park in exact spot" thread, several
  ESPHome ultrasonic tutorials) are:
  - **Ultrasonic** (`HC-SR04`, cheap, ~$2–5): ESPHome's `ultrasonic` sensor
    platform (`trigger_pin` / `echo_pin`), effective range ~2 cm–4 m (the
    community project above caps usable range at ~200 cm mounted on a ~2.5 m
    ceiling). Reports a plain `sensor.*` **distance** (meters) entity in HA.
  - **Time-of-Flight** (`VL53L0X`/`VL53L1X`, I²C, more precise, better at
    grazing angles / dark garages): ESPHome's `vl53l0x` / `vl53l1x` sensor
    platforms — same shape of result, a `sensor.*` distance entity (mm or m).
  - **Presence derivation**: a plain HA **template `binary_sensor`** (or an
    ESPHome-side templated binary sensor) thresholds the distance reading:
    `distance < ceiling_height − min_car_height` ⇒ occupied. The Adonno
    project computes `car_height = ceiling_height − measured_distance` and
    calls a bay "occupied" when at least two of several ceiling sensors
    (spaced ~1.8 m apart along the bay) read a height above a minimum (e.g.
    >50 cm) — multiple sensors reduce false positives (an arm reaching up, a
    box on a shelf, etc.), but a single sensor + single threshold is the
    common simple case for one bay.
  - **Resulting HA entity Diorama binds to**: a `binary_sensor.*`, most
    naturally `device_class: occupancy` (`on` = occupied/detected, `off` =
    clear — per the
    [binary_sensor device class docs](https://www.home-assistant.io/integrations/binary_sensor/)).
    `device_class: presence` (`on`=home/`off`=away) or no device class at all
    (generic on/off) are also seen in the wild depending on how the user's
    template sensor is authored — Diorama should **not** assume a specific
    `device_class`; it should just read the raw `on`/`off` state string
    exactly like every other bound binary_sensor in the codebase (safety
    sensors, presence zones, door lock, doorbell) — this matches the existing
    `effectiveState`/`toggleItem` "on"/"off" contract with zero new parsing.
  - **Nothing structurally new for the WS API** — this is a plain
    `binary_sensor.*` behaving exactly like every other binary sensor Diorama
    already binds to (safety sensors, presence zones, doorbell, fridge door).
    No new `HaApi` method, no new service call, no new registry lookup class.

---

## Real-world / visual reference

### Moon prop

- Purely decorative "sky object" — no real mounting/placement constraint
  (it's not a physical fixture in the house). Suggest a **fixed dome
  position** (like a static sun/moon billboard) rather than true orbital
  motion — see Visualization section.
- Reference sizing: if drawn to true-to-life scale relative to Diorama's
  floor plan the moon would be absurdly small/far (384,400 km away, ~3,474 km
  diameter) — this is a **stylized prop**, not a physically-scaled body.
  Recommend an arbitrary fixed apparent size (a billboard sprite at a large
  fixed world-space distance) rather than anything derived from real
  astronomical units.
- 8-phase shape reference (for a crescent-clipped disc approach): new (dark
  disc, no lit sliver), waxing crescent (thin right-lit sliver, N.
  hemisphere convention), first quarter (right half lit), waxing gibbous
  (most-but-not-all lit, right-heavy terminator), full (fully lit disc),
  waning gibbous (left-heavy), last/third quarter (left half lit), waning
  crescent (thin left-lit sliver). Color: pale warm-white/grey
  (`#e8e4d8`-ish) disc, NOT the saturated Sims-toon palette used for
  furniture — this is one of the rare "flat, unlit-look" props (see
  Materials note below).

### UV flourish

- No physical object to model — UV index is a numeric/chip readout. If a
  "parasol flourish" 3D prop is wanted, a real outdoor patio parasol/umbrella
  is a reasonable reference: canopy diameter **2000–3000 mm**, pole height
  **~2200–2600 mm** to the canopy underside, 6–8 ribs. This would most
  naturally reuse Diorama's **yard/outdoor furniture** kind family (`outdoor`
  cat, alongside `lawn_chair`/`picnic_table`) rather than being a
  weather-chip-only decoration — see Additional Features.
- Simpler and cheaper: no 3D prop at all, just extend the existing weather
  chip (`<diorama-weather-chip>`) with a second line/icon (`☀️ UV 7` style) —
  this is the pragmatic Tier-3-appropriate default; treat the parasol prop as
  a stretch/optional idea (Additional Features).

### Garage-bay vehicle silhouette

- **Real vehicle envelope** (for a generic "average car" silhouette
  box/hull):
  - Compact sedan: **~4500 × 1780 × 1450 mm** (L×W×H).
  - Mid-size sedan/SUV: **~4800–4900 × 1850 × 1650–1700 mm**.
  - Pickup truck (for completeness, maybe a second kind/variant): **~5800 ×
    2000 × 1900 mm**.
  - Ground clearance ~150 mm (silhouette should float slightly or just be
    modeled at floor level; not load-bearing since it's a decorative/no-nav
    piece).
- **Garage bay** reference: single-bay interior clearance is commonly cited
  as **~3000 × 6000 mm** (10×20 ft) minimum comfortable, standard door width
  **2400 mm** (8 ft, matching Diorama's existing `Door.kind === 'garage'`
  default 2400 mm opening per CLAUDE.md's covers/garage-door section) up to
  ~2700 mm (9 ft) for wider doors.
- **Sensor mounting** (for realism/placement guidance, not required for the
  Diorama render itself): ceiling-mounted ultrasonic/ToF units sit centered
  over the bay, typically 2.3–2.7 m up, aimed straight down; a
  `SafetySensor`-style ceiling puck (Diorama already has a ceiling-mounted
  disc-fixture pattern at 2743 mm for smoke/CO detectors, per CLAUDE.md) is a
  reasonable visual analog if a "presence sensor" glyph fixture (distinct
  from the car silhouette itself) is ever wanted (see Additional Features) —
  but the core ask here is just the **car silhouette furniture piece**, not
  a sensor glyph.

---

## Diorama visualization & animation design

### 1. Moon phase → night-sky prop

- **Where it lives**: a small always-present **decorative sky prop**, most
  naturally modeled like the existing sun-position system — NOT a
  `Floor`-scoped placeable (no x/y/placement, no drag, no tool). Recommend a
  new module-level group in `three-renderer.ts`, e.g. `_moonGroup`, built
  once and repositioned/recolored on phase change — same shared-resource
  lifecycle as `_gradientMapTex`/`_blobTex` (create once in init, dispose
  only in `destroy()`).
- **Geometry**: a single low-poly sphere, or (simpler, and consistent with
  how env-sensor chips and now-playing cards already do camera-facing canvas
  sprites via `_makeTextSprite`/`_disposeSpriteMaps`) a billboard
  `THREE.Sprite` with a canvas-drawn phase texture. A **sprite redrawn per
  phase change** is the pragmatic choice: draw a dark-grey disc + a white
  "lit" region shaped per phase (arc/ellipse clip, same spirit as the MDI
  crescent glyphs) onto an offscreen canvas, wrap in a `CanvasTexture`, same
  dispose contract as every other sprite in the codebase.
- **Placement**: fixed high in the sky at a constant azimuth/elevation (a
  static "always up and to one side" position is honest given HA doesn't
  expose real moon az/el — see Open Questions), or camera-relative-infinity
  (a skybox-style billboard that doesn't parallax with camera orbit) so it
  just reads as "the moon is out." Visible **only** when the resolved
  lighting preset is `night` (fold into the existing `resolveScenePreset`
  result already computed per tick) — hide during `day`/`dusk` presets, same
  idea as the existing day/night gating of other ambient elements.
- **Materials exemption**: like `PointsMaterial`/`SpriteMaterial` for weather
  particles, this sprite should be a **documented exemption** from the
  `_mat()` MeshToonMaterial factory (flat/unlit billboard, not a lit
  surface) — say so explicitly wherever it's built, matching the precedent
  CLAUDE.md already sets for weather sprites.
- **Dirty key**: add a `_keyMoon` (or fold into an existing sky-ish key) =
  `phase state string` (8 possible values) + `presetIsNight boolean`.
  Trivial, changes at most once/day plus on preset flips — effectively free.
- **Binding**: a single **store-level** optional field, e.g.
  `Store.moonEntity?: string` (a `sensor.*`, domain filter `sensor`, ideally
  narrowed toward `moon`-platform entities if the picker supports it, else
  free-text search same as any sensor bind) in a small sidebar "Sky" section
  or folded into the existing "Weather" section. No entity bound ⇒ either
  hide the prop entirely or default to a fixed "full moon" look — hiding is
  more honest and matches the "unbound ⇒ inert" convention used elsewhere
  (e.g. cameras with no snapshot picture just hide the `<img>`).
- **2D**: optional and low-value — a small moon glyph/emoji (🌔 etc., chosen
  from the 8 MDI-equivalent phases) in a corner HUD or folded into the
  weather chip is enough; a full 2D plan-view render adds nothing since moon
  position isn't spatial in the 2D plan.
- **Layer**: no dedicated new layer needed — gate visibility purely on
  night-preset + entity-bound, exactly like the ground grid is gated on
  `!bgVisible`. If a layer toggle feels warranted for consistency, it could
  ride the existing `weatherFx` layer (arguable — it's not weather) or get
  its own trivial boolean; recommend **no new layer**, just
  always-on-when-bound-and-night, to keep this Tier-3-cheap.

### 2. UV index → chip + optional flourish

- **Data**: extend `WeatherNow` with `uvIndex?: number | null` (per the task
  brief the type may already exist as a stub — verify at implementation time
  against the current `weather.ts`; if genuinely absent, this is the
  additive field to add, following the exact precedent of the W3 batch's
  `cloudCoverage`/`humidity`/etc. fields). Populate it in:
  - `resolveWeatherEntity` — read `attributes.uv_index` off the bound
    `weather.*` entity (present on Met.no and similar; `undefined`/`null`
    elsewhere, tolerate absence like every other optional attribute already
    does).
  - `fetchOpenMeteo` — add `uv_index` to the existing `hourly=` query param
    list and `uv_index_max` to the existing `daily=` list; take
    `daily.uv_index_max[0]` (today's peak) as the primary reading, or
    interpolate the hourly series for a "right now" value as a stretch
    refinement. Recommend surfacing **today's max** since that's what a
    "should I put on sunscreen today" chip actually wants.
  - `sensors` source (raw entity IDs): out of scope unless a `uvIndex` slot
    is added to `WeatherConfig.sensors` — likely not worth it since neither
    ultrasonic-DIY-sensor UV meters nor a dedicated "UV sensor" entity id are
    as common in the wild as precip/wind/temp sensors; skip unless a user
    asks.
- **Display**: extend `<diorama-weather-chip>` with a second small
  line/icon — e.g. `☀️ UV 7` — using the same "dims when stale" /
  "hidden when no source" rules already governing the rest of the chip.
  This is genuinely the whole core feature; no 3D geometry required.
  - Optional escalation styling: color the UV figure like `envColor` does
    for EnvKinds (green <3, yellow 3–5, orange 6–7, red 8–10, purple 11+ —
    the standard public UV-index color bands) for at-a-glance risk reading,
    mirroring `ENV_KINDS`' `warn`/`danger` threshold idiom.
- **Optional 3D flourish** (stretch, only if visual richness is wanted
  beyond the chip): a parasol/umbrella `FurnitureKind` in the `outdoor` cat
  (see visual-reference sizing above) whose canopy tint/openness or a small
  emissive "sun ray" halo scales with `uvIndex` — this would ride the exact
  same `_keyFloor` appliance-state-hash idiom already used for power/temp
  readings (bucket `uvIndex` into the hash the same way stove temperature is
  bucketed). This is genuinely optional — flag it as such in Additional
  Features rather than core scope, since the task explicitly frames UV as
  "chip readout + a flourish," and the chip alone satisfies the core ask.

### 3. Garage-bay vehicle presence → furniture kind

- **Not a new canvas-fixture category** — a new `FurnitureKind` (e.g.
  `'car'`, alongside a possible `'car_suv'`/`'truck'` variant later), most
  naturally under a **new `vehicle` cat** (or folded into `outdoor`, since a
  garage-facing car could equally be modeled in a driveway/yard scene) so
  `furnitureCat(def)` groups it into its own sidebar optgroup ("Vehicles").
  This means the ENTIRE drag/place/select/lock/sidebar-row/bind machinery is
  free — only the kind-specific geometry + one new state-driven behavior are
  new work.
- **Geometry** (`_buildFurniture` new `case 'car':` in the kind switch,
  mirroring the existing composite-kind pattern used for `sofa`/`bed`/etc.):
  a simple faceted "toy car" silhouette in the Sims-toon style — rounded box
  body + a slightly narrower greenhouse/cabin box on top + 4 flattened
  cylinder wheels — built through `_mat()` like everything else (a saturated
  single body color, default a generic "sedan grey/blue", user-tintable the
  same way other furniture pieces expose color where applicable). Add the
  standard blob shadow (`_blobShadow`) and inverted-hull outline
  (`_addOutlines`) — this piece is a normal opaque furniture body, no
  exemptions needed. 2D: a labeled rounded rect in `drawFurniturePrimitive`
  (or a simple car-icon glyph) sized to the kind's default footprint.
- **Default footprint**: add a `FURNITURE_KINDS.car` entry sized to the
  mid-size reference above, e.g. `w: 1850, d: 4800, h: 1450` (mm, matching
  the `w`/`d`/`h` triple other kinds use) — NOT sittable (`seat` unset), NOT
  a `surface` (nothing mounts on a car roof), default footprint large enough
  to read clearly at typical floor-plan zoom.
- **Binding**: reuse the furniture's existing generic entity-bind flow
  (`entity_id`, `effectiveState`, `toggleItem`) exactly as-is — bind to the
  `binary_sensor.*` occupancy entity via the standard 🔗 Bind entity-picker
  flow, domain-filtered to `binary_sensor` at the picker call site (same
  pattern as `Door.doorEntity`/`SafetySensor` binds already do). **Do not**
  add a new bespoke field like `presenceEntity` — the generic `entity_id` +
  on/off contract already matches a binary_sensor's `on`/`off` states 1:1,
  so this is the one furniture kind that binds through the *plain* generic
  path rather than a kind-specific extra field like
  `doorEntity`/`tempEntity`.
- **The one genuinely new rendering behavior**: unlike every other bound
  furniture piece (which stays visible and just lights an LED/changes a
  swing/tilts a door), a garage-bay car should **hide the piece when the
  sensor reads unoccupied/off** (empty bay) and **show it when
  occupied/on** — because the whole point is "is the car here," not "is the
  car's LED lit." Implementation:
  - 3D: gate the car's `THREE.Group.visible` (and skip blob-shadow/outline
    updates while hidden — cheap, just a visibility flag, no rebuild) on
    `effectiveState(item)?.state === 'on'`. Unbound pieces (no `entity_id`,
    no `localState`) default to **always visible** (parked, static — matches
    how an unbound door/appliance defaults to its neutral resting state) so a
    user can place a plain decorative car without wiring anything. Unbound +
    `localState` set behaves like every other unbound interactive furniture
    piece (click-to-toggle visibility for a demo/manual mode) — free from
    the existing `toggleItem` contract.
  - 2D: same gate on `drawFurniture`'s existing per-piece resolve — skip
    drawing the shape (or draw a dim "empty bay" outline placeholder) when
    off.
  - **Dirty key**: this state already flows into the existing "compact
    appliance-state hash" that three-view folds into `_keyFloor` for bound
    furniture (per CLAUDE.md's "Device-state bindings on structural items"
    section) — a bound car's on/off just needs to be included in that hash
    exactly like fridge-door/appliance-in-use state already is, so the 3D
    scene rebuilds on state change. No new dirty key needed, just widen the
    existing hash's furniture predicate (`cat === 'appliance' ||
    isBinKind(kind) || kind === 'car'`).
  - This deliberately reuses the exact mechanism CLAUDE.md documents for
    bins (`isBinKind(kind)` folded into the same filter) — a car is
    architecturally a peer of a trash bin here: a furniture piece whose
    *entire visibility*, not just a sub-indicator, depends on bound state.
- **Layer**: rides the existing `furniture` (or `appliances`, if grouped
  under that cat instead of a new `vehicle` cat — recommend NOT reusing
  `appliances` semantically since a car isn't an appliance; either a new
  tiny `vehicle` layer key or, simplest, fold into the plain `furniture`
  layer) — no new layer key strictly required; recommend reusing
  `furniture` for simplicity unless the user wants independent toggling of
  vehicles vs indoor furniture.

---

## Integration steps

### Moon prop
1. Add `Store.moonEntity?: string` to `types.ts`; add to `_loadFromHa`'s
   explicit field list (else it resets on load, per the CLAUDE.md gotcha).
2. Sidebar: small bind row (existing entity-picker flow, domain `sensor`,
   ideally pre-filtered/search-assisted toward `moon`-platform sensors) in
   the Weather section or a new tiny "Sky" section.
3. `three-renderer.ts`: add `_moonGroup` (or a single sprite), build once,
   `_buildMoonSprite(phase)` redraws the canvas texture on phase change,
   dispose via the `_disposeSpriteMaps` pairing like every other sprite.
4. `three-view.ts`: read the bound moon entity's state each tick, compute
   `_keyMoon` = `phase|isNightPreset`; call the (re)build only when it
   changes; gate `.visible` on night preset (no extra layer flag needed per
   above, but wire one if desired for consistency with everything else
   being layer-gated).
5. Optional: 2D weather-chip glyph (🌑🌒🌓🌔🌕🌖🌗🌘) mapped from the 8 states.

### UV index
1. `types.ts`/`weather.ts`: confirm/add `WeatherNow.uvIndex?: number | null`.
2. `resolveWeatherEntity`: read `attributes.uv_index` (tolerate
   missing/undefined).
3. `fetchOpenMeteo`: widen the existing `daily=`/`hourly=` query strings to
   include `uv_index_max`/`uv_index`; parse `daily.uv_index_max[0]` (today)
   as the primary reading (or interpolate hourly for "right now" as a
   stretch).
4. `<diorama-weather-chip>`: append a UV line/icon, dim-when-stale/hidden-
   when-absent like the rest of the chip; optional color banding via a small
   `uvColor(v)` helper mirroring `envColor`'s threshold idiom.
5. (Optional, stretch) new `outdoor` `FurnitureKind` "parasol" whose look
   scales with `uvIndex`, folded into the existing appliance-state-hash
   idiom if pursued — treat as a separate follow-up, not required for the
   core ask.

### Garage-bay vehicle
1. `geometry.ts`: add `FURNITURE_KINDS.car` (`w`/`d`/`h` per reference sizes
   above, `cat: 'vehicle'` — new cat — no `seat`/`surface`/`activity`).
2. `canvas-render.ts`: add a `case 'car':` in `drawFurniturePrimitive`
   (simple rect/car-glyph); gate the draw on
   `effectiveState(item)?.state !== 'off'` when bound (see below).
3. `three-renderer.ts`: add a `case 'car':` in `_buildFurniture`'s kind
   switch (rounded body + cabin + 4 wheels, standard
   `_mat()`/blob/outline); register the state gate (`group.visible` per
   bound state) alongside the existing `_applianceDoors`-style per-fixture
   state bookkeeping (a lighter-weight analog — just a bool, not an eased
   blend, though an eased fade/scale-in on appear would read nicer and is
   cheap to add using the same trapezoid-blend idiom used elsewhere).
4. Widen the existing appliance-state hash (folded into `_keyFloor` per
   CLAUDE.md's "Device-state bindings" section) to include the car's bound
   state, alongside the existing `isBinKind` check.
5. Sidebar: `furnitureCat`/kind dropdown picks up `car` automatically (per
   CLAUDE.md, "The sidebar dropdown enumerates `Object.keys(FURNITURE_KINDS)`
   so it's automatic") — just confirm the new `vehicle` optgroup label is
   added to whatever cat-label map (`furnitureCat`) drives the sidebar
   dropdown's optgroups (CLAUDE.md flags this exact gotcha already happened
   once for `outdoor`).
6. No new `HaApi` method, no new WS call, no new `Store` top-level field
   (the binding is per-item `entity_id`, already generic) — this is the
   cheapest of the three features to ship.

---

## Potential additional features

- **Moon**: true azimuth/elevation via a small client-side ephemeris
  calculation (same spirit as existing sun-position math, but self-computed
  since HA's Moon integration doesn't expose position) — would let the moon
  actually rise/set/traverse the sky instead of sitting at a fixed point;
  meaningfully more work, optional.
- **Moon**: illumination-percentage-driven brightness/glow instead of just
  8-state shape (needs a custom/HACS integration or local ephemeris calc —
  the core Moon integration doesn't have it).
- **Moon**: tie moonlight into the 3D lighting rig itself (a faint blue-white
  fill light active only during `full_moon` + `night` preset) — cute, cheap,
  additive to `applyScenePreset`.
- **UV**: color-banded parasol/umbrella outdoor prop (see above) whose
  canopy visibly "closes"/"opens" or tints redder at high UV.
- **UV**: `OpenUV` core integration as a richer alternate entity source
  (dedicated max-UV-today + "safe exposure time" sensors) for users who want
  more precision than Open-Meteo's daily max.
- **UV**: tie into the existing frost/heat visual precedent — CLAUDE.md
  already has an `apparentC ≤ −3` frost trigger; a symmetric "high UV +
  clear + day" haze-shimmer or brighter sun-glare visual would be
  consistent, though likely diminishing returns for a Tier-3 ask.
- **Vehicle presence**: a dedicated ceiling "presence sensor" glyph fixture
  (distinct from the car silhouette) for users who want to see the physical
  ultrasonic/ToF module itself, mirroring the `SafetySensor` ceiling-puck
  fixture treatment — only worth it if a user actually wants the sensor
  visualized as well as its result.
- **Vehicle presence**: multi-sensor bay coverage (mirroring the Adonno
  "two-of-several sensors" reliability pattern) — out of scope for Diorama
  since Diorama binds to whatever single `binary_sensor` the user's own HA
  automation/template already resolved; the multi-sensor logic lives on the
  HA/ESPHome side, not in Diorama.
- **Vehicle presence**: a "car battery" / "EV charging" indicator riding the
  existing power-glow (`Furniture.powerEntity`) precedent if bound to a
  charger's power sensor — free reuse of an already-shipped mechanism.
- **Vehicle presence**: distance-to-wall "parking guide" readout (green→
  amber→red) if the underlying ESPHome device exposes the raw distance
  `sensor.*` in addition to the derived `binary_sensor.*` — richer than
  plain occupied/empty but meaningfully more scope (a second bound entity +
  a color-graded 2D/3D indicator); flag as a possible v2, not core.

---

## Open questions & risks

- **Moon position honesty**: since core HA doesn't expose moon azimuth/
  elevation, the "moon in the sky" prop is necessarily a stylized
  fixed-position billboard, not a physically accurate one. Decide up front
  whether that's acceptable (recommended: yes, treat it like the plumbob —
  an iconic, not literal, decoration) or whether it's worth the extra
  ephemeris-math scope to make it move correctly. Mixing "real sun position"
  (already shipped, reads `sun.sun`) with a "fake-static moon" in the same
  sky might look inconsistent — worth a design pass/user expectation check.
- **Southern Hemisphere crescent orientation**: MDI's (and thus most
  people's mental model of) crescent shapes assume Northern Hemisphere
  framing; if Diorama draws its own crescent shape rather than just tinting
  a disc, it inherits this same fragility unless it also accounts for
  hemisphere (which Diorama *can* derive — it already has `Store.geo`
  lat/lon calibration data from the World Outside arc, so this is solvable
  in principle, but is scope creep for a Tier-3 feature). Recommend a simple
  non-hemisphere-sensitive fallback (e.g. a percentage-fill gauge rather
  than a directional crescent shape) if this correctness rabbit hole isn't
  worth entering.
- **UV `uv_index` vs `uv_index_max` naming collision risk**: HA core's
  weather entity attribute is named `uv_index` in BOTH current-conditions
  and per-forecast-period contexts (same name, different meaning: "right
  now" vs "this forecast period's value") — code reading forecast rows must
  not confuse it with the live current-condition attribute of the same
  name. The `_max` suffix only exists on the raw Open-Meteo HTTP API, not in
  HA's own entity model — don't let an Open-Meteo-shaped field name leak
  into entity-source code paths or vice versa.
- **UV data availability is provider-dependent**: not every `weather.*`
  integration populates `uv_index` (many popular ones — e.g. plain
  OpenWeatherMap's default entity — may not; verify per-integration before
  assuming `entity`-source coverage is universal). The chip must tolerate
  absence gracefully (already the established pattern for every optional
  `WeatherNow` field).
- **Vehicle-presence device_class fragmentation**: because there's no
  official integration, the community's `binary_sensor` bindings vary in
  `device_class` (`occupancy` vs `presence` vs none) and in naming
  conventions entirely at the mercy of each user's own ESPHome YAML /
  template sensor author. Diorama must treat this as a **generic on/off
  binary_sensor** and not special-case any particular `device_class` — this
  is already the right level of genericity given the existing furniture
  bind contract, but worth stating explicitly so a future implementer
  doesn't over-fit to `occupancy` specifically.
- **Hide-vs-dim decision for the car**: hiding the whole piece when "empty"
  is the literal ask, but consider whether a dimmed/ghost outline when empty
  (vs. fully invisible) reads better in the editor — fully invisible could
  make an editor forget the fixture exists / make it hard to re-select and
  reposition while the bay happens to be empty. Recommend: render a faint
  dashed "empty bay" outline placeholder (2D) and simply hide the 3D body
  (3D empty space reads fine, no clutter) — analogous to how door/window
  fixtures never fully vanish in 2D but do fully resolve their swing state
  in 3D.
- **New `vehicle` cat vs folding into `outdoor`**: garages are indoor but
  vehicle-adjacent; driveways are outdoor. A dedicated `vehicle` cat avoids
  awkwardly mixing car kinds into the `outdoor` optgroup (trees/bushes/bins)
  but is one more cat for `furnitureCat` to carry. Low-stakes, pick either;
  `vehicle` is recommended for clarity.

---

## Sources

- [Moon — Home Assistant integration docs](https://www.home-assistant.io/integrations/moon/)
- [moon sensor icon is wrong for southern hemisphere · home-assistant/core#74722](https://github.com/home-assistant/core/issues/74722)
- [moon-waxing-crescent — Pictogrammers MDI library](https://pictogrammers.com/library/mdi/icon/moon-waxing-crescent/)
- [Weather entity — Home Assistant Developer Docs](https://developers.home-assistant.io/docs/core/entity/weather/)
- [Get weather forecasts (`weather.get_forecasts`) — Home Assistant actions docs](https://www.home-assistant.io/actions/weather.get_forecasts/)
- [Weather — Home Assistant integration docs](https://www.home-assistant.io/integrations/weather/)
- [Met.no (Meteorologisk institutt) — Home Assistant integration docs](https://www.home-assistant.io/integrations/met/)
- [Open-Meteo — Home Assistant integration docs](https://www.home-assistant.io/integrations/open_meteo/)
- [Open-Meteo Forecast API docs](https://open-meteo.com/en/docs) (verified live: `daily=uv_index_max`, `hourly=uv_index`, unitless)
- [OpenUV — Home Assistant integration docs](https://www.home-assistant.io/integrations/openuv/)
- [Binary Sensor — Home Assistant integration docs (device classes)](https://www.home-assistant.io/integrations/binary_sensor/)
- [Binary sensor entity — Home Assistant Developer Docs](https://developers.home-assistant.io/docs/core/entity/binary-sensor/)
- [Cheap car presence & position detection in Home Assistant with ESPHome — adonno.com](https://adonno.com/car-presence-position-detection/)
- [ultrasonic-garage-parking-assist — GitHub (rkhanso)](https://github.com/rkhanso/ultrasonic-garage-parking-assist)
- [Garage parking aid to park in exact spot — Home Assistant Community](https://community.home-assistant.io/t/garage-parking-aid-to-park-in-exact-spot/300682)
- ESPHome component docs referenced by name (standard/well-known, not individually re-fetched): `ultrasonic` sensor platform, `vl53l0x`/`vl53l1x` sensor platforms (esphome.io/components/sensor/…).
