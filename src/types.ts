// Domain types. All length units are mm unless noted.

// Type-only import (erased at compile time — no runtime cycle with geometry.ts,
// which imports the value-side FURNITURE_KINDS from here-adjacent types).
import type { FurnitureKindDef } from './geometry.js';
// Shared value-display rule engine + format config (Display & Controls arc).
// Type-only — value-rules.ts is pure and imports nothing back.
import type { ValueRule, InfoCardFormat } from './value-rules.js';
// Type-only — flights.ts is pure + zero-import (shared by the app graph AND the
// lazy renderer chunk), so mirroring its glow-rule shape here costs nothing at
// runtime and keeps the schema's single home in that module.
import type { FlightGlowRule } from './flights.js';
export type { FlightGlowRule, FlightGlowCriteria, FlightGlowPattern } from './flights.js';

export interface Vec2 { x: number; y: number; }

export type WallKind = 'full' | 'half' | 'railing' | 'invisible'
                     | 'fence_picket' | 'fence_privacy' | 'fence_chainlink' | 'hedge';

export interface Wall {
  id: string;
  points: Vec2[];
  kind?: WallKind;   // full (default 9 ft) | half pony wall | 3 ft banister | invisible
  locked?: boolean;  // canvas move/vertex-drag/delete disabled
  dimension?: boolean; // custom dimension-mode selection flag (Feature B); item-level, no repairFloor
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
  | 'ramp'          // accessible slope — a full stairs-family member (STAIRS_KINDS)
  | 'coffee_table' | 'tv_stand' | 'dresser' | 'nightstand' | 'wardrobe'
  | 'ottoman' | 'stool' | 'plant' | 'counter' | 'island' | 'cabinet'
  // appliances
  | 'fridge' | 'stove' | 'dishwasher' | 'washer' | 'dryer' | 'microwave' | 'tv'
  | 'wall_tv'       // wall-mounted flat TV, no stand
  | 'kitchen_sink'  // stainless double basin embedded in a counter
  | 'coffee_maker' | 'toaster'
  // climate / airflow appliances (cat 'appliance', except towel_warmer = bathroom).
  // All bindable via the generic entity_id (climate/fan/switch). Bladed fans
  // (floor_fan/retro_fan/modern_fan) spin + optionally oscillate; ACs/heaters vent.
  | 'window_ac' | 'mini_split' | 'portable_ac'
  | 'floor_fan' | 'retro_fan' | 'modern_fan' | 'tower_fan' | 'bladeless_fan'
  | 'space_heater' | 'wall_heater'
  // bathroom
  | 'toilet' | 'sink' | 'sink_vanity' | 'pedestal_sink' | 'utility_sink' | 'bathtub' | 'shower'
  | 'towel_warmer'   // ladder-rack radiator; bars glow warm (eased) while running
  // outdoor
  | 'trash_bin' | 'recycle_bin'   // wheeled curbside bins; entity 'on'/'full' = full
  | 'tree' | 'pine_tree' | 'bush' | 'flower_bed' | 'bird_bath'
  // more tree species — every tree kind honours the per-piece `ht` height
  // override (see isTreeKind / treeHeightMm in geometry.ts)
  | 'oak_tree' | 'birch_tree' | 'palm_tree' | 'willow_tree' | 'spruce_tree'
  | 'fountain' | 'swingset' | 'lawn_chair' | 'picnic_table'
  | 'rock_cluster'  // decorative boulder cluster (2–4 overlapping grey shapes); blocks nav
  | 'mailbox'       // post-mounted mail/parcel box; mailCount badge + raised flag
  // vehicle / garage
  | 'car'           // stylized sedan silhouette; binary_sensor presence → ghost when away
  | 'ev_charger'    // wall-post EVSE pedestal; evCharger status → LED/port glow
  // fitness
  | 'exercise_equipment'
  // home theater — speakers/sub/center (cat 'theater'), recliners + riser (cat 'furniture')
  | 'speaker_tower'      // floorstanding tower; bindable media_player → driver pulse
  | 'speaker_bookshelf'  // compact, mountable onto shelves/consoles
  | 'subwoofer'          // squat cube, big front driver, slow deep pulse
  | 'center_channel'     // horizontal, mountable under/over a screen
  | 'theater_recliner'   // plush single recliner; watch_tv resolves from the room TV
  | 'recliner_row3'      // three-seat shared-arm recliner row (3 sit spots)
  | 'riser_platform'     // walkable tiered-seating deck; does NOT block nav
  // mechanical / utility plant (cat 'appliance'). Bindable via the generic
  // entity_id; each resolves a running state + a GLOW COLOR (heat red / cool
  // blue / fan white) through geometry.mechanicalRun — they are excluded from
  // the generic green in-use LED because the glow IS their state language.
  | 'water_heater'    // tank + flue; burner window glows red while heating
  | 'air_handler'     // sheet-metal cabinet; louver strip glows heat/cool/fan
  | 'floor_radiator'  // finned baseboard run; glows red while heating
  | 'wall_radiator'   // slim ribbed wall panel (elevation 200); red while heating
  | 'boiler'          // squat cylinder + gauge + pipe stubs; red burner glow
  | 'ac_condenser'    // outdoor cube; top fan spins + blue glow while cooling
  | 'heat_pump'       // outdoor slim cabinet; side fan + blue/red/white glow
  | 'sump_pump'       // sump barrel + riser pipe; water scrolls while running
  | 'recirc_pump'     // inline pump on a horizontal pipe run; water scrolls
  | 'printer_3d';     // open-frame FDM printer; head oscillates + print grows

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
  ht?: number;        // STAIRS FAMILY ONLY: per-piece RISE (mm) overriding the kind's
                      // storey-sized default, so a flight can bridge a short level change
                      // (a 200 mm patio step, a 950 mm sunken yard). Tread count follows
                      // rise AND depth (geometry.stairsTreadCount); absent / < 50 →
                      // the kind default, which keeps every untouched flight identical.
                      // Item-level → no repairFloor change. See stairsRiseMm.
  stairsOpen?: boolean; // STAIRS FAMILY ONLY (3D build only): render the piece FLOATING —
                      // open air underneath instead of a solid mass down to the base. Treads
                      // become ~60 mm slabs, the ramp a ~80 mm sloped slab, a landing a ~60 mm
                      // platform; every TOP surface is bit-identical to the solid build, so
                      // _groundYAt / _buildNav / _terrain / 2D / autofit are untouched. Absent
                      // = solid = the classic build. Item-level → no repairFloor change.
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
  moistureEntity?: string | null; // plant/flower_bed (or any tend_plant custom recipe): sensor.* soil
                              // moisture (device_class 'moisture', or a mislabeled 'humidity' probe), %.
                              // Below moistureThreshold → THIRSTY: 3D foliage droops + desaturates, 2D
                              // shows a 💧 chip. Display/animation-only — never feeds effectiveState.
  moistureThreshold?: number; // % below which the plant is "thirsty" (default 20, matching HA's plant
                              // integration min_moisture default). Per-fixture (species vary widely).
  plantDemoThirsty?: boolean; // UNBOUND plants only: manual "Test thirsty" toggle so the droop animation
                              // can be demoed without a real sensor (mirrors SafetySensor's Test button).
  jobStateEntity?: string | null; // appliance "job done" event source (event-focused thought bubbles):
                              // a sensor/binary_sensor to watch (Home Connect operation_state, a
                              // `running` binary_sensor, or a *_program_finished event sensor). When
                              // absent, job-capable kinds (dishwasher/washer/dryer) auto-watch their own
                              // entity_id. A running→terminal transition after a >=5 min run fires a
                              // Planner.householdEvent. Item-level optional; no repairFloor change.
  jobDoneValue?: string;      // state value that means "done" for jobStateEntity (default 'finished' when
                              // jobStateEntity is bound; ignored in the auto entity_id mode, where any
                              // non-running terminal counts). e.g. 'finished' (Home Connect), 'off'
                              // (running binary_sensor), 'confirmed' (program_finished event sensor).
  doorOpen?: boolean;         // stove/oven only: persistent oven-door open flag, toggled by clicking
                              // the piece (2D/3D). ORed with the avatar-proximity / localState door open.
  stairLinkId?: string;       // stairs-family only: an opaque id shared by EXACTLY TWO stairs-family
                              // pieces on TWO DIFFERENT floors, marking them as the same stairwell. NO
                              // role/offset — story order derives from Store.floors index (lower index =
                              // lower story), transits spawn/despawn at each linked piece's own coords.
                              // Drives cross-floor BLE rig handoff (Planner.floorTransits) + the 2D ▲/▼
                              // chip. A stairLinkId with no partner is inert. Item-level → no repairFloor.
  biasLight?: {               // tv/wall_tv only (home-theater arc): soft accent glow behind the screen.
    entityId?: string;        //   bound light.*/switch.* — glow shows while that entity is 'on'.
    color?: string;           //   hex; default warm white (~6500K). Absent entityId → AUTO: glow while the
  };                          //   TV itself is playing/on. 3D = emissive halo plane behind the panel; 2D = a
                              //   soft halo ring around the footprint. Item-level → no repairFloor change.
  evCharger?: {               // car / ev_charger kinds: EV charging status bindings (vendor-agnostic —
    statusEntity?: string;    //   design around the common shape, never one vendor's ids). statusEntity's
    powerEntity?: string;     //   state string maps defensively (charging/plugged/connected → charging;
  };                          //   full/completed → steady; error/fault → red; else idle). powerEntity (W)
                              //   feeds powerGlowScale. A charging charger within ~1500 mm of a car (or the
                              //   car's own binding) drives the car's charge indicator. Item-level → no repairFloor.
  mailCount?: {               // mailbox kind: mail/packages bindings. countEntity (numeric sensor, e.g.
    countEntity?: string;     //   Mail-and-Packages) > 0 → floating count badge + raised flag. flagEntity
    flagEntity?: string;      //   (binary_sensor mailbox-lid) 'on' → lid tilts open. Both optional; unbound /
  };                          //   zero = plain closed mailbox, flag down. Item-level → no repairFloor change.
  screenMode?: 'off' | 'now_playing' | 'news' | 'weather' | 'auto';  // tv/wall_tv only: what the screen
                              //   FACE shows when no media_player is presenting media (research doc §4.2).
                              //   'auto' (default when absent) = now-playing while a bound media_player plays,
                              //   else blank. 'news'/'weather' render a scrolling headline ticker / mini
                              //   weather card onto the screen plane while the TV is on + not playing media.
                              //   Item-level → no repairFloor change.
  newsEntity?: string | null; // tv/wall_tv 'news' screenMode: any sensor.*/event.* whose attributes carry a
                              //   headline-shaped payload (feedparser list / event.* single / template). Parsed
                              //   defensively by surfaces.parseHeadlines. Config-path in _isSlowEntity.
  oscillate?: boolean;        // bladed floor fans (floor_fan/retro_fan/modern_fan) only: while running, the
                              //   fan HEAD yaws in a slow ±45° sine sweep (blades keep spinning inside the
                              //   sweeping head). Item-level → no repairFloor change.
  printProgressEntity?: string | null; // printer_3d only: an OPTIONAL secondary sensor.* whose numeric state
                              //   (0–100) is the print progress driving the growing print on the bed. Only
                              //   needed when the piece's own entity_id is a switch/binary_sensor — a
                              //   numerically-stated primary binding already carries the progress.
                              //   Display/animation-only; never feeds effectiveState. Item-level → no
                              //   repairFloor change.
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
  | 'flood'           // wall/eave-mount floodlight: twin angled heads, wide floor pool
  | 'inground'        // recessed in-ground uplight: flush ring + lens, beams UP (no floor pool)
  | 'ground_spot'     // ground-mounted aimable spot: stake + head, aims via rotation + tilt
  | 'heatlamp'        // ceiling bathroom heat lamp: red bulb domes, forced warm-red glow + pool
  | 'exhaust'         // ceiling exhaust grille: spinning blades behind slats, no floor disc
  | 'exhaust_wall'    // wall-mount exhaust: round housing + louver shutter, wall-snaps flush, no disc
  | 'exhaust_light';  // ceiling exhaust + center light globe (fan_light precedent)

// Logical-state light binding (Display & Controls arc, batch DC-B). A light
// whose ON / color / flash derives from ANY entity's state through the shared
// value-rules engine instead of a light.* binding — "if sensor.oven_temp > 200
// show amber; > 300 flash red; else off". When set it takes precedence over
// entity_id/localState in Planner.effectiveState (the whole point is derived
// state). First-match-wins: the matched rule's `color` → ON in that color,
// `flash` → the light pulses; no match → OFF (or a dim `offColor` indicator).
export interface LightLogic {
  entityId: string;      // ANY entity whose raw state drives this light
  rules: ValueRule[];    // shared engine (src/value-rules.ts); first-match-wins
  offColor?: string;     // no rule matched → dim indicator in this color (absent = fully off)
}

export interface Light {
  id: string;
  x: number; y: number;
  entity_id: string | null;
  label?: string;
  logic?: LightLogic;  // derive ON/color/flash from a rule over ANY entity (overrides entity_id when set)
  // Visual properties (panel rendering only — not HA state).
  height?: number;     // mm above floor; default 2500 (ceiling)
  radius?: number;     // mm; pool of light shown on floor; default 900
  intensity?: number;  // 0..2 multiplier on top of HA brightness; default 1
  iconKind?: LightIconKind;
  rotation?: number;   // degrees, screen-CW; orients directional kinds (fireplace/strip/sconce/string/ground_spot azimuth)
  tilt?: number;       // degrees above horizon (ground_spot only); default 35, range 5..85. Low tilt = long throw.
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

// Avatar (rig) variant for a 3D target — now a persisted avatar id (see
// src/avatars.ts `AvatarId`). Legacy kinds keep their bare ids ('adult',
// 'ninja', 'cat'…); future pack members are '<packId>/<memberId>'. Widened from
// the old 24-value union to a string so packs can add ids without a store
// migration. `random` still resolves per-target to a concrete id by a stable
// hash of the target key (see resolveAvatar in avatars.ts). The core pack
// (avatars.ts) keeps the 24 legacy kinds working under their bare ids.
export type AvatarKind = string;

// Persisted per-avatar-pack config (keyed by pack id in Store.avatarPacks).
// Absent entry ⇒ pack defaults (core + base packs loaded+active, franchise
// packs loaded:false). `members` absent ⇒ all members active; present ⇒ subset.
// Shape mirrors avatars.ts `AvatarPackConfig` (kept structurally identical so
// planner can pass store.avatarPacks straight into setAvatarPacksConfig without
// types.ts importing avatars.ts — avoids the import cycle).
export interface AvatarPackConfig { loaded?: boolean; active?: boolean; members?: string[] }

// A person (or pet) in the household. The shared identity concept for the
// "World Outside" arc: BLE trilateration and GPS both resolve to a person;
// rendering resolves a person to an avatar. Stored in Store.people.
export interface DioramaPerson {
  id: string;
  name: string;
  color?: string;              // chip / label / target tint
  avatarKind?: AvatarKind;     // custom avatar from the 22-model list (else fallback pool)
  isPet?: boolean;             // pets are BLE tags (iBeacon on collar) — quadruped rig in a later phase
  allowCostumes?: boolean;     // situational outfit swaps for this person's rig; absent/true = on, false = off
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

// Wall-mounted calendar plaque (Feature: calendar-on-wall). A read-only wall-plate
// fixture bound to one or more calendar.* entities; shows today's date + the next
// few upcoming events as a compact plaque (2D chip + 3D wall box with a sprite
// texture). Snaps flush to the nearest wall like a switch / alarm panel (no
// ganging). Events are fetched by a Planner poll of calendar.get_events (NOT the
// state stream — the entity state only carries the single next event) and cached
// in Planner.calendarEvents. Rides the sensors layer (like alarm/BLE). See
// geometry.ts CALENDAR_DEFAULTS / snapCalendarToWall, surfaces.ts paintCalendarCanvas.
export interface CalendarPanel {
  id: string;
  x: number; y: number;
  rotation?: number;          // deg, wall-plate convention like switches/alarm (0 = +Y world)
  height?: number;            // mm above floor for the plaque center; default 1600 (picture height)
  calendarIds: string[];      // one or more calendar.* entities (chronological merge)
  label?: string;
  locked?: boolean;           // canvas move/rotate/delete disabled (click selects)
}

// Wall-mounted HVAC / thermostat control fixture, bound to a climate.* entity.
// Snaps flush to the nearest wall like a switch / alarm panel (no ganging).
// Clicking opens the thermostat control modal. The 2D plate shows the current +
// target temperature with a mode-colored band (heat amber/red, cool blue, …);
// the 3D unit adds a slatted wall vent that emits mode-colored airflow particles
// while the unit's hvac_action is actively heating / cooling / running the fan.
// Rides the sensors layer (like the alarm panel). See geometry.ts
// HVAC_MODE_COLORS / hvacActionColor / climateFeature / snapThermostatToWall.
export interface ThermostatFixture {
  id: string;
  x: number; y: number;
  rotation?: number;         // deg, wall-plate convention like switches/alarm (0 = +Y world)
  height?: number;           // mm above floor; default 1500 (adult eye level)
  entity_id: string | null;  // climate.*
  allowControl?: boolean;    // permit mode/setpoint changes from the modal (default ON)
  localState?: string;       // unbound synthetic hvac_mode ('off'|'heat'|'cool'|'fan_only'|…) for demo control
  localTemp?: number;        // unbound synthetic single setpoint (°C); inert once bound
  label?: string;
  locked?: boolean;          // canvas move/rotate/delete disabled (click still works)
}

// Water valve fixture (Phase 2b). A pipe-run body with a valve wheel/handle,
// placed freely on the floor (pipe run) with a rotation. Bindable to a valve.*
// entity (open/opening/closed/closing + optional current_position), a switch.*
// entity (irrigation-zone pattern: on = open), OR a binary_sensor.* (display
// only). State resolves through valveOpenness(st) (geometry.ts, mirrors
// doorOpenFraction). Clicking toggles: valve domain → open_valve/close_valve
// (picked by current state, never a blind toggle); switch → switch.toggle;
// binary_sensor → display-only; unbound → flip localState. Gated by
// allowControl (default on) + uiMode (view refuses, kiosk allowed). Rides the
// sensors layer. Per-floor (Floor.valves); repairFloor + defaultFloor backfill [].
export interface ValveFixture {
  id: string;
  x: number; y: number;
  rotation?: number;         // deg screen-CW; pipe-run direction; 0 = pipe along +Y world
  entity_id: string | null;  // valve.* | switch.* | binary_sensor.*
  allowControl?: boolean;    // permit open/close from the panel (default ON); false = display-only
  localState?: string;       // unbound local control ('on'=open / 'off'=closed); inert once bound
  label?: string;
  locked?: boolean;          // canvas move/rotate/delete disabled (click-to-toggle still works)
}

// Smart plug / outlet fixture (Phase 2b). A wall outlet plate with a plugged-in
// cord hint. Wall-snaps flush like a switch (no ganging) at outlet height
// (default 300 mm). Bindable to a switch.* / light.* entity (the plugged-in
// load); optional powerEntity (sensor.* W) scales the energized glow + shows a
// W readout chip. Toggle semantics mirror a switch exactly (bound → toggleEntity;
// unbound → flip localState), gated by allowControl (default on) + uiMode. Rides
// the switches layer. Per-floor (Floor.plugs); repairFloor + defaultFloor
// backfill [].
export interface PlugFixture {
  id: string;
  x: number; y: number;
  rotation?: number;         // deg, wall-plate convention (0 = +Y world), like switches
  height?: number;           // mm above floor; default 300 (outlet height)
  entity_id: string | null;  // switch.* | light.* (the outlet load)
  powerEntity?: string | null; // sensor.* (device_class power, W) — energized glow + W chip; VISUAL only
  allowControl?: boolean;    // permit toggle from the panel (default ON); false = display-only
  localState?: string;       // unbound local control ('on'/'off'); inert once bound
  label?: string;
  locked?: boolean;          // canvas move/delete disabled (click-to-toggle still works)
}

// Smoke / CO safety detector fixture. Ceiling-mounted (no wall snap; free
// placement like a motion sensor). Bound to a binary_sensor.* whose 'on' state
// means ALARM (device_class smoke / carbon_monoxide). Unbound detectors carry a
// localState for a manual test trigger ('on' = alarming; inert once bound). 2D +
// 3D render a small detector disc that erupts into pulsing rings + a colored
// halo while alarming (red for smoke, amber for CO). Rides the sensors layer.
// smoke = red ceiling beacon, co = amber ceiling beacon, gas = amber-green
// ceiling beacon (device_class gas), leak = FLOOR-mounted moisture detector that
// spreads a blue puddle decal when alarming (not a beacon). siren = ceiling
// alert BEACON (bound to a controllable siren.*/switch.*, or a display-only
// binary_sensor) that erupts into a spinning police-style light-bar sweep +
// expanding rings while 'on' (sounding); clicking a bound siren TOGGLES it
// (siren.toggle / switch.toggle), unbound flips localState like the Test button.
// glass_break = acoustic glass-break detector: a small SQUARE plate (wall or
// ceiling, mounted at the detector height like the other ceiling family) with a
// microphone grille, cool blue-violet accent. Alarming adds the shared expanding
// rings PLUS a spiky "shatter" star burst so it reads distinctly from the round
// smoke/CO/gas beacons at a glance.
export type SafetyKind = 'smoke' | 'co' | 'gas' | 'leak' | 'siren' | 'glass_break';

export interface SafetySensor {
  id: string;
  x: number; y: number;
  kind: SafetyKind;           // smoke/co/gas/siren/glass_break = ceiling family; leak = floor puck + puddle
  entity_id: string | null;   // detectors: binary_sensor.* ('on'=ALARM); siren: siren.*/switch.*/binary_sensor
  localState?: string;        // unbound manual trigger: 'on' = alarming/sounding; inert once bound
  label?: string;
  locked?: boolean;
}

// Alert Beacon fixture (Alert Center, Track B). A ceiling-mounted alert puck —
// a near-clone of the SafetySensor recipe (same silhouette / scale / free
// placement, no wall snap) — bound to an alert.* (ideal: three-state
// idle/on/off acknowledge semantics) or ANY binary-ish entity standing in for
// "problem here" (binary_sensor device_class problem, etc.). Not domain-locked
// (mirrors SafetySensor's looseness). While ACTIVE (unacknowledged) it pulses
// red + erupts into expanding rings; acknowledged (alert.* 'off') = steady
// amber; idle = dim gray. Clicking a bound beacon calls alert.turn_off
// (acknowledge) in edit/kiosk; unbound → flips localState for demoing. Rides the
// `sensors` layer. Per-floor (Floor.alertBeacons); repairFloor + defaultFloor
// backfill []. See src/alerts.ts (alertBeaconState / ALERT_STATE_COLORS).
export interface AlertBeacon {
  id: string;
  x: number; y: number;
  height?: number;            // mm above floor; default 2743 (ceiling, like SafetySensor)
  entity_id: string | null;   // alert.* / binary_sensor.* ('on' = active/alarming)
  localState?: string;        // unbound demo trigger: 'on' = active; inert once bound
  label?: string;
  locked?: boolean;           // canvas move/delete disabled (click-to-ack still works)
  hidden?: boolean;           // per-fixture hide (plus the whole sensors layer toggle)
}

// Robot fixture (Feature: robot vacuum / lawn mower). The (x,y) is the DOCK /
// charging base position (world mm); the live robot roams away from it and
// returns to dock. Bound to a vacuum.* (VacuumActivity: cleaning/docked/idle/
// paused/returning/error) or lawn_mower.* (LawnMowerActivity: mowing/docked/
// paused/returning/error) entity. Mowers can additionally bind a GPS source: a
// device_tracker with latitude/longitude attrs (+ optional `direction` heading
// attr, e.g. Mammotion `<name>_gps`) OR a separate lat/lon sensor pair. Live
// position is computed by Planner.stepRobots (runtime-only) and read by BOTH the
// 2D canvas and the 3D renderer. Rides its OWN `robots` layer (Layers2D.robots, absent = on).
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
  // Task-progress source (both kinds): a `sensor.*` whose state is a 0..100
  // percent (cleaning / mowing progress). Drives the body progress strip/ring in
  // 2D + 3D. Entity field WINS; absent → best-effort read of the bound vacuum/
  // mower entity's own attributes (cleaned_area_percent / progress / …). Neither
  // → strip hidden. Config-path in Planner._isSlowEntity (scoped to this floor).
  progressEntity?: string | null;
  // Valetudo room-map overlay (Phase 5, batch M-C): the topic identifier segment
  // (`<valetudoNs>/<valetudoId>/…`). When set + the MQTT bridge is up, Diorama
  // subscribes to this robot's MapData/StatusStateAttribute and draws its SLAM
  // room segmentation as an overlay, REUSING the pos* calibration fields above to
  // map map pixels → plan mm (calibrate once via "Set dock as reference").
  valetudoId?: string;
  // Dock orientation (item-level, absent = 0): degrees screen-CW where 0 = the
  // dock's local +Y faces world +Y — the standard furniture/fixture convention.
  // The dock's FRONT (the opening the robot drives out of) is local −Y, so at
  // rotation 0 it faces world −Y. A parked robot points INTO the dock; see
  // geometry.dockParkedHeading. Rides rotateFloorContent's `bump`.
  rotation?: number;
  label?: string;
  // Calibration diagnostic (item-level, absent = OFF): draw the REPORTED position
  // (live map fix / GPS fix / simulated pose) as a crosshair + a small monospace
  // readout beside the robot, so the user can see what the source says while
  // nudging the alignment offsets onto the plan. 2D-only (see canvas-render's
  // drawRobots) — the 3D view has no equivalent overlay.
  showPosInfo?: boolean;
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
                          // sensor (per-sensor attribution). Absent = the sensor's identity `color`
                          // (falling back to the palette tint) so avatars match their source sensor.
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

// A ground / yard covering area (the "yard" arc). A user-drawn world-mm polygon
// painted with a procedural ground texture (grass/rock/concrete/…). Pure paint:
// non-interactive except select + vertex-drag in edit mode, and never blocks
// nav. Per-floor (Floor.groundAreas), rides the `ground` layer (2D + 3D).
export type GroundKind = 'grass' | 'rock' | 'concrete' | 'blacktop' | 'mulch' | 'sand' | 'water';

export interface GroundArea {
  id: string;
  name?: string;
  points: Vec2[];              // world-mm polygon (3..20 verts)
  kind: GroundKind;
  elevationMm?: number;        // +raise / −sink relative to grade (0); default 0.
                               // Terraced: the flat top sits at this height, a
                               // skirt ring drops to groundAreaSkirtBase(). Nest
                               // polygons by hand for a multi-tier hill/berm; a
                               // negative value previews a sunken basin.
  path?: {                     // T4 path/driveway ribbon authoring convenience:
    centerline: Vec2[];        // when present, `points` is DERIVED (regenerated
    width: number;             // from bufferPolyline(centerline, width) on every
  };                           // centerline/width edit) — the stored polygon is a
                               // CACHE, not authoritative. Rendering/hit/3D are
                               // 100% the ordinary GroundArea pipeline; only the
                               // editing UI differs (centerline handles, "Detach
                               // shape" clears `path` → plain editable polygon).
  locked?: boolean;            // canvas vertex-drag / delete disabled
  hidden?: boolean;            // per-area hide (plus the whole ground layer toggle)
  haAreaId?: string | null;    // bound HA area — step 2 of the outdoor area-binding
                               // ladder (resolveAreaBindingForPoint): a fixture standing
                               // on this patch, outside every room, picks up this area.
                               // Smallest containing bound area wins; hidden areas skip.
}

// Irrigation / sprinkler zone (T3). A small ground-embedded head placed freely
// on the lawn (no wall snap — mirrors the safety-sensor / BLE-proxy "detector"
// model), bound to a switch.* ('on') / valve.* ('open'/'opening'/position>0) /
// binary_sensor.* (read-only) entity. Draws a spray arc/wedge (2D) + a THREE.
// Points spray plume (3D) ONLY while its bound entity is RUNNING (state via
// sprinklerRunning(); unbound → localState demo through effectiveState). Arc /
// radius / rotation are pure user-set visual props (HA exposes no nozzle data).
// Rides the `ground` layer (yard-embedded fixtures). Per-floor
// (Floor.sprinklerZones); repairFloor + defaultFloor backfill [].
export type SprinklerHeadKind = 'spray' | 'rotor' | 'drip';

export interface SprinklerZone {
  id: string;
  x: number; y: number;          // head position, world mm (sits inside a GroundArea)
  entity_id: string | null;      // switch.* | valve.* | binary_sensor.*
  headKind?: SprinklerHeadKind;  // default 'spray'
  arcDeg?: number;               // spray arc width, degrees; default 180 (half-circle)
  rotation?: number;             // deg, screen-CW, arc center direction; default 0 (+Y world)
  radius?: number;               // spray throw, world mm; default 3000 (≈10 ft)
  label?: string;
  zoneNumber?: number;           // optional user label ("Zone 3") shown on the chip
  localState?: string;           // unbound local control ('on'/'off'); inert once bound
  locked?: boolean;              // canvas move/delete disabled (click-to-toggle stays live)
}

// Pool / spa (T4, see docs/research/pool-spa.md) — a first-class spatial water
// body drawn as a polygon (parallel-latch idiom: drawingPoolArea) with a SUNKEN
// (or raised, for a spa) 3D basin: a water surface at −depthMm plus a vertical
// skirt ring from grade down to it (generalizes T1's terrace-skirt builder),
// a coping rim, per-frame shimmer (T3 water-texture clone drift), and a warm
// heater glow / pump ripple driven by bound HA entities. NAV BLOCKS the basin
// footprint (avatars path around water). Bindings are all domain-flexible +
// optional (§7 vendor fragmentation): heater climate.*|water_heater.*, pump
// switch.*, 0..n underwater light.*, plus display-only chemistry sensors.
// Config-path in _isSlowEntity. Rides the `ground` layer. Per-floor
// (Floor.pools); repairFloor + defaultFloor backfill [].
export interface Pool {
  id: string;
  name?: string;
  kind: 'pool' | 'spa';               // spa = smaller (visual defaults differ)
  points: Vec2[];                     // 3..20 world-mm polygon
  depthMm?: number;                   // basin depth below grade; default 1200 pool / 900 spa
  raisedMm?: number;                  // spa raised above grade (0 = in-ground); default 0
  waterColor?: string;                // toon aqua; default POOL_WATER_COLOR
  heaterEntity?: string;              // climate.* | water_heater.*
  pumpEntity?: string;                // switch.*
  lightEntities?: string[];           // light.* (0..n underwater lights)
  waterTempEntity?: string;           // sensor.* (chip)
  phEntity?: string;                  // sensor.*
  orpEntity?: string;                 // sensor.*
  saltEntity?: string;                // sensor.*
  // A Pool has SEVERAL independently-toggleable sub-things (heater, pump) so it
  // uses a localState MAP rather than the single-fixture flat localState field.
  localState?: { heater?: string; pump?: string };
  locked?: boolean;
  hidden?: boolean;
}

// A floor void / opening — a user-drawn "no floor here" polygon (stairwell
// well, double-height atrium, mezzanine cutout). 3D: the polygon is subtracted
// from the floor patches as a HOLE (same earcut path as stairwell wells), with
// the shared dark void plane beneath. Nav: void cells are BLOCKED in _buildNav
// so avatars route around missing floor — EXCEPT cells inside a stairs-family
// footprint (a flight bridges the void). Rides the `ground` layer (2D + 3D).
// Per-floor (Floor.voidAreas), repairFloor backfills []. Radar/BLE raw
// positions are never remapped — only nav-driven rigs respect voids.
export interface VoidArea {
  id: string;
  points: Vec2[];              // world-mm polygon (3..12 verts)
  locked?: boolean;            // canvas vertex-drag / delete disabled
  hidden?: boolean;            // per-void hide (plus the whole ground layer toggle)
}

// ── Ruler (measure tool) + wall/structure dimensions (2D-only v1) ──────────
// A ruler measures the distance between two ENDS. Each end is either a free
// world-mm point (draggable / length-editable) or an anchor LOCKED to a wall or
// furniture piece (the measurement tracks the object even as it moves). Point↔
// point = plain distance; an object end measures to that object's FACE (wall) /
// footprint edge (furniture); object↔object measures the INSIDE clearance.
// A dangling wallId/furnitureId (object deleted) resolves to null → the renderer
// / sidebar show "broken", never throw. Per-floor (Floor.rulers); repairFloor +
// defaultFloor backfill []. See geometry.ts resolveRulerEnds / rulerSetLength.
export type RulerEnd =
  | { kind: 'point'; x: number; y: number }
  | { kind: 'wall'; wallId: string }
  | { kind: 'furniture'; furnitureId: string };

export interface Ruler {
  id: string;
  a: RulerEnd;
  b: RulerEnd;
  locked?: boolean;   // canvas endpoint-drag / delete disabled (sidebar still edits)
}

// Wall / structure dimension display mode (Feature B). Absent = 'off'.
//   all      — every wall SEGMENT gets a CAD dimension line + total structure extents
//   outside  — only exterior wall segments (outerWallSegments) + total extents
//   custom   — only walls with Wall.dimension === true
export type DimensionMode = 'off' | 'all' | 'outside' | 'custom';

// Door leaf styles. `swing` reproduces the legacy hinged panel.
//   sliding       — barn-style slab hung proud of the wall, slides along it
//   pocket        — slab inside the wall cavity, retracts into the adjacent run
//   double        — two solid half-width leaves swinging as a mirrored pair
//   french        — `double` geometry with glazed, muntin-gridded leaves
//   sliding_glass — two framed glass panels, one fixed / one sliding behind it
export type DoorKind = 'swing' | 'garage' | 'gate'
  | 'sliding' | 'pocket' | 'double' | 'french' | 'sliding_glass';

export interface Door {
  id: string;
  x: number; y: number;        // hinge point in world mm
  w: number;                   // panel length in mm (default 800; garage typically 2400+)
  rotation: number;            // panel direction (closed) in degrees, screen-CW; 0 = panel along +X world
  kind?: DoorKind;             // 'swing' (default, hinged panel) | 'garage' (segmented overhead door) | 'gate' (picket-styled swinging panel on a fence/hedge)
                               // | 'sliding' | 'pocket' | 'double' | 'french' | 'sliding_glass' (see DoorKind)
  entity_id: string | null;    // binary_sensor ("on" = open) OR cover.* ('open'/'closed', current_position for partial)
  label?: string;
  localState?: string;         // local control when UNBOUND ('on'=open/'off'); inert once bound. See Planner.effectiveState.
  lockEntity?: string | null;  // lock.* entity secondary binding. 'locked' = amber/red padlock,
                               // 'unlocked' = green open outline, unavailable/absent = grey. Clicking the
                               // deadbolt (3D) / padlock (2D) toggles lock.lock ↔ lock.unlock.
  lockLocalState?: 'locked' | 'unlocked'; // local control when UNBOUND (no lockEntity): clicking the
                               // deadbolt/padlock flips this. Inert once lockEntity is bound. Mirrors localState idiom.
  lockControl?: 'full' | 'display'; // 'full' (default, absent) = clicking the padlock/deadbolt/sidebar
                               // badge toggles lock.lock↔unlock (or flips lockLocalState). 'display' = the
                               // glyph/bolt is a PASSIVE state indicator: clicks never fire the lock nor
                               // flip the local flag (a shed padlock / read-by-policy unit nobody should
                               // remotely open from a kiosk). Enforced in Planner.toggleDoorLock. Item-level;
                               // no repairFloor change (arrays pass through unchanged, like lockLocalState).
  doorbellEntity?: string | null; // event.* (device_class doorbell) / binary_sensor.* / button.* — a state-string
                               // CHANGE fires a transient ring pulse (Planner.doorbellRings). Display only, no toggle.
  hinge?: 'right' | 'left';    // which side the hinge sits on. Determines swing direction.
                               // 'right' (default) = swings CCW on screen; 'left' = swings CW.
                               // SLIDING FAMILY (sliding/pocket/sliding_glass) reads the same field as
                               // the SLIDE SIDE: 'right' (default) retracts toward the (x,y) hinge end,
                               // 'left' toward the endpoint. IGNORED by double/french (symmetric pair).
  locked?: boolean;            // canvas move/rotate/delete disabled
}

// Window glazing style. `single` reproduces the legacy one-pane look.
// bay / bay_bench PROJECT OUTWARD from the wall face: a three-pane assembly
// (centre pane parallel to the wall + two ~35° angled returns), a solid base
// board from the floor up to the sill, and a head/roof board. `bay_bench` adds
// an interior cushioned window seat at the sill — registered as a real SitSpot
// (id `win:<windowId>:0`) so the standard dwell/claim/sit machinery applies.
export type WindowKind = 'single' | 'double_hung' | 'casement_pair' | 'sliding' | 'picture'
  | 'bay' | 'bay_bench';

// Per-window interior curtain treatment (display-only openness). Distinct from
// Window.coverEntity (a roller shade that DESCENDS from the header) — curtains
// hang on the interior face over the glass:
//   horizontal — a single roman-shade panel that OPENS by rising from the bottom
//   vertical   — one drape panel drawing to ONE side (`side`, default right)
//   split      — two drape panels drawing outward from the center
export type WindowCurtainStyle = 'horizontal' | 'vertical' | 'split';
export interface WindowCurtain {
  style: WindowCurtainStyle;
  side?: 'left' | 'right';      // vertical style only; default 'right'
  entityId?: string | null;     // cover.* (doorOpenFraction) OR binary_sensor/switch on/off; display-only
  color?: string;               // hex fabric color; default warm neutral #b9a58c
}

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
  curtain?: WindowCurtain;     // interior curtain treatment (openness: 1 = OPEN/gathered, 0 = CLOSED/covering)
  curtainPos?: number;         // 0..100 manual curtain openness when curtain.entityId is UNBOUND (100 = OPEN/gathered)
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
  plumbobColor?: string;     // hex; color of the plumbob above this sensor's AI/demo avatar. Absent = the
                             // motion sensor's `color` (default #ba68c8) so the avatar matches its source.
  locked?: boolean;          // canvas move/rotate/delete disabled
}

// A roaming AI avatar (Batch A). A display-only presence stored in the config
// (NOT bound to any sensor) that wanders the whole floor with a preference for
// interior activities. Unlike motion-sensor AI avatars (home-room confined,
// gated on binding/demo), roamers are free-range and always on when enabled.
// Rendered in ALL UI modes (like demo avatars). Per-floor (Floor.roamers) —
// repairFloor backfills []. Avatar selection reuses the motion-sensor model
// (avatarKinds pool + legacy single avatarKind; resolveAvatar picks).
export interface Roamer {
  id: string;
  name?: string;
  avatarKind?: AvatarKind | 'random';  // LEGACY single-pick (kept for reads; new UI writes avatarKinds)
  avatarKinds?: AvatarKind[];          // pool of rig variants; each roamer stably hash-picks one
  plumbobColor?: string;               // hex; absent = this roamer's identity `color` (default tint)
  color?: string;                      // hex identity tint; absent = the default AI/target tint
  enabled?: boolean;                   // absent = ON (rendered); false = hidden
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

// Info card fixture (Display & Controls arc, batch DC-A). A placeable plaque
// that shows the live state + unit of ANY bound HA entity (no domain filter) as
// crisp text — 2D chip + 3D sprite/plane — with optional value→color rules
// (shared `evalRules` engine, src/value-rules.ts) and an entity-free clock/date
// mode. Generalizes EnvSensor (which is hard-wired to sensor.* + a fixed kind
// table). Per-floor (Floor.infoCards); repairFloor + defaultFloor backfill [].
export type InfoCardMount = 'wall' | 'surface' | 'floor';
export type InfoCardDisplayMode = 'entity' | 'clock' | 'date' | 'clock_date';

export interface InfoCard {
  id: string;
  x: number; y: number;
  rotation?: number;             // deg screen-CW; orients the wall/floor flat plane (billboard:false)
  mount?: InfoCardMount;         // default 'wall'; drives default size + wall auto-snap
  w?: number; h?: number;        // plaque footprint mm; default from `mount`
  height?: number;               // mm above floor for the 3D text center; default per-mount
  displayMode?: InfoCardDisplayMode;  // default 'entity'; clock/date/clock_date need no entity
  entity_id: string | null;      // bound entity (any domain); null for clock/date modes
  label?: string;                // user override of friendly_name (shown as a caption when selected)
  format?: InfoCardFormat;       // precision / unit override / prefix / suffix / mapping / relative-time
  rules?: ValueRule[];           // value→color/flash (first-match-wins; shared engine)
  billboard?: boolean;           // default true = camera-facing sprite; false = fixed plane at `rotation`
  fontScale?: number;            // 0.4..4, default 1 (mirrors EnvSensor.scale)
  clockFormat?: string;          // CLOCK_PRESETS key (clock / clock_date); default '12h'
  dateFormat?: string;           // DATE_PRESETS key (date / clock_date); default 'medium'
  timeZone?: string;             // IANA tz override for clock/date modes (else host-local)
  locked?: boolean;              // canvas move/delete disabled
  hidden?: boolean;              // per-card hide (plus the whole `info` layer toggle)
  mountOnId?: string | null;     // surface-mount host bookkeeping (mirrors Furniture.mountOnId)
}

// Generic action / trigger button (Display & Controls arc, batch DC-B). A
// wall-plate / table / floor "any-action" button that dispatches a configurable
// HA service call (script run, scene activation, button/input_button press,
// automation trigger, entity toggle, or an arbitrary domain.service escape
// hatch) with a tactile press animation. Not an entity type to BIND — a
// dispatcher UI: pick one HA action once, the physical button in the scene
// becomes a spatial way to fire it. Per-floor (Floor.actionButtons); repairFloor
// + defaultFloor backfill []. Rides the `switches` layer (it IS a control).
export type ActionKind =
  | 'button_press'      // button.press or input_button.press (domain from entity_id)
  | 'scene'             // scene.turn_on
  | 'script'            // script.turn_on (+ optional variables)
  | 'automation_trigger'// automation.trigger
  | 'toggle'            // domain-aware toggle (Planner.toggleEntity) — any toggleable entity
  | 'custom';           // arbitrary domain/service/data — the escape hatch

export interface ActionButton {
  id: string;
  x: number; y: number;
  rotation?: number;        // deg, wall-plate convention (0 = +Y world); only meaningful when wallMount
  height?: number;          // mm above floor; default 1200 (wall) — see ACTION_BUTTON_DEFAULTS
  wallMount?: boolean;      // true = snap-to-wall like a switch (default true); false = free placement (table/floor puck)
  size?: number;            // plate/puck extent mm; default 220
  actionKind?: ActionKind;  // default 'toggle'
  entity_id?: string | null;   // target for button_press / scene / script / automation_trigger / toggle
  domain?: string;          // 'custom' mode only
  service?: string;         // 'custom' mode only
  serviceData?: string;     // JSON string (edited in sidebar, validated); custom data / scene transition / script variables
  label?: string;
  icon?: string;            // optional glyph override (emoji); default derived from actionKind
  color?: string;           // button-cap accent color; default '#4fa8ff'
  confirm?: boolean;        // require a browser confirm() before firing (destructive-leaning actions)
  localState?: string;      // unbound pulse state ('on' on press) so the button animates standalone
  locked?: boolean;         // canvas move/rotate/delete disabled; click-to-fire still works
  hidden?: boolean;         // per-button hide (plus the whole `switches` layer toggle)
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
  belowHorizon?: boolean;    // allow orbiting the camera below the horizon (look up at the floor's underside);
                             // default false = today's ~88° max polar angle
  cameraPivot?: 'center' | 'free';
                             // DEPRECATED (superseded by pivotLocked + freeMovement below). Read
                             // ONLY for back-compat by `resolvePivotMode`; never written again.
                             // Legacy semantics: 'free' → {locked:false, free:true}; absent /
                             // 'center' → {locked:true, free:false}.
  pivotLocked?: boolean;     // 3D orbit pivot is LOCKED to the plan centre (the active floor's rect
                             // centre, or the union centre of every enabled floor under glass
                             // house). ABSENT = true (the DEFAULT). Locked + no free movement =
                             // panning disabled and `controls.target` eased home. Locked + free
                             // movement = panning allowed, but rotation rigidly spins the whole
                             // view around the plan centre instead of the panned-to point.
  freeMovement?: boolean;    // allow panning the 3D view (side to side / forward and back).
                             // ABSENT = false. Independent of `pivotLocked` — see the matrix in
                             // `resolvePivotMode` (geometry.ts) and `setCameraPivot`.
  fovV?: number;             // vertical field-of-view in degrees; default 50 (the constructor's value)
  fovH?: number;             // horizontal field-of-view in degrees; absent = auto (derive from the canvas
                             // aspect, today's behavior). When set, the frustum is fixed and independent of
                             // the window shape (a non-matching window letterboxes/stretches — that IS the feature).
  skyBackdrop?: boolean;     // phase 3: gradient sky dome + sun/moon/star props replacing the flat
                             // background. Default ON when a weather source is configured; the 3D
                             // "Sky backdrop" Display checkbox overrides.
  groundLevelMm?: number;    // height of the SURROUNDINGS relative to the floor slab; default 0 =
                             // today. The backdrop grid, the OpenStreetMap neighborhood overlay and
                             // the yard-fill underlay shift by this much (and avatars walking
                             // outside every closed wall loop settle onto it); the floor slab,
                             // walls, furniture, fixtures and authored ground areas / terraces /
                             // pools never move. NEGATIVE = surroundings BELOW the slab — the
                             // raised-foundation / hilltop look. Clamped ±10 000 mm.
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
  haAreaId?: string | null;         // bound HA area (config/area_registry). Does NOT overwrite
                                    // `name` — display resolution is typed name → area name →
                                    // "Unnamed room" (see roomLabel). Binding also scopes the
                                    // occupancy / temperature entity pickers to that area.
  // Per-room flooring override (item-level — no repairFloor). Applied to the
  // room's wall LOOP in BOTH views (3D slab patch + 2D floor fill/pattern).
  // Resolution ladder: room → Floor.look3d → Store.scene3d → defaults; absent
  // OR null = inherit (a "↺" clear button in the sidebar removes the field).
  floorColor?: string | null;
  floorTex?: FloorTexKind | null;
}

// The pseudo-area covering everything OUTSIDE every closed wall loop on a floor
// (the yard / driveway / porch). Not a Room — it has no anchor and no loop; it
// is the ladder's fallback so outdoor fixtures can still resolve to an HA area
// (see resolveAreaBindingForPoint in geometry.ts). Per-floor (Floor.outdoor);
// label resolution is typed name → bound HA area name → "Outdoors".
export interface OutdoorArea {
  name?: string;
  haAreaId?: string | null;
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

// Projector fixture (home-theater arc). Ceiling/shelf-mounted body aimed at a
// projection screen (a `wall_tv`/`tv` furniture piece). Bindable to a
// media_player.* / switch.* / light.* entity whose 'on'/'playing' state means
// PROJECTING; unbound pieces carry a localState for click-toggle (same "local
// control of unbound interactive objects" pattern as Light/Door). While
// projecting the 3D build shows a translucent light-frustum cone from the lens
// to the aim point + a soft glow on the target screen; 2D draws a dashed throw
// wedge. Free placement (no wall snap); rides the sensors layer. Per-floor
// (Floor.projectors); repairFloor + defaultFloor backfill []. See geometry.ts
// PROJECTOR_DEFAULTS / projectorAim / projectorProjecting.
export interface ProjectorFixture {
  id: string;
  x: number; y: number;          // mm, ceiling/shelf mount point in plan
  height?: number;               // mm above floor; default 2600 (near ceiling)
  rotation?: number;             // deg screen-CW; aim heading when no screen target (0 = +Y world)
  entity_id?: string | null;     // media_player.* / switch.* / light.* ('on'/'playing' = projecting)
  localState?: string;           // local on/off when UNBOUND ('on'/'off'); inert once bound
  screenId?: string | null;      // Furniture id (wall_tv/tv) the beam aims at; falls back to `rotation`
  throwRatio?: number;           // default 1.5 (standard throw); scales the beam spread + default reach
  beamColor?: string;            // hex; default '#dfe8ff' (cool white-blue)
  label?: string;
  locked?: boolean;              // canvas move/delete disabled (click-to-toggle still works)
  hidden?: boolean;              // per-fixture hide (plus the whole sensors layer toggle)
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
  // ── Frigate ground-truth targets (Phase 5, MQTT bridge) ──────────────────
  frigateName?: string;   // the Frigate `after.camera` name this fixture maps to;
                          // default = slugified label. Unmatched cameras are ignored.
  color?: string;         // per-camera tint (hex) for cam-derived target dots;
                          // default from a palette by fixture index (like sensors).
  camCalib?: CameraCalibration;  // image↔floor ground-plane homography calibration
}

// Per-camera ground-plane calibration for projecting Frigate detection boxes to
// floor mm. `points` are ≥4 image↔floor correspondences (u,v in DETECT-resolution
// pixels ↔ x,y in floor mm) from which a planar homography is SOLVED at runtime
// (never stored — re-solvable after adding/removing a point). detectW/detectH is
// the camera's detect-stream resolution, used by the calibration UI to scale
// displayed-image clicks to detect pixels (Frigate reports boxes at detect res).
export interface CameraCalibration {
  detectW?: number;
  detectH?: number;
  points: { u: number; v: number; x: number; y: number }[];
}

// Yard flagpole fixture. A tapered pole + gold finial + a waving cloth flag,
// placed freely on the plan (yard prop, NO wall snap). The flag design comes
// from the pure flag library (src/flags.ts FLAG_PAINTERS, textured into a
// CanvasTexture); the 3D cloth ripples per-frame (vertex displacement, the
// _animateBedCover idiom) and yaws slightly with the wind when a weather source
// is configured. Hoist position (full / half / lowered) resolves from a bound
// entity (sensor/number percent 0..100, or cover.* position) → halfMast flag →
// full. Display-only (no click-to-toggle). Rides the `furniture` layer (yard
// decor). Per-floor (Floor.flagpoles); repairFloor + defaultFloor backfill [].
// See geometry.ts FLAGPOLE_DEFAULTS / flagpoleHoistFraction.
export interface FlagpoleFixture {
  id: string;
  x: number; y: number;         // pole base position, world mm
  label?: string;
  flag?: string;                // FLAG_PAINTERS key; default 'usa'
  height?: number;              // pole height mm; default 6000
  entityId?: string;            // hoist source: sensor.*/number.* percent 0..100, OR cover.* position
  halfMast?: boolean;           // fly at half-mast when no entity is bound (else full)
  locked?: boolean;             // canvas move/delete disabled
  hidden?: boolean;             // per-fixture hide (plus the whole furniture layer toggle)
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
  roamers?: Roamer[];        // roaming AI avatars (display-only); repairFloor backfills []
  envSensors: EnvSensor[];   // older persisted stores lack it — repairFloor backfills
  look3d?: FloorLook3D | null;  // per-floor overrides of the global scene3d colors
  doors: Door[];
  windows: Window[];
  bg: BgImage | null;
  model3d?: Model3D | null;
  rooms?: Room[];   // named rooms (anchor → live wall loop); repairFloor backfills []
  bleProxies?: BleProxy[];  // BLE scanner fixtures; repairFloor backfills []
  alarmPanels?: AlarmPanel[];  // alarm keypad fixtures; repairFloor backfills []
  calendarPanels?: CalendarPanel[];  // wall calendar plaques; repairFloor backfills []
  thermostats?: ThermostatFixture[];  // HVAC wall-control fixtures; repairFloor backfills []
  safetySensors?: SafetySensor[];  // smoke / CO detectors; repairFloor backfills []
  robots?: RobotFixture[];  // robot vacuum / mower fixtures; repairFloor backfills []
  alertBeacons?: AlertBeacon[];  // Alert Center placeable beacons; repairFloor backfills []
  presenceZones?: PresenceZone[];  // FP2-style occupancy zones; repairFloor backfills []
  cameras?: CameraFixture[];  // camera fixtures (FOV frustum + snapshot); repairFloor backfills []
  projectors?: ProjectorFixture[];  // home-theater projector fixtures; repairFloor backfills []
  valves?: ValveFixture[];  // water valve fixtures (open/close from the panel); repairFloor backfills []
  plugs?: PlugFixture[];  // smart plug / outlet fixtures; repairFloor backfills []
  groundAreas?: GroundArea[];  // yard/ground covering polygons; repairFloor backfills []
  pools?: Pool[];  // pool / spa water bodies (sunken basin + bound equipment); repairFloor backfills []
  sprinklerZones?: SprinklerZone[];  // irrigation heads (spray arc while entity on); repairFloor backfills []
  yardFill?: GroundKind;       // opt-in: auto-paint this ground kind over the floor
                               // rect MINUS every closed wall loop (y=2 underlay).
                               // Undefined = off (today's void-yard behavior).
  outdoor?: OutdoorArea;       // the bindable pseudo-area for everything OUTSIDE every
                               // closed wall loop; in repairFloor's field list.
  voidAreas?: VoidArea[];  // floor voids / openings (holes cut from the slab); repairFloor backfills []
  infoCards?: InfoCard[];  // generic entity-value / clock plaques; repairFloor backfills []
  actionButtons?: ActionButton[];  // generic action / trigger buttons; repairFloor backfills []
  rulers?: Ruler[];        // measure-tool rulers (2D-only); repairFloor + defaultFloor backfill []
  dimensionMode?: DimensionMode;  // wall/structure dimension display (Feature B); absent = 'off'
  flagpoles?: FlagpoleFixture[];  // yard flagpole fixtures (waving flag); repairFloor backfills []
  boundsLocked?: boolean;   // lock canvas-layout/floor-size editing (hides the edge handles)
  disabled?: boolean;       // hidden from the kiosk/view floor picker + glass-house stack + BLE
                            // floor solve; still editable in the sidebar — lets multiple test
                            // iterations coexist without cluttering the live views.
  peek2d?: boolean;         // "peek" tri-state: enabled AND its wall outline draws as a 2D
                            // reference underlay (onion-skin) when viewing OTHER floors.
                            // Only meaningful when !disabled (hide wins over peek).
  elevationMm?: number;     // this slab's height above the WORLD GROUND PLANE. Absent = AUTO
                            // = arrayIndex × STORY_H_MM (3000) — floors[0] sits ON the ground,
                            // reproducing the historical story stack. Negative = basement; the
                            // ground plane may bisect a floor (e.g. a walk-out level at −1300).
                            // Resolved by geometry.floorElevationMm against the FULL floors
                            // array (the AUTO value is index-derived). repairFloor passes it
                            // through.
  haFloorId?: string | null;  // bound HA floor (config/floor_registry). Scopes this floor's
                              // room→area dropdowns to that HA floor's areas. Absent = unbound
                              // (every area is offered). repairFloor passes it through.
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
  moonEntity?: string;     // phase 3: sensor.* from HA's core `moon` integration (8-state phase).
                           // Drives the 3D moon prop's phase texture; unbound → default full moon.
  // Per-effect toggles (W3). Absent key = the per-key default (see
  // weatherEffectEnabled in weather.ts): ON for precip/fog/lightning/wind/
  // clouds/sunPosition/sunDisc/puddles, OFF for frost/precipForecast.
  // `sunPosition` (orients the sun LIGHT) and `sunDisc` (the sky backdrop's
  // warm sun-glow sprite) are lighting/sky behaviors, NOT effect-group members,
  // so both are gated only on their own key + a live source — never on
  // effects3d or the weatherFx layer.
  effects?: Partial<Record<WeatherEffectKey, boolean>>;
  // ── DC-C: chip position + content + forecast display (all optional/additive) ──
  // Anchor corner for the chip overlay (default 'br' = bottom-right, the legacy
  // spot). chipCustom, when set, wins: px offsets from the anchor's edges.
  chipAnchor?: 'tl' | 'tm' | 'tr' | 'bl' | 'bm' | 'br';
  chipCustom?: { x: number; y: number };
  // Extra content rows + forecast strip. hourly/daily = how many forecast
  // entries to show (0/absent = that strip hidden). apparent/humidity/wind add
  // optional rows (absent = off; chip stays glyph+temp+label like before).
  chipContent?: {
    apparent?: boolean;
    humidity?: boolean;
    wind?: boolean;
    uv?: boolean;          // UV index row ("☀️ UV 7 · high", WHO-banded color)
    hourly?: number;
    daily?: number;
  };
  // ── DC-D: weather alerts (additive). Independent of the weather SOURCE above —
  // a user-picked alert entity (NWS Alerts / MeteoAlarm / DWD / Environment
  // Canada sensor|binary_sensor), parsed defensively into WeatherAlert[]
  // (weather.ts parseWeatherAlerts). `beacon` = the 3D ambient severity-scaled
  // sky pulse (default ON when an alert entity is bound). The chip badge + panel
  // are always shown when alerts exist.
  alerts?: { entityId?: string; beacon?: boolean };
}

// One toggleable 3D weather visualization (W3). See weatherEffectEnabled.
export type WeatherEffectKey =
  | 'precip' | 'fog' | 'lightning' | 'wind' | 'clouds'
  | 'sunPosition' | 'sunDisc' | 'frost' | 'puddles' | 'precipForecast';

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
  pendingPlace?: boolean;      // CSV-imported with real lat/lon but NO plan position yet
                               // (imported while no geo fit existed, so it couldn't be
                               // projected). Planner.geoFit() EXCLUDES these — a dummy
                               // x/y would poison the fit. Cleared when the user places
                               // the pin on the plan (canvas-interact placement latch).
  excluded?: boolean;          // excluded from the geo fit (kept, drawn dimmed) — user toggle.
                               // ABSENT = participates (backward compatible). Distinct from
                               // `hidden`, which only suppresses the 2D pin: an excluded
                               // landmark still draws (dashed/dim) but contributes nothing to
                               // the transform, so one bad calibration can be neutralized
                               // without losing its coordinates.
}

// A recorded-position pin (roadmap P2 — the REVERSE of a landmark): capture the
// CURRENT GPS fix (or type lat/lon) and a pin drops onto the plan wherever the
// landmark fit projects it. lat/lon are the SOURCE OF TRUTH — plan x/y is NEVER
// stored; every read re-projects through Planner.geoFit() so recalibrating the
// landmarks later automatically corrects every recorded pin. Primary use:
// walk the property line tapping "Record point" at each corner → a visible
// boundary chain, convertible into an editable ground-area polygon.
export interface RecordedPin {
  id: string; name?: string;
  lat: number; lon: number;    // SOURCE OF TRUTH — never store plan x/y
  accuracy?: number;           // m, from the fix; absent for manual entry
                               // (the landmark manual-sentinel idiom)
  recordedAt?: string;         // ISO timestamp of the capture
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
  recorded?: RecordedPin[];    // P2 record-a-position pins (boundary chain)
  recordedClosed?: boolean;    // draw the recorded chain closed (last→first segment)
  calibTracker?: string;       // persisted device_tracker.* used by "Record point"
                               // (mirrors the calibration tracker selection)
}

// ── Neighborhood overlay (OpenFreeMap) ───────────────────────────────────
// Store-level (property-wide) — one address, one real-world context (mirrors
// Store.geo / Store.weather). Absent/undefined is fully inert; `enabled`
// defaults OFF (it calls a third-party network service — opt-in only, never
// default-on). Must be in Planner._loadFromHa's explicit field list (the
// standard reset-on-load gotcha) — _normalizeStore is shared with the
// undo/redo _applyHistorySnapshot path, so one entry covers both.
// See docs/research/neighborhood-openfreemap.md §7.1.
export interface NeighborhoodConfig {
  enabled?: boolean;                    // absent = OFF (opt-in — third-party fetch)
  source?: 'openfreemap' | 'custom';    // default 'openfreemap'
  tileUrlTemplate?: string;             // 'custom' only — a {z}/{x}/{y}.pbf template (http(s) only)

