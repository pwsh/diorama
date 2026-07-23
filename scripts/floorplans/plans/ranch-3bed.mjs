// "Maple Grove" 3-Bed / 2-Bath Ranch — from docs/demo-houses/ranch-3bed.md.
// A ~1,720 sq ft single-story ranch with an open kitchen/dining/family great
// room, a center-hall bedroom wing, and an attached 2-car garage.
//
// Spec kinds not in FURNITURE_KINDS are mapped to the nearest real kind:
//   armchair → chair · sectional → sofa_u · dining_table → table ·
//   (island/counter) sink → kitchen_sink · wall-mounted tv → wall_tv.
//
// The house SHELL (walls / rooms / doors / windows / furniture / lights /
// switches / look3d) is factored into `buildRanchBones(b)` so a second plan
// (ranch-smart-home) can reuse the exact same bones and layer a smart-home
// fixture kit on top. buildRanchBones creates every item in the SAME order the
// original inline plan did, so this plan's ids stay identical.
import { floorplan } from '../lib.mjs';

export const id = 'ranch-3bed';
export const name = 'Ranch — 3 Bed / 2 Bath';

/**
 * Build the shared ranch shell from a `floorplan(planId)` builder `b`. Returns
 * the raw arrays + dimensions + look3d; the caller assembles the Floor/Store so
 * it can inject plan-specific fixtures (see ranch-smart-home). Item ids are
 * generated on `b`, so they carry the caller's planId prefix.
 */
