# Diorama roadmap — future HA entity integrations

Scaffolded 2026-07 from a multi-agent research sweep (10 focused passes over
developers.home-assistant.io, home-assistant.io/integrations, HA core source,
and community sources — primary-source-verified; anything thinner is flagged
in the per-item notes). This doc ranks what Diorama could visualize next.
Guiding principle: **Diorama is a spatial panel** — data that carries or
implies real coordinates fits its soul; dashboard-style numbers mostly don't.

Legend: effort S/M/L · wow 1–5. "Shipped" markers reference the current
codebase so this doc stays honest as items land.

---

## Tier 1 — real spatial coordinates (the panel's soul)

| Item | What HA gives | Visualization | Effort | Wow |
|---|---|---|---|---|
| ✅ Robot mower GPS | `device_tracker` lat/lon + `direction` heading (Mammotion `<name>_gps`, Husqvarna; `gps_accuracy` is hard-coded 0 — never draw rings) | **SHIPPED** — `RobotFixture` mower GPS mode via geo calibration | — | — |
| ✅ Roborock live position (SHIPPED batch H) | Core integration's map/camera entity carries a live `vacuum_position` x/y/angle attribute (device units) + `get_vacuum_current_position` action; room polygons are image-only | Real moving vacuum dot replacing the simulated roam when present; needs a per-device unit→mm calibration step (two reference points) | M | 4 |
| ✅ `geo_location` events (SHIPPED batch G) | Building-block platform; every entity carries real `latitude`/`longitude` + `source` (USGS/GeoNet quakes, NSW/Queensland fires, GDACS) | Severity-scaled pins through the existing `latLonToPlan` path (same pipeline as GPS pins/landmarks); "recent quakes near home" ring overlay | M | 4 |
| ✅ Frigate zone occupancy (SHIPPED — `Room.occupancyEntity`) | Official integration exposes per-camera/zone/object `binary_sensor` occupancy (person/car/dog) — booleans, no coordinates, but the ZONE is user-defined in Frigate | Feed straight into the existing per-room activity glow — a room lights up when Frigate sees a person there. Cheapest high-wow item found | S | 5 |
| ✅ Aqara FP2 zone presence (SHIPPED — `Floor.presenceZones`) | One `binary_sensor` per user-defined zone (up to ~30 per room, via HomeKit Controller); zone SHAPES not exposed | User draws a zone polygon in Diorama (mmWave zone-editor idiom) and binds it to the FP2 zone sensor — per-region presence truth without radar | M | 5 |
| ✅ Frigate raw boxes / Valetudo maps (SHIPPED Phase 5 — MQTT bridge) | Pixel bounding boxes + `current_zones` live only on Frigate's own MQTT (`frigate/events`); Valetudo's room polygons/path live in a PNG `zTXt` chunk | Requires a **direct-MQTT bridge** (new integration pattern — Diorama currently speaks only HA WS) + per-camera homography. Highest ceiling, highest cost | L | 5 |

## Tier 2 — strong spatial fits on existing machinery

- ✅ **Covers** — SHIPPED 2026-07 batch F+ (8 door kinds incl. garage/gate, `Window.coverEntity` blinds/shades, curtains; railing gates 2026-08-01). Original brief: (`cover` domain, per device_class): garage door = segmented
  overhead panel rolling up with `current_position` (M/4); blinds/shades/
  curtains = position-driven sashes inside the existing per-kind window
  builder, tilt slats for blinds (S–M/3); gate = exterior door-like panel
  (M/3, wants a fence/property concept). Reuses the door/window pipelines.
- ✅ **Water leak sensors** — SHIPPED 2026-07 batch E (SafetySensor kind `leak`: floor puck + growing puddle). Original brief: (`binary_sensor.moisture`): blue puddle decal
  spreading at the sensor — the W3 puddle texture/fade machinery already
  exists; this is now S effort, high payoff (4).
- ✅ **Sirens** — beacon SHIPPED Phase 1 2026-07-17 (SafetyKind `siren`); the state-picked turn_on/turn_off dispatch + feature-gated tone/volume/duration control surface shipped 2026-08-05. Original brief: pulsing beacon sharing the smoke/CO component (S/4).
- ✅ **Doorbells** — SHIPPED 2026-07 batch F (`Door.doorbellEntity` + the TransientPulse primitive + bubble tier; event/button/binary_sensor all accepted). Original brief: (`event` domain — Ring/Nest; UniFi Protect also has real
  sustained binary_sensors): needs a small **transient-pulse system**
  (flash-then-decay on an event timestamp, distinct from state-bound
  rendering — the one genuinely new rendering primitive in this tier);
  ring ripple at the door + optional event snapshot popover (M/4). The
  2027.4 `DoorbellEventType.RING` standardization simplifies matching.
  Support all three shapes (event / button / legacy binary_sensor).