  radiusM?: number;                     // fetch radius around the geo origin; default 350, clamp 100..3000
                                        // (clamped in ONE place — Planner.neighborhoodRadiusM; the render
                                        //  caps + the 3D camera frustum scale off it)

  layers?: {
    buildings?: boolean;                // default true
    roads?: boolean;                    // default true
    water?: boolean;                    // default true
    landuse?: boolean;                  // default false — ambient-only, opt-in
    labels?: boolean;                   // default false — deferred (no-op until a future phase)
  };

  verticalScale?: number;               // multiplies every resolved building height; default 1, clamp 0.2..3
  defaultLevelHeightM?: number;         // fallback per-level height (no OSM tag); default 3, clamp 2..5

  align?: { dx?: number; dy?: number; rotDeg?: number }; // fine nudge ON TOP of the landmark GeoTransform

  opacity?: number;                     // building/road/water alpha; default 1, clamp 0.3..1
  colorBuildings?: string; colorRoads?: string; colorWater?: string; colorLanduse?: string; // hex overrides

  exclusions?: Vec2[][];                // plan-mm mask polygons (same shared frame as Store.geo.landmarks) —
                                        // neighborhood geometry intersecting one is clipped OUT
}

// ── Flight & satellite tracking (roadmap P4) ─────────────────────────────
// Live aircraft overhead (ADS-B) + the ISS, rendered into the existing 3D sky
// on a compressed, deliberately NOT-to-scale display shell (see src/flights.ts).
// Store-level (property-wide), NOT per-floor. Opt-in like every other
// network-calling Store field — absent or `enabled: false` makes the whole
// feature inert (no fetch, no timer, no render). MUST be in
// Planner._normalizeStore's explicit field list or it resets on every load.
//
// Sources (all three carry the same normalized shape through flights.ts):
//   'cloud'  — airplanes.live direct browser fetch; the only keyless cloud ADS-B
//              API that sends an open CORS header. Sends the configured lat/lon
//              to a third party.
//   'local'  — the user's own LAN receiver aircraft.json (dump1090-fa / readsb /
//              tar1090 / ultrafeeder). Freshest + no third party, but the
//              receiver needs a CORS header added and must not be plain http
//              behind an https panel.
//   'entity' — an HA rest/template sensor that fetched the data SERVER-side
//              (no CORS at all); its attributes carry the aircraft array. The
//              only way to use the CORS-blocked adsb.lol / adsb.fi feeds.
export interface FlightsConfig {
  enabled?: boolean;                      // absent/false = feature fully inert
  source?: 'cloud' | 'local' | 'entity';  // default 'cloud' (airplanes.live)
  localUrl?: string;                      // 'local' — the receiver's aircraft.json URL, used verbatim
  entityId?: string;                      // 'entity' — HA sensor whose attributes hold the aircraft array
  radiusNm?: number;                      // search + display radius; default 15, clamp 5..100
  pollSeconds?: number;                   // default 8, clamp 5..60 (under airplanes.live's 1 req/s)
  minAltFt?: number;                      // optional altitude band filters
  maxAltFt?: number;
  showLabels?: boolean;                   // callsign labels in 3D; default true
  // Size multiplier for every aircraft rig (default 1, clamp 0.5..4). Composed
  // MULTIPLICATIVELY with the distance-compensated display scale + the spawn
  // fade, so the rim/near growth curve and the fade-out are both preserved —
  // this only sets how big the toy plate reads at a given zoom.
  modelScale?: number;
  // Scene radius (METRES) the search radius maps onto — the display shell's
  // rim, i.e. where an aircraft at exactly `radiusNm` renders. Default 300,
  // clamp 60..1000 (FLIGHT_SHELL_DEFAULT_RADIUS_M / flightShellMm in
  // src/flights.ts, which owns the resolution + the clamp). The shell is a
  // SIMILARITY transform of a 120 m reference: raising this pushes traffic
  // deeper toward the horizon AND grows the models by the same factor, so
  // apparent sizes are unchanged. `setFlights` normalizes exactly-300 back to
  // undefined (the modelScale idiom).
  shellRadiusM?: number;
  // Display-HEIGHT multiplier, deliberately INDEPENDENT of shellRadiusM
  // (default 1, clamp 0.2..2 — FLIGHT_VSCALE_* / flightVerticalScale in
  // src/flights.ts owns the resolution + clamp). Composed at the single place
  // display height is composed (`flightDisplayAltitudeMm`), AFTER the
  // elevation-true cap and BEFORE the ABSOLUTE clearMm property-clearance
  // floor — so lowering high-altitude traffic toward the horizon never brings
  // it horizontally closer and can never drop an aircraft onto the house.
  // `setFlights` normalizes exactly-1 back to undefined (the modelScale idiom).
  verticalScale?: number;
  // Banded visual speed indicator: trails / contrails / rotor blur / motion
  // lines / afterburner + ghost multiples, keyed to the aircraft's ground-speed
  // band (flightSpeedBand in src/flights.ts, 5 bands with hysteresis). ABSENT =
  // ON; false builds none of it and costs nothing per frame.
  speedViz?: boolean;
  // Towed banners on small piston singles with a callsign (the bg tow-plane
  // idiom). Charming but busy over a dense feed — ABSENT = ON (today's
  // behavior); false swaps those aircraft back onto the ordinary label plate.
  banners?: boolean;
  // Which lines the label plate carries, in order. Allowed keys (see
  // FLIGHT_LABEL_FIELDS in src/flights.ts, which also owns the sanitizer
  // setFlights runs): 'callsign' | 'reg' | 'type' | 'operator' | 'alt' |
  // 'speed' | 'trend' | 'squawk' | 'dist'. ABSENT = today's shipped two-line
  // plate, ['callsign','alt'] — the field is purely additive.
  labelFields?: string[];
  beacons?: boolean;                      // status beacons (emergency/military/…); absent = ON
  // User-authored glow rules (docs/research/flight-glow-rules.md): an ordered,
  // FIRST-MATCH-WINS list assigning a colour + animation pattern to matching
  // aircraft. Layered ON TOP of the default beacon ladder — an emergency
  // aircraft always keeps the red flash (§4 tier 1), a no-match aircraft falls
  // through to today's unchanged interesting/military/LADD treatment, and the
  // `beacons` toggle above gates ALL glow (default and user-ruled alike).
  // Capped at MAX_FLIGHT_GLOW_RULES (30) and sanitized in `Planner.setFlights`
  // via `sanitizeFlightGlowRules` (src/flights.ts, which owns the whole type +
  // matcher + pattern-math surface).
  glowRules?: FlightGlowRule[];
  // Courtesy dimming of the registration/operator text on PIA/LADD-flagged
  // aircraft (research §4.2 — the data source deliberately does not enforce
  // the FAA privacy programs, so honoring them is the consumer's call).
  // Absent = ON; set false to see every flagged aircraft in full.
  privacyDim?: boolean;
  iss?: boolean;                          // live ISS dot; default true (active only while `enabled`)
  alerts?: {                              // low-overflight / watch-list / ISS-pass notices
    lowAltFt?: number;
    watch?: string[];                     // callsign or hex fragments
    issPass?: boolean;
  };
}

// ── MQTT bridge (Phase 5) ────────────────────────────────────────────────
// Direct-MQTT bridge config (Frigate ground-truth targets + Valetudo maps).
// `mode` is the enabled bit + transport choice — safe to SYNC. Broker
// user/password are secrets and live in localStorage ONLY
// (diorama:mqtt:user / diorama:mqtt:pass), never here. frigateTopic / valetudoNs
// are the topic prefixes the (later) consumers subscribe under.
export interface MqttBridgeConfig {
  mode?: 'off' | 'ha-relay' | 'direct';
  brokerHost?: string;
  brokerPort?: number;         // direct mode; default 9001 (mosquitto websockets listener)
  useTls?: boolean;            // direct mode; wss:// (required when the panel is served over HTTPS)
  frigateTopic?: string;       // default 'frigate'
  valetudoNs?: string;         // default 'valetudo'
}

// Alert Center config (Alert Center feature, Track A). Top-level, optional. The
// collectors (persistent_notification subscription + Repairs poll) run whenever
// connected unless `enabled === false`. Per-source toggles + a severity floor
// for Repairs. Must be added to Planner._loadFromHa's explicit field list (the
// standard gotcha) or it resets on load. See src/alerts.ts.
export interface AlertsConfig {
  enabled?: boolean;                 // master; absent = on (opt-out)
  showPersistentNotifications?: boolean;  // default true
  showRepairs?: boolean;             // default true (silently no-ops if the HA user isn't admin)
  minRepairSeverity?: 'warning' | 'error' | 'critical';  // default 'warning'
  showInKiosk?: boolean;             // default false — Repairs/notification text can be
                                     // instance-specific; opt-in to expose the bell on kiosk/view
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
  alerts?: AlertsConfig;             // Alert Center (persistent notifications + Repairs surfacing)
  geo?: GeoConfig;                   // landmarks + lat/lon↔plan calibration (Feature G)
  mqttBridge?: MqttBridgeConfig;     // direct-MQTT bridge (Phase 5) — secrets stay in localStorage
  neighborhood?: NeighborhoodConfig; // OpenFreeMap neighborhood overlay (buildings/roads/water/landuse)
  flights?: FlightsConfig;           // live aircraft (ADS-B) + ISS sky overlay (roadmap P4)