export function buildRanchBones(b) {
  const { floorRect, wall, room, door, win, furn, light, switchFix } = b;

  const W = 22100, D = 10000;

  const walls = [
    wall(floorRect(16000, D)),                                      // house perimeter
    wall([{ x: 16000, y: 0 }, { x: 22100, y: 0 }, { x: 22100, y: 6100 }, { x: 16000, y: 6100 }, { x: 16000, y: 0 }]), // garage
    wall([{ x: 7900, y: 1900 }, { x: 7900, y: 10000 }]),            // 1 wing ↔ living/kitchen band
    wall([{ x: 3400, y: 1900 }, { x: 3400, y: 10000 }]),            // 2 bedrooms ↔ corridor
    wall([{ x: 4500, y: 1900 }, { x: 4500, y: 10000 }]),            // 3 corridor ↔ bed3/bath/office
    wall([{ x: 0, y: 3800 }, { x: 3400, y: 3800 }]),                // 4 bed2 ↔ primary
    wall([{ x: 0, y: 8300 }, { x: 3400, y: 8300 }]),                // 5 primary ↔ bath+WIC
    wall([{ x: 2000, y: 8300 }, { x: 2000, y: 10000 }]),            // 6 primary bath ↔ WIC
    wall([{ x: 3400, y: 0 }, { x: 3400, y: 1900 }]),                // 7 bed2 ↔ foyer
    wall([{ x: 4500, y: 1900 }, { x: 7900, y: 1900 }]),             // 8 foyer ↔ bed3
    wall([{ x: 4500, y: 5700 }, { x: 7900, y: 5700 }]),             // 9 bed3 ↔ hall bath
    wall([{ x: 4500, y: 8200 }, { x: 7900, y: 8200 }]),             // 10 hall bath ↔ office
    wall([{ x: 7900, y: 3800 }, { x: 16000, y: 3800 }]),            // 11 living ↔ kitchen/dining band
    wall([{ x: 14300, y: 3800 }, { x: 14300, y: 7000 }]),           // 12 dining ↔ laundry
    wall([{ x: 11300, y: 7000 }, { x: 16000, y: 7000 }]),           // 13 dining+laundry ↔ family
    wall([{ x: 16000, y: 0 }, { x: 16000, y: 6100 }]),              // 14 house ↔ garage party wall
  ];

  const rooms = [
    room('Bedroom 2', 1700, 1900),
    room('Foyer', 5650, 950),
    room('Bedroom 3', 6200, 3800),
    room('Living Room', 11950, 1900),
    room('Hallway', 3950, 6000),
    room('Primary Bedroom', 1700, 5900),
    room('Hall Bath', 6200, 6950),
    room('Kitchen', 9600, 5400),
    room('Dining', 12800, 5400),
    room('Laundry / Mudroom', 15150, 5400),
    room('Primary Bath', 1000, 9150),
    room('Primary Walk-in Closet', 2700, 9150),
    room('Office Nook', 6200, 9100),
    room('Family Room', 11950, 8500),
    room('Garage', 19050, 3050),
  ];

  const doors = [
    door(5200, 0, 0, { w: 900, label: 'Front', lockEntity: null, doorbellEntity: null }),
    door(3400, 900, 270, { w: 900, label: 'Bedroom 2' }),
    door(4500, 2600, 270, { w: 900, label: 'Bedroom 3' }),
    door(3400, 4200, 270, { w: 900, label: 'Primary Bedroom' }),
    door(900, 8300, 0, { w: 700, label: 'Primary Bath' }),
    door(2050, 8300, 0, { w: 700, label: 'Primary WIC' }),
    door(4500, 6500, 270, { w: 700, label: 'Hall Bath' }),
    door(4500, 8700, 270, { w: 900, label: 'Office' }),
    door(10200, 3800, 0, { w: 900, label: 'Living ↔ Kitchen' }),
    door(14300, 5000, 270, { w: 800, label: 'Laundry' }),
    door(12500, 7000, 0, { w: 900, label: 'Dining ↔ Family' }),
    door(16000, 4950, 270, { w: 900, label: 'Garage service', lockEntity: null }),
    door(16700, 0, 0, { w: 2400, kind: 'garage', label: 'Garage bay 1' }),
    door(19400, 0, 0, { w: 2400, kind: 'garage', label: 'Garage bay 2' }),
    door(18550, 6100, 0, { w: 900, label: 'Garage man-door' }),
  ];

  const windows = [
    win(1500, 0, 0, { w: 1200, sill: 800, height: 1200, label: 'Bedroom 2 front' }),
    win(4600, 0, 0, { w: 800, sill: 900, height: 1400, label: 'Foyer sidelight' }),
    win(12000, 0, 0, { w: 2400, sill: 700, height: 1500, kind: 'picture', label: 'Living picture' }),
    win(1000, D, 0, { w: 800, sill: 1400, height: 900, label: 'Primary Bath' }),
    win(6300, D, 0, { w: 1200, sill: 800, height: 1200, label: 'Office rear' }),
    win(10100, D, 0, { w: 1200, sill: 800, height: 1200, kind: 'double_hung', label: 'Family rear' }),
    win(14100, D, 0, { w: 1200, sill: 800, height: 1200, kind: 'double_hung', label: 'Family rear' }),
    win(0, 1800, 90, { w: 1200, sill: 800, height: 1200, label: 'Bedroom 2 side' }),
    win(0, 5800, 90, { w: 1200, sill: 800, height: 1200, label: 'Primary Bedroom side' }),
    win(16000, 8400, 90, { w: 1800, sill: 0, height: 2000, kind: 'sliding', label: 'Family slider' }),
    win(22100, 2900, 90, { w: 800, sill: 1200, height: 900, label: 'Garage utility' }),
  ];

  const carpetT = '#cfc2a8';  // secondary-bedroom carpet tone (rug simulates carpet)
  const carpetP = '#c9d1c4';  // primary-bedroom carpet tone

  const furniture = [
    // Living Room
    furn('sofa', 11950, 900, { rotation: 180 }),
    furn('chair', 9200, 1500, { rotation: 90, label: 'Armchair' }),
    furn('chair', 14700, 1500, { rotation: 270, label: 'Armchair' }),
    furn('coffee_table', 11950, 1900, { rotation: 0 }),
    furn('tv_stand', 11950, 3550, { rotation: 0 }),
    furn('tv', 11950, 3550, { rotation: 0, localState: 'off' }),
    furn('bookshelf', 8100, 3200, { rotation: 90 }),
    furn('rug', 11950, 1900, { rotation: 0, w: 2400, h: 1700 }),
    furn('plant', 15700, 3500, { rotation: 0 }),
    // Foyer
    furn('bench', 4000, 300, { rotation: 180 }),
    furn('coffee_table', 7300, 300, { rotation: 180, label: 'Console' }),
    furn('plant', 6600, 1500, { rotation: 0 }),
    // Bedroom 2
    furn('bed', 1700, 1050, { rotation: 180, w: 1500, h: 2000 }),
    furn('nightstand', 700, 700, { rotation: 180 }),
    furn('nightstand', 2700, 700, { rotation: 180 }),
    furn('dresser', 300, 2900, { rotation: 90 }),
    furn('bookshelf', 2900, 3400, { rotation: 270 }),
    furn('rug', 1700, 2200, { rotation: 0, w: 1800, h: 1400, color: carpetT }),
    // Bedroom 3
    furn('bed', 6200, 2650, { rotation: 180, w: 1350, h: 1900 }),
    furn('nightstand', 5300, 2200, { rotation: 180 }),
    furn('dresser', 7700, 4900, { rotation: 270 }),
    furn('desk', 5000, 5300, { rotation: 0 }),
    furn('rug', 6200, 3800, { rotation: 0, w: 1600, h: 1300, color: carpetT }),
    // Primary Bedroom
    furn('bed', 1700, 4950, { rotation: 180, w: 1900, h: 2100 }),
    furn('nightstand', 600, 4300, { rotation: 180 }),
    furn('nightstand', 2500, 4300, { rotation: 180 }),
    furn('dresser', 300, 7300, { rotation: 90 }),
    furn('bench', 1700, 6100, { rotation: 180 }),
    furn('wall_tv', 3300, 6000, { rotation: 90 }),
    furn('rug', 1700, 6000, { rotation: 0, w: 2200, h: 1800, color: carpetP }),
    furn('plant', 3100, 7000, { rotation: 0 }),
    // Primary Bath
    furn('toilet', 400, 9700, { rotation: 180 }),
    furn('sink', 300, 9000, { rotation: 90, label: 'Vanity' }),
    furn('shower', 1600, 9700, { rotation: 180, w: 900, h: 900 }),
    // Primary Walk-in Closet
    furn('wardrobe', 2700, 9600, { rotation: 0, w: 1200, h: 600 }),
    furn('wardrobe', 3050, 8750, { rotation: 0, w: 600, h: 600 }),
    // Hall Bath
    furn('toilet', 5000, 6000, { rotation: 90 }),
    furn('sink', 7500, 6200, { rotation: 270, label: 'Vanity' }),
    furn('bathtub', 6200, 7900, { rotation: 180, w: 1700, h: 750 }),
    // Office Nook
    furn('desk', 6200, 9700, { rotation: 0 }),
    furn('chair', 6200, 9300, { rotation: 180 }),
    furn('bookshelf', 7700, 8900, { rotation: 270 }),
    // Kitchen
    furn('counter', 8100, 4200, { rotation: 90 }),
    furn('counter', 9200, 4000, { rotation: 180 }),
    furn('stove', 9400, 4000, { rotation: 180 }),
    furn('microwave', 8700, 4100, { rotation: 180, elevation: 1400 }),
    furn('cabinet', 8100, 5200, { rotation: 90 }),
    furn('island', 9600, 5600, { rotation: 0 }),
    furn('kitchen_sink', 9600, 5800, { rotation: 180 }),
    furn('dishwasher', 9200, 5800, { rotation: 180 }),
    furn('fridge', 8200, 6800, { rotation: 180 }),
    // Dining
    furn('table', 12500, 5400, { rotation: 0, label: 'Dining table' }),
    furn('chair', 12500, 4700, { rotation: 0 }),
    furn('chair', 12500, 6100, { rotation: 180 }),
    furn('chair', 11600, 5100, { rotation: 90 }),
    furn('chair', 11600, 5700, { rotation: 90 }),
    furn('chair', 13400, 5100, { rotation: 270 }),
    furn('chair', 13400, 5700, { rotation: 270 }),
    furn('cabinet', 14100, 4200, { rotation: 270, label: 'Buffet' }),
    furn('rug', 12500, 5400, { rotation: 0, w: 2700, h: 2100 }),
    furn('plant', 11500, 6800, { rotation: 0 }),
    // Laundry / Mudroom
    furn('washer', 14700, 4200, { rotation: 180 }),
    furn('dryer', 15600, 4200, { rotation: 180 }),
    furn('cabinet', 15150, 6700, { rotation: 0 }),
    furn('bench', 15150, 5500, { rotation: 90 }),
    // Family Room
    furn('sofa_u', 9500, 9500, { rotation: 0, label: 'Sectional' }),
    furn('tv_stand', 11000, 7200, { rotation: 180 }),
    furn('tv', 11000, 7200, { rotation: 180, localState: 'off' }),
    furn('coffee_table', 9500, 8600, { rotation: 0 }),
    furn('ottoman', 10200, 9200, { rotation: 0 }),
    furn('bookshelf', 8100, 9700, { rotation: 90 }),
    furn('exercise_equipment', 15200, 9500, { rotation: 270 }),
    furn('rug', 9700, 8800, { rotation: 0, w: 3000, h: 2200 }),
    furn('plant', 15700, 7300, { rotation: 0 }),
    furn('plant', 8100, 7300, { rotation: 90 }),
    // Garage
    furn('cabinet', 21600, 1800, { rotation: 270 }),
    furn('desk', 16400, 3000, { rotation: 90, label: 'Workbench' }),
    furn('bookshelf', 21600, 5500, { rotation: 270, label: 'Shelving' }),
    // Yard dressing (outside every wall loop — bare ground)
    furn('trash_bin', 15000, -600, { rotation: 0 }),
    furn('recycle_bin', 15700, -600, { rotation: 0 }),
    furn('tree', 3000, -700, { rotation: 0 }),
    furn('tree', 8500, -700, { rotation: 0 }),
    furn('lawn_chair', 16900, 7800, { rotation: 270 }),
    furn('lawn_chair', 16900, 9100, { rotation: 270 }),
  ];

  const lights = [
    light(1700, 1900, { iconKind: 'bulb', label: 'Bedroom 2' }),
    light(6200, 3800, { iconKind: 'bulb', label: 'Bedroom 3' }),
    light(1700, 5900, { iconKind: 'bulb', label: 'Primary Bedroom' }),
    light(700, 4300, { iconKind: 'lamp', label: 'Primary lamp', height: 1400 }),
    light(11950, 1900, { iconKind: 'bulb', label: 'Living Room' }),
    light(11950, 8500, { iconKind: 'bulb', label: 'Family Room' }),
    light(8300, 9500, { iconKind: 'lamp', label: 'Family lamp', height: 1400 }),
    light(9600, 5600, { iconKind: 'pendant', label: 'Kitchen island' }),
    light(9600, 4500, { iconKind: 'round', label: 'Kitchen' }),
    light(12800, 5400, { iconKind: 'pendant', label: 'Dining' }),
    light(5650, 950, { iconKind: 'bulb', label: 'Foyer' }),
    light(3950, 6000, { iconKind: 'bulb', label: 'Corridor' }),
    light(5000, 7000, { iconKind: 'sconce', label: 'Hall Bath', radius: 500 }),
    light(7000, 7000, { iconKind: 'sconce', label: 'Hall Bath', radius: 500 }),
    light(500, 9200, { iconKind: 'sconce', label: 'Primary Bath', radius: 500 }),
    light(1500, 9200, { iconKind: 'sconce', label: 'Primary Bath', radius: 500 }),
    light(15150, 5400, { iconKind: 'bulb', label: 'Laundry' }),
    light(6200, 9100, { iconKind: 'bulb', label: 'Office' }),
    light(17500, 3000, { iconKind: 'strip', label: 'Garage', rotation: 0, length: 3000 }),
    light(20500, 3000, { iconKind: 'strip', label: 'Garage', rotation: 0, length: 3000 }),
  ];

  const switches = [
    switchFix(5900, 150, { rotation: 0, label: 'Foyer' }),
    switchFix(15850, 8400, { rotation: 90, label: 'Patio' }),
  ];

  return {
    W, D, walls, rooms, doors, windows, furniture, lights, switches,
    look3d: { floorTex: 'wood', floorColor: '#b8875a', wallColor: '#e8e2d2' },
  };
}

