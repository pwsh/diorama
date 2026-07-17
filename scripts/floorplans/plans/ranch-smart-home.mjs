// Ranch — Smart Home — a fully-instrumented variation of the "Maple Grove"
// ranch (docs/demo-houses/ranch-3bed.md). It reuses the EXACT same shell as
// ranch-3bed.mjs via the shared `buildRanchBones(b)` builder, then layers on a
// smart-home fixture kit: demo AI-avatar motion sensors, environmental sensors,
// a robot vacuum, smoke + CO detectors, a family-room fireplace, and a handful
// of always-on accent lights so the plan renders lively out of the box. Every
// fixture is UNBOUND (entity_id null) — a self-contained demo that shows the
// hardware kit without needing a live Home Assistant.
//
// MotionSensor / EnvSensor / RobotFixture / SafetySensor have no lib.mjs helper,
// so they're constructed inline to match src/types.ts (ids via the shared
// per-plan id counter `b.id(...)`).
import { floorplan } from '../lib.mjs';
import { buildRanchBones } from './ranch-3bed.mjs';

export const id = 'ranch-smart-home';
export const name = 'Ranch — Smart Home';

export function build() {
  const b = floorplan(id);
  const { floor, light, roamer, assembleStore, id: nid } = b;
  const bones = buildRanchBones(b);

  // --- Demo AI-avatar motion sensors (avatar + demo => always-on presences) ---
  // Omnidirectional binary-motion fixtures that project a wandering demo avatar
  // confined to their home room. Placed in the three most-lived-in rooms.
  const motionSensors = [
    {
      id: nid('mo'), x: 11950, y: 1900, heading: 0, fov: 360, range: 5000,
      label: 'Living Room presence', entity_id: null, color: '#4fc3f7',
      avatar: true, demo: true, avatarKinds: ['adult', 'professional'],
    },
    {
      id: nid('mo'), x: 11950, y: 8500, heading: 0, fov: 360, range: 5000,
      label: 'Family Room presence', entity_id: null, color: '#ba68c8',
      avatar: true, demo: true, avatarKinds: ['teen', 'athlete'],
    },
    {
      id: nid('mo'), x: 3950, y: 6000, heading: 0, fov: 360, range: 4000,
      label: 'Corridor presence', entity_id: null, color: '#81c784',
      avatar: true, demo: true, avatarKinds: ['child', 'elder'],
    },
  ];

  // --- Environmental sensors (temperature / humidity / CO2 in key rooms) ---
  const envSensors = [
    { id: nid('env'), x: 11950, y: 2600, entity_id: null, kind: 'temperature', label: 'Living temp', height: 1500 },
    { id: nid('env'), x: 6200, y: 6300, entity_id: null, kind: 'humidity', label: 'Hall Bath RH', height: 1500 },
    // Kitchen has no exterior window in this plan — a good spot to show CO2.
    { id: nid('env'), x: 9600, y: 5400, entity_id: null, kind: 'co2', label: 'Kitchen CO₂', height: 1500 },
    { id: nid('env'), x: 19050, y: 3050, entity_id: null, kind: 'temperature', label: 'Garage temp', height: 1500 },
  ];

  // --- Robot vacuum + dock in the living area (unbound => autonomous roam) ---
  const robots = [
    { id: nid('rv'), x: 8300, y: 3400, kind: 'vacuum', entity_id: null, label: 'Living Room vacuum' },
  ];

  // --- Smoke + CO detectors (unbound => click / demo-testable) ---
  const safetySensors = [
    { id: nid('sf'), x: 3950, y: 4500, kind: 'smoke', entity_id: null, label: 'Corridor smoke' },
    { id: nid('sf'), x: 15500, y: 5000, kind: 'co', entity_id: null, label: 'Garage-side CO' },
  ];

  // --- Extra "lived-in" lights: a family-room fireplace + always-on accents ---
  // (These continue the shared shell's light ids; they're unbound with varied
  //  iconKinds. localState 'on' makes them glow with no HA connection.)
  const extraLights = [
    light(8050, 8500, { iconKind: 'fireplace', rotation: 90, label: 'Family fireplace', localState: 'on' }),
    light(9200, 1500, { iconKind: 'lamp', height: 1400, label: 'Living lamp', localState: 'on' }),
    light(8300, 9500, { iconKind: 'lamp', height: 1400, label: 'Family lamp', localState: 'on' }),
    light(8100, 4200, { iconKind: 'under_cabinet', rotation: 90, length: 1600, label: 'Kitchen under-cabinet', localState: 'on' }),
  ];

  const f = floor({
    name: 'Main Floor', w: bones.W, d: bones.D,
    walls: bones.walls, rooms: bones.rooms, doors: bones.doors, windows: bones.windows,
    furniture: bones.furniture, lights: [...bones.lights, ...extraLights], switches: bones.switches,
    motionSensors, envSensors, robots, safetySensors,
    look3d: bones.look3d,
  });

  const roamers = [
    roamer('Casey', ['adult', 'professional'], { color: '#4dd0e1' }),
    roamer('Scout', ['dog'], { color: '#a1887f' }),  // family dog (quadruped rig)
  ];

  return assembleStore({
    name,
    floors: [f],
    scene3d: {
      preset: 'dusk', lightMode: 'clock',
      floorTex: 'wood', floorColor: '#b8875a', wallColor: '#e8e2d2',
      wallCutaway: true, plumbobs: true,
    },
    roamers,
    notes: [
      '~1,723 sq ft (160 m²) heated + 400 sq ft garage · 1 floor · 15 rooms · smart-home demo',
      '',
      'The "Maple Grove" ranch wired up as a self-contained smart-home showcase. Same',
      'walls, rooms, doors, windows, and furniture as the base Ranch plan (shared from',
      'the same builder), plus a full sensor + fixture kit — every device UNBOUND so it',
      'demos without a live Home Assistant. Demo AI avatars wander the busiest rooms, a',
      'robot vacuum patrols the living area, environmental + safety sensors dot the key',
      'rooms, a fireplace warms the family room, and several accent lights start on. The',
      'dusk clock-lighting preset lets the always-on lights carry the scene.',
      '',
      'Smart-home kit by room:',
      'Living Room: demo AI-avatar presence sensor (adult/professional pool), a',
      '  temperature env sensor, the robot-vacuum dock, and an always-on floor lamp.',
      'Family Room: demo AI-avatar presence sensor (teen/athlete pool), a west-wall',
      '  fireplace light (on) and an always-on sectional lamp.',
      'Corridor: demo AI-avatar presence sensor (child/elder pool) + a smoke detector',
      '  covering both bedroom-wing legs.',
      'Kitchen: a CO₂ env sensor (the kitchen has no exterior window — good to monitor)',
      '  and an always-on under-cabinet LED strip.',
      'Hall Bath: a humidity env sensor.',
      'Garage: a temperature env sensor + a CO detector near the garage service door',
      '  (attached-garage CO is the classic risk).',
      '',
      'Everything else — the three bedrooms, primary suite, dining, laundry, office nook,',
      'and garage furnishings — matches the base Ranch plan exactly.',
    ].join('\n'),
  });
}
