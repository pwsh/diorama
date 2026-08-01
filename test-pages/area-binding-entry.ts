// Bundle entry for area-binding-test.html (HA floor/area binding). Exports the
// REAL Planner + the pure roomLabel + repairFloor + the offline LocalApi, and
// side-imports the real sidebar / entity picker / canvas-2d elements so the
// page can mount and drive them. Copied into a temp src tree and bundled
// (needs the tsconfig + lit aliases — the sensor-focus recipe):
//   T=$(mktemp -d); cp -r src/* "$T"/; cp tsconfig.json "$T"/
//   cp test-pages/fake-avatar-store.ts "$T"/avatar-store.ts
//   cp test-pages/area-binding-entry.ts "$T"/area-binding-entry.ts
//   npx esbuild "$T"/area-binding-entry.ts --bundle --format=esm \
//     --tsconfig="$T"/tsconfig.json \
//     --alias:lit=$PWD/node_modules/lit/index.js \
//     --alias:lit/decorators.js=$PWD/node_modules/lit/decorators.js \
//     --outfile=<harness>/area.mod.js
export { Planner } from './planner.js';
export { LocalApi } from './ha-local.js';
export { roomLabel, resolveAreaBindingForPoint, outdoorLabel, outdoorConfigured,
  closedWallLoops } from './geometry.js';
export { repairFloor } from './storage.js';
import './ui/sidebar.js';
import './ui/modals.js';
import './ui/canvas-2d.js';
