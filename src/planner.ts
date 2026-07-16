import { HassClient, type HaApi } from './ha-client.js';
import { SensorDiscovery } from './sensor-discovery.js';
import { loadStore, saveStore, newId, repairFloor } from './storage.js';
import { slugToName, normMac, localToWorld, segCrossesSolidWall, mowerSweepWaypoints,
         ROBOT_DEFAULTS, robotLedColor, parseVacuumPosition, vacuumRawToWorld,
         vacuumRawHeadingRad, isStairsKind } from './geometry.js';
import { stepFusion, newFusionState, DEFAULT_FUSION_CFG,
         type FusionState, type FusionCand } from './fusion.js';
import { fitGeoTransform, latLonToPlan, clampToBoundary, planBearingDeg, compass8, medianLatLon,
         type GeoTransform, type GeoPair, type LatLonSample } from './geo.js';
import type { GeoConfig, GeoLandmark, DioramaPerson, RobotFixture } from './types.js';

// ── Bermuda BLE discovery (runtime-only) ──────────────────────────────────
// One per-scanner distance sensor for a tracked device. `disabled` reflects
// the smoothed range entity's registry disabled_by (per-scanner sensors are
// disabled by default in Bermuda).
export interface BermudaScannerLink {
  scannerMac: string;         // normalized (bare hex) scanner MAC from the unique_id
  rangeEntityId: string | null;     // number/sensor smoothed `Distance to <scanner>`
  rangeRawEntityId: string | null;  // `Unfiltered Distance to <scanner>`
  disabled: boolean;          // smoothed range entity disabled in the registry
  proxyId: string | null;     // matched BleProxy fixture id (via device connections), else null
}

// A Bermuda tracked BLE device (a config-flow-selected device / iBeacon / IRK).
export interface BermudaDevice {
  deviceId: string | null;    // HA device id (registry) — the bind target for a person
  mac: string;                // best-effort device MAC (normalized) from the unique_ids
  name: string;               // friendly name (device registry, else entity original_name)
  scanners: BermudaScannerLink[];
  disabledCount: number;      // per-scanner smoothed range entities still disabled
}

export interface BermudaDiscovery {
  devices: BermudaDevice[];
  scannedAt: number;
}
import type {
  Store, Floor, Sensor, ZonesLive, ObjectHalo, LerpSlot,
  HassState, ConnStatus, DiscoveredDevice, Vec2, AvatarKind, WeatherConfig, CameraFixture,
} from './types.js';

// How long a camera alert lingers (snapshot card + FOV pulse) after its
// alertEntity flips back off. See Planner.cameraAlerting.
const CAMERA_ALERT_LINGER_MS = 6000;
import { solvePosition, type ProxyObs } from './trilateration.js';
import {
  fetchOpenMeteo, geocodeZip, resolveWeatherEntity, deriveFromSensors,
  toCelsius, toKmh, toMmPerH, forecastRainSoon,
  type WeatherNow, type HaCondition,
} from './weather.js';
import { isDay } from './time-of-day.js';
import {
  setAvatarPacksConfig, registerPack, getPack, unregisterPack,
  type AvatarPackConfig, type AvatarPacksConfig,
} from './avatars.js';
import { AVATAR_PACK_MANIFEST } from './avatar-packs/manifest.js';
import {
  loadAllPacks, savePackJson, deletePackJson, validatePackJson,
} from './avatar-store.js';

// ── BLE trilateration output (runtime-only) ───────────────────────────────
// One resolved BLE person/pet position for rendering. Not persisted — recomputed
// from Bermuda samples + placed proxies on every solve. See Planner.blePeople.
export interface BlePerson {
  key: string;                 // synthetic target key: `ble_<deviceKey>`
  personId?: string;           // matched Store.people id, else undefined (unknown device)
  name: string;
  color: string;               // hex tint
  avatarKind?: AvatarKind;     // person's chosen rig (undefined → fallback pool)
  isPet?: boolean;
  x: number; y: number;        // smoothed (lerped) solve position, world mm
  floorId: string;             // floor whose proxies won the solve
  confidenceMm: number;        // uncertainty radius (2D confidence circle)
  updatedAt: number;           // ms epoch of the last successful solve
  stale: boolean;              // no fresh samples within the staleness window
}

// One committed identity fusion for rendering (Feature B, phase B3). A live
// mmWave radar target (keyed `<sensorId>_<i>`) has adopted a BLE person's
// identity. Runtime-only — never persisted; recomputed by _fuseIdentities.
export interface Fusion {
  personId?: string;           // matched Store.people id (undefined = unknown device)
  name: string;
  color: string;               // person tint
  avatarKind?: AvatarKind;
  isPet?: boolean;
  since: number;               // ms epoch the fusion first committed
}

// A stored per-device solve result (world mm) before lerp smoothing.
interface BleSolve {
  x: number; y: number; floorId: string; confidenceMm: number; updatedAt: number;
}

// A committed cross-floor transit for an identified BLE person (Tier 2 stair
// portals). Runtime-only — NEVER persisted; recomputed by _watchFloorTransits on
// each BLE solve. Keyed in Planner.floorTransits by the person's Store.people id.
// `viaLinkId` is set only when a stairs-family piece carrying that same
// stairLinkId exists on BOTH the from- and to-floor (drives the arriving/leaving
// rig handoff); undefined = a plain pop/fade transition. Pruned after ~30 s.
export interface FloorTransit {
  fromFloorId: string;
  toFloorId: string;
  viaLinkId?: string;
  at: number;                  // ms epoch the transit committed
}

// One resolved GPS device pin for rendering (Feature G, phase G2). Recomputed
// from Store.people GPS sources + the geo transform on demand (getter) — not
// persisted. Positions are world mm on the CURRENT floor's plan; `zone` decides
// how a view draws it. See Planner.gpsPins.
export type GpsZone = 'indoor' | 'yard' | 'beyond';
export interface GpsPin {
  key: string;                 // synthetic key: `gps_<personId>`
  personId: string;
  name: string;
  color: string;               // hex tint (person color, else a default)
  isPet: boolean;
  x: number; y: number;        // TRUE world-mm position (unclamped)
  accuracyMm: number;          // gps_accuracy → mm (0 when absent)
  lastUpdated: number;         // ms epoch of the source entity's last_updated (0 = unknown)
  stale: boolean;              // last_updated older than the staleness window
  zone: GpsZone;               // indoor (inside floor rect) | yard (within boundary) | beyond
  clampedX: number; clampedY: number;  // render position (== x,y unless beyond → boundary edge)
  bearingDeg: number;          // true compass bearing (0..360) from floor centre to the true pos
  distanceM: number;           // plan distance (m) from floor centre to the true pos
}

// One resolved geo_location event pin for rendering (roadmap #9). geo_location.*
// entities (USGS/GeoNet quakes, NSW/Qld fires, GDACS) each carry lat/lon + a
// `source` + a state that is the distance-from-home (km). Projected through the
// SAME geo transform as GPS pins and classified/clamped identically. Runtime-only
// (nothing persisted) — see Planner.geoEventPins.
export interface GeoEventPin {
  key: string;                 // entity id
  name: string;                // friendly_name or entity-id tail
  source: string;              // attributes.source (e.g. 'usgs_earthquakes_feed')
  category: 'quake' | 'fire' | 'other';  // derived from source substring → marker color
  x: number; y: number;        // TRUE world-mm position (unclamped)
  clampedX: number; clampedY: number;    // render position (== x,y unless beyond → boundary edge)
  zone: GpsZone;               // indoor | yard | beyond
  bearingDeg: number;          // true compass bearing (0..360) from floor centre
  distanceKm: number;          // the entity state (distance from home, km)
  magnitude: number | null;    // attributes.magnitude (earthquakes) → label prefix
  label: string;               // e.g. 'M4.2 · 12 km NW' (composed once)
}

// Drag state covers every interaction kind. Only active during a mousedown→up.
export type Drag =
  | { kind: 'sensor'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'rotate'; sensorId: string }
  | { kind: 'wallv'; wallId: string; idx: number; startMm: Vec2; startPts: Vec2[] }
  | { kind: 'wallMove'; wallId: string; startMm: Vec2; startPts: Vec2[] }
  | { kind: 'furnMove'; idx: number; startMm: Vec2; start: Vec2 }
  | { kind: 'furnCorner'; idx: number; anchor: Vec2 }
  | { kind: 'fixture'; fxKind: 'light' | 'switch'; idx: number; startMm: Vec2; start: Vec2 }
  | { kind: 'obj'; oi: number; startMm: Vec2; startObj: Vec2 }
  | { kind: 'objR'; oi: number; startMm: Vec2; startR: number }
  | { kind: 'vert'; prefix: 'iz' | 'fz'; zi: number; vi: number; startMm: Vec2; startVerts: Vec2[] }
  | { kind: 'zonemove'; prefix: 'iz' | 'fz'; zi: number; startMm: Vec2; startVerts: Vec2[] }
  | { kind: 'bgMove'; startMm: Vec2; start: Vec2 }
  | { kind: 'bgCorner'; sx: number; sy: number; startBg: { x: number; y: number; w: number; h: number; rotation: number } }
  | { kind: 'motion'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'motionRotate'; id: string }
  | { kind: 'ble'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'alarm'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'safety'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'robot'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'camera'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'cameraRotate'; id: string }
  | { kind: 'pzoneVert'; id: string; idx: number; startMm: Vec2; startPts: Vec2[] }
  | { kind: 'groundVert'; id: string; idx: number; startMm: Vec2; startPts: Vec2[] }
  | { kind: 'voidVert'; id: string; idx: number; startMm: Vec2; startPts: Vec2[] }
  | { kind: 'env'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'envResize'; id: string; startDist: number; startScale: number }
  | { kind: 'doorMove'; idx: number; startMm: Vec2; start: Vec2 }
  | { kind: 'doorLock'; idx: number }
  | { kind: 'doorRotate'; idx: number; startMm: Vec2; start: { rotation: number } }
  | { kind: 'windowMove'; idx: number; startMm: Vec2; start: Vec2 }
  | { kind: 'windowRotate'; idx: number; startMm: Vec2; start: { rotation: number } }
  // Dragging a floor boundary edge. Input is measured in FROZEN start-of-drag
  // screen space (startClient + startScale) so resizing the floor — which
  // rescales the fit-to-canvas view — can't feed back into the cursor→world
  // mapping. `startBbox` is the content bbox at drag start (clamp reference);
  // `applied` is the content translation already applied this gesture.
  | { kind: 'floorEdge'; edge: import('./geometry.js').FloorEdge;
      startClient: Vec2; startScale: number;
      startW: number; startD: number;
      startBbox: import('./geometry.js').FloorBox | null; applied: Vec2 };

export interface EditZone {
  sensorId: string;
  prefix: 'iz' | 'fz';
  zi: number;
  verts: Vec2[];        // sensor-local mm
  mousePos: Vec2 | null;
}

export type Tool = 'select' | 'wall' | 'sensor' | 'motion' | 'env' | 'bleproxy' | 'alarm' | 'safety' | 'robot' | 'camera' | 'pzone' | 'ground' | 'void' | 'furniture' | 'light' | 'switch' | 'door' | 'window' | 'delete';

// Live robot state (runtime-only). `x/y/heading/phase/activity/led` are the
// DISPLAY fields both canvases read; the rest are the movement controller's
// bookkeeping. See Planner.stepRobots.
export interface RobotState {
  x: number; y: number;       // live plan position (world mm)
  heading: number;            // radians; body-forward direction (renderer −Z aligns to this)
  phase: number;              // animation phase (spin/bob/LED)
  activity: string;           // resolved: cleaning/mowing/returning/docked/idle/paused/error
  led: string;                // resolved LED color hex
  goalX: number; goalY: number;
  demoPhase: 'run' | 'return' | 'dock';   // unbound autonomous cycle
  demoTimer: number;          // seconds remaining in the current demo phase
  wpIdx: number;              // mower sweep-waypoint cursor
  wpDir: 1 | -1;              // mower sweep direction (ping-pong)
  ellipseAng: number;         // mower fallback ellipse-orbit angle
  goalTimer: number;          // vacuum goal re-pick countdown
}

// Sentinel for Planner.placingRoomId meaning "create a new room at the next
// canvas click" (vs an existing room id = re-place that room's anchor).
export const NEW_ROOM = '__new_room__';

// Sentinel for Planner.placingLandmarkId meaning "create a new geo landmark at
// the next canvas click" (vs an existing landmark id = re-place that pin).
export const NEW_LANDMARK = '__new_landmark__';

// Active geo-calibration session (runtime only). Records the sampling window
// and a live sample counter; the median is pulled from recorder history at
// Finish so the panel need not stay open at the landmark.
export interface GeoCalibSession {
  landmarkId: string;
  trackerId: string;      // device_tracker.* being sampled
  startedAt: string;      // ISO — window start
  notifySlug: string;     // notify.mobile_app_<slug> for high-accuracy commands ('' = none)
  // Live accounting, bumped on every tracker state_changed with lat/lon while the
  // panel is open. seen = used + exclAccuracy + exclSource (buckets are exclusive).
  seen: number;           // fixes with lat/lon observed
  used: number;           // passed the filters (accuracy gate + source_type)
  exclAccuracy: number;   // dropped: gps_accuracy > gate
  exclSource: number;     // dropped: source_type present and !== 'gps'
  lastSeenAt: string | null; // ISO of the last fix with lat/lon (used OR excluded)
  // Repeated `request_location_update` notify pump (works on iOS + Android).
  reqTimer: ReturnType<typeof setInterval> | null;
}

// Result of finishGeoCalibration — surfaced to the sidebar.
export interface GeoCalibResult {
  ok: boolean;
  message: string;
  count: number;          // usable samples the median was taken over
}

// Single-source-of-truth Planner. Lit components subscribe via addEventListener.
export class Planner extends EventTarget {
  store: Store;
  hass: HaApi | null = null;
  disc = new SensorDiscovery();

  // Per-bound-sensor live state, keyed by sensor.id
  discBy: Record<string, DiscoveredDevice> = {};
  zonesBy: Record<string, ZonesLive> = {};
  objectsBy: Record<string, ObjectHalo[]> = {};
  lerpBy: Record<string, LerpSlot[]> = {};
  objWritePending: Record<string, boolean[]> = {};
  objWriteTimer: Record<string, (ReturnType<typeof setTimeout> | null)[]> = {};
  izExpanded: Record<string, Set<number>> = {};
  fzExpanded: Record<string, Set<number>> = {};
  editObject: Record<string, number> = {};
  drawingWall: { points: Vec2[]; id?: string } | null = null;

  // Interaction state. The last view is remembered PER DEVICE in localStorage
  // (not the HA store — different tablets want different views). A ?view= URL
  // param still wins: app._applyUrlParams sets `view` directly after construction
  // without persisting, so an explicit link doesn't clobber the saved default.
  view: '2d' | '3d' = (() => {
    try {
      const v = localStorage.getItem('diorama:view');
      if (v === '2d' || v === '3d') return v;
    } catch { /* private-mode Safari throws */ }
    return '2d';
  })();
  tool: Tool = 'select';
  cursor: Vec2 | null = null;
  drag: Drag | null = null;
  dragJustEnded = false;
  editZone: EditZone | null = null;
  // Smart alignment guides (Feature C). Runtime only — never persisted.
  // `alignGuides` are the active guide lines drawn while moving a placeable;
  // `alignCandidates` are peer centers snapshotted once at drag start.
  alignGuides: { axis: 'x' | 'y'; mm: number }[] = [];
  alignCandidates: { x: number; y: number }[] = [];

  conn: ConnStatus | 'connecting' = 'connecting';
  showDetails: boolean;
  useRawTargets: boolean;
  lastDevices: string[] = [];

  // Active motion sensor (for selection / rotate-handle visibility on canvas)
  activeMotionId: string | null = null;

  // Active environmental sensor (sidebar selection / canvas highlight)
  activeEnvId: string | null = null;

  // Active BLE proxy fixture (sidebar selection / canvas highlight)
  activeBleId: string | null = null;

  // Active alarm keypad fixture (sidebar selection / canvas highlight)
  activeAlarmId: string | null = null;

  // Active smoke / CO detector fixture (sidebar selection / canvas highlight)
  activeSafetyId: string | null = null;

  // Active robot fixture (sidebar selection / canvas highlight)
  activeRobotId: string | null = null;

  // Active camera fixture (sidebar selection / canvas highlight)
  activeCameraId: string | null = null;

  // Active presence zone (sidebar selection / canvas vertex-edit highlight)
  activePZoneId: string | null = null;

  // Presence-zone draw latch (same pattern as drawingWall): while the pzone tool
  // is armed, each canvas click appends a world-mm vertex; double-click finishes
  // (≥3 pts). Runtime-only. `id` is set when re-drawing an existing zone.
  drawingPresenceZone: { points: Vec2[]; id?: string } | null = null;

  // Ground / yard covering area (the "yard" arc). Mirrors the presence-zone
  // polygon flow exactly (parallel field, same latch idiom).
  activeGroundAreaId: string | null = null;
  drawingGroundArea: { points: Vec2[]; id?: string } | null = null;

  // Floor void / opening area (Tier-1 floor voids). Mirrors the presence-zone
  // polygon flow exactly (parallel field, same latch idiom).
  activeVoidAreaId: string | null = null;
  drawingVoidArea: { points: Vec2[]; id?: string } | null = null;

  // Live robot positions (runtime-only, advanced by stepRobots from the 2D RAF —
  // like stepLerp). BOTH the 2D canvas and the 3D renderer read this, so the
  // robot moves consistently whether or not the 3D view was ever opened. See
  // RobotState / stepRobots below.
  robotStates: Record<string, RobotState> = {};
  // Cached mower sweep waypoints, keyed by floor id + configRev (walls change).
  private _robotWpCache: { key: string; wps: Vec2[] } | null = null;

  // Active person (sidebar People list expansion). Runtime only.
  activePersonId: string | null = null;

  // Bermuda discovery result (runtime-only; scanned on demand via scanBermuda).
  bermuda: BermudaDiscovery | null = null;

  // ── BLE trilateration (runtime-only) ──────────────────────────────────
  // Latest distance sample per (deviceKey × scannerMac): mm + arrival time.
  // Populated on the LIVE path from state_changed (never slow/config).
  private bleSamples: Record<string, Record<string, { mm: number; at: number }>> = {};
  // Reverse map entityId → {deviceKey, scannerMac}, rebuilt from `bermuda`.
  private bleEntityMap: Record<string, { deviceKey: string; scannerMac: string }> = {};
  // Latest solved position per deviceKey (pre-lerp), keyed for hold/staleness.
  private bleSolves: Record<string, BleSolve> = {};
  // Best-effort deviceKey → friendly name / HA device id, from the last scan.
  private bleDeviceInfo: Record<string, { name: string; deviceId: string | null }> = {};
  private _bleAutoScanned = false;
  // Staleness / retirement windows (ms). A sample older than STALE is dropped
  // from the solve; a device unheard-from for RETIRE stops rendering entirely.
  private static readonly BLE_STALE_MS = 30_000;
  private static readonly BLE_RETIRE_MS = 120_000;

  // ── Battery-badge sibling resolution (runtime-only, from the entity registry) ──
  // HA's own frontend convention: a low-battery warning comes from a SIBLING
  // sensor with device_class 'battery' on the SAME HA device. We mirror that —
  // resolve a bound fixture's entity → its device → a battery sensor on that
  // device. Registry fetch is async, so batteryFor() no-ops until it lands.
  private _batteryRegLoaded = false;
  private _entityToDevice: Record<string, string> = {};        // entity_id → device_id
  private _deviceSensors: Record<string, string[]> = {};       // device_id → sensor.* entity ids on it
  private _entityDeviceClass: Record<string, string> = {};     // entity_id → registry original_device_class
  // Cached RESOLUTION so per-frame batteryFor() calls are cheap map hits:
  // bound entity id → battery sensor entity id, or null when the device has no
  // battery sibling. `undefined` (absent) = not resolved yet (retry next call).
  private _batteryResolve: Record<string, string | null> = {};

