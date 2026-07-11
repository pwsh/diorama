# DESIGN — The World Outside arc

Planned 2026-07-11 (v0.9.0 baseline). Three features that extend Diorama beyond
the floor plan: **who** is in the house (BLE identity + trilateration), **where**
devices are in the real world (GPS + geo calibration), and **what the sky is
doing** (weather displays + outdoor effects). Research findings below were
verified against live sources / cloned repos on 2026-07-11 by Sonnet research
agents; architecture and phasing decided by Fable.

**Working practice for this arc**: Fable orchestrates, plans, tiebreaks,
architects, and reviews every diff. Opus 4.8 subagents write the code, phase by
phase. Sonnet 5 subagents do any further research. Gates per phase: `npm run
typecheck` + `npm run build` + Fable review + (where math is involved) a
deterministic page in `test-pages/`.

---

## Cross-cutting infrastructure (build once, used by all three features)

### People registry — `Store.people: DioramaPerson[]`

The shared identity concept. BLE trilateration and GPS both resolve to a
*person*; rendering resolves a person to an avatar.

```ts
interface DioramaPerson {
  id: string;
  name: string;
  color?: string;              // chip/label/target tint
  avatarKind?: AvatarKind;     // from the existing 22-model list — the "custom avatar"
  isPet?: boolean;             // pets are BLE tags (iBeacon on collar) — see open questions
  haPersonId?: string;         // person.* entity (GPS identity; survives phone swaps)
  bermudaDeviceId?: string;    // HA device id of the Bermuda tracked BLE device
  gpsTrackerId?: string;       // explicit device_tracker.* override (else via person entity)
}
```

- **Identified** person → their `avatarKind` + `color` everywhere (BLE target,
  fused mmWave target, GPS pin).
- **Unidentified** → exactly today's behavior: the per-sensor `avatarKinds`
  pool (stable djb2 pick). No change to existing users.
- Sidebar gets a "People" section (name, avatar dropdown reusing the avatar
  grid, color, entity bindings via the existing entity picker).
- v1 custom avatars = pick-from-list + tint. Recipe-built custom figures
  (ObjectRecipe-style rigs) are explicitly deferred.

### Geo reference — `Store.geo`

Shared by GPS display and the weather lat/lon path.

```ts
interface GeoLandmark {
  id: string; name: string;
  x: number; y: number;        // world mm on the plan (click-placed)
  lat?: number; lon?: number;  // filled by calibration; absent = placed but uncalibrated
  accuracy?: number;           // median gps_accuracy of the winning samples (m)
  sampleCount?: number; sampledAt?: string;
  hidden?: boolean;            // per-landmark hide (plus a whole-layer toggle)
}
interface GeoConfig {
  landmarks: GeoLandmark[];
  northDeg?: number;           // manual north bearing — used when <2 calibrated landmarks
  boundaryM?: number;          // GPS render boundary beyond floor bbox; default 30 m
  accuracyGateM?: number;      // calibration sample filter; default 30 m
}
```

**Projection**: lat/lon → local meters via equirectangular about the first
calibrated landmark (`x = Δlon·cos(lat0)·R`, `y = Δlat·R`, R = 6 371 000 m —
sub-mm error at house scale).

**Transform fit** (new `src/geo.ts`, pure functions, unit-testable):
- ≥2 calibrated landmarks → 2D Procrustes/Kabsch closed form:
  `θ = atan2(Σ(x·y′ − y·x′), Σ(x·x′ + y·y′))`, `t = q̄ − R·p̄`. **Scale is
  FIXED at 1** (plan mm are physical); the fitted residual scale is computed
  anyway and surfaced as a calibration-quality readout (a fitted scale far from
  1.0 means a bad landmark).
- 1 calibrated landmark → translation + `northDeg` rotation.
- 0 landmarks → seed from `zone.home` attributes (lat/lon; radius ignored),
  flagged "uncalibrated" in the UI.
- RMS residual (m) shown per fit; worst-outlier landmark flagged.

### The yard (outside-world rendering)