- ✅ **Cameras** — SHIPPED 2026-07 batch G (+ alert snapshot popups; Frigate homography batch M-B). Original brief: wall/ceiling fixture with a translucent FOV frustum +
  periodically refreshed `camera.snapshot` thumbnail badge (M/4);
  live HLS/WebRTC in-scene is L — defer.
- ✅ **Climate / per-room temperature shading** (SHIPPED 2026-07-17 —
  `Layers2D.heatmap` riding placed temperature EnvSensors + in-room
  thermostats; hvac_action vent cues shipped with the thermostat
  fixture): do NOT assume one `climate`
  entity = one room (whole-house is the majority case). Per-room heat-map
  shading should ride placed temperature EnvSensors (works for everyone,
  incl. ecobee remote SmartSensors which are plain sensors); a bound
  `climate` entity contributes `hvac_action` (heating/cooling/idle — NOT
  hvac_mode) as a vent-glow/airflow cue on a thermostat fixture (M/3).
- ✅ **Fans** — SHIPPED 2026-07 (percentage-proportional spin + reverse + eased ramp, `_advanceFanSpin`). Original brief: `percentage` drives existing fan-blade spin rate; `direction`
  is forward/reverse only — no compass data exists, don't fake airflow
  direction (S/2).
- ✅ **Energy / power** — SHIPPED 2026-07 batch E (`Furniture.powerEntity` glow, 50 W-bucketed). Original brief: per-device power glow on bound appliances
  (device_class `power` sensor, intensity ∝ W) — pairs with the shipped
  in-use LED (S/3). Whole-home meter is a chip, not spatial.
- ✅ **Battery badges** — SHIPPED 2026-07 batch E (`Layers2D.battery` + `scanBatteryRegistry` sibling resolution). Original brief: one horizontal "Battery" layer — HA's own frontend
  convention is a sibling `sensor` with device_class `battery` on the same
  HA device; mirror that resolution and badge any bound fixture when low
  (S/3). The `battery_level` attribute on tracker entities is deprecated
  (removal 2027.7) — never read it.
- ✅ **Media now-playing** — SHIPPED 2026-07 batch H (art cards over any bound media furniture; speaker-group link lines NOT built). Original brief: `media_player` `entity_picture` (album art via
  `/api/media_player_proxy/...`) + `media_title` floated over speaker/TV
  fixtures; `group_members[0]` is the group leader for speaker-group link
  lines (M/4).
- ✅ **Vehicle model library (aircraft + ground)** — CORE SHIPPED v0.55.0 in 3 batches (pack registry + 23 ground vehicles; 34 aircraft/space + banner-tow wiring; live-ADS-B military skins). REMAINING follow-ups: user JSON pack imports, registering the 19 legacy BG_CRAFTS as a manageable pack, civil per-archetype flight skins. Research:
  `docs/research/vehicle-model-library.md` (2026-08-04; 83 newly ranked
  models + the 19 shipped BG_CRAFTS = 102 candidates, first waves marked).
  Generalizes the BG_CRAFTS banner-tow roster into an avatar-pack-style
  registry (base packs default-on, franchise/fiction opt-in, selectable
  like avatars), plus a NEW live-ADS-B "named skin" surface — named
  models build INSIDE each archetype's existing `fusLen`/`fusHalfW`
  envelope (per-bucket scale constants in research §4.2; the display
  shell stays deliberately not-to-scale), so label/beacon/trail anchors
  never move. Ground vehicles (pickup, fire truck, school bus, Jeep,
  DeLorean, …) surface only as driveway/curb/yard decor via a
  `car`-extension FurnitureKind — no live feed exists to skin. (M–L,
  wow 4 overall; the **fighter-skin reuse is S/3 and can ship
  standalone** — the `category==='A6'` fallback + military-heli case can
  reuse the ALREADY-BUILT F-16/F-22/Apache BG_CRAFTS geometry with zero
  new modeling.)

## Tier 3 — cheap EnvKind / fixture extensions

- ✅ New `EnvKind`s — SHIPPED 2026-07 batch E (radon/sound/no2/o3/aqi). Original brief (map extensions in `ENV_KINDS`, S each): `radon`
  (Bq/m³ — Airthings; WHO/EPA thresholds), `sound_pressure` (dB noise
  puck, optional loudness ripple), `no2`/`o3`/`aqi` (confirmed sensor
  device_classes; the legacy `air_quality` domain is deprecated — never
  target it), split `voc` vs `volatile_organic_compounds_parts`.
