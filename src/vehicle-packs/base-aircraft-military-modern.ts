// Aircraft ▸ Military ▸ Cold War & Modern — builtin base pack (dynamic-import
// only).
//
// From docs/research/vehicle-model-library.md §3.1 rows 11–24, MINUS the five
// airframes already hand-built in BG_CRAFTS (f16 / f22 / apache / b2 / b52) —
// those stay in the shipped roster and are deliberately not duplicated here.
// Authored at REAL mm scale; real names per the §5.3 IP posture.
//
// Model-local frame: −Z = nose, +Y = up, origin = the hull CENTRE.
import type { VehiclePackDef } from '../vehicles.js';
import {
  box, cyl, sph, tube, noseCone, tailCone, propBlades, rotorBlades,
  tailRotorBlades, mirrorX,
} from './prims.js';

const BANNER: ('ground' | 'banner' | 'adsb')[] = ['banner'];

const pack: VehiclePackDef = {
  id: 'base-aircraft-military-modern', version: 1, label: 'Cold War & Modern',
  path: ['Aircraft', 'Military', 'Cold War & Modern'], builtin: true,
  models: [
    // ── Grumman F-14 Tomcat 19.1 × 19.55/11.65 (swept) × 4.88 m ──────────────
    // Cues: variable-sweep wings (authored MID-SWEEP, the pose it is remembered
    // in), twin CANTED tails, wide flat body between two engine tunnels.
    {
      id: 'base-aircraft-military-modern/f14', label: 'Grumman F-14 Tomcat',
      category: 'aircraft', era: 'Cold War', lenMm: 19100, dims: [16000, 19100, 4880],
      body: '#8d949c', accent: '#5a626b', surfaces: BANNER,
      prims: [
        box([2000, 900, 12000], [0, 0, 1200], 'body'),           // wide flat body
        noseCone(460, 4200, [0, 100, -6900], 'body'),
        box([760, 420, 2600], [0, 620, -3800], 'glass'),         // tandem canopy
        // Mid-sweep wing panels: the +X tip trails AFT ⇒ rotation.y negative.
        ...mirrorX([box([5200, 150, 2800], [4300, 0, 800], 'accent', [0, -26, 0])]),
        ...mirrorX([tube(560, 9000, [900, -120, 2800], 'body')]),          // engine tunnels
        ...mirrorX([tailCone(420, 1400, [900, -120, 7600], 'dark')]),      // nozzles
        ...mirrorX([box([120, 1700, 2000], [1500, 1000, 6400], 'accent', [0, 0, -14])]),
        ...mirrorX([box([3200, 120, 1800], [2600, -140, 7400], 'accent')]),  // tailplanes
      ],
    },

    // ── Bell UH-1 "Huey" 12.98 m × 14.6 m rotor × 4.39 m ─────────────────────
    // Cues: the TWO-blade main rotor, the boxy greenhouse cabin, tube skids.
    {
      id: 'base-aircraft-military-modern/uh1_huey', label: 'Bell UH-1 Huey',
      category: 'aircraft', era: 'Vietnam-era', lenMm: 12980, dims: [14600, 12980, 4390],
      body: '#4a5340', accent: '#333a2c', surfaces: BANNER,
      prims: [
        box([2400, 1900, 4600], [0, 0, -1600], 'body'),          // cabin box
        box([2100, 1100, 900], [0, 200, -4100], 'glass'),        // greenhouse nose
        tube(420, 6000, [0, 500, 3200], 'body'),                 // tail boom
        box([90, 1500, 1100], [0, 1200, 5900], 'accent'),        // fin
        box([2600, 90, 700], [0, 700, 5100], 'accent'),          // synchronized elevator
        cyl([160, 160, 700], [0, 1500, -1400], 'dark'),          // rotor mast
        ...rotorBlades([0, 1900, -1400], 14600, 2),              // 2-blade main rotor
        ...tailRotorBlades([320, 1250, 6100], 2600, 2),          // tail rotor
        ...mirrorX([box([120, 110, 3400], [900, -1300, -1700], 'dark')]),  // skids
      ],
    },

    // ── McDonnell Douglas F-15 Eagle 19.43 × 13.05 × 5.63 m ──────────────────
    // Cues: TWO TALL square-topped fins, huge boxy rectangular intakes.
    {
      id: 'base-aircraft-military-modern/f15', label: 'McDonnell Douglas F-15 Eagle',
      category: 'aircraft', era: 'Cold War', lenMm: 19430, dims: [13050, 19430, 5630],
      body: '#9aa1a9', accent: '#6c747d', surfaces: BANNER,
      prims: [
        box([1900, 900, 12000], [0, 0, 1400], 'body'),
        noseCone(470, 4200, [0, 120, -7100], 'body'),
        sph(400, [0, 620, -4200], 'glass'),
        box([13050, 150, 4200], [0, -60, 2000], 'accent'),       // big cropped-delta wing
        ...mirrorX([box([900, 900, 3400], [1150, -200, -1600], 'dark')]),   // boxy intakes
        ...mirrorX([box([130, 2000, 2400], [1100, 1150, 6600], 'body')]),   // TALL twin fins
        ...mirrorX([box([3400, 120, 1900], [2400, -160, 7300], 'accent')]),
        ...mirrorX([tailCone(400, 1200, [850, -140, 7900], 'dark')]),
      ],
    },

    // ── Lockheed C-130 Hercules 29.3 × 40.4 × 11.4 m ─────────────────────────
    // Cues: HIGH wing over a fat fuselage, four turboprops, upswept rear ramp.
    {
      id: 'base-aircraft-military-modern/c130', label: 'Lockheed C-130 Hercules',
      category: 'aircraft', era: 'Cold War–modern', lenMm: 29300, dims: [40400, 29300, 11400],
      body: '#7d8471', accent: '#565c4d', surfaces: BANNER,
      prims: [
        tube(1600, 19000, [0, 0, -1200], 'body'),
        noseCone(1500, 3200, [0, 0, -12300], 'body'),
        tailCone(1500, 6000, [0, 1200, 11200], 'body'),          // UPSWEPT rear ramp
        box([40400, 240, 3400], [0, 1500, -2400], 'body'),       // HIGH wing
        ...mirrorX([tube(560, 4200, [5200, 1300, -3600], 'accent')]),      // inboard nacelles
        ...mirrorX([tube(520, 3900, [10400, 1250, -3700], 'accent')]),     // outboard nacelles
        ...mirrorX([...propBlades([5200, 1300, -5800], 4100, 1)]),
        ...mirrorX([...propBlades([10400, 1250, -5750], 4100, 1)]),
        box([16000, 200, 3000], [0, 1900, 12400], 'body'),       // tailplane
        box([200, 4200, 4000], [0, 3600, 12800], 'accent'),      // tall fin
      ],
    },

    // ── Lockheed U-2 Dragon Lady 19.2 × 31.4 × 4.88 m ────────────────────────
    // Cues: GLIDER-proportioned wing (huge span, tiny chord) on a slim body.
    {
      id: 'base-aircraft-military-modern/u2', label: 'Lockheed U-2 Dragon Lady',
      category: 'aircraft', era: 'Cold War', lenMm: 19200, dims: [31400, 19200, 4880],
      body: '#1e2126', accent: '#33383f', surfaces: BANNER,
      prims: [
        tube(560, 13000, [0, 0, 1400], 'body'),
        noseCone(540, 4000, [0, 0, -7500], 'body'),
        sph(340, [0, 460, -4600], 'glass'),
        box([31400, 130, 1900], [0, 220, -600], 'body'),         // glider wing
        ...mirrorX([box([700, 700, 2400], [820, 0, 700], 'accent')]),      // fuselage intakes
        box([4800, 120, 1500], [0, 200, 7200], 'body'),
        box([140, 2200, 2200], [0, 1300, 7500], 'accent'),
      ],
    },

    // ── Sikorsky UH-60 Black Hawk 19.76 m × 16.4 m rotor × 5.13 m ────────────
    // Cues: FOUR-blade main rotor, canted tail fin, low sleek cabin.
    {
      id: 'base-aircraft-military-modern/uh60', label: 'Sikorsky UH-60 Black Hawk',
      category: 'aircraft', era: 'Modern', lenMm: 19760, dims: [16400, 19760, 5130],
      body: '#3c4148', accent: '#282c31', surfaces: BANNER,
      prims: [
        box([2300, 1700, 6400], [0, 0, -3000], 'body'),          // cabin
        box([2000, 900, 1400], [0, 250, -6600], 'glass'),        // stepped cockpit glass
        tube(420, 6400, [0, 400, 3400], 'body'),                 // tail boom
        box([110, 1900, 1400], [0, 1300, 6400], 'accent', [0, 0, -20]),    // canted fin
        box([3000, 90, 900], [0, 500, 5600], 'accent'),          // stabilator
        cyl([180, 180, 600], [0, 1200, -2800], 'dark'),
        ...rotorBlades([0, 1550, -2800], 16400, 4),              // 4-blade rotor
        ...tailRotorBlades([300, 1500, 6700], 3300, 2),
      ],
    },

    // ── Boeing CH-47 Chinook 29.87 m × 2× 18.3 m rotors × 5.68 m ─────────────
    // Cues: TANDEM twin rotors on fore/aft pylons over a banana fuselage.
    {
      id: 'base-aircraft-military-modern/ch47', label: 'Boeing CH-47 Chinook',
      category: 'aircraft', era: 'Modern', lenMm: 29870, dims: [18300, 29870, 5680],
      body: '#4a5040', accent: '#31362a', surfaces: BANNER,
      prims: [
        box([2900, 2400, 15600], [0, 0, 0], 'body'),             // long slab fuselage
        box([2500, 1300, 1800], [0, 400, -8200], 'glass'),       // cockpit glazing
        box([2200, 1600, 2200], [0, 1900, -6200], 'accent'),     // FORWARD pylon
        box([2400, 2600, 2600], [0, 2400, 7000], 'accent'),      // AFT pylon (taller)
        ...rotorBlades([0, 3000, -6200], 18300, 3),              // forward rotor
        ...rotorBlades([0, 4000, 7000], 18300, 3),               // aft rotor
        ...mirrorX([box([700, 900, 6000], [1750, -900, -400], 'accent')]),  // sponsons
      ],
    },

    // ── Bell Boeing V-22 Osprey 17.5 × 25.8 (rotor tip) × 6.73 m ─────────────
    // Cues: wingtip TILT NACELLES with huge three-blade proprotors, twin fins.
    {
      id: 'base-aircraft-military-modern/v22_osprey', label: 'Bell Boeing V-22 Osprey',
      category: 'aircraft', era: 'Modern', lenMm: 17500, dims: [25800, 17500, 6730],
      body: '#4d5259', accent: '#33373d', surfaces: BANNER,
      prims: [
        box([2700, 2300, 11000], [0, 0, 800], 'body'),
        box([2300, 1100, 1600], [0, 500, -6000], 'glass'),
        box([14000, 220, 2600], [0, 1600, -900], 'body'),        // HIGH wing
        ...mirrorX([tube(700, 3400, [6800, 1750, -1000], 'accent')]),      // tilt nacelles
        ...mirrorX([...propBlades([6800, 1750, -2900], 11600, 2)]),        // proprotors
        ...mirrorX([box([160, 2100, 2200], [3200, 2000, 6000], 'accent')]),// twin fins
        box([7000, 160, 1900], [0, 1900, 6000], 'body'),         // connecting tailplane
      ],
    },

    // ── Mikoyan MiG-29 17.3 × 11.4 × 4.73 m ──────────────────────────────────
    // Cues: twin CANTED tails, wide LERX blending into two widely-spaced engines.
    {
      id: 'base-aircraft-military-modern/mig29', label: 'Mikoyan MiG-29',
      category: 'aircraft', era: 'Cold War–modern', lenMm: 17300, dims: [11400, 17300, 4730],
      body: '#79808a', accent: '#4d545d', surfaces: BANNER,
      prims: [
        box([1700, 850, 10500], [0, 0, 1000], 'body'),
        noseCone(430, 3600, [0, 90, -7100], 'body'),
        sph(360, [0, 570, -4200], 'glass'),
        box([11400, 130, 3200], [0, -60, 2300], 'accent'),       // wing
        ...mirrorX([box([620, 90, 3400], [1000, 120, -2000], 'accent', [0, -9, 0])]),  // LERX
        ...mirrorX([tube(560, 6600, [1000, -180, 3400], 'body')]),         // engines
        ...mirrorX([tailCone(420, 1100, [1000, -180, 7000], 'dark')]),
        ...mirrorX([box([110, 1700, 1900], [1400, 1000, 6100], 'body', [0, 0, -15])]),
      ],
    },
  ],
};

export default pack;
export { pack };
