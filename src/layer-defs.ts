// Shared 2D/3D layer definitions + the built-in "Simple floorplan" preset.
//
// PURE (types-only import) so BOTH the app graph (sidebar / app entry) and the
// card graph (card-shared / the dynamically-imported card editor) can consume
// one list. Never import three.js, the Planner, Lit, or any renderer code here —
// the card editor pulls this module and the chunk-split invariant
// (`grep -c MeshToonMaterial dist/assets/app.js` === 0) depends on it staying
// dependency-free.
//
// LAYER_DEFS is the canonical key→label list. The sidebar renders it sorted
// alphabetically by label; the card editor renders it in a 2-column grid. Preset
// save/load keys by `key`, so display order is cosmetic in both.

import type { Layers2D } from './types.js';

export interface LayerDef { key: keyof Layers2D; label: string }

export const LAYER_DEFS: LayerDef[] = [
  { key: 'bg', label: 'Background image' },
  { key: 'walls', label: 'Walls' },
  { key: 'labels', label: 'Room labels' },
  { key: 'furniture', label: 'Furniture' },
  { key: 'appliances', label: 'Appliances' },
  { key: 'lights', label: 'Lights' },
  { key: 'switches', label: 'Switches' },
  { key: 'sensors', label: 'mmWave sensors' },
  { key: 'motion', label: 'Motion sensors' },
  { key: 'env', label: 'Env sensors' },
  { key: 'info', label: 'Info cards' },
  { key: 'zones', label: 'Zones & halos' },
  { key: 'ground', label: 'Ground / yard' },
  { key: 'vacuumMap', label: 'Vacuum room map' },
  { key: 'heatmap', label: 'Temperature heat-map' },
  { key: 'grid', label: '3D grid' },
  { key: 'targets', label: 'Avatars' },
  { key: 'geo', label: 'Geo landmarks' },
  { key: 'weatherFx', label: 'Weather effects (3D)' },
  { key: 'nameLabels', label: 'Name labels' },
  { key: 'battery', label: 'Battery warnings' },
  { key: 'dimensions', label: 'Dimensions' },
  { key: 'neighborhood', label: 'Neighborhood' },
  { key: 'flights', label: 'Flights' },
  { key: 'bgText', label: 'Background text' },
  { key: 'activity', label: 'Activity glow' },
];

// Layers whose ABSENCE means OFF (the opt-in analysis/diagnostic views). Every
// other key follows the standard opt-out rule (absent = ON).
export const DEFAULT_OFF_LAYERS: (keyof Layers2D)[] = ['activity', 'vacuumMap', 'heatmap'];

export function layerIsOn(layers: Layers2D | undefined, k: keyof Layers2D): boolean {
  const L = layers ?? {};
  return DEFAULT_OFF_LAYERS.includes(k) ? L[k] === true : L[k] !== false;
}

// The built-in "Simple floorplan" preset — walls + rooms + avatars + activity
// glow only. Used by the sidebar preset dropdown, the ?layers=simple URL param
// (app.ts) and the card's `layers: simple` config (card-shared.ts); all three
// held byte-identical copies before this module existed.
//
// bgText is OFF here: a simple floorplan should not fly decorative banner
// planes / trains / grass messages over itself.
export const SIMPLE_LAYERS: Layers2D = {
  bg: false, furniture: false, appliances: false, lights: false,
  switches: false, sensors: false,
  motion: false, env: false, zones: false, targets: true, activity: true,
  bgText: false,
};