- ✅ **UV index** — chip row + WHO band SHIPPED Phase 1 2026-07-17 (`chipContent.uv`); the high-UV avatar parasol (UV ≥ 8 + sunny, rain wins) shipped 2026-08-05. Original brief: fold into WeatherNow + a chip readout / parasol flourish (S/2).
- ✅ **Garage-bay vehicle presence** — SHIPPED 2026-07 batch 1b (`car` kind + presence ghost/solid). Original brief: pure DIY pattern (ultrasonic/ToF →
  presence binary_sensor) — a car-silhouette furniture kind bound to a
  binary_sensor covers it with zero new mechanism (S/2).
- ✅ **Moon phase** — SHIPPED 2026-07 (moon disc + `WeatherConfig.moonEntity` phase painting; real-ephemeris position + the Death Star option later). Original brief: (8-state sensor): night-sky prop per phase; no position
  data — recolor/swap only (S/2, needs the integration installed).

## Tier 4 — niche / deferred / dead ends

- ✅ **EV charger fixture** — SHIPPED 2026-07 batch 1b (vendor-agnostic `evStatusOf` + port LED + car charge indicator). Original brief: only Wallbox + Peblar are core; OCPP +
  ChargePoint are HACS. If built, design around a common shape
  (plugged-in, charging state, power, current limit) — never one vendor's
  entity ids (M/3). Vehicle BLE presence via Bermuda: frame as coarse
  binary presence only — community experience says outdoor single-proxy
  trilateration flaps (do not promise precision).
- **Cars**: Tesla Fleet (core; 50 writes/day cap) is the stable target;
  BMW connected_drive is REMOVED (API blocked 2025-09) — cautionary tale;
  Ford is HACS-only.
- ✅ **Irrigation** — SHIPPED 2026-07-18 (terrain T3): `SprinklerZone`
  fixture per `research/irrigation-sprinklers.md` (switch/valve-bound
  spray/rotor/drip animation, terrace-aware heads).
- ✅ **Pool** — SHIPPED 2026-07-18 (terrain T4): `Floor.pools` per
  `research/pool-spa.md` (sunken basin via the terrace-skirt builder,
  shimmer water, heater/pump/light bindings). Deferred: equipment-pad
  furniture kinds, spa bubble particles (CLAUDE.md T4 section).
- ✅ **Plants** — SHIPPED 2026-07 (moisture-driven thirsty droop on plant kinds). Original brief: legacy `plant.*` domain is orphaned; modern pattern is a
  device with moisture/light/battery sensors (FYTA). A thirsty-plant
  droop on the existing plant furniture kind is charming (M/3).
- ✅ **Weather alerts** — SHIPPED 2026-07 DC-D (region-agnostic parser + chip badge/panel + 3D beacon; standalone HUD banner deferred). Original brief: (DWD/MeteoAlarm/Env-Canada; NWS core has NO alert
  entity): attribute-rich but zero coordinates — generic severity banner
  only (S/3).
- ✅ **Mail/packages** — SHIPPED 2026-07 batch 1b; mailbox model rebuilt from reference photos v0.55.0 (count badge + click-or-sensor flag). Original brief: (HACS Mail-and-Packages): count badge at the front
  door + mailbox-lid binary_sensor as a door-like fixture (S–M/2).
- ✅ **Printers** — PARTIAL: `printer_3d` progress/gantry SHIPPED 2026-07 (mechanical batch); 2D-printer ink levels not built (skip-worthy). Original brief: OctoPrint (3D printing progress/temps) is rich; ink
  printers are IPP-generic (S/2, low spatial value).
- ✅ **NAS/server/network** — the "maybe" rack LED SHIPPED 2026-08-05 (`network_rack` kind: derived health band problem>update>ok>unknown, display-only). Dashboards remain skipped. Original note: dashboards, not spatial — skip except maybe a
  rack fixture with health LED (1–2). UniFi does NOT expose per-client AP
  association in docs — no room-level Wi-Fi mapping.
- **Update entities**: sidebar badge at most (non-spatial, 1).
- **Dead ends confirmed**: tide/marine (legacy, no coords),
  `conversation`/Assist (zero spatial data), scene/script/automation
  (stateless/abstract; area inference would need registry cross-refs),
  input_* helpers, Matter/Thread (transports, not domains).

## Architectural prerequisites worth building once

1. ✅ **Transient-pulse rendering path** — SHIPPED 2026-07 batch F (TransientPulse: doorbell rings; reused since). — event/button domains have no
   persistent state; a "flash on timestamp, decay over N s" primitive
   unlocks doorbells, buttons, and event-typed detections.
