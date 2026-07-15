# Sirens & Alert Beacons — Build-Ready Research

Status: research complete, not yet implemented. Target: a new `Floor.sirens: SirenFixture[]`
canvas fixture bound to HA's `siren.*` domain, sharing a generalized "beacon" pulse-visual
primitive with the existing smoke/CO/gas ceiling beacons (`SafetySensor`).

## 1. Summary

Home Assistant's `siren` domain models any device whose job is to make noise (and often
flash) to get a human's attention: security-system sirens, standalone Z-Wave/Zigbee
siren/strobe boxes, panic buttons' local horn, smart-smoke-alarm test/interconnect
sirens, doorbell chimes, water-heater/leak alarm horns, even weather/tornado sirens
exposed via MQTT bridges. It is a small, generic on/off entity (like `switch`) plus three
optional capabilities: tone selection, duration, and volume.

This fits Diorama because a siren is fundamentally a **spatial, attention-grabbing
device** — where it's mounted (which room, which wall, indoor vs. outdoor) determines
how loud/effective it is, exactly the kind of thing a floorplan panel should let you place
and see. Diorama already ships the near-identical "ceiling beacon" visual for
smoke/CO/gas detectors (`SafetySensor`, `updateSafetySensors` in `three-renderer.ts`,
`drawSafetySensors` in `canvas-render.ts`) — pulsing rings + colored glow erupting from a
disc while `binary_sensor.*` is `on`. A `siren.*`-bound fixture is the natural sibling:
same alarming-pulse visual language, but (a) it's actively **controllable** (turn on/off,
pick a tone, set volume/duration) rather than a passive detector display, and (b) it's
typically **wall-mounted**, not ceiling-mounted, so the pulse should radiate from a wall
plate into the room rather than drop from the ceiling. Building it as a shared primitive
lets a future device (tornado siren pole, water-heater leak horn, doorbell-chime box)
reuse the same beacon code instead of re-deriving pulsing-ring math a third time.

## 2. Home Assistant data model

### 2.1 Core `siren` domain (built into HA core since **2021.8**)

