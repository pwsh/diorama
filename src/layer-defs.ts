// Shared 2D/3D layer definitions + the built-in "Simple floorplan" preset.
//
// PURE (types-only import) so BOTH the app graph (sidebar / app entry) and the
// card graph (card-shared / the dynamically-imported card editor) can consume
// one list. Never import three.js, the Planner, Lit, or any renderer code here —
// the card editor pulls this module and the chunk-split invariant
// (`grep -c MeshToonMaterial dist/assets/app.js` === 0) depends on it staying
// dependency-free.
//
// LAYER_DEFS is the canonical key→label list. Both surfaces render it GROUPED by
// `cat` in LAYER_CATS order (the grouping metadata lives here ONCE so the sidebar
// and the card editor can never drift). Preset save/load keys by `key`, so
// display order + grouping are cosmetic in both.

import type { Layers2D } from './types.js';

// Grouping buckets, in display order. Purely presentational — nothing keys off
// a category, so re-homing a layer is a cosmetic change.
export type LayerCat = 'labels' | 'structure' | 'ground' | 'devices' | 'people' | 'outside';

export interface LayerCatDef { id: LayerCat; label: string }

export const LAYER_CATS: LayerCatDef[] = [
  { id: 'labels',    label: 'Labels' },
  { id: 'structure', label: 'Structure & furniture' },
  { id: 'ground',    label: 'Ground & areas' },
  { id: 'devices',   label: 'Devices' },
  { id: 'people',    label: 'People & presence' },
  { id: 'outside',   label: 'Outside world' },
];

export interface LayerDef { key: keyof Layers2D; label: string; cat: LayerCat }

export const LAYER_DEFS: LayerDef[] = [
  // ── Labels ────────────────────────────────────────────────────────────────
  // `labels` covers room names AND ground/pool AREA names (2D) — one "what is
  // this space called" switch, which is how users read it.
  { key: 'labels', label: 'Room & area labels', cat: 'labels' },
  // `objectLabels` covers NAME/caption text on fixtures + structural items.
  // Deliberately NOT value readouts (env readings, info-card values, thermostat
  // temps, W chips): those convey STATE and stay under the fixture's own layer.
  { key: 'objectLabels', label: 'Object labels', cat: 'labels' },
  { key: 'nameLabels', label: 'Person name labels', cat: 'labels' },
  { key: 'dimensions', label: 'Dimensions', cat: 'labels' },
  { key: 'battery', label: 'Battery warnings', cat: 'labels' },
  // ── Structure & furniture ────────────────────────────────────────────────
  { key: 'walls', label: 'Walls', cat: 'structure' },
  { key: 'openings', label: 'Doors & windows', cat: 'structure' },
  { key: 'furniture', label: 'Furniture', cat: 'structure' },
  { key: 'appliances', label: 'Appliances', cat: 'structure' },
  { key: 'peekFloors', label: 'Peek floors', cat: 'structure' },
  { key: 'bg', label: 'Background image', cat: 'structure' },
  { key: 'grid', label: '3D grid', cat: 'structure' },
  // ── Ground & areas ───────────────────────────────────────────────────────
  { key: 'ground', label: 'Ground / yard', cat: 'ground' },
  { key: 'zones', label: 'Zones & halos', cat: 'ground' },
  { key: 'heatmap', label: 'Temperature heat-map', cat: 'ground' },
  { key: 'activity', label: 'Activity glow', cat: 'ground' },
  { key: 'vacuumMap', label: 'Vacuum room map', cat: 'ground' },
  // ── Devices ──────────────────────────────────────────────────────────────
  { key: 'lights', label: 'Lights', cat: 'devices' },
  { key: 'switches', label: 'Switches', cat: 'devices' },
  { key: 'sensors', label: 'mmWave sensors', cat: 'devices' },
  { key: 'motion', label: 'Motion sensors', cat: 'devices' },
  { key: 'env', label: 'Env sensors', cat: 'devices' },
  { key: 'info', label: 'Info cards', cat: 'devices' },
  // ── People & presence ────────────────────────────────────────────────────
  { key: 'targets', label: 'Avatars', cat: 'people' },
  // ── Outside world ────────────────────────────────────────────────────────
  { key: 'geo', label: 'Geo landmarks', cat: 'outside' },
  { key: 'weatherFx', label: 'Weather effects (3D)', cat: 'outside' },
  { key: 'flights', label: 'Flights', cat: 'outside' },
  { key: 'neighborhood', label: 'Neighborhood', cat: 'outside' },
  { key: 'bgText', label: 'Background text', cat: 'outside' },
];

// LAYER_DEFS bucketed into LAYER_CATS order, empty categories dropped. Both the
// sidebar grid and the card editor's Custom… grid render from this, so the two
// can only ever show the same grouping.
export function layerDefsByCat(): { cat: LayerCatDef; defs: LayerDef[] }[] {
  return LAYER_CATS
    .map(cat => ({ cat, defs: LAYER_DEFS.filter(d => d.cat === cat.id) }))
    .filter(g => g.defs.length > 0);
}

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
