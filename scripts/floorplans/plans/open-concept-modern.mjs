// Open-Concept Modern Single-Story — from docs/demo-houses/open-concept-modern.md.
// A ~2,205 sq ft (204 m²) modern-farmhouse: attached 2-car garage + utility on
// the west end, a wide-open great room (kitchen + dining + living) under one
// volume in the center opening onto a covered rear patio, and a private bedroom
// wing (office, two secondary bedrooms + shared bath, primary suite) on the east.
//
// Spec kinds not in FURNITURE_KINDS are mapped to the nearest real kind:
//   sectional → sofa_u · dining_table → table · double vanity → sink_vanity ·
//   storage shelving / built-ins → bookshelf/wardrobe · island sink → kitchen_sink.
//
// The wall/room/door/window geometry is exported as `buildBaseGeometry(b)` so the
// entertainer variant (open-concept-entertainer.mjs) shares the exact shell
// without copying coordinates.
import { floorplan } from '../lib.mjs';

export const id = 'open-concept-modern';
export const name = 'Open-Concept Modern';

/**
 * Build the shared house shell (floor rect + walls + rooms + doors + windows)
 * onto the given plan builder `b`. Returns { W, D, walls, rooms, doors, windows }.
 * Both the modern and the entertainer plans call this so they share one geometry.
 */
