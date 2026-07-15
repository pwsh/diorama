# Irrigation / Sprinkler Zones

## 1. Summary

Irrigation controllers (Rachio, Rain Bird, Orbit B-hyve, and generic
valve/relay controllers) expose each sprinkler **zone** as a simple
on/off actuator in Home Assistant — almost always a `switch.*` entity,
occasionally a `valve.*` entity. Diorama already owns the yard: ground
coverings (`Floor.groundAreas`, `GroundKind` grass/mulch/etc.), outdoor
furniture (trees, bushes, fountain, lawn chairs, picnic table), and a
whole "World Outside" arc of spatial context (weather, GPS, geo
landmarks). Irrigation is the natural next yard fixture: a small
ground-embedded fixture bound to a switch/valve entity, placed on the
lawn, that draws a **spray arc / fan animation while its bound entity
is on** — exactly the same "device-state animates a static-looking
object" idiom already used for the fireplace flicker, appliance
in-use LEDs, and the 3D weather-rain particle system.

Why it fits Diorama specifically:
- It's spatial in a way no app/dashboard can be: *which* zone is
  running and *where* in the yard, at a glance, overlaid on the
  actual yard layout (ground coverings, beds, trees) the user already
  modeled.
- It reuses nearly all existing machinery: the canvas-fixture recipe,
  the `localState`/`effectiveState` idiom for unbound zones, the
  layer-visibility convention already used for ground areas/outdoor
  furniture, and — for the actual animation — the exact `THREE.Points`
  / `PointsMaterial` spray-particle idiom the weather system already
  built for rain.
- It's a system that is *usually invisible/underground* (buried pipes,
  buried valves) whose only observable moment is a transient visual
  event (water spraying) — a great fit for the "make invisible home
  state visible in space" mission of the whole app.

## 2. Home Assistant data model

### 2.1 Core domains

