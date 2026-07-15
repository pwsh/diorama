# Calendar-on-wall + News/Weather-on-TV surfaces

Research doc for a Diorama feature: a wall-mounted calendar fixture showing
upcoming events, and "screen surface" content (news ticker, weather) rendered
onto bound TV furniture. Build-ready reference — no implementation yet.

## 1. Summary

Diorama already renders bound TVs with a now-playing card (artist/title +
album art) and a generic furniture/fixture recipe for wall-mounted items
(switches, alarm panels, floodlights). This feature adds two related but
separable surfaces:

- **Wall calendar fixture** — a new small wall-plate fixture (mirrors the
  alarm-keypad / switch recipe) bound to one or more HA `calendar.*` entities,
  showing the next 1–3 upcoming events as a compact wall plaque in 2D and 3D
  (day/date + short event list), refreshed on a slow poll (calendars don't
  push live diffs the way sensors do — see §2).
- **TV surfaces** — when a `media_player`-bound TV (or a new explicit
  "smart display" binding) is NOT already showing now-playing media, it can
  display one of a small set of "screensaver" content modes: a scrolling news
  ticker (from an RSS/`feedreader`-style source) and/or a weather summary
  card, reusing Diorama's *already-shipped* weather core (`Planner.weatherNow`,
  `weather.get_forecasts` support) as the data source for the weather mode.

