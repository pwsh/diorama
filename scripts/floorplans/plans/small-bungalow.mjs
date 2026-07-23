// Small 2-Bed Bungalow — from docs/demo-houses/small-bungalow.md.
// A ~997 sq ft (92.6 m²) 1940s "minimal traditional" cottage: front living
// room, compact galley kitchen with an interior breakfast nook + back mudroom,
// and a private two-bedroom wing off one central hallway. Cozy and closed-off
// (period-accurate) rather than open-concept.
//
// The geometry (walls/rooms/openings/interior furniture) is exported as a shared
// builder `bungalowGeometry(b, { dx, dy })` so the cottage-yard variation
// (bungalow-cottage-yard.mjs) can re-skin + add a yard around the SAME house by
// importing it with an offset — no coordinate copy-paste.
//
// Loop note: open pass-throughs (Living↔Kitchen, Kitchen↔Nook, Living↔Hallway
// mouth, Hallway↔Utility mouth) are real wall GAPS, merging Living + Kitchen +
// Nook + Hallway + Utility/Storage into ONE closed loop; the eight private
// rooms (mudroom, bath, both bedrooms, four closets) each close their own loop.
// Kitchen is named literally "Kitchen" for the snack/coffee bubble gate.
import { floorplan } from '../lib.mjs';

export const id = 'small-bungalow';
export const name = 'Small 2-Bed Bungalow';

// House envelope (interior floor rect for the base plan).
export const HOUSE_W = 9750, HOUSE_D = 9500;

/**
 * Build every interior element of the bungalow, translated by (dx, dy). Returns
 * arrays ready to spread into floor(). Rooms/doors/windows/furniture/lights/
 * switches all live inside the 9750×9500 house footprint (offset by dx/dy).
 */
