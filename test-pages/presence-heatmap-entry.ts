// Bundle entry for presence-heatmap-test.html (mmWave presence-history recorder,
// privacy contract, layer registration, and the 2D + 3D heat overlay).
//
// ONE bundle deliberately: planner + canvas-render + three-view + three-renderer
// in separate bundles would each get their own module identity, so a prototype
// patch or a Planner instance from one would not be seen by another (the
// flights-ui / card-test lesson). Bundling also inlines three-view's dynamic
// import of the renderer, which is what lets the test patch
// ThreeDRenderer.prototype and observe what three-view actually calls.
//
// The REAL avatar-store / history-store are used (NOT the in-memory fake):
// this page is driven over CDP against a persistent Chrome, where IndexedDB
// genuinely works — and the point of the exercise is the real store.
//
// Build (from the repo root; NEVER reuse stale bundles):
//   T=$(mktemp -d); cp -r src/* "$T"/; cp tsconfig.json "$T"/
//   cp test-pages/presence-heatmap-entry.ts "$T"/presence-heatmap-entry.ts
//   npx esbuild "$T"/presence-heatmap-entry.ts --bundle --format=esm \
//     --tsconfig="$T"/tsconfig.json \
//     --alias:lit=$PWD/node_modules/lit/index.js \
//     --alias:lit/decorators.js=$PWD/node_modules/lit/decorators.js \
//     --alias:three=$PWD/node_modules/three \
//     --outfile=<harness>/presence.mod.js
// NB alias `three` to the package DIRECTORY (not build/three.module.js) or the
// three/examples/jsm/loaders/* prefix rewrite breaks.
export { Planner } from './planner.js';
export { injectSharedStyles } from './styles.js';
export { drawAll, computeView, mmToPx } from './canvas-render.js';
export { ThreeDRenderer } from './three-renderer.js';
export {
  LAYER_DEFS, LAYER_CATS, SIMPLE_LAYERS, DEFAULT_OFF_LAYERS, layerIsOn,
} from './layer-defs.js';
export {
  PRESENCE_CELL_MM, PRESENCE_SAMPLE_MS, PRESENCE_FLUSH_MS,
  PRESENCE_RETENTION_DAYS_DEFAULT, HOUR_MS,
  presenceCellIndex, presenceGridCols, presenceGridRows, hourBucket, historyKey,
  presenceHeatColor, presenceNormalize, decodePresenceCells, makePresenceRecord,
} from './mmwave-history.js';
export {
  listPresenceKeys, getPresenceRecord, getPresenceRecords, putPresenceRecord,
  clearPresenceHistory, sweepPresenceHistory,
} from './history-store.js';
// The room TEMPERATURE ramp — imported ONLY so the test can prove the presence
// overlay does NOT use it (the "heatmap is taken" requirement, design §E).
export { heatmapColor, localToWorld } from './geometry.js';
import './ui/three-view.js';
import './ui/modals.js';
import './ui/canvas-2d.js';
