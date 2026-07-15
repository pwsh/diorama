# Generic Action / Trigger Control — Build-Ready Research

Status: research complete, not yet implemented. Target: a new `Floor.actionButtons:
ActionButton[]` canvas fixture — a wall-plate/table/floor "any-action" button that
dispatches a configurable HA service call (button press, scene activation, script run,
automation trigger, switch/light toggle, or fully arbitrary `domain.service`) with a
tactile press animation, sharing the switch/alarm-panel wall-fixture recipe.

## 1. Summary

Home Assistant has no single domain for "a button that does a thing you configured" —
that's a **frontend/dashboard concept** (HA's Lovelace button card + tap-action), not a
backend entity type. The backend primitives are: `button`/`input_button` (stateless
momentary press entities), `scene` (recall a stored group state), `script` (run an
arbitrary sequence), `automation` (trigger a rule's action block directly), and the
universal `call_service` WebSocket command that can invoke **any** `domain.service` with
arbitrary `service_data` against an arbitrary target. A "generic action control" fixture
in Diorama is therefore not a new entity type to bind to — it's a **dispatcher UI**: pick
one HA action (any of the above) once at config time, and the physical button in the
scene becomes a spatial way to fire it.

This fits Diorama well for three reasons:

1. **It's exactly the physical-button metaphor already half-built.** Diorama ships
   wall-mounted switch plates (`SwitchFixture`) and an alarm keypad (`AlarmPanel`) that
   are visually near-identical to what's needed here — a flush wall plate that reacts to
   click/tap. A generic action button is a strict generalization: instead of always
   calling `<domain>.toggle` on one bound entity, it calls **whatever service the user
   configured**, and instead of only living on a wall, it can also be a tabletop puck or
   floor pedal (real hardware — Shelly Button1, Aqara/IKEA Zigbee buttons, Flic — comes in
   all three placements).
2. **It closes a real gap.** Today, if a user wants a one-tap "movie night" scene, a
   "goodnight" script, or a doorbell chime automation fired from the spatial view, they
   have no way to do it — every existing Diorama fixture is bound to a domain-specific
   entity with domain-specific semantics (light, switch, cover, alarm panel, lock). This
   fixture is the "escape hatch" fixture: bind literally any callable action to a point in
   space.
3. **The dispatch mechanism already exists.** Diorama's `HaApi.callService(domain,
   service, data)` (see `src/ha-client.ts` / `src/ha-panel-adapter.ts`) is already fully
   generic — it is used today for `number.set_value`, `switch.turn_on/off`, `notify.*`,
   `lock.lock/unlock`, `lawn_mower.*`, `vacuum.*`, and the `homeassistant.toggle` fallback
   in `Planner.toggleEntity`. No new WebSocket plumbing is required to fire the action;
   the work is entirely a config UI + a visual fixture + safe defaults.

## 2. Home Assistant data model

### 2.1 The five things a button can point at

All are **core** (built into Home Assistant, no HACS/custom integration required) except
where noted.

#### a. `button` domain — stateless momentary press

- Source: [Button entity — Developer docs](https://developers.home-assistant.io/docs/core/entity/button/),
  [Button (user docs)](https://www.home-assistant.io/integrations/button/),
  [Press button action](https://www.home-assistant.io/actions/button.press/).
- Entity id pattern: `button.<name>`. Represents a **real device's** stateless momentary
  control (e.g. a Shelly button's cloud-exposed press, an ESPHome restart button, a
  network device's "identify" button). It "can be compared to a real live momentary
  switch, push-button ... but remains stateless from the Home Assistant perspective."
- **State**: not on/off — it's an **ISO-8601 timestamp** of the last time the button was
  pressed (via UI or via the `button.press` action). `unknown` if never pressed.
- **`device_class`** (optional, affects icon/UI only, no functional difference for
  Diorama): `None` (generic, default), `identify`, `restart`, `update`.
- **Action**: `button.press` — **`Press button`**. Takes only a target (`entity_id` /
  `device_id` / `area_id`), **no extra service-data fields**. Signature:
  `action: button.press` / `target: { entity_id: button.foo }`. No response payload.
- Not every `button.*` entity is user-created — most come from integrations exposing a
  physical device's control (a smart plug's "reset," a router's "reboot"). A
  Diorama-placed generic button binding to an *existing* `button.*` entity means "tapping
  this spot in my house presses that device's remote button" — a legitimate use (e.g. a
  virtual proxy for a router restart button mounted in a closet you never walk into).

#### b. `input_button` domain — user-defined "helper" button

- Source: [Input button (user docs)](https://www.home-assistant.io/integrations/input_button/),
  [Press input button action](https://www.home-assistant.io/actions/input_button.press/).
- Entity id pattern: `input_button.<name>`. A **helper** the user creates in HA's UI
  (Settings → Devices & Services → Helpers) purely to be a trigger source for
  automations — "you can use it to start something ... such as running a script,"
  and "when you press a button helper, your automations can use that press as a
  trigger."
- **State**: same as `button` — last-pressed timestamp, `unknown` if never pressed. No
  other attributes.
- **Action**: `input_button.press` — identical shape to `button.press` (target only, no
  extra data).
- This is the **recommended target for a brand-new "I just want a virtual button that
  fires my own automation"** use case, since it requires zero YAML/device setup — create
  the helper once in HA, wire an automation with an `input_button` state-changed trigger,
  and Diorama's fixture just presses it.

#### c. `scene` domain — recall a stored entity-state snapshot

- Source: [Scene entity — Developer docs](https://developers.home-assistant.io/docs/core/entity/scene/),
  [Scenes (user docs)](https://www.home-assistant.io/integrations/scene/),
  [Scene actions](https://www.home-assistant.io/docs/scene/editor/).
- Entity id pattern: `scene.<name>`. Config-defined (UI editor or YAML) group of target
  entity-states (e.g. "living room lights to 40% warm white, TV off").
- **State**: stateless in the useful sense — `scene` entities report the **timestamp of
  their last activation** as `state`, no meaningful attributes beyond `entity_id` (the
  list of entities the scene controls) and `id` (internal scene id, YAML-mode only).
- **Actions**:
  - `scene.turn_on` — **Activate scene.** `target: entity_id: scene.foo`, optional
    `data.transition` (seconds, float, `0 ≤ x ≤ 6553`) — only affects entities that
    themselves support transitions (lights); the scene doesn't need to be all-lights to
    accept the parameter.
  - `scene.apply` — apply an ad-hoc state map without a stored scene entity (not
    relevant to Diorama's "point at an existing HA object" model).
  - `scene.create` — dynamically create a scene from current states (not needed here).
- This is the natural target for **"movie night," "goodnight," "away," "party"**-style
  preset buttons — likely the single most common real-world use of this fixture.

#### d. `script` domain — run an arbitrary sequence

- Source: [Scripts (user docs)](https://www.home-assistant.io/integrations/script/),
  [Script syntax](https://www.home-assistant.io/docs/scripts/), [Performing
  actions](https://www.home-assistant.io/docs/scripts/perform-actions/).
- Entity id pattern: `script.<script_id>`. Each configured script becomes its own
  callable service **`script.<script_id>`** (no data) **and** is also reachable via the
  generic `script.turn_on` action (`target: entity_id: script.foo`) which starts it as a
  background task; `script.run` (equivalent to calling `script.<script_id>` directly).
  There's also `script.turn_off` (stop) and `script.toggle`.
- **State**: `on` while running, `off` when idle (a script IS a stateful entity, unlike
  button/scene). Attributes include `last_triggered`, and if the script defines
  `fields`/`variables`, `current_dc` etc. may appear during a run.
  - This means a script-bound action button can show a **live "running" state** — worth
    reflecting in the press animation (e.g. hold the glow while `state === 'on'` for
    long-running scripts) rather than a purely instantaneous flash.
- **Passing variables**: `script.turn_on` accepts `data.variables: {name: value, ...}` —
  "all action data is available as variables in templates, even if not specified as
  fields." If the script author defined named `fields` in the script editor, Diorama's
  config UI can, if desired, surface those as typed inputs (fields carry
  `name`/`selector`/`description`/`default`/`required` metadata) — **optional/stretch**,
  not required for v1 (v1 can just fire with no variables, which is valid and covers the
  overwhelming majority of "goodnight routine" style scripts).
- Calling `script.turn_on` on an **already-running non-parallel script queues/restarts**
  per the script's own `mode` (single/restart/queued/parallel) — Diorama doesn't need to
  reason about this; HA handles it.

#### e. `automation` domain — trigger a rule's action block directly

- Source: [Automation actions (user docs)](https://www.home-assistant.io/docs/automation/services/),
  community/GitHub discussion on `skip_condition` (`home-assistant/core#57422`,
  community thread on `automation.trigger`).
