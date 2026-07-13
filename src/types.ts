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
  // outdoor
  | 'trash_bin' | 'recycle_bin'   // wheeled curbside bins; entity 'on'/'full' = full
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
  localState?: string;        // local control when UNBOUND ('on'/'off'/'playing'). Inert once
                              // entity_id is set (effectiveState prefers the bound entity); kept
                              // so unbinding returns to the last local state. See Planner.effectiveState.
  customKindId?: string;      // ObjectRecipe reference (Store.customObjects); `kind` stays as fallback
  doorEntity?: string | null; // fridge only: binary_sensor, 'on' = door open (drives the swung-open 3D door
                              // panel + a 2D open-door wedge). Item-level optional; shown in the UI only for
                              // fridge kinds. Separate from entity_id (which is the appliance's on/off binding).
  mountOnId?: string | null;  // host surface id set by auto-snap; bookkeeping only, NOT live parenting
  powerEntity?: string | null; // appliance/TV: sensor.* (device_class power, W) driving the in-use
                              // glow/LED intensity (#8). VISUAL ONLY — never feeds effectiveState /
                              // activities. An unbound appliance reading > 10 W renders as in-use.
  sharedBedCovers?: boolean;  // bed only: two-in-bed shared-covers effect (default/undefined = on).
                              // false → occupants lie side by side, no blanket lump.
  tempEntity?: string | null; // stove/oven (also fridge): sensor.* temperature reading. Shown as a
                              // small N° chip (2D) + camera-facing sprite (3D). Display only.
  doorOpen?: boolean;         // stove/oven only: persistent oven-door open flag, toggled by clicking
                              // the piece (2D/3D). ORed with the avatar-proximity / localState door open.
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
  | 'step'            // small louvered step light embedded low in a wall
  | 'flood';          // wall/eave-mount floodlight: twin angled heads, wide floor pool

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
  localState?: string; // local control when UNBOUND ('on'/'off'); inert once bound. See Planner.effectiveState.
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
  localState?: string; // local control when UNBOUND ('on'/'off'); inert once bound. See Planner.effectiveState.
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

// Alarm keypad fixture (Feature 3). Wall-mounted plate bound to an
// alarm_control_panel.* entity; shows the arm state as a colored screen band in
// 2D + 3D. Snaps flush to the nearest wall like a switch (no ganging). Clicking
// opens the alarm modal — read-only unless allowControl is set + it's bound.
export interface AlarmPanel {
  id: string;
  x: number; y: number;
  rotation?: number;          // deg, wall-plate convention like switches (0 = +Y world)
  height?: number;            // mm above floor; default 1400
  entity_id: string | null;   // alarm_control_panel.*
  allowControl?: boolean;     // permit arm/disarm from the panel (default false = view only)
  localState?: string;        // local control when UNBOUND ('disarmed'|'armed_home'|'armed_away'); inert once bound
  label?: string;
  locked?: boolean;           // canvas move/rotate/delete disabled (click still works)
}

// Smoke / CO safety detector fixture. Ceiling-mounted (no wall snap; free
// placement like a motion sensor). Bound to a binary_sensor.* whose 'on' state
// means ALARM (device_class smoke / carbon_monoxide). Unbound detectors carry a
// localState for a manual test trigger ('on' = alarming; inert once bound). 2D +
// 3D render a small detector disc that erupts into pulsing rings + a colored
// halo while alarming (red for smoke, amber for CO). Rides the sensors layer.
// smoke = red ceiling beacon, co = amber ceiling beacon, gas = amber-green
// ceiling beacon (device_class gas), leak = FLOOR-mounted moisture detector that
// spreads a blue puddle decal when alarming (not a beacon).
export type SafetyKind = 'smoke' | 'co' | 'gas' | 'leak';

export interface SafetySensor {
  id: string;
  x: number; y: number;
  kind: SafetyKind;           // smoke/co/gas = ceiling beacon; leak = floor puck + puddle
  entity_id: string | null;   // binary_sensor.*; 'on' = ALARM
  localState?: string;        // unbound manual trigger: 'on' = alarming; inert once bound
  label?: string;
  locked?: boolean;
}

