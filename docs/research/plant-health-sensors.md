# Plant health sensors & thirsty-plant droop/recovery animation

## 1. Summary

Real houseplant/garden sensors (Xiaomi Mi Flora / HHCC, FYTA Beam, ESPHome/BTHome
soil probes) report soil moisture, conductivity (fertility), light, temperature
and battery as ordinary HA `sensor.*`/`binary_sensor.*` entities on a device.
Diorama already has an indoor `plant` furniture kind (pot + 3 leaf-clump
spheres, `activity: 'tend_plant'`) and outdoor kinds (`flower_bed`, `bush`,
`tree`, `pine_tree`) but nothing binds a sensor to them or reacts to the
reading. This feature adds an optional per-fixture moisture binding
(`Furniture.moistureEntity`) and a **droop/wilt animation** — leaves sag,
desaturate toward yellow-brown, and a moisture % chip goes amber/red — when
soil moisture drops below a threshold, easing back to a healthy upright pose
as the reading recovers (or after a bound/simulated "watering" event).

This fits Diorama's core pitch precisely: it turns an invisible, easy-to-forget
number (a battery-powered probe's soil-moisture %, buried in Developer Tools)
into an **ambient, spatial, glanceable state** on the actual plant in the room
— exactly what Diorama already does for appliance-in-use LEDs, fridge doors,
and safety-sensor alarms. It also reuses almost the entire existing pipeline
(generic sensor binding, per-fixture display-only bindings, the config/live
routing split, the battery-badge sibling lookup) rather than inventing new
subsystems, and it gives the `tend_plant` activity (already anchored, already
animated) a visible payoff: an avatar interacting with the plant is now tied
to a real state change instead of pure decoration.

## 2. Home Assistant data model

### 2.1 The legacy `plant.*` domain — orphaned, do not target it

Home Assistant ships a core **"Plant Monitor"** integration (domain `plant`,
introduced HA 0.44) that aggregates existing sensor entities into one
`plant.*` entity. It is **YAML-only** (no config-flow / UI setup) and exposes
no services/actions:

```yaml
plant:
  living_room_plant:
    sensors:
      moisture: sensor.miflora_moisture
      battery: sensor.miflora_battery
      temperature: sensor.miflora_temperature
      conductivity: sensor.miflora_conductivity
      brightness: sensor.miflora_brightness
    min_moisture: 20
    max_moisture: 60
    min_battery: 20
    min_conductivity: 500
    max_conductivity: 3000
    check_days: 3          # default; days of history considered for brightness
```
Doc: https://www.home-assistant.io/integrations/plant/

- State: `ok` | `problem` | `unavailable`. `problem` when any bound
  measurement falls outside its configured `min_*`/`max_*` window; a
  known-buggy area (color regression since HA 2022.12; unavailable-attribute
  handling debated) per the frontend/core issue trackers.
- Attributes exposed on the `plant.*` entity: `moisture`, `battery`,
  `temperature`, `conductivity`, `brightness`, `problem`, `sensors` (the
  entity-id map), `dict_of_units_of_measurement`, `max_brightness_history`.
- No services. The community fork (`Olen/homeassistant-plant`, HACS) adds a
  `replace_sensor` service and OpenPlantbook species lookups, but it is a
  **different, incompatible entity model** from the built-in one — not
  something Diorama should assume is present.
- **Diorama recommendation: ignore `plant.*` entirely.** It's an aggregation
  convenience for HA's own "Plant status" Lovelace card, not a richer data
  source — every field it exposes already exists as a plain `sensor.*` on the
  underlying device, and Diorama's existing generic-sensor-binding idiom
  (`tempEntity`, `powerEntity`, `EnvSensor`) is already the right shape to
  read those directly. Binding straight to the moisture `sensor.*` also means
  the feature works for anyone who never set up the `plant:` YAML block at
  all (most Mi Flora / FYTA users won't have).

### 2.2 The real sensor entities (what Diorama should actually bind to)

All of these are plain `sensor.*` (and a few `binary_sensor.*`) entities,
readable exactly like any entity Diorama already binds — full `state` +
`attributes` (including `device_class`, `unit_of_measurement`) arrive over the
same `state_changed` WebSocket event Planner already subscribes to. **No new
WS call is needed for reading them.**

**Core `SensorDeviceClass` values relevant here** (from HA core
`homeassistant/components/sensor/const.py`, `SensorDeviceClass` enum —
https://github.com/home-assistant/core/blob/dev/homeassistant/components/sensor/const.py
and https://developers.home-assistant.io/docs/core/entity/sensor/):

| device_class | unit | meaning |
|---|---|---|
| `moisture` | `%` | soil (or other) moisture — **this is the one to threshold on** |
| `humidity` | `%` | *relative air humidity* — NOT soil moisture, but some integrations mislabel soil moisture as `humidity` (see open issue home-assistant/core#126000, "soil moisture sensor is classified as humidity device") |
| `conductivity` | `S/cm` / `mS/cm` / `µS/cm` | soil electrical conductivity → fertility/salinity proxy |
| `illuminance` | `lx` | light level reaching the plant |
| `temperature` | `°C`/`°F`/`K` | ambient/soil temperature |
| `battery` | `%` | sensor's own battery |
| `ph` | unitless | soil pH (rare; FYTA doesn't expose it, some DIY probes do) |

Diorama's `envKindOf()` (`src/geometry.ts`) already maps `device_class:
"moisture"` **and** `"humidity"` both to its `humidity` `EnvKind` bucket
(💧, blue) — i.e. the existing generic Env-sensor fixture already renders a
soil-moisture sensor reasonably if a user drops one as a plain Env sensor
today. There is **no** `EnvKind` for `conductivity` yet (falls through to
`generic` ◈) — worth adding (see §6).

#### a) Xiaomi Mi Flora / HHCC (core, via `xiaomi_ble`)

- Integration: **`xiaomi_ble`** (core, built-in, Bluetooth passive-listener
  based — needs the Bluetooth integration enabled on the HA host or an
  ESPHome Bluetooth proxy in range).
  Doc: https://www.home-assistant.io/integrations/xiaomi_ble/
  ESPHome-side component (if flashing/relaying via ESPHome instead):
  https://esphome.io/components/sensor/xiaomi_ble/
- Devices: `HHCCJCY01` (original Flower Care / "Mi Flora"), `HHCCJCY10`
  (Tuya-rebadged), `GVFDS` (Grow Care Garden).
- Entities created per device (auto-discovered once a BLE advertisement is
  seen — no manual entity config): `sensor.<name>_moisture` (device_class
  `moisture`, %), `sensor.<name>_conductivity` (device_class `conductivity`,
  µS/cm), `sensor.<name>_illuminance` (lx), `sensor.<name>_temperature` (°C),
  `sensor.<name>_battery` (%).
- Passive broadcast covers moisture/conductivity/illuminance/temperature;
  **battery requires an active BLE connection**, which `xiaomi_ble` only
  makes **once a day** to limit drain — expect the battery reading to be
  much staler than the others.
- Fully local, no cloud, no services/actions exposed by the integration.

#### b) FYTA Beam / Mini (custom, HACS `fyta`)

- Integration: **`fyta`** (documented on home-assistant.io but is a
  cloud-polling integration tied to the vendor's app account — flag as
  effectively "custom-ish" for a self-hosted user even though it's listed in
  core docs; requires a FYTA account + hub).
  Doc: https://www.home-assistant.io/integrations/fyta/
- IoT class: **Cloud Polling**, refreshed every 4 minutes via the FYTA API —
  i.e. inherently laggier than a local BLE sensor; not useful for anything
  needing sub-minute reactivity (droop/recovery is fine at this cadence).
- Sensors per plant: scientific name, plant/temperature/light/moisture/
  nutrients/salinity **status** (6-tier: `too_low`/`low`/`perfect`/`high`/
  `too_high`/`no_data` — a pre-computed health verdict Diorama could read
  directly instead of reimplementing threshold logic, see §6), plus raw
  `temperature` (°C), `light` (µmol, PAR-based — NOT lux, don't compare
  directly to Mi Flora's lx reading), `moisture` (%), `salinity` (mS/cm —
  FYTA's name for conductivity), fertilization dates, battery %.
- Binary sensors: low battery, light/nutrition/temperature/water
  notification flags, "productive plant" status, repotted indicator, sensor
  firmware-update-available.
- Image entities: a generic plant image + user-uploaded photo (not relevant
  to a 3D scene, but could seed a future "photo card" like the camera-alert
  snapshot popup).
- No services/actions.

#### c) DIY ESPHome / BTHome soil probes

- Pattern: an ESP32/ESP8266 reads a capacitive soil-moisture probe on an ADC
  pin (dry ≈ 2.8 V, saturated ≈ 1.2 V on a 3.3 V ADC — **per-sensor
  calibration is mandatory**, there's no standard curve) and exposes it as an
  ESPHome `sensor:` with `device_class: moisture`, `unit_of_measurement: "%"`,
  often alongside a BH1750 (illuminance) and AHT20 (temp/humidity) on the
  same board. ESPHome's own device-showcase has a ready-made "Smart Plant"
  reference design combining exactly this sensor set:
  https://devices.esphome.io/devices/smart-plant/
- Alternatively a battery BLE tag can broadcast in the **BTHome v2** format
  (ESPHome's `xiaomi_ble`/BTHome listener path, or any BTHome-native sensor)
  and HA's built-in **`bthome`** integration decodes it with zero custom
  component code — same entity shape as (a).
- This is architecturally identical to how Diorama already treats the
  companion LD2450 firmware: an ESPHome device exposing conventional HA
  entities that Diorama binds to generically. No new HA-side integration
  work is implied for Diorama itself — same generic `sensor.*` binding as
  Mi Flora/FYTA.

### 2.3 What's NOT available (or not worth using) over the WebSocket API

- The `plant.*` aggregate entity's `problem`/`*_status` convenience fields
  are technically available over WS (they're just entity attributes) but
  **should not be relied on** as the primary signal — most users with Mi
  Flora/FYTA sensors will never have set up the `plant:` YAML block, so
  binding only to `plant.*` would silently work for almost nobody. Bind to
  the underlying `sensor.*` moisture entity and compute the threshold
  yourself (mirroring what `plant.*` does internally): min_moisture default
  20 is a reasonable industry-standard default to reuse.
- FYTA's per-measurement `*_status` text (e.g. `too_low`) IS a normal sensor
  state string over WS — usable as a shortcut if the user happens to bind
  that entity instead of/alongside the raw moisture %, see §6.
- No HA action/service is needed at all for the core feature — this is a
  pure state-read feature, like `tempEntity`/`powerEntity` today. (There is
  no "water this plant" actuator in the ecosystem to call back into — smart
  irrigation valves are a separate, unrelated HA domain (`valve`/`switch`)
  and out of scope here.)
- Historical trend (`HaApi.getHistory`, already implemented in both
  `HassClient`/`HassPanelAdapter` per `docs/DESIGN-world.md`'s geo-calibration
  use) is available and would let a future "moisture over the last N days"
  sparkline be built without new plumbing — see §6.

## 3. Real-world / visual reference

**Sensor hardware** (for an optional tiny clip-on decal on the pot — not load
bearing for the droop feature itself, but useful if a "sensor present"
indicator is wanted):

- **Mi Flora / HHCCJCY01**: white plastic leaf-shaped body, ≈120.5 × 24.5 ×
  12.5 mm, with a ≈73 mm probe spike pushed into the soil at the pot edge;
  CR2032 coin cell, ~1 year life.
  (https://en.m.nu/bluetooth-other/mi-flora-plant-sensor, general retailer
  spec pages.)
- **FYTA Beam**: rounded plastic head ≈56 × 32 mm with an interchangeable
  probe rod, stock 75 mm (3"), swappable 30–200 mm depending on pot size —
  vendor recommends the 75 mm probe for 10–15 cm pots.
  (https://fyta.de/en/products/fyta-beam)
- Both mount the same way: pushed vertically into the soil near the pot rim,
  visible body above soil level, angled slightly outward so it doesn't
  compete with the stem.

**Wilting appearance** (what the droop animation should evoke, general
houseplant-care visual knowledge): drooping/wilting is primarily a **loss of
turgor pressure** — leaves and stems sag downward and inward under their own
weight instead of standing rigid; leaf edges curl; color shifts from healthy
saturated green toward dull olive/yellow-brown at the extremes, sometimes
with browning tips; soil visibly pulls away from the pot wall and lightens/
cracks when bone dry. Recovery after watering is the reverse: turgor returns
over hours (not instant) and leaves re-erect. For a Sims-toon panel, the
useful, cheap-to-render subset is: **leaf droop angle + leaf color desaturation
+ a moisture-% status chip** — full soil-crack textures are a nice-to-have,
not required (see §6).

## 4. Diorama visualization & animation design

### 4.1 Data model additions

`Furniture` (types.ts) gains two optional item-level fields (no
`repairFloor`/`defaultFloor` change needed — item-level optional fields pass
through untouched, exactly like `tempEntity`/`powerEntity`/`doorEntity`):

```ts
moistureEntity?: string | null;   // sensor.* device_class 'moisture' (or 'humidity'
                                   // mislabeled soil probes). Display + droop-driver only.
moistureThreshold?: number;       // % below which the plant is "thirsty"; default 20
                                   // (matches HA's plant integration min_moisture default).
plantDemoThirsty?: boolean;       // UNBOUND only: manual "Test thirsty" toggle so the
                                   // droop animation can be demoed/authored without a
                                   // real sensor, mirroring SafetySensor's Test button.
```

Gate the sidebar bind row (and the droop feature) on furniture whose
`resolveFurnitureDef(...)` has `activity === 'tend_plant'` OR
`kind === 'flower_bed'` — i.e. the existing indoor `plant` kind plus the
outdoor `flower_bed` kind, and any custom `ObjectRecipe` that opts in via
`activity: 'tend_plant'`. Leave `bush`/`tree`/`pine_tree` out of v1 (garden
soil moisture is usually a zone/irrigation-level reading, not per-plant) —
easy to extend later since the field is generic.

### 4.2 Single source of truth: `Planner.stepPlants(dt)` (follow the robot precedent, not the appliance-door one)

This is the one load-bearing architecture decision: **do the hysteresis +
easing in `Planner`, not in `three-renderer`.** The codebase already learned
this lesson once for robots — quoting CLAUDE.md: *"Movement controller lives
in the PLANNER... `Planner.robotStates` is the single source of truth read by
BOTH `drawRobots` (2D) and three-view→`updateRobotRigs` (3D) — a robot moves
even if 3D was never opened."* Plant droop needs the identical property: a
2D-only session must still show a wilting plant. If the hysteresis/blend
state lived only in `three-renderer` (as the appliance-door blend does), a
2D-only user would need a second, independently-written copy of the same
threshold logic — a correctness trap and a maintenance duplication.

Add to `Planner`:

```ts
private _plantThirsty: Record<string, boolean> = {};   // fixture id -> latched state
private _plantBlend: Record<string, number> = {};       // fixture id -> eased 0..1 droop amount

// Called once per 2D RAF tick, right after stepLerp()/stepRobots(dt).
stepPlants(dt: number): void {
  const f = this.floor();
  for (const fu of f.furniture) {
    const def = resolveFurnitureDef(fu, this.store.customObjects);
    if (def.activity !== 'tend_plant' && fu.kind !== 'flower_bed') continue;
    if (!fu.moistureEntity && fu.plantDemoThirsty === undefined) continue; // nothing to drive it
    let raw = NaN;
    if (fu.moistureEntity && this.hass?.states) {
      raw = parseFloat(this.hass.states[fu.moistureEntity]?.state ?? '');
    }
    const threshold = fu.moistureThreshold ?? 20;         // HA plant.min_moisture default
    const recoverAt = threshold + PLANT_HYSTERESIS_PCT;   // e.g. threshold + 8
    let wasThirsty = this._plantThirsty[fu.id] ?? false;
    if (isFinite(raw)) {
      if (!wasThirsty && raw < threshold) wasThirsty = true;
      else if (wasThirsty && raw > recoverAt) wasThirsty = false;
    } else if (fu.plantDemoThirsty !== undefined) {
      wasThirsty = fu.plantDemoThirsty;                    // unbound demo override wins
    }
    this._plantThirsty[fu.id] = wasThirsty;
    const cur = this._plantBlend[fu.id] ?? 0;
    const alpha = 1 - Math.exp(-dt / PLANT_DROOP_TAU_S);    // e.g. tau ~= 1.5s droop, slower recover
    this._plantBlend[fu.id] = cur + ((wasThirsty ? 1 : 0) - cur) * alpha;
  }
}

// Cheap getter both renderers read.
plantDroop(fuId: string): number { return this._plantBlend[fuId] ?? 0; }
```

Constants (document at the top of `planner.ts` like `fusion.ts` does):
`PLANT_HYSTERESIS_PCT = 8` (thirsty at `threshold`, recovers only above
`threshold + 8` so a reading oscillating right at the line doesn't flicker —
same hysteresis idiom as the weather day→dusk downgrade / BLE fusion
release factor), `PLANT_DROOP_TAU_S ≈ 1.5` for wilting in,
`PLANT_RECOVER_TAU_S ≈ 3` for perking back up slightly slower (recovery from
watering is gradual in real plants; matches the "recovery" framing in the
research target). Wire `stepPlants(dt)` into the 2D RAF call site right after
the existing `stepLerp`/`stepRobots` calls (`canvas-2d.ts`).

`moistureEntity` is a **display/animation-only** binding — like
`tempEntity`/`powerEntity`, it must never feed `effectiveState` or the
activity system.

### 4.3 2D representation (`canvas-render.ts`)

Plant/flower_bed already draw via `drawFurniturePrimitiveLocal`'s
`case 'plant':` (pot ellipse + 3 leaf-clump ellipses). Thread a `droop:
number` (0..1, from `p.plantDroop(piece.id)`) into that function the same
way `binFull: boolean` is already threaded in from `drawFurniture` — same
call site, same pattern, just one more parameter:

- **Leaf color**: lerp the leaf fill from the healthy `rgba(124,179,66,…)`
  toward a wilted olive/brown (e.g. `rgba(154,133,58,…)`) by `droop`.
- **Leaf droop**: nudge each leaf ellipse's center slightly toward the pot
  center (they "collapse inward/down" in plan view — there's no vertical
  axis in a top-down 2D plan, so inward collapse + flattening the ellipse's
  minor radius by `droop*0.3` reads as wilting) and shrink each ellipse
  ~15% at `droop = 1`.
- **Moisture % chip**: when `fu.moistureEntity` is bound, draw a small text
  chip near the piece (same call shape as `EnvSensor`'s value chip) showing
  the live `%`, colored green (healthy) / amber (within the hysteresis band,
  i.e. `wasThirsty` but not yet at `droop≈1`) / red (`droop` near 1). **Do
  not reuse `envColor()` as-is** — it escalates on `value ≥ warn/danger`
  (higher = worse, correct for CO₂/PM), but moisture health is **inverted**
  (lower = worse). Write a small dedicated `plantMoistureColor(value,
  threshold)` helper rather than calling `envColor` with confusing inverted
  arguments.
- Gate: no new layer. It draws inside `drawFurniture`, already gated by the
  existing `furniture`/`appliances` layers (plant is cat `furniture`,
  default).

### 4.4 3D representation (`three-renderer.ts`)

Restructure the `case 'plant':` builder (and add a matching one for
`flower_bed`, currently undecorated) so each leaf clump hangs off a **pivot
group** anchored at its attachment point (instead of the current bare
spheres added directly to `grp`), exactly the "pivot group built at rest,
then eased per-frame toward a target" idiom already used for appliance
doors:

```ts
// at build time (updateFloor / _buildFurniture), per leaf clump:
const pivot = new THREE.Group();
pivot.position.set(baseX, baseY, baseZ);           // attachment point near the pot rim/stem
const leafMesh = new THREE.Mesh(sphereGeo, leafMat);
leafMesh.position.set(0, clumpRadius, 0);          // offset up from the pivot
pivot.add(leafMesh);
grp.add(pivot);
this._plants.push({
  fuId: fu.id, pivot, mat: leafMat,
  dirX: normalize(offsetX), dirZ: normalize(offsetZ),   // radial direction from pot center
});
```

Register `_plants: PlantRig[] = []` alongside `_applianceDoors`, reset at the
top of `updateFloor` (same place `_applianceDoors = []` is reset), rebuilt
whenever the plant piece rebuilds under `_keyFloor`.

Per-frame, in `updateTargets` (alongside `_advanceApplianceDoors`), add
`_advancePlantDroop()`:

```ts
private _advancePlantDroop(planner: Planner): void {
  const DROOP_ANGLE = 0.55; // rad, ~31 deg tip
  const healthy = new THREE.Color(0x4c8c2b);
  const wilt = new THREE.Color(0x8a7233);
  for (const p of this._plants) {
    const blend = planner.plantDroop(p.fuId);     // 0..1, ALREADY eased by Planner
    // Tip each clump outward/down along its own radial direction — generic
    // for any offset layout, no per-clump special-casing:
    p.pivot.rotation.x = -p.dirZ * DROOP_ANGLE * blend;
    p.pivot.rotation.z =  p.dirX * DROOP_ANGLE * blend;
    p.pivot.position.y -= 40 * blend;              // slight sag
    p.mat.color.lerpColors(healthy, wilt, blend);  // mutate in place — no rebuild
  }
}
```

Notes:
- **No local easing needed here** — `Planner.plantDroop()` already returns a
  time-eased value, so the renderer just applies it directly each frame
  (matches the robot precedent: the renderer is a dumb reader of
  Planner-owned animation state, not a second place that computes it).
- `updateTargets` needs a `Planner` reference (or the value threaded through
  `ActivityContext` as `ctx.plantDroop: Record<string, number>`, built once
  per tick in `three-view._tickOnce` the same way `doorSensorOpen`/`entityOn`
  are built — pick whichever plumbing is less invasive; either is
  architecturally fine since both already read Planner state per tick).
- Leaf material must be **per-fixture, not shared** (it already is — `leaf`
  is created fresh inside `_buildFurniture`'s per-piece call, same as every
  other per-piece material) so mutating `.color` in place never bleeds
  across plants.
- Optional v1.5 polish: also lerp the pot's soil-cylinder color slightly
  lighter/drier at high `blend` (soil visibly lightens as it dries) — same
  `lerpColors` mutation on the pot material, no rebuild.
- No new dirty key needed for the animation itself (it's a persistent
  per-frame mutation like appliance doors / blob shadows), but `_keyFloor`'s
  existing "appliance/bin state hash" precedent suggests also folding a
  **bucketed** moisture reading (round to nearest 10%) into `_keyFloor` is
  **not required** here since nothing about the *build* depends on moisture
  (only the per-frame pivot/color, which reads Planner state directly) —
  unlike temp/power, there's no chip geometry that needs rebuilding on
  value change (a sprite text update, if added per §4.5, would need its own
  small key/refresh, following the env-sprite idiom).

### 4.5 Optional 3D moisture sprite

Mirror the existing "env-sprite idiom" (`tempEntity`'s camera-facing
`THREE.Sprite`, `_disposeSpriteMaps` pairing) to show the live `%` above the
pot when bound, repainting the `CanvasTexture` only when the displayed value
changes (not every frame). Not required for the droop effect itself (the
leaf pose + color already communicate health at a glance — matching the
research target's "droop/wilt... animation" framing more than a numeric
readout), but cheap to add if a precise number is wanted; use the same
`_disposeSpriteMaps` before rebuild / on destroy pairing as every other
sprite in the codebase.

## 5. Integration steps (canvas-fixture-adjacent — this rides the EXISTING plant/flower_bed fixtures, no new tool/hit-test/drag needed)

Because `plant`/`flower_bed` are existing `Furniture` kinds (not a new
fixture type), skip the full canvas-fixture recipe's placement/hit-test/drag
steps — those already work. The remaining steps:

1. **types.ts**: add `moistureEntity?`, `moistureThreshold?`,
   `plantDemoThirsty?` to `Furniture`.
2. **planner.ts**: add `_plantThirsty`/`_plantBlend` maps, `stepPlants(dt)`,
   `plantDroop(fuId)` getter, and the two tuning constants. Add
   `fu.moistureEntity === id` to `_isSlowEntity`'s furniture-id check
   (alongside `doorEntity`/`tempEntity` — matches "display-only binding
   routed through the config channel so the sidebar re-renders on change";
   moisture readings update far slower than power, so config-path is
   correct here, not live-path).
3. **canvas-2d.ts**: call `planner.stepPlants(dt)` in the RAF loop next to
   the existing `stepLerp`/`stepRobots(dt)` calls.
4. **geometry.ts**: add a `plantMoistureColor(value, threshold)` helper
   (inverted-direction sibling of `envColor`); optionally add a `conductivity`
   `EnvKind` while touching this area (see §6).
5. **canvas-render.ts**: thread `droop` into `drawFurniturePrimitiveLocal`'s
   `case 'plant':` (color lerp + inward/flatten nudge); add the moisture %
   chip (gated on `fu.moistureEntity` being set) using
   `plantMoistureColor`.
6. **three-renderer.ts**:
   - Restructure the `plant` case's leaf spheres into pivot groups; add a
     matching `flower_bed` decorative builder if it doesn't already have
     foliage geometry to droop (confirm current `flower_bed` 3D case first —
     if it's a bare box, either add simple foliage or scope flower_bed to
     the 2D/chip-only treatment for v1).
   - Add `_plants: PlantRig[]`, reset in `updateFloor`, populate during the
     `plant`/`flower_bed` builds.
   - Add `_advancePlantDroop()`, call it from `updateTargets` (needs a
     Planner reference or a `ctx.plantDroop` map — see §4.4).
7. **three-view.ts** (only if routing droop via `ctx` instead of a direct
   Planner reference): build `ctx.plantDroop` once per tick from
   `planner.plantDroop(fu.id)` for each plant/flower_bed on the floor,
   alongside the existing `doorSensorOpen`/`entityOn` map construction.
8. **sidebar.ts**: add a `_moistureBindRow` (copy `_tempBindRow`'s shape:
   status line + Bind/Rebind/Unbind buttons, domain `sensor`), gated the
   same way `_tempBindRow` is gated (`curKind === 'plant' || curKind ===
   'flower_bed' || def.activity === 'tend_plant'`); add a `moistureThreshold`
   number input (default 20); add a "Test thirsty" toggle button when
   unbound (mirrors the SafetySensor Test-button idiom, disabled once
   `moistureEntity` is bound).
9. **Typecheck + build** (`npm run typecheck && npm run build`) — no test
   suite exists per CLAUDE.md; this is the verification gate.
10. Manually verify: bind a real or `input_number`-backed test `sensor.*`
    with `device_class: moisture`, sweep its value across the threshold in
    Developer Tools → States, confirm smooth droop-in and slower recover in
    both 2D and 3D, confirm a 2D-only session (3D view never opened) still
    shows the droop (this is the one property most worth manually
    double-checking given §4.2's design rationale).

## 6. Potential additional features

- **`conductivity` EnvKind**: extend `ENV_KINDS`/`envKindOf` with a
  `conductivity` bucket (glyph e.g. `⚡` or `EC`, unit µS/cm) so a
  fertility/salinity sensor dropped as a plain Env fixture renders sensibly
  instead of falling through to `generic`. Small, low-risk, useful beyond
  plants (aquariums, hydroponics).
- **FYTA `*_status` shortcut**: if a user binds a FYTA `sensor.<plant>_moisture_status`
  (already a 6-tier verdict: `too_low`/`low`/`perfect`/`high`/`too_high`)
  instead of/alongside the raw %, let `stepPlants` accept a status-string
  entity as an alternative driver (`too_low` → thirsty, `perfect`/`high` →
  healthy) so FYTA users get correct behavior without knowing FYTA's
  numeric moisture scale differs from Mi Flora's.
- **Battery badge reuse (free)**: because `Planner.batteryFor(entityId)`
  already resolves a sibling battery-class sensor on the same HA device via
  the registry scan, binding `moistureEntity` to a Mi Flora/FYTA
  moisture sensor automatically surfaces a 🔋 battery badge on the plant
  fixture with **zero additional code** — worth calling out in the sidebar
  copy so users know it "just works."
- **Watering-gesture recovery nudge**: let an avatar's `tend_plant`
  activity engagement (already anchors here) locally nudge
  `plantDemoThirsty` back toward healthy for **unbound** demo plants — a
  small gamified touch (letting a Diorama avatar act like a caretaker for a
  demo/staged scene) without affecting bound real-sensor plants (which
  always follow the real reading).
- **History sparkline**: `HaApi.getHistory` already exists (built for geo
  calibration) — a tiny moisture-over-7-days sparkline in the sidebar
  moisture row would be cheap to add given the plumbing is already there.
- **Soil-dryness pot texture**: lerp the pot/soil-top material lighter and
  add a subtle procedural crack `CanvasTexture` (same idiom as the
  `_groundTexture`/`_puddleTex` procedural-canvas-texture pattern already
  used for ground coverings/puddles) at high `blend` for extra fidelity.
- **Low-battery / stale-reading distinct treatment**: a Mi Flora sensor gone
  stale (BLE proxy out of range) shouldn't read as "definitely thirsty" —
  consider a third visual state (dimmed/grayed leaves, like the
  `unavailable` gray-not-red debate in the HA `plant.*` issue tracker) for
  `isFinite(raw)` false for an extended period, distinct from actually-dry.
- **Outdoor extension**: once outdoor per-plant soil probes are common
  enough, extend the whitelist to `bush`/`tree`/`flower_bed` uniformly (the
  data model is already generic — this is a one-line kind-whitelist change).

## 7. Open questions & risks

- **Vendor fragmentation on units/scales**: Mi Flora's conductivity (µS/cm)
  and FYTA's salinity (mS/cm) are not directly comparable numbers, and
  FYTA's `light` is µmol (PAR) vs Mi Flora's lx — if a future feature wants
  to show "light received" alongside moisture, don't assume a single unit;
  read `unit_of_measurement` per `envValueText`'s existing pattern rather
  than hardcoding.
- **`device_class` inconsistency in the wild**: HA core issue
  home-assistant/core#126000 documents at least one integration classifying
  a soil moisture sensor as `humidity` instead of `moisture`. The sidebar's
  entity picker for the moisture bind row should probably not hard-filter to
  `device_class === 'moisture'` only — default the domain filter to
  `sensor` (as `_tempBindRow`/`_powerBindRow` already do) and let the user
  pick any sensor, trusting them to choose the right one, rather than
  silently hiding a legitimately-soil-moisture sensor that's mislabeled
  `humidity`.
- **No standard "thirsty" threshold**: 20% (HA's own default) is a
  reasonable universal default but real optimal ranges vary hugely by
  species (cactus vs fern) — `moistureThreshold` is already exposed
  per-fixture for this reason; don't be tempted to hardcode a single global
  constant with no override.
- **Calibration burden on DIY ESPHome probes**: capacitive soil sensors have
  no standard raw→% curve (dry/wet voltage varies board-to-board) — this is
  entirely on the ESPHome YAML author, outside Diorama's scope, but worth a
  one-line sidebar hint ("bind a sensor already calibrated to a 0–100%
  scale") so users don't expect Diorama to interpret raw millivolts.
- **`flower_bed`'s current 3D builder** (confirmed by reading
  `three-renderer.ts`'s `case 'flower_bed':`): it already has real foliage —
  a soil box plus 6 flower stems (`addCyl` stem + colored head) scattered
  with `(Math.random() - 0.5) * W` / `* D` **at build time**. Two
  consequences for this feature: (1) there IS geometry to droop (bend the
  stem cylinders toward horizontal + desaturate the head color, same pivot
  idiom as the leaf clumps), and (2) because the scatter positions are
  randomized on every rebuild of this piece, this is a second, independent
  reason **not** to fold moisture into `_keyFloor` — doing so would
  reshuffle the flowers to new random spots every time the moisture bucket
  ticked over, which reads as a glitch, not an animation. Confirms §4.4's
  "no new dirty key" recommendation is load-bearing here, not just an
  optimization.
- **Where the ctx-vs-direct-Planner-reference wiring lives** (§4.4) is a
  minor implementation choice, not a design risk — either threading a
  Planner reference into `updateTargets` or adding one more field to
  `ActivityContext` (built each tick in `three-view._tickOnce`) works; the
  `ActivityContext` route is probably slightly more idiomatic since that's
  exactly what `doorSensorOpen` already does for a very similar
  "per-fixture-id boolean/derived-value map, refreshed once per tick" need.
- **Recovery realism vs demo satisfaction**: real plants take hours to
  visibly recover turgor after watering; a Diorama demo/test flow (flipping
  `plantDemoThirsty` off) will look better with a snappier recovery tau than
  strict realism would suggest. The `PLANT_RECOVER_TAU_S` constant is
  deliberately a tunable, not derived from any real physiological rate —
  treat it as a "looks good" number to iterate on visually, not a fact to
  research further.

## 8. Sources

- https://www.home-assistant.io/integrations/plant/ — core Plant Monitor
  integration (YAML schema, states, thresholds).
- https://github.com/home-assistant/core/blob/dev/homeassistant/components/sensor/const.py
  — `SensorDeviceClass` enum (`moisture`, `humidity`, `conductivity`,
  `illuminance`, `temperature`, `battery`, `ph`) and their units.
- https://developers.home-assistant.io/docs/core/entity/sensor/ — sensor
  entity / device class developer docs.
- https://www.home-assistant.io/integrations/xiaomi_ble/ — Xiaomi BLE (Mi
  Flora / HHCC) core integration: entities, passive-vs-connect battery
  caveat.
- https://esphome.io/components/sensor/xiaomi_ble/ — ESPHome-side Xiaomi
  Mijia BLE sensor component.
- https://www.home-assistant.io/integrations/fyta/ — FYTA integration:
  entities, cloud-polling cadence, status tiers.
- https://devices.esphome.io/devices/smart-plant/ — ESPHome reference
  "Smart Plant" device (capacitive moisture + BH1750 + AHT20 pattern).
- https://github.com/Olen/homeassistant-plant — community/HACS alternative
  Plant Monitor (OpenPlantbook species data, `replace_sensor` service) —
  noted as a *different* entity model, not assumed present.
- https://github.com/home-assistant/core/issues/126000 — "Soil moisture
  sensor is classified as humidity device" (device_class inconsistency in
  the wild).
- https://community.home-assistant.io/t/problem-setting-automation-if-any-plant-has-attribute-conductivity-status-set-to-low/892855
  and https://github.com/orgs/home-assistant/discussions/1849 — `plant.*`
  problem-state / unavailable-handling quirks.
- Dimensions: https://en.m.nu/bluetooth-other/mi-flora-plant-sensor (Mi
  Flora body/probe size), https://fyta.de/en/products/fyta-beam (FYTA Beam
  body/probe size).
- Diorama source read directly for architecture mapping:
  `src/types.ts` (`Furniture` interface), `src/geometry.ts`
  (`FURNITURE_KINDS.plant`, `ENV_KINDS`, `envKindOf`, `envColor`),
  `src/canvas-render.ts` (`drawFurniture`, `drawFurniturePrimitiveLocal`
  plant case), `src/three-renderer.ts` (`plant` case in `_buildFurniture`,
  `_applianceDoors`/`_advanceApplianceDoors`, `tend_plant` activity pose),
  `src/ui/three-view.ts` (`applianceKey`/`_keyFloor` construction,
  `doorSensorOpen`/`ActivityContext`), `src/ui/sidebar.ts`
  (`_powerBindRow`/`_tempBindRow`/Test-button idioms), `src/planner.ts`
  (`_isSlowEntity`).
