// Townhouse — Minimalist Edition — a VARIATION of townhouse-3level.mjs.
// Shares the exact three-storey shell + linked stair core via the exported
// `buildTownhouseFloors(b)`; only the furnishing and palette change. This is the
// sparse Scandinavian read: a handful of light-oak, low pieces per level, a
// pale-blond wood floor and crisp white walls throughout, generous negative
// space. One resident roamer and a house cat.
import { floorplan } from '../lib.mjs';
import { buildTownhouseFloors } from './townhouse-3level.mjs';

export const id = 'townhouse-minimal';
export const name = 'Townhouse — Minimalist';

export function build() {
  const b = floorplan(id);
  const { furn, light, switchFix, roamer, floor, assembleStore } = b;
  const [g, m, t] = buildTownhouseFloors(b);

  const oak = '#e8dcc2';   // pale blond oak
  const white = '#F4F1EA'; // crisp warm white

  // ---------- Ground — flex room as a calm reading corner ----------
  const groundFurn = [
    ...g.stairs,
    furn('bench', 5850, 900, { rotation: 270 }),
    furn('cabinet', 600, 6100, { rotation: 180, label: 'Storage' }),
    furn('chair', 1400, 10400, { rotation: 180, label: 'Reading chair' }),
    furn('ottoman', 1400, 9700, { rotation: 0 }),
    furn('bookshelf', 300, 10700, { rotation: 90 }),
    furn('plant', 5500, 10500, { rotation: 0 }),
    furn('rug', 3000, 9500, { rotation: 0, w: 2400, h: 2000 }),
  ];
  const groundLights = [
    light(1800, 3300, { iconKind: 'strip', label: 'Garage', rotation: 0, length: 2600 }),
    light(4800, 900, { iconKind: 'bulb', label: 'Entry' }),
    light(3000, 9000, { iconKind: 'pendant', label: 'Flex' }),
  ];
  const groundSwitches = [switchFix(4400, 300, { rotation: 90, label: 'Entry' })];

  // ---------- Middle — one low sofa, a small table, a bare-bones kitchen ----------
  const middleFurn = [
    ...m.stairs,
    furn('sofa', 2200, 700, { rotation: 0, w: 2400, h: 900 }),
    furn('coffee_table', 2200, 1700, { rotation: 0 }),
    furn('rug', 2400, 1500, { rotation: 0, w: 3000, h: 2200 }),
    furn('plant', 4200, 5800, { rotation: 0 }),
    furn('toilet', 5750, 750, { rotation: 270 }),
    furn('sink', 4650, 750, { rotation: 90 }),
    furn('table', 3000, 7300, { rotation: 0, w: 1400, h: 900, label: 'Dining table' }),
    furn('chair', 2400, 7300, { rotation: 270 }),
    furn('chair', 3600, 7300, { rotation: 90 }),
    furn('chair', 3000, 6800, { rotation: 0 }),
    furn('chair', 3000, 7800, { rotation: 180 }),
    // Pared-back kitchen run
    furn('stove', 900, 10700, { rotation: 180 }),
    furn('kitchen_sink', 2200, 10700, { rotation: 180 }),
    furn('counter', 1500, 10700, { rotation: 180, w: 2400, h: 600 }),
    furn('fridge', 5700, 10300, { rotation: 270 }),
  ];
  const middleLights = [
    light(2200, 1600, { iconKind: 'bulb', label: 'Living' }),
    light(3000, 7300, { iconKind: 'pendant', label: 'Dining' }),
    light(2000, 9800, { iconKind: 'round', label: 'Kitchen' }),
  ];
  const middleSwitches = [switchFix(4300, 300, { rotation: 90, label: 'Living' })];

  // ---------- Top — just the essentials in each room ----------
  const topFurn = [
    ...t.stairs,
    furn('bed', 1200, 900, { rotation: 0, w: 1400, h: 2000 }),
    furn('nightstand', 350, 300, { rotation: 0 }),
    furn('rug', 1200, 1500, { rotation: 0, w: 1800, h: 1600 }),
    furn('sink', 4650, 300, { rotation: 0 }),
    furn('toilet', 4100, 1400, { rotation: 90 }),
    furn('washer', 300, 3700, { rotation: 90 }),
    furn('dryer', 300, 4700, { rotation: 90 }),
    furn('bed', 2100, 10400, { rotation: 180, w: 1900, h: 2100 }),
    furn('nightstand', 900, 10400, { rotation: 180 }),
    furn('nightstand', 3300, 10400, { rotation: 180 }),
    furn('rug', 2100, 9800, { rotation: 0, w: 2400, h: 2200 }),
    furn('wardrobe', 5000, 7200, { rotation: 270 }),
    furn('sink_vanity', 4500, 8600, { rotation: 90, w: 1200, h: 550 }),
    furn('shower', 5550, 10700, { rotation: 180 }),
  ];
  const topLights = [
    light(1950, 1650, { iconKind: 'bulb', label: 'Secondary Bedroom' }),
    light(2100, 8650, { iconKind: 'bulb', label: 'Primary' }),
    light(4700, 9600, { iconKind: 'sconce', label: 'Ensuite', radius: 450 }),
  ];
  const topSwitches = [switchFix(1500, 3500, { rotation: 0, label: 'Bedroom' })];

  const ground = floor({
    name: g.name, w: g.w, d: g.d,
    walls: g.walls, rooms: g.rooms, doors: g.doors, windows: g.windows,
    furniture: groundFurn, lights: groundLights, switches: groundSwitches,
    look3d: { floorTex: 'wood', floorColor: oak, wallColor: white },
  });
  const middle = floor({
    name: m.name, w: m.w, d: m.d,
    walls: m.walls, rooms: m.rooms, doors: m.doors, windows: m.windows,
    furniture: middleFurn, lights: middleLights, switches: middleSwitches,
    look3d: { floorTex: 'wood', floorColor: oak, wallColor: white },
    roamers: [roamer('Freya', ['adult', 'professional'], { color: '#90a4ae' })],
  });
  const topF = floor({
    name: t.name, w: t.w, d: t.d,
    walls: t.walls, rooms: t.rooms, doors: t.doors, windows: t.windows,
    furniture: topFurn, lights: topLights, switches: topSwitches,
    look3d: { floorTex: 'wood', floorColor: oak, wallColor: white },
    roamers: [roamer('Nisse', ['cat'], { color: '#bcaaa4' })],  // resident cat (quadruped rig)
  });

  return assembleStore({
    name,
    floors: [ground, middle, topF],
    scene3d: {
      preset: 'day', floorTex: 'wood', floorColor: oak, wallColor: white,
      wallCutaway: true, plumbobs: true,
    },
    notes: [
      '~1,875 sq ft (174 m²) heated + 256 sq ft garage · 3 floors · 21 rooms — minimalist edition',
      '',
      'The same narrow three-storey townhouse shell and linked switchback stair core,',
      'furnished the Scandinavian way: a deliberately small number of low, light-oak',
      'pieces per level, a pale blond wood floor and crisp warm-white walls on every',
      'floor, and a lot of intentional empty space. No clutter, no accent-heavy zones —',
      'just the essentials, so the rooms read calm and the daylight from the front and',
      'rear facades carries. One resident and a house cat roam the levels.',
      '',
      'GROUND — Garage: single storage cabinet (no car). Entry: shoe bench. Flex Room /',
      '  Office: a single reading chair + ottoman and a bookshelf in the corner, plant,',
      '  one rug — the rest left open.',
      'MIDDLE — Living Room: one low sofa + coffee table on a rug, a corner plant. Half',
      '  Bath off the landing. Dining Room: a compact four-seat table under a pendant.',
      '  Kitchen: a pared-back run (stove, sink, one counter, corner fridge) — no island.',
      'TOP — Secondary Bedroom: bed + single nightstand + rug. Hall Bath: vanity + toilet.',
      '  Laundry Closet: stacked washer + dryer. Primary Bedroom: bed, two nightstands,',
      '  rug — nothing else. Primary Walk-in Closet: one wardrobe. Primary Ensuite: a',
      '  slim vanity + walk-in shower.',
    ].join('\n'),
  });
}