**`switch` domain** — this is what essentially every real irrigation
integration uses for a zone today, in spite of the newer `valve`
domain existing.
- States: `on` / `off` / `unavailable` / `unknown` (standard binary
  switch state machine — https://www.home-assistant.io/integrations/switch/,
  https://developers.home-assistant.io/docs/core/entity/switch/).
- `device_class` (optional, rarely set for irrigation): `outlet` or
  `switch` (generic). There is **no `irrigation` or `valve`
  device_class for the switch domain** — a zone switch is visually
  indistinguishable from any other switch entity except by its
  `entity_id`/friendly name (e.g. `switch.front_yard`, `switch.zone_3`)
  and by which integration created it. Diorama cannot auto-detect
  "this switch is a sprinkler zone" the way it can guess an EnvKind
  from `device_class` — **it must be explicit user binding**, same as
  any other switch fixture today.
- Actions: `switch.turn_on`, `switch.turn_off`, `switch.toggle` (no
  duration parameter at the domain level — see integration-specific
  actions below for timed runs).

**`valve` domain** (added in HA core 2024.1, under-adopted for
irrigation specifically but the modern generic primitive) —
https://www.home-assistant.io/integrations/valve/,
https://developers.home-assistant.io/docs/core/entity/valve/.
- States: `open`, `opening`, `closed`, `closing`, `unavailable`,
  `unknown` — plus `stopped` for valves that support the `STOP`
  feature and were halted mid-travel.
- `device_class`: `water` ("valve that controls the flow of water
  through a system") or `gas`; default none. **`water` is the one to
  key off** if a user ever binds a `valve.*` entity to a Diorama zone.
- Attribute: `current_position` (0–100 int) — only present when the
  valve supports `ValveEntityFeature.SET_POSITION`; a plain open/close
  valve has no position attribute (state is binary open/closed
  instead). Condition helper `valve.is_open` combines with a
  numeric-state check on `current_position` to test "fully open"
  (https://www.home-assistant.io/conditions/valve.is_open/).
- Actions: `valve.open_valve`, `valve.close_valve`,
  `valve.set_valve_position` (data: `position: 0-100`),
  `valve.stop_valve`, `valve.toggle`. Feature flags gate which are
  implemented per-entity (`OPEN`/`CLOSE`, `SET_POSITION`, `STOP`).
  Rachio's own "smart hose timer" valves are exposed as `switch`
  entities today, not `valve` — i.e. even Rachio's newer hardware line
  didn't move to the `valve` domain in the HA integration.

**Practical takeaway for the data model:** Diorama's irrigation zone
fixture should bind to **either** a `switch.*` **or** a `valve.*`
entity (mirroring how `Door.lockEntity`/`AlarmPanel` already treat a
secondary domain, or how the doorbell picker already accepts
`string | string[]` domain lists). Resolve "is it running" via a
helper mirroring `doorOpenFraction`: `switch` → `state === 'on'`;
`valve` → `state === 'open'`/`'opening'` (or `current_position > 0`
if present).

### 2.2 Integration-specific detail (core, all in HA core proper)

**Rachio** — https://www.home-assistant.io/integrations/rachio/
(core, cloud push via webhook, **requires HA be reachable from the
internet** — Nabu Casa or port-forward — for switches/sensors to
update; this is a real limitation worth flagging to users).
- Entities: one `switch.*` per enabled zone per controller, one switch
  per smart-hose-timer valve, one switch per schedule (start/stop), a
  controller standby-mode switch, a 24-hour rain-delay switch, a
  `binary_sensor.*` for system status, and a `calendar.*` per smart
  hose timer base station (past/future schedule events; an upcoming
  event can be deleted from the calendar to skip it).
- Actions (all core, `rachio.*` namespace):
  - `rachio.start_watering` — target: entity/device/area/floor/label
    selector resolving to zone/valve switches; data: `duration`
    (integer minutes, optional — omit to run the entity's default/
    schedule length; max 3 hours for sprinkler zones, 24 hours for
    smart hose timers). https://www.home-assistant.io/actions/rachio.start_watering/
  - `rachio.stop_watering` — stops any currently running zones/
    schedules for the targeted switches (same target shape, no
    duration).
  - `rachio.pause_watering` / `rachio.resume_watering` — pause/resume
    without losing schedule position.
  - `rachio.set_zone_moisture_percent` — sets a zone's soil moisture
    percentage (feeds Rachio's own smart-schedule algorithm; a write,
    not a readable telemetry value).
  - `rachio.start_multiple_zone_schedule` —
    https://www.home-assistant.io/actions/rachio.start_multiple_zone_schedule/
    builds an ad-hoc schedule across a zone list with per-zone run
    times in one call (useful for a future Diorama-driven "run these 3
    zones for N minutes" flow, out of scope for the visualization
    itself).
  - Legacy per-switch YAML attribute `manual_run_mins` (optional,
    historical default 10) sets how long a bare `switch.turn_on` runs
    a zone for when no duration is otherwise specified.
- **Flow/water-usage is NOT reliably available over the WS API today.**
  Rachio's own app shows gallons via the EveryDrop/wireless flow meter
  hardware, and the cloud API delivers a `flowVolume` value on
  ZONE_STARTED/ZONE_COMPLETED webhooks, but the HA Rachio integration
  does not document a dedicated flow/gallons sensor entity built from
  that. Do not design a Diorama flow-rate readout against a real
  attribute name without confirming it exists on a live install first
  (see Open questions).

**Rain Bird (LNK WiFi module)** —
https://www.home-assistant.io/integrations/rainbird/ (core, local
push, polled — no cloud dependency, in contrast to Rachio).
- Entities: `switch.*` per zone ("Irrigation Zone" — switches
  auto-added for all available zones, polled every ~1 minute),
  `binary_sensor.*` rain sensor, `number.*` rain-delay (days of
  automatic delay), `calendar.*` controller irrigation schedule
  (fetched every ~15 min).
- Action: `rainbird.start_irrigation` — starts a zone for N minutes
  (config default 6 minutes, overridable per call).
- Caveat: the LNK WiFi module accepts only one inbound request at a
  time — concurrent use of the Rain Bird phone app can transiently
  break the HA integration's polling/commands. Worth a doc footnote,
  not a Diorama design constraint.

### 2.3 Custom / HACS (flag clearly as non-core)

- **Orbit B-hyve** (`sebr/bhyve-home-assistant`, HACS, **not** a core
  integration) — `switch.*` per zone (+ rain-delay switch, per-zone
  "smart watering" toggle, program toggles), `sensor.*` zone-history
  (watering history per zone on a `sprinkler_timer` device),
  `binary_sensor.*` for flood detection, temperature alerts, station
  faults, and Wi-Fi bridge connectivity. No official
  home-assistant.io integration page exists; treat entity/attribute
  names as community-documented, not guaranteed stable across
  releases.
- **Irrigation Unlimited** (`rgc99/irrigation_unlimited`, HACS) — a
  *scheduling layer* that sits on top of any switch/valve entity
  rather than talking to hardware itself. Creates
  `binary_sensor.irrigation_unlimited_cN_zN` per zone carrying
  attributes like current schedule / next run / duration, plus
  service calls to enable/disable and manually run zones. Relevant to
  Diorama only as *another possible entity shape* a user might bind
  (a `binary_sensor` instead of `switch`/`valve`) — worth supporting
  `binary_sensor.*` as a third optional bindable domain (read-only
  state, no toggle) the same way other Diorama fixtures already mix
  read-only and controllable secondary bindings on one item.
- Both are common enough in the wild (large, long-running HA community
  threads) that Diorama's entity picker for this fixture should accept
  domain list `['switch', 'valve', 'binary_sensor']` rather than a
  single domain, matching the existing `string | string[]` domain
  picker capability already used elsewhere (e.g. the doorbell
  binding).

### 2.4 What is NOT available over the WS API

- Flow rate / gallons-used per cycle — no standard core sensor entity;
  only present if the user has separately wired a flow-meter sensor
  entity (e.g. via a physical flow sensor + ESPHome, or a Flume
  integration) that Diorama could optionally *also* let the user bind
  as an EnvKind-style readout, but there is no first-class "irrigation
  flow" attribute to depend on.
  Reference: https://community.home-assistant.io/t/i-need-help-with-flume-and-rachio-monitoring-flow-while-irrigation-is-running/953314
- Soil moisture percent is *settable* (Rachio's
  `set_zone_moisture_percent` service) but not a *readable sensor*
  over the API — it's a write-only tuning knob for Rachio's own
  scheduling brain, not telemetry Diorama can display.
- Real per-nozzle pressure/spray-pattern data does not exist in HA at
  all — any spray radius/arc shown in Diorama is a **user-configured
  visual property** on the fixture (like `Sensor.fov`/`range` for
  mmWave), not something read from HA.
- Rachio requires the HA instance to be internet-reachable for state
  updates to arrive at all (cloud webhook push) — a purely local HA
  setup with no remote access will show stale/never-updating zone
  switches. This isn't a WS-API gap exactly, but it means "zone shows
  on" may lag real-world reality more than other Diorama fixtures.

## 3. Real-world / visual reference

**Pop-up spray heads** (the dominant residential fixture type; matches
what a Diorama yard would realistically show):
- Pop-up body height (retracted, at grade): commonly 2", 3", 4" (~100
  mm, most common for lawn), 6", 12" (flower beds) — i.e. flush with
  grass when off, rising only when pressurized.
- Riser pop-up height when spraying: 2–6 inches typical for lawn heads
  (~50–150 mm) — a small nub above grade, NOT a tall visible fixture.
- Spray radius: adjustable nozzles typically throw 10, 12, or 15 ft
  (~3–4.5 m / 3000–4500 mm) at full arc, adjustable down roughly 30%
  (e.g. a 10 ft nozzle can trim to ~7 ft).
- Arc pattern: adjustable 0°–360° — quarter/half/full circle are the
  common presets; rotor heads (larger lawns) sweep a rotating single
  stream back and forth across the arc rather than a static fan.
- Precipitation/delivery rate: ~1–2.5 inches/hour for spray heads (a
  visual-flavor detail only, not needed for the model).
- Operating pressure 15–70 PSI (30 PSI typical) — irrelevant to the
  visual model but explains why misting/fogging sometimes appears at
  the edge of a spray (could be a nice touch at high "intensity").
- Color: pop-up bodies are almost always dull grey/black plastic at
  grade — the body itself is not a design focus; the *water* is the
  visual signal.
- Placement: heads sit inside `GroundArea` polygons of kind `grass`
  (primarily) — a Diorama irrigation zone fixture logically lives
  layered over/near an existing ground area, not as its own footprint
  competing with furniture placement.

Sources: DripWorks buying guides, Rain Bird 1800/Sure-Pop product
pages, Orbit product pages, Colorado State University Extension
sprinkler-type PDF (see Sources section).

## 4. Diorama visualization & animation design

### 4.1 New type (`types.ts`)

```ts
export type SprinklerHeadKind = 'spray' | 'rotor' | 'drip';

export interface SprinklerZone {
  id: string;
  x: number; y: number;          // head position, world mm (sits inside a GroundArea)
  entity_id: string | null;      // switch.* ('on'=running) OR valve.* ('open'/'opening'=running)
                                  //   OR binary_sensor.* (read-only, e.g. irrigation_unlimited)
  headKind?: SprinklerHeadKind;  // default 'spray'
  arcDeg?: number;                // spray arc width, degrees; default 180 (half-circle)
  rotation?: number;               // degrees, screen-CW, arc center direction; default 0 (+Y world)
  radius?: number;                 // spray throw, world mm; default 3000 (≈10 ft)
  label?: string;
  zoneNumber?: number;             // optional user label ("Zone 3") shown on the chip
  localState?: string;             // local control when UNBOUND ('on'/'off'). See Planner.effectiveState.
  locked?: boolean;
}
```
Per-floor array `Floor.sprinklerZones?: SprinklerZone[]` — `repairFloor`
+ `defaultFloor` backfill `[]`, same as `groundAreas`/`robots`/`cameras`.

`drip` is included as a head kind for completeness (drip lines show no
spray animation, just a small emitter icon + a subtle "wet soil"
darkening decal — most drip zones in the wild are on food gardens/
flower beds, a natural pairing with `flower_bed` furniture) but the
primary build target is `spray`/`rotor`.

### 4.2 State resolution

New pure helper in `geometry.ts`, mirroring `doorOpenFraction`:

```ts
function sprinklerRunning(st: HassState | null): boolean {
  if (!st) return false;
  if (st.state === 'on' || st.state === 'open' || st.state === 'opening') return true;
  const pos = st.attributes?.current_position;
  return typeof pos === 'number' && pos > 0;
}
```
Routed through `Planner.effectiveState(item)` exactly like every other
bindable fixture, so an **unbound** zone can still be demoed via
`localState` (`'on'`/`'off'`) and the same `Planner.toggleItem` click
path works for testing without hardware.

### 4.3 2D representation (`canvas-render.ts` / `canvas-hit.ts` / `canvas-interact.ts`)

- **At rest (off)**: a small flush disc (grey, ~10 px at typical zoom)
  at the head position — visually minor, matching the real fixture
  being nearly invisible at grade. Optional dim `Zone N` label if
  `zoneNumber` is set.
- **Running (on)**: draw a filled, semi-transparent **arc/wedge**
  (`ctx.arc` + `lineTo` back to center, light-blue fill ~35% alpha)
  spanning `arcDeg` centered on `rotation`, radius `radius` — the same
  geometric approach already used for sensor/camera FOV wedges.
  Animate: for `spray`, pulse the wedge alpha with a fast
  `performance.now()`-based ripple (the same idiom as the safety-sensor
  alarm rings / doorbell expanding rings) to read as "moving water"
  without per-droplet simulation in 2D. For `rotor`, additionally sweep
  a brighter narrow sub-arc back and forth across the full `arcDeg`
  envelope over ~3 s (a rotating highlight inside the static wedge) —
  cheap, reads as "rotor head," and costs nothing extra since the RAF
  already redraws every frame for other animated fixtures (fireplace,
  safety alarms).
- Ground darkening (nice-to-have, not required v1): while running (and
  briefly after — a fixed ~90 s linger), tint the covered `GroundArea`
  cells beneath the wedge slightly darker/wetter — the same visual
  language as the weather rain-puddle system (`_puddleFade`), tying
  the zone visibly to the actual lawn/bed it waters.
- Hit-testing: `hitSprinklerZone` — a simple point-in-circle test on
  the head position (small radius, free placement, no wall-snap —
  mirrors the safety-sensor/BLE-proxy "ceiling detector" model even
  though this is a ground fixture). The spray wedge itself is **not**
  clickable (matches the "paint never swallows fixture clicks" rule
  already established for ground areas/presence zones) — clicking
  toggles the head, not the water.
- Drag kind `sprinkler` in `canvas-interact.ts`'s move-case switch;
  place-tool entry (glyph — 🚿 suggested, since 💧 already reads as
  "leak puddle" in the safety-sensor system and would visually
  collide).
- Layer: rides the existing **`ground`** layer (absent = on) alongside
  `groundAreas` — semantically "yard paint/fixtures," not `sensors`.
  Recommendation: **`ground` layer**, since irrigation heads are
  yard-embedded fixtures conceptually paired with the ground coverings
  they sit in, and toggling "show yard stuff" off should hide
  sprinklers along with grass/trees/bins. (Alternative: gate under
  `sensors` like BLE proxies/cameras/robots, grouping all "bindable
  device fixtures" together regardless of indoor/outdoor — a product
  call, flagged in Open Questions.)

### 4.4 3D representation (`three-renderer.ts` / `three-view.ts`)

- **Group**: new `_sprinklerGroup` (declared alongside `_groundGroup`,
  added to `scene.add`, `clearTransientGroups`, `destroy`,
  `setLayerVisibility` — the group `.visible` flips with the `ground`
  layer flag).
- **Head build** (`updateSprinklerZones(zones, stateProvider)`, called
  from `updateFloor`'s ground-related section): a tiny flush disc/nub
  at y≈15–40 mm (like the leak-sensor floor puck / ground-area patch
  y-levels) through `_mat({...})` — no outline shell needed (too
  small to read, matches how safety-sensor bodies/battery badges skip
  outlines). Rotor heads get a marginally taller nub than spray heads
  (cosmetic distinction only).
- **Spray animation — reuse the weather precip-particle idiom
  directly**: build a small `THREE.Points` cloud per RUNNING zone
  (`PointsMaterial`, the documented `_mat`-factory exemption already
  used for rain/snow/hail/dust) with droplets seeded within the
  `arcDeg`/`radius` wedge, arcing up and out from the head (parabolic
  fall — `y` rises then falls, recycled on a short ~0.6–1.2 s cycle
  like the rain recycle-band idiom, but a ballistic arc instead of a
  straight vertical fall) and drifting per `rotation`. Reuse
  `_rainTexture()`'s soft round-droplet `CanvasTexture` (already
  built, shared, disposed only in `destroy()`) rather than authoring a
  new particle sprite. Count: small, e.g. 40–90 points per head
  (irrigation heads are much smaller/closer-range than a whole-sky
  weather system — no DPR-cap needed at this scale, but keep an eye on
  total heads × points if a yard has a dozen zones).
- **Per-frame motion**: a new `_advanceSprinklers(dt)` called from
  `_animate` **only while at least one zone is running** (mirrors "an
  ON fireplace forces `updateLightsSwitches` every frame" — here the
  cheap condition is "any zone running," not unconditionally every
  frame) — mutates each running zone's Points position buffer in
  place (`needsUpdate = true`), zero allocation after build, exactly
  like `_advanceWeather`.
- **Rotor sweep**: rotor-kind heads additionally ease a virtual
  "current stream angle" back and forth across `arcDeg` each ~2–4 s
  (pure `Math.sin`-driven, no `Math.random`) and bias new-particle
  spawn angle toward that sweep position — gives the rotor look
  distinct from the static spray fan without a second code path.
- **Dirty key**: `_keySprinklers` in three-view — build (head
  geometry, arc/radius/kind/rotation) depends on `configRev` + each
  zone's running boolean (bucketed on/off is enough; **do not** put
  the animation phase in the dirty key — that lives in
  `_advanceSprinklers` exactly like weather/appliance-door blends
  survive rebuilds). Zone entity ids are **LIVE-path** in
  `_isSlowEntity` (a running sprinkler is a transient, fast-arriving
  state — matches how fireplace/light-glow states are treated), NOT
  config-path, so the spray starts/stops promptly without waiting for
  a slow-path reconcile tick.
