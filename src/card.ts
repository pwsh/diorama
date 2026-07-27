// Diorama Lovelace custom-card entry → dist/diorama-card.js (third Vite entry
// beside index.html and src/panel.ts). Registers <diorama-card>, a stripped-down
// host that drops ONE floor (2D) or a kiosk-framed 3D room view into any
// dashboard — no <diorama-app>, no topbar / sidebar / toolbar / modals.
//
// Lovelace resource: /hacsfiles/diorama/diorama-card.js  (type: module)
// YAML:              type: custom:diorama-card
//
// This entry must NOT statically pull in three.js — it hosts <diorama-three-view>,
// which dynamic-imports the renderer chunk (shared with the panel + app entries).
// (Verified by the build gate: grep -c MeshToonMaterial dist/diorama-card.js = 0.)

import { LitElement, html, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import { customElement } from './ui/define.js';
import { injectSharedStyles } from './styles.js';
import type { Planner } from './planner.js';
import type { Scene3D } from './types.js';
import {
  getOrCreatePlanner, applyCardConfig, noteCardMounted, noteCardUnmounted,
} from './card-shared.js';
import {
  validateCardConfig, resolvedView, resolvedMode, resolvedPanelPath, STUB_CONFIG,
  type DioramaCardConfig,
} from './card-config.js';
import './ui/canvas-2d.js';
import './ui/three-view.js';
import './ui/weather-chip.js';
import './ui/compass.js';

type CardHass = Parameters<typeof getOrCreatePlanner>[0];

// Below this measured width the card auto-enters compact mode (hides the 3D
// button bar / 2D reset button + overlay chrome) unless config forces it.
const AUTO_COMPACT_PX = 360;

@customElement('diorama-card')
export class DioramaCard extends LitElement {
  @state() private _config: DioramaCardConfig = {};
  @state() private _autoCompact = false;
  private _planner: Planner | null = null;
  private _disposeTpl: (() => void) | null = null;
  private _ro: ResizeObserver | null = null;
  private _onCfg = () => this.requestUpdate();

  // Light DOM so the shared CSS applies + native form behavior is preserved,
  // exactly like every other Diorama component.
  protected override createRenderRoot() { return this; }

  // ── HA custom-card contract ──────────────────────────────────────────────

  // Called on creation + on every config change (incl. live YAML edits). Must
  // validate synchronously and THROW on bad input (HA renders a red error card).
  // Must NOT assume `hass` is set yet.
  setConfig(config: unknown): void {
    this._config = validateCardConfig(config);
    if (this._planner) this._applyConfig();
    this.requestUpdate();
  }

  // Set by HA on effectively every state change. First call boots (or joins) the
  // one shared, always-kiosk Planner; later calls are cheap (adapter.attach is a
  // no-op after the first).
  set hass(h: CardHass) {
    if (!h) return;
    const first = !this._planner;
    this._planner = getOrCreatePlanner(h);
    if (first) {
      this._planner.addEventListener('config', this._onCfg);
      this._applyConfig();
      this.requestUpdate();
    }
  }

  // Masonry sizing (1 unit = 50 px). 3D wants more vertical room than 2D.
  getCardSize(): number { return resolvedView(this._config) === '3d' ? 5 : 4; }

  // Sections-view sizing (row height 56 px). A floor plan reads badly in a narrow
  // column, so floor at half a 12-col section.
  getGridOptions(): { rows: number; min_rows: number; max_rows: number; columns: string; min_columns: number } {
    return {
      rows: resolvedView(this._config) === '3d' ? 5 : 4,
      min_rows: 3, max_rows: 12,
      columns: 'full', min_columns: 6,
    };
  }

  static getStubConfig(): DioramaCardConfig { return { ...STUB_CONFIG }; }

  static async getConfigElement(): Promise<HTMLElement> {
    await import('./ui/card-editor.js');
    return document.createElement('diorama-card-editor');
  }

  // ── lifecycle ────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    injectSharedStyles(this);
    this.style.display = 'block';
    this.style.height = '100%';
    noteCardMounted();
    if (this._planner) this._planner.addEventListener('config', this._onCfg);
    this._ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width ?? this.clientWidth;
      const next = w > 0 && w < AUTO_COMPACT_PX;
      if (next !== this._autoCompact) this._autoCompact = next;
    });
    this._ro.observe(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // Do NOT tear down the shared Planner — other cards / a re-mount reuse it.
    this._planner?.removeEventListener('config', this._onCfg);
    this._ro?.disconnect(); this._ro = null;
    noteCardUnmounted();
  }

  private _applyConfig(): void {
    if (!this._planner) return;
    this._disposeTpl?.();
    this._disposeTpl = applyCardConfig(this._planner, this._config);
  }

  private get _compact(): boolean { return this._config.compact ?? this._autoCompact; }

  // Card-local 3D scene override, built from the `scene:` config block. The
  // boolean/number keys map 1:1 onto Scene3D field names (simsCam is the one
  // exception — it's a runtime three-view toggle, not a Scene3D field, so it
  // rides its own prop). Returns null when nothing was configured so the panel
  // path (and 2D cards, which ignore it entirely) stays byte-identical.
  private get _sceneOverride(): Partial<Scene3D> | null {
    const s = this._config.scene;
    if (!s) return null;
    const o: Partial<Scene3D> = {};
    if (s.glassHouse !== undefined) o.glassHouse = s.glassHouse;
    if (s.wallCutaway !== undefined) o.wallCutaway = s.wallCutaway;
    if (s.autoFollow !== undefined) o.autoFollow = s.autoFollow;
    if (s.cinematicOrbit !== undefined) o.cinematicOrbit = s.cinematicOrbit;
    if (s.plumbobs !== undefined) o.plumbobs = s.plumbobs;
    if (s.skyBackdrop !== undefined) o.skyBackdrop = s.skyBackdrop;
    if (s.fovV !== undefined) o.fovV = s.fovV;
    if (s.fovH !== undefined) o.fovH = s.fovH;
    return Object.keys(o).length ? o : null;
  }

  override render() {
    const p = this._planner;
    if (!p) {
      return html`<div style="display:flex;align-items:center;justify-content:center;
                  height:100%;min-height:180px;color:var(--text-dim,#8aa);font-size:13px">
        Diorama — waiting for Home Assistant…</div>`;
    }
    const view = resolvedView(this._config);
    const mode = resolvedMode(this._config);
    const interactive = mode === 'kiosk';
    const compact = this._compact;
    const minH = view === '3d' ? 320 : 240;
    const f = p.floor();
    const href = `${resolvedPanelPath(this._config)}?floor=${encodeURIComponent(f.id)}` +
                 `&view=${view}&mode=${mode}`;
    return html`
      <div style="position:relative;height:100%;min-height:${minH}px;overflow:hidden;
                  border-radius:12px;background:var(--bg,#0d1116)">
        ${view === '3d'
          ? html`<diorama-three-view .planner=${p} .compact=${compact} .interactive=${interactive}
                    .scene3dOverride=${this._sceneOverride}
                    .simsCamOverride=${this._config.scene?.simsCam ?? null}></diorama-three-view>`
          : html`<div style="position:absolute;inset:0">
              <diorama-canvas-2d .planner=${p} .compact=${compact} .interactive=${interactive}></diorama-canvas-2d>
            </div>`}
        ${compact ? nothing : html`
          <diorama-weather-chip .planner=${p}></diorama-weather-chip>
          <diorama-compass .planner=${p}></diorama-compass>
          <div class="diorama-card-floorchip"
               style="position:absolute;top:8px;${view === '3d' ? 'right:8px' : 'left:8px'};
                      background:rgba(10,14,20,0.72);border:1px solid #2a3a4c;border-radius:5px;
                      padding:3px 8px;color:#cfd8dc;font-size:11px;z-index:6;pointer-events:none;
                      max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${f.name}
          </div>
          <a class="diorama-card-expand" href=${href} title="Open the full Diorama panel"
             style="position:absolute;bottom:8px;right:8px;z-index:6;
                    background:rgba(10,14,20,0.72);border:1px solid #2a3a4c;border-radius:5px;
                    padding:2px 7px;color:#90caf9;font-size:13px;text-decoration:none;line-height:1.4">⤢</a>`}
      </div>
    `;
  }
}

// Register in the "Add card" picker.
interface CustomCardEntry { type: string; name?: string; description?: string; preview?: boolean; documentationURL?: string }
const w = window as unknown as { customCards?: CustomCardEntry[] };
w.customCards = w.customCards || [];
if (!w.customCards.some(c => c.type === 'diorama-card')) {
  w.customCards.push({
    type: 'diorama-card',
    name: 'Diorama',
    description: 'A live spatial floor plan / 3D room view of your home.',
    preview: true,
    documentationURL: 'https://github.com/pwsh/diorama',
  });
}
