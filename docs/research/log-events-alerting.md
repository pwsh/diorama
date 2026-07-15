# Log Events & Alerting Surfacing

## 1. Summary

Home Assistant already tracks "things that need a human's attention" in several
overlapping subsystems: **persistent notifications** (ad-hoc messages any
integration/automation can raise), **Repairs** (structured, severity-ranked
system issues raised by core/integrations), **system_log** (WARNING+ Python
log records), the **Logbook** (a humanized history of state changes), and the
**`alert` domain** (user-defined YAML watchdogs with acknowledge semantics).
None of these have any spatial representation today — they live in the HA
sidebar/notification bell, a separate "Repairs" page, or a modal.

Diorama's whole value proposition is putting live HA state *in spatial
context*. This feature — an **Alert Center** — pulls these streams into the
panel and gives them two homes:

1. **A global, non-placed notification surface** (topbar bell + badge count +
   drawer, screen-space toast stack) for alerts that have no natural location
   (system health, "update available", a YAML `alert:` watchdog with no
   device). This is the low-risk, high-value 80% case and needs **no new
   placeable fixture** — it's pure UI + a new Planner data feed, the same
   shape as the existing weather chip.
2. **An optional placeable "Alert Beacon" fixture** (ceiling puck, same
   recipe as the Smoke/CO Safety Sensor) that a user can bind to a specific
   `alert.*` entity (or any binary-ish entity standing in for "problem here")
   so it pulses in-scene at the room/fixture it actually concerns — reusing
   the pulse-ring/beacon idioms already shipped for doorbells, safety
   sensors, and camera alerts.

