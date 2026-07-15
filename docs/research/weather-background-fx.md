# Weather as background animation + incoming-from-distance

Research doc for a new Diorama feature. Build-ready: cites exact HA
attributes/actions and exact Diorama hooks (files, groups, dirty keys) so this
can be implemented without further investigation.

## 1. Summary

Diorama's 3D weather system (W1–W3) already animates weather **in the scene**:
precipitation particles, ground fog, a lightning flash light, wind-driven dust,
drifting cloud-SHADOW decals on the ground, frost, puddles, and a "storm
brewing" cloud-bank sprite trio placed at a fixed distance on the upwind
horizon when `rainSoon` is true. What it does **not** yet have is a
**background/sky layer**: the scene's backdrop is a single flat
`THREE.Color` per lighting preset (day/dusk/night), there is no sun/moon disc,
no visible clouds *in the sky* (only their ground shadows), and the
storm-bank sprite is binary (present/absent) rather than a continuous
"approaching over the next N hours" animation.

This feature adds:
1. **A sky dome** — a large gradient-shaded background sphere (zenith → horizon
   colors) driven by the existing lighting preset + weather dimming, replacing
   the flat background color with something that reads as an actual sky.
2. **Sun and moon discs** — billboard sprites at the real sky position (reusing
   the azimuth/elevation math already built for W3's `sunPosition` effect),
   with the moon phase-shaded from HA's `moon.moon` state.
3. **Visible sky clouds** — camera-facing puff sprites at a high "cloud layer"
   drifting with wind, scaled by `cloud_coverage`, distinct from (and
   complementary to) the existing ground cloud-shadow decals.
4. **Graduated storm approach** — extending the existing storm-bank sprite from
   a boolean on/off into a position that eases IN from the far horizon toward
   the house as the forecast's rain-onset time gets closer, so a user watching
   the diorama sees the weather visibly arriving rather than popping in.

This fits Diorama's premise precisely: it is a *spatial* panel — the pitch is
"see your home's state in spatial context." Current 3D weather already answers
"is it raining right now"; a sky dome + approaching storm bank answers "what
will the sky/weather look like in an hour", turned into something you glance
at across the room, exactly like looking out a window. It is a pure rendering
layer with no new interactivity, so it composes cleanly with every existing
mode (edit/kiosk/view) and adds no new toggle surface beyond the existing
per-effect toggle pattern (`WeatherEffectKey`).

## 2. Home Assistant data model

Everything needed already flows into Diorama or is a small extension of
plumbing that exists. No new integration is required for the core feature;
one optional enhancement (real moon position) needs a custom/HACS component.

### 2.1 `weather.*` entity (core, already wired)

Domain: `weather`. Docs: https://www.home-assistant.io/integrations/weather/

- **State** = one of 15 `condition` strings (`sunny`, `clear-night`, `cloudy`,
  `partlycloudy`, `rainy`, `pouring`, `snowy`, `snowy-rainy`, `hail`,
  `lightning`, `lightning-rainy`, `windy`, `windy-variant`, `fog`,
  `exceptional`). Already normalized 1:1 into `HaCondition` in
  `src/weather.ts`.
- **Attributes used already** (`resolveWeatherEntity` in `src/weather.ts`):
  `temperature`/`temperature_unit`, `wind_speed`/`wind_speed_unit`,
  `wind_bearing` (may be a compass string — `parseWindBearing` handles both),
  `cloud_coverage` (%), `visibility`/`visibility_unit`, `uv_index`,
  `wind_gust_speed`, `apparent_temperature`, `humidity`.
- **`cloud_coverage`** (%) is the direct driver for sky-cloud DENSITY (already
  fetched into `WeatherNow.cloudCoverage`, already used for the ground
  cloud-shadow effect — this feature reuses the same number for sky puffs, no
  new fetch).

### 2.2 `weather.get_forecasts` action (core, HA 2024.4+; already wired)

Docs: https://www.home-assistant.io/actions/weather.get_forecasts/

```yaml
action: weather.get_forecasts
target:
  entity_id: weather.home
data:
  type: hourly   # or daily | twice_daily
response_variable: weather_forecast
```

`return_response: true` is required over the WS `call_service` path (Diorama
calls this via `call_service` with `return_response: true` already — see
`HaApi.getWeatherForecasts` in both `HassClient` (`src/ha-client.ts`) and
`HassPanelAdapter` (`src/ha-panel-adapter.ts`), normalized by the shared
`normalizeForecasts`). Response is keyed by entity id →
`{ forecast: ForecastRecord[] }`; fields actually present depend on the
provider, all optional. Diorama's `ForecastRecord` (`src/ha-client.ts`)
already carries `datetime`, `condition`, `temperature`, `templow`,
`precipitation`, `precipitation_probability` — the full HA schema additionally
exposes `apparent_temperature`, `dew_point`, `humidity`, `cloud_coverage`,
`pressure`, `uv_index`, `wind_speed`, `wind_gust_speed`, `wind_bearing`,
`is_daytime` (twice_daily only). **`cloud_coverage` per hourly record** is not
currently read into `ForecastRecord` but is in the response schema — add it
(additive, one field) to compute an "incoming cloud bank" ETA the same way
`rainSoon` is computed today.

**What's already wired vs. what this feature adds**: `Planner._refreshEntityForecasts`
(`src/planner.ts`) already fetches `hourly` every 30 min + on reconfigure and
reduces it to a single boolean (`forecastRainSoon`, `src/weather.ts`) consumed
by the existing storm-bank effect. This feature needs the **time until** the
first qualifying hourly record, not just the boolean — add a sibling pure
function (e.g. `forecastRainEtaMinutes(records, nowMs, horizonH)`) that returns
the minutes until the first record crossing the rain-ish threshold (or
`null` if none within the horizon), mirroring `forecastRainSoon`'s exact
scan/threshold logic. Same input, same call site, one more derived field on
`WeatherNow` (e.g. `rainEtaMin?: number | null`).

Open-Meteo (`fetchOpenMeteo` in `src/weather.ts`) already requests
`hourly=precipitation_probability,weather_code&forecast_hours=4` — bump
`forecast_hours` if a longer look-ahead window is wanted for a slower/more
gradual approach animation (e.g. 6), and compute the same ETA client-side from
the existing `times`/`probs`/`codes` arrays already parsed in that function
(no new fetch, just more hours + one more reduction).

### 2.3 `sun.sun` entity (core, partially wired)

Domain: `sun`. Docs: https://www.home-assistant.io/integrations/sun/

- **State**: `above_horizon` / `below_horizon`.
- **Attributes**: `azimuth` (deg, clockwise from true north), `elevation` (deg;
  negative = below horizon), `rising` (bool — true from solar midnight to
  solar noon), `next_dawn`, `next_dusk`, `next_midnight`, `next_noon`,
  `next_rising`, `next_setting` (all ISO datetimes, UTC).
- **Already wired**: `sunElevation`/`isDay` in `src/time-of-day.ts` read
  `elevation` + state string. `WeatherFxState.sunAzimuthDeg` /
  `sunElevationDeg` (three-view, W3 "true sun position" effect) already carry
  azimuth+elevation through to `_sunTargetFromSky` in `three-renderer.ts`,
  which converts them into a scene-frame `THREE.Vector3` for the directional
  light — **this exact function is what the sun-disc sprite should reuse**
  for its billboard position (same azimuth/elevation, same plan↔scene
  conversion, larger fixed radius).
- Not exposed: sun **angular size** (irrelevant — always ~0.5°, treat as a
  fixed decorative sprite size) or any texture/color-temperature attribute
  (derive tint from elevation the way `applyScenePreset` already tints the
  light: warm/orange near the horizon, white near zenith).

### 2.4 `moon.moon` entity (core `moon` integration — phase only)

Docs: https://www.home-assistant.io/integrations/moon/

- **State**: one of 8 exact phase strings: `new_moon`, `waxing_crescent`,
  `first_quarter`, `waxing_gibbous`, `full_moon`, `waning_gibbous`,
  `last_quarter`, `waning_crescent` (frontend-facing labels are Title Case;
  the entity `state` value itself is the snake_case form used across HA
  automations/templates).
- **No attributes** beyond the standard set — no illumination %, no
  moonrise/moonset, no altitude/azimuth (position). It is computed locally
  from the system clock/date, not fetched, and updates at most once/day.
- **This is the ceiling of what core HA gives you.** A moon that visibly
  moves across the sky (altitude/azimuth like the sun) is **not available**
  from the core `moon` integration over the WebSocket API. Options, in order
  of effort:
  1. **Cheapest (recommended for v1)**: don't track real moon position at
     all — render the moon as a static (or slow-drifting) disc opposite the
     sun's azimuth whenever `isDay(states)` is false, sized/lit by the real
     `moon.moon` phase texture. This is visually convincing at diorama scale
     and needs zero new HA entities.
  2. **Custom/HACS integration**: `moon-phase` by frlequ
     (github.com/frlequ/moon-phase) or the "Lunar Phase" custom integration
     (github.com/ngocjohn/lunar-phase) expose illumination %, moon age,
     altitude/azimuth, moonrise/moonset as sensor attributes — if the user
     has one installed, prefer its azimuth/altitude attributes the same way
     `sun.sun`'s are used, falling back to option 1 when absent. **Flag as
     optional/custom** — do not require it.
  3. **Client-side ephemeris**: compute real moon RA/dec/az/alt with a small
     pure-JS lunar position formula (Meeus-style low-precision approximation,
     no network) seeded from the geo landmarks' lat/lon (`Store.geo`, already
     in Diorama for GPS/G-arc) + the browser clock. This needs no new HA
     entity but is real astronomical code — a good "additional feature",
     not required for v1.

