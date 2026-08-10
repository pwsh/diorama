// Appliance Showroom — "Watt's Cooking". A FEATURE SHOWCASE, not a house: a
// 20 × 14 m open retail hall wrapped around four departments — a bath & vanity
// studio, a sales office, a working mechanical room, and a walk-in lighting
// gallery — so every appliance, climate, plumbing, mechanical and lighting model
// Diorama ships is on the floor at once WITHOUT five of each.
//
// LAYOUT DISCIPLINE (why the coordinates look so regular): each display row runs
// east–west with its pieces on a common Y line, and consecutive rows are spaced
// so the inflated nav footprints (PERSON_R = 170 mm on every side) leave a
// continuous walkable band between them. The hall is one C-shaped nav region
// wrapping the west service block and the north-east gallery, so an avatar can
// path from the storefront to any display. Nothing is parked in a door's 600 mm
// keep-clear zone.
//
// ONE OF EACH, NOT FIVE: the earlier build stacked five fridges, four washers
// and three coffee makers into a 14 × 10 m box. This one keeps a single hero
// unit per model (two fridges, one range, one dishwasher, one washer/dryer pair
// plus the stacked column) and spends the reclaimed floor on open aisle, so the
// lighting gallery has room to show twenty-odd fixture kinds without clutter.
//
// Many pieces carry localState 'on' / 'playing' so the showroom reads ALIVE with
// no Home Assistant attached: in-use LEDs glow, fan blades spin, the mini-split
// louver opens, the kitchen sink runs and the media wall plays. LIGHTING is the
// deliberate exception — only the 12 architectural fixtures load on, with no two
// floor pools overlapping, and the gallery's display fixtures load OFF (see the
// load-state note over `lights`).
import { floorplan } from '../lib.mjs';

export const id = 'appliance-showroom';
export const name = 'Appliance Showroom — Watt’s Cooking';

