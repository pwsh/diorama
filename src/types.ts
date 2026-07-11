// Domain types. All length units are mm unless noted.

// Type-only import (erased at compile time — no runtime cycle with geometry.ts,
// which imports the value-side FURNITURE_KINDS from here-adjacent types).
import type { FurnitureKindDef } from './geometry.js';

export interface Vec2 { x: number; y: number; }

export type WallKind = 'full' | 'half' | 'railing' | 'invisible';

export interface Wall {
  id: string;
  points: Vec2[];
  kind?: WallKind;   // full (default 9 ft) | half pony wall | 3 ft banister | invisible
  locked?: boolean;  // canvas move/vertex-drag/delete disabled
}

export type FurnitureKind =
  // furniture
  | 'block'         // plain rectangle (default)
  | 'table'         // flat top + 4 legs
  | 'chair'         // seat + backrest
  | 'rocking_chair'
  | 'chaise'        // long lounger w/ short back
  | 'bench'         // thin seat
  | 'desk'
  | 'sofa'
  | 'bed'
  | 'rug'           // flat zero-height
  | 'bookshelf'     // tall narrow
  | 'sofa_l_left'   // L sectional, chaise on the plan-left end
  | 'sofa_l_right'  // L sectional, chaise on the plan-right end
  | 'sofa_u'        // U sectional, returns on both ends
  | 'stairs' | 'stairs_half' | 'stair_landing'  // floor transitions; compose L/U runs
  | 'coffee_table' | 'tv_stand' | 'dresser' | 'nightstand' | 'wardrobe'
  | 'ottoman' | 'stool' | 'plant' | 'counter' | 'island' | 'cabinet'
  // appliances
  | 'fridge' | 'stove' | 'dishwasher' | 'washer' | 'dryer' | 'microwave' | 'tv'
  | 'wall_tv'       // wall-mounted flat TV, no stand
  | 'kitchen_sink'  // stainless double basin embedded in a counter
  | 'coffee_maker' | 'toaster'
  // bathroom
  | 'toilet' | 'sink' | 'sink_vanity' | 'bathtub' | 'shower'
  // fitness
  | 'exercise_equipment';

// Contextual activity a piece of furniture anchors (Sims-style character
// behavior — later phases dwell-trigger these). Set on the kind def (or an
// ObjectRecipe) via `activity`.
export type ActivityKind =
  | 'shower' | 'bathe' | 'toilet' | 'wash_hands' | 'load_dishwasher'
  | 'make_coffee' | 'forage_fridge' | 'watch_tv' | 'eat_at_table'
  | 'work_at_desk' | 'exercise' | 'sleep_shared'
  | 'browse_bookshelf' | 'tend_plant';

// ── Custom object recipes ────────────────────────────────────────────────
// A user-authored object built from a list of primitive parts. Stored in
// Store.customObjects; the 3D renderer builds it generically, 2D draws a
// labeled rect. Extends the furniture kind def so it carries the same
// footprint/height/flag metadata (label, w/h/ht, seat, activity, surface, …).
export type RecipeShape = 'box' | 'cylinder' | 'sphere' | 'cone';

export interface RecipePrimitive {
  shape: RecipeShape;
  // mm. box: [w, ht, d]; cylinder: [rTop, rBot, ht]; sphere: [r, _, _];
  // cone: [r, ht, _].
  size: [number, number, number];
  // local mm; origin = piece center at floor level, +Z = front side.
  pos: [number, number, number];
  rot?: [number, number, number];   // deg XYZ
  color?: string;                    // hex
}

export interface ObjectRecipe extends FurnitureKindDef {
  id: string;
  primitives: RecipePrimitive[];
}

