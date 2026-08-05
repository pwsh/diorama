// Aircraft ▸ Military ▸ Historical (WWI–WWII / early Cold War) — builtin base
// pack (dynamic-import only).
//
// First wave from docs/research/vehicle-model-library.md §3.1 rows 1–10,
// authored at REAL mm scale (the banner-tow surface compresses them through
// `bannerCraftScale`, so nothing here is pre-shrunk). IP posture (§5.3): these
// are real historical military airframes, so they carry their REAL names in the
// UI — the same posture the shipped BG_CRAFTS military roster takes.
//
// Model-local frame: −Z = nose, +Y = up, origin = the hull CENTRE (aircraft are
// centred vertically too — they never meet a ground plane).
import type { VehiclePackDef } from '../vehicles.js';
import {
  box, cyl, sph, tube, noseCone, propBlades, mirrorX,
} from './prims.js';

const BANNER: ('ground' | 'banner' | 'adsb')[] = ['banner'];

const pack: VehiclePackDef = {
  id: 'base-aircraft-military-historical', version: 1, label: 'Historical (WWI–WWII)',
  path: ['Aircraft', 'Military', 'Historical (WWI–WWII)'], builtin: true,
  models: [
    // ── Supermarine Spitfire 9.12 × 11.23 × 3.86 m ───────────────────────────
    // Cues: ELLIPTICAL wing (root + a shorter-chord, thinner outboard panel —
    // the thickness step also keeps the two panels' top faces off one plane),
    // rounded canopy, three-blade spinner.
    {
      id: 'base-aircraft-military-historical/spitfire', label: 'Supermarine Spitfire',
      category: 'aircraft', era: 'WWII', lenMm: 9120, dims: [11230, 9120, 3860],
      body: '#6d7a55', accent: '#8d9099', surfaces: BANNER,
      prims: [
        tube(420, 5400, [0, 0, 400], 'body'),                    // fuselage barrel
        noseCone(400, 1500, [0, 0, -3050], 'body'),              // cowling taper
        noseCone(190, 520, [0, 0, -3960], 'accent'),             // spinner
        ...propBlades([0, 0, -4180], 3200, 3),                   // 3-blade prop
        sph(340, [0, 380, -900], 'glass'),                       // canopy
        box([5000, 116, 2000], [0, -110, -100], 'body'),         // elliptical root panel
        ...mirrorX([box([3100, 82, 1240], [4050, -110, -160], 'body')]),  // outboard taper
        box([3800, 84, 900], [0, 60, 3500], 'body'),             // tailplane
        box([70, 1080, 1200], [0, 620, 3620], 'accent'),         // fin
      ],
    },

    // ── North American P-51 Mustang 9.83 × 11.28 × 4.16 m ────────────────────
    // Cues: bubble canopy sitting proud, the BELLY radiator scoop, laminar wing.
    {
      id: 'base-aircraft-military-historical/p51', label: 'North American P-51 Mustang',
      category: 'aircraft', era: 'WWII', lenMm: 9830, dims: [11280, 9830, 4160],
      body: '#c9ced4', accent: '#2f6fb0', surfaces: BANNER,
      prims: [
        tube(430, 5800, [0, 0, 300], 'body'),
        noseCone(410, 1600, [0, 0, -3300], 'accent'),            // painted nose
        noseCone(190, 520, [0, 0, -4260], 'accent'),
        ...propBlades([0, 0, -4480], 3300, 4),                   // 4-blade
        sph(380, [0, 420, -700], 'glass'),                       // bubble canopy
        box([720, 420, 1900], [0, -560, 700], 'body'),           // belly radiator scoop
        box([11280, 112, 2100], [0, -160, -180], 'body'),        // laminar wing
        box([4200, 86, 940], [0, 60, 3700], 'body'),             // tailplane
        box([70, 1120, 1280], [0, 640, 3820], 'accent'),         // fin
      ],
    },

    // ── Messerschmitt Bf 109 8.95 × 9.92 × 2.60 m ────────────────────────────
    // Cues: very narrow fuselage, SQUARED-off wingtips, tail-dragger stance.
    {
      id: 'base-aircraft-military-historical/bf109', label: 'Messerschmitt Bf 109',
      category: 'aircraft', era: 'WWII', lenMm: 8950, dims: [9920, 8950, 2600],
      body: '#8f9aa4', accent: '#4a5560', surfaces: BANNER,
      prims: [
        tube(340, 5300, [0, 0, 350], 'body'),
        noseCone(330, 1700, [0, 0, -3100], 'accent'),
        noseCone(170, 480, [0, 0, -4080], 'accent'),
        ...propBlades([0, 0, -4290], 3000, 3),
        box([620, 400, 1400], [0, 380, -800], 'glass'),          // framed (not bubble) canopy
        box([9920, 100, 1700], [0, -130, -60], 'body'),          // squared-tip wing
        box([3400, 80, 820], [0, 60, 3500], 'body'),
        box([64, 940, 1100], [0, 540, 3620], 'accent'),
        cyl([110, 110, 220], [0, -420, 3800], 'dark'),           // tailwheel
      ],
    },

    // ── Mitsubishi A6M Zero 9.06 × 12.0 × 3.05 m ─────────────────────────────
    // Cues: RADIAL cowl, long low canopy, rounded tips, red wing roundels.
    {
      id: 'base-aircraft-military-historical/a6m_zero', label: 'Mitsubishi A6M Zero',
      category: 'aircraft', era: 'WWII', lenMm: 9060, dims: [12000, 9060, 3050],
      body: '#c3c6a8', accent: '#c0281f', surfaces: BANNER,
      prims: [
        tube(400, 5200, [0, 0, 500], 'body'),
        tube(560, 900, [0, 0, -2500], 'dark'),                   // radial engine cowl
        noseCone(180, 460, [0, 0, -3200], 'body'),
        ...propBlades([0, 0, -3450], 3100, 3),
        box([560, 340, 2200], [0, 360, -600], 'glass'),          // long low canopy
        box([12000, 104, 1900], [0, -140, -80], 'body'),
        // Roundels overlap the wing skin (bottom buried, top proud) rather than
        // sitting exactly on it — the coincident-face gotcha.
        ...mirrorX([cyl([620, 620, 40], [3600, -100, -80], 'accent')]),
        box([3900, 82, 880], [0, 60, 3400], 'body'),
        box([66, 940, 1140], [0, 540, 3520], 'body'),
      ],
    },

    // ── Vought F4U Corsair 10.16 × 12.5 × 4.50 m ─────────────────────────────
    // Cues: the INVERTED GULL WING (inner panels drooping outboard, outer panels
    // rising) and a huge four-blade prop.
    {
      id: 'base-aircraft-military-historical/f4u_corsair', label: 'Vought F4U Corsair',
      category: 'aircraft', era: 'WWII', lenMm: 10160, dims: [12500, 10160, 4500],
      body: '#2c4a63', accent: '#dfe3e7', surfaces: BANNER,
      prims: [
        tube(470, 6000, [0, 0, 400], 'body'),
        tube(600, 1000, [0, 0, -3000], 'dark'),                  // radial cowl
        noseCone(200, 540, [0, 0, -3760], 'accent'),
        ...propBlades([0, 0, -4020], 4000, 4),
        sph(360, [0, 420, -800], 'glass'),
        // Inner gull panels droop outboard (right panel: rotation.z < 0 lowers +X).
        ...mirrorX([box([2600, 118, 2200], [1600, -300, -120], 'body', [0, 0, -18])]),
        // Outer panels rise again — the gull's second bend.
        ...mirrorX([box([3400, 92, 1700], [4600, -700, -160], 'body', [0, 0, 12])]),
        box([4000, 84, 900], [0, 80, 3700], 'body'),
        box([70, 1100, 1240], [0, 640, 3820], 'body'),
      ],
    },

    // ── Boeing B-17 Flying Fortress 22.8 × 31.6 × 5.82 m ─────────────────────
    // Cues: FOUR wing-mounted engines, the glazed bombardier nose, tall fin.
    {
      id: 'base-aircraft-military-historical/b17', label: 'Boeing B-17 Flying Fortress',
      category: 'aircraft', era: 'WWII', lenMm: 22800, dims: [31600, 22800, 5820],
      body: '#a8adb4', accent: '#5b6570', surfaces: BANNER,
      prims: [
        tube(780, 16000, [0, 0, 1200], 'body'),
        sph(720, [0, 0, -7400], 'glass'),                        // glazed nose
        sph(420, [0, -640, -5600], 'dark'),                      // chin turret
        box([31600, 200, 4200], [0, 260, -600], 'body'),         // big straight wing
        ...mirrorX([tube(400, 2800, [5200, 100, -1400], 'accent')]),    // inboard nacelles
        ...mirrorX([tube(360, 2500, [10400, 40, -1500], 'accent')]),    // outboard nacelles
        ...mirrorX([...propBlades([5200, 100, -2900], 3400, 1)]),
        ...mirrorX([...propBlades([10400, 40, -2860], 3200, 1)]),
        box([11400, 150, 2400], [0, 320, 8200], 'body'),         // tailplane
        box([130, 2600, 3000], [0, 1500, 8600], 'accent'),       // tall fin
      ],
    },

    // ── Avro Lancaster 21.2 × 31.1 × 6.10 m ──────────────────────────────────
    // Cues: four engines and the TWIN TAIL FINS (the B-17 discriminator).
    {
      id: 'base-aircraft-military-historical/lancaster', label: 'Avro Lancaster',
      category: 'aircraft', era: 'WWII', lenMm: 21200, dims: [31100, 21200, 6100],
      body: '#3a4048', accent: '#6d7681', surfaces: BANNER,
      prims: [
        tube(800, 15000, [0, 0, 1000], 'body'),
        sph(600, [0, 220, -7100], 'glass'),                      // bomb-aimer nose
        box([31100, 200, 4000], [0, 300, -500], 'body'),
        ...mirrorX([tube(400, 2700, [4900, 140, -1300], 'accent')]),
        ...mirrorX([tube(380, 2500, [9900, 80, -1400], 'accent')]),
        ...mirrorX([...propBlades([4900, 140, -2760], 3600, 1)]),
        ...mirrorX([...propBlades([9900, 80, -2760], 3400, 1)]),
        box([10400, 150, 2200], [0, 340, 7800], 'body'),         // tailplane
        ...mirrorX([box([120, 2000, 2200], [4600, 1300, 7900], 'accent')]),  // TWIN fins
      ],
    },

    // ── Lockheed SR-71 Blackbird 32.74 × 16.94 × 5.64 m ──────────────────────
    // Cues: all-black chined delta, twin CANTED tails, two huge inlet spikes.
    {
      id: 'base-aircraft-military-historical/sr71', label: 'Lockheed SR-71 Blackbird',
      category: 'aircraft', era: 'Cold War', lenMm: 32740, dims: [16940, 32740, 5640],
      body: '#1c1f24', accent: '#2f343b', surfaces: BANNER,
      prims: [
        tube(760, 21000, [0, 0, 1200], 'body'),
        noseCone(720, 6000, [0, 0, -11800], 'body'),             // long chined nose
        ...mirrorX([box([900, 90, 15000], [900, 40, -2400], 'accent')]),   // fuselage chines
        box([16940, 190, 13000], [0, -80, 5200], 'body'),        // delta wing
        ...mirrorX([tube(820, 8600, [3400, 0, 3200], 'accent')]),          // engine nacelles
        ...mirrorX([noseCone(300, 1400, [3400, 0, -1800], 'dark')]),       // inlet spikes
        ...mirrorX([box([110, 1900, 2100], [3400, 1000, 6400], 'body', [0, 0, -16])]),
      ],
    },

    // ── Sopwith Camel 5.72 × 8.53 × 2.59 m ───────────────────────────────────
    // Cues: BIPLANE — two stacked wings on visible interplane struts, rotary cowl.
    {
      id: 'base-aircraft-military-historical/sopwith_camel', label: 'Sopwith Camel',
      category: 'aircraft', era: 'WWI', lenMm: 5720, dims: [8530, 5720, 2590],
      body: '#b9a172', accent: '#5c4a2e', surfaces: BANNER,
      prims: [
        box([560, 640, 4000], [0, 0, 300], 'body'),              // slab-sided fuselage
        tube(380, 700, [0, 60, -2100], 'dark'),                  // rotary cowl
        ...propBlades([0, 60, -2560], 2500, 2),
        box([8530, 78, 1300], [0, -300, -200], 'body'),          // LOWER wing
        box([8530, 94, 1300], [0, 860, -260], 'body'),           // UPPER wing
        ...mirrorX([cyl([44, 44, 1160], [1500, 280, -230], 'accent')]),    // interplane struts
        box([2600, 70, 700], [0, 120, 2100], 'body'),            // tailplane
        box([56, 700, 720], [0, 420, 2200], 'accent'),           // fin
      ],
    },

    // ── Fokker Dr.I Triplane 5.77 × 7.19 × 2.95 m ────────────────────────────
    // Cues: THREE stacked wings of stepped span, all-red — "the Red Baron".
    {
      id: 'base-aircraft-military-historical/fokker_dr1', label: 'Fokker Dr.I Triplane',
      category: 'aircraft', era: 'WWI', lenMm: 5770, dims: [7190, 5770, 2950],
      body: '#a3231d', accent: '#f0e4c8', surfaces: BANNER,
      prims: [
        box([540, 620, 3900], [0, 0, 300], 'body'),
        tube(360, 660, [0, 60, -2050], 'dark'),                  // rotary cowl
        ...propBlades([0, 60, -2480], 2400, 2),
        box([7190, 92, 1000], [0, 1080, -300], 'body'),          // TOP wing
        box([6300, 78, 980], [0, 320, -240], 'body'),            // MIDDLE wing
        box([5700, 64, 940], [0, -400, -180], 'body'),           // BOTTOM wing
        ...mirrorX([cyl([40, 40, 1560], [1300, 340, -260], 'accent')]),    // cabane struts
        box([2400, 70, 900], [0, 180, 2050], 'body'),
        box([52, 640, 700], [0, 440, 2150], 'accent'),
      ],
    },
  ],
};

export default pack;
export { pack };
