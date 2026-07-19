// Bundled test entry for toolbar-test.html. Copied into the temp src dir (as
// ui/toolbar-entry.ts) by the build recipe so it shares the swapped fake
// avatar-store, then esbuild-bundled → toolbar.mod.js. Re-exports the real
// Planner + the pure toolbar model/arming helpers + the pure thumbnail cache so
// the harness can drive them headlessly (no Lit, no three.js).
export { Planner, NEW_ROOM, NEW_LANDMARK } from '../planner.js';
export * as toolarm from './tool-arm.js';
export * as thumbcache from './thumbs-cache.js';
export { FURNITURE_KINDS } from '../geometry.js';