GPS pins and weather effects need space beyond the floor rect. No schema for
the yard itself: 2D already pans freely; 3D gets effects/pins positioned beyond
floor extents (ground is visually implied — no yard slab in v1). GPS clamp ring
= floor bbox inflated by `geo.boundaryM`.

### New layers

`Layers2D` gains `geo?: boolean` (landmark pins + GPS device pins, default on)
and `weatherFx?: boolean` (3D effect group + 2D hints, default on). Both join
the sidebar Layers list, presets, and (for 3D build-time gating) the
appropriate dirty keys.

### Storage / plumbing checklist (the classic gotchas — every phase re-checks)

- New `Store` fields (`people`, `geo`, `weather`) → `Planner._loadFromHa`
  explicit field list, or they reset on load.
- New per-floor field (`bleProxies`) → `repairFloor` + `defaultFloor`.
- `HaApi` additions must land in BOTH `HassClient` and `HassPanelAdapter`:
  `callService` with `return_response`, `history/history_during_period`,
  `config/entity_registry/update` (enable disabled entities), notify service
  calls (high-accuracy commands).
- `_isSlowEntity`: weather entity + person/device_tracker entities are
  config-path (sidebar re-renders); Bermuda per-scanner distance sensors are
  live-path only (10 s cadence, consumed by the solver, no sidebar churn).

---

## Feature B — BLE identity & trilateration (Bermuda)

### What research established (verified against cloned source, v0.8.7 / 2026-07-06)

- **Bermuda does NOT trilaterate.** It publishes per-scanner distance sensors
  and does nearest-area determination. The README still says "(eventually)
  Triangulate device positions… Maybe". → **Diorama owns the solver**, which is
  the right architecture anyway: the panel knows each proxy's exact plan
  position; Bermuda never does.
- Per (device × scanner) pair: `Distance to <scanner>` (smoothed) and
  `Unfiltered Distance to <scanner>` sensors, unique_id
  `{device_mac}_{scanner_mac}_range[/_raw]` — **disabled by default**. Only
  Area/Distance/Floor sensors are enabled out of the box.