2. ✅ **Direct-MQTT bridge (opt-in)** — SHIPPED 2026-07 Phase 5 M-A (mqtt-ws codec + bridge, ha-relay + direct paths; Frigate M-B + Valetudo M-C ride it). — the gate to Frigate boxes and
   Valetudo maps; a deliberate break from the pure-HA-WS model, isolate
   like `weather.ts` isolates fetch.
3. ✅ **Device-siblings resolution** — SHIPPED 2026-07 batch E (`scanBatteryRegistry` registry caches + `batteryFor`). — resolve related entities (battery,
   power, door) from the HA device registry instead of one-binding-per-
   datum; enables battery badges + richer appliance cards with less UI.
4. ✅ **Yard/terrain concept** — SHIPPED 2026-07-18 as the terrain
   program T1–T4 (`docs/DESIGN-terrain.md`): terraced elevation, yard
   fill, fences/gates, sprinklers, water life, paths, pool.

## Top 12 picks (wow ÷ effort, Diorama-fit weighted)

**All twelve shipped July 2026** (batches E–H; see docs/STATUS.md ledger):

1. ✅ Frigate zone occupancy → room glow (`Room.occupancyEntity`)
2. ✅ Water-leak puddles (SafetySensor kind `leak`)
3. ✅ Covers: garage door (`Door.kind 'garage'`) + window blinds (`Window.coverEntity`)
4. ✅ Doorbell transient pulse (`Door.doorbellEntity` + TransientPulse primitive)
5. ✅ Aqara FP2 zone polygons (`Floor.presenceZones`)
6. ✅ Roborock live vacuum position (`RobotFixture.posEntity` + dock calibration)
7. ✅ Battery badge layer (`scanBatteryRegistry` sibling resolution)
8. ✅ Per-device power glow (`Furniture.powerEntity`)
9. ✅ geo_location event pins (`Planner.geoEventPins`)
10. ✅ Camera FOV + snapshot fixture (`Floor.cameras`)
11. ✅ Media now-playing art (`_nowPlayingGroup`)
12. ✅ New EnvKinds: radon / noise / NO₂ / O₃ / AQI

Next candidates now live in Tiers 2–4 above (sirens, climate hvac_action
cues, moon phase, EV charger shape, plant droop) plus the architectural
prerequisites (direct-MQTT bridge for Frigate boxes / Valetudo maps,
yard/terrain concept).

---

## Build-ready research (2026-07-15)

**Every outstanding item below — all unshipped Tier 1–4 entries plus the
2026-07-15 backlog — now has a build-ready research doc under
[`docs/research/`](research/README.md)** (Sonnet-gathered, Opus-reviewed:
verified HA data model, real-world specs, a concrete Diorama 2D+3D design
mapped onto the canvas-fixture recipe, an integration checklist, and open
questions). See [docs/research/README.md](research/README.md) for the index,
the cross-cutting reusable-primitive synthesis, and a suggested build order.

| Roadmap item | Research doc |
|---|---|
| Frigate raw boxes / Valetudo maps + direct-MQTT bridge | `research/frigate-mqtt-bridge.md` |
| Sirens | `research/sirens-beacons.md` |
| Climate hvac_action cues + HVAC wall control (backlog) | `research/climate-hvac-controls.md` |
| Fans | `research/fans.md` |
| Weather forecast entity + movable/customizable display (backlog) | `research/weather-forecast-display.md` |
| Weather alerts, region-agnostic (backlog) | `research/weather-alerts.md` |
| Weather as background animation (backlog) | `research/weather-background-fx.md` |
| Generic entity-value display object (backlog) | `research/entity-value-display.md` |
| Generic action/trigger control (backlog) | `research/generic-action-control.md` |
| Generic logical-state light (backlog) | `research/generic-logical-light.md` |
| Display-only door locks (backlog) | `research/locks-display-only.md` |
| Avatar void→stairs routing (backlog) | `research/avatar-nav-stairs.md` |
| Event-focused thought bubbles (backlog) | `research/event-thought-bubbles.md` |
| Log events & alerting surfacing (backlog) | `research/log-events-alerting.md` |
| Calendar on wall + news/weather on TV (backlog) | `research/calendar-tv-surfaces.md` |
| Irrigation / sprinkler zones | `research/irrigation-sprinklers.md` |
| EV charger fixture | `research/ev-charger.md` |
| Pool / spa | `research/pool-spa.md` |
| Plant health sensors + thirsty droop | `research/plant-health-sensors.md` |
| Moon phase / UV index / garage-bay vehicle | `research/moon-uv-vehicle.md` |
| Fun background text messages (backlog) | `research/background-text-fx.md` |
| Mail/packages, printers, network rack | `research/peripheral-fixtures.md` |

