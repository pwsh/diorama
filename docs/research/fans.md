# Fans (ceiling & standalone) — build-ready research

Status quo check (read this first): Diorama **already ships a partial ceiling
fan**. `LightIconKind` includes `'fan'` (blades, no light) and `'fan_light'`
(blades + center globe) with a `Light.fanEntity?: string | null` bind (`types.ts`
~L114-145). The 3D builder (`three-renderer.ts` `_buildFixtureFor`-style switch,
case `'fan'`/`'fan_light'`, ~L6147-6192) draws a downrod + hub + 4-blade rotor
and spins it via a persistent `_fanRotors` array (`{obj, rps}`) advanced every
frame in `_animate` (~L9809-9816) from `performance.now()`, decoupled from
scene rebuilds so spin phase never jumps. Rotor speed (`rps`) is read from
`fan.*` `percentage` attribute at **build time only** — `three-view.ts`'s
`keyLights` (~L888-898) folds `fanSt.state` + `fanA.percentage` into the dirty
key, so a percentage change triggers a full lights-group rebuild (cheap: few
lights) rather than a per-frame read. Sidebar has a "Fan entity" bind row
(`ui/sidebar.ts` ~L3179-3198, domain `'fan'` entity picker) but **no percentage
slider, no oscillate toggle, no direction control, no preset-mode picker** —
today it's spin-rate-only, and the 2D plan view shows nothing but a static
glyph (`❋`/`✺` in `LIGHT_GLYPH`, `canvas-render.ts` L37/2543 — no rotation, no
oscillation sweep). There is **no standalone pedestal/tower fan** anywhere
(not a `FurnitureKind`, no furniture entry) — every existing fan is anchored to
a ceiling `Light` fixture.

This document specs out **closing that gap**: full fan control (percentage,
oscillate, direction, preset_mode) on the existing ceiling fan light-kit, plus
a **new standalone fan `FurnitureKind`** (pedestal/tower) for the fan-only case
with no light.

## 1. Summary

A fan is a small, high-value spatial fixture: it's mounted in a specific room,
its ON/OFF + speed is genuinely useful to see at a glance next to the
thermostat/lights, and its **oscillation + spin** give Diorama's Sims-toon 3D
view an easy, satisfying idle animation — exactly the kind of "the house feels
alive" detail the renderer already invests in (flickering fireplaces, breathing
blinds, spinning fan blades). It also closes an oddity: Diorama already half-
built ceiling-fan support (spin rate) but never wired the rest of the `fan`
domain (oscillate, direction, preset, and any 2D representation at all), and
there is no floor-standing fan option even though it's one of the most common
"HA-controlled small appliance" entities people actually own.

Fits the architecture cleanly: `fan.*` is a small, fully-synchronous domain
(6 services, ~7 attributes, no history/forecast/network dependency) — a
same-day canvas-fixture-recipe job for the standalone fan, and a **surgical
addition** (no new fixture type, just wire up `fanEntity` further) for the
ceiling case.

## 2. Home Assistant data model

### Domain: `fan` (core, `homeassistant.components.fan`)

