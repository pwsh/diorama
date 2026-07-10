import { LitElement, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from './define.js';
import { finishZoneEdit, cancelZoneEdit } from '../canvas-interact.js';
import type { Planner } from '../planner.js';
import type { Floor, HassState } from '../types.js';

// ── Floor settings modal ─────────────────────────────────────────────────
@customElement('diorama-floor-modal')
export class FloorModal extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() open = false;
  @state() editing: Floor | null = null;
  @state() private _name = '';
  @state() private _w = 8000;
  @state() private _d = 6000;

  protected override createRenderRoot() { return this; }

  show(floor: Floor | null): void {
    this.editing = floor;
    this._name = floor ? floor.name : `Floor ${this.planner.store.floors.length + 1}`;
    this._w = floor ? floor.w : 8000;
    this._d = floor ? floor.d : 6000;
    this.open = true;
  }

  override render() {
    if (!this.open) return nothing;
    return html`
      <div class="modal-ov" @click=${(e: MouseEvent) => { if (e.target === e.currentTarget) this.open = false; }}>
        <div class="modal" style="max-width:340px">
          <h3>${this.editing ? 'Edit Floor' : 'New Floor'}
            <button class="close" @click=${() => this.open = false}>✕</button>
          </h3>
          <div class="row"><label>Name</label>
            <input type="text" .value=${this._name} @input=${(e: Event) => this._name = (e.target as HTMLInputElement).value}>
          </div>
          <div class="row"><label>Width (mm)</label>
            <input type="number" min="1000" step="100" .value=${String(this._w)}
                   @input=${(e: Event) => this._w = parseFloat((e.target as HTMLInputElement).value) || 8000}>
          </div>
          <div class="row"><label>Depth (mm)</label>
            <input type="number" min="1000" step="100" .value=${String(this._d)}
                   @input=${(e: Event) => this._d = parseFloat((e.target as HTMLInputElement).value) || 6000}>
          </div>
          <div style="display:flex;gap:6px;margin-top:14px;justify-content:flex-end">
            <button class="btn" @click=${() => this.open = false}>Cancel</button>
            <button class="btn active" @click=${this._save}>Save</button>
          </div>
        </div>
      </div>
    `;
  }

  private _save = () => {
    const name = this._name.trim() || 'Floor';
    const w = Math.max(1000, this._w);
    const d = Math.max(1000, this._d);
    this.planner.saveFloorEdit(this.editing?.id ?? null, name, w, d);
    this.open = false;
  };
}

// ── Zone-edit toolbar ────────────────────────────────────────────────────
@customElement('diorama-zone-edit-bar')
export class ZoneEditBar extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  protected override createRenderRoot() { return this; }

  override connectedCallback(): void {
    super.connectedCallback();
    this.planner.addEventListener('config', this._tick);
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.planner.removeEventListener('config', this._tick);
  }
  private _tick = () => this.requestUpdate();

  override render() {
    const ez = this.planner.editZone;
    if (!ez) return nothing;
    const s = this.planner.floor().sensors.find(x => x.id === ez.sensorId);
    const zone = s ? (ez.prefix === 'iz' ? this.planner.zonesBy[s.id].inclusion
                                          : this.planner.zonesBy[s.id].filter)[ez.zi] : null;
    const msg = `${s?.label || 'Sensor'} / ${zone?.name || ez.prefix + ez.zi}: ${ez.verts.length} pt — click to add, dbl-click to finish`;
    return html`
      <div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;
                  background:rgba(10,10,30,0.93);border:1px solid var(--accent);border-radius:6px;
                  padding:6px 14px;align-items:center;gap:8px;z-index:6;font-size:12px;white-space:nowrap">
        <span style="color:var(--text)">${msg}</span>
        <button class="btn-sm" @click=${() => {
          if (this.planner.editZone && this.planner.editZone.verts.length > 0) {
            this.planner.editZone.verts.pop();
            this.planner.emitConfig();
          }
        }}>↩ Undo</button>
        <button class="btn-sm" style="background:var(--accent);color:#fff;border-color:var(--accent)"
                @click=${() => finishZoneEdit(this.planner)}>✓ Finish</button>
        <button class="btn-sm" @click=${() => cancelZoneEdit(this.planner)}>✕</button>
      </div>
    `;
  }
}