Opus review flagged four things to build ONCE (they recur across items): a
shared **beacon/strobe** primitive, a **CanvasTexture text-plaque**, a
mount-once **HUD overlay** beside the weather chip, and a **value→style rule
evaluator** (shared by the entity-value display and the logical light). The
**direct-MQTT bridge** is the one true architectural gate and carries an
admin-session UX decision — settle that before building on it.

---

## Staged build plan — 2026-07-17 (user-ordered)

Work proceeds in order; each stage ships (commit + push both + deploy).

- ✅ **Stage 0 — Home theater fill-in** (SHIPPED 2026-07-17) (`research/home-theater-diorama.md`):
  projector fixture + light cone, speaker/subwoofer/recliner furniture
  kinds, tiered seating, screen bias lighting.
- ✅ **Phase 1** (SHIPPED 2026-07-17): sirens/beacons (`research/sirens-beacons.md`), UV index,
  garage-bay vehicle presence (`research/moon-uv-vehicle.md`) + EV charging
  status (`research/ev-charger.md`), mail/packages badge
  (`research/peripheral-fixtures.md`).
- ✅ **Phase 2** (SHIPPED 2026-07-17): event-focused thought bubbles
  (`research/event-thought-bubbles.md`) + **water valves** (bind `valve.*`
  or the switch-entity irrigation pattern per
  `research/irrigation-sprinklers.md`; open/close from the panel) +
  **smart plugs** (outlet fixture bound to `switch.*`, optional power
  entity) — both with per-device configuration (label, binding,
  allow-control) and click-to-toggle from the interface (added
  2026-07-17).
- ✅ **Phase 3** (SHIPPED 2026-07-17): moon-phase + sun-position background props
  (`research/moon-uv-vehicle.md`), weather as background
  (`research/weather-background-fx.md`).
- ✅ **Phase 4** — SHIPPED 2026-07-17: avatar rig gaps (new eye styles +
  eyeColor, 8 limb anchors, quad legColor/flap ears/broad snout,
  deterministic pattern generator, sessile mode, animate channels
  sway/flap/orbit/spin, hop/knuckle gaits, ear swivel). The follow-ups
  (fabric prints/decals/text, pose-aware/two-handed props 2026-07-17;
  costume swaps 2026-07-18) all shipped — see the backlog section.
- ✅ **Phase 5** — SHIPPED 2026-07-17 (user-continued;
  `docs/DESIGN-mqtt-bridge.md`): direct-MQTT bridge (HA-relay
  `mqtt/subscribe` path + hand-rolled MQTT-3.1.1-over-WebSocket direct
  path, secrets in localStorage only), Frigate ground-truth camera
  targets (pure DLT homography + snapshot-click calibration + slot-keyed
  GOAL-mode targets + identity fusion), Valetudo room-map overlay
  (deflate parse, dock-calibration transform, vacuumMap layer,
  cleaning glow, tap-to-clean publish).

## Planned arc — 2026-07-20 (user-ordered, NOT yet started)

Captured from a user planning pass. Ordered by dependency + payoff, not by
size. Each stage ships independently (commit + push both + deploy) and gets a
design doc pinned before the first line of code, per the house pattern.

- ✅ **P1 — Lovelace card packaging** — SHIPPED 2026-07-20 (`<diorama-card>`
  third Vite entry, shared kiosk-locked planner, card-local view/mode, both
  sizing APIs, hand-rolled editor; research `docs/research/lovelace-card.md`).
  Original brief: ship Diorama as an *addable
  dashboard card* alongside the existing `panel_custom` panel + iframe modes,
  so a user can drop a floor view into any Lovelace view (e.g. a single-room
  card, a kiosk-framed 3D view) rather than only a full-page panel.
  Investigate: HA's custom-card contract (`setConfig`, `hass` setter,
  `getCardSize`, editor + `getStubConfig`), sizing/aspect inside a card grid
  (Diorama assumes it owns the viewport — the 3D canvas, toolbar dock, and
  sidebar all need a card-mode layout), which UI chrome to suppress
  (sidebar/toolbar off; the existing `uiMode` kiosk/view + URL-template
  machinery is most of the answer), config schema (`floor`, `view`, `layers`,
  `view3d`/`cam`, `mode`) mapping onto today's URL params, and whether the
  card and panel can share one bundle entry (a third Vite entry is likely).
  Card-mode config is HA-side YAML, NOT the Diorama store — keep them
  separate. **Prereq for nothing else; highest reach-per-effort of this arc.**

