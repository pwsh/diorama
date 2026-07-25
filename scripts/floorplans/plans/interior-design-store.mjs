// Interior Design Studio — "Vignette & Co." A FEATURE SHOWCASE for the soft
// side of the renderer: a 13 × 11 m showroom carved into SIX fully-dressed
// room vignettes so a shopper can walk from a staged living room into a staged
// bedroom without a single door.
//
// What it demonstrates:
//   • Half walls + railings as sightline dividers. Each vignette is a closed
//     wall loop (so it is a real Room with a label, activity context and its own
//     AI-avatar home room) traced from INVISIBLE chords — which count toward
//     `closedWallLoops` but are skipped by the nav rasterizer — with short
//     `half` / `railing` stubs laid on the same lines for the visible partition.
//     The stubs are deliberately short, so every vignette stays open to its
//     neighbours and the whole floor is ONE nav region.
//   • A window wall: all four non-default `WindowKind`s along the south
//     elevation (double-hung, casement pair, sliding, picture) each dressed with
//     a different curtain style and openness, plus a fifth on the east wall.
//   • Wall/structure DIMENSIONS: `dimensionMode: 'outside'` puts CAD dimension
//     lines on every exterior wall segment, and two object-anchored Rulers
//     (west↔east and south↔north wall pairs) report the clear inside dimensions
//     and follow the walls if they are ever moved.
//   • Deliberate LightIconKind variety — one signature fixture family per
//     vignette (lamp/recessed, pendant/tiered, round/under-cabinet, sconce pair,
//     string/jar, fireplace/bowl) plus track spots over the circulation spine.
//   • A hearth vignette: a wall-locked fireplace light with a chaise and a
//     rocking chair drawn up to it.
import { floorplan } from '../lib.mjs';

export const id = 'interior-design-store';
export const name = 'Interior Design Studio — Vignette & Co.';

