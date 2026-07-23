// Config editor for <diorama-card>. Hand-rolled (no ha-form) because the floor
// picker's OPTIONS depend on the live Diorama store, which loads async — a plain
// ha-form schema can't await it. Dynamically imported by DioramaCard's static
// getConfigElement(), so this code stays out of the card's own chunk.

import { LitElement, html, nothing } from 'lit';
import { customElement } from './define.js';
import { injectSharedStyles } from '../styles.js';
import { getOrCreatePlanner } from '../card-shared.js';
import { validateCardConfig, type DioramaCardConfig } from '../card-config.js';
import type { Planner } from '../planner.js';

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
    const next: DioramaCardConfig = { ...this._config, ...patch };
    // Drop empty-string / undefined keys so the YAML stays clean.
    for (const k of Object.keys(next) as (keyof DioramaCardConfig)[]) {
      if (next[k] === '' || next[k] === undefined) delete next[k];
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

        <div style=${rowStyle}>
          <label>Layers</label>
          <input style=${inStyle} type="text" placeholder="preset name, or simple / full"
                 .value=${c.layers ?? ''}
                 @change=${(e: Event) => this._emit({ layers: (e.target as HTMLInputElement).value })}>
        </div>

        <div style=${rowStyle}>
          <label>Compact</label>
          <input type="checkbox" .checked=${c.compact === true}
                 @change=${(e: Event) => this._emit({ compact: (e.target as HTMLInputElement).checked })}>
        </div>

        ${!this._planner ? html`<div style="color:var(--text-dim,#8aa);font-size:11px;margin-top:6px">
          Connect to Home Assistant to pick a floor by name.</div>` : nothing}
      </div>
    `;
  }
}
