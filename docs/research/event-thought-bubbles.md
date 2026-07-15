# Event-Focused Thought Bubbles

## Summary

Diorama's Sims-style avatars already grow thought bubbles from ambient context
(kitchen at night → snack glyphs; seated in the evening → a book; a fixture
toggled nearby in the last 45 s → the "recent-trigger" tier — see
`three-renderer.ts._resolveBubbleKind` / `BUBBLE_POOL_TRIGGER`). All of that is
*mood*, not *news*. This feature adds a tier above all of it: a small set of
real **events** — a dishwasher/washer/dryer finishing its cycle, severe
weather arriving, rain starting, a lightning strike — that hijack a rig's
bubble for a short, unmissable window, and (for appliances) also paint a
badge on the fixture itself so the event reads spatially even if nobody is
standing nearby.

This fits Diorama's core premise — a spatial, glanceable panel, not a list of
entities — better than a notification would. Instead of a phone push saying
"Dishwasher finished," the person's Sims-avatar (or the dishwasher itself)
visibly reacts *in the room*, at the moment it happens, for a few seconds,
then returns to normal ambient behavior. It's the same design instinct behind
the existing camera-alert snapshot card and doorbell pulse rings: turn an HA
`state_changed` into a spatial event, not a toast.

Everything needed is either data Diorama already ingests (weather core,
`Furniture.powerEntity`, bound appliance entities) or a small number of new
optional item-level bindings that follow the exact same pattern as
`Furniture.doorEntity` / `tempEntity` / `powerEntity`. No new subsystem is
required — this is an extension of the existing bubble/trigger machinery plus
one new Planner-side detector modeled directly on `_detectDoorbells`.

## Home Assistant data model

Appliance "job done" signaling is **fragmented across vendors** — there is no
single core HA concept of "this appliance finished." Three real, distinct
data shapes exist and Diorama should support the first as the recommended
default and treat the others as configurable fallbacks.

### 1. Home Connect (Bosch/Siemens/Neff/Gaggenau) — core integration, cloud account required

`home_connect` is a **core** HA integration (`homeassistant/components/home_connect/`)
but requires a Home Connect **cloud account** + OAuth app registration
(`developer.home-connect.com`) — it is not local/offline. Docs:
https://www.home-assistant.io/integrations/home_connect/

Verified directly from HA core source (`sensor.py`, `binary_sensor.py`, dev branch, July 2026):

- **`sensor.<device>_operation_state`** — always created, `device_class: enum`,
  `translation_key: "operation_state"`. Possible states (already slugified by
  the integration from the raw `BSH.Common.EnumType.OperationState.*` enum):
  `inactive`, `ready`, `delayedstart`, `run`, `pause`, `actionrequired`,
  `finished`, `error`, `aborting`. **This is the recommended default trigger**:
  watch for a transition **into `finished`** — it's enabled by default (no
  user action needed) and present on every program-capable appliance type.
  Home Connect's own docs for this exact enum:
  https://developer.home-connect.com/docs/status/operation_state

- **`sensor.<device>_program_progress`** (0–100, `%`, translation key
  `program_progress`) and **`sensor.<device>_program_finish_time`**
  (device_class `timestamp` — a predicted completion time, translation key
  `program_finish_time`, HA source key is actually "remaining program time"
  converted to an absolute timestamp) — both only populated/available while
  `operation_state` is one of `delayedstart`/`run`/`pause`/`finished`
  (`HomeConnectProgramSensor.program_running`). Available on CoffeeMaker,
  CookProcessor, Dishwasher, Dryer, Microwave, Hood, Oven, Washer,
  WasherDryer.