- Discovery: `config/entity_registry/list` filtered `platform === 'bermuda'`;
  parse unique_ids (never guess entity_ids — they're name-slugified). Scanner
  MAC → physical ESPHome/Shelly proxy via device-registry connection merge.
- Cadence: sensor pushes at most every `update_interval` (default **10 s**;
  fast-approach publishes immediately); 20-sample smoothing; distance =
  `10^((ref_power − rssi)/(10·attenuation))` — treat absolute meters as
  approximate, relative ordering as the reliable signal.
- Identity: config-flow-selected devices; iPhones via core `private_ble_device`
  (IRK); pets = iBeacon tag on the collar, no special path.

### Design

**BLE proxy fixture** — `Floor.bleProxies: BleProxy[]`
`{id, name, x, y, height?, haDeviceId, locked?, hidden?}`. Placed like sensors
(new sidebar section + canvas tool under the sensors group), rendered as a
small antenna puck in 2D/3D. Binding = pick the physical proxy device from the
device registry (entity-picker in device mode). The scanner-MAC ↔ fixture match
runs through that device's registry `connections`.

**Onboarding**: a "Bermuda" settings block that (a) lists discovered Bermuda
devices, (b) shows which per-scanner distance entities are disabled, and
(c) offers one-click enable via `config/entity_registry/update` (explicit user
consent — HA reloads those entities; note ~an-integration-restart delay).

**Solver** (`src/trilateration.ts`, pure + unit-testable in `test-pages/`):
- Inputs: proxy plan positions + latest distance per proxy (m→mm) + sample age.
- Weighted Gauss-Newton on `d_i = ‖p − p_i‖`, weights `1/(d_i + 1 m)²` decayed
  by staleness (>30 s → drop; Bermuda's own distance timeout is 30 s).
  Warm-started from the last solution, step-clamped, 2D per floor.
- ≥3 fresh proxies → solve. 2 → constrain to the segment between them.
  1 → hold last position, confidence = that proxy's distance ring.
- Floor selection: min weighted residual across floors, Bermuda's `Floor`
  sensor as tiebreak.
- Output: per-person position + confidence radius, updated on distance pushes
  (~0.1 Hz), NOT per frame.

**Rendering**: BLE people become synthetic targets (`key: 'ble_<personId>'`)
that **carrot-walk** toward the latest solve at human speed through the
existing nav/A* machinery (exactly the AI-avatar pattern — a 10 s update
cadence teleport-lerped would look wrong; walking to the new fix looks alive).
Region-aware snapping keeps them out of walls. 2D: person-colored dot +
initials chip + confidence circle. Identified avatar + name label in 3D.

**Identity fusion (the payoff phase)**: mmWave gives precision, BLE gives
identity. A matcher runs on raw positions: BLE person within a gate (~1.5 m)
of exactly one mmWave target, sustained N s (hysteresis both ways) → that
radar target adopts the person's avatar/color/label; the BLE ghost target
hides while fused. Ambiguity (two candidates in gate) → no fusion, no flicker.

---

## Feature G — GPS devices & landmark calibration

### What research established

- Attributes: `latitude`, `longitude`, `gps_accuracy` (meters), `source_type`
  (`gps`/`router`/`bluetooth`), etc. Prefer `person.*` for identity.
- Forcing samples: Android `command_high_accuracy_mode` notify command
  (`force_on`/`force_off`, interval ≥5 s) → dense samples. iOS has NO
  equivalent; `request_location_update` is officially "hit or miss";
  `homeassistant.update_entity` is a verified **no-op** for companion trackers
  (push-only entities). iOS calibration = app foregrounded at the spot
  (+ periodic `request_location_update` pushes as best-effort).
- History pull: WS `history/history_during_period` (frontend-internal but
  stable) with `significant_changes_only: false`; compressed rows carry
  attributes (lat/lon/accuracy). So the panel can compute the median AFTER the
  user walks back inside — no need to keep the panel open at the landmark.
- Accuracy reality: ~3–7 m open sky, 10–30 m near walls (multipath is a BIAS —
  averaging tightens the cluster but doesn't remove wall reflections), ~74 m+
  indoors. → Calibrate at open-sky spots, away from the house wall; exactly as
  the user assumed, interior GPS is location-of-last-resort ("find my phone"
  grade, not placement grade).

### Design

**Landmarks**: placed by click (reuse the `placingRoomId` latch pattern →
`placingLandmarkId`), shown as pin glyphs (hideable per-landmark + `geo`
layer). Sidebar "GPS / Geo" section lists landmarks with calibration status
(uncalibrated / calibrated ±Xm / stale), fit quality (RMS residual, fitted
scale sanity), north-bearing field, boundary + accuracy-gate settings.

**Calibration flow** (per landmark):
1. Pick the sampling tracker (device_tracker list, defaults from People).
2. Arm: panel records the window start; Android → sends
   `command_high_accuracy_mode` `force_on` + 5 s interval via
   `notify.mobile_app_*`; iOS → instruction card ("stand at the landmark,
   keep the HA app open").
3. User stands at the physical spot ≥3–5 min (progress ring; live sample count
   when the panel is open — but closing it is fine).
4. Finish: pull the window via `history/history_during_period`, filter
   `source_type === 'gps'` AND `gps_accuracy ≤ accuracyGateM` (default 30 m),
   median lat and lon independently; store lat/lon + accuracy + sampleCount.
   Android → `force_off`. Too few samples (<5) → keep old values, explain why.

**Device display**: for each person with a GPS source (person entity preferred):
lat/lon → transform → world mm.
- Inside floor bbox → dimmed indoor pin (accuracy caption — lost-device mode).
- Within the yard ring → pin at true position + accuracy circle (when it fits).
- Beyond the boundary → clamped to the ring edge along the true bearing, with
  "Name · 320 m NE" label. Never rendered hundreds of feet out.
- 2D pin = person color + initials + accuracy ring; 3D = camera-facing sprite
  pin at the yard position (no humanoid rig for GPS — it's a device location,
  not a room-presence claim). Staleness shown from `last_updated`.

---

## Feature W — Weather displays & outdoor effects

### What research established

- HA condition vocabulary (15 states): sunny, clear-night, partlycloudy,
  cloudy, rainy, pouring, snowy, snowy-rainy, hail, lightning, lightning-rainy,
  fog, windy, windy-variant, exceptional.
- Forecasts: entity attributes are GONE (since 2024.6 only
  `weather.get_forecasts` service / `weather/subscribe_forecast` WS
  subscription — the subscription pushes an immediate snapshot then updates).
- Local weather stations (Ecowitt, Tempest UDP, Ambient, Netatmo) expose ONLY
  `sensor.*` entities — no condition string. Panel must derive one.
- Open-Meteo: CORS `*` (live-verified), keyless, current-weather endpoint +
  geocoding for zip → lat/lon. Gotchas: filter geocode results client-side
  (`country_code`, `postcodes` includes the query — numeric zips collide
  internationally); WMO codes NEVER yield `clear-night` (gate with `sun.sun`,
  which time-of-day.ts already reads) nor hail/windy/snowy-rainy (own
  thresholds if wanted).

### Design

**Config** — `Store.weather`:
```ts
interface WeatherConfig {
  source: 'entity' | 'sensors' | 'openmeteo';
  entityId?: string;                      // weather.* (preferred when it exists)
  sensors?: { precip?: string; windSpeed?: string; temp?: string; lightning?: string };
  zip?: string; lat?: number; lon?: number; placeLabel?: string;
  chip?: boolean;          // default true — corner display, 2D + 3D
  effects3d?: boolean;     // default true
  affectLighting?: boolean;// cloudy/precip dims the day preset; default true
}
```
All sources normalize to `WeatherNow { condition, tempC, windKmh, windBearing,
isDay, stale }` in a new `src/weather.ts`:
- `entity`: state + attributes (unit-normalized); slow-path entity.
- `sensors`: heuristic — precip >0.1 mm/h → rainy (>7.6 → pouring), + temp
  ≤0.5 °C → snowy, wind >38 km/h → windy, lightning binary → lightning;
  else cloudy/sunny via illuminance when bound, else sun elevation.
- `openmeteo`: fetch every 15 min (well inside fair-use), WMO→HA mapping table
  from HA core's own integration; zip geocoded once (with the country filter)
  then cached as lat/lon. Default lat/lon: calibrated geo → landmark[0]; else
  `zone.home`.
- `sunny` vs `clear-night` always resolved through sun elevation.

**Weather chip**: small overlay (both views, kiosk-safe): condition glyph +
temperature + label; severe conditions tint it. Zip/entity picked in a sidebar
"Weather" section.

**3D effects** (`_weatherGroup`, built on a condition dirty key, animated in
`_animate`; all styled to the toon look — flat colors, no PBR):
- **rain / pouring**: one `THREE.Points` cloud over floor+yard bbox, streaked
  sprites, fall-speed/count by intensity, recycled Y. One draw call.
- **snow / snowy-rainy / hail**: round soft sprites, slow fall + sinusoidal
  drift; snowy-rainy mixes both clouds; hail = fast small white points.
- **fog**: `FogExp2` on the scene + 2–3 large slow-scrolling translucent
  ground planes outside the walls.
- **lightning / lightning-rainy**: random double-flash intensity pulse on a
  dedicated flash light every 8–25 s (the fireplace-flicker idiom, already in
  the codebase) + optional sky-tint frame; -rainy adds the rain cloud.
  Thunder audio deferred (autoplay policy + taste — see open questions).
- **windy / windy-variant**: horizontal streaming leaf/dust sprites; wind also
  adds drift to any active precipitation.
- **cloudy / partlycloudy**: sun-intensity dim (via `affectLighting`) +
  chip; drifting cloud-shadow patches deferred.
- Heat: not an HA condition — apparent temp over threshold styles the chip.
- Effects respect `layers.weatherFx`; particle counts DPR/device-capped;
  hidden-tab RAF pause already covers background cost.

**Lighting integration**: `resolveScenePreset` gains an optional weather
modifier (cloudy/precip during day → dimmer preset). It already folds into
`_keyFloor` via the effective preset, so no new rebuild plumbing.

---

## Phase plan

Order follows the user's stated priority (identity first), with the weather
chip slotted early as a small self-contained win. Each phase lands
independently releasable.

| # | Phase | Contents | Size |
|---|-------|----------|------|
| B1 | People & proxies | `Store.people` + sidebar, BLE proxy fixture (place/render/bind), Bermuda discovery + entity-enable flow, `HaApi` additions | M |
| B2 | Trilateration | solver module + test page, carrot-walk BLE targets, confidence UI, floor pick, unknown-device toggle | L |
| P1 | Pet rigs | quadruped rig family (cat/dog + tints), trot gait, sit/lie poses, `isPet` wiring | M |
| W1 | Weather core | `Store.weather`, all three sources + normalization, chip, sidebar section | M |
| G1 | Geo calibration | `src/geo.ts` (projection/Procrustes/median) + test page, landmarks + placement + hide, calibration flow (high-accuracy commands, history median), fit-quality UI | M–L |
| G2 | GPS display | person/device pins 2D+3D, boundary clamp + bearing labels, indoor lost-device mode | S–M |
| W2 | Weather effects | `_weatherGroup` particles/fog/lightning/wind, lighting modifier, `weatherFx` layer | M |
| B3 | Identity fusion | BLE↔mmWave matcher with hysteresis, person avatar/label on fused targets | M |

Per-phase workflow: Fable writes the phase brief → Opus 4.8 agent implements →
typecheck/build → Fable code-review (and `/code-review` on the diff) → live
deploy check → commit. Solver/geo math phases add deterministic pages under
`test-pages/` (synthetic proxy distances with known ground truth; landmark
pairs with known transform).

## Decisions (user, 2026-07-11)

1. **Pet rigs: YES** — dedicated quadruped rigs (cat/dog + tint variants,
   trot gait, sit/lie poses) get their own phase (P1, after B2).
   `DioramaPerson.isPet` selects the quadruped rig family.
2. **BLE-only people render as full rigs** — no ghost style. Confidence circle
   in 2D only. **Unknown BLE devices** (configured in Bermuda but not mapped
   to a Diorama person) are shown/hidden by a toggle (`Store.bleShowUnknown`,
   default true — they render with the fallback avatar pool).
3. **No thunder audio.** Lightning stays visual-only, permanently.
4. **Name labels: when confident** (identified BLE person or fused mmWave
   target), rendered as a sprite above the rig; gated by a new `nameLabels`
   layer in `Layers2D` (default on, toggleable like all layers).
5. **Weather effects are a toggleable layer** (`weatherFx` in `Layers2D`,
   default on) — chip stays governed by `weather.chip`.

## Key research citations

- Bermuda: cloned `agittins/bermuda` @ `3969997` (v0.8.7, 2026-07-06) —
  entity model from `sensor.py`/`entity.py`/`const.py`; no coordinate output
  (README "eventually… Maybe"); per-scanner sensors disabled by default;
  `UPDATE_INTERVAL` 10 s default, smoothing 20 samples.
- Companion app: `command_high_accuracy_mode` + interval (Android docs,
  notification-commands); `request_location_update` "hit or miss" (docs);
  `update_entity` no-op verified in `mobile_app/device_tracker.py` (no
  `async_update`); cadence constants from `LocationSensorManager.kt` /
  `HighAccuracyLocationService.kt`.
- History WS: `history/history_during_period` schema from
  `homeassistant/components/history/websocket_api.py` (compressed keys `s`,
  `a`, `lu`, `lc`).
- GPS accuracy: ~4.9 m open sky (gps.gov); multipath bias near walls
  (MDPI Sensors 19:2704); ~74 m indoors (PLOS One iPhone study).
- Weather: 15-condition list from `weather/__init__.py`;
  `weather/subscribe_forecast` from `weather/websocket_api.py`; Open-Meteo
  CORS/geocoding live-verified 2026-07-11; WMO→HA map from HA core
  `open_meteo/const.py`.