  // ── Identity fusion (runtime-only, phase B3) ──────────────────────────────
  // The matcher's persistent state (pending + committed pairs) plus its rendered
  // output. `fusions` maps a radar targetKey → the adopted person; `fusedPersonIds`
  // is the set of BLE person join-keys (BlePerson.key — a stable per-device key
  // that also covers unknown devices with no Store.people id) currently fused, so
  // `bleUnfused` can hide their ghost rigs. Recomputed by _fuseIdentities on each
  // BLE solve + a ~2 s timer (both no-ops when no BLE people exist).
  private _fusionState: FusionState = newFusionState();
  fusions: Record<string, Fusion> = {};
  fusedPersonIds: Set<string> = new Set();
  private _fusionSince: Record<string, number> = {};   // targetKey → commit epoch
  private _lastFuseAt = 0;
  private _fusionTimer: ReturnType<typeof setInterval> | null = null;
  private static readonly FUSION_TICK_MS = 2000;

  // ── Cross-floor transits (Tier 2 stair portals, runtime-only) ─────────────
  // When an identified BLE person's solved floor CHANGES, we don't trust a
  // single solve (a bad multilateration can flick to an adjacent floor). The new
  // floor must be held with fusion-style hysteresis — ≥ TRANSIT_MIN_SOLVES
  // consecutive solves agreeing AND ≥ TRANSIT_HOLD_MS since the flip first
  // appeared — before a transit commits into `floorTransits` (keyed by
  // Store.people id). Committed records prune after TRANSIT_PRUNE_MS. Unknown
  // devices (no person) never transit. Never persisted.
  floorTransits: Record<string, FloorTransit> = {};
  // Per-person hysteresis tracking: the ESTABLISHED floor + a pending candidate.
  private _transitTrack: Record<string, {
    floorId: string; candFloorId: string | null; candSince: number; candCount: number;
  }> = {};
  private static readonly TRANSIT_MIN_SOLVES = 2;
  private static readonly TRANSIT_HOLD_MS = 4000;
  private static readonly TRANSIT_PRUNE_MS = 30_000;
  // GPS pin staleness: a device_tracker / person fix older than this reads as
  // stale (dimmed + age caption). GPS pushes are minutes apart, so 15 min.
  private static readonly GPS_STALE_MS = 15 * 60 * 1000;

  // ── Weather (runtime-only; recomputed from the configured source) ─────────
  // Normalized current weather. Chip + (later) 3D effects read this. Local
  // sources (entity/sensors) recompute from state_changed; Open-Meteo polls.
  weatherNow: WeatherNow | null = null;
  private _weatherTimer: ReturnType<typeof setInterval> | null = null;
  private _weatherInited = false;
  private _weatherGeocoding = false;
  private _weatherFetching = false;
  private _weatherOkAt = 0;     // ms epoch of the last successful Open-Meteo fetch
  private static readonly WEATHER_POLL_MS = 15 * 60 * 1000;
  private static readonly WEATHER_STALE_MS = 45 * 60 * 1000;
  // Forecast plumbing (entity source only — Open-Meteo carries its forecast in
  // the same fetch). weather.get_forecasts (HA 2024.4+) replaces the removed
  // `forecast` state attribute. Refreshed every 30 min + on reconfigure; the
  // derived bits are re-applied over weatherNow after each local recompute (which
  // rebuilds weatherNow from scratch). Undefined = not fetched yet / unsupported.
  private _weatherFcTimer: ReturnType<typeof setInterval> | null = null;
  private static readonly WEATHER_FC_MS = 30 * 60 * 1000;
  private _fcCond: HaCondition | null | undefined;
  private _fcRainSoon: boolean | undefined;

  // Active furniture piece (last grabbed/dropped) — drives the 2D front-arrow
  // chevron. Runtime only.
  activeFurnitureId: string | null = null;

  // UI mode. Runtime + URL-driven, never persisted.
  //   edit  — full editor (default)
  //   kiosk — views + device interaction only; nothing editable, nothing saved
  //   view  — pure visualization; no device interaction either
  uiMode: 'edit' | 'kiosk' | 'view' = 'edit';
  // ?lock=1 hides the mode switcher (wall tablets).
  uiModeLocked = false;
  // Parsed ?floor/?layers/?view3d/?cam template args (applied by app/three-view
  // with fallback to defaults when the named things no longer exist).
  urlTemplate: { floor?: string; layers?: string; view3d?: string; cam?: number[] } = {};
  // Live 3D camera pose (scene coords), updated by three-view each tick so
  // the topbar can mint kiosk links that reproduce the current view.
  lastCam3d: { pos: [number, number, number]; target: [number, number, number] } | null = null;

  // Doorbell transient rings (World-Outside transient-pulse primitive). Pushed on
  // the LIVE path when a bound Door.doorbellEntity's state STRING changes (event
  // timestamp bump / binary off→on / button press). Pruned > 8 s, capped at 8.
  // `_doorbellPrev` seeds silently on first observation (the _trigPrevOn idiom) so
  // reconnecting never fires a phantom ring. `at` is Date.now() ms.
  doorbellRings: { doorId: string; at: number }[] = [];
  private _doorbellPrev: Record<string, string> = {};

  // Camera alert linger (#10 extension): the last time each current-floor camera's
  // alertEntity was seen 'on' (Date.now() ms). `cameraAlerting(cam)` returns true
  // while the sensor is on OR within CAMERA_ALERT_LINGER_MS of the last on-time,
  // so the FOV-wedge pulse + snapshot card stay up briefly after the sensor clears.
  private _camAlertLastOn: Record<string, number> = {};

  setUiMode(m: 'edit' | 'kiosk' | 'view'): void {
    this.uiMode = m;
    if (m !== 'edit') {
      // Leave no edit affordances dangling.
      this.drag = null; this.editZone = null; this.drawingWall = null;
      this.drawingPresenceZone = null; this.drawingGroundArea = null; this.drawingVoidArea = null;
      this.tool = 'select'; this.placingRoomId = null; this.placingLandmarkId = null;
      this.alignGuides = []; this.alignCandidates = [];
      // A disabled floor is hidden from the kiosk/view picker — don't strand the
      // view on one. Jump to the first enabled floor (if any exists).
      const cur = this.store.floors.find(f => f.id === this.store.currentFloorId);
      if (cur?.disabled) {
        const enabled = this.store.floors.filter(f => !f.disabled);
        if (enabled.length) this.switchFloor(enabled[0].id);
      }
    }
    this.emitConfig();
  }

  // Which furniture kind the next drop should create. Runtime only.
  pendingFurnitureKind: import('./types.js').FurnitureKind = 'block';

  // When set, the next furniture drop creates an instance of this custom
  // object recipe (kind stays 'block' as the fallback). Runtime only.
  pendingCustomObjectId: string | null = null;

  // Which wall kind the next drawn wall gets. Runtime only.
  pendingWallKind: import('./types.js').WallKind = 'full';

  // Room placement latch: when set, the next 2D canvas click sets a room's
  // anchor. Holds the room id being re-placed, or NEW_ROOM to create a fresh
  // room at the click point. Runtime + edit-only, never persisted.
  placingRoomId: string | null = null;

  // Geo-landmark placement latch (same pattern as placingRoomId): the next 2D
  // click places a landmark pin. NEW_LANDMARK = create fresh; else re-place the
  // held landmark id. Runtime + edit-only, never persisted.
  placingLandmarkId: string | null = null;

  // Active geo-calibration session (runtime only; see GeoCalibSession).
  geoCalib: GeoCalibSession | null = null;

