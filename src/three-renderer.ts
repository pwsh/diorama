import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import type {
  Floor, Sensor, Light, SwitchFixture, MotionSensor, Vec2, HassState,
  Scene3D, ScenePreset, FloorTexKind, Model3D, Furniture, AvatarKind, WeatherEffectKey,
} from './types.js';
import {
  lightHeight, lightRadius, lightIntensity, lightIconKind, lightRotation, lightLength,
  switchHeight, switchRotation, switchSize,
  motionColor, motionIntensity, hexToInt, bleProxyHeight, BLE_PROXY_DEFAULTS,
  furnitureDef, resolveFurnitureDef, furnitureColor, furnitureCat, doorOpenDeltaDeg,
  alarmHeight, alarmStateColor, ALARM_DEFAULTS, ALARM_PLATE_DEPTH_MM,
  safetyColor, SAFETY_DEFAULTS,
  robotColor, robotLedColor, ROBOT_DEFAULTS,
  ENV_KINDS, envKindOf, envColor, envValueText, envHeight, envScale,
} from './geometry.js';
import type { Door, Window as WindowType, EnvSensor, BleProxy, AlarmPanel, SafetySensor, RobotFixture, ObjectRecipe, ActivityKind } from './types.js';

// The subset of Planner.RobotState the renderer reads (structural — keeps the
// renderer decoupled from the planner). Positions are plan-frame world mm.
export interface RobotRenderState {
  x: number; y: number; heading: number; phase: number; activity: string; led: string;
}

// Persistent moving-robot rig (like a humanoid: built once, mutated per frame).
interface RobotRig {
  group: THREE.Group;
  kind: 'vacuum' | 'mower';
  ledMat: THREE.MeshToonMaterial;   // status LED — recolored per frame
  spin: THREE.Object3D;             // sub-part that spins while working
  blob: THREE.Mesh;
}
import { wallCutsForSegment, WINDOW_DEFAULTS, closedWallLoops, wallKind, WALL_KINDS, furnitureLocalToWorld, furnitureWorldToLocal, pointInPolygon as pip, centroid, loopContaining, resolveRoomForPoint, roomLabel, intersectLoopWithRect, polygonArea } from './geometry.js';
import { visibilityToFogDensity } from './weather.js';

// All effect-group members ON — the fallback when a stale caller sends a
// WeatherFxState without the W3 `effects` map (preserves legacy W2 behavior).
const WEATHER_ALL_EFFECTS: Record<WeatherEffectKey, boolean> = {
  precip: true, fog: true, lightning: true, wind: true, clouds: true,
  sunPosition: true, frost: true, puddles: true, precipForecast: true,
};

export interface ZoneWorld { vertices: Vec2[]; color: number; occupied: boolean; }
export interface HaloWorld { x: number; y: number; radius: number; occupied: boolean; }
// GPS device pin / landmark pin inputs for updateGpsPins (Feature G, phase G2).
// Pre-shaped by three-view (label + color already resolved) so the renderer
// stays free of geo-math imports. x/y are world mm on the current floor's plan.
export interface GpsPinWorld { x: number; y: number; label: string; color: string; stale: boolean; }
export interface GpsLandmarkWorld { x: number; y: number; name: string; }

// Outdoor weather effects (Feature W, phase W2). Pre-shaped by three-view from
// planner.weatherNow so the renderer stays free of weather-source logic.
//   condition          — the HA condition string driving which cloud(s) build.
//   intensity01        — 0..1 (weather.ts conditionIntensity); scales particle
//                        count + fall speed + flash energy.
//   windKmh            — wind speed; adds a horizontal drift to any precip and
//                        drives the standalone windy dust stream.
//   windBearingPlanRad — plan-frame angle (radians) the wind blows TOWARD, or
//                        null when the source gives no bearing (drift falls back
//                        to a gentle default). three-view maps the meteorological
//                        FROM-bearing into the plan frame (geo θ when calibrated).
//   isDay              — gates flash brightness (a daytime flash is subtler).
//   effects            — resolved per-effect on/off (W3). three-view has ALREADY
//                        folded the master effects3d kill-switch + the weatherFx
//                        layer into every effect-GROUP member; `sunPosition`
//                        (a lighting behavior, not a group member) reflects only
//                        its own key. A stale caller omits this → treated as all
//                        group members ON (legacy W2 behavior).
//   cloudCoverage …    — extended attributes (W3), all optional per provider;
//                        every visual no-ops when its field is null/undefined.
//   sunAzimuthDeg      — PLAN-frame azimuth in degrees (three-view already
//                        rotated the raw compass azimuth through the geo θ, like
//                        windBearingPlanRad). 0 = plan +Y, 90 = plan +X. null
//                        when sun.sun exposes no azimuth.
//   sunElevationDeg    — sun elevation (deg); the true-sun-position effect only
//                        acts when > 0. null when absent.
export interface WeatherFxState {
  condition: string;
  intensity01: number;
  windKmh: number;
  windBearingPlanRad: number | null;
  isDay: boolean;
  effects?: Record<WeatherEffectKey, boolean>;
  cloudCoverage?: number | null;
  visibilityKm?: number | null;
  windGustKmh?: number | null;
  apparentC?: number | null;
  rainSoon?: boolean;
  sunAzimuthDeg?: number | null;
  sunElevationDeg?: number | null;
}

// One precipitation / dust point cloud (W2). `pos` aliases the geometry's
// position attribute array (mutated in place every frame — no realloc). Fall +
// drift + optional sinusoidal wobble recycle each particle inside a fixed
// spawn box × a 0..BAND_TOP mm vertical band, so counts + draw calls stay
// constant for the cloud's whole life.
interface WeatherCloud {
  kind: 'rain' | 'snow' | 'hail' | 'dust';
  points: THREE.Points;
  pos: Float32Array;          // xyz triples (scene coords)
  phase: Float32Array;        // per-particle drift phase (snow/dust wobble)
  count: number;
  fall: number;               // downward speed, mm/s (0 for dust)
  driftX: number; driftZ: number;  // wind drift, mm/s (scene frame)
  wobble: number;             // lateral sinusoid amplitude, mm/s (snow/dust)
  minX: number; minZ: number; sizeX: number; sizeZ: number;  // spawn box
}
export interface TargetWorld {
  key: string; x: number; y: number; color: number;
  // Optional (additive): the raw target sits near the sensor's coverage edge
  // (range fringe or fov limit). Used by the despawn logic — a target that
  // vanishes while fast-moving at the edge dropped out of coverage (walked
  // out of frame → FAST scale-out); one that vanishes mid-coverage more likely
  // sat still and stopped reflecting (→ slow 10 s opacity fade).
  edge?: boolean;
  // Optional (additive): this is a synthetic AI avatar (from a presence sensor
  // with `avatar` on), not a radar target. The renderer's AI controller owns a
  // virtual raw position that it rewrites into x/y each frame; the anchor passed
  // in is the sensor location. See _advanceAi.
  ai?: boolean;
  // Optional (additive): the avatar rig variant to render this target with.
  // 'random' (or an unknown value) resolves per-target to a concrete kind via a
  // stable hash of `key`; undefined / 'adult' → the classic adult rig. See
  // resolveAvatar. A stale renderer chunk simply ignores this and builds adults.
  // LEGACY single-pick — superseded by `avatars` but still honored.
  avatar?: AvatarKind | 'random';
  // Optional (additive): a POOL of allowed rig variants; each target stably
  // hash-picks one via djb2(key) mod pool length. Takes precedence over the
  // legacy `avatar` when non-empty.
  avatars?: AvatarKind[];
  // Optional (additive): this is a BLE-trilaterated person (real device, not a
  // radar target). Driven by the AI controller in GOAL mode: x/y is the latest
  // solve; the controller A*-walks the rig there at human speed and idles when
  // close. No random wander, no room confinement (real movement). See _advanceAi.
  ble?: boolean;
  // Optional (additive): identity-fusion result (phase B3). Present when a BLE
  // person has been fused onto THIS radar target OR when this IS an identified
  // BLE person's own rig. The rig adopts `avatarKind` (else keeps its own pool
  // pick) and `color`, and — when `identified` — floats a name label. A stale
  // renderer chunk ignores this field entirely (no label, no reskin).
  person?: {
    name: string;
    color: string;              // hex tint
    avatarKind?: AvatarKind;
    isPet?: boolean;
    identified: boolean;        // gates the name label (unknown devices = false)
  };
}

// Per-frame context for the Sims-style activity system. Built cheaply every
// tick in three-view._tickOnce and passed to updateTargets. Optional so a
// stale renderer chunk (older app.js pairing) still animates walking / sitting
// — a missing ctx is treated as empty entityOn/roomNames + a 'day' bucket.
export interface ActivityContext {
  entityOn: Record<string, boolean>;   // furnitureId → bound HA entity is on/playing
  roomNames: Record<string, string>;   // roomId → name
  timeBucket: import('./time-of-day.js').TimeBucket;
  // OPTIONAL (additive — a stale renderer chunk paired with fresh app.js must
  // keep working; see the mixed-version gotcha in CLAUDE.md). Both feed thought
  // bubbles only.
  // Current weather for weather-flavored idle chatter (condition + temp + a
  // best-effort tomorrow forecast for anticipation glyphs). Null when no source.
  weather?: { condition: string; tempC: number | null; forecastCondition?: string | null } | null;
  // Recently toggled interactive fixtures (lights/switches/TVs/fireplaces) —
  // x/y in WORLD mm, ageS since the transition. Drives the top-priority
  // "someone just flipped this near me" bubble tier. three-view maintains the
  // rolling list (prev-on map + 45 s / 8-entry cap).
  recentTriggers?: { kind: 'light_on' | 'light_off' | 'fireplace' | 'tv'; x: number; y: number; ageS: number }[];
  // OPTIONAL — appliance door-sensor states: furnitureId → the bound door
  // binary_sensor (Furniture.doorEntity) is 'on' (open). Drives the per-frame
  // appliance-door blend for BOUND fridges (case a). Absent → treated as closed.
  doorSensorOpen?: Record<string, boolean>;
}

// A seat a humanoid can settle onto (scene coords). Collected from sittable
// furniture (any kind whose def has `seat`) during updateFloor. roomId /
// hostActivity tag the seat for later contextual-activity resolution.
interface SitSpot {
  // Seating v2: a stable per-spot id (`${furnitureId}:${i}`) so a rig can hold a
  // CLAIM on one spot across frames + rebuilds (see the claim map in
  // updateTargets). Wide pieces register several spots (multi-seat sofas / beds
  // register one per usable cushion run), each independently claimable so two
  // avatars never settle onto the same cushion.
  id: string;
  x: number; z: number; seatY: number; facing: number; r: number;
  // Front-only entry (seating v2): `frontNx/frontNz` is the scene-XZ unit vector
  // pointing OUT the functional front of the seat (where a person approaches
  // from); `approachX/approachZ` is a staging point ~350 mm in front of the seat
  // edge. Capture is gated to the front halfspace and the sit ease routes the
  // root through the approach point so it never blends THROUGH the backrest.
  frontNx: number; frontNz: number;
  approachX: number; approachZ: number;
  roomId?: string | null;         // named room the seat sits in (live loop resolve)
  soft?: boolean;                 // soft lounge piece (sofa/chaise/ottoman/bed) —
                                  // quadruped pets curl up on these instead of
                                  // taking the upright haunches-sit pose.
  hostActivity?: ActivityKind;    // the seat piece's own activity, if any
  hostTopY?: number;              // world-Y of the eat/work host's tabletop
                                  // (def.ht + host elevation) — drives seated
                                  // arm IK so hands rest ON the surface
  host?: { x: number; y: number; w: number; h: number; rotation?: number };
                                  // the ADJACENT eat/work host's world footprint
                                  // — lets the seated root clamp keep the torso
                                  // outside the slab even for pre-constraint /
                                  // nudged-deep seats. Unset when the seat is
                                  // its own eat/work surface (clamping outside
                                  // one's own footprint would break sitting).
}

// A contextual-activity anchor collected from furniture whose def carries an
// `activity` (Sims-style behavior — dwell triggers fill in during later
// phases). Scene coords, mirroring SitSpot's frame.
interface ActivityAnchor {
  furnitureId: string;
  x: number; z: number;
  r: number;
  facing: number;
  standOff: number;     // mm from the anchor center along +facing to the stand
                        // point — clears the footprint front face + a person's
                        // width so the rig never renders INSIDE the appliance.
  kind: ActivityKind;
  roomId: string | null;
  hasEntity: boolean;   // furniture has a bound HA entity (gates entity-driven kinds)
}

// AI-avatar controller state for a synthetic presence-sensor target. Owns a
// virtual RAW position (world mm) that _advanceAi rewrites into the target's
// x/y each frame, so the whole downstream pipeline (nav / dwell / sit /
// activity / bubbles) treats it exactly like radar truth. A simple 3-state
// machine: WANDER (walking a planned path to a goal) → IDLE (holding still so
// the dwell systems can capture it) → ENGAGED (frozen while sit/activity/lie
// owns the rig) → back to WANDER when the freeze timer expires.
interface AiState {
  x: number; y: number;               // virtual raw position, world mm
  goalX: number; goalY: number;       // current wander goal (last path waypoint)
  state: 'wander' | 'idle' | 'engaged';
  timer: number;                      // seconds left in idle / engaged
  path: { x: number; y: number }[] | null;  // world-mm waypoints toward the goal
  speed: number;                      // m/s for the current leg (0.55..1.0)
  anchorX: number; anchorY: number;   // sensor position (goal search center)
  // Controller mode. 'wander' = presence-sensor AI avatar (random in-region/room
  // goals). 'goal' = BLE-trilaterated person: the ONLY goal source is the latest
  // solve passed in each frame; no random wander, no room confinement.
  mode: 'wander' | 'goal';
}

interface Humanoid {
  group: THREE.Group;
  color: number;       // tint the rig was built with (rebuilt if it changes)
  avatarKind: AvatarKind;  // resolved concrete rig variant (rebuilt if it changes)
  // Per-rig proportions (mm), captured at build time so the seat-drop / lie /
  // table-IK / gait math works for variants with non-adult skeletons (e.g. the
  // 0.6-scale child). These REPLACE the former hard-coded 870 / 1398 / 1636 /
  // 320 / 313 / 0.81 constants in updateTargets — always read them off the rig.
  hipY: number;        // hip pivot height above the root (adult 870)
  shoulderY: number;   // shoulder pivot height above the root (adult 1398)
  headTopReach: number;// head-center height above the root (adult 1636) — lie pose
  armUpper: number;    // upper-arm length (adult 320) — table IK link 1
  armLower: number;    // forearm+hand length (adult 313) — table IK link 2
  legM: number;        // hip height in metres for stride matching (adult 0.81)
  // Walk-personality multipliers (resolved from AVATAR_PERSONALITY at build).
  persBob: number; persSway: number; persCadence: number; persAmp: number;
  // Personality thought-bubble chatter: `chatterNext` counts down to the next
  // firing (25–60 s, idleOffset-seeded); while `chatterT` > 0 the resolver's
  // lowest tier returns `chatterGlyph` (held ~7.5 s so the 2.5 s hysteresis
  // commits it and it shows ~5 s before timing back out).
  chatterNext: number; chatterT: number; chatterGlyph: string | null;
  torso: THREE.Mesh;   // breathing scale
  // Two-segment limb chains: shoulder/hip pivot drives the upper segment;
  // elbow/knee pivot is a child group at the joint that drives the lower
  // segment + hand / foot.
  leftShoulder: THREE.Group;
  rightShoulder: THREE.Group;
  leftElbow: THREE.Group;
  rightElbow: THREE.Group;
  leftHip: THREE.Group;
  rightHip: THREE.Group;
  leftKnee: THREE.Group;
  rightKnee: THREE.Group;
  plumbob: THREE.Object3D;  // rotating Sims diamond above the head
  blob: THREE.Mesh;    // soft floor shadow decal; re-grounded every frame
  // ── Quadruped pets (cat/dog). `quad` switches BOTH the builder and the
  // per-frame pose branch (_applyQuadPose). The humanoid joint fields above
  // (leftHip … rightElbow) alias the four leg pivots so the shared
  // Humanoid contract holds, but only the quad branch animates them via
  // `quadLegs`; the humanoid pose math is gated off. Everything else
  // (nav/carrot/spring, facing, scale/fade, blob, outline, plumbob) is shared.
  quad?: boolean;
  quadLegs?: { hip: THREE.Group; knee: THREE.Group }[];  // FL, FR, BL, BR
  quadTail?: THREE.Group[];   // [base pivot, mid pivot] — 2-segment sway
  quadHead?: THREE.Group;     // head pivot for bob / nod / curl-down
  quadEars?: THREE.Group[];   // ear pivots for idle flicks
  phase: number;       // walk-cycle radians
  facing: number;      // body yaw derived from smoothed velocity
  amp: number;         // eased limb-swing amplitude (rad) — smooths gait starts/stops
  sit: number;         // eased sitting blend 0 (standing) .. 1 (seated)
  groundY: number;     // eased terrain height under the figure (stairs/landings)
  dwell: number;       // seconds of near-zero speed (sitting trigger)
  sitSpot: SitSpot | null;  // anchor seat; retained while easing back up
  // Seating v2 CLAIM: the stable id of the seat this rig owns (mirrors
  // sitSpot.id). Persists across furniture rebuilds — sitSpot is re-resolved
  // from the live _sitSpots by this id each frame, and the per-frame claim map
  // is rebuilt from every live rig's sitSpotId so a despawned rig can't leak a
  // claim. Cleared the moment the rig fully stands up.
  sitSpotId: string | null;
  // Contextual-activity state (Sims solo activities). Mutually exclusive with
  // sitting: an anchor is only acquired while sit ≈ 0.
  activity: ActivityKind | null;       // engaged activity (drives poses + privacy)
  activityAnchor: ActivityAnchor | null;  // retained while easing back out (act > 0.05)
  activityDwell: number;               // reserved; the dwell trigger reuses `dwell`
  act: number;         // eased 0..1 activity-pose blend (mirrors `sit`)
  privacy: number;     // eased 0..1 privacy-blur blend (shower/bathe/toilet)
  blurSprite: THREE.Sprite | null;     // lazy censor sprite shown above ~0.5 privacy
  // Thought bubble (Phase 6): a context/time-aware glyph cloud above the head.
  // `bubbleWant` tracks the raw per-frame resolution; `bubbleDwell` accumulates
  // while it stays equal; `bubbleKind` commits (and rebuilds the sprite) only
  // after 2.5 s of stability so the canvas is (re)painted rarely.
  bubble: THREE.Sprite | null;
  bubbleKind: string | null;
  bubbleWant: string | null;
  bubbleDwell: number;
  // Context-pool bubble state: the contextual tiers (seated-evening, kitchen,
  // bed) now pick a glyph at RANDOM from a weighted pool rather than mapping to
  // one fixed glyph. To avoid re-rolling every frame (which would prevent the
  // 2.5 s hysteresis from ever committing), the pick is made ONCE when the tier
  // engages and held while the tier holds; `ctxBubbleTier` records which tier's
  // pick `ctxBubbleGlyph` currently is, so a tier change re-rolls and anything
  // else (walking away, activity engaging) clears it.
  ctxBubbleTier: string | null;
  ctxBubbleGlyph: string | null;
  // Name label (phase B3): a camera-facing sprite above the plumbob showing the
  // fused / identified person's name + a colored underline. Persistent-rig
  // sprite — its CanvasTexture is freed in _disposeHumanoid (like bubble), NOT
  // by a group clear. `nameText` / `nameColor` cache what the sprite currently
  // renders so the canvas is only repainted when the name/color changes.
  nameSprite: THREE.Sprite | null;
  nameText: string | null;
  nameColor: string | null;
  scale: number;       // eased spawn/despawn scale (0..1)
  idleOffset: number;  // per-rig phase offset so idle sway / breathing desync
  vx: number;          // smoothed NAV velocity in 3D coords (mm/s) — drives gait/facing
  vz: number;
  lastX: number;       // previous NAV position (scene coords) for the vx/vz delta
  lastZ: number;
  lastUpdate: number;  // performance.now() / 1000, last seen
  initialized: boolean;
  // ── Collision-aware navigation (renderer-internal). The rig renders at the
  // nav position while walking (steered around furniture/walls); all TRIGGER
  // logic (sit/activity/dwell/bubbles) keeps reading the RAW radar position.
  navX: number;        // rendered walk position, scene coords (like p.x/p.z)
  navZ: number;
  // Carrot-chaser smoothing: `carrot*` is a point that slides ALONG the route
  // polyline by arc-length at the seek speed (turning corners exactly on the
  // line, never popping). nav then chases the carrot with a critically damped
  // spring (`nvx`/`nvz` = spring velocity, same math as Planner.stepLerp) so
  // rendered motion — and the gait/facing derived from it — stays
  // velocity-continuous through waypoint transitions.
  carrotX: number;
  carrotZ: number;
  nvx: number;
  nvz: number;
  rawVx: number;       // smoothed RAW-target velocity (mm/s) — drives triggers
  rawVz: number;
  rawLastX: number;    // previous RAW target position (scene coords)
  rawLastZ: number;
  path: { x: number; z: number }[] | null;  // scene-coord waypoints, walk order
  pathRev: number;     // _nav.rev the cached path was built against (-1 = none)
  goalCell: number;    // grid index the cached path targets (-1 = none)
  // Genuinely-unreachable-goal handling: `stuckT` accumulates seconds the goal
  // region differs from the rig's region (radar sees the person through a wall
  // into a room nav can't reach). Past a threshold the rig fades out fast and
  // respawns snapped into the goal region (`respawnPhase` 1 = fading out).
  stuckT: number;
  respawnPhase: number;
  // Lay-in-bed pose (Bed feature): eased 0 (upright) .. 1 (lying flat). `lieBedId`
  // is the bed footprint currently laid in (retained while easing back up).
  lie: number;
  lieBedId: string | null;
  // Despawn bookkeeping (edge-aware): `lastEdge`/`lastRawSpeed` snapshot the last
  // seen frame; `despawnMode` is decided once when the target first goes missing
  // ('fast' scale-out for a fast edge exit, 'slow' 10 s opacity fade otherwise).
  lastEdge: boolean;
  lastRawSpeed: number;
  despawnMode: 'fast' | 'slow' | null;
  fadeAlpha: number;   // slow-despawn opacity multiplier (1 = fully opaque)
  // Per-rig CLONE of the shared outline material so a slow opacity fade can drop
  // this rig's outline alpha without touching every other rig's shells. Disposed
  // in _disposeHumanoid (guarded: never the shared _outlineMaterial).
  outlineMat: THREE.MeshBasicMaterial;
  // ── Idle fidgets. Overlays that blend in only while the rig stands still
  // (idleBlend eases 0→1 on a standing-idle gate). The ambient look-around scan
  // + weight-shift sway are always on while idle; `fidgetKind` is a one-shot
  // pose (stretch / phone) chosen by the picker every 8-20 s; `waveT` runs a
  // one-shot greeting wave over the first second of the rig's life. `fidgetLog`
  // is instrumentation only (test harness reads it).
  idleBlend: number;
  fidgetKind: string | null;
  fidgetT: number;       // elapsed in the current one-shot fidget
  fidgetDur: number;     // its total duration
  fidgetNext: number;    // seconds until the next pick (counts down while idle)
  scanState: number;     // look-around held-swing sub-behavior: 0 idle, 1 swinging
  scanT: number;
  scanNext: number;
  scanDir: number;
  waveT: number;         // greeting-wave elapsed (>= 1 = done)
  fidgetLog: string[];
}

type StateProvider = (id: string) => HassState | null;

// Effective state for an interactive item via a StateProvider closure. Mirrors
// Planner.effectiveState so localState flows through the SAME provider the
// three-view (and the test harness) already passes: bound → the live entity;
// unbound but with a localState → a synthetic envelope; else null. Keeping the
// resolution renderer-side (rather than teaching every builder about localState)
// means only the per-item read changes.
function itemState(item: { entity_id?: string | null; localState?: string },
                   stateOf: StateProvider): HassState | null {
  if (item.entity_id) return stateOf(item.entity_id);
  if (item.localState) return { state: item.localState, attributes: {}, entity_id: '' } as HassState;
  return null;
}

// Shared empty entity map for the stale-chunk fallback (no per-frame alloc).
const EMPTY_ENTITY_ON: Record<string, boolean> = {};

// Concrete avatar rig variants, in a fixed order — the 'random' resolver hashes
// a target key into this list so a given person keeps their look for life.
const AVATAR_KINDS: readonly AvatarKind[] = [
  'adult', 'child', 'robot', 'alien', 'professional',
  'hacker', 'movie_star', 'ninja', 'cyborg', 'ninja_cyborg', 'athlete',
  'teddy_bear', 'cartoon_mouse', 'cartoon_dog', 'cartoon_duck',
  'cowboy', 'magician', 'farmer', 'tech_expert', 'supermodel',
  'wise_oracle', 'astronaut',
];
// Quadruped pet rigs — valid, explicitly-selectable avatar kinds, but kept OUT
// of AVATAR_KINDS so the bare-'random' human fallback never surprises an
// unidentified person with a cat/dog. A user opting cat/dog into a sensor pool
// (avatarKinds) still works — resolveAvatar validates the pool against the SET.
const PET_KINDS: readonly AvatarKind[] = ['cat', 'dog'];
const PET_KIND_SET: ReadonlySet<string> = new Set(PET_KINDS);
const AVATAR_KIND_SET: ReadonlySet<string> = new Set([...AVATAR_KINDS, ...PET_KINDS]);

// ── Light per-kind walk personalities. Multipliers applied in updateTargets
// where bob / roll-sway / cadence / swing-amp are computed (walking only —
// bob/sway already scale by ampNorm so they vanish when idle). Absent = 1.
interface AvatarPersonality { bobMul?: number; swayMul?: number; cadenceMul?: number; ampMul?: number; }
const AVATAR_PERSONALITY: Partial<Record<AvatarKind, AvatarPersonality>> = {
  child:        { bobMul: 1.25 },
  cartoon_duck: { swayMul: 1.7, cadenceMul: 1.15 },   // waddle
  teddy_bear:   { bobMul: 1.3, cadenceMul: 0.85 },
  cartoon_mouse:{ cadenceMul: 1.25, bobMul: 1.2 },
  cartoon_dog:  { cadenceMul: 1.1 },
  supermodel:   { swayMul: 1.35, ampMul: 1.1 },       // strut
  wise_oracle:  { cadenceMul: 0.8, swayMul: 0.6 },
  astronaut:    { bobMul: 1.5, cadenceMul: 0.75 },    // moon-bounce
};

// Per-kind personality thought-bubble glyph pools (lowest-priority bubble
// tier — see _resolveBubbleKind). Fired periodically per rig, incl. while
// walking; a kind absent here would fall back to adult's 💭.
const AVATAR_BUBBLES: Partial<Record<AvatarKind, string[]>> = {
  adult: ['💭'], child: ['🎈', '🍭'], robot: ['⚙️', '🔋'], alien: ['🛸', '❓'],
  professional: ['📊', '☕'], hacker: ['💻', '🔓'], movie_star: ['🎬', '🌟'],
  ninja: ['🥷', '💨'], cyborg: ['🔧', '⚡'], ninja_cyborg: ['⚔️'],
  athlete: ['🏆', '💪'], teddy_bear: ['🍯', '🤗'], cartoon_mouse: ['🧀'],
  cartoon_dog: ['🦴', '🎾'], cartoon_duck: ['💦', '🐟'], cowboy: ['🤠', '🐴'],
  magician: ['🎩', '✨', '🐇'], farmer: ['🌽', '🚜'], tech_expert: ['💡', '🔌'],
  supermodel: ['📸', '💅'], wise_oracle: ['🔮', '📜'], astronaut: ['🚀', '⭐'],
};

// Idle-fidget one-shots (picked every 8-20 s while a rig stands idle; see
// updateTargets). Each composes from existing hip/knee/shoulder/elbow channels
// + root pitch/roll — no new joints. Durations are the base hold (s); the
// picker adds up to 0.5 s of jitter. `cross_arms` holds longest.
const IDLE_FIDGETS = [
  'stretch', 'phone', 'yawn', 'scratch_head', 'check_watch',
  'cross_arms', 'foot_tap', 'glance',
] as const;
const IDLE_FIDGET_DUR: Record<string, number> = {
  stretch: 2.0, phone: 2.5, yawn: 1.9, scratch_head: 2.3,
  check_watch: 2.2, cross_arms: 3.6, foot_tap: 2.8, glance: 1.7,
};

// Context thought-bubble POOLS (Phase 6 refresh + weather/social expansion).
// The contextual tiers used to map each context to ONE fixed glyph — a seated
// person in the evening was *always* thinking about a book. They now pick at
// random from a weighted pool (repeats bias the odds) once per engagement, held
// stable by the resolver so the 2.5 s hysteresis still commits. Every glyph
// here is a plain emoji that renders through the same canvas-sprite pipeline as
// the role / chatter bubbles (verified in avatar-bubble.html), and its per-rig
// CanvasTexture is freed in _disposeHumanoid — no new shared resources.
// Weather is now plumbed through ActivityContext (three-view builds it from
// p.weatherNow), so the idle roll below folds weather + forecast anticipation
// glyphs in — see weatherBubblePool.
const BUBBLE_POOL_SEATED_EVE = ['📖', '📱', '🎵', '📺', '🍪', '💤', '💭', '🎧', '📻', '🍷', '🎮'];
const BUBBLE_POOL_KITCHEN_MORNING = ['☕', '🥞', '🍳', '🧇', '🥐', '🍊', '🍳'];
const BUBBLE_POOL_KITCHEN_NIGHT = ['🍪', '🍕', '🧀', '🍫', '🍿', '🍦'];
const BUBBLE_POOL_BED = ['📱', '💤', '💭', '⭐', '🛌', '🧸', '🌜'];

// Recent-trigger tier pools (someone just flipped a fixture near the rig). Keyed
// by the trigger kind three-view records; repeats bias the odds.
const BUBBLE_POOL_TRIGGER: Record<string, string[]> = {
  light_on: ['💡', '💡', '✨', '😲'],
  light_off: ['🌙'],
  fireplace: ['🔥', '🔥', '😎', '🕯️'],
  tv: ['📺', '🍿'],
};

// General idle-chatter pool (mixed into the personality roll so a walking /
// standing rig isn't limited to its 2-glyph kind flavor).
const BUBBLE_POOL_GENERAL = ['🍔', '☕', '📺', '📖', '🎵', '💻', '🎮', '💼', '✈️', '🛋️', '😴', '💰', '👀', '🐾', '🌱', '🎨', '🛒', '🎉', '🍳', '🎲', '🎸', '🏋️'];

// Social pool — mixed in when the rig is facing a nearby peer. A noticed pet
// swaps to the pet variant.
const BUBBLE_POOL_SOCIAL = ['👋', '💬', '😊', '🤔', '😄', '👀', '🙋', '😂'];
const BUBBLE_POOL_SOCIAL_PET = ['🐾', '😊', '😄'];

// Map the current weather (+ tomorrow's forecast) into a small idle-chatter
// pool. Pure — folded into the composite idle roll when ctx.weather is set.
// Forecast anticipation: rain-ish tomorrow while dry now → umbrellas; snow-ish
// tomorrow while not snowing now → a snowman.
function weatherBubblePool(
  w: { condition: string; tempC: number | null; forecastCondition?: string | null },
): string[] {
  const out: string[] = [];
  switch (w.condition) {
    case 'rainy': case 'pouring': out.push('🌧️', '☔'); break;
    case 'lightning': case 'lightning-rainy': out.push('⛈️', '⚡'); break;
    case 'snowy': case 'snowy-rainy': out.push('❄️', '⛄'); break;
    case 'fog': out.push('🌫️'); break;
    case 'windy': case 'windy-variant': out.push('💨'); break;
    case 'sunny': out.push('☀️', '😎'); break;
    case 'clear-night': out.push('🌜', '⭐'); break;
    case 'cloudy': case 'partlycloudy': out.push('⛅'); break;
  }
  if (w.tempC != null && w.tempC >= 30) out.push('🥵');
  if (w.tempC != null && w.tempC <= 0) out.push('🥶');
  const rainish = (x?: string | null) => x === 'rainy' || x === 'pouring' || x === 'lightning-rainy';
  const snowish = (x?: string | null) => x === 'snowy' || x === 'snowy-rainy';
  const fc = w.forecastCondition;
  if (fc && rainish(fc) && !rainish(w.condition)) out.push('☔', '☔');
  if (fc && snowish(fc) && !snowish(w.condition)) out.push('⛄');
  return out;
}

// Trouser tone for tint-legged rigs (see the pants block in _buildHumanoid).
// Bright identity tints (luma ≥ 110) keep the classic derivation — the tint
// × 0.5, same hue half brightness — which reads clearly under the toon bands.
// DARK / deeply-saturated tints (navy, dark red, …) halve into a tone nearly
// indistinguishable from the torso (the unitard look returns), so those pick a
// NEUTRAL trouser from a small palette instead: deterministically (never
// Math.random — pants must be stable across rebuilds/recolors of the same
// identity color) the entry with the maximum summed per-channel RGB distance
// from the tint, tie-broken by lowest palette index.
const TROUSER_PALETTE = [0x3b4a63 /* navy */, 0x4a4f55 /* charcoal */,
                         0x8a7a5c /* khaki */, 0x5a6b52 /* olive */];
function trouserTone(color: number): number {
  const r = (color >> 16) & 0xff, g = (color >> 8) & 0xff, b = color & 0xff;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  if (luma >= 110) {
    return (Math.round(r * 0.5) << 16) | (Math.round(g * 0.5) << 8) | Math.round(b * 0.5);
  }
  let best = TROUSER_PALETTE[0], bestD = -1;
  for (const p of TROUSER_PALETTE) {
    const d = Math.abs(((p >> 16) & 0xff) - r)
            + Math.abs(((p >> 8) & 0xff) - g)
            + Math.abs((p & 0xff) - b);
    if (d > bestD) { bestD = d; best = p; }   // strict > → lowest index wins ties
  }
  return best;
}

// djb2 hash of a string → unsigned 32-bit. Used to map a target key to a stable
// concrete avatar kind when the sensor requests 'random'.
function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

// Resolve a target's requested avatar into a concrete kind. Precedence:
//   1. `list` (avatarKinds pool) non-empty → pick from it (see below).
//   2. legacy single `want`: concrete kind passes through; 'random' (or any
//      unrecognized string, defensively) picks over ALL kinds.
//   3. nothing → 'adult'.
// Pool / 'random' picks are STABLE (djb2(key)) by default so a rebuild mid-life
// keeps the same look. Pass `rng` (e.g. Math.random) to pick RANDOMLY instead —
// used ONLY when a rig is first spawned so respawns re-roll their look
// (avatarFromPool decides eligibility). Single-element pools and concrete kinds
// are deterministic regardless of rng.
function resolveAvatar(want: AvatarKind | 'random' | undefined,
                       list: AvatarKind[] | undefined, key: string,
                       rng?: () => number): AvatarKind {
  const pick = (n: number) => rng ? (Math.floor(rng() * n) % n + n) % n : djb2(key) % n;
  if (list && list.length) {
    const valid = list.filter(k => AVATAR_KIND_SET.has(k));
    if (valid.length === 1) return valid[0];
    if (valid.length) return valid[pick(valid.length)];
  }
  if (!want) return 'adult';
  if (want !== 'random' && AVATAR_KIND_SET.has(want)) return want;
  return AVATAR_KINDS[pick(AVATAR_KINDS.length)];
}

// Whether resolveAvatar's pick for this spec is NON-deterministic (a pool of ≥2
// valid kinds, or 'random'/unknown over all kinds). Only these re-roll on a
// fresh spawn AND must NOT trigger a rebuild when the per-frame stable pick
// differs from the rig's rolled kind. A single-kind pool or a concrete kind is
// fixed — mismatches there are genuine identity changes and DO rebuild.
function avatarFromPool(want: AvatarKind | 'random' | undefined,
                        list: AvatarKind[] | undefined): boolean {
  if (list && list.length) {
    const valid = list.filter(k => AVATAR_KIND_SET.has(k));
    if (valid.length === 1) return false;
    if (valid.length) return true;
  }
  if (!want) return false;
  return want === 'random' || !AVATAR_KIND_SET.has(want);
}
// Thought-bubble geometry (Phase 6). World-mm sprite size + side nudge (Sims-
// comic style). The local Y is NOT a fixed constant — it is derived per-rig from
// each variant's actual plumbob height (`h.plumbob.position.y`, itself head-top +
// margin) so the bubble tracks child / teddy / supermodel / seated proportions
// instead of floating detached above short rigs. Adult plumbob ≈ 2002 mm →
// bubble ≈ 2462 (matching the old constant); the offsets below are added to it.
const BUBBLE_W = 620, BUBBLE_H = 580, BUBBLE_X = 180;
const BUBBLE_ABOVE_PLUMBOB = 460;   // bubble center this far above the plumbob
// Name label (phase B3) rides the same per-rig plumbob anchor, a bit lower than
// the bubble so both coexist over the head (the bubble is offset sideways).
const NAME_ABOVE_PLUMBOB = 318;
// Solo activities wired up this phase (Phase 4). watch_tv / eat_at_table /
// work_at_desk / sleep_shared are seated/contextual and land in Phase 5.
const PHASE4_ACTIVITIES: ReadonlySet<ActivityKind> = new Set<ActivityKind>([
  'shower', 'bathe', 'toilet', 'wash_hands', 'load_dishwasher',
  'make_coffee', 'forage_fridge', 'exercise',
  'browse_bookshelf', 'tend_plant',
]);
// Activities whose dwell trigger reads the bound appliance's on/off state:
// dishwasher loading / coffee brewing only look right while it's actually
// running. Other kinds don't gate on entity state.
const ENTITY_GATED_ACTIVITIES: ReadonlySet<ActivityKind> = new Set<ActivityKind>([
  'load_dishwasher', 'make_coffee',
]);

export class ThreeDRenderer {
  loaded = false;

  private _container: HTMLElement;
  private _scene: THREE.Scene | null = null;
  private _camera: THREE.PerspectiveCamera | null = null;
  private _renderer: THREE.WebGLRenderer | null = null;
  private _controls: OrbitControls | null = null;
  private _grid: THREE.GridHelper | null = null;
  private _floorGroup = new THREE.Group();
  private _doorGroup = new THREE.Group();
  private _modelGroup = new THREE.Group();
  private _zoneGroup = new THREE.Group();
  private _haloGroup = new THREE.Group();
  private _sensorGroup = new THREE.Group();
  private _motionGroup = new THREE.Group();
  private _envGroup = new THREE.Group();
  private _bleGroup = new THREE.Group();
  private _alarmGroup = new THREE.Group();
  private _safetyGroup = new THREE.Group();
  private _robotGroup = new THREE.Group();       // static robot docks (build-time, _keyRobots)
  private _robotRigGroup = new THREE.Group();    // moving robot bodies (per-frame, persistent)
  private _robotRigs: Record<string, RobotRig> = {};  // keyed by robot id
  private _lightGroup = new THREE.Group();
  private _switchGroup = new THREE.Group();   // switch fixtures (own layer, split from lights)
  private _targetGroup = new THREE.Group();
  // GPS device pins + 3D landmark pins (Feature G, phase G2). Camera-facing
  // sprites; rebuilt under _keyGps. Carries CanvasTextures → always pair
  // _disposeSpriteMaps with _clearGroup (see updateGpsPins / destroy).
  private _gpsGroup = new THREE.Group();
  // Ghost (glass-house) floors: translucent shells of every OTHER story,
  // stacked at their story heights. Cleared with _clearGroup (no sprites).
  private _ghostGroup = new THREE.Group();
  // Outdoor weather effects (W2): precip point clouds, fog ground planes, wind
  // dust, and the lightning flash light. Rebuilt under _keyWeather in three-view
  // via updateWeather; particles/flash/fog advanced per-frame in _advanceWeather
  // from _animate (zero allocation — position buffers mutated in place). Points
  // materials + their CanvasTexture maps are NOT covered by _clearGroup, so the
  // group is torn down through the dedicated _clearWeather (explicit disposal).
  private _weatherGroup = new THREE.Group();
  private _weatherClouds: WeatherCloud[] = [];
  private _weatherFogPlanes: THREE.Mesh[] = [];
  private _weatherFlash: THREE.DirectionalLight | null = null;
  private _weatherFx: WeatherFxState | null = null;
  // Fog easing: FogExp2.density glides toward `fogTarget` over ~2 s (never a
  // pop). When target 0 is reached the scene fog is nulled cleanly.
  private _fogTarget = 0;
  // Lightning scheduler (deterministic-friendly: driven from the same _animate
  // clock; Math.random only picks the next gap, like the fireplace flicker).
  private _flashCountdown = 0;   // seconds until the next strike
  private _flashAge = -1;        // seconds since the current strike (<0 = idle)
  // W3 effect state. Cloud shadows drift like precip (position mutated in
  // _advanceWeather, wrapped in a spawn box). Puddles fade in/out via a per-floor
  // opacity that SURVIVES _keyWeather rebuilds (module/instance field keyed by
  // floor id) so they linger + fade over ~10 min after rain stops. Sun target,
  // gust envelope, and storm-brewing darkening are all eased per frame.
  private _weatherCloudShadows: Array<{
    mesh: THREE.Mesh; driftX: number; driftZ: number;
    minX: number; minZ: number; sizeX: number; sizeZ: number;
  }> = [];
  private _weatherPuddles: Array<{ mesh: THREE.Mesh; baseOpacity: number }> = [];
  private _weatherIcicles: THREE.Object3D[] = [];   // frost group members (disposed via _clearGroup)
  private _cloudShadowTex: THREE.CanvasTexture | null = null;
  private _puddleTex: THREE.CanvasTexture | null = null;
  private _puddleFade: Record<string, number> = {};   // floorId → current opacity 0..1
  private _puddleFloorId = '';
  private _puddleTarget = 0;
  private _gustCountdown = 4;    // seconds until the next gust burst
  private _gustAge = -1;         // seconds into the current 1.5 s burst (<0 = idle)
  private _gustEnabled = false;  // windGust exceeds wind speed by the margin
  private _weatherSunTarget: THREE.Vector3 | null = null;  // eased true-sun-position goal
  private _stormDark = false;    // precipForecast sky darkening currently wanted
  private _stormDarkAmt = 0;     // eased 0..1 darkening amount
  private _stormBaseBg: THREE.Color | null = null;   // preset tint captured when darkening began
  private _bgTexCache: { dataUrl: string; tex: THREE.Texture } | null = null;
  private _rafId: number | null = null;
  private _fw = 8000;
  private _fd = 6000;
  private _floorId = '';   // current floor id (for per-floor weather state like puddle fade)
  // Sims cam: when on, the camera azimuth snaps to the nearest 45° after each
  // orbit gesture (an eased per-frame glide toward `_snapAzimuth`). Polar angle
  // is left wherever the user put it — only azimuth locks.
  private _simsCam = false;
  private _snapAzimuth: number | null = null;
  // Auto-follow camera: when on, `_animate` eases the camera each frame to frame
  // the active people (or the whole floor when nobody is about). Manual orbit /
  // pan suspends it until `_followPauseUntil` (refreshed 6 s past every gesture).
  private _autoFollow = false;
  private _followPauseUntil = 0;
  // Cinematic slow-orbit: when on, `_animate` advances the camera azimuth about
  // the orbit center (active-rig bbox, or auto-follow's target when it's also on)
  // for ambient visual interest. Shares the manual-orbit pause timer.
  private _cinematicOrbit = false;
  private readonly _ORBIT_RATE = 0.08;   // rad/s → full revolution ≈ 78 s
  // Global toggle for the spinning Sims plumbob diamonds above targets.
  private _plumbobs = true;
  private _lastAnimT = 0;   // performance.now()/1000 of the previous _animate frame
  private _ZONE_H = 305;  // 1 ft — low outlines that don't wall off the room
  private _OBJ_H = 900;
  private _onFixtureClick: ((info: { kind: 'light' | 'switch' | 'media' | 'alarm' | 'safety' | 'robot'; entity_id: string | null; fixtureId: string }) => void) | null = null;
  private _onFixtureDblClick: ((info: { kind: 'light' | 'switch' | 'media' | 'alarm' | 'safety' | 'robot'; entity_id: string | null; fixtureId: string }) => void) | null = null;
  private _raycaster = new THREE.Raycaster();
  // Per-target humanoid rigs, persisted across frames so we can carry
  // walk-cycle phase + smoothed body facing.
  private _humanoids: Record<string, Humanoid> = {};
  // AI-avatar controllers, keyed by target key (`ai_<motionSensorId>`). Persist
  // independently of the rig so a brief presence dropout resumes the same wander
  // when it re-acquires; dropped when the rig finally despawns or the floor
  // switches.
  private _aiState: Record<string, AiState> = {};
  // Seats collected from the current floor's sittable furniture.
  private _sitSpots: SitSpot[] = [];
  // Bound media furniture (tv / wall_tv with an entity) collected during
  // updateFloor so _raycastFixture can make them clickable like lights without
  // raycasting the entire (heavy) floor group. Each entry is the furniture
  // group carrying userData.kind === 'media'.
  private _mediaClickables: THREE.Group[] = [];
  // Contextual-activity anchors collected from the current floor's furniture.
  private _activityAnchors: ActivityAnchor[] = [];
  // Appliance-door pivots (unbound-appliance liveliness). Rebuilt in updateFloor
  // alongside the furniture; each entry drives one hinge Group toward an
  // open/closed target with an eased blend. The blend + proximity-dwell maps are
  // keyed by fixture id so they SURVIVE _keyFloor rebuilds — the pivot Object3D is
  // recreated each build, but the stored blend is re-applied immediately so the
  // door doesn't pop shut. wx/wy are the appliance's world-mm center (proximity
  // test vs raw target positions).
  private _applianceDoors: {
    fuId: string; pivot: THREE.Object3D; axis: 'x' | 'y'; openAngle: number;
    wx: number; wy: number; unbound: boolean; hasDoorSensor: boolean;
  }[] = [];
  private _applianceDoorBlend: Record<string, number> = {};
  // TVs grouped by the room they sit in — the watch_tv seated activity checks
  // whether a bound TV in the seated person's room is on. Rebuilt in updateFloor.
  private _tvsByRoom: Record<string, { furnitureId: string; hasEntity: boolean }[]> = {};
  // Beds captured in updateFloor for the two-in-bed covers effect (world coords
  // for footprint tests + scene coords + mattress-top height + def tint).
  private _beds: { id: string; x: number; y: number; w: number; h: number;
                   rotation?: number; color: number; matressTop: number;
                   cx: number; cz: number; sharedCovers: boolean }[] = [];
  // Per-bed settle accumulator (seconds) and live cover meshes. Covers are
  // transient and parented under _targetGroup so no floor rebuild is needed to
  // clear them.
  private _bedDwell: Record<string, number> = {};
  private _bedCovers: Record<string, { mesh: THREE.Mesh; grp: THREE.Group; t: number }> = {};
  // Each named room paired with the wall loop that currently contains its
  // anchor, cached in updateFloor so updateTargets can cheaply resolve which
  // room each target stands in (a pip walk per target). Rooms whose anchor
  // falls outside every loop are skipped. Reset with the other per-floor caches.
  private _roomZones: { roomId: string; loop: Vec2[] }[] = [];
  // ALL closed wall loops of the current floor (named-room or not). AI avatars
  // from simple presence sensors are hard-confined to the loop containing
  // their sensor — radar-driven targets roam wherever the radar says.
  private _wallLoops: Vec2[][] = [];
  // Bed occupancy summary produced by _updateBedCovers for NEXT frame's thought-
  // bubble resolution (one-frame lag is fine — bubble commit has 2.5 s
  // hysteresis). hiddenKeys: rigs currently hidden under the two-in-bed covers.
  // soloKeys: targets that are the sole occupant of a bed footprint.
  private _bedState: { hiddenKeys: Set<string>; soloKeys: Set<string> } =
    { hiddenKeys: new Set(), soloKeys: new Set() };
  // Wall-clock of the last updateTargets call — the bed pass derives its own dt.
  private _lastTargetsNow = 0;
  // Fan rotor groups spun in the render loop. rps ≤ 1 (100% = 1 rev/s).
  // Angle derives from the absolute clock, so rebuilds don't jump phase.
  private _fanRotors: { obj: THREE.Object3D; rps: number }[] = [];
  // Walkable terrain (stairs + landings): humanoids stand on the computed
  // surface height instead of the floor plane.
  private _terrain: { x: number; y: number; w: number; h: number; rotation?: number;
                      ht: number; elevation: number; kind: string }[] = [];
  // Navigation grid (world coords, mm), rebuilt by every updateFloor. cell =
  // 150 mm. `blocked` marks cells whose center is inside a furniture footprint
  // (inflated by PERSON_R) or a solid wall run (door/window openings stay
  // walkable). `rev` bumps every rebuild so cached per-humanoid paths
  // invalidate. `blockedCount` gives a zero-obstacle fast path (skip A*).
  // `region` labels each free cell with a connected-component id (blocked cells
  // = -1). Connectivity matches A* reachability (8-connected, no corner
  // cutting), so two free cells share a region iff a path exists between them.
  // Used to keep spawn snaps / blocked-goal retargets on the SAME side of a wall
  // as the target — a counter backing a wall no longer flings the rig into the
  // next room — and to detect a genuinely-unreachable goal (stuck respawn).
  // `regionSize[id]` = free-cell count of region `id`, so a snap can prefer the
  // real open room over a tiny sliver channel (e.g. the strip between a sofa's
  // inflated footprint and the wall behind it) when both are near the query.
  private _nav: { cell: number; nx: number; ny: number;
                  blocked: Uint8Array; region: Int32Array; regionSize: number[];
                  rev: number; blockedCount: number } | null = null;
  private _navRev = 0;

  // Foreground wall-cutaway (Sims dollhouse). Tagged wall meshes — active-floor
  // walls and ghost-floor walls kept in separate lists so each builder rebuilds
  // only its own portion. Each mesh carries userData.wallCut = { mx, mz, nx, nz }
  // (segment midpoint in scene coords + horizontal perpendicular unit vector)
  // and userData.baseOpacity. `_cutaway` (set from updateFloor's scene3d) gates
  // the effect; default ON (opt-out via scene3d.wallCutaway === false).
  private _cutawayWalls: THREE.Mesh[] = [];
  private _cutawayGhostWalls: THREE.Mesh[] = [];
  private _cutaway = true;

  // Lighting rig (preset-tunable).
  private _ambient: THREE.AmbientLight | null = null;
  private _hemi: THREE.HemisphereLight | null = null;
  private _sun: THREE.DirectionalLight | null = null;
  private _preset: ScenePreset = 'night';
  // Procedural texture cache (generated once per kind).
  private _texCache: Partial<Record<FloorTexKind, THREE.Texture>> = {};

  constructor(container: HTMLElement) { this._container = container; }

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      this._init();
      this.loaded = true;
    } catch (err) {
      console.error('3D renderer failed:', err);
      this._container.innerHTML =
        '<div style="padding:20px;color:#ef9a9a;font-size:13px;">' +
        '3D view unavailable.<br><pre style="font-size:11px;color:#aaa">' +
        ((err as Error).message || String(err)) + '</pre></div>';
    }
  }

  private _init(): void {
    const w = this._container.clientWidth || 600;
    const h = this._container.clientHeight || 400;
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x0d0d1a);
    // No fog: previously set to 12000–36000 mm range, which dimmed walls /
    // furniture / lights when the user zoomed out. Background tint is enough.
    this._camera = new THREE.PerspectiveCamera(50, w / h, 10, 60000);
    this._camera.position.set(0, 9000, -6000);
    this._camera.lookAt(0, 0, 0);
    this._renderer = new THREE.WebGLRenderer({ antialias: true });
    this._renderer.setSize(w, h);
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this._renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Sims-2000 rendering: every surface is a MeshToonMaterial with a shared
    // stepped gradient map (see _mat), lit only by the ambient/hemi/sun rig.
    // No tone mapping (toon bands want the raw curve), no PMREM environment
    // (IBL washes the bands out), and no shadow maps — soft blob-shadow
    // decals under furniture and people replace them (cheaper on tablets
    // and exactly what the original game did).
    this._renderer.toneMapping = THREE.NoToneMapping;
    this._renderer.shadowMap.enabled = false;
    this._container.appendChild(this._renderer.domElement);
    // Prevent touch from fighting page scroll on mobile.
    this._renderer.domElement.style.touchAction = 'none';
    // Keep touches out of HA frontend's reach — its drawer treats rightward
    // swipes (from the left screen edge) as "open sidebar" and would hijack
    // orbit / pan gestures. EXCEPTION: a gesture that STARTS within 24 px of the
    // window's left edge is left to bubble so an intentional edge-swipe can
    // still open the HA drawer. `_touchStopping` latches per-gesture at
    // touchstart (true only when every touch point clears the edge).
    {
      const dom = this._renderer.domElement;
      let stopping = false;
      dom.addEventListener('touchstart', e => {
        stopping = Array.from(e.touches).every(t => t.clientX > 24);
        if (stopping) e.stopPropagation();
      });
      dom.addEventListener('touchmove', e => { if (stopping) e.stopPropagation(); });
      dom.addEventListener('touchend', e => {
        if (stopping) e.stopPropagation();
        if (e.touches.length === 0) stopping = false;
      });
      dom.addEventListener('touchcancel', e => {
        if (stopping) e.stopPropagation();
        stopping = false;
      });
    }

    // Lighting rig: ambient + hemisphere (sky/ground bounce) + sun. Members
    // so applyScenePreset can retune without rebuilding the scene.
    this._ambient = new THREE.AmbientLight(0xffffff, 0.55);
    this._hemi = new THREE.HemisphereLight(0xbcd2ff, 0x202018, 0.0);
    this._sun = new THREE.DirectionalLight(0xffffff, 1.0);
    this._sun.position.set(3000, 8000, 3000);
    this._scene.add(this._ambient, this._hemi, this._sun);
    this.applyScenePreset(this._preset);

    this._grid = new THREE.GridHelper(20000, 20, 0x334466, 0x1a2235);
    this._scene.add(this._grid);
    this._scene.add(this._floorGroup, this._doorGroup, this._modelGroup,
                    this._zoneGroup, this._haloGroup,
                    this._sensorGroup, this._motionGroup, this._envGroup,
                    this._bleGroup, this._alarmGroup, this._safetyGroup,
                    this._robotGroup, this._robotRigGroup,
                    this._lightGroup, this._switchGroup, this._targetGroup, this._ghostGroup,
                    this._gpsGroup, this._weatherGroup);

    this._controls = new OrbitControls(this._camera, this._renderer.domElement);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.08;
    this._controls.target.set(0, 0, 0);
    this._controls.maxPolarAngle = Math.PI * 0.49;
    this._controls.minDistance = 1000;
    this._controls.maxDistance = 45000;
    this._controls.update();

    // Sims cam azimuth snap: after any orbit gesture ends, if the snap mode is
    // on, pick the nearest 45° azimuth about the target and let `_animate`
    // glide there. Registered once; gated on the runtime `_simsCam` flag.
    // Any manual orbit/pan suspends auto-follow: push the resume deadline out
    // 6 s on gesture start AND end (so it resumes 6 s after the interaction
    // finishes, not 6 s after it began).
    this._controls.addEventListener('start', () => {
      this._followPauseUntil = performance.now() / 1000 + 6;
    });
    this._controls.addEventListener('end', () => {
      this._followPauseUntil = performance.now() / 1000 + 6;
      if (!this._simsCam || !this._camera || !this._controls) return;
      const t = this._controls.target;
      const az = Math.atan2(this._camera.position.x - t.x,
                            this._camera.position.z - t.z);
      const step = Math.PI / 4;
      this._snapAzimuth = Math.round(az / step) * step;
    });

    // Recover from iOS Safari context loss without a full reload.
    // preventDefault on `lost` is what allows the browser to fire
    // `restored` at all; on restore, force a frame so a backgrounded
    // HA-app WebView doesn't come back to a black canvas.
    this._renderer.domElement.addEventListener('webglcontextlost', e => {
      e.preventDefault();
      console.warn('WebGL context lost — will restore on next event.');
    });
    this._renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.warn('WebGL context restored.');
      if (this._renderer && this._scene && this._camera) {
        this._renderer.render(this._scene, this._camera);
      }
    });

    // Fixture click / dblclick — manual pointerdown/pointerup pair instead of
    // the browser-synthesized `click`. OrbitControls' damping + capture means
    // the synthesized `click` was unreliable across browsers (sometimes
    // suppressed entirely after a small orbit drag). We track movement
    // ourselves: pointerup within 5 px and 500 ms of pointerdown counts as a
    // tap. Two taps within 350 ms count as a dblclick.
    const dom = this._renderer.domElement;
    let downX = 0, downY = 0, downT = 0, lastTapT = 0;
    dom.addEventListener('pointerdown', e => {
      downX = e.clientX; downY = e.clientY; downT = e.timeStamp;
    });
    dom.addEventListener('pointerup', e => {
      const dt = e.timeStamp - downT;
      const dx = Math.abs(e.clientX - downX), dy = Math.abs(e.clientY - downY);
      if (dt > 500 || dx > 5 || dy > 5) return;
      const hit = this._raycastFixture(e.clientX, e.clientY);
      if (!hit) { lastTapT = 0; return; }
      const now = e.timeStamp;
      if (now - lastTapT < 350) {
        this._onFixtureDblClick?.(hit);
        lastTapT = 0;
      } else {
        this._onFixtureClick?.(hit);
        lastTapT = now;
      }
    });

    this._animate();
  }

  onFixtureClick(fn: (info: { kind: 'light' | 'switch' | 'media' | 'alarm' | 'safety' | 'robot'; entity_id: string | null; fixtureId: string }) => void): void {
    this._onFixtureClick = fn;
  }
  onFixtureDblClick(fn: (info: { kind: 'light' | 'switch' | 'media' | 'alarm' | 'safety' | 'robot'; entity_id: string | null; fixtureId: string }) => void): void {
    this._onFixtureDblClick = fn;
  }

  private _raycastFixture(clientX: number, clientY: number):
      { kind: 'light' | 'switch' | 'media' | 'alarm' | 'safety' | 'robot'; entity_id: string | null; fixtureId: string } | null {
    if (!this._renderer || !this._camera) return null;
    const rect = this._renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this._raycaster.setFromCamera(ndc, this._camera);
    // Recurse from the lightGroup itself so all descendants are tested in one
    // call (avoids edge cases where iterating children misses deeply nested
    // meshes).
    // Candidate roots: the light group (layer-hidden lights are not click
    // targets) plus every bound media-furniture group. intersectObjects sorts
    // hits by distance across all roots, so a nearer light beats a TV behind it
    // and vice-versa.
    const roots: THREE.Object3D[] = [];
    if (this._lightGroup.visible) roots.push(this._lightGroup);
    // Switches ride their own layer; layer-hidden switches aren't click targets.
    if (this._switchGroup.visible) roots.push(this._switchGroup);
    // Alarm keypads are clickable (open the control modal); ride the sensors layer.
    if (this._alarmGroup.visible) roots.push(this._alarmGroup);
    // Smoke / CO detectors are clickable (unbound → manual test trigger).
    if (this._safetyGroup.visible) roots.push(this._safetyGroup);
    // Robots (docks + moving bodies) are clickable → run/dock.
    if (this._robotGroup.visible) roots.push(this._robotGroup);
    if (this._robotRigGroup.visible) roots.push(this._robotRigGroup);
    for (const g of this._mediaClickables) roots.push(g);
    if (!roots.length) return null;
    const hits = this._raycaster.intersectObjects(roots, true);
    for (const h of hits) {
      // Walk up to find the first ancestor that carries our userData tag.
      let obj: THREE.Object3D | null = h.object;
      while (obj) {
        const ud = obj.userData;
        if (ud && (ud.kind === 'light' || ud.kind === 'switch' || ud.kind === 'media' || ud.kind === 'alarm' || ud.kind === 'safety' || ud.kind === 'robot')) {
          return { kind: ud.kind, entity_id: ud.entity_id ?? null, fixtureId: String(ud.fixtureId) };
        }
        obj = obj.parent;
      }
    }
    return null;
  }

  // Dispose all GPU-side resources (geometries + materials + textures) for a
  // single object subtree. Three.js does NOT auto-dispose these when objects
  // are removed from the scene — without this helper, every per-frame scene
  // rebuild leaks WebGL buffers and the eventual GC stalls the main thread
  // (manifests as a long freeze when switching from 3D to 2D).
  private _disposeSubtree(obj: THREE.Object3D): void {
    obj.traverse(o => {
      // Meshes, lines, and points all carry geometry + material(s).
      const m = o as Partial<THREE.Mesh> & THREE.Object3D;
      m.geometry?.dispose();
      const mat = m.material;
      if (Array.isArray(mat)) mat.forEach(mm => mm.dispose());
      else if (mat) mat.dispose();
    });
  }

  // Empty a group AND dispose every child's resources. Use this everywhere
  // we used to do `while (g.children.length) g.remove(g.children[0])`.
  private _clearGroup(g: THREE.Group): void {
    for (let i = g.children.length - 1; i >= 0; i--) {
      const child = g.children[i];
      g.remove(child);
      this._disposeSubtree(child);
    }
  }

  // ── Sims-style material factory ─────────────────────────────────────────
  // The whole scene renders as MeshToonMaterial with one shared stepped
  // gradient map — flat, saturated color bands instead of PBR (the 2000-era
  // Sims look). The factory accepts MeshStandardMaterial-style params so the
  // ~50 legacy construction sites converted mechanically: PBR-only knobs
  // (roughness / metalness / envMapIntensity) are silently dropped, every
  // toon-valid param (color / map / emissive / transparent / opacity / side /
  // depthWrite) passes through. Colors get a gentle saturation push so the
  // palette reads game-y without clobbering user-picked hues.
  private _gradientMapTex: THREE.DataTexture | null = null;
  private _gradientMap(): THREE.DataTexture {
    if (this._gradientMapTex) return this._gradientMapTex;
    // 4 bands: enough steps to keep night scenes readable, few enough to
    // read as cel shading. Nearest filtering keeps the band edges hard.
    const steps = new Uint8Array([90, 150, 210, 255]);
    const tex = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    this._gradientMapTex = tex;
    return tex;
  }
  private _simsColor(c: THREE.ColorRepresentation): THREE.Color {
    const col = new THREE.Color(c);
    const hsl = { h: 0, s: 0, l: 0 };
    col.getHSL(hsl);
    col.setHSL(hsl.h, Math.min(1, hsl.s * 1.25 + 0.02), hsl.l);
    return col;
  }
  private _mat(p: THREE.MeshStandardMaterialParameters = {}): THREE.MeshToonMaterial {
    const { roughness: _r, metalness: _m, envMapIntensity: _e, color, ...rest } = p;
    const m = new THREE.MeshToonMaterial({
      ...(rest as THREE.MeshToonMaterialParameters),
      gradientMap: this._gradientMap(),
    });
    if (color !== undefined) m.color.copy(this._simsColor(color));
    return m;
  }

  // Soft radial blob shadow — one shared texture, an alpha quad per user.
  // Replaces shadow maps entirely (Sims-style, and a tablet perf win).
  private _blobTex: THREE.CanvasTexture | null = null;
  private _blobTexture(): THREE.CanvasTexture {
    if (this._blobTex) return this._blobTex;
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 8, 64, 64, 62);
    grad.addColorStop(0, 'rgba(10,12,18,0.42)');
    grad.addColorStop(0.7, 'rgba(10,12,18,0.28)');
    grad.addColorStop(1, 'rgba(10,12,18,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    this._blobTex = new THREE.CanvasTexture(c);
    return this._blobTex;
  }
  // ── Weather particle textures (W2) ──────────────────────────────────────
  // Shared PointsMaterial maps — built once, disposed only in destroy() (like
  // the gradient / blob textures). PointsMaterial + SpriteMaterial are the
  // documented EXEMPTIONS from the _mat toon factory: particles are billboarded
  // point sprites, not lit surfaces, so they carry their own tiny CanvasTexture
  // and a flat color instead of a toon gradient. _clearWeather disposes the
  // per-cloud geometry + material explicitly but leaves these shared maps alone.
  private _rainTex: THREE.CanvasTexture | null = null;
  private _snowTex: THREE.CanvasTexture | null = null;
  private _hailTex: THREE.CanvasTexture | null = null;
  private _dustTex: THREE.CanvasTexture | null = null;
  private _fogPlaneTex: THREE.CanvasTexture | null = null;

  // A vertical bright streak on transparent — rain looks like falling lines.
  private _rainTexture(): THREE.CanvasTexture {
    if (this._rainTex) return this._rainTex;
    const c = document.createElement('canvas');
    c.width = 16; c.height = 64;
    const g = c.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, 'rgba(200,225,255,0)');
    grad.addColorStop(0.5, 'rgba(210,232,255,0.85)');
    grad.addColorStop(1, 'rgba(200,225,255,0)');
    g.fillStyle = grad;
    g.fillRect(6, 0, 4, 64);
    this._rainTex = new THREE.CanvasTexture(c);
    return this._rainTex;
  }
  // Soft round flake (radial falloff) — snow.
  private _snowTexture(): THREE.CanvasTexture {
    if (this._snowTex) return this._snowTex;
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(16, 16, 1, 16, 16, 15);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.6, 'rgba(245,250,255,0.55)');
    grad.addColorStop(1, 'rgba(245,250,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 32, 32);
    this._snowTex = new THREE.CanvasTexture(c);
    return this._snowTex;
  }
  // Small hard white dot — hail.
  private _hailTexture(): THREE.CanvasTexture {
    if (this._hailTex) return this._hailTex;
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const g = c.getContext('2d')!;
    g.fillStyle = 'rgba(255,255,255,0)';
    g.fillRect(0, 0, 16, 16);
    g.beginPath(); g.arc(8, 8, 5, 0, Math.PI * 2);
    g.fillStyle = 'rgba(240,248,255,0.95)'; g.fill();
    this._hailTex = new THREE.CanvasTexture(c);
    return this._hailTex;
  }
  // Faint drifting speck — wind dust / leaves.
  private _dustTexture(): THREE.CanvasTexture {
    if (this._dustTex) return this._dustTex;
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(200,190,150,0.7)');
    grad.addColorStop(1, 'rgba(200,190,150,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 16, 16);
    this._dustTex = new THREE.CanvasTexture(c);
    return this._dustTex;
  }
  // Soft radial patch for the scrolling ground-fog planes.
  private _fogPlaneTexture(): THREE.CanvasTexture {
    if (this._fogPlaneTex) return this._fogPlaneTex;
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 10, 64, 64, 64);
    grad.addColorStop(0, 'rgba(210,215,225,0.5)');
    grad.addColorStop(1, 'rgba(210,215,225,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    this._fogPlaneTex = t;
    return this._fogPlaneTex;
  }
  // Soft dark blob for drifting cloud shadows (W3). Like _blobTex but darker /
  // wider-falloff so overlapping decals read as a big moving overcast patch.
  private _cloudShadowTexture(): THREE.CanvasTexture {
    if (this._cloudShadowTex) return this._cloudShadowTex;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, 'rgba(20,24,32,0.55)');
    grad.addColorStop(0.6, 'rgba(20,24,32,0.28)');
    grad.addColorStop(1, 'rgba(20,24,32,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    this._cloudShadowTex = new THREE.CanvasTexture(c);
    return this._cloudShadowTex;
  }
  // Soft dark-blue ellipse for rain puddles (W3). Slightly glossy center.
  private _puddleTexture(): THREE.CanvasTexture {
    if (this._puddleTex) return this._puddleTex;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 60, 4, 64, 64, 64);
    grad.addColorStop(0, 'rgba(70,96,130,0.85)');
    grad.addColorStop(0.7, 'rgba(40,58,86,0.7)');
    grad.addColorStop(1, 'rgba(40,58,86,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    // A faint sky-reflection highlight streak.
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = 'rgba(150,180,215,0.35)';
    g.beginPath(); g.ellipse(56, 52, 26, 9, -0.4, 0, Math.PI * 2); g.fill();
    this._puddleTex = new THREE.CanvasTexture(c);
    return this._puddleTex;
  }

  // Privacy-blur silhouette textures (shared, built once). A chunky
  // pixel-mosaic of a standing / seated body — NearestFilter for the censored
  // look. Shared like the blob/gradient maps: never disposed per-instance, only
  // in destroy(). The pattern is deterministic (hand-coded body mask + a hash
  // over gray/blue blocks).
  private _blurTexStand: THREE.CanvasTexture | null = null;
  private _blurTexSit: THREE.CanvasTexture | null = null;
  private _blurTexture(sit: boolean): THREE.CanvasTexture {
    const cached = sit ? this._blurTexSit : this._blurTexStand;
    if (cached) return cached;
    const W = 20, H = 30;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, W, H);
    const PAL = ['#6b7280', '#7c8794', '#8b95a5', '#5b6472', '#9aa4b2', '#4a5563'];
    // Body mask: returns true where a body block should be painted. Columns are
    // 0..19, rows 0 (top) .. 29 (bottom).
    const inMask = (x: number, y: number): boolean => {
      if (sit) {
        if (y >= 3 && y <= 8 && x >= 7 && x <= 12) return true;         // head
        if (y >= 9 && y <= 17 && x >= 5 && x <= 14) return true;        // torso
        if (y >= 18 && y <= 22 && x >= 4 && x <= 15) return true;       // lap / thighs
        if (y >= 23 && y <= 29 && ((x >= 5 && x <= 8) || (x >= 11 && x <= 14))) return true; // shins
        return false;
      }
      if (y >= 2 && y <= 7 && x >= 7 && x <= 12) return true;           // head
      if (y === 8 && x >= 9 && x <= 10) return true;                    // neck
      if (y >= 9 && y <= 18 && x >= 5 && x <= 14) return true;          // torso
      if (y >= 9 && y <= 16 && ((x >= 3 && x <= 4) || (x >= 15 && x <= 16))) return true; // arms
      if (y >= 19 && y <= 29 && ((x >= 6 && x <= 9) || (x >= 10 && x <= 13))) return true; // legs
      return false;
    };
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!inMask(x, y)) continue;
        g.fillStyle = PAL[(x * 7 + y * 13) % PAL.length];
        g.fillRect(x, y, 1, 1);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    if (sit) this._blurTexSit = tex; else this._blurTexStand = tex;
    return tex;
  }

  // rx/rz are half-extents (mm) of the shadow ellipse in the parent's local
  // frame. The shared texture must never be disposed per-instance —
  // _disposeSubtree only disposes materials, not maps, so this is safe.
  private _blobShadow(rx: number, rz: number, y = 8): THREE.Mesh {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(rx * 2, rz * 2),
      new THREE.MeshBasicMaterial({
        map: this._blobTexture(), transparent: true, depthWrite: false,
      }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    // No renderOrder tweak: transparent materials draw after the opaque
    // floor anyway; forcing them earlier let the floor paint over them.
    m.userData.outlineSkip = true;
    return m;
  }

  // Cartoon outlines: inverted-hull shells. Each qualifying opaque mesh gets
  // a child mesh SHARING its geometry, rendered BackSide in flat dark, scaled
  // outward so ~`thick` mm of rim shows. Scaling is compensated about the
  // geometry's bounding-box center, so translated geometries (limb segments
  // hang below their origin) inflate symmetrically. Shells share one
  // material and the host's geometry — double-dispose is idempotent.
  private _outlineMaterial: THREE.MeshBasicMaterial | null = null;
  // `materialOverride` lets a caller (humanoids) give shells a per-rig material
  // clone so its opacity can be faded independently of every other rig's shells.
  private _addOutlines(rootObj: THREE.Object3D, thick = 12, minDim = 90,
                       materialOverride?: THREE.MeshBasicMaterial): void {
    if (!this._outlineMaterial) {
      // polygonOffset pushes shell fragments slightly deeper so a shell face
      // that lands nearly coplanar with a NEIGHBOR mesh face (abutting boxes
      // in composite furniture) loses the depth contest cleanly instead of
      // cross-hatch z-fighting. Silhouette rims stick out far enough that
      // the offset doesn't dent them.
      this._outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0x14161c, side: THREE.BackSide,
        polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2,
      });
    }
    const targets: THREE.Mesh[] = [];
    rootObj.traverse(o => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || m.userData.outline || m.userData.outlineSkip) return;
      const mat = m.material as THREE.Material;
      if (Array.isArray(m.material) || !mat || mat.transparent) return;
      targets.push(m);
    });
    let idx = 0;
    for (const m of targets) {
      const geo = m.geometry;
      if (!geo.boundingBox) geo.computeBoundingBox();
      const bb = geo.boundingBox;
      if (!bb) continue;
      const sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y, sz = bb.max.z - bb.min.z;
      if (Math.min(sx, sy, sz) < 8) continue;          // thin sheets: shell z-fights
      if (Math.max(sx, sy, sz) < minDim) continue;     // tiny detail parts: noise
      // Stagger thickness per shell: two shells from ABUTTING boxes (sofa
      // seat vs armrest) can otherwise land coplanar and z-fight — the
      // shared polygonOffset can't break a shell-vs-shell tie.
      const th = thick + (idx++ % 3) * 3;
      const fx = (sx + th * 2) / sx, fy = (sy + th * 2) / sy, fz = (sz + th * 2) / sz;
      const cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2, cz = (bb.min.z + bb.max.z) / 2;
      const shell = new THREE.Mesh(geo, materialOverride ?? this._outlineMaterial);
      shell.userData.outline = true;
      shell.scale.set(fx, fy, fz);
      shell.position.set(cx * (1 - fx), cy * (1 - fy), cz * (1 - fz));
      m.add(shell);
    }
  }

  // Strip every per-floor mesh group. Called when the user switches floors so
  // a transient bug or render hiccup can't leave the previous floor's
  // sensors / fixtures / zones / halos / targets visible.
  clearTransientGroups(): void {
    for (const g of [
      this._floorGroup, this._doorGroup, this._modelGroup, this._zoneGroup, this._haloGroup,
      this._sensorGroup, this._motionGroup, this._bleGroup, this._alarmGroup,
      this._safetyGroup, this._robotGroup, this._robotRigGroup,
      this._lightGroup, this._switchGroup, this._targetGroup, this._ghostGroup,
    ]) {
      this._clearGroup(g);
    }
    // Robot rigs live in _robotRigGroup (just cleared); drop their bookkeeping so
    // updateRobotRigs rebuilds fresh on the next floor.
    this._robotRigs = {};
    // Appliance-door pivots + their eased blend/dwell state reset on floor
    // switch (the pivots were just disposed with _floorGroup; the blend map is
    // rebuilt lazily as updateFloor re-registers doors).
    this._applianceDoors = [];
    this._applianceDoorBlend = {};
    // Weather effects reset on floor switch (spawn box is fitted to the floor
    // bbox; three-view re-runs updateWeather next tick). _clearWeather resets the
    // tracking lists so _advanceWeather can't iterate freed buffers.
    this._clearWeather();
    // Drop cutaway-wall references (their meshes were just disposed) so the
    // per-frame fader can't touch stale geometry before the next rebuild.
    this._cutawayWalls = [];
    this._cutawayGhostWalls = [];
    // Drop persistent rigs so updateTargets rebuilds fresh on the next tick.
    for (const key of Object.keys(this._humanoids)) {
      this._disposeHumanoid(this._humanoids[key]);
    }
    this._humanoids = {};
    this._aiState = {};
    this._sitSpots = [];
    this._mediaClickables = [];
    this._activityAnchors = [];
    this._tvsByRoom = {};
    this._beds = [];
    this._roomZones = [];
    this._wallLoops = [];
    this._disposeBedCovers();
    this._fanRotors = [];
    this._terrain = [];
    // updateFloor rebuilds this every call, but null it on floor switch so a
    // stale grid can't briefly route targets against the previous floor.
    this._nav = null;
  }

  // Remove + dispose every live bed cover and clear the dwell accumulators.
  // The cover meshes live under _targetGroup, so a _clearGroup on that group
  // already frees the GPU buffers — this just drops our tracking records and
  // covers the standalone (destroy) call.
  private _disposeBedCovers(): void {
    for (const id of Object.keys(this._bedCovers)) {
      const c = this._bedCovers[id];
      this._targetGroup.remove(c.grp);
      c.mesh.geometry.dispose();
      (c.mesh.material as THREE.Material).dispose();
    }
    this._bedCovers = {};
    this._bedDwell = {};
  }

  // ── Camera views ────────────────────────────────────────────────────────
  cameraView(): { pos: [number, number, number]; target: [number, number, number] } | null {
    if (!this._camera || !this._controls) return null;
    const p = this._camera.position, t = this._controls.target;
    return { pos: [p.x, p.y, p.z], target: [t.x, t.y, t.z] };
  }

  setCameraView(pos: [number, number, number], target: [number, number, number]): void {
    if (!this._camera || !this._controls) return;
    this._camera.position.set(pos[0], pos[1], pos[2]);
    this._controls.target.set(target[0], target[1], target[2]);
    this._controls.update();
  }

  // Built-in camera views framed to the current floor extents. 'front' is
  // the scene -Z side, which matches the bottom edge of the 2D plan. 'sims' is
  // a dimetric-feel pose (45° azimuth, ~35.26° elevation = atan(1/√2)) framed
  // on the floor center at eye height — pair with setSimsCam(true) for the snap.
  applyViewPreset(kind: 'iso' | 'top' | 'front' | 'back' | 'left' | 'right' | 'sims'): void {
    const d = Math.max(this._fw, this._fd) * 1.35;
    if (kind === 'sims') {
      // Dimetric: azimuth 45°, elevation atan(1/√2). Horizontal radius r and
      // height h satisfy h/r = 1/√2, |(r,h)| = d.
      const el = Math.atan(1 / Math.SQRT2);
      const r = d * Math.cos(el), h = d * Math.sin(el);
      const a = Math.PI / 4;
      const target: [number, number, number] = [0, 600, 0];
      this.setCameraView(
        [target[0] - r * Math.sin(a), target[1] + h, target[2] - r * Math.cos(a)],
        target);
      return;
    }
    const views: Record<string, [number, number, number]> = {
      iso:   [-d * 0.75, d * 0.75, -d * 0.75],
      top:   [0, d * 1.6, -d * 0.02],
      front: [0, d * 0.45, -d * 1.15],
      back:  [0, d * 0.45, d * 1.15],
      left:  [d * 1.15, d * 0.45, 0],   // scene +X = 2D plan left (X mirrored)
      right: [-d * 1.15, d * 0.45, 0],
    };
    const v = views[kind] ?? views.iso;
    this.setCameraView(v, [0, 0, 0]);
  }

  // Toggle Sims-cam azimuth snapping. Turning it on snaps immediately from the
  // current pose; turning it off cancels any in-flight glide.
  setSimsCam(on: boolean): void {
    this._simsCam = on;
    if (!on) { this._snapAzimuth = null; return; }
    if (!this._camera || !this._controls) return;
    const t = this._controls.target;
    const az = Math.atan2(this._camera.position.x - t.x,
                          this._camera.position.z - t.z);
    const step = Math.PI / 4;
    this._snapAzimuth = Math.round(az / step) * step;
  }

  simsCamOn(): boolean { return this._simsCam; }

  // Auto-follow toggle. Turning it on lets `_animate` take over the camera pose
  // (eased); off returns full manual control immediately.
  setAutoFollow(on: boolean): void { this._autoFollow = on; }
  // Cinematic slow-orbit toggle. Per-frame azimuth advance in _animate; when
  // auto-follow is also on it rides on top of auto-follow's framing (distance +
  // target), so the two never fight (auto-follow preserves azimuth, we drive it).
  setCinematicOrbit(on: boolean): void { this._cinematicOrbit = on; }
  setPlumbobs(on: boolean): void { this._plumbobs = on; }

  // Surface height (mm) under a world point: the highest stair tread or
  // landing containing it, else the floor (0). Stair treads quantize to the
  // same step layout the builder renders, so figures stand ON treads.
  private _groundYAt(wx: number, wy: number): number {
    let g = 0, found = false;
    for (const t of this._terrain) {
      const l = furnitureWorldToLocal(t.rotation, wx - t.x, wy - t.y);
      if (Math.abs(l.x) > t.w / 2 || Math.abs(l.y) > t.h / 2) continue;
      let gy: number;
      if (t.kind === 'stair_landing') {
        gy = t.elevation + t.ht;
      } else {
        const n = Math.max(3, Math.round(t.h / 280));
        const frac = (l.y + t.h / 2) / t.h;  // 0 at the front → 1 at the top
        const step = Math.min(n - 1, Math.max(0, Math.floor(frac * n)));
        gy = t.elevation + (t.ht / n) * (step + 1);
      }
      if (!found || gy > g) { g = gy; found = true; }
    }
    return found ? g : 0;
  }

  // World→3D mapping: flip X so screen-right matches 2D world +X; world Y → 3D Z.
  private _w(wx: number, wy: number, h = 0): THREE.Vector3 {
    return new THREE.Vector3(this._fw / 2 - wx, h, wy - this._fd / 2);
  }

  // ── Scene appearance ────────────────────────────────────────────────────
  // Presets tune the ambient / hemisphere / sun rig + background tint.
  //   day   — bright neutral exterior daylight
  //   dusk  — low warm sun, stronger sky bounce
  //   night — dim blue ambient so bound HA lights dominate (default; the
  //           original look)
  // Tuned for the toon pipeline: no tone mapping, no environment map, no
  // shadow maps — light levels are what you see. Toon bands want a strong
  // directional component (the sun) so surfaces facing away drop a band.
  applyScenePreset(preset: ScenePreset): void {
    this._preset = preset;
    if (!this._scene || !this._ambient || !this._hemi || !this._sun) return;
    switch (preset) {
      case 'day':
        this._scene.background = new THREE.Color(0xa9c4e0);
        this._ambient.intensity = 0.85;
        this._hemi.color.set(0xcfe5ff); this._hemi.groundColor.set(0x8a7f6a);
        this._hemi.intensity = 0.55;
        this._sun.color.set(0xfff6e0); this._sun.intensity = 1.15;
        this._sun.position.set(4000, 10000, 2500);
        break;
      case 'dusk':
        this._scene.background = new THREE.Color(0x2a2030);
        this._ambient.intensity = 0.45;
        this._hemi.color.set(0xff9d6a); this._hemi.groundColor.set(0x202028);
        this._hemi.intensity = 0.4;
        this._sun.color.set(0xff8a4a); this._sun.intensity = 0.6;
        this._sun.position.set(-6000, 2500, 4000);
        break;
      default: // night
        this._scene.background = new THREE.Color(0x0d0d1a);
        this._ambient.intensity = 0.5;
        this._hemi.color.set(0x223048); this._hemi.groundColor.set(0x101018);
        this._hemi.intensity = 0.25;
        this._sun.color.set(0xdfe6ff); this._sun.intensity = 0.45;
        this._sun.position.set(3000, 8000, 3000);
    }
  }

  // Shadow maps are gone (blob decals instead) — kept as a no-op so the many
  // builder call sites didn't need touching and the signature stays stable.
  private _shadowFlags(_obj: THREE.Object3D, _cast = true, _receive = true): void {}

  // Cheap procedural floor textures drawn to a canvas once and cached.
  // Keeps the bundle free of binary assets and works offline.
  private _floorTexture(kind: FloorTexKind): THREE.Texture | null {
    if (kind === 'none') return null;
    const cached = this._texCache[kind];
    if (cached) return cached;
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const g = c.getContext('2d')!;
    if (kind === 'wood') {
      g.fillStyle = '#7a5a3c'; g.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 32) {
        g.fillStyle = `rgba(0,0,0,${0.08 + (y / 32 % 2) * 0.05})`;
        g.fillRect(0, y, 256, 32);
        g.strokeStyle = 'rgba(40,24,12,0.55)'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke();
        // grain streaks
        for (let i = 0; i < 6; i++) {
          g.strokeStyle = `rgba(60,38,20,${0.12 + Math.random() * 0.12})`;
          g.lineWidth = 0.8;
          const yy = y + 4 + Math.random() * 24;
          g.beginPath(); g.moveTo(0, yy);
          g.bezierCurveTo(64, yy + Math.random() * 4 - 2, 192, yy + Math.random() * 4 - 2, 256, yy);
          g.stroke();
        }
      }
    } else if (kind === 'tile') {
      g.fillStyle = '#9aa0a6'; g.fillRect(0, 0, 256, 256);
      g.strokeStyle = 'rgba(40,44,48,0.7)'; g.lineWidth = 3;
      for (let i = 0; i <= 256; i += 64) {
        g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
        g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
      }
      // mild per-tile shade variance
      for (let x = 0; x < 256; x += 64) for (let y = 0; y < 256; y += 64) {
        g.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
        g.fillRect(x, y, 64, 64);
      }
    } else { // concrete
      g.fillStyle = '#8d8d90'; g.fillRect(0, 0, 256, 256);
      const img = g.getImageData(0, 0, 256, 256);
      for (let i = 0; i < img.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 18;
        img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
      }
      g.putImageData(img, 0, 0);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this._texCache[kind] = tex;
    return tex;
  }

  // ── Imported 3D model (Sweet Home 3D OBJ) ───────────────────────────────
  // Loads parsed OBJ/MTL text into the model group. Caller gates on
  // model3d.rev / transform changes. SH3D exports cm with Y-up and plan-Y
  // along +Z; our scene mirrors X and plan-Y maps to +Z, so scaling X and Z
  // by -scale flips both axes (determinant stays positive — no inside-out
  // normals) and lines the model up with the 2D plan.
  updateModel3D(meta: Model3D | null | undefined, objText: string | null,
                mtlText: string | null): void {
    if (!this._scene) return;
    this._clearGroup(this._modelGroup);
    if (!meta || !meta.visible || !objText) return;
    try {
      const objLoader = new OBJLoader();
      if (mtlText) {
        const mtl = new MTLLoader().parse(mtlText, '');
        mtl.preload();
        objLoader.setMaterials(mtl);
      }
      const obj = objLoader.parse(objText);
      const s = meta.scale;
      const grp = new THREE.Group();
      obj.scale.set(-s, s, -s);
      grp.add(obj);
      const p = this._w(meta.x, meta.y, 0);
      grp.position.set(p.x, 0, p.z);
      grp.rotation.y = -((meta.rotation || 0) * Math.PI / 180);
      if (meta.opacity < 1) {
        grp.traverse(o => {
          const m = o as THREE.Mesh;
          if (m.isMesh) {
            const mats = Array.isArray(m.material) ? m.material : [m.material];
            for (const mat of mats) {
              (mat as THREE.Material).transparent = true;
              (mat as THREE.Material).opacity = meta.opacity;
              (mat as THREE.Material).depthWrite = meta.opacity > 0.6;
            }
          }
        });
      }
      this._shadowFlags(grp);
      this._modelGroup.add(grp);
    } catch (err) {
      console.error('3D model load failed:', err);
    }
  }

  // Layer visibility (shared with the 2D layer flags): cheap per-tick
  // group.visible flips — no rebuilds. Furniture and the bg image live
  // inside _floorGroup and are gated at build time in updateFloor instead.
  setLayerVisibility(v: import('./types.js').Layers2D): void {
    this._lightGroup.visible = v.lights !== false;
    this._switchGroup.visible = v.switches !== false;
    this._sensorGroup.visible = v.sensors !== false;
    // BLE proxy pucks + alarm keypads ride the sensors layer (like mmWave).
    this._bleGroup.visible = v.sensors !== false;
    this._alarmGroup.visible = v.sensors !== false;
    // Smoke / CO detectors ride the sensors layer too.
    this._safetyGroup.visible = v.sensors !== false;
    // Robot docks + moving bodies ride the sensors layer too.
    this._robotGroup.visible = v.sensors !== false;
    this._robotRigGroup.visible = v.sensors !== false;
    this._motionGroup.visible = v.motion !== false;
    this._envGroup.visible = v.env !== false;
    const z = v.zones !== false;
    this._zoneGroup.visible = z;
    this._haloGroup.visible = z;
    this._targetGroup.visible = v.targets !== false;
    // GPS + landmark pins ride the geo layer (shared with 2D landmark pins).
    this._gpsGroup.visible = v.geo !== false;
    // Weather effects ride their own layer. Hiding the group also stops the
    // per-frame particle motion (gated on visibility in _advanceWeather); the
    // scene fog is driven separately by three-view sending a no-effect condition.
    this._weatherGroup.visible = v.weatherFx !== false;
    // Name labels ride their own layer. Persistent-rig sprites live inside
    // _targetGroup, so this can't be a group flip — updateTargets gates each
    // rig's label sprite visibility on this flag every frame.
    this._showNameLabels = v.nameLabels !== false;
  }
  private _showNameLabels = true;

  updateFloor(f: Floor, scene3d?: Scene3D, layers?: import('./types.js').Layers2D,
              customObjects?: ObjectRecipe[], stateProvider?: StateProvider): void {
    if (!this._scene) return;
    this._fw = f.w; this._fd = f.d; this._floorId = f.id;
    // Foreground wall cutaway: default ON, opt out with wallCutaway === false.
    this._cutaway = scene3d?.wallCutaway !== false;
    this._cutawayWalls = [];
    // Room-name labels are Sprites whose CanvasTextures _clearGroup won't touch;
    // drop them explicitly (mirrors the _envGroup pairing in updateEnvSensors)
    // before wiping the group, or every rebuild leaks a GPU texture.
    this._disposeSpriteMaps(this._floorGroup);
    this._clearGroup(this._floorGroup);
    if (scene3d?.preset && scene3d.preset !== this._preset) {
      this.applyScenePreset(scene3d.preset);
    }

    const floorColor = scene3d?.floorColor ? hexToInt(scene3d.floorColor) : 0x101820;
    const floorTex = this._floorTexture(scene3d?.floorTex ?? 'none');
    if (floorTex) {
      // Repeat ~1 tile per 800 mm so texel density stays sane on any floor.
      floorTex.repeat.set(Math.max(1, f.w / 800), Math.max(1, f.d / 800));
    }
    // Floor: when the walls trace closed loop(s), the floor covers exactly
    // those footprints instead of the whole f.w × f.d rectangle. Invisible
    // walls count, so an open-plan boundary can close a region without
    // rendering a wall. No closed loop → classic full-rectangle floor.
    const loops = closedWallLoops(f.walls ?? []);
    this._wallLoops = loops;
    const showFurniture = layers?.furniture !== false;
    const showAppliances = layers?.appliances !== false;
    const showBg = layers?.bg !== false;
    const showWalls = layers?.walls !== false;
    // Furniture pieces visible under the current layers: appliances ride their
    // own layer, everything else the furniture layer. Feeds the build loop AND
    // nav so a hidden category's anchors / door pivots / footprints all drop out.
    const visFurniture = (f.furniture ?? []).filter(fu =>
      furnitureCat(resolveFurnitureDef(fu, customObjects)) === 'appliance'
        ? showAppliances : showFurniture);
    // Stairs sunk below the floor (negative elevation) cut a stairwell
    // opening so the descending flight is visible from above. No holes when
    // furniture (incl. stairs) is layer-hidden.
    const wellCuts = (showFurniture ? (f.furniture ?? []) : []).filter(fu =>
      (fu.kind === 'stairs' || fu.kind === 'stairs_half' || fu.kind === 'stair_landing') &&
      (fu.elevation ?? 0) < 0);
    // World-space corners of a well rect, inset 3 mm so a clipped hole edge
    // never lands exactly coincident with a loop boundary (earcut degenerates
    // on coincident edges).
    const wellRectWorld = (fu: Furniture): Vec2[] => {
      const cs: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      return cs.map(([sx, sy]) => {
        const lw = furnitureLocalToWorld(fu.rotation, sx * (fu.w / 2 - 3), sy * (fu.h / 2 - 3));
        return { x: fu.x + lw.x, y: fu.y + lw.y };
      });
    };
    // A world-space polygon → THREE.Path in floor-shape coords. three.js
    // ShapeGeometry re-winds contour + holes itself (ShapeUtils.isClockWise),
    // so the source winding here doesn't matter — only that the hole stays
    // INSIDE its shape, which the caller guarantees by clipping first.
    const scenePathFor = (poly: Vec2[]): THREE.Path => {
      const path = new THREE.Path();
      poly.forEach((pt, i) => {
        const sx = f.w / 2 - pt.x, sy = f.d / 2 - pt.y;
        if (i === 0) path.moveTo(sx, sy); else path.lineTo(sx, sy);
      });
      path.closePath();
      return path;
    };
    const MIN_HOLE_AREA = 1e4;  // 0.01 m² in mm² — ignore slivers
    // Glass-house mode makes the ACTIVE floor's slab translucent so the storey
    // below (ghost stack) reads through it. depthWrite stays ON — the floor
    // still writes depth so furniture/blob-shadow decals (which sit just above
    // the slab, drawn in the transparent pass) sort correctly and don't get
    // painted over; a mostly-opaque 0.45 slab reads fine with depthWrite true.
    const glassHouse = scene3d?.glassHouse === true;
    const floorMat = this._mat({
      color: floorColor, map: floorTex ?? null,
      side: THREE.DoubleSide, roughness: 0.9, metalness: 0.0,
      ...(glassHouse ? { transparent: true, opacity: 0.45, depthWrite: true } : {}),
    });
    if (wellCuts.length) {
      // Dark void plane below the deepest well so stairwell openings show
      // depth instead of the sky behind the scene.
      const deepest = Math.min(...wellCuts.map(fu => fu.elevation ?? 0));
      const voidPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(f.w * 1.2, f.d * 1.2),
        new THREE.MeshBasicMaterial({ color: 0x101216, side: THREE.DoubleSide }));
      voidPlane.rotation.x = -Math.PI / 2;
      voidPlane.position.y = deepest - 120;
      this._floorGroup.add(voidPlane);
    }
    if (loops.length) {
      // ShapeGeometry UVs are raw shape coords (mm); one texture repeat per
      // 800 mm matches the plane path's repeat = size/800.
      if (floorTex) floorTex.repeat.set(1 / 800, 1 / 800);
      for (const loop of loops) {
        // Plane rotated -π/2 maps shape (sx, sy) → scene (sx, 0, -sy);
        // world (wx, wy) must land at (fw/2 − wx, 0, wy − fd/2).
        const shape = new THREE.Shape();
        loop.forEach((pt, i) => {
          const sx = f.w / 2 - pt.x, sy = f.d / 2 - pt.y;
          if (i === 0) shape.moveTo(sx, sy); else shape.lineTo(sx, sy);
        });
        shape.closePath();
        // Stairwell holes: clip each well rect to THIS loop so a well that
        // straddles the boundary only cuts the part actually over this floor
        // patch — a raw rect poking outside the shape makes earcut produce the
        // diagonal floor shards the bug report showed.
        for (const fu of wellCuts) {
          const clipped = intersectLoopWithRect(loop, wellRectWorld(fu));
          if (clipped && Math.abs(polygonArea(clipped)) >= MIN_HOLE_AREA) {
            shape.holes.push(scenePathFor(clipped));
          }
        }
        const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), floorMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        this._floorGroup.add(mesh);
      }
    } else if (wellCuts.length) {
      // Full-rectangle floor as a Shape so stairwells can pierce it.
      if (floorTex) floorTex.repeat.set(1 / 800, 1 / 800);
      const shape = new THREE.Shape();
      shape.moveTo(f.w / 2, f.d / 2);
      shape.lineTo(-f.w / 2, f.d / 2);
      shape.lineTo(-f.w / 2, -f.d / 2);
      shape.lineTo(f.w / 2, -f.d / 2);
      shape.closePath();
      // Clip each well to the floor rect (world [0,f.w]×[0,f.d]); a well fully
      // inside comes back unchanged, one poking past an edge gets trimmed.
      const floorRect: Vec2[] = [
        { x: 0, y: 0 }, { x: f.w, y: 0 }, { x: f.w, y: f.d }, { x: 0, y: f.d },
      ];
      for (const fu of wellCuts) {
        const clipped = intersectLoopWithRect(floorRect, wellRectWorld(fu));
        if (clipped && Math.abs(polygonArea(clipped)) >= MIN_HOLE_AREA) {
          shape.holes.push(scenePathFor(clipped));
        }
      }
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), floorMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.receiveShadow = true;
      this._floorGroup.add(mesh);
    } else {
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(f.w, f.d), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;  // ground catches shadows, never casts
      this._floorGroup.add(floor);
    }

    // Background image (overlays grid when visible)
    const bg = f.bg;
    const bgVisible = !!(bg && bg.visible !== false && bg.dataUrl) && showBg;
    if (this._grid) this._grid.visible = !bgVisible;
    if (!bgVisible && this._bgTexCache) {
      this._bgTexCache.tex.dispose();
      this._bgTexCache = null;
    }
    if (bgVisible && bg) {
      if (!this._bgTexCache || this._bgTexCache.dataUrl !== bg.dataUrl) {
        if (this._bgTexCache) this._bgTexCache.tex.dispose();
        const tex = new THREE.TextureLoader().load(bg.dataUrl, () => {
          if (this._renderer && this._scene && this._camera) {
            this._renderer.render(this._scene, this._camera);
          }
        });
        tex.colorSpace = THREE.SRGBColorSpace;
        this._bgTexCache = { dataUrl: bg.dataUrl, tex };
      }
      const planeGeo = new THREE.PlaneGeometry(bg.w, bg.h);
      const planeMat = new THREE.MeshBasicMaterial({
        map: this._bgTexCache.tex, transparent: true, opacity: bg.opacity ?? 1,
        side: THREE.DoubleSide, depthWrite: false,
      });
      const grp = new THREE.Group();
      const p = this._w(bg.x, bg.y, 2);
      grp.position.set(p.x, p.y, p.z);
      grp.rotation.y = -(bg.rotation || 0) * Math.PI / 180;
      const mesh = new THREE.Mesh(planeGeo, planeMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.scale.x = -1; mesh.scale.y = -1;
      grp.add(mesh);
      this._floorGroup.add(grp);
    }

    // Walls. Door / window openings cut real gaps: solid runs are full-height
    // boxes; a window keeps a sub-sill below (0–sill) and a header above
    // sill+height (both per-window, defaulting to 900 / 800 → 900 / 1700);
    // a door (2000 panel) keeps a header/lintel above 2050 so the opening
    // sits inside the 9 ft wall. Open doors/windows reveal a real gap.
    const wallH = 2743 /* 9 ft */, wallThick = 100;
    const SILL_TOP = WINDOW_DEFAULTS.sill, WINDOW_GLASS_H = WINDOW_DEFAULTS.height, DOOR_HEAD = 2050;
    // Glass-house mode drops the ACTIVE floor's wall opacity too (0.45 → 0.22)
    // — the ghost stories were already faint, but rear active walls at 0.45
    // clouded the view through the building. configRev covers the rebuild on
    // toggle (the checkbox save/emitConfig bumps it into _keyFloor).
    const wallOpacity = scene3d?.glassHouse ? 0.22 : 0.45;
    const wallMatFor = () => this._mat({
      color: scene3d?.wallColor ? hexToInt(scene3d.wallColor) : 0xbbbbbb,
      emissive: 0x444444, emissiveIntensity: 0.1,
      transparent: true, opacity: wallOpacity, side: THREE.DoubleSide, depthWrite: false,
    });
    for (const wall of showWalls ? f.walls : []) {
      if (wall.points.length < 2) continue;
      const kind = wallKind(wall);
      if (kind === 'invisible') continue;  // planning boundary only
      const kindH = WALL_KINDS[kind].h;
      const group = new THREE.Group();
      for (let i = 0; i < wall.points.length - 1; i++) {
        const a = wall.points[i], b = wall.points[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) continue;
        const ux = dx / len, uy = dy / len;
        const angle = Math.atan2(-dx, dy);
        if (kind === 'railing') {
          // Banister: end/interval posts + top rail + thin balusters.
          const railMat = this._mat({
            color: scene3d?.wallColor ? hexToInt(scene3d.wallColor) : 0x8d8d92,
            metalness: 0.3, roughness: 0.5,
          });
          const bar = (t: number, w2: number, y0: number, y1: number, d2 = 70) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(d2, y1 - y0, w2), railMat);
            const p = this._w(a.x + ux * t, a.y + uy * t, (y0 + y1) / 2);
            m.position.set(p.x, p.y, p.z);
            m.rotation.y = angle;
            group.add(m);
          };
          bar(len / 2, len, kindH - 60, kindH);          // top rail
          bar(len / 2, len, 60, 100, 50);                // bottom rail
          const nPosts = Math.max(1, Math.round(len / 1200));
          for (let k = 0; k <= nPosts; k++) bar((len * k) / nPosts, 90, 0, kindH - 60, 90);
          const nBal = Math.floor(len / 280);
          for (let k = 1; k < nBal; k++) bar((len * k) / nBal, 28, 100, kindH - 60, 28);
          continue;
        }
        const piece = (t0: number, t1: number, y0: number, y1: number) => {
          const yTop = Math.min(y1, kindH);
          if (t1 - t0 < 10 || yTop - y0 < 10) return;
          const geo = new THREE.BoxGeometry(wallThick, yTop - y0, t1 - t0);
          const mesh = new THREE.Mesh(geo, wallMatFor());
          const mid = (t0 + t1) / 2;
          const p = this._w(a.x + ux * mid, a.y + uy * mid, (y0 + yTop) / 2);
          mesh.position.set(p.x, p.y, p.z);
          mesh.rotation.y = angle;
          // Cutaway tag: scene-space midpoint + horizontal perpendicular (the
          // scene-space wall direction is (-ux, uy) after the X-mirror, so its
          // normal is (-uy, -ux)). Either sign is fine — the fader re-orients.
          this._tagCutawayWall(mesh, p.x, p.z, -uy, -ux, this._cutawayWalls);
          group.add(mesh);
        };
        const { solids, openings } = wallCutsForSegment(a, b, f.doors ?? [], f.windows ?? []);
        for (const sv of solids) piece(sv.t0, sv.t1, 0, kindH);
        // Overlap each sub-sill / header / lintel a few mm INTO the abutting
        // solid jamb runs. Without this their end-cap faces are exactly coplanar
        // with the jamb's — coincident faces (the CLAUDE.md gotcha) that hatch
        // into thin vertical seams up the wall on the flat toon shading. The
        // overlap buries the caps inside the full-height jamb (never a gap).
        const JAMB_OVL = 3;
        for (const op of openings) {
          const o0 = op.t0 - JAMB_OVL, o1 = op.t1 + JAMB_OVL;
          if (op.kind === 'window') {
            const sillTop = op.sill ?? SILL_TOP;                 // bottom of glass
            const headerBot = (op.sill ?? SILL_TOP) + (op.height ?? WINDOW_GLASS_H);
            piece(o0, o1, 0, sillTop);         // sub-sill
            piece(o0, o1, headerBot, kindH);   // header (skipped on low walls)
          } else {
            piece(o0, o1, DOOR_HEAD, kindH);   // lintel (skipped on low walls)
          }
        }
      }
      this._shadowFlags(group);
      this._floorGroup.add(group);
    }

    // Furniture: kind-specific block shapes. Each piece becomes a Group
    // positioned at the world (fu.x, fu.y); +Y world (the "front" of chairs /
    // sofas / beds) maps to local -Z after the X-mirror in `_w`, so backrests
    // get placed at child.position.z = -depth/2.
    this._sitSpots = [];
    this._mediaClickables = [];
    this._activityAnchors = [];
    // Appliance-door pivots are rebuilt here; the blend / dwell maps persist
    // (keyed by fixture id) so a _keyFloor rebuild re-applies the current door
    // opening without a pop.
    this._applianceDoors = [];
    this._tvsByRoom = {};
    this._beds = [];
    this._roomZones = [];
    this._terrain = [];
    const rooms = f.rooms ?? [];
    for (const fu of visFurniture) {
      // Appliance in-use indicator: resolve effective on/off (bound entity or
      // unbound localState). Appliance doors are built CLOSED as hinge pivots
      // (collected in doorSink) and animated per frame in updateTargets.
      const def0 = resolveFurnitureDef(fu, customObjects);
      const isAppliance = furnitureCat(def0) === 'appliance';
      const st0 = stateProvider ? itemState(fu, stateProvider) : null;
      const applianceOn = isAppliance && (st0?.state === 'on' || st0?.state === 'playing');
      const doorSink: { pivot: THREE.Object3D; axis: 'x' | 'y'; openAngle: number }[] = [];
      const grp = this._buildFurniture(fu, f.furniture, customObjects,
                                       { applianceOn, doorSink });
      this._shadowFlags(grp);
      this._floorGroup.add(grp);
      // Register each door pivot with the fixture-level info the per-frame blend
      // needs, and re-apply the persisted blend so a rebuild doesn't pop the door
      // shut (or open).
      if (doorSink.length) {
        const unbound = fu.entity_id == null;
        const hasDoorSensor = fu.doorEntity != null;
        for (const dp of doorSink) {
          const blend = this._applianceDoorBlend[fu.id] ?? 0;
          dp.pivot.rotation[dp.axis] = dp.openAngle * blend;
          this._applianceDoors.push({
            fuId: fu.id, pivot: dp.pivot, axis: dp.axis, openAngle: dp.openAngle,
            wx: fu.x, wy: fu.y, unbound, hasDoorSensor,
          });
        }
      }
      const def = resolveFurnitureDef(fu, customObjects);
      // Bound TVs become clickable like light fixtures: tag the group so the
      // raycaster's parent-walk finds the media binding, and register it in the
      // dedicated clickable list (raycasting all of _floorGroup would be heavy).
      // TVs are clickable regardless of binding so an UNBOUND set can still be
      // toggled locally (entity_id null → the click handler flips localState).
      if (fu.kind === 'tv' || fu.kind === 'wall_tv') {
        grp.userData = { ...grp.userData, kind: 'media', entity_id: fu.entity_id ?? null, fixtureId: fu.id };
        this._mediaClickables.push(grp);
      }
      // Stairs and landings are walkable terrain for humanoid targets.
      if (fu.kind === 'stairs' || fu.kind === 'stairs_half' || fu.kind === 'stair_landing') {
        this._terrain.push({
          x: fu.x, y: fu.y, w: fu.w, h: fu.h, rotation: fu.rotation,
          ht: def.ht, elevation: fu.elevation ?? 0, kind: fu.kind,
        });
        // Glass-house: build the stairs translucent so the storey reads through.
        // Cutaway: enroll the solid step meshes so a foreground stairwell fades
        // like the walls (a stairwell shouldn't block the see-in view). The
        // stair piece's meshes share per-piece materials (created in
        // _buildFurniture), so we tag ONE mesh per unique material — that fades
        // the whole flight uniformly without compounding the ease, and never
        // touches the GLOBAL outline material (outline shells are skipped).
        const c = this._w(fu.x, fu.y, 0);
        const seenMats = new Set<THREE.Material>();
        grp.traverse(o => {
          const m = o as THREE.Mesh;
          if (!m.isMesh || m.userData?.outline) return;
          const mat = m.material as THREE.Material & { opacity?: number; transparent?: boolean };
          if (Array.isArray(m.material) || !mat) return;
          if (glassHouse) { mat.transparent = true; mat.opacity = 0.35; }
          if (seenMats.has(mat)) return;   // one tag per material (uniform fade)
          seenMats.add(mat);
          // Radial normal (piece center dir) → the cutaway predicate treats the
          // stair block like an outward-facing wall between camera and center.
          m.userData.cutFloor = 0.12;      // don't fully vanish — 0.12 min
          this._tagCutawayWall(m, c.x, c.z, c.x, c.z, this._cutawayWalls);
        });
      }
      // Which named room this piece sits in (live loop resolution; null when
      // its center falls outside every closed loop).
      const roomId = resolveRoomForPoint(rooms, loops, fu.x, fu.y)?.id ?? null;
      // Sittable kinds (def.seat set) become seating anchors for humanoids.
      // Facing: person sits facing away from the backrest — body-local -Z,
      // which is the furniture group's yaw.
      if (def.seat) {
        // The seat's own activity (e.g. a desk/table authored as sittable)
        // wins; otherwise probe for an adjacent table/desk whose footprint
        // (expanded 400 mm) contains the seat center, so a plain chair pulled
        // up to a table/desk becomes an eat/work seat. Reads the HOST's
        // resolved def.activity so custom recipes with those activities work.
        let hostActivity = def.activity;
        // Tabletop height of the eat/work host, so the seated arm IK can rest
        // the hands ON the surface (Part B). Set only for eat/work seats.
        let hostTopY: number | undefined;
        // Adjacent host's world footprint — the seated root clamps outside it
        // so a too-deep chair can't bury the torso in the slab.
        let hostRef: SitSpot['host'];
        if (hostActivity === 'eat_at_table' || hostActivity === 'work_at_desk') {
          // Seat authored as its own eat/work surface (custom recipe) — the top
          // is this piece's own def.ht. No host clamp (own footprint).
          hostTopY = def.ht + (fu.elevation ?? 0);
        } else if (!hostActivity) {
          for (const host of f.furniture) {
            if (host === fu) continue;
            const hdef = resolveFurnitureDef(host, customObjects);
            const ha = hdef.activity;
            if (ha !== 'eat_at_table' && ha !== 'work_at_desk') continue;
            const l = furnitureWorldToLocal(host.rotation, fu.x - host.x, fu.y - host.y);
            if (Math.abs(l.x) <= host.w / 2 + 400 && Math.abs(l.y) <= host.h / 2 + 400) {
              hostActivity = ha;
              hostTopY = hdef.ht + (host.elevation ?? 0);
              hostRef = { x: host.x, y: host.y, w: host.w, h: host.h, rotation: host.rotation };
              break;
            }
          }
        }
        const c = this._w(fu.x, fu.y, 0);
        // Soft lounge pieces a pet curls up on rather than sitting upright.
        const softKind = fu.kind === 'sofa' || fu.kind === 'sofa_l_left' ||
          fu.kind === 'sofa_l_right' || fu.kind === 'sofa_u' || fu.kind === 'chaise' ||
          fu.kind === 'ottoman' || fu.kind === 'bed';
        const facing = -((fu.rotation || 0) * Math.PI / 180);
        const cosF = Math.cos(facing), sinF = Math.sin(facing);
        const fNx = -sinF, fNz = -cosF;   // scene-XZ unit normal out the seat front (local -Z)
        const W = fu.w, D = fu.h;
        const r = Math.max(fu.w, fu.h) / 2 + 350;
        const seatH = def.seat;   // captured for the forEach closure (narrowing)
        // ── Seating v2 spot distribution. Each entry is a seat anchor in the
        // piece-LOCAL frame (X = width, +Z = back / -Z = functional front) with
        // its own cushion depth. Wide pieces register several so multiple avatars
        // can share the couch; the default is one centered spot. `SEAT_PITCH`
        // (≈ hip-to-hip) sets how many fit; `SEAT_FRONT_INSET` seats the buttocks
        // near the cushion front so the shins hang CLEAR of the cushion box (the
        // leg-crop fix — parametrized off the actual seat depth, per anchor).
        const SEAT_PITCH = 600, SEAT_FRONT_INSET = 140;
        const seatLocals: { lx: number; lz: number; depth: number }[] = [];
        if (fu.kind === 'sofa') {
          // Count from full width (floor(W/600)); distribute within the usable,
          // arm-excluded width (armW = W*0.08 per the sofa builder) so cushions
          // stay ~504 mm apart and clear of the armrests.
          const armW = W * 0.08;
          const usable = Math.max(SEAT_PITCH, W - 2 * armW);
          const n = Math.max(1, Math.floor(W / SEAT_PITCH));
          for (let i = 0; i < n; i++)
            seatLocals.push({ lx: usable * ((i + 0.5) / n - 0.5), lz: 0, depth: D });
        } else if (fu.kind === 'bench') {
          const n = Math.max(1, Math.floor(W / SEAT_PITCH));
          for (let i = 0; i < n; i++)
            seatLocals.push({ lx: W * ((i + 0.5) / n - 0.5), lz: 0, depth: D });
        } else if (fu.kind === 'sofa_l_left' || fu.kind === 'sofa_l_right' || fu.kind === 'sofa_u') {
          // Sectionals: spots along the main run (X, near the back) PLUS one per
          // return arm — matching the builder's main-seat + return geometry.
          const mainD = Math.min(950, D * 0.5);
          const mainZ = D / 2 - mainD / 2;
          const retW = Math.min(950, W * (fu.kind === 'sofa_u' ? 0.3 : 0.35));
          const retZ = -mainD / 2, retD = D - mainD;
          const sides: number[] = fu.kind === 'sofa_u' ? [-1, 1]
            : [fu.kind === 'sofa_l_left' ? 1 : -1];
          const nMain = Math.max(1, Math.floor(W / SEAT_PITCH));
          for (let i = 0; i < nMain; i++) {
            const lx = W * ((i + 0.5) / nMain - 0.5);
            // The corner where a return meets the main run is served by the
            // return spot — skip main spots that fall inside a return column.
            if (sides.some(sx => Math.abs(lx - sx * (W / 2 - retW / 2)) < retW / 2)) continue;
            seatLocals.push({ lx, lz: mainZ, depth: mainD });
          }
          for (const sx of sides)
            seatLocals.push({ lx: sx * (W / 2 - retW / 2), lz: retZ, depth: retD });
        } else {
          seatLocals.push({ lx: 0, lz: 0, depth: D });   // single centered spot
        }
        seatLocals.forEach((s, i) => {
          // Forward-shift the hip toward the cushion front (lounge seats only —
          // eat/work seats keep centered so the legs tuck UNDER the table and the
          // host-outside clamp still governs the torso).
          const shift = hostTopY == null ? Math.max(0, s.depth / 2 - SEAT_FRONT_INSET) : 0;
          const lz = s.lz - shift;
          const ox = s.lx * cosF + lz * sinF, oz = -s.lx * sinF + lz * cosF;
          const sx = c.x + ox, sz = c.z + oz;
          // Approach staging point ~350 mm in front of the cushion front edge
          // (the front edge sits SEAT_FRONT_INSET in front of the hip).
          const APPROACH = 350 + SEAT_FRONT_INSET;
          this._sitSpots.push({
            id: `${fu.id}:${i}`,
            x: sx, z: sz, seatY: seatH + (fu.elevation ?? 0),
            facing, r,
            frontNx: fNx, frontNz: fNz,
            approachX: sx + fNx * APPROACH, approachZ: sz + fNz * APPROACH,
            roomId, soft: softKind, hostActivity, hostTopY, host: hostRef,
          });
        });
      }
      // Pieces whose def carries an `activity` register a contextual anchor
      // (dwell triggers wire these up in a later phase).
      if (def.activity) {
        const a = this._w(fu.x, fu.y, 0);
        this._activityAnchors.push({
          furnitureId: fu.id, x: a.x, z: a.z,
          r: Math.max(fu.w, fu.h) / 2 + 350,
          facing: -((fu.rotation || 0) * Math.PI / 180),
          // Stand in FRONT of the piece (+facing = local +Z / world +Y depth
          // axis), clear of its front face (fu.h/2) plus a body's half-width.
          standOff: fu.h / 2 + 340,
          kind: def.activity,
          roomId,
          // A local control state counts as a state source (entity-gated
          // activities fire off entityOn[fu.id], which effectiveState populates
          // for locally-ON pieces too).
          hasEntity: fu.entity_id != null || fu.localState != null,
        });
      }
      // TVs per room: a seated person in a room whose bound-or-locally-ON TV is
      // on watches it. Skip roomless TVs (can't scope them to a seat's room).
      if ((fu.kind === 'tv' || def.activity === 'watch_tv') && roomId) {
        (this._tvsByRoom[roomId] ??= []).push({
          furnitureId: fu.id, hasEntity: fu.entity_id != null || fu.localState != null,
        });
      }
      // Beds captured for the two-in-bed covers effect. Mattress top matches the
      // bed builder: frame HT*0.45 + mattress spanning to HT*1.05.
      if (fu.kind === 'bed') {
        const c = this._w(fu.x, fu.y, 0);
        this._beds.push({
          id: fu.id, x: fu.x, y: fu.y, w: fu.w, h: fu.h, rotation: fu.rotation,
          color: def.color, matressTop: def.ht * 1.05, cx: c.x, cz: c.z,
          // Two-person shared-covers effect on unless explicitly disabled.
          sharedCovers: fu.sharedBedCovers !== false,
        });
      }
    }

    // Room-name labels: a dim billboard at the centroid of each room's
    // containing wall loop. The room IS whichever closed loop currently holds
    // its anchor, so labels track wall edits. Skip anchors outside all loops.
    // The `labels` layer gates only the sprites — the room ↔ loop pairing must
    // stay live for target-room resolution (activities, TV rooms).
    const showLabels = layers?.labels !== false;
    for (const rm of rooms) {
      const loop = loopContaining(loops, rm.anchor.x, rm.anchor.y);
      if (!loop) continue;
      // Cache the room ↔ loop pairing for per-frame target-room resolution.
      this._roomZones.push({ roomId: rm.id, loop });
      if (!showLabels) continue;
      const c = centroid(loop);
      const wp = this._w(c.x, c.y, 50);
      const lbl = roomLabel(rm);
      const sprite = this._makeRoomLabelSprite(lbl.text, lbl.placeholder);
      sprite.position.set(wp.x, wp.y, wp.z);
      this._floorGroup.add(sprite);
    }

    // Rebuild the humanoid navigation grid from the same walls + furniture.
    // Hidden walls don't block (consistent with hidden furniture).
    this._buildNav(f, visFurniture, customObjects, showWalls);
  }

  // Tag a wall mesh for the foreground-cutaway fader. Records the segment
  // midpoint (scene XZ) + a horizontal perpendicular unit vector + the build-
  // time opacity, and enrolls the mesh in `list` so _updateWallCutaway iterates
  // it without a per-frame scene traversal.
  private _tagCutawayWall(mesh: THREE.Mesh, mx: number, mz: number,
                          nx: number, nz: number, list: THREE.Mesh[]): void {
    const nlen = Math.hypot(nx, nz) || 1;
    const mat = mesh.material as THREE.Material & { opacity?: number; transparent?: boolean };
    mesh.userData.wallCut = { mx, mz, nx: nx / nlen, nz: nz / nlen };
    mesh.userData.baseOpacity = mat.opacity ?? 1;
    list.push(mesh);
  }

  // ── Glass-house multi-story view ─────────────────────────────────────────
  // Render every OTHER floor as a translucent shell stacked at its story
  // height (the ACTIVE floor is drawn live by the normal pipeline at y=0).
  // Lightweight: loop-clipped (or full-rect) floor slab, single-box wall runs
  // (no opening cuts), footprint furniture boxes — no outlines, blobs, shadows,
  // or raycast targets. Each ghost floor uses ITS OWN w/d for coordinate
  // mapping but is centered on the scene origin, so all stories line up.
  updateGhostFloors(floors: Floor[], currentId: string, scene3d?: Scene3D,
                    customObjects?: ObjectRecipe[]): void {
    if (!this._scene) return;
    this._clearGroup(this._ghostGroup);
    this._cutawayGhostWalls = [];
    if (!scene3d?.glassHouse) return;

    const STORY_H = 3000;   // 2743 mm wall + slab
    const curIdx = Math.max(0, floors.findIndex(fl => fl.id === currentId));

    for (let i = 0; i < floors.length; i++) {
      if (floors[i].id === currentId) continue;   // active floor is live
      const gf = floors[i];
      const yOff = (i - curIdx) * STORY_H;
      const gw = gf.w, gd = gf.d;
      // Ghost-floor world→scene map: same formula as _w but with THIS floor's
      // dimensions (both stories centered at the origin). Inline — _w reads
      // this._fw/_fd (the active floor's dims).
      const gsx = (wx: number) => gw / 2 - wx;
      const gsz = (wy: number) => wy - gd / 2;

      const gGrp = new THREE.Group();
      gGrp.position.y = yOff;

      const wallColor = gf.look3d?.wallColor ?? scene3d.wallColor;
      const floorColor = gf.look3d?.floorColor ?? scene3d.floorColor;

      // Floor slab — loop-clipped when the walls trace closed loops, else a
      // full rectangle. No stairwell cuts (ghosts stay cheap).
      const slabMat = this._mat({
        color: floorColor ? hexToInt(floorColor) : 0x101820,
        transparent: true, opacity: 0.30, side: THREE.DoubleSide, depthWrite: false,
      });
      const loops = closedWallLoops(gf.walls ?? []);
      if (loops.length) {
        for (const loop of loops) {
          const shape = new THREE.Shape();
          loop.forEach((pt, k) => {
            const sx = gsx(pt.x), sy = gsz(pt.y);
            if (k === 0) shape.moveTo(sx, sy); else shape.lineTo(sx, sy);
          });
          shape.closePath();
          const slab = new THREE.Mesh(new THREE.ShapeGeometry(shape), slabMat);
          slab.rotation.x = -Math.PI / 2;
          gGrp.add(slab);
        }
      } else {
        const slab = new THREE.Mesh(new THREE.PlaneGeometry(gw, gd), slabMat);
        slab.rotation.x = -Math.PI / 2;
        gGrp.add(slab);
      }

      // Walls — one box per polyline segment at full run length (no opening
      // cuts), height per wall kind. Railings/invisible skipped. Tagged for
      // cutaway (dollhouse applies to ghost stories too).
      const wallThick = 100;
      for (const wall of gf.walls ?? []) {
        if (wall.points.length < 2) continue;
        const kind = wallKind(wall);
        if (kind === 'invisible' || kind === 'railing') continue;
        const kindH = WALL_KINDS[kind].h;
        for (let s = 0; s < wall.points.length - 1; s++) {
          const a = wall.points[s], b = wall.points[s + 1];
          const dx = b.x - a.x, dy = b.y - a.y;
          const len = Math.hypot(dx, dy);
          if (len < 10) continue;
          const ux = dx / len, uy = dy / len;
          const angle = Math.atan2(-dx, dy);
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(wallThick, kindH, len),
            this._mat({ color: wallColor ? hexToInt(wallColor) : 0xbbbbbb,
              transparent: true, opacity: 0.10, side: THREE.DoubleSide, depthWrite: false }));
          const mxw = a.x + ux * len / 2, myw = a.y + uy * len / 2;
          mesh.position.set(gsx(mxw), kindH / 2, gsz(myw));
          mesh.rotation.y = angle;
          this._tagCutawayWall(mesh, gsx(mxw), gsz(myw), -uy, -ux, this._cutawayGhostWalls);
          gGrp.add(mesh);
        }
      }

      // Furniture — simple footprint boxes (w × def.ht × h), no outlines/blobs.
      for (const fu of gf.furniture ?? []) {
        const def = resolveFurnitureDef(fu, customObjects);
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(fu.w, def.ht, fu.h),
          this._mat({ color: def.color, transparent: true, opacity: 0.18,
            side: THREE.DoubleSide, depthWrite: false }));
        mesh.position.set(gsx(fu.x), def.ht / 2 + (fu.elevation ?? 0), gsz(fu.y));
        mesh.rotation.y = -((fu.rotation || 0) * Math.PI / 180);
        gGrp.add(mesh);
      }

      this._ghostGroup.add(gGrp);
    }
  }

  // ── Foreground wall cutaway (Sims dollhouse) ──────────────────────────────
  // Fade walls that sit between the camera and the room center so an iso view
  // sees inside. Runs per-frame from _animate (camera damping moves the camera
  // between input events). Only dot products over the pre-collected tagged
  // meshes — no scene traversal.
  private _updateWallCutaway(): void {
    if (!this._camera) return;
    const cam = this._camera.position;
    const camHoriz = Math.hypot(cam.x, cam.z);
    const camLen = camHoriz || 1;
    // Camera nearly overhead (top view) → the horizontal direction is
    // undefined and no wall is "in front"; restore everything.
    const overhead = camHoriz < Math.max(this._fw, this._fd) * 1.35 * 0.12;
    const apply = (mesh: THREE.Mesh) => {
      const cut = mesh.userData.wallCut as
        { mx: number; mz: number; nx: number; nz: number } | undefined;
      if (!cut) return;
      const mat = mesh.material as THREE.Material & { opacity: number; transparent: boolean };
      const base = (mesh.userData.baseOpacity as number) ?? 1;
      let target = base;
      if (this._cutaway && !overhead) {
        // Outward normal = the perpendicular sign pointing away from origin.
        let onx = cut.nx, onz = cut.nz;
        if (onx * cut.mx + onz * cut.mz < 0) { onx = -onx; onz = -onz; }
        const midLen = Math.hypot(cut.mx, cut.mz) || 1;
        const foreground =
          // camera on the wall's outward side (between camera and interior)
          onx * (cam.x - cut.mx) + onz * (cam.z - cut.mz) > 0 &&
          // wall roughly between the camera and the scene center
          (cam.x * cut.mx + cam.z * cut.mz) / (camLen * midLen) > 0.3;
        // Walls fade to 0.06; stairs (or any mesh with a per-mesh floor) can set
        // a higher minimum so the flight stays legible while faded.
        if (foreground) target = (mesh.userData.cutFloor as number) ?? 0.06;
      }
      // Ease toward the target so walls fade rather than pop.
      mat.opacity += (target - mat.opacity) * 0.1;
      mat.transparent = true;
    };
    for (const m of this._cutawayWalls) apply(m);
    for (const m of this._cutawayGhostWalls) apply(m);
  }

  // ── Humanoid navigation (collision-aware pathfinding) ────────────────────
  // Build the nav grid in world coords (mm). Furniture footprints (inflated by
  // PERSON_R) and solid wall runs block cells; door/window openings stay
  // walkable. Build cost is cells × pieces + segment tests — build-time only.
  // `furnitureOn` mirrors the layer gate: pass `null` to treat furniture as
  // layer-hidden (don't block on it), else `undefined`.
  private _buildNav(f: Floor, furnitureOn: Furniture[] | null | undefined,
                    customObjects?: ObjectRecipe[], wallsOn = true): void {
    const cell = 150;
    const PERSON_R = 170;
    const nx = Math.max(1, Math.ceil(f.w / cell));
    const ny = Math.max(1, Math.ceil(f.d / cell));
    const blocked = new Uint8Array(nx * ny);
    const clampX = (c: number) => Math.max(0, Math.min(nx - 1, c));
    const clampY = (c: number) => Math.max(0, Math.min(ny - 1, c));

    // Furniture: block cells whose center is inside the (rotated) footprint
    // inflated by PERSON_R. Skip rugs (they ARE floor), stairs/landings
    // (walkable terrain), and pieces lifted ≥ 300 mm off the floor (wall-hung /
    // counter-top items don't obstruct the body). A counter at elevation 0 with
    // a 900 mm top still blocks — the test is whether the PIECE is raised, not
    // its height.
    // null → no furniture; an explicit list → exactly those pieces (used to drop
    // layer-hidden categories from nav); undefined → all of f.furniture.
    const furniture = furnitureOn === null ? [] : (furnitureOn ?? f.furniture ?? []);
    for (const fu of furniture) {
      const def = resolveFurnitureDef(fu, customObjects);
      if (def.rug) continue;
      if (fu.kind === 'stairs' || fu.kind === 'stairs_half' || fu.kind === 'stair_landing') continue;
      // Beds are occupiable — people walk in and lie down / get covered. Blocking
      // the footprint makes nav steer settling occupants back OUT (breaking the
      // lie + shared-covers settle), so leave beds walkable like rugs/stairs.
      if (fu.kind === 'bed') continue;
      if ((fu.elevation ?? 0) >= 300) continue;
      const halfW = fu.w / 2 + PERSON_R, halfH = fu.h / 2 + PERSON_R;
      // AABB of the inflated footprint (rotation-agnostic: the max extent is
      // the diagonal), used only to bound the cell scan.
      const reach = Math.hypot(halfW, halfH);
      const c0x = clampX(Math.floor((fu.x - reach) / cell));
      const c1x = clampX(Math.floor((fu.x + reach) / cell));
      const c0y = clampY(Math.floor((fu.y - reach) / cell));
      const c1y = clampY(Math.floor((fu.y + reach) / cell));
      for (let cy = c0y; cy <= c1y; cy++) {
        for (let cx = c0x; cx <= c1x; cx++) {
          const wx = (cx + 0.5) * cell, wy = (cy + 0.5) * cell;
          const l = furnitureWorldToLocal(fu.rotation, wx - fu.x, wy - fu.y);
          if (Math.abs(l.x) <= halfW && Math.abs(l.y) <= halfH) blocked[cy * nx + cx] = 1;
        }
      }
    }

    // Walls: rasterize each solid run of every non-invisible segment as a thick
    // capsule (half-thickness 50 mm + PERSON_R). Door / window OPENINGS stay
    // walkable — people walk through doorways, and radar can track a person
    // straight through a window, so blocking a ~900 mm window gap that sits
    // next to an open doorway would strand paths worse than letting it pass.
    // railing / half walls are full-height at body level → they block.
    const WALL_HALF = 100 / 2;
    const rad = WALL_HALF + PERSON_R;
    for (const wall of wallsOn ? (f.walls ?? []) : []) {
      if (wall.points.length < 2) continue;
      if (wallKind(wall) === 'invisible') continue;
      for (let i = 0; i < wall.points.length - 1; i++) {
        const a = wall.points[i], b = wall.points[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) continue;
        const ux = dx / len, uy = dy / len;
        const { solids } = wallCutsForSegment(a, b, f.doors ?? [], f.windows ?? []);
        for (const s of solids) {
          const s0x = a.x + ux * s.t0, s0y = a.y + uy * s.t0;
          const s1x = a.x + ux * s.t1, s1y = a.y + uy * s.t1;
          const minx = Math.min(s0x, s1x) - rad, maxx = Math.max(s0x, s1x) + rad;
          const miny = Math.min(s0y, s1y) - rad, maxy = Math.max(s0y, s1y) + rad;
          const c0x = clampX(Math.floor(minx / cell)), c1x = clampX(Math.floor(maxx / cell));
          const c0y = clampY(Math.floor(miny / cell)), c1y = clampY(Math.floor(maxy / cell));
          for (let cy = c0y; cy <= c1y; cy++) {
            for (let cx = c0x; cx <= c1x; cx++) {
              const wx = (cx + 0.5) * cell, wy = (cy + 0.5) * cell;
              // Distance from cell center to the solid run segment.
              const t = Math.max(s.t0, Math.min(s.t1, (wx - a.x) * ux + (wy - a.y) * uy));
              const px = a.x + ux * t, py = a.y + uy * t;
              if (Math.hypot(wx - px, wy - py) <= rad) blocked[cy * nx + cx] = 1;
            }
          }
        }
      }
    }

    let blockedCount = 0;
    for (let i = 0; i < blocked.length; i++) if (blocked[i]) blockedCount++;

    // Connected-component labelling of the free cells (BFS flood fill). Matches
    // A* moves: 8-neighbours, but a diagonal only connects when BOTH shared
    // orthogonals are free (no corner cutting) so region membership == reachability.
    const region = new Int32Array(nx * ny).fill(-1);
    const queue = new Int32Array(nx * ny);
    const regionSize: number[] = [];
    let nextRegion = 0;
    for (let s = 0; s < blocked.length; s++) {
      if (blocked[s] || region[s] !== -1) continue;
      const id = nextRegion++;
      let head = 0, tail = 0;
      queue[tail++] = s; region[s] = id;
      while (head < tail) {
        const cur = queue[head++];
        const cx = cur % nx, cy = (cur / nx) | 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const ncx = cx + dx, ncy = cy + dy;
            if (ncx < 0 || ncy < 0 || ncx >= nx || ncy >= ny) continue;
            const ni = ncy * nx + ncx;
            if (blocked[ni] || region[ni] !== -1) continue;
            if (dx !== 0 && dy !== 0 &&
                (blocked[cy * nx + ncx] || blocked[ncy * nx + cx])) continue;
            region[ni] = id; queue[tail++] = ni;
          }
        }
      }
      regionSize[id] = tail;  // cells enqueued for this component == its size
    }

    this._nav = { cell, nx, ny, blocked, region, regionSize, rev: ++this._navRev, blockedCount };
  }

  // Region id of the FREE cell nearest a world point: if the cell is free,
  // its own region; if blocked, the region of the closest free cell found by an
  // expanding ring search (≤ ~1.8 m). -1 when nothing free is near.
  private _regionOfWorld(wx: number, wy: number): number {
    const n = this._nav;
    if (!n) return -1;
    const idx = this._cellIdxOf(wx, wy);
    if (n.blocked[idx] === 0) return n.region[idx];
    const free = this._nearestFreeCell(idx);
    return n.blocked[free] === 0 ? n.region[free] : -1;
  }

  // Nearest free cell to `idx` whose region matches `regionId` (expanding ring).
  // Falls back to any nearest free cell when regionId < 0 or no in-region cell
  // is found nearby, so callers always get a walkable landing spot.
  private _nearestFreeCellInRegion(idx: number, regionId: number): number {
    const n = this._nav!;
    if (regionId < 0) return this._nearestFreeCell(idx);
    if (n.blocked[idx] === 0 && n.region[idx] === regionId) return idx;
    const cx0 = idx % n.nx, cy0 = (idx / n.nx) | 0;
    for (let r = 1; r <= 40; r++) {
      let best = -1, bestD = Infinity;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;  // ring only
          const cx = cx0 + dx, cy = cy0 + dy;
          if (cx < 0 || cy < 0 || cx >= n.nx || cy >= n.ny) continue;
          const i = cy * n.nx + cx;
          if (n.blocked[i] || n.region[i] !== regionId) continue;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = i; }
        }
      }
      if (best >= 0) return best;
    }
    return this._nearestFreeCell(idx);  // region unreachable nearby → any free cell
  }

  // Like _nearestFreeCellInRegion but additionally requires the cell center to
  // fall inside `loop` (an AI avatar's home room). Falls back to the plain
  // region search when no in-loop cell is found nearby, so callers always get
  // a walkable landing spot even for degenerate loops.
  private _nearestFreeCellInLoop(idx: number, regionId: number, loop: Vec2[] | null): number {
    if (!loop) return this._nearestFreeCellInRegion(idx, regionId);
    const n = this._nav!;
    const centerIn = (i: number): boolean => {
      const cx = i % n.nx, cy = (i / n.nx) | 0;
      return pip((cx + 0.5) * n.cell, (cy + 0.5) * n.cell, loop);
    };
    if (n.blocked[idx] === 0 && (regionId < 0 || n.region[idx] === regionId) && centerIn(idx)) {
      return idx;
    }
    const cx0 = idx % n.nx, cy0 = (idx / n.nx) | 0;
    for (let r = 1; r <= 40; r++) {
      let best = -1, bestD = Infinity;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;  // ring only
          const cx = cx0 + dx, cy = cy0 + dy;
          if (cx < 0 || cy < 0 || cx >= n.nx || cy >= n.ny) continue;
          const i = cy * n.nx + cx;
          if (n.blocked[i]) continue;
          if (regionId >= 0 && n.region[i] !== regionId) continue;
          if (!centerIn(i)) continue;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = i; }
        }
      }
      if (best >= 0) return best;
    }
    return this._nearestFreeCellInRegion(idx, regionId);
  }

  // World point → grid index (clamped into range).
  private _cellIdxOf(wx: number, wy: number): number {
    const n = this._nav!;
    const cx = Math.max(0, Math.min(n.nx - 1, Math.floor(wx / n.cell)));
    const cy = Math.max(0, Math.min(n.ny - 1, Math.floor(wy / n.cell)));
    return cy * n.nx + cx;
  }

  // Grid index → scene coords of the cell center (inverse of _w on the center).
  private _cellToScene(idx: number): { x: number; z: number } {
    const n = this._nav!;
    const cx = idx % n.nx, cy = (idx / n.nx) | 0;
    const wx = (cx + 0.5) * n.cell, wy = (cy + 0.5) * n.cell;
    return { x: this._fw / 2 - wx, z: wy - this._fd / 2 };
  }

  // Is the cell containing this world point blocked (out-of-range = blocked)?
  private _blockedWorld(wx: number, wy: number): boolean {
    const n = this._nav;
    if (!n) return false;
    const cx = Math.floor(wx / n.cell), cy = Math.floor(wy / n.cell);
    if (cx < 0 || cy < 0 || cx >= n.nx || cy >= n.ny) return true;
    return n.blocked[cy * n.nx + cx] === 1;
  }

  // Line-of-sight between two WORLD points: sample the segment at ≤ half-cell
  // steps and reject if any sample lands in a blocked cell. Half-cell (75 mm)
  // sampling can't tunnel — the thinnest blocked span is a wall run (≥ 340 mm)
  // or an inflated footprint (≥ 340 mm), both several samples wide.
  private _losClearWorld(ax: number, ay: number, bx: number, by: number): boolean {
    const n = this._nav;
    if (!n) return true;
    const dx = bx - ax, dy = by - ay;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / (n.cell * 0.5)));
    for (let i = 0; i <= steps; i++) {
      const wx = ax + dx * (i / steps), wy = ay + dy * (i / steps);
      if (this._blockedWorld(wx, wy)) return false;
    }
    return true;
  }

  // Nearest free cell to a blocked one via expanding ring search (≤ ~1.8 m).
  // Returns the input index if already free or nothing free is found nearby.
  // Nearest free cell to `idx`, but region-quality-aware: once the first ring
  // radius `r0` with any free candidate is found, keep scanning up to r0+4 rings
  // and return the candidate in the LARGEST region (tie-break nearest). This
  // steers spawn / retarget snaps into the real open room rather than a tiny
  // sliver channel (e.g. behind a sofa) whose free cells happen to be closest to
  // a wall-mounted sensor. Falls back to plain nearest when regionSize is
  // missing (stale chunk). The strip is never rejected outright — if it's the
  // ONLY free region nearby it still wins.
  private _nearestFreeCell(idx: number): number {
    const n = this._nav!;
    if (n.blocked[idx] === 0) return idx;
    const cx0 = idx % n.nx, cy0 = (idx / n.nx) | 0;
    const rs = n.regionSize;
    let best = -1, bestD = Infinity, bestSize = -1, r0 = -1;
    for (let r = 1; r <= 16; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;  // ring only
          const cx = cx0 + dx, cy = cy0 + dy;
          if (cx < 0 || cy < 0 || cx >= n.nx || cy >= n.ny) continue;
          const i = cy * n.nx + cx;
          if (n.blocked[i]) continue;
          const d = dx * dx + dy * dy;
          const size = rs ? (rs[n.region[i]] ?? 0) : 0;
          if (size > bestSize || (size === bestSize && d < bestD)) {
            bestSize = size; bestD = d; best = i;
          }
        }
      }
      if (best >= 0) {
        if (r0 < 0) r0 = r;               // first ring with a candidate
        // The window past the first hit must clear a real sofa: ~750 mm
        // footprint + 2×170 mm person inflation ≈ 1.1 m ≈ 8 rings at 150 mm
        // cells. A 4-ring window relocated console-sliver spawns but not
        // sofa-sliver ones (the common case).
        if (!rs || r >= r0 + 8) break;    // no region data → old behavior (first hit)
      }
    }
    return best >= 0 ? best : idx;
  }

  // 8-connected A* over the nav grid (no corner cutting: a diagonal step needs
  // both shared orthogonal cells free; octile heuristic). Returns the cell-index
  // path start→goal, or null if unreachable within the explored-node cap.
  private _aStar(start: number, goal: number): number[] | null {
    const n = this._nav!;
    const { nx, ny, blocked } = n;
    const N = nx * ny;
    if (start === goal) return [start];
    const g = new Float64Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1);
    const closed = new Uint8Array(N);
    const SQRT2 = Math.SQRT2, D2 = SQRT2 - 2;
    const gx = goal % nx, gy = (goal / nx) | 0;
    const heur = (idx: number) => {
      const cx = idx % nx, cy = (idx / nx) | 0;
      const ax = Math.abs(cx - gx), ay = Math.abs(cy - gy);
      return (ax + ay) + D2 * Math.min(ax, ay);
    };
    // Binary min-heap keyed on f = g + h.
    const heapIdx: number[] = [];
    const heapF: number[] = [];
    const push = (idx: number, f: number) => {
      heapIdx.push(idx); heapF.push(f);
      let c = heapIdx.length - 1;
      while (c > 0) {
        const par = (c - 1) >> 1;
        if (heapF[par] <= heapF[c]) break;
        [heapF[par], heapF[c]] = [heapF[c], heapF[par]];
        [heapIdx[par], heapIdx[c]] = [heapIdx[c], heapIdx[par]];
        c = par;
      }
    };
    const pop = (): number => {
      const top = heapIdx[0];
      const last = heapIdx.length - 1;
      heapIdx[0] = heapIdx[last]; heapF[0] = heapF[last];
      heapIdx.pop(); heapF.pop();
      let c = 0; const len = heapIdx.length;
      while (true) {
        const l = 2 * c + 1, r = 2 * c + 2; let s = c;
        if (l < len && heapF[l] < heapF[s]) s = l;
        if (r < len && heapF[r] < heapF[s]) s = r;
        if (s === c) break;
        [heapF[s], heapF[c]] = [heapF[c], heapF[s]];
        [heapIdx[s], heapIdx[c]] = [heapIdx[c], heapIdx[s]];
        c = s;
      }
      return top;
    };
    g[start] = 0;
    push(start, heur(start));
    let expanded = 0;
    while (heapIdx.length) {
      const cur = pop();
      if (cur === goal) {
        const path: number[] = [];
        for (let i = goal; i >= 0; i = came[i]) path.push(i);
        path.reverse();
        return path;
      }
      if (closed[cur]) continue;
      closed[cur] = 1;
      if (++expanded > 4000) return null;
      const cx = cur % nx, cy = (cur / nx) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ncx = cx + dx, ncy = cy + dy;
          if (ncx < 0 || ncy < 0 || ncx >= nx || ncy >= ny) continue;
          const ni = ncy * nx + ncx;
          if (blocked[ni] || closed[ni]) continue;
          if (dx !== 0 && dy !== 0) {
            // No corner cutting: both shared orthogonals must be free.
            if (blocked[cy * nx + ncx] || blocked[ncy * nx + cx]) continue;
          }
          const step = (dx !== 0 && dy !== 0) ? SQRT2 : 1;
          const ng = g[cur] + step;
          if (ng < g[ni]) {
            g[ni] = ng; came[ni] = cur;
            push(ni, ng + heur(ni));
          }
        }
      }
    }
    return null;
  }

  // Greedy string-pull: collapse a cell-index path to the fewest scene-coord
  // waypoints whose consecutive legs each have world-space line of sight.
  // `goalScene` overrides the final waypoint with the exact target position so
  // the figure lands precisely rather than on the goal cell's center.
  private _stringPull(cells: number[], goalScene: { x: number; z: number }): { x: number; z: number }[] {
    const sceneOf = (i: number, isLast: boolean) => isLast ? goalScene : this._cellToScene(cells[i]);
    const worldOf = (s: { x: number; z: number }) => ({ x: this._fw / 2 - s.x, y: s.z + this._fd / 2 });
    const out: { x: number; z: number }[] = [];
    let anchorScene = sceneOf(0, cells.length === 1);
    for (let i = 2; i < cells.length; i++) {
      const isLast = i === cells.length - 1;
      const cand = sceneOf(i, isLast);
      const aw = worldOf(anchorScene), cw = worldOf(cand);
      if (!this._losClearWorld(aw.x, aw.y, cw.x, cw.y)) {
        // Previous cell becomes a committed waypoint; re-anchor there.
        const prevScene = sceneOf(i - 1, false);
        out.push(prevScene);
        anchorScene = prevScene;
      }
    }
    out.push(goalScene);  // exact target as the final waypoint
    return out;
  }

  // Steer a humanoid toward the raw target this frame, routing around obstacles.
  // The CARROT (`h.carrot*`) is the pathfinding walker — all region / LOS / A*
  // math below runs off it, and `_seek` slides it along the route; nav is then a
  // critically damped spring shadow of the carrot (velocity-continuous render).
  // Chooses among: straight seek (no obstacles / direct LOS), a cached path
  // (grid + goal cell unchanged, next waypoint still reachable), or a fresh A*
  // plan. On an unreachable goal it falls back to a straight seek (clip through
  // rather than freeze). Mutates h.carrot*/h.nav*/h.path*.
  private _steerNav(h: Humanoid, t: TargetWorld, dt: number, rawSpeedMms: number): void {
    const nav = this._nav;
    const goalP = this._w(t.x, t.y, 0);
    let goalScene = { x: goalP.x, z: goalP.z };

    // No grid, or an entirely free floor → straight-line seek, no path.
    if (!nav || nav.blockedCount === 0) {
      h.path = null; h.pathRev = -1; h.goalCell = -1;
      this._seek(h, null, goalScene, dt, rawSpeedMms);
      return;
    }

    const navWx = this._fw / 2 - h.carrotX, navWy = h.carrotZ + this._fd / 2;
    const navRegion = this._regionOfWorld(navWx, navWy);
    // Effective goal: if the radar drops the person inside a footprint (seated /
    // leaning) OR on the far side of a wall from where the rig actually is
    // (radar sees through walls; a goal inside a counter can back onto another
    // room), retarget to the nearest free cell IN THE RIG'S OWN REGION so the
    // detour stays reachable and never crosses the wall.
    let goalCell = this._cellIdxOf(t.x, t.y);
    if (nav.blocked[goalCell] || nav.region[goalCell] !== navRegion) {
      goalCell = this._nearestFreeCellInRegion(goalCell, navRegion);
      goalScene = this._cellToScene(goalCell);
    }
    const goalWx = this._fw / 2 - goalScene.x, goalWy = goalScene.z + this._fd / 2;

    // Direct line of sight → steer straight, drop any cached path.
    if (this._losClearWorld(navWx, navWy, goalWx, goalWy)) {
      h.path = null; h.pathRev = -1; h.goalCell = goalCell;
      this._seek(h, null, goalScene, dt, rawSpeedMms);
      return;
    }

    // Reuse the cached path when the grid + goal cell are unchanged and the next
    // waypoint is still directly reachable; otherwise replan with A*.
    const reusable = h.path && h.path.length > 0 && h.pathRev === nav.rev &&
      h.goalCell === goalCell &&
      this._losClearWorld(navWx, navWy,
        this._fw / 2 - h.path[0].x, h.path[0].z + this._fd / 2);
    if (!reusable) {
      const navCell = this._nearestFreeCell(this._cellIdxOf(navWx, navWy));
      const cells = this._aStar(navCell, goalCell);
      if (cells && cells.length > 1) {
        h.path = this._stringPull(cells, goalScene);
        h.pathRev = nav.rev; h.goalCell = goalCell;
      } else {
        // Unreachable within the node cap → straight seek fallback.
        h.path = null; h.pathRev = -1; h.goalCell = goalCell;
        this._seek(h, null, goalScene, dt, rawSpeedMms);
        return;
      }
    }
    this._seek(h, h.path, goalScene, dt, rawSpeedMms);
  }

  // Advance the CARROT along the route (waypoints, or straight toward the goal
  // when no path) at a speed tracking the target's real motion, with a distance
  // catch-up term so a figure that detoured can close the gap. The carrot slides
  // by arc-length and turns corners exactly on the polyline — it NEVER pops — so
  // when nav chases it with the spring below, the rendered velocity stays
  // continuous through waypoint transitions (the pre-pathfinding motion was a
  // spring and was praised for exactly this; the old code advanced nav directly
  // and jerked at every corner). Consumes reached waypoints (≤ 120 mm) from the
  // (mutated) path. Then springs nav toward the carrot. Uses the CLAMPED dt.
  private _seek(h: Humanoid, path: { x: number; z: number }[] | null,
                goal: { x: number; z: number }, dt: number, rawSpeedMms: number): void {
    let seek = Math.max(300, Math.min(2200, 1.15 * rawSpeedMms));
    const far = Math.hypot(h.carrotX - goal.x, h.carrotZ - goal.z);
    if (far > 1200) seek += Math.min(800, far - 1200);
    let travel = seek * dt;
    for (let guard = 0; guard < 16 && travel > 1e-3; guard++) {
      while (path && path.length &&
             Math.hypot(path[0].x - h.carrotX, path[0].z - h.carrotZ) <= 120) path.shift();
      const wp = (path && path.length) ? path[0] : goal;
      const dxw = wp.x - h.carrotX, dzw = wp.z - h.carrotZ;
      const d = Math.hypot(dxw, dzw);
      if (d < 1e-3) break;
      if (d <= travel) {
        h.carrotX = wp.x; h.carrotZ = wp.z; travel -= d;
        if (path && path.length) path.shift(); else break;
      } else {
        h.carrotX += (dxw / d) * travel; h.carrotZ += (dzw / d) * travel; travel = 0;
      }
    }
    this._springNav(h, dt);
  }

  // Critically damped spring driving nav toward the carrot — identical math to
  // Planner.stepLerp (ω = 9 rad/s, ~0.6 s settle, trails ~0.3 m at walk speed).
  // MUST substep so ω·h ≤ ~0.36: a single semi-implicit Euler step at the 0.1 s
  // dt clamp puts ω·dt at 0.9, where the velocity coefficient (1 − 2ω·dt) goes
  // negative and the spring DIVERGES/rings — documented gotcha, don't inline a
  // single step. Velocity state (nvx/nvz) is what keeps rendered motion
  // velocity-continuous when the carrot turns a corner.
  private _springNav(h: Humanoid, dt: number): void {
    const w = 9;
    const steps = Math.max(1, Math.ceil(dt / 0.04));
    const hs = dt / steps;
    for (let k = 0; k < steps; k++) {
      h.nvx += ((h.carrotX - h.navX) * w * w - 2 * w * h.nvx) * hs;
      h.nvz += ((h.carrotZ - h.navZ) * w * w - 2 * w * h.nvz) * hs;
      h.navX += h.nvx * hs;
      h.navZ += h.nvz * hs;
    }
  }

  // Re-anchor the carrot onto nav and kill the spring velocity. Called whenever
  // nav is hard-set (spawn, snap out of a footprint, respawn) or held by an
  // anchored pose — otherwise a stale carrot left across a wall would make the
  // straight-line spring drag nav through it when walking resumes.
  private _pinCarrot(h: Humanoid): void {
    h.carrotX = h.navX; h.carrotZ = h.navZ; h.nvx = 0; h.nvz = 0;
  }

  // Dim floor-label sprite for a room name — quieter than the env-sensor chips
  // (no border, muted fill, smaller world size), billboarded toward the camera.
  private _makeRoomLabelSprite(text: string, placeholder = false): THREE.Sprite {
    const label = text.toUpperCase();
    // Placeholder (unnamed room) labels draw italic + dimmer.
    const font = `${placeholder ? 'italic ' : ''}600 40px system-ui, sans-serif`;
    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d')!;
    ctx.font = font;
    const tw = ctx.measureText(label).width;
    const padX = 20, h = 64;
    cv.width = Math.max(4, Math.ceil(tw + padX * 2));
    cv.height = h;
    ctx.font = font;  // canvas resize resets ctx state
    ctx.fillStyle = placeholder ? 'rgba(205,216,230,0.45)' : 'rgba(205,216,230,0.72)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, cv.width / 2, h / 2 + 2);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false, opacity: 0.85,
    }));
    const H = 360;  // world-mm text height — reads at room scale without dominating
    sprite.scale.set(H * (cv.width / cv.height), H, 1);
    return sprite;
  }

  // Doors + windows live in their own group so floor geometry doesn't churn
  // when only a door/window entity state flips (and vice versa).
  updateDoorsWindows(doors: Door[], windows: WindowType[],
                     stateProvider: StateProvider): void {
    if (!this._scene) return;
    this._clearGroup(this._doorGroup);
    if (doors && doors.length) this._buildDoors(doors, stateProvider);
    if (windows && windows.length) this._buildWindows(windows, stateProvider);
  }

  private _buildWindows(windows: WindowType[], stateOf: (id: string) => HassState | null): void {
    const PANE_T = 50;
    const closedMat = this._mat({
      color: 0x64b5f6, emissive: 0x1565c0, emissiveIntensity: 0.2,
      transparent: true, opacity: 0.55, roughness: 0.2, metalness: 0.1,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const openMat = this._mat({
      color: 0x66bb6a, emissive: 0x1b5e20, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.45, roughness: 0.3, metalness: 0.1,
      side: THREE.DoubleSide, depthWrite: false,
    });
    // Mullions / meeting rails are OPAQUE frame bars, deliberately thicker than
    // the glass and overlapping the pane edges by a couple mm so their shared
    // planes are hidden (no coincident-face hatching against the transparent
    // sashes — the CLAUDE.md gotcha).
    const frameMat = this._mat({ color: 0x9aa4ad, roughness: 0.6, metalness: 0.1 });
    for (const w of windows) {
      const st = itemState(w, stateOf);
      const isOpen = st?.state === 'on';
      const mat = isOpen ? openMat : closedMat;
      const kind = w.kind ?? 'single';
      const sill = w.sill ?? WINDOW_DEFAULTS.sill;      // bottom of glass
      const glassH = w.height ?? WINDOW_DEFAULTS.height; // glass height
      const W = w.w;
      const cy = sill + glassH / 2;                     // vertical center of glazing
      // Pane center group at (w.x, w.y); rotation matches wall axis.
      const grp = new THREE.Group();
      const wp = this._w(w.x, w.y, 0);
      grp.position.set(wp.x, wp.y, wp.z);
      grp.rotation.y = -((w.rotation || 0) * Math.PI / 180);
      const glass = (pw: number, ph: number) => new THREE.Mesh(new THREE.BoxGeometry(pw, ph, PANE_T), mat);
      const bar = (bw: number, bh: number) => new THREE.Mesh(new THREE.BoxGeometry(bw, bh, PANE_T * 1.6), frameMat);
      switch (kind) {
        case 'picture': {
          // Fixed single pane; open state = tint only (no movement).
          const p = glass(W, glassH); p.position.set(0, cy, 0);
          grp.add(p);
          break;
        }
        case 'double_hung': {
          // Two stacked sashes at slightly different depths + a horizontal
          // meeting rail; the lower sash slides up behind the upper when open.
          const sashH = glassH / 2 - 20;
          const upper = glass(W, sashH); upper.position.set(0, cy + glassH / 4 + 10, 12);
          const lower = glass(W, sashH); lower.position.set(0, cy - glassH / 4 - 10, -12);
          if (isOpen) lower.position.y = upper.position.y;  // raised behind the upper sash
          const rail = bar(W + 6, 46); rail.position.set(0, cy, 0);
          grp.add(upper, lower, rail);
          break;
        }
        case 'casement_pair': {
          // Vertical center mullion + two leaves hinged on their OUTER edges,
          // swinging open symmetrically (each about its outer vertical edge).
          const mull = bar(54, glassH); mull.position.set(0, cy, 0);
          grp.add(mull);
          const leafW = (W - 50) / 2;
          for (const side of [-1, 1]) {
            const hinge = new THREE.Group();
            hinge.position.set(side * W / 2, cy, 0);       // outer vertical edge
            const leaf = glass(leafW, glassH);
            leaf.position.set(-side * leafW / 2, 0, 0);    // extends inward toward the mullion
            hinge.add(leaf);
            if (isOpen) hinge.rotation.y = side * (Math.PI / 5);  // swing outward
            grp.add(hinge);
          }
          break;
        }
        case 'sliding': {
          // Two side-by-side sashes at slightly different depths; the movable
          // (right) sash slides behind its neighbor when open.
          const sashW = W / 2;
          const left = glass(sashW, glassH); left.position.set(-sashW / 2, cy, 12);
          const right = glass(sashW, glassH);
          right.position.set(isOpen ? -sashW / 2 : sashW / 2, cy, -12);  // slides behind `left`
          const mull = bar(40, glassH); mull.position.set(0, cy, 0);
          grp.add(left, right, mull);
          break;
        }
        default: {  // 'single' — legacy one pane; tilts outward when open
          const p = glass(W, glassH); p.position.set(0, cy, 0);
          if (isOpen) { p.rotation.x = -Math.PI / 6; p.position.z = PANE_T; }
          grp.add(p);
          break;
        }
      }
      this._shadowFlags(grp);
      this._doorGroup.add(grp);
    }
  }

  private _buildDoors(doors: Door[], stateOf: (id: string) => HassState | null): void {
    const DOOR_H = 2000, DOOR_T = 60;
    const closedMat = this._mat({
      color: 0x90a4ae, roughness: 0.65, metalness: 0.1,
    });
    const openMat = this._mat({
      color: 0x66bb6a, emissive: 0x1b5e20, emissiveIntensity: 0.35,
      roughness: 0.5, metalness: 0.1,
    });
    for (const d of doors) {
      const st = itemState(d, stateOf);
      const isOpen = st?.state === 'on';
      const mat = isOpen ? openMat : closedMat;
      // Hinge Group at world (d.x, d.y). Closed panel runs along world +X at
      // rotation 0; world +X maps to scene -X via _w's mirror, so the panel
      // child is positioned at scene-local (-w/2, ...). Without this sign
      // flip the panel renders on the wrong side of the hinge and the open
      // swing animates in the opposite direction from the 2D plan.
      const hinge = new THREE.Group();
      const hp = this._w(d.x, d.y, 0);
      hinge.position.set(hp.x, hp.y, hp.z);
      // 2D rotation is screen-CW. In scene the X-mirror flips the sense, so
      // negate. Open swing direction depends on hinge side: right-hinge
      // swings screen-CCW (+π/2 around scene-Y); left-hinge swings screen-CW
      // (-π/2). doorOpenDeltaDeg returns degrees in world screen-CW; negate
      // for scene-Y rotation.
      const rotR = -((d.rotation || 0) * Math.PI / 180);
      const openR = isOpen ? -(doorOpenDeltaDeg(d) * Math.PI / 180) : 0;
      hinge.rotation.y = rotR + openR;

      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(d.w, DOOR_H, DOOR_T),
        mat,
      );
      panel.position.set(-d.w / 2, DOOR_H / 2, 0);
      hinge.add(panel);
      // Lock deadbolt (Feature 2, display only): a small emissive box near the
      // free edge (opposite the hinge). Red = locked, green = unlocked, grey =
      // unknown/unavailable. Held proud of the panel face (coincident-face gotcha).
      if (d.lockEntity) {
        const ls = itemState({ entity_id: d.lockEntity }, stateOf)?.state;
        const lc = ls === 'locked' ? 0xef5350 : ls === 'unlocked' ? 0x66bb6a : 0x90a4ae;
        const bolt = new THREE.Mesh(
          new THREE.BoxGeometry(70, 100, 34),
          this._mat({ color: lc, emissive: lc, emissiveIntensity: ls ? 0.85 : 0.25 }));
        bolt.position.set(-d.w + 100, DOOR_H * 0.5, DOOR_T / 2 + 12);
        bolt.userData.outlineSkip = true;
        hinge.add(bolt);
      }
      this._addOutlines(hinge);
      this._doorGroup.add(hinge);
    }
  }

  // Build one furniture group at world (fu.x, fu.y). Local +Z = world +Y
  // (the "front" / backrest side for kinds that have one). `rotation` is
  // screen-CW degrees in the 2D plan; in scene space we negate it because
  // _w mirrors world +X.
  private _buildFurniture(fu: { x: number; y: number; w: number; h: number;
                                 kind?: import('./types.js').FurnitureKind;
                                 rotation?: number; elevation?: number;
                                 color?: string; customKindId?: string },
                          neighbors?: Furniture[],
                          customObjects?: ObjectRecipe[],
                          opts?: { applianceOn?: boolean;
                                   doorSink?: { pivot: THREE.Object3D; axis: 'x' | 'y'; openAngle: number }[] }): THREE.Group {
    const recipe = fu.customKindId ? customObjects?.find(o => o.id === fu.customKindId) : undefined;
    const def = recipe ?? furnitureDef(fu);
    const W = fu.w, D = fu.h, HT = def.ht;
    // Per-piece color override wins over the kind/recipe default tint. Custom
    // recipe primitives that fix their own color/role keep it (see
    // _buildFromRecipe); the override only flows into `tint`, which the
    // wood/cushion/steel/panel materials below pick up.
    const tint = furnitureColor(fu, customObjects);
    // Opaque PBR materials. Furniture used to be ~55% transparent, which read
    // as ghostly and produced depth-sort artifacts; with the scene environment
    // map (see _init) opaque standard materials pick up soft reflections and
    // look far more physical for zero per-frame cost.
    const wood = this._mat({
      color: tint, metalness: 0.05, roughness: 0.7,
      side: THREE.DoubleSide,
    });
    const dark = this._mat({
      color: 0x2b1d18, roughness: 0.8, metalness: 0.05,
    });
    const cushion = this._mat({
      color: tint, roughness: 0.95, metalness: 0.0,
    });
    const pillow = this._mat({
      color: 0xeceff1, roughness: 0.9, metalness: 0.0,
    });
    const steel = this._mat({
      color: tint, metalness: 0.75, roughness: 0.3,
    });
    const porcelain = this._mat({
      color: 0xf5f5f0, metalness: 0.0, roughness: 0.15,
    });
    const screen = this._mat({
      color: 0x0a0d12, metalness: 0.4, roughness: 0.12,
    });
    const glass = this._mat({
      color: 0xd7e5ea, metalness: 0.1, roughness: 0.05,
      transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide,
    });
    const leaf = this._mat({
      color: 0x4c8c2b, roughness: 0.9, metalness: 0.0,
    });

    const grp = new THREE.Group();
    const center = this._w(fu.x, fu.y, 0);
    grp.position.set(center.x, center.y + (fu.elevation ?? 0), center.z);
    grp.rotation.y = -((fu.rotation || 0) * Math.PI / 180);

    const addBox = (sx: number, sy: number, sz: number, mat: THREE.Material,
                    px: number, py: number, pz: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
      m.position.set(px, py, pz);
      grp.add(m);
      return m;
    };
    const addCyl = (rTop: number, rBot: number, hgt: number, mat: THREE.Material,
                    px: number, py: number, pz: number, radial = 16) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, hgt, radial), mat);
      m.position.set(px, py, pz);
      grp.add(m);
      return m;
    };

    // A well face is left OPEN when another sunken stair-family piece
    // adjoins it (flight → landing → flight compositions must connect, not
    // brick each other over). Probes a point just beyond the face center.
    const faceOpen = (lxOff: number, lyOff: number): boolean => {
      if (!neighbors) return false;
      const wpt = furnitureLocalToWorld(fu.rotation, lxOff, lyOff);
      const px = fu.x + wpt.x, py = fu.y + wpt.y;
      return neighbors.some(nb => {
        if (nb.x === fu.x && nb.y === fu.y && nb.w === fu.w && nb.h === fu.h &&
            nb.kind === fu.kind && nb.rotation === fu.rotation) return false;
        if (!(nb.kind === 'stairs' || nb.kind === 'stairs_half' || nb.kind === 'stair_landing')) return false;
        if ((nb.elevation ?? 0) >= 0) return false;
        const l = furnitureWorldToLocal(nb.rotation, px - nb.x, py - nb.y);
        return Math.abs(l.x) <= nb.w / 2 + 60 && Math.abs(l.y) <= nb.h / 2 + 60;
      });
    };

    const kind = fu.kind ?? 'block';
    // Custom object recipes build from their generic primitive list, then get
    // the SAME Sims dressing (outlines + blob) as built-in kinds below. A
    // per-piece color override recolors ONLY the primitives that left their
    // color unset (recipe primitives with an explicit color keep it).
    if (recipe) this._buildFromRecipe(grp, recipe, fu.color ? hexToInt(fu.color) : undefined);
    else switch (kind) {
      case 'rug':
        addBox(W, HT, D, wood, 0, HT / 2, 0);
        break;
      case 'table':
      case 'desk': {
        const topT = 50;
        addBox(W, topT, D, wood, 0, HT - topT / 2, 0);
        // Apron rails under the top connect the legs — reads as real joinery.
        const apronH = 90, apronY = HT - topT - apronH / 2;
        addBox(W - 120, apronH, 24, dark, 0, apronY, D / 2 - 60);
        addBox(W - 120, apronH, 24, dark, 0, apronY, -(D / 2 - 60));
        addBox(24, apronH, D - 120, dark, W / 2 - 60, apronY, 0);
        addBox(24, apronH, D - 120, dark, -(W / 2 - 60), apronY, 0);
        // 4 slightly tapered legs
        const legT = 55, legH = HT - topT;
        const xo = W / 2 - legT / 2 - 15, zo = D / 2 - legT / 2 - 15;
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
          addBox(legT, legH, legT, dark, sx * xo, legH / 2, sz * zo);
        }
        break;
      }
      case 'chair':
      case 'rocking_chair': {
        const seatT = 60, seatY = (def.seat ?? 450) - seatT / 2;
        addBox(W, seatT, D, cushion, 0, seatY, 0);
        // Backrest on +Z side.
        const backT = 60, backH = HT - (def.seat ?? 450);
        addBox(W, backH, backT, cushion, 0, (def.seat ?? 450) + backH / 2, D / 2 - backT / 2);
        // Legs (or rockers).
        if (kind === 'rocking_chair') {
          // Curved rocker: 2 thin curved boxes along X.
          const rockY = 30, rockH = 60;
          addBox(W * 0.85, rockH, 40, dark, 0, rockY, -D / 2 + 30);
          addBox(W * 0.85, rockH, 40, dark, 0, rockY, D / 2 - 30);
        } else {
          const legT = 50, legH = (def.seat ?? 450) - seatT;
          const xo = W / 2 - legT / 2, zo = D / 2 - legT / 2;
          for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
            addBox(legT, legH, legT, dark, sx * xo, legH / 2, sz * zo);
          }
        }
        break;
      }
      case 'chaise': {
        const seatT = 80, seatY = (def.seat ?? 400) - seatT / 2;
        addBox(W, seatT, D, cushion, 0, seatY, 0);
        // Low back at the head end. `_w` mirrors X, so the 2D glyph's head end
        // (plan-left, drawn at local -X unmirrored) maps to local +X here — put
        // the back on local +X so 2D and 3D agree on which end the head is.
        const backH = HT - (def.seat ?? 400), backW = W * 0.30;
        addBox(backW, backH, D, cushion, W / 2 - backW / 2, (def.seat ?? 400) + backH / 2, 0);
        // Legs hidden by skirt — single low base plate.
        addBox(W * 0.95, seatY, D * 0.95, dark, 0, seatY / 2, 0);
        break;
      }
      case 'bench': {
        const seatT = 70;
        addBox(W, seatT, D, cushion, 0, HT - seatT / 2, 0);
        const legT = 60, legH = HT - seatT;
        const xo = W / 2 - legT, zo = D / 2 - legT / 2;
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
          addBox(legT, legH, legT, dark, sx * xo, legH / 2, sz * zo);
        }
        break;
      }
      case 'sofa_l_left':
      case 'sofa_l_right':
      case 'sofa_u': {
        // Sectionals: back band + main seat along +Z (the back), return
        // arm(s) reaching toward the front (-Z). NOTE `_w` mirrors X, so
        // world/plan +X = local -X and plan-left (world -X) = local +X. The
        // return therefore goes on local +X for the *left* variant and local
        // -X for the *right* variant so the chaise lands on the labelled plan
        // side and matches the 2D glyph (which draws unmirrored).
        const seatH2 = def.seat ?? 450;
        const seatT = 100, seatY = seatH2 - seatT / 2;
        const backH = HT - seatH2, backT = 220;
        const mainD = Math.min(950, D * 0.5);
        const retW = Math.min(950, W * (kind === 'sofa_u' ? 0.3 : 0.35));
        const retD = D - mainD, retZ = -mainD / 2;
        addBox(W, backH, backT, cushion, 0, seatH2 + backH / 2, D / 2 - backT / 2);
        addBox(W, seatT, mainD, cushion, 0, seatY, D / 2 - mainD / 2);
        addBox(W, seatY - seatT / 2, mainD * 0.95, dark, 0, (seatY - seatT / 2) / 2, D / 2 - mainD / 2);
        const sides: number[] = kind === 'sofa_u' ? [-1, 1]
          : [kind === 'sofa_l_left' ? 1 : -1];
        for (const sx of sides) {
          addBox(retW, seatT, retD, cushion, sx * (W / 2 - retW / 2), seatY, retZ);
          addBox(retW, seatY - seatT / 2, retD * 0.95, dark, sx * (W / 2 - retW / 2), (seatY - seatT / 2) / 2, retZ);
          // Outer arm runs the FULL side — from the back band to the chaise
          // front — and rises well above the seat cushions so it reads as an
          // arm from every angle (0.62·HT barely cleared the 450 mm seat).
          addBox(180, HT * 0.78, D - backT, cushion, sx * (W / 2 - 90), HT * 0.78 / 2, -backT / 2);
        }
        // Armrest on any main-run end without a return.
        for (const sx of [-1, 1]) {
          if (sides.includes(sx)) continue;
          addBox(180, HT * 0.8, mainD, cushion, sx * (W / 2 - 90), HT * 0.8 / 2, D / 2 - mainD / 2);
        }
        break;
      }
      case 'sofa': {
        const seatH2 = def.seat ?? 450;
        const seatT = 110, seatY = seatH2 - seatT / 2;
        const armW = W * 0.08;
        // Plinth sits BETWEEN the armrests — a full-width plinth put its side
        // faces exactly coplanar with the armrest outer faces (dark vs
        // cushion z-fight, invisible under PBR, ugly hatching under toon).
        addBox(W - armW * 2, seatY - seatT / 2, D * 0.96, dark, 0, (seatY - seatT / 2) / 2, 0);
        addBox(W, seatT, D, cushion, 0, seatY, 0);
        // Seat cushion seams (one per ~700 mm of width).
        const seamMat = this._mat({ color: 0x1f262b, roughness: 0.95 });
        const nCush = Math.max(2, Math.round(W / 700));
        for (let k = 1; k < nCush; k++) {
          addBox(12, seatT * 0.5, D * 0.9, seamMat, -W / 2 + (W * k) / nCush, seatH2 - seatT * 0.2, -D * 0.02);
        }
        // Back band on +Z.
        const backH = HT - seatH2, backT = D * 0.25;
        addBox(W, backH, backT, cushion, 0, seatH2 + backH / 2, D / 2 - backT / 2);
        // Armrests on -X / +X sides.
        addBox(armW, HT * 0.85, D, cushion, -W / 2 + armW / 2, HT * 0.85 / 2, 0);
        addBox(armW, HT * 0.85, D, cushion,  W / 2 - armW / 2, HT * 0.85 / 2, 0);
        break;
      }
      case 'bed': {
        // Frame + mattress + blanket + pillows.
        addBox(W + 60, HT * 0.45, D + 60, dark, 0, HT * 0.45 / 2, 0);  // frame/box spring
        addBox(W, HT * 0.6, D, pillow, 0, HT * 0.45 + HT * 0.3, 0);   // mattress (white)
        // Blanket draped over the foot 2/3 of the bed, slightly wider AND
        // slightly proud of the mattress foot face — a shared front plane
        // z-fought (white vs tint) under flat toon shading.
        const blanket = this._mat({ color: tint, roughness: 0.95 });
        const blD = D * 0.62 + 30;
        const bl = new THREE.Mesh(new THREE.BoxGeometry(W + 20, 60, blD), blanket);
        bl.position.set(0, HT * 0.45 + HT * 0.6 - 10, -D / 2 - 30 + blD / 2);
        grp.add(bl);
        // Headboard on +Z side.
        const hbH = 800, hbT = 60;
        addBox(W, hbH, hbT, dark, 0, hbH / 2, D / 2 + hbT / 2);
        // Two pillows.
        const pw = W * 0.42, pd = D * 0.18, ph = 90;
        addBox(pw, ph, pd, pillow, -W * 0.22, HT * 1.05 + ph / 2, D / 2 - pd / 2 - 50);
        addBox(pw, ph, pd, pillow,  W * 0.22, HT * 1.05 + ph / 2, D / 2 - pd / 2 - 50);
        break;
      }
      case 'bookshelf': {
        // Open shelving: side panels + back + real shelf boards (not a
        // solid slab with painted lines).
        const panelT = 25;
        addBox(panelT, HT, D, wood, -W / 2 + panelT / 2, HT / 2, 0);
        addBox(panelT, HT, D, wood, W / 2 - panelT / 2, HT / 2, 0);
        addBox(W, HT, panelT, wood, 0, HT / 2, D / 2 - panelT / 2);  // back (+Z)
        addBox(W, panelT, D, wood, 0, HT - panelT / 2, 0);           // top
        const inner2 = W - panelT * 2;
        for (const t of [0.02, 0.25, 0.5, 0.75]) {
          addBox(inner2, 22, D * 0.94, wood, 0, Math.max(12, HT * t), 0);
        }
        break;
      }
      case 'stairs':
      case 'stairs_half': {
        // Solid stacked steps rising toward local +Z (the plan-top). Tread
        // count follows the run depth (~280 mm treads); riser = HT / n.
        const n = Math.max(3, Math.round(D / 280));
        const riser = HT / n, treadD = D / n;
        const treadMat = this._mat({ color: 0xa1887f, roughness: 0.6 });
        for (let i = 0; i < n; i++) {
          const hStep = riser * (i + 1);
          addBox(W, hStep, treadD, wood, 0, hStep / 2, -D / 2 + (i + 0.5) * treadD);
          // Tread cap for a visible nosing line.
          addBox(W, 22, treadD, treadMat, 0, hStep - 11, -D / 2 + (i + 0.5) * treadD);
        }
        // Sunk below the floor (descending flight): line the stairwell with
        // dark shaft walls up to floor level so the opening reads as a well.
        if ((fu.elevation ?? 0) < 0) {
          const shaftMat = this._mat({
            color: 0x2a2d31, roughness: 0.9, side: THREE.DoubleSide,
          });
          const wellH = -(fu.elevation ?? 0);
          // Skip any face that connects to an adjoining sunken stair piece
          // (e.g. this flight's top meeting a landing) — walling it over
          // blocked the staircase.
          if (!faceOpen(-W / 2 - 150, 0)) addBox(24, wellH, D, shaftMat, -W / 2 + 12, wellH / 2, 0);
          if (!faceOpen(W / 2 + 150, 0))  addBox(24, wellH, D, shaftMat, W / 2 - 12, wellH / 2, 0);
          if (!faceOpen(0, D / 2 + 150))  addBox(W, wellH, 24, shaftMat, 0, wellH / 2, D / 2 - 12);
        }
        break;
      }
      case 'stair_landing': {
        addBox(W, HT - 40, D, wood, 0, (HT - 40) / 2, 0);
        addBox(W * 1.02, 40, D * 1.02,
               this._mat({ color: 0xa1887f, roughness: 0.6 }),
               0, HT - 20, 0);
        // Sunk landings line their well with shaft walls from the landing
        // surface up to floor level (same treatment as sunken stairs).
        if ((fu.elevation ?? 0) < 0) {
          const shaftMat = this._mat({
            color: 0x2a2d31, roughness: 0.9, side: THREE.DoubleSide,
          });
          const floorLvl = -(fu.elevation ?? 0);  // local y of this floor's level
          const wallH2 = Math.max(0, floorLvl - HT);
          if (wallH2 > 10) {
            // Faces adjoining sunken flights stay open (that's the path).
            if (!faceOpen(-W / 2 - 150, 0)) addBox(24, wallH2, D, shaftMat, -W / 2 + 12, HT + wallH2 / 2, 0);
            if (!faceOpen(W / 2 + 150, 0))  addBox(24, wallH2, D, shaftMat, W / 2 - 12, HT + wallH2 / 2, 0);
            if (!faceOpen(0, D / 2 + 150))  addBox(W, wallH2, 24, shaftMat, 0, HT + wallH2 / 2, D / 2 - 12);
            if (!faceOpen(0, -D / 2 - 150)) addBox(W, wallH2, 24, shaftMat, 0, HT + wallH2 / 2, -D / 2 + 12);
          }
        }
        break;
      }
      // ── casework: box body + top slab + door/drawer seams on the front
      // (front = local -Z; local +Z is the back, same side as chair backrests)
      case 'tv_stand':
      case 'dresser':
      case 'nightstand':
      case 'wardrobe':
      case 'cabinet':
      case 'counter':
      case 'island': {
        addBox(W, HT - 30, D, wood, 0, (HT - 30) / 2, 0);
        const topMat = kind === 'counter' || kind === 'island'
          ? this._mat({ color: 0xcfd8dc, roughness: 0.25, metalness: 0.05 })
          : dark;
        addBox(W * 1.02, 30, D * 1.02, topMat, 0, HT - 15, 0);
        // Proud door / drawer fronts with metal pulls on the front face
        // (-Z). Panels float 8 mm off the carcass so the gaps read as real
        // joinery lines from any angle.
        const panelMat = this._mat({ color: tint, roughness: 0.55, metalness: 0.05 });
        const pull = this._mat({ color: 0x3a444d, metalness: 0.8, roughness: 0.35 });
        const door = (cx: number, w0: number, y0: number, h0: number, handleX: number) => {
          addBox(w0, h0, 16, panelMat, cx, y0 + h0 / 2, -D / 2 - 8);
          addBox(22, Math.min(260, h0 * 0.45), 20, pull, handleX, y0 + h0 * 0.55, -D / 2 - 28);
        };
        const drawer = (y0: number, h0: number, w0 = W - 60) => {
          addBox(w0, h0, 16, panelMat, 0, y0 + h0 / 2, -D / 2 - 8);
          addBox(Math.min(w0 * 0.4, 340), 20, 20, pull, 0, y0 + h0 / 2, -D / 2 - 28);
        };
        if (kind === 'dresser' || kind === 'nightstand') {
          const n = kind === 'dresser' ? 3 : 2;
          const gap = 16, yBot = 60, yTop = HT - 60;
          const dh = (yTop - yBot - (n - 1) * gap) / n;
          for (let i = 0; i < n; i++) drawer(yBot + i * (dh + gap), dh);
        } else if (kind === 'wardrobe' || kind === 'cabinet') {
          // Double doors, pulls flanking the center split.
          const dw = W / 2 - 26, dh = HT - 130;
          door(-W / 4 + 4, dw, 50, dh, -46);
          door(W / 4 - 4, dw, 50, dh, 46);
        } else {
          // tv_stand / counter / island: a run of doors sized to the width,
          // each pull toward its right edge.
          const nd = Math.max(2, Math.round(W / 600));
          const dw = W / nd - 18;
          const yBot = kind === 'tv_stand' ? 60 : 90;
          const dh = HT - yBot - 70;
          for (let i = 0; i < nd; i++) {
            const cx = -W / 2 + (i + 0.5) * (W / nd);
            door(cx, dw, yBot, dh, cx + dw * 0.32);
          }
        }
        break;
      }
      case 'ottoman':
        addBox(W, HT, D, cushion, 0, HT / 2, 0);
        break;
      case 'stool': {
        const seatT = 50;
        addCyl(W / 2, W / 2, seatT, cushion, 0, HT - seatT / 2, 0);
        addCyl(35, 35, HT - seatT, dark, 0, (HT - seatT) / 2, 0, 10);
        addCyl(W / 2.6, W / 2.6, 25, dark, 0, 14, 0);
        break;
      }
      case 'plant': {
        const potH = HT * 0.28;
        addCyl(W * 0.32, W * 0.24, potH, this._mat({ color: 0x8d5524, roughness: 0.8 }), 0, potH / 2, 0, 12);
        const s1 = new THREE.Mesh(new THREE.SphereGeometry(W * 0.42, 10, 8), leaf);
        s1.position.set(0, HT * 0.7, 0); grp.add(s1);
        const s2 = new THREE.Mesh(new THREE.SphereGeometry(W * 0.3, 10, 8), leaf);
        s2.position.set(W * 0.2, HT * 0.5, -W * 0.12); grp.add(s2);
        const s3 = new THREE.Mesh(new THREE.SphereGeometry(W * 0.26, 10, 8), leaf);
        s3.position.set(-W * 0.2, HT * 0.55, W * 0.1); grp.add(s3);
        break;
      }
      // ── appliances (front = -Z) ──
      case 'fridge': {
        addBox(W, HT, D, steel, 0, HT / 2, 0);
        const seam = this._mat({ color: 0x546069, roughness: 0.6 });
        addBox(W * 0.96, 10, 6, seam, 0, HT * 0.65, -D / 2 - 2);           // freezer split
        addBox(24, HT * 0.28, 20, seam, -W * 0.32, HT * 0.42, -D / 2 - 14); // handle
        addBox(24, HT * 0.2, 20, seam, -W * 0.32, HT * 0.82, -D / 2 - 14);  // freezer handle
        // Door: ALWAYS built CLOSED as a child of a hinge Group at the front-
        // right vertical edge, registered in _applianceDoors so the per-frame
        // blend swings it (bound-fridge doorEntity / unbound localState /
        // avatar proximity). Held proud of the body front so faces never go
        // coplanar (the coincident-face gotcha).
        {
          const doorMat = this._mat({ color: 0xb6bec6, metalness: 0.55, roughness: 0.35, side: THREE.DoubleSide });
          const hinge = new THREE.Group();
          hinge.position.set(W / 2, HT / 2, -D / 2 - 30);   // front-right edge, proud 30 mm
          const panel = new THREE.Mesh(new THREE.BoxGeometry(W, HT * 0.98, 40), doorMat);
          panel.position.set(-W / 2, 0, 0);                 // spans from hinge toward -X
          hinge.add(panel);
          const dh = new THREE.Mesh(new THREE.BoxGeometry(24, HT * 0.3, 24), seam);
          dh.position.set(-W + 24, 0, -24);                 // handle on the free edge
          hinge.add(dh);
          grp.add(hinge);
          opts?.doorSink?.push({ pivot: hinge, axis: 'y', openAngle: -Math.PI * 0.42 });
        }
        break;
      }
      case 'stove': {
        addBox(W, HT - 40, D, steel, 0, (HT - 40) / 2, 0);
        addBox(W, 40, D, screen, 0, HT - 20, 0);  // dark cooktop
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
          addCyl(W * 0.14, W * 0.14, 8, dark, sx * W * 0.22, HT + 4, sz * D * 0.2, 20);
        }
        const seam = this._mat({ color: 0x546069, roughness: 0.6 });
        addBox(W * 0.94, 10, 6, seam, 0, HT * 0.9, -D / 2 - 2);  // control strip above door
        // Oven door: folds DOWN ~80° about its bottom edge. Built closed +
        // registered; the per-frame blend animates it (unbound liveliness).
        {
          const doorMat = this._mat({ color: tint, metalness: 0.7, roughness: 0.32, side: THREE.DoubleSide });
          const doorH = HT * 0.5;
          const hinge = new THREE.Group();
          hinge.position.set(0, HT * 0.12, -D / 2 - 20);      // bottom-front edge, proud
          const panel = new THREE.Mesh(new THREE.BoxGeometry(W * 0.86, doorH, 40), doorMat);
          panel.position.set(0, doorH / 2, 0);                // spans upward from the hinge
          hinge.add(panel);
          const handle = new THREE.Mesh(new THREE.BoxGeometry(W * 0.7, 24, 24), seam);
          handle.position.set(0, doorH - 40, -22);
          hinge.add(handle);
          grp.add(hinge);
          opts?.doorSink?.push({ pivot: hinge, axis: 'x', openAngle: -Math.PI * 0.44 });
        }
        break;
      }
      case 'dishwasher': {
        addBox(W, HT, D, steel, 0, HT / 2, 0);
        const seam = this._mat({ color: 0x546069, roughness: 0.6 });
        addBox(W * 0.94, 10, 6, seam, 0, HT * 0.94, -D / 2 - 2);  // control strip up top
        // Front panel folds DOWN ~80° about its bottom edge. Built closed +
        // registered for the per-frame open blend.
        {
          const doorMat = this._mat({ color: tint, metalness: 0.7, roughness: 0.32, side: THREE.DoubleSide });
          const doorH = HT * 0.72;
          const hinge = new THREE.Group();
          hinge.position.set(0, HT * 0.1, -D / 2 - 18);       // bottom-front edge, proud
          const panel = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, doorH, 40), doorMat);
          panel.position.set(0, doorH / 2, 0);
          hinge.add(panel);
          const handle = new THREE.Mesh(new THREE.BoxGeometry(W * 0.7, 20, 14), seam);
          handle.position.set(0, doorH - 30, -22);            // handle near the top edge
          hinge.add(handle);
          grp.add(hinge);
          opts?.doorSink?.push({ pivot: hinge, axis: 'x', openAngle: -Math.PI * 0.44 });
        }
        break;
      }
      case 'washer': {
        addBox(W, HT, D, porcelain, 0, HT / 2, 0);
        addBox(W * 0.9, HT * 0.1, 8, screen, 0, HT * 0.92, -D / 2 - 3);  // controls
        // Side-hinged round porthole door (~100° swing). Built closed +
        // registered for the per-frame open blend.
        {
          const doorMat = this._mat({ color: 0x2a2f36, metalness: 0.3, roughness: 0.4 });
          const hinge = new THREE.Group();
          hinge.position.set(-W * 0.3, HT * 0.45, -D / 2 - 12);   // hinge left of the porthole
          const disc = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.28, W * 0.28, 24, 24), doorMat);
          disc.rotation.x = Math.PI / 2;
          disc.position.set(W * 0.28, 0, 0);                       // porthole centered on the front
          hinge.add(disc);
          const win = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.2, W * 0.2, 10, 20), glass);
          win.rotation.x = Math.PI / 2;
          win.position.set(W * 0.28, 0, -8);
          hinge.add(win);
          grp.add(hinge);
          opts?.doorSink?.push({ pivot: hinge, axis: 'y', openAngle: Math.PI * 0.55 });
        }
        break;
      }
      case 'dryer': {
        addBox(W, HT, D, porcelain, 0, HT / 2, 0);
        // Static porthole door (no animation — dryer opens rarely; not a
        // liveliness target per spec).
        const door = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.3, W * 0.3, 24, 24), screen);
        door.rotation.x = Math.PI / 2;
        door.position.set(0, HT * 0.45, -D / 2 - 10);
        grp.add(door);
        addBox(W * 0.9, HT * 0.1, 8, screen, 0, HT * 0.92, -D / 2 - 3);  // controls
        break;
      }
      case 'microwave': {
        addBox(W, HT, D, screen, 0, HT / 2, 0);
        // Side-hinged door (~90° about the left vertical edge). Built closed +
        // registered for the per-frame open blend; a glass window rides it.
        {
          const doorMat = this._mat({ color: 0x2a2f36, metalness: 0.3, roughness: 0.4, side: THREE.DoubleSide });
          const hinge = new THREE.Group();
          hinge.position.set(-W / 2, HT / 2, -D / 2 - 8);     // front-left vertical edge, proud
          const panel = new THREE.Mesh(new THREE.BoxGeometry(W * 0.72, HT * 0.8, 24), doorMat);
          panel.position.set(W * 0.36, 0, 0);                 // spans toward the +X free edge
          hinge.add(panel);
          const win = new THREE.Mesh(new THREE.BoxGeometry(W * 0.5, HT * 0.58, 8), glass);
          win.position.set(W * 0.34, 0, -6);
          hinge.add(win);
          grp.add(hinge);
          opts?.doorSink?.push({ pivot: hinge, axis: 'y', openAngle: Math.PI * 0.5 });
        }
        break;
      }
      case 'tv': {
        const standH = 300;
        const panel = addBox(W, HT - standH, 45, screen, 0, standH + (HT - standH) / 2, 0);
        panel.castShadow = true;
        addCyl(40, 60, standH, dark, 0, standH / 2, 0, 10);
        addBox(W * 0.4, 24, D, dark, 0, 12, 0);  // base plate
        break;
      }
      case 'wall_tv': {
        // Wall-mounted flat TV, NO stand — floats at height. Front faces the
        // room (-Z); a bracket sits behind (+Z) against the wall. Blob shadow
        // is skipped below (it hangs on a wall, not the floor).
        const bezelH = 720, bezelD = 60, scY = 1350;  // screen center height (mm)
        addBox(W, bezelH, bezelD, dark, 0, scY, 0);                       // slim dark bezel
        // Inset screen face, slightly proud of the bezel front (-Z) so it
        // reads inside the frame without coplanar z-fight with the bezel face.
        addBox(W * 0.92, bezelH - 100, 20, screen, 0, scY, -bezelD / 2 - 2);
        // Wall bracket behind the bezel (+Z), up near the top.
        addBox(W * 0.26, 180, 45, dark, 0, scY + bezelH / 2 - 140, bezelD / 2 + 25);
        break;
      }
      // ── bathroom (front = -Z; toilet tank sits at the back +Z) ──
      case 'toilet': {
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.42, W * 0.3, 380, 18), porcelain);
        bowl.scale.z = 1.25;
        bowl.position.set(0, 190, -D * 0.12);
        grp.add(bowl);
        addCyl(W * 0.46, W * 0.44, 50, porcelain, 0, 420, -D * 0.12, 18);  // seat
        addBox(W * 0.96, 360, D * 0.28, porcelain, 0, HT - 180, D / 2 - D * 0.14);  // tank
        break;
      }
      case 'sink': {
        addCyl(70, 90, HT - 120, porcelain, 0, (HT - 120) / 2, 0, 12);   // pedestal
        addCyl(W * 0.48, W * 0.34, 130, porcelain, 0, HT - 65, 0, 18);   // basin
        break;
      }
      case 'sink_vanity': {
        // Cabinet base (casework idiom) + overhanging stone counter with a
        // raised rim framing a recessed basin bowl + a steel faucet at the back.
        const carcassTop = HT - 40;
        addBox(W, carcassTop, D, wood, 0, carcassTop / 2, 0);            // cabinet body
        // Double door split on the front (-Z).
        const vPanel = this._mat({ color: tint, roughness: 0.55, metalness: 0.05 });
        const vPull = this._mat({ color: 0x3a444d, metalness: 0.8, roughness: 0.35 });
        const vdw = W / 2 - 26, vdh = carcassTop - 100;
        for (const sx of [-1, 1]) {
          addBox(vdw, vdh, 16, vPanel, sx * (W / 4 - 4), 50 + vdh / 2, -D / 2 - 8);
          addBox(22, Math.min(240, vdh * 0.45), 20, vPull, sx * 40, 50 + vdh * 0.55, -D / 2 - 28);
        }
        const stone = this._mat({ color: 0xeceff1, roughness: 0.2, metalness: 0.05 });
        // Basin opening: a raised counter rim tiled around a central hole (no
        // boolean cut — front/back bands span full width, side bands fill the
        // gaps, so no overlapping coplanar top faces).
        const openW = W * 0.5, openD = D * 0.5, zc = -D * 0.05;
        const rimBot = carcassTop, rimTop = HT, rimH = rimTop - rimBot;  // 40 mm
        const rimY = rimBot + rimH / 2;
        const zBack = zc + openD / 2, zFront = zc - openD / 2;
        addBox(W + 40, rimH, (D / 2 + 20) - zBack, stone, 0, rimY, (zBack + D / 2 + 20) / 2);   // back band
        addBox(W + 40, rimH, zFront - (-D / 2 - 20), stone, 0, rimY, (zFront + (-D / 2 - 20)) / 2); // front band
        addBox((W + 40) / 2 - openW / 2, rimH, openD, stone, -(openW / 2 + ((W + 40) / 2 - openW / 2) / 2), rimY, zc); // left filler
        addBox((W + 40) / 2 - openW / 2, rimH, openD, stone,  (openW / 2 + ((W + 40) / 2 - openW / 2) / 2), rimY, zc); // right filler
        // Recessed bowl: rim top 15 mm below the counter surface.
        addCyl(openW * 0.42, openW * 0.30, 150, porcelain, 0, HT - 15 - 75, zc, 20);
        addCyl(openW * 0.30, openW * 0.30, 12, dark, 0, HT - 15 - 148, zc, 16);  // drain
        // Faucet at the back edge: vertical body + horizontal spout. The shared
        // `steel` mat is tinted by the piece color, so use explicit steel grey.
        const vSteel = this._mat({ color: 0xb8c0c6, metalness: 0.8, roughness: 0.28 });
        const faucetZ = zBack + 30;
        addCyl(16, 18, 200, vSteel, 0, HT + 100, faucetZ, 10);
        const spout = addCyl(12, 12, 130, vSteel, 0, HT + 185, faucetZ - 60, 10);
        spout.rotation.x = Math.PI / 2;
        break;
      }
      case 'kitchen_sink': {
        // Counter-matching cabinet base + stone slab (reusing the counter
        // idiom) with a stainless double basin recessed into it and a tall
        // arched faucet at the back center.
        addBox(W, HT - 30, D, wood, 0, (HT - 30) / 2, 0);               // cabinet base
        const ksTop = this._mat({ color: 0xcfd8dc, roughness: 0.25, metalness: 0.05 });
        // The shared `steel` mat is tinted by the piece color (brown here), so
        // use an explicit stainless grey for the basin + faucet.
        const stainless = this._mat({ color: 0xb8c0c6, metalness: 0.8, roughness: 0.28 });
        // Counter slab as a raised rim tiled around the sink opening.
        const sinkW = W * 0.72, sinkD = D * 0.6, zc = -D * 0.03;
        const rimBot = HT - 30, rimTop = HT, rimH = rimTop - rimBot, rimY = rimBot + rimH / 2;
        const zBack = zc + sinkD / 2, zFront = zc - sinkD / 2;
        addBox(W * 1.02, rimH, (D * 1.02 / 2) - zBack, ksTop, 0, rimY, (zBack + D * 1.02 / 2) / 2);        // back band
        addBox(W * 1.02, rimH, zFront + D * 1.02 / 2, ksTop, 0, rimY, (zFront - D * 1.02 / 2) / 2);        // front band
        const sideW = (W * 1.02) / 2 - sinkW / 2;
        addBox(sideW, rimH, sinkD, ksTop, -(sinkW / 2 + sideW / 2), rimY, zc);   // left filler
        addBox(sideW, rimH, sinkD, ksTop,  (sinkW / 2 + sideW / 2), rimY, zc);   // right filler
        // Stainless double basin, mirroring the vanity bowl trick: two SOLID
        // stainless pans whose tops sit ~20 mm below the counter (so they read
        // recessed) split by a center divider that rises to the rim. Solid tops
        // sit just above the cabinet carcass (rimBot) so no wood shows through
        // — hollow wells buried in the solid cabinet showed the wood floor.
        const div = 60, panTop = HT - 20;                 // 880 mm, 20 below the 900 rim
        addBox(div, rimH + 10, sinkD, stainless, 0, HT - (rimH + 10) / 2, zc);  // center divider, flush at rim
        const panW = sinkW / 2 - div / 2;
        const panCx = div / 2 + panW / 2;
        for (const sx of [-1, 1]) {
          // solid pan: top at panTop (above the cabinet carcass so stainless
          // shows), base sunk into the cabinet.
          addBox(panW, panTop - (rimBot - 50), sinkD, stainless, sx * panCx, (panTop + (rimBot - 50)) / 2, zc);
        }
        // Tall arched faucet at the back center (stainless).
        const kfZ = zBack + 30;
        addCyl(18, 20, 260, stainless, 0, HT + 130, kfZ, 10);
        const kspout = addCyl(14, 14, 200, stainless, 0, HT + 250, kfZ - 90, 10);
        kspout.rotation.x = Math.PI / 2.2;   // gooseneck: slight forward-down arch
        break;
      }
      case 'bathtub': {
        addBox(W, HT, D, porcelain, 0, HT / 2, 0);
        const water = this._mat({
          color: 0x9bc7cf, roughness: 0.2, metalness: 0.05,
        });
        addBox(W * 0.82, 20, D * 0.72, water, 0, HT - 60, 0);  // inner basin hint
        break;
      }
      case 'shower': {
        addBox(W, 80, D, porcelain, 0, 40, 0);  // base pan
        // Glass on the two front-facing sides (leave back corner walls open).
        addBox(W, HT - 80, 12, glass, 0, 80 + (HT - 80) / 2, -D / 2 + 6);
        addBox(12, HT - 80, D, glass, -W / 2 + 6, 80 + (HT - 80) / 2, 0);
        const headArm = this._mat({ color: 0xb9c2c9, metalness: 0.8, roughness: 0.3 });
        addCyl(12, 12, 250, headArm, W * 0.3, HT - 200, D * 0.3, 8);
        const head = new THREE.Mesh(new THREE.SphereGeometry(55, 12, 10), headArm);
        head.position.set(W * 0.3, HT - 320, D * 0.3);
        grp.add(head);
        break;
      }
      // ── extra appliances (front = -Z) ──
      case 'coffee_maker': {
        const bodyD = D * 0.55;
        addBox(W, 28, D, dark, 0, 14, 0);                                       // base slab
        addBox(W, HT - 28, bodyD, wood, 0, 28 + (HT - 28) / 2, D / 2 - bodyD / 2);  // upright body at back
        addBox(W * 0.9, 30, D * 0.42, wood, 0, HT - 15, -D * 0.04);             // brew head over the carafe
        addCyl(W * 0.26, W * 0.3, HT * 0.42, glass, 0, 28 + HT * 0.21, -D * 0.12, 12);  // glass carafe
        break;
      }
      case 'toaster': {
        addBox(W, HT, D, steel, 0, HT / 2, 0);                       // chrome body
        const slotW = W * 0.34, slotD = D * 0.5;
        addBox(slotW, 16, slotD, dark, -W * 0.18, HT + 2, 0);        // two bread slots on top
        addBox(slotW, 16, slotD, dark,  W * 0.18, HT + 2, 0);
        addBox(46, HT * 0.4, 28, dark, W / 2 - 4, HT * 0.42, D * 0.18);  // side lever
        break;
      }
      case 'exercise_equipment': {
        // Treadmill: raised running deck + side rails, uprights + console at
        // the front (-Z), matching the appliance front-faces-camera convention.
        const deckT = 80, deckD = D * 0.72, deckZ = D * 0.12;
        addBox(W, deckT, deckD, dark, 0, 30 + deckT / 2, deckZ);               // deck body
        addBox(W * 0.82, 22, deckD * 0.94, screen, 0, 30 + deckT - 5, deckZ);  // dark running belt
        const railT = 70, railH = 130;
        addBox(railT, railH, deckD, steel, -W / 2 + railT / 2, 30 + deckT + railH / 2 - 6, deckZ);
        addBox(railT, railH, deckD, steel,  W / 2 - railT / 2, 30 + deckT + railH / 2 - 6, deckZ);
        const upH = HT, upZ = -D / 2 + 90;
        addCyl(35, 35, upH, steel, -W / 2 + 70, upH / 2, upZ, 10);             // uprights
        addCyl(35, 35, upH, steel,  W / 2 - 70, upH / 2, upZ, 10);
        addBox(W - 90, 55, 70, steel, 0, upH - 40, upZ + 40);                  // handlebar
        addBox(W * 0.66, HT * 0.28, 55, screen, 0, upH, upZ + 70);            // console
        break;
      }
      default:
        addBox(W, HT, D, wood, 0, HT / 2, 0);
    }

    // Appliance in-use indicator: a small emissive green LED on the front
    // control area when the appliance is on/playing (build-time on/off — no
    // per-frame animation here; three-view folds appliance state into _keyFloor
    // so this rebuilds on a change). Front face is local -Z.
    if (opts?.applianceOn && furnitureCat(def) === 'appliance') {
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(34, 34, 12),
        this._mat({ color: 0x69f0ae, emissive: 0x00c853, emissiveIntensity: 1.0 }));
      const ledY = kind === 'wall_tv' ? 1350 + 260
                 : kind === 'tv' ? HT * 0.8
                 : Math.min(HT * 0.88, HT - 55);
      led.position.set(W * 0.36, ledY, -D / 2 - 8);
      led.userData.outlineSkip = true;   // no dark inverted-hull shell on a glowing dot
      grp.add(led);
    }

    // Sims dressing: cartoon outline shells on the main body meshes, plus a
    // soft blob shadow under anything that actually sits on the floor.
    // Rugs / stairs read wrong with a blob (they ARE floor), and elevated
    // pieces (counter-top appliances, sunken stairs) don't touch it.
    this._addOutlines(grp);
    const onFloor = !def.rug &&
      kind !== 'stairs' && kind !== 'stairs_half' && kind !== 'stair_landing' &&
      kind !== 'wall_tv' &&   // hangs on a wall, never touches the floor
      Math.abs(fu.elevation ?? 0) < 100;
    if (onFloor) {
      const blob = this._blobShadow(W / 2 * 1.12 + 60, D / 2 * 1.12 + 60);
      blob.position.y = 8 - (fu.elevation ?? 0);
      grp.add(blob);
    }
    return grp;
  }

  // Generic recipe builder: each primitive → a toon-material mesh. Size units
  // are per-shape (box [w,ht,d]; cylinder [rTop,rBot,ht]; sphere [r,_,_];
  // cone [r,ht,_]); pos/rot are local mm / deg. The caller applies the shared
  // Sims dressing (outlines + blob) afterward, same as the built-in kinds.
  private _buildFromRecipe(grp: THREE.Group, recipe: ObjectRecipe, override?: number): void {
    const d2r = (d: number) => d * Math.PI / 180;
    for (const prim of recipe.primitives) {
      const [a, b, c] = prim.size;
      let geo: THREE.BufferGeometry;
      switch (prim.shape) {
        case 'cylinder': geo = new THREE.CylinderGeometry(a, b, c, 14); break;
        case 'sphere':   geo = new THREE.SphereGeometry(a, 12, 10); break;
        case 'cone':     geo = new THREE.ConeGeometry(a, b, 14); break;
        case 'box':
        default:         geo = new THREE.BoxGeometry(a, b, c); break;
      }
      // Primitive's own color wins; else the piece override (when set); else grey.
      const col = prim.color ? hexToInt(prim.color) : (override ?? 0x8a8a8a);
      const m = new THREE.Mesh(geo, this._mat({ color: col }));
      m.position.set(prim.pos[0], prim.pos[1], prim.pos[2]);
      if (prim.rot) m.rotation.set(d2r(prim.rot[0]), d2r(prim.rot[1]), d2r(prim.rot[2]));
      grp.add(m);
    }
  }

  // poseProvider gives per-sensor mount height (mm above floor) and mount
  // angle (tilt degrees, +ve = front tilts down) from HA. If null, falls
  // back to defaults (height = 40 mm above floor, tilt = 0).
  updateSensors(
    sensors: Sensor[],
    poseProvider?: (s: Sensor) => { height: number; tilt: number } | null,
    showCoverage = true,
  ): void {
    if (!this._scene) return;
    this._clearGroup(this._sensorGroup);
    for (const s of sensors) {
      const pose = poseProvider ? poseProvider(s) : null;
      const heightMm = pose?.height ?? 40;
      const tiltDeg = pose?.tilt ?? 0;

      // Group composes heading (around world Y) with tilt (around local X).
      // Mesh dimensions: 180×80×60 (X=width, Y=height, Z=depth/forward).
      const grp = new THREE.Group();
      const p = this._w(s.x, s.y, heightMm);
      grp.position.set(p.x, p.y, p.z);
      grp.rotation.y = -(s.heading || 0) * Math.PI / 180;

      // Tilt: positive `mountAngle` means the sensor points downward. After
      // `grp.rotation.y`, local +Z faces the heading direction. Rotating the
      // child about its X axis by `-tilt` pitches the front (Z) downward.
      const tiltGrp = new THREE.Group();
      tiltGrp.rotation.x = -tiltDeg * Math.PI / 180;
      grp.add(tiltGrp);

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(180, 80, 60),
        this._mat({ color: 0x42a5f5, emissive: 0x0a2340 }),
      );
      tiltGrp.add(mesh);

      // Small forward-pointing nub so heading + tilt are obvious in 3D.
      const nub = new THREE.Mesh(
        new THREE.ConeGeometry(20, 60, 8),
        this._mat({ color: 0xbbdefb, emissive: 0x0a2340 }),
      );
      nub.rotation.x = Math.PI / 2;  // cone tip → +Z
      nub.position.set(0, 0, 70);    // just in front of the box face
      tiltGrp.add(nub);

      this._sensorGroup.add(grp);

      if (!showCoverage) continue;
      // Coverage wedge — flat floor decal mirroring the 2D Cov toggle, with
      // a brighter rim for definition. Same 2D-canvas-angle → shape-space
      // mapping as the motion-sensor cone in updateMotionSensors: canvas
      // angle a gives world offset (cos a, −sin a); the shape is rotated
      // −π/2 about X and _w mirrors X, so shape coords are (−dx, dy).
      const fovRad = (s.fov * Math.PI) / 180;
      const base = -Math.PI / 2 + ((s.heading || 0) * Math.PI) / 180;
      const segs = Math.max(12, Math.round((s.fov / 360) * 64));
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      const rimPts: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)];
      for (let i = 0; i <= segs; i++) {
        const a = base - fovRad / 2 + fovRad * (i / segs);
        const dx = Math.cos(a) * s.range, dy = Math.sin(a) * s.range;
        shape.lineTo(-dx, dy);
        rimPts.push(new THREE.Vector3(-dx, dy, 0));
      }
      shape.lineTo(0, 0);
      const wedge = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        // Basic (unlit) material so the wedge stays visible in the night preset.
        new THREE.MeshBasicMaterial({
          color: 0x4fc3f7, transparent: true, opacity: 0.12,
          side: THREE.DoubleSide, depthWrite: false,
        }));
      const rim = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(rimPts),
        new THREE.LineBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.55 }));
      const fp = this._w(s.x, s.y, 0);
      for (const o of [wedge, rim]) {
        o.rotation.x = -Math.PI / 2;          // lay the XY shape flat on the floor
        o.position.set(fp.x, 12, fp.z);       // few mm up to avoid z-fighting the floor
        this._sensorGroup.add(o);
      }
    }
  }

  updateMotionSensors(motions: MotionSensor[], stateProvider: StateProvider, showZones = true): void {
    if (!this._scene) return;
    this._clearGroup(this._motionGroup);
    const CONE_H = 1500;  // cone reaches up from floor to ~ceiling
    for (const m of motions) {
      const st = m.entity_id ? stateProvider(m.entity_id) : null;
      const isOn = st?.state === 'on';
      const baseColor = hexToInt(motionColor(m));
      const intensity = motionIntensity(m);
      const color = baseColor;
      // Body marker
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(120, 16, 12),
        this._mat({
          color, emissive: color,
          emissiveIntensity: (isOn ? 0.6 : 0.15) * intensity,
          metalness: 0.2, roughness: 0.6,
        }));
      const bp = this._w(m.x, m.y, 1700);
      body.position.set(bp.x, bp.y, bp.z);
      this._motionGroup.add(body);

      if (!showZones) continue;
      // Coverage volume — circle arc extruded vertically
      const halfFov = (m.fov * Math.PI / 180) / 2;
      const fov360 = m.fov >= 359.99;
      const segs = Math.max(12, Math.round((m.fov / 360) * 64));
      const shape = new THREE.Shape();
      const baseAng = -Math.PI / 2 + (m.heading * Math.PI / 180);
      // Convert 2D world angle to 3D group-local angle (camera +X is mirrored)
      if (!fov360) shape.moveTo(0, 0);
      const start = fov360 ? 0 : baseAng - halfFov;
      const end = fov360 ? 2 * Math.PI : baseAng + halfFov;
      for (let i = 0; i <= segs; i++) {
        const a = start + (end - start) * (i / segs);
        // 2D world angle a → ray direction (cos a, -sin a) in canvas; in world
        // mm we want (cos a, sin a) since y is up. Convert to 3D via _w.
        const dx = Math.cos(a) * m.range, dy = Math.sin(a) * m.range;
        if (i === 0 && fov360) shape.moveTo(-dx, dy);
        else                    shape.lineTo(-dx, dy);
      }
      if (!fov360) shape.lineTo(0, 0);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: CONE_H, bevelEnabled: false });
      const mat = this._mat({
        color, emissive: color,
        emissiveIntensity: (isOn ? 0.4 : 0.05) * intensity,
        transparent: true,
        opacity: Math.min(1, (isOn ? 0.3 : 0.12) * intensity),
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const cone = new THREE.Mesh(geo, mat);
      // Lay extrude shape flat on floor: extrude pulls along +Z. Rotate -PI/2
      // about X so depth points up (+Y world).
      cone.rotation.x = -Math.PI / 2;
      const p = this._w(m.x, m.y, 0);
      cone.position.set(p.x, p.y, p.z);
      this._motionGroup.add(cone);
    }
  }

  // BLE proxies (Bluetooth scanners): a small antenna puck — a short mast with
  // an emissive bead on top — at the fixture's mount height. Structural only
  // (no live state), rebuilt on the _keyBle dirty key. Rides the sensors layer.
  updateBleProxies(proxies: BleProxy[]): void {
    if (!this._scene) return;
    this._clearGroup(this._bleGroup);
    const color = hexToInt(BLE_PROXY_DEFAULTS.color);
    for (const b of proxies) {
      if (b.hidden) continue;
      const h = bleProxyHeight(b);
      const grp = new THREE.Group();
      // Mast
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(24, 30, 260, 10),
        this._mat({ color: 0x263238, roughness: 0.7 }));
      mast.position.y = 130;
      grp.add(mast);
      // Bead (antenna node)
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(85, 16, 12),
        this._mat({ color, emissive: color, emissiveIntensity: 0.55 }));
      bead.position.y = 300;
      grp.add(bead);
      const p = this._w(b.x, b.y, h);
      grp.position.set(p.x, p.y, p.z);
      this._bleGroup.add(grp);
    }
  }

  // Alarm keypads (Feature 3): a wall-mounted plate at `height` with an emissive
  // screen band colored by the arm state (palette shared with 2D via
  // alarmStateColor). Front face = local +Z (room side), matching the switch
  // rotation convention. Meshes carry userData.kind === 'alarm' so a raycast
  // click opens the control modal. Rebuilt under _keyAlarm in three-view; a
  // triggered state stays bright red (no per-frame flash needed).
  updateAlarmPanels(panels: AlarmPanel[], stateProvider: StateProvider): void {
    if (!this._scene) return;
    this._clearGroup(this._alarmGroup);
    for (const a of panels) {
      const st = itemState(a, stateProvider);
      const state = st?.state ?? null;
      const col = hexToInt(alarmStateColor(state));
      const ud = { kind: 'alarm' as const, entity_id: a.entity_id ?? null, fixtureId: a.id };
      const grp = new THREE.Group();
      const p = this._w(a.x, a.y, alarmHeight(a));
      grp.position.set(p.x, p.y, p.z);
      grp.rotation.y = -((a.rotation || 0) * Math.PI / 180);
      const plateW = ALARM_DEFAULTS.size * 0.5;
      const plateH = ALARM_DEFAULTS.size * 0.72;
      const plateD = ALARM_PLATE_DEPTH_MM;
      // Plate body (back flush on the wall; snap offset = wallT/2 + plateD/2).
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(plateW, plateH, plateD),
        this._mat({ color: 0x11151b, metalness: 0.2, roughness: 0.6 }));
      body.userData = ud;
      grp.add(body);
      // Screen band on the front (+Z), proud of the plate so faces never go
      // coplanar (the coincident-face gotcha). Emissive, colored by arm state.
      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(plateW * 0.8, plateH * 0.34, 10),
        this._mat({ color: col, emissive: col, emissiveIntensity: state ? 0.95 : 0.25 }));
      screen.position.set(0, plateH * 0.24, plateD / 2 + 5);
      screen.userData = { ...ud, outlineSkip: true };
      grp.add(screen);
      // A couple of keypad button rows below the screen (cosmetic).
      const btnMat = this._mat({ color: 0x2b333c, metalness: 0.1, roughness: 0.7 });
      for (let ry = 0; ry < 2; ry++) {
        for (let cxi = -1; cxi <= 1; cxi++) {
          const btn = new THREE.Mesh(new THREE.BoxGeometry(plateW * 0.2, plateH * 0.13, 8), btnMat);
          btn.position.set(cxi * plateW * 0.26, -plateH * 0.08 - ry * plateH * 0.2, plateD / 2 + 4);
          btn.userData = ud;
          grp.add(btn);
        }
      }
      this._alarmGroup.add(grp);
    }
  }

  // Smoke / CO detectors: a white ceiling disc (mounted just below ceiling
  // height) with a tiny status LED on its underside. While ALARMING (bound
  // binary_sensor 'on' or unbound localState 'on') it erupts into a bright
  // emissive pulse + 2-3 expanding translucent rings dropping/expanding beneath
  // the detector. Rebuilt under _keySafety normally; three-view forces a
  // per-frame rebuild while ANY detector on the floor is alarming (the fireplace
  // idiom) so the pulse animates. Rides the sensors layer.
  updateSafetySensors(items: SafetySensor[], stateProvider: StateProvider): void {
    if (!this._scene) return;
    this._clearGroup(this._safetyGroup);
    const nowS = performance.now() / 1000;
    const ceiling = SAFETY_DEFAULTS.ceilingMm;
    const discR = SAFETY_DEFAULTS.discRadiusMm;
    for (const s of items) {
      const st = itemState(s, stateProvider);
      const alarming = st?.state === 'on';
      const kind = s.kind === 'co' ? 'co' : 'smoke';
      const col = hexToInt(safetyColor(kind));
      const ud = { kind: 'safety' as const, entity_id: s.entity_id ?? null, fixtureId: s.id };
      const grp = new THREE.Group();
      const p = this._w(s.x, s.y, ceiling - 60);   // disc just below the ceiling
      grp.position.set(p.x, p.y, p.z);
      // White detector disc (flat cylinder, axis vertical).
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(discR, discR, 40, 24),
        this._mat({ color: alarming ? col : 0xeceff1, roughness: 0.6, metalness: 0.05,
                    emissive: alarming ? col : 0x000000, emissiveIntensity: alarming ? 0.5 : 0 }));
      disc.userData = ud;
      grp.add(disc);
      // Status LED on the underside (into the room, -Y).
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(discR * 0.22, 12, 10),
        this._mat({ color: alarming ? col : 0x37474f,
                    emissive: alarming ? col : 0x0a0d10,
                    emissiveIntensity: alarming ? 1.0 : 0.25 }));
      led.position.set(0, -26, 0);
      led.userData = { ...ud, outlineSkip: true };
      grp.add(led);
      if (alarming) {
        const pulse = 0.5 + 0.5 * Math.sin(nowS * 6);
        // Emissive glow bulb beneath the disc.
        const glow = new THREE.Mesh(
          new THREE.SphereGeometry(discR * (1.05 + 0.25 * pulse), 16, 12),
          this._mat({ color: col, emissive: col, emissiveIntensity: 0.6 + 0.6 * pulse,
                      transparent: true, opacity: 0.22 + 0.2 * pulse }));
        glow.position.set(0, -50, 0);
        glow.userData = { outlineSkip: true };
        grp.add(glow);
        // 3 flat rings dropping + expanding beneath the detector.
        for (let k = 0; k < 3; k++) {
          const ph = (nowS * 1.4 + k / 3) % 1;
          const rr = discR * (1 + ph * 4);
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(rr * 0.86, rr, 28),
            this._mat({ color: col, emissive: col, emissiveIntensity: 0.8,
                        transparent: true, opacity: 0.5 * (1 - ph), side: THREE.DoubleSide }));
          ring.rotation.x = -Math.PI / 2;            // lie flat (horizontal)
          ring.position.set(0, -70 - ph * 520, 0);   // sink beneath the disc as it grows
          ring.userData = { outlineSkip: true };
          grp.add(ring);
        }
      }
      this._safetyGroup.add(grp);
    }
  }

  // ── Robots (vacuum / mower) ────────────────────────────────────────────────
  // Docks are static (build-time, rebuilt under three-view's _keyRobots). The
  // moving robot bodies are persistent per-frame rigs (see updateRobotRigs) whose
  // positions come from Planner.robotStates — the renderer never runs the robot
  // movement itself, so 2D and 3D stay in lock-step.
  updateRobotDocks(robots: RobotFixture[]): void {
    if (!this._scene) return;
    this._clearGroup(this._robotGroup);
    for (const r of robots) {
      const kind = r.kind === 'mower' ? 'mower' : 'vacuum';
      const ud = { kind: 'robot' as const, entity_id: r.entity_id ?? null, fixtureId: r.id };
      const grp = new THREE.Group();
      const col = hexToInt(robotColor(kind));
      if (kind === 'mower') {
        // Garage-ish charging station: base plate + low back wall + slanted roof.
        const base = new THREE.Mesh(new THREE.BoxGeometry(720, 40, 520),
          this._mat({ color: 0x37474f, roughness: 0.8 }));
        base.position.y = 20; base.userData = ud; grp.add(base);
        const back = new THREE.Mesh(new THREE.BoxGeometry(720, 320, 60),
          this._mat({ color: col, roughness: 0.7 }));
        back.position.set(0, 180, 260); back.userData = ud; grp.add(back);
        const roof = new THREE.Mesh(new THREE.BoxGeometry(740, 30, 360),
          this._mat({ color: col, roughness: 0.6 }));
        roof.position.set(0, 350, 130); roof.rotation.x = -0.2; roof.userData = ud; grp.add(roof);
      } else {
        // Flat ramp/base plate with a charging LED.
        const base = new THREE.Mesh(new THREE.BoxGeometry(420, 30, 260),
          this._mat({ color: 0x263238, roughness: 0.8 }));
        base.position.y = 15; base.userData = ud; grp.add(base);
        const contact = new THREE.Mesh(new THREE.BoxGeometry(120, 50, 20),
          this._mat({ color: col, emissive: col, emissiveIntensity: 0.4, roughness: 0.5 }));
        contact.position.set(0, 40, 120); contact.userData = ud; grp.add(contact);
      }
      this._addOutlines(grp);
      const p = this._w(r.x, r.y, 0);
      grp.position.set(p.x, p.y, p.z);
      this._robotGroup.add(grp);
    }
  }

  // Persistent moving-robot rigs, positioned from Planner.robotStates each frame.
  updateRobotRigs(robots: RobotFixture[], states: Record<string, RobotRenderState>): void {
    if (!this._scene) return;
    const live = new Set<string>();
    for (const r of robots) {
      const st = states[r.id];
      if (!st) continue;
      live.add(r.id);
      const kind = r.kind === 'mower' ? 'mower' : 'vacuum';
      let rig = this._robotRigs[r.id];
      if (rig && rig.kind !== kind) { this._disposeRobotRig(rig); delete this._robotRigs[r.id]; rig = undefined as unknown as RobotRig; }
      if (!rig) {
        rig = this._buildRobotRig(kind, r);
        this._robotRigs[r.id] = rig;
        this._robotRigGroup.add(rig.group);
      }
      // Position + facing (plan heading → scene yaw; body-forward = local −Z).
      const p = this._w(st.x, st.y, 0);
      const working = st.activity === 'cleaning' || st.activity === 'mowing';
      const bob = working ? Math.abs(Math.sin(st.phase * 4)) * 12 : 0;
      rig.group.position.set(p.x, bob, p.z);
      rig.group.rotation.y = Math.atan2(Math.cos(st.heading), -Math.sin(st.heading));
      // Spin the top part while working (vacuum brush plate / mower disc).
      rig.spin.rotation.y = working ? st.phase * 4 : 0;
      // LED: color from resolved led; docked breathes, error blinks.
      let inten = 0.9;
      if (st.activity === 'docked') inten = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(st.phase * 2));
      else if (st.activity === 'error') inten = Math.sin(st.phase * 8) > 0 ? 1.2 : 0.05;
      else if (st.activity === 'idle' || st.activity === 'paused') inten = 0.3;
      const ledHex = hexToInt(st.led);
      rig.ledMat.color.setHex(ledHex);
      rig.ledMat.emissive.setHex(ledHex);
      rig.ledMat.emissiveIntensity = inten;
      // Re-ground the blob shadow.
      rig.blob.position.y = 6 - bob;
    }
    // Dispose rigs whose robot vanished.
    for (const id of Object.keys(this._robotRigs)) {
      if (!live.has(id)) { this._disposeRobotRig(this._robotRigs[id]); delete this._robotRigs[id]; }
    }
  }

  private _buildRobotRig(kind: 'vacuum' | 'mower', r: RobotFixture): RobotRig {
    const ud = { kind: 'robot' as const, entity_id: r.entity_id ?? null, fixtureId: r.id };
    const grp = new THREE.Group();
    const bodyCol = hexToInt(robotColor(kind));
    const ledMat = this._mat({ color: 0x43a047, emissive: 0x43a047, emissiveIntensity: 0.9 });
    const spin = new THREE.Group();
    if (kind === 'vacuum') {
      const R = ROBOT_DEFAULTS.vacuum.bodyR, H = ROBOT_DEFAULTS.vacuum.bodyH;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 28),
        this._mat({ color: bodyCol, roughness: 0.6 }));
      body.position.y = H / 2; body.userData = ud; grp.add(body);
      // Colored top ring.
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.98, R * 0.98, 10, 28),
        ledMat);
      ring.position.y = H; ring.userData = { ...ud, outlineSkip: true }; grp.add(ring);
      // Raised bump (sensor tower) on the front (−Z), part of the spin group.
      const bump = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.28, R * 0.28, 40, 16),
        this._mat({ color: 0x263238, roughness: 0.5 }));
      bump.position.set(0, H + 20, -R * 0.4); bump.userData = ud;
      spin.add(bump);
      grp.add(spin);
    } else {
      const W = ROBOT_DEFAULTS.mower.bodyW, D = ROBOT_DEFAULTS.mower.bodyD, H = ROBOT_DEFAULTS.mower.bodyH;
      const body = new THREE.Mesh(new THREE.BoxGeometry(W, H * 0.7, D),
        this._mat({ color: bodyCol, roughness: 0.55 }));
      body.position.y = H * 0.5; body.userData = ud; grp.add(body);
      // Dark hood over the front.
      const hood = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, H * 0.35, D * 0.5),
        this._mat({ color: 0x1b2a1b, roughness: 0.5 }));
      hood.position.set(0, H * 0.8, -D * 0.22); hood.userData = ud; grp.add(hood);
      // LED strip across the top.
      const strip = new THREE.Mesh(new THREE.BoxGeometry(W * 0.5, 24, 40), ledMat);
      strip.position.set(0, H * 0.9, D * 0.28); strip.userData = { ...ud, outlineSkip: true };
      grp.add(strip);
      // Cutting-disc plate underneath (spins while mowing).
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(D * 0.35, D * 0.35, 20, 20),
        this._mat({ color: 0x9e9e9e, roughness: 0.4 }));
      disc.position.y = 40; disc.userData = { ...ud, outlineSkip: true };
      spin.add(disc);
      grp.add(spin);
      // Wheel hints.
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(H * 0.28, H * 0.28, 60, 12),
          this._mat({ color: 0x111111, roughness: 0.7 }));
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(sx * W * 0.42, H * 0.28, sz * D * 0.32);
        wheel.userData = { ...ud, outlineSkip: true };
        grp.add(wheel);
      }
    }
    this._addOutlines(grp);
    const blob = kind === 'mower'
      ? this._blobShadow(ROBOT_DEFAULTS.mower.bodyW * 0.62, ROBOT_DEFAULTS.mower.bodyD * 0.62)
      : this._blobShadow(ROBOT_DEFAULTS.vacuum.bodyR * 1.3, ROBOT_DEFAULTS.vacuum.bodyR * 1.3);
    blob.position.y = 6;
    grp.add(blob);
    return { group: grp, kind, ledMat, spin, blob };
  }

  private _disposeRobotRig(rig: RobotRig): void {
    this._robotRigGroup.remove(rig.group);
    this._disposeSubtree(rig.group);
  }

  // Environmental sensors: a small emissive puck at mount height plus a
  // camera-facing value sprite (canvas-rendered text) floating above it.
  // Rebuilt only when the _keyEnv dirty key changes (bound values update at
  // sensor cadence, so rebuild churn is negligible).
  updateEnvSensors(envs: EnvSensor[], stateProvider: StateProvider): void {
    if (!this._scene) return;
    // Sprite textures aren't covered by _clearGroup's material disposal —
    // drop them explicitly or every rebuild leaks a GPU texture.
    this._disposeSpriteMaps(this._envGroup);
    this._clearGroup(this._envGroup);
    for (const e of envs) {
      const st = e.entity_id ? stateProvider(e.entity_id) : null;
      const kind = envKindOf(e, st);
      const value = st ? parseFloat(st.state) : NaN;
      const colorHex = envColor(kind, value);
      const color = hexToInt(colorHex);
      const sc = envScale(e);
      const p = this._w(e.x, e.y, envHeight(e));

      const body = new THREE.Mesh(
        new THREE.SphereGeometry(55 * sc, 14, 10),
        this._mat({
          color, emissive: color, emissiveIntensity: 0.5,
          metalness: 0.1, roughness: 0.5,
        }));
      body.position.set(p.x, p.y, p.z);
      this._envGroup.add(body);

      const text = e.entity_id ? envValueText(st) : 'unbound';
      const sprite = this._makeTextSprite(`${ENV_KINDS[kind].glyph} ${text}`, colorHex, sc);
      sprite.position.set(p.x, p.y + 170 * sc, p.z);
      this._envGroup.add(sprite);
    }
  }

  // GPS device pins + 3D landmark pins (Feature G, phase G2). Camera-facing
  // text sprites in _gpsGroup: a landmark sits near the ground (📍 name); a GPS
  // pin floats at ~1800 mm at its render position (yard true pos / boundary edge
  // for 'beyond', where the label already carries the distance + compass). No
  // humanoid rig — this is a device location, not a room-presence claim. Sprite
  // CanvasTextures aren't freed by _clearGroup, so pair _disposeSpriteMaps with
  // it (the same gotcha as updateEnvSensors).
  updateGpsPins(pins: GpsPinWorld[], landmarks: GpsLandmarkWorld[]): void {
    if (!this._scene) return;
    this._disposeSpriteMaps(this._gpsGroup);
    this._clearGroup(this._gpsGroup);
    for (const lm of landmarks) {
      const sp = this._makeTextSprite(`📍 ${lm.name || 'Landmark'}`, '#4dd0e1', 0.7);
      const p = this._w(lm.x, lm.y, 300);
      sp.position.set(p.x, p.y, p.z);
      this._gpsGroup.add(sp);
    }
    for (const pin of pins) {
      const sp = this._makeTextSprite(pin.label, pin.color, 1);
      const p = this._w(pin.x, pin.y, 1800);
      sp.position.set(p.x, p.y, p.z);
      if (pin.stale) sp.material.opacity = 0.4;
      this._gpsGroup.add(sp);
    }
  }

  // Canvas-rendered text on a Sprite (always faces the camera). ~240 mm tall
  // in world units at scale 1; width follows the text aspect ratio. The
  // texture resolution is fixed — `scale` only stretches world size, which
  // stays sharp because the source canvas is oversampled ~3× already.
  private _makeTextSprite(text: string, accentHex: string, scale = 1): THREE.Sprite {
    const font = '500 44px system-ui, sans-serif';
    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d')!;
    ctx.font = font;
    const tw = ctx.measureText(text).width;
    const padX = 26, h = 76;
    cv.width = Math.ceil(tw + padX * 2);
    cv.height = h;
    ctx.font = font;  // canvas resize resets ctx state
    ctx.beginPath();
    ctx.roundRect(2, 2, cv.width - 4, h - 4, 22);
    ctx.fillStyle = 'rgba(8,10,16,0.85)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = accentHex;
    ctx.stroke();
    ctx.fillStyle = '#f5f7fa';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, cv.width / 2, h / 2 + 2);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false,
    }));
    const H = 240 * scale;
    sprite.scale.set(H * (cv.width / cv.height), H, 1);
    return sprite;
  }

  // Sprite canvas textures aren't covered by _clearGroup's material
  // disposal. Guarded on isSprite so mesh materials (floor's cached
  // procedural / bg textures) are never touched.
  private _disposeSpriteMaps(g: THREE.Group): void {
    g.traverse(o => {
      const s = o as THREE.Sprite;
      if (s.isSprite) s.material.map?.dispose();
    });
  }

  // ── Outdoor weather effects (Feature W, phase W2) ─────────────────────────
  // Rebuilt under three-view's _keyWeather dirty key (condition + intensity
  // bucket + layer flags + configRev). Per-frame motion happens in
  // _advanceWeather (called every frame from _animate), which mutates the point
  // buffers in place — ZERO allocation after this build. Materials for particles
  // are PointsMaterial (the documented exemption from the _mat toon factory);
  // the fog ground planes DO use _mat so they read toon-flat like everything else.
  updateWeather(fx: WeatherFxState): void {
    if (!this._scene) return;
    this._weatherFx = fx;
    this._clearWeather();

    const cond = fx.condition;
    const I = Math.max(0, Math.min(1, fx.intensity01));
    // A stale caller (older app.js) omits `effects` → treat every effect-GROUP
    // member as ON so legacy W2 behavior (precip/fog/lightning/wind) is preserved.
    const eff = fx.effects ?? WEATHER_ALL_EFFECTS;

    // Wind drift in the SCENE frame. windBearingPlanRad = plan-frame angle the
    // wind blows TOWARD; plan (cos,sin) maps to scene via _w's mirror
    // (world X = −planX, world Z = +planY). No bearing → a gentle default shear.
    const windMmS = Math.max(0, (fx.windKmh || 0)) * 1000 / 3600;  // km/h → mm/s
    let wdx = 0, wdz = 0;
    if (fx.windBearingPlanRad != null && windMmS > 0) {
      wdx = -Math.cos(fx.windBearingPlanRad) * windMmS;
      wdz =  Math.sin(fx.windBearingPlanRad) * windMmS;
    } else if (windMmS > 0) {
      wdx = windMmS * 0.5;
    }
    // Gust envelope active when the gust exceeds the sustained wind by > 15 km/h.
    const gust = fx.windGustKmh ?? null;
    this._gustEnabled = !!eff.wind && gust != null && gust > (fx.windKmh || 0) + 15;
    if (!this._gustEnabled) { this._gustAge = -1; }

    // ── Precipitation / dust (precip, wind keys) ──
    if (eff.precip) {
      switch (cond) {
        case 'rainy': case 'pouring': case 'lightning-rainy':
          this._buildPrecipCloud('rain', I, wdx, wdz); break;
        case 'snowy':
          this._buildPrecipCloud('snow', I, wdx, wdz); break;
        case 'snowy-rainy':   // one rain + one snow cloud, half counts each
          this._buildPrecipCloud('rain', I, wdx, wdz, 0.5);
          this._buildPrecipCloud('snow', I, wdx, wdz, 0.5); break;
        case 'hail':
          this._buildPrecipCloud('hail', I, wdx, wdz); break;
      }
    }
    if (eff.wind && (cond === 'windy' || cond === 'windy-variant')) {
      this._buildPrecipCloud('dust', I, wdx, wdz);
    }

    // ── Fog (fog key): condition floor + continuous visibility scaling ──
    // condition 'fog' floors the density; a reported visibilityKm scales it
    // continuously (low visibility ⇒ denser) even under other conditions.
    let fogTarget = 0;
    if (eff.fog) {
      if (cond === 'fog') fogTarget = 0.00018;
      if (fx.visibilityKm != null && isFinite(fx.visibilityKm)) {
        fogTarget = Math.max(fogTarget, visibilityToFogDensity(fx.visibilityKm));
      }
    }
    if (fogTarget > 0) this._buildFog(fogTarget);
    else this._fogTarget = 0;   // ease any active fog back out

    // ── Cloud shadows (clouds key) ──
    if (eff.clouds && fx.cloudCoverage != null) this._buildCloudShadows(fx.cloudCoverage, wdx, wdz);

    // ── Lightning flash (lightning key) ──
    if (eff.lightning && (cond === 'lightning' || cond === 'lightning-rainy')) this._buildFlash();

    // ── Frost & icicles (frost key, default off) ──
    const feels = fx.apparentC ?? null;
    if (eff.frost && feels != null && feels <= -3) this._buildFrost();

    // ── Rain puddles (puddles key) — persist the fade across rebuilds ──
    this._puddleFloorId = this._floorId;
    const wetNow = !!eff.puddles &&
      (cond === 'rainy' || cond === 'pouring' || cond === 'snowy-rainy');
    this._puddleTarget = wetNow ? 1 : 0;
    const curFade = this._puddleFade[this._floorId] ?? 0;
    if (wetNow || curFade > 0.001) this._buildPuddles();

    // ── Storm brewing (precipForecast key, default off) ──
    const brewing = !!eff.precipForecast && !!fx.rainSoon &&
      cond !== 'rainy' && cond !== 'pouring' && cond !== 'lightning-rainy' &&
      cond !== 'lightning' && cond !== 'hail';
    if (brewing) this._buildStormBank(wdx, wdz);
    this._setStormDark(brewing);

    // ── True sun position (sunPosition key) — target eased in _animate ──
    if (eff.sunPosition && fx.sunElevationDeg != null && fx.sunElevationDeg > 0
        && fx.sunAzimuthDeg != null) {
      this._weatherSunTarget = this._sunTargetFromSky(fx.sunAzimuthDeg, fx.sunElevationDeg);
    } else {
      this._weatherSunTarget = null;
    }
  }

  private _clearWeather(): void {
    // _clearGroup → _disposeSubtree disposes Points geometry + material AND the
    // fog-plane mesh geometry/material, but NOT their maps — the shared particle
    // CanvasTextures (_rainTex …) are freed only in destroy(). Reset the tracking
    // lists so the per-frame advance stops touching freed buffers.
    this._weatherClouds = [];
    this._weatherFogPlanes = [];
    this._weatherCloudShadows = [];
    this._weatherPuddles = [];
    this._weatherIcicles = [];
    this._weatherFlash = null;
    this._flashAge = -1;
    this._clearGroup(this._weatherGroup);
  }

  private _buildPrecipCloud(
    kind: WeatherCloud['kind'], I: number, wdx: number, wdz: number, countScale = 1,
  ): void {
    // 600–2500 by intensity for precip; 40–120 for wind dust. DPR-capped on
    // hi-density displays (retina / iPad) exactly like the renderer's pixel-
    // ratio cap — fewer particles where each pixel is smaller anyway.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cap = dpr >= 2 ? 0.6 : 1;
    const base = kind === 'dust' ? 40 + I * 80 : 600 + I * 1900;
    const count = Math.max(20, Math.round(base * countScale * cap));

    // Spawn box = floor bbox (scene coords: x∈[−fw/2,fw/2], z∈[−fd/2,fd/2])
    // inflated ~6 m every side; vertical recycle band 0..4000 mm.
    const INF = 6000, BAND = 4000;
    const minX = -this._fw / 2 - INF, sizeX = this._fw + 2 * INF;
    const minZ = -this._fd / 2 - INF, sizeZ = this._fd + 2 * INF;

    const pos = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = minX + Math.random() * sizeX;
      pos[i * 3 + 1] = Math.random() * BAND;
      pos[i * 3 + 2] = minZ + Math.random() * sizeZ;
      phase[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    let map: THREE.CanvasTexture, size: number, color: number, fall: number,
        wobble: number, opacity: number;
    switch (kind) {
      case 'rain': map = this._rainTexture(); size = 140; color = 0xbcd8ff;
        fall = 9000 + I * 7000; wobble = 0; opacity = 0.7; break;
      case 'snow': map = this._snowTexture(); size = 120; color = 0xffffff;
        fall = 900 + I * 700; wobble = 350; opacity = 0.9; break;
      case 'hail': map = this._hailTexture(); size = 70; color = 0xffffff;
        fall = 12000 + I * 6000; wobble = 0; opacity = 0.95; break;
      default:     map = this._dustTexture(); size = 90; color = 0xc8be96;
        fall = 0; wobble = 250; opacity = 0.6; break;   // dust
    }
    const mat = new THREE.PointsMaterial({
      map, size, color, transparent: true, opacity, depthWrite: false,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;   // spawn box straddles the whole yard
    points.renderOrder = 3;         // over opaque surfaces + blob decals
    this._weatherGroup.add(points);
    this._weatherClouds.push({
      kind, points, pos, phase, count, fall, driftX: wdx, driftZ: wdz, wobble,
      minX, minZ, sizeX, sizeZ,
    });
  }

  private _buildFog(target = 0.00018): void {
    if (!this._scene) return;
    const existing = this._scene.fog as THREE.FogExp2 | null;
    if (!existing || !(existing as { isFogExp2?: boolean }).isFogExp2) {
      // Start at density 0 and let _advanceWeather ease in over ~2 s (no pop).
      this._scene.fog = new THREE.FogExp2(0xc2c8d2, 0);
    }
    this._fogTarget = target;
    // Two large translucent ground planes OUTSIDE the walls, scrolled slowly in
    // opposite directions in _advanceWeather for a drifting-mist feel.
    const w = this._fw + 12000, d = this._fd + 12000;
    for (let i = 0; i < 2; i++) {
      const geo = new THREE.PlaneGeometry(w, d);
      const mat = this._mat({
        color: 0xd2d7e0, map: this._fogPlaneTexture(), transparent: true,
        opacity: 0.14, depthWrite: false, side: THREE.DoubleSide,
      });
      const pl = new THREE.Mesh(geo, mat);
      pl.rotation.x = -Math.PI / 2;    // lay flat
      pl.position.set(i === 0 ? 0 : w * 0.3, 220 + i * 140, 0);
      pl.renderOrder = 2;
      this._weatherGroup.add(pl);
      this._weatherFogPlanes.push(pl);
    }
  }

  private _buildFlash(): void {
    const flash = new THREE.DirectionalLight(0xf2f6ff, 0);
    flash.position.set(-4000, 12000, -3000);
    this._weatherGroup.add(flash);
    this._weatherFlash = flash;
    this._flashCountdown = 2 + Math.random() * 6;  // first strike 2–8 s
    this._flashAge = -1;
  }

  // Drifting cloud shadows (W3, clouds key). Count + darkness scale with
  // cloud_coverage: < 30% → none; overcast → more, darker blobs sliding across
  // the yard with the wind. Shared _cloudShadowTex; positions mutated in
  // _advanceWeather (zero alloc), wrapped in an inflated spawn box.
  private _buildCloudShadows(coveragePct: number, wdx: number, wdz: number): void {
    const cov = Math.max(0, Math.min(100, coveragePct));
    if (cov < 30) return;
    const t = (cov - 30) / 70;                     // 0..1 above the 30% floor
    const count = Math.round(3 + t * 3);           // 3..6
    const opacity = 0.12 + t * 0.20;               // 0.12..0.32
    const INF = 5000;
    const minX = -this._fw / 2 - INF, sizeX = this._fw + 2 * INF;
    const minZ = -this._fd / 2 - INF, sizeZ = this._fd + 2 * INF;
    // A gentle default drift when there's no wind, so shadows are never static.
    const dx = wdx || 220, dz = wdz || 90;
    for (let i = 0; i < count; i++) {
      const r = 2600 + Math.random() * 2600;       // blob radius, mm
      const geo = new THREE.PlaneGeometry(r * 2, r * 2);
      const mat = new THREE.MeshBasicMaterial({
        map: this._cloudShadowTexture(), transparent: true, opacity,
        depthWrite: false, color: 0xffffff,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(minX + Math.random() * sizeX, 12, minZ + Math.random() * sizeZ);
      mesh.renderOrder = 1;                          // above floor, below particles
      mesh.userData.outlineSkip = true;
      this._weatherGroup.add(mesh);
      this._weatherCloudShadows.push({ mesh, driftX: dx, driftZ: dz, minX, minZ, sizeX, sizeZ });
    }
  }

  // Frost & icicles (W3, frost key, default off). A handful of small white
  // icicle cones hanging from the floor perimeter (proxy for exterior wall top
  // runs) + a faint white rim strip. Build-time; counts kept tiny.
  private _buildFrost(): void {
    const iceMat = this._mat({ color: 0xeaf4ff, transparent: true, opacity: 0.92 });
    const hw = this._fw / 2, hd = this._fd / 2;
    const H = 2743;   // full wall top
    // Deterministic-ish placement along the four perimeter edges.
    const edges: Array<[number, number, number, number]> = [
      [-hw, -hd, hw, -hd], [-hw, hd, hw, hd],   // front / back runs (vary X)
      [-hw, -hd, -hw, hd], [hw, -hd, hw, hd],   // left / right runs (vary Z)
    ];
    let seed = 0x9e37;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (const [x0, z0, x1, z1] of edges) {
      const n = 5;
      for (let i = 0; i < n; i++) {
        const f = (i + 0.5) / n + (rnd() - 0.5) * 0.06;
        const x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f;
        const len = 180 + rnd() * 260;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(45 + rnd() * 30, len, 6), iceMat);
        cone.position.set(x, H - len / 2, z);       // tip points down
        cone.rotation.x = Math.PI;
        cone.userData.outlineSkip = true;
        this._weatherGroup.add(cone);
        this._weatherIcicles.push(cone);
      }
      // Faint rim strip along the top of the run.
      const len = Math.hypot(x1 - x0, z1 - z0);
      const rim = new THREE.Mesh(
        new THREE.BoxGeometry(x1 === x0 ? 60 : len, 40, z1 === z0 ? 60 : len),
        this._mat({ color: 0xdff0ff, transparent: true, opacity: 0.5, depthWrite: false }));
      rim.position.set((x0 + x1) / 2, H - 20, (z0 + z1) / 2);
      rim.userData.outlineSkip = true;
      this._weatherGroup.add(rim);
      this._weatherIcicles.push(rim);
    }
  }

  // Rain puddles (W3, puddles key). Flat dark-blue ellipse decals at DETERMINISTIC
  // seeded floor-edge spots (seed from the floor id hash so rebuilds never
  // reshuffle). Opacity is driven per-frame by _puddleFade[floorId], which
  // survives _keyWeather rebuilds so puddles linger + fade out over ~10 min after
  // rain stops (a Sims touch).
  private _buildPuddles(): void {
    const seedBase = this._hashStr(this._floorId || 'f');
    const fade = this._puddleFade[this._floorId] ?? 0;
    const hw = this._fw / 2, hd = this._fd / 2;
    let seed = seedBase;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const count = 4 + (seedBase % 5);   // 4..8
    for (let i = 0; i < count; i++) {
      const rx = 500 + rnd() * 1100, rz = 400 + rnd() * 900;
      // Bias toward the yard band just outside the floor edges + some interior.
      const edge = rnd() < 0.6;
      let x: number, z: number;
      if (edge) {
        const side = Math.floor(rnd() * 4);
        const along = (rnd() * 2 - 1);
        if (side === 0) { x = along * hw; z = hd + 900 + rnd() * 1600; }
        else if (side === 1) { x = along * hw; z = -hd - 900 - rnd() * 1600; }
        else if (side === 2) { x = hw + 900 + rnd() * 1600; z = along * hd; }
        else { x = -hw - 900 - rnd() * 1600; z = along * hd; }
      } else {
        x = (rnd() * 2 - 1) * hw * 0.8; z = (rnd() * 2 - 1) * hd * 0.8;
      }
      const baseOpacity = 0.55;
      const geo = new THREE.PlaneGeometry(rx * 2, rz * 2);
      const mat = new THREE.MeshBasicMaterial({
        map: this._puddleTexture(), transparent: true, opacity: baseOpacity * fade,
        depthWrite: false, color: 0xffffff,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 6, z);   // just above the slab / yard void
      mesh.renderOrder = 1;
      mesh.userData.outlineSkip = true;
      this._weatherGroup.add(mesh);
      this._weatherPuddles.push({ mesh, baseOpacity });
    }
  }

  // Distant dark cloud-bank on the upwind horizon (W3, precipForecast key). A
  // couple of overlapping dark billboards far out in the direction the weather is
  // coming FROM (opposite the wind's blow-toward drift).
  private _buildStormBank(wdx: number, wdz: number): void {
    // Upwind = opposite the drift; default to −X when there's no wind.
    let ux = -wdx, uz = -wdz;
    const m = Math.hypot(ux, uz);
    if (m < 1e-3) { ux = -1; uz = 0; } else { ux /= m; uz /= m; }
    const dist = Math.max(this._fw, this._fd) + 14000;
    const cx = ux * dist, cz = uz * dist;
    const tex = this._cloudShadowTexture();
    for (let i = 0; i < 3; i++) {
      const s = 9000 + i * 3500;
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, color: 0x2b3340, transparent: true, opacity: 0.5, depthWrite: false,
      }));
      spr.scale.set(s, s * 0.55, 1);
      spr.position.set(cx + (i - 1) * 3800, 4200 + i * 600, cz + (i - 1) * 1400 * uz);
      spr.renderOrder = 1;
      this._weatherGroup.add(spr);
    }
  }

  // Apply / release the slight sky darkening that accompanies a brewing storm.
  // The amount is eased in _advanceWeather between the captured preset tint and a
  // darkened copy; when it eases back to 0 the exact preset tint returns (no
  // applyScenePreset needed, so it never fights per-frame sun easing).
  private _setStormDark(on: boolean): void {
    if (on && !this._stormDark) {
      const bg = this._scene?.background;
      if (bg instanceof THREE.Color) this._stormBaseBg = bg.clone();
    }
    this._stormDark = on;
  }

  // Convert a plan-frame sky azimuth (deg; three-view already applied geo θ) +
  // elevation into a scene-frame directional-light POSITION at a fixed radius.
  // Compass: 0° = plan +Y (north), 90° = plan +X (east). _w mirrors X, maps plan
  // +Y → scene +Z: sceneX = −planX, sceneZ = +planY.
  private _sunTargetFromSky(azDeg: number, elevDeg: number): THREE.Vector3 {
    const R = 12000;
    const az = azDeg * Math.PI / 180, el = Math.max(0, Math.min(90, elevDeg)) * Math.PI / 180;
    const horiz = Math.cos(el) * R, y = Math.sin(el) * R + 600;
    const planX = Math.sin(az) * horiz, planY = Math.cos(az) * horiz;
    return new THREE.Vector3(-planX, y, planY);
  }

  private _hashStr(s: string): number {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) & 0x7fffffff;
    return h;
  }

  // Per-frame weather advance — called every frame from _animate. All motion is
  // buffer mutation (no allocation). Fog density easing runs even when the group
  // is hidden so toggling the layer / leaving fog clears the global scene fog.
  private _advanceWeather(dt: number, nowS: number): void {
    if (this._scene) {
      const fog = this._scene.fog as THREE.FogExp2 | null;
      if (fog && (fog as { isFogExp2?: boolean }).isFogExp2) {
        fog.density += (this._fogTarget - fog.density) * Math.min(1, dt / 2);
        // Below ~1e-5 the exponential fog is visually zero over any house-scale
        // distance — null it out cleanly rather than asymptote forever.
        if (this._fogTarget === 0 && fog.density < 1e-5) this._scene.fog = null;
      }
    }

    // True sun position (W3): ease the directional sun light toward the real
    // sky direction (τ ≈ 2 s). Runs even when the group is hidden — the sun light
    // lives outside _weatherGroup. Cleared target → leave the preset placement.
    if (this._sun && this._weatherSunTarget) {
      const k = Math.min(1, dt / 2);
      this._sun.position.lerp(this._weatherSunTarget, k);
    }

    // Storm-brewing sky darkening (W3): ease the background between the captured
    // preset tint and a darkened copy. Only touches background while easing.
    this._stormDarkAmt += ((this._stormDark ? 1 : 0) - this._stormDarkAmt) * Math.min(1, dt / 2.5);
    if (this._scene && this._stormBaseBg && this._scene.background instanceof THREE.Color) {
      if (this._stormDarkAmt > 0.002) {
        const dark = this._stormBaseBg.clone().multiplyScalar(0.82);
        this._scene.background.copy(this._stormBaseBg).lerp(dark, this._stormDarkAmt);
      } else if (!this._stormDark) {
        this._scene.background.copy(this._stormBaseBg);
        this._stormBaseBg = null;
      }
    }

    // Rain puddles (W3): ease the per-floor fade — fast in (~2 s), slow out
    // (~10 min lingering) — and apply it to each puddle decal's opacity. Runs
    // regardless of group visibility so the fade progresses (applied opacity is
    // still gated by the group's visibility flag for display).
    const fid = this._puddleFloorId;
    if (fid) {
      const cur = this._puddleFade[fid] ?? 0;
      const target = this._puddleTarget;
      const next = target > cur
        ? Math.min(target, cur + dt / 2)        // fade in over ~2 s
        : Math.max(target, cur - dt / 600);     // linger + fade out over ~10 min
      this._puddleFade[fid] = next;
      for (const pu of this._weatherPuddles) {
        (pu.mesh.material as THREE.MeshBasicMaterial).opacity = pu.baseOpacity * next;
      }
    }

    if (!this._weatherGroup.visible) return;

    // Scrolling ground-fog planes.
    const span = this._fw + 12000;
    for (let i = 0; i < this._weatherFogPlanes.length; i++) {
      const pl = this._weatherFogPlanes[i];
      pl.position.x += (i % 2 === 0 ? 1 : -1) * 200 * dt;   // 200 mm/s
      if (pl.position.x > span) pl.position.x -= 2 * span;
      else if (pl.position.x < -span) pl.position.x += 2 * span;
    }

    // Wind gust envelope (W3): every 6–14 s a 1.5 s burst doubles the horizontal
    // drift of precip + dust. Pure decay schedule; only the gap is random.
    let gustMul = 1;
    if (this._gustEnabled) {
      if (this._gustAge < 0) {
        this._gustCountdown -= dt;
        if (this._gustCountdown <= 0) this._gustAge = 0;
      } else {
        this._gustAge += dt;
        if (this._gustAge > 1.5) {
          this._gustAge = -1;
          this._gustCountdown = 6 + Math.random() * 8;
        } else {
          // Smooth 0→1→0 hump over the burst; peak ≈ 2× drift.
          gustMul = 1 + Math.sin((this._gustAge / 1.5) * Math.PI);
        }
      }
    }

    // Drifting cloud shadows (W3): slide across the yard with the wind, wrap in
    // the spawn box. Zero allocation — mutate mesh.position in place.
    for (const cs of this._weatherCloudShadows) {
      const pmesh = cs.mesh.position;
      pmesh.x += cs.driftX * dt; pmesh.z += cs.driftZ * dt;
      const maxX = cs.minX + cs.sizeX, maxZ = cs.minZ + cs.sizeZ;
      if (pmesh.x > maxX) pmesh.x -= cs.sizeX; else if (pmesh.x < cs.minX) pmesh.x += cs.sizeX;
      if (pmesh.z > maxZ) pmesh.z -= cs.sizeZ; else if (pmesh.z < cs.minZ) pmesh.z += cs.sizeZ;
    }

    // Precip / dust clouds: fall + wind drift + wobble, recycled in the band and
    // wrapped in the spawn box so wind never walks the cloud off-screen.
    const BAND = 4000;
    for (const cl of this._weatherClouds) {
      const p = cl.pos;
      const maxX = cl.minX + cl.sizeX, maxZ = cl.minZ + cl.sizeZ;
      for (let i = 0; i < cl.count; i++) {
        const j = i * 3;
        if (cl.fall) {
          p[j + 1] -= cl.fall * dt;
          if (p[j + 1] < 0) p[j + 1] += BAND;
        }
        let vx = cl.driftX * gustMul, vz = cl.driftZ * gustMul;
        if (cl.wobble) {
          const ph = cl.phase[i] + nowS * 1.3;
          vx += Math.cos(ph) * cl.wobble;
          vz += Math.sin(ph * 0.7) * cl.wobble;
        }
        let x = p[j] + vx * dt, z = p[j + 2] + vz * dt;
        if (x > maxX) x -= cl.sizeX; else if (x < cl.minX) x += cl.sizeX;
        if (z > maxZ) z -= cl.sizeZ; else if (z < cl.minZ) z += cl.sizeZ;
        p[j] = x; p[j + 2] = z;
      }
      (cl.points.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    }

    // Lightning: schedule the next strike, then run a double-flash decay
    // envelope. Deterministic-friendly — the envelope is a pure function of the
    // age since the strike; only the gap is random (fireplace-flicker idiom).
    if (this._weatherFlash) {
      if (this._flashAge < 0) {
        this._flashCountdown -= dt;
        if (this._flashCountdown <= 0) this._flashAge = 0;
      } else {
        this._flashAge += dt;
        const a = this._flashAge;
        if (a > 0.6) {
          this._flashAge = -1;
          this._flashCountdown = 8 + Math.random() * 17;   // next strike 8–25 s
          this._weatherFlash.intensity = 0;
        } else {
          // Sharp primary spike + a weaker secondary ~0.15 s later.
          const env = Math.exp(-a / 0.05) + 0.55 * Math.exp(-Math.abs(a - 0.15) / 0.04);
          this._weatherFlash.intensity = env * (this._weatherFx?.isDay ? 2.2 : 6.5);
        }
      }
    }
  }

  updateLightsSwitches(lights: Light[], switches: SwitchFixture[], stateProvider: StateProvider): void {
    if (!this._scene) return;
    this._fanRotors = [];  // rebuilt below; never spin disposed objects
    this._clearGroup(this._lightGroup);
    this._clearGroup(this._switchGroup);   // switches build into their own layer group
    const LIGHT_BODY_R = 200;
    for (const l of lights) {
      const st = itemState(l, stateProvider);
      const isOn = st?.state === 'on';
      const attrs = (st?.attributes || {}) as Record<string, unknown>;
      const rgb = Array.isArray(attrs.rgb_color) && (attrs.rgb_color as number[]).length === 3
        ? attrs.rgb_color as number[] : null;
      const bri = typeof attrs.brightness === 'number' ? attrs.brightness as number : 255;
      const intensity = lightIntensity(l);
      const kind = lightIconKind(l);
      const lh = lightHeight(l);
      const lr = lightRadius(l);
      let r = 1, g = 0.9, b = 0.7;
      if (rgb && isOn) { r = rgb[0] / 255; g = rgb[1] / 255; b = rgb[2] / 255; }
      // Fireplace forces warm orange-red regardless of HA color, plus a
      // per-frame flicker (this builder runs every render frame).
      let flickerMul = 1;
      if (kind === 'fireplace' && isOn) {
        const f1 = 0.7 + Math.random() * 0.3;
        r = 1.0 * f1; g = 0.45 * f1; b = 0.15 * f1;
        flickerMul = 0.85 + Math.random() * 0.30;
      }
      const color = new THREE.Color(r, g, b);
      const ud = { kind: 'light', entity_id: l.entity_id, fixtureId: l.id };
      const bodyMat = this._mat({
        color: isOn ? color.getHex() : 0x444444,
        emissive: isOn ? color.getHex() : 0x111111,
        emissiveIntensity: isOn ? 0.9 * intensity * flickerMul : 0.05,
        metalness: 0.2, roughness: 0.4,
      });
      const shadeMat = this._mat({
        color: 0xeeeeee, emissive: isOn ? color.getHex() : 0x000000,
        emissiveIntensity: isOn ? 0.35 * intensity : 0.0,
        metalness: 0.1, roughness: 0.7,
        transparent: true, opacity: 0.85, side: THREE.DoubleSide,
      });
      const stemMat = this._mat({
        color: 0x222227, metalness: 0.3, roughness: 0.6,
      });
      const buildBody = (): { group: THREE.Group; bodyY: number } => {
        const g = new THREE.Group();
        let bodyY = lh;
        // Faint volumetric shaft for downlights (recessed / spot): a cone of
        // light from the fixture to its floor pool. Sells "ceiling-mounted"
        // even though rooms have no ceiling plane to recess into.
        const addShaft = (topR: number) => {
          if (!isOn || lh < 400) return;
          const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(topR, lr * 0.8, lh, 24, 1, true),
            new THREE.MeshBasicMaterial({
              color: color.getHex(), transparent: true,
              opacity: Math.min(0.16, 0.07 * intensity * (0.4 + 0.6 * (bri / 255))),
              side: THREE.DoubleSide, depthWrite: false,
            }));
          shaft.position.y = -lh / 2;
          g.add(shaft);
        };
        switch (kind) {
          case 'spot': {
            // Cylindrical housing with an emissive lens at the mouth + a
            // faint beam shaft toward the floor pool.
            const housingMat = this._mat({
              color: 0x2b2e33, roughness: 0.5, metalness: 0.5,
            });
            const housing = new THREE.Mesh(
              new THREE.CylinderGeometry(LIGHT_BODY_R * 0.9, LIGHT_BODY_R * 1.05, LIGHT_BODY_R * 1.7, 20),
              housingMat,
            );
            housing.position.y = -LIGHT_BODY_R * 0.55;
            housing.userData = ud;
            g.add(housing);
            const lens = new THREE.Mesh(
              new THREE.CylinderGeometry(LIGHT_BODY_R * 0.92, LIGHT_BODY_R * 0.92, 16, 20),
              bodyMat,
            );
            lens.position.y = -LIGHT_BODY_R * 1.4;
            lens.userData = ud;
            g.add(lens);
            addShaft(LIGHT_BODY_R * 0.9);
            break;
          }
          case 'pendant': {
            // Hanging sphere on a stem from ceiling (lh) to ~lh - 600.
            const stemH = 600;
            const dropY = lh - stemH;
            bodyY = dropY;
            const stem = new THREE.Mesh(
              new THREE.CylinderGeometry(20, 20, stemH, 8),
              stemMat,
            );
            // Group origin sits at dropY; stem's top reaches lh.
            stem.position.y = stemH / 2;
            g.add(stem);
            // Ceiling canopy where the stem meets the (implied) ceiling.
            const canopy = new THREE.Mesh(
              new THREE.CylinderGeometry(70, 90, 36, 16), stemMat);
            canopy.position.y = stemH - 18;
            g.add(canopy);
            const sphere = new THREE.Mesh(
              new THREE.SphereGeometry(LIGHT_BODY_R * 0.85, 16, 16),
              bodyMat,
            );
            sphere.userData = ud;
            g.add(sphere);
            break;
          }
          case 'sconce': {
            // Half-sphere on a wall backplate, flat side facing -Z (aim with
            // the rotation option so the plate sits against the wall).
            const plate = new THREE.Mesh(
              new THREE.BoxGeometry(LIGHT_BODY_R * 1.6, LIGHT_BODY_R * 2.4, 28),
              this._mat({ color: 0x8d8f94, roughness: 0.4, metalness: 0.5 }));
            plate.position.z = 40;
            plate.userData = ud;
            g.add(plate);
            const dome = new THREE.Mesh(
              new THREE.SphereGeometry(LIGHT_BODY_R * 1.1, 16, 12, 0, Math.PI),
              bodyMat,
            );
            dome.rotation.y = Math.PI;
            dome.userData = ud;
            g.add(dome);
            break;
          }
          case 'strip': {
            // Aluminum channel + inset emissive diffuser, sized by Length.
            const Ls = lightLength(l);
            const chanMat2 = this._mat({
              color: 0x84898f, metalness: 0.7, roughness: 0.4,
            });
            const chan2 = new THREE.Mesh(new THREE.BoxGeometry(Ls, 46, 74), chanMat2);
            chan2.userData = ud;
            g.add(chan2);
            const diff2 = new THREE.Mesh(new THREE.BoxGeometry(Ls * 0.985, 18, 56), bodyMat);
            diff2.position.y = -20;
            diff2.userData = ud;
            g.add(diff2);
            break;
          }
          case 'fireplace': {
            // Open-front firebox with a mantel and animated flames. The body
            // group's origin sits at bodyY; the front (opening) faces local
            // -Z, so the rotation option aims it. This builder reruns every
            // frame while ON (keyLights forces it), so time-based flame
            // motion animates for free — smooth sines, like the 2D hearth.
            bodyY = 500;
            const W2 = 1000, H2 = 1000, D2 = 450;   // overall firebox
            const OPEN_W = 700, OPEN_H = 620;       // front opening
            const brick = this._mat({
              color: 0x4a4442, metalness: 0.05, roughness: 0.9,
            });
            const inner = this._mat({
              color: 0x17120f, roughness: 0.95,
              emissive: isOn ? 0xff5a1a : 0x1a0d06,
              emissiveIntensity: isOn ? 0.25 * flickerMul : 0.08,
            });
            // Carcass: back slab + two side columns + header above the
            // opening, leaving the front genuinely open.
            const back = new THREE.Mesh(new THREE.BoxGeometry(W2, H2, 120), brick);
            back.position.set(0, 0, D2 / 2 - 60);
            g.add(back);
            const colW = (W2 - OPEN_W) / 2;
            for (const sx of [-1, 1]) {
              const col = new THREE.Mesh(new THREE.BoxGeometry(colW, H2, D2), brick);
              col.position.set(sx * (OPEN_W / 2 + colW / 2), 0, 0);
              g.add(col);
            }
            // Opening spans from the hearth floor top (-H2/2 + 40) up OPEN_H;
            // the header fills the rest up to the carcass top.
            const openTop = -H2 / 2 + 40 + OPEN_H;
            const headerH = H2 / 2 - openTop;
            const header = new THREE.Mesh(new THREE.BoxGeometry(OPEN_W, headerH, D2), brick);
            header.position.set(0, openTop + headerH / 2, 0);
            g.add(header);
            // Mantel shelf on top. Its back is aligned FLUSH with the firebox
            // back plane (+D2/2) — never proud of it — so a wall-snapped
            // fireplace (snapFireplaceToWall parks the back on the wall face)
            // doesn't poke the shelf through the wall. A real mantel overhangs
            // the FRONT, so the extra depth extends toward the opening (−Z).
            const mantelD = D2 * 1.2;
            const mantel = new THREE.Mesh(
              new THREE.BoxGeometry(W2 * 1.15, 70, mantelD),
              this._mat({ color: 0x5d4037, roughness: 0.6 }));
            mantel.position.set(0, H2 / 2 + 35, D2 / 2 - mantelD / 2);
            g.add(mantel);
            // Firebox interior floor + back glow panel (visible through the opening).
            const hearthFloor = new THREE.Mesh(new THREE.BoxGeometry(OPEN_W, 40, D2 - 140), inner);
            hearthFloor.position.set(0, -H2 / 2 + 20, 0);
            g.add(hearthFloor);
            const glowBack = new THREE.Mesh(new THREE.PlaneGeometry(OPEN_W * 0.95, OPEN_H * 0.95), inner);
            glowBack.position.set(0, -H2 / 2 + 40 + OPEN_H / 2, D2 / 2 - 130);
            glowBack.rotation.y = Math.PI;  // face the opening (-Z)
            g.add(glowBack);
            // Logs.
            const logMat = this._mat({ color: 0x4e342e, roughness: 0.9 });
            for (const [ly, lr2, lz] of [[70, 55, -40], [150, 45, 30]] as const) {
              const log = new THREE.Mesh(new THREE.CylinderGeometry(lr2, lr2, OPEN_W * 0.7, 10), logMat);
              log.rotation.z = Math.PI / 2;
              log.position.set(0, -H2 / 2 + ly, lz);
              g.add(log);
            }
            // Flames: three emissive cones breathing/swaying on slow sines.
            if (isOn) {
              const tNow = performance.now() / 1000;
              const flames: { ox: number; r: number; h: number; om: number; ph: number; col: number }[] = [
                { ox: -180, r: 90, h: 300, om: 1.7, ph: 0.0, col: 0xe65100 },
                { ox:  170, r: 80, h: 260, om: 2.1, ph: 2.1, col: 0xef6c00 },
                { ox:    0, r: 120, h: 430, om: 1.4, ph: 4.2, col: 0xffa726 },
              ];
              for (const fl of flames) {
                const h3 = fl.h * (1 + 0.16 * Math.sin(tNow * fl.om + fl.ph)) * Math.min(1.4, intensity + 0.4);
                const sway = 30 * Math.sin(tNow * fl.om * 0.8 + fl.ph * 1.7);
                const flame = new THREE.Mesh(
                  new THREE.ConeGeometry(fl.r, h3, 10),
                  this._mat({
                    color: fl.col, emissive: fl.col,
                    emissiveIntensity: 1.6 * flickerMul,
                    transparent: true, opacity: 0.85, depthWrite: false,
                  }));
                flame.position.set(fl.ox + sway * 0.4, -H2 / 2 + 180 + h3 / 2, 0);
                flame.rotation.z = sway * 0.001;
                g.add(flame);
              }
              // Hot core.
              const coreH = 240 * (1 + 0.14 * Math.sin(tNow * 1.9 + 1.1));
              const core = new THREE.Mesh(
                new THREE.ConeGeometry(60, coreH, 8),
                this._mat({
                  color: 0xffd54f, emissive: 0xffd54f, emissiveIntensity: 2.2 * flickerMul,
                  transparent: true, opacity: 0.95, depthWrite: false,
                }));
              core.position.set(0, -H2 / 2 + 170 + coreH / 2, 0);
              g.add(core);
            }
            const hit = new THREE.Mesh(
              new THREE.BoxGeometry(W2, H2, D2),
              new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
            hit.userData = ud;
            g.add(hit);
            break;
          }
          case 'fan':
          case 'fan_light': {
            const metal = this._mat({
              color: 0x8a8f94, metalness: 0.7, roughness: 0.35,
            });
            const bladeMat = this._mat({
              color: 0x5d4037, roughness: 0.6, metalness: 0.1,
            });
            // Downrod up toward the ceiling + motor hub at the fixture height.
            const rod = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 260, 8), metal);
            rod.position.y = 170;
            g.add(rod);
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(130, 150, 90, 16), metal);
            hub.userData = ud;
            g.add(hub);
            // Rotor: 4 pitched blades on a child group the render loop spins.
            const rotor = new THREE.Group();
            rotor.position.y = -60;
            for (let k2 = 0; k2 < 4; k2++) {
              const blade = new THREE.Mesh(new THREE.BoxGeometry(620, 12, 170), bladeMat);
              blade.position.x = 620 / 2 + 90;
              blade.rotation.x = 0.14;  // blade pitch
              const arm = new THREE.Group();
              arm.rotation.y = (k2 * Math.PI) / 2;
              arm.add(blade);
              rotor.add(arm);
            }
            g.add(rotor);
            // Spin speed: the fan entity's percentage (0–100 → 0–1 rev/s).
            // Falls back to the primary entity; a plain on/off fan runs full.
            const spinSt = l.fanEntity ? stateProvider(l.fanEntity) : st;
            const spinOn = spinSt?.state === 'on';
            const sAttrs = (spinSt?.attributes ?? {}) as Record<string, unknown>;
            const pct = typeof sAttrs.percentage === 'number'
              ? sAttrs.percentage as number : (spinOn ? 100 : 0);
            if (spinOn && pct > 0) {
              this._fanRotors.push({ obj: rotor, rps: Math.min(1, Math.max(0, pct / 100)) });
            }
            if (kind === 'fan_light') {
              const globe = new THREE.Mesh(new THREE.SphereGeometry(140, 16, 12), bodyMat);
              globe.position.y = -170;
              globe.userData = ud;
              g.add(globe);
            }
            break;
          }
          case 'wall_sconce': {
            // Up/down cylinder washer on a wall plate. Backplate sits at
            // local +Z (against the wall — aim with the rotation option);
            // soft cones wash up and down the wall face when on.
            bodyY = l.height ?? 1700;
            const plateMat = this._mat({
              color: 0x54585e, metalness: 0.6, roughness: 0.4,
            });
            const plate2 = new THREE.Mesh(new THREE.BoxGeometry(140, 200, 24), plateMat);
            plate2.position.z = 40;
            plate2.userData = ud;
            g.add(plate2);
            const cyl2 = new THREE.Mesh(new THREE.CylinderGeometry(66, 66, 280, 18), plateMat);
            cyl2.userData = ud;
            g.add(cyl2);
            // Emissive caps top + bottom.
            for (const sy of [-1, 1]) {
              const capL = new THREE.Mesh(new THREE.CylinderGeometry(60, 60, 14, 18), bodyMat);
              capL.position.y = sy * 147;
              capL.userData = ud;
              g.add(capL);
            }
            if (isOn) {
              // Wall-wash cones: up and down, hugging the wall plane.
              for (const sy of [-1, 1]) {
                const wash = new THREE.Mesh(
                  new THREE.CylinderGeometry(sy > 0 ? 60 : 240, sy > 0 ? 240 : 60, 700, 16, 1, true),
                  new THREE.MeshBasicMaterial({
                    color: color.getHex(), transparent: true,
                    opacity: Math.min(0.18, 0.09 * intensity),
                    side: THREE.DoubleSide, depthWrite: false,
                  }));
                wash.position.set(0, sy * (140 + 350), 25);
                g.add(wash);
              }
            }
            break;
          }
          case 'step': {
            // Louvered step light embedded low in a wall: flush faceplate,
            // slat louvers, emissive panel behind, and a downward wash onto
            // the tread when on. Face points local -Z (aim with rotation).
            bodyY = l.height ?? 300;
            const faceMat = this._mat({
              color: 0xb9bec4, metalness: 0.4, roughness: 0.45,
            });
            const face2 = new THREE.Mesh(new THREE.BoxGeometry(190, 130, 22), faceMat);
            face2.userData = ud;
            g.add(face2);
            const glow2 = new THREE.Mesh(new THREE.BoxGeometry(150, 92, 10), bodyMat);
            glow2.position.z = -12;
            glow2.userData = ud;
            g.add(glow2);
            // Louver slats angled to throw light down.
            for (const ly2 of [-28, 0, 28]) {
              const slat = new THREE.Mesh(new THREE.BoxGeometry(150, 10, 26), faceMat);
              slat.position.set(0, ly2, -16);
              slat.rotation.x = 0.5;
              g.add(slat);
            }
            if (isOn) {
              // Short wash down the wall to the floor in front of the plate.
              // Wash LENGTH must stay positive: at a NEGATIVE fixture height
              // (sunken stairway) `bodyY` fed straight into CylinderGeometry
              // inverted the cone (wide end up) and positioned it ABOVE the
              // plate, painting a V-shaped glow up the shaft wall to y≈0 —
              // the "step light points up" bug. A sunken plate has no floor
              // at y=0 below it, so it gets a fixed short downward wash to
              // the treads instead.
              const washH = bodyY > 0 ? bodyY : 500;
              const wash2 = new THREE.Mesh(
                new THREE.CylinderGeometry(70, Math.min(500, lr * 0.6), washH, 14, 1, true),
                new THREE.MeshBasicMaterial({
                  color: color.getHex(), transparent: true,
                  opacity: Math.min(0.16, 0.08 * intensity),
                  side: THREE.DoubleSide, depthWrite: false,
                }));
              wash2.position.set(0, -washH / 2, -90);
              g.add(wash2);
            }
            break;
          }
          case 'under_cabinet': {
            // Slim aluminum channel + diffuser. Default mount height suits
            // the underside of wall cabinets; no floor disc — the point
            // light washes whatever sits below (counter, island, …) via PBR.
            bodyY = l.height ?? 1350;
            const Lmm = lightLength(l);
            const chanMat = this._mat({
              color: 0x9aa0a6, metalness: 0.7, roughness: 0.4,
            });
            const chan = new THREE.Mesh(new THREE.BoxGeometry(Lmm, 22, 38), chanMat);
            chan.userData = ud;
            g.add(chan);
            const diffuser = new THREE.Mesh(new THREE.BoxGeometry(Lmm * 0.98, 10, 28), bodyMat);
            diffuser.position.y = -14;
            diffuser.userData = ud;
            g.add(diffuser);
            break;
          }
          case 'string': {
            // LED string: emissive orbs along the length with a gentle sag,
            // strung on a thin wire. Oriented by the rotation option.
            const Lmm = lightLength(l);
            const n = Math.max(4, Math.round(Lmm / 160));
            const sag = Math.min(400, Lmm * 0.07);
            const orbMat = this._mat({
              color: isOn ? color.getHex() : 0x333338,
              emissive: isOn ? color.getHex() : 0x111114,
              emissiveIntensity: isOn ? 1.4 * intensity : 0.05,
            });
            const wirePts: THREE.Vector3[] = [];
            for (let k2 = 0; k2 < n; k2++) {
              const f2 = k2 / (n - 1);
              const x2 = (f2 - 0.5) * Lmm;
              const y2 = -sag * Math.sin(Math.PI * f2);
              wirePts.push(new THREE.Vector3(x2, y2, 0));
              const orb = new THREE.Mesh(new THREE.SphereGeometry(26, 8, 6), orbMat);
              orb.position.set(x2, y2 - 20, 0);
              orb.userData = ud;
              g.add(orb);
            }
            g.add(new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(wirePts),
              new THREE.LineBasicMaterial({ color: 0x555a60, transparent: true, opacity: 0.7 })));
            break;
          }
          case 'bowl': {
            // Open-top hemisphere (lower half), opening points up.
            const dome = new THREE.Mesh(
              new THREE.SphereGeometry(LIGHT_BODY_R * 1.2, 18, 12, 0, 2 * Math.PI, Math.PI / 2, Math.PI / 2),
              bodyMat,
            );
            dome.userData = ud;
            g.add(dome);
            break;
          }
          case 'tiered': {
            // 3 discs of decreasing radius stacked downward from lh.
            const sizes = [1.4, 1.0, 0.65];
            for (let i = 0; i < sizes.length; i++) {
              const disc = new THREE.Mesh(
                new THREE.CylinderGeometry(
                  LIGHT_BODY_R * sizes[i], LIGHT_BODY_R * sizes[i], 60, 24,
                ),
                bodyMat,
              );
              disc.position.y = -i * 90;
              disc.userData = ud;
              g.add(disc);
            }
            break;
          }
          case 'round': {
            // Flat round panel flush with ceiling.
            const panel = new THREE.Mesh(
              new THREE.CylinderGeometry(LIGHT_BODY_R * 1.7, LIGHT_BODY_R * 1.7, 50, 32),
              bodyMat,
            );
            panel.position.y = -25;
            panel.userData = ud;
            g.add(panel);
            break;
          }
          case 'recessed': {
            // Flush ceiling can: wide FLAT trim ring + recessed emissive lens
            // slightly above the trim (looking up you see a lit disc inside a
            // ring, not a protruding body) + a faint light shaft below.
            const ringMat = this._mat({
              color: 0xd8dade, roughness: 0.5, metalness: 0.1,
            });
            const ring = new THREE.Mesh(
              new THREE.CylinderGeometry(LIGHT_BODY_R * 1.25, LIGHT_BODY_R * 1.25, 18, 28),
              ringMat,
            );
            ring.position.y = -9;
            g.add(ring);
            addShaft(LIGHT_BODY_R * 0.9);
            const inner = new THREE.Mesh(
              new THREE.CylinderGeometry(LIGHT_BODY_R * 0.9, LIGHT_BODY_R * 0.9, 14, 28),
              bodyMat,
            );
            inner.position.y = -45;
            inner.userData = ud;
            g.add(inner);
            break;
          }
          case 'jar': {
            // Mason-jar: cylinder + dome top.
            const jar = new THREE.Mesh(
              new THREE.CylinderGeometry(LIGHT_BODY_R * 0.95, LIGHT_BODY_R * 0.95,
                                         LIGHT_BODY_R * 2.2, 24),
              bodyMat,
            );
            jar.position.y = -LIGHT_BODY_R * 1.1;
            jar.userData = ud;
            g.add(jar);
            const cap = new THREE.Mesh(
              new THREE.SphereGeometry(LIGHT_BODY_R * 0.95, 18, 10, 0, 2 * Math.PI, 0, Math.PI / 2),
              bodyMat,
            );
            cap.userData = ud;
            g.add(cap);
            break;
          }
          case 'oval': {
            const ell = new THREE.Mesh(
              new THREE.SphereGeometry(LIGHT_BODY_R, 18, 14),
              bodyMat,
            );
            ell.scale.set(1.3, 0.65, 1.3);
            ell.userData = ud;
            g.add(ell);
            break;
          }
          case 'lamp': {
            // Floor lamp at lh: vertical pole + cone shade.
            bodyY = 0;
            const poleH = Math.max(800, lh - 400);
            const pole = new THREE.Mesh(
              new THREE.CylinderGeometry(30, 40, poleH, 12),
              stemMat,
            );
            pole.position.y = poleH / 2;
            g.add(pole);
            const baseDisc = new THREE.Mesh(
              new THREE.CylinderGeometry(180, 180, 30, 24),
              stemMat,
            );
            baseDisc.position.y = 15;
            g.add(baseDisc);
            const shade = new THREE.Mesh(
              new THREE.CylinderGeometry(220, 320, 380, 24, 1, true),
              shadeMat,
            );
            shade.position.y = poleH + 190;
            shade.userData = ud;
            g.add(shade);
            const bulb = new THREE.Mesh(
              new THREE.SphereGeometry(LIGHT_BODY_R * 0.6, 12, 10),
              bodyMat,
            );
            bulb.position.y = poleH + 100;
            bulb.userData = ud;
            g.add(bulb);
            break;
          }
          default: {
            // Bulb: short stem + socket from the (implied) ceiling with the
            // globe hanging just below — not a free-floating ball.
            const stem2 = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 160, 8), stemMat);
            stem2.position.y = LIGHT_BODY_R + 130;
            g.add(stem2);
            const socket = new THREE.Mesh(
              new THREE.CylinderGeometry(52, 62, 90, 14),
              this._mat({ color: 0x6f7378, metalness: 0.7, roughness: 0.35 }));
            socket.position.y = LIGHT_BODY_R + 20;
            g.add(socket);
            const sphere = new THREE.Mesh(
              new THREE.SphereGeometry(LIGHT_BODY_R, 16, 16),
              bodyMat,
            );
            sphere.userData = ud;
            g.add(sphere);
          }
        }
        return { group: g, bodyY };
      };
      const { group: body, bodyY } = buildBody();
      const p = this._w(l.x, l.y, bodyY);
      body.position.set(p.x, p.y, p.z);
      // Orient directional bodies (fireplace hearth, strip bar, sconce).
      // Same sign convention as furniture: 2D screen-CW → negate for scene Y.
      body.rotation.y = -lightRotation(l) * Math.PI / 180;
      // Stamp userData on the outer Group so the parent-walk in the raycaster
      // finds the click target even when the geometry hit lacks userData
      // (e.g. furniture children, decorative meshes, etc.).
      body.userData = ud;
      // Cartoon outlines on the fixture body (opaque meshes only — pools,
      // shafts, and glass are transparent and skip automatically). Shells
      // are raycast hits too, but the parent-walk still lands on `body`.
      this._addOutlines(body, 8, 60);
      this._lightGroup.add(body);
      // Always-on invisible click target. Light bodies vary wildly per kind —
      // open-ended cones (spot, lamp shade), thin strips, sconces, fireplace
      // hearths — and a small unlit body is hard to click. A 400 mm
      // transparent sphere centered on the body guarantees a generous
      // hit area regardless of state or kind.
      const hitMesh = new THREE.Mesh(
        new THREE.SphereGeometry(400, 8, 6),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      );
      hitMesh.position.set(p.x, p.y, p.z);
      hitMesh.userData = ud;
      this._lightGroup.add(hitMesh);
      if (isOn) {
        const li = (0.6 + 1.4 * (bri / 255)) * intensity * flickerMul;
        const dist = Math.max(2000, lr * 5);
        // Scene-space front direction (unit, horizontal). Body faces local -Z
        // with body.rotation.y = -lightRotation·π/180 and _w mirrors X, so the
        // emitting face points scene (sin φ, 0, -cos φ), φ = lightRotation·rad.
        const yaw = lightRotation(l) * Math.PI / 180;
        const fdx = Math.sin(yaw), fdz = -Math.cos(yaw);
        if (kind === 'step') {
          // Embedded in a wall / stair edge: a forward cone only, so light
          // never bleeds behind the wall — AND never above the fixture. The
          // cone half-angle (57°) plus the 60° downward tilt keep the cone's
          // upper edge at ~horizontal: the previous 155°/35° combo threw its
          // upper edge 42° ABOVE horizontal, which painted the opposite
          // stairwell wall up near floor level when the fixture sat at a
          // negative height ("light points up at the floor" bug). The
          // SpotLight's .target must live in the scene graph — parent it
          // into _lightGroup too so _clearGroup disposes both on rebuild.
          const spot = new THREE.SpotLight(color.getHex(), li, dist, 1.0, 0.5, 1.5);
          // Origin sits 120 mm out along the FRONT so the wall the plate is
          // flush-mounted in is never between the light and the treads (shadow
          // maps are off — an origin inside/behind the wall slab would blast
          // the slab's near face at point-blank range instead).
          const ox = p.x + fdx * 120, oz = p.z + fdz * 120;
          spot.position.set(ox, p.y - 50, oz);
          const tilt = 60 * Math.PI / 180, ch = Math.cos(tilt), D = 1500;
          const tgt = new THREE.Object3D();
          tgt.position.set(
            ox + fdx * ch * D,
            (p.y - 50) - Math.sin(tilt) * D,
            oz + fdz * ch * D,
          );
          this._lightGroup.add(tgt);
          spot.target = tgt;
          this._lightGroup.add(spot);
        } else {
          const pl = new THREE.PointLight(color.getHex(), li, dist, 1.5);
          pl.position.set(p.x, p.y - 50, p.z);
          this._lightGroup.add(pl);
        }
        // Skip floor pool for sconce (wall), plain fan (no light), and
        // under-cabinet strips (their wash lands on the counter below via
        // the point light, not the floor).
        if (kind !== 'sconce' && kind !== 'fan' && kind !== 'under_cabinet' && kind !== 'wall_sconce') {
          // Step lights emit from one face only → a HALF-disc pool bulging
          // toward the front, its flat diameter lying along the wall line
          // (centered on the fixture). After rotation.x=-π/2 a CircleGeometry
          // vertex at angle a lands at scene (cos a, 0, -sin a); the arc
          // midpoint sits at scene (-sin start, -cos start), which we align to
          // the front (fdx, fdz) via start = atan2(-fdx, -fdz).
          const poolGeo = kind === 'step'
            ? new THREE.CircleGeometry(lr, 24, Math.atan2(-fdx, -fdz), Math.PI)
            : new THREE.CircleGeometry(lr, 48);
          const disc = new THREE.Mesh(
            poolGeo,
            new THREE.MeshBasicMaterial({
              color: color.getHex(), transparent: true,
              opacity: Math.min(1, (0.18 + 0.22 * (bri / 255)) * intensity * flickerMul),
              side: THREE.DoubleSide, depthWrite: false,
            }));
          disc.rotation.x = -Math.PI / 2;
          // The pool represents light hitting the walking surface. For a light
          // sunk below the floor (negative height — a step light on a sunken
          // stair shaft) the surface it washes is lower too, so draw the pool
          // at its own level; ceiling lights (height ≫ 3) still pool at y≈3.
          const dp2 = this._w(l.x, l.y, Math.min(3, lightHeight(l) + 3));
          disc.position.set(dp2.x, dp2.y, dp2.z);
          // Floor pool is also a click target — much bigger than the body, so
          // a bird's-eye click anywhere in the lit area toggles the light.
          disc.userData = ud;
          this._lightGroup.add(disc);
        }
      }
    }
    for (const sw of switches) {
      const st = itemState(sw, stateProvider);
      const isOn = st?.state === 'on';
      const col = isOn ? 0x4caf50 : 0x555555;
      const box = new THREE.Mesh(
        // 3D plate tracks the user-set size (2D plate mm × the original
        // 140/320 3D proportion).
        new THREE.BoxGeometry(switchSize(sw) * 0.44, switchSize(sw) * 0.44 * 1.4, 40),
        this._mat({
          color: col, emissive: col,
          emissiveIntensity: isOn ? 0.4 : 0.08, metalness: 0.1, roughness: 0.7,
        }));
      const p = this._w(sw.x, sw.y, switchHeight(sw));
      box.position.set(p.x, p.y, p.z);
      // 2D `ctx.rotate(rot)` is CW on screen; Three Y rotation with the X
      // mirror in `_w` is also CW from above, so negate to match.
      box.rotation.y = -switchRotation(sw) * Math.PI / 180;
      box.userData = { kind: 'switch', entity_id: sw.entity_id, fixtureId: sw.id };
      this._switchGroup.add(box);
    }
  }

  updateZonesWorld(zones: ZoneWorld[]): void {
    if (!this._scene) return;
    this._clearGroup(this._zoneGroup);
    const wallH = this._ZONE_H, thick = 60;
    for (const z of zones) {
      const v = z.vertices;
      if (v.length < 3) continue;
      const wallMat = this._mat({
        color: z.color, emissive: z.color, emissiveIntensity: z.occupied ? 0.3 : 0.1,
        transparent: true, opacity: z.occupied ? 0.28 : 0.15,
        side: THREE.DoubleSide, depthWrite: false,
      });
      const lineMat = new THREE.LineBasicMaterial({
        color: z.color, transparent: true, opacity: 0.6,
      });
      const group = new THREE.Group();
      for (let i = 0; i < v.length; i++) {
        const a = v[i], b = v[(i + 1) % v.length];
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) continue;
        const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        const angle = Math.atan2(-dx, dy);
        const geo = new THREE.BoxGeometry(thick, wallH, len);
        const mesh = new THREE.Mesh(geo, wallMat.clone());
        const p = this._w(cx, cy, wallH / 2);
        mesh.position.set(p.x, p.y, p.z);
        mesh.rotation.y = angle;
        group.add(mesh);
      }
      const topPts = v.map(pt => this._w(pt.x, pt.y, wallH));
      topPts.push(topPts[0].clone());
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(topPts), lineMat));
      this._zoneGroup.add(group);
    }
  }

  updateHalos(halos: HaloWorld[]): void {
    if (!this._scene) return;
    this._clearGroup(this._haloGroup);
    const wallH = this._OBJ_H;
    for (const h of halos) {
      const color = h.occupied ? 0xff9800 : 0x888888;
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(h.radius, h.radius, wallH, 48, 1, true),
        this._mat({
          color, emissive: color, emissiveIntensity: h.occupied ? 0.3 : 0.1,
          transparent: true, opacity: h.occupied ? 0.22 : 0.12,
          side: THREE.DoubleSide, depthWrite: false,
        }));
      const p = this._w(h.x, h.y, wallH / 2);
      cyl.position.set(p.x, p.y, p.z);
      this._haloGroup.add(cyl);
    }
  }

  // ── AI avatars (wandering people for simple presence sensors) ────────────
  // Scene→world inverse of _w (drops the height).
  private _sceneToWorld(sx: number, sz: number): { x: number; y: number } {
    return { x: this._fw / 2 - sx, y: sz + this._fd / 2 };
  }

  // The AI avatar's home room: the closed wall loop containing its sensor.
  // Simple presence sensors only know "someone is in this room", so the
  // avatar is HARD-confined to this loop (spawn, wander goals, activity
  // anchors). Sensors outside every loop roam their nav region as before —
  // and radar targets from positional sensors are never confined at all.
  private _aiHomeLoop(wx: number, wy: number): Vec2[] | null {
    return loopContaining(this._wallLoops, wx, wy);
  }

  // Advance one AI avatar's virtual raw position for this frame and rewrite the
  // synthetic target's x/y in place. Everything downstream then treats it as a
  // radar target. See AiState. `dt` is the shared frame dt.
  private _advanceAi(t: TargetWorld, dt: number): void {
    const goalMode = !!t.ble;
    let ai = this._aiState[t.key];
    if (!ai) {
      // First sighting: seed the virtual raw at the anchor / solve, snapped to a
      // free cell so it never spawns inside a footprint / across a wall. Wander
      // avatars additionally snap into their sensor's home room (loop); BLE
      // people are real devices, so no room confinement (loop = null). Start
      // IDLE so it settles a beat before moving.
      let x = t.x, y = t.y;
      if (this._nav && this._nav.blockedCount > 0) {
        const gi = this._cellIdxOf(t.x, t.y);
        if (this._nav.blocked[gi] || this._nav.region[gi] < 0) {
          const loop = goalMode ? null : this._aiHomeLoop(t.x, t.y);
          const gr = this._regionOfWorld(t.x, t.y);
          const sc = this._cellToScene(this._nearestFreeCellInLoop(gi, gr, loop));
          const w = this._sceneToWorld(sc.x, sc.z);
          x = w.x; y = w.y;
        }
      }
      ai = {
        x, y, goalX: x, goalY: y, state: 'idle', timer: 1 + Math.random() * 2,
        path: null, speed: 0.7, anchorX: t.x, anchorY: t.y,
        mode: goalMode ? 'goal' : 'wander',
      };
      this._aiState[t.key] = ai;
      t.x = x; t.y = y;
      return;
    }

    // BLE goal mode: the only goal source is the latest solve (t.x/t.y). Replan
    // an A* path when the solve jumps >400 mm from the last planned goal; walk
    // the path at human speed; idle when arrived so the dwell systems (sit on a
    // nearby couch, etc.) can capture the rig.
    if (ai.mode === 'goal') {
      this._advanceBleGoal(ai, t, dt);
      t.x = ai.x; t.y = ai.y;
      return;
    }

    ai.anchorX = t.x; ai.anchorY = t.y;   // sensor may have been moved / re-placed

    if (ai.state === 'wander') {
      // Walk the virtual raw along the planned waypoint chain at leg speed.
      this._walkAlongPath(ai, dt);
      if (!ai.path || !ai.path.length) {
        ai.state = 'idle'; ai.timer = 4 + Math.random() * 11;   // dwell 4..15 s
      }
    } else {
      // IDLE / ENGAGED: hold position so the dwell systems can capture it. Once
      // the rig is actually captured (sit / activity / lie), freeze longer so the
      // avatar visibly uses the furniture; the freeze release moves it away and
      // the existing hysteresis stands it back up.
      const h = this._humanoids[t.key];
      const captured = !!h && (h.sit > 0.5 || h.act > 0.5 || h.lie > 0.5);
      if (captured && ai.state !== 'engaged') {
        ai.state = 'engaged'; ai.timer = 20 + Math.random() * 25;  // 20..45 s
      }
      ai.timer -= dt;
      if (ai.timer <= 0) {
        this._aiPickGoal(ai);
        ai.state = 'wander';
        if (!ai.path || !ai.path.length) { ai.state = 'idle'; ai.timer = 3 + Math.random() * 4; }
      }
    }
    t.x = ai.x; t.y = ai.y;
  }

  // Walk a virtual raw position along its planned waypoint chain by arc-length
  // for this frame (leg speed × dt). Shared by wander + BLE-goal controllers.
  // Mutates ai.x/ai.y and consumes ai.path in place.
  private _walkAlongPath(ai: AiState, dt: number): void {
    let travel = ai.speed * 1000 * dt;
    for (let guard = 0; guard < 32 && ai.path && ai.path.length && travel > 1e-3; guard++) {
      const wp = ai.path[0];
      const dx = wp.x - ai.x, dy = wp.y - ai.y;
      const d = Math.hypot(dx, dy);
      if (d <= 150) { ai.path.shift(); continue; }
      if (d <= travel) { ai.x = wp.x; ai.y = wp.y; travel -= d; ai.path.shift(); }
      else { ai.x += (dx / d) * travel; ai.y += (dy / d) * travel; travel = 0; }
    }
  }

  // BLE goal-mode step: the incoming solve (t.x/t.y) is the sole goal. Replan an
  // A*-verified path when the solve moves >400 mm from the last planned goal (or
  // we have none and are far from it); otherwise keep walking the current path.
  // When close / arrived, hold still so the dwell systems can capture the rig
  // (sitting on a couch near the fix is the desired outcome). No wander, no room
  // confinement — a real device really is where the radios say it is.
  private _advanceBleGoal(ai: AiState, t: TargetWorld, dt: number): void {
    const gx = t.x, gy = t.y;
    const moved = Math.hypot(gx - ai.goalX, gy - ai.goalY);
    const far = Math.hypot(gx - ai.x, gy - ai.y);
    if (moved > 400 || (!ai.path && far > 400)) {
      ai.speed = 0.7 + Math.random() * 0.35;   // m/s — human walk pace
      this._bleReplan(ai, gx, gy);
    }
    if (ai.path && ai.path.length) this._walkAlongPath(ai, dt);
    if (!ai.path || !ai.path.length) ai.state = 'idle';
    else ai.state = 'wander';
  }

  // Plan a walkable path from the BLE rig's virtual raw to the goal (solve). Nav
  // is region-aware (snap goal to a reachable free cell) but NOT loop-confined.
  private _bleReplan(ai: AiState, gx: number, gy: number): void {
    ai.goalX = gx; ai.goalY = gy;
    const n = this._nav;
    if (!n || n.blockedCount === 0) { ai.path = [{ x: gx, y: gy }]; return; }
    const region = this._regionOfWorld(ai.x, ai.y);
    const goalCell = this._nearestFreeCellInRegion(this._cellIdxOf(gx, gy), region);
    const gs = this._cellToScene(goalCell);
    const gw = this._sceneToWorld(gs.x, gs.z);
    const start = this._nearestFreeCell(this._cellIdxOf(ai.x, ai.y));
    const cells = (start === goalCell) ? [goalCell] : this._aStar(start, goalCell);
    if (!cells) { ai.path = [{ x: gw.x, y: gw.y }]; return; }
    const wp = this._stringPull(cells, gs).map(s => this._sceneToWorld(s.x, s.z));
    ai.path = wp.length ? wp : [{ x: gw.x, y: gw.y }];
  }

  // Choose the AI's next wander goal and plan a walkable path to it. 25% of the
  // time the goal is near a sit / activity anchor in the same region (so the
  // avatar visibly uses the room); otherwise it's a random free cell within
  // ~4.5 m of the anchor. When the sensor sits inside a closed wall loop the
  // goal MUST fall inside that loop — a simple presence sensor only vouches
  // for its own room, so its avatar never wanders into adjacent rooms.
  private _aiPickGoal(ai: AiState): void {
    const region = this._regionOfWorld(ai.anchorX, ai.anchorY);
    const loop = this._aiHomeLoop(ai.anchorX, ai.anchorY);
    let gx: number | null = null, gy = 0;
    if (Math.random() < 0.25) {
      const cands: { x: number; y: number }[] = [];
      const consider = (sx: number, sz: number) => {
        const w = this._sceneToWorld(sx, sz);
        if (Math.hypot(w.x - ai.anchorX, w.y - ai.anchorY) > 6000) return;
        if (this._regionOfWorld(w.x, w.y) !== region) return;
        if (loop && !pip(w.x, w.y, loop)) return;
        cands.push(w);
      };
      for (const a of this._activityAnchors) consider(a.x, a.z);
      for (const sp of this._sitSpots) consider(sp.x, sp.z);
      if (cands.length) { const c = cands[(Math.random() * cands.length) | 0]; gx = c.x; gy = c.y; }
    }
    if (gx === null) {
      const c = this._aiRandomCell(ai.anchorX, ai.anchorY, region, loop);
      if (c) { gx = c.x; gy = c.y; }
    }
    ai.speed = 0.55 + Math.random() * 0.45;   // m/s per leg
    if (gx === null) { ai.path = null; ai.goalX = ai.x; ai.goalY = ai.y; return; }

    const n = this._nav;
    if (!n || n.blockedCount === 0) {
      ai.path = [{ x: gx, y: gy }]; ai.goalX = gx; ai.goalY = gy; return;
    }
    // Snap the goal to a walkable cell in the region + home loop (anchors sit
    // inside blocked footprints; we want the avatar to STOP just outside,
    // within dwell range — and still inside its room).
    const goalCell = this._nearestFreeCellInLoop(this._cellIdxOf(gx, gy), region, loop);
    const gs = this._cellToScene(goalCell);
    const gw = this._sceneToWorld(gs.x, gs.z);
    const start = this._nearestFreeCell(this._cellIdxOf(ai.x, ai.y));
    const cells = (start === goalCell) ? [goalCell] : this._aStar(start, goalCell);
    if (!cells) { ai.path = [{ x: gw.x, y: gw.y }]; ai.goalX = gw.x; ai.goalY = gw.y; return; }
    const wp = this._stringPull(cells, gs).map(s => this._sceneToWorld(s.x, s.z));
    ai.path = wp.length ? wp : [{ x: gw.x, y: gw.y }];
    const last = ai.path[ai.path.length - 1];
    ai.goalX = last.x; ai.goalY = last.y;
  }

  // A random free cell within `R` mm of the anchor whose region matches.
  // `loop` is the anchor's home room: when set it's a HARD filter (the AI
  // avatar never leaves its sensor's room); null = unroomed sensor, any
  // in-region cell within range qualifies. World-mm center, or null.
  private _aiRandomCell(anchorWx: number, anchorWy: number, region: number,
                        loop: Vec2[] | null):
      { x: number; y: number } | null {
    const n = this._nav;
    if (!n) {
      return { x: anchorWx + (Math.random() - 0.5) * 4000,
               y: anchorWy + (Math.random() - 0.5) * 4000 };
    }
    const R = 4500;
    const c0 = this._cellIdxOf(anchorWx, anchorWy);
    const cx0 = c0 % n.nx, cy0 = (c0 / n.nx) | 0;
    const rad = Math.ceil(R / n.cell);
    const any: { x: number; y: number }[] = [];
    for (let cy = cy0 - rad; cy <= cy0 + rad; cy++) {
      if (cy < 0 || cy >= n.ny) continue;
      for (let cx = cx0 - rad; cx <= cx0 + rad; cx++) {
        if (cx < 0 || cx >= n.nx) continue;
        const i = cy * n.nx + cx;
        if (n.blocked[i]) continue;
        if (region >= 0 && n.region[i] !== region) continue;
        const wx = (cx + 0.5) * n.cell, wy = (cy + 0.5) * n.cell;
        if (Math.hypot(wx - anchorWx, wy - anchorWy) > R) continue;
        if (loop && !pip(wx, wy, loop)) continue;   // hard room confinement
        any.push({ x: wx, y: wy });
      }
    }
    return any.length ? any[(Math.random() * any.length) | 0] : null;
  }

  updateTargets(targets: TargetWorld[], ctx?: ActivityContext): void {
    if (!this._scene) return;
    const now = performance.now() / 1000;
    // Bed pass derives its own dt from the previous call (per-humanoid dt is
    // already consumed by the walk integrator).
    const frameDt = this._lastTargetsNow ? Math.min(0.1, now - this._lastTargetsNow) : 0.016;
    this._lastTargetsNow = now;
    const seen = new Set<string>();
    // Stale-chunk defense: a mixed-version module graph could call the old
    // 1-arg signature. Treat a missing context as no live entities.
    const entityOn = ctx?.entityOn ?? EMPTY_ENTITY_ON;
    // RAW world target positions this frame, keyed by target — the bed-covers
    // pass tests footprint containment in world coords.
    const rawPos: Record<string, { x: number; y: number }> = {};
    // Walking (non-anchored, visible) rigs eligible for mutual separation this
    // frame, resolved after the main loop so they gently push apart.
    const movers: { h: Humanoid; key: string }[] = [];

    // AI-avatar pre-pass: advance each synthetic target's virtual raw position
    // and rewrite its x/y IN PLACE (the targets array is rebuilt each frame in
    // three-view, so mutating is safe). Must run before the bed pre-pass and the
    // main loop so both see the avatar's real position.
    for (const t of targets) if (t.ai || t.ble) this._advanceAi(t, frameDt);

    // Pre-pass: per-bed occupancy from RAW footprint containment, for the
    // lay-in-bed gate. Lying capacity = max(1, floor(bedWidth / 700)) side-by-
    // side lanes; occupants beyond capacity do NOT lie (they stand — `lane < 0`).
    // A bed with shared covers ON + ≥2 occupants runs the hidden-under-covers
    // effect instead of lying; a covers-OFF bed lays every in-capacity occupant
    // in its lane. bedOfTarget maps each target to the first bed it's inside;
    // lieLateral gives its lane's local-x offset.
    const bedOfTarget: Record<string, { id: string; count: number; lane: number; cap: number }> = {};
    const lieLateral: Record<string, number> = {};
    for (const bed of this._beds) {
      const keys: string[] = [];
      for (const t of targets) {
        const l = furnitureWorldToLocal(bed.rotation, t.x - bed.x, t.y - bed.y);
        if (Math.abs(l.x) <= bed.w / 2 && Math.abs(l.y) <= bed.h / 2) keys.push(t.key);
      }
      const cap = Math.max(1, Math.floor(bed.w / 700));
      const sorted = [...keys].sort();
      // Lanes centered across the bed width (used lanes ≤ capacity); occupants
      // past capacity get lane −1 and never lie.
      const used = Math.min(cap, sorted.length);
      for (let i = 0; i < sorted.length; i++) {
        const k = sorted[i];
        const lane = i < cap ? i : -1;
        if (!(k in bedOfTarget)) bedOfTarget[k] = { id: bed.id, count: keys.length, lane, cap };
        if (lane >= 0 && used > 1)
          lieLateral[k] = (lane - (used - 1) / 2) * (bed.w / (used + 1));
      }
    }

    // ── Seating v2 CLAIM map: seat-spot id → the key of the rig that owns it.
    // Rebuilt every frame from LIVE rigs (this._humanoids) so a despawned/disposed
    // rig can never leak a claim, and updated in-loop as rigs capture so two
    // avatars converging in the same frame don't grab the same cushion. A rig may
    // only capture a spot that is unclaimed or already its own.
    const seatClaims = new Map<string, string>();
    for (const key in this._humanoids) {
      const hh = this._humanoids[key];
      if (hh.sitSpotId) seatClaims.set(hh.sitSpotId, key);
    }

    for (const t of targets) {
      seen.add(t.key);
      rawPos[t.key] = { x: t.x, y: t.y };
      let h = this._humanoids[t.key];
      // Resolve the requested avatar variant to a concrete kind (stable per
      // target key so 'random' keeps its choice across rebuilds/frames).
      // Identity fusion (B3): a fused person overrides the kind (their chosen
      // avatar, else a pet default, else keep this target's own pool pick) AND
      // the tint. The existing rebuild-on-kind/color-change path swaps the rig
      // cleanly — including humanoid⇄quadruped when a pet is fused on.
      // `stableKind` is the deterministic (djb2) resolution — used for the
      // rebuild comparison so a per-frame pool pick never triggers a rebuild.
      // `fromPool` marks a non-deterministic spec (pool of ≥2 / 'random'): those
      // RE-ROLL their concrete kind on a FRESH spawn (Math.random) and are exempt
      // from the kind-mismatch rebuild. Explicit single kinds + identified people
      // never re-roll.
      let stableKind = resolveAvatar(t.avatar, t.avatars, t.key);
      let fromPool = avatarFromPool(t.avatar, t.avatars);
      let wantColor = t.color;
      if (t.person) {
        // A fused person with an explicit avatar / pet default is a fixed
        // identity (no pool re-roll); a person without one keeps the pool pick.
        if (t.person.avatarKind) { stableKind = t.person.avatarKind; fromPool = false; }
        else if (t.person.isPet) { stableKind = 'cat'; fromPool = false; }
        wantColor = hexToInt(t.person.color);
      }
      // Rebuild on tint change, or a genuine identity (non-pool) kind change.
      // Pool rigs keep their rolled look on recolor (forcedKind carries it over).
      let forcedKind: AvatarKind | null = null;
      if (h && h.color !== wantColor && fromPool) forcedKind = h.avatarKind;
      if (h && (h.color !== wantColor || (!fromPool && h.avatarKind !== stableKind))) {
        this._targetGroup.remove(h.group);
        this._disposeHumanoid(h);
        delete this._humanoids[t.key];
        h = undefined as unknown as Humanoid;
      }
      if (!h) {
        // Fresh spawn: re-roll a pool/random look with Math.random (respawns look
        // different); keep a carried-over look on recolor; else the stable pick.
        const kind = forcedKind ?? (fromPool
          ? resolveAvatar(t.avatar, t.avatars, t.key, Math.random)
          : stableKind);
        h = PET_KIND_SET.has(kind)
          ? this._buildQuadruped(wantColor, kind)
          : this._buildHumanoid(wantColor, kind);
        this._humanoids[t.key] = h;
        this._targetGroup.add(h.group);
      }
      // Restore visibility on every seen rig: the two-in-bed pass hides
      // occupants each frame, so a rig that left a bed (or the covers
      // disengaged) is made visible again here before the bed pass re-decides.
      h.group.visible = true;
      // Re-acquired mid-despawn: cancel any fade and restore full opacity so a
      // brief radar dropout doesn't leave a half-transparent rig.
      if (h.despawnMode) {
        if (h.despawnMode === 'slow') { h.fadeAlpha = 1; this._fadeRig(h, 1); }
        h.despawnMode = null;
      }
      const p = this._w(t.x, t.y, 0);   // RAW radar goal, scene coords

      // First sighting of this target: anchor the raw + nav trackers to the
      // spawn point so the next frame's delta is a real velocity, not the bogus
      // origin-to-spawn vector (which used to lock facing in a wrong direction
      // and make the figure walk backwards). Snap nav to the nearest free cell
      // if the radar drops the person inside a footprint.
      if (!h.initialized) {
        h.navX = p.x; h.navZ = p.z;
        if (this._nav && this._nav.blockedCount > 0) {
          const gi = this._cellIdxOf(t.x, t.y);
          // Snap into the region the target actually occupies (the free cell
          // nearest the raw point) so a spawn inside a footprint lands on the
          // reachable side — never across a wall into the neighbouring room.
          if (this._nav.blocked[gi] || this._nav.region[gi] < 0) {
            const gr = this._regionOfWorld(t.x, t.y);
            const sc = this._cellToScene(this._nearestFreeCellInRegion(gi, gr));
            h.navX = sc.x; h.navZ = sc.z;
          }
        }
        h.lastX = h.navX; h.lastZ = h.navZ;
        this._pinCarrot(h);
        h.rawLastX = p.x; h.rawLastZ = p.z;
        h.lastUpdate = now;
        h.vx = 0; h.vz = 0; h.rawVx = 0; h.rawVz = 0;
        h.facing = 0;     // arbitrary; updated as soon as motion is detected
        h.path = null; h.pathRev = -1; h.goalCell = -1;
        h.initialized = true;
      }

      // dt is clamped for animation stability, but velocity must divide by
      // the REAL elapsed time — dividing a multi-frame gap's displacement by
      // the clamp (tab resume, slow devices, throttled rAF) overestimates
      // speed several-fold and spikes facing / gait / the sitting detector.
      const dtFull = Math.max(1e-3, now - h.lastUpdate);
      const dt = Math.min(0.1, dtFull);
      h.lastUpdate = now;

      // Two speeds (see DESIGN): `rawSpeed` = the low-passed RAW radar velocity,
      // drives sit/activity/dwell TRIGGERS and the seek pace; `navSpeed` (below,
      // h.vx/h.vz) = the low-passed NAV velocity, drives gait + facing so the
      // feet/turns follow the actual detour path. Keeping them separate stops
      // detour walking from feeding back into the dwell gates.
      {
        const rix = (p.x - h.rawLastX) / dtFull, riz = (p.z - h.rawLastZ) / dtFull;
        const al = Math.min(1, dt * 4);
        h.rawVx = h.rawVx * (1 - al) + rix * al;
        h.rawVz = h.rawVz * (1 - al) + riz * al;
      }
      h.rawLastX = p.x; h.rawLastZ = p.z;
      const rawSpeedMms = Math.hypot(h.rawVx, h.rawVz);
      // Snapshot for the edge-aware despawn decision (made once when missed).
      h.lastEdge = !!t.edge;
      h.lastRawSpeed = rawSpeedMms / 1000;

      // ── Seating v2: a target dwelling (near-zero speed) IN FRONT of a sittable
      // piece eases into a seated pose anchored on it; real movement (or leaving
      // the seat radius) stands it back up. Spots are CLAIMED so two avatars never
      // land on the same cushion, and capture is gated to the seat's front
      // halfspace so a rig behind the couch walks around instead of blending
      // through the backrest. Speed/dwell TRIGGERS read the RAW position `p` (the
      // visual blend can't feed back); the front-side gate reads the NAV position
      // (where the rig actually renders while walking).
      const rawSpeedMs = rawSpeedMms / 1000;
      if (rawSpeedMs < 0.15) h.dwell += dt; else h.dwell = Math.max(0, h.dwell - dt * 3);
      // Re-resolve the held spot from the LIVE array (furniture may have rebuilt);
      // if it's gone (piece deleted), drop the claim.
      if (h.sitSpotId) {
        h.sitSpot = this._sitSpots.find(s => s.id === h.sitSpotId) ?? null;
        if (!h.sitSpot) { seatClaims.delete(h.sitSpotId); h.sitSpotId = null; }
      }
      let wantSit = false;
      if (h.sitSpot) {
        const dSpot = Math.hypot(p.x - h.sitSpot.x, p.z - h.sitSpot.z);
        wantSit = rawSpeedMs <= 0.4 && dSpot <= h.sitSpot.r + 250;
        if (!wantSit) {
          h.dwell = 0;
          if (h.sit < 0.05) {   // fully stood up → release anchor + claim
            if (h.sitSpotId) seatClaims.delete(h.sitSpotId);
            h.sitSpot = null; h.sitSpotId = null;
          }
        }
      }
      if (!h.sitSpot && h.dwell > 1.2) {
        let best: SitSpot | null = null, bd = Infinity;
        for (const sp of this._sitSpots) {
          // Skip spots another rig has claimed.
          const owner = seatClaims.get(sp.id);
          if (owner && owner !== t.key) continue;
          const d2 = Math.hypot(p.x - sp.x, p.z - sp.z);
          if (d2 >= sp.r || d2 >= bd) continue;
          // Front-only entry: the rig's NAV position must be on the front side of
          // the seat (dot the seat→rig vector with the front normal), OR staged
          // in the approach zone. A rig behind the backrest is rejected — its nav
          // walks it around (nav blocks the footprint) until it dwells in front.
          // Exception: a RAW position already on the cushion (< 500 mm from the
          // spot — radar dropped the person onto the seat) sits regardless of the
          // nav side, since nav may have been snapped off the blocked footprint.
          const rawOnSeat = d2 < 500;
          const frontDot = (h.navX - sp.x) * sp.frontNx + (h.navZ - sp.z) * sp.frontNz;
          const dAppr = Math.hypot(h.navX - sp.approachX, h.navZ - sp.approachZ);
          if (!rawOnSeat && frontDot < -60 && dAppr > sp.r) continue;
          bd = d2; best = sp;
        }
        if (best) { h.sitSpot = best; h.sitSpotId = best.id; seatClaims.set(best.id, t.key); wantSit = true; }
      }
      h.sit += ((wantSit ? 1 : 0) - h.sit) * Math.min(1, dt * 3);
      const sit = h.sit;
      const spot = h.sitSpot;

      // ── Solo activities (Phase 4): a target dwelling near an activity anchor
      // (sink / dishwasher / fridge / coffee maker / exercise / shower / …)
      // eases into a kind-specific pose. Activities and sitting are separate
      // systems: no anchor is acquired while sitting (guard sit ≈ 0), so a
      // person seated on a chair never also grabs a standing appliance anchor.
      // Toilet is handled through the sit system (its seat) with a privacy
      // hook below. Release mirrors the sit hysteresis (hold the anchor while
      // the pose eases back out). All triggers read the RAW position `p`.
      let wantAct = false;
      if (h.activityAnchor) {
        const a = h.activityAnchor;
        const dA = Math.hypot(p.x - a.x, p.z - a.z);
        wantAct = !(rawSpeedMs > 0.4 || dA > a.r + 250);
        if (!wantAct) {
          h.dwell = 0;
          if (h.act < 0.05) h.activityAnchor = null;  // fully disengaged → release
        }
      }
      // Pets (quadruped rigs) never grab standing appliance anchors, so a cat
      // walking past the dishwasher doesn't strike a "loading" pose.
      if (!h.quad && !h.activityAnchor && sit < 0.1) {
        let best: ActivityAnchor | null = null, bd = Infinity;
        for (const a of this._activityAnchors) {
          if (!PHASE4_ACTIVITIES.has(a.kind)) continue;
          const dA = Math.hypot(p.x - a.x, p.z - a.z);
          if (dA >= a.r || dA >= bd) continue;
          const need = (a.kind === 'toilet' || a.kind === 'bathe') ? 2.0 : 1.2;
          if (h.dwell <= need) continue;
          // Entity-gated kinds only read while the appliance is actually on.
          // No binding → don't gate (users without HA still get the anim).
          if (ENTITY_GATED_ACTIVITIES.has(a.kind) && a.hasEntity && !entityOn[a.furnitureId]) continue;
          bd = dA; best = a;
        }
        if (best) { h.activityAnchor = best; wantAct = true; }
      }
      h.act += ((wantAct ? 1 : 0) - h.act) * Math.min(1, dt * 3);
      const act = h.act;
      const anchor = h.activityAnchor;

      // Toilet reaches through the SIT system (a toilet is sittable); flag it
      // so the privacy blur still kicks in on the seated pose.
      const toiletSit = !!(spot && spot.hostActivity === 'toilet' && sit > 0.5);
      // Resolve the engaged activity for pose + privacy purposes.
      if (anchor && act > 0.05) h.activity = anchor.kind;
      else if (toiletSit) h.activity = 'toilet';
      else if (act < 0.05) h.activity = null;

      // Seated contextual activities (Phase 5): while settled on a seat and not
      // in a privacy activity, resolve eat / work / watch from the seat's
      // context. These are narrative + tiny pose offsets keyed on h.sit; they
      // never grab an activity anchor (that path is standing-only).
      if (!h.quad && sit > 0.5 && !toiletSit && h.activity !== 'toilet') {
        const ha = spot?.hostActivity;
        if (ha === 'eat_at_table' || ha === 'work_at_desk') {
          h.activity = ha;
        } else if (spot && spot.roomId) {
          // Watch only a TV that is ON in the seat's room — from real HA state
          // when bound, or the local control state when unbound (hasEntity is
          // set for both; entityOn reflects effectiveState).
          let tvOn = false;
          const tvs = this._tvsByRoom[spot.roomId];
          if (tvs) for (const tv of tvs) {
            if (tv.hasEntity ? entityOn[tv.furnitureId] : false) { tvOn = true; break; }
          }
          h.activity = tvOn ? 'watch_tv' : null;
        } else {
          h.activity = null;  // plain sitting
        }
      }

      // Stand point: OFFSET from the anchor center along +facing so the figure
      // stands beside the appliance and looks back at it (body-forward is
      // local -Z; with yaw = anchor.facing the figure looks toward the anchor
      // from the (sinθ, cosθ) side). standOff ≈ 45% of the footprint radius.
      let standX = p.x, standZ = p.z;
      if (anchor) {
        const standOff = anchor.standOff;
        standX = anchor.x + Math.sin(anchor.facing) * standOff;
        standZ = anchor.z + Math.cos(anchor.facing) * standOff;
      }

      // ── Lay-in-bed: a target settled (raw speed < 0.15 for > 2 s) inside a bed
      // footprint eases flat onto the mattress, unless the shared-covers effect
      // is about to hide it (covers ON + ≥2 occupants). Covers-OFF beds lay every
      // occupant. Mirrors the sit hysteresis: stand up on raw speed > 0.4 or
      // leaving the footprint. All triggers read the RAW position.
      const inBed = bedOfTarget[t.key];
      const coversWouldHide = !!inBed && inBed.count >= 2 &&
        (this._beds.find(b => b.id === inBed.id)?.sharedCovers ?? true);
      // Only occupants within the bed's lane capacity lie down (lane ≥ 0); anyone
      // beyond it stands (no stacking).
      const canLie = !!inBed && inBed.lane >= 0;
      let wantLie = false;
      if (h.lieBedId && inBed && inBed.id === h.lieBedId && !coversWouldHide && canLie) {
        wantLie = rawSpeedMs <= 0.4;               // stay lying until they get up / leave
      } else if (!h.lieBedId && inBed && !coversWouldHide && canLie &&
                 sit < 0.1 && act < 0.1 && rawSpeedMs < 0.15 && h.dwell > 2) {
        wantLie = true; h.lieBedId = inBed.id;      // settle in
      }
      if (!wantLie && h.lieBedId && h.lie < 0.05) h.lieBedId = null;  // fully up → release
      h.lie += ((wantLie ? 1 : 0) - h.lie) * Math.min(1, dt * 2.5);
      const lie = h.lie;
      const lieBed = h.lieBedId ? this._beds.find(b => b.id === h.lieBedId) : null;
      const bedYaw = lieBed ? -((lieBed.rotation || 0) * Math.PI / 180) : 0;

      // ── Collision-aware navigation. While walking, the rig renders at `nav`
      // (steered around furniture/walls) rather than the raw radar point.
      // Anchored rigs (seated / activity / lying, blend > 0.3) skip nav entirely
      // — the pose blend already owns the position — and just ease nav toward
      // the rendered spot (done after px2/pz2 resolve) so stand-up is
      // continuous. See _steerNav / _aStar.
      const anchored = sit > 0.3 || act > 0.3 || lie > 0.3;
      if (!anchored) {
        // Just released a seat/appliance (or radar dropped the person into a
        // footprint): if the CARROT (pathfinding walker) sits in a blocked cell,
        // snap it out to the nearest free cell in the TARGET'S region before
        // steering, so the next path doesn't start blocked (A* from a blocked
        // start fails → straight-seek ghost) and never straight-seeks out
        // through the obstacle. nav is re-grounded onto the carrot (discontinuous
        // release — a snap here is expected) so the spring resumes cleanly.
        if (this._nav && this._nav.blockedCount > 0) {
          const nwx = this._fw / 2 - h.carrotX, nwy = h.carrotZ + this._fd / 2;
          if (this._blockedWorld(nwx, nwy)) {
            const gr = this._regionOfWorld(t.x, t.y);
            const sc = this._cellToScene(
              this._nearestFreeCellInRegion(this._cellIdxOf(nwx, nwy), gr));
            const gap = Math.hypot(sc.x - h.carrotX, sc.z - h.carrotZ);
            h.carrotX = sc.x; h.carrotZ = sc.z;
            // A genuine footprint DROP (radar teleported the person into a piece)
            // is a big jump → hard-ground nav too. A mere corner graze mid-walk is
            // small → leave nav to the spring so it doesn't teleport (that spike
            // was the old jerk this smoothing exists to kill).
            if (gap > 600) { h.navX = sc.x; h.navZ = sc.z; h.nvx = 0; h.nvz = 0; }
          }
        }
        this._steerNav(h, t, dt, rawSpeedMms);
      }

      // ── Unreachable-goal (stuck) detection + respawn. When the radar sees the
      // person through a wall into a room nav can't reach, the goal region
      // differs from the rig's; after 3 s the rig fades out fast and respawns
      // snapped into the goal region (same key → color/state carry over).
      if (!anchored && this._nav && this._nav.blockedCount > 0) {
        const nwx = this._fw / 2 - h.carrotX, nwy = h.carrotZ + this._fd / 2;
        const navRegion = this._regionOfWorld(nwx, nwy);
        const goalRegion = this._regionOfWorld(t.x, t.y);
        if (navRegion >= 0 && goalRegion >= 0 && navRegion !== goalRegion) h.stuckT += dt;
        else h.stuckT = 0;
      } else h.stuckT = 0;
      if (h.stuckT > 3 && h.respawnPhase === 0) h.respawnPhase = 1;
      // NAV velocity (drives gait + facing): low-passed nav displacement.
      {
        const nix = (h.navX - h.lastX) / dtFull, niz = (h.navZ - h.lastZ) / dtFull;
        const al = Math.min(1, dt * 4);
        h.vx = h.vx * (1 - al) + nix * al;
        h.vz = h.vz * (1 - al) + niz * al;
      }
      h.lastX = h.navX; h.lastZ = h.navZ;
      // Body-forward in this rig is local -Z; facing eases toward the nav
      // velocity heading (walking branch below).
      const speedMms = Math.hypot(h.vx, h.vz);

      if (lieBed && lie > 0.3) {
        // Head toward the headboard (+local-Z of the bed = bedYaw), so the
        // pitched-back rig lies with its head on the pillows.
        let d = bedYaw - h.facing;
        d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI;
        h.facing += d * Math.min(1, dt * 5);
      } else if (anchor && act > 0.3) {
        // Turn to face the appliance while engaging.
        let d = anchor.facing - h.facing;
        d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI;
        h.facing += d * Math.min(1, dt * 6);
      } else if (spot && sit > 0.3) {
        // Turn to the seat's facing while settling.
        let d = spot.facing - h.facing;
        d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI;
        h.facing += d * Math.min(1, dt * 6);
      } else if (speedMms > 50) {
        const want = Math.atan2(-h.vx, -h.vz);
        let d = want - h.facing;
        d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI;  // wrap to [-π, π]
        h.facing += d * Math.min(1, dt * 8);
      }
      h.group.rotation.y = h.facing;

      // Walk cycle, paced by the figure's actual on-screen displacement (the
      // smoothed velocity above) — NOT HA's speed entity, which updates on
      // its own slower cadence and made feet pump while standing / skate
      // while moving. Real gaits keep near-normal cadence and shorten the
      // stride at low speed, so cadence gets a floor instead of scaling
      // linearly down to glacial giant steps.
      const speedMs = speedMms / 1000;
      const walking = speedMs > 0.08;
      // Per-kind walk personality (duck waddle, astronaut moon-bounce, …).
      // Multiplicative on cadence / amp / bob / roll-sway only — pose/IK math
      // untouched. Since stride matching divides by cadence below, a slower
      // personality cadence automatically lengthens the stride to compensate.
      const cadence = walking ? Math.max(speedMs / 1.2, 0.7) * h.persCadence : 0;  // cycles/s
      h.phase = (h.phase + cadence * 2 * Math.PI * dt) % (2 * Math.PI);

      // Swing amplitude from stride matching: step length ≈ 2·L·amp
      // (small-angle), two steps per cycle → v = 4·L·amp·cadence, so
      // amp = v / (4·L·cadence). Feet then track the ground at every speed —
      // a fixed amplitude swept a ~40 cm arc while a slow drifter moved
      // ~7 cm per step (the cadence floor dominates down there). Eased so
      // gait starts/stops don't snap the limbs.
      const LEG_M = h.legM;  // per-rig hip height in m (adult 0.81; child scaled)
      const speedNorm = Math.min(1, speedMs / 1.4);
      const targetAmp = walking
        ? Math.min(0.55, Math.max(0.05, speedMs / (4 * LEG_M * cadence))) * h.persAmp
        : 0;
      h.amp += (targetAmp - h.amp) * Math.min(1, dt * 6);
      const amp = h.amp;
      const ampNorm = Math.min(1, amp / 0.55);

      const sinP = Math.sin(h.phase);
      // Gentle fore/aft weight shift while idle, desynced between rigs.
      const idle = Math.sin(now * 1.4 + h.idleOffset) * 0.02 * (1 - ampNorm);

      // Shared seated-root geometry — used by BOTH the humanoid pose math and
      // the position block below, so it lives OUTSIDE the rig-kind branch.
      const stand = 1 - sit;
      let squatDrop = 0;  // mm the exercise squat lowers the root (humanoid only)
      const hostTopY = spot?.hostTopY;
      let seatYeff = spot ? spot.seatY : 0;
      if (spot && hostTopY != null) {
        // Seat the rig tall enough that its SEATED shoulder clears the tabletop
        // by SH_CLEAR mm. The table-rest arm IK below solves the elbow above the
        // slab from a shoulder pivot at `shoulderWorldY = seatYeff − hipY +
        // shoulderY`; if the shoulder sits at/below the tabletop no arm pose can
        // keep the forearm above it (this was the forearm-ghosting bug on short
        // rigs — a child's seated shoulder landed ≈16 mm above a normal table,
        // forcing shMin past the 1.4 clamp and dropping the elbow through the
        // slab). Deriving the lift from the rig's own torso-sit height
        // (shoulderY − hipY) generalizes the old "tall table (bar/island)"
        // barstool cheat to every rig size. Deliberate Sims-style cheat: the
        // avatar "sits taller" so its proportions read right instead of stalling
        // the arm IK.
        const SH_CLEAR = 150;
        const torsoSit = h.shoulderY - h.hipY;   // seated shoulder height above hip
        const needSeat = hostTopY + SH_CLEAR - torsoSit;
        if (needSeat > seatYeff) seatYeff = needSeat;
      }

      if (h.quad) {
        // ── Quadruped pets: dedicated trot / sit / curl pose branch. Reuses the
        // walk-cycle phase/amp resolved above and the position / plumbob / blob
        // grounding below; the humanoid joint + activity + fidget math is
        // skipped (pets have no thought bubbles, privacy blur, or standing
        // appliance activities).
        this._applyQuadPose(h, {
          sinP, amp, ampNorm, speedMs, sit, lie, dt, now,
          soft: !!(spot && spot.soft),
        });
      } else {
      // Seated pose targets: thighs horizontal forward (hip +90°-ish), shins
      // vertical (knee −90°-ish, foot lands ≈ floor for the rig's leg
      // proportions), arms resting toward the lap. Walk pose blends toward it
      // by `sit`.
      const SIT_HIP = 1.45, SIT_KNEE = -1.45, SIT_SHOULDER = 0.45, SIT_ELBOW = 0.85;

      // ── Table-aware seated arms (Part B). Rig geometry is per-variant (adult
      // hip pivot 870, shoulder pivot 1398, upper arm 320, forearm+hand ≈ 313) —
      // a shorter child rig scales all of these, so read them off `h`.
      const HIP_Y_RIG = h.hipY, SHOULDER_Y_RIG = h.shoulderY;
      const ARM_L1 = h.armUpper, ARM_L2 = h.armLower;
      const TABLE_ARM_FWD = 380 * (h.hipY / 870);   // forward (−Z local) reach, scaled to rig size
      // Shoulder world height when fully seated: the root drops so the hip pivot
      // lands on seatYeff, and the seated body pitch ≈ 0, so the shoulder rides
      // SHOULDER_Y_RIG above the root origin.
      const shoulderWorldY = (seatYeff - HIP_Y_RIG) + SHOULDER_Y_RIG;
      // Solve shoulder + elbow rotation.x that lands the hand at world height
      // `handY`, TABLE_ARM_FWD forward of the shoulder, via the law of cosines
      // in the sagittal plane. Positive rotation.x swings a hanging limb toward
      // body-local −Z (forward) — see the humanoid section in CLAUDE.md. Angles
      // clamped to sane ranges (shoulder 0.2..1.4, elbow 0.2..2.2).
      const tableArmIK = (handY: number): { sh: number; el: number } => {
        const cl = (v: number) => Math.max(-1, Math.min(1, v));
        const down = shoulderWorldY - handY;            // vertical drop shoulder→hand
        let d = Math.hypot(TABLE_ARM_FWD, down);
        d = Math.max(Math.abs(ARM_L1 - ARM_L2) + 1, Math.min(ARM_L1 + ARM_L2 - 1, d));
        const alpha = Math.atan2(TABLE_ARM_FWD, down);  // target dir from +down axis
        const beta = Math.acos(cl((d * d + ARM_L1 * ARM_L1 - ARM_L2 * ARM_L2) / (2 * ARM_L1 * d)));
        const gamma = Math.acos(cl((ARM_L1 * ARM_L1 + ARM_L2 * ARM_L2 - d * d) / (2 * ARM_L1 * ARM_L2)));
        let sh = alpha - beta;
        let el = Math.PI - gamma;
        // Elbow-above-the-slab bound, applied BEFORE accepting the elbow solve:
        // the elbow sits at elbowY = shoulderWorldY − L1·cos(sh) and must stay
        // ≥ hostTopY + 30 or the forearm cuts diagonally through the table
        // edge. cos falls as sh grows, so the bound is a MINIMUM shoulder angle.
        const shMin = hostTopY == null ? 0
          : Math.acos(cl((shoulderWorldY - hostTopY - 30) / ARM_L1));
        if (sh < shMin) {
          sh = shMin;
          // Re-solve the forearm for the hand HEIGHT with the raised elbow
          // (flatter forearm, larger forward reach). If the target drop exceeds
          // the forearm's reach, the cl() clamp raises the hand to the closest
          // reachable height — never lowers the elbow back below the top.
          const elbowY = shoulderWorldY - ARM_L1 * Math.cos(sh);
          el = Math.acos(cl((elbowY - handY) / ARM_L2)) - sh;
        }
        // The elbow-above-slab floor (shMin) MUST win over the 1.4 sanity
        // ceiling: a short rig can need shMin > 1.4, and clamping down to 1.4
        // would drop the elbow back through the table (the forearm-ghosting
        // root cause). Raise the ceiling to shMin whenever shMin is larger.
        return {
          sh: Math.max(0.2, Math.min(Math.max(1.4, shMin), sh)),
          el: Math.max(0.2, Math.min(2.2, el)),
        };
      };

      // Walk pose values for each joint (rad), before any sit / activity blend.
      const wLHip = sinP * amp + idle, wRHip = -sinP * amp + idle;
      const wLKnee = -Math.max(0, sinP) * (0.9 * ampNorm);
      const wRKnee = -Math.max(0, -sinP) * (0.9 * ampNorm);
      const wLSh = -sinP * amp * 0.8 - idle, wRSh = sinP * amp * 0.8 - idle;
      const wLEl = 0.25 + Math.max(0, -sinP) * 0.5 * ampNorm;
      const wREl = 0.25 + Math.max(0, sinP) * 0.5 * ampNorm;
      // Whole-body English (root rotation order is YXZ: yaw = facing above,
      // pitch = forward lean into the direction of travel — NEGATIVE is a
      // forward lean — roll = lateral weight sway once per stride).
      const wLeanX = -0.12 * speedNorm * ampNorm;
      const wRollZ = sinP * 0.045 * ampNorm * h.persSway;

      // Per-joint final values. Sitting and activities are mutually exclusive
      // (anchor only acquired while sit ≈ 0), so an engaged activity overrides
      // the sit-blend path entirely.
      let lHip = wLHip * stand + SIT_HIP * sit;
      let rHip = wRHip * stand + SIT_HIP * sit;
      let lKnee = wLKnee * stand + SIT_KNEE * sit;
      let rKnee = wRKnee * stand + SIT_KNEE * sit;
      let lSh = wLSh * stand + SIT_SHOULDER * sit;
      let rSh = wRSh * stand + SIT_SHOULDER * sit;
      let lEl = wLEl * stand + SIT_ELBOW * sit;
      let rEl = wREl * stand + SIT_ELBOW * sit;
      let leanX = wLeanX * stand;
      let rollZ = wRollZ * stand;

      if (anchor) {
        // Activity pose targets (rad). Legs default to straight standing;
        // forward lean is negative (see wLeanX). See DESIGN-sims Phase 4.
        let pLHip = 0, pRHip = 0, pLKnee = 0, pRKnee = 0;
        let pLSh = 0, pRSh = 0, pLEl = 0.2, pREl = 0.2, pLean = 0;
        switch (h.activity) {
          case 'wash_hands':
            pLSh = pRSh = 0.55;
            pLEl = pREl = 0.95 + Math.sin(now * 5) * 0.18;  // scrubbing
            pLean = -0.08;
            break;
          case 'load_dishwasher':
            pLSh = pRSh = 0.7; pLEl = pREl = 0.35;
            pLean = -(0.18 + Math.max(0, Math.sin(now * 1.3)) * 0.42);  // bend down / up
            break;
          case 'make_coffee':
            pRSh = 0.85; pREl = 1.1;  // asymmetric: right arm works the machine
            pLSh = 0; pLEl = 0.2 + Math.sin(now * 1.6 + h.idleOffset) * 0.05;
            break;
          case 'forage_fridge':
            pLSh = pRSh = 0.5; pLEl = pREl = 0.6;
            pLean = -0.3;  // static peer-into-the-fridge lean
            break;
          case 'exercise': {
            const sq = Math.max(0, Math.sin(now * 3.4));  // squat cycle
            pLHip = pRHip = 0.9 * sq; pLKnee = pRKnee = -1.5 * sq;
            pLSh = pRSh = (Math.PI / 2) * 0.9; pLEl = pREl = 0.15;  // arms raised
            squatDrop = 180 * sq;
            break;
          }
          case 'toilet':
            // Defensive: the toilet normally routes through the sit system, but
            // if reached via anchor, reuse the seated pose.
            pLHip = pRHip = SIT_HIP; pLKnee = pRKnee = SIT_KNEE;
            pLSh = pRSh = SIT_SHOULDER; pLEl = pREl = SIT_ELBOW;
            break;
          case 'browse_bookshelf':
            // Reach to a shelf; a slow ±0.15 rad page-turn pulse every ~3 s.
            pLSh = pRSh = 0.6;
            pLEl = pREl = 0.5 + Math.sin(now * (2 * Math.PI / 3)) * 0.15;
            pLean = -0.1;
            break;
          case 'tend_plant': {
            // Light crouch + reach, with a slow 2 s lean cycle over the leaves.
            pLHip = pRHip = 0.3; pLKnee = pRKnee = -0.3;
            pLSh = pRSh = 0.5; pLEl = pREl = 0.6;
            pLean = -0.15 + Math.sin(now * Math.PI) * 0.05;
            break;
          }
          // shower / bathe: pose is hidden behind the privacy blur — leave the
          // relaxed standing default.
        }
        const a = act, na = 1 - act;
        lHip = wLHip * na + pLHip * a; rHip = wRHip * na + pRHip * a;
        lKnee = wLKnee * na + pLKnee * a; rKnee = wRKnee * na + pRKnee * a;
        lSh = wLSh * na + pLSh * a; rSh = wRSh * na + pRSh * a;
        lEl = wLEl * na + pLEl * a; rEl = wREl * na + pREl * a;
        leanX = wLeanX * na + pLean * a;
        rollZ = wRollZ * na;  // no stride roll while engaged
        squatDrop *= a;
      } else if (sit > 0.05) {
        // Seated contextual pose add-ons (Phase 5) — subtle, layered on top of
        // the SIT_* pose and blended by `sit`. No anchor is involved. Cheap:
        // only the elbows / shoulders / head lean move.
        const tableHands = spot && hostTopY != null &&
          (h.activity === 'eat_at_table' || h.activity === 'work_at_desk');
        if (tableHands) {
          // Rest the hands ~40 mm above the tabletop via IK, so forearms lie ON
          // the slab instead of sweeping through it. Blended by `sit`.
          const rest = tableArmIK(hostTopY! + 40);
          if (h.activity === 'work_at_desk') {
            // Both forearms up to the desk surface, slight head-down lean.
            lSh = wLSh * stand + rest.sh * sit; rSh = wRSh * stand + rest.sh * sit;
            lEl = wLEl * stand + rest.el * sit; rEl = wREl * stand + rest.el * sit;
            leanX = wLeanX * stand - 0.06 * sit;
          } else {
            // eat_at_table: right hand rests on the table; the left forearm
            // lifts toward the mouth on a 0.8 Hz cycle — the LIFT now rises from
            // the tabletop pose UP to 120 mm above it (was from the lap), so the
            // forearm never dips through the slab.
            const s = (Math.sin(now * 0.8 * 2 * Math.PI) + 1) / 2;  // 0..1
            const lift = tableArmIK(hostTopY! + 40 + 120 * s);
            rSh = wRSh * stand + rest.sh * sit; rEl = wREl * stand + rest.el * sit;
            lSh = wLSh * stand + lift.sh * sit; lEl = wLEl * stand + lift.el * sit;
          }
        } else switch (h.activity) {
          case 'eat_at_table': {
            // Fallback (no resolved tabletop): left forearm lifts toward the
            // mouth on a slow 0.8 Hz cycle; the right stays at rest.
            const s = (Math.sin(now * 0.8 * 2 * Math.PI) + 1) / 2;  // 0..1
            lEl = wLEl * stand + (SIT_ELBOW + (1.3 - SIT_ELBOW) * s) * sit;
            lSh = wLSh * stand + (SIT_SHOULDER + 0.25 * s) * sit;
            break;
          }
          case 'work_at_desk':
            // Fallback: both forearms up to the desk surface, slight lean.
            lEl = wLEl * stand + 1.15 * sit;
            rEl = wREl * stand + 1.15 * sit;
            leanX = wLeanX * stand - 0.06 * sit;
            break;
          case 'watch_tv':
            // Completely still except breathing — hands rest a touch lower.
            lEl = wLEl * stand + 0.9 * sit;
            rEl = wREl * stand + 0.9 * sit;
            break;
        }
      }

      // Lay-in-bed override: straighten the limbs and pitch the whole body flat
      // (root rotation.x → +π/2 lays body-forward −Z onto world +Y, face up).
      // Suppresses the walk lean/sway/bob (handled below via `lie`).
      if (lie > 0.01) {
        const L = lie, nL = 1 - L;
        const LIE_HIP = 0.1, LIE_KNEE = -0.1, LIE_SH = 0.1, LIE_EL = 0.2;
        lHip = lHip * nL + LIE_HIP * L; rHip = rHip * nL + LIE_HIP * L;
        lKnee = lKnee * nL + LIE_KNEE * L; rKnee = rKnee * nL + LIE_KNEE * L;
        lSh = lSh * nL + LIE_SH * L; rSh = rSh * nL + LIE_SH * L;
        lEl = lEl * nL + LIE_EL * L; rEl = rEl * nL + LIE_EL * L;
        leanX = leanX * nL + (Math.PI / 2) * L;
        rollZ = rollZ * nL;
      }

      // ── Idle fidgets (overlays; compose additively / by blend with the pose
      // above). Gated on a standing-idle condition eased into idleBlend so they
      // fade in/out rather than snap, and never fight walking or the seated /
      // activity / lying blends (which drive the gate to 0). See DESIGN-sims.
      const idleStanding = h.sit < 0.1 && h.act < 0.1 && h.lie < 0.1 &&
        rawSpeedMs < 0.15 && h.dwell > 2;
      h.idleBlend += ((idleStanding ? 1 : 0) - h.idleBlend) * Math.min(1, dt * 3);
      const ib = h.idleBlend;
      let yawFidget = 0;
      if (idleStanding) {
        // Look-around scan sub-behavior: a held ±0.35 rad swing for 0.8 s every
        // 6-10 s, eased in/out. (The ambient 0.4 Hz wobble below is always on.)
        if (h.scanState === 0) {
          h.scanNext -= dt;
          if (h.scanNext <= 0) { h.scanState = 1; h.scanT = 0; h.scanDir = Math.random() < 0.5 ? -1 : 1; }
        } else {
          h.scanT += dt;
          if (h.scanT >= 0.8) { h.scanState = 0; h.scanNext = 6 + Math.random() * 4; }
        }
        // Fidget picker: one-shot idle action every 8-20 s. All compose from the
        // existing hip/knee/shoulder/elbow channels + root pitch/roll (no new
        // joints), blended in/out with a trapezoid envelope like stretch/phone.
        if (h.fidgetKind) {
          h.fidgetT += dt;
          if (h.fidgetT >= h.fidgetDur) { h.fidgetKind = null; h.fidgetNext = 8 + Math.random() * 12; }
        } else {
          h.fidgetNext -= dt;
          if (h.fidgetNext <= 0) {
            const pick = IDLE_FIDGETS[(Math.random() * IDLE_FIDGETS.length) | 0];
            h.fidgetKind = pick; h.fidgetT = 0;
            h.fidgetDur = (IDLE_FIDGET_DUR[pick] ?? 2.2) + Math.random() * 0.5;
            h.fidgetLog.push(pick);
          }
        }
      } else if (h.fidgetKind) {
        h.fidgetKind = null;  // interrupted (started moving / sat down)
      }

      if (ib > 0.001) {
        // Ambient #1 look-around: 0.4 Hz yaw wobble ±0.15 rad + the held scan.
        yawFidget = Math.sin(now * 0.4 * 2 * Math.PI + h.idleOffset) * 0.15;
        if (h.scanState === 1) yawFidget += h.scanDir * 0.35 * Math.sin(Math.PI * h.scanT / 0.8);
        // Ambient #2 weight-shift: 0.15 Hz root roll ±0.04 + antiphase hip/knee.
        const swayPh = now * 0.15 * 2 * Math.PI + h.idleOffset;
        const swayHK = Math.sin(swayPh) * 0.03 * ib;
        lHip += swayHK; rHip += swayHK; lKnee -= swayHK; rKnee -= swayHK;
        rollZ += Math.sin(swayPh) * 0.04 * ib;
        // One-shot fidget pose blends (sit-blend idiom: joint → target by
        // weight). `fenv` is the shared trapezoid (ramp in over `ramp` s, hold,
        // ramp out) times the idle gate; `bl(cur, tgt, w)` = cur·(1−w)+tgt·w.
        if (h.fidgetKind) {
          const t = h.fidgetT, D = h.fidgetDur;
          const fenv = (ramp: number) =>
            (t < ramp ? t / ramp : (t < D - ramp ? 1 : Math.max(0, (D - t) / ramp))) * ib;
          const bl = (cur: number, tgt: number, w: number) => cur * (1 - w) + tgt * w;
          switch (h.fidgetKind) {
            case 'stretch': {
              const w = fenv(0.6);
              lSh = bl(lSh, 2.6, w); rSh = bl(rSh, 2.6, w);   // arms sweep up
              lEl = bl(lEl, 0.05, w); rEl = bl(rEl, 0.05, w);
              leanX = bl(leanX, -0.1, w);
              break;
            }
            case 'phone': {
              const w = fenv(0.4);
              const micro = Math.sin(now * 2 * 2 * Math.PI) * 0.03;   // 2 Hz elbow bob
              rSh = bl(rSh, 0.5, w);
              rEl = bl(rEl, 1.3 + micro, w);
              leanX = bl(leanX, -0.05, w);
              break;
            }
            case 'yawn': {
              // Hand drifts to the mouth, head/torso rocks back then settles.
              const w = fenv(0.4);
              rSh = bl(rSh, 1.7, w);
              rEl = bl(rEl, 2.2, w);
              leanX = bl(leanX, 0.12 * Math.sin(Math.PI * Math.min(1, t / D)), w);
              break;
            }
            case 'scratch_head': {
              // Right hand up behind the head + a small 3 Hz scrub oscillation.
              const w = fenv(0.4);
              const scrub = Math.sin(now * 3 * 2 * Math.PI) * 0.12;
              rSh = bl(rSh, 2.5, w);
              rEl = bl(rEl, 2.5 + scrub, w);
              leanX = bl(leanX, -0.04, w);
              break;
            }
            case 'check_watch': {
              // Left wrist raised in front, slight head-down glance at it.
              const w = fenv(0.35);
              lSh = bl(lSh, 0.75, w);
              lEl = bl(lEl, 1.85, w);
              leanX = bl(leanX, -0.09, w);
              break;
            }
            case 'cross_arms': {
              // Both forearms fold across the chest; held longer.
              const w = fenv(0.5);
              lSh = bl(lSh, 0.42, w); rSh = bl(rSh, 0.42, w);
              lEl = bl(lEl, 1.95, w); rEl = bl(rEl, 1.95, w);
              break;
            }
            case 'foot_tap': {
              // Right foot taps: hip lifts + knee flicks at ~2.2 Hz; arms relaxed.
              const w = fenv(0.4);
              const tap = Math.max(0, Math.sin(now * 2.2 * 2 * Math.PI));
              rHip = bl(rHip, 0.2 * tap, w);
              rKnee = bl(rKnee, -0.5 * tap, w);
              break;
            }
            case 'glance': {
              // Turn to look off to one side (held yaw) with a tiny lean into it.
              const w = fenv(0.35);
              const dir = h.idleOffset < Math.PI ? 1 : -1;
              yawFidget += dir * 0.55 * w;
              rollZ += dir * 0.03 * w;
              break;
            }
          }
        }
      }
      // Greeting wave on acquire: one-shot ~1 s over the rig's spawn window.
      // Fires regardless of idle (a greeting on arrival), not gated on idleBlend.
      if (h.waveT < 1.0) {
        if (h.waveT === 0) h.fidgetLog.push('wave');
        h.waveT += dt;
        const t = h.waveT;
        const env = t < 0.15 ? t / 0.15 : (t > 0.85 ? Math.max(0, (1.0 - t) / 0.15) : 1);
        const osc = 0.6 + 0.3 * Math.sin(t * 3 * 2 * Math.PI);   // 0.3↔0.9 at 3 Hz ×3
        rSh = rSh * (1 - env) + 2.2 * env;
        rEl = rEl * (1 - env) + osc * env;
      }

      h.leftHip.rotation.x = lHip; h.rightHip.rotation.x = rHip;
      h.leftKnee.rotation.x = lKnee; h.rightKnee.rotation.x = rKnee;
      h.leftShoulder.rotation.x = lSh; h.rightShoulder.rotation.x = rSh;
      h.leftElbow.rotation.x = lEl; h.rightElbow.rotation.x = rEl;
      h.group.rotation.x = leanX;
      h.group.rotation.y = h.facing + yawFidget;
      h.group.rotation.z = rollZ;
      }  // end humanoid (non-quad) pose branch

      // Breathing — subtle torso rise/fall, always on.
      h.torso.scale.y = 1 + Math.sin(now * 1.8 + h.idleOffset) * 0.012;

      // Spawn ease-in (rig grows up from the floor; also recovers a rig
      // caught mid-despawn when a flickering target re-acquires). During a stuck
      // respawn, shrink out fast (~0.4 s) instead; once gone, teleport into the
      // goal region and let it grow back in from the new spot.
      if (h.respawnPhase === 1) {
        h.scale -= h.scale * Math.min(1, dt * 12);
        if (h.scale < 0.05) {
          const gi = this._cellIdxOf(t.x, t.y);
          const gr = this._regionOfWorld(t.x, t.y);
          const sc = this._cellToScene(this._nearestFreeCellInRegion(gi, gr));
          h.navX = sc.x; h.navZ = sc.z; h.lastX = sc.x; h.lastZ = sc.z;
          this._pinCarrot(h);
          h.vx = 0; h.vz = 0; h.path = null; h.pathRev = -1; h.goalCell = -1;
          h.stuckT = 0; h.respawnPhase = 0;
        }
      } else {
        h.scale += (1 - h.scale) * Math.min(1, dt * 10);
      }
      h.group.scale.setScalar(h.scale);

      // Terrain: figures on stairs/landings stand at the surface height under
      // the NAV position (they climb along their detour path), eased so
      // climbing reads as a glide up the treads rather than pops.
      const gTarget = this._groundYAt(this._fw / 2 - h.navX, h.navZ + this._fd / 2);
      h.groundY += (gTarget - h.groundY) * Math.min(1, dt * 8);

      // Subtle vertical bob — peaks twice per stride cycle. When seated the
      // root drops so the hip pivot (870 mm in the rig) rests on the seat,
      // and x/z pull onto the seat center. The WALKING term is the nav
      // position (obstacle-avoided), not the raw radar point.
      const bob = Math.abs(sinP) * 40 * ampNorm * h.persBob;
      const HIP_Y = h.hipY;
      let px2: number, pz2: number, py2: number;
      if (anchor) {
        // Standing activity: pull onto the stand point beside the appliance;
        // stay on the walking surface (minus the exercise squat drop).
        const a = act, na = 1 - act;
        px2 = h.navX * na + standX * a;
        pz2 = h.navZ * na + standZ * a;
        py2 = h.groundY + bob - squatDrop;
      } else if (spot) {
        // Seated: drop the root so the hip pivot rests on the seat, pull x/z
        // onto the seat center. `seatYeff` (Part B) equals spot.seatY for normal
        // seats but is raised for tall eat/work hosts so the arms can reach.
        // Root-outside-the-slab clamp: the seated torso extends ~70 mm forward
        // of the root (TORSO_D 140) with the belly toward the table, so when an
        // eat/work host footprint is known, hold the SEAT-blend target ≥190 mm
        // outside its edge — covers seats placed before the placement
        // constraint existed, arrow-key-nudged chairs, and any deep tuck.
        let sx = spot.x, sz = spot.z;
        if (spot.host && hostTopY != null) {
          const host = spot.host;
          const wx = this._fw / 2 - sx, wy = sz + this._fd / 2;   // scene → world mm
          const l = furnitureWorldToLocal(host.rotation, wx - host.x, wy - host.y);
          const ex = host.w / 2 + 190, ey = host.h / 2 + 190;
          if (Math.abs(l.x) < ex && Math.abs(l.y) < ey) {
            const penX = ex - Math.abs(l.x), penY = ey - Math.abs(l.y);
            let nlx = l.x, nly = l.y;
            if (penX <= penY) nlx = (l.x >= 0 ? 1 : -1) * ex;
            else nly = (l.y >= 0 ? 1 : -1) * ey;
            const w = furnitureLocalToWorld(host.rotation, nlx, nly);
            sx = this._fw / 2 - (host.x + w.x);
            sz = (host.y + w.y) - this._fd / 2;
          }
        }
        // Front-approach routing: the seat blend passes THROUGH the approach
        // point (in front of the seat) so the root never cuts across the backrest
        // — nav→approach over the first half of `sit`, approach→seat over the
        // second. Height blends linearly (no pass-through risk on Y).
        const ax = spot.approachX, az = spot.approachZ;
        if (sit < 0.5) {
          const u = sit / 0.5;
          px2 = h.navX * (1 - u) + ax * u;
          pz2 = h.navZ * (1 - u) + az * u;
        } else {
          const u = (sit - 0.5) / 0.5;
          px2 = ax * (1 - u) + sx * u;
          pz2 = az * (1 - u) + sz * u;
        }
        py2 = (h.groundY + bob) * stand + (seatYeff - HIP_Y) * sit;
      } else {
        px2 = h.navX; pz2 = h.navZ; py2 = h.groundY + bob;
      }
      // Lay-in-bed position: blend the root onto the mattress, offset toward the
      // FOOT so the (pitched-back) body reaches the pillows at the headboard end;
      // side-by-side occupants slide ±lieLateral along the bed's local x.
      if (lieBed && lie > 0.01) {
        const L = lie;
        const hdx = Math.sin(bedYaw), hdz = Math.cos(bedYaw);   // headboard dir (scene)
        const ldx = Math.cos(bedYaw), ldz = -Math.sin(bedYaw);  // bed local +x (scene)
        const LIE_HEAD_REACH = h.headTopReach;  // ≈ head-center height above the rig root (per-variant)
        const along = lieBed.h / 2 - 200 - LIE_HEAD_REACH;      // root offset from center toward foot
        const lat = lieLateral[t.key] ?? 0;
        const lieX = lieBed.cx + hdx * along + ldx * lat;
        const lieZ = lieBed.cz + hdz * along + ldz * lat;
        const lieY = lieBed.matressTop + 170;
        // Enter the lane from the FOOT end (never through the headboard): route
        // the X/Z blend through a foot-side approach point in the same lane so the
        // rig slides up its lane rather than dropping in over the pillows. Height
        // blends straight (no pass-through on Y).
        const apX = lieBed.cx - hdx * (lieBed.h / 2 - 150) + ldx * lat;
        const apZ = lieBed.cz - hdz * (lieBed.h / 2 - 150) + ldz * lat;
        let bx: number, bz: number;
        if (L < 0.5) { const u = L / 0.5; bx = px2 * (1 - u) + apX * u; bz = pz2 * (1 - u) + apZ * u; }
        else { const u = (L - 0.5) / 0.5; bx = apX * (1 - u) + lieX * u; bz = apZ * (1 - u) + lieZ * u; }
        px2 = bx; pz2 = bz;
        py2 = py2 * (1 - L) + lieY * L;
      }
      h.group.position.set(px2, py2, pz2);
      // While anchored, ease nav toward the rendered position so there's no
      // jump when the blend releases and nav takes over walking again.
      if (anchored) {
        h.navX += (px2 - h.navX) * Math.min(1, dt * 3);
        h.navZ += (pz2 - h.navZ) * Math.min(1, dt * 3);
        this._pinCarrot(h);   // keep the carrot on nav so walk-resume starts clean
      }

      // Plumbob spin (absolute clock + per-rig offset so rigs desync) and
      // blob-shadow grounding: the root bobs / drops onto seats, but the
      // shadow must stay glued to the walking surface below.
      h.plumbob.rotation.y = (now * 1.6 + h.idleOffset) % (2 * Math.PI);
      h.blob.position.y = h.groundY + 10 - py2;

      // ── Privacy blur: shower / bathe / toilet censor the rig behind a chunky
      // pixel-mosaic silhouette sprite. The plumbob + blob shadow stay (a
      // plumbob floating over a censored blob is peak Sims).
      const sitPose = h.activity === 'toilet' || h.activity === 'bathe';
      const wantPrivacy =
        ((h.activity === 'shower' || h.activity === 'bathe') && act > 0.5) ||
        (h.activity === 'toilet' && (toiletSit || act > 0.5));
      h.privacy += ((wantPrivacy ? 1 : 0) - h.privacy) * Math.min(1, dt * 4);
      if (h.privacy > 0.5) {
        if (!h.blurSprite) {
          const mat = new THREE.SpriteMaterial({
            map: this._blurTexture(sitPose), transparent: true, depthWrite: false,
          });
          h.blurSprite = new THREE.Sprite(mat);
          h.blurSprite.userData.outlineSkip = true;
          h.group.add(h.blurSprite);
        }
        const spr = h.blurSprite;
        const wantTex = this._blurTexture(sitPose);
        const sm = spr.material as THREE.SpriteMaterial;
        if (sm.map !== wantTex) { sm.map = wantTex; sm.needsUpdate = true; }
        const spriteH = sitPose ? 1250 : 1750;
        spr.scale.set(900, spriteH, 1);
        // Ground the sprite bottom on the walking surface (blob height is the
        // ground in group-local space); gentle sway so it isn't a dead billboard.
        spr.position.set(Math.sin(now * 2.2) * 30, h.blob.position.y + spriteH / 2, 0);
        spr.visible = true;
        // Hide the rig body; keep the blob shadow, plumbob, and sprite.
        for (const child of h.group.children) {
          if (child === h.blob || child === h.plumbob || child === spr) continue;
          child.visible = false;
        }
      } else if (h.blurSprite && h.blurSprite.visible) {
        h.blurSprite.visible = false;
        for (const child of h.group.children) child.visible = true;
      }

      // Lying: the plumbob would tilt away with the pitched-back body, so hide
      // it (and the now-vertical blob) above the lie midpoint. The global
      // `_plumbobs` flag hides it everywhere (still kept during privacy blur —
      // the peak-Sims joke — but respecting the global toggle).
      h.plumbob.visible = this._plumbobs && lie <= 0.5;
      if (lie > 0.5) h.blob.visible = false;
      else if (h.privacy <= 0.5) h.blob.visible = true;

      // ── Thought bubbles (Phase 6): a context/time-aware glyph cloud above the
      // head. Per-frame cost is string compares + one pip walk to find the room;
      // the canvas is only (re)painted on a committed kind change (2.5 s
      // hysteresis makes that rare). Runs AFTER the privacy block so it has the
      // final say on the bubble sprite's visibility. Pets (quadrupeds) get no
      // thought bubbles at all.
      if (!h.quad) {
      const tb = ctx?.timeBucket ?? 'day';
      let roomName = '';
      for (const rz of this._roomZones) {
        if (pip(t.x, t.y, rz.loop)) {
          roomName = (ctx?.roomNames?.[rz.roomId] ?? '').toLowerCase();
          break;
        }
      }
      const bedHidden = this._bedState.hiddenKeys.has(t.key);
      const inBedAlone = this._bedState.soloKeys.has(t.key);
      // Personality-chatter timer: fires the per-kind flavor glyph every
      // 25–60 s (idleOffset-seeded) — allowed while WALKING, but paused (and any
      // active chatter cancelled) while an activity / privacy / bed-hide owns
      // the rig. The glyph is held ~7.5 s so the 2.5 s hysteresis below commits
      // it and it stays visible ~5 s before timing back out.
      if (h.activity == null && h.privacy <= 0.3 && !bedHidden) {
        if (h.chatterT > 0) {
          h.chatterT -= dt;
          if (h.chatterT <= 0) h.chatterNext = 25 + Math.random() * 35;
        } else {
          h.chatterNext -= dt;
          if (h.chatterNext <= 0) {
            h.chatterGlyph = this._rollIdleBubble(h, ctx);
            h.chatterT = 7.5;
          }
        }
      } else if (h.chatterT > 0) {
        h.chatterT = 0;
        h.chatterNext = 25 + Math.random() * 35;
      }
      const want = this._resolveBubbleKind(h, tb, roomName, inBedAlone, bedHidden, ctx, t);
      // Hysteresis: accumulate dwell only while the raw resolution holds steady;
      // any change resets the timer. Commit (and rebuild) once it's been stable
      // for 2.5 s.
      if (want === h.bubbleWant) h.bubbleDwell += dt;
      else { h.bubbleWant = want; h.bubbleDwell = 0; }
      if (h.bubbleDwell > 2.5 && h.bubbleKind !== h.bubbleWant) h.bubbleKind = h.bubbleWant;
      this._syncBubble(h, dt);
      // Bubble while lying: the root is pitched flat, so the child bubble's
      // authored local offset would swing sideways. Simpler v1 (chosen over
      // reparenting): repin it in WORLD space just above the pillow via
      // worldToLocal each frame; restore the authored local offset otherwise.
      if (h.bubble) {
        if (lie > 0.5 && lieBed) {
          h.group.updateMatrixWorld(true);
          const world = new THREE.Vector3(
            px2 + Math.sin(bedYaw) * (lieBed.h * 0.18),
            py2 + 950,
            pz2 + Math.cos(bedYaw) * (lieBed.h * 0.18));
          h.bubble.position.copy(h.group.worldToLocal(world));
        } else {
          h.bubble.position.set(BUBBLE_X, h.plumbob.position.y + BUBBLE_ABOVE_PLUMBOB, 0);
        }
      }
      }  // end thought-bubble block (non-quad)

      // Name label (B3): floats above the plumbob for a confident (identified /
      // fused) rig — pets included, so it sits OUTSIDE the non-quad bubble block.
      this._syncNameLabel(h, t);

      // Eligible for mutual separation: walking (not sit/activity/lie anchored),
      // visible, and not hidden under bed covers (previous frame's summary).
      // Lying rigs are excluded — separation overwrites x/z from nav space and
      // would knock the side-by-side occupants off their lie positions.
      if (sit < 0.3 && act < 0.3 && lie < 0.3 && !this._bedState.hiddenKeys.has(t.key)) {
        movers.push({ h, key: t.key });
      }
    }

    // ── Mutual separation: keep crossing pedestrians from overlapping. For each
    // eligible pair closer than 380 mm in nav space, push both apart along the
    // pair axis by half the overlap (capped 60 mm/frame each). Applied to the
    // nav positions (so it persists) and re-committed to the rendered x/z.
    const SEP = 380;
    for (let i = 0; i < movers.length; i++) {
      for (let j = i + 1; j < movers.length; j++) {
        const a = movers[i].h, b = movers[j].h;
        let ddx = a.navX - b.navX, ddz = a.navZ - b.navZ;
        const d = Math.hypot(ddx, ddz);
        if (d >= SEP) continue;
        const push = Math.min(60, (SEP - d) / 2);
        // Unit pair axis. Coincident → arbitrary axis; otherwise normalize.
        // (Normalizing must NOT reuse a clamped d — dividing (1,0) by 1e-3 once
        // flung figures 60 000 mm apart when two targets exactly overlapped.)
        if (d < 1e-3) { ddx = 1; ddz = 0; } else { ddx /= d; ddz /= d; }
        // Push nav (this frame's render) AND the carrot (the pathfinding walker)
        // so the spring holds the gap instead of pulling the figures back
        // together next frame.
        a.navX += ddx * push; a.navZ += ddz * push;
        b.navX -= ddx * push; b.navZ -= ddz * push;
        a.carrotX += ddx * push; a.carrotZ += ddz * push;
        b.carrotX -= ddx * push; b.carrotZ -= ddz * push;
      }
    }
    for (const m of movers) {
      m.h.group.position.x = m.h.navX;
      m.h.group.position.z = m.h.navZ;
    }

    // Despawn: ease out instead of popping. Brief LD2450 dropouts (a target
    // lost and re-acquired a beat later) barely dent the figure instead of
    // destroying and respawning the rig.
    for (const key of Object.keys(this._humanoids)) {
      if (seen.has(key)) continue;
      const h = this._humanoids[key];
      const dt = Math.min(0.1, now - h.lastUpdate);
      h.lastUpdate = now;
      // Decide the despawn style once, from the last seen frame: a target that
      // vanished while moving fast AT the coverage edge walked out of frame →
      // FAST scale-out (a brief blink barely dents the rig). A target that
      // vanished mid-coverage more likely just stopped reflecting (sat still) →
      // a SLOW 10 s opacity fade so it lingers, ghost-like, before clearing.
      if (!h.despawnMode) h.despawnMode = (h.lastEdge && h.lastRawSpeed > 0.3) ? 'fast' : 'slow';
      let dead = false;
      if (h.despawnMode === 'fast') {
        h.scale -= h.scale * Math.min(1, dt * 7);
        h.group.scale.setScalar(h.scale);
        dead = h.scale < 0.03;
      } else {
        // Opacity fade (scale held — a 10 s shrink reads wrong). Fades the whole
        // rig incl. blob / plumbob / bubble via per-rig / per-instance materials.
        h.fadeAlpha = Math.max(0, h.fadeAlpha - dt / 10);
        this._fadeRig(h, h.fadeAlpha);
        dead = h.fadeAlpha <= 0.001;
      }
      if (dead) {
        this._targetGroup.remove(h.group);
        this._disposeHumanoid(h);
        delete this._humanoids[key];
        delete this._aiState[key];   // drop the AI controller with its rig
      }
    }

    // ── Two-in-bed covers: ≥2 settled targets inside a bed footprint hide the
    // rigs and raise a breathing blanket (the joke is the lump). Triggers read
    // the RAW target positions; occupancy is sustained via a per-bed dwell
    // accumulator with hysteresis (engage >2 s, disengage <0.3 s).
    this._updateBedCovers(rawPos, frameDt, now);

    // ── Appliance-door liveliness: ease each registered door pivot toward its
    // open/closed target (bound-fridge door sensor, unbound localState, or an
    // avatar engaged/dwelling next to an UNBOUND appliance). Runs here so it
    // sees this frame's raw target positions + resolved activity anchors.
    this._advanceApplianceDoors(targets, entityOn, ctx, frameDt);
  }

  // Per-frame appliance-door blend. Each registered hinge eases a stored 0→1
  // blend (τ ≈ 0.25 s) toward an open target and applies it as a rotation about
  // the pivot's axis. Open target (first match wins):
  //   a. BOUND appliance with a door sensor (fridge) → its doorEntity is 'on'.
  //   b. UNBOUND appliance → its localState is on/playing (folded into entityOn).
  //   c. UNBOUND appliance → an avatar is engaged: a rig's standing activity
  //      anchor is this piece, OR any RAW target within 1100 mm with dwell
  //      > 1.2 s. All triggers read RAW target positions (anti-feedback rule).
  // A bound non-fridge appliance stays closed (driven purely by its entity —
  // Batch A behavior). Blend state is keyed by fixture id in _applianceDoorBlend
  // so it survives _keyFloor rebuilds.
  private _advanceApplianceDoors(
      targets: TargetWorld[], entityOn: Record<string, boolean>,
      ctx: ActivityContext | undefined, dt: number): void {
    if (!this._applianceDoors.length) return;
    const doorSensorOpen = ctx?.doorSensorOpen;
    // Appliances a rig is actively engaged with (standing activity anchor).
    const anchoredFu = new Set<string>();
    for (const key in this._humanoids) {
      const h = this._humanoids[key];
      if (h.activityAnchor && h.act > 0.1) anchoredFu.add(h.activityAnchor.furnitureId);
    }
    const PROX2 = 1100 * 1100;
    const alpha = 1 - Math.exp(-dt / 0.25);   // eased approach, τ = 0.25 s
    for (const d of this._applianceDoors) {
      let openTarget = false;
      if (d.hasDoorSensor) {
        openTarget = doorSensorOpen?.[d.fuId] === true;             // case a
      } else if (d.unbound) {
        if (entityOn[d.fuId]) openTarget = true;                    // case b
        else if (anchoredFu.has(d.fuId)) openTarget = true;         // case c (anchor)
        else {
          for (const t of targets) {                                // case c (dwell)
            const dx = t.x - d.wx, dy = t.y - d.wy;
            if (dx * dx + dy * dy > PROX2) continue;
            const h = this._humanoids[t.key];
            if (h && !h.quad && h.dwell > 1.2) { openTarget = true; break; }
          }
        }
      }
      const cur = this._applianceDoorBlend[d.fuId] ?? 0;
      const next = cur + ((openTarget ? 1 : 0) - cur) * alpha;
      this._applianceDoorBlend[d.fuId] = next;
      d.pivot.rotation[d.axis] = d.openAngle * next;
    }
  }

  // Resolve the thought-bubble glyph for a humanoid this frame (raw, pre-
  // hysteresis). String compares + a short nearest-trigger scan. Priority
  // (first match wins):
  //   1. engaged activity / privacy → null (the pose already says it all).
  //   2. hidden under bed covers → null.
  //   3. a fixture flipped recently (<45 s) within 3.5 m → trigger POOL.
  //   4. late-night|night, kitchen, standing idle → kitchen-night POOL.
  //   5. morning, kitchen, standing idle → kitchen-morning POOL.
  //   6. evening|night|late-night, seated → seated POOL (activity is null here,
  //      so the room's TV is off — otherwise h.activity would be 'watch_tv').
  //   7. sole occupant idling in a bed → bed POOL.
  // The contextual tiers (3-7) pick from a weighted pool rather than one fixed
  // glyph: `_pickCtxBubble` rolls ONCE per engagement and holds the pick while
  // the tier holds (so hysteresis still commits, and the avatar isn't locked to
  // one thought). A cleared tier falls through to personality chatter.
  private _resolveBubbleKind(h: Humanoid, tb: import('./time-of-day.js').TimeBucket,
                             roomName: string, inBedAlone: boolean,
                             bedHidden: boolean,
                             ctx?: ActivityContext, t?: TargetWorld): string | null {
    if (h.activity != null || h.privacy > 0.3) { h.ctxBubbleTier = null; return null; }
    if (bedHidden) { h.ctxBubbleTier = null; return null; }
    // Recent-trigger tier: nearest fixture toggled in the last 45 s within
    // 3.5 m of the rig's RAW world position (t.x/t.y — anti-feedback: never the
    // eased visual pose). Trigger x/y are world mm, same frame as t.
    const trigs = ctx?.recentTriggers;
    if (trigs && trigs.length && t) {
      const R2 = 3500 * 3500;
      let best: { kind: string; d2: number } | null = null;
      for (const g of trigs) {
        if (g.ageS >= 45) continue;
        const dx = g.x - t.x, dy = g.y - t.y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= R2 && (!best || d2 < best.d2)) best = { kind: g.kind, d2 };
      }
      if (best) {
        const pool = BUBBLE_POOL_TRIGGER[best.kind] ?? BUBBLE_POOL_TRIGGER.light_on;
        return this._pickCtxBubble(h, 'trigger_' + best.kind, pool);
      }
    }
    const inKitchen = roomName.includes('kitchen');
    const standingIdle = h.sit < 0.3 && h.dwell > 1.5;
    if ((tb === 'late_night' || tb === 'night') && inKitchen && standingIdle)
      return this._pickCtxBubble(h, 'kitchen_night', BUBBLE_POOL_KITCHEN_NIGHT);
    if (tb === 'morning' && inKitchen && standingIdle)
      return this._pickCtxBubble(h, 'kitchen_morning', BUBBLE_POOL_KITCHEN_MORNING);
    if ((tb === 'evening' || tb === 'night' || tb === 'late_night') && h.sit > 0.5)
      return this._pickCtxBubble(h, 'seated_eve', BUBBLE_POOL_SEATED_EVE);
    if (inBedAlone && h.dwell > 2)
      return this._pickCtxBubble(h, 'bed', BUBBLE_POOL_BED);
    h.ctxBubbleTier = null;
    // Personality chatter (LOWEST priority): per-kind flavor glyph, fired
    // periodically by the timer in updateTargets. Unlike the context tiers
    // above, this one is allowed while walking around.
    if (h.chatterT > 0 && h.chatterGlyph) return h.chatterGlyph;
    return null;
  }

  // Return the rig's held pool pick for `tier`, rolling a fresh one (uniform
  // over the pool array — repeats bias the odds) the first time this tier
  // engages or when switching from a different tier. Stable while the tier holds
  // so the resolver's `want` stays constant and the 2.5 s commit hysteresis
  // works; a tier change (or clear) re-rolls next engagement.
  private _pickCtxBubble(h: Humanoid, tier: string, pool: readonly string[]): string {
    if (h.ctxBubbleTier !== tier || h.ctxBubbleGlyph == null) {
      h.ctxBubbleTier = tier;
      h.ctxBubbleGlyph = pool[(Math.random() * pool.length) | 0];
    }
    return h.ctxBubbleGlyph;
  }

  // Roll one glyph for the lowest-priority idle-chatter tier (fired by the timer
  // in updateTargets, allowed while walking). Composite pool, built once per
  // roll — this is the ONLY place an O(n²) rig scan is affordable (rigs are few,
  // rolls are ~30 s apart), NOT per frame:
  //   • per-kind personality flavor, listed TWICE so it stays prominent,
  //   • the shared general pool,
  //   • a weather pool (current condition + temp extremes + forecast) when
  //     ctx.weather is set,
  //   • a social pool when another live rig is within 3 m and in this rig's
  //     front hemisphere (±~75° of facing; body-forward is scene −Z).
  private _rollIdleBubble(h: Humanoid, ctx?: ActivityContext): string {
    const personality = AVATAR_BUBBLES[h.avatarKind] ?? AVATAR_BUBBLES.adult!;
    const pool: string[] = [...personality, ...personality, ...BUBBLE_POOL_GENERAL];
    if (ctx?.weather) pool.push(...weatherBubblePool(ctx.weather));
    // Social: scan the other rigs for one this rig is looking at. Front-forward
    // in scene XZ for a Y-rotation of `facing` is (−sin, −cos) (local −Z).
    const fx = -Math.sin(h.facing), fz = -Math.cos(h.facing);
    let noticedQuad = false, noticed = false;
    for (const key in this._humanoids) {
      const hh = this._humanoids[key];
      if (hh === h || !hh.group.visible || hh.scale <= 0.5) continue;
      const dx = hh.navX - h.navX, dz = hh.navZ - h.navZ;
      const d2 = dx * dx + dz * dz;
      if (d2 > 3000 * 3000 || d2 < 1) continue;
      const inv = 1 / Math.sqrt(d2);
      if ((dx * inv) * fx + (dz * inv) * fz < 0.2588) continue;  // cos 75°
      noticed = true;
      if (hh.quad) noticedQuad = true;
    }
    if (noticed) pool.push(...(noticedQuad ? BUBBLE_POOL_SOCIAL_PET : BUBBLE_POOL_SOCIAL));
    return pool[(Math.random() * pool.length) | 0];
  }

  // Reconcile a humanoid's committed bubble kind with its live sprite: build /
  // pop-in / shrink-out + dispose. Pop-in eases scale 0→1 over ~0.25 s; a
  // commit to null (or a privacy blur / hidden rig) shrinks it back out and
  // frees the per-rig canvas texture. Called every frame; canvas work happens
  // only when the committed glyph actually changes.
  private _syncBubble(h: Humanoid, dt: number): void {
    const forceHide = h.privacy > 0.3 || !h.group.visible;
    const wantVisible = h.bubbleKind != null && !forceHide;
    if (wantVisible && (!h.bubble || h.bubble.userData.glyph !== h.bubbleKind)) {
      if (h.bubble) this._disposeBubble(h);
      const spr = this._makeBubbleSprite(h.bubbleKind!);
      spr.userData.glyph = h.bubbleKind;
      spr.userData.outlineSkip = true;
      spr.userData.s = 0;  // eased 0..1 pop-in
      spr.position.set(BUBBLE_X, h.plumbob.position.y + BUBBLE_ABOVE_PLUMBOB, 0);
      h.group.add(spr);
      h.bubble = spr;
    }
    if (!h.bubble) return;
    const spr = h.bubble;
    const target = wantVisible ? 1 : 0;
    let s = (spr.userData.s as number) ?? 0;
    s += (target - s) * Math.min(1, dt * 8);  // ~0.25 s ease
    spr.userData.s = s;
    spr.scale.set(BUBBLE_W * s, BUBBLE_H * s, 1);
    spr.visible = wantVisible && s > 0.01;
    if (!wantVisible && s < 0.02) this._disposeBubble(h);
  }

  // ── Name label (phase B3) ───────────────────────────────────────────────
  // Camera-facing sprite above the plumbob for a confident rig (a fused radar
  // target or an identified BLE person's own rig). The canvas is (re)painted
  // only when the name/color changes — cached in h.nameText/h.nameColor — so
  // this is per-frame cheap (just a visibility flip otherwise). The sprite is a
  // child of h.group, so it fades with the rig via _fadeRig and its CanvasTexture
  // is freed by _disposeHumanoid's sprite traverse (per-rig map, not shared).
  private _syncNameLabel(h: Humanoid, t: TargetWorld): void {
    const person = t.person;
    if (!person || !person.identified) {
      if (h.nameSprite) this._disposeNameLabel(h);
      return;
    }
    if (!h.nameSprite || h.nameText !== person.name || h.nameColor !== person.color) {
      if (h.nameSprite) this._disposeNameLabel(h);
      const spr = this._makeNameSprite(person.name, person.color);
      spr.userData.outlineSkip = true;
      spr.position.set(0, h.plumbob.position.y + NAME_ABOVE_PLUMBOB, 0);
      h.group.add(spr);
      h.nameSprite = spr;
      h.nameText = person.name;
      h.nameColor = person.color;
    }
    // Layer gate + suppress while the rig lies flat (root pitched → the label
    // would swing sideways); reappears when it stands.
    h.nameSprite.visible = this._showNameLabels && h.group.visible && h.lie < 0.5;
  }

  private _disposeNameLabel(h: Humanoid): void {
    if (!h.nameSprite) return;
    h.group.remove(h.nameSprite);
    const m = h.nameSprite.material as THREE.SpriteMaterial;
    m.map?.dispose();
    m.dispose();
    h.nameSprite = null; h.nameText = null; h.nameColor = null;
  }

  // Name plate: white name text on a dark rounded chip with a person-colored
  // underline bar. Mirrors _makeTextSprite's canvas idiom (SRGB CanvasTexture,
  // world-mm sprite scale from the canvas aspect).
  private _makeNameSprite(name: string, colorHex: string): THREE.Sprite {
    const font = '600 46px system-ui, sans-serif';
    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d')!;
    ctx.font = font;
    const text = (name || '?').slice(0, 24);
    const tw = ctx.measureText(text).width;
    const padX = 30, h = 96, bar = 10;
    cv.width = Math.ceil(tw + padX * 2);
    cv.height = h;
    ctx.font = font;  // canvas resize resets ctx state
    ctx.beginPath();
    ctx.roundRect(2, 2, cv.width - 4, h - bar - 4, 20);
    ctx.fillStyle = 'rgba(8,10,16,0.86)';
    ctx.fill();
    ctx.fillStyle = '#f5f7fa';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, cv.width / 2, (h - bar) / 2 + 2);
    // Person-colored underline bar.
    ctx.fillStyle = colorHex;
    ctx.beginPath();
    ctx.roundRect(cv.width * 0.5 - tw / 2 - 6, h - bar - 1, tw + 12, bar, bar / 2);
    ctx.fill();
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false, depthTest: false,
    }));
    const H = 300;
    sprite.scale.set(H * (cv.width / cv.height), H, 1);
    return sprite;
  }

  private _disposeBubble(h: Humanoid): void {
    if (!h.bubble) return;
    h.group.remove(h.bubble);
    const m = h.bubble.material as THREE.SpriteMaterial;
    m.map?.dispose();
    m.dispose();
    h.bubble = null;
  }

  // Classic comic thought cloud on a small canvas: a cluster of white puffs with
  // a uniform dark rim (drawn as slightly-larger dark discs UNDER white discs so
  // interior seams vanish and only the union boundary shows), the glyph centered,
  // plus two trailing tail circles bottom-left. Transparent background.
  private _makeBubbleSprite(glyph: string): THREE.Sprite {
    const cv = document.createElement('canvas');
    cv.width = 160; cv.height = 150;
    const ctx = cv.getContext('2d')!;
    // [x, y, r] — main cloud puffs then the two trailing tail circles.
    const parts: [number, number, number][] = [
      [78, 60, 44], [44, 66, 28], [112, 64, 30], [60, 40, 26], [98, 38, 26], [80, 82, 26],
      [34, 108, 12], [20, 128, 7],
    ];
    const OUT = 3;  // rim thickness (px)
    ctx.fillStyle = '#242424';
    for (const [x, y, r] of parts) { ctx.beginPath(); ctx.arc(x, y, r + OUT, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#fdfdfd';
    for (const [x, y, r] of parts) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = '64px system-ui, "Apple Color Emoji", "Noto Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#242424';
    ctx.fillText(glyph, 78, 62);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false,
    }));
    spr.scale.set(BUBBLE_W, BUBBLE_H, 1);
    return spr;
  }

  private _updateBedCovers(rawPos: Record<string, { x: number; y: number }>,
                           frameDt: number, now: number): void {
    // Occupancy summary for NEXT frame's thought-bubble resolution.
    const hiddenKeys = new Set<string>();
    const soloKeys = new Set<string>();
    for (const bed of this._beds) {
      // Two-person covers disabled for this bed → no blanket lump; the occupants
      // lie side by side instead (handled in the per-target lay-in-bed pass).
      if (!bed.sharedCovers) continue;
      // Targets inside this bed's footprint (raw world coords) and how many are
      // settled (smoothed speed < 0.15 m/s).
      const inside: string[] = [];
      let settled = 0;
      for (const key in rawPos) {
        const rp = rawPos[key];
        const l = furnitureWorldToLocal(bed.rotation, rp.x - bed.x, rp.y - bed.y);
        if (Math.abs(l.x) > bed.w / 2 || Math.abs(l.y) > bed.h / 2) continue;
        inside.push(key);
        const hh = this._humanoids[key];
        if (hh && Math.hypot(hh.vx, hh.vz) / 1000 < 0.15) settled++;
      }
      // Sole occupant → "in bed alone" candidate (idle gating happens in the
      // bubble resolver via h.dwell).
      if (inside.length === 1) soloKeys.add(inside[0]);
      const prev = this._bedDwell[bed.id] ?? 0;
      const dwell = settled >= 2 ? prev + frameDt : Math.max(0, prev - frameDt * 3);
      this._bedDwell[bed.id] = dwell;

      let cover = this._bedCovers[bed.id];
      // Engage at >2 s of sustained occupancy; the cover's presence carries the
      // engaged state until the dwell decays under 0.3 s (hysteresis).
      if (!cover && dwell > 2) {
        cover = this._buildBedCover(bed);
        this._bedCovers[bed.id] = cover;
      }
      if (!cover) continue;
      const stayEngaged = dwell > 0.3;
      cover.t += ((stayEngaged ? 1 : 0) - cover.t) * Math.min(1, frameDt * 3);
      if (cover.t > 0.02) {
        // Hide every rig inside the footprint (and its plumbob — the whole
        // group goes) while the lump is showing.
        for (const key of inside) {
          const hh = this._humanoids[key];
          if (hh) hh.group.visible = false;
          hiddenKeys.add(key);
        }
        cover.grp.visible = true;
        this._animateBedCover(cover, bed, now);
      } else if (!stayEngaged) {
        // Fully faded out → remove + dispose; rig visibility is restored by the
        // per-target loop next frame.
        this._targetGroup.remove(cover.grp);
        cover.mesh.geometry.dispose();
        (cover.mesh.material as THREE.Material).dispose();
        delete this._bedCovers[bed.id];
      }
    }
    this._bedState = { hiddenKeys, soloKeys };
  }

  // Lazy-build a blanket plane for a bed, parented under _targetGroup (transient
  // — cleared without a floor rebuild). Flat grid; the height is displaced per
  // frame in _animateBedCover.
  private _buildBedCover(bed: { x: number; y: number; w: number; h: number;
                                rotation?: number; color: number; matressTop: number }):
      { mesh: THREE.Mesh; grp: THREE.Group; t: number } {
    const grp = new THREE.Group();
    const p = this._w(bed.x, bed.y, 0);
    grp.position.set(p.x, 0, p.z);
    grp.rotation.y = -((bed.rotation || 0) * Math.PI / 180);
    const geo = new THREE.PlaneGeometry(bed.w * 0.96, bed.h * 0.9, 10, 14);
    geo.rotateX(-Math.PI / 2);  // lie flat; height becomes the local +Y axis
    const mesh = new THREE.Mesh(geo, this._mat({
      color: bed.color, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide,
    }));
    mesh.position.y = bed.matressTop + 60;
    mesh.userData.outlineSkip = true;
    grp.add(mesh);
    grp.visible = false;
    this._targetGroup.add(grp);
    return { mesh, grp, t: 0 };
  }

  // CPU vertex displacement: two fixed gaussian lumps (occupants are hidden, so
  // artistic license) plus a slow breathing ripple, all scaled by the eased
  // engage blend so the blanket grows in / out smoothly. Writes in place.
  private _animateBedCover(cover: { mesh: THREE.Mesh; t: number },
                           bed: { w: number }, now: number): void {
    const geo = cover.mesh.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const blend = cover.t;
    const cx = bed.w * 0.22, sig = bed.w * 0.15, twoSig2 = 2 * sig * sig;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getZ(i);  // local plan coords after rotateX
      const dy = y * 0.6;  // stretch the lumps along the bed length
      const l1 = 170 * Math.exp(-(((x - cx) * (x - cx)) + dy * dy) / twoSig2);
      const l2 = 170 * Math.exp(-(((x + cx) * (x + cx)) + dy * dy) / twoSig2);
      const ripple = 18 * Math.sin(now * 1.7 + x * 0.004) + 12 * Math.sin(now * 1.1 + y * 0.005);
      pos.setY(i, (l1 + l2 + ripple) * blend);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  // ── Humanoid construction ──────────────────────────────────────────────
  // Stick-figure proportions (mm). Body forward is +Z (default) and is
  // rotated via group.rotation.y to match velocity direction. Each limb is
  // a 2-segment chain so knees / elbows can flex during the walk cycle.
  // Per-variant accessory meshes bolted onto a freshly-built rig, keyed by kind.
  // Runs BEFORE the outline pass so accessories get cartoon shells; small parts
  // are auto-skipped by the outline minDim, emissive parts opt out explicitly.
  // Everything is a child of `root` (the rig group) so the privacy-blur / fade
  // systems hide/fade them along with the body automatically.
  private _addAvatarAccessories(
    kind: AvatarKind,
    _spec: { skin: number; body: number },
    root: THREE.Group,
    c: {
      color: number; accent: THREE.Material; dark: THREE.Material;
      shoeMat: THREE.Material; skin: THREE.Material; bodyMat: THREE.Material;
      HEAD_R: number; headY: number; torsoY: number; hipY: number;
      TORSO_W: number; TORSO_H: number; TORSO_D: number; sk: number;
    },
  ): void {
    const { HEAD_R, headY, torsoY, hipY, TORSO_W, TORSO_H, TORSO_D, sk } = c;
    const frontZ = -TORSO_D / 2;   // torso front face (body-forward = -Z)
    const backZ = TORSO_D / 2;
    // Small helpers to keep the variant blocks tidy.
    const box = (w: number, h: number, d: number, mat: THREE.Material) =>
      new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    const sphere = (r: number, mat: THREE.Material) =>
      new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
    const cyl = (r: number, h: number, mat: THREE.Material) =>
      new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), mat);

    if (kind === 'robot') {
      // Antenna: thin stalk up from the crown + a tiny tint ball.
      const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(9 * sk, 9 * sk, 130 * sk, 8),
        c.dark,
      );
      stalk.position.set(0, headY + HEAD_R + 65 * sk, 0);
      root.add(stalk);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(26 * sk, 10, 8), c.accent);
      tip.position.set(0, headY + HEAD_R + 135 * sk, 0);
      root.add(tip);
      // Tint accent stripe across the chest (restores sensor colour coding).
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(TORSO_W * 0.9, TORSO_H * 0.18, 24 * sk),
        c.accent,
      );
      stripe.position.set(0, torsoY + TORSO_H * 0.12, frontZ - 6 * sk);
      root.add(stripe);
    } else if (kind === 'professional') {
      // White shirt triangle down the chest + a thin tie stripe in the tint.
      const shirt = new THREE.Mesh(
        new THREE.ConeGeometry(TORSO_W * 0.34, TORSO_H * 0.6, 3),
        this._mat({ color: 0xf2f2f0, roughness: 0.6, metalness: 0.0 }),
      );
      shirt.rotation.x = Math.PI;          // apex down
      shirt.rotation.y = Math.PI / 4;      // flat face toward the viewer
      shirt.position.set(0, torsoY + TORSO_H * 0.02, frontZ - 8 * sk);
      root.add(shirt);
      const tie = new THREE.Mesh(
        new THREE.BoxGeometry(TORSO_W * 0.1, TORSO_H * 0.44, 14 * sk),
        c.accent,
      );
      tie.position.set(0, torsoY - TORSO_H * 0.02, frontZ - 16 * sk);
      root.add(tie);
    } else if (kind === 'hacker') {
      // Hoodie cowl: a dark shell capping the back/top of the head. Tilted back
      // (rotation.x) and pushed rearward so the front rim rides ABOVE the brow —
      // a symmetric downward bowl otherwise drapes its front rim to eye level and
      // hides the face (the "hood covering the eyes" bug).
      const hood = new THREE.Mesh(
        new THREE.SphereGeometry(HEAD_R * 1.22, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6),
        this._mat({ color: 0x18181c, roughness: 0.85, metalness: 0.0 }),
      );
      hood.rotation.x = 0.5;
      hood.position.set(0, headY + HEAD_R * 0.08, HEAD_R * 0.34);
      root.add(hood);
    } else if (kind === 'movie_star') {
      // Golden accent stripe down the chest (shades handled in the face pass).
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(TORSO_W * 0.16, TORSO_H * 0.78, 20 * sk),
        this._mat({ color: 0xffdd66, emissive: 0xcaa53a, emissiveIntensity: 0.4, metalness: 0.5, roughness: 0.3 }),
      );
      stripe.position.set(0, torsoY, frontZ - 6 * sk);
      root.add(stripe);
    } else if (kind === 'ninja_cyborg' || kind === 'ninja') {
      // Katana slung diagonally across the back (+Z side) — shared by both
      // ninja flavors.
      const katana = new THREE.Group();
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(26 * sk, TORSO_H * 1.35, 26 * sk),
        this._mat({ color: 0x2a2a30, emissive: 0x11121a, emissiveIntensity: 0.1, metalness: 0.6, roughness: 0.35 }),
      );
      katana.add(blade);
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(30 * sk, TORSO_H * 0.34, 30 * sk),
        c.accent,   // tint the grip so the sensor colour survives the all-black body
      );
      handle.position.set(0, TORSO_H * 0.7, 0);
      katana.add(handle);
      katana.position.set(-TORSO_W * 0.1, torsoY, backZ + 30 * sk);
      katana.rotation.z = 0.55;
      root.add(katana);
      if (kind === 'ninja') {
        // Full hood wrap: a near-complete dark shell around the head — the
        // skin-tone eye-slit band (face pass) pokes proud of it at the front.
        // NO metal, NO emissive: this is the classic-shinobi look, distinct
        // from ninja_cyborg's red visor + steel arm.
        const hood = new THREE.Mesh(
          new THREE.SphereGeometry(HEAD_R * 1.14, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.85),
          this._mat({ color: 0x131317, roughness: 0.9, metalness: 0.0 }),
        );
        hood.position.set(0, headY, 0);
        root.add(hood);
        // Waist sash: thin tint band around the lower torso (slightly proud —
        // coincident-face gotcha).
        const sash = new THREE.Mesh(
          new THREE.BoxGeometry(TORSO_W * 1.06, TORSO_H * 0.12, TORSO_D * 1.06),
          c.accent,
        );
        sash.position.set(0, torsoY - TORSO_H * 0.28, 0);
        root.add(sash);
      }
    } else if (kind === 'cyborg') {
      // Head half-plate: a steel shell over the +x side of the head (the same
      // side as the red implant eye, steel arm, and steel leg).
      const steel = this._mat({ color: 0x8a9099, emissive: 0x8a9099, emissiveIntensity: 0.1, metalness: 0.8, roughness: 0.3 });
      // Half-sphere shell (phi 0..π), rotated so the open seam runs down the
      // head's centerline and the shell covers the +x half.
      const plate = new THREE.Mesh(
        new THREE.SphereGeometry(HEAD_R * 1.06, 16, 12, 0, Math.PI),
        steel,
      );
      plate.rotation.y = Math.PI / 2;
      plate.position.set(0, headY, 0);
      root.add(plate);
      // Small tint chest panel (slightly proud of the torso front face).
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(TORSO_W * 0.34, TORSO_H * 0.22, 22 * sk),
        c.accent,
      );
      panel.position.set(TORSO_W * 0.18, torsoY + TORSO_H * 0.16, frontZ - 6 * sk);
      root.add(panel);
    } else if (kind === 'athlete') {
      // White headband around the forehead. Sits high (0.45·HEAD_R above the
      // head center) so it rides above the brow instead of reading as a monk's
      // tonsure; the major radius hugs the sphere's smaller circle at that
      // height (≈0.89·HEAD_R → 0.93·HEAD_R with the tube).
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(HEAD_R * 0.93, HEAD_R * 0.13, 8, 20),
        this._mat({ color: 0xf2f2f2, roughness: 0.65, metalness: 0.0 }),
      );
      band.rotation.x = Math.PI / 2;
      band.position.set(0, headY + HEAD_R * 0.45, 0);
      root.add(band);
      // Shorts: a darker lower-torso overlay (slightly proud so it never lands
      // coplanar with the torso faces — see the coincident-face gotcha).
      const shorts = new THREE.Mesh(
        new THREE.BoxGeometry(TORSO_W * 1.04, TORSO_H * 0.34, TORSO_D * 1.04),
        this._mat({ color: 0x243043, emissive: 0x243043, emissiveIntensity: 0.15, roughness: 0.6, metalness: 0.05 }),
      );
      shorts.position.set(0, torsoY - TORSO_H * 0.32, 0);
      root.add(shorts);
    } else if (kind === 'teddy_bear') {
      // Round ears on top, lighter muzzle + belly patch, stubby round tail.
      const lite = this._mat({ color: 0xc9a87c, emissive: 0xc9a87c, emissiveIntensity: 0.15, roughness: 0.7, metalness: 0.0 });
      for (const sx of [-1, 1]) {
        const ear = sphere(HEAD_R * 0.42, c.skin);
        ear.position.set(sx * HEAD_R * 0.62, headY + HEAD_R * 0.78, 0);
        root.add(ear);
      }
      const muzzle = sphere(HEAD_R * 0.42, lite);
      muzzle.scale.set(1, 0.72, 0.7);
      muzzle.position.set(0, headY - HEAD_R * 0.28, -HEAD_R * 0.8);
      root.add(muzzle);
      const belly = sphere(TORSO_W * 0.42, lite);
      belly.scale.set(1, 1.25, 0.35);
      belly.position.set(0, torsoY - TORSO_H * 0.08, frontZ - 8 * sk);
      root.add(belly);
      const tail = sphere(66 * sk, lite);
      tail.position.set(0, torsoY - TORSO_H * 0.34, backZ + 30 * sk);
      root.add(tail);
    } else if (kind === 'cartoon_mouse') {
      // BIG round ear discs with pink inner discs + a thin two-segment tail.
      const pink = this._mat({ color: 0xf2a0b5, emissive: 0xf2a0b5, emissiveIntensity: 0.2, roughness: 0.65, metalness: 0.0 });
      for (const sx of [-1, 1]) {
        const ear = cyl(HEAD_R * 0.56, 26 * sk, c.skin);
        ear.rotation.x = Math.PI / 2;   // disc plane faces the body-forward -Z
        ear.position.set(sx * HEAD_R * 0.74, headY + HEAD_R * 0.86, 0);
        root.add(ear);
        const inner = cyl(HEAD_R * 0.36, 10 * sk, pink);
        inner.rotation.x = Math.PI / 2;
        inner.position.set(sx * HEAD_R * 0.74, headY + HEAD_R * 0.86, -12 * sk);
        root.add(inner);
      }
      const tail1 = cyl(15 * sk, 300 * sk, c.skin);
      tail1.rotation.x = -1.15;   // sweeps down-back from the lower spine
      tail1.position.set(0, hipY * 0.9, backZ + 90 * sk);
      root.add(tail1);
      const tail2 = cyl(11 * sk, 240 * sk, c.skin);
      tail2.rotation.x = -0.35;   // tip curls back up
      tail2.position.set(0, hipY * 0.72, backZ + 300 * sk);
      root.add(tail2);
    } else if (kind === 'cartoon_dog') {
      // Floppy ear slabs, lighter muzzle box + dark nose sphere, tail.
      const earMat = this._mat({ color: 0x6b4226, emissive: 0x6b4226, emissiveIntensity: 0.15, roughness: 0.75, metalness: 0.0 });
      const muzzleMat = this._mat({ color: 0xc99e6a, emissive: 0xc99e6a, emissiveIntensity: 0.15, roughness: 0.7, metalness: 0.0 });
      for (const sx of [-1, 1]) {
        const ear = box(44 * sk, HEAD_R * 1.1, HEAD_R * 0.6, earMat);
        ear.rotation.z = -sx * 0.18;   // outward flop
        ear.position.set(sx * HEAD_R * 1.05, headY + HEAD_R * 0.05, 0);
        root.add(ear);
      }
      const snout = box(HEAD_R * 0.64, HEAD_R * 0.46, HEAD_R * 0.6, muzzleMat);
      snout.position.set(0, headY - HEAD_R * 0.28, -HEAD_R * 1.0);
      root.add(snout);
      const nose = sphere(HEAD_R * 0.18, c.dark);
      nose.position.set(0, headY - HEAD_R * 0.18, -HEAD_R * 1.32);
      root.add(nose);
      const tail = cyl(18 * sk, 250 * sk, earMat);
      tail.rotation.x = -0.9;   // wags up-back
      tail.position.set(0, hipY * 0.95, backZ + 90 * sk);
      root.add(tail);
    } else if (kind === 'cartoon_duck') {
      // Wide flat yellow-orange bill (legs/feet handled by spec legColor/footMul).
      const billMat = this._mat({ color: 0xe8931d, emissive: 0xe8931d, emissiveIntensity: 0.25, roughness: 0.55, metalness: 0.0 });
      const bill = box(HEAD_R * 1.05, HEAD_R * 0.17, HEAD_R * 0.6, billMat);
      bill.position.set(0, headY - HEAD_R * 0.14, -HEAD_R * 1.08);
      root.add(bill);
    } else if (kind === 'cowboy') {
      // Wide-brim hat + tint bandana + brown vest front panels.
      const hatMat = this._mat({ color: 0x7a5230, emissive: 0x7a5230, emissiveIntensity: 0.12, roughness: 0.75, metalness: 0.0 });
      const brim = cyl(HEAD_R * 1.42, 24 * sk, hatMat);
      brim.position.set(0, headY + HEAD_R * 0.55, 0);
      root.add(brim);
      const crown = cyl(HEAD_R * 0.72, HEAD_R * 0.72, hatMat);
      crown.position.set(0, headY + HEAD_R * 0.55 + HEAD_R * 0.36, 0);
      root.add(crown);
      const bandana = box(TORSO_W * 0.78, 55 * sk, TORSO_D * 0.9, c.accent);
      bandana.position.set(0, torsoY + TORSO_H * 0.5 + 20 * sk, 0);
      root.add(bandana);
      const vestMat = this._mat({ color: 0x6b4226, emissive: 0x6b4226, emissiveIntensity: 0.12, roughness: 0.75, metalness: 0.0 });
      for (const sx of [-1, 1]) {
        const panel = box(TORSO_W * 0.32, TORSO_H * 0.72, 18 * sk, vestMat);
        panel.position.set(sx * TORSO_W * 0.33, torsoY + TORSO_H * 0.05, frontZ - 8 * sk);
        root.add(panel);
      }
    } else if (kind === 'magician') {
      // Black top hat + white shirt V (professional's cone) + tint bowtie.
      const hatMat = this._mat({ color: 0x111114, roughness: 0.6, metalness: 0.1 });
      const brim = cyl(HEAD_R * 1.12, 18 * sk, hatMat);
      brim.position.set(0, headY + HEAD_R * 0.6, 0);
      root.add(brim);
      const crown = cyl(HEAD_R * 0.7, HEAD_R * 1.25, hatMat);
      crown.position.set(0, headY + HEAD_R * 0.6 + HEAD_R * 0.63, 0);
      root.add(crown);
      const shirt = new THREE.Mesh(
        new THREE.ConeGeometry(TORSO_W * 0.34, TORSO_H * 0.6, 3),
        this._mat({ color: 0xf2f2f0, roughness: 0.6, metalness: 0.0 }),
      );
      shirt.rotation.x = Math.PI;
      shirt.rotation.y = Math.PI / 4;
      shirt.position.set(0, torsoY + TORSO_H * 0.02, frontZ - 8 * sk);
      root.add(shirt);
      const bowtie = box(TORSO_W * 0.3, 45 * sk, 22 * sk, c.accent);
      bowtie.position.set(0, torsoY + TORSO_H * 0.44, frontZ - 12 * sk);
      root.add(bowtie);
    } else if (kind === 'farmer') {
      // Straw hat (lighter tan) + denim overall bib with shoulder straps.
      const straw = this._mat({ color: 0xd9b36a, emissive: 0xd9b36a, emissiveIntensity: 0.15, roughness: 0.8, metalness: 0.0 });
      const brim = cyl(HEAD_R * 1.3, 20 * sk, straw);
      brim.position.set(0, headY + HEAD_R * 0.55, 0);
      root.add(brim);
      const crown = cyl(HEAD_R * 0.7, HEAD_R * 0.55, straw);
      crown.position.set(0, headY + HEAD_R * 0.55 + HEAD_R * 0.28, 0);
      root.add(crown);
      const denim = this._mat({ color: 0x3f5f8a, emissive: 0x3f5f8a, emissiveIntensity: 0.15, roughness: 0.7, metalness: 0.0 });
      const bib = box(TORSO_W * 0.56, TORSO_H * 0.5, 20 * sk, denim);
      bib.position.set(0, torsoY - TORSO_H * 0.05, frontZ - 10 * sk);
      root.add(bib);
      for (const sx of [-1, 1]) {
        const strap = box(48 * sk, TORSO_H * 0.5, 16 * sk, denim);
        strap.position.set(sx * TORSO_W * 0.26, torsoY + TORSO_H * 0.28, frontZ - 8 * sk);
        root.add(strap);
      }
    } else if (kind === 'tech_expert') {
      // Rectangular glasses + headset band with mic stub + tint utility belt.
      const frame = this._mat({ color: 0x17181c, roughness: 0.5, metalness: 0.2 });
      for (const sx of [-1, 1]) {
        const lens = box(HEAD_R * 0.4, HEAD_R * 0.3, 20 * sk, frame);
        lens.position.set(sx * HEAD_R * 0.38, headY + HEAD_R * 0.12, -HEAD_R * 0.92);
        root.add(lens);
      }
      const bridge = box(HEAD_R * 0.2, 16 * sk, 16 * sk, frame);
      bridge.position.set(0, headY + HEAD_R * 0.12, -HEAD_R * 0.94);
      root.add(bridge);
      const bandMat = this._mat({ color: 0x2c2e34, roughness: 0.6, metalness: 0.2 });
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(HEAD_R * 1.02, 16 * sk, 8, 18, Math.PI),
        bandMat,
      );
      band.position.set(0, headY, 0);   // arcs ear-to-ear over the crown
      root.add(band);
      const mic = cyl(10 * sk, HEAD_R * 0.7, bandMat);
      mic.rotation.z = 1.15;
      mic.position.set(HEAD_R * 0.62, headY - HEAD_R * 0.35, -HEAD_R * 0.5);
      root.add(mic);
      const micTip = sphere(22 * sk, c.accent);
      micTip.position.set(HEAD_R * 0.32, headY - HEAD_R * 0.5, -HEAD_R * 0.5);
      root.add(micTip);
      const belt = box(TORSO_W * 1.05, TORSO_H * 0.1, TORSO_D * 1.05, c.accent);
      belt.position.set(0, torsoY - TORSO_H * 0.42, 0);
      root.add(belt);
    } else if (kind === 'supermodel') {
      // Long dark hair shell + sunglasses pushed up + tint dress below the hips.
      const hairMat = this._mat({ color: 0x2a2026, roughness: 0.75, metalness: 0.05 });
      // Crown cap: phiLength trimmed so the front hairline lands at the brow
      // rather than raking down over the eyes; tilted back a touch so the bangs
      // clear the face. The long fall behind (+Z) covers the back and sides.
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(HEAD_R * 1.13, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.44),
        hairMat,
      );
      cap.rotation.x = 0.28;
      cap.position.set(0, headY + HEAD_R * 0.04, HEAD_R * 0.04);
      root.add(cap);
      const fall = box(HEAD_R * 1.6, HEAD_R * 1.9, HEAD_R * 0.5, hairMat);
      fall.position.set(0, headY - HEAD_R * 0.4, HEAD_R * 0.72);
      root.add(fall);
      const glasses = box(HEAD_R * 1.1, HEAD_R * 0.22, HEAD_R * 0.16,
        this._mat({ color: 0x0a0a0c, metalness: 0.5, roughness: 0.2 }));
      glasses.position.set(0, headY + HEAD_R * 0.62, -HEAD_R * 0.72);
      root.add(glasses);
      const dress = box(TORSO_W * 1.06, TORSO_H * 0.46, TORSO_D * 1.06, c.accent);
      dress.position.set(0, torsoY - TORSO_H * 0.5, 0);   // hem lands below the hips
      root.add(dress);
    } else if (kind === 'wise_oracle') {
      // Ankle-length robe skirt (shares the torso material — a static shell
      // around the still-working leg joints; Sims-style it may intersect
      // seats while sitting), white beard block, tint amulet at the chest.
      const skirtH = hipY - 20 * sk;
      const skirt = box(TORSO_W * 1.18, skirtH, TORSO_D * 1.35, c.bodyMat);
      skirt.position.set(0, hipY + 40 * sk - skirtH / 2, 0);
      root.add(skirt);
      const beard = box(HEAD_R * 0.62, HEAD_R * 0.85, HEAD_R * 0.28,
        this._mat({ color: 0xe8e8e4, emissive: 0xe8e8e4, emissiveIntensity: 0.1, roughness: 0.85, metalness: 0.0 }));
      beard.position.set(0, headY - HEAD_R * 0.78, -HEAD_R * 0.72);
      root.add(beard);
      const amulet = sphere(50 * sk, c.accent);
      amulet.position.set(0, torsoY + TORSO_H * 0.22, frontZ - 24 * sk);
      root.add(amulet);
    } else if (kind === 'astronaut') {
      // Translucent helmet bubble + grey chest control panel + backpack.
      const helmet = sphere(HEAD_R * 1.26, this._mat({
        color: 0xbfd8e8, roughness: 0.15, metalness: 0.1,
        transparent: true, opacity: 0.22,
      }));
      helmet.userData.outlineSkip = true;   // transparent anyway, but explicit
      helmet.position.set(0, headY, 0);
      root.add(helmet);
      const panelMat = this._mat({ color: 0x8a9099, roughness: 0.5, metalness: 0.3 });
      const panel = box(TORSO_W * 0.5, TORSO_H * 0.28, 26 * sk, panelMat);
      panel.position.set(0, torsoY + TORSO_H * 0.1, frontZ - 10 * sk);
      root.add(panel);
      // Tiny tint status light on the panel keeps sensor colour coding.
      const lamp = sphere(20 * sk, c.accent);
      lamp.position.set(TORSO_W * 0.14, torsoY + TORSO_H * 0.18, frontZ - 26 * sk);
      root.add(lamp);
      const pack = box(TORSO_W * 0.85, TORSO_H * 0.6, TORSO_D * 0.6,
        this._mat({ color: 0xd8d8dc, roughness: 0.6, metalness: 0.1 }));
      pack.position.set(0, torsoY + TORSO_H * 0.05, backZ + TORSO_D * 0.32);
      root.add(pack);
    }
    // adult / child / alien: no extra accessory meshes.
  }

  // ── Quadruped pet rig (cat / dog) ──────────────────────────────────────────
  // A separate builder from _buildHumanoid: horizontal torso, 4 two-segment
  // legs, head with ears + snout, 2-segment tail. Body-forward is local -Z (the
  // head/face end) — the SAME convention as the humanoids, so the shared facing
  // math (updateTargets) turns the pet to face its velocity. Shares ALL the
  // Humanoid bookkeeping (nav/carrot/spring, scale/fade, blob shadow, outline
  // shells, plumbob); `quad: true` flips the per-frame pose to _applyQuadPose.
  private _buildQuadruped(color: number, kind: AvatarKind): Humanoid {
    const isCat = kind === 'cat';
    // Cat ≈ 58% of the dog. Dog ≈ beagle: ~520 mm shoulder height.
    const sk = isCat ? 0.58 : 1;
    const idleOffset = Math.random() * Math.PI * 2;

    // Coat driven by the sensor tint (per-sensor colour coding survives);
    // ears/snout/paws use fixed relatives.
    const bodyMat = this._mat({ color, emissive: color, emissiveIntensity: 0.18, roughness: 0.7, metalness: 0.05 });
    const dark = this._mat({ color: 0x202024, roughness: 0.75, metalness: 0.0 });
    const pawMat = this._mat({ color: 0x2a2a2e, roughness: 0.8, metalness: 0.05 });
    const earMat = this._mat({ color: isCat ? 0xf2a0b5 : 0x6b4226, emissive: isCat ? 0xf2a0b5 : 0x6b4226, emissiveIntensity: 0.12, roughness: 0.75, metalness: 0.0 });
    const snoutMat = this._mat({ color: 0xd9c3a5, emissive: 0xd9c3a5, emissiveIntensity: 0.1, roughness: 0.7, metalness: 0.0 });

    // Proportions (mm). Body-forward = -Z (head end).
    const LEG_UPPER_LEN = 235 * sk, LEG_LOWER_LEN = 220 * sk, PAW_H = 50 * sk;
    const LEG_UPPER_R = 44 * sk, LEG_LOWER_R = 34 * sk;
    const backHeight = LEG_UPPER_LEN + LEG_LOWER_LEN + PAW_H;   // pivot height (~505 dog)
    const BODY_LEN = 640 * sk, BODY_W = 200 * sk, BODY_H = 240 * sk;
    const bodyY = backHeight + BODY_H * 0.30;                   // body center height
    const HEAD_R = 132 * sk;
    const frontZ = -BODY_LEN / 2, rearZ = BODY_LEN / 2;

    const root = new THREE.Group();
    root.rotation.order = 'YXZ';   // yaw → pitch → roll (shared convention)

    // Cylinder segment hanging DOWN from local origin (as in _buildHumanoid).
    const segment = (rTop: number, rBot: number, len: number, mat: THREE.Material): THREE.Mesh => {
      const geo = new THREE.CylinderGeometry(rTop, rBot, len, 10);
      geo.translate(0, -len / 2, 0);
      return new THREE.Mesh(geo, mat);
    };

    // Torso (box) + rounded chest/rump spheres. h.torso is the box so the shared
    // breathing scale reads.
    const torso = new THREE.Mesh(new THREE.BoxGeometry(BODY_W, BODY_H, BODY_LEN), bodyMat);
    torso.position.set(0, bodyY, 0);
    root.add(torso);
    const chest = new THREE.Mesh(new THREE.SphereGeometry(BODY_W * 0.6, 14, 10), bodyMat);
    chest.scale.set(1, 1, 0.7);
    chest.position.set(0, bodyY, frontZ + BODY_W * 0.2);
    root.add(chest);
    const rump = new THREE.Mesh(new THREE.SphereGeometry(BODY_W * 0.62, 14, 10), bodyMat);
    rump.scale.set(1, 1, 0.7);
    rump.position.set(0, bodyY, rearZ - BODY_W * 0.2);
    root.add(rump);

    // Two-segment leg: pivot → thigh → knee → shin → paw. Paw toes point -Z.
    const makeLeg = (x: number, z: number) => {
      const hip = new THREE.Group();
      hip.position.set(x, backHeight, z);
      hip.add(segment(LEG_UPPER_R, LEG_UPPER_R * 0.9, LEG_UPPER_LEN, bodyMat));
      const knee = new THREE.Group();
      knee.position.set(0, -LEG_UPPER_LEN, 0);
      hip.add(knee);
      knee.add(segment(LEG_LOWER_R, LEG_LOWER_R * 0.85, LEG_LOWER_LEN, bodyMat));
      const paw = new THREE.Mesh(new THREE.BoxGeometry(LEG_LOWER_R * 2.3, PAW_H, LEG_LOWER_R * 3.2), pawMat);
      paw.position.set(0, -LEG_LOWER_LEN - PAW_H / 2, -LEG_LOWER_R * 0.7);
      knee.add(paw);
      return { hip, knee };
    };
    const legX = BODY_W * 0.42;
    const FL = makeLeg(-legX, frontZ + BODY_LEN * 0.14);
    const FR = makeLeg( legX, frontZ + BODY_LEN * 0.14);
    const BL = makeLeg(-legX, rearZ  - BODY_LEN * 0.14);
    const BR = makeLeg( legX, rearZ  - BODY_LEN * 0.14);
    root.add(FL.hip, FR.hip, BL.hip, BR.hip);

    // Head group at the front, raised on a short neck.
    const headG = new THREE.Group();
    headG.position.set(0, bodyY + BODY_H * 0.42, frontZ - HEAD_R * 0.25);
    root.add(headG);
    const head = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R, 16, 12), bodyMat);
    if (!isCat) head.scale.set(1, 0.95, 1.05);
    headG.add(head);
    const snout = new THREE.Mesh(
      new THREE.BoxGeometry(HEAD_R * (isCat ? 0.5 : 0.62), HEAD_R * 0.42, HEAD_R * (isCat ? 0.5 : 0.7)),
      snoutMat);
    snout.position.set(0, -HEAD_R * 0.24, -HEAD_R * (isCat ? 0.85 : 1.0));
    headG.add(snout);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R * 0.16, 8, 6), dark);
    nose.position.set(0, -HEAD_R * 0.16, -HEAD_R * (isCat ? 1.12 : 1.35));
    headG.add(nose);
    for (const ex of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R * 0.15, 10, 8), dark);
      eye.position.set(ex * HEAD_R * 0.36, HEAD_R * 0.12, -HEAD_R * 0.86);
      headG.add(eye);
    }
    // Ears on pivots (idle flick). Cat = pointed tri-cones; dog = floppy boxes.
    const ears: THREE.Group[] = [];
    for (const ex of [-1, 1]) {
      const earPivot = new THREE.Group();
      earPivot.position.set(ex * HEAD_R * 0.55, HEAD_R * 0.6, HEAD_R * 0.1);
      if (isCat) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(HEAD_R * 0.34, HEAD_R * 0.75, 4), earMat);
        ear.position.set(0, HEAD_R * 0.3, 0);
        earPivot.add(ear);
      } else {
        const ear = new THREE.Mesh(new THREE.BoxGeometry(HEAD_R * 0.34, HEAD_R * 0.85, HEAD_R * 0.14), earMat);
        ear.position.set(0, -HEAD_R * 0.2, 0);   // hangs down (floppy)
        earPivot.add(ear);
        earPivot.rotation.z = ex * 0.25;          // baked outward flop
      }
      headG.add(earPivot);
      ears.push(earPivot);
    }

    // Tail: base pivot at the rump + a mid pivot at the first segment's tip. The
    // base segment is tilted up-and-back (baked into the mesh); animation sways
    // rotation.y and tucks with rotation.x on curl.
    const tailBase = new THREE.Group();
    tailBase.position.set(0, bodyY + BODY_H * 0.18, rearZ - 10 * sk);
    const tLen1 = (isCat ? 230 : 160) * sk, tLen2 = (isCat ? 200 : 130) * sk;
    const tTheta = -2.35;
    const tseg1 = segment(22 * sk, 16 * sk, tLen1, bodyMat);
    tseg1.rotation.x = tTheta;
    tailBase.add(tseg1);
    const tailMid = new THREE.Group();
    // tip of seg1 in tailBase frame: (0,-tLen1,0) rotated by Rx(tTheta).
    tailMid.position.set(0, -tLen1 * Math.cos(tTheta), -tLen1 * Math.sin(tTheta));
    tailBase.add(tailMid);
    const tseg2 = segment(15 * sk, 10 * sk, tLen2, bodyMat);
    tseg2.rotation.x = -2.0;
    tailMid.add(tseg2);
    root.add(tailBase);

    // Cartoon outlines (per-rig clone so a slow despawn fades this rig alone).
    this._addOutlines(new THREE.Group(), 8, 50);   // ensure the shared material exists
    const outlineMat = this._outlineMaterial!.clone();
    this._addOutlines(root, 8, Math.round(60 * sk), outlineMat);

    // Plumbob, scaled ~0.7× vs the humanoid (pets are smaller), above the head.
    const plumbob = new THREE.Mesh(
      new THREE.OctahedronGeometry(60),
      this._mat({ color: 0x2ee56a, emissive: 0x1faa44, emissiveIntensity: 0.9, transparent: true, opacity: 0.88 }),
    );
    plumbob.scale.set(0.72, 1.45, 0.72);
    plumbob.position.set(0, headG.position.y + HEAD_R + 200 * sk, frontZ - HEAD_R * 0.25);
    root.add(plumbob);

    // Blob shadow sized to the body footprint; re-grounded every frame.
    const blob = this._blobShadow(BODY_W * 1.5, BODY_LEN * 0.62);
    root.add(blob);

    const legM = 0.81 * (backHeight / 870);   // stride-match scale (short legs → bigger swing)
    return {
      group: root,
      color,
      avatarKind: kind,
      quad: true,
      quadLegs: [FL, FR, BL, BR],
      quadTail: [tailBase, tailMid],
      quadHead: headG,
      quadEars: ears,
      hipY: backHeight, shoulderY: bodyY, headTopReach: headG.position.y,
      armUpper: LEG_UPPER_LEN, armLower: LEG_LOWER_LEN, legM,
      persBob: 1, persSway: 1, persCadence: 1, persAmp: 1,
      chatterNext: 9e9, chatterT: 0, chatterGlyph: null,   // pets never chatter
      torso,
      plumbob,
      blob,
      // Alias the four leg pivots onto the humanoid joint fields so the shared
      // Humanoid contract holds; only _applyQuadPose animates them (via quadLegs).
      leftHip: FL.hip, leftKnee: FL.knee,
      rightHip: FR.hip, rightKnee: FR.knee,
      leftShoulder: BL.hip, leftElbow: BL.knee,
      rightShoulder: BR.hip, rightElbow: BR.knee,
      phase: 0, facing: 0,
      amp: 0, scale: 0,
      sit: 0, groundY: 0, dwell: 0, sitSpot: null, sitSpotId: null,
      activity: null, activityAnchor: null, activityDwell: 0,
      act: 0, privacy: 0, blurSprite: null,
      bubble: null, bubbleKind: null, bubbleWant: null, bubbleDwell: 0,
      ctxBubbleTier: null, ctxBubbleGlyph: null,
      nameSprite: null, nameText: null, nameColor: null,
      idleOffset,
      vx: 0, vz: 0,
      lastX: 0, lastZ: 0, lastUpdate: 0, initialized: false,
      navX: 0, navZ: 0, carrotX: 0, carrotZ: 0, nvx: 0, nvz: 0,
      rawVx: 0, rawVz: 0, rawLastX: 0, rawLastZ: 0,
      path: null, pathRev: -1, goalCell: -1,
      stuckT: 0, respawnPhase: 0,
      lie: 0, lieBedId: null,
      lastEdge: false, lastRawSpeed: 0, despawnMode: null, fadeAlpha: 1,
      outlineMat,
      idleBlend: 0, fidgetKind: null, fidgetT: 0, fidgetDur: 0,
      fidgetNext: 8 + Math.random() * 12,
      scanState: 0, scanT: 0, scanNext: 4 + Math.random() * 4, scanDir: 1,
      waveT: 0, fidgetLog: [],
    };
  }

  // ── Quadruped per-frame pose. Trot gait (diagonal leg pairs in antiphase) +
  // tail sway + head bob + idle ear flicks; sit (haunches) / curl (lie) blends
  // driven by the SAME h.sit / h.lie the humanoids use. Reads the walk-cycle
  // phase/amp resolved in updateTargets. NO privacy blur / activity anchors /
  // thought bubbles (all gated on !quad upstream).
  private _applyQuadPose(h: Humanoid, p: {
    sinP: number; amp: number; ampNorm: number; speedMs: number;
    sit: number; lie: number; dt: number; now: number; soft: boolean;
  }): void {
    const legs = h.quadLegs;
    if (!legs) return;
    const { sinP, amp, ampNorm, speedMs, now } = p;
    const walking = speedMs > 0.08;
    // Soft lounge seat (sofa/bed) → curl up; hard seat (chair/floor) → haunches.
    const curl = Math.min(1, p.lie + (p.soft ? p.sit : 0));
    const haunch = p.soft ? 0 : p.sit;
    const settle = Math.max(curl, haunch);
    // Trot: legs = [FL, FR, BL, BR]; diagonals FL+BR and FR+BL share a phase and
    // the two diagonals are antiphase.
    const legSign = [1, -1, -1, 1];
    const isFront = [true, true, false, false];
    for (let i = 0; i < 4; i++) {
      const s = legSign[i] * sinP;
      let hipR = s * amp;                            // fore/aft swing
      let kneeR = -Math.max(0, s) * 0.7 * ampNorm;   // lift/flex on the forward swing
      if (haunch > 0.001) {   // "sit": rear legs fold, front legs plant straight
        const sHip = isFront[i] ? 0.05 : 1.05;
        const sKnee = isFront[i] ? -0.05 : -1.6;
        hipR = hipR * (1 - haunch) + sHip * haunch;
        kneeR = kneeR * (1 - haunch) + sKnee * haunch;
      }
      if (curl > 0.001) {     // "lie": all four tuck under the curled body
        hipR = hipR * (1 - curl) + 0.6 * curl;
        kneeR = kneeR * (1 - curl) + (-1.75) * curl;
      }
      legs[i].hip.rotation.x = hipR;
      legs[i].knee.rotation.x = kneeR;
    }
    // Body english. Haunch drops the rear (nose up); curl flattens a touch.
    const bodyPitch = haunch * 0.34 - curl * 0.04;
    const stillness = 1 - Math.min(1, speedMs / 0.4);
    const idleRoll = Math.sin(now * 0.6 + h.idleOffset) * 0.03 * stillness * (1 - settle);
    h.group.rotation.x = bodyPitch;
    h.group.rotation.y = h.facing;
    h.group.rotation.z = idleRoll;
    // Head bob/nod while trotting, gentle look-around while idle; curl tucks the
    // nose down.
    if (h.quadHead) {
      const nod = walking
        ? Math.sin(h.phase * 2) * 0.05 * ampNorm
        : Math.sin(now * 1.2 + h.idleOffset) * 0.03 * stillness;
      h.quadHead.rotation.x = nod + curl * 0.7 + haunch * 0.05;
      h.quadHead.rotation.y = Math.sin(now * 0.5 + h.idleOffset) * 0.08 * stillness * (1 - settle);
    }
    // Tail: fast wag while moving, slow swish when idle; tucked on curl.
    if (h.quadTail && h.quadTail.length >= 2) {
      const wag = walking
        ? Math.sin(now * 8) * 0.35 * ampNorm
        : Math.sin(now * 1.6 + h.idleOffset) * 0.22;
      h.quadTail[0].rotation.y = wag * (1 - curl);
      h.quadTail[1].rotation.y = wag * 0.6 * (1 - curl);
      h.quadTail[0].rotation.x = curl * 1.1;   // wrap the tail around when curled
    }
    // Ears: occasional flick when idle (a short pulse every ~4 s).
    if (h.quadEars) {
      const flickPh = (((now * 0.26 + h.idleOffset) % 1) + 1) % 1;
      const flick = (flickPh < 0.12 ? Math.sin((flickPh / 0.12) * Math.PI) : 0) * 0.4 * stillness;
      for (let i = 0; i < h.quadEars.length; i++) {
        // Preserve the dog's baked outward flop (rotation.z); only pulse x.
        h.quadEars[i].rotation.x = flick;
      }
    }
  }

  private _buildHumanoid(color: number, kind: AvatarKind = 'adult'): Humanoid {
    // ── Per-variant constants (one tidy block). `sk` scales the whole skeleton
    // length; `headR` is an ABSOLUTE head radius (so the child stays big-headed
    // relative to its small body); `limbR` thins/thickens the limbs. `skin` /
    // `body` / `shoe` are the head-limb, torso, and foot colours (0 = use the
    // sensor tint). `headShape`/`hands`/`eyes` pick the silhouette details;
    // `steel` swaps a brushed-metal look on the skin material.
    const GREY = 0x9aa3ad, CHARCOAL = 0x2c2e34, NEARBLACK = 0x161619;
    const PALE = 0xe7c6a4, MATTE = 0x1a1a1e, GOLD = 0xcaa53a, GREEN = 0x86d46a;
    const PLUSH = 0x8b5e3c, MOUSE = 0x9e9e9e, DOG = 0xa1704a, DUCKW = 0xf2f0e6;
    const WHITE = 0xf2f2f2, ROBE = 0x7b718f;
    interface Spec {
      sk: number; headR: number; headShape: 'sphere' | 'box'; limbR: number;
      skin: number; body: number; shoe: number; emI: number;
      hands: 'sphere' | 'box';
      eyes: 'dots' | 'visor' | 'almond' | 'redvisor' | 'shades' | 'slit' | 'halfred';
      steel: boolean;
      // Optional proportion/colour knobs (default 1 / unset):
      armL?: number;      // arm length multiplier (duck's stubby wings)
      legL?: number;      // leg length multiplier (teddy's stubby legs)
      footMul?: [number, number, number];  // foot w/h/d multipliers (duck flippers)
      legColor?: number;  // leg material colour override (duck's yellow legs)
    }
    // Partial: cat/dog are quadrupeds built by _buildQuadruped, never here.
    const SPECS: Partial<Record<AvatarKind, Spec>> = {
      adult:        { sk: 1,    headR: 126, headShape: 'sphere', limbR: 1,   skin: color, body: color,     shoe: 0x1a1a1f, emI: 0.25, hands: 'sphere', eyes: 'dots',    steel: false },
      child:        { sk: 0.6,  headR: 107, headShape: 'sphere', limbR: 1,   skin: color, body: color,     shoe: 0x1a1a1f, emI: 0.25, hands: 'sphere', eyes: 'dots',    steel: false },
      robot:        { sk: 1,    headR: 128, headShape: 'box',    limbR: 1,   skin: GREY,  body: GREY,      shoe: 0x33363c, emI: 0.10, hands: 'box',    eyes: 'visor',   steel: true  },
      alien:        { sk: 1,    headR: 158, headShape: 'sphere', limbR: 0.8, skin: GREEN, body: GREEN,     shoe: 0x1a1a1f, emI: 0.35, hands: 'sphere', eyes: 'almond',  steel: false },
      professional: { sk: 1,    headR: 126, headShape: 'sphere', limbR: 1,   skin: color, body: CHARCOAL,  shoe: 0x141416, emI: 0.20, hands: 'sphere', eyes: 'dots',    steel: false },
      hacker:       { sk: 1,    headR: 126, headShape: 'sphere', limbR: 1,   skin: PALE,  body: NEARBLACK, shoe: 0x141416, emI: 0.15, hands: 'sphere', eyes: 'dots',    steel: false },
      movie_star:   { sk: 1,    headR: 126, headShape: 'sphere', limbR: 1,   skin: color, body: GOLD,      shoe: 0x0a0a0c, emI: 0.20, hands: 'sphere', eyes: 'shades',  steel: false },
      // Classic shinobi: matte black + full hood wrap + skin-tone eye slit +
      // katana + tint sash. NO metal, NO emissive (distinct from ninja_cyborg).
      ninja:        { sk: 1,    headR: 120, headShape: 'sphere', limbR: 1,   skin: MATTE, body: MATTE,     shoe: 0x0a0a0c, emI: 0.05, hands: 'sphere', eyes: 'slit',    steel: false },
      // Half-man half-machine: adult tint body/head, steel right arm + right
      // leg, steel head half-plate + red implant eye on the plated (+x) side.
      cyborg:       { sk: 1,    headR: 126, headShape: 'sphere', limbR: 1,   skin: color, body: color,     shoe: 0x1a1a1f, emI: 0.25, hands: 'sphere', eyes: 'halfred', steel: false },
      ninja_cyborg: { sk: 1,    headR: 120, headShape: 'sphere', limbR: 1,   skin: MATTE, body: MATTE,     shoe: 0x0a0a0c, emI: 0.05, hands: 'sphere', eyes: 'redvisor',steel: false },
      athlete:      { sk: 1,    headR: 126, headShape: 'sphere', limbR: 1,   skin: color, body: color,     shoe: 0xf2f2f2, emI: 0.25, hands: 'sphere', eyes: 'dots',    steel: false },
      // ── Mascots & characters ─────────────────────────────────────────────
      teddy_bear:   { sk: 0.9,  headR: 140, headShape: 'sphere', limbR: 1.3, skin: PLUSH, body: PLUSH,     shoe: PLUSH,    emI: 0.20, hands: 'sphere', eyes: 'dots',    steel: false, armL: 0.8, legL: 0.8 },
      cartoon_mouse:{ sk: 0.85, headR: 120, headShape: 'sphere', limbR: 0.9, skin: MOUSE, body: MOUSE,     shoe: 0x555a60, emI: 0.20, hands: 'sphere', eyes: 'dots',    steel: false },
      cartoon_dog:  { sk: 0.95, headR: 128, headShape: 'sphere', limbR: 1,   skin: DOG,   body: DOG,       shoe: 0x5a3d28, emI: 0.20, hands: 'sphere', eyes: 'dots',    steel: false },
      cartoon_duck: { sk: 0.85, headR: 122, headShape: 'sphere', limbR: 0.9, skin: DUCKW, body: DUCKW,     shoe: 0xe8a020, emI: 0.20, hands: 'sphere', eyes: 'dots',    steel: false, armL: 0.6, footMul: [1.6, 0.7, 1.35], legColor: 0xe8a020 },
      // ── Occupations & archetypes ─────────────────────────────────────────
      cowboy:       { sk: 1,    headR: 126, headShape: 'sphere', limbR: 1,   skin: color, body: color,     shoe: 0x5a3d28, emI: 0.22, hands: 'sphere', eyes: 'dots',    steel: false },
      magician:     { sk: 1,    headR: 126, headShape: 'sphere', limbR: 1,   skin: color, body: NEARBLACK, shoe: 0x0a0a0c, emI: 0.20, hands: 'sphere', eyes: 'dots',    steel: false },
      farmer:       { sk: 1,    headR: 126, headShape: 'sphere', limbR: 1,   skin: color, body: color,     shoe: 0x5a3d28, emI: 0.22, hands: 'sphere', eyes: 'dots',    steel: false },
      tech_expert:  { sk: 1,    headR: 126, headShape: 'sphere', limbR: 1,   skin: color, body: NEARBLACK, shoe: 0x33363c, emI: 0.20, hands: 'sphere', eyes: 'dots',    steel: false },
      supermodel:   { sk: 1.05, headR: 124, headShape: 'sphere', limbR: 0.9, skin: color, body: color,     shoe: 0xf2f2f2, emI: 0.25, hands: 'sphere', eyes: 'dots',    steel: false },
      wise_oracle:  { sk: 1,    headR: 126, headShape: 'sphere', limbR: 1,   skin: PALE,  body: ROBE,      shoe: 0x3a3542, emI: 0.15, hands: 'sphere', eyes: 'dots',    steel: false },
      astronaut:    { sk: 1,    headR: 118, headShape: 'sphere', limbR: 1.1, skin: WHITE, body: WHITE,     shoe: WHITE,    emI: 0.15, hands: 'sphere', eyes: 'dots',    steel: false },
    };
    const spec = SPECS[kind] ?? SPECS.adult!;
    const sk = spec.sk;
    const armL = spec.armL ?? 1, legL = spec.legL ?? 1;
    const [fmW, fmH, fmD] = spec.footMul ?? [1, 1, 1];
    const pers = AVATAR_PERSONALITY[kind] ?? {};
    const idleOffset = Math.random() * Math.PI * 2;

    // Sims proportions: head and hands run oversized (~1.15×) so figures read
    // as game characters rather than mannequins. Lengths scale with `sk`; the
    // head radius is absolute (spec.headR).
    const HEAD_R = spec.headR;
    const TORSO_W = 240 * sk, TORSO_H = 600 * sk, TORSO_D = 140 * sk;
    const ARM_UPPER_R = 52 * sk * spec.limbR, ARM_UPPER_LEN = 320 * sk * armL;
    const ARM_LOWER_R = 44 * sk * spec.limbR, ARM_LOWER_LEN = 280 * sk * armL;
    const HAND_R = 67 * sk;
    const LEG_UPPER_R = 80 * sk * spec.limbR, LEG_UPPER_LEN = 430 * sk * legL;
    const LEG_LOWER_R = 65 * sk * spec.limbR, LEG_LOWER_LEN = 380 * sk * legL;
    const FOOT_W = 90 * sk * fmW, FOOT_H = 60 * sk * fmH, FOOT_D = 230 * sk * fmD;

    const hipY = LEG_UPPER_LEN + LEG_LOWER_LEN + FOOT_H;
    const torsoY = hipY + TORSO_H / 2;
    const headY = hipY + TORSO_H + HEAD_R + 40 * sk;
    const shoulderY = hipY + TORSO_H * 0.88;
    // Per-rig values consumed by updateTargets in place of the old hard-coded
    // 870 / 1398 / 1636 / 320 / 313 / 0.81 constants (see Humanoid fields).
    const armUpperLen = ARM_UPPER_LEN;
    const armLowerReach = ARM_LOWER_LEN + HAND_R * 0.5;
    const legM = 0.81 * (hipY / 870);   // adult → 0.81 exactly; scales with height

    const skin = this._mat(spec.steel
      ? { color: spec.skin, emissive: spec.skin, emissiveIntensity: spec.emI, metalness: 0.7, roughness: 0.35 }
      : { color: spec.skin, emissive: spec.skin, emissiveIntensity: spec.emI, metalness: 0.1, roughness: 0.6 });
    const bodyMat = spec.body === spec.skin ? skin : this._mat({
      color: spec.body, emissive: spec.body, emissiveIntensity: spec.emI * 0.6,
      metalness: spec.steel ? 0.7 : 0.1, roughness: spec.steel ? 0.35 : 0.62,
    });
    const dark = this._mat({
      color: 0x202024, roughness: 0.75, metalness: 0.0,
    });
    const shoeMat = this._mat({
      color: spec.shoe, roughness: 0.8, metalness: 0.05,
    });
    // Face-detail materials (per-rig, like `dark`). Eye whites read the sclera
    // against the dark iris; the nose is a slightly-darkened skin tone so it
    // catches its own toon band instead of vanishing into the head. `darken`
    // multiplies each channel of a 0xRRGGBB toward black.
    const darken = (col: number, f: number): number =>
      ((Math.round(((col >> 16) & 0xff) * f) << 16)
        | (Math.round(((col >> 8) & 0xff) * f) << 8)
        | Math.round((col & 0xff) * f));
    const eyeWhite = this._mat({ color: 0xf4f4f6, roughness: 0.35, metalness: 0.0 });
    const noseCol = darken(spec.skin, 0.8);
    const noseMat = this._mat({
      color: noseCol, emissive: noseCol, emissiveIntensity: spec.emI * 0.5,
      roughness: 0.6, metalness: spec.steel ? 0.5 : 0.1,
    });
    // Accent material in the sensor tint — restores the per-sensor colour coding
    // on variants whose body/skin overrides it (robot / alien / hacker / ninja).
    const accent = this._mat({
      color, emissive: color, emissiveIntensity: 0.35, metalness: 0.15, roughness: 0.5,
    });

    // Cylinder segment that hangs DOWN from local origin.
    const segment = (radTop: number, radBot: number, length: number, mat: THREE.Material = skin): THREE.Mesh => {
      const geo = new THREE.CylinderGeometry(radTop, radBot, length, 10);
      geo.translate(0, -length / 2, 0);
      return new THREE.Mesh(geo, mat);
    };

    // Two-segment leg: hip pivot → thigh → knee pivot → shin → foot.
    // `legMat` lets a variant swap the whole leg (cyborg's steel right leg).
    const makeLeg = (xOffset: number, legMat: THREE.Material = skin) => {
      const hip = new THREE.Group();
      hip.position.set(xOffset, hipY, 0);
      hip.add(segment(LEG_UPPER_R, LEG_UPPER_R * 0.9, LEG_UPPER_LEN, legMat));
      // Visible knee bump
      const kneeBall = new THREE.Mesh(new THREE.SphereGeometry(LEG_UPPER_R * 0.95, 10, 8), legMat);
      kneeBall.position.set(0, -LEG_UPPER_LEN, 0);
      hip.add(kneeBall);

      const knee = new THREE.Group();
      knee.position.set(0, -LEG_UPPER_LEN, 0);
      hip.add(knee);
      knee.add(segment(LEG_LOWER_R, LEG_LOWER_R * 0.85, LEG_LOWER_LEN, legMat));

      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(FOOT_W, FOOT_H, FOOT_D),
        shoeMat,
      );
      // Toes pushed toward -Z, the body-forward side (matches face).
      foot.position.set(0, -LEG_LOWER_LEN - FOOT_H / 2, -FOOT_D * 0.18);
      knee.add(foot);

      return { hip, knee };
    };

    // Two-segment arm: shoulder pivot → upper → elbow pivot → forearm → hand.
    // `armMat` lets a variant swap the whole arm (ninja's steel right arm).
    const makeArm = (xOffset: number, armMat: THREE.Material = skin) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(xOffset, shoulderY, 0);
      shoulder.add(segment(ARM_UPPER_R, ARM_UPPER_R * 0.92, ARM_UPPER_LEN, armMat));
      // Visible elbow bump
      const elbowBall = new THREE.Mesh(new THREE.SphereGeometry(ARM_UPPER_R * 0.95, 10, 8), armMat);
      elbowBall.position.set(0, -ARM_UPPER_LEN, 0);
      shoulder.add(elbowBall);

      const elbow = new THREE.Group();
      elbow.position.set(0, -ARM_UPPER_LEN, 0);
      shoulder.add(elbow);
      elbow.add(segment(ARM_LOWER_R, ARM_LOWER_R * 0.85, ARM_LOWER_LEN, armMat));

      const hand = spec.hands === 'box'
        ? new THREE.Mesh(new THREE.BoxGeometry(HAND_R * 1.5, HAND_R * 1.5, HAND_R * 1.3), armMat)
        : new THREE.Mesh(new THREE.SphereGeometry(HAND_R, 12, 10), armMat);
      hand.position.set(0, -ARM_LOWER_LEN - HAND_R * 0.5, 0);
      elbow.add(hand);

      return { shoulder, elbow };
    };

    const root = new THREE.Group();
    // Yaw (facing) → pitch (forward lean) → roll (stride sway); see
    // updateTargets.
    root.rotation.order = 'YXZ';

    // Torso
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(TORSO_W, TORSO_H, TORSO_D),
      bodyMat,
    );
    torso.position.set(0, torsoY, 0);
    root.add(torso);

    // Head + face features (eyes/nose/mouth on -Z so facing is obvious).
    const head = spec.headShape === 'box'
      ? new THREE.Mesh(new THREE.BoxGeometry(HEAD_R * 1.7, HEAD_R * 1.7, HEAD_R * 1.6), skin)
      : new THREE.Mesh(new THREE.SphereGeometry(HEAD_R, 18, 14), skin);
    head.position.set(0, headY, 0);
    root.add(head);

    // Face features sit on the -Z side of the head: that's the body-forward
    // side (a positive hip rotation lands the foot at body-local -Z, which
    // is also where the body rotation aligns with the velocity vector).
    const faceZ = -HEAD_R * (spec.headShape === 'box' ? 0.82 : 0.86);
    // Reusable feature builders — heads run oversized (Sims-style) so these read
    // at typical camera distance. An eye = white sclera sphere (flattened into
    // the face) + a proud dark iris/pupil; a brow = a small dark box angled
    // slightly inward; ears = skin half-domes on the sides (only where hair /
    // hats / helmets don't cover them). All small parts fall below the outline
    // minDim (50·sk) except the ears, which read fine with a shell.
    const makeEye = (sx: number) => {
      const whiteR = HEAD_R * 0.2;
      const white = new THREE.Mesh(new THREE.SphereGeometry(whiteR, 12, 10), eyeWhite);
      white.scale.set(1, 1.12, 0.62);   // taller than wide, flattened onto the face
      white.position.set(sx * HEAD_R * 0.4, headY + HEAD_R * 0.12, faceZ);
      white.userData.outlineSkip = true;   // shell would darken the sclera rim
      root.add(white);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(whiteR * 0.56, 10, 8), dark);
      pupil.position.set(sx * HEAD_R * 0.4, headY + HEAD_R * 0.12, faceZ - whiteR * 0.5);
      root.add(pupil);
    };
    const makeBrow = (sx: number) => {
      const brow = new THREE.Mesh(
        new THREE.BoxGeometry(HEAD_R * 0.34, HEAD_R * 0.08, HEAD_R * 0.06), dark);
      brow.position.set(sx * HEAD_R * 0.4, headY + HEAD_R * 0.33, faceZ - HEAD_R * 0.02);
      brow.rotation.z = -sx * 0.14;   // inner end dips toward the nose
      root.add(brow);
    };
    // Kinds whose accessory hair / hood / helmet / ears cover the side of the
    // head — no skin ears for these (they'd poke through the costume).
    const EAR_SKIP: ReadonlySet<AvatarKind> = new Set<AvatarKind>([
      'robot', 'alien', 'ninja', 'ninja_cyborg', 'astronaut', 'supermodel',
      'tech_expert', 'hacker', 'wise_oracle',
      'teddy_bear', 'cartoon_mouse', 'cartoon_dog', 'cartoon_duck',
    ]);
    const makeEar = (sx: number) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R * 0.25, 10, 8), skin);
      ear.scale.set(0.5, 0.95, 0.72);
      ear.position.set(sx * HEAD_R * 0.95, headY + HEAD_R * 0.02, HEAD_R * 0.05);
      root.add(ear);
    };
    if (spec.eyes === 'dots') {
      for (const sx of [-1, 1]) { makeEye(sx); makeBrow(sx); }
    } else if (spec.eyes === 'almond') {
      // Big black almond eyes — scaled spheres, angled inward.
      for (const sx of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R * 0.3, 12, 10), dark);
        eye.scale.set(0.55, 1.15, 0.5);
        eye.rotation.z = sx * 0.4;
        eye.position.set(sx * HEAD_R * 0.4, headY + HEAD_R * 0.05, faceZ);
        root.add(eye);
      }
    } else if (spec.eyes === 'visor' || spec.eyes === 'redvisor') {
      // Single wide eye strip across the face. Robot = dark cyan glow, ninja =
      // red glow (emissive → mark outlineSkip so the shell doesn't fringe it).
      const glow = spec.eyes === 'redvisor' ? 0xff2a2a : 0x33ccff;
      const visor = new THREE.Mesh(
        new THREE.BoxGeometry(HEAD_R * 1.15, HEAD_R * 0.34, HEAD_R * 0.16),
        this._mat({ color: 0x0a0a0c, emissive: glow, emissiveIntensity: 1.1, metalness: 0.2, roughness: 0.4 }),
      );
      visor.position.set(0, headY + HEAD_R * 0.08, faceZ - HEAD_R * 0.08);
      visor.userData.outlineSkip = true;
      root.add(visor);
    } else if (spec.eyes === 'shades') {
      // Sunglasses bar across the eyes.
      const shades = new THREE.Mesh(
        new THREE.BoxGeometry(HEAD_R * 1.2, HEAD_R * 0.3, HEAD_R * 0.14),
        this._mat({ color: 0x0a0a0c, metalness: 0.5, roughness: 0.2 }),
      );
      shades.position.set(0, headY + HEAD_R * 0.08, faceZ - HEAD_R * 0.06);
      root.add(shades);
    } else if (spec.eyes === 'slit') {
      // Ninja: horizontal SKIN-TONE eye-slit band through the hood wrap, with
      // normal dark eyes visible in the slit. No glow, no metal.
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(HEAD_R * 1.3, HEAD_R * 0.36, HEAD_R * 0.24),
        this._mat({ color: PALE, emissive: PALE, emissiveIntensity: 0.15, roughness: 0.6, metalness: 0.05 }),
      );
      // Proud of the hood shell (r ≈ 1.14·HEAD_R, added in accessories) so the
      // slit reads as an opening in the wrap.
      band.position.set(0, headY + HEAD_R * 0.1, -HEAD_R * 1.08);
      root.add(band);
      for (const sx of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R * 0.14, 10, 8), dark);
        eye.position.set(sx * HEAD_R * 0.36, headY + HEAD_R * 0.1, -HEAD_R * 1.2);
        root.add(eye);
      }
    } else if (spec.eyes === 'halfred') {
      // Cyborg: organic left eye (full detail) + brow, red emissive implant on
      // the plated (+x) side.
      makeEye(-1); makeBrow(-1);
      const eyeRed = new THREE.Mesh(
        new THREE.SphereGeometry(HEAD_R * 0.18 * 0.9, 10, 8),
        this._mat({ color: 0x330000, emissive: 0xff2a2a, emissiveIntensity: 1.2, metalness: 0.2, roughness: 0.4 }),
      );
      eyeRed.position.set(HEAD_R * 0.38, headY + HEAD_R * 0.12, faceZ - HEAD_R * 0.04);
      eyeRed.userData.outlineSkip = true;
      root.add(eyeRed);
    }
    // Nose: a small darkened-skin bump (catches its own toon band so it reads),
    // skipped on the faceless robot visor / almond alien / masked ninja slit.
    if (spec.eyes !== 'visor' && spec.eyes !== 'almond' && spec.eyes !== 'slit') {
      const nose = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R * 0.15, 8, 6), noseMat);
      nose.scale.set(0.8, 1, 0.9);
      nose.position.set(0, headY - HEAD_R * 0.06, faceZ - HEAD_R * 0.12);
      root.add(nose);
    }
    // Mouth: a slim dark line, given a gentle downward bow (two side segments
    // dipped at the corners) so it reads as a friendly closed smile rather than
    // a flat dash. Skipped on the robot visor / ninja slit.
    if (spec.eyes !== 'visor' && spec.eyes !== 'slit') {
      const mouthMat = dark;
      const mid = new THREE.Mesh(
        new THREE.BoxGeometry(HEAD_R * 0.3, HEAD_R * 0.07, HEAD_R * 0.05), mouthMat);
      mid.position.set(0, headY - HEAD_R * 0.44, faceZ);
      root.add(mid);
      for (const sx of [-1, 1]) {
        const corner = new THREE.Mesh(
          new THREE.BoxGeometry(HEAD_R * 0.14, HEAD_R * 0.07, HEAD_R * 0.05), mouthMat);
        corner.position.set(sx * HEAD_R * 0.19, headY - HEAD_R * 0.4, faceZ);
        corner.rotation.z = sx * 0.5;   // corners turn up into a smile
        root.add(corner);
      }
    }
    // Ears: skin half-domes on the sides for kinds not wearing side-covering
    // hair / hoods / helmets. Cyborg shows only its organic (−x) ear (the +x
    // side carries the steel head plate).
    if (!EAR_SKIP.has(kind) && spec.headShape !== 'box') {
      if (kind === 'cyborg') makeEar(-1);
      else { makeEar(-1); makeEar(1); }
    }

    // Limbs. Cyborg kinds get a brushed-steel prosthetic right (+x) arm; the
    // plain cyborg additionally gets a steel right leg (same side as its arm
    // + head plate). `legColor` (duck's yellow legs) recolors BOTH legs.
    const steelMat = (kind === 'ninja_cyborg' || kind === 'cyborg')
      ? this._mat({ color: 0x8a9099, emissive: 0x8a9099, emissiveIntensity: 0.1, metalness: 0.8, roughness: 0.3 })
      : skin;
    // Trouser tone: plain rigs whose legs would otherwise render in the raw
    // identity tint (spec.skin === the passed-in `color`) read as a head-to-toe
    // unitard ("missing pants"). Give BOTH leg segments (upper + lower — not the
    // shoes, which keep spec.shoe) a derived trouser tone via `trouserTone`:
    // bright tints (luma ≥ 110) get the tint × 0.5 so the boundary reads under
    // the toon bands; DARK tints (whose halved tone would be muddy/indistinct)
    // get the farthest neutral from a small trouser palette — deterministic, so
    // the pants stay stable across rebuilds/recolors of the same identity color.
    // Derived HERE from whatever `color` was passed in (per-sensor tint / fused
    // person / BLE person), so it tracks every recolor path without a cached
    // constant. Kinds with an explicit spec.legColor (duck) or a non-tint skin
    // (robot/alien/hacker/ninja/wise_oracle/…) keep their costume legs untouched.
    // Per-rig material (not a shared style resource).
    const legIsTint = spec.legColor == null && spec.skin === color;
    const pants = trouserTone(color);
    const baseLegMat = spec.legColor != null
      ? this._mat({ color: spec.legColor, emissive: spec.legColor, emissiveIntensity: 0.2, metalness: 0.1, roughness: 0.6 })
      : legIsTint
        ? this._mat({ color: pants, emissive: pants, emissiveIntensity: spec.emI * 0.5, metalness: 0.1, roughness: 0.68 })
        : skin;
    const leftLeg  = makeLeg(-TORSO_W / 4, baseLegMat);
    const rightLeg = makeLeg( TORSO_W / 4, kind === 'cyborg' ? steelMat : baseLegMat);
    const leftArm  = makeArm(-(TORSO_W / 2 + ARM_UPPER_R * 0.7));
    const rightArm = makeArm( TORSO_W / 2 + ARM_UPPER_R * 0.7, steelMat);
    // Relaxed A-pose: arms splay a touch outward so the silhouette isn't a
    // rigid soldier. Static roll — updateTargets only animates rotation.x.
    leftArm.shoulder.rotation.z  = -0.08;
    rightArm.shoulder.rotation.z =  0.08;
    root.add(leftLeg.hip, rightLeg.hip, leftArm.shoulder, rightArm.shoulder);

    // ── Per-variant accessories (added BEFORE the outline pass so they get
    // cartoon shells too; emissive parts opt out via userData.outlineSkip).
    this._addAvatarAccessories(kind, spec, root, {
      color, accent, dark, shoeMat, skin, bodyMat,
      HEAD_R, headY, torsoY, hipY, TORSO_W, TORSO_H, TORSO_D, sk,
    });

    // Cartoon outlines on the body (thinner than furniture; minDim catches
    // limbs and head but skips eyes / nose / mouth detail). Per-rig material
    // CLONE so a slow despawn can fade THIS rig's outline alpha alone. Force the
    // shared material to exist first, then clone it.
    this._addOutlines(new THREE.Group(), 8, 50);  // ensure _outlineMaterial exists
    const outlineMat = this._outlineMaterial!.clone();
    this._addOutlines(root, 8, Math.round(50 * sk), outlineMat);

    // The plumbob: elongated spinning octahedron floating above the head.
    // Transparent → automatically skipped by the outline pass.
    const plumbob = new THREE.Mesh(
      new THREE.OctahedronGeometry(85),
      this._mat({
        color: 0x2ee56a, emissive: 0x1faa44, emissiveIntensity: 0.9,
        transparent: true, opacity: 0.88,
      }),
    );
    plumbob.scale.set(0.72, 1.45, 0.72);
    plumbob.position.set(0, headY + HEAD_R + 240 * sk, 0);
    root.add(plumbob);

    // Blob shadow; re-grounded every frame in updateTargets (the root bobs
    // and drops onto seats — the blob must stay on the walking surface).
    const blob = this._blobShadow(430 * sk, 430 * sk);
    root.add(blob);

    return {
      group: root,
      color,
      avatarKind: kind,
      hipY, shoulderY, headTopReach: headY,
      armUpper: armUpperLen, armLower: armLowerReach, legM,
      persBob: pers.bobMul ?? 1, persSway: pers.swayMul ?? 1,
      persCadence: pers.cadenceMul ?? 1, persAmp: pers.ampMul ?? 1,
      chatterNext: 25 + idleOffset / (Math.PI * 2) * 35, chatterT: 0, chatterGlyph: null,
      torso,
      plumbob,
      blob,
      leftHip: leftLeg.hip,
      rightHip: rightLeg.hip,
      leftKnee: leftLeg.knee,
      rightKnee: rightLeg.knee,
      leftShoulder: leftArm.shoulder,
      rightShoulder: rightArm.shoulder,
      leftElbow: leftArm.elbow,
      rightElbow: rightArm.elbow,
      phase: 0, facing: 0,
      amp: 0, scale: 0,
      sit: 0, groundY: 0, dwell: 0, sitSpot: null, sitSpotId: null,
      activity: null, activityAnchor: null, activityDwell: 0,
      act: 0, privacy: 0, blurSprite: null,
      bubble: null, bubbleKind: null, bubbleWant: null, bubbleDwell: 0,
      ctxBubbleTier: null, ctxBubbleGlyph: null,
      nameSprite: null, nameText: null, nameColor: null,
      idleOffset,
      vx: 0, vz: 0,
      lastX: 0, lastZ: 0, lastUpdate: 0, initialized: false,
      navX: 0, navZ: 0, carrotX: 0, carrotZ: 0, nvx: 0, nvz: 0,
      rawVx: 0, rawVz: 0, rawLastX: 0, rawLastZ: 0,
      path: null, pathRev: -1, goalCell: -1,
      stuckT: 0, respawnPhase: 0,
      lie: 0, lieBedId: null,
      lastEdge: false, lastRawSpeed: 0, despawnMode: null, fadeAlpha: 1,
      outlineMat,
      idleBlend: 0, fidgetKind: null, fidgetT: 0, fidgetDur: 0,
      fidgetNext: 8 + Math.random() * 12,
      scanState: 0, scanT: 0, scanNext: 4 + Math.random() * 4, scanDir: 1,
      waveT: 0, fidgetLog: [],
    };
  }

  // Set a rig's overall opacity multiplier (slow despawn fade / restore).
  // Every material under a humanoid is per-rig or per-instance (skin/dark/shoe,
  // the per-rig outline clone, the per-instance blob + plumbob, bubble/blur
  // sprites), so scaling their opacity never touches another rig. Base opacity /
  // transparency is captured on the material's userData the first time so a
  // restore (`alpha` = 1) returns each to its authored look. `transparent` only
  // toggles (and recompiles) when it actually changes.
  private _fadeRig(h: Humanoid, alpha: number): void {
    const apply = (mat: THREE.Material & { opacity?: number }) => {
      const ud = mat.userData as { baseOpacity?: number; baseTransparent?: boolean };
      if (ud.baseOpacity === undefined) {
        ud.baseOpacity = mat.opacity ?? 1;
        ud.baseTransparent = mat.transparent ?? false;
      }
      mat.opacity = ud.baseOpacity * alpha;
      const wantT = alpha < 0.999 ? true : (ud.baseTransparent ?? false);
      if (mat.transparent !== wantT) { mat.transparent = wantT; mat.needsUpdate = true; }
    };
    h.group.traverse(obj => {
      const anyObj = obj as THREE.Mesh & THREE.Sprite;
      const m = anyObj.material as THREE.Material | THREE.Material[] | undefined;
      if (!m) return;
      if (Array.isArray(m)) m.forEach(apply); else apply(m);
    });
  }

  private _disposeHumanoid(h: Humanoid): void {
    h.group.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry.dispose();
        // Outline shells share this rig's per-rig clone (h.outlineMat); it's
        // disposed once below, so skip it here (dispose is idempotent anyway).
        const mm0 = m.material as THREE.Material;
        if (mm0 === h.outlineMat) { /* shared per-rig clone; freed below */ }
        else if (Array.isArray(m.material)) m.material.forEach(mm => mm.dispose());
        else mm0.dispose();
      } else if ((obj as THREE.Sprite).isSprite) {
        // Dispose the sprite's material. Per-rig maps (thought-bubble canvas
        // textures) must be freed too; the blur silhouette maps are SHARED
        // across all rigs (disposed once in destroy()) so leave those alone.
        const sm = (obj as THREE.Sprite).material as THREE.SpriteMaterial;
        if (sm.map && sm.map !== this._blurTexStand && sm.map !== this._blurTexSit) {
          sm.map.dispose();
        }
        sm.dispose();
      }
    });
    // Per-rig outline clone (never the shared _outlineMaterial).
    if (h.outlineMat && h.outlineMat !== this._outlineMaterial) h.outlineMat.dispose();
  }

  resize(w: number, h: number): void {
    if (!this._renderer || !this._camera) return;
    this._camera.aspect = Math.max(w, 1) / Math.max(h, 1);
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(w, h);
  }

  destroy(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    // Dispose every per-frame group BEFORE tearing down the WebGL context so
    // GC isn't dumped a giant orphaned graph all at once on view-switch.
    for (const g of [
      this._floorGroup, this._doorGroup, this._modelGroup, this._zoneGroup, this._haloGroup,
      this._sensorGroup, this._motionGroup, this._envGroup, this._bleGroup,
      this._alarmGroup, this._safetyGroup, this._robotGroup, this._robotRigGroup,
      this._lightGroup, this._switchGroup, this._targetGroup, this._gpsGroup, this._weatherGroup,
    ]) {
      this._disposeSpriteMaps(g);
      this._clearGroup(g);
    }
    this._weatherClouds = []; this._weatherFogPlanes = []; this._weatherFlash = null;
    this._weatherCloudShadows = []; this._weatherPuddles = []; this._weatherIcicles = [];
    for (const key of Object.keys(this._humanoids)) {
      this._disposeHumanoid(this._humanoids[key]);
    }
    this._humanoids = {};
    this._disposeBedCovers();
    if (this._bgTexCache) {
      this._bgTexCache.tex.dispose();
      this._bgTexCache = null;
    }
    // Shared style resources (never disposed per-instance — see _mat /
    // _blobShadow / _addOutlines).
    this._gradientMapTex?.dispose(); this._gradientMapTex = null;
    this._blobTex?.dispose(); this._blobTex = null;
    this._blurTexStand?.dispose(); this._blurTexStand = null;
    this._blurTexSit?.dispose(); this._blurTexSit = null;
    // Shared weather particle / fog-plane maps (W2) — freed once here.
    this._rainTex?.dispose(); this._rainTex = null;
    this._snowTex?.dispose(); this._snowTex = null;
    this._hailTex?.dispose(); this._hailTex = null;
    this._dustTex?.dispose(); this._dustTex = null;
    this._fogPlaneTex?.dispose(); this._fogPlaneTex = null;
    this._cloudShadowTex?.dispose(); this._cloudShadowTex = null;
    this._puddleTex?.dispose(); this._puddleTex = null;
    this._outlineMaterial?.dispose(); this._outlineMaterial = null;
    this._controls?.dispose();
    if (this._renderer) {
      this._renderer.dispose();
      this._renderer.forceContextLoss?.();
      this._renderer.domElement.remove();
    }
    this._scene = null; this._renderer = null; this._camera = null;
    this._controls = null;
  }

  // Auto-follow camera: ease `controls.target` + `camera.position` each frame to
  // frame the ACTIVE humanoids (scale > 0.3, bed-hidden ones included — their
  // group position stays on the mattress). One cluster → tight framing; figures
  // far apart → the padded bounding box naturally widens so all stay in view.
  // Nobody about → eases back to the full-floor sims/iso framing. Keeps the
  // current azimuth; eases elevation toward the dimetric ~35.26°. Never snaps.
  private _updateAutoFollow(dt: number): void {
    if (!this._autoFollow || !this._camera || !this._controls) return;
    if (performance.now() / 1000 < this._followPauseUntil) return;  // manual-input pause

    const cam = this._camera, ctrl = this._controls;
    const floorFitD = Math.max(this._fw, this._fd) * 1.35;

    let n = 0, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const key of Object.keys(this._humanoids)) {
      const h = this._humanoids[key];
      if (h.scale <= 0.3) continue;
      const px = h.group.position.x, pz = h.group.position.z;
      if (px < minX) minX = px; if (px > maxX) maxX = px;
      if (pz < minZ) minZ = pz; if (pz > maxZ) maxZ = pz;
      n++;
    }

    let tgtX: number, tgtZ: number, desiredDist: number;
    if (n === 0) {
      tgtX = 0; tgtZ = 0; desiredDist = floorFitD;
    } else {
      const PAD = 2200;
      minX -= PAD; maxX += PAD; minZ -= PAD; maxZ += PAD;
      tgtX = (minX + maxX) / 2; tgtZ = (minZ + maxZ) / 2;
      const maxExtent = Math.max(maxX - minX, maxZ - minZ);
      // Fit the padded box to the vertical fov, narrowing the effective angle on
      // portrait viewports (aspect < 1) so the box still fits horizontally.
      const fovV = cam.fov * Math.PI / 180;
      const aspectAdjust = Math.min(1, cam.aspect);
      desiredDist = (maxExtent / 2) / Math.tan((fovV / 2) * aspectAdjust);
      desiredDist = Math.max(4500, Math.min(floorFitD, desiredDist));
    }
    const tgtY = 600;

    const dx = cam.position.x - ctrl.target.x, dz = cam.position.z - ctrl.target.z;
    const dy = cam.position.y - ctrl.target.y;
    const az = Math.atan2(dx, dz);                    // preserved
    const elCur = Math.atan2(dy, Math.hypot(dx, dz));
    const elGoal = Math.atan(1 / Math.SQRT2);         // ≈ 35.26°
    const el = elCur + (elGoal - elCur) * Math.min(1, dt * 0.8);

    const r = desiredDist * Math.cos(el), hgt = desiredDist * Math.sin(el);
    const desCamX = tgtX + r * Math.sin(az);
    const desCamZ = tgtZ + r * Math.cos(az);
    const desCamY = tgtY + hgt;

    const k = Math.min(1, dt * 0.8);                  // τ ≈ 1.2 s
    ctrl.target.x += (tgtX - ctrl.target.x) * k;
    ctrl.target.y += (tgtY - ctrl.target.y) * k;
    ctrl.target.z += (tgtZ - ctrl.target.z) * k;
    cam.position.x += (desCamX - cam.position.x) * k;
    cam.position.y += (desCamY - cam.position.y) * k;
    cam.position.z += (desCamZ - cam.position.z) * k;
  }

  // Cinematic slow-orbit: advance the camera azimuth about the orbit center at a
  // fixed rate, preserving distance + elevation. When auto-follow is OFF, ease
  // the orbit center toward the active-rig bbox (floor center if none) so we
  // circle the avatars; when ON, auto-follow already parks the target there, so
  // we just add the azimuth on top of its framing (it preserves azimuth, so the
  // two compose without oscillating). Shares the manual-orbit pause timer.
  private _updateCinematicOrbit(dt: number): void {
    if (!this._cinematicOrbit || !this._camera || !this._controls) return;
    if (performance.now() / 1000 < this._followPauseUntil) return;   // manual-input pause
    const cam = this._camera, ctrl = this._controls;
    if (!this._autoFollow) {
      // Orbit center = active-rig bbox center (scene coords), else floor center.
      let n = 0, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const key of Object.keys(this._humanoids)) {
        const h = this._humanoids[key];
        if (h.scale <= 0.3) continue;
        const px = h.group.position.x, pz = h.group.position.z;
        if (px < minX) minX = px; if (px > maxX) maxX = px;
        if (pz < minZ) minZ = pz; if (pz > maxZ) maxZ = pz;
        n++;
      }
      const cx = n ? (minX + maxX) / 2 : 0, cz = n ? (minZ + maxZ) / 2 : 0;
      const k = Math.min(1, dt * 0.8);
      ctrl.target.x += (cx - ctrl.target.x) * k;
      ctrl.target.z += (cz - ctrl.target.z) * k;
    }
    // Advance azimuth about the target; keep the horizontal radius + height (so
    // both distance and elevation — the "current zoom level" — are preserved).
    const t = ctrl.target;
    const dx = cam.position.x - t.x, dz = cam.position.z - t.z;
    const r = Math.hypot(dx, dz);
    const a = Math.atan2(dx, dz) + this._ORBIT_RATE * dt;
    cam.position.x = t.x + r * Math.sin(a);
    cam.position.z = t.z + r * Math.cos(a);
  }

  private _animate = (): void => {
    this._rafId = requestAnimationFrame(this._animate);
    const nowS = performance.now() / 1000;
    const frameDt = this._lastAnimT ? Math.min(0.1, nowS - this._lastAnimT) : 0.016;
    this._lastAnimT = nowS;
    // Auto-follow camera: ease the pose to frame the active people (runs before
    // the azimuth glide + controls.update() so it plays nicely with damping).
    this._updateAutoFollow(frameDt);
    // Cinematic slow-orbit rides on top of auto-follow's framing (or orbits the
    // avatars on its own when auto-follow is off).
    this._updateCinematicOrbit(frameDt);
    // Sims-cam azimuth glide: rotate the camera about the target toward the
    // snap goal, easing the shortest arc. Cleared once within ~0.5°. SUSPENDED
    // while cinematic orbit runs (continuous orbit vs 45° snap would fight — the
    // user's _simsCam flag is left intact, just not applied here).
    if (this._snapAzimuth != null && !this._cinematicOrbit && this._camera && this._controls) {
      const t = this._controls.target;
      const dx = this._camera.position.x - t.x, dz = this._camera.position.z - t.z;
      const cur = Math.atan2(dx, dz);
      let delta = this._snapAzimuth - cur;
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      if (Math.abs(delta) < 0.009) {   // ~0.5°
        this._snapAzimuth = null;
      } else {
        const a = cur + delta * 0.2;   // eased step
        const r = Math.hypot(dx, dz);
        this._camera.position.x = t.x + r * Math.sin(a);
        this._camera.position.z = t.z + r * Math.cos(a);
      }
    }
    if (this._controls) this._controls.update();
    // Foreground wall cutaway — cheap per-frame dot products over tagged walls.
    this._updateWallCutaway();
    // Spin fan rotors — angle from the absolute clock so scene rebuilds
    // (which recreate rotor groups) never jump the blade phase.
    if (this._fanRotors.length) {
      const t = performance.now() / 1000;
      for (const rot of this._fanRotors) {
        rot.obj.rotation.y = (t * rot.rps * 2 * Math.PI) % (2 * Math.PI);
      }
    }
    // Outdoor weather effects — buffer mutation only (no per-frame allocation);
    // fog easing runs even when the group is hidden (see _advanceWeather).
    this._advanceWeather(frameDt, nowS);
    if (this._renderer && this._scene && this._camera) {
      this._renderer.render(this._scene, this._camera);
    }
  };
}
