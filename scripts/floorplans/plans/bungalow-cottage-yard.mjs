// Bungalow — Cottage + Yard — a landscaped variation of small-bungalow.mjs.
// Same house (identical walls/rooms/doors/windows/interior furniture — imported
// from the shared bungalowGeometry builder, offset by a yard margin so NO
// coordinate is copy-pasted), re-skinned in a warmer cottage palette and dropped
// into a fenced-in lot: a wrap-around grass lawn, a concrete front walk from the
// door to the street, a mulch foundation bed, and yard objects (trees, bushes, a
// flower bed, two lawn chairs, a picnic table, a bird bath).
//
// The house sits offset by MARGIN on every side inside an enlarged floor rect;
// everything the base builder emits is translated by (MARGIN, MARGIN), and the
// yard ground areas + outdoor furniture are authored directly in the enlarged
// world frame (outside every wall loop, inside the floor rect).
import { floorplan } from '../lib.mjs';
import { bungalowGeometry, HOUSE_W, HOUSE_D } from './small-bungalow.mjs';

export const id = 'bungalow-cottage-yard';
export const name = 'Bungalow — Cottage + Yard';

const MARGIN = 3000;                       // yard depth on every side (mm)
const FW = HOUSE_W + MARGIN * 2;           // 15750
const FD = HOUSE_D + MARGIN * 2;           // 15500
// House footprint in the enlarged world frame.
const HX0 = MARGIN, HY0 = MARGIN, HX1 = MARGIN + HOUSE_W, HY1 = MARGIN + HOUSE_D; // 3000..12750 × 3000..12500

export function build() {
  const b = floorplan(id);
  const g = bungalowGeometry(b, { dx: MARGIN, dy: MARGIN });

  // Warmer cottage skin (deeper honey floor, warm-cream walls).
  const look = { floorTex: 'wood', floorColor: '#BE8A55', wallColor: '#F2E3C9' };

  // Ground areas (world frame). Grass frames the house on all four sides; a
  // concrete walk runs from the front door south to the street edge; a mulch
  // foundation bed lines the front wall east of the walk. All lie OUTSIDE the
  // house wall loop and INSIDE the floor rect.
  const ground = (kind, points) => ({ id: b.id('ga'), kind, points });
  const rect = (x0, y0, x1, y1) => [
    { x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 },
  ];
  const groundAreas = [
    ground('grass', rect(0, 0, FW, HY0)),          // front (south) yard strip
    ground('grass', rect(0, HY1, FW, FD)),         // back (north) yard strip
    ground('grass', rect(0, HY0, HX0, HY1)),       // west side yard
    ground('grass', rect(HX1, HY0, FW, HY1)),      // east side yard
    ground('concrete', rect(5400, 0, 6400, HY0)),  // front walk to the street (door ≈ x5900)
    ground('mulch', rect(6600, 2450, 9500, HY0)),  // front foundation bed east of the walk
  ];

  // Outdoor furniture (world frame, in the yard).
  const yard = [
    // Front yard
    b.furn('tree', 1500, 1500, { rotation: 0 }),
    b.furn('tree', 14250, 1500, { rotation: 0 }),
    b.furn('bird_bath', 13100, 1900, { rotation: 0 }),
    b.furn('bush', 6950, 2700, { rotation: 0 }),        // on the mulch bed
    b.furn('bush', 8300, 2700, { rotation: 0 }),        // on the mulch bed
    b.furn('flower_bed', 7600, 2700, { rotation: 0 }),  // on the mulch bed
    b.furn('bush', 4200, 2700, { rotation: 0 }),        // west of the walk
    // Back yard
    b.furn('lawn_chair', 5000, 13800, { rotation: 180 }),
    b.furn('lawn_chair', 6300, 13800, { rotation: 180 }),
    b.furn('picnic_table', 8100, 13700, { rotation: 0 }),
    b.furn('tree', 13500, 14000, { rotation: 0 }),
    b.furn('bush', 2000, 13500, { rotation: 0 }),
  ];

  const f = b.floor({
    name: 'Cottage + Yard', w: FW, d: FD,
    walls: g.walls, rooms: g.rooms, doors: g.doors, windows: g.windows,
    furniture: [...g.furniture, ...yard], lights: g.lights, switches: g.switches,
    groundAreas,
    look3d: look,
  });

  const roamers = [
    b.roamer('Rosie', ['adult', 'athlete'], { color: '#f06292' }),
    b.roamer('Pepper', ['dog'], { color: '#8d6e63' }),  // yard dog (quadruped rig)
  ];

  return b.assembleStore({
    name,
    floors: [f],
    scene3d: {
      preset: 'day', ...look,
      wallCutaway: true, plumbobs: true,
    },
    roamers,
    notes: [
      '~997 sq ft (92.6 m²) interior · 1 floor · 13 rooms + landscaped yard',
      '',
      'The Small 2-Bed Bungalow re-skinned as a cozy cottage and set on its own lot.',
      'The house itself is identical — front living room, galley kitchen open to an',
      'interior breakfast nook and back mudroom, and a two-bedroom private wing off a',
      'central hallway — but dressed in a warmer palette (deeper honey-oak floors, warm',
      'cream walls) and surrounded on all four sides by a 3-metre yard. A grass lawn',
      'wraps the house; a concrete front walk runs from the front door out to the',
      'street; a mulch foundation bed lines the front wall with bushes and a flower bed;',
      'trees anchor the corners, a bird bath sits in the front lawn, and the back yard',
      'has two lawn chairs and a picnic table for outdoor dining.',
      '',
      'Interior (unchanged from the base bungalow):',
      'Living Room: sofa + TV wall, armchair, coffee table, bookshelf, seating rug, plant.',
      'Kitchen: galley run (sink, dishwasher, fridge, stove + microwave, counter, cabinets).',
      'Dining Nook: interior 4-seat breakfast table with bench.',
      'Mudroom / Laundry: washer + dryer, boot bench.',
      'Primary Bedroom: queen bed, nightstands, dresser, reading chair; own closet.',
      'Bathroom: toilet, vanity, tub. Utility / Storage: shelving + walk-through to Bedroom 2.',
      'Bedroom 2: full bed, nightstand, desk, dresser; reach-in + storage closets.',
      '',
      'Yard:',
      '  • Grass lawn wrapping the house on all four sides.',
      '  • Concrete front walk from the front door to the street.',
      '  • Mulch foundation bed along the front wall with two bushes and a flower bed;',
      '    a fourth bush west of the walk.',
      '  • Two shade trees at the front corners, one at the back; a front-lawn bird bath.',
      '  • Back-yard picnic table with two lawn chairs for outdoor dining.',
    ].join('\n'),
  });
}
