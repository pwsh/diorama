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
| Roborock live position | Core integration's map/camera entity carries a live `vacuum_position` x/y/angle attribute (device units) + `get_vacuum_current_position` action; room polygons are image-only | Real moving vacuum dot replacing the simulated roam when present; needs a per-device unit→mm calibration step (two reference points) | M | 4 |
| `geo_location` events | Building-block platform; every entity carries real `latitude`/`longitude` + `source` (USGS/GeoNet quakes, NSW/Queensland fires, GDACS) | Severity-scaled pins through the existing `latLonToPlan` path (same pipeline as GPS pins/landmarks); "recent quakes near home" ring overlay | M | 4 |
| Frigate zone occupancy | Official integration exposes per-camera/zone/object `binary_sensor` occupancy (person/car/dog) — booleans, no coordinates, but the ZONE is user-defined in Frigate | Feed straight into the existing per-room activity glow — a room lights up when Frigate sees a person there. Cheapest high-wow item found | S | 5 |
| Aqara FP2 zone presence | One `binary_sensor` per user-defined zone (up to ~30 per room, via HomeKit Controller); zone SHAPES not exposed | User draws a zone polygon in Diorama (mmWave zone-editor idiom) and binds it to the FP2 zone sensor — per-region presence truth without radar | M | 5 |
| Frigate raw boxes / Valetudo maps | Pixel bounding boxes + `current_zones` live only on Frigate's own MQTT (`frigate/events`); Valetudo's room polygons/path live in a PNG `zTXt` chunk | Requires a **direct-MQTT bridge** (new integration pattern — Diorama currently speaks only HA WS) + per-camera homography. Highest ceiling, highest cost | L | 5 |

## Tier 2 — strong spatial fits on existing machinery

- **Covers** (`cover` domain, per device_class): garage door = segmented
  overhead panel rolling up with `current_position` (M/4); blinds/shades/
  curtains = position-driven sashes inside the existing per-kind window
  builder, tilt slats for blinds (S–M/3); gate = exterior door-like panel
  (M/3, wants a fence/property concept). Reuses the door/window pipelines.
- **Water leak sensors** (`binary_sensor.moisture`): blue puddle decal
  spreading at the sensor — the W3 puddle texture/fade machinery already
  exists; this is now S effort, high payoff (4).
- **Sirens** (`siren`): pulsing beacon — shares the smoke/CO beacon
  component (S/4).
- **Doorbells** (`event` domain — Ring/Nest; UniFi Protect also has real
  sustained binary_sensors): needs a small **transient-pulse system**
  (flash-then-decay on an event timestamp, distinct from state-bound
  rendering — the one genuinely new rendering primitive in this tier);
  ring ripple at the door + optional event snapshot popover (M/4). The
  2027.4 `DoorbellEventType.RING` standardization simplifies matching.
  Support all three shapes (event / button / legacy binary_sensor).
- **Cameras**: wall/ceiling fixture with a translucent FOV frustum +
  periodically refreshed `camera.snapshot` thumbnail badge (M/4);
  live HLS/WebRTC in-scene is L — defer.
- **Climate / per-room temperature shading**: do NOT assume one `climate`
  entity = one room (whole-house is the majority case). Per-room heat-map
  shading should ride placed temperature EnvSensors (works for everyone,
  incl. ecobee remote SmartSensors which are plain sensors); a bound
  `climate` entity contributes `hvac_action` (heating/cooling/idle — NOT
  hvac_mode) as a vent-glow/airflow cue on a thermostat fixture (M/3).
- **Fans**: `percentage` drives existing fan-blade spin rate; `direction`
  is forward/reverse only — no compass data exists, don't fake airflow
  direction (S/2).
- **Energy / power**: per-device power glow on bound appliances
  (device_class `power` sensor, intensity ∝ W) — pairs with the shipped
  in-use LED (S/3). Whole-home meter is a chip, not spatial.
- **Battery badges**: one horizontal "Battery" layer — HA's own frontend
  convention is a sibling `sensor` with device_class `battery` on the same
  HA device; mirror that resolution and badge any bound fixture when low
  (S/3). The `battery_level` attribute on tracker entities is deprecated
  (removal 2027.7) — never read it.
- **Media now-playing**: `media_player` `entity_picture` (album art via
  `/api/media_player_proxy/...`) + `media_title` floated over speaker/TV
  fixtures; `group_members[0]` is the group leader for speaker-group link
  lines (M/4).

## Tier 3 — cheap EnvKind / fixture extensions

- New `EnvKind`s (map extensions in `ENV_KINDS`, S each): `radon`
  (Bq/m³ — Airthings; WHO/EPA thresholds), `sound_pressure` (dB noise
  puck, optional loudness ripple), `no2`/`o3`/`aqi` (confirmed sensor
  device_classes; the legacy `air_quality` domain is deprecated — never
  target it), split `voc` vs `volatile_organic_compounds_parts`.
- **UV index**: `weather.*` carries `uv_index` natively and Open-Meteo's
  API (already wired) exposes `uv_index`/`uv_index_max` — fold into
  WeatherNow (field already exists) + a chip readout / parasol flourish (S/2).
- **Garage-bay vehicle presence**: pure DIY pattern (ultrasonic/ToF →
  presence binary_sensor) — a car-silhouette furniture kind bound to a
  binary_sensor covers it with zero new mechanism (S/2).
- **Moon phase** (8-state sensor): night-sky prop per phase; no position
  data — recolor/swap only (S/2, needs the integration installed).

## Tier 4 — niche / deferred / dead ends

