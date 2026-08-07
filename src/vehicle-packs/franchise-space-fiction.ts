// Space ▸ Fiction — FRANCHISE pack, default UNLOADED (opt-in via Settings ▸
// Vehicles), dynamic-import only.
//
// From docs/research/vehicle-model-library.md §3.4, EXCLUDING the blue call-box
// row: §3.4's own IP note flags that one as the single candidate needing a
// product-owner comfort check before building, so it is deliberately not here.
//
// IP posture (§5.3): DESCRIPTIVE-GENERIC labels only — never a franchise or
// proper noun in user-visible copy, and geometric SUGGESTION only, never a
// replica. The internal member ids stay homage-coded in code comments alone,
// exactly as the shipped BG_CRAFTS fiction roster does.
//
// Model-local frame: −Z = nose, +Y = up, origin = the hull CENTRE.
import type { VehiclePackDef, VehiclePrimitive } from '../vehicles.js';
import { box, cyl, sph, tube, noseCone, tailCone, mirrorX } from './prims.js';

const BANNER: ('ground' | 'banner' | 'adsb')[] = ['banner'];

/** Mark a prim self-lit (engine / drive glow). Static — no per-frame system. */
const lit = (p: VehiclePrimitive): VehiclePrimitive => ({ ...p, emissive: true });

const pack: VehiclePackDef = {
  id: 'franchise-space-fiction', version: 2, label: 'Fiction',
  path: ['Space', 'Fiction'], builtin: true, franchise: true,
  models: [
    // ── Classic flying saucer (generic — no single IP owns the shape) ────────
    // Cues: chrome lens hull, central dome, a lit rim, three landing legs.
    {
      id: 'franchise-space-fiction/flying_saucer', label: 'Flying saucer',
      category: 'space', lenMm: 10600, dims: [10600, 10600, 3600],
      body: '#c2c8ce', accent: '#8f979f', surfaces: BANNER,
      prims: [
        cyl([2600, 5200, 700], [0, 350, 0], 'body'),             // upper lens
        cyl([5200, 2000, 700], [0, -350, 0], 'body'),            // lower lens
        cyl([5300, 5300, 240], [0, 0, 0], 'accent'),             // rim band
        lit(cyl([5340, 5340, 90], [0, 0, 0], '#7fe6ff')),        // lit rim (proud of the band)
        sph(1900, [0, 900, 0], 'glass'),                         // observation dome
        lit(cyl([700, 700, 300], [0, -800, 0], '#7fe6ff')),      // underside tractor glow
        ...mirrorX([cyl([120, 120, 1100], [2600, -1200, 900], 'accent')]),   // landing legs
        cyl([120, 120, 1100], [0, -1200, -2800], 'accent'),
      ],
    },

    // ── Long modular science vessel with a rotating ring ─────────────────────
    // (2001-style "Discovery" silhouette.) Cues: spherical command head on a
    // long slim spine, a CENTRIFUGE disc that actually turns, rear engine
    // cluster. The disc rides the `spin:'prop'` channel — it sits on the flight
    // axis, which is exactly the axis a centrifuge ring turns about.
    {
      id: 'franchise-space-fiction/science_vessel', label: 'Modular science vessel',
      category: 'space', lenMm: 24000, dims: [5600, 24000, 5600],
      body: '#dfe3e7', accent: '#9aa2ab', surfaces: BANNER,
      prims: [
        sph(2400, [0, 0, -9600], 'body'),                        // command head
        box([1400, 900, 1000], [0, 700, -11600], 'glass'),       // head window bay
        tube(520, 12000, [0, 0, -1200], 'accent'),               // spine
        { shape: 'cylinder', size: [2800, 2800, 1200], pos: [0, 0, -6200],
          rot: [90, 0, 0], color: 'body', spin: 'prop' } as VehiclePrimitive,  // rotating centrifuge
        box([2600, 2200, 4200], [0, 0, 7400], 'body'),           // engine block
        ...mirrorX([tailCone(560, 1600, [900, 700, 10000], '#ff9a4d')]).map(lit),
        ...mirrorX([tailCone(560, 1600, [900, -700, 10000], '#ff9a4d')]).map(lit),
      ],
    },

    // ── Retro battle carrier with a boxy prow ────────────────────────────────
    // (Battlestar-style.) Cues: an industrial slab hull, an angled alligator
    // prow, two outrigger flight pods on stalks, three lit engines.
    {
      id: 'franchise-space-fiction/battle_carrier', label: 'Battle carrier (boxy prow)',
      category: 'space', lenMm: 26000, dims: [12000, 26000, 4600],
      body: '#7d838a', accent: '#4f555c', surfaces: BANNER,
      prims: [
        box([4400, 2400, 17000], [0, 0, 1500], 'body'),          // slab hull
        box([2800, 1700, 8400], [0, -300, -9616], 'accent', [8, 0, 0]),      // angled prow (grown into the hull)
        ...mirrorX([box([2000, 1100, 11000], [4600, -400, 2200], 'accent')]),// flight pods
        ...mirrorX([box([2900, 400, 900], [2600, -300, 2200], 'body')]),     // pod stalks
        ...mirrorX([tube(760, 1500, [1500, 200, 10600], '#ff8a3d')]).map(lit),
        lit(tube(900, 1500, [0, 200, 10600], '#ff8a3d')),        // engines
      ],
    },

    // ── Sleek chrome transporter with folding legs ───────────────────────────
    // (70s-retrofuturism "Eagle" style.) Cues: an exposed truss spine carrying a
    // detachable box cargo pod, a small command pod up front, four spindly legs.
    {
      id: 'franchise-space-fiction/modular_transport', label: 'Modular transport (truss frame)',
      category: 'space', lenMm: 16000, dims: [7000, 16000, 5200],
      body: '#b8bec6', accent: '#5d646c', surfaces: BANNER,
      prims: [
        box([3000, 2200, 6000], [0, 0, 800], 'body'),            // cargo pod (reaches the truss rails)
        ...mirrorX([box([300, 300, 11000], [1600, 0, 500], 'accent')]),      // truss spine rails
        box([1800, 1500, 2600], [0, 200, -6200], 'body'),        // command pod
        box([1300, 600, 300], [0, 350, -7600], 'glass'),         // command glazing
        box([3040, 2000, 3000], [0, 0, 6400], 'accent'),         // engine block (reaches the truss rails)
        noseCone(420, 900, [0, 0, -7900], 'accent'),             // docking probe
        ...mirrorX([tube(600, 4600, [2000, 300, 600], 'accent')]),           // side tanks
        ...mirrorX([cyl([90, 90, 2000], [1700, -1900, 3200], 'accent', [0, 0, 16])]),
        ...mirrorX([cyl([90, 90, 2000], [1700, -1900, -1600], 'accent', [0, 0, 16])]),
      ],
    },
  ],
};

export default pack;
export { pack };
