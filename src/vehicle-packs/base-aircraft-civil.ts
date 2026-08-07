// Aircraft ▸ Civil — builtin base pack (dynamic-import only).
//
// First wave from docs/research/vehicle-model-library.md §3.2 rows 1–8, authored
// at REAL mm scale. Real names throughout except the 737/A320 row, which the
// research deliberately frames as a generic family rather than one type.
//
// Model-local frame: −Z = nose, +Y = up, origin = the hull CENTRE.
import type { VehiclePackDef } from '../vehicles.js';
import {
  box, cyl, tube, noseCone, propBlades, mirrorX,
} from './prims.js';

const BANNER: ('ground' | 'banner' | 'adsb')[] = ['banner'];

const pack: VehiclePackDef = {
  id: 'base-aircraft-civil', version: 2, label: 'Civil',
  path: ['Aircraft', 'Civil'], builtin: true,
  models: [
    // ── Boeing 747 70.6 × 64.4 × 19.4 m ──────────────────────────────────────
    // Cue: THE HUMP. Everything else is a generic widebody, so the upper deck
    // does all the recognition work and is deliberately over-proud.
    {
      id: 'base-aircraft-civil/b747', label: 'Boeing 747',
      category: 'aircraft', era: '1970–present', lenMm: 70600, dims: [64400, 70600, 19400],
      body: '#eceff2', accent: '#2f6fb0', surfaces: BANNER,
      prims: [
        tube(3000, 56000, [0, 0, 3000], 'body'),
        noseCone(2900, 7000, [0, -200, -34500], 'body'),
        box([4400, 2600, 14000], [0, 2500, -24000], 'body'),     // the UPPER-DECK hump
        box([3600, 1200, 2400], [0, 3160, -30400], 'glass'),     // cockpit glazing (roof inside the hump's)
        ...mirrorX([box([26000, 500, 9000], [16000, -900, 3000], 'body', [0, -30, 0])]),
        ...mirrorX([tube(1500, 6000, [9000, -2600, -3000], 'accent')]),    // inboard engines
        ...mirrorX([box([400, 2400, 2600], [17500, -2300, -1400], 'accent')]),  // outboard pylons
        ...mirrorX([tube(1500, 6000, [17500, -3400, -300], 'accent')]),    // outboard engines
        box([22000, 400, 6000], [0, 1800, 30000], 'body'),       // tailplane
        box([400, 9500, 11000], [0, 7000, 30500], 'accent'),     // tall swept fin
      ],
    },

    // ── Douglas DC-3 19.7 × 29.0 × 5.16 m ────────────────────────────────────
    // Cues: TAIL-DRAGGER stance (nose high, tailwheel), two radial engines,
    // polished bare-metal skin.
    {
      id: 'base-aircraft-civil/dc3', label: 'Douglas DC-3',
      category: 'aircraft', era: '1935–present', lenMm: 19700, dims: [29000, 19700, 5160],
      body: '#c5cad0', accent: '#2b3a4a', surfaces: BANNER,
      prims: [
        tube(1150, 13000, [0, 0, 800], 'body'),
        noseCone(1100, 3400, [0, 150, -7400], 'body'),
        box([1600, 700, 1800], [0, 900, -5000], 'glass'),        // flight-deck glazing
        box([29000, 220, 3000], [0, -500, -600], 'body'),        // wing
        ...mirrorX([tube(720, 3220, [4300, -350, -2310], 'accent')]),      // radial nacelles (reach the props)
        ...mirrorX([...propBlades([4300, -350, -3900], 3400, 1)]),
        box([8000, 160, 1900], [0, 300, 7000], 'body'),          // tailplane
        box([200, 2600, 3000], [0, 1600, 7300], 'accent'),       // rounded fin
        cyl([200, 200, 500], [0, -1100, 7000], 'dark'),          // tailwheel
        ...mirrorX([box([160, 1000, 700], [2300, -1000, -2200], 'dark')]),  // main gear legs
        ...mirrorX([cyl([420, 420, 300], [2300, -1500, -2400], 'dark', [0, 0, 90])]),
      ],
    },

    // ── Concorde 61.7 × 25.6 × 12.2 m ────────────────────────────────────────
    // Cues: needle nose (DROOPED), ogival delta, four engines in two underwing
    // boxes.
    {
      id: 'base-aircraft-civil/concorde', label: 'Concorde',
      category: 'aircraft', era: '1976–2003', lenMm: 61700, dims: [25600, 61700, 12200],
      body: '#f2f4f6', accent: '#1e5aa0', surfaces: BANNER,
      prims: [
        tube(1500, 38000, [0, 0, 6000], 'body'),
        noseCone(1400, 12000, [0, -300, -18000], 'body'),        // long forebody
        noseCone(320, 6200, [0, -1400, -26900], 'body'),       // DROOPED needle (grown into the forebody)
        box([25600, 380, 34000], [0, -600, 10000], 'body'),      // ogival delta
        ...mirrorX([box([3600, 2300, 12000], [4600, -1700, 15000], 'accent')]),  // engine boxes (grown up to the delta)
        box([500, 6000, 8000], [0, 4200, 26000], 'accent'),      // fin
      ],
    },

    // ── Cessna 172 Skyhawk 8.28 × 11.0 × 2.72 m ──────────────────────────────
    // Cues: HIGH strut-braced wing, fixed tricycle gear — the default "small
    // plane" shape.
    {
      id: 'base-aircraft-civil/cessna172', label: 'Cessna 172 Skyhawk',
      category: 'aircraft', era: '1956–present', lenMm: 8280, dims: [11000, 8280, 2720],
      body: '#f0f2f4', accent: '#c0281f', surfaces: BANNER,
      prims: [
        box([1100, 1050, 4600], [0, 0, 300], 'body'),
        noseCone(480, 1400, [0, 100, -3100], 'body'),
        noseCone(150, 380, [0, 100, -3900], 'accent'),           // spinner
        ...propBlades([0, 100, -4060], 1900, 2),
        box([1000, 520, 1500], [0, 620, -700], 'glass'),         // cabin glazing
        box([11000, 110, 1600], [0, 1000, -600], 'body'),        // HIGH wing
        ...mirrorX([cyl([50, 50, 1300], [1900, 400, -400], 'body', [0, 0, 30])]),  // lift struts
        box([3400, 90, 900], [0, 200, 3100], 'body'),
        box([80, 960, 1000], [0, 670, 3300], 'accent'),          // swept fin (root into the tailplane)
        box([2680, 400, 220], [0, -600, -1400], 'dark'),          // spring-steel main gear bow
        ...mirrorX([cyl([260, 260, 180], [1250, -900, -1400], 'dark', [0, 0, 90])]),
        box([140, 700, 200], [0, -700, -2700], 'dark'),           // nose gear leg
        cyl([220, 220, 160], [0, -900, -2700], 'dark', [0, 0, 90]),       // nose wheel
      ],
    },

    // ── Piper J-3 Cub 6.83 × 10.74 × 2.03 m ──────────────────────────────────
    // Cues: CUB YELLOW with a black lightning stripe, high wing, tailwheel.
    {
      id: 'base-aircraft-civil/piper_cub', label: 'Piper J-3 Cub',
      category: 'aircraft', era: '1938–1947', lenMm: 6830, dims: [10740, 6830, 2030],
      body: '#f2c40f', accent: '#1a1c1f', surfaces: BANNER,
      prims: [
        box([760, 880, 4200], [0, 0, 300], 'body'),
        box([800, 120, 3400], [0, 120, 320], 'accent'),          // lightning stripe
        noseCone(360, 1410, [0, 120, -2455], 'accent'),          // cowl (fuselage → prop)
        ...propBlades([0, 120, -3160], 1750, 2),
        box([10740, 92, 1500], [0, 830, -400], 'body'),          // high wing
        ...mirrorX([cyl([44, 44, 1150], [1700, 320, -380], 'accent', [0, 0, 26])]),
        box([2800, 78, 1000], [0, 180, 2500], 'body'),
        box([64, 760, 800], [0, 560, 2700], 'body'),
        box([1900, 300, 200], [0, -500, -1200], 'dark'),          // split-axle gear cross member
        ...mirrorX([cyl([250, 250, 150], [880, -800, -1200], 'dark', [0, 0, 90])]),
        box([90, 1000, 160], [0, -250, 2600], 'dark'),            // tailwheel leg
        cyl([120, 120, 110], [0, -700, 2600], 'dark', [0, 0, 90]),        // tailwheel
      ],
    },

    // ── DHC-2 Beaver (float-equipped) 9.22 × 14.63 × 2.74 m ──────────────────
    // Cues: the FLOATS — the configuration the type is pictured in — plus a
    // radial cowl and a big square high wing.
    {
      id: 'base-aircraft-civil/dhc2_beaver', label: 'DHC-2 Beaver (floats)',
      category: 'aircraft', era: '1947–present', lenMm: 9220, dims: [14630, 9220, 2740],
      body: '#e8ebee', accent: '#1e6f4a', surfaces: BANNER,
      prims: [
        box([1250, 1350, 5000], [0, 300, 300], 'body'),
        tube(540, 900, [0, 400, -2600], 'accent'),               // radial cowl
        ...propBlades([0, 400, -3200], 2600, 2),
        box([1150, 560, 1600], [0, 950, -600], 'glass'),
        box([14630, 130, 1900], [0, 1300, -500], 'body'),        // high wing
        ...mirrorX([cyl([54, 54, 1500], [2300, 620, -400], 'body', [0, 0, 32])]),
        box([3800, 100, 1100], [0, 500, 3300], 'body'),
        box([90, 1210, 1200], [0, 1120, 3500], 'accent'),        // fin root into the tailplane
        ...mirrorX([box([560, 420, 7000], [900, -1000, -300], 'accent')]),   // FLOATS
        ...mirrorX([cyl([56, 56, 900], [900, -350, -1400], 'dark')]),        // float struts
      ],
    },

    // ── Lockheed Super Constellation 34.7 × 37.6 × 7.56 m ────────────────────
    // Cues: the TRIPLE tail fins and the dolphin-curved fuselage, four radials.
    {
      id: 'base-aircraft-civil/super_constellation', label: 'Lockheed Super Constellation',
      category: 'aircraft', era: '1943–1958', lenMm: 34700, dims: [37600, 34700, 7560],
      body: '#dfe3e7', accent: '#8b1f24', surfaces: BANNER,
      prims: [
        // Fuselage as ONE tapered barrel (rot x=90 puts the cylinder's +Y end
        // aft, so rTop is the TAIL radius and rBot the nose) — the dolphin
        // profile in a single prim, keeping the triple tail inside the budget.
        { shape: 'cylinder', size: [1150, 1500, 27000], pos: [0, 0, -600],
          rot: [90, 0, 0], color: 'body' },
        box([37600, 300, 4200], [0, -400, -1200], 'body'),       // wing
        ...mirrorX([tube(880, 4420, [4800, -260, -3710], 'accent')]),      // reach the props
        ...mirrorX([tube(820, 4180, [10200, -400, -3790], 'accent')]),
        ...mirrorX([...propBlades([4800, -260, -5900], 4700, 1)]),
        ...mirrorX([...propBlades([10200, -400, -5850], 4700, 1)]),
        box([12000, 220, 2600], [0, 700, 12800], 'body'),        // tailplane
        box([260, 3000, 2800], [0, 2100, 13000], 'accent'),      // CENTRE fin
        ...mirrorX([box([240, 2800, 2600], [5500, 2000, 13000], 'accent')]),  // outer fins
      ],
    },

    // ── Modern narrowbody (737 / A320 family) ~37.6 × 34.3 × 12 m ────────────
    // The default airliner silhouette: underwing pods, single aisle, swept fin.
    // Labelled generically because the row stands for a FAMILY, not one type.
    {
      id: 'base-aircraft-civil/narrowbody', label: 'Modern narrowbody jet',
      category: 'aircraft', era: '1968–present', lenMm: 37600, dims: [34300, 37600, 12000],
      body: '#f0f2f5', accent: '#26456e', surfaces: BANNER,
      prims: [
        tube(1900, 30000, [0, 0, 1200], 'body'),
        noseCone(1850, 4400, [0, -150, -18200], 'body'),
        box([2200, 900, 1800], [0, 1300, -15400], 'glass'),
        ...mirrorX([box([15000, 320, 5200], [9000, -700, 2400], 'body', [0, -26, 0])]),
        ...mirrorX([tube(1150, 4400, [6600, -1900, -1400], 'accent')]),    // underwing pods
        box([12800, 260, 3200], [0, 1000, 15600], 'body'),       // tailplane
        box([300, 5600, 6200], [0, 4200, 16200], 'accent'),      // swept fin
      ],
    },
  ],
};

export default pack;
export { pack };