// ── Entity picker ────────────────────────────────────────────────────────
// Supports either a single domain (e.g. 'binary_sensor') or null/'' (all).
// Pulls HA device + entity registries on first open so the user can search by
// device name, and so each row can show its parent device as a subtitle.
@customElement('diorama-entity-picker')
export class EntityPicker extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() open = false;
  @state() private _domain = '';
  @state() private _q = '';
  @state() private _deviceFilter = '';
  private _onPick: ((id: string) => void) | null = null;

  // Cache loaded once per session: entity_id → device_id, device_id → name.
  private _entityToDevice: Record<string, string | null> = {};
  private _deviceNames: Record<string, string> = {};
  private _registriesLoaded = false;

  protected override createRenderRoot() { return this; }

  show(domain: string | null, onPick: (id: string) => void): void {
    this._domain = domain ?? '';
    this._onPick = onPick;
    this._q = '';
    this._deviceFilter = '';
    this.open = true;
    void this._loadRegistries();
  }

  private async _loadRegistries(): Promise<void> {
    if (this._registriesLoaded || !this.planner.hass) return;
    try {
      const [devs, ents] = await Promise.all([
        this.planner.hass.getDevices(),
        this.planner.hass.getEntityRegistry(),
      ]);
      for (const d of devs) {
        this._deviceNames[d.id] = d.name_by_user || d.name || d.id;
      }
      for (const e of ents) {
        this._entityToDevice[e.entity_id] = e.device_id;
      }
      this._registriesLoaded = true;
      this.requestUpdate();
    } catch { /* registry endpoints not available — picker still works without them */ }
  }

  override render() {
    if (!this.open) return nothing;
    const states = this.planner.hass?.states || {};
    const allDomains = new Set<string>();
    const allDevices = new Set<string>();
    for (const id of Object.keys(states)) {
      const dot = id.indexOf('.');
      if (dot > 0) allDomains.add(id.slice(0, dot));
      const did = this._entityToDevice[id];
      if (did) allDevices.add(did);
    }
    const sortedDomains = [...allDomains].sort();
    const sortedDeviceIds = [...allDevices].sort((a, b) =>
      (this._deviceNames[a] || a).localeCompare(this._deviceNames[b] || b));

    const items: { id: string; name: string; deviceName: string | null }[] = [];
    const q = this._q.toLowerCase();
    for (const id of Object.keys(states)) {
      const dot = id.indexOf('.');
      const dom = dot > 0 ? id.slice(0, dot) : '';
      if (this._domain && dom !== this._domain) continue;
      const did = this._entityToDevice[id];
      if (this._deviceFilter && did !== this._deviceFilter) continue;
      const st = states[id] as HassState;
      const name = String((st.attributes as Record<string, unknown>)?.friendly_name || id);
      const deviceName = did ? this._deviceNames[did] : null;
      if (q) {
        const haystack = (name + ' ' + id + ' ' + (deviceName || '')).toLowerCase();
        if (!haystack.includes(q)) continue;
      }
      items.push({ id, name, deviceName });
    }
    items.sort((a, b) => a.name.localeCompare(b.name));

    return html`
      <div class="modal-ov" @click=${(e: MouseEvent) => { if (e.target === e.currentTarget) this.open = false; }}>
        <div class="modal">
          <h3>Pick an entity<button class="close" @click=${() => this.open = false}>✕</button></h3>
          <div style="display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap">
            <select .value=${this._domain}
                    @change=${(e: Event) => this._domain = (e.target as HTMLSelectElement).value}
                    style="background:#111;color:var(--text);border:1px solid var(--border);
                           border-radius:5px;padding:6px 8px;font-size:12px;flex:1;min-width:120px">
              <option value="">All domains</option>
              ${sortedDomains.map(d => html`<option value=${d} ?selected=${this._domain === d}>${d}</option>`)}
            </select>
            <select .value=${this._deviceFilter}
                    ?disabled=${!this._registriesLoaded}
                    @change=${(e: Event) => this._deviceFilter = (e.target as HTMLSelectElement).value}
                    style="background:#111;color:var(--text);border:1px solid var(--border);
                           border-radius:5px;padding:6px 8px;font-size:12px;flex:2;min-width:140px">
              <option value="">${this._registriesLoaded ? 'All devices' : 'Loading devices…'}</option>
              ${sortedDeviceIds.map(did => html`
                <option value=${did} ?selected=${this._deviceFilter === did}>
                  ${this._deviceNames[did] || did}
                </option>`)}
            </select>
          </div>
          <input class="search" placeholder="Search by entity, friendly name, or device…"
                 .value=${this._q}
                 @input=${(e: Event) => this._q = (e.target as HTMLInputElement).value}>
          <div class="entity-list">
            ${items.length === 0
              ? html`<div class="entity-item" style="cursor:default;color:var(--text-dim)">
                  No entities match.</div>`
              : items.slice(0, 300).map(it => html`
                  <div class="entity-item" @click=${() => { this._onPick?.(it.id); this.open = false; }}>
                    <div style="flex:1;overflow:hidden">
                      <div class="name">${it.name}</div>
                      ${it.deviceName ? html`
                        <div style="font-size:10px;color:var(--text-dim)">📦 ${it.deviceName}</div>
                      ` : nothing}
                    </div>
                    <div class="eid">${it.id}</div>
                  </div>`)}
          </div>
        </div>
      </div>
    `;
  }
}

