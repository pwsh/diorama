# Direct-MQTT Bridge: Frigate Raw Boxes & Valetudo Room Maps

Research doc for a Diorama feature. Status: research only, not implemented.

## 1. Summary

Diorama is a spatial panel: its entire value proposition is "see live device state
in spatial context." Two of the richest spatial data sources in a typical
self-hosted smart home — **Frigate** (NVR/object detection) and **Valetudo**
(de-clouded robot vacuum firmware) — publish genuinely spatial data (pixel
bounding boxes, room polygons) that **Home Assistant's WebSocket API does not
expose**. HA only sees the derived, non-spatial summary: "person detected"
booleans/counts for Frigate, and a single vacuum state string for Valetudo. The
pixel boxes and room polygons exist only on the MQTT bus (or, for Valetudo,
also as a JSON blob smuggled inside a PNG image entity) that HA's own MQTT
integration consumes and then throws away the spatial part of.

This doc is the architectural prerequisite for two high-ceiling features:

- **Frigate ground-truth people/vehicle positions**: turn a camera's detected
  bounding boxes into an actual (x, y) position on Diorama's floor plan via a
  per-camera ground-plane homography, feeding the exact same humanoid-rig /
  target pipeline that mmWave and BLE already drive — but for the yard,
  driveway, and porch areas no radar or BLE proxy covers.
- **Valetudo live room maps**: draw the vacuum's own SLAM-derived room
  segmentation as floor overlays (a "does your plan match reality" check),
  and glow the room currently being cleaned — reusing the existing
  `Room.occupancyEntity` glow idiom but driven by the robot's own map instead
  of a separate occupancy sensor.