  // Sidebar visibility. Persisted locally (not in HA store — it's a
  // per-device preference). Defaults open on wide screens, closed on phones.
  sidebarOpen: boolean = (() => {
    try {
      const saved = localStorage.getItem('diorama:sidebarOpen');
      if (saved !== null) return saved === '1';
    } catch { /* ignore */ }
    return typeof window === 'undefined' || window.innerWidth > 900;
  })();

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    try { localStorage.setItem('diorama:sidebarOpen', this.sidebarOpen ? '1' : '0'); } catch { /* ignore */ }
    this.emitConfig();
  }

  // When a placement latch (room / geo landmark) is armed from the sidebar on a
  // narrow (overlay) screen, auto-close the sidebar so the FIRST canvas tap
  // lands on the map rather than the dimmed backdrop. 900 px matches the
  // overlay breakpoint in styles.ts.
  maybeCloseSidebarForPlacement(): void {
    if (this.sidebarOpen && typeof window !== 'undefined' && window.innerWidth <= 900) {
      this.toggleSidebar();
    }
  }

  // 2D view pan/zoom — runtime only, reset on reload.
  // viewCenter is the world-mm point shown at canvas center; zoom is the
  // multiplier on top of fit-to-canvas scale.
  viewCenter: { x: number; y: number } | null = null; // null = auto-fit center
  zoom = 1;

  private _lastDevKey: string | null = null;
  private _initialSyncDone = false;
  private _retrySyncTimers: ReturnType<typeof setTimeout>[] = [];
  // HA-side JSON storage state (frontend/user_data).
  private static readonly HA_STORE_KEY = 'diorama';
  private _haStoreLoaded = false;
  private _haSaveTimer: ReturnType<typeof setTimeout> | null = null;
  // Suppress save-back to HA when we're applying a freshly-loaded HA payload.
  private _suppressHaSave = false;

  constructor() {
    super();
    this.store = loadStore();
    this.showDetails = this.store.showDetails === true;
    this.useRawTargets = this.store.useRawTargets === true;
    // Seed the avatar-pack registry config from the (cached) store so the very
    // first render resolves pool/active membership correctly.
    setAvatarPacksConfig(this.store.avatarPacks);
  }

  // ── Persistence ─────────────────────────────────────────────────────────
  floor(): Floor {
    return this.store.floors.find(f => f.id === this.store.currentFloorId) || this.store.floors[0];
  }
  activeSensor(): Sensor | null {
    if (!this.store.activeSensorId) return null;
    return this.floor().sensors.find(s => s.id === this.store.activeSensorId) || null;
  }
  save(): void {
    // Kiosk / view-only modes never persist anything — a wall tablet must
    // not write its runtime view tweaks (or anything else) back to HA or
    // even its own localStorage cache.
    if (this.uiMode !== 'edit') return;
    // Local cache is always written immediately so it survives reload.
    saveStore(this.store);
    // HA is the source of truth: debounce a push so rapid edits (drag, slider)
    // don't hammer the WS. Skip while applying an HA payload to avoid a save
    // loop right after fetching.
    if (this._suppressHaSave) return;
    if (this._haSaveTimer) clearTimeout(this._haSaveTimer);
    this._haSaveTimer = setTimeout(() => {
      this._haSaveTimer = null;
      if (!this.hass) return;
      this.hass.setUserData(Planner.HA_STORE_KEY, this.store).catch(err => {
        console.warn('HA storage save failed (kept local cache):', err);
      });
    }, 600);
  }

  // ── Eventing ────────────────────────────────────────────────────────────
  // 'live' = ~10 Hz HA updates + lerp; canvas listens
  // 'config' = structural / slow entity changes; sidebar listens
  // Monotonic config revision. Cheap dirty-key source for renderers that
  // want to rebuild only when structural state changed (3D scene graph).
  configRev = 0;

  emitLive(): void { this.dispatchEvent(new CustomEvent('live')); }
  emitConfig(): void { this.configRev++; this.dispatchEvent(new CustomEvent('config')); }
  emitConn(): void { this.dispatchEvent(new CustomEvent('conn')); }

  // ── HA connection ───────────────────────────────────────────────────────
  // Standalone (iframe) mode: own WS + long-lived token.
  connect(url: string, token: string): void {
    this.connectWith(new HassClient(url, token));
  }

  // Shared wiring for both modes. Native panel mode passes a
  // HassPanelAdapter riding HA frontend's authenticated connection.
  connectWith(api: HaApi): void {
    this.hass = api;
    this.hass.onConn(s => { this.conn = s; this.emitConn(); });
    this.hass.onState((states, changedId) => this._onStates(states, changedId));
    this.hass.connect();
    // Hydrate loaded avatar packs (dynamic-import bodies). _loadFromHa also
    // calls this once the authoritative config arrives; both are idempotent.
    void this._hydrateAvatarPacks();
    // Identity fusion re-runs on a light ~2 s cadence (between the ~0.1 Hz BLE
    // solves) so a radar target that walks toward / away from a settled BLE
    // person still fuses / releases promptly against the LERPED positions.
    // Cheap no-op when there are no BLE people (guarded inside _fuseIdentities).
    if (!this._fusionTimer && typeof setInterval !== 'undefined') {
      this._fusionTimer = setInterval(() => {
        if (Object.keys(this.bleSolves).length) this._fuseIdentities();
      }, Planner.FUSION_TICK_MS);
    }
    // Auto-poll when the tab regains focus. WS state_changed events can be
    // missed while the page is backgrounded (browsers throttle WS on hidden
    // tabs); a fresh get_states resyncs everything cheaply.
    if (typeof document !== 'undefined' && !this._visListenerBound) {
      this._visListenerBound = true;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.hass) {
          this.hass.refreshStates().catch(err =>
            console.warn('visibility refreshStates failed:', err));
        }
      });
    }
  }

  // ── Avatar packs ──────────────────────────────────────────────────────────
  // Dynamic-import + register every built-in pack whose effective config says
  // loaded (respecting pack defaults). Pack BODIES are code-split — never static
  // imports — so the startup bundle stays lean. Emits config ONCE at the end so
  // grids / dirty keys refresh. Idempotent (registerPack is a no-op at the same
  // id+version; dynamic import is cached).
  private async _hydrateAvatarPacks(): Promise<void> {
    const cfg = this.store.avatarPacks;
    let changed = false;
    for (const row of AVATAR_PACK_MANIFEST) {
      const c = cfg?.[row.id];
      const defaultLoaded = !row.franchise;   // base packs default loaded; franchise opt-in
      const loaded = c?.loaded ?? defaultLoaded;
      if (!loaded || getPack(row.id)) continue;
      try {
        const mod = await row.load();
        const def = mod.default ?? mod.pack;
        if (def) { registerPack(def, 'builtin'); changed = true; }
      } catch (err) {
        console.warn(`avatar pack "${row.id}" failed to load:`, err);
      }
    }
    // User-imported packs live in IndexedDB (device-local). Register ALL of them
    // so they stay visible / removable in the pack manager even when unloaded —
    // the per-pack config gates loaded/active, so registering an unloaded user
    // pack never activates its members.
    try {
      for (const { id, json } of await loadAllPacks()) {
        if (getPack(id)) continue;
        let parsed: unknown;
        try { parsed = JSON.parse(json); } catch { continue; }
        const v = validatePackJson(parsed);
        if (v.ok && v.pack) { registerPack(v.pack, 'user'); changed = true; }
      }
    } catch (err) {
      console.warn('avatar user packs failed to load:', err);
    }
    if (changed) this.emitConfig();
  }

  // Import a user pack from raw JSON text: validate → persist to IDB → register
  // → mark loaded. Returns { ok } with a readable error on rejection (never
  // throws). save() no-ops outside edit mode, but the config write still lands
  // in-memory so the manager reflects it for the session.
  async importAvatarPack(text: string): Promise<{ ok: boolean; id?: string; error?: string }> {
    let parsed: unknown;
    try { parsed = JSON.parse(text); }
    catch (err) { return { ok: false, error: 'Invalid JSON: ' + (err as Error).message }; }
    const v = validatePackJson(parsed);
    if (!v.ok || !v.pack) return { ok: false, error: v.error ?? 'Invalid pack.' };
    const def = v.pack;
    try { await savePackJson(def.id, JSON.stringify(def)); }
    catch (err) { return { ok: false, error: 'Could not store pack: ' + (err as Error).message }; }
    registerPack(def, 'user');
    this._mutatePackConfig(def.id, c => { c.loaded = true; });   // emits config
    return { ok: true, id: def.id };
  }

  // Remove a user-imported pack: unregister → IDB delete → drop its config entry.
  async removeAvatarPack(id: string): Promise<void> {
    if (id === 'core') return;
    unregisterPack(id);
    try { await deletePackJson(id); } catch { /* best effort */ }
    const packs: AvatarPacksConfig = { ...(this.store.avatarPacks ?? {}) };
    delete packs[id];
    this.store.avatarPacks = Object.keys(packs).length ? packs : undefined;
    setAvatarPacksConfig(this.store.avatarPacks);
    this.save();
    this.emitConfig();
  }

  // Serialize a registered pack's def to pretty JSON (export / update path).
  exportPackJson(id: string): string | null {
    const entry = getPack(id);
    return entry ? JSON.stringify(entry.def, null, 2) : null;
  }

  // Load / register a single pack body on demand (used by setPackLoaded(true)).
  private async _loadAvatarPack(id: string): Promise<boolean> {
    if (getPack(id)) return true;
    const row = AVATAR_PACK_MANIFEST.find(r => r.id === id);
    if (!row) return false;
    try {
      const mod = await row.load();
      const def = mod.default ?? mod.pack;
      if (def) { registerPack(def, 'builtin'); return true; }
    } catch (err) {
      console.warn(`avatar pack "${id}" failed to load:`, err);
    }
    return false;
  }

  private _mutatePackConfig(id: string, mut: (c: AvatarPackConfig) => void): void {
    const packs: AvatarPacksConfig = { ...(this.store.avatarPacks ?? {}) };
    const c: AvatarPackConfig = { ...(packs[id] ?? {}) };
    mut(c);
    packs[id] = c;
    this.store.avatarPacks = packs;
    setAvatarPacksConfig(packs);
    this.save();
    this.emitConfig();
  }

  // Load ↔ unload a pack. Loading triggers the dynamic import + register first.
  async setPackLoaded(id: string, on: boolean): Promise<void> {
    if (on) await this._loadAvatarPack(id);
    this._mutatePackConfig(id, c => { c.loaded = on; });
  }
  setPackActive(id: string, on: boolean): void {
    this._mutatePackConfig(id, c => { c.active = on; });
  }
  // Set the active member subset (undefined = all members active).
  setPackMembers(id: string, members: string[] | undefined): void {
    this._mutatePackConfig(id, c => { c.members = members; });
  }

  // Manual full state re-poll (also wired to a topbar button).
  async refreshStates(): Promise<void> {
    if (!this.hass) return;
    // Drop discovery cache: bound sensors may have new entity slugs (e.g.
    // filter zones renamed `fz1`/`fz2`/`fz3`) that an older cached
    // DiscoveredDevice doesn't reflect. Re-running discovery is cheap.
    this.disc.invalidate();
    // Force per-sensor discovery to re-run on the next _onStates so cached
    // discBy entries refresh too.
    for (const sid of Object.keys(this.discBy)) delete this.discBy[sid];
    await this.hass.refreshStates();
    void this.scanBatteryRegistry();   // registry may have gained/lost battery siblings
    this.emitConfig();
  }

  private _visListenerBound = false;

  private _onStates(states: Record<string, HassState>, changedId?: string): void {
    if (changedId === undefined) {
      const devices = this.disc.listDevices(states);
      const devKey = devices.join('\x00');
      if (devKey !== this._lastDevKey) {
        this._lastDevKey = devKey;
        this.lastDevices = devices;
        this.emitConfig();
      }
    }

    const f = this.floor();
    for (const s of f.sensors) {
      if (!s.deviceSlug) continue;
      if (!this.discBy[s.id]) this.discBy[s.id] = this.disc.discoverForDevice(states, s.deviceSlug);
      this.ensureLiveState(s.id);
    }
    this._syncOccupancy(states);
    this._detectDoorbells(states);
    this._detectCameraAlerts(states);

    // BLE trilateration (live path only): record fresh per-scanner distances and
    // re-solve on new samples. A full refresh (changedId undefined) re-reads
    // every mapped entity; a single change records just that one. Solve cadence
    // follows Bermuda's ~0.1 Hz push rate — never per frame.
    if (this.store.bermudaEnabled !== false && Object.keys(this.bleEntityMap).length) {
      if (changedId === undefined) {
        for (const eid of Object.keys(this.bleEntityMap))
          if (states[eid]) this._recordBleSample(eid);
        this._solveBle();
        this._fuseIdentities();
      } else if (this.bleEntityMap[changedId]) {
        this._recordBleSample(changedId);
        this._solveBle();
        this._fuseIdentities();
      }
    }

    // Geo calibration live counter (live path; device_tracker is not a slow
    // entity). Cheap no-op unless a calibration session is running.
    if (this.geoCalib) this._geoCalibSample(states, changedId);

    // Weather (local sources): recompute when a bound weather/sensor entity
    // changes, or on a full refresh. Open-Meteo runs on its own timer instead.
    // Mutates weatherNow only — the emitConfig that follows on the slow path
    // (these entities are slow-classified) repaints the chip + sidebar.
    const w = this.store.weather;
    if (w && w.source !== 'openmeteo') {
      if (changedId === undefined || this._weatherEntityIds().includes(changedId)) {
        this._recomputeLocalWeather(states);
      }
    }
    // One-time weather setup on the first full state load (starts the Open-Meteo
    // poll if that source is configured in the local cache). _loadFromHa may
    // replace the config afterward and re-runs _reconfigureWeather itself.
    if (!this._weatherInited && changedId === undefined) {
      this._weatherInited = true;
      this._reconfigureWeather();
    }

    this.emitLive();

    const slow = changedId === undefined || this._isSlowEntity(changedId);
    if (!slow) return;
    if (this.drag || this.editZone) return;

    this._runFullSync(states);

    // After the first state load, schedule a couple of follow-up syncs.
    // ESPHome can trickle entities in after `get_states` returned, so the
    // initial discovery may be incomplete. Retries cover that window without
    // requiring the user to click on the sensor to force it.
    if (!this._initialSyncDone && changedId === undefined) {
      this._initialSyncDone = true;
      for (const ms of [500, 2000, 5000]) {
        this._retrySyncTimers.push(setTimeout(() => {
          if (!this.hass) return;
          this.disc.invalidate();
          this._runFullSync(this.hass.states);
        }, ms));
      }
      // Load diorama from HA (source of truth). Localstorage is a cache.
      void this._loadFromHa();
    }

    // One-time Bermuda auto-scan so BLE trilateration works without a manual
    // sidebar click when the house is already set up (people bound / proxies
    // placed). scanBermuda rebuilds bleEntityMap; the next state event onward
    // records samples + solves. Cheap, guarded to run once.
    if (!this._bleAutoScanned && changedId === undefined && this.store.bermudaEnabled !== false) {
      this._bleAutoScanned = true;
      const wantsBle = (this.store.people ?? []).some(p => p.bermudaDeviceId)
        || this.store.floors.some(fl => (fl.bleProxies ?? []).length > 0);
      if (wantsBle) void this.scanBermuda();
    }

    // One-time battery-sibling registry scan (first full state snapshot). Cheap;
    // batteryFor() no-ops gracefully until it lands.
    if (!this._batteryRegLoaded && changedId === undefined) void this.scanBatteryRegistry();
  }

  // Pull the persisted store from HA's frontend/user_data. If HA has data,
  // replace local store with it. If HA is empty, push the local cache up so
  // future devices/browsers see it. Falls back silently to the localStorage
  // copy already loaded in the constructor on any failure.
  private async _loadFromHa(): Promise<void> {
    if (!this.hass || this._haStoreLoaded) return;
    this._haStoreLoaded = true;
    try {
      const remote = await this.hass.getUserData<Store>(Planner.HA_STORE_KEY);
      if (remote && Array.isArray(remote.floors) && remote.floors.length > 0) {
        // Apply remote store. Repair each floor + default top-level fields so
        // older payloads (or partial schemas) load cleanly.
        this._suppressHaSave = true;
        try {
          const floors = remote.floors.map(f => repairFloor(f));
          this.store = {
            v: 2,
            floors,
            currentFloorId: remote.currentFloorId && floors.some(f => f.id === remote.currentFloorId)
              ? remote.currentFloorId : floors[0].id,
            activeSensorId: null,
            coverage:      remote.coverage      ?? true,
            imperial:      remote.imperial      ?? false,
            showDetails:   remote.showDetails   ?? false,
            useRawTargets: remote.useRawTargets ?? false,
            showMotionZones: remote.showMotionZones ?? true,
            // Pass-through settings objects. scene3d was silently DROPPED
            // here for a while (3D appearance reset on every load) — keep
            // every new top-level Store field in this list.
            scene3d:        remote.scene3d        ?? undefined,
            views3d:        remote.views3d        ?? undefined,
            layers2d:       remote.layers2d       ?? undefined,
            layerPresets2d: remote.layerPresets2d ?? undefined,
            customObjects:  remote.customObjects  ?? undefined,
            people:         remote.people         ?? undefined,
            bermudaEnabled: remote.bermudaEnabled ?? undefined,
            bleShowUnknown: remote.bleShowUnknown ?? undefined,
            weather:        remote.weather        ?? undefined,
            geo:            remote.geo            ?? undefined,
            avatarPacks:    remote.avatarPacks    ?? undefined,
          };
          // Reflect the authoritative pack config into the registry snapshot so
          // resolveAvatar / activeAvatarIds see it, then re-hydrate loaded packs.
          setAvatarPacksConfig(this.store.avatarPacks);
          void this._hydrateAvatarPacks();
          // Reset transient view state to match the loaded store.
          this.activeMotionId = null;
          this.activeEnvId = null;
          this.activeBleId = null;
          this.activeAlarmId = null;
          this.activeSafetyId = null;
          this.activeRobotId = null;
          this.activeCameraId = null;
          this.activePZoneId = null;
          this.activeGroundAreaId = null;
          this.activeVoidAreaId = null;
          this.robotStates = {};
          this.activePersonId = null;
          this.viewCenter = null;
          this.zoom = 1;
          this.drag = null;
          this.editZone = null;
          this.drawingWall = null;
          this.drawingPresenceZone = null;
          this.drawingGroundArea = null;
          this.drawingVoidArea = null;
          this.showDetails = this.store.showDetails === true;
          this.useRawTargets = this.store.useRawTargets === true;
          // Mirror to localStorage as the local cache.
          saveStore(this.store);
        } finally {
          this._suppressHaSave = false;
        }
        // Re-apply the weather source now that the authoritative config loaded
        // (restarts / stops the Open-Meteo poll, recomputes local sources).
        this._reconfigureWeather();
        this.emitConfig();
      } else {
        // HA is empty — promote the local cache to be the source of truth.
        await this.hass.setUserData(Planner.HA_STORE_KEY, this.store);
      }
    } catch (err) {
      console.warn('HA storage load failed (using local cache):', err);
    }
  }

  private _runFullSync(states: Record<string, HassState>): void {
    if (this.drag || this.editZone) return;
    const f = this.floor();
    for (const s of f.sensors) {
      if (!s.deviceSlug) continue;
      this.discBy[s.id] = this.disc.discoverForDevice(states, s.deviceSlug);
      this.ensureLiveState(s.id);
      this._syncZonesObjects(s, states);
    }
    this.emitConfig();
  }

  // Slow vs live classification: number/switch are config, everything else is
  // ~10 Hz live data.
  private _isSlowEntity(id: string): boolean {
    if (!id) return false;
    if (id.startsWith('number.') || id.startsWith('switch.')) return true;
    // Bound environmental sensor entities route through the config channel so
    // the sidebar's live readings re-render. Only entities actually bound on
    // the current floor qualify — a blanket sensor.* rule would emit config
    // for every sensor state change in HA.
    if (this.floor().envSensors.some(e => e.entity_id === id)) return true;
    // Fridge door sensors (Furniture.doorEntity) + door lock entities
    // (Door.lockEntity) + alarm panel entities: bound display-only bindings that
    // aren't number/switch, routed through the config channel so the sidebar
    // badges (and the 3D dirty keys, which also fold these) refresh on change.
    const f2 = this.floor();
    if (f2.furniture.some(fu => fu.doorEntity === id || fu.tempEntity === id)) return true;
    if (f2.doors.some(d => d.lockEntity === id)) return true;
    if ((f2.alarmPanels ?? []).some(a => a.entity_id === id)) return true;
    // Smoke / CO detector binary_sensors: display-only bindings routed through
    // the config channel so 2D/3D dirty keys + sidebar badges refresh on alarm.
    if ((f2.safetySensors ?? []).some(s => s.entity_id === id)) return true;
    // Room occupancy sensors (#1): config-path so the sidebar ● indicator + the
    // 3D floor-patch tint (folded into _keyFloor) rebuild on an occupancy flip
    // (infrequent). The 2D activity glow reads live regardless.
    if ((f2.rooms ?? []).some(rm => rm.occupancyEntity === id)) return true;
    // Robot bindings (vacuum/lawn_mower activity + mower GPS source ids): route
    // through the config channel so the sidebar state badge + GPS status refresh
    // on change. Scoped to the current floor's bound ids only.
    if ((f2.robots ?? []).some(r =>
      r.entity_id === id || r.trackerEntity === id || r.latEntity === id || r.lonEntity === id)) return true;
    // Presence-zone occupancy sensors (#5): config-path so 2D/3D dirty keys +
    // sidebar badge refresh on an occupancy flip. The 2D RAF reads the glow live.
    if ((f2.presenceZones ?? []).some(z => z.entity_id === id)) return true;
    // Camera entities + alert sensors (#10): recording-state / alert changes are
    // rare; the sidebar wants to refresh the badge + the alert-row status. The
    // 2D/3D canvases read the alert live regardless. Scoped to current-floor ids.
    if ((f2.cameras ?? []).some(c => c.entity_id === id || c.alertEntity === id)) return true;
    // GPS source entities (a person.* or device_tracker.* bound to a Store.people
    // entry) are config-path so the sidebar GPS status line + 3D pins refresh on
    // a new fix. Bounded to the specific bound ids (GPS pushes are minutes apart,
    // so the extra config emits are negligible) — same precedent as env/weather;
    // the 2D canvas RAF reads gpsPins live regardless.
    if ((this.store.people ?? []).some(pe => pe.haPersonId === id || pe.gpsTrackerId === id)) return true;
    // Bound weather source entities are config-path too (chip + sidebar preview
    // re-render on change). Only the specific bound ids qualify.
    return this._weatherEntityIds().includes(id);
  }

  // Entity ids the current (local) weather source depends on. Empty for the
  // Open-Meteo source (no HA entity) or when unconfigured.
  private _weatherEntityIds(): string[] {
    const w = this.store.weather;
    if (!w) return [];
    if (w.source === 'entity') return w.entityId ? [w.entityId] : [];
    if (w.source === 'sensors') {
      const s = w.sensors ?? {};
      return [s.precip, s.windSpeed, s.temp, s.lightning].filter((x): x is string => !!x);
    }
    return [];
  }

  // Cheap occupancy refresh — runs on every state event so live data stays current.
  private _syncOccupancy(states: Record<string, HassState>): void {
    const f = this.floor();
    for (const s of f.sensors) {
      if (!s.deviceSlug) continue;
      const d = this.discBy[s.id]; const z = this.zonesBy[s.id]; const o = this.objectsBy[s.id];
      if (!d) continue;
      if (z) {
        for (let i = 0; i < d.inclusionZoneSlugs.length && i < 3; i++) {
          const tcId = d.zoneTargetCount[i];
          const tc = tcId ? parseInt(states[tcId]?.state ?? '') : NaN;
          z.inclusion[i].occupied = !isNaN(tc) && tc > 0;
          z.inclusion[i].targetCount = !isNaN(tc) ? tc : 0;
        }
      }
      if (o) {
        for (let i = 0; i < d.objectSlugs.length && i < 3; i++) {
          const oc = d.haloOccupied[i] ? states[d.haloOccupied[i]!] : null;
          o[i].occupied = oc?.state === 'on';
        }
      }
    }
  }

  // Doorbell transient-pulse detection (LIVE path, every state event). Watches
  // each current-floor Door.doorbellEntity for a state-STRING change: an event.*
  // timestamp bump, a binary_sensor off→on (button ring), or a button.* press
  // timestamp all change the string. First observation seeds silently (no ring on
  // reconnect — the _trigPrevOn idiom). binary_sensor only rings on activation
  // (new state 'on'); unavailable/unknown transitions update the seed but never
  // ring. Rings are pruned > 8 s and capped at 8. Cheap no-op with no doorbells.
  private _detectDoorbells(states: Record<string, HassState>): void {
    const f = this.floor();
    const now = Date.now();
    for (const d of f.doors) {
      const eid = d.doorbellEntity;
      if (!eid) continue;
      const cur = states[eid]?.state;
      if (cur == null) continue;
      const prev = this._doorbellPrev[d.id];
      this._doorbellPrev[d.id] = cur;
      if (prev === undefined || prev === cur) continue;         // seed / no change
      if (cur === 'unavailable' || cur === 'unknown') continue; // not a real ring
      if (eid.startsWith('binary_sensor.') && cur !== 'on') continue;  // only on activation
      this.doorbellRings.push({ doorId: d.id, at: now });
    }
    if (this.doorbellRings.length) {
      this.doorbellRings = this.doorbellRings.filter(r => now - r.at < 8000);
      if (this.doorbellRings.length > 8)
        this.doorbellRings.splice(0, this.doorbellRings.length - 8);
    }
  }

  // Camera-alert linger tracking (LIVE path). Records the last time each
  // current-floor camera's alertEntity was 'on' so the snapshot card + FOV pulse
  // can linger CAMERA_ALERT_LINGER_MS after the sensor clears. Cheap no-op with
  // no cameras / no alert bindings.
  private _detectCameraAlerts(states: Record<string, HassState>): void {
    const now = Date.now();
    for (const cam of this.floor().cameras ?? []) {
      if (!cam.alertEntity) continue;
      if (states[cam.alertEntity]?.state === 'on') this._camAlertLastOn[cam.id] = now;
    }
  }

  // Whether a camera is currently alerting — its alertEntity is 'on', or within
  // CAMERA_ALERT_LINGER_MS of the last observed 'on'. Read live by both canvases
  // (2D RAF + 3D tick). No-op false with no binding.
  cameraAlerting(cam: CameraFixture): boolean {
    if (!cam.alertEntity) return false;
    if (this.hass?.states?.[cam.alertEntity]?.state === 'on') return true;
    const last = this._camAlertLastOn[cam.id];
    return last != null && Date.now() - last < CAMERA_ALERT_LINGER_MS;
  }

  ensureLiveState(sensorId: string): void {
    if (!this.zonesBy[sensorId]) {
      this.zonesBy[sensorId] = {
        inclusion: [
          { name: 'Zone A', vertices: [], enabled: false, occupied: false },
          { name: 'Zone B', vertices: [], enabled: false, occupied: false },
          { name: 'Zone C', vertices: [], enabled: false, occupied: false },
        ],
        filter: [
          { name: 'Filter 1', vertices: [], enabled: false, occupied: false },
          { name: 'Filter 2', vertices: [], enabled: false, occupied: false },
          { name: 'Filter 3', vertices: [], enabled: false, occupied: false },
        ],
      };
      // Restore last-known-good polygons from the persisted cache so a fresh
      // page load shows zones immediately, before HA's first state push
      // arrives — and so a partial / zeroed firmware push during reconnect
      // doesn't visually wipe them.
      const sensor = this.floor().sensors.find(s => s.id === sensorId);
      const cache = sensor?.zoneCache;
      if (cache) {
        for (let i = 0; i < this.zonesBy[sensorId].inclusion.length; i++) {
          const cached = cache.inclusion?.[i];
          if (cached && cached.length >= 3) {
            this.zonesBy[sensorId].inclusion[i].vertices = cached.map(v => ({ x: v.x, y: v.y }));
          }
        }
        for (let i = 0; i < this.zonesBy[sensorId].filter.length; i++) {
          const cached = cache.filter?.[i];
          if (cached && cached.length >= 3) {
            this.zonesBy[sensorId].filter[i].vertices = cached.map(v => ({ x: v.x, y: v.y }));
          }
        }
      }
    }
    if (!this.objectsBy[sensorId]) this.objectsBy[sensorId] = [
      { name: 'Object A', x: 0, y: 0, radius: 500, icon: '📍', enabled: false, occupied: false },
      { name: 'Object B', x: 0, y: 0, radius: 500, icon: '📍', enabled: false, occupied: false },
      { name: 'Object C', x: 0, y: 0, radius: 500, icon: '📍', enabled: false, occupied: false },
    ];
    if (!this.lerpBy[sensorId]) this.lerpBy[sensorId] = [
      { cx: 0, cy: 0, tx: 0, ty: 0, vx: 0, vy: 0, active: false },
      { cx: 0, cy: 0, tx: 0, ty: 0, vx: 0, vy: 0, active: false },
      { cx: 0, cy: 0, tx: 0, ty: 0, vx: 0, vy: 0, active: false },
    ];
    if (!this.objWritePending[sensorId]) this.objWritePending[sensorId] = [false, false, false];
    if (!this.objWriteTimer[sensorId])   this.objWriteTimer[sensorId]   = [null, null, null];
    if (!this.izExpanded[sensorId]) this.izExpanded[sensorId] = new Set();
    if (!this.fzExpanded[sensorId]) this.fzExpanded[sensorId] = new Set();
    if (this.editObject[sensorId] === undefined) this.editObject[sensorId] = -1;
  }

  // ── HA sync (slow path) ─────────────────────────────────────────────────
  private _readCoord(entityId: string | null): number | null {
    if (!entityId || !this.hass) return null;
    const s = this.hass.states[entityId];
    if (!s) return null;
    const v = parseFloat(s.state);
    return isNaN(v) ? null : v;
  }

  writeCoord(entityId: string | null, value: number): void {
    if (!entityId || !this.hass) return;
    this.hass.callService('number', 'set_value', { entity_id: entityId, value });
  }

  // Length unit normalization for HA-published distances.
  stateMm(entityId: string | null, nativeToMM: number): number {
    if (!entityId || !this.hass) return NaN;
    const s = this.hass.states[entityId];
    if (!s) return NaN;
    const v = parseFloat(s.state);
    if (isNaN(v)) return NaN;
    const u = String((s.attributes as Record<string, unknown>)?.unit_of_measurement ?? '').toLowerCase().trim();
    switch (u) {
      case 'in': case 'inch': case 'inches': case '"': return v * 25.4;
      case 'ft': case 'feet':                          return v * 304.8;
      case 'yd': case 'yard': case 'yards':            return v * 914.4;
      case 'mm': return v;
      case 'cm': return v * 10;
      case 'm':  return v * 1000;
      case 'km': return v * 1_000_000;
    }
    return v * (nativeToMM || 1);
  }

  zoneEntityId(s: Sensor, prefix: 'iz' | 'fz', zi: number, vi: number, axis: 'x' | 'y'): string | null {
    const d = this.discBy[s.id]; if (!d) return null;
    const slug = (prefix === 'iz' ? d.inclusionZoneSlugs : d.filterZoneSlugs)[zi];
    if (!slug) return null;
    return `number.${s.deviceSlug}_${slug}_v${vi + 1}_${axis}`;
  }

  objEntityId(s: Sensor, oi: number, field: 'x' | 'y' | 'radius'): string | null {
    const d = this.discBy[s.id]; if (!d) return null;
    const slug = d.objectSlugs[oi]; if (!slug) return null;
    const suffix = field === 'radius' ? 'halo_radius' : field;
    return `number.${s.deviceSlug}_${slug}_${suffix}`;
  }

  private _syncZonesObjects(s: Sensor, states: Record<string, HassState>): void {
    const d = this.discBy[s.id]; if (!d) return;
    const dp = s.deviceSlug;
    const slugGroups = [d.inclusionZoneSlugs, d.filterZoneSlugs];
    const zoneArrays = [this.zonesBy[s.id].inclusion, this.zonesBy[s.id].filter];
    const prefixes = ['iz', 'fz'] as const;
    let cacheChanged = false;
    for (let gi = 0; gi < 2; gi++) {
      for (let z = 0; z < slugGroups[gi].length; z++) {
        const slug = slugGroups[gi][z];
        const zone = zoneArrays[gi][z];
        zone.name = slugToName(slug);
        const enId = `switch.${dp}_${slug}_enable`;
        if (states[enId]) zone.enabled = states[enId].state === 'on';
        const verts: Vec2[] = [];
        for (let vi = 0; vi < 8; vi++) {
          const x = this._readCoord(this.zoneEntityId(s, prefixes[gi], z, vi, 'x'));
          const y = this._readCoord(this.zoneEntityId(s, prefixes[gi], z, vi, 'y'));
          if (x === null || y === null) break;
          if (vi > 0 && x === 0 && y === 0) break;
          verts.push({ x, y });
        }
        // Only adopt firmware values when they form a coherent polygon. Keep
        // existing runtime vertices otherwise — protects user-configured
        // shapes from being wiped during partial state pushes / reconnects.
        if (verts.length >= 3) {
          zone.vertices = verts;
          // Persist to the sensor's zoneCache so the next page reload paints
          // the last-known-good polygon immediately instead of waiting for
          // (or losing data to) the firmware re-publish cycle.
          if (!s.zoneCache) s.zoneCache = { inclusion: [], filter: [] };
          const cacheArr = gi === 0 ? s.zoneCache.inclusion : s.zoneCache.filter;
          const prev = cacheArr[z];
          const same = prev && prev.length === verts.length &&
            prev.every((v, i) => v.x === verts[i].x && v.y === verts[i].y);
          if (!same) {
            cacheArr[z] = verts.map(v => ({ x: v.x, y: v.y }));
            cacheChanged = true;
          }
        }
      }
    }
    if (cacheChanged) this.save();
    for (let i = 0; i < d.inclusionZoneSlugs.length && i < 3; i++) {
      const tcId = d.zoneTargetCount[i];
      const tc = tcId ? parseInt(states[tcId]?.state ?? '') : NaN;
      this.zonesBy[s.id].inclusion[i].occupied = !isNaN(tc) && tc > 0;
      this.zonesBy[s.id].inclusion[i].targetCount = !isNaN(tc) ? tc : 0;
    }
    for (let i = 0; i < d.objectSlugs.length && i < 3; i++) {
      const slug = d.objectSlugs[i];
      const obj = this.objectsBy[s.id][i];
      obj.name = slugToName(slug);
      const x = this._readCoord(this.objEntityId(s, i, 'x'));
      const y = this._readCoord(this.objEntityId(s, i, 'y'));
      const rv = this._readCoord(this.objEntityId(s, i, 'radius'));
      const en = states[`switch.${dp}_${slug}_halo_enable`];
      const oc = d.haloOccupied[i] ? states[d.haloOccupied[i]!] : null;
      if (!this.objWritePending[s.id][i]) {
        if (x !== null) obj.x = x;
        if (y !== null) obj.y = y;
      }
      if (rv !== null) obj.radius = rv;
      if (en) obj.enabled = en.state === 'on';
      obj.occupied = oc?.state === 'on';
    }
  }

  // ── HA writes ───────────────────────────────────────────────────────────
  setZoneEnabled(s: Sensor, prefix: 'iz' | 'fz', zi: number, enabled: boolean, enId: string | null): void {
    const arr = prefix === 'iz' ? this.zonesBy[s.id].inclusion : this.zonesBy[s.id].filter;
    arr[zi].enabled = enabled;
    if (this.hass && enId && this.hass.states[enId]) {
      this.hass.callService('switch', enabled ? 'turn_on' : 'turn_off', { entity_id: enId });
    }
    this.emitConfig();
  }

  setObjectEnabled(s: Sensor, oi: number, enabled: boolean, enId: string | null): void {
    this.objectsBy[s.id][oi].enabled = enabled;
    if (this.hass && enId && this.hass.states[enId]) {
      this.hass.callService('switch', enabled ? 'turn_on' : 'turn_off', { entity_id: enId });
    }
    this.emitConfig();
  }

  saveAllZoneVertices(s: Sensor, prefix: 'iz' | 'fz', zi: number, verts: Vec2[]): void {
    const arr = prefix === 'iz' ? this.zonesBy[s.id].inclusion : this.zonesBy[s.id].filter;
    arr[zi].vertices = verts.filter(v => v.x !== 0 || v.y !== 0);
    for (let vi = 0; vi < 8; vi++) {
      const v = verts[vi] || { x: 0, y: 0 };
      this.writeCoord(this.zoneEntityId(s, prefix, zi, vi, 'x'), v.x);
      this.writeCoord(this.zoneEntityId(s, prefix, zi, vi, 'y'), v.y);
    }
    this.emitConfig();
  }

  saveZoneVertex(s: Sensor, prefix: 'iz' | 'fz', zi: number, vi: number, x: number, y: number): void {
    const arr = prefix === 'iz' ? this.zonesBy[s.id].inclusion : this.zonesBy[s.id].filter;
    while (arr[zi].vertices.length <= vi) arr[zi].vertices.push({ x: 0, y: 0 });
    arr[zi].vertices[vi] = { x, y };
    this.writeCoord(this.zoneEntityId(s, prefix, zi, vi, 'x'), x);
    this.writeCoord(this.zoneEntityId(s, prefix, zi, vi, 'y'), y);
  }

  saveObjectField(s: Sensor, oi: number, field: 'x' | 'y' | 'radius', val: number): void {
    this.objectsBy[s.id][oi][field] = val;
    this.writeCoord(this.objEntityId(s, oi, field), val);
  }

  // ── Active sensor / tool ────────────────────────────────────────────────
  // Bind / re-bind a sensor to an HA device, running discovery + sync
  // immediately (and a few retries) so zones and objects load without the
  // user having to wait for the next slow-path state event.
  bindSensor(sensorId: string, deviceSlug: string | null): void {
    const f = this.floor();
    const s = f.sensors.find(x => x.id === sensorId);
    if (!s) return;
    s.deviceSlug = deviceSlug;
    // Wipe stale per-sensor live state from the previous binding so old
    // zones/objects from another device don't bleed across.
    delete this.discBy[sensorId];
    delete this.zonesBy[sensorId];
    delete this.objectsBy[sensorId];
    delete this.lerpBy[sensorId];
    delete this.objWritePending[sensorId];
    delete this.objWriteTimer[sensorId];
    delete this.izExpanded[sensorId];
    delete this.fzExpanded[sensorId];
    delete this.editObject[sensorId];
    this.ensureLiveState(sensorId);
    this.save();

    if (deviceSlug && this.hass) {
      // Force the discovery cache to re-scan in case entities just appeared.
      this.disc.invalidate();
      this._runFullSyncForSensor(s, this.hass.states);
      // Retries cover the case where the device is still publishing entities.
      for (const ms of [500, 2000, 5000]) {
        setTimeout(() => {
          if (!this.hass) return;
          const cur = this.floor().sensors.find(x => x.id === sensorId);
          if (!cur || cur.deviceSlug !== deviceSlug) return;  // user re-bound elsewhere
          this.disc.invalidate();
          this._runFullSyncForSensor(cur, this.hass.states);
        }, ms);
      }
    }
    this.emitConfig();
  }

  private _runFullSyncForSensor(s: Sensor, states: Record<string, HassState>): void {
    if (!s.deviceSlug || this.drag || this.editZone) return;
    this.discBy[s.id] = this.disc.discoverForDevice(states, s.deviceSlug);
    this.ensureLiveState(s.id);
    this._syncZonesObjects(s, states);
    this.emitConfig();
  }

  setActiveSensor(id: string | null): void {
    this.store.activeSensorId = (this.store.activeSensorId === id) ? null : id;
    // Unbound sensors have no discovery-driven init path — make sure the
    // live-state slots exist the moment one becomes active so hit tests and
    // renderers can rely on them.
    if (this.store.activeSensorId) this.ensureLiveState(this.store.activeSensorId);
    this.save();
    if (this.store.activeSensorId) {
      const s = this.activeSensor();
      if (s && s.deviceSlug && this.hass) {
        this.discBy[s.id] = this.disc.discoverForDevice(this.hass.states, s.deviceSlug);
        this.ensureLiveState(s.id);
        this._syncZonesObjects(s, this.hass.states);
      }
    }
    this.emitConfig();
  }

  setTool(t: Tool): void {
    this.tool = t;
    if (t !== 'wall') this.drawingWall = null;
    if (t !== 'pzone') this.drawingPresenceZone = null;
    if (t !== 'ground') this.drawingGroundArea = null;
    if (t !== 'void') this.drawingVoidArea = null;
    this.placingRoomId = null;  // picking any tool cancels a pending room placement
    this.placingLandmarkId = null;
    this.emitConfig();
  }

  setActiveMotion(id: string | null): void {
    this.activeMotionId = (this.activeMotionId === id) ? null : id;
    this.emitConfig();
  }

  setActiveEnv(id: string | null): void {
    this.activeEnvId = (this.activeEnvId === id) ? null : id;
    this.emitConfig();
  }

  setActiveBle(id: string | null): void {
    this.activeBleId = (this.activeBleId === id) ? null : id;
    this.emitConfig();
  }

  setActiveAlarm(id: string | null): void {
    this.activeAlarmId = (this.activeAlarmId === id) ? null : id;
    this.emitConfig();
  }

  setActiveSafety(id: string | null): void {
    this.activeSafetyId = (this.activeSafetyId === id) ? null : id;
    this.emitConfig();
  }

  setActiveRobot(id: string | null): void {
    this.activeRobotId = (this.activeRobotId === id) ? null : id;
    this.emitConfig();
  }

  setActiveCamera(id: string | null): void {
    this.activeCameraId = (this.activeCameraId === id) ? null : id;
    this.emitConfig();
  }

  setActivePZone(id: string | null): void {
    this.activePZoneId = (this.activePZoneId === id) ? null : id;
    this.emitConfig();
  }

  // Commit the in-progress presence-zone polygon (≥3 pts). Replaces an existing
  // zone's points when re-drawing (drawingPresenceZone.id set), else creates one.
  finishPresenceZone(): void {
    const d = this.drawingPresenceZone;
    this.drawingPresenceZone = null;
    if (!d || d.points.length < 3) { this.emitConfig(); return; }
    const f = this.floor();
    if (!f.presenceZones) f.presenceZones = [];
    const pts = d.points.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
    if (d.id) {
      const z = f.presenceZones.find(x => x.id === d.id);
      if (z) z.points = pts;
    } else {
      const id = newId('pz');
      f.presenceZones.push({ id, name: `Zone ${f.presenceZones.length + 1}`, points: pts, entity_id: null });
      this.activePZoneId = id;
    }
    this.save();
    this.emitConfig();
  }

  setActiveGroundArea(id: string | null): void {
    this.activeGroundAreaId = (this.activeGroundAreaId === id) ? null : id;
    this.emitConfig();
  }

  // Commit the in-progress ground-area polygon (≥3 pts). Mirrors finishPresenceZone.
  // Replaces an existing area's points when re-drawing (drawingGroundArea.id set),
  // else creates a new grass area.
  finishGroundArea(): void {
    const d = this.drawingGroundArea;
    this.drawingGroundArea = null;
    if (!d || d.points.length < 3) { this.emitConfig(); return; }
    const f = this.floor();
    if (!f.groundAreas) f.groundAreas = [];
    const pts = d.points.slice(0, 20).map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
    if (d.id) {
      const g = f.groundAreas.find(x => x.id === d.id);
      if (g) g.points = pts;
    } else {
      const id = newId('ga');
      f.groundAreas.push({ id, name: `Area ${f.groundAreas.length + 1}`, points: pts, kind: 'grass' });
      this.activeGroundAreaId = id;
    }
    this.save();
    this.emitConfig();
  }

  setActiveVoidArea(id: string | null): void {
    this.activeVoidAreaId = (this.activeVoidAreaId === id) ? null : id;
    this.emitConfig();
  }

  // Commit the in-progress void-area polygon (≥3 pts). Mirrors finishGroundArea.
  // Replaces an existing void's points when re-drawing (drawingVoidArea.id set),
  // else creates a new void.
  finishVoidArea(): void {
    const d = this.drawingVoidArea;
    this.drawingVoidArea = null;
    if (!d || d.points.length < 3) { this.emitConfig(); return; }
    const f = this.floor();
    if (!f.voidAreas) f.voidAreas = [];
    const pts = d.points.slice(0, 12).map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
    if (d.id) {
      const v = f.voidAreas.find(x => x.id === d.id);
      if (v) v.points = pts;
    } else {
      const id = newId('vd');
      f.voidAreas.push({ id, points: pts });
      this.activeVoidAreaId = id;
    }
    this.save();
    this.emitConfig();
  }

  // Set an unbound alarm keypad's local (demo) state and repaint. Bound panels
  // ignore this (effectiveState prefers the entity). save() no-ops outside edit,
  // so a kiosk demo flip is session-only.
  setAlarmLocalState(id: string, state: string): void {
    const a = (this.floor().alarmPanels ?? []).find(x => x.id === id);
    if (!a) return;
    a.localState = state;
    this.save();
    this.emitConfig();
  }

  setActivePerson(id: string | null): void {
    this.activePersonId = (this.activePersonId === id) ? null : id;
    this.emitConfig();
  }

  // ── People registry ───────────────────────────────────────────────────
  addPerson(): string {
    if (!this.store.people) this.store.people = [];
    const id = newId('pe');
    this.store.people.push({ id, name: `Person ${this.store.people.length + 1}` });
    this.activePersonId = id;
    this.save();
    this.emitConfig();
    return id;
  }

  updatePerson(id: string, mut: (p: import('./types.js').DioramaPerson) => void): void {
    const person = this.store.people?.find(x => x.id === id);
    if (!person) return;
    mut(person);
    this.save();
    this.emitConfig();
  }

  deletePerson(id: string): void {
    if (!this.store.people) return;
    this.store.people = this.store.people.filter(x => x.id !== id);
    if (this.activePersonId === id) this.activePersonId = null;
    this.save();
    this.emitConfig();
  }

  // ── Geo reference (landmarks + lat/lon↔plan calibration, Feature G) ────────
  private _ensureGeo(): GeoConfig {
    if (!this.store.geo) this.store.geo = { landmarks: [], boundaryM: 30, accuracyGateM: 30 };
    if (!this.store.geo.landmarks) this.store.geo.landmarks = [];
    return this.store.geo;
  }

  geoLandmarks(): GeoLandmark[] { return this.store.geo?.landmarks ?? []; }
  geoAccuracyGate(): number { return this.store.geo?.accuracyGateM ?? 30; }
  geoBoundaryM(): number { return this.store.geo?.boundaryM ?? 30; }

  setGeo(mut: (g: GeoConfig) => void): void {
    mut(this._ensureGeo());
    this.save();
    this.emitConfig();
  }

  // Place a landmark at world-mm (x, y). Returns the new id.
  addGeoLandmark(x: number, y: number): string {
    const g = this._ensureGeo();
    const id = newId('lm');
    g.landmarks.push({ id, name: `Landmark ${g.landmarks.length + 1}`, x: Math.round(x), y: Math.round(y) });
    this.save();
    this.emitConfig();
    return id;
  }

  updateLandmark(id: string, mut: (l: GeoLandmark) => void): void {
    const lm = this.store.geo?.landmarks.find(l => l.id === id);
    if (!lm) return;
    mut(lm);
    this.save();
    this.emitConfig();
  }

  deleteLandmark(id: string): void {
    if (!this.store.geo) return;
    this.store.geo.landmarks = this.store.geo.landmarks.filter(l => l.id !== id);
    if (this.placingLandmarkId === id) this.placingLandmarkId = null;
    if (this.geoCalib?.landmarkId === id) void this.cancelGeoCalibration();
    this.save();
    this.emitConfig();
  }

  // Fit the current geo transform from calibrated landmarks. Returns the fit
  // plus the calibrated-landmark list aligned to `transform.residualsMm`, so the
  // sidebar can flag the worst outlier by name. Null when nothing is calibrated.
  geoFit(): { transform: GeoTransform; landmarks: GeoLandmark[] } | null {
    const cal = this.geoLandmarks().filter(l => l.lat != null && l.lon != null);
    if (cal.length === 0) return null;
    const pairs: GeoPair[] = cal.map(l => ({ x: l.x, y: l.y, lat: l.lat!, lon: l.lon! }));
    return { transform: fitGeoTransform(pairs, this.store.geo?.northDeg), landmarks: cal };
  }

  // Resolve the GPS device pins for rendering (Feature G, phase G2). For each
  // Store.people entry with a GPS source (person.* entity preferred, else the
  // device_tracker.* override) read latitude/longitude/gps_accuracy off the
  // entity, project via the fitted geo transform, and classify the pin against
  // the CURRENT floor rect:
  //   • indoor  — inside 0..fw × 0..fd (GPS indoors is tens of metres off, so
  //               the pin is a "find my phone" hint, not a placement).
  //   • yard    — within that rect inflated by geo.boundaryM; drawn at true pos.
  //   • beyond  — outside the boundary; clamped to the boundary edge along the
  //               true bearing (kept as bearingDeg/distanceM for the label).
  // Cheap (a handful of people) — safe to call each frame from 2D/3D. Recompute
  // lives on the config path (bound GPS source ids are slow-classified) so the
  // sidebar re-renders; the 2D canvas RAF reads this getter every frame anyway.
  // Read the RAW GPS fix for a person's bound GPS source, INDEPENDENT of geo
  // calibration. Returns null when the person has no GPS source; `found:false`
  // when the entity isn't in hass.states; lat/lon null when the attributes are
  // missing/non-numeric. Shares the exact attribute reads, last_updated parse,
  // and GPS_STALE_MS staleness rule with `gpsPins`, so the sidebar can report a
  // fix even with no fitted transform.
  gpsFixFor(pe: DioramaPerson): {
    entityId: string; found: boolean; lat: number | null; lon: number | null;
    accuracyM: number | null; lastUpdated: number; stale: boolean;
  } | null {
    const eid = pe.haPersonId || pe.gpsTrackerId;
    if (!eid) return null;
    const st = this.hass?.states?.[eid];
    if (!st) {
      return { entityId: eid, found: false, lat: null, lon: null, accuracyM: null, lastUpdated: 0, stale: false };
    }
    const a = st.attributes as Record<string, unknown>;
    const lat = typeof a.latitude === 'number' ? a.latitude : null;
    const lon = typeof a.longitude === 'number' ? a.longitude : null;
    const accuracyM = typeof a.gps_accuracy === 'number' ? a.gps_accuracy : null;
    const lu = st.last_updated ? Date.parse(st.last_updated) : NaN;
    const lastUpdated = isFinite(lu) ? lu : 0;
    const stale = lastUpdated > 0 && (Date.now() - lastUpdated) > Planner.GPS_STALE_MS;
    return { entityId: eid, found: true, lat, lon, accuracyM, lastUpdated, stale };
  }

  get gpsPins(): GpsPin[] {
    const fitR = this.geoFit();
    if (!fitR || fitR.transform.quality === 'none') return [];
    const states = this.hass?.states;
    if (!states) return [];
    const t = fitR.transform;
    const f = this.floor();
    const fw = f.w, fd = f.d;
    const boundaryMm = this.geoBoundaryM() * 1000;
    const cx = fw / 2, cy = fd / 2;
    const out: GpsPin[] = [];
    for (const pe of this.store.people ?? []) {
      const fix = this.gpsFixFor(pe);
      if (!fix || !fix.found || fix.lat == null || fix.lon == null) continue;
      const lat = fix.lat, lon = fix.lon;
      const plan = latLonToPlan(t, lat, lon);
      if (!plan) continue;
      const accM = fix.accuracyM;
      const lastUpdated = fix.lastUpdated;
      const stale = fix.stale;
      const indoor = plan.x >= 0 && plan.x <= fw && plan.y >= 0 && plan.y <= fd;
      const inYard = plan.x >= -boundaryMm && plan.x <= fw + boundaryMm
                  && plan.y >= -boundaryMm && plan.y <= fd + boundaryMm;
      let zone: GpsZone; let clampedX: number; let clampedY: number;
      if (indoor) { zone = 'indoor'; clampedX = plan.x; clampedY = plan.y; }
      else if (inYard) { zone = 'yard'; clampedX = plan.x; clampedY = plan.y; }
      else {
        zone = 'beyond';
        const cl = clampToBoundary(fw, fd, boundaryMm, plan.x, plan.y);
        clampedX = cl.x; clampedY = cl.y;
      }
      const dx = plan.x - cx, dy = plan.y - cy;
      out.push({
        key: `gps_${pe.id}`, personId: pe.id, name: pe.name || 'Person',
        color: pe.color || '#90caf9', isPet: !!pe.isPet,
        x: plan.x, y: plan.y,
        accuracyMm: accM != null ? accM * 1000 : 0,
        lastUpdated, stale, zone, clampedX, clampedY,
        bearingDeg: planBearingDeg(t.thetaRad, dx, dy),
        distanceM: Math.hypot(dx, dy) / 1000,
      });
    }
    return out;
  }

  // geo_location event pins (roadmap #9). Scans hass.states for `geo_location.*`
  // entities with numeric lat/lon, projects each via the fitted geo transform,
  // and classifies/clamps against the current floor boundary EXACTLY like gpsPins.
  // Requires geoFit() quality !== 'none' and geo.showEvents !== false. Caps at 20
  // (nearest by distance km). Cached per config-rev + a 60 s TTL so the RAF stays
  // cheap (geo_location churn is low). Returns [] when disabled/unfitted.
  get geoEventPins(): GeoEventPin[] {
    if (this.store.geo?.showEvents === false) return [];
    const now = Date.now();
    const c = this._geoEvCache;
    if (c && c.rev === this.configRev && (now - c.at) < 60000) return c.pins;
    const pins = this._computeGeoEventPins();
    this._geoEvCache = { at: now, rev: this.configRev, pins };
    return pins;
  }
  private _geoEvCache: { at: number; rev: number; pins: GeoEventPin[] } | null = null;

  private _computeGeoEventPins(): GeoEventPin[] {
    const fitR = this.geoFit();
    if (!fitR || fitR.transform.quality === 'none') return [];
    const states = this.hass?.states;
    if (!states) return [];
    const t = fitR.transform;
    const f = this.floor();
    const fw = f.w, fd = f.d;
    const boundaryMm = this.geoBoundaryM() * 1000;
    const cx = fw / 2, cy = fd / 2;
    const out: GeoEventPin[] = [];
    for (const id in states) {
      if (!id.startsWith('geo_location.')) continue;
      const st = states[id];
      const a = (st.attributes ?? {}) as Record<string, unknown>;
      const lat = typeof a.latitude === 'number' ? a.latitude : null;
      const lon = typeof a.longitude === 'number' ? a.longitude : null;
      if (lat == null || lon == null) continue;
      const plan = latLonToPlan(t, lat, lon);
      if (!plan) continue;
      const source = typeof a.source === 'string' ? a.source : '';
      const src = source.toLowerCase();
      const name = (typeof a.friendly_name === 'string' && a.friendly_name) || id.slice('geo_location.'.length);
      const category: GeoEventPin['category'] =
        /quake|earthquake|seismic|usgs|geonet/.test(src) ? 'quake'
        : /fire|burn|nsw|qfes|incident/.test(src) ? 'fire' : 'other';
      const indoor = plan.x >= 0 && plan.x <= fw && plan.y >= 0 && plan.y <= fd;
      const inYard = plan.x >= -boundaryMm && plan.x <= fw + boundaryMm
                  && plan.y >= -boundaryMm && plan.y <= fd + boundaryMm;
      let zone: GpsZone; let clampedX: number; let clampedY: number;
      if (indoor) { zone = 'indoor'; clampedX = plan.x; clampedY = plan.y; }
      else if (inYard) { zone = 'yard'; clampedX = plan.x; clampedY = plan.y; }
      else { zone = 'beyond'; const cl = clampToBoundary(fw, fd, boundaryMm, plan.x, plan.y); clampedX = cl.x; clampedY = cl.y; }
      const dx = plan.x - cx, dy = plan.y - cy;
      const stateKm = parseFloat(st.state);
      const distanceKm = isFinite(stateKm) ? stateKm : Math.hypot(dx, dy) / 1000 / 1000; // state is km; fallback plan m→km
      const mag = typeof a.magnitude === 'number' ? a.magnitude : null;
      const bearingDeg = planBearingDeg(t.thetaRad, dx, dy);
      const magStr = mag != null ? `M${mag.toFixed(1)} · ` : '';
      out.push({
        key: id, name, source, category,
        x: plan.x, y: plan.y, clampedX, clampedY, zone, bearingDeg,
        distanceKm, magnitude: mag,
        label: `${magStr}${Math.round(distanceKm)} km ${compass8(bearingDeg)}`,
      });
    }
    out.sort((p, q) => p.distanceKm - q.distanceKm);
    return out.slice(0, 20);
  }

  geoShowEvents(): boolean { return this.store.geo?.showEvents !== false; }

  // HTTP base URL of the HA instance, for building absolute camera-snapshot URLs
  // (roadmap #10). Panel mode + iframe mode are BOTH served from the HA origin,
  // so a relative `/api/camera_proxy/...` (entity_picture) resolves same-origin —
  // return '' there. Only the standalone/token mode (a different origin) needs a
  // prefix, which lives in localStorage['diorama:url']. Trailing slash stripped.
  get haBaseUrl(): string {
    try {
      const u = localStorage.getItem('diorama:url') || '';
      // Same-origin (panel/iframe): the stored url equals our own origin, or is
      // absent → return '' so the browser resolves relative to the page.
      if (!u) return '';
      const base = u.replace(/\/$/, '');
      if (base === window.location.origin) return '';
      return base;
    } catch { return ''; }
  }

  // Derive the companion-app notify service slug from a device_tracker entity id
  // (device_tracker.eric_phone → mobile_app_eric_phone). Best-effort default the
  // calibration card pre-fills; the user can override it.
  notifySlugFor(trackerId: string): string {
    const local = trackerId.split('.')[1] ?? '';
    return local ? `mobile_app_${local}` : '';
  }

  // Fire-and-forget a companion-app high-accuracy notify command. NEVER blocks
  // the UI or throws — Android acts on it, iOS ignores the payload harmlessly.
  private _sendHighAccuracy(slug: string, data: Record<string, unknown>): void {
    if (!slug || !this.hass) return;
    try {
      void Promise.resolve(this.hass.callService('notify', slug, {
        message: 'command_high_accuracy_mode', data,
      })).catch(() => { /* ignore */ });
    } catch { /* ignore */ }
  }

  // Fire-and-forget the officially-documented `request_location_update` companion
  // notify command. Works on BOTH iOS and Android (iOS has no high-accuracy
  // command but does answer this, subject to OS throttling). Never blocks/throws.
  private _requestLocationUpdate(slug: string): void {
    if (!slug || !this.hass) return;
    try {
      void Promise.resolve(this.hass.callService('notify', slug, {
        message: 'request_location_update',
      })).catch(() => { /* ignore */ });
    } catch { /* ignore */ }
  }

  // Clear the active session's `request_location_update` interval, if any.
  private _clearGeoCalibTimer(): void {
    if (this.geoCalib?.reqTimer) {
      clearInterval(this.geoCalib.reqTimer);
      this.geoCalib.reqTimer = null;
    }
  }

  // Start sampling a device_tracker at a landmark. Records the window start,
  // (Android) forces high-accuracy mode + a 5 s update interval, and pumps a
  // `request_location_update` every 25 s (both platforms).
  startGeoCalibration(landmarkId: string, trackerId: string, notifySlug?: string): void {
    this._clearGeoCalibTimer(); // never leak a prior session's pump
    const slug = notifySlug ?? this.notifySlugFor(trackerId);
    this.geoCalib = {
      landmarkId, trackerId, startedAt: new Date().toISOString(),
      notifySlug: slug, seen: 0, used: 0, exclAccuracy: 0, exclSource: 0,
      lastSeenAt: null, reqTimer: null,
    };
    this._sendHighAccuracy(slug, { command: 'force_on' });
    this._sendHighAccuracy(slug, { command: 'high_accuracy_set_update_interval', high_accuracy_update_interval: 5 });
    if (slug) {
      this._requestLocationUpdate(slug); // one immediately, then every 25 s
      this.geoCalib.reqTimer = setInterval(() => this._requestLocationUpdate(slug), 25000);
    }
    this.emitConfig();
  }

  // Classify a device_tracker attribute set against the calibration filter.
  // Returns null when there's no usable lat/lon (not counted as a "seen" fix);
  // otherwise 'source' / 'accuracy' (exclusion buckets) or 'used' (passes).
  // Buckets are exclusive and checked in the same order as the pass test.
  private _geoSampleClass(attrs: Record<string, unknown>): 'used' | 'accuracy' | 'source' | null {
    const lat = attrs.latitude, lon = attrs.longitude;
    if (typeof lat !== 'number' || typeof lon !== 'number') return null;
    const src = attrs.source_type;
    if (src != null && src !== 'gps') return 'source';
    const acc = attrs.gps_accuracy;
    if (typeof acc === 'number' && acc > this.geoAccuracyGate()) return 'accuracy';
    return 'used';
  }

  // Does a device_tracker attribute set pass the calibration filter?
  // source_type must be 'gps' (missing tolerated), gps_accuracy within the gate.
  private _geoSamplePasses(attrs: Record<string, unknown>): boolean {
    return this._geoSampleClass(attrs) === 'used';
  }

  // Live sample accounting — bumps while the panel is open. Called from _onStates
  // on the live path when the calibrated tracker changes.
  private _geoCalibSample(states: Record<string, HassState>, changedId?: string): void {
    const gc = this.geoCalib;
    if (!gc) return;
    if (changedId !== undefined && changedId !== gc.trackerId) return;
    const st = states[gc.trackerId];
    if (!st) return;
    const cls = this._geoSampleClass(st.attributes as Record<string, unknown>);
    if (cls === null) return; // no lat/lon → not a fix
    gc.seen++;
    gc.lastSeenAt = new Date().toISOString();
    if (cls === 'used') gc.used++;
    else if (cls === 'accuracy') gc.exclAccuracy++;
    else gc.exclSource++;
    this.emitConfig();
  }

  // Finish: pull the sampling window from recorder history, filter to usable GPS
  // fixes, and store the independent median lat/lon on the landmark. Keeps old
  // values (with an explanation) if fewer than 5 usable samples. Always sends
  // force_off and clears the session.
  async finishGeoCalibration(): Promise<GeoCalibResult> {
    const gc = this.geoCalib;
    if (!gc) return { ok: false, message: 'No calibration in progress.', count: 0 };
    const { landmarkId, trackerId, startedAt, notifySlug } = gc;
    this._clearGeoCalibTimer();
    this._sendHighAccuracy(notifySlug, { command: 'force_off' });
    this.geoCalib = null;
    const lm = this.store.geo?.landmarks.find(l => l.id === landmarkId);
    if (!lm) { this.emitConfig(); return { ok: false, message: 'Landmark gone.', count: 0 }; }

    let samples: LatLonSample[] = [];
    let exclAccuracy = 0, exclSource = 0;
    try {
      const hist = this.hass ? await this.hass.getHistory([trackerId], startedAt, new Date().toISOString()) : {};
      const rows = hist[trackerId] ?? [];
      for (const r of rows) {
        const cls = this._geoSampleClass(r.attrs);
        if (cls === null) continue; // no lat/lon → not a fix
        if (cls === 'accuracy') { exclAccuracy++; continue; }
        if (cls === 'source') { exclSource++; continue; }
        samples.push({
          lat: r.attrs.latitude as number,
          lon: r.attrs.longitude as number,
          accuracy: typeof r.attrs.gps_accuracy === 'number' ? r.attrs.gps_accuracy as number : undefined,
        });
      }
    } catch { samples = []; exclAccuracy = 0; exclSource = 0; }

    // "N used / M excluded (accuracy: k, source: j)" — makes a failure explainable.
    const excluded = exclAccuracy + exclSource;
    const tally = `${samples.length} used / ${excluded} excluded (accuracy: ${exclAccuracy}, source: ${exclSource})`;

    if (samples.length < 5) {
      this.emitConfig();
      return {
        ok: false, count: samples.length,
        message: `${tally} — need ≥5 used. Try an open-sky spot away from walls and sample longer.`,
      };
    }
    const m = medianLatLon(samples)!;
    this.updateLandmark(landmarkId, l => {
      l.lat = m.lat; l.lon = m.lon;
      l.accuracy = m.accuracy ?? undefined;
      l.sampleCount = m.count;
      l.sampledAt = new Date().toISOString();
    });
    return {
      ok: true, count: m.count,
      message: `Calibrated: ${tally}${m.accuracy != null ? ` · ±${Math.round(m.accuracy)} m` : ''}.`,
    };
  }

  cancelGeoCalibration(): void {
    const gc = this.geoCalib;
    if (!gc) return;
    this._clearGeoCalibTimer();
    this._sendHighAccuracy(gc.notifySlug, { command: 'force_off' });
    this.geoCalib = null;
    this.emitConfig();
  }

  setBleShowUnknown(v: boolean): void {
    this.store.bleShowUnknown = v;
    this.save();
    this.emitConfig();
  }

  // ── Bermuda BLE discovery ─────────────────────────────────────────────
  // Scans the HA entity registry for platform === 'bermuda', groups per-scanner
  // distance entities by tracked device, and matches scanner MACs to placed BLE
  // proxy fixtures through each proxy's bound device's registry `connections`.
  // Runtime-only; call from the sidebar (on demand / refresh button).
  // Build the entity→device + device→sensors maps from the entity registry so
  // batteryFor() can resolve a fixture's low-battery sibling. Called once on
  // connect and again on a manual full refresh (registry could have changed).
  // Fire-and-forget; never throws into the caller.
  async scanBatteryRegistry(): Promise<void> {
    if (!this.hass) return;
    let ents: Awaited<ReturnType<HaApi['getEntityRegistry']>>;
    try {
      ents = await this.hass.getEntityRegistry();
    } catch (err) {
      console.warn('battery registry scan failed:', err);
      return;
    }
    const e2d: Record<string, string> = {};
    const devSensors: Record<string, string[]> = {};
    const devClass: Record<string, string> = {};
    for (const e of ents) {
      if (e.device_id) e2d[e.entity_id] = e.device_id;
      if (e.original_device_class) devClass[e.entity_id] = e.original_device_class;
      if (e.device_id && e.entity_id.startsWith('sensor.')) {
        (devSensors[e.device_id] ??= []).push(e.entity_id);
      }
    }
    this._entityToDevice = e2d;
    this._deviceSensors = devSensors;
    this._entityDeviceClass = devClass;
    this._batteryResolve = {};        // invalidate cached resolutions
    this._batteryRegLoaded = true;
    this.emitConfig();                // sidebar battery text + 2D badges re-render
  }

  // Battery % (0..100) for the HA device that owns `entityId`, from a sibling
  // sensor whose device_class is 'battery'. Returns null when: the registry
  // isn't loaded yet, the entity has no device, no battery sibling exists, or
  // the reading isn't numeric. Cheap — caches the entity→battery-sensor lookup.
  batteryFor(entityId: string | null | undefined): number | null {
    if (!entityId || !this._batteryRegLoaded || !this.hass) return null;
    let battId = this._batteryResolve[entityId];
    if (battId === undefined) {
      battId = this._resolveBatterySibling(entityId);
      // Only cache a definitive result: a positive hit, or a device that simply
      // has no sensor siblings (stable until the registry reloads). Leave the
      // "candidates exist but none identified yet" case unresolved so a sibling
      // whose state loads later still gets picked up.
      const dev = this._entityToDevice[entityId];
      const cands = dev ? (this._deviceSensors[dev] ?? []) : [];
      if (battId !== null || cands.length === 0) this._batteryResolve[entityId] = battId;
    }
    if (!battId) return null;
    const st = this.hass.states[battId];
    if (!st) return null;
    const v = parseFloat(st.state);
    return isFinite(v) ? v : null;
  }

  // Battery % for an HA device directly (used for device-bound fixtures like BLE
  // proxies, which bind a device id rather than an entity id).
  batteryForDevice(deviceId: string | null | undefined): number | null {
    if (!deviceId || !this._batteryRegLoaded || !this.hass) return null;
    const battId = this._resolveDeviceBattery(deviceId);
    if (!battId) return null;
    const v = parseFloat(this.hass.states[battId]?.state ?? '');
    return isFinite(v) ? v : null;
  }

  private _resolveDeviceBattery(deviceId: string): string | null {
    for (const sib of this._deviceSensors[deviceId] ?? []) {
      const regClass = this._entityDeviceClass[sib];
      const stClass = String(this.hass?.states[sib]?.attributes?.device_class ?? '');
      if (regClass === 'battery' || stClass === 'battery') {
        const v = parseFloat(this.hass?.states[sib]?.state ?? '');
        if (isFinite(v)) return sib;
      }
    }
    return null;
  }

  private _resolveBatterySibling(entityId: string): string | null {
    const dev = this._entityToDevice[entityId];
    return dev ? this._resolveDeviceBattery(dev) : null;
  }

  async scanBermuda(): Promise<void> {
    if (!this.hass) return;
    if (this.store.bermudaEnabled === false) return;   // integration disabled in Settings
    let ents: Awaited<ReturnType<HaApi['getEntityRegistry']>>;
    let devs: Awaited<ReturnType<HaApi['getDevices']>>;
    try {
      [ents, devs] = await Promise.all([
        this.hass.getEntityRegistry(),
        this.hass.getDevices(),
      ]);
    } catch (err) {
      console.warn('Bermuda scan failed:', err);
      return;
    }

    // Device registry: id → friendly name, plus normalized connection MACs.
    const devName: Record<string, string> = {};
    const devMacs: Record<string, string[]> = {};
    for (const d of devs) {
      devName[d.id] = d.name_by_user || d.name || d.id;
      const macs: string[] = [];
      for (const [, val] of d.connections ?? []) {
        const m = normMac(val);
        if (m.length >= 12) macs.push(m);
      }
      devMacs[d.id] = macs;
    }

    // Placed BLE proxies (across all floors) → their bound device MACs, so a
    // scanner MAC parsed from a unique_id can resolve to a proxy fixture.
    const proxyByMac: Record<string, string> = {};
    for (const fl of this.store.floors) {
      if (fl.disabled) continue;   // a disabled test floor's proxies must not claim scanner MACs
      for (const bp of fl.bleProxies ?? []) {
        if (!bp.haDeviceId) continue;
        for (const m of devMacs[bp.haDeviceId] ?? []) proxyByMac[m] = bp.id;
      }
    }

    // Group bermuda entities by tracked device_id. The per-scanner range
    // entities carry unique_id `{device_token}_{scanner_mac}_range[_raw]`.
    // The SCANNER token is always a colon-MAC (wifi or BLE address of the
    // proxy), but the DEVICE token is a colon-MAC only for plain BLE devices —
    // iBeacon / Private-BLE metadevices (iPhones, rotating-MAC tags, Bermuda's
    // "preferred" bucket) use uuid-ish tokens, so it must stay permissive.
    const MAC = '[0-9a-f]{2}(?::[0-9a-f]{2}){5}';
    const macOnlyRe = new RegExp(`^${MAC}$`, 'i');
    const rangeRe = new RegExp(`^(.+)_(${MAC})_range(_raw)?$`, 'i');
    interface Acc { deviceId: string | null; mac: string;
                    links: Record<string, BermudaScannerLink>; }
    const byDevice: Record<string, Acc> = {};
    const keyFor = (e: { device_id: string | null; unique_id?: string | null }) =>
      e.device_id ?? `uid:${e.unique_id ?? ''}`;

    for (const e of ents) {
      if (e.platform !== 'bermuda') continue;
      const uid = e.unique_id ?? '';
      const k = keyFor(e);
      if (!byDevice[k]) byDevice[k] = { deviceId: e.device_id, mac: '', links: {} };
      const acc = byDevice[k];
      const m = rangeRe.exec(uid);
      if (m) {
        // Metadevice tokens (iBeacon uuid_major_minor etc.) aren't MACs —
        // keep them verbatim for display instead of hex-stripping them.
        const devMac = macOnlyRe.test(m[1]) ? normMac(m[1]) : m[1];
        const scannerMac = normMac(m[2]);
        const raw = !!m[3];
        if (devMac) acc.mac = devMac;
        if (!acc.links[scannerMac]) {
          acc.links[scannerMac] = {
            scannerMac, rangeEntityId: null, rangeRawEntityId: null,
            disabled: false, proxyId: proxyByMac[scannerMac] ?? null,
          };
        }
        const link = acc.links[scannerMac];
        if (raw) link.rangeRawEntityId = e.entity_id;
        else { link.rangeEntityId = e.entity_id; link.disabled = !!e.disabled_by; }
      } else if (!acc.mac) {
        // Device-level sensor (Area/Distance/Floor): unique_id is the device
        // MAC (optionally with a suffix). Grab the leading MAC token if present.
        const dm = new RegExp(`^(${MAC})`, 'i').exec(uid);
        if (dm) acc.mac = normMac(dm[1]);
      }
    }

    const devicesOut: BermudaDevice[] = [];
    for (const k of Object.keys(byDevice)) {
      const acc = byDevice[k];
      const scanners = Object.values(acc.links);
      // Skip groups with no per-scanner range entities at all (pure noise).
      if (scanners.length === 0 && !acc.deviceId) continue;
      const disabledCount = scanners.filter(s => s.rangeEntityId && s.disabled).length;
      const name = (acc.deviceId && devName[acc.deviceId])
        ? devName[acc.deviceId]
        : (acc.mac || 'Bermuda device');
      devicesOut.push({
        deviceId: acc.deviceId, mac: acc.mac, name, scanners, disabledCount,
      });
    }
    devicesOut.sort((a, b) => a.name.localeCompare(b.name));
    this.bermuda = { devices: devicesOut, scannedAt: Date.now() };
    this._rebuildBleEntityMap();
    this.emitConfig();
  }

  // A stable per-device key for the trilateration pipeline (sample buckets,
  // solve results, lerp slots). The HA device id when present (survives MAC
  // rotation for iPhone/Private-BLE metadevices), else the MAC.
  private bleDeviceKey(dev: BermudaDevice): string {
    return dev.deviceId ?? `mac:${dev.mac}`;
  }

  // Rebuild the entityId → {deviceKey, scannerMac} reverse map from the current
  // Bermuda discovery so the live state_changed path can attribute each range
  // sample to a (device × scanner) bucket. Uses the SMOOTHED range entity only
  // (the raw/unfiltered sensor is noisier and both would double-count).
  private _rebuildBleEntityMap(): void {
    const map: Record<string, { deviceKey: string; scannerMac: string }> = {};
    const info: Record<string, { name: string; deviceId: string | null }> = {};
    for (const dev of this.bermuda?.devices ?? []) {
      const deviceKey = this.bleDeviceKey(dev);
      info[deviceKey] = { name: dev.name, deviceId: dev.deviceId };
      for (const s of dev.scanners) {
        if (s.rangeEntityId) map[s.rangeEntityId] = { deviceKey, scannerMac: s.scannerMac };
      }
    }
    this.bleEntityMap = map;
    this.bleDeviceInfo = info;
  }

  // Record a live BLE range sample (called from _onStates for mapped entities).
  // Bermuda reports meters (with unit attrs) → mm via stateMm. Live-path only —
  // never routed through the config channel (would churn the sidebar).
  private _recordBleSample(entityId: string): void {
    const link = this.bleEntityMap[entityId];
    if (!link) return;
    const mm = this.stateMm(entityId, 1000);   // default native→mm = meters
    if (!isFinite(mm) || mm < 0) return;
    let bucket = this.bleSamples[link.deviceKey];
    if (!bucket) bucket = this.bleSamples[link.deviceKey] = {};
    bucket[link.scannerMac] = { mm, at: Date.now() };
  }

  // Solve every tracked device's position from its fresh per-scanner distances.
  // Per device: on EACH floor, gather the proxies with a fresh distance (scanner
  // link proxyId → placed BleProxy fixture position), solve, and keep the floor
  // with the best (lowest weighted RMS) fix. Event-driven (~0.1 Hz, on new
  // samples), never per frame. Feeds a per-device lerp slot so the 2D dot and
  // 3D rig read one smoothed source.
  private _solveBle(): void {
    if (!this.bermuda) return;
    const now = Date.now();
    const STALE = Planner.BLE_STALE_MS;
    // scannerMac → proxy fixture {x,y} per floor, so a device's scanner samples
    // map to plan positions. Built once per solve (cheap: few proxies).
    for (const dev of this.bermuda.devices) {
      const deviceKey = this.bleDeviceKey(dev);
      const samples = this.bleSamples[deviceKey];
      if (!samples) continue;
      // scannerMac → proxyId from this device's links.
      const proxyIdOf: Record<string, string> = {};
      for (const s of dev.scanners) if (s.proxyId) proxyIdOf[s.scannerMac] = s.proxyId;

      let best: { x: number | null; y: number; floorId: string; conf: number; rms: number; multi: boolean } | null = null;
      const warm = this.bleSolves[deviceKey];
      for (const fl of this.store.floors) {
        if (fl.disabled) continue;   // disabled floors don't participate in the BLE floor solve
        const byId: Record<string, { x: number; y: number }> = {};
        for (const bp of fl.bleProxies ?? []) byId[bp.id] = { x: bp.x, y: bp.y };
        const obs: ProxyObs[] = [];
        for (const mac of Object.keys(samples)) {
          const smp = samples[mac];
          const age = now - smp.at;
          if (age > STALE) continue;
          const pid = proxyIdOf[mac];
          if (!pid) continue;
          const pos = byId[pid];
          if (!pos) continue;   // proxy lives on a different floor
          const w = Math.max(0.02, 1 - age / STALE);   // linear staleness decay
          obs.push({ x: pos.x, y: pos.y, d: smp.mm, w });
        }
        if (obs.length === 0) continue;
        const warmSame = warm && warm.floorId === fl.id ? { x: warm.x, y: warm.y } : undefined;
        const sol = solvePosition(obs, warmSame);
        if (!sol) continue;
        let x: number | null, y = 0, conf: number, rms: number, multi = false;
        if (sol.kind === 'single') {
          // Hold last position on THIS floor if we had one; confidence = ring.
          if (!warm || warm.floorId !== fl.id) continue;   // nothing to hold
          x = warm.x; y = warm.y; conf = sol.constraint!.d; rms = sol.constraint!.d;
        } else {
          x = sol.x!; y = sol.y!; multi = sol.kind === 'gn';
          rms = sol.rms;
          conf = sol.kind === 'gn'
            ? Math.min(8000, Math.max(400, rms * 1.5))
            : Math.min(8000, Math.max(800, obs.reduce((m, o) => Math.min(m, o.d), Infinity)));
        }
        // Rank: multi-proxy (gn) beats segment beats single; tie-break by rms.
        const better = !best
          || (multi && !best.multi)
          || (multi === best.multi && rms < best.rms);
        if (better && x !== null) best = { x, y, floorId: fl.id, conf, rms, multi };
      }
      if (best && best.x !== null) {
        this.bleSolves[deviceKey] = {
          x: best.x, y: best.y, floorId: best.floorId, confidenceMm: best.conf, updatedAt: now,
        };
        // Feed the per-device lerp slot (snap on first activation).
        const lk = `ble_${deviceKey}`;
        let slot = this.lerpBy[lk]?.[0];
        if (!slot) {
          slot = { cx: best.x, cy: best.y, tx: best.x, ty: best.y, vx: 0, vy: 0, active: true };
          this.lerpBy[lk] = [slot];
        } else if (!slot.active) {
          slot.cx = best.x; slot.cy = best.y; slot.vx = 0; slot.vy = 0; slot.active = true;
        }
        slot.tx = best.x; slot.ty = best.y; slot.active = true;
      }
    }
    // Tier 2: watch for identified people changing floors → commit transits.
    this._watchFloorTransits();
  }

  // ── Cross-floor transits (Tier 2) ─────────────────────────────────────────
  // Track each identified BLE person's solved floor; commit a transit record
  // when it changes (with hysteresis) so the renderer can hand a rig off at a
  // linked stair. Allocation-light (runs on the LIVE solve path): a handful of
  // people, no per-call arrays beyond a couple of small maps. Cheap no-op when
  // no person carries a Bermuda device.
  private _watchFloorTransits(now = Date.now()): void {
    const people = this.store.people;
    if (!people || !people.some(pe => pe.bermudaDeviceId)) return;
    // deviceId → deviceKey (so a person's bermudaDeviceId finds its solve).
    const keyOfDevice: Record<string, string> = {};
    for (const deviceKey of Object.keys(this.bleDeviceInfo)) {
      const id = this.bleDeviceInfo[deviceKey].deviceId;
      if (id) keyOfDevice[id] = deviceKey;
    }
    let changed = false;
    for (const pe of people) {
      if (!pe.bermudaDeviceId) continue;
      const deviceKey = keyOfDevice[pe.bermudaDeviceId];
      const sol = deviceKey ? this.bleSolves[deviceKey] : undefined;
      if (!sol) continue;                         // no live solve — nothing to track
      const newFloor = sol.floorId;
      let tk = this._transitTrack[pe.id];
      if (!tk) { this._transitTrack[pe.id] = { floorId: newFloor, candFloorId: null, candSince: 0, candCount: 0 }; continue; }
      if (newFloor === tk.floorId) {              // stable on the established floor
        tk.candFloorId = null; tk.candCount = 0; continue;
      }
      // A candidate flip to a different floor — hold it before committing.
      if (tk.candFloorId === newFloor) tk.candCount++;
      else { tk.candFloorId = newFloor; tk.candSince = now; tk.candCount = 1; }
      if (tk.candCount >= Planner.TRANSIT_MIN_SOLVES && (now - tk.candSince) >= Planner.TRANSIT_HOLD_MS) {
        const viaLinkId = this._resolveStairLink(tk.floorId, newFloor);
        this.floorTransits[pe.id] = { fromFloorId: tk.floorId, toFloorId: newFloor, viaLinkId, at: now };
        tk.floorId = newFloor; tk.candFloorId = null; tk.candCount = 0;
        changed = true;
      }
    }
    // Prune stale committed transits.
    for (const pid of Object.keys(this.floorTransits)) {
      if (now - this.floorTransits[pid].at > Planner.TRANSIT_PRUNE_MS) { delete this.floorTransits[pid]; changed = true; }
    }
    // Repaint (sidebar "on <floor>" suffix / 2D chip) only when the set changed.
    if (changed) this.emitConfig();
  }

  // Find a stairLinkId carried by a stairs-family piece on BOTH floors (the same
  // opaque id on each), i.e. a stair portal linking them. undefined = no link.
  private _resolveStairLink(floorAId: string, floorBId: string): string | undefined {
    const linksOn = (fid: string): Set<string> => {
      const out = new Set<string>();
      const fl = this.store.floors.find(f => f.id === fid);
      if (fl) for (const fu of fl.furniture)
        if (fu.stairLinkId && isStairsKind(fu.kind)) out.add(fu.stairLinkId);
      return out;
    };
    const a = linksOn(floorAId), b = linksOn(floorBId);
    for (const id of a) if (b.has(id)) return id;
    return undefined;
  }

  // Latest committed transit for a person id (Store.people id), or null. Cheap
  // map hit — safe per frame. Records prune after TRANSIT_PRUNE_MS.
  transitFor(personId: string): FloorTransit | null {
    return this.floorTransits[personId] ?? null;
  }

  // The floor a person's BLE device is currently solved on, or null. Cheap
  // (a couple of map hits) — used by the People sidebar "on <floor>" suffix.
  solvedFloorIdFor(personId: string): string | null {
    const pe = this.store.people?.find(p => p.id === personId);
    if (!pe?.bermudaDeviceId) return null;
    for (const deviceKey of Object.keys(this.bleDeviceInfo)) {
      if (this.bleDeviceInfo[deviceKey].deviceId === pe.bermudaDeviceId)
        return this.bleSolves[deviceKey]?.floorId ?? null;
    }
    return null;
  }

  // ── Stair-link editing (Tier 2, sidebar) ──────────────────────────────────
  // Link a stairs-family piece on the current floor to a stairs-family partner
  // on ANOTHER floor under one opaque id. Planner owns store.floors so it mutates
  // BOTH pieces (the partner lives on a different floor). A link is a 1:1 pairing,
  // so any prior link on either endpoint is cleared first. One save + emitConfig.
  linkStairs(primaryId: string, partnerFloorId: string, partnerId: string): void {
    const a = this.floor().furniture.find(f => f.id === primaryId);
    const pf = this.store.floors.find(f => f.id === partnerFloorId);
    const b = pf?.furniture.find(f => f.id === partnerId);
    if (!a || !b || a === b) return;
    this._unlinkStairPartners(a.stairLinkId);
    this._unlinkStairPartners(b.stairLinkId);
    const id = newId('sl');
    a.stairLinkId = id; b.stairLinkId = id;
    this.save(); this.emitConfig();
  }

  // Clear a piece's stair link from BOTH sides (also heals a broken link whose
  // partner was deleted — the id is simply cleared off this piece).
  clearStairLink(primaryId: string): void {
    const a = this.floor().furniture.find(f => f.id === primaryId);
    if (!a?.stairLinkId) return;
    this._unlinkStairPartners(a.stairLinkId);
    this.save(); this.emitConfig();
  }

  // Strip a stairLinkId off EVERY piece across ALL floors carrying it.
  private _unlinkStairPartners(linkId?: string): void {
    if (!linkId) return;
    for (const fl of this.store.floors)
      for (const fu of fl.furniture)
        if (fu.stairLinkId === linkId) fu.stairLinkId = undefined;
  }

  // Find the partner piece of a linked stairs piece (same stairLinkId, different
  // piece), plus its floor. null = unlinked OR a broken link (partner deleted).
  stairLinkPartner(piece: { id: string; stairLinkId?: string }): { floor: Floor; piece: import('./types.js').Furniture } | null {
    if (!piece.stairLinkId) return null;
    for (const fl of this.store.floors)
      for (const fu of fl.furniture)
        if (fu.id !== piece.id && fu.stairLinkId === piece.stairLinkId) return { floor: fl, piece: fu };
    return null;
  }

  // Resolve the runtime BLE people list for rendering. Reads the latest solves,
  // maps each to a Store.people identity (else "unknown", gated by
  // bleShowUnknown), and returns the LERPED position so 2D and 3D agree. Retires
  // devices unheard-from past BLE_RETIRE_MS (drops their lerp slot too). Cheap
  // (a handful of devices) — safe to call each frame.
  get blePeople(): BlePerson[] {
    if (this.store.bermudaEnabled === false) return [];   // integration disabled: hide all BLE targets/dots/fusion
    const now = Date.now();
    const showUnknown = this.store.bleShowUnknown !== false;
    const out: BlePerson[] = [];
    for (const deviceKey of Object.keys(this.bleSolves)) {
      const sol = this.bleSolves[deviceKey];
      const age = now - sol.updatedAt;
      if (age > Planner.BLE_RETIRE_MS) {
        delete this.bleSolves[deviceKey];
        delete this.bleSamples[deviceKey];
        delete this.lerpBy[`ble_${deviceKey}`];
        continue;
      }
      const info = this.bleDeviceInfo[deviceKey];
      const devId = info?.deviceId ?? null;
      const person = devId ? this.store.people?.find(p => p.bermudaDeviceId === devId) : undefined;
      if (!person && !showUnknown) continue;
      const slot = this.lerpBy[`ble_${deviceKey}`]?.[0];
      const x = slot ? slot.cx : sol.x;
      const y = slot ? slot.cy : sol.y;
      out.push({
        key: `ble_${deviceKey}`,
        personId: person?.id,
        name: person?.name ?? info?.name ?? 'Unknown',
        color: person?.color ?? '#9e9e9e',
        avatarKind: person?.avatarKind,
        isPet: person?.isPet,
        x, y,
        floorId: sol.floorId,
        confidenceMm: sol.confidenceMm,
        updatedAt: sol.updatedAt,
        stale: age > Planner.BLE_STALE_MS,
      });
    }
    return out;
  }

  // BLE people whose identity has NOT been fused onto a radar target. Renderers
  // draw ghost rigs only for these — a fused person's ghost hides (the radar
  // target now carries their avatar/label), so a physical person never renders
  // twice. Reads the last _fuseIdentities result (fusedPersonIds).
  get bleUnfused(): BlePerson[] {
    return this.blePeople.filter(bp => !this.fusedPersonIds.has(bp.key));
  }

  // ── Identity fusion (Feature B, phase B3) ─────────────────────────────────
  // Match each live BLE person to at most one live mmWave radar target on the
  // SAME floor, with hysteresis both ways (see src/fusion.ts). Candidates use the
  // LERPED radar positions — the same source the renderer/2D draw — so the gate
  // is judged against what the user sees. Runs on each BLE solve and a ~2 s timer;
  // both are no-ops when no BLE people exist. Deterministic core; this method only
  // gathers candidates, times the tick, and decorates the output.
  private _fuseIdentities(): void {
    const people = this.blePeople;
    const now = Date.now();
    const dtMs = this._lastFuseAt ? Math.max(0, now - this._lastFuseAt) : 0;
    this._lastFuseAt = now;

    if (people.length === 0) {
      // Nothing to match — clear any residual fusion output/state cheaply.
      if (this.fusedPersonIds.size || Object.keys(this.fusions).length) {
        this._fusionState = newFusionState();
        this.fusions = {}; this.fusedPersonIds = new Set(); this._fusionSince = {};
        this.emitConfig();
      }
      return;
    }

    // Live radar targets (lerped world positions) grouped by floor, mirroring
    // three-view / canvas-render: per bound sensor, up to 3 active lerp slots.
    interface RTarget { key: string; x: number; y: number; floorId: string }
    const radar: RTarget[] = [];
    for (const fl of this.store.floors) {
      if (fl.disabled) continue;   // don't fuse identities onto a disabled test floor's radar targets
      for (const s of fl.sensors) {
        if (!s.deviceSlug || !this.discBy[s.id]) continue;
        const lerp = this.lerpBy[s.id];
        if (!lerp) continue;
        for (let i = 0; i < 3; i++) {
          const sl = lerp[i];
          if (!sl || !sl.active) continue;
          const wp = localToWorld(s, sl.cx, sl.cy);
          radar.push({ key: `${s.id}_${i}`, x: wp.x, y: wp.y, floorId: fl.id });
        }
      }
    }

    // Candidate proximities: every (person, target) pair on a shared floor. N is
    // tiny (a few people × ≤3 targets/sensor). All pairs are supplied — even
    // beyond the gate — so the release logic can measure a fused pair separating.
    const cands: FusionCand[] = [];
    const presentPersons = new Set<string>();
    const stalePersons = new Set<string>();
    const presentTargets = new Set<string>();
    for (const rt of radar) presentTargets.add(rt.key);
    for (const bp of people) {
      presentPersons.add(bp.key);
      if (bp.stale) stalePersons.add(bp.key);
      const gate = Math.max(DEFAULT_FUSION_CFG.baseGateMm, bp.confidenceMm);
      for (const rt of radar) {
        if (rt.floorId !== bp.floorId) continue;
        cands.push({
          personId: bp.key, targetKey: rt.key,
          distMm: Math.hypot(rt.x - bp.x, rt.y - bp.y), gateMm: gate,
        });
      }
    }

    stepFusion(this._fusionState, { cands, presentPersons, stalePersons, presentTargets }, dtMs);

    // Decorate the committed pairs into the render-ready `fusions` map. `since`
    // is stamped once per targetKey and cleared when the pair releases.
    const byKey: Record<string, BlePerson> = {};
    for (const bp of people) byKey[bp.key] = bp;
    const nextFusions: Record<string, Fusion> = {};
    const nextFused = new Set<string>();
    const nextSince: Record<string, number> = {};
    for (const targetKey of Object.keys(this._fusionState.fused)) {
      const pid = this._fusionState.fused[targetKey].personId;
      const bp = byKey[pid];
      if (!bp) continue;   // person vanished between step + decorate (guard)
      const since = this._fusionSince[targetKey] ?? now;
      nextSince[targetKey] = since;
      nextFusions[targetKey] = {
        personId: bp.personId, name: bp.name, color: bp.color,
        avatarKind: bp.avatarKind, isPet: bp.isPet, since,
      };
      nextFused.add(bp.key);
    }
    this._fusionSince = nextSince;

    // Repaint only when the fusion set actually changed (targetKey↔person pairs),
    // so the ~2 s timer doesn't churn the sidebar/config every tick.
    const changed = this._fusionSetChanged(nextFusions);
    this.fusions = nextFusions;
    this.fusedPersonIds = nextFused;
    if (changed) this.emitConfig();
  }

  private _fusionSetChanged(next: Record<string, Fusion>): boolean {
    const a = Object.keys(this.fusions), b = Object.keys(next);
    if (a.length !== b.length) return true;
    for (const k of b) if (!this.fusions[k] || this.fusions[k].personId !== next[k].personId) return true;
    return false;
  }

  // Consent-gated enable: flip disabled_by to null on every disabled per-scanner
  // smoothed range entity of a tracked device. HA reloads those entities (may
  // take ~30 s / an integration reload before they report).
  async enableBermudaDevice(dev: BermudaDevice): Promise<void> {
    if (!this.hass) return;
    const targets = dev.scanners.filter(s => s.rangeEntityId && s.disabled);
    for (const s of targets) {
      try {
        await this.hass.updateEntityRegistry(s.rangeEntityId!, { disabled_by: null });
        s.disabled = false;
      } catch (err) {
        console.warn('Bermuda enable failed for', s.rangeEntityId, err);
      }
    }
    dev.disabledCount = dev.scanners.filter(s => s.rangeEntityId && s.disabled).length;
    this.emitConfig();
  }

  // ── Weather ───────────────────────────────────────────────────────────────
  // Mutate the weather config (creating a sensible default the first time),
  // persist, re-apply the source, and repaint. The sidebar edits go through
  // here so switching sources restarts / stops the Open-Meteo poll cleanly.
  setWeather(mut: (w: WeatherConfig) => void): void {
    if (!this.store.weather) {
      this.store.weather = { source: 'openmeteo', chip: true, effects3d: true, affectLighting: true };
    }
    mut(this.store.weather);
    this.save();
    this._reconfigureWeather();
    this.emitConfig();
  }

  // Force a fresh geocode of the configured zip (clears the cached lat/lon) and
  // re-poll. Sidebar "Search" button.
  async refreshWeatherLocation(): Promise<void> {
    const w = this.store.weather;
    if (!w) return;
    w.lat = undefined; w.lon = undefined; w.placeLabel = undefined;
    this.save();
    this.emitConfig();
    await this._pollOpenMeteo();
  }

  // (Re)apply the current weather source: (re)start or stop the Open-Meteo
  // timer, or recompute a local source from current states. Idempotent.
  private _reconfigureWeather(): void {
    if (this._weatherTimer) { clearInterval(this._weatherTimer); this._weatherTimer = null; }
    if (this._weatherFcTimer) { clearInterval(this._weatherFcTimer); this._weatherFcTimer = null; }
    // Forecast state is source-specific — drop it so a source switch can't leak
    // the previous entity's forecast onto a new one.
    this._fcCond = undefined; this._fcRainSoon = undefined;
    const w = this.store.weather;
    if (!w) { this.weatherNow = null; return; }
    if (w.source === 'openmeteo') {
      void this._pollOpenMeteo();
      this._weatherTimer = setInterval(() => void this._pollOpenMeteo(), Planner.WEATHER_POLL_MS);
    } else {
      this._recomputeLocalWeather(this.hass?.states ?? {});
    }
    // Entity source: pull the forecast via the modern service call (30 min poll).
    if (w.source === 'entity' && w.entityId) {
      void this._refreshEntityForecasts();
      this._weatherFcTimer = setInterval(
        () => void this._refreshEntityForecasts(), Planner.WEATHER_FC_MS);
    }
  }

  // Fetch the bound weather entity's daily + hourly forecast (HA 2024.4+ service
  // path) and fold the derived bits over weatherNow. All failures are swallowed
  // (getWeatherForecasts returns null); never throws into the tick path.
  private async _refreshEntityForecasts(): Promise<void> {
    const w = this.store.weather;
    if (!w || w.source !== 'entity' || !w.entityId || !this.hass) return;
    const eid = w.entityId;
    try {
      const daily = await this.hass.getWeatherForecasts(eid, 'daily');
      if (daily && daily.length && typeof daily[0].condition === 'string') {
        this._fcCond = daily[0].condition as HaCondition;
      }
      const hourly = await this.hass.getWeatherForecasts(eid, 'hourly');
      // null → entity exposes no hourly forecast; leave rainSoon undefined.
      if (hourly) this._fcRainSoon = forecastRainSoon(hourly, Date.now());
      if (this._applyForecastToNow()) this.emitConfig();
    } catch { /* never throw into the tick/RAF path */ }
  }

  // Overlay the service-fetched forecast (condition + rainSoon) onto the current
  // weatherNow (entity source only — the local recompute rebuilds weatherNow
  // from scratch, so this re-applies each time). The service condition wins over
  // the legacy `forecast` attribute; when unfetched, the attribute value stands.
  // Returns true when it changed something (so the caller can repaint).
  private _applyForecastToNow(): boolean {
    const w = this.store.weather;
    if (!w || w.source !== 'entity' || !this.weatherNow) return false;
    let changed = false;
    if (this._fcCond !== undefined && this.weatherNow.forecastCondition !== this._fcCond) {
      this.weatherNow.forecastCondition = this._fcCond; changed = true;
    }
    if (this._fcRainSoon !== undefined && this.weatherNow.rainSoon !== this._fcRainSoon) {
      this.weatherNow.rainSoon = this._fcRainSoon; changed = true;
    }
    return changed;
  }

  // Recompute WeatherNow from a weather.* entity or the local station sensors.
  // Pure read of `states` + weather.ts helpers; never touches the network.
  private _recomputeLocalWeather(states: Record<string, HassState>): void {
    const w = this.store.weather;
    if (!w) { this.weatherNow = null; return; }
    if (w.source === 'entity') {
      const st = w.entityId ? states[w.entityId] : null;
      if (!st) {
        this.weatherNow = w.entityId
          ? { condition: 'exceptional', tempC: null, windKmh: null, windBearing: null, isDay: isDay(states), stale: true }
          : null;
        return;
      }
      this.weatherNow = resolveWeatherEntity(st.state, st.attributes, states);
      // Re-apply the service-fetched forecast (recompute rebuilt weatherNow).
      this._applyForecastToNow();
    } else if (w.source === 'sensors') {
      const s = w.sensors ?? {};
      const read = (id?: string): { v: number; unit: string } | null => {
        if (!id) return null;
        const e = states[id];
        if (!e) return null;
        const v = parseFloat(e.state);
        if (isNaN(v)) return null;
        return { v, unit: String((e.attributes as Record<string, unknown>)?.unit_of_measurement ?? '') };
      };
      const p = read(s.precip), t = read(s.temp), wd = read(s.windSpeed);
      const lightE = s.lightning ? states[s.lightning] : null;
      this.weatherNow = deriveFromSensors({
        precipMmH: p ? toMmPerH(p.v, p.unit) : null,
        tempC: t ? toCelsius(t.v, t.unit) : null,
        windKmh: wd ? toKmh(wd.v, wd.unit) : null,
        lightning: lightE ? lightE.state === 'on' : false,
        isDay: isDay(states),
      });
    }
  }

  // Poll Open-Meteo: resolve a location (cached lat/lon → geocode the zip →
  // zone.home), fetch, and hold the last value on failure (marking it stale
  // after WEATHER_STALE_MS). All network work is inside weather.ts try/catch —
  // this never throws into the tick/RAF path.
  private async _pollOpenMeteo(): Promise<void> {
    const w = this.store.weather;
    if (!w || w.source !== 'openmeteo') return;
    let lat = w.lat, lon = w.lon;
    // Geocode the zip once, then cache lat/lon/label via save() (no-op in kiosk).
    if ((lat == null || lon == null) && w.zip && !this._weatherGeocoding) {
      this._weatherGeocoding = true;
      try {
        const g = await geocodeZip(w.zip);
        if (g && this.store.weather && this.store.weather.source === 'openmeteo') {
          this.store.weather.lat = lat = g.lat;
          this.store.weather.lon = lon = g.lon;
          this.store.weather.placeLabel = g.label;
          this.save();
          this.emitConfig();
        }
      } catch { /* geocode failure — try zone.home below */ }
      finally { this._weatherGeocoding = false; }
    }
    // Fall back to HA's zone.home coordinates when no zip / geocode result.
    if (lat == null || lon == null) {
      const home = this.hass?.states?.['zone.home'];
      const a = (home?.attributes ?? {}) as Record<string, unknown>;
      const hlat = parseFloat(String(a.latitude)), hlon = parseFloat(String(a.longitude));
      if (isFinite(hlat) && isFinite(hlon)) { lat = hlat; lon = hlon; }
    }
    if (lat == null || lon == null) return;   // no location resolvable yet
    if (this._weatherFetching) return;
    this._weatherFetching = true;
    try {
      const now = await fetchOpenMeteo(lat, lon);
      if (now) {
        now.label = w.placeLabel ?? now.label;
        this.weatherNow = now;
        this._weatherOkAt = Date.now();
        this.emitConfig();
      } else if (this.weatherNow && Date.now() - this._weatherOkAt > Planner.WEATHER_STALE_MS && !this.weatherNow.stale) {
        // Offline / failing past the freshness window — keep the last value but mark it stale.
        this.weatherNow = { ...this.weatherNow, stale: true };
        this.emitConfig();
      }
    } finally {
      this._weatherFetching = false;
    }
  }

  // ── View ────────────────────────────────────────────────────────────────
  setView(v: '2d' | '3d'): void {
    this.view = v;
    // Persist per-device so re-entering the panel restores the last view.
    try { localStorage.setItem('diorama:view', v); } catch { /* private-mode Safari throws */ }
    this.emitConfig();
  }

  // Toggle whatever entity is bound — chooses the correct domain service
  // based on the entity_id, so a "switch" fixture wired to a light entity
  // calls light.toggle (not switch.toggle, which would 404).
  toggleEntity(entity_id: string | null | undefined): void {
    if (this.uiMode === 'view') return;  // visualization only — no control
    if (!this.hass || !entity_id) return;
    const dot = entity_id.indexOf('.');
    const domain = dot > 0 ? entity_id.slice(0, dot) : '';
    // homeassistant.toggle is a generic fallback for any toggleable entity.
    this.hass.callService(domain || 'homeassistant', 'toggle', { entity_id });
  }

  // Effective state for an interactive item (light / switch / door / window /
  // furniture): the SINGLE resolver every render + interaction consumer routes
  // through. Bound → the live HA state (exactly today's semantics). Unbound but
  // carrying a `localState` → a synthetic envelope so the panel renders the
  // locally-set state without any HA entity. Unbound + no localState → null
  // (unconfigured, renders inert). Once an entity is bound the localState is
  // inert (bound wins) but is kept, so unbinding returns to the last local state.
  effectiveState(item: { entity_id?: string | null; localState?: string }): HassState | null {
    if (item.entity_id) return this.hass?.states?.[item.entity_id] ?? null;
    if (item.localState) return { state: item.localState, attributes: {}, entity_id: '' } as HassState;
    return null;
  }

  // Toggle an interactive item. Bound → toggle the HA entity (correct domain,
  // as toggleEntity). Unbound → flip the item's local control state ('on'↔'off';
  // 'playing' counts as on) so an object without an HA binding can still be
  // controlled from the panel. Local toggles emitConfig (so 3D dirty keys that
  // hash configRev rebuild) and save() — but save() no-ops outside edit mode, so
  // a kiosk device's local toggles are SESSION-ONLY (never written back to HA or
  // even localStorage). View mode makes no changes at all.
  toggleItem(item: { entity_id?: string | null; localState?: string }): void {
    if (this.uiMode === 'view') return;  // visualization only — no control
    if (item.entity_id) { this.toggleEntity(item.entity_id); return; }
    const on = item.localState === 'on' || item.localState === 'playing';
    item.localState = on ? 'off' : 'on';
    this.save();        // no-op outside edit → kiosk local toggles are session-only
    this.emitConfig();  // bumps configRev → 3D dirty keys rebuild; sidebar re-renders
  }

  // Resolve a door's lock state ('locked' | 'unlocked' | undefined): bound
  // lock.* entity wins; else the unbound local flag.
  doorLockState(door: { lockEntity?: string | null; lockLocalState?: 'locked' | 'unlocked' }): 'locked' | 'unlocked' | undefined {
    if (door.lockEntity) {
      const s = this.hass?.states?.[door.lockEntity]?.state;
      return s === 'locked' ? 'locked' : s === 'unlocked' ? 'unlocked' : undefined;
    }
    return door.lockLocalState;
  }

  // Toggle a door's lock. Bound → lock.lock / lock.unlock (fire-and-forget).
  // Unbound → flip lockLocalState (session-only in kiosk, like toggleItem).
  // View mode refuses. Currently-locked → unlock; anything else → lock.
  toggleDoorLock(door: { lockEntity?: string | null; lockLocalState?: 'locked' | 'unlocked' }): void {
    if (this.uiMode === 'view') return;
    const locked = this.doorLockState(door) === 'locked';
    if (door.lockEntity) {
      if (!this.hass) return;
      try {
        void Promise.resolve(
          this.hass.callService('lock', locked ? 'unlock' : 'lock', { entity_id: door.lockEntity }),
        ).catch(() => { /* ignore */ });
      } catch { /* ignore */ }
      return;
    }
    door.lockLocalState = locked ? 'unlocked' : 'locked';
    this.save();        // no-op outside edit → kiosk lock toggles are session-only
    this.emitConfig();  // configRev → _keyDoors rebuild (unbound state) + sidebar re-render
  }

  // Whether the bound entity is something the LightConfig modal can handle.
  isLightEntity(entity_id: string | null | undefined): boolean {
    return !!entity_id && entity_id.startsWith('light.');
  }

  resetView(): void {
    this.viewCenter = null;
    this.zoom = 1;
    this.emitConfig();
  }

  // Translate ALL content on the current floor by (dx, dy) world mm. Used by the
  // floor-edge drag when the left / bottom boundary moves (so the plan stays
  // glued to the opposite edge). This is a FRAME change, not an individual item
  // edit, so LOCKED items translate too. Covers every placeable + bg / model3d
  // offsets + room anchors. Sensor zoneCaches are sensor-local so they ride
  // along for free. Geo landmarks are world-frame + shared across floors, so
  // they only translate for single-floor plans (a shared frame must not be
  // silently shifted by a per-floor origin edit on multi-floor plans).
  translateFloorContent(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return;
    const f = this.floor();
    for (const w of f.walls) w.points = w.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
    for (const it of f.furniture) { it.x += dx; it.y += dy; }
    for (const it of f.lights) { it.x += dx; it.y += dy; }
    for (const it of f.switches) { it.x += dx; it.y += dy; }
    for (const it of f.sensors) { it.x += dx; it.y += dy; }
    for (const it of f.motionSensors) { it.x += dx; it.y += dy; }
    for (const it of f.envSensors ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.bleProxies ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.alarmPanels ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.safetySensors ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.robots ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.cameras ?? []) { it.x += dx; it.y += dy; }
    for (const z of f.presenceZones ?? []) z.points = z.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
    for (const g of f.groundAreas ?? []) g.points = g.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
    for (const vd of f.voidAreas ?? []) vd.points = vd.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
    for (const it of f.doors ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.windows ?? []) { it.x += dx; it.y += dy; }
    for (const rm of f.rooms ?? []) { rm.anchor.x += dx; rm.anchor.y += dy; }
    if (f.bg) { f.bg.x += dx; f.bg.y += dy; }
    if (f.model3d) { f.model3d.x += dx; f.model3d.y += dy; }
    if (this.store.floors.length === 1 && this.store.geo?.landmarks) {
      for (const lm of this.store.geo.landmarks) { lm.x += dx; lm.y += dy; }
    }
  }

  // ── Floor management ────────────────────────────────────────────────────
  switchFloor(id: string): void {
    this.store.currentFloorId = id;
    this.store.activeSensorId = null;
    this.activeMotionId = null;
    this.activeEnvId = null;
    this.activeBleId = null;
    this.activeAlarmId = null;
    this.activeSafetyId = null;
    this.activeRobotId = null;
    this.activeCameraId = null;
    this.activePZoneId = null;
    this.drawingPresenceZone = null;
    this.activeGroundAreaId = null;
    this.drawingGroundArea = null;
    this.activeVoidAreaId = null;
    this.drawingVoidArea = null;
    this.robotStates = {};   // positions are per-floor; recomputed on the new floor
    this.activeFurnitureId = null;
    // Reset pan/zoom — viewCenter is in world mm and a different floor has
    // a different coord space; keeping it would leave the new floor offscreen.
    this.viewCenter = null;
    this.zoom = 1;
    // Clear in-flight interactions
    this.drag = null;
    this.editZone = null;
    this.drawingWall = null;
    this.save();
    this.emitConfig();
  }

  saveFloorEdit(editingId: string | null, name: string, w: number, d: number): void {
    if (editingId) {
      const f = this.store.floors.find(x => x.id === editingId);
      if (f) { f.name = name; f.w = w; f.d = d; }
    } else {
      const id = newId('f');
      this.store.floors.push(repairFloor({ id, name, w, d }));
      this.store.currentFloorId = id;
      this.store.activeSensorId = null;
    }
    this.save();
    this.emitConfig();
  }

  // Move a floor up/down in the canonical Store.floors order (which every
  // consumer — sidebar list, topbar select, glass-house ghost stacking —
  // renders in). No-op at the array ends.
  moveFloor(id: string, dir: -1 | 1): void {
    const floors = this.store.floors;
    const i = floors.findIndex(f => f.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= floors.length) return;
    [floors[i], floors[j]] = [floors[j], floors[i]];
    this.save();
    this.emitConfig();
  }

  // Floors visible to the kiosk/view floor picker (and glass-house / BLE). A
  // disabled floor stays editable but drops out of the live views. Robust
  // fallback: if EVERY floor is disabled, return all — never an empty picker.
  enabledFloors(): Floor[] {
    const enabled = this.store.floors.filter(f => !f.disabled);
    return enabled.length ? enabled : this.store.floors;
  }

  // Toggle a floor's disabled flag. `disabled || undefined` so a cleared flag
  // doesn't persist. Does NOT auto-switch away from a disabled current floor in
  // edit mode — editing a disabled floor is the whole point.
  setFloorDisabled(id: string, disabled: boolean): void {
    const f = this.store.floors.find(x => x.id === id);
    if (!f) return;
    f.disabled = disabled || undefined;
    this.save();
    this.emitConfig();
  }

  deleteFloor(id: string): boolean {
    if (this.store.floors.length <= 1) return false;
    this.store.floors = this.store.floors.filter(f => f.id !== id);
    this.store.currentFloorId = this.store.floors[0].id;
    this.store.activeSensorId = null;
    this.save();
    this.emitConfig();
    return true;
  }

  // ── Lerp tick (called from canvas RAF) ──────────────────────────────────
  updateLerpGoals(): void {
    if (!this.hass) return;
    const states = this.hass.states;
    const f = this.floor();
    for (const s of f.sensors) {
      if (!s.deviceSlug) continue;
      const d = this.discBy[s.id]; if (!d) continue;
      const lerp = this.lerpBy[s.id]; if (!lerp) continue;
      for (let i = 0; i < 3; i++) {
        const useAvg = !this.useRawTargets && !!d.avgX[i];
        const xId = useAvg ? d.avgX[i] : d.targets[i]?.x_id;
        const yId = useAvg ? d.avgY[i] : d.targets[i]?.y_id;
        const toMM = useAvg ? 1 : 10;
        if (!xId || !yId) { lerp[i].active = false; continue; }
        const x = this.stateMm(xId, toMM);
        const y = this.stateMm(yId, toMM);
        if (isNaN(x) || isNaN(y)) { lerp[i].active = false; continue; }
        let active: boolean;
        if (d.targetActive[i]) active = states[d.targetActive[i]!]?.state === 'on';
        else                   active = (x !== 0 || y !== 0);
        if (active) {
          if (!lerp[i].active) { lerp[i].cx = x; lerp[i].cy = y; lerp[i].vx = 0; lerp[i].vy = 0; }
          lerp[i].tx = x; lerp[i].ty = y; lerp[i].active = true;
        } else { lerp[i].active = false; }
      }
    }
  }

  stepLerp(dt: number): void {
    this.updateLerpGoals();
    // Critically damped spring toward the latest HA goal. HA pushes LD2450
    // coordinates at only a few Hz; the previous exponential ease made the
    // position surge right after every push and stall before the next, so
    // velocity pulsed at the HA update rate — the 3D walk cycle inherited
    // the lurch. The spring keeps velocity continuous across goal updates.
    // ω = 9 rad/s: ~0.6 s settle, trails a walking target by ~0.3 m.
    // Substep big frames (tab-switch resume, GC hiccup): one semi-implicit
    // Euler step at the caller's 0.1 s dt clamp puts ω·dt at 0.9, where the
    // velocity update coefficient (1 − 2ω·dt) goes negative and the spring
    // rings before settling. ω·h ≤ ~0.36 keeps it monotone.
    const w = 9;
    const steps = Math.max(1, Math.ceil(dt / 0.04));
    const h = dt / steps;
    for (const id of Object.keys(this.lerpBy)) {
      for (const sl of this.lerpBy[id]) {
        if (!sl.active) continue;
        for (let k = 0; k < steps; k++) {
          sl.vx += ((sl.tx - sl.cx) * w * w - 2 * w * sl.vx) * h;
          sl.vy += ((sl.ty - sl.cy) * w * w - 2 * w * sl.vy) * h;
          sl.cx += sl.vx * h;
          sl.cy += sl.vy * h;
        }
      }
    }
  }

  // ── Robot controller (vacuum / mower) ──────────────────────────────────────
  // MOVEMENT ARCHITECTURE: the controller lives HERE in the Planner (runtime-
  // only) and is advanced from the 2D RAF via stepRobots(dt), exactly like
  // stepLerp. `robotStates` is the single source of truth read by BOTH the 2D
  // canvas and the 3D renderer, so a robot moves consistently whether or not the
  // 3D view was ever opened. Steering is STRAIGHT-LINE with wall avoidance
  // (segment-vs-solid-wall-run intersection tests + goal re-pick on block), NOT
  // the renderer's full A* nav grid — a pragmatic single-source-of-truth choice
  // that keeps 2D and 3D consistent without duplicating the nav system. Visually
  // fine for a puck; documented shortcut.

  // Resolve the current activity string for a robot (used by the controller, the
  // 2D/3D LED visuals, and the sidebar badge). Bound → normalize the entity's
  // VacuumActivity / LawnMowerActivity state. Unbound → localState 'paused'
  // freezes; else the runtime demo phase (see stepRobots).
  robotActivity(r: RobotFixture): string {
    if (r.entity_id) {
      const s = this.hass?.states?.[r.entity_id]?.state ?? '';
      if (s === 'cleaning' || s === 'mowing') return s;
      if (s === 'on') return r.kind === 'mower' ? 'mowing' : 'cleaning';
      if (s === 'returning') return 'returning';
      if (s === 'docked') return 'docked';
      if (s === 'paused') return 'paused';
      if (s === 'error') return 'error';
      return 'idle';   // idle / off / unknown / unavailable
    }
    if (r.localState === 'paused') return 'paused';
    const dp = this.robotStates[r.id]?.demoPhase ?? 'dock';
    if (dp === 'run') return r.kind === 'mower' ? 'mowing' : 'cleaning';
    if (dp === 'return') return 'returning';
    return 'docked';
  }

  // Click handler. Bound → run/dock via the domain service (cleaning/mowing →
  // return/dock; else start). Unbound → flip the demo between running and
  // returning-to-dock (runtime). View mode: no-op.
  toggleRobot(r: RobotFixture): void {
    if (this.uiMode === 'view') return;
    if (r.entity_id) {
      const act = this.robotActivity(r);
      const working = act === 'cleaning' || act === 'mowing';
      try {
        if (r.kind === 'mower') {
          this.hass?.callService('lawn_mower', working ? 'dock' : 'start_mowing', { entity_id: r.entity_id });
        } else {
          this.hass?.callService('vacuum', working ? 'return_to_base' : 'start', { entity_id: r.entity_id });
        }
      } catch { /* fire-and-forget */ }
      return;
    }
    const rs = this.robotStates[r.id];
    if (!rs) return;
    if (rs.demoPhase === 'run') { rs.demoPhase = 'return'; }
    else { rs.demoPhase = 'run'; rs.demoTimer = 90 + Math.random() * 90; rs.goalTimer = 0; }
    this.emitConfig();
  }

  private _spawnRobot(r: RobotFixture): RobotState {
    // Desync multiple robots' demo cycles by hashing the id.
    let h = 0;
    for (let i = 0; i < r.id.length; i++) h = (h * 31 + r.id.charCodeAt(i)) & 0xffff;
    return {
      x: r.x, y: r.y, heading: 0, phase: h % 100,
      activity: 'docked', led: robotLedColor('docked'),
      goalX: r.x, goalY: r.y,
      demoPhase: 'dock', demoTimer: 15 + (h % 60),   // start parked, then run
      wpIdx: 0, wpDir: 1, ellipseAng: (h % 628) / 100, goalTimer: 0,
    };
  }

  // Does the segment (x0,y0)→(x1,y1) cross any SOLID wall run on the current
  // floor? Invisible walls (planning boundaries) are passable; door/window spans
  // are gaps (via wallCutsForSegment) so a robot walks through openings.
  private _segCrossesWall(f: Floor, x0: number, y0: number, x1: number, y1: number): boolean {
    return segCrossesSolidWall(f.walls, f.doors ?? [], f.windows ?? [], x0, y0, x1, y1);
  }

  // Pick a random reachable goal inside the floor rect (straight line-of-sight
  // from the current position — no wall crossing). Falls back to the dock.
  private _pickVacuumGoal(r: RobotFixture, rs: RobotState, f: Floor): void {
    const m = 250;
    const w = Math.max(2 * m + 1, f.w), d = Math.max(2 * m + 1, f.d);
    for (let k = 0; k < 14; k++) {
      const gx = m + Math.random() * (w - 2 * m);
      const gy = m + Math.random() * (d - 2 * m);
      if (!this._segCrossesWall(f, rs.x, rs.y, gx, gy)) {
        rs.goalX = gx; rs.goalY = gy; rs.goalTimer = 4 + Math.random() * 4;
        return;
      }
    }
    rs.goalX = r.x; rs.goalY = r.y; rs.goalTimer = 4;
  }

  // Coarse outdoor sweep waypoints for a simulated mower: grid cells inside the
  // floor rect but OUTSIDE every closed wall loop, ordered boustrophedon. Cached
  // per (floor, configRev). Empty → the caller orbits an ellipse ring.
  private _mowerWaypoints(f: Floor): Vec2[] {
    const key = `${f.id}:${this.configRev}`;
    if (this._robotWpCache?.key === key) return this._robotWpCache.wps;
    const wps = mowerSweepWaypoints(f.walls, f.w, f.d);
    this._robotWpCache = { key, wps };
    return wps;
  }

  // GPS position for a bound mower (tracker attrs or a lat/lon sensor pair),
  // projected to plan mm via the fitted geo transform + boundary clamp. Null when
  // no GPS source, no calibration, or no numeric fix. `headingRad` from a
  // tracker `direction` attribute (compass °) mapped into the plan frame.
  private _mowerGps(r: RobotFixture): { x: number; y: number; headingRad: number | null } | null {
    if (r.kind !== 'mower') return null;
    const fit = this.geoFit();
    if (!fit || fit.transform.quality === 'none') return null;
    let lat: number | null = null, lon: number | null = null, dirDeg: number | null = null;
    if (r.trackerEntity) {
      const a = this.hass?.states?.[r.trackerEntity]?.attributes as Record<string, unknown> | undefined;
      if (a && typeof a.latitude === 'number' && typeof a.longitude === 'number') {
        lat = a.latitude; lon = a.longitude;
        if (typeof a.direction === 'number') dirDeg = a.direction;
      }
    } else if (r.latEntity && r.lonEntity) {
      const la = parseFloat(this.hass?.states?.[r.latEntity]?.state ?? '');
      const lo = parseFloat(this.hass?.states?.[r.lonEntity]?.state ?? '');
      if (isFinite(la) && isFinite(lo)) { lat = la; lon = lo; }
    }
    if (lat == null || lon == null) return null;
    const t = fit.transform;
    const plan = latLonToPlan(t, lat, lon);
    if (!plan) return null;
    const f = this.floor();
    const boundaryMm = this.geoBoundaryM() * 1000;
    const inYard = plan.x >= -boundaryMm && plan.x <= f.w + boundaryMm
                && plan.y >= -boundaryMm && plan.y <= f.d + boundaryMm;
    const pos = inYard ? plan : clampToBoundary(f.w, f.d, boundaryMm, plan.x, plan.y);
    let headingRad: number | null = null;
    if (dirDeg != null) {
      const B = dirDeg * Math.PI / 180;                  // compass ° of travel
      const east = Math.sin(B), north = Math.cos(B);
      const c = Math.cos(t.thetaRad), s = Math.sin(t.thetaRad);
      headingRad = Math.atan2(s * east + c * north, c * east - s * north);  // geo→plan, then atan2(dy,dx)
    }
    return { x: pos.x, y: pos.y, headingRad };
  }

  // LIVE vacuum position (#6): when a `posEntity` is bound and its
  // `vacuum_position` attribute parses, project the raw map units into plan world
  // mm via the calibration transform. `headingRad` comes from the raw map angle
  // when present (best-effort, same flip/rotation as the position); else null so
  // the controller derives heading from the motion vector. Null when unbound / no
  // entity / unparseable → the controller falls back to the simulated roam.
  private _vacuumLive(r: RobotFixture): { x: number; y: number; headingRad: number | null } | null {
    if (r.kind !== 'vacuum' || !r.posEntity) return null;
    const attrs = this.hass?.states?.[r.posEntity]?.attributes as Record<string, unknown> | undefined;
    const raw = parseVacuumPosition(attrs);
    if (!raw) return null;
    const w = vacuumRawToWorld(raw, r);
    const headingRad = raw.a != null && isFinite(raw.a) ? vacuumRawHeadingRad(raw.a, r) : null;
    return { x: w.x, y: w.y, headingRad };
  }

  // Advance all robots on the current floor (called from the 2D RAF).
  stepRobots(dt: number): void {
    const f = this.floor();
    const robots = f.robots ?? [];
    if (robots.length === 0) {
      if (Object.keys(this.robotStates).length) this.robotStates = {};
      return;
    }
    const ids = new Set(robots.map(r => r.id));
    for (const k of Object.keys(this.robotStates)) if (!ids.has(k)) delete this.robotStates[k];

    for (const r of robots) {
      let rs = this.robotStates[r.id];
      if (!rs) { rs = this._spawnRobot(r); this.robotStates[r.id] = rs; }
      rs.phase += dt;   // always advance (LED breathing / blink)

      // Demo cycle for unbound robots (paused freezes it).
      if (!r.entity_id && r.localState !== 'paused') {
        rs.demoTimer -= dt;
        if (rs.demoPhase === 'run' && rs.demoTimer <= 0) rs.demoPhase = 'return';
        else if (rs.demoPhase === 'dock' && rs.demoTimer <= 0) {
          rs.demoPhase = 'run'; rs.demoTimer = 90 + Math.random() * 90; rs.goalTimer = 0;
        }
      }

      const act = this.robotActivity(r);
      rs.activity = act;
      rs.led = robotLedColor(act);

      // A live vacuum position tracks even while idle/paused (the real robot may
      // be paused mid-room); the sim freeze-gate only applies without a live fix.
      const liveVac = r.kind === 'vacuum' ? this._vacuumLive(r) : null;
      if (!liveVac && (act === 'idle' || act === 'paused' || act === 'error')) continue;   // freeze in place

      if (r.kind === 'mower') this._stepMower(r, rs, f, act, dt);
      else this._stepVacuum(r, rs, f, act, dt, liveVac);
    }
  }

  private _stepVacuum(r: RobotFixture, rs: RobotState, f: Floor, act: string, dt: number,
                      live?: { x: number; y: number; headingRad: number | null } | null): void {
    const spd = ROBOT_DEFAULTS.vacuum.speed;
    // LIVE mode: ease toward the real position (never snap-park on docked — the
    // live fix already sits on the dock). Heading from the map angle when present,
    // else the on-screen motion vector. Overrides all simulated goal-picking.
    if (live) {
      const px = rs.x, py = rs.y;
      const dx = live.x - rs.x, dy = live.y - rs.y, d = Math.hypot(dx, dy);
      if (d > 1) { const step = Math.min(spd * 3 * dt, d); rs.x += dx / d * step; rs.y += dy / d * step; }
      if (live.headingRad != null) rs.heading = live.headingRad;
      else { const vx = rs.x - px, vy = rs.y - py; if (Math.hypot(vx, vy) > 1) rs.heading = Math.atan2(vy, vx); }
      return;
    }
    if (act === 'docked' || act === 'returning') {
      rs.goalX = r.x; rs.goalY = r.y;   // head to / hold the dock
    } else {
      rs.goalTimer -= dt;
      const dg = Math.hypot(rs.goalX - rs.x, rs.goalY - rs.y);
      if (dg < 200 || rs.goalTimer <= 0) this._pickVacuumGoal(r, rs, f);
    }
    const dx = rs.goalX - rs.x, dy = rs.goalY - rs.y;
    const d = Math.hypot(dx, dy);
    if (d > 1) {
      let ux = dx / d, uy = dy / d;
      if (act === 'cleaning') {   // serpentine wiggle on the carrot (vacuum-y)
        const perp = 0.35 * Math.sin(rs.phase * 3);
        const wx = ux - uy * perp, wy = uy + ux * perp;   // perpendicular offset
        const nn = Math.hypot(wx, wy) || 1; ux = wx / nn; uy = wy / nn;
      }
      const step = Math.min(spd * dt, d);
      const nx = rs.x + ux * step, ny = rs.y + uy * step;
      if (act !== 'docked' && this._segCrossesWall(f, rs.x, rs.y, nx, ny)) {
        this._pickVacuumGoal(r, rs, f);   // blocked → re-pick, hold position this frame
      } else {
        rs.x = nx; rs.y = ny;
        rs.heading = Math.atan2(dy, dx);   // face the raw goal (not the wiggle)
      }
    }
    if (act === 'returning' && !r.entity_id && Math.hypot(r.x - rs.x, r.y - rs.y) < 150) {
      rs.demoPhase = 'dock'; rs.demoTimer = 60 + Math.random() * 60;
    }
  }

  private _stepMower(r: RobotFixture, rs: RobotState, f: Floor, act: string, dt: number): void {
    const spd = ROBOT_DEFAULTS.mower.speed;
    // GPS reality (when calibrated + a fix exists) overrides the sim while working.
    const gps = (act === 'mowing' || act === 'returning') ? this._mowerGps(r) : null;
    if (gps) {
      const px = rs.x, py = rs.y;
      const dx = gps.x - rs.x, dy = gps.y - rs.y, d = Math.hypot(dx, dy);
      if (d > 1) { const step = Math.min(spd * 3 * dt, d); rs.x += dx / d * step; rs.y += dy / d * step; }
      if (gps.headingRad != null) rs.heading = gps.headingRad;
      else { const vx = rs.x - px, vy = rs.y - py; if (Math.hypot(vx, vy) > 1) rs.heading = Math.atan2(vy, vx); }
      return;
    }
    if (act === 'docked' || act === 'returning') {
      const dx = r.x - rs.x, dy = r.y - rs.y, d = Math.hypot(dx, dy);
      if (d > 1) { const step = Math.min(spd * dt, d); rs.x += dx / d * step; rs.y += dy / d * step; rs.heading = Math.atan2(dy, dx); }
      if (act === 'returning' && !r.entity_id && d < 150) { rs.demoPhase = 'dock'; rs.demoTimer = 60 + Math.random() * 60; }
      return;
    }
    // Simulated mowing: sweep outdoor waypoints (boustrophedon), else orbit a ring.
    const wps = this._mowerWaypoints(f);
    if (wps.length >= 2) {
      let g = wps[Math.max(0, Math.min(wps.length - 1, rs.wpIdx))];
      if (Math.hypot(g.x - rs.x, g.y - rs.y) < 300) {
        rs.wpIdx += rs.wpDir;
        if (rs.wpIdx >= wps.length) { rs.wpIdx = wps.length - 1; rs.wpDir = -1; }
        else if (rs.wpIdx < 0) { rs.wpIdx = 0; rs.wpDir = 1; }
        g = wps[rs.wpIdx];
      }
      const dx = g.x - rs.x, dy = g.y - rs.y, d = Math.hypot(dx, dy);
      if (d > 1) { const step = Math.min(spd * dt, d); rs.x += dx / d * step; rs.y += dy / d * step; rs.heading = Math.atan2(dy, dx); }
    } else {
      rs.ellipseAng += (spd / Math.max(1, Math.max(f.w, f.d))) * dt;
      const a = f.w / 2 + 900, b = f.d / 2 + 900;
      const gx = f.w / 2 + a * Math.cos(rs.ellipseAng), gy = f.d / 2 + b * Math.sin(rs.ellipseAng);
      const dx = gx - rs.x, dy = gy - rs.y, d = Math.hypot(dx, dy);
      if (d > 1) { const step = Math.min(spd * dt, d); rs.x += dx / d * step; rs.y += dy / d * step; rs.heading = Math.atan2(dy, dx); }
    }
  }

  // ── Object write fence (ack window: HA echoes back our value, suppress overwrite) ─
  fenceObjectWrite(sensorId: string, oi: number): void {
    this.objWritePending[sensorId][oi] = true;
    const t = this.objWriteTimer[sensorId][oi];
    if (t) clearTimeout(t);
    this.objWriteTimer[sensorId][oi] = setTimeout(() => {
      this.objWritePending[sensorId][oi] = false;
    }, 3000);
  }
}