Source: [Siren entity — Developer docs](https://developers.home-assistant.io/docs/core/entity/siren/),
[`siren/__init__.py`](https://github.com/home-assistant/core/blob/master/homeassistant/components/siren/__init__.py),
[`siren/const.py`](https://github.com/home-assistant/core/blob/master/homeassistant/components/siren/const.py),
[Siren integration (user docs)](https://www.home-assistant.io/integrations/siren/).

- **Entity id pattern**: `siren.<name>`.
- **State values**: `on`, `off`, plus the universal `unavailable` / `unknown`. There is
  no "playing a specific tone" state — see the caveat below.
- **`supported_features` bitmask** (`SirenEntityFeature`, an `IntFlag` — exact values
  confirmed from `const.py`):

  | Flag | Value | Enables |
  |---|---|---|
  | `TURN_ON` | `1` | `siren.turn_on` action is valid |
  | `TURN_OFF` | `2` | `siren.turn_off` action is valid |
  | `TONES` | `4` | `tone` param on `turn_on`; `available_tones` capability attribute appears |
  | `VOLUME_SET` | `8` | `volume_level` param on `turn_on` |
  | `DURATION` | `16` | `duration` param on `turn_on` |

  `supported_features` is a **standard attribute present on every HA entity's state
  object** (`hass.states[entity_id].attributes.supported_features`) — it is pushed in the
  normal `get_states` snapshot and every `state_changed` event, so Diorama can read it
  with zero extra plumbing (same mechanism already used to read light `supported_color_modes`
  etc., if that pattern exists, or simply read via `states[id].attributes`).
- **`available_tones` attribute** (only present when `TONES` is set) — a **capability
  attribute** (`capability_attributes`, cached/static, not expected to change at runtime):
  either a `list[int | str]` or a `dict[int, str]` (numeric tone-id → human name). Example
  from MQTT siren docs:
  ```yaml
  available_tones:
    - ping
    - siren
  ```
  When it's a dict, either the key or the value may be passed back as the `tone` service
  parameter.
- **Attribute constants** (exact strings, from `const.py`): `ATTR_TONE = "tone"`,
  `ATTR_DURATION = "duration"`, `ATTR_VOLUME_LEVEL = "volume_level"`,
  `ATTR_AVAILABLE_TONES = "available_tones"`.

### 2.2 Actions / services

All via the standard WS `call_service` command (`Planner.hass.callService(domain, service, data)`
already generic — no `HaApi` changes needed, same as `alarm_control_panel.*` / `vacuum.*`
calls elsewhere in the codebase).

- **`siren.turn_on`** (target: `entity_id`) — requires `TURN_ON`. Optional body params,
  each gated by its feature flag:
  - `tone: int | string` (requires `TONES`)
  - `duration: positive int` seconds (requires `DURATION`)
  - `volume_level: float` 0.0–1.0 (requires `VOLUME_SET`)
- **`siren.turn_off`** (target: `entity_id`) — requires `TURN_OFF`, no params.
- **`siren.toggle`** (target: `entity_id`) — flips on/off.
- **Triggers** (automation-side, not needed by Diorama): `siren.turned_on`,
  `siren.turned_off`. **Conditions**: `siren.is_on`, `siren.is_off`.

MQTT example payload shape (useful as a mental model for what a real device command
looks like): `{"state":"ON", "tone": "bell", "duration": 10, "volume_level": 0.5}`.

### 2.3 What is / is NOT available over the HA WebSocket API

- Everything above (state, `supported_features`, `available_tones`, and issuing
  `turn_on`/`turn_off`/`toggle`) is **fully available** over the standard WS connection
  Diorama already uses (`state_changed` subscription + `call_service`). No REST-only or
  polling-only surface exists for this domain.
- **Caveat (confirmed from the `SirenEntity` base-class source):** the entity does **NOT**
  expose which tone/duration/volume is *currently* playing as a live state attribute.
  `capability_attributes` only ever returns the **static list of available tones**; the
  tone/duration/volume passed to `turn_on` are one-shot service parameters that the
  device (or its integration) consumes and does not echo back into state. **Design
  consequence: Diorama can show "alarming" (on/off) and let the user pick a tone/volume/
  duration to send, but it cannot display "currently playing tone: bell" anywhere** — there
  is nothing in HA's state model to read that from. Don't design a UI element that implies
  otherwise.
- No siren-specific attribute reveals decibel/loudness in real time either (loudness is a
  send-only param on the vendor-specific actions below, not a readable state attribute).

### 2.4 Core vs. custom/HACS integrations, and vendor fragmentation

- **Core, native `siren` domain**: MQTT ([`siren.mqtt`](https://www.home-assistant.io/integrations/siren.mqtt/),
  config vars `state_topic`/`command_topic`/`available_tones`/`support_duration`/
  `support_volume_set`/`payload_on`/`payload_off`), Z-Wave JS (many Aeotec/Fibaro/Ecolink
  devices), various cloud integrations (Ring Alarm siren, SimpliSafe, etc.), Tuya/Tuya
  Local (siren entities — some firmware quirks reported, e.g. `volume` key rejected by
  certain Tuya siren models in `tuya-local` issue #2980 — a real fragmentation data
  point), and ESPHome (a device can expose a generic `siren` entity from custom C++/
  template code; no first-class "siren" YAML platform block was found in the ESPHome
  component list at research time — **treat ESPHome siren support as bespoke per-device
  until verified**, unlike its first-class `binary_sensor`/`switch`/`number` platforms).
- **Zigbee, fragmented across two paths**:
  - **ZHA**: Zigbee IAS Warning Device (WD) sirens are driven by a **custom action**,
    [`zha.warning_device_warn`](https://www.home-assistant.io/actions/zha.warning_device_warn/),
    **not** the generic `siren.turn_on` schema — different parameters entirely: `warning_device_mode`
    (an IAS "warning mode" — e.g. burglar/fire/emergency, plus a Stop mode; not the generic
    `tone` string), `warning_device_strobe` (bool), `warning_device_duration` (seconds,
    default 5), `warning_device_siren_level`/loudness (`0`–`3`), `warning_device_strobe_duty_cycle`
    (`0`–`100` in steps of 10), `warning_device_strobe_intensity` (`0`–`3`). As of the
    research window there is an open community feature request to move ZHA onto the
    standard `siren` entity platform for parity with MQTT/Z-Wave — **verify at
    implementation time whether it has landed**; if a given ZHA siren *also* registers a
    generic `siren.*` entity, prefer that; otherwise a ZHA IAS device needs its own bind
    path calling `zha.warning_device_warn` instead of `siren.turn_on`.
  - **Zigbee2MQTT**: exposes IAS warning devices through the standard `siren` MQTT
    discovery shape (see [Koenkk/zigbee2mqtt#31000](https://github.com/Koenkk/zigbee2mqtt/pull/31000)) —
    this path DOES land as a normal `siren.*` entity in HA, so it's the easy case.
- **Fallback pattern seen widely in the wild**: many DIY/relay-based sirens (a Sonoff/
  Shelly relay wired to a 12 V siren horn) are exposed as a plain `switch.*`, not
  `siren.*`, because the integration author never adopted the siren platform. **Diorama's
  binding picker should accept both `siren.*` and `switch.*`** for this fixture (mirroring
  how `Planner.toggleEntity` already dispatches by reading the domain off the entity id) —
  a switch-backed "siren" just won't support tones/volume/duration UI (no
  `supported_features` semantics to read), so gate those controls on `entity_id.startsWith('siren.')`
  in addition to the feature-flag checks.
- **Alarm-panel overlap, already shipped**: Diorama's `AlarmPanel` fixture
  (`alarm_control_panel.*`) is a **different domain** — it's the keypad/arm-state display,
  not the horn. Many real alarm systems have both: one `alarm_control_panel.*` entity for
  arm state and a *separate* `siren.*` (or relay `switch.*`) entity for the physical horn/
  strobe box. They should remain separate Diorama fixtures that a user can co-locate on
  the same wall, not be merged.

## 3. Real-world / visual reference

Sizes/mounting drawn from actual consumer + code-mandated fire-alarm hardware, since
"siren" spans both DIY security sirens and life-safety notification appliances:

- **Compact wall/ceiling siren-strobe pucks** (the common consumer smart-home shape —
  Aeotec Siren 6, Fibaro Siren, similar): roughly circular or rounded-square, **~100–130 mm
  diameter, ~30–40 mm deep**, single lens/lightring on the face, often battery-backed.
  Aeotec Siren 6 specifically: 110 dB, up to 30 built-in tones, Z-Wave JS integration
  (exposes as **multiple discrete siren-like entities/scenes**, per the "8 stored default
  sounds/volumes" device model — a good example of "one physical siren, several HA
  entities" fragmentation to keep in mind for binding UX).
- **Larger indoor/outdoor security siren boxes** (Ring Alarm Outdoor Siren, Ecolink,
  generic "bell box"): flat rectangular box, Ring's outdoor unit measures
  **235 × 235 × 57 mm** (9.25 × 9.25 × 2.24 in) — a good reference size for a wall-mounted
  box model. Traditional exterior "bell box" alarm sirens (UK-style) are similar
  rectangular boxes ~250×180×80 mm, frequently with a flashing strobe lens and
  tamper-resistant cover, mounted high on an exterior wall (eave height, ~2.5–3 m) for
  visibility and tamper resistance.
- **Life-safety horn/strobes** (fire alarm notification appliances, e.g. System Sensor /
  Wheelock/Gentex style — relevant if a user wires a fire-panel siren into HA via a relay):
  code-mandated (NFPA 72) wall mounting of the strobe **lens between 2032 mm and 2438 mm
  AFF** (80–96 in), or within 150 mm of the ceiling if the room is shorter. Housing is
  typically a ~110–155 mm square plate, white or red, with a clear/red round strobe lens
  and (for horn/strobe combo units) a grille.
- **Colors**: housings are typically white, grey, or red (red strongly associated with
  fire/security alarm equipment); strobe/lens color is most often **clear/white** (fire)
  or **red** (security); some devices use amber for "trouble"/supervisory vs. red for
  alarm. Tornado/civil-defense sirens (large pole-mounted rotating horns) are a distinct,
  much larger outdoor form factor (not a realistic in-home Diorama target — flag as
  out-of-scope / future "yard" object at most).
- **Placement pattern for Diorama's purposes**: interior sirens are wall-mounted, usually
  high (near ceiling) in a hallway or main living space for max audibility; exterior units
  mount under an eave. This matches the **wall-snap fixture convention** Diorama already
  uses for switches/floodlights/alarm panels rather than the free-placed ceiling-puck
  convention used for smoke/CO detectors.

## 4. Diorama visualization & animation design

### 4.1 New type — `SirenFixture` (mirrors `AlarmPanel`/`SafetySensor` shape)

```ts
// src/types.ts — new interface, alongside AlarmPanel / SafetySensor.
// Wall-mounted siren/strobe fixture. Bound to siren.* (preferred) or switch.*
// (relay-driven DIY sirens with no tone/volume/duration semantics). 'on' = alarming.
export interface SirenFixture {
  id: string;
  x: number; y: number;
  rotation?: number;         // deg, wall-plate convention (0 = +Y world), like switches/alarm panels
  height?: number;           // mm above floor; default 2200 (eave/near-ceiling)
  entity_id: string | null;  // siren.* or switch.*
  tone?: string | number | null;   // selected tone to send on trigger (siren.* + TONES only)
  volume?: number | null;          // 0..1, sent on trigger (siren.* + VOLUME_SET only)
  duration?: number | null;        // seconds, sent on trigger (siren.* + DURATION only)
  localState?: string;       // unbound manual test trigger: 'on' = alarming; inert once bound
  label?: string;
  locked?: boolean;
}
```

`Floor.sirens?: SirenFixture[]` — repairFloor + defaultFloor backfill `[]`, same as
`alarmPanels`/`safetySensors`.

### 4.2 Shared beacon primitive (the refactor this feature asks for)

Today `updateSafetySensors` (three-renderer.ts ~L4980–5024) and `drawSafetySensors`
(canvas-render.ts ~L841–860) each hand-roll: a colored glow bulb/halo that pulses via
`0.5 + 0.5*sin(nowS * K)`, plus 2–3 rings that expand outward on a `(nowS*speed + k/3) % 1`
phase ramp with fading alpha. Extract this into shared helpers so both the existing
detector beacons and the new siren fixture call the same code:

- **3D**: `_beaconPulse3D(group, originLocal, dirY, color, nowS, opts)` in
  `three-renderer.ts` — builds the glow-sphere + N flat `RingGeometry` rings (all tagged
  `outlineSkip: true`, same as today) at a given local origin, with a direction sign
  (`dirY = -1` for ceiling beacons dropping rings downward like today's smoke/CO code,
  `dirY = 0`/omnidirectional-in-plane for a wall unit where rings should expand as a
  vertical disc facing into the room rather than drop toward the floor — orient the ring
  plane to face the room instead of `rotation.x = -Math.PI/2`). Parametrize ring count,
  expansion speed, and max radius so intensity/volume can drive them (see 4.4).
- **2D**: `drawBeaconRings(ctx, cx, cy, rPx, color, t, opts)` in `canvas-render.ts` —
  factor the existing halo-fill + 3-ring loop out of `drawSafetySensors`'s alarming block
  verbatim, parametrized the same way.
- Migrate `updateSafetySensors`/`drawSafetySensors` to call the shared helpers (pure
  refactor, no visual change — verify against smoke/CO/gas by eye or the existing
  behavior). New siren code calls the same helpers with a wall-facing orientation.

### 4.3 2D representation (`canvas-render.ts`)

- `drawSirens(ctx, p, view)` — a **wall-plate rectangle** icon (visually distinct from the
  circular safety-detector disc and from the switch square — reuse the switch/floodlight
  "flush plate rotated to wall normal" drawing idiom), default fill white/grey, a small
  colored lens dot (state-driven: dim red idle, bright flashing when alarming).
- **Alarming**: flash the lens (hard on/off square wave at ~2 Hz reads more "strobe-like"
  than the smooth sine used for smoke detectors — sirens strobe, detectors glow) AND call
  `drawBeaconRings` oriented as a **half-disc fan into the room** (rings emanate from the
  wall point outward, not a full circle through the wall) — same visual grammar as
  `drawFloodlight`'s pool-into-the-room convention.
- Label/badge line under the icon: `<label> · ALARM` (red) / `<label> · idle` / `unbound`,
  matching the safety-sensor caption convention; `drawBatteryBadge` alongside it (sirens
  are frequently battery-backed, same as safety sensors).
- Gate: rides the **`sensors` layer** (`on(L.sensors)`), same as safety sensors/alarm
  panels/BLE proxies — no new layer needed.

### 4.4 3D representation (`three-renderer.ts`)

- New `_sirenGroup` (declare, add to `scene.add`, `clearTransientGroups`, `destroy`,
  `setLayerVisibility` under `v.sensors`, added to the raycast walker array — mirror
  every place `_alarmGroup`/`_safetyGroup` currently appear per the grep list in the
  research: lines ~994/1103/1454/1880/9628 equivalents).
- **Body**: a flat rectangular box (~230×230×60 mm scaled to the real Ring-siren
  reference above) flush-mounted to the wall via the existing wall-snap convention
  (`snapSwitchToWall`/`snapFloodlightToWall`/`snapAlarmToWall` precedent — add
  `snapSirenToWall`, offset `WALL_HALF + 30` since the box is ~60 mm deep, no ganging
  needed but don't block it either), plus a circular lens dome on the face
  (`SphereGeometry` half, like the sconce/floodlight lens).
- **Idle**: light grey/white housing, dim red lens (`emissiveIntensity` low), like the
  smoke detector's idle LED.
- **Alarming**: lens goes full emissive + a hard on/off strobe flicker (square wave, not
  sine — `Math.sin(nowS*STROBE_HZ*2*Math.PI) > 0` reused idiom, same "cheap because it
  rebuilds every tick" trick the fireplace flicker uses) + `_beaconPulse3D` rings expanding
  outward from the wall face into the room (ring plane rotated to face the room normal,
  not flat-on-floor like the ceiling beacons).
- **Dirty key**: `_keySirens` in `three-view.ts` = `configRev` + siren entity states
  (same shape as `_keySafety`). **Force a per-frame rebuild while ANY siren is alarming**
  (the fireplace/safety-detector idiom — `_tickOnce` already has this "any X alarming →
  force" pattern for `_keySafety`; extend the same boolean union or add a parallel one) so
  the strobe/ring animation actually advances.
- Click → `userData.kind = 'siren'` in the raycast walker; **click behavior**: bound
  `siren.*` off → `siren.turn_on` with the fixture's configured `tone`/`volume`/`duration`
  (only the params whose feature flag is set); bound `siren.*` on → `siren.turn_off`;
  bound `switch.*` → `Planner.toggleEntity` (existing generic dispatch, since switches have
  no tone/volume/duration concept); unbound → `Planner.toggleItem` flips `localState` (test
  trigger), same as every other unbound-interactive fixture.

### 4.5 Sidebar (`sidebar.ts`)

New `_section('sirens', 'Sirens', …)`, following the `alarm`/`safety` section pattern:
entity picker (domain `siren`, but allow manual switch.* entry — or pass `['siren','switch']`
to the picker per the existing `string | string[]` domain support added for doorbell
picking), height, rotation-follows-wall-snap (read-only display like other wall fixtures),
label, lock toggle, Test button (disabled when bound, mirrors safety-sensor Test button).
When bound to a `siren.*` entity, additionally read `states[entity_id].attributes`:
- If `supported_features & TONES` and `available_tones` present → a tone `<select>`
  populated from the list/dict, bound to `SirenFixture.tone`.
- If `supported_features & VOLUME_SET` → a volume slider 0–1 bound to `.volume`.
- If `supported_features & DURATION` → a duration number input (seconds) bound to
  `.duration`.
All three inputs hidden (not just disabled) when the corresponding feature flag is
absent, and hidden entirely for a `switch.*` binding (no `supported_features` semantics to
trust there).

### 4.6 Planner (`planner.ts`)

- `Planner.triggerSiren(fixture: SirenFixture)`: bound `siren.*` → reads current
  `effectiveState(fixture)?.state`; if not `'on'`, `callService('siren', 'turn_on', { entity_id, ...(tone && {tone}), ...(volume!=null && {volume_level: volume}), ...(duration!=null && {duration}) })`; if `'on'` → `callService('siren','turn_off',{entity_id})`. Bound
  `switch.*` → delegate to existing `toggleEntity`. Unbound → `toggleItem` (flip
  `localState`).
- Add bound siren `entity_id`s to `_isSlowEntity` (config-path, same rationale/comment
  style as safety sensors/alarm panels — alarm on/off is infrequent, sidebar badges + 3D
  dirty key want to refresh promptly, 2D reads state live regardless).
- New top-level per-floor field `sirens: SirenFixture[]` → add to `repairFloor` +
  `defaultFloor` backfill lists (per the CLAUDE.md reminder — miss this and the field
  silently resets on load).

### 4.7 Tools / canvas-interact

- New `Tool` union member `'siren'` (🚨🔊-style glyph — reuse a distinct emoji from the
  alarm-panel one, e.g. 📢 or 🔔-adjacent but NOT identical to the alarm panel's 🚨 or the
  doorbell's 🔔 — pick something visually distinct like 📯 or a custom horn glyph) with a
  `TOOLS` entry, place-tool click-to-drop (runs `snapSirenToWall` on drop, like
  floodlight/switch), drag-case in `canvas-interact.ts` mousemove (re-run wall-snap on
  move-release), delete-tool branch, hover cursor.
- `hitSiren` in `canvas-hit.ts` (rectangle hit test, mirrors `hitAlarmPanel`/`hitSwitch`).

## 5. Integration steps (canvas-fixture recipe order)

1. **types.ts**: add `SirenFixture` interface + `Floor.sirens?: SirenFixture[]`.
2. **geometry.ts**: `SIREN_DEFAULTS` (height 2200, box w/h/depth, lens radius), reuse
   `safetyColor`-style helper or a dedicated `sirenLensColor(alarming)`; add
   `snapSirenToWall` (mirror `snapSwitchToWall`/`snapFloodlightToWall`, offset
   `WALL_HALF + boxDepth/2`).
3. **Shared beacon refactor**: extract `_beaconPulse3D` (three-renderer.ts) and
   `drawBeaconRings` (canvas-render.ts) out of the existing safety-sensor code; repoint
   `updateSafetySensors`/`drawSafetySensors` at them; confirm no visual regression.
4. **canvas-render.ts**: `drawSirens` (wall plate + lens + strobe flash + `drawBeaconRings`
   call), wire into `drawAll` gated `on(L.sensors)`.
5. **canvas-hit.ts**: `hitSiren`.
6. **canvas-interact.ts**: `siren` tool — place/drag/delete/cursor, call `snapSirenToWall`
   on drop + move-release.
7. **sidebar.ts**: `TOOLS` entry, `_section('sirens', …)` with entity picker (siren+switch
   domains), tone/volume/duration inputs gated on `supported_features`, height, label,
   lock, Test button.
8. **three-renderer.ts**: `_sirenGroup` (declare/add/clear/destroy/layer-visibility/raycast
   list), `updateSirens(items, stateProvider)` builder (box + lens + idle/alarm states +
   `_beaconPulse3D` call), raycast `userData.kind='siren'` handling in the click walker.
9. **three-view.ts**: `_keySirens` dirty key (configRev + siren states), fold "any siren
   alarming" into the existing force-rebuild-while-alarming boolean (alongside safety
   sensors), call `updateSirens` when the key changes.
10. **planner.ts**: `Planner.triggerSiren`, `_isSlowEntity` addition, `repairFloor`/
    `defaultFloor` backfill for `sirens: []`.
11. **Click wiring**: 2D click-vs-drag handler + kiosk branch, 3D raycast handler, both
    call `triggerSiren`/`toggleItem` per the bound/unbound + domain rules in §4.4.
12. **Test page**: a `sirens-test.html` smoke test (feature-flag gating logic, tone-list
    parsing, wall-snap math) mirroring the existing `robot-test.html`/`covers-test.html`
    pattern, if the project's convention of deterministic test pages is to be followed for
    this feature too.

## 6. Potential additional features

- **Duration-based auto-revert visual**: since HA doesn't echo "still playing," Diorama
  could locally time out its own strobe animation `duration` seconds after a `turn_on`
  call (optimistic UI) even though the entity's actual `state` attribute is the real
  source of truth for on/off — cosmetic only, must not desync from real state.
  **Simplification-during-review flag: possibly redundant if `state` already flips to
  `off` at the same time** — confirm expected device behavior before adding a duplicate
  local timer (worth deciding at implementation time, not baking in speculatively).
- **Panic-button style quick-trigger**: a topbar/kiosk one-tap "Test siren" affordance for
  the closest/primary siren, useful in kiosk mode for a physical wall-tablet panic button
  use case (already has precedent in the alarm-panel Disarm/Arm buttons + doorbell design
  language).
- **Multi-siren "activate all"**: bulk trigger every bound siren on the floor/property (a
  natural pairing with the existing `AlarmPanel` triggered-state — auto-fire all sirens
  when `alarm_control_panel.*` enters `triggered`, as a Diorama-side convenience
  automation-like behavior; note this duplicates what HA automations already do server-
  side, so scope carefully — likely NOT worth building, flag as an open question).
- **Outdoor/yard siren variant**: reuse the new `outdoor` furniture category precedent
  (weatherproof housing tint, mounted under an eave) for exterior sirens, distinguishing
  them visually from indoor units.
- **Volume-driven beacon intensity**: scale the shared beacon primitive's ring
  count/speed/radius by the fixture's configured `volume` (0–1) for a subtle "louder siren
  = bigger pulse" visual cue — cheap, uses a parameter the primitive already accepts.
- **Tone glyph/label chip**: show the selected tone name as a small chip near the fixture
  while alarming (since HA won't confirm what's *actually* playing, label it as "requested:
  <tone>" to stay honest rather than implying live confirmation).

## 7. Open questions & risks

- **ZHA parity unresolved**: at research time, ZHA siren/strobe control still runs through
  the bespoke `zha.warning_device_warn` action with a different parameter set (loudness
  0–3, warning mode, strobe duty cycle/intensity) rather than generic `siren.turn_on`.
  Verify current ZHA behavior before implementation — if it has migrated to the standard
  siren platform, the special-case binding path in §2.4 can be dropped; if not, decide
  whether Diorama supports ZHA sirens at all in v1 (recommend: v1 supports `siren.*` +
  `switch.*` only, ZHA IAS-only devices are a documented gap / future work).
- **ESPHome native siren support was not conclusively verified** in this research pass
  (no first-class YAML `siren:` platform found in the component index at research time,
  unlike `binary_sensor`/`number`/`switch`). Given Diorama's ESPHome/LD2450 heritage, this
  is worth a direct confirmation pass (check `esphome.io/components/siren` or the
  component list) before assuming ESPHome devices expose `siren.*` out of the box —
  otherwise plan on `switch.*`-only support for ESPHome-based DIY sirens.
- **No live "currently playing" signal** (§2.3) is a hard HA limitation, not a Diorama
  gap — do not scope a feature that assumes it can read back the active tone.
- **Aeotec Siren 6's "8 stored sounds as separate scenes/entities"** device model (rather
  than one entity with a dynamic tone list) suggests some Z-Wave sirens will show up in HA
  as **multiple discrete on/off-style entities**, not one rich `siren.*` with
  `available_tones`. Diorama's binding UX should tolerate a user binding to whichever
  specific entity represents "the alarm tone I want this fixture to trigger," rather than
  assuming every device cleanly exposes the full tone list.
- **Tuya siren `volume` key rejected on some models** (tuya-local issue #2980) — a
  concrete example that `supported_features`-gated params can still fail silently or
  loudly depending on firmware; Diorama's `turn_on` call should be wrapped fire-and-forget
  (matching the rest of the codebase's service-call error handling) so a rejected param
  doesn't break the click handler.
- **Wall-mount vs. ceiling-mount default**: this doc recommends wall-snap (matching most
  consumer siren hardware + NFPA horn/strobe convention), diverging from the ceiling-puck
  convention used for smoke/CO/gas. Confirm this matches user expectation before building
  — a "ceiling mode" toggle could be added cheaply if some real devices are ceiling-mounted
  (fire-alarm horn/strobes technically CAN be ceiling-mounted per NFPA when wall mounting
  isn't feasible), but defaulting to wall keeps parity with the switch/floodlight/alarm-
  panel fixtures already in the codebase.
- **Icon/glyph collision**: pick a tool glyph clearly distinct from the existing 🚨 (alarm
  panel) and 🔔 (doorbell) — both already carry alarm/notification connotations in the
  Diorama UI and could be confused with a third similar-looking icon.

## 8. Sources

- [Siren entity — Home Assistant Developer Docs](https://developers.home-assistant.io/docs/core/entity/siren/)
- [Siren integration — Home Assistant](https://www.home-assistant.io/integrations/siren/)
- [MQTT Siren — Home Assistant](https://www.home-assistant.io/integrations/siren.mqtt/)
- [`homeassistant/components/siren/__init__.py` — home-assistant/core](https://github.com/home-assistant/core/blob/master/homeassistant/components/siren/__init__.py)
- [`homeassistant/components/siren/const.py` — home-assistant/core](https://github.com/home-assistant/core/blob/master/homeassistant/components/siren/const.py)
- [`zha.warning_device_warn` action — Home Assistant](https://www.home-assistant.io/actions/zha.warning_device_warn/)
- [ZHA integration — Home Assistant](https://www.home-assistant.io/integrations/zha/)
- [ZHA siren and warning device support, PR #26046 — home-assistant/core](https://github.com/home-assistant/core/pull/26046)
- [Add siren entity for IAS warning devices, PR #31000 — Koenkk/zigbee2mqtt](https://github.com/Koenkk/zigbee2mqtt/pull/31000)
- [ZHA feature request: siren entity platform for Zigbee sirens/doorbells/chimes — HA community](https://community.home-assistant.io/t/zha-integration-to-use-siren-entity-platform-for-zigbee-sirens-doorbells-and-chimes/343075)
- [tuya-local issue #2980 — `volume` key rejected on `siren.turn_on`](https://github.com/make-all/tuya-local/issues/2980)
- [Aeotec Siren 6 product page — Aeotec](https://aeotec.com/products/aeotec-siren-6/)
- [Aeotec Siren 6 — Home Assistant automation guide — Aeotec Help Desk](https://aeotec.freshdesk.com/support/solutions/articles/6000252836-how-to-automate-siren-6-in-home-assistant)
- [Ring Alarm Outdoor Siren — Lowe's product listing (dimensions)](https://www.lowes.com/pd/Ring-Ring-Alarm-Outdoor-Siren/5001836873)
- [Ring Alarm Outdoor Siren review & specs — smarthomecompared.com](https://smarthomecompared.com/sirens/ring-alarm-outdoor-siren)
- [Fire Alarm Strobe NFPA 72 height requirements — ECMag](https://www.ecmag.com/magazine/articles/article-detail/integrated-systems-strobe-code-compliance-101-visible-appliance-requirements)
- [Wall-Mounted Bells: NFPA 72 mounting height rules — QRFS blog](https://blog.qrfs.com/56-fire-alarm-bell-mounting-height/)
- Diorama repo source read directly: `src/types.ts` (`SafetySensor`, `AlarmPanel`,
  `TransientPulse`), `src/geometry.ts` (`SAFETY_DEFAULTS`, `safetyColor`, `safetyGlyph`),
  `src/canvas-render.ts` (`drawSafetySensors`), `src/three-renderer.ts`
  (`updateSafetySensors`), `src/planner.ts` (`_isSlowEntity`), `src/ha-client.ts`
  (`HaApi.callService`).
