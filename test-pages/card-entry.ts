// esbuild bundle entry for card-test.html. Registers <diorama-card> (+ its
// hosted components as a side effect of importing card.js) and re-exports the
// bits the harness asserts against. Copied into a temp src tree and bundled:
//   T=$(mktemp -d); cp -r src/* "$T"/
//   cp test-pages/fake-avatar-store.ts "$T"/avatar-store.ts
//   cp test-pages/card-entry.ts "$T"/card-entry.ts
//   npx esbuild "$T"/card-entry.ts --bundle --format=esm --outfile=<harness>/card.mod.js
import './card.js';
export { Planner } from './planner.js';
export { getOrCreatePlanner, peekSharedPlanner, cardMountCount } from './card-shared.js';
export { validateCardConfig, CARD_SCENE_BOOLS } from './card-config.js';
export { LAYER_DEFS, SIMPLE_LAYERS, layerIsOn } from './layer-defs.js';