- **Click behavior**: raycast hit on the head nub → `userData.kind =
  'sprinkler'` → same click routing as switches/lights: bound →
  `Planner.toggleEntity` (which resolves `switch.toggle` or
  `valve.toggle` correctly via the existing domain-sniffing
  `toggleEntity`); unbound → `Planner.toggleItem` flips `localState`.
  No dblclick config modal needed for v1 (unlike lights, there's no
  brightness/color to tune) — dblclick could later open the entity
  picker like other unbound fixtures.

### 4.5 Sidebar (`sidebar.ts`)

New `_section('sprinklers', 'Sprinklers', …)` (or folded into a
subsection under the existing ground/yard section) — per-zone: bind
(entity picker, domains `['switch','valve','binary_sensor']`), head
kind dropdown, arc-degrees slider, radius slider, rotation, zone
number/label, lock toggle, delete. Mirrors the `safety`/`robots`
section shape. A "Run for N minutes" quick button could call
`rachio.start_watering`/`rainbird.start_irrigation`/plain
`switch.turn_on` depending on detected domain — nice-to-have, not
required for the visualization itself (v1 can rely on the existing
generic toggle).

## 5. Integration steps (canvas-fixture recipe)

1. **`types.ts`**: add `SprinklerHeadKind`, `SprinklerZone` interface,
   `Floor.sprinklerZones?: SprinklerZone[]`.
