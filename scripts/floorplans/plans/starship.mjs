// SSV Diorama — Starship Deck. A single-level 15.6 × 9.6 m plan whose "house" is
// an elongated ship HULL: a flat stern to the west, two long parallel flanks, and
// an angular bow built from six short wall segments to the east. Inside, a
// full-length central corridor spine links eight compartments —
//
//   Engineering · Cargo Hold · Crew Quarters · Mess Hall · Med Bay · Airlock ·
//   Main Corridor · Bridge
//
// Two things this plan exercises that no other floorplan does:
//   • CUSTOM OBJECTS — `Store.customObjects` carries two authored recipes (a
//     stacked-cylinder warp core and a console bank) placed as real furniture.
//   • A FRANCHISE AVATAR PACK — `Store.avatarPacks` loads + activates
//     `star-trek-tng` (franchise packs ship UNLOADED by default), so its
//     namespaced members are resolvable in the bridge-crew roamer pools. Every
//     other crew avatar comes from the always-on base packs (Sci-Fi, Robotic,
//     Aliens, Careers).
//
// The airlock is a real double-door lock: an inner hatch onto the corridor and an
// outer hatch through the port hull.
import { floorplan } from '../lib.mjs';

export const id = 'starship';
export const name = 'SSV Diorama — Starship Deck';

const W = 15600, D = 9600;

// Hull outline — stern flat at x = 800, flanks at y = 2000 / 7600, and a
// six-segment angular bow converging on the apex at (14400, 4800).
const HULL = [
  { x: 800, y: 2000 }, { x: 800, y: 7600 },
  { x: 11000, y: 7600 }, { x: 12200, y: 7200 }, { x: 13200, y: 6500 },
  { x: 14000, y: 5600 }, { x: 14400, y: 4800 },
  { x: 14000, y: 4000 }, { x: 13200, y: 3100 }, { x: 12200, y: 2400 },
  { x: 11000, y: 2000 }, { x: 800, y: 2000 },
];

