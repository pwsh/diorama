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
import { box, cone, cyl, sph, lamps, wheels4 } from './prims.js';

const AMBER = '#ffe9b0';
const RED = '#c62828';

const pack: VehiclePackDef = {
  id: 'franchise-ground-fiction', version: 3, label: 'Fiction',
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
        // Gullwing doors CLOSED: upright skins flush in the flanks (x 720..900,
        // 10 mm proud of the 890-wide hull), not the raised ±32° panels that
        // used to stand 214 mm over the car's own declared 1140 mm roofline and
        // 15 mm wider than its declared half-width.
        box([180, 560, 1370], [-810, 700, 235], 'body'),        // gullwing door L (closed)
        box([180, 560, 1370], [810, 700, 235], 'body'),         // gullwing door R (closed)
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
        // Rear engine cover as a LOW hump: the turbine's crown now tops out at
        // 920 — under the canopy (1080) and well under 0.75 × the declared
        // 1300 mm height — so the silhouette stays a long low wedge. It used to
        // balloon to 1200, taller than the cockpit.
        cyl([300, 300, 900], [0, 620, 2050], 'accent', [90, 0, 0]),    // rear turbine
        cyl([210, 210, 260], [0, 620, 2560], '#ff7a2f'),        // turbine glow (afterburner)
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
        box([1700, 140, 230], [0, 420, -2550], 'accent'),       // front bumper (grown into the body)
        box([1700, 140, 230], [0, 420, 2550], 'accent'),        // rear bumper (grown into the body)
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
        // Racing livery: three THIN lanes, each in three segments that lie ON
        // the bodywork — a hood panel angled nose-down (rot.x −8), a flat roof
        // panel straddling the dome crown, and a deck panel angled tail-down
        // (rot.x +10) over the engine lid. They used to be single 900 mm-TALL
        // slabs 3900 mm long, which rode high above the paint AND overhung the
        // nose and tail, reading as blocky bumper blocks from either end.
        box([320, 60, 520], [0, 985, -1400], 'accent', [-8, 0, 0]),     // hood, centre
        box([160, 60, 900], [-330, 880, -1400], '#2f5fbf', [-8, 0, 0]), // hood, blue L
        box([160, 60, 900], [330, 880, -1400], '#2f5fbf', [-8, 0, 0]),  // hood, blue R
        box([320, 60, 1560], [0, 1395, 120], 'accent'),          // roof, centre
        box([160, 60, 1560], [-330, 1395, 120], '#2f5fbf'),      // roof, blue L
        box([160, 60, 1560], [330, 1395, 120], '#2f5fbf'),       // roof, blue R
        box([320, 60, 900], [0, 1175, 1430], 'accent', [10, 0, 0]),     // deck, centre
        box([160, 60, 900], [-330, 1175, 1430], '#2f5fbf', [10, 0, 0]), // deck, blue L
        box([160, 60, 900], [330, 1175, 1430], '#2f5fbf', [10, 0, 0]),  // deck, blue R
        // Subtle rounded bumpers in place of the old protruding stripe ends.
        cyl([70, 70, 1240], [0, 560, -1880], '#c9ced4', [0, 0, 90]),    // front bumper
        cyl([70, 70, 1240], [0, 560, 1880], '#c9ced4', [0, 0, 90]),     // rear bumper
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
        box([600, 240, 220], [0, 1520, -2240], 'accent'),       // nose flash (grown into the nose)
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

    // ── Black-and-white ex-police sedan ──────────────────────────────────────
    // Cues: a mid-70s full-size body (5.6 × 2.0 × 1.45 m) in decommissioned
    // squad-car two-tone — black shell, WHITE doors and roof — carrying a big
    // grey PA loudspeaker horn on the roof, aimed forward. The declared height
    // is 1900: 1.45 m of sedan plus the horn, which is the signature cue and
    // genuinely part of the silhouette.
    {
      id: 'franchise-ground-fiction/ex_police_sedan',
      label: 'Black-and-white ex-police sedan', category: 'ground',
      era: 'historical', lenMm: 5600, dims: [2000, 5600, 1900],
      body: '#15171a', accent: '#eceff1', surfaces: ['ground'],
      prims: [
        box([1940, 560, 5450], [0, 560, 0], 'body'),            // lower body
        box([1880, 270, 1800], [0, 900, -1650], 'body'),        // long flat hood
        box([1880, 260, 1250], [0, 890, 1930], 'body'),         // boot lid
        box([1740, 540, 2250], [0, 1100, 180], 'body'),         // cabin
        box([1800, 330, 2050], [0, 1180, 180], 'glass'),        // glass band
        box([1980, 600, 1900], [0, 760, 200], 'accent'),        // white door panels
        box([1700, 120, 2000], [0, 1410, 200], 'accent'),       // white roof
        box([260, 190, 320], [0, 1500, -120], '#3d4249'),       // horn mount
        cone([210, 560], [0, 1680, -330], '#8d949c', [90, 0, 0]),  // roof PA horn (mouth forward)
        box([1820, 150, 120], [0, 460, -2760], '#9aa1a8'),      // front bumper
        box([1820, 150, 120], [0, 460, 2760], '#9aa1a8'),       // rear bumper
        ...lamps(660, 880, -2770, AMBER, [260, 150, 55]),
        ...lamps(700, 900, 2760, RED, [220, 170, 55]),
        ...wheels4(1700, -1750, 1700, 350, 250),
      ],
    },
  ],
};

export default pack;
export { pack };
