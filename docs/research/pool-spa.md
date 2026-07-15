# Pool & Spa — Build-Ready Research

Status: research complete, not yet implemented. Target: a new spatial water-body
fixture (`Floor.pools`) — a sunken/raised basin with a bound heater, pump, light(s),
and chemistry sensors — plus a small cluster of **outdoor `appliance`-category
furniture kinds** for the equipment pad (pump, filter, heater, salt cell), reusing
the already-shipped appliance in-use LED / `localState` machinery instead of
inventing new fixture plumbing for the equipment boxes.

## 1. Summary

A residential pool or spa (hot tub) is a fixed water feature with its own dedicated
equipment: a **pump** that circulates water through a **filter**, a **heater**
(gas, electric-resistance, or heat-pump) that raises water temperature, a **salt
chlorine generator (SCG)** or chemical feeder that sanitizes it, and one or more
**underwater lights**. Home Assistant integrations for the major pool-controller
brands (Pentair ScreenLogic, Jandy iAquaLink, Hayward OmniLogic) expose this
equipment as a predictable mix of `climate`/`switch`/`light`/`sensor`/
`binary_sensor` entities per brand.

This fits Diorama because a pool is inherently spatial and already sits in the
"yard" vocabulary Diorama has been building out (`Floor.groundAreas` water kind,
outdoor `FurnitureKind`s like fountain/lawn chairs, the outdoor `cat` group). Unlike
a flat ground-area water patch (decorative, non-interactive), a real pool is an
**interactive multi-entity object** — is the heater on and warming the water right
now, is the pump circulating, are the lights on and what color, what's the water
temperature/pH/salt level — exactly the kind of live device state Diorama turns
into an at-a-glance spatial read everywhere else (lights glow, appliances pulse,
sensors show value chips). A pool also gives Diorama's yard a second "hero"
feature alongside the fountain/ground-water work already shipped, and slots
cleanly next to the existing outdoor furniture cluster and the equipment-pad
concept (a small footprint of boxes near the pool, exactly like how appliances
cluster in a kitchen).

## 2. Home Assistant data model

Three brand integrations dominate consumer pools; a fourth generation of
DIY/open controllers exists too. **None of this data is missing from the
WebSocket API** — every entity below is a standard HA domain (`climate`,
`switch`, `light`, `sensor`, `binary_sensor`, `water_heater`) and rides the normal
`state_changed` event / `get_states` snapshot exactly like every other Diorama
binding. The caveats below are about **which entities exist per brand** (heater
control is core-supported for two of the three, not the third) and **update
latency** for cloud-polling brands, not transport-level gaps.

### 2.1 Pentair ScreenLogic (core integration, `screenlogic`)

