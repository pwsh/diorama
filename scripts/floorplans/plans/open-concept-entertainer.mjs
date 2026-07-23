// Open-Concept Entertainer's Edition — a VARIATION of open-concept-modern.mjs.
// Shares the exact house shell (walls/rooms/doors/windows) via the exported
// `buildBaseGeometry(b)`; only the furnishing, lighting, palette, and roamers
// change. The great room is re-cast as a home-theater + bar lounge: a big
// wall-mounted TV on a media console, a U-sectional media pit, and a bar/island
// with stools, all under warm dusk lighting with string/strip accents.
//
// Kind mapping: wall_tv is the real big wall-mount TV kind; sofa_u is the
// sectional; stool serves the bar stools.
import { floorplan } from '../lib.mjs';
import { buildBaseGeometry } from './open-concept-modern.mjs';

export const id = 'open-concept-entertainer';
export const name = 'Open-Concept Entertainer';

export function build() {
  const b = floorplan(id);
  const { furn, light, switchFix, roamer, floor, assembleStore } = b;
  const { W, D, walls, rooms, doors, windows } = buildBaseGeometry(b);

  const moody = '#2b2f3a';   // charcoal accent (bar / media)

  const furniture = [
    // Garage — flipped to a "toy garage": bar fridge + storage
    furn('bookshelf', 2600, 6100, { rotation: 180, label: 'Storage' }),
    furn('fridge', 5900, 6100, { rotation: 180, label: 'Beverage fridge' }),
    furn('cabinet', 300, 3200, { rotation: 90, label: 'Cabinet' }),
    // Laundry
    furn('washer', 900, 8300, { rotation: 180 }),
    furn('dryer', 2000, 8300, { rotation: 180 }),
    furn('sink', 2600, 6700, { rotation: 0, label: 'Utility sink' }),
    // Walk-in Pantry → bar back-stock + coffee/snack station
    furn('bookshelf', 6000, 6900, { rotation: 270, label: 'Bar stock' }),
    furn('counter', 4700, 6800, { rotation: 0, w: 1800, h: 600, label: 'Prep counter' }),
    furn('coffee_maker', 4700, 6800, { rotation: 0, elevation: 900 }),
    // Foyer
    furn('bench', 10000, 1600, { rotation: 180 }),
    furn('plant', 8900, 1500, { rotation: 0 }),
    // Kitchen — kept functional; island becomes the bar
    furn('counter', 6700, 3000, { rotation: 90, w: 3200, h: 650 }),
    furn('fridge', 6700, 2100, { rotation: 90 }),
    furn('stove', 6700, 4300, { rotation: 90 }),
    furn('microwave', 6700, 4300, { rotation: 90, elevation: 1400 }),
    furn('dishwasher', 8600, 1950, { rotation: 0 }),
    furn('island', 8200, 4200, { rotation: 0, w: 2600, h: 1100, label: 'Bar island', color: moody }),
    furn('kitchen_sink', 8200, 3800, { rotation: 0 }),
    // Bar stools along the dining-room side of the island
    furn('stool', 7300, 5000, { rotation: 0 }),
    furn('stool', 8200, 5000, { rotation: 0 }),
    furn('stool', 9100, 5000, { rotation: 0 }),
    // Dining — a smaller high-top so the great room stays lounge-first
    furn('table', 11800, 4200, { rotation: 0, w: 1400, h: 900, label: 'High-top' }),
    furn('stool', 11100, 4200, { rotation: 90 }),
    furn('stool', 12500, 4200, { rotation: 270 }),
    furn('stool', 11800, 3600, { rotation: 0 }),
    furn('stool', 11800, 4800, { rotation: 180 }),
    furn('rug', 11800, 4200, { rotation: 0, w: 2400, h: 1900 }),
    // Living — HOME THEATER: big wall TV + media console + U-sectional pit
    furn('wall_tv', 13300, 7300, { rotation: 90, localState: 'playing' }),
    furn('tv_stand', 13000, 7300, { rotation: 90, w: 2400, h: 450, label: 'Media console', color: moody }),
    furn('sofa_u', 9600, 8600, { rotation: 270, label: 'Media sectional', color: moody }),
    furn('coffee_table', 10800, 8600, { rotation: 0 }),
    furn('ottoman', 11200, 8600, { rotation: 0 }),
    furn('chaise', 7300, 9200, { rotation: 90, label: 'Lounge chaise' }),
    furn('plant', 6900, 10800, { rotation: 0 }),
    furn('plant', 13100, 10600, { rotation: 0 }),
    furn('rug', 10000, 8600, { rotation: 0, w: 4000, h: 2800, color: moody }),
    // Hallway
    furn('coffee_table', 13850, 4000, { rotation: 90, w: 900, h: 300, label: 'Console' }),
    // Office / Den → game / listening room
    furn('sofa', 19100, 900, { rotation: 180, w: 2000, h: 850, label: 'Lounge sofa' }),
    furn('coffee_table', 19100, 1900, { rotation: 0 }),
    furn('bookshelf', 20700, 2600, { rotation: 270, label: 'Vinyl shelf' }),
    furn('exercise_equipment', 15400, 1500, { rotation: 90, label: 'Arcade / gear' }),
    // Bedroom 2 (guest)
    furn('bed', 18200, 6000, { rotation: 0, w: 1500, h: 2100 }),
    furn('nightstand', 16900, 6000, { rotation: 0 }),
    furn('nightstand', 19500, 6000, { rotation: 0 }),
    furn('dresser', 16500, 3400, { rotation: 0 }),
    furn('wardrobe', 15400, 4300, { rotation: 90, label: 'Reach-in' }),
    // Bath 2 (shared)
    furn('toilet', 15200, 6700, { rotation: 90 }),
    furn('sink_vanity', 16800, 7500, { rotation: 180, label: 'Double vanity' }),
    furn('bathtub', 19800, 7500, { rotation: 180, w: 1700, h: 750 }),
    // Bedroom 3 (guest)
    furn('bed', 18200, 10200, { rotation: 0, w: 1500, h: 2100 }),
    furn('nightstand', 16900, 10200, { rotation: 0 }),
    furn('nightstand', 19500, 10200, { rotation: 0 }),
    furn('dresser', 16500, 8400, { rotation: 0 }),
    furn('wardrobe', 16000, 10900, { rotation: 90, label: 'Reach-in' }),
    // Primary Bedroom
    furn('bed', 16150, 15200, { rotation: 180, w: 2000, h: 2200 }),
    furn('nightstand', 14700, 15200, { rotation: 180 }),
    furn('nightstand', 17600, 15200, { rotation: 180 }),
    furn('dresser', 14100, 12500, { rotation: 90 }),
    furn('chaise', 17700, 12400, { rotation: 270, label: 'Lounge chaise' }),
    furn('rug', 16150, 13800, { rotation: 0, w: 3000, h: 2400, color: moody }),
    // Primary Bath
    furn('sink_vanity', 18950, 11500, { rotation: 180, label: 'Double vanity' }),
    furn('toilet', 18950, 13500, { rotation: 90 }),
    furn('shower', 20500, 12600, { rotation: 270 }),
    // Primary Walk-in Closet
    furn('wardrobe', 19000, 14000, { rotation: 0 }),
    furn('wardrobe', 20700, 15600, { rotation: 270 }),
    // Covered patio — outdoor entertaining
    furn('sofa', 8600, 13400, { rotation: 0, w: 2000, h: 850, label: 'Patio sofa' }),
    furn('coffee_table', 8600, 14400, { rotation: 0 }),
    furn('fountain', 11800, 13800, { rotation: 0 }),
    furn('lawn_chair', 12600, 12400, { rotation: 270 }),
    furn('plant', 6900, 15400, { rotation: 0 }),
    furn('tree', 3000, 12000, { rotation: 0 }),
    furn('trash_bin', 6300, -600, { rotation: 0 }),
    furn('recycle_bin', 7000, -600, { rotation: 0 }),
  ];

  const lights = [
    // Great-room theatrical wash + accents
    light(10000, 9000, { iconKind: 'string', label: 'Media string', radius: 1200 }),
    light(13000, 7300, { iconKind: 'under_cabinet', label: 'Console accent', rotation: 0, length: 2200 }),
    light(8200, 4200, { iconKind: 'pendant', label: 'Bar island' }),
    light(8200, 5100, { iconKind: 'under_cabinet', label: 'Bar accent', rotation: 0, length: 2400 }),
    light(11800, 4200, { iconKind: 'pendant', label: 'High-top' }),
    light(7300, 9200, { iconKind: 'lamp', label: 'Lounge lamp', height: 1500 }),
    light(7600, 3000, { iconKind: 'round', label: 'Kitchen' }),
    light(10000, 1200, { iconKind: 'bulb', label: 'Foyer' }),
    // Utility / wing
    light(1500, 7500, { iconKind: 'bulb', label: 'Laundry' }),
    light(4700, 7500, { iconKind: 'strip', label: 'Bar stock', rotation: 90, length: 1600 }),
    light(1700, 3200, { iconKind: 'strip', label: 'Garage', rotation: 0, length: 3000 }),
    light(14150, 5500, { iconKind: 'recessed', label: 'Hallway', radius: 600 }),
    light(19100, 1500, { iconKind: 'string', label: 'Game room', radius: 1000 }),
    light(18000, 4650, { iconKind: 'bulb', label: 'Bedroom 2' }),
    light(18000, 9550, { iconKind: 'bulb', label: 'Bedroom 3' }),
    light(16000, 7900, { iconKind: 'sconce', label: 'Bath 2', radius: 500 }),
    light(17600, 7900, { iconKind: 'sconce', label: 'Bath 2', radius: 500 }),
    light(16150, 13500, { iconKind: 'bulb', label: 'Primary' }),
    light(18300, 11400, { iconKind: 'sconce', label: 'Primary Bath', radius: 500 }),
    light(19600, 11400, { iconKind: 'sconce', label: 'Primary Bath', radius: 500 }),
    // Patio party lighting
    light(9500, 13800, { iconKind: 'string', label: 'Patio string', radius: 1600 }),
    light(1700, 300, { iconKind: 'flood', label: 'Garage front' }),
  ];

  const switches = [
    switchFix(9200, 300, { rotation: 0, label: 'Entry' }),
    switchFix(6600, 10700, { rotation: 90, label: 'Media' }),
    switchFix(14650, 900, { rotation: 270, label: 'Hall' }),
  ];

  const f = floor({
    name: 'Main Floor', w: W, d: D,
    walls, rooms, doors, windows, furniture, lights, switches,
    look3d: { floorTex: 'wood', floorColor: '#8f7654', wallColor: '#3d4048' },
  });

  // Party-ish pool: adults, a teen, and a professional (all real base-* ids).
  const roamers = [
    roamer('Nico', ['adult', 'professional'], { color: '#9575cd' }),
    roamer('Sasha', ['adult', 'teen'], { color: '#f06292' }),
    roamer('Dev', ['adult', 'professional', 'teen'], { color: '#26c6da' }),
  ];

  return assembleStore({
    name,
    floors: [f],
    scene3d: {
      preset: 'dusk', floorTex: 'wood', floorColor: '#8f7654', wallColor: '#3d4048',
      wallCutaway: true, plumbobs: true,
    },
    roamers,
    notes: [
      '~2,205 sq ft (204 m²) heated + 441 sq ft garage · 1 floor · 15 rooms — entertainer’s edition',
      '',
      'The same open-concept modern shell, re-furnished for hosting. The center great',
      'room is one continuous home-theater lounge: a big wall-mounted TV on a low',
      'charcoal media console faces a U-sectional media pit with an ottoman, a coffee',
      'table, and a side lounge chaise, all sitting on an oversized dark rug under a',
      'warm string-light wash and under-console LED accent. The kitchen island is',
      'dressed as a bar (three stools, pendant + under-counter accent), the dining zone',
      'is a compact high-top, and the walk-in pantry doubles as a bar back-stock with a',
      'coffee/snack station. Deep walnut floors and moody charcoal walls under a dusk',
      'lighting preset set the after-dark mood; guest bedrooms and the primary suite',
      'stay comfortable, and the covered patio is staged for outdoor entertaining with',
      'a sofa, a fountain, and party string lights.',
      '',
      'Great Room (Kitchen / Dining / Living): wall-mounted TV + media console, U-sectional',
      '  pit with ottoman + coffee table, lounge chaise and plants; bar island with three',
      '  stools + pendant; high-top dining with four stools. String + under-cabinet accents.',
      'Kitchen: full galley (counter, fridge, stove, over-range microwave, dishwasher).',
      'Walk-in Pantry: bar back-stock shelving, prep counter, counter coffee maker.',
      'Garage: beverage fridge + storage; LED strip, front flood.',
      'Laundry: washer, dryer, utility sink.',
      'Foyer: entry bench + plant.',
      'Hallway: slim console along the bedroom-wing spine.',
      'Office / Den → game / listening room: lounge sofa, coffee table, vinyl shelf,',
      '  arcade/gear; string lighting.',
      'Bedroom 2 / Bedroom 3 (guest): queen bed, nightstands, dresser, reach-in wardrobe.',
      'Bath 2 (shared): toilet, double vanity, tub/shower; sconce pair.',
      'Primary Bedroom: king bed, two nightstands, dresser, lounge chaise, dark rug.',
      'Primary Bath: double vanity, toilet, walk-in shower; sconce pair.',
      'Primary Walk-in Closet: two built-in wardrobe runs.',
      'Covered Patio: outdoor sofa + coffee table, fountain, lawn chair; party string lights.',
    ].join('\n'),
  });
}
