// Two-Story Colonial — from docs/demo-houses/two-story-colonial.md.
// A ~2,600 sq ft center-hall Colonial: two full stories over a shared
// footprint, with an attached single-story 2-car garage on the first floor.
// A switchback stair in the center-hall spine links the two floors (matching
// `stairLinkId` on the first-floor flight + the second-floor landing).
//
// Spec kinds not in FURNITURE_KINDS are mapped to the nearest real kind:
//   armchair → chair · sectional → sofa_u · dining_table → table ·
//   china cabinet / buffet / shelving → cabinet · workbench → desk ·
//   fireplace → a `fireplace` LightIconKind light fixture.
import { floorplan } from '../lib.mjs';

export const id = 'two-story-colonial';
export const name = 'Two-Story Colonial';

export function build() {
  const { wall, room, door, win, furn, light, switchFix, roamer, floor, assembleStore } =
    floorplan(id);

  const STAIR = `${id}-spine-stair`;  // shared stairLinkId across the two floors
  const carpet = '#cdb996';           // bedroom carpet tone (rugs simulate carpet)

  // ---------------------------------------------------------------------------
  // FIRST FLOOR — main house block (x 0–12200) + attached garage (x 12200–18300).
  // ---------------------------------------------------------------------------
  const W1 = 18300, D1 = 9900;

  const walls1 = [
    // L-shaped exterior perimeter (house + garage), one closed loop.
    wall([
      { x: 0, y: 0 }, { x: 18300, y: 0 }, { x: 18300, y: 6100 },
      { x: 12200, y: 6100 }, { x: 12200, y: 9900 }, { x: 0, y: 9900 }, { x: 0, y: 0 },
    ]),
    wall([{ x: 4650, y: 0 }, { x: 4650, y: 9900 }]),      // 1 west spine (Living/Family ↔ hall)
    wall([{ x: 7350, y: 0 }, { x: 7350, y: 9900 }]),      // 2 east spine (hall ↔ Dining/Kitchen)
    wall([{ x: 4650, y: 2400 }, { x: 7350, y: 2400 }]),   // 3 Foyer ↔ Stair Hall
    wall([{ x: 4650, y: 6600 }, { x: 7350, y: 6600 }]),   // 4 Stair Hall ↔ Back Hall
    wall([{ x: 0, y: 4300 }, { x: 4650, y: 4300 }]),      // 5 Living ↔ Family
    wall([{ x: 7350, y: 4300 }, { x: 12200, y: 4300 }]),  // 6 Dining ↔ Half Bath+Mudroom
    wall([{ x: 7350, y: 5700 }, { x: 12200, y: 5700 }]),  // 7 Half Bath+Mudroom ↔ Kitchen/Nook
    wall([{ x: 8850, y: 4300 }, { x: 8850, y: 5700 }]),   // 8 Half Bath ↔ Mudroom
    wall([{ x: 12200, y: 0 }, { x: 12200, y: 6100 }]),    // 9 house ↔ garage firewall
  ];

  const rooms1 = [
    room('Living Room', 2325, 2150),
    room('Foyer', 6000, 1200),
    room('Stair Hall', 6000, 4500),
    room('Back Hall', 6000, 8250),
    room('Dining Room', 9775, 2150),
    room('Half Bath', 8100, 5000),
    room('Mudroom / Laundry', 10525, 5000),
    room('Family Room', 2325, 7100),
    // Kitchen + Breakfast Nook = one open wall loop, two anchors (kitchen
    // substring gates the snack/coffee thought-bubbles).
    room('Kitchen', 8675, 7800),
    room('Breakfast Nook', 11100, 7800),
    room('Garage', 15250, 3050),
  ];

  const doors1 = [
    door(5500, 0, 0, { w: 1400, kind: 'double', label: 'Front', lockEntity: null, doorbellEntity: null }),
    door(4650, 600, 270, { w: 1400, kind: 'french', label: 'Living ↔ Foyer' }),   // glazed pair
    door(7350, 600, 270, { w: 1400, kind: 'french', label: 'Dining ↔ Foyer' }),   // glazed pair
    door(5550, 2400, 0, { w: 1000, label: 'Foyer ↔ Stair' }),       // cased opening
    door(5500, 6600, 0, { w: 1000, label: 'Stair ↔ Back Hall' }),   // cased opening
    door(4650, 7500, 270, { w: 1200, label: 'Family ↔ Hall' }),     // cased opening
    door(7350, 7000, 270, { w: 1200, label: 'Kitchen ↔ Hall' }),    // cased opening
    door(7350, 4700, 270, { w: 700, label: 'Half Bath' }),
    door(11000, 5700, 0, { w: 800, label: 'Mudroom' }),
    door(12200, 4700, 270, { w: 900, label: 'Garage service', lockEntity: null }),
    door(12200, 7000, 270, { w: 900, label: 'Side entrance' }),
    door(12700, 0, 0, { w: 2400, kind: 'garage', label: 'Garage bay 1' }),
    door(15400, 0, 0, { w: 2400, kind: 'garage', label: 'Garage bay 2' }),
    door(17300, 6100, 0, { w: 900, label: 'Garage man-door' }),
  ];

  const windows1 = [
    win(1300, 0, 0, { w: 1200, sill: 800, height: 1300, kind: 'double_hung', label: 'Living front' }),
    win(3300, 0, 0, { w: 1200, sill: 800, height: 1300, kind: 'double_hung', label: 'Living front' }),
    win(8600, 0, 0, { w: 1200, sill: 800, height: 1300, kind: 'double_hung', label: 'Dining front' }),
    win(10950, 0, 0, { w: 1200, sill: 800, height: 1300, kind: 'double_hung', label: 'Dining front' }),
    win(2000, D1, 0, { w: 1800, sill: 0, height: 2050, kind: 'sliding', label: 'Family slider' }),
    win(4000, D1, 0, { w: 1200, sill: 800, height: 1300, kind: 'double_hung', label: 'Family rear' }),
    win(0, 6000, 90, { w: 1200, sill: 800, height: 1300, label: 'Family side' }),
    win(0, 8300, 90, { w: 1200, sill: 800, height: 1300, label: 'Family side' }),
    win(8600, D1, 0, { w: 1200, sill: 800, height: 1300, kind: 'double_hung', label: 'Kitchen' }),
    win(11100, D1, 0, { w: 1500, sill: 700, height: 1500, kind: 'picture', label: 'Breakfast Nook' }),
    win(12200, 8000, 90, { w: 1200, sill: 800, height: 1300, kind: 'double_hung', label: 'Nook side' }),
    win(18300, 3000, 90, { w: 1200, sill: 900, height: 900, label: 'Garage side' }),
  ];

  const furniture1 = [
    // Living Room
    furn('sofa', 1600, 1200, { rotation: 180 }),
    furn('chair', 3600, 1500, { rotation: 135, label: 'Armchair' }),
    furn('coffee_table', 2300, 1900, { rotation: 0 }),
    furn('tv_stand', 2325, 3900, { rotation: 0 }),
    furn('tv', 2325, 3900, { rotation: 0, localState: 'off' }),
    furn('bookshelf', 200, 900, { rotation: 270 }),
    furn('rug', 2300, 1900, { rotation: 0, w: 2600, h: 1700 }),
    furn('plant', 300, 3900, { rotation: 0 }),
    // Hall bench moved into the Living Room — the foyer is now pure circulation
    // between the front doors and the two french-door openings.
    furn('bench', 4200, 3000, { rotation: 90, w: 800, h: 400 }),
    // Foyer
    furn('rug', 6000, 1200, { rotation: 0, w: 1200, h: 2000 }),
    // Stair Hall — the flight (first half of the linked stair pair)
    furn('stairs', 6000, 4500, { rotation: 0, stairLinkId: STAIR, label: 'Stairs to 2F' }),
    furn('bench', 4850, 6300, { rotation: 270 }),
    // Back Hall
    furn('bookshelf', 4850, 9600, { rotation: 0 }),
    furn('rug', 6000, 8000, { rotation: 0, w: 1200, h: 2400 }),
    // Dining Room
    furn('table', 9775, 2150, { rotation: 0, w: 1800, h: 1000, label: 'Dining table' }),
    furn('chair', 8950, 1650, { rotation: 0 }),
    furn('chair', 9775, 1650, { rotation: 0 }),
    furn('chair', 10600, 1650, { rotation: 0 }),
    furn('chair', 8950, 2650, { rotation: 180 }),
    furn('chair', 9775, 2650, { rotation: 180 }),
    furn('chair', 10600, 2650, { rotation: 180 }),
    furn('cabinet', 11900, 1500, { rotation: 90, label: 'China cabinet' }),
    furn('plant', 8200, 2200, { rotation: 0 }),
    furn('rug', 9775, 2150, { rotation: 0, w: 2700, h: 1900 }),
    furn('plant', 11950, 3950, { rotation: 0 }),
    // Half Bath
    furn('toilet', 8400, 4700, { rotation: 90 }),
    furn('sink', 8650, 5500, { rotation: 0, label: 'Vanity' }),
    // Mudroom / Laundry
    furn('washer', 10300, 4600, { rotation: 180 }),
    furn('dryer', 11100, 4600, { rotation: 180 }),
    furn('bench', 9200, 4600, { rotation: 180, w: 900, h: 400 }),
    furn('cabinet', 9300, 5500, { rotation: 0 }),
    // Family Room
    furn('sofa_u', 1400, 5600, { rotation: 180, label: 'Sectional' }),
    furn('coffee_table', 2100, 6500, { rotation: 0 }),
    furn('chair', 3900, 5900, { rotation: 90, label: 'Armchair' }),
    furn('tv_stand', 2325, 8900, { rotation: 0 }),
    furn('tv', 2325, 8900, { rotation: 0, localState: 'off' }),
    furn('bookshelf', 500, 8600, { rotation: 0 }),
    furn('rug', 2200, 6600, { rotation: 0, w: 3000, h: 2400 }),
    furn('plant', 4400, 8900, { rotation: 0 }),
    // Kitchen (west zone of the open room)
    furn('counter', 7650, 6350, { rotation: 270, w: 1000, h: 600 }),
    furn('counter', 8700, 6150, { rotation: 180, w: 2200, h: 650 }),
    furn('stove', 8900, 6150, { rotation: 180 }),
    furn('microwave', 8400, 6250, { rotation: 180, elevation: 1400 }),
    // x 9600: at 9300 the dishwasher carcass merged 285 mm into the range beside
    // it. Now 15 mm clear of the stove, still under the same counter run.
    furn('dishwasher', 9600, 6150, { rotation: 180 }),
    furn('kitchen_sink', 8600, 9570, { rotation: 0 }),
    furn('island', 9000, 7800, { rotation: 0 }),
    furn('fridge', 7550, 9300, { rotation: 270 }),
    furn('cabinet', 9800, 5950, { rotation: 180 }),
    // Breakfast Nook (east zone of the open room)
    furn('table', 11000, 9000, { rotation: 0, w: 900, h: 900, label: 'Breakfast' }),
    furn('chair', 10400, 9000, { rotation: 270 }),
    furn('chair', 11600, 9000, { rotation: 90 }),
    furn('chair', 11000, 8400, { rotation: 180 }),
    furn('chair', 11000, 9600, { rotation: 0 }),
    furn('plant', 12000, 6700, { rotation: 0 }),
    // Garage
    furn('cabinet', 17900, 1600, { rotation: 90 }),
    furn('desk', 12400, 3000, { rotation: 270, label: 'Workbench' }),
    furn('bookshelf', 17900, 4600, { rotation: 90, label: 'Shelving' }),
    // Side-yard dressing (unbuilt notch beside the garage — bare ground)
    furn('trash_bin', 13400, 7000, { rotation: 0 }),
    furn('recycle_bin', 14100, 7000, { rotation: 0 }),
    furn('tree', 15500, 8500, { rotation: 0 }),
    // Curbside
    // rot 0 = door/flag toward the street (−Y); at 180 it faced the house wall.
    furn('mailbox', 4800, -700, { rotation: 0, label: 'Curbside mailbox' }),
  ];

  const lights1 = [
    light(2325, 2150, { iconKind: 'bulb', label: 'Living Room' }),
    light(9775, 2150, { iconKind: 'pendant', label: 'Dining' }),
    light(6000, 1200, { iconKind: 'bulb', label: 'Foyer' }),
    light(6000, 4500, { iconKind: 'bulb', label: 'Stair Hall' }),
    light(6000, 8250, { iconKind: 'bulb', label: 'Back Hall' }),
    light(4750, 7900, { iconKind: 'wall_sconce', rotation: -90, radius: 500, label: 'Back Hall sconce' }),
    light(7250, 7900, { iconKind: 'wall_sconce', rotation: 90, radius: 500, label: 'Back Hall sconce' }),
    light(8100, 5000, { iconKind: 'sconce', label: 'Half Bath', radius: 500 }),
    light(10525, 5000, { iconKind: 'bulb', label: 'Mudroom' }),
    light(2325, 7100, { iconKind: 'bulb', label: 'Family Room' }),
    light(3600, 6100, { iconKind: 'lamp', label: 'Family lamp', height: 1400 }),
    light(200, 6750, { iconKind: 'fireplace', label: 'Fireplace', rotation: 90 }),
    light(9000, 7800, { iconKind: 'pendant', label: 'Kitchen island' }),
    light(8675, 7000, { iconKind: 'round', label: 'Kitchen' }),
    light(11100, 8000, { iconKind: 'pendant', label: 'Breakfast' }),
    light(17000, 3000, { iconKind: 'strip', label: 'Garage', rotation: 0, length: 3000 }),
    light(15000, 3000, { iconKind: 'strip', label: 'Garage', rotation: 0, length: 3000 }),
  ];

  const switches1 = [
    switchFix(5100, 200, { rotation: 0, label: 'Foyer' }),
    switchFix(300, 9200, { rotation: 90, label: 'Patio' }),
  ];

  const f1 = floor({
    name: 'First Floor', w: W1, d: D1,
    walls: walls1, rooms: rooms1, doors: doors1, windows: windows1,
    furniture: furniture1, lights: lights1, switches: switches1,
    look3d: { floorTex: 'wood', floorColor: '#b8875a', wallColor: '#f3ecd9' },
  });

  // ---------------------------------------------------------------------------
  // SECOND FLOOR — same origin/footprint as the main house block (no garage).
  // ---------------------------------------------------------------------------
  const W2 = 12200, D2 = 9900;

  const walls2 = [
    wall([{ x: 0, y: 0 }, { x: 12200, y: 0 }, { x: 12200, y: 9900 }, { x: 0, y: 9900 }, { x: 0, y: 0 }]),
    wall([{ x: 4650, y: 0 }, { x: 4650, y: 9900 }]),      // 1 west spine
    wall([{ x: 7350, y: 0 }, { x: 7350, y: 9900 }]),      // 2 east spine
    wall([{ x: 4650, y: 2400 }, { x: 7350, y: 2400 }]),   // 3 Landing ↔ Stairwell
    wall([{ x: 4650, y: 6600 }, { x: 7350, y: 6600 }], 'railing'), // 4 Stairwell overlook guardrail
    wall([{ x: 0, y: 4300 }, { x: 4650, y: 4300 }]),      // 5 Bedroom 2 ↔ Primary suite row
    wall([{ x: 0, y: 5700 }, { x: 4650, y: 5700 }]),      // 6 Primary Bath/WIC ↔ Primary Bedroom
    wall([{ x: 2650, y: 4300 }, { x: 2650, y: 5700 }]),   // 7 Primary Bath ↔ Primary WIC
    wall([{ x: 7350, y: 4300 }, { x: 12200, y: 4300 }]),  // 8 Bedroom 3 ↔ Hall Bath/Linen
    wall([{ x: 7350, y: 5700 }, { x: 12200, y: 5700 }]),  // 9 Hall Bath/Linen ↔ Bedroom 4
    wall([{ x: 9950, y: 4300 }, { x: 9950, y: 5700 }]),   // 10 Hall Bath ↔ Linen
  ];

  const rooms2 = [
    room('Bedroom 2', 2325, 2150),
    room('Landing / Reading Nook', 6000, 1200),
    room('Stairwell', 6000, 4500),
    room('Upstairs Hallway', 6000, 8250),
    room('Bedroom 3', 9775, 2150),
    room('Hall Bath', 8650, 5000),
    room('Linen / Storage', 11075, 5000),
    room('Primary Bathroom', 1325, 5000),
    room('Primary Walk-in Closet', 3650, 5000),
    room('Primary Bedroom', 2325, 7800),
    room('Bedroom 4', 9775, 7800),
  ];

  const doors2 = [
    door(4650, 1500, 270, { w: 900, label: 'Bedroom 2' }),
    door(7350, 1500, 270, { w: 900, label: 'Bedroom 3' }),
    door(4650, 7800, 270, { w: 900, label: 'Primary Bedroom' }),
    door(7350, 7800, 270, { w: 900, label: 'Bedroom 4' }),
    door(1000, 5700, 0, { w: 700, label: 'Primary Bath' }),
    door(3200, 5700, 0, { w: 700, label: 'Primary WIC' }),
    door(7350, 4700, 270, { w: 700, label: 'Hall Bath' }),
    door(11500, 5700, 0, { w: 700, label: 'Linen' }),
    door(5500, 2400, 0, { w: 1000, label: 'Landing ↔ Stair' }),   // cased opening
    door(5500, 6600, 0, { w: 1000, label: 'Stair ↔ Hallway' }),   // guard-rail opening
  ];

  const windows2 = [
    win(1300, 0, 0, { w: 1200, sill: 800, height: 1300, kind: 'double_hung', label: 'Bedroom 2 front' }),
    win(3300, 0, 0, { w: 1200, sill: 800, height: 1300, kind: 'double_hung', label: 'Bedroom 2 front' }),
    win(8600, 0, 0, { w: 1200, sill: 800, height: 1300, kind: 'double_hung', label: 'Bedroom 3 front' }),
    win(10950, 0, 0, { w: 1200, sill: 800, height: 1300, kind: 'double_hung', label: 'Bedroom 3 front' }),
    win(1500, D2, 0, { w: 1200, sill: 800, height: 1300, kind: 'double_hung', label: 'Primary rear' }),
    win(3500, D2, 0, { w: 1200, sill: 800, height: 1300, kind: 'double_hung', label: 'Primary rear' }),
    win(0, 7500, 90, { w: 1200, sill: 800, height: 1300, label: 'Primary side' }),
    win(0, 5000, 90, { w: 900, sill: 1400, height: 900, label: 'Primary Bath' }),
    win(8600, D2, 0, { w: 1200, sill: 800, height: 1300, kind: 'double_hung', label: 'Bedroom 4 rear' }),
    win(10950, D2, 0, { w: 1200, sill: 800, height: 1300, kind: 'double_hung', label: 'Bedroom 4 rear' }),
    win(12200, 7500, 90, { w: 1200, sill: 800, height: 1300, label: 'Bedroom 4 side' }),
  ];

  const furniture2 = [
    // Bedroom 2
    // BEDSIDE GAP: a nightstand sits BESIDE the mattress, never inside it —
    // ≥ 30 mm rail clearance, coordinates rounded to 10 mm. The queen is 1524
    // wide (x 938–2462), so ±1000 buried each nightstand 12 mm; ±1050 clears
    // the rail by 38 mm with 350 mm still free to each side wall.
    furn('bed', 1700, 1100, { rotation: 180 }),
    furn('nightstand', 650, 700, { rotation: 180 }),
    furn('nightstand', 2750, 700, { rotation: 180 }),
    furn('dresser', 300, 3600, { rotation: 270 }),
    furn('desk', 3900, 3600, { rotation: 90 }),
    furn('rug', 1700, 2300, { rotation: 0, w: 1800, h: 1400, color: carpet }),
    // Landing / Reading Nook — the linked stair pair's upper landing
    furn('stair_landing', 6000, 3000, { rotation: 0, stairLinkId: STAIR, label: 'Stair landing' }),
    furn('chair', 5200, 700, { rotation: 270, label: 'Reading chair' }),
    furn('bookshelf', 6900, 300, { rotation: 180 }),
    furn('rug', 6000, 1200, { rotation: 0, w: 1200, h: 2000 }),
    // Upstairs Hallway
    furn('bookshelf', 4850, 9600, { rotation: 0 }),
    furn('rug', 6000, 8000, { rotation: 0, w: 1200, h: 2400 }),
    // Bedroom 3
    furn('bed_full', 8750, 3290, { rotation: 0 }),
    furn('nightstand', 7750, 3700, { rotation: 0 }),
    furn('dresser', 11700, 700, { rotation: 180 }),
    furn('desk', 7750, 700, { rotation: 180 }),
    furn('rug', 8750, 3000, { rotation: 0, w: 1600, h: 1300, color: carpet }),
    // Hall Bath
    furn('toilet', 9200, 5350, { rotation: 0 }),
    furn('sink', 8400, 5350, { rotation: 0, label: 'Vanity' }),
    furn('bathtub', 8800, 4650, { rotation: 180, w: 1600, h: 600 }),
    // Linen / Storage
    furn('cabinet', 10600, 5000, { rotation: 0, label: 'Linen' }),
    // Primary Bathroom
    furn('toilet', 400, 4700, { rotation: 270 }),
    furn('sink', 400, 5350, { rotation: 270, label: 'Vanity' }),
    furn('bathtub', 1750, 4700, { rotation: 180, w: 1600, h: 700 }),
    furn('shower', 2200, 5300, { rotation: 90, w: 800, h: 800 }),
    // Primary Walk-in Closet
    furn('wardrobe', 3300, 4700, { rotation: 180, w: 1200, h: 600 }),
    furn('wardrobe', 4300, 5100, { rotation: 90, w: 1000, h: 600 }),
    furn('dresser', 4300, 7200, { rotation: 90 }),
    // Primary Bedroom
    furn('bed_king', 2325, 8700, { rotation: 0 }),
    furn('nightstand', 1000, 8700, { rotation: 0 }),
    furn('nightstand', 3650, 8700, { rotation: 0 }),
    furn('dresser', 300, 6300, { rotation: 270 }),
    furn('chair', 4300, 6300, { rotation: 90, label: 'Reading chair' }),
    furn('ottoman', 2325, 7200, { rotation: 0 }),
    furn('rug', 2325, 7800, { rotation: 0, w: 2700, h: 2100, color: '#d7dee2' }),
    // Bedroom 4
    // Queen spans x 7938–9462; ±1000 buried both nightstands 12 mm. ±1050
    // clears the rail by 38 mm — the west one lands flush on the x 7350
    // partition's inner face (7400), which is where a bedside table belongs.
    furn('bed', 8700, 8700, { rotation: 0 }),
    furn('nightstand', 7650, 9500, { rotation: 0 }),
    furn('nightstand', 9750, 8700, { rotation: 0 }),
    furn('dresser', 10000, 6300, { rotation: 90 }),
    furn('desk', 7700, 6300, { rotation: 270 }),
    furn('rug', 8700, 8000, { rotation: 0, w: 1800, h: 1400, color: carpet }),
  ];

  const lights2 = [
    light(2325, 2150, { iconKind: 'bulb', label: 'Bedroom 2' }),
    light(6000, 1200, { iconKind: 'bulb', label: 'Landing' }),
    light(6000, 4500, { iconKind: 'pendant', label: 'Stairwell' }),
    light(6000, 8250, { iconKind: 'bulb', label: 'Upstairs Hallway' }),
    light(9775, 2150, { iconKind: 'bulb', label: 'Bedroom 3' }),
    light(8650, 5000, { iconKind: 'sconce', label: 'Hall Bath', radius: 500 }),
    light(1325, 5000, { iconKind: 'sconce', label: 'Primary Bath', radius: 500 }),
    light(2325, 7800, { iconKind: 'bulb', label: 'Primary Bedroom' }),
    light(1000, 8700, { iconKind: 'lamp', label: 'Primary lamp', height: 1400 }),
    light(9775, 7800, { iconKind: 'fan', label: 'Bedroom 4 fan' }),
  ];

  const f2 = floor({
    name: 'Second Floor', w: W2, d: D2,
    walls: walls2, rooms: rooms2, doors: doors2, windows: windows2,
    furniture: furniture2, lights: lights2, switches: [],
    look3d: { floorTex: 'none', floorColor: '#cdb996', wallColor: '#f1e9c9' },
  });

  const roamers = [
    roamer('Morgan', ['adult', 'professional'], { color: '#4fc3f7' }),
    roamer('Avery', ['child', 'teen'], { color: '#f06292' }),
    roamer('Sam', ['adult', 'elder'], { color: '#81c784' }),
  ];

  return assembleStore({
    name,
    floors: [f1, f2],  // lowest story first
    scene3d: {
      preset: 'day', floorTex: 'wood', floorColor: '#b8875a', wallColor: '#f3ecd9',
      wallCutaway: true, glassHouse: false, plumbobs: true,
    },
    roamers,
    notes: [
      '~2,600 sq ft (242 m²) · 2 floors + garage · 22 rooms',
      '',
      'A traditional American center-hall Colonial: two full stories over a shared',
      '12,200 × 9,900 mm house block, with a single-story attached 2-car garage tucked',
      'to the east on the first floor. A switchback stair rises through the 2,700 mm',
      'center-hall spine — the first-floor flight and the second-floor landing carry a',
      'matching stairLinkId so avatars can transit between levels. Warm oak floors and',
      'cream walls downstairs, carpet-toned bedrooms upstairs (rugs simulate carpet).',
      'The L-shaped footprint leaves an unbuilt side yard beside the garage that renders',
      'as bare ground (bins + a tree dress it up).',
      '',
      'FIRST FLOOR',
      'Living Room: sofa, angled armchair, coffee table, TV on a stand, bookshelf, rug, plant.',
      'Foyer: entry bench, runner rug, plant; front door with a foyer switch.',
      'Stair Hall: the switchback stair flight (linked to 2F), a landing bench.',
      'Back Hall: bookshelf, runner; connects the stair hall to the family room + kitchen.',
      'Dining Room: six-seat table, china cabinet, rug, plant; front-lit by two windows.',
      'Half Bath: toilet + pedestal vanity; sconce.',
      'Mudroom / Laundry: washer, dryer, boot bench, cubby cabinet; garage service door.',
      'Family Room: U-sectional, coffee table, armchair, TV on a stand, bookshelf, rug,',
      '  a west-wall fireplace light, and a rear patio slider; ceiling light + a lamp.',
      'Kitchen: two counter runs, stove, over-range microwave, dishwasher, sink under the',
      '  rear window, a center island, refrigerator, and an upper cabinet; island pendant.',
      'Breakfast Nook: round table with four chairs, corner plant; pendant + picture window.',
      'Garage: storage cabinet, workbench, bin shelving; two LED strips; two bay doors.',
      '',
      'SECOND FLOOR',
      'Bedroom 2: queen bed, two nightstands, dresser, desk, carpet-tone rug.',
      'Landing / Reading Nook: the upper stair landing (linked to 1F), a reading chair,',
      '  bookshelf, and a rug at the top of the stairs.',
      'Stairwell: open guardrail overlook down to the first floor (railing wall, no floor).',
      'Bedroom 3: full bed, nightstand, dresser, study desk, rug.',
      'Hall Bath: toilet, vanity, tub/shower combo; sconce.',
      'Linen / Storage: built-in linen cabinet off the hall bath.',
      'Primary Bedroom: king bed, two nightstands, dresser, reading chair, foot-of-bed',
      '  ottoman, cool-tone rug; ceiling light + bedside lamp.',
      'Primary Bathroom: toilet, vanity, tub, corner shower; sconce.',
      'Primary Walk-in Closet: two wardrobe runs + a center dresser.',
      'Bedroom 4: queen bed, two nightstands, dresser, desk, rug.',
      '',
      'Millwork detail: a double-leaf front door opens onto the center hall, and matched',
      '  glazed french pairs flank the foyer into the living and dining rooms (which makes',
      '  the foyer pure circulation, so the hall bench moved into the living room). A',
      '  wall-sconce pair lights the back hall, Bedroom 4 gets a bare ceiling fan, and a',
      '  mailbox stands at the curb by the front walk.',
    ].join('\n'),
  });
}
