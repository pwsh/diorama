// Space ▸ Real — builtin base pack (dynamic-import only).
//
// From docs/research/vehicle-model-library.md §3.3, the ★ rows MINUS row 2
// (the Space Shuttle orbiter, already hand-built as BG_CRAFTS `shuttle`) —
// which leaves THREE launch vehicles, not the four §5.1's taxonomy table claims
// (that count included the already-shipped shuttle; reported as a stale doc
// figure). Two surface ROVERS were added later, taking the pack to five.
//
// The three LAUNCH VEHICLES carry `vertical: true` (authored upright, +Y up;
// the LM has no nose): they are authored UPRIGHT along +Y (engines down) rather
// than nose-forward along −Z, so they fly the banner orbit standing up — the
// research's "vertical-launch novelty" framing, and the only pose in which a
// rocket towing a side banner reads. The flag also switches the banner standoff
// onto the hull DIAMETER (`dims[1]`) so a 110 m stack does not trail its message
// a hundred metres astern. See `bannerCraftHullZMm` in vehicles.ts.
//
// The two ROVERS are the exception in this pack, and the reason SURFACE (not
// category) is what decides how a model is authored and consumed: they are space
// hardware by category — they belong in this tree, not under Ground Vehicles —
// but they drive on a surface, so they declare `surfaces: ['ground']` and are
// authored the ground way (origin = footprint centre at y = 0, front = −Z). They
// place as ordinary yard furniture through `vehicleRecipe`; they never tow a
// banner. Nothing here is ever both.
//
// Model-local frame: −Z = nose / front, +Y = up throughout; origin = the hull
// CENTRE for the sky craft, the footprint centre at ground level for the rovers.
import type { VehiclePackDef } from '../vehicles.js';
import { box, cone, cyl, engineBell, mirrorX, wheels4, wheels6 } from './prims.js';

const BANNER: ('ground' | 'banner' | 'adsb')[] = ['banner'];
const GROUND: ('ground' | 'banner' | 'adsb')[] = ['ground'];
const WHITE = '#eef1f4';
const SOOT = '#1b1e22';

