// Bundle entry for the DC-B test pages (action-button-test / logical-light-test).
// Copied into the temp src tree next to the real modules and esbuild-bundled
// (--bundle --format=esm) so the pages drive the REAL Planner + geometry +
// canvas-render (no three.js — none of these import it). See the build comment
// in the HTML pages.
export { Planner } from './planner.js';
export { drawAll, mmToPx, actionButtonHalfPx } from './canvas-render.js';
export {
  resolveLightLogic, logicLightState,
  actionButtonKind, actionButtonSize, actionButtonColor, actionButtonIcon, actionButtonHeight,
  snapActionButtonToWall, ACTION_ICON, ACTION_BUTTON_DEFAULTS,
} from './geometry.js';
export { ruleMatches, evalRules } from './value-rules.js';
