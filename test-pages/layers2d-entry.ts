// Bundle entry for layers2d-test.html (2D layer gating + floor colour/texture).
// Exports the REAL Planner, the REAL 2D painter (drawAll/computeView/mmToPx) and
// the pure layer catalog, and side-imports the real sidebar so the page can
// assert the GROUPED layer UI against the same LAYER_DEFS the painter honours.
//
// ONE bundle deliberately: canvas-render + sidebar + planner in separate bundles
// would each get their own Planner module identity (the flights-ui lesson).
// Copied into a temp src tree and bundled (needs the tsconfig + lit aliases —
// the sensor-focus recipe):
//   T=$(mktemp -d); cp -r src/* "$T"/; cp tsconfig.json "$T"/
//   cp test-pages/fake-avatar-store.ts "$T"/avatar-store.ts
//   cp test-pages/layers2d-entry.ts "$T"/layers2d-entry.ts
//   npx esbuild "$T"/layers2d-entry.ts --bundle --format=esm \
//     --tsconfig="$T"/tsconfig.json \
//     --alias:lit=$PWD/node_modules/lit/index.js \
//     --alias:lit/decorators.js=$PWD/node_modules/lit/decorators.js \
//     --outfile=<harness>/layers2d.mod.js
export { Planner } from './planner.js';
export { drawAll, computeView, mmToPx, fixtureCaption } from './canvas-render.js';
export { hitDoor, hitWindow, openingsVisible } from './canvas-hit.js';
export {
  LAYER_DEFS, LAYER_CATS, SIMPLE_LAYERS, DEFAULT_OFF_LAYERS,
  layerIsOn, layerDefsByCat,
} from './layer-defs.js';
import './ui/sidebar.js';
import './ui/modals.js';
import './ui/canvas-2d.js';