### 2.5 What is NOT available over the HA WebSocket API

- **Satellite/radar cloud imagery** — no core entity exposes actual cloud
  cover *imagery* (shape/position of real clouds); `cloud_coverage` is a
  single percentage, not a map. A visually "real" incoming cloud formation is
  necessarily a stylized approximation (procedural puffs), never a literal
  radar loop, unless the user separately embeds a weather-radar Lovelace card
  (out of scope — Diorama is a 3D/2D plan panel, not a dashboard host).
- **Moon altitude/azimuth / illumination %** from the *core* integration (see
  2.4) — custom-component territory.
- **Per-hour cloud_coverage** is in the documented forecast schema but not
  guaranteed populated by every weather provider (Met.no's default HA
  integration is coverage-sparse on some fields; Open-Meteo's `hourly=` param
  the panel already calls can add `cloud_cover` alongside
  `precipitation_probability` cheaply — same fetch, one more field).
- **Sun angular size / limb darkening / real color temperature** — not
  modeled by HA; purely a rendering choice (see §3).

## 3. Real-world / visual reference

Values here are reference points for shader/material tuning, not physical
constraints Diorama must satisfy exactly — the whole renderer is a stylized
toon look (see CLAUDE.md "Sims-style rendering"), so treat these as anchors to
stay plausible, not targets to replicate photorealistically.

