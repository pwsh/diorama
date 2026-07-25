// Appliance Showroom — "Watt's Cooking". A FEATURE SHOWCASE, not a house: one
// 14 × 10 m open retail hall plus a staff restroom and a sales office, laid out
// as labelled display rows so every appliance family Diorama models is on the
// floor at once — refrigeration, cooking + dishwashing, laundry, plumbing
// fixtures, counter-top small appliances, the whole climate/airflow family, a
// media wall of TVs, and an EV charging bay with a display car.
//
// LAYOUT DISCIPLINE (why the coordinates look so regular): every display row
// runs east–west with its pieces' backs on a common Y line, and the rows are
// spaced so the inflated nav footprints (PERSON_R = 170 mm on every side) leave
// a continuous walkable band between them. Two north–south aisles — one at
// x ≈ 3300, one at x ≈ 13500 — connect every band, so the whole hall is a single
// nav region and avatars can reach any display. Nothing is parked in a doorway's
// 600 mm keep-clear zone.
//
// Many pieces carry localState 'on' / 'playing' so the showroom reads ALIVE with
// no Home Assistant attached: in-use LEDs glow, fan blades spin, the mini-split
// louver opens, one kitchen sink runs, and the media wall plays.
import { floorplan } from '../lib.mjs';

export const id = 'appliance-showroom';
export const name = 'Appliance Showroom — Watt’s Cooking';

