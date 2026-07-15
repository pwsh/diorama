# Weather Alerts (region-agnostic) — Research

## 1. Summary

Home Assistant can surface official government/meteorological-agency weather
warnings (tornado warning, flood watch, heat advisory, storm surge, etc.) via
a patchwork of region-specific integrations — none of them global, none of
them core-with-alerts in the US case. Diorama already has a **weather core**
(`src/weather.ts`, `Store.weather`) that normalizes *forecast conditions*
(sunny/rainy/snowy/...) from three possible sources into one `WeatherNow`
shape, and a 3D weather-FX layer that reacts to it. Weather **alerts** are a
different animal: they're discrete, severity-ranked, time-bounded *events*
("Tornado Warning until 4:00 PM", "Flood Watch until Thursday") rather than a
continuous ambient condition, and they demand *urgency* — a spatial panel is
well suited to this because it can put a proportionally alarming visual in
the same place the household already looks (the floor plan / 3D house),
not just a dashboard card the user has to navigate to.

Why it fits Diorama specifically:
- Diorama already owns the "ambient state of the world outside" surface
  (weather chip, 3D sky/lighting/precipitation). An alert is naturally a
  *modifier* on top of that surface — same mental model as the existing
  `WEATHER_DIM_CONDITIONS` lighting downgrade, applied with more urgency.
- The severity/urgency/certainty vocabulary is genuinely universal (it's
  the OASIS **Common Alerting Protocol**, CAP — the same standard behind
  IPAWS/EAS in the US, NWWS, MeteoAlarm, and most national agencies), so a
  single Diorama data model can front NWS, MeteoAlarm, DWD, Environment
  Canada, or BOM without per-country special-casing in the renderer — only
  the *ingestion* adapter differs, exactly like `weather.ts`'s
  `source: 'entity' | 'sensors' | 'openmeteo'` split.
- It's opt-in, HA-entity-driven, and needs zero new hardware — same shape
  as every other "read an entity, render something" fixture already in the
  codebase (safety sensors, alarm keypad, camera alerts).

This is explicitly its **own** feature, parallel to (not merged into) the
existing weather chip/3D-FX system — an alert is a warning about hazardous
*conditions*, and while related, it has its own lifecycle (issued → active →
expired), its own severity ladder, and needs to be visible even when the
weather chip would otherwise show "Clear."

## 2. Home Assistant data model

**There is no single canonical "weather alert" entity domain in HA.** Every
regional source is a different integration with a different entity shape.
None publish a `binary_sensor.weather_alert` with a standard device class —
alerts are always modeled by the *integration author*, not the platform.
Diorama must normalize on ingestion, the same way `weather.ts` already
normalizes three disparate forecast sources into one `HaCondition` union.

