// Lawn & Garden Center — "The Potting Shed". A FEATURE SHOWCASE for the whole
// yard/terrain arc: a small indoor shop tucked into the south-west corner of a
// 16 × 12 m fenced lot, with the rest of the lot given over to a nursery yard.
//
// What it demonstrates, in one plan:
//   • Ground coverings — grass, rock (gravel), mulch, sand and a water pond,
//     painted as GroundAreas (paint only: they never block nav).
//   • Terraced terrain — a two-tier raised display bed (mulch at +200 mm with a
//     rock cap at +450 mm nested inside it), so the skirt-ring builder and the
//     terrace nav terrain both have something to chew on.
//   • Path ribbons — two `GroundArea.path` centerline ribbons (the derived
//     polygon is computed here with the same mitered-offset math as
//     geometry.ts `bufferPolyline`, so `points` matches what the app would
//     regenerate on the next edit).
//   • Fences + gates — picket along the street frontage, privacy board along the
//     back lot lines, an interior hedge run as a display divider, and two gate
//     doors (`kind: 'gate'`) in the fence.
//   • Yard objects — trees, pines, bushes, flower-bed rows, bird bath, fountain
//     (in the pond), rock clusters, a swing-set display, patio furniture, bins.
//   • Sprinkler zones (rotor + spray), a flagpole flying the OPEN flag, and a
//     robot-mower dock.
//
// LOOPS AND NAV: the shop's four walls plus the four fence runs form ONE closed
// boundary with the shop as an interior chord, so `closedWallLoops` traces two
// faces — the shop rectangle and the L-shaped yard. The potting shed is a third,
// free-standing loop. A door in the shop's east wall, a shed door and two gates
// keep every room in a single nav region; the hedge run and each planting row
// leave walkable bands at both ends.
import { floorplan } from '../lib.mjs';

export const id = 'garden-center';
export const name = 'Lawn & Garden Center — The Potting Shed';

// Mitered-offset ribbon — a local mirror of geometry.ts `bufferPolyline` so the
// stored GroundArea.points cache matches exactly what the app regenerates.
const PATH_MIN_WIDTH = 100, PATH_MITER_LIMIT = 4;
function ribbon(centerline, width) {
  const n = centerline.length;
  if (n < 2) return [];
  const halfW = Math.max(PATH_MIN_WIDTH, width) / 2;
  const segDir = (i) => {
    const a = centerline[i], b = centerline[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  };
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    let mx, my, scale = 1;
    if (i === 0) { const d = segDir(0); mx = -d.y; my = d.x; }
    else if (i === n - 1) { const d = segDir(n - 2); mx = -d.y; my = d.x; }
    else {
      const d0 = segDir(i - 1), d1 = segDir(i);
      const n0x = -d0.y, n0y = d0.x, n1x = -d1.y, n1y = d1.x;
      const sx = n0x + n1x, sy = n0y + n1y, slen = Math.hypot(sx, sy);
      if (slen < 1e-6) { mx = n0x; my = n0y; }
      else {
        mx = sx / slen; my = sy / slen;
        const cos = mx * n0x + my * n0y;
        scale = cos > 1e-3 ? Math.min(PATH_MITER_LIMIT, 1 / cos) : PATH_MITER_LIMIT;
      }
    }
    const off = halfW * scale;
    left.push({ x: centerline[i].x + mx * off, y: centerline[i].y + my * off });
    right.push({ x: centerline[i].x - mx * off, y: centerline[i].y - my * off });
  }
  const out = [];
  for (let i = 0; i < n; i++) out.push({ x: Math.round(left[i].x), y: Math.round(left[i].y) });
  for (let i = n - 1; i >= 0; i--) out.push({ x: Math.round(right[i].x), y: Math.round(right[i].y) });
  return out;
}