export interface Furniture {
  id: string;
  x: number; y: number;
  w: number; h: number;
  label?: string;
  kind?: FurnitureKind;
  rotation?: number;  // degrees, screen-CW (matches motion sensor heading convention); default 0
  elevation?: number; // mm the piece's base sits above the floor (upper stair
                      // flights, items on counters, wall-hung units); default 0
  color?: string;     // hex override of the kind's default tint; undefined = use def color
  locked?: boolean;   // canvas move/resize/rotate/delete disabled
  entity_id?: string | null;  // HA binding for appliances / TV (media_player etc.)
  customKindId?: string;      // ObjectRecipe reference (Store.customObjects); `kind` stays as fallback
  mountOnId?: string | null;  // host surface id set by auto-snap; bookkeeping only, NOT live parenting
  sharedBedCovers?: boolean;  // bed only: two-in-bed shared-covers effect (default/undefined = on).
                              // false → occupants lie side by side, no blanket lump.
}

export type LightIconKind =
  | 'bulb'      // ceiling sphere (default)
  | 'spot'      // downlight cone
  | 'pendant'   // sphere on a stem
  | 'sconce'    // wall-mounted half-sphere
  | 'strip'     // long thin LED bar
  | 'fireplace' // hearth with flickering warm glow
  | 'lamp'      // floor/table lamp w/ shade
  | 'bowl'      // open-top hemisphere (uplight)
  | 'tiered'    // stacked discs of decreasing radius
  | 'round'     // flat round panel on ceiling
  | 'recessed'  // small embedded ceiling can
  | 'jar'       // mason-jar cylinder + dome
  | 'oval'      // ellipsoid (squashed sphere)
  | 'fan'       // ceiling fan, no light (blades spin with the fan entity)
  | 'fan_light' // ceiling fan + center light globe
  | 'string'    // LED string: sagging run of small glowing orbs
  | 'under_cabinet'   // slim LED channel for mounting under cabinets/counters
  | 'wall_sconce'     // wall-mounted up/down cylinder washer
  | 'step';           // small louvered step light embedded low in a wall

export interface Light {
  id: string;
  x: number; y: number;
  entity_id: string | null;
  label?: string;
  // Visual properties (panel rendering only — not HA state).
  height?: number;     // mm above floor; default 2500 (ceiling)
  radius?: number;     // mm; pool of light shown on floor; default 900
  intensity?: number;  // 0..2 multiplier on top of HA brightness; default 1
  iconKind?: LightIconKind;
  rotation?: number;   // degrees, screen-CW; orients directional kinds (fireplace/strip/sconce/string)
  length?: number;     // mm, for strip/string kinds; default 2000
  fanEntity?: string | null;  // fan.* entity driving blade spin (fan kinds); falls back to entity_id
  locked?: boolean;    // canvas move/delete disabled (click-to-toggle still works)
}

export interface SwitchFixture {
  id: string;
  x: number; y: number;
  entity_id: string | null;
  label?: string;
  height?: number;     // mm above floor; default 1200
  rotation?: number;   // degrees, 0 = +Y world (CW on screen); default 0
  size?: number;       // plate extent mm (2D marker + 3D body); default 320
  labelPos?: 'bottom' | 'top' | 'left' | 'right' | 'hide';  // 2D label placement; default bottom
  locked?: boolean;    // canvas move/delete disabled (click-to-toggle still works)
}

// Avatar (humanoid rig) variant for a 3D target. `random` resolves per-target
// to a concrete kind by a stable hash of the target key, so a given person keeps
// their look for its lifetime (see resolveAvatar in three-renderer.ts).
export type AvatarKind =
  | 'adult' | 'child' | 'robot' | 'alien' | 'professional'
  | 'hacker' | 'movie_star' | 'ninja' | 'cyborg' | 'ninja_cyborg' | 'athlete'
  | 'teddy_bear' | 'cartoon_mouse' | 'cartoon_dog' | 'cartoon_duck'
  | 'cowboy' | 'magician' | 'farmer' | 'tech_expert' | 'supermodel'
  | 'wise_oracle' | 'astronaut'
  // Quadruped pet rigs (own builder + trot/sit/curl animation branch — see
  // three-renderer). A DioramaPerson with `isPet` and no explicit avatarKind
  // defaults to 'cat'. Kept OUT of the 'random' human fallback pool.
  | 'cat' | 'dog';

