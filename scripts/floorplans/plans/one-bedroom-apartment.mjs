// One-Bedroom Apartment — from docs/demo-houses/one-bedroom-apartment.md.
// A ~750 sq ft (69.7 m²) mid-rise US rental one-bedroom: a big south-facing
// open living/dining great room, a galley kitchen open to it over a peninsula
// (no wall), one bedroom down a short hall, a full bath, and the closet cluster
// (coat, stacked laundry, linen, bedroom walk-in) every rental listing has.
//
// Loop note: the kitchen has an intentional open pass-through to the living
// room (no wall at x=5900, y 1400→4000 — spec §5), the entry↔living doorway is
// a real opening (wall A left as two jamb stubs), and the living↔hallway
// threshold (old "wall D") is fully open. Those openings merge Living/Dining +
// Entry + Kitchen + Hallway into ONE closed wall loop — architecturally correct
// for a galley-open-to-living layout; the six wet/private rooms each close their
// own loop. Kitchen is named literally "Kitchen" so the snack/coffee bubble gate
// fires there.
import { floorplan } from '../lib.mjs';

export const id = 'one-bedroom-apartment';
export const name = 'One-Bedroom Apartment';

export function build() {
  const { floorRect, wall, room, door, win, furn, light, switchFix, roamer, floor, assembleStore } =
    floorplan(id);

  const W = 8500, D = 8200;

  const walls = [
    wall(floorRect(W, D)),                                   // exterior perimeter
    // Wall A (Entry ↔ Living/Dining) — the D2 doorway is a cased open opening,
    // so A is left as two short jamb stubs either side of the y 250–1150 gap.
    wall([{ x: 5900, y: 0 }, { x: 5900, y: 250 }]),          // A stub (south jamb)
    wall([{ x: 5900, y: 1150 }, { x: 5900, y: 1400 }]),      // A stub (north jamb)
    wall([{ x: 7300, y: 0 }, { x: 7300, y: 1400 }]),         // B: Entry ↔ Coat Closet (door D3)
    wall([{ x: 5900, y: 1400 }, { x: 8500, y: 1400 }]),      // C: Entry+Coat ↔ Kitchen (solid)
    // (intentional gap x=5900, y 1400→4000: Kitchen ↔ Living/Dining pass-through)
    // (intentional gap: old wall D fully open — Living/Dining ↔ Hallway threshold)
    wall([{ x: 5900, y: 4900 }, { x: 5900, y: 8200 }]),      // E: Bedroom ↔ Hallway (door D5)
    wall([{ x: 0, y: 4900 }, { x: 5900, y: 4900 }]),         // F: Living/Dining ↔ Bedroom (solid)
    wall([{ x: 7000, y: 4000 }, { x: 7000, y: 8200 }]),      // G: Hallway ↔ closet column (D6/D7/D8)
    wall([{ x: 7000, y: 4000 }, { x: 8500, y: 4000 }]),      // H: Kitchen ↔ Laundry (solid)
    wall([{ x: 7000, y: 4900 }, { x: 8500, y: 4900 }]),      // I: Laundry ↔ Bathroom (solid)
    wall([{ x: 7000, y: 7300 }, { x: 8500, y: 7300 }]),      // J: Bathroom ↔ Linen (solid)
    wall([{ x: 4700, y: 6900 }, { x: 4700, y: 8200 }]),      // K: Bedroom ↔ Bedroom Closet (door D9)
    wall([{ x: 4700, y: 6900 }, { x: 5900, y: 6900 }]),      // L: Bedroom ↔ Closet, north edge (solid)
  ];

  const rooms = [
    room('Living / Dining Room', 2900, 2400),
    room('Entry / Foyer', 6600, 700),
    room('Coat Closet', 7900, 700),
    room('Kitchen', 7200, 2700),           // "kitchen" substring gates snack/coffee bubbles
    room('Hallway', 6450, 6100),
    room('Laundry Closet', 7750, 4450),
    room('Bathroom', 7750, 6100),
    room('Linen Closet', 7750, 7750),
    room('Bedroom', 2350, 6800),
    room('Bedroom Closet', 5300, 7550),
  ];

  const doors = [
    door(6150, 0, 0, { w: 900, label: 'Main entry', lockEntity: null, doorbellEntity: null }), // D1 south exterior
    door(7300, 1100, 90, { w: 800, label: 'Coat Closet' }),  // D3 wall B
    door(5900, 5850, 90, { w: 900, label: 'Bedroom' }),      // D5 wall E
    door(7000, 4050, 90, { w: 800, label: 'Laundry' }),      // D6 wall G
    door(7000, 5700, 90, { w: 800, label: 'Bathroom' }),     // D7 wall G
    door(7000, 8000, 90, { w: 700, label: 'Linen' }),        // D8 wall G
    door(4700, 7150, 90, { w: 800, label: 'Bedroom Closet' }), // D9 wall K
  ];

  const windows = [
    win(1650, 0, 0, { w: 1500, sill: 900, height: 1200, label: 'Living' }),        // Window A south
    win(4550, 0, 0, { w: 1500, sill: 900, height: 1200, label: 'Living/Dining' }), // Window B south
    win(0, 3800, 90, { w: 1500, sill: 900, height: 1200, label: 'Living side' }),  // Window C west
    win(8500, 2700, 90, { w: 900, sill: 900, height: 1200, label: 'Kitchen' }),    // Window D east (over sink)
    win(1200, D, 0, { w: 1500, sill: 900, height: 1200, label: 'Bedroom' }),       // Window E north
    win(3200, D, 0, { w: 1500, sill: 900, height: 1200, label: 'Bedroom' }),       // Window F north
    win(8500, 6100, 90, { w: 700, sill: 1200, height: 900, label: 'Bath', kind: 'single' }), // Window G east (privacy)
  ];

  const furniture = [
    // Living / Dining
    // The whole living group faces SOUTH→NORTH: screens on the south wall
    // (rot 180 = front into the room), sofa backed onto wall F facing them.
    furn('tv_stand', 3100, 300, { rotation: 180 }),
    furn('tv', 3100, 300, { rotation: 180, localState: 'off' }),
    furn('coffee_table', 3100, 2400, { rotation: 0 }),
    // Turned to face the TV (was rot 180, back to it). Do NOT move this sofa
    // north: the free strip between its inflated nav footprint and wall F is
    // exactly ONE 150 mm cell (row y≈4575) and it is the living room's only
    // link to the kitchen/hallway region — check 11 fails the moment it closes.
    furn('sofa', 3100, 3800, { rotation: 0, w: 2000, h: 900 }),
    furn('chair', 1600, 2600, { rotation: 270, w: 800, h: 800, label: 'Accent chair' }),
    furn('rug', 3100, 2900, { rotation: 0, w: 2600, h: 2200 }),
    furn('table', 4900, 3500, { rotation: 0, w: 1500, h: 900, label: 'Dining' }),
    furn('chair', 4900, 3050, { rotation: 0 }),
    furn('chair', 4900, 3950, { rotation: 180 }),
    // Second chair on the long south side rather than the west end: at the west
    // end settleSeats tucks it to x 4000, where it merged 350 mm into the sofa.
    furn('chair', 4300, 2900, { rotation: 180 }),
    furn('chair', 5300, 3500, { rotation: 270 }),
    furn('bookshelf', 200, 4600, { rotation: 0 }),   // open shelves face the room, back on wall F
    furn('plant', 5700, 4700, { rotation: 0 }),
    // Entry / Foyer
    // rot 0 = seat front south into the entry; at 180 the bench faced wall C
    // 0 mm away with the whole foyer behind its back.
    furn('bench', 6300, 1150, { rotation: 0, w: 700, h: 400 }),
    furn('rug', 6600, 800, { rotation: 0, w: 1000, h: 1000 }),
    // Kitchen (galley + peninsula)
    // East-wall galley: rot 90 = front (local −Z) toward −X, i.e. into the
    // kitchen. These were all rot 270, facing their own back wall.
    furn('counter', 8250, 2000, { rotation: 90, w: 1000, h: 650 }),
    // x 8175 = 550 mm carcass flush on the east wall face. At 8250 the basin
    // poked 75 mm through the wall under the kitchen window, which excises that
    // run from check 10's solid-wall set.
    furn('kitchen_sink', 8175, 2700, { rotation: 90 }),
    furn('counter', 8250, 3350, { rotation: 90, w: 900, h: 650 }),
    furn('dishwasher', 8000, 3350, { rotation: 90 }),
    // North (wall C) run: rot 180 = front into the kitchen.
    furn('stove', 6300, 1550, { rotation: 180 }),
    furn('microwave', 6300, 1650, { rotation: 180, elevation: 1400 }),
    // Fridge pulled 800 mm west along wall C: at x 8100 the settle push-out off
    // the east wall drove it 650 mm into the corner counter.
    furn('fridge', 7300, 1830, { rotation: 180 }),
    furn('counter', 6050, 2700, { rotation: 270, w: 1400, h: 650, label: 'Peninsula' }),
    furn('stool', 5700, 2500, { rotation: 90 }),
    furn('stool', 5700, 2900, { rotation: 90 }),
    // Hallway
    furn('rug', 6450, 6100, { rotation: 90, w: 1000, h: 3000, label: 'Runner' }),
    // Laundry Closet — stacked washer + dryer at one footprint
    furn('washer', 7400, 4300, { rotation: 0 }),
    furn('dryer', 7400, 4300, { rotation: 0, elevation: 990 }),
    // Bathroom
    furn('bathtub', 8100, 6100, { rotation: 270 }),
    furn('toilet', 7400, 6900, { rotation: 0 }),
    furn('sink_vanity', 7350, 6150, { rotation: 270, label: 'Vanity' }),
    // Bedroom
    // Canonical queen (1524 × 2032), headboard flush on the north wall — was a
    // 2000 × 1500 slab lying sideways with its head pointing INTO the room.
    furn('bed', 2350, 7134, { rotation: 0 }),
    furn('nightstand', 1300, 7450, { rotation: 180 }),
    furn('nightstand', 3400, 7450, { rotation: 180 }),
    furn('dresser', 4300, 5300, { rotation: 270 }),
    furn('desk', 600, 5300, { rotation: 270 }),
    furn('chair', 900, 5300, { rotation: 270, label: 'Desk chair' }),
    furn('rug', 2350, 6800, { rotation: 0, w: 2400, h: 2000 }),
    // Bedroom Closet
    furn('wardrobe', 5300, 7550, { rotation: 0, w: 1000, h: 600 }),
  ];

  const lights = [
    light(3100, 2400, { iconKind: 'bulb', label: 'Living' }),
    light(4900, 3500, { iconKind: 'pendant', label: 'Dining' }),
    light(1300, 2400, { iconKind: 'lamp', label: 'Floor lamp', height: 1500 }),
    light(7200, 2700, { iconKind: 'round', label: 'Kitchen' }),
    light(6600, 700, { iconKind: 'bulb', label: 'Entry' }),
    light(6450, 6100, { iconKind: 'bulb', label: 'Hallway' }),
    light(2350, 6800, { iconKind: 'bulb', label: 'Bedroom' }),
    light(7750, 6100, { iconKind: 'round', label: 'Bath', radius: 600 }),
  ];

  const switches = [
    switchFix(7150, 180, { rotation: 0, label: 'Entry' }),      // south wall by the door
    switchFix(5950, 6400, { rotation: 90, label: 'Bedroom' }),  // wall E, by door D5
    switchFix(6900, 6300, { rotation: 90, label: 'Bath' }),     // wall G, by door D7
  ];

  const f = floor({
    name: 'Apartment', w: W, d: D,
    walls, rooms, doors, windows, furniture, lights, switches,
    look3d: { floorTex: 'wood', floorColor: '#C9A874', wallColor: '#EFE9DE' },
  });

  const roamers = [
    roamer('Casey', ['adult', 'professional', 'teen'], { color: '#4fc3f7' }),
    roamer('Pixel', ['cat'], { color: '#ffb74d' }),  // resident cat (quadruped rig)
  ];

  return assembleStore({
    name,
    floors: [f],
    scene3d: {
      preset: 'day', floorTex: 'wood', floorColor: '#C9A874', wallColor: '#EFE9DE',
      wallCutaway: true, plumbobs: true,
    },
    roamers,
    notes: [
      '~750 sq ft (69.7 m²) · 1 floor · 10 rooms',
      '',
      'A believable mid-rise US rental one-bedroom: a big south-facing open',
      'living/dining great room fills the west two-thirds, a galley kitchen sits',
      'behind a small entry foyer and looks back into the great room over an open',
      'peninsula counter (no wall), and a short hallway spines back to the bedroom,',
      'the full bath, and the stacked-laundry + linen closets. Warm oak-look wood',
      'floors and warm off-white walls throughout; light from south and west windows',
      'in the living room and two north windows in the bedroom.',
      '',
      'Living / Dining Room (open great room):',
      '  • Living: sofa facing a wall-mounted TV on a stand, coffee table, area rug,',
      '    an accent reading chair by the west window, a corner bookshelf, floor lamp.',
      '  • Dining: a 4-seat table with chairs on all sides, beside the kitchen peninsula.',
      'Entry / Foyer: an entry bench and landing rug at the front door.',
      'Coat Closet: reach-in coat/storage closet beside the entry.',
      'Kitchen: east-wall galley run — counters, sink under the east window, dishwasher,',
      '  stove with over-range microwave, refrigerator; a peninsula counter with two',
      '  stools divides it from the living room.',
      'Hallway: runner rug down the spine to the bedroom, bath, and closets.',
      'Laundry Closet: stacked washer + dryer.',
      'Bathroom: tub/shower along the east wall, toilet, and a vanity sink.',
      'Linen Closet: shelving off the hallway.',
      'Bedroom: queen bed centered on the north wall between two nightstands, a dresser,',
      '  a desk + chair on the west wall, and a rug under the bed.',
      'Bedroom Closet: walk-in wardrobe notched into the NE corner.',
    ].join('\n'),
  });
}
