import { LitElement, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from './define.js';
import { finishZoneEdit, cancelZoneEdit } from '../canvas-interact.js';
import { alarmStateColor } from '../geometry.js';
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
// A device row for the picker's device mode (bind a fixture to an HA device or
// a discovered Bermuda tracked device rather than an entity).
export interface PickerDevice { id: string; name: string; subtitle?: string }

@customElement('diorama-entity-picker')
export class EntityPicker extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() open = false;
  @state() private _domain = '';
  // When set (multi-domain call site, e.g. doors accept binary_sensor OR cover),
  // only entities in one of these domains are listed. The domain <select> still
  // narrows further within the allowed set. null = single-domain (_domain) mode.
  @state() private _domains: string[] | null = null;
  @state() private _q = '';
  @state() private _deviceFilter = '';
  // Device mode: when non-null, the picker lists these devices and onPick
  // returns a device id. Set via showDevices(); cleared by show() (entity mode).
  @state() private _devices: PickerDevice[] | null = null;
  @state() private _title = 'Pick an entity';
  private _onPick: ((id: string) => void) | null = null;

  // Cache loaded once per session: entity_id → device_id, device_id → name.
  private _entityToDevice: Record<string, string | null> = {};
  private _deviceNames: Record<string, string> = {};
  private _registriesLoaded = false;

  protected override createRenderRoot() { return this; }

  // `domain` accepts a single domain string, an array of allowed domains
  // (multi-domain call sites), or null/'' for all domains.
  show(domain: string | string[] | null, onPick: (id: string) => void): void {
    if (Array.isArray(domain)) { this._domains = domain; this._domain = ''; }
    else { this._domains = null; this._domain = domain ?? ''; }
    this._onPick = onPick;
    this._q = '';
    this._deviceFilter = '';
    this._devices = null;
    this._title = 'Pick an entity';
    this.open = true;
    void this._loadRegistries();
  }

  // Device mode: pick from an explicit device list (returns the device id).
  showDevices(devices: PickerDevice[], onPick: (id: string) => void, title = 'Pick a device'): void {
    this._devices = devices;
    this._onPick = onPick;
    this._q = '';
    this._title = title;
    this.open = true;
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

    // Device mode: a flat filterable device list.
    if (this._devices) {
      const q = this._q.toLowerCase();
      const rows = this._devices.filter(d =>
        !q || (d.name + ' ' + (d.subtitle || '') + ' ' + d.id).toLowerCase().includes(q));
      return html`
        <div class="modal-ov" @click=${(e: MouseEvent) => { if (e.target === e.currentTarget) this.open = false; }}>
          <div class="modal">
            <h3>${this._title}<button class="close" @click=${() => this.open = false}>✕</button></h3>
            <input class="search" placeholder="Search devices…"
                   .value=${this._q}
                   @input=${(e: Event) => this._q = (e.target as HTMLInputElement).value}>
            <div class="entity-list">
              ${rows.length === 0
                ? html`<div class="entity-item" style="cursor:default;color:var(--text-dim)">
                    No devices match.</div>`
                : rows.slice(0, 300).map(d => html`
                    <div class="entity-item" @click=${() => { this._onPick?.(d.id); this.open = false; }}>
                      <div style="flex:1;overflow:hidden">
                        <div class="name">${d.name}</div>
                        ${d.subtitle ? html`
                          <div style="font-size:10px;color:var(--text-dim)">${d.subtitle}</div>
                        ` : nothing}
                      </div>
                    </div>`)}
            </div>
          </div>
        </div>
      `;
    }

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
      if (this._domains && !this._domains.includes(dom)) continue;
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

// ── Light (+ fan) config modal ───────────────────────────────────────────
// Handles a light.* entity (color / brightness / temp) and, for ceiling-fan
// fixtures, an optional bound fan.* entity (power + speed). fan_light fixtures
// with both bound show both sections; a pure fan fixture shows only the fan
// section (entityId null).
@customElement('diorama-light-config')
export class LightConfig extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() open = false;
  @state() private _entityId = '';
  @state() private _fanEntityId: string | null = null;
  // Suppress live re-render while the user drags a slider, so incoming HA
  // states can't yank the control's value mid-gesture.
  private _interacting = false;

  protected override createRenderRoot() { return this; }

  override connectedCallback(): void {
    super.connectedCallback();
    this.planner.addEventListener('config', this._tick);
    this.planner.addEventListener('live', this._tick);
    window.addEventListener('pointerup', this._pointerUp, true);
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.planner.removeEventListener('config', this._tick);
    this.planner.removeEventListener('live', this._tick);
    window.removeEventListener('pointerup', this._pointerUp, true);
  }
  private _tick = () => { if (this.open && !this._interacting) this.requestUpdate(); };
  private _pointerUp = () => { if (this._interacting) { this._interacting = false; this.requestUpdate(); } };

  show(entityId: string | null, fanEntityId: string | null = null): void {
    this._entityId = entityId ?? '';
    this._fanEntityId = fanEntityId;
    this.open = true;
  }

  override render() {
    if (!this.open) return nothing;
    const states = this.planner.hass?.states ?? {};
    const st = this._entityId ? states[this._entityId] : undefined;
    const fanSt = this._fanEntityId ? states[this._fanEntityId] : undefined;
    // Nothing resolvable → close silently.
    if (!st && !fanSt) return nothing;
    const attrs = (st?.attributes || {}) as Record<string, unknown>;
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
    const isOn = st?.state === 'on';
    const hex = '#' + curRgb.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
    const call = (data: Record<string, unknown>) =>
      this.planner.hass?.callService('light', 'turn_on', { entity_id: this._entityId, ...data });
    const grab = () => { this._interacting = true; };

    // Fan section (fan.* entity). percentage 0–100, step 5.
    const fanAttrs = (fanSt?.attributes || {}) as Record<string, unknown>;
    const fanOn = fanSt?.state === 'on';
    const fanPct = typeof fanAttrs.percentage === 'number'
      ? (fanAttrs.percentage as number) : (fanOn ? 100 : 0);
    const fanCall = (service: string, data: Record<string, unknown> = {}) =>
      this.planner.hass?.callService('fan', service, { entity_id: this._fanEntityId, ...data });

    const title = st ? ((attrs.friendly_name as string) || this._entityId)
                     : ((fanAttrs.friendly_name as string) || this._fanEntityId || 'Fan');

    return html`
      <div class="modal-ov" @click=${(e: MouseEvent) => { if (e.target === e.currentTarget) this.open = false; }}>
        <div class="modal">
          <h3>${title}
            <button class="close" @click=${() => this.open = false}>✕</button>
          </h3>
          ${st ? html`
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
                     style="flex:1" @pointerdown=${grab}
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
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;${fanSt ? 'border-bottom:1px solid var(--border)' : ''}">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Temperature</label>
            ${supportsTemp ? html`
              <input type="range" min=${minK} max=${maxK} step="50" .value=${String(curK)}
                     style="flex:1" @pointerdown=${grab}
                     @input=${(e: Event) => call({ color_temp_kelvin: parseInt((e.target as HTMLInputElement).value) })}>
              <span style="font-size:11px;font-family:monospace">${curK} K</span>
            ` : html`<span style="font-size:11px;color:var(--text-dim);font-style:italic">not supported</span>`}
          </div>
          ` : nothing}
          ${fanSt ? html`
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Fan</label>
            <label class="mini-toggle" style="width:36px;height:20px">
              <input type="checkbox" .checked=${fanOn}
                     @change=${(e: Event) => fanCall((e.target as HTMLInputElement).checked ? 'turn_on' : 'turn_off')}>
              <span></span>
            </label>
          </div>
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Speed</label>
            <input type="range" min="0" max="100" step="5" .value=${String(Math.round(fanPct))}
                   style="flex:1" @pointerdown=${grab}
                   @change=${(e: Event) => {
                     const v = parseInt((e.target as HTMLInputElement).value);
                     if (v <= 0) fanCall('turn_off');
                     else fanCall('set_percentage', { percentage: v });
                   }}>
            <span style="font-size:11px;font-family:monospace;min-width:40px;text-align:right">
              ${Math.round(fanPct)}%
            </span>
          </div>
          ` : nothing}
        </div>
      </div>
    `;
  }
}

// ── Media config modal ───────────────────────────────────────────────────
// Controls a bound media_player (or a plain switch) behind a TV / wall_tv
// furniture piece. Only renders controls whose backing attributes exist, so a
// dumb on/off TV switch just gets a power toggle. Live-updates like the light
// modal (config + live events, drag-guarded).
@customElement('diorama-media-config')
export class MediaConfig extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() open = false;
  @state() private _entityId = '';
  private _interacting = false;

  protected override createRenderRoot() { return this; }

  override connectedCallback(): void {
    super.connectedCallback();
    this.planner.addEventListener('config', this._tick);
    this.planner.addEventListener('live', this._tick);
    window.addEventListener('pointerup', this._pointerUp, true);
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.planner.removeEventListener('config', this._tick);
    this.planner.removeEventListener('live', this._tick);
    window.removeEventListener('pointerup', this._pointerUp, true);
  }
  private _tick = () => { if (this.open && !this._interacting) this.requestUpdate(); };
  private _pointerUp = () => { if (this._interacting) { this._interacting = false; this.requestUpdate(); } };

  show(entityId: string): void { this._entityId = entityId; this.open = true; }

  override render() {
    if (!this.open) return nothing;
    const st = this.planner.hass?.states?.[this._entityId];
    if (!st) return nothing;
    const attrs = (st.attributes || {}) as Record<string, unknown>;
    const dot = this._entityId.indexOf('.');
    const domain = dot > 0 ? this._entityId.slice(0, dot) : 'media_player';
    const isMedia = domain === 'media_player';
    const state = st.state;
    // "on" for the power toggle: anything that isn't clearly off/unavailable.
    const powerOn = state !== 'off' && state !== 'unavailable' && state !== 'standby';
    const sf = typeof attrs.supported_features === 'number' ? (attrs.supported_features as number) : 0;
    const canPlayPause = isMedia && ((sf & 1) !== 0 || (sf & 16384) !== 0 ||
      state === 'playing' || state === 'paused');
    const hasVolume = isMedia && typeof attrs.volume_level === 'number';
    const sources = Array.isArray(attrs.source_list) ? (attrs.source_list as string[]) : [];
    const hasSources = isMedia && sources.length > 0;
    const vol = typeof attrs.volume_level === 'number' ? (attrs.volume_level as number) : 0;
    const grab = () => { this._interacting = true; };
    const call = (service: string, data: Record<string, unknown> = {}) =>
      this.planner.hass?.callService(domain, service, { entity_id: this._entityId, ...data });
    const stateLabel = state.charAt(0).toUpperCase() + state.slice(1);

    return html`
      <div class="modal-ov" @click=${(e: MouseEvent) => { if (e.target === e.currentTarget) this.open = false; }}>
        <div class="modal">
          <h3>${(attrs.friendly_name as string) || this._entityId}
            <button class="close" @click=${() => this.open = false}>✕</button>
          </h3>
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Power</label>
            <label class="mini-toggle" style="width:36px;height:20px">
              <input type="checkbox" .checked=${powerOn}
                     @change=${(e: Event) => call((e.target as HTMLInputElement).checked ? 'turn_on' : 'turn_off')}>
              <span></span>
            </label>
            <span style="font-size:11px;color:var(--text-dim);font-family:monospace">${stateLabel}</span>
          </div>
          ${canPlayPause ? html`
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Playback</label>
            <button class="btn" @click=${() => call('media_play_pause')}>
              ${state === 'playing' ? '⏸ Pause' : '▶ Play'}
            </button>
          </div>
          ` : nothing}
          ${hasVolume ? html`
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Volume</label>
            <input type="range" min="0" max="1" step="0.01" .value=${String(vol)}
                   style="flex:1" @pointerdown=${grab}
                   @change=${(e: Event) => call('volume_set',
                     { volume_level: parseFloat((e.target as HTMLInputElement).value) })}>
            <span style="font-size:11px;font-family:monospace;min-width:40px;text-align:right">
              ${Math.round(vol * 100)}%
            </span>
          </div>
          ` : nothing}
          ${hasSources ? html`
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Source</label>
            <select .value=${(attrs.source as string) || ''}
                    @change=${(e: Event) => call('select_source', { source: (e.target as HTMLSelectElement).value })}
                    style="flex:1;background:#111;color:var(--text);border:1px solid var(--border);
                           border-radius:5px;padding:6px 8px;font-size:12px">
              ${sources.map(s => html`<option value=${s} ?selected=${attrs.source === s}>${s}</option>`)}
            </select>
          </div>
          ` : nothing}
          ${isMedia && state === 'playing' && attrs.media_title ? html`
          <div style="display:flex;gap:10px;align-items:center;padding:8px 0">
            <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Now playing</label>
            <span style="font-size:12px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${attrs.media_title as string}
            </span>
          </div>
          ` : nothing}
        </div>
      </div>
    `;
  }
}

