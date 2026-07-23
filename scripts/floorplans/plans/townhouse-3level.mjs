// Narrow 3-Level Townhouse — from docs/demo-houses/townhouse-3level.md.
// A ~1,875 sq ft (174 m²) heated urban rowhouse on an identical 6000 × 11000 mm
// footprint stacked three storeys around a single switchback stair core against
// the right party wall:
//   Ground — garage / entry / half bath / flex-office
//   Middle — open kitchen–dining–living + half bath + balcony
//   Top    — primary suite + secondary bedroom + hall bath + laundry
//
// The two long walls (x=0, x=6000) are windowless PARTY walls; all glazing +
// both exterior doors + the balcony door live on the front (y=0) and rear
// (y=11000) facades.
//
// Stair links: the shaft stacks at x:4500–6000, y:3300–6300 on every floor. The
// middle floor carries TWO stairs pieces (a switchback: a down-flight to Ground
// and an up-flight to Top). stairLinkId 'th-l1l2' pairs Ground↔Middle-down;
// 'th-l2l3' pairs Middle-up↔Top — each id lives on exactly two pieces across two
// adjacent floors (Store.floors order = Ground[0] < Middle[1] < Top[2]).
//
// The shell (walls/rooms/doors/windows/stairs) is exported as
// `buildTownhouseFloors(b)` so the minimalist variant (townhouse-minimal.mjs)
// shares the exact geometry + stair links without copying coordinates.
import { floorplan } from '../lib.mjs';

export const id = 'townhouse-3level';
export const name = 'Townhouse — 3 Level';

const W = 6000, D = 11000;
const rect = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: D }, { x: 0, y: D }, { x: 0, y: 0 }];

/**
 * Build the three shared floor shells onto plan builder `b`. Returns an array of
 * three { name, w, d, walls, rooms, doors, windows, stairs } objects (Ground,
 * Middle, Top). `stairs` carries the linked stairs furniture (with stairLinkId).
 */
