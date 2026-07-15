# Weather forecast entity + movable, customizable display

Research target: extend Diorama's existing weather chip into a **configurable,
movable, multi-panel forecast display** — current conditions plus hourly and
daily forecast strips — backed by `weather.get_forecasts`.

Status: Diorama already ships a weather **core** (`src/weather.ts`,
`Store.weather`, `Planner.weatherNow`) and a **chip**
(`src/ui/weather-chip.ts`) that shows current condition + temp + place label,
bottom-right, non-movable. It already calls `weather.get_forecasts` for
`daily`/`hourly` (`Planner._refreshEntityForecasts`, both `HaApi` impls). This
document is scoped to the NEW work: a bigger, user-positioned, user-configured
forecast panel that layers on top of that plumbing. It does not re-propose the
chip, the 3D weather FX, or the Open-Meteo/sensor sources — those are shipped.

## 1. Summary

Diorama is a spatial "digital twin" panel: users place sensors and fixtures in
a virtual floorplan and watch live HA state in context. Weather is the one
data source that isn't tied to a physical device in the house — it's ambient
context about the world outside. The shipped weather chip answers "what's it
like right now"; it does not answer "what's it going to be like this
afternoon" or "will it rain tomorrow" without opening the sidebar. A movable,
configurable forecast **display panel** — think a wall-mounted tablet or a
dashboard weather widget rendered as a screen-space HUD over the floorplan —
fills that gap: a glanceable hourly/daily strip the user can dock wherever it
doesn't obstruct the parts of the plan they care about, sized and populated to
taste (current only, +hourly, +daily, or all three).

This fits Diorama's existing shape well: it's UI-config (like `Layers2D` /
`Scene3D`), not a placed floor-plan object — no wall-snap, no 3D world
coordinates, no raycast target. It's the same category of thing as the
existing weather chip, `<diorama-topbar>`, and the 3D view's corner button
bars: a screen-space overlay that floats above whichever canvas (2D or 3D) is
active, config-driven, persisted in `Store`, edited from the sidebar.

## 2. Home Assistant data model

### 2.1 The `weather` domain entity (core)