2. **`geometry.ts`**: defaults (`SPRINKLER_DEFAULTS`: arcDeg 180,
   radius 3000, headKind 'spray'), `sprinklerRunning(st)` pure state
   resolver, any color/texture constants.
3. **`repairFloor` / `defaultFloor`**: backfill `sprinklerZones: []`.
4. **`canvas-render.ts`**: `drawSprinklerZones` (head disc + running
   wedge + pulse/rotor-sweep animation), gate in `drawAll` under the
   `ground` layer.
5. **`canvas-hit.ts`**: `hitSprinklerZone` (point-in-circle on head,
   small radius; wedge non-interactive).
6. **`canvas-interact.ts`**: mousedown/move/up drag case (`sprinkler`
   kind, free placement — no wall/ground-area snap needed, though
   consider snapping the head to fall *inside* the nearest GroundArea
   polygon if one exists, as a nicety), place-tool entry + `TOOLS`
   glyph + tool hint text, delete-tool branch, cursor.
7. **`sidebar.ts`**: `_section('sprinklers', …)` editor row (bind,
   head kind, arc/radius/rotation, zone number, lock, delete) +
   `TOOLS` array entry.
8. **`three-renderer.ts`**:
   - declare `_sprinklerGroup`; add to `scene.add`,
     `clearTransientGroups`, `destroy`, `setLayerVisibility` (rides
     `ground` layer visibility).
   - `updateSprinklerZones(zones, stateProvider)` — builds head nubs +
     (re)builds the per-zone `Points` spray cloud for zones whose
     running-state changed.
   - `_advanceSprinklers(dt)` — per-frame droplet motion + rotor
     sweep, called from `_animate` guarded on "any zone running."
   - reuse `_rainTexture()` for the droplet sprite; do not build a
     separate texture unless visual differentiation from rain is
     requested later.