export function buildTownhouseFloors(b) {
  const { wall, room, door, win, furn } = b;

  // ---- Ground floor ----
  const ground = {
    name: 'Ground', w: W, d: D,
    walls: [
      wall(rect),
      wall([{ x: 3600, y: 0 }, { x: 3600, y: 6600 }]),        // W1 garage ↔ entry/hall
      wall([{ x: 4500, y: 1800 }, { x: 4500, y: 6300 }]),     // W2 hallway ↔ half bath + stair
      wall([{ x: 4500, y: 1800 }, { x: 6000, y: 1800 }]),     // entry ↔ half bath (added for closure)
      wall([{ x: 4500, y: 3300 }, { x: 6000, y: 3300 }]),     // W3 half bath ↔ stairwell
      wall([{ x: 0, y: 6600 }, { x: 6000, y: 6600 }]),        // W4 garage+hall ↔ flex room
    ],
    rooms: [
      room('Garage', 1800, 3300),
      room('Entry / Foyer', 5000, 900),
      room('Half Bath', 5250, 2550),
      room('Hallway', 4050, 4800),
      room('Stairwell', 5250, 4800),
      room('Flex Room / Office', 3000, 8800),
    ],
    doors: [
      door(650, 0, 0, { w: 2400, kind: 'garage', label: 'Garage' }),
      door(4600, 0, 0, { w: 800, label: 'Entry', lockEntity: null, doorbellEntity: null }),
      door(4500, 2300, 270, { w: 800, label: 'Half Bath' }),
      door(3600, 5300, 270, { w: 800, label: 'Garage service' }),
      door(3600, 6600, 0, { w: 1200, label: 'Flex archway', localState: 'off' }),
      door(2550, 11000, 0, { w: 900, label: 'Backyard' }),
    ],
    windows: [
      win(1600, 11000, 0, { w: 1200, sill: 900, height: 1200, label: 'Flex' }),
      win(4400, 11000, 0, { w: 1200, sill: 900, height: 1200, label: 'Flex' }),
    ],
    stairs: [
      furn('stairs', 5250, 4800, { rotation: 0, w: 1500, h: 3000, stairLinkId: 'th-l1l2' }),
    ],
  };

  // ---- Middle floor ----
  const middle = {
    name: 'Middle', w: W, d: D,
    walls: [
      wall(rect),
      wall([{ x: 4500, y: 0 }, { x: 4500, y: 3300 }]),        // W1 living ↔ half bath + landing
      wall([{ x: 4500, y: 1500 }, { x: 6000, y: 1500 }]),     // W2 half bath ↔ landing
      wall([{ x: 4500, y: 3300 }, { x: 6000, y: 3300 }]),     // W3 landing ↔ stairwell
      wall([{ x: 4500, y: 3300 }, { x: 4500, y: 6300 }], 'railing'), // W4 shaft guard-rail
      wall([{ x: 4500, y: 6300 }, { x: 6000, y: 6300 }]),     // W5 stairwell ↔ dining
    ],
    rooms: [
      room('Living Room', 2200, 3000),
      room('Half Bath', 5250, 750),
      room('Stair Landing', 5250, 2400),
      room('Stairwell', 5250, 4800),
      room('Dining Room', 3000, 7300),
      room('Kitchen', 3000, 9600),   // "kitchen" substring gates snack/coffee bubbles
    ],
    doors: [
      door(4500, 600, 270, { w: 800, label: 'Half Bath' }),
      door(4900, 3300, 0, { w: 800, label: 'Stair door' }),
      door(4900, 6300, 0, { w: 800, label: 'Stair exit' }),
      door(6000, 6800, 270, { w: 1500, label: 'Balcony' }),
    ],
    windows: [
      win(1300, 0, 0, { w: 1200, sill: 900, height: 1200, label: 'Living' }),
      win(3200, 0, 0, { w: 1200, sill: 900, height: 1200, label: 'Living' }),
      win(4800, 11000, 0, { w: 1200, sill: 900, height: 1200, label: 'Kitchen' }),
    ],
    stairs: [
      // switchback: down-flight to Ground + up-flight to Top (fill the 3000 mm shaft)
      furn('stairs', 5250, 5550, { rotation: 0, w: 1500, h: 1500, stairLinkId: 'th-l1l2' }),
      furn('stairs', 5250, 4050, { rotation: 180, w: 1500, h: 1500, stairLinkId: 'th-l2l3' }),
    ],
  };

  // ---- Top floor ----
  const top = {
    name: 'Top', w: W, d: D,
    walls: [
      wall(rect),
      wall([{ x: 3900, y: 0 }, { x: 3900, y: 3300 }]),        // W1 secondary bed ↔ hall bath + landing
      wall([{ x: 3900, y: 1800 }, { x: 6000, y: 1800 }]),     // W2 hall bath ↔ landing
      wall([{ x: 0, y: 3300 }, { x: 6000, y: 3300 }]),        // W3 front rooms ↔ laundry/hall/stair band
      wall([{ x: 1800, y: 3300 }, { x: 1800, y: 6300 }]),     // W4 laundry ↔ upstairs hallway
      wall([{ x: 0, y: 5100 }, { x: 1800, y: 5100 }]),        // W5 laundry ↔ hallway run B
      wall([{ x: 4500, y: 3300 }, { x: 4500, y: 6300 }], 'railing'), // W6 shaft guard-rail
      wall([{ x: 4500, y: 6300 }, { x: 6000, y: 6300 }], 'railing'), // W7 shaft top overlook
      wall([{ x: 0, y: 6300 }, { x: 6000, y: 6300 }]),        // W8 hall/laundry ↔ primary suite
      wall([{ x: 4200, y: 6300 }, { x: 4200, y: 11000 }]),    // W9 primary bed ↔ closet + ensuite
      wall([{ x: 4200, y: 8300 }, { x: 6000, y: 8300 }]),     // W10 closet ↔ ensuite
    ],
    rooms: [
      room('Secondary Bedroom', 1950, 1650),
      room('Hall Bath', 4900, 900),
      room('Stair Landing', 4900, 2550),
      room('Laundry Closet', 900, 4200),
      room('Upstairs Hallway', 3000, 4800),
      room('Stairwell', 5250, 4800),
      room('Primary Bedroom', 2100, 8600),
      room('Primary Walk-in Closet', 5100, 7300),
      room('Primary Ensuite', 5100, 9600),
    ],
    doors: [
      door(1400, 3300, 0, { w: 900, label: 'Secondary Bedroom' }),
      door(4600, 3300, 0, { w: 1000, label: 'Stair passage' }),
      door(4500, 4300, 270, { w: 1000, label: 'Stair exit' }),
      door(3900, 900, 270, { w: 800, label: 'Hall Bath' }),
      door(1800, 4200, 270, { w: 800, label: 'Laundry' }),
      door(1650, 6300, 0, { w: 900, label: 'Primary Suite' }),
      door(4200, 7300, 270, { w: 800, label: 'Closet' }),
      door(4200, 10100, 270, { w: 800, label: 'Ensuite' }),
    ],
    windows: [
      win(1950, 0, 0, { w: 1200, sill: 900, height: 1200, label: 'Secondary Bedroom' }),
      win(5150, 0, 0, { w: 1000, sill: 1200, height: 900, label: 'Hall Bath' }),
      win(1100, 11000, 0, { w: 1200, sill: 900, height: 1200, label: 'Primary' }),
      win(3000, 11000, 0, { w: 1200, sill: 900, height: 1200, label: 'Primary' }),
      win(5200, 11000, 0, { w: 900, sill: 1400, height: 900, label: 'Ensuite' }),
    ],
    stairs: [
      furn('stairs', 5250, 4800, { rotation: 0, w: 1500, h: 3000, stairLinkId: 'th-l2l3' }),
    ],
  };

  return [ground, middle, top];
}