// ── Light config modal ───────────────────────────────────────────────────
@customElement('diorama-light-config')
export class LightConfig extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() open = false;
  @state() private _entityId = '';

  protected override createRenderRoot() { return this; }

  show(entityId: string): void { this._entityId = entityId; this.open = true; }

  override render() {
    if (!this.open) return nothing;
    const st = this.planner.hass?.states?.[this._entityId];
    if (!st) return nothing;
    const attrs = (st.attributes || {}) as Record<string, unknown>;
    const modes = Array.isArray(attrs.supported_color_modes) ? attrs.supported_color_modes as string[] : [];
    const supportsBri = modes.some(m => m !== 'onoff') || typeof attrs.brightness === 'number';
    const supportsRgb = modes.some(m => ['rgb','rgbw','rgbww','hs','xy'].includes(m)) || Array.isArray(attrs.rgb_color);
    const supportsTemp = modes.includes('color_temp') || typeof attrs.color_temp_kelvin === 'number';
    const minK = (attrs.min_color_temp_kelvin as number) || 2000;
    const maxK = (attrs.max_color_temp_kelvin as number) || 6500;
    const curBri = typeof attrs.brightness === 'number' ? (attrs.brightness as number) : 255;
    const curRgb = Array.isArray(attrs.rgb_color) ? (attrs.rgb_color as number[]) : [255, 230, 180];
    const curK = typeof attrs.color_temp_kelvin === 'number' ? (attrs.color_temp_kelvin as number)
               : Math.round((minK + maxK) / 2);
    const isOn = st.state === 'on';
    const hex = '#' + curRgb.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
    const call = (data: Record<string, unknown>) =>
      this.planner.hass?.callService('light', 'turn_on', { entity_id: this._entityId, ...data });
    return html`
      <div class="modal-ov" @click=${(e: MouseEvent) => { if (e.target === e.currentTarget) this.open = false; }}>
        <div class="modal">
          <h3>${(attrs.friendly_name as string) || this._entityId}
            <button class="close" @click=${() => this.open = false}>✕</button>
          </h3>
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Power</label>
            <label class="mini-toggle" style="width:36px;height:20px">
              <input type="checkbox" .checked=${isOn}
                     @change=${(e: Event) => this.planner.hass?.callService('light',
                       (e.target as HTMLInputElement).checked ? 'turn_on' : 'turn_off',
                       { entity_id: this._entityId })}>
              <span></span>
            </label>
          </div>
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Brightness</label>
            ${supportsBri ? html`
              <input type="range" min="1" max="255" .value=${String(curBri)}
                     style="flex:1"
                     @input=${(e: Event) => call({ brightness: parseInt((e.target as HTMLInputElement).value) })}>
              <span style="font-size:11px;font-family:monospace;min-width:40px;text-align:right">
                ${Math.round(curBri / 255 * 100)}%
              </span>
            ` : html`<span style="font-size:11px;color:var(--text-dim);font-style:italic">not supported</span>`}
          </div>
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Color</label>
            ${supportsRgb ? html`
              <input type="color" .value=${hex}
                     style="width:40px;height:28px;border:none;background:transparent;cursor:pointer;padding:0"
                     @input=${(e: Event) => {
                       const v = (e.target as HTMLInputElement).value;
                       call({ rgb_color: [parseInt(v.slice(1,3), 16), parseInt(v.slice(3,5), 16), parseInt(v.slice(5,7), 16)] });
                     }}>
              <span style="font-size:11px;font-family:monospace">${hex.toUpperCase()}</span>
            ` : html`<span style="font-size:11px;color:var(--text-dim);font-style:italic">not supported</span>`}
          </div>
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Temperature</label>
            ${supportsTemp ? html`
              <input type="range" min=${minK} max=${maxK} step="50" .value=${String(curK)}
                     style="flex:1"
                     @input=${(e: Event) => call({ color_temp_kelvin: parseInt((e.target as HTMLInputElement).value) })}>
              <span style="font-size:11px;font-family:monospace">${curK} K</span>
            ` : html`<span style="font-size:11px;color:var(--text-dim);font-style:italic">not supported</span>`}
          </div>
        </div>
      </div>
    `;
  }
}

