import { HassClient, type HaApi, type ForecastRecord } from './ha-client.js';
import { parseHeadlines, type CalEvent } from './surfaces.js';
import { SensorDiscovery } from './sensor-discovery.js';
import { loadStore, saveStore, newId, repairFloor, defaultStore,
         cfgBodyKey, loadConfigsCache, saveConfigsCache } from './storage.js';
import { slugToName, normMac, localToWorld, segCrossesSolidWall, mowerSweepWaypoints,
         ROBOT_DEFAULTS, robotLedColor, parseVacuumPosition, vacuumRawToWorld,
         vacuumRawHeadingRad, isStairsKind, logicLightState, actionButtonKind,
         furnitureKind, normalizeLockState, valveIsOpen, cameraColor, slugifyFrigateName,
         closedWallLoops, envKindOf, tempToCelsius, aggregateRoomTemps,
         bufferPolyline, PATH_DEFAULT_WIDTH, poolHeaterState, poolPumpOn,
         rotPointDeg, floorContentBbox, GRID_MM, rulerSetLength,
         furnitureLocalToWorld, furnitureDef, resolveItemGroundMm, STAIRS_MIN_RISE_MM,
         type LockGlyphState, type RoomTemp, type TempSample } from './geometry.js';
import { solveHomography, applyHomography } from './homography.js';
import { stepFusion, newFusionState, DEFAULT_FUSION_CFG,
         type FusionState, type FusionCand } from './fusion.js';
import { buildAlertFeed, alertCenterEnabled, isAlertDomain,
         type PanelAlert, type HaNotification, type RepairIssue } from './alerts.js';
import { fitGeoTransform, latLonToPlan, clampToBoundary, planBearingDeg, compass8, medianLatLon,
         fmtDistanceM, fmtAccuracyM, projectRecordedPins, parseLatLon, parseLandmarkCsv,
         type GeoTransform, type GeoPair, type LatLonSample, type ProjectedRecordedPin } from './geo.js';
import type { GeoConfig, GeoLandmark, RecordedPin, GroundKind, DioramaPerson, RobotFixture, ActionButton, Light, ValveFixture, BgTextEntry, BgTextEntryMode } from './types.js';
import { formatEntityValue } from './value-rules.js';

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
  ConfigIndex, ConfigMeta, ThermostatFixture, SafetySensor, AlertBeacon, Furniture, MqttBridgeConfig,
  AlertsConfig, GroundArea, Pool, CompassConfig, Ruler, RulerEnd, DimensionMode, NeighborhoodConfig,
  FlightsConfig,
} from './types.js';
import { normalizeAircraftList, flightBearingDistance, MAX_AIRCRAFT,
         isEmergency, emergencySquawk, sanitizeLabelFields,
         sanitizeFlightGlowRules, FLIGHTS_DEFAULT_RADIUS_NM,
         FLIGHT_SHELL_DEFAULT_RADIUS_M, FLIGHT_SHELL_MIN_RADIUS_M,
         FLIGHT_SHELL_MAX_RADIUS_M,
         type FlightPoint, type IssNow } from './flights.js';
import { fetchLocalAircraft, fetchAirplanesLive, fetchIssNow } from './adsb-sources.js';
// The ONE satellite alt/az routine (the renderer's sky uses the same function —
// never re-derive it here). sky-astro is pure + three.js-FREE, so importing it
// does NOT pull three into the startup graph (verified: dist/assets/app.js still
// greps 0 for MeshToonMaterial, three-renderer remains its own lazy chunk).
// Measured cost: because sky-astro also pulls its sibling star table
// (sky-catalog.ts, which does NOT tree-shake — the renderer's skySnapshot needs
// it and both consumers now share one copy), this moved ~14 kB raw / ~6 kB gzip
// out of the three-renderer chunk and into the shared startup chunk. Total
// shipped bytes are unchanged; only the split point moved.
import { satAltAz } from './sky-astro.js';

// Full export envelope (Batch B). `store` is the WHOLE Store serialized (no
// field list on export — nothing stripped); `userAvatarPacks` carries the
// user-imported avatar pack bodies from IndexedDB so an import on a fresh
// browser is self-contained. Import also accepts a legacy bare-store JSON.
export interface DioramaEnvelope {
  diorama: 2;
  name: string;
  exportedAt: string;
  store: Store;
  userAvatarPacks?: AvatarPackDef[];
}

