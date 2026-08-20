import { LitElement, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from './define.js';
import { localToWorld, sensorColor } from '../geometry.js';
import {
  MAX_ZONE_VERTICES, deviceControlKind, semanticEntityIds,
  trimZoneVertices, padZoneVertices,
} from '../sensor-discovery.js';
import type { Planner } from '../planner.js';
import type { DiscoveredDevice, HassState, Sensor, Vec2, Zone } from '../types.js';

type Pane = 'targets' | 'zones' | 'objects' | 'device' | 'diag';

const PANES: Array<[Pane, string]> = [
  ['targets', 'Live targets'],
  ['zones', 'Zones'],
  ['objects', 'Objects'],
  ['device', 'Device settings'],
  ['diag', 'Diagnostics'],
];

const TARGET_COLORS = ['#4fc3f7', '#81c784', '#ffb74d'];
const OBJECT_ICONS = ['📍', '💺', '🖥', '🚪', '🛋', '🪑', '🛏', '📺', '🚿', '📦', '🪴', '🗑', '🖨', '🛒', '🚗', '🐕'];

// Screen-pixel grab radius for a vertex / halo handle on the sensor-local
// canvas. Generous — this is a tuning surface, often used on a tablet.
const HANDLE_PX = 9;
const GRAB_PX = 14;

/**
 * The mmWave TECHNICAL EDITOR — a large overlay panel for tuning ONE bound
 * mmWave sensor independently of the floor plan.
 *
 * Why it exists: zone drawing lives on the main 2D canvas at plan scale and
 * plan zoom, and the device's settings are five controls in a collapsed
 * sidebar sub-block. That is right for PLACING a sensor and wrong for TUNING
 * one, which wants a dense numeric readout, a sensor-local frame at its own
 * zoom, and every knob the device actually exposes — not just the ones a
 * regex predicted.
 *
 * Idiom: the established modal shape (light DOM, `planner` property,
 * `show(sensorId)` + `open`, mounted once in app.ts, opened by a CustomEvent),
 * registered through ./define.js. Live repaint follows <diorama-flight-modal>:
 * subscribe to BOTH planner channels and gate requestUpdate on `this.open`.
 * `live` carries target positions at push cadence; `config` carries settings
 * echoes. No polling loop — see the cadence note in Planner.targetPushStat.
 *
 * WRITE DISCIPLINE (load-bearing, see docs/DESIGN-mmwave.md §C):
 *  - Zone vertices are written on RELEASE, never during a drag: a write is 16
 *    sequential `number.set_value` calls with no debounce.
 *  - Every write is followed by `Planner.fenceZoneWrite`, so the firmware's
 *    partial echo cannot revert the shape that was just sent.
 *  - `Planner.mmwaveEditing` is held for the duration of any in-flight edit,
 *    because the whole slow-path zone/object resync is skipped only while a
 *    drag / zone-edit / this flag is set. Without it a firmware echo would
 *    silently overwrite an edit in progress.
 */
@customElement('diorama-mmwave-editor')
export class MmwaveEditor extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() open = false;
  @state() private _sensorId = '';
  @state() private _pane: Pane = 'targets';
  /** Which polygon the canvas is editing: null = none selected. */
  @state() private _zoneSel: { prefix: 'iz' | 'fz'; zi: number } | null = null;
  @state() private _objSel: number | null = null;
  /** px per mm on the sensor-local canvas. 0 = not yet fitted. */
  @state() private _zoom = 0;
  @state() private _pan: Vec2 = { x: 0, y: 0 };

  // In-flight canvas drag. `verts` is a LOCAL working copy — the store/device
  // only sees it on release.
  private _drag:
    | { kind: 'vert'; prefix: 'iz' | 'fz'; zi: number; vi: number; verts: Vec2[] }
    | { kind: 'halo'; oi: number }
    | { kind: 'pan'; startPx: Vec2; startPan: Vec2 }
    | null = null;

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
    this._releaseEditGate();
  }
  private _tick = () => { if (this.open) this.requestUpdate(); };

  show(sensorId: string): void {
    this._sensorId = String(sensorId ?? '');
    this._pane = 'targets';
    this._zoneSel = null;
    this._objSel = null;
    this._zoom = 0;                 // refit on next paint
    this._pan = { x: 0, y: 0 };
    this.open = true;
    // The generic device-entity enumeration reads the HA entity registry. The
    // battery scan owns that fetch and normally runs on connect; kick it in
    // case the editor is the first thing to need it.
    this.planner.ensureDeviceRegistry();
    const p = this.planner;
    const s = this._sensor();
    if (s) p.ensureLiveState(s.id);
  }

  private _close(): void {
    this._releaseEditGate();
    this.open = false;
  }

  /** Never leave the sync gate latched — a stuck gate freezes zone/object sync. */
  private _releaseEditGate(): void {
    if (this.planner) this.planner.mmwaveEditing = false;
    this._drag = null;
  }

  private _sensor(): Sensor | null {
    return this.planner.floor().sensors.find(x => x.id === this._sensorId) ?? null;
  }

  private _st(id: string | null | undefined): HassState | null {
    if (!id) return null;
    return this.planner.hass?.states?.[id] ?? null;
  }

  private _num(id: string | null | undefined): number | null {
    const st = this._st(id);
    if (!st) return null;
    const v = parseFloat(st.state);
    return isFinite(v) ? v : null;
  }

  private _unit(id: string | null | undefined): string {
    const u = this._st(id)?.attributes?.unit_of_measurement;
    return typeof u === 'string' ? u : '';
  }

  // ── Render ────────────────────────────────────────────────────────────────
  override render() {
    if (!this.open) return nothing;
    const p = this.planner;
    const s = this._sensor();
    if (!s) return nothing;
    const d: DiscoveredDevice | undefined = p.discBy[s.id];

    return html`
      <div class="mmw-ov" @pointerdown=${(e: PointerEvent) => {
            if (e.target === e.currentTarget) this._close();
          }}>
        <div class="mmw-panel" @pointerdown=${(e: Event) => e.stopPropagation()}>
          <div class="mmw-head">
            <div>
              <div class="mmw-title">mmWave technical editor</div>
              <div class="mmw-sub">
                ${s.label || 'Unnamed sensor'}
                ${s.deviceSlug
                  ? html` · <code>${s.deviceSlug}</code>`
                  : html` · <span style="color:#ffab40">no HA device bound</span>`}
              </div>
            </div>
            <button class="mmw-x" title="Close" @click=${this._close}>✕</button>
          </div>
          <div class="mmw-tabs">
            ${PANES.map(([id, label]) => html`
              <button class="mmw-tab ${this._pane === id ? 'on' : ''}"
                      data-pane=${id}
                      @click=${() => { this._pane = id; }}>${label}</button>`)}
          </div>
          <div class="mmw-body">
            ${!s.deviceSlug ? this._unboundNote()
              : !d ? this._loadingNote(s)
              : this._pane === 'targets' ? this._targetsPane(s, d)
              : this._pane === 'zones' ? this._zonesPane(s, d)
              : this._pane === 'objects' ? this._objectsPane(s, d)
              : this._pane === 'device' ? this._devicePane(s, d)
              : this._diagPane(s, d)}
          </div>
        </div>
      </div>
    `;
  }

  private _unboundNote() {
    return html`<div class="mmw-empty">
      This sensor has no HA device bound. Bind one in the sidebar's
      <strong>mmWave Sensors</strong> section — the technical editor reads
      everything from the bound device.
    </div>`;
  }

  private _loadingNote(s: Sensor) {
    return html`<div class="mmw-empty">
      Waiting for entities from <code>${s.deviceSlug}</code>…
      ESPHome publishes entities incrementally on first connect.
    </div>`;
  }

  // ── Pane 1: live targets ──────────────────────────────────────────────────
  private _targetsPane(s: Sensor, d: DiscoveredDevice) {
    const p = this.planner;
    p.ensureLiveState(s.id);
    const lerp = p.lerpBy[s.id] ?? [];
    return html`
      <div class="mmw-note">
        <strong>Raw</strong> is what the device reported — never eased, never
        room-clamped. <strong>Eased</strong> is the spring-smoothed position the
        dots and avatars are drawn at. Diorama applies no rate limiting to
        either: the <em>rate</em> column is the device's own observed cadence.
      </div>
      <table class="mmw-tbl">
        <thead><tr>
          <th></th><th>State</th>
          <th>Raw X</th><th>Raw Y</th><th>Eased X</th><th>Eased Y</th>
          <th>Speed</th><th>Angle</th><th>Res.</th>
          <th>World X</th><th>World Y</th>
          <th>Rate</th><th>Age</th>
        </tr></thead>
        <tbody>
        ${[0, 1, 2].map(i => {
          const sl = lerp[i];
          const t = d.targets[i];
          const active = !!sl?.active;
          const stat = p.targetPushStat(s.id, i);
          const w = sl ? localToWorld(s, sl.tx, sl.ty) : null;
          const ang = this._num(t?.angle_id);
          const spd = this._num(t?.speed_id);
          const res = this._num(t?.resolution_id);
          return html`
            <tr class=${active ? '' : 'off'}>
              <td><span class="mmw-dot" style="background:${TARGET_COLORS[i]};
                        opacity:${active ? 1 : 0.25}"></span> T${i + 1}</td>
              <td>${active ? html`<span class="mmw-ok">active</span>` : 'idle'}</td>
              <td class="num">${active && sl ? Math.round(sl.tx) : '—'}</td>
              <td class="num">${active && sl ? Math.round(sl.ty) : '—'}</td>
              <td class="num dim">${active && sl ? Math.round(sl.cx) : '—'}</td>
              <td class="num dim">${active && sl ? Math.round(sl.cy) : '—'}</td>
              <td class="num">${spd != null ? `${spd}${this._unit(t?.speed_id)}` : '—'}</td>
              <td class="num">${ang != null ? `${ang}°` : '—'}</td>
              <td class="num">${res != null ? res : '—'}</td>
              <td class="num dim">${active && w ? Math.round(w.x) : '—'}</td>
              <td class="num dim">${active && w ? Math.round(w.y) : '—'}</td>
              <td class="num">${stat.hz != null ? `${stat.hz.toFixed(1)} Hz` : '—'}</td>
              <td class="num">${stat.ageMs != null ? `${(stat.ageMs / 1000).toFixed(1)} s` : '—'}</td>
            </tr>`;
        })}
        </tbody>
      </table>
      <div class="mmw-note dim">
        Angle and resolution come straight from the device and are shown
        nowhere else in Diorama. World X/Y is the raw report mapped through this
        sensor's plan position and heading (${Math.round(s.heading)}°).
      </div>
      <div class="mmw-note dim">
        The panel never throttles these values. If the rate looks low, the limit
        is on the device / ESPHome side (the ESPHome→HA batch delay is a
        firmware YAML setting and is not reachable from a browser panel). Any
        firmware update-interval control the device does expose will appear in
        <strong>Device settings</strong>.
      </div>
    `;
  }

  // ── Pane 2: zones ─────────────────────────────────────────────────────────
  private _zonesPane(s: Sensor, d: DiscoveredDevice) {
    const p = this.planner;
    p.ensureLiveState(s.id);
    const zones = p.zonesBy[s.id];
    const sel = this._zoneSel;
    const selZone = sel
      ? (sel.prefix === 'iz' ? zones.inclusion : zones.filter)[sel.zi]
      : null;
    return html`
      <div class="mmw-split">
        <div class="mmw-canvas-col">
          ${this._canvasBlock(s)}
        </div>
        <div class="mmw-side">
          <h4>Inclusion zones</h4>
          ${d.inclusionZoneSlugs.length === 0
            ? html`<div class="mmw-dim">none published</div>`
            : zones.inclusion.slice(0, d.inclusionZoneSlugs.length)
                .map((z, zi) => this._zoneRow(s, 'iz', zi, z, '#2196f3'))}
          <h4>Filter zones</h4>
          ${d.filterZoneSlugs.length === 0
            ? html`<div class="mmw-dim">none published</div>`
            : zones.filter.slice(0, d.filterZoneSlugs.length)
                .map((z, zi) => this._zoneRow(s, 'fz', zi, z, '#f44336'))}
          ${sel && selZone ? this._vertexTable(s, sel.prefix, sel.zi, selZone) : html`
            <div class="mmw-dim" style="margin-top:10px">
              Select a zone to edit its vertices — drag them on the canvas, or
              type exact millimetres below.
            </div>`}
        </div>
      </div>
    `;
  }

  private _zoneRow(s: Sensor, prefix: 'iz' | 'fz', zi: number, z: Zone, color: string) {
    const p = this.planner;
    const slug = (prefix === 'iz' ? p.discBy[s.id]?.inclusionZoneSlugs
                                  : p.discBy[s.id]?.filterZoneSlugs)?.[zi];
    const enId = slug ? `switch.${s.deviceSlug}_${slug}_enable` : null;
    const isSel = this._zoneSel?.prefix === prefix && this._zoneSel?.zi === zi;
    return html`
      <div class="mmw-row ${isSel ? 'sel' : ''}"
           data-zone-row="${prefix}${zi}"
           @click=${() => { this._zoneSel = isSel ? null : { prefix, zi }; this._objSel = null; }}>
        <span class="mmw-dot" style="background:${color};opacity:${z.enabled ? 1 : 0.3}"></span>
        <span class="mmw-row-name">${z.name}</span>
        <span class="mmw-dim">${z.vertices.length} v</span>
        <input type="checkbox" .checked=${z.enabled} title="Enable on device"
               @click=${(e: Event) => e.stopPropagation()}
               @change=${(e: Event) => p.setZoneEnabled(s, prefix, zi,
                 (e.target as HTMLInputElement).checked, enId)}>
      </div>`;
  }

  private _vertexTable(s: Sensor, prefix: 'iz' | 'fz', zi: number, z: Zone) {
    const p = this.planner;
    const verts = trimZoneVertices(z.vertices);
    const commit = (next: Vec2[]) => {
      // One write path for every mutation, so the firmware conventions (8 slots,
      // (0,0) sentinel past index 0) and the fence are applied exactly once.
      this._writeZone(s, prefix, zi, next);
    };
    return html`
      <h4 style="margin-top:12px">${z.name} — vertices
        <span class="mmw-dim">(${verts.length}/${MAX_ZONE_VERTICES})</span></h4>
      <table class="mmw-vtbl">
        <thead><tr><th>#</th><th>X mm</th><th>Y mm</th><th></th></tr></thead>
        <tbody>
        ${verts.map((v, vi) => html`
          <tr>
            <td class="dim">${vi + 1}</td>
            <td><input type="number" data-vx=${vi} .value=${String(Math.round(v.x))}
                       @change=${(e: Event) => {
                         const next = verts.map(q => ({ ...q }));
                         next[vi].x = parseFloat((e.target as HTMLInputElement).value) || 0;
                         commit(next);
                       }}></td>
            <td><input type="number" data-vy=${vi} .value=${String(Math.round(v.y))}
                       @change=${(e: Event) => {
                         const next = verts.map(q => ({ ...q }));
                         next[vi].y = parseFloat((e.target as HTMLInputElement).value) || 0;
                         commit(next);
                       }}></td>
            <td><button class="mmw-mini" title="Remove vertex"
                        ?disabled=${verts.length <= 3}
                        @click=${() => {
                          const next = verts.filter((_, k) => k !== vi).map(q => ({ ...q }));
                          commit(next);
                        }}>✕</button></td>
          </tr>`)}
        </tbody>
      </table>
      <div class="mmw-btnrow">
        <button class="mmw-btn" data-add-vertex
                ?disabled=${verts.length >= MAX_ZONE_VERTICES}
                @click=${() => commit(this._appendVertex(s, verts))}>+ Vertex</button>
        <button class="mmw-btn danger"
                @click=${() => { if (confirm('Clear all vertices for this zone?')) commit([]); }}>
          Clear</button>
      </div>
      <div class="mmw-dim" style="margin-top:4px">
        The device stores ${MAX_ZONE_VERTICES} vertex slots and treats a (0,0)
        past the first as "polygon ends here"; unused slots are written as
        (0,0) so shrinking a polygon really clears the tail.
      </div>
    `;
  }

  /** A fresh vertex placed just outside the current shape (or a default box). */
  private _appendVertex(s: Sensor, verts: readonly Vec2[]): Vec2[] {
    const out = verts.map(v => ({ ...v }));
    if (out.length === 0) {
      const r = Math.max(500, Math.round((s.range || 6000) * 0.25));
      return [{ x: -r, y: r }, { x: r, y: r }, { x: r, y: r * 2 }];
    }
    const last = out[out.length - 1];
    const first = out[0];
    out.push({ x: Math.round((last.x + first.x) / 2) || last.x + 200,
               y: Math.round((last.y + first.y) / 2) || last.y + 200 });
    return out;
  }

  /**
   * The ONE zone write path. Applies the firmware conventions, updates the
   * runtime polygon, pushes the 16 `number.set_value` calls, and fences the
   * zone so the partial echo cannot revert it.
   */
  private _writeZone(s: Sensor, prefix: 'iz' | 'fz', zi: number, verts: readonly Vec2[]): void {
    const p = this.planner;
    const padded = padZoneVertices(verts);
    p.fenceZoneWrite(s.id, prefix, zi);
    p.saveAllZoneVertices(s, prefix, zi, padded);
  }

  // ── Pane 3: objects ───────────────────────────────────────────────────────
  private _objectsPane(s: Sensor, d: DiscoveredDevice) {
    const p = this.planner;
    p.ensureLiveState(s.id);
    const objs = p.objectsBy[s.id];
    const sel = this._objSel;
    return html`
      <div class="mmw-split">
        <div class="mmw-canvas-col">${this._canvasBlock(s)}</div>
        <div class="mmw-side">
          <h4>Object halos</h4>
          ${d.objectSlugs.length === 0
            ? html`<div class="mmw-dim">none published</div>`
            : objs.slice(0, d.objectSlugs.length).map((o, oi) => {
                const slug = d.objectSlugs[oi];
                const enId = slug ? `switch.${s.deviceSlug}_${slug}_halo_enable` : null;
                const isSel = sel === oi;
                return html`
                  <div class="mmw-row ${isSel ? 'sel' : ''}" data-obj-row=${oi}
                       @click=${() => { this._objSel = isSel ? null : oi; this._zoneSel = null; }}>
                    <span style="opacity:${o.enabled ? 1 : 0.35}">${o.icon}</span>
                    <span class="mmw-row-name">${o.name}</span>
                    <span class="mmw-dim">${o.occupied ? 'occupied' : ''}</span>
                    <input type="checkbox" .checked=${o.enabled}
                           @click=${(e: Event) => e.stopPropagation()}
                           @change=${(e: Event) => p.setObjectEnabled(s, oi,
                             (e.target as HTMLInputElement).checked, enId)}>
                  </div>`;
              })}
          ${sel != null && objs[sel] ? html`
            <h4 style="margin-top:12px">${objs[sel].name}</h4>
            <div class="mmw-grid2">
              ${(['x', 'y', 'radius'] as const).map(field => html`
                <label>${field === 'radius' ? 'Radius (mm)' : `${field.toUpperCase()} (mm)`}</label>
                <input type="number" data-obj-${field} .value=${String(Math.round(objs[sel][field]))}
                       @change=${(e: Event) => {
                         const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                         p.fenceObjectWrite(s.id, sel);
                         p.saveObjectField(s, sel, field, v);
                         p.emitConfig();
                       }}>`)}
            </div>
            <div class="mmw-dim" style="margin:6px 0 3px">Icon</div>
            <div class="mmw-icons">
              ${OBJECT_ICONS.map(icon => html`
                <button class="mmw-icon ${objs[sel].icon === icon ? 'on' : ''}"
                        @click=${() => { objs[sel].icon = icon; p.save(); p.emitConfig(); }}>${icon}</button>`)}
            </div>
            <div class="mmw-dim" style="margin-top:6px">
              Drag the halo on the canvas to reposition it.
            </div>` : html`
            <div class="mmw-dim" style="margin-top:10px">Select an object to edit it.</div>`}
        </div>
      </div>
    `;
  }

  // ── Pane 4: device settings ───────────────────────────────────────────────
  private _devicePane(s: Sensor, d: DiscoveredDevice) {
    const p = this.planner;
    const known: Array<[string, string | null]> = [
      ['Sensor height', d.sensorHeight],
      ['Mount angle', d.mountAngle],
      ['Ghostbuster', d.ghostbuster],
      ['Multi-target tracking', d.multiTarget],
      ['Mounted upside down', d.upsideDown],
    ];
    const semantic = semanticEntityIds(d);
    const all = p.mmwaveDeviceEntities(s);
    const extra = all.filter(id => !semantic.has(id));
    return html`
      <h4>Known controls</h4>
      <div class="mmw-ctrls">
        ${known.map(([label, id]) => id && this._st(id)
          ? this._controlRow(id, label)
          : html`<div class="mmw-ctrl"><span class="mmw-ctrl-label">${label}</span>
                   <span class="mmw-dim">not published</span></div>`)}
      </div>
      <h4 style="margin-top:16px">
        Everything else this device exposes
        <span class="mmw-dim">(${extra.length})</span>
      </h4>
      <div class="mmw-note dim">
        Enumerated from the HA device registry rather than from Diorama's
        naming patterns, so controls the patterns never predicted — a mode
        <code>select</code>, a restart <code>button</code>, a firmware-version
        readout — are reachable here. Rendered by domain.
      </div>
      ${extra.length === 0
        ? html`<div class="mmw-dim">
            Nothing beyond the entities Diorama already understands.
            ${all.length === 0 ? html`<br>(The HA entity registry has not
              resolved this device yet.)` : nothing}
          </div>`
        : html`<div class="mmw-ctrls" data-generic>
            ${extra.map(id => this._controlRow(id, p.entityLabel(id, s.deviceSlug)))}
          </div>`}
    `;
  }

  /** Render ONE entity by domain: number / switch / select / button / readout. */
  private _controlRow(entityId: string, label: string) {
    const p = this.planner;
    const st = this._st(entityId);
    const kind = deviceControlKind(entityId);
    const body = (() => {
      if (!st) return html`<span class="mmw-dim">unavailable</span>`;
      switch (kind) {
        case 'number': {
          const a = st.attributes as Record<string, unknown>;
          return html`<input type="number" data-ctrl-number=${entityId}
                             min=${(a.min as number) ?? nothing}
                             max=${(a.max as number) ?? nothing}
                             step=${(a.step as number) ?? nothing}
                             .value=${st.state}
                             @change=${(e: Event) => p.writeCoord(entityId,
                               parseFloat((e.target as HTMLInputElement).value) || 0)}>
                      <span class="mmw-unit">${this._unit(entityId)}</span>`;
        }
        case 'switch':
          return html`<input type="checkbox" data-ctrl-switch=${entityId}
                             .checked=${st.state === 'on'}
                             @change=${(e: Event) =>
                               p.setSwitchState(entityId, (e.target as HTMLInputElement).checked)}>`;
        case 'select': {
          const opts = Array.isArray(st.attributes?.options)
            ? (st.attributes.options as unknown[]).map(String) : [];
          return html`<select data-ctrl-select=${entityId}
                              @change=${(e: Event) =>
                                p.selectOption(entityId, (e.target as HTMLSelectElement).value)}>
            ${opts.length === 0 ? html`<option value=${st.state}>${st.state}</option>` : nothing}
            ${opts.map(o => html`<option value=${o} ?selected=${o === st.state}>${o}</option>`)}
          </select>`;
        }
        case 'button':
          return html`<button class="mmw-btn" data-ctrl-button=${entityId}
                              @click=${() => p.pressButton(entityId)}>Press</button>`;
        default:
          return html`<span class="mmw-val">${st.state}</span>
                      <span class="mmw-unit">${this._unit(entityId)}</span>`;
      }
    })();
    return html`
      <div class="mmw-ctrl" data-ctrl=${entityId}>
        <span class="mmw-ctrl-label" title=${entityId}>${label}</span>
        ${body}
        <code class="mmw-eid">${entityId}</code>
      </div>`;
  }

  // ── Pane 5: diagnostics ───────────────────────────────────────────────────
  private _diagPane(s: Sensor, d: DiscoveredDevice) {
    const p = this.planner;
    p.ensureLiveState(s.id);
    const zones = p.zonesBy[s.id];
    const proc = this._num(d.procTime);
    const warn = this._st(d.procWarn);
    const presence = this._st(d.hasTarget);
    const count = this._num(d.targetCount);
    const mount = this._num(d.mountAngle);
    return html`
      ${this._orientationBlock(s, d, mount)}
      <table class="mmw-tbl diag narrow">
        <tbody>
          ${this._diagRow('Presence', presence
            ? html`<span class=${presence.state === 'on' ? 'mmw-ok' : ''}>${presence.state}</span>`
            : null, d.hasTarget)}
          ${this._diagRow('Target count', count != null ? String(count) : null, d.targetCount)}
          ${this._diagRow('Radar processing time',
            proc != null ? `${proc} ${this._unit(d.procTime)}` : null, d.procTime)}
          ${this._diagRow('Processing too slow', warn
            ? html`<span class=${warn.state === 'on' ? 'mmw-bad' : 'mmw-ok'}>
                     ${warn.state === 'on' ? 'YES — device is behind' : 'no'}</span>`
            : null, d.procWarn)}
        </tbody>
      </table>
      <h4 style="margin-top:14px">Per-zone occupancy</h4>
      ${d.inclusionZoneSlugs.length === 0
        ? html`<div class="mmw-dim">no inclusion zones published</div>`
        : html`
        <table class="mmw-tbl narrow">
          <thead><tr><th>Zone</th><th>Targets</th><th>Still</th><th>Moving</th></tr></thead>
          <tbody>
            ${d.inclusionZoneSlugs.map((_slug, zi) => {
              const tc = this._num(d.zoneTargetCount[zi]);
              const sc = this._num(d.zoneStillCount[zi]);
              const mc = this._num(d.zoneMovingCount[zi]);
              return html`<tr data-zone-diag=${zi}>
                <td>${zones.inclusion[zi]?.name ?? `Zone ${zi + 1}`}</td>
                <td class="num">${tc != null ? tc : '—'}</td>
                <td class="num">${sc != null ? sc : '—'}</td>
                <td class="num">${mc != null ? mc : '—'}</td>
              </tr>`;
            })}
          </tbody>
        </table>
        <div class="mmw-note dim">
          Still and moving counts are published by the device and appear
          nowhere else in Diorama.
        </div>`}
      <h4 style="margin-top:14px">Observed report cadence</h4>
      <table class="mmw-tbl narrow">
        <thead><tr><th>Target</th><th>Rate</th><th>Age</th><th>Samples</th></tr></thead>
        <tbody>
          ${[0, 1, 2].map(i => {
            const stat = p.targetPushStat(s.id, i);
            return html`<tr>
              <td>T${i + 1}</td>
              <td class="num">${stat.hz != null ? `${stat.hz.toFixed(1)} Hz` : '—'}</td>
              <td class="num">${stat.ageMs != null ? `${(stat.ageMs / 1000).toFixed(1)} s` : '—'}</td>
              <td class="num">${stat.count}</td>
            </tr>`;
          })}
        </tbody>
      </table>
    `;
  }

  /**
   * Orientation: the plan yaw and the device's mounting-angle number, side by
   * side, each labelled with what it actually drives.
   *
   * These are DIFFERENT AXES and this block deliberately makes no claim that
   * they should match:
   *   • `Sensor.heading` rotates about the world Y axis (a plan yaw). It is
   *     the frame zone drawing maps through, and the 2D/3D body rotation.
   *   • `mount_angle` is the device's own published number, which Diorama's 3D
   *     pose applies as a downward TILT about the body's local X axis.
   * A sensor facing west with no downward tilt is heading 90 / mount_angle 0 —
   * a correct install. An equality check here would cry wolf on it.
   *
   * The audit's actual finding was that the two are DECOUPLED and the user has
   * no way to see both at once. Visibility is the deliverable.
   */
  private _orientationBlock(s: Sensor, d: DiscoveredDevice, mount: number | null) {
    return html`
      <h4>Orientation</h4>
      <div class="mmw-orient" data-orientation>
        <div class="mmw-orient-cell" data-orient-heading>
          <div class="mmw-orient-k">Plan heading <span class="mmw-dim">(Diorama)</span></div>
          <div class="mmw-orient-v">${Math.round(s.heading || 0)}°</div>
          <div class="mmw-orient-d">
            Yaw about the vertical axis. This is the frame the sensor-local zone
            and object coordinates are drawn in, and the rotation of the sensor
            body in both the 2D plan and the 3D scene. Edited in the sidebar.
          </div>
        </div>
        <div class="mmw-orient-cell" data-orient-mount>
          <div class="mmw-orient-k">Mount angle <span class="mmw-dim">(device)</span></div>
          <div class="mmw-orient-v">
            ${mount != null ? html`${mount}${this._unit(d.mountAngle)}`
                            : html`<span class="mmw-dim">not published</span>`}
          </div>
          <div class="mmw-orient-d">
            The device's own mounting-angle number. Diorama applies it as a
            downward tilt of the sensor body in the 3D scene. It does not affect
            zone drawing.
            ${d.mountAngle ? html`<br><code class="mmw-eid-inline">${d.mountAngle}</code>` : nothing}
          </div>
        </div>
      </div>
      <div class="mmw-note dim" data-orient-note>
        These are two independent values on two different axes — nothing keeps
        them in step, and they are <strong>not expected to match</strong>. Shown
        together because nothing else in Diorama shows both.
        The firmware's own interpretation of <code>mount_angle</code> is
        <strong>not verified in this repository</strong> (the ESPHome component
        lives out of tree), so the value is reported exactly as published rather
        than re-interpreted here.
      </div>
    `;
  }

  private _diagRow(label: string, value: unknown, entityId: string | null) {
    return html`<tr>
      <td style="width:190px">${label}</td>
      <td>${value ?? html`<span class="mmw-dim">not published</span>`}</td>
      <td><code class="mmw-eid">${entityId ?? ''}</code></td>
    </tr>`;
  }

  // ── Sensor-local canvas ───────────────────────────────────────────────────
  private _canvasBlock(s: Sensor) {
    return html`
      <div class="mmw-canvas-wrap">
        <canvas class="mmw-canvas"
                @pointerdown=${this._onDown}
                @pointermove=${this._onMove}
                @pointerup=${this._onUp}
                @pointercancel=${this._onUp}
                @wheel=${this._onWheel}></canvas>
        <div class="mmw-canvas-bar">
          <button class="mmw-mini" title="Zoom out" @click=${() => this._nudgeZoom(1 / 1.25)}>−</button>
          <button class="mmw-mini" title="Zoom in" @click=${() => this._nudgeZoom(1.25)}>+</button>
          <button class="mmw-mini" title="Fit to sensor range"
                  @click=${() => { this._zoom = 0; this._pan = { x: 0, y: 0 }; this.requestUpdate(); }}>Fit</button>
          <span class="mmw-dim">sensor-local mm · ${(this._zoom * 1000).toFixed(1)} px/m</span>
        </div>
      </div>`;
  }

  private _nudgeZoom(f: number): void {
    if (this._zoom > 0) this._zoom = Math.max(0.002, Math.min(0.4, this._zoom * f));
    this.requestUpdate();
  }

  private _onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this._nudgeZoom(e.deltaY < 0 ? 1.12 : 1 / 1.12);
  };

  private _canvas(): HTMLCanvasElement | null {
    return this.querySelector('canvas.mmw-canvas');
  }

  /** Screen-pixel origin of sensor-local (0,0) inside the canvas' CSS box. */
  private _originPx(cw: number, ch: number): Vec2 {
    return { x: cw / 2, y: ch * 0.88 };
  }

  private _toPx(l: Vec2, cw: number, ch: number): Vec2 {
    const o = this._originPx(cw, ch);
    return { x: o.x + (l.x - this._pan.x) * this._zoom,
             y: o.y - (l.y - this._pan.y) * this._zoom };
  }

  private _toLocal(px: Vec2, cw: number, ch: number): Vec2 {
    const o = this._originPx(cw, ch);
    return { x: (px.x - o.x) / this._zoom + this._pan.x,
             y: (o.y - px.y) / this._zoom + this._pan.y };
  }

  private _evPx(e: PointerEvent): Vec2 | null {
    const c = this._canvas();
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private _onDown = (e: PointerEvent) => {
    const c = this._canvas();
    const px = this._evPx(e);
    const s = this._sensor();
    if (!c || !px || !s || this._zoom <= 0) return;
    const cw = c.clientWidth, ch = c.clientHeight;
    const p = this.planner;

    // Vertex handles of the selected zone win first.
    const sel = this._zoneSel;
    if (sel) {
      const zones = p.zonesBy[s.id];
      const arr = sel.prefix === 'iz' ? zones.inclusion : zones.filter;
      const verts = trimZoneVertices(arr[sel.zi]?.vertices ?? []);
      for (let vi = 0; vi < verts.length; vi++) {
        const q = this._toPx(verts[vi], cw, ch);
        if (Math.hypot(q.x - px.x, q.y - px.y) <= GRAB_PX) {
          this._drag = { kind: 'vert', prefix: sel.prefix, zi: sel.zi, vi,
                         verts: verts.map(v => ({ ...v })) };
          // HOLD THE SYNC GATE: a firmware echo arriving now would otherwise
          // overwrite the polygon the user is dragging.
          p.mmwaveEditing = true;
          this._capture(c, e.pointerId);
          return;
        }
      }
    }
    // Then the selected halo's centre.
    if (this._objSel != null) {
      const o = p.objectsBy[s.id]?.[this._objSel];
      if (o) {
        const q = this._toPx({ x: o.x, y: o.y }, cw, ch);
        if (Math.hypot(q.x - px.x, q.y - px.y) <= GRAB_PX) {
          this._drag = { kind: 'halo', oi: this._objSel };
          p.mmwaveEditing = true;
          this._capture(c, e.pointerId);
          return;
        }
      }
    }
    // Otherwise pan. Pan is a VIEW change, not an edit — it must not latch the
    // sync gate (a user idly panning would freeze zone/object sync).
    this._drag = { kind: 'pan', startPx: px, startPan: { ...this._pan } };
    this._capture(c, e.pointerId);
  };

  // Pointer capture throws NotFoundError for a pointer id the browser has no
  // active record of (synthetic events in tests, a pointer already released).
  // Capture is an ergonomic nicety, never correctness — the drag state machine
  // works without it, so swallow the failure rather than aborting the drag.
  private _capture(c: HTMLCanvasElement, id: number): void {
    try { c.setPointerCapture(id); } catch { /* not a live pointer */ }
  }
  private _release(c: HTMLCanvasElement | null, id: number): void {
    try { c?.releasePointerCapture(id); } catch { /* never captured */ }
  }

  private _onMove = (e: PointerEvent) => {
    const dr = this._drag;
    if (!dr) return;
    const c = this._canvas();
    const px = this._evPx(e);
    const s = this._sensor();
    if (!c || !px || !s) return;
    const cw = c.clientWidth, ch = c.clientHeight;
    if (dr.kind === 'pan') {
      this._pan = { x: dr.startPan.x - (px.x - dr.startPx.x) / this._zoom,
                    y: dr.startPan.y + (px.y - dr.startPx.y) / this._zoom };
      this.requestUpdate();
      return;
    }
    const l = this._toLocal(px, cw, ch);
    if (dr.kind === 'vert') {
      // Local working copy only — NOTHING is written until release. A write is
      // 16 undebounced `number.set_value` calls; doing that per pointermove
      // would flood the device.
      dr.verts[dr.vi] = { x: Math.round(l.x), y: Math.round(l.y) };
      this.requestUpdate();
    } else {
      const o = this.planner.objectsBy[s.id]?.[dr.oi];
      if (o) { o.x = Math.round(l.x); o.y = Math.round(l.y); this.requestUpdate(); }
    }
  };

  private _onUp = (e: PointerEvent) => {
    const dr = this._drag;
    this._drag = null;
    const s = this._sensor();
    const p = this.planner;
    this._release(this._canvas(), e.pointerId);
    if (!dr || !s) { p.mmwaveEditing = false; return; }
    if (dr.kind === 'vert') {
      this._writeZone(s, dr.prefix, dr.zi, dr.verts);
    } else if (dr.kind === 'halo') {
      const o = p.objectsBy[s.id]?.[dr.oi];
      if (o) {
        p.fenceObjectWrite(s.id, dr.oi);
        p.saveObjectField(s, dr.oi, 'x', o.x);
        p.saveObjectField(s, dr.oi, 'y', o.y);
        p.emitConfig();
      }
    }
    // Release the gate LAST: everything above must complete while sync is
    // still blocked, or the very next echo could land between write and fence.
    p.mmwaveEditing = false;
    this.requestUpdate();
  };

  protected override updated(): void {
    if (!this.open) return;
    if (this._pane !== 'zones' && this._pane !== 'objects') return;
    this._paint();
  }

  private _paint(): void {
    const c = this._canvas();
    const s = this._sensor();
    if (!c || !s) return;
    const cw = c.clientWidth, ch = c.clientHeight;
    if (cw < 4 || ch < 4) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (c.width !== Math.round(cw * dpr) || c.height !== Math.round(ch * dpr)) {
      c.width = Math.round(cw * dpr);
      c.height = Math.round(ch * dpr);
    }
    if (this._zoom <= 0) {
      const range = Math.max(500, s.range || 6000);
      const o = this._originPx(cw, ch);
      this._zoom = Math.max(0.002, Math.min((o.y - 12) / range, (cw / 2 - 12) / range));
    }
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#0b0f14';
    ctx.fillRect(0, 0, cw, ch);
    const P = (l: Vec2) => this._toPx(l, cw, ch);
    const p = this.planner;

    // Range rings + FOV wedge, in the sensor's own frame.
    const range = Math.max(500, s.range || 6000);
    const half = ((s.fov || 60) / 2) * Math.PI / 180;
    const o0 = P({ x: 0, y: 0 });
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(o0.x, o0.y);
    for (let a = -half; a <= half + 1e-6; a += Math.PI / 90) {
      const q = P({ x: Math.sin(a) * range, y: Math.cos(a) * range });
      ctx.lineTo(q.x, q.y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(79,168,255,0.07)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(79,168,255,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    const ringStep = range <= 3000 ? 500 : range <= 8000 ? 1000 : 2000;
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.font = '10px sans-serif';
    for (let r = ringStep; r <= range; r += ringStep) {
      ctx.beginPath();
      for (let a = -half; a <= half + 1e-6; a += Math.PI / 90) {
        const q = P({ x: Math.sin(a) * r, y: Math.cos(a) * r });
        if (a === -half) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
      }
      ctx.stroke();
      const lab = P({ x: 0, y: r });
      ctx.fillText(`${(r / 1000).toFixed(1)} m`, lab.x + 4, lab.y - 3);
    }

    // Sensor body.
    ctx.fillStyle = sensorColor(s, p.floor().sensors.indexOf(s));
    ctx.beginPath();
    ctx.arc(o0.x, o0.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Polygons.
    const zones = p.zonesBy[s.id];
    if (zones) {
      const groups: Array<['iz' | 'fz', typeof zones.inclusion, string]> = [
        ['iz', zones.inclusion, '#2196f3'],
        ['fz', zones.filter, '#f44336'],
      ];
      for (const [prefix, arr, color] of groups) {
        for (let zi = 0; zi < arr.length; zi++) {
          const isSel = this._zoneSel?.prefix === prefix && this._zoneSel?.zi === zi;
          const dr = this._drag;
          const live = (dr && dr.kind === 'vert' && dr.prefix === prefix && dr.zi === zi)
            ? dr.verts : trimZoneVertices(arr[zi].vertices);
          if (live.length < 2) continue;
          ctx.beginPath();
          live.forEach((v, i) => {
            const q = P(v);
            if (i === 0) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
          });
          ctx.closePath();
          ctx.fillStyle = color + (isSel ? '33' : '18');
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.globalAlpha = arr[zi].enabled ? 1 : 0.4;
          ctx.lineWidth = isSel ? 2 : 1;
          ctx.setLineDash(arr[zi].enabled ? [] : [4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
          if (isSel) {
            for (const v of live) {
              const q = P(v);
              ctx.beginPath();
              ctx.arc(q.x, q.y, HANDLE_PX / 2, 0, Math.PI * 2);
              ctx.fillStyle = '#ffb74d';
              ctx.fill();
              ctx.strokeStyle = '#0b0f14';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          }
        }
      }
    }

    // Object halos.
    const objs = p.objectsBy[s.id] ?? [];
    const d = p.discBy[s.id];
    for (let oi = 0; oi < objs.length && oi < (d?.objectSlugs.length ?? 0); oi++) {
      const o = objs[oi];
      const q = P({ x: o.x, y: o.y });
      const rr = Math.max(2, o.radius * this._zoom);
      ctx.beginPath();
      ctx.arc(q.x, q.y, rr, 0, Math.PI * 2);
      ctx.fillStyle = o.occupied ? 'rgba(129,199,132,0.20)' : 'rgba(186,104,200,0.13)';
      ctx.fill();
      ctx.strokeStyle = this._objSel === oi ? '#ffb74d' : 'rgba(186,104,200,0.7)';
      ctx.lineWidth = this._objSel === oi ? 2 : 1;
      ctx.globalAlpha = o.enabled ? 1 : 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '12px sans-serif';
      ctx.fillText(o.icon, q.x - 6, q.y + 4);
    }

    // Live targets: RAW (hollow, un-eased truth) + EASED (filled).
    const lerp = p.lerpBy[s.id] ?? [];
    for (let i = 0; i < lerp.length; i++) {
      const sl = lerp[i];
      if (!sl.active) continue;
      const raw = P({ x: sl.tx, y: sl.ty });
      const eas = P({ x: sl.cx, y: sl.cy });
      ctx.strokeStyle = TARGET_COLORS[i];
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(raw.x, raw.y, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = TARGET_COLORS[i];
      ctx.beginPath();
      ctx.arc(eas.x, eas.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
