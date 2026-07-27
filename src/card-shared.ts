// One shared Planner + HassPanelAdapter per browser tab, used by EVERY mounted
// <diorama-card>. A dashboard can hold N Diorama cards (two of the same floor,
// a 2D card beside a 3D card, the same card on several views); they must all be
// N more *views* of ONE source of truth — one WS state_changed subscription, one
// weather/BLE/MQTT pipeline, one set of eased simulation state — exactly how
// <diorama-app> already serves both <diorama-canvas-2d> and <diorama-three-view>
// off a single Planner. See docs/research/lovelace-card.md §2.5.
//
// ORCHESTRATOR-PINNED: the shared Planner is ALWAYS uiMode 'kiosk' (save() no-ops
// outside edit, so a card can never write the store back to HA). A card's own
// mode ('kiosk' | 'view') is enforced CARD-LOCALLY (a 'view' card suppresses its
// hosted component's interaction) and never flips this shared uiMode.

import { Planner } from './planner.js';
import { HassPanelAdapter } from './ha-panel-adapter.js';
import type { DioramaCardConfig } from './card-config.js';
import { SIMPLE_LAYERS } from './layer-defs.js';
import type { Layers2D } from './types.js';

type CardHass = Parameters<HassPanelAdapter['attach']>[0];

let sharedPlanner: Planner | null = null;
let sharedAdapter: HassPanelAdapter | null = null;
let mountCount = 0;

// Lazily construct the one shared Planner on the first card's first `hass`, then
// return the SAME instance to every subsequent card. `attach(hass)` is a no-op
// after the first real call (the adapter tracks state via its own state_changed
// subscription), so re-calling this on every hass push from every card is cheap.
export function getOrCreatePlanner(hass: CardHass): Planner {
  if (!sharedPlanner) {
    sharedAdapter = new HassPanelAdapter();
    sharedPlanner = new Planner();
    sharedPlanner.connectWith(sharedAdapter);
    // Force kiosk once at creation — never edit, never persist to HA.
    sharedPlanner.setUiMode('kiosk');
  }
  sharedAdapter!.attach(hass);
  return sharedPlanner;
}

// Test / introspection hook — the currently-shared Planner (or null before any
// card has received a hass). Never constructs one.
export function peekSharedPlanner(): Planner | null { return sharedPlanner; }

export function noteCardMounted(): void { mountCount++; }
export function noteCardUnmounted(): void { mountCount = Math.max(0, mountCount - 1); }
export function cardMountCount(): number { return mountCount; }

// Apply a card's config to the shared Planner. Mirrors app.ts's _applyUrlParams
// floor/layers retry-on-config machinery (the store loads async in both cases),
// but leaves uiMode alone (always kiosk — see above) and routes view3d/cam
// through planner.urlTemplate, which three-view's own _applyUrlTemplate consumes.
//
// NOTE: floor + layers are GLOBAL on the shared Planner, so with multiple cards
// the last-applied config wins — a known, documented v1 limitation of the
// shared-Planner design (research §3.3, open question 3). The common case (one
// Diorama card, or several on the same floor) is unaffected. That applies to the
// explicit `layers: {…}` object form too. By contrast the card's `scene:` block
// is CARD-LOCAL (passed as a prop into that card's own <diorama-three-view>), so
// two 3D cards can legitimately differ on glass house / auto-follow / FOV.
//
// Returns a disposer that cancels the pending retry listener (call it when the
// card disconnects or re-applies a new config so listeners don't accumulate).
export function applyCardConfig(p: Planner, cfg: DioramaCardConfig): () => void {
  // view3d / cam ride the URL-template that three-view reads on mount. Only the
  // STRING form of `layers` is a template (it needs the store's preset list to
  // resolve a name); the object form is applied outright below.
  const layerName = typeof cfg.layers === 'string' ? cfg.layers : undefined;
  p.urlTemplate = {
    floor: cfg.floor,
    layers: layerName,
    view3d: cfg.view3d,
    cam: cfg.cam ? [...cfg.cam] : undefined,
  };

  const done = { floor: !cfg.floor, layers: !cfg.layers };

  // Explicit {layerKey: boolean} object — no name to resolve, so it lands
  // immediately (and is GLOBAL on the shared Planner, same caveat as below).
  if (cfg.layers && typeof cfg.layers === 'object') {
    p.store.layers2d = { ...(cfg.layers as Layers2D) };
    done.layers = true;
    p.emitConfig();
  }

  if (done.floor && done.layers) return () => {};

  const started = Date.now();
  const attempt = () => {
    if (!done.floor && cfg.floor) {
      const want = cfg.floor.toLowerCase();
      const fl = p.store.floors.find(f => f.id === cfg.floor || f.name.toLowerCase() === want);
      // A disabled floor is hidden from the kiosk picker — give up on the param.
      if (fl && fl.disabled) {
        done.floor = true;
      } else if (fl) {
        p.store.currentFloorId = fl.id;
        p.viewCenter = null; p.zoom = 1;
        done.floor = true;
        p.emitConfig();
      }
    }
    if (!done.layers && layerName) {
      const want = layerName.toLowerCase();
      if (want === 'simple') {
        p.store.layers2d = { ...SIMPLE_LAYERS };
        done.layers = true; p.emitConfig();
      } else if (want === 'full') {
        p.store.layers2d = undefined;
        done.layers = true; p.emitConfig();
      } else {
        const pr = (p.store.layerPresets2d ?? []).find(x =>
          x.id === layerName || x.name.toLowerCase() === want);
        if (pr) { p.store.layers2d = { ...pr.layers }; done.layers = true; p.emitConfig(); }
      }
    }
    if ((done.floor && done.layers) || Date.now() - started > 20000) {
      p.removeEventListener('config', attempt);
    }
  };
  p.addEventListener('config', attempt);
  attempt();
  return () => p.removeEventListener('config', attempt);
}