Source: [ScreenLogic integration docs](https://www.home-assistant.io/integrations/screenlogic/),
verified against the [HA core source](https://github.com/home-assistant/core/tree/dev/homeassistant/components/screenlogic)
(`climate.py`, `switch.py`, `sensor.py`, `binary_sensor.py`, `light.py`,
`const.py`, `services.yaml`).

- **IoT class**: Local Push (talks directly to the ScreenLogic gateway on the LAN;
  auto-discoverable). Introduced HA 2021.4.
- **`climate.*` — heater loops**: one climate entity **per body of water**
  (`gateway.get_data(DEVICE.BODY)` — a system with an attached spa typically gets
  **two** entities: pool heater loop, spa heater loop; translation key
  `body_{body_index}`). `hvac_modes`: `off`, `heat`. `preset_modes`: always
  `"heater"`, plus `"solar"`/`"solar_preferred"` when solar heating equipment is
  present. `current_temperature` ← `VALUE.LAST_TEMPERATURE`; target temperature ←
  `VALUE.HEAT_SETPOINT`; `min_temp`/`max_temp` ← `ATTR.MIN_SETPOINT`/
  `ATTR.MAX_SETPOINT`; unit follows the gateway's configured C/F setting.
  Controlled via the standard `climate.set_temperature` and `climate.set_hvac_mode`
  actions (developer docs:
  <https://developers.home-assistant.io/docs/core/entity/climate/>).
- **`switch.*` — circuits**: one switch per non-light circuit (pool pump/filter
  circuit, spa, cleaner, waterfall, spa blower, aux circuits, etc.) — anything
  whose circuit *function* is **not** in `LIGHT_CIRCUIT_FUNCTIONS`. Circuits with a
  generic name or an `INTERFACE.DONT_SHOW` flag are created but **disabled by
  default** (user can re-enable in the entity registry).
- **`light.*` — pool/spa lights**: created for circuits whose function IS in
  `LIGHT_CIRCUIT_FUNCTIONS` (`COLOR_WHEEL`, `DIMMER`, `INTELLIBRITE`, `LIGHT`,
  `MAGICSTREAM`, `PHOTONGEN`, `SAL_LIGHT`, `SAM_LIGHT`). HA-side these are
  **on/off only** (`_attr_supported_color_modes = {ColorMode.ONOFF}` — no
  brightness/RGB at the entity level); the actual color/show is driven by the
  separate `screenlogic.set_color_mode` **action** (below), not `light.turn_on`
  color params.
- **`sensor.*`** (from `sensor.py`): Air Temperature (`device_class: temperature`);
  Controller State (enum: ready/sync/service, diagnostic); pump **Watts Now**
  (`device_class: power`), **GPM Now** (disabled for `INTELLIFLO_VS` pump models),
  **RPM Now** (disabled for `INTELLIFLO_VF` models); IntelliChem block — **pH**,
  **ORP**, pH/ORP Setpoint, pH/ORP Supply Level, pH Probe Water Temp, Saturation
  Index, Calcium Hardness (disabled by default), Cyanuric Acid/CYA (disabled by
  default), Total Alkalinity (disabled by default), ORP/pH Dosing State (enum:
  dosing/mixing/monitoring), ORP/pH Last Dose Time (duration) + Volume; Salt
  Chlorine Generator (SCG) block — **Salt PPM**, Salt TDS PPM (disabled by
  default), Super Chlorinator Timer.
- **`binary_sensor.*`** (from `binary_sensor.py`): Active Alert
  (`device_class: problem`), Cleaner Delay, **Freeze Mode**, Pool Delay, Spa
  Delay, Pump State; IntelliChem alarms — Flow Alarm, ORP/pH High Alarm, ORP/pH
  Low Alarm, ORP/pH Supply Alarm, Probe Fault Alarm (all `device_class: problem`),
  ORP/pH Limit, pH Lockout, Corrosive, Scaling (`problem`); SCG State.
- **Actions** (`services.yaml`, confirmed verbatim from
  <https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/screenlogic/services.yaml>):
  - `screenlogic.set_color_mode` — fields `config_entry` (required) +
    `color_mode` (required, select). **Exact option list** (this is the real-world
    color-show vocabulary a pool-light visual should support):
    `all_off, all_on, american, blue, caribbean, color_set, color_swim,
    color_sync, green, hold, magenta, next_mode, party, recall, red, reset,
    romance, royal, save, sunset, thumper, white`.
  - `screenlogic.start_super_chlorination` — fields `config_entry` +
    `runtime` (number selector, default 24, min 0 / max 72, unit "hours").
  - `screenlogic.stop_super_chlorination` — field `config_entry` only.
  - Docs: <https://www.home-assistant.io/integrations/screenlogic/>.

### 2.2 Jandy iAquaLink (core integration, `iaqualink`)

Source: [iAquaLink integration docs](https://www.home-assistant.io/integrations/iaqualink/),
verified against [`climate.py`](https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/iaqualink/climate.py).

- **IoT class**: **Cloud Polling** — refreshes roughly every **15 seconds**. Only
  the iAquaLink 2.0 (iQ20) and eXO platforms are supported; only equipment the
  iAquaLink **cloud service** itself exposes becomes an HA entity (a feature not
  configured in the iAquaLink app never appears in HA, integration-side).
- **`climate.*` — heater**: created only when the system exposes a controllable
  heater (pool and/or spa). `hvac_modes`: `heat`, `off`. `current_temperature` ←
  `dev.current_temperature` (None if empty); target temperature ← `dev.state`;
  `min_temp`/`max_temp` ← `dev.min_temperature`/`dev.max_temperature`.
  `hvac_action` mapping: device state `ON` → `HVACAction.HEATING`, `ENABLED` →
  `HVACAction.IDLE` (enabled/armed but not actively firing), anything else →
  `HVACAction.OFF` — a genuinely useful three-state signal for a heater glow
  (off / standby-idle / actively-heating) beyond the flat on/off most other
  brands give.
- **`light.*` / `switch.*`**: pool/spa lights (some support brightness/effect
  selection depending on hardware); auxiliary equipment circuits (filter pumps,
  cleaners, waterfalls, blowers) as switches.
- **`sensor.*`**: pool/spa/air temperature readings and other controller-exposed
  numeric values.
- **`binary_sensor.*`**: freeze-protection status.
- No documented custom `iaqualink.*` actions beyond the standard domain actions
  (`climate.set_temperature`, `switch.turn_on/off`, `light.turn_on/off`) —
  everything is controlled through core domain actions, unlike ScreenLogic's
  bespoke color-mode/chlorination actions.

### 2.3 Hayward OmniLogic (core integration, `omnilogic`) — **no heater control**

Source: [OmniLogic integration docs](https://www.home-assistant.io/integrations/omnilogic/),
verified against [`sensor.py`](https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/omnilogic/sensor.py)
and [`switch.py`](https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/omnilogic/switch.py).

- **IoT class**: Cloud Polling. **Community-maintained** (not authored/supported
  by Hayward).
- **`sensor.*`**: Air Temperature, Water Temperature (both unit-converted);
  Filter Pump Speed (percent for variable-speed, or off/low/high for dual-speed);
  Auxiliary Pump Speed; Chlorinator Setting (percent chlorine output); Salt Level
  (PPM, or g/L when the HA instance is metric); pH (with a user-configurable
  offset); ORP (millivolts).
- **`switch.*`**: `OmniLogicRelayControl` (generic relays) and
  `OmniLogicPumpControl` (variable-speed pump control). **The docs state this
  explicitly: "The platform only supports sensors and switches at the current
  release."** There is **no climate/water_heater entity for the pool heater** in
  core OmniLogic, and inspecting `switch.py`'s `SWITCH_TYPES` confirms heater
  relays are not one of the modeled switch shapes either — **a stock HA + core
  OmniLogic install cannot read heater setpoint or toggle heat from HA at all.**
  HA's own docs note future light/water-heater support is *planned* but was not
  shipped as of this research.
- **HACS alternative — `djtimca/haomnilogic`**: adds **`light.*`** (ColorLogic
  lights V1/V2), **`water_heater.*`** (pool heater, using HA's
  [`water_heater` domain](https://developers.home-assistant.io/docs/core/entity/water-heater/) —
  operation modes rather than `climate`'s hvac modes), plus richer switches
  (chlorinator + superchlorination control). This is the realistic path for full
  OmniLogic heater control today; flag clearly as **custom/HACS, not core**.
- **`cryptk/haomnilogic-local`**: a second community integration talking the
  controller's **local UDP/XML** API instead of Hayward's cloud — lower latency,
  avoids the cloud dependency, worth noting as an alternative connectivity path
  in UI copy ("some Hayward integrations are local, some are cloud-polling").

### 2.4 Pentair IntelliCenter / IntelliConnect — HACS only, no core integration

Pentair's newer **IntelliCenter** (local) and **IntelliConnect** (cloud) panels
are **not** covered by the core `screenlogic` integration (ScreenLogic targets
the older IntelliTouch/EasyTouch protocol) and have no first-party HA support.
Multiple community projects exist and are not consolidated:
[`jlvaillant/intellicenter`](https://github.com/jlvaillant/intellicenter),
[`philipflesher/intellicenter`](https://github.com/philipflesher/intellicenter),
[`dwradcliffe/intellicenter`](https://github.com/dwradcliffe/intellicenter) (local,
creates a `switch.*` per "Featured" circuit + a `light.*` per light/light-show —
heater state reported as **`OFF`/`IDLE`(enabled, not firing)/`ON`**, echoing
iAquaLink's three-state heater signal), and
[`tikotzky/homeassistant-pentair-intelliconnect`](https://github.com/tikotzky/homeassistant-pentair-intelliconnect)
(cloud, exposes filter pump/heater/IntelliChlor salt cell/daily schedule). Treat
all of these as **custom, fragmented, and subject to change** — do not hard-code
service names against any specific one.

### 2.5 Generic / DIY (ESPHome, MQTT, Tasmota-controlled pool relays)

A meaningful fraction of real installs — especially anyone who wired their own
pump/heater relay via a smart plug or ESPHome relay board rather than buying a
name-brand pool automation controller — will simply have **plain `switch.*`**
entities (pump on/off, no telemetry) and maybe a couple of **`sensor.*`**
temperature probes (DS18B20 water-temp sensor is a common ESPHome DIY pattern).
Diorama's binding fields should accept **any** switch/climate/water_heater
entity, not assume a named integration — this is consistent with how Diorama
already treats fireplaces, TVs, and appliances (bind whatever domain fits).

### 2.6 WebSocket API coverage summary

Everything above (climate/switch/light/sensor/binary_sensor/water_heater state +
attributes, plus the ScreenLogic actions) rides the standard `state_changed`
event and `call_service`/action calls — the same transport Diorama already uses
for every other fixture. Nothing here requires REST, cloud-only polling outside
HA (HA itself does the cloud polling for iAquaLink/OmniLogic; Diorama only ever
talks to HA), or a new WS command. Two informational (not transport) caveats:

- **Cloud-polling latency**: iAquaLink refreshes ~15 s; OmniLogic's poll interval
  is configurable but typically tens of seconds to minutes. A pool's animated
  states (heater warmth, pump flow) should **ease into transitions** (matching
  the codebase's established τ-based blend idiom) rather than assume instant
  state flips — a pump `switch.on→off` might visually arrive 15–30 s after the
  physical equipment changed.
- **Heater control is brand-dependent, not a WS gap**: OmniLogic core simply
  doesn't have a heater entity to read; that's an integration completeness gap
  Diorama cannot work around by trying harder over the WebSocket. Design the
  pool fixture's heater binding to be **optional and domain-flexible**
  (`climate.*` OR `water_heater.*` OR unbound), never assume presence.

## 3. Real-world / visual reference

- **Pool size** (in-ground, rectangular — the most common shape modeled here):
  ranges roughly 10×20 ft to 20×40 ft; most common residential range is 14×28 ft
  to 16×32 ft (16×32 ft ≈ **4880 × 9750 mm**, ~20,000 US gal). Typical
  length:width ratio ≈ 2:1.
  Source: [CPSA pool size chart](https://thecpsa.org/blog/swimming-pool-size-chart/),
  [Angi swimming pool size chart](https://www.angi.com/articles/swimming-pool-size-chart.htm).
- **Pool depth**: shallow end 3–4 ft (**≈ 900–1200 mm**), deep end 5–6 ft
  (**≈ 1500–1800 mm**) for a standard recreational pool (deeper diving pools are
  a rarer v2 case). A simple v1 model can use a single flat basin depth (e.g.
  **1200 mm**) rather than a sloped floor.
- **Coping / deck**: a 450–600 mm border of concrete/paver/stone around the
  water's edge, usually a light neutral tone (buff, travertine, light grey) that
  contrasts with the water and surrounding grass — visually this is the "lip"
  separating the water polygon from the yard ground-area.
- **Water color**: classic pool-plaster blue is roughly **turquoise/aqua**,
  approx `#1CA3D9`–`#2AACC6` (lighter/greener for a "Caribbean blue" pebble
  finish, deeper navy for a dark "midnight" finish) — pick one saturated toon-
  friendly aqua as the default, exposed as an editable `waterColor` like other
  Diorama tint fields.
- **Underwater pool light niche**: a circular fixture recessed in the pool wall,
  typically ~**8–10 in (≈ 200–250 mm) diameter**, stainless-steel or white face
  plate, mounted roughly 18–24 in (**≈ 450–600 mm**) below the waterline.
  Modern LED color-changing niches (Pentair IntelliBrite, Hayward ColorLogic —
  matching the ScreenLogic `color_mode` vocabulary in §2.1) cycle through
  blue/green/red/magenta/white combinations.
- **Equipment pad** (pump/filter/heater cluster, always outside the pool,
  typically against the house or a side yard): sits on a **36×36 in to 5×10 ft**
  concrete/composite pad. Source:
  [Power Pads — pool equipment pad specifications](https://www.pwrpads.com/pool-equipment-pad-specifications/),
  [Lennox/Diversitech 36×48×3 in equipment pad](https://www.lennoxpros.com/the-black-plastic-equipment-pad-36-x-48-x-3-in/p/93N53).
  - **Pump**: horizontal motor + volute housing, roughly **400 mm diameter ×
    500 mm long**, almond/grey/blue plastic housing.
  - **Filter**: vertical tank — cartridge filter ≈ 600 mm diameter × 900–1200 mm
    tall (light blue/tan/grey plastic); sand/DE filters are similar cylindrical
    silhouettes.
  - **Heater**: gas heater ≈ 600×600×1200 mm metal box with a top flue/vent pipe
    (matte black/grey); heat-pump heater ≈ 900×900×1200 mm box with a top fan
    grille (common brands Pentair UltraTemp, Hayward HeatPro — dark grey/black
    cabinet, visible fan blade under the top grille).
  - **Salt chlorine generator (SCG) cell**: small inline canister on the return
    plumbing, ≈ 300 mm long × 100 mm diameter, usually white/grey PVC with a
    control box (small wall-mounted panel, ~250×200×80 mm) nearby.
- **Spa / hot tub**: attached in-ground spas are commonly **round or a rounded
  rectangle**, roughly **1800–2400 mm diameter/side**, often **raised** 300–450 mm
  above the pool deck with a **spillover edge** (water cascades from spa into
  pool — a nice-to-have animation, §6). Free-standing above-ground round hot
  tubs run **72–96 in diameter (≈ 1830–2440 mm)**.
  Source: [Caldera Spas — typical hot tub dimensions](https://www.calderaspas.com/hot-tub-tips/what-are-typical-hot-tub-dimensions),
  [Master Spas — hot tub/spa dimensions guide](https://www.masterspas.com/blog/how-big-is-a-hot-tub-spa-dimensions/).
  Spa water often shows visible **bubble turbulence** (air blower/jets) and, in
  cool weather, **rising steam** — both good animation hooks distinct from the
  calmer main pool.

## 4. Diorama visualization & animation design

### 4.1 Data shape — new `Floor.pools: Pool[]`

Model the pool/spa as a first-class polygon fixture, drawn like a ground area /
presence zone (parallel-latch idiom: `drawingPoolArea`, mirroring
`drawingGroundArea`/`drawingPresenceZone` — the codebase convention is a
parallel field per shape-drawing fixture, not a shared-kind refactor) but with
its own richer builder because it needs a **sunken/raised basin geometry**, not
a flat ground-plane patch.

```ts
interface Pool {
  id: string;
  name?: string;
  kind: 'pool' | 'spa';               // spa = smaller, often raised, bubble/steam FX
  poly: { x: number; y: number }[];   // 3–12 vertices, world mm (rect-drag helper for the common case)
  depthMm?: number;                   // default 1200 (pool) / 900 (spa)
  raisedMm?: number;                  // spa: height above grade if raised (default 0 = in-ground)
  waterColor?: string;                // default toon aqua, e.g. '#1ca3c6'
  heaterEntity?: string;              // climate.* OR water_heater.*
  pumpEntity?: string;                // switch.*
  lightEntities?: string[];           // light.* (0..n underwater lights)
  waterTempEntity?: string;           // sensor.*
  phEntity?: string;                  // sensor.*
  orpEntity?: string;                 // sensor.*
  saltEntity?: string;                // sensor.*
  colorModeEntity?: string;           // optional: which entity screenlogic.set_color_mode targets (a light or the gateway's config_entry — display-only, action-fire is a stretch goal)
  locked?: boolean;
  hidden?: boolean;
}
```

`Floor.pools` backfilled `[]` in `repairFloor` + `defaultFloor`, no top-level
`Store` field needed (per-floor, like `bleProxies`/`robots`/`safetySensors`).

### 4.2 2D representation

- **Idle**: filled polygon in `waterColor` (a touch more saturated/darker stroke
  for the coping-line edge), drawn in the **same low-priority-hit-test slot as
  ground areas** (paint shapes never swallow fixture clicks — click-through when
  the layer is hidden, matching the documented ground-area/presence-zone
  caveat). A thin lighter-blue "coping" ring drawn just inside the polygon edge
  reads as the pool's rim without needing a second shape.
- **Heater ON**: a soft warm-amber glow wash blended over the water fill near
  the equipment-pad side (cheap: alpha-pulsed overlay, same idiom as the
  existing appliance in-use glow / activity pools) — reads as "this pool is
  being heated" without literal temperature-gradient rendering.
  `effectiveState(pool.heaterEntity)` resolves through the **existing
  `climate` HVAC-controls research** conventions if that feature ships first
  (see `docs/research/climate-hvac-controls.md`), else a simple `hvac_action ===
  'heating'` / state `!== 'off'` check.
- **Pump ON**: a subtle animated ripple/flow texture (thin moving sine-wave
  highlight lines) over the water fill — reuse the RAF-driven `performance.now()`
  animation idiom already used for safety-alarm pulse rings / doorbell rings,
  just modulating a texture offset instead of a radius.
- **Spa jets/bubbles ON** (kind `'spa'`, gated on `pumpEntity` or a dedicated
  jets switch if bound): small white speckle dots animated with per-frame
  jitter over a sub-region of the polygon.
- **Water-quality chip**: when the pool is selected (or always, small/dim
  otherwise — match the alarm-panel / oven-chip convention), show a compact
  chip near the polygon: `78°F · pH 7.4 · 720 ORP · 3200 ppm` from whichever of
  `waterTempEntity`/`phEntity`/`orpEntity`/`saltEntity` are bound — same visual
  language as the existing oven-temp chip / env-sensor value chip, just
  attached to the pool polygon instead of a point fixture.
- **Layer**: new dedicated gate is unnecessary — ride the **`ground`** layer
  (pools are conceptually the "wet" sibling of ground-area paint) OR give pools
  their own `pools` layer key if the sidebar wants an independent show/hide —
  recommend **reusing `ground`** to avoid a proliferation of yard-related layer
  toggles (matches how BLE proxies deliberately reuse `sensors` instead of
  owning a layer).

### 4.3 3D representation

- **Basin geometry**: build like a `closedWallLoops` floor patch, but recessed.
  A `ShapeGeometry` water surface at `y = -depthMm` (in-ground) or
  `y = raisedMm` less an offset (raised spa), PLUS a **skirt** — an extruded
  inward-offset ring from grade (`y = 0`) down to the water surface, tiled/toon
  material (light blue/white "pool tile" `_mat` color) forming the visible pool
  walls. This is the same conceptual move already used for **stairwell floor
  holes** (a recess cut into the floor plane) — reuse that precedent rather
  than inventing a new "hole in the ground" technique. A raised spa is the
  mirror case: a low box extruded UP from grade with the water surface near its
  top, plus an optional thin **spillover** lip on the pool-facing side (visual
  only for v1; animated cascade is a stretch goal, §6).
- **Coping**: a flat light-toned ring/frame at `y ≈ 0..40mm` around the basin
  rim (simple extruded loop, distinct `_mat` color from both water and yard
  grass).
- **Water surface animation**: reuse the **exact vertex-displacement technique
  already shipped for the breathing bed-cover blanket** (`_animateBedCover` —
  a plane whose vertices get a per-frame sine-wave Y offset) applied to the
  pool's water `ShapeGeometry`: a gentle multi-frequency ripple, amplitude
  small (~15–30 mm) so it reads as "living water" without looking like waves.
  Pump ON increases ripple amplitude/frequency slightly; pump OFF settles to
  near-still. This needs **zero new animation infrastructure** — same
  technique, new mesh.
- **Heater glow**: a soft warm emissive tint blended into the water material's
  emissive channel when the heater is actively heating (three-state where
  available — iAquaLink/IntelliCenter's `IDLE` "armed but not firing" state
  should render a **dim** standby glow, `HEATING`/`ON` a fuller warm glow, `OFF`
  none) — cheap, no new geometry.
- **Pump/filter/heater equipment**: see §4.4 below — these are **furniture**,
  not part of the `Pool` object itself, so they render entirely through the
  existing furniture pipeline.
- **Underwater lights**: a small emissive disc inset in the basin skirt at
  `y ≈ -450mm` (or scaled to `depthMm`) per bound `lightEntities[i]`; ON state
  drives emissive intensity + color. Since ScreenLogic pool lights are
  **on/off-only entities** (color driven by the separate `set_color_mode`
  action, not entity color attributes), Diorama can't read "what color is it
  right now" from the light entity alone on that brand — render a **fixed
  bright toon-blue/white glow** when on regardless of brand, and (optional,
  brand-aware stretch goal) let the user manually pick a decorative color in
  the sidebar since HA can't report it. Brands whose `light.*` entities DO
  support real color (iAquaLink hardware that supports it) should read
  `attributes.rgb_color`/`effect` normally through the same `effectiveState`
  path lights already use elsewhere in Diorama.
- **Spa bubbles/steam** (kind `'spa'`, pump/jets ON): reuse the **exact
  particle-cloud machinery already built for 3D weather** (`_buildPrecipCloud`/
  `_advanceWeather` idiom) — a small `THREE.Points` cloud of white bubble
  sprites rising from the spa floor and popping at the surface (recycle on
  reaching `y = 0`), and optionally a thin steam/fog wisp (reuse the existing
  `FogExp2`-adjacent translucent-plane technique from weather fog) rising above
  the spa surface when `waterTempEntity` is high relative to `weatherNow`/
  ambient air temp (nice touch, not required for v1 — a fixed subtle wisp when
  the heater is on is a fine v1 shortcut).
- **Materials**: everything routes through `_mat()` (`MeshToonMaterial`) except
  the bubble/steam particle sprites, which are a **documented `_mat`-exemption**
  exactly like weather precipitation (flat billboard `PointsMaterial`/
  `SpriteMaterial`, not a lit surface).
- **Dirty key**: `_keyPool` (or fold per-pool state into `_keyFloor` if cheap —
  recommend a **dedicated group** `_poolGroup` OUTSIDE `_floorGroup`, like
  `_nowPlayingGroup`/weather, so a heater/pump state flip doesn't force a full
  floor/nav rebuild) = `configRev` + each pool's bound-entity state hash
  (`heaterState:pumpState:lightsOnBitmask:waterTemp-bucketed`). Per-frame
  ripple/bubble motion is **not** dirty-keyed — persistent mutation each frame
  from `_animate`, matching the weather/bed-cover idiom (skip the per-frame
  call entirely when no pool exists on the floor, matching weather's "zero
  work when nothing's happening" rule).
- **Nav grid**: the pool basin footprint should **block the avatar nav grid**
  like furniture (`_buildNav`) — humanoids must not walk across a pool. Add the
  pool polygon (inflated by 0, since its rim IS the boundary) to the same solid
  blocker set fed into `_buildNav`, the same way wall runs and inflated
  furniture footprints already do.
- **Group lifecycle**: declare `_poolGroup`; `scene.add`; builder
  `updatePools(pools, stateProvider)`; `clearTransientGroups` (rebuild ripple
  buffers on floor switch, matching weather's spawn-box refit); `destroy`
  (dispose shared bubble/steam textures, water `_mat` cache entries); fold into
  `setLayerVisibility` under the `ground` layer gate.

### 4.4 Equipment pad — reuse the `appliance` furniture pattern, don't invent new plumbing

Model pump/filter/heater/SCG as new **outdoor-cat `FurnitureKind`s** with
`cat: 'appliance'` (or a close variant) rather than fields on `Pool` itself —
this means they get the **already-shipped generic appliance in-use LED glow +
`localState`/`effectiveState`/`toggleItem` binding** for free, with zero new
interaction plumbing:

- `pool_pump` — cylinder-on-base composite (motor housing), `activity`
  unnecessary (no avatar interaction), bound to a `switch.*`; in-use → existing
  pulsing green LED + soft glow (2D + 3D) already generic to `cat: 'appliance'`.
  A nice-to-have: spin a small impeller/fan mesh while on — same idiom as any
  other rotating-part furniture, entirely optional.
- `pool_filter` — vertical cylinder tank, static (no bound entity needed
  typically — filters don't have their own switch, they just move water
  whenever the pump runs; can optionally bind the same pump entity for a
  shared in-use glow, or render as always-present static equipment).
- `pool_heater` (kind variants `pool_heater_gas` / `pool_heatpump` if visual
  distinction is wanted, or a single kind with a style dropdown) — box +
  flue-pipe (gas) or box + fan grille (heat pump), bound to the pool's
  `heaterEntity` (or its own, if the user wants the equipment box and the
  pool's water-glow bound to the same entity — recommend defaulting the
  furniture piece's entity picker to the pool's `heaterEntity` when dropped
  near a bound pool, but keep it independently editable).
- `pool_chlorinator` — small inline-canister + control-box composite, bound to
  a `switch.*` (chlorinator enable) if the brand exposes one (ScreenLogic SCG
  state is currently sensor/binary_sensor only, not a direct control switch in
  core — treat as **display-only** state via the pool's `saltEntity`/an SCG
  `sensor.*`, not necessarily a toggleable furniture piece, unless a specific
  brand exposes a controllable entity).

This reuses 100% of the existing furniture recipe (`FURNITURE_KINDS` entry,
`canvas-render.ts` `drawFurniturePrimitive` case, `three-renderer.ts`
`_buildFurniture` case) — **no new fixture-recipe steps needed for the
equipment pad**, only new furniture kinds.

### 4.5 Unbound / `localState` behavior

A `Pool` with no bound entities is still fully drawable (water polygon, basin,
static equipment furniture) and can carry `localState`-style per-field toggles
for demo purposes: reuse the existing convention — e.g. no `heaterEntity` +
some `heaterLocalState?: 'on'|'off'` item-level field, toggled via
`Planner.toggleItem`-equivalent logic scoped per sub-field (a `Pool` has
**several** independently toggleable things, unlike a single-entity fixture —
recommend a small `localState?: { heater?: string; pump?: string }` map on
`Pool` rather than flat fields, since it has more than one controllable
sub-thing, unlike every prior single-`localState` fixture). Clicking the water
polygon vs. clicking a specific piece of equipment furniture routes to the
matching sub-toggle (equipment furniture pieces use their own standard
`localState`, unaffected).

### 4.6 `_isSlowEntity` routing

- `heaterEntity` (climate/water_heater) and `pumpEntity` (switch): **config-path**
  — same treatment as alarm panels/safety sensors/door locks/camera ids — human
  cares about seeing an accurate glow within a render tick of a real state
  change, not 10 Hz churn.
- `waterTempEntity`/`phEntity`/`orpEntity`/`saltEntity` (plain `sensor.*`):
  **config-path**, exactly like `EnvSensor`'s bound ids and the oven
  `tempEntity` precedent — so the water-quality chip re-renders promptly.
- `lightEntities[]`: config-path like every other bound light id already is
  (lights already flow through the slow/live split via `number.*`/`switch.*`
  domain rules plus the light-specific glow-refresh path — a `light.*` id
  itself is already handled generically wherever Diorama binds lights).

## 5. Integration steps

1. **types.ts**: add `Pool` interface (kind, poly, depth/raised mm, water color,
   heater/pump/light/sensor entity ids, localState map, locked/hidden) +
   `Floor.pools?: Pool[]`. Add new outdoor `FurnitureKind`s: `pool_pump`,
   `pool_filter`, `pool_heater` (+ optional gas/heatpump style field),
   `pool_chlorinator`.
2. **geometry.ts**: `FURNITURE_KINDS` entries for the new equipment kinds
   (default w/h/depth from §3, `cat: 'appliance'`, outdoor placement, no `seat`);
   default `depthMm`/`waterColor` constants for `Pool`; a `poolWaterColor`/
   `poolGlowColor` helper mirroring existing color helpers if per-pool tinting
   is desired.
3. **`repairFloor` + `defaultFloor`**: backfill `pools: []`. No new `Store`
   top-level field (per-floor, like `robots`/`safetySensors`).
4. **canvas-render.ts**: `drawPools` (idle fill + coping ring + heater/pump
   glow overlays + water-quality chip), gated in `drawAll` under the `ground`
   layer; extend `drawFurniturePrimitive`'s switch for the new equipment kinds
   (reuses the existing generic appliance in-use glow automatically once
   `cat: 'appliance'` is set — verify the appliance-glow code path is truly
   kind-agnostic, only gated on `cat`).
5. **canvas-hit.ts**: `hitPool` (polygon point-in-polygon test, low-priority —
   after all other item hits, matching ground-area/presence-zone precedent).
6. **canvas-interact.ts**: pool-polygon draw latch (`drawingPoolArea`, click
   verts / dblclick-or-Enter finish / ESC cancel — mirrors
   `drawingPresenceZone`/`drawingGroundArea`), vertex-drag case for editing,
   place-tool entry (`pool` tool, 🏊/🌊 glyph), delete-tool branch, cursor.
7. **sidebar.ts**: new `_section('pools', 'Pool & Spa', …)` — per-pool kind
   toggle (pool/spa), water color picker, depth/raised height inputs, entity
   pickers for heater (`climate`+`water_heater` domains — extend the entity
   picker's domain param to accept an array, following the doorbell-picker
   precedent that already accepts `string | string[]`)/pump/lights (multi-bind
   list)/water-temp/pH/ORP/salt sensors, lock row, local-state badges per
   sub-field; add `TOOLS` entry + tool hint. Furniture sidebar section already
   handles the new equipment `FurnitureKind`s automatically (dropdown
   enumerates `Object.keys(FURNITURE_KINDS)`).
8. **three-renderer.ts**: declare `_poolGroup`; `scene.add`; basin/skirt/coping
   builder (`updatePools`, keyed off `_keyPool`) using the stairwell-floor-hole
   recess technique; water-surface ripple mesh (reusing the bed-cover
   vertex-displacement animator, generalized to accept a shape + amplitude
   param) advanced every frame from `_animate`; underwater light discs; spa
   bubble/steam `THREE.Points` cloud reusing the weather particle-cloud
   builder pattern; shared textures built once, disposed only in `destroy`;
   `clearTransientGroups` handling; fold into `setLayerVisibility` (`ground`
   layer); feed the pool polygon into `_buildNav`'s solid-blocker set so
   avatars path around it. Extend `_buildFurniture`'s switch for the new
   equipment kinds (simple box/cylinder composites per §3).
9. **three-view.ts**: compute `_keyPool` (configRev + per-pool bound-entity
   state hash); call `updatePools` only when it changes; call the ripple/
   bubble per-frame advancer unconditionally each tick (cheap early-return
   when no pools exist on the floor).
10. **`Planner._isSlowEntity`**: add bound pool heater/pump/sensor/light ids
    (current floor scope) to the config-path id set.
11. **`Planner.toggleItem`/`effectiveState`**: extend (or add sibling
    pool-specific resolvers `poolHeaterState(pool)`/`poolPumpState(pool)`) to
    handle the `localState` sub-map shape described in §4.5, since `Pool` has
    multiple independently-bindable sub-things unlike prior single-entity
    fixtures.
12. **Docs**: mention the new fixture in `docs/STATUS.md`'s feature log per
    repo convention, only once actually shipped.

## 6. Potential additional features

- **Spillover spa → pool cascade animation**: for a raised spa adjacent to a
  pool, an animated water-sheet/particle cascade over the shared edge when the
  spa's spillover valve/pump is active — visually distinctive and grounded in
  real spa design (§3), but needs its own small particle system; treat as v2.
- **Pool cover**: many pools have a retractable safety/solar cover; a bound
  `cover.*` entity (position 0–100, reusing the exact `doorOpenFraction`
  resolver already used for garage doors/blinds) could animate a cover sheet
  sliding across the water surface — natural fit for the already-shipped cover
  openness resolver.
- **Chlorination cycle indicator**: ScreenLogic's `start_super_chlorination`/
  `stop_super_chlorination` actions plus the SCG State binary_sensor could
  drive a distinct "shocking" visual (extra-bright/foamy water tint) — a good
  candidate for a manual sidebar button that fires the action (the first
  vendor-specific parameterized action button in Diorama if
  irrigation's proposed one didn't ship first — see
  `docs/research/irrigation-sprinklers.md` §6 for the general pattern and its
  cross-vendor caveats).
- **Water-quality alert glow**: pH/ORP alarm `binary_sensor.*`s (ScreenLogic
  has a full set — Flow/ORP High/Low/Supply/Probe Fault/Corrosive/Scaling)
  could drive a warning-color pulse on the pool polygon, echoing the existing
  safety-sensor alarm-pulse visual language.
- **Freeze-protection indicator**: ScreenLogic's Freeze Mode binary_sensor
  (equipment auto-runs to prevent pipe freeze) — a small frost-tinted overlay
  on the pool + equipment pad when active, reusing the existing frost/rim
  visual asset built for weather (`apparentC ≤ −3` frost icicles) if one
  exists on the floor already, or a simple new frost tint.
- **Pool light color-show picker**: for brands that expose real light color
  (not ScreenLogic's on/off + separate action), a proper color picker in the
  sidebar routed through the standard light-config modal — no new
  infrastructure, just binding the existing `<diorama-light-config>` modal to
  pool light entities the same way any other `light.*` gets it.
- **Multi-body support**: some installs have pool + spa + a third body (wading
  pool); the `Pool[]` array already supports N pools per floor, so this is
  "free" as long as the UI doesn't assume exactly one.

## 7. Open questions & risks

- **Heater control is not uniformly available.** Core OmniLogic cannot control
  or even read heater setpoint (§2.3) — only sensor/switch. If the target user
  has stock OmniLogic (no HACS), the heater UI must gracefully degrade to "no
  heater binding available" rather than assuming every pool has a `climate.*`.
  Decide whether Diorama's docs steer OmniLogic users toward the
  `djtimca/haomnilogic` HACS fork for full functionality, or just document the
  limitation.
- **Pool light color is often not readable from HA.** ScreenLogic's `light.*`
  entities are on/off only; the actual color comes from a fire-and-forget
  `screenlogic.set_color_mode` action with no corresponding "current color"
  state to read back (the action doesn't even target a specific light, it sets
  "the color mode for all color-capable lights on a ScreenLogic gateway" per
  the service description) — Diorama **cannot** reliably show "the pool light
  is currently magenta" for this brand. Recommend a fixed bright glow on/off
  visual for ScreenLogic-bound lights, with an optional user-set decorative
  color override (cosmetic only, doesn't reflect real state) rather than
  pretending to read true color.
- **Vendor fragmentation is severe** — three real core integrations
  (ScreenLogic/iAquaLink/OmniLogic) each with a different entity mix, plus at
  least four more community IntelliCenter/IntelliConnect projects, plus DIY
  ESPHome/MQTT setups. The `Pool` binding fields need to stay domain-flexible
  (accept `climate.*` OR `water_heater.*` for heater; accept any `switch.*` for
  pump) rather than integration-aware. Do not build brand-specific logic
  beyond the ScreenLogic color-mode action (§6, optional/stretch).
- **No standard "pool vs spa body" signal across brands** — ScreenLogic's
  `body_{index}` climate entities are the cleanest per-body signal (index 0/1
  typically = pool/spa); iAquaLink and OmniLogic don't obviously expose which
  climate/sensor belongs to which body in a machine-readable way beyond entity
  friendly names. Binding is likely manual (user picks which entity is
  "pool heater" vs "spa heater" in the sidebar) rather than auto-discovered —
  acceptable, matches how Diorama already hand-binds most fixtures.
- **Sunken-basin 3D geometry is new** (Diorama has flat ground-area patches
  and flat-floor stairwell holes, but not yet a "hole with sloped/skirted
  sides plus a floating animated water plane inside it"). The stairwell-hole
  precedent should be checked directly in `three-renderer.ts` before
  implementation to confirm it generalizes cleanly to an arbitrary polygon
  (stairwells may be a fixed rectangular assumption) — flag as an
  implementation-time verification, not just a copy-paste.
- **Performance**: water ripple vertex displacement runs every frame per pool;
  spa bubble/steam particle clouds add per-floor particle budget on top of any
  active weather effects. Recommend the same DPR-based density cap already
  used for weather precipitation, and keep ripple vertex counts modest
  (a coarse grid, not a dense mesh) since the toon aesthetic doesn't need fine
  wave detail.
- **Chemistry sensor thresholds** (safe pH 7.2–7.8, ORP 650–750 mV target,
  salt 2700–3400 ppm for most SCG systems) were not independently re-verified
  against a primary source in this pass (they're widely repeated pool-industry
  norms, not HA-specific) — if a "chemistry out of range" warning color is
  built, re-confirm target bands against a pool-industry reference before
  hard-coding thresholds, the same way `ENV_KINDS` thresholds were sourced for
  CO2/CO/PM.

## 8. Sources

- [Pentair ScreenLogic — Home Assistant integration docs](https://www.home-assistant.io/integrations/screenlogic/)
- [ScreenLogic `services.yaml` — home-assistant/core](https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/screenlogic/services.yaml)
- [ScreenLogic `climate.py` — home-assistant/core](https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/screenlogic/climate.py)
- [ScreenLogic `const.py` — home-assistant/core](https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/screenlogic/const.py)
- [ScreenLogic `sensor.py` — home-assistant/core](https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/screenlogic/sensor.py)
- [ScreenLogic `switch.py` — home-assistant/core](https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/screenlogic/switch.py)
- [ScreenLogic `binary_sensor.py` — home-assistant/core](https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/screenlogic/binary_sensor.py)
- [ScreenLogic `light.py` — home-assistant/core](https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/screenlogic/light.py)
- [Jandy iAquaLink — Home Assistant integration docs](https://www.home-assistant.io/integrations/iaqualink/)
- [iAquaLink `climate.py` — home-assistant/core](https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/iaqualink/climate.py)
- [Hayward Omnilogic — Home Assistant integration docs](https://www.home-assistant.io/integrations/omnilogic/)
- [OmniLogic `sensor.py` — home-assistant/core](https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/omnilogic/sensor.py)
- [OmniLogic `switch.py` — home-assistant/core](https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/omnilogic/switch.py)
- [djtimca/haomnilogic — HACS Hayward Omnilogic integration (water_heater + lights)](https://github.com/djtimca/haomnilogic)
- [cryptk/haomnilogic-local — local UDP/XML Hayward integration](https://github.com/cryptk/haomnilogic-local)
- [jlvaillant/intellicenter — HACS Pentair IntelliCenter integration](https://github.com/jlvaillant/intellicenter)
- [philipflesher/intellicenter — HACS Pentair IntelliCenter integration](https://github.com/philipflesher/intellicenter)
- [tikotzky/homeassistant-pentair-intelliconnect — cloud IntelliConnect integration](https://github.com/tikotzky/homeassistant-pentair-intelliconnect)
- [Climate entity — Home Assistant Developer Docs](https://developers.home-assistant.io/docs/core/entity/climate/)
- [Water heater entity — Home Assistant Developer Docs](https://developers.home-assistant.io/docs/core/entity/water-heater/)
- [Water heater — Home Assistant integration docs](https://www.home-assistant.io/integrations/water_heater/)
- [CPSA — Pool Size Chart for Every Standard Swimming Pool Dimension](https://thecpsa.org/blog/swimming-pool-size-chart/)
- [Angi — Swimming Pool Size Chart](https://www.angi.com/articles/swimming-pool-size-chart.htm)
- [Power Pads — Pool Equipment Pad Specifications](https://www.pwrpads.com/pool-equipment-pad-specifications/)
- [LennoxPros — 36×48×3 in Diversitech pool equipment pad](https://www.lennoxpros.com/the-black-plastic-equipment-pad-36-x-48-x-3-in/p/93N53)
- [Caldera Spas — What Are Typical Hot Tub Dimensions](https://www.calderaspas.com/hot-tub-tips/what-are-typical-hot-tub-dimensions)
- [Master Spas — How Big Is a Hot Tub? Spa Dimensions Guide](https://www.masterspas.com/blog/how-big-is-a-hot-tub-spa-dimensions/)
