// Bundle entry for real-pos-test.html (Sensor.showRealPositions — the RAW radar
// report rendered beside the smoothed avatar).
//
// ONE bundle deliberately: the page drives the REAL <diorama-three-view> (which
// owns the rawX/rawY stamping) AND the REAL 2D painter over the SAME Planner
// module identity — two bundles would each get their own Planner/geometry
// instance (the flights-ui lesson). esbuild inlines three-view's dynamic
// three-renderer import, so the page reaches the live renderer via `_renderer`.
import './ui/three-view.js';
export { Planner } from './planner.js';
export { drawAll, computeView, mmToPx } from './canvas-render.js';
export { localToWorld, sensorColor, hexToInt } from './geometry.js';
