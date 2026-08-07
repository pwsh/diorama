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
  id: 'base-ground-civil', version: 4, label: 'Civil',
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
        // Hood SHORT (1100, was 1540) and the cab TALLER (roof 1800, was 1600)
        // + longer to take up the slack: a modern crew-cab pickup is mostly
        // cabin, and the old long-hood/low-cab pair read as a 1970s truck.
        box([1840, 420, 1100], [0, 1080, -2210], 'body'),       // hood
        box([1820, 980, 1820], [0, 1310, -780], 'body'),        // cab
        box([1880, 440, 1560], [0, 1500, -780], 'glass'),       // cab glass band
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
        // The dark nose panel used to be authored at y 1550..2250 — ABOVE the
        // hood (which tops out at 1525), so it read as a grille floating over
        // the bonnet. It is now two parts: a GRILLE on the hood's front face,
        // between the headlamps and inside the hood's height band, and the
        // windshield where it belongs, on the front of the passenger box.
        box([1280, 520, 130], [0, 1120, -5280], 'accent'),      // nose grille (below hood top)
        box([2280, 700, 120], [0, 2200, -3390], 'glass'),       // windshield
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
        // The trailer's nose now runs FORWARD over the tractor's drive axles
        // (front face z −5200 vs the frame's rear end −4400 = 800 mm of solid
        // overlap, sharing 250 mm of height with the frame): the coupling used
        // to leave a 1600 mm hole where the fifth wheel should be. Only this box
        // moved — the trailer's tail and its bogie are where they were.
        box([2540, 2800, 15800], [0, 2500, 2700], 'accent'),    // trailer box
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
        // Light bar SEATED on the crew-cab roof (top 2800; underside 2770 = 30 mm
        // sunk — the ambulance idiom, never floating). Blue centre is taller AND
        // deeper than the red bar so no sibling faces are coplanar.
        box([1900, 200, 260], [0, 2870, -3600], RED),           // light bar (red)
        box([900, 220, 280], [0, 2870, -3600], BLUE_LIGHT),     // light bar (blue centre)
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
        // The bar SITS ON the cab roof (roof top 2350; the bar's underside 2320
        // buries 30 mm into it) instead of floating 455 mm above it. The blue
        // centre section is deliberately 20 mm taller and 10 mm longer than the
        // red bar it sits inside, so no pair of sibling faces is coplanar.
        box([1700, 190, 250], [0, 2415, -1500], 'accent'),      // light bar
        box([760, 210, 260], [0, 2415, -1500], BLUE_LIGHT),     // light bar (blue centre)
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
        // Bar is seated (underside 1385 vs cabin roof 1400); the red centre is
        // 15 mm prouder than the blue in y AND z so their faces never sit a
        // hair apart (the 2.5 mm near-coplanar shimmer).
        box([1300, 170, 230], [0, 1470, -450], BLUE_LIGHT),     // light bar
        box([620, 200, 260], [0, 1470, -450], RED),             // light bar (red centre)
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

    // ═══ Second wave (2026-08-06) — the everyday street roster ══════════════
    // Same authoring bar as above: 2–3 signature cues, real mm, interpenetrating
    // siblings. These are the shapes a suburban plan actually needs (a car in
    // the driveway, a van at the curb, a mower-scale cart in the yard).

    // ── Sedan 4.8 × 1.85 × 1.45 m ────────────────────────────────────────────
    // Cues: THREE-box silhouette (a real trunk deck aft of the cabin), a low
    // greenhouse, and a bright belt-line trim strip proud of the doors.
    {
      id: 'base-ground-civil/sedan', label: 'Sedan', category: 'ground',
      era: 'contemporary', lenMm: 4800, dims: [1850, 4800, 1450],
      body: '#5a6b78', accent: '#d5dade', surfaces: ['ground'],
      prims: [
        box([1790, 550, 4620], [0, 545, 0], 'body'),            // lower body
        box([1750, 250, 1240], [0, 870, -1650], 'body'),        // hood (box 1)
        box([1580, 520, 2100], [0, 1090, 60], 'body'),          // cabin (box 2)
        box([1660, 320, 1930], [0, 1140, 60], 'glass'),         // glass band (proud of the cabin)
        box([1750, 250, 1100], [0, 870, 1700], 'body'),         // trunk deck (box 3)
        box([1860, 60, 4200], [0, 800, 0], 'accent'),           // belt-line trim
        ...lamps(640, 780, -2320, AMBER, [260, 150, 55]),
        ...lamps(680, 760, 2320, RED, [200, 170, 50]),
        ...wheels4(1620, -1560, 1560, 330, 240),
      ],
    },

    // ── Hatchback 4.3 × 1.78 × 1.5 m ─────────────────────────────────────────
    // Cues: TWO-box profile (cabin runs to the tail), a STEEPLY RAKED rear
    // screen, and a short rear overhang under a small roof spoiler.
    {
      id: 'base-ground-civil/hatchback', label: 'Hatchback', category: 'ground',
      era: 'contemporary', lenMm: 4300, dims: [1780, 4300, 1500],
      body: '#c0392b', accent: '#20242a', surfaces: ['ground'],
      prims: [
        box([1720, 560, 4140], [0, 560, 0], 'body'),            // lower body
        box([1680, 250, 1000], [0, 880, -1500], 'body'),        // short hood
        box([1560, 560, 2500], [0, 1120, 400], 'body'),         // cabin runs aft (two-box)
        box([1640, 340, 2300], [0, 1170, 380], 'glass'),        // side glass
        box([1500, 620, 120], [0, 1120, 1720], 'glass', [28, 0, 0]),  // raked rear screen
        box([1480, 90, 260], [0, 1420, 1560], 'accent'),        // roof spoiler
        ...lamps(620, 780, -2060, AMBER, [250, 150, 55]),
        ...lamps(660, 790, 2060, RED, [200, 220, 50]),
        ...wheels4(1580, -1350, 1500, 320, 230),
      ],
    },

    // ── Minivan 5.1 × 1.95 × 1.75 m ──────────────────────────────────────────
    // Cues: ONE-box egg profile (short sloped hood into a tall greenhouse), a
    // very long window band, and the sliding-door rub rail down the flanks.
    {
      id: 'base-ground-civil/minivan', label: 'Minivan', category: 'ground',
      era: 'contemporary', lenMm: 5100, dims: [1950, 5100, 1750],
      body: '#7a8b99', accent: '#c8ced4', surfaces: ['ground'],
      prims: [
        box([1880, 700, 4900], [0, 620, 0], 'body'),            // lower body
        box([1820, 300, 900], [0, 1050, -1950], 'body', [-8, 0, 0]),  // short SLOPED hood
        box([1800, 700, 3400], [0, 1320, 350], 'body'),         // tall greenhouse (one box)
        box([1880, 420, 3200], [0, 1330, 350], 'glass'),        // long window band
        box([1760, 110, 3300], [0, 1690, 350], 'body'),         // roof
        box([1900, 70, 2200], [0, 960, 500], 'accent'),         // sliding-door rub rail
        ...lamps(700, 880, -2470, AMBER, [280, 160, 60]),
        ...lamps(740, 1050, 2470, RED, [220, 220, 55]),
        ...wheels4(1700, -1700, 1700, 350, 250),
      ],
    },

    // ── Delivery van 5.9 × 2.05 × 2.6 m ──────────────────────────────────────
    // Cues: TALL cargo box flush with the cab (no step in the roofline), a very
    // short nose, and a plain accent slab down the side for signage.
    {
      id: 'base-ground-civil/delivery_van', label: 'Delivery van', category: 'ground',
      era: 'contemporary', lenMm: 5900, dims: [2050, 5900, 2600],
      body: '#eef1f4', accent: '#2f6fb0', surfaces: ['ground'],
      prims: [
        box([1960, 500, 5700], [0, 450, 0], 'body'),            // chassis / lower body
        box([1900, 500, 900], [0, 900, -2450], 'body'),         // short nose
        box([1980, 1000, 1500], [0, 1400, -2050], 'body'),      // cab
        box([1880, 620, 120], [0, 1620, -2760], 'glass'),       // windshield
        box([2000, 420, 900], [0, 1580, -2300], 'glass'),       // cab side glass
        box([2040, 1900, 4400], [0, 1620, 750], 'body'),        // cargo box (flush with the cab)
        box([2060, 800, 3600], [0, 1500, 900], 'accent'),       // signage slab
        box([1900, 90, 3800], [0, 2540, 900], 'accent'),        // roof rib
        ...lamps(760, 780, -2920, AMBER, [280, 170, 60]),
        ...lamps(820, 1000, 2900, RED, [220, 240, 55]),
        ...wheels4(1780, -2200, 1900, 400, 280),
      ],
    },

    // ── Box truck 7.2 × 2.4 × 3.4 m ──────────────────────────────────────────
    // Cues: a SEPARATE cab with a taller, wider white box behind it, the box's
    // nose OVERHANGING the cab roof, and a rear roll-door panel.
    {
      id: 'base-ground-civil/box_truck', label: 'Box truck', category: 'ground',
      era: 'contemporary', lenMm: 7200, dims: [2400, 7200, 3400],
      body: '#3a4149', accent: '#eceff1', surfaces: ['ground'],
      prims: [
        box([2200, 500, 6820], [0, 700, 0], 'dark'),            // frame
        box([2280, 1500, 2000], [0, 1500, -2500], 'body'),      // cab (separate from the box)
        box([2300, 600, 100], [0, 1900, -3480], 'glass'),       // windshield
        box([2300, 500, 800], [0, 1850, -3000], 'glass'),       // cab side glass
        box([2400, 2400, 5050], [0, 2100, 925], 'accent'),      // cargo box (taller + wider)
        box([2380, 700, 1300], [0, 2580, -2200], 'accent'),     // box nose over the cab
        box([2200, 2100, 100], [0, 2100, 3420], 'body'),        // rear roll-door panel
        ...lamps(880, 900, -3520, AMBER, [300, 200, 70]),
        ...lamps(940, 1200, 3480, RED, [240, 260, 60]),
        ...wheels6(2000, -2900, 1800, 3000, 500, 320),
      ],
    },

    // ── Garbage truck 8.5 × 2.55 × 3.6 m ─────────────────────────────────────
    // Cues: flat-front CAB-OVER cab, a dirty-green hopper with a SLOPED rear
    // packer panel, and the raised front-loader forks ahead of the nose.
    {
      id: 'base-ground-civil/garbage_truck', label: 'Garbage truck', category: 'ground',
      era: 'contemporary', lenMm: 8500, dims: [2550, 8500, 3600],
      body: '#3f6b3a', accent: '#b9bfc4', surfaces: ['ground'],
      prims: [
        box([2300, 500, 8200], [0, 700, 0], 'dark'),            // frame
        box([2500, 2000, 1900], [0, 1750, -3200], 'body'),      // cab-over cab (flat front)
        box([2400, 900, 120], [0, 2000, -4130], 'glass'),       // deep windshield
        box([2540, 2100, 6250], [0, 2050, 925], 'body'),        // hopper body
        box([2570, 120, 5800], [0, 3060, 900], 'accent'),       // hopper rim
        box([2480, 1900, 260], [0, 2050, 3900], 'body', [12, 0, 0]),  // sloped rear packer
        box([180, 1600, 200], [-900, 900, -4300], 'accent'),    // front-loader fork L
        box([180, 1600, 200], [900, 900, -4300], 'accent'),     // front-loader fork R
        box([2000, 180, 260], [0, 1650, -4300], 'accent'),      // fork cross-bar
        ...lamps(900, 700, -4200, AMBER, [280, 180, 60]),
        ...lamps(980, 1300, 4080, RED, [240, 240, 60]),
        ...wheels6(2100, -3400, 2400, 3600, 520, 340),
      ],
    },

    // ── Tow truck 7.0 × 2.45 × 3.2 m ─────────────────────────────────────────
    // Cues: pickup-like cab, a flatbed deck TILTED down to the rear, an amber
    // light bar seated on the cab roof, and the boom angled up over the deck.
    {
      id: 'base-ground-civil/tow_truck', label: 'Tow truck', category: 'ground',
      era: 'contemporary', lenMm: 7000, dims: [2450, 7000, 3200],
      body: '#e0821c', accent: '#e8ecef', surfaces: ['ground'],
      prims: [
        box([2160, 460, 6800], [0, 620, 0], 'dark'),            // frame
        box([2200, 500, 1300], [0, 1050, -2900], 'body'),       // hood
        box([2280, 1200, 1700], [0, 1450, -1900], 'body'),      // cab
        box([2300, 600, 1500], [0, 1700, -1950], 'glass'),      // cab glazing
        box([2420, 200, 4200], [0, 1400, 1450], 'accent', [6, 0, 0]),  // tilting flatbed deck
        box([120, 190, 4100], [-1130, 1500, 1450], 'body', [6, 0, 0]),  // deck rail L
        box([120, 190, 4100], [1130, 1500, 1450], 'body', [6, 0, 0]),   // deck rail R
        box([320, 1500, 320], [0, 1550, -350], 'body'),         // boom mast
        box([260, 200, 2800], [0, 2300, 1000], 'body', [-12, 0, 0]),   // boom arm (rises aft)
        box([1600, 180, 240], [0, 2110, -2000], AMBER),         // roof light bar
        ...lamps(880, 900, -3560, AMBER, [280, 190, 60]),
        ...lamps(940, 800, 3380, RED, [220, 220, 55]),
        ...wheels6(2000, -2600, 1900, 2900, 480, 320),
      ],
    },

    // ── Class-C RV camper 7.5 × 2.5 × 3.2 m ──────────────────────────────────
    // Cues: the CAB-OVER bunk box overhanging the nose, a long white coach with
    // a colored beltline, and the roof air-conditioner box.
    {
      id: 'base-ground-civil/rv_camper', label: 'RV camper', category: 'ground',
      era: 'contemporary', lenMm: 7500, dims: [2500, 7500, 3200],
      body: '#f0f2f4', accent: '#2f6fb0', surfaces: ['ground'],
      prims: [
        box([2200, 500, 7200], [0, 550, 0], 'dark'),            // chassis
        box([2200, 1100, 1800], [0, 1350, -2700], 'body'),      // cab
        box([2160, 620, 120], [0, 1600, -3580], 'glass'),       // windshield
        box([2240, 480, 900], [0, 1550, -3100], 'glass'),       // cab side glass
        box([2440, 800, 2000], [0, 2250, -2780], 'body'),       // cab-over bunk (overhangs the nose)
        box([2460, 380, 700], [0, 2280, -3480], 'glass'),       // bunk window
        box([2460, 1900, 5400], [0, 1900, 800], 'body'),        // coach body
        box([2480, 200, 5000], [0, 1550, 850], 'accent'),       // beltline stripe
        box([900, 260, 1000], [0, 2960, 1400], 'accent'),       // roof AC box
        ...lamps(820, 850, -3580, AMBER, [280, 180, 60]),
        ...lamps(880, 1050, 3480, RED, [220, 240, 55]),
        ...wheels4(2000, -2800, 2300, 420, 300),
      ],
    },

    // ── Farm tractor 4.3 × 2.2 × 2.9 m ───────────────────────────────────────
    // Cues: HUGE rear wheels against small steering wheels up front (authored
    // as individual `wheel` calls — no shared radius), an open engine nose with
    // an exhaust stack, and the cab set high over the rear axle.
    {
      id: 'base-ground-civil/tractor', label: 'Farm tractor', category: 'ground',
      era: 'contemporary', lenMm: 4300, dims: [2200, 4300, 2900],
      body: '#2f7a34', accent: '#f2c400', surfaces: ['ground'],
      prims: [
        box([700, 300, 3400], [0, 800, -200], 'dark'),          // chassis beam (open flanks)
        box([1800, 400, 240], [0, 500, -1500], 'dark'),         // front axle beam
        box([900, 700, 1700], [0, 1150, -1200], 'body'),        // engine nose
        box([820, 500, 120], [0, 1150, -2030], 'accent'),       // radiator grille
        cyl([70, 70, 900], [-330, 1900, -1900], 'dark'),        // exhaust stack
        box([1300, 1200, 1500], [0, 2050, 550], 'body'),        // cab, high over the rear axle
        box([1340, 750, 1400], [0, 2150, 550], 'glass'),        // cab glazing
        box([1420, 120, 1600], [0, 2690, 550], 'accent'),       // cab roof
        ...lamps(300, 1300, -2100, AMBER, [200, 140, 50]),
        wheel(-830, -1500, 380, 220),                           // small front wheel L
        wheel(830, -1500, 380, 220),                            // small front wheel R
        wheel(-800, 900, 750, 380),                             // BIG rear wheel L
        wheel(800, 900, 750, 380),                              // BIG rear wheel R
      ],
    },

    // ── Golf cart 2.4 × 1.2 × 1.8 m ──────────────────────────────────────────
    // Cues: OPEN sides — four thin posts under a flat canopy and no glass at
    // all — tiny wheels, and the bag rack hanging off the tail.
    {
      id: 'base-ground-civil/golf_cart', label: 'Golf cart', category: 'ground',
      era: 'contemporary', lenMm: 2400, dims: [1200, 2400, 1800],
      body: '#e8ecef', accent: '#2f7a34', surfaces: ['ground'],
      prims: [
        box([1140, 140, 2200], [0, 380, 0], 'body'),            // floor pan
        box([1080, 380, 700], [0, 600, -800], 'body'),          // front cowl
        box([1060, 260, 140], [0, 830, -420], 'dark'),          // dash
        box([1080, 300, 700], [0, 640, 250], 'body'),           // bench base
        box([1060, 620, 180], [0, 1090, 560], 'accent'),        // bench back
        box([80, 900, 80], [-500, 1280, -300], 'body'),         // canopy post FL
        box([80, 900, 80], [500, 1280, -300], 'body'),          // canopy post FR
        box([80, 900, 80], [-500, 1280, 700], 'body'),          // canopy post RL
        box([80, 900, 80], [500, 1280, 700], 'body'),           // canopy post RR
        box([1180, 90, 1900], [0, 1740, 200], 'accent'),        // flat canopy roof
        box([900, 90, 400], [0, 900, 1000], 'accent'),          // bag-rack shelf
        box([860, 500, 90], [0, 1150, 1140], 'accent'),         // bag-rack back panel
        ...wheels4(1000, -760, 760, 240, 160),
      ],
    },

    // ── Bicycle 1.8 × 0.6 × 1.1 m ────────────────────────────────────────────
    // Cues: two big THIN wheels, a real diamond frame (slim tubes angled with
    // `rot` in the Z/Y plane — each tube's centre is the midpoint of the two
    // joints it spans), and the handlebar + saddle that make it read at toon
    // scale. Deliberately thin: `_addOutlines` skips small parts, and the
    // wheels are big enough to carry the cartoon shell for the whole model.
    {
      id: 'base-ground-civil/bicycle', label: 'Bicycle', category: 'ground',
      era: 'contemporary', lenMm: 1800, dims: [600, 1800, 1100],
      body: '#1f6fb2', accent: '#d8dde3', surfaces: ['ground'],
      prims: [
        wheel(0, -525, 340, 56),                                // front wheel
        wheel(0, 525, 340, 56),                                 // rear wheel
        box([46, 60, 730], [0, 480, -125], 'body', [33.2, 0, 0]),     // down tube
        box([44, 62, 706], [0, 610, 305], 'body', [-69.3, 0, 0]),     // seat tube
        box([42, 58, 791], [0, 765, -40], 'body', [-9.5, 0, 0]),      // top tube
        box([160, 40, 350], [0, 310, 352], 'body', [-9.9, 0, 0]),     // chain stays
        box([140, 38, 548], [0, 610, 477], 'body', [80, 0, 0]),       // seat stays
        box([132, 42, 334], [0, 500, -477], 'accent', [-73.4, 0, 0]), // fork
        box([52, 340, 52], [0, 730, -455], 'accent'),           // head tube
        box([38, 130, 60], [0, 900, -462], 'accent'),           // stem
        cyl([26, 26, 520], [0, 960, -470], 'accent', [0, 0, 90]),     // handlebar
        box([120, 70, 280], [0, 950, 400], 'dark'),             // saddle
        cyl([110, 110, 30], [55, 280, 180], 'dark', [0, 0, 90]),      // chainring
      ],
    },
  ],
};

export default pack;
export { pack };