export function build() {
  const b = floorplan(id);
  const { wall, room, door, win, furn, light, switchFix, roamer, floor, assembleStore, id: nid } = b;

  const W = 16000, D = 12000;

  // ── Shell: shop box in the SW corner, fences closing the rest of the lot ──
  const walls = [
    wall([{ x: 0, y: 0 }, { x: 6000, y: 0 }]),                    // shop south (street front)
    wall([{ x: 0, y: 0 }, { x: 0, y: 4800 }]),                    // shop west
    wall([{ x: 0, y: 4800 }, { x: 6000, y: 4800 }]),              // shop north (yard side)
    wall([{ x: 6000, y: 0 }, { x: 6000, y: 4800 }]),              // shop east (yard side)
    wall([{ x: 6000, y: 0 }, { x: 16000, y: 0 }], 'fence_picket'),        // street frontage
    wall([{ x: 16000, y: 0 }, { x: 16000, y: 12000 }], 'fence_picket'),   // east lot line
    wall([{ x: 16000, y: 12000 }, { x: 0, y: 12000 }], 'fence_privacy'),  // back lot line
    wall([{ x: 0, y: 12000 }, { x: 0, y: 4800 }], 'fence_privacy'),       // west lot line
    wall([{ x: 7200, y: 8000 }, { x: 11600, y: 8000 }], 'hedge'),         // display divider
    // Potting shed (free-standing loop in the north-east of the yard)
    wall([{ x: 12000, y: 8600 }, { x: 14600, y: 8600 }]),
    wall([{ x: 14600, y: 8600 }, { x: 14600, y: 10800 }]),
    wall([{ x: 14600, y: 10800 }, { x: 12000, y: 10800 }]),
    wall([{ x: 12000, y: 10800 }, { x: 12000, y: 8600 }]),
  ];

  const rooms = [
    room('Garden Shop', 3000, 2400),
    room('Nursery Yard', 9000, 5600),
    room('Potting Shed', 13300, 9700),
  ];

  const doors = [
    door(2200, 0, 0, { w: 1600, label: 'Shop entrance', doorbellEntity: null }),
    door(6000, 3600, 90, { w: 1200, label: 'Shop → yard' }),                  // spans y 2400..3600
    door(9000, 0, 0, { w: 1400, kind: 'gate', label: 'Yard gate' }),
    door(16000, 8200, 90, { w: 1600, kind: 'gate', label: 'Delivery gate' }), // spans y 6600..8200
    door(12600, 8600, 0, { w: 900, label: 'Potting shed' }),
  ];

  const windows = [
    win(1200, 0, 0, { w: 1600, kind: 'picture', sill: 900, height: 1500, label: 'Shop front W' }),
    win(4800, 0, 0, { w: 1600, kind: 'picture', sill: 900, height: 1500, label: 'Shop front E' }),
    win(0, 2400, 90, { w: 1400, kind: 'sliding', sill: 1000, height: 1200, label: 'Shop west' }),
    win(3000, 4800, 0, { w: 1800, kind: 'sliding', sill: 900, height: 1400, label: 'Yard view' }),
    win(12000, 9700, 90, { w: 800, kind: 'single', sill: 1100, height: 900, label: 'Shed west' }),
    win(14600, 9700, 90, { w: 800, kind: 'single', sill: 1100, height: 900, label: 'Shed east' }),
  ];

  // ── Ground coverings ─────────────────────────────────────────────────────
  const ga = (kind, points, extra = {}) => ({ id: nid('ga'), kind, points, ...extra });
  const rect = (x0, y0, x1, y1) => [
    { x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 },
  ];
  const pathMain = [
    { x: 6300, y: 3000 }, { x: 11800, y: 3000 }, { x: 11800, y: 8200 }, { x: 13050, y: 8200 },
  ];
  const pathSpur = [{ x: 9700, y: 300 }, { x: 9700, y: 2400 }];

  const groundAreas = [
    // Base lawn: the east yard plus the west arm behind the shop.
    ga('grass', rect(6100, 100, 15900, 11900), { name: 'East lawn' }),
    ga('grass', rect(100, 4900, 6100, 11900), { name: 'West lawn' }),
    // Bulk material bays along the street frontage.
    ga('rock', rect(6400, 400, 8600, 2600), { name: 'Gravel bay' }),
    ga('sand', rect(11000, 700, 13400, 2800), { name: 'Paver-sand bay' }),
    // Pond (water paint — no nav block, unlike a real Pool).
    ga('water', rect(13000, 3400, 15700, 6000), { name: 'Display pond' }),
    // Two-tier terraced display bed: mulch podium with a rock cap nested in it.
    ga('mulch', rect(7000, 3800, 11200, 7000), { name: 'Terrace tier 1', elevationMm: 200 }),
    ga('rock', rect(7900, 4500, 10300, 6300), { name: 'Terrace tier 2', elevationMm: 450 }),
    // Perennial beds behind the hedge.
    ga('mulch', rect(6800, 9400, 11800, 11600), { name: 'Perennial beds' }),
    // Path ribbons (points derived from the centerline, exactly like the app).
    ga('concrete', ribbon(pathMain, 1400), { name: 'Main yard path', path: { centerline: pathMain, width: 1400 } }),
    ga('concrete', ribbon(pathSpur, 1200), { name: 'Gate spur', path: { centerline: pathSpur, width: 1200 } }),
  ];

  const furniture = [
    // ── Shop interior ─────────────────────────────────────────────────────
    furn('island', 1500, 2200, { rotation: 0, w: 2000, h: 1000, label: 'Checkout', color: '#4e6b3a' }),
    furn('counter', 1500, 3800, { rotation: 0, w: 2200, h: 700, label: 'Wrap counter' }),
    furn('counter', 3600, 4400, { rotation: 0, w: 1800, h: 650, label: 'Seed & bulb counter' }),
    furn('cabinet', 300, 900, { rotation: 90, label: 'Tool wall' }),
    furn('bookshelf', 5700, 1000, { rotation: 90, label: 'Pot shelving' }),
    furn('bookshelf', 5700, 1900, { rotation: 90, label: 'Fertiliser shelving' }),
    furn('utility_sink', 5600, 4300, { rotation: 0, label: 'Shop potting sink' }),
    furn('plant', 3400, 900, { rotation: 0, label: 'Houseplants' }),
    furn('plant', 4000, 900, { rotation: 0 }),
    furn('plant', 4600, 900, { rotation: 0 }),
    furn('plant', 3400, 1700, { rotation: 0 }),
    furn('plant', 4000, 1700, { rotation: 0 }),
    furn('plant', 4600, 1700, { rotation: 0 }),
    furn('rug', 1500, 1000, { rotation: 0, w: 2400, h: 1400, label: 'Entry mat', color: '#5d4037' }),

    // ── South display strip (street frontage) ─────────────────────────────
    furn('lawn_chair', 6800, 1500, { rotation: 270, label: 'Patio set — chair' }),
    furn('picnic_table', 8600, 1500, { rotation: 0, label: 'Patio set — table' }),
    furn('lawn_chair', 10400, 1500, { rotation: 90, label: 'Patio set — chair' }),
    furn('trash_bin', 11800, 700, { rotation: 0 }),
    furn('recycle_bin', 12500, 700, { rotation: 0 }),
    furn('rock_cluster', 12200, 1600, { rotation: 0, label: 'Boulder display' }),
    furn('bird_bath', 13000, 2200, { rotation: 0 }),
    furn('pine_tree', 14600, 900, { rotation: 0 }),
    furn('rock_cluster', 6900, 700, { rotation: 0 }),

    // ── Terraced display bed ──────────────────────────────────────────────
    furn('flower_bed', 7600, 4100, { rotation: 0, elevation: 200, label: 'Annuals' }),
    furn('flower_bed', 8800, 4100, { rotation: 0, elevation: 200, label: 'Annuals' }),
    furn('flower_bed', 10000, 4100, { rotation: 0, elevation: 200, label: 'Annuals' }),
    furn('bush', 8400, 5400, { rotation: 0, elevation: 450, label: 'Topiary' }),
    furn('rock_cluster', 9100, 5400, { rotation: 0, elevation: 450 }),
    furn('bush', 9800, 5400, { rotation: 0, elevation: 450, label: 'Topiary' }),
    furn('tree', 6800, 6000, { rotation: 0, label: 'Shade tree' }),

    // ── Pond + play display (east yard) ───────────────────────────────────
    furn('fountain', 14300, 4700, { rotation: 0, label: 'Pond fountain' }),
    furn('tree', 15200, 3000, { rotation: 0 }),
    furn('swingset', 13900, 7000, { rotation: 0, label: 'Swing-set display' }),

    // ── Behind the hedge: shrub row + perennial beds ──────────────────────
    furn('bush', 7000, 8600, { rotation: 0 }),
    furn('bush', 8200, 8600, { rotation: 0 }),
    furn('bush', 9400, 8600, { rotation: 0 }),
    furn('bush', 10600, 8600, { rotation: 0 }),
    furn('flower_bed', 7300, 10000, { rotation: 0 }),
    furn('flower_bed', 8500, 10000, { rotation: 0 }),
    furn('flower_bed', 9700, 10000, { rotation: 0 }),
    furn('flower_bed', 10900, 10000, { rotation: 0 }),
    furn('flower_bed', 7300, 11100, { rotation: 0 }),
    furn('flower_bed', 8500, 11100, { rotation: 0 }),
    furn('flower_bed', 9700, 11100, { rotation: 0 }),
    furn('flower_bed', 10900, 11100, { rotation: 0 }),
    furn('pine_tree', 15300, 11200, { rotation: 0 }),

    // ── Potting shed interior ─────────────────────────────────────────────
    furn('counter', 13000, 10400, { rotation: 0, w: 1600, h: 650, label: 'Potting bench' }),
    furn('utility_sink', 14200, 10400, { rotation: 0, label: 'Shed sink' }),
    furn('bookshelf', 12400, 9400, { rotation: 90, label: 'Seed store' }),
    furn('plant', 14200, 9200, { rotation: 0 }),

    // ── West lawn (bulk yard behind the shop) ─────────────────────────────
    furn('bush', 900, 6400, { rotation: 0 }),
    furn('bush', 1900, 6400, { rotation: 0 }),
    furn('rock_cluster', 3000, 6800, { rotation: 0, label: 'Bulk stone' }),
    furn('rock_cluster', 4600, 7400, { rotation: 0, label: 'Bulk stone' }),
    furn('pine_tree', 1200, 9200, { rotation: 0 }),
    furn('pine_tree', 2600, 10400, { rotation: 0 }),
    furn('tree', 4600, 9600, { rotation: 0 }),
    furn('lawn_chair', 1200, 11200, { rotation: 180, label: 'Lounger display' }),
    furn('lawn_chair', 2200, 11200, { rotation: 180, label: 'Lounger display' }),
    // Specimen stock: balled-and-burlapped birch, priced to move.
    furn('birch_tree', 4900, 5800, { rotation: 0, label: 'Birch — specimen stock' }),
    furn('birch_tree', 2100, 7900, { rotation: 0, label: 'Birch — specimen stock' }),
    // Porch-furniture display beside the patio sets.
    furn('rocking_chair', 7000, 2500, { rotation: 0, label: 'Porch rocker display' }),
    furn('rocking_chair', 11200, 1700, { rotation: 0, label: 'Porch rocker display' }),
  ];

  const lights = [
    // Shop
    light(1500, 2200, { iconKind: 'pendant', label: 'Checkout pendant', localState: 'on' }),
    light(3000, 2600, { iconKind: 'strip', rotation: 0, length: 4000, label: 'Shop strip', localState: 'on' }),
    light(4600, 4200, { iconKind: 'round', label: 'Shop back', localState: 'on' }),
    light(300, 3600, { iconKind: 'sconce', rotation: 270, radius: 500, label: 'Tool wall sconce' }),
    // Yard — path markers + accent uplights (the ground light kinds)
    light(7200, 3000, { iconKind: 'inground', label: 'Path marker 1', localState: 'on' }),
    light(9000, 3000, { iconKind: 'inground', label: 'Path marker 2', localState: 'on' }),
    light(10800, 3000, { iconKind: 'inground', label: 'Path marker 3', localState: 'on' }),
    light(11800, 5200, { iconKind: 'inground', label: 'Path marker 4', localState: 'on' }),
    light(11800, 7200, { iconKind: 'inground', label: 'Path marker 5', localState: 'on' }),
    light(6300, 5600, { iconKind: 'ground_spot', rotation: 45, tilt: 55, label: 'Tree uplight', localState: 'on' }),
    light(14200, 3200, { iconKind: 'ground_spot', rotation: 330, tilt: 50, label: 'Pond uplight', localState: 'on' }),
    light(1800, 9600, { iconKind: 'ground_spot', rotation: 300, tilt: 60, label: 'Pine uplight' }),
    light(8600, 2400, { iconKind: 'string', radius: 1600, label: 'Patio string', localState: 'on' }),
    light(6200, 4700, { iconKind: 'flood', rotation: 180, label: 'Yard flood', localState: 'on' }),
    light(15200, 8400, { iconKind: 'flood', rotation: 90, label: 'Delivery flood' }),
    // Shed
    light(13300, 9600, { iconKind: 'jar', label: 'Shed lantern', localState: 'on' }),
  ];

  const switches = [
    switchFix(2000, 200, { rotation: 0, label: 'Shop entry' }),
    switchFix(5800, 4000, { rotation: 90, label: 'Yard lights' }),
    switchFix(12300, 8800, { rotation: 0, label: 'Shed' }),
  ];

  const motionSensors = [
    {
      id: nid('mo'), x: 3000, y: 2600, heading: 0, fov: 360, range: 4500,
      label: 'Shop presence', entity_id: null, color: '#66bb6a',
      avatar: true, demo: true, avatarKinds: ['adult', 'elder'],
    },
    {
      id: nid('mo'), x: 9600, y: 3200, heading: 0, fov: 360, range: 7000,
      label: 'Nursery yard presence', entity_id: null, color: '#8bc34a',
      avatar: true, demo: true, avatarKinds: ['professional', 'farmer', 'adult'],
    },
    {
      id: nid('mo'), x: 3400, y: 8800, heading: 0, fov: 360, range: 6000,
      label: 'West lawn presence', entity_id: null, color: '#ffb300',
      avatar: true, demo: true, avatarKinds: ['teen', 'child'],
    },
  ];

  const envSensors = [
    { id: nid('env'), x: 4900, y: 2600, entity_id: null, kind: 'temperature', label: 'Shop temp', height: 1500 },
    { id: nid('env'), x: 12300, y: 9800, entity_id: null, kind: 'humidity', label: 'Shed RH', height: 1500 },
    { id: nid('env'), x: 11300, y: 4400, entity_id: null, kind: 'illuminance', label: 'Yard lux', height: 1200 },
  ];

  const sprinklerZones = [
    {
      id: nid('spz'), x: 9000, y: 6000, entity_id: null, headKind: 'rotor',
      arcDeg: 200, rotation: 0, radius: 3500, zoneNumber: 1,
      label: 'Zone 1 — nursery beds', localState: 'on',
    },
    {
      id: nid('spz'), x: 11200, y: 9800, entity_id: null, headKind: 'spray',
      arcDeg: 120, rotation: 270, radius: 2400, zoneNumber: 2,
      label: 'Zone 2 — perennial beds',
    },
    {
      id: nid('spz'), x: 3000, y: 8600, entity_id: null, headKind: 'spray',
      arcDeg: 180, rotation: 90, radius: 3000, zoneNumber: 3,
      label: 'Zone 3 — west lawn', localState: 'on',
    },
    {
      id: nid('spz'), x: 14000, y: 5400, entity_id: null, headKind: 'drip',
      arcDeg: 360, rotation: 0, radius: 1800, zoneNumber: 4,
      label: 'Zone 4 — potted stock drip', localState: 'on',
    },
  ];

  const valves = [
    {
      id: nid('vl'), x: 6250, y: 5100, rotation: 0, entity_id: null,
      localState: 'on', label: 'Irrigation manifold',
    },
  ];

  const flagpoles = [
    { id: nid('fp'), x: 15200, y: 1300, flag: 'open_sign', height: 6000, label: 'OPEN flag' },
  ];

  const robots = [
    { id: nid('rv'), x: 5300, y: 11300, kind: 'mower', entity_id: null, label: 'Yard mower' },
  ];

  const safetySensors = [
    { id: nid('sf'), x: 3000, y: 3400, kind: 'smoke', entity_id: null, label: 'Shop smoke' },
  ];

  const look = { floorTex: 'concrete', floorColor: '#b0ad9e', wallColor: '#efe6d3' };

  const f = floor({
    name: 'Garden Centre', w: W, d: D,
    walls, rooms, doors, windows, furniture, lights, switches,
    groundAreas, motionSensors, envSensors, robots, safetySensors,
    look3d: look,
  });
  // Fixtures lib.mjs's floor() has no helper for — attached directly (they ride
  // repairFloor's explicit field list, so they survive import/load unchanged).
  f.sprinklerZones = sprinklerZones;
  f.flagpoles = flagpoles;
  f.valves = valves;

  const roamers = [
    roamer('Marigold', ['adult', 'elder'], { color: '#7cb342' }),
    roamer('Basil', ['farmer', 'professional'], { color: '#ff8f00' }),
    roamer('Clover', ['dog'], { color: '#8d6e63' }),
  ];

  return assembleStore({
    name,
    floors: [f],
    scene3d: {
      preset: 'day', ...look,
      wallCutaway: true, plumbobs: true,
    },
    roamers,
    notes: [
      '~310 sq ft shop + ~14,900 sq ft fenced lot · 1 floor · 3 rooms — yard & terrain showcase',
      '',
      'A neighbourhood lawn-and-garden centre on a 16 × 12 m corner lot: a compact indoor',
      'shop in the south-west corner and a big fenced nursery yard wrapping around it.',
      'This plan exists to exercise the whole outdoor/terrain arc at once — ground',
      'coverings, terraces, path ribbons, fences, gates, hedges, sprinklers, a flagpole',
      'and the full outdoor furniture family — rather than to model a home.',
      '',
      'Boundary: white picket along the street frontage (south and east), solid privacy',
      'board along the two back lot lines, a customer gate off the street and a delivery',
      'gate on the east side. A clipped hedge run divides the shrub display from the',
      'nursery beds without closing the yard off.',
      '',
      'Ground: grass over the whole lot, a gravel bulk bay and a paver-sand bay along the',
      'frontage, a mulched perennial bed behind the hedge, and a water display pond with',
      'a fountain in it. A two-tier terraced display bed sits mid-yard — a mulch podium',
      'raised 200 mm with a rock-capped tier raised 450 mm nested inside it, planted with',
      'annual flower beds and topiary bushes. Two concrete path ribbons (authored as',
      'centerlines and buffered into polygons) run from the shop door out to the potting',
      'shed and from the customer gate up into the yard.',
      '',
      'Garden Shop: checkout island on an entry mat, wrap counter, seed & bulb counter,',
      '  a tool-wall cabinet, two shelving runs for pots and fertiliser, a potting sink',
      '  and two rows of houseplants under a picture-window frontage.',
      'Nursery Yard: patio-furniture display (picnic table flanked by two lawn chairs),',
      '  boulder and bulk-stone displays, bird bath, shade and pine trees, a shrub row,',
      '  eight perennial flower beds in two rows, a swing-set display, and curbside bins.',
      '  Three sprinkler zones (a 200° rotor over the nursery beds plus two spray heads)',
      '  and a robot-mower dock keep it maintained; an OPEN flag flies at the frontage.',
      'Potting Shed: a free-standing 2.6 × 2.2 m shed with a potting bench, a shed sink,',
      '  seed shelving and a plant, lit by a mason-jar lantern.',
      '',
      'Lighting leans on the ground light kinds: five flush in-ground path markers along',
      'the main ribbon, three aimable ground spots uplighting the shade tree, the pond',
      'and a pine, a string-light wash over the patio display, and two floodlights on',
      'the shop and delivery gate. Three unbound demo AI-avatar presence sensors (shop,',
      'nursery yard, west lawn) keep customers and staff moving with no Home Assistant',
      'attached.',
      '',
      'Retail additions: two balled-and-burlapped birch specimens in the bulk yard, a pair',
      '  of porch rockers in the patio-furniture display, a fourth (drip) sprinkler zone on',
      '  the potted stock, and an irrigation manifold valve at the shop yard corner.',
    ].join('\n'),
  });
}