- **Dedicated one-shot "event" sensors** — `sensor.<device>_program_finished`
  and `sensor.<device>_program_aborted` (`device_class: enum`, values
  `confirmed` / `present` / `off`, default `off`), plus appliance-specific
  variants like `sensor.<device>_drying_process_finished` (Dryer only),
  `salt_nearly_empty` / `rinse_aid_nearly_empty` (Dishwasher),
  `bean_container_empty` / `water_tank_empty` (CoffeeMaker),
  `freezer_door_alarm` / `refrigerator_door_alarm` (FridgeFreezer). **All of
  these `HomeConnectEventSensor` entities are created with
  `entity_registry_enabled_default = False`** — they exist in the registry but
  are disabled until a user manually enables them in HA (Settings → Devices &
  Services → entity → enable), because Home Connect fires dozens of these per
  appliance and most users don't want them all cluttering the registry. This
  is the same one-time-opt-in shape Diorama already solved for Bermuda BLE
  devices (`Planner.enableBermudaDevice` flips `disabled_by: null` via
  `config/entity_registry/update`) — the identical `HaApi.updateEntityRegistry`
  call already exists and can drive a "enable this sensor" button here too.

- **`sensor.<device>_door`** (`device_class: enum`, `closed`/`locked`/`open`) —
  useful as a secondary "job acknowledged" signal (user opened the door after
  the beep).

- Services: `home_connect.set_program_and_options`, `home_connect.start_program`,
  `home_connect.change_setting` (control, not needed for this feature — event
  detection is read-only over `state_changed`).