export function bungalowGeometry(b, { dx = 0, dy = 0 } = {}) {
  const { wall, room, door, win, furn, light, switchFix } = b;
  // Offset wrappers — author in local house coords, emit world coords.
  const P = (x, y) => ({ x: x + dx, y: y + dy });
  const wallO = (pts, kind) => wall(pts.map(p => P(p.x, p.y)), kind);
  const roomO = (name, ax, ay, opts) => room(name, ax + dx, ay + dy, opts);
  const doorO = (x, y, rot, opts) => door(x + dx, y + dy, rot, opts);
  const winO = (x, y, rot, opts) => win(x + dx, y + dy, rot, opts);
  const fu = (kind, x, y, opts) => furn(kind, x + dx, y + dy, opts);
  const lt = (x, y, opts) => light(x + dx, y + dy, opts);
  const sw = (x, y, opts) => switchFix(x + dx, y + dy, opts);

  const W = HOUSE_W, D = HOUSE_D;

  const walls = [
    wallO([{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: D }, { x: 0, y: D }, { x: 0, y: 0 }]), // perimeter
    // P1 Living ↔ Kitchen — open pass-through y 900–2400 (two jamb stubs).
    wallO([{ x: 5700, y: 0 }, { x: 5700, y: 900 }]),
    wallO([{ x: 5700, y: 2400 }, { x: 5700, y: 4300 }]),
    // P2 Kitchen ↔ Nook+Mudroom — open pass-through x 5700–8100 (east stub only).
    wallO([{ x: 8100, y: 2600 }, { x: 9750, y: 2600 }]),
    wallO([{ x: 8500, y: 2600 }, { x: 8500, y: 4300 }]),   // P3 Nook ↔ Mudroom
    // P4 front rooms ↔ rear — open hallway mouth x 3600–4800 (two stubs).
    wallO([{ x: 0, y: 4300 }, { x: 3600, y: 4300 }]),
    wallO([{ x: 4800, y: 4300 }, { x: 9750, y: 4300 }]),
    wallO([{ x: 3600, y: 4300 }, { x: 3600, y: 9500 }]),   // P5 Primary/closets ↔ Hallway
    // P6 Hallway ↔ Bath/Utility — open alcove mouth y 7300–8500 (two stubs).
    wallO([{ x: 4800, y: 4300 }, { x: 4800, y: 7300 }]),
    wallO([{ x: 4800, y: 8500 }, { x: 4800, y: 9500 }]),
    wallO([{ x: 6900, y: 4300 }, { x: 6900, y: 9500 }]),   // P7 Bath/Utility ↔ Bedroom 2
    wallO([{ x: 4800, y: 6700 }, { x: 6900, y: 6700 }]),   // P8 Bathroom ↔ Utility/Storage
    wallO([{ x: 0, y: 7900 }, { x: 3600, y: 7900 }]),      // P9 Primary ↔ closets
    wallO([{ x: 1800, y: 7900 }, { x: 1800, y: 9500 }]),   // P10 Primary Closet ↔ Linen
    wallO([{ x: 6900, y: 7900 }, { x: 9750, y: 7900 }]),   // P11 Bedroom 2 ↔ closets
    wallO([{ x: 8400, y: 7900 }, { x: 8400, y: 9500 }]),   // P12 BR2 Closet ↔ Storage
  ];

  const rooms = [
    roomO('Living Room', 2850, 2150),
    roomO('Kitchen', 7725, 1300),          // "kitchen" substring gates snack/coffee bubbles
    roomO('Dining Nook', 7100, 3450),
    roomO('Mudroom / Laundry', 9125, 3450),
    roomO('Primary Bedroom', 1800, 6100),
    roomO('Primary Closet', 900, 8700),
    roomO('Linen Closet', 2700, 8700),
    roomO('Hallway', 4200, 6900),
    roomO('Bathroom', 5850, 5500),
    roomO('Utility / Storage', 5850, 8100),
    roomO('Bedroom 2', 8325, 6100),
    roomO('Bedroom 2 Closet', 7650, 8700),
    roomO('Storage Closet', 9075, 8700),
  ];

  const doors = [
    doorO(2450, 0, 0, { w: 900, label: 'Front door', lockEntity: null, doorbellEntity: null }), // south exterior
    doorO(9750, 3500, 90, { w: 800, label: 'Back door' }),   // east exterior (mudroom)
    doorO(8500, 3500, 90, { w: 800, label: 'Mudroom' }),     // P3
    doorO(3600, 6600, 90, { w: 800, label: 'Primary Bedroom' }), // P5
    doorO(3600, 8700, 90, { w: 800, label: 'Linen Closet' }),    // P5
    doorO(900, 7900, 0, { w: 800, label: 'Primary Closet' }),    // P9
    doorO(4800, 5200, 90, { w: 800, label: 'Bathroom' }),        // P6
    doorO(6900, 7300, 90, { w: 800, label: 'Bedroom 2' }),       // P7
    doorO(7400, 7900, 0, { w: 800, label: 'BR2 Closet' }),       // P11
    doorO(8800, 7900, 0, { w: 800, label: 'Storage Closet' }),   // P11
  ];

  const windows = [
    winO(1300, 0, 0, { w: 800, sill: 600, height: 1400, label: 'Living', kind: 'single' }),   // W1
    winO(4300, 0, 0, { w: 800, sill: 600, height: 1400, label: 'Living', kind: 'single' }),   // W2
    winO(0, 2050, 90, { w: 900, sill: 750, height: 1200, label: 'Living side', kind: 'double_hung' }), // W3
    winO(7000, 0, 0, { w: 800, sill: 900, height: 900, label: 'Kitchen', kind: 'double_hung' }),       // W4
    winO(9750, 1350, 90, { w: 900, sill: 900, height: 900, label: 'Kitchen sink', kind: 'double_hung' }), // W5
    winO(0, 5300, 90, { w: 800, sill: 750, height: 1200, label: 'Primary', kind: 'double_hung' }),    // W6
    winO(0, 6900, 90, { w: 800, sill: 750, height: 1200, label: 'Primary', kind: 'double_hung' }),    // W7
    winO(9750, 5400, 90, { w: 800, sill: 750, height: 1200, label: 'Bedroom 2', kind: 'double_hung' }), // W8
    winO(9750, 7000, 90, { w: 800, sill: 750, height: 1200, label: 'Bedroom 2', kind: 'double_hung' }), // W9
    winO(5600, D, 0, { w: 800, sill: 1200, height: 900, label: 'Utility', kind: 'double_hung' }),     // W10
  ];

  // "Tile-look" rug overlays (§4) fake wet-room flooring over the wood floor.
  const KITCHEN_TILE = '#E4DFD3', MUD_TILE = '#A9A6A0', BATH_TILE = '#CFE3DD', UTIL_FLOOR = '#B9B7B0';
  const NOOK_SAGE = '#7C9473';

  const furniture = [
    // Living Room
    fu('sofa', 2600, 3100, { rotation: 90, w: 2200, h: 900 }),
    fu('chair', 2600, 1800, { rotation: 270, w: 800, h: 800, label: 'Armchair' }),
    fu('coffee_table', 3700, 3100, { rotation: 0 }),
    fu('tv_stand', 5500, 3100, { rotation: 90 }),
    fu('tv', 5500, 3150, { rotation: 90, localState: 'off' }),
    fu('bookshelf', 150, 700, { rotation: 90 }),
    fu('rug', 2900, 2600, { rotation: 0, w: 2600, h: 2200 }),
    fu('plant', 5400, 4100, { rotation: 0 }),
    // Kitchen (tile-look rug first, then fixtures on top)
    fu('rug', 7725, 1300, { rotation: 0, w: 3850, h: 2400, color: KITCHEN_TILE, label: 'Kitchen floor' }),
    fu('kitchen_sink', 9450, 1350, { rotation: 0 }),
    fu('dishwasher', 9450, 1900, { rotation: 0 }),
    fu('fridge', 9450, 2350, { rotation: 0 }),
    fu('stove', 7000, 300, { rotation: 180 }),
    fu('microwave', 7000, 320, { rotation: 180, elevation: 1400 }),
    fu('counter', 9450, 700, { rotation: 0, w: 900, h: 650 }),
    fu('cabinet', 7800, 300, { rotation: 180 }),
    // Dining Nook
    fu('rug', 6900, 3450, { rotation: 0, w: 2200, h: 1600, color: NOOK_SAGE, label: 'Nook rug' }),
    fu('table', 6900, 3450, { rotation: 0 }),
    fu('bench', 6100, 3450, { rotation: 90, w: 1200, h: 400 }),
    fu('chair', 6900, 4050, { rotation: 180 }),
    fu('chair', 6900, 2950, { rotation: 0 }),
    // Mudroom / Laundry
    fu('rug', 9125, 3450, { rotation: 0, w: 1050, h: 1500, color: MUD_TILE, label: 'Mudroom floor' }),
    fu('washer', 8950, 3900, { rotation: 180 }),
    fu('dryer', 8950, 3900, { rotation: 180, elevation: 990 }),
    fu('bench', 9500, 3900, { rotation: 90, w: 700, h: 400 }),
    // Primary Bedroom
    fu('bed', 1800, 6700, { rotation: 0, w: 2000, h: 1500 }),
    fu('nightstand', 600, 7500, { rotation: 0 }),
    fu('nightstand', 2800, 7500, { rotation: 0 }),
    fu('dresser', 300, 5300, { rotation: 90 }),
    fu('chair', 3300, 5000, { rotation: 180, w: 800, h: 800, label: 'Reading chair' }),
    // Primary Closet
    fu('wardrobe', 900, 8900, { rotation: 0 }),
    // Linen Closet
    fu('bookshelf', 2500, 8700, { rotation: 0, label: 'Linen shelving' }),
    // Bathroom (tile-look rug first)
    fu('rug', 5850, 5500, { rotation: 0, w: 1900, h: 2200, color: BATH_TILE, label: 'Bath floor' }),
    fu('toilet', 5300, 6300, { rotation: 0 }),
    fu('sink', 5100, 5600, { rotation: 270, label: 'Vanity' }),
    fu('bathtub', 6500, 5500, { rotation: 90 }),
    // Utility / Storage (concrete-look rug first)
    fu('rug', 5850, 8100, { rotation: 0, w: 1900, h: 2600, color: UTIL_FLOOR, label: 'Utility floor' }),
    fu('bookshelf', 6700, 8400, { rotation: 90 }),
    fu('bookshelf', 6700, 9200, { rotation: 90 }),
    fu('cabinet', 4950, 8200, { rotation: 270 }),
    // Bedroom 2
    fu('bed', 8325, 6900, { rotation: 0, w: 1400, h: 1900 }),
    fu('nightstand', 7400, 6200, { rotation: 0 }),
    fu('desk', 7700, 4600, { rotation: 180 }),
    fu('dresser', 9500, 5200, { rotation: 270 }),
    // Bedroom 2 Closet
    fu('wardrobe', 7650, 8900, { rotation: 0 }),
    // Storage Closet
    fu('bookshelf', 9075, 8700, { rotation: 0, label: 'Storage shelving' }),
    // Hallway
    fu('bench', 3850, 7200, { rotation: 90, w: 900, h: 400 }),
  ];

  const lights = [
    lt(2850, 2150, { iconKind: 'bulb', label: 'Living' }),
    lt(7725, 1300, { iconKind: 'bulb', label: 'Kitchen' }),
    lt(7100, 3450, { iconKind: 'pendant', label: 'Dining Nook' }),
    lt(9125, 3450, { iconKind: 'bulb', label: 'Mudroom' }),
    lt(1800, 6100, { iconKind: 'bulb', label: 'Primary Bedroom' }),
    lt(4200, 6900, { iconKind: 'bulb', label: 'Hallway' }),
    lt(5850, 5100, { iconKind: 'sconce', label: 'Bath vanity', radius: 500 }),
    lt(5850, 8100, { iconKind: 'bulb', label: 'Utility' }),
    lt(8325, 6100, { iconKind: 'bulb', label: 'Bedroom 2' }),
  ];

  const switches = [
    sw(3300, 150, { rotation: 0, label: 'Living' }),        // south wall by the front door
    sw(4950, 5100, { rotation: 90, label: 'Bath' }),        // P6, by the bath door
    sw(3500, 6600, { rotation: 90, label: 'Primary' }),     // P5, by the bedroom door
    sw(6800, 7300, { rotation: 90, label: 'Bedroom 2' }),   // P7, by the BR2 door
  ];

  return { W, D, walls, rooms, doors, windows, furniture, lights, switches };
}

