// Config editor for <diorama-card>. Hand-rolled (no ha-form) because the floor
// picker's OPTIONS depend on the live Diorama store, which loads async — a plain
// ha-form schema can't await it. Dynamically imported by DioramaCard's static
// getConfigElement(), so this code stays out of the card's own chunk.

import { LitElement, html, nothing } from 'lit';
import { customElement } from './define.js';
import { injectSharedStyles } from '../styles.js';
import { getOrCreatePlanner } from '../card-shared.js';
import { validateCardConfig, CARD_SCENE_BOOLS, type DioramaCardConfig, type CardSceneConfig } from '../card-config.js';
import { LAYER_DEFS, layerIsOn } from '../layer-defs.js';
import type { Planner } from '../planner.js';
import type { Layers2D } from '../types.js';

// scene.* boolean labels, in CARD_SCENE_BOOLS order.
const SCENE_LABELS: Record<(typeof CARD_SCENE_BOOLS)[number], string> = {
  glassHouse: 'Glass house',
  wallCutaway: 'Wall cutaway',
  autoFollow: 'Auto-follow camera',
  cinematicOrbit: 'Cinematic orbit',
  simsCam: 'Sims cam (45° snap)',
  plumbobs: 'Plumbobs',
  skyBackdrop: 'Sky backdrop',
};

type CardHass = Parameters<typeof getOrCreatePlanner>[0];

@customElement('diorama-card-editor')
export class DioramaCardEditor extends LitElement {
  private _config: DioramaCardConfig = {};
  private _planner: Planner | null = null;
  private _onCfg = () => this.requestUpdate();

  protected override createRenderRoot() { return this; }

  setConfig(config: unknown): void {
    // Tolerate an in-progress invalid config in the editor (don't throw here —
    // the card's own setConfig is the authority that surfaces errors).
    try { this._config = validateCardConfig(config); }
    catch { this._config = (config ?? {}) as DioramaCardConfig; }
    this.requestUpdate();
  }

  set hass(h: CardHass) {
    if (!h || this._planner) return;
    this._planner = getOrCreatePlanner(h);
    this._planner.addEventListener('config', this._onCfg);   // re-render when the store loads
    this.requestUpdate();
  }