- ✅ **P2 — Record-a-position pins** — SHIPPED 2026-07-20 (lat/lon-truth
  pins re-projecting through the fit, tracker capture w/ accuracy warn,
  chain + segment lengths, convert-to-ground-area; geo-test 80/80 +
  record-pin-test 53/53). Original brief (S/3):
  Today a geo landmark is placed on the plan and *then* calibrated to a
  lat/lon. Add the inverse: capture the CURRENT GPS fix (or a manually
  entered lat/lon) and drop the resulting pin onto the plan at wherever the
  existing landmark fit projects it — walk the property line, tap "record
  point" at each corner. Primary use: **boundary identification** (the
  recorded chain becomes a property outline / yard boundary, feeding
  `geo.boundaryM`-style clamping and, later, P5's exclusion areas).
  Reuses `latLonToPlan` + the calibration sampler wholesale; the new parts
  are a record-point action, a recorded-point list (persisted store-level
  beside `geo.landmarks`), and rendering the chain as a closed boundary
  polyline in 2D (+ optionally a low fence-like ribbon in 3D). Pin whether a
  recorded chain is its own type or reuses `GroundArea`/a polygon.

- ✅ **P3 — Docs pages link to the live demo** — SHIPPED 2026-07-20
  (floorplan-page demo links + gallery `?model=<kind>` Model-viewer boot for
  demo-renderable types; demo-boot-test 50/50). Original brief (S/2): Now that `/demo/` hosts
  the real app, every model-gallery tile and floor-plan tile should deep-link
  to *that specific thing* in the live demo — floor plans already can
  (`demo/index.html?demo=<slug>`, just wire the tile); models need a demo
  entry point that spawns/frames a single furniture kind or avatar (either a
  scratch config generated per model, or a new `?model=<kind>` demo param
  that seeds a one-piece floor). Cheap, and it turns the static gallery into
  a try-it surface. Touches `scripts/docs-site/*` + a small app-side param.

- ✅ **P4 — Flight & satellite tracking** — SHIPPED 2026-07-25 in 3 waves
  (data layer: pure flights.ts normalizer + compression shell + adsb-sources
  fetch isolation + satAltAz; renderer: prop/jet/heli rigs w/ callsign
  banners/labels + dead reckoning + ISS sprite + 2D glyphs; UI: Settings
  block + airplanes.live attribution + alert-center 'flight' source + flyover
  bubbles). flights-test 144/144, flights-render 80/80, flights-ui 55/55.
  Authoritative research: `docs/research/flight-tracking.md` — pinned there:
  cloud = airplanes.live ONLY (sole CORS-open API; adsb.lol/adsb.fi have no
  CORS header, OpenSky is CORS-locked + ToS-forbidden), local receivers need
  a user-added CORS header, satellites = ISS-only via wheretheiss.at (no
  SGP4/no npm dep; pass PREDICTION deferred to a v2 propagator decision).
  **The source landscape above is SUPERSEDED (2026-08-15, v0.66.0) — see
  `flight-tracking.md` §2.9–§2.11b.** airplanes.live now 403s everyone and
  requires being a FEEDER; there is no keyless CORS-open ADS-B API left, so
  opensky/adsb.lol are fetched SERVER-SIDE by HA via a `rest_command`
  (OpenSky is the default, and its ToS covers personal non-commercial use —
  the old "never add it" note was wrong). A local receiver may use that same
  proxy, which removes its CORS + mixed-content constraints entirely, though
  a direct fetch stays lighter and is preferred. A synthetic `demo` source
  needs neither network nor HA.
  Original brief (M–L/4): Aircraft (and satellite
  passes) overhead, rendered in the existing sky dome. Sources: **local
  ADS-B** (dump1090/readsb/tar1090 on the LAN, or HA's ADS-B integrations)
  AND a **cloud fallback** (adsb.lol / OpenSky / airplanes.live — compare
  licensing + rate limits before picking). Design notes from the user:
  more plane models, some towing banners; **flight operator / callsign
  rendered as cel-shaded text on or beside the aircraft**; **max altitude
  scaled** so high traffic stays in frame instead of vanishing overhead
  (a compressed altitude curve, not linear); alerting on interesting
  passes (low overflight, a specific callsign, ISS pass). Fits the
  existing `sky-astro.ts` (satellite passes are the same ephemeris family
  — SGP4/TLE is the honest source, note the cost) + the bg-text banner
  plane machinery (already have a tow-plane + banner rig to reuse). Pin
  early: refresh cadence + how aircraft positions map through `geo.ts` to
  the plan frame, and that this must degrade to nothing when no source is
  configured.

- ✅ **P5 — Neighborhood overlay (OpenFreeMap)** — SHIPPED 2026-07-20 in
  3 waves (data layer: zero-dep MVT decoder + tile math + IDB cache;
  renderer: toon building extrusions + attribution; UI: roads/water/
  landuse + exclusion draw tool + sidebar alignment/scale controls +
  Settings block). neighborhood-test 84/84 + render 41/41. Original
  brief (L/5): Render the surrounding
  neighborhood — 3D building extrusions + road/landuse overlays — sourced
  from https://openfreemap.org/ (OpenStreetMap data). Positioned by the
  existing **GPS landmark fit**, with user **fine-tuning of alignment**
  (nudge/rotate on top of the fit), user-adjustable **vertical scaling** of
  buildings, and definable **exclusion areas** so the overlay never collides
  with the user's own house/yard geometry. Enable/disable in settings;
  because alignment is an authoring activity, the **layer choices +
  alignment/scaling controls live in the SIDEBAR** (mirroring the
  Move/Rotate-plan nudge idiom). Must honor OpenStreetMap attribution +
  OpenFreeMap's usage policy, cache tiles locally (IndexedDB precedent:
  `model-store.ts`), and degrade gracefully offline (including the GitHub
  Pages demo). Authoritative research + build-ready design:
  `docs/research/neighborhood-openfreemap.md`. **Largest item in the arc.**
  Pinned by that research: **do NOT pull in MapLibre GL JS** (a second full
  WebGL renderer, ~210–750 kB gzipped, with its own Mercator camera + styling
  engine that fights the toon `_mat()` look and the two-runtime-dep rule) —
  instead fetch OpenFreeMap's raw MVT tiles and decode the narrow protobuf
  surface with a hand-rolled zero-dep codec (the `mqtt-ws.ts` precedent),
  extrude footprints via `ExtrudeGeometry` + `_mat()` using OSM
  `render_height`/`render_min_height`, and reuse the SHIPPED `bufferPolyline()`
  for road ribbons + the ground-area/terrace y-layering conventions. The
  tile→lat/lon inversion is exact, so positioning rides the existing
  `latLonToPlan` unchanged. **Honesty constraint**: ~93 % of OSM buildings
  carry no height/levels tag, so most extrusions are inferred — ship
  `verticalScale` + `defaultLevelHeightM` as first-class sidebar controls
  rather than implying survey accuracy. Phases: **N1** pure tile math + MVT
  decoder + IDB cache (no UI) → **N2** `Store.neighborhood` + Planner
  fetch/cache wiring → **N3** buildings-only extrusion + OSM attribution
  (first shippable slice) → **N4** roads/water/exclusions + sidebar alignment
  & scale UI (the phase that makes it usable) → **N5** Settings enable/source
  block, landuse, 2D peek outline. Top risks: decoder robustness across real
  tiles, height honesty, and dense-tile performance on tablet GPUs (needs a
  building cap/LOD sized empirically, not guessed).