const pack: VehiclePackDef = {
  id: 'base-space-real', version: 2, label: 'Real',
  path: ['Space', 'Real'], builtin: true,
  models: [
    // ── Saturn V 110.6 m tall × 10.1 m dia ───────────────────────────────────
    // Cues: the three-stage step-down taper, the black roll patterns, the
    // spindly escape tower on top, five engine bells at the base.
    {
      id: 'base-space-real/saturn_v', label: 'Saturn V', category: 'space',
      era: 'Apollo (1967–1973)', lenMm: 110600, dims: [10100, 10100, 110600],
      vertical: true, body: WHITE, accent: SOOT, surfaces: BANNER,
      prims: [
        cyl([5050, 5050, 42000], [0, -34000, 0], 'body'),        // S-IC first stage
        box([10300, 5000, 1400], [0, -46000, 0], 'accent'),      // black roll pattern
        cyl([5050, 5050, 5000], [0, -10500, 0], 'accent'),       // S-IC/S-II interstage
        cyl([5050, 5050, 19000], [0, 1500, 0], 'body'),          // S-II second stage
        cyl([3300, 5050, 3600], [0, 12800, 0], 'accent'),        // tapered interstage
        cyl([3300, 3300, 17800], [0, 23500, 0], 'body'),         // S-IVB third stage
        cyl([1950, 1950, 11000], [0, 37900, 0], 'accent'),       // CSM stack
        cyl([420, 420, 10000], [0, 48400, 0], 'body'),           // escape tower
        cyl([80, 420, 2400], [0, 54600, 0], 'accent'),           // tower motor cap
        // Five F-1s: one centre plus four on the axes. The ±Z pair is written
        // out — mirrorX only mirrors ACROSS x, so an on-centreline prim would
        // just be duplicated in place.
        ...mirrorX([engineBell(1100, 3000, [2600, -56300, 0], '#ff8a3d')]),
        engineBell(1100, 3000, [0, -56300, 2600], '#ff8a3d'),
        engineBell(1100, 3000, [0, -56300, -2600], '#ff8a3d'),
        engineBell(1100, 3000, [0, -56300, 0], '#ff8a3d'),       // centre F-1
      ],
    },

    // ── Apollo Lunar Module ~7.0 m tall × 9.4 m across the deployed legs ─────
    // Cues: the gold-foil octagonal descent stage, the lopsided ascent cabin
    // with its two triangular windows, four splayed spider legs.
    {
      id: 'base-space-real/lunar_module', label: 'Apollo Lunar Module', category: 'space',
      era: 'Apollo (1969–1972)', lenMm: 7000, dims: [9400, 9400, 7000],
      vertical: true, body: '#c9a227', accent: '#b8bec6', surfaces: BANNER,
      prims: [
        box([4200, 1700, 4200], [0, -1900, 0], 'body'),          // gold descent stage
        box([3400, 2100, 3000], [0, 800, -200], 'accent'),       // ascent cabin
        box([1500, 700, 700], [0, 1200, -1800], 'glass'),        // forward window bay
        cyl([520, 520, 900], [0, 2300, -200], 'accent'),         // docking tunnel
        // Four legs on the axes, splayed outward: about +Z the top leans −X
        // (bottom out), about +X the top leans +Z (bottom out).
        ...mirrorX([cyl([120, 120, 3200], [2400, -3000, 0], 'accent', [0, 0, 20])]),
        cyl([120, 120, 3200], [0, -3000, 2400], 'accent', [-20, 0, 0]),
        cyl([120, 120, 3200], [0, -3000, -2400], 'accent', [20, 0, 0]),
      ],
    },

    // ── SpaceX Falcon 9 70 m tall × 3.7 m dia ────────────────────────────────
    // Cues: the slim all-white booster with the BLACK interstage band, four
    // gridfins, four landing legs, one lit engine.
    {
      id: 'base-space-real/falcon9', label: 'SpaceX Falcon 9', category: 'space',
      era: '2010–present', lenMm: 70000, dims: [3700, 3700, 70000],
      vertical: true, body: WHITE, accent: SOOT, surfaces: BANNER,
      prims: [
        cyl([1850, 1850, 42000], [0, -13500, 0], 'body'),        // first stage
        cyl([1900, 1900, 3200], [0, 9100, 0], 'accent'),         // black interstage
        cyl([1850, 1850, 13000], [0, 17200, 0], 'body'),         // second stage
        cyl([1850, 1850, 3000], [0, 25200, 0], 'body'),          // fairing base
        cyl([120, 1850, 8000], [0, 30700, 0], 'body'),           // fairing nose taper
        ...mirrorX([box([1400, 140, 1100], [2200, 6500, 0], 'accent')]),      // gridfins ±X
        box([1100, 140, 1400], [0, 6500, 2200], 'accent'),                    // gridfins ±Z
        box([1100, 140, 1400], [0, 6500, -2200], 'accent'),
        ...mirrorX([cyl([160, 160, 6000], [1900, -34000, 0], 'accent', [0, 0, 22])]),
        cyl([160, 160, 6000], [0, -34000, 1900], 'accent', [-22, 0, 0]),      // legs ±Z
        cyl([160, 160, 6000], [0, -34000, -1900], 'accent', [22, 0, 0]),
        engineBell(900, 2600, [0, -35800, 0], '#7fd4ff'),        // lit centre engine
      ],
    },

    // ── Apollo Lunar Roving Vehicle 3.1 × 1.8 × 1.14 m ───────────────────────
    // GROUND-placeable (see the header note): the moon buggy parks in a yard at
    // true size. Cues: an open skeletal chassis with nothing above the seats,
    // four wire-mesh wheels under square fenders, two folding mesh seats, and
    // the forward mast pair — the umbrella high-gain dish plus the TV camera.
    {
      id: 'base-space-real/lunar_rover', label: 'Apollo Lunar Roving Vehicle',
      category: 'space', era: 'Apollo (1971–1972)',
      lenMm: 3100, dims: [1800, 3100, 1140],
      body: '#b9c0c7', accent: '#2f343a', surfaces: GROUND,
      prims: [
        box([1240, 90, 2400], [0, 400, 0], 'accent'),            // chassis floor pan
        box([1100, 120, 500], [0, 470, -1250], 'body'),          // forward equipment deck
        box([1160, 260, 620], [0, 560, 1150], 'body'),           // rear tool / sample pallet
        // Two folding seats, and a square fender arching over each wheel (the
        // fender's underside buries 40 mm into the tyre crown).
        ...mirrorX([
          box([460, 90, 460], [330, 560, -60], 'accent'),        // seat pan
          box([460, 520, 90], [330, 820, 200], 'accent'),        // seat back
          box([300, 80, 900], [780, 800, -1150], 'body'),        // fender, front
          box([300, 80, 900], [780, 800, 1150], 'body'),         // fender, rear
        ]),
        box([180, 240, 140], [0, 700, -560], 'accent'),          // control console
        cyl([40, 40, 560], [0, 810, -1180], 'body'),             // high-gain antenna mast
        cone([400, 180], [0, 1120, -1180], '#e8ecef', [180, 0, 0]),  // umbrella dish (mouth up)
        cyl([36, 36, 460], [-420, 750, -1150], 'body'),          // TV camera mast
        box([160, 160, 180], [-420, 1040, -1150], 'accent'),     // TV camera head
        ...wheels4(1560, -1150, 1150, 400, 240),                 // wire-mesh wheels
      ],
    },

    // ── Perseverance Mars rover 3.0 × 2.7 × 2.2 m ────────────────────────────
    // GROUND-placeable. Cues: six wheels on a VISIBLE rocker-bogie (a long
    // rocker over the front pair, a short bogie over the rear pair, per side),
    // the boxy warm-electronics body, the camera mast head with two eyes, the
    // stowed arm, and the MMRTG finned block angled up-and-back off the tail.
    {
      id: 'base-space-real/mars_rover', label: 'Perseverance Mars rover',
      category: 'space', era: '2021–present',
      lenMm: 3000, dims: [2700, 3000, 2200],
      body: '#c9ced4', accent: '#6f767e', surfaces: GROUND,
      prims: [
        box([1400, 620, 1900], [0, 1000, 0], 'body'),            // warm electronics box
        box([1500, 90, 2000], [0, 1330, 0], 'accent'),           // equipment deck plate
        box([820, 420, 900], [0, 1350, 1350], 'accent', [-25, 0, 0]),   // MMRTG block (tail-up)
        ...mirrorX([box([70, 620, 940], [300, 1350, 1350], 'accent', [-25, 0, 0])]),  // RTG fins
        cyl([70, 70, 820], [-380, 1760, -700], 'accent'),        // camera mast
        box([560, 240, 220], [-380, 2060, -700], 'body'),        // mast head
        cyl([70, 70, 60], [-530, 2060, -830], 'glass', [90, 0, 0]),     // camera eye L
        cyl([70, 70, 60], [-230, 2060, -830], 'glass', [90, 0, 0]),     // camera eye R
        box([150, 150, 900], [320, 820, -1150], 'accent', [-22, 0, 0]), // stowed robotic arm
        // Rocker-bogie: the arms are what make six wheels read as a suspension
        // rather than a six-wheeled cart.
        ...mirrorX([
          box([70, 90, 1300], [1150, 640, -450], 'accent', [-14, 0, 0]),  // rocker
          box([70, 90, 900], [1150, 560, 700], 'accent', [10, 0, 0]),     // bogie
        ]),
        ...wheels6(2300, -1000, 0, 1000, 262, 400),              // three wheels per side
      ],
    },
  ],
};

export default pack;
export { pack };