- **Sky gradient reference hexes** (typical clear-sky zenith→horizon, commonly
  used in stylized engines):
  - Midday: zenith `#4a90d9`/`#5b9bd5`, horizon `#bcd9f2`/`#dbeeff` (near-white
    haze at the horizon).
  - Dusk/dawn: zenith `#2b2450`/`#3a2b5c`, horizon band `#ff8a4a`/`#ffb37a` →
    `#ffdca8` (warm band low, cool purple high) — matches Diorama's existing
    dusk preset tint `0xff8a4a` sun color / `0x2a2030` background almost
    exactly (`applyScenePreset` in `three-renderer.ts`), so the dome's
    horizon color can literally reuse/derive-from that constant for
    continuity.
  - Night: zenith near-black `#05060d`, horizon slightly lighter
    `#10131f`/`#181c2c` (skyglow) — matches the existing night background
    `0x0d0d1a`.
- **Cloud altitude bands** (real world, for relative LAYERING only — not
  literal since a house floor is ~10–20 m across and a sky dome needs
  distances in the multi-km range to avoid parallax popping at head height):
  low cumulus ~600–2,000 m, mid altostratus ~2,000–6,000 m, high
  cirrus ~6,000–12,000 m. Practical takeaway: put the "cloud layer" for
  puff-sprites at a SINGLE fixed scene height well above the roofline and a
  large radius (Diorama's existing storm-bank sprite already goes out to
  `max(fw, fd) + 14000` mm at `y ≈ 4200–5400` mm — reuse that same
  order-of-magnitude ring for ordinary sky clouds, just distributed all the
  way around rather than only upwind).
- **Sun/moon angular size**: both ~0.5° from Earth. At a dome radius R,
  disc diameter ≈ `R × tan(0.5°) × 2 ≈ R × 0.00873` — mathematically tiny at
  house scale (a 12,000 mm dome radius, matching `_sunTargetFromSky`'s
  existing `R = 12000`, gives a true disc of just ~105 mm). Stylized dioramas
  universally exaggerate this 5–15× for legibility — recommend a fixed sprite
  size (~600–900 mm) independent of the true angular math, same spirit as
  the existing plumbob/name-label sprites that are sized for on-screen
  readability, not physical accuracy.
- **Colors**: sun disc warm white→orange ramped by elevation (bright near
  zenith, `#fff6e0`→`#ff8a4a` near the horizon — same two colors already used
  for the day/dusk sun light tint in `applyScenePreset`); moon disc pale
  blue-white `#dfe6ff`/`#c9d3f0` (already the night sun-light tint constant),
  phase-shaded via a small canvas texture (an 8-frame lookup keyed by the
  `moon.moon` state, drawn once and cached — same idiom as the existing env
  sprite / camera-alert sprite canvas textures).
- **Wind-driven cloud puffs**: soft round off-white/grey blobs, alpha ~0.5–0.8,
  tinted darker/denser with higher `cloud_coverage` (reuse the existing
  `_cloudShadowTexture()` soft radial canvas texture shape but a *lighter*
  variant for the visible sky puffs vs. the darker ground-shadow variant).
- **Storm bank approach reference**: real storm systems visibly darken the
  horizon 10–30 minutes before arrival at typical frontal speeds
  (~20–50 km/h) — the existing `_buildStormBank` already sits the bank at a
  fixed far distance keyed only by a boolean; mapping ETA-to-distance (§4.4)
  gives the same "watch it roll in" read without needing real speed/vector
  data HA doesn't expose.

## 4. Diorama visualization & animation design

### 4.1 New config surface

