// Ground Vehicles ▸ Civil — builtin base pack (dynamic-import only).
//
// First wave from docs/research/vehicle-model-library.md §3.5 (★ rows), authored
// at REAL mm scale: these place as ordinary furniture at true size, so a pickup
// in a driveway measures like a pickup. Model-local frame: −Z = nose, y = 0 =
// ground, origin = footprint centre (see prims.ts).
//
// Authoring bar (§2.1): 2–3 signature cues per model — silhouette + ONE proud
// accent + one distinguishing proportion. Sibling parts always INTERPENETRATE
// (never exactly coplanar visible faces — the flat-toon hatching gotcha).
import type { VehiclePackDef } from '../vehicles.js';
import { box, cyl, sph, lamps, wheel, wheels4, wheels6 } from './prims.js';

const AMBER = '#ffe9b0';
const RED = '#c62828';
const BLUE_LIGHT = '#3d7bd6';

const pack: VehiclePackDef = {
  id: 'base-ground-civil', version: 1, label: 'Civil',
  path: ['Ground Vehicles', 'Civil'], builtin: true,
  models: [
    // ── Full-size pickup (F-150 class) 5.89 × 2.03 × 1.98 m ──────────────────
    // Cues: tall cab set forward + OPEN BED walls + a light accent tailgate.
    {
      id: 'base-ground-civil/pickup', label: 'Pickup truck', category: 'ground',
      era: 'contemporary', lenMm: 5890, dims: [2030, 5890, 1980],
      body: '#2e5d8c', accent: '#d8dde3', surfaces: ['ground'],
      prims: [
        box([1900, 560, 5620], [0, 620, 0], 'body'),            // lower body / frame
        box([1840, 420, 1540], [0, 1080, -2000], 'body'),       // hood
        box([1820, 780, 1560], [0, 1210, -620], 'body'),        // cab
        box([1880, 400, 1400], [0, 1380, -620], 'glass'),       // cab glass band
        box([170, 470, 3000], [-830, 1130, 1250], 'body'),      // bed wall L
        box([170, 470, 3000], [830, 1130, 1250], 'body'),       // bed wall R
        box([1700, 450, 150], [0, 1130, 2700], 'accent'),       // tailgate
        ...lamps(690, 880, -2860, AMBER, [280, 150, 60]),
        ...lamps(740, 1080, 2860, RED, [220, 180, 50]),
        ...wheels4(1760, -1900, 1760, 400, 300),
      ],
    },

    // ── Mid-size SUV 4.8 × 1.9 × 1.75 m ──────────────────────────────────────
    // Cues: tall one-box wagon greenhouse + roof rails + short hood.
    {
      id: 'base-ground-civil/suv', label: 'SUV', category: 'ground',
      era: 'contemporary', lenMm: 4800, dims: [1900, 4800, 1750],
      body: '#3c454f', accent: '#aeb6bf', surfaces: ['ground'],
      prims: [
        box([1820, 640, 4620], [0, 600, 0], 'body'),            // lower body
        box([1780, 320, 1320], [0, 950, -1720], 'body'),        // hood
        box([1720, 720, 3260], [0, 1220, 200], 'body'),         // greenhouse
        box([1800, 400, 3060], [0, 1300, 200], 'glass'),        // window band
        box([1700, 150, 3100], [0, 1640, 200], 'body'),         // roof
        box([120, 90, 2400], [-720, 1750, 250], 'accent'),      // roof rail L
        box([120, 90, 2400], [720, 1750, 250], 'accent'),       // roof rail R
        ...lamps(650, 900, -2340, AMBER, [280, 150, 60]),
        ...lamps(700, 1060, 2340, RED, [200, 200, 50]),
        ...wheels4(1680, -1560, 1500, 350, 260),
      ],
    },

    // ── School bus (Type C conventional) 10.7 × 2.44 × 3.05 m ────────────────
    // Cues: flat yellow slab body + short snout hood + black roof stripe + a
    // red stop-arm on the driver side.
    {
      id: 'base-ground-civil/school_bus', label: 'School bus', category: 'ground',
      era: 'contemporary', lenMm: 10700, dims: [2440, 10700, 3050],
      body: '#f2b90d', accent: '#1a1c1f', surfaces: ['ground'],
      prims: [
        box([2380, 2100, 8700], [0, 1750, 950], 'body'),        // passenger box
        box([2200, 750, 1700], [0, 1150, -4400], 'body'),       // snout hood
        box([2420, 620, 8300], [0, 2200, 950], 'glass'),        // window band
        box([2440, 150, 8500], [0, 2870, 950], 'accent'),       // roof stripe
        box([2400, 130, 8600], [0, 1180, 950], 'accent'),       // rub rail
        box([2260, 700, 120], [0, 1900, -5290], 'glass'),       // windshield
        box([70, 500, 700], [-1260, 1500, -3300], RED),         // stop-arm (driver side)
        ...lamps(880, 900, -5290, AMBER, [300, 200, 70]),
        ...lamps(940, 1400, 5330, RED, [240, 260, 60]),
        ...wheels6(2000, -3900, 3400, 4400, 500, 320),
      ],
    },

    // ── City transit bus 12.2 × 2.6 × 3.2 m ──────────────────────────────────
    // Cues: long low-floor box, full-height glazing, destination sign.
    {
      id: 'base-ground-civil/transit_bus', label: 'City transit bus', category: 'ground',
      era: 'contemporary', lenMm: 12200, dims: [2600, 12200, 3200],
      body: '#2f6fb0', accent: '#e8ecef', surfaces: ['ground'],
      prims: [
        box([2540, 2500, 12000], [0, 1650, 0], 'body'),         // one-box body
        box([2580, 900, 11400], [0, 2300, 0], 'glass'),         // glazing band
        box([2600, 260, 11800], [0, 950, 0], 'accent'),         // skirt stripe
        box([2560, 160, 11700], [0, 3020, 0], 'accent'),        // roof cap
        box([1500, 320, 90], [0, 2760, -6060], '#141618'),      // destination sign
        box([2400, 1300, 110], [0, 2200, -6050], 'glass'),      // windshield
        ...lamps(950, 800, -6070, AMBER, [320, 190, 70]),
        ...lamps(1000, 1200, 6080, RED, [260, 260, 60]),
        ...wheels6(2160, -4400, 3600, 4700, 520, 340),
      ],
    },

    // ── Semi truck (tractor + trailer), combined ~21.5 × 2.6 × 4.1 m ─────────
    // Cues: tall conventional tractor nose + chrome stacks + a LONG box trailer
    // riding a visible gap over the fifth wheel.
    {
      id: 'base-ground-civil/semi_truck', label: 'Semi truck & trailer', category: 'ground',
      era: 'contemporary', lenMm: 21500, dims: [2600, 21500, 4100],
      body: '#a3282c', accent: '#dfe3e7', surfaces: ['ground'],
      prims: [
        box([2300, 900, 6200], [0, 900, -7500], 'body'),        // tractor frame
        box([2260, 1700, 2400], [0, 1900, -8900], 'body'),      // sleeper + cab
        box([2320, 700, 1600], [0, 2350, -9700], 'glass'),      // cab glazing
        box([2100, 1000, 2100], [0, 1500, -10650], 'body'),     // hood
        box([2140, 500, 260], [0, 1200, -11720], 'accent'),     // chrome grille
        cyl([90, 90, 2000], [-1180, 2400, -9000], 'accent'),    // stack L
        cyl([90, 90, 2000], [1180, 2400, -9000], 'accent'),     // stack R
        box([2540, 2800, 13400], [0, 2500, 3900], 'accent'),    // trailer box
        box([2400, 900, 240], [0, 1300, 3400], 'dark'),         // landing gear cross-beam
        ...lamps(880, 1100, -11740, AMBER, [300, 220, 70]),
        ...lamps(1000, 1300, 10640, RED, [240, 280, 60]),
        ...wheels6(2060, -11000, -6200, -5200, 520, 320),       // tractor steer + drive
        ...wheels6(2060, 8300, 9300, 10000, 520, 320),          // trailer bogie
      ],
    },

    // ── Fire engine (pumper) ~9.5 × 2.5 × 3.2 m ──────────────────────────────
    // Cues: red slab pumper body + roof ladder + a wide roof light bar.
    {
      id: 'base-ground-civil/fire_engine', label: 'Fire engine', category: 'ground',
      era: 'contemporary', lenMm: 9500, dims: [2500, 9500, 3200],
      body: '#c1272d', accent: '#e6e9ec', surfaces: ['ground'],
      prims: [
        box([2440, 1500, 9200], [0, 1250, 0], 'body'),          // pump/body module
        box([2360, 1300, 2600], [0, 2150, -3100], 'body'),      // crew cab
        box([2420, 620, 2300], [0, 2500, -3200], 'glass'),      // cab glazing
        box([2460, 200, 5600], [0, 1600, 1600], 'accent'),      // compartment stripe
        box([2200, 140, 5000], [0, 2120, 1700], '#3d4249'),     // hose bed deck
        box([300, 220, 7200], [-980, 2360, 700], 'accent'),     // roof ladder rail L
        box([300, 220, 7200], [980, 2360, 700], 'accent'),      // roof ladder rail R
        box([1900, 200, 260], [0, 2960, -3600], RED),           // light bar (red)
        box([900, 200, 250], [0, 2960, -3600], BLUE_LIGHT),     // light bar (blue centre)
        ...lamps(900, 1000, -4780, AMBER, [300, 200, 70]),
        ...lamps(950, 1500, 4730, RED, [240, 260, 60]),
        ...wheels6(2020, -3300, 2600, 3700, 520, 320),
      ],
    },

    // ── Ambulance (Type III box) ~7.0 × 2.4 × 2.9 m ──────────────────────────
    // Cues: van cab + a MUCH taller boxy patient module + roof light bar.
    {
      id: 'base-ground-civil/ambulance', label: 'Ambulance', category: 'ground',
      era: 'contemporary', lenMm: 7000, dims: [2400, 7000, 2900],
      body: '#eef1f4', accent: '#c0392b', surfaces: ['ground'],
      prims: [
        box([2200, 1000, 6800], [0, 800, 0], 'body'),           // chassis / lower body
        box([2140, 1200, 2200], [0, 1750, -2200], 'body'),      // van cab
        box([2180, 620, 1900], [0, 2000, -2400], 'glass'),      // cab glazing
        box([2360, 1700, 4200], [0, 2000, 1250], 'body'),       // patient module
        box([2380, 220, 4000], [0, 1650, 1250], 'accent'),      // side stripe
        box([1000, 700, 90], [0, 2100, 3400], 'accent'),        // rear door cross
        box([1700, 190, 250], [0, 2900, -1500], 'accent'),      // light bar
        box([760, 190, 240], [0, 2900, -1500], BLUE_LIGHT),     // light bar (blue centre)
        ...lamps(760, 900, -3480, AMBER, [280, 180, 60]),
        ...lamps(880, 1900, 3400, RED, [200, 240, 60]),
        ...wheels4(1900, -2300, 2000, 400, 280),
      ],
    },

    // ── Police cruiser (sedan) ~5.0 × 1.9 × 1.5 m ────────────────────────────
    // Cues: black-and-white sedan + roof light bar + push bumper.
    {
      id: 'base-ground-civil/police_cruiser', label: 'Police cruiser', category: 'ground',
      era: 'contemporary', lenMm: 5000, dims: [1900, 5000, 1500],
      body: '#1b1e22', accent: '#eceff1', surfaces: ['ground'],
      prims: [
        box([1840, 560, 4820], [0, 560, 0], 'body'),            // lower body
        box([1800, 260, 1300], [0, 900, -1720], 'body'),        // hood
        box([1800, 260, 1200], [0, 900, 1780], 'body'),         // boot lid
        box([1620, 540, 2200], [0, 1130, 120], 'body'),         // cabin
        box([1700, 340, 2020], [0, 1180, 120], 'glass'),        // glass band
        box([1860, 620, 1500], [0, 800, 380], 'accent'),        // white door panels
        box([1300, 170, 230], [0, 1470, -450], BLUE_LIGHT),     // light bar
        box([620, 175, 235], [0, 1470, -450], RED),             // light bar (red centre)
        box([1700, 320, 130], [0, 640, -2520], '#4a4f55'),      // push bumper
        ...lamps(640, 820, -2470, AMBER, [260, 150, 55]),
        ...lamps(680, 950, 2470, RED, [200, 180, 50]),
        ...wheels4(1660, -1600, 1560, 330, 250),
      ],
    },

    // ── Cruiser motorcycle ~2.4 × 0.9 × 1.2 m ────────────────────────────────
    // Cues: two big wheels + a low long tank + exposed engine + high bars.
    {
      id: 'base-ground-civil/motorcycle', label: 'Motorcycle (cruiser)', category: 'ground',
      era: 'contemporary', lenMm: 2400, dims: [900, 2400, 1200],
      body: '#7b1e1e', accent: '#c8ccd1', surfaces: ['ground'],
      prims: [
        box([260, 300, 900], [0, 720, -180], 'body'),           // fuel tank
        box([300, 260, 420], [0, 500, 120], '#2b2f34'),         // engine block
        box([340, 120, 520], [0, 780, 420], 'body'),            // seat + rear fender
        cyl([44, 44, 700], [0, 950, -740], 'accent', [0, 0, 90]),   // handlebar
        cyl([40, 40, 620], [0, 700, -680], 'accent', [12, 0, 0]),   // fork
        cyl([55, 55, 620], [180, 430, 260], 'accent', [90, 0, 0]),  // exhaust (runs fore-aft)
        sph(110, [0, 990, -840], AMBER),                        // headlamp
        box([160, 120, 40], [0, 830, 700], RED),                // tail light
        wheel(0, -880, 340, 130),                               // front wheel
        wheel(0, 800, 340, 160),                                // rear wheel
      ],
    },
  ],
};

export default pack;
export { pack };
