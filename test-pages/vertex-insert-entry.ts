// Bundle entry for vertex-insert-test.html — midpoint vertex-INSERT handles,
// whole-shape body moves, and the draggable room-name label / anchor.
//
// ONE bundle deliberately: canvas-render, canvas-hit, canvas-interact and the
// Planner must share a single module identity (the flightHitPx / layers2d
// lesson — separate bundles each get their own copy of the px-extent maps).
//
// Copied into a temp src tree and bundled (needs the tsconfig + lit aliases,
// the sensor-focus recipe, because canvas-interact reaches the Lit UI graph):
//   T=$(mktemp -d); cp -r src/* "$T"/; cp tsconfig.json "$T"/
//   cp test-pages/fake-avatar-store.ts   "$T"/avatar-store.ts
//   cp test-pages/vertex-insert-entry.ts "$T"/vertex-insert-entry.ts
//   npx esbuild "$T"/vertex-insert-entry.ts --bundle --format=esm \
//     --tsconfig="$T"/tsconfig.json \
//     --alias:lit=$PWD/node_modules/lit/index.js \
//     --alias:lit/decorators.js=$PWD/node_modules/lit/decorators.js \
//     --outfile=<harness>/vinsert.mod.js
export { Planner } from './planner.js';
export { repairFloor } from './storage.js';
export {
  drawAll, computeView, mmToPx, pxToMm,
  roomLabelHalfPx, insertHandleMinLenMm, insertHandlesEnabled,
  INSERT_HANDLE_MIN_PX, POLY_CAPS,
} from './canvas-render.js';
export {
  hitWallVert, hitWallVertInsert,
  hitPresenceZoneVertex, hitPresenceZoneVertexInsert,
  hitGroundAreaVertex, hitGroundAreaVertexInsert,
  hitPathVertex, hitPathVertexInsert,
  hitPoolVertex, hitPoolVertexInsert,
  hitVoidAreaVertex, hitVoidAreaVertexInsert,
  hitRoomLabel, hitGroundArea, hitPool, hitVoidArea, hitPresenceZone,
} from './canvas-hit.js';
export {
  onCanvasMouseDown, onCanvasMouseMove, onCanvasMouseUp,
} from './canvas-interact.js';
export {
  midpointHandles, closedWallLoops, loopContaining, centroid, bufferPolyline,
  POLY_VERTEX_CAP_GROUND, POLY_VERTEX_CAP_POOL, POLY_VERTEX_CAP_VOID,
  POLY_VERTEX_CAP_PATH, POLY_VERTEX_CAP_PZONE,
} from './geometry.js';