// ── Alarm control modal (Feature 3) ──────────────────────────────────────
// Shows a keypad's arm state and — when allowControl + bound — Disarm / Arm
// Home / Arm Away buttons that call alarm_control_panel services (with an
// optional code). Bound but view-only → read-only status. Unbound → the three
// buttons set the panel's localState locally (demo mode). Live-updates like the
// light modal. View mode never opens it (guarded upstream).
@customElement('diorama-alarm-modal')
export class AlarmModal extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() open = false;
  @state() private _id = '';
  @state() private _code = '';

  protected override createRenderRoot() { return this; }

  override connectedCallback(): void {
    super.connectedCallback();
    this.planner.addEventListener('config', this._tick);
    this.planner.addEventListener('live', this._tick);
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.planner.removeEventListener('config', this._tick);
    this.planner.removeEventListener('live', this._tick);
  }
  private _tick = () => { if (this.open) this.requestUpdate(); };

  show(id: string): void {
    this._id = id;
    this._code = '';
    this.open = true;
  }

  private _panel() {
    return (this.planner.floor().alarmPanels ?? []).find(a => a.id === this._id) ?? null;
  }

  override render() {
    if (!this.open) return nothing;
    const p = this.planner;
    const a = this._panel();
    if (!a) return nothing;
    const st = p.effectiveState(a);
    const state = st?.state ?? null;
    const col = alarmStateColor(state);
    const bound = !!a.entity_id;
    const canControl = bound && a.allowControl === true;
    const demo = !bound;   // unbound → local demo control
    const label = a.label?.trim() || 'Alarm';
    const stateText = state ? state.replace('armed_', 'armed ').replace(/_/g, ' ') : (bound ? 'unavailable' : 'not set');

    // Service call (bound + allowControl) or local demo flip (unbound).
    const arm = (service: string, localState: string) => {
      if (demo) { p.setAlarmLocalState(a.id, localState); return; }
      if (!canControl || !a.entity_id) return;
      const data: Record<string, unknown> = { entity_id: a.entity_id };
      if (this._code.trim()) data.code = this._code.trim();
      try { p.hass?.callService('alarm_control_panel', service, data); } catch { /* fire-and-forget */ }
    };
    const showButtons = canControl || demo;

    return html`
      <div class="modal-ov" @click=${(e: MouseEvent) => { if (e.target === e.currentTarget) this.open = false; }}>
        <div class="modal">
          <h3>${label}
            <button class="close" @click=${() => this.open = false}>✕</button>
          </h3>
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 0;border-bottom:1px solid var(--border)">
            <div style="width:14px;height:14px;border-radius:50%;background:${col};box-shadow:0 0 10px ${col}"></div>
            <div style="font-size:20px;font-weight:600;color:${col};text-transform:capitalize">${stateText}</div>
            ${demo ? html`<div style="font-size:11px;color:var(--text-dim)">Local demo (not bound to Home Assistant)</div>` : nothing}
            ${bound && !a.allowControl ? html`<div style="font-size:11px;color:var(--text-dim)">View only — enable "Allow arm/disarm" to control</div>` : nothing}
          </div>
          ${showButtons ? html`
            ${canControl ? html`
              <div style="display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
                <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Code</label>
                <input type="password" inputmode="numeric" .value=${this._code}
                       placeholder="optional"
                       style="flex:1"
                       @input=${(e: Event) => { this._code = (e.target as HTMLInputElement).value; }}>
              </div>
            ` : nothing}
            <div style="display:flex;gap:8px;padding:12px 0">
              <button class="btn" style="flex:1" @click=${() => arm('alarm_disarm', 'disarmed')}>Disarm</button>
              <button class="btn" style="flex:1" @click=${() => arm('alarm_arm_home', 'armed_home')}>Arm Home</button>
              <button class="btn" style="flex:1" @click=${() => arm('alarm_arm_away', 'armed_away')}>Arm Away</button>
            </div>
          ` : nothing}
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
        ${this.planner.uiMode === 'edit' ? html`
          <div style="margin-bottom:18px">
            <h3 style="font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">
              Integrations
            </h3>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
                   title="When off, the Bermuda BLE tracking integration is neither scanned nor displayed. BLE proxy fixtures stay placeable.">
              <input type="checkbox" .checked=${this.planner.store.bermudaEnabled !== false}
                     @change=${(e: Event) => this._setBermudaEnabled((e.target as HTMLInputElement).checked)}>
              <span style="flex:1">Bermuda BLE tracking</span>
            </label>
          </div>
        ` : nothing}
        <div style="border-top:1px solid var(--border);padding-top:10px;font-size:11px;
                    color:var(--text-dim)"
             title="Diorama build version (from package.json)">
          Diorama v${__DIORAMA_VERSION__}
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

  private _setBermudaEnabled(on: boolean): void {
    // Absent/true = enabled; store false explicitly to disable. save() no-ops
    // outside edit mode, so this row only renders in edit anyway.
    this.planner.store.bermudaEnabled = on ? undefined : false;
    this.planner.save();
    this.planner.emitConfig();
    this.requestUpdate();
  }
}
