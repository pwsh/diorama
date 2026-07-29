// "Aldergate" — Large Multilevel Luxury Home — from docs/demo-houses/large-multilevel.md.
// Three stacked levels over an identical 19200 × 9750 mm footprint: a walkout
// finished BASEMENT (theater / wet bar / gym / rec / guest suite), a MAIN level
// (formal front rooms + open kitchen/great-room + 3-car garage), and an UPPER
// level (hotel-style primary suite + four more bedrooms + laundry). Two stair
// connections, each a matching `stairLinkId` pair: basement↔main and main↔upper.
//
// Store.floors is ordered lowest-first (higher index = higher story), so the
// basement is floors[0]. Spec kinds map to real FURNITURE_KINDS directly
// (sink_vanity, kitchen_sink, wall_tv, sofa_l_left, sofa_u, exercise_equipment,
// coffee_maker, toaster, stairs, stair_landing all exist); armchair → chair,
// console/buffet/bar/shelving → the nearest cabinet/table/dresser kind.
import { floorplan } from '../lib.mjs';

export const id = 'large-multilevel';
export const name = 'Large Multilevel — Aldergate';

export function build() {
  const { wall, room, door, win, furn, light, switchFix, roamer, floor, assembleStore } =
    floorplan(id);

  const FW = 19200, FD = 9750;
  const LINK_LOWER = `${id}-stair-lower`;  // basement ↔ main
  const LINK_UPPER = `${id}-stair-upper`;  // main ↔ upper
  const ext = () => wall([{ x: 0, y: 0 }, { x: FW, y: 0 }, { x: FW, y: FD }, { x: 0, y: FD }, { x: 0, y: 0 }]);
  const carpet = '#d9c9a8';

  // ===========================================================================
  // BASEMENT LEVEL (floors[0]) — theater / bar / guest suite up front, gym + rec
  // in back, mechanical under the garage footprint. Walkout egress windows.
  // ===========================================================================
  const bWalls = [
    ext(),
    wall([{ x: 7200, y: 0 }, { x: 7200, y: 9750 }]),      // 1 mechanical / core
    wall([{ x: 11200, y: 0 }, { x: 11200, y: 4200 }]),    // 2 theater / wet bar (archway)
    wall([{ x: 13200, y: 0 }, { x: 13200, y: 4200 }]),    // 3 wet bar / guest bedroom
    wall([{ x: 16700, y: 0 }, { x: 16700, y: 4200 }]),    // 4 guest bedroom / bath+closet
    wall([{ x: 16700, y: 2400 }, { x: 19200, y: 2400 }]), // 5 guest bath / guest closet
    wall([{ x: 9700, y: 4200 }, { x: 9700, y: 9750 }]),   // 6 gym / stair hall
    wall([{ x: 12200, y: 4200 }, { x: 12200, y: 9750 }]), // 7 stair hall / rec+storage
    wall([{ x: 12200, y: 7300 }, { x: 19200, y: 7300 }]), // 8 rec / rear storage (doorway)
    wall([{ x: 7200, y: 4200 }, { x: 19200, y: 4200 }]),  // 9 front band / rear band
  ];
  const bRooms = [
    room('Mechanical / Storage', 3600, 4875),
    room('Home Theater', 9200, 2100),
    room('Wet Bar', 12200, 2100),
    room('Guest Bedroom', 14950, 2100),
    room('Guest Bath', 17950, 1200),
    room('Guest Closet', 17950, 3300),
    room('Gym / Fitness', 8450, 6975),
    room('Basement Stair Hall', 10950, 6975),
    room('Rec / Game Room', 15700, 5750),
    room('Rear Storage', 15700, 8525),
  ];
  const bDoors = [
    door(7200, 7000, 90, { w: 900, label: 'Mechanical ↔ Gym' }),
    door(7200, 2100, 90, { w: 800, label: 'Mechanical ↔ Theater' }),
    door(8000, 4200, 0, { w: 800, label: 'Theater ↔ Gym' }),
    door(11700, 4200, 0, { w: 900, label: 'Bar ↔ Stair Hall' }),
    door(14950, 4200, 0, { w: 800, label: 'Guest ↔ Rec' }),
    door(16700, 1200, 90, { w: 800, label: 'Guest Bath' }),
    door(16700, 3600, 90, { w: 800, label: 'Guest Closet' }),
    door(9700, 7000, 90, { w: 900, label: 'Gym ↔ Stair Hall' }),
    door(11200, 1800, 270, { w: 1200, label: 'Theater ↔ Bar' }),   // archway
    door(15500, 7300, 0, { w: 900, label: 'Rec ↔ Storage' }),      // open doorway
  ];
  const bWindows = [
    win(19200, 2100, 90, { w: 1200, sill: 1800, height: 900, kind: 'casement_pair', label: 'Guest egress' }),
    win(19200, 5750, 90, { w: 1500, sill: 1800, height: 1000, kind: 'sliding', label: 'Rec egress' }),
  ];
  const bFurn = [
    // Mechanical / Storage (unfinished — a couple of stand-in blocks + cabinet)
    furn('cabinet', 900, 900, { rotation: 90, label: 'Utility shelving' }),
    furn('block', 1200, 3000, { rotation: 0, w: 800, h: 800, label: 'Furnace' }),
    furn('block', 2400, 3000, { rotation: 0, w: 600, h: 600, label: 'Water heater' }),
    // Home Theater
    furn('wall_tv', 9200, 4050, { rotation: 180, elevation: 600, localState: 'off' }),
    furn('sofa_u', 9200, 1600, { rotation: 0, w: 2600, h: 2000 }),
    furn('ottoman', 9200, 2600, { rotation: 0 }),
    furn('chair', 8300, 700, { rotation: 180 }),
    furn('chair', 10100, 700, { rotation: 180 }),
    furn('bookshelf', 7400, 3900, { rotation: 90, label: 'AV storage' }),
    // Wet Bar
    furn('counter', 12200, 600, { rotation: 180, w: 1800, h: 650, label: 'Bar' }),
    furn('kitchen_sink', 11700, 600, { rotation: 180, label: 'Bar sink' }),
    furn('stool', 11600, 1000, { rotation: 0 }),
    furn('stool', 12200, 1000, { rotation: 0 }),
    furn('stool', 12800, 1000, { rotation: 0 }),
    furn('cabinet', 12850, 3900, { rotation: 0, w: 500, h: 400, label: 'Back bar' }),
    furn('fridge', 12850, 3300, { rotation: 0, w: 500, h: 500, label: 'Beverage fridge' }),
    // Guest Bedroom
    furn('bed', 14950, 3600, { rotation: 180, w: 1500, h: 2000 }),
    furn('nightstand', 13700, 3600, { rotation: 180 }),
    furn('nightstand', 16300, 2400, { rotation: 180 }),
    furn('dresser', 13500, 600, { rotation: 180 }),
    furn('rug', 14950, 2600, { rotation: 0, w: 2000, h: 1600, color: carpet }),
    // Guest Bath
    furn('toilet', 17700, 400, { rotation: 0 }),
    furn('sink_vanity', 17700, 2100, { rotation: 180, label: 'Vanity' }),
    furn('shower', 18700, 1200, { rotation: 90, w: 900, h: 900 }),
    // Guest Closet
    furn('wardrobe', 17950, 3300, { rotation: 0 }),
    // Gym / Fitness
    furn('exercise_equipment', 8450, 5800, { rotation: 0, label: 'Treadmill' }),
    furn('exercise_equipment', 8450, 7600, { rotation: 0, label: 'Bike' }),
    furn('bench', 8450, 8800, { rotation: 0, label: 'Weight bench' }),
    furn('rug', 8450, 9200, { rotation: 0, w: 2000, h: 1200, label: 'Gym mat' }),
    // Basement Stair Hall — physical flight (lower link) in the west lane
    furn('stairs', 10325, 7000, { rotation: 0, stairLinkId: LINK_LOWER, label: 'Stairs to Main' }),
    // Rec / Game Room
    furn('table', 14450, 5750, { rotation: 0, w: 2600, h: 1400, label: 'Pool table' }),
    furn('sofa', 17800, 6900, { rotation: 180 }),
    furn('coffee_table', 17800, 6300, { rotation: 0 }),
    furn('wall_tv', 17800, 7250, { rotation: 180, elevation: 1000, localState: 'off' }),
    furn('cabinet', 12500, 6900, { rotation: 90, label: 'Game storage' }),
    furn('rug', 14450, 5750, { rotation: 0, w: 3000, h: 1800 }),
    // Rear Storage
    furn('cabinet', 13000, 8500, { rotation: 0 }),
    furn('cabinet', 15500, 8500, { rotation: 0 }),
    furn('cabinet', 18000, 8500, { rotation: 0 }),
  ];
  const bLights = [
    light(3600, 4875, { iconKind: 'strip', label: 'Mechanical', rotation: 0, length: 3000 }),
    light(9200, 2100, { iconKind: 'recessed', label: 'Theater', radius: 700 }),
    light(12200, 2100, { iconKind: 'pendant', label: 'Wet Bar' }),
    light(14950, 2100, { iconKind: 'bulb', label: 'Guest Bedroom' }),
    light(17950, 1200, { iconKind: 'sconce', label: 'Guest Bath', radius: 500 }),
    light(8450, 6975, { iconKind: 'strip', label: 'Gym', rotation: 90, length: 3000 }),
    light(10950, 6975, { iconKind: 'bulb', label: 'Stair Hall' }),
    light(15700, 5750, { iconKind: 'bulb', label: 'Rec / Game Room' }),
    light(17800, 6900, { iconKind: 'lamp', label: 'Rec lamp', height: 1400 }),
    light(15700, 8525, { iconKind: 'bulb', label: 'Rear Storage' }),
  ];
  const basement = floor({
    name: 'Basement', w: FW, d: FD,
    walls: bWalls, rooms: bRooms, doors: bDoors, windows: bWindows,
    furniture: bFurn, lights: bLights, switches: [
      switchFix(11700, 4400, { rotation: 0, label: 'Stair Hall' }),
    ],
    look3d: { floorTex: 'concrete', floorColor: '#9aa0a6', wallColor: '#e3ded4' },
  });

  // ===========================================================================
  // MAIN LEVEL (floors[1]) — 3-car garage + service wing west, formal front
  // rooms + open kitchen/great-room east.
  // ===========================================================================
  const mWalls = [
    ext(),
    wall([{ x: 7200, y: 0 }, { x: 7200, y: 9750 }]),      // 1 west wing / core
    wall([{ x: 0, y: 6600 }, { x: 7200, y: 6600 }]),      // 2 garage / mudroom wing
    wall([{ x: 4200, y: 6600 }, { x: 4200, y: 8200 }]),   // 3 mudroom / powder room
    wall([{ x: 6200, y: 6600 }, { x: 6200, y: 8200 }]),   // 4 powder room / coat closet
    wall([{ x: 4200, y: 8200 }, { x: 6200, y: 8200 }]),   // 4b powder room / mud passage
    wall([{ x: 9700, y: 0 }, { x: 9700, y: 4200 }]),      // 5 office / foyer
    wall([{ x: 12200, y: 0 }, { x: 12200, y: 4200 }]),    // 6 foyer / living (archway)
    wall([{ x: 15700, y: 0 }, { x: 15700, y: 4200 }]),    // 7 living / dining (archway)
    wall([{ x: 9700, y: 4200 }, { x: 9700, y: 9750 }]),   // 8 pantry+backhall / stair hall
    wall([{ x: 12200, y: 4200 }, { x: 12200, y: 9750 }]), // 9 stair hall / kitchen+great room
    wall([{ x: 16700, y: 4200 }, { x: 16700, y: 6600 }]), // 10 kitchen / breakfast (peninsula)
    wall([{ x: 7200, y: 4200 }, { x: 9700, y: 4200 }]),   // 11 office / pantry
    wall([{ x: 12200, y: 4200 }, { x: 19200, y: 4200 }]), // 12 living+dining / kitchen+breakfast
    wall([{ x: 7200, y: 6200 }, { x: 9700, y: 6200 }]),   // 13 pantry / back hall
  ];
  const mRooms = [
    room('Garage', 3600, 3300),
    room('Mudroom', 2100, 8175),
    room('Powder Room', 5200, 7600),
    room('Coat Closet', 6700, 8175),
    room('Home Office', 8450, 2100),
    room('Foyer', 10950, 2100),
    room('Living Room', 13950, 2100),
    room('Dining Room', 17450, 2100),
    room('Pantry', 8450, 5200),
    room('Back Hall', 8450, 7975),
    room('Main Stair Hall', 10950, 7000),
    room('Kitchen', 14450, 5400),
    room('Breakfast Room', 17950, 5400),
    room('Great Room', 15700, 8175),
  ];
  const mDoors = [
    door(10500, 0, 0, { w: 900, label: 'Front', lockEntity: null, doorbellEntity: null }),
    door(300, 0, 0, { w: 2300, kind: 'garage', label: 'Garage bay 1' }),
    door(2700, 0, 0, { w: 2300, kind: 'garage', label: 'Garage bay 2' }),
    door(5100, 0, 0, { w: 2300, kind: 'garage', label: 'Garage bay 3' }),
    door(2000, 6600, 0, { w: 900, label: 'Garage ↔ Mudroom' }),
    door(0, 8000, 90, { w: 900, label: 'Mudroom exterior' }),
    door(7200, 8000, 90, { w: 900, label: 'Mudroom ↔ Hall' }),
    door(4800, 8200, 0, { w: 800, label: 'Powder Room' }),
    door(9700, 2100, 90, { w: 800, label: 'Office' }),
    door(12200, 1800, 270, { w: 1200, label: 'Foyer ↔ Living' }),   // archway
    door(15700, 1800, 270, { w: 1200, label: 'Living ↔ Dining' }),  // archway
    door(8450, 6200, 0, { w: 800, label: 'Pantry ↔ Back Hall' }),
    door(9700, 8000, 90, { w: 900, label: 'Back Hall ↔ Stair Hall' }),
    door(12200, 8000, 270, { w: 1200, label: 'Stair Hall ↔ Great Room' }),
    door(16200, 4200, 0, { w: 900, label: 'Dining ↔ Kitchen' }),
    door(16700, 5400, 270, { w: 1200, label: 'Kitchen ↔ Breakfast' }),
    door(15500, FD, 0, { w: 1800, label: 'Great Room patio' }),
  ];
  const mWindows = [
    win(8450, 0, 0, { w: 1200, sill: 900, height: 1200, kind: 'double_hung', label: 'Office front' }),
    win(13950, 0, 0, { w: 1800, sill: 700, height: 1500, kind: 'picture', label: 'Living front' }),
    win(17450, 0, 0, { w: 1800, sill: 700, height: 1500, kind: 'picture', label: 'Dining front' }),
    win(19200, 5400, 90, { w: 1500, sill: 900, height: 1200, kind: 'casement_pair', label: 'Breakfast side' }),
    win(13000, FD, 0, { w: 2000, sill: 700, height: 1800, kind: 'picture', label: 'Great Room rear' }),
    win(17500, FD, 0, { w: 1800, sill: 700, height: 1500, kind: 'picture', label: 'Great Room rear' }),
    win(2000, FD, 0, { w: 1000, sill: 1200, height: 900, kind: 'single', label: 'Mudroom rear' }),
    win(0, 3000, 90, { w: 900, sill: 1500, height: 900, kind: 'single', label: 'Garage side' }),
  ];
  const mFurn = [
    // Garage
    furn('cabinet', 800, 6300, { rotation: 180 }),
    furn('cabinet', 3500, 6300, { rotation: 180 }),
    furn('counter', 5800, 6300, { rotation: 180, w: 1800, h: 650, label: 'Workbench' }),
    // Mudroom
    furn('bench', 300, 9000, { rotation: 90 }),
    furn('wardrobe', 3900, 8000, { rotation: 270 }),
    // Powder Room
    furn('toilet', 5200, 7000, { rotation: 0 }),
    furn('sink_vanity', 5750, 7000, { rotation: 270, label: 'Vanity' }),
    // Home Office
    furn('desk', 8450, 600, { rotation: 180 }),
    furn('chair', 8450, 1300, { rotation: 0 }),
    furn('bookshelf', 7400, 3700, { rotation: 0 }),
    furn('rug', 8450, 2100, { rotation: 0, w: 1600, h: 1400 }),
    // Foyer
    furn('table', 9950, 3300, { rotation: 270, w: 1400, h: 400, label: 'Console' }),
    furn('bench', 10950, 3900, { rotation: 0 }),
    furn('rug', 10950, 2100, { rotation: 0, w: 1200, h: 2400 }),
    // Living Room
    furn('sofa', 13950, 3700, { rotation: 180 }),
    furn('coffee_table', 13950, 2900, { rotation: 0 }),
    furn('chair', 13100, 2600, { rotation: 90, label: 'Accent chair' }),
    furn('chair', 14800, 2600, { rotation: 270, label: 'Accent chair' }),
    furn('bookshelf', 12500, 600, { rotation: 180 }),
    furn('rug', 13950, 2900, { rotation: 0, w: 2600, h: 1800 }),
    // Dining Room
    furn('table', 17450, 2100, { rotation: 0, w: 2000, h: 1100, label: 'Dining table' }),
    furn('chair', 16650, 1500, { rotation: 0 }),
    furn('chair', 17450, 1500, { rotation: 0 }),
    furn('chair', 18250, 1500, { rotation: 0 }),
    furn('chair', 16650, 2700, { rotation: 180 }),
    furn('chair', 17450, 2700, { rotation: 180 }),
    furn('chair', 18250, 2700, { rotation: 180 }),
    furn('dresser', 17450, 600, { rotation: 180, label: 'Buffet' }),
    furn('rug', 17450, 2100, { rotation: 0, w: 2700, h: 1900 }),
    // Pantry
    furn('cabinet', 7400, 4500, { rotation: 90 }),
    furn('cabinet', 9500, 4500, { rotation: 270 }),
    // Kitchen
    furn('island', 14450, 5000, { rotation: 0 }),
    furn('stove', 13200, 4500, { rotation: 0 }),
    furn('microwave', 13200, 4550, { rotation: 0, elevation: 1400 }),
    furn('fridge', 12400, 5200, { rotation: 90 }),
    furn('kitchen_sink', 15500, 6400, { rotation: 180 }),
    furn('dishwasher', 15000, 6400, { rotation: 180 }),
    furn('cabinet', 12600, 6600, { rotation: 90 }),
    furn('coffee_maker', 16400, 6300, { rotation: 0, elevation: 900 }),
    furn('toaster', 16400, 6000, { rotation: 0, elevation: 900 }),
    // Breakfast Room
    furn('table', 18300, 5400, { rotation: 0, w: 1200, h: 1200, label: 'Breakfast' }),
    furn('chair', 18300, 4700, { rotation: 0 }),
    furn('chair', 18300, 6100, { rotation: 180 }),
    furn('chair', 17600, 5400, { rotation: 90 }),
    furn('chair', 19000, 5400, { rotation: 270 }),
    // Great Room
    furn('sofa_l_left', 14200, 8300, { rotation: 0, label: 'Sectional' }),
    furn('coffee_table', 14200, 7900, { rotation: 0 }),
    furn('ottoman', 14200, 8700, { rotation: 0 }),
    furn('wall_tv', 14200, 9650, { rotation: 0, elevation: 900, localState: 'off' }),
    furn('bookshelf', 12500, 9550, { rotation: 180 }),
    furn('bookshelf', 17800, 8300, { rotation: 270 }),
    furn('chair', 16800, 8300, { rotation: 180, label: 'Reading chair' }),
    furn('plant', 13000, 6900, { rotation: 0 }),
    furn('rug', 14200, 8300, { rotation: 0, w: 3600, h: 2400 }),
    // Main Stair Hall — landing (lower link, west lane) + flight (upper link, east lane)
    furn('stair_landing', 10325, 7000, { rotation: 0, stairLinkId: LINK_LOWER, label: 'Landing from Basement' }),
    furn('stairs', 11575, 7000, { rotation: 0, stairLinkId: LINK_UPPER, label: 'Stairs to Upper' }),
    // Side-yard / driveway dressing (outside every loop)
    furn('trash_bin', 8000, -600, { rotation: 0 }),
    furn('recycle_bin', 8700, -600, { rotation: 0 }),
  ];
  const mLights = [
    light(3600, 3300, { iconKind: 'strip', label: 'Garage', rotation: 0, length: 4000 }),
    light(2100, 8175, { iconKind: 'bulb', label: 'Mudroom' }),
    light(5200, 7600, { iconKind: 'sconce', label: 'Powder Room', radius: 500 }),
    light(8450, 2100, { iconKind: 'bulb', label: 'Home Office' }),
    light(10950, 2100, { iconKind: 'pendant', label: 'Foyer' }),
    light(13950, 2100, { iconKind: 'bulb', label: 'Living Room' }),
    light(17450, 2100, { iconKind: 'bowl', label: 'Dining uplight' }),
    light(8450, 5200, { iconKind: 'bulb', label: 'Pantry' }),
    light(10950, 7000, { iconKind: 'bulb', label: 'Stair Hall' }),
    light(14450, 5000, { iconKind: 'pendant', label: 'Kitchen island' }),
    light(14450, 6000, { iconKind: 'round', label: 'Kitchen' }),
    light(17950, 5400, { iconKind: 'pendant', label: 'Breakfast' }),
    light(15700, 8175, { iconKind: 'bulb', label: 'Great Room' }),
    light(14000, 9700, { iconKind: 'fireplace', label: 'Fireplace', rotation: 0 }),
  ];
  const main = floor({
    name: 'Main Level', w: FW, d: FD,
    walls: mWalls, rooms: mRooms, doors: mDoors, windows: mWindows,
    furniture: mFurn, lights: mLights, switches: [
      switchFix(10100, 200, { rotation: 0, label: 'Foyer' }),
      switchFix(15300, 9550, { rotation: 90, label: 'Patio' }),
    ],
    look3d: { floorTex: 'wood', floorColor: '#c9a06a', wallColor: '#f2ede4' },
  });

  // ===========================================================================
  // UPPER LEVEL (floors[2]) — primary suite + four bedrooms + laundry.
  // ===========================================================================
  const uWalls = [
    ext(),
    wall([{ x: 7200, y: 0 }, { x: 7200, y: 9750 }]),      // 1 west wing / core
    wall([{ x: 3400, y: 0 }, { x: 3400, y: 9750 }]),      // 2 bed 4/5 column / hall spine
    wall([{ x: 4400, y: 0 }, { x: 4400, y: 4600 }]),      // 3a spine / bath-laundry (gap y4600-5300)
    wall([{ x: 4400, y: 5300 }, { x: 4400, y: 9750 }]),   // 3b
    wall([{ x: 6400, y: 0 }, { x: 6400, y: 4600 }]),      // 4a bath column / storage sliver (gap)
    wall([{ x: 6400, y: 5300 }, { x: 6400, y: 9750 }]),   // 4b
    wall([{ x: 0, y: 4600 }, { x: 3400, y: 4600 }]),      // 5 bed 4 / bed 4 closet
    wall([{ x: 0, y: 6000 }, { x: 3400, y: 6000 }]),      // 6 bed 4 closet / bed 5
    wall([{ x: 4400, y: 2600 }, { x: 6400, y: 2600 }]),   // 7 hall bath / laundry
    wall([{ x: 4400, y: 5300 }, { x: 6400, y: 5300 }]),   // 8 laundry+link / closet&linen
    wall([{ x: 11700, y: 0 }, { x: 11700, y: 4200 }]),    // 9 primary bedroom / sitting
    wall([{ x: 14200, y: 0 }, { x: 14200, y: 4200 }]),    // 10 sitting / bedroom 2
    wall([{ x: 17200, y: 0 }, { x: 17200, y: 4200 }]),    // 11 bedroom 2 / bath2+closet2
    wall([{ x: 17200, y: 2400 }, { x: 19200, y: 2400 }]), // 12 bath 2 / closet 2
    wall([{ x: 9700, y: 4200 }, { x: 9700, y: 9750 }]),   // 13 connector+spa+closets / stair hall
    wall([{ x: 7200, y: 5300 }, { x: 9700, y: 5300 }]),   // 14 connector / spa bath
    wall([{ x: 7200, y: 6900 }, { x: 9700, y: 6900 }]),   // 15 spa bath / primary closets
    wall([{ x: 12200, y: 4200 }, { x: 12200, y: 9750 }]), // 16 stair hall / east wing
    wall([{ x: 12200, y: 5300 }, { x: 19200, y: 5300 }]), // 17 upper hallway / bed3 row
    wall([{ x: 16700, y: 4200 }, { x: 16700, y: 8500 }]), // 18 bedroom 3 / bath3+closet3
    wall([{ x: 16700, y: 7400 }, { x: 19200, y: 7400 }]), // 19 bath 3 / closet 3
    wall([{ x: 12200, y: 8500 }, { x: 19200, y: 8500 }]), // 20 bed3 row / loft
    wall([{ x: 7200, y: 4200 }, { x: 19200, y: 4200 }]),  // 21 front band / rear band (door openings below)
  ];
  const uRooms = [
    room('Bedroom 4', 1700, 2300),
    room('Bedroom 4 Closet', 1700, 5300),
    room('Bedroom 5', 1700, 7875),
    room('Upper Hall', 3900, 3000),
    room('Hall Bath', 5400, 1300),
    room('Laundry Room', 5400, 3600),
    room('Storage Sliver', 6800, 2300),
    room('Bedroom 5 Closet / Linen', 5400, 7525),
    room('Primary Bedroom', 9450, 2100),
    room('Primary Sitting Area', 12950, 2100),
    room('Bedroom 2', 15700, 2100),
    room('Bedroom 2 Bath', 18200, 1200),
    room('Bedroom 2 Closet', 18200, 3300),
    room('West Hall Connector', 8450, 4750),
    room('Primary Spa Bath', 8450, 6100),
    room('Primary Closets', 8450, 8325),
    room('Upper Stair Hall', 10950, 7000),
    room('Upper Hallway', 15700, 4750),
    room('Bedroom 3', 14450, 6900),
    room('Bedroom 3 Bath', 17950, 6350),
    room('Bedroom 3 Closet', 17950, 7950),
    room('Loft / Bonus Room', 15700, 9125),
  ];
  const uDoors = [
    door(3400, 2300, 90, { w: 800, label: 'Bedroom 4' }),
    door(2600, 4600, 0, { w: 800, label: 'Bedroom 4 Closet' }),
    door(3400, 7900, 90, { w: 800, label: 'Bedroom 5' }),
    door(4400, 1300, 90, { w: 800, label: 'Hall Bath' }),
    door(4400, 3800, 90, { w: 800, label: 'Laundry' }),
    door(4400, 7000, 90, { w: 800, label: 'Bed 5 Closet' }),
    door(7200, 4950, 90, { w: 900, label: 'Hall ↔ Connector' }),
    door(9700, 4950, 90, { w: 1200, label: 'Connector ↔ Stair Hall' }),  // wide archway
    door(11700, 3600, 270, { w: 800, label: 'Primary ↔ Sitting' }),
    door(8500, 4200, 0, { w: 800, label: 'Primary ↔ Spa Bath' }),
    door(8900, 6900, 0, { w: 800, label: 'Spa ↔ Closets' }),
    door(9700, 8200, 90, { w: 900, label: 'Closets ↔ Stair Hall' }),
    door(12200, 9500, 90, { w: 900, label: 'Loft' }),
    door(13000, 4200, 0, { w: 800, label: 'Sitting ↔ Hallway' }),
    door(15700, 4200, 0, { w: 800, label: 'Bedroom 2 ↔ Hallway' }),
    door(17200, 1200, 90, { w: 800, label: 'Bedroom 2 Bath' }),
    door(17200, 3800, 90, { w: 800, label: 'Bedroom 2 Closet' }),
    door(14450, 5300, 0, { w: 800, label: 'Bedroom 3 ↔ Hallway' }),
    door(16700, 6300, 90, { w: 800, label: 'Bedroom 3 Bath' }),
    door(16700, 7900, 90, { w: 700, label: 'Bedroom 3 Closet' }),
  ];
  const uWindows = [
    win(0, 2300, 90, { w: 900, sill: 900, height: 1200, kind: 'double_hung', label: 'Bedroom 4 side' }),
    win(0, 7875, 90, { w: 900, sill: 900, height: 1200, kind: 'double_hung', label: 'Bedroom 5 side' }),
    win(5400, 0, 0, { w: 600, sill: 1300, height: 900, kind: 'casement_pair', label: 'Hall Bath' }),
    win(9450, 0, 0, { w: 900, sill: 900, height: 1200, kind: 'double_hung', label: 'Primary front' }),
    win(12950, 0, 0, { w: 900, sill: 900, height: 1200, kind: 'double_hung', label: 'Sitting front' }),
    win(15700, 0, 0, { w: 900, sill: 900, height: 1200, kind: 'double_hung', label: 'Bedroom 2 front' }),
    win(19200, 1200, 90, { w: 600, sill: 1300, height: 900, kind: 'casement_pair', label: 'Bedroom 2 Bath' }),
    win(15700, FD, 0, { w: 900, sill: 900, height: 1200, kind: 'double_hung', label: 'Loft rear' }),
  ];
  const uFurn = [
    // Bedroom 4
    furn('bed', 1700, 3800, { rotation: 180, w: 1500, h: 2000 }),
    furn('nightstand', 600, 3800, { rotation: 180 }),
    furn('nightstand', 2800, 3800, { rotation: 180 }),
    furn('dresser', 600, 600, { rotation: 0 }),
    furn('rug', 1700, 2600, { rotation: 0, w: 1800, h: 1400, color: carpet }),
    // Bedroom 4 Closet
    furn('wardrobe', 1700, 5300, { rotation: 0 }),
    // Hall Bath
    furn('toilet', 5400, 700, { rotation: 0 }),
    furn('sink_vanity', 5400, 2300, { rotation: 180, label: 'Vanity' }),
    furn('shower', 5900, 1800, { rotation: 90, w: 900, h: 900 }),
    // Laundry Room
    furn('washer', 5350, 3900, { rotation: 0 }),
    furn('dryer', 6040, 3900, { rotation: 0 }),
    furn('cabinet', 5700, 2900, { rotation: 180 }),
    // Bedroom 5
    furn('bed', 1700, 8950, { rotation: 180, w: 1500, h: 2000 }),
    furn('nightstand', 600, 8950, { rotation: 180 }),
    furn('nightstand', 2800, 8950, { rotation: 180 }),
    furn('dresser', 600, 6300, { rotation: 0 }),
    furn('desk', 2400, 6400, { rotation: 0 }),
    furn('rug', 1700, 8000, { rotation: 0, w: 1800, h: 1400, color: carpet }),
    // Bedroom 5 Closet / Linen
    furn('wardrobe', 5400, 9200, { rotation: 0 }),
    // Primary Bedroom
    furn('bed', 9450, 3600, { rotation: 180, w: 2000, h: 2100 }),
    furn('nightstand', 8200, 3600, { rotation: 180 }),
    furn('nightstand', 10600, 3600, { rotation: 180 }),
    furn('dresser', 8000, 600, { rotation: 180 }),
    furn('bench', 9450, 2200, { rotation: 0 }),
    furn('rug', 9450, 2600, { rotation: 0, w: 3000, h: 2200, color: '#d7dee2' }),
    // Primary Sitting Area
    furn('chair', 12600, 3800, { rotation: 180, label: 'Accent chair' }),
    furn('chair', 12950, 600, { rotation: 0, label: 'Accent chair' }),
    furn('coffee_table', 12950, 2200, { rotation: 0 }),
    furn('bookshelf', 11900, 2100, { rotation: 90 }),
    // Bedroom 2
    furn('bed', 15700, 3600, { rotation: 180, w: 1500, h: 2000 }),
    furn('nightstand', 14700, 3600, { rotation: 180 }),
    furn('nightstand', 16700, 2600, { rotation: 180 }),
    furn('desk', 15700, 600, { rotation: 180 }),
    furn('rug', 15700, 2600, { rotation: 0, w: 1800, h: 1400, color: carpet }),
    // Bedroom 2 Bath
    furn('toilet', 18200, 400, { rotation: 0 }),
    furn('sink_vanity', 17650, 2100, { rotation: 180, label: 'Vanity' }),
    furn('shower', 18500, 1500, { rotation: 90, w: 900, h: 900 }),
    // Bedroom 2 Closet
    furn('wardrobe', 18400, 3300, { rotation: 0 }),
    // Primary Spa Bath
    furn('bathtub', 8100, 6450, { rotation: 0, w: 1500, h: 700 }),
    furn('sink_vanity', 8250, 5650, { rotation: 180, w: 1200, label: 'Double vanity' }),
    furn('toilet', 9350, 5700, { rotation: 90 }),
    // Primary Closets
    furn('wardrobe', 8000, 9200, { rotation: 0, label: 'Hers' }),
    furn('wardrobe', 8300, 8000, { rotation: 180, label: 'His' }),
    furn('cabinet', 8450, 8650, { rotation: 0, label: 'Island' }),
    // Bedroom 3
    furn('bed', 14450, 6300, { rotation: 0, w: 1500, h: 2000 }),
    furn('nightstand', 13300, 6300, { rotation: 0 }),
    furn('nightstand', 15600, 6300, { rotation: 0 }),
    furn('dresser', 12700, 8300, { rotation: 180 }),
    furn('desk', 15400, 8100, { rotation: 180 }),
    furn('rug', 14450, 7000, { rotation: 0, w: 1800, h: 1400, color: carpet }),
    // Bedroom 3 Bath
    furn('toilet', 17700, 5800, { rotation: 0 }),
    furn('sink_vanity', 17700, 7100, { rotation: 0, label: 'Vanity' }),
    furn('shower', 18700, 6300, { rotation: 90, w: 900, h: 900 }),
    // Bedroom 3 Closet
    furn('wardrobe', 17950, 7900, { rotation: 0 }),
    // Loft / Bonus Room
    furn('sofa', 17000, 9400, { rotation: 180 }),
    furn('coffee_table', 17000, 8900, { rotation: 0 }),
    furn('bookshelf', 18500, 9400, { rotation: 180 }),
    furn('chair', 15500, 9200, { rotation: 90, label: 'Reading chair' }),
    furn('rug', 16500, 8900, { rotation: 0, w: 2000, h: 1400 }),
    // Upper Stair Hall — landing (upper link, east lane)
    furn('stair_landing', 11575, 7000, { rotation: 0, stairLinkId: LINK_UPPER, label: 'Landing from Main' }),
  ];
  const uLights = [
    light(1700, 2300, { iconKind: 'bulb', label: 'Bedroom 4' }),
    light(1700, 7875, { iconKind: 'bulb', label: 'Bedroom 5' }),
    light(3900, 4875, { iconKind: 'sconce', label: 'Upper Hall', radius: 500 }),
    light(5400, 1300, { iconKind: 'sconce', label: 'Hall Bath', radius: 500 }),
    light(5400, 3600, { iconKind: 'bulb', label: 'Laundry' }),
    light(9450, 2100, { iconKind: 'bulb', label: 'Primary Bedroom' }),
    light(8300, 3600, { iconKind: 'lamp', label: 'Primary lamp', height: 1400 }),
    light(12950, 2100, { iconKind: 'bulb', label: 'Sitting' }),
    light(15700, 2100, { iconKind: 'bulb', label: 'Bedroom 2' }),
    light(8450, 6100, { iconKind: 'sconce', label: 'Spa Bath', radius: 500 }),
    light(8900, 6300, { iconKind: 'heatlamp', label: 'Spa Bath heat lamp' }),
    light(10950, 7000, { iconKind: 'bulb', label: 'Stair Hall' }),
    light(15700, 4750, { iconKind: 'sconce', label: 'Upper Hallway', radius: 500 }),
    light(14450, 6900, { iconKind: 'bulb', label: 'Bedroom 3' }),
    light(17950, 6350, { iconKind: 'sconce', label: 'Bedroom 3 Bath', radius: 500 }),
    light(15700, 9125, { iconKind: 'pendant', label: 'Loft' }),
  ];
  const upper = floor({
    name: 'Upper Level', w: FW, d: FD,
    walls: uWalls, rooms: uRooms, doors: uDoors, windows: uWindows,
    furniture: uFurn, lights: uLights, switches: [],
    look3d: { floorTex: 'none', floorColor: '#d9c9a8', wallColor: '#eef1ee' },
  });

  const roamers = [
    roamer('Aldous', ['adult', 'professional'], { color: '#4fc3f7' }),
    roamer('Rowan', ['teen', 'athlete'], { color: '#ba68c8' }),
    roamer('Perry', ['dog'], { color: '#a1887f' }),  // house dog (quadruped rig)
  ];

  return assembleStore({
    name,
    floors: [basement, main, upper],  // lowest story first
    scene3d: {
      preset: 'day', lightMode: 'clock',
      floorTex: 'wood', floorColor: '#c9a06a', wallColor: '#f2ede4',
      wallCutaway: true, glassHouse: false, plumbobs: true,
    },
    roamers,
    notes: [
      '~4,590 sq ft (427 m²) · 3 levels + garage · 46 rooms',
      '',
      'A transitional-craftsman luxury spec home stacked three levels high over an',
      'identical 19,200 × 9,750 mm footprint so the exterior walls and central stair',
      'core line up between floors. A walkout finished basement built for entertaining,',
      'a main level of formal front rooms flowing into an open kitchen/great-room, and',
      'a hotel-quiet upper level of bedrooms. Two stair connections use matching',
      'stairLinkIds so avatars transit floor to floor: the basement flight lands in the',
      'main-level stair hall, and the main flight lands in the upper landing. Oak main',
      'level, carpet-toned bedrooms upstairs, polished concrete downstairs; clock',
      'lighting shifts the scene day→dusk→night.',
      '',
      'BASEMENT (floors[0] — the fun floor)',
      'Home Theater: wall-mounted screen, U-sectional + ottoman, back-row chairs, AV shelf.',
      'Wet Bar: bar counter with sink, three stools, back-bar cabinet, beverage fridge.',
      'Guest Bedroom / Bath / Closet: queen bed, nightstands, dresser, rug; en-suite + egress.',
      'Gym / Fitness: treadmill, bike, weight bench, floor mat.',
      'Rec / Game Room: pool table, sofa, coffee table, wall TV, game-storage cabinet, rug.',
      'Mechanical / Storage + Rear Storage: furnace/water-heater stand-ins, shelving cabinets.',
      'Basement Stair Hall: the physical flight up to the main level.',
      '',
      'MAIN LEVEL (floors[1])',
      'Garage (3-car): storage cabinets + a workbench; three bay doors.',
      'Mudroom / Powder Room / Coat Closet: bench, coat wardrobe, powder vanity + toilet.',
      'Home Office: desk, chair, bookshelf, rug; front-lit.',
      'Foyer: console table, bench, runner rug; front door + foyer switch.',
      'Living Room + Dining Room: formal front rooms (sofa/chairs/bookshelf; dining table',
      '  for six + buffet), open archways off the foyer, picture windows to the street.',
      'Pantry: walk-in shelving off the service path.',
      'Kitchen: island, stove, over-range microwave, fridge, sink + dishwasher facing the',
      '  great room, pantry cabinet, counter coffee maker + toaster; island pendant.',
      'Breakfast Room: round table with four chairs; pendant + casement window.',
      'Great Room: L-sectional, coffee table, ottoman, wall TV flanked by bookshelves, a',
      '  reading chair, plant, big rug, a fireplace light, and patio doors to the yard.',
      'Main Stair Hall: the basement landing (west lane) + the flight up to the upper level.',
      '',
      'UPPER LEVEL (floors[2])',
      'Primary Bedroom + Sitting Area: king bed, nightstands, dresser, end-of-bed bench,',
      '  big rug; a sitting anteroom with accent chairs, coffee table, bookshelf.',
      'Primary Spa Bath + His/Hers Closets: freestanding tub/shower, double vanity, water',
      '  closet; dual wardrobes + a center island cabinet.',
      'Bedroom 2 (en-suite) + Bedroom 3 (en-suite): beds, nightstands, desks, rugs, private',
      '  baths + closets.',
      'Bedroom 4 + Bedroom 5: secondary bedrooms over the garage; beds, nightstands,',
      '  dressers, a study desk, closets.',
      'Hall Bath + Laundry Room: shared bath (toilet/vanity/shower) + washer/dryer/cabinet.',
      'Loft / Bonus Room: sofa, coffee table, bookshelf, reading chair, rug.',
      'Upper Stair Hall: the landing arriving from the main level.',
      '',
      'Fixture detail: the dining room hangs a bowl uplight instead of a pendant, and the',
      '  primary spa bath adds a ceiling heat lamp over the tub.',
    ].join('\n'),
  });
}