// A person (or pet) in the household. The shared identity concept for the
// "World Outside" arc: BLE trilateration and GPS both resolve to a person;
// rendering resolves a person to an avatar. Stored in Store.people.
export interface DioramaPerson {
  id: string;
  name: string;
  color?: string;              // chip / label / target tint
  avatarKind?: AvatarKind;     // custom avatar from the 22-model list (else fallback pool)
  isPet?: boolean;             // pets are BLE tags (iBeacon on collar) — quadruped rig in a later phase
  haPersonId?: string;         // person.* entity (GPS identity; survives phone swaps)
  bermudaDeviceId?: string;    // HA device id of the Bermuda tracked BLE device
  gpsTrackerId?: string;       // explicit device_tracker.* override (else via person entity)
}

// A BLE scanner (ESPHome/Shelly Bluetooth proxy) placed on the plan. Rendered
// as a small antenna puck; the scanner-MAC ↔ fixture match runs through the
// bound HA device's registry `connections`. Trilateration (B2) reads the plan
// positions of these to solve BLE person positions. Visibility rides the
// `sensors` layer (same as mmWave).
export interface BleProxy {
  id: string;
  name: string;
  x: number; y: number;
  height?: number;           // mm above floor for the 3D puck; default 2400
  haDeviceId?: string | null; // bound physical proxy device (device registry id)
  locked?: boolean;          // canvas move/delete disabled
  hidden?: boolean;          // per-fixture hide (in addition to the sensors layer)
}

export interface Sensor {
  id: string;
  x: number; y: number;
  heading: number; // degrees, 0 = +Y_world, increasing clockwise on screen
  fov: number;     // degrees
  range: number;   // mm
  label: string;
  deviceSlug: string | null;
  locked?: boolean;   // canvas move/rotate/delete disabled
  color?: string;  // hex; tints all targets seen by this sensor in 2D + 3D
  avatarKind?: AvatarKind | 'random';  // LEGACY single-pick (kept for back-compat reads; new UI writes avatarKinds)
  avatarKinds?: AvatarKind[];          // pool of rig variants; each target stably hash-picks one. Empty/absent → adult
  // Last-known-good zone vertices. Persisted so a reload paints zones from
  // store immediately, before HA's first state push completes — protects
  // against the case where firmware re-publishes partial / zeroed values
  // during reconnect and the panel briefly sees "no zones".
  zoneCache?: {
    inclusion: Vec2[][];
    filter: Vec2[][];
  };
}

export interface Door {
  id: string;
  x: number; y: number;        // hinge point in world mm
  w: number;                   // panel length in mm (default 800)
  rotation: number;            // panel direction (closed) in degrees, screen-CW; 0 = panel along +X world
  entity_id: string | null;    // binary_sensor or any entity; "on" = open
  label?: string;
  hinge?: 'right' | 'left';    // which side the hinge sits on. Determines swing direction.
                               // 'right' (default) = swings CCW on screen; 'left' = swings CW.
  locked?: boolean;            // canvas move/rotate/delete disabled
}

export interface Window {
  id: string;
  x: number; y: number;        // pane center in world mm
  w: number;                   // pane length along wall in mm (default 1000)
  rotation: number;            // wall axis direction in degrees, screen-CW; 0 = pane along +X world
  entity_id: string | null;    // binary_sensor; "on" = open
  label?: string;
  locked?: boolean;            // canvas move/rotate/delete disabled
}

