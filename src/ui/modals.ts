import { LitElement, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from './define.js';
import { finishZoneEdit, cancelZoneEdit } from '../canvas-interact.js';
import { alarmStateColor, hvacModeColor, climateFeature, CLIMATE_FEATURE, climateTempUnit, fmtTempNum, clampSetpoint } from '../geometry.js';
import { CONDITION_GLYPH, CONDITION_LABEL, tempText, weatherEffectEnabled, worstAlertSeverity } from '../weather.js';
import { listPacks, getPack, packEffectiveState, resolveDef } from '../avatars.js';
import { OFFLINE_FLAG_KEY } from '../ha-local.js';
import type { AvatarDef, AvatarPackDef } from '../avatars.js';
import { AVATAR_PACK_MANIFEST } from '../avatar-packs/manifest.js';
import type { Planner } from '../planner.js';
import type { Floor, HassState, WeatherConfig, WeatherEffectKey, ScenePreset, FloorTexKind, MqttBridgeConfig, BgTextConfig, BgTextMode, HeatmapConfig } from '../types.js';

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

// ── Thermostat / HVAC control modal (Feature: climate) ────────────────────
// Bound + allowControl → full control surface: HVAC mode buttons (restricted to
// the entity's own hvac_modes), a single-setpoint OR low/high range stepper
// (stepped by target_temp_step, clamped to min/max), fan + preset dropdowns gated
// on supported_features. Bound view-only → readout only. Unbound → local demo
// (localState mode + localTemp setpoint). Setpoint taps are optimistic + debounced
// ~400 ms before the service call. View mode never opens it (guarded upstream).
@customElement('diorama-thermostat-modal')
export class ThermostatModal extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() open = false;
  @state() private _id = '';
  // Optimistic pending setpoints (null = show the live value).
  @state() private _pend: number | null = null;
  @state() private _pendLo: number | null = null;
  @state() private _pendHi: number | null = null;
  private _sendTimer: number | null = null;

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
    this._pend = this._pendLo = this._pendHi = null;
    if (this._sendTimer) { clearTimeout(this._sendTimer); this._sendTimer = null; }
    this.open = true;
  }

  private _thermo() {
    return (this.planner.floor().thermostats ?? []).find(t => t.id === this._id) ?? null;
  }

  // Debounced single-setpoint send (optimistic display holds until reopen).
  private _scheduleTemp(temp: number): void {
    this._pend = temp;
    if (this._sendTimer) clearTimeout(this._sendTimer);
    this._sendTimer = window.setTimeout(() => {
      this._sendTimer = null;
      this.planner.setThermostatTemp(this._id, temp);
    }, 400);
  }
  private _scheduleRange(lo: number, hi: number): void {
    this._pendLo = lo; this._pendHi = hi;
    if (this._sendTimer) clearTimeout(this._sendTimer);
    this._sendTimer = window.setTimeout(() => {
      this._sendTimer = null;
      this.planner.setThermostatTemp(this._id, 0, lo, hi);
    }, 400);
  }

  override render() {
    if (!this.open) return nothing;
    const p = this.planner;
    const t = this._thermo();
    if (!t) return nothing;
    const st = p.effectiveState(t);
    const mode = st?.state ?? null;
    const attrs = (st?.attributes ?? {}) as Record<string, unknown>;
    const bound = !!t.entity_id;
    const demo = !bound;
    const canControl = demo || (bound && t.allowControl !== false);
    const col = hvacModeColor(mode);
    const label = t.label?.trim() || 'Thermostat';
    const imperial = p.store.imperial;
    const unit = climateTempUnit(st, imperial);

    const action = (attrs.hvac_action as string | undefined) ?? null;
    const curTemp = fmtTempNum(attrs.current_temperature);
    const curHum = fmtTempNum(attrs.current_humidity);

    // Setpoint model (bound reads attrs; demo uses localTemp + defaults).
    const step = typeof attrs.target_temp_step === 'number' && attrs.target_temp_step > 0
      ? attrs.target_temp_step : (demo ? 1 : 0.5);
    const min = typeof attrs.min_temp === 'number' ? attrs.min_temp : (demo ? 7 : -50);
    const max = typeof attrs.max_temp === 'number' ? attrs.max_temp : (demo ? 35 : 150);
    const isRange = attrs.target_temp_low != null && attrs.target_temp_high != null;

    const clamp = (v: number) => clampSetpoint(v, min, max, step);
    const single = this._pend ?? (bound
      ? (typeof attrs.temperature === 'number' ? attrs.temperature : null)
      : (t.localTemp ?? 21));
    const lo = this._pendLo ?? (typeof attrs.target_temp_low === 'number' ? attrs.target_temp_low : null);
    const hi = this._pendHi ?? (typeof attrs.target_temp_high === 'number' ? attrs.target_temp_high : null);

    // Mode / fan / preset option lists.
    const hvacModes = Array.isArray(attrs.hvac_modes)
      ? (attrs.hvac_modes as string[])
      : (demo ? ['off', 'heat', 'cool', 'fan_only'] : []);
    const supported = typeof attrs.supported_features === 'number' ? attrs.supported_features : 0;
    const fanModes = climateFeature(supported, CLIMATE_FEATURE.FAN_MODE) && Array.isArray(attrs.fan_modes)
      ? (attrs.fan_modes as string[]) : null;
    const presetModes = climateFeature(supported, CLIMATE_FEATURE.PRESET_MODE) && Array.isArray(attrs.preset_modes)
      ? (attrs.preset_modes as string[]) : null;

    const stepBtn = (dir: number, cur: number | null, apply: (v: number) => void) => html`
      <button class="btn" style="width:44px;font-size:18px"
              @click=${() => apply(clamp((cur ?? 21) + dir * step))}>${dir < 0 ? '−' : '+'}</button>`;

    return html`
      <div class="modal-ov" @click=${(e: MouseEvent) => { if (e.target === e.currentTarget) this.open = false; }}>
        <div class="modal">
          <h3>${label}
            <button class="close" @click=${() => this.open = false}>✕</button>
          </h3>
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 0;border-bottom:1px solid var(--border)">
            <div style="font-size:34px;font-weight:700;color:${col};line-height:1">
              ${curTemp != null ? `${curTemp}${unit}` : (demo ? '—' : 'n/a')}
            </div>
            <div style="font-size:13px;color:${col};text-transform:capitalize">
              ${mode ? mode.replace(/_/g, ' ') : (bound ? 'unavailable' : 'demo')}${action ? ` · ${action}` : ''}
            </div>
            ${curHum != null ? html`<div style="font-size:11px;color:var(--text-dim)">humidity ${curHum}%</div>` : nothing}
            ${demo ? html`<div style="font-size:11px;color:var(--text-dim)">Local demo (not bound to Home Assistant)</div>` : nothing}
            ${bound && t.allowControl === false ? html`<div style="font-size:11px;color:var(--text-dim)">View only — enable "Allow control"</div>` : nothing}
          </div>

          ${canControl ? html`
            <!-- Setpoint stepper(s) -->
            <div style="padding:12px 0;border-bottom:1px solid var(--border)">
              ${isRange ? html`
                <div style="display:flex;gap:14px;justify-content:center">
                  <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                    <span style="font-size:11px;color:var(--text-dim)">Heat to</span>
                    <div style="display:flex;align-items:center;gap:6px">
                      ${stepBtn(-1, lo, v => this._scheduleRange(Math.min(v, hi ?? v), hi ?? v))}
                      <span style="font-size:20px;font-weight:600;min-width:48px;text-align:center">${lo != null ? `${fmtTempNum(lo)}°` : '—'}</span>
                      ${stepBtn(1, lo, v => this._scheduleRange(Math.min(v, hi ?? v), hi ?? v))}
                    </div>
                  </div>
                  <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                    <span style="font-size:11px;color:var(--text-dim)">Cool to</span>
                    <div style="display:flex;align-items:center;gap:6px">
                      ${stepBtn(-1, hi, v => this._scheduleRange(lo ?? v, Math.max(v, lo ?? v)))}
                      <span style="font-size:20px;font-weight:600;min-width:48px;text-align:center">${hi != null ? `${fmtTempNum(hi)}°` : '—'}</span>
                      ${stepBtn(1, hi, v => this._scheduleRange(lo ?? v, Math.max(v, lo ?? v)))}
                    </div>
                  </div>
                </div>
              ` : html`
                <div style="display:flex;align-items:center;justify-content:center;gap:10px">
                  <span style="font-size:11px;color:var(--text-dim)">Target</span>
                  ${stepBtn(-1, single, v => this._scheduleTemp(v))}
                  <span style="font-size:24px;font-weight:600;min-width:60px;text-align:center">${single != null ? `${fmtTempNum(single)}${unit}` : '—'}</span>
                  ${stepBtn(1, single, v => this._scheduleTemp(v))}
                </div>
              `}
            </div>

            <!-- HVAC mode buttons -->
            ${hvacModes.length ? html`
              <div style="display:flex;flex-wrap:wrap;gap:6px;padding:12px 0;border-bottom:1px solid var(--border)">
                ${hvacModes.map(m => html`
                  <button class="btn" style="flex:1 0 28%;font-size:12px;text-transform:capitalize;${m === mode ? `outline:2px solid ${hvacModeColor(m)};color:${hvacModeColor(m)}` : ''}"
                          @click=${() => p.setThermostatMode(this._id, m)}>${m.replace(/_/g, ' ')}</button>
                `)}
              </div>
            ` : nothing}

            <!-- Fan / preset dropdowns -->
            ${fanModes ? html`
              <div style="display:flex;gap:10px;align-items:center;padding:8px 0">
                <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Fan</label>
                <select style="flex:1" .value=${String(attrs.fan_mode ?? '')}
                        @change=${(e: Event) => p.setThermostatFanMode(this._id, (e.target as HTMLSelectElement).value)}>
                  ${fanModes.map(m => html`<option value=${m} ?selected=${m === attrs.fan_mode}>${m}</option>`)}
                </select>
              </div>
            ` : nothing}
            ${presetModes ? html`
              <div style="display:flex;gap:10px;align-items:center;padding:8px 0">
                <label style="font-size:12px;color:var(--text-dim);flex:0 0 80px">Preset</label>
                <select style="flex:1" .value=${String(attrs.preset_mode ?? '')}
                        @change=${(e: Event) => p.setThermostatPresetMode(this._id, (e.target as HTMLSelectElement).value)}>
                  ${presetModes.map(m => html`<option value=${m} ?selected=${m === attrs.preset_mode}>${m}</option>`)}
                </select>
              </div>
            ` : nothing}
          ` : nothing}
        </div>
      </div>
    `;
  }
}