export function build() {
  const b = floorplan(id);
  const { floorRect, wall, room, door, win, furn, light, switchFix, roamer, floor, assembleStore, id: nid } = b;

  const W = 20000, D = 14000;

  // ── Shell ────────────────────────────────────────────────────────────────
  // Exterior rect + a west service block (bath studio / sales office /
  // mechanical room, stacked south to north) + a north-east lighting gallery.
  // Five closed loops: the C-shaped hall plus those four rooms.
  const walls = [
    wall(floorRect(W, D)),
    wall([{ x: 0, y: 5200 }, { x: 4000, y: 5200 }]),        // service block south wall
    wall([{ x: 4000, y: 5200 }, { x: 4000, y: 14000 }]),    // service block east wall
    wall([{ x: 0, y: 8200 }, { x: 4000, y: 8200 }]),        // bath studio / office divider
    wall([{ x: 0, y: 11200 }, { x: 4000, y: 11200 }]),      // office / mechanical divider
    wall([{ x: 12800, y: 9200 }, { x: 20000, y: 9200 }]),   // lighting gallery south wall
    wall([{ x: 12800, y: 9200 }, { x: 12800, y: 14000 }]),  // lighting gallery west wall
  ];

  const rooms = [
    room('Showroom Floor', 10000, 2600),
    room('Bath & Vanity Studio', 2000, 6700),
    room('Sales Office', 2000, 9700),
    room('Mechanical Room', 2000, 12600),
    room('Lighting Gallery', 16400, 11600),
  ];

  // Every door kind Diorama models gets a job it would really do in a store:
  // a double-leaf main entrance, a sliding-glass patio door that IS the patio
  // door display, a garage delivery bay, a pocket door on the bath studio, a
  // glazed french pair on the sales office and a barn slider on the plant room.
  const doors = [
    door(9100, 0, 0, { w: 1800, kind: 'double', label: 'Main entrance', doorbellEntity: null }),
    door(5800, 0, 0, { w: 2400, kind: 'sliding_glass', label: 'Patio door display' }),
    door(0, 4800, 90, { w: 2400, kind: 'garage', label: 'Delivery bay' }),      // west wall, spans y 2400..4800
    door(4000, 7100, 90, { w: 900, kind: 'pocket', label: 'Bath studio' }),     // spans y 6200..7100
    door(4000, 10500, 90, { w: 1600, kind: 'french', label: 'Sales office' }),  // spans y 8900..10500
    door(4000, 13000, 90, { w: 1200, kind: 'sliding', label: 'Mechanical room' }), // spans y 11800..13000
    door(14200, 9200, 0, { w: 2600, label: 'Lighting gallery archway' }),       // spans x 14200..16800
  ];

  // Full-height picture glazing across the storefront, sliding clerestories on
  // the east and north walls, and daylight into the two west-block rooms.
  const windows = [
    win(1800, 0, 0, { w: 2600, kind: 'picture', sill: 400, height: 2200, label: 'Storefront W' }),
    win(4500, 0, 0, { w: 2000, kind: 'picture', sill: 400, height: 2200, label: 'Storefront WC' }),
    win(12100, 0, 0, { w: 2000, kind: 'picture', sill: 400, height: 2200, label: 'Storefront EC' }),
    win(15100, 0, 0, { w: 2600, kind: 'picture', sill: 400, height: 2200, label: 'Storefront E' }),
    win(18200, 0, 0, { w: 2400, kind: 'picture', sill: 400, height: 2200, label: 'Storefront NE' }),
    win(20000, 3200, 90, { w: 2400, kind: 'sliding', sill: 1600, height: 1000, label: 'East clerestory S' }),
    win(20000, 6600, 90, { w: 2400, kind: 'sliding', sill: 1600, height: 1000, label: 'East clerestory N' }),
    win(8000, 14000, 0, { w: 2600, kind: 'sliding', sill: 1800, height: 900, label: 'Plumbing wall daylight' }),
    win(17000, 14000, 0, { w: 3000, kind: 'sliding', sill: 1800, height: 900, label: 'Gallery clerestory' }),
    win(0, 6700, 90, { w: 1000, sill: 1400, height: 800, label: 'Bath studio' }),
    win(0, 10400, 90, { w: 1000, label: 'Sales office' }),
  ];

  // ── Counters that host mounted small appliances ──────────────────────────
  // Built first so the mounted pieces can reference their real mountOnId.
  const applianceBar = furn('counter', 9200, 5900, { rotation: 0, w: 2000, h: 650, label: 'Small-appliance bar' });
  const orderDesk = furn('counter', 17000, 1800, { rotation: 0, w: 1800, h: 650, label: 'Order desk' });
  const officeCredenza = furn('counter', 2500, 10800, { rotation: 0, label: 'Office credenza' });
  const mediaStand = furn('tv_stand', 18900, 7200, { rotation: 90, label: 'Media stand' });

  const pedestalFan = furn('modern_fan', 9300, 8400, { rotation: 0, label: 'Oscillating stand fan', localState: 'on' });
  pedestalFan.oscillate = true;

  const furniture = [
    // ── EV bay (west end of the storefront band, served by the delivery bay) ─
    furn('car', 3300, 2400, { rotation: 90, label: 'Display EV' }),
    // rot 270 = cable/face east into the EV bay; at 90 the charger presented its
    // face to the west wall 75 mm away.
    furn('ev_charger', 250, 1100, { rotation: 270, label: 'Home charger' }),

    // ── Front of house · checkout + order desk + media wall (y ≈ 1800) ──────
    furn('island', 13200, 2000, { rotation: 0, w: 2600, h: 1100, label: 'Checkout island', color: '#37474f' }),
    orderDesk,
    furn('toaster', 16500, 1800, { rotation: 0, elevation: 900, mountOnId: orderDesk.id, localState: 'on' }),
    furn('wall_tv', 19860, 3400, { rotation: 90, elevation: 1000, label: 'Media wall 1', localState: 'playing' }),
    furn('wall_tv', 19860, 5000, { rotation: 90, elevation: 1000, label: 'Media wall 2', localState: 'playing' }),
    mediaStand,
    furn('tv', 18900, 7200, { rotation: 90, elevation: 450, mountOnId: mediaStand.id, label: 'Console TV', localState: 'playing' }),

    // ── Row 1 · cooking, dishwashing & refrigeration (y = 5900) ─────────────
    furn('stove', 5300, 5900, { rotation: 0, label: 'Slide-in range', localState: 'on', tempEntity: null }),
    furn('dishwasher', 6300, 5900, { rotation: 0, label: 'Dishwasher', localState: 'on' }),
    furn('kitchen_sink', 7300, 5900, { rotation: 0, label: 'Double-bowl kitchen sink', localState: 'on' }),
    applianceBar,
    furn('microwave', 8600, 5900, { rotation: 0, elevation: 900, mountOnId: applianceBar.id, label: 'Countertop microwave' }),
    furn('coffee_maker', 9400, 5900, { rotation: 0, elevation: 900, mountOnId: applianceBar.id, label: 'Drip brewer', localState: 'on' }),
    furn('retro_fan', 10000, 5900, { rotation: 0, elevation: 900, mountOnId: applianceBar.id, label: 'Retro desk fan', localState: 'on' }),
    furn('island', 12200, 5900, { rotation: 0, w: 2400, h: 1000, label: 'Kitchen vignette island' }),
    furn('fridge', 14500, 5900, { rotation: 0, label: 'French door', localState: 'on' }),
    furn('fridge', 15800, 5900, { rotation: 0, label: 'Beverage centre' }),

    // ── Row 2 · laundry & portable climate (y = 8400) ───────────────────────
    furn('washer', 5300, 8400, { rotation: 0, label: 'Front-load washer', localState: 'on' }),
    furn('dryer', 6100, 8400, { rotation: 0, label: 'Heat-pump dryer', localState: 'on' }),
    // Stacked column demo: the dryer sits on top of its washer, one footprint.
    furn('washer', 7200, 8400, { rotation: 0, label: 'Stacked column — washer', localState: 'on' }),
    furn('dryer', 7200, 8400, { rotation: 0, elevation: 990, label: 'Stacked column — dryer', localState: 'on' }),
    furn('floor_fan', 8500, 8400, { rotation: 0, label: 'Shop floor fan', localState: 'on' }),
    pedestalFan,
    furn('tower_fan', 10000, 8400, { rotation: 0, label: 'Tower fan', localState: 'on' }),
    furn('bladeless_fan', 10700, 8400, { rotation: 0, label: 'Bladeless fan', localState: 'on' }),
    furn('portable_ac', 11500, 8400, { rotation: 0, label: 'Portable AC', localState: 'on' }),
    furn('space_heater', 12300, 8400, { rotation: 0, label: 'Ceramic space heater', localState: 'on' }),

    // ── North arm · wall-hung climate on the back wall (all elevated) ───────
    furn('mini_split', 5200, 13890, { rotation: 0, elevation: 2100, label: 'Mini-split head', localState: 'on' }),
    furn('window_ac', 6600, 13830, { rotation: 0, elevation: 900, label: 'Window AC', localState: 'on' }),
    furn('wall_heater', 7800, 13930, { rotation: 0, elevation: 400, label: 'Wall heater', localState: 'on' }),

    // ── North arm · sink wall (y = 13500, daylit by the clerestory) ─────────
    furn('pedestal_sink', 9400, 13500, { rotation: 0, label: 'Pedestal sink' }),
    furn('sink', 10300, 13500, { rotation: 0, label: 'Compact vanity' }),
    furn('utility_sink', 11300, 13500, { rotation: 0, label: 'Utility tub' }),
    furn('trash_bin', 12200, 13400, { rotation: 0, label: 'Store waste' }),
    furn('recycle_bin', 12200, 12600, { rotation: 0, label: 'Carton recycling' }),

    // ── North arm · customer lounge ─────────────────────────────────────────
    furn('rug', 5900, 11300, { rotation: 0, w: 2600, h: 2200 }),
    furn('sofa_l_right', 6000, 10600, { rotation: 180, label: 'Lounge sectional' }),
    furn('coffee_table', 5900, 12100, { rotation: 0 }),
    furn('plant', 7900, 10400, { rotation: 0 }),
    furn('plant', 12200, 9900, { rotation: 0 }),

    // ── Lighting gallery props (the fixtures themselves are lights) ─────────
    furn('bookshelf', 13250, 10400, { rotation: 270, label: 'Fixture shelving' }),
    furn('rug', 14800, 12600, { rotation: 0, w: 2600, h: 1800 }),
    furn('ottoman', 14800, 12400, { rotation: 0 }),
    furn('plant', 13300, 13400, { rotation: 0 }),
    // Landscape-lighting vignette in the gallery's east bay.
    furn('picnic_table', 18300, 10400, { rotation: 0, label: 'Patio set' }),
    furn('bush', 19500, 10400, { rotation: 0 }),
    furn('rock_cluster', 17000, 11800, { rotation: 0 }),

    // ── Bath & Vanity Studio ────────────────────────────────────────────────
    // rot 180 = opening south into the studio (matching the toilet on the same
    // wall); at 0 it opened onto the north partition 295 mm away.
    furn('shower', 900, 6000, { rotation: 180, label: 'Walk-in shower' }),
    furn('toilet', 2900, 5700, { rotation: 180 }),
    furn('sink_vanity', 2900, 7300, { rotation: 0, label: 'Vanity sink' }),
    furn('bathtub', 1200, 7700, { rotation: 0, label: 'Soaking tub' }),
    furn('towel_warmer', 3940, 7800, { rotation: 90, elevation: 900, label: 'Towel warmer', localState: 'on' }),
    furn('wall_radiator', 110, 5700, { rotation: 90, elevation: 400, label: 'Wall radiator', localState: 'on' }),

    // ── Sales Office ────────────────────────────────────────────────────────
    furn('desk', 1200, 9200, { rotation: 180, label: 'Sales desk' }),
    furn('chair', 1200, 9900, { rotation: 0 }),
    officeCredenza,
    furn('printer_3d', 2500, 10800, { rotation: 0, elevation: 900, mountOnId: officeCredenza.id, label: 'Parts printer', localState: 'on' }),
    furn('bookshelf', 2900, 8700, { rotation: 180, label: 'Spec binders' }),
    furn('plant', 3600, 10900, { rotation: 0 }),

    // ── Mechanical Room — a working plant room AND the display of record ────
    furn('floor_radiator', 350, 12600, { rotation: 90, label: 'Cast-iron floor radiator', localState: 'on' }),
    furn('water_heater', 900, 13500, { rotation: 0, label: 'Heat-pump water heater', localState: 'on' }),
    furn('boiler', 1700, 13500, { rotation: 0, label: 'Condensing boiler', localState: 'on' }),
    furn('air_handler', 2600, 13500, { rotation: 0, label: 'Air handler', localState: 'on' }),
    furn('heat_pump', 3450, 13600, { rotation: 0, label: 'Heat-pump outdoor unit', localState: 'on' }),
    furn('ac_condenser', 1100, 11900, { rotation: 0, label: 'AC condenser' }),
    furn('sump_pump', 2200, 11700, { rotation: 0, label: 'Sump pump', localState: 'on' }),
    furn('recirc_pump', 2900, 11700, { rotation: 0, label: 'Recirculation pump', localState: 'on' }),
  ];

  // ── Lighting ─────────────────────────────────────────────────────────────
  // Hall: LED strips over the rows, hero spots on each department's end cap.
  // Gallery: a walk-in catalogue of every fixture kind, indoor and landscape.
  //
  // LOAD STATE — deliberately sparse. An ON light draws a translucent floor-pool
  // decal (a CircleGeometry of `lightRadius` at y≈3, depthWrite:false). Two ON
  // pools that OVERLAP are coplanar transparent surfaces with no depth tie-break,
  // so the renderer's transparent sort flips between them frame to frame and the
  // lit patch visibly crawls/flickers — with 41 of 42 fixtures loading ON this
  // room was a field of overlapping decals. The rule now:
  //
  //   1. Only ARCHITECTURAL / general lighting loads ON — the hall strips, the
  //      aisle festoon, one hero spot per department end cap, the two pendants
  //      and one ceiling fixture per side room. That's 12 fixtures, enough that
  //      the whole plan reads lit.
  //   2. NO two ON pool-casting fixtures may overlap: pairwise centre distance
  //      must exceed r1 + r2 (r = the authored `radius`, else lightRadius's 900
  //      default). The closest pair here is Front-of-house ↔ Aisle festoon at
  //      2300 mm vs 1800 mm of pool — 500 mm of daylight. Pool-SKIPPING kinds
  //      (sconce / wall_sconce / under_cabinet / fan / exhaust* / inground /
  //      ground_spot) cannot z-fight and are free to load ON.
  //   3. The whole Lighting Gallery loads OFF. Those fixtures are PRODUCTS on
  //      display — a visitor (or a demo avatar) switches one on to see it, which
  //      is the point of the department; ganging all 22 on at once both flickers
  //      and reads as noise.
  const lights = [
    // Hall — general lighting (ON, non-overlapping pools)
    light(10000, 1300, { iconKind: 'strip', rotation: 0, length: 9000, label: 'Front-of-house strip', localState: 'on' }),
    light(10500, 5900, { iconKind: 'strip', rotation: 0, length: 11000, label: 'Kitchen row strip', localState: 'on' }),
    light(8700, 8400, { iconKind: 'strip', rotation: 0, length: 7800, label: 'Laundry & climate strip', localState: 'on' }),
    light(10000, 3600, { iconKind: 'string', rotation: 0, length: 6000, label: 'Aisle festoon', localState: 'on' }),
    light(5300, 5900, { iconKind: 'spot', radius: 900, label: 'Hero range spot', localState: 'on' }),
    light(14500, 5900, { iconKind: 'spot', radius: 900, label: 'Hero fridge spot', localState: 'on' }),
    light(13200, 2000, { iconKind: 'pendant', label: 'Checkout pendant', localState: 'on' }),
    light(17000, 1800, { iconKind: 'pendant', label: 'Order desk pendant', localState: 'on' }),
    light(10000, 13000, { iconKind: 'strip', rotation: 0, length: 5000, label: 'Sink wall strip', localState: 'on' }),
    light(5900, 11300, { iconKind: 'round', label: 'Lounge ceiling', localState: 'on' }),
    // Hall — accents that load OFF (their pools would lap a general fixture) or
    // cast no pool at all.
    light(5300, 8400, { iconKind: 'spot', radius: 900, label: 'Hero laundry spot' }),
    light(5300, 5500, { iconKind: 'exhaust', label: 'Range hood exhaust', localState: 'on' }),   // no pool
    light(9200, 6250, { iconKind: 'under_cabinet', rotation: 0, length: 1800, label: 'Appliance-bar under-cabinet', localState: 'on' }),  // no pool
    light(70, 2400, { iconKind: 'flood', rotation: -90, label: 'EV bay flood' }),
    light(5900, 12400, { iconKind: 'lamp', height: 1500, label: 'Lounge lamp' }),

    // Bath & Vanity Studio — the combined exhaust-and-light casts no floor pool,
    // so it lights the room without joining the decal pile; the heat lamp (a red
    // pool right beside it) stays off.
    light(1100, 6400, { iconKind: 'heatlamp', label: 'Bath heat lamp' }),
    light(2900, 6400, { iconKind: 'exhaust_light', label: 'Bath exhaust + light', localState: 'on' }),
    light(70, 5700, { iconKind: 'exhaust_wall', rotation: -90, label: 'Bath wall exhaust', localState: 'on' }),

    // Sales Office
    light(1900, 9700, { iconKind: 'round', label: 'Office ceiling', localState: 'on' }),
    light(1200, 8900, { iconKind: 'under_cabinet', rotation: 0, length: 1200, label: 'Desk task light' }),

    // Mechanical Room
    light(2000, 12400, { iconKind: 'strip', rotation: 0, length: 3000, label: 'Plant room strip', localState: 'on' }),
    light(2000, 13930, { iconKind: 'exhaust_wall', rotation: 0, label: 'Plant room exhaust', localState: 'on' }),

    // ── Lighting Gallery — the catalogue wall. ALL OFF at load (see note 3). ──
    light(13400, 12000, { iconKind: 'bulb', label: 'Bare bulb' }),
    light(14400, 12000, { iconKind: 'oval', label: 'Oval flush mount' }),
    light(15400, 12000, { iconKind: 'bowl', label: 'Bowl uplight' }),
    light(16400, 12000, { iconKind: 'tiered', label: 'Tiered chandelier' }),
    light(17400, 12000, { iconKind: 'jar', label: 'Mason-jar pendant' }),
    light(18400, 12000, { iconKind: 'round', label: 'Round panel' }),
    light(19400, 12000, { iconKind: 'recessed', radius: 600, label: 'Recessed can' }),
    light(13400, 13300, { iconKind: 'pendant', label: 'Pendant' }),
    light(14700, 13300, { iconKind: 'fan', label: 'Ceiling fan' }),
    light(16100, 13300, { iconKind: 'fan_light', label: 'Fan with light' }),
    light(17400, 13300, { iconKind: 'lamp', height: 1600, label: 'Floor lamp' }),
    light(12920, 11200, { iconKind: 'wall_sconce', rotation: -90, radius: 500, label: 'Wall sconce pair' }),
    light(12920, 12600, { iconKind: 'wall_sconce', rotation: -90, radius: 500, label: 'Wall sconce pair' }),
    light(19880, 12600, { iconKind: 'sconce', rotation: 90, radius: 500, label: 'Half-dome sconce' }),
    light(12850, 9800, { iconKind: 'step', rotation: -90, label: 'Step light' }),
    light(12850, 13600, { iconKind: 'step', rotation: -90, label: 'Step light' }),
    light(14800, 13725, { iconKind: 'fireplace', rotation: 0, label: 'Hearth vignette' }),
    // Landscape lighting, staged on the gallery's grass patch.
    light(17600, 11500, { iconKind: 'inground', label: 'In-ground uplight' }),
    light(19200, 11500, { iconKind: 'inground', label: 'In-ground uplight' }),
    light(18300, 11700, { iconKind: 'ground_spot', rotation: 180, label: 'Ground spot' }),
    light(19930, 10400, { iconKind: 'flood', rotation: 90, label: 'Outdoor display flood' }),
  ];

  const switches = [
    switchFix(8600, 70, { rotation: 0, label: 'Entrance bank' }),
    switchFix(4070, 5600, { rotation: 90, label: 'Bath studio' }),
    switchFix(4070, 10800, { rotation: 90, label: 'Sales office' }),
    switchFix(4070, 13500, { rotation: 90, label: 'Mechanical room' }),
    switchFix(12870, 9800, { rotation: 90, label: 'Lighting gallery' }),
    switchFix(19930, 5000, { rotation: -90, label: 'Display rows' }),
  ];

  // Demo AI-avatar presence sensors: always-on shoppers/staff confined to the
  // wall loop they sit in (hall / office / gallery). Unbound — no HA needed.
  const motionSensors = [
    {
      id: nid('mo'), x: 9000, y: 4200, heading: 0, fov: 360, range: 7000,
      label: 'Showroom floor presence', entity_id: null, color: '#4fc3f7',
      avatar: true, demo: true, avatarKinds: ['adult', 'professional', 'elder'],
    },
    {
      id: nid('mo'), x: 15500, y: 3000, heading: 0, fov: 360, range: 6000,
      label: 'Checkout presence', entity_id: null, color: '#ffb74d',
      avatar: true, demo: true, avatarKinds: ['professional', 'teen'],
    },
    {
      id: nid('mo'), x: 16000, y: 11800, heading: 0, fov: 360, range: 5000,
      label: 'Lighting gallery presence', entity_id: null, color: '#ce93d8',
      avatar: true, demo: true, avatarKinds: ['adult', 'child'],
    },
    {
      id: nid('mo'), x: 1900, y: 9700, heading: 0, fov: 360, range: 3500,
      label: 'Sales office presence', entity_id: null, color: '#81c784',
      avatar: true, demo: true, avatarKinds: ['professional', 'adult'],
    },
  ];

  // One unbound mmWave unit aimed up the centre aisle from the storefront —
  // the retail footfall counter, and the coverage wedge is part of the demo.
  const sensors = [
    {
      id: nid('mm'), x: 10000, y: 300, heading: 0, fov: 120, range: 9000,
      label: 'Entrance footfall (mmWave)', deviceSlug: null, color: '#4dd0e1',
      avatarKinds: ['adult', 'professional', 'teen'],
    },
  ];

  const envSensors = [
    { id: nid('env'), x: 12000, y: 4300, entity_id: null, kind: 'temperature', label: 'Hall temp', height: 1500 },
    { id: nid('env'), x: 2400, y: 6900, entity_id: null, kind: 'humidity', label: 'Bath studio RH', height: 1500 },
    { id: nid('env'), x: 17800, y: 8600, entity_id: null, kind: 'co2', label: 'Hall CO₂', height: 1500 },
    { id: nid('env'), x: 3400, y: 12200, entity_id: null, kind: 'co', label: 'Plant room CO', height: 1500 },
  ];

  const safetySensors = [
    { id: nid('sf'), x: 9000, y: 7200, kind: 'smoke', entity_id: null, label: 'Hall smoke' },
    { id: nid('sf'), x: 16000, y: 10600, kind: 'smoke', entity_id: null, label: 'Gallery smoke' },
    { id: nid('sf'), x: 2000, y: 12900, kind: 'gas', entity_id: null, label: 'Boiler gas detector' },
    { id: nid('sf'), x: 1400, y: 12300, kind: 'leak', entity_id: null, label: 'Plant room leak puck' },
  ];

  const cameras = [
    {
      id: nid('cam'), x: 400, y: 400, rotation: 45, fov: 90, range: 14000, height: 2600,
      entity_id: null, alertEntity: null, label: 'Sales floor west',
    },
    {
      id: nid('cam'), x: 19600, y: 400, rotation: 315, fov: 90, range: 14000, height: 2600,
      entity_id: null, alertEntity: null, label: 'Sales floor east',
    },
  ];

  // Footfall zone across the entrance vestibule (unbound — display only).
  const presenceZones = [
    {
      id: nid('pz'), name: 'Entrance vestibule', entity_id: null, color: '#26c6da',
      points: [
        { x: 8600, y: 300 }, { x: 12200, y: 300 },
        { x: 12200, y: 2600 }, { x: 8600, y: 2600 },
      ],
    },
  ];

  // Grass patch under the gallery's landscape-lighting vignette.
  const groundAreas = [
    {
      id: nid('ga'), kind: 'grass', name: 'Landscape lighting bed',
      points: [
        { x: 16800, y: 9500 }, { x: 19800, y: 9500 },
        { x: 19800, y: 12400 }, { x: 16800, y: 12400 },
      ],
    },
  ];

  const look = { floorTex: 'concrete', floorColor: '#b9bcc2', wallColor: '#eef1f4' };

  const f = floor({
    name: 'Showroom', w: W, d: D,
    walls, rooms, doors, windows, furniture, lights, switches,
    sensors, motionSensors, envSensors, safetySensors, cameras,
    presenceZones, groundAreas,
    look3d: look,
  });

  // Control fixtures the `floor()` helper doesn't take as a spec key — attached
  // directly, exactly like garden-center's sprinkler zones and interior-design-
  // store's rulers.
  f.thermostats = [
    {
      id: nid('th'), x: 4063, y: 7900, rotation: 90, height: 1500,
      entity_id: null, localState: 'cool', localTemp: 22, label: 'Showroom thermostat',
    },
    {
      id: nid('th'), x: 3937, y: 12200, rotation: -90, height: 1500,
      entity_id: null, localState: 'heat', localTemp: 19, label: 'Plant room thermostat',
    },
  ];

  f.valves = [
    {
      id: nid('vl'), x: 1500, y: 12800, rotation: 0, entity_id: null,
      localState: 'on', label: 'Main water shutoff',
    },
  ];

  f.plugs = [
    { id: nid('pl'), x: 4068, y: 8800, rotation: 90, height: 300, entity_id: null, localState: 'on', label: 'Climate row outlet' },
    { id: nid('pl'), x: 19933, y: 7900, rotation: -90, height: 300, entity_id: null, localState: 'on', label: 'Media wall outlet' },
    { id: nid('pl'), x: 12868, y: 11800, rotation: 90, height: 300, entity_id: null, label: 'Gallery outlet' },
  ];

  // Clock cards need no binding, so they read correctly with no Home Assistant.
  f.infoCards = [
    {
      id: nid('ic'), x: 11600, y: 60, rotation: 0, mount: 'wall',
      displayMode: 'clock', clockFormat: '12h', entity_id: null,
      fontScale: 1.4, label: 'Store clock',
    },
    {
      id: nid('ic'), x: 12860, y: 13000, rotation: 90, mount: 'wall',
      displayMode: 'clock_date', clockFormat: '24h', dateFormat: 'medium',
      entity_id: null, label: 'Gallery clock',
    },
    {
      id: nid('ic'), x: 2000, y: 11140, rotation: 180, mount: 'wall',
      displayMode: 'date', dateFormat: 'medium', entity_id: null, label: 'Service log date',
    },
  ];

  f.actionButtons = [
    {
      id: nid('ab'), x: 11200, y: 65, rotation: 0, wallMount: true,
      actionKind: 'scene', entity_id: null, icon: '🏪', color: '#ffb74d',
      label: 'Open the store', localState: 'off',
    },
    {
      id: nid('ab'), x: 12865, y: 10600, rotation: 90, wallMount: true,
      actionKind: 'scene', entity_id: null, icon: '✨', color: '#7e57c2',
      label: 'Gallery light show', localState: 'off',
    },
  ];

  f.projectors = [
    {
      id: nid('pj'), x: 17000, y: 5000, height: 2600, rotation: 90,
      entity_id: null, localState: 'on', screenId: null, throwRatio: 1.5,
      beamColor: '#dfe8ff', label: 'Home-theatre projector',
    },
  ];

  f.calendarPanels = [
    {
      id: nid('cp'), x: 70, y: 8900, rotation: 90, height: 1600,
      calendarIds: [], label: 'Delivery calendar',
    },
  ];

  f.alertBeacons = [
    {
      id: nid('al'), x: 2600, y: 12200, height: 2743, entity_id: null,
      label: 'Plant room annunciator',
    },
  ];

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
      '~3,014 sq ft (280 m²) retail hall · 1 floor · 5 rooms — appliance, mechanical & lighting showcase',
      '',
      'A 20 × 14 m big-box showroom built to demonstrate the appliance, climate,',
      'plumbing, mechanical and LIGHTING models Diorama ships — one hero unit per',
      'model rather than a shelf of duplicates, so most of the floor is open aisle.',
      'It is not a house; it is a catalogue you can walk through. Display rows run',
      'east–west across a C-shaped hall that wraps a west service block and a',
      'walk-in lighting gallery, so avatars can path to any piece.',
      '',
      'Most units are switched ON via localState with no Home Assistant attached, so',
      'the hall reads alive out of the box: appliance in-use LEDs pulse, fan blades',
      'spin (the stand fan oscillates), the mini-split louver swings open, the space',
      'heater glows, the towel warmer and radiators heat, the boiler and pumps run,',
      'the kitchen sink is left running and the media wall plays. The LIGHTS are the',
      'exception: only the twelve architectural fixtures load on (and no two of their',
      'floor pools overlap, which would flicker), while the lighting gallery loads',
      'dark — those fixtures are products, so switch one on to see it work.',
      '',
      'Departments:',
      'Storefront (south): full-height picture glazing either side of a double-leaf',
      '  main entrance and a sliding-glass patio door that IS the patio-door display.',
      'EV bay (south-west): a display car nose-on to a home charger, served by the',
      '  delivery-bay garage door in the west wall.',
      'Front of house: charcoal checkout island, order desk with a toaster, a',
      '  two-screen wall-mounted media wall and a console TV on its stand.',
      'Kitchen row: slide-in range, dishwasher, double-bowl sink, an appliance bar',
      '  carrying a microwave, drip brewer and retro fan, a kitchen vignette island,',
      '  and two fridges (French door, beverage centre).',
      'Laundry & portable climate: a washer/dryer pair, a stacked washer-dryer',
      '  column on one footprint, and the portable comfort family — shop fan,',
      '  oscillating stand fan, tower fan, bladeless fan, portable AC, space heater.',
      'Back wall: mini-split head, window AC and wall heater mounted clear of the',
      '  floor, plus the sink wall (pedestal, compact vanity, utility tub) daylit by',
      '  a clerestory, and a customer lounge with sofa, rug, coffee table and lamp.',
      '',
      'Rooms off the hall:',
      'Bath & Vanity Studio (pocket door): walk-in shower, soaking tub, vanity sink,',
      '  toilet, towel warmer and a wall radiator, under a heat lamp, a combined',
      '  exhaust-and-light and a wall exhaust fan.',
      'Sales Office (glazed french doors): desk and chair, credenza with a working',
      '  3D parts printer, spec-binder shelving, a wall calendar and a date card.',
      'Mechanical Room (barn slider): the full plant-room family — heat-pump water',
      '  heater, condensing boiler, air handler, heat-pump outdoor unit, AC',
      '  condenser, sump and recirculation pumps and a cast-iron floor radiator —',
      '  with a main-water valve, gas and leak detectors, an alarm beacon and its',
      '  own thermostat.',
      'Lighting Gallery (north-east): a walk-in catalogue of fixture kinds — bare',
      '  bulb, oval, bowl, tiered, mason jar, round panel, recessed can, pendant,',
      '  ceiling fan, fan-with-light and floor lamp overhead; a wall-sconce pair,',
      '  a half-dome sconce and two step lights on the walls; a hearth vignette on',
      '  the back wall; and a landscape bay on a grass patch with in-ground',
      '  uplights, a ground spot and a flood over a patio set.',
      '',
      'Control kit (all unbound — display and local-toggle only): two thermostats,',
      '  three smart plugs, a water valve, two scene buttons, a ceiling projector,',
      '  three clock/date info cards, a wall calendar, an alert beacon, two security',
      '  cameras, an entrance presence zone, an mmWave footfall unit, four demo',
      '  AI-avatar presence sensors, four env sensors and four safety detectors.',
    ].join('\n'),
  });
}