9. **`three-view.ts`**: `_keySprinklers` dirty key (configRev +
   bucketed running-state per zone + headKind/arc/radius/rotation
   hash); call `updateSprinklerZones` when it changes; fold
   running-zone entity ids into `_isSlowEntity` as **live-path** (fast
   on/off matters).
10. **Entity ids**: confirm `_isSlowEntity` treats sprinkler zone
    `entity_id`s as live-path (not slow/config) so the spray starts
    the instant the switch/valve flips, consistent with how
    lights/fireplace glow already behave.
11. Add a `sprinkler-test.html` (or fold into `yard-test.html`) smoke
    test page verifying: head placement/hit-test, running-state wedge
    draw, dirty-key rebuild only on state-bucket change, particle
    system builds/disposes cleanly, layer visibility gating.

## 6. Potential additional features

- **"Run zone for N minutes" quick action** from the sidebar/3D
  click, calling the detected integration's timed-run action
  (`rachio.start_watering`, `rainbird.start_irrigation`) with a
  duration field, falling back to plain `switch.turn_on`/`valve.
  open_valve` (no duration) for anything else. Needs per-integration
  domain detection (probably by checking which service exists via
  `hass.services`, or the entity's registry `platform` field — HA's
  `getEntityRegistry` already returns `platform` in Diorama's
  `HaEntityReg` type, so this is plumbable).