// ── Settings drawer ──────────────────────────────────────────────────────
@customElement('diorama-settings-drawer')
export class SettingsDrawer extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() open = false;
  @state() private _url = '';
  @state() private _token = '';

  protected override createRenderRoot() { return this; }

  show(): void {
    this._url = localStorage.getItem('diorama:url') || '';
    this._token = '';
    this.open = true;
  }

  override render() {
    if (!this.open) return nothing;
    return html`
      <div style="position:absolute;top:0;right:0;bottom:0;width:280px;background:var(--surface);
                  border-left:1px solid var(--border);padding:16px;overflow-y:auto;z-index:10;
                  box-shadow:-4px 0 16px rgba(0,0,0,0.4)">
        <h2 style="font-size:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
          Settings
          <button style="background:none;border:none;color:var(--text-dim);font-size:18px;cursor:pointer"
                  @click=${() => this.open = false}>✕</button>
        </h2>
        <div style="margin-bottom:18px">
          <h3 style="font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">
            Connection
          </h3>
          <label style="font-size:11px;color:var(--text-dim);display:block;margin-bottom:3px">
            Home Assistant URL
          </label>
          <input type="url" .value=${this._url}
                 @input=${(e: Event) => this._url = (e.target as HTMLInputElement).value}
                 style="width:100%;padding:6px 8px;border-radius:4px;border:1px solid var(--border);
                        background:#111;color:var(--text);font-size:12px;margin-bottom:10px">
          <label style="font-size:11px;color:var(--text-dim);display:block;margin-bottom:3px">
            Access Token
          </label>
          <input type="password" placeholder="(stored)" .value=${this._token}
                 @input=${(e: Event) => this._token = (e.target as HTMLInputElement).value}
                 style="width:100%;padding:6px 8px;border-radius:4px;border:1px solid var(--border);
                        background:#111;color:var(--text);font-size:12px;margin-bottom:10px">
          <button class="btn-primary" style="margin-bottom:8px" @click=${this._saveConn}>
            Save &amp; Reconnect
          </button>
          <button class="danger-btn" @click=${this._clearConn}>Clear &amp; Log Out</button>
        </div>
      </div>
    `;
  }

  private _saveConn = () => {
    if (this._url) localStorage.setItem('diorama:url', this._url);
    if (this._token) localStorage.setItem('diorama:token', this._token);
    this.open = false;
    location.reload();
  };
  private _clearConn = () => {
    localStorage.removeItem('diorama:url');
    localStorage.removeItem('diorama:token');
    location.reload();
  };
}