// Robot fixture (Feature: robot vacuum / lawn mower). The (x,y) is the DOCK /
// charging base position (world mm); the live robot roams away from it and
// returns to dock. Bound to a vacuum.* (VacuumActivity: cleaning/docked/idle/
// paused/returning/error) or lawn_mower.* (LawnMowerActivity: mowing/docked/
// paused/returning/error) entity. Mowers can additionally bind a GPS source: a
// device_tracker with latitude/longitude attrs (+ optional `direction` heading
// attr, e.g. Mammotion `<name>_gps`) OR a separate lat/lon sensor pair. Live
// position is computed by Planner.stepRobots (runtime-only) and read by BOTH the
// 2D canvas and the 3D renderer. Rides the `sensors` layer.
export interface RobotFixture {
  id: string;
  x: number; y: number;          // DOCK / charging base position (world mm)
  kind: 'vacuum' | 'mower';
  entity_id: string | null;      // vacuum.* or lawn_mower.*
  trackerEntity?: string | null; // mower: device_tracker with latitude/longitude (+ optional `direction` heading)
  latEntity?: string | null;     // mower alt-source: separate lat sensor (degrees)
  lonEntity?: string | null;     //                  + lon sensor (degrees)
  // Vacuum LIVE position (#6): a Roborock map camera/image/sensor entity carrying
  // a `vacuum_position` attribute (x/y/angle in the robot's internal map units).
  // Bound → the controller drives the puck from the real position (see
  // Planner._vacuumLive / vacuumRawToWorld); unbound/parse-fail → simulated roam.
  posEntity?: string | null;
  posScale?: number;             // mm per map unit (default 1)
  posOffsetX?: number;           // world-mm offset (default 0)
  posOffsetY?: number;
  posFlipY?: boolean;            // mirror the map Y axis
  posRotDeg?: number;            // map→plan rotation (0/90/180/270 typical, default 0)
  label?: string;
  localState?: string;           // unbound manual pause: 'paused' (else demo runs autonomously). Inert once bound.
  locked?: boolean;              // canvas move/delete disabled (click-to-toggle still works)
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
  plumbobColor?: string;  // hex; color of the spinning Sims plumbob above targets seen by this
                          // sensor (per-sensor attribution). Absent = the iconic Sims green (0x2ee56a).
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

export type DoorKind = 'swing' | 'garage';

export interface Door {
  id: string;
  x: number; y: number;        // hinge point in world mm
  w: number;                   // panel length in mm (default 800; garage typically 2400+)
  rotation: number;            // panel direction (closed) in degrees, screen-CW; 0 = panel along +X world
  kind?: DoorKind;             // 'swing' (default, hinged panel) | 'garage' (segmented overhead door)
  entity_id: string | null;    // binary_sensor ("on" = open) OR cover.* ('open'/'closed', current_position for partial)
  label?: string;
  localState?: string;         // local control when UNBOUND ('on'=open/'off'); inert once bound. See Planner.effectiveState.
  lockEntity?: string | null;  // lock.* entity secondary binding. 'locked' = amber/red padlock,
                               // 'unlocked' = green open outline, unavailable/absent = grey. Clicking the
                               // deadbolt (3D) / padlock (2D) toggles lock.lock ↔ lock.unlock.
  lockLocalState?: 'locked' | 'unlocked'; // local control when UNBOUND (no lockEntity): clicking the
                               // deadbolt/padlock flips this. Inert once lockEntity is bound. Mirrors localState idiom.
  doorbellEntity?: string | null; // event.* (device_class doorbell) / binary_sensor.* / button.* — a state-string
                               // CHANGE fires a transient ring pulse (Planner.doorbellRings). Display only, no toggle.
  hinge?: 'right' | 'left';    // which side the hinge sits on. Determines swing direction.
                               // 'right' (default) = swings CCW on screen; 'left' = swings CW.
  locked?: boolean;            // canvas move/rotate/delete disabled
}

// Window glazing style. `single` reproduces the legacy one-pane look.
export type WindowKind = 'single' | 'double_hung' | 'casement_pair' | 'sliding' | 'picture';

export interface Window {
  id: string;
  x: number; y: number;        // pane center in world mm
  w: number;                   // pane length along wall in mm (default 1000)
  rotation: number;            // wall axis direction in degrees, screen-CW; 0 = pane along +X world
  entity_id: string | null;    // binary_sensor; "on" = open
  label?: string;
  localState?: string;         // local control when UNBOUND ('on'=open/'off'); inert once bound. See Planner.effectiveState.
  coverEntity?: string | null; // cover.* (blind/shade/curtain). doorOpenFraction → coverFraction: 0 = fully CLOSED
                               // (shade DOWN, HA position 0), 1 = fully open (shade UP, HA position 100). Display only.
  kind?: WindowKind;           // glazing style; default 'single' (legacy look)
  sill?: number;               // mm above floor to the bottom of the glass; default 900
  height?: number;             // mm of glass height (header derives as sill+height); default 800
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
  demo?: boolean;            // 3D: project the AI avatar ALWAYS (no entity binding / state
                             //     required) — a display/demo presence. Persisted item-level.
  avatarKind?: AvatarKind | 'random';  // LEGACY single-pick (kept for back-compat reads; new UI writes avatarKinds)
  avatarKinds?: AvatarKind[];          // pool of rig variants for the projected AI avatar
  plumbobColor?: string;     // hex; color of the plumbob above this sensor's AI/demo avatar. Absent = Sims green.
  locked?: boolean;          // canvas move/rotate/delete disabled
}

// Environmental sensor fixture (temperature, humidity, CO₂, CO, PM, VOC,
// pressure, illuminance, …). Bound to any HA sensor.* entity; shows the live
// value in 2D and 3D. `kind` is normally derived from the entity's
// device_class (see envKindOf in geometry.ts) but can be overridden.
export type EnvKind =
  | 'temperature' | 'humidity' | 'co2' | 'co' | 'pm' | 'voc'
  | 'pressure' | 'illuminance'
  | 'radon' | 'sound' | 'no2' | 'o3' | 'aqi'
  | 'generic';

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
  cinematicOrbit?: boolean;  // slowly orbit the camera around the active avatars for visual interest
                             // (~0.08 rad/s at the current zoom; follows auto-follow's framing when both on); default off
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
  occupancyEntity?: string | null;  // binary_sensor.* (Frigate zone / FP2 / any occupancy);
                                    // 'on' → the room's wall-loop fills with a warm glow (#1).
}