All of the integrations below expose their data as regular HA entities
(`sensor.*` / `binary_sensor.*`) with attributes — which means **everything
listed is available over the HA WebSocket API** (`state_changed`, matching
Diorama's existing `_isSlowEntity` / live-vs-config routing) with one caveat
noted under NWS below (attribute-size truncation). Nothing here requires a
new transport; it's exactly the "read hass.states[entity_id]" pattern
Diorama already uses everywhere.

### 2.1 United States — NWS (core has NO alerts; must use a custom integration)

- **Core `weather.nws`** (`home-assistant.io/integrations/nws/`) exposes
  forecast/condition/temperature only. **It does not expose active alerts.**
  This is a real, oft-requested gap (there is no first-party NWS alerts
  entity as of this writing) — confirmed by the existence of multiple
  competing custom integrations that exist solely to fill it.
- **`nws_alerts`** (HACS custom, github.com/finity69x2/nws_alerts — an
  actively maintained fork of the original eracknaphobia component). Creates
  `sensor.nws_alerts_alerts` (name configurable). **State** = count of
  currently active alerts for the configured area. **Attributes**: a list of
  alert-detail dicts (the integration documents "many alert details as a
  list" — exact per-field keys mirror the NWS CAP/GeoJSON alert `properties`
  object, see 2.1.1 below; a v6.6+ addition surfaces `NWSCode` per alert for
  filtering by NWS event code). Configuration: an NWS zone ID (`INZ009`
  format) or county ID (`INC033` format), static GPS lat/lon, or a
  `device_tracker` entity (dynamic location — alerts follow the phone/car).
  Polls the NWS API every 1 minute by default (configurable).
  — Source: github.com/finity69x2/nws_alerts, its README.
- **Underlying NWS API** (what `nws_alerts` and any custom polling would
  read): `api.weather.gov/alerts/active?area=<state>` (or `?point=lat,lon`,
  `?zone=<ugc>`), GeoJSON `FeatureCollection`, each `feature.properties`
  carries the full CAP-derived field set:
  `id`, `areaDesc`, `geocode` (SAME + UGC codes), `affectedZones`,
  `references` (supersession chain), `sent`, `effective`, `onset`,
  `expires`, `ends`, `status` (`Actual`/`Exercise`/`Test`), `messageType`
  (`Alert`/`Update`/`Cancel`), `category` (`Met`/`Safety`/...), `severity`
  (`Extreme`/`Severe`/`Moderate`/`Minor`/`Unknown`), `certainty`
  (`Observed`/`Likely`/`Possible`/`Unlikely`), `urgency`
  (`Immediate`/`Expected`/`Future`/`Past`/`Unknown`), `event` (free-text
  event name, e.g. "Tornado Warning", "Flash Flood Warning", "Air Quality
  Alert"), `sender`, `senderName` (e.g. "NWS Pueblo CO"), `headline`,
  `description`, `instruction` (may be null), `response` (`Shelter`/
  `Evacuate`/`Prepare`/`Avoid`/`Monitor`/`AllClear`/`None`), `parameters`
  (dict incl. AWIPS/WMO/`NWSheadline`), `eventCode` (SAME + NWS codes).
  — Source: api.weather.gov (Services Web API docs +
  vlab.noaa.gov/web/nws-common-alerting-protocol/cap-documentation).
  Polygon/geometry ships on the GeoJSON `feature.geometry` (may be `null`
  for zone-based alerts that don't carry a storm-based polygon) — **this is
  not exposed by `nws_alerts`'s flat sensor attributes**, only by hitting the
  NWS API directly; not needed for a severity/banner feature, worth flagging
  if a future "draw the warning polygon on the map" feature is wanted.
- **`api.weather.gov` and `nws_alerts` are both free, keyless, no auth.**

### 2.2 Europe — MeteoAlarm (core integration, legacy quality)

- **`binary_sensor.meteoalarm` (or configured name)** — introduced HA 0.93,
  core, `iot_class: cloud_polling`, "legacy" quality scale (unofficial
  scraping of MeteoAlarm's public RSS/XML feed, not a real API contract —
  "use at your own risk" per the docs).
  — Source: home-assistant.io/integrations/meteoalarm/
- **Config**: `country` (English lowercase full name), `province` (a
  MeteoAlarm-specific region name — NOT ISO codes), optional `language`
  (ISO code, default `en-US`), optional custom `name`.
- **State**: the warning headline text when active, else presumably "off"/
  empty (binary_sensor semantics — HA integrations doc shows automations
  keying off `to: 'on'`).
- **Attributes** (only populated while an alert is active): `headline`,
  `description`, `event`, `effective`, `onset`, `expires`, `severity`,
  `urgency`, `certainty`, `responseType`, `category`, `senderName`,
  `attribution`, `awareness_level`, `awareness_type`.
  - `awareness_level` — CAP-adjacent 3-tier scale: `2; yellow; Moderate`,
    `3; orange; Severe`, `4; red; High` (no green/1 = calm, matching
    MeteoAlarm's public "no particular awareness required" tier).
  - `awareness_type` — MeteoAlarm's 14-value hazard taxonomy (a *code;name*
    pair), useful directly as Diorama's `event`→icon lookup key instead of
    parsing free-text event strings: `1 Wind`, `2 Snow-Ice`,
    `3 Thunderstorm`, `4 Fog`, `5 Extreme High Temperature`,
    `6 Extreme Low Temperature`, `7 Coastal Event`, `8 Forest Fire`,
    `9 Avalanches`, `10 Rain`, `11 Flood`, `12 Rain-Flood`,
    `13 Marine-Hazard`, `14 Drought`.
    — Source: meteoalarm.readthedocs.io (MeteoAlarm python lib docs),
    cross-checked against the MeteoAlarm.org public feed vocabulary.
- **Limitation** (a real, open HA core issue): the single binary_sensor can
  only carry **one** active alert's attributes at a time even when a region
  has multiple concurrent warnings (e.g. wind + flood) — a known bug
  (home-assistant/core#131045, #156838), not a Diorama-side thing to solve,
  but it means "MeteoAlarm as ingested by core" may under-report concurrent
  alerts. A multi-alert-aware alternative is `cap_alerts` (2.6).

### 2.3 Germany — DWD Weather Warnings (core integration)

- **`sensor.<region>_current_warning_level`** and
  **`sensor.<region>_advance_warning_level`** (two sensors — "current" =
  today, "advance" = pre-warned future risk), core,
  home-assistant.io/integrations/dwd_weather_warnings/.
- **Config**: either a DWD "warncell" ID/name (region identifier — numeric
  ID preferred, names can collide) or a `device_tracker` entity with
  lat/lon attributes for automatic warncell resolution.
- **Common attributes**: `last_update` (UTC), `region_name`, `region_id`,
  `warning_count`.
- **Per-warning indexed attributes** (`warning_1_*`, `warning_2_*`, ... up
  to `warning_count`): `warning_<n>_level` (**int 1–4**: 1 = weather
  warning (Wetterwarnung), 2 = notable/significant weather
  (markantes Wetter), 3 = severe weather (Unwetter), 4 = extreme weather
  (extremes Unwetter) — DWD's own 4-tier ladder, distinct from but roughly
  parallel to CAP severity), `warning_<n>_type` (int category code —
  storm/rain/snow/etc.), `warning_<n>_name`, `warning_<n>_headline`,
  `warning_<n>_start` / `_end` (UTC), `warning_<n>_description`,
  `warning_<n>_instruction`, `warning_<n>_parameters` (list), and a DWD
  **hex color** `warning_<n>_color` (`#rrggbb`) — DWD ships its own official
  severity color per level, directly reusable for the badge with no
  Diorama-side color table needed for this source.
- **Update interval**: every 15 minutes.
  — Source: home-assistant.io/integrations/dwd_weather_warnings/.

### 2.4 Canada — Environment Canada (core integration + actions)

- **Alert sensors**, one **per category**, named per-location:
  `sensor.<location>_warnings`, `_watches`, `_advisories`, `_statements`,
  `_endings` (five parallel sensors rather than one combined feed). **State**
  = count of active items in that category; attributes hold the list of
  alert titles.
  — Source: home-assistant.io/integrations/environment_canada/.
- **Action `environment_canada.get_alerts`** (`developers.home-assistant.io`
  / home-assistant.io/actions/environment_canada.get_alerts/):
  ```yaml
  action: environment_canada.get_alerts
  data:
    config_entry_id: <config-entry-id>   # required, no target/entity_id
  response_variable: result
  ```
  Response shape: `{ warnings: [], watches: [], advisories: [], statements: [], endings: [] }`,
  each item `{ title, date (ISO), alert_colour_level (e.g. "red"), expiry_time (ISO) }`.
  This is a **service-call / `call_service` with `return_response: true`
  action**, the exact same WS mechanism Diorama already uses for
  `weather.get_forecasts` (`HaApi.getWeatherForecasts`) — so
  `environment_canada.get_alerts` could be wired into `HaApi` with an
  identical implementation pattern in both `HassClient` and
  `HassPanelAdapter` if Diorama ever wants the fuller per-alert detail
  instead of just the entity attribute list.
- **Action `environment_canada.get_forecasts`** — unrelated to alerts,
  returns `daily_forecast`/`hourly_forecast` incl. `text_summary`; already
  analogous to the shipped `getWeatherForecasts`.
- Alerts refresh every 5 minutes (same cadence as forecast data).
- **`alert_colour_level`** in the get_alerts response is Environment
  Canada's own severity-ish tag (e.g. `"red"`) — needs mapping into
  Diorama's normalized severity, not a drop-in CAP value.

### 2.5 Australia — Bureau of Meteorology (custom, HACS)

- `bremor/bureau_of_meteorology` (custom) adds an **optional warning
  sensor** (binary sensors per warning type, per its changelog — "1.1.8:
  Weather Warnings: Add optional warning sensor"). A community fork,
  `safepay/ha_bom_australia`, advertises "individual binary sensors for
  each warning type using actual BOM API warning types with accurate
  phase-based filtering." Exact attribute names weren't confirmable from
  the docs surface alone (source-diving `custom_components/
  bureau_of_meteorology` would be needed at build time if a user requests
  AU support) — **flag as needing source verification before shipping an AU
  adapter**, not a blocker for the region-agnostic design.
- No official BOM core integration; polling is 5-minute cadence like the
  weather side of the same component.
  — Source: github.com/bremor/bureau_of_meteorology,
  github.com/safepay/ha_bom_australia.

### 2.6 Cross-region option worth flagging: `cap_alerts` (HACS custom, new)

- `seevee/cap_alerts` (github.com/seevee/cap_alerts) is a **purpose-built,
  multi-region, CAP-native** integration (existing, small but active — 4★,
  pushed within the last few days as of this research) that is worth
  calling out because its design goal is *exactly* Diorama's: one normalized
  CAP-field model across NWS (GeoJSON), Environment Canada/ECCC (Atom+CAP
  XML), MeteoAlarm (~37 EU services), and a WMO global feed (~100 national
  met services) — see 6. Potential additional features and 7. Open
  questions for caveats (its README-level docs were the only source
  available; exact REST/WebSocket endpoint paths and event-bus names it
  advertises should be re-verified against its source before any Diorama
  code depends on them).
- It creates **one sensor entity per active alert**
  (`sensor.cap_alert_<event_slug>_<hash>`, state = normalized severity
  `minor`/`moderate`/`severe`/`extreme`/`unknown`) specifically to dodge
  the **HA recorder's 16 384-byte state-attribute size limit** — a real,
  documented HA constraint (home-assistant/core#102964 and similar issues
  across many integrations): when a single entity's attributes serialize
  past 16 KB, the recorder logs a warning and **drops storing the
  attributes for that state** (the live in-memory state is still fine, but
  recorder history for that row is not persisted). This matters for
  Diorama **only if** it were to read years of history back via
  `HaApi.getHistory` for these attributes — the *live* WebSocket
  `state_changed` payload isn't affected, but a big multi-alert region
  (e.g. all-of-MeteoAlarm) piling every field of every alert onto one
  entity's attributes is exactly the failure mode this integration exists
  to dodge, and is a real risk with `nws_alerts`/DWD's approach too if a
  user's area has many simultaneous alerts.
- Per its docs, alert **polygons are deliberately excluded from entity
  attributes** and served via a separate REST/WS handle — consistent with
  the 16 KB-limit motivation; not needed for Diorama's banner/beacon design
  (no polygon-drawing feature is proposed here).

### 2.7 Normalized vocabulary (what Diorama should standardize on)

All five sources above are lossy encodings of the same OASIS **Common
Alerting Protocol v1.2** vocabulary (docs.oasis-open.org/emergency/cap/v1.2/
CAP-v1.2-os.html) — Diorama's internal model should use CAP's own enums
directly since every source maps onto them (sometimes 1:1, sometimes via a
translation table):

- **severity**: `Extreme` (extraordinary threat to life/property) >
  `Severe` (significant threat) > `Moderate` (possible threat) > `Minor`
  (minimal threat) > `Unknown`.
- **urgency**: `Immediate` (act now) > `Expected` (within the hour) >
  `Future` > `Past` > `Unknown`.
- **certainty**: `Observed` (confirmed/ongoing) > `Likely` (>~50%) >
  `Possible` (≤~50%) > `Unlikely` (~0) > `Unknown`.
- **event**: free text in CAP/NWS (`"Tornado Warning"`); a closed taxonomy
  in MeteoAlarm (`awareness_type` 1–14) and DWD (`warning_<n>_type` int
  code) — Diorama needs its own small icon-lookup table keyed by matching
  substrings of `event`/DWD type code/MeteoAlarm awareness_type, falling
  back to a generic "⚠" glyph, exactly like `ENV_KINDS`/`envKindOf` already
  does string/attribute-driven kind inference for environmental sensors.
- **lifecycle timestamps**: `effective`/`onset` (start), `expires`/`ends`
  (end) — every source has *some* start/end pair; names differ
  (`effective` vs `warning_1_start`, `expiry_time` vs `expires`) but the
  semantics line up directly.

### 2.8 What's NOT available over the HA WebSocket API

- Nothing structural — every source above is a plain entity/action, so
  everything is reachable via `state_changed` (live) + optional
  `call_service` with `return_response: true` (Environment Canada's
  `get_alerts`, mirroring the already-shipped `weather.get_forecasts`
  pattern in `HaApi`).
- The two real gaps are **not WS-transport gaps, they're data-availability
  gaps**: (a) alert **polygon geometry** is absent from every flat-sensor
  integration's attributes (NWS's raw API has it on `feature.geometry`;
  none of the HA integrations surface it) — irrelevant to the
  banner/beacon design here, relevant only to a hypothetical future
  "draw the warning shape over the map" feature; (b) **recorder history**
  for these attribute-heavy entities can silently truncate past 16 KB (2.6)
  — affects `HaApi.getHistory` lookups, not live state.

## 3. Real-world / visual reference

Weather alerts don't have a single physical real-world object the way a
smoke detector or thermostat does — the closest real-world analogs, useful
for grounding Diorama's on-screen severity language:

- **NWS / NOAA Weather Radio "Specific Area Message Encoding" (SAME)
  color/urgency convention**, widely reused on TV/web weather maps
  (weather.gov/help-map, weather.gov/media/nws/WWA_Changes_10124.pdf):
  **Warning-tier products render red** (`#FF0000`-family — e.g. Tornado
  Warning), **Watch-tier products render orange/yellow**
  (`#FFA500`/`#FFFF00`-family — e.g. Tornado Watch, Severe Thunderstorm
  Watch), **Advisory-tier products render a lighter yellow**. This
  Warning > Watch > Advisory ladder (independent of, but roughly aligned
  with, CAP severity Extreme > Severe > Moderate) is the single most
  recognizable "weather alert color" convention in the US and is safe to
  borrow directly for badge colors even outside the US, since users
  already have "red = worst" wired in from TV weather graphics.
- **MeteoAlarm's own official palette** (2.2) is even more direct to reuse
  since it's already `severity → color` out of the box: green (calm, not
  emitted as an active alert) → yellow (`awareness_level 2`, moderate) →
  orange (`3`, severe) → red (`4`, extreme). This is the recommended
  4-stop ramp for Diorama's normalized severity, since it already collapses
  every source's ladder into 3 "active" stops:
  - `Minor` → **yellow** `#f5c400`-ish
  - `Moderate` → **orange** `#ff8c00`-ish
  - `Severe`/`Extreme` → **red** `#e6291a`-ish (optionally a deeper red or
    added pulse for `Extreme` alone, since Extreme legitimately means
    "immediate life-safety action")
  - `Unknown`/no active alert → hidden/neutral (no badge)
- **Physical outdoor warning sirens** (tornado/civil-defense sirens) were
  investigated as a possible literal 3D "beacon" reference object: typical
  units mount on a **6–12 m pole** (steel/wood), the horn/rotator assembly
  is roughly **0.6×0.6×0.8 m**, rotates ~3 RPM projecting a 60° sound cone,
  optionally paired with a rotating/strobing amber or red beacon light
  (SAE Class-1 LED strobe). This is useful if Diorama ever wants a literal
  placeable "siren" yard fixture (mirrors the already-shipped floodlight
  recipe geometrically), but is **not** the recommended primary
  representation here — see §4, a screen-space banner + ambient 3D pulse is
  more useful and far cheaper than modeling a siren tower. Kept as a
  reference in case "additional features" (§6) call for a literal fixture.
  — Sources: omni-warn.com, sentrysiren.com, fedsig.com product pages,
  en.wikipedia.org/wiki/Civil_defense_siren.

## 4. Diorama visualization & animation design

Mirror the weather chip/weather-FX split exactly: a **HUD element** for
at-a-glance status (the "banner") plus an optional **ambient 3D effect**
(the "beacon") that the household notices even while looking at the 3D
view, not a literal siren model.

### 4.1 Data model additions

- `Store.weatherAlerts?: WeatherAlertsConfig` (new top-level Store field —
  **must be added to `Planner._loadFromHa`'s explicit field list**, per
  the CLAUDE.md gotcha, or it resets on load):
  ```ts
  interface WeatherAlertsConfig {
    source: 'entity' | 'entities';   // 'entity' = one combined sensor (nws_alerts/MeteoAlarm/DWD-style);
                                       // 'entities' = a list (Environment Canada's 5-sensor split, or DWD's two sensors)
    entityIds: string[];              // one or more sensor/binary_sensor ids
    provider?: 'nws_alerts' | 'meteoalarm' | 'dwd' | 'environment_canada' | 'cap_alerts' | 'generic';
                                       // selects which attribute-shape parser to use; 'generic' = best-effort
    banner?: boolean;                 // default true — show the HUD banner
    effects3d?: boolean;              // default true — ambient pulse/tint master switch (mirrors weather.effects3d)
    minSeverity?: NormalizedSeverity;  // default 'minor' — suppress below this (a lot of Minor/Advisory noise otherwise)
  }
  ```
- Normalized runtime shape (analogous to `WeatherNow`), computed in a new
  **isolated** `src/weather-alerts.ts` (pure parsing/normalizing functions,
  same pattern as `weather.ts` — no network calls needed here since every
  source is already an HA entity, so this module is *simpler* than
  `weather.ts`, pure functions only, no `fetch`):
  ```ts
  type NormalizedSeverity = 'minor' | 'moderate' | 'severe' | 'extreme' | 'unknown';
  interface DioramaAlert {
    id: string;                 // stable key: entity_id + event + effective, or provider id
    event: string;              // "Tornado Warning" / "Flood Watch" / free text
    headline?: string;
    description?: string;
    severity: NormalizedSeverity;
    urgency?: 'immediate'|'expected'|'future'|'past'|'unknown';
    certainty?: 'observed'|'likely'|'possible'|'unlikely'|'unknown';
    effective?: string;          // ISO
    expires?: string;            // ISO
    senderName?: string;
  }
  ```
  Per-provider parse functions: `parseNwsAlerts(attrs)`,
  `parseMeteoAlarm(state, attrs)` (binary_sensor — one alert),
  `parseDwd(attrsBySensor)` (walks `warning_1..N_*` indices across both
  sensors), `parseEnvironmentCanada(attrsByCategory)` (walks the 5
  category sensors' title lists — no severity per-item without also
  calling the `get_alerts` action, so a `getEnvironmentCanadaAlerts` HaApi
  method mirroring `getWeatherForecasts` is the accurate path if per-alert
  severity/expiry is wanted; the flat sensor list gives titles only), a
  `parseGeneric(attrs)` fallback that looks for common key names
  (`severity`, `event`, `headline`, `expires`) so an unlisted/future
  integration still shows *something*.
- `Planner.weatherAlerts` (runtime getter, cheap, computed from live
  states — same idiom as `Planner.weatherNow`): the current
  `DioramaAlert[]`, recomputed in `_onStates` on a bound-entity change
  (config-path in `_isSlowEntity`, since these ids should re-render
  immediately like GPS/env sensor ids do — alerts are rare-but-urgent
  events, not chatty). `Planner.topAlert` = highest-severity active alert
  (severity, then urgency, then soonest-expiring as tiebreak) — the single
  value the banner/beacon key off.

### 4.2 HUD banner (2D + 3D shared overlay — new component, NOT the weather chip)

- New light-DOM Lit element `<diorama-alert-banner>`, mounted once in
  `app.ts`'s shared canvas container next to `<diorama-weather-chip>` (same
  "overlays both 2D and 3D, single instance" placement) — **kept as a
  separate component from the weather chip** per the research brief's
  explicit instruction that this is its own customization, not a chip
  extension, even though it lives in the same overlay slot.
- Renders only when `Planner.topAlert` exists and
  `weatherAlerts.banner !== false`: a full-width strip (or corner card on
  wide layouts) colored by the normalized severity ramp (§3), the event
  name + a countdown/expiry, and — for `extreme`/`severe` — a slow
  opacity pulse (CSS animation, no per-frame JS) so it reads as "urgent"
  without being a strobe-seizure risk.
- Click (edit mode only, same idiom as the weather chip's `open-weather`
  event) → `open-weather-alerts` event → sidebar scrolls to a new
  "Weather Alerts" section (source picker, entity id(s), provider select,
  banner/effects/minSeverity toggles, and a live list of currently-active
  alerts with full CAP detail for debugging — mirrors the weather section
  layout).
- Non-interactive in kiosk/view modes (display only, like the weather
  chip), and — importantly — **renders in kiosk/view modes too**: an
  active tornado warning should show on a wall-mounted kiosk tablet
  exactly like it shows in edit mode; this is a case where the existing
  "kiosk = display, not editing" split matters more than most fixtures.

### 4.3 3D ambient "beacon" effect (severity-scaled)

Recommended primary 3D treatment — reuse the **lightning-flash idiom**
(`_buildFlash`, a dedicated low-cost `DirectionalLight`/`PointLight`
pulsed with a decay envelope) rather than any new geometry:

- A new `_alertPulseLight` (built once, disposed only in `destroy()`, same
  "shared resource" rule as `_gradientMapTex`/`_blobTex`) — a low-intensity
  colored `PointLight` positioned above the floor center, color driven by
  `topAlert.severity` (yellow/orange/red per §3's ramp), pulsing on a slow
  sine (period ~2–3 s for `extreme`, slower/absent for `minor`/`moderate`)
  — **not** a strobe; a "just noticeable at the edge of vision" ambient
  wash so the whole house tints faintly, similar in spirit to how a real
  emergency-alert TV crawl tints the room's TV light, not a literal siren
  beacon in the scene. Zero geometry cost, cheap to gate.
- Folds into `three-view`'s per-frame `_advanceWeather`-style tick (a new
  small `_advanceAlertPulse(dt)`, called every frame like weather FX) —
  **not** dirty-keyed for the animation itself (continuous motion, mutate
  in place), but the *existence/color/on-off* of the light rides a new
  `_keyAlerts` dirty key (`configRev` + `topAlert.severity` + `topAlert.id`
  bucket) so the light object itself is only built/destroyed on a real
  alert transition, matching the "dirty-key rebuilds, per-frame mutation"
  architecture rule verbatim.
- Master gate: `weatherAlerts.effects3d !== false` AND a live alert exists
  AND severity ≥ `minSeverity` — mirrors `weather.effects3d`'s
  master-kill-switch pattern exactly; add a `layers2d`-style **not**
  needed here (this isn't a placeable fixture with visibility toggling
  per-floor, it's a whole-house ambient state, same category as the
  weather chip/FX which also aren't gated by `Layers2D`).
- **Do not** hook this into `applyScenePreset`/`resolveScenePreset`'s
  day/dusk/night downgrade path — that mechanism dims for *ambient*
  conditions (fog, overcast) where a "dimmer, moodier" look is correct;
  an active tornado warning should visually intensify, not dim, so it's a
  parallel additive light, not a preset modifier.

### 4.4 Optional: 2D canvas treatment

- 2D plan view gets a thin colored border/vignette around the floor plan
  canvas when `topAlert` is active (severity-colored), plus the same
  event/expiry text as a small corner card — cheap, no new hit-testing,
  no new layer needed (like the banner, this is a HUD overlay, not a
  drawn/gated `Layers2D` entry, since there's no placeable "alert fixture"
  on the plan — nothing to hide per-item).

### 4.5 Why NOT a placeable fixture (unlike safety sensors/alarm keypad)

Every other "alert-shaped" thing already in Diorama (safety sensors, alarm
keypad, camera alert popups) is anchored to a **specific device the user
placed** on the plan. A weather alert has no natural placement — it's a
property-wide condition like weather itself, not a discrete IoT device
reading. That's why this doc recommends the weather-chip/weather-FX
architecture (whole-scene overlay + ambient effect) over the
canvas-fixture recipe (place → snap → per-item hit-test → sidebar row).
§6 notes an optional literal "siren" fixture as an *additional* feature
for households that actually own one, which **would** follow the full
canvas-fixture recipe since it's then a real placed device.

## 5. Integration steps (build-ready checklist)

1. **Types**: add `WeatherAlertsConfig` to `types.ts`'s `Store`; add
   `weatherAlerts?: WeatherAlertsConfig` to the `Store` interface.
2. **Loader**: add `weatherAlerts: remote.weatherAlerts ?? undefined` to
   `Planner._loadFromHa`'s explicit field list (CLAUDE.md gotcha — silent
   reset otherwise). No per-floor fields (property-wide, like `geo`/
   `weather`).
3. **Normalizer module**: `src/weather-alerts.ts` — pure functions only
   (`NormalizedSeverity`, `DioramaAlert`, per-provider parsers, a
   `pickTopAlert(alerts)` ranker). Unit-test-shaped like `weather.ts`/
   `geo.ts` — build a `test-pages/weather-alerts-test.html` following the
   existing `esbuild --bundle` pattern (`weather-test.html`'s harness) if
   the project wants the usual `X PASS N/N` smoke page.
4. **Planner integration**: `Planner.weatherAlerts` (runtime getter) +
   `Planner.topAlert` (runtime getter); recompute in `_onStates` when a
   bound alert entity changes (config-path in `_isSlowEntity`, scoped to
   the currently-configured entity ids, mirroring the geo/GPS/env pattern
   — never a blanket domain rule). `setWeatherAlertsConfig(mut)` mutator
   for the sidebar, following `setWeather`'s shape.
5. **(Optional, only if per-alert Environment Canada detail is wanted)**
   Add `getEnvironmentCanadaAlerts(configEntryId)` to `HaApi` in **both**
   `HassClient` and `HassPanelAdapter`, calling
   `environment_canada.get_alerts` with `return_response: true` — same
   shape as the already-shipped `getWeatherForecasts`.
6. **HUD component**: `<diorama-alert-banner>` (light DOM via
   `src/ui/define.ts`'s idempotent registration), mounted once in
   `app.ts` next to `<diorama-weather-chip>`. Reads `Planner.topAlert`,
   renders severity-colored banner, dispatches `open-weather-alerts` on
   edit-mode click.
7. **Sidebar section**: new `_section('weatherAlerts', 'Weather Alerts', …)`
   in `sidebar.ts` — add `'weatherAlerts'` to the collapsible-section slug
   list; provider/source picker (reuse `<diorama-entity-picker>` for
   entity selection, domain hint `sensor`/`binary_sensor`), banner/effects
   toggles, `minSeverity` dropdown, and a read-only live list of
   `Planner.weatherAlerts` for debugging (event, severity, expires).
8. **3D ambient beacon**: in `three-renderer.ts`, add `_alertPulseLight`
   (built once, `null` until first needed, disposed only in `destroy()`);
   add `updateAlertPulse(alert: DioramaAlert | null)` builder that
   sets color/intensity target and toggles existence; add
   `_advanceAlertPulse(dt)` called every frame from `_animate` (same slot
   as `_advanceWeather`) to sine-pulse intensity.
9. **three-view wiring**: compute `_keyAlerts` (configRev +
   severity bucket + alert id) in `_tickOnce`; call `updateAlertPulse`
   only when the key changes; call `_advanceAlertPulse` unconditionally
   each frame (guarded internally on `_alertPulseLight != null`).
10. **2D overlay** (optional, §4.4): a small draw call at the end of
    `canvas-render.ts`'s `drawAll` (or a sibling function called from the
    RAF) for the severity vignette/corner card — gate on
    `p.topAlert && banner !== false`, no `Layers2D` entry needed (whole-
    scene HUD, not a per-item layer).
11. **Typecheck + build**: `npm run typecheck && npm run build` (no test
    suite exists per CLAUDE.md; these two gates plus the optional smoke
    test page are the verification surface).

## 6. Potential additional features

- **Literal placeable "siren" yard fixture** for users who actually own an
  outdoor warning siren or want a stylized rotating-beacon prop — would
  follow the *full* canvas-fixture recipe (types → geometry defaults →
  canvas-render/hit/interact → sidebar → three-renderer group + dirty key)
  since it's then a real placed device with position/rotation, unlike the
  whole-scene banner/beacon in §4. Visual reference sizes/geometry are in
  §3 (pole 6–12 m tall in reality — would need major downscaling/
  stylization to read sensibly at house scale, similar to how the
  floodlight fixture already abstracts real fixture proportions).
- **Push-notification style escalation**: pair the banner with an HA
  `notify.*` fire from a Diorama-side automation suggestion (out of scope
  for the panel itself, but worth documenting as a companion automation
  snippet in the eventual feature's user docs) — e.g. auto-suggest an HA
  automation trigger on the same entity for mobile push, since Diorama
  itself doesn't send notifications.
- **Multi-alert stacking**: show a small badge count ("3 active alerts")
  and let the banner cycle through them, rather than only ever showing
  `topAlert` — natural v2 once v1's single-alert path ships.
- **Per-room/zone relevance filtering**: some sources (NWS storm-based
  polygons) are precise enough to know if the alert polygon actually
  covers the specific address vs. the whole county — not achievable with
  today's flat-sensor integrations (polygon isn't exposed, §2.8) but worth
  a note if `cap_alerts`-style polygon handles become mainstream.
  event Diorama should treat as commuting-relevant even off-property).
- **Historical alert log**: leverage `HaApi.getHistory` (already shipped)
  against the alert entity/entities to show a small "past 7 days" timeline
  in the sidebar section — cheap since the plumbing exists.
- **Voice/chime**: an audio cue on new `extreme` alerts — explicitly
  against the codebase's stated "NO audio (permanent decision)" rule for
  weather FX (lightning), so this would need a deliberate, separate
  decision to break that precedent, not a default.

## 7. Open questions & risks

- **Vendor fragmentation is real and will only grow**: five sources here,
  five different entity shapes, and BOM's exact attributes couldn't be
  confirmed without diving into `custom_components/bureau_of_meteorology`
  source directly — do that before shipping an AU adapter. The `'generic'`
  provider fallback (§4.1) is the pressure-release valve for "one more
  country's custom integration" rather than trying to enumerate all of
  them up front.
- **MeteoAlarm's core integration can only carry one active alert's
  attributes at a time** (a live, acknowledged HA core bug, §2.2) — a
  Diorama adapter built against it inherits that undercount; document this
  limitation in the sidebar UI rather than silently under-reporting, and
  consider recommending `cap_alerts` (§2.6) for EU users who want accurate
  concurrent-alert counts, once that integration is verified spec-accurate.
- **`cap_alerts` details need re-verification before depending on them**:
  this research relied on the repo's docs surface via an automated fetch
  (not a manual source read); the entity-id scheme, the exact WS geometry
  endpoint (`cap_alerts/geometry`), and the `incident_created`/
  `incident_updated` event-bus names are plausible-and-consistent with the
  stated design goal but should be confirmed against the actual `model.py`/
  integration source at build time — treat as "promising lead," not
  "load-bearing fact," until then. It is also a young project (4 stars) —
  a build-time risk if it's abandoned or its schema shifts before a user
  adopts it; the `'generic'`/per-provider-parser design in §4.1 means
  Diorama isn't coupled to it either way.
- **16 KB recorder attribute limit** (§2.6) is a real HA constraint but
  affects *history*, not live WS state — confirm this distinction holds
  before treating it as a blocker; it's presented here as a reason
  `cap_alerts`'s one-entity-per-alert design exists, not as a reason
  Diorama's live rendering would break.
- **Should severity ever escalate faster than the alert source's own
  polling interval?** NWS via `nws_alerts` polls every 60 s by default;
  DWD/Environment Canada/BOM sit at 5–15 minutes. A banner that appears
  minutes after a real tornado warning issues is a real (if HA-source-
  side, not Diorama-side) latency risk worth calling out to users choosing
  a source/provider — not something Diorama's rendering layer can fix.
- **Should the ambient 3D pulse respect quiet hours / do-not-disturb?**
  Not investigated here — worth a product decision (e.g. suppress the
  visual pulse but keep the banner between certain hours) before
  shipping, since an "extreme" pulse at 3 AM is exactly when it's most
  useful (life-safety) but also most likely to be perceived as an
  unwanted feature if a user finds it startling on a bedroom-mounted
  tablet — lean toward "always show," matching how the codebase already
  treats safety-sensor/smoke-alarm renders as always-on regardless of
  time.
- **Multi-entity `'entities'` source (Environment Canada's 5-sensor
  split, DWD's 2-sensor split) complicates the "which is `topAlert`"
  ranking** — needs to merge across sensors before ranking by severity;
  called out in §4.1's parser design but worth flagging as the trickiest
  single piece of ingestion logic.
- **Does Diorama want an EAS/IPAWS-style *test* alert filter?** CAP's
  `status`/`messageType` fields (`Test`/`Exercise` vs `Actual`) exist on
  the NWS side (§2.1.1) — a stray `Test` alert rendering as a real red
  pulse would be a bad first impression; the generic parser should drop
  non-`Actual` alerts where that field is present, pass through
  everything unfiltered where it's absent (MeteoAlarm/DWD/EC don't expose
  it at the flat-sensor level).

## 8. Sources

- [nws_alerts (finity69x2)](https://github.com/finity69x2/nws_alerts) and its
  [README](https://github.com/finity69x2/nws_alerts/blob/master/README.md)
- [NWS Services Web API docs](https://www.weather.gov/documentation/services-web-api)
  and `api.weather.gov/alerts/active` (live JSON structure)
- [NWS CAP documentation (vlab.noaa.gov)](https://vlab.noaa.gov/web/nws-common-alerting-protocol/cap-documentation)
- [MeteoAlarm — Home Assistant](https://www.home-assistant.io/integrations/meteoalarm/)
- [MeteoAlarm core issue: doesn't display all active warnings #131045](https://github.com/home-assistant/core/issues/131045)
  / [#156838](https://github.com/home-assistant/core/issues/156838)
- [MeteoAlarm Python library docs (awareness types/levels)](https://meteoalarm.readthedocs.io/en/latest/warnings.html)
- [Deutscher Wetterdienst (DWD) Weather Warnings — Home Assistant](https://www.home-assistant.io/integrations/dwd_weather_warnings/)
- [Environment Canada — Home Assistant](https://www.home-assistant.io/integrations/environment_canada/)
- [environment_canada.get_alerts action docs](https://www.home-assistant.io/actions/environment_canada.get_alerts/)
- [environment_canada.get_forecasts action docs](https://www.home-assistant.io/actions/environment_canada.get_forecasts/)
- [bureau_of_meteorology (bremor)](https://github.com/bremor/bureau_of_meteorology)
- [ha_bom_australia (safepay fork)](https://github.com/safepay/ha_bom_australia)
- [cap_alerts (seevee)](https://github.com/seevee/cap_alerts)
- [OASIS Common Alerting Protocol v1.2 spec](https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2-os.html)
- [HA recorder 16384-byte attribute size warning — home-assistant/core#102964](https://github.com/home-assistant/core/issues/102964)
- [Weather.gov Hazards Map colors / WWA color reference PDF](https://www.weather.gov/media/nws/WWA_Changes_10124.pdf)
- Outdoor warning siren specs: [OmniWarn](https://omni-warn.com/outdoor-warning-sirens/),
  [Sentry Siren](https://www.sentrysiren.com/outdoor-warning-sirens),
  [Federal Signal 508-128](https://www.fedsig.com/product/508-siren),
  [Civil defense siren — Wikipedia](https://en.wikipedia.org/wiki/Civil_defense_siren)
