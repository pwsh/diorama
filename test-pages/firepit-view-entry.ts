// Bundle entry for firepit-test.html §E — the END-TO-END 3D click path.
//
// §E drives a REAL <diorama-three-view> with a REAL Planner and REAL
// PointerEvents, so the Planner it mounts and the Planner the test constructs
// must be the SAME module instance: both come from here. Importing the
// component for its side effect also pulls in three-renderer (esbuild inlines
// three-view's dynamic import), which is what gives the mounted view a live
// ThreeDRenderer without the test having to construct one.
export { Planner } from './planner.js';
import './ui/three-view.js';