This generalizes patterns Diorama has already built (doorbell transient
pulses, camera alert snapshot cards, safety-sensor ceiling pucks, the alarm
keypad's state-colored screen) into one alerting subsystem, rather than
inventing new mechanics.

## 2. Home Assistant data model

### 2.1 `persistent_notification` (core, built-in)

The best-fit source: it is the only one of these five subsystems that is
**bidirectional over the WebSocket API** (create, read, live-subscribe, and
dismiss all work over WS) — no polling required.

- **Services** (domain `persistent_notification`):
  - `persistent_notification.create` — fields `message` (required, supports
    templating/markdown), `title` (optional), `notification_id` (optional;
    supplying an existing id **overwrites** that notification rather than
    creating a duplicate — this is the dedup/idempotency key).
  - `persistent_notification.dismiss` — field `notification_id` (required).
  - `persistent_notification.dismiss_all` — no fields.
  - Docs: <https://www.home-assistant.io/integrations/persistent_notification/>
- **WebSocket commands** (both admin and non-admin users can call these —
  no `require_admin`):
  - `persistent_notification/get` → `{"id", "type": "persistent_notification/get"}`
    returns the current list.
  - `persistent_notification/subscribe` → `{"id", "type": "persistent_notification/subscribe"}`.
    First reply is the current snapshot; thereafter the server pushes
    `event` messages whenever the internal `SIGNAL_PERSISTENT_NOTIFICATIONS_UPDATED`
    dispatcher fires, carrying an `UpdateType` (`CURRENT` / `ADDED` /
    `REMOVED` / `UPDATED`) and a dict keyed by `notification_id`.
  - Source: `homeassistant/components/persistent_notification/__init__.py`
    (home-assistant/core, `dev` branch).
- **Notification shape** (TypedDict `Notification`): `message` (str,
  required), `title` (str | None), `notification_id` (str, required),
  `created_at` (datetime, required). There is **no severity/level field** —
  persistent notifications are flat; any "this is critical" semantics have
  to be inferred from `title`/`message` text or from which integration
  raised it.
- Legacy note: some integrations still create these via
  `notify.persistent_notification` (the notify-platform shim) rather than
  the native service — those notifications frequently lack a stable
  `notification_id`, which is a known limitation
  (home-assistant/core#68811) — dedup/dismiss-by-id can silently fail for
  those.
- Not visible over WS: nothing — this is the most complete surface of the
  five.

### 2.2 Repairs / Issue Registry (core, built-in since 2022.9)

Structured, severity-ranked, admin-facing system issues. **Read/ack over WS,
but no push** — you must poll.

- **Creating an issue** (integration-side, not something Diorama calls):
  `homeassistant.helpers.issue_registry.async_create_issue(hass, domain,
  issue_id, *, severity, translation_key, is_fixable=False,
  is_persistent=False, breaks_in_ha_version=None, learn_more_url=None,
  data=None, translation_placeholders=None, issue_domain=None)`.
  `IssueSeverity` enum: `CRITICAL` ("reserved... true panic"), `ERROR`
  ("something is currently broken and needs immediate attention"),
  `WARNING` ("something breaks in the future ... needs attention").
  Dev docs: <https://developers.home-assistant.io/docs/core/platform/repairs/>
- **WebSocket commands** (all under `homeassistant/components/repairs/websocket_api.py`,
  **admin-required**):
  - `repairs/list_issues` → `{"id","type":"repairs/list_issues"}`. Returns
    `{"issues": [...]}`, each issue: `issue_id`, `domain`, `severity`,
    `translation_key`, `translation_placeholders`, `is_fixable`,
    `issue_domain`, `created`, `breaks_in_ha_version`, `learn_more_url`,
    `dismissed_version` (present ⇒ `ignored: true`).
  - `repairs/get_issue_data` → `{"domain","issue_id"}` returns arbitrary
    integration-supplied `data` for a `RepairsFlow` step.
  - `repairs/ignore_issue` → `{"domain","issue_id","ignore": bool}` — the
    user-facing "ignore this" action; this is the closest thing to a
    "dismiss" for a Repair (it hides it from the badge count but keeps it
    in the registry).
  - Fixing a fixable issue is **not** a single WS call — it's a multi-step
    `RepairsFlow` (`async_create_fix_flow` → `async_step_*`) driven over the
    **REST** data-entry-flow endpoints (`/api/repairs/issues/fix`), the same
    machinery config flows use. Reimplementing arbitrary fix flows in
    Diorama is impractical; realistically Diorama surfaces the issue and
    deep-links to `/config/repairs` for the actual fix UI.
  - Source repo path: `homeassistant/components/repairs/websocket_api.py`.
- **Not available over WS at all**: there is no push/subscribe for Repairs —
  a client must poll `repairs/list_issues` (the frontend polls too). Plan
  for a modest interval (minutes, not seconds) — same idiom as Diorama's
  existing Open-Meteo 15-minute poll in `weather.ts`.
- **Admin-only matters for Diorama**: iframe-mode long-lived tokens and
  panel-mode `hass` objects both belong to *some* HA user — if that user
  isn't an admin, `repairs/list_issues` will error. This must degrade
  silently (hide the Repairs subsection), not break the panel.
- Related built-in integration: **`homeassistant_alerts`** (aka "HA Alerts",
  `default_config`-enabled) — pulls the public feed from
  alerts.home-assistant.io (integration-specific security/stability
  advisories) and raises them as Repairs issues automatically when they
  match something installed. Nothing Diorama needs to call directly; it
  rides the same `repairs/list_issues` feed.
  Docs: <https://www.home-assistant.io/integrations/homeassistant_alerts/>

### 2.3 `system_log` (core, built-in, loaded via `default_config`)

Python-level WARNING+ log records. Useful as a coarse "system health" signal,
not really a per-room spatial concept.

- **WebSocket command**: `system_log/list` → `{"id","type":"system_log/list"}`.
  Returns entries: `name` (logger name), `message` (list of up to 5
  deduplicated message strings), `level` (`WARNING`/`ERROR`/`CRITICAL`),
  `source` (`[filename, lineno]`), `timestamp`, `exception` (formatted
  traceback text, if any), `count` (repeat count), `first_occurred`.
- **Services**: `system_log.clear` (no fields — wipes the buffer);
  `system_log.write` (`message` required, `level` optional default
  `"error"` one of debug/info/warning/error/critical, `logger` optional).
- **Event**: `system_log_event` fires on the bus for each new record **only
  if** `system_log:` config has `fire_event: true` (not default) — so a live
  push via `subscribe_events` with `event_type: system_log_event` is
  possible but depends on the user's YAML, not guaranteed present.
- No severity beyond Python log levels; no entity/room association at all
  (a log line references a Python module, not a device). Best treated as a
  single aggregate "N warnings/errors since last viewed" indicator, not
  something placed on the plan.
- Also exposed as plaintext (not JSON) over REST: `GET /api/error_log`
  (Bearer-token authenticated, human-readable dump) — not useful for
  structured rendering, mentioned only because it's the one path that
  doesn't need the WS admin gate.

### 2.4 Logbook (core, built-in, depends on `recorder`)

A humanized reverse-chronological feed of **state changes** (plus anything
that calls `logbook.log` or registers a custom `async_describe_event`
hook, e.g. `automation_triggered`, `script_started`). This is forensic
("what happened, and why") rather than an alert stream — it doesn't fire an
independent bell/count anywhere.

- **Service** `logbook.log`: fields `name` (display name), `message`,
  `entity_id` (optional), `domain` (optional — entries with neither
  `entity_id` nor `domain` are filed under the `logbook` domain itself).
- **WebSocket commands** (`homeassistant/components/logbook/websocket_api.py`):
  - `logbook/get_events` → `{"type","start_time","end_time"?,
    "entity_ids"?, "device_ids"?, "context_id"?}` — one-shot historical
    query, exactly what you'd use for an entity/room drill-down.
  - `logbook/event_stream` → `{"type","start_time","end_time"?,
    "entity_ids"?, "device_ids"?}` — this is the one **live** logbook
    surface: first message replays the historical window, then it keeps
    pushing new entries as they occur (this is what the frontend Logbook
    page uses so it updates without refreshing).
  - Both commands are gated behind an admin-only Logbook read permission as
    of HA 0.112 (non-admin users get an error) — same caveat as Repairs.
- **REST equivalent** (documented, stable): `GET /api/logbook/<start_ts>?end_time=<ts>&entity=<entity_id>`
  → JSON array of `{when (ISO8601), name, message, domain, entity_id,
  context_user_id}`. Good fallback/reference for the entry shape even when
  reading via WS.
  Docs: <https://developers.home-assistant.io/docs/api/rest/>
- **Filtering**: `configuration.yaml` `logbook:` block supports
  `entities`/`entity_globs`/`domains` include/exclude — this is server-side
  and orthogonal to what Diorama queries; sensors with a
  `unit_of_measurement` are auto-excluded from the logbook entirely
  (numeric sensor noise would otherwise flood it).
- **Known weakness**: `context_user_id` is frequently `null` even when a
  human ultimately caused the change (e.g. an automation triggered by a
  mobile-app event doesn't always propagate the triggering user — tracked
  as home-assistant/core#90669) — don't over-promise "who did this" in the
  UI copy.
- Best use in Diorama: **on-demand**, not ambient — e.g. clicking a fixture
  opens "recent activity" via `logbook/get_events` filtered to that
  fixture's bound `entity_id`(s), not a permanently-open live feed.

### 2.5 `alert` domain (core, built-in, **YAML-only**, no UI)

A ready-made "watch an entity, escalate on a schedule, allow acknowledge"
helper — closest thing HA has to a first-class alarm/annunciator entity.

- **Config** (`alert:` top-level YAML block, one entry per alert):
  `name` (required), `entity_id` (required, the watched entity),
  `state` (default `"on"` — the "problem" value), `repeat` (minutes,
  number or list — re-notify cadence), `can_acknowledge` (default `true`),
  `skip_first` (default `false` — send immediately vs. only after first
  repeat), `notifiers` (list of `notify.*` service names), `title`/
  `message`/`done_message` (all template-capable), `data` (extra notifier
  payload).
- **Resulting entity** `alert.<name>` has **three** states: `idle` (watched
  condition false), `on` (condition true, unacknowledged), `off` (condition
  true but **acknowledged** — note: HA calls the acknowledged state `off`,
  which is unintuitive — a naive "on = bad" render would miss acknowledged-
  but-still-active alerts).
- **Services**: `alert.turn_on` (re-arm/trigger notification), `alert.turn_off`
  (this is the **acknowledge** action — same shape as any `homeassistant.turn_off`),
  `alert.toggle`. No new WS needed — this is exactly `Planner.toggleEntity`
  already does for any domain.
  Docs: <https://www.home-assistant.io/integrations/alert/>
- **Caveat**: YAML-only, requires a full HA restart to add/change — the
  audience for binding directly to `alert.*` is small (power users). Most
  "problem detector" entities in the wild are `binary_sensor.*` (template
  or device-native) — Diorama should not require an `alert:` entity
  specifically; anything binary-ish (an `alert.*`, or a `binary_sensor.*`
  with `device_class: problem`) should bind the same way, mirroring how the
  existing Safety Sensor fixture already just binds "a binary_sensor that
  means alarm when on."

### 2.6 The event bus directly (`subscribe_events` / `subscribe_trigger`)

Already the mechanism Diorama's `HassPanelAdapter`/`HassClient` use for
`state_changed`. Two more angles worth naming explicitly for this feature:

- `subscribe_events` with `event_type: "system_log_event"` (see 2.3) or a
  custom event type is a valid, cheap way to get server push for anything
  that fires a bus event — no new mechanism needed, just a new
  `event_type` filter argument alongside the existing `state_changed`
  subscription.
- `subscribe_trigger` (`{"trigger": {...}}`, same shape as an automation
  trigger config) lets a client register an automation-engine trigger
  (state, numeric_state, template, event, time_pattern, …) without writing
  an actual `automation:` entry. This is a heavier-weight option than
  filtering `state_changed` client-side (which Diorama already does very
  well via `_isSlowEntity`/`live` vs `config` channels) — worth knowing it
  exists, but not recommended as the primary mechanism here; it adds a
  second live subscription per alert-worthy entity instead of reusing the
  single firehose.
- **Not available over the WebSocket API at all**: outbound mobile-app
  "critical/actionable" push notifications (`notify.mobile_app_*`) are
  fire-and-forget service *calls* — there is no WS query to list what was
  sent, delivered, or acted on. If a future iteration wants Diorama to
  *originate* a push (not just mirror HA's own alerts), that's a one-way
  `call_service`, and any read-back of "did the user tap it" is out of
  reach of this API entirely.

## 3. Real-world / visual reference

There's no single physical object this maps to — HA's own alerting is
screen-only (a bell icon + badge in the sidebar, a dedicated Repairs page).
Two real-world families are the right visual vocabulary for an in-scene
beacon, and Diorama already has fixtures in both families:

- **Industrial stack/andon lights** — the standard "something needs
  attention, from across the room" indicator: stacked colored segments
  (red/amber/green/blue), each steady or flashing, mounted overhead.
  Commodity units run **~50–60 mm diameter per segment**, 2–4 segments
  stacked in a column roughly **150–250 mm tall**, mounted at or near
  ceiling height on machinery. This is the physical ancestor of the
  recommended **Alert Beacon** fixture shape: a small ceiling-mounted
  puck/column with a colored emissive core, functionally identical to the
  Safety Sensor fixture (`Floor.safetySensors`) already shipped —
  ceiling-mounted at the same `2743 mm` (9 ft) height, disc + LED, alarming
  → expanding pulse rings. Reuse that exact silhouette/scale for the new
  fixture rather than inventing a new size class.
- **Panel indicator/pilot lights** (used in real annunciator/burglar-alarm
  panels — same lineage as Diorama's existing Alarm Keypad fixture): small
  round lenses, commonly **16–22 mm** bezel diameter, wired into a labeled
  wall plate. This is the reference for a *wall-plate* variant if a
  ceiling puck feels wrong for a given room (e.g. mounted beside a door,
  like the alarm keypad's flush wall-snap at `WALL_HALF + 15` = 65 mm
  offset) — same snap idiom as `snapAlarmToWall`.
- **Screen-space chrome** (not a 3D object at all): the topbar bell +
  badge + drawer is a direct analog of HA's own sidebar notification bell,
  and the bottom-right toast tray should visually match the existing
  weather chip's mount point/z-order (`app.ts`'s shared canvas container)
  so the two screen-space overlays don't collide.

No literal "log event" object exists in the physical world at HA's scale;
the beacon/stack-light metaphor is the honest, legible choice, and it's
also the metaphor Diorama has already committed to twice (safety sensors,
alarm keypad).

## 4. Diorama visualization & animation design

Two coordinated pieces, deliberately reusing shipped idioms rather than
inventing new render machinery:

### 4.1 Global Alert Center (no placement — screen-space, always available)

- **New `Store.alerts: AlertsConfig`** (top-level, optional/opt-in, like
  `Store.weather`): `{ enabled?, showPersistentNotifications? (default
  true), showRepairs? (default true, silently no-ops if not admin),
  minRepairSeverity? ('warning'|'error'|'critical', default 'warning'),
  toastSeconds? (default ~10) }`. **Must** be added to
  `Planner._loadFromHa`'s explicit field list (per the standard gotcha) or
  it resets on load.
- **Planner runtime state** (not persisted): `Planner.notifications`
  (from `persistent_notification/subscribe` — kept live via the
  dispatcher push, updated in place on `ADDED`/`UPDATED`/`REMOVED`, no
  polling needed) and `Planner.repairIssues` (from `repairs/list_issues`,
  polled on a `setInterval` — same shape as the existing Open-Meteo 15-min
  poll in `weather.ts` — wrapped in try/catch so a non-admin 403 just
  clears the list instead of throwing). Both feed a single derived
  `Planner.alertFeed` getter: `{ id, severity, title, message, source:
  'notification'|'repair'|'system', createdAt, dismissible, entityHint? }[]`.
  This mirrors how `Planner.weatherNow`/`Planner.blePeople` are already
  runtime-only derived getters.
- **Topbar**: a 🔔 button (next to the existing "Kiosk link" button) with a
  small numeric badge = `alertFeed.length` (or unread count if a "seen"
  set is tracked client-locally, `localStorage`-only like the sidebar
  collapse state — never pushed to HA). Click opens a light-DOM dropdown
  list (same component pattern as `<diorama-sidebar>`'s sections):
  severity-colored left bar, title/message, a Dismiss/Acknowledge button
  routed per source (`persistent_notification.dismiss` /
  `repairs/ignore_issue` / `alert.turn_off` for a bound alert entity), and
  a "view in Repairs →" external link for non-fixable-in-Diorama issues.
- **Toast tray**: bottom-right, alongside the weather chip's mount point —
  new/changed alerts pop a transient card for `toastSeconds` (reuse the
  camera-alert snapshot-card idiom: a fixed-position screen card, not a
  scene object) then collapse into the bell badge. Rate-limit/collapse
  bursts the same way the doorbell system caps to 8 items/8s — an HA
  restart firing a dozen persistent notifications at once must not paper
  the screen in toasts.
- **Kiosk/view mode**: bell + drawer render read-only in `kiosk` (an
  acknowledge tap is allowed, matching the alarm-keypad precedent of
  "kiosk can operate safety-relevant controls"); `view` mode shows the
  drawer but every action is refused, matching `Planner.toggleEntity`'s
  existing view-mode guard.
- **Bubble-system tie-in** (nearly free, existing hook): fold new alerts
  into the same `_recentTrigs` rolling list `three-view._tickOnce` already
  builds for the light/switch/TV "recent trigger" thought-bubble tier —
  a fresh critical alert within 3500 mm of a rig triggers the existing
  `BUBBLE_POOL_TRIGGER`-style reaction (😲) with a new `alert` key, no new
  bubble machinery.

### 4.2 Optional placeable "Alert Beacon" fixture (spatial, opt-in per alert)

For alerts a user *wants* pinned to a room (typically an `alert.*` entity
or a `binary_sensor` standing in for one — e.g. "freezer alert",
"sump pump alert"), add a fixture that is a near-clone of the shipped
Safety Sensor recipe:

- **Types** (`types.ts`): `AlertBeacon { id, x, y, height? (default 2743,
  same as SafetySensor), entityId?, label?, locked?, hidden?, localState?
  }` on `Floor.alertBeacons: AlertBeacon[]` (repairFloor + defaultFloor
  backfill `[]`, per the standard per-floor-field gotcha).
- **Geometry defaults** (`geometry.ts`): ceiling puck footprint/size
  identical to the safety-sensor constants; a small palette
  `ALERT_STATE_COLORS` (`idle` = dim gray, `on`/unacknowledged = pulsing
  red, `off`/acknowledged = steady amber) mirroring `ALARM_STATE_COLORS`'
  shared-2D-and-3D pattern — this directly handles the `alert` domain's
  three-state (`idle`/`on`/`off`) quirk from §2.5.
  `Planner.effectiveState(item)` resolves bound-vs-`localState` exactly
  like every other unbound-capable fixture, so an Alert Beacon with no
  `entityId` can still be flipped locally for demoing.
- **2D**: tool `alert` (🔔), `drawAlertBeacons` (disc + state color,
  alarming → expanding pulse rings, same `performance.now()`-based
  animation as `drawSafetySensors`), `hitAlertBeacon`, drag kind `alert`,
  free placement (no wall snap, matching safety sensors, not the alarm
  keypad's wall-flush behavior — a beacon reads fine mid-ceiling).
- **3D**: `_alertGroup` + `updateAlertBeacons(beacons, stateProvider)`
  under a new `_keyAlert` dirty key (configRev + each beacon's resolved
  severity/ack state) — **forced every frame while any beacon is alarming**
  (the fireplace/safety-sensor idiom, needed for the expanding-ring
  animation, which is cheap because the whole group is small). Ceiling
  disc + LED + up to 3 expanding flat rings (`RingGeometry`/
  `MeshBasicMaterial`, the documented flat-material exemption already used
  for doorbell pulses). Rides the **sensors** layer like safety sensors,
  alarm panels, and BLE proxies (no new layer needed).
- **Sidebar**: `_section('alerts', 'Alert Beacons', …)` — bind row (entity
  picker scoped to `alert.*` primarily, but not domain-locked — any
  binary-ish entity should be selectable, same looseness as the Safety
  Sensor binder), label, lock, a Test button when unbound (flips
  `localState`, disabled when bound — identical UX to the Safety Sensor's
  Test button).
- **Click behavior**: clicking a beacon (2D click-vs-drag, 3D raycast
  `userData.kind === 'alert'`) calls `alert.turn_off` (acknowledge) when
  bound and in `edit`/`kiosk` mode; unbound → `Planner.toggleItem` flips
  `localState` for demoing. `view` mode never opens/acts (existing
  guard pattern).
- **`_isSlowEntity`**: bound Alert Beacon entity ids are config-path
  (structural fixture bind, like every other fixture id already listed
  there) — `alert.*` only changes state a handful of times a day, so this
  is cheap.

### 4.3 What NOT to build a beacon for

- **System log** — no entity/room association exists; keep it as an
  aggregate count feeding the topbar bell only (or a "System Health" sidebar
  subsection with the raw `system_log/list` rows), never a scene object.
- **Logbook** — inherently a query, not a live alert; surface as an
  on-demand "recent activity" popover triggered from a fixture's existing
  info/edit affordance (calls `logbook/get_events` filtered to that
  fixture's bound entity id(s) over a short window, e.g. last 24 h),
  not a persistent visual.

## 5. Integration steps

Two independent tracks; ship the Global Alert Center first (it's pure UI +
data plumbing, no renderer work, and covers persistent_notification +
repairs + system_log), then the Alert Beacon fixture (full canvas-fixture
recipe) as a follow-up for anyone who wants a spatial anchor.

**Track A — Global Alert Center**
1. `HaApi` additions in **both** `HassClient` and `HassPanelAdapter`:
   `subscribePersistentNotifications(cb)` (WS `persistent_notification/subscribe`),
   `dismissNotification(id)` / `dismissAllNotifications()` (call_service
   wrappers), `listRepairsIssues()` (WS `repairs/list_issues`, catch/return
   `[]` on error), `ignoreRepairsIssue(domain, issueId, ignore)`.
2. `Store.alerts: AlertsConfig` — add to `_loadFromHa`'s explicit field
   list; `setAlertsConfig(mut)` mutator on `Planner` (mirrors
   `setWeather`).
3. `Planner.notifications` (kept live by the subscription callback,
   `emitConfig()` on each push) + `Planner.repairIssues` (polled
   `setInterval`, cleared on reconfigure like the weather poll) +
   `Planner.alertFeed` derived getter.
4. Topbar 🔔 button + badge (`ui/topbar.ts`); a new light-DOM drawer
   component (`ui/modals.ts` or a new `ui/alert-drawer.ts`, following the
   existing modal registration pattern in `ui/define.ts`).
5. Toast tray mount (in `app.ts`'s shared canvas container, alongside the
   weather chip) + the 45 s/8-item-style rate-limit list.
6. Wire `recentTriggers`-style feed into `three-view._tickOnce`'s existing
   bubble-trigger builder for the free bubble-system tie-in.

**Track B — Alert Beacon fixture (canvas-fixture recipe)**
1. `types.ts`: `AlertBeacon` type + `Floor.alertBeacons: AlertBeacon[]`.
2. `geometry.ts`: size/height defaults + `ALERT_STATE_COLORS`/`alertStateColor`.
3. `canvas-render.ts`: `drawAlertBeacons` + gate in `drawAll` (rides the
   `sensors` layer, no new `Layers2D` key needed).
4. `canvas-hit.ts`: `hitAlertBeacon`.
5. `canvas-interact.ts`: place-tool (`alert`), drag kind `alert`, delete,
   cursor, click-vs-drag → `alert.turn_off`/`toggleItem`.
6. `sidebar.ts`: `_section('alerts', …)`, `TOOLS` entry, tool hint.
7. `three-renderer.ts`: `_alertGroup` (declare, `scene.add`,
   `clearTransientGroups`, `destroy`, `setLayerVisibility` under `sensors`),
   `updateAlertBeacons` builder (disc + LED + expanding rings).
8. `three-view.ts`: `_keyAlert` dirty key (configRev + per-beacon resolved
   state), force-every-frame-while-alarming clause, raycast case for
   `userData.kind === 'alert'`.
9. `repairFloor` + `defaultFloor`: backfill `alertBeacons: []`.
10. Test page: `alert-test.html` mirroring `robot-test.html`'s pattern
    (assert beacon state-color resolution, click→acknowledge routing,
    dirty-key rebuild-on-state-change).

## 6. Potential additional features

- **Deep-link "Fix" button** for `is_fixable` Repairs issues that just
  opens `/config/repairs` in a new tab rather than reimplementing
  `RepairsFlow` — cheap, honest about the limitation.
- **Per-room alert rollup**: since Alert Beacons carry a `roomId` (via the
  existing fuzzy room resolver), a room label could show a small "⚠️ N"
  count, same idiom as the room occupancy glow.
- **Severity-based routing** in the Global Alert Center: only `error`/
  `critical` Repairs issues toast; `warning` ones sit silently in the
  drawer badge — configurable via `minRepairSeverity`.
- **Historical drill-down** panel using `logbook/get_events` scoped to a
  fixture's bound entity id(s) when the user opens that fixture's sidebar
  editor — "last 10 changes" list, read-only, no new fixture needed.
- **Voice/companion-app parity note**: since outbound mobile push can't be
  read back (§2.6), a future "Diorama also pushes critical alerts to your
  phone" feature would be one-way (`notify.mobile_app_*` call_service) and
  should be pitched as a convenience, not a synced state.
- **Acknowledge-from-anywhere**: since `alert.turn_off` is a normal
  service call, the same acknowledge action could be exposed from the 2D
  fixture, the 3D beacon, AND the topbar drawer — all three already route
  through the same `Planner.toggleEntity`/`toggleItem`, so this is nearly
  free once Track A + B both exist.
- **Snoozing**: a client-local (never HA-persisted) "snooze 1h" per
  `notification_id`/`issue_id`, stored like the sidebar's collapsed-section
  set (`localStorage`, try/catch-guarded) — useful for a known transient
  issue the user doesn't want re-toasting every restart.

## 7. Open questions & risks

- **Admin-gating asymmetry**: `repairs/*` and `logbook/*` WS commands are
  admin-only; `persistent_notification/*` is not. A non-admin viewer of a
  kiosk tablet will see notifications but silently miss Repairs/Logbook —
  needs to degrade invisibly (no error toast about *that*), and the docs/
  UI copy should not promise "all HA issues" universally.
- **No push for Repairs or system_log**: both require polling, trading
  staleness against WS chatter. A 2–5 minute interval (Repairs change
  rarely) is likely fine but is a judgment call, not a spec.
- **Notification storms**: HA startup, an integration reload, or a
  misbehaving automation can fire many `persistent_notification.create`
  calls in a burst. The rate-limit/collapse behavior (borrowed from the
  doorbell 8 s/8-item cap) is a design choice that needs tuning against
  real logs, not just doorbell-scale bursts.
- **`alert` domain's small addressable audience**: YAML-only, restart-to-
  edit, no UI config flow — most users will never hand-write an `alert:`
  block. The Alert Beacon fixture should NOT domain-lock to `alert.*`;
  binding any `binary_sensor`/similar (as the existing Safety Sensor
  fixture already does) is what makes it broadly useful. Treat `alert.*`
  as the *ideal* case (three-state, acknowledge built in), not the only
  supported case.
- **Severity is inconsistent across sources**: Repairs has a real
  3-level enum; persistent_notification has none; `alert` has none either
  (just on/off/idle); system_log has Python log levels. Any unified
  "critical/warning/info" badge coloring in the Global Alert Center is
  necessarily a heuristic mapping (e.g., persistent_notification → always
  "info" unless title/message matches known-bad substrings) — flag this
  as approximate in the UI, don't oversell precision.
- **Context/attribution gaps**: `context_user_id` is unreliable (§2.4) —
  don't build a "who did this" feature on top of it without a fallback
  ("automation" / "unknown").
- **Sensitive data in `translation_placeholders`/Repairs `data`**: some
  integrations may include instance-specific details (paths, entity ids,
  version strings) not meant for a shared/kiosk-visible screen — the
  Global Alert Center should probably be edit-mode-visible by default and
  require an explicit opt-in to show in `kiosk`/`view` (unlike the alarm
  keypad, which is deliberately kiosk-safe).
- **`logbook`/`recorder` may be disabled**: a minimal/performance-tuned HA
  install can run without `recorder` (and therefore without `logbook`).
  The on-demand drill-down feature must check `get_services`/an initial
  probe call and no-op cleanly rather than erroring.

## 8. Sources

- <https://www.home-assistant.io/integrations/persistent_notification/>
- <https://github.com/home-assistant/core/blob/dev/homeassistant/components/persistent_notification/__init__.py>
- <https://github.com/home-assistant/core/issues/68811> (notify-shim notifications lack stable `notification_id`)
- <https://developers.home-assistant.io/docs/core/platform/repairs/>
- <https://github.com/home-assistant/core/blob/dev/homeassistant/components/repairs/websocket_api.py>
- <https://www.home-assistant.io/integrations/repairs/>
- <https://www.home-assistant.io/integrations/homeassistant_alerts/>
- <https://github.com/home-assistant/core/blob/dev/homeassistant/components/system_log/__init__.py>
- <https://www.home-assistant.io/integrations/logbook/>
- <https://github.com/home-assistant/core/blob/dev/homeassistant/components/logbook/websocket_api.py>
- <https://developers.home-assistant.io/docs/api/rest/> (`/api/logbook/<ts>`, `/api/error_log`)
- <https://www.home-assistant.io/integrations/alert/>
- <https://developers.home-assistant.io/docs/api/websocket/>
- <https://gist.github.com/mhagger/f1cc7844a7736bd5258d953e0a22b398> (full grepped WS command inventory)
- <https://github.com/home-assistant/core/issues/90669> (context_user_id propagation gap)
- <https://community.home-assistant.io/t/logbook-access-now-restricted-to-admin-v0-112-2-logged-websocket-api-error/209635> (Logbook admin gating, HA 0.112)
- <https://en.wikipedia.org/wiki/Stack_light> (andon/stack light real-world reference)