  override connectedCallback(): void { super.connectedCallback(); injectSharedStyles(this); }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._planner?.removeEventListener('config', this._onCfg);
  }

  private _emit(patch: Partial<DioramaCardConfig>): void {
    // `type` FIRST so a spread can only ever overwrite it with the real value —
    // an emitted config missing `type` makes HA throw "No type provided" and
    // wedges the visual editor (user-reported). validateCardConfig preserves it
    // now, but a config stored before that fix may still lack it.
    const next: DioramaCardConfig = { type: 'custom:diorama-card', ...this._config, ...patch };
    // Drop empty-string / undefined keys so the YAML stays clean.
    for (const k of Object.keys(next) as (keyof DioramaCardConfig)[]) {
      if (next[k] === '' || next[k] === undefined) delete next[k];
    }
    // `scene` is a NESTED object — the loop above only sweeps top-level keys, so
    // clean its own undefined entries (an "(inherit)" pick) and drop the block
    // entirely once it's empty.
    if (next.scene) {
      const sc = { ...next.scene } as Record<string, unknown>;
      for (const k of Object.keys(sc)) if (sc[k] === undefined || sc[k] === '') delete sc[k];
      if (Object.keys(sc).length) next.scene = sc as CardSceneConfig;
      else delete next.scene;
    }
    this._config = next;
    this.dispatchEvent(new CustomEvent('config-changed', {
      bubbles: true, composed: true, detail: { config: next },
    }));
    this.requestUpdate();
  }

  override render() {
    const c = this._config;
    const floors = this._planner?.store.floors ?? [];
    const rowStyle = 'display:flex;justify-content:space-between;align-items:center;gap:10px;margin:8px 0';
    const inStyle = 'flex:1;min-width:0';
    return html`
      <div style="padding:10px 4px;font-size:13px">
        <div style=${rowStyle}>
          <label>View</label>
          <select style=${inStyle} @change=${(e: Event) =>
            this._emit({ view: (e.target as HTMLSelectElement).value as '2d' | '3d' })}>
            <option value="2d" ?selected=${(c.view ?? '2d') === '2d'}>2D floor plan</option>
            <option value="3d" ?selected=${c.view === '3d'}>3D room view</option>
          </select>
        </div>

        <div style=${rowStyle}>
          <label>Mode</label>
          <select style=${inStyle} @change=${(e: Event) =>
            this._emit({ mode: (e.target as HTMLSelectElement).value as 'kiosk' | 'view' })}>
            <option value="kiosk" ?selected=${(c.mode ?? 'kiosk') === 'kiosk'}>Kiosk (tap to control)</option>
            <option value="view" ?selected=${c.mode === 'view'}>View only (no interaction)</option>
          </select>
        </div>

        <div style=${rowStyle}>
          <label>Floor</label>
          ${floors.length ? html`
            <select style=${inStyle} @change=${(e: Event) =>
              this._emit({ floor: (e.target as HTMLSelectElement).value })}>
              <option value="" ?selected=${!c.floor}>(current / first)</option>
              ${floors.map(f => html`<option value=${f.id} ?selected=${c.floor === f.id || c.floor === f.name}>${f.name}</option>`)}
            </select>
          ` : html`
            <input style=${inStyle} type="text" placeholder="floor name or id (loads once connected)"
                   .value=${c.floor ?? ''}
                   @change=${(e: Event) => this._emit({ floor: (e.target as HTMLInputElement).value })}>`}
        </div>

        ${this._layersBlock(rowStyle, inStyle)}

        <div style=${rowStyle}>
          <label>Compact</label>
          <input type="checkbox" .checked=${c.compact === true}
                 @change=${(e: Event) => this._emit({ compact: (e.target as HTMLInputElement).checked })}>
        </div>

        ${(c.view ?? '2d') === '3d' ? this._sceneBlock(rowStyle, inStyle) : nothing}

        ${!this._planner ? html`<div style="color:var(--text-dim,#8aa);font-size:11px;margin-top:6px">
          Connect to Home Assistant to pick a floor by name.</div>` : nothing}
      </div>
    `;
  }

  // ── Layers: preset dropdown + (Custom…) explicit multi-select grid ────────
  private _layersBlock(rowStyle: string, inStyle: string) {
    const c = this._config;
    const custom = !!c.layers && typeof c.layers === 'object';
    const presets = this._planner?.store.layerPresets2d ?? [];
    // Selected dropdown value: '' = unchanged, '__custom' = explicit object,
    // otherwise the string the config already carries.
    const sel = custom ? '__custom' : (typeof c.layers === 'string' ? c.layers : '');
    const L = (custom ? c.layers : {}) as Layers2D;
    const onPreset = (e: Event) => {
      const v = (e.target as HTMLSelectElement).value;
      if (v === '__custom') {
        // Seed the grid from the CURRENT live store so "Custom…" starts from
        // what the user already sees rather than an arbitrary all-on default.
        this._emit({ layers: this._explicitLayers(this._planner?.store.layers2d) });
      } else {
        this._emit({ layers: v || undefined });
      }
    };
    return html`
      <div style=${rowStyle}>
        <label>Layers</label>
        <select style=${inStyle} @change=${onPreset}>
          <option value="" ?selected=${sel === ''}>(unchanged)</option>
          <option value="full" ?selected=${sel === 'full'}>Full detail</option>
          <option value="simple" ?selected=${sel === 'simple'}>Simple floorplan</option>
          ${presets.map(pr => html`
            <option value=${pr.name} ?selected=${sel === pr.name || sel === pr.id}>${pr.name}</option>`)}
          <option value="__custom" ?selected=${custom}>Custom…</option>
        </select>
      </div>
      ${custom ? html`
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px;margin:2px 0 10px 0;
                    padding:6px 8px;border:1px solid var(--border,#2a3a4c);border-radius:5px">
          ${LAYER_DEFS.map(d => html`
            <label style="display:flex;align-items:center;gap:6px;font-size:11px;
                          color:var(--text-dim,#8aa);cursor:pointer">
              <input type="checkbox" .checked=${L[d.key] !== false}
                     @change=${(e: Event) => {
                       const nl = this._explicitLayers(L);
                       nl[d.key] = (e.target as HTMLInputElement).checked;
                       this._emit({ layers: nl as Record<string, boolean> });
                     }}>
              <span>${d.label}</span>
            </label>`)}
        </div>` : nothing}
    `;
  }

  // Expand a sparse Layers2D into an EXPLICIT every-key record. Explicit beats
  // sparse in the YAML: the reader can see exactly what the card shows without
  // knowing which layers default on vs off.
  private _explicitLayers(src: Layers2D | undefined): Record<string, boolean> {
    const out: Record<string, boolean> = {};
    for (const d of LAYER_DEFS) out[d.key] = layerIsOn(src, d.key);
    return out;
  }

  // ── Scene (3D): per-key (inherit) / On / Off + independent FOV ────────────
  private _sceneBlock(rowStyle: string, inStyle: string) {
    const s: CardSceneConfig = this._config.scene ?? {};
    const setKey = (k: keyof CardSceneConfig, v: boolean | number | undefined) =>
      this._emit({ scene: { ...s, [k]: v } as CardSceneConfig });
    const triStyle = inStyle + ';max-width:120px';
    const fovRow = (k: 'fovV' | 'fovH', label: string, lo: number, hi: number) => html`
      <div style=${rowStyle}>
        <label>${label}</label>
        <input style=${inStyle} type="number" min=${lo} max=${hi} placeholder="(inherit)"
               .value=${s[k] != null ? String(s[k]) : ''}
               @change=${(e: Event) => {
                 const raw = (e.target as HTMLInputElement).value.trim();
                 if (!raw) { setKey(k, undefined); return; }
                 const n = Number(raw);
                 setKey(k, isFinite(n) ? Math.min(hi, Math.max(lo, n)) : undefined);
               }}>
      </div>`;
    return html`
      <div style="margin-top:12px;border-top:1px solid var(--border,#2a3a4c);padding-top:8px">
        <div style="font-size:11px;color:var(--text-dim,#8aa);margin-bottom:4px">
          Scene (3D) — blank inherits the panel's own setting.
        </div>
        ${CARD_SCENE_BOOLS.map(k => html`
          <div style=${rowStyle}>
            <label>${SCENE_LABELS[k]}</label>
            <select style=${triStyle} @change=${(e: Event) => {
              const v = (e.target as HTMLSelectElement).value;
              setKey(k, v === '' ? undefined : v === 'on');
            }}>
              <option value="" ?selected=${s[k] === undefined}>(inherit)</option>
              <option value="on" ?selected=${s[k] === true}>On</option>
              <option value="off" ?selected=${s[k] === false}>Off</option>
            </select>
          </div>`)}
        ${fovRow('fovV', 'Vertical FOV', 10, 120)}
        ${fovRow('fovH', 'Horizontal FOV', 10, 150)}
      </div>
    `;
  }
}