Add to `WeatherEffectKey` (`src/types.ts`) two new per-effect toggles,
following the exact existing pattern (`weatherEffectEnabled` default table in
`src/weather.ts`):
- `'sky'` — dome gradient + sun/moon discs + stars. Default **ON** (matches
  the other visual defaults).
- Reuse the existing `'clouds'` key for the new sky-puff sprites (it already
  means "cloud-driven visuals react to `cloud_coverage`" — the ground-shadow
  decals and the new sky puffs are two facets of the same toggle, no new key
  needed there).
- Reuse the existing `'precipForecast'` key for the graduated storm-bank
  approach (it already means "show the brewing-storm cloud bank"; extending it
  from binary to graduated distance is a behavior change under the same flag,
  default stays **OFF** like today since it's the least universally-wanted
  effect).

No new `Store`/`WeatherConfig` fields are strictly required beyond the one new
`WeatherEffectKey` entry (which is a `Partial<Record<...>>` already, so it's
additive and safe — no `_loadFromHa` list change needed since `weather` as a
whole is already in that list and `effects` is a sub-object of it).

### 4.2 New `WeatherFxState` fields (three-renderer.ts)

Extend the existing interface (it already carries `cloudCoverage`,
`sunAzimuthDeg`, `sunElevationDeg` — all optional, all shaped by three-view):
- `rainEtaMin?: number | null` — minutes until forecast rain onset (from the
  new `forecastRainEtaMinutes`); `null`/`undefined` = nothing incoming or no
  forecast data (mirrors how `rainSoon` degrades today).
- `moonPhase?: string | null` — the raw `moon.moon` state string, read once
  per tick like every other live state (cheap; moon state changes at most
  daily so it never re-triggers the dirty key in practice, but folding it in
  keeps the pattern honest).
- Both optional so a stale renderer chunk (the documented mixed-version-chunk
  gotcha) degrades gracefully — sky dome still renders with defaults, just no
  moon phase shading / no graduated approach.

### 4.3 Renderer group & lifecycle