// FP2-style presence zone (roadmap #5). A user-drawn polygon (world-mm) bound to
// an occupancy binary_sensor (Aqara FP2 per-zone sensor, Frigate zone, any
// presence/motion/occupancy binary_sensor). When bound + ON the polygon fills
// with a glow — per-region presence truth without positional radar. Zone SHAPES
// aren't exposed by HA (FP2 hides them), so the user draws the polygon here and
// binds it. Rides the `zones` layer (2D + 3D). Per-floor (Floor.presenceZones).
export interface PresenceZone {
  id: string;
  name?: string;
  points: Vec2[];              // world-mm polygon (≥3 verts; UI caps at 12)
  entity_id: string | null;    // binary_sensor (occupancy/motion/presence); 'on' = occupied
  color?: string;              // hex; default '#26c6da'
  hidden?: boolean;            // per-zone hide (plus the whole zones layer toggle)
  locked?: boolean;            // canvas vertex-drag / delete disabled
}

// Camera fixture (roadmap #10). Wall/eave-mounted camera with a translucent FOV
// frustum wedge (2D + 3D) + a periodically refreshed snapshot thumbnail in the
// sidebar. Bound to a camera.* entity. Free placement; rotate via the standard
// rotate handle (rotation convention 0 = +Y world, like motion sensors). NO
// in-scene video/stream. Rides the `sensors` layer. Per-floor (Floor.cameras).
export interface CameraFixture {
  id: string;
  x: number; y: number;
  rotation?: number;    // deg, facing direction; 0 = +Y world (CW on screen), like motion sensors
  fov?: number;         // deg horizontal field of view; default 90
  range?: number;       // mm, wedge reach; default 6000
  height?: number;      // mm above floor for the 3D body; default 2200 (wall/eave mount)
  entity_id: string | null;   // camera.*
  alertEntity?: string | null;  // binary_sensor (motion/person/doorbell from the camera's
                              // integration); 'on' pulses the FOV wedge + pops a snapshot
                              // card (2D canvas + 3D sprite) with a ~6 s linger after off.
  label?: string;
  hidden?: boolean;
  locked?: boolean;     // canvas move/rotate/delete disabled
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
  alarmPanels?: AlarmPanel[];  // alarm keypad fixtures; repairFloor backfills []
  safetySensors?: SafetySensor[];  // smoke / CO detectors; repairFloor backfills []
  robots?: RobotFixture[];  // robot vacuum / mower fixtures; repairFloor backfills []
  presenceZones?: PresenceZone[];  // FP2-style occupancy zones; repairFloor backfills []
  cameras?: CameraFixture[];  // camera fixtures (FOV frustum + snapshot); repairFloor backfills []
  boundsLocked?: boolean;   // lock canvas-layout/floor-size editing (hides the edge handles)
  disabled?: boolean;       // hidden from the kiosk/view floor picker + glass-house stack + BLE
                            // floor solve; still editable in the sidebar — lets multiple test
                            // iterations coexist without cluttering the live views.
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
  effects3d?: boolean;     // default true — master kill-switch for the 3D effect GROUP
  affectLighting?: boolean;// default true — cloudy/precip dims the day preset
  // Per-effect toggles (W3). Absent key = the per-key default (see
  // weatherEffectEnabled in weather.ts): ON for precip/fog/lightning/wind/
  // clouds/sunPosition/puddles, OFF for frost/precipForecast. `sunPosition` is
  // a LIGHTING behavior (orients the sun light), NOT an effect-group member, so
  // it is gated only on its own key — never on effects3d.
  effects?: Partial<Record<WeatherEffectKey, boolean>>;
}