- Entity id pattern: `automation.<name>`.
- **Action**: `automation.trigger` — target `entity_id: automation.foo`, optional
  `data.skip_condition` (boolean). **Default behavior bypasses the automation's own
  `condition:` block** (`skip_condition` defaults effectively to skipping conditions
  unless explicitly set to run them — confirm against the current docs page at
  integration time since this default's exact phrasing has shifted across HA versions;
  treat "run conditions" as opt-in, not assumed).
- **State**: `on`/`off` (enabled/disabled — NOT "did it just run"), with a
  `last_triggered` timestamp attribute (readable via
  `state_attr('automation.foo','last_triggered')`).
- Also has `automation.turn_on` / `turn_off` (enable/disable the automation, not what a
  "press to run" button wants) and `automation.reload`.
- Less commonly the *best* target than `script` for a manual button (automations are
  usually trigger-driven, and forcing one runs its actions regardless of the trigger that
  would normally gate it) but it's a legitimate, fully-supported action and some users
  will want "re-run my morning routine automation" from a wall button without duplicating
  its logic into a script.

#### f. Arbitrary `domain.service` — the escape hatch

- Source: [WebSocket API — call_service](https://developers.home-assistant.io/docs/api/websocket/),
  [Perform actions](https://www.home-assistant.io/docs/scripts/perform-actions/),
  [Generic toggle](https://www.home-assistant.io/actions/homeassistant.toggle/), [Generic
  turn on](https://www.home-assistant.io/actions/homeassistant.turn_on/), [Generic turn
  off](https://www.home-assistant.io/actions/homeassistant.turn_off/).
- The WS `call_service` command (`{type:'call_service', domain, service, service_data,
  target?}`) can invoke **any** registered service against **any** target
  (`entity_id`/`device_id`/`area_id`/`label_id` — "not all services accept areas and
  devices"). Diorama's `HaApi.callService(domain, service, data)` already wraps this
  (`data` today is used as the flat legacy `service_data` shape with `entity_id` folded
  in, matching every existing call site in `planner.ts` — e.g. `callService('lock',
  'unlock', {entity_id})`).
- The **generic cross-domain actions** `homeassistant.turn_on` / `turn_off` / `toggle`
  work across light/switch/fan/cover/media_player/etc. in one call and are a good
  "simple mode" default when the user just wants "toggle this one entity" without caring
  which specific domain service applies (mirrors what `Planner.toggleEntity` already
  does by falling back to `homeassistant.toggle`).
- **Discoverability**: the WS `get_services` command returns the full service registry
  (all domains → services → per-field JSON schema) in one call — this is what HA's own
  Lovelace "Perform action" UI uses to populate its service picker and per-service data
  form. **Neither `HassClient` nor `HassPanelAdapter` implements this today** — it would
  need to be added to both (additive, same pattern as `getDevices`/`getEntityRegistry`)
  **only if** Diorama wants a live service+field picker (see §5); a v1 "pick one of five
  friendly presets + optional freeform domain/service/entity/JSON-data fields" config UI
  needs **no** new HaApi method at all, since `callService` already exists.
- **Safety framing**: because this is genuinely "call anything," the config UI is the
  safety boundary, not the transport. See §7.

### 2.2 What is NOT available over the WebSocket API

- **Field/variable metadata for a specific script's `fields`** is available (it's part of
  the `script.<id>` service's schema, delivered via `get_services`), but Diorama has no
  existing plumbing to read it — would require the new `getServices()` call above (or a
  narrower per-script fetch isn't offered; it's always the whole registry dump).
- **Physical button hardware press events that don't have a synthetic `button`/
  `input_button`/`sensor` entity** (e.g. some Zigbee2MQTT scene-switch quick actions
  exposed only as MQTT topics or Z2M `action` sensor values, or ZHA "device automation
  triggers") are not something Diorama's action-button fixture needs to *receive* — this
  feature is about Diorama-side placement of a **virtual** button that *sends* an action,
  not about visualizing a **physical** remote's button presses. (If a future feature
  wants to visualize "someone pressed the real hallway Pico remote," that's a different,
  receive-side feature — out of scope here.)
- **No dry-run/validation of a service call** — HA does not expose a WS command to check
  "would this service_data validate" without actually calling the service. Diorama's UI
  can only catch obviously malformed target selections (e.g. no entity picked) client
  side; a bad `service_data` JSON blob will simply error at call time (HA returns an error
  result on the `call_service` WS response, which Diorama should surface as a toast/log
  rather than silently swallow).
- **`script.turn_on` field defaults/selectors** are static config, not runtime state —
  fine, since they'd only be read once at config time via `get_services`, not per frame.

## 3. Real-world / visual reference

Generic "press to trigger a scene/script/action" buttons exist in three physical form
factors; Diorama should support the same three placement modes as its existing wall
fixtures plus two new free-placement ones (table/floor), reusing the switch-fixture wall
snap for the wall case.

| Product class | Example | Size (mm) | Mount | Notes |
|---|---|---|---|---|
| Wall/wall-box scene keypad | Lutron Pico 2/3/4-button ([spec sheet](https://assets.lutron.com/a/documents/369847.pdf)) | 66 × 33 × 8 (single remote); wall-box adapter brings it to a standard 1-gang plate footprint | Wall-box, drywall adhesive, or pedestal | Battery, RF — the "one button per scene" wall plate this feature most directly emulates |
| Wall scene switch (mains/battery) | Aqara Opple 2/4/6-button ([blakadder ref](https://zigbee.blakadder.com/Xiaomi_WXCJKG13LM.html)) | 86 × 86 × 15 (a standard single-gang decora-size square) | Wall-mounted (magnetic base) or handheld | Matches Diorama's existing `SwitchFixture` plate scale (`SWITCH_DEFAULTS.size = 320` mm marker/body extent in the 3D model — the *visual* plate is smaller, drawn within that footprint) |
| Standalone smart button (table/door/anywhere) | Shelly Button1, IKEA Styrbar/Shortcut, Flic | ~40–90 mm diameter puck, 10–20 mm thick | Adhesive, freestanding, keychain | Table-top or "stick it anywhere" — maps to Diorama's non-wall-snapped free placement (like `SafetySensor`, which also skips wall snap) |
| Floor pedal / doorbell-style press plate | Commercial panic buttons, nurse-call stations, doorbell mounted at floor/low height | Doorbell ≈ 115 × 45 × 15 mm faceplate; panic button ≈ 80 × 80 mm | Wall at low height or literally floor-mounted | Rare but valid — treat as the same free-placement fixture at a user-set low `height` |

For Diorama's model, one fixture type with a **placement mode toggle** (wall-snap vs.
free) covers all four physical archetypes — exactly like `AlarmPanel` (wall-snap) versus
`SafetySensor` (free placement) already diverge from the same underlying "small
interactive plate" concept. Recommended default visual: a small square/circular plate
(≈120 mm across in 3D, comfortably readable against the 320 mm switch-plate scale
already used) with a raised **physical button cap** (a short cylinder or dome, ⌀40–60 mm)
that visibly depresses on press — this is the one purely-decorative detail beyond the
existing switch plate that sells the "physical momentary button" read, since every other
Diorama wall fixture (switch, alarm panel) is a static plate with no moving part.

Color convention: neutral plate (light gray/white, matching switches) with an accent-
colored button cap the user can pick (default a friendly blue, distinct from the
red/amber alarm and safety-sensor palette so it doesn't read as an alert).

## 4. Diorama visualization & animation design

### 4.1 Types (`types.ts`)

```ts
export type ActionKind =
  | 'button_press'      // button.press or input_button.press
  | 'scene'              // scene.turn_on
  | 'script'             // script.turn_on (+ optional variables)
  | 'automation_trigger' // automation.trigger
  | 'toggle'             // homeassistant.toggle (simple single-entity toggle mode)
  | 'custom';            // arbitrary domain/service/data — the escape hatch

export interface ActionButton {
  id: string;
  x: number; y: number;
  rotation?: number;        // deg, wall-plate convention (0 = +Y world) — only meaningful when wallMount
  height?: number;          // mm above floor; default 1200 (wall) — table/floor placements override via a lower default
  wallMount?: boolean;      // true = snap-to-wall like SwitchFixture (default true); false = free placement like SafetySensor
  size?: number;            // plate/puck extent mm; default 220 (smaller than switch's 320 — a dedicated single-purpose button)
  actionKind: ActionKind;
  entity_id?: string | null;   // target for button_press / scene / script / automation_trigger / toggle
  domain?: string;           // 'custom' mode only
  service?: string;          // 'custom' mode only
  serviceData?: Record<string, unknown>; // 'custom' mode only (JSON edited in sidebar); also scene transition / script variables live here for their modes
  label?: string;
  icon?: string;             // optional glyph override (emoji, matches ENV_KINDS/light-icon idiom); default derived from actionKind
  color?: string;            // button-cap accent color; default '#4fa8ff'
  confirmed?: boolean;       // require a second tap/click within 2s before firing — for destructive-leaning actions (default false)
  locked?: boolean;          // canvas move/rotate/delete disabled; click-to-fire still works
}
```

Add `actionButtons: ActionButton[]` to `Floor`, backfilled `[]` in `repairFloor` +
`defaultFloor` (per the "adding a Store/Floor field" gotcha in `CLAUDE.md`).

No `localState` field is needed in the door/switch sense — this fixture has **no
resting-state visual** (unlike a light/switch that shows on/off); its only state is the
transient press animation. (Exception: when `actionKind === 'script'` and the bound
script's live state is `on` (running), the plate can show a running-glow — read via
`Planner.effectiveState`-style lookup, not a new field, since it's just `states[entity_id].state`.)

### 4.2 2D rendering (`canvas-render.ts` / `canvas-hit.ts` / `canvas-interact.ts`)

- `drawActionButtons(ctx, buttons, view, ...)`: square/rounded-rect plate (matches
  switch-plate drawing conventions) with a filled circle "button cap" in `color`, plus the
  `icon` glyph centered on the cap (📽 scene / ▶ script / 🔔 button / ⚡ automation / 🔀
  toggle / 🛠 custom — mirroring the `ENV_KINDS`/`LIGHT_GLYPH` glyph-map idiom). Label
  below per the standard fixture label convention.
- **Press animation (2D)**: on click, start a `performance.now()`-timestamped transient
  entry in a small `Planner.actionPressFx: {id, at}[]` list (same pattern as
  `Planner.doorbellRings`) — for ~300 ms the cap draws shrunk 15% + a lighter highlight
  (simulating a physical depress-and-release), then over the following ~500 ms an
  expanding-ring pulse (reuse the doorbell expanding-ring drawing routine/constants)
  fades out. Total animation budget ~800 ms, then the entry prunes (same 8-second-cap /
  prune-old-entries idiom as `doorbellRings`).
- If bound to a running `script` (`state === 'on'`), draw a steady soft glow (no pulse)
  around the plate for the run's duration, re-checked each frame from live `hass.states`
  (script ids are already a good fit for **slow/config path** — see §4.5).
- Hit test `hitActionButton` — simple point-in-plate-radius test, standard priority
  ordering (after nothing more specific overlaps; same layer as switches).
- Drag: new `actionButton` drag kind in `canvas-interact.ts` — wall-snap on
  drop/move-release when `wallMount` (reuse `snapSwitchToWall`-style logic, or literally
  parametrize `snapSwitchToWall` to accept a plate depth/offset so both fixtures share the
  snap function — **recommended**: generalize `snapSwitchToWall(item, walls, plateDepth)`
  rather than duplicate it), free placement otherwise (mirrors `SafetySensor`, no wall
  snap, no ganging).
- Click-vs-drag: standard fixture click path. **Click always fires the action**
  regardless of edit/kiosk mode (like alarm-panel and door-lock clicks) — this is a
  control fixture, not a structural one; only **view mode** and a **locked** state (canvas
  drag/delete only — click-to-fire, matching the existing "locked items keep their
  click-to-toggle" convention) suppress it. Double-click opens the sidebar config editor
  (mirrors dblclick-to-configure elsewhere) rather than firing twice.
- If `confirmed: true`, first click shows an "armed" ring (distinct color) for 2 s; a
  second click within that window fires; otherwise it disarms silently. (Purely a canvas
  affordance — no HA state involved.)

### 4.3 3D rendering (`three-renderer.ts`)

- New group `_actionButtonGroup`, declared alongside the existing fixture groups,
  `scene.add`ed, cleared in `clearTransientGroups`/`destroy`, gated in
  `setLayerVisibility` (rides the **switches** layer key, or a dedicated slug if the
  team wants it independently toggleable — recommend riding `switches` since it's the
  closest existing category and avoids growing `Layers2D` for a low-traffic fixture; note
  this in the sidebar layer list either way since precedent in this codebase is usually a
  dedicated slug — decide at implementation time, flagged in §7).
- Builder: `updateActionButtons(buttons, scene3d, stateProvider)` under a new
  `_keyActionButtons` dirty key (`configRev` + bound-script running-state hash, matching
  the `_keySafety`/`_keyRobots` "force rebuild while alarming/running" idiom **only**
  while any bound script is `on` — otherwise static, rebuilding only on `configRev`
  changes like ordinary furniture).
- **Body**: reuses the switch-plate box primitive (flush wall mount) when `wallMount`, or
  a short free-standing pedestal (like the alarm-panel post, scaled down) when not. A
  **raised cylinder/dome button cap** sits proud of the plate — this is the piece that
  actually depresses.
- **Press animation (3D)**: per-frame (not dirty-keyed — like `updateTargets` /
  `_advanceApplianceDoors` / `_advanceWeather`), a fixture-id-keyed blend eases the cap's
  local Y position down ~4–6 mm and back over ~250 ms on press (reuse the
  `_advanceApplianceDoors` blend-map idiom: a small `Map<id, {t}>` advanced each frame,
  entries pruned once finished) plus a brief emissive flash on the cap material
  (`_mat()`-built `MeshToonMaterial`, bump `emissiveIntensity` for ~150 ms then ease back —
  same idiom as the fireplace flicker / doorbell pulse, minus the randomness). Outline
  shell applies normally (small parts under `minDim` may be skipped per the
  inverted-hull-outline rule — verify the cap clears the size floor, or explicitly
  `userData.outlineSkip` it if not).
- A steady glow (no pulse) while a bound `script` is running, same visual language as the
  appliance in-use LED (`cat: 'appliance'` glow), scaled down to fit the small plate.
- No blob shadow needed for wall-mounted plates (matches switches/alarm panel, which skip
  it); a free-standing/table variant should get one (matches furniture convention —
  "skipped for rugs, stairs, elevated pieces" doesn't exclude a small standalone puck).

### 4.4 Dispatch (`planner.ts`)

```ts
Planner.fireActionButton(btn: ActionButton) {
  if (this.uiMode === 'view') return;              // view mode never fires
  // record press-fx regardless of mode (kiosk should still show the tactile animation)
  this._pushActionPressFx(btn.id);
  switch (btn.actionKind) {
    case 'button_press':
      if (!btn.entity_id) return;
      this.hass.callService(btn.entity_id.split('.')[0] /* button | input_button */, 'press', { entity_id: btn.entity_id });
      break;
    case 'scene':
      if (!btn.entity_id) return;
      this.hass.callService('scene', 'turn_on', { entity_id: btn.entity_id, ...(btn.serviceData ?? {}) });
      break;
    case 'script':
      if (!btn.entity_id) return;
      this.hass.callService('script', 'turn_on', { entity_id: btn.entity_id, ...(btn.serviceData?.variables ? { variables: btn.serviceData.variables } : {}) });
      break;
    case 'automation_trigger':
      if (!btn.entity_id) return;
      this.hass.callService('automation', 'trigger', { entity_id: btn.entity_id, ...(btn.serviceData ?? {}) });
      break;
    case 'toggle':
      if (!btn.entity_id) return;
      this.toggleEntity(btn.entity_id);              // reuses existing domain-aware toggle + homeassistant.toggle fallback
      break;
    case 'custom':
      if (!btn.domain || !btn.service) return;
      this.hass.callService(btn.domain, btn.service, { entity_id: btn.entity_id ?? undefined, ...(btn.serviceData ?? {}) });
      break;
  }
}
```

No `save()`/`emitConfig()` call is needed on fire (nothing about the fixture's *own*
persisted state changes when pressed — same as clicking an alarm panel's arm button,
which calls a service without mutating `AlarmPanel` fields). The press-fx list is
runtime-only, like `doorbellRings`.

**Kiosk semantics**: kiosk mode should be **allowed to fire** (that's the whole point of a
kiosk display used for control) — matches the alarm-panel and door-lock precedent
("kiosk devices must never write back" refers to *Diorama's own persisted store*, not to
calling HA services on the user's behalf, which alarm/lock/robot fixtures already do in
kiosk mode). View mode refuses, matching every other interactive fixture.

### 4.5 Slow vs. live entity routing (`_isSlowEntity`)

All of `button.*` / `input_button.*` / `scene.*` / `script.*` / `automation.*` bound ids
are **config-path** (like alarm panel / lock / camera ids) — they change rarely (a
scene's `state` timestamp updates only on activation) and the sidebar config editor
should reflect the current binding, but there's no hot per-frame reason to treat them as
`live`. A bound **script**'s `on`/`off` running-state is the one exception worth **also**
routing through slow/config (not live) since the 3D running-glow only needs to react
within normal config-channel cadence, not 10 Hz — add all these entity ids into the
existing config-path bucket in `_isSlowEntity`, mirroring how alarm/lock ids are handled
today.

### 4.6 Sidebar (`sidebar.ts`)

New `_section('actions', 'Action Buttons', …)` (slug `actions`), inline per-item editor
mirroring the alarm-panel section shape:

- Action kind dropdown (`ActionKind`) — switching kind resets irrelevant fields (matches
  the "Kind dropdown auto-bumps default" precedent from garage doors).
- Target picker: for `button_press`/`toggle` → `<diorama-entity-picker>` filtered to
  `button`/`input_button` domains (or no filter for toggle, since toggle is meant for
  any toggleable entity); for `scene`/`script`/`automation_trigger` → picker filtered to
  that single domain.
- `custom` mode: two freeform text inputs (domain, service) + a JSON textarea for
  `serviceData`, with inline JSON.parse validation feedback (red border + error text on
  parse failure, matching a plausible existing form-validation idiom in the codebase —
  confirm the exact styling convention against another freeform-JSON-if-any input at
  implementation time; if none exists, a simple try/catch + error `<div>` is sufficient).
- Icon/color pickers (reuse the existing color-row / icon-glyph idioms from motion
  sensor / env sensor sections).
- `wallMount` checkbox (flips wall-snap vs. free placement — re-snap or clear rotation on
  toggle, matching the garage-door w-default-bump precedent for "changing a fundamental
  shape flag re-derives defaults").
- "Confirm before firing" checkbox → `confirmed`.
- 🔒 lock row (standard `_lockRow` idiom).
- A **"Test" button** in the sidebar row itself (mirrors the Safety-sensor section's Test
  button) that calls `Planner.fireActionButton` directly from the sidebar, useful for
  verifying the config without walking to the canvas.

### 4.7 TOOLS entry

New tool button (🔘 or 🛎, "Action Button" — glyph should read distinctly from the 🚨
alarm-panel and ⚠️ safety-sensor glyphs already in the tool bar) in the tools area;
tap-to-place on the canvas (wall-snap on drop if `wallMount`, matching switch/alarm
placement flow).

## 5. Integration steps

Following the canvas-fixture recipe (mirrors the BLE-proxy / alarm-panel precedent cited
in `CLAUDE.md`'s gotchas list):

1. **`types.ts`**: add `ActionKind`, `ActionButton` interfaces; add `actionButtons:
   ActionButton[]` to `Floor`.
2. **`geometry.ts`**: `ACTION_BUTTON_DEFAULTS` (height 1200, size 220, color, wallMount
   true); helper getters (`actionButtonHeight`, `actionButtonColor`, …) matching the
   `switchHeight`/`switchRotation` pattern; `ACTION_ICON` glyph map keyed by `ActionKind`;
   optionally generalize `snapSwitchToWall` into a parametrized `snapPlateToWall(item,
   walls, plateDepthMm)` shared by switch + action-button (recommended over duplicating).
3. **`repairFloor` / `defaultFloor`**: backfill `actionButtons: []`.
4. **`canvas-render.ts`**: `drawActionButtons` (plate + cap + icon + label), press-fx
   pulse/shrink animation reading `Planner.actionPressFx`, `drawAll` gating under a
   layer (recommend riding `switches` per §4.3, or add a new `Layers2D.actionButtons`
   slug if the team prefers per-fixture granularity — flagged as an open question, §7).
5. **`canvas-hit.ts`**: `hitActionButton` (circle/rect hit test at plate radius).
6. **`canvas-interact.ts`**: mousedown/move/up drag case (`actionButton` kind, wall-snap
   or free per `wallMount`), place-tool click-to-drop, delete-tool branch, cursor.
   Click-vs-drag dispatch calls `planner.fireActionButton(btn)` on a clean click (not
   editing-mode-gated — see §4.4); dblclick opens the sidebar editor / focuses the
   section.
7. **`planner.ts`**: `fireActionButton`, `actionPressFx: {id, at}[]` runtime list +
   push/prune helpers (mirror `doorbellRings`); add bound entity ids to the config-path
   bucket of `_isSlowEntity`.
8. **`sidebar.ts`**: `_section('actions', …)` per §4.6; `TOOLS` entry + tool hint text;
   `_groupedList`/room-grouping wiring like other sectioned fixtures.
9. **`three-renderer.ts`**: declare `_actionButtonGroup`; add to `scene.add`,
   `clearTransientGroups`, `destroy`, `setLayerVisibility`; `updateActionButtons` builder
   (plate + cap + outline shell, script-running glow); per-frame press-blend advance
   (new small function called from `_animate`, alongside `_advanceApplianceDoors`).
10. **`three-view.ts`**: `_keyActionButtons` dirty key (configRev + bound-script running
    hash); call `updateActionButtons` when it changes; raycast `userData.kind ===
    'actionButton'` walker → `planner.fireActionButton`.
11. **Typecheck + build** (`npm run typecheck`, `npm run build`) — no test suite exists
    per repo convention; manually verify against a dev HA instance with a real
    `scene.*`/`script.*`/`input_button.*` before considering it done.
12. **(Optional, v2)** Add `getServices()` to both `HassClient` and `HassPanelAdapter`
    (additive WS command, same shape as `getDevices`/`getEntityRegistry`) to power a live
    domain→service→field picker for `custom` mode instead of freeform text/JSON.

## 6. Potential additional features

- **Script field/variable UI**: read a script's declared `fields` (via the optional
  `getServices()` call) and render typed inputs in the sidebar instead of a raw JSON
  `variables` blob — much friendlier for scripts with a couple of named parameters
  (e.g. a "set thermostat to N" script).
- **Multi-action buttons**: fire a short ordered list of actions on one press (e.g. "arm
  alarm AND turn off all lights") — would need either (a) a client-side sequential
  `callService` loop (simplest, no HA-side dependency) or (b) nudging the user toward
  creating a `script`/`scene` server-side (more robust, HA already excels at this — likely
  the better guidance to give in UI copy rather than reimplementing sequencing client-side).
- **Long-press vs. short-press → two different actions** (mirrors real smart buttons like
  Aqara Opple's click/double-click/long-press): would need a second `ActionKind`+target
  pair (`holdAction?`) and a press-duration measurement in the canvas mousedown/up
  handlers — natural v2, not needed for v1 parity with "one button, one action."
  Physical devices' own click/double/long-press events are a *separate* input-side
  feature (see below), not this output-side fixture.
- **Reflecting a physical remote's press as a Diorama pulse** (receive-side): visualize
  when a *real* Zigbee/Z2M scene-switch button (exposed as a `sensor.*` with an `action`
  attribute, or ZHA device-automation-trigger events not visible as entity state at all)
  is pressed — architecturally a different feature (an event listener, not a
  service-dispatcher), likely warrants its own research doc if wanted.
- **Cooldown / rate-limit**: a debounce so a double-tap or the touch-synthesis path
  (`_lastSyntheticClick`, per the touch→click gotcha already in `CLAUDE.md`) can't double-
  fire a scene activation — reuse the existing 700 ms synthetic-click de-dupe window,
  which should already prevent this at the click-dispatch layer; worth an explicit test.
- **Recent-trigger bubble integration**: the existing "recent-trigger" thought-bubble tier
  (`BUBBLE_POOL_TRIGGER`, keyed `light_on`/`light_off`/`fireplace`/`tv`) could gain an
  `action_button` key so nearby avatars react (💡/✨) when a scene/script fires nearby —
  small, in-spirit-of-the-codebase addition.
- **Per-button usage log / last-fired timestamp** shown in the sidebar row (read from the
  bound entity's own state where meaningful — scenes/scripts/automations already carry
  `last_triggered`/last-activation timestamps in HA; `button`/`input_button` timestamps
  work the same way) — cheap, no new plumbing, nice affordance for "did that actually
  fire?" trust-building.

## 7. Open questions & risks

- **Layer assignment**: ride the existing `switches` layer key, or add a new
  `Layers2D.actionButtons` slug? Precedent varies (BLE proxies/alarm/camera ride
  `sensors`; a truly new interactive category usually gets a dedicated slug, e.g.
  presence zones rode `zones`). Recommend a dedicated slug for discoverability in the
  layer-preset UI, at the cost of one more `Layers2D` field to thread through presets —
  low risk either way, just needs a decision before implementation.
- **`skip_condition` exact default semantics for `automation.trigger`** should be
  re-verified against the live HA docs page at implementation time — search results
  disagreed slightly on phrasing (whether omitting the field skips or runs conditions);
  do not hardcode based on this doc's summary — read `https://www.home-assistant.io/docs/automation/services/`
  directly before writing the call.
- **Safety of the `custom` escape hatch**: arbitrary `domain.service` dispatch from a
  spatial panel is powerful — it can call `homeassistant.restart`,
  `recorder.purge`, or anything else registered. Recommendations: (a) default new
  buttons to `scene`/`script`/`button_press` modes, requiring an explicit extra toggle
  ("Advanced: custom service call") to reveal `custom` mode in the sidebar, so it's
  opt-in friction rather than the first thing a user sees; (b) surface a one-line warning
  in the `custom` mode UI ("this calls any Home Assistant action — make sure you trust
  what you type here"); (c) consider **not** allowing `custom` mode to omit a target
  entity/device/area entirely for domains with a known "affects everything" footgun
  (`homeassistant.restart`, `recorder.*`) — a small denylist is cheap insurance, though it
  can never be exhaustive; document that limitation rather than over-promise safety.
- **Confirm-before-firing (`confirmed`) UX**: is a 2-second double-tap window (this doc's
  proposal) the right pattern, or should it instead reuse HA's own confirmation-dialog
  idiom (a native browser `confirm()` or a small modal)? A modal is more discoverable but
  breaks the "one tap, instant feedback" spatial-panel feel this fixture is going for;
  recommend the double-tap-arm pattern for parity with a *physical* button (a real "arm
  before firing" button, like a missile-launch toggle-and-press, is a known real-world
  UX and reads naturally in 2D/3D) but flag as a design call, not a fixed requirement.
  Test-mode nuance: does `confirmed` also gate the sidebar Test button, or does Test
  always fire immediately (bypassing the arm-then-press dance) since it's an explicit
  admin action already gated behind opening the sidebar? Recommend Test bypasses
  confirmation.
- **Script variables UX** (§6) is deliberately deferred to v2 — decide at implementation
  time whether v1 ships with zero-variable script calls only (simplest, matches "the
  overwhelming majority of goodnight-routine scripts take no parameters") or whether the
  freeform JSON `variables` field belongs in v1 already (low additional cost since
  `serviceData` already needs a JSON textarea for `custom` mode — could be reused for
  script variables with a small relabel).
- **Icon crowding**: the tool bar and glyph vocabulary are already dense (🚨 alarm, ⚠️
  safety, 🔔 doorbell, 📷 camera, 🤖 robot, …); picking a generic-button glyph that reads
  distinctly (both in the tool bar and as the on-plate icon default) needs a quick visual
  pass against the existing set before committing — 🔘/🛎️/⏺ are candidates, none is
  obviously perfect.
- **Vendor fragmentation is a non-issue here** (unlike siren tones or lock vendor quirks)
  — `button`/`input_button`/`scene`/`script`/`automation` are all long-stable core HA
  concepts with one settled action shape each; this feature has unusually LOW
  integration-fragmentation risk compared to most other Diorama fixtures, since it never
  needs to read a device-specific attribute — it only ever *calls* a service the user
  already configured correctly in HA.

## 8. Sources

- [Button entity — Developer docs](https://developers.home-assistant.io/docs/core/entity/button/)
- [Button (user docs)](https://www.home-assistant.io/integrations/button/)
- [Press button action](https://www.home-assistant.io/actions/button.press/)
- [Input button (user docs)](https://www.home-assistant.io/integrations/input_button/)
- [Press input button action](https://www.home-assistant.io/actions/input_button.press/)
- [Scene entity — Developer docs](https://developers.home-assistant.io/docs/core/entity/scene/)
- [Scenes (user docs)](https://www.home-assistant.io/integrations/scene/)
- [Scenes editor / actions](https://www.home-assistant.io/docs/scene/editor/)
- [Scripts (user docs)](https://www.home-assistant.io/integrations/script/)
- [Script syntax](https://www.home-assistant.io/docs/scripts/)
- [Performing actions (script.turn_on, variables)](https://www.home-assistant.io/docs/scripts/perform-actions/)
- [Automation actions (automation.trigger, skip_condition)](https://www.home-assistant.io/docs/automation/services/)
- `home-assistant/core#57422` — `skip_condition` option discussion (GitHub issue)
- [WebSocket API — Developer docs (call_service, get_services, target shape)](https://developers.home-assistant.io/docs/api/websocket/)
- [Generic toggle action](https://www.home-assistant.io/actions/homeassistant.toggle/)
- [Generic turn on action](https://www.home-assistant.io/actions/homeassistant.turn_on/)
- [Generic turn off action](https://www.home-assistant.io/actions/homeassistant.turn_off/)
- [State and state object (last_updated/last_changed, standard attributes)](https://www.home-assistant.io/docs/configuration/state_object/)
- Lutron Pico 4-Button Wireless Remote spec sheet (PDF, size reference): https://assets.lutron.com/a/documents/369847.pdf
- Aqara Opple Wireless Scene Switch (blakadder Zigbee reference, size reference): https://zigbee.blakadder.com/Xiaomi_WXCJKG13LM.html
- Diorama repo source consulted directly: `src/ha-client.ts`, `src/ha-panel-adapter.ts`,
  `src/planner.ts` (existing generic `callService` usage), `src/geometry.ts` /
  `src/types.ts` (`SwitchFixture`, `AlarmPanel`, `Door` field conventions for the
  fixture-recipe pattern this doc follows).