export function build() {
  const b = floorplan(id);
  const { wall, room, door, win, furn, light, switchFix, roamer, floor, assembleStore, id: nid } = b;

  // ── Structure ────────────────────────────────────────────────────────────
  const walls = [
    wall(HULL),
    wall([{ x: 800, y: 4200 }, { x: 11000, y: 4200 }]),    // corridor, starboard side
    wall([{ x: 800, y: 5600 }, { x: 11000, y: 5600 }]),    // corridor, port side
    wall([{ x: 11000, y: 2000 }, { x: 11000, y: 7600 }]),  // bridge bulkhead
    wall([{ x: 4400, y: 2000 }, { x: 4400, y: 4200 }]),    // engineering ↔ crew
    wall([{ x: 4400, y: 5600 }, { x: 4400, y: 7600 }]),    // cargo ↔ mess
    wall([{ x: 7600, y: 2000 }, { x: 7600, y: 4200 }]),    // crew ↔ med bay
    wall([{ x: 7600, y: 5600 }, { x: 7600, y: 7600 }]),    // mess ↔ airlock
  ];

  const rooms = [
    room('Engineering', 2400, 3100),
    room('Cargo Hold', 2400, 6600),
    room('Crew Quarters', 6000, 3100),
    room('Mess Hall', 6000, 6600),
    room('Med Bay', 9300, 3100),
    room('Airlock', 9300, 6600),
    room('Main Corridor', 5900, 4900),
    room('Bridge', 12600, 4800),
  ];

  const doors = [
    door(1800, 4200, 0, { w: 1200, label: 'Engineering hatch' }),
    door(5400, 4200, 0, { w: 1200, label: 'Crew hatch' }),
    door(8600, 4200, 0, { w: 1200, label: 'Med Bay hatch' }),
    door(1800, 5600, 0, { w: 1400, label: 'Cargo hatch' }),
    door(4500, 5600, 0, { w: 1200, label: 'Mess hatch' }),
    door(8600, 5600, 0, { w: 1200, label: 'Airlock inner door' }),
    door(9200, 7600, 0, { w: 1200, label: 'Airlock outer hatch' }),
    door(11000, 4400, 270, { w: 1000, label: 'Bridge hatch' }),
  ];

  // Viewports: six raked panes around the bow + four flank ports.
  const windows = [
    win(12700, 6850, 35, { w: 900, sill: 900, height: 1300, kind: 'picture', label: 'Bow port P3' }),
    win(13600, 6050, 48, { w: 900, sill: 900, height: 1300, kind: 'picture', label: 'Bow port P2' }),
    win(14200, 5200, 63, { w: 700, sill: 900, height: 1300, kind: 'picture', label: 'Bow port P1' }),
    win(14200, 4400, 297, { w: 700, sill: 900, height: 1300, kind: 'picture', label: 'Bow port S1' }),
    win(13600, 3550, 312, { w: 900, sill: 900, height: 1300, kind: 'picture', label: 'Bow port S2' }),
    win(12700, 2750, 325, { w: 900, sill: 900, height: 1300, kind: 'picture', label: 'Bow port S3' }),
    win(2200, 7600, 0, { w: 1200, sill: 1100, height: 900, kind: 'picture', label: 'Cargo viewport' }),
    win(5400, 7600, 0, { w: 1400, sill: 1100, height: 900, kind: 'picture', label: 'Mess viewport' }),
    win(5400, 2000, 0, { w: 1400, sill: 1100, height: 900, kind: 'picture', label: 'Crew viewport' }),
    win(9300, 2000, 0, { w: 1200, sill: 1100, height: 900, kind: 'picture', label: 'Med Bay viewport' }),
  ];

  // ── Custom objects (Store.customObjects) ─────────────────────────────────
  // Recipe primitives are local mm; origin = piece centre at floor level,
  // +Z = the front face. Colors are plain bright hexes — recipes have no
  // emissive channel, so "glowing" reads as saturated cyan against the dark
  // toon-shaded hull.
  const customObjects = [
    {
      id: 'ssv-warp-core', label: 'Warp core', w: 1200, h: 1200, ht: 2600,
      back: 'none', color: 0x26c6da, frontArrow: false,
      primitives: [
        { shape: 'cylinder', size: [500, 570, 220], pos: [0, 110, 0], color: '#37474f' },
        { shape: 'cylinder', size: [300, 300, 1900], pos: [0, 1160, 0], color: '#26c6da' },
        { shape: 'cylinder', size: [430, 430, 150], pos: [0, 620, 0], color: '#80deea' },
        { shape: 'cylinder', size: [430, 430, 150], pos: [0, 1220, 0], color: '#80deea' },
        { shape: 'cylinder', size: [430, 430, 150], pos: [0, 1820, 0], color: '#80deea' },
        { shape: 'cylinder', size: [300, 470, 350], pos: [0, 2285, 0], color: '#455a64' },
        { shape: 'sphere', size: [180, 0, 0], pos: [0, 2520, 0], color: '#e0f7fa' },
      ],
    },
    {
      id: 'ssv-console', label: 'Console bank', w: 1600, h: 700, ht: 1100,
      back: 'none', color: 0x2b333d, frontArrow: true,
      primitives: [
        { shape: 'box', size: [1600, 880, 700], pos: [0, 440, 0], color: '#2b333d' },
        { shape: 'box', size: [1520, 70, 640], pos: [0, 915, 0], color: '#3d4854' },
        { shape: 'box', size: [1400, 420, 70], pos: [0, 1010, 250], rot: [22, 0, 0], color: '#0d1b2a' },
        { shape: 'box', size: [1280, 320, 24], pos: [0, 1020, 290], rot: [22, 0, 0], color: '#4dd0e1' },
        { shape: 'box', size: [280, 140, 24], pos: [-570, 950, 356], color: '#ffca28' },
        { shape: 'box', size: [280, 140, 24], pos: [570, 950, 356], color: '#ff7043' },
      ],
    },
  ];

  const custom = (recipeId, x, y, opts = {}) => ({
    ...furn('block', x, y, opts), customKindId: recipeId,
  });

  // ── Furniture ────────────────────────────────────────────────────────────
  const furniture = [
    // ── Engineering (stern, starboard) ─────────────────────────────────────
    custom('ssv-warp-core', 2000, 2900, { w: 1200, h: 1200, label: 'Warp core' }),
    custom('ssv-console', 3400, 2500, { rotation: 0, w: 1600, h: 700, label: 'Reactor console' }),
    furn('cabinet', 1150, 2600, { rotation: 270, label: 'Spares locker' }),
    furn('bookshelf', 4150, 3400, { rotation: 90, label: 'Data racks' }),

    // ── Cargo Hold (stern, port) ───────────────────────────────────────────
    furn('block', 1400, 6800, { w: 1000, h: 1000, label: 'Cargo crate', color: '#4b5560' }),
    furn('block', 2800, 7000, { w: 1600, h: 1000, label: 'Cargo crate', color: '#55606c' },),
    furn('block', 3950, 6200, { w: 700, h: 1000, label: 'Supply pod', color: '#3f4954' }),

    // ── Crew Quarters (starboard) ──────────────────────────────────────────
    furn('bed_twin', 5100, 3050, { rotation: 0, w: 900, h: 1900, label: 'Bunk 1', sharedBedCovers: false }),
    furn('bed_twin', 6400, 3050, { rotation: 0, w: 900, h: 1900, label: 'Bunk 2', sharedBedCovers: false }),
    furn('dresser', 7250, 2750, { rotation: 90, label: 'Crew lockers' }),
    furn('chair', 7250, 3800, { rotation: 0 }),
    furn('rug', 5750, 3000, { rotation: 0, w: 2600, h: 1600, color: '#1b2430' }),

    // ── Mess Hall (port) ───────────────────────────────────────────────────
    furn('table', 5300, 6700, { rotation: 0, w: 1200, h: 800, label: 'Mess table' }),
    furn('bench', 5250, 7350, { rotation: 0 }),
    furn('chair', 6200, 6700, { rotation: 0 }),
    furn('fridge', 7000, 7150, { rotation: 0, localState: 'on', label: 'Galley cooler' }),
    furn('microwave', 7000, 7150, { rotation: 0, elevation: 1900, label: 'Rehydrator' }),
    furn('kitchen_sink', 7250, 6250, { rotation: 90, label: 'Galley sink' }),

    // ── Med Bay (starboard) ────────────────────────────────────────────────
    furn('bed_twin', 9200, 3000, { rotation: 90, label: 'Med bunk', sharedBedCovers: false }),
    furn('cabinet', 7900, 2600, { rotation: 270, label: 'Pharmacy' }),
    furn('cabinet', 10500, 2600, { rotation: 90, label: 'Instruments' }),
    furn('sink', 10300, 3800, { rotation: 0, label: 'Scrub sink' }),
    furn('tv', 9800, 2400, { rotation: 180, w: 700, h: 200, elevation: 1500, localState: 'on', label: 'Vitals display' }),

    // ── Airlock (port) — deliberately empty apart from the suit lockers ────
    furn('cabinet', 7900, 6600, { rotation: 270, label: 'EVA suit locker' }),
    furn('cabinet', 10700, 6600, { rotation: 90, label: 'EVA suit locker' }),
    furn('speaker_bookshelf', 9300, 7450, { rotation: 180, elevation: 1900, label: 'Lock intercom' }),

    // ── Bridge (bow) ───────────────────────────────────────────────────────
    furn('wall_tv', 14100, 4800, { rotation: 90, w: 1000, h: 180, elevation: 1200, localState: 'playing', label: 'Main viewscreen' }),
    furn('theater_recliner', 12500, 4900, { rotation: 270, label: "Captain's chair" }),
    custom('ssv-console', 12300, 3500, { rotation: 0, w: 1600, h: 700, label: 'Helm console' }),
    custom('ssv-console', 12200, 6200, { rotation: 180, w: 1600, h: 700, label: 'Ops console' }),
    custom('ssv-console', 13500, 4900, { rotation: 270, w: 1200, h: 600, label: 'Tactical console' }),
    furn('speaker_bookshelf', 11200, 3000, { rotation: 270, elevation: 1500, label: 'Comms' }),
    furn('speaker_bookshelf', 11200, 6600, { rotation: 270, elevation: 1500, label: 'Comms' }),
    furn('rug', 12300, 4900, { rotation: 0, w: 2400, h: 2400, color: '#141c26' }),
  ];

  // ── Lights — strip lighting everywhere, colored accents per compartment ──
  const lights = [
    light(5900, 4900, { iconKind: 'strip', rotation: 0, length: 9600, color: '#b3e5fc', label: 'Corridor spine', localState: 'on', radius: 2200 }),
    light(2000, 4400, { iconKind: 'step', label: 'Corridor step W', localState: 'on' }),
    light(9600, 4400, { iconKind: 'step', label: 'Corridor step E', localState: 'on' }),
    light(2000, 3100, { iconKind: 'strip', rotation: 0, length: 2600, color: '#26c6da', label: 'Reactor glow', localState: 'on', radius: 2000 }),
    light(3600, 2300, { iconKind: 'under_cabinet', rotation: 0, length: 1600, color: '#ffca28', label: 'Console task', localState: 'on' }),
    light(2400, 6600, { iconKind: 'strip', rotation: 0, length: 3000, color: '#cfd8dc', label: 'Cargo bay', localState: 'on', radius: 2000 }),
    light(6000, 3100, { iconKind: 'strip', rotation: 90, length: 1800, color: '#7c4dff', label: 'Bunk night strip', localState: 'on', radius: 1200 }),
    light(5900, 6600, { iconKind: 'round', label: 'Mess overhead', localState: 'on', radius: 2000 }),
    light(6600, 7400, { iconKind: 'under_cabinet', rotation: 0, length: 1600, color: '#ffe082', label: 'Galley task', localState: 'on' }),
    light(9300, 3100, { iconKind: 'strip', rotation: 0, length: 2600, color: '#e0f7fa', label: 'Med bay clinical', localState: 'on', radius: 2000 }),
    light(9300, 6600, { iconKind: 'strip', rotation: 0, length: 2600, color: '#ff7043', label: 'Airlock warning', localState: 'on', radius: 1800 }),
    light(12600, 4800, { iconKind: 'recessed', label: 'Bridge overhead', localState: 'on', radius: 2600 }),
    light(12300, 6600, { iconKind: 'strip', rotation: 35, length: 2400, color: '#4dd0e1', label: 'Bridge cove P', localState: 'on', radius: 1600 }),
    light(12300, 3000, { iconKind: 'strip', rotation: 325, length: 2400, color: '#4dd0e1', label: 'Bridge cove S', localState: 'on', radius: 1600 }),
  ];

  const switches = [
    switchFix(1900, 4300, { rotation: 0, label: 'Engineering' }),
    switchFix(5300, 4300, { rotation: 0, label: 'Crew' }),
    switchFix(8500, 5500, { rotation: 180, label: 'Airlock' }),
    switchFix(11100, 5200, { rotation: 90, label: 'Bridge' }),
  ];

  // ── Crew (demo AI presences, one per key compartment) ────────────────────
  const motionSensors = [
    {
      id: nid('mo'), x: 12000, y: 4900, heading: 0, fov: 360, range: 6000,
      label: 'Bridge watch', entity_id: null, color: '#4dd0e1', plumbobColor: '#80deea',
      avatar: true, demo: true, avatarKinds: ['astronaut', 'space-marine'],
    },
    {
      id: nid('mo'), x: 2600, y: 3600, heading: 0, fov: 360, range: 5000,
      label: 'Engineering watch', entity_id: null, color: '#ffca28', plumbobColor: '#ffe082',
      avatar: true, demo: true, avatarKinds: ['robot', 'sleek-android', 'tech_expert'],
    },
    {
      id: nid('mo'), x: 9300, y: 3600, heading: 0, fov: 360, range: 5000,
      label: 'Med Bay watch', entity_id: null, color: '#e0f7fa', plumbobColor: '#b2ebf2',
      avatar: true, demo: true, avatarKinds: ['doctor', 'nurse'],
    },
    {
      id: nid('mo'), x: 6000, y: 6200, heading: 0, fov: 360, range: 5000,
      label: 'Mess watch', entity_id: null, color: '#a5d6a7', plumbobColor: '#c8e6c9',
      avatar: true, demo: true, avatarKinds: ['alien', 'martian', 'grey-alien'],
    },
  ];

  const envSensors = [
    { id: nid('env'), x: 2000, y: 3900, entity_id: null, kind: 'temperature', label: 'Reactor temp', height: 1500 },
    { id: nid('env'), x: 9300, y: 6100, entity_id: null, kind: 'pressure', label: 'Lock pressure', height: 1500 },
    { id: nid('env'), x: 5900, y: 5000, entity_id: null, kind: 'co2', label: 'Life support CO₂', height: 1500 },
    { id: nid('env'), x: 6000, y: 3600, entity_id: null, kind: 'humidity', label: 'Berth RH', height: 1500 },
    { id: nid('env'), x: 12600, y: 5400, entity_id: null, kind: 'radon', label: 'Hull radiation', height: 1500 },
  ];

  const safetySensors = [
    { id: nid('sf'), x: 2600, y: 2400, kind: 'smoke', entity_id: null, label: 'Reactor smoke' },
    { id: nid('sf'), x: 6200, y: 7200, kind: 'co', entity_id: null, label: 'Galley CO' },
    { id: nid('sf'), x: 9300, y: 7000, kind: 'gas', entity_id: null, label: 'Lock gas' },
  ];

  const alarmPanels = [
    { id: nid('ap'), x: 11060, y: 5000, rotation: 90, entity_id: null, label: 'Bridge alert panel', allowControl: true },
  ];

  const cameras = [
    { id: nid('cam'), x: 5900, y: 4300, rotation: 90, fov: 100, range: 11000, height: 2400, entity_id: null, label: 'Corridor cam' },
    { id: nid('cam'), x: 9300, y: 7500, rotation: 180, fov: 90, range: 5000, height: 2400, entity_id: null, label: 'Airlock cam' },
  ];

  const f = floor({
    name: 'Deck 1', w: W, d: D,
    walls, rooms, doors, windows, furniture, lights, switches,
    motionSensors, envSensors, safetySensors, alarmPanels, cameras,
    look3d: { floorTex: 'concrete', floorColor: '#2e3540', wallColor: '#39424e' },
  });

  const roamers = [
    roamer('Captain', ['star-trek-tng/captain-bald', 'star-trek-tng/commander-bearded'], { color: '#e53935' }),
    roamer('Ops officer', ['star-trek-tng/android-officer', 'star-trek-tng/engineer-visor'], { color: '#ffb300' }),
    roamer('Science officer', ['scientist', 'cyborg'], { color: '#4dd0e1' }),
    roamer('Deck hand', ['adult', 'professional', 'retro-spaceman'], { color: '#90a4ae' }),
  ];

  return assembleStore({
    name,
    floors: [f],
    customObjects,
    // Franchise packs ship UNLOADED — opt this one in so the bridge-crew roamer
    // pools above resolve instead of falling back to core 'adult'.
    avatarPacks: {
      'star-trek-tng': { loaded: true, active: true },
    },
    scene3d: {
      preset: 'night', lightMode: 'manual',
      floorTex: 'concrete', floorColor: '#2e3540', wallColor: '#39424e',
      glassHouse: false, wallCutaway: true, plumbobs: true,
      skyBackdrop: true, cinematicOrbit: true, belowHorizon: true,
    },
    roamers,
    notes: [
      '~78 m² pressurised deck (15.6 × 9.6 m hull) · 1 floor · 8 compartments · crewed',
      '',
      'A starship deck instead of a house. The "building" is a hull outline: a flat',
      'stern to the west, two long parallel flanks, and an angular bow assembled from',
      'six short wall segments converging on an apex — the classic wedge silhouette,',
      'drawn entirely with ordinary walls. A full-length central corridor runs the spine',
      'of the ship and every compartment hatches onto it, so the whole deck is one',
      'connected walkable space (and one nav region).',
      '',
      'BRIDGE (bow) — the captain\'s chair faces a wall-mounted main viewscreen at the',
      'apex, flanked by three console banks (helm, ops, tactical) arranged in an arc,',
      'comm speakers on the bulkhead, and six raked picture-window viewports wrapped',
      'around the bow so the sky backdrop reads as space through the glass.',
      'ENGINEERING (stern, starboard) — a stacked-cylinder warp core glowing cyan under',
      '  a reactor console, spares locker and data racks.',
      'CARGO HOLD (stern, port) — three crates and a supply pod under plain bay lighting,',
      '  with a viewport onto the flank.',
      'CREW QUARTERS (starboard) — two bunks in niches with a violet night strip, crew',
      '  lockers and a chair.',
      'MESS HALL (port) — mess table with a bench and a chair, galley cooler with an',
      '  over-counter rehydrator, and a galley sink under warm task lighting.',
      'MED BAY (starboard) — a med bunk, pharmacy and instrument cabinets, a scrub sink,',
      '  and a wall-mounted vitals display under clinical white strips.',
      'AIRLOCK (port) — deliberately bare: two EVA suit lockers, an intercom, an amber',
      '  warning strip, and a genuine DOUBLE door — an inner hatch onto the corridor and',
      '  an outer hatch through the port hull.',
      '',
      'CUSTOM OBJECTS — the warp core (base, glowing column, three light rings, cap and',
      'a bright crown sphere) and the console bank (body, lip, raked screen bezel, a lit',
      'screen face and two indicator panels) are authored ObjectRecipes carried in',
      'Store.customObjects; the console bank is instanced four times at three sizes.',
      '',
      'AVATARS — the deck crew are demo AI presences confined to their compartments',
      '(bridge watch, engineering watch, med bay watch, mess watch) drawn from the',
      'always-on base packs (Sci-Fi, Robotic, Aliens, Careers). The four free-range',
      'roamers include a bridge command pair drawn from the `star-trek-tng` FRANCHISE',
      'pack — franchise packs ship unloaded, so this config also sets Store.avatarPacks',
      'to load and activate it.',
      '',
      'LIGHTING — night preset, concrete deck plating, wall cutaway on and below-horizon',
      'orbit enabled so the camera can duck under the hull. Every fixture is UNBOUND',
      'with localState "on", so the ship is lit with no Home Assistant attached.',
    ].join('\n'),
  });
}
