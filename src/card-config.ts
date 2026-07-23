// Diorama Lovelace card config — shared by the card element (src/card.ts) and
// its config editor (src/ui/card-editor.ts). Pure (no DOM / no Planner import)
// so both entries and the test harness can validate without pulling the whole
// app graph.
//
// Every field maps onto EXISTING Planner machinery (the same targets the
// standalone app's ?floor=/?view=/?layers=/?view3d=/?cam= URL params drive) —
// the card is, semantically, a kiosk URL expressed as YAML. No new store state.

export interface DioramaCardConfig {
  type?: string;                 // 'custom:diorama-card' (HA fills it in)
  floor?: string;                // floor name or id  (== ?floor=)
  view?: '2d' | '3d';            // == ?view=
  mode?: 'kiosk' | 'view';       // NEVER 'edit' — setConfig rejects it
  layers?: string;               // preset name/id, or 'simple' | 'full'  (== ?layers=)
  view3d?: string;               // saved 3D view name/id  (== ?view3d=)
  cam?: [number, number, number, number, number, number]; // == ?cam=
  compact?: boolean;             // hide overlay chrome (auto below ~360px if unset)
  panelPath?: string;            // href for the ⤢ expand-to-panel link (default '/diorama')
}

// Validate + normalize a raw config object. THROWS (synchronously) on invalid
// input so HA renders its red error card from the message (custom-card contract).
// Tolerant of extra keys and of `hass` not being set yet.
export function validateCardConfig(raw: unknown): DioramaCardConfig {
  const c = (raw ?? {}) as Record<string, unknown>;
  const out: DioramaCardConfig = {};

  if (c.view !== undefined) {
    if (c.view !== '2d' && c.view !== '3d') throw new Error(`diorama-card: view must be "2d" or "3d" (got ${JSON.stringify(c.view)})`);
    out.view = c.view;
  }
  if (c.mode !== undefined) {
    if (c.mode === 'edit') throw new Error('diorama-card: mode "edit" is not allowed in a card — use "kiosk" or "view"');
    if (c.mode !== 'kiosk' && c.mode !== 'view') throw new Error(`diorama-card: mode must be "kiosk" or "view" (got ${JSON.stringify(c.mode)})`);
    out.mode = c.mode;
  }
  if (c.floor !== undefined) {
    if (typeof c.floor !== 'string') throw new Error('diorama-card: floor must be a string (name or id)');
    if (c.floor) out.floor = c.floor;
  }
  if (c.layers !== undefined) {
    if (typeof c.layers !== 'string') throw new Error('diorama-card: layers must be a string (preset name/id, or "simple"/"full")');
    if (c.layers) out.layers = c.layers;
  }
  if (c.view3d !== undefined) {
    if (typeof c.view3d !== 'string') throw new Error('diorama-card: view3d must be a string (saved view name/id)');
    if (c.view3d) out.view3d = c.view3d;
  }
  if (c.cam !== undefined) {
    const cam = c.cam;
    if (!Array.isArray(cam) || cam.length !== 6 || !cam.every(n => typeof n === 'number' && isFinite(n))) {
      throw new Error('diorama-card: cam must be 6 finite numbers [x,y,z,tx,ty,tz]');
    }
    out.cam = [cam[0], cam[1], cam[2], cam[3], cam[4], cam[5]];
  }
  if (c.compact !== undefined) {
    if (typeof c.compact !== 'boolean') throw new Error('diorama-card: compact must be true or false');
    out.compact = c.compact;
  }
  if (c.panelPath !== undefined) {
    if (typeof c.panelPath !== 'string') throw new Error('diorama-card: panelPath must be a string');
    if (c.panelPath) out.panelPath = c.panelPath;
  }
  return out;
}

// Resolved effective view / mode / compact defaults (single source of truth).
export function resolvedView(cfg: DioramaCardConfig): '2d' | '3d' { return cfg.view ?? '2d'; }
export function resolvedMode(cfg: DioramaCardConfig): 'kiosk' | 'view' { return cfg.mode ?? 'kiosk'; }
export function resolvedPanelPath(cfg: DioramaCardConfig): string { return cfg.panelPath ?? '/diorama'; }

export const STUB_CONFIG: DioramaCardConfig = { view: '2d', mode: 'kiosk' };