`fan` is a **building-block domain** — no direct "Fan" integration exists to
add; entities come from device integrations (Zigbee/Z-Wave/Tuya/ESPHome/MQTT/
Template/etc. — see "Integrations & fragmentation" below). Confirmed at
[developers.home-assistant.io/docs/core/entity/fan](https://developers.home-assistant.io/docs/core/entity/fan/)
and [home-assistant.io/integrations/fan](https://www.home-assistant.io/integrations/fan/).

**States**: `on` / `off` / `unavailable` / `unknown`.

**Attributes** (all optional — presence depends on `supported_features`):

| Attribute | Type | Notes |
|---|---|---|
| `percentage` | `int \| None`, 0–100 | Current speed as %, default 0. THE value to drive blade spin rate / RPM. |
| `percentage_step` | `float` | Step size for `increase_speed`/`decrease_speed`; `= 100 / speed_count`. E.g. a 3-speed fan → step ≈ 33.3. |
| `preset_mode` | `str \| None` | Active named preset (e.g. `"auto"`, `"sleep"`, `"eco"`, `"whoosh"` — free-form per integration) or `None`. |
| `preset_modes` | `list[str] \| None` | Fan's full preset vocabulary. Per HA convention, **preset modes are NOT a subset of speeds** — engaging a preset can leave `percentage` stale/irrelevant. |
| `oscillating` | `bool \| None` | True while sweeping. |
| `direction` | `str \| None` | Exactly two values: `"forward"` / `"reverse"` (`DIRECTION_FORWARD`/`DIRECTION_REVERSE` constants). **No compass/airflow-angle data exists anywhere in the domain** — this is motor rotation direction (useful in winter for ceiling fans to push warm air back down), not an aim/sweep-angle attribute. |
| `speed_count` | `int` | Entity property (not always surfaced as a bare WS attribute the same way `percentage` is, but discoverable via `percentage_step` back-calculation: `speed_count = round(100/percentage_step)`) — number of discrete speed levels. Default 100 (i.e. fully continuous %). |
| `supported_features` | `int` bitmask | See `FanEntityFeature` below. Standard on every HA entity's attributes. |

**`FanEntityFeature` bitmask** (`homeassistant/components/fan/__init__.py`, `IntFlag`):

```
SET_SPEED    = 1   # percentage / increase_speed / decrease_speed
OSCILLATE    = 2   # oscillate service valid
DIRECTION    = 4   # set_direction service valid
PRESET_MODE  = 8   # set_preset_mode / preset_modes valid
TURN_OFF     = 16
TURN_ON      = 32  # turn_on requires TURN_ON *and* TURN_OFF both set to be exposed as a real toggle
```
Read `supported_features` before offering a control in the UI — e.g. don't
show an oscillate toggle for a fan lacking bit `2`.

**Services / actions** (docs under `home-assistant.io/actions/fan.<name>/`,
e.g. confirmed at [fan.oscillate](https://www.home-assistant.io/actions/fan.oscillate/)):

| Service | Fields | Guard feature |
|---|---|---|
| `fan.turn_on` | `percentage?` (0-100), `preset_mode?` | `TURN_ON` |
| `fan.turn_off` | — | `TURN_OFF` |
| `fan.toggle` | — | — (works on any fan entity) |
| `fan.set_percentage` | `percentage` (0-100, **required**) | `SET_SPEED` |
| `fan.increase_speed` | `percentage_step?` (0-100, optional override) | `SET_SPEED` |
| `fan.decrease_speed` | `percentage_step?` (0-100, optional override) | `SET_SPEED` |
| `fan.oscillate` | `oscillating` (bool, **required**) — does NOT turn the fan on/off by itself | `OSCILLATE` |
| `fan.set_direction` | `direction` (`"forward"` \| `"reverse"`, **required**) | `DIRECTION` |
| `fan.set_preset_mode` | `preset_mode` (string, **required**, must be in `preset_modes`) | `PRESET_MODE` |

All are ordinary `call_service` WS calls — no long-polling / forecast-style
plumbing needed (unlike weather). Everything here is available over the plain
HA WebSocket API used by `state_changed` (~10 Hz push) + `call_service`; there
is **nothing fan-related that is unavailable over WS** — no separate REST-only
surface, no companion-app requirement (contrast with the geo-calibration
Android notify flow). One caveat: `speed_count` and native RPM are NOT
exposed; only the abstracted 0-100 `percentage`, so exact real RPM can never be
derived — only relative speed.

### Integrations & fragmentation (core vs custom)

`fan` entities are produced by many independent integrations — no single
canonical "the fan integration." Relevant ones:

- **ESPHome** (already Diorama's LD2450 firmware ecosystem) — `fan:` platform
  types `speed_fan` / `binary` / `hbridge` / `template` / `tuya` fan; ESPHome
  fans natively support `direction`, `oscillating`, `speed`/`percentage`, and
  `preset_mode` (`set_preset_mode()`/`has_preset_mode()` in lambdas). See
  [esphome.io/components/fan](https://esphome.io/components/fan/).
- **Zigbee (ZHA / Zigbee2MQTT)** and **Z-Wave** — most ceiling-fan controllers
  (e.g. Hampton Bay/Hunter via Zigbee retrofit, GE/Jasco Z-Wave fan switches)
  expose `percentage` in 3-4 discrete steps (so `percentage_step` is coarse:
  25/33/50), often WITHOUT `direction` or `oscillate` (those need the
  fan's own RF remote/wall control, not exposed to Zigbee).
  Ceiling fans overwhelmingly do NOT support oscillation (fixed mount);
  standalone fans DO but the specific integration must expose `OSCILLATE`.
- **Tuya / Smart Life fans** (many pedestal/tower fan brands white-label
  Tuya) — commonly exposes `percentage`, `oscillating`, `preset_mode` (natural
  wind / sleep modes), sometimes `direction` is absent entirely.
- **MQTT Fan** (`fan.mqtt`, core but user-configured) and **Template Fan**
  (`fan.template`) — fully DIY, so `supported_features` varies per user config.
- Because of this fragmentation, **Diorama must feature-detect from
  `supported_features` per entity** rather than assume every capability
  exists — never hard-require oscillate/direction/preset UI.

## 3. Real-world / visual reference

### Ceiling fan (already the `fan`/`fan_light` `LightIconKind`)

- Blade span ("size"): common residential sizes 42″ (1067 mm), 44″ (1118 mm),
  52″ (1321 mm, most common for 12×12–18×18 ft rooms), 56″ (1422 mm), 60″
  (1524 mm) — [Hunter Fan sizing guide](https://www.hunterfan.com/pages/shop-by-ceiling-fan-size),
  [ceiling fan size guide](https://www.lightsonline.com/blog/guides/the-complete-ceiling-fan-sizing-guide/).
  Diorama's existing 3D build uses a 620 mm blade half-length (≈ 1240 mm / 49″
  span) — reasonable mid-size default, could be parametrized off a new
  `Light.fanSize` mm field later.
  Diorama's existing 3D build uses a 620 mm blade half-length (620 mm from hub
  center to tip; ≈1420 mm full span) — reasonable mid-size default.
- Downrod: standard mount ships 3–5″ (76–127 mm); taller-ceiling downrods run
  4.5″/6″/12″/18″/24″/36″/48″/60″/72″ (114–1830 mm) so blades sit 7–9 ft
  (2130–2740 mm) off the floor — [downrod size guide](https://arranmorelighting.com/blogs/news/ceiling-fan-downrod-size-guide).
  Existing code hardcodes rod height 260 mm + hub at fixture height — fine as
  a stylized default; not worth over-engineering per-ceiling-height downrods.
- Motor hub: roughly Ø260–300 mm × 150–200 mm tall canister below the downrod.
- Typical real speeds: 3–6 discrete steps (low/med/high, sometimes +winter
  reverse); modern DC-motor fans go up to 6 speeds + a "breeze"/natural-wind
  preset. RPM ranges ~140–220 RPM long-throw; percent-based control is the
  correct abstraction (never assume 1:1 with real RPM).
- Blade color: commonly wood-tone (walnut/oak — matches existing `0x5d4037`
  brown), white, black, or matte bronze — worth a color pick, not urgent.

### Standalone fans (NEW — pedestal & tower)

- **Pedestal fan**: round guarded fan head (12–24″ / 305–610 mm diameter,
  most commonly 16–20″/406–508 mm) atop an adjustable vertical pole, on a
  wide flat cross/round base (≈ 380–510 mm diameter) for tip-resistance.
  Overall height ~40–55″ (1000–1400 mm), adjustable via telescoping pole.
  Oscillates left-right on a base motor (~70–90° sweep), tilt head up/down
  manually (not HA-controlled). [Pedestal fan dimensions](https://unfoldstuffs.com/how-to-measure-pedestal-fan-size/350/).
- **Tower fan**: slim vertical column, base diameter ~200–230 mm (much
  slimmer footprint than pedestal), height typically 900–1200 mm (30–48″),
  bladeless-looking (internal blades hidden by a vertical grille), oscillates
  by rotating the whole column ~60–90°. [Tower vs pedestal](https://www.techradar.com/home/air-quality/pedestal-fan-vs-tower-fan).
- Common colors: white/black/grey plastic housing, occasionally brushed
  metal (premium tower fans, e.g. Dyson bladeless — a distinct loop-amp
  visual worth a future `iconKind` variant but out of scope for v1).

## 4. Diorama visualization & animation design

### A. Ceiling fan (extend the EXISTING `fan`/`fan_light` Light fixture — no new type)

**Data model additions** (`types.ts`, on `Light`, all optional so existing
saved plans are unaffected):
- No new persisted fields strictly required — `direction`/`oscillating`/
  `preset_mode` are read live off `l.fanEntity` (or `entity_id` fallback)
  via `Planner.effectiveState`-style resolution, same pattern as `percentage`
  today. Add `Light.localState` reuse is already present for on/off; for a
  fan-only (unbound) fixture, treat `localState` as driving a synthetic
  `percentage` of 100 when `'on'` (already implemented) — no change needed.
- Optional: `Light.fanPreset?: string` is NOT needed client-side (preset is
  entity-state-derived, display-only unless we add a click-to-cycle preset
  control — see integration steps).

**3D** (`three-renderer.ts`, extend the existing `case 'fan': case 'fan_light':` block):
- **Blade pitch flips visually on reverse**: when `direction === 'reverse'`,
  negate `blade.rotation.x` pitch (or spin `rotor.rotation.y` with negative
  `rps`) — cheap, correct, and legible ("winter mode" fans visibly reverse).
  Store signed `rps` in `_fanRotors` (`rps = pct/100 * (direction==='reverse'?-1:1)`)
  instead of the current `Math.max(0, …)` clamp-to-positive.
  Bump the actual rev/s ceiling too — the current `Math.min(1, pct/100)` caps
  at 1 rev/s (60 RPM) which reads as sluggish next to a real ~140-220 RPM fan;
  consider `pct/100 * MAX_RPS` with `MAX_RPS ≈ 2.5–3` for a punchier top speed.
- **Oscillation**: wrap the existing `rotor`'s parent hub in an additional
  yaw-oscillation applied to the WHOLE fixture group `g` (not just the
  spinning rotor) — a slow ±25-30° sinusoidal yaw sweep
  (`g.rotation.y = baseYaw + Math.sin(t * OSC_HZ) * OSC_AMP`) driven from the
  same per-frame `_animate` block as the rotor spin, gated on
  `oscillating === true`. Needs a tiny bit of new per-instance state (a
  `{obj, baseYaw}` alongside the existing `_fanRotors` array, e.g.
  `_fanOscillators: {obj: THREE.Object3D; baseYaw: number}[]`) since the whole
  fixture group (not the rotor child) must rotate for oscillation to look
  right (the downrod stays vertical; only the yaw of the whole assembly
  sweeps — in practice apply the sweep to the `hub`+`rotor` sub-group, not
  the downrod mesh, so the rod doesn't visibly twist).
- **Preset mode**: no dedicated visual — folding `preset_mode` into a small
  camera-facing text sprite (like the existing env-sensor/oven-temp sprite
  idiom, `_makeTextSprite`) showing the preset name when set is a nice-to-have,
  not required for v1.

**2D** (`canvas-render.ts`, the light-glyph draw path around L2543):
- Today it's a static glyph — **animate blade rotation** by drawing a small
  spinning "+" or 4-blade glyph procedurally (rotate a canvas transform by
  `(performance.now()/1000 * rps * 2π) % 2π` before drawing 4 short blade
  strokes) instead of (or centered inside) the static emoji, when `fanEntity`
  (or entity) state is `'on'`. This is the FIRST animated glyph in the light
  layer — keep it cheap (a few `ctx.save/rotate/restore` + line draws), same
  RAF the rest of 2D already runs on.
- Direction: mirror the spin direction of the glyph animation (cosmetic, low
  priority — most users won't notice on a small 2D icon).
- Oscillation: optional — a faint dashed sweep-arc under the glyph while
  `oscillating` is true, matching the visual language of motion-sensor FOV
  wedges (`drawAll`'s existing wedge-drawing helpers).

**Dirty key**: `three-view.ts`'s `keyLights` (~L888-898) already includes
`fanSt?.state` and `fanA.percentage` — extend the folded fan-state string to
ALSO include `fanA.direction` and `fanA.oscillating` (e.g.
`` `~${a.percentage ?? ''}~${fanSt?.state ?? ''}:${fanA.percentage ?? ''}:${fanA.direction ?? ''}:${fanA.oscillating ?? ''}` ``)
so a direction flip or oscillate toggle triggers the rebuild that seeds the
new signed-rps / oscillator entries. Oscillation SWEEP motion itself, like
blade spin, must NOT be dirty-keyed — it's a per-frame `_animate` mutation of
a persistent object, exactly like the existing rotor spin and the fireplace
flicker.

**Sidebar** (`ui/sidebar.ts`, extend the existing fan-entity bind block
~L3179-3198): show live `percentage` / `direction` / `oscillating` /
`preset_mode` readouts (dim text, matching the existing env-sensor reading
style) plus action buttons: a percentage slider (`fan.set_percentage`), an
oscillate checkbox (`fan.oscillate`), a direction toggle button
(`fan.set_direction`), and (if `preset_modes` non-empty) a preset dropdown
(`fan.set_preset_mode`) — all gated on the entity's live `supported_features`
bitmask (feature-detect, per integration fragmentation above) so an
unsupporting fan (e.g. a basic 3-speed Zigbee ceiling fan with no oscillate)
doesn't show dead controls.

**Click behavior**: clicking the fixture in 2D/3D should `Planner.toggleItem`
(existing `fan.toggle`/`homeassistant.toggle` dispatch via `toggleEntity`,
already generic-domain-aware) — no new click-path code needed, this already
works since `toggleEntity` derives the domain from `entity_id`. Only the
percentage/oscillate/direction/preset controls need new sidebar wiring +
new `Planner` action methods (see integration steps).

### B. Standalone pedestal/tower fan (NEW `FurnitureKind`)

Follows the canvas-fixture recipe exactly (furniture variant, since it's a
freestanding object, not a wall/ceiling fixture like Light):

- **`types.ts`**: add `'pedestal_fan' | 'tower_fan'` to `FurnitureKind`. Reuse
  the EXISTING `Furniture.entity_id` (bind `fan.*`) + `Furniture.localState`
  (unbound on/off) — no new per-instance fields needed for basic on/off +
  spin. For oscillate/direction/preset control on a furniture piece, add
  optional `Furniture.fanEntity?: string | null` mirroring `Light.fanEntity`
  (in case the piece is bound to something else, e.g. media_player for a
  "smart fan with speaker" novelty — unlikely but keep the same indirection
  pattern used on `Light` for consistency; realistically `entity_id` alone
  suffices for a plain fan and `fanEntity` can be skipped for furniture v1).
- **`geometry.ts` `FURNITURE_KINDS`**: 
  - `pedestal_fan: { label: 'Pedestal fan', w: 460, h: 460, ht: 1300, back: 'none', color: 0xe8e8e8, cat: 'furniture', frontArrow: false }`
    (round footprint approximated as a square box footprint like other round
    kinds — matches existing convention, e.g. `bird_bath`/`fountain` use
    square `w×h` footprints for round objects).
  - `tower_fan: { label: 'Tower fan', w: 230, h: 230, ht: 1050, back: 'none', color: 0x2b2f33, cat: 'furniture', frontArrow: false }`.
  - Both `frontArrow: false` (symmetric, no functional "front" side to call out).
- **`canvas-render.ts` `drawFurniturePrimitive`**: pedestal fan draws as a
  round base disc + thin pole line + round head circle; tower fan draws as a
  tall rounded rect. Both get a subtle rotating "spoke" tick mark (mirrors the
  ceiling-fan glyph-spin idea above) when the bound/local state is on, and (if
  oscillating) a faint left-right sweep arc.
- **`three-renderer.ts` `_buildFurniture`**: new `case 'pedestal_fan':` /
  `case 'tower_fan':` — pedestal: base disc + vertical pole + fan-head disc
  with the SAME 4-blade rotor-in-a-group technique already used for ceiling
  fans (reuse a small shared helper if convenient — e.g. factor the existing
  ceiling-fan rotor-building loop at three-renderer.ts ~L6162-6174 into a
  `_buildFanRotor(bladeLen, bladeMat)` helper called from both the light-kind
  switch and the new furniture switch, to avoid duplicating the 4-blade
  loop). Tower fan: tall rounded box with a thin vertical grille texture (no
  visible blades — bladeless housing look) — spin cue instead via a subtle
  vertical light-band shimmer or just rely on the base glow, since real tower
  fans hide their blades. Push the rotor/oscillator objects into the SAME
  `_fanRotors` / `_fanOscillators` arrays used by the ceiling-fan path so the
  per-frame `_animate` spin/sweep code is shared, not duplicated.
- Both furniture builds get a **blob shadow** (standard, not in the
  rugs/stairs/elevated exemption list) and **outline shells** (standard
  furniture treatment) per the Sims-toon conventions.
- **`canvas-hit.ts`**: standard furniture hit test — no new code, furniture
  hit-testing is generic by footprint already.
- **`canvas-interact.ts`**: standard furniture drag/place/delete — no new
  code needed, it's generic furniture.
- **Sidebar**: appears automatically in the Furniture section's kind
  dropdown (`Object.keys(FURNITURE_KINDS)` is already enumerated
  automatically per the furniture-kind gotcha note) — just needs the same
  bind-entity / percentage / oscillate / direction / preset controls as the
  ceiling fan (share a `_fanControlsBlock(item, fanEntityId)` sidebar helper
  between the Light and Furniture editors to avoid duplicating the UI).
- **Layer**: rides the existing `furniture` 2D/3D layer (non-appliance
  category) — NOT the `appliances` layer, matching how other small-appliance-
  ish-but-not-kitchen items (e.g. `exercise_equipment`) are categorized
  `cat: 'furniture'`. (Could argue for `cat: 'appliance'` instead, since a fan
  is nominally an appliance and that would also fold it into the existing
  appliance-state hash / in-use LED glow convention for free — see open
  question below.)

### Dirty-key summary

| Rebuild trigger | Where |
|---|---|
| Fan `percentage`/`direction`/`oscillating` change (ceiling) | extend `three-view.ts` `keyLights` fold |
| Fan `percentage`/`direction`/`oscillating` change (furniture) | extend `three-view.ts`'s furniture appliance-state hash (`_keyFloor` 5th-param `stateProvider` path) OR give furniture fans their own small hash term alongside `_tvsByRoom`-style plumbing — simplest: treat like the existing appliance-state hash (already folds "each appliance's effective state" into `_keyFloor`) and extend it to also read `fan.*` percentage/direction/oscillating for furniture with `entity_id` in the fan domain |
| Blade spin (rps) | per-frame `_animate`, NOT dirty-keyed (existing pattern) |
| Oscillation sweep angle | per-frame `_animate`, NOT dirty-keyed (new, same pattern) |

### `_isSlowEntity` routing

`fan.*` entities should be **live-path** (like most non-`number.`/`switch.`
domains) — `percentage` changes are exactly the kind of frequent, purely-
visual update the `live` channel exists for (blade rps updates), and nothing
about a fan is structural enough to need the `config` channel. No change to
`_isSlowEntity` needed (it already defaults everything outside `number.*`/
`switch.*` to live-only) — BUT because the *dirty key* fold above lives in
`three-view.ts`'s `_tickOnce` (which reads `states` every tick regardless of
which HA channel fired), this "just works" without touching `_isSlowEntity` at
all. Only add fan entity ids there if a future revision wants sidebar-only
(non-canvas) live percentage readouts to re-render on the `config` channel
too — not necessary for v1 since the sidebar fan block can read
`p.effectiveState`/live state directly off `hass.states` each Lit render
(already how e.g. env-sensor readings refresh without slow-path enrollment,
verify: actually env entities like `sensor.*` for EnvSensor readings likely
DO ride `_isSlowEntity`'s slow path per the shipped-features summary,
so mirror that: **add fan entity ids to `_isSlowEntity`'s domain check**
(alongside `number.*`/`switch.*`) so the sidebar's percentage/oscillate/
direction/preset display refreshes promptly via the `config` channel without
waiting on unrelated canvas repaints). This is a one-line addition to
`Planner._isSlowEntity`.

## 5. Integration steps

### Ceiling fan (extend existing fixture — smaller job)
1. `three-renderer.ts`: change `_fanRotors` entries to carry **signed** `rps`
   (negative for `direction === 'reverse'`); read `direction` off `spinSt`/
   `fanSt.attributes.direction` next to the existing `percentage` read.
   Raise the rev/s ceiling constant for a livelier top speed.
2. Add a parallel `_fanOscillators: {obj, baseYaw}[]` array; in the same
   `case 'fan'/'fan_light'` builder push an entry when
   `fanA.oscillating === true`, applied to the hub+rotor sub-group (not the
   downrod). Advance it in `_animate` beside the existing rotor-spin block
   (~L9809-9816).
3. `three-view.ts`: extend `keyLights`'s per-fan-entity fold string to include
   `direction` + `oscillating` so state flips rebuild (seeding new signed rps
   / oscillator entries); `_fanRotors`/`_fanOscillators` themselves stay
   rebuilt-fresh each time like today (`this._fanRotors = []` reset pattern
   at ~L1494/5903 already exists — mirror for the new array).
4. `canvas-render.ts`: animate the fan glyph rotation (canvas rotate before
   drawing blade strokes) when on; optional oscillate sweep-arc.
5. `planner.ts`: add thin action methods — `setFanPercentage(fanId, pct)`,
   `toggleFanOscillate(fanId)`, `toggleFanDirection(fanId)`,
   `setFanPreset(fanId, mode)` — each resolving the bound `fan.*` entity id
   (`l.fanEntity ?? l.entity_id`) and calling the matching `call_service`
   (`fan.set_percentage` / `fan.oscillate` / `fan.set_direction` /
   `fan.set_preset_mode`) via the existing `HaApi` service-call plumbing (no
   new `HaApi` method needed — these are all vanilla `call_service`, unlike
   `getWeatherForecasts`/`getHistory` which needed bespoke WS commands).
6. `ui/sidebar.ts`: extend the existing fan-entity bind block (~L3179-3198)
   with live-state readouts + percentage slider / oscillate checkbox /
   direction button / preset dropdown, each gated on the entity's
   `supported_features` bit (read via `hass.states[id].attributes.supported_features`).
7. `planner.ts` `_isSlowEntity`: add the fan entity id (whichever of
   `fanEntity`/`entity_id` is bound) to the slow-path check so the new
   sidebar readouts refresh via the `config` channel.
8. Typecheck + build; smoke-test with a demo/template fan entity (HA's
   `demo` integration ships `fan.living_room_fan` with oscillate + preset
   modes — good for manual QA without real hardware).

### Standalone pedestal/tower fan (new FurnitureKind — full recipe)
1. `types.ts`: add `'pedestal_fan' | 'tower_fan'` to `FurnitureKind`.
2. `geometry.ts`: add both to `FURNITURE_KINDS` with dims from §3 above,
   `cat` decision resolved (see open question — default to `'furniture'`
   unless the appliance-glow behavior is wanted, then `'appliance'`).
3. `canvas-render.ts` `drawFurniturePrimitive`: add draw cases (base+pole+
   head disc / tall rounded column) + spin-tick / oscillate-arc when on.
4. `three-renderer.ts` `_buildFurniture`: add build cases; factor the
   existing ceiling-fan rotor loop into a shared `_buildFanRotor()` helper
   used by both the Light-kind switch and this new Furniture-kind switch;
   push into the shared `_fanRotors`/`_fanOscillators` arrays.
5. `canvas-hit.ts` / `canvas-interact.ts`: no changes — generic furniture
   footprint hit-test + drag/place/delete already cover any new
   `FurnitureKind`.
6. `ui/sidebar.ts`: furniture kind dropdown auto-lists the new kinds
   (enumerates `Object.keys(FURNITURE_KINDS)`); add a shared
   `_fanControlsBlock()` helper (percentage/oscillate/direction/preset) and
   call it from both the Light editor (fan/fan_light kind) and the Furniture
   editor (pedestal_fan/tower_fan kind) to avoid duplicating the control UI.
7. `three-view.ts`: fold furniture-bound `fan.*` state (percentage/direction/
   oscillating) into the existing appliance-state hash feeding `_keyFloor`
   (same idiom as TV/washer state already documented in "Device-state
   bindings on structural items").
8. `planner.ts` `_isSlowEntity`: same fan-entity-id addition as above (shared
   code path if step 7 of the ceiling-fan list already added a generic "is
   this a fan.* id" check rather than per-fixture-type wiring).
9. Typecheck + build; manual QA drag-place + bind + demo fan entity.

## 6. Potential additional features

- **Thermostat-linked "smart fan mode"**: some HVAC integrations expose a
  fan as part of `climate.*` (`fan_mode` attribute) rather than a standalone
  `fan.*` entity — worth a follow-up note that ceiling/whole-house fans tied
  to a thermostat's fan circulate mode are a DIFFERENT data source
  (`climate.set_fan_mode`) and out of scope for this `fan.*`-domain doc.
- **Air quality / temperature feedback loop cue**: a small "cooling" glow or
  breeze-particle wisp near a running fan when a bound temperature sensor
  is warm — reuses `EnvKinds`' temperature infrastructure and the wind-
  particle system already built for weather FX (`_advanceWeather`'s dust/wind
  drift primitives could be repurposed for a subtle local breeze puff).
- **Fan.set_percentage from a sidebar slider dragging preview live** — like
  the Light color/brightness modal already does for lights, a small
  `<diorama-fan-config>` modal (mirroring `<diorama-light-config>`) could
  give a nicer dedicated percentage/oscillate/direction/preset control
  surface instead of cramming it into the inline sidebar block, opened via
  dblclick like the existing light-config modal pattern.
- **Reverse-direction visual cue beyond blade spin**: a small ↑/↓ arrow chip
  or seasonal tint (winter = warm arrow up, summer = cool arrow down) since
  `direction` is genuinely meaningful for ceiling fans (push warm air down in
  winter) — nice affordance for a feature most users don't know exists.
- **Personality/activity hook**: humanoid rigs standing directly under/in
  front of a running fan could get an idle-fidget variant (hair/clothes sway)
  — probably not worth the complexity for v1, but consistent with the
  existing idle-fidget system's "ambient environmental reactivity" spirit.
- **`percentage_step`-aware +/- buttons**: instead of a free slider, expose
  discrete +/- speed buttons using the entity's own `percentage_step` (via
  `fan.increase_speed`/`fan.decrease_speed` with no explicit override) so a
  3-speed Zigbee ceiling fan snaps through its real 3 steps instead of
  offering a misleadingly continuous slider.

## 7. Open questions & risks

- **Furniture `cat`: `'furniture'` vs `'appliance'`** for the new standalone
  fan kinds — `'appliance'` would fold it into the existing appliance in-use
  LED glow / `powerEntity` glow conventions for free, but appliance category
  also implies things like fridge-door / oven-door semantics that don't
  apply. Recommend `'furniture'` (like `exercise_equipment`) to avoid
  accidentally inheriting appliance-only UI (e.g. don't want a "door sensor"
  field prompt). Needs a decision before implementation.
- **Vendor fragmentation is real**: many ceiling-fan Zigbee/Z-Wave bridges do
  NOT expose `oscillate` or `direction` at all (physical ceiling fans usually
  don't oscillate; direction requires a specific reversing-relay controller).
  The UI must feature-detect via `supported_features` per fixture rather than
  assume full `fan` domain capability — risk of a confusing "control does
  nothing" UI if this is skipped.
- **`preset_mode` vocabulary is fully vendor-defined** (`"auto"`, `"sleep"`,
  `"whoosh"`, `"natural"`, `"eco"` all seen in the wild) — no fixed enum to
  glyph-map cleanly; a plain dropdown of `preset_modes` strings is the only
  safe UI (no bespoke icon-per-preset without over-fitting to specific
  brands).
- **Real RPM is never knowable** — only relative 0-100 `percentage` — so any
  "looks realistic" spin-rate tuning is inherently a stylized approximation,
  not physically accurate; document the chosen `MAX_RPS` constant as a
  tunable, not a derived physical fact.
- **`speed_count`/discrete steps vs continuous slider** — showing a smooth
  0-100 slider for a fan that's actually only 3 discrete internal steps will
  silently round/snap on the backend; consider reading `percentage_step`
  and rendering the slider with that step size (`<input type=range step=...>`)
  to avoid a laggy/confusing UX where intermediate slider positions don't
  visibly change anything.
- **Reusing `Light.fanEntity` pattern for Furniture** — a plain standalone
  fan almost never needs the `entity_id`/`fanEntity` split (that split exists
  on `Light` because a ceiling-fan-with-light-kit has TWO independent HA
  entities: the light and the fan). For furniture-kind fans, `entity_id`
  alone should suffice — don't blindly copy the two-entity indirection
  unless a real "fan with a separate light kit AND its own furniture
  placement" use case shows up (unlikely; that's just the existing Light
  ceiling-fan case).
- **Oscillation sweep angle/speed has no HA-side data** — HA only reports a
  boolean `oscillating`, never the sweep amplitude or cadence. The ±25-30°
  amplitude and sweep-Hz proposed above are pure stylization; safe to
  hardcode as a shared constant (like the existing fireplace flicker
  randomness) rather than something that needs to "match" any real value.
- **Dead end to avoid**: don't try to derive real-world CFM/airflow strength
  visuals (e.g. particle-based wind gusts scaled to `percentage`) as a v1
  feature — it would require reusing/generalizing the weather-FX wind-
  particle system for an indoor fan, which is a bigger lift than this
  feature's value justifies; flagged in §6 as a possible future add, not v1.

## 8. Sources

- [Fan entity — Home Assistant Developer Docs](https://developers.home-assistant.io/docs/core/entity/fan/)
- [Fan — Home Assistant integration docs](https://www.home-assistant.io/integrations/fan/)
- [fan.oscillate — Home Assistant action docs](https://www.home-assistant.io/actions/fan.oscillate/)
- [home-assistant/core `fan/__init__.py`](https://github.com/home-assistant/core/blob/dev/homeassistant/components/fan/__init__.py) (FanEntityFeature bitmask values, ATTR_* constants, DIRECTION_FORWARD/REVERSE)
- [home-assistant/core `fan/services.yaml`](https://raw.githubusercontent.com/home-assistant/core/dev/homeassistant/components/fan/services.yaml) (service field definitions)
- [ESPHome Fan Component](https://esphome.io/components/fan/)
- [Fan entity model speed lists — HA architecture discussion #562](https://github.com/home-assistant/architecture/discussions/562) (percentage_step / speed_count relationship)
- [Hunter Fan — Ceiling Fan Sizes for Any Room](https://www.hunterfan.com/pages/shop-by-ceiling-fan-size)
- [The Complete Ceiling Fan Sizing Guide — LightsOnline](https://www.lightsonline.com/blog/guides/the-complete-ceiling-fan-sizing-guide/)
- [What Size Downrod Do You Need — Arranmore Lighting](https://arranmorelighting.com/blogs/news/ceiling-fan-downrod-size-guide)
- [How to Measure Pedestal Fan Size — Unfold Stuffs](https://unfoldstuffs.com/how-to-measure-pedestal-fan-size/350/)
- [Pedestal fan vs tower fan — TechRadar](https://www.techradar.com/home/air-quality/pedestal-fan-vs-tower-fan)
- Diorama source read directly: `src/types.ts`, `src/geometry.ts`, `src/three-renderer.ts`, `src/ui/three-view.ts`, `src/ui/sidebar.ts`, `src/canvas-render.ts` (line refs above current as of this repo's `main` at commit `628fac4`).