- **Not available over the plain WS API**: nothing exotic — every entity above
  is a normal HA entity and shows up in `state_changed` like any other. The
  only real gotcha is the disabled-by-default event sensors (invisible until
  enabled) and documented flakiness — Home Connect entities are known to go
  `unavailable`/stop updating periodically (cloud polling/rate-limit issues:
  home-assistant/core issues #129146, #65310, #66063) — so a detector must
  ignore `unavailable`/`unknown` transitions exactly like `_detectDoorbells`
  already does for doorbell entities.

### 2. Generic "running" binary_sensor (SmartThings, Tuya, Sonoff/Tasmota/ESPHome, template sensors)

Many washer/dryer/dishwasher integrations (or simple DIY power-based template
sensors) expose a `binary_sensor.<name>` with **`device_class: running`**
(added to HA core specifically for this use case — appliances "in operation
mode (started/running) or (stopped/not running)", HA architecture discussion
#645: https://github.com/home-assistant/architecture/discussions/645). `on` →
`off` is the completion transition. This is domain-agnostic and works with
any integration/automation that can produce a running binary_sensor,
including a user's own template sensor built on a power reading.

### 3. Generic on/off + energy-drop heuristic (any smart plug: Shelly, Kasa, Sonoff, ESPHome)

For appliances with no vendor cloud integration at all — the overwhelmingly
common case — the community pattern (HA Blueprints Exchange, e.g.
"Detect and monitor the state of an appliance based on its power consumption"
and "Notify or do something when an appliance like a dishwasher or washing
machine finishes," both on the Blueprints Exchange forum) is a **power-based
state machine** on a plain `sensor.*` with `device_class: power` (W):

- `idle → running`: power crosses above a `starting_threshold` (e.g. 10–15 W).
- `running → finished`: power drops below a `finishing_threshold`/`off_threshold`
  (e.g. 5 W) and **stays there** for a hysteresis window (blueprints use
  minutes; a real cycle has fluctuating draw — e.g. a washer's spin cycle
  power dips between phases — so the dwell must be tuned per-appliance, not a
  single global constant). This exact field already exists in Diorama:
  `Furniture.powerEntity` (added for the "power glow" feature — CLAUDE.md
  "Roadmap quick wins (batch E)"). Reusing it here needs no new HA binding,
  just a new interpretation with on/off thresholds.

### Weather events (already have the data pipeline; new is only the *transition* detection)

- **Rain starting** / **severe conditions arriving**: no new HA entity needed
  — Diorama's existing `Planner.weatherNow.condition` (`HaCondition`, 15
  values: `clear-night | cloudy | exceptional | fog | hail | lightning |
  lightning-rainy | partlycloudy | pouring | rainy | snowy | snowy-rainy |
  sunny | windy | windy-variant`, `src/weather.ts`) already updates from
  whichever source is configured (`weather.*` entity / sensors / Open-Meteo,
  polled/pushed per the existing weather-core cadence). "Rain starts" =
  condition transitions from a non-precip value into
  `rainy|pouring|snowy|snowy-rainy|lightning-rainy|hail`. "Severe weather
  arrives" (lighter-weight version, no new integration) = condition
  transitions into a high-`conditionIntensity()` value (`weather.ts`'s
  existing pure classifier: pouring/hail=1.0, lightning-rainy=0.8,
  windy=0.65, lightning=0.6, rainy/snowy/snowy-rainy=0.55 — already computed
  every tick for the 3D FX intensity, CLAUDE.md "3D weather effects (Feature
  W2)").

- **True severe-weather *alerts*** (as opposed to inferring "severe" from the
  condition enum) require a **dedicated alerting integration** — HA's
  `weather.*` entity does not carry a warnings/alerts list. Options, by
  region, none built into `weather.*`:
  - **US**: HACS custom `custom-components/weatheralerts` (pulls
    `alerts.weather.gov`) — creates `sensor.weatheralerts_<zone>` whose
    **state is the count of active alerts** and whose attributes are a list
    of alert dicts with `event` (type, e.g. "Tornado Warning"), `severity`
    (`Extreme|Severe|Moderate|Minor|Unknown`), `headline`, `onset`, `expires`.
    https://github.com/custom-components/weatheralerts . A near-identical
    HACS alternative is `nws_alerts` (https://github.com/finity69x2/nws_alerts).
  - **Germany**: `dwd_weather_warnings` is a **core** integration
    (https://www.home-assistant.io/integrations/dwd_weather_warnings/) —
    `sensor.*` state/attributes include `warning_count` and per-warning
    `warning_<n>_name` / `_start` / `_end` / `_description`.
  - **Canada**: core `environment_canada` integration exposes an alerts
    sensor whose **state is the active-alert count** and whose attributes
    list alert titles (also has an `environment_canada.get_alerts` service
    for a richer pull). https://www.home-assistant.io/integrations/environment_canada/
  - **Europe-wide**: `meteoalarm` — HA's docs mark it **"Legacy integration"**
    (still works, unmaintained) — a `binary_sensor.meteoalarm` that turns `on`
    with attributes `event`, `headline`, `awareness_level` (2=yellow/moderate,
    3=orange/severe, 4=red/high), `awareness_type`, `severity`, `urgency`,
    `effective`, `expires`. https://www.home-assistant.io/integrations/meteoalarm/
  - **Recommendation for Diorama**: don't hard-code one alerting integration.
    Add ONE new optional `Store.weather.alertEntity?: string` (any domain —
    `sensor.*` state-is-a-count, or `binary_sensor.*` on/off) the user points
    at whichever of the above they have. Detection is generic either way: a
    numeric state increase, or an off→on transition.

- **Lightning strike** (the *moment* of a nearby strike, not just "the
  condition says lightning"): the real HA data source is the HACS
  **Blitzortium** integration (`mrk-its/homeassistant-blitzortung`,
  https://github.com/mrk-its/homeassistant-blitzortung) — creates a
  distance/azimuth `sensor.*` (updates as strikes are detected within a
  configurable radius, default 100 km) plus **one `geo_location` entity per
  strike** (transient — appears then expires; the README explicitly warns to
  exclude `geo_location` from the recorder, "can create many new entities in
  a short time"). A strike "event" = the distance sensor's value changing (a
  new nearest strike) or a new `geo_location.lightning_*` entity appearing.
  This is a **custom/HACS component**, not core. Diorama already reads a
  `WeatherConfig.sensors.lightning` field (`src/weather.ts` station heuristic:
  a lightning sensor > 0 or "on" nudges the derived condition toward `stormy`)
  — that existing binding is a presence/count signal, not a strike-moment
  signal, so a *true* strike pulse needs the Blitzortung distance sensor
  specifically (or is simulated from the existing in-scene lightning-flash
  scheduler — see Open Questions).

## Real-world / visual reference

This feature has no new physical fixture geometry — it augments (a) the
existing appliance furniture pieces (dishwasher/washer/dryer/oven — already
modeled per spec-sheet defaults, CLAUDE.md furniture table) with a state
badge, and (b) the existing avatar thought-bubble sprite. Visual reference is
about the *iconography and urgency language*, not physical dimensions:

- **Appliance "done" badge** — mirrors the real-world cue these appliances
  already give: a beep + a light/icon on the control panel (Bosch/Whirlpool
  dishwashers project a red "clean" light on the floor when done; washers
  show a checkmark/end icon on the display). Diorama's fixture already gets a
  pulsing green "in use" LED (CLAUDE.md "Device-state bindings... Appliance
  in-use") — the done badge should read as a **distinct color** (blue or
  amber, not green — green already means "running") with a brief flash
  cadence, echoing real control-panel end-of-cycle indicators.
- **Bubble glyph language**: reuse familiar emoji vocabulary already in the
  codebase's bubble pools (`✅`, `🎉`, `🍽️`, `🧺`, `👕`) rather than inventing
  new iconography — consistent with the existing `BUBBLE_POOL_TRIGGER` /
  `BUBBLE_POOL_KITCHEN_NIGHT` style (plain emoji through the shared
  canvas-sprite text pipeline, no new asset pipeline).
  For weather events reuse the existing `weatherBubblePool` glyph vocabulary
  (`☔`⛈️`⚡`❄️) so the event tier and the ambient weather-chatter tier feel
  like the same visual language, just louder/faster.
  See `test-pages/avatar-bubble.html` for the existing sprite render path.
- **Urgency cues, not new geometry**: bigger sprite scale (~1.25–1.4× the
  normal bubble), a faster pop-in ease (~0.15 s vs the normal ~0.25 s), and a
  shorter definite hold (e.g. 8–12 s) rather than the ambient tiers'
  hold-until-context-changes — the same "this matters, then it's over"
  language a badge/toast uses elsewhere in software, translated into the
  Sims-bubble medium instead of a literal HTML toast (keeps the panel's
  "everything lives in the room" identity intact — no floating chrome).

## Diorama visualization & animation design

Two independent rendering surfaces, both driven off one new Planner-side
detector; build only what's needed for v1 (appliance `state_value` mode +
weather condition-transition triggers) and treat power-drop mode and the
external alert/lightning integrations as fast-follow (see §6).

### A. Planner-side event detection (new, models `_detectDoorbells` exactly)

Add a new optional item-level `Furniture` field pair (no `repairFloor`/
`defaultFloor` changes needed — item-level fields pass through untouched,
same rationale as `doorEntity`/`tempEntity`/`powerEntity`):

```ts
// types.ts — Furniture
jobStateEntity?: string;   // sensor/binary_sensor to watch (e.g. operation_state, a running binary_sensor, or a Home Connect *_program_finished event sensor)
jobDoneValue?: string;     // state value that means "done" — default 'finished'
```

New Planner method `_detectApplianceEvents(states)`, called from the same
place as `_detectDoorbells(states)` / `_detectCameraAlerts(states)` (LIVE
path only — `_onStates`, never slow/config):

```ts
private _detectApplianceEvents(states: Record<string, HassState>): void {
  const now = Date.now();
  for (const fu of this.floor().furniture) {
    const eid = fu.jobStateEntity;
    if (!eid) continue;
    const cur = states[eid]?.state;
    if (cur == null || cur === 'unavailable' || cur === 'unknown') continue;
    const prev = this._jobStatePrev[fu.id];
    this._jobStatePrev[fu.id] = cur;
    if (prev === undefined || prev === cur) continue;           // seed / no change
    const doneVal = fu.jobDoneValue ?? 'finished';
    if (cur !== doneVal) continue;                              // only fire ON the transition INTO done
    this.applianceEvents.push({ furnitureId: fu.id, kind: applianceEventKind(fu), at: now });
  }
  if (this.applianceEvents.length) {
    this.applianceEvents = this.applianceEvents.filter(e => now - e.at < 20000); // 20 s window
    if (this.applianceEvents.length > 8) this.applianceEvents.splice(0, this.applianceEvents.length - 8);
  }
}
```

`applianceEventKind(fu)` maps `furnitureKind(fu)` → a bubble-pool key
(`dishwasher`→`'dishwasher_done'`, `washer`/`dryer`→`'laundry_done'`,
`stove`/`microwave`→`'oven_done'`, else a generic `'appliance_done'`).
`jobStateEntity` ids go into `_isSlowEntity` (config-path, like `doorEntity`/
`tempEntity` — infrequent, structural).

A parallel, much smaller Planner detector handles weather events by diffing
`weatherNow.condition` each recompute (`_prevWeatherCondition`, seeded once,
no store persistence needed):

```ts
private _detectWeatherEvents(): void {
  const wn = this.weatherNow;
  if (!wn) return;
  const prevCond = this._prevWeatherCondition;
  this._prevWeatherCondition = wn.condition;
  if (prevCond === undefined || prevCond === wn.condition) return;
  const PRECIP = new Set(['rainy','pouring','snowy','snowy-rainy','lightning-rainy','hail']);
  if (!PRECIP.has(prevCond) && PRECIP.has(wn.condition))
    this.applianceEvents.push({ furnitureId: null, kind: 'rain_start', at: Date.now() });
  else if (conditionIntensity(prevCond) < 0.6 && conditionIntensity(wn.condition) >= 0.6)
    this.applianceEvents.push({ furnitureId: null, kind: 'severe_weather', at: Date.now() });
}
```

(`furnitureId: null` marks a house-wide event with no fixture anchor — see
below. Reuse the same `applianceEvents` list + prune/cap logic rather than a
parallel type; call it `Planner.householdEvents` if a separate name reads
better, but one list keeps the three-view plumbing single-purpose.)

Optional `Store.weather.alertEntity?: string` binding (§ HA data model) feeds
a third detector variant: numeric state increase (`sensor.*`) or off→on
(`binary_sensor.*`) → push `kind: 'severe_alert'`.

### B. `ActivityContext` plumbing (three-view._tickOnce)

Add one new optional field next to `recentTriggers`, same shape, same
build-site (`src/ui/three-view.ts` around the existing `note()`/`_recentTrigs`
block, ~line 1059–1103):

```ts
// three-renderer.ts ActivityContext
eventTriggers?: { kind: string; x: number | null; y: number | null; ageS: number }[];
```

`x/y: null` = house-wide (weather); non-null = fixture-anchored (furniture
position, from `fu.x/fu.y`). three-view maps `p.applianceEvents` (filtering
to the current floor for furniture-anchored ones; weather ones always pass)
into this list every tick — cheap, same pattern as the existing
`recentTriggers` map at line 1092.

### C. New top-priority bubble tier (`_resolveBubbleKind`, three-renderer.ts)

Insert a new check **before** the existing recent-trigger block (currently
first at line ~8141), so it always wins over ambient/trigger tiers while
active:

```ts
const evs = ctx?.eventTriggers;
if (evs && evs.length) {
  let best: { kind: string; ageS: number } | null = null;
  for (const e of evs) {
    if (e.ageS >= 20) continue;                 // hard cutoff — urgent then gone
    if (e.x != null && t) {                     // fixture-anchored: still gate by distance
      const dx = e.x - t.x, dy = e.y! - t.y;
      if (dx * dx + dy * dy > 6000 * 6000) continue;   // wider than the 3.5 m trigger-tier radius
    }
    if (!best || e.ageS < best.ageS) best = { kind: e.kind, ageS: e.ageS };
  }
  if (best) {
    const pool = BUBBLE_POOL_EVENT[best.kind] ?? BUBBLE_POOL_EVENT.appliance_done;
    return this._pickCtxBubble(h, 'event_' + best.kind, pool);
  }
}
```

House-wide weather events (`e.x == null`) skip the distance gate entirely —
**every** active rig on the current floor reacts simultaneously (a real storm
arriving is a whole-house event, not a per-room one); appliance events keep a
generous-but-bounded radius so only rigs plausibly "in earshot" react.

New pools, same shape/location as `BUBBLE_POOL_TRIGGER` (~line 528):

```ts
const BUBBLE_POOL_EVENT: Record<string, string[]> = {
  dishwasher_done: ['🍽️', '✅', '✨'],
  laundry_done:    ['🧺', '✅', '👕'],
  oven_done:       ['🍞', '😋', '✅'],
  appliance_done:  ['✅', '🎉'],
  rain_start:      ['🌧️', '☂️'],
  severe_weather:  ['⚠️', '🌪️', '😟'],
  severe_alert:    ['🚨', '⚠️'],
  lightning_strike:['⚡', '😳'],
};
```

The existing `_pickCtxBubble(h, tier, pool)` mechanism (line 8179) already
gives "roll once per tier-engagement, hold stable" behavior for free — no new
state machine needed on the `Humanoid`. The existing 2.5 s commit hysteresis
in `updateTargets` (line ~7956) also applies unchanged.

Optional urgency polish (needs a small signature change, flagged for the
builder): thread a `scale` multiplier through `_makeBubbleSprite`/`_syncBubble`
so event bubbles render ~1.3× normal size, and shorten the pop-in ease
constant for this tier only (check current `_syncBubble` easing constant
before changing it globally).

### D. Fixture-anchored "done" badge (independent of any rig — new)

Because a finished dishwasher matters even if nobody is in the kitchen, add a
build-time-registered, per-frame-updated badge on the appliance furniture
piece itself, following the *exact* existing "appliance in-use LED" pattern
(CLAUDE.md "Device-state bindings on structural items"):

- **3D**: in `_buildFurniture`, appliances already get an emissive green LED
  while `effectiveState` is on/playing. Add a second emissive color (e.g.
  amber/blue) driven by `Planner.applianceJustFinished(fu)` (true within the
  same ~20 s window the bubble uses, or until the fixture's bound entity
  state changes away from `jobDoneValue` — whichever design reads better;
  recommend the latter, "done" persists as a calm badge until acknowledged,
  matching the real appliance's own end light staying lit until the door is
  opened). Because furniture already rebuilds on a **compact appliance-state
  hash** folded into `_keyFloor` (CLAUDE.md: "three-view folds a compact
  appliance-state hash... into `_keyFloor`"), add `jobStateEntity`'s resolved
  done-flag into that same hash — no new dirty key required, same rebuild
  trigger that already handles the in-use LED and fridge door.
- **2D**: `drawFurniture` already pulses a green LED dot for in-use
  appliances (`canvas-render.ts`, time-based alpha). Add the same dot in the
  badge color when done — reuses the existing RAF-driven pulse, no new
  per-frame cost.
- No new layer: rides the existing `furniture`/`appliances` layer gate,
  exactly like the in-use LED it's paired with.

### E. Weather-event "storm arriving" flourish (optional, cheap)

Since `severe_weather`/`rain_start` are house-wide, consider also pulsing the
existing weather chip (`<diorama-weather-chip>`) briefly on the transition —
it's already mounted once in `app.ts` and already reads `weatherNow`; a short
CSS pulse class toggled for ~3 s on a condition-transition costs nothing new
architecturally and reinforces the moment for a user who isn't looking at any
particular avatar.

## Integration steps

1. **Types** — add `Furniture.jobStateEntity?: string` + `Furniture.jobDoneValue?: string`
   (`types.ts`); add `Store.weather.alertEntity?: string` (`WeatherConfig`,
   already an optional/opt-in config object, no migration needed) if the
   external-alert path is included in v1.
2. **Planner** — add `applianceEvents: {furnitureId: string | null; kind: string; at: number}[]`
   state + `_jobStatePrev: Record<string,string>` + `_prevWeatherCondition:
   HaCondition | undefined`; add `_detectApplianceEvents(states)` and
   `_detectWeatherEvents()`, called alongside `_detectDoorbells`/
   `_detectCameraAlerts` in the existing LIVE-path dispatch (`_onStates`).
   Add `jobStateEntity` (and `alertEntity` if included) to `_isSlowEntity`.
3. **ActivityContext** — add `eventTriggers?: {...}[]` to the interface in
   `three-renderer.ts` (optional/additive, matches the existing
   `recentTriggers` doc-comment convention re: stale-chunk safety).
4. **three-view** — in `_tickOnce`, alongside the existing `recentTriggers`
   build (~line 1092), map `p.applianceEvents` → `eventTriggers` (resolve
   furniture x/y for non-null `furnitureId`, current floor only), prune >20 s.
5. **three-renderer bubble tier** — add `BUBBLE_POOL_EVENT`; insert the new
   top-priority check at the start of `_resolveBubbleKind` (before the
   existing `recentTriggers` block); reuse `_pickCtxBubble` unchanged.
6. **Appliance done badge** — extend the existing appliance in-use LED
   builder (3D `_buildFurniture`) and 2D `drawFurniture` in-use pulse with a
   second "done" visual state; fold the done-flag into the existing compact
   appliance-state hash already in `_keyFloor` (no new dirty key).
7. **Sidebar** — furniture editor: a "Job state sensor" entity-picker row
   (mirrors the existing `doorEntity`/`tempEntity` bind rows) + a "Done
   value" text input (default `finished`, placeholder hint listing the
   Home Connect enum). Weather section: an "Alerts sensor" bind row if
   included.
8. **Optional: entity-enable helper** — if supporting the Home Connect
   dedicated event sensors (`program_finished` etc., disabled by default), add
   a small "Enable this sensor" button next to the bind row when the picked
   entity resolves to `disabled_by !== null` in the entity registry —
   reuses the exact `HaApi.updateEntityRegistry` call already wired for
   `enableBermudaDevice`.
9. **Verify** — `npm run typecheck && npm run build`; manually flip a bound
   `input_select`/`input_text` helper through the states you're testing
   (`run` → `finished`, or a precip-condition transition on a test
   `weather.*`) and confirm: bubble appears only near/within-floor of the
   trigger, wins over ambient tiers, clears after ~20 s or on next context
   change, and the fixture badge (if built) persists/clears independently.

## Potential additional features

- **Power-drop detection mode** (`Furniture.jobPowerOnW?` / `jobPowerOffW?`,
  reusing the existing `powerEntity` binding) for un-smart appliances behind
  a plain smart plug — needs a small per-fixture state machine (idle→running→
  cooldown-timer→done) rather than a bare transition-check; genuinely useful
  since most washers/dryers/dishwashers in the wild have no cloud
  integration at all.
- **Blitzortung real-strike integration** for `lightning_strike` sourced from
  actual nearby-strike data (distance sensor delta) instead of/alongside the
  existing simulated in-scene flash scheduler.
- **Acknowledge-and-clear**: clicking the fixture (or its badge) while a
  "done" state is showing could clear the badge early (mirrors a person
  physically opening the appliance) — ties into the existing click-vs-drag
  fixture click path and the door-open interaction Diorama already has for
  fridges.
- **Notification fan-out**: an event severe enough (severe_alert,
  lightning_strike) could also be surfaced via the topbar (a small badge/
  toast) for users who have the panel open but aren't looking at the 3D/2D
  view directly — optional, out of scope for the spatial-first v1.
- **Per-appliance custom done glyphs**: let a user override
  `BUBBLE_POOL_EVENT` per fixture (like `plumbobColor` overrides today) —
  low priority, cosmetic.
- **Multiple simultaneous events**: if two appliances finish within the same
  window, the nearest-in-time-and-distance one currently wins per rig; a
  richer design could queue them so a person standing between two finished
  appliances sees both in sequence rather than only the nearer.

## Open questions & risks

- **Lightning strike authenticity**: Diorama's existing 3D lightning FX
  already schedules a `DirectionalLight` flash **probabilistically** (every
  8–25 s while `condition` is lightning-ish) — it is not tied to real strike
  events. Syncing the bubble tier to that existing scheduler is cheap and
  visually coherent but is *not* a real strike; syncing it to a real
  Blitzortung strike instead is more honest but requires the user to have
  that specific HACS integration installed and a proxy placed/bound, and the
  two clocks (visual flash vs. real strike) would then run independently
  unless explicitly wired together (a real strike could also nudge the
  in-scene flash scheduler to fire immediately, which would be the more
  polished version but is extra work). Recommend deciding this explicitly
  before implementation — don't silently pick the fake-sync path.
- **Home Connect entity flakiness**: multiple open home-assistant/core issues
  (#129146, #65310, #66063) report Home Connect entities going `unavailable`
  or failing to update for extended periods due to cloud rate limits — a
  "done" transition could be missed entirely (appliance goes `run` →
  `unavailable` → `ready`, skipping `finished`). The detector already ignores
  `unavailable`/`unknown` per the doorbell-pattern guard, but that means a
  real completion can silently produce no bubble; there's no fully reliable
  mitigation short of also watching `program_progress` reaching 100 or
  `program_finish_time` passing, which adds complexity for a rare edge case.
- **Vendor fragmentation for "done"**: no other major appliance cloud
  integration (Samsung SmartThings washers, LG ThinQ, Whirlpool) was
  investigated in depth here — they likely each have their own operation
  state vocabulary. The `jobStateEntity` + `jobDoneValue` design is
  deliberately generic (any entity, any string value) specifically so it
  doesn't need per-vendor code, but the sidebar UX (a bare text input for
  "done value") is not very discoverable — worth a follow-up pass once a
  second real vendor is tested against.
- **Weather-alert entity generality**: the `Store.weather.alertEntity` design
  (§ Integration steps) assumes "state is a count" or "binary on/off" covers
  all the regional alert integrations surveyed — true for NWS/dwd/Environment
  Canada (count) and meteoalarm (binary), but an untested integration could
  break that assumption; the detector should tolerate a non-numeric,
  non-on/off state by simply not firing rather than throwing.
- **"House-wide" radius for appliance events**: 6000 mm was chosen as
  "wider than the ambient trigger tier's 3500 mm, narrower than the whole
  floor" — untested; may want per-event tuning once real usage is observed
  (a large open-plan kitchen/living room might want the dishwasher event to
  reach the whole floor, same as weather).
- **Interaction with privacy blur / anchored activities**: the new tier must
  respect the same early-outs as every other bubble tier
  (`h.activity != null || h.privacy > 0.3` and `bedHidden` — line 8136–8137)
  — an event happening while someone showers should NOT pop a bubble through
  the privacy silhouette. This is naturally inherited by inserting the new
  check inside the existing `_resolveBubbleKind` function rather than
  bypassing it.

## Sources

- https://www.home-assistant.io/integrations/home_connect/
- https://github.com/home-assistant/core/blob/dev/homeassistant/components/home_connect/sensor.py
- https://github.com/home-assistant/core/blob/dev/homeassistant/components/home_connect/binary_sensor.py
- https://github.com/home-assistant/core/blob/dev/homeassistant/components/home_connect/const.py
- https://developer.home-connect.com/docs/status/operation_state
- https://github.com/home-assistant/architecture/discussions/645 (binary_sensor `running` device class)
- https://github.com/home-assistant/core/issues/129146, https://github.com/home-assistant/core/issues/65310, https://github.com/home-assistant/core/issues/66063 (Home Connect entity availability issues)
- https://community.home-assistant.io/t/detect-and-monitor-the-state-of-an-appliance-based-on-its-power-consumption-v2-1-1-updated/421670
- https://gist.github.com/sbyx/6d8344d3575c9865657ac51915684696 (appliance-finished blueprint)
- https://github.com/custom-components/weatheralerts and https://github.com/custom-components/weatheralerts/blob/master/documentation/DOCUMENTATION.md (US NWS alerts, HACS)
- https://github.com/finity69x2/nws_alerts
- https://www.home-assistant.io/integrations/dwd_weather_warnings/ (core, Germany)
- https://www.home-assistant.io/integrations/environment_canada/
- https://www.home-assistant.io/integrations/meteoalarm/ (legacy, Europe-wide)
- https://github.com/mrk-its/homeassistant-blitzortung (HACS lightning strikes)
- https://www.home-assistant.io/integrations/event/ and https://developers.home-assistant.io/docs/core/entity/event/ (HA `event` entity platform, for context — not used by Home Connect's completion signals, which are plain enum sensors)
- In-repo: `src/planner.ts` (`_detectDoorbells`, `_detectCameraAlerts` — the pattern this feature's detector mirrors), `src/three-renderer.ts` (`_resolveBubbleKind`, `BUBBLE_POOL_TRIGGER`, `ActivityContext`), `src/ui/three-view.ts` (`_recentTrigs`/`recentTriggers` build site), `src/weather.ts` (`HaCondition`, `conditionIntensity`), `CLAUDE.md` (appliance in-use LED / dirty-key conventions)
