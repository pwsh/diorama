// Ground Vehicles ▸ Fiction — builtin FRANCHISE pack, default UNLOADED (opt-in
// via Settings ▸ Vehicles). Dynamic-import only.
//
// First wave from docs/research/vehicle-model-library.md §3.7. IP posture
// (§5.3): every user-visible label is DESCRIPTIVE-GENERIC — these are shape-family
// homages, and no franchise name, character name or proper noun may ever appear
// in a shipped string (ids are non-franchise too). Do not "helpfully" rename
// these to the source works.
// Model-local frame: −Z = nose, y = 0 = ground, origin = footprint centre.
import type { VehiclePackDef } from '../vehicles.js';
import { box, cyl, sph, lamps, wheels4 } from './prims.js';

const AMBER = '#ffe9b0';
const RED = '#c62828';

const pack: VehiclePackDef = {
  id: 'franchise-ground-fiction', version: 1, label: 'Fiction',
  path: ['Ground Vehicles', 'Fiction'], builtin: true, franchise: true,
  models: [
    // ── Chrome time-traveling sports car ─────────────────────────────────────
    // Cues: brushed-steel wedge, raised GULLWING doors, glowing rear vent stack.
    {
      id: 'franchise-ground-fiction/time_machine_car',
      label: 'Chrome time-traveling sports car', category: 'ground',
      era: 'contemporary', lenMm: 4270, dims: [1850, 4270, 1140],
      body: '#b9bec4', accent: '#7f8a95', surfaces: ['ground'],
      prims: [
        box([1780, 420, 4160], [0, 420, 0], 'body'),            // low wedge body
        box([1700, 180, 1500], [0, 660, -1250], 'body', [-6, 0, 0]),   // wedge nose deck
        box([1500, 380, 1500], [0, 800, 320], 'body'),          // cabin core
        box([1560, 260, 1300], [0, 880, 300], 'glass'),         // wraparound glass
        box([700, 90, 1100], [-620, 1130, 250], 'body', [0, 0, -32]),  // gullwing door L (raised)
        box([700, 90, 1100], [620, 1130, 250], 'body', [0, 0, 32]),    // gullwing door R (raised)
        box([1300, 300, 420], [0, 800, 1620], 'accent'),        // rear vent stack
        box([1100, 120, 90], [0, 900, 1860], '#7fd8ff'),        // rear glow bar
        box([1600, 130, 90], [0, 340, -2120], 'accent'),        // front spoiler
        ...lamps(560, 620, -2110, AMBER, [300, 110, 50]),
        ...lamps(600, 780, 2110, RED, [220, 130, 50]),
        ...wheels4(1600, -1320, 1350, 300, 250),
      ],
    },

    // ── Black armored superhero car ──────────────────────────────────────────
    // Cues: very long very low BLACK wedge, a big exposed rear turbine, tail fins.
    {
      id: 'franchise-ground-fiction/armored_hero_car',
      label: 'Black armored superhero car', category: 'ground',
      era: 'contemporary', lenMm: 5500, dims: [2400, 5500, 1300],
      body: '#101215', accent: '#2b3138', surfaces: ['ground'],
      prims: [
        box([2280, 420, 5300], [0, 380, 0], 'body'),            // long low hull
        box([1700, 300, 2200], [0, 720, -1500], 'body', [-7, 0, 0]),   // pointed nose deck
        box([1500, 420, 1500], [0, 860, 500], 'body'),          // cockpit pod
        box([1380, 280, 1250], [0, 940, 480], 'glass'),         // canopy glass
        cyl([420, 420, 900], [0, 780, 2050], 'accent', [90, 0, 0]),    // rear turbine
        cyl([300, 300, 300], [0, 780, 2560], '#ff7a2f'),        // turbine glow (afterburner)
        box([120, 620, 1400], [-1010, 830, 1500], 'body', [0, 0, -12]),  // tail fin L
        box([120, 620, 1400], [1010, 830, 1500], 'body', [0, 0, 12]),    // tail fin R
        box([1900, 140, 120], [0, 300, -2680], 'accent'),       // splitter
        ...lamps(680, 560, -2660, AMBER, [260, 100, 50]),
        ...wheels4(2000, -1700, 1750, 340, 380),
      ],
    },

    // ── Talking black muscle car with a scanning light ───────────────────────
    // Cues: black T-top coupe + a wide RED SCANNING BAR across the nose.
    {
      id: 'franchise-ground-fiction/scanner_muscle_car',
      label: 'Talking black muscle car with a scanning light', category: 'ground',
      era: 'contemporary', lenMm: 5000, dims: [1850, 5000, 1270],
      body: '#0d0e10', accent: '#c0392b', surfaces: ['ground'],
      prims: [
        box([1800, 480, 4820], [0, 440, 0], 'body'),            // body
        box([1740, 220, 1700], [0, 760, -1500], 'body'),        // long flat hood
        box([1740, 200, 1200], [0, 760, 1900], 'body'),         // short rear deck
        box([1520, 420, 1900], [0, 950, 200], 'body'),          // cabin
        box([1580, 280, 1700], [0, 1010, 200], 'glass'),        // glass band
        box([1560, 110, 90], [0, 800, -2380], 'accent'),        // SCANNING BAR (nose)
        box([1620, 130, 100], [0, 400, -2450], '#2b3138'),      // front bumper
        box([1620, 130, 100], [0, 400, 2450], '#2b3138'),       // rear bumper
        ...lamps(600, 800, 2470, RED, [230, 140, 50]),
        ...wheels4(1620, -1600, 1560, 330, 280),
      ],
    },

    // ── Orange muscle car ────────────────────────────────────────────────────
    // Cues: bright ORANGE fastback, a big painted door disc, welded-shut doors.
    {
      id: 'franchise-ground-fiction/orange_muscle_car',
      label: 'Orange muscle car', category: 'ground',
      era: 'historical', lenMm: 5280, dims: [1950, 5280, 1350],
      body: '#e2600f', accent: '#1c1f24', surfaces: ['ground'],
      prims: [
        box([1900, 520, 5100], [0, 470, 0], 'body'),            // body
        box([1840, 240, 1900], [0, 830, -1560], 'body'),        // long hood
        box([1600, 460, 2000], [0, 1010, 350], 'body'),         // fastback cabin
        box([1660, 300, 1780], [0, 1080, 330], 'glass'),        // glass band
        box([1720, 260, 900], [0, 900, 2100], 'body', [9, 0, 0]),      // fastback tail slope
        cyl([300, 300, 60], [-960, 720, 100], '#efe6c8', [0, 0, 90]),  // painted door disc L
        cyl([300, 300, 60], [960, 720, 100], '#efe6c8', [0, 0, 90]),   // painted door disc R
        box([1700, 140, 110], [0, 420, -2610], 'accent'),       // front bumper
        box([1700, 140, 110], [0, 420, 2610], 'accent'),        // rear bumper
        ...lamps(620, 830, -2600, AMBER, [250, 150, 50]),
        ...lamps(660, 850, 2620, RED, [230, 150, 50]),
        ...wheels4(1660, -1700, 1660, 340, 300),
      ],
    },

    // ── Boxy white ghost-hunting wagon ───────────────────────────────────────
    // Cues: LONG white finned wagon + a crowded ROOF EQUIPMENT ARRAY + red stripe.
    {
      id: 'franchise-ground-fiction/ghost_wagon',
      label: 'Boxy white ghost-hunting wagon', category: 'ground',
      era: 'historical', lenMm: 6400, dims: [2000, 6400, 2100],
      body: '#f2f4f6', accent: '#c0392b', surfaces: ['ground'],
      prims: [
        box([1950, 640, 6200], [0, 560, 0], 'body'),            // long low body
        box([1880, 260, 1900], [0, 990, -2050], 'body'),        // long hood
        box([1720, 720, 3200], [0, 1250, 700], 'body'),         // wagon greenhouse
        box([1800, 460, 3000], [0, 1330, 700], 'glass'),        // glass band
        box([1960, 160, 5400], [0, 880, 0], 'accent'),          // red side stripe
        box([120, 420, 1200], [-900, 1000, 2800], 'body'),      // tail fin L
        box([120, 420, 1200], [900, 1000, 2800], 'body'),       // tail fin R
        box([1500, 200, 2100], [0, 1720, 700], '#3d4249'),      // roof equipment deck
        cyl([180, 180, 620], [-380, 1980, 300], '#8d949c'),     // roof canister
        box([420, 300, 620], [420, 1930, 900], '#8d949c'),      // roof instrument box
        cyl([28, 28, 900], [700, 2200, 200], '#c9ced4'),        // roof antenna
        ...lamps(640, 1030, -3160, AMBER, [260, 170, 60]),
        ...lamps(760, 1150, 3180, RED, [200, 220, 55]),
        ...wheels4(1740, -2000, 2000, 360, 260),
      ],
    },

    // ── Friendly racing compact ──────────────────────────────────────────────
    // Cues: rounded bug body + a big WHITE CIRCLE with a number + racing stripes.
    {
      id: 'franchise-ground-fiction/racing_compact',
      label: 'Friendly racing compact', category: 'ground',
      era: 'historical', lenMm: 4080, dims: [1540, 4080, 1500],
      body: '#eef0f2', accent: '#c0392b', surfaces: ['ground'],
      prims: [
        box([1460, 620, 3800], [0, 520, 0], 'body'),            // lower body
        sph(360, [0, 640, -1400], 'body'),                      // rounded front boot
        box([1180, 700, 1900], [0, 1020, 120], 'body'),         // cabin core
        sph(560, [0, 860, 120], 'body'),                        // dome roof
        box([1260, 400, 1660], [0, 1120, 120], 'glass'),        // glass band
        box([980, 380, 950], [0, 1000, 1420], 'body'),          // rear engine hump
        box([320, 900, 3900], [0, 900, -60], 'accent'),         // centre racing stripe
        box([160, 920, 3900], [-330, 900, -60], '#2f5fbf'),     // blue stripe L
        box([160, 920, 3900], [330, 900, -60], '#2f5fbf'),      // blue stripe R
        cyl([330, 330, 70], [-750, 780, -100], '#fbfbfc', [0, 0, 90]),  // number disc L
        cyl([330, 330, 70], [750, 780, -100], '#fbfbfc', [0, 0, 90]),   // number disc R
        sph(170, [-500, 900, -1740], AMBER),                    // headlamp L
        sph(170, [500, 900, -1740], AMBER),                     // headlamp R
        ...wheels4(1300, -1320, 1300, 300, 200),
      ],
    },

    // ── Green mystery van ────────────────────────────────────────────────────
    // Cues: boxy teal-green van + ORANGE panel graphics + a roof travel case.
    {
      id: 'franchise-ground-fiction/mystery_van',
      label: 'Green mystery van', category: 'ground',
      era: 'historical', lenMm: 4600, dims: [1900, 4600, 2100],
      body: '#2fa06a', accent: '#e8801f', surfaces: ['ground'],
      prims: [
        box([1840, 1300, 4500], [0, 720, 0], 'body'),           // lower van body
        box([1780, 720, 4400], [0, 1660, 0], 'body'),           // upper van body
        box([1860, 500, 3500], [0, 1580, 150], 'glass'),        // window band
        box([1880, 300, 2300], [0, 1120, 400], 'accent'),       // orange side panel
        box([600, 240, 100], [0, 1520, -2300], 'accent'),       // nose flash
        box([1200, 300, 1800], [0, 2130, 300], 'accent'),       // roof travel case
        box([1240, 90, 1840], [0, 2300, 300], '#8d5a1c'),       // roof case lid
        box([1550, 140, 110], [0, 700, -2300], '#c9ced4'),      // front bumper
        box([1550, 140, 110], [0, 700, 2300], '#c9ced4'),       // rear bumper
        sph(160, [-620, 1180, -2290], AMBER),                   // headlamp L
        sph(160, [620, 1180, -2290], AMBER),                    // headlamp R
        ...lamps(680, 1350, 2320, RED, [180, 220, 55]),
        ...wheels4(1560, -1450, 1400, 330, 240),
      ],
    },
  ],
};

export default pack;
export { pack };