// ── Settings drawer ──────────────────────────────────────────────────────
type SettingsTab = 'connection' | 'display' | 'weather' | 'avatars' | 'integrations' | 'data';

@customElement('diorama-settings-drawer')
export class SettingsDrawer extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() open = false;
  @state() private _tab: SettingsTab = 'connection';
  @state() private _url = '';
  @state() private _token = '';
  @state() private _packErr = '';
  // Which pack rows have their member list expanded (runtime-only).
  private _packExpanded = new Set<string>();

  protected override createRenderRoot() { return this; }

  override connectedCallback(): void {
    super.connectedCallback();
    // Re-render on config so the live weather preview + pack list stay fresh
    // while the drawer is open.
    this.planner.addEventListener('config', this._tick);
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.planner.removeEventListener('config', this._tick);
  }
  private _tick = () => { if (this.open) this.requestUpdate(); };

  show(tab?: SettingsTab): void {
    this._url = localStorage.getItem('diorama:url') || '';
    this._token = '';
    if (tab) this._tab = tab;
    this.open = true;
  }

  override render() {
    if (!this.open) return nothing;
    const edit = this.planner.uiMode === 'edit';
    // Kiosk/view: only the Connection tab is available.
    const tabs: Array<[SettingsTab, string]> = edit
      ? [['connection', 'Connection'], ['display', 'Display'], ['weather', 'Weather'],
         ['avatars', 'Avatars'], ['integrations', 'Integrations'], ['data', 'Data']]
      : [['connection', 'Connection']];
    const tab: SettingsTab = tabs.some(t => t[0] === this._tab) ? this._tab : 'connection';
    return html`
      <div style="position:absolute;top:0;right:0;bottom:0;width:min(560px,92vw);background:var(--surface);
                  border-left:1px solid var(--border);display:flex;flex-direction:column;z-index:10;
                  box-shadow:-4px 0 16px rgba(0,0,0,0.4)">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px 8px">
          <h2 style="font-size:14px;margin:0">Settings</h2>
          <button style="background:none;border:none;color:var(--text-dim);font-size:18px;cursor:pointer"
                  @click=${() => this.open = false}>✕</button>
        </div>
        <div style="display:flex;gap:2px;padding:0 12px;border-bottom:1px solid var(--border);flex-wrap:wrap">
          ${tabs.map(([id, label]) => html`
            <button @click=${() => this._tab = id}
                    style="background:none;border:none;border-bottom:2px solid ${tab === id ? 'var(--accent)' : 'transparent'};
                           color:${tab === id ? 'var(--text)' : 'var(--text-dim)'};
                           font-size:12px;padding:7px 10px;cursor:pointer">${label}</button>`)}
        </div>
        <div style="flex:1;overflow-y:auto;padding:16px">
          ${tab === 'connection' ? this._connectionTab() : nothing}
          ${tab === 'display' ? this._displayTab() : nothing}
          ${tab === 'weather' ? this._weatherTab() : nothing}
          ${tab === 'avatars' ? this._avatarsTab() : nothing}
          ${tab === 'integrations' ? this._integrationsTab() : nothing}
          ${tab === 'data' ? this._dataTab() : nothing}
        </div>
        <div style="border-top:1px solid var(--border);padding:10px 16px;font-size:11px;color:var(--text-dim)"
             title="Diorama build version (from package.json)">
          Diorama v${__DIORAMA_VERSION__}
        </div>
      </div>
    `;
  }

  // ── Connection tab ──────────────────────────────────────────────────────
  private _connectionTab() {
    // Offline (LocalApi): the URL/token controls would mislead — nothing to
    // connect to. Offer a single exit path back to the auth screen.
    if (this.planner.isOffline) {
      return html`
        <div style="font-size:12px;color:var(--text);line-height:1.6;margin-bottom:14px">
          <strong>Offline mode</strong> — running with no Home Assistant.
          Configurations are stored in this browser. Device bindings show no
          live state, but unbound fixtures, roamers, demo avatars, and weather
          (via Open-Meteo) all work.
        </div>
        <button class="btn-primary" @click=${this._exitOffline}>Exit offline mode</button>
      `;
    }
    return html`
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
    `;
  }

  // ── Integrations tab ────────────────────────────────────────────────────
  private _integrationsTab() {
    return html`
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
             title="When off, the Bermuda BLE tracking integration is neither scanned nor displayed. BLE proxy fixtures stay placeable.">
        <input type="checkbox" .checked=${this.planner.store.bermudaEnabled !== false}
               @change=${(e: Event) => this._setBermudaEnabled((e.target as HTMLInputElement).checked)}>
        <span style="flex:1">Bermuda BLE tracking</span>
      </label>
      ${this._alertsBlock()}
      ${this._mqttBlock()}
    `;
  }

  // ── Alert Center block (Alert Center, Track A) ──────────────────────────
  private _alertsBlock() {
    const p = this.planner;
    const a = p.store.alerts ?? {};
    const enabled = a.enabled !== false;
    const set = (mut: (c: import('../types.js').AlertsConfig) => void) => p.setAlertsConfig(mut);
    return html`
      <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px">
        <div style="font-size:12px;font-weight:600;margin-bottom:6px">Alert Center</div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
               title="The 🔔 topbar bell surfacing HA persistent notifications + Repairs issues.">
          <input type="checkbox" .checked=${enabled}
                 @change=${(e: Event) => set(c => { c.enabled = (e.target as HTMLInputElement).checked ? undefined : false; })}>
          <span style="flex:1">Enable Alert Center</span>
        </label>
        ${enabled ? html`
          <div style="margin:6px 0 0 8px;display:flex;flex-direction:column;gap:5px">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)">
              <input type="checkbox" .checked=${a.showPersistentNotifications !== false}
                     @change=${(e: Event) => set(c => { c.showPersistentNotifications = (e.target as HTMLInputElement).checked; })}>
              <span style="flex:1">Persistent notifications</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
                   title="Requires an admin HA user; silently empty otherwise.">
              <input type="checkbox" .checked=${a.showRepairs !== false}
                     @change=${(e: Event) => set(c => { c.showRepairs = (e.target as HTMLInputElement).checked; })}>
              <span style="flex:1">Repairs issues (admin)</span>
            </label>
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text)">Min Repairs severity</label>
              <select .value=${a.minRepairSeverity ?? 'warning'}
                      @change=${(e: Event) => set(c => { c.minRepairSeverity = (e.target as HTMLSelectElement).value as import('../types.js').AlertsConfig['minRepairSeverity']; })}>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
                   title="Off by default — Repairs / notification text can be instance-specific; opt in to show the bell on a shared kiosk/view screen.">
              <input type="checkbox" .checked=${a.showInKiosk === true}
                     @change=${(e: Event) => set(c => { c.showInKiosk = (e.target as HTMLInputElement).checked || undefined; })}>
              <span style="flex:1">Show bell in kiosk / view mode</span>
            </label>
            <div style="font-size:10px;color:var(--text-dim);line-height:1.3">
              Place an <strong>Alert Beacon</strong> (🔔 tool) to pin a specific
              alert.* / binary_sensor to a room in the scene.
            </div>
          </div>` : nothing}
      </div>
    `;
  }

  // ── MQTT bridge block (Phase 5) ─────────────────────────────────────────
  private _mqttBlock() {
    const p = this.planner;
    const cfg = p.store.mqttBridge ?? {};
    const mode = cfg.mode ?? 'off';
    const status = p.mqttStatus;
    const STATUS_COLOR: Record<string, string> = {
      idle: 'var(--text-dim)', connecting: '#fdd835', up: '#69f0ae',
      error: '#ff5252', unauthorized: '#fb8c00',
    };
    const STATUS_LABEL: Record<string, string> = {
      idle: 'Idle', connecting: 'Connecting…', up: 'Connected',
      error: 'Error', unauthorized: 'Unauthorized (admin required)',
    };
    const modeRow = (val: 'off' | 'ha-relay' | 'direct', label: string, hint: string) => html`
      <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;font-size:12px;color:var(--text);margin:4px 0">
        <input type="radio" name="mqttmode" .checked=${mode === val}
               @change=${() => this._setMqttMode(val)}>
        <span style="flex:1"><span>${label}</span>
          <span style="display:block;color:var(--text-dim);font-size:10px">${hint}</span></span>
      </label>`;
    const field = (label: string, value: string, ph: string, type: string,
                   on: (v: string) => void) => html`
      <label style="font-size:10px;color:var(--text-dim);display:block;margin:6px 0 2px">${label}</label>
      <input type=${type} placeholder=${ph} .value=${value}
             @change=${(e: Event) => on((e.target as HTMLInputElement).value)}
             style="width:100%;padding:5px 7px;border-radius:4px;border:1px solid var(--border);
                    background:#111;color:var(--text);font-size:12px;box-sizing:border-box">`;
    return html`
      <div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
          <strong style="font-size:12px;color:var(--text)">MQTT bridge</strong>
          <span style="font-size:10px;padding:2px 7px;border-radius:9px;
                       background:${STATUS_COLOR[status]}22;color:${STATUS_COLOR[status]}">
            ${STATUS_LABEL[status] ?? status}</span>
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:6px">
          Reads spatial MQTT topics (Frigate boxes, Valetudo maps) not exposed over
          Home Assistant's normal API.
        </div>
        ${modeRow('off', 'Off', 'No MQTT bridge.')}
        ${modeRow('ha-relay', 'Via Home Assistant (admin)',
          'Rides HA\'s own connection — no extra credentials. Requires an ADMIN Home Assistant user.')}
        ${modeRow('direct', 'Direct to broker',
          'Connect straight to the MQTT broker over WebSocket. Use when the panel user is not an HA admin.')}
        ${status === 'unauthorized' ? html`
          <div style="font-size:10px;color:#fb8c00;margin:4px 0;line-height:1.4">
            Home Assistant refused <code>mqtt/subscribe</code> — that command needs an
            admin user. Switch to <em>Direct to broker</em> instead.
          </div>` : nothing}
        ${mode === 'direct' ? html`
          <div style="margin-top:6px;padding:8px;border:1px solid var(--border);border-radius:5px">
            ${field('Broker host', cfg.brokerHost ?? '', 'homeassistant.local', 'text',
              v => this._setMqttField(m => { m.brokerHost = v.trim() || undefined; }))}
            <div style="display:flex;gap:8px;align-items:end">
              <div style="flex:1">
                ${field('WebSocket port', String(cfg.brokerPort ?? 9001), '9001', 'number',
                  v => this._setMqttField(m => { const n = parseInt(v, 10); m.brokerPort = isFinite(n) ? n : undefined; }))}
              </div>
              <label style="display:flex;gap:5px;align-items:center;font-size:11px;color:var(--text);padding-bottom:6px">
                <input type="checkbox" .checked=${cfg.useTls === true}
                       @change=${(e: Event) => this._setMqttField(m => { m.useTls = (e.target as HTMLInputElement).checked || undefined; })}>
                TLS (wss)
              </label>
            </div>
            ${field('Username', this._mqttCred('user'), '(optional)', 'text',
              v => this._setMqttCred('user', v))}
            ${field('Password', this._mqttCred('pass'), '(optional)', 'password',
              v => this._setMqttCred('pass', v))}
            <div style="font-size:10px;color:var(--text-dim);margin-top:4px">
              🔒 Username &amp; password are stored on this device only (never synced to
              Home Assistant).
            </div>
          </div>` : nothing}
        ${mode !== 'off' ? html`
          <div style="margin-top:6px">
            ${field('Frigate topic prefix', cfg.frigateTopic ?? 'frigate', 'frigate', 'text',
              v => this._setMqttField(m => { m.frigateTopic = v.trim() || undefined; }))}
            ${field('Valetudo namespace', cfg.valetudoNs ?? 'valetudo', 'valetudo', 'text',
              v => this._setMqttField(m => { m.valetudoNs = v.trim() || undefined; }))}
            <button class="btn-primary" style="margin-top:8px"
                    @click=${() => this.planner.restartMqtt()}>Test connection</button>
          </div>` : nothing}
      </div>`;
  }

  // ── Display tab (moved from sidebar "3D Scene" — global parts only) ──────
  private _displayTab() {
    const p = this.planner;
    const sc = p.store.scene3d ?? { preset: 'night' as const };
    const upd = (mut: () => void) => {
      if (!p.store.scene3d) p.store.scene3d = { preset: 'night' };
      mut(); p.save(); p.emitConfig();
    };
    const check = (label: string, checked: boolean, on: (v: boolean) => void, title = '') => html`
      <div class="row"><label title=${title}>${label}</label>
        <input type="checkbox" .checked=${checked}
               @change=${(e: Event) => upd(() => on((e.target as HTMLInputElement).checked))}>
      </div>`;
    return html`
      <div class="row"><label>Mode</label>
        <select .value=${sc.lightMode ?? 'manual'}
                @change=${(e: Event) => upd(() => {
                  p.store.scene3d!.lightMode =
                    (e.target as HTMLSelectElement).value as 'manual' | 'clock' | 'lux';
                })}>
          <option value="manual">Manual preset</option>
          <option value="clock">Follow time of day</option>
          <option value="lux">Luminance sensor</option>
        </select>
      </div>
      ${(sc.lightMode ?? 'manual') === 'manual' ? html`
        <div class="row"><label>Lighting</label>
          <select .value=${sc.preset ?? 'night'}
                  @change=${(e: Event) => upd(() => {
                    p.store.scene3d!.preset = (e.target as HTMLSelectElement).value as ScenePreset;
                  })}>
            <option value="night">Night (default)</option>
            <option value="day">Day</option>
            <option value="dusk">Dusk</option>
          </select>
        </div>
      ` : nothing}
      ${(sc.lightMode ?? 'manual') === 'clock' ? html`
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 4px">
          Uses HA's sun.sun elevation (falls back to local clock):
          day above 10°, dusk to −4°, night below.
        </div>
      ` : nothing}
      ${(sc.lightMode ?? 'manual') === 'lux' ? html`
        <div class="row"><label>Lux entity</label>
          <span style="font-size:10px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${sc.luxEntity || '— pick one —'}
          </span>
          <button class="btn" style="font-size:10px;padding:2px 6px" @click=${() => {
            this.dispatchEvent(new CustomEvent('open-entity-picker', {
              bubbles: true, composed: true,
              detail: { domain: 'sensor', onPick: (id: string) => upd(() => { p.store.scene3d!.luxEntity = id; }) },
            }));
          }}>🔗</button>
        </div>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 4px">
          ≥3000 lx day · 300–3000 lx dusk · &lt;300 lx night.
        </div>
      ` : nothing}
      <div class="row"><label>Floor color</label>
        <input type="color" .value=${sc.floorColor ?? '#101820'}
               style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
               @input=${(e: Event) => upd(() => { p.store.scene3d!.floorColor = (e.target as HTMLInputElement).value; })}>
      </div>
      <div class="row"><label>Floor texture</label>
        <select .value=${sc.floorTex ?? 'none'}
                @change=${(e: Event) => upd(() => {
                  p.store.scene3d!.floorTex = (e.target as HTMLSelectElement).value as FloorTexKind;
                })}>
          <option value="none">None</option>
          <option value="wood">Wood</option>
          <option value="tile">Tile</option>
          <option value="concrete">Concrete</option>
        </select>
      </div>
      <div class="row"><label>Wall color</label>
        <input type="color" .value=${sc.wallColor ?? '#bbbbbb'}
               style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
               @input=${(e: Event) => upd(() => { p.store.scene3d!.wallColor = (e.target as HTMLInputElement).value; })}>
      </div>
      ${check('Glass house', !!sc.glassHouse, v => { p.store.scene3d!.glassHouse = v; })}
      ${check('Wall cutaway', sc.wallCutaway !== false, v => { p.store.scene3d!.wallCutaway = v; })}
      ${check('Auto-follow camera', !!sc.autoFollow, v => { p.store.scene3d!.autoFollow = v; })}
      ${check('Cinematic orbit', !!sc.cinematicOrbit, v => { p.store.scene3d!.cinematicOrbit = v; },
        'Slowly orbit the camera around the avatars for visual interest')}
      ${check('Plumbobs', sc.plumbobs !== false, v => { p.store.scene3d!.plumbobs = v; })}
      ${check('Sky backdrop', sc.skyBackdrop ?? (p.store.weather != null),
        v => { p.store.scene3d!.skyBackdrop = v; },
        'Gradient sky dome + sun / moon / stars behind the scene (default on when weather is configured)')}
      ${this._bgTextBlock()}
      <div style="border-top:1px solid var(--border);margin:10px 0 0;padding-top:8px">
        <div class="row" title="Show all dimensions in feet / inches instead of millimetres">
          <label>Imperial units</label>
          <input type="checkbox" .checked=${!!p.store.imperial}
                 @change=${(e: Event) => { p.store.imperial = (e.target as HTMLInputElement).checked; p.save(); p.emitConfig(); this.requestUpdate(); }}>
        </div>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:4px 0 0">
          Per-floor flooring / wall overrides live in the sidebar Floors section.
        </div>
      </div>
      ${this._heatmapBlock()}
    `;
  }

  // ── Per-room temperature heat-map comfort band ──────────────────────────
  // Shades each room by the mean of its temperature EnvSensors (+ an in-room
  // thermostat's current_temperature). Stored in °C regardless of the display
  // unit; inputs convert for °F when imperial. Enable via Layers ▸ "Temperature
  // heat-map".
  private _heatmapBlock() {
    const p = this.planner;
    const hm = p.store.heatmap ?? {};
    const imp = !!p.store.imperial;
    const loC = hm.comfortLo ?? 20, hiC = hm.comfortHi ?? 24;
    const toDisp = (c: number) => imp ? Math.round((c * 9 / 5 + 32) * 10) / 10 : c;
    const fromDisp = (v: number) => imp ? (v - 32) * 5 / 9 : v;
    const set = (mut: (x: HeatmapConfig) => void) => {
      const x = (p.store.heatmap ??= {});
      mut(x); p.save(); p.emitConfig(); this.requestUpdate();
    };
    const unit = imp ? '°F' : '°C';
    const num = (val: number, on: (n: number) => void) => html`
      <input type="number" step="0.5" .value=${String(toDisp(val))}
             style="width:60px;text-align:right"
             @change=${(e: Event) => {
               const n = parseFloat((e.target as HTMLInputElement).value);
               if (isFinite(n)) on(fromDisp(n));
             }}>`;
    return html`
      <div style="border-top:1px solid var(--border);margin:10px 0 0;padding-top:8px">
        <div class="row"><label title="Rooms within this band read as comfortable; below → cool/cold blue, above → warm/hot red">
          Heat-map comfort band</label></div>
        <div class="row" style="gap:8px">
          <label style="flex:0 0 auto">Low (${unit})</label>
          ${num(loC, n => set(x => { x.comfortLo = n; }))}
          <label style="flex:0 0 auto">High (${unit})</label>
          ${num(hiC, n => set(x => { x.comfortHi = n; }))}
        </div>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:4px 0 0">
          Per-room temperature heat-map (from placed temperature sensors). Turn it
          on in the sidebar Layers ▸ "Temperature heat-map".
        </div>
      </div>`;
  }

  // ── Background text (playful skywriting / banner plane / grass writing) ──
  private _bgTextBlock() {
    const p = this.planner;
    const bt = p.store.bgText ?? {};
    const mode: BgTextMode = bt.mode ?? 'off';
    const upd = (mut: (x: BgTextConfig) => void) => {
      const x = (p.store.bgText ??= {});
      mut(x); p.save(); p.emitConfig(); this.requestUpdate();
    };
    const modes: Array<[BgTextMode, string]> = [
      ['off', 'Off'], ['sky', 'Skywriting (sky)'],
      ['banner', 'Banner plane'], ['grass', 'Grass writing'],
    ];
    return html`
      <div style="border-top:1px solid var(--border);margin:10px 0 0;padding-top:8px">
        <div class="row"><label title="A short playful message written into the 3D world">Background text</label>
          <select .value=${mode}
                  @change=${(e: Event) => upd(x => { x.mode = (e.target as HTMLSelectElement).value as BgTextMode; })}>
            ${modes.map(([v, l]) => html`<option value=${v} ?selected=${mode === v}>${l}</option>`)}
          </select>
        </div>
        ${mode !== 'off' ? html`
          <div class="row"><label>Message</label>
            <input type="text" placeholder="e.g. Welcome home!" maxlength="40"
                   .value=${bt.text ?? ''} ?disabled=${!!bt.entityId}
                   style="flex:1;min-width:0"
                   @change=${(e: Event) => upd(x => { x.text = (e.target as HTMLInputElement).value; })}>
          </div>
          <div class="row" style="margin-top:2px"><label>Entity</label>
            <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;
                         text-overflow:ellipsis;white-space:nowrap">${bt.entityId || '—'}</span>
            <button class="btn" style="font-size:10px;padding:2px 6px" @click=${() => {
              this.dispatchEvent(new CustomEvent('open-entity-picker', {
                bubbles: true, composed: true,
                detail: { onPick: (id: string) => upd(x => { x.entityId = id; }) },
              }));
            }}>🔗</button>
            ${bt.entityId ? html`<button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                   title="Clear the bound entity (use the static message)"
                   @click=${() => upd(x => { x.entityId = undefined; })}>✕</button>` : nothing}
          </div>
          <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 0">
            ${bt.entityId
              ? html`Bound: the entity's state replaces the static message
                     ${p.bgTextResolved() ? html`— currently "<span style="color:var(--text)">${p.bgTextResolved()}</span>"` : nothing}.`
              : 'Bind an entity (e.g. an input_text helper) to show its live value instead. Skywriting / banner hide during storms.'}
          </div>
        ` : nothing}
      </div>`;
  }

  // ── Weather tab (moved from sidebar "Weather") ──────────────────────────
  private _weatherEffectToggles(
    w: WeatherConfig | undefined,
    set: (mut: (x: WeatherConfig) => void) => void,
  ) {
    const master = w?.effects3d !== false;
    const defs: Array<[WeatherEffectKey, string]> = [
      ['precip', 'Precipitation'], ['fog', 'Fog'], ['lightning', 'Lightning'],
      ['wind', 'Wind dust & gusts'], ['clouds', 'Cloud shadows'],
      ['sunPosition', 'True sun position'], ['frost', 'Frost & icicles'],
      ['puddles', 'Rain puddles'], ['precipForecast', 'Forecast storm-brewing'],
    ];
    const dimmed = (k: WeatherEffectKey) => !master && k !== 'sunPosition';
    return html`
      <div style="margin:2px 0 2px 14px;display:flex;flex-direction:column;gap:1px">
        ${defs.map(([key, label]) => html`
          <label class="row" style="padding:1px 0;${dimmed(key) ? 'opacity:0.45' : ''}">
            <span style="flex:1;font-size:11px">${label}</span>
            <input type="checkbox" .checked=${weatherEffectEnabled(w, key)}
                   ?disabled=${dimmed(key)}
                   @change=${(e: Event) => set(x => {
                     (x.effects ??= {})[key] = (e.target as HTMLInputElement).checked;
                   })}>
          </label>`)}
      </div>`;
  }

  // DC-C: chip position + content + forecast display controls.
  private _weatherAppearance(
    w: WeatherConfig | undefined,
    set: (mut: (x: WeatherConfig) => void) => void,
  ) {
    type Anchor = 'tl' | 'tm' | 'tr' | 'bl' | 'bm' | 'br';
    const cur: Anchor = w?.chipAnchor ?? 'br';
    const hasCustom = !!w?.chipCustom;
    const cell = (code: Anchor, glyph: string) => html`
      <button title=${'Anchor ' + code}
              style="padding:4px 0;font-size:13px;border-radius:3px;cursor:pointer;
                     background:${cur === code && !hasCustom ? 'var(--accent)' : '#1c2733'};
                     border:1px solid #33465a;color:var(--text)"
              @click=${() => set(x => { x.chipAnchor = code; x.chipCustom = undefined; })}>${glyph}</button>`;
    const contentCheck = (label: string, key: 'apparent' | 'humidity' | 'wind' | 'uv') => html`
      <label class="row" style="padding:1px 0"><span style="flex:1;font-size:11px">${label}</span>
        <input type="checkbox" .checked=${w?.chipContent?.[key] === true}
               @change=${(e: Event) => set(x => {
                 (x.chipContent ??= {})[key] = (e.target as HTMLInputElement).checked;
               })}></label>`;
    const countInput = (label: string, key: 'hourly' | 'daily', max: number) => html`
      <label class="row" style="padding:1px 0"><span style="flex:1;font-size:11px">${label}</span>
        <input type="number" min="0" max=${max} style="width:56px"
               .value=${String(w?.chipContent?.[key] ?? 0)}
               @change=${(e: Event) => {
                 const raw = Math.floor(Number((e.target as HTMLInputElement).value));
                 const v = Math.max(0, Math.min(max, isFinite(raw) ? raw : 0));
                 set(x => { (x.chipContent ??= {})[key] = v; });
               }}></label>`;
    return html`
      <h4 style="font-size:11px;margin:12px 0 4px;color:var(--text-dim)">Chip appearance</h4>
      <div style="font-size:11px;margin-bottom:2px">Anchor</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin-bottom:6px">
        ${cell('tl', '↖')}${cell('tm', '↑')}${cell('tr', '↗')}
        ${cell('bl', '↙')}${cell('bm', '↓')}${cell('br', '↘')}
      </div>
      <div class="row" style="gap:6px;margin-bottom:2px">
        <span style="font-size:11px">Custom offset (px)</span>
        <span style="color:var(--text-dim);font-size:11px">x</span>
        <input type="number" style="width:56px" .value=${String(w?.chipCustom?.x ?? '')}
               @change=${(e: Event) => {
                 const v = Math.round(Number((e.target as HTMLInputElement).value));
                 set(x => { x.chipCustom = { x: isFinite(v) ? v : 0, y: x.chipCustom?.y ?? 0 }; });
               }}>
        <span style="color:var(--text-dim);font-size:11px">y</span>
        <input type="number" style="width:56px" .value=${String(w?.chipCustom?.y ?? '')}
               @change=${(e: Event) => {
                 const v = Math.round(Number((e.target as HTMLInputElement).value));
                 set(x => { x.chipCustom = { x: x.chipCustom?.x ?? 0, y: isFinite(v) ? v : 0 }; });
               }}>
        ${hasCustom ? html`<button class="btn" style="font-size:10px;padding:2px 6px"
               @click=${() => set(x => { x.chipCustom = undefined; })}>Clear</button>` : nothing}
      </div>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:0 0 6px">
        Custom offset overrides the anchor (px from the anchor's edges).
      </div>
      <div style="font-size:11px;margin-bottom:2px">Content</div>
      ${contentCheck('Feels-like', 'apparent')}
      ${contentCheck('Humidity', 'humidity')}
      ${contentCheck('Wind', 'wind')}
      ${contentCheck('UV index', 'uv')}
      ${countInput('Hourly forecast entries', 'hourly', 12)}
      ${countInput('Daily forecast entries', 'daily', 7)}
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 6px">
        Forecast strips need the entity or Open-Meteo source (the local-sensors
        source has no forecast). 0 = hidden.
      </div>
    `;
  }

  // DC-D: weather alerts config block (entity bind + beacon toggle + live
  // preview of what parseWeatherAlerts currently extracts).
  private _weatherAlertsBlock(
    w: WeatherConfig | undefined,
    set: (mut: (x: WeatherConfig) => void) => void,
  ) {
    const p = this.planner;
    const cur = w?.alerts?.entityId;
    const alerts = p.weatherAlerts ?? [];
    const worst = worstAlertSeverity(alerts);
    const preview = !cur
      ? 'No alert entity bound.'
      : (alerts.length
          ? `${alerts.length} alert${alerts.length > 1 ? 's' : ''} · worst: ${worst}`
          : 'none parsed');
    return html`
      <h3 style="font-size:12px;margin:10px 0 4px">Alerts</h3>
      <div class="row"><label>Alert entity</label>
        <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;
                     text-overflow:ellipsis;white-space:nowrap">${cur || '—'}</span>
        <button class="btn" style="font-size:10px;padding:2px 6px" @click=${() => {
          this.dispatchEvent(new CustomEvent('open-entity-picker', {
            bubbles: true, composed: true,
            detail: {
              domain: ['sensor', 'binary_sensor'],
              onPick: (id: string) => set(x => { (x.alerts ??= {}).entityId = id; }),
            },
          }));
        }}>🔗</button>
        ${cur ? html`<button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                             title="Clear the alert entity"
                             @click=${() => set(x => { (x.alerts ??= {}).entityId = undefined; })}>✕</button>` : nothing}
      </div>
      <label class="row"><span style="flex:1">3D beacon</span>
        <input type="checkbox" .checked=${w?.alerts?.beacon !== false}
               @change=${(e: Event) => set(x => { (x.alerts ??= {}).beacon = (e.target as HTMLInputElement).checked; })}>
      </label>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 4px">
        Severity-tinted badge on the weather chip (⚠, click for detail) + a slow
        3D sky pulse (amber advisory / orange watch / red warning). Auto-detects
        NWS Alerts, MeteoAlarm, DWD, and Environment Canada entities.
      </div>
      <div style="font-size:11px;padding:5px 8px;background:rgba(0,0,0,0.25);border-radius:4px">
        ${preview}
      </div>
    `;
  }

  private _weatherTab() {
    const p = this.planner;
    const w = p.store.weather;
    const src = w?.source ?? 'openmeteo';
    const now = p.weatherNow;
    const set = (mut: (x: WeatherConfig) => void) => p.setWeather(mut);

    const sourceRadio = (val: 'entity' | 'sensors' | 'openmeteo', label: string) => html`
      <label class="row" style="padding:0;cursor:pointer;gap:6px">
        <input type="radio" name="weather-src" .checked=${src === val}
               @change=${() => set(x => { x.source = val; })}>
        <span style="font-size:12px;flex:1">${label}</span>
      </label>`;

    const bindRow = (labelTxt: string, cur: string | undefined,
                     domain: string, onPick: (id: string) => void) => html`
      <div class="row" style="margin-top:2px"><label>${labelTxt}</label>
        <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;
                     text-overflow:ellipsis;white-space:nowrap">${cur || '—'}</span>
        <button class="btn" style="font-size:10px;padding:2px 6px" @click=${() => {
          this.dispatchEvent(new CustomEvent('open-entity-picker', {
            bubbles: true, composed: true, detail: { domain, onPick },
          }));
        }}>🔗</button>
      </div>`;

    let preview;
    if (!w) {
      preview = html`<span style="color:var(--text-dim)">Pick a source to enable the chip.</span>`;
    } else if (now) {
      const glyph = CONDITION_GLYPH[now.condition] ?? '❓';
      const temp = now.tempC == null ? '' : ' · ' + tempText(now.tempC, p.store.imperial);
      preview = html`<span style="${now.stale ? 'opacity:0.55' : ''}">
        ${glyph} ${CONDITION_LABEL[now.condition] ?? now.condition}${temp}
        ${now.label ? html`<span style="color:var(--text-dim)"> · ${now.label}</span>` : nothing}
        ${now.stale ? html`<span style="color:#ffab91"> · stale</span>` : nothing}
      </span>`;
    } else {
      preview = html`<span style="color:var(--text-dim)">${
        src === 'openmeteo'
          ? (w.zip || w.lat != null ? 'Fetching…' : 'Set a zip (or configure zone.home in HA).')
          : 'Bind the source entities above.'}</span>`;
    }

    return html`
      <div id="diorama-weather-section" style="display:flex;flex-direction:column;gap:2px;margin-bottom:6px">
        ${sourceRadio('entity', 'HA weather entity')}
        ${sourceRadio('sensors', 'Local station sensors')}
        ${sourceRadio('openmeteo', 'Open-Meteo (online)')}
      </div>

      ${src === 'entity' ? bindRow('Entity', w?.entityId, 'weather',
          (id: string) => set(x => { x.entityId = id; })) : nothing}

      ${src === 'sensors' ? html`
        ${bindRow('Precip (mm/h)', w?.sensors?.precip, 'sensor',
            (id: string) => set(x => { (x.sensors ??= {}).precip = id; }))}
        ${bindRow('Wind speed', w?.sensors?.windSpeed, 'sensor',
            (id: string) => set(x => { (x.sensors ??= {}).windSpeed = id; }))}
        ${bindRow('Temperature', w?.sensors?.temp, 'sensor',
            (id: string) => set(x => { (x.sensors ??= {}).temp = id; }))}
        ${bindRow('Lightning', w?.sensors?.lightning, 'binary_sensor',
            (id: string) => set(x => { (x.sensors ??= {}).lightning = id; }))}
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 0">
          Condition is derived: precip → rainy/pouring, cold precip → snowy,
          high wind → windy, lightning → storm; else clear by the sun.
        </div>
      ` : nothing}

      ${src === 'openmeteo' ? html`
        <div class="row"><label>Zip / place</label>
          <input type="text" placeholder="e.g. 90210" .value=${w?.zip ?? ''}
                 style="flex:1;min-width:0"
                 @change=${(e: Event) => set(x => { x.zip = (e.target as HTMLInputElement).value.trim(); })}>
          <button class="btn" style="font-size:10px;padding:2px 8px;margin-left:4px"
                  @click=${() => p.refreshWeatherLocation()}>Search</button>
        </div>
        <div style="font-size:11px;color:var(--text-dim);margin:2px 0 0">
          ${w?.placeLabel
            ? html`📍 ${w.placeLabel}`
            : (w?.lat != null ? html`📍 ${w.lat.toFixed(2)}, ${w.lon?.toFixed(2)}`
                              : 'No location — uses HA zone.home if no zip.')}
        </div>
      ` : nothing}

      <label class="row" style="margin-top:8px"><span style="flex:1">Show chip</span>
        <input type="checkbox" .checked=${w?.chip !== false}
               @change=${(e: Event) => set(x => { x.chip = (e.target as HTMLInputElement).checked; })}>
      </label>
      <label class="row"><span style="flex:1">3D effects</span>
        <input type="checkbox" .checked=${w?.effects3d !== false}
               @change=${(e: Event) => set(x => { x.effects3d = (e.target as HTMLInputElement).checked; })}>
      </label>
      ${this._weatherEffectToggles(w, set)}
      <label class="row"><span style="flex:1">Affect lighting</span>
        <input type="checkbox" .checked=${w?.affectLighting !== false}
               @change=${(e: Event) => set(x => { x.affectLighting = (e.target as HTMLInputElement).checked; })}>
      </label>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 6px">
        3D effects: rain / snow / hail / fog / wind dust / lightning around the
        house, matched to the live condition. "Affect lighting" dims the day
        preset under overcast weather. The "Weather FX" entry in 2D Layers
        also gates the effects.
      </div>

      <h4 style="font-size:11px;margin:8px 0 2px;color:var(--text-dim)">Sky (3D)</h4>
      <div class="row" style="margin-top:2px"><label>Moon entity</label>
        <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;
                     text-overflow:ellipsis;white-space:nowrap">${w?.moonEntity || '—'}</span>
        <button class="btn" style="font-size:10px;padding:2px 6px" @click=${() => {
          this.dispatchEvent(new CustomEvent('open-entity-picker', {
            bubbles: true, composed: true,
            detail: { domain: 'sensor', onPick: (id: string) => set(x => { x.moonEntity = id; }) },
          }));
        }}>🔗</button>
        ${w?.moonEntity ? html`<button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
               title="Clear the moon entity"
               @click=${() => set(x => { x.moonEntity = undefined; })}>✕</button>` : nothing}
      </div>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 6px">
        HA's core Moon integration (8-state phase). Shades the night-sky moon prop;
        unbound → a full moon. Position is illustrative (opposite the sun) — HA
        exposes no real moon position. The sky dome + sun/moon toggle lives in
        Display ▸ "Sky backdrop".
      </div>

      ${this._weatherAppearance(w, set)}

      ${this._weatherAlertsBlock(w, set)}

      <div style="font-size:11px;padding:6px 8px;background:rgba(0,0,0,0.25);border-radius:4px;line-height:1.4">
        ${preview}
      </div>
    `;
  }

  // ── Data tab (Configurations + export/import) ───────────────────────────
  private _dataTab() {
    const p = this.planner;
    const configs = p.listConfigs();
    const activeId = p.activeConfigId;
    const savedAt = p.lastSavedAt;
    const only = configs.length <= 1;
    return html`
      <h3 style="font-size:12px;margin:0 0 8px">Configurations</h3>
      <select style="width:100%;margin-bottom:8px" @change=${this._onSelectConfig}
              title="Switch the active configuration">
        ${configs.length
          ? configs.map(c => html`<option value=${c.id} ?selected=${c.id === activeId}>${c.name}</option>`)
          : html`<option>Default</option>`}
      </select>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">
        <button class="btn" style="flex:1;min-width:80px" @click=${this._saveConfig}>Save</button>
        <button class="btn" style="flex:1;min-width:80px" @click=${this._saveAsConfig}>Save as…</button>
        <button class="btn" style="flex:1;min-width:80px" @click=${this._renameConfig}>Rename</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">
        <button class="btn" style="flex:1;min-width:80px" @click=${this._exportConfig}>Export</button>
        <button class="btn" style="flex:1;min-width:80px" @click=${this._importConfig}>Import</button>
        <button class="btn" style="flex:1;min-width:80px" ?disabled=${only}
                title=${only ? 'The only configuration cannot be deleted' : 'Delete this configuration'}
                @click=${this._deleteConfig}>Delete</button>
      </div>
      ${savedAt ? html`<div style="font-size:10px;color:var(--text-dim)">Last saved ${this._agoText(savedAt)}</div>` : nothing}
      <label style="font-size:11px;color:var(--text-dim);display:block;margin:10px 0 3px">
        Notes — saved with this configuration, included in export
      </label>
      <textarea rows="5" placeholder="Describe this configuration…"
                .value=${p.store.notes ?? ''}
                @change=${(e: Event) => p.setNotes((e.target as HTMLTextAreaElement).value)}
                style="width:100%;box-sizing:border-box;padding:6px 8px;border-radius:4px;
                       border:1px solid var(--border);background:#111;color:var(--text);
                       font-size:12px;font-family:inherit;resize:vertical;margin-bottom:8px"></textarea>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin-top:8px">
        Each configuration is a full, independent floor plan (all floors,
        fixtures, avatars, and settings). Export downloads a self-contained
        <code>.diorama.json</code> (including any imported avatar packs); Import
        adds it as a new configuration. Imported OBJ models live in this
        browser's local storage and are re-imported per device.
      </div>
    `;
  }

  private _onSelectConfig = (e: Event) => {
    void this.planner.switchConfig((e.target as HTMLSelectElement).value);
  };
  private _saveConfig = () => { void this.planner.saveConfigNow(); };
  private _saveAsConfig = () => {
    const name = prompt('New configuration name:', '');
    if (name == null) return;
    void this.planner.saveConfigAs(name.trim() || 'Untitled');
  };
  private _renameConfig = () => {
    const p = this.planner;
    const cur = p.listConfigs().find(c => c.id === p.activeConfigId);
    const name = prompt('Rename configuration:', cur?.name ?? '');
    if (name == null || !name.trim()) return;
    void p.renameConfig(p.activeConfigId, name.trim());
  };
  private _deleteConfig = () => {
    const p = this.planner;
    if (p.listConfigs().length <= 1) return;
    const cur = p.listConfigs().find(c => c.id === p.activeConfigId);
    if (!confirm(`Delete configuration "${cur?.name ?? p.activeConfigId}"? This cannot be undone.`)) return;
    void p.deleteConfig(p.activeConfigId);
  };
  private _exportConfig = async () => {
    const env = await this.planner.exportConfig();
    const safe = (env.name || 'diorama').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'diorama';
    const blob = new Blob([JSON.stringify(env, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${safe}.diorama.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  private _importConfig = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = () => {
      const file = inp.files?.[0]; if (!file) return;
      const rd = new FileReader();
      rd.onload = async () => {
        const fallback = file.name.replace(/\.diorama\.json$|\.json$/i, '') || 'Imported';
        const res = await this.planner.importConfig(rd.result as string, fallback);
        if (!res.ok) alert('Import failed: ' + (res.error ?? 'unknown error'));
      };
      rd.readAsText(file);
    };
    inp.click();
  };
  private _agoText(ts: number): string {
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return s <= 2 ? 'just now' : `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(ts).toLocaleString();
  }

  // ── Avatars tab (NEW pack manager) ──────────────────────────────────────
  private _avatarsTab() {
    const p = this.planner;
    const cfg = p.store.avatarPacks;
    const registered = listPacks();
    const regIds = new Set(registered.map(e => e.def.id));

    interface Row {
      id: string; label: string; path: string[]; source: 'builtin' | 'user';
      def: AvatarPackDef | null; count: number; registered: boolean;
      franchise: boolean; locked: boolean;
    }
    const rows: Row[] = registered.map(e => ({
      id: e.def.id, label: e.def.label, path: e.def.path, source: e.source,
      def: e.def, count: e.def.avatars.length, registered: true,
      franchise: !!e.def.franchise, locked: !!e.def.locked,
    }));
    // Merge manifest rows for built-in packs not yet registered (unloaded), so
    // they're visible and loadable from the manager.
    for (const m of AVATAR_PACK_MANIFEST) {
      if (regIds.has(m.id)) continue;
      rows.push({ id: m.id, label: m.label, path: m.path, source: 'builtin',
        def: null, count: m.count, registered: false, franchise: !!m.franchise, locked: false });
    }
    rows.sort((a, b) => {
      if (a.id === 'core') return -1;
      if (b.id === 'core') return 1;
      return a.path.join('/').localeCompare(b.path.join('/')) || a.label.localeCompare(b.label);
    });

    // Tree headers from path segments (render only the segments that differ
    // from the previous row's path).
    let prevPath: string[] = [];

    return html`
      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
        <button class="btn" style="flex:1;min-width:120px" @click=${this._importPack}>Import pack (JSON)</button>
      </div>
      ${this._packErr ? html`
        <div style="font-size:11px;color:#ff8a80;background:rgba(80,0,0,0.25);border-radius:4px;
                    padding:6px 8px;margin-bottom:8px">${this._packErr}</div>` : nothing}

      <div style="display:flex;flex-direction:column;gap:2px">
        ${rows.map(row => {
          const headers: unknown[] = [];
          let i = 0;
          while (i < row.path.length && i < prevPath.length && row.path[i] === prevPath[i]) i++;
          for (let j = i; j < row.path.length; j++) {
            headers.push(html`
              <div style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.06em;
                          margin:6px 0 2px;padding-left:${j * 12}px">${row.path[j]}</div>`);
          }
          prevPath = row.path;
          return html`${headers}${this._packRow(row, cfg)}`;
        })}
      </div>

      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin-top:12px;
                  border-top:1px solid var(--border);padding-top:8px">
        Unknown or deactivated avatars render as the default (adult).
      </div>
    `;
  }

  private _packRow(
    row: { id: string; label: string; path: string[]; source: 'builtin' | 'user';
           def: AvatarPackDef | null; count: number; registered: boolean;
           franchise: boolean; locked: boolean },
    cfg: Record<string, { loaded?: boolean; active?: boolean; members?: string[] }> | undefined,
  ) {
    const p = this.planner;
    const st = row.registered && row.def
      ? packEffectiveState(row.def, cfg)
      : { loaded: false, active: false };
    const expanded = this._packExpanded.has(row.id);
    const indent = row.path.length * 12;
    const badge = row.source === 'user' ? 'imported' : 'built-in';
    const members = row.def?.avatars ?? [];
    const subset = cfg?.[row.id]?.members;

    return html`
      <div style="border:1px solid var(--border);border-radius:5px;padding:6px 8px;margin-left:${indent}px">
        <div style="display:flex;align-items:center;gap:6px">
          ${row.def && members.length ? html`
            <button style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:11px;
                           transform:rotate(${expanded ? 90 : 0}deg);transition:transform 0.1s"
                    @click=${() => { if (expanded) this._packExpanded.delete(row.id); else this._packExpanded.add(row.id); this.requestUpdate(); }}>▸</button>
          ` : html`<span style="width:12px;display:inline-block"></span>`}
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${row.locked ? '🔒 ' : ''}${row.label}
              <span style="color:var(--text-dim);font-size:10px"> · ${row.count}</span>
            </div>
            <div style="font-size:9px;color:var(--text-dim)">${badge}</div>
          </div>
          <label style="display:flex;align-items:center;gap:3px;font-size:10px;color:var(--text-dim)"
                 title=${row.locked ? 'Built-in default — always available' : 'Loaded'}>
            <input type="checkbox" .checked=${st.loaded} ?disabled=${row.locked}
                   @change=${(e: Event) => { void p.setPackLoaded(row.id, (e.target as HTMLInputElement).checked); }}>
            load
          </label>
          <label style="display:flex;align-items:center;gap:3px;font-size:10px;color:var(--text-dim)"
                 title=${row.locked ? 'Built-in default — always active' : 'Active'}>
            <input type="checkbox" .checked=${st.active} ?disabled=${row.locked || !st.loaded}
                   @change=${(e: Event) => p.setPackActive(row.id, (e.target as HTMLInputElement).checked)}>
            active
          </label>
          <button class="btn" style="font-size:10px;padding:2px 5px"
                  ?disabled=${!row.registered}
                  title="Export this pack as JSON" @click=${() => this._exportPack(row.id, row.label)}>⬇</button>
          ${row.source === 'user' ? html`
            <button class="btn danger" style="font-size:10px;padding:2px 5px"
                    title="Remove imported pack" @click=${() => this._removePack(row.id, row.label)}>🗑</button>
          ` : nothing}
        </div>
        ${expanded && members.length ? html`
          <div style="margin:6px 0 2px;padding-left:18px;display:flex;flex-direction:column;gap:2px">
            ${members.map(a => this._memberRow(row.id, a, members, subset))}
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _memberRow(
    packId: string, a: AvatarDef, all: AvatarDef[], subset: string[] | undefined,
  ) {
    const p = this.planner;
    const checked = !subset || subset.includes(a.id);
    const sw = this._swatch(a);
    return html`
      <label style="display:flex;align-items:center;gap:6px;font-size:11px;cursor:pointer">
        <input type="checkbox" .checked=${checked}
               @change=${(e: Event) => {
                 const on = (e.target as HTMLInputElement).checked;
                 const cur = new Set(subset ?? all.map(m => m.id));
                 if (on) cur.add(a.id); else cur.delete(a.id);
                 // All checked → undefined (no subset); else the explicit list.
                 const next = cur.size >= all.length ? undefined : all.filter(m => cur.has(m.id)).map(m => m.id);
                 p.setPackMembers(packId, next);
               }}>
        <span style="width:12px;height:12px;border-radius:3px;border:1px solid var(--border);
                     background:${sw.css}" title=${sw.tip}></span>
        <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.label}</span>
      </label>`;
  }

  // Resolve a member's preview swatch color. 'tint'/'skin'/'body' sentinels (and
  // absent) render as a neutral chip labelled 'tint'.
  private _swatch(a: AvatarDef): { css: string; tip: string } {
    const def = resolveDef(a.id);   // materialized (base spread applied)
    const c = def.rig === 'quadruped'
      ? def.quadruped?.coat
      : (def.humanoid?.body ?? def.humanoid?.skin);
    if (typeof c === 'number') {
      return { css: '#' + c.toString(16).padStart(6, '0'), tip: '' };
    }
    return { css: 'repeating-linear-gradient(45deg,#666,#666 3px,#888 3px,#888 6px)', tip: 'tint' };
  }

  private _importPack = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = () => {
      const file = inp.files?.[0]; if (!file) return;
      const rd = new FileReader();
      rd.onload = async () => {
        this._packErr = '';
        const res = await this.planner.importAvatarPack(rd.result as string);
        if (!res.ok) { this._packErr = 'Import failed: ' + (res.error ?? 'unknown error'); }
        this.requestUpdate();
      };
      rd.readAsText(file);
    };
    inp.click();
  };

  private _exportPack(id: string, label: string): void {
    const json = this.planner.exportPackJson(id);
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    void label;
  }

  private _removePack(id: string, label: string): void {
    if (!confirm(`Remove imported avatar pack "${label}"? This deletes it from this browser.`)) return;
    void this.planner.removeAvatarPack(id);
    this._packExpanded.delete(id);
    this._packErr = '';
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
  // Clear the offline flag → reload lands on the auth screen (HA connect form).
  private _exitOffline = () => {
    localStorage.removeItem(OFFLINE_FLAG_KEY);
    this.open = false;
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

  // ── MQTT bridge settings helpers (Phase 5) ──────────────────────────────
  private _setMqttMode(mode: 'off' | 'ha-relay' | 'direct'): void {
    this.planner.setMqttBridge(m => { m.mode = mode; });
    this.requestUpdate();
  }
  private _setMqttField(mut: (m: MqttBridgeConfig) => void): void {
    this.planner.setMqttBridge(mut);
    this.requestUpdate();
  }
  // Broker credentials are device-local secrets — localStorage ONLY, never the
  // synced Store. Guarded like the connection token helpers.
  private _mqttCred(which: 'user' | 'pass'): string {
    try { return localStorage.getItem('diorama:mqtt:' + which) || ''; }
    catch { return ''; }
  }
  private _setMqttCred(which: 'user' | 'pass', value: string): void {
    try {
      if (value) localStorage.setItem('diorama:mqtt:' + which, value);
      else localStorage.removeItem('diorama:mqtt:' + which);
    } catch { /* private mode */ }
    // Re-run the bridge so new creds take effect (direct mode).
    this.planner.restartMqtt();
    this.requestUpdate();
  }
}
