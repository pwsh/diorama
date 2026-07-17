# DESIGN — Phase 5: direct-MQTT bridge (Frigate ground-truth targets + Valetudo maps)

*Authored 2026-07-17 (Fable). Status: **shipped**.*
*Authoritative research: `docs/research/frigate-mqtt-bridge.md` (§2.5 transport
shapes, §4 design, §5 steps) — this doc pins the deltas and batch split.*

## Pinned decisions (deltas / clarifications on the research doc)

1. **Path B client is hand-rolled, not mqtt.js**: `src/mqtt-ws.ts` — a pure
   MQTT 3.1.1 packet codec (`encodeConnect/Subscribe/Publish/PingReq`,
   `decodePacket` incremental over a byte buffer; QoS 0 ONLY, no persistent
   session, clean-session true) + a small browser client class over native
   `WebSocket` (binary frames, subprotocol `mqtt`). Lazy-chunk it
   (`await import('./mqtt-ws.js')` only when `mode === 'direct'`) — never in
   the startup graph. The codec is pure/deterministic → test page.
2. **Transport abstraction** `src/mqtt-bridge.ts` (weather.ts-style
   isolation): `startBridge(cfg, api, onMessage)` → handle with
   `subscribe(topicFilter)`, `publish(topic, payload)`, `stop()`, `status`
   (connecting/up/error/unauthorized). Path A = new additive
   `HaApi.subscribeMqtt(topic, cb)` (WS `mqtt/subscribe` subscription
   command; BOTH HassClient + HassPanelAdapter) + `publishMqtt` via the
   `mqtt.publish` service; admin-gate errors surface as status
   `'unauthorized'` with a UI hint to use direct mode. Path B = mqtt-ws.
   Topic-filter matching (`+`/`#`) implemented once in the bridge (pure,
   tested) since Path A subscribes per-filter natively but Path B
   subscribes and dispatches locally.
3. **Config**: `Store.mqttBridge?: { mode?: 'off' | 'ha-relay' | 'direct';
   brokerHost?; brokerPort?; useTls?; frigateTopic? ('frigate');
   valetudoNs? ('valetudo') }` — in `_loadFromHa`'s explicit list. Broker
   user/pass in localStorage `diorama:mqtt:user/pass` ONLY. Settings ▸
   Integrations gets the config block + live status pill + a "Test
   connection" button. Offline/LocalApi → bridge inert.
4. **Homography**: `src/homography.ts` (pure, zero imports):
   `solveHomography(pairs: {u,v,x,y}[]): number[] | null` (DLT, h33=1, 8×8
   Gaussian elimination exact at 4 points, normal equations for N>4;
   null on degenerate), `applyHomography(h, u, v): {x,y}`,
   `homographyResidualsMm`. Calibration pairs persist as
   `CameraFixture.camCalib?: {u,v,x,y}[]` (re-solvable; the solved matrix
   is derived, never stored). Calibration UI in the camera sidebar editor:
   snapshot `<img>` (existing snapshot path) + click captures u/v scaled to
   **displayed-image natural size** with an explicit "detect resolution"
   W×H input pair (defaulting to the image natural size; the UI copy warns
   boxes are reported at detect resolution), then an armed plan-click
   (geo-landmark latch idiom) captures x/y. List + delete rows + residual
   readout.
5. **Frigate consumption** (Planner, LIVE-path semantics): subscribe
   `<frigateTopic>/events`; accept `type new/update`, `false_positive`
   false, label allow-list (`person,dog,cat,car` default; per-camera
   override later). Key = `cam_<camera>_<label>_<slot>` (slots 0..2 per
   camera/label; nearest-position successor matching; `end` or 8 s silence
   → release slot → existing despawn fade). Project bbox bottom-center
   through the camera's homography → floor mm → `Planner.camTargets`
   (runtime map feeding a lerp slot per key like BLE). three-view appends
   `TargetWorld` origin `'cam'` targets in GOAL mode (`_advanceBleGoal`
   posture — no wander, no confinement). 2D dot in the camera tint + 📷
   badge. Fusion: cam targets join `_fuseIdentities` as a third candidate
   source ONLY if the change is small/clean; otherwise defer fusion to a
   follow-up (report which).
6. **Valetudo consumption**: subscribe `<valetudoNs>/+/MapData/map-data`
   (and `.../StatusStateAttribute/value` + `/flag`). Payload: deflated JSON
   → native `DecompressionStream('deflate')` (async, try/catch; also accept
   raw JSON for older senders). Parse ONCE per map revision: segments →
   filled rasters at `pixelSize`, transformed by the OWNING RobotFixture's
   existing posScale/posOffsetX/Y/posFlipY/posRotDeg calibration (robot
   matched by `RobotFixture.valetudoId?` — new optional field, the topic's
   identifier segment). Render: per-segment translucent colored patches +
   name labels, 2D + 3D (groundAreas idiom), under a NEW `vacuumMap` layer
   key (default OFF — diagnostic overlay), dirty key `_keyVacMap`.
   Cleaning glow: `value==='cleaning' && flag==='segment'` → glow the
   segment ids Diorama last commanded (command history), else all-segment
   soft glow. Tap a segment (2D + 3D raycast) →
   `MapSegmentationCapability/clean/set` publish with confirm().
7. **Perf/robustness**: all inbound handling try/catch + rate-tolerant
   (events ~= radar cadence; map data rare); no emitConfig per detection
   (targets ride the live/RAF path); bridge reconnects with backoff
   (2→30 s); everything null-safe when unconfigured.

## Batches

- **M-A (bridge core)**: mqtt-ws.ts codec+client, mqtt-bridge.ts,
  HaApi.subscribeMqtt/publishMqtt in both clients (+ LocalApi inert),
  Store.mqttBridge + _loadFromHa, localStorage creds, Settings ▸
  Integrations UI + status + test button, topic-filter matcher.
  Tests: `mqtt-codec-test.html` (pure packet matrix incl. roundtrips,
  malformed-frame tolerance, topic-filter matrix), `mqtt-bridge-test.html`
  (fake HaApi relay path; fake WebSocket direct path; status transitions;
  unauthorized surfacing).
- **M-B (Frigate)** after A: homography.ts + camCalib + calibration UI +
  event consumption + cam targets + 2D badge (+ fusion if clean).
  Tests: `homography-test.html` (exact 4-pt, overdetermined, degenerate,
  residuals), `frigate-target-test.html` (synthetic event stream → target
  lifecycle: spawn/update/handoff/end-fade; projection correctness).
- **M-C (Valetudo)** after A, parallel with B: MapData parse + overlay +
  layer + glow + tap-to-clean publish + `RobotFixture.valetudoId`.
  Tests: `valetudo-map-test.html` (fixture MapData JSON (uncompressed path)
  → segment patches with correct transform; glow gating; publish payload).

Ship the whole phase as one batch at the end. Gotchas: Store.mqttBridge in
`_loadFromHa`; secrets never in the store; `mqtt/subscribe` unsubscribing on
reconfigure (HA returns an unsubscribe handle — keep it); DecompressionStream
needs a fallback error path (not supported → parse-as-plain-JSON attempt then
give up quietly); detect-resolution pitfall surfaced in UI copy; camera
snapshot CORS is same-origin in panel mode (fine) but may fail standalone —
degrade gracefully.