  avatarPacks?: Record<string, AvatarPackConfig>;   // per-pack loaded/active/members (avatar packs)
  notes?: string;                    // free-text description of this configuration; shown in Settings ▸ Data; rides export/import
  avatarInteractions?: boolean;      // synthetic avatars (ai/roam) walk up to UNBOUND interactive devices and flip them (session-only); absent/true = on, false = off
  avatarCostumes?: boolean;          // situational costume/outfit swaps on avatar rigs (sleep/exercise/cooking); absent/true = on, false = off
  avatarProps?: boolean;             // shared prop library — avatars pick up & use household objects (vacuum/broom/umbrella/snacks/…); absent/true = on, false = off
  showFloorStats?: boolean;          // bottom-right floor info readout ("<name> — N sensors, N walls, W×D"); absent/true = on, false = off
  bgText?: BgTextConfig;             // LEGACY single background text — migrated once into bgTexts, then ignored (read for migration only)
  bgTexts?: BgTextEntry[];           // playful background text, up to 6 entries (skywriting / banner / grass / train / chopper)
  heatmap?: HeatmapConfig;           // per-room temperature heat-map comfort band (derived visual layer)
  compass?: CompassConfig;           // on-screen compass overlay + in-plan north marker
}

// On-screen compass overlay (a movable widget like the weather chip) + the
// optional in-plan north icon. North resolves from the geo-landmark fit
// ('auto', the default) or a manual bearing; `manualNorthDeg` uses the SAME
// convention as GeoConfig.northDeg — the compass bearing (° CW from true
// north) that plan +Y faces. Store-level; in Planner._loadFromHa's explicit
// field list. Pure resolution math lives in src/compass.ts.
export interface CompassConfig {
  show?: boolean;              // default false (opt-in overlay)
  source?: 'auto' | 'manual';  // default 'auto' (landmarks when fitted, else manual, else plan-up)
  manualNorthDeg?: number;     // bearing plan +Y faces (° CW from true north) — geo.northDeg convention
  anchor?: 'tl' | 'tm' | 'tr' | 'bl' | 'bm' | 'br';  // widget corner (chipAnchorStyle); default 'tr'
  custom?: { x: number; y: number };  // px offsets from the anchor's edges; wins over `anchor`
  showNorthMarker?: boolean;   // default false — draw the north icon just off the slab edge (2D + 3D)
  markerScale?: number;        // north-icon size multiplier (default 1, clamped 0.5..4 by markerScaleOf)
}

// Per-room temperature heat-map config (derived visual layer — no new binding).
// Rooms are shaded by the mean of the temperature EnvSensors (+ a bound
// thermostat's current_temperature when placed inside the room's wall loop)
// that resolve into their wall loop. `comfortLo`/`comfortHi` (°C, stored in °C
// regardless of the imperial display flag) define the neutral comfort band;
// below/above it the fill shifts cool-blue / warm-red (see heatmapColor in
// geometry.ts). Store-level (property-wide), NOT per-floor. In
// Planner._loadFromHa's explicit field list.
export interface HeatmapConfig {
  comfortLo?: number;   // °C; default 20 (below → cool/cold)
  comfortHi?: number;   // °C; default 24 (above → warm/hot)
}

// ── Playful background text ───────────────────────────────────────────────
// A short decorative message written INTO the 3D world (not a UI toast). The
// displayed string is the bound entity's formatted state (formatEntityValue)
// when `entityId` is set, else the static `text` (capped ~40 chars). Store-level
// (property-wide, like Store.weather); MUST be in Planner._loadFromHa's field list.
export type BgTextMode = 'off' | 'sky' | 'banner' | 'grass';
export interface BgTextConfig {
  mode?: BgTextMode;             // off (default) / sky (skywriting) / banner (tow plane) / grass (lawn decal)
  text?: string;                 // static message (used when no entity is bound)
  entityId?: string;            // optional bound entity — its formatted state replaces `text`
  format?: InfoCardFormat;       // formatting for the bound entity's value (precision / unit / mapping / …)
}

// Multi-instance background text (up to 6 entries). Each entry is one decorative
// message written into the 3D world in one of five styles. Supersedes the legacy
// single BgTextConfig above (which is migrated once into a bgTexts entry and then
// ignored — kept for migration only, never written again). `train`/`chopper` tow
// a message around/above the yard; `maxCars` is train-only.
export type BgTextEntryMode = 'sky' | 'banner' | 'grass' | 'train' | 'chopper';
export interface BgTextEntry {
  id: string;                    // stable per-entry id (rig key + list identity)
  mode: BgTextEntryMode;
  text?: string;                 // static message (used when no entity is bound)
  entityId?: string;             // optional bound entity — its formatted state replaces `text`
  format?: InfoCardFormat;       // formatting for the bound entity's value
  maxCars?: number;              // train-only: cap on message cars (default 8, clamp 2..12)
  // banner-only: build the tow aircraft from one of the eight FLIGHT archetypes
  // (see AircraftArchetype in src/aircraft-types.ts — 'ga-high' | 'ga-low' |
  // 'twin-prop' | 'turboprop' | 'narrowbody' | 'widebody' | 'bizjet' | 'heli')
  // instead of the classic toy tow plane. ABSENT (or an unknown string) = the
  // toy plane, byte-identical to the shipped build. Civil paint, no status
  // beacons / privacy dimming / livery lettering — this is a message prop, not
  // live traffic. `heli` flies the same banner orbit with its rotors spinning
  // (the dedicated news-chopper build stays on `mode: 'chopper'`).
  aircraft?: string;
  // Model size multiplier for THIS entry's whole rig (default 1, clamp 0.5..5):
  // train consist + car text planes, tow plane + banner, chopper + banner, sky
  // sprite, grass decal. Purely a display preference — the orbit radius, flight
  // altitude and train loop are unchanged, so a bigger model just reads better
  // from a zoomed-out camera (the world grew ~190× across the frustum work; the
  // toys never shrank).
  scale?: number;
  grassAreaId?: string;          // grass-only: a Floor.groundAreas id to fit the text INTO
                                 // (bbox inset ~10%). Store-level bgTexts + per-floor ground
                                 // areas → a stale id (area not on the current floor) fails
                                 // soft, falling back to auto margin-strip placement.
  // Ground-writing (mode 'grass') ORIENTATION. Both fields are grass-only —
  // every other mode ignores them — and both ABSENT reproduces the shipped
  // behaviour byte-for-byte.
  //   faceCamera  absent/true  = autofollow: the decal turns to stay readable
  //                              from wherever the camera is (the shipped look).
  //               false        = STATIC: the decal is pinned to `rotationDeg`.
  //   rotationDeg  the static plan rotation in degrees, read ONLY when
  //                faceCamera === false (absent = 0). Follows the repo-wide
  //                angle convention — 0 = the text's TOP points at world +Y
  //                (screen-up in the 2D top view), increasing degrees turn the
  //                writing screen-CLOCKWISE — the same convention as
  //                Light.rotation / Furniture.rotation.
  // NB Planner.rotateFloorContent deliberately does NOT rotate this: bgTexts are
  // STORE-level, not per-floor, so a message the user aimed at the driveway stays
  // aimed when one floor's plan is re-oriented.
  faceCamera?: boolean;
  rotationDeg?: number;
}

// ── Multiple-configuration registry (Batch B) ─────────────────────────────
// A saved floor-plan configuration. The full Store body lives at HA user_data
// key `diorama-cfg-<id>` (+ the active one mirrored in the diorama:store:v1
// localStorage cache); this lightweight record lives in the index.
export interface ConfigMeta { id: string; name: string; updatedAt: number; }
// The registry index (HA user_data key `diorama-configs` + localStorage cache
// `diorama:configs`). `activeId` is the last-active selection restored on load.
export interface ConfigIndex { version: 1; activeId: string; configs: ConfigMeta[]; }

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
  labels?: boolean;     // room + AREA name labels (2D room text/ground-area/pool names + 3D room billboards)
  objectLabels?: boolean; // NAME/caption text on fixtures + structural items (2D); default ON. State/value readouts are NOT names and stay under each item's own layer.
  openingStatus?: boolean; // OPEN/closed/NN% STATE badge on the door + window pills (2D only — 3D has no door/window status text); default ON. Scoped to openings: other fixtures' state badges stay under their own layers.
  openings?: boolean;   // doors + windows (2D glyphs/pills + the 3D _doorGroup, which also carries curtains + deadbolts); default ON
  peekFloors?: boolean; // onion-skin wall outlines of other floors flagged peek2d (2D); default ON
  furniture?: boolean;  // non-appliance furniture (appliances ride their own key)
  appliances?: boolean; // appliance furniture (fridge/stove/tv/…, cat === 'appliance')
  lights?: boolean;     // light fixture markers
  switches?: boolean;   // switch fixture markers (split from lights)
  sensors?: boolean;    // mmWave bodies + coverage wedges
  motion?: boolean;     // motion sensor bodies + cones
  env?: boolean;
  info?: boolean;       // info-card plaques (2D chip + 3D sprite/plane); default on
  robots?: boolean;     // robot vacuum / mower docks + moving bodies (2D + the 3D _robotGroup/_robotRigGroup); default ON. Split off `sensors` so a plan can hide the household robots without losing the mmWave fixtures.
  zones?: boolean;      // LD2450 zone polys + halos
  targets?: boolean;    // live target dots
  activity?: boolean;   // default OFF: glow pools for lights that are ON + active motion
  geo?: boolean;        // geo landmark pins (+ GPS device pins in G2); 2D-only this phase
  weatherFx?: boolean;  // 3D outdoor weather effects (rain/snow/fog/lightning/wind); default on (W2)
  nameLabels?: boolean; // name labels above confident rigs/dots (fused mmWave + identified BLE); default on (B3)
  battery?: boolean;    // low-battery warning badges on bound fixtures (2D); default on
  grid?: boolean;       // 3D ground grid helper; default on (3D-only — no 2D plan grid exists)
  ground?: boolean;     // ground / yard covering polygons (2D fill + 3D patches); default on
  vacuumMap?: boolean;  // Valetudo robot room-map overlay (2D fill + 3D patches); default OFF (diagnostic)
  heatmap?: boolean;    // per-room temperature heat-map (2D fill + label, 3D patches); default OFF (opt-in analysis view)
  dimensions?: boolean; // rulers + wall/structure dimension lines (2D); default ON
  neighborhood?: boolean; // OpenFreeMap neighborhood overlay (3D buildings this wave); default ON — but the FEATURE is opt-in via neighborhood.enabled, so this leaks nothing on its own
  flights?: boolean;      // live aircraft + ISS sky overlay; default ON — but the FEATURE is opt-in via flights.enabled, so this leaks nothing on its own
  bgText?: boolean;       // decorative background-text rigs (skywriting / banner plane / grass message / train / news chopper); default ON. 3D-ONLY — these have no 2D drawing, so the flag gates only three-view's updateBgTexts feed.
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
