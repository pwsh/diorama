# Generic Logical-State Indicator Light

Status: research complete, build-ready. No code written yet.

## 1. Summary

A **Logical Indicator** is a placeable fixture whose visual state (color +
effect: solid / flash / pulse / off, and optionally a gradient position) is
driven not by a single HA entity's raw `state`, but by a small **rule
evaluated client-side in Diorama** against one or more live entity states —
e.g. "if `sensor.oven_temp` > 200°F show amber solid; if > 300°F show red
flash; else off," or "if `binary_sensor.front_door` is open **AND**
`alarm_control_panel.home` is armed_away, flash red."

It fits Diorama specifically because:

- **Diorama already has every entity's live state in memory** (`Planner`
  subscribes to `state_changed` at ~10 Hz and keeps a states map in both
  connection modes). A rule engine evaluated against that in-memory map is
  free — no extra WS traffic, no HA-side config.
- HA's own answer to "derived state" is template sensors/lights (YAML or UI
  Studio helpers), which require **server-side configuration outside the
  panel** — the point of this feature is a user builds the logic entirely
  inside the spatial UI, the same way they build zones/rooms/activities today,
  with no `configuration.yaml` edit and no restart.
- It generalizes a pattern Diorama *already* has in a fixed form —
  `ENV_KINDS[kind].warn/danger` two-tier thresholds driving `envColor()` — into
  a **user-authored, multi-entity, N-tier rule** with boolean composition,
  reusable for anything: HVAC status lights, "someone's in the shower" hall
  lamp, "washer done" indicator, water-tank level lamp, network-down beacon,
  a Kubernetes/CI status lamp fed through a `sensor.*` bridge, etc.
- It is a natural pairing with existing fixtures: it can piggyback on a
  `Light`/`SwitchFixture`'s existing render path (an indicator IS a light,
  just with computed rather than HA-reported color/on-off) or exist as its
  own new fixture kind — see §4 for the recommendation (own fixture kind).

## 2. Home Assistant data model

### 2.1 What Diorama reads — no new HA integration required

The rule engine's inputs are **plain HA entity states already flowing through
the existing WebSocket subscription** — no new domain, service, or
integration is needed for the core feature. Every entity Diorama can already
bind to a fixture entity-picker is a valid rule input:

| Domain | Relevant fields | Notes |
|---|---|---|
| `sensor.*` | `state` (string, parse as float for numeric rules), `attributes.unit_of_measurement`, `attributes.device_class` | Core. `unit_of_measurement` is what lets a rule normalize °F vs °C (see 2.3). `state` can be `"unavailable"`/`"unknown"` — rules must treat those as non-numeric / falsy, not `0`. |
| `binary_sensor.*` | `state` = `"on"`/`"off"` | Core. `device_class` (e.g. `problem`, `moisture`, `motion`) doesn't change the state values, only UI icon semantics — irrelevant to WS payload. |
| `light.*` / `switch.*` / `fan.*` / `climate.*` / `media_player.*` / `lock.*` / `alarm_control_panel.*` / `cover.*` / `vacuum.*` | `state` (domain-specific enum) + `attributes` | All already flow through `state_changed`; Diorama's own `HassState` typing (`ha-client.ts`) is generic (`{state, attributes}`), so a rule input is just "any entity_id → its raw HA state envelope," identical to what `Planner.effectiveState` already returns for bound fixtures. |
| `weather.*` | `state` (condition string), `attributes.temperature`, etc. | Diorama already normalizes this via `weather.ts`; a rule could reuse `Planner.weatherNow` as a synthetic extra input (condition/tempC) rather than re-deriving from the raw entity — see §6. |