export function build() {
  const b = floorplan(id);
  const g = bungalowGeometry(b, { dx: 0, dy: 0 });

  const look = { floorTex: 'wood', floorColor: '#C89468', wallColor: '#EFE6D8' };

  const f = b.floor({
    name: 'Bungalow', w: g.W, d: g.D,
    walls: g.walls, rooms: g.rooms, doors: g.doors, windows: g.windows,
    furniture: g.furniture, lights: g.lights, switches: g.switches,
    look3d: look,
  });

  const roamers = [
    b.roamer('Marlow', ['adult', 'elder', 'professional'], { color: '#4db6ac' }), // the couple pool
    b.roamer('Biscuit', ['dog'], { color: '#a1887f' }),                            // family dog (quadruped rig)
  ];

  return b.assembleStore({
    name,
    floors: [f],
    scene3d: {
      preset: 'day', ...look,
      wallCutaway: true, plumbobs: true,
    },
    roamers,
    notes: [
      '~997 sq ft (92.6 m²) · 1 floor · 13 rooms',
      '',
      'A tidy 1940s "minimal traditional" cottage — a modest single-story starter',
      'home. A front living room takes the whole street-facing left half; behind it a',
      'compact galley kitchen opens (over pass-throughs, no doors) to an interior',
      'breakfast nook and a back mudroom/laundry. A single central hallway serves the',
      'private wing: a primary bedroom with its own closet, a full bath, a walk-through',
      'utility/storage alcove, and a second bedroom, each with reach-in closets. Warm',
      'honey-oak floors and cream plaster-look walls throughout; wet rooms get their',
      'tile/concrete look from oversized floor-colored rug overlays.',
      '',
      'Living Room: sofa facing the TV wall, upholstered armchair by the side window,',
      '  coffee table, corner bookshelf, large seating rug, a corner plant.',
      'Kitchen: galley run — sink under the east window, dishwasher, fridge, stove with',
      '  over-range microwave, base counter and cabinets; pale tile-look floor.',
      'Dining Nook: interior 4-seat breakfast table with a window-side bench, sage rug.',
      'Mudroom / Laundry: washer + dryer at the back door, a boot bench, utility-tile floor.',
      'Primary Bedroom: queen bed, two nightstands, dresser, a reading chair by the window.',
      'Primary Closet: reach-in wardrobe.',
      'Linen Closet: hall shelving.',
      'Hallway: a small bench near the linen closet.',
      'Bathroom: toilet, vanity sink, tub along the east wall; seafoam tile-look floor.',
      'Utility / Storage: storage shelving + a cabinet, the walk-through to Bedroom 2.',
      'Bedroom 2: full bed, nightstand, desk by the east windows, dresser.',
      'Bedroom 2 Closet / Storage Closet: reach-in wardrobe + general storage shelving.',
    ].join('\n'),
  });
}