This fits Diorama's whole premise — a spatial mirror of the house — because
these are exactly the two "information surfaces" a real house already has
(the calendar stuck to the fridge/hallway wall, the TV idling on a weather/
news channel when nobody's watching anything). Both ride entirely on
mechanisms Diorama already has: `_isSlowEntity` config-path polling, a
`stateProvider`-driven `_keyFloor`-style dirty key, `CanvasTexture` sprite
text (already used for env-sensor readouts, now-playing cards, name labels),
and the existing now-playing card lifecycle for the TV case.

## 2. Home Assistant data model

### 2.1 `calendar` domain (core)

Source: `developers.home-assistant.io/docs/core/entity/calendar/`,
`home-assistant.io/integrations/calendar/`,
`home-assistant.io/actions/calendar.get_events/`.

- **Entity state**: `on` = "the calendar has an active event right now",
  `off` = no active event (plus the usual `unavailable`/`unknown`). The state
  and its attributes reflect **only the current-or-next single event** — a
  calendar entity is NOT a live feed of the whole agenda.
- **Per-entity attributes** (as surfaced by core calendar platforms /
  Lovelace's calendar card, e.g. Google Calendar, CalDAV, Local Calendar):
  `message` (event title), `all_day` (bool), `start_time`, `end_time`,
  `location`, `description`. These names are attribute-dict conventions used
  across the built-in platforms, not a formally documented stable contract —
  treat them as best-effort display strings, not required fields.
- **`CalendarEvent` dataclass** (`developers.home-assistant.io`): the object
  returned by the entity's `async_get_events()` and by the `get_events`
  action — fields `start` (datetime|date), `end` (datetime|date), `summary`
  (str, required), `location` (str, optional), `description` (str,
  optional), `uid` (str, optional), `recurrence_id` (str, optional), `rrule`
  (str, optional). All-day events use `date` not `datetime` for start/end.
- **Action: `calendar.get_events`** (`home-assistant.io/actions/calendar.get_events/`)
  — the action to fetch **a range of upcoming events**, which is what a wall
  calendar needs (the entity state alone only gives you the next event).
  - Target: one or more `calendar.*` entities (also accepts device/area/
    floor/label targets that resolve to calendar entities).
  - Data fields: `start_date_time` (optional, defaults to now),
    `end_date_time` (optional, exclusive) OR `duration` (a duration map, e.g.
    `{hours: 24}`) — end and duration are mutually exclusive.
  - **Returns response data** (`response_variable` in YAML / `return_response:
    true` over the API) keyed by entity id, each with an `events` list of
    `{summary, start, end, description?, location?}`. Example:
    ```yaml
    action: calendar.get_events
    target:
      entity_id: [calendar.school, calendar.work]
    data:
      duration: { hours: 24 }
    response_variable: agenda
    ```
    This is the **exact same shape** as `weather.get_forecasts`, which
    Diorama's `HaApi.getWeatherForecasts` already calls via WS
    `call_service` + `return_response: true` — implement
    `HaApi.getCalendarEvents(entityIds, start, end|duration)` the same way in
    **both** `HassClient` and `HassPanelAdapter`.
  - **Action: `calendar.create_event`** (`home-assistant.io/actions/google.create_event/`
    and the calendar integration page) — optional "add event from Diorama"
    future feature: `summary`, `description`, `location`, plus either
    `start_date_time`/`end_date_time` (timed) or `start_date`/`end_date`
    (all-day) — never mix the two pairs.
- **WebSocket subscription**: `calendar/event/subscribe` (developer docs) —
  a dedicated WS subscription (`entity_id`, `start`, `end`) that pushes
  event objects (`start`, `end`, `summary`, `description`, `location`) for
  a date window. This is closer to "live" than polling `get_events`, but it
  is **not** the generic `state_changed` stream Diorama's live/config
  channels are built around — it would be a **third, calendar-specific**
  subscription type, so the pragmatic v1 path is a plain poll of
  `calendar.get_events` on a timer (like weather's 15 min Open-Meteo poll or
  the 30 min forecast refresh), not a new subscription channel.
  **Not available over generic `state_changed`**: the full agenda / event
  list never appears in `hass.states[calendar.x]` — only the single next/
  current event's attributes do. Any "show the next 3 events" UI MUST call
  `get_events` (or the WS subscribe) rather than reading state attributes.
- **Core calendar platforms** relevant to "which entities exist to bind to":
  Google Calendar (`integrations/google/`), CalDAV (`integrations/caldav/`),
  Local Calendar (`integrations/local_calendar/`, stores an `.ics` file,
  origin for a "family whiteboard" calendar created *inside* HA), plus
  Todoist, Office 365, iCloud (via CalDAV), etc. — all core, all expose the
  same `calendar.*` entity/action contract. `local_calendar` is the
  lowest-friction demo/test source since it needs no external account.
- **`calendar.initial_color`**: an optional hex color a platform can set on
  the entity (used by Lovelace's calendar card to tint events) — a natural
  source for a per-calendar tint on the wall-calendar fixture, with
  `Sensor.color`-style manual override as the fallback (Diorama already has
  this exact "entity-color-with-manual-override" idiom for mmWave sensors).

### 2.2 News sources

No single core "news" domain exists in HA; three realistic entity sources,
in ascending order of "already gives you a friendly-title + description list
in one entity":

- **`feedreader` (core, config-flow)** — polls an RSS/Atom URL (default
  hourly) and fires `event_type: feedreader` bus events per new entry
  (`title`, `link`, `description`, `content`, `feed_url` in `event.data`).
  Home Assistant Core 2024.8 added an **Event entity** (`event.*` domain,
  read via `hass.states`) per configured feed that always reflects the
  **latest single entry** — same "one item only" limitation as calendars.
  Good for a single "latest headline" ticker item but not a multi-headline
  scroll list without also listening to the event bus (which is not exposed
  over the generic `state_changed` WS stream Diorama consumes — it is a
  separate HA event, not an entity state change).
- **`feedparser` (HACS custom component, `custom-components/feedparser`)** —
  creates a **`sensor.*`** entity whose *state* is the entry count (or
  `show_topn`) and whose **attributes hold the actual list** of parsed
  entries (`title`, `link`, `description`/`summary`, `published`/`updated`,
  `image`), each entry addressable as an attribute list — this is the
  practical "give me N headlines in one entity's attributes" shape a
  scrolling ticker wants, and it rides the normal `state_changed` stream
  Diorama already listens to (config-path polling, same as any `sensor.*`).
  **Custom/HACS, not core** — flag this clearly to the user; it needs to be
  separately installed.
- **Ad-hoc `newsapi.org` sensor** — community-authored template/REST sensor
  patterns exist (no maintained integration); not worth building a bespoke
  Diorama hook for — treat any such entity as a generic bindable
  `sensor.*` (title/summary in an attribute) rather than special-casing it.

**Recommendation**: bind the "news mode" TV surface to **any `sensor.*` (or
`event.*`) entity whose attributes contain a headline-shaped payload**,
generically — mirroring how Diorama already treats `EnvKind: generic` for
unrecognized sensors. Don't hard-code feedparser's exact attribute schema;
read `attributes.title`/`.headline`/`.summary`/first-list-item defensively,
and let the user's binding be "best effort," same spirit as the entity
picker's free-text domain filter. This also sidesteps having to hard-depend
on a specific HACS package.

### 2.3 Weather-on-TV

No new HA data needed — Diorama's weather core (`docs` "Weather core"
section, `src/weather.ts`, `Planner.weatherNow`) already normalizes
`WeatherNow {condition, tempC, windKmh, windBearing, isDay, stale, label?,
forecastCondition?}` from entity/sensors/Open-Meteo sources, and
`HaApi.getWeatherForecasts(entityId, 'daily'|'hourly')` already wraps
`weather.get_forecasts` (`return_response: true`) in both `HassClient` and
`HassPanelAdapter`. The TV weather surface is purely a **new rendering
target** for data Diorama already has live — no new HA calls.

## 3. Real-world / visual reference

### Wall calendar

- Physical analogues: a magnetic whiteboard calendar or a wall-mounted
  tablet (Skylight Calendar, Google Nest Hub in wall-mount) — typically
  **250–400 mm** wide, **200–300 mm** tall, ~20–30 mm proud of the wall,
  hung at eye height (≈1500–1650 mm sill-to-center, similar to a light
  switch's 1200 mm but higher — picture frame height). A safe default:
  `w=350, h=250` mm footprint (as a wall-plate box, like the alarm panel),
  mounted at `height ≈ 1600` mm.
- Visual: light plaque/frame body, a header band with today's date, then
  2–3 compact event rows (time + truncated title), color-dotted per source
  calendar (reusing `initial_color` / a `color` field). Minimal chrome —
  it's a background-detail fixture, not a focal 3D showpiece.

### TV surfaces

- No physical object to model — this reuses the existing bound-TV
  `Furniture` (`tv` kind) geometry exactly as built today; only the
  **content painted onto/above it** changes. Real-world reference is just
  "a TV screensaver/idle screen": a bottom-third scrolling news ticker (CNN/
  weather-channel style, dark translucent bar + white scrolling text) and/or
  a centered weather glyph + temperature, matching cable-weather-channel
  conventions users already recognize at a glance.

## 4. Diorama visualization & animation design

### 4.1 Wall calendar fixture (new fixture, canvas-fixture recipe)

Follows the **alarm-keypad / floodlight recipe** exactly (wall-snap
fixture, own type, own tool):

- **Type** (`types.ts`): `CalendarPanel` — `{id, x, y, rotation, height?,
  w?, h?, calendarIds: string[], label?, locked?, hidden?}`. Multiple
  `calendarIds` supported (a household often has 2–3 calendars); `types.ts`
  → `Floor.calendarPanels: CalendarPanel[]` with `repairFloor` backfilling
  `[]` (same as `alarmPanels`).
- **Defaults** (`geometry.ts`): `CALENDAR_PANEL_W = 350`, `_H = 250`,
  default mount `height = 1600`. Wall-snap via a new `snapCalendarToWall`
  mirroring `snapAlarmToWall` (flush, offset `WALL_HALF + 15`, rotation
  `atan2(nx, ny)`, no ganging).
- **Data fetch (not `state_changed`)**: calendars don't push full agendas
  over the live/state stream (§2.1). `Planner` needs a **new poll path**,
  same shape as weather's 15/30-minute refresh: `Planner._refreshCalendars()`
  calls the new `HaApi.getCalendarEvents(entityIds, nowISO, {hours: 48})`
  (WS `call_service` `calendar.get_events` + `return_response: true`,
  normalized like `normalizeForecasts`) on connect + every ~10–15 min + when
  a bound calendar's *entity state* flips `on`↔`off` (that flip IS visible
  over `state_changed`, and it's a cheap trigger to refresh sooner — treat
  bound calendar ids as **slow/config-path** in `_isSlowEntity`, matching
  the weather-entity precedent, so the sidebar's next-event line refreshes
  on state change even though the full list is a separate poll). Cache the
  last-fetched event list per `CalendarPanel` (`Planner.calendarEvents:
  Record<panelId, {summary,start,end,allDay,location?,calId}[]>`), never
  persisted (runtime, like `weatherNow`).
- **2D** (`drawCalendarPanels` in canvas-render, gated by a `calendar` layer
  entry or folded into the existing `sensors` layer like alarm/BLE — pick
  `sensors` to avoid a new layer toggle unless the user wants one): a small
  wall plaque rect, header shows today's weekday/date, body lists the
  next 2 events truncated (`HH:mm  Title`), a small color dot per source
  calendar to its left. Unbound / no events → dim placeholder ("No events").
  Hit test `hitCalendarPanel`; drag kind `calendar`; click opens a detail
  popover or the existing sidebar section (no need for a bespoke modal —
  unlike the alarm panel there's no control action here, it's read-only,
  so a simple sidebar-section detail view is enough; a lightweight
  `<diorama-calendar-modal>` mirroring the alarm modal's structure is a
  nice-to-have, not required for v1).
- **3D**: `_calendarGroup` + `updateCalendarPanels(panels, events)` — a flat
  wall-mounted box (like the alarm keypad screen) plus a **camera-facing
  `THREE.Sprite`** (the established env-sensor/now-playing/name-label
  idiom) painted via `CanvasTexture`: date header + up to 3 event lines.
  Repaint the canvas only when the underlying text changes (same
  cache-and-compare idiom as `_syncNameLabel`); **must** go through
  `_disposeSpriteMaps` before rebuild/clear/destroy (sprite-dispose
  gotcha, same as env sprites / now-playing cards / GPS pins). Dirty key
  `_keyCalendar` = `configRev` + a hash of `(panelId, calendarIds, event
  count, first-event-start bucket)` — cheap, doesn't need per-frame
  animation (a calendar plaque is static between refreshes, unlike the
  fireplace/weather-particle cases that force-rebuild every frame).
  Visibility rides the **sensors** layer (`_calendarGroup.visible =
  v.sensors`), matching alarm/BLE precedent, unless a dedicated toggle is
  wanted.
- **Sidebar**: `_section('calendar', 'Wall Calendar', …)` — bind row(s) via
  the entity picker (domain `calendar`, multi-select — Diorama already has
  a "multi-select" precedent per the recent changelog entry "multi-select"),
  label, lock, height/size, plus a live-preview list of the next few fetched
  events (debug/confirmation, same spirit as the GPS status line).

### 4.2 TV surfaces (news ticker + weather-on-TV)

This is a **content mode on existing bound TV furniture**, not a new
fixture type — extend `Furniture` with an optional `screenMode?:
'off'|'now_playing'|'news'|'weather'|'auto'` (default `'auto'`: show
now-playing when a bound `media_player` is actually playing, else fall back
to whatever screen mode is configured, else blank/off). This slots directly
into the **already-shipped now-playing pipeline**:

- **Data**:
  - News: bind `Furniture.newsEntity?: string` (any `sensor.*`/`event.*`);
    Planner reads its attributes defensively (`title`/`headline`/`summary`
    fields, or the first item of an array-shaped attribute) into a small
    rolling list, refreshed on the entity's normal `state_changed` push (no
    new poll — `sensor.*` is already live/config per `_isSlowEntity` rules;
    treat it as config-path since ticker text changing is a "structural"
    enough change to want prompt reconciliation, mirroring the now-playing
    title/picture hash).
  - Weather: no new binding — reuse `Planner.weatherNow` directly (a TV
    doesn't need its own weather entity picker at all, since Diorama
    already has one global weather source).
- **3D rendering — reuse the now-playing sprite group, don't build a
  parallel one**: extend the existing `_nowPlayingGroup` /
  `updateNowPlaying`-style builder (outside `_floorGroup`, so `_keyFloor`
  rebuilds don't churn it) to also accept a news/weather payload per
  furniture id, keyed the same way `_keyNowPlaying` already is (configRev +
  layer flags + per-media hash) — add the news/weather text + a coarse
  "changed" bucket into that same hash rather than inventing
  `_keyNewsWeather`. Two concrete sprite treatments:
  - **News ticker**: a **wide, short** camera-facing sprite anchored at the
    TV's bottom edge (a strip, not a card) painted with the current
    headline; **scrolling text** is not a shader/marquee — it's the
    idiomatic Diorama trick already used for the fireplace flicker /
    doorbell pulse: **advance a scroll-offset each frame and repaint the
    `CanvasTexture` only every N frames** (or just redraw at, say, 6–10 Hz —
    cheap 2D canvas text draw, not per-frame-every-frame like the fireplace
    flicker) drawing the headline string at `x = width − (elapsed * pxPerSec
    % (textWidth + width))`, clipped to the strip — a classic canvas
    ticker. This is cosmetic-only (not a new dirty-key axis powering
    anything else), so it can live in a small per-rig `newsScrollT`
    accumulator advanced in `_animate`/`updateTargets`-style per-frame hook,
    independent of the `_keyNowPlaying` rebuild (rebuild repaints the base
    headline text/bitmap; the scroll offset re-renders that same texture's
    canvas each tick without needing a full Three.js object rebuild).
    Multiple headlines: rotate through them every ~8–12 s (same "hold N
    seconds then swap" idiom as the thought-bubble tier system).
  - **Weather-on-TV**: a **centered card** sprite: condition glyph (share
    the weather chip's glyph mapping), big temp, place label — essentially
    the existing `<diorama-weather-chip>` content re-rendered onto a
    `CanvasTexture` instead of DOM. Static-ish (redraw only when
    `weatherNow` fields change), no scroll needed.
  - Both modes should sit in the **same screen-facing rectangle the
    now-playing "art" occupies** conceptually, or better — actually render
    them as a plane roughly matching the TV's screen bounds (TV furniture
    already has known `w`/`h`; a `PlaneGeometry` with the `CanvasTexture`
    as its map, using the same **`_mat`-exemption granted to `PointsMaterial`/
    `SpriteMaterial`**: a flat unlit screen image is a legitimate exemption
    from the toon-shading factory, same reasoning as weather particles —
    document it that way rather than forcing a `MeshToonMaterial` on a
    screen texture, which would look wrong lit).
- **2D**: append a small `📰 <ticker text>` / `⛅ 22°C` line under the TV
  icon (mirroring the existing `♪ title` now-playing line in
  `canvas-render`), no scrolling needed in 2D (2D is glanceable, not
  screen-accurate).
- **localState / unbound**: an unbound TV with `screenMode` set to
  `news`/`weather` still renders that content (these modes need no
  `media_player` at all — they're independent of `Planner.toggleItem`/
  `effectiveState`); only `now_playing` mode depends on a bound
  `media_player`. Clicking an unbound news/weather-mode TV should still
  flip `localState` on/off (power) per the existing local-control
  convention — screen content is independent from on/off power state,
  though a sensible default is "no content drawn while the TV's
  effective/local state is off," matching a real TV.
- **Sidebar**: extend the existing TV furniture editor (where entity
  binding + kind live) with a "Screen" subsection: mode dropdown
  (Auto/Now playing/News/Weather/Off), a news-entity bind row (domain
  filter `sensor`, generic), no config needed for weather (global).

## 5. Integration steps

**Wall calendar fixture** (new canvas fixture, follow the alarm-panel
template file-by-file):
1. `types.ts`: add `CalendarPanel`, `Floor.calendarPanels: CalendarPanel[]`.
2. `geometry.ts`: size/height defaults, `snapCalendarToWall`.
3. `ha-client.ts` (both `HassClient` + `HassPanelAdapter`): add
   `getCalendarEvents(entityIds, startISO, endISO|duration)` → WS
   `call_service` `calendar.get_events` with `return_response: true`;
   normalize into a flat `{summary, start, end, allDay, location?,
   calendarId}[]` (mirror `normalizeForecasts`).
4. `planner.ts`: `repairFloor`/`defaultFloor` backfill `calendarPanels: []`;
   `_refreshCalendars()` poll (connect + timer + on bound-entity `on`↔`off`
   flip), `Planner.calendarEvents` runtime cache; mark bound calendar ids
   config-path in `_isSlowEntity`.
5. `canvas-render.ts`: `drawCalendarPanels` (+ `drawAll` gating, likely
   under the `sensors` layer).
6. `canvas-hit.ts`: `hitCalendarPanel`.
7. `canvas-interact.ts`: drag kind `calendar`, place-tool, delete-tool,
   cursor, wall-snap on drop/move-release.
8. `sidebar.ts`: TOOLS entry (🗓️), `_section('calendar', …)` — multi-bind,
   label, lock, height, live preview of fetched events.
9. `three-renderer.ts`: `_calendarGroup` (declare, `scene.add`,
   `clearTransientGroups`, `destroy`, `setLayerVisibility` under
   `sensors`), `updateCalendarPanels` builder using the sprite-text idiom
   (`_disposeSpriteMaps` pairing).
10. `three-view.ts`: `_keyCalendar` dirty key (configRev + per-panel event
    hash), call the builder when it changes.
11. Regression/test page: a small `calendar-test.html` verifying
    `getCalendarEvents` normalization + panel geometry defaults (follow the
    `weather-test.html` pattern).

**TV news/weather surfaces** (extend existing furniture + now-playing
pipeline):
1. `types.ts`: `Furniture.screenMode?`, `Furniture.newsEntity?`.
2. `planner.ts`: read `newsEntity` attributes defensively into a small
   rolling headline list; mark config-path in `_isSlowEntity`; no new
   network path for weather (already have `weatherNow`).
3. `three-renderer.ts`: extend the now-playing sprite builder to accept
   news/weather payloads; add the ticker scroll-offset per-frame advance
   (own small persistent state per TV rig, not a dirty-key input); add the
   flat unlit screen-plane material as a documented `_mat` exemption
   alongside `PointsMaterial`/`SpriteMaterial`.
4. `three-view.ts`: fold news/weather text/state into the existing
   `_keyNowPlaying` hash (don't invent a parallel key).
5. `canvas-render.ts`: append the 2D `📰`/`⛅` line next to the existing
   `♪` now-playing line.
6. `sidebar.ts`: TV furniture editor "Screen" subsection (mode dropdown +
   news-entity bind).
7. Regression: extend `nowplaying-test.html` (or a small sibling) to cover
   the new modes.

## 6. Potential additional features

- **`calendar.create_event`** — let the wall-calendar fixture's detail
  popover add a quick event back to a (writable) calendar, e.g.
  `local_calendar`, turning the fixture into an actual family-whiteboard
  input surface, not just a readout.
- **Countdown chip** — a "N days until <next big event>" mode on the wall
  calendar (e.g. next `all_day` event further out), reusing the same
  fetched list.
- **Per-person calendar color coding** — if `Store.people` entries map to
  calendars (a natural pairing with the existing People registry), tint
  each event row by the owning person's `color` instead of the raw
  calendar's `initial_color`.
- **"Today" glow on the wall calendar** — pulse or highlight the header
  when an event is imminent (<30 min), reusing the doorbell/safety-alarm
  pulse-ring idiom (`TransientPulse`).
- **Multiple TVs, different modes** — since `screenMode` is per-furniture,
  a kitchen TV could show weather while a living-room TV shows news,
  independently — no extra plumbing needed given the per-item field design.
- **Voice/notification tie-in** — surface `feedreader`'s bus events (not
  currently visible to Diorama's `state_changed`-only listening) as a
  "breaking news" transient pulse if a future generic HA-event listener is
  ever added — explicitly out of scope for this feature (see risks).
- **Weather-on-TV using forecast, not just now** — a 3-day mini-forecast
  strip using the already-implemented `getWeatherForecasts('daily')` call,
  rather than just current conditions.

## 7. Open questions & risks

- **Calendar polling cost/staleness**: unlike weather (15 min is fine for
  outdoor conditions), a family expects a just-added calendar event to show
  up "soon." A 10–15 min poll plus an on-`state_changed`-flip nudge is a
  reasonable compromise but is NOT real-time; the WS `calendar/event/
  subscribe` channel would be more real-time but is a new, calendar-specific
  subscription type Diorama's architecture doesn't have a precedent for
  (its two channels are both keyed off generic `state_changed`) — worth a
  deliberate decision (poll now, subscribe later) rather than silently
  under-building.
- **Attribute names are convention, not contract**: `message`/`all_day`/
  `start_time`/`end_time`/`location`/`description` on the calendar entity's
  *state* attributes are what core platforms happen to set, not a
  documented stable API (the developer docs only formally define the
  `CalendarEvent` object returned by `get_events`/`async_get_events`).
  Build the wall calendar to read exclusively from `get_events` responses,
  never from raw state attributes, to avoid depending on undocumented
  shape.
- **No good core "news" entity**: the honest options are (a) a single
  latest-headline `event.*` entity from core `feedreader` (2024.8+), or (b)
  the HACS-only `feedparser` sensor for a real multi-headline list. Recommend
  documenting in-app that a multi-headline ticker needs a HACS component
  (feedparser) or a template sensor the user builds themselves — Diorama
  should bind generically (best-effort attribute reads) rather than
  hard-coding either integration's exact schema, so it keeps working if the
  user's news source changes.
- **Vendor fragmentation on calendars**: Google/CalDAV/Local/Office365/
  Todoist all expose the same entity+action contract, so this should be
  safe — but recurring-event expansion (`rrule`), all-day date-vs-datetime
  handling, and timezone normalization are all handled server-side by
  `get_events`, so Diorama only needs to display what comes back; don't
  attempt independent RRULE expansion client-side.
- **Ticker scroll performance**: repainting a `CanvasTexture` every frame
  for smooth scrolling is more per-frame cost than Diorama's current sprite
  idioms (which repaint only on text change). Decide the actual redraw
  cadence (every frame vs. every 3rd frame vs. CSS-less discrete "shift by a
  fixed px chunk every 150 ms") during implementation — a continuous canvas
  repaint at 60 Hz for every bound TV showing news could be a real cost with
  several TVs on screen at once; consider capping to 1–2 concurrent ticker
  TVs or throttling to ~10–15 Hz repaint.
- **Screen material exemption precedent**: rendering a flat, lit-looking
  screen image via `MeshToonMaterial` would band/shade the image
  incorrectly (a TV screen emits its own light, it isn't toon-shaded like a
  wall). This needs the same documented exemption `PointsMaterial`/
  `SpriteMaterial` already have from `_mat()` — flag this explicitly in
  the CLAUDE.md "Sims-style rendering" section when implemented, or a
  future contributor will "fix" it into `_mat()` and break the look.
- **Multi-calendar panel identity**: if a wall calendar binds 2–3 calendars,
  need a decision on how to interleave/sort combined events (chronological
  merge is the obvious answer) and how to attribute color per source in
  the compact 2–3-row 3D display (a colored dot per row is cheap and
  sufficient).

## 8. Sources

- [Calendar entity — Home Assistant Developer Docs](https://developers.home-assistant.io/docs/core/entity/calendar/)
- [Calendar integration — Home Assistant](https://www.home-assistant.io/integrations/calendar/)
- [Get calendar events (`calendar.get_events`) — Home Assistant](https://www.home-assistant.io/actions/calendar.get_events/)
- [Create event in Google Calendar (`google.create_event`, shares `calendar.create_event` shape) — Home Assistant](https://www.home-assistant.io/actions/google.create_event/)
- [Local calendar — Home Assistant](https://www.home-assistant.io/integrations/local_calendar/)
- [CalDAV — Home Assistant](https://www.home-assistant.io/integrations/caldav/)
- [Google Calendar — Home Assistant](https://www.home-assistant.io/integrations/google/)
- [calendar.markdown source (integration doc source) — home-assistant/home-assistant.io GitHub](https://github.com/home-assistant/home-assistant.io/blob/current/source/_integrations/calendar.markdown)
- [Feedreader — Home Assistant](https://www.home-assistant.io/integrations/feedreader/)
- [feedreader.markdown source — home-assistant/home-assistant.io GitHub](https://github.com/home-assistant/home-assistant.io/blob/current/source/_integrations/feedreader.markdown)
- [custom-components/feedparser — GitHub (HACS RSS sensor)](https://github.com/custom-components/feedparser)
- [Full changelog for Home Assistant Core 2024.8 (feedreader Event entity)](https://www.home-assistant.io/changelogs/core-2024.8/)
- [What are the local calendar attributes? — Home Assistant Community](https://community.home-assistant.io/t/what-are-the-local-calendar-attributes/535362)
- [ICS Calendar Tools — GitHub (local_calendar add/edit/delete events)](https://github.com/randrcomputers/ics-calendar-tools)
