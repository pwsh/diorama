// Bundle entry for lockoven-test's planner-side lock assertions (display-only
// gating + full-mode toggle) and the shared lock color-resolution helpers.
// Copied into a temp src tree next to the real modules and esbuild-bundled
// (--bundle --format=esm) so the page drives the REAL Planner + geometry
// (no three.js — neither imports it). Mirrors dc-b-entry.ts.
export { Planner } from './planner.js';
export {
  lockGlyphColor, normalizeLockState, lockGlyphTransitional, lockGlyphJammed,
  lockGlyphSecured, actionLastFired,
} from './geometry.js';