**Core HA event this rides on:** `state_changed` event
(https://developers.home-assistant.io/docs/api/websocket/ — "Subscribe to
events"). Diorama's `HassClient`/`HassPanelAdapter` already subscribe to this
and maintain a states map; the rule engine is purely a **read-only consumer
of that existing map** evaluated once per RAF tick (2D) / per dirty-key check
(3D) — see §4.

### 2.2 What HA offers server-side (reference only — NOT what we build on)

For contrast/documentation completeness, HA's own built-in ways to compute
"derived state," all of which live **outside** Diorama and are explicitly
**not** what this feature depends on:

- **Template sensor** (`template` integration,
  https://www.home-assistant.io/integrations/template/) — YAML or UI-created
  `sensor`/`binary_sensor`/`light`/etc. whose `state`/attributes are Jinja2
  templates. Trigger-based mode (`trigger:` block) lets it fire off
  automation-style triggers instead of recalculating on every state change.
  This is HA-side config (YAML file or Settings → Helpers UI), requires a
  reload/restart for YAML edits, and produces a **new persistent entity** in
  the registry — the opposite of what we want (in-panel, no HA object
  created). We still mention it because a power user may already have such a
  sensor, and a rule input can trivially point at it (it's just another
  `sensor.*`/`binary_sensor.*`). Known rough edge: a `device_class: enum`
  sensor in trigger-based mode has historically had its `options` attribute
  ignored (home-assistant/core#129123) — not relevant to Diorama's reads,
  but a reason not to lean on that specific combination as a rule input if a
  user is also authoring the upstream template sensor.
- **Template light** (`light.template`, same integration page, "Light"
  section) — computes `state`/`color_mode`/`effect` from templates and
  (crucially) also needs `turn_on`/`turn_off` **action scripts**, because
  it's a real controllable entity, not a read-only computed display.
  Overkill for a display-only spatial indicator.
- **`numeric_state` condition** — the automation engine's `numeric_state`
  condition (`above`/`below`, optional `attribute:`) is the closest
  first-party analog to "threshold rule," documented at
  https://www.home-assistant.io/docs/scripts/conditions/#numeric-state-condition.
  Diorama's rule model (§4) intentionally mirrors this condition shape
  (`above`/`below`/`for` duration) so the mental model transfers, but
  evaluates it client-side instead of installing an HA automation.
- **WebSocket `render_template` command** — a genuinely relevant *optional*
  power path: `{"type": "render_template", "template": "...", "id": N}` lets
  a WS client ask HA to live-evaluate an arbitrary Jinja2 template and push
  updates when its dependencies change (two-phase response: an ack, then
  `event`-type messages carrying the re-rendered result whenever a
  referenced entity changes). Documented at
  https://developers.home-assistant.io/docs/api/websocket/. This would let a
  rule embed a full Jinja2 expression evaluated *by HA* rather than
  re-implemented in TS. **Recommendation: do not depend on this for v1** (see
  §7) — it adds a second live-subscription lifecycle to manage (subscribe/
  unsubscribe per rule, reconnect handling) for something Diorama's own
  comparison operators already cover, and it reintroduces a server-side
  moving part the feature is explicitly trying to avoid. Keep it as a v2
  "escape hatch" for power users who want a raw Jinja expression instead of
  the AND/OR builder.

### 2.3 Unit handling (the "> 200°F" example specifically)

HA normalizes a `sensor.*` with `device_class: temperature` to the user's
configured unit system automatically (Settings → General → Unit System), so
the `state` value already arrives in °C or °F consistently **per the HA
instance's configured units**, and `attributes.unit_of_measurement` tells you
which (`"°C"` or `"°F"`). See
https://developers.home-assistant.io/docs/core/entity/sensor/#unit-conversion.
Diorama already has exactly this normalization problem solved for length
(`Planner.stateMm(entityId, nativeToMM)`, reads `unit_of_measurement`) — the
rule engine's numeric comparator should do the analogous thing for
temperature: read `unit_of_measurement`, convert to a canonical unit (°C)
before comparing against a rule threshold that's always **stored** in
canonical °C so a rule survives an HA unit-system change or a sensor
migrating units; convert only at sidebar input/display time (honoring
`Store.imperial`, already used by the weather chip), same pattern as that
flag.

### 2.4 Not available over the WebSocket API

- **Long-Term Statistics / history aggregates** (min/max/mean over a rolling
  window) are not part of the live `state_changed` stream — they come from
  `history/history_during_period` or `recorder/statistics_during_period` WS
  calls (`HaApi.getHistory` already exists and could back a "rule needs a
  5-minute average" enhancement, but that's a poll, not a push — see §6).
- **Server-side template re-evaluation semantics** (Jinja `now()`,
  `states.domain|selectattr(...)`, etc.) are not reproducible client-side
  without literally embedding a Jinja engine; the rule model in §4 is
  intentionally simpler (comparators + boolean composition), matching what
  `numeric_state`/`state` automation conditions already cover, not
  arbitrary Jinja.
- **Device-class-specific enum option lists** (e.g. a `sensor` with
  `device_class: enum` and its `options` attribute) are present in the
  `state_changed` payload's `attributes.options` only when the integration
  sets it — safe to read but not guaranteed; treat as an opaque string
  compare, not an authoritative enum.

## 3. Real-world / visual reference

There is no single canonical "smart home logical indicator" object — the
closest tangible real-world analogs, useful for sizing/placement/behavior
conventions, are **industrial signal/stack (andon) lights** and simple
**panel pilot lamps**:

- **Stack/andon light towers** (Wikipedia:
  https://en.wikipedia.org/wiki/Stack_light; overview:
  https://www.allaboutlean.com/stack-lights/): stacked colored lens segments
  (red/amber/green, sometimes + blue/white), each independently lit
  solid/flashing, mounted on a pole atop or beside a machine. Common lens
  diameters **30 / 50 / 70 / 100 mm** (product listings, e.g.
  https://www.andont.com/products/andont-3-stack-super-bright-led-andon-tower-lights-red-yellow-green-on-off-flash-16-ft-extension-cord-6-ft-industrial-adapter-ip65-2-36-diameter-17-8-length-plug-play-ready
  — "2.36 diameter" ≈ 60 mm, "17.8 length" ≈ 452 mm tall including base and
  pole mount for a 3-stack tower). Color/behavior convention (IEC 60073,
  machine state color coding):
  - **Red** = fault / emergency / stopped — often **flashing red = active
    fault**, **steady red = stopped/halted** (a real-world precedent for
    Diorama's "solid vs flash = different severities" idea in the prompt).
  - **Amber/Yellow** = warning / abnormal condition, degraded but running.
  - **Green** = normal / running.
  - **Blue** = maintenance-requested / call for assistance.
  - **White** = neutral / informational, no defined machine-state meaning.
  - Flashing generically signals *higher urgency or a state transition* vs.
    steady, independent of hue.
- **Panel pilot lamps / annunciator lights** — small (10–22 mm) round
  indicator lamps on control panels, single color, solid/blink only (no
  gradient); useful reference for a *compact wall-mounted* Diorama variant
  distinct from the ceiling-beacon look already used by `SafetySensor`.

**Recommendation for Diorama's fixture look:** reuse the existing
`SafetySensor` ceiling-beacon visual language (small disc + emissive glow +
expanding pulse rings while alarming) for the "alert" tiers, since that's
already a validated Sims-toon-compatible look in this codebase, but make the
**color arbitrary** (driven by the resolved rule tier, not a fixed
kind-to-color map) and add a **flash** mode (binary on/off blink, not just a
pulse-ring animation) to match the "flash red" example in the prompt. A
free-standing **small pole/lamp variant** (mirroring the andon tower, tiny
scale — maybe 400–600 mm tall pole + colored sphere/dome head, ~150–200 mm
across) is a good option for a "yard/garage visible from outside" placement
distinct from a ceiling puck.

## 4. Diorama visualization & animation design

### 4.1 New types (`types.ts`)

```ts
// Comparator against a single (numeric or string) entity/value.
export type LogicOp = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'is_on' | 'is_off';

export interface LogicCondition {
  entity_id: string | null;   // input entity for this leaf condition
  op: LogicOp;
  value?: number | string;    // threshold / comparison value (numeric ops coerce via parseFloat)
  forMs?: number;             // optional dwell: condition must hold continuously this long (hysteresis)
}

// One tier: a boolean combination of conditions -> a visual outcome.
// Tiers evaluate TOP TO BOTTOM; first tier whose expression is true wins
// (same "first match wins" idiom as a CSS/switch cascade) — this is what
// gives "> 300°F red flash" priority over "> 200°F amber solid" for free,
// as long as the hotter tier is listed first.
export interface LogicTier {
  id: string;
  combine: 'and' | 'or';      // how this tier's conditions[] combine (single-level; see §7 re: nesting)
  conditions: LogicCondition[];
  color: string;               // hex
  effect: 'solid' | 'flash' | 'pulse' | 'off';
  effectPeriodMs?: number;     // flash/pulse cadence; default 900
}

export interface LogicLight {
  id: string;
  x: number; y: number;
  height?: number;        // mm above floor for the 3D body; default 1800 (eye-level wall placement)
  mount?: 'ceiling' | 'wall' | 'pole';  // drives 3D body shape + default height
  rotation?: number;      // deg, for wall/pole variants with a facing side
  tiers: LogicTier[];     // evaluated in order; first true tier wins
  elseColor?: string;     // shown when no tier matches; default off/grey
  gradient?: boolean;     // if true AND exactly one numeric condition drives the top tier,
                          // interpolate color continuously between tier stops instead of
                          // discrete jumps (see 4.4)
  label?: string;
  locked?: boolean;
}
```

Add `logicLights: LogicLight[]` to `Floor` (repairFloor + defaultFloor
backfill `[]` — **must** be added there or it silently resets per the
CLAUDE.md `_loadFromHa` gotcha; this is per-floor like `safetySensors`, not a
top-level `Store` field, so it rides the existing per-floor field-list path
in `repairFloor`, not the top-level explicit list).

### 4.2 Evaluation (a new small pure module, `logic-rules.ts`)

Mirrors `weather.ts`'s "isolated, pure, testable" pattern:

```ts
export function evalCondition(c: LogicCondition, states: StatesMap, now: number, dwell: Map<string, number>): boolean;
export function evalTier(t: LogicTier, states: StatesMap, now: number, dwell: Map<string, number>): boolean;
export function resolveLogicLight(ll: LogicLight, states: StatesMap, now: number, dwellState: Map<string, number>):
  { color: string; effect: LogicTier['effect']; periodMs: number } | null; // null = elseColor/off
```

Pure functions, unit-testable in a `logic-test.html` page the same way
`fusion-test.html`/`weather-test.html` work — feed synthetic `states` maps +
fixed `now`, assert resolved tier. `forMs` dwell needs a **small persistent
map** (condition id → "since when has it been true"), which is *runtime
state*, not pure — keep that bookkeeping in `Planner` (a new
`Planner._logicDwell: Map<string, number>`, analogous to how `_beds`/
`_bedDwell` already track dwell timers) and pass it into the otherwise-pure
resolver, same separation `fusion.ts` uses (pure core + `Planner` owns the
mutable timing state).

**Where evaluation runs:** `Planner` recomputes `Planner.logicStates: Map<id,
ResolvedLogic>` once per **live** tick (folded into the existing 2D RAF /
`stepLerp` cadence — it's cheap: a handful of comparisons per fixture, no
different from the existing per-frame activity-glow computation in
`canvas-render.ts`). Any entity referenced by a `LogicCondition` should be
treated as **live**-path — not added to `_isSlowEntity`'s slow list — since
numeric thresholds (temperature crossing 200°F) can change on any of the
~10 Hz pushes and there is no "config-path" analog for an arbitrary user
rule; the *visual state* of the fixture must react live, not just its
sidebar readout (contrast with `EnvSensor`, where only the displayed text is
slow-path — here the resolved tier is the whole point).

### 4.3 2D rendering (`canvas-render.ts` + `canvas-hit.ts` + `canvas-interact.ts`)

- `drawLogicLights(ctx, view, floor, planner)` — small filled disc/diamond
  (distinguish the fixture kind visually from `EnvSensor`'s chip and
  `SafetySensor`'s beacon disc; a **diamond** or **rounded-square LED**
  reads as "indicator," reserving circles for sensors) at the resolved
  tier's color. `effect==='pulse'` draws expanding rings exactly like
  `drawSafetySensors`'s alarm rings (reuse the ring-alpha math, different
  trigger: any non-off tier with `effect==='pulse'`, not just "alarming").
  `effect==='flash'` toggles full-alpha ↔ dim every `effectPeriodMs/2` via
  `performance.now() % effectPeriodMs`, the same idiom `drawDoorbellPulses`/
  fireplace flicker use for time-based unlit rendering (RAF-driven, no
  extra timer). `effect==='off'`/no tier matched → dim grey outline only.
  Gate: new `Layers2D` entry is unnecessary — ride the **`sensors`** layer
  like `BleProxy`/`AlarmPanel` (CLAUDE.md convention: new small fixture kinds
  default onto `sensors` rather than inventing a layer per kind).
- `hitLogicLight` — simple circle/box hit test, mirroring `hitSafetySensor`.
- `canvas-interact.ts` — new tool `logic` (`🚦` glyph, "Logic Light"), free
  placement (no wall snap needed for ceiling/pole mount; **wall mount**
  variant *should* snap like a switch — reuse `snapSwitchToWall`'s geometry
  if `mount==='wall'`), drag-move case, delete-tool case, cursor. Click (2D +
  3D) opens the sidebar's inline editor rather than toggling anything — this
  fixture is **read-only display**, not a controllable entity (no
  `localState`/`toggleItem` — nothing to toggle; its state is *computed*).

### 4.4 3D rendering (`three-renderer.ts` + `three-view.ts`)

- New group `_logicGroup`, declared/added/cleared/destroyed/layer-gated
  exactly like `_safetyGroup` (§ "Adding a canvas fixture" checklist).
- `updateLogicLights(items: LogicLight[], resolved: Map<string, ResolvedLogic>): void`
  builds, per fixture, a small body matching `mount`:
  - `ceiling` — flush disc + downlight cone (reuse the `SafetySensor`
    ceiling-disc geometry/material approach: `_mat({color, emissive,
    emissiveIntensity})`, swap emissive to the resolved tier color).
  - `wall` — small rectangular plate (like a switch body) with a lit lens
    dome, snapped flush per §4.3.
  - `pole` — a thin cylinder pole + colored sphere/dome head (andon-inspired,
    §3), for yard/garage visibility; use `_blobShadow` since it's a
    freestanding floor object like other outdoor fixtures.
  - All variants get an outline shell (`_addOutlines`) like every other
    furniture/fixture body, and a `PointLight` child (like the fireplace's
    point light) so the resolved color actually washes nearby geometry when
    `effect !== 'off'` — this is the single most "alive" touch: the physical
    room genuinely tints near the indicator, which is exactly what a stack
    light does in reality.
  - `effect==='pulse'` → flat `RingGeometry` decals like
    `updateDoorbellPulses`'s `TransientPulse` primitive (already generic,
    reuse it directly: `kind: 'logic'` pulses seeded whenever a tier with
    `pulse` is active, one per animation cycle).
  - `effect==='flash'` → toggle the emissive/point-light intensity in the
    SAME per-frame force-rebuild idiom `SafetySensor` already established:
    three-view **forces `updateLogicLights` every frame while ANY
    LogicLight is in `flash` or `pulse` mode** (the exact "fireplace/safety
    force-every-frame" pattern — CLAUDE.md § "3D dirty-key rebuilds": *"An ON
    fireplace light forces `updateLightsSwitches` every frame"* — same
    exception class). `solid`/`off` states rebuild only under the normal
    dirty key.
- **Dirty key**: `_keyLogic` = `configRev` + a compact hash of each
  fixture's **resolved** `{color, effect}` (not the raw entity states —
  the resolver already collapsed those) + whether any fixture is
  flash/pulse (the force-every-frame flag). Cheap: resolution already
  happened in `Planner`, three-view just reads `planner.logicStates`.
- **Layer**: `_logicGroup.visible` rides `v.sensors` in `setLayerVisibility`,
  matching §4.3's 2D layer choice.

### 4.5 Gradient mode (`gradient?: boolean`)

When `gradient` is set and the *first* tier's condition is a single numeric
comparator (`gt`/`lt` against one entity), instead of discrete tier jumps,
interpolate the displayed color continuously across the tier stack sorted by
threshold — i.e., build a small **color ramp** from the ordered tier
`{threshold, color}` pairs (skipping non-numeric tiers) and `lerp` between
the two bracketing stops by the value's position between them, using
`geometry.ts`'s existing hex-math helpers for the RGB interpolation (new
tiny helper `lerpHex(a, b, t)` alongside `lighten()`, following the same
"return hex, not rgb(...)" convention documented in CLAUDE.md's color-helpers
section — callers pipe the result back through `hexToRgba`/`hexToInt`). This
gives a "thermometer" look (smooth amber→red ramp) as an alternative to hard
tier snapping — good for temperature/humidity/battery-style continuous
values, matching the "consider gradient mapping too" ask. Effect
(`solid`/`flash`/`pulse`) still comes from whichever discrete tier currently
contains the value (gradient only smooths *color*, not behavior).

## 5. Integration steps

Follow the canvas-fixture recipe (CLAUDE.md "Adding a canvas fixture"),
concretely:

1. **types.ts** — add `LogicOp`, `LogicCondition`, `LogicTier`, `LogicLight`;
   add `logicLights: LogicLight[]` to `Floor`.
2. **geometry.ts** — `LOGIC_DEFAULTS` (height/mount/effectPeriodMs), a
   `logicLightHeight()`/`logicLightMount()` getter pair (mirroring
   `envHeight`/`envScale`), and `lerpHex()` for gradient mode.
3. **logic-rules.ts** (new file) — pure `evalCondition`/`evalTier`/
   `resolveLogicLight` + the unit-conversion helper for temperature
   (canonicalize to °C using `unit_of_measurement`, mirroring
   `Planner.stateMm`'s pattern). Write a `test-pages/logic-test.html`
   (esbuild-bundled like `weather-test.html`) asserting tier precedence,
   AND/OR, `forMs` dwell, `is_on`/`is_off`, and gradient interpolation.
4. **planner.ts** — `_logicDwell` map; a per-tick
   `recomputeLogicLights()` (called alongside `stepLerp`) populating
   `Planner.logicStates: Map<string, ResolvedLogic>`; every
   `LogicCondition.entity_id` referenced on the current floor stays on the
   default **live** path (no `_isSlowEntity` special-casing needed).
   Add `logicLights: []` to `repairFloor`/`defaultFloor` per-floor backfill.
5. **canvas-render.ts** — `drawLogicLights` (solid/flash/pulse rendering,
   reusing the `SafetySensor` ring-alpha helper) + `drawAll` call gated by
   the `sensors` layer.
6. **canvas-hit.ts** — `hitLogicLight`.
7. **canvas-interact.ts** — `logic` tool entry, drag-move case (+ wall-snap
   branch when `mount==='wall'`, reusing `snapSwitchToWall`'s math), delete
   case, cursor, `TOOLS` array entry + hint text.
8. **sidebar.ts** — new `_section('logic', 'Logic Lights', …)`: per-fixture
   editor — mount/height/rotation, an ordered **tier list** builder (add/
   remove/reorder tier; per-tier: combine AND/OR, condition rows each with
   entity-picker + op dropdown + value input honoring `Store.imperial` for
   temperature entities, color picker, effect dropdown, period ms for
   flash/pulse), `elseColor`, gradient checkbox, lock toggle. Live preview:
   show the currently-resolved color/effect inline (reads
   `planner.logicStates`) so authoring the rule gives instant feedback
   without leaving the sidebar.
9. **three-renderer.ts** — `_logicGroup` (declare, `scene.add`,
   `clearTransientGroups`, `destroy`, `setLayerVisibility` → rides
   `sensors`); `updateLogicLights(items, resolved)` per §4.4 (ceiling/wall/
   pole body variants, point light, outline shell, blob shadow for `pole`,
   pulse-ring reuse from the doorbell `TransientPulse` primitive).
10. **three-view.ts** — `_keyLogic` dirty key (configRev + resolved-state
    hash + flash/pulse-active flag forcing every-frame rebuild, mirroring
    the safety-sensor / fireplace exception); wire `updateLogicLights` call
    with `planner.logicStates`.
11. **Layers2D preset compatibility** — no new layer key; verify existing
    presets (simple/full) still show/hide logic lights correctly since they
    ride `sensors`.

## 6. Potential additional features

- **Statistics-based conditions** (e.g. "average > X over last 10 min")
  backed by `HaApi.getHistory`/`getWeatherForecasts`-style polling rather
  than instantaneous live comparison — useful for noisy sensors (a single
  10 Hz spike shouldn't flash red). `forMs` dwell already gives simple
  debouncing; a rolling-average mode would need a small ring buffer per
  condition, maintained in `Planner` the same way dwell timers are.
- **Nested boolean groups** (AND-of-ORs / OR-of-ANDs) instead of the
  single-level `combine` per tier — the v1 model (one AND/OR per tier) is
  deliberately simple; if user demand appears, generalize `LogicTier` to a
  recursive `LogicExpr = LogicCondition | { combine, children: LogicExpr[] }`
  tree. Flagged as a v2 nice-to-have, not required for the shipped feature.
- **Bind straight to an existing HA template entity** as a single condition
  input (already free — it's just another `sensor`/`binary_sensor` entity id)
  vs. a full Jinja escape hatch via WS `render_template` per §2.2 — offer
  this as an "Advanced: raw template condition" leaf type later, resolved
  through a managed `render_template` subscription (careful lifecycle: must
  unsubscribe on rule delete/floor switch, matching the discipline already
  used for `state_changed`). **Caution:** this WS command's precise message
  shape should be re-verified against the current HA core version at
  implementation time. https://developers.home-assistant.io/docs/api/websocket/
- **Reusable "rule library"**: since a `LogicLight`'s tiers are just data,
  let a user save a tier-stack as a named template and apply it to multiple
  fixtures (e.g. "HVAC status" reused on 3 thermostats) — mirrors how
  `ObjectRecipe` custom objects are authored once and referenced by many
  `Furniture` instances.
- **Feed a logic result INTO other systems**: expose `Planner.logicStates`
  as a bubble-trigger tier (like `BUBBLE_POOL_TRIGGER`) or an
  activity-anchor gate, so e.g. a red "washer needs attention" indicator
  also nudges a nearby avatar's thought-bubble pool — pure integration
  glue, no new data model.
- **Sound**: an optional chime/beep on tier *transition into* a
  danger tier (Web Audio, one-shot) — real stack lights often pair with a
  buzzer (see the ANDONT products in §3). Currently the codebase's explicit
  "no audio" decision (documented for the lightning weather effect) argues
  for leaving this out unless product direction changes.
- **Export/import a rule as a mini "automation" surfaced back to HA** (e.g.
  auto-create a template binary_sensor mirroring the resolved tier) so the
  same computed state could drive an HA automation, not just Diorama's own
  rendering. This inverts the original design goal ("no HA helper
  required") and should stay optional/future.

## 7. Open questions & risks

- **Tier precedence UX**: "first tier whose expression is true wins" is
  simple and mirrors CSS/switch-cascade familiarity, but authoring correct
  order (hottest condition first) is an easy user mistake — worth an
  in-sidebar warning if tiers look overlapping/misordered (e.g. tier 2's
  threshold is less strict than tier 1's but listed after). Low risk, but a
  UX detail to get right or support tickets will read "my flash rule never
  fires" (because a looser earlier tier always matches first).
- **Unit canonicalization correctness**: temperature is the easy case (HA
  normalizes device_class:temperature units already); a **generic** numeric
  condition against an arbitrary `sensor.*` with no `device_class` (e.g.
  water-tank %, a custom integration's raw number) has NO unit conversion
  to apply — the rule must just compare raw floats. Don't over-engineer
  unit handling into every op; special-case only device_class:temperature
  (and maybe pressure) where HA's own normalization already exists to hook
  into. Getting this wrong silently produces "always red" bugs that are hard
  to notice without a live preview (§5 step 8 — the sidebar preview is
  therefore load-bearing, not optional polish).
- **`is_on`/`is_off` vs. arbitrary string `eq`**: binary_sensor / lock /
  alarm_control_panel / cover all have different "true-ish" state strings
  (`on`, `unlocked`, `armed_away`, `open`, …). A generic `eq` op against a
  literal string covers all of them, but the friendlier `is_on`/`is_off`
  convenience ops only make sense for `on`/`off` domains. Decide at
  implementation time whether `is_on` should mean strictly `state==='on'` or
  a broader "truthy" set (`on`/`open`/`unlocked`/`home`/`playing`/`heat`…)
  — recommend keeping it **strict `on`/`off` only** and pushing everything
  else through `eq`/`neq` with the literal HA state string, to avoid a
  silently-wrong "truthy" guess list that HA itself doesn't standardize.
- **Vendor/domain fragmentation is a non-issue here** (unlike BLE/GPS
  features) because this feature deliberately doesn't touch any specific
  integration — it operates purely on the generic `state`+`attributes`
  envelope every HA entity already exposes over the WS API Diorama already
  consumes. The only fragmentation risk is *within* HA's own state-string
  conventions across domains (previous bullet).
- **Dead end to avoid**: don't try to make this fixture also *writable*
  (i.e. don't give it a `toggleItem`/`localState` control path) — its whole
  value proposition is being a **read-only computed display**; adding
  control semantics conflates it with `SwitchFixture`/`Light` and invites
  "why doesn't clicking it do anything" confusion. If a later feature wants
  a controllable+computed hybrid, that's a different fixture, not a
  V2 of this one.
- **Performance**: with many `LogicLight`s each referencing multiple
  entities, `Planner`'s per-tick recompute is O(fixtures × conditions) —
  trivial in absolute terms (dozens of comparisons), but confirm it stays
  outside any dirty-key-gated 3D rebuild path (§4.2 already routes it
  through the cheap live-tick, not a rebuild) so it doesn't regress the
  "3D dirty-key rebuilds" perf discipline documented in CLAUDE.md.
- **`render_template` WS command exact shape** (§2.2, §6) needs
  re-verification against the current HA core version at implementation
  time — the two-phase ack/event pattern and exact field names have had
  documentation churn; treat the description here as directional, not a
  copy-paste signature, and re-check
  https://developers.home-assistant.io/docs/api/websocket/ before building
  the "Advanced: raw template" escape hatch.

## 8. Sources

- HA WebSocket API (events, `render_template`, `subscribe_trigger`):
  https://developers.home-assistant.io/docs/api/websocket/
- HA WebSocket API integration overview:
  https://www.home-assistant.io/integrations/websocket_api/
- Template integration (template sensor, trigger-based templates, template
  light): https://www.home-assistant.io/integrations/template/
- Sensor entity developer docs (unit conversion, device_class,
  native_unit_of_measurement):
  https://developers.home-assistant.io/docs/core/entity/sensor/
- Light entity developer docs (color_mode, supported_color_modes, effects):
  https://developers.home-assistant.io/docs/core/entity/light/
- Automation `numeric_state` condition docs (the closest first-party analog
  to this feature's comparator model):
  https://www.home-assistant.io/docs/scripts/conditions/#numeric-state-condition
- home-assistant/core issue #129123 (trigger-based `device_class: enum`
  quirk, cited as a rough edge to be aware of, not a Diorama dependency):
  https://github.com/home-assistant/core/issues/129123
- Stack light (Wikipedia) — colors, general convention:
  https://en.wikipedia.org/wiki/Stack_light
- AllAboutLean — "Stack Lights—Visual Management Done Easy" (IEC 60073
  color/behavior convention, flashing-vs-steady semantics):
  https://www.allaboutlean.com/stack-lights/
- ANDONT product listing — real-world stack-light dimensions (diameter/
  length) and off/steady/flash modes:
  https://www.andont.com/products/andont-3-stack-super-bright-led-andon-tower-lights-red-yellow-green-on-off-flash-16-ft-extension-cord-6-ft-industrial-adapter-ip65-2-36-diameter-17-8-length-plug-play-ready
- Diorama repo itself (`src/types.ts`, `src/geometry.ts`,
  `src/three-renderer.ts`) — existing `EnvKind`/`envColor` threshold
  pattern and `SafetySensor` pulse/force-rebuild pattern used as the
  in-codebase precedent this feature generalizes.