export function build() {
  const b = floorplan(id);
  const { floor, roamer, assembleStore } = b;
  const bones = buildRanchBones(b);

  const f = floor({
    name: 'Main Floor', w: bones.W, d: bones.D,
    walls: bones.walls, rooms: bones.rooms, doors: bones.doors, windows: bones.windows,
    furniture: bones.furniture, lights: bones.lights, switches: bones.switches,
    look3d: bones.look3d,
  });

  const roamers = [
    roamer('Dana', ['adult', 'professional', 'athlete'], { color: '#4fc3f7' }),
    roamer('Riley', ['child', 'teen'], { color: '#f06292' }),
    roamer('Biscuit', ['dog'], { color: '#a1887f' }),  // family dog (quadruped rig)
  ];

  return assembleStore({
    name,
    floors: [f],
    scene3d: {
      preset: 'day', floorTex: 'wood', floorColor: '#b8875a', wallColor: '#e8e2d2',
      wallCutaway: true, plumbobs: true,
    },
    roamers,
    notes: [
      '~1,723 sq ft (160 m²) heated + 400 sq ft garage · 1 floor · 15 rooms',
      '',
      'A classic single-story American ranch: an open kitchen/dining/family great room',
      'grafted onto a traditional center-hall bedroom wing, with an attached two-car',
      'garage. Warm oak-look floors, greige walls, carpet simulated with area rugs in',
      'the bedrooms. The L-shaped footprint leaves an unbuilt side yard behind the',
      'garage that renders as bare ground.',
      '',
      'Living Room: sofa, two armchairs, coffee table, TV on a stand, bookshelf, rug, plant.',
      'Foyer: entry bench, console table, plant.',
      'Bedroom 2: queen bed, two nightstands, dresser, bookshelf, carpet-tone rug.',
      'Bedroom 3: full bed, nightstand, dresser, student desk, rug.',
      'Primary Bedroom: king bed, two nightstands, dresser, foot-of-bed bench, wall TV,',
      '  rug, plant, and a bedside lamp.',
      'Primary Bath: toilet, vanity sink, corner shower; sconce pair.',
      'Primary Walk-in Closet: two built-in wardrobe runs.',
      'Hall Bath: toilet, vanity sink, tub/shower combo; sconce pair.',
      'Office Nook: desk + chair, bookshelf.',
      'Kitchen: two counter runs, stove, over-range microwave, upper cabinet, island with',
      '  sink + dishwasher, refrigerator; island pendant + general ceiling light.',
      'Dining: six-seat table, buffet cabinet, rug, plant; pendant over the table.',
      'Laundry / Mudroom: washer, dryer, storage cabinet, mudroom bench.',
      'Family Room: U-sectional, TV on a stand, coffee table, ottoman, bookshelf,',
      '  exercise equipment, rug, plants; ceiling light + sectional lamp.',
      'Garage: storage cabinet, workbench, bin/bike shelving; two LED strip lights.',
      'Yard: curbside trash + recycle bins, two front-walk trees, backyard lawn chairs.',
    ].join('\n'),
  });
}
