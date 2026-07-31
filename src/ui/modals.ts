import { LitElement, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from './define.js';
import { finishZoneEdit, cancelZoneEdit } from '../canvas-interact.js';
import { alarmStateColor, hvacModeColor, climateFeature, CLIMATE_FEATURE, climateTempUnit, fmtTempNum, clampSetpoint, resolvePivotMode, floorsDisplayOrder } from '../geometry.js';
import { CONDITION_GLYPH, CONDITION_LABEL, tempText, weatherEffectEnabled, worstAlertSeverity } from '../weather.js';
import { listPacks, getPack, packEffectiveState, resolveDef } from '../avatars.js';
import { OFFLINE_FLAG_KEY } from '../ha-local.js';
import type { AvatarDef, AvatarPackDef } from '../avatars.js';
import { AVATAR_PACK_MANIFEST } from '../avatar-packs/manifest.js';
import type { Planner } from '../planner.js';
import type { Floor, HassState, WeatherConfig, WeatherEffectKey, ScenePreset, FloorTexKind, MqttBridgeConfig, BgTextEntry, BgTextEntryMode, HeatmapConfig, CompassConfig } from '../types.js';
import { resolveNorth } from '../compass.js';
import {
  FLIGHT_LABEL_FIELDS, FLIGHT_LABEL_FIELDS_DEFAULT, sanitizeLabelFields,
  FLIGHTS_DEFAULT_RADIUS_NM, FLIGHT_SHELL_DEFAULT_RADIUS_M,
  flightBearingDistance, isEmergency,
  FLIGHT_GLOW_PATTERNS, MAX_FLIGHT_GLOW_RULES,
} from '../flights.js';
import type {
  FlightPoint, FlightGlowRule, FlightGlowPattern, FlightGlowCriteria,
} from '../flights.js';
import { aircraftArchetype } from '../aircraft-types.js';
import { compass8 } from '../geo.js';

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

// Optional HA-area scoping for the entity picker. Call sites that know which
// room (and therefore which bound HA area) an entity is being picked FOR pass
// this so the list opens pre-narrowed to that area's entities. Per-open only —
// never persisted — and always removable via the header chip's ✕.
export interface PickerAreaFilter { areaId: string; areaName: string }

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
  // HA-area scope for this open (null = none). `_areaOn` is the live toggle the
  // header chip's ✕ clears — the filter itself stays so the label reads right
  // until the picker closes.
  @state() private _areaFilter: PickerAreaFilter | null = null;
  @state() private _areaOn = false;
  private _onPick: ((id: string) => void) | null = null;

  // Cache loaded once per session: entity_id → device_id, device_id → name.
  private _entityToDevice: Record<string, string | null> = {};
  private _deviceNames: Record<string, string> = {};
  private _registriesLoaded = false;

  protected override createRenderRoot() { return this; }

  // `domain` accepts a single domain string, an array of allowed domains
  // (multi-domain call sites), or null/'' for all domains.
  show(
    domain: string | string[] | null, onPick: (id: string) => void,
    areaFilter?: PickerAreaFilter | null,
  ): void {
    if (Array.isArray(domain)) { this._domains = domain; this._domain = ''; }
    else { this._domains = null; this._domain = domain ?? ''; }
    this._onPick = onPick;
    this._q = '';
    this._deviceFilter = '';
    this._devices = null;
    this._title = 'Pick an entity';
    this._areaFilter = areaFilter ?? null;
    this._areaOn = !!areaFilter;
    this.open = true;
    void this._loadRegistries();
    // The area→entity maps live on the Planner (shared with the room labels);
    // wait for them so the pre-narrowed list isn't briefly empty.
    if (this._areaOn) void this.planner?.ensureHaAreaRegistry().then(() => this.requestUpdate());
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
      // HA-area scope (removable via the header chip).
      if (this._areaOn && this._areaFilter
          && this.planner?.entityAreaId(id) !== this._areaFilter.areaId) continue;
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
          ${this._areaFilter ? html`
            <div style="margin-bottom:6px;font-size:11px">
              ${this._areaOn ? html`
                <span style="display:inline-flex;align-items:center;gap:5px;padding:2px 6px;
                             border:1px solid var(--accent);border-radius:10px;color:var(--accent)"
                      title="Only entities in this Home Assistant area are listed. Remove to see all.">
                  Area: ${this._areaFilter.areaName}
                  <button class="icon-btn" style="font-size:10px;padding:0 2px;line-height:1"
                          title="Remove the area filter"
                          @click=${() => { this._areaOn = false; }}>✕</button>
                </span>
              ` : html`
                <button class="btn" style="font-size:10px;padding:2px 6px"
                        title="Re-apply the area filter"
                        @click=${() => { this._areaOn = true; }}>
                  + Filter to area: ${this._areaFilter.areaName}
                </button>`}
            </div>` : nothing}
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

// ── Live aircraft detail card (roadmap P4 wave 3) ────────────────────────
// Everything the ADS-B feed knows about ONE aircraft, at a readable size — the
// 3D shell's plate and the 2D dart label only ever carry two lines, and the
// display shell itself is deliberately not to scale, so this card is where the
// HONEST numbers live (real altitude, real distance, real fix age).
//
// Read-only by nature: an aircraft is not a device and there is nothing to
// actuate, so there are no controls and no service calls. Opened by a 3D
// raycast or a 2D dart tap in edit AND kiosk (view never dispatches).
//
// Freshness: aircraft are LIVE-path (a poll bumps flightsRev without an
// emitConfig), so the card subscribes to BOTH planner channels while open —
// the live one is what actually repaints it each poll. An aircraft that leaves
// the feed is NOT an error: the last frame is kept and captioned "signal lost"
// (a plane flying out of range mid-read is the normal case).
const FLIGHT_ARCHETYPE_LABEL: Record<string, string> = {
  'ga-high': 'light single (high wing)',
  'ga-low': 'light single (low wing)',
  'twin-prop': 'light twin (piston)',
  turboprop: 'regional turboprop',
  narrowbody: 'narrowbody airliner',
  widebody: 'widebody airliner',
  bizjet: 'business / regional jet',
  heli: 'helicopter',
};

@customElement('diorama-flight-modal')
export class FlightModal extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() open = false;
  @state() private _hex = '';
  // Last non-null fix, so an aircraft dropping out of the feed keeps its data.
  private _last: FlightPoint | null = null;

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

  show(hex: string): void {
    this._hex = String(hex ?? '').toLowerCase();
    this._last = this.planner.flightByHex(this._hex);
    this.open = true;
  }

  private _row(label: string, value: unknown, dim = false) {
    if (value === null || value === undefined || value === '') return nothing;
    return html`
      <div style="display:flex;gap:12px;align-items:baseline;padding:5px 0;border-bottom:1px solid var(--border)">
        <span style="flex:0 0 108px;font-size:11px;color:var(--text-dim);text-transform:uppercase;
                     letter-spacing:0.04em">${label}</span>
        <span style="flex:1;font-size:14px;color:${dim ? 'var(--text-dim)' : 'var(--text)'};
                     word-break:break-word">${value}</span>
      </div>`;
  }

  private _chip(text: string, color: string) {
    return html`<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;
                             font-weight:700;letter-spacing:0.06em;color:${color};
                             border:1px solid ${color};background:${color}1f">${text}</span>`;
  }

  override render() {
    if (!this.open) return nothing;
    const p = this.planner;
    const live = p.flightByHex(this._hex);
    if (live) this._last = live;
    const fp = this._last;
    if (!fp) return nothing;
    const lost = !live;

    // PIA is the one FAA privacy program whose entire point is that the hex maps
    // to nothing — honor it here exactly as the 3D lettering does (the courtesy
    // is gated by the same `privacyDim` opt-out).
    const privacyDim = p.store.flights?.privacyDim !== false;
    const anon = privacyDim && fp.pia === true;
    const arch = aircraftArchetype(fp.typeCode, fp.category);
    const ident = anon ? fp.hex.toUpperCase()
      : ((fp.callsign ?? '').trim() || (fp.reg ?? '').trim() || fp.hex.toUpperCase());

    const vr = fp.vertRateFpm ?? 0;
    const trend = vr >= 300 ? '↑' : vr <= -300 ? '↓' : '→';
    const trendColor = vr >= 300 ? '#69f0ae' : vr <= -300 ? '#ffab40' : 'var(--text-dim)';

    // Distance + TRUE compass bearing from home. Both come off the raw lat/lon
    // (never the compressed shell radius), so this is the honest geometry.
    const origin = p.flightsOrigin();
    let bearingLine: string | null = null;
    if (origin) {
      const { bearingRad, distNm } = flightBearingDistance(origin.lat, origin.lon, fp.lat, fp.lon);
      const deg = bearingRad * 180 / Math.PI;
      bearingLine = `${distNm.toFixed(1)} nm ${compass8(deg)} (${Math.round(deg)}°)`;
    } else if (fp.distNm != null) {
      bearingLine = `${fp.distNm.toFixed(1)} nm`;
    }

    const flags = [
      isEmergency(fp) ? this._chip(`EMERGENCY · ${String(fp.emergency).toUpperCase()}`, '#ff5252') : null,
      fp.military ? this._chip('MILITARY', '#8bc34a') : null,
      fp.interesting ? this._chip('INTERESTING', '#ffd400') : null,
      fp.ladd ? this._chip('LADD', '#eceff1') : null,
      fp.pia ? this._chip('PIA', '#eceff1') : null,
    ].filter(Boolean);

    return html`
      <div class="modal-ov" @click=${(e: MouseEvent) => { if (e.target === e.currentTarget) this.open = false; }}>
        <div class="modal" style="max-width:460px">
          <h3>Aircraft
            <button class="close" @click=${() => this.open = false}>✕</button>
          </h3>
          <div style="padding:10px 0 12px;border-bottom:1px solid var(--border)">
            <div style="font-size:30px;font-weight:700;letter-spacing:0.04em;line-height:1.1;
                        color:${lost ? 'var(--text-dim)' : 'var(--text)'}">${ident}</div>
            <div style="font-size:11px;color:var(--text-dim);margin-top:3px;font-family:monospace">
              ${fp.hex.toUpperCase()}</div>
            ${flags.length ? html`
              <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px">${flags}</div>` : nothing}
            ${anon ? html`
              <div style="font-size:11px;color:var(--text-dim);margin-top:8px;line-height:1.4">
                Identity anonymized (PIA) — this aircraft is flying under a temporary
                Privacy ICAO Address, so its registration and operator are withheld.
              </div>` : nothing}
            ${lost ? html`
              <div style="font-size:11px;color:#ffab40;margin-top:8px">
                Signal lost — showing the last received data.</div>` : nothing}
          </div>
          <div style="padding:4px 0">
            ${anon ? nothing : this._row('Registration', fp.reg)}
            ${anon ? nothing : this._row('Operator', fp.operator)}
            ${this._row('Type', fp.typeCode
              ? html`${fp.typeCode}${fp.typeDesc ? html` <span style="color:var(--text-dim)">— ${fp.typeDesc}</span>` : nothing}`
              : null)}
            ${this._row('Model', `${FLIGHT_ARCHETYPE_LABEL[arch] ?? arch}${fp.category ? ` · category ${fp.category}` : ''}`)}
            ${this._row('Altitude', html`
              ${Math.round(fp.altFt).toLocaleString('en-US')} ft
              <span style="color:${trendColor}">${trend}</span>`)}
            ${this._row('Ground speed', fp.gsKt == null ? null : `${Math.round(fp.gsKt)} kt`)}
            ${this._row('Vertical rate', fp.vertRateFpm == null ? null
              : `${vr > 0 ? '+' : ''}${Math.round(vr).toLocaleString('en-US')} fpm`)}
            ${this._row('Track', fp.trackDeg == null ? null
              : `${Math.round(fp.trackDeg)}° ${compass8(fp.trackDeg)}`)}
            ${this._row('Squawk', fp.squawk)}
            ${this._row('From home', bearingLine)}
            ${this._row('Fix age', fp.seenPosS == null ? null
              : `${fp.seenPosS < 1 ? '<1' : Math.round(fp.seenPosS)} s ago`, true)}
          </div>
          <div style="font-size:10px;color:var(--text-dim);line-height:1.4;padding-top:8px;
                      border-top:1px solid var(--border)">
            Altitude, speed and distance are the real reported values. The 3D sky
            positions aircraft on a compressed shell — true in bearing, not to scale.
          </div>
        </div>
      </div>
    `;
  }
}

// A glow rule's criteria as one short human line, for the collapsed summary row
// of an unnamed rule. PRESENTATION TEXT ONLY — deliberately NOT in flights.ts,
// which owns matching logic and stays free of UI copy (research §8).
export function summarizeGlowCriteria(c: FlightGlowCriteria | undefined): string {
  if (!c) return 'any aircraft';
  const parts: string[] = [];
  const wild: [keyof FlightGlowCriteria, string][] = [
    ['operator', 'operator'], ['typeCode', 'type'], ['typeDesc', 'desc'],
    ['reg', 'reg'], ['callsign', 'callsign'], ['category', 'cat'],
  ];
  for (const [k, label] of wild) {
    const v = c[k];
    if (typeof v === 'string' && v) parts.push(`${label}=${v}`);
  }
  const range = (lo: number | undefined, hi: number | undefined, label: string, unit: string) => {
    if (lo != null && hi != null) parts.push(`${label} ${lo}–${hi} ${unit}`);
    else if (lo != null) parts.push(`${label} ≥ ${lo} ${unit}`);
    else if (hi != null) parts.push(`${label} ≤ ${hi} ${unit}`);
  };
  range(c.minSpeedKt, c.maxSpeedKt, 'speed', 'kt');
  range(c.minAltFt, c.maxAltFt, 'alt', 'ft');
  range(c.minDistNm, c.maxDistNm, 'dist', 'nm');
  const flags: [boolean | undefined, string][] = [
    [c.military, 'military'], [c.interesting, 'noteworthy'],
    [c.ladd, 'LADD'], [c.pia, 'PIA'], [c.emergency, 'emergency'],
  ];
  for (const [v, label] of flags) {
    if (v === true) parts.push(label);
    else if (v === false) parts.push(`not ${label}`);
  }
  return parts.length ? parts.join(' · ') : 'any aircraft';
}

// ── Settings drawer ──────────────────────────────────────────────────────
// NB the 'data' slug is the STABLE key (URL/event callers pass `{tab:'data'}`);
// only its user-facing LABEL is "Floor Plan" — the tab now owns floor
// lifecycle (add / rename / resize / delete) as well as the configuration
// registry, so "Data" undersold it.
type SettingsTab = 'connection' | 'display' | 'weather' | 'avatars' | 'integrations' | 'data';

@customElement('diorama-settings-drawer')
export class SettingsDrawer extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() open = false;
  @state() private _tab: SettingsTab = 'connection';
  @state() private _url = '';
  @state() private _token = '';
  @state() private _packErr = '';
  // Sweet Home 3D structural import (Data tab).
  @state() private _sh3dImportFurniture = true;
  @state() private _sh3dWarnings: string[] = [];
  @state() private _sh3dBusy = false;
  // Which pack rows have their member list expanded (runtime-only).
  private _packExpanded = new Set<string>();
  // Which flight glow rule is expanded into its full criteria form. A glow rule
  // carries ~15 fields, so the list is collapsed summary lines by default (the
  // sidebar's collapsible-section idiom) rather than value-rules' always-open
  // rows — 10 expanded rules would be unusably tall. Runtime-only, one at a time.
  @state() private _glowRuleOpen: string | null = null;

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
         ['avatars', 'Avatars'], ['integrations', 'Integrations'], ['data', 'Floor Plan']]
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
        ${this._aboutBlock()}
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
      ${this._aboutBlock()}
    `;
  }

  // ── About block (Connection tab footer) ─────────────────────────────────
  // What Diorama is + where the docs and source live. Shown in every UI mode
  // (the Connection tab is the one tab kiosk/view users can reach).
  private _aboutBlock() {
    const link = (href: string, label: string) => html`
      <a href=${href} target="_blank" rel="noreferrer"
         style="color:var(--accent);text-decoration:none">${label}</a>`;
    return html`
      <div style="border-top:1px solid var(--border);margin-top:18px;padding-top:12px">
        <strong style="font-size:12px;color:var(--text)">About Diorama</strong>
        <div style="font-size:11px;color:var(--text-dim);line-height:1.55;margin:6px 0 8px">
          Diorama is a graphical design interface for Home Assistant: build a
          virtual copy of your home, watch live device state in spatial
          context — presence radar, lights, appliances, weather, even aircraft
          overhead — and click anything to control it. First-class LD2450
          mmWave support; works with any HA entity.
        </div>
        <div style="font-size:11px;line-height:1.8">
          📖 ${link('https://pwsh.github.io/diorama/', 'Documentation & user guide')}
          — setup, features, floor-plan library, live demo<br>
          🐙 ${link('https://github.com/pwsh/diorama', 'GitHub repository')}
          — source, issue tracker<br>
          📋 ${link('https://github.com/pwsh/diorama/releases', 'Changelog')}
          — release notes for every version
        </div>
      </div>`;
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
      ${this._neighborhoodBlock()}
      ${this._flightsBlock()}
    `;
  }

  // ── Flight & satellite tracking block (roadmap P4) ───────────────────────
  private _flightsBlock() {
    const p = this.planner;
    const cfg = p.store.flights ?? {};
    const enabled = cfg.enabled === true;
    const source = cfg.source ?? 'cloud';
    const set = (mut: (f: import('../types.js').FlightsConfig) => void) => p.setFlights(mut);

    // Live status line off the planner's own poll state.
    const status = p.flightsStatus;
    const ageS = p.flightsAt ? Math.max(0, Math.round((Date.now() - p.flightsAt) / 1000)) : null;
    const statusLine = status === 'off'
      ? html`<span style="color:var(--text-dim)">disabled</span>`
      : status === 'no-origin'
        ? html`<span style="color:#fb8c00">needs a location — calibrate a GPS landmark or set a weather location</span>`
        : status === 'error'
          ? html`<span style="color:#ff5252">fetch failing — check source settings</span>`
          : html`<span style="color:#69f0ae">${p.flightsNow?.length ?? 0} aircraft${ageS !== null ? ` · updated ${ageS}s ago` : ''}</span>`;

    // Mixed content is a hard browser block, not a warning we can work around:
    // an HTTPS-served panel cannot fetch an http:// LAN receiver at all.
    const localUrl = cfg.localUrl ?? '';
    const mixedContent = typeof window !== 'undefined'
      && window.location?.protocol === 'https:' && /^http:\/\//i.test(localUrl.trim());

    const sourceRow = (val: 'cloud' | 'local' | 'entity', label: string, hint: string) => html`
      <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;font-size:12px;color:var(--text);margin:4px 0">
        <input type="radio" name="flightsource" .checked=${source === val}
               @change=${() => set(f => { f.source = val; })}>
        <span style="flex:1"><span>${label}</span>
          <span style="display:block;color:var(--text-dim);font-size:10px;line-height:1.35">${hint}</span></span>
      </label>`;

    // Blank clears the field (both altitude filters + the low-overflight
    // threshold are "off when absent", never 0).
    const numOrUndef = (v: string, lo: number, hi: number): number | undefined => {
      const n = parseFloat(v);
      return v.trim() === '' || !isFinite(n) ? undefined : Math.max(lo, Math.min(hi, n));
    };

    return html`
      <div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:2px">
          <strong style="font-size:12px;color:var(--text)">Flight tracking</strong>
          <span style="font-size:10px;text-align:right">${statusLine}</span>
        </div>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.4;margin-bottom:6px">
          Live aircraft overhead (ADS-B) and the ISS, drawn into the 3D sky on a
          compressed display shell — positions are true in bearing, not to scale.
        </div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)">
          <input type="checkbox" .checked=${enabled}
                 @change=${(e: Event) => set(f => { f.enabled = (e.target as HTMLInputElement).checked; })}>
          <span style="flex:1">Show aircraft &amp; satellites</span>
        </label>
        ${enabled ? html`
          <div style="margin:6px 0 0 8px;display:flex;flex-direction:column;gap:2px">
            ${sourceRow('cloud', 'Cloud (airplanes.live)',
              'Sends your home coordinates to airplanes.live (third-party, non-commercial feed, no SLA).')}
            ${sourceRow('local', 'Local receiver (LAN)',
              'Your own dump1090 / readsb / tar1090 aircraft.json — freshest, no third party.')}
            ${source === 'local' ? html`
              <div style="margin:0 0 6px 24px">
                <input type="text" placeholder="http://192.0.2.10/tar1090/data/aircraft.json"
                       .value=${localUrl}
                       @change=${(e: Event) => set(f => { const v = (e.target as HTMLInputElement).value.trim(); f.localUrl = v || undefined; })}
                       style="width:100%;padding:5px 7px;border-radius:4px;border:1px solid ${mixedContent ? '#fb8c00' : 'var(--border)'};background:#111;color:var(--text);font-size:12px;box-sizing:border-box">
                <div style="font-size:10px;color:var(--text-dim);margin-top:2px;line-height:1.35">
                  The receiver must send an <code>Access-Control-Allow-Origin</code>
                  header on <code>aircraft.json</code> — it does NOT by default
                  (see docs/research/flight-tracking.md §2.2 for the one-block fix).
                </div>
                ${mixedContent ? html`
                  <div style="font-size:10px;color:#fb8c00;margin-top:3px;line-height:1.35">
                    Blocked by the browser: an HTTPS panel cannot fetch an HTTP receiver.
                  </div>` : nothing}
              </div>` : nothing}
            ${sourceRow('entity', 'Home Assistant entity',
              'An HA rest sensor whose attributes carry an aircraft array — see the research doc. Fetched server-side, so no CORS applies.')}
            ${source === 'entity' ? html`
              <div class="row" style="align-items:center;margin:0 0 6px 24px">
                <span style="flex:1;font-size:11px;color:${cfg.entityId ? 'var(--text)' : 'var(--text-dim)'};
                             overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                  ${cfg.entityId ?? 'not bound'}</span>
                <button class="btn" @click=${() => this._pickFlightsEntity()}>🔗</button>
                ${cfg.entityId ? html`<button class="btn"
                  @click=${() => set(f => { f.entityId = undefined; })}>✕</button>` : nothing}
              </div>` : nothing}

            <div class="row" style="align-items:center;margin-top:4px">
              <label style="font-size:12px;color:var(--text);flex:1" title="Search + display radius around home.">Radius (nm)</label>
              <input type="number" min="5" max="100" step="5" .value=${String(cfg.radiusNm ?? FLIGHTS_DEFAULT_RADIUS_NM)}
                     @change=${(e: Event) => set(f => { f.radiusNm = numOrUndef((e.target as HTMLInputElement).value, 5, 100) ?? FLIGHTS_DEFAULT_RADIUS_NM; })}
                     style="width:80px">
            </div>
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text);flex:1" title="How far out, in scene metres, an aircraft sitting at exactly the search radius is drawn. The whole shell scales together — models grow with it, so apparent sizes stay the same.">Draw radius (m)</label>
              <input type="number" min="60" max="1000" step="10"
                     .value=${String(cfg.shellRadiusM ?? FLIGHT_SHELL_DEFAULT_RADIUS_M)}
                     @change=${(e: Event) => set(f => {
                       // setFlights clamps 60..1000 + normalizes the default to undefined.
                       f.shellRadiusM = numOrUndef((e.target as HTMLInputElement).value, 60, 1000)
                         ?? FLIGHT_SHELL_DEFAULT_RADIUS_M;
                     })}
                     style="width:80px">
            </div>
            <div style="font-size:10px;color:var(--text-dim);margin:-2px 0 4px;line-height:1.35">
              Scene distance the search radius maps onto — larger spreads traffic deeper toward the horizon.
            </div>
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text);flex:1"
                     title="Multiplies the display HEIGHT only (0.2–2, default 1). The horizontal shell is untouched, so traffic drops toward the horizon without moving any closer to the house. Aircraft can never be lowered onto the property — an absolute clearance floor is applied after the scale.">Height scale ×</label>
              <input type="number" min="0.2" max="2" step="0.1"
                     .value=${String(cfg.verticalScale ?? 1)}
                     @change=${(e: Event) => set(f => {
                       const v = Number((e.target as HTMLInputElement).value);
                       // setFlights clamps 0.2..2 + normalizes 1 → undefined.
                       f.verticalScale = isFinite(v) ? v : 1;
                     })}
                     style="width:80px">
            </div>
            <div style="font-size:10px;color:var(--text-dim);margin:-2px 0 4px;line-height:1.35">
              Lower high-altitude traffic without bringing it closer.
            </div>
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text);flex:1" title="Poll cadence. airplanes.live documents a 1 request/second limit.">Poll (s)</label>
              <input type="number" min="5" max="60" step="1" .value=${String(cfg.pollSeconds ?? 8)}
                     @change=${(e: Event) => set(f => { f.pollSeconds = numOrUndef((e.target as HTMLInputElement).value, 5, 60) ?? 8; })}
                     style="width:80px">
            </div>
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text);flex:1" title="Blank = no filter.">Min altitude (ft)</label>
              <input type="number" min="0" max="60000" step="500" placeholder="off"
                     .value=${cfg.minAltFt != null ? String(cfg.minAltFt) : ''}
                     @change=${(e: Event) => set(f => { f.minAltFt = numOrUndef((e.target as HTMLInputElement).value, 0, 60000); })}
                     style="width:80px">
            </div>
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text);flex:1" title="Blank = no filter.">Max altitude (ft)</label>
              <input type="number" min="0" max="60000" step="500" placeholder="off"
                     .value=${cfg.maxAltFt != null ? String(cfg.maxAltFt) : ''}
                     @change=${(e: Event) => set(f => { f.maxAltFt = numOrUndef((e.target as HTMLInputElement).value, 0, 60000); })}
                     style="width:80px">
            </div>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text);margin-top:4px">
              <input type="checkbox" .checked=${cfg.showLabels !== false}
                     @change=${(e: Event) => set(f => { f.showLabels = (e.target as HTMLInputElement).checked; })}>
              <span style="flex:1">Callsign labels</span>
            </label>
            ${cfg.showLabels !== false ? html`
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text);margin-left:22px"
                     title="A light piston single with a callsign tows a broadside banner instead of a label plate. Charming over a quiet field, busy over a dense one.">
                <input type="checkbox" .checked=${cfg.banners !== false}
                       @change=${(e: Event) => set(f => { f.banners = (e.target as HTMLInputElement).checked; })}>
                <span style="flex:1">Tow banners (small planes)</span>
              </label>` : nothing}
            ${cfg.showLabels !== false ? this._flightLabelFieldsRow(cfg, set) : nothing}
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
                   title="A flashing bead on the fuselage: red = emergency, yellow = flagged noteworthy by the data source, green = military, white = LADD (an FAA privacy program).">
              <input type="checkbox" .checked=${cfg.beacons !== false}
                     @change=${(e: Event) => set(f => { f.beacons = (e.target as HTMLInputElement).checked; })}>
              <span style="flex:1">Status beacons</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
                   title="Speed reads at a glance: a hovering machine shows a rotor blur and no trail, faster aircraft grow a comet tail, then a contrail, and the fastest add an afterburner glow with ghost multiples. Off builds none of it.">
              <input type="checkbox" .checked=${cfg.speedViz !== false}
                     @change=${(e: Event) => set(f => { f.speedViz = (e.target as HTMLInputElement).checked; })}>
              <span style="flex:1">Speed effects</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
                   title="PIA / LADD are FAA privacy programs the ADS-B source deliberately does not enforce. Dim those aircraft (and hide a PIA aircraft's identity) as a courtesy — off shows everything in full.">
              <input type="checkbox" .checked=${cfg.privacyDim !== false}
                     @change=${(e: Event) => set(f => { f.privacyDim = (e.target as HTMLInputElement).checked; })}>
              <span style="flex:1">Dim privacy-flagged aircraft</span>
            </label>
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text);flex:1"
                     title="Size multiplier for every aircraft model (0.5–4, default 1). Composed with the distance-compensated growth curve, so nearby and rim aircraft keep their relative sizes — this just makes the whole fleet read bigger from a zoomed-out camera.">Model size ×</label>
              <input type="number" min="0.5" max="4" step="0.1"
                     .value=${String(cfg.modelScale ?? 1)}
                     @change=${(e: Event) => set(f => {
                       const v = Number((e.target as HTMLInputElement).value);
                       // setFlights clamps + normalizes 1 → undefined.
                       f.modelScale = isFinite(v) ? v : 1;
                     })}
                     style="width:80px">
            </div>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)">
              <input type="checkbox" .checked=${cfg.iss !== false}
                     @change=${(e: Event) => set(f => { f.iss = (e.target as HTMLInputElement).checked; })}>
              <span style="flex:1">Track the ISS</span>
            </label>

            ${this._flightGlowRulesBlock(cfg, set)}

            <div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border)">
              <div style="font-size:11px;font-weight:600;margin-bottom:4px">Alerts</div>
              <div class="row" style="align-items:center">
                <label style="font-size:12px;color:var(--text);flex:1"
                       title="Warn when an aircraft passes below this altitude within 3 nm. Blank = off.">Low overflight (ft)</label>
                <input type="number" min="0" max="20000" step="250" placeholder="off"
                       .value=${cfg.alerts?.lowAltFt != null ? String(cfg.alerts.lowAltFt) : ''}
                       @change=${(e: Event) => set(f => {
                         if (!f.alerts) f.alerts = {};
                         f.alerts.lowAltFt = numOrUndef((e.target as HTMLInputElement).value, 0, 20000);
                       })}
                       style="width:80px">
              </div>
              <label style="font-size:10px;color:var(--text-dim);display:block;margin:6px 0 2px">
                Watch list (callsign prefixes or hex codes, comma-separated)
              </label>
              <input type="text" placeholder="UAL, N12345, a1b2c3"
                     .value=${(cfg.alerts?.watch ?? []).join(', ')}
                     @change=${(e: Event) => set(f => {
                       if (!f.alerts) f.alerts = {};
                       // setFlights normalizes (trim/uppercase/drop blanks).
                       f.alerts.watch = (e.target as HTMLInputElement).value.split(',');
                     })}
                     style="width:100%;padding:5px 7px;border-radius:4px;border:1px solid var(--border);
                            background:#111;color:var(--text);font-size:12px;box-sizing:border-box">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text);margin-top:6px"
                     title="Notify when the ISS rises above 10° — a live edge detector, not an advance prediction.">
                <input type="checkbox" .checked=${cfg.alerts?.issPass !== false}
                       @change=${(e: Event) => set(f => {
                         if (!f.alerts) f.alerts = {};
                         f.alerts.issPass = (e.target as HTMLInputElement).checked;
                       })}>
                <span style="flex:1">ISS pass alert</span>
              </label>
            </div>
          </div>` : nothing}
      </div>`;
  }

  // Which fields the label plate (3D) + the 2D text line carry. Checked = in;
  // order is the canonical FLIGHT_LABEL_FIELDS order filtered by the checked
  // set, so toggling can never produce a weird sequence. The empty set clears
  // the field entirely, which setFlights's sanitizer turns back into the
  // default ['callsign','alt'] plate.
  private _flightLabelFieldsRow(
    cfg: import('../types.js').FlightsConfig,
    set: (mut: (f: import('../types.js').FlightsConfig) => void) => void,
  ) {
    const chosen = new Set(
      (sanitizeLabelFields(cfg.labelFields) ?? FLIGHT_LABEL_FIELDS_DEFAULT) as string[]);
    const LABELS: Record<string, string> = {
      callsign: 'Callsign', reg: 'Registration', type: 'Type', operator: 'Operator',
      alt: 'Altitude', speed: 'Speed', trend: 'Climb/descend', squawk: 'Squawk',
      dist: 'Distance',
    };
    return html`
      <div style="margin-top:6px">
        <label style="font-size:10px;color:var(--text-dim);display:block;margin-bottom:3px">
          Label fields
        </label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px">
          ${FLIGHT_LABEL_FIELDS.map(k => html`
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11px;color:var(--text)">
              <input type="checkbox" .checked=${chosen.has(k)}
                     @change=${(e: Event) => set(f => {
                       const next = new Set(chosen);
                       if ((e.target as HTMLInputElement).checked) next.add(k); else next.delete(k);
                       const list = FLIGHT_LABEL_FIELDS.filter(x => next.has(x));
                       f.labelFields = list.length ? [...list] : undefined;
                     })}>
              <span style="flex:1">${LABELS[k]}</span>
            </label>`)}
        </div>
      </div>`;
  }

  // ── Flight glow rules (docs/research/flight-glow-rules.md §6.4) ──────────
  // An ordered, first-match-wins list. Each row is a COLLAPSED summary line
  // (label or a criteria digest + pattern + colour swatches + an [off] tag);
  // ✎ expands it in place into the full criteria form. ▲/▼ reorder — unlike the
  // value-rules editor, order materially changes behaviour here (two rules can
  // easily both match one aircraft along independent dimensions), so nudge
  // buttons are not optional. Everything writes through `planner.setFlights`,
  // which sanitizes on every write.
  private _flightGlowRulesBlock(
    cfg: import('../types.js').FlightsConfig,
    set: (mut: (f: import('../types.js').FlightsConfig) => void) => void,
  ) {
    const rules = cfg.glowRules ?? [];
    const beaconsOn = cfg.beacons !== false;
    // Always write a fresh array — setFlights replaces it with the sanitized
    // result, so mutating the stored objects in place would fight the sanitizer.
    const write = (next: FlightGlowRule[]) => set(f => {
      f.glowRules = next.length ? next : undefined;
    });
    const edit = (id: string, mut: (r: FlightGlowRule) => void) =>
      write(rules.map(r => {
        if (r.id !== id) return r;
        const copy: FlightGlowRule = { ...r, criteria: { ...r.criteria } };
        mut(copy);
        return copy;
      }));
    const move = (i: number, d: number) => {
      const j = i + d;
      if (j < 0 || j >= rules.length) return;
      const next = rules.slice();
      [next[i], next[j]] = [next[j], next[i]];
      write(next);
    };
    const PATTERN_LABELS: Record<FlightGlowPattern, string> = {
      none: 'No glow (mute)', solid: 'Solid (steady)', flash: 'Flash (1.2 Hz)',
      strobe: 'Strobe (double-flash)', rotate: 'Rotating beacon',
      fade: 'Fade (slow breathe)', alternate: 'Alternate (wig-wag)',
    };
    // Blank clears a criterion. NEVER store '' — under the hybrid wildcard rule
    // an empty pattern would compile to `**` and match every aircraft on that
    // field (the sanitizer guards this too; the UI simply never authors it).
    const txt = (v: string) => { const s = v.trim(); return s ? s : undefined; };
    const numOr = (v: string, lo: number, hi: number) => {
      const n = parseFloat(v);
      return v.trim() === '' || !isFinite(n) ? undefined : Math.max(lo, Math.min(hi, n));
    };

    const swatch = (c: string | undefined) => c
      ? html`<span style="display:inline-block;width:9px;height:9px;border-radius:50%;
                          background:${c};border:1px solid rgba(255,255,255,0.35)"></span>`
      : nothing;

    const wildRow = (r: FlightGlowRule, key: 'operator' | 'typeCode' | 'typeDesc' | 'reg' | 'callsign' | 'category',
                     label: string, ph: string) => html`
      <div class="row" style="align-items:center;margin:0">
        <label style="font-size:11px;color:var(--text-dim);flex:1">${label}</label>
        <input type="text" data-glow-field=${key} placeholder=${ph} .value=${r.criteria[key] ?? ''}
               @change=${(e: Event) => edit(r.id, x => {
                 x.criteria[key] = txt((e.target as HTMLInputElement).value); })}
               style="width:132px;padding:2px 5px;border-radius:3px;border:1px solid var(--border);
                      background:#111;color:var(--text);font-size:11px">
      </div>`;

    const rangeRow = (r: FlightGlowRule, lo: 'minSpeedKt' | 'minAltFt' | 'minDistNm',
                      hi: 'maxSpeedKt' | 'maxAltFt' | 'maxDistNm',
                      label: string, max: number, step: number) => html`
      <div class="row" style="align-items:center;margin:0">
        <label style="font-size:11px;color:var(--text-dim);flex:1">${label}</label>
        <input type="number" data-glow-field=${lo} min="0" max=${max} step=${step} placeholder="min"
               .value=${r.criteria[lo] != null ? String(r.criteria[lo]) : ''}
               @change=${(e: Event) => edit(r.id, x => {
                 x.criteria[lo] = numOr((e.target as HTMLInputElement).value, 0, max); })}
               style="width:62px">
        <input type="number" data-glow-field=${hi} min="0" max=${max} step=${step} placeholder="max"
               .value=${r.criteria[hi] != null ? String(r.criteria[hi]) : ''}
               @change=${(e: Event) => edit(r.id, x => {
                 x.criteria[hi] = numOr((e.target as HTMLInputElement).value, 0, max); })}
               style="width:62px;margin-left:4px">
      </div>`;

    const flagRow = (r: FlightGlowRule, key: 'military' | 'interesting' | 'ladd' | 'pia' | 'emergency',
                     label: string, title?: string) => html`
      <div class="row" style="align-items:center;margin:0" title=${title ?? ''}>
        <label style="font-size:11px;color:var(--text-dim);flex:1">${label}</label>
        <select data-glow-field=${key} style="width:80px;font-size:11px"
                @change=${(e: Event) => edit(r.id, x => {
                  const v = (e.target as HTMLSelectElement).value;
                  x.criteria[key] = v === '' ? undefined : v === 'yes'; })}>
          <option value="" ?selected=${r.criteria[key] == null}>Any</option>
          <option value="yes" ?selected=${r.criteria[key] === true}>Yes</option>
          <option value="no" ?selected=${r.criteria[key] === false}>No</option>
        </select>
      </div>`;

    return html`
      <div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--border)">
        <div style="font-size:11px;font-weight:600;margin-bottom:2px">Glow rules</div>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.4;margin-bottom:5px">
          Give matching aircraft their own glow colour and pattern. First match
          wins; anything unmatched keeps the default beacon above. Text fields
          accept <code>*</code> and <code>?</code> wildcards — plain text matches
          anywhere in the value.
          ${beaconsOn ? nothing : html`<span style="color:#fb8c00">
            Status beacons are off, so no glow renders at all right now.</span>`}
        </div>
        ${rules.length === 0 ? html`
          <div style="font-size:10px;color:var(--text-dim);font-style:italic;margin-bottom:4px">
            No rules — every aircraft uses the default beacon.
          </div>` : nothing}
        ${rules.map((r, i) => {
          const open = this._glowRuleOpen === r.id;
          const off = r.enabled === false;
          return html`
            <div data-glow-rule=${r.id}
                 style="border:1px solid var(--border);border-radius:4px;padding:4px 5px;margin-bottom:4px;
                        background:rgba(0,0,0,0.22);opacity:${off ? 0.55 : 1}">
              <div style="display:flex;align-items:center;gap:5px">
                <span style="flex:1;font-size:11px;color:var(--text);overflow:hidden;
                             text-overflow:ellipsis;white-space:nowrap">
                  ${r.label || summarizeGlowCriteria(r.criteria)}
                </span>
                <span style="font-size:10px;color:var(--text-dim)">${r.pattern}</span>
                ${swatch(r.colorA)}${swatch(r.colorB)}
                ${off ? html`<span style="font-size:9px;color:#fb8c00">[off]</span>` : nothing}
                <button class="btn" style="font-size:10px;padding:1px 4px" title="Move earlier"
                        ?disabled=${i === 0} @click=${() => move(i, -1)}>▲</button>
                <button class="btn" style="font-size:10px;padding:1px 4px" title="Move later"
                        ?disabled=${i === rules.length - 1} @click=${() => move(i, 1)}>▼</button>
                <button class="btn" style="font-size:10px;padding:1px 4px" title="Edit conditions"
                        @click=${() => { this._glowRuleOpen = open ? null : r.id; }}>${open ? '▾' : '✎'}</button>
                <button class="btn" style="font-size:10px;padding:1px 4px" title="Delete rule"
                        @click=${() => { this._glowRuleOpen = null; write(rules.filter(x => x.id !== r.id)); }}>✕</button>
              </div>
              ${open ? html`
                <div style="margin-top:5px;padding-top:5px;border-top:1px solid var(--border);
                            display:flex;flex-direction:column;gap:3px">
                  <div class="row" style="align-items:center;margin:0">
                    <label style="font-size:11px;color:var(--text-dim);flex:1">Name</label>
                    <input type="text" data-glow-field="label" placeholder="optional" .value=${r.label ?? ''}
                           @change=${(e: Event) => edit(r.id, x => {
                             x.label = txt((e.target as HTMLInputElement).value); })}
                           style="width:132px;padding:2px 5px;border-radius:3px;border:1px solid var(--border);
                                  background:#111;color:var(--text);font-size:11px">
                  </div>
                  ${wildRow(r, 'operator', 'Operator', 'Southwest')}
                  ${wildRow(r, 'typeCode', 'Type code', 'B73?')}
                  ${wildRow(r, 'typeDesc', 'Type name', '*MAX*')}
                  ${wildRow(r, 'reg', 'Registration', 'N*')}
                  ${wildRow(r, 'callsign', 'Callsign', 'SWA*')}
                  ${wildRow(r, 'category', 'ADS-B category', 'A3')}
                  ${rangeRow(r, 'minSpeedKt', 'maxSpeedKt', 'Speed (kt)', 800, 10)}
                  ${rangeRow(r, 'minAltFt', 'maxAltFt', 'Altitude (ft)', 60000, 500)}
                  ${rangeRow(r, 'minDistNm', 'maxDistNm', 'Distance (nm)', 500, 1)}
                  ${flagRow(r, 'military', 'Military')}
                  ${flagRow(r, 'interesting', 'Noteworthy')}
                  ${flagRow(r, 'ladd', 'LADD')}
                  ${flagRow(r, 'pia', 'PIA')}
                  ${flagRow(r, 'emergency', 'Emergency',
                    'Aircraft squawking an emergency always show the red emergency beacon, whatever this condition says — kept for forward compatibility only.')}
                  <div style="font-size:9px;color:var(--text-dim);line-height:1.35;margin:-1px 0 2px">
                    An emergency aircraft always keeps the red beacon, so an
                    “Emergency = Yes” condition can never fire.
                  </div>
                  <div class="row" style="align-items:center;margin:0">
                    <label style="font-size:11px;color:var(--text-dim);flex:1">Pattern</label>
                    <select data-glow-field="pattern" style="width:132px;font-size:11px"
                            @change=${(e: Event) => edit(r.id, x => {
                              x.pattern = (e.target as HTMLSelectElement).value as FlightGlowPattern;
                              // A visible pattern needs a colour or the sanitizer
                              // would drop the whole rule on write.
                              if (x.pattern !== 'none' && !x.colorA) x.colorA = '#ffd400';
                            })}>
                      ${FLIGHT_GLOW_PATTERNS.map(pk => html`
                        <option value=${pk} ?selected=${r.pattern === pk}>${PATTERN_LABELS[pk]}</option>`)}
                    </select>
                  </div>
                  ${r.pattern === 'none' ? nothing : html`
                    <div class="row" style="align-items:center;margin:0">
                      <label style="font-size:11px;color:var(--text-dim);flex:1">Colours</label>
                      <input type="color" data-glow-field="colorA" style="width:34px;padding:0" .value=${r.colorA ?? '#ffd400'}
                             @change=${(e: Event) => edit(r.id, x => {
                               x.colorA = (e.target as HTMLInputElement).value; })}>
                      <input type="color" data-glow-field="colorB" style="width:34px;padding:0;margin-left:4px"
                             .value=${r.colorB ?? '#ffffff'}
                             @change=${(e: Event) => edit(r.id, x => {
                               x.colorB = (e.target as HTMLInputElement).value; })}>
                      ${r.colorB ? html`<button class="btn" style="font-size:10px;padding:1px 4px;margin-left:3px"
                        title="Clear the second colour"
                        @click=${() => edit(r.id, x => { x.colorB = undefined; })}>✕</button>` : nothing}
                    </div>
                    <div style="font-size:9px;color:var(--text-dim);line-height:1.35">
                      ${r.pattern === 'solid'
                        ? 'Second colour tints the halo around the steady bead.'
                        : 'Second colour is optional — patterns cycle between the two when set.'}
                    </div>`}
                  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:11px;color:var(--text)">
                    <input type="checkbox" data-glow-field="enabled" .checked=${r.enabled !== false}
                           @change=${(e: Event) => edit(r.id, x => {
                             x.enabled = (e.target as HTMLInputElement).checked; })}>
                    <span style="flex:1">Rule enabled</span>
                  </label>
                </div>` : nothing}
            </div>`;
        })}
        <button class="btn" data-glow-add style="width:100%;font-size:10px"
                ?disabled=${rules.length >= MAX_FLIGHT_GLOW_RULES}
                @click=${() => {
                  const id = `fgr_${Math.random().toString(36).slice(2, 9)}`;
                  // Appended EXPANDED with empty criteria (matches everything
                  // until narrowed) + a sane visible default, the "+ Add rule"
                  // convention the value-rules editor set.
                  write([...rules, { id, criteria: {}, pattern: 'flash', colorA: '#ffd400' }]);
                  this._glowRuleOpen = id;
                }}>
          + Add rule${rules.length >= MAX_FLIGHT_GLOW_RULES ? ` (max ${MAX_FLIGHT_GLOW_RULES})` : ''}
        </button>
      </div>`;
  }

  private _pickFlightsEntity(): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'sensor',
        onPick: (entityId: string) => this.planner.setFlights(f => { f.entityId = entityId; }),
      },
    }));
  }

  // ── Neighborhood (OpenFreeMap) block ────────────────────────────────────
  private _neighborhoodBlock() {
    const p = this.planner;
    const cfg = p.store.neighborhood ?? {};
    const enabled = cfg.enabled === true;
    const source = cfg.source ?? 'openfreemap';
    const set = (mut: (n: import('../types.js').NeighborhoodConfig) => void) => p.setNeighborhood(mut);
    const customUrl = cfg.tileUrlTemplate ?? '';
    const schemeOk = customUrl.trim() === '' || /^https?:\/\//i.test(customUrl.trim());
    return html`
      <div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px">
        <div style="font-size:12px;font-weight:600;margin-bottom:6px">Neighborhood (OpenFreeMap)</div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)"
               title="Fetch surrounding building/road map data from OpenFreeMap and align it to your calibrated GPS landmarks.">
          <input type="checkbox" .checked=${enabled}
                 @change=${(e: Event) => set(n => { n.enabled = (e.target as HTMLInputElement).checked; })}>
          <span style="flex:1">Show neighborhood overlay</span>
        </label>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.4;margin:4px 0 6px">
          Fetches map data for your address from OpenFreeMap (openfreemap.org), a free
          public service. Your address is sent to their servers as tile coordinates.
        </div>
        ${enabled ? html`
          <div style="margin:6px 0 0 8px;display:flex;flex-direction:column;gap:6px">
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text)">Source</label>
              <select .value=${source}
                      @change=${(e: Event) => set(n => { n.source = (e.target as HTMLSelectElement).value as 'openfreemap' | 'custom'; })}>
                <option value="openfreemap">OpenFreeMap</option>
                <option value="custom">Custom tile URL</option>
              </select>
            </div>
            ${source === 'custom' ? html`
              <div>
                <label style="font-size:10px;color:var(--text-dim);display:block;margin-bottom:2px">Tile URL template ({z}/{x}/{y}.pbf)</label>
                <input type="text" placeholder="https://host/tiles/{z}/{x}/{y}.pbf" .value=${customUrl}
                       @change=${(e: Event) => set(n => { const v = (e.target as HTMLInputElement).value.trim(); n.tileUrlTemplate = v || undefined; })}
                       style="width:100%;padding:5px 7px;border-radius:4px;border:1px solid ${schemeOk ? 'var(--border)' : '#ff5252'};background:#111;color:var(--text);font-size:12px;box-sizing:border-box">
                ${!schemeOk ? html`<div style="font-size:10px;color:#ff5252;margin-top:2px">Must start with http:// or https://</div>`
                  : html`<div style="font-size:10px;color:var(--text-dim);margin-top:2px">Self-hosted OpenFreeMap or a Protomaps/PMTiles extract. Data is still OSM/OpenMapTiles-derived (attribution still applies).</div>`}
              </div>` : nothing}
            <div class="row" style="align-items:center">
              <label style="font-size:12px;color:var(--text)" title="Fetch radius around your calibrated address (metres). Up to 3 km — the 3D camera widens its view distance to match.">Radius (m)</label>
              <input type="number" min="100" max="3000" step="50" .value=${String(cfg.radiusM ?? 350)}
                     @change=${(e: Event) => set(n => { const v = parseFloat((e.target as HTMLInputElement).value); n.radiusM = isFinite(v) ? Math.max(100, Math.min(3000, v)) : 350; })}
                     style="width:80px">
            </div>
            <div style="font-size:10px;color:var(--text-dim);line-height:1.35;margin-top:-2px">
              Larger radii fetch more tiles (the count grows with the area) — tiles are
              cached on this device for 30 days, and the 3D view automatically extends
              its camera range so distant buildings stay visible.
            </div>
            <button class="btn" style="align-self:flex-start" @click=${() => { void this.planner.clearNeighborhoodCache(); }}>Clear tile cache</button>
            <div style="font-size:10px;color:var(--text-dim);line-height:1.35">
              Third-party fetch when enabled. Data: © OpenMapTiles · © OpenStreetMap
              contributors. Detailed layer / alignment controls live in the sidebar
              "Neighborhood" section.
            </div>
          </div>` : nothing}
      </div>`;
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
      <div class="row" title="Show all lengths and distances in feet / inches instead of millimetres. This is a synced store setting, not a per-device one.">
        <label>Imperial units</label>
        <input type="checkbox" data-imperial-toggle .checked=${!!p.store.imperial}
               @change=${(e: Event) => {
                 p.store.imperial = (e.target as HTMLInputElement).checked;
                 p.save(); p.emitConfig();
               }}>
      </div>
      <div class="row" title="Height of the SURROUNDINGS (backdrop grid, neighborhood overlay, yard fill) relative to the floor slab. Negative = ground below a raised foundation.">
        <label>Ground level (mm)</label>
        <input type="number" step="50" min="-10000" max="10000" style="width:80px"
               .value=${String(sc.groundLevelMm ?? 0)}
               @change=${(e: Event) => upd(() => {
                 const n = Number((e.target as HTMLInputElement).value);
                 const v = isFinite(n) ? Math.max(-10000, Math.min(10000, Math.round(n))) : 0;
                 p.store.scene3d!.groundLevelMm = v === 0 ? undefined : v;
               })}>
      </div>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 4px">
        Surroundings relative to the floor slab — negative = ground below a raised foundation.
        The house, furniture and your own ground areas / terraces stay put.
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
      <div style="border-top:1px solid var(--border);margin:10px 0 0;padding-top:8px">
        <div style="font-weight:600;font-size:11px;margin-bottom:4px">Input</div>
        <div class="row">
          <label title="Single-key canvas shortcuts: the tool letters/digits (1–8, m), Delete / Backspace on the current selection, and the arrow-key furniture nudge. Turn OFF if tools switch or items vanish while you type — focus can silently fall back to the page body mid-edit. Ctrl/Cmd+Z undo, Ctrl/Cmd+0 reset view, Escape, Enter and the Space pan-hold keep working either way. Stored on this device only.">Keyboard shortcuts (tool hotkeys, Delete, arrows)</label>
          <input type="checkbox" data-hotkeys-toggle .checked=${p.hotkeysEnabled}
                 @change=${(e: Event) => p.setHotkeysEnabled((e.target as HTMLInputElement).checked)}>
        </div>
      </div>
      <div style="border-top:1px solid var(--border);margin:10px 0 0;padding-top:8px">
        <div style="font-weight:600;font-size:11px;margin-bottom:4px">Camera</div>
        ${check('Lock pivot to plan centre', resolvePivotMode(sc).locked,
          v => {
            // Resolve BEFORE mutating — the "pin the other half" check below
            // must see the pre-edit state (`sc` IS p.store.scene3d when set).
            const wasFree = resolvePivotMode(sc).free;
            // Default is LOCKED, so the default value clears the key.
            if (v) delete p.store.scene3d!.pivotLocked;
            else p.store.scene3d!.pivotLocked = false;
            // Pin the other half once either is touched so the resolver stops
            // consulting the deprecated `cameraPivot` enum half-way.
            if (p.store.scene3d!.freeMovement === undefined && wasFree) {
              p.store.scene3d!.freeMovement = true;
            }
          },
          'The camera always orbits the middle of the floor (or of the whole stack under glass house), '
          + 'so the view can never end up spinning around some off-centre point. '
          + 'Off: rotation pivots wherever the view was panned to.')}
        ${check('Free movement (pan)', resolvePivotMode(sc).free,
          v => {
            const wasLocked = resolvePivotMode(sc).locked;   // resolve BEFORE mutating
            // Default is NOT free, so the default value clears the key.
            if (v) p.store.scene3d!.freeMovement = true;
            else delete p.store.scene3d!.freeMovement;
            if (p.store.scene3d!.pivotLocked === undefined && !wasLocked) {
              p.store.scene3d!.pivotLocked = false;
            }
          },
          'Pan the view side to side and forward/back (mouse pan button and two-finger touch). '
          + 'With the pivot locked you can still pan freely — rotation just keeps spinning around the plan centre.')}
        ${check('Allow orbiting below the horizon', !!sc.belowHorizon,
          v => { p.store.scene3d!.belowHorizon = v; },
          'Let the camera drop below the horizon and look up at the floor from underneath')}
        <div class="row"><label title="Vertical field of view in degrees (default 50)">Vertical FOV</label>
          <input type="range" min="10" max="120" step="1" style="flex:1"
                 .value=${String(sc.fovV ?? 50)}
                 @input=${(e: Event) => upd(() => { p.store.scene3d!.fovV = Number((e.target as HTMLInputElement).value); })}>
          <span style="width:34px;text-align:right;font-size:10px">${sc.fovV ?? 50}°</span>
        </div>
        ${check('Custom horizontal FOV', sc.fovH != null,
          v => { p.store.scene3d!.fovH = v ? (sc.fovH ?? 70) : undefined; },
          'Set the horizontal FOV independently of the vertical FOV')}
        ${sc.fovH != null ? html`
          <div class="row"><label title="Horizontal field of view in degrees">Horizontal FOV</label>
            <input type="range" min="10" max="150" step="1" style="flex:1"
                   .value=${String(sc.fovH ?? 70)}
                   @input=${(e: Event) => upd(() => { p.store.scene3d!.fovH = Number((e.target as HTMLInputElement).value); })}>
            <span style="width:34px;text-align:right;font-size:10px">${sc.fovH ?? 70}°</span>
          </div>
          <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 4px">
            Independent H/V FOV renders a fixed frustum — the view may letterbox if the window shape differs.
          </div>
        ` : nothing}
      </div>
      ${this._bgTextBlock()}
      <div style="border-top:1px solid var(--border);margin:10px 0 0;padding-top:8px">
        <div class="row" title="Show all dimensions in feet / inches instead of millimetres">
          <label>Imperial units</label>
          <input type="checkbox" .checked=${!!p.store.imperial}
                 @change=${(e: Event) => { p.store.imperial = (e.target as HTMLInputElement).checked; p.save(); p.emitConfig(); this.requestUpdate(); }}>
        </div>
        <div class="row" title="Synthetic avatars (roamers + presence/demo AI) occasionally walk up to UNBOUND lights, switches and appliances and toggle them (session-only — never written to HA). Bound devices are only ever contemplated, never touched.">
          <label>Avatars use unbound devices</label>
          <input type="checkbox" .checked=${p.store.avatarInteractions !== false}
                 @change=${(e: Event) => { p.store.avatarInteractions = (e.target as HTMLInputElement).checked; p.save(); p.emitConfig(); this.requestUpdate(); }}>
        </div>
        <div class="row" title="Avatar rigs change into a situational outfit — pajamas when sleeping at night, a headband + shorts while exercising, an apron while working in the kitchen — with a brief sparkle on the swap. Per-person opt-out lives in the People section.">
          <label>Avatars change outfits</label>
          <input type="checkbox" .checked=${p.store.avatarCostumes !== false}
                 @change=${(e: Event) => { p.store.avatarCostumes = (e.target as HTMLInputElement).checked; p.save(); p.emitConfig(); this.requestUpdate(); }}>
        </div>
        <div class="row" title="Synthetic avatars (roamers + presence/demo AI) occasionally pick up and use a household object — vacuuming, sweeping, sipping a drink, reading a book — for a short session, then put it back. An umbrella also appears over ANY avatar (real or synthetic) standing outdoors in the rain.">
          <label>Avatars use props</label>
          <input type="checkbox" .checked=${p.store.avatarProps !== false}
                 @change=${(e: Event) => { p.store.avatarProps = (e.target as HTMLInputElement).checked; p.save(); p.emitConfig(); this.requestUpdate(); }}>
        </div>
        <div class="row" title="Show the bottom-right floor info readout (floor name, sensor + wall counts, floor dimensions) over the plan.">
          <label>Show floor info readout</label>
          <input type="checkbox" .checked=${p.store.showFloorStats !== false}
                 @change=${(e: Event) => { p.store.showFloorStats = (e.target as HTMLInputElement).checked; p.save(); p.emitConfig(); this.requestUpdate(); }}>
        </div>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:4px 0 0">
          Per-floor flooring / wall overrides live in the sidebar Floors section.
        </div>
      </div>
      ${this._compassBlock()}
      ${this._heatmapBlock()}
    `;
  }

  // ── On-screen compass + in-plan north icon ───────────────────────────────
  // Mirrors _weatherAppearance's anchor grid / custom-offset markup so the two
  // movable overlays configure consistently. All writes via planner.setCompass.
  private _compassBlock() {
    const p = this.planner;
    const c = p.store.compass;
    const set = (mut: (x: CompassConfig) => void) => { p.setCompass(mut); this.requestUpdate(); };
    type Anchor = NonNullable<CompassConfig['anchor']>;
    const cur: Anchor = c?.anchor ?? 'tr';
    const hasCustom = !!c?.custom;
    const fit = p.geoFit();
    const hasFit = fit != null && fit.transform.quality !== 'none';
    const n = resolveNorth(c, fit);
    const status = n.source === 'landmarks'
      ? `north from landmarks (quality ${fit!.transform.quality})`
      : n.source === 'manual'
        ? `manual ${((c?.manualNorthDeg ?? 0) % 360 + 360) % 360}°`
        : 'not set — plan up = north';
    const cell = (code: Anchor, glyph: string) => html`
      <button title=${'Anchor ' + code}
              style="padding:4px 0;font-size:13px;border-radius:3px;cursor:pointer;
                     background:${cur === code && !hasCustom ? 'var(--accent)' : '#1c2733'};
                     border:1px solid #33465a;color:var(--text)"
              @click=${() => set(x => { x.anchor = code; x.custom = undefined; })}>${glyph}</button>`;
    return html`
      <div style="border-top:1px solid var(--border);margin:10px 0 0;padding-top:8px">
        <div class="row"><label>Compass</label></div>
        <div class="row"><label>Show compass</label>
          <input type="checkbox" .checked=${c?.show === true}
                 @change=${(e: Event) => set(x => { x.show = (e.target as HTMLInputElement).checked; })}>
        </div>
        <div class="row"><label>North source</label>
          <select .value=${c?.source ?? 'auto'}
                  @change=${(e: Event) => set(x => {
                    x.source = (e.target as HTMLSelectElement).value as 'auto' | 'manual';
                  })}>
            <option value="auto">Auto (landmarks)</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div class="row" style="opacity:${(c?.source ?? 'auto') === 'auto' && hasFit ? 0.5 : 1}">
          <label title="Compass bearing (° CW from true north) that plan-up (+Y) faces — the same convention as the GPS/Geo north setting">
            Manual bearing (°)</label>
          <input type="number" min="0" max="359.9" step="0.1" style="width:70px;text-align:right"
                 .value=${String(c?.manualNorthDeg ?? '')}
                 @change=${(e: Event) => {
                   const v = parseFloat((e.target as HTMLInputElement).value);
                   set(x => { x.manualNorthDeg = isFinite(v) ? ((v % 360) + 360) % 360 : undefined; });
                 }}>
        </div>
        ${(c?.source ?? 'auto') === 'auto' && hasFit ? html`
          <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:0 0 4px">
            Landmark calibration is active — the manual bearing is only a fallback.
          </div>` : nothing}
        <div style="font-size:11px;padding:4px 8px;margin:2px 0 6px;
                    background:rgba(0,0,0,0.25);border-radius:4px">${status}</div>
        <div style="font-size:11px;margin-bottom:2px">Anchor</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin-bottom:6px">
          ${cell('tl', '↖')}${cell('tm', '↑')}${cell('tr', '↗')}
          ${cell('bl', '↙')}${cell('bm', '↓')}${cell('br', '↘')}
        </div>
        <div class="row" style="gap:6px;margin-bottom:2px">
          <span style="font-size:11px">Custom offset (px)</span>
          <span style="color:var(--text-dim);font-size:11px">x</span>
          <input type="number" style="width:56px" .value=${String(c?.custom?.x ?? '')}
                 @change=${(e: Event) => {
                   const v = Math.round(Number((e.target as HTMLInputElement).value));
                   set(x => { x.custom = { x: isFinite(v) ? v : 0, y: x.custom?.y ?? 0 }; });
                 }}>
          <span style="color:var(--text-dim);font-size:11px">y</span>
          <input type="number" style="width:56px" .value=${String(c?.custom?.y ?? '')}
                 @change=${(e: Event) => {
                   const v = Math.round(Number((e.target as HTMLInputElement).value));
                   set(x => { x.custom = { x: x.custom?.x ?? 0, y: isFinite(v) ? v : 0 }; });
                 }}>
          ${hasCustom ? html`<button class="btn" style="font-size:10px;padding:2px 6px"
                 @click=${() => set(x => { x.custom = undefined; })}>Clear</button>` : nothing}
        </div>
        <div class="row"><label title="A small circled arrow + N just off the floor edge, in both 2D and 3D, where true north exits the plan">
          Show north icon on plan</label>
          <input type="checkbox" .checked=${c?.showNorthMarker === true}
                 @change=${(e: Event) => set(x => { x.showNorthMarker = (e.target as HTMLInputElement).checked; })}>
        </div>
        <div class="row" title="North-icon size multiplier (0.5–4×)" style=${c?.showNorthMarker === true ? '' : 'opacity:0.5'}>
          <label>North icon size</label>
          <input type="number" min="0.5" max="4" step="0.1" style="width:64px"
                 ?disabled=${c?.showNorthMarker !== true}
                 .value=${String(c?.markerScale ?? 1)}
                 @change=${(e: Event) => {
                   const v = Number((e.target as HTMLInputElement).value);
                   set(x => { x.markerScale = isFinite(v) ? Math.max(0.5, Math.min(4, v)) : 1; });
                 }}>
        </div>
      </div>`;
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

  // ── Background text (playful skywriting / banner plane / ground writing) ──
  private _bgTextBlock() {
    const p = this.planner;
    const list: BgTextEntry[] = p.store.bgTexts ?? [];
    const upd = (mut: () => void) => {
      p.store.bgTexts ??= [];
      mut(); p.save(); p.emitConfig(); this.requestUpdate();
    };
    const modes: Array<[BgTextEntryMode, string]> = [
      ['sky', 'Skywriting (sky)'], ['banner', 'Banner plane'],
      ['grass', 'Ground writing'], ['train', 'Message train'], ['chopper', 'News chopper'],
    ];
    // The eight flight archetypes (src/aircraft-types.ts) a banner entry can
    // tow its message with, plus the classic toy plane. Listed here as plain
    // strings — aircraft-types.ts exports the union TYPE and the designator
    // table, not a runtime list, and the renderer re-validates anyway.
    const AIRCRAFT: Array<[string, string]> = [
      ['', 'Classic tow plane'],
      ['ga-high', 'Light single, high wing (Cessna)'],
      ['ga-low', 'Light single, low wing (Cirrus)'],
      ['twin-prop', 'Twin prop (King Air)'],
      ['turboprop', 'Regional turboprop (ATR / Dash 8)'],
      ['narrowbody', 'Airliner — narrowbody (737 / A320)'],
      ['widebody', 'Airliner — widebody (747 / 777)'],
      ['bizjet', 'Business jet (Learjet / CRJ)'],
      ['heli', 'Helicopter'],
    ];
    // Resolved strings (per entry, in list order) for the live preview.
    const resolved = new Map(p.bgTextsResolved().map(r => [r.id, r.text]));
    const row = (e: BgTextEntry, idx: number) => {
      const cur = resolved.get(e.id);
      return html`
        <div style="border:1px solid var(--border);border-radius:6px;padding:6px 8px;margin:0 0 6px">
          <div class="row">
            <select .value=${e.mode}
                    @change=${(ev: Event) => upd(() => { e.mode = (ev.target as HTMLSelectElement).value as BgTextEntryMode; })}>
              ${modes.map(([v, l]) => html`<option value=${v} ?selected=${e.mode === v}>${l}</option>`)}
            </select>
            <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:auto"
                    title="Delete this background text"
                    @click=${() => upd(() => { p.store.bgTexts!.splice(idx, 1); })}>🗑</button>
          </div>
          <div class="row" style="margin-top:4px"><label>Message</label>
            <input type="text" placeholder="e.g. Welcome home!" maxlength=${e.mode === 'grass' ? 160 : 40}
                   .value=${e.text ?? ''} ?disabled=${!!e.entityId}
                   style="flex:1;min-width:0"
                   @change=${(ev: Event) => upd(() => { e.text = (ev.target as HTMLInputElement).value; })}>
          </div>
          <div class="row" style="margin-top:2px"><label>Entity</label>
            <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;
                         text-overflow:ellipsis;white-space:nowrap">${e.entityId || '—'}</span>
            <button class="btn" style="font-size:10px;padding:2px 6px" @click=${() => {
              this.dispatchEvent(new CustomEvent('open-entity-picker', {
                bubbles: true, composed: true,
                detail: { onPick: (id: string) => upd(() => { e.entityId = id; }) },
              }));
            }}>🔗</button>
            ${e.entityId ? html`<button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                   title="Clear the bound entity (use the static message)"
                   @click=${() => upd(() => { e.entityId = undefined; })}>✕</button>` : nothing}
          </div>
          ${e.entityId ? html`
            <div class="row" style="margin-top:2px;gap:4px">
              <input type="text" placeholder="prefix" title="Text before the value (e.g. $)"
                     style="width:64px" .value=${e.format?.prefix ?? ''}
                     @change=${(ev: Event) => upd(() => {
                       (e.format ??= {}).prefix = (ev.target as HTMLInputElement).value || undefined;
                     })}>
              <input type="text" placeholder="suffix" title="Text after the value (e.g. ' left')"
                     style="width:64px" .value=${e.format?.suffix ?? ''}
                     @change=${(ev: Event) => upd(() => {
                       (e.format ??= {}).suffix = (ev.target as HTMLInputElement).value || undefined;
                     })}>
              <label style="font-size:10px;color:var(--text-dim);display:flex;align-items:center;gap:3px;margin-left:auto"
                     title="Append the entity's unit (for numeric values)">
                <input type="checkbox" .checked=${e.format?.showUnit !== false}
                       @change=${(ev: Event) => upd(() => {
                         (e.format ??= {}).showUnit = (ev.target as HTMLInputElement).checked;
                       })}> unit
              </label>
            </div>` : nothing}
          ${e.mode === 'train' ? html`
            <div class="row" style="margin-top:2px"><label title="Cap on the number of message cars">Max cars</label>
              <input type="number" min="2" max="12" step="1" style="width:64px"
                     .value=${String(e.maxCars ?? 8)}
                     @change=${(ev: Event) => upd(() => {
                       const v = Math.round(Number((ev.target as HTMLInputElement).value));
                       e.maxCars = isFinite(v) ? Math.min(12, Math.max(2, v)) : 8;
                     })}>
            </div>` : nothing}
          ${e.mode === 'banner' ? html`
            <div class="row" style="margin-top:2px">
              <label title="Which aircraft tows the banner. The eight silhouettes are the same models the live flight tracker builds — in civil paint, with no status beacons or registration lettering.">Aircraft</label>
              <select style="flex:1;min-width:0"
                      @change=${(ev: Event) => upd(() => {
                        const v = (ev.target as HTMLSelectElement).value;
                        e.aircraft = v || undefined;
                      })}>
                ${AIRCRAFT.map(([v, l]) => html`
                  <option value=${v} ?selected=${(e.aircraft ?? '') === v}>${l}</option>`)}
              </select>
            </div>` : nothing}
          <div class="row" style="margin-top:2px">
            <label title="Size multiplier for this entry's model (0.5–5, default 1). The flight path, train loop and text stay put — only the model gets bigger, which reads better from a zoomed-out camera.">Model size ×</label>
            <input type="number" min="0.5" max="5" step="0.1" style="width:64px"
                   .value=${String(e.scale ?? 1)}
                   @change=${(ev: Event) => upd(() => {
                     const v = Number((ev.target as HTMLInputElement).value);
                     const n = isFinite(v) && v > 0 ? Math.min(5, Math.max(0.5, v)) : 1;
                     e.scale = n === 1 ? undefined : n;
                   })}>
          </div>
          ${e.mode === 'grass' ? html`
            <div class="row" style="margin-top:2px">
              <label title="Constrain the writing to a ground area: the text is clipped to that area's real shape and painted through its own surface material (else auto-placed in the widest open yard margin). Ground areas are per-floor — a choice on another floor falls back to auto here.">Fit to area</label>
              <select style="flex:1;min-width:0"
                      @change=${(ev: Event) => upd(() => {
                        const v = (ev.target as HTMLSelectElement).value;
                        e.grassAreaId = v || undefined;
                      })}>
                <option value="" ?selected=${!e.grassAreaId}>Auto (yard margin)</option>
                ${(p.floor().groundAreas ?? []).map(a => html`
                  <option value=${a.id} ?selected=${e.grassAreaId === a.id}>${a.name || a.kind} area</option>`)}
              </select>
            </div>
            <div class="row" style="margin-top:2px">
              <label title="Keep the writing turned toward the camera so it always reads like a page on the floor (the default). Uncheck to pin it to a fixed rotation instead.">Follow camera</label>
              <input type="checkbox" .checked=${e.faceCamera !== false}
                     @change=${(ev: Event) => upd(() => {
                       // Re-checking clears BOTH fields — back to pristine, so the
                       // entry serializes exactly like one that never used this.
                       if ((ev.target as HTMLInputElement).checked) {
                         e.faceCamera = undefined; e.rotationDeg = undefined;
                       } else e.faceCamera = false;
                     })}>
            </div>
            ${e.faceCamera === false ? html`
              <div class="row" style="margin-top:2px">
                <label title="Fixed rotation of the writing, in degrees. 0° puts the top of the text toward the top of the 2D plan; increasing values turn it clockwise on screen.">Rotation (°)</label>
                <input type="number" step="5" style="width:72px" placeholder="0"
                       .value=${e.rotationDeg == null ? '' : String(e.rotationDeg)}
                       @change=${(ev: Event) => upd(() => {
                         // Blank clears to undefined (= 0°, the renderer's default);
                         // any finite number — including an explicit 0 — is stored
                         // as typed. Garbage clears rather than persisting a NaN.
                         const raw = (ev.target as HTMLInputElement).value.trim();
                         const v = Number(raw);
                         e.rotationDeg = raw === '' || !isFinite(v) ? undefined : v;
                       })}>
              </div>` : nothing}` : nothing}
          <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:3px 0 0">
            ${e.entityId
              ? html`Bound: the entity's state replaces the static message${cur
                  ? html` — currently "<span style="color:var(--text)">${cur}</span>"` : nothing}.`
              : 'Bind an entity (e.g. an input_text helper) to show its live value instead.'}
          </div>
        </div>`;
    };
    const newId = () => 'bt_' + Math.random().toString(36).slice(2, 9);
    return html`
      <div style="border-top:1px solid var(--border);margin:10px 0 0;padding-top:8px">
        <div class="row"><label title="Short playful messages written into the 3D world"
                                style="font-weight:600">Background text</label></div>
        ${list.length ? list.map((e, i) => row(e, i))
          : html`<div style="font-size:10px;color:var(--text-dim);margin:0 0 6px">
                   None. Add a skywriter, banner plane, ground message, message train, or news chopper.</div>`}
        <button class="btn" style="font-size:11px;padding:3px 8px" ?disabled=${list.length >= 6}
                @click=${() => upd(() => { p.store.bgTexts!.push({ id: newId(), mode: 'sky' }); })}>
          + Add${list.length >= 6 ? ' (max 6)' : ''}</button>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:4px 0 0">
          Up to 6. Skywriting / banner plane / news chopper hide during storms; ground writing + train stay.</div>
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
      ['sunPosition', 'True sun position'], ['sunDisc', 'Sun disc'],
      ['frost', 'Frost & icicles'],
      ['puddles', 'Rain puddles'], ['precipForecast', 'Forecast storm-brewing'],
    ];
    // sunPosition + sunDisc are lighting/sky behaviors, not effect-GROUP
    // members — the effects3d master never disables them, so they stay live.
    const dimmed = (k: WeatherEffectKey) =>
      !master && k !== 'sunPosition' && k !== 'sunDisc';
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

  // ── Floors block (Floor Plan tab) ───────────────────────────────────────
  // Floor LIFECYCLE lives here, not on the sidebar: adding / renaming /
  // resizing / deleting a floor is a rare, destructive, whole-plan operation
  // and does not belong next to the everyday floor SWITCHER. The sidebar's
  // "Floor tools" section keeps the per-floor knobs that ARE everyday work
  // (elevation, HA-floor bind, story order, visibility, rotate / move, 3D look).
  //
  // Rows are display-ordered (highest story first — floorsDisplayOrder), which
  // matches the sidebar picker. Name / W / D commit on `change` (blur or Enter)
  // through Planner.saveFloorEdit, i.e. one undo step per edit.
  private _floorsBlock() {
    const p = this.planner;
    const floors = p.store.floors;
    const only = floors.length <= 1;
    const commit = (f: Floor, name: string, w: number, d: number) =>
      p.saveFloorEdit(f.id, name.trim() || 'Floor', Math.max(1000, Math.round(w) || f.w),
                      Math.max(1000, Math.round(d) || f.d));
    return html`
      <h3 style="font-size:12px;margin:0 0 8px">Floors</h3>
      <div data-floors-block style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">
        ${floorsDisplayOrder(floors).map(f => html`
          <div data-floor-edit-row=${f.id}
               style="display:flex;align-items:center;gap:6px;padding:6px;border-radius:6px;
                      border:1px solid ${f.id === p.store.currentFloorId ? 'var(--accent)' : 'var(--border)'};
                      background:#111">
            <input type="text" data-floor-name-for=${f.id} .value=${f.name}
                   title="Floor name"
                   style="flex:1 1 auto;min-width:60px;padding:3px 5px;background:#0c0c14;
                          border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:12px"
                   @change=${(e: Event) => commit(f, (e.target as HTMLInputElement).value, f.w, f.d)}>
            <input type="number" data-floor-w-for=${f.id} min="1000" step="100" .value=${String(Math.round(f.w))}
                   title="Width (mm)"
                   style="width:74px;flex:0 0 auto;padding:3px 5px;background:#0c0c14;text-align:right;
                          border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:11px"
                   @change=${(e: Event) => commit(f, f.name, Number((e.target as HTMLInputElement).value), f.d)}>
            <span style="color:var(--text-dim);font-size:11px">×</span>
            <input type="number" data-floor-d-for=${f.id} min="1000" step="100" .value=${String(Math.round(f.d))}
                   title="Depth (mm)"
                   style="width:74px;flex:0 0 auto;padding:3px 5px;background:#0c0c14;text-align:right;
                          border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:11px"
                   @change=${(e: Event) => commit(f, f.name, f.w, Number((e.target as HTMLInputElement).value))}>
            <button class="btn danger" data-floor-del-for=${f.id} ?disabled=${only}
                    style="flex:0 0 auto;padding:3px 7px"
                    title=${only ? 'At least one floor is required' : `Delete "${f.name}"`}
                    @click=${() => this._deleteFloor(f)}>🗑</button>
          </div>`)}
      </div>
      <button class="btn" style="width:100%" data-add-floor
              title="Add a new floor above the current top story"
              @click=${this._addFloor}>+ Add floor</button>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:6px 0 14px">
        Sizes are in millimetres (the floor rect is <code>0 … W × 0 … D</code>). You can also
        drag the floor's edges directly on the 2D canvas. Story order, elevation, visibility
        and the rotate / move-plan nudges live in the sidebar's <strong>Floor tools</strong>.
      </div>
    `;
  }

  private _addFloor = () => {
    const p = this.planner;
    const base = p.floor();
    p.saveFloorEdit(null, `Floor ${p.store.floors.length + 1}`, base?.w ?? 8000, base?.d ?? 6000);
  };

  // Deleting a floor takes everything on it. Name the floor in the prompt so a
  // mis-click on the wrong row is obvious, and refuse the last floor outright
  // (deleteFloor guards this too — the button is also disabled).
  private _deleteFloor(f: Floor): void {
    const p = this.planner;
    if (p.store.floors.length <= 1) return;
    if (!confirm(`Delete floor "${f.name}" and everything on it? This cannot be undone.`)) return;
    p.deleteFloor(f.id);
  }

  // ── Floor Plan tab (Floors + Configurations + export/import) ────────────
  private _dataTab() {
    const p = this.planner;
    const configs = p.listConfigs();
    const activeId = p.activeConfigId;
    const savedAt = p.lastSavedAt;
    const only = configs.length <= 1;
    return html`
      ${this._floorsBlock()}
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
        <button class="btn" style="flex:1;min-width:80px" @click=${this._newConfig}>New…</button>
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

      <h3 style="font-size:12px;margin:14px 0 6px">Import Sweet Home 3D (.sh3d)</h3>
      <button class="btn" style="width:100%;margin-bottom:6px" ?disabled=${this._sh3dBusy}
              @click=${this._importSh3d}>${this._sh3dBusy ? 'Reading…' : 'Import .sh3d…'}</button>
      <label class="row" style="padding:0;margin-bottom:6px">
        <span style="color:var(--text-dim);font-size:11px;flex:1">Also import furniture (best-effort)</span>
        <span class="mini-toggle">
          <input type="checkbox" .checked=${this._sh3dImportFurniture}
                 @change=${(e: Event) => { this._sh3dImportFurniture = (e.target as HTMLInputElement).checked; }}>
          <span></span>
        </span>
      </label>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin-bottom:6px">
        Reads the native <code>.sh3d</code> file and builds real floors, walls,
        rooms, and doors/windows as a NEW configuration. This is the STRUCTURAL
        import — different from the visual OBJ model (3D Model sidebar section),
        which drops a decorative mesh onto the current floor.
      </div>
      ${this._sh3dWarnings.length ? html`
        <div style="border:1px solid #7a5a1a;background:#211a0d;border-radius:5px;padding:6px 8px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <strong style="font-size:11px;color:#ffca7a">Import warnings (${this._sh3dWarnings.length})</strong>
            <button class="btn" style="padding:1px 8px;font-size:11px"
                    @click=${() => { this._sh3dWarnings = []; }}>Dismiss</button>
          </div>
          <ul style="margin:0;padding-left:16px;font-size:10px;color:var(--text-dim);line-height:1.4;max-height:160px;overflow:auto">
            ${this._sh3dWarnings.map(w => html`<li>${w}</li>`)}
          </ul>
        </div>
      ` : nothing}

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
  private _newConfig = () => {
    const name = prompt('New configuration name:', 'Untitled');
    if (name == null) return;
    void this.planner.newConfig(name.trim() || 'Untitled');
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
  private _importSh3d = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.sh3d,application/octet-stream';
    inp.onchange = async () => {
      const file = inp.files?.[0]; if (!file) return;
      this._sh3dBusy = true;
      try {
        const { analyzeSh3dFile } = await import('../sh3d.js');
        const res = await analyzeSh3dFile(file, { importFurniture: this._sh3dImportFurniture });
        if (!res.ok || !res.floors || !res.counts) {
          alert('Import failed: ' + (res.error ?? 'unknown error'));
          return;
        }
        const c = res.counts;
        const summary =
          `${file.name}: ${c.levels} level${c.levels === 1 ? '' : 's'}, ${c.walls} walls, ` +
          `${c.rooms} rooms, ${c.openings} doors/windows` +
          (this._sh3dImportFurniture ? `, ${c.furniture} furniture (${c.furnitureSkipped} skipped)` : '') +
          `\n\nCreate as a new configuration?`;
        if (!confirm(summary)) return;
        const name = res.name || file.name.replace(/\.sh3d$/i, '') || 'Imported home';
        const out = await this.planner.importSh3dConfig(name, res.floors);
        if (!out.ok) { alert('Import failed: ' + (out.error ?? 'unknown error')); return; }
        this._sh3dWarnings = res.warnings ?? [];
      } catch (err) {
        alert('Import failed: ' + (err as Error).message);
      } finally {
        this._sh3dBusy = false;
      }
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