Both need a bridge because the data literally isn't reachable through
`HaApi` as it exists today. The central research finding (see §2) is that
there are **two different bridge shapes**, with materially different
trust/complexity tradeoffs, and the better one **is not a raw-broker
connection** — HA's own WebSocket API already has an `mqtt/subscribe` command
that rides the *existing authenticated `hass` connection* Diorama already
holds. A raw-broker MQTT.js-over-WebSockets connection (the literal "direct
MQTT bridge" framing) is the fallback path, needed only when the panel's HA
user isn't an admin.

## 2. Home Assistant data model

### 2.1 What HA's Frigate integration exposes over WS (core/entity path)

`blakeblackshear/frigate-hass-integration` (HACS custom integration, MQTT-based
— not core) creates, per configured camera/zone/object:

- **`binary_sensor.<camera>_<object>_occupancy`** (and one per zone×object) —
  boolean, "count > 0". This is the ONLY presence signal reachable via HA
  states/WS.
- **`camera.<camera>`** — live stream (RTSP-backed); `camera.turn_on`/`turn_off`.
- **`image.<camera>_person`** (etc., one per configured object label) —
  latest-snapshot image entity per object type.
- **`sensor.<camera>_fps`**, `sensor.<camera>_detection_fps`, camera-state
  sensors — performance telemetry, not spatial.
- **`switch.<camera>_detect|recordings|snapshots`** — toggles.
- Notification API endpoints (thumbnail/snapshot/clip) at
  `/api/frigate/notifications/<event-id>/{thumbnail,snapshot}.jpg` — these are
  Frigate's OWN HTTP API, reverse-proxied through HA; reachable by a normal
  `fetch()` from the panel (same pattern as the already-shipped camera
  snapshot `<img src={haBaseUrl + entity_picture}>`), no MQTT needed for stills.

None of the above entities carry `box`, `region`, `area`, `ratio`,
`current_zones`, `entered_zones`, or `sub_label` as an attribute. This was
confirmed by reading the integration's HA-facing docs and cross-checking
several HA-community threads asking exactly this question — the consistent
answer is "that only exists in the MQTT event, not the entity." (Frigate's
official docs: [Home Assistant Integration](https://docs.frigate.video/integrations/home-assistant/);
integration repo: [github.com/blakeblackshear/frigate-hass-integration](https://github.com/blakeblackshear/frigate-hass-integration).)

### 2.2 What is MQTT-only (Frigate)

Primary source: [docs.frigate.video/integrations/mqtt](https://docs.frigate.video/integrations/mqtt/)
(also mirrored in-repo at `docs/docs/integrations/mqtt.md` on the `dev` branch).

- **`frigate/events`** — the money topic. Payload:
  ```json
  { "type": "new" | "update" | "end", "before": {...}, "after": {...} }
  ```
  `before`/`after` objects carry (field names verbatim):
  `id`, `camera`, `frame_time`, `label`, `sub_label`, `top_score`, `score`,
  **`box`: [x1,y1,x2,y2]**, **`region`: [x1,y1,x2,y2]**, `area`, `ratio`,
  `false_positive`, `active`, `stationary`, `motionless_count`,
  `position_changes`, **`current_zones`: string[]**, **`entered_zones`: string[]**,
  `has_snapshot`, `has_clip`, `attributes`, `current_attributes`,
  `current_estimated_speed`, `average_estimated_speed`, `velocity_angle`,
  `recognized_license_plate`, `recognized_license_plate_score`. A `type: "end"`
  message has `after.end_time` set — that's the despawn signal.
- **Coordinate system for `box`/`region` — pixel coordinates in the camera's
  `detect` stream resolution** (config `detect.width`/`detect.height`,
  commonly defaulted/auto-negotiated around 1280×720), **not** normalized
  0–1 and **not** the zone-polygon convention. Confirmed by cross-referencing
  a real example payload (`"box":[415,489,528,700]` against a ~720p-scale
  frame) against Frigate's glossary definition of "region"/"box" as
  detector-pipeline concepts. Contrast: **zone boundaries in `config.yml`
  ARE normalized 0–1** (e.g. `0.033,0.306,0.324,0.138,...`) — a different
  convention from the runtime event boxes. This mismatch is a real
  calibration trap (see §7).
- **`frigate/<camera>/<object>`**, **`frigate/<camera>/<object>/active`** —
  raw counts (what the `binary_sensor` is derived from).
  **`frigate/<zone>/<object>`**, **`frigate/<zone>/<object>/active`** — same,
  scoped to a zone (zone names are global across the Frigate config, not
  camera-scoped, so the topic has no camera segment).
  **`frigate/<camera>/<object>/snapshot`** — a JPEG of the crop, per detection.
- **`frigate/tracked_object_update`** — later metadata (face/LPR/semantic
  description) attached after the fact, keyed by event id.
- **`frigate/reviews`** — review-item (alert/detection severity) lifecycle,
  separate from per-object events.
- **`frigate/available`** — `"online"`/`"offline"` LWT.
- Full topic reference (`.../status/<role>`, `/motion`, `/ptz`, `/birdseye*`,
  etc.) is long and control-oriented (not spatial); see the source doc.

Frigate's **own HTTP API** (`/api/events`, `/api/<camera>/<label>/best.jpg`,
a JSMPEG/MSE restream) is a second way to reach this data without MQTT at
all, if Frigate is reachable directly (same LAN) — worth keeping as a note
even though this doc is scoped to the MQTT path, because it sidesteps *both*
the admin-gate and the broker-credential problem for the box data
specifically (not for Valetudo).

### 2.3 What HA's vacuum integration exposes (Valetudo / Xiaomi / Roborock)

A `vacuum.*` entity: `state` (`cleaning`/`docked`/`returning`/`paused`/`idle`/
`error`), `battery_level`, `fan_speed`, and (integration-dependent)
`status`/`error` attributes. **No room polygon geometry, no live pose stream,
no per-segment cleaning progress** is available as an entity attribute over
WS — this matches Diorama's own already-shipped `RobotFixture.posEntity`
design note, which reads a **map camera/image entity** (a rendered PNG) for
position, not a queryable polygon.

### 2.4 What is MQTT-only (Valetudo)

Primary source: [valetudo.cloud/pages/integrations/mqtt](https://valetudo.cloud/pages/integrations/mqtt/).
Requires `provideMapData: true` in Valetudo's MQTT config (off by default is
not certain either way — verify at implementation time; the docs frame it as
an explicit opt-in flag on the MapData handle).

- **`<prefix>/<identifier>/MapData/map-data`** — the **raw map, as a deflated
  JSON string** (not an image) — this is the one the bridge should read; no
  PNG parsing needed for the room polygons. Retained.
- **`<prefix>/<identifier>/MapData/map-data-hass`** — the SAME data,
  packaged as a **valid PNG** with the deflated `ValetudoMap` JSON smuggled
  into a **`zTXt`** chunk (compressed text chunk) so that a plain
  `camera.mqtt` HA entity (image-only) can display *something*, while a
  smarter consumer can still recover the structured JSON by extracting that
  chunk and inflating it. This is the artifact the task brief is pointing at;
  it exists ONLY because HA's MQTT camera platform can't carry structured
  JSON, so Valetudo hides it in PNG metadata as a workaround. **Diorama
  should read `MapData/map-data` directly and skip PNG/zTXt parsing
  entirely** — it's simpler and it's the same information.
- **`<prefix>/<identifier>/MapData/segments`** — JSON `{ "<segmentId>": "<name>" }`
  (e.g. `{"16":"DownFrontDining","17":"DownFrontOffice",...}`) — room **names**,
  separate from room **geometry** (which lives in the map-data payload's
  `segment`-type layers).
- **`ValetudoMap` JSON shape** (from `backend/lib/entities/map/ValetudoMap.js`,
  [Hypfer/Valetudo](https://github.com/Hypfer/Valetudo/blob/master/backend/lib/entities/map/ValetudoMap.js)):
  ```
  { metaData: { version, nonce, totalLayerArea },
    size: { x, y },
    pixelSize: <number>,
    layers: [ { type: "floor"|"wall"|"segment"|"path"|...,
                pixels | compressedPixels,
                metaData: { segmentId?, name?, area?, material? } } ],
    entities: [ { __class: "PointMapEntity"|"PathMapEntity"|"PolygonMapEntity",
                  type: "robot_position"|"charger_location"|"path"|"active_zone"|...,
                  points: number[], metaData: { angle? } } ] }
  ```
  A real captured example: `size:{x:4000,y:4000}`, `pixelSize:5`,
  `robot_position.points:[1967,1993]`, `charger_location.points:[1982,1994]`.
  The in-code comment literally says "coordinates and size are in cm,"
  which conflicts with the far more common community description of
  Valetudo maps spanning roughly 0..51200 in **mm** with the robot near
  the middle of a multi-meter home. **Treat the unit as unverified — mm is
  the more probable real-world-consistent reading given typical map
  extents, but confirm empirically against one real payload (compare
  `robot_position` distance traveled between two fixes to the known floor
  plan) before trusting either mm or cm.** This is flagged again in §7.
  Coordinate origin is stated as top-left in the source; some community
  references claim bottom-left — reconcile empirically per §7, same
  caution as above.
- **`<prefix>/<identifier>/StatusStateAttribute/value`** and
  **`.../StatusStateAttribute/flag`** — vacuum activity (`idle`/`cleaning`/
  `error`/`docked`/`returning`/`paused`/`manual_control`/`moving`) and an
  enum flag (`none`/`zone`/`segment`/`spot`/`target`/`resumable`/`mapping`)
  telling you *which kind* of job is active — but NOT confirmed to include
  the specific active `segment_ids` in the same attribute topic (that only
  round-trips via the **command** topic `MapSegmentationCapability/clean/set`
  you sent). **Open question** (§7): whether the currently-cleaned segment
  id(s) are independently observable, or must be inferred by remembering the
  last clean command your own bridge issued.
- **`<prefix>/<identifier>/MapSegmentationCapability/clean/set`**,
  **`.../ZoneCleaningCapability/start/set`**, **`.../GoToLocationCapability/go/set`**
  — command topics (JSON payload with segment ids / zone rects / target
  point) — the write side, useful for a future "tap a room in Diorama to
  send the vacuum there" action.

### 2.5 The bridge mechanism itself — two shapes

**Path A (preferred): ride HA's own `mqtt/subscribe` WS command.**
HA core's MQTT integration registers a WebSocket command (verified by reading
`homeassistant/components/mqtt/__init__.py` on `dev`,
[github.com/home-assistant/core](https://github.com/home-assistant/core/blob/dev/homeassistant/components/mqtt/__init__.py)):
```
{ type: "mqtt/subscribe", topic: "<topic or wildcard>", qos?: 0|1|2 }
```
pushed messages arrive as `{ topic, payload, qos, retain }` events over the
SAME already-authenticated connection. **This requires
`connection.user.is_admin`** (`raise Unauthorized` otherwise — hard gate, not
a soft warning). Publishing has no WS equivalent; it's the ordinary
**`mqtt.publish` service** (`call_service`, fields `topic`, `payload`, `qos`,
`retain`) — a normal service call, not documented as admin-restricted, so
it should work through the same `Planner`/`HaApi` service-call plumbing
already used for `light.toggle` etc. (verify per-HA-version; not exhaustively
confirmed here).

This is enormously convenient for Diorama's architecture: `HassClient` and
`HassPanelAdapter` **both already speak WS commands generically** (that's how
`getDevices`/`getEntityRegistry`/`getHistory` are implemented) — subscribing
to `frigate/events` or a Valetudo `MapData/map-data` topic is a same-shaped
addition to `HaApi`: no new credentials, no new connection, reuses the
broker HA is already configured against. The cost is the admin-only gate:
a kiosk tablet logged in as a restricted HA user gets `Unauthorized`.

**Path B (fallback): a genuine direct-to-broker bridge, isolated like `weather.ts`.**
For non-admin panel sessions, or for users who don't want to grant the panel
admin, connect straight to the MQTT broker via **MQTT-over-WebSockets**
(browsers cannot speak raw TCP MQTT — WebSocket transport is the only option,
confirmed via multiple MQTT.js/EMQX docs). This needs:
- The broker's **websocket listener enabled** — HA's official Mosquitto
  add-on does **not** turn this on by default; the user must add a
  `listener 9001 0.0.0.0` / `protocol websockets` stanza via the add-on's
  "customize" config (community-documented, not automatic).
- **`wss://`** (not `ws://`) if Diorama itself is served over HTTPS/ingress —
  mixed-content browser policy will otherwise silently block the connection.
- Separate **host/port/username/password** the user must supply — a new
  credential surface, and one that (unlike the keyless Open-Meteo weather
  fetch) genuinely needs secret storage. Store these in `localStorage` only
  (mirroring `diorama:token`/`diorama:url`, never in the synced HA
  `Store`/`frontend.user_data`) — see §7 for the security tradeoff.
- **`mqtt.js`** as the client library (works unmodified in browsers per its
  own docs/dist bundle; size is non-trivial — budget it like the three.js
  chunk: dynamic-`import()` it only when the bridge is enabled, never a
  static top-level import, so 2D-only / non-MQTT users pay zero bytes).

Path A and Path B converge on the same internal event shape once inside
Diorama (`{topic, payloadJson}` → parsed Frigate/Valetudo record), so the
rest of the design (§4) is agnostic to which transport is active.

## 3. Real-world / visual reference

- **Frigate cameras**: Diorama already has a `CameraFixture` (batch G) — body
  + lens + FOV wedge, mounting height default 2200 mm, FOV 90°/range 6000 mm.
  No new fixture is needed for the camera itself; this feature only adds a
  *consumer* of what that camera sees. Typical real Frigate cameras (PoE
  eave/doorbell cams) mount 2400–3000 mm high, angled down 15–30°, FOV
  90–110° — all already approximated by the existing fixture's wedge.
- **Ground-plane assumption**: any pixel→floor mapping via homography is only
  valid for points that actually sit on the floor plane. Using the **bottom-
  center of the detection box** (the subject's foot-contact point) as the
  input pixel is the standard "ground-plane tracking" trick — it degrades
  for very oblique/high-mounted cameras and for outdoor cameras whose FOV
  spans a slope or a raised porch (yard-arc terrain is currently flat in
  Diorama, so this composes cleanly there).
- **Robot vacuum**: already-shipped `RobotFixture` covers physical footprint
  (~350 mm diameter, ~96 mm tall for a typical Roborock-class disc bot); this
  feature adds **room polygon overlays**, not a new physical model. Segment
  polygons render as flat floor patches at a similar y-height to the existing
  `groundAreas`/`Room.occupancyEntity` patches (y ≈ 4–8 mm, avoiding z-fight
  with the floor slab), one flat color per `segmentId` with a translucent
  fill + name label — visually "another room's worth of paint," not a new
  3D object language.

## 4. Diorama visualization & animation design

### 4.1 Frigate → ground-truth targets

- **New `TargetWorld` origin kind `'cam'`** (alongside existing `radar` /
  `ai` / `ble`), key `cam_<camera>_<frigateEventId>` (or `<camera>_<label>`
  if only one instance of a label is ever tracked per camera — event ids
  churn per detection lifecycle, so keying on the *event* id needs a
  same-camera/label successor-matching step; keying on `<camera>_<label>_<slot>`
  with a simple nearest-position hand-off is more robust and mirrors how the
  BLE/AI controllers already tolerate identity churn).
- A per-camera **calibration record** — 4+ `{u, v, x, y}` pairs (image pixel
  ↔ floor mm) — persisted on the `CameraFixture` (new optional field,
  `CameraFixture.groundHomography?: number[9]` or the raw calibration point
  list so it can be re-solved after adding a point). Solve via the classic
  **DLT (direct linear transform)** for a planar homography, hand-rolled to
  match the existing pure-math module style (`geo.ts`, `trilateration.ts` —
  zero imports, deterministic): each correspondence contributes 2 rows to an
  8-unknown linear system (`h33` fixed to 1),
  ```
  h11·u + h12·v + h13 − h31·u·X − h32·v·X = X
  h21·u + h22·v + h23 − h31·u·Y − h32·v·Y = Y
  ```
  solved exactly for 4 points (8×8 Gaussian elimination) or via normal
  equations (`AᵀA h = Aᵀb`, still 8×8) for N > 4 — same "small dense linear
  solve, no library" idiom already used for Procrustes fitting in `geo.ts`.
  A new pure module `src/frigate-geom.ts` (or folded into `geo.ts`) is the
  natural home, with its own `?c=` test page like `geo-test.html`.
- **Calibration UI**: mirror the geo-landmark calibration flow (§ "Geo
  reference" in `CLAUDE.md`) — instead of GPS sampling, the user clicks a
  point on the 2D floor plan *and* the matching pixel on a **frozen camera
  snapshot** (pulled once via the existing `haBaseUrl + entity_picture`-style
  fetch, or Frigate's `/api/<camera>/latest.jpg`), 4+ times. **Critical
  pitfall to surface in the UI**: the snapshot must be fetched/displayed at
  (or the click coordinates scaled to) the camera's **`detect` resolution**,
  because that's the frame `box`/`region` are reported against — not the
  recording/stream resolution, which is often higher.
- **Runtime**: subscribe (Path A or B) to `frigate/events`, filter to
  `type ∈ {new,update}`, `label` in an allow-list (person/dog/cat/car…),
  `false_positive: false`; project `((box[0]+box[2])/2, box[3])` through the
  camera's homography to floor mm; feed into the SAME lerp/spring
  (`stepLerp`) + carrot-chaser nav machinery the AI/BLE controllers use,
  **in GOAL mode** (no wandering — a real detection is ground truth, same
  posture as `_advanceBleGoal`). A `type: "end"` message (or no update for
  N seconds) triggers the existing despawn-fade path.
- **Fusion opportunity**: a `cam` target sits in the *same* candidate pool
  `_fuseIdentities` already scans (radar × BLE) — extending it to consider
  camera-derived positions as a third candidate source lets a person walking
  from the yard (camera-only coverage) through the front door (BLE/radar
  coverage) carry one continuous identity, which is a genuinely new
  capability (today `bleUnfused`/radar fusion has no outdoor leg).
- **2D**: a target dot in the camera's tint (reuse `Sensor.color`-style
  per-camera palette assignment) with a small camera-glyph badge
  distinguishing it from mmWave/BLE dots, same initials-chip/name-label
  path as fused targets when a `Store.people` match exists.
- **3D**: identical humanoid-rig path as any other target; `wantKind`/`wantColor`
  resolution already exists for fused/AI/BLE targets and needs no new logic
  beyond accepting `'cam'` as a valid origin.
- **Dirty keys / layer**: the *target* itself needs no new dirty key (targets
  run through `updateTargets` every frame like all others). The *camera FOV
  wedge* already exists under `sensors` layer. Add camera ids that receive
  bridge data to `_isSlowEntity`'s scope is N/A here — this is push-driven
  MQTT, not entity polling, so `Planner` should treat inbound bridge messages
  like the existing `state_changed` LIVE path: update an in-memory map,
  `emitConfig()` only on structural change (new camera bound / calibration
  changed), never on every detection (that's ~10 Hz-ish, same cadence as
  radar).

### 4.2 Valetudo → room overlay & cleaning glow

- **Room polygon overlay**: parse `MapData/map-data` (deflated JSON) once
  per robot per map revision (Valetudo republishes on job completion /
  significant map change, not every frame — cheap). Extract `layers` where
  `type === 'segment'`, decompress `pixels`/`compressedPixels` into polygon
  boundary points (or just a filled raster if run-length pixel data doesn't
  reduce to a clean polygon cheaply — a raster-to-canvas fill is simpler
  than polygon extraction and matches the "flat colored patch" visual
  goal), transform via `pixelSize` + the robot's placement calibration
  (`RobotFixture` already has `posScale`/`posOffsetX/Y`/`posFlipY`/`posRotDeg`
  — **reuse those exact fields**, since they already solve "map raw units →
  Diorama floor mm" for the dock-position use case; the room overlay is the
  same transform applied to every segment pixel instead of one point).
  Cross-reference segment ids against `MapData/segments` for names.
- **Rendering**: exactly the existing `groundAreas`/`Room.occupancyEntity`
  idiom — 2D flat kind-colored fill, 3D `ShapeGeometry` patch at y≈4-8mm,
  own toggle layer (or ride `zones`/a new `vacuumMap` layer) so it's an
  overlay the user can hide, not permanent geometry. This is explicitly a
  **comparison/diagnostic overlay** ("does the robot's SLAM room match what
  I drew?"), not a data source Diorama's own room/wall model depends on.
- **Active-cleaning glow**: subscribe to `StatusStateAttribute/value` +
  `.../flag`; when `value === 'cleaning'` and `flag === 'segment'`, glow the
  segment(s) the bridge itself last commanded via
  `MapSegmentationCapability/clean/set` (see §2.4 open question — there may
  be no independent "which segment right now" readout, so the glow may need
  to be sourced from Diorama's own command history when Diorama initiated
  the job, and fall back to "cleaning, room unknown" glow-of-all-segments
  when a job was started from the vendor app instead). Same visual language
  as the already-shipped `Room.occupancyEntity` warm-glow-on-loop patch.
- **New action**: tap a drawn room (or the overlay segment) → publish
  `MapSegmentationCapability/clean/set` with that segment's id — "clean this
  room" from the floor plan. Needs Path A/B publish (service call or raw
  MQTT publish) — the write-side half of the bridge.

### 4.3 Store / Planner shape

- `Store.mqttBridge?: { mode: 'ha-relay' | 'direct'; brokerHost?; brokerPort?;
  useTls?; topics recorded per-fixture instead of globally }` — top-level,
  add to `_loadFromHa`'s explicit field list (per the standing gotcha).
  **Never put `brokerUser`/`brokerPassword` in this — those live in
  `localStorage` only**, exactly like `diorama:token`, because `Store` syncs
  through `frontend.user_data` to every device/session.
  `Store.mqttBridge.mode` (enabled bit + relay-vs-direct choice) is fine to
  sync; secrets are not.
  Per-camera homography and per-robot calibration constants (no secrets) are
  fine as ordinary item-level fields (`CameraFixture.groundHomography`,
  reusing `RobotFixture`'s existing scale/offset fields) — synced normally.
- New isolated module `src/mqtt-bridge.ts` (mirrors `weather.ts`'s isolation
  discipline): owns the transport choice, exposes an
  `onMessage(topic, cb)`/`subscribe`/`publish` surface so the rest of the app
  never cares whether Path A or Path B is active. `HaApi` gets two additive
  methods (`subscribeMqtt(topic, cb)`, `publishMqtt(topic, payload)`) — Path
  A implementations wrap `mqtt/subscribe`/`mqtt.publish` service; Path B
  wraps a lazily-`import()`ed `mqtt.js` client. Both `HassClient` and
  `HassPanelAdapter` need the Path-A implementation (same WS command shape
  in both); Path B is transport-agnostic (browser WebSocket either way) so
  it can live once, outside the `HaApi` split, gated by
  `Store.mqttBridge.mode === 'direct'`.

## 5. Integration steps

Two independent tracks; do the bridge once, then each visualization
separately (each still roughly follows the canvas-fixture recipe for its
overlay/target piece).

**Bridge (shared prerequisite):**
1. `src/mqtt-bridge.ts` — pure-ish transport wrapper; Path A
   (`mqtt/subscribe` WS command + `mqtt.publish` service) implemented first
   since it needs no new credentials and exercises both `HassClient`/
   `HassPanelAdapter`.
2. Settings drawer "Integrations" block gets a new "MQTT bridge" toggle
   (mirrors the existing Bermuda enable/disable toggle) — off by default.
3. Path B (direct broker) as a fallback mode: lazy-`import('mqtt')`, broker
   host/port/tls/user/pass form (secrets → `localStorage` only, per §4.3).
4. A subscription registry keyed by topic so multiple fixtures (N cameras,
   M robots) share one connection instead of opening per-fixture sockets.

**Frigate ground-truth targets:**
5. `src/frigate-geom.ts` — pure homography DLT solver + point-project
   helpers; test page `test-pages/frigate-geom-test.html` (assert round-trip
   on synthetic correspondences, mirroring `geo-test.html`'s style).
6. `CameraFixture.groundHomography?` field + calibration point list;
   sidebar calibration UI (snapshot + click-pairs), reusing entity-picker-
   adjacent patterns.
7. Planner: subscribe to `frigate/events` per camera with a homography set;
   maintain a live map of camera-local tracked targets (label/box/zones),
   analogous to `Planner.bermuda`'s raw-sample bookkeeping.
8. three-view: extend the target-assembly step (wherever `blePeople`/AI
   targets are folded into the frame's target list) to also append
   `TargetWorld.cam` entries; extend `_fuseIdentities`'s candidate gathering
   to include them (optional, can ship without fusion first).
9. 2D: camera-tint dot + badge in `drawTargets`/a small camera-glyph helper.

**Valetudo room overlay:**
10. Extend `RobotFixture` (or a new `Floor.vacuumMaps` companion) with the
    calibration fields it already almost has (`posScale`/`posOffsetX/Y`/
    `posFlipY`/`posRotDeg`) reused for segment pixels, not just the dock
    point.
11. Bridge subscription to `<prefix>/<id>/MapData/map-data` (deflate-decode
    + JSON.parse) and `.../MapData/segments`; cache last-parsed map per robot.
12. New `updateVacuumMap`-style builder (2D fill + 3D `ShapeGeometry` patch),
    own layer toggle, dirty key on map revision hash (not per-frame).
13. `StatusStateAttribute` subscription → active-cleaning glow, sourced from
    Diorama's own last-issued segment-clean command (see open question in
    §2.4) with a graceful "unknown room" fallback.
14. Optional: tap-to-clean action publishing `MapSegmentationCapability/clean/set`.

## 6. Potential additional features

- **Frigate LPR (license plate)** — `recognized_license_plate` on car events
  could label a parked/arriving vehicle target with a plate string (privacy-
  sensitive; make it opt-in and local-only display, never persisted to the
  synced `Store`).
  - **Frigate semantic descriptions** (`frigate/tracked_object_update`) —
  AI-generated one-line descriptions could feed the existing thought-bubble
  system as a new tier ("a person carrying a package" → 📦 bubble).
- **Frigate zones as Diorama presence zones**: since Frigate zone booleans
  ARE already reachable via ordinary HA entities (`binary_sensor` per
  zone×object), a *lighter* feature than the full bridge is to let existing
  `Floor.presenceZones` bind directly to those — no MQTT needed. Worth
  shipping independently/first as a cheap win.
- **Frigate audio events** (`frigate/<camera>/audio/<type>`) — doorbell-style
  transient pulse reusing the existing `TransientPulse` primitive (glass
  break, dog bark, etc., spatially anchored at the camera).
- **Valetudo obstacle/no-go zones and virtual walls** — same MapData
  `entities` array (`type: 'virtual_wall'`/`no_go_area`) could render as
  dashed overlays, reusing the same overlay path as room segments.
- **Valetudo cleaning history heatmap** — accumulate path-layer points over
  time into a "where does the robot actually go" overlay, distinct from the
  live position.
- **Generalized "MQTT sensor" fixture**: once the bridge exists, any
  arbitrary user-chosen MQTT topic (not just Frigate/Valetudo) could drive a
  generic env-sensor-like fixture — turns this from a two-vendor bridge into
  a small platform. Scope carefully; easy to over-build.

## 7. Open questions & risks

- **Admin-gate is a real product decision, not a detail.** `mqtt/subscribe`
  hard-requires `is_admin`. Many households run Diorama on a wall tablet
  under a deliberately restricted HA user. Path A silently fails for that
  user; Path B works but asks the user to hand out broker credentials to a
  browser panel. The doc recommends Path A as default with a clear in-UI
  explanation of *why* a non-admin panel needs Path B, but this is a genuine
  UX fork, not a footnote.
- **Broker credential storage**: Path B's host/port/user/password have no
  good home in the existing storage model. `localStorage`-only (device-
  local, unsynced) is the closest existing precedent (`diorama:token`) but
  means re-entering credentials per device/browser — worse UX than
  everything else in Diorama, which syncs via HA. Explicitly a tradeoff, not
  a solved problem.
- **Valetudo unit ambiguity** (mm vs cm; top-left vs bottom-left origin) is
  unverified from documentation alone — the in-repo code comment
  ("coordinates and size are in cm") conflicts with common community usage
  implying mm-scale maps. **Must be empirically confirmed against a live
  Valetudo instance before shipping** the pixel→mm transform; get it wrong
  and every room polygon is 10× the wrong size or mirrored.
  - **Whether "which segment is being cleaned right now" is independently
  observable** over MQTT, or must be inferred from Diorama's own issued
  commands (§2.4) — if a vendor app or the physical buttons start a job,
  Diorama may have no way to know which room glows. Needs a live-instance
  test.
- **Frigate `detect` resolution drift**: if a user changes camera resolution/
  detect settings after calibrating, every stored homography silently goes
  stale (boxes now reported in a different pixel frame). Needs either a
  resolution fingerprint stored alongside the homography (invalidate +
  prompt recalibration on mismatch) or accept the risk with a "recalibrate
  after changing camera settings" caveat.
- **`provideMapData`/websocket-listener defaults**: whether Valetudo ships
  `provideMapData` on by default, and whether the HA Mosquitto add-on can
  ever be nudged to enable its websocket listener automatically from
  Diorama (it cannot — it's an add-on config file the user edits outside
  Diorama entirely) — both are prerequisites Diorama can detect-and-explain
  but not fix.
  - **Vendor fragmentation**: this doc covers Frigate + Hypfer/Valetudo
  specifically. `rand256/valetudo` (a maintained fork with a different
  history/format lineage) and cloud-only Roborock/Xiaomi (no Valetudo at
  all — no room MQTT data reachable at all, only whatever HA's cloud
  integration attribute set happens to expose) are out of scope; a
  production implementation needs to detect "which flavor" per device and
  degrade gracefully (position-only, no room overlay) rather than assume
  one JSON shape universally.
- **Bandwidth/perf**: `frigate/events` on a busy multi-camera system can be
  a genuinely chatty ~several-Hz stream across many cameras simultaneously —
  treat it like the LIVE `state_changed` path (never trigger `emitConfig`/
  a Lit re-render per message), and consider a per-camera allow-list of
  labels to subscribe rather than blanket-subscribing every camera's events.
- **Security surface**: Path A means any admin-authenticated Diorama session
  can now read/write **arbitrary MQTT topics**, not just Frigate/Valetudo's —
  `mqtt/subscribe` takes any topic string. Scope subscriptions tightly (only
  the topics a specific bound fixture needs) even though the underlying
  permission is broader; don't build a general "topic browser" without
  thinking through what that exposes (irrigation controllers, garage door
  openers, etc. often ride the same broker).

## 8. Sources

- [Frigate — MQTT integration docs](https://docs.frigate.video/integrations/mqtt/)
- [Frigate — `docs/docs/integrations/mqtt.md` (dev branch, GitHub)](https://github.com/blakeblackshear/frigate/blob/dev/docs/docs/integrations/mqtt.md)
- [Frigate — Home Assistant Integration docs](https://docs.frigate.video/integrations/home-assistant/)
- [Frigate — `docs/docs/integrations/home-assistant.md` (dev branch, GitHub)](https://github.com/blakeblackshear/frigate/blob/dev/docs/docs/integrations/home-assistant.md)
- [Frigate — Glossary (box/region definitions)](https://docs.frigate.video/frigate/glossary/)
- [Frigate — Zones configuration docs](https://docs.frigate.video/configuration/zones/)
- [`blakeblackshear/frigate-hass-integration` (GitHub)](https://github.com/blakeblackshear/frigate-hass-integration)
- [Valetudo — MQTT integration docs](https://valetudo.cloud/pages/integrations/mqtt/)
- [Valetudo Home Assistant microsite (map-in-PNG/zTXt explanation)](https://hass.valetudo.cloud/)
- [Hypfer/Valetudo — `ValetudoMap.js` (GitHub, map JSON shape)](https://github.com/Hypfer/Valetudo/blob/master/backend/lib/entities/map/ValetudoMap.js)
- [Hypfer/Valetudo — issue #1530, "Convert ValetudoMaps to 3d/cad/building information formats"](https://github.com/Hypfer/Valetudo/issues/1530)
- [Example ValetudoMap JSON gist (okets)](https://gist.github.com/okets/b2bdf3ba2ab96c27ad58274372298261)
- [Home Assistant core — `homeassistant/components/mqtt/__init__.py` (dev, `mqtt/subscribe` WS command + `mqtt.publish` service)](https://github.com/home-assistant/core/blob/dev/homeassistant/components/mqtt/__init__.py)
- [Home Assistant — WebSocket API developer docs](https://developers.home-assistant.io/docs/api/websocket/)
- [Home Assistant — MQTT integration docs](https://www.home-assistant.io/integrations/mqtt/)
- [Full list of HA WebSocket endpoints (community gist, confirms `mqtt/subscribe` + `mqtt/device/debug_info`)](https://gist.github.com/mhagger/f1cc7844a7736bd5258d953e0a22b398)
- [MQTT.js (GitHub) — browser WebSocket transport](https://github.com/mqttjs/mqtt.js/)
- [EMQX — "How to Use MQTT over WebSocket"](https://www.emqx.com/en/blog/connect-to-mqtt-broker-with-websocket)
- [HA Community — Mosquitto add-on websocket listener config](https://community.home-assistant.io/t/mosquitto-broker-addon-not-listening-on-websocket-ports/518918)