- **Schedule/calendar overlay**: Rachio and Rain Bird both expose a
  `calendar.*` entity for upcoming irrigation events — a "next run:
  in 2h" caption on the zone chip (2D) or sprite (3D) would need a new
  `calendar.list_events` WS/service call added to `HaApi` in both
  clients, similar to how `getWeatherForecasts` was added.
- **Rain-delay / freeze indicator**: Rachio/Rain Bird both have a
  rain-delay `switch`/`number` entity — a small "🌧️ delayed" badge on
  the whole irrigation controller (not per-zone) would be a cheap,
  useful glance-status, similar to an alarm-panel state badge.
- **Wet-ground decal linger** tying into the existing weather-puddle
  visual system (`_puddleTex`/`_puddleFade`) — a running zone leaves a
  fading "wet grass" darkening on the covered `GroundArea` for
  ~10–20 min after it stops, reusing the exact puddle-fade
  survives-rebuild mechanism documented for rain (weather W3).
- **Flow-meter / water-usage readout** as an EnvKind-style bound
  sensor, IF the user has a real flow-meter entity (Rachio EveryDrop
  hardware surfaced via some other sensor path, a Flume integration,
  or a DIY ESPHome flow sensor) — treat it as an *optional secondary
  binding* on the irrigation controller as a whole (like `AlarmPanel`'s
  code, or `Furniture.powerEntity`), not a per-zone attribute Diorama
  can assume exists.