A `weather.*` entity's **state** is one of 15 fixed condition strings (HA
core `weather/__init__.py`, documented at
[home-assistant.io/integrations/weather](https://www.home-assistant.io/integrations/weather/)):

`clear-night`, `cloudy`, `exceptional`, `fog`, `hail`, `lightning`,
`lightning-rainy`, `partlycloudy`, `pouring`, `rainy`, `snowy`,
`snowy-rainy`, `sunny`, `windy`, `windy-variant`.

This is exactly Diorama's `HaCondition` union in `src/weather.ts` — already
matched, no new mapping needed.

**Current-conditions attributes** (all optional; "a weather entity may not
support all the state attributes" per the docs):

| Attribute | Notes |
|---|---|
| `temperature` / `temperature_unit` | already read (`resolveWeatherEntity`) |
| `humidity` | already read |
| `pressure` / `pressure_unit` | not currently surfaced in `WeatherNow` |
| `wind_speed` / `wind_speed_unit` | already read |
| `wind_bearing` | number OR compass string (`parseWindBearing` already handles both) |
| `wind_gust_speed` | already read (`windGustKmh`) |
| `visibility` / `visibility_unit` | already read (`visibilityKm`) |
| `uv_index` | already read |
| `cloud_coverage` | already read |
| `dew_point` | **not yet in `WeatherNow`** — trivial add, same `num()`/`toCelsius` pattern |
| `apparent_temperature` | already read (`apparentC`) |
| `precipitation_unit` | not surfaced (forecast precipitation amount unit) |

Source: [developers.home-assistant.io/docs/core/entity/weather](https://developers.home-assistant.io/docs/core/entity/weather/)
(the `WeatherEntity` Python base class — `native_temperature`,
`native_wind_speed`, `native_pressure`, `humidity`, `ozone`, `cloud_coverage`,
`uv_index`, `native_visibility`, `native_dew_point`,
`native_apparent_temperature`, `wind_bearing`, `native_wind_gust_speed`,
`native_precipitation_unit` — the `native_*` prefix is the integration-author
API; HA converts to the attribute names above for state reads).

**The legacy `forecast` state attribute is GONE** (removed HA 2024.4/2024.5).
`weather.ts` already treats it as a best-effort fallback only
(`resolveWeatherEntity`'s `attrs.forecast?.[0]?.condition` read) — correct,
keep it, but the forecast **panel** must use the service call, not this
attribute.

### 2.2 `weather.get_forecasts` (the forecast action)

Doc: [home-assistant.io/actions/weather.get_forecasts](https://www.home-assistant.io/actions/weather.get_forecasts/).
This is a **response-returning action** (`return_response: true` over the
`call_service` WS command) — exactly how Diorama already calls it
(`HassClient.getWeatherForecasts` / `HassPanelAdapter.getWeatherForecasts`).

- **Target**: entity (or device/area/floor/label — Diorama only ever targets
  a single `entity_id`, which is sufficient here).
- **Field `type`** (required): `"daily"` | `"hourly"` | `"twice_daily"`.
  **Diorama's `HaApi.getWeatherForecasts` signature currently omits
  `twice_daily`** (`type: 'daily' | 'hourly'`) — needs widening to
  `'daily' | 'hourly' | 'twice_daily'` in the interface + both impls for a
  twice-daily-only provider (some met services report AM/PM instead of true
  daily).
- **Response envelope**: `{ <entity_id>: { forecast: ForecastRecord[] } }`,
  wrapped by the WS `call_service` response as `{ response: { ... } }` — this
  is exactly what `normalizeForecasts` in `ha-client.ts` already unwraps.

**Forecast record fields** (per-entry; the dev docs' `Forecast` TypedDict,
integration-author names use a `native_*` prefix that HA strips for the
service response the same way as the entity attributes):

| Field | Type | Notes |
|---|---|---|
| `datetime` | ISO 8601 string | required in practice |
| `condition` | one of the 15 states | |
| `temperature` | number | daily = high, hourly = that hour's temp |
| `templow` | number | **daily/twice_daily only** — the low; absent for hourly |
| `apparent_temperature` | number | optional |
| `humidity` | number (%) | optional |
| `precipitation` | number | amount, unit = entity's `precipitation_unit` |
| `precipitation_probability` | number (%) or null | optional, very commonly present |
| `pressure` | number | optional |
| `wind_speed` | number | optional |
| `wind_bearing` | number or cardinal string | optional |
| `wind_gust_speed` | number | optional |
| `cloud_coverage` | number (%) | optional |
| `dew_point` | number | optional |
| `uv_index` | number | optional |
| `is_daytime` | boolean | **`twice_daily` only** (distinguishes the AM/PM entries) |

"A weather entity may not provide every field. Fields that aren't available
are omitted from the forecast" — **every renderer must treat every field as
optional**, matching Diorama's existing `ForecastRecord` interface style
(all-optional). **Diorama's current `ForecastRecord` in `ha-client.ts` is a
narrow subset** (`datetime`, `condition`, `temperature`, `templow`,
`precipitation`, `precipitation_probability` only) — it needs the additive
fields above (`wind_speed`, `wind_bearing`, `humidity`, `cloud_coverage`,
`uv_index`, `apparent_temperature`, `is_daytime`, `pressure`, `dew_point`,
`wind_gust_speed`) to drive a richer per-hour/per-day display than "icon +
temp". This is purely additive to an already-optional interface — cheap,
low-risk, no migration.

Units: forecast numeric fields are reported in the entity's own OWN unit
attributes (`temperature_unit`, `wind_speed_unit`, `precipitation_unit`,
`pressure_unit`, `visibility_unit`) — the same per-entity units as the current
conditions, not necessarily HA's configured display units. Reuse
`weather.ts`'s existing `toCelsius`/`toKmh`/`toMmPerH` normalizers per record
rather than assuming the config-wide unit system.

### 2.3 Alternative transport: `weather/subscribe_forecast` (push, NOT needed)

HA's frontend (the built-in `weather-forecast` Lovelace card) actually uses a
**push-based** WS subscription, `weather/subscribe_forecast`
(`{type: 'weather/subscribe_forecast', entity_id, forecast_type}`), which
streams forecast updates as the integration refreshes rather than requiring a
poll. This is documented informally (frontend source / community threads);
there is no stable public doc page for it comparable to the
`weather.get_forecasts` action page, and it is a frontend-internal command,
not a first-class documented public API the way `call_service` is.
**Recommendation: do NOT adopt it.** Diorama already has a working, documented,
supported polling path (`weather.get_forecasts` every 30 min via
`Planner.WEATHER_FC_MS`) that fits the codebase's `HaApi` abstraction cleanly
in both connection modes; forecasts change slowly (hourly bins, daily
highs) so a push channel buys negligible freshness for a new WS command that
would need bespoke handling in both `HassClient` and `HassPanelAdapter` (the
panel adapter would need to prove `hass.connection.subscribeMessage` parity)
and isn't formally documented as a stable public contract. Increasing the
poll cadence (e.g. 10–15 min while the panel is open) is the pragmatic
alternative if staleness becomes a complaint.

### 2.4 Non-`entity` weather sources have no forecast

Diorama's `sensors` and `openmeteo` weather sources are the other two
`WeatherConfig.source` values.
- `sensors` (raw HA sensors: precip/wind/temp/lightning) has **no forecast
  concept at all** — there's nothing to call. The forecast panel's hourly/
  daily sections must simply not render (or show a "no forecast available"
  state) when `source === 'sensors'`.
- `openmeteo` (keyless REST, no HA entity) **does** carry forecast-shaped
  data already fetched in `weather.ts` (`fetchOpenMeteo` requests
  `daily=weather_code&forecast_days=2` and
  `hourly=precipitation_probability,weather_code&forecast_hours=4`), but only
  the minimum needed for `forecastCondition`/`rainSoon` — a full display needs
  a WIDER Open-Meteo query (`forecast_days=7`, `forecast_hours=24`, plus
  `temperature_2m_max/min`, `hourly=temperature_2m,precipitation_probability,
  weather_code`) to have enough records for a real hourly/daily strip. This is
  the **same kind of isolated network call** `fetchOpenMeteo` already is —
  extend it (or add a sibling `fetchOpenMeteoForecast`) inside `weather.ts`,
  try/catch, null-on-failure, same as today.

### 2.5 Core vs custom / HACS

Everything above — the `weather` domain, its 15-condition vocabulary, and
`weather.get_forecasts` — is **HA Core**, not a custom integration. Individual
weather PROVIDERS (Met.no default, AccuWeather, OpenWeatherMap,
Weatherflow/Tempest, Pirate Weather, Ecobee, etc.) are core or HACS
integrations that implement the `WeatherEntity` base class with varying field
coverage — this is exactly why every forecast field must be treated as
optional (some providers omit `uv_index`, some omit `cloud_coverage`, hourly
`templow` is typically absent, etc.). Nothing here requires a HACS
dependency; Diorama's `entity` source already works with whatever
`weather.*` entity the user has configured, core or custom.

### 2.6 What is NOT available over the HA WebSocket API

- The legacy `forecast` attribute — gone from modern weather entities
  (2024.4+); do not rely on it as a primary path (kept only as
  `resolveWeatherEntity`'s degraded fallback, already shipped).
- Historical/past forecasts, or forecast **accuracy** — HA has no
  "forecast vs actual" record; only the live forecast the provider currently
  reports.
- Minute-by-minute "nowcasting" precipitation (the Apple Weather / Dark Sky
  style "rain starting in 12 minutes" radar nowcast) — not part of the HA
  `weather` entity model at all; a small number of specific integrations
  (some via custom sensors) might expose something adjacent, but there is no
  general HA primitive for it. Out of scope.
- Forecast icon/asset packs — HA does not ship raster/vector weather art over
  the API; the frontend renders conditions from its own icon set
  (`ha-icon`/MDI + a themeable weather-icon set). Diorama already solved this
  with its own emoji glyph maps (`CONDITION_GLYPH`) — reuse, don't fetch.

## 3. Real-world / visual reference

This is a **screen-space HUD widget**, not a placed 3D floor object, so there
are no "real-world mm dimensions" to model in the 3D scene the way a light
fixture or a piece of furniture has. The relevant real-world references are
(a) how mainstream weather UIs lay out current+hourly+daily information, and
(b) — optionally, see §6 — the dimensions of an actual smart display if
Diorama later wants an in-scene wall-mounted "weather station" prop.

### 3.1 Layout conventions to draw from

- **Apple Weather / iOS widget**: condition glyph + current temp big, "feels
  like" + high/low small underneath; below it a horizontally scrolling hourly
  strip (icon, hour label, temp, small precip-probability %) and a vertical
  daily list (day name, icon, precip %, a horizontal high/low temperature
  bar). This hourly-strip + daily-list combination is the most universally
  recognized "weather app" shape and is a reasonable target layout for
  Diorama's panel's hourly/daily sections.
- **Google/Android weather widgets**: similar hourly strip; daily rows show a
  temperature range bar overlaid on the day's min/max band across the week
  (visually communicates "today is warmer than the week" at a glance) —
  worth adopting for the daily section if effort allows, otherwise a plain
  H/L pair is fine for v1.
- **HA's own built-in `weather-forecast` Lovelace card**
  ([home-assistant.io/dashboards/weather-forecast](https://www.home-assistant.io/dashboards/weather-forecast/)):
  config surface is `entity` + `forecast_type` (`daily`/`hourly`/
  `twice_daily`) + `show_current` + `show_forecast` +
  `secondary_info_attribute` (defaults to extrema → precipitation →
  humidity, in that preference order) + `round_temperature`. This is a
  useful, HA-idiomatic **shape for the config model** Diorama's sidebar
  section should mirror: users think in these exact terms already if they've
  used Lovelace. Diorama's version should feel like "the same card, but
  placeable and reusable across 2D/3D."
- **HACS community cards** (`ha-weather-forecast-card`, `weather-card` by
  bramkragten, `clock-weather-card`, `lovelace-hourly-weather`) validate two
  extra ideas worth stealing: (1) tap-to-toggle between hourly/daily in a
  single compact panel (saves screen space — relevant to Diorama's small
  HUD real estate), and (2) a colored horizontal precipitation-probability
  bar as a compact hourly-at-a-glance strip.
- **Color/iconography**: Diorama already has a condition→glyph map
  (`CONDITION_GLYPH`, emoji-based) and a condition→3D-effect intensity map
  (`conditionIntensity`) — reuse both; don't introduce a second icon system.
  Emoji glyphs read fine at HUD sizes and require no asset loading (already
  the codebase's practice for env-sensor glyphs, alarm icons, etc.).

### 3.2 Sizing reference (screen space, not mm)

Since this is a HUD panel, "size" is CSS px, not world mm. For visual
consistency with the rest of Diorama's chrome:
- Existing weather chip: ~28 px tall pill, `rgba(10,14,20,0.72)` background,
  `#2a3a4c` border, 6 px radius, 12 px font — a reasonable **"current
  conditions" compact mode** default.
- Existing 3D overlay button bars (`three-view.ts`): `rgba(...)` translucent
  bar, 4–6 px padding, small icon buttons — same visual family the forecast
  panel's chrome (drag handle / collapse toggle / mode buttons) should match.
- A reasonable expanded-panel footprint: ~220–320 px wide × 90–160 px tall
  for an hourly strip (6–8 slots × ~36 px each), similar again for a daily
  list (4–7 rows × ~22 px). Cap width so it never exceeds ~40% of the
  canvas — the point is spatial context stays visible around it.

## 4. Diorama visualization & animation design

### 4.1 What this is NOT

Not a `Floor`-scoped placeable (no wall-snap, no `x`/`y` world mm, no 3D
raycast target, no per-floor duplication). It is **store-level UI
configuration**, same category as `Scene3D`, `Layers2D`, and the existing
`WeatherConfig` — a single instance shared across floors/views, persisted,
edited from the sidebar, rendered as a screen-space overlay identically in
2D and 3D (exactly like the existing chip already does — one mount point,
two views).

### 4.2 New `Store` field: `WeatherPanelConfig`

Add alongside `Store.weather` (NOT nested inside it, to avoid entangling the
existing `WeatherConfig` type that three.js/2D FX and lighting already
depend on):

```ts
export type WeatherPanelAnchor =
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'custom';

export interface WeatherPanelConfig {
  enabled?: boolean;            // default false — opt-in; the plain chip stays the default
  anchor?: WeatherPanelAnchor;  // default 'bottom-right' (matches the chip's current spot)
  customX?: number; customY?: number;  // px offsets from the anchor's origin corner, only used when anchor === 'custom'
  showCurrent?: boolean;        // default true
  showHourly?: boolean;         // default true
  showDaily?: boolean;          // default true
  hourlyCount?: number;         // default 8 (slots shown)
  dailyCount?: number;          // default 5
  collapsed?: boolean;          // user collapsed to a compact chip-only state (device-local, see 4.5)
  secondaryInfo?: 'extrema' | 'precipitation' | 'humidity' | 'wind' | 'none'; // mirrors the built-in card's option
}
```

Add `weatherPanel?: WeatherPanelConfig;` to `Store` and to
`Planner._loadFromHa`'s explicit field list (per the CLAUDE.md gotcha — any
new top-level `Store` field not listed there silently resets on load). No
per-floor fields, so `repairFloor`/`defaultFloor` are untouched.

`Store.weather.chip` (the existing boolean) stays as-is and continues to
gate the small compact chip; when `weatherPanel.enabled` is true, the new
panel supersedes the chip visually (render one or the other, not both
stacked — simplest: the panel component subsumes/replaces
`<diorama-weather-chip>`'s render when enabled, falling back to the
chip's exact current markup for its own "collapsed" state so dragging the
big panel closed doesn't lose the at-a-glance current-conditions view).

### 4.3 New runtime state: `Store.weatherForecast` cache (not persisted)

Forecast arrays are large-ish and refresh on a timer already
(`Planner._refreshEntityForecasts`, 30 min) — don't persist them to HA
`user_data`; keep them as `Planner` runtime fields exactly like
`weatherNow`:

```ts
// Planner runtime (not persisted, not in Store):
dailyForecast: ForecastRecord[] | null = null;
hourlyForecast: ForecastRecord[] | null = null;
```

Widen `_refreshEntityForecasts` to store the FULL arrays (today it only
peels off `daily[0].condition` and derives `rainSoon` from `hourly`) —
additive, the existing peel-off logic is unaffected. For the `openmeteo`
source, populate the same two runtime fields from the widened
`fetchOpenMeteoForecast` (§2.4) on the existing 15-min poll
(`Planner.WEATHER_POLL_MS`). For the `sensors` source, leave both `null`
(panel hides those sections, see §4.2 `showHourly`/`showDaily` becoming
no-ops when the arrays are null regardless of the flag).

### 4.4 Component: `<diorama-weather-panel>` (light DOM, mirrors the chip)

New file `src/ui/weather-panel.ts`, registered via `define.ts` (never import
`customElement` from `lit/decorators.js` directly — the mixed-module-graph
gotcha applies to every new element the same as existing ones). Mounted once
in `app.ts`'s shared canvas container, same spot as
`<diorama-weather-chip>` today (`src/ui/app.ts` around line 222) — one
mount, both 2D/3D views, no duplicate polling/interval (reads `planner`
state only, doesn't own a timer beyond the config-channel `requestUpdate`
tick the chip already does).

- **Positioning**: `position:absolute` with `top`/`bottom` + `left`/`right`
  set from the anchor (`top-left` → `top:8px;left:8px`, `top-center` →
  `top:8px;left:50%;transform:translateX(-50%)`, etc. — six fixed CSS
  recipes), OR `left/top: customX/customY` px when `anchor === 'custom'`.
  `z-index` in the same band as the existing chip (6) / 3D button bars (5) —
  pick 6 so it sits above the 3D corner buttons only where they'd actually
  overlap (they won't, by construction, since defaults differ).
- **Moving it**: edit-mode only (matches every other edit affordance in the
  codebase — kiosk/view render it but never let the viewer edit). Two ways,
  offer both since they compose the anchor model above cleanly with the
  6-preset requirement:
  1. **Anchor picker** in the sidebar Weather section — a 3×2 grid of
     buttons (the six presets) plus a "Custom (drag)" toggle. Simplest,
     zero canvas-interact plumbing, matches how `Scene3D`/`Layers2D` are
     already edited (form controls in the sidebar, not canvas drags).
  2. **Direct drag** on the panel's own header/handle in edit mode (a small
     drag-affordance row, mousedown→mousemove→mouseup entirely local to the
     component, translating to `customX/customY` and flipping
     `anchor: 'custom'` on drop — NOT routed through
     `canvas-interact.ts`'s item-drag machinery, since this isn't a
     `Floor` placeable and has no world-mm coordinate; it's a DOM element
     drag, closer to how a browser window is dragged than how a fixture is
     dragged). On drop, snap back to the nearest of the 6 presets if
     within ~24 px of one (same discoverability idiom as the smart
     alignment guides' 8 px-screen tolerance elsewhere in the canvas code),
     else stay `custom`.
  Either is sufficient alone for a v1; both together is low-risk (the
  sidebar picker is a thin wrapper that just sets the same `anchor` field
  the drag handler sets).
- **Persisted vs device-local**: `anchor`/`customX/Y`/the show-flags are
  genuine cross-device preferences → persist in `Store.weatherPanel` (HA
  `user_data`, syncs across the user's devices/tablets like every other
  `Store` field). `collapsed` is arguably more like the sidebar's own
  collapsed-sections state (`localStorage['diorama:sidebar:collapsed']`,
  device-local) — **recommend device-local** for `collapsed` specifically
  (a kiosk tablet's expand/collapse choice shouldn's fight a phone's), same
  pattern as the collapsible-sidebar-sections convention
  (`localStorage`, try/catch-guarded key e.g.
  `diorama:weatherpanel:collapsed`), while everything else in
  `WeatherPanelConfig` stays in the synced `Store`.

### 4.5 Rendering the three sections

- **Current** (`showCurrent`): reuse the chip's exact existing markup
  (glyph + temp + label) as the panel's "current" row — literally lift the
  chip's inner template into a shared render helper so there's one source
  of truth for "what current conditions look like," called by both the
  standalone chip (when the panel is disabled) and the panel's current
  section (when enabled).
- **Hourly** (`showHourly`, gated additionally on `hourlyForecast != null`):
  a horizontally-scrollable flex row, one cell per record up to
  `hourlyCount`: hour label (`new Date(datetime).toLocaleTimeString(...,
  {hour:'numeric'})`), `CONDITION_GLYPH[condition]`, temp
  (`tempText`-style, respecting `store.imperial`), and — if
  `secondaryInfo` picks it — a small `precipitation_probability` % or wind
  reading underneath. Each cell ~36–44 px wide; overflow-x auto so more
  than fit-width slots scroll (touch-drag friendly, matches the touch
  guards already in place elsewhere — but this is a normal DOM scroll
  container, not a canvas, so it needs NO special touch-vs-HA-drawer
  handling; only the canvases have that 24 px-edge-swipe carve-out).
- **Daily** (`showDaily`, gated on `dailyForecast != null`): a vertical list
  up to `dailyCount` rows: day-of-week label (`toLocaleDateString(...,
  {weekday:'short'})`, "Today" for index 0), glyph, `templow`–`temperature`
  as a compact "L / H" pair (or the Google-style range bar as a stretch
  goal — a simple `<div>` with two inset colored bars scaled between the
  week's overall min/max, still zero-dependency CSS, no canvas needed).
- **No 3D scene representation** — this is HUD chrome layered over
  whichever canvas is visible, identically for 2D and 3D, the same as the
  chip today. There is no `_keyWeatherPanel` dirty key, no `three-renderer`
  group, no raycast target: it never touches `three-view.ts`'s scene graph.
  This keeps the feature cheap and consistent with "the chip already solves
  cross-view display, just make it bigger and configurable."
- **Animation**: minimal — a soft fade/scale-in on first mount
  (`transition: opacity 150ms, transform 150ms`, no per-frame RAF work,
  no `requestAnimationFrame` loop of its own), consistent with the codebase
  preference for CSS transitions over animated DOM in non-canvas UI. The
  existing chip already re-renders on the `config` event + a 60 s interval
  for staleness dimming — the panel should do the same (subscribe to
  `planner`'s `config` event, plus its own interval only if hourly labels
  need to advance visually as time passes, e.g. re-render every 5 min so
  "in 2 hours" style relative labels stay correct — optional, absolute hour
  labels avoid needing this entirely).

### 4.6 Kiosk / view mode

Renders in all three `Planner.uiMode`s (edit/kiosk/view) — it's display,
not editing, same rule as GPS pins, camera alerts, and the existing chip.
Only the anchor-drag / sidebar picker are edit-gated (§4.4). No `save()`
call ever fires from view/kiosk (there is none in the render path to begin
with — positioning writes only happen through the edit-gated drag/picker).

### 4.7 Slow vs live entity routing

The bound weather entity id (`WeatherConfig.entityId`) is **already** wired
into `_isSlowEntity`/the config channel via the existing weather core (state
changes on it trigger `_recomputeLocalWeather`/`emitConfig`) — no new
entity-routing work. The forecast ARRAYS themselves are refreshed on a
timer, not on `state_changed`, exactly like today; the panel just reads
whatever `planner.dailyForecast`/`hourlyForecast` currently hold and
re-renders when `config` fires (the timer's refresh already calls
`emitConfig()` via `_applyForecastToNow`/an equivalent bump — extend that
bump to fire even when only the raw arrays changed, not just the derived
`forecastCondition`/`rainSoon`, so the panel actually updates every 30 min).

## 5. Integration steps

This isn't the canvas-fixture recipe (no wall-snap 3D object) — it's the
**screen-space-overlay + Store-config recipe** the weather chip already
demonstrates. Ordered checklist:

1. **`ha-client.ts`**: widen `ForecastRecord` with the additive optional
   fields (§2.2 table); widen `HaApi.getWeatherForecasts`'s `type` param to
   include `'twice_daily'`; implement in **both** `HassClient` and
   `HassPanelAdapter` (mechanical — same call, wider type literal).
2. **`weather.ts`**: extend `fetchOpenMeteo` (or add a sibling
   `fetchOpenMeteoForecast`) to request `forecast_days=7`/`forecast_hours=24`
   with the additional `hourly=`/`daily=` params (§2.4); keep the existing
   try/catch/null-on-failure shape.
3. **`types.ts`**: add `WeatherPanelAnchor` + `WeatherPanelConfig` +
   `Store.weatherPanel?`.
4. **`planner.ts`**: add `weatherPanel` to `_loadFromHa`'s explicit field
   list (with sane defaults if `remote.weatherPanel` is absent); add runtime
   `dailyForecast`/`hourlyForecast` fields; widen `_refreshEntityForecasts`
   to retain the full arrays (not just peel derived bits) and call
   `emitConfig()` on any array change; wire the `openmeteo` poll path to
   populate the same two fields from step 2's wider fetch.
5. **`src/ui/weather-panel.ts`** (new): the component (§4.4–4.5). Register
   via `define.ts`. Extract the chip's current-conditions template into a
   shared helper importable by both `weather-chip.ts` and the new panel (or
   have the panel render `<diorama-weather-chip>` internally for its
   "current" section, whichever is less invasive to the existing chip).
6. **`app.ts`**: mount `<diorama-weather-panel>` next to (or replacing the
   render branch of) `<diorama-weather-chip>` in the shared canvas
   container; the mount decides chip-vs-panel from `weatherPanel?.enabled`.
7. **`sidebar.ts`**: extend the existing Weather section (or add a
   sub-section) with: enable checkbox, the 6-anchor button grid + "custom"
   indicator, show-current/hourly/daily checkboxes, hourly/daily count
   number inputs, `secondaryInfo` dropdown. Mirrors existing section
   patterns (`_section('weather', …)`).
8. **Drag-to-reposition** (optional but named in the brief): local
   mousedown/mousemove/mouseup on the panel's handle, writing
   `customX/customY` + `anchor:'custom'`, with snap-back-to-preset within
   ~24 px (§4.4). Purely internal to the component; no `canvas-interact.ts`
   changes.
9. **`npm run typecheck && npm run build`** — the project's only gates (no
   test suite). Manually verify in dev: entity source with a real
   `weather.*` entity showing hourly+daily; `sensors` source confirming the
   forecast sections cleanly hide; `openmeteo` source with the widened
   fetch; anchor switching in edit mode; kiosk mode confirming no edit
   affordances render.

## 6. Potential additional features

- **Precipitation bar** (HACS `lovelace-hourly-weather` idiom): a compact
  24 h colored strip (intensity → opacity/height) as an alternative/extra
  hourly visualization, cheaper to scan than per-hour icons.
- **Tap-to-toggle hourly/daily** in a single compact mode when screen space
  is tight (mirrors `ha-weather-forecast-card`), instead of always stacking
  both.
- **Weekly high/low range bar** (Google-widget style) instead of a bare
  "L/H" pair for the daily rows — visually communicates the week's spread
  at a glance; needs the week's overall min/max computed once from the
  daily array (cheap).
- **Multiple weather entities / multi-panel**: some users have more than one
  `weather.*` entity (e.g. two forecast providers, or a second location for
  a vacation home) — `WeatherPanelConfig` could become an array of panels
  each with its own anchor + entity override, though this is meaningfully
  more scope (multiple anchors colliding, multiple sidebar sub-sections) and
  should be a deliberate v2 decision, not baked into v1's singular-panel
  shape.
- **Feed the panel's forecast into existing systems that already read
  `forecastCondition`/`rainSoon`**: no new work needed — the 3D
  storm-brewing effect and forecast-anticipation thought bubbles already
  consume these derived fields; a fuller hourly array could sharpen
  `rainSoon`'s horizon precision (already computed from the hourly array
  today, `forecastRainSoon`) but that's tuning, not new plumbing.
- **`twice_daily` support** as a genuine third forecast type (AM/PM rows
  with `is_daytime`) rather than only daily/hourly — relevant for regions
  where the local provider only exposes twice-daily (some AccuWeather/
  Met.no configurations).
- **Tap a forecast row to preview** its effect on the 3D scene (e.g. hover
  tomorrow's forecast → briefly preview tomorrow's weather FX in the 3D
  view) — a fun, low-priority "what would the house look like" feature
  riding the already-shipped 3D weather FX system; would need a temporary
  override path into `three-view`'s `_weatherFxState`, non-trivial, clearly
  v2+.

## 7. Open questions & risks

- **Chip vs panel coexistence**: should `weatherPanel.enabled` fully replace
  the chip, or should both be independently toggleable (e.g. compact chip
  always on, big panel only sometimes)? Recommendation in §4.2 is
  replace-when-enabled for simplicity; confirm with product intent before
  building, since it affects whether `Store.weather.chip` needs a
  deprecation note.
- **Provider field coverage is genuinely uneven.** Some very common setups
  (Met.no, HA's zero-config default) DO expose rich hourly/daily fields;
  others (some AccuWeather HACS forks, minimal custom integrations) may
  expose only `condition`+`temperature`. The panel must degrade gracefully
  per-field (already the plan — every field optional) but should probably
  also show a compact "provider doesn't report X" affordance rather than
  silently blank cells, to avoid support confusion ("why is my precip % always
  missing"). Not fully resolved here — a UX decision, not a data one.
- **Open-Meteo forecast fetch cost**: widening the query
  (`forecast_days=7`+`forecast_hours=24` vs today's
  `forecast_days=2`/`forecast_hours=4`) is still a single small JSON GET on
  the existing 15-min poll — negligible, but confirm no rate-limit concern
  if many Diorama instances share one deployment's outbound IP (Open-Meteo
  is keyless/free-tier; unlikely to matter at this scale, flagging for
  completeness).
- **`weather/subscribe_forecast` was deliberately rejected** (§2.3) in favor
  of the existing poll — revisit only if users report forecast staleness
  as a real complaint; the fix there is a shorter poll interval first, a
  push subscription second (and only if `HassPanelAdapter` can prove it can
  subscribe through `hass.connection`, not just `HassClient`'s raw WS).
- **Anchor-drag vs sidebar-only editing**: dragging a HUD panel with the
  mouse directly over a live 2D/3D canvas risks accidental interaction with
  whatever's underneath (pan, selection) if the drag isn't cleanly
  `stopPropagation`'d from the canvas's own mouse handlers. Needs care in
  implementation (the component's own handle should capture the drag before
  it ever reaches the canvas element beneath); the sidebar-anchor-picker
  path avoids this risk entirely and could ship first, with direct-drag as
  a fast-follow.
- **Mobile/kiosk tablet real estate**: a 220–320 px-wide panel is a much
  bigger footprint than the 28 px chip on a small kiosk tablet in portrait
  orientation. Should probably auto-collapse (or force `showHourly:false`)
  below some viewport-width breakpoint, mirroring the existing 900 px
  sidebar-overlay breakpoint convention — worth deciding before shipping a
  default-on config, though the feature defaults to `enabled: false` so
  this only bites users who opt in.
- **`secondaryInfo` naming collision**: the built-in Lovelace card's
  `secondary_info_attribute` and Diorama's proposed `secondaryInfo` field
  are DIFFERENT shapes (HA's supports open-ended per-record attribute
  names; the simplified `'extrema'|'precipitation'|'humidity'|'wind'|'none'`
  enum proposed here is a curated subset chosen for HUD-size legibility).
  Fine as designed, but don't assume 1:1 parity with the Lovelace card's
  config schema if a future "import my Lovelace weather card config" idea
  ever comes up.

## 8. Sources

- [Weather — Home Assistant integrations docs](https://www.home-assistant.io/integrations/weather/) — condition vocabulary + entity attributes.
- [weather.get_forecasts — Home Assistant actions docs](https://www.home-assistant.io/actions/weather.get_forecasts/) — action signature, target types, response shape, example.
- [Weather entity — Home Assistant Developer Docs](https://developers.home-assistant.io/docs/core/entity/weather/) — `WeatherEntity` base class properties, `Forecast` TypedDict fields, `WeatherEntityFeature` flags, `async_forecast_daily/hourly/twice_daily`.
- [Weather forecast card — Home Assistant dashboards docs](https://www.home-assistant.io/dashboards/weather-forecast/) — built-in Lovelace card config surface (`forecast_type`, `show_current`, `show_forecast`, `secondary_info_attribute`, etc.), used as the config-model reference.
- [WebSocket API — Home Assistant Developer Docs](https://developers.home-assistant.io/docs/api/websocket/) — general WS command shape, context for the `weather/subscribe_forecast` alternative-transport discussion.
- Community/HACS card references (design-pattern inspiration only, not data-model sources): [ha-weather-forecast-card](https://github.com/troinine/ha-weather-forecast-card), [lovelace-hourly-weather](https://github.com/decompil3d/lovelace-hourly-weather), [weather-card (bramkragten)](https://github.com/bramkragten/weather-card), [clock-weather-card](https://github.com/pkissling/clock-weather-card), [weather-forecast-extended](https://github.com/Thyraz/weather-forecast-extended).
- In-repo: `src/weather.ts`, `src/ui/weather-chip.ts`, `src/ha-client.ts` (`ForecastRecord`/`normalizeForecasts`/`getWeatherForecasts`), `src/ha-panel-adapter.ts`, `src/planner.ts` (`_refreshEntityForecasts`/`_applyForecastToNow`), `src/types.ts` (`WeatherConfig`), `src/ui/app.ts` (shared canvas container mount point), `src/ui/three-view.ts` (overlay button-bar chrome reference), `src/styles.ts` (color tokens).
