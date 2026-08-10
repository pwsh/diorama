// Pocket Zoo — Toon Safari. A single-level, mostly-OUTDOOR showcase on an
// 18000 × 14000 mm lot: an entry plaza, five fenced animal enclosures, a keeper
// hut, and a picnic lawn.
//
// The showcase idea: each enclosure is a CLOSED fence loop (chain-link /
// picket), which makes it a real wall loop and therefore a real Room. A demo
// motion sensor dropped INSIDE that loop projects an always-on AI avatar that
// the renderer hard-confines to its home room (`_aiHomeLoop`), so one animal
// lives in each pen and stays there with no scripting. Visitors are free-range
// `roamers` (no confinement) who wander the paths — and every pen carries a
// keeper GATE, which is also what keeps the nav graph connected (validator
// check 11 wants every room in ONE nav region).
//
// Every animal avatar comes from the BASE packs — `base-zoo-animals`
// (lion/tiger/elephant/giraffe/zebra/bear/panda/hippo/monkey/gorilla/penguin/
// kangaroo) and `base-domestic-animals` (dog) — which ship loaded + active by
// default, so this plan needs no `avatarPacks` opt-in.
//
// Boundary note: the perimeter hedge is deliberately an OPEN polyline (two runs
// meeting at the SW corner, with a 3200 mm gap at the entry) so it never traces
// a closed loop. If it did, every enclosure anchor would sit inside BOTH its own
// pen loop and the perimeter loop, and `loopContaining` (first match wins) could
// resolve a pen to the whole lot.
import { floorplan } from '../lib.mjs';

export const id = 'zoo';
export const name = 'Pocket Zoo — Toon Safari';

const W = 18000, D = 14000;

// Enclosure rectangles [x0, y0, x1, y1] — fence CENTERLINES (walls are 100 thick).
const SAVANNA = [1800, 8200, 6200, 12800];
const BIGCAT = [7600, 8200, 11200, 12800];
const BEAR = [12600, 8200, 16400, 12800];
const PENGUIN = [1800, 3400, 5400, 6000];
const PRIMATE = [12800, 3400, 16400, 6000];
const HUT = [6400, 3400, 9000, 5800];

const loop = ([x0, y0, x1, y1]) => [
  { x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }, { x: x0, y: y0 },
];

