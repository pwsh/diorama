// esbuild bundle entry for confine-test.html (Sensor.confineToRoom — clamp a
// radar target into the wall loop containing its sensor).
//
// ONE bundle deliberately (the real-pos-test lesson): the page drives the REAL
// <diorama-three-view> (which stamps confine/srcX/srcY) AND the REAL 2D painter
// over the SAME Planner + geometry module identity — two bundles would each get
// their own copy and the loop-array identity that room resolution keys on would
// diverge. esbuild inlines three-view's dynamic three-renderer import, so the
// page reaches the live renderer via `_renderer`.
import './ui/three-view.js';
export { Planner } from './planner.js';
export { drawAll, computeView, mmToPx } from './canvas-render.js';
export { localToWorld, sensorColor, clampPointToLoop, pointInPolygon,
         closedWallLoops, loopContaining } from './geometry.js';