export function build() {
  const b = floorplan(id);
  const { furn, light, switchFix, roamer, floor, assembleStore } = b;
  const [g, m, t] = buildTownhouseFloors(b);

  // ---------- Ground floor furnishing ----------
  const groundFurn = [
    ...g.stairs,
    furn('cabinet', 600, 6100, { rotation: 180, label: 'Storage' }),
    furn('counter', 3300, 2400, { rotation: 90, w: 1800, h: 600, label: 'Workbench' }),
    furn('bench', 5850, 900, { rotation: 270 }),
    furn('rug', 4900, 900, { rotation: 0, w: 1400, h: 1200 }),
    furn('rug', 4050, 4000, { rotation: 0, w: 800, h: 3000, label: 'Runner' }),
    furn('desk', 1200, 10400, { rotation: 180 }),
    furn('chair', 1200, 9900, { rotation: 0 }),
    furn('bookshelf', 300, 10700, { rotation: 90 }),
    furn('tv_stand', 5700, 8800, { rotation: 90 }),
    furn('tv', 5700, 8800, { rotation: 90, localState: 'off' }),
    furn('sofa', 3500, 8800, { rotation: 270 }),
    furn('coffee_table', 4600, 8800, { rotation: 90 }),
    furn('rug', 4400, 8800, { rotation: 0, w: 2800, h: 2400 }),
  ];
  const groundLights = [
    light(1800, 3300, { iconKind: 'strip', label: 'Garage', rotation: 0, length: 2600 }),
    light(4800, 900, { iconKind: 'bulb', label: 'Entry' }),
    light(5250, 2550, { iconKind: 'sconce', label: 'Half Bath', radius: 450 }),
    light(1500, 9000, { iconKind: 'bulb', label: 'Flex' }),
    light(4500, 9000, { iconKind: 'bulb', label: 'Flex media' }),
  ];
  const groundSwitches = [
    switchFix(4400, 300, { rotation: 90, label: 'Entry' }),
    switchFix(3800, 6500, { rotation: 0, label: 'Flex' }),
  ];

  // ---------- Middle floor furnishing ----------
  const middleFurn = [
    ...m.stairs,
    // Living
    furn('sofa', 2200, 700, { rotation: 0, w: 2400, h: 900 }),
    furn('coffee_table', 2200, 1600, { rotation: 0 }),
    furn('tv_stand', 300, 2000, { rotation: 90 }),
    furn('tv', 300, 2000, { rotation: 90, localState: 'off' }),
    furn('chair', 4000, 2200, { rotation: 270, label: 'Armchair' }),
    furn('rug', 2600, 1600, { rotation: 0, w: 3400, h: 2400 }),
    furn('chair', 300, 4800, { rotation: 90, label: 'Reading chair' }),
    furn('ottoman', 900, 4800, { rotation: 90 }),
    furn('plant', 4200, 5800, { rotation: 0 }),
    // Half bath
    furn('toilet', 5600, 1100, { rotation: 270 }),
    furn('sink', 5250, 350, { rotation: 180 }),
    // Dining
    furn('table', 3000, 7300, { rotation: 0, w: 1800, h: 1000, label: 'Dining table' }),
    furn('chair', 2200, 7300, { rotation: 270 }),
    furn('chair', 3800, 7300, { rotation: 90 }),
    furn('chair', 2600, 6800, { rotation: 0 }),
    furn('chair', 3400, 6800, { rotation: 0 }),
    furn('chair', 2600, 7800, { rotation: 180 }),
    furn('chair', 3400, 7800, { rotation: 180 }),
    // Kitchen (rear wall run + island)
    furn('stove', 900, 10700, { rotation: 180 }),
    furn('microwave', 900, 10700, { rotation: 180, elevation: 1400 }),
    furn('dishwasher', 2400, 10700, { rotation: 180 }),
    furn('kitchen_sink', 2800, 10700, { rotation: 180 }),
    furn('counter', 1500, 10700, { rotation: 180, w: 2000, h: 600 }),
    furn('counter', 4000, 10700, { rotation: 180, w: 1600, h: 600 }),
    furn('fridge', 5700, 10300, { rotation: 270 }),
    furn('island', 2800, 9300, { rotation: 0, w: 2200, h: 900 }),
    furn('stool', 2200, 9700, { rotation: 0 }),
    furn('stool', 2800, 9700, { rotation: 0 }),
    furn('stool', 3400, 9700, { rotation: 0 }),
  ];
  const middleLights = [
    light(2200, 1600, { iconKind: 'bulb', label: 'Living' }),
    light(600, 4600, { iconKind: 'lamp', label: 'Reading lamp', height: 1500 }),
    light(5250, 750, { iconKind: 'sconce', label: 'Half Bath', radius: 450 }),
    light(3000, 7300, { iconKind: 'pendant', label: 'Dining' }),
    light(2800, 9800, { iconKind: 'round', label: 'Kitchen' }),
    light(2800, 9300, { iconKind: 'under_cabinet', label: 'Island', rotation: 0, length: 2000 }),
  ];
  const middleSwitches = [
    switchFix(4300, 300, { rotation: 90, label: 'Living' }),
    switchFix(300, 8200, { rotation: 270, label: 'Kitchen' }),
  ];

  // ---------- Top floor furnishing ----------
  const topFurn = [
    ...t.stairs,
    // Secondary bedroom
    furn('bed', 1200, 900, { rotation: 0, w: 1500, h: 2100 }),
    furn('nightstand', 350, 300, { rotation: 0 }),
    furn('nightstand', 2050, 300, { rotation: 0 }),
    furn('dresser', 2900, 600, { rotation: 270 }),
    furn('rug', 1200, 1400, { rotation: 0, w: 2000, h: 1800 }),
    // Hall bath
    furn('sink', 4850, 350, { rotation: 180 }),
    furn('toilet', 4300, 400, { rotation: 180 }),
    furn('bathtub', 5550, 900, { rotation: 90, w: 1700, h: 800 }),
    // Laundry
    furn('washer', 300, 3700, { rotation: 90 }),
    furn('dryer', 300, 4700, { rotation: 90 }),
    // Upstairs hallway
    furn('rug', 3150, 4800, { rotation: 0, w: 2500, h: 900, label: 'Runner' }),
    // Primary bedroom
    furn('bed', 2100, 10400, { rotation: 180, w: 2000, h: 2200 }),
    furn('nightstand', 900, 10400, { rotation: 180 }),
    furn('nightstand', 3300, 10400, { rotation: 180 }),
    furn('dresser', 300, 7200, { rotation: 90, w: 1400, h: 550 }),
    furn('bench', 2100, 9100, { rotation: 180 }),
    furn('chair', 3700, 6800, { rotation: 270, label: 'Reading chair' }),
    furn('rug', 2100, 9800, { rotation: 0, w: 2600, h: 2400 }),
    // Primary walk-in closet
    furn('wardrobe', 5000, 6800, { rotation: 0, w: 1200, h: 600 }),
    furn('wardrobe', 5600, 7900, { rotation: 270, w: 1200, h: 600 }),
    // Primary ensuite
    furn('sink_vanity', 5100, 8650, { rotation: 180, w: 1600, h: 550, label: 'Double vanity' }),
    furn('shower', 5450, 9700, { rotation: 180 }),
    furn('toilet', 5500, 10600, { rotation: 90 }),
  ];
  const topLights = [
    light(1950, 1650, { iconKind: 'bulb', label: 'Secondary Bedroom' }),
    light(4900, 900, { iconKind: 'sconce', label: 'Hall Bath', radius: 450 }),
    light(900, 4200, { iconKind: 'bulb', label: 'Laundry' }),
    light(2100, 8650, { iconKind: 'bulb', label: 'Primary' }),
    light(900, 10400, { iconKind: 'lamp', label: 'Bedside lamp', height: 1400 }),
    light(4700, 9200, { iconKind: 'sconce', label: 'Ensuite', radius: 450 }),
  ];
  const topSwitches = [
    switchFix(1500, 3500, { rotation: 0, label: 'Bedroom' }),
    switchFix(1800, 6100, { rotation: 90, label: 'Suite' }),
  ];

  const ground = floor({
    name: g.name, w: g.w, d: g.d,
    walls: g.walls, rooms: g.rooms, doors: g.doors, windows: g.windows,
    furniture: groundFurn, lights: groundLights, switches: groundSwitches,
    look3d: { floorTex: 'wood', floorColor: '#C7A06B', wallColor: '#F1ECE2' },
    roamers: [roamer('Kai', ['adult', 'professional'], { color: '#4fc3f7' })],
  });
  const middle = floor({
    name: m.name, w: m.w, d: m.d,
    walls: m.walls, rooms: m.rooms, doors: m.doors, windows: m.windows,
    furniture: middleFurn, lights: middleLights, switches: middleSwitches,
    look3d: { floorTex: 'wood', floorColor: '#A6784C', wallColor: '#EDE7DA' },
    roamers: [roamer('Elena', ['adult', 'teen'], { color: '#f06292' })],
  });
  const topF = floor({
    name: t.name, w: t.w, d: t.d,
    walls: t.walls, rooms: t.rooms, doors: t.doors, windows: t.windows,
    furniture: topFurn, lights: topLights, switches: topSwitches,
    look3d: { floorTex: 'none', floorColor: '#D8CFC0', wallColor: '#E7EAEC' },
    roamers: [roamer('Milo', ['child', 'teen'], { color: '#81c784' })],
  });

  return assembleStore({
    name,
    floors: [ground, middle, topF],
    scene3d: {
      preset: 'day', floorTex: 'wood', floorColor: '#C7A06B', wallColor: '#F1ECE2',
      wallCutaway: true, plumbobs: true,
    },
    notes: [
      '~1,875 sq ft (174 m²) heated + 256 sq ft garage · 3 floors · 21 rooms',
      '',
      'A narrow urban infill rowhouse on an identical 6000 × 11000 mm footprint stacked',
      'three storeys around a single switchback stair core against the right party wall.',
      'The two long walls are windowless party walls shared with the neighbors; all light',
      'and both exterior doors live on the front (street) and rear (yard) facades. Ground',
      'is utilitarian (garage + flex office), the Middle is the public level (open',
      'kitchen/dining/living + balcony), and the Top is private (bedrooms/baths/laundry).',
      'Wood-look floors on the living levels, tile in the wet rooms, sealed concrete tone',
      'in the garage; walls warm-neutral below, cooler upstairs. Stairs are linked across',
      'floors so avatars transit between levels; the Middle floor’s switchback carries',
      'both a down-flight and an up-flight.',
      '',
      'GROUND — Garage: workbench + storage cabinet (no car modeled). Entry / Foyer: shoe',
      '  bench + rug by the front door. Half Bath: powder room off the hall. Hallway:',
      '  runner connecting entry → stair → flex. Stairwell: bottom flight up to Middle.',
      '  Flex Room / Office: desk + chair under the rear window, bookshelf, plus a casual',
      '  media zone (sofa, TV on a stand, coffee table, rug).',
      'MIDDLE — Living Room: sofa + coffee table facing a wall TV on a stand, armchair,',
      '  rug, and a rear reading nook (chair + ottoman + plant). Half Bath off the stair',
      '  landing. Stairwell: switchback down-/up-flights. Dining Room: six-seat table.',
      '  Kitchen: rear-wall run (stove, over-range microwave, dishwasher, sink, two counter',
      '  runs, corner fridge) + a freestanding island with three stools; door to the',
      '  cantilevered balcony.',
      'TOP — Secondary Bedroom: queen bed, two nightstands, dresser, rug. Hall Bath:',
      '  vanity sink, toilet, tub. Laundry Closet: stacked washer + dryer. Upstairs',
      '  Hallway: runner. Stairwell: top landing / guarded overlook. Primary Bedroom:',
      '  king bed under the rear windows, two nightstands, dresser, foot-of-bed bench,',
      '  reading chair, rug. Primary Walk-in Closet: two wardrobe runs. Primary Ensuite:',
      '  double vanity, toilet, and a walk-in shower.',
    ].join('\n'),
  });
}
