// Ground Vehicles ▸ Military & Historical — builtin base pack (dynamic-import only).
//
// First wave from docs/research/vehicle-model-library.md §3.6 (★ rows), authored
// at REAL mm scale. IP posture (§5.3): these are historical / government /
// public-hardware silhouettes, so they carry their REAL names in the UI — the
// same posture the shipped BG_CRAFTS military roster already takes.
// Model-local frame: −Z = nose, y = 0 = ground, origin = footprint centre.
import type { VehiclePackDef } from '../vehicles.js';
import { box, cyl, sph, lamps, wheels4, trackUnit } from './prims.js';

const AMBER = '#ffe9b0';
const RED = '#c62828';

const pack: VehiclePackDef = {
  id: 'base-ground-military', version: 2, label: 'Military & Historical',
  path: ['Ground Vehicles', 'Military & Historical'], builtin: true,
  models: [
    // ── Ford Model T (1908–1927) 3.4 × 1.7 × 2.1 m ───────────────────────────
    // Cues: tall narrow brass-era body, thin big-diameter spoked wheels, a flat
    // canvas top on visible corner posts.
    {
      id: 'base-ground-military/model_t', label: 'Brass-era antique car', category: 'ground',
      era: 'historical', lenMm: 3400, dims: [1700, 3400, 2100],
      body: '#16181b', accent: '#8d6a2f', surfaces: ['ground'],
      prims: [
        box([1240, 540, 3100], [0, 620, 0], 'body'),            // chassis body
        box([1060, 720, 1080], [0, 960, -960], 'body'),         // engine hood
        box([820, 640, 140], [0, 1120, -1560], 'accent'),       // brass radiator shell
        box([1340, 780, 1500], [0, 1160, 620], 'body'),         // passenger tub
        box([1200, 560, 70], [0, 1620, -180], 'glass'),         // upright windshield
        cyl([42, 42, 800], [-620, 1560, -150], 'body'),         // top post FL
        cyl([42, 42, 800], [620, 1560, -150], 'body'),          // top post FR
        cyl([42, 42, 800], [-620, 1560, 1240], 'body'),         // top post RL
        cyl([42, 42, 800], [620, 1560, 1240], 'body'),          // top post RR
        box([1400, 100, 1700], [0, 1990, 520], 'accent'),       // canvas top
        sph(140, [-430, 1280, -1520], AMBER),                   // brass headlamp L
        sph(140, [430, 1280, -1520], AMBER),                    // brass headlamp R
        ...wheels4(1420, -1060, 1060, 430, 120),                // tall skinny wheels
      ],
    },

    // ── Volkswagen Beetle (Type 1) 4.08 × 1.54 × 1.50 m ──────────────────────
    // Cues: rounded "bug" dome cabin + a rear ENGINE hump + tiny wheels.
    {
      id: 'base-ground-military/beetle', label: 'Classic round-bodied compact', category: 'ground',
      era: 'historical', lenMm: 4080, dims: [1540, 4080, 1500],
      body: '#3f8f6a', accent: '#dfe3e7', surfaces: ['ground'],
      prims: [
        box([1460, 620, 3800], [0, 520, 0], 'body'),            // lower body
        sph(360, [0, 640, -1400], 'body'),                      // rounded front boot
        box([1180, 700, 1900], [0, 1020, 120], 'body'),         // cabin core
        sph(560, [0, 860, 120], 'body'),                        // dome roof
        box([1260, 400, 1660], [0, 1120, 120], 'glass'),        // wraparound glass band
        box([980, 380, 950], [0, 1000, 1420], 'body'),          // rear engine hump
        box([620, 90, 420], [0, 1160, 1830], 'dark'),           // engine-lid vents
        sph(170, [-500, 900, -1740], AMBER),                    // headlamp L
        sph(170, [500, 900, -1740], AMBER),                     // headlamp R
        ...lamps(560, 1020, 1930, RED, [170, 190, 50]),
        ...wheels4(1300, -1320, 1300, 300, 200),
      ],
    },

    // ── VW Type 2 "Microbus" 4.28 × 1.75 × 1.94 m ────────────────────────────
    // Cues: FLAT front face with a proud V, two-tone split at the belt line.
    {
      id: 'base-ground-military/microbus', label: 'Classic split-window van', category: 'ground',
      era: 'historical', lenMm: 4280, dims: [1750, 4280, 1940],
      body: '#c25b32', accent: '#eef1f4', surfaces: ['ground'],
      prims: [
        box([1700, 1180, 4200], [0, 660, 0], 'body'),           // lower two-tone half
        box([1660, 760, 4120], [0, 1560, 0], 'accent'),         // upper two-tone half
        box([1720, 520, 3300], [0, 1500, 150], 'glass'),        // window band
        box([1300, 400, 70], [0, 1300, -2140], 'accent'),       // proud "V" panel
        box([260, 460, 90], [0, 1420, -2170], 'body'),          // V centre spine
        box([1500, 130, 100], [0, 700, -2160], 'accent'),       // front bumper
        box([1500, 130, 100], [0, 700, 2160], 'accent'),        // rear bumper
        sph(160, [-580, 1120, -2160], AMBER),                   // headlamp L
        sph(160, [580, 1120, -2160], AMBER),                    // headlamp R
        ...lamps(640, 1250, 2180, RED, [180, 200, 50]),
        ...wheels4(1440, -1350, 1300, 320, 210),
      ],
    },

    // ── Willys MB Jeep (WWII) 3.36 × 1.57 × 1.32 m ───────────────────────────
    // Cues: slatted flat grille, flat fenders standing proud, folding windshield.
    {
      id: 'base-ground-military/jeep_willys', label: 'Willys MB Jeep', category: 'ground',
      era: 'wwii', lenMm: 3360, dims: [1570, 3360, 1320],
      body: '#4a5230', accent: '#39402a', surfaces: ['ground'],
      prims: [
        box([1380, 560, 3200], [0, 500, 0], 'body'),            // body tub
        box([1020, 440, 1000], [0, 950, -1020], 'body'),        // hood
        box([1060, 520, 110], [0, 930, -1540], 'accent'),       // grille panel
        box([80, 400, 60], [-300, 930, -1580], 'dark'),         // grille slat L
        box([80, 400, 60], [0, 930, -1580], 'dark'),            // grille slat C
        box([80, 400, 60], [300, 930, -1580], 'dark'),          // grille slat R
        box([300, 110, 1700], [-660, 830, -740], 'body'),       // flat fender L
        box([300, 110, 1700], [660, 830, -740], 'body'),        // flat fender R
        box([1280, 460, 80], [0, 1090, -420], 'glass'),         // folding windshield
        box([1120, 130, 720], [0, 830, 340], 'dark'),           // bench seats
        // Spare wheel MOUNTED ON the rear panel: the tyre FACE is parallel to
        // that panel, so the cylinder axis runs along the vehicle's LENGTH (+Z)
        // — rot [90,0,0], NOT the road-wheel roll [0,0,90] the `wheel()` helper
        // bakes in (which stood it up like a fifth road wheel). Its rear 50 mm
        // buries into the tub's back face rather than sitting flush on it.
        cyl([340, 340, 200], [0, 760, 1650], 'dark', [90, 0, 0]),
        sph(130, [-330, 1080, -1560], AMBER),                   // headlamp L
        sph(130, [330, 1080, -1560], AMBER),                    // headlamp R
        ...wheels4(1340, -1060, 1060, 340, 230),
      ],
    },

    // ── HMMWV / Humvee 4.57 × 2.16 × 1.75 m ──────────────────────────────────
    // Cues: unusually WIDE flat body, huge ground clearance, sloped hood.
    {
      id: 'base-ground-military/humvee', label: 'HMMWV (Humvee)', category: 'ground',
      era: 'modern', lenMm: 4570, dims: [2160, 4570, 1750],
      body: '#5a5f43', accent: '#41462f', surfaces: ['ground'],
      prims: [
        box([2100, 520, 4400], [0, 860, 0], 'body'),            // high hull
        box([1960, 380, 1400], [0, 1120, -1520], 'body', [-8, 0, 0]),  // sloped hood
        box([1740, 640, 2000], [0, 1400, 380], 'body'),         // cab
        box([1820, 400, 1780], [0, 1470, 320], 'glass'),        // glazing
        box([1680, 130, 1900], [0, 1690, 420], 'accent'),       // flat roof
        box([2160, 200, 3200], [0, 640, 0], 'accent'),          // rocker skirt
        box([1900, 220, 120], [0, 1000, -2260], 'accent'),      // brush bar
        ...lamps(760, 1180, -2230, AMBER, [280, 200, 70]),
        ...lamps(820, 1150, 2230, RED, [200, 200, 50]),
        ...wheels4(1880, -1420, 1450, 420, 330),
      ],
    },

    // ── M4 Sherman (WWII) 5.84 × 2.62 × 2.74 m ───────────────────────────────
    // Cues: ROUNDED cast turret, tall narrow hull, continuous tracks.
    {
      id: 'base-ground-military/sherman', label: 'M4 Sherman tank', category: 'ground',
      era: 'wwii', lenMm: 5840, dims: [2620, 5840, 2740],
      body: '#4d5535', accent: '#3a4128', surfaces: ['ground'],
      prims: [
        // Tracks read as TRACKS, not tyres: width ≈ 24 % of the hull width
        // (620 of 2620), outer edge held on the declared half-width 1310 so the
        // footprint is unchanged. The scale-true 440 mm belt looked like a rail.
        ...trackUnit(-1000, 5200, 400, 620),                    // track L
        ...trackUnit(1000, 5200, 400, 620),                     // track R
        box([1960, 760, 5000], [0, 940, 100], 'body'),          // lower hull
        box([1900, 520, 3200], [0, 1560, 300], 'body'),         // upper hull
        cyl([720, 800, 720], [0, 2020, 350], 'body'),           // cast turret
        sph(300, [0, 2340, 620], 'body'),                       // commander cupola
        cyl([95, 95, 3200], [0, 2020, -1500], 'accent', [90, 0, 0]),   // 75 mm gun
        box([700, 260, 500], [0, 2100, 1300], 'accent'),        // stowage box
      ],
    },

    // ── M1 Abrams 9.77 (gun-forward) × 3.66 × 2.44 m ─────────────────────────
    // Cues: ANGULAR faceted armour, very long smoothbore gun, low flat turret.
    {
      id: 'base-ground-military/abrams', label: 'M1 Abrams tank', category: 'ground',
      era: 'modern', lenMm: 9770, dims: [3660, 9770, 2440],
      body: '#6b6a52', accent: '#55543f', surfaces: ['ground'],
      prims: [
        // Same rule as the Sherman: 820 of 3660 ≈ 22 %, outer edge on the
        // declared half-width 1830.
        ...trackUnit(-1420, 7200, 380, 820, 700),               // track L
        ...trackUnit(1420, 7200, 380, 820, 700),                // track R
        box([2960, 620, 7000], [0, 830, 700], 'body'),          // hull
        box([2700, 300, 2600], [0, 1200, -1500], 'body', [-14, 0, 0]),  // sloped glacis
        box([2480, 700, 3600], [0, 1620, 1300], 'body'),        // turret
        box([2200, 220, 3000], [0, 2030, 1400], 'accent'),      // turret roof deck
        cyl([105, 105, 5800], [0, 1720, -2100], 'accent', [90, 0, 0]),  // 120 mm smoothbore
        box([1900, 380, 620], [0, 1900, 3300], 'accent'),       // bustle rack
        box([700, 150, 130], [0, 2170, 900], 'dark'),           // commander hatch
      ],
    },
  ],
};

export default pack;
export { pack };