export function build() {
  const b = floorplan(id);
  const { wall, room, door, win, furn, light, switchFix, roamer, floor, assembleStore, id: nid } = b;

  const W = 13000, D = 11000;

  // ── Shell ────────────────────────────────────────────────────────────────
  // The four exterior runs are SEPARATE wall objects so the rulers below can
  // anchor to opposing walls (a ruler with both ends on one polyline has no
  // meaningful clear dimension).
  const wSouth = wall([{ x: 0, y: 0 }, { x: W, y: 0 }]);
  const wEast = wall([{ x: W, y: 0 }, { x: W, y: D }]);
  const wNorth = wall([{ x: W, y: D }, { x: 0, y: D }]);
  const wWest = wall([{ x: 0, y: D }, { x: 0, y: 0 }]);

  // The living/bedroom divider is hoisted so a ruler can anchor to it.
  const wLivingDivider = wall([{ x: 1400, y: 5600 }, { x: 3600, y: 5600 }], 'half');

  const walls = [
    wSouth, wEast, wNorth, wWest,
    // Invisible chords: they close each vignette into a room loop but never
    // block nav, so the showroom reads (and walks) as one continuous space.
    wall([{ x: 4400, y: 0 }, { x: 4400, y: D }], 'invisible'),
    wall([{ x: 8700, y: 0 }, { x: 8700, y: D }], 'invisible'),
    wall([{ x: 0, y: 5600 }, { x: W, y: 5600 }], 'invisible'),
    // Visible partition stubs laid on those same lines — short enough that a
    // wide opening is left at one or both ends of every divider.
    wall([{ x: 4400, y: 0 }, { x: 4400, y: 2200 }], 'half'),
    wall([{ x: 4400, y: 8000 }, { x: 4400, y: D }], 'railing'),
    wall([{ x: 8700, y: 3000 }, { x: 8700, y: 5600 }], 'half'),
    wall([{ x: 8700, y: 5600 }, { x: 8700, y: 7600 }], 'railing'),
    wLivingDivider,
    wall([{ x: 9600, y: 5600 }, { x: 12200, y: 5600 }], 'railing'),
  ];

  const rooms = [
    room('Living Room Vignette', 2200, 2800),
    room('Dining Vignette', 6500, 2800),
    room('Home Office Vignette', 10800, 2800),
    room('Bedroom Vignette', 2200, 8300),
    room('Reading Nook & Checkout', 6500, 8300),
    room('Fireplace Lounge', 10800, 8300),
  ];

  const doors = [
    door(8000, 0, 0, { w: 1600, label: 'Studio entrance', doorbellEntity: null }),
    door(5600, D, 0, { w: 900, label: 'Service / stock' }),
  ];

  // The window wall: one of each non-default glazing kind, each with a
  // different curtain treatment and openness so the four styles read at a glance.
  const windows = [
    win(1500, 0, 0, {
      w: 1800, kind: 'double_hung', sill: 800, height: 1500, label: 'Double-hung + split drapes',
    }),
    win(3400, 0, 0, {
      w: 1400, kind: 'casement_pair', sill: 800, height: 1500, label: 'Casement pair + side drape',
    }),
    win(6200, 0, 0, {
      w: 2200, kind: 'sliding', sill: 400, height: 2000, label: 'Slider + roman shade',
    }),
    win(11200, 0, 0, {
      w: 2400, kind: 'picture', sill: 600, height: 1900, label: 'Picture window + open drapes',
    }),
    win(W, 3000, 90, {
      w: 1600, kind: 'double_hung', sill: 900, height: 1400, label: 'East double-hung',
    }),
    win(3000, D, 0, {
      w: 2000, kind: 'sliding', sill: 900, height: 1300, label: 'Bedroom slider',
    }),
  ];
  // Curtain treatments (lib.mjs's win() has no curtain opt — set directly).
  windows[0].curtain = { style: 'split', color: '#c9b79c' };
  windows[0].curtainPos = 55;
  windows[1].curtain = { style: 'vertical', side: 'left', color: '#8fa6a0' };
  windows[1].curtainPos = 20;
  windows[2].curtain = { style: 'horizontal', color: '#e2d6bd' };
  windows[2].curtainPos = 80;
  windows[3].curtain = { style: 'split', color: '#b98d72' };
  windows[3].curtainPos = 100;
  windows[4].curtain = { style: 'vertical', side: 'right', color: '#a8949f' };
  windows[4].curtainPos = 40;
  windows[5].curtain = { style: 'horizontal', color: '#cfd6d9' };
  windows[5].curtainPos = 100;

  const furniture = [
    // ── Living Room vignette (SW) ─────────────────────────────────────────
    furn('sofa', 2200, 4400, { rotation: 0, w: 2000, h: 900, label: 'Staged sofa', color: '#5c6b73' }),
    furn('coffee_table', 2200, 3200, { rotation: 0 }),
    furn('chair', 700, 3400, { rotation: 270, label: 'Accent chair' }),
    furn('bookshelf', 300, 1600, { rotation: 90, label: 'Styled shelf' }),
    furn('tv_stand', 4100, 2400, { rotation: 90, label: 'Media console' }),
    furn('tv', 4100, 2400, { rotation: 90, elevation: 550, localState: 'off' }),
    furn('rug', 2200, 3800, { rotation: 0, w: 3000, h: 2200, color: '#7a5c48' }),
    furn('plant', 500, 4600, { rotation: 0 }),

    // ── Dining vignette (S centre) ────────────────────────────────────────
    furn('table', 6500, 3200, { rotation: 0, w: 1800, h: 1000, label: 'Staged dining table' }),
    furn('chair', 5500, 3200, { rotation: 270 }),
    furn('chair', 7500, 3200, { rotation: 90 }),
    furn('chair', 6500, 2200, { rotation: 180 }),
    furn('chair', 6500, 4200, { rotation: 0 }),
    furn('dresser', 6500, 800, { rotation: 0, w: 1400, h: 500, label: 'Sideboard' }),
    furn('rug', 6500, 3200, { rotation: 0, w: 3200, h: 2400, color: '#6b5340' }),
    furn('plant', 8300, 900, { rotation: 0 }),

    // ── Home office vignette (SE) ─────────────────────────────────────────
    furn('desk', 10600, 1400, { rotation: 0, w: 1600, h: 800, label: 'Staged desk' }),
    furn('chair', 10600, 2400, { rotation: 0 }),
    furn('bookshelf', 12700, 1400, { rotation: 90, label: 'Library wall' }),
    furn('bookshelf', 12700, 2400, { rotation: 90, label: 'Library wall' }),
    furn('cabinet', 11800, 4600, { rotation: 180, label: 'Filing cabinet' }),
    furn('plant', 9200, 4800, { rotation: 0 }),
    furn('rug', 10600, 2200, { rotation: 0, w: 2800, h: 2200, color: '#4f5a63' }),

    // ── Bedroom vignette (NW) ─────────────────────────────────────────────
    furn('bed', 2200, 9400, { rotation: 0, w: 2000, h: 1500, label: 'Staged queen bed' }),
    furn('nightstand', 900, 9400, { rotation: 0 }),
    furn('nightstand', 3500, 9400, { rotation: 0 }),
    furn('dresser', 700, 6600, { rotation: 0, w: 1200, h: 500 }),
    furn('wardrobe', 3600, 6600, { rotation: 0, w: 1200, h: 600 }),
    furn('bench', 2200, 8300, { rotation: 0, w: 1400, h: 400, label: 'Bed-end bench' }),
    furn('rug', 2200, 8600, { rotation: 0, w: 3200, h: 2600, color: '#8a7a63' }),
    furn('plant', 4000, 10400, { rotation: 0 }),

    // ── Reading nook + checkout (N centre) ────────────────────────────────
    furn('desk', 7600, 6500, { rotation: 0, w: 2000, h: 800, label: 'Checkout desk' }),
    furn('chair', 7600, 7500, { rotation: 0 }),
    furn('bookshelf', 4700, 8600, { rotation: 90, label: 'Nook shelf' }),
    furn('bookshelf', 4700, 9600, { rotation: 90, label: 'Nook shelf' }),
    furn('rocking_chair', 5800, 9400, { rotation: 0, label: 'Reading rocker' }),
    furn('ottoman', 5800, 8400, { rotation: 0 }),
    furn('rug', 5700, 8900, { rotation: 0, w: 2600, h: 2600, color: '#6d5f4f' }),
    furn('plant', 8400, 10400, { rotation: 0 }),

    // ── Fireplace lounge (NE) ─────────────────────────────────────────────
    furn('chaise', 11300, 7900, { rotation: 270, label: 'Hearth chaise', color: '#7d6552' }),
    furn('rocking_chair', 11400, 9600, { rotation: 270, label: 'Hearth rocker' }),
    furn('coffee_table', 12000, 8700, { rotation: 90 }),
    furn('bookshelf', 9200, 9600, { rotation: 270, label: 'Lounge shelf' }),
    furn('rug', 11400, 8600, { rotation: 0, w: 3000, h: 2600, color: '#8c5f45' }),
    furn('plant', 12600, 6400, { rotation: 0 }),
    furn('plant', 9600, 6300, { rotation: 0 }),
  ];

  // Deliberately varied fixture families — one signature per vignette.
  const lights = [
    // Living room: floor lamp + recessed cans
    light(3600, 4600, { iconKind: 'lamp', height: 1500, label: 'Living lamp', localState: 'on' }),
    light(2200, 1500, { iconKind: 'recessed', radius: 700, label: 'Living can', localState: 'on' }),
    light(1200, 4200, { iconKind: 'recessed', radius: 700, label: 'Living can' }),
    // Dining: pendant over the table + a tiered chandelier at the sideboard
    light(6500, 3200, { iconKind: 'pendant', label: 'Dining pendant', localState: 'on' }),
    light(6500, 1500, { iconKind: 'tiered', label: 'Sideboard chandelier', localState: 'on' }),
    // Home office: flat round panel + an under-cabinet task strip
    light(10600, 3600, { iconKind: 'round', label: 'Office panel', localState: 'on' }),
    light(10600, 900, { iconKind: 'under_cabinet', rotation: 0, length: 1600, label: 'Desk task light', localState: 'on' }),
    // Bedroom: sconce pair flanking the bed + a soft ceiling bulb
    light(1100, 10600, { iconKind: 'sconce', rotation: 180, radius: 500, label: 'Bed sconce L', localState: 'on' }),
    light(3300, 10600, { iconKind: 'sconce', rotation: 180, radius: 500, label: 'Bed sconce R', localState: 'on' }),
    light(2200, 7000, { iconKind: 'bulb', label: 'Bedroom ceiling' }),
    // Reading nook: string lights + a jar lantern + a reading lamp
    light(5800, 9000, { iconKind: 'string', radius: 1400, label: 'Nook string', localState: 'on' }),
    light(4900, 10200, { iconKind: 'jar', label: 'Nook lantern', localState: 'on' }),
    light(6700, 8500, { iconKind: 'lamp', height: 1500, label: 'Reading lamp', localState: 'on' }),
    light(7600, 6500, { iconKind: 'round', label: 'Checkout panel', localState: 'on' }),
    // Fireplace lounge: the hearth itself + an uplight bowl + a wall sconce
    light(12725, 8300, { iconKind: 'fireplace', rotation: 90, label: 'Showroom hearth', localState: 'on' }),
    light(10400, 7400, { iconKind: 'bowl', label: 'Lounge uplight', localState: 'on' }),
    light(12800, 6000, { iconKind: 'wall_sconce', rotation: 90, radius: 500, label: 'Lounge sconce' }),
    // Circulation spine track spots
    light(4400, 4200, { iconKind: 'spot', radius: 800, label: 'Track spot', localState: 'on' }),
    light(8700, 2000, { iconKind: 'spot', radius: 800, label: 'Track spot', localState: 'on' }),
    light(8700, 8800, { iconKind: 'spot', radius: 800, label: 'Track spot', localState: 'on' }),
    light(4400, 6600, { iconKind: 'spot', radius: 800, label: 'Track spot', localState: 'on' }),
  ];

  const switches = [
    switchFix(7800, 200, { rotation: 0, label: 'Entrance bank' }),
    switchFix(200, 6600, { rotation: 90, label: 'Stock room' }),
    switchFix(12800, 5000, { rotation: 90, label: 'Lounge' }),
  ];

  // Object-anchored rulers. Both ends lock to WALL objects, so each reports a
  // live CLEAR (inside-face to inside-face) dimension and re-measures itself if
  // the shell is edited: the overall studio width, and the depth of the south
  // vignette bay from the window wall to the living/bedroom divider.
  const rulers = [
    { id: nid('ru'), a: { kind: 'wall', wallId: wWest.id }, b: { kind: 'wall', wallId: wEast.id } },
    { id: nid('ru'), a: { kind: 'wall', wallId: wSouth.id }, b: { kind: 'wall', wallId: wLivingDivider.id } },
  ];

  const motionSensors = [
    {
      id: nid('mo'), x: 2200, y: 2000, heading: 0, fov: 360, range: 4000,
      label: 'Living vignette presence', entity_id: null, color: '#b39ddb',
      avatar: true, demo: true, avatarKinds: ['adult', 'supermodel'],
    },
    {
      id: nid('mo'), x: 6700, y: 9800, heading: 0, fov: 360, range: 4000,
      label: 'Nook presence', entity_id: null, color: '#4db6ac',
      avatar: true, demo: true, avatarKinds: ['professional', 'teen'],
    },
    {
      id: nid('mo'), x: 10300, y: 7300, heading: 0, fov: 360, range: 4000,
      label: 'Lounge presence', entity_id: null, color: '#ffab91',
      avatar: true, demo: true, avatarKinds: ['elder', 'adult'],
    },
  ];

  const envSensors = [
    { id: nid('env'), x: 8500, y: 5300, entity_id: null, kind: 'temperature', label: 'Showroom temp', height: 1500 },
    { id: nid('env'), x: 4600, y: 1200, entity_id: null, kind: 'illuminance', label: 'Window-wall lux', height: 1400 },
  ];

  const safetySensors = [
    { id: nid('sf'), x: 6600, y: 5300, kind: 'smoke', entity_id: null, label: 'Showroom smoke' },
  ];

  const look = { floorTex: 'wood', floorColor: '#c8a878', wallColor: '#f4efe6' };

  const f = floor({
    name: 'Studio Floor', w: W, d: D,
    walls, rooms, doors, windows, furniture, lights, switches,
    motionSensors, envSensors, safetySensors,
    look3d: look,
  });
  // Ruler + dimension display (no lib.mjs helper; both ride repairFloor).
  f.rulers = rulers;
  f.dimensionMode = 'outside';

  const roamers = [
    roamer('Iris', ['supermodel', 'professional'], { color: '#ce93d8' }),
    roamer('Theo', ['adult', 'elder'], { color: '#80cbc4' }),
    roamer('Wren', ['teen', 'adult'], { color: '#ffb74d' }),
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
      '~1,539 sq ft (143 m²) showroom · 1 floor · 6 vignettes — staging & dimensions showcase',
      '',
      'A furniture / interior-design studio whose entire floor is a walk-through catalogue:',
      'six fully-dressed room vignettes with no doors between them. Each vignette is a real',
      'Room — it is closed into a wall loop by INVISIBLE chords (which the nav rasterizer',
      'ignores) and separated visually by short half-wall and railing stubs laid on the same',
      'lines, so sightlines stay open across the whole studio and a shopper can wander from',
      'one staged room straight into the next.',
      '',
      'The south elevation is the window wall: a double-hung, a casement pair, a full-height',
      'slider and a picture window, each dressed with a different curtain treatment and',
      'openness (split drapes half-drawn, a single side drape nearly closed, a roman shade',
      'mostly raised, and open drapes), plus an east double-hung and a bedroom slider.',
      '',
      'Dimension display is switched on: `outside` mode puts CAD dimension lines on every',
      'exterior wall segment plus the overall structure extents, and two rulers anchored to',
      'opposing exterior walls report the clear inside width and depth — anchored to the wall',
      'objects, so they re-measure themselves if the shell is ever edited.',
      '',
      'Living Room Vignette: staged sofa and coffee table on a large rug, an accent chair, a',
      '  styled bookshelf, and a media console with a TV; floor lamp plus recessed cans.',
      'Dining Vignette: a four-chair dining table on a rug with a sideboard under the slider;',
      '  pendant over the table and a tiered chandelier over the sideboard.',
      'Home Office Vignette: a staged desk and chair, two library-wall bookshelves, a filing',
      '  cabinet and a plant; flat round ceiling panel plus an under-cabinet task strip.',
      'Bedroom Vignette: queen bed with matching nightstands, dresser, wardrobe and a bed-end',
      '  bench on a wool rug, lit by a sconce pair flanking the headboard.',
      'Reading Nook & Checkout: two nook shelves, a rocking chair with an ottoman under string',
      '  lights and a jar lantern, and the studio checkout desk.',
      'Fireplace Lounge: a wall-locked hearth with a chaise and a rocking chair drawn up to it,',
      '  a coffee table, a lounge shelf and plants; uplight bowl and a wall sconce.',
      '',
      'Three unbound demo AI-avatar presence sensors (living, nook, lounge) keep a browsing',
      'shopper in each of those vignettes; three roamers wander the whole floor. Temperature',
      'and illuminance env sensors and a smoke detector sit on the circulation spine.',
    ].join('\n'),
  });
}