export function build() {
  const b = floorplan(id);
  const { wall, room, door, win, furn, light, switchFix, roamer, floor, assembleStore, id: nid } = b;

  // ── Structure ────────────────────────────────────────────────────────────
  const walls = [
    // Perimeter hedge — OPEN at the entry (see header note).
    wall([
      { x: 10600, y: 700 }, { x: 17300, y: 700 }, { x: 17300, y: 13300 },
      { x: 700, y: 13300 }, { x: 700, y: 700 },
    ], 'hedge'),
    wall([{ x: 700, y: 700 }, { x: 7400, y: 700 }], 'hedge'),
    // Enclosures.
    wall(loop(SAVANNA), 'fence_chainlink'),
    wall(loop(BIGCAT), 'fence_chainlink'),
    wall(loop(BEAR), 'fence_chainlink'),
    wall(loop(PENGUIN), 'fence_picket'),
    wall(loop(PRIMATE), 'fence_chainlink'),
    // Keeper hut — the one real building.
    wall(loop(HUT)),
  ];

  const rooms = [
    room('Savanna Paddock', 4000, 10500),
    room('Big Cat Bluff', 9400, 10500),
    room('Bear Hollow', 14500, 10500),
    room('Penguin Cove', 3600, 4600),
    room('Primate Island', 14600, 4700),
    room('Keeper Hut', 8300, 5200),
  ];

  // Keeper gates (`kind: 'gate'` — the picket-styled swing panel) + the hut
  // door. (x, y) is the HINGE; doorSpanCenter offsets by w/2 along `rotation`.
  const doors = [
    door(3400, 8200, 0, { w: 1000, kind: 'gate', label: 'Savanna gate' }),
    door(8900, 8200, 0, { w: 1000, kind: 'gate', label: 'Big Cat gate' }),
    door(14000, 8200, 0, { w: 1000, kind: 'gate', label: 'Bear Hollow gate' }),
    door(3000, 6000, 0, { w: 1000, kind: 'gate', label: 'Penguin gate' }),
    door(14000, 6000, 0, { w: 1000, kind: 'gate', label: 'Primate gate' }),
    door(7200, 5800, 0, { w: 900, label: 'Keeper Hut' }),
  ];

  const windows = [
    win(9000, 4400, 90, { w: 1000, sill: 900, height: 1000, label: 'Hut east' }),
    win(6400, 4400, 90, { w: 1000, sill: 900, height: 1000, label: 'Hut west' }),
  ];

  // ── Ground paint ─────────────────────────────────────────────────────────
  const ground = (kind, points) => ({ id: nid('ga'), kind, points });
  const rect = (x0, y0, x1, y1) => [
    { x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 },
  ];
  const groundAreas = [
    // Base lawn over the whole lot, then the hardscape on top.
    ground('grass', rect(700, 700, 17300, 13300)),
    ground('concrete', rect(700, 700, 17300, 3300)),          // entry plaza
    ground('blacktop', rect(1400, 6200, 16600, 7800)),        // main promenade
    ground('concrete', rect(9500, 3300, 10700, 6200)),        // north–south spine
    ground('concrete', rect(3400, 7800, 4400, 8300)),         // Savanna gate spur
    ground('concrete', rect(8900, 7800, 9900, 8300)),         // Big Cat gate spur
    ground('concrete', rect(14000, 7800, 15000, 8300)),       // Bear gate spur
    ground('concrete', rect(3000, 5900, 4000, 6300)),         // Penguin gate spur
    ground('concrete', rect(14000, 5900, 15000, 6300)),       // Primate gate spur
    ground('concrete', rect(7100, 5700, 8200, 6300)),         // hut path
    // Habitats.
    ground('sand', rect(1900, 8300, 6100, 12700)),
    ground('rock', rect(7700, 8300, 11100, 12700)),
    ground('grass', rect(12700, 8300, 16300, 12700)),
    ground('water', rect(13100, 10500, 15300, 12200)),        // bear pond
    ground('water', rect(1900, 3500, 5300, 5100)),            // penguin pool
    ground('rock', rect(1900, 5100, 5300, 5900)),             // penguin haul-out
    ground('grass', rect(12900, 3500, 16300, 5900)),
    ground('mulch', rect(15700, 3600, 16300, 5800)),
    // Picnic lawn on the plaza's east end.
    ground('grass', rect(10900, 800, 16200, 2600)),
  ];

  // ── Furniture ────────────────────────────────────────────────────────────
  const flagpole = {
    ...furn('block', 6400, 1300, { w: 400, h: 400, label: 'Zoo flagpole' }),
    customKindId: 'zoo-flagpole',
  };

  const furniture = [
    // Entry plaza.
    furn('counter', 6000, 2200, { rotation: 0, w: 1800, h: 650, label: 'Ticket counter' }),
    furn('stool', 6000, 1500, { rotation: 180, label: 'Ticket stool' }),
    flagpole,
    furn('bench', 8000, 1500, { rotation: 180 }),
    furn('bench', 4000, 1500, { rotation: 180 }),
    furn('trash_bin', 10200, 1250, { rotation: 0 }),
    furn('recycle_bin', 15600, 1200, { rotation: 0 }),
    // Picnic lawn.
    furn('picnic_table', 11900, 1600, { rotation: 0 }),
    furn('palm_tree', 1900, 2000, { rotation: 0, label: 'Plaza palm' }),
    furn('ramp', 10100, 4700, { rotation: 0, label: 'Spine accessibility ramp' }),
    // rot 180 = seats face the open grounds; at 0 they faced the north fence
    // 250 mm away with the whole picnic lawn behind them.
    furn('lawn_chair', 13500, 1600, { rotation: 180 }),
    furn('lawn_chair', 14400, 1600, { rotation: 180 }),
    furn('bird_bath', 15300, 2000, { rotation: 0 }),

    // Savanna Paddock.
    furn('tree', 2600, 11800, { rotation: 0 }),
    furn('tree', 5400, 12000, { rotation: 0 }),
    furn('rock_cluster', 2300, 10500, { rotation: 0 }),  // shifted west to open the browse lawn
    furn('spruce_tree', 4050, 10500, { rotation: 0, label: 'Savanna shade spruce' }),
    furn('rock_cluster', 2400, 9400, { rotation: 0 }),
    furn('bush', 5500, 9200, { rotation: 0 }),
    furn('bush', 2500, 12300, { rotation: 0 }),

    // Big Cat Bluff.
    furn('rock_cluster', 9800, 11800, { rotation: 0 }),
    furn('rock_cluster', 8500, 12100, { rotation: 0 }),
    furn('rock_cluster', 10400, 9400, { rotation: 90 }),
    furn('pine_tree', 8300, 10600, { rotation: 0 }),
    furn('bush', 10600, 12300, { rotation: 0 }),

    // Bear Hollow.
    furn('tree', 13400, 9300, { rotation: 0 }),
    furn('pine_tree', 15700, 12100, { rotation: 0 }),
    furn('pine_tree', 13300, 12300, { rotation: 0 }),
    furn('rock_cluster', 15600, 9400, { rotation: 0 }),
    furn('bush', 15900, 10800, { rotation: 0 }),

    // Penguin Cove.
    furn('rock_cluster', 2500, 4100, { rotation: 0 }),
    furn('rock_cluster', 4700, 4000, { rotation: 90 }),
    furn('bird_bath', 4800, 5400, { rotation: 0 }),
    furn('bush', 2300, 5400, { rotation: 0 }),

    // Primate Island.
    furn('swingset', 14500, 4200, { rotation: 0, w: 2400, h: 1300, label: 'Climbing frame' }),
    furn('bush', 13300, 5500, { rotation: 0 }),
    furn('rock_cluster', 15800, 5500, { rotation: 0 }),

    // Keeper hut interior.
    furn('desk', 7300, 4000, { rotation: 180, label: 'Keeper desk' }),
    furn('chair', 7300, 4750, { rotation: 0 }),
    furn('cabinet', 8650, 4000, { rotation: 90, label: 'Feed store' }),
    furn('bookshelf', 6700, 4600, { rotation: 270, label: 'Vet manuals' }),

    // Promenade planting.
    furn('tree', 1250, 7400, { rotation: 0 }),
    furn('bush', 16850, 7400, { rotation: 0 }),
    furn('flower_bed', 11900, 7000, { rotation: 0 }),
    furn('flower_bed', 6800, 7000, { rotation: 0 }),
  ];

  // ── Lights (all UNBOUND; localState 'on' so the lot glows with no HA) ─────
  const lights = [
    light(9000, 900, { iconKind: 'flood', rotation: 0, radius: 2400, label: 'Entry flood', localState: 'on' }),
    light(9000, 2400, { iconKind: 'string', rotation: 0, length: 7000, label: 'Plaza string lights', localState: 'on' }),
    light(3900, 7000, { iconKind: 'lamp', height: 3200, radius: 1700, label: 'Promenade lamp W', localState: 'on' }),
    light(9400, 7000, { iconKind: 'lamp', height: 3200, radius: 1700, label: 'Promenade lamp C', localState: 'on' }),
    light(14500, 7000, { iconKind: 'lamp', height: 3200, radius: 1700, label: 'Promenade lamp E', localState: 'on' }),
    light(2600, 11200, { iconKind: 'ground_spot', rotation: 0, label: 'Savanna uplight', localState: 'on' }),
    light(9800, 11100, { iconKind: 'ground_spot', rotation: 180, label: 'Bluff uplight', localState: 'on' }),
    light(14200, 11300, { iconKind: 'inground', label: 'Bear pond uplight', localState: 'on' }),
    light(3600, 4300, { iconKind: 'inground', label: 'Penguin pool uplight', localState: 'on' }),
    light(15000, 4700, { iconKind: 'ground_spot', rotation: 270, label: 'Primate uplight', localState: 'on' }),
    light(10100, 5000, { iconKind: 'step', label: 'Spine step light', localState: 'on' }),
    light(8200, 5200, { iconKind: 'bulb', height: 2400, label: 'Keeper Hut' }),
  ];

  const switches = [
    switchFix(7200, 5700, { rotation: 0, label: 'Hut lights' }),
    switchFix(6000, 2600, { rotation: 180, label: 'Plaza lights' }),
  ];

  // ── Live inhabitants ─────────────────────────────────────────────────────
  // One demo motion sensor per enclosure. `avatar: true, demo: true` = an
  // always-on AI presence needing no entity binding; the renderer confines it to
  // the closed wall loop the sensor sits in, so the animal never leaves its pen.
  // A POOL of ≥2 kinds also re-rolls the species on every respawn.
  const motionSensors = [
    {
      id: nid('mo'), x: 4000, y: 10800, heading: 0, fov: 360, range: 6000,
      label: 'Savanna herd', entity_id: null, color: '#e0a63c', plumbobColor: '#ffd54f',
      avatar: true, demo: true, avatarKinds: ['giraffe', 'zebra', 'elephant'],
    },
    {
      id: nid('mo'), x: 2900, y: 9800, heading: 0, fov: 360, range: 6000,
      label: 'Savanna kangaroo', entity_id: null, color: '#c98b4b',
      avatar: true, demo: true, avatarKinds: ['kangaroo'],
    },
    {
      id: nid('mo'), x: 9400, y: 10800, heading: 0, fov: 360, range: 6000,
      label: 'Big Cat Bluff', entity_id: null, color: '#e2703a', plumbobColor: '#ff7043',
      avatar: true, demo: true, avatarKinds: ['lion', 'tiger'],
    },
    {
      id: nid('mo'), x: 14500, y: 10800, heading: 0, fov: 360, range: 6000,
      label: 'Bear Hollow', entity_id: null, color: '#8d6e63', plumbobColor: '#a1887f',
      avatar: true, demo: true, avatarKinds: ['bear', 'panda'],
    },
    {
      id: nid('mo'), x: 3600, y: 4500, heading: 0, fov: 360, range: 5000,
      label: 'Penguin Cove', entity_id: null, color: '#4fc3f7', plumbobColor: '#81d4fa',
      avatar: true, demo: true, avatarKinds: ['penguin', 'hippo'],
    },
    {
      id: nid('mo'), x: 14600, y: 5400, heading: 0, fov: 360, range: 5000,
      label: 'Primate Island', entity_id: null, color: '#81c784', plumbobColor: '#a5d6a7',
      avatar: true, demo: true, avatarKinds: ['monkey', 'gorilla'],
    },
  ];

  const envSensors = [
    { id: nid('env'), x: 4000, y: 8900, entity_id: null, kind: 'temperature', label: 'Savanna temp', height: 1600 },
    { id: nid('env'), x: 3600, y: 5600, entity_id: null, kind: 'humidity', label: 'Penguin RH', height: 1600 },
    { id: nid('env'), x: 8300, y: 5400, entity_id: null, kind: 'co2', label: 'Hut CO₂', height: 1500 },
    { id: nid('env'), x: 9000, y: 3000, entity_id: null, kind: 'illuminance', label: 'Plaza lux', height: 1600 },
  ];

  const cameras = [
    { id: nid('cam'), x: 9000, y: 1100, rotation: 0, fov: 100, range: 9000, height: 3200, entity_id: null, label: 'Entry cam' },
    { id: nid('cam'), x: 9400, y: 7600, rotation: 0, fov: 90, range: 7000, height: 3000, entity_id: null, label: 'Bluff cam' },
  ];

  const safetySensors = [
    { id: nid('sf'), x: 7800, y: 4200, kind: 'smoke', entity_id: null, label: 'Keeper Hut smoke' },
  ];

  // ── Custom object: the entry flagpole ────────────────────────────────────
  const customObjects = [
    {
      id: 'zoo-flagpole', label: 'Flagpole', w: 400, h: 400, ht: 5200,
      back: 'none', color: 0xb0bec5, frontArrow: false,
      primitives: [
        { shape: 'cylinder', size: [220, 260, 120], pos: [0, 60, 0], color: '#78909c' },
        { shape: 'cylinder', size: [55, 80, 5000], pos: [0, 2620, 0], color: '#cfd8dc' },
        { shape: 'sphere', size: [95, 0, 0], pos: [0, 5180, 0], color: '#ffd54f' },
        { shape: 'box', size: [1200, 720, 26], pos: [600, 4460, 0], color: '#2e7d32' },
        { shape: 'box', size: [1200, 200, 32], pos: [600, 4820, 0], color: '#f5f5f5' },
      ],
    },
  ];

  const f = floor({
    name: 'Zoo Grounds', w: W, d: D,
    walls, rooms, doors, windows, furniture, lights, switches,
    motionSensors, envSensors, cameras, safetySensors, groundAreas,
    look3d: { floorTex: 'none', floorColor: '#5f8f42', wallColor: '#cfd8dc' },
  });

  const roamers = [
    roamer('Visitor — Nadia', ['adult', 'supermodel'], { color: '#f06292' }),
    roamer('Visitor — Bo', ['child', 'teen'], { color: '#4fc3f7' }),
    roamer('Keeper Sam', ['farmer', 'professional'], { color: '#8bc34a' }),
    roamer('Zoo dog', ['dog'], { color: '#a1887f' }),
  ];

  return assembleStore({
    name,
    floors: [f],
    customObjects,
    scene3d: {
      preset: 'day', lightMode: 'clock',
      floorTex: 'none', floorColor: '#5f8f42', wallColor: '#cfd8dc',
      wallCutaway: true, plumbobs: true, skyBackdrop: true, cinematicOrbit: true,
    },
    roamers,
    notes: [
      '252 m² lot (18 × 14 m) · 1 floor · 5 fenced enclosures + keeper hut · mostly outdoor',
      '',
      'A pocket zoo built to show off two things at once: outdoor authoring (fences,',
      'gates, ground paint, yard objects) and CONFINED demo avatars. Each enclosure is a',
      'closed fence loop, which makes it a real wall loop and therefore a real Room; a',
      'demo motion sensor dropped inside that loop projects an always-on AI animal that',
      'the renderer hard-confines to its home room — so the lion stays on the bluff and',
      'the penguin stays in the cove, with no scripting at all. Visitors are free-range',
      'roamers who follow the paths (and, being visitors, occasionally let themselves',
      'through a keeper gate). Because most pens carry a POOL of two or three species,',
      'each respawn re-rolls which animal is out that day.',
      '',
      'LAYOUT — a concrete entry plaza runs the full width of the south edge: ticket',
      'counter and stool, benches, bins, a flagpole, and a picnic lawn at the east end.',
      'A blacktop promenade crosses the middle of the lot with concrete spurs branching',
      'to every gate, and a north–south spine links the plaza to the promenade. The',
      'perimeter is a clipped hedge, left OPEN at the entry.',
      '',
      'ENCLOSURES (each fenced, gated and habitat-painted):',
      '  • Savanna Paddock — chain-link over sand, acacias and rock outcrops. A giraffe /',
      '    zebra / elephant herd plus a resident kangaroo (two sensors, two animals).',
      '  • Big Cat Bluff — chain-link over rock, boulder stacks and a pine. Lion / tiger.',
      '  • Bear Hollow — chain-link over grass with a spring-fed pond and two pines.',
      '    Bear / panda.',
      '  • Penguin Cove — picket fence around a big pool with a rock haul-out ledge and a',
      '    bird bath. Penguin / hippo.',
      '  • Primate Island — chain-link over grass with a climbing frame and a mulch',
      '    border. Monkey / gorilla.',
      '',
      'KEEPER HUT — the only enclosed building: desk and chair, a feed-store cabinet, vet',
      'manuals on a shelf, windows east and west onto the service alleys, a CO₂ probe and',
      'a smoke detector.',
      '',
      'FIXTURES — everything is UNBOUND, so the plan demos with no Home Assistant: an',
      'entry floodlight, plaza string lights, three promenade lamp posts, ground-spot and',
      'in-ground uplights on the habitats, a step light on the spine, temperature /',
      'humidity / CO₂ / lux env sensors, and two security cameras. The entry flagpole is',
      'a custom object recipe (base + pole + gold finial + flag) carried in the config,',
      'so the plan also exercises Store.customObjects.',
      '',
      'AVATARS — every animal comes from the built-in base packs (Zoo Animals, Domestic',
      'Animals), which ship loaded and active, so this plan needs no avatar-pack opt-in.',
      '',
      'Grounds additions: a palm anchoring the entry plaza, a shade spruce in the savanna',
      '  browse lawn (the bulk-stone cluster shifted west to make room), and a step-free',
      '  ramp on the concrete spine between the plaza and the promenade.',
    ].join('\n'),
  });
}
