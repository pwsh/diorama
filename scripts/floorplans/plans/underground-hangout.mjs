// The Bunker — Underground Hangout. Two floors where the interesting one is
// BELOW ground: a modest backyard shed / single-bay garage at grade, and a big
// neon-lit basement hangout underneath it — home theater, arcade + game zone,
// and a bar lounge.
//
// Floor order is the canonical story order (`Store.floors[0]` = LOWEST), so the
// basement is floors[0] and the shed is floors[1]. A single `stairLinkId`
// ('bunker-l1l2') pairs the two `stairs` pieces — one per floor, same world
// position (12900, 7000) — so avatars transit between the shed and the bunker
// and the glass-house ghost stack registers.
//
// Both floors share the same 14000 × 10000 mm rect so the stories line up; the
// shed simply occupies a small corner of it and the rest of that level is yard.
//
// Everything is UNBOUND — the neon strips, the projector-wall TV, the arcade
// monitors and the bar appliances all carry `localState`, so the plan is alive
// with no Home Assistant attached.
import { floorplan } from '../lib.mjs';

export const id = 'underground-hangout';
export const name = 'The Bunker — Underground Hangout';

const W = 14000, D = 10000;

// Basement shell + the shed footprint, in the SHARED world frame.
const BASE = [800, 800, 13600, 9400];
const SHED = [10200, 5000, 13600, 9400];
const STAIR_X = 12900, STAIR_Y = 7000;

const loop = ([x0, y0, x1, y1]) => [
  { x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }, { x: x0, y: y0 },
];

