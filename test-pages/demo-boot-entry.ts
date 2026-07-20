// Bundle entry for demo-boot-test.html — re-exports the REAL Planner + offline
// LocalApi + the demo-seed helpers so the test drives them without the DOM app
// shell. Copied into a temp src tree (avatar-store swapped for the fake) and
// bundled with esbuild, exactly like config-test's planner.mod.js. See the
// build comment in demo-boot-test.html.
export { Planner } from './planner.js';
export { LocalApi, shouldStartOffline } from './ha-local.js';
export {
  seedDemoConfigs, demoSeedHash, demoResetKeys, clearDemoStorage, DEMO_SEEDED_KEY,
} from './demo-seed.js';