- **EV charger fixture**: only Wallbox + Peblar are core; OCPP +
  ChargePoint are HACS. If built, design around a common shape
  (plugged-in, charging state, power, current limit) — never one vendor's
  entity ids (M/3). Vehicle BLE presence via Bermuda: frame as coarse
  binary presence only — community experience says outdoor single-proxy
  trilateration flaps (do not promise precision).
- **Cars**: Tesla Fleet (core; 50 writes/day cap) is the stable target;
  BMW connected_drive is REMOVED (API blocked 2025-09) — cautionary tale;
  Ford is HACS-only.
- **Irrigation**: zones are `switch` entities in practice (Rachio,
  Rain Bird; nobody has migrated to the `valve` domain yet) — yard
  sprinkler-arc animation gated on a bound switch is easy once a yard
  concept exists (M/3).
- **Pool**: heater support must branch on climate-entity presence
  (ScreenLogic/iAquaLink have one; OmniLogic doesn't). Needs a pool
  furniture/terrain concept first (L/3).
- **Plants**: legacy `plant.*` domain is orphaned; modern pattern is a
  device with moisture/light/battery sensors (FYTA). A thirsty-plant
  droop on the existing plant furniture kind is charming (M/3).
- **Weather alerts** (DWD/MeteoAlarm/Env-Canada; NWS core has NO alert
  entity): attribute-rich but zero coordinates — generic severity banner
  only (S/3).
- **Mail/packages** (HACS Mail-and-Packages): count badge at the front
  door + mailbox-lid binary_sensor as a door-like fixture (S–M/2).
- **Printers**: OctoPrint (3D printing progress/temps) is rich; ink
  printers are IPP-generic (S/2, low spatial value).
- **NAS/server/network**: dashboards, not spatial — skip except maybe a
  rack fixture with health LED (1–2). UniFi does NOT expose per-client AP
  association in docs — no room-level Wi-Fi mapping.
- **Update entities**: sidebar badge at most (non-spatial, 1).
- **Dead ends confirmed**: tide/marine (legacy, no coords),
  `conversation`/Assist (zero spatial data), scene/script/automation
  (stateless/abstract; area inference would need registry cross-refs),
  input_* helpers, Matter/Thread (transports, not domains).

## Architectural prerequisites worth building once

1. **Transient-pulse rendering path** — event/button domains have no
   persistent state; a "flash on timestamp, decay over N s" primitive
   unlocks doorbells, buttons, and event-typed detections.
2. **Direct-MQTT bridge (opt-in)** — the gate to Frigate boxes and
   Valetudo maps; a deliberate break from the pure-HA-WS model, isolate
   like `weather.ts` isolates fetch.
3. **Device-siblings resolution** — resolve related entities (battery,
   power, door) from the HA device registry instead of one-binding-per-
   datum; enables battery badges + richer appliance cards with less UI.
4. **Yard/terrain concept** — mower, irrigation, gates, pool, and
   geo_location pins all want a modeled outdoors beyond the slab void.

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

## Backlog — captured 2026-07-15 (placeholders, NOT yet scoped)

Raw feature/fix requests parked for later. **No design or research has been
done on these** — they are recorded verbatim-in-intent so nothing is lost.
Do not treat any note here as a decided approach.

### Avatars
- **Movement over void → drop to stairs**: walking where there is no floor
  should route the avatar to/through stairs instead of over empty space.
- **Event-focused thought bubbles**: when something *happens* — a
  dishwasher / washer / dryer finishes, severe weather arrives, rain
  starts, lightning strikes — let a thought of that event take focus
  (higher-priority, event-triggered bubble tier).

### Weather display
- **Forecast entity support**: consume a future/forecast weather entity per
  `weather.get_forecasts` (https://www.home-assistant.io/actions/weather.get_forecasts/).
- **Movable chip**: reposition the weather display to a predefined anchor
  (top-left / top-middle / top-right / bottom-right / bottom-middle /
  bottom-left) or a custom location.
- **Customizable content**: show any combination of current weather +
  future weather (by hours or by days).
- **Current weather alerts**: as its OWN customization — could use something
  like NWS Alerts (https://github.com/finity69x2/nws_alerts); other regions
  may need their own alert source.

### Time / entity-value display object (maybe merged with EnvSensors)
- A placeable object that displays the value of ANY selected entity with
  customizable formatting, size, color, etc.
- Can stay flat on a wall, sit on a table, etc.; does NOT need to pivot to
  face the camera, but has that option.
- **Logical formatting**: text format + color changes by value — e.g.
  <32 °F blue, 68–74 white, 75+ red — via ranges OR a gradient.

### HVAC controls
- Wall-mounted HVAC control with a popup control panel + animations: vents
  blowing red / white / blue depending on mode (heat / fan-only / cool).

### Generic controls
- **Generic action control**: a wall-mounted / table-sitting / floor-placed
  button or object that triggers any assigned entity (custom controls).
- **Generic logical-state light**: a light whose state reflects an entity
  state OR a logical query — e.g. temp > 200 °F → red, > 300 °F → flash red,
  otherwise off.

### Locks
- Allow **disabling lock controls** on a door and only DISPLAYING the state
  (display-only mode).

### Research items (do not action)
- **Log events & alerting**: research surfacing/displaying alerts from a log
  event stream.
- **Background text messages (fun)**: research writing text into the
  backdrop — embedded in the sky, written on the grass, a plane towing a
  banner, or skywriting — to present messages playfully.
- **Weather as background animation**: research rendering current weather as
  the background animation, with weather-coming-soon shown approaching from
  the distance.
- **Calendar / news surfaces**: research showing calendar events as a
  calendar on the wall (or elsewhere); a "news of the day" scroller on the
  TV; weather playing on the TV.
