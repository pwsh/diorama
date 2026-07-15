# Background Text FX — Fun Playful Messages in the Diorama Backdrop

Research doc for a new Diorama feature. Build-ready reference — no further research
should be needed to implement.

## 1. Summary

Diorama is a spatial panel: a virtual copy of the home where device state renders
in place, in context. This feature adds a *playful, decorative* layer on top of
that: short text messages — a calendar reminder, a `persistent_notification`, an
`input_text` helper someone set from an automation ("Welcome home!", "Pizza's
here 🍕", "Happy Birthday!") — rendered as if **written into the world itself**
rather than as a UI toast. Four techniques are researched:

1. **Sky glow text** — a big, softly-glowing message fixed high in the sky, like
   a drive-in marquee or aurora ribbon. Best for a persistent/ambient message
   (today's next calendar event, a standing greeting).
2. **Banner-tow plane** — a small silhouette plane drags a rectangular banner
   across the sky, exactly like real beach/stadium banner-tow advertising. Best
   for a one-shot celebratory event (a notification fired, so the banner flies
   through once and is gone).
3. **Skywriting** — smoke-particle letters that puff into shape then dissipate
   on the wind, like real skywriting. Best for a special/rare event (a
   `persistent_notification` with an id like `celebration`).
4. **Lawn writing** — the message appears "mowed" or painted into the yard's
   grass, like a groundskeeper's stadium stripe pattern or a crop-circle
   message. The only style with a natural **2D plan-view** representation too
   (it has a real x/y location), so it doubles as a small yard easter egg.

This is squarely in Diorama's wheelhouse: it's a rendering feature (three.js
techniques the codebase already has idioms for — canvas-texture sprites,
`Points` particle clouds, ground-plane decals) wired to a *very thin* HA data
layer (read a string from one of a few well-known sources). It reuses more
existing patterns than it invents: the weather-effects group/dirty-key/advance
idiom (`_weatherGroup`/`_keyWeather`/`_advanceWeather`), the doorbell transient-
pulse idiom (`TransientPulse`, rebuild-only-while-active), the env-sprite /
now-playing camera-facing `CanvasTexture` idiom, and the ground-area flat-decal
idiom. Nothing here needs PBR, bloom, or a new render pass — the toon renderer's
`NoToneMapping` + flat `SpriteMaterial`/`PointsMaterial` exemption (already used
for weather particles and text sprites) is sufficient for a convincing "glowing
text" look via a canvas `shadowBlur` baked into the texture, additive blending,
and the emissive/no-tonemap look the rest of the scene already commits to.

## 2. Home Assistant data model

The message needs a **source** (where the text comes from) and, for calendar,
a **poll**. None of this needs a new integration — all sources below are HA
core. Only the *content* is generic; nothing LD2450/mmWave-specific.

### 2a. `input_text` helper (core, simplest source)

- Domain: `input_text`. Entity state **is** the message (`hass.states['input_text.diorama_message'].state`).
- Attributes: `min`, `max` (default 100, hard cap 255 — HA enforces "255 is the
  maximum number of characters allowed in an entity state" system-wide),
  `pattern` (client-side regex), `mode` (`text`|`password`), `editable`.
- Action to set it: **`input_text.set_value`** — `target.entity_id` +
  `data.value` (string, must satisfy `min`/`max`/`pattern`).
  Doc: <https://www.home-assistant.io/actions/input_text.set_value/>
- Any automation/script/voice-assistant intent can set this, making it the
  easiest "arbitrary trigger → Diorama message" hook for a user (e.g. a
  `Person: `input_text.set_value` on doorbell/arrival automations).
- **This is a plain state entity** — fully available over the WS `state_changed`
  subscription Diorama already listens to. No new WS command needed; only a
  new `_isSlowEntity` classification decision (see §4).
- The newer `text.*` domain (`text.set_value`, doc:
  <https://www.home-assistant.io/actions/text.set_value/>) is the
  integration-exposed sibling of `input_text` (e.g. an ESPHome `text`
  component) — same state/attribute shape, same `state_changed` path. Treat as
  an equivalent alternate source for entity-backed messages, not a separate
  code path.

### 2b. `persistent_notification` (core, "push a message onto the panel")

- Not an entity domain with per-item states — it's tracked in HA's
  notification registry and reachable only via its own actions + WS commands.
- Action: **`persistent_notification.create`** — `data.message` (string,
  Markdown-formatted, required), `data.title` (string, optional),
  `data.notification_id` (string, optional — **reusing an id overwrites the
  existing notification instead of adding a new one**, which is the natural
  way to model "current message" vs. one-shot bursts).
  Doc: <https://www.home-assistant.io/actions/persistent_notification.create/>
- Companion action: `persistent_notification.dismiss` (`data.notification_id`).
- **WebSocket commands** (core `homeassistant/components/persistent_notification/__init__.py`):
  - `persistent_notification/get` — one-shot: returns the current list.
  - `persistent_notification/subscribe` — subscribes; the first message is a
    `"current"` snapshot (all notifications), then push events of type
    `"added"` / `"removed"` / `"updated"`, each carrying the notification
    object(s): `{ notification_id, message, title, created_at }`.
  - These are genuinely useful for Diorama — a **new WS subscription type**,
    the same shape of work as adding `state_changed` in `ha-client.ts` /
    `ha-panel-adapter.ts`, but a **new, separate subscribe call** (not folded
    into the existing states subscription).
- This is the best source for "one-shot celebratory event": an automation
  fires `persistent_notification.create` with `notification_id: 'diorama_msg'`
  when something fun happens (guest arrives, washer finishes, etc.), Diorama's
  subscription sees the `added`/`updated` event and plays the banner/skywriting
  once.

### 2c. `calendar` entity (core, "what's coming up")

- Calendar entity **state** is binary-ish: `on` (an event is currently active),
  `off` (none active), `unavailable`, `unknown` — **not itself the message
  text for anything but the very-next event**; don't rely on bare state for a
  general "any upcoming event" banner.
- Action **`calendar.get_events`** (`target.entity_id` + `data.start_date_time`
  + either `data.end_date_time` or `data.duration`) **returns response data**
  (`return_response: true`) — same call shape as `weather.get_forecasts`,
  which `HaApi.getWeatherForecasts` already implements in both clients, so
  this is a **direct copy of an existing, working pattern**, not a new kind of
  integration. Doc: <https://www.home-assistant.io/actions/calendar.get_events/>
- Response shape: keyed by calendar entity id →
  `{ events: [{ summary, start, end, description?, location? }, ...] }`.
  (`CalendarEvent` dataclass fields, per HA developer docs: `start`, `end`,
  `summary` required; `location`, `description`, `uid`, `recurrence_id`,
  `rrule` optional.)
  Dev doc: <https://developers.home-assistant.io/docs/core/entity/calendar/>
- Poll cadence: like weather's Open-Meteo 15-min poll, a calendar lookahead
  (e.g. "next event within the coming 2 h") polled every 5–15 min is plenty —
  calendars don't need push freshness. Calendar entity ids should still be
  **config-path** in `_isSlowEntity` so a manually-triggered "refresh" (or the
  bare on/off flip when an event starts) re-renders the sidebar preview.

### 2d. What is **NOT** available over the WS API

- **`notify.*` services** (`notify.notify`, `notify.mobile_app_<slug>`,
  companion-app pushes) are **fire-and-forget outbound actions** — there is no
  entity, no state, and no HA-side record of "the last message sent" for
  Diorama to read back. You cannot subscribe to "a notify service was called."
  This rules out "any push notification automatically appears on the wall" —
  the user must explicitly route the text through `persistent_notification`,
  an `input_text`/`text` helper, or a template `sensor` instead. (A handful of
  newer integrations expose a `notify.*` **entity** — 2024.5+ "notify entity"
  platform — which *does* have a readable state/attributes, but that's
  integration-specific and not a generic message-authoring surface; not
  recommended as the documented path.)
- Bare calendar entity **attributes** (`message`/`start_time`/`description` on
  the entity's own state object) only ever describe the **single next**
  event and are attribute-shaped, not action-response-shaped — fine for a
  cheap "what's next" chip, but `calendar.get_events` is the only way to get a
  real list/lookahead.
- There is no HA "banner/marquee" concept at all — this is 100% a Diorama-side
  rendering invention over generic text data.

### 2e. Summary table

| Source | Domain/Action | Read path | Cadence | Best style |
|---|---|---|---|---|
| Manual/automation text | `input_text.set_value` / `text.set_value` | `state_changed` (existing) | live | sky glow, lawn |
| Notification burst | `persistent_notification.create` (+ `notification_id`) | new WS `persistent_notification/subscribe` | push | banner, skywriting |
| Upcoming event | `calendar.get_events` (`return_response`) | new `call_service` (same shape as `getWeatherForecasts`) | poll ~5–15 min | sky glow, lawn |
| ~~Push notification~~ | `notify.*` | **not available** | — | — |

## 3. Real-world / visual reference

Grounding for how each metaphor should look/scale in the 3D scene (Diorama
units are **mm**, world floor frame `+X` right / `+Y` up, `+Z` up in three.js
world-space per the `_w()` mapping):

- **Banner-tow plane** (real world): small single-engine tow planes (Piper
  Cub-class) fly ~300–600 m (300,000–600,000 mm) up towing a mesh banner
  roughly **3–5 m tall × 15–30 m long** — a very long, short strip, aspect
  ratio ~1:6 to 1:8. Typography is bold sans, one line, high contrast (red/
  yellow/white on blue sky). In Diorama's toy-house scale, place the flight
  path at a fixed high altitude just above the highest roofline (e.g.
  **4500–7000 mm**, well above the ~2743 mm wall height) crossing the whole
  floor's XZ extent at a shallow diagonal, matching the aspect ratio (a
  long thin plane, never a square card).
- **Skywriting**: real skywriting letters are enormous — individual letters
  ~1500 m (1.5 km) tall, drawn by a single plane's white smoke trail, holding
  shape for several minutes before wind shears it apart. Diorama should not
  literally scale this (it would be off-screen); instead borrow the **visual
  grammar**: soft white/pale smoke-colored particle clusters shaped like
  letters, held briefly, then blown apart in the current wind direction (the
  weather system already tracks `windBearingPlanRad` — reuse it so skywriting
  drifts consistently with rain/cloud-shadow drift) and fades.
- **Lawn writing**: real precedent is stadium groundskeeping mow-stripe
  patterns and crop-circle-style yard art — alternating light/dark stripe
  bands (mower roller flattens grass to reflect light differently) or, more
  literally, painted-line yard messages ("SOLD", welcome-home chalk/spray
  messages). Scale: house-lot-sized text is readable at **300–600 mm tall
  letters** per stroke width proportionate to a ~1 m tall letter occupying a
  few square meters of yard — i.e. sized like the existing yard `groundAreas`
  polygons (grass/mulch/etc., batch K), not tiny signage. Color: keep the
  existing grass-green ground texture as the base and darken/lighten the
  letter strokes relative to it (contrast, not a foreign color) to read as
  "mowed into the lawn" rather than "painted sign."
- **Sky glow text**: think drive-in marquee / neon sign / aurora ribbon —
  bold rounded sans, single accent color with a soft outer glow (canvas
  `shadowBlur`), high in the sky, roughly camera-facing or fixed-billboard,
  visible from a wide range of orbit angles (unlike a ground decal which only
  reads from above/oblique).
- **Mounting/placement takeaway**: only *lawn writing* has a real placement
  concern (a yard polygon, like `groundAreas` — needs a location so it doesn't
  overlap furniture/house footprint). The other three are unanchored — they
  live in the sky bounding volume around the floor, not pinned to any x/y.

## 4. Diorama visualization & animation design

### 4a. Data flow (mirrors `weather.ts` + `Planner.weatherNow`)

- New pure module `src/message-fx.ts` (isolated like `weather.ts` and
  `fusion.ts` — no network calls of its own beyond what `HaApi` already
  wraps; deterministic helpers unit-testable via a `?c=` test page like
  `fusion-test.html`/`weather-test.html`).
  - `resolveMessageFromEntity(states, entityId)` → trims/validates an
    `input_text`/`text` state into a `MessageNow` (or `null` if empty/
    `unknown`/`unavailable`).
  - `resolveMessageFromCalendar(events, lookaheadMin)` → picks the soonest
    upcoming event within the lookahead window, formats `"🎂 {summary} in
    {N} min"` (or "now" if already started), `null` if nothing in range.
  - Persistent-notification messages don't need a pure resolver — the WS
    payload IS the message; Planner just tracks the one with a specific
    `notification_id` convention (e.g. `diorama_message`, documented in the
    sidebar) or **any** notification if none/`'*'` is configured.
- **`Store.messageFx` (new top-level, persisted, property-wide — like
  `Store.weather`)**: `{ enabled, source: 'entity'|'calendar'|'notification',
  entityId?, calendarEntityId?, calendarLookaheadMin?, notificationId?,
  style: 'sky'|'banner'|'skywriting'|'lawn', color?, effects3d?, chip? }`.
  **Must be added to `Planner._loadFromHa`'s explicit field list** (the
  documented gotcha — new top-level `Store` fields silently reset without
  this).
- `Planner.messageNow` (runtime, like `weatherNow`): resolved on the LIVE
  path in `_onStates` for the entity source (bound id is config-path in
  `_isSlowEntity` — a message change is a "structural" enough event to
  deserve a config-channel re-render + sidebar update, same reasoning as
  env-sensor readings), on a poll timer for calendar (own `setInterval`,
  cleared on reconfigure — copy `_reconfigureWeather`'s shape), and on the
  new `persistent_notification/subscribe` push for the notification source.
- **One-shot vs. persistent semantics** (decided per style, not per source —
  any source can feed any style):
  - `sky` / `lawn` are **persistent/ambient**: they render continuously while
    `messageNow` holds a value, updating in place when the text changes
    (like the now-playing card, or the weather chip).
  - `banner` / `skywriting` are **transient/event**: modeled exactly like
    `Planner.doorbellRings` — a change in `messageNow.text` (or a NEW
    notification `added`/`updated` event) pushes a `{ text, at }` into
    `Planner.messageEvents` (prune >~12 s, cap a handful), and the renderer
    plays the fly-by / puff-and-dissipate once per entry, same "silent
    first-seed" rule as doorbells (don't replay history on connect).
- Dedup: a `notification_id`-keyed convention means re-firing the *same*
  `persistent_notification.create` (overwrite semantics) is a clean "replay
  the message" signal — exactly the overwrite-vs-append behavior HA
  documents, which conveniently maps onto "trigger a fresh transient event."

### 4b. 3D rendering

All four styles share one `_messageGroup` (declared like `_weatherGroup`,
added to `scene.add`, `clearTransientGroups`, `destroy`, and
`setLayerVisibility`), gated by a new **`messageFx`** entry in `Layers2D`
(default **off** — this is a novelty/decorative layer, following the same
"default off unless it's core information" precedent as `frost`/
`precipForecast`/`activity`). A single dirty key:

```
_keyMessageFx = configRev | hash(messageNow?.text) | style | messageFx-layer-flag | messageFx.enabled
```

rebuilds the **static parts** (which style's meshes exist, the baked
`CanvasTexture` for the current text) only when the text or style actually
changes — same idiom as `_keyWeather`. All **motion** is a per-frame
`_advanceMessageFx(dt, nowS)` call from `_animate` (alongside
`_advanceWeather`), mutating buffers in place, **zero allocation after
build** (the documented weather-particle rule).

- **Sky glow text**: one camera-ish-billboarded `THREE.Sprite` (or a
  double-sided `PlaneGeometry` + `_mat()`-free flat material, since glow text
  is a documented flat-material exemption like weather `Points`/`Sprite`)
  built from a canvas: dark/transparent background, bold rounded sans,
  `ctx.shadowBlur` + `ctx.shadowColor` in the accent color for the glow,
  `SpriteMaterial({ map, transparent, depthWrite:false, blending:
  THREE.AdditiveBlending })` for the glow-on-black-sky look consistent with
  `NoToneMapping`. Position: fixed high above floor center (or drifting
  slowly side to side), scale to keep it legible regardless of floor size.
  Animate: gentle opacity pulse (twinkle) via a sine, reusing the
  fireplace/lightning "cheap because it rebuilds every tick" idiom is
  unnecessary here — this is transform/opacity-only, no rebuild needed per
  frame.
- **Banner-tow plane**: a small flat plane silhouette (a simple 3–5 primitive
  low-poly shape, `_mat()` toon material so it matches the rest of the cast —
  this one small mesh CAN go through the outline/blob idioms if desired, but
  a flat silhouette is enough) towing a long thin banner plane (aspect ratio
  ~1:6–1:8 per §3) textured with the same canvas-text bake (opaque banner
  background color + bold text, no glow — daylight sign, not neon). Per-frame
  motion: carrot-style linear flight along a straight chord across the sky
  bounding box at a fixed height band (4500–7000 mm), computed once at spawn
  (start/end points off two opposite edges of the inflated floor bbox, same
  "inflate the floor bbox" idiom `_buildPrecipCloud` already uses for its
  spawn box), a slight sinusoidal bob, then despawn (remove from group) once
  past the far edge — a `TransientPulse`-style list of "flights in progress"
  rather than a single persistent object, so overlapping trigger events queue
  additional banners rather than replacing one.
- **Skywriting**: one `THREE.Points` cloud per active event (or a queue like
  banners), built the same way weather precip clouds sample a spawn box —
  except **positions are letter-shaped**, not random: bake the message to an
  offscreen 2D canvas, walk the pixel data (or a coarse sampled grid, e.g.
  every 3rd px) collecting opaque-pixel coordinates, map that 2D letter shape
  into a horizontal plane high in the sky (scaled up to a legible size), and
  seed one particle per sampled point using the shared soft round "smoke"
  `CanvasTexture` (new `_skyTextTex`, built once, disposed only in `destroy`
  — exactly like `_snowTex`/`_dustTex`). Animate in three phases (age-based,
  pure function of time like the lightning double-flash envelope): (1) puff-in
  — particles ease from a small random jitter around center out to their
  letter-shape position over ~1–2 s; (2) hold — letter shape stays legible for
  a few seconds, tiny idle jitter; (3) dissipate — each particle drifts along
  the current wind vector (reuse `windBearingPlanRad` from the weather state,
  falling back to a fixed default drift if no weather source is configured)
  with accelerating spread + fade-out over ~5–8 s, after which the whole
  cloud is disposed. This is the most expensive style (letter-shape sampling
  at build time) but it's a one-time canvas readback per triggered event, not
  a per-frame cost.
- **Lawn writing**: a flat `ShapeGeometry`/`PlaneGeometry` patch at
  **y≈6** (between ground-area patches at y=4 and blob shadows at y=8, so it
  reads as "on the grass" and blob shadows still paint over it), textured
  with a canvas bake: base fill sampling the existing grass ground texture's
  tone (or a flat grass-green if no ground area exists under it), letter
  strokes as a lighter/darker stripe pattern (2–3 alternating tones, not a
  foreign color) at the real-world scale from §3. **This is the one style
  with a real x/y** — reuse the ground-area placement flow (a user drops a
  "message board" anchor point on the yard, or it defaults to a fixed spot
  near the entrance) rather than an abstract sky volume. Non-nav (paint
  only, like ground areas). Reveal animation: opacity 0→1 ease-in over ~1.5 s
  (the same trapezoid-envelope idiom as idle fidgets / doorbell pulses),
  not a genuine per-letter mow-wipe (not worth the complexity for v1 — flag
  as a nice-to-have in §6).

### 4c. 2D rendering

- **Sky / banner / skywriting have no natural plan-view location** — like
  weather, they're an atmosphere-wide effect, not a placed fixture. Represent
  them in 2D the same way the weather chip does: a small screen-fixed
  **`<diorama-message-chip>`** (mounted once in `app.ts`'s shared canvas
  container next to the weather chip, light-DOM Lit component) showing the
  current/most-recent message text + a style glyph (🎈 banner / 💨
  skywriting / ✨ sky), non-interactive except an edit-mode click that opens
  the sidebar section (mirrors `open-weather` → `#diorama-weather-section`).
  This keeps 2D users aware a message fired without inventing a fake plan
  position for a sky effect.
- **Lawn writing** IS a real plan-view element: draw the actual message text
  (small, at the yard anchor point, using the shared canvas-text look) plus
  a faint stripe-pattern rectangle behind it directly on the 2D canvas in
  `drawAll`, gated by the same `messageFx` layer — this is the only style
  where 2D shows genuine spatial content, matching how `groundAreas` already
  render flat kind-colored fills in 2D.

## 5. Integration steps

This is closer to the **weather-effects / transient-pulse subsystem** than
the full canvas-fixture recipe (three of the four styles have no draggable
plan position); lawn-writing partially follows the fixture recipe. Ordered
checklist:

1. **Types** (`types.ts`): `MessageFxConfig` (`Store.messageFx`, per §4a),
   `MessageNow` runtime shape (not persisted), `MessageEvent` (`{text, at}`,
   like doorbell rings), lawn style's placement point (`x`, `y` mm, or reuse
   a `Room`-anchor-like point) if going with a user-placed yard anchor.
2. **`Store` field wiring**: add `messageFx` to `Planner._loadFromHa`'s
   explicit field list (else it silently resets on load — documented repo
   gotcha).
3. **`HaApi` additions** (both `HassClient` and `HassPanelAdapter` — repo
   rule, no exceptions):
   - `getCalendarEvents(entityId, startISO, endISO)` → `call_service`
     `calendar.get_events` with `return_response: true`, **copy the exact
     shape of the existing `getWeatherForecasts`** (same normalization-on-
     failure-returns-null discipline).
   - `subscribeNotifications(cb)` → new WS `persistent_notification/subscribe`
     (`HassClient` via its own `sendMessage`/callback registration akin to
     its `state_changed` subscribe; `HassPanelAdapter` via
     `hass.connection.subscribeMessage` — the same connection object it
     already grabs for `state_changed`). Extend `HaApi`'s interface
     additively.
4. **`src/message-fx.ts`** (pure, isolated, like `weather.ts`): the
   entity/calendar resolvers from §4a, plus the letter-shape pixel-sampling
   helper for skywriting (keep this pure/testable — feed it a canvas 2D
   context or an `ImageData`, return `{x,y}[]` in normalized 0..1 space so
   the renderer just scales it).
5. **Planner integration**: `messageNow` (resolved per source, per §4a),
   `messageEvents` (transient queue, doorbell-idiom pruning), calendar poll
   `setInterval` (mirrors `_reconfigureWeather`), notification subscription
   lifecycle (subscribe on connect, unsubscribe on disconnect/reconfigure),
   `_isSlowEntity` classification for the entity-source id (config-path).
6. **Sidebar** (`sidebar.ts`): new `_section('messagefx', 'Message Board', …)`
   — source radio (entity/calendar/notification), entity/calendar pickers
   (reuse `<diorama-entity-picker>`, domain `input_text`/`text` or
   `calendar`), notification-id text input, style dropdown, color picker,
   per-effect enable checkbox, live preview line (mirrors the weather
   section's live preview), lawn-anchor placement button (mirrors the Rooms
   "+ Add room" click-to-anchor latch) if lawn style is configured.
7. **Layer plumbing**: add `messageFx` to `Layers2D` (default off), the
   layer-preset lists, and the sidebar "2D/3D Layers" checkboxes.
8. **Three-renderer** (`three-renderer.ts`):
   - Shared resources: `_skyTextTex` (soft smoke dot, built once, disposed
     only in `destroy`), a canvas-text-bake helper (generalize/extend
     `_makeTextSprite` or add a sibling `_makeMessageTexture(text, style,
     color)` since message text is much bigger font + optional glow/banner
     background vs. the small pill-shaped `_makeTextSprite` labels).
   - `_messageGroup` declared, added to `scene.add`/`clearTransientGroups`/
     `destroy`/`setLayerVisibility`.
   - `updateMessageFx(messageNow, events, layers, wind)` builds/tears down
     per-style meshes under `_keyMessageFx` (per §4b).
   - `_advanceMessageFx(dt, nowS)` called every frame from `_animate`
     (alongside `_advanceWeather`) for all per-frame motion/opacity/dissipate
     math — zero allocation after build.
9. **Three-view** (`three-view.ts`): compute `_keyMessageFx` (configRev +
   text hash + style + layer flag), call `updateMessageFx` only when it
   changes, call the per-frame advance unconditionally like weather.
10. **2D** (`canvas-render.ts`): `drawLawnMessage` (flat text + stripe patch,
    gated by the `messageFx` layer, drawn near/after ground areas) for the
    lawn style; `<diorama-message-chip>` (new light-DOM component, mounted in
    `app.ts` beside the weather chip) for the other three styles.
11. **Test page**: `test-pages/message-fx-test.html` (`?c=sky|banner|
    skywriting|lawn`) exercising `message-fx.ts`'s pure resolvers + a
    renderer smoke test, following the `weather-fx-test.html` pattern.

## 6. Potential additional features

- **Message queue/history** in the sidebar (last N messages, like a mini
  logbook) so a missed banner isn't just gone.
- **Voice-assistant intent script** wiring documented in the sidebar help
  text — "say 'tell the house ___' → `input_text.set_value`" as a suggested
  automation snippet, since Diorama can't discover this on its own.
- **Per-room targeting** for lawn writing — pick which floor/yard the
  message paints into if multiple floors have yard ground areas.
- **Emoji-only quick-react mode** — a compact variant that just floats a
  single large emoji (🎉/❤️/☀️) instead of full text, cheap to build (reuses
  the same canvas-bake pipeline, trivially short strings) and pairs well
  with a "reaction" button somewhere (kiosk touch-tap on a fixture → fires a
  local `persistent_notification` no-op... or simply a Diorama-local ephemeral
  event that never touches HA, if the goal is purely playful and not
  HA-round-tripped).
- **Skywriting reuses the existing wind vector** — natural tie-in: on a windy
  day the message dissipates faster/more chaotically; on a calm day it holds
  longer. Free realism from data already in `Planner.weatherNow`.
- **Tie into existing bubble-trigger recency window** — the "recent-trigger"
  thought-bubble tier already watches for lights/switches/TVs flipping within
  45 s; a fired message could similarly nudge nearby avatars into a
  "notice the sky" glance/point idle fidget for extra charm (optional,
  higher effort, purely cosmetic — a `recentTriggers`-shaped hook already
  exists in `ActivityContext`, just needs a `message` kind added).
- **Calendar color-coding by calendar entity** (multiple calendars → 
  different accent colors) if a household has more than one calendar wired
  up.

## 7. Open questions & risks

- **Default-on vs. default-off**: recommend **default off** (new `messageFx`
  layer, `Store.messageFx.enabled` false until configured) — this is a
  novelty feature with no safety/monitoring value, consistent with how
  `frost`/`precipForecast` shipped default-off.
- **Persistent-notification is global to the HA instance**, not
  Diorama-specific — any integration/automation creating notifications with
  unrelated ids will spam the panel unless the user scopes it via a specific
  `notificationId` filter (or a wildcard "any" mode explicitly opted into and
  clearly labeled as noisy). Recommend the sidebar default to "a specific
  notification_id" rather than "any notification."
- **`notify.*` cannot be read back** (§2d) — if the ask was really "send a
  push notification and have it also appear on the wall," that requires the
  user's automation to ALSO call `persistent_notification.create`
  side-by-side with their `notify.mobile_app_*` call. Worth stating plainly
  in the sidebar help text so nobody files a bug expecting native phone
  push to auto-mirror.
- **Text length**: `input_text` hard-caps at 255 chars; calendar summaries
  can be arbitrarily long. Need a truncation/wrap policy per style (banner
  and skywriting want SHORT text — a handful of words — the sidebar preview
  should warn above some length, e.g. ~40 chars, rather than silently
  overflowing the banner mesh).
- **Emoji/unicode in canvas-baked textures**: the codebase's existing bubble
  glyphs prove the Noto/Segoe emoji font stack renders fine in
  `CanvasRenderingContext2D`; a free-text message risks characters that
  render as tofu boxes on some platforms — acceptable (best-effort, not
  worth a font-embedding project) but worth a one-line sidebar caveat.
- **Skywriting build cost**: pixel-sampling a canvas per triggered event is
  a synchronous main-thread readback; for very long strings this could hitch
  a frame. Recommend capping skywriting to short strings (same length cap as
  banner) and/or coarsening the sample grid for longer text.
- **No bloom pass**: the "glow" in sky-text and skywriting is entirely
  baked-in canvas `shadowBlur` + additive blending, not a real WebGL
  bloom/glow post-process (the renderer has none — `NoToneMapping`, no
  `EffectComposer`). This is consistent with how the codebase already fakes
  glow everywhere else (light pools, LED indicators), so it's a
  documented-consistent choice, not a shortcut unique to this feature — but
  don't over-promise "aurora-quality" glow in any UI copy.
- **Lawn-writing anchor UX**: needs a placement flow decision — a dedicated
  new "message board" yard fixture (own x/y, its own tool) vs. defaulting to
  the floor's first `groundArea` of kind `grass` vs. a fixed offset near the
  entry door. Recommend the dedicated-anchor route (mirrors the Rooms
  click-to-anchor pattern) since it's the cleanest to reason about and the
  cheapest to implement given the existing latch idiom.
- **Multiple simultaneous events** (two banners queued): the design allows a
  small queue (mirrors doorbell pulses tolerating overlaps), but verify the
  visual doesn't get cluttered — may want to cap concurrent banners/skywriting
  clouds to 1–2 and drop/ignore extras that arrive mid-flight.
- **Vendor fragmentation**: none, really — this is entirely core-HA
  (`input_text`/`text`, `persistent_notification`, `calendar`), no
  HACS/custom-integration dependency, which is a plus versus most of
  Diorama's other "World Outside" features.

## 8. Sources

- Persistent Notification integration: <https://www.home-assistant.io/integrations/persistent_notification/>
- `persistent_notification.create` action: <https://www.home-assistant.io/actions/persistent_notification.create/>
- `persistent_notification` WS commands + notification object shape (core source): <https://github.com/home-assistant/core/blob/dev/homeassistant/components/persistent_notification/__init__.py>
- Notify integration (fire-and-forget, no readback): <https://www.home-assistant.io/integrations/notify/>
- Companion app notifications overview: <https://companion.home-assistant.io/docs/notifications/notifications-basic/>
- `input_text` integration: <https://www.home-assistant.io/integrations/input_text/>
- `input_text.set_value` action: <https://www.home-assistant.io/actions/input_text.set_value/>
- `text.set_value` action (integration-exposed sibling domain): <https://www.home-assistant.io/actions/text.set_value/>
- Calendar integration: <https://www.home-assistant.io/integrations/calendar/>
- `calendar.get_events` action (return_response): <https://www.home-assistant.io/actions/calendar.get_events/>
- Calendar entity developer docs (`CalendarEvent` fields, `async_get_events`): <https://developers.home-assistant.io/docs/core/entity/calendar/>
- three.js `TextGeometry` docs (extruded 3D text, typeface.json font requirement): <https://threejs.org/docs/pages/TextGeometry.html>
- three.js decal projection technique background: <https://discourse.threejs.org/t/how-to-draw-stuff-on-stuff/48934>, <https://tympanus.net/codrops/2020/01/07/playing-with-texture-projection-in-three-js/>
- three.js particle/trail text technique background: <https://tympanus.net/codrops/2022/11/08/3d-typing-effects-with-three-js/>, <https://discourse.threejs.org/t/interactive-text-with-particles/23366>
- In-repo precedent read directly from source during this research: `src/weather.ts` (fetch isolation + `WeatherNow` shape), `src/three-renderer.ts` (`_makeTextSprite`, `_disposeSpriteMaps`, `_cloudShadowTexture`/`_snowTexture` shared-texture idiom, `NoToneMapping`/`scene.background` setup), `CLAUDE.md` (doorbell `TransientPulse` idiom, ground-areas y-layering, `_isSlowEntity`, `_loadFromHa` field-list gotcha).
