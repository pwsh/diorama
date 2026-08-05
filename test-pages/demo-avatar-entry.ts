// esbuild bundle entry for demo-avatar-test.html. Registers <diorama-three-view>
// (the REAL element, which owns the synthetic-target assembly) and re-exports the
// Planner so the harness can drive a real store. Copied into a temp src tree and
// bundled — see demo-avatar-test.html's build comment.
import './ui/three-view.js';
export { Planner } from './planner.js';