// One toggleable 3D weather visualization (W3). See weatherEffectEnabled.
export type WeatherEffectKey =
  | 'precip' | 'fog' | 'lightning' | 'wind' | 'clouds'
  | 'sunPosition' | 'frost' | 'puddles' | 'precipForecast';

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
  showEvents?: boolean;        // show nearby geo_location event pins (earthquakes, fires…);
                               // absent = ON. Runtime-derived pins (Planner.geoEventPins).
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
  bermudaEnabled?: boolean;          // Bermuda BLE tracking on/off (absent or true = enabled; false = neither displayed nor used)
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
  furniture?: boolean;  // non-appliance furniture (appliances ride their own key)
  appliances?: boolean; // appliance furniture (fridge/stove/tv/…, cat === 'appliance')
  lights?: boolean;     // light fixture markers
  switches?: boolean;   // switch fixture markers (split from lights)
  sensors?: boolean;    // mmWave bodies + coverage wedges
  motion?: boolean;     // motion sensor bodies + cones
  env?: boolean;
  zones?: boolean;      // LD2450 zone polys + halos
  targets?: boolean;    // live target dots
  activity?: boolean;   // default OFF: glow pools for lights that are ON + active motion
  geo?: boolean;        // geo landmark pins (+ GPS device pins in G2); 2D-only this phase
  weatherFx?: boolean;  // 3D outdoor weather effects (rain/snow/fog/lightning/wind); default on (W2)
  nameLabels?: boolean; // name labels above confident rigs/dots (fused mmWave + identified BLE); default on (B3)
  battery?: boolean;    // low-battery warning badges on bound fixtures (2D); default on
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