// Simple motion sensor (binary on/off PIR or microwave). Coverage is rendered
// as a wedge and highlights when the bound binary_sensor entity is `on`.
export interface MotionSensor {
  id: string;
  x: number; y: number;
  heading: number; // 0 = +Y_world, CW on screen. fov:360 = omnidirectional.
  fov: number;     // degrees
  range: number;   // mm
  label: string;
  entity_id: string | null;  // HA binary_sensor entity
  color?: string;            // hex; default '#ba68c8'
  intensity?: number;        // 0..2 multiplier on highlight fill/glow; default 1
  avatar?: boolean;          // 3D: project a wandering AI person while presence is on; default off
  avatarKind?: AvatarKind | 'random';  // LEGACY single-pick (kept for back-compat reads; new UI writes avatarKinds)
  avatarKinds?: AvatarKind[];          // pool of rig variants for the projected AI avatar
  locked?: boolean;          // canvas move/rotate/delete disabled
}

// Environmental sensor fixture (temperature, humidity, CO₂, CO, PM, VOC,
// pressure, illuminance, …). Bound to any HA sensor.* entity; shows the live
// value in 2D and 3D. `kind` is normally derived from the entity's
// device_class (see envKindOf in geometry.ts) but can be overridden.
export type EnvKind =
  | 'temperature' | 'humidity' | 'co2' | 'co' | 'pm' | 'voc'
  | 'pressure' | 'illuminance' | 'generic';

export interface EnvSensor {
  id: string;
  x: number; y: number;
  entity_id: string | null;
  label?: string;
  kind?: EnvKind;   // manual override; default derived from device_class
  height?: number;  // mm above floor for the 3D body; default 1500
  scale?: number;   // display size multiplier for 2D chip + 3D label (0.4..4, default 1)
  locked?: boolean; // canvas move/resize/delete disabled
}

export interface Zone {
  name: string;
  vertices: Vec2[];   // sensor-local mm
  enabled: boolean;
  occupied: boolean;
  targetCount?: number;
}

export interface ObjectHalo {
  name: string;
  x: number; y: number; // sensor-local mm
  radius: number;       // mm
  icon: string;
  enabled: boolean;
  occupied: boolean;
}

export interface BgImage {
  dataUrl: string;
  x: number; y: number;  // world center, mm
  w: number; h: number;  // mm
  rotation: number;      // degrees, +CW on screen
  opacity: number;       // 0..1
  visible: boolean;
  locked: boolean;
}

// Imported 3D model metadata (e.g. Sweet Home 3D OBJ export). The OBJ/MTL
// text itself lives in IndexedDB (multi-MB; too big for HA user_data) keyed
// by floor id — this struct only carries placement + a rev counter so the
// renderer knows when to reload.
export interface Model3D {
  name: string;       // original filename, display only
  rev: number;        // bump on re-import → renderer reloads from IDB
  scale: number;      // mm per OBJ unit (Sweet Home 3D exports cm → 10)
  x: number;          // world-mm offset of the model origin
  y: number;
  rotation: number;   // degrees screen-CW around origin
  opacity: number;    // 0..1
  visible: boolean;
}

// Global 3D scene appearance (per store, not per floor).
export type ScenePreset = 'day' | 'dusk' | 'night';
export type FloorTexKind = 'none' | 'wood' | 'tile' | 'concrete';
// Per-floor appearance overrides — any field set here wins over the global
// Scene3D value for that floor only.
export interface FloorLook3D {
  floorColor?: string;
  floorTex?: FloorTexKind;
  wallColor?: string;
}

export interface Scene3D {
  preset: ScenePreset;       // lighting rig preset; default 'night' (manual mode)
  lightMode?: 'manual' | 'clock' | 'lux';  // clock = follow sun/time of day; lux = follow luxEntity
  luxEntity?: string | null; // illuminance sensor.* entity driving 'lux' mode
  floorColor?: string;       // hex; default '#101820'
  floorTex?: FloorTexKind;   // procedural texture overlay; default 'none'
  wallColor?: string;        // hex; default '#bbbbbb'
  glassHouse?: boolean;      // render every OTHER floor as a translucent shell stacked at its story height
  wallCutaway?: boolean;     // fade walls between the camera and the room (Sims dollhouse); default ON (opt-out)
  autoFollow?: boolean;      // camera auto-frames active people (eases; manual orbit pauses it 6 s); default off
  plumbobs?: boolean;        // show the spinning Sims plumbob diamonds above targets; default ON (opt-out)
}