export function build() {
  const b = floorplan(id);
  const { floorRect, wall, room, door, win, furn, light, switchFix, roamer, floor, assembleStore, id: nid } = b;

  const W = 14000, D = 10000;

  // ── Shell ────────────────────────────────────────────────────────────────
  // Exterior rect + a staff block (restroom over office) filling the west wall
  // from y 4600 up. Three closed loops: the L-shaped hall, restroom, office.
  const walls = [
    wall(floorRect(W, D)),
    wall([{ x: 0, y: 4600 }, { x: 3000, y: 4600 }]),      // staff block south wall
    wall([{ x: 3000, y: 4600 }, { x: 3000, y: 10000 }]),  // staff block east wall
    wall([{ x: 0, y: 6800 }, { x: 3000, y: 6800 }]),      // restroom / office divider
  ];

  const rooms = [
    room('Showroom Floor', 8000, 3000),
    room('Staff Restroom', 1500, 5700),
    room('Sales Office', 1500, 8400),
  ];

  const doors = [
    door(6000, 0, 0, { w: 1600, label: 'Main entrance', doorbellEntity: null }),
    door(0, 4200, 90, { w: 2400, kind: 'garage', label: 'Delivery bay' }),   // west wall, spans y 1800..4200
    door(3000, 6300, 90, { w: 800, label: 'Restroom' }),                     // spans y 5500..6300
    door(3000, 8200, 90, { w: 900, label: 'Sales office' }),                 // spans y 7300..8200
  ];

  // Storefront glazing: a picture-window run either side of the entrance plus
  // daylight from the east and north walls over the plumbing display.
  const windows = [
    win(2400, 0, 0, { w: 2000, kind: 'picture', sill: 900, height: 1700, label: 'Storefront W' }),
    win(4700, 0, 0, { w: 1400, kind: 'picture', sill: 900, height: 1700, label: 'Storefront C' }),
    win(9000, 0, 0, { w: 2000, kind: 'picture', sill: 900, height: 1700, label: 'Storefront E' }),
    win(11800, 0, 0, { w: 1800, kind: 'picture', sill: 900, height: 1700, label: 'Storefront NE' }),
    win(14000, 6500, 90, { w: 1800, kind: 'sliding', sill: 1000, height: 1400, label: 'East clerestory' }),
    win(14000, 8500, 90, { w: 1800, kind: 'sliding', sill: 1000, height: 1400, label: 'East clerestory' }),
    win(6000, 10000, 0, { w: 2400, kind: 'sliding', sill: 1600, height: 900, label: 'Plumbing wall daylight' }),
  ];

  // ── Counters that host mounted small appliances ──────────────────────────
  // Built first so the mounted pieces can reference their real mountOnId.
  const smallCounterA = furn('counter', 8300, 3400, { rotation: 0, w: 1800, h: 650, label: 'Small appliances' });
  const smallCounterB = furn('counter', 10400, 3400, { rotation: 0, w: 1600, h: 650, label: 'Coffee bar' });
  const wrapCounter = furn('counter', 12400, 1300, { rotation: 0, w: 1600, h: 650, label: 'Order desk' });

  const oscillatingFan = furn('floor_fan', 4300, 4700, { rotation: 0, label: 'Oscillating pedestal fan', localState: 'on' });
  oscillatingFan.oscillate = true;
  const oscillatingFan2 = furn('modern_fan', 5300, 4700, { rotation: 0, label: 'Modern stand fan', localState: 'on' });
  oscillatingFan2.oscillate = true;

  const furniture = [
    // ── EV bay (west end of the south hall) ───────────────────────────────
    furn('car', 3300, 1300, { rotation: 90, label: 'Display EV' }),
    furn('ev_charger', 600, 1300, { rotation: 90, label: 'Home charger' }),

    // ── Row A1 · checkout + order desk (y ≈ 1300) ─────────────────────────
    furn('island', 9600, 1400, { rotation: 0, w: 2600, h: 1100, label: 'Checkout island', color: '#37474f' }),
    wrapCounter,
    furn('toaster', 12100, 1300, { rotation: 0, elevation: 900, mountOnId: wrapCounter.id, localState: 'on' }),
    furn('coffee_maker', 12700, 1300, { rotation: 0, elevation: 900, mountOnId: wrapCounter.id, localState: 'on' }),

    // ── Row A2 · cooking + dishwashing (y = 3400) ─────────────────────────
    furn('stove', 4400, 3400, { rotation: 0, label: 'Slide-in range', localState: 'on' }),
    furn('stove', 5300, 3400, { rotation: 0, label: 'Induction range' }),
    furn('dishwasher', 6200, 3400, { rotation: 0, label: 'Dishwasher — quiet', localState: 'on' }),
    furn('dishwasher', 7000, 3400, { rotation: 0, label: 'Dishwasher — panel-ready' }),
    smallCounterA,
    furn('microwave', 7800, 3400, { rotation: 0, elevation: 900, mountOnId: smallCounterA.id, label: 'Countertop microwave' }),
    furn('toaster', 8400, 3400, { rotation: 0, elevation: 900, mountOnId: smallCounterA.id }),
    furn('coffee_maker', 8900, 3400, { rotation: 0, elevation: 900, mountOnId: smallCounterA.id, label: 'Drip brewer', localState: 'on' }),
    smallCounterB,
    furn('coffee_maker', 10000, 3400, { rotation: 0, elevation: 900, mountOnId: smallCounterB.id, label: 'Espresso machine' }),
    furn('retro_fan', 10800, 3400, { rotation: 0, elevation: 900, mountOnId: smallCounterB.id, label: 'Retro desk fan', localState: 'on' }),

    // ── Row A3 · climate & comfort (y = 4700) ─────────────────────────────
    oscillatingFan,
    oscillatingFan2,
    furn('tower_fan', 6200, 4700, { rotation: 0, label: 'Tower fan', localState: 'on' }),
    furn('bladeless_fan', 7000, 4700, { rotation: 0, label: 'Bladeless fan', localState: 'on' }),
    furn('portable_ac', 7900, 4700, { rotation: 0, label: 'Portable AC', localState: 'on' }),
    furn('space_heater', 8800, 4700, { rotation: 0, label: 'Ceramic space heater', localState: 'on' }),
    furn('floor_fan', 9600, 4700, { rotation: 0, label: 'Shop floor fan' }),
    furn('tower_fan', 10400, 4700, { rotation: 0, label: 'Bladeless tower' }),
    furn('portable_ac', 11300, 4700, { rotation: 0, label: 'Portable heat-pump' }),
    furn('space_heater', 12200, 4700, { rotation: 0, label: 'Radiant heater' }),

    // ── Row B1 · laundry (y = 6100) ───────────────────────────────────────
    furn('washer', 4400, 6100, { rotation: 0, label: 'Front-load washer', localState: 'on' }),
    furn('dryer', 5200, 6100, { rotation: 0, label: 'Heat-pump dryer', localState: 'on' }),
    furn('washer', 6000, 6100, { rotation: 0, label: 'Top-load washer' }),
    furn('dryer', 6800, 6100, { rotation: 0, label: 'Vented dryer' }),
    furn('washer', 7600, 6100, { rotation: 0, label: 'Compact washer' }),
    // Stacked demo: dryer sits on top of its washer at the same footprint.
    furn('washer', 8600, 6100, { rotation: 0, label: 'Stacked pair — washer', localState: 'on' }),
    furn('dryer', 8600, 6100, { rotation: 0, elevation: 990, label: 'Stacked pair — dryer', localState: 'on' }),

    // ── Row B2 · refrigeration (y = 7700) ─────────────────────────────────
    furn('fridge', 4400, 7700, { rotation: 0, label: 'French door', localState: 'on' }),
    furn('fridge', 5500, 7700, { rotation: 0, label: 'Side-by-side', localState: 'on' }),
    furn('fridge', 6600, 7700, { rotation: 0, label: 'Top freezer' }),
    furn('fridge', 7700, 7700, { rotation: 0, label: 'Counter-depth', localState: 'on' }),
    furn('fridge', 8800, 7700, { rotation: 0, label: 'Beverage centre' }),

    // ── Row B3 · plumbing wall (y = 9300, backs to the north wall) ────────
    furn('kitchen_sink', 4400, 9300, { rotation: 0, label: 'Double-bowl kitchen sink', localState: 'on' }),
    furn('sink_vanity', 5500, 9300, { rotation: 0, label: 'Vanity sink' }),
    furn('pedestal_sink', 6400, 9300, { rotation: 0, label: 'Pedestal sink' }),
    furn('sink', 7200, 9300, { rotation: 0, label: 'Compact vanity' }),
    furn('utility_sink', 8100, 9300, { rotation: 0, label: 'Utility tub' }),

    // ── Wall-hung climate display (north wall, east end — all elevated) ───
    furn('mini_split', 11000, 9880, { rotation: 180, elevation: 2100, label: 'Mini-split head', localState: 'on' }),
    furn('window_ac', 12200, 9880, { rotation: 180, elevation: 900, label: 'Window AC', localState: 'on' }),
    furn('wall_heater', 13200, 9880, { rotation: 180, elevation: 400, label: 'Wall heater', localState: 'on' }),

    // ── Media wall (east wall, south hall — mounted, so nav-exempt) ───────
    furn('wall_tv', 13850, 900, { rotation: 90, elevation: 1000, label: 'Media wall 1', localState: 'playing' }),
    furn('wall_tv', 13850, 2300, { rotation: 90, elevation: 1000, label: 'Media wall 2', localState: 'playing' }),
    furn('wall_tv', 13850, 3700, { rotation: 90, elevation: 1000, label: 'Media wall 3', localState: 'playing' }),

    // ── Waiting corner (north-east of the hall) ───────────────────────────
    furn('bench', 11500, 6500, { rotation: 0, label: 'Waiting bench' }),
    furn('plant', 12600, 6500, { rotation: 0 }),
    furn('rug', 11800, 6900, { rotation: 0, w: 2600, h: 2000 }),
    furn('plant', 9900, 5900, { rotation: 0 }),

    // ── Staff restroom ────────────────────────────────────────────────────
    furn('toilet', 600, 6300, { rotation: 0 }),
    furn('pedestal_sink', 1700, 6350, { rotation: 0 }),
    furn('towel_warmer', 2900, 5400, { rotation: 90, elevation: 900, label: 'Towel warmer', localState: 'on' }),

    // ── Sales office ──────────────────────────────────────────────────────
    furn('desk', 900, 9200, { rotation: 0, w: 1200, h: 700, label: 'Sales desk 1' }),
    furn('chair', 900, 8500, { rotation: 180 }),
    furn('desk', 2300, 9200, { rotation: 0, w: 1200, h: 700, label: 'Sales desk 2' }),
    furn('chair', 2300, 8500, { rotation: 180 }),
    furn('bookshelf', 300, 8400, { rotation: 90, label: 'Spec binders' }),
    furn('plant', 700, 7300, { rotation: 0 }),
  ];

  // ── Lighting: continuous LED strips over the rows + spots on the displays ─
  const lights = [
    light(8000, 1300, { iconKind: 'strip', rotation: 0, length: 5200, label: 'Checkout strip', localState: 'on' }),
    light(8000, 3400, { iconKind: 'strip', rotation: 0, length: 7000, label: 'Cooking row strip', localState: 'on' }),
    light(8200, 4700, { iconKind: 'strip', rotation: 0, length: 8000, label: 'Climate row strip', localState: 'on' }),
    light(6600, 6100, { iconKind: 'strip', rotation: 0, length: 4800, label: 'Laundry row strip', localState: 'on' }),
    light(6600, 7700, { iconKind: 'strip', rotation: 0, length: 5000, label: 'Refrigeration strip', localState: 'on' }),
    light(6300, 9300, { iconKind: 'strip', rotation: 0, length: 4400, label: 'Plumbing wall strip', localState: 'on' }),
    light(4400, 7700, { iconKind: 'spot', label: 'Hero fridge spot', radius: 900, localState: 'on' }),
    light(4400, 6100, { iconKind: 'spot', label: 'Hero washer spot', radius: 900, localState: 'on' }),
    light(4400, 3400, { iconKind: 'spot', label: 'Hero range spot', radius: 900, localState: 'on' }),
    light(4400, 9300, { iconKind: 'spot', label: 'Hero sink spot', radius: 900, localState: 'on' }),
    light(9600, 1400, { iconKind: 'pendant', label: 'Checkout pendant', localState: 'on' }),
    light(12400, 1300, { iconKind: 'pendant', label: 'Order desk pendant', localState: 'on' }),
    light(3300, 1300, { iconKind: 'flood', rotation: 90, label: 'EV bay flood', localState: 'on' }),
    light(11800, 6900, { iconKind: 'lamp', height: 1500, label: 'Waiting lamp', localState: 'on' }),
    light(13000, 8000, { iconKind: 'under_cabinet', rotation: 90, length: 2600, label: 'East wall wash' }),
    light(1500, 8600, { iconKind: 'round', label: 'Office', localState: 'on' }),
    light(1500, 5900, { iconKind: 'recessed', radius: 600, label: 'Restroom', localState: 'on' }),
    light(2400, 5900, { iconKind: 'exhaust', label: 'Restroom exhaust', localState: 'on' }),
  ];

  const switches = [
    switchFix(5800, 200, { rotation: 0, label: 'Entrance bank' }),
    switchFix(3200, 5900, { rotation: 270, label: 'Restroom' }),
    switchFix(3200, 8000, { rotation: 270, label: 'Office' }),
    switchFix(13800, 5200, { rotation: 90, label: 'Display rows' }),
  ];

  // Demo AI-avatar presence sensors: always-on shoppers/staff confined to the
  // wall loop they sit in (hall / office). Unbound — no HA needed.
  const motionSensors = [
    {
      id: nid('mo'), x: 7500, y: 5200, heading: 0, fov: 360, range: 6000,
      label: 'Showroom floor presence', entity_id: null, color: '#4fc3f7',
      avatar: true, demo: true, avatarKinds: ['adult', 'professional', 'elder'],
    },
    {
      id: nid('mo'), x: 10200, y: 2400, heading: 0, fov: 360, range: 5000,
      label: 'Checkout presence', entity_id: null, color: '#ffb74d',
      avatar: true, demo: true, avatarKinds: ['professional', 'teen'],
    },
    {
      id: nid('mo'), x: 1600, y: 7500, heading: 0, fov: 360, range: 3500,
      label: 'Sales office presence', entity_id: null, color: '#81c784',
      avatar: true, demo: true, avatarKinds: ['professional', 'adult'],
    },
  ];

  const envSensors = [
    { id: nid('env'), x: 9900, y: 5300, entity_id: null, kind: 'temperature', label: 'Hall temp', height: 1500 },
    { id: nid('env'), x: 2300, y: 5200, entity_id: null, kind: 'humidity', label: 'Restroom RH', height: 1500 },
    { id: nid('env'), x: 12900, y: 4400, entity_id: null, kind: 'co2', label: 'Hall CO₂', height: 1500 },
  ];

  const safetySensors = [
    { id: nid('sf'), x: 6800, y: 5400, kind: 'smoke', entity_id: null, label: 'Hall smoke' },
    { id: nid('sf'), x: 1500, y: 8000, kind: 'smoke', entity_id: null, label: 'Office smoke' },
  ];

  const look = { floorTex: 'concrete', floorColor: '#b9bcc2', wallColor: '#eef1f4' };

  const f = floor({
    name: 'Showroom', w: W, d: D,
    walls, rooms, doors, windows, furniture, lights, switches,
    motionSensors, envSensors, safetySensors,
    look3d: look,
  });

  const roamers = [
    roamer('Ada', ['professional', 'adult'], { color: '#4dd0e1' }),
    roamer('Marco', ['adult', 'elder'], { color: '#f06292' }),
    roamer('Junie', ['teen', 'child'], { color: '#ffd54f' }),
  ];

  return assembleStore({
    name,
    floors: [f],
    scene3d: {
      preset: 'day', ...look,
      wallCutaway: true, plumbobs: true,
    },
    roamers,
    notes: [
      '~1,507 sq ft (140 m²) retail hall · 1 floor · 3 rooms — appliance feature showcase',
      '',
      'A 14 × 10 m big-box appliance showroom built to demonstrate EVERY appliance and',
      'climate model Diorama ships, all on one open floor at once. It is not a house —',
      'it is a catalogue you can walk through. Display rows run east–west with wide',
      'aisles between them and two north–south cross aisles, so avatars can path to any',
      'piece; a staff restroom and a two-desk sales office fill the west wall.',
      '',
      'Most units are switched ON via localState with no Home Assistant attached, so the',
      'hall reads alive out of the box: appliance in-use LEDs pulse, fan blades spin (two',
      'fans oscillate), the mini-split louver swings open and vents cool air, the space',
      'heaters glow, the towel warmer heats, one kitchen sink is left running, and the',
      'media wall plays.',
      '',
      'Display rows, south to north:',
      'EV bay (west end): a display car nose-to-nose with a home EV charger, served by',
      '  the delivery-bay garage door in the west wall.',
      'Checkout row: charcoal checkout island, order desk with a toaster and drip brewer',
      '  on the counter, and a three-screen wall-mounted TV media wall on the east wall.',
      'Cooking & Dishwashing: two ranges, two dishwashers, and two counters carrying a',
      '  countertop microwave, toaster, drip brewer, espresso machine, and a retro fan.',
      'Climate & Comfort: pedestal fan and modern stand fan (both oscillating), tower and',
      '  bladeless fans, two portable ACs, two space heaters, and a shop floor fan.',
      'Laundry: front-load, top-load and compact washers, heat-pump and vented dryers,',
      '  plus a stacked washer/dryer pair on a single footprint.',
      'Refrigeration: French door, side-by-side, top freezer, counter-depth and beverage.',
      'Plumbing wall (north wall): double-bowl kitchen sink, vanity sink, pedestal sink,',
      '  compact vanity and a utility tub, daylit by a clerestory above.',
      'Wall-hung climate (north wall, east end): mini-split head, window AC and a wall',
      '  heater, all mounted clear of the floor.',
      '',
      'Support spaces: a waiting corner with a bench, rug and plants; a staff restroom',
      '  (toilet, pedestal sink, towel warmer, exhaust fan); a sales office with two',
      '  desks and chairs, a spec-binder bookshelf and a plant.',
      '',
      'Sensor kit: three unbound demo AI-avatar presence sensors (showroom floor,',
      '  checkout, sales office), temperature / humidity / CO₂ env sensors, and two',
      '  smoke detectors. Lighting is all LED strips over the rows plus hero spots on',
      '  the end-cap display of each family.',
    ].join('\n'),
  });
}