export function buildBaseGeometry(b) {
  const { wall, room, door, win } = b;
  const W = 21000, D = 16000;

  const walls = [
    // Wing A — Garage / Utility (rectangle, north edge borders unenclosed side yard)
    wall([{ x: 0, y: 0 }, { x: 6400, y: 0 }, { x: 6400, y: 8600 }, { x: 0, y: 8600 }, { x: 0, y: 0 }]),
    // Wing B — Great Room (notched front for the recessed entry porch)
    wall([{ x: 6400, y: 1800 }, { x: 8800, y: 1800 }, { x: 8800, y: 0 }, { x: 11200, y: 0 },
          { x: 11200, y: 1800 }, { x: 13600, y: 1800 }, { x: 13600, y: 11000 }, { x: 6400, y: 11000 },
          { x: 6400, y: 1800 }]),
    // Wing C — Bedroom Wing (rectangle)
    wall([{ x: 13600, y: 0 }, { x: 21000, y: 0 }, { x: 21000, y: 16000 }, { x: 13600, y: 16000 }, { x: 13600, y: 0 }]),
    // Wing A interior
    wall([{ x: 0, y: 6400 }, { x: 6400, y: 6400 }]),        // garage ↔ laundry/pantry band
    wall([{ x: 3000, y: 6400 }, { x: 3000, y: 8600 }]),     // laundry ↔ pantry
    // Wing C interior — corridor spine + room dividers
    wall([{ x: 14700, y: 0 }, { x: 14700, y: 11200 }]),     // hallway spine
    wall([{ x: 14700, y: 3000 }, { x: 21000, y: 3000 }]),   // office ↔ bedroom 2
    wall([{ x: 14700, y: 6300 }, { x: 21000, y: 6300 }]),   // bedroom 2 ↔ bath 2
    wall([{ x: 14700, y: 7900 }, { x: 21000, y: 7900 }]),   // bath 2 ↔ bedroom 3
    wall([{ x: 13600, y: 11200 }, { x: 21000, y: 11200 }]), // front wing ↔ primary suite
    wall([{ x: 18700, y: 11200 }, { x: 18700, y: 16000 }]), // primary bed ↔ bath/WIC
    wall([{ x: 18700, y: 13800 }, { x: 21000, y: 13800 }]), // primary bath ↔ WIC
    // Open porch + covered patio edges (railings, not solid walls)
    wall([{ x: 6400, y: 0 }, { x: 8800, y: 0 }], 'railing'),
    wall([{ x: 11200, y: 0 }, { x: 13600, y: 0 }], 'railing'),
    wall([{ x: 6400, y: 11000 }, { x: 6400, y: 16000 }], 'railing'),
    wall([{ x: 6400, y: 16000 }, { x: 13600, y: 16000 }], 'railing'),
  ];

  const rooms = [
    room('Garage', 3200, 3200),
    room('Laundry', 1500, 7500),
    room('Walk-in Pantry', 4700, 7500),
    room('Foyer', 10000, 900),
    room('Kitchen', 8200, 3500),   // "kitchen" substring gates snack/coffee bubbles
    room('Dining', 11800, 3500),
    room('Living', 10000, 9000),
    room('Hallway', 14150, 5500),
    room('Office / Den', 17800, 1500),
    room('Bedroom 2', 18000, 4650),
    room('Bath 2', 17800, 7100),
    room('Bedroom 3', 18000, 9550),
    room('Primary Bedroom', 16000, 13500),
    room('Primary Bath', 19800, 12500),
    room('Primary Walk-in Closet', 19800, 14900),
  ];

  const doors = [
    // Wing A
    door(500, 0, 0, { w: 2400, kind: 'garage', label: 'Garage bay 1' }),
    door(3500, 0, 0, { w: 2400, kind: 'garage', label: 'Garage bay 2' }),
    door(1050, 6400, 0, { w: 900, label: 'Garage → Laundry' }),
    door(3000, 7300, 270, { w: 800, label: 'Laundry → Pantry' }),
    door(6400, 7300, 270, { w: 900, label: 'Pantry → Kitchen' }),
    // Wing B
    door(9250, 0, 0, { w: 1500, label: 'Main Entry', lockEntity: null, doorbellEntity: null }),
    // A 3 m two-panel glass wall onto the covered patio.
    door(8500, 11000, 0, { w: 1500, kind: 'sliding_glass', label: 'Patio door L' }),
    door(10000, 11000, 0, { w: 1500, kind: 'sliding_glass', label: 'Patio door R' }),
    door(13600, 8950, 270, { w: 900, label: 'Living → Hall' }),
    // Wing C
    door(14700, 1950, 270, { w: 900, label: 'Office' }),
    door(14700, 5150, 270, { w: 900, label: 'Bedroom 2' }),
    door(14700, 7000, 270, { w: 900, label: 'Bath 2' }),
    door(14700, 9950, 270, { w: 900, label: 'Bedroom 3' }),
    door(13750, 11200, 0, { w: 900, label: 'Primary Suite' }),
    door(18700, 12400, 270, { w: 800, label: 'Primary Bath' }),
    door(18700, 15300, 270, { w: 800, label: 'Primary Closet' }),
  ];

  const windows = [
    win(7600, 1800, 0, { w: 1800, label: 'Kitchen porch' }),
    win(12400, 1800, 0, { w: 1800, label: 'Dining porch' }),
    win(6400, 9000, 90, { w: 1500, kind: 'picture', label: 'Living side' }),
    win(21000, 1500, 90, { w: 1800, label: 'Office' }),
    win(21000, 4500, 90, { w: 1500, kind: 'double_hung', label: 'Bedroom 2' }),
    win(21000, 7000, 90, { w: 900, sill: 1400, height: 900, label: 'Bath 2' }),
    win(21000, 9200, 90, { w: 1500, kind: 'double_hung', label: 'Bedroom 3' }),
    win(16000, 16000, 0, { w: 1800, kind: 'picture', label: 'Primary' }),
    win(13600, 13000, 90, { w: 1200, kind: 'double_hung', label: 'Primary side' }),
    win(21000, 12500, 90, { w: 900, sill: 1400, height: 900, kind: 'casement_pair', label: 'Primary Bath' }),
  ];

  return { W, D, walls, rooms, doors, windows };
}