// A named room. No polygon is persisted — the room IS whichever closed wall
// loop currently contains `anchor`, re-resolved each frame (see
// resolveRoomForPoint in geometry.ts). This keeps room identity robust against
// wall edits: move / reshape the walls and the label follows the loop.
export interface Room {
  id: string;
  name: string;
  anchor: Vec2;   // world-mm point that pins the room to a wall loop
}

export interface Floor {
  id: string;
  name: string;
  w: number; d: number;
  walls: Wall[];
  furniture: Furniture[];
  lights: Light[];
  switches: SwitchFixture[];
  sensors: Sensor[];
  motionSensors: MotionSensor[];
  envSensors: EnvSensor[];   // older persisted stores lack it — repairFloor backfills
  look3d?: FloorLook3D | null;  // per-floor overrides of the global scene3d colors
  doors: Door[];
  windows: Window[];
  bg: BgImage | null;
  model3d?: Model3D | null;
  rooms?: Room[];   // named rooms (anchor → live wall loop); repairFloor backfills []
  bleProxies?: BleProxy[];  // BLE scanner fixtures; repairFloor backfills []
}

// Weather source + display config (the "World Outside" arc, Feature W). All
// three sources normalize to a runtime WeatherNow (see src/weather.ts). Stored
// whole in Store.weather; effects3d / affectLighting persist now but are only
// consumed in phase W2 (3D effects + lighting modifier).
export interface WeatherConfig {
  source: 'entity' | 'sensors' | 'openmeteo';
  entityId?: string;                      // weather.* (preferred when it exists)
  sensors?: { precip?: string; windSpeed?: string; temp?: string; lightning?: string };
  zip?: string; lat?: number; lon?: number; placeLabel?: string;  // Open-Meteo location (zip geocoded → lat/lon cached)
  chip?: boolean;          // default true — corner display, 2D + 3D
  effects3d?: boolean;     // default true — consumed in W2
  affectLighting?: boolean;// default true — cloudy/precip dims the day preset; consumed in W2
}

// ── Geo reference (the "World Outside" arc, Feature G) ────────────────────
// Landmarks are placed on the plan (world mm) and calibrated to a real-world
// lat/lon by sampling a device_tracker while standing at the spot. The
// lat/lon↔plan transform (src/geo.ts) is fit from the calibrated landmarks;
// GPS device pins (G2) ride it. Landmarks are STORE-level (property-wide,
// span every floor), NOT per-floor.
export interface GeoLandmark {
  id: string; name: string;
  x: number; y: number;        // world mm on the plan (click-placed)
  lat?: number; lon?: number;  // filled by calibration; absent = placed but uncalibrated
  accuracy?: number;           // median gps_accuracy of the winning samples (m)
  sampleCount?: number;        // usable samples the median was taken over
  sampledAt?: string;          // ISO timestamp of the calibration
  hidden?: boolean;            // per-landmark hide (plus the whole `geo` layer toggle)
}

export interface GeoConfig {
  landmarks: GeoLandmark[];
  northDeg?: number;           // compass bearing (deg CW from true north) of plan +Y;
                               // used only when exactly 1 calibrated landmark. Default 0
                               // → plan +Y faces true north.
  boundaryM?: number;          // GPS render boundary beyond floor bbox (m); default 30 (G2)
  accuracyGateM?: number;      // calibration sample filter — drop samples worse than this
                               // gps_accuracy (m); default 30
}