New **`_skyGroup`** (own top-level group, added to `scene.add(...)` alongside
the other persistent groups in the constructor, added to the same disposal
list `destroy()` already walks, and added to `clearTransientGroups()` — mirror
`_weatherGroup`'s exact lifecycle wiring). Rationale for a SEPARATE group from
`_weatherGroup`: the sky dome + sun/moon + stars are driven primarily by the
**lighting preset** (which already changes independent of weather — a clear
night vs. a clear day), not by `effects3d`/`weatherFx` layer visibility in the
same sense — but the CLOUD PUFFS and the graduated storm bank belong
conceptually to weather and should keep living under `_weatherGroup` (only the
NEW puff-sprite builder + the approach-distance change to `_buildStormBank`
touch `_weatherGroup`; the dome/sun/moon/stars are the only genuinely new
group).

Members of `_skyGroup`:
- **Sky dome**: one large inverted sphere (`THREE.SphereGeometry(30000, 24, 16)`,
  `side: THREE.BackSide`), material = a small custom `ShaderMaterial` (NOT
  `_mat()` — document this as a new, explicit exemption alongside the existing
  `PointsMaterial`/`SpriteMaterial` weather-particle exemption in CLAUDE.md,
  since a toon-shaded sky makes no visual sense) with two `vec3` uniforms
  (`topColor`, `bottomColor`) lerped by world-space Y in the vertex shader —
  the standard cheap gradient-skydome technique (three.js forum reference:
  https://discourse.threejs.org/t/how-would-you-texture-a-sphere-with-a-linear-gradient-with-multiple-colour-stops/19070,
  Ian Webster's skydome writeup https://www.ianww.com/blog/2014/02/17/making-a-skydome-in-three-dot-js).
  `topColor`/`bottomColor` are set from the resolved `ScenePreset` (day/dusk/
  night) using the same tints `applyScenePreset` already assigns to
  `scene.background` — literally derive the dome's two stops from the
  existing preset color plus a computed lighter/darker variant (`lighten()`
  from `geometry.ts` already exists for exactly this: lighten the existing
  flat bg color toward the zenith tone, or darken toward it for the horizon
  band) rather than inventing a second color table. Update the dome's
  uniforms wherever `applyScenePreset` already sets `_scene.background` (same
  call site, one more assignment) — the flat `scene.background` Color can stay
  as-is underneath/behind the dome as a safety fallback (WebGL context loss,
  or the dome disabled via the new toggle) exactly like today.
  Storm-brewing darkening (`_setStormDark`/`_stormDarkAmt`) already eases the
  flat background color — extend the same easing to also lerp the dome's
  uniforms (same `_stormDarkAmt` value drives both).
- **Sun disc**: one `THREE.Sprite` with an unlit glow texture (soft radial
  white→transparent canvas, same generation idiom as `_blobTex`/
  `_cloudShadowTex`), positioned via `_sunTargetFromSky(azDeg, elevDeg)` at a
  LARGER fixed radius than the directional light uses today (dome radius, not
  the light's R=12000 — reuse the function, pass the dome's radius) — same
  azimuth/elevation source (`WeatherFxState.sunAzimuthDeg/sunElevationDeg`,
  already piped from `sun.sun` via three-view). Hidden (`visible = false`)
  when `elevationDeg <= -2` (below horizon + a hair of margin) or the `'sky'`
  effect is off; scale/tint interpolated by elevation as in §3.
- **Moon disc**: a second `THREE.Sprite`, phase-shaded via an 8-entry cached
  `CanvasTexture` lookup keyed by `moonPhase` (draw a full circle with a dark
  crescent/gibbous mask matching each of the 8 `moon.moon` states — cheapest
  correct rendering, no external art asset). Position: mirror the sun's
  azimuth (opposite side, `azDeg + 180`) with a fixed pleasant elevation arc
  driven off `-sunElevationDeg` clamped to a minimum-above-horizon value, per
  §2.4 option 1 (no real ephemeris in v1). Visible only when `!isDay` (or
  fading in as the sun sets, mirroring how it actually looks — both can be
  above the horizon briefly at dusk in reality, but the simple v1 model is
  sun XOR moon and that reads fine at diorama scale).
- **Starfield**: one small `THREE.Points` (~150–300 white dots, built once,
  static positions on the dome — never rebuilt, just visibility toggled),
  opacity ramped by `(1 - dayness)` where `dayness` is derived the same way
  the sun disc's own elevation-based tinting already is (share one computed
  "how daytime is it" scalar, don't recompute it twice).
- Sprite `CanvasTexture`s here (sun glow, per-phase moon textures, star dot
  texture) are SHARED/cached like `_blobTex`/`_gradientMapTex` — built once,
  disposed only in `destroy()`, NEVER per-frame or per-rebuild (they aren't
  per-rig, so `_disposeSpriteMaps` doesn't apply here — that helper is only
  for the PER-RIG bubble/name-label/env sprites that get rebuilt constantly).

### 4.4 Sky cloud puffs (extends `_weatherGroup`, `clouds` effect key)

A new builder `_buildSkyClouds(coveragePct, wdx, wdz)` sibling to the existing
`_buildCloudShadows` — same trigger (`eff.clouds && fx.cloudCoverage != null`),
same spawn-box-with-wind-drift idiom as the precip clouds
(`_buildPrecipCloud`) and the ground shadows, but:
- Sprites placed at a fixed high Y (e.g. 4500–6000 mm, well above rooflines)
  in a ring around the floor at the storm-bank's radius order-of-magnitude,
  not confined to directly overhead.
- Count scales with `cloudCoverage` (`<20% → 2–3, ~50% → 6–8, ~90%+ → 12–15`),
  same "no particles below a floor threshold" idiom as the existing
  `cloudCoverage < 30` → no ground shadows guard (reuse or relax that
  threshold independently for the sky puffs since a few decorative puffs at
  20% coverage still read fine even if ground shadows would be too sparse to
  bother with).
- Same wind-drift + spawn-box-wrap motion as `_weatherCloudShadows` (mutated
  in `_advanceWeather`, zero per-frame allocation) — literally clone that
  drift math for the new list, don't invent a second motion model.
- Texture: a lighter/whiter variant of `_cloudShadowTexture()` (a second
  cached canvas texture, e.g. `_skyCloudTex`, same generation function
  parametrized by a color argument) so day clouds don't look like dark ground
  smudges when lifted into the sky.

### 4.5 Graduated storm approach (extends `_buildStormBank`, `precipForecast` key)

Today `_buildStormBank` is built/torn down purely by the `brewing` boolean
(`!!eff.precipForecast && !!fx.rainSoon && ...`) at a FIXED distance
(`max(fw, fd) + 14000`). Change:
- Compute a **target distance** from `fx.rainEtaMin` (new field, §4.2):
  `far = max(fw, fd) + 14000` (today's constant, "just visible on the
  horizon"), `near = max(fw, fd) + 2500` (close enough to feel imminent
  without crossing into the weather-effects spawn box). Map ETA linearly (or
  eased) across a configurable horizon (reuse `forecastRainSoon`'s existing
  3 h default as the "far" end): `t = clamp01(1 - rainEtaMin / 180)`,
  `dist = lerp(far, near, t)`.
  - `rainEtaMin == null` (nothing incoming) → keep current behavior, bank
    hidden.
  - Already raining (`intensity01 > 0` for the live condition) → snap to
    `near` (it has arrived; the in-scene precip/fog effects take over).
- **Ease, don't teleport**: store the target distance and ease the bank
  group's position toward it over a slow τ (~8–15 s real time is plenty
  since the underlying ETA itself only refreshes every 30 min per the
  existing forecast-poll cadence — this is a "notice it crept closer" effect,
  not smooth real-time motion) in `_advanceWeather`, same easing idiom already
  used for `_stormDarkAmt`/fog density/sun position.
- Everything else about `_buildStormBank` (3 overlapping billboards, upwind
  direction from `wdx`/`wdz`, `_cloudShadowTexture()` reuse) stays as-is —
  this is a small, additive change to an existing function, not a rewrite.

### 4.6 2D canvas

No 2D equivalent is proposed — the 2D plan view is a top-down floor plan;
sky/horizon has no meaningful top-down representation. (The existing weather
chip already gives 2D users the condition/temp/forecast at a glance; that is
sufficient and this feature is intentionally 3D-only, like the existing W2/W3
precip/fog/lightning effects which also have no 2D analog beyond the chip.)

### 4.7 Dirty-key / rebuild discipline

- The sky dome, sun/moon sprites, and starfield are **cheap per-frame
  updates** (position/uniform sets on persistent objects), not rebuild-on-key
  objects — closer to `updateTargets` (every frame) than `updateFloor`
  (dirty-keyed). Build the group ONCE (or once per floor-switch reset, same as
  `_weatherGroup`'s `_clearWeather` on floor switch — actually the dome/sun/
  moon/stars need NOT be torn down on floor switch at all, since they aren't
  floor-relative in the way the weather spawn box is; consider leaving
  `_skyGroup` OUTSIDE the floor-switch reset entirely, sized once from the
  first floor's bbox and left alone, unless a later floor is dramatically
  larger — cheapest correct behavior, revisit only if that reads wrong in
  testing).
- The NEW sky-puff cloud builder and the storm-bank distance change DO ride
  the existing `_keyWeather` dirty key in three-view (`configRev | floorId |
  condition | round(intensity·4) | windBucket | weatherFx-flag`) — add the
  new inputs it now depends on: bucket `cloudCoverage` (already bucketed
  for the ground shadows — same bucket, no new term) and bucket `rainEtaMin`
  (e.g. `round(rainEtaMin / 15)` — 15-minute buckets, matching the "notices it
  crept closer" cadence, not a per-second rebuild).
- Per-frame motion (dome uniform lerp on preset change, sun/moon sprite
  position from eased azimuth/elevation, star opacity, cloud puff drift, storm
  bank distance ease) all live in `_advanceWeather`/`_animate`, called every
  frame regardless of `_keyWeather`, exactly like the existing sun-position
  easing and storm-dark easing already do.

## 5. Integration steps

Following the canvas-fixture recipe where applicable; this is mostly a
renderer/weather-plumbing feature (no new placeable/fixture, no sidebar
section, no hit-testing), so most of the recipe's UI steps don't apply — steps
below are the actual dependency order.

1. **`src/weather.ts`**: add `forecastRainEtaMinutes(records, nowMs, horizonH)`
   (pure, mirrors `forecastRainSoon`'s scan/threshold exactly, returns
   `number | null`); add `rainEtaMin` to `WeatherNow`. Extend
   `WEATHER_EFFECT_DEFAULTS`/`weatherEffectEnabled` with the `'sky'` key (ON by
   default). Bump `fetchOpenMeteo`'s `forecast_hours` if a longer look-ahead is
   wanted; read `cloud_cover` into the hourly records reduction alongside the
   existing `precipitation_probability`/`weather_code`.
2. **`src/types.ts`**: add `'sky'` to `WeatherEffectKey`.
3. **`src/ha-client.ts`**: add `cloud_coverage` to `ForecastRecord` (additive
   optional field; both `HassClient`/`HassPanelAdapter` already share
   `normalizeForecasts`, no per-client change needed since it's structural,
   not a new call).
4. **`src/planner.ts`**: in `_refreshEntityForecasts`, compute
   `forecastRainEtaMinutes(hourly, Date.now())` alongside the existing
   `forecastRainSoon` call, store on a new `_fcRainEtaMin` field, fold into
   `_applyForecastToNow` the same way `_fcRainSoon` is folded today.
5. **`src/three-renderer.ts`**:
   a. Add `_skyGroup` (construction, `scene.add`, disposal in `destroy()`;
      decide whether it also needs `clearTransientGroups()` per §4.7).
   b. Build the gradient-dome mesh + shader material once at init (like
      `_gradientMapTex`/`_blobTex`); expose a small `_setSkyColors(top,
      bottom)` called from wherever `applyScenePreset` sets
      `_scene.background` today (same call site, literally one more line).
   c. Add sun-disc and moon-disc sprites (cached glow/phase textures built
      lazily on first use, same idiom as `_cloudShadowTexture()`); position
      each frame in `_advanceWeather`/`_animate` from
      `fx.sunAzimuthDeg/sunElevationDeg` (reuse `_sunTargetFromSky`, larger
      radius) and the mirrored moon angle.
   d. Add the starfield `Points` (built once; visibility/opacity only).
   e. Add `_buildSkyClouds` (sibling to `_buildCloudShadows`) + its
      `_advanceWeather` drift term (clone the cloud-shadow drift code).
   f. Extend `_buildStormBank`/`_setStormDark`-adjacent state with the new
      eased target-distance field (§4.5); apply in `_advanceWeather`.
   g. Update `setLayerVisibility` if the sky group should also respect the
      `weatherFx` layer toggle (recommend YES, for consistency — hiding
      weather effects also hides the decorative sky, matching user
      expectation "turn off weather stuff").
6. **`src/ui/three-view.ts`**: extend `WeatherFxState` shaping
   (`_weatherFxState`) with `rainEtaMin`/`moonPhase`; read `moon.moon` state
   the same way other bound states are read per tick (cheap; no new
   `_isSlowEntity` entry needed since it's read opportunistically in the
   already-running per-tick weather-state build, not a dedicated slow-path
   entity — confirm this matches how `sunAzimuthDeg`/`sunElevationDeg` are
   already sourced from `sun.sun` in the same function and mirror it exactly).
   Extend `_keyWeather` with the new bucketed terms (§4.7).
7. **Sidebar** (`src/ui/sidebar.ts`): add the `'sky'` row to the existing
   per-effect checkbox list under "3D effects" (same list `precip`/`fog`/
   `lightning`/`wind`/`clouds`/`sunPosition`/`frost`/`puddles`/
   `precipForecast` already renders from — this is a one-line addition to an
   existing map/iteration, not a new section).
8. **Test page**: extend `weather-fx-test.html` (or add a `?c=sky` /
   `?c=storm-approach` case) covering: dome color matches preset at
   day/dusk/night; sun/moon sprite visibility flips correctly across the
   day/night boundary; `forecastRainEtaMinutes` unit tests (records at various
   offsets, thresholds, missing-datetime fallback — mirror the existing
   `forecastRainSoon` test cases in `weather-test.html`); storm-bank distance
   monotonically decreases as a synthetic `rainEtaMin` counts down in a driven
   test harness.
9. **CLAUDE.md**: document the new `_skyGroup`, the gradient-dome
   `ShaderMaterial` as an explicit `_mat()` exemption (next to the existing
   Points/Sprite exemption), and the `rainEtaMin`-driven storm-bank distance
   under the existing "3D weather effects" section.

## 6. Potential additional features

- **Real moon ephemeris** (§2.4 option 3): client-side low-precision lunar
  position formula seeded from `Store.geo` lat/lon — makes the moon track a
  real arc instead of mirroring the sun; a good standalone follow-up once the
  static-disc v1 ships and reads well.
- **Custom moon-integration support**: if `moon-phase`/`lunar-phase` HACS
  components are detected (an entity with `platform` matching in the entity
  registry, same discovery idiom already used for Bermuda BLE proxies —
  `scanBermuda`'s registry scan), prefer their exposed altitude/azimuth over
  the mirrored-sun approximation.
- **Aurora / rare-`exceptional` condition flourish**: the `exceptional`
  HA condition is a real (if rare) provider state (severe weather alerts);
  could get a distinct sky tint (sickly green/amber) as a cheap "something's
  really wrong" visual distinct from ordinary cloudy dimming.
- **Rainbow after rain**: cheap crescent-arc sprite when transitioning
  rainy→sunny with the sun above a low elevation threshold — classic
  "weather just cleared" moment, reuses the same billboard-sprite idiom.
- **Twice-daily forecast for a "tonight's low" sky preview**: HA's
  `twice_daily` forecast type (already in the `type` enum Diorama's
  `getWeatherForecasts` supports as a literal — currently only `'daily'|
  'hourly'` are typed; widening that union is a small addition) carries
  `is_daytime` and could drive a "tonight will be clear/cloudy" sky-dome
  preview a few hours ahead of the actual transition, echoing the storm-bank
  approach idea for the OTHER direction (clearing skies, not incoming
  weather).
- **Wind-sock / weathervane decorative fixture**: a small yard object whose
  orientation follows `windBearing` — unrelated to the sky but a natural
  companion "ambient weather flourish" in the same spirit.
- **Sunrise/sunset color event**: briefly boost the dome's horizon saturation
  for a few minutes around `sun.sun`'s `next_rising`/`next_setting` (already
  fetched attributes, unused today) for a golden-hour moment — cheap, uses
  data already available.

## 7. Open questions & risks

- **Where does the new toggle live?** This doc recommends folding the new sky
  visuals into the existing per-effect toggle system (`WeatherEffectKey.sky`)
  rather than a separate `Scene3D` flag, because it's conceptually "one more
  weather-linked visual" and keeps the toggle UI in one place. Counter-case:
  the sky dome is arguably NOT weather-dependent (a clear night has a sky
  whether or not `Store.weather` is even configured) — if `Store.weather` is
  entirely unset, should the dome still render (with just preset-driven
  colors, no sun/moon/clouds)? **Recommend yes** — decouple the dome's
  existence from `weather.effects3d`/whether a weather source is configured
  at all (it's a lighting-adjacent visual, always-on unless the user
  disables it), and gate ONLY the moon-phase/cloud-puff/storm-bank
  sub-features on an actual `weatherNow`. This needs an explicit decision
  before implementation since it affects whether `_skyGroup` construction is
  conditioned on `weather` being configured.
- **Dome radius vs. existing camera far-plane / fog**: confirm the renderer's
  camera `far` clipping plane and any existing fog density don't clip the
  30,000 mm dome or make it invisible behind fog — check `PerspectiveCamera`
  construction in `three-renderer.ts` before picking the final radius.
- **Mobile/perf**: one more `Points` (stars) + a handful of sprites + one
  extra full-screen-ish sphere with a custom shader is cheap, but confirm on
  the DPR-capped iPad path (existing precip clouds already do a `×0.6` count
  cut on hi-DPR — apply the same discipline to star count / puff count if
  needed, though these are much lower counts than precip).
- **Moon mirrored-sun approximation will look "wrong" to an attentive user**
  at certain times of year/latitude (real moon phase timing vs. its
  sky position don't literally mirror the sun except near full moon) — worth
  a one-line caveat in the sidebar/docs ("moon position is illustrative") if
  shipping v1 without real ephemeris, so it doesn't read as a bug report.
- **`weather.get_forecasts` provider coverage is uneven**: not every
  `weather.*` integration returns `hourly` type forecasts at all (some only
  do daily), and `cloud_coverage` per-hour is sparser still — `rainEtaMin`
  and the sky-puff density must both degrade to "no effect" (not a crash or a
  frozen stale value) exactly like `rainSoon` already tolerates a missing
  hourly block. Test against at least one hourly-forecast-less provider
  (e.g. a bare template weather entity) to confirm the degrade path.
- **Vendor fragmentation across weather integrations**: Met.no (HA's
  zero-config default), AccuWeather, OpenWeatherMap, Pirate Weather, and the
  built-in Open-Meteo path Diorama already supports all expose different
  attribute subsets — this doc's HA data-model section (§2) is accurate for
  the core schema/action signature, but individual providers may omit
  `cloud_coverage` or `uv_index` etc. This is already Diorama's existing
  posture (every WeatherNow field is optional) — no new risk, just restating
  it applies to the two new fields too.
- **`getWeatherForecasts`'s type union is `'daily' | 'hourly'`** in the current
  `HaApi` interface — if the "twice_daily" additional feature (§6) is pursued,
  that union needs widening in both `HassClient` and `HassPanelAdapter`
  (mechanical, but a real signature change touching both implementations per
  the "HaApi additions must land in both" convention).

## 8. Sources

- Home Assistant Weather integration (condition vocabulary, entity attributes):
  https://www.home-assistant.io/integrations/weather/
- `weather.get_forecasts` action reference (signature, response schema):
  https://www.home-assistant.io/actions/weather.get_forecasts/
- Home Assistant Sun integration (entity attributes: azimuth, elevation,
  next_dawn/next_dusk/next_rising/next_setting/next_noon/next_midnight,
  rising):
  https://www.home-assistant.io/integrations/sun/
- Home Assistant Moon integration (8-state phase sensor, no position/
  illumination attributes, locally computed):
  https://www.home-assistant.io/integrations/moon/
- Custom moon-position/illumination components (optional, HACS):
  https://github.com/frlequ/moon-phase ,
  https://github.com/ngocjohn/lunar-phase
- three.js official Sky shader example (Preetham analytic sky model —
  turbidity/rayleigh/mie params; considered and set aside in favor of a
  cheaper gradient dome to match the toon aesthetic, but the reference for a
  more physically-based upgrade path):
  https://threejs.org/examples/webgl_shaders_sky.html ,
  https://threejs.org/docs/pages/Sky.html
- Gradient sky-dome technique (two-color vertex-lerp shader on a large
  sphere — the technique this doc recommends):
  https://discourse.threejs.org/t/how-would-you-texture-a-sphere-with-a-linear-gradient-with-multiple-colour-stops/19070 ,
  https://www.ianww.com/blog/2014/02/17/making-a-skydome-in-three-dot-js
- Billboard/sprite cloud techniques (camera-facing puff sprites, the
  precedent Diorama's existing `_buildStormBank`/`_buildCloudShadows` already
  follow and this feature extends):
  https://tympanus.net/codrops/2020/01/28/how-to-create-procedural-clouds-using-three-js-sprites/ ,
  https://venolabs.com/instanced-billboard-clouds-in-three-js/
- In-repo primary sources read directly (exact current behavior cited
  throughout): `src/weather.ts`, `src/types.ts`, `src/time-of-day.ts`,
  `src/three-renderer.ts` (weather section ~L5390–5900), `src/planner.ts`
  (forecast refresh ~L2260–2330), `src/ha-client.ts`, `src/ha-panel-adapter.ts`,
  `docs/DESIGN-world.md`.