export function build() {
  const b = floorplan(id);
  const { wall, room, door, win, furn, light, switchFix, roamer, floor, assembleStore, id: nid } = b;

  // ══ BASEMENT (floors[0] — the main event) ════════════════════════════════
  const baseWalls = [
    wall(loop(BASE)),
    wall([{ x: 6200, y: 800 }, { x: 6200, y: 5600 }]),    // theater ↔ lounge
    wall([{ x: 800, y: 5600 }, { x: 6200, y: 5600 }]),    // theater ↔ arcade
    wall([{ x: 6200, y: 5600 }, { x: 6200, y: 9400 }]),   // arcade ↔ lounge
  ];

  const baseRooms = [
    room('Home Theater', 3400, 3000),
    room('Arcade', 3400, 7500),
    room('Bunker Lounge', 9800, 5000),
  ];

  const baseDoors = [
    door(6200, 2200, 270, { w: 1200, label: 'Theater' }),
    door(2000, 5600, 0, { w: 1200, label: 'Arcade' }),
    door(6200, 7000, 270, { w: 1200, label: 'Game room' }),
  ];

  const baseFurniture = [
    // ── Home theater (screen wall = the south wall, seats face −Y) ─────────
    furn('wall_tv', 3400, 850, { rotation: 180, w: 2600, h: 180, elevation: 1400, localState: 'playing', label: 'Projection screen' }),
    furn('center_channel', 3400, 1200, { rotation: 180, elevation: 500 }),
    furn('speaker_tower', 1300, 1200, { rotation: 180 }),
    furn('speaker_tower', 5500, 1200, { rotation: 180 }),
    furn('subwoofer', 1300, 2200, { rotation: 180 }),
    furn('theater_recliner', 2600, 2600, { rotation: 0 }),
    furn('theater_recliner', 4200, 2600, { rotation: 0 }),
    furn('riser_platform', 3400, 4200, { rotation: 0 }),
    furn('recliner_row3', 3400, 4200, { rotation: 0, elevation: 220 }),
    furn('speaker_bookshelf', 1200, 5200, { rotation: 0, elevation: 1600 }),
    furn('speaker_bookshelf', 5600, 5200, { rotation: 0, elevation: 1600 }),
    furn('rug', 3400, 3300, { rotation: 0, w: 4600, h: 3000, color: '#1a1420' }),

    // ── Arcade / game zone ────────────────────────────────────────────────
    furn('cabinet', 1300, 6200, { rotation: 90, label: 'Arcade cabinet', color: '#2b1b46' }),
    furn('cabinet', 1300, 7300, { rotation: 90, label: 'Arcade cabinet', color: '#123a46' }),
    furn('table', 3400, 6900, { rotation: 0, w: 1400, h: 800, label: 'Foosball table', color: '#20303a' }),
    furn('bookshelf', 5800, 6400, { rotation: 90, label: 'Game shelf' }),
    furn('desk', 2000, 8800, { rotation: 180, label: 'Battlestation 1' }),
    furn('chair', 2000, 8100, { rotation: 180 }),
    furn('tv', 2000, 9000, { rotation: 180, w: 700, h: 200, elevation: 750, localState: 'on', label: 'Monitor 1' }),
    furn('desk', 4200, 8800, { rotation: 180, label: 'Battlestation 2' }),
    furn('chair', 4200, 8100, { rotation: 180 }),
    furn('tv', 4200, 9000, { rotation: 180, w: 700, h: 200, elevation: 750, localState: 'on', label: 'Monitor 2' }),
    furn('rug', 3400, 8000, { rotation: 0, w: 2800, h: 1600, color: '#141b26' }),

    // ── Bar lounge ────────────────────────────────────────────────────────
    furn('counter', 9000, 1300, { rotation: 0, w: 3000, h: 700, label: 'Bar', color: '#2a1d16' }),
    furn('stool', 7800, 2100, { rotation: 180 }),
    furn('stool', 8600, 2100, { rotation: 180 }),
    furn('stool', 9400, 2100, { rotation: 180 }),
    furn('stool', 10200, 2100, { rotation: 180 }),
    furn('fridge', 11200, 1300, { rotation: 180, localState: 'on', label: 'Bar fridge' }),
    furn('microwave', 11200, 1300, { rotation: 180, elevation: 1900 }),
    furn('cabinet', 12600, 1200, { rotation: 0, label: 'Glassware' }),
    furn('sofa', 7600, 5000, { rotation: 90 }),
    furn('coffee_table', 8800, 5000, { rotation: 0 }),
    furn('tv_stand', 10600, 5000, { rotation: 270 }),
    furn('tv', 10600, 5000, { rotation: 270, elevation: 550, localState: 'playing', label: 'Lounge TV' }),
    furn('speaker_tower', 10600, 3800, { rotation: 270 }),
    furn('speaker_tower', 10600, 6200, { rotation: 270 }),
    furn('rug', 9000, 5000, { rotation: 0, w: 3200, h: 2600, color: '#181d2a' }),
    furn('bookshelf', 13200, 3000, { rotation: 90, label: 'Vinyl wall' }),
    furn('plant', 12800, 8600, { rotation: 0 }),
    furn('stairs', STAIR_X, STAIR_Y, { rotation: 0, w: 1000, h: 3600, stairLinkId: 'bunker-l1l2' }),
  ];

  // Saturated neon — the whole point of the room. Every fixture is unbound with
  // localState 'on', so the basement glows at the `night` preset out of the box.
  const baseLights = [
    light(3400, 1500, { iconKind: 'strip', rotation: 0, length: 3400, color: '#ff2d95', label: 'Screen wall neon', localState: 'on', radius: 1800 }),
    light(900, 3200, { iconKind: 'strip', rotation: 90, length: 3600, color: '#7c4dff', label: 'Theater cove W', localState: 'on', radius: 1400 }),
    light(6100, 3200, { iconKind: 'strip', rotation: 90, length: 3600, color: '#7c4dff', label: 'Theater cove E', localState: 'on', radius: 1400 }),
    light(3400, 2400, { iconKind: 'recessed', label: 'Theater can', radius: 1200 }),
    light(900, 7500, { iconKind: 'strip', rotation: 90, length: 3400, color: '#00e5ff', label: 'Arcade neon W', localState: 'on', radius: 1500 }),
    light(3400, 6900, { iconKind: 'pendant', color: '#ffd54f', label: 'Foosball pendant', localState: 'on', height: 2100, radius: 1400 }),
    light(3100, 9200, { iconKind: 'string', rotation: 0, length: 4200, color: '#39ff88', label: 'Battlestation string', localState: 'on' }),
    light(9000, 1000, { iconKind: 'under_cabinet', rotation: 0, length: 2900, color: '#7c4dff', label: 'Bar under-shelf', localState: 'on' }),
    light(9000, 2200, { iconKind: 'strip', rotation: 0, length: 3200, color: '#ff6d00', label: 'Bar rail neon', localState: 'on', radius: 1600 }),
    light(7300, 6400, { iconKind: 'lamp', height: 1500, color: '#ff6d00', label: 'Lava lamp', localState: 'on', radius: 900 }),
    light(11800, 5000, { iconKind: 'lamp', height: 1500, color: '#00e676', label: 'Lava lamp 2', localState: 'on', radius: 900 }),
    light(12600, 8200, { iconKind: 'sconce', color: '#ff2d95', label: 'Stair sconce', localState: 'on', radius: 700 }),
    light(9800, 7600, { iconKind: 'bowl', label: 'Lounge uplight', localState: 'on', radius: 1600 }),
  ];

  const baseSwitches = [
    switchFix(6100, 2900, { rotation: 90, label: 'Theater' }),
    switchFix(6100, 7700, { rotation: 90, label: 'Arcade' }),
    switchFix(12500, 5800, { rotation: 270, label: 'Stair' }),
  ];

  // Demo AI presences — one per basement room, always on, home-room confined.
  const baseMotion = [
    {
      id: nid('mo'), x: 3400, y: 3400, heading: 0, fov: 360, range: 5000,
      label: 'Theater presence', entity_id: null, color: '#ff2d95', plumbobColor: '#ff80ab',
      avatar: true, demo: true, avatarKinds: ['teen', 'movie_star'],
    },
    {
      id: nid('mo'), x: 3400, y: 7600, heading: 0, fov: 360, range: 5000,
      label: 'Arcade presence', entity_id: null, color: '#00e5ff', plumbobColor: '#84ffff',
      avatar: true, demo: true, avatarKinds: ['hacker', 'tech_expert'],
    },
    {
      id: nid('mo'), x: 9800, y: 4000, heading: 0, fov: 360, range: 6000,
      label: 'Lounge presence', entity_id: null, color: '#ffab40', plumbobColor: '#ffd180',
      avatar: true, demo: true, avatarKinds: ['adult', 'ninja', 'athlete'],
    },
  ];

  const baseEnv = [
    { id: nid('env'), x: 3400, y: 5300, entity_id: null, kind: 'temperature', label: 'Theater temp', height: 1500 },
    { id: nid('env'), x: 9800, y: 8800, entity_id: null, kind: 'co2', label: 'Bunker CO₂', height: 1500 },
    { id: nid('env'), x: 5900, y: 8900, entity_id: null, kind: 'humidity', label: 'Bunker RH', height: 1500 },
  ];

  const baseSafety = [
    { id: nid('sf'), x: 9800, y: 2600, kind: 'smoke', entity_id: null, label: 'Bar smoke' },
    { id: nid('sf'), x: 3400, y: 4900, kind: 'co', entity_id: null, label: 'Theater CO' },
  ];

  const basement = floor({
    name: 'The Bunker', w: W, d: D,
    walls: baseWalls, rooms: baseRooms, doors: baseDoors, windows: [],
    furniture: baseFurniture, lights: baseLights, switches: baseSwitches,
    motionSensors: baseMotion, envSensors: baseEnv, safetySensors: baseSafety,
    look3d: { floorTex: 'concrete', floorColor: '#2b2f38', wallColor: '#1e222b' },
    roamers: [
      roamer('Rae', ['hacker', 'teen'], { color: '#ff2d95' }),
      roamer('Jonas', ['adult', 'athlete'], { color: '#00e5ff' }),
      roamer('Nix', ['ninja', 'tech_expert'], { color: '#39ff88' }),
    ],
  });

  // ══ SHED / GARAGE (floors[1] — grade level) ══════════════════════════════
  const shedWalls = [wall(loop(SHED))];

  const shedRooms = [room('Shed / Garage', 11400, 6600)];

  const shedDoors = [
    door(10800, 5000, 0, { w: 2400, kind: 'garage', label: 'Bay door' }),
    door(10200, 8200, 270, { w: 800, label: 'Side door' }),
  ];

  const shedWindows = [
    win(13600, 6400, 90, { w: 1000, sill: 1200, height: 900, label: 'Shed east' }),
  ];

  const shedFurniture = [
    furn('stairs', STAIR_X, STAIR_Y, { rotation: 180, w: 1000, h: 3600, stairLinkId: 'bunker-l1l2' }),
    furn('desk', 11600, 8800, { rotation: 180, label: 'Workbench' }),
    furn('chair', 11600, 8100, { rotation: 180 }),
    furn('cabinet', 10800, 6200, { rotation: 90, label: 'Parts cabinet' }),
    furn('bookshelf', 10500, 7400, { rotation: 90, label: 'Tool shelves' }),
    furn('trash_bin', 12000, 6000, { rotation: 0 }),
  ];

  const shedLights = [
    light(11800, 7400, { iconKind: 'strip', rotation: 0, length: 2600, label: 'Shop light', localState: 'on', radius: 2000 }),
    light(11600, 8600, { iconKind: 'under_cabinet', rotation: 0, length: 1400, label: 'Bench task light', localState: 'on' }),
    light(12800, 5300, { iconKind: 'flood', rotation: 180, label: 'Bay floodlight', radius: 2000 }),
  ];

  const shedSwitches = [
    switchFix(10300, 8500, { rotation: 90, label: 'Shed' }),
  ];

  const shedSafety = [
    { id: nid('sf'), x: 11600, y: 6800, kind: 'co', entity_id: null, label: 'Shed CO' },
  ];

  const shed = floor({
    name: 'Shed (grade)', w: W, d: D,
    walls: shedWalls, rooms: shedRooms, doors: shedDoors, windows: shedWindows,
    furniture: shedFurniture, lights: shedLights, switches: shedSwitches,
    safetySensors: shedSafety,
    look3d: { floorTex: 'concrete', floorColor: '#54595f', wallColor: '#6b6255' },
    roamers: [roamer('Toby', ['farmer', 'adult'], { color: '#ffab40' })],
  });

  return assembleStore({
    name,
    floors: [basement, shed],
    scene3d: {
      preset: 'night', lightMode: 'manual',
      floorTex: 'concrete', floorColor: '#2b2f38', wallColor: '#1e222b',
      glassHouse: false, wallCutaway: true, plumbobs: true,
      cinematicOrbit: true, skyBackdrop: false,
    },
    notes: [
      '~112 m² basement + ~13 m² shed · 2 floors · 4 rooms · after-dark hangout',
      '',
      'The house is beside the point — this plan is about what is UNDER the yard. At',
      'grade there is only a modest single-bay shed/garage: a bay door, a side door, a',
      'workbench, tool shelves and a parts cabinet. In the corner of it, a stair drops',
      'into a 12.8 × 8.6 m concrete bunker that fills the whole lot, and that is where',
      'everyone actually is. Store.floors order puts the basement FIRST (index 0 is the',
      'lowest story) and a single stairLinkId pairs the two flights at the same world',
      'position, so avatars really do transit between the levels.',
      '',
      'HOME THEATER (south-west) — a full projection wall with a wall-mounted screen,',
      'centre channel, two tower speakers, a subwoofer, and rear bookshelf surrounds',
      'mounted high on the back wall. Two front-row recliners sit on the floor; a',
      'three-seat recliner row rides a 220 mm riser platform behind them (the riser is',
      'walkable terrain, so avatars climb up to their seats). Magenta and violet cove',
      'strips wash the walls.',
      '',
      'ARCADE / GAME ZONE (north-west) — two upright arcade cabinets against the west',
      'wall under a cyan neon run, a foosball table under a warm pendant, a game shelf,',
      'and two battlestations (desk + chair + monitor) along the back wall under a green',
      'LED string.',
      '',
      'BUNKER LOUNGE (east) — a 3 m bar with four stools, a bar fridge with an',
      'over-counter microwave and a glassware cabinet, all lit by violet under-shelf LEDs',
      'and an orange rail strip. The seating half has an L-facing sofa, coffee table, a',
      'wall TV on a stand flanked by tower speakers, a vinyl-record shelf, two lava',
      'lamps, and the stair up to the shed under a magenta sconce.',
      '',
      'LIGHTING — the scene runs at the `night` preset with glass-house OFF and wall',
      'cutaway ON, so the camera can see into the bunker while the neon carries the',
      'whole room. Every light is UNBOUND with localState "on", so nothing needs Home',
      'Assistant. Demo AI presences live in each of the three basement rooms (confined to',
      'their room), plus three free-range roamers downstairs and one in the shed.',
    ].join('\n'),
  });
}