export interface Store {
  v: number;
  floors: Floor[];
  currentFloorId: string;
  activeSensorId: string | null;
  coverage: boolean;
  imperial: boolean;
  showDetails: boolean;
  useRawTargets: boolean;
  showMotionZones?: boolean;  // default true; gates motion-cone rendering in 2D + 3D
  scene3d?: Scene3D;          // 3D appearance settings
  views3d?: SavedView3D[];    // user-saved 3D camera views
  layers2d?: Layers2D;        // active 2D layer visibility (undefined = everything on)
  layerPresets2d?: Layer2DPreset[];  // user-saved 2D layer presets
  customObjects?: ObjectRecipe[];    // user-authored object recipes
  people?: DioramaPerson[];          // household identity registry (BLE / GPS resolve to a person)
  bleShowUnknown?: boolean;          // show BLE devices not mapped to a person (absent = true); consumed in B2
  weather?: WeatherConfig;           // weather source + chip config (Feature W)
  geo?: GeoConfig;                   // landmarks + lat/lon↔plan calibration (Feature G)
}

// Saved 3D camera pose (scene coords, mm — floor-centered frame).
export interface SavedView3D {
  id: string;
  name: string;
  pos: [number, number, number];
  target: [number, number, number];
}

// 2D layer visibility flags. All default true except `activity`, so an
// absent/partial object renders like the classic full view.
export interface Layers2D {
  bg?: boolean;
  walls?: boolean;      // wall bodies (2D strokes + 3D meshes); doors/windows stay
  labels?: boolean;     // room-name labels (2D text + 3D billboards)
  furniture?: boolean;
  lights?: boolean;     // light + switch fixture markers
  sensors?: boolean;    // mmWave bodies + coverage wedges
  motion?: boolean;     // motion sensor bodies + cones
  env?: boolean;
  zones?: boolean;      // LD2450 zone polys + halos
  targets?: boolean;    // live target dots
  activity?: boolean;   // default OFF: glow pools for lights that are ON + active motion
  geo?: boolean;        // geo landmark pins (+ GPS device pins in G2); 2D-only this phase
}

export interface Layer2DPreset {
  id: string;
  name: string;
  layers: Layers2D;
}

// Per-sensor live state held in the running app (not persisted).
export interface ZonesLive {
  inclusion: Zone[];
  filter: Zone[];
}

export interface LerpSlot {
  cx: number; cy: number; // current (eased) position, sensor-local mm
  tx: number; ty: number; // target (raw HA) position
  vx: number; vy: number; // spring velocity (mm/s) — keeps motion continuous between HA pushes
  active: boolean;
}

// HA entity state envelope (matches HA's WS shape closely).
export interface HassState {
  state: string;
  attributes: Record<string, unknown>;
  entity_id: string;
  last_updated?: string;  // ISO timestamp; present on live HA states (used for GPS staleness)
  last_changed?: string;
}

export type ConnStatus = 'connected' | 'disconnected' | 'error' | 'auth_invalid';

// Discovery result for one bound LD2450 device.
export interface DiscoveredDevice {
  devicePrefix: string;
  targets: { x_id: string|null; y_id: string|null; speed_id: string|null;
             angle_id: string|null; resolution_id: string|null }[];
  targetActive: (string|null)[];
  avgX: (string|null)[];
  avgY: (string|null)[];
  targetCount: string|null;
  zoneTargetCount: (string|null)[];
  zoneStillCount: (string|null)[];
  zoneMovingCount: (string|null)[];
  ghostbuster: string|null;
  multiTarget: string|null;
  upsideDown: string|null;
  sensorHeight: string|null;
  mountAngle: string|null;
  procTime: string|null;
  procWarn: string|null;
  hasTarget: string|null;
  haloOccupied: (string|null)[];
  inclusionZoneSlugs: string[];
  filterZoneSlugs: string[];
  objectSlugs: string[];
}
