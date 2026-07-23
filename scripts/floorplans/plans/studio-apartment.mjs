// Studio Apartment — from docs/demo-houses/studio-apartment.md.
// A ~451 sq ft (42 m²) open urban studio: one great room (kitchen + dining +
// living + sleeping) wrapped around an enclosed bathroom + two closets.
import { floorplan } from '../lib.mjs';

export const id = 'studio-apartment';
export const name = 'Studio Apartment';

export function build() {
  const { floorRect, wall, room, door, win, furn, light, switchFix, roamer, floor, assembleStore } =
    floorplan(id);

  const W = 6600, D = 6350;

  const walls = [
    wall(floorRect(W, D)),                                  // exterior perimeter
    wall([{ x: 900, y: 0 }, { x: 900, y: 2400 }]),          // B: closet/bath west edge
    wall([{ x: 0, y: 700 }, { x: 900, y: 700 }]),           // C: closet north
    wall([{ x: 900, y: 2400 }, { x: 2800, y: 2400 }]),      // D: bathroom north
    wall([{ x: 2800, y: 0 }, { x: 2800, y: 2400 }]),        // E: bath/utility east edge
    wall([{ x: 2800, y: 1500 }, { x: 3700, y: 1500 }]),     // F: utility north
    wall([{ x: 3700, y: 0 }, { x: 3700, y: 1500 }]),        // G: utility east
  ];

  const rooms = [
    room('Entry Closet', 450, 350),
    room('Bathroom', 1850, 1200),
    room('Utility Closet', 3250, 900),
    // Kitchen substring gates the snack/coffee thought-bubbles anywhere in the
    // open plan — appropriate in a studio this size.
    room('Kitchen / Living / Bedroom', 5000, 4000),
  ];

  const doors = [
    door(4200, 0, 0, { w: 900, label: 'Entry', doorbellEntity: null }),   // main entry (south)
    door(100, 700, 0, { w: 700, label: 'Closet' }),                        // wall C
    door(1200, 2400, 0, { w: 850, label: 'Bathroom' }),                    // wall D
    door(2950, 1500, 0, { w: 700, label: 'Utility' }),                     // wall F
  ];

  const windows = [
    win(1500, D, 0, { w: 1200, sill: 900, height: 1200, label: 'Bedroom' }),  // W1 north
    win(4900, D, 0, { w: 1200, sill: 900, height: 1200, label: 'Living' }),   // W2 north
    win(0, 2800, 90, { w: 1200, sill: 900, height: 1200, label: 'Kitchen' }), // W3 west (over sink)
  ];

  const furniture = [
    // Bathroom
    furn('bathtub', 2400, 1000, { rotation: 270 }),
    furn('toilet', 1300, 1500, { rotation: 270 }),
    furn('sink', 1300, 700, { rotation: 270, label: 'Vanity' }),
    // Utility — stacked washer/dryer at one footprint (see spec §5)
    furn('washer', 3250, 350, { rotation: 0 }),
    furn('dryer', 3250, 350, { rotation: 0, elevation: 990 }),
    // Kitchen (west-wall galley run)
    furn('stove', 325, 1750, { rotation: 90 }),
    furn('microwave', 325, 1750, { rotation: 90, elevation: 1400 }),
    furn('dishwasher', 300, 2550, { rotation: 90 }),
    furn('kitchen_sink', 325, 3000, { rotation: 90 }),
    furn('counter', 325, 2300, { rotation: 90, w: 600, h: 650 }),
    furn('counter', 325, 3650, { rotation: 90, w: 1200, h: 650 }),
    furn('fridge', 375, 4450, { rotation: 90 }),
    // Dining nook (small 2-top)
    furn('table', 1700, 4200, { rotation: 0, w: 800, h: 800, label: 'Dining' }),
    furn('chair', 1700, 3900, { rotation: 0 }),
    furn('chair', 1700, 4500, { rotation: 180 }),
    // Bedroom nook (north wall)
    furn('bed', 1850, 5300, { rotation: 180, w: 1700, h: 2100 }),
    furn('nightstand', 900, 5300, { rotation: 180 }),
    furn('nightstand', 2800, 5300, { rotation: 180 }),
    furn('dresser', 3600, 6000, { rotation: 0, w: 1200, h: 550 }),
    furn('wardrobe', 4700, 6000, { rotation: 0, w: 1000, h: 600 }),
    // Living area (entry pocket + extension)
    furn('rug', 5300, 1900, { rotation: 0, w: 2600, h: 2200 }),
    furn('sofa', 5000, 1800, { rotation: 270, w: 2000, h: 850 }),
    furn('coffee_table', 5800, 1800, { rotation: 0 }),
    furn('tv_stand', 6450, 1800, { rotation: 90 }),
    furn('tv', 6450, 1800, { rotation: 90, localState: 'off' }),
    furn('bookshelf', 4050, 2200, { rotation: 90 }),
  ];

  const lights = [
    light(450, 2500, { iconKind: 'round', label: 'Kitchen' }),
    light(1700, 4200, { iconKind: 'pendant', label: 'Dining' }),
    light(1850, 5600, { iconKind: 'bulb', label: 'Bedroom' }),
    light(5300, 1800, { iconKind: 'bulb', label: 'Living' }),
    light(1850, 1200, { iconKind: 'recessed', label: 'Bath', radius: 600 }),
    light(4650, 600, { iconKind: 'bulb', label: 'Entry' }),
    light(4400, 1200, { iconKind: 'lamp', label: 'Floor lamp', height: 1500 }),
  ];

  const switches = [
    switchFix(4600, 200, { rotation: 0, label: 'Entry' }),      // south wall
    switchFix(1600, 2450, { rotation: 0, label: 'Bath' }),      // wall D
  ];

  const f = floor({
    name: 'Studio', w: W, d: D,
    walls, rooms, doors, windows, furniture, lights, switches,
    look3d: { floorTex: 'wood', floorColor: '#C7A06B', wallColor: '#F1ECE2' },
  });

  const roamers = [
    roamer('Jordan', ['adult', 'teen', 'professional'], { color: '#4fc3f7' }),
    roamer('Mochi', ['cat'], { color: '#ffb74d' }),  // a resident cat (quadruped rig)
  ];

  return assembleStore({
    name,
    floors: [f],
    scene3d: {
      preset: 'day', floorTex: 'wood', floorColor: '#C7A06B', wallColor: '#F1ECE2',
      wallCutaway: true, plumbobs: true,
    },
    roamers,
    notes: [
      '~451 sq ft (42 m²) · 1 floor · 4 rooms',
      '',
      'A bright open urban studio where one great room does triple duty — a one-wall',
      'galley kitchen, a dining nook, a living/TV pocket, and a bedroom nook — wrapped',
      'around a compact core of full bathroom, entry coat closet, and a stacked',
      'washer/dryer utility closet. Warm oak-look floors, soft warm-white walls, light',
      'from north and west exposures.',
      '',
      'Kitchen / Living / Bedroom (great room):',
      '  • Galley kitchen: stove, over-range microwave, dishwasher, sink under the west',
      '    window, two counter runs, and a counter-depth refrigerator.',
      '  • Dining nook: a small 2-top table with two chairs.',
      '  • Living pocket: sofa facing a wall-mounted TV on a stand, coffee table, area',
      '    rug, a floor lamp, and an entry bookshelf.',
      '  • Bedroom nook: queen bed against the north wall flanked by two nightstands, a',
      '    dresser and a wardrobe along the north wall.',
      '  • Lighting: kitchen flush-mount, dining pendant, bedroom + living + entry',
      '    ceiling lights, and the sofa floor lamp.',
      'Bathroom: bathtub/shower combo, toilet, and a vanity sink; recessed ceiling light.',
      'Entry Closet: reach-in coat closet at the door.',
      'Utility Closet: stacked washer + dryer.',
    ].join('\n'),
  });
}