export function build() {
  const b = floorplan(id);
  const { furn, light, switchFix, roamer, floor, assembleStore } = b;
  const { W, D, walls, rooms, doors, windows } = buildBaseGeometry(b);

  const carpet = '#DCD5C8';  // warm greige stand-in for bedroom carpet

  const furniture = [
    // Garage. Storage / cabinetry backs onto its wall, open face into the room.
    furn('bookshelf', 2600, 6100, { rotation: 0, label: 'Storage' }),
    furn('bookshelf', 5200, 6100, { rotation: 0, label: 'Storage' }),
    furn('cabinet', 300, 3200, { rotation: 270, label: 'Tool cabinet' }),
    // Laundry
    furn('washer', 900, 8300, { rotation: 0 }),
    furn('dryer', 2000, 8300, { rotation: 0 }),
    furn('sink', 2600, 6700, { rotation: 180, label: 'Utility sink' }),
    // Walk-in Pantry — two runs backed onto opposite walls, facing the aisle.
    furn('bookshelf', 3700, 6700, { rotation: 270, label: 'Shelving' }),
    furn('bookshelf', 5700, 6700, { rotation: 90, label: 'Shelving' }),
    // Foyer
    furn('bench', 10000, 1600, { rotation: 180 }),
    // Kitchen (west-wall galley run + island)
    furn('counter', 6700, 3000, { rotation: 270, w: 3200, h: 650 }),
    furn('fridge', 6700, 2100, { rotation: 270 }),
    furn('stove', 6700, 4300, { rotation: 270 }),
    furn('microwave', 6700, 4300, { rotation: 270, elevation: 1400 }),
    furn('dishwasher', 8600, 1950, { rotation: 180 }),
    furn('island', 8200, 4200, { rotation: 0, w: 2400, h: 1100 }),
    furn('kitchen_sink', 8200, 3800, { rotation: 0 }),
    // Dining (seats 6)
    furn('table', 11800, 4400, { rotation: 0, w: 1800, h: 1000, label: 'Dining table' }),
    furn('chair', 11300, 3800, { rotation: 0 }),
    furn('chair', 12300, 3800, { rotation: 0 }),
    furn('chair', 11300, 5000, { rotation: 180 }),
    furn('chair', 12300, 5000, { rotation: 180 }),
    furn('chair', 10900, 4400, { rotation: 90 }),
    furn('chair', 12700, 4400, { rotation: 270 }),
    furn('rug', 11800, 4400, { rotation: 0, w: 2600, h: 2000 }),
    // Living
    furn('sofa_u', 9500, 8600, { rotation: 270, label: 'Sectional' }),
    furn('coffee_table', 10600, 8600, { rotation: 0 }),
    furn('tv_stand', 13200, 7800, { rotation: 90 }),
    furn('tv', 13200, 7800, { rotation: 90, localState: 'off' }),
    furn('chair', 7200, 10200, { rotation: 0, label: 'Reading chair' }),
    furn('plant', 7000, 10800, { rotation: 0 }),
    furn('rug', 9800, 8600, { rotation: 0, w: 3600, h: 2400 }),
    // Hallway
    // rot 270 = face into the room. At 90 the console's face was 50 mm off the
    // wall it backs onto, with the whole room behind it.
    furn('coffee_table', 13850, 4000, { rotation: 270, w: 900, h: 300, label: 'Console' }),
    furn('plant', 13900, 900, { rotation: 0 }),
    // Office / Den
    furn('desk', 19500, 800, { rotation: 180 }),
    furn('chair', 19500, 1300, { rotation: 0 }),
    furn('bookshelf', 20700, 2600, { rotation: 90 }),
    // Bedroom 2 — canonical queen footprint (1524 × 2032)
    furn('bed', 18200, 6000, { rotation: 0 }),
    furn('nightstand', 16900, 6000, { rotation: 0 }),
    furn('nightstand', 19500, 6000, { rotation: 0 }),
    furn('dresser', 16500, 3400, { rotation: 180 }),
    furn('wardrobe', 15400, 4300, { rotation: 270, label: 'Reach-in' }),
    furn('rug', 18000, 4650, { rotation: 0, w: 2000, h: 1600, color: carpet }),
    // Bath 2 (shared)
    furn('toilet', 15200, 6700, { rotation: 270 }),
    furn('sink_vanity', 16800, 7500, { rotation: 0, label: 'Double vanity' }),
    // rot 0 = apron north into the bath; at 180 the step-over side was 2 mm off
    // the south wall the tub backs onto.
    furn('bathtub', 19800, 7500, { rotation: 0, w: 1700, h: 750 }),
    // Bedroom 3 — canonical queen footprint (1524 × 2032)
    furn('bed', 18200, 10200, { rotation: 0 }),
    furn('nightstand', 16900, 10200, { rotation: 0 }),
    furn('nightstand', 19500, 10200, { rotation: 0 }),
    furn('desk', 15400, 8800, { rotation: 270 }),
    furn('wardrobe', 16000, 10900, { rotation: 90, label: 'Reach-in' }),
    furn('rug', 18000, 9550, { rotation: 0, w: 2000, h: 1600, color: carpet }),
    // Primary Bedroom — canonical king footprint (1930 × 2030); headboard
    // (local +Y) under the rear picture window, nightstands flanking the head.
    furn('bed_king', 16150, 15200, { rotation: 0 }),
    furn('nightstand', 14700, 15200, { rotation: 0 }),
    furn('nightstand', 17600, 15200, { rotation: 0 }),
    furn('dresser', 14100, 12500, { rotation: 90 }),
    furn('chair', 17600, 12200, { rotation: 270, label: 'Reading chair' }),
    furn('rug', 16150, 13800, { rotation: 0, w: 3000, h: 2400, color: carpet }),
    // Primary Bath
    furn('sink_vanity', 18950, 11500, { rotation: 180, label: 'Double vanity' }),
    furn('toilet', 18950, 13500, { rotation: 270 }),
    furn('shower', 20500, 12600, { rotation: 270 }),
    // Primary Walk-in Closet
    furn('wardrobe', 19000, 14000, { rotation: 180 }),
    furn('wardrobe', 20700, 15600, { rotation: 90 }),
    // Covered patio + side yard dressing (outside the enclosed loops — bare ground)
    furn('picnic_table', 10000, 13500, { rotation: 0 }),
    furn('lawn_chair', 7600, 12500, { rotation: 90 }),
    furn('lawn_chair', 12400, 12500, { rotation: 270 }),
    furn('plant', 6900, 15400, { rotation: 0 }),
    furn('tree', 3000, 12000, { rotation: 0 }),
    furn('tree', 1500, 14500, { rotation: 0 }),
    // Mature specimen trees anchoring the deep west yard.
    furn('willow_tree', 4800, 14100, { rotation: 0, label: 'Weeping willow' }),
    furn('birch_tree', 2500, 9700, { rotation: 0, label: 'Paper birch' }),
    furn('trash_bin', 6300, -600, { rotation: 0 }),
    furn('recycle_bin', 7000, -600, { rotation: 0 }),
    // rot 0 = door/flag toward the street (−Y); at 180 it faced the house wall.
    furn('mailbox', 8000, -600, { rotation: 0, label: 'Curbside mailbox' }),
  ];

  const lights = [
    light(8200, 4200, { iconKind: 'pendant', label: 'Island' }),
    light(7600, 3000, { iconKind: 'round', label: 'Kitchen' }),
    light(11800, 4400, { iconKind: 'pendant', label: 'Dining' }),
    light(9800, 9000, { iconKind: 'bulb', label: 'Living' }),
    light(7200, 10500, { iconKind: 'lamp', label: 'Reading lamp', height: 1500 }),
    light(10000, 1200, { iconKind: 'bulb', label: 'Foyer' }),
    light(1500, 7500, { iconKind: 'bulb', label: 'Laundry' }),
    light(4700, 7500, { iconKind: 'bulb', label: 'Pantry' }),
    light(1700, 3200, { iconKind: 'strip', label: 'Garage', rotation: 0, length: 3000 }),
    light(4700, 3200, { iconKind: 'strip', label: 'Garage', rotation: 0, length: 3000 }),
    light(14150, 5500, { iconKind: 'recessed', label: 'Hallway', radius: 600 }),
    light(17800, 1500, { iconKind: 'bulb', label: 'Office' }),
    light(18000, 4650, { iconKind: 'bulb', label: 'Bedroom 2' }),
    light(18000, 9550, { iconKind: 'bulb', label: 'Bedroom 3' }),
    light(16000, 7900, { iconKind: 'sconce', label: 'Bath 2', radius: 500 }),
    light(17600, 7900, { iconKind: 'sconce', label: 'Bath 2', radius: 500 }),
    light(16150, 13500, { iconKind: 'bulb', label: 'Primary' }),
    light(18300, 11400, { iconKind: 'sconce', label: 'Primary Bath', radius: 500 }),
    light(19600, 11400, { iconKind: 'sconce', label: 'Primary Bath', radius: 500 }),
    light(10000, 10800, { iconKind: 'flood', label: 'Patio' }),
    light(1700, 300, { iconKind: 'flood', label: 'Garage front' }),
    light(4700, 300, { iconKind: 'flood', label: 'Garage front' }),
  ];

  const switches = [
    switchFix(9200, 300, { rotation: 0, label: 'Entry' }),
    switchFix(6600, 10700, { rotation: 90, label: 'Living' }),
    switchFix(14650, 900, { rotation: 270, label: 'Hall' }),
    switchFix(15300, 11300, { rotation: 0, label: 'Primary' }),
  ];

  const f = floor({
    name: 'Main Floor', w: W, d: D,
    walls, rooms, doors, windows, furniture, lights, switches,
    look3d: { floorTex: 'wood', floorColor: '#C9B79C', wallColor: '#E9E4D8' },
  });

  const roamers = [
    roamer('Avery', ['adult', 'professional', 'athlete'], { color: '#4fc3f7' }),
    roamer('Rowan', ['adult', 'teen'], { color: '#81c784' }),
  ];

  return assembleStore({
    name,
    floors: [f],
    scene3d: {
      preset: 'day', floorTex: 'wood', floorColor: '#C9B79C', wallColor: '#E9E4D8',
      wallCutaway: true, plumbobs: true,
    },
    roamers,
    notes: [
      '~2,205 sq ft (204 m²) heated + 441 sq ft garage · 1 floor · 15 rooms',
      '',
      'A wide, shallow-U modern-farmhouse: an attached two-car garage + laundry/pantry',
      'utility block on the west end, a wide-open great room (kitchen + dining + living',
      'under one volume, no interior partitions) in the center with sightlines straight',
      'from the recessed entry porch through to the covered rear patio, and a private',
      'bedroom wing on the east — office and two secondary bedrooms up front, the primary',
      'suite tucked at the quiet back corner off a corridor spine. Light white-oak floors',
      'run the great room + hallway + office; bedrooms read as warm greige carpet; wet',
      'rooms tile. The unbuilt side yard and open porch/patio render as bare ground.',
      '',
      'Garage: two storage bookshelves + a tool cabinet; twin LED strips, garage-door floods.',
      'Laundry: side-by-side washer + dryer and a utility sink.',
      'Walk-in Pantry: two shelving runs off the kitchen.',
      'Foyer: entry bench beside the double front door.',
      'Kitchen: west-wall galley (counter run, fridge, stove, over-range microwave,',
      '  dishwasher) plus a 2,400 mm island with a sink; island pendant + ceiling light.',
      'Dining: six-seat table on a rug, pendant overhead, porch window.',
      'Living: U-sectional facing a TV on a media stand, coffee table, reading chair +',
      '  plant by the patio doors, large rug; ceiling light + reading lamp.',
      'Hallway: slim console + plant along the bedroom-wing spine; recessed light.',
      'Office / Den: desk + chair and a corner bookshelf.',
      'Bedroom 2: queen bed, two nightstands, dresser, reach-in wardrobe, carpet rug.',
      'Bath 2 (shared): toilet, double vanity, tub/shower combo; sconce pair.',
      'Bedroom 3: queen bed, two nightstands, study desk, reach-in wardrobe, carpet rug.',
      'Primary Bedroom: king bed under the back picture window, two nightstands, dresser,',
      '  reading chair, carpet rug.',
      'Primary Bath: double vanity, toilet, walk-in shower; sconce pair.',
      'Primary Walk-in Closet: two built-in wardrobe runs.',
      'Patio / Yard: picnic table + lawn chairs on the covered patio behind a 3 m',
      '  two-panel sliding-glass wall, side-yard trees with a mature weeping willow and',
      '  a paper birch in the deep west yard, curbside trash + recycle bins and a',
      '  mailbox at the front.',
    ].join('\n'),
  });
}