// How long a camera alert lingers (snapshot card + FOV pulse) after its
// alertEntity flips back off. See Planner.cameraAlerting.
const CAMERA_ALERT_LINGER_MS = 6000;
import { solvePosition, type ProxyObs } from './trilateration.js';
// Type-only — the bridge VALUE is dynamic-import()ed in _reconfigureMqtt so
// mqtt-bridge.ts (and, in turn, mqtt-ws.ts) stay OUT of the startup chunk.
import type { BridgeStatus, BridgeHandle } from './mqtt-bridge.js';
// Valetudo map parsing is pure (no three.js) — a plain static import is fine.
import { decodeMapDataPayload, cleanSegmentPayload, type ParsedVacMap } from './valetudo-map.js';
// Neighborhood overlay (OpenFreeMap) — all pure, zero three.js (stays in app.js).
import { decodeTile, type MvtLayer } from './mvt-decode.js';
import {
  tilesForRadius, buildNeighborhoodFeatures, tileUrl, tileTemplateSchemeOk,
  buildingCapForRadius, DEFAULT_TILE_ZOOM, type NeighborhoodFeatures, type TileAddr,
} from './neighborhood.js';
import { getTile, putTile, tileCacheKey, clearNeighborhoodTiles, TILE_TTL_MS } from './neighborhood-store.js';
import {
  fetchOpenMeteo, fetchOpenMeteoForecast, geocodeZip, resolveWeatherEntity, deriveFromSensors,
  toCelsius, toKmh, toMmPerH, forecastRainSoon, parseWeatherAlerts,
  conditionIntensity, alertSeverityRank, worstAlertSeverity,
  type WeatherNow, type HaCondition, type WeatherAlert,
} from './weather.js';
import { isDay } from './time-of-day.js';
import {
  setAvatarPacksConfig, registerPack, getPack, unregisterPack,
  type AvatarPackConfig, type AvatarPacksConfig, type AvatarPackDef,
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

// ── Frigate ground-truth camera target (runtime-only) ─────────────────────
// One tracked object from a Frigate detection box, projected through the owning
// camera's ground-plane homography to floor mm. Not persisted — maintained live
// from the MQTT `frigate/events` stream. Feeds a per-key lerp slot (`cam_<...>`)
// so 2D dots and 3D rigs read one smoothed source, exactly like BLE people.
// The `before`/`after` object inside a Frigate `frigate/events` payload — only
// the fields the projection needs are typed (the payload carries many more).
interface FrigateObj {
  id?: string;
  camera?: string;
  label?: string;
  false_positive?: boolean;
  box?: number[];         // [x1,y1,x2,y2] pixels at the camera's DETECT resolution
}

export interface CamTarget {
  key: string;            // synthetic target key: `cam_<cameraId>_<label>_<slot>`
  cameraId: string;
  label: string;          // frigate object label: person / dog / cat / car
  color: string;          // owning camera tint (hex)
  x: number; y: number;   // projected (lerped) floor position, world mm
  floorId: string;        // floor the owning camera lives on
  eventId: string | null; // frigate event id currently occupying the slot
  updatedAt: number;      // ms epoch of the last update
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
  | { kind: 'calendar'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'thermostat'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'safety'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'alert'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'robot'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'camera'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'cameraRotate'; id: string }
  | { kind: 'projector'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'valve'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'sprinkler'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'flagpole'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'plug'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'info'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'action'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'pzoneVert'; id: string; idx: number; startMm: Vec2; startPts: Vec2[] }
  | { kind: 'groundVert'; id: string; idx: number; startMm: Vec2; startPts: Vec2[] }
  | { kind: 'pathVert'; id: string; idx: number; startMm: Vec2; startPts: Vec2[] }
  | { kind: 'poolVert'; id: string; idx: number; startMm: Vec2; startPts: Vec2[] }
  | { kind: 'voidVert'; id: string; idx: number; startMm: Vec2; startPts: Vec2[] }
  | { kind: 'rulerEnd'; rulerId: string; end: 'a' | 'b' }
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

export type Tool = 'select' | 'wall' | 'sensor' | 'motion' | 'env' | 'infocard' | 'action' | 'bleproxy' | 'alarm' | 'calendar' | 'thermostat' | 'safety' | 'alertbeacon' | 'robot' | 'camera' | 'projector' | 'valve' | 'sprinkler' | 'flagpole' | 'plug' | 'pzone' | 'ground' | 'path' | 'pool' | 'void' | 'nbhd_excl' | 'ruler' | 'furniture' | 'light' | 'switch' | 'door' | 'window' | 'delete';

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

// ── Floor-switch viewport retention (pure) ─────────────────────────────────
// World mm coordinates are SHARED across stacked stories — the ghost-floor /
// 2D peek machinery depends on identical world coords landing at identical
// positions — so a floor switch does NOT change the coordinate frame; floors
// differ only in rect SIZE. That's why `switchFloor` retains pan/zoom.

// How far outside the new floor's `0..w × 0..d` rect a retained 2D `viewCenter`
// may land before it's considered stale. Inflated by this fraction of the
// LARGER dimension on every side, so a modestly-offset centre survives but a
// centre from a wildly different plan can't strand the user on blank canvas.
export const VIEW_RETAIN_MARGIN_FRAC = 0.5;

/**
 * Does a retained 2D pan centre still make sense on a floor of `w × d` mm?
 * True while it lies inside the floor rect inflated by
 * `VIEW_RETAIN_MARGIN_FRAC · max(w, d)` on every side.
 */
export function viewCenterFitsFloor(w: number, d: number, cx: number, cy: number): boolean {
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return false;
  const m = VIEW_RETAIN_MARGIN_FRAC * Math.max(w, d);
  return cx >= -m && cx <= w + m && cy >= -m && cy <= d + m;
}

/**
 * Scene-space translation that keeps the 3D camera looking at the SAME WORLD
 * POINT across a floor switch. The renderer's world→scene mapping is
 * floor-dim-derived (`_w(wx, wy, h) = (fw/2 − wx, h, wy − fd/2)`), so a floor
 * with different `w`/`d` shifts all content by this delta in scene coords:
 *   x: fw/2 − wx  →  fw′/2 − wx  = x + (fw′ − fw)/2
 *   z: wy − fd/2  →  wy − fd′/2  = z − (fd′ − fd)/2
 *
 * The frame is ALSO floor-ELEVATION-derived: the active slab always builds at
 * scene y=0, so switching from a floor at elevation E to one at E′ slides the
 * whole world (ground plane, neighborhood, the other stories in glass house)
 * down by (E′ − E) in scene coords. Compensating with `dy = E − E′` keeps the
 * camera at the same height ABOVE THE GROUND, which is what makes the fixed
 * ground plane read as fixed across a floor switch.
 *
 * Equal dims + equal elevations → exact `{0, 0, 0}` no-op. Add it to BOTH camera
 * position and target. Elevation args are optional (default 0) so callers that
 * predate the ground-plane work behave exactly as before.
 */
export function floorSwitchCameraDelta(
  prevW: number, prevD: number, nextW: number, nextD: number,
  prevElevMm = 0, nextElevMm = 0,
): { dx: number; dz: number; dy: number } {
  const ok = (n: number) => Number.isFinite(n);
  if (!ok(prevW) || !ok(prevD) || !ok(nextW) || !ok(nextD)) return { dx: 0, dz: 0, dy: 0 };
  const dy = (ok(prevElevMm) && ok(nextElevMm)) ? prevElevMm - nextElevMm : 0;
  return { dx: (nextW - prevW) / 2, dz: -(nextD - prevD) / 2, dy };
}

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

// Appliance "running" state vocabulary (event-focused thought bubbles). Covers
// the appliance's own entity (on/playing), Home Connect operation_state (`run`),
// and generic running binary_sensors (`on`). PAUSE keeps a run alive (Home
// Connect run→pause→run); any OTHER non-running state ends the run.
const APPLIANCE_RUNNING_STATES = new Set(['on', 'playing', 'run', 'running', 'active']);
const APPLIANCE_PAUSE_STATES = new Set(['pause', 'paused']);

// Map an appliance furniture piece → the household-event bubble-pool key (see
// BUBBLE_POOL_EVENT in three-renderer). Generic fallback keeps unknown kinds working.
function applianceEventKind(fu: { kind?: import('./types.js').FurnitureKind }): string {
  switch (furnitureKind(fu)) {
    case 'dishwasher': return 'dishwasher_done';
    case 'washer': case 'dryer': return 'laundry_done';
    case 'stove': case 'microwave': return 'oven_done';
    default: return 'appliance_done';
  }
}

// The "fit to area" payload a ground-writing (mode 'grass') entry carries when
// its grassAreaId resolves on the current floor. cx/cy = the area bbox CENTRE
// (the decal's world position); w/h = the ~10%-inset bbox the text block is
// fitted into; points/kind/elevationMm describe the REAL area so the renderer
// can clip the decal to that geometry and paint it through the area's own
// surface. points/kind are optional purely for stale-chunk pairing — a renderer
// built before they existed reads only cx/cy/w/h and draws the legacy rect.
export type BgTextGrassArea = {
  cx: number; cy: number; w: number; h: number;
  points?: Vec2[]; kind?: GroundKind; elevationMm?: number;
};
export type BgTextResolved = {
  id: string; mode: BgTextEntryMode; text: string; maxCars?: number;
  aircraft?: string; scale?: number;
  grassAreaId?: string; grassArea?: BgTextGrassArea;
  // Ground-writing orientation (grass rows only; see BgTextEntry). Both absent =
  // autofollow, exactly as shipped. `faceCamera` is only ever emitted as the
  // explicit `false` opt-out, so a row that follows the camera hashes/serializes
  // identically to a pre-feature one.
  faceCamera?: boolean; rotationDeg?: number;
};

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

  // Active roaming avatar (sidebar list expansion only; roamers have no canvas
  // fixture — they spawn like AI avatars).
  activeRoamerId: string | null = null;

  // Active environmental sensor (sidebar selection / canvas highlight)
  activeEnvId: string | null = null;

  // Active BLE proxy fixture (sidebar selection / canvas highlight)
  activeBleId: string | null = null;

  // Active alarm keypad fixture (sidebar selection / canvas highlight)
  activeAlarmId: string | null = null;

  // Active wall-calendar fixture (sidebar selection / canvas highlight)
  activeCalendarId: string | null = null;

  // Active thermostat fixture (sidebar selection / canvas highlight)
  activeThermoId: string | null = null;

  // Active smoke / CO detector fixture (sidebar selection / canvas highlight)
  activeSafetyId: string | null = null;

  // Active alert beacon fixture (sidebar selection / canvas highlight)
  activeAlertBeaconId: string | null = null;

  // Active robot fixture (sidebar selection / canvas highlight)
  activeRobotId: string | null = null;

  // Active camera fixture (sidebar selection / canvas highlight)
  activeCameraId: string | null = null;

  // Active projector fixture (sidebar selection / canvas highlight)
  activeProjectorId: string | null = null;

  // Active water valve fixture (sidebar selection / canvas highlight)
  activeValveId: string | null = null;

  // Active sprinkler zone (sidebar selection / canvas highlight)
  activeSprinklerId: string | null = null;

  // Active flagpole fixture (sidebar selection / canvas highlight)
  activeFlagpoleId: string | null = null;

  // Active smart plug fixture (sidebar selection / canvas highlight)
  activePlugId: string | null = null;

  // Active info card fixture (sidebar selection / canvas highlight)
  activeInfoId: string | null = null;

  // Active action-button fixture (sidebar selection / canvas highlight)
  activeActionId: string | null = null;

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

  // Path / driveway ribbon (T4). Records CENTERLINE clicks (not polygon verts);
  // finishPath() calls bufferPolyline once → a plain path-backed GroundArea.
  // Parallel latch field per the codebase convention. `id`/`width` set when
  // re-drawing an existing path-backed area.
  drawingPath: { points: Vec2[]; id?: string; width?: number } | null = null;

  // Pool / spa water body (T4). Mirrors the ground-area polygon flow exactly
  // (parallel field, same latch idiom). `id` set when re-drawing an existing pool.
  activePoolId: string | null = null;
  drawingPoolArea: { points: Vec2[]; id?: string; kind?: 'pool' | 'spa' } | null = null;

  // Floor void / opening area (Tier-1 floor voids). Mirrors the presence-zone
  // polygon flow exactly (parallel field, same latch idiom).
  activeVoidAreaId: string | null = null;
  drawingVoidArea: { points: Vec2[]; id?: string } | null = null;

  // Neighborhood-overlay exclusion mask (OpenFreeMap). A plan-mm clip polygon —
  // neighborhood geometry intersecting one is dropped at extraction. Same
  // presence-zone draw-latch idiom (parallel field): each click appends a vertex,
  // dblclick/Enter finishes (3–12 pts). NO vertex-drag editing v1 (delete +
  // redraw). Runtime-only; the finished polygon lands in store.neighborhood.
  drawingExclusion: { points: Vec2[] } | null = null;

  // Ruler (measure tool). `drawingRuler` is the half-placed latch: the first
  // click (ruler tool) sets end `a`; the second click sets `b` + creates the
  // ruler (staying armed for more). Cleared on tool switch / ESC / store load /
  // uiMode change. `activeRulerId` is the selected ruler (Select mode).
  activeRulerId: string | null = null;
  drawingRuler: { a: RulerEnd } | null = null;

  // Dimension-mode wall-pick latch (Feature B `custom` mode). While armed, a
  // Select-mode press on a wall body TOGGLES Wall.dimension instead of
  // selecting/dragging. Cleared on tool change / ESC / mode change / store load.
  pickingDimWalls = false;

  // Live robot positions (runtime-only, advanced by stepRobots from the 2D RAF —
  // like stepLerp). BOTH the 2D canvas and the 3D renderer read this, so the
  // robot moves consistently whether or not the 3D view was ever opened. See
  // RobotState / stepRobots below.
  robotStates: Record<string, RobotState> = {};
  // Cached mower sweep waypoints, keyed by floor id + configRev (walls change).
  private _robotWpCache: { key: string; wps: Vec2[] } | null = null;

  // Active person (sidebar People list expansion). Runtime only.
  activePersonId: string | null = null;

  // Currently-selected polygon / wall vertex (runtime only). Set on a vertex
  // mousedown in canvas-interact; cleared on any other selection / tool change /
  // store load. Delete targets this vertex (highest priority) — see
  // deleteSelection(). `kind` picks the collection; `index` is the point index.
  selectedVertex: { kind: 'pzone' | 'ground' | 'void' | 'wall' | 'path' | 'pool'; itemId: string; index: number } | null = null;

  // ── Undo / redo (runtime only, never persisted) ─────────────────────────
  // Snapshot history of serialized Store JSON. Every store mutation funnels
  // through save() (the single choke point); _pushUndoSnapshot there records the
  // PREVIOUS serialization when it differs from the current one, so a whole drag
  // (which save()s only on release) is one undo step. Stacks clear on every
  // config load/switch/import (they all funnel through _applyLoadedStore).
  private _undoStack: string[] = [];
  private _redoStack: string[] = [];
  private _lastSnapshotJson: string | null = null;
  private static readonly UNDO_CAP = 50;
  private static readonly UNDO_BYTES_CAP = 8 * 1024 * 1024;
  get canUndo(): boolean { return this.uiMode === 'edit' && this._undoStack.length > 0; }
  get canRedo(): boolean { return this.uiMode === 'edit' && this._redoStack.length > 0; }

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

  // ── Valetudo room-map overlay (Phase 5, batch M-C; runtime-only) ──────────
  // Latest parsed map per robot id, a monotonic revision counter (dirty key +
  // 3D texture disposal), the last StatusStateAttribute value/flag, and the
  // segment ids Diorama itself last commanded to clean (glow source when the
  // status can't say which room). Never persisted; keyed by RobotFixture.id.
  vacuumMaps: Record<string, ParsedVacMap> = {};
  vacuumMapRev: Record<string, number> = {};
  vacuumStatus: Record<string, { value?: string; flag?: string }> = {};
  lastCommandedSegments: Record<string, string[]> = {};
  private _vacSubNs: string | null = null;   // valetudoNs the wildcard subs were registered against

  // ── Weather (runtime-only; recomputed from the configured source) ─────────
  // Normalized current weather. Chip + (later) 3D effects read this. Local
  // sources (entity/sensors) recompute from state_changed; Open-Meteo polls.
  weatherNow: WeatherNow | null = null;
  // DC-D: normalized active weather alerts (runtime, NOT persisted). Recomputed
  // from the bound alert entity's state on change + full refresh; [] when
  // unconfigured. The chip badge/panel, the settings preview, and the 3D beacon
  // read this. Independent of the weather SOURCE — an alert entity is separate.
  weatherAlerts: WeatherAlert[] = [];
  private _weatherTimer: ReturnType<typeof setInterval> | null = null;
  private _weatherInited = false;

  // ── Wall calendars (runtime-only; polled via calendar.get_events) ─────────
  // Upcoming events per CalendarPanel id (chronologically merged across the
  // panel's bound calendar.* entities). NOT persisted — refreshed by
  // _refreshCalendars() on connect + a ~10 min timer + when a bound calendar's
  // entity state flips (see _isSlowEntity). The 2D/3D renderers read this.
  calendarEvents: Record<string, CalEvent[]> = {};
  private _calendarTimer: ReturnType<typeof setInterval> | null = null;
  private _calendarInited = false;
  private static readonly CALENDAR_POLL_MS = 10 * 60 * 1000;
  private static readonly CALENDAR_WINDOW_H = 48;   // fetch this many hours ahead

  // ── Alert Center (runtime-only; never persisted) ──────────────────────────
  // Live persistent notifications (kept current by the WS subscription — a
  // `current` snapshot then add/update/remove deltas maintained in this map) and
  // the polled Repairs issue registry. Both feed the derived `alertFeed` getter,
  // mirroring how weatherNow/blePeople are runtime-only derived state.
  notifications: HaNotification[] = [];
  repairIssues: RepairIssue[] = [];
  private _alertNotifUnsub: (() => void) | null = null;
  private _alertRepairsTimer: ReturnType<typeof setInterval> | null = null;
  private _alertInited = false;
  private static readonly ALERT_REPAIRS_POLL_MS = 3 * 60 * 1000;  // Repairs change rarely; no WS push exists
  // ── MQTT bridge (Phase 5) ──────────────────────────────────────────────────
  // The active bridge handle (null when mode off / offline / not yet started),
  // its last-reported status, a one-time init guard (mirrors _weatherInited), and
  // the subscription registry consumers (Batches B/C) register through
  // mqttSubscribe — queued until the bridge is up and REPLAYED on every restart.
  private _mqttBridge: BridgeHandle | null = null;
  private _mqttStatus: BridgeStatus = 'idle';
  private _mqttInited = false;
  private _mqttSubs: Array<{ filter: string; cb: (m: { topic: string; payloadString: string }) => void }> = [];

  // ── Frigate ground-truth targets (Phase 5) ─────────────────────────────────
  // Live tracked objects from `frigate/events`, keyed `cam_<cameraId>_<label>_<slot>`.
  // Read (lerped + pruned) via the camPeople getter. Never persisted.
  camTargets: Record<string, CamTarget> = {};
  private _frigateSubscribed = false;                 // one-time subscription guard
  private _camHgCache: Record<string, { key: string; h: number[] | null }> = {};  // cameraId → solved homography (memoized on calib hash)
  private static readonly CAM_LABELS = ['person', 'dog', 'cat', 'car'];
  private static readonly CAM_SLOTS = 3;              // max tracked objects per camera/label
  private static readonly CAM_MATCH_MM = 2500;        // nearest-position successor match radius
  private static readonly CAM_RETIRE_MS = 8000;       // release a slot after this long without an update

  // ── Neighborhood overlay (OpenFreeMap — Wave 1 data layer) ─────────────────
  // Resolved plan-frame features (buildings/roads/water/landuse). Runtime-only,
  // NEVER persisted (same rule as weatherNow / blePeople). The renderer wave
  // consumes this. Null when disabled / no geo fit / offline / fetch failed.
  neighborhoodData: NeighborhoodFeatures | null = null;
  // Monotonic revision bumped every time _extractNeighborhood rewrites
  // neighborhoodData (including → null). Runtime-only, NEVER persisted. The
  // renderer wave folds this into its _keyNeighborhood dirty key so a completed
  // async fetch / align nudge triggers exactly one rebuild (the Floor.model3d
  // rev-changed idiom).
  neighborhoodRev = 0;
  // Warm in-memory decoded-layer cache (keyed by tileCacheKey) so an align /
  // verticalScale / exclusion change RE-EXTRACTS without re-fetching or even
  // re-decoding (PIN: extraction is separable from fetching). IDB holds the raw
  // bytes for cross-session reuse; this is the per-session convenience layer.
  private _nbhdDecoded = new Map<string, { addr: TileAddr; layers: Record<string, MvtLayer> }>();
  private _nbhdTemplate: { source: string; custom?: string; template: string } | null = null;
  private _nbhdSourceKey = '';                     // last source/custom key — clears the caches on a source switch
  private _nbhdRunId = 0;                           // guards against an older async reconfigure clobbering a newer

  // ── Flights & ISS (roadmap P4) ────────────────────────────────────────────
  // Runtime-only, NEVER persisted (the weatherNow / neighborhoodData rule).
  // `flightsNow` is already filtered (radius + altitude band), sorted nearest
  // first and capped at MAX_AIRCRAFT, with distNm filled in. `flightsRev` is a
  // monotonic revision bumped on EVERY data change (aircraft or ISS) so the
  // renderer wave can fold it into one dirty key. Null data + status 'off'
  // whenever the feature is disabled.
  flightsNow: FlightPoint[] | null = null;
  flightsAt = 0;                 // ms epoch of the last successful aircraft poll
  flightsRev = 0;
  issNow: IssNow | null = null;
  flightsStatus: 'off' | 'no-origin' | 'ok' | 'error' = 'off';
  private _flightsTimer: ReturnType<typeof setInterval> | null = null;
  private _issTimer: ReturnType<typeof setInterval> | null = null;
  private _flightsFetching = false;
  private _flightsInited = false;
  private static readonly ISS_POLL_MS = 10000;   // well under wheretheiss.at's ~350 req / 5 min
  // Shared with both renderers + the settings UI — see flights.ts.
  private static readonly FLIGHTS_DEFAULT_RADIUS_NM = FLIGHTS_DEFAULT_RADIUS_NM;

  // Client-local flight/ISS alerts (research §6.3). Runtime-only, NEVER
  // persisted — they are recomputed from live poll data, so a reload simply
  // starts clean (the doorbellRings / householdEvents rule). They reach the
  // shared Alert Center through buildAlertFeed's `extra` param: no HA source
  // collects them, so the per-source toggles / severity floor don't apply.
  flightAlerts: PanelAlert[] = [];
  private _flightAlertDismissed = new Set<string>();     // ids the user dismissed this session
  private _flightAlertAt = new Map<string, number>();    // per-hex cooldown clock (ms epoch)
  private _issWasUp = false;                             // ISS-above-horizon edge detector
  private static readonly FLIGHT_ALERT_TTL_MS = 15 * 60 * 1000;  // prune window
  private static readonly FLIGHT_ALERT_CAP = 8;                   // newest-wins cap
  private static readonly FLIGHT_LOW_COOLDOWN_MS = 10 * 60 * 1000;
  private static readonly FLIGHT_WATCH_COOLDOWN_MS = 30 * 60 * 1000;
  // A dismissed EMERGENCY re-arms after this long if the aircraft is still
  // declaring one (an active emergency is otherwise exempt from the TTL prune).
  private static readonly FLIGHT_EMERG_COOLDOWN_MS = 10 * 60 * 1000;
  private static readonly FLIGHT_LOW_DIST_NM = 3;        // "overhead", not merely in-radius
  private static readonly ISS_UP_ALT_DEG = 10;           // horizon threshold for a pass notice

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
  // DC-C: full normalized forecast arrays (runtime cache, NOT persisted). The
  // chip's forecast strip reads these. Entity source fills them from
  // weather.get_forecasts; Open-Meteo from fetchOpenMeteoForecast; the sensors
  // source has no forecast (both stay null). Refreshed on the same cadences as
  // weatherNow and reset on a source switch.
  forecastDaily: ForecastRecord[] | null = null;
  forecastHourly: ForecastRecord[] | null = null;

  // Active furniture piece (last grabbed/dropped) — drives the 2D front-arrow
  // chevron. Runtime only.
  activeFurnitureId: string | null = null;

  // Defense-in-depth for the destructive Delete/Backspace keys. True once ANY
  // genuine interactive selection happens THIS session (a sidebar/canvas select
  // or a fresh placement — see markSelectionHot). A selection restored from disk
  // (activeSensorId persists across sessions) leaves this false, so a stray
  // keypress at body focus can't delete a selection the user never touched.
  // Reset on store load + uiMode change. Runtime only, never persisted.
  selectionHot = false;

  // Set on a NEW named-fixture placement so the sidebar autofocuses that
  // fixture's Label input once (the reported bug: typing the name at body focus
  // ran the Backspace hotkey and deleted the just-placed sensor). Cleared by the
  // sidebar after it focuses, and on store load / uiMode change. Runtime only.
  newlyPlacedFocus: { kind: string; id: string } | null = null;

  // UI mode. Runtime + URL-driven, never persisted.
  //   edit  — full editor (default)
  //   kiosk — views + device interaction only; nothing editable, nothing saved
  //   view  — pure visualization; no device interaction either
  uiMode: 'edit' | 'kiosk' | 'view' = 'edit';
  // ?lock=1 hides the mode switcher (wall tablets).
  uiModeLocked = false;
  // Runtime-only (never persisted): the standalone offline app was launched as
  // the hosted demo (URL had ?demo). Gates the topbar "Reset demo" affordance.
  demoMode = false;
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

  // Action-button press animation transients (batch DC-B). Pushed on every fire
  // (any UI mode except view) so both 2D (drawActionButtons) and 3D
  // (advanceActionButtons) show the tactile depress + ring. Runtime-only (like
  // doorbellRings) — a press mutates NO persisted state. Pruned > 900 ms, capped.
  // `at` is performance.now() ms so the render passes read one clock.
  actionPressFx: { id: string; at: number }[] = [];
  // Per-button last-fire timestamp (performance.now() ms) for the fireAction
  // double-fire cooldown. Runtime-only.
  private _actionCooldownAt: Record<string, number> = {};

  // Camera alert linger (#10 extension): the last time each current-floor camera's
  // alertEntity was seen 'on' (Date.now() ms). `cameraAlerting(cam)` returns true
  // while the sensor is on OR within CAMERA_ALERT_LINGER_MS of the last on-time,
  // so the FOV-wedge pulse + snapshot card stay up briefly after the sensor clears.
  private _camAlertLastOn: Record<string, number> = {};

  // Household events (event-focused thought bubbles — Phase 2a). Pushed on the
  // LIVE path when a real "moment" happens: a bound appliance finishes a >=5 min
  // run (furnitureId anchored), or rain / severe weather / a weather alert
  // arrives (furnitureId null = house-wide). `at` is Date.now() ms. Read by
  // three-view (mapped into ActivityContext.eventTriggers → the top-priority
  // bubble tier) + the appliance "done" badge. Pruned > EVENT_WINDOW_MS, capped
  // at 8. Runtime-only — an event mutates NO persisted state (like doorbellRings).
  householdEvents: { furnitureId: string | null; kind: string; at: number }[] = [];
  private _jobStatePrev: Record<string, string> = {};   // fuId → last-seen watched state (seeds silently)
  private _jobRunStart: Record<string, number> = {};    // fuId → ms the watched entity entered a running state
  private _prevWeatherCondition: string | undefined;    // last weatherNow.condition (seeds silently)
  private _prevAlertRank = 0;                            // worst active weatherAlerts severity rank (0 = none)
  private static readonly EVENT_WINDOW_MS = 45000;       // household-event retention (TTL for the bubble tier)
  private static readonly APPLIANCE_RUN_MIN_MS = 5 * 60 * 1000;  // min run before a stop counts as "finished"

  setUiMode(m: 'edit' | 'kiosk' | 'view'): void {
    this.uiMode = m;
    // A mode change starts a fresh interaction context — cool any selection so a
    // stray destructive key can't act on a carry-over selection, and drop a
    // pending autofocus (the sidebar only renders editors in edit mode).
    this.selectionHot = false;
    this.newlyPlacedFocus = null;
    if (m !== 'edit') {
      // Leave no edit affordances dangling.
      this.drag = null; this.editZone = null; this.drawingWall = null;
      this.drawingPresenceZone = null; this.drawingGroundArea = null; this.drawingVoidArea = null;
      this.drawingPath = null; this.drawingPoolArea = null; this.drawingExclusion = null;
      this.drawingRuler = null; this.pickingDimWalls = false;
      this.tool = 'select'; this.placingRoomId = null; this.placingLandmarkId = null;
      this.landmarkSuggestId = null;
      this.placingCamCalibId = null; this.pendingCamCalibUV = null;
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

  // Which fixture-kind the next drop of a variant-bearing tool creates. All
  // runtime-only (never persisted) and default to today's drop kind, so the
  // classic sidebar tools keep their exact behavior while the visual toolbar
  // can pre-select a variant (mirrors pendingFurnitureKind / pendingWallKind).
  pendingLightKind: import('./types.js').LightIconKind = 'bulb';
  pendingWindowKind: import('./types.js').WindowKind = 'single';
  pendingDoorKind: 'swing' | 'garage' | 'gate' = 'swing';
  pendingGroundKind: import('./types.js').GroundKind = 'grass';

  // Room placement latch: when set, the next 2D canvas click sets a room's
  // anchor. Holds the room id being re-placed, or NEW_ROOM to create a fresh
  // room at the click point. Runtime + edit-only, never persisted.
  placingRoomId: string | null = null;

  // Geo-landmark placement latch (same pattern as placingRoomId): the next 2D
  // click places a landmark pin. NEW_LANDMARK = create fresh; else re-place the
  // held landmark id. Runtime + edit-only, never persisted.
  placingLandmarkId: string | null = null;

  // Suggested-position latch: when set, the 2D canvas draws a ghost pin where
  // the CURRENT geo fit says this landmark SHOULD sit (its lat/lon projected
  // back onto the plan — the exact endpoint the "off by N m" residual measures
  // against) and the sidebar offers to move the pin there. A pure inspection
  // affordance: nothing changes until the user applies it. Runtime + edit-only,
  // never persisted.
  landmarkSuggestId: string | null = null;

  // Active geo-calibration session (runtime only; see GeoCalibSession).
  geoCalib: GeoCalibSession | null = null;

  // Camera ground-calibration latch (Phase 5, same pattern as placingLandmarkId):
  // the sidebar clicks a pixel on the camera snapshot (staging `pendingCamCalibUV`
  // in detect-resolution coords) which arms this with the camera id; the NEXT 2D
  // canvas click records the matching floor (x,y) and pushes the {u,v,x,y} pair
  // onto that camera's camCalib.points. Runtime + edit-only, never persisted.
  placingCamCalibId: string | null = null;
  pendingCamCalibUV: { u: number; v: number } | null = null;

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
  // Legacy single-store key: read ONCE for migration, never written again after
  // (old panel versions still find their data there).
  private static readonly HA_STORE_KEY = 'diorama';
  // Config registry index key (Batch B — multiple configurations).
  private static readonly INDEX_KEY = 'diorama-configs';
  private _haStoreLoaded = false;
  private _haSaveTimer: ReturnType<typeof setTimeout> | null = null;
  // Suppress save-back to HA when we're applying a freshly-loaded HA payload.
  private _suppressHaSave = false;
  // Multi-configuration registry. Populated on first load / migration; null
  // until then. `activeConfigId` mirrors `configIndex.activeId`.
  configIndex: ConfigIndex | null = null;
  activeConfigId = 'default';
  private _lastSavedAt: number | null = null;

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
    // Undo history: record the pre-mutation baseline before persisting. Cheap
    // no-op when nothing changed since the last snapshot (identical serialize).
    this._pushUndoSnapshot();
    // Local cache (diorama:store:v1) is the ACTIVE config body — written
    // immediately so it survives reload / paints instantly next load.
    saveStore(this.store);
    // HA is the source of truth: debounce a push so rapid edits (drag, slider)
    // don't hammer the WS. Skip while applying an HA payload to avoid a save
    // loop right after fetching.
    if (this._suppressHaSave) return;
    if (this._haSaveTimer) clearTimeout(this._haSaveTimer);
    this._haSaveTimer = setTimeout(() => {
      this._haSaveTimer = null;
      void this._flushSave();
    }, 600);
  }

  // Push the ACTIVE config's body to HA + bump its index updatedAt. The index
  // write piggybacks on the (debounced) body write so it's naturally throttled.
  // Never writes the legacy `diorama` key.
  private async _flushSave(): Promise<void> {
    if (!this.hass) return;
    const id = this.activeConfigId;
    try {
      await this.hass.setUserData(cfgBodyKey(id), this.store);
      const meta = this.configIndex?.configs.find(c => c.id === id);
      if (meta && this.configIndex) {
        meta.updatedAt = Date.now();
        this._lastSavedAt = meta.updatedAt;
        saveConfigsCache(this.configIndex);
        await this.hass.setUserData(Planner.INDEX_KEY, this.configIndex);
      } else {
        this._lastSavedAt = Date.now();
      }
    } catch (err) {
      console.warn('HA storage save failed (kept local cache):', err);
    }
  }

  // ── Undo / redo ───────────────────────────────────────────────────────────
  // Push the last-known baseline onto the undo stack when the store changed.
  // Called from save() (edit-mode only). Coalesces identical serializations so
  // repeated save()s within one mutation, or unchanged saves, don't stack.
  private _pushUndoSnapshot(): void {
    const cur = JSON.stringify(this.store);
    if (this._lastSnapshotJson === null) { this._lastSnapshotJson = cur; return; }
    if (cur === this._lastSnapshotJson) return;   // no net change
    this._undoStack.push(this._lastSnapshotJson);
    this._redoStack = [];                          // a fresh edit invalidates redo
    this._lastSnapshotJson = cur;
    this._trimUndoStacks();
  }

  // Enforce the entry cap (50) and total-byte cap (~8 MB) — drop oldest first.
  private _trimUndoStacks(): void {
    for (const stack of [this._undoStack, this._redoStack]) {
      while (stack.length > Planner.UNDO_CAP) stack.shift();
      let bytes = 0;
      for (const s of stack) bytes += s.length;
      while (stack.length > 1 && bytes > Planner.UNDO_BYTES_CAP) bytes -= stack.shift()!.length;
    }
  }

  // Reset the whole history to a clean baseline of the CURRENT store. Called on
  // every config load/switch/import (via _applyLoadedStore) + initial load.
  private _resetUndoHistory(): void {
    this._undoStack = [];
    this._redoStack = [];
    this._lastSnapshotJson = JSON.stringify(this.store);
  }

  // Undo the last store mutation. Edit-mode only; no-op with an empty stack.
  undo(): boolean {
    if (this.uiMode !== 'edit' || !this._undoStack.length) return false;
    const cur = JSON.stringify(this.store);
    const prev = this._undoStack.pop()!;
    this._redoStack.push(cur);
    this._trimUndoStacks();
    this._applyHistorySnapshot(prev);
    return true;
  }

  // Redo the last undone mutation. Edit-mode only; no-op with an empty stack.
  redo(): boolean {
    if (this.uiMode !== 'edit' || !this._redoStack.length) return false;
    const cur = JSON.stringify(this.store);
    const next = this._redoStack.pop()!;
    this._undoStack.push(cur);
    this._trimUndoStacks();
    this._applyHistorySnapshot(next);
    return true;
  }

  // Apply a history snapshot through the SAME normalization loads use (field
  // list + repairFloor via _normalizeStore) but PRESERVE the current view
  // context (floor if still present, tool, pan/zoom) — only transient
  // drag/edit state and selections are cleared. Persists to HA (debounced) but
  // never pushes a new undo snapshot (baseline is set to the applied store).
  private _applyHistorySnapshot(json: string): void {
    let remote: Store;
    try { remote = JSON.parse(json) as Store; } catch { return; }
    this._suppressHaSave = true;
    try {
      this.store = this._normalizeStore(remote, this.store.currentFloorId);
      setAvatarPacksConfig(this.store.avatarPacks);
      void this._hydrateAvatarPacks();
      this._clearTransientSelection();
      this.showDetails = this.store.showDetails === true;
      this.useRawTargets = this.store.useRawTargets === true;
      saveStore(this.store);
      this._lastSnapshotJson = JSON.stringify(this.store);
    } finally {
      this._suppressHaSave = false;
    }
    this._reconfigureWeather();
    this._calendarInited = true;
    this._startCalendarPoll();
    this._mqttInited = true;
    void this._reconfigureMqtt();
    if (this._alertInited) this._reconfigureAlertCenter();
    // Persist the restored store to HA (debounced). save() sees the baseline
    // == current, so it won't record a fresh undo snapshot for the undo itself.
    this.save();
    this.emitConfig();
  }

  // Clear per-item selections + transient drag/edit/drawing state (used by undo/
  // redo apply). Does NOT touch view (tool/pan/zoom) — undo preserves those.
  private _clearTransientSelection(): void {
    this.store.activeSensorId = null;
    this.activeMotionId = null; this.activeRoamerId = null; this.activeEnvId = null;
    this.activeBleId = null; this.activeAlarmId = null; this.activeCalendarId = null;
    this.activeThermoId = null; this.activeSafetyId = null; this.activeAlertBeaconId = null;
    this.activeRobotId = null; this.activeCameraId = null; this.activeProjectorId = null;
    this.activeValveId = null; this.activePlugId = null; this.activeInfoId = null;
    this.activeSprinklerId = null; this.activeFlagpoleId = null;
    this.activeActionId = null; this.activePZoneId = null; this.activeGroundAreaId = null;
    this.activePoolId = null;
    this.activeVoidAreaId = null; this.activeFurnitureId = null; this.activePersonId = null;
    this.activeRulerId = null;
    this.selectedVertex = null;
    this.drag = null; this.editZone = null;
    this.drawingWall = null; this.drawingPresenceZone = null;
    this.drawingGroundArea = null; this.drawingVoidArea = null;
    this.drawingPath = null; this.drawingPoolArea = null; this.drawingExclusion = null;
    this.drawingRuler = null; this.pickingDimWalls = false;
    this.landmarkSuggestId = null;
  }

  // ── Delete the current selection ────────────────────────────────────────────
  // Removes the highest-priority current selection — the same result the delete
  // TOOL produces for that item, but driven off the active-selection ids instead
  // of a cursor hit. Priority: selected vertex → furniture → mmWave sensor →
  // fixtures (motion/env/ble/alarm/calendar/thermostat/safety/alert/robot/camera/
  // projector/valve/plug/info/action) → presence zone → ground area → void area.
  // Locked items refuse (no crash). Edit-mode only. Returns true if it removed
  // something. Deletion persists via save(), which records an undo snapshot.
  deleteSelection(): boolean {
    if (this.uiMode !== 'edit') return false;
    const f = this.floor();
    // Highest priority: a selected polygon / wall vertex.
    if (this.selectedVertex) return this._deleteSelectedVertex(f);

    type Entry = {
      id: string | null;
      arr: Array<{ id: string; locked?: boolean }> | undefined;
      remove: (id: string) => void;
      clear: () => void;
    };
    const E = (
      id: string | null,
      arr: Array<{ id: string; locked?: boolean }> | undefined,
      remove: (id: string) => void,
      clear: () => void,
    ): Entry => ({ id, arr, remove, clear });

    const entries: Entry[] = [
      // Ruler wins right after a vertex, before furniture — it's a thin overlay
      // line, so let a selected ruler delete rather than the item beneath it.
      E(this.activeRulerId, f.rulers,
        id => { f.rulers = (f.rulers ?? []).filter(x => x.id !== id); },
        () => { this.activeRulerId = null; }),
      E(this.activeFurnitureId, f.furniture,
        id => { f.furniture = f.furniture.filter(x => x.id !== id); },
        () => { this.activeFurnitureId = null; }),
      E(this.store.activeSensorId, f.sensors,
        id => { f.sensors = f.sensors.filter(x => x.id !== id); },
        () => { this.store.activeSensorId = null; }),
      E(this.activeMotionId, f.motionSensors,
        id => { f.motionSensors = f.motionSensors.filter(x => x.id !== id); },
        () => { this.activeMotionId = null; }),
      E(this.activeEnvId, f.envSensors,
        id => { f.envSensors = f.envSensors.filter(x => x.id !== id); },
        () => { this.activeEnvId = null; }),
      E(this.activeBleId, f.bleProxies,
        id => { f.bleProxies = (f.bleProxies ?? []).filter(x => x.id !== id); },
        () => { this.activeBleId = null; }),
      E(this.activeAlarmId, f.alarmPanels,
        id => { f.alarmPanels = (f.alarmPanels ?? []).filter(x => x.id !== id); },
        () => { this.activeAlarmId = null; }),
      E(this.activeCalendarId, f.calendarPanels,
        id => { f.calendarPanels = (f.calendarPanels ?? []).filter(x => x.id !== id); },
        () => { this.activeCalendarId = null; }),
      E(this.activeThermoId, f.thermostats,
        id => { f.thermostats = (f.thermostats ?? []).filter(x => x.id !== id); },
        () => { this.activeThermoId = null; }),
      E(this.activeSafetyId, f.safetySensors,
        id => { f.safetySensors = (f.safetySensors ?? []).filter(x => x.id !== id); },
        () => { this.activeSafetyId = null; }),
      E(this.activeAlertBeaconId, f.alertBeacons,
        id => { f.alertBeacons = (f.alertBeacons ?? []).filter(x => x.id !== id); },
        () => { this.activeAlertBeaconId = null; }),
      E(this.activeRobotId, f.robots,
        id => { f.robots = (f.robots ?? []).filter(x => x.id !== id); delete this.robotStates[id]; },
        () => { this.activeRobotId = null; }),
      E(this.activeCameraId, f.cameras,
        id => { f.cameras = (f.cameras ?? []).filter(x => x.id !== id); },
        () => { this.activeCameraId = null; }),
      E(this.activeProjectorId, f.projectors,
        id => { f.projectors = (f.projectors ?? []).filter(x => x.id !== id); },
        () => { this.activeProjectorId = null; }),
      E(this.activeValveId, f.valves,
        id => { f.valves = (f.valves ?? []).filter(x => x.id !== id); },
        () => { this.activeValveId = null; }),
      E(this.activePlugId, f.plugs,
        id => { f.plugs = (f.plugs ?? []).filter(x => x.id !== id); },
        () => { this.activePlugId = null; }),
      E(this.activeInfoId, f.infoCards,
        id => { f.infoCards = (f.infoCards ?? []).filter(x => x.id !== id); },
        () => { this.activeInfoId = null; }),
      E(this.activeActionId, f.actionButtons,
        id => { f.actionButtons = (f.actionButtons ?? []).filter(x => x.id !== id); },
        () => { this.activeActionId = null; }),
      E(this.activePZoneId, f.presenceZones,
        id => { f.presenceZones = (f.presenceZones ?? []).filter(x => x.id !== id); },
        () => { this.activePZoneId = null; }),
      E(this.activeSprinklerId, f.sprinklerZones,
        id => { f.sprinklerZones = (f.sprinklerZones ?? []).filter(x => x.id !== id); },
        () => { this.activeSprinklerId = null; }),
      E(this.activeFlagpoleId, f.flagpoles,
        id => { f.flagpoles = (f.flagpoles ?? []).filter(x => x.id !== id); },
        () => { this.activeFlagpoleId = null; }),
      E(this.activeGroundAreaId, f.groundAreas,
        id => { f.groundAreas = (f.groundAreas ?? []).filter(x => x.id !== id); },
        () => { this.activeGroundAreaId = null; }),
      E(this.activePoolId, f.pools,
        id => { f.pools = (f.pools ?? []).filter(x => x.id !== id); },
        () => { this.activePoolId = null; }),
      E(this.activeVoidAreaId, f.voidAreas,
        id => { f.voidAreas = (f.voidAreas ?? []).filter(x => x.id !== id); },
        () => { this.activeVoidAreaId = null; }),
    ];

    for (const ent of entries) {
      if (!ent.id) continue;
      const item = ent.arr?.find(x => x.id === ent.id);
      if (!item) { ent.clear(); continue; }   // stale selection — clear + keep scanning
      if (item.locked) {                       // locked: refuse, don't fall through
        console.info('Diorama: selected item is locked — not deleted.');
        return false;
      }
      ent.remove(ent.id);
      ent.clear();
      this.save();
      this.emitConfig();
      return true;
    }
    return false;
  }

  // Delete the currently-selected vertex. Polygons (presence/ground/void) keep
  // ≥3 points — a delete that would drop below refuses. A wall vertex uses the
  // delete-tool rule: a 2-point wall is removed whole, longer polylines lose the
  // vertex. Locked owners refuse. Clears the vertex selection either way.
  private _deleteSelectedVertex(f: Floor): boolean {
    const sv = this.selectedVertex!;
    if (sv.kind === 'wall') {
      const wall = f.walls.find(w => w.id === sv.itemId);
      if (!wall) { this.selectedVertex = null; return false; }
      if (wall.locked) { console.info('Diorama: wall is locked — vertex not deleted.'); return false; }
      wall.points.splice(sv.index, 1);
      if (wall.points.length < 2) f.walls = f.walls.filter(x => x.id !== wall.id);
      this.selectedVertex = null;
      this.save(); this.emitConfig();
      return true;
    }
    // Path-backed ground area: the handle is a CENTERLINE point — drop it (min 2)
    // and regenerate the derived polygon.
    if (sv.kind === 'path') {
      const g = (f.groundAreas ?? []).find(x => x.id === sv.itemId);
      if (!g || !g.path) { this.selectedVertex = null; return false; }
      if (g.locked) { console.info('Diorama: shape is locked — vertex not deleted.'); return false; }
      if (g.path.centerline.length <= 2) {
        console.info('Diorama: a path needs at least 2 centerline points — vertex not deleted.');
        return false;
      }
      g.path.centerline.splice(sv.index, 1);
      this.regenGroundAreaPath(g);
      this.selectedVertex = null;
      this.save(); this.emitConfig();
      return true;
    }
    const arr = sv.kind === 'pzone' ? f.presenceZones
              : sv.kind === 'ground' ? f.groundAreas
              : sv.kind === 'pool' ? f.pools
              : f.voidAreas;
    const poly = arr?.find(x => x.id === sv.itemId);
    if (!poly) { this.selectedVertex = null; return false; }
    if (poly.locked) { console.info('Diorama: shape is locked — vertex not deleted.'); return false; }
    if (poly.points.length <= 3) {
      console.info('Diorama: a polygon needs at least 3 points — vertex not deleted.');
      return false;   // refuse (keep the vertex selected so the user sees no change)
    }
    poly.points.splice(sv.index, 1);
    this.selectedVertex = null;
    this.save(); this.emitConfig();
    return true;
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
    this._detectApplianceEvents(states);

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
    // Weather alerts (independent of the weather source): recompute when the
    // bound alert entity changes or on a full refresh. Config-path (see
    // _isSlowEntity) so the chip badge + sidebar preview repaint on change.
    const alertId = w?.alerts?.entityId;
    if (changedId === undefined || (alertId != null && changedId === alertId)) {
      this._recomputeWeatherAlerts(states);
    }
    // Weather "moment" detection (rain/severe/alert onset → house-wide event
    // bubbles). Idempotent: no-op when nothing transitioned. Runs after both
    // recomputes above so it sees the fresh condition + alert list.
    this._detectWeatherEvents();
    // One-time weather setup on the first full state load (starts the Open-Meteo
    // poll if that source is configured in the local cache). _loadFromHa may
    // replace the config afterward and re-runs _reconfigureWeather itself.
    if (!this._weatherInited && changedId === undefined) {
      this._weatherInited = true;
      this._reconfigureWeather();
    }
    // One-time wall-calendar poll start on the first full state load. Re-run by
    // _applyLoadedStore once the authoritative config lands (both idempotent).
    if (!this._calendarInited && changedId === undefined) {
      this._calendarInited = true;
      this._startCalendarPoll();
    }
    // A bound calendar entity flipping on↔off is a cheap nudge to re-poll the
    // full agenda sooner than the timer (a new/ended event just changed state).
    if (changedId !== undefined && (this.floor().calendarPanels ?? [])
        .some(c => (c.calendarIds ?? []).includes(changedId))) {
      void this._refreshCalendars();
    }
    // One-time MQTT bridge start from the local-cache config on first full load
    // (mirrors _weatherInited). _applyLoadedStore re-runs it once HA's
    // authoritative config lands; both are idempotent.
    if (!this._mqttInited && changedId === undefined) {
      this._mqttInited = true;
      void this._reconfigureMqtt();
    }
    // One-time Alert Center start on the first full load (auth is done + states
    // arrived, so the WS subscribe / Repairs poll won't race auth). Idempotent;
    // _applyLoadedStore re-runs _reconfigureAlertCenter once HA's config lands.
    if (!this._alertInited && changedId === undefined) {
      this._alertInited = true;
      this._reconfigureAlertCenter();
    }
    // One-time flight/ISS poll start from the local-cache config on the first
    // full load (mirrors _weatherInited). _applyLoadedStore re-runs it once HA's
    // authoritative config lands; both are idempotent.
    if (!this._flightsInited && changedId === undefined) {
      this._flightsInited = true;
      void this._reconfigureFlights();
    }
    // 'entity' flight source: the bound rest-sensor proxy pushed new aircraft.
    // Its id is config-path (see _isSlowEntity) so the sidebar repaints too.
    const fCfg = this.store.flights;
    if (fCfg?.enabled && (fCfg.source ?? 'cloud') === 'entity' && fCfg.entityId
        && (changedId === undefined || changedId === fCfg.entityId)) {
      this._recomputeFlightsFromEntity();
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

  // Pull the persisted config registry from HA (source of truth). Runs once,
  // after the first full state sync. Migrates the legacy single-store `diorama`
  // key on first run. Falls back to the localStorage caches on any failure.
  private async _loadFromHa(): Promise<void> {
    if (!this.hass || this._haStoreLoaded) return;
    this._haStoreLoaded = true;
    try {
      await this._loadConfigs();
    } catch (err) {
      console.warn('HA storage load failed (using local cache):', err);
    }
  }

  // Config load order: index (HA → cache → migrate) then the ACTIVE body
  // (HA → active-body cache), applied through the shared normalization.
  private async _loadConfigs(): Promise<void> {
    if (!this.hass) return;
    let index = await this.hass.getUserData<ConfigIndex>(Planner.INDEX_KEY);
    if (!index || !Array.isArray(index.configs) || index.configs.length === 0) {
      index = loadConfigsCache();
    }
    if (!index || !Array.isArray(index.configs) || index.configs.length === 0) {
      index = await this._migrateLegacy();
    }
    if (!index.configs.some(c => c.id === index!.activeId)) index.activeId = index.configs[0].id;
    this.configIndex = index;
    this.activeConfigId = index.activeId;
    saveConfigsCache(index);
    const body = await this._loadBody(index.activeId);
    if (body) {
      this._applyLoadedStore(body);
    } else {
      // Nothing stored anywhere for the active id — promote the current cache.
      await this._writeBody(index.activeId, this.store);
      this._reconfigureWeather();
      this.emitConfig();
    }
  }

  // First-run migration: the legacy single-store `diorama` key becomes config
  // { id:'default', name:'Default' } (body copied to diorama-cfg-default, index
  // written). Legacy key is LEFT in place but never written again. If legacy is
  // empty, seed the default body from the current (cached / default) store.
  private async _migrateLegacy(): Promise<ConfigIndex> {
    let base = this.store;
    if (this.hass) {
      const legacy = await this.hass.getUserData<Store>(Planner.HA_STORE_KEY);
      if (legacy && Array.isArray(legacy.floors) && legacy.floors.length > 0) base = legacy;
    }
    const index: ConfigIndex = {
      version: 1, activeId: 'default',
      configs: [{ id: 'default', name: 'Default', updatedAt: Date.now() }],
    };
    await this._writeBody('default', base);
    await this.hass?.setUserData(Planner.INDEX_KEY, index);
    return index;
  }

  // Read a config body from HA; fall back to the active-body cache only for the
  // active id (that's the one diorama:store:v1 mirrors). null if nowhere.
  private async _loadBody(id: string): Promise<Store | null> {
    if (!this.hass) return null;
    const remote = await this.hass.getUserData<Store>(cfgBodyKey(id));
    if (remote && Array.isArray(remote.floors) && remote.floors.length > 0) return remote;
    if (id === this.activeConfigId) {
      const cached = loadStore();
      if (cached && Array.isArray(cached.floors) && cached.floors.length > 0) return cached;
    }
    return null;
  }

  private async _writeBody(id: string, store: Store): Promise<void> {
    if (!this.hass) return;
    try { await this.hass.setUserData(cfgBodyKey(id), store); }
    catch (err) { console.warn('config body write failed:', err); }
  }

  // Apply a loaded / imported / switched Store through the SAME normalization
  // the initial load uses — the field list lives ONLY here (the _loadFromHa
  // explicit-list gotcha: any new top-level Store field MUST be added here).
  // Resets transient view state like a floor switch, rewrites the active-body
  // cache, reconfigures weather, and emits config. Suppresses save-back while
  // applying so the fresh payload isn't immediately pushed back.
  private _applyLoadedStore(remote: Store): void {
    this._suppressHaSave = true;
    try {
      // Prefer the loaded store's own current floor (a fresh load / switch).
      this.store = this._normalizeStore(remote, remote.currentFloorId ?? null);
      // Reflect the authoritative pack config into the registry snapshot so
      // resolveAvatar / activeAvatarIds see it, then re-hydrate loaded packs.
      setAvatarPacksConfig(this.store.avatarPacks);
      void this._hydrateAvatarPacks();
      // Reset transient view state to match the loaded store.
      this.activeMotionId = null;
      this.activeRoamerId = null;
      this.activeEnvId = null;
      this.activeBleId = null;
      this.activeAlarmId = null;
      this.activeCalendarId = null;
      this.activeThermoId = null;
      this.activeSafetyId = null;
      this.activeAlertBeaconId = null;
      this.activeRobotId = null;
      this.activeCameraId = null;
      this.activeProjectorId = null;
      this.activeValveId = null;
      this.activePlugId = null;
      this.activeInfoId = null;
      this.activeActionId = null;
      this.activePZoneId = null;
      this.activeGroundAreaId = null;
      this.activePoolId = null;
      this.activeVoidAreaId = null;
      this.activeRulerId = null;
      this.robotStates = {};
      this.activePersonId = null;
      this.selectedVertex = null;
      // Fresh session: a restored selection is COLD (the user hasn't touched it),
      // so the destructive keys stay gated until a genuine selection happens.
      this.selectionHot = false;
      this.newlyPlacedFocus = null;
      this.viewCenter = null;
      this.zoom = 1;
      this.drag = null;
      this.editZone = null;
      this.drawingWall = null;
      this.drawingPresenceZone = null;
      this.drawingGroundArea = null;
      this.drawingVoidArea = null;
      this.drawingPath = null;
      this.drawingPoolArea = null;
      this.drawingExclusion = null;
      this.drawingRuler = null;
      this.pickingDimWalls = false;
      this.landmarkSuggestId = null;
      this.showDetails = this.store.showDetails === true;
      this.useRawTargets = this.store.useRawTargets === true;
      // Mirror to localStorage as the ACTIVE config body cache.
      saveStore(this.store);
    } finally {
      this._suppressHaSave = false;
    }
    // Re-apply the weather source now that the authoritative config loaded
    // (restarts / stops the Open-Meteo poll, recomputes local sources).
    this._reconfigureWeather();
    // (Re)start the wall-calendar poll to match the authoritative config.
    this._calendarInited = true;
    this._startCalendarPoll();
    // (Re)start the MQTT bridge to match the authoritative config.
    this._mqttInited = true;
    void this._reconfigureMqtt();
    // (Re)resolve the OpenFreeMap neighborhood overlay to match the config +
    // geo fit (inert unless enabled + a calibrated landmark exists).
    void this._reconfigureNeighborhood();
    // (Re)start the flight/ISS polls to match the authoritative config (inert
    // unless enabled + an observer origin resolves).
    this._flightsInited = true;
    void this._reconfigureFlights();
    // (Re)start the Alert Center collectors to match the authoritative config
    // (honors the enabled toggle; only starts once a connection exists).
    if (this._alertInited) this._reconfigureAlertCenter();
    // A fresh config load / switch / import invalidates undo history (and this
    // is the single funnel for initial load + every registry op — so the stacks
    // clear in ONE place). Baseline is the just-loaded store.
    this._resetUndoHistory();
    this.emitConfig();
  }

  // Normalize a loaded / imported / restored Store through the explicit field
  // list (the _loadFromHa gotcha: any new top-level Store field MUST be added
  // here) + repairFloor on each floor. `preferFloorId` keeps that floor current
  // when it still exists (undo preserves the view; a load passes the loaded
  // store's own current floor). Pure — sets nothing on `this`.
  private _normalizeStore(remote: Store, preferFloorId: string | null): Store {
    const floors = remote.floors.map(f => repairFloor(f));
    const currentFloorId = preferFloorId && floors.some(f => f.id === preferFloorId)
      ? preferFloorId : floors[0].id;
    return {
      v: 2,
      floors,
      currentFloorId,
      activeSensorId: null,
      coverage:      remote.coverage      ?? true,
      imperial:      remote.imperial      ?? false,
      showDetails:   remote.showDetails   ?? false,
      useRawTargets: remote.useRawTargets ?? false,
      showMotionZones: remote.showMotionZones ?? true,
      // Pass-through settings objects. scene3d was silently DROPPED here for a
      // while (3D appearance reset on every load) — keep every new top-level
      // Store field in this list.
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
      mqttBridge:     remote.mqttBridge     ?? undefined,
      neighborhood:   remote.neighborhood   ?? undefined,
      flights:        remote.flights        ?? undefined,
      avatarPacks:    remote.avatarPacks    ?? undefined,
      notes:          remote.notes          ?? undefined,
      avatarInteractions: remote.avatarInteractions ?? undefined,
      avatarCostumes: remote.avatarCostumes ?? undefined,
      avatarProps: remote.avatarProps ?? undefined,
      showFloorStats: remote.showFloorStats ?? undefined,
      bgText:         remote.bgText         ?? undefined,
      bgTexts:        this._migrateBgTexts(remote),
      heatmap:        remote.heatmap        ?? undefined,
      compass:        remote.compass        ?? undefined,
    };
  }

  // Resolve the persisted background-text list, migrating the legacy single
  // `bgText` config into a one-entry `bgTexts` list ONCE (when bgTexts is absent
  // and the legacy config has a non-off mode with content). Runs in the same
  // normalize path as every load/import/undo, so migration is idempotent — once
  // `bgTexts` exists we use it and the legacy field is never read again. Caps the
  // list at 6 entries and drops malformed rows.
  private _migrateBgTexts(remote: Store): BgTextEntry[] | undefined {
    if (Array.isArray(remote.bgTexts)) {
      const modes: BgTextEntryMode[] = ['sky', 'banner', 'grass', 'train', 'chopper'];
      const out = remote.bgTexts
        .filter(e => e && typeof e.id === 'string' && modes.includes(e.mode))
        .slice(0, 6)
        .map(e => ({
          id: e.id, mode: e.mode,
          text: e.text, entityId: e.entityId, format: e.format,
          maxCars: e.maxCars,
        }));
      return out.length ? out : undefined;
    }
    const bt = remote.bgText;
    if (bt && (bt.mode ?? 'off') !== 'off') {
      const hasContent = !!(bt.entityId || (bt.text ?? '').trim());
      if (hasContent) {
        return [{
          id: 'bt_' + Math.random().toString(36).slice(2, 9),
          mode: bt.mode as BgTextEntryMode,
          text: bt.text, entityId: bt.entityId, format: bt.format,
        }];
      }
    }
    return undefined;
  }

  // ── Configuration registry API (Batch B) ─────────────────────────────────
  // All mutating ops are edit-mode-only (guarded like save()). Kiosk/view can't
  // reach them (settings tabs are edit-only) but the guard is belt-and-braces.

  listConfigs(): ConfigMeta[] {
    return this.configIndex ? this.configIndex.configs.map(c => ({ ...c })) : [];
  }
  get lastSavedAt(): number | null { return this._lastSavedAt; }

  private _newConfigId(name: string): string {
    const slug = (name || 'config').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '').slice(0, 24) || 'config';
    const taken = new Set((this.configIndex?.configs ?? []).map(c => c.id));
    let id = slug + '-' + Math.random().toString(36).slice(2, 7);
    while (taken.has(id)) id = slug + '-' + Math.random().toString(36).slice(2, 7);
    return id;
  }

  // Explicit immediate write of the active config (cancels the debounce).
  async saveConfigNow(): Promise<void> {
    if (this.uiMode !== 'edit') return;
    if (this._haSaveTimer) { clearTimeout(this._haSaveTimer); this._haSaveTimer = null; }
    saveStore(this.store);
    await this._flushSave();
  }

  // Switch the active config: flush the current config's pending save, load the
  // target body, persist activeId, and swap the store through the SAME
  // normalization as initial load (full emitConfig + view/tool/selection reset).
  async switchConfig(id: string): Promise<void> {
    if (this.uiMode !== 'edit' || !this.configIndex) return;
    if (id === this.activeConfigId) return;
    if (!this.configIndex.configs.some(c => c.id === id)) return;
    // Flush any pending save of the CURRENT config first so its edits aren't
    // lost AND don't land on the new body (the debounce uses activeConfigId).
    if (this._haSaveTimer) { clearTimeout(this._haSaveTimer); this._haSaveTimer = null; await this._flushSave(); }
    const body = await this._loadBody(id) ?? defaultStore();
    this.activeConfigId = id;
    this.configIndex.activeId = id;
    saveConfigsCache(this.configIndex);
    await this.hass?.setUserData(Planner.INDEX_KEY, this.configIndex);
    // _applyLoadedStore rewrites the diorama:store:v1 cache to the new body, so
    // a stale cache from config A never paints config B's session.
    this._applyLoadedStore(body);
  }

  // Clone the current store under a new id + switch to it.
  async saveConfigAs(name: string): Promise<string> {
    if (this.uiMode !== 'edit' || !this.configIndex) return '';
    // Persist the current config first so its body reflects the latest edits.
    if (this._haSaveTimer) { clearTimeout(this._haSaveTimer); this._haSaveTimer = null; await this._flushSave(); }
    const id = this._newConfigId(name);
    const clone = JSON.parse(JSON.stringify(this.store)) as Store;
    await this._writeBody(id, clone);
    this.configIndex.configs.push({ id, name: name || 'Untitled', updatedAt: Date.now() });
    this.configIndex.activeId = id;
    this.activeConfigId = id;
    saveConfigsCache(this.configIndex);
    await this.hass?.setUserData(Planner.INDEX_KEY, this.configIndex);
    this._applyLoadedStore(clone);
    return id;
  }

  // Start a brand-new config from a FRESH default store + switch to it. Same
  // semantics as saveConfigAs except the new body is defaultStore() (all
  // top-level Store fields at their first-boot defaults) instead of a clone of
  // the current store — so it never bleeds the old config's floors/notes.
  async newConfig(name: string): Promise<string> {
    if (this.uiMode !== 'edit' || !this.configIndex) return '';
    // Persist the current config first so its pending edits land on the OLD
    // body (the debounce keys off activeConfigId, so flush before switching).
    if (this._haSaveTimer) { clearTimeout(this._haSaveTimer); this._haSaveTimer = null; await this._flushSave(); }
    const id = this._newConfigId(name);
    const fresh = defaultStore();
    await this._writeBody(id, fresh);
    this.configIndex.configs.push({ id, name: name || 'Untitled', updatedAt: Date.now() });
    this.configIndex.activeId = id;
    this.activeConfigId = id;
    saveConfigsCache(this.configIndex);
    await this.hass?.setUserData(Planner.INDEX_KEY, this.configIndex);
    this._applyLoadedStore(fresh);
    return id;
  }

  // Create a new config from a Sweet Home 3D structural import. Mirrors
  // newConfig() but seeds the body with the CONVERTED floors instead of a fresh
  // default's single empty floor: defaultStore() for every top-level Store
  // field at its first-boot default, then replace floors (each passed through
  // repairFloor so every backfilled array is present). See src/sh3d.ts.
  async importSh3dConfig(name: string, floors: Floor[]): Promise<{ ok: boolean; id?: string; error?: string }> {
    if (this.uiMode !== 'edit') return { ok: false, error: 'Editing disabled.' };
    if (!this.configIndex) return { ok: false, error: 'Configs not loaded yet.' };
    if (!floors.length) return { ok: false, error: 'Nothing to import (no floors).' };
    // Flush the current config's pending save onto the OLD body before switching.
    if (this._haSaveTimer) { clearTimeout(this._haSaveTimer); this._haSaveTimer = null; await this._flushSave(); }
    const id = this._newConfigId(name);
    const fresh = defaultStore();
    fresh.floors = floors.map(f => repairFloor(f));
    fresh.currentFloorId = fresh.floors[0].id;
    await this._writeBody(id, fresh);
    this.configIndex.configs.push({ id, name: name || 'Imported', updatedAt: Date.now() });
    this.configIndex.activeId = id;
    this.activeConfigId = id;
    saveConfigsCache(this.configIndex);
    await this.hass?.setUserData(Planner.INDEX_KEY, this.configIndex);
    this._applyLoadedStore(fresh);
    return { ok: true, id };
  }

  async renameConfig(id: string, name: string): Promise<void> {
    if (this.uiMode !== 'edit' || !this.configIndex) return;
    const meta = this.configIndex.configs.find(c => c.id === id);
    if (!meta) return;
    meta.name = name || meta.name;
    meta.updatedAt = Date.now();
    saveConfigsCache(this.configIndex);
    await this.hass?.setUserData(Planner.INDEX_KEY, this.configIndex);
    this.emitConfig();
  }

  // Delete a config. Refuses when it's the only one. If active, switches to the
  // first remaining. The body is tombstoned (empty {} — some HA builds reject a
  // null set_user_data value) and dropped from the index.
  async deleteConfig(id: string): Promise<void> {
    if (this.uiMode !== 'edit' || !this.configIndex) return;
    if (this.configIndex.configs.length <= 1) return;   // never delete the last one
    if (!this.configIndex.configs.some(c => c.id === id)) return;
    const wasActive = id === this.activeConfigId;
    if (wasActive && this._haSaveTimer) { clearTimeout(this._haSaveTimer); this._haSaveTimer = null; }
    try { await this.hass?.setUserData(cfgBodyKey(id), {}); } catch { /* best effort */ }
    this.configIndex.configs = this.configIndex.configs.filter(c => c.id !== id);
    if (wasActive) {
      const first = this.configIndex.configs[0].id;
      this.configIndex.activeId = first;
      this.activeConfigId = first;
    }
    saveConfigsCache(this.configIndex);
    await this.hass?.setUserData(Planner.INDEX_KEY, this.configIndex);
    if (wasActive) {
      const body = await this._loadBody(this.activeConfigId) ?? defaultStore();
      this._applyLoadedStore(body);
    } else {
      this.emitConfig();
    }
  }

  // Full export envelope. Serializes the WHOLE store (nothing stripped) +
  // pulls the user-imported avatar pack bodies from IndexedDB so an import on a
  // fresh browser is self-contained.
  async exportConfig(): Promise<DioramaEnvelope> {
    const store = JSON.parse(JSON.stringify(this.store)) as Store;
    const name = this.listConfigs().find(c => c.id === this.activeConfigId)?.name ?? 'Diorama';
    let userAvatarPacks: AvatarPackDef[] | undefined;
    try {
      const defs: AvatarPackDef[] = [];
      for (const { json } of await loadAllPacks()) {
        try {
          const v = validatePackJson(JSON.parse(json));
          if (v.ok && v.pack) defs.push(v.pack);
        } catch { /* skip malformed */ }
      }
      if (defs.length) userAvatarPacks = defs;
    } catch { /* IDB unavailable */ }
    return { diorama: 2, name, exportedAt: new Date().toISOString(), store, userAvatarPacks };
  }

  // Import an envelope OR a legacy bare-store JSON as a NEW config + switch to
  // it. Never overwrites the current config. Returns { ok } with a readable
  // error (never throws).
  async importConfig(text: string, fallbackName = 'Imported'): Promise<{ ok: boolean; id?: string; error?: string }> {
    if (this.uiMode !== 'edit') return { ok: false, error: 'Editing disabled.' };
    if (!this.configIndex) return { ok: false, error: 'Configs not loaded yet.' };
    let parsed: unknown;
    try { parsed = JSON.parse(text); }
    catch (err) { return { ok: false, error: 'Invalid JSON: ' + (err as Error).message }; }
    const p = parsed as Record<string, unknown> | null;
    let store: Store;
    let name = fallbackName;
    let userPacks: unknown[] | undefined;
    if (p && p.diorama === 2 && p.store && Array.isArray((p.store as Store).floors)) {
      store = p.store as Store;
      if (typeof p.name === 'string' && p.name.trim()) name = p.name;
      if (Array.isArray(p.userAvatarPacks)) userPacks = p.userAvatarPacks;
    } else if (p && Array.isArray((p as unknown as Store).floors)) {
      store = p as unknown as Store;   // legacy bare store
    } else {
      return { ok: false, error: 'Not a Diorama export (no floors).' };
    }
    if (userPacks) await this._importUserPacks(userPacks);
    const id = this._newConfigId(name);
    const clone = JSON.parse(JSON.stringify(store)) as Store;
    await this._writeBody(id, clone);
    this.configIndex.configs.push({ id, name: name || 'Imported', updatedAt: Date.now() });
    this.configIndex.activeId = id;
    this.activeConfigId = id;
    saveConfigsCache(this.configIndex);
    await this.hass?.setUserData(Planner.INDEX_KEY, this.configIndex);
    this._applyLoadedStore(clone);
    return { ok: true, id };
  }

  // Register user-imported avatar packs (from an envelope) into IDB + the
  // registry, skipping id collisions with builtins / already-present packs.
  private async _importUserPacks(defs: unknown[]): Promise<void> {
    for (const raw of defs) {
      const v = validatePackJson(raw);
      if (!v.ok || !v.pack) continue;
      const def = v.pack;
      if (getPack(def.id)) continue;   // skip collisions (builtins / existing)
      try {
        await savePackJson(def.id, JSON.stringify(def));
        registerPack(def, 'user');
      } catch (err) {
        console.warn('avatar pack import failed:', err);
      }
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
    // The 'entity' flight source's bound rest-sensor proxy: config-path so the
    // sidebar status + the renderer dirty key repaint when a new aircraft list
    // lands. Scoped to that ONE configured id, and only while that source is
    // selected (a blanket rule would emit for unrelated sensor traffic).
    if (this.store.flights?.source === 'entity' && this.store.flights.entityId === id) return true;
    // Bound environmental sensor entities route through the config channel so
    // the sidebar's live readings re-render. Only entities actually bound on
    // the current floor qualify — a blanket sensor.* rule would emit config
    // for every sensor state change in HA.
    if (this.floor().envSensors.some(e => e.entity_id === id)) return true;
    // Bound info-card entities (any domain) route through the config channel so
    // the sidebar reading + the 3D _keyInfo dirty key repaint on change. Scoped
    // to the current floor's bound ids (a blanket rule would emit for every
    // state change in HA). Clock/date cards bind nothing and repaint per-tick.
    if ((this.floor().infoCards ?? []).some(c => c.entity_id === id)) return true;
    // Action-button bound targets (script/scene/button/automation/toggle entity):
    // config-path like alarm/lock ids — they change rarely (a bound script's
    // on/off running-glow only needs config-cadence, not 10 Hz).
    if ((this.floor().actionButtons ?? []).some(b => b.entity_id === id)) return true;
    // Logical-state light logic entities: the light's ON/color/flash derives from
    // this entity through the rule engine. Config-path so the sidebar preview + the
    // 3D _keyLights dirty key repaint on change (the 2D RAF reads live regardless).
    if (this.floor().lights.some(l => l.logic?.entityId === id)) return true;
    // Fridge door sensors (Furniture.doorEntity) + door lock entities
    // (Door.lockEntity) + alarm panel entities: bound display-only bindings that
    // aren't number/switch, routed through the config channel so the sidebar
    // badges (and the 3D dirty keys, which also fold these) refresh on change.
    const f2 = this.floor();
    if (f2.furniture.some(fu => fu.doorEntity === id || fu.tempEntity === id ||
      fu.jobStateEntity === id || fu.moistureEntity === id ||
      fu.evCharger?.statusEntity === id || fu.evCharger?.powerEntity === id ||
      fu.mailCount?.countEntity === id || fu.mailCount?.flagEntity === id)) return true;
    if (f2.doors.some(d => d.lockEntity === id)) return true;
    // Window curtain bound entities (cover.*/binary_sensor; switch.* already caught
    // above): config-path so the sidebar openness preview + the 3D _keyDoors dirty
    // key repaint on change. Scoped to current-floor window ids (Window.coverEntity
    // deliberately stays LIVE-path; the 2D RAF reads curtains live regardless).
    if (f2.windows.some(w => w.curtain?.entityId === id)) return true;
    if ((f2.alarmPanels ?? []).some(a => a.entity_id === id)) return true;
    // Wall-calendar bound calendar.* ids: config-path so the sidebar next-event
    // line + the 3D _keyCalendar dirty key refresh on an on↔off flip (a cheap
    // nudge to also re-poll the full agenda sooner — see _refreshCalendars). The
    // full event list is a separate poll, not read from state.
    if ((f2.calendarPanels ?? []).some(c => (c.calendarIds ?? []).includes(id))) return true;
    // TV "news" screen source entity (sensor.*/event.* headline feed): config-
    // path so the ticker text + _keyNowPlaying rebuild when new headlines land.
    if ((f2.furniture ?? []).some(fu => fu.newsEntity === id)) return true;
    // Bound climate/thermostat entities: current_temperature can tick often, but
    // config-cadence is enough for the sidebar reading + the 3D _keyThermo dirty
    // key (which buckets temps). Scoped to the current floor's bound ids.
    if ((f2.thermostats ?? []).some(t => t.entity_id === id)) return true;
    // Smoke / CO detector binary_sensors: display-only bindings routed through
    // the config channel so 2D/3D dirty keys + sidebar badges refresh on alarm.
    if ((f2.safetySensors ?? []).some(s => s.entity_id === id)) return true;
    // Alert Beacon bound entities (alert.*/binary_sensor): config-path (alert.*
    // changes a handful of times a day) so the 2D/3D beacon + sidebar badge
    // rebuild when it flips active/acknowledged/idle.
    if ((f2.alertBeacons ?? []).some(b => b.entity_id === id)) return true;
    // Room occupancy sensors (#1): config-path so the sidebar ● indicator + the
    // 3D floor-patch tint (folded into _keyFloor) rebuild on an occupancy flip
    // (infrequent). The 2D activity glow reads live regardless.
    if ((f2.rooms ?? []).some(rm => rm.occupancyEntity === id)) return true;
    // Robot bindings (vacuum/lawn_mower activity + mower GPS source ids): route
    // through the config channel so the sidebar state badge + GPS status refresh
    // on change. Scoped to the current floor's bound ids only.
    if ((f2.robots ?? []).some(r =>
      r.entity_id === id || r.trackerEntity === id || r.latEntity === id || r.lonEntity === id ||
      r.progressEntity === id)) return true;
    // Presence-zone occupancy sensors (#5): config-path so 2D/3D dirty keys +
    // sidebar badge refresh on an occupancy flip. The 2D RAF reads the glow live.
    if ((f2.presenceZones ?? []).some(z => z.entity_id === id)) return true;
    // Camera entities + alert sensors (#10): recording-state / alert changes are
    // rare; the sidebar wants to refresh the badge + the alert-row status. The
    // 2D/3D canvases read the alert live regardless. Scoped to current-floor ids.
    if ((f2.cameras ?? []).some(c => c.entity_id === id || c.alertEntity === id)) return true;
    // Projector fixtures: the bound on/off entity (media_player/switch/light) is
    // config-path so the 3D beam + 2D throw wedge rebuild when it flips. A TV's
    // bias-light bound entity (Furniture.biasLight.entityId) too — its glow folds
    // into _keyFloor via the appliance hash. Scoped to current-floor bound ids.
    if ((f2.projectors ?? []).some(pr => pr.entity_id === id)) return true;
    if ((f2.furniture ?? []).some(fu => fu.biasLight?.entityId === id)) return true;
    // Water valves (valve.*/switch.*/binary_sensor) + smart plugs (switch.*/
    // light.*): the bound on/off entity is config-path so the 3D _keyValves /
    // _keyPlugs dirty keys + sidebar badges rebuild when it flips. A plug's
    // powerEntity is deliberately LEFT LIVE-path (chatty W; the 3D key folds a
    // bucketed reading recomputed each tick, like Furniture.powerEntity). Scoped
    // to the current floor's bound ids.
    if ((f2.valves ?? []).some(v => v.entity_id === id)) return true;
    if ((f2.plugs ?? []).some(pl => pl.entity_id === id)) return true;
    // Flagpole hoist source (sensor/number percent or cover position): config-path
    // so the 3D _keyFlagpoles dirty key + sidebar preview repaint on a change.
    if ((f2.flagpoles ?? []).some(fp => fp.entityId === id)) return true;
    // Pools (T4): all bound heater/pump/light/chemistry sensor ids are config-path
    // (per pool-spa.md §4.6) so the water glow, 2D chip, and 3D _keyPool dirty key
    // repaint promptly on a state change. Scoped to the current floor's bound ids.
    if ((f2.pools ?? []).some(pl =>
      pl.heaterEntity === id || pl.pumpEntity === id ||
      (pl.lightEntities ?? []).includes(id) ||
      pl.waterTempEntity === id || pl.phEntity === id || pl.orpEntity === id || pl.saltEntity === id)) return true;
    // GPS source entities (a person.* or device_tracker.* bound to a Store.people
    // entry) are config-path so the sidebar GPS status line + 3D pins refresh on
    // a new fix. Bounded to the specific bound ids (GPS pushes are minutes apart,
    // so the extra config emits are negligible) — same precedent as env/weather;
    // the 2D canvas RAF reads gpsPins live regardless.
    if ((this.store.people ?? []).some(pe => pe.haPersonId === id || pe.gpsTrackerId === id)) return true;
    // Bound weather source entities are config-path too (chip + sidebar preview
    // re-render on change). Only the specific bound ids qualify.
    // The alert entity (any domain, rare-but-urgent) is config-path as well so
    // the chip badge + settings preview repaint the moment an alert fires/clears.
    if (this.store.weather?.alerts?.entityId === id) return true;
    // Background-text bound entities (store-level, multi-entry): config-path so
    // the 3D _keyBgText dirty key + settings preview repaint when a message
    // changes. Scoped to the specific bound ids, like today's single one.
    if ((this.store.bgTexts ?? []).some(e => e.entityId === id)) return true;
    return this._weatherEntityIds().includes(id);
  }

  // Resolve one background-text entry's displayed string: the bound entity's
  // FORMATTED state (formatEntityValue) when an entity is bound, else the static
  // `text`. Cap is PER-MODE — grass reflows multi-line so it takes 160 chars;
  // every other style (banner/skywriting/train/chopper) wants short text → 40.
  // Returns null when the entry is empty / has no reading yet.
  private _resolveBgEntryText(e: BgTextEntry): string | null {
    let s: string | null = null;
    if (e.entityId) {
      const st = this.hass?.states?.[e.entityId] ?? null;
      const v = formatEntityValue(st, e.format, { imperial: this.store.imperial, now: new Date() });
      s = v === '—' ? null : v;   // no reading yet → skip
    } else {
      s = (e.text ?? '').trim() || null;
    }
    if (s == null) return null;
    const cap = e.mode === 'grass' ? 160 : 40;
    return s.length > cap ? s.slice(0, cap) : s;
  }

  // The "fit to area" target of a ground-writing entry: the chosen GroundArea's
  // bbox CENTRE + a ~10%-inset bbox (the text-fit rect), PLUS the area's raw
  // polygon / kind / elevation so the renderer can constrain the decal to the
  // real geometry and paint it through that surface's own material. Returns
  // null when the id isn't a valid area ON THE CURRENT FLOOR (bgTexts is
  // store-level; ground areas are per-floor) — a stale id fails soft and the
  // renderer auto-places. cx/cy stay the bbox centre (the decal's position).
  private _grassAreaRect(areaId: string): BgTextGrassArea | null {
    const ga = (this.floor().groundAreas ?? []).find(a => a.id === areaId);
    if (!ga || !Array.isArray(ga.points) || ga.points.length < 3) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of ga.points) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    const w = maxX - minX, h = maxY - minY;
    if (!(w > 0) || !(h > 0)) return null;
    return {
      cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: w * 0.8, h: h * 0.8,
      // Raw polygon (copied — the renderer must never alias store points),
      // surface kind + authored elevation. A renderer chunk from before this
      // shipped simply ignores the extra fields and draws the legacy rect.
      points: ga.points.map(p => ({ x: p.x, y: p.y })),
      kind: ga.kind,
      ...(ga.elevationMm != null ? { elevationMm: ga.elevationMm } : {}),
    };
  }

  // Resolved background-text entries for the renderer/settings preview: one row
  // per configured entry that currently has content (empty/no-reading entries are
  // skipped). Order follows the stored list. Read by three-view (3D). Ground-
  // writing rows with a resolvable grassAreaId carry that area's fit rect AND its
  // real polygon/kind (world mm) so the renderer clips the decal to the actual
  // area geometry and lets its surface material show through, instead of the auto
  // margin strip.
  bgTextsResolved(): BgTextResolved[] {
    const list = this.store.bgTexts ?? [];
    const out: BgTextResolved[] = [];
    for (const e of list) {
      const text = this._resolveBgEntryText(e);
      if (text == null) continue;
      const row: BgTextResolved = { id: e.id, mode: e.mode, text };
      if (e.mode === 'train') row.maxCars = e.maxCars;
      // The tow-aircraft silhouette is banner-only; the size knob applies to
      // every style. Both pass STRAIGHT through — the renderer owns the
      // validity check (unknown archetype → the toy plane) and the clamp.
      if (e.mode === 'banner' && e.aircraft) row.aircraft = e.aircraft;
      if (e.scale != null) row.scale = e.scale;
      if (e.mode === 'grass' && e.grassAreaId) {
        const rect = this._grassAreaRect(e.grassAreaId);
        if (rect) { row.grassAreaId = e.grassAreaId; row.grassArea = rect; }
      }
      // Ground-writing orientation. Only the STATIC opt-out travels — a follow
      // row carries neither field, so the renderer's "absent = follow the
      // camera" default (and the _keyBgText hash) stay byte-identical to the
      // shipped build. rotationDeg passes straight through; the renderer owns
      // the finite guard + the degrees→yaw mapping.
      if (e.mode === 'grass' && e.faceCamera === false) {
        row.faceCamera = false;
        if (e.rotationDeg != null) row.rotationDeg = e.rotationDeg;
      }
      out.push(row);
    }
    return out;
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

  // Appliance "job finished" detection (LIVE path; mirrors _detectDoorbells).
  // Fires a household event when a bound appliance leaves a RUNNING state for a
  // terminal state after having run >= APPLIANCE_RUN_MIN_MS — a brief on/off blip
  // never fires. Watches Furniture.jobStateEntity when bound (Home Connect
  // operation_state, a `running` binary_sensor, or a *_program_finished event
  // sensor), else the appliance's own entity_id for job-capable kinds
  // (dishwasher/washer/dryer). Done value = jobDoneValue, defaulting to 'finished'
  // when jobStateEntity is bound / any non-running terminal in the auto mode.
  private _detectApplianceEvents(states: Record<string, HassState>): void {
    const now = Date.now();
    for (const fu of this.floor().furniture) {
      const eid = fu.jobStateEntity ?? this._autoJobEntity(fu);
      if (!eid) continue;
      const cur = states[eid]?.state;
      if (cur == null || cur === 'unavailable' || cur === 'unknown') continue;
      const prev = this._jobStatePrev[fu.id];
      this._jobStatePrev[fu.id] = cur;
      const running = APPLIANCE_RUNNING_STATES.has(cur);
      if (running && this._jobRunStart[fu.id] == null) this._jobRunStart[fu.id] = now;
      if (prev === undefined || prev === cur) continue;          // seed / no change
      const wasRunning = APPLIANCE_RUNNING_STATES.has(prev);
      if (!wasRunning || running) continue;                       // only the running → non-running edge
      if (APPLIANCE_PAUSE_STATES.has(cur)) continue;              // pause keeps the run alive (don't clear)
      // A real terminal (finished / off / cancelled). Fire only when it matches
      // the done value (defaulted for jobStateEntity mode; any terminal in auto).
      const doneVal = fu.jobDoneValue ?? (fu.jobStateEntity ? 'finished' : null);
      const started = this._jobRunStart[fu.id];
      delete this._jobRunStart[fu.id];                            // run over (finished or cancelled)
      if (doneVal != null && cur !== doneVal) continue;           // stopped, but not the "done" state
      if (started == null || now - started < Planner.APPLIANCE_RUN_MIN_MS) continue;  // too short to be a cycle
      this.householdEvents.push({ furnitureId: fu.id, kind: applianceEventKind(fu), at: now });
    }
    this._pruneEvents(now);
  }

  // The entity a job-capable appliance auto-watches when no jobStateEntity is
  // bound — its own on/off binding. Restricted to dishwasher/washer/dryer so a
  // TV / media piece turning off never reads as "a job finished".
  private _autoJobEntity(fu: Furniture): string | null {
    if (!fu.entity_id) return null;
    const k = furnitureKind(fu);
    return (k === 'dishwasher' || k === 'washer' || k === 'dryer') ? fu.entity_id : null;
  }

  // Weather "moment" detection (LIVE path). Diffs weatherNow.condition + the worst
  // active alert severity against the seeded prev values and fires a house-wide
  // (furnitureId null) household event on a real transition. Idempotent — safe to
  // call from every weather recompute site (entity/sensors in _onStates,
  // Open-Meteo poll); prev == cur is a no-op. Never persists.
  private _detectWeatherEvents(): void {
    const now = Date.now();
    const wn = this.weatherNow;
    if (wn) {
      const prev = this._prevWeatherCondition;
      this._prevWeatherCondition = wn.condition;
      if (prev !== undefined && prev !== wn.condition) {
        const PRECIP = new Set(['rainy', 'pouring', 'snowy', 'snowy-rainy', 'lightning-rainy', 'hail']);
        if (!PRECIP.has(prev) && PRECIP.has(wn.condition))
          this.householdEvents.push({ furnitureId: null, kind: 'rain_start', at: now });
        else if (conditionIntensity(prev) < 0.6 && conditionIntensity(wn.condition) >= 0.6)
          this.householdEvents.push({ furnitureId: null, kind: 'severe_weather', at: now });
      }
    }
    // Weather alert appearing / escalating (empty→non-empty or worst-severity up).
    const rank = this.weatherAlerts.length
      ? alertSeverityRank(worstAlertSeverity(this.weatherAlerts) ?? 'advisory') : 0;
    if (rank > this._prevAlertRank) this.householdEvents.push({ furnitureId: null, kind: 'severe_alert', at: now });
    this._prevAlertRank = rank;
    this._pruneEvents(now);
  }

  // Prune household events past the retention window, then cap at 8 (drop oldest).
  private _pruneEvents(now: number): void {
    if (!this.householdEvents.length) return;
    this.householdEvents = this.householdEvents.filter(e => now - e.at < Planner.EVENT_WINDOW_MS);
    if (this.householdEvents.length > 8)
      this.householdEvents.splice(0, this.householdEvents.length - 8);
  }

  // Whether an appliance is showing a "done" badge right now — within the event
  // retention window of its most recent finished event. Read live by both
  // canvases (2D LED pulse + 3D emissive badge). Cheap no-op with no events.
  applianceJustFinished(fu: { id: string }): boolean {
    if (!this.householdEvents.length) return false;
    const now = Date.now();
    for (const e of this.householdEvents)
      if (e.furnitureId === fu.id && now - e.at < Planner.EVENT_WINDOW_MS) return true;
    return false;
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

  // Mark that a genuine interactive selection happened this session (see
  // selectionHot). Called from every selection path — the setActive setters
  // (sidebar rows), the canvas selection sites, and fresh placements.
  markSelectionHot(): void { this.selectionHot = true; }

  // Record a freshly-placed named fixture so the sidebar autofocuses its Label
  // input, and mark the selection hot (a placement IS an interactive selection).
  markNewlyPlaced(kind: string, id: string): void {
    this.newlyPlacedFocus = { kind, id };
    this.selectionHot = true;
  }

  setActiveSensor(id: string | null): void {
    this.markSelectionHot();
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
    if (t !== 'path') this.drawingPath = null;
    if (t !== 'pool') this.drawingPoolArea = null;
    if (t !== 'void') this.drawingVoidArea = null;
    if (t !== 'nbhd_excl') this.drawingExclusion = null;
    if (t !== 'ruler') this.drawingRuler = null;   // drop the half-placed ruler
    this.pickingDimWalls = false;  // any tool pick disarms the dimension wall-pick latch
    this.placingRoomId = null;  // picking any tool cancels a pending room placement
    this.placingLandmarkId = null;
    this.placingCamCalibId = null; this.pendingCamCalibUV = null;
    this.selectedVertex = null;  // switching tools drops the vertex-delete latch
    this.emitConfig();
  }

  setActiveMotion(id: string | null): void {
    this.markSelectionHot();
    this.activeMotionId = (this.activeMotionId === id) ? null : id;
    this.emitConfig();
  }

  // ── Roaming avatars (Batch A) ─────────────────────────────────────────────
  setActiveRoamer(id: string | null): void {
    this.activeRoamerId = (this.activeRoamerId === id) ? null : id;
    this.emitConfig();
  }

  addRoamer(): string {
    const f = this.floor();
    if (!f.roamers) f.roamers = [];
    const id = newId('roam');
    f.roamers.push({ id, name: `Roamer ${f.roamers.length + 1}` });
    this.activeRoamerId = id;
    this.save();
    this.emitConfig();
    return id;
  }

  updateRoamer(id: string, mut: (r: import('./types.js').Roamer) => void): void {
    const r = this.floor().roamers?.find(x => x.id === id);
    if (!r) return;
    mut(r);
    this.save();
    this.emitConfig();
  }

  deleteRoamer(id: string): void {
    const f = this.floor();
    if (!f.roamers) return;
    f.roamers = f.roamers.filter(x => x.id !== id);
    if (this.activeRoamerId === id) this.activeRoamerId = null;
    this.save();
    this.emitConfig();
  }

  setActiveEnv(id: string | null): void {
    this.markSelectionHot();
    this.activeEnvId = (this.activeEnvId === id) ? null : id;
    this.emitConfig();
  }

  setActiveBle(id: string | null): void {
    this.markSelectionHot();
    this.activeBleId = (this.activeBleId === id) ? null : id;
    this.emitConfig();
  }

  setActiveAlarm(id: string | null): void {
    this.markSelectionHot();
    this.activeAlarmId = (this.activeAlarmId === id) ? null : id;
    this.emitConfig();
  }

  setActiveCalendar(id: string | null): void {
    this.markSelectionHot();
    this.activeCalendarId = (this.activeCalendarId === id) ? null : id;
    this.emitConfig();
  }

  setActiveThermo(id: string | null): void {
    this.markSelectionHot();
    this.activeThermoId = (this.activeThermoId === id) ? null : id;
    this.emitConfig();
  }

  setActiveSafety(id: string | null): void {
    this.markSelectionHot();
    this.activeSafetyId = (this.activeSafetyId === id) ? null : id;
    this.emitConfig();
  }

  // Siren fixtures (SafetySensor kind 'siren') are CONTROLLABLE, unlike the
  // passive smoke/co/gas/leak detectors. Bound siren.*/switch.* → toggle the
  // entity (siren.toggle / switch.toggle via toggleEntity's domain dispatch); a
  // bound binary_sensor is display-only (read-only, no-op); unbound → flip
  // localState (demo/test, like the Test button). Refuses in view mode; kiosk
  // allowed. Detectors never call this.
  triggerSiren(s: SafetySensor): void {
    if (this.uiMode === 'view') return;
    if (s.entity_id) {
      const dom = s.entity_id.split('.')[0];
      if (dom === 'siren' || dom === 'switch') this.toggleEntity(s.entity_id);
      // binary_sensor bound → display-only (nothing to toggle).
    } else {
      this.toggleItem(s);
    }
  }

  // ── Alert Beacon fixture (Alert Center, Track B) ──────────────────────────
  setActiveAlertBeacon(id: string | null): void {
    this.markSelectionHot();
    this.activeAlertBeaconId = (this.activeAlertBeaconId === id) ? null : id;
    this.emitConfig();
  }

  // Clicking a beacon (2D/3D) or the sidebar Test/Acknowledge button. Bound to an
  // alert.* → alert.turn_off is the ACKNOWLEDGE action (§2.5) when currently
  // active; a bound binary_sensor is display-only (nothing to control); unbound →
  // flip localState (demo). Refuses in view mode; kiosk allowed (safety-relevant,
  // like the alarm keypad + siren precedents).
  acknowledgeAlertBeacon(b: AlertBeacon): void {
    if (this.uiMode === 'view') return;
    if (b.entity_id) {
      if (isAlertDomain(b.entity_id)) {
        // alert.turn_off = acknowledge. Only meaningful while active ('on').
        if (this.hass && this.effectiveState(b)?.state === 'on') {
          this.hass.callService('alert', 'turn_off', { entity_id: b.entity_id });
        }
      }
      // binary_sensor / other bound entity → display-only (nothing to control).
    } else {
      this.toggleItem(b);   // unbound demo flip
    }
  }

  // ── Alert Center (Track A) ────────────────────────────────────────────────
  // Derived, sorted, filtered feed of everything that needs attention. Runtime-
  // only getter (mirrors weatherNow / blePeople). Empty when the center is
  // disabled.
  get alertFeed(): PanelAlert[] {
    const cfg = this.store.alerts;
    if (!alertCenterEnabled(cfg)) return [];
    // Flight/ISS notices are client-local and already built — they ride the
    // `extra` channel (no HA source toggle / severity floor applies) and are
    // filtered against the session's dismissed-id set.
    return buildAlertFeed(this.notifications, this.repairIssues, cfg,
      this.flightAlerts.filter(a => !this._flightAlertDismissed.has(a.id)));
  }

  // Mutate the alert config (creating a sensible default the first time), persist,
  // re-apply the collectors, and repaint (mirrors setWeather).
  setAlertsConfig(mut: (a: AlertsConfig) => void): void {
    if (!this.store.alerts) this.store.alerts = {};
    mut(this.store.alerts);
    this.save();
    this._reconfigureAlertCenter();
    this.emitConfig();
  }

  // (Re)start or stop the collectors to match the current config. Idempotent.
  // Only starts once a connection exists (guarded by _alertInited at the call
  // sites). A disabled center tears the subscription + poll down.
  private _reconfigureAlertCenter(): void {
    this._stopAlertCenter();
    if (!this.hass || !alertCenterEnabled(this.store.alerts)) {
      this.notifications = []; this.repairIssues = [];
      return;
    }
    this._startAlertCenter();
  }

  private _stopAlertCenter(): void {
    if (this._alertNotifUnsub) { try { this._alertNotifUnsub(); } catch { /* ignore */ } this._alertNotifUnsub = null; }
    if (this._alertRepairsTimer) { clearInterval(this._alertRepairsTimer); this._alertRepairsTimer = null; }
  }

  private _startAlertCenter(): void {
    const hass = this.hass;
    if (!hass) return;
    // Defensive against a partial HaApi (older test stubs / a stale adapter):
    // skip cleanly if the Alert Center surface isn't present.
    if (typeof hass.subscribePersistentNotifications !== 'function') return;
    // Persistent notifications: live WS subscription (non-admin-safe). Maintain a
    // dict from the current/added/updated/removed deltas; repaint on each change.
    const map = new Map<string, HaNotification>();
    hass.subscribePersistentNotifications(u => {
      if (u.type === 'current') {
        map.clear();
        for (const [id, n] of Object.entries(u.notifications)) map.set(id, this._normNotif(id, n));
      } else if (u.type === 'removed') {
        for (const id of Object.keys(u.notifications)) map.delete(id);
      } else {
        // added / updated
        for (const [id, n] of Object.entries(u.notifications)) map.set(id, this._normNotif(id, n));
      }
      this.notifications = [...map.values()];
      this.emitConfig();   // repaints the bell badge + drawer; new alert pulses the bell
    }).then(unsub => { this._alertNotifUnsub = unsub; })
      .catch(() => { /* never throws (clients swallow); belt-and-braces */ });
    // Repairs: no WS push exists — poll on a modest interval (minutes). A non-
    // admin user's list_issues errors → the client returns [], clearing the list.
    void this._pollRepairs();
    this._alertRepairsTimer = setInterval(() => void this._pollRepairs(), Planner.ALERT_REPAIRS_POLL_MS);
  }

  private _normNotif(id: string, n: Partial<HaNotification>): HaNotification {
    return {
      notification_id: id,
      title: n.title ?? null,
      message: typeof n.message === 'string' ? n.message : String(n.message ?? ''),
      created_at: n.created_at,
    };
  }

  private async _pollRepairs(): Promise<void> {
    if (!this.hass || typeof this.hass.listRepairsIssues !== 'function'
        || this.store.alerts?.showRepairs === false) {
      if (this.repairIssues.length) { this.repairIssues = []; this.emitConfig(); }
      return;
    }
    const issues = await this.hass.listRepairsIssues();
    // Cheap change check — avoid churn when nothing changed.
    const key = issues.map(i => `${i.domain}/${i.issue_id}:${i.severity}:${i.ignored ? 1 : 0}`).join(',');
    if (key !== this._repairsKey) {
      this._repairsKey = key;
      this.repairIssues = issues;
      this.emitConfig();
    }
  }
  private _repairsKey = '';

  // Dismiss / acknowledge one alert, routed by source. Notifications →
  // persistent_notification.dismiss; Repairs → repairs/ignore_issue (hides it
  // from the feed, keeps it in the registry). View mode refuses. The optimistic
  // local removal keeps the drawer snappy; the next push / poll reconciles.
  dismissAlert(a: PanelAlert): void {
    if (this.uiMode === 'view') return;
    // Flight/ISS notices are client-local — dismissing one is a purely local
    // mute (no service call), so it works with or without a live connection.
    if (a.source === 'flight') {
      this._flightAlertDismissed.add(a.id);
      this.flightAlerts = this.flightAlerts.filter(x => x.id !== a.id);
      this.emitConfig();
      return;
    }
    if (!this.hass) return;
    if (a.source === 'notification' && a.notificationId) {
      this.hass.callService('persistent_notification', 'dismiss', { notification_id: a.notificationId });
      this.notifications = this.notifications.filter(n => n.notification_id !== a.notificationId);
      this.emitConfig();
    } else if (a.source === 'repair' && a.domain && a.issueId) {
      void this.hass.ignoreRepairsIssue(a.domain, a.issueId, true);
      this.repairIssues = this.repairIssues.map(i =>
        (i.domain === a.domain && i.issue_id === a.issueId) ? { ...i, ignored: true } : i);
      this.emitConfig();
    }
  }

  setActiveRobot(id: string | null): void {
    this.markSelectionHot();
    this.activeRobotId = (this.activeRobotId === id) ? null : id;
    this.emitConfig();
  }

  setActiveCamera(id: string | null): void {
    this.markSelectionHot();
    this.activeCameraId = (this.activeCameraId === id) ? null : id;
    this.emitConfig();
  }

  setActiveProjector(id: string | null): void {
    this.markSelectionHot();
    this.activeProjectorId = (this.activeProjectorId === id) ? null : id;
    this.emitConfig();
  }

  setActiveValve(id: string | null): void {
    this.markSelectionHot();
    this.activeValveId = (this.activeValveId === id) ? null : id;
    this.emitConfig();
  }

  setActivePlug(id: string | null): void {
    this.markSelectionHot();
    this.activePlugId = (this.activePlugId === id) ? null : id;
    this.emitConfig();
  }

  setActiveSprinkler(id: string | null): void {
    this.markSelectionHot();
    this.activeSprinklerId = (this.activeSprinklerId === id) ? null : id;
    this.emitConfig();
  }

  setActiveFlagpole(id: string | null): void {
    this.markSelectionHot();
    this.activeFlagpoleId = (this.activeFlagpoleId === id) ? null : id;
    this.emitConfig();
  }

  // ── Water valve open/close ──────────────────────────────────────────────
  // Click routing for a valve fixture. Gated by allowControl (default on) +
  // uiMode (view refuses; kiosk allowed — the flip is session-only because
  // save() no-ops outside edit). Dispatch by the bound entity's DOMAIN:
  //   valve.*         → NEVER a blind toggle — pick open_valve / close_valve by
  //                     the current resolved state (valveIsOpen).
  //   switch.*        → switch.toggle (irrigation-zone pattern).
  //   binary_sensor.* → display-only, no-op.
  //   unbound         → flip localState ('on'↔'off') + save + emitConfig.
  toggleValve(v: ValveFixture): void {
    if (this.uiMode === 'view') return;
    if (v.allowControl === false) return;
    if (v.entity_id) {
      const dom = v.entity_id.split('.')[0];
      if (dom === 'valve') {
        const openNow = valveIsOpen(this.effectiveState(v));
        try {
          this.hass?.callService('valve', openNow ? 'close_valve' : 'open_valve',
            { entity_id: v.entity_id });
        } catch { /* fire-and-forget */ }
        return;
      }
      if (dom === 'switch') { this.toggleEntity(v.entity_id); return; }
      // binary_sensor (or any read-only domain) → display-only.
      return;
    }
    // Unbound → local demo control.
    const on = v.localState === 'on';
    v.localState = on ? 'off' : 'on';
    this.save();        // no-op outside edit → kiosk flips are session-only
    this.emitConfig();
  }

  setActiveInfo(id: string | null): void {
    this.markSelectionHot();
    this.activeInfoId = (this.activeInfoId === id) ? null : id;
    this.emitConfig();
  }

  setActiveAction(id: string | null): void {
    this.markSelectionHot();
    this.activeActionId = (this.activeActionId === id) ? null : id;
    this.emitConfig();
  }

  setActivePZone(id: string | null): void {
    this.markSelectionHot();
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
    this.markSelectionHot();
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
      f.groundAreas.push({ id, name: `Area ${f.groundAreas.length + 1}`, points: pts, kind: this.pendingGroundKind });
      this.activeGroundAreaId = id;
    }
    this.save();
    this.emitConfig();
  }

  // ── Path / driveway ribbon (T4) ─────────────────────────────────────────
  // Regenerate a path-backed GroundArea's derived `points` from its centerline +
  // width via bufferPolyline. Called after every centerline / width edit — the
  // stored polygon is a CACHE, not authoritative. No-op if `path` is absent or
  // degenerate (leaves the last valid polygon in place).
  regenGroundAreaPath(g: GroundArea): void {
    if (!g.path || g.path.centerline.length < 2) return;
    const pts = bufferPolyline(g.path.centerline, g.path.width);
    if (pts.length >= 3) g.points = pts;
  }

  // Commit the in-progress path centerline (≥2 pts) → a path-backed GroundArea
  // (kind defaults to concrete, user-editable). Replaces an existing path-backed
  // area's centerline/points when re-drawing (drawingPath.id set).
  finishPath(): void {
    const d = this.drawingPath;
    this.drawingPath = null;
    if (!d || d.points.length < 2) { this.emitConfig(); return; }
    const f = this.floor();
    if (!f.groundAreas) f.groundAreas = [];
    const width = d.width ?? PATH_DEFAULT_WIDTH;
    const centerline = d.points.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
    const pts = bufferPolyline(centerline, width);
    if (pts.length < 3) { this.emitConfig(); return; }
    if (d.id) {
      const g = f.groundAreas.find(x => x.id === d.id);
      if (g) { g.path = { centerline, width }; g.points = pts; this.activeGroundAreaId = g.id; }
    } else {
      const id = newId('ga');
      f.groundAreas.push({ id, name: `Path ${f.groundAreas.length + 1}`, points: pts, kind: 'concrete', path: { centerline, width } });
      this.activeGroundAreaId = id;
    }
    this.save();
    this.emitConfig();
  }

  // "Detach shape" — drop the path metadata, keeping the current polygon. Converts
  // a path-backed area into a plain editable GroundArea (pinned decision 3).
  detachGroundAreaPath(g: GroundArea): void {
    if (!g.path) return;
    delete g.path;
    this.save();
    this.emitConfig();
  }

  // ── Pool / spa (T4) ─────────────────────────────────────────────────────
  setActivePool(id: string | null): void {
    this.markSelectionHot();
    this.activePoolId = (this.activePoolId === id) ? null : id;
    this.emitConfig();
  }

  // Commit the in-progress pool polygon (≥3 pts). Mirrors finishGroundArea.
  finishPoolArea(): void {
    const d = this.drawingPoolArea;
    this.drawingPoolArea = null;
    if (!d || d.points.length < 3) { this.emitConfig(); return; }
    const f = this.floor();
    if (!f.pools) f.pools = [];
    const pts = d.points.slice(0, 20).map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
    const kind = d.kind ?? 'pool';
    if (d.id) {
      const pl = f.pools.find(x => x.id === d.id);
      if (pl) pl.points = pts;
    } else {
      const id = newId('pool');
      f.pools.push({ id, name: kind === 'spa' ? `Spa ${f.pools.length + 1}` : `Pool ${f.pools.length + 1}`, kind, points: pts });
      this.activePoolId = id;
    }
    this.save();
    this.emitConfig();
  }

  // Resolved HA state for a pool sub-binding (heater/pump), folding the localState
  // MAP first (a Pool has several independently-toggleable sub-things, so the flat
  // effectiveState path doesn't apply). Bound → hass.states; unbound → synthetic
  // {state: localState.<sub>}; else null.
  private _poolSubState(entity: string | undefined, local: string | undefined): HassState | null {
    if (entity) return this.hass?.states?.[entity] ?? null;
    if (local) return { state: local, attributes: {} } as HassState;
    return null;
  }
  poolHeaterStateOf(pl: Pool): import('./geometry.js').PoolHeaterState {
    return poolHeaterState(this._poolSubState(pl.heaterEntity, pl.localState?.heater));
  }
  poolPumpOnOf(pl: Pool): boolean {
    return poolPumpOn(this._poolSubState(pl.pumpEntity, pl.localState?.pump));
  }

  // Click routing for a pool sub-control. Gated by uiMode (view refuses; kiosk
  // fires session-only since save() no-ops outside edit). Bound → domain-aware
  // toggleEntity (climate/water_heater/switch); unbound → flip the localState
  // sub-field ('on'↔'off') + save + emitConfig.
  togglePoolHeater(pl: Pool): void {
    if (this.uiMode === 'view') return;
    if (pl.heaterEntity) { this.toggleEntity(pl.heaterEntity); return; }
    if (!pl.localState) pl.localState = {};
    pl.localState.heater = pl.localState.heater === 'on' ? 'off' : 'on';
    this.save(); this.emitConfig();
  }
  togglePoolPump(pl: Pool): void {
    if (this.uiMode === 'view') return;
    if (pl.pumpEntity) { this.toggleEntity(pl.pumpEntity); return; }
    if (!pl.localState) pl.localState = {};
    pl.localState.pump = pl.localState.pump === 'on' ? 'off' : 'on';
    this.save(); this.emitConfig();
  }

  setActiveVoidArea(id: string | null): void {
    this.markSelectionHot();
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

  // ── Neighborhood-overlay exclusion masks ──────────────────────────────────
  // Arm the exclusion draw tool (sidebar "+ Add exclusion"). Mirrors the
  // presence-zone/void arming: sets the tool + an empty latch.
  armExclusionDraw(): void {
    this.setTool('nbhd_excl');
    this.drawingExclusion = { points: [] };
    this.emitConfig();
  }

  // Commit the in-progress exclusion polygon (3–12 pts) into the store-level
  // neighborhood config and re-extract (setNeighborhood saves + reconfigures).
  finishExclusion(): void {
    const d = this.drawingExclusion;
    this.drawingExclusion = null;
    if (!d || d.points.length < 3) { this.emitConfig(); return; }
    const pts = d.points.slice(0, 12).map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
    this.setNeighborhood(n => { (n.exclusions ??= []).push(pts); });
  }

  // Delete the exclusion at `index` (sidebar list ✕). Re-extracts.
  deleteExclusion(index: number): void {
    const ex = this.store.neighborhood?.exclusions;
    if (!ex || index < 0 || index >= ex.length) return;
    this.setNeighborhood(n => { n.exclusions?.splice(index, 1); });
  }

  // ── Rulers (measure tool) + wall/structure dimensions ─────────────────────
  setActiveRuler(id: string | null): void {
    this.markSelectionHot();
    this.activeRulerId = (this.activeRulerId === id) ? null : id;
    this.emitConfig();
  }

  // Create a ruler from two resolved ends (called by the placement latch).
  addRuler(a: RulerEnd, b: RulerEnd): string | null {
    if (this.uiMode !== 'edit') return null;
    const f = this.floor();
    if (!f.rulers) f.rulers = [];
    const id = newId('rl');
    f.rulers.push({ id, a, b });
    this.activeRulerId = id;
    this.save();
    this.emitConfig();
    return id;
  }

  updateRuler(id: string, mut: (r: Ruler) => void): void {
    if (this.uiMode !== 'edit') return;
    const r = (this.floor().rulers ?? []).find(x => x.id === id);
    if (!r) return;
    mut(r);
    this.save();
    this.emitConfig();
  }

  deleteRuler(id: string): void {
    if (this.uiMode !== 'edit') return;
    const f = this.floor();
    f.rulers = (f.rulers ?? []).filter(x => x.id !== id);
    if (this.activeRulerId === id) this.activeRulerId = null;
    this.save();
    this.emitConfig();
  }

  // Move a ruler's end `b` to the given length (mm) along the current a→b
  // bearing. No-ops when `b` is object-anchored (rulerSetLength returns null).
  setRulerLength(id: string, mm: number): void {
    if (this.uiMode !== 'edit') return;
    const f = this.floor();
    const r = (f.rulers ?? []).find(x => x.id === id);
    if (!r) return;
    if (!rulerSetLength(r, f, mm)) return;   // object-anchored b: refuse
    this.save();
    this.emitConfig();
  }

  // Set the wall/structure dimension display mode for the current floor.
  setDimensionMode(mode: DimensionMode): void {
    if (this.uiMode !== 'edit') return;
    this.floor().dimensionMode = mode === 'off' ? undefined : mode;
    // Leaving custom mode disarms the wall-pick latch.
    if (mode !== 'custom') this.pickingDimWalls = false;
    this.save();
    this.emitConfig();
  }

  // Toggle a wall's custom dimension-selection flag (Feature B `custom` mode).
  toggleWallDimension(wallId: string): void {
    if (this.uiMode !== 'edit') return;
    const w = this.floor().walls.find(x => x.id === wallId);
    if (!w) return;
    w.dimension = !w.dimension;
    this.save();
    this.emitConfig();
  }

  // Arm / disarm the custom-dimension wall-pick latch (parallel-latch idiom).
  setPickingDimWalls(on: boolean): void {
    this.pickingDimWalls = on;
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

  // ── Thermostat / climate control ────────────────────────────────────────
  // These mirror the alarm/local-control idiom. Bound + allowControl → real
  // climate.* service calls (fire-and-forget, try/catch). Unbound → flip the
  // demo localState / localTemp + save (no-op outside edit → kiosk flips are
  // session-only) + emitConfig. View mode refuses everything.
  private _thermostat(id: string): ThermostatFixture | null {
    return (this.floor().thermostats ?? []).find(x => x.id === id) ?? null;
  }
  setThermostatMode(id: string, mode: string): void {
    if (this.uiMode === 'view') return;
    const t = this._thermostat(id);
    if (!t) return;
    if (t.entity_id) {
      if (t.allowControl === false) return;
      try { this.hass?.callService('climate', 'set_hvac_mode', { entity_id: t.entity_id, hvac_mode: mode }); }
      catch { /* fire-and-forget */ }
      return;
    }
    t.localState = mode;   // unbound demo
    this.save();
    this.emitConfig();
  }
  // Single setpoint OR a low/high range (heat_cool). Bound → set_temperature;
  // unbound → store the single value in localTemp (demo is single-setpoint only).
  setThermostatTemp(id: string, temp: number, low?: number, high?: number): void {
    if (this.uiMode === 'view') return;
    const t = this._thermostat(id);
    if (!t) return;
    if (t.entity_id) {
      if (t.allowControl === false) return;
      const data: Record<string, unknown> = { entity_id: t.entity_id };
      if (low != null && high != null) { data.target_temp_low = low; data.target_temp_high = high; }
      else data.temperature = temp;
      try { this.hass?.callService('climate', 'set_temperature', data); }
      catch { /* fire-and-forget */ }
      return;
    }
    t.localTemp = temp;   // unbound demo (single setpoint)
    this.save();
    this.emitConfig();
  }
  setThermostatFanMode(id: string, mode: string): void {
    if (this.uiMode === 'view') return;
    const t = this._thermostat(id);
    if (!t || !t.entity_id || t.allowControl === false) return;
    try { this.hass?.callService('climate', 'set_fan_mode', { entity_id: t.entity_id, fan_mode: mode }); }
    catch { /* fire-and-forget */ }
  }
  setThermostatPresetMode(id: string, mode: string): void {
    if (this.uiMode === 'view') return;
    const t = this._thermostat(id);
    if (!t || !t.entity_id || t.allowControl === false) return;
    try { this.hass?.callService('climate', 'set_preset_mode', { entity_id: t.entity_id, preset_mode: mode }); }
    catch { /* fire-and-forget */ }
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

  // Where the CURRENT fit says landmark `id` should sit on the plan: its stored
  // lat/lon projected back through the transform. That is exactly the endpoint
  // the per-landmark residual ("off by N m") measures against, so the ghost pin
  // and the residual readout can never disagree.
  //
  // Consistency rule: this uses the FULL current fit — the same one every other
  // consumer sees — never a leave-one-out refit. For a landmark that FEEDS the
  // fit the suggestion is therefore its own least-squares reprojection (moving
  // there removes its residual and nudges the transform); for an EXCLUDED (or
  // otherwise non-contributing) landmark the fit is genuinely independent of it,
  // which is what makes exclude → inspect → apply → re-include the recommended
  // repair flow for one mis-sampled pin.
  //
  // Fails soft to null: no fit / unknown id / uncalibrated / still awaiting
  // placement / a non-finite projection.
  private _landmarkSuggestionFor(id: string): {
    id: string; x: number; y: number; curX: number; curY: number; distMm: number;
  } | null {
    const lm = this.geoLandmarks().find(l => l.id === id);
    if (!lm || lm.lat == null || lm.lon == null || lm.pendingPlace) return null;
    const fitR = this.geoFit();
    if (!fitR || fitR.transform.quality === 'none') return null;
    const plan = latLonToPlan(fitR.transform, lm.lat, lm.lon);
    if (!plan || !isFinite(plan.x) || !isFinite(plan.y)) return null;
    return {
      id, x: plan.x, y: plan.y, curX: lm.x, curY: lm.y,
      distMm: Math.hypot(plan.x - lm.x, plan.y - lm.y),
    };
  }

  // The live suggestion for the latched landmark (null when nothing is latched
  // or it can't be resolved). Cheap — safe to call from the 2D RAF each frame.
  landmarkSuggestion(): {
    id: string; x: number; y: number; curX: number; curY: number; distMm: number;
  } | null {
    return this.landmarkSuggestId ? this._landmarkSuggestionFor(this.landmarkSuggestId) : null;
  }

  // Move a landmark's pin onto its suggested position. Recomputes the projection
  // fresh (never trusts a stale latch snapshot), then rides updateLandmark — so
  // it is ONE undo step + save + emitConfig, like every other landmark edit.
  // Edit-mode only. Returns false (and changes nothing) when unresolvable.
  applyLandmarkSuggestion(id: string): boolean {
    if (this.uiMode !== 'edit') return false;
    const s = this._landmarkSuggestionFor(id);
    if (!s) return false;
    if (this.landmarkSuggestId === id) this.landmarkSuggestId = null;
    this.updateLandmark(id, l => { l.x = Math.round(s.x); l.y = Math.round(s.y); });
    return true;
  }

  deleteLandmark(id: string): void {
    if (!this.store.geo) return;
    this.store.geo.landmarks = this.store.geo.landmarks.filter(l => l.id !== id);
    if (this.placingLandmarkId === id) this.placingLandmarkId = null;
    if (this.landmarkSuggestId === id) this.landmarkSuggestId = null;
    if (this.geoCalib?.landmarkId === id) void this.cancelGeoCalibration();
    this.save();
    this.emitConfig();
  }

  // Bulk-import landmarks from CSV text (columns label, latitude, longitude —
  // header optional; see parseLandmarkCsv). Edit-only; ONE save()+emitConfig()
  // for the whole import, so it is ONE undo step.
  //
  // The fit-poisoning problem: an imported row has a REAL lat/lon but no plan
  // position, and geoFit() treats every lat/lon-bearing landmark as a calibrated
  // pair. Dropping rows at a dummy x/y would wreck the transform. So:
  //   • A usable fit already exists → project each row through it. The landmark
  //     lands at its CORRECT plan position, contributing a zero-residual pair
  //     (fit-neutral). The fit is computed ONCE up front and never recomputed
  //     mid-import, so earlier rows can't shift where later rows project.
  //   • No fit → the row imports with `pendingPlace: true` (EXCLUDED from
  //     geoFit) at a spaced row near the current floor's centre so it is visible
  //     and grabbable. Placing the pin clears the flag and it becomes a real
  //     calibrated pair.
  // A row whose label matches an existing landmark (case-insensitive, trimmed)
  // UPDATES that landmark's lat/lon in place, keeping its plan position and
  // following the manual-entry sentinel exactly (sampledAt set, accuracy +
  // sampleCount cleared — no sampling run happened).
  importLandmarksCsv(text: string): { added: number; updated: number; pending: number; errors: string[] } {
    if (this.uiMode !== 'edit') return { added: 0, updated: 0, pending: 0, errors: ['Import is available in edit mode only.'] };
    const parsed = parseLandmarkCsv(text);
    const errors = [...parsed.errors];
    if (parsed.rows.length === 0) {
      if (errors.length === 0) errors.push('No landmark rows found in the file.');
      return { added: 0, updated: 0, pending: 0, errors };
    }
    const g = this._ensureGeo();
    // Resolve the fit ONCE (before any row lands) — see the note above.
    const fitR = this.geoFit();
    const fit = fitR && fitR.transform.quality !== 'none' ? fitR.transform : null;
    const f = this.floor();
    const key = (s: string) => s.trim().toLowerCase();
    const byName = new Map<string, GeoLandmark>();
    for (const lm of g.landmarks) { const k = key(lm.name || ''); if (k && !byName.has(k)) byName.set(k, lm); }
    // Spaced-row fallback index continues past landmarks already awaiting placement.
    let slot = g.landmarks.filter(l => l.pendingPlace).length;
    const now = new Date().toISOString();
    let added = 0, updated = 0, pending = 0;

    for (const row of parsed.rows) {
      const existing = byName.get(key(row.label));
      if (existing) {
        existing.lat = row.lat; existing.lon = row.lon;
        existing.sampledAt = now;
        delete existing.accuracy; delete existing.sampleCount;
        // A landmark still awaiting placement STAYS pending (it has no real plan
        // position yet); one already placed keeps its position and stays live.
        updated++;
        continue;
      }
      const lm: GeoLandmark = { id: newId('lm'), name: row.label, x: 0, y: 0,
                                lat: row.lat, lon: row.lon, sampledAt: now };
      const plan = fit ? latLonToPlan(fit, row.lat, row.lon) : null;
      if (plan) {
        lm.x = Math.round(plan.x); lm.y = Math.round(plan.y);
      } else {
        lm.x = Math.round(f.w / 2 + slot * 600); lm.y = Math.round(f.d / 2);
        lm.pendingPlace = true;
        slot++; pending++;
      }
      g.landmarks.push(lm);
      byName.set(key(lm.name), lm);
      added++;
    }

    this.save();
    this.emitConfig();
    return { added, updated, pending, errors };
  }

  // Fit the current geo transform from calibrated landmarks. Returns the fit
  // plus the calibrated-landmark list aligned to `transform.residualsMm`, so the
  // sidebar can flag the worst outlier by name. Null when nothing is calibrated.
  // Landmarks awaiting placement (CSV-imported, `pendingPlace`) are EXCLUDED —
  // they carry a real lat/lon but only a placeholder plan position, which would
  // poison the fit. So are landmarks the user has switched OFF (`excluded`) —
  // the manual escape hatch for one mis-sampled pin skewing θ. This is the ONE
  // site that gathers calibrated pairs; importLandmarksCsv's snapshot fit and
  // every consumer (compass, GPS pins, neighborhood, recorded pins, flights)
  // route through it, so both exclusions apply everywhere by construction.
  geoFit(): { transform: GeoTransform; landmarks: GeoLandmark[] } | null {
    const cal = this.geoLandmarks().filter(
      l => l.lat != null && l.lon != null && !l.pendingPlace && !l.excluded);
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

  // Per-room temperature heat-map data (Store.heatmap comfort band): the mean of
  // the temperature EnvSensors — plus each bound thermostat's current_temperature
  // when the fixture sits inside a room's wall loop — that resolve into each
  // room. Reads LIVE states; cheap + safe to call per frame (the 2D RAF draws
  // from it and the 3D dirty key hashes it). Returns [] when the heatmap layer is
  // off, there are no rooms, or no closed wall loops exist. Aggregation is the
  // pure geometry.aggregateRoomTemps; this getter only gathers samples from live
  // state (research §4.5: EnvSensor-driven, a thermostat counts only as one more
  // in-room sample — never a whole-house bleed).
  roomHeatmap(): RoomTemp[] {
    if ((this.store.layers2d?.heatmap ?? false) !== true) return [];
    const f = this.floor();
    const rooms = f.rooms ?? [];
    if (!rooms.length) return [];
    const loops = closedWallLoops(f.walls ?? []);
    if (!loops.length) return [];
    const states = this.hass?.states;
    const samples: TempSample[] = [];
    for (const e of f.envSensors ?? []) {
      if (!e.entity_id) continue;
      const st = states?.[e.entity_id];
      if (!st) continue;
      if (envKindOf(e, st) !== 'temperature') continue;
      const v = parseFloat(st.state);
      if (!isFinite(v)) continue;
      const c = tempToCelsius(v, st.attributes?.unit_of_measurement as string | undefined);
      if (isFinite(c)) samples.push({ x: e.x, y: e.y, tempC: c });
    }
    for (const t of f.thermostats ?? []) {
      if (!t.entity_id) continue;
      const st = states?.[t.entity_id];
      const ct = st?.attributes?.current_temperature;
      const v = typeof ct === 'number' ? ct : parseFloat(String(ct));
      if (!isFinite(v)) continue;
      const unit = (st!.attributes?.temperature_unit as string | undefined)
        ?? (st!.attributes?.unit_of_measurement as string | undefined);
      const c = tempToCelsius(v, unit);
      if (isFinite(c)) samples.push({ x: t.x, y: t.y, tempC: c });
    }
    return aggregateRoomTemps(rooms, loops, samples);
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
        label: `${magStr}${fmtDistanceM(distanceKm * 1000, this.store.imperial)} ${compass8(bearingDeg)}`,
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
  // True when connected via the offline LocalApi (no Home Assistant). Reads the
  // `offline` marker off the active HaApi so the UI (topbar pill, Settings exit
  // button) can branch without a duplicate storage lookup.
  get isOffline(): boolean {
    return (this.hass as unknown as { offline?: boolean } | null)?.offline === true;
  }

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
      message: `Calibrated: ${tally}${m.accuracy != null ? ` · ${fmtAccuracyM(m.accuracy, this.store.imperial)}` : ''}.`,
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

  // ── Recorded-position pins (roadmap P2 — the REVERSE of landmark placement) ─
  // Capture the CURRENT GPS fix (or type lat/lon) → a pin drops onto the plan
  // wherever the landmark fit projects it. lat/lon are the SOURCE OF TRUTH; the
  // plan position is DERIVED at read time via projectRecordedPins(geoFit), so a
  // later landmark recalibration corrects every recorded pin. Primary use:
  // walk the property line, tap "Record point" at each corner → a boundary
  // chain, convertible into an editable ground-area polygon.
  recordedPins(): RecordedPin[] { return this.store.geo?.recorded ?? []; }

  // The recorded pins projected through the current geo fit. `ok:false` when the
  // transform is unusable (no calibrated landmark). Cheap; safe per frame.
  projectedRecordedPins(): ProjectedRecordedPin[] {
    const fit = this.geoFit();
    return projectRecordedPins(this.recordedPins(), fit?.transform ?? null);
  }

  // Resolve the device_tracker "Record point" reads from: explicit arg →
  // persisted geo.calibTracker → the first Person's GPS tracker (the same
  // default the calibrate card uses).
  recordTrackerId(explicit?: string): string {
    return explicit
      || this.store.geo?.calibTracker
      || (this.store.people ?? []).map(pe => pe.gpsTrackerId).find(Boolean)
      || '';
  }

  // Persist the tracker "Record point" uses (mirrors the calibration selection).
  setRecordTracker(id: string): void {
    this.setGeo(g => { g.calibTracker = id || undefined; });
  }

  // Record the CURRENT fix from the resolved device_tracker as a new pin. Reads
  // the raw lat/lon/gps_accuracy off the entity (gpsFixFor-style). A fix worse
  // than the accuracy gate is RECORDED ANYWAY (walking a boundary shouldn't
  // fight the user) but keeps `accuracy` so the UI can warn — reported via the
  // `warn` field. Edit-mode only; returns a clear error string otherwise.
  async recordPositionPin(trackerId?: string): Promise<{ ok: boolean; error?: string; warn?: string; id?: string }> {
    if (this.uiMode !== 'edit') return { ok: false, error: 'Recording is only available in edit mode.' };
    const eid = this.recordTrackerId(trackerId);
    if (!eid) return { ok: false, error: 'No device_tracker selected. Pick one under Record point.' };
    const st = this.hass?.states?.[eid];
    if (!st) return { ok: false, error: `Tracker ${eid} not found.` };
    const a = st.attributes as Record<string, unknown>;
    const lat = typeof a.latitude === 'number' ? a.latitude : null;
    const lon = typeof a.longitude === 'number' ? a.longitude : null;
    if (lat == null || lon == null) return { ok: false, error: `No GPS fix from ${eid} yet.` };
    const accuracy = typeof a.gps_accuracy === 'number' ? a.gps_accuracy : undefined;
    const g = this._ensureGeo();
    if (!g.recorded) g.recorded = [];
    const id = newId('rp');
    g.recorded.push({ id, name: `Point ${g.recorded.length + 1}`, lat, lon, accuracy, recordedAt: new Date().toISOString() });
    g.calibTracker = eid; // remember the selection for next time
    this.save();
    this.emitConfig();
    const gate = this.geoAccuracyGate();
    const warn = (accuracy != null && accuracy > gate)
      ? `Recorded, but fix accuracy ${fmtAccuracyM(accuracy, this.store.imperial)} exceeds the ${gate} m gate.`
      : undefined;
    return { ok: true, id, warn };
  }

  // Add a manually-typed pin. lat/lon are validated ({parseLatLon} range rules);
  // no accuracy (the manual sentinel). Returns the id, or null on bad input.
  addManualRecordedPin(lat: number, lon: number, name?: string): string | null {
    if (this.uiMode !== 'edit') return null;
    const ok = parseLatLon(`${lat}, ${lon}`); // reuse the range validation
    if (!ok) return null;
    const g = this._ensureGeo();
    if (!g.recorded) g.recorded = [];
    const id = newId('rp');
    g.recorded.push({ id, name: name || `Point ${g.recorded.length + 1}`, lat: ok.lat, lon: ok.lon, recordedAt: new Date().toISOString() });
    this.save();
    this.emitConfig();
    return id;
  }

  updateRecordedPin(id: string, mut: (r: RecordedPin) => void): void {
    const r = this.store.geo?.recorded?.find(x => x.id === id);
    if (!r) return;
    mut(r);
    this.save();
    this.emitConfig();
  }

  deleteRecordedPin(id: string): void {
    if (!this.store.geo?.recorded) return;
    this.store.geo.recorded = this.store.geo.recorded.filter(r => r.id !== id);
    this.save();
    this.emitConfig();
  }

  // Reorder a recorded pin (chain ORDER is the boundary). dir −1 = earlier, +1 = later.
  moveRecordedPin(id: string, dir: number): void {
    const arr = this.store.geo?.recorded;
    if (!arr) return;
    const i = arr.findIndex(r => r.id === id);
    if (i < 0) return;
    const j = i + (dir < 0 ? -1 : 1);
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    this.save();
    this.emitConfig();
  }

  setRecordedClosed(b: boolean): void {
    this.setGeo(g => { g.recordedClosed = b || undefined; });
  }

  clearRecordedPins(): void {
    if (!this.store.geo?.recorded?.length) return;
    this.store.geo.recorded = [];
    this.save();
    this.emitConfig();
  }

  // Convert the recorded chain → a GroundArea polygon on the CURRENT floor.
  // Needs a usable fit (quality ≠ 'none') and ≥3 projectable pins. Coords are
  // kept EXACT (boundaries aren't grid objects). The recorded chain is left in
  // place (the user may delete it afterward). Returns a clear error otherwise.
  recordedChainToGroundArea(kind: GroundKind = 'grass'): { ok: boolean; error?: string; id?: string } {
    if (this.uiMode !== 'edit') return { ok: false, error: 'Only available in edit mode.' };
    const projected = this.projectedRecordedPins().filter(p => p.ok);
    if (projected.length < 3) {
      return { ok: false, error: 'Need ≥3 recorded points that project (calibrate a landmark first).' };
    }
    const pts = projected.slice(0, 20).map(p => ({ x: p.x, y: p.y }));
    const f = this.floor();
    if (!f.groundAreas) f.groundAreas = [];
    const id = newId('ga');
    f.groundAreas.push({ id, name: `Boundary ${f.groundAreas.length + 1}`, points: pts, kind });
    this.activeGroundAreaId = id;
    this.save();
    this.emitConfig();
    return { ok: true, id };
  }

  setBleShowUnknown(v: boolean): void {
    this.store.bleShowUnknown = v;
    this.save();
    this.emitConfig();
  }

  // Free-text notes describing the active configuration (Settings ▸ Data).
  // Rides export/import via the store. save() no-ops outside edit mode.
  setNotes(v: string): void {
    this.store.notes = v.trim() ? v : undefined;
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

  // ── Fit a stairs-family piece between two ground levels ────────────────────
  // Reads the GROUND at each end of the flight/ramp and sizes it to bridge them
  // in ONE edit (one save → one undo step).
  //
  //   • Steps rise toward local +Z, so the FOOT is sampled just beyond the −Z
  //     edge and the HEAD just beyond +Z — both at (depth/2 + AUTOFIT_PROBE_MM)
  //     along the piece's rotated local Z, i.e. on the landings the flight
  //     actually meets, not under its own footprint (which is its own terrain).
  //   • Ground comes from the pure resolveItemGroundMm — the app-side mirror of
  //     the renderer's _itemGroundY — so terraces, the surroundings grade and
  //     the floor's own elevation above the world ground plane all compose
  //     exactly as they do in the scene.
  //   • elevation = the LOWER end's ground. Stairs are exempt from automatic
  //     ground-following (HOUSE_MOUNTED_FURNITURE_KINDS), so `elevation` IS the
  //     base height and must carry the grade itself.
  //   • ht = the rise. A NEGATIVE difference means the piece is aimed downhill:
  //     it is rotated 180° so it still rises from the true lower end.
  //   • Ends closer than STAIRS_MIN_RISE_MM are refused (returns a reason)
  //     rather than producing a degenerate near-zero-rise piece.
  //
  // Returns null on success, a human-readable reason when it refuses.
  static readonly AUTOFIT_PROBE_MM = 150;
  autofitStairs(piece: { id: string }): string | null {
    if (this.uiMode !== 'edit') return 'editing is disabled in this mode';
    const f = this.floor();
    const fu = f.furniture.find(o => o.id === piece.id);
    if (!fu) return 'piece not found';
    if (!isStairsKind(fu.kind)) return 'not a stairs or ramp piece';
    if (fu.locked) return 'piece is locked';
    const reach = fu.h / 2 + Planner.AUTOFIT_PROBE_MM;
    const gAt = (ly: number) => {
      const d = furnitureLocalToWorld(fu.rotation, 0, ly);
      return resolveItemGroundMm(f, this.store.floors, this.store.scene3d?.groundLevelMm,
                                 fu.x + d.x, fu.y + d.y);
    };
    const footG = gAt(-reach), headG = gAt(reach);
    const diff = headG - footG;
    if (!isFinite(diff)) return 'could not read the ground at both ends';
    if (Math.abs(diff) < STAIRS_MIN_RISE_MM) {
      return `ends are level (${Math.round(footG)} mm at both ends)`;
    }
    const base = diff > 0 ? footG : headG;
    fu.elevation = base !== 0 ? Math.round(base) : undefined;
    const rise = Math.round(Math.abs(diff));
    const defHt = furnitureDef(fu).ht;
    fu.ht = rise === defHt ? undefined : rise;
    if (diff < 0) fu.rotation = (((fu.rotation ?? 0) + 180) % 360 + 360) % 360;
    this.save(); this.emitConfig();
    return null;
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
    // Frigate ground-truth camera targets join the SAME candidate pool as radar
    // (Phase 5) — a person walking from the yard (camera-only) through the door
    // (BLE) carries one identity. Cars never fuse (not a person). Already floor-
    // scoped + lerped by camPeople.
    for (const ct of this.camPeople) {
      if (ct.label === 'car') continue;
      radar.push({ key: ct.key, x: ct.x, y: ct.y, floorId: ct.floorId });
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

  // Mutate the on-screen compass config (creating it on first use), persist and
  // repaint — the setWeather pattern. No collectors to restart: the compass is
  // pure display (widget + north marker) reading resolveNorth each frame.
  setCompass(mut: (c: CompassConfig) => void): void {
    if (!this.store.compass) this.store.compass = {};
    mut(this.store.compass);
    this.save();
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

  // (Re)start the wall-calendar poll: an immediate fetch + a ~10 min timer.
  // Idempotent — clears any existing timer first. No-op'd naturally when the
  // floor has no calendar panels (the fetch loops over an empty set).
  private _startCalendarPoll(): void {
    if (this._calendarTimer) { clearInterval(this._calendarTimer); this._calendarTimer = null; }
    void this._refreshCalendars();
    this._calendarTimer = setInterval(() => void this._refreshCalendars(), Planner.CALENDAR_POLL_MS);
  }

  // Poll calendar.get_events for every bound calendar across ALL floors' panels
  // (a panel on another floor still wants fresh data when you switch to it),
  // caching the merged event list per panel id in this.calendarEvents. Repaints
  // (emitConfig) only when a panel's list actually changed. All failures are
  // swallowed (getCalendarEvents returns []); never throws into the tick path.
  private async _refreshCalendars(): Promise<void> {
    if (!this.hass) return;
    const panels = this.store.floors.flatMap(f => f.calendarPanels ?? []);
    if (!panels.length) { this.calendarEvents = {}; return; }
    const now = new Date();
    const startISO = now.toISOString();
    const endISO = new Date(now.getTime() + Planner.CALENDAR_WINDOW_H * 3600 * 1000).toISOString();
    let changed = false;
    try {
      for (const cp of panels) {
        const ids = (cp.calendarIds ?? []).filter(Boolean);
        if (!ids.length) {
          if (this.calendarEvents[cp.id]?.length) { delete this.calendarEvents[cp.id]; changed = true; }
          continue;
        }
        const events = await this.hass.getCalendarEvents(ids, startISO, endISO);
        const prev = this.calendarEvents[cp.id];
        if (JSON.stringify(prev) !== JSON.stringify(events)) {
          this.calendarEvents[cp.id] = events; changed = true;
        }
      }
    } catch { /* never throw into the tick/RAF path */ }
    if (changed) this.emitConfig();
  }

  // Defensive headline list for a TV's bound news entity (surfaces.parseHeadlines
  // over the live entity state). [] when unbound / no usable payload.
  headlinesFor(newsEntity: string | null | undefined): string[] {
    if (!newsEntity || !this.hass) return [];
    return parseHeadlines(this.hass.states[newsEntity] ?? null);
  }

  // (Re)apply the current weather source: (re)start or stop the Open-Meteo
  // timer, or recompute a local source from current states. Idempotent.
  private _reconfigureWeather(): void {
    if (this._weatherTimer) { clearInterval(this._weatherTimer); this._weatherTimer = null; }
    if (this._weatherFcTimer) { clearInterval(this._weatherFcTimer); this._weatherFcTimer = null; }
    // Forecast state is source-specific — drop it so a source switch can't leak
    // the previous entity's forecast onto a new one.
    this._fcCond = undefined; this._fcRainSoon = undefined;
    this.forecastDaily = null; this.forecastHourly = null;
    const w = this.store.weather;
    if (!w) { this.weatherNow = null; this.weatherAlerts = []; return; }
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
    // Alerts (independent of the source) — recompute so a settings-tab entity
    // change (which routes through setWeather → here) repaints immediately.
    this._recomputeWeatherAlerts(this.hass?.states ?? {});
  }

  // Fetch the bound weather entity's daily + hourly forecast (HA 2024.4+ service
  // path) and fold the derived bits over weatherNow. All failures are swallowed
  // (getWeatherForecasts returns null); never throws into the tick path.
  private async _refreshEntityForecasts(): Promise<void> {
    const w = this.store.weather;
    if (!w || w.source !== 'entity' || !w.entityId || !this.hass) return;
    const eid = w.entityId;
    // Forecast record temps come in the ENTITY's own temperature_unit; normalize
    // to °C so the chip's tempText (°C in, imperial-aware out) stays correct like
    // Open-Meteo (which is fetched in °C). Mutates in place — safe, nothing reads
    // forecast temperature raw.
    const tUnit = String((this.hass.states[eid]?.attributes as Record<string, unknown>)?.temperature_unit ?? '');
    const normTemps = (recs: ForecastRecord[] | null): void => {
      if (!recs || !tUnit) return;
      for (const r of recs) {
        if (typeof r.temperature === 'number') r.temperature = toCelsius(r.temperature, tUnit);
        if (typeof r.templow === 'number') r.templow = toCelsius(r.templow, tUnit);
      }
    };
    try {
      let arraysChanged = false;
      const daily = await this.hass.getWeatherForecasts(eid, 'daily');
      if (daily) {
        normTemps(daily);
        this.forecastDaily = daily; arraysChanged = true;
        if (daily.length && typeof daily[0].condition === 'string') {
          this._fcCond = daily[0].condition as HaCondition;
        }
      }
      const hourly = await this.hass.getWeatherForecasts(eid, 'hourly');
      // null → entity exposes no hourly forecast; leave rainSoon undefined.
      if (hourly) {
        normTemps(hourly);
        this.forecastHourly = hourly; arraysChanged = true;
        this._fcRainSoon = forecastRainSoon(hourly, Date.now());
      }
      // Repaint when the derived bits change OR the raw arrays refreshed (so the
      // chip's forecast strip updates on every 30-min poll, not only on a
      // condition flip).
      if (this._applyForecastToNow() || arraysChanged) this.emitConfig();
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

  // ── MQTT bridge (Phase 5) ──────────────────────────────────────────────────
  // Live status the Settings ▸ Integrations pill reads. 'idle' when off/absent.
  get mqttStatus(): BridgeStatus { return this._mqttStatus; }

  // Edit the bridge config, persist, and (re)start the transport. Mirrors
  // setWeather. Secrets are NOT touched here — they live in localStorage.
  setMqttBridge(mut: (m: MqttBridgeConfig) => void): void {
    if (!this.store.mqttBridge) this.store.mqttBridge = { mode: 'off' };
    mut(this.store.mqttBridge);
    this.save();
    void this._reconfigureMqtt();
    this.emitConfig();
  }

  // Restart the bridge without a config change (Settings "Test connection").
  restartMqtt(): void { void this._reconfigureMqtt(); }

  // Register a topic-filter subscription. Consumers (Batches B/C) call this; it
  // QUEUES until the bridge is up and is replayed on every restart. Cheap no-op
  // storage when the bridge is off — the consumer never has to know the mode.
  mqttSubscribe(filter: string, cb: (m: { topic: string; payloadString: string }) => void): void {
    this._mqttSubs.push({ filter, cb });
    if (this._mqttBridge) this._mqttBridge.subscribe(filter, cb);
  }

  // Publish a payload on a topic through the active bridge. Fire-and-forget +
  // no-op when the bridge is down (write side of tap-to-clean etc.).
  mqttPublish(topic: string, payload: string, retain = false): void {
    if (this._mqttBridge) this._mqttBridge.publish(topic, payload, retain);
  }

  // (Re)start or stop the bridge to match the current config + connection.
  // Inert when mode off/absent or offline. Dynamic-imports mqtt-bridge.js so the
  // transport stays out of the startup chunk. Idempotent (stop then start).
  private async _reconfigureMqtt(): Promise<void> {
    if (this._mqttBridge) { try { this._mqttBridge.stop(); } catch { /* ignore */ } this._mqttBridge = null; }
    this._mqttStatus = 'idle';
    const cfg = this.store.mqttBridge;
    const mode = cfg?.mode ?? 'off';
    if (mode === 'off' || this.isOffline || !this.hass) { this.emitConfig(); return; }
    try {
      const { startBridge } = await import('./mqtt-bridge.js');
      // The config may have changed (or the bridge been torn down) during the
      // async import — re-check before wiring anything up.
      if ((this.store.mqttBridge?.mode ?? 'off') !== mode || this.isOffline || !this.hass) {
        this.emitConfig(); return;
      }
      const bridge = startBridge(
        { mode, brokerHost: cfg!.brokerHost, brokerPort: cfg!.brokerPort, useTls: cfg!.useTls },
        this.hass,
        { onStatus: (s) => { this._mqttStatus = s; this.emitConfig(); } },
      );
      this._mqttBridge = bridge;
      // Replay every registered subscription onto the fresh bridge.
      for (const s of this._mqttSubs) bridge.subscribe(s.filter, s.cb);
      this.ensureFrigateSub();
      this.ensureVacuumSubs();
    } catch (err) {
      console.warn('mqtt bridge failed to start:', err);
      this._mqttStatus = 'error';
      this.emitConfig();
    }
  }

  // ── Neighborhood overlay (OpenFreeMap — Wave 1) ─────────────────────────────
  // Mutate the neighborhood config (creating it on first use), persist and
  // re-resolve. Mirrors setWeather / setMqttBridge. `_reconfigureNeighborhood`
  // only fetches tiles NOT already in the warm decoded cache, so an align /
  // verticalScale / exclusion change re-extracts with ZERO new fetches.
  setNeighborhood(mut: (n: NeighborhoodConfig) => void): void {
    if (!this.store.neighborhood) this.store.neighborhood = { source: 'openfreemap' };
    mut(this.store.neighborhood);
    this.save();
    void this._reconfigureNeighborhood();
    this.emitConfig();
  }

  // The neighborhood fetch radius (m), clamped ONCE here so the fetch, the
  // radius-derived render caps and the settings UI can never disagree. 3 km is
  // the ceiling: at z14 that is a handful of tiles (cached 30 days), and the
  // renderer widens its camera frustum to match (see _applyFrustumForRange).
  neighborhoodRadiusM(): number {
    return Math.max(100, Math.min(3000, this.store.neighborhood?.radiusM ?? 350));
  }

  // Clear the persistent tile cache (future Settings "reset cache" button) and
  // re-fetch. Also drops the warm decoded cache so the next reconfigure refetches.
  async clearNeighborhoodCache(): Promise<void> {
    await clearNeighborhoodTiles();
    this._nbhdDecoded.clear();
    this._nbhdTemplate = null;
    await this._reconfigureNeighborhood();
  }

  // (Re)resolve the neighborhood overlay to match the current config + geo fit.
  // Inert (data null) when disabled / offline / no calibrated landmark. Network
  // is fully isolated in try/catch — a fetch failure never throws into the tick
  // path, it just leaves that tile's data absent (weather.ts fetchOpenMeteo idiom).
  private async _reconfigureNeighborhood(): Promise<void> {
    const runId = ++this._nbhdRunId;
    const cfg = this.store.neighborhood;
    if (!cfg?.enabled || this.isOffline) { this.neighborhoodData = null; this.emitConfig(); return; }
    const fit = this.geoFit();
    if (!fit || fit.transform.quality === 'none') { this.neighborhoodData = null; this.emitConfig(); return; }

    const source = cfg.source ?? 'openfreemap';
    // A source (or custom-template) change invalidates every warm/template cache
    // so we never serve the wrong endpoint's tiles.
    const srcKey = source === 'custom' ? `custom:${cfg.tileUrlTemplate ?? ''}` : 'openfreemap';
    if (srcKey !== this._nbhdSourceKey) {
      this._nbhdDecoded.clear();
      this._nbhdTemplate = null;
      this._nbhdSourceKey = srcKey;
    }

    const t = fit.transform;
    const radiusM = this.neighborhoodRadiusM();
    const addrs = tilesForRadius(t.originLat, t.originLon, radiusM, DEFAULT_TILE_ZOOM);

    // Resolve the tile-URL template (openfreemap: fetch TileJSON once + cache;
    // custom: the user template after a scheme check). A bad-scheme custom URL or
    // a failed TileJSON leaves data null.
    let template: string | null;
    try { template = await this._resolveTileTemplate(source, cfg.tileUrlTemplate); }
    catch { this.neighborhoodData = null; this.emitConfig(); return; }
    if (runId !== this._nbhdRunId) return;   // a newer reconfigure superseded us
    if (!template) { this.neighborhoodData = null; this.emitConfig(); return; }

    // Ensure every needed tile is decoded (warm cache → IDB → network), fetching
    // only misses. All I/O per-tile try/caught.
    for (const a of addrs) {
      const key = tileCacheKey(source, a.z, a.x, a.y);
      if (this._nbhdDecoded.has(key)) continue;
      let bytes: ArrayBuffer | null = null;
      try {
        const cached = await getTile(key, TILE_TTL_MS);
        if (cached) bytes = cached.bytes;
        else {
          const res = await fetch(tileUrl(template, a));
          if (res.ok) {
            bytes = await res.arrayBuffer();
            void putTile(key, { bytes, fetchedAt: Date.now() });
          }
        }
      } catch { bytes = null; }
      if (runId !== this._nbhdRunId) return;   // superseded mid-fetch
      if (bytes) {
        try {
          const decoded = decodeTile(new Uint8Array(bytes));
          this._nbhdDecoded.set(key, { addr: a, layers: decoded.layers });
        } catch { /* skip a bad tile — decoder never throws anyway */ }
      }
    }
    if (runId !== this._nbhdRunId) return;
    this._extractNeighborhood(source, addrs, t);
  }

  // ── Flights & ISS (roadmap P4) ──────────────────────────────────────────────
  // Mutate the flight config (creating it on first use), persist, re-apply the
  // source and repaint — the setWeather / setNeighborhood pattern, so switching
  // source or cadence restarts / stops the polls cleanly.
  setFlights(mut: (f: FlightsConfig) => void): void {
    if (!this.store.flights) this.store.flights = { source: 'cloud' };
    mut(this.store.flights);
    // Normalize the watch list HERE (not only in the settings UI) so every entry
    // point — settings edit, import, hand-edited config — stores the same
    // uppercase, trimmed, blank-free shape the matcher expects.
    const al = this.store.flights.alerts;
    if (al && al.watch) {
      const w = al.watch.map(s => String(s).trim().toUpperCase()).filter(s => s !== '');
      al.watch = w.length ? w : undefined;
    }
    // Same discipline for the label-plate field list: unknown keys, duplicates
    // and casing are normalized HERE (pure helper in flights.ts), so an import
    // or a hand-edited config lands in the shape the renderer expects. Empty →
    // undefined = "use the default plate".
    if (this.store.flights.labelFields !== undefined) {
      this.store.flights.labelFields = sanitizeLabelFields(this.store.flights.labelFields);
    }
    // Model-size preference: clamp 0.5..4 HERE (not only in the settings UI) so
    // an import or a hand-edited config can never hand the renderer a NaN or a
    // 1000× plate. Exactly 1 (or anything unusable) clears back to "default".
    const ms = this.store.flights.modelScale;
    if (ms !== undefined) {
      const n = typeof ms === 'number' && isFinite(ms) && ms > 0
        ? Math.min(4, Math.max(0.5, ms)) : 1;
      this.store.flights.modelScale = n === 1 ? undefined : n;
    }
    // Display-shell radius (metres): same discipline as modelScale — clamp
    // 60..1000 HERE so an import or hand-edited config can never hand the
    // renderer a NaN or a 50 km shell, and exactly the default (300) clears
    // back to undefined so the stored config stays minimal.
    const sr = this.store.flights.shellRadiusM;
    if (sr !== undefined) {
      const n = typeof sr === 'number' && isFinite(sr) && sr > 0
        ? Math.min(FLIGHT_SHELL_MAX_RADIUS_M, Math.max(FLIGHT_SHELL_MIN_RADIUS_M, sr))
        : FLIGHT_SHELL_DEFAULT_RADIUS_M;
      this.store.flights.shellRadiusM =
        n === FLIGHT_SHELL_DEFAULT_RADIUS_M ? undefined : n;
    }
    // Same discipline for the user glow rules (docs/research/flight-glow-rules.md
    // §6.3): unknown patterns / unusable colours drop the rule, numeric criteria
    // clamp and swap-if-inverted, ids de-duplicate, the cap is enforced, and —
    // the trap worth naming — a BLANK text criterion collapses to `undefined`
    // rather than compiling to `**` and matching every aircraft on that field.
    if (this.store.flights.glowRules !== undefined) {
      this.store.flights.glowRules = sanitizeFlightGlowRules(this.store.flights.glowRules);
    }
    this.save();
    void this._reconfigureFlights();
    this.emitConfig();
  }

  // Where the house is, in the real world — the observer point every bearing /
  // distance / satellite-altitude calculation needs. The SAME fallback chain the
  // sky-astro observer already uses (three-view will reuse this helper), so
  // there is only one "where is the house" resolution path: a calibrated
  // landmark fit first, then the weather config's lat/lon, then nothing. Cheap
  // enough to call per frame.
  flightsOrigin(): { lat: number; lon: number } | null {
    const fit = this.geoFit();
    if (fit && fit.transform.quality !== 'none') {
      return { lat: fit.transform.originLat, lon: fit.transform.originLon };
    }
    const w = this.store.weather;
    if (w && typeof w.lat === 'number' && isFinite(w.lat)
      && typeof w.lon === 'number' && isFinite(w.lon)) {
      return { lat: w.lat, lon: w.lon };
    }
    return null;
  }

  // One aircraft out of the LIVE feed by ICAO hex — what the flight detail card
  // reads (opened by a 3D/2D click, kept fresh on the live channel). Case-
  // insensitive because a click can carry either casing; null once the aircraft
  // drops out of the feed, which the card renders as "signal lost".
  flightByHex(hex: string | null | undefined): FlightPoint | null {
    if (!hex) return null;
    const h = String(hex).toLowerCase();
    return (this.flightsNow ?? []).find(fp => fp.hex.toLowerCase() === h) ?? null;
  }

  // Configured search/display radius (nm) and poll cadence (s), clamped.
  private _flightsRadiusNm(): number {
    const r = this.store.flights?.radiusNm;
    return Math.max(5, Math.min(100,
      typeof r === 'number' && isFinite(r) ? r : Planner.FLIGHTS_DEFAULT_RADIUS_NM));
  }

  private _flightsPollMs(): number {
    const p = this.store.flights?.pollSeconds;
    return Math.max(5, Math.min(60, typeof p === 'number' && isFinite(p) ? p : 8)) * 1000;
  }

  // (Re)apply the flight config: stop both timers, then start whatever the
  // current source needs. Idempotent. Inert (no fetch, no timer, data nulled)
  // when the feature is disabled or no observer origin resolves — the display
  // math needs a real lat/lon for EVERY source, not just the cloud one. Offline
  // mode is deliberately NOT a gate: "offline" means no HA backend, not no
  // internet (the Open-Meteo precedent).
  private async _reconfigureFlights(): Promise<void> {
    if (this._flightsTimer) { clearInterval(this._flightsTimer); this._flightsTimer = null; }
    if (this._issTimer) { clearInterval(this._issTimer); this._issTimer = null; }

    const cfg = this.store.flights;
    if (!cfg?.enabled) {
      this.flightsNow = null; this.issNow = null;
      this.flightsStatus = 'off'; this.flightsRev++;
      this.emitConfig();
      return;
    }
    if (!this.flightsOrigin()) {
      this.flightsNow = null; this.issNow = null;
      this.flightsStatus = 'no-origin'; this.flightsRev++;
      this.emitConfig();
      return;
    }

    const source = cfg.source ?? 'cloud';
    if (source === 'entity') {
      // No timer: the bound entity pushes over state_changed (config-path, see
      // _isSlowEntity). Recompute now from whatever state is already loaded.
      this._recomputeFlightsFromEntity();
    } else {
      void this._pollFlights();
      this._flightsTimer = setInterval(() => void this._pollFlights(), this._flightsPollMs());
    }

    // The ISS runs on its own cadence, independent of the aircraft source.
    if (cfg.iss !== false) {
      void this._pollIss();
      this._issTimer = setInterval(() => void this._pollIss(), Planner.ISS_POLL_MS);
    } else if (this.issNow) {
      this.issNow = null; this.flightsRev++; this.emitConfig();
    }
  }

  // Fetch + apply one aircraft poll (cloud / local sources). Guarded against
  // overlapping fetches. A failed fetch KEEPS the last data (stale-tolerant like
  // weather) and only reports 'error' when there is nothing to show.
  private async _pollFlights(): Promise<void> {
    const cfg = this.store.flights;
    if (!cfg?.enabled) return;
    const source = cfg.source ?? 'cloud';
    if (source === 'entity') return;
    const origin = this.flightsOrigin();
    if (!origin) return;
    if (this._flightsFetching) return;
    this._flightsFetching = true;
    try {
      const json = source === 'local'
        ? (cfg.localUrl ? await fetchLocalAircraft(cfg.localUrl) : null)
        : await fetchAirplanesLive(origin.lat, origin.lon, this._flightsRadiusNm());
      if (json) {
        this._applyFlights(normalizeAircraftList(json), origin);
      } else if (!this.flightsNow && this.flightsStatus !== 'error') {
        // Nothing to fall back on — report once, don't spam on every retry.
        this.flightsStatus = 'error';
        this.emitConfig();
      }
    } finally {
      this._flightsFetching = false;
    }
  }

  // Recompute from the bound HA entity's attributes ('entity' source — an HA
  // rest/template sensor that did the fetching SERVER-side, so no CORS applies).
  // Accepts the array under `aircraft` / `ac` / `flights` (the fr24 HACS shape),
  // or an attributes object that is itself an array — normalizeAircraftList
  // unwraps all of them.
  //
  // NB: this runs off the bound entity's `state_changed`, and that entity id is
  // config-path in `_isSlowEntity` — so HA's own state event has ALREADY emitted
  // config by the time we get here. Do NOT add a second emit: `_applyFlights`
  // stays conditional. That single emit is acceptable because the entity source's
  // cadence is the HA rest sensor's own `scan_interval` (user-controlled, usually
  // minutes), not our few-second poll.
  private _recomputeFlightsFromEntity(): void {
    const cfg = this.store.flights;
    if (!cfg?.enabled || (cfg.source ?? 'cloud') !== 'entity' || !cfg.entityId) return;
    const origin = this.flightsOrigin();
    if (!origin) return;
    const attrs = this.hass?.states?.[cfg.entityId]?.attributes;
    if (!attrs) {
      if (!this.flightsNow && this.flightsStatus !== 'error') {
        this.flightsStatus = 'error'; this.emitConfig();
      }
      return;
    }
    this._applyFlights(normalizeAircraftList(attrs), origin);
  }

  // Shared post-processing for every source: fill distNm from the observer
  // origin (recomputed even when the cloud supplied `dst`, so one consistent
  // number feeds both the filter and the display shell), drop anything outside
  // the radius / altitude band, sort nearest-first and cap the render count.
  private _applyFlights(list: FlightPoint[], origin: { lat: number; lon: number }): void {
    const cfg = this.store.flights;
    const radiusNm = this._flightsRadiusNm();
    const minAlt = typeof cfg?.minAltFt === 'number' && isFinite(cfg.minAltFt) ? cfg.minAltFt : null;
    const maxAlt = typeof cfg?.maxAltFt === 'number' && isFinite(cfg.maxAltFt) ? cfg.maxAltFt : null;
    const kept: FlightPoint[] = [];
    for (const fp of list) {
      const { distNm } = flightBearingDistance(origin.lat, origin.lon, fp.lat, fp.lon);
      if (distNm > radiusNm) continue;
      if (minAlt !== null && fp.altFt < minAlt) continue;
      if (maxAlt !== null && fp.altFt > maxAlt) continue;
      fp.distNm = distNm;
      kept.push(fp);
    }
    kept.sort((a, b) => (a.distNm ?? 0) - (b.distNm ?? 0));

    // Routine polls are LIVE-path — configRev must NOT bump every few seconds or
    // every configRev-keyed 3D group (weather particles, bg-text aircraft)
    // rebuilds and visibly resets (user-reported). `flightsRev` alone is enough:
    // three-view recomputes `_keyFlights = configRev|flightsRev|layers.flights`
    // EVERY tick, and the 2D canvas RAF reads `flightsNow` per frame. This
    // mirrors the `_solveBle` precedent (~0.1 Hz solves never emitConfig).
    const prevStatus = this.flightsStatus;
    const hadData = this.flightsNow !== null;

    this.flightsNow = kept.slice(0, MAX_AIRCRAFT);
    this.flightsAt = Date.now();
    this.flightsStatus = 'ok';
    this.flightsRev++;
    // Evaluate the alert triggers over the FILTERED list. Repaint ONLY on a
    // genuinely structural transition (all rare): a status change, the first
    // data after nothing (the app.ts attribution chip appears), or a flight
    // alert appearing/being pruned (the alert bell subscribes to config).
    const alertsChanged = this._computeFlightAlerts();
    if (alertsChanged || prevStatus !== 'ok' || !hadData) this.emitConfig();
  }

  // ── Flight / ISS alert triggers (research §6.3) ─────────────────────────────
  // Cheap: it only walks the already-polled, already-capped aircraft list plus a
  // single ISS altitude — no fetch, no allocation beyond the alerts themselves.
  // Called at the end of every successful aircraft poll AND every advanced ISS
  // fix. Returns whether `flightAlerts` changed; it deliberately does NOT emit —
  // both call sites emit CONDITIONALLY on that return value (plus their own
  // structural transitions), because a routine poll must stay LIVE-path.
  private _computeFlightAlerts(): boolean {
    const cfg = this.store.flights;
    const now = Date.now();
    const before = this.flightAlerts.length ? this.flightAlerts.map(a => a.id).join('|') : '';

    // An ACTIVE emergency is exempt from the retention prune: a squawk-7700
    // aircraft still overhead 20 minutes later is not a stale notice (research
    // §2 — `emergency` outranks everything else in this feature). Ids are
    // collected from the current list BEFORE pruning, and refreshed in place
    // below so the alert keeps its original createdAt.
    const emergIds = new Set<string>();
    if (cfg?.enabled) {
      for (const fp of this.flightsNow ?? []) {
        if (isEmergency(fp)) emergIds.add(`flight:emerg:${fp.hex}`);
      }
    }

    // Prune the retention window first so a stale notice can't linger behind the
    // cap and starve a fresh one.
    this.flightAlerts = this.flightAlerts.filter(
      a => emergIds.has(a.id)
        || now - (a.createdAt ? Date.parse(a.createdAt) : 0) < Planner.FLIGHT_ALERT_TTL_MS);

    if (cfg?.enabled) {
      const push = (a: PanelAlert, cooldownMs: number): void => {
        const last = this._flightAlertAt.get(a.id) ?? 0;
        if (now - last < cooldownMs) return;
        this._flightAlertAt.set(a.id, now);
        // A push past the cooldown is a genuinely NEW event, so re-arm an id the
        // user dismissed earlier (ids are stable per hex — without this, one
        // dismissal would mute that aircraft for the whole session).
        this._flightAlertDismissed.delete(a.id);
        this.flightAlerts = this.flightAlerts.filter(x => x.id !== a.id);
        this.flightAlerts.push(a);
      };

      const lowAlt = cfg.alerts?.lowAltFt;
      const watch = cfg.alerts?.watch;
      const list = this.flightsNow ?? [];

      for (const fp of list) {
        const who = fp.callsign ?? fp.hex.toUpperCase();

        // EMERGENCY (research §2 / §5.5) — the loudest trigger in the feature,
        // and the only one that deliberately IGNORES the 3 nm overhead gate: a
        // squawk 7700 anywhere in the configured radius matters. Severity
        // 'error', above the low-overflight 'warning'. It does NOT go through
        // `push()`: an active emergency must persist (refreshed in place, so
        // the id order — and therefore the `changed` signal — stays stable),
        // not re-fire on a cooldown.
        if (isEmergency(fp)) {
          const id = `flight:emerg:${fp.hex}`;
          const dismissed = this._flightAlertDismissed.has(id);
          const last = this._flightAlertAt.get(id) ?? 0;
          if (!dismissed || now - last >= Planner.FLIGHT_EMERG_COOLDOWN_MS) {
            if (dismissed) {
              // Past the cooldown a still-live emergency re-arms (the same
              // re-arm semantics `push()` gives the other triggers).
              this._flightAlertDismissed.delete(id);
              this._flightAlertAt.set(id, now);
            }
            const code = emergencySquawk(fp) ?? fp.emergency ?? fp.squawk ?? 'emergency';
            const title = `EMERGENCY: ${who} squawking ${code}`;
            const message = `${Math.round(fp.altFt).toLocaleString()} ft · ${(fp.distNm ?? 0).toFixed(1)} nm from home`;
            const existing = this.flightAlerts.find(a => a.id === id);
            if (existing) {
              // Refresh IN PLACE — keeps the original createdAt and the array
              // order, so a routine poll over a persisting emergency reports
              // "nothing changed" and stays LIVE-path (no configRev bump).
              existing.title = title;
              existing.message = message;
            } else {
              this._flightAlertAt.set(id, now);
              this.flightAlerts.push({
                id,
                source: 'flight',
                severity: 'error',
                title,
                message,
                createdAt: new Date(now).toISOString(),
                dismissible: true,
              });
            }
          }
        }

        // Low overflight: below the threshold AND genuinely overhead (the radius
        // filter alone would fire for anything low anywhere in a 30 nm circle).
        if (typeof lowAlt === 'number' && isFinite(lowAlt)
          && fp.altFt < lowAlt && (fp.distNm ?? 99) <= Planner.FLIGHT_LOW_DIST_NM) {
          push({
            id: `flight:low:${fp.hex}`,
            source: 'flight',
            severity: 'warning',
            title: `Low overflight: ${who} at ${Math.round(fp.altFt).toLocaleString()} ft`,
            message: `${(fp.distNm ?? 0).toFixed(1)} nm from home`,
            createdAt: new Date(now).toISOString(),
            dismissible: true,
          }, Planner.FLIGHT_LOW_COOLDOWN_MS);
          // A low flyover is also a house-wide "moment" — avatars glance up
          // (the weather-event precedent: no fixture anchor, x/y null).
          this.householdEvents.push({ furnitureId: null, kind: 'flyover', at: now });
          this._pruneEvents(now);
        }
        // Watch list: uppercase callsign PREFIX or an exact hex match. Entries
        // are normalized to uppercase on save, but re-upper here so a
        // hand-edited config still matches.
        if (watch && watch.length) {
          const cs = (fp.callsign ?? '').toUpperCase();
          const hex = fp.hex.toUpperCase();
          const hit = watch.some(w => {
            const t = w.trim().toUpperCase();
            return t !== '' && ((cs !== '' && cs.startsWith(t)) || hex === t);
          });
          if (hit) {
            push({
              id: `flight:watch:${fp.hex}`,
              source: 'flight',
              severity: 'info',
              title: `Watched flight: ${who}`,
              message: `${Math.round(fp.altFt).toLocaleString()} ft · ${(fp.distNm ?? 0).toFixed(1)} nm`,
              createdAt: new Date(now).toISOString(),
              dismissible: true,
            }, Planner.FLIGHT_WATCH_COOLDOWN_MS);
          }
        }
      }

      // ISS pass: a live EDGE DETECTOR, not a prediction (§6.3 — the v1 ISS
      // source reports position only, it cannot propagate). Fires once on the
      // below→above transition of the horizon threshold.
      const iss = this.issNow;
      const origin = this.flightsOrigin();
      if (cfg.alerts?.issPass !== false && iss && origin) {
        const { altRad } = satAltAz(origin.lat, origin.lon, iss.lat, iss.lon, iss.altKm);
        const altDeg = altRad * 180 / Math.PI;
        const up = altDeg > Planner.ISS_UP_ALT_DEG;
        if (up && !this._issWasUp) {
          // Hour-bucketed id: an ISS pass is a one-off moment, and the bucket
          // keeps a re-entry within the same hour from stacking duplicates.
          push({
            id: `flight:iss:${Math.floor(now / 3600000)}`,
            source: 'flight',
            severity: 'info',
            title: `ISS pass — above the horizon now (alt ${Math.round(altDeg)}°)`,
            message: 'The International Space Station is up.',
            createdAt: new Date(now).toISOString(),
            dismissible: true,
          }, 0);
        }
        this._issWasUp = up;
      }
    }

    // Cap: oldest-out, but an ACTIVE emergency is never the one dropped (it
    // would be silently muted exactly when it matters most). Only emergencies
    // alone exceeding the cap can push the list past it.
    if (this.flightAlerts.length > Planner.FLIGHT_ALERT_CAP) {
      let excess = this.flightAlerts.length - Planner.FLIGHT_ALERT_CAP;
      this.flightAlerts = this.flightAlerts.filter(a => {
        if (excess > 0 && !emergIds.has(a.id)) { excess--; return false; }
        return true;
      });
    }
    return this.flightAlerts.map(a => a.id).join('|') !== before;
  }

  // Poll the live ISS sub-point. Advances only when the fix actually moved (the
  // feed's own timestamp changed), so the 10 s timer doesn't churn. Like the
  // aircraft poll this is LIVE-path: `flightsRev` is what the renderer reads —
  // bumping configRev every 10 s would rebuild every configRev-keyed 3D group
  // (weather particles, bg-text aircraft) and visibly reset them.
  private async _pollIss(): Promise<void> {
    const cfg = this.store.flights;
    if (!cfg?.enabled || cfg.iss === false) return;
    const iss = await fetchIssNow();
    if (!iss) return;                                   // keep the last fix
    if (this.issNow && this.issNow.tsMs === iss.tsMs) return;
    const hadIss = this.issNow !== null;
    this.issNow = iss;
    this.flightsRev++;
    // ISS-above-horizon edge. Repaint only on a structural transition: the first
    // fix (null → non-null, the attribution chip) or a new/pruned alert.
    const alertsChanged = this._computeFlightAlerts();
    if (alertsChanged || !hadIss) this.emitConfig();
  }

  // Resolve (and cache) the OpenFreeMap tile-URL template, or validate a custom
  // one. Throws on a non-http(s) custom scheme so the caller can null the data.
  private async _resolveTileTemplate(source: string, custom: string | undefined): Promise<string | null> {
    if (source === 'custom') {
      if (!tileTemplateSchemeOk(custom)) throw new Error('custom tile URL must be http(s)');
      return custom!.trim();
    }
    if (this._nbhdTemplate?.source === 'openfreemap') return this._nbhdTemplate.template;
    // The version-stamped path segment changes weekly — always read the TileJSON
    // rather than hardcoding it (research §2).
    const res = await fetch('https://tiles.openfreemap.org/planet');
    if (!res.ok) return null;
    const j = await res.json() as { tiles?: unknown };
    const tmpl = Array.isArray(j.tiles) && typeof j.tiles[0] === 'string' ? j.tiles[0] as string : null;
    if (!tmpl) return null;
    this._nbhdTemplate = { source: 'openfreemap', template: tmpl };
    return tmpl;
  }

  // Re-run the PURE feature build over the warm decoded cache — the separable
  // "extraction" half (no fetch/decode). Called at the end of every reconfigure
  // and cheap enough that an align-slider nudge feels live.
  private _extractNeighborhood(source: string, addrs: TileAddr[], t: GeoTransform): void {
    const cfg = this.store.neighborhood;
    if (!cfg) { this.neighborhoodData = null; this.neighborhoodRev++; this.emitConfig(); return; }
    const tiles: Array<{ addr: TileAddr; layers: Record<string, MvtLayer> }> = [];
    for (const a of addrs) {
      const d = this._nbhdDecoded.get(tileCacheKey(source, a.z, a.x, a.y));
      if (d) tiles.push({ addr: a, layers: d.layers });
    }
    this.neighborhoodData = buildNeighborhoodFeatures(tiles, t, {
      align: cfg.align,
      exclusions: cfg.exclusions,
      verticalScale: Math.max(0.2, Math.min(3, cfg.verticalScale ?? 1)),
      defaultLevelHeightM: Math.max(2, Math.min(5, cfg.defaultLevelHeightM ?? 3)),
      layers: cfg.layers,
      fetchedAt: Date.now(),
      // Nearest-N cap scales with the fetch radius — a 400-building cap tuned
      // for 500 m would silently eat everything a 3 km radius fetched.
      maxBuildings: buildingCapForRadius(this.neighborhoodRadiusM()),
    });
    this.neighborhoodRev++;
    this.emitConfig();
  }

  // ── Valetudo room-map overlay (Phase 5, batch M-C) ──────────────────────────
  // Register the wildcard subscriptions for Valetudo map + status once the bridge
  // is up. We subscribe by NAMESPACE with `+` wildcards (not per robot id) so
  // adding a robot / editing its valetudoId needs no re-subscribe (the M-A queue
  // never unsubscribes) — inbound topics are matched to a RobotFixture at message
  // time. Re-runs only register a fresh set when the namespace itself changes.
  ensureVacuumSubs(): void {
    const cfg = this.store.mqttBridge;
    if (!cfg || (cfg.mode ?? 'off') === 'off') return;
    const ns = (cfg.valetudoNs || 'valetudo').replace(/\/+$/, '');
    if (this._vacSubNs === ns) return;   // already registered for this namespace
    this._vacSubNs = ns;
    this.mqttSubscribe(`${ns}/+/MapData/map-data`, m => { void this._onVacMapData(m.topic, m.payloadString); });
    this.mqttSubscribe(`${ns}/+/StatusStateAttribute/value`, m => this._onVacStatus(m.topic, 'value', m.payloadString));
    this.mqttSubscribe(`${ns}/+/StatusStateAttribute/flag`, m => this._onVacStatus(m.topic, 'flag', m.payloadString));
  }

  // Resolve a `<ns>/<id>/…` topic's identifier segment → the RobotFixture (across
  // ALL floors) whose valetudoId matches. Null when no robot claims it.
  private _robotForVacTopic(topic: string): RobotFixture | null {
    const parts = topic.split('/');
    if (parts.length < 3) return null;
    const id = parts[1];
    for (const f of this.store.floors) {
      const ro = (f.robots ?? []).find(r => r.kind === 'vacuum' && r.valetudoId && r.valetudoId === id);
      if (ro) return ro;
    }
    return null;
  }

  // MapData/map-data → decode (async) + store per robot, bump the revision (dirty
  // key + 3D texture disposal), repaint. Guarded end-to-end.
  private async _onVacMapData(topic: string, payload: string): Promise<void> {
    try {
      const ro = this._robotForVacTopic(topic);
      if (!ro) return;
      const parsed = await decodeMapDataPayload(payload);
      if (!parsed) return;
      const prev = this.vacuumMaps[ro.id];
      // Skip a no-op republish (same nonce) so the revision doesn't churn.
      if (prev && prev.nonce === parsed.nonce) return;
      this.vacuumMaps[ro.id] = parsed;
      this.vacuumMapRev[ro.id] = (this.vacuumMapRev[ro.id] ?? 0) + 1;
      this.emitConfig();
    } catch { /* never throw out of a bridge callback */ }
  }

  // StatusStateAttribute value/flag → cache; repaint only on a real change (the
  // 2D glow reads live from RAF, but 3D needs the dirty key to re-fold).
  private _onVacStatus(topic: string, field: 'value' | 'flag', payload: string): void {
    try {
      const ro = this._robotForVacTopic(topic);
      if (!ro) return;
      const v = payload.trim();
      const cur = this.vacuumStatus[ro.id] ?? (this.vacuumStatus[ro.id] = {});
      if (cur[field] === v) return;
      cur[field] = v;
      this.emitConfig();
    } catch { /* ignore */ }
  }

  // The segment ids that should GLOW for a robot right now: when the robot is
  // cleaning a segment job, the ids Diorama itself last commanded (if any); when
  // cleaning with no known target, ALL segments (soft glow); else none.
  vacuumGlowSegments(robotId: string): Set<string> | null {
    const st = this.vacuumStatus[robotId];
    if (!st || st.value !== 'cleaning') return null;
    if (st.flag === 'segment') {
      const cmd = this.lastCommandedSegments[robotId];
      if (cmd && cmd.length) return new Set(cmd);
    }
    // cleaning (zone/spot/mapping/started-elsewhere) → glow everything softly.
    const map = this.vacuumMaps[robotId];
    return map ? new Set(map.segments.map(s => s.id)) : new Set();
  }

  // Tap-to-clean: publish `MapSegmentationCapability/clean/set` for one segment on
  // a robot and record it so the glow tracks. Edit + kiosk (view refuses upstream).
  cleanVacuumSegment(robot: RobotFixture, segId: string): void {
    if (this.uiMode === 'view' || !robot.valetudoId) return;
    const ns = (this.store.mqttBridge?.valetudoNs || 'valetudo').replace(/\/+$/, '');
    const topic = `${ns}/${robot.valetudoId}/MapSegmentationCapability/clean/set`;
    this.mqttPublish(topic, cleanSegmentPayload(segId));
    this.lastCommandedSegments[robot.id] = [segId];
    this.emitConfig();
  }

  // ── Frigate ground-truth targets (Phase 5) ─────────────────────────────────
  // Subscribe to `<frigateTopic>/events` ONCE, the first time the bridge is
  // configured AND some enabled floor has a camera with a solvable ground
  // homography. Idempotent (guarded by _frigateSubscribed); the subscription
  // queues in mqttSubscribe until the bridge is up and is replayed on restart.
  // Called from _reconfigureMqtt (bridge start), the full-state load, and the
  // sidebar after a calibration edit — cheap no-op once subscribed.
  ensureFrigateSub(): void {
    if (this._frigateSubscribed) return;
    if ((this.store.mqttBridge?.mode ?? 'off') === 'off' || this.isOffline) return;
    // Any enabled-floor camera with ≥4 calibration points that actually solve?
    let ready = false;
    for (const fl of this.store.floors) {
      if (fl.disabled) continue;
      for (const cam of fl.cameras ?? []) if (this._camHomography(cam)) { ready = true; break; }
      if (ready) break;
    }
    if (!ready) return;
    const topic = (this.store.mqttBridge?.frigateTopic || 'frigate') + '/events';
    this._frigateSubscribed = true;
    this.mqttSubscribe(topic, m => this._onFrigateEvent(m.payloadString));
  }

  // Memoized ground-plane homography for a camera. Re-solves only when the
  // calibration points change (hashed). null when uncalibrated / degenerate.
  private _camHomography(cam: CameraFixture): number[] | null {
    const pts = cam.camCalib?.points;
    if (!pts || pts.length < 4) return null;
    const key = JSON.stringify(pts);
    const cached = this._camHgCache[cam.id];
    if (cached && cached.key === key) return cached.h;
    const h = solveHomography(pts);
    this._camHgCache[cam.id] = { key, h };
    return h;
  }

  // Handle one `frigate/events` payload. LIVE-path semantics: mutate camTargets +
  // feed lerp slots, NEVER emitConfig per detection (~radar cadence). All parsing
  // is try/caught so a malformed message can't break the stream.
  private _onFrigateEvent(payloadString: string): void {
    let msg: { type?: string; before?: FrigateObj; after?: FrigateObj } | null = null;
    try { msg = JSON.parse(payloadString); } catch { return; }
    if (!msg || typeof msg !== 'object') return;
    const type = msg.type;
    const obj = msg.after ?? msg.before;
    if (!obj || typeof obj !== 'object') return;
    if (obj.false_positive === true) return;
    const label = obj.label;
    if (!label || !Planner.CAM_LABELS.includes(label)) return;
    const camName = obj.camera;
    if (!camName || typeof camName !== 'string') return;

    // Match the Frigate camera name to a fixture on an enabled floor (frigateName
    // override, else slugified label). Unmatched cameras are ignored (never guessed).
    let cam: CameraFixture | null = null, floorId = '';
    for (const fl of this.store.floors) {
      if (fl.disabled) continue;
      for (const c of fl.cameras ?? []) {
        const fn = (c.frigateName && c.frigateName.trim()) || slugifyFrigateName(c.label || '');
        if (fn && fn === camName) { cam = c; floorId = fl.id; break; }
      }
      if (cam) break;
    }
    if (!cam) return;
    const h = this._camHomography(cam);
    if (!h) return;

    const eventId = typeof obj.id === 'string' ? obj.id : null;
    const prefix = `cam_${cam.id}_${label}`;

    // `end` releases the slot holding this event id (existing despawn fade).
    if (type === 'end') { if (eventId) this._releaseCamSlot(prefix, eventId); return; }
    if (type !== 'new' && type !== 'update') return;

    const box = obj.box;
    if (!Array.isArray(box) || box.length < 4 || !box.every(n => typeof n === 'number' && isFinite(n))) return;
    // Bottom-center of the box = the subject's foot-contact point on the ground
    // plane (coords are at the camera's DETECT resolution — same frame the
    // homography was calibrated against).
    const u = (box[0] + box[2]) / 2, v = box[3];
    const proj = applyHomography(h, u, v);
    if (!proj) return;

    // ── Slot assignment (max CAM_SLOTS per camera/label) ────────────────────
    const now = Date.now();
    const idxFor = (): number | null => {
      // 1) exact event-id match — keep the same slot for this tracked object.
      // 2) nearest existing slot within CAM_MATCH_MM — successor match across the
      //    event-id churn of Frigate's new/update/end lifecycle.
      // 3) first free slot.
      // 4) full + no near match → drop (leave existing tracks intact).
      let free = -1, nearest = -1, nearestD = Planner.CAM_MATCH_MM;
      for (let i = 0; i < Planner.CAM_SLOTS; i++) {
        const t = this.camTargets[`${prefix}_${i}`];
        if (!t) { if (free < 0) free = i; continue; }
        if (eventId && t.eventId === eventId) return i;
        const d = Math.hypot(t.x - proj.x, t.y - proj.y);
        if (d < nearestD) { nearestD = d; nearest = i; }
      }
      if (nearest >= 0) return nearest;
      if (free >= 0) return free;
      return null;
    };
    const slot = idxFor();
    if (slot === null) return;

    const key = `${prefix}_${slot}`;
    const idx = this._cameraIndex(cam.id);
    this.camTargets[key] = {
      key, cameraId: cam.id, label, color: cameraColor(cam, idx),
      x: proj.x, y: proj.y, floorId, eventId, updatedAt: now,
    };
    // Feed the per-key lerp slot (snap on first activation), mirroring BLE.
    let sl = this.lerpBy[key]?.[0];
    if (!sl) { sl = { cx: proj.x, cy: proj.y, tx: proj.x, ty: proj.y, vx: 0, vy: 0, active: true }; this.lerpBy[key] = [sl]; }
    else if (!sl.active) { sl.cx = proj.x; sl.cy = proj.y; sl.vx = 0; sl.vy = 0; sl.active = true; }
    sl.tx = proj.x; sl.ty = proj.y; sl.active = true;
  }

  // Release the cam slot (for a camera/label prefix) currently holding eventId.
  private _releaseCamSlot(prefix: string, eventId: string): void {
    for (let i = 0; i < Planner.CAM_SLOTS; i++) {
      const key = `${prefix}_${i}`;
      const t = this.camTargets[key];
      if (t && t.eventId === eventId) {
        delete this.camTargets[key];
        delete this.lerpBy[key];
        return;
      }
    }
  }

  // Flat index of a camera across all floors (stable per camera id) — the palette
  // index behind cameraColor so different cameras tint differently by default.
  private _cameraIndex(cameraId: string): number {
    let idx = 0;
    for (const fl of this.store.floors) for (const c of fl.cameras ?? []) {
      if (c.id === cameraId) return idx;
      idx++;
    }
    return 0;
  }

  // Runtime cam targets for rendering (2D dots + 3D rigs). Retires slots
  // unheard-from past CAM_RETIRE_MS (drops the lerp slot too — the renderer then
  // fades the rig), and returns the LERPED position so 2D and 3D agree. Cheap
  // (a handful of tracks) — safe to call each frame.
  get camPeople(): CamTarget[] {
    const now = Date.now();
    const out: CamTarget[] = [];
    for (const key of Object.keys(this.camTargets)) {
      const t = this.camTargets[key];
      if (now - t.updatedAt > Planner.CAM_RETIRE_MS) {
        delete this.camTargets[key];
        delete this.lerpBy[key];
        continue;
      }
      const sl = this.lerpBy[key]?.[0];
      out.push({ ...t, x: sl ? sl.cx : t.x, y: sl ? sl.cy : t.y });
    }
    return out;
  }

  // Recompute the normalized active alert list from the bound alert entity.
  // Pure read of `states` + weather.ts parser; [] when unconfigured / absent.
  private _recomputeWeatherAlerts(states: Record<string, HassState>): void {
    const id = this.store.weather?.alerts?.entityId;
    if (!id) { if (this.weatherAlerts.length) this.weatherAlerts = []; return; }
    this.weatherAlerts = parseWeatherAlerts(states[id] ?? null);
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
      // DC-C: pull the wide forecast (hourly + daily strips) on the same poll.
      // Null-on-failure leaves the last arrays in place (never clobbered to null).
      const fc = await fetchOpenMeteoForecast(lat, lon);
      if (fc) {
        this.forecastHourly = fc.hourly.length ? fc.hourly : null;
        this.forecastDaily = fc.daily.length ? fc.daily : null;
        this.emitConfig();
      }
    } finally {
      this._weatherFetching = false;
    }
    // Fire any rain/severe onset from the freshly-polled condition (house-wide
    // event bubbles). Idempotent — no-op when the condition didn't transition.
    this._detectWeatherEvents();
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
  effectiveState(item: { entity_id?: string | null; localState?: string; logic?: Light['logic'] }): HassState | null {
    // Logical-state light (batch DC-B): derive a synthetic on/color/flash from a
    // rule over ANY entity's raw state. Takes precedence over entity_id/localState
    // (a logic light is derived by definition). Same synthetic-envelope idiom the
    // renderer's itemState mirrors, so both views resolve identically.
    if (item.logic?.entityId) {
      const raw = this.hass?.states?.[item.logic.entityId]?.state ?? null;
      return logicLightState(item.logic, raw) as HassState;
    }
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
  toggleItem(item: { entity_id?: string | null; localState?: string; logic?: Light['logic'] }): void {
    if (this.uiMode === 'view') return;  // visualization only — no control
    // Logical-state lights are READ-ONLY computed displays — clicking one must not
    // toggle anything (its state is derived; see effectiveState). No-op here so
    // every click path (2D, 3D, kiosk) inherits the guard.
    if (item.logic?.entityId) return;
    if (item.entity_id) { this.toggleEntity(item.entity_id); return; }
    const on = item.localState === 'on' || item.localState === 'playing';
    item.localState = on ? 'off' : 'on';
    this.save();        // no-op outside edit → kiosk local toggles are session-only
    this.emitConfig();  // bumps configRev → 3D dirty keys rebuild; sidebar re-renders
  }

  // Session-only actuation by a SYNTHETIC avatar (an `ai` presence/demo rig or a
  // `roam` roamer) that walked up to an UNBOUND interactive device and "used" it.
  // Flips localState IN MEMORY (same on↔off semantics as toggleItem's unbound
  // branch; 'playing' counts as on) + emitConfig so the 2D/3D scene reacts, but
  // deliberately NEVER save(): avatar antics must not dirty the store, sync to
  // HA, or push an undo snapshot (undo/redo snapshots on real edits + save(),
  // never on emitConfig). Two HARD rules: (1) refuses BOUND items — a device
  // wired to an entity mirrors reality, so avatars only THINK about it (see the
  // status-contemplation bubble tier); (2) refuses computed logic lights
  // (read-only displays). Gated off entirely when avatarInteractions === false.
  // Runs in every UI mode (kiosk/view display avatars too) — it's harmless
  // because it never persists.
  avatarToggleItem(item: { entity_id?: string | null; localState?: string; logic?: Light['logic'] }): void {
    if (this.store.avatarInteractions === false) return;   // feature disabled in settings
    if (item.entity_id) return;                            // bound → avatars never actuate a real device
    if (item.logic?.entityId) return;                      // computed display → read-only
    const on = item.localState === 'on' || item.localState === 'playing';
    item.localState = on ? 'off' : 'on';
    this.emitConfig();  // configRev → dirty-key rebuild + sidebar re-render. NO save() — antics never persist.
  }

  // Resolve a door's lock glyph state: bound lock.* entity wins (normalized to
  // the full HA vocabulary — locked/unlocked/jammed/locking/unlocking/opening/
  // open/unavailable, else undefined); else the unbound local flag.
  doorLockState(door: { lockEntity?: string | null; lockLocalState?: 'locked' | 'unlocked' }): LockGlyphState {
    if (door.lockEntity) {
      return normalizeLockState(this.hass?.states?.[door.lockEntity]?.state);
    }
    return door.lockLocalState;
  }

  // Toggle a door's lock. Bound → lock.lock / lock.unlock (fire-and-forget).
  // Unbound → flip lockLocalState (session-only in kiosk, like toggleItem).
  // View mode refuses. Display-only doors refuse (single enforcement point —
  // covers the 2D padlock, 3D deadbolt, and sidebar-badge click paths at once,
  // in EVERY ui mode incl. kiosk/edit). Currently-locked → unlock; else → lock.
  toggleDoorLock(door: { lockEntity?: string | null; lockLocalState?: 'locked' | 'unlocked'; lockControl?: 'full' | 'display' }): void {
    if (this.uiMode === 'view' || door.lockControl === 'display') return;
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

  // ── Generic action buttons (batch DC-B) ────────────────────────────────
  // Record a press transient (drives the 2D + 3D tactile animation). Pruned to
  // a small recent window. Runtime-only — mirrors doorbellRings.
  private _pushActionPress(id: string): void {
    const now = performance.now();
    this.actionPressFx.push({ id, at: now });
    this.actionPressFx = this.actionPressFx.filter(r => now - r.at < 900);
    if (this.actionPressFx.length > 12) this.actionPressFx.splice(0, this.actionPressFx.length - 12);
  }

  // Fire an action button's configured HA service (research §2.1 dispatch table).
  // Fire-and-forget, try/catch — a bad service_data errors at call time in HA, it
  // never throws into the RAF/click path. View mode refuses (matches every
  // interactive fixture); kiosk fires (the whole point of a control kiosk — like
  // alarm/lock/robot, "no write-back" refers to Diorama's OWN store, not HA
  // services). `confirm` → a browser confirm() before firing. Unbound / no target
  // → still animate (flip localState 'on' pulse) so a standalone button reacts.
  // No save()/emitConfig — pressing mutates no persisted fixture state.
  fireAction(btn: ActionButton, skipConfirm = false): void {
    if (this.uiMode === 'view') return;
    if (btn.confirm && !skipConfirm) {
      try { if (!confirm(`Fire "${btn.label || 'action'}"?`)) return; } catch { /* no window.confirm → proceed */ }
    }
    // Per-button double-fire cooldown (~500 ms). The 700 ms synthetic-click
    // de-dupe (touch→click gotcha) only covers the 2D canvas click layer; the
    // 3D raycast, the sidebar Test button, and 2D clicks are SEPARATE paths that
    // can each dispatch the same button in quick succession. This is the single
    // choke point that makes one physical press = one service call regardless of
    // path. Set only once we're committed to firing (a cancelled confirm never
    // arms it). skipConfirm (Test-fire) still respects it — a rapid double Test
    // shouldn't double-dispatch either.
    const t = performance.now();
    if (t - (this._actionCooldownAt[btn.id] ?? -Infinity) < 500) return;
    this._actionCooldownAt[btn.id] = t;
    this._pushActionPress(btn.id);
    const kind = actionButtonKind(btn);
    const data = this._parseActionData(btn.serviceData);
    const svc = (domain: string, service: string, d?: Record<string, unknown>) => {
      if (!this.hass) return;
      try { void Promise.resolve(this.hass.callService(domain, service, d ?? {})).catch(() => { /* ignore */ }); }
      catch { /* ignore */ }
    };
    switch (kind) {
      case 'button_press':
        if (!btn.entity_id) break;
        svc(btn.entity_id.split('.')[0], 'press', { entity_id: btn.entity_id });
        break;
      case 'scene':
        if (!btn.entity_id) break;
        svc('scene', 'turn_on', { entity_id: btn.entity_id, ...data });
        break;
      case 'script':
        if (!btn.entity_id) break;
        svc('script', 'turn_on', { entity_id: btn.entity_id, ...data });
        break;
      case 'automation_trigger':
        if (!btn.entity_id) break;
        svc('automation', 'trigger', { entity_id: btn.entity_id, ...data });
        break;
      case 'toggle':
        if (!btn.entity_id) break;
        this.toggleEntity(btn.entity_id);   // domain-aware toggle + homeassistant.toggle fallback
        break;
      case 'custom':
        if (!btn.domain || !btn.service) break;
        svc(btn.domain, btn.service, { ...(btn.entity_id ? { entity_id: btn.entity_id } : {}), ...data });
        break;
    }
    // Unbound / no dispatch target → still give a standalone tactile pulse so the
    // button reads as "pressed" without any HA binding (session-only in kiosk).
    if (!btn.entity_id && kind !== 'custom') { btn.localState = 'on'; }
  }

  // Parse an ActionButton.serviceData JSON string into a flat data object.
  // Returns {} on empty/invalid (the fireAction paths tolerate that).
  private _parseActionData(raw?: string): Record<string, unknown> {
    if (!raw || !raw.trim()) return {};
    try { const o = JSON.parse(raw); return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {}; }
    catch { return {}; }
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
    for (const it of f.calendarPanels ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.thermostats ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.safetySensors ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.alertBeacons ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.robots ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.cameras ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.projectors ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.valves ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.sprinklerZones ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.flagpoles ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.plugs ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.infoCards ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.actionButtons ?? []) { it.x += dx; it.y += dy; }
    for (const z of f.presenceZones ?? []) z.points = z.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
    for (const g of f.groundAreas ?? []) {
      g.points = g.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
      if (g.path) g.path.centerline = g.path.centerline.map(p => ({ x: p.x + dx, y: p.y + dy }));
    }
    for (const pl of f.pools ?? []) pl.points = pl.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
    for (const vd of f.voidAreas ?? []) vd.points = vd.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
    // Rulers: translate free-point ends only (object-anchored ends track their
    // item, which just moved by the same delta).
    for (const rl of f.rulers ?? []) {
      if (rl.a.kind === 'point') { rl.a.x += dx; rl.a.y += dy; }
      if (rl.b.kind === 'point') { rl.b.x += dx; rl.b.y += dy; }
    }
    for (const it of f.doors ?? []) { it.x += dx; it.y += dy; }
    for (const it of f.windows ?? []) { it.x += dx; it.y += dy; }
    for (const rm of f.rooms ?? []) { rm.anchor.x += dx; rm.anchor.y += dy; }
    if (f.bg) { f.bg.x += dx; f.bg.y += dy; }
    if (f.model3d) { f.model3d.x += dx; f.model3d.y += dy; }
    if (this.store.floors.length === 1 && this.store.geo?.landmarks) {
      for (const lm of this.store.geo.landmarks) { lm.x += dx; lm.y += dy; }
    }
  }

  // Rotate the ENTIRE current floor's content by `phiDeg` degrees screen-CW
  // about the floor centre (f.w/2, f.d/2) — a one-shot DATA mutation (exactly
  // like translateFloorContent, and it MUST mirror that method's item coverage)
  // so the new orientation is permanent in both 2D and 3D with zero rendering
  // changes, and each call is ONE undo step (save() snapshots the prior JSON).
  // This is how "set a new default top" works: pick the increment, click, done.
  //
  // Conventions (locked in test-pages/plan-rotate-test.html):
  //  • Positions rotate through rotPointDeg (screen-CW). Heading/rotation fields
  //    all use the screen-CW "0 = +Y world" convention, so they get += phiDeg.
  //  • mmWave Sensor.heading is NOT touched — it lives in HA firmware numbers
  //    (number.<slug>_mount_angle), which Diorama syncs but does not own; only
  //    the sensor POSITION rotates. MotionSensor.heading IS Diorama-owned → +=.
  //  • LOCKED items rotate too (a frame change, like translateFloorContent).
  //  • Per-sensor zone/object caches are sensor-LOCAL coords → untouched.
  //  • The vacuum map calibration (world = R(posRotDeg)·S·raw + offset, where
  //    posRotDeg is a STANDARD CCW rotation) is re-derived so a projected raw
  //    point lands at its rotated image: posRotDeg −= phiDeg and the offset
  //    (a world point) rotates through rotPointDeg.
  //  • Compass/geo north bearings (° CW from true north that plan +Y faces)
  //    get −= phiDeg so the needle keeps pointing at true north as the content
  //    turns under it; single-floor geo landmarks also rotate (multi-floor
  //    leaves the shared world-frame geo alone, per the translateFloorContent
  //    precedent, bumping only the manual bearing).
  //  • After rotating, the floor rect only ever GROWS (grid-rounded) to keep the
  //    rotated bbox inside — never shrinks, so +φ then −φ can't ratchet growth.
  rotateFloorContent(phiDeg: number): void {
    if (this.uiMode !== 'edit') return;              // edit-only, like translateFloorContent's callers
    const phi = ((phiDeg % 360) + 360) % 360;
    if (phi === 0) return;
    const f = this.floor();
    const cx = f.w / 2, cy = f.d / 2;
    const rot = (it: { x: number; y: number }) => {
      const p = rotPointDeg(it.x, it.y, cx, cy, phi);
      it.x = p.x; it.y = p.y;
    };
    // Bump a screen-CW heading/rotation field (0 = +Y world) by +phi, normalized.
    const norm = (d: number) => ((d % 360) + 360) % 360;
    const bump = (it: { rotation?: number }) => { it.rotation = norm((it.rotation ?? 0) + phi); };

    for (const w of f.walls) w.points = w.points.map(p => rotPointDeg(p.x, p.y, cx, cy, phi));
    for (const it of f.furniture) { rot(it); bump(it); }
    for (const it of f.lights) { rot(it); bump(it); }   // Light.tilt (elevation) is unaffected by a yaw
    for (const it of f.switches) { rot(it); bump(it); }
    for (const it of f.sensors) rot(it);                // mmWave heading owned by firmware — position only
    for (const it of f.motionSensors) { rot(it); it.heading = norm((it.heading ?? 0) + phi); }
    for (const it of f.envSensors ?? []) rot(it);       // env chips carry no heading
    for (const it of f.bleProxies ?? []) rot(it);       // omnidirectional antenna
    for (const it of f.alarmPanels ?? []) { rot(it); bump(it); }
    for (const it of f.calendarPanels ?? []) { rot(it); bump(it); }
    for (const it of f.thermostats ?? []) { rot(it); bump(it); }
    for (const it of f.safetySensors ?? []) rot(it);    // ceiling puck, no heading
    for (const it of f.alertBeacons ?? []) rot(it);     // ceiling puck, no heading
    for (const it of f.robots ?? []) {
      rot(it);                                          // dock position
      // Vacuum map→plan calibration: keep a projected raw point on its rotated
      // image. offset is a world point → rotate it; posRotDeg is CCW → subtract.
      if (it.posOffsetX != null || it.posOffsetY != null || it.posRotDeg != null || it.posScale != null) {
        const off = rotPointDeg(it.posOffsetX ?? 0, it.posOffsetY ?? 0, cx, cy, phi);
        it.posOffsetX = off.x; it.posOffsetY = off.y;
        it.posRotDeg = norm((it.posRotDeg ?? 0) - phi);
      }
    }
    for (const it of f.cameras ?? []) {
      rot(it); bump(it);
      // Ground-plane homography correspondences: rotate the PLAN side (x,y);
      // the image-pixel side (u,v) is untouched.
      if (it.camCalib?.points) for (const pt of it.camCalib.points) { const p = rotPointDeg(pt.x, pt.y, cx, cy, phi); pt.x = p.x; pt.y = p.y; }
    }
    for (const it of f.projectors ?? []) { rot(it); bump(it); }
    for (const it of f.valves ?? []) { rot(it); bump(it); }
    for (const it of f.sprinklerZones ?? []) { rot(it); bump(it); }
    for (const it of f.flagpoles ?? []) rot(it);        // symmetric pole, no heading
    for (const it of f.plugs ?? []) { rot(it); bump(it); }
    for (const it of f.infoCards ?? []) { rot(it); bump(it); }
    for (const it of f.actionButtons ?? []) { rot(it); bump(it); }
    for (const z of f.presenceZones ?? []) z.points = z.points.map(p => rotPointDeg(p.x, p.y, cx, cy, phi));
    for (const g of f.groundAreas ?? []) {
      g.points = g.points.map(p => rotPointDeg(p.x, p.y, cx, cy, phi));
      if (g.path) { g.path.centerline = g.path.centerline.map(p => rotPointDeg(p.x, p.y, cx, cy, phi)); this.regenGroundAreaPath(g); }
    }
    for (const pl of f.pools ?? []) pl.points = pl.points.map(p => rotPointDeg(p.x, p.y, cx, cy, phi));
    for (const vd of f.voidAreas ?? []) vd.points = vd.points.map(p => rotPointDeg(p.x, p.y, cx, cy, phi));
    // Rulers: rotate free-point ends only (object ends track their item).
    for (const rl of f.rulers ?? []) {
      if (rl.a.kind === 'point') { const q = rotPointDeg(rl.a.x, rl.a.y, cx, cy, phi); rl.a.x = q.x; rl.a.y = q.y; }
      if (rl.b.kind === 'point') { const q = rotPointDeg(rl.b.x, rl.b.y, cx, cy, phi); rl.b.x = q.x; rl.b.y = q.y; }
    }
    for (const it of f.doors ?? []) { rot(it); it.rotation = norm((it.rotation ?? 0) + phi); }
    for (const it of f.windows ?? []) { rot(it); it.rotation = norm((it.rotation ?? 0) + phi); }
    for (const rm of f.rooms ?? []) { const p = rotPointDeg(rm.anchor.x, rm.anchor.y, cx, cy, phi); rm.anchor.x = p.x; rm.anchor.y = p.y; }
    if (f.bg) { rot(f.bg); f.bg.rotation = norm((f.bg.rotation ?? 0) + phi); }
    if (f.model3d) { rot(f.model3d); f.model3d.rotation = norm((f.model3d.rotation ?? 0) + phi); }

    // North bearings track true north through the turn (−= phi). geo landmarks
    // are a shared world-frame concept: rotate them only on a single-floor home
    // (translateFloorContent precedent); multi-floor bumps the bearing only.
    if (this.store.geo) {
      if (this.store.geo.northDeg != null) this.store.geo.northDeg = norm(this.store.geo.northDeg - phi);
      if (this.store.floors.length === 1 && this.store.geo.landmarks) {
        for (const lm of this.store.geo.landmarks) { const p = rotPointDeg(lm.x, lm.y, cx, cy, phi); lm.x = p.x; lm.y = p.y; }
      }
    }
    if (this.store.compass?.manualNorthDeg != null) {
      this.store.compass.manualNorthDeg = norm(this.store.compass.manualNorthDeg - phi);
    }

    // Grow the floor rect (never shrink) so the rotated content stays inside,
    // translating via the same delta math the floor-edge drag uses. When the
    // rotation doesn't overflow (the common case for a well-centred plan) this
    // is a no-op, so +φ then −φ round-trips positions exactly.
    const bbox = floorContentBbox(f);
    if (bbox) {
      const m = GRID_MM;
      const tx = Math.max(0, m - bbox.minX);
      const ty = Math.max(0, m - bbox.minY);
      if (tx > 0 || ty > 0) this.translateFloorContent(tx, ty);
      const b2 = floorContentBbox(f) ?? bbox;
      const needW = Math.ceil((b2.maxX + m) / GRID_MM) * GRID_MM;
      const needD = Math.ceil((b2.maxY + m) / GRID_MM) * GRID_MM;
      if (needW > f.w) f.w = needW;
      if (needD > f.d) f.d = needD;
    }

    this.save();          // one undo step; configRev bump drives every 3D dirty key
    this.emitConfig();
  }

  // ── Floor management ────────────────────────────────────────────────────
  switchFloor(id: string): void {
    this.store.currentFloorId = id;
    this.store.activeSensorId = null;
    this.activeMotionId = null;
    this.activeRoamerId = null;
    this.activeEnvId = null;
    this.activeBleId = null;
    this.activeAlarmId = null;
    this.activeCalendarId = null;
    this.activeThermoId = null;
    this.activeSafetyId = null;
    this.activeRobotId = null;
    this.activeCameraId = null;
    this.activeProjectorId = null;
    this.activeValveId = null;
    this.activeSprinklerId = null;
    this.activeFlagpoleId = null;
    this.activePlugId = null;
    this.activeInfoId = null;
    this.activeActionId = null;
    this.activePZoneId = null;
    this.drawingPresenceZone = null;
    this.activeGroundAreaId = null;
    this.drawingGroundArea = null;
    this.activePoolId = null;
    this.drawingPath = null;
    this.drawingPoolArea = null;
    this.activeVoidAreaId = null;
    this.drawingVoidArea = null;
    this.activeRulerId = null;
    this.drawingRuler = null;
    this.pickingDimWalls = false;
    this.robotStates = {};   // positions are per-floor; recomputed on the new floor
    this.activeFurnitureId = null;
    // RETAIN pan/zoom across a same-config floor switch. Stacked stories share
    // one world-mm frame (the ghost-floor + 2D peek underlay both rely on
    // identical world coords landing at identical positions) — floors differ
    // only in rect SIZE — so the viewport stays meaningful and throwing it away
    // used to yank the user back to fit-to-canvas on every story change.
    // `viewCenter === null` (never panned) stays null: the fit-to-canvas default
    // self-adapts to the new rect. Safety guard: a centre far outside the NEW
    // floor's rect (a wildly different plan) falls back to the fit so the user
    // is never left staring at blank canvas. A different CONFIG genuinely is a
    // different plan — those paths (_applyLoadedStore) still reset.
    const nf = this.store.floors.find(x => x.id === id);
    if (this.viewCenter && (!nf || !viewCenterFitsFloor(nf.w, nf.d, this.viewCenter.x, this.viewCenter.y))) {
      this.viewCenter = null;
      this.zoom = 1;
    }
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

  // Cycle a floor's tri-state visibility: show → peek → hide → show.
  //  • show : neither flag (enabled, but not drawn when viewing other floors)
  //  • peek : peek2d=true, disabled cleared (enabled + 2D onion-skin underlay)
  //  • hide : disabled=true, peek2d cleared (today's fully-disabled behavior)
  // Invariant: peek2d and disabled are never both set. One undo step.
  cycleFloorVisibility(id: string): void {
    const f = this.store.floors.find(x => x.id === id);
    if (!f) return;
    if (f.disabled) {                 // hide → show
      f.disabled = undefined; f.peek2d = undefined;
    } else if (f.peek2d) {            // peek → hide
      f.peek2d = undefined; f.disabled = true;
    } else {                          // show → peek
      f.peek2d = true; f.disabled = undefined;
    }
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