## Backlog — captured 2026-07-15 (placeholders, NOT yet scoped)

Raw feature/fix requests parked for later. **No design or research has been
done on these** — they are recorded verbatim-in-intent so nothing is lost.
Do not treat any note here as a decided approach.

### Avatars
- ✅ **Movement over void → drop to stairs** — SHIPPED July 2026 in three
  slices: v1 descending-stairs rails + descend/emerge behaviors; v2 floor
  voids (`Floor.voidAreas`, nav-blocked, stairs bridge) + stair links +
  BLE cross-floor transits + glass-house transit puppet. Design record:
  `docs/research/avatar-nav-stairs.md`.
- ✅ **Event-focused thought bubbles** — SHIPPED 2026-07 Phase 2a (BUBBLE_POOL_EVENT: appliance-done/rain/severe tiers + householdEvents). Original brief: when something *happens* — a
  dishwasher / washer / dryer finishes, severe weather arrives, rain
  starts, lightning strikes — let a thought of that event take focus
  (higher-priority, event-triggered bubble tier).

### Weather display
- ✅ **Forecast entity support** — SHIPPED 2026-07 DC-C (`getWeatherForecasts` + chip forecast strips). Original brief: consume a future/forecast weather entity per
  `weather.get_forecasts` (https://www.home-assistant.io/actions/weather.get_forecasts/).
- ✅ **Movable chip** — SHIPPED 2026-07 DC-C (`chipAnchor` 6 anchors + custom x/y). Original brief: reposition the weather display to a predefined anchor
  (top-left / top-middle / top-right / bottom-right / bottom-middle /
  bottom-left) or a custom location.
- ✅ **Customizable content** — SHIPPED 2026-07 DC-C (`chipContent` rows + hourly/daily strips). Original brief: show any combination of current weather +
  future weather (by hours or by days).
- ✅ **Current weather alerts** — SHIPPED 2026-07 DC-D (region-agnostic `parseWeatherAlerts` — no per-region source needed). Original brief: as its OWN customization — could use something
  like NWS Alerts (https://github.com/finity69x2/nws_alerts); other regions
  may need their own alert source.

### Time / entity-value display object (maybe merged with EnvSensors)
- ✅ (the whole object SHIPPED 2026-07 DC-A as `InfoCard` — billboard or fixed plane, wall/surface/floor mounts.) A placeable object that displays the value of ANY selected entity with
  customizable formatting, size, color, etc.
- Can stay flat on a wall, sit on a table, etc.; does NOT need to pivot to
  face the camera, but has that option.
- ✅ **Logical formatting** — SHIPPED 2026-07 DC-A/B (value-rules engine: InfoCard rules + logical lights). Original brief: text format + color changes by value — e.g.
  <32 °F blue, 68–74 white, 75+ red — via ranges OR a gradient.

### HVAC controls
- ✅ **Wall-mounted HVAC control** — SHIPPED July 2026: `ThermostatFixture`
  (`Floor.thermostats`, alarm-keypad recipe) + `<diorama-thermostat-modal>`
  (mode/setpoint/fan/preset dispatch) + mode-colored vent airflow particles
  (heat red / cool blue / fan grey). Per-room heat-map (research §4.5)
  remains a follow-up.

### Generic controls
- ✅ **Generic action control** — SHIPPED July 2026 (Display & Controls
  arc): `Floor.actionButtons` + `Planner.fireAction` dispatch table +
  confirm gating + press cooldown + last-fired affordance + avatar bubble
  reactions.
- ✅ **Generic logical-state light** — SHIPPED July 2026: `Light.logic`
  through the shared `value-rules.ts` engine (on/color/flash from any
  entity).

### Locks
- ✅ **Display-only lock mode** — SHIPPED July 2026: `Door.lockControl:
  'display'` (passive indicator, single planner enforcement point) + full
  lock-state visual vocabulary (jammed/locking/unlocking/unavailable).

### Avatar rig gaps (parked 2026-07-16 from the avatar-pack research triage)
Approximated with conventions in the shipped packs; see
`docs/DESIGN-avatars.md` § "Rig-gap triage" and per-pack `// approx:` notes:
- ✅ Fabric prints / decals / text — SHIPPED 2026-07-17 (style decision:
  canvas-painted DECAL PLANES proud of the torso — text/glyph/print —
  never body texture maps; `HumanoidFields.decals`).
- ✅ Animated appendages — SHIPPED 2026-07 Phase 4b (`AvatarPrimitive.animate` sway/flap/orbit/spin, hop/knuckle gaits, quad `earAnimate`); per-tentacle idle channels + orbiting secondary props still approximated.
- Extra eye styles (compound, T-visor, sleepy, luminous-bulbous, eye color
  overrides) and quad eye customization.
- Additional anchors: wrist/cuff, ankle/foot, limb-midpoint (knee/elbow pads).
- Quad `legColor` (dark "points" legs — feet-only `pawColor` shipped),
  giant-flap ear enum, broad-muzzle snout shape, pattern/scatter generator
  for stripes/spots/dapples.
- ✅ Sessile/rooted mode (phase 4) + pose-aware hand props / two-handed
  prop convention (`AvatarPrimitive.twoHanded`, 2026-07-17).
- ✅ **Situational costume swaps** — SHIPPED 2026-07-18
  (`docs/DESIGN-costumes.md`): overlay look variants (`resolveLook` +
  `AvatarDef.variants` + universal sleep/exercise/cooking looks),
  auto-triggered with hysteresis, sparkle on swap, global + per-person
  gates. The rig-gap list is now fully cleared.

### Research items (do not action)
- ✅ **Log events & alerting** — SHIPPED 2026-07-17 (alert center bell/
  drawer: persistent_notification + Repairs; placeable alert beacons).
- ✅ **Background text messages (fun)** — SHIPPED 2026-07 (bgTexts: sky/banner/ground/train + the aircraft fleet). Original brief: research writing text into the
  backdrop — embedded in the sky, written on the grass, a plane towing a
  banner, or skywriting — to present messages playfully.
- ✅ **Weather as background animation** — SHIPPED 2026-07 W2/W3 (precip/fog/lightning/sky + upwind storm-brewing approach). Original brief: research rendering current weather as
  the background animation, with weather-coming-soon shown approaching from
  the distance.
- ✅ **Calendar / news surfaces** — SHIPPED 2026-07-17 (wall calendar
  fixture bound to calendar.*; TV news ticker + weather-on-TV screen
  surfaces with now-playing precedence).