- **Soil moisture chip**: if the user has independent soil-moisture
  sensors (common DIY/ESPHome), bind them as ordinary `EnvSensor`
  fixtures (kind `generic` or a new `soil_moisture` EnvKind) placed
  inside the relevant `GroundArea`/`flower_bed` — this already works
  today with zero new code, worth noting as a "just use what exists"
  answer rather than over-building.
- **Drip zone**: quieter visual (no spray arc) — a small emitter glyph
  + slow soil-darkening decal along a user-drawn line/polygon, useful
  for garden-bed drip irrigation as distinct from lawn spray/rotor
  heads. Lower priority than spray/rotor.
- **Multi-zone "schedule running" indicator**: Rachio's per-schedule
  switch (start/stop a whole schedule, not just one zone) could
  highlight ALL zones in that schedule at once when a schedule switch
  is on — needs a data link (schedule → its member zone entity ids)
  that HA does not expose cleanly over the API; likely out of reach
  without per-integration special-casing (see Open questions).

## 7. Open questions & risks

- **No standard "this switch is a sprinkler zone" signal.** Unlike
  EnvKind (keyed off `device_class`) or safety sensors, there is
  nothing in the entity metadata that says "irrigation." Binding must
  be 100% manual/explicit — acceptable (matches lights/switches/TVs
  today) but means zero auto-discovery, unlike e.g. LD2450 sensor
  discovery.
- **Vendor fragmentation.** Rachio (cloud, core), Rain Bird (local,
  core), B-hyve (cloud, HACS-only), Irrigation Unlimited (local
  scheduling layer over existing switches, HACS), and countless DIY
  ESPHome/Shelly relay setups all produce different entity shapes
  (switch vs valve vs binary_sensor) with different attribute
  richness. The visualization must degrade gracefully to "just an
  on/off dot" when only a bare switch is bound, and only show
  arc/rotor detail as user-configured visual properties (never
  assumed to be read from HA).
- **Flow/gallons and soil-moisture READ attributes are unconfirmed on
  live installs.** Web documentation does not show a dedicated core
  sensor entity for Rachio flow-meter gallons or a readable soil
  moisture sensor. Before shipping any "gallons used this cycle" UI,
  verify against a real Rachio account with EveryDrop hardware (or
  drop the idea and treat flow/moisture purely as separate optional
  EnvSensor bindings the user supplies themselves).
- **Rachio's internet-reachability requirement** means Diorama's zone
  state could be significantly stale on a fully local HA setup —
  worth a one-line note in the sidebar bind UI ("Rachio requires HA to
  be internet-reachable for live updates") so users don't file "my
  sprinkler never shows running" bugs that are actually a Rachio/HA
  networking limitation, not a Diorama bug.
- **Duration/timed-run actions are integration-specific service
  calls** (`rachio.start_watering`, `rainbird.start_irrigation`), not
  part of the generic `switch`/`valve` domain — if Diorama wants a
  "run for N minutes" button (§6) it must detect which integration
  owns the bound entity (there's no clean generic way to do this over
  WS beyond checking `hass.services` for the presence of
  `rachio`/`rainbird` domains, or looking at the entity's `platform`
  via entity registry). Simpler v1: just toggle on/off and let the
  user's own HA automations/schedules own duration.
- **Arc/radius/rotation are pure user-entered visual properties**, not
  read from HA (no nozzle metadata exists anywhere in HA) — set
  expectations that this is an artistic yard-sprinkler-plan feature,
  not a metrologically accurate coverage simulation.
- **Layer assignment (`ground` vs `sensors`) is a judgment call** — see
  §4.3 recommendation; confirm with whoever owns the layer-preset UX
  before committing, since it affects which built-in presets
  show/hide sprinklers by default.
- **Glyph choice** for the tool button needs to avoid collision with
  existing yard/water iconography (💧 already reads as "leak puddle" in
  the safety-sensor system) — pick something distinct (🚿 suggested).

## 8. Sources

- https://www.home-assistant.io/integrations/switch/
- https://developers.home-assistant.io/docs/core/entity/switch/
- https://www.home-assistant.io/integrations/valve/
- https://developers.home-assistant.io/docs/core/entity/valve/
- https://www.home-assistant.io/conditions/valve.is_open/
- https://www.home-assistant.io/actions/valve.close_valve/
- https://www.home-assistant.io/actions/valve.toggle/
- https://www.home-assistant.io/integrations/valve.mqtt/
- https://www.home-assistant.io/integrations/rachio/
- https://www.home-assistant.io/actions/rachio.start_watering/
- https://www.home-assistant.io/actions/rachio.start_multiple_zone_schedule/
- https://mantikor.github.io/components/switch.rachio/ (legacy
  platform docs — `manual_run_mins` attribute)
- https://community.home-assistant.io/t/support-rachio-flow-meters/534274
- https://community.home-assistant.io/t/i-need-help-with-flume-and-rachio-monitoring-flow-while-irrigation-is-running/953314
- https://rachio.com/products/everydrop-flow-meter
- https://www.home-assistant.io/integrations/rainbird/
- https://github.com/sebr/bhyve-home-assistant
- https://github.com/rgc99/irrigation_unlimited
- https://community.home-assistant.io/t/irrigation-unlimited-integration/325468
- https://www.dripworks.com/blog/lawn-sprinkler-popups-and-nozzles
- https://www.dripworks.com/resources/buying-guides/pop-up-sprinkler-buying-guide
- https://www.sprinklersupplystore.com/blogs/learning-center/how-to-measure-your-sprinkler-height
- https://cmg.extension.colostate.edu/wp-content/uploads/sites/59/2020/01/Sprinkler-Types-for-Lawn-Irrigation.pdf
- https://www.rainbird.com/products/1800-series-pop-spray-heads-international
- https://www.amazon.com/Rain-Bird-Pop-Up-Sprinkler-Pattern/dp/B0000DI814
  (Sure Pop 600 series spec sheet — 2.5" pop-up height, 8-15 ft spray)
- Diorama repo internals referenced for architecture grounding:
  `src/types.ts` (`SwitchFixture`, `RobotFixture`, `GroundArea`),
  `src/geometry.ts` (`FURNITURE_KINDS` outdoor cat), `src/
  three-renderer.ts` (`_buildPrecipCloud`, `_rainTexture`,
  `_advanceWeather` — the reused particle idiom).
