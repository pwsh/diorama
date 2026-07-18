import { LitElement, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from './define.js';
import { startZoneEdit } from '../canvas-interact.js';
import type { Planner, Tool } from '../planner.js';
import { NEW_ROOM, NEW_LANDMARK } from '../planner.js';
import { compass8, parseLatLon } from '../geo.js';
import type {
  Sensor, Zone, ObjectHalo, BgImage, MotionSensor, EnvSensor, EnvKind, Light, SwitchFixture, LightIconKind,
  Furniture, FurnitureKind, Door, Window as WindowType, WindowKind, Layers2D, Floor, Room,
  ObjectRecipe, RecipePrimitive, RecipeShape, ActivityKind, AvatarKind,
  BleProxy, AlarmPanel, CalendarPanel, ThermostatFixture, SafetySensor, AlertBeacon, RobotFixture, CameraFixture, ProjectorFixture, ValveFixture, PlugFixture, PresenceZone, GroundArea, GroundKind, VoidArea, DioramaPerson, Roamer, GeoLandmark,
} from '../types.js';
import type { BermudaDevice } from '../planner.js';
import { alertBeaconState, alertBeaconColor, isAlertDomain } from '../alerts.js';

import { listActivePacks } from '../avatars.js';
import {
  fmtLen,
  motionColor, motionIntensity, sensorColor, lightIconKind, MOTION_DEFAULTS,
  BLE_PROXY_DEFAULTS, bleProxyHeight,
  alarmHeight, alarmStateColor, calendarHeight, safetyColor,
  thermostatHeight, hvacModeColor,
  actionButtonKind, actionButtonColor, actionButtonIcon, actionButtonHeight, snapActionButtonToWall, actionLastFired,
  robotGlyph, robotColor, robotLedColor,
  parseVacuumPosition, solveVacuumDockOffset,
  presenceZoneColor, cameraFov, cameraRange, cameraHeight, CAMERA_DEFAULTS, cameraColor, slugifyFrigateName,
  projectorHeight, projectorThrow, projectorBeamColor, PROJECTOR_DEFAULTS,
  valveOpenness, valveFlowing, plugHeight,
  GROUND_KINDS, groundAreaColor,
  FURNITURE_KINDS, furnitureKind, resolveFurnitureDef, WINDOW_DEFAULTS,
  isDroopPlant, PLANT_MOISTURE_DEFAULT_THRESHOLD,
  ENV_KINDS, ENV_DEFAULTS, ENV_SCALE_MIN, ENV_SCALE_MAX,
  envKindOf, envColor, envValueText, envHeight, envScale,
  INFO_CARD_MOUNT_DEFAULTS, INFO_CARD_SCALE_MIN, INFO_CARD_SCALE_MAX,
  infoCardText, infoCardMount, infoCardHeight, infoCardW, infoCardH, infoCardScale,
  furnitureCat, type FurnitureCat, isBinKind, isVehicleKind, isStairsKind,
  closedWallLoops, loopContaining, resolveRoomForPointFuzzy, roomLabel,
} from '../geometry.js';
import { solveHomography, homographyResidualsMm } from '../homography.js';
import { CLOCK_PRESETS, DATE_PRESETS, type ValueRule, type RuleOp } from '../value-rules.js';
import type { Vec2, InfoCard, InfoCardMount, InfoCardDisplayMode, ActionButton, ActionKind } from '../types.js';

// Compact relative-age label for a GPS fix timestamp (ms epoch).
function gpsAgeText(ts: number): string {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return `${Math.round(s)}s ago`;
  const m = s / 60;
  if (m < 60) return `${Math.round(m)} min ago`;
  const h = m / 60;
  if (h < 24) return `${Math.round(h)} h ago`;
  return `${Math.round(h / 24)} d ago`;
}
// Zone → glyph for GPS status lines (indoor lost-device / yard / clamped-beyond).
function gpsZoneGlyph(zone: 'indoor' | 'yard' | 'beyond'): string {
  return zone === 'indoor' ? '🏠' : zone === 'yard' ? '🌳' : '🧭';
}
import { saveModel, deleteModel } from '../model-store.js';
import { newId } from '../storage.js';

const LIGHT_KINDS: { id: LightIconKind; label: string; glyph: string }[] = [
  { id: 'bulb',      label: 'Bulb',      glyph: '💡' },
  { id: 'spot',      label: 'Spot',      glyph: '🔦' },
  { id: 'pendant',   label: 'Pendant',   glyph: '⚪' },
  { id: 'sconce',    label: 'Sconce',    glyph: '◐' },
  { id: 'strip',     label: 'Strip',     glyph: '▬' },
  { id: 'fireplace', label: 'Fireplace', glyph: '🔥' },
  { id: 'lamp',      label: 'Lamp',      glyph: '🪔' },
  { id: 'bowl',      label: 'Bowl',      glyph: '🥣' },
  { id: 'tiered',    label: 'Tiered',    glyph: '☰' },
  { id: 'round',     label: 'Round',     glyph: '⭕' },
  { id: 'recessed',  label: 'Recessed',  glyph: '⊙' },
  { id: 'jar',       label: 'Jar',       glyph: '🫙' },
  { id: 'oval',      label: 'Oval',      glyph: '🥚' },
  { id: 'fan',       label: 'Ceiling fan',  glyph: '❋' },
  { id: 'fan_light', label: 'Fan + light',  glyph: '✺' },
  { id: 'string',    label: 'LED string',   glyph: '✨' },
  { id: 'under_cabinet', label: 'Under-cabinet strip', glyph: '▂' },
  { id: 'wall_sconce', label: 'Wall sconce (up/down)', glyph: '◨' },
  { id: 'step',        label: 'Step light',            glyph: '▤' },
  { id: 'flood',       label: 'Floodlight',            glyph: '🔆' },
];

const WINDOW_KINDS: { id: WindowKind; label: string }[] = [
  { id: 'single',        label: 'Single pane' },
  { id: 'double_hung',   label: 'Double-hung' },
  { id: 'casement_pair', label: 'Casement pair' },
  { id: 'sliding',       label: 'Sliding' },
  { id: 'picture',       label: 'Picture (fixed)' },
];

const TOOLS: { id: Tool; label: string }[] = [
  { id: 'select', label: 'Select' },
  { id: 'wall', label: 'Wall' },
  { id: 'sensor', label: 'mmWave' },
  { id: 'motion', label: 'Motion' },
  { id: 'env', label: 'Env' },
  { id: 'infocard', label: '🔢 Info' },
  { id: 'action', label: '🔘 Action' },
  { id: 'bleproxy', label: 'BLE' },
  { id: 'alarm', label: '🚨 Alarm' },
  { id: 'calendar', label: '📅 Calendar' },
  { id: 'thermostat', label: '🌡 Thermostat' },
  { id: 'safety', label: '⚠️ Safety/Siren' },
  { id: 'alertbeacon', label: '🔔 Alert beacon' },
  { id: 'robot', label: '🤖 Robot' },
  { id: 'camera', label: '📷 Camera' },
  { id: 'projector', label: '📽 Projector' },
  { id: 'valve', label: '🚰 Valve' },
  { id: 'plug', label: '🔌 Plug' },
  { id: 'pzone', label: '▱ Presence zone' },
  { id: 'ground', label: '▨ Ground area' },
  { id: 'void', label: '🕳 Floor void' },
  { id: 'furniture', label: 'Furn' },
  { id: 'light', label: 'Light' },
  { id: 'switch', label: 'Switch' },
  { id: 'door', label: 'Door' },
  { id: 'window', label: 'Window' },
  { id: 'delete', label: 'Delete' },
];

@customElement('diorama-sidebar')
export class Sidebar extends LitElement {
  @property({ attribute: false }) planner!: Planner;
  @state() private _ = 0;
  @state() private _cfgOpen = false;

  // Collapsed sidebar sections + room-groups. DEVICE-LOCAL (not the HA store):
  // a JSON array of stable keys in localStorage. Absent from the set = expanded
  // (default). Section keys are the stable slugs assigned in `render`; room-group
  // keys are `<sectionSlug>/<roomId>` (the "— No room —" bucket uses `/none`).
  @state() private _collapsed = new Set<string>(this._loadCollapsed());

  private _loadCollapsed(): string[] {
    try {
      const raw = localStorage.getItem('diorama:sidebar:collapsed');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
    } catch { return []; }
  }
  private _persistCollapsed(): void {
    try { localStorage.setItem('diorama:sidebar:collapsed', JSON.stringify([...this._collapsed])); }
    catch { /* private mode / quota — collapse state is best-effort */ }
  }
  private _toggleCollapsed(key: string): void {
    if (this._collapsed.has(key)) this._collapsed.delete(key);
    else                          this._collapsed.add(key);
    this._persistCollapsed();
    this.requestUpdate();
  }

  // Collapsible section wrapper. `slug` is the stable persistence key. The body
  // is rendered through a thunk and only invoked while expanded, so a collapsed
  // section costs nothing; expanded sections always render through the same code
  // path, so Lit's surgical (config-channel) reconciliation is unaffected.
  private _section(
    slug: string, title: unknown, body: () => unknown,
    opts?: { style?: string; id?: string },
  ) {
    const collapsed = this._collapsed.has(slug);
    return html`
      <div class="section" style=${opts?.style ?? nothing} id=${opts?.id ?? nothing}>
        <h3 class="collapsible-header ${collapsed ? '' : 'open'}"
            style=${collapsed ? 'margin-bottom:0' : nothing}
            @click=${() => this._toggleCollapsed(slug)}>
          <span style="flex:1">${title}</span>
          <span class="collapse-arrow">▸</span>
        </h3>
        ${collapsed ? nothing : body()}
      </div>
    `;
  }

  // Per-room collapse header used inside room-grouped lists. `sectionSlug` scopes
  // the key so the same room name in two sections toggles independently.
  private _roomGroupKey(sectionSlug: string, roomId: string): string {
    return `${sectionSlug}/${roomId}`;
  }

  protected override createRenderRoot() { return this; }

  override connectedCallback(): void {
    super.connectedCallback();
    this.planner.addEventListener('config', this._tick);
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.planner.removeEventListener('config', this._tick);
    if (this._calibLiveTimer) { clearInterval(this._calibLiveTimer); this._calibLiveTimer = null; }
  }
  override updated(): void {
    // Start/stop the geo-calibration liveness ticker based on whether an active
    // session's card is currently visible (session running + section expanded).
    this._reconcileCalibLiveTimer();
  }
  private _tick = () => { this._++; };

  // Room-grouping cache: loops + sorted rooms are resolved once per render pass
  // (config-event driven, so cheap) and shared by every list section.
  private _rgToken = 0;
  private _rgCache: { token: number; loops: Vec2[][]; rooms: Room[] } | null = null;

  private _roomGroupsCtx(): { loops: Vec2[][]; rooms: Room[] } {
    if (this._rgCache && this._rgCache.token === this._rgToken) return this._rgCache;
    const f = this.planner.floor();
    const rooms = (f.rooms ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
    const loops = rooms.length ? closedWallLoops(f.walls ?? []) : [];
    this._rgCache = { token: this._rgToken, loops, rooms };
    return this._rgCache;
  }

  // Bucket placeable items by the named room whose wall loop contains (x, y).
  // Rooms come out in name order (see ctx); items in no room land in a trailing
  // "— No room —" bucket. When the floor has no rooms, everything stays in one
  // unlabelled bucket so sections render exactly as before.
  private _groupByRoom<T extends { x: number; y: number }>(items: T[]): { id: string; label: string; items: T[] }[] {
    const { loops, rooms } = this._roomGroupsCtx();
    if (rooms.length === 0) return items.length ? [{ id: '', label: '', items }] : [];
    const byId = new Map<string, T[]>();
    const none: T[] = [];
    for (const it of items) {
      // Fuzzy resolve so items flush ON a wall line (doors, windows,
      // wall-mounted switches / fireplaces) group into the room they touch
      // instead of falling into the "No room" bucket.
      const rm = resolveRoomForPointFuzzy(rooms, loops, it.x, it.y);
      if (rm) (byId.get(rm.id) ?? byId.set(rm.id, []).get(rm.id)!).push(it);
      else none.push(it);
    }
    const out: { id: string; label: string; items: T[] }[] = [];
    for (const rm of rooms) {                       // already name-sorted
      const arr = byId.get(rm.id);
      if (arr && arr.length) out.push({ id: rm.id, label: roomLabel(rm).text, items: arr });
    }
    if (none.length) out.push({ id: 'none', label: '— No room —', items: none });
    return out;
  }

  // Collapsible per-room group header. Plain (unlabelled) buckets — the no-rooms
  // case — render no header and no toggle. `key` scopes the collapse state.
  private _roomGroupHeader(label: string, key: string, collapsed: boolean) {
    return label
      ? html`<div class="collapsible-header"
                  style="font-size:10px;color:var(--text-dim);text-transform:uppercase;
                         letter-spacing:0.06em;padding:6px 0 2px;opacity:0.85"
                  @click=${() => this._toggleCollapsed(key)}>
                <span style="flex:1">${label}</span>
                <span class="collapse-arrow" style="transition:transform 0.15s;
                      ${collapsed ? '' : 'transform:rotate(90deg)'}">▸</span>
              </div>`
      : nothing;
  }

  // Render a flat item list bucketed by room (shared by every list section).
  // `sectionSlug` scopes the per-room-group collapse keys.
  private _groupedList<T extends { x: number; y: number }>(
    sectionSlug: string, items: T[], renderItem: (it: T) => unknown,
  ) {
    return this._groupByRoom(items).map(g => {
      const key = g.id ? this._roomGroupKey(sectionSlug, g.id) : '';
      const collapsed = !!key && this._collapsed.has(key);
      return html`
        ${this._roomGroupHeader(g.label, key, collapsed)}
        ${collapsed ? nothing : g.items.map(renderItem)}
      `;
    });
  }

  // Snapshot of the active/selected ids seen on the LAST render, so auto-expand
  // fires only on an activation CHANGE (not on every render). Persisted active
  // ids (e.g. activeSensorId) would otherwise re-expand a just-collapsed section
  // on the very next render, making it impossible to collapse while an item
  // stays selected.
  private _lastActiveSnapshot: Record<string, string | null> = {};

  // Auto-expand the section holding a freshly-activated item so its editor is
  // visible when the user picks it (e.g. clicking a sensor on canvas). Expands
  // only for ids that DIFFER from the previous render's snapshot, then records
  // the new snapshot. Only removes from the collapsed set — never forces closed.
  // Selecting an item still auto-expands; collapsing while it stays selected now
  // sticks (unchanged id → no expand). The mmWave detail editors are now inline
  // in the 'sensors' section, so only 'sensors' needs expanding for a sensor.
  private _autoExpandActive(): void {
    const p = this.planner;
    const expand = (slug: string) => { if (this._collapsed.delete(slug)) this._persistCollapsed(); };
    const cur: Record<string, string | null> = {
      sensors: p.store.activeSensorId ?? null,
      motion: p.activeMotionId ?? null,
      env: p.activeEnvId ?? null,
      ble: p.activeBleId ?? null,
      cameras: p.activeCameraId ?? null,
      pzones: p.activePZoneId ?? null,
      ground: p.activeGroundAreaId ?? null,
      voids: p.activeVoidAreaId ?? null,
      people: p.activePersonId ?? null,
      roamers: p.activeRoamerId ?? null,
      furniture: p.activeFurnitureId ?? null,
    };
    const snap = this._lastActiveSnapshot;
    for (const slug of Object.keys(cur)) {
      if (cur[slug] && cur[slug] !== snap[slug]) expand(slug);
    }
    this._lastActiveSnapshot = cur;
  }

  override render() {
    this._rgToken++;
    this._rgCache = null;
    this._autoExpandActive();
    const p = this.planner;
    const f = p.floor();
    return html`
      <div style="width:250px;flex-shrink:0;border-right:1px solid var(--border);
                  background:var(--surface);overflow-y:auto;overflow-x:hidden;
                  display:flex;flex-direction:column;height:100%;min-height:0">
        ${this._floorsSection()}
        ${this._section('tools', 'Tools', () => html`
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${TOOLS.map(t => html`
              <button class="btn ${p.tool === t.id ? 'active' : ''}"
                      @click=${() => p.setTool(t.id)}>${t.label}</button>
            `)}
          </div>
          <div style="color:var(--text-dim);font-size:10px;margin-top:6px;line-height:1.4">
            ${this._toolHint(p.tool)}
          </div>
          ${p.tool === 'wall' ? html`
            <div class="row" style="margin-top:6px">
              <label>Wall type</label>
              <select .value=${p.pendingWallKind}
                      @change=${(e: Event) => {
                        p.pendingWallKind =
                          (e.target as HTMLSelectElement).value as import('../types.js').WallKind;
                        this.requestUpdate();
                      }}>
                <option value="full">Full wall (9 ft)</option>
                <option value="half">Half wall</option>
                <option value="railing">Railing / banister (3 ft)</option>
                <option value="invisible">Invisible (floor boundary)</option>
              </select>
            </div>
          ` : nothing}
          ${p.tool === 'furniture' ? html`
            <div class="row" style="margin-top:6px">
              <label>Type</label>
              <select .value=${p.pendingCustomObjectId ? 'custom:' + p.pendingCustomObjectId : p.pendingFurnitureKind}
                      @change=${(e: Event) => {
                        const v = (e.target as HTMLSelectElement).value;
                        if (v.startsWith('custom:')) p.pendingCustomObjectId = v.slice(7);
                        else { p.pendingFurnitureKind = v as FurnitureKind; p.pendingCustomObjectId = null; }
                        this.requestUpdate();
                      }}>
                ${this._kindOptions(p.pendingCustomObjectId ? 'custom:' + p.pendingCustomObjectId : p.pendingFurnitureKind)}
              </select>
            </div>
          ` : nothing}
          ${p.floor().walls.length ? html`
            <div class="row" style="margin-top:6px">
              <label>Walls</label>
              <button class="btn" style="font-size:10px;padding:2px 6px;flex:1"
                      title="Toggle canvas lock for every wall on this floor"
                      @click=${() => {
                        const f = p.floor();
                        const lockAll = f.walls.some(w => !w.locked);
                        f.walls.forEach(w => { w.locked = lockAll; });
                        p.save(); p.emitConfig();
                      }}>
                ${p.floor().walls.every(w => w.locked) ? '🔓 Unlock all walls' : '🔒 Lock all walls'}
              </button>
            </div>
          ` : nothing}
        `)}

        ${this._section('sensors', 'mmWave Sensors on this floor', () => html`
          ${f.sensors.length === 0
            ? html`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
                No mmWave sensors yet — pick the mmWave tool and click the floor.
              </div>`
            : this._groupedList('sensors', f.sensors, s => this._sensorListItem(s))}
        `)}

        ${this._motionSensorsSection()}
        ${this._envSensorsSection()}
        ${this._infoCardsSection()}
        ${this._actionButtonsSection()}
        ${this._bleProxiesSection()}
        ${this._alarmPanelsSection()}
        ${this._calendarPanelsSection()}
        ${this._thermostatsSection()}
        ${this._safetySensorsSection()}
        ${this._alertBeaconsSection()}
        ${this._robotsSection()}
        ${this._camerasSection()}
        ${this._projectorsSection()}
        ${this._valvesSection()}
        ${this._plugsSection()}
        ${this._presenceZonesSection()}
        ${this._groundSection()}
        ${this._voidSection()}
        ${this._peopleSection()}
        ${this._roamersSection()}
        ${this._doorsSection()}
        ${this._windowsSection()}
        ${this._furnitureSection()}
        ${this._customObjectsSection()}
        ${this._roomsSection()}
        ${this._fixturesSection()}
        ${this._layers2dSection()}
        ${this._geoSection()}
        ${this._model3dSection()}
        ${this._bgSection()}
      </div>
    `;
  }

  // ── Floors section ────────────────────────────────────────────────────
  private _floorsSection() {
    const p = this.planner;
    const floors = p.store.floors;
    return this._section('floors', 'Floors', () => html`
        <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:6px">
          ${floors.map((f, i) => {
            const cur = f.id === p.store.currentFloorId;
            return html`
              <div style="display:flex;align-items:center;gap:3px;padding:5px 6px;border-radius:5px;
                          cursor:pointer;opacity:${f.disabled ? '0.5' : '1'};
                          background:${cur ? 'var(--accent)' : '#1a1a1a'};
                          border:1px solid ${cur ? 'var(--accent)' : 'var(--border)'}"
                   @click=${() => p.switchFloor(f.id)}>
                <span style="flex:1;min-width:0;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  ${f.name} — ${fmtLen(f.w, p.store.imperial)} × ${fmtLen(f.d, p.store.imperial)}${
                    f.disabled ? html`<span style="color:var(--text-dim)"> (disabled)</span>` : nothing}
                </span>
                <button class="btn btn-sm" title="Move floor up" ?disabled=${i === 0}
                        @click=${(e: Event) => { e.stopPropagation(); p.moveFloor(f.id, -1); }}>▲</button>
                <button class="btn btn-sm" title="Move floor down" ?disabled=${i === floors.length - 1}
                        @click=${(e: Event) => { e.stopPropagation(); p.moveFloor(f.id, 1); }}>▼</button>
                <button class="btn btn-sm"
                        title=${f.disabled
                          ? 'Enable this floor'
                          : 'Disable this floor — hidden from the kiosk/view floor picker, glass-house stack, and BLE floor solve; still editable here'}
                        @click=${(e: Event) => { e.stopPropagation(); p.setFloorDisabled(f.id, !f.disabled); }}>
                  ${f.disabled ? '🚫' : '👁'}
                </button>
              </div>`;
          })}
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn" style="flex:1" title="New floor" @click=${this._openNewFloor}>+ Floor</button>
          <button class="btn" title="Edit floor size / name" @click=${this._openEditFloor}>✎</button>
          <button class="btn danger" title="Delete current floor" @click=${this._delFloor}>🗑</button>
        </div>
        <label class="row" style="padding:0;margin-top:8px"
               title="Show all dimensions in feet / inches instead of millimetres">
          <span style="color:var(--text-dim);font-size:11px;flex:1">Imperial units</span>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${p.store.imperial}
                   @change=${(e: Event) => { p.store.imperial = (e.target as HTMLInputElement).checked; p.save(); p.emitConfig(); }}>
            <span></span>
          </span>
        </label>
        <label class="row" style="padding:0"
               title="Lock the canvas-layout / floor-size editing — hides the boundary drag anchors">
          <span style="color:var(--text-dim);font-size:11px;flex:1">🔒 Lock floor size</span>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${!!p.floor().boundsLocked}
                   @change=${(e: Event) => { p.floor().boundsLocked = (e.target as HTMLInputElement).checked || undefined; p.save(); p.emitConfig(); }}>
            <span></span>
          </span>
        </label>
        <details style="margin-top:8px">
          <summary style="cursor:pointer;font-size:11px;color:var(--text-dim);padding:2px 0">
            This floor's 3D look (overrides global)
          </summary>
          ${this._floorLookOverrides(p.store.scene3d ?? {})}
        </details>
    `);
  }

  private _openNewFloor = () => {
    this.dispatchEvent(new CustomEvent('open-floor-modal', {
      bubbles: true, composed: true, detail: { floor: null },
    }));
  };
  private _openEditFloor = () => {
    this.dispatchEvent(new CustomEvent('open-floor-modal', {
      bubbles: true, composed: true, detail: { floor: this.planner.floor() as Floor },
    }));
  };
  private _delFloor = () => {
    const p = this.planner;
    const f = p.floor();
    if (p.store.floors.length <= 1) { alert('At least one floor is required.'); return; }
    if (confirm('Export a backup before deleting?')) {
      const blob = new Blob([JSON.stringify(p.store, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `floor-plan-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
    if (!confirm(`Delete floor "${f.name}"? This cannot be undone.`)) return;
    p.deleteFloor(f.id);
  };

  // ── Tool hint ─────────────────────────────────────────────────────────
  private _toolHint(tool: Tool): string {
    switch (tool) {
      case 'wall': return 'Click to add vertices. Double-click to finish. (Tip: in Select mode, double-click a wall to cycle full → half → railing → invisible.)';
      case 'sensor': return 'Click the canvas to drop a mmWave positional sensor.';
      case 'motion': return 'Click to drop a binary motion sensor (PIR).';
      case 'env': return 'Click to drop an environmental sensor (temp, humidity, CO₂, …).';
      case 'infocard': return 'Click to drop an info card. Bind ANY entity to show its value, or switch to clock/date mode. Add value→color rules in the editor.';
      case 'action': return 'Click to drop an action button. Pick what it fires (script / scene / button / automation / toggle / custom service) in the editor. Clicking it fires the action.';
      case 'bleproxy': return 'Click to drop a BLE scanner (Bluetooth proxy) puck. Bind it to the physical proxy device.';
      case 'alarm': return 'Click to drop an alarm keypad. Bind to an alarm_control_panel entity.';
      case 'calendar': return 'Click to drop a wall calendar (snaps to a wall). Bind one or more calendar.* entities to show upcoming events.';
      case 'thermostat': return 'Click to drop a thermostat. Bind to a climate entity to control HVAC.';
      case 'safety': return 'Click to drop a ceiling safety detector or siren beacon. Set kind (smoke / CO / gas / leak / siren) + bind an entity.';
      case 'alertbeacon': return 'Click to drop a ceiling Alert Beacon. Bind an alert.* (or any binary_sensor) — it pulses red while active, steady amber when acknowledged.';
      case 'robot': return 'Click to place a robot dock. Set kind (vacuum / mower) + bind a vacuum.* or lawn_mower.* entity; mowers can bind a GPS tracker.';
      case 'camera': return 'Click to drop a camera. Drag the orange dot to aim it; bind a camera.* entity for the FOV tint + snapshot.';
      case 'projector': return 'Click to drop a ceiling projector. Pick a target screen (or set rotation) + bind a media_player/switch/light for the beam; click it to toggle projecting.';
      case 'valve': return 'Click to drop a water valve on a floor pipe. Bind a valve.* (open/close) or switch.* (irrigation zone) entity; clicking it opens/closes it. Water flows while open.';
      case 'plug': return 'Click to drop a smart plug / outlet (snaps to a wall). Bind a switch.*/light.* load + an optional power sensor; clicking it toggles the outlet.';
      case 'pzone': return 'Click to add polygon vertices; double-click (or Enter) to finish (≥3 pts). Bind a binary_sensor (FP2 zone / occupancy) — the zone glows when occupied. ESC cancels.';
      case 'ground': return 'Click to add polygon vertices; double-click (or Enter) to finish (3–20 pts). Paints a ground covering (grass/rock/water/…) under the plan. ESC cancels.';
      case 'void': return 'Click to add polygon vertices; double-click (or Enter) to finish (3–12 pts). Cuts a hole in the floor (stairwell / atrium) — avatars route around it unless a stair bridges it. ESC cancels.';
      case 'furniture': return 'Click to drop a 600 × 600 mm piece.';
      case 'light': return 'Click to drop a light. Bind via the active panel.';
      case 'switch': return 'Click to drop a switch. Bind via the active panel.';
      case 'door': return 'Click to drop a door (hinge at click). Drag the end to rotate; bind to a binary_sensor.';
      case 'window': return 'Click to drop a window (center at click). Drag an end to rotate; bind to a binary_sensor.';
      case 'delete': return 'Click anything to delete.';
      default: return 'Drag to move. Pull a corner/vertex to resize. Drag the orange dot to rotate.';
    }
  }

  // ── Sensor list ───────────────────────────────────────────────────────
  private _sensorListItem(s: Sensor) {
    const p = this.planner;
    const sel = p.store.activeSensorId === s.id;
    const bound = !!s.deviceSlug;
    // Selected sensor edits inline (matching the Motion section): the per-sensor
    // configuration editor and the HA-data (zones / objects / targets / sensor
    // config) blocks render as sub-blocks directly beneath the row.
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveSensor(s.id)}>
          <div class="dot"></div>
          <div class="nm">${s.label || 'Sensor'}${this._batteryText(p.discBy[s.id]?.hasTarget ?? p.discBy[s.id]?.targetCount ?? p.discBy[s.id]?.sensorHeight ?? null)}</div>
          <div class="badge ${bound ? 'bound' : ''}">${bound ? 'HA' : '—'}</div>
        </div>
        ${sel ? html`${this._activeSensorSection()}${this._haSections()}` : nothing}
      </div>
    `;
  }

  // Shared lock toggle row. Locked items can't be moved / rotated / resized /
  // deleted on the canvas — sidebar editing (including unlock) stays available.
  // Dim inline "🔋 N%" text for a bound fixture whose HA device has a battery
  // sibling (Planner.batteryFor). Red at/below 20 %. Empty when none. `forDevice`
  // resolves via the device id (BLE proxies) instead of an entity id.
  private _batteryText(entityId: string | null | undefined, forDevice = false) {
    const lvl = forDevice ? this.planner.batteryForDevice(entityId) : this.planner.batteryFor(entityId);
    if (lvl == null) return nothing;
    const low = lvl <= 20;
    return html`<span style="font-size:10px;margin-left:4px;color:${low ? '#ef5350' : 'var(--text-dim)'}">🔋 ${Math.round(lvl)}%</span>`;
  }

  private _lockRow(item: { locked?: boolean }) {
    const p = this.planner;
    return html`
      <div class="row"><label>Lock</label>
        <button class="btn" style="font-size:11px;flex:1"
                title="Locked items can't be moved, rotated, resized, or deleted on the canvas"
                @click=${() => { item.locked = !item.locked; p.save(); p.emitConfig(); }}>
          ${item.locked ? '🔒 Locked' : '🔓 Unlocked'}
        </button>
      </div>
    `;
  }

  // Shared avatar-pool checkbox grid (mmWave sensor + motion AI editors).
  // Checked kinds land in `avatarKinds` (each target stably hash-picks one);
  // the legacy single `avatarKind` is only READ (pre-checks its kind when the
  // list is unset) and cleared on any change — the new UI writes avatarKinds
  // exclusively. Nothing checked = default adult.
  private _avatarGrid(
    item: { avatarKind?: AvatarKind | 'random'; avatarKinds?: AvatarKind[] },
    upd: (mut: () => void) => void,
  ) {
    const legacy = item.avatarKind && item.avatarKind !== 'random'
      ? [item.avatarKind] : [];
    const checked = new Set<AvatarKind>(item.avatarKinds ?? legacy);
    const write = (set: Set<AvatarKind>) => upd(() => {
      item.avatarKinds = set.size ? [...set] : undefined;
      item.avatarKind = undefined;   // legacy single-pick superseded
    });
    const toggle = (k: AvatarKind) => {
      const s = new Set(checked);
      if (s.has(k)) s.delete(k); else s.add(k);
      write(s);
    };
    // One block per loaded+active pack (core first). Per-pack All/None scope so a
    // pack's members can be bulk-toggled without touching another pack's picks.
    const packs = listActivePacks();
    return html`
      <div class="row" title="3D character models for this sensor's targets. Check several — each person stably picks one. None checked = Adult.">
        <label>Avatars</label>
      </div>
      ${packs.map(({ def, members }) => {
        const ids = members.map(m => m.id);
        const setAll = () => write(new Set([...checked, ...ids]));
        const setNone = () => write(new Set([...checked].filter(k => !ids.includes(k))));
        return html`
          <div class="row" style="margin:2px 0 0">
            <label style="font-size:10px;opacity:0.8">${def.label}</label>
            <span style="flex:1;text-align:right;font-size:10px">
              <button class="btn" style="font-size:10px;padding:1px 6px" @click=${setAll}>All</button>
              <button class="btn" style="font-size:10px;padding:1px 6px;margin-left:4px" @click=${setNone}>None</button>
            </span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1px 6px;
                      background:rgba(0,0,0,0.2);border-radius:4px;padding:4px 6px;margin:2px 0 4px">
            ${members.map(m => html`
              <label style="display:flex;align-items:center;gap:4px;font-size:10px;
                            color:var(--text);cursor:pointer;white-space:nowrap;overflow:hidden">
                <input type="checkbox" style="margin:0;flex:none"
                       .checked=${checked.has(m.id)}
                       @change=${() => toggle(m.id)}>
                ${m.label}
              </label>
            `)}
          </div>
        `;
      })}
    `;
  }

  // Furniture kind options grouped by category. `selected` is either a
  // FurnitureKind or `custom:<recipeId>` for a custom object.
  private _kindOptions(selected: string) {
    const cats: { cat: FurnitureCat; label: string }[] = [
      { cat: 'furniture', label: 'Furniture' },
      { cat: 'appliance', label: 'Appliances' },
      { cat: 'bathroom', label: 'Bathroom' },
      { cat: 'outdoor', label: 'Outdoor' },
      { cat: 'theater', label: 'Home theater' },
      { cat: 'vehicle', label: 'Vehicle / garage' },
    ];
    const kinds = Object.keys(FURNITURE_KINDS) as FurnitureKind[];
    const custom = this.planner.store.customObjects ?? [];
    return html`
      ${cats.map(c => html`
        <optgroup label=${c.label}>
          ${kinds.filter(k => furnitureCat(FURNITURE_KINDS[k]) === c.cat).map(k => html`
            <option value=${k} ?selected=${selected === k}>${FURNITURE_KINDS[k].label}</option>`)}
        </optgroup>`)}
      ${custom.length ? html`
        <optgroup label="Custom">
          ${custom.map(o => html`
            <option value=${'custom:' + o.id} ?selected=${selected === 'custom:' + o.id}>${o.label}</option>`)}
        </optgroup>` : nothing}
    `;
  }

  // ── Motion sensors section ────────────────────────────────────────────
  private _motionSensorsSection() {
    const p = this.planner;
    const f = p.floor();
    return this._section('motion', 'Motion Sensors', () => html`
        ${f.motionSensors.length === 0
          ? html`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
              None yet — pick the Motion tool and click the floor.
            </div>`
          : this._groupedList('motion', f.motionSensors, m => this._motionItem(m))}
    `);
  }

  private _motionItem(m: MotionSensor) {
    const p = this.planner;
    const sel = p.activeMotionId === m.id;
    const st = m.entity_id && p.hass?.states ? p.hass.states[m.entity_id] : null;
    const isOn = st?.state === 'on';
    const bound = !!m.entity_id;
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveMotion(m.id)}>
          <div class="dot" style="background:${isOn ? '#ce93d8' : '#ba68c8'};
                                   ${isOn ? 'box-shadow:0 0 6px #ce93d8' : ''}"></div>
          <div class="nm">${m.label || 'Motion'}${this._batteryText(m.entity_id)}</div>
          ${bound
            ? html`<div class="badge bound">${isOn ? 'ON' : 'OFF'}</div>`
            : html`
                <button class="btn" style="font-size:10px;padding:2px 6px"
                        title="Bind to a Home Assistant entity"
                        @click=${(e: Event) => { e.stopPropagation(); this._pickMotionEntity(m); }}>
                  🔗 Bind
                </button>`}
        </div>
        ${sel ? this._motionEditor(m) : nothing}
      </div>
    `;
  }

  private _motionEditor(m: MotionSensor) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" .value=${m.label}
                 @input=${(e: Event) => upd(() => { m.label = (e.target as HTMLInputElement).value; })}>
        </div>
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(m.x))}
                 @input=${(e: Event) => upd(() => { m.x = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(m.y))}
                 @input=${(e: Event) => upd(() => { m.y = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Heading (°)</label>
          <input type="number" .value=${String(Math.round(m.heading))}
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                   m.heading = ((Math.round(v) % 360) + 360) % 360;
                 })}>
        </div>
        <div class="row"><label>FOV (°)</label>
          <input type="number" min="5" max="360" .value=${String(Math.round(m.fov))}
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                   m.fov = Math.max(5, Math.min(360, v));
                 })}>
        </div>
        <div class="row"><label>Range (mm)</label>
          <input type="number" min="100" .value=${String(Math.round(m.range))}
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                   m.range = Math.max(100, v);
                 })}>
        </div>
        <div class="row"><label>Color</label>
          <input type="color" .value=${motionColor(m)}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${(e: Event) => upd(() => { m.color = (e.target as HTMLInputElement).value; })}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Reset to default"
                  @click=${() => upd(() => { m.color = MOTION_DEFAULTS.color; })}>↺</button>
        </div>
        <div class="row" title="Color of the spinning plumbob above this sensor's AI / demo avatar — per-sensor attribution. Default = this sensor's color, so the avatar matches its source.">
          <label>Plumbob</label>
          <input type="color" .value=${m.plumbobColor || m.color || '#ba68c8'}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${(e: Event) => upd(() => { m.plumbobColor = (e.target as HTMLInputElement).value; })}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Reset to default (this sensor's color)"
                  @click=${() => upd(() => { m.plumbobColor = undefined; })}>✕</button>
        </div>
        <div class="row"><label>Intensity</label>
          <input type="range" min="0" max="2" step="0.05" .value=${String(motionIntensity(m))}
                 style="flex:1"
                 @input=${(e: Event) => upd(() => {
                   m.intensity = parseFloat((e.target as HTMLInputElement).value) || 0;
                 })}>
          <span style="font-size:10px;color:var(--text-dim);margin-left:4px;min-width:28px;text-align:right">
            ${motionIntensity(m).toFixed(2)}
          </span>
        </div>
        <div class="row" title="Render a simulated person wandering the room in 3D while presence is detected">
          <label>Avatar</label>
          <button class="btn" style="font-size:11px;flex:1"
                  @click=${() => upd(() => { m.avatar = !m.avatar; })}>
            ${m.avatar ? '🧍 On' : '— Off'}
          </button>
        </div>
        <div class="row" title="Always render the avatar in 3D — no entity binding or presence needed. A display/demo presence that wanders the room using this sensor's avatar pool.">
          <label>Demo avatar</label>
          <button class="btn" style="font-size:11px;flex:1"
                  @click=${() => upd(() => { m.demo = !m.demo; })}>
            ${m.demo ? '🎬 On (no entity needed)' : '— Off'}
          </button>
        </div>
        ${(m.avatar || m.demo) ? this._avatarGrid(m, upd) : nothing}
        ${this._lockRow(m)}
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${m.entity_id || '— unbound —'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickMotionEntity(m)}>
            ${m.entity_id ? 'Rebind' : 'Bind'}…
          </button>
          ${m.entity_id ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { m.entity_id = null; })}>Unbind</button>
          ` : nothing}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.motionSensors = f.motionSensors.filter(x => x.id !== m.id);
          p.activeMotionId = null;
          p.save(); p.emitConfig();
        }}>Delete</button>
      </div>
    `;
  }

  private _pickMotionEntity(m: MotionSensor): void {
    // Default to binary_sensor (typical PIR), but the picker has a domain
    // dropdown so the user can widen to any entity (e.g. device_tracker,
    // sensor with a templated state, etc.).
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'binary_sensor',
        onPick: (id: string) => {
          m.entity_id = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // ── Environmental sensors section ─────────────────────────────────────
  private _envSensorsSection() {
    const p = this.planner;
    const f = p.floor();
    return this._section('env', 'Environmental Sensors', () => html`
        ${f.envSensors.length === 0
          ? html`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
              None yet — pick the Env tool and click the floor.
              Shows temperature, humidity, CO₂, CO, PM, … from any sensor entity.
            </div>`
          : this._groupedList('env', f.envSensors, en => this._envItem(en))}
    `);
  }

  private _envItem(en: EnvSensor) {
    const p = this.planner;
    const sel = p.activeEnvId === en.id;
    const st = en.entity_id && p.hass?.states ? p.hass.states[en.entity_id] : null;
    const kind = envKindOf(en, st);
    const value = st ? parseFloat(st.state) : NaN;
    const color = envColor(kind, value);
    const bound = !!en.entity_id;
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveEnv(en.id)}>
          <div class="dot" style="background:${color}"></div>
          <div class="nm">${en.label || 'Env'}${this._batteryText(en.entity_id)}</div>
          ${bound
            ? html`<div class="badge bound" style="color:${color}">${envValueText(st)}</div>`
            : html`
                <button class="btn" style="font-size:10px;padding:2px 6px"
                        title="Bind to a Home Assistant sensor entity"
                        @click=${(e: Event) => { e.stopPropagation(); this._pickEnvEntity(en); }}>
                  🔗 Bind
                </button>`}
        </div>
        ${sel ? this._envEditor(en) : nothing}
      </div>
    `;
  }

  private _envEditor(en: EnvSensor) {
    const p = this.planner;
    const st = en.entity_id && p.hass?.states ? p.hass.states[en.entity_id] : null;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" .value=${en.label ?? ''}
                 @input=${(e: Event) => upd(() => { en.label = (e.target as HTMLInputElement).value; })}>
        </div>
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(en.x))}
                 @input=${(e: Event) => upd(() => { en.x = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(en.y))}
                 @input=${(e: Event) => upd(() => { en.y = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="0" .value=${String(Math.round(envHeight(en)))}
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value);
                   en.height = isFinite(v) ? Math.max(0, v) : ENV_DEFAULTS.height;
                 })}>
        </div>
        <div class="row"><label>Size</label>
          <input type="range" min=${ENV_SCALE_MIN} max=${ENV_SCALE_MAX} step="0.1"
                 .value=${String(envScale(en))} style="flex:1"
                 @input=${(e: Event) => upd(() => {
                   en.scale = parseFloat((e.target as HTMLInputElement).value) || 1;
                 })}>
          <span style="font-size:10px;color:var(--text-dim);margin-left:4px;min-width:28px;text-align:right">
            ${envScale(en).toFixed(1)}×
          </span>
        </div>
        <div class="row"><label>Kind</label>
          <select @change=${(e: Event) => upd(() => {
                    const v = (e.target as HTMLSelectElement).value;
                    en.kind = v === 'auto' ? undefined : v as EnvKind;
                  })}>
            <option value="auto" ?selected=${!en.kind}>
              Auto (${envKindOf(en, st)})
            </option>
            ${(Object.keys(ENV_KINDS) as EnvKind[]).map(k => html`
              <option value=${k} ?selected=${en.kind === k}>${ENV_KINDS[k].glyph} ${k}</option>`)}
          </select>
        </div>
        ${this._lockRow(en)}
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${en.entity_id || '— unbound —'}
          </span>
        </div>
        ${st ? html`
          <div class="row"><label>Reading</label>
            <span style="font-size:11px;color:var(--text)">${envValueText(st)}</span>
          </div>` : nothing}
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickEnvEntity(en)}>
            ${en.entity_id ? 'Rebind' : 'Bind'}…
          </button>
          ${en.entity_id ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { en.entity_id = null; })}>Unbind</button>
          ` : nothing}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.envSensors = f.envSensors.filter(x => x.id !== en.id);
          p.activeEnvId = null;
          p.save(); p.emitConfig();
        }}>Delete</button>
      </div>
    `;
  }

  private _pickEnvEntity(en: EnvSensor): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'sensor',
        onPick: (id: string) => {
          en.entity_id = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // ── Info cards section ────────────────────────────────────────────────
  private _infoCardsSection() {
    const p = this.planner;
    const f = p.floor();
    const list = f.infoCards ?? [];
    return this._section('info', 'Info Cards', () => html`
        ${list.length === 0
          ? html`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
              None yet — pick the Info tool and click the floor. Bind ANY entity to
              show its live value, or switch to clock/date mode (no entity needed).
            </div>`
          : this._groupedList('info', list, ic => this._infoCardItem(ic))}
    `);
  }

  private _infoCardItem(ic: InfoCard) {
    const p = this.planner;
    const sel = p.activeInfoId === ic.id;
    const mode = ic.displayMode ?? 'entity';
    const st = ic.entity_id && p.hass?.states ? p.hass.states[ic.entity_id] : null;
    const text = infoCardText(ic, st ?? null, { now: new Date(), imperial: p.store.imperial });
    const bound = mode !== 'entity' || !!ic.entity_id;
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveInfo(ic.id)}>
          <div class="dot" style="background:#7fd4ff"></div>
          <div class="nm">${ic.label || 'Info'}${this._batteryText(ic.entity_id)}</div>
          ${bound
            ? html`<div class="badge bound" style="color:#7fd4ff">${text}</div>`
            : html`
                <button class="btn" style="font-size:10px;padding:2px 6px"
                        title="Bind to any Home Assistant entity"
                        @click=${(e: Event) => { e.stopPropagation(); this._pickInfoEntity(ic); }}>
                  🔗 Bind
                </button>`}
        </div>
        ${sel ? this._infoCardEditor(ic) : nothing}
      </div>
    `;
  }

  // Shared value-rule row editor (batch DC-B): the SAME markup drives InfoCard
  // value→color rules AND logical-light state→on/color/flash rules — one rule
  // syntax (src/value-rules.ts `ValueRule`), never duplicated. In-place mutation
  // of each rule object + a `setRules` replacer for add/remove.
  private _ruleRows(rules: ValueRule[], setRules: (next: ValueRule[]) => void) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    const OPS: { v: RuleOp; label: string }[] = [
      { v: 'lt', label: '<' }, { v: 'lte', label: '≤' }, { v: 'gt', label: '>' },
      { v: 'gte', label: '≥' }, { v: 'eq', label: '=' }, { v: 'neq', label: '≠' },
      { v: 'between', label: 'between' }, { v: 'contains', label: 'contains' }, { v: 'regex', label: 'regex' },
    ];
    return html`
      ${rules.map((r, i) => html`
        <div style="display:flex;gap:3px;align-items:center;margin-bottom:3px">
          <select style="font-size:10px" @change=${(e: Event) => upd(() => { r.op = (e.target as HTMLSelectElement).value as RuleOp; })}>
            ${OPS.map(o => html`<option value=${o.v} ?selected=${r.op === o.v}>${o.label}</option>`)}
          </select>
          <input style="width:52px;font-size:10px" .value=${String(r.value)}
                 @input=${(e: Event) => upd(() => {
                   const v = (e.target as HTMLInputElement).value;
                   const n = parseFloat(v); r.value = isNaN(n) ? v : n; })}>
          ${r.op === 'between' ? html`<input style="width:44px;font-size:10px" placeholder="max" .value=${r.value2 ?? ''}
                 @input=${(e: Event) => upd(() => { r.value2 = parseFloat((e.target as HTMLInputElement).value) || 0; })}>` : nothing}
          <input type="color" style="width:26px;padding:0" .value=${r.color ?? '#ff5252'}
                 @input=${(e: Event) => upd(() => { r.color = (e.target as HTMLInputElement).value; })}>
          <label style="font-size:9px;color:var(--text-dim);display:flex;align-items:center;gap:2px" title="Flash / pulse">
            <input type="checkbox" .checked=${!!r.flash} @change=${(e: Event) => upd(() => { r.flash = (e.target as HTMLInputElement).checked; })}>⚡</label>
          <button class="btn" style="font-size:10px;padding:1px 4px" @click=${() => upd(() => setRules(rules.filter((_, j) => j !== i)))}>✕</button>
        </div>`)}
      <button class="btn" style="width:100%;font-size:10px;margin-top:2px" @click=${() => upd(() =>
        setRules([...rules, { op: 'gte', value: 0, color: '#ff5252' } as ValueRule]))}>+ Add rule</button>
    `;
  }

  private _infoCardEditor(ic: InfoCard) {
    const p = this.planner;
    const st = ic.entity_id && p.hass?.states ? p.hass.states[ic.entity_id] : null;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    const mode = ic.displayMode ?? 'entity';
    const fmt = () => (ic.format ??= {});
    const rules = ic.rules ?? [];
    const mappingText = Object.entries(ic.format?.mapping ?? {}).map(([k, v]) => `${k}=${v}`).join('\n');
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" .value=${ic.label ?? ''}
                 @input=${(e: Event) => upd(() => { ic.label = (e.target as HTMLInputElement).value; })}>
        </div>
        <div class="row"><label>Mode</label>
          <select @change=${(e: Event) => upd(() => {
                    ic.displayMode = (e.target as HTMLSelectElement).value as InfoCardDisplayMode; })}>
            ${(['entity', 'clock', 'date', 'clock_date'] as InfoCardDisplayMode[]).map(m => html`
              <option value=${m} ?selected=${mode === m}>${m}</option>`)}
          </select>
        </div>
        <div class="row"><label>Mount</label>
          <select @change=${(e: Event) => upd(() => {
                    ic.mount = (e.target as HTMLSelectElement).value as InfoCardMount; })}>
            ${(['wall', 'surface', 'floor'] as InfoCardMount[]).map(m => html`
              <option value=${m} ?selected=${infoCardMount(ic) === m}>${m}</option>`)}
          </select>
        </div>
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(ic.x))}
                 @input=${(e: Event) => upd(() => { ic.x = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(ic.y))}
                 @input=${(e: Event) => upd(() => { ic.y = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="0" .value=${String(Math.round(infoCardHeight(ic)))}
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value);
                   ic.height = isFinite(v) ? Math.max(0, v) : undefined;
                 })}>
        </div>
        <label class="row" style="padding:0"><span style="flex:1;font-size:11px;color:var(--text-dim)">Face camera (billboard)</span>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${ic.billboard !== false}
                   @change=${(e: Event) => upd(() => { ic.billboard = (e.target as HTMLInputElement).checked; })}>
            <span></span></span>
        </label>
        <div class="row"><label>Size</label>
          <input type="range" min=${INFO_CARD_SCALE_MIN} max=${INFO_CARD_SCALE_MAX} step="0.1"
                 .value=${String(infoCardScale(ic))} style="flex:1"
                 @input=${(e: Event) => upd(() => { ic.fontScale = parseFloat((e.target as HTMLInputElement).value) || 1; })}>
          <span style="font-size:10px;color:var(--text-dim);margin-left:4px;min-width:28px;text-align:right">
            ${infoCardScale(ic).toFixed(1)}×</span>
        </div>

        ${mode === 'entity' ? html`
          <div style="border-top:1px solid var(--border);margin:6px 0 4px;padding-top:4px;font-size:10px;color:var(--text-dim)">Entity + format</div>
          <div class="row"><label>HA entity</label>
            <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${ic.entity_id || '— unbound —'}
            </span>
          </div>
          ${st ? html`<div class="row"><label>Reading</label>
            <span style="font-size:11px;color:var(--text)">${infoCardText(ic, st, { now: new Date(), imperial: p.store.imperial })}</span></div>` : nothing}
          <div style="display:flex;gap:4px;margin:2px 0 4px">
            <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickInfoEntity(ic)}>
              ${ic.entity_id ? 'Rebind' : 'Bind'}…</button>
            ${ic.entity_id ? html`<button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { ic.entity_id = null; })}>Unbind</button>` : nothing}
          </div>
          <div class="row"><label>Decimals</label>
            <input type="number" min="0" max="6" placeholder="auto" .value=${ic.format?.decimals ?? ''}
                   @input=${(e: Event) => upd(() => {
                     const v = (e.target as HTMLInputElement).value;
                     fmt().decimals = v === '' ? undefined : Math.max(0, Math.min(6, parseInt(v, 10) || 0)); })}>
          </div>
          <div class="row"><label>Unit override</label>
            <input type="text" placeholder="(use entity unit)" .value=${ic.format?.unit ?? ''}
                   @input=${(e: Event) => upd(() => {
                     const v = (e.target as HTMLInputElement).value;
                     fmt().unit = v === '' ? undefined : v; })}>
          </div>
          <label class="row" style="padding:0"><span style="flex:1;font-size:11px;color:var(--text-dim)">Show unit</span>
            <span class="mini-toggle"><input type="checkbox" .checked=${ic.format?.showUnit !== false}
                   @change=${(e: Event) => upd(() => { fmt().showUnit = (e.target as HTMLInputElement).checked; })}><span></span></span>
          </label>
          <div class="row"><label>Prefix</label>
            <input type="text" .value=${ic.format?.prefix ?? ''}
                   @input=${(e: Event) => upd(() => { fmt().prefix = (e.target as HTMLInputElement).value || undefined; })}>
          </div>
          <div class="row"><label>Suffix</label>
            <input type="text" .value=${ic.format?.suffix ?? ''}
                   @input=${(e: Event) => upd(() => { fmt().suffix = (e.target as HTMLInputElement).value || undefined; })}>
          </div>
          <label class="row" style="padding:0"><span style="flex:1;font-size:11px;color:var(--text-dim)">Relative time (timestamps)</span>
            <span class="mini-toggle"><input type="checkbox" .checked=${!!ic.format?.relativeTime}
                   @change=${(e: Event) => upd(() => { fmt().relativeTime = (e.target as HTMLInputElement).checked; })}><span></span></span>
          </label>
          <div style="font-size:10px;color:var(--text-dim);margin-top:4px">State mapping (one <code>raw=display</code> per line)</div>
          <textarea rows="2" style="width:100%;font-size:11px;box-sizing:border-box"
                    .value=${mappingText}
                    @input=${(e: Event) => upd(() => {
                      const lines = (e.target as HTMLTextAreaElement).value.split('\n');
                      const map: Record<string, string> = {};
                      for (const ln of lines) { const i = ln.indexOf('='); if (i > 0) map[ln.slice(0, i).trim()] = ln.slice(i + 1).trim(); }
                      fmt().mapping = Object.keys(map).length ? map : undefined; })}></textarea>

          <div style="border-top:1px solid var(--border);margin:6px 0 4px;padding-top:4px;font-size:10px;color:var(--text-dim)">Value → color rules (first match wins)</div>
          ${this._ruleRows(rules, next => { ic.rules = next; })}
        ` : html`
          <div class="row"><label>Time format</label>
            <select @change=${(e: Event) => upd(() => { ic.clockFormat = (e.target as HTMLSelectElement).value; })}>
              ${Object.keys(CLOCK_PRESETS).map(k => html`<option value=${k} ?selected=${(ic.clockFormat ?? '12h') === k}>${k}</option>`)}
            </select>
          </div>
          <div class="row"><label>Date format</label>
            <select @change=${(e: Event) => upd(() => { ic.dateFormat = (e.target as HTMLSelectElement).value; })}>
              ${Object.keys(DATE_PRESETS).map(k => html`<option value=${k} ?selected=${(ic.dateFormat ?? 'medium') === k}>${k}</option>`)}
            </select>
          </div>
          <div class="row"><label>Time zone</label>
            <input type="text" placeholder="(host local, e.g. America/New_York)" .value=${ic.timeZone ?? ''}
                   @input=${(e: Event) => upd(() => { ic.timeZone = (e.target as HTMLInputElement).value || undefined; })}>
          </div>
        `}

        ${this._lockRow(ic)}
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.infoCards = (f.infoCards ?? []).filter(x => x.id !== ic.id);
          p.activeInfoId = null;
          p.save(); p.emitConfig();
        }}>Delete</button>
      </div>
    `;
  }

  private _pickInfoEntity(ic: InfoCard): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: null,   // any entity — the whole point of an info card
        onPick: (id: string) => {
          ic.entity_id = id;
          if (!ic.displayMode) ic.displayMode = 'entity';
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // ── Action buttons section (batch DC-B) ───────────────────────────────
  private _actionButtonsSection() {
    const p = this.planner;
    const f = p.floor();
    const list = f.actionButtons ?? [];
    return this._section('actions', 'Action Buttons', () => html`
        ${list.length === 0
          ? html`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
              None yet — pick the Action tool and click the floor. Fire a script,
              scene, button, automation, entity toggle, or any custom service.
            </div>`
          : this._groupedList('actions', list, b => this._actionButtonItem(b))}
    `);
  }

  private _actionButtonItem(b: ActionButton) {
    const p = this.planner;
    const sel = p.activeActionId === b.id;
    const kind = actionButtonKind(b);
    const target = kind === 'custom' ? `${b.domain ?? '?'}.${b.service ?? '?'}` : (b.entity_id || '— unbound —');
    // "fired N ago" from the bound entity's own timestamp (scene/button state IS
    // the timestamp; script/automation carry attributes.last_triggered).
    const lastFired = kind === 'custom' ? null
      : actionLastFired(b.entity_id ? p.hass?.states?.[b.entity_id] : null);
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveAction(b.id)}>
          <div class="dot" style="background:${actionButtonColor(b)}">${actionButtonIcon(b)}</div>
          <div class="nm">${b.label || 'Action'}</div>
          <button class="btn" style="font-size:10px;padding:2px 6px" title="Fire this action now"
                  @click=${(e: Event) => { e.stopPropagation(); p.fireAction(b, true); }}>Test</button>
        </div>
        ${lastFired ? html`<div style="font-size:10px;color:var(--text-dim);padding:0 8px 3px 30px">${lastFired}</div>` : nothing}
        ${sel ? this._actionButtonEditor(b, target) : nothing}
      </div>
    `;
  }

  private _actionButtonEditor(b: ActionButton, target: string) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    const kind = actionButtonKind(b);
    const KINDS: { v: ActionKind; label: string }[] = [
      { v: 'toggle', label: 'Toggle entity' }, { v: 'script', label: 'Run script' },
      { v: 'scene', label: 'Activate scene' }, { v: 'button_press', label: 'Press button' },
      { v: 'automation_trigger', label: 'Trigger automation' }, { v: 'custom', label: 'Custom service (advanced)' },
    ];
    // Domain filter for the entity picker per kind.
    const pickDomain: string | string[] | null =
      kind === 'script' ? 'script'
      : kind === 'scene' ? 'scene'
      : kind === 'automation_trigger' ? 'automation'
      : kind === 'button_press' ? ['button', 'input_button']
      : null;   // toggle: any entity
    const dataStr = b.serviceData ?? '';
    let dataErr = '';
    if (dataStr.trim()) { try { const o = JSON.parse(dataStr); if (!o || typeof o !== 'object' || Array.isArray(o)) dataErr = 'must be a JSON object'; } catch (e) { dataErr = String((e as Error).message || 'invalid JSON'); } }
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" .value=${b.label ?? ''}
                 @input=${(e: Event) => upd(() => { b.label = (e.target as HTMLInputElement).value; })}>
        </div>
        <div class="row"><label>Action</label>
          <select @change=${(e: Event) => upd(() => { b.actionKind = (e.target as HTMLSelectElement).value as ActionKind; })}>
            ${KINDS.map(k => html`<option value=${k.v} ?selected=${kind === k.v}>${k.label}</option>`)}
          </select>
        </div>
        ${kind === 'custom' ? html`
          <div style="font-size:10px;color:#ffb74d;margin:2px 0 4px">⚠ Calls ANY Home Assistant service — only type what you trust.</div>
          <div class="row"><label>Domain</label>
            <input type="text" placeholder="e.g. light" .value=${b.domain ?? ''}
                   @input=${(e: Event) => upd(() => { b.domain = (e.target as HTMLInputElement).value || undefined; })}>
          </div>
          <div class="row"><label>Service</label>
            <input type="text" placeholder="e.g. turn_on" .value=${b.service ?? ''}
                   @input=${(e: Event) => upd(() => { b.service = (e.target as HTMLInputElement).value || undefined; })}>
          </div>
          <div class="row"><label>Target entity</label>
            <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.entity_id || '(optional)'}</span>
            <button class="btn" style="font-size:10px" @click=${() => this._pickActionEntity(b, null)}>Pick</button>
          </div>
        ` : html`
          <div class="row"><label>Target</label>
            <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${target}</span>
          </div>
          <div style="display:flex;gap:4px;margin:2px 0 4px">
            <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickActionEntity(b, pickDomain)}>
              ${b.entity_id ? 'Rebind' : 'Bind'}…</button>
            ${b.entity_id ? html`<button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { b.entity_id = null; })}>Unbind</button>` : nothing}
          </div>
        `}
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px">Service data (JSON — custom data / scene transition / script variables)</div>
        <textarea rows="2" style="width:100%;font-size:11px;box-sizing:border-box;${dataErr ? 'border-color:#ef5350' : ''}"
                  placeholder=${'{ }'} .value=${dataStr}
                  @input=${(e: Event) => upd(() => { b.serviceData = (e.target as HTMLTextAreaElement).value || undefined; })}></textarea>
        ${dataErr ? html`<div style="font-size:10px;color:#ef5350">${dataErr}</div>` : nothing}
        <div class="row"><label>Glyph</label>
          <input type="text" maxlength="3" placeholder=${actionButtonIcon(b)} .value=${b.icon ?? ''}
                 @input=${(e: Event) => upd(() => { b.icon = (e.target as HTMLInputElement).value || undefined; })}>
        </div>
        <div class="row"><label>Cap color</label>
          <input type="color" .value=${actionButtonColor(b)}
                 @input=${(e: Event) => upd(() => { b.color = (e.target as HTMLInputElement).value; })}>
        </div>
        <label class="row" style="padding:0"><span style="flex:1;font-size:11px;color:var(--text-dim)">Wall mount (snap to wall)</span>
          <span class="mini-toggle"><input type="checkbox" .checked=${b.wallMount !== false}
                 @change=${(e: Event) => upd(() => { b.wallMount = (e.target as HTMLInputElement).checked; if (b.wallMount) snapActionButtonToWall(b, p.floor().walls); })}><span></span></span>
        </label>
        <label class="row" style="padding:0"><span style="flex:1;font-size:11px;color:var(--text-dim)">Confirm before firing</span>
          <span class="mini-toggle"><input type="checkbox" .checked=${!!b.confirm}
                 @change=${(e: Event) => upd(() => { b.confirm = (e.target as HTMLInputElement).checked; })}><span></span></span>
        </label>
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(b.x))}
                 @input=${(e: Event) => upd(() => { b.x = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(b.y))}
                 @input=${(e: Event) => upd(() => { b.y = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="0" .value=${String(Math.round(actionButtonHeight(b)))}
                 @input=${(e: Event) => upd(() => { const v = parseFloat((e.target as HTMLInputElement).value); b.height = isFinite(v) ? Math.max(0, v) : undefined; })}>
        </div>
        <button class="btn" style="width:100%;margin-top:4px" @click=${() => p.fireAction(b, true)}>▶ Test fire</button>
        ${this._lockRow(b)}
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.actionButtons = (f.actionButtons ?? []).filter(x => x.id !== b.id);
          p.activeActionId = null;
          p.save(); p.emitConfig();
        }}>Delete</button>
      </div>
    `;
  }

  private _pickActionEntity(b: ActionButton, domain: string | string[] | null): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain,
        onPick: (id: string) => {
          b.entity_id = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // ── BLE proxies section ───────────────────────────────────────────────
  private _bleProxiesSection() {
    const p = this.planner;
    const f = p.floor();
    const list = f.bleProxies ?? [];
    const bermudaOff = p.store.bermudaEnabled === false;
    return this._section('ble', 'BLE Proxies', () => html`
        ${bermudaOff ? html`
          <div style="color:var(--text-dim);font-size:10px;padding:2px 0 6px;opacity:0.7;font-style:italic">
            (Bermuda integration disabled in Settings)
          </div>` : nothing}
        ${list.length === 0
          ? html`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
              None yet — pick the BLE tool and click the floor. Bind each puck to
              the physical Bluetooth proxy device so trilateration can place people.
            </div>`
          : this._groupedList('ble', list, b => this._bleItem(b))}
    `);
  }

  private _bleItem(b: BleProxy) {
    const p = this.planner;
    const sel = p.activeBleId === b.id;
    const bound = !!b.haDeviceId;
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveBle(b.id)}>
          <div class="dot" style="background:${BLE_PROXY_DEFAULTS.color}"></div>
          <div class="nm">${b.name || 'Proxy'}${this._batteryText(b.haDeviceId, true)}</div>
          <div class="badge ${bound ? 'bound' : ''}">${bound ? '📶' : '—'}</div>
        </div>
        ${sel ? this._bleEditor(b) : nothing}
      </div>
    `;
  }

  private _bleEditor(b: BleProxy) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    const devName = b.haDeviceId ? (this._deviceNames[b.haDeviceId] || b.haDeviceId) : null;
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Name</label>
          <input type="text" .value=${b.name}
                 @input=${(e: Event) => upd(() => { b.name = (e.target as HTMLInputElement).value; })}>
        </div>
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(b.x))}
                 @input=${(e: Event) => upd(() => { b.x = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(b.y))}
                 @input=${(e: Event) => upd(() => { b.y = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="0" .value=${String(Math.round(bleProxyHeight(b)))}
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value);
                   b.height = isFinite(v) ? Math.max(0, v) : BLE_PROXY_DEFAULTS.height;
                 })}>
        </div>
        <div class="row"><label>Hidden</label>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${!!b.hidden}
                   @change=${(e: Event) => upd(() => { b.hidden = (e.target as HTMLInputElement).checked; })}>
            <span></span>
          </span>
        </div>
        ${this._lockRow(b)}
        <div class="row"><label>Proxy device</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${devName || '— unbound —'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickBleDevice(b)}>
            ${b.haDeviceId ? 'Rebind' : 'Bind'} device…
          </button>
          ${b.haDeviceId ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { b.haDeviceId = null; })}>Unbind</button>
          ` : nothing}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.bleProxies = (f.bleProxies ?? []).filter(x => x.id !== b.id);
          p.activeBleId = null;
          p.save(); p.emitConfig();
        }}>Delete</button>
      </div>
    `;
  }

  // Cache of device id → friendly name, filled lazily when a device picker
  // opens (shared by BLE proxy binding + person bindings).
  private _deviceNames: Record<string, string> = {};

  private async _pickBleDevice(b: BleProxy): Promise<void> {
    const hass = this.planner.hass;
    if (!hass) return;
    let devs: Awaited<ReturnType<typeof hass.getDevices>> = [];
    try { devs = await hass.getDevices(); } catch { /* offline — empty list */ }
    const rows = devs.map(d => {
      const name = d.name_by_user || d.name || d.id;
      this._deviceNames[d.id] = name;
      const macs = (d.connections ?? []).map(([, v]) => v).filter(Boolean);
      return { id: d.id, name, subtitle: macs.length ? macs.join(', ') : undefined };
    }).sort((r1, r2) => r1.name.localeCompare(r2.name));
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        devices: rows, title: 'Pick the Bluetooth proxy device',
        onPick: (id: string) => {
          b.haDeviceId = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // ── Alarm keypads section (Feature 3) ─────────────────────────────────
  private _alarmPanelsSection() {
    const list = this.planner.floor().alarmPanels ?? [];
    if (list.length === 0) return nothing;
    return this._section('alarm', 'Alarm', () =>
      this._groupedList('alarm', list, a => this._alarmItem(a)));
  }

  private _alarmItem(a: AlarmPanel) {
    const p = this.planner;
    const sel = p.activeAlarmId === a.id;
    const st = p.effectiveState(a);
    const state = st?.state ?? null;
    const col = alarmStateColor(state);
    const badge = state ? state.replace('armed_', '').replace(/_/g, ' ') : (a.entity_id ? 'n/a' : '—');
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveAlarm(a.id)}>
          <div class="dot" style="background:${state ? col : '#90a4ae'}"></div>
          <div class="nm">${a.label?.trim() || 'Alarm'}${this._batteryText(a.entity_id)}</div>
          <div class="badge" style=${state ? `color:${col}` : nothing}>${badge}</div>
        </div>
        ${sel ? this._alarmEditor(a) : nothing}
      </div>
    `;
  }

  private _alarmEditor(a: AlarmPanel) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" .value=${a.label ?? ''} placeholder="Alarm"
                 @input=${(e: Event) => upd(() => { a.label = (e.target as HTMLInputElement).value; })}>
        </div>
        ${this._lockRow(a)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(a.x))}
                 @input=${(e: Event) => upd(() => { a.x = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(a.y))}
                 @input=${(e: Event) => upd(() => { a.y = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="0" .value=${String(Math.round(alarmHeight(a)))}
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value);
                   a.height = isFinite(v) ? Math.max(0, v) : undefined;
                 })}>
        </div>
        <div class="row"><label title="Permit arm/disarm from the panel modal. Off = view-only status.">Allow arm/disarm</label>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${!!a.allowControl}
                   @change=${(e: Event) => upd(() => { a.allowControl = (e.target as HTMLInputElement).checked; })}>
            <span></span>
          </span>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${a.entity_id || '— unbound —'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickAlarmEntity(a)}>
            ${a.entity_id ? 'Rebind' : 'Bind'}…
          </button>
          ${a.entity_id ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { a.entity_id = null; })}>Unbind</button>
          ` : nothing}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          ${a.entity_id
            ? 'Click the keypad to open the control modal (arm/disarm needs "Allow arm/disarm").'
            : 'Unbound: the keypad modal sets a local demo state (disarmed / armed home / armed away).'}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.alarmPanels = (f.alarmPanels ?? []).filter(x => x.id !== a.id);
          p.activeAlarmId = null;
          p.save(); p.emitConfig();
        }}>Delete</button>
      </div>
    `;
  }

  private _pickAlarmEntity(a: AlarmPanel): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'alarm_control_panel',
        onPick: (id: string) => {
          a.entity_id = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // ── Wall calendar section (calendar-on-wall) ───────────────────────────
  private _calendarPanelsSection() {
    const list = this.planner.floor().calendarPanels ?? [];
    if (list.length === 0) return nothing;
    return this._section('calendar', 'Wall Calendar', () =>
      this._groupedList('calendar', list, c => this._calendarItem(c)));
  }

  private _calendarItem(c: CalendarPanel) {
    const p = this.planner;
    const sel = p.activeCalendarId === c.id;
    const n = (p.calendarEvents[c.id] ?? []).length;
    const bound = (c.calendarIds ?? []).length;
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveCalendar(c.id)}>
          <div class="dot" style="background:${bound ? '#f4b73e' : '#90a4ae'}"></div>
          <div class="nm">${c.label?.trim() || 'Calendar'}</div>
          <div class="badge">${bound ? `${n} evt` : 'unbound'}</div>
        </div>
        ${sel ? this._calendarEditor(c) : nothing}
      </div>
    `;
  }

  private _calendarEditor(c: CalendarPanel) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    const events = (p.calendarEvents[c.id] ?? []).slice(0, 4);
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" .value=${c.label ?? ''} placeholder="Calendar"
                 @input=${(e: Event) => upd(() => { c.label = (e.target as HTMLInputElement).value; })}>
        </div>
        ${this._lockRow(c)}
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="0" .value=${String(Math.round(calendarHeight(c)))}
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value);
                   c.height = isFinite(v) ? Math.max(0, v) : undefined;
                 })}>
        </div>
        <div style="font-size:11px;color:var(--text-dim);margin:6px 0 2px">Calendars</div>
        ${(c.calendarIds ?? []).length === 0
          ? html`<div style="font-size:10px;color:var(--text-dim);margin-bottom:4px">— none bound —</div>`
          : (c.calendarIds ?? []).map(id => html`
            <div class="row" style="align-items:center">
              <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${id}</span>
              <button class="btn" style="font-size:11px" @click=${() => upd(() => {
                c.calendarIds = (c.calendarIds ?? []).filter(x => x !== id);
              })}>✕</button>
            </div>`)}
        <button class="btn" style="width:100%;font-size:11px;margin-top:4px" @click=${() => this._pickCalendarEntity(c)}>
          + Add calendar…
        </button>
        ${events.length ? html`
          <div style="font-size:11px;color:var(--text-dim);margin:6px 0 2px">Next events</div>
          ${events.map(ev => html`
            <div style="font-size:10px;color:var(--text);line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${ev.allDay ? 'All day' : new Date(ev.start).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · ${ev.summary}
            </div>`)}
        ` : ((c.calendarIds ?? []).length ? html`
          <div style="font-size:10px;color:var(--text-dim);margin-top:4px">No upcoming events (or still loading…).</div>` : nothing)}
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.calendarPanels = (f.calendarPanels ?? []).filter(x => x.id !== c.id);
          p.activeCalendarId = null;
          p.save(); p.emitConfig();
        }}>Delete</button>
      </div>
    `;
  }

  private _pickCalendarEntity(c: CalendarPanel): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'calendar',
        onPick: (id: string) => {
          if (!c.calendarIds) c.calendarIds = [];
          if (!c.calendarIds.includes(id)) c.calendarIds.push(id);
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // ── Thermostats section (HVAC wall control) ───────────────────────────
  private _thermostatsSection() {
    const list = this.planner.floor().thermostats ?? [];
    if (list.length === 0) return nothing;
    return this._section('thermostats', 'Thermostats', () =>
      this._groupedList('thermostats', list, t => this._thermostatItem(t)));
  }

  private _thermostatItem(t: ThermostatFixture) {
    const p = this.planner;
    const sel = p.activeThermoId === t.id;
    const st = p.effectiveState(t);
    const mode = st?.state ?? null;
    const col = hvacModeColor(mode);
    const cur = st?.attributes?.current_temperature;
    const badge = mode ? `${mode.replace('_', ' ')}${cur != null ? ` ${Math.round(Number(cur))}°` : ''}` : (t.entity_id ? 'n/a' : '—');
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveThermo(t.id)}>
          <div class="dot" style="background:${mode ? col : '#90a4ae'}"></div>
          <div class="nm">${t.label?.trim() || 'Thermostat'}${this._batteryText(t.entity_id)}</div>
          <div class="badge" style=${mode ? `color:${col}` : nothing}>${badge}</div>
        </div>
        ${sel ? this._thermostatEditor(t) : nothing}
      </div>
    `;
  }

  private _thermostatEditor(t: ThermostatFixture) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" .value=${t.label ?? ''} placeholder="Thermostat"
                 @input=${(e: Event) => upd(() => { t.label = (e.target as HTMLInputElement).value; })}>
        </div>
        ${this._lockRow(t)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(t.x))}
                 @input=${(e: Event) => upd(() => { t.x = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(t.y))}
                 @input=${(e: Event) => upd(() => { t.y = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="0" .value=${String(Math.round(thermostatHeight(t)))}
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value);
                   t.height = isFinite(v) ? Math.max(0, v) : undefined;
                 })}>
        </div>
        <div class="row"><label title="Permit mode/setpoint changes from the panel modal. Off = view-only status.">Allow control</label>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${t.allowControl !== false}
                   @change=${(e: Event) => upd(() => { t.allowControl = (e.target as HTMLInputElement).checked; })}>
            <span></span>
          </span>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${t.entity_id || '— unbound —'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickThermostatEntity(t)}>
            ${t.entity_id ? 'Rebind' : 'Bind'}…
          </button>
          ${t.entity_id ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { t.entity_id = null; })}>Unbind</button>
          ` : nothing}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          ${t.entity_id
            ? 'Click the thermostat to open the control modal (mode/setpoint needs "Allow control").'
            : 'Unbound: the modal sets a local demo mode + setpoint (off / heat / cool / fan).'}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.thermostats = (f.thermostats ?? []).filter(x => x.id !== t.id);
          p.activeThermoId = null;
          p.save(); p.emitConfig();
        }}>Delete</button>
      </div>
    `;
  }

  private _pickThermostatEntity(t: ThermostatFixture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'climate',
        onPick: (id: string) => {
          t.entity_id = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // ── Smoke / CO detectors section ──────────────────────────────────────
  private _safetySensorsSection() {
    const list = this.planner.floor().safetySensors ?? [];
    if (list.length === 0) return nothing;
    return this._section('safety', 'Safety & sirens', () =>
      this._groupedList('safety', list, s => this._safetyItem(s)));
  }

  private _safetyItem(s: SafetySensor) {
    const p = this.planner;
    const sel = p.activeSafetyId === s.id;
    const kind = s.kind;
    const col = safetyColor(kind);
    const st = p.effectiveState(s);
    const alarming = st?.state === 'on';
    const dfl = kind === 'co' ? 'CO' : kind === 'gas' ? 'Gas' : kind === 'leak' ? 'Leak'
              : kind === 'siren' ? 'Siren' : 'Smoke';
    const badge = alarming ? (kind === 'leak' ? 'LEAK' : kind === 'siren' ? 'SOUNDING' : 'ALARM')
                           : (st ? (kind === 'leak' ? 'dry' : kind === 'siren' ? 'idle' : 'ok')
                                 : (s.entity_id ? '—' : 'unbound'));
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveSafety(s.id)}>
          <div class="dot" style="background:${alarming ? col : '#90a4ae'}"></div>
          <div class="nm">${s.label?.trim() || dfl}${this._batteryText(s.entity_id)}</div>
          <div class="badge" style=${alarming ? `color:${col};font-weight:700` : nothing}>${badge}</div>
        </div>
        ${sel ? this._safetyEditor(s) : nothing}
      </div>
    `;
  }

  private _safetyEditor(s: SafetySensor) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    const bound = !!s.entity_id;
    const sounding = p.effectiveState(s)?.state === 'on';
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Kind</label>
          <select .value=${s.kind}
                  @change=${(e: Event) => upd(() => { s.kind = (e.target as HTMLSelectElement).value as SafetySensor['kind']; })}>
            <option value="smoke">Smoke</option>
            <option value="co">CO (carbon monoxide)</option>
            <option value="gas">Gas</option>
            <option value="leak">Leak (floor / water)</option>
            <option value="siren">Siren / alert beacon</option>
          </select>
        </div>
        <div class="row"><label>Label</label>
          <input type="text" .value=${s.label ?? ''} placeholder="Detector"
                 @input=${(e: Event) => upd(() => { s.label = (e.target as HTMLInputElement).value; })}>
        </div>
        ${this._lockRow(s)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(s.x))}
                 @input=${(e: Event) => upd(() => { s.x = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(s.y))}
                 @input=${(e: Event) => upd(() => { s.y = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${s.entity_id || '— unbound —'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickSafetyEntity(s)}>
            ${s.entity_id ? 'Rebind' : 'Bind'}…
          </button>
          ${s.entity_id ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { s.entity_id = null; })}>Unbind</button>
          ` : nothing}
          ${s.kind === 'siren'
            ? html`<button class="btn" style="font-size:11px"
                    title="Toggle the siren (bound siren.*/switch.* or a local demo state)"
                    @click=${() => p.triggerSiren(s)}>${sounding ? 'Silence' : 'Sound'}</button>`
            : html`<button class="btn" style="font-size:11px"
                    ?disabled=${bound}
                    title=${bound ? 'bound to HA — state comes from the entity' : 'Toggle the local alarm state'}
                    @click=${() => { if (!bound) p.toggleItem(s); }}>Test</button>`}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          ${s.kind === 'siren'
            ? (bound
                ? 'Bound: state follows the entity. A siren.*/switch.* can be toggled (Sound/Silence + clicking the beacon); a binary_sensor is display-only.'
                : 'Unbound: Sound/Silence (or clicking the beacon) toggles a local demo state.')
            : (bound
                ? 'Bound: alarm state follows the binary_sensor (on = alarming).'
                : 'Unbound: Test (or clicking the detector) toggles a local alarm state.')}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.safetySensors = (f.safetySensors ?? []).filter(x => x.id !== s.id);
          p.activeSafetyId = null;
          p.save(); p.emitConfig();
        }}>Delete</button>
      </div>
    `;
  }

  private _pickSafetyEntity(s: SafetySensor): void {
    // Sirens bind a controllable siren.* (or a relay switch.*), or a display-only
    // binary_sensor; detectors bind a binary_sensor.
    const domain = s.kind === 'siren' ? ['siren', 'switch', 'binary_sensor'] : 'binary_sensor';
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain,
        onPick: (id: string) => {
          s.entity_id = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // ── Alert Beacons section (Alert Center, Track B) ──────────────────────
  private _alertBeaconsSection() {
    const list = this.planner.floor().alertBeacons ?? [];
    if (list.length === 0) return nothing;
    return this._section('alertbeacons', 'Alert Beacons', () =>
      this._groupedList('alertbeacons', list, b => this._alertBeaconItem(b)));
  }

  private _alertBeaconItem(b: AlertBeacon) {
    const p = this.planner;
    const sel = p.activeAlertBeaconId === b.id;
    const st = p.effectiveState(b);
    const bs = alertBeaconState(st?.state, isAlertDomain(b.entity_id));
    const col = alertBeaconColor(bs);
    const badge = bs === 'active' ? 'ALERT' : bs === 'ack' ? 'ack'
                : (st ? 'idle' : (b.entity_id ? '—' : 'unbound'));
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveAlertBeacon(b.id)}>
          <div class="dot" style="background:${bs === 'idle' ? '#90a4ae' : col}"></div>
          <div class="nm">${b.label?.trim() || 'Alert'}${this._batteryText(b.entity_id)}</div>
          <div class="badge" style=${bs === 'active' ? `color:${col};font-weight:700` : nothing}>${badge}</div>
        </div>
        ${sel ? this._alertBeaconEditor(b) : nothing}
      </div>
    `;
  }

  private _alertBeaconEditor(b: AlertBeacon) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    const bound = !!b.entity_id;
    const active = p.effectiveState(b)?.state === 'on';
    const isAlert = isAlertDomain(b.entity_id);
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" .value=${b.label ?? ''} placeholder="Alert"
                 @input=${(e: Event) => upd(() => { b.label = (e.target as HTMLInputElement).value; })}>
        </div>
        ${this._lockRow(b)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(b.x))}
                 @input=${(e: Event) => upd(() => { b.x = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(b.y))}
                 @input=${(e: Event) => upd(() => { b.y = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${b.entity_id || '— unbound —'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickAlertBeaconEntity(b)}>
            ${b.entity_id ? 'Rebind' : 'Bind'}…
          </button>
          ${b.entity_id ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { b.entity_id = null; })}>Unbind</button>
          ` : nothing}
          ${bound
            ? html`<button class="btn" style="font-size:11px"
                    ?disabled=${!(isAlert && active)}
                    title=${isAlert ? 'alert.turn_off (acknowledge) — only while active' : 'binary_sensor is display-only'}
                    @click=${() => p.acknowledgeAlertBeacon(b)}>Acknowledge</button>`
            : html`<button class="btn" style="font-size:11px"
                    title="Toggle the local alert state (demo)"
                    @click=${() => p.toggleItem(b)}>Test</button>`}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          ${bound
            ? (isAlert
                ? 'Bound alert.*: on = active (pulsing red), off = acknowledged (steady amber). Click to acknowledge (alert.turn_off).'
                : 'Bound binary_sensor: on = active (pulsing red). Display-only (no acknowledge).')
            : 'Unbound: Test (or clicking the beacon) toggles a local demo state.'}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.alertBeacons = (f.alertBeacons ?? []).filter(x => x.id !== b.id);
          p.activeAlertBeaconId = null;
          p.save(); p.emitConfig();
        }}>Delete</button>
      </div>
    `;
  }

  private _pickAlertBeaconEntity(b: AlertBeacon): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        // alert.* is ideal (three-state acknowledge); binary_sensor is the common
        // stand-in. Not domain-locked — mirrors the Safety Sensor's looseness.
        domain: ['alert', 'binary_sensor'],
        onPick: (id: string) => {
          b.entity_id = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // ── Robots section (vacuum / mower) ───────────────────────────────────
  private _robotsSection() {
    const list = this.planner.floor().robots ?? [];
    if (list.length === 0) return nothing;
    return this._section('robots', 'Robots', () =>
      this._groupedList('robots', list, r => this._robotItem(r)));
  }

  private _robotItem(r: RobotFixture) {
    const p = this.planner;
    const sel = p.activeRobotId === r.id;
    const kind = r.kind === 'mower' ? 'mower' : 'vacuum';
    const act = p.robotActivity(r);
    const led = robotLedColor(act);
    const working = act === 'cleaning' || act === 'mowing';
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveRobot(r.id)}>
          <div class="dot" style="background:${robotColor(kind)}"></div>
          <div class="nm">${robotGlyph(kind)} ${r.label?.trim() || (kind === 'mower' ? 'Mower' : 'Vacuum')}${this._batteryText(r.entity_id)}</div>
          <div class="badge" style="color:${led};${working ? 'font-weight:700' : ''}">${act}</div>
        </div>
        ${sel ? this._robotEditor(r) : nothing}
      </div>
    `;
  }

  private _robotEditor(r: RobotFixture) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    const kind = r.kind === 'mower' ? 'mower' : 'vacuum';
    const bound = !!r.entity_id;
    const act = p.robotActivity(r);
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Kind</label>
          <select .value=${kind}
                  @change=${(e: Event) => upd(() => {
                    r.kind = (e.target as HTMLSelectElement).value as 'vacuum' | 'mower';
                    r.entity_id = null;   // binding domain differs per kind
                    delete p.robotStates[r.id];
                  })}>
            <option value="vacuum">Vacuum (indoors)</option>
            <option value="mower">Mower (outdoors)</option>
          </select>
        </div>
        <div class="row"><label>Label</label>
          <input type="text" .value=${r.label ?? ''} placeholder="Robot"
                 @input=${(e: Event) => upd(() => { r.label = (e.target as HTMLInputElement).value; })}>
        </div>
        ${this._lockRow(r)}
        <div class="row"><label>Dock X</label>
          <input type="number" .value=${String(Math.round(r.x))}
                 @input=${(e: Event) => upd(() => { r.x = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Dock Y</label>
          <input type="number" .value=${String(Math.round(r.y))}
                 @input=${(e: Event) => upd(() => { r.y = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>${kind === 'mower' ? 'lawn_mower' : 'vacuum'}</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${r.entity_id || '— unbound —'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickRobotEntity(r)}>
            ${r.entity_id ? 'Rebind' : 'Bind'}…
          </button>
          ${r.entity_id ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { r.entity_id = null; })}>Unbind</button>
          ` : nothing}
          <button class="btn" style="font-size:11px"
                  title=${bound ? 'Run / dock the robot' : 'Toggle the demo run/return'}
                  @click=${() => p.toggleRobot(r)}>${act === 'cleaning' || act === 'mowing' ? 'Dock' : 'Run'}</button>
        </div>
        ${kind === 'mower' ? this._robotGpsRows(r) : this._robotVacuumPosRows(r)}
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          ${bound
            ? 'Bound: state follows the entity. Click the robot to run/dock.'
            : 'Unbound: roams autonomously (demo). Click the robot to toggle run/return.'}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.robots = (f.robots ?? []).filter(x => x.id !== r.id);
          delete p.robotStates[r.id];
          p.activeRobotId = null;
          p.save(); p.emitConfig();
        }}>Delete</button>
      </div>
    `;
  }

  // Mower GPS binds: a device_tracker (lat/lon attrs, preferred) OR a separate
  // lat + lon sensor pair. Tracker wins when both are set.
  private _robotGpsRows(r: RobotFixture) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    return html`
      <div style="border-top:1px solid var(--border);margin-top:6px;padding-top:6px">
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:3px">GPS position (mower)</div>
        <div class="row"><label>Tracker</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${r.trackerEntity || '—'}
          </span>
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn" style="flex:1;font-size:11px"
                  @click=${() => this._pickRobotTracker(r)}>${r.trackerEntity ? 'Rebind' : 'Bind'} tracker…</button>
          ${r.trackerEntity ? html`<button class="btn" style="font-size:11px"
                  @click=${() => upd(() => { r.trackerEntity = null; })}>×</button>` : nothing}
        </div>
        <div class="row" style="margin-top:4px"><label>Lat</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.latEntity || '—'}</span>
          <button class="btn" style="font-size:11px" @click=${() => this._pickRobotLatLon(r, 'lat')}>Bind</button>
        </div>
        <div class="row"><label>Lon</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.lonEntity || '—'}</span>
          <button class="btn" style="font-size:11px" @click=${() => this._pickRobotLatLon(r, 'lon')}>Bind</button>
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:3px;line-height:1.3">
          Needs calibrated GPS landmarks (GPS/Geo section). No fix / no calibration → simulated mowing.
        </div>
      </div>
    `;
  }

  // Vacuum LIVE position (#6): bind a Roborock map camera/image/sensor entity
  // carrying `vacuum_position`, calibrate the map→plan transform, and one-click
  // solve the offset by parking on the dock. The RAW readout below refreshes on
  // each sidebar render (posEntity is LIVE-path, so park + click to calibrate).
  private _robotVacuumPosRows(r: RobotFixture) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    const rawAttrs = r.posEntity
      ? (p.hass?.states?.[r.posEntity]?.attributes as Record<string, unknown> | undefined) : undefined;
    const raw = parseVacuumPosition(rawAttrs);
    const numRow = (label: string, val: number, mut: (n: number) => void, step = 1) => html`
      <div class="row"><label>${label}</label>
        <input type="number" step=${step} .value=${String(val)}
               @input=${(e: Event) => upd(() => mut(parseFloat((e.target as HTMLInputElement).value) || 0))}>
      </div>`;
    return html`
      <div style="border-top:1px solid var(--border);margin-top:6px;padding-top:6px">
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:3px">Valetudo room map</div>
        <div class="row"><label>Topic id</label>
          <input type="text" .value=${r.valetudoId ?? ''} placeholder="e.g. rockrobo"
                 @input=${(e: Event) => upd(() => { r.valetudoId = (e.target as HTMLInputElement).value.trim() || undefined; })}>
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:3px;line-height:1.35">
          The identifier segment in <code>${(p.store.mqttBridge?.valetudoNs || 'valetudo')}/&lt;id&gt;/…</code>.
          Needs the MQTT bridge on (Settings ▸ Integrations). Draws the vacuum's SLAM room
          segmentation under the <b>Vacuum room map</b> layer (default off) — reuses the map
          calibration below (scale / offset / rotation / flip); calibrate once with
          <b>Set dock as reference</b>. Tap a room on the plan to send it to clean.
        </div>
      </div>
      <div style="border-top:1px solid var(--border);margin-top:6px;padding-top:6px">
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:3px">Live position (Roborock map)</div>
        <div class="row"><label>Position entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.posEntity || '— none —'}</span>
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn" style="flex:1;font-size:11px"
                  @click=${() => this._pickRobotPosEntity(r)}>${r.posEntity ? 'Rebind' : 'Bind'} map…</button>
          ${r.posEntity ? html`<button class="btn" style="font-size:11px"
                  @click=${() => upd(() => { r.posEntity = null; })}>×</button>` : nothing}
        </div>
        ${r.posEntity ? html`
          <div style="font-size:10px;color:var(--text-dim);margin-top:4px">Map calibration</div>
          ${numRow('Scale (mm/unit)', r.posScale ?? 1, n => { r.posScale = n; }, 0.001)}
          ${numRow('Offset X (mm)', Math.round(r.posOffsetX ?? 0), n => { r.posOffsetX = n; })}
          ${numRow('Offset Y (mm)', Math.round(r.posOffsetY ?? 0), n => { r.posOffsetY = n; })}
          ${numRow('Rotation (deg)', r.posRotDeg ?? 0, n => { r.posRotDeg = n; })}
          <div class="row"><label>Flip Y</label>
            <input type="checkbox" .checked=${!!r.posFlipY}
                   @change=${(e: Event) => upd(() => { r.posFlipY = (e.target as HTMLInputElement).checked; })}>
          </div>
          <div style="font-size:10px;color:var(--text-dim);margin-top:3px">
            Raw: ${raw ? `x=${raw.x.toFixed(0)} y=${raw.y.toFixed(0)}${raw.a != null ? ` a=${raw.a.toFixed(0)}°` : ''}` : '— no vacuum_position —'}
          </div>
          <button class="btn" style="width:100%;margin-top:4px;font-size:11px"
                  ?disabled=${!raw}
                  title="Park the vacuum on its dock, then click to solve the X/Y offset"
                  @click=${() => upd(() => {
                    const rr = parseVacuumPosition(p.hass?.states?.[r.posEntity!]?.attributes as Record<string, unknown> | undefined);
                    if (!rr) return;
                    const sol = solveVacuumDockOffset(rr, { x: r.x, y: r.y }, r);
                    r.posOffsetX = sol.posOffsetX; r.posOffsetY = sol.posOffsetY;
                  })}>Set dock as reference</button>
          <div style="font-size:10px;color:var(--text-dim);margin-top:3px;line-height:1.3">
            No fix / unparseable → simulated roam. Park on the dock and click above to align the map origin.
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _pickRobotPosEntity(r: RobotFixture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: ['camera', 'image', 'sensor'],
        onPick: (id: string) => { r.posEntity = id; this.planner.save(); this.planner.emitConfig(); },
      },
    }));
  }

  private _pickRobotEntity(r: RobotFixture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: r.kind === 'mower' ? 'lawn_mower' : 'vacuum',
        onPick: (id: string) => { r.entity_id = id; this.planner.save(); this.planner.emitConfig(); },
      },
    }));
  }

  private _pickRobotTracker(r: RobotFixture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'device_tracker',
        onPick: (id: string) => { r.trackerEntity = id; this.planner.save(); this.planner.emitConfig(); },
      },
    }));
  }

  private _pickRobotLatLon(r: RobotFixture, which: 'lat' | 'lon'): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'sensor',
        onPick: (id: string) => {
          if (which === 'lat') r.latEntity = id; else r.lonEntity = id;
          this.planner.save(); this.planner.emitConfig();
        },
      },
    }));
  }

  // ── Cameras section (FOV frustum + snapshot) ──────────────────────────
  private _camerasSection() {
    const list = this.planner.floor().cameras ?? [];
    if (list.length === 0) return nothing;
    return this._section('cameras', 'Cameras', () =>
      this._groupedList('cameras', list, c => this._cameraItem(c)));
  }

  private _cameraItem(c: CameraFixture) {
    const p = this.planner;
    const sel = p.activeCameraId === c.id;
    const st = c.entity_id && p.hass ? p.hass.states[c.entity_id] : null;
    const recording = st?.state === 'recording';
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveCamera(c.id)}>
          <div class="dot" style="background:${recording ? '#ef5350' : '#4dd0e1'}"></div>
          <div class="nm">📷 ${c.label?.trim() || 'Camera'}${this._batteryText(c.entity_id)}</div>
          <div class="badge" style=${recording ? 'color:#ef5350;font-weight:700' : nothing}>${recording ? 'REC' : (c.entity_id ? (st?.state ?? '—') : 'unbound')}</div>
        </div>
        ${sel ? this._cameraEditor(c) : nothing}
      </div>
    `;
  }

  private _cameraEditor(c: CameraFixture) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    const pic = c.entity_id && p.hass
      ? (p.hass.states[c.entity_id]?.attributes as Record<string, unknown> | undefined)?.entity_picture
      : null;
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" .value=${c.label ?? ''} placeholder="Camera"
                 @input=${(e: Event) => upd(() => { c.label = (e.target as HTMLInputElement).value; })}>
        </div>
        ${this._lockRow(c)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(c.x))}
                 @input=${(e: Event) => upd(() => { c.x = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(c.y))}
                 @input=${(e: Event) => upd(() => { c.y = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Facing (°)</label>
          <input type="number" .value=${String(Math.round(c.rotation ?? 0))}
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                   c.rotation = ((Math.round(v) % 360) + 360) % 360;
                 })}>
        </div>
        <div class="row"><label>FOV (°)</label>
          <input type="number" min="5" max="180" .value=${String(cameraFov(c))}
                 @input=${(e: Event) => upd(() => { c.fov = parseFloat((e.target as HTMLInputElement).value) || CAMERA_DEFAULTS.fov; })}>
        </div>
        <div class="row"><label>Range (mm)</label>
          <input type="number" min="200" .value=${String(cameraRange(c))}
                 @input=${(e: Event) => upd(() => { c.range = parseFloat((e.target as HTMLInputElement).value) || CAMERA_DEFAULTS.range; })}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" .value=${String(cameraHeight(c))}
                 @input=${(e: Event) => upd(() => { c.height = parseFloat((e.target as HTMLInputElement).value) || CAMERA_DEFAULTS.height; })}>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${c.entity_id || '— unbound —'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickCameraEntity(c)}>
            ${c.entity_id ? 'Rebind' : 'Bind'}…
          </button>
          ${c.entity_id ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { c.entity_id = null; })}>Unbind</button>
          ` : nothing}
        </div>
        ${typeof pic === 'string' && pic ? html`
          <div style="margin-top:6px;position:relative">
            <img src=${p.haBaseUrl + pic + (pic.includes('?') ? '&' : '?') + '_cb=' + this._camSnapCb}
                 style="width:100%;border-radius:4px;display:block;background:#000"
                 @error=${(e: Event) => { (e.target as HTMLImageElement).style.display = 'none'; }}>
            <button class="btn" style="position:absolute;top:4px;right:4px;font-size:10px;padding:2px 6px"
                    title="Refresh snapshot"
                    @click=${() => { this._camSnapCb = Date.now(); this.requestUpdate(); }}>↻</button>
          </div>
        ` : nothing}
        ${(() => {
          // Alert sensor: a binary_sensor (motion/person/doorbell) whose 'on'
          // pulses the FOV wedge + pops a snapshot card (2D + 3D). ~6 s linger.
          const alerting = p.cameraAlerting(c);
          return html`
            <div class="row" style="margin-top:6px"><label title="binary_sensor: 'on' pops a snapshot alert card (6 s linger after off)">Alert sensor</label>
              <span style="font-size:11px;color:${alerting ? '#ef5350' : 'var(--text-dim)'};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                ${c.alertEntity ? `${c.alertEntity}${alerting ? ' · ALERT' : ''}` : '— unbound —'}
              </span>
            </div>
            <div style="display:flex;gap:4px;margin-top:4px">
              <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickCameraAlert(c)}>
                ${c.alertEntity ? 'Rebind' : 'Bind'} alert…
              </button>
              ${c.alertEntity ? html`
                <button class="btn" style="font-size:11px"
                        @click=${() => upd(() => { c.alertEntity = null; })}>Unbind</button>
              ` : nothing}
            </div>
          `;
        })()}
        ${this._cameraFrigateBlock(c, typeof pic === 'string' ? pic : null)}
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.cameras = (f.cameras ?? []).filter(x => x.id !== c.id);
          p.activeCameraId = null;
          p.save(); p.emitConfig();
        }}>Delete camera</button>
      </div>
    `;
  }
  private _camSnapCb = 0;

  // ── Frigate ground-truth targets: name mapping + ground calibration ─────────
  private _cameraFrigateBlock(c: CameraFixture, pic: string | null) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    const calib = c.camCalib;
    const pts = calib?.points ?? [];
    // Live fit readout.
    let fit: { ok: boolean; msg: string } = { ok: false, msg: 'need ≥4 points' };
    if (pts.length >= 4) {
      const h = solveHomography(pts);
      if (!h) fit = { ok: false, msg: 'degenerate (collinear points)' };
      else {
        const res = homographyResidualsMm(h, pts);
        const max = res.reduce((m, r) => Math.max(m, r), 0);
        fit = { ok: true, msg: `solved · max residual ${isFinite(max) ? Math.round(max) : '∞'} mm` };
      }
    } else if (pts.length > 0) {
      fit = { ok: false, msg: `need ≥4 points (${pts.length})` };
    }
    const arming = p.placingCamCalibId === c.id;
    const defName = slugifyFrigateName(c.label || '');
    return html`
      <div style="background:rgba(30,60,80,0.25);border-radius:4px;padding:6px;margin-top:8px">
        <div style="font-size:11px;color:var(--text-dim);font-weight:600;margin-bottom:4px">Frigate ground truth</div>
        <div class="row"><label title="The Frigate camera name in frigate/events (after.camera).">Frigate name</label>
          <input type="text" .value=${c.frigateName ?? ''} placeholder=${defName || 'camera name'}
                 @input=${(e: Event) => upd(() => { c.frigateName = (e.target as HTMLInputElement).value || undefined; })}>
        </div>
        <div class="row"><label>Dot color</label>
          <input type="color" .value=${cameraColor(c, (p.floor().cameras ?? []).indexOf(c))}
                 @input=${(e: Event) => upd(() => { c.color = (e.target as HTMLInputElement).value; })}>
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin:6px 0 3px">
          Ground calibration — click a point on the snapshot, then the matching spot on the plan (≥4 pairs).
        </div>
        <div style="font-size:10px;color:#ffb74d;margin-bottom:4px">
          Frigate reports boxes at the DETECT resolution, often lower than the stream.
        </div>
        <div class="row"><label>Detect W</label>
          <input type="number" min="1" .value=${calib?.detectW ? String(calib.detectW) : ''} placeholder="auto"
                 @input=${(e: Event) => upd(() => { this._ensureCalib(c).detectW = parseFloat((e.target as HTMLInputElement).value) || undefined; })}>
        </div>
        <div class="row"><label>Detect H</label>
          <input type="number" min="1" .value=${calib?.detectH ? String(calib.detectH) : ''} placeholder="auto"
                 @input=${(e: Event) => upd(() => { this._ensureCalib(c).detectH = parseFloat((e.target as HTMLInputElement).value) || undefined; })}>
        </div>
        ${pic ? html`
          <div style="margin-top:6px;position:relative">
            <img src=${p.haBaseUrl + pic + (pic.includes('?') ? '&' : '?') + '_cb=' + this._camSnapCb}
                 style="width:100%;border-radius:4px;display:block;background:#000;cursor:crosshair"
                 @load=${(e: Event) => {
                   // Default the detect resolution to the snapshot's natural size.
                   const img = e.target as HTMLImageElement;
                   if (!c.camCalib?.detectW && img.naturalWidth) {
                     this._ensureCalib(c).detectW = img.naturalWidth;
                     this._ensureCalib(c).detectH = img.naturalHeight;
                     p.save(); this.requestUpdate();
                   }
                 }}
                 @click=${(e: MouseEvent) => this._onCalibSnapshotClick(c, e)}
                 @error=${(e: Event) => { (e.target as HTMLImageElement).style.display = 'none'; }}>
            ${arming ? html`<div style="position:absolute;inset:0;border:2px solid #4fc3f7;border-radius:4px;pointer-events:none"></div>` : nothing}
          </div>
        ` : html`<div style="font-size:10px;color:var(--text-dim);margin-top:4px">Bind a camera.* entity for a snapshot to calibrate against.</div>`}
        ${arming ? html`<div style="font-size:10px;color:#4fc3f7;margin-top:4px">Now click the matching point on the floor plan…</div>` : nothing}
        <div style="margin-top:6px">
          ${pts.map((pp, i) => html`
            <div class="row" style="font-size:10px;padding:1px 0">
              <span>${i + 1}. px(${Math.round(pp.u)},${Math.round(pp.v)}) → mm(${pp.x},${pp.y})</span>
              <button class="btn" style="font-size:10px;padding:0 6px"
                      @click=${() => upd(() => { pts.splice(i, 1); p.ensureFrigateSub(); })}>✕</button>
            </div>
          `)}
        </div>
        <div style="font-size:10px;color:${fit.ok ? '#69f0ae' : 'var(--text-dim)'};margin-top:4px">${fit.msg}</div>
      </div>
    `;
  }

  private _ensureCalib(c: CameraFixture) {
    if (!c.camCalib) c.camCalib = { points: [] };
    return c.camCalib;
  }

  // Snapshot click: record u/v scaled from the displayed image into DETECT-
  // resolution pixels, then arm a plan click (geo-landmark latch idiom) to
  // capture the matching floor point.
  private _onCalibSnapshotClick(c: CameraFixture, e: MouseEvent): void {
    const img = e.currentTarget as HTMLImageElement;
    const rect = img.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const dw = c.camCalib?.detectW || img.naturalWidth || rect.width;
    const dh = c.camCalib?.detectH || img.naturalHeight || rect.height;
    const p = this.planner;
    p.pendingCamCalibUV = { u: Math.round(fx * dw), v: Math.round(fy * dh) };
    p.placingCamCalibId = c.id;
    p.maybeCloseSidebarForPlacement();
    p.emitConfig();
  }

  private _pickCameraEntity(c: CameraFixture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'camera',
        onPick: (id: string) => {
          c.entity_id = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  private _pickCameraAlert(c: CameraFixture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'binary_sensor',
        onPick: (id: string) => {
          c.alertEntity = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // ── Projectors section (home-theater arc) ─────────────────────────────
  private _projectorsSection() {
    const list = this.planner.floor().projectors ?? [];
    if (list.length === 0) return nothing;
    return this._section('projectors', 'Projectors', () =>
      this._groupedList('projectors', list, pr => this._projectorItem(pr)));
  }

  private _projectorItem(pr: ProjectorFixture) {
    const p = this.planner;
    const sel = p.activeProjectorId === pr.id;
    const projecting = (p.effectiveState(pr)?.state === 'on' || p.effectiveState(pr)?.state === 'playing');
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveProjector(pr.id)}>
          <div class="dot" style="background:${projecting ? projectorBeamColor(pr) : '#5c6bc0'}"></div>
          <div class="nm">📽 ${pr.label?.trim() || 'Projector'}${this._batteryText(pr.entity_id ?? null)}</div>
          <div class="badge">${projecting ? 'ON' : (pr.entity_id ? (p.effectiveState(pr)?.state ?? '—') : (pr.localState ? `local: ${pr.localState}` : 'off'))}</div>
        </div>
        ${sel ? this._projectorEditor(pr) : nothing}
      </div>
    `;
  }

  private _projectorEditor(pr: ProjectorFixture) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    // Screens this projector can aim at: wall_tv / tv pieces on the floor.
    const screens = p.floor().furniture.filter(fu => fu.kind === 'wall_tv' || fu.kind === 'tv');
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" .value=${pr.label ?? ''} placeholder="Projector"
                 @input=${(e: Event) => upd(() => { pr.label = (e.target as HTMLInputElement).value; })}>
        </div>
        ${this._lockRow(pr)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(pr.x))}
                 @input=${(e: Event) => upd(() => { pr.x = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(pr.y))}
                 @input=${(e: Event) => upd(() => { pr.y = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" .value=${String(projectorHeight(pr))}
                 @input=${(e: Event) => upd(() => { pr.height = parseFloat((e.target as HTMLInputElement).value) || PROJECTOR_DEFAULTS.height; })}>
        </div>
        <div class="row"><label>Target screen</label>
          <select .value=${pr.screenId ?? ''}
                  @change=${(e: Event) => upd(() => {
                    const v = (e.target as HTMLSelectElement).value;
                    pr.screenId = v || null;
                  })}>
            <option value="" ?selected=${!pr.screenId}>— aim by rotation —</option>
            ${screens.map(s => html`<option value=${s.id} ?selected=${pr.screenId === s.id}>${s.label?.trim() || FURNITURE_KINDS[s.kind ?? 'block'].label}</option>`)}
          </select>
        </div>
        ${!pr.screenId ? html`
          <div class="row"><label>Aim (°)</label>
            <input type="number" step="15" .value=${String(Math.round(pr.rotation ?? 0))}
                   @input=${(e: Event) => upd(() => {
                     const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                     pr.rotation = ((Math.round(v) % 360) + 360) % 360;
                   })}>
          </div>` : nothing}
        <div class="row"><label title="Throw ratio D:W — scales the beam spread + heading-only reach">Throw ratio</label>
          <input type="number" min="0.2" step="0.1" .value=${String(projectorThrow(pr))}
                 @input=${(e: Event) => upd(() => { pr.throwRatio = parseFloat((e.target as HTMLInputElement).value) || PROJECTOR_DEFAULTS.throwRatio; })}>
        </div>
        <div class="row"><label>Beam color</label>
          <input type="color" .value=${projectorBeamColor(pr)}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${(e: Event) => upd(() => { pr.beamColor = (e.target as HTMLInputElement).value; })}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Reset to the default beam color"
                  @click=${() => upd(() => { pr.beamColor = undefined; })}>✕</button>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${pr.entity_id || '— unbound —'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickProjectorEntity(pr)}>
            ${pr.entity_id ? 'Rebind' : 'Bind'}…
          </button>
          ${pr.entity_id ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { pr.entity_id = null; })}>Unbind</button>` : nothing}
          <button class="btn" style="font-size:11px"
                  @click=${() => upd(() => {
                    p.floor().projectors = (p.floor().projectors ?? []).filter(x => x.id !== pr.id);
                    if (p.activeProjectorId === pr.id) p.activeProjectorId = null;
                  })}>Delete</button>
        </div>
      </div>
    `;
  }

  private _pickProjectorEntity(pr: ProjectorFixture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: ['media_player', 'switch', 'light'],
        onPick: (id: string) => { pr.entity_id = id; this.planner.save(); this.planner.emitConfig(); },
      },
    }));
  }

  // ── Water valves section (Phase 2b) ──────────────────────────────────
  private _valvesSection() {
    const list = this.planner.floor().valves ?? [];
    if (list.length === 0) return nothing;
    return this._section('valves', 'Valves', () =>
      this._groupedList('valves', list, v => this._valveItem(v)));
  }

  private _valveItem(v: ValveFixture) {
    const p = this.planner;
    const sel = p.activeValveId === v.id;
    const st = p.effectiveState(v);
    const flowing = valveFlowing(st);
    const pct = Math.round(valveOpenness(st) * 100);
    const badge = st ? (flowing ? `open ${pct}%` : 'closed') : (v.entity_id ? 'n/a' : '—');
    const col = flowing ? '#4fc3f7' : (st ? '#90a4ae' : '#607d8b');
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveValve(v.id)}>
          <div class="dot" style="background:${col}"></div>
          <div class="nm">${v.label?.trim() || 'Valve'}${this._batteryText(v.entity_id)}</div>
          <div class="badge" style="color:${col}">${badge}</div>
        </div>
        ${sel ? this._valveEditor(v) : nothing}
      </div>
    `;
  }

  private _valveEditor(v: ValveFixture) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" .value=${v.label ?? ''} placeholder="Valve"
                 @input=${(e: Event) => upd(() => { v.label = (e.target as HTMLInputElement).value; })}>
        </div>
        ${this._lockRow(v)}
        <div class="row"><label>Rotation (°)</label>
          <input type="number" .value=${String(Math.round(v.rotation ?? 0))}
                 @input=${(e: Event) => upd(() => { v.rotation = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label title="Permit open/close from the panel. Off = view-only status.">Allow open/close</label>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${v.allowControl !== false}
                   @change=${(e: Event) => upd(() => { v.allowControl = (e.target as HTMLInputElement).checked; })}>
            <span></span>
          </span>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${v.entity_id || '— unbound —'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickValveEntity(v)}>
            ${v.entity_id ? 'Rebind' : 'Bind'}…
          </button>
          ${v.entity_id ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { v.entity_id = null; })}>Unbind</button>
          ` : nothing}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          ${v.entity_id
            ? 'Bind a valve.* (open/close) or switch.* (irrigation zone). Clicking the valve opens/closes it; water flows while open.'
            : 'Unbound: clicking the valve flips a local demo open/closed state.'}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.valves = (f.valves ?? []).filter(x => x.id !== v.id);
          p.activeValveId = null;
          p.save(); p.emitConfig();
        }}>Delete</button>
      </div>
    `;
  }

  private _pickValveEntity(v: ValveFixture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: ['valve', 'switch', 'binary_sensor'],
        onPick: (id: string) => { v.entity_id = id; this.planner.save(); this.planner.emitConfig(); },
      },
    }));
  }

  // ── Smart plugs section (Phase 2b) ────────────────────────────────────
  private _plugsSection() {
    const list = this.planner.floor().plugs ?? [];
    if (list.length === 0) return nothing;
    return this._section('plugs', 'Smart plugs', () =>
      this._groupedList('plugs', list, pl => this._plugItem(pl)));
  }

  private _plugItem(pl: PlugFixture) {
    const p = this.planner;
    const sel = p.activePlugId === pl.id;
    const st = p.effectiveState(pl);
    const on = st?.state === 'on' || st?.state === 'playing';
    const powerW = pl.powerEntity && p.hass?.states
      ? parseFloat(p.hass.states[pl.powerEntity]?.state ?? '') : NaN;
    const badge = st ? (on ? (isFinite(powerW) ? `${Math.round(powerW)}W` : 'on') : 'off') : (pl.entity_id ? 'n/a' : '—');
    const col = on ? '#69f0ae' : (st ? '#90a4ae' : '#607d8b');
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActivePlug(pl.id)}>
          <div class="dot" style="background:${col}"></div>
          <div class="nm">${pl.label?.trim() || 'Plug'}${this._batteryText(pl.entity_id)}</div>
          <div class="badge" style="color:${col}">${badge}</div>
        </div>
        ${sel ? this._plugEditor(pl) : nothing}
      </div>
    `;
  }

  private _plugEditor(pl: PlugFixture) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" .value=${pl.label ?? ''} placeholder="Plug"
                 @input=${(e: Event) => upd(() => { pl.label = (e.target as HTMLInputElement).value; })}>
        </div>
        ${this._lockRow(pl)}
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="0" .value=${String(Math.round(plugHeight(pl)))}
                 @input=${(e: Event) => upd(() => {
                   const val = parseFloat((e.target as HTMLInputElement).value);
                   pl.height = isFinite(val) ? Math.max(0, val) : undefined;
                 })}>
        </div>
        <div class="row"><label title="Permit toggle from the panel. Off = view-only status.">Allow toggle</label>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${pl.allowControl !== false}
                   @change=${(e: Event) => upd(() => { pl.allowControl = (e.target as HTMLInputElement).checked; })}>
            <span></span>
          </span>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${pl.entity_id || '— unbound —'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickPlugEntity(pl)}>
            ${pl.entity_id ? 'Rebind' : 'Bind'}…
          </button>
          ${pl.entity_id ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { pl.entity_id = null; })}>Unbind</button>
          ` : nothing}
        </div>
        <div class="row" style="margin-top:4px"><label>Power sensor</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${pl.powerEntity || '— none —'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:2px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickPlugPower(pl)}>
            ${pl.powerEntity ? 'Rebind' : 'Bind'} power…
          </button>
          ${pl.powerEntity ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { pl.powerEntity = null; })}>Clear</button>
          ` : nothing}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.plugs = (f.plugs ?? []).filter(x => x.id !== pl.id);
          p.activePlugId = null;
          p.save(); p.emitConfig();
        }}>Delete</button>
      </div>
    `;
  }

  private _pickPlugEntity(pl: PlugFixture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: ['switch', 'light'],
        onPick: (id: string) => { pl.entity_id = id; this.planner.save(); this.planner.emitConfig(); },
      },
    }));
  }

  private _pickPlugPower(pl: PlugFixture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'sensor',
        onPick: (id: string) => { pl.powerEntity = id; this.planner.save(); this.planner.emitConfig(); },
      },
    }));
  }

  // ── Presence zones section (FP2-style occupancy polygons) ─────────────
  private _presenceZonesSection() {
    const p = this.planner;
    const list = p.floor().presenceZones ?? [];
    const drawing = !!p.drawingPresenceZone;
    if (list.length === 0 && !drawing) return nothing;
    return this._section('pzones', 'Presence zones', () => html`
      ${drawing ? html`
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim);padding:4px 0">
          <span style="flex:1">▱ Click to add vertices; double-click / Enter to finish (${p.drawingPresenceZone!.points.length} pts).</span>
          <button class="btn" style="font-size:10px;padding:2px 6px"
                  @click=${() => { p.drawingPresenceZone = null; p.emitConfig(); }}>Cancel</button>
        </div>` : nothing}
      ${list.map(z => this._pzoneItem(z))}
      <button class="btn" style="width:100%;margin-top:6px" @click=${() => { p.setTool('pzone'); p.maybeCloseSidebarForPlacement(); }}>
        + Add zone
      </button>
    `);
  }

  private _pzoneItem(z: PresenceZone) {
    const p = this.planner;
    const sel = p.activePZoneId === z.id;
    const st = z.entity_id && p.hass ? p.hass.states[z.entity_id] : null;
    const occupied = st?.state === 'on';
    const col = presenceZoneColor(z);
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActivePZone(z.id)}>
          <div class="dot" style="background:${occupied ? col : '#607d8b'}"></div>
          <div class="nm">▱ ${z.name?.trim() || 'Zone'}</div>
          <div class="badge" style=${occupied ? `color:${col};font-weight:700` : nothing}>${occupied ? 'occupied' : (z.entity_id ? 'clear' : 'unbound')}</div>
        </div>
        ${sel ? this._pzoneEditor(z) : nothing}
      </div>
    `;
  }

  private _pzoneEditor(z: PresenceZone) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Name</label>
          <input type="text" .value=${z.name ?? ''} placeholder="Zone"
                 @input=${(e: Event) => upd(() => { z.name = (e.target as HTMLInputElement).value; })}>
        </div>
        <div class="row"><label>Color</label>
          <input type="color" .value=${presenceZoneColor(z)}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${(e: Event) => upd(() => { z.color = (e.target as HTMLInputElement).value; })}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Reset to default" @click=${() => upd(() => { z.color = undefined; })}>↺</button>
        </div>
        <div class="row"><label>Hidden</label>
          <button class="btn" style="font-size:11px;flex:1"
                  @click=${() => upd(() => { z.hidden = !z.hidden; })}>${z.hidden ? '🙈 Hidden' : '👁 Shown'}</button>
        </div>
        ${this._lockRow(z)}
        <div style="font-size:10px;color:var(--text-dim);margin:2px 0">${z.points.length} vertices · drag the orange handles to reshape (Select mode)</div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${z.entity_id || '— unbound —'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickPZoneEntity(z)}>
            ${z.entity_id ? 'Rebind' : 'Bind'}…
          </button>
          ${z.entity_id ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { z.entity_id = null; })}>Unbind</button>
          ` : nothing}
          <button class="btn" style="font-size:11px"
                  title="Re-draw the polygon on the plan (replaces the points)"
                  @click=${() => { p.drawingPresenceZone = { points: [], id: z.id }; p.setTool('pzone'); p.maybeCloseSidebarForPlacement(); p.emitConfig(); }}>Redraw</button>
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          Bound: the zone glows when the occupancy binary_sensor is on (FP2 zone / Frigate / any presence).
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.presenceZones = (f.presenceZones ?? []).filter(x => x.id !== z.id);
          p.activePZoneId = null;
          p.save(); p.emitConfig();
        }}>Delete zone</button>
      </div>
    `;
  }

  private _pickPZoneEntity(z: PresenceZone): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'binary_sensor',
        onPick: (id: string) => {
          z.entity_id = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // ── Ground / Yard section (ground covering polygons) ──────────────────
  private _groundSection() {
    const p = this.planner;
    const list = p.floor().groundAreas ?? [];
    const drawing = !!p.drawingGroundArea;
    return this._section('ground', 'Ground / Yard', () => html`
      ${drawing ? html`
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim);padding:4px 0">
          <span style="flex:1">▨ Click to add vertices; double-click / Enter to finish (${p.drawingGroundArea!.points.length} pts).</span>
          <button class="btn" style="font-size:10px;padding:2px 6px"
                  @click=${() => { p.drawingGroundArea = null; p.emitConfig(); }}>Cancel</button>
        </div>` : nothing}
      ${list.map(g => this._groundItem(g))}
      <button class="btn" style="width:100%;margin-top:6px" @click=${() => { p.setTool('ground'); p.maybeCloseSidebarForPlacement(); }}>
        + Add area
      </button>
    `);
  }

  private _groundItem(g: GroundArea) {
    const p = this.planner;
    const sel = p.activeGroundAreaId === g.id;
    const col = groundAreaColor(g);
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveGroundArea(g.id)}>
          <div class="dot" style="background:${col}"></div>
          <div class="nm">▨ ${g.name?.trim() || GROUND_KINDS[g.kind]?.label || g.kind}</div>
          <div class="badge">${GROUND_KINDS[g.kind]?.label ?? g.kind}</div>
        </div>
        ${sel ? this._groundEditor(g) : nothing}
      </div>
    `;
  }

  private _groundEditor(g: GroundArea) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Kind</label>
          <select @change=${(e: Event) => upd(() => { g.kind = (e.target as HTMLSelectElement).value as GroundKind; })}>
            ${(Object.keys(GROUND_KINDS) as GroundKind[]).map(k => html`
              <option value=${k} ?selected=${g.kind === k}>${GROUND_KINDS[k].label}</option>`)}
          </select>
        </div>
        <div class="row"><label>Name</label>
          <input type="text" .value=${g.name ?? ''} placeholder=${GROUND_KINDS[g.kind]?.label ?? 'Area'}
                 @input=${(e: Event) => upd(() => { g.name = (e.target as HTMLInputElement).value; })}>
        </div>
        <div class="row"><label>Hidden</label>
          <button class="btn" style="font-size:11px;flex:1"
                  @click=${() => upd(() => { g.hidden = !g.hidden; })}>${g.hidden ? '🙈 Hidden' : '👁 Shown'}</button>
        </div>
        ${this._lockRow(g)}
        <div style="font-size:10px;color:var(--text-dim);margin:2px 0">${g.points.length} vertices · drag the orange handles to reshape (Select mode)</div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px"
                  title="Re-draw the polygon on the plan (replaces the points)"
                  @click=${() => { p.drawingGroundArea = { points: [], id: g.id }; p.setTool('ground'); p.maybeCloseSidebarForPlacement(); p.emitConfig(); }}>Redraw</button>
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.groundAreas = (f.groundAreas ?? []).filter(x => x.id !== g.id);
          p.activeGroundAreaId = null;
          p.save(); p.emitConfig();
        }}>Delete area</button>
      </div>
    `;
  }

  // ── Floor voids section (holes cut from the slab) ─────────────────────
  private _voidSection() {
    const p = this.planner;
    const list = p.floor().voidAreas ?? [];
    const drawing = !!p.drawingVoidArea;
    return this._section('voids', 'Floor voids', () => html`
      ${drawing ? html`
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim);padding:4px 0">
          <span style="flex:1">🕳 Click to add vertices; double-click / Enter to finish (${p.drawingVoidArea!.points.length} pts).</span>
          <button class="btn" style="font-size:10px;padding:2px 6px"
                  @click=${() => { p.drawingVoidArea = null; p.emitConfig(); }}>Cancel</button>
        </div>` : nothing}
      ${list.map((v, i) => this._voidItem(v, i))}
      <div style="font-size:10px;color:var(--text-dim);margin:4px 0">A void cuts a hole in the floor — avatars route around it unless a stair bridges it.</div>
      <button class="btn" style="width:100%;margin-top:6px" @click=${() => { p.setTool('void'); p.maybeCloseSidebarForPlacement(); }}>
        + Draw void
      </button>
    `);
  }

  private _voidItem(v: VoidArea, i: number) {
    const p = this.planner;
    const sel = p.activeVoidAreaId === v.id;
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveVoidArea(v.id)}>
          <div class="dot" style="background:#222"></div>
          <div class="nm">🕳 Void ${i + 1}</div>
          <div class="badge">${v.points.length} pts</div>
        </div>
        ${sel ? this._voidEditor(v) : nothing}
      </div>
    `;
  }

  private _voidEditor(v: VoidArea) {
    const p = this.planner;
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        ${this._lockRow(v)}
        <div style="font-size:10px;color:var(--text-dim);margin:2px 0">${v.points.length} vertices · drag the orange handles to reshape (Select mode)</div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px"
                  title="Re-draw the polygon on the plan (replaces the points)"
                  @click=${() => { p.drawingVoidArea = { points: [], id: v.id }; p.setTool('void'); p.maybeCloseSidebarForPlacement(); p.emitConfig(); }}>Redraw</button>
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px" @click=${() => {
          const f = p.floor();
          f.voidAreas = (f.voidAreas ?? []).filter(x => x.id !== v.id);
          p.activeVoidAreaId = null;
          p.save(); p.emitConfig();
        }}>Delete void</button>
      </div>
    `;
  }

  // ── People section (identity registry) ────────────────────────────────
  private _bermudaKicked = false;

  private _peopleSection() {
    const p = this.planner;
    const people = p.store.people ?? [];
    const bermudaOn = p.store.bermudaEnabled !== false;
    // Kick a one-shot Bermuda scan the first time this section renders with a
    // live connection so the person-binding device list is ready.
    if (bermudaOn && !this._bermudaKicked && p.hass && !p.bermuda) {
      this._bermudaKicked = true;
      void p.scanBermuda();
    }
    return this._section('people', 'People', () => html`
        ${bermudaOn ? html`
          <label class="row" style="padding:0;margin-bottom:6px"
                 title="Show BLE devices configured in Bermuda but not mapped to a person (uses the fallback avatar pool). Consumed by trilateration in a later phase.">
            <span style="color:var(--text-dim);font-size:11px;flex:1">Show unknown BLE devices</span>
            <span class="mini-toggle">
              <input type="checkbox" .checked=${p.store.bleShowUnknown !== false}
                     @change=${(e: Event) => p.setBleShowUnknown((e.target as HTMLInputElement).checked)}>
              <span></span>
            </span>
          </label>` : nothing}
        ${people.length === 0
          ? html`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
              None yet. Add people to give BLE / GPS presence a name, avatar, and color.
            </div>`
          : people.map(pe => this._personItem(pe))}
        <button class="btn" style="width:100%;margin-top:6px" @click=${() => p.addPerson()}>
          + Add person
        </button>
        ${bermudaOn ? this._bermudaSubsection() : nothing}
    `);
  }

  private _personItem(pe: DioramaPerson) {
    const p = this.planner;
    const sel = p.activePersonId === pe.id;
    const color = pe.color || '#90caf9';
    // BLE-solved floor: when it differs from the current floor, note where the
    // person actually is ("on <floor>"). Cheap map hits (see solvedFloorIdFor).
    const solvedFloorId = p.solvedFloorIdFor(pe.id);
    const onFloor = solvedFloorId && solvedFloorId !== p.floor().id
      ? (p.store.floors.find(f => f.id === solvedFloorId)?.name ?? null) : null;
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActivePerson(pe.id)}>
          <div class="dot" style="background:${color}"></div>
          <div class="nm">${pe.name || 'Person'}${pe.isPet ? ' 🐾' : ''}${
            onFloor ? html`<span style="font-size:10px;color:var(--text-dim);margin-left:5px">on ${onFloor}</span>` : nothing}</div>
          <div class="badge ${pe.bermudaDeviceId || pe.haPersonId ? 'bound' : ''}">
            ${pe.bermudaDeviceId ? '📶' : pe.haPersonId ? 'GPS' : '—'}
          </div>
        </div>
        ${this._gpsStatusLine(pe)}
        ${sel ? this._personEditor(pe) : nothing}
      </div>
    `;
  }

  // GPS status subtitle for a person: zone glyph + distance/accuracy +
  // staleness. Shown only when the person has a GPS source. A bound source with
  // no current fix (uncalibrated transform or missing lat/lon) reads muted.
  private _gpsStatusLine(pe: DioramaPerson) {
    if (!pe.haPersonId && !pe.gpsTrackerId) return nothing;
    const dim = (msg: string) => html`<div style="font-size:10px;color:var(--text-dim);padding:0 0 3px 20px">${msg}</div>`;
    const fix = this.planner.gpsFixFor(pe);
    if (!fix) return nothing;
    if (!fix.found) return dim(`GPS: entity not found (${fix.entityId})`);
    if (fix.lat == null || fix.lon == null) return dim(`GPS: no location from ${fix.entityId}`);
    const accTxt = fix.accuracyM != null ? ` · ±${Math.round(fix.accuracyM)}m` : '';
    const pin = this.planner.gpsPins.find(g => g.personId === pe.id);
    if (pin) {
      const where = pin.zone === 'indoor'
        ? `indoors ~±${Math.round(pin.accuracyMm / 1000)} m`
        : `${Math.round(pin.distanceM)} m ${compass8(pin.bearingDeg)}`;
      // Append accuracy only when the "where" text doesn't already carry it (indoor does),
      // and the age (previously stale-only; now always so a fresh fix reads its age too).
      const acc = pin.zone === 'indoor' ? '' : accTxt;
      const age = ` · ${gpsAgeText(pin.lastUpdated)}`;
      return html`<div style="font-size:10px;color:${pin.stale ? 'var(--text-dim)' : '#4dd0e1'};padding:0 0 3px 20px">
        ${gpsZoneGlyph(pin.zone)} ${where}${acc}${age}</div>`;
    }
    // Fix exists but the geo transform is uncalibrated (quality 'none') → no pin.
    return dim(`GPS: fix${accTxt} · ${gpsAgeText(fix.lastUpdated)} — calibrate a landmark to map it`);
  }

  private _personEditor(pe: DioramaPerson) {
    const p = this.planner;
    const upd = (mut: (x: DioramaPerson) => void) => p.updatePerson(pe.id, mut);
    const bermudaName = pe.bermudaDeviceId
      ? (p.bermuda?.devices.find(d => d.deviceId === pe.bermudaDeviceId)?.name || pe.bermudaDeviceId)
      : null;
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Name</label>
          <input type="text" .value=${pe.name}
                 @input=${(e: Event) => upd(x => { x.name = (e.target as HTMLInputElement).value; })}>
        </div>
        <div class="row"><label>Avatar</label>
          <select @change=${(e: Event) => upd(x => {
                    const v = (e.target as HTMLSelectElement).value;
                    x.avatarKind = v ? v as AvatarKind : undefined;
                  })}>
            <option value="" ?selected=${!pe.avatarKind}>Auto (fallback pool)</option>
            ${listActivePacks().map(({ def, members }) => html`
              <optgroup label=${def.label}>
                ${members.map(m => html`
                  <option value=${m.id} ?selected=${pe.avatarKind === m.id}>${m.label}</option>`)}
              </optgroup>`)}
          </select>
        </div>
        <div class="row"><label>Color</label>
          <input type="color" .value=${pe.color || '#90caf9'}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${(e: Event) => upd(x => { x.color = (e.target as HTMLInputElement).value; })}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Clear color" @click=${() => upd(x => { x.color = undefined; })}>↺</button>
        </div>
        <div class="row"><label>Pet</label>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${!!pe.isPet}
                   @change=${(e: Event) => upd(x => { x.isPet = (e.target as HTMLInputElement).checked; })}>
            <span></span>
          </span>
        </div>
        <div class="row" title="Let this person's rig change into a situational outfit (pajamas / workout / apron). Turn off to keep them in their normal look. Requires the global 'Avatars change outfits' setting.">
          <label>Allow outfit changes</label>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${pe.allowCostumes !== false}
                   @change=${(e: Event) => upd(x => { x.allowCostumes = (e.target as HTMLInputElement).checked; })}>
            <span></span>
          </span>
        </div>
        <div class="row"><label>Person entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${pe.haPersonId || '—'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:2px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickPersonEntity(pe)}>
            ${pe.haPersonId ? 'Rebind' : 'Bind'}…
          </button>
          ${pe.haPersonId ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(x => { x.haPersonId = undefined; })}>Unbind</button>` : nothing}
        </div>
        ${p.store.bermudaEnabled !== false ? html`
          <div class="row" style="margin-top:4px"><label>Bermuda device</label>
            <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${bermudaName || '—'}
            </span>
          </div>
          <div style="display:flex;gap:4px;margin-top:2px">
            <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickBermudaDevice(pe)}>
              ${pe.bermudaDeviceId ? 'Rebind' : 'Bind'}…
            </button>
            ${pe.bermudaDeviceId ? html`
              <button class="btn" style="font-size:11px"
                      @click=${() => upd(x => { x.bermudaDeviceId = undefined; })}>Unbind</button>` : nothing}
          </div>
        ` : nothing}
        <div class="row" style="margin-top:4px"><label>GPS tracker</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${pe.gpsTrackerId || '—'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:2px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickGpsTracker(pe)}>
            ${pe.gpsTrackerId ? 'Rebind' : 'Bind'}…
          </button>
          ${pe.gpsTrackerId ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(x => { x.gpsTrackerId = undefined; })}>Unbind</button>` : nothing}
        </div>
        <button class="btn danger" style="width:100%;margin-top:6px"
                @click=${() => { if (confirm(`Delete "${pe.name || 'Person'}"?`)) p.deletePerson(pe.id); }}>
          Delete
        </button>
      </div>
    `;
  }

  private _pickPersonEntity(pe: DioramaPerson): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'person',
        onPick: (id: string) => this.planner.updatePerson(pe.id, x => { x.haPersonId = id; }),
      },
    }));
  }

  private _pickGpsTracker(pe: DioramaPerson): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'device_tracker',
        onPick: (id: string) => this.planner.updatePerson(pe.id, x => { x.gpsTrackerId = id; }),
      },
    }));
  }

  private _pickBermudaDevice(pe: DioramaPerson): void {
    const p = this.planner;
    const devs = p.bermuda?.devices ?? [];
    const rows = devs.filter(d => d.deviceId).map(d => ({
      id: d.deviceId!,
      name: d.name,
      subtitle: `${d.scanners.length} scanner(s)` + (d.mac ? ` · ${d.mac}` : ''),
    }));
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        devices: rows, title: 'Pick the Bermuda tracked device',
        onPick: (id: string) => this.planner.updatePerson(pe.id, x => { x.bermudaDeviceId = id; }),
      },
    }));
  }

  // Bermuda discovery + per-scanner distance-entity enable flow.
  private _bermudaSubsection() {
    const p = this.planner;
    const berm = p.bermuda;
    const devices = berm?.devices ?? [];
    return html`
      <div style="margin-top:10px;border-top:1px solid var(--border);padding-top:8px">
        <div class="row" style="margin-bottom:4px">
          <label style="font-weight:600">Bermuda BLE</label>
          <button class="btn" style="font-size:10px;padding:2px 8px"
                  @click=${() => p.scanBermuda()}>Rescan</button>
        </div>
        ${!berm
          ? html`<div style="color:var(--text-dim);font-size:11px;padding:2px 0">
              Scanning… (needs the Bermuda integration + a live HA connection)</div>`
          : devices.length === 0
            ? html`<div style="color:var(--text-dim);font-size:11px;padding:2px 0">
                No Bermuda devices found.</div>`
            : devices.map(d => this._bermudaDeviceRow(d))}
      </div>
    `;
  }

  private _bermudaDeviceRow(d: BermudaDevice) {
    const p = this.planner;
    const total = d.scanners.filter(s => s.rangeEntityId).length;
    const matched = d.scanners.filter(s => s.proxyId).length;
    return html`
      <div style="font-size:11px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.name}</span>
          <span style="color:var(--text-dim);font-size:10px">${total} scanner(s)</span>
        </div>
        <div style="color:var(--text-dim);font-size:10px;margin-top:2px">
          ${matched} matched to a proxy · ${d.disabledCount} distance entit${d.disabledCount === 1 ? 'y' : 'ies'} disabled
        </div>
        ${d.disabledCount > 0 ? html`
          <button class="btn" style="width:100%;font-size:10px;margin-top:3px"
                  title="Enables the disabled per-scanner distance entities. HA may take ~30 s (or an integration reload) before they report."
                  @click=${() => p.enableBermudaDevice(d)}>
            Enable ${d.disabledCount} distance entit${d.disabledCount === 1 ? 'y' : 'ies'}
          </button>
          <div style="color:var(--text-dim);font-size:9px;margin-top:2px;line-height:1.3">
            HA may take ~30 s or an integration reload to start reporting.
          </div>
        ` : nothing}
      </div>
    `;
  }

  // ── Roaming avatars section (Batch A) ─────────────────────────────────
  private _roamersSection() {
    const p = this.planner;
    const roamers = p.floor().roamers ?? [];
    return this._section('roamers', 'Roaming avatars', () => html`
        <div style="color:var(--text-dim);font-size:11px;padding:2px 0 6px">
          Free-range display avatars that wander this floor with a taste for
          interior activities. Not bound to any sensor — always on when enabled.
        </div>
        ${roamers.length === 0
          ? html`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
              None yet. Add a roamer to populate the scene with a wandering person.
            </div>`
          : roamers.map(rm => this._roamerItem(rm))}
        <button class="btn" style="width:100%;margin-top:6px" @click=${() => p.addRoamer()}>
          + Add roamer
        </button>
    `);
  }

  private _roamerItem(rm: Roamer) {
    const p = this.planner;
    const sel = p.activeRoamerId === rm.id;
    const on = rm.enabled !== false;
    const color = rm.color || '#ba68c8';
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActiveRoamer(rm.id)}>
          <div class="dot" style="background:${on ? color : '#555'}"></div>
          <div class="nm" style="${on ? '' : 'opacity:0.5'}">${rm.name || 'Roamer'}</div>
          <label class="mini-toggle" title="Enable / hide this roamer" @click=${(e: Event) => e.stopPropagation()}>
            <input type="checkbox" .checked=${on}
                   @change=${(e: Event) => p.updateRoamer(rm.id, x => { x.enabled = (e.target as HTMLInputElement).checked; })}>
            <span></span>
          </label>
        </div>
        ${sel ? this._roamerEditor(rm) : nothing}
      </div>
    `;
  }

  private _roamerEditor(rm: Roamer) {
    const p = this.planner;
    const upd = (mut: () => void) => p.updateRoamer(rm.id, () => mut());
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Name</label>
          <input type="text" .value=${rm.name ?? ''}
                 @input=${(e: Event) => upd(() => { rm.name = (e.target as HTMLInputElement).value; })}>
        </div>
        <div class="row" title="Color of the spinning plumbob above this roamer. Default = this roamer's color.">
          <label>Plumbob</label>
          <input type="color" .value=${rm.plumbobColor || rm.color || '#ba68c8'}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${(e: Event) => upd(() => { rm.plumbobColor = (e.target as HTMLInputElement).value; })}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Reset to default (this roamer's color)"
                  @click=${() => upd(() => { rm.plumbobColor = undefined; })}>✕</button>
        </div>
        <div class="row" title="Identity tint for this roamer's rig. Default = the standard avatar tint.">
          <label>Color</label>
          <input type="color" .value=${rm.color || '#ba68c8'}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${(e: Event) => upd(() => { rm.color = (e.target as HTMLInputElement).value; })}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Reset to the default tint"
                  @click=${() => upd(() => { rm.color = undefined; })}>✕</button>
        </div>
        ${this._avatarGrid(rm, upd)}
        <button class="btn" style="width:100%;margin-top:6px;color:#ef9a9a"
                @click=${() => { if (confirm(`Delete "${rm.name || 'Roamer'}"?`)) p.deleteRoamer(rm.id); }}>
          Delete roamer
        </button>
      </div>
    `;
  }

  // ── Doors section ─────────────────────────────────────────────────────
  @state() private _doorExpanded = new Set<string>();

  // ── Rooms ───────────────────────────────────────────────────────────────
  private _roomsSection() {
    const p = this.planner;
    const f = p.floor();
    const rooms = f.rooms ?? [];
    const placing = p.placingRoomId;
    // Resolve wall loops once to flag anchors that fall outside every room.
    const loops = rooms.length ? closedWallLoops(f.walls ?? []) : [];
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    return this._section('rooms', 'Rooms', () => html`
        ${placing ? html`
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;
                      color:var(--text-dim);padding:4px 0">
            <span style="flex:1">📍 Click inside a room on the plan…</span>
            <button class="btn" style="font-size:10px;padding:2px 6px"
                    @click=${() => { p.placingRoomId = null; p.emitConfig(); }}>Cancel</button>
          </div>
        ` : nothing}
        ${rooms.length === 0 && !placing
          ? html`<div style="color:var(--text-dim);font-size:11px;padding:4px 0">
              No rooms yet — add one, then click inside a walled area to anchor it.
            </div>`
          : nothing}
        ${rooms.map(rm => {
          const inside = loopContaining(loops, rm.anchor.x, rm.anchor.y) !== null;
          const occ = rm.occupancyEntity && p.hass?.states?.[rm.occupancyEntity]?.state === 'on';
          return html`
            <div class="sensor-item" style="cursor:default;gap:4px">
              ${rm.occupancyEntity ? html`<span title="${occ ? 'Occupied' : 'Not occupied'}"
                     style="color:${occ ? '#66bb6a' : 'var(--text-dim)'};font-size:12px">●</span>` : nothing}
              <input type="text" .value=${rm.name} style="flex:1;min-width:0"
                     placeholder="Room name…"
                     @input=${(e: Event) => upd(() => { rm.name = (e.target as HTMLInputElement).value; })}>
              ${!inside ? html`<span class="badge" title="Anchor is outside every wall loop"
                                     style="color:#ffb74d">⚠ not inside walls</span>` : nothing}
              <button class="icon-btn" title="Re-place anchor"
                      @click=${() => { p.placingRoomId = rm.id; p.maybeCloseSidebarForPlacement(); p.emitConfig(); }}>📍</button>
              <button class="icon-btn" title="Delete"
                      @click=${() => this._deleteRoom(rm.id)}>✕</button>
            </div>
            <div class="row" style="gap:4px;margin:0 0 4px 0">
              <label style="font-size:10px" title="Frigate zone / FP2 / any occupancy binary_sensor">Occupancy</label>
              <span style="font-size:10px;color:${occ ? '#66bb6a' : 'var(--text-dim)'};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                ${rm.occupancyEntity || '— unbound —'}
              </span>
              <button class="btn" style="font-size:10px;padding:2px 6px" @click=${() => this._pickRoomOccupancy(rm)}>
                ${rm.occupancyEntity ? 'Rebind' : 'Bind'}
              </button>
              ${rm.occupancyEntity ? html`
                <button class="btn" style="font-size:10px;padding:2px 6px"
                        @click=${() => upd(() => { rm.occupancyEntity = null; })}>✕</button>` : nothing}
            </div>
          `;
        })}
        <button class="btn" style="width:100%;margin-top:6px"
                @click=${() => { p.placingRoomId = NEW_ROOM; p.maybeCloseSidebarForPlacement(); p.emitConfig(); }}>
          + Add room
        </button>
    `);
  }

  private _deleteRoom(id: string): void {
    const f = this.planner.floor();
    if (f.rooms) f.rooms = f.rooms.filter(r => r.id !== id);
    this.planner.save(); this.planner.emitConfig();
  }

  // Room occupancy binding (#1): any binary_sensor whose 'on' state means the
  // room is occupied (Frigate zone occupancy, Aqara FP2, generic PIR, …).
  private _pickRoomOccupancy(rm: Room): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'binary_sensor',
        onPick: (id: string) => {
          rm.occupancyEntity = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  private _doorsSection() {
    const p = this.planner;
    const f = p.floor();
    if (f.doors.length === 0) return nothing;
    return this._section('doors', 'Doors', () =>
      this._groupedList('doors', f.doors, d => this._doorItem(d, f.doors.indexOf(d))));
  }

  // Unbound-item state badge. When the item carries a local control state
  // (set by clicking it on the canvas) show a dim, clickable "local: on/off"
  // badge so the user understands why it renders active without an HA binding
  // — and can flip it here too. Otherwise the plain "—" (unconfigured).
  private _localBadge(item: { entity_id?: string | null; localState?: string }) {
    const p = this.planner;
    if (!item.localState) return html`<span class="badge">—</span>`;
    return html`
      <button class="badge" style="cursor:pointer;border:none;font-family:inherit;opacity:0.65"
              title="Local control (not bound to HA) — click to toggle"
              @click=${() => p.toggleItem(item)}>local: ${item.localState}</button>`;
  }

  private _doorItem(d: Door, idx: number) {
    const p = this.planner;
    const exp = this._doorExpanded.has(d.id);
    const states = p.hass?.states;
    const st = d.entity_id && states ? states[d.entity_id] : null;
    const isOpen = st?.state === 'on';
    const unavail = st && (st.state === 'unavailable' || st.state === 'unknown');
    const bound = !!d.entity_id;
    const effOpen = !bound && d.localState ? d.localState === 'on' : isOpen;
    const badge = !bound ? '—' : unavail ? 'n/a' : isOpen ? 'OPEN' : 'closed';
    const badgeClass = bound && !unavail && isOpen ? 'bound' : '';
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item" style="cursor:default">
          <div class="dot" style="background:${effOpen ? '#66bb6a' : '#90a4ae'}"></div>
          <div class="nm">${d.label?.trim() || 'Door'}</div>
          ${bound ? html`
            <button class="badge ${badgeClass}" style="cursor:pointer;border:none;font-family:inherit"
                    ?disabled=${unavail || !p.hass}
                    title=${isOpen ? 'Click to toggle (close)' : 'Click to toggle (open)'}
                    @click=${() => p.toggleEntity(d.entity_id)}>
              ${badge}
            </button>
          ` : this._localBadge(d)}
          <button class="icon-btn" title=${bound ? 'Rebind' : 'Bind'}
                  @click=${() => this._pickDoorEntity(d)}>🔗</button>
          <button class="icon-btn" title=${exp ? 'Hide' : 'Edit'}
                  @click=${() => this._toggleDoorExpanded(d.id)}>${exp ? '▾' : '▸'}</button>
          <button class="icon-btn" title="Delete"
                  @click=${() => this._deleteDoor(idx)}>✕</button>
        </div>
        ${exp ? this._doorEditor(d) : nothing}
      </div>
    `;
  }

  private _toggleDoorExpanded(id: string): void {
    if (this._doorExpanded.has(id)) this._doorExpanded.delete(id);
    else                            this._doorExpanded.add(id);
    this.requestUpdate();
  }

  private _deleteDoor(idx: number): void {
    const f = this.planner.floor();
    f.doors.splice(idx, 1);
    this.planner.save(); this.planner.emitConfig();
  }

  private _pickDoorEntity(d: Door): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        // binary_sensor ("on" = open) OR cover.* (garage/entry door with position).
        domain: ['binary_sensor', 'cover'],
        onPick: (id: string) => {
          d.entity_id = id;
          this.planner.save(); this.planner.emitConfig();
        },
      },
    }));
  }

  // Doorbell secondary binding (transient ring pulse). Accepts event.* (Ring/Nest
  // doorbell), binary_sensor.* (rings while on), or button.*/input_button (press
  // timestamp). Display only — no toggle.
  private _pickDoorbell(d: Door): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: ['event', 'binary_sensor', 'button', 'input_button'],
        onPick: (id: string) => {
          d.doorbellEntity = id;
          this.planner.save(); this.planner.emitConfig();
        },
      },
    }));
  }

  private _doorbellBindRow(d: Door, upd: (mut: () => void) => void) {
    const p = this.planner;
    const st = d.doorbellEntity && p.hass?.states ? p.hass.states[d.doorbellEntity] : null;
    const label = !d.doorbellEntity ? '— unbound —' : `${d.doorbellEntity}${st ? ` · ${st.state}` : ''}`;
    return html`
      <div class="row" style="margin-top:6px"><label title="event.* / binary_sensor.* / button.* — a state change rings">Doorbell</label>
        <span style="font-size:11px;color:var(--text-dim);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${label}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickDoorbell(d)}>
          ${d.doorbellEntity ? 'Rebind' : 'Bind'} doorbell…
        </button>
        ${d.doorbellEntity ? html`
          <button class="btn" style="font-size:11px"
                  @click=${() => upd(() => { d.doorbellEntity = null; })}>Unbind</button>
        ` : nothing}
      </div>
    `;
  }

  // lock.* secondary binding. Shows the lock state (padlock in 2D, deadbolt in
  // 3D); the state label is CLICKABLE to toggle — bound → lock.lock/unlock,
  // unbound → the local lockLocalState flag.
  private _doorLockBindRow(d: Door, upd: (mut: () => void) => void) {
    const p = this.planner;
    const s = p.doorLockState(d);
    const bound = !!d.lockEntity;
    const raw = bound ? p.hass?.states?.[d.lockEntity!]?.state : undefined;
    const label = bound
      ? (s === 'locked' ? `${d.lockEntity} · LOCKED`
         : s === 'unlocked' ? `${d.lockEntity} · unlocked`
         : `${d.lockEntity} · ${raw ?? 'n/a'}`)
      : (d.lockLocalState ? `local · ${d.lockLocalState}` : '— unbound —');
    const color = s === 'locked' ? '#ef9a9a' : s === 'unlocked' ? '#66bb6a' : 'var(--text-dim)';
    const hasLock = bound || !!d.lockLocalState;
    // Display-only locks are passive indicators — the badge never toggles.
    const displayOnly = d.lockControl === 'display';
    const clickable = hasLock && !displayOnly;
    return html`
      <div class="row" style="margin-top:6px"><label title="lock.* entity — click the state to toggle">Lock</label>
        <span role="button" title=${clickable ? 'Click to toggle lock' : (displayOnly ? 'Display only — clicks do not lock/unlock' : '')}
              style="font-size:11px;color:${color};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:${clickable ? 'pointer' : 'default'}"
              @click=${() => { if (clickable) { p.toggleDoorLock(d); this.requestUpdate(); } }}>
          ${label}${displayOnly ? ' · display only' : ''}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickDoorLock(d)}>
          ${d.lockEntity ? 'Rebind' : 'Bind'} lock…
        </button>
        ${bound ? html`
          <button class="btn" style="font-size:11px"
                  @click=${() => upd(() => { d.lockEntity = null; })}>Unbind</button>
        ` : html`
          <button class="btn" style="font-size:11px"
                  title="Add / toggle a local (unbound) lock state"
                  @click=${() => upd(() => { d.lockLocalState = d.lockLocalState === 'locked' ? 'unlocked' : 'locked'; })}>
            ${d.lockLocalState ? 'Toggle local' : 'Add local lock'}</button>
        `}
      </div>
      ${hasLock ? html`
        <div class="row" style="margin-top:4px">
          <label title="Display only = the padlock/deadbolt shows live state but never locks/unlocks on tap (a shed padlock, a read-by-policy unit — safe against a stray kiosk tap)">Lock control</label>
          <select style="flex:1;font-size:11px"
                  @change=${(e: Event) => upd(() => { d.lockControl = (e.target as HTMLSelectElement).value === 'display' ? 'display' : 'full'; })}>
            <option value="full" ?selected=${!displayOnly}>Full control</option>
            <option value="display" ?selected=${displayOnly}>Display only</option>
          </select>
        </div>
      ` : nothing}
    `;
  }

  private _pickDoorLock(d: Door): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'lock',
        onPick: (id: string) => {
          d.lockEntity = id;
          this.planner.save(); this.planner.emitConfig();
        },
      },
    }));
  }

  private _doorEditor(d: Door) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" .value=${d.label ?? ''}
                 @input=${(e: Event) => upd(() => { d.label = (e.target as HTMLInputElement).value; })}>
        </div>
        ${this._lockRow(d)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(d.x))}
                 @input=${(e: Event) => upd(() => { d.x = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(d.y))}
                 @input=${(e: Event) => upd(() => { d.y = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Kind</label>
          <select @change=${(e: Event) => upd(() => {
                    const k = (e.target as HTMLSelectElement).value as 'swing' | 'garage';
                    d.kind = k;
                    // Bump a still-default swing width up to a garage-sized opening.
                    if (k === 'garage' && d.w === 800) d.w = 2400;
                  })}>
            <option value="swing" ?selected=${(d.kind ?? 'swing') === 'swing'}>Swing</option>
            <option value="garage" ?selected=${d.kind === 'garage'}>Garage</option>
          </select>
        </div>
        <div class="row"><label>Width (mm)</label>
          <input type="number" min="200" .value=${String(Math.round(d.w))}
                 @input=${(e: Event) => upd(() => {
                   d.w = Math.max(200, parseFloat((e.target as HTMLInputElement).value) || 0);
                 })}>
        </div>
        <div class="row"><label>Rotation (°)</label>
          <input type="number" step="15" .value=${String(Math.round(d.rotation))}
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                   d.rotation = ((Math.round(v / 15) * 15) % 360 + 360) % 360;
                 })}>
        </div>
        ${(d.kind ?? 'swing') === 'garage' ? nothing : html`
        <div class="row"><label>Hinge</label>
          <div style="display:flex;gap:4px">
            <button class="btn ${(d.hinge ?? 'right') === 'left' ? 'active' : ''}"
                    style="font-size:11px;padding:3px 8px"
                    title="Left-hand hinge: door swings clockwise on screen"
                    @click=${() => upd(() => { d.hinge = 'left'; })}>◐ Left</button>
            <button class="btn ${(d.hinge ?? 'right') === 'right' ? 'active' : ''}"
                    style="font-size:11px;padding:3px 8px"
                    title="Right-hand hinge: door swings counter-clockwise on screen"
                    @click=${() => upd(() => { d.hinge = 'right'; })}>Right ◑</button>
          </div>
        </div>`}
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${d.entity_id || '— unbound —'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickDoorEntity(d)}>
            ${d.entity_id ? 'Rebind' : 'Bind'}…
          </button>
          ${d.entity_id ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { d.entity_id = null; })}>Unbind</button>
          ` : nothing}
        </div>
        ${this._doorLockBindRow(d, upd)}
        ${this._doorbellBindRow(d, upd)}
        <div style="font-size:10px;color:var(--text-dim);margin-top:6px;line-height:1.3">
          Hinge at (X,Y). Panel extends along rotation (15° snap). Bind to a
          binary_sensor ("on" = open) or a cover.* (garage / position). Optional
          lock.* padlock + doorbell (event/binary/button) are display only.
        </div>
      </div>
    `;
  }

  // ── Windows section ───────────────────────────────────────────────────
  @state() private _windowExpanded = new Set<string>();

  private _windowsSection() {
    const p = this.planner;
    const f = p.floor();
    if (f.windows.length === 0) return nothing;
    return this._section('windows', 'Windows', () =>
      this._groupedList('windows', f.windows, w => this._windowItem(w, f.windows.indexOf(w))));
  }

  private _windowItem(w: WindowType, idx: number) {
    const p = this.planner;
    const exp = this._windowExpanded.has(w.id);
    const states = p.hass?.states;
    const st = w.entity_id && states ? states[w.entity_id] : null;
    const isOpen = st?.state === 'on';
    const unavail = st && (st.state === 'unavailable' || st.state === 'unknown');
    const bound = !!w.entity_id;
    const effOpen = !bound && w.localState ? w.localState === 'on' : isOpen;
    const badge = !bound ? '—' : unavail ? 'n/a' : isOpen ? 'OPEN' : 'closed';
    const badgeClass = bound && !unavail && isOpen ? 'bound' : '';
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item" style="cursor:default">
          <div class="dot" style="background:${effOpen ? '#66bb6a' : '#64b5f6'}"></div>
          <div class="nm">${w.label?.trim() || 'Window'}</div>
          ${bound ? html`
            <button class="badge ${badgeClass}" style="cursor:pointer;border:none;font-family:inherit"
                    ?disabled=${unavail || !p.hass}
                    title=${isOpen ? 'Click to toggle' : 'Click to toggle'}
                    @click=${() => p.toggleEntity(w.entity_id)}>
              ${badge}
            </button>
          ` : this._localBadge(w)}
          <button class="icon-btn" title=${bound ? 'Rebind' : 'Bind'}
                  @click=${() => this._pickWindowEntity(w)}>🔗</button>
          <button class="icon-btn" title=${exp ? 'Hide' : 'Edit'}
                  @click=${() => this._toggleWindowExpanded(w.id)}>${exp ? '▾' : '▸'}</button>
          <button class="icon-btn" title="Delete"
                  @click=${() => this._deleteWindow(idx)}>✕</button>
        </div>
        ${exp ? this._windowEditor(w) : nothing}
      </div>
    `;
  }

  private _toggleWindowExpanded(id: string): void {
    if (this._windowExpanded.has(id)) this._windowExpanded.delete(id);
    else                              this._windowExpanded.add(id);
    this.requestUpdate();
  }

  private _deleteWindow(idx: number): void {
    const f = this.planner.floor();
    f.windows.splice(idx, 1);
    this.planner.save(); this.planner.emitConfig();
  }

  private _pickWindowEntity(w: WindowType): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'binary_sensor',
        onPick: (id: string) => {
          w.entity_id = id;
          this.planner.save(); this.planner.emitConfig();
        },
      },
    }));
  }

  // Blind / shade / curtain binding (cover.*). Drives a 3D roller shade + a 2D
  // tick. coverFraction: 1 = open (shade up), 0 = closed (shade down).
  private _pickWindowCover(w: WindowType): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'cover',
        onPick: (id: string) => {
          w.coverEntity = id;
          this.planner.save(); this.planner.emitConfig();
        },
      },
    }));
  }

  private _windowCoverBindRow(w: WindowType, upd: (mut: () => void) => void) {
    const p = this.planner;
    const st = w.coverEntity && p.hass?.states ? p.hass.states[w.coverEntity] : null;
    const label = !w.coverEntity ? '— unbound —' : `${w.coverEntity}${st ? ` · ${st.state}` : ''}`;
    return html`
      <div class="row" style="margin-top:6px"><label title="cover.* blind / shade / curtain">Blind</label>
        <span style="font-size:11px;color:var(--text-dim);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${label}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickWindowCover(w)}>
          ${w.coverEntity ? 'Rebind' : 'Bind'} blind…
        </button>
        ${w.coverEntity ? html`
          <button class="btn" style="font-size:11px"
                  @click=${() => upd(() => { w.coverEntity = null; })}>Unbind</button>
        ` : nothing}
      </div>
    `;
  }

  private _windowEditor(w: WindowType) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" .value=${w.label ?? ''}
                 @input=${(e: Event) => upd(() => { w.label = (e.target as HTMLInputElement).value; })}>
        </div>
        ${this._lockRow(w)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(Math.round(w.x))}
                 @input=${(e: Event) => upd(() => { w.x = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(Math.round(w.y))}
                 @input=${(e: Event) => upd(() => { w.y = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
        </div>
        <div class="row"><label>Width (mm)</label>
          <input type="number" min="200" .value=${String(Math.round(w.w))}
                 @input=${(e: Event) => upd(() => {
                   w.w = Math.max(200, parseFloat((e.target as HTMLInputElement).value) || 0);
                 })}>
        </div>
        <div class="row"><label>Rotation (°)</label>
          <input type="number" step="15" .value=${String(Math.round(w.rotation))}
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                   w.rotation = ((Math.round(v / 15) * 15) % 360 + 360) % 360;
                 })}>
        </div>
        <div class="row"><label>Type</label>
          <select @change=${(e: Event) => upd(() => {
                    w.kind = (e.target as HTMLSelectElement).value as WindowKind;
                  })}>
            ${WINDOW_KINDS.map(k => html`
              <option value=${k.id} ?selected=${(w.kind ?? 'single') === k.id}>${k.label}</option>`)}
          </select>
        </div>
        <div class="row"><label>Sill (mm)</label>
          <input type="number" min="0" max="2400" step="50"
                 .value=${String(Math.round(w.sill ?? WINDOW_DEFAULTS.sill))}
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value);
                   w.sill = isFinite(v) ? Math.max(0, Math.min(2400, v)) : WINDOW_DEFAULTS.sill;
                 })}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="200" max="2600" step="50"
                 .value=${String(Math.round(w.height ?? WINDOW_DEFAULTS.height))}
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value);
                   w.height = isFinite(v) ? Math.max(200, Math.min(2600, v)) : WINDOW_DEFAULTS.height;
                 })}>
        </div>
        <div class="row"><label>HA entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${w.entity_id || '— unbound —'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickWindowEntity(w)}>
            ${w.entity_id ? 'Rebind' : 'Bind'}…
          </button>
          ${w.entity_id ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { w.entity_id = null; })}>Unbind</button>
          ` : nothing}
        </div>
        ${this._windowCoverBindRow(w, upd)}
        <div style="font-size:10px;color:var(--text-dim);margin-top:6px;line-height:1.3">
          Pane center at (X, Y). Rotation is wall axis (15° snap). Bind to a
          binary_sensor ("on" = open); optional cover.* blind renders a roller shade.
        </div>
      </div>
    `;
  }

  // ── Furniture section ─────────────────────────────────────────────────
  @state() private _furnExpanded = new Set<string>();

  private _furnitureSection() {
    const p = this.planner;
    const f = p.floor();
    if (f.furniture.length === 0) return nothing;
    return this._section('furniture', 'Furniture', () =>
      this._groupedList('furniture', f.furniture, piece => this._furnitureItem(piece, f.furniture.indexOf(piece))));
  }

  private _furnitureItem(piece: Furniture, idx: number) {
    const kind = furnitureKind(piece);
    const def = FURNITURE_KINDS[kind];
    const exp = this._furnExpanded.has(piece.id);
    const display = piece.label?.trim() || def.label;
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item" style="cursor:default">
          <span style="font-size:11px;color:var(--text-dim);min-width:54px">${def.label}</span>
          <div class="nm">${display}</div>
          <button class="icon-btn" title=${exp ? 'Hide' : 'Edit'}
                  @click=${() => this._toggleFurnExpanded(piece.id)}>${exp ? '▾' : '▸'}</button>
          <button class="icon-btn" title="Delete"
                  @click=${() => this._deleteFurniture(idx)}>✕</button>
        </div>
        ${exp ? this._furnitureEditor(piece) : nothing}
      </div>
    `;
  }

  private _toggleFurnExpanded(id: string): void {
    if (this._furnExpanded.has(id)) this._furnExpanded.delete(id);
    else                            this._furnExpanded.add(id);
    this.requestUpdate();
  }

  private _deleteFurniture(idx: number): void {
    const f = this.planner.floor();
    f.furniture.splice(idx, 1);
    this.planner.save();
    this.planner.emitConfig();
  }

  private _furnitureEditor(piece: Furniture) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    const curKind = furnitureKind(piece);
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" .value=${piece.label ?? ''}
                 placeholder=${FURNITURE_KINDS[curKind].label}
                 @input=${(e: Event) => upd(() => {
                   piece.label = (e.target as HTMLInputElement).value;
                 })}>
        </div>
        ${this._lockRow(piece)}
        <div class="row"><label>Type</label>
          <select .value=${piece.customKindId ? 'custom:' + piece.customKindId : curKind}
                  @change=${(e: Event) => upd(() => {
                    const v = (e.target as HTMLSelectElement).value;
                    const curDef = resolveFurnitureDef(piece, p.store.customObjects);
                    const wasDefault = piece.w === curDef.w && piece.h === curDef.h;
                    if (v.startsWith('custom:')) {
                      // Recipe reference; kind stays as the plain-block fallback.
                      piece.customKindId = v.slice(7);
                      if (wasDefault) {
                        const rec = p.store.customObjects?.find(o => o.id === piece.customKindId);
                        if (rec) { piece.w = rec.w; piece.h = rec.h; }
                      }
                    } else {
                      const newKind = v as FurnitureKind;
                      piece.customKindId = undefined;
                      piece.kind = newKind;
                      // Resize to new kind's defaults if user hadn't customized.
                      if (wasDefault) {
                        piece.w = FURNITURE_KINDS[newKind].w;
                        piece.h = FURNITURE_KINDS[newKind].h;
                      }
                    }
                  })}>
            ${this._kindOptions(piece.customKindId ? 'custom:' + piece.customKindId : curKind)}
          </select>
        </div>
        ${this._furnitureBindRow(piece, upd)}
        ${(curKind === 'tv' || curKind === 'wall_tv') ? this._screenContentRow(piece, upd) : nothing}
        ${(curKind === 'tv' || curKind === 'wall_tv') ? this._biasLightRow(piece, upd) : nothing}
        ${curKind === 'fridge' ? this._fridgeDoorBindRow(piece, upd) : nothing}
        ${furnitureCat(resolveFurnitureDef(piece, p.store.customObjects)) === 'appliance'
          ? this._powerBindRow(piece, upd) : nothing}
        ${curKind === 'stove' || curKind === 'fridge' ? this._tempBindRow(piece, upd) : nothing}
        ${isDroopPlant(piece, p.store.customObjects) ? this._moistureBindRow(piece, upd) : nothing}
        ${curKind === 'dishwasher' || curKind === 'washer' || curKind === 'dryer' ||
          curKind === 'stove' || curKind === 'microwave' ? this._jobStateRow(piece, upd) : nothing}
        ${curKind === 'car' || curKind === 'ev_charger' ? this._evChargerRows(piece, upd) : nothing}
        ${curKind === 'mailbox' ? this._mailboxRows(piece, upd) : nothing}
        ${curKind === 'stove' ? html`
          <div class="row"><label title="Persistent oven-door open state (also toggled by clicking the stove in 2D/3D)">Oven door open</label>
            <input type="checkbox" .checked=${!!piece.doorOpen}
                   @change=${(e: Event) => upd(() => { piece.doorOpen = (e.target as HTMLInputElement).checked; })}>
          </div>` : nothing}
        <div class="row"><label>Color</label>
          <input type="color"
                 .value=${piece.color ?? ('#' + (resolveFurnitureDef(piece, p.store.customObjects).color & 0xffffff).toString(16).padStart(6, '0'))}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${(e: Event) => upd(() => { piece.color = (e.target as HTMLInputElement).value; })}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Reset to the kind's default color"
                  @click=${() => upd(() => { piece.color = undefined; })}>✕</button>
        </div>
        ${curKind === 'bed' ? html`
          <div class="row"><label title="Two occupants hide under a shared blanket (the lump breathes). Off: they lie side by side, no blanket.">Two-person covers</label>
            <input type="checkbox" .checked=${piece.sharedBedCovers !== false}
                   @change=${(e: Event) => upd(() => {
                     piece.sharedBedCovers = (e.target as HTMLInputElement).checked;
                   })}>
          </div>` : nothing}
        <div class="row"><label>Width (mm)</label>
          <input type="number" min="50" .value=${String(Math.round(piece.w))}
                 @input=${(e: Event) => upd(() => {
                   piece.w = Math.max(50, parseFloat((e.target as HTMLInputElement).value) || 0);
                 })}>
        </div>
        <div class="row"><label>Depth (mm)</label>
          <input type="number" min="50" .value=${String(Math.round(piece.h))}
                 @input=${(e: Event) => upd(() => {
                   piece.h = Math.max(50, parseFloat((e.target as HTMLInputElement).value) || 0);
                 })}>
        </div>
        <div class="row"><label>Elevation (mm)</label>
          <input type="number" step="50" .value=${String(Math.round(piece.elevation ?? 0))}
                 title="Base height above the floor (the piece's BOTTOM). Positive raises (1372 = upper flight of an L staircase); negative sinks — stairs at −2743 descend a full storey and cut a stairwell. A landing's walking surface sits at elevation + 1372, so a landing halfway down a basement stair needs −2743"
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value);
                   piece.elevation = isFinite(v) && v !== 0 ? v : undefined;
                 })}>
        </div>
        ${isStairsKind(curKind) ? this._stairLinkRow(piece, upd) : nothing}
        <div class="row"><label>Rotation (°)</label>
          <input type="number" step="15" .value=${String(Math.round(piece.rotation ?? 0))}
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                   piece.rotation = ((Math.round(v / 15) * 15) % 360 + 360) % 360;
                 })}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Rotate −15°"
                  @click=${() => upd(() => {
                    const cur = piece.rotation ?? 0;
                    piece.rotation = ((cur - 15) % 360 + 360) % 360;
                  })}>↺</button>
          <button class="btn" style="font-size:10px;padding:2px 6px"
                  title="Rotate +15°"
                  @click=${() => upd(() => {
                    const cur = piece.rotation ?? 0;
                    piece.rotation = ((cur + 15) % 360 + 360) % 360;
                  })}>↻</button>
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          Front (backrest, headboard, pillows) faces +Y world at rotation 0.
          Snaps to 15° increments. Corner-resize handles hide while rotated.
        </div>
      </div>
    `;
  }

  // Linked-stairs picker (Tier 2 stair portals). Lists stairs-family pieces on
  // OTHER floors; picking one links both under a shared opaque id (BLE avatars
  // hand off between the linked pieces on a floor change). Current link shows a
  // ✕ clear; a link whose partner was deleted reads "(broken link)" + clear.
  private _stairLinkRow(piece: Furniture, _upd: (mut: () => void) => void) {
    const p = this.planner;
    const partner = p.stairLinkPartner(piece);
    const elevTxt = (fu: Furniture) => `${Math.round(fu.elevation ?? 0)} mm`;
    // Candidates: stairs-family pieces on every OTHER floor.
    const opts: { floorId: string; floorName: string; id: string; label: string }[] = [];
    for (const fl of p.store.floors) {
      if (fl.id === p.floor().id) continue;
      for (const fu of fl.furniture) {
        if (!isStairsKind(fu.kind)) continue;
        const def = FURNITURE_KINDS[furnitureKind(fu)];
        opts.push({ floorId: fl.id, floorName: fl.name, id: fu.id,
                    label: `${fl.name} · ${def.label} · ${elevTxt(fu)}` });
      }
    }
    const linkStatus = piece.stairLinkId
      ? (partner
          ? html`<span style="font-size:10px;color:#66bb6a">↔ ${partner.floor.name} · ${FURNITURE_KINDS[furnitureKind(partner.piece)].label}</span>`
          : html`<span style="font-size:10px;color:#ffb74d">(broken link)</span>`)
      : html`<span style="font-size:10px;color:var(--text-dim)">— none —</span>`;
    return html`
      <div class="row"><label title="Link this flight to a stairs piece on another floor so BLE avatars hand off between them on a floor change.">Linked stairs</label>
        ${linkStatus}
        ${piece.stairLinkId ? html`
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px" title="Clear link (both sides)"
                  @click=${() => p.clearStairLink(piece.id)}>✕</button>` : nothing}
      </div>
      ${opts.length === 0
        ? html`<div style="font-size:10px;color:var(--text-dim);padding:0 0 2px">No stairs on other floors.</div>`
        : html`<div class="row"><label>Link to</label>
            <select @change=${(e: Event) => {
              const v = (e.target as HTMLSelectElement).value;
              (e.target as HTMLSelectElement).selectedIndex = 0;   // reset to placeholder
              if (!v) return;
              const [floorId, pid] = v.split('|');
              p.linkStairs(piece.id, floorId, pid);
            }}>
              <option value="">— pick a stairs piece —</option>
              ${opts.map(o => html`<option value=${o.floorId + '|' + o.id}>${o.label}</option>`)}
            </select>
          </div>`}
    `;
  }

  // Entity binding for activity-anchoring pieces (appliances) + the TV. Mirrors
  // the env-sensor bind row. TV binds a media_player; everything else a switch
  // (the picker still lets the user change domains).
  private _furnitureBindRow(piece: Furniture, upd: (mut: () => void) => void) {
    const p = this.planner;
    const def = resolveFurnitureDef(piece, p.store.customObjects);
    if (!def.activity && furnitureKind(piece) !== 'tv' && !isBinKind(piece.kind) && !isVehicleKind(piece.kind)) return nothing;
    return html`
      <div class="row"><label>HA entity</label>
        <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${piece.entity_id || '— unbound —'}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickFurnitureEntity(piece)}>
          ${piece.entity_id ? 'Rebind' : 'Bind'}…
        </button>
        ${piece.entity_id ? html`
          <button class="btn" style="font-size:11px"
                  @click=${() => upd(() => { piece.entity_id = null; })}>Unbind</button>
        ` : nothing}
      </div>
    `;
  }

  // Fridge-only secondary binding: a door/contact binary_sensor ('on' = open)
  // that drives the swung-open 3D door panel + the 2D open-door wedge.
  private _fridgeDoorBindRow(piece: Furniture, upd: (mut: () => void) => void) {
    const p = this.planner;
    const st = piece.doorEntity && p.hass?.states ? p.hass.states[piece.doorEntity] : null;
    const open = st?.state === 'on';
    return html`
      <div class="row"><label title="binary_sensor: 'on' = door open">Door sensor</label>
        <span style="font-size:11px;color:${open ? '#66bb6a' : 'var(--text-dim)'};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${piece.doorEntity ? `${piece.doorEntity} · ${open ? 'OPEN' : 'closed'}` : '— unbound —'}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickFridgeDoor(piece)}>
          ${piece.doorEntity ? 'Rebind' : 'Bind'} door…
        </button>
        ${piece.doorEntity ? html`
          <button class="btn" style="font-size:11px"
                  @click=${() => upd(() => { piece.doorEntity = null; })}>Unbind</button>
        ` : nothing}
      </div>
    `;
  }

  // Screen bias lighting (home-theater arc): a soft accent glow behind a
  // tv/wall_tv. Optional bound light.*/switch.* (glow while it's on) — else AUTO
  // (glow while the TV is playing). Enabling adds a biasLight {} object.
  private _biasLightRow(piece: Furniture, upd: (mut: () => void) => void) {
    const bl = piece.biasLight;
    const on = !!bl;
    return html`
      <div class="row"><label title="Soft accent glow behind the screen (home-theater bias lighting)">Bias light</label>
        <input type="checkbox" .checked=${on}
               @change=${(e: Event) => upd(() => {
                 piece.biasLight = (e.target as HTMLInputElement).checked ? {} : undefined;
               })}>
      </div>
      ${on ? html`
        <div class="row"><label>Glow color</label>
          <input type="color" .value=${bl!.color ?? '#fff1d6'}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${(e: Event) => upd(() => { piece.biasLight!.color = (e.target as HTMLInputElement).value; })}>
          <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                  title="Reset to the default warm-white glow"
                  @click=${() => upd(() => { piece.biasLight!.color = undefined; })}>✕</button>
        </div>
        <div class="row"><label title="Bound light.*/switch.*: glow while ON. Unbound: AUTO glow while the TV plays.">Bias entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${bl!.entityId || 'AUTO (while playing)'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickBiasEntity(piece)}>
            ${bl!.entityId ? 'Rebind' : 'Bind'} light…
          </button>
          ${bl!.entityId ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { piece.biasLight!.entityId = undefined; })}>Unbind</button>
          ` : nothing}
        </div>
      ` : nothing}
    `;
  }

  // TV "Screen" subsection (calendar-tv feature): the screen-content mode +, for
  // 'news', a news-source entity bind. Weather mode needs no binding (global
  // weather source). Now-playing still takes precedence while media is playing.
  private _screenContentRow(piece: Furniture, upd: (mut: () => void) => void) {
    const mode = piece.screenMode ?? 'auto';
    return html`
      <div class="row"><label title="What the screen shows when no media is playing">Screen</label>
        <select .value=${mode}
                @change=${(e: Event) => upd(() => {
                  const v = (e.target as HTMLSelectElement).value as Furniture['screenMode'];
                  piece.screenMode = v === 'auto' ? undefined : v;
                })}>
          <option value="auto" ?selected=${mode === 'auto'}>Auto (now-playing only)</option>
          <option value="news" ?selected=${mode === 'news'}>News ticker</option>
          <option value="weather" ?selected=${mode === 'weather'}>Weather</option>
          <option value="off" ?selected=${mode === 'off'}>Off</option>
        </select>
      </div>
      ${mode === 'news' ? html`
        <div class="row"><label title="Any sensor.*/event.* whose attributes carry headlines (feedparser/template)">News entity</label>
          <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${piece.newsEntity || '— unbound —'}
          </span>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickNewsEntity(piece)}>
            ${piece.newsEntity ? 'Rebind' : 'Bind'} news…
          </button>
          ${piece.newsEntity ? html`
            <button class="btn" style="font-size:11px"
                    @click=${() => upd(() => { piece.newsEntity = null; })}>Unbind</button>
          ` : nothing}
        </div>
      ` : nothing}
      ${mode === 'weather' ? html`
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px">Uses the global weather source (Settings ▸ Weather).</div>
      ` : nothing}
    `;
  }

  private _pickNewsEntity(piece: Furniture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: ['sensor', 'event'],
        onPick: (id: string) => {
          piece.newsEntity = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  private _pickBiasEntity(piece: Furniture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: ['light', 'switch'],
        onPick: (id: string) => {
          if (!piece.biasLight) piece.biasLight = {};
          piece.biasLight.entityId = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  private _pickFridgeDoor(piece: Furniture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'binary_sensor',
        onPick: (id: string) => {
          piece.doorEntity = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // Appliance power sensor (#8): a device_class-power sensor.* whose live wattage
  // scales the in-use glow/LED. VISUAL ONLY — never feeds effectiveState.
  private _powerBindRow(piece: Furniture, upd: (mut: () => void) => void) {
    const p = this.planner;
    const st = piece.powerEntity && p.hass?.states ? p.hass.states[piece.powerEntity] : null;
    const w = st ? parseFloat(st.state) : NaN;
    const wTxt = isFinite(w) ? `${Math.round(w)} W` : (st ? st.state : '');
    return html`
      <div class="row"><label title="sensor.* (W) — scales the in-use glow; visual only">Power sensor</label>
        <span style="font-size:11px;color:${isFinite(w) && w > 5 ? '#66bb6a' : 'var(--text-dim)'};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${piece.powerEntity ? `${piece.powerEntity}${wTxt ? ` · ${wTxt}` : ''}` : '— unbound —'}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickPowerEntity(piece)}>
          ${piece.powerEntity ? 'Rebind' : 'Bind'} power…
        </button>
        ${piece.powerEntity ? html`
          <button class="btn" style="font-size:11px"
                  @click=${() => upd(() => { piece.powerEntity = null; })}>Unbind</button>
        ` : nothing}
      </div>
    `;
  }

  private _pickPowerEntity(piece: Furniture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'sensor',
        onPick: (id: string) => {
          piece.powerEntity = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // Stove/oven (or fridge freezer) temperature sensor. Display only: a 2D N° chip
  // + a 3D camera-facing sprite above the piece.
  private _tempBindRow(piece: Furniture, upd: (mut: () => void) => void) {
    const p = this.planner;
    const st = piece.tempEntity && p.hass?.states ? p.hass.states[piece.tempEntity] : null;
    const v = st ? parseFloat(st.state) : NaN;
    const unit = String(st?.attributes?.unit_of_measurement ?? '');
    const vTxt = isFinite(v) ? `${Math.round(v)}°${/F/i.test(unit) ? 'F' : ''}` : (st ? st.state : '');
    return html`
      <div class="row"><label title="sensor.* temperature — shown as an N° chip; display only">Temperature</label>
        <span style="font-size:11px;color:${isFinite(v) ? '#ff8a65' : 'var(--text-dim)'};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${piece.tempEntity ? `${piece.tempEntity}${vTxt ? ` · ${vTxt}` : ''}` : '— unbound —'}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickTempEntity(piece)}>
          ${piece.tempEntity ? 'Rebind' : 'Bind'} temp…
        </button>
        ${piece.tempEntity ? html`
          <button class="btn" style="font-size:11px"
                  @click=${() => upd(() => { piece.tempEntity = null; })}>Unbind</button>
        ` : nothing}
      </div>
    `;
  }

  private _pickTempEntity(piece: Furniture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'sensor',
        onPick: (id: string) => {
          piece.tempEntity = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // Soil-moisture bind row for plant/flower_bed (and tend_plant custom recipes):
  // a sensor.* (device_class 'moisture', or a mislabeled 'humidity' probe) whose
  // % drives the thirsty droop. Display/animation-only. A threshold input (% below
  // which the plant droops; default 20) + an unbound "Test thirsty" demo toggle.
  // Battery badge auto-resolves off the sibling sensor for free (no extra bind).
  private _moistureBindRow(piece: Furniture, upd: (mut: () => void) => void) {
    const p = this.planner;
    const st = piece.moistureEntity && p.hass?.states ? p.hass.states[piece.moistureEntity] : null;
    const v = st ? parseFloat(st.state) : NaN;
    const thr = piece.moistureThreshold ?? PLANT_MOISTURE_DEFAULT_THRESHOLD;
    const thirsty = isFinite(v) && v < thr;
    return html`
      <div class="row"><label title="sensor.* soil moisture (device_class 'moisture', or a mislabeled 'humidity' soil probe) — % below the threshold droops the plant. Display only. A sibling battery sensor auto-surfaces a 🔋 badge.">Moisture</label>
        <span style="font-size:11px;color:${isFinite(v) ? (thirsty ? '#ffca28' : '#7cb342') : 'var(--text-dim)'};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${piece.moistureEntity ? `${piece.moistureEntity}${isFinite(v) ? ` · ${Math.round(v)}%${thirsty ? ' 💧' : ''}` : ''}` : '— unbound —'}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickMoistureEntity(piece)}>
          ${piece.moistureEntity ? 'Rebind' : 'Bind'} moisture…
        </button>
        ${piece.moistureEntity ? html`
          <button class="btn" style="font-size:11px"
                  @click=${() => upd(() => { piece.moistureEntity = null; })}>Unbind</button>
        ` : nothing}
      </div>
      <div class="row"><label title="% below which the plant is 'thirsty' (droops). Default 20, matching HA's plant integration. Species vary widely.">Thirsty below</label>
        <input type="number" min="0" max="100" step="1" .value=${String(thr)}
               style="width:64px;font-size:11px"
               @change=${(e: Event) => upd(() => {
                 const n = parseFloat((e.target as HTMLInputElement).value);
                 piece.moistureThreshold = isFinite(n) ? Math.max(0, Math.min(100, n)) : undefined;
               })}><span style="font-size:11px;color:var(--text-dim)">%</span>
      </div>
      ${!piece.moistureEntity ? html`
        <button class="btn" style="width:100%;font-size:11px;margin-top:4px"
                @click=${() => upd(() => { piece.plantDemoThirsty = !piece.plantDemoThirsty; })}>
          ${piece.plantDemoThirsty ? '💧 Thirsty (demo) — tap to reset' : 'Test thirsty (demo)'}
        </button>
      ` : nothing}
    `;
  }

  private _pickMoistureEntity(piece: Furniture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'sensor',
        onPick: (id: string) => {
          piece.moistureEntity = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // Appliance "job done" event source (event-focused thought bubbles). Optional:
  // a sensor/binary_sensor to watch (Home Connect operation_state, a `running`
  // binary_sensor, or a *_program_finished event sensor). Unbound → the appliance
  // auto-watches its own entity_id (dishwasher/washer/dryer). A finish fires the
  // event-tier bubble + a blue "done" badge. The "Done value" input defaults to
  // 'finished' when a job sensor is bound.
  private _jobStateRow(piece: Furniture, upd: (mut: () => void) => void) {
    const p = this.planner;
    const st = piece.jobStateEntity && p.hass?.states ? p.hass.states[piece.jobStateEntity] : null;
    return html`
      <div class="row"><label title="sensor/binary_sensor watched for a 'finished' transition (Home Connect operation_state, a running binary_sensor, or a program_finished event sensor). Unbound → auto-watch the appliance's own on/off entity.">Job sensor</label>
        <span style="font-size:11px;color:var(--text-dim);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${piece.jobStateEntity ? `${piece.jobStateEntity}${st ? ` · ${st.state}` : ''}` : '— auto (on/off) —'}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${() => this._pickJobStateEntity(piece)}>
          ${piece.jobStateEntity ? 'Rebind' : 'Bind'} sensor…
        </button>
        ${piece.jobStateEntity ? html`
          <button class="btn" style="font-size:11px"
                  @click=${() => upd(() => { piece.jobStateEntity = null; })}>Unbind</button>
        ` : nothing}
      </div>
      ${piece.jobStateEntity ? html`
        <div class="row"><label title="State value that means 'done'. Home Connect: 'finished'; running binary_sensor: 'off'; program_finished event sensor: 'confirmed'.">Done value</label>
          <input type="text" placeholder="finished" .value=${piece.jobDoneValue ?? ''}
                 style="flex:1;font-size:11px"
                 @change=${(e: Event) => upd(() => {
                   const v = (e.target as HTMLInputElement).value.trim();
                   piece.jobDoneValue = v || undefined;
                 })}>
        </div>
      ` : nothing}
    `;
  }

  private _pickJobStateEntity(piece: Furniture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: ['sensor', 'binary_sensor'],
        onPick: (id: string) => {
          piece.jobStateEntity = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // Generic optional-entity bind row (label + current id + Bind/Unbind).
  private _bindRow(
    label: string, title: string, cur: string | undefined,
    live: string, liveColor: string,
    onBind: () => void, onClear: () => void,
  ) {
    return html`
      <div class="row"><label title=${title}>${label}</label>
        <span style="font-size:11px;color:${cur ? liveColor : 'var(--text-dim)'};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${cur ? `${cur}${live ? ` · ${live}` : ''}` : '— unbound —'}
        </span>
      </div>
      <div style="display:flex;gap:4px;margin-top:4px">
        <button class="btn" style="flex:1;font-size:11px" @click=${onBind}>${cur ? 'Rebind' : 'Bind'}…</button>
        ${cur ? html`<button class="btn" style="font-size:11px" @click=${onClear}>Unbind</button>` : nothing}
      </div>`;
  }

  private _pickEntity(domain: string | string[], set: (id: string) => void): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: { domain, onPick: (id: string) => { set(id); this.planner.save(); this.planner.emitConfig(); } },
    }));
  }

  // EV charging status (car + ev_charger). statusEntity (any vendor's state
  // string — charging/full/error/idle mapped defensively); powerEntity (W).
  private _evChargerRows(piece: Furniture, upd: (mut: () => void) => void) {
    const p = this.planner;
    const ev = piece.evCharger ?? {};
    const stStatus = ev.statusEntity && p.hass?.states ? p.hass.states[ev.statusEntity] : null;
    const stPower = ev.powerEntity && p.hass?.states ? p.hass.states[ev.powerEntity] : null;
    const pw = stPower ? parseFloat(stPower.state) : NaN;
    const mut = (fn: (o: NonNullable<Furniture['evCharger']>) => void) =>
      upd(() => { piece.evCharger = { ...(piece.evCharger ?? {}) }; fn(piece.evCharger!); });
    return html`
      ${this._bindRow('Charger status', 'sensor/binary_sensor whose state maps to charging/full/error/idle',
        ev.statusEntity, stStatus?.state ?? '', '#00e676',
        () => this._pickEntity(['sensor', 'binary_sensor'], id => mut(o => o.statusEntity = id)),
        () => mut(o => o.statusEntity = undefined))}
      ${this._bindRow('Charge power', 'sensor.* (W) — feeds the charge indicator', ev.powerEntity,
        isFinite(pw) ? `${Math.round(pw)} W` : (stPower?.state ?? ''), '#66bb6a',
        () => this._pickEntity('sensor', id => mut(o => o.powerEntity = id)),
        () => mut(o => o.powerEntity = undefined))}`;
  }

  // Mailbox mail/packages bindings. countEntity (numeric sensor) > 0 raises the
  // flag + shows a badge; flagEntity (binary_sensor lid) 'on' tilts the lid open.
  private _mailboxRows(piece: Furniture, upd: (mut: () => void) => void) {
    const p = this.planner;
    const mc = piece.mailCount ?? {};
    const stCount = mc.countEntity && p.hass?.states ? p.hass.states[mc.countEntity] : null;
    const stFlag = mc.flagEntity && p.hass?.states ? p.hass.states[mc.flagEntity] : null;
    const mut = (fn: (o: NonNullable<Furniture['mailCount']>) => void) =>
      upd(() => { piece.mailCount = { ...(piece.mailCount ?? {}) }; fn(piece.mailCount!); });
    return html`
      ${this._bindRow('Mail count', 'numeric sensor.* (Mail-and-Packages) — > 0 raises the flag + badge',
        mc.countEntity, stCount?.state ?? '', '#ffb74d',
        () => this._pickEntity('sensor', id => mut(o => o.countEntity = id)),
        () => mut(o => o.countEntity = undefined))}
      ${this._bindRow('Lid sensor', "binary_sensor.* — 'on' tilts the lid open", mc.flagEntity,
        stFlag?.state === 'on' ? 'OPEN' : (stFlag?.state ?? ''), '#66bb6a',
        () => this._pickEntity('binary_sensor', id => mut(o => o.flagEntity = id)),
        () => mut(o => o.flagEntity = undefined))}`;
  }

  private _pickFurnitureEntity(piece: Furniture): void {
    const domain = furnitureKind(piece) === 'tv' ? 'media_player'
      : isBinKind(piece.kind) ? 'binary_sensor'   // bins: 'on'/'full' = full
      : isVehicleKind(piece.kind) ? 'binary_sensor'   // car: presence 'on' = in bay
      : 'switch';
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain,
        onPick: (id: string) => {
          piece.entity_id = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  // ── Custom objects section ────────────────────────────────────────────
  // Form-based recipe editor. Every mutation runs save() + emitConfig(), which
  // bumps configRev — the auto-placed instance rebuilds as its own live preview.
  @state() private _customExpanded = new Set<string>();

  private _customObjectsSection() {
    const objs = this.planner.store.customObjects ?? [];
    return this._section('custom', 'Custom Objects', () => html`
        ${objs.length === 0 ? html`
          <div style="color:var(--text-dim);font-size:11px;padding:2px 0 6px">
            Build reusable objects from primitive parts, then place them like any furniture kind.
          </div>` : nothing}
        ${objs.map(o => this._customObjectItem(o))}
        <button class="btn" style="width:100%;margin-top:6px" @click=${() => this._addCustomObject()}>
          + New object
        </button>
    `);
  }

  private _customObjectItem(rec: ObjectRecipe) {
    const exp = this._customExpanded.has(rec.id);
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item" style="cursor:pointer"
             @click=${() => this._toggleCustomExpanded(rec.id)}>
          <div class="nm">${rec.label || 'Custom object'}</div>
          <button class="icon-btn" title=${exp ? 'Hide' : 'Edit'}
                  @click=${(e: Event) => { e.stopPropagation(); this._toggleCustomExpanded(rec.id); }}>${exp ? '▾' : '▸'}</button>
          <button class="icon-btn" title="Delete"
                  @click=${(e: Event) => { e.stopPropagation(); this._deleteCustomObject(rec); }}>✕</button>
        </div>
        ${exp ? this._customObjectEditor(rec) : nothing}
      </div>
    `;
  }

  private _toggleCustomExpanded(id: string): void {
    if (this._customExpanded.has(id)) this._customExpanded.delete(id);
    else                              this._customExpanded.add(id);
    this.requestUpdate();
  }

  private _addCustomObject(): void {
    const p = this.planner;
    if (!p.store.customObjects) p.store.customObjects = [];
    const rec: ObjectRecipe = {
      id: newId('obj'), label: 'Custom object',
      w: 600, h: 600, ht: 800, color: 0x8d6e63, cat: 'furniture',
      primitives: [{ shape: 'box', size: [600, 800, 600], pos: [0, 400, 0] }],
    };
    p.store.customObjects.push(rec);
    this._customExpanded.add(rec.id);
    // Auto-place an instance at the current view center so the edit is visible.
    const f = p.floor();
    const c = p.viewCenter ?? { x: f.w / 2, y: f.d / 2 };
    f.furniture.push({
      id: newId('fu'), x: Math.round(c.x), y: Math.round(c.y),
      w: rec.w, h: rec.h, label: '', kind: 'block', customKindId: rec.id,
    });
    p.save(); p.emitConfig();
  }

  private _deleteCustomObject(rec: ObjectRecipe): void {
    if (!confirm(`Delete "${rec.label || 'Custom object'}"? Placed instances stay but fall back to plain blocks.`)) return;
    const p = this.planner;
    p.store.customObjects = (p.store.customObjects ?? []).filter(o => o.id !== rec.id);
    this._customExpanded.delete(rec.id);
    p.save(); p.emitConfig();
  }

  private _customObjectEditor(rec: ObjectRecipe) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    const activities: (ActivityKind | 'none')[] = [
      'none', 'shower', 'bathe', 'toilet', 'wash_hands', 'load_dishwasher',
      'make_coffee', 'forage_fridge', 'watch_tv', 'eat_at_table',
      'work_at_desk', 'exercise', 'sleep_shared',
    ];
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div class="row"><label>Label</label>
          <input type="text" .value=${rec.label}
                 @input=${(e: Event) => upd(() => { rec.label = (e.target as HTMLInputElement).value; })}>
        </div>
        <div class="row"><label>Width (mm)</label>
          <input type="number" min="50" .value=${String(Math.round(rec.w))}
                 @input=${(e: Event) => upd(() => { rec.w = Math.max(50, parseFloat((e.target as HTMLInputElement).value) || 0); })}>
        </div>
        <div class="row"><label>Depth (mm)</label>
          <input type="number" min="50" .value=${String(Math.round(rec.h))}
                 @input=${(e: Event) => upd(() => { rec.h = Math.max(50, parseFloat((e.target as HTMLInputElement).value) || 0); })}>
        </div>
        <div class="row"><label>Height (mm)</label>
          <input type="number" min="10" .value=${String(Math.round(rec.ht))}
                 @input=${(e: Event) => upd(() => { rec.ht = Math.max(10, parseFloat((e.target as HTMLInputElement).value) || 0); })}>
        </div>
        <div class="row"><label>Surface</label>
          <input type="checkbox" .checked=${!!rec.surface}
                 @change=${(e: Event) => upd(() => { rec.surface = (e.target as HTMLInputElement).checked || undefined; })}>
          <label style="margin-left:12px">Mountable</label>
          <input type="checkbox" .checked=${!!rec.mountable}
                 @change=${(e: Event) => upd(() => { rec.mountable = (e.target as HTMLInputElement).checked || undefined; })}>
        </div>
        <div class="row"><label>Activity</label>
          <select .value=${rec.activity ?? 'none'}
                  @change=${(e: Event) => upd(() => {
                    const v = (e.target as HTMLSelectElement).value;
                    rec.activity = v === 'none' ? undefined : v as ActivityKind;
                  })}>
            ${activities.map(a => html`<option value=${a} ?selected=${(rec.activity ?? 'none') === a}>${a}</option>`)}
          </select>
        </div>
        <div class="row"><label>Seat (mm)</label>
          <input type="number" min="0" placeholder="none"
                 title="Seat-top height; set it to make the object sittable"
                 .value=${rec.seat != null ? String(Math.round(rec.seat)) : ''}
                 @input=${(e: Event) => upd(() => {
                   const v = parseFloat((e.target as HTMLInputElement).value);
                   rec.seat = isFinite(v) && v > 0 ? v : undefined;
                 })}>
        </div>
        <div style="font-size:11px;color:var(--text-dim);margin:6px 0 2px">Parts</div>
        ${rec.primitives.map((prim, i) => this._customPartRow(rec, prim, i))}
        <button class="btn" style="width:100%;margin-top:4px" @click=${() => upd(() => {
          rec.primitives.push({ shape: 'box', size: [200, 200, 200], pos: [0, 100, 0] });
        })}>+ part</button>
      </div>
    `;
  }

  private _customPartRow(rec: ObjectRecipe, prim: RecipePrimitive, idx: number) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    const numIn = (v: number, on: (n: number) => void) => html`
      <input type="number" style="width:46px;font-size:10px" .value=${String(Math.round(v))}
             @input=${(e: Event) => upd(() => on(parseFloat((e.target as HTMLInputElement).value) || 0))}>`;
    const setRot = (i: number, n: number) => { if (!prim.rot) prim.rot = [0, 0, 0]; prim.rot[i] = n; };
    return html`
      <div style="border-top:1px solid var(--border);padding:4px 0">
        <div class="row" style="gap:4px">
          <select style="flex:1" .value=${prim.shape}
                  @change=${(e: Event) => upd(() => { prim.shape = (e.target as HTMLSelectElement).value as RecipeShape; })}>
            <option value="box" ?selected=${prim.shape === 'box'}>Box</option>
            <option value="cylinder" ?selected=${prim.shape === 'cylinder'}>Cylinder</option>
            <option value="sphere" ?selected=${prim.shape === 'sphere'}>Sphere</option>
            <option value="cone" ?selected=${prim.shape === 'cone'}>Cone</option>
          </select>
          <input type="color" .value=${prim.color ?? '#8a8a8a'}
                 @input=${(e: Event) => upd(() => { prim.color = (e.target as HTMLInputElement).value; })}>
          <button class="icon-btn" title="Duplicate" @click=${() => upd(() => {
            rec.primitives.splice(idx + 1, 0, {
              shape: prim.shape,
              size: [...prim.size] as [number, number, number],
              pos: [...prim.pos] as [number, number, number],
              rot: prim.rot ? [...prim.rot] as [number, number, number] : undefined,
              color: prim.color,
            });
          })}>⧉</button>
          <button class="icon-btn" title="Delete" @click=${() => upd(() => { rec.primitives.splice(idx, 1); })}>✕</button>
        </div>
        <div class="row" style="gap:3px;font-size:10px;color:var(--text-dim)"><span style="min-width:30px">size</span>
          ${numIn(prim.size[0], n => prim.size[0] = n)}${numIn(prim.size[1], n => prim.size[1] = n)}${numIn(prim.size[2], n => prim.size[2] = n)}
        </div>
        <div class="row" style="gap:3px;font-size:10px;color:var(--text-dim)"><span style="min-width:30px">pos</span>
          ${numIn(prim.pos[0], n => prim.pos[0] = n)}${numIn(prim.pos[1], n => prim.pos[1] = n)}${numIn(prim.pos[2], n => prim.pos[2] = n)}
        </div>
        <div class="row" style="gap:3px;font-size:10px;color:var(--text-dim)"><span style="min-width:30px">rot°</span>
          ${numIn(prim.rot?.[0] ?? 0, n => setRot(0, n))}${numIn(prim.rot?.[1] ?? 0, n => setRot(1, n))}${numIn(prim.rot?.[2] ?? 0, n => setRot(2, n))}
        </div>
      </div>
    `;
  }

  // ── Lights & Switches section ─────────────────────────────────────────
  @state() private _fxExpanded = new Set<string>();

  private _fixturesSection() {
    const p = this.planner;
    const f = p.floor();
    if (f.lights.length === 0 && f.switches.length === 0) return nothing;
    // Lights and switches share one room-grouped list; each wrapper keeps a
    // back-pointer so the item renderer still gets the original array index.
    type Fx = { x: number; y: number; k: 'light' | 'switch'; ref: Light | SwitchFixture };
    const fixtures: Fx[] = [
      ...f.lights.map(l => ({ x: l.x, y: l.y, k: 'light' as const, ref: l })),
      ...f.switches.map(sw => ({ x: sw.x, y: sw.y, k: 'switch' as const, ref: sw })),
    ];
    return this._section('fixtures', 'Lights & Switches', () =>
      this._groupedList('fixtures', fixtures, w => this._fixtureItem(
        w.k, w.ref,
        w.k === 'light' ? f.lights.indexOf(w.ref as Light) : f.switches.indexOf(w.ref as SwitchFixture))));
  }

  private _fixtureItem(kind: 'light' | 'switch', it: Light | SwitchFixture, idx: number) {
    const p = this.planner;
    const states = p.hass?.states;
    const st = it.entity_id && states ? states[it.entity_id] : null;
    const isOn = st?.state === 'on';
    const unavail = st && (st.state === 'unavailable' || st.state === 'unknown');
    const bound = !!it.entity_id;
    const friendly = bound
      ? String((st?.attributes as Record<string, unknown>)?.friendly_name || it.entity_id)
      : (it.label || (kind === 'light' ? 'Light' : 'Switch'));
    const icon = kind === 'light'
      ? (LIGHT_KINDS.find(k => k.id === lightIconKind(it as Light))?.glyph ?? '💡')
      : '⏻';
    const badge = !bound ? '—' : unavail ? 'n/a' : isOn ? 'ON' : 'OFF';
    const badgeClass = bound && !unavail && isOn ? 'bound' : '';
    const exp = this._fxExpanded.has(it.id);
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item" style="cursor:default">
          <span style="font-size:14px;line-height:1">${icon}</span>
          <div class="nm" title=${it.entity_id || ''}>${friendly}</div>
          ${bound ? html`
            <button class="badge ${badgeClass}" style="cursor:pointer;border:none;font-family:inherit"
                    ?disabled=${unavail || !p.hass}
                    title=${isOn ? 'Click to turn off' : 'Click to turn on'}
                    @click=${() => p.toggleEntity(it.entity_id)}>
              ${badge}
            </button>
          ` : this._localBadge(it)}
          <button class="icon-btn" title=${bound ? 'Rebind' : 'Bind'}
                  @click=${() => this._pickFixtureEntity(kind, it)}>🔗</button>
          ${bound && p.isLightEntity(it.entity_id) ? html`
            <button class="icon-btn" title="Configure (color, brightness, temp)"
                    @click=${() => this.dispatchEvent(new CustomEvent('open-light-config', {
                      bubbles: true, composed: true, detail: { entityId: it.entity_id },
                    }))}>⚙</button>
          ` : nothing}
          <button class="icon-btn" title=${exp ? 'Hide' : 'Visual properties'}
                  @click=${() => this._toggleExpanded(it.id)}>${exp ? '▾' : '▸'}</button>
          <button class="icon-btn" title="Delete"
                  @click=${() => this._deleteFixture(kind, idx)}>✕</button>
        </div>
        ${exp ? this._fixtureEditor(kind, it) : nothing}
      </div>
    `;
  }

  // Logical-state light binding (batch DC-B): the light's ON/color/flash derives
  // from a rule over ANY entity (shared value-rules engine). When configured it
  // overrides the light.* binding and the light becomes read-only (clicking it
  // no-ops — it's computed). Reuses the shared _ruleRows editor.
  private _lightLogicBlock(l: Light) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    const logic = l.logic;
    const preview = logic ? p.effectiveState(l) : null;
    return html`
      <div style="border-top:1px solid var(--border);margin:8px 0 4px;padding-top:6px">
        <div style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--text-dim)">
          <span style="flex:1">Logic binding — derive ON/color/flash from an entity's state</span>
          ${logic ? html`<button class="btn" style="font-size:10px;padding:1px 5px"
                  @click=${() => upd(() => { l.logic = undefined; })}>Clear</button>` : nothing}
        </div>
        ${!logic ? html`
          <button class="btn" style="width:100%;font-size:11px;margin-top:4px" @click=${() =>
            this.dispatchEvent(new CustomEvent('open-entity-picker', {
              bubbles: true, composed: true,
              detail: { domain: null, onPick: (id: string) => upd(() => {
                l.logic = { entityId: id, rules: [{ op: 'eq', value: 'on', color: '#ffd54f' } as ValueRule] };
              }) },
            }))}>+ Add logic (pick source entity)</button>
        ` : html`
          <div class="row"><label>Source</label>
            <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${logic.entityId}</span>
            <button class="btn" style="font-size:10px" @click=${() =>
              this.dispatchEvent(new CustomEvent('open-entity-picker', {
                bubbles: true, composed: true,
                detail: { domain: null, onPick: (id: string) => upd(() => { logic.entityId = id; }) },
              }))}>Rebind</button>
          </div>
          <div style="font-size:10px;color:var(--text-dim);margin:4px 0 2px">State → color rules (first match = ON in that color; ⚡ = flash)</div>
          ${this._ruleRows(logic.rules, next => { logic.rules = next; })}
          <div class="row"><label>Off color</label>
            <input type="color" .value=${logic.offColor ?? '#222222'}
                   @change=${(e: Event) => upd(() => { logic.offColor = (e.target as HTMLInputElement).value; })}>
            ${logic.offColor ? html`<button class="btn" style="font-size:10px;margin-left:4px"
                    @click=${() => upd(() => { logic.offColor = undefined; })}>none</button>` : nothing}
          </div>
          <div style="font-size:10px;color:var(--text-dim);margin-top:2px">
            Now: <b style="color:${preview?.state === 'on' ? '#8f8' : '#888'}">${preview?.state ?? 'off'}</b>
            ${preview?.attributes && (preview.attributes as Record<string, unknown>)._flash ? '⚡' : ''}
          </div>
        `}
      </div>
    `;
  }

  private _toggleExpanded(id: string): void {
    if (this._fxExpanded.has(id)) this._fxExpanded.delete(id);
    else                          this._fxExpanded.add(id);
    this.requestUpdate();
  }

  private _fixtureEditor(kind: 'light' | 'switch', it: Light | SwitchFixture) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    const numRow = (label: string, val: number, min: number, max: number, step: number,
                    onSave: (v: number) => void) => html`
      <div class="row">
        <label>${label}</label>
        <input type="number" min=${min} max=${max} step=${step} .value=${String(val)}
               @input=${(e: Event) => {
                 const v = parseFloat((e.target as HTMLInputElement).value);
                 if (isFinite(v)) onSave(Math.max(min, Math.min(max, v)));
               }}>
      </div>
    `;
    const txtRow = (label: string, val: string, onSave: (v: string) => void) => html`
      <div class="row">
        <label>${label}</label>
        <input type="text" .value=${val} @input=${(e: Event) => onSave((e.target as HTMLInputElement).value)}>
      </div>
    `;
    if (kind === 'light') {
      const l = it as Light;
      const curKind = lightIconKind(l);
      return html`
        <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
          ${txtRow('Label', l.label || '', v => upd(() => { l.label = v; }))}
          ${this._lockRow(l)}
          <div style="font-size:10px;color:var(--text-dim);margin:6px 0 3px">Type</div>
          <div style="display:flex;flex-wrap:wrap;gap:3px">
            ${LIGHT_KINDS.map(k => html`
              <button title=${k.label}
                      @click=${() => upd(() => { l.iconKind = k.id; })}
                      style="font-size:14px;padding:3px 6px;border-radius:3px;cursor:pointer;line-height:1.2;
                             background:${curKind === k.id ? 'var(--accent)' : '#222'};
                             border:1px solid ${curKind === k.id ? 'var(--accent)' : 'var(--border)'};
                             color:var(--text)">
                ${k.glyph}
              </button>
            `)}
          </div>
          ${['fan', 'fan_light'].includes(curKind) ? html`
            <div class="row"><label>Fan entity</label>
              <span style="font-size:10px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                ${l.fanEntity || '(uses light entity)'}
              </span>
              <button class="btn" style="font-size:10px;padding:2px 6px" title="Bind the fan.* entity that drives blade speed"
                      @click=${() => {
                        this.dispatchEvent(new CustomEvent('open-entity-picker', {
                          bubbles: true, composed: true,
                          detail: {
                            domain: 'fan',
                            onPick: (id: string) => upd(() => { l.fanEntity = id; }),
                          },
                        }));
                      }}>🔗</button>
              ${l.fanEntity ? html`
                <button class="btn" style="font-size:10px;padding:2px 6px" title="Unbind"
                        @click=${() => upd(() => { l.fanEntity = null; })}>✕</button>` : nothing}
            </div>
          ` : nothing}
          ${['strip', 'string', 'under_cabinet'].includes(curKind) ? html`
            <div class="row"><label>Length (mm)</label>
              <input type="number" min="300" max="15000" step="100"
                     .value=${String(Math.round(l.length ?? 2000))}
                     @input=${(e: Event) => upd(() => {
                       const v = parseFloat((e.target as HTMLInputElement).value);
                       l.length = isFinite(v) ? Math.max(300, Math.min(15000, v)) : 2000;
                     })}>
            </div>
          ` : nothing}
          ${['fireplace', 'strip', 'sconce', 'string', 'under_cabinet', 'wall_sconce', 'step', 'flood'].includes(curKind) ? html`
            <div class="row"><label>Rotation (°)</label>
              <input type="number" step="15" .value=${String(Math.round(l.rotation ?? 0))}
                     @input=${(e: Event) => upd(() => {
                       const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                       l.rotation = ((Math.round(v) % 360) + 360) % 360;
                     })}>
              <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                      title="Rotate −15°"
                      @click=${() => upd(() => {
                        l.rotation = (((l.rotation ?? 0) - 15) % 360 + 360) % 360;
                      })}>↺</button>
              <button class="btn" style="font-size:10px;padding:2px 6px"
                      title="Rotate +15°"
                      @click=${() => upd(() => {
                        l.rotation = (((l.rotation ?? 0) + 15) % 360 + 360) % 360;
                      })}>↻</button>
            </div>
          ` : nothing}
          ${/* Height may go negative (down to −3000) for lights sunk below the floor — e.g. a step light on a sunken stairway shaft. */ ''}
          ${numRow('Height (mm)', l.height ?? (curKind === 'under_cabinet' ? 1350 : curKind === 'wall_sconce' ? 1700 : curKind === 'step' ? 300 : curKind === 'flood' ? 2400 : 2500), -3000, 6000, 50, v => upd(() => { l.height = v; }))}
          ${numRow('Radius (mm)', l.radius ?? 900, 100, 5000, 50, v => upd(() => { l.radius = v; }))}
          ${numRow('Intensity', l.intensity ?? 1, 0, 2, 0.05, v => upd(() => { l.intensity = v; }))}
          <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
            Type sets the 3D body shape (and forces fireplace warm + flicker).
            Height = ceiling distance. Radius = pool of light on floor.
          </div>
          ${this._lightLogicBlock(l)}
        </div>
      `;
    } else {
      const s = it as SwitchFixture;
      return html`
        <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
          ${txtRow('Label', s.label || '', v => upd(() => { s.label = v; }))}
          ${this._lockRow(s)}
          ${numRow('Height (mm)', s.height ?? 1200, 0, 3000, 10, v => upd(() => { s.height = v; }))}
          ${numRow('Size (mm)', s.size ?? 320, 100, 1500, 10, v => upd(() => { s.size = v; }))}
          <div class="row"><label>Label pos.</label>
            <select .value=${s.labelPos ?? 'bottom'}
                    @change=${(e: Event) => upd(() => {
                      s.labelPos = (e.target as HTMLSelectElement).value as
                        'bottom' | 'top' | 'left' | 'right' | 'hide';
                    })}>
              <option value="bottom">Below</option>
              <option value="top">Above</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="hide">Hidden</option>
            </select>
          </div>
          <div class="row"><label>Rotation (°)</label>
            <input type="number" step="15" .value=${String(Math.round(s.rotation ?? 0))}
                   @input=${(e: Event) => upd(() => {
                     const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                     s.rotation = ((Math.round(v) % 360) + 360) % 360;
                   })}>
            <button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                    title="Rotate −15°"
                    @click=${() => upd(() => {
                      s.rotation = (((s.rotation ?? 0) - 15) % 360 + 360) % 360;
                    })}>↺</button>
            <button class="btn" style="font-size:10px;padding:2px 6px"
                    title="Rotate +15°"
                    @click=${() => upd(() => {
                      s.rotation = (((s.rotation ?? 0) + 15) % 360 + 360) % 360;
                    })}>↻</button>
          </div>
          <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
            Rotation turns the face direction (0° = up on the 2D plan) — the
            marker's tick and the 3D body follow it. Align it to a wall.
          </div>
        </div>
      `;
    }
  }

  private _pickFixtureEntity(kind: 'light' | 'switch', it: Light | SwitchFixture): void {
    this.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: kind,
        onPick: (id: string) => {
          it.entity_id = id;
          this.planner.save();
          this.planner.emitConfig();
        },
      },
    }));
  }

  private _deleteFixture(kind: 'light' | 'switch', idx: number): void {
    const f = this.planner.floor();
    if (kind === 'light') f.lights.splice(idx, 1);
    else                  f.switches.splice(idx, 1);
    this.planner.save();
    this.planner.emitConfig();
  }

  // ── Active sensor section ─────────────────────────────────────────────
  private _activeSensorSection() {
    const p = this.planner;
    const s = p.activeSensor();
    if (!s) return nothing;
    const devices = p.hass ? p.disc.listDevices(p.hass.states) : [];
    const f = p.floor();
    const sIdx = f.sensors.indexOf(s);
    const u = (k: keyof Sensor, parse: (v: string) => unknown = v => v) => (e: Event) => {
      (s as unknown as Record<string, unknown>)[k as string] = parse((e.target as HTMLInputElement).value);
      p.save(); p.emitConfig();
    };
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div style="font-size:11px;font-weight:600;color:var(--text-dim);margin-bottom:4px">
          Sensor — ${s.label || 'Unnamed'}
        </div>
        <div class="row"><label>Label</label>
          <input type="text" .value=${s.label} @input=${u('label')}></div>
        ${this._lockRow(s)}
        <div class="row"><label>X (mm)</label>
          <input type="number" .value=${String(s.x)} @input=${u('x', v => parseFloat(v) || 0)}></div>
        <div class="row"><label>Y (mm)</label>
          <input type="number" .value=${String(s.y)} @input=${u('y', v => parseFloat(v) || 0)}></div>
        <div class="row"><label>Heading (°)</label>
          <input type="number" .value=${String(s.heading)}
                 @input=${(e: Event) => {
                   const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                   s.heading = ((Math.round(v) % 360) + 360) % 360;
                   p.save(); p.emitConfig();
                 }}></div>
        <div class="row"><label>FOV (°)</label>
          <input type="number" .value=${String(s.fov)}
                 @input=${(e: Event) => {
                   const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                   s.fov = Math.max(5, Math.min(360, v));
                   p.save(); p.emitConfig();
                 }}></div>
        <div class="row"><label>Range (mm)</label>
          <input type="number" .value=${String(s.range)}
                 @input=${(e: Event) => {
                   const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                   s.range = Math.max(100, v);
                   p.save(); p.emitConfig();
                 }}></div>
        <div class="row"><label>Target color</label>
          <input type="color" .value=${sensorColor(s, sIdx)}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${(e: Event) => {
                   s.color = (e.target as HTMLInputElement).value;
                   p.save(); p.emitConfig();
                 }}>
          <button class="btn" style="font-size:10px;padding:2px 6px"
                  title="Reset to palette default — tints this sensor's T1/T2/T3 dots"
                  @click=${() => { s.color = undefined; p.save(); p.emitConfig(); }}>↺</button>
        </div>
        <div class="row" title="Color of the spinning plumbob above avatars seen by this sensor — so you can tell which sensor detected them. Default = this sensor's color.">
          <label>Plumbob</label>
          <input type="color" .value=${s.plumbobColor || sensorColor(s, sIdx)}
                 style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
                 @input=${(e: Event) => { s.plumbobColor = (e.target as HTMLInputElement).value; p.save(); p.emitConfig(); }}>
          <button class="btn" style="font-size:10px;padding:2px 6px"
                  title="Reset to default (this sensor's color)"
                  @click=${() => { s.plumbobColor = undefined; p.save(); p.emitConfig(); }}>✕</button>
        </div>
        ${this._avatarGrid(s, (mut: () => void) => { mut(); p.save(); p.emitConfig(); })}
        <div class="row"><label>HA Device</label>
          <!-- Use .value (property) not ?selected (attribute) so a freshly-
               dropped sensor with deviceSlug=null reliably resets to the
               "— unbound —" option even when Lit reuses the prior <select>. -->
          <select .value=${s.deviceSlug || ''}
                  @change=${(e: Event) => {
                    // bindSensor runs discovery + zone/object sync immediately
                    // (with retries) so zones load without a manual click.
                    p.bindSensor(s.id, (e.target as HTMLSelectElement).value || null);
                  }}>
            <option value="">— unbound —</option>
            ${devices.map(d => html`
              <option value=${d}>
                ${d.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </option>
            `)}
          </select>
        </div>
        <button class="btn danger" style="width:100%;margin-top:8px"
                @click=${() => {
                  const f = p.floor();
                  f.sensors = f.sensors.filter(x => x.id !== s.id);
                  p.store.activeSensorId = null;
                  p.save(); p.emitConfig();
                }}>Delete sensor</button>
      </div>
    `;
  }

  // ── HA sections (zones / objects / targets / sensor cfg) ──────────────
  private _haSections() {
    const p = this.planner;
    const s = p.activeSensor();
    if (!s || !s.deviceSlug) return nothing;
    const d = p.discBy[s.id];
    if (!d) return nothing;
    p.ensureLiveState(s.id);

    // Gate editor UI until discovery has surfaced zones AND objects.
    // ESPHome publishes entities incrementally on first connect; until both
    // arrays are non-empty the user would be editing stub data that gets
    // overwritten on the next slow-sync.
    const ready = d.inclusionZoneSlugs.length > 0 || d.objectSlugs.length > 0;
    if (!ready) {
      return html`
        <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
          <div style="font-size:11px;font-weight:600;color:var(--text-dim);margin-bottom:4px">
            ${s.label || 'Sensor'}
          </div>
          <div style="font-size:11px;color:var(--text-dim);padding:8px;text-align:center;
                      border:1px dashed var(--border);border-radius:4px">
            Loading entities from <code>${s.deviceSlug}</code>…<br>
            <span style="font-size:10px;opacity:0.7">
              ESPHome reports entities incrementally — zones &amp; objects
              will appear once the device finishes its initial publish.
            </span>
          </div>
        </div>
      `;
    }

    const zones = p.zonesBy[s.id]; const objs = p.objectsBy[s.id];
    return html`
      <div style="background:rgba(0,0,0,0.25);border-radius:4px;padding:6px;margin:4px 0">
        <div style="font-size:11px;font-weight:600;color:var(--text-dim);margin-bottom:4px">
          ${s.label || 'Sensor'} — HA data
        </div>
        <h3>Inclusion Zones</h3>
        ${d.inclusionZoneSlugs.length === 0
          ? html`<div style="font-size:11px;color:var(--text-dim);padding:4px 0">Loading…</div>`
          : zones.inclusion.slice(0, d.inclusionZoneSlugs.length)
              .map((z, zi) => this._zoneRow(s, 'iz', zi, z, '#2196f3'))}
        <h3 style="margin-top:14px">Filter Zones</h3>
        ${d.filterZoneSlugs.length === 0
          ? html`<div style="font-size:11px;color:var(--text-dim);padding:4px 0">Loading…</div>`
          : zones.filter.slice(0, d.filterZoneSlugs.length)
              .map((z, zi) => this._zoneRow(s, 'fz', zi, z, '#f44336'))}
        <h3 style="margin-top:14px">Object Halos</h3>
        ${d.objectSlugs.length === 0
          ? html`<div style="font-size:11px;color:var(--text-dim);padding:4px 0">Loading…</div>`
          : objs.slice(0, d.objectSlugs.length)
              .map((o, oi) => this._objectRow(s, oi, o))}
        <h3 style="margin-top:14px">Targets</h3>
        <div style="display:flex;align-items:center;gap:6px;padding:2px 0 4px;font-size:11px;color:var(--text-dim)">
          <span style="flex:1">${p.useRawTargets ? 'Raw' : 'Averaged'}</span>
          <label class="mini-toggle">
            <input type="checkbox" .checked=${!p.useRawTargets}
                   @change=${(e: Event) => {
                     p.useRawTargets = !(e.target as HTMLInputElement).checked;
                     p.store.useRawTargets = p.useRawTargets;
                     p.save(); p.emitConfig();
                   }}>
            <span></span>
          </label>
        </div>
        ${[0, 1, 2].map(i => html`
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;padding:2px 0;border-bottom:1px solid var(--border)">
            <div style="width:8px;height:8px;border-radius:50%;background:${['#4fc3f7','#81c784','#ffb74d'][i]}"></div>
            <span>T${i + 1}</span>
          </div>
        `)}
        <h3 style="margin-top:14px" class="collapsible-header ${this._cfgOpen ? 'open' : ''}"
            @click=${() => { this._cfgOpen = !this._cfgOpen; }}>
          Sensor Configuration <span class="collapse-arrow">▸</span>
        </h3>
        ${this._cfgOpen ? this._sensorCfgBody(s, d) : nothing}
      </div>
    `;
  }

  private _zoneRow(s: Sensor, prefix: 'iz' | 'fz', zi: number, z: Zone, dotColor: string) {
    const p = this.planner;
    const expanded = (prefix === 'iz' ? p.izExpanded : p.fzExpanded)[s.id];
    const slug = (prefix === 'iz' ? p.discBy[s.id]?.inclusionZoneSlugs
                                  : p.discBy[s.id]?.filterZoneSlugs)?.[zi];
    const enId = slug ? `switch.${s.deviceSlug}_${slug}_enable` : null;
    const isExp = expanded.has(zi);
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:6px;padding:4px 0">
          <div class="zone-dot" style="background:${dotColor};opacity:${z.enabled ? 1 : 0.3}"></div>
          <span style="flex:1;font-size:12px">${z.name}</span>
          <label class="mini-toggle">
            <input type="checkbox" .checked=${z.enabled}
                   @change=${(e: Event) => p.setZoneEnabled(s, prefix, zi,
                     (e.target as HTMLInputElement).checked, enId)}>
            <span></span>
          </label>
          <button class="icon-btn edit-btn" title=${isExp ? 'Hide anchors' : 'Show anchors'}
                  style=${isExp ? `color:${prefix === 'iz' ? '#90caf9' : '#ef9a9a'}` : ''}
                  @click=${() => {
                    if (z.vertices.length < 3) { startZoneEdit(p, s.id, prefix, zi); return; }
                    if (expanded.has(zi)) expanded.delete(zi); else expanded.add(zi);
                    p.emitConfig();
                  }}>${isExp ? '✕' : '✏'}</button>
        </div>
        ${isExp ? this._zoneEditor(s, prefix, zi, z.vertices) : nothing}
      </div>
    `;
  }

  private _zoneEditor(s: Sensor, prefix: 'iz' | 'fz', zi: number, vertices: { x: number; y: number }[]) {
    const p = this.planner;
    const verts = vertices.length ? [...vertices] : [{ x: 0, y: 0 }];
    while (verts.length < 3) verts.push({ x: 0, y: 0 });
    const onSave = (vi: number, axis: 'x' | 'y') => (e: Event) => {
      const v = parseFloat((e.target as HTMLInputElement).value) || 0;
      verts[vi] = { ...verts[vi], [axis]: v };
      p.saveZoneVertex(s, prefix, zi, vi, verts[vi].x, verts[vi].y);
    };
    return html`
      <div style="background:rgba(0,0,0,0.3);border-radius:4px;padding:6px;margin-bottom:4px">
        <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:3px;margin-bottom:4px;font-size:11px">
          <span style="color:var(--text-dim)">X mm</span>
          <span style="color:var(--text-dim)">Y mm</span>
          <span></span>
          ${verts.map((v, vi) => html`
            <input type="number" .value=${String(Math.round(v.x))} @change=${onSave(vi, 'x')}
                   style="width:100%;background:#111;border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:11px;padding:2px 4px">
            <input type="number" .value=${String(Math.round(v.y))} @change=${onSave(vi, 'y')}
                   style="width:100%;background:#111;border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:11px;padding:2px 4px">
            <button class="icon-btn" title="Remove vertex"
                    @click=${() => { verts.splice(vi, 1); p.saveAllZoneVertices(s, prefix, zi, verts); }}>✕</button>
          `)}
        </div>
        <div style="display:flex;gap:4px;margin-top:4px">
          ${verts.length < 8 ? html`
            <button class="btn" style="font-size:11px;padding:2px 6px"
                    @click=${() => startZoneEdit(p, s.id, prefix, zi)}>+ Vertex</button>
          ` : nothing}
          <button class="btn danger" style="font-size:11px;padding:2px 6px"
                  @click=${() => { if (confirm('Clear all vertices for this zone?'))
                                    p.saveAllZoneVertices(s, prefix, zi, []); }}>⟳ Reset</button>
        </div>
      </div>
    `;
  }

  private _objectRow(s: Sensor, oi: number, obj: ObjectHalo) {
    const p = this.planner;
    const slug = p.discBy[s.id]?.objectSlugs?.[oi];
    const enId = slug ? `switch.${s.deviceSlug}_${slug}_halo_enable` : null;
    const isExp = p.editObject[s.id] === oi;
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:6px;padding:4px 0">
          <span style="opacity:${obj.enabled ? 1 : 0.35}">${obj.icon}</span>
          <span style="flex:1;font-size:12px">${obj.name}</span>
          <label class="mini-toggle">
            <input type="checkbox" .checked=${obj.enabled}
                   @change=${(e: Event) => p.setObjectEnabled(s, oi,
                     (e.target as HTMLInputElement).checked, enId)}>
            <span></span>
          </label>
          <button class="icon-btn edit-btn" title="Edit object"
                  @click=${() => { p.editObject[s.id] = (p.editObject[s.id] === oi) ? -1 : oi; p.emitConfig(); }}>
            ✏
          </button>
        </div>
        ${isExp ? this._objectEditor(s, oi, obj) : nothing}
      </div>
    `;
  }

  private _objectEditor(s: Sensor, oi: number, obj: ObjectHalo) {
    const p = this.planner;
    const numIn = (val: number, onSave: (v: number) => void) => html`
      <input type="number" .value=${String(Math.round(val))}
             @change=${(e: Event) => onSave(parseFloat((e.target as HTMLInputElement).value) || 0)}
             style="width:100%;background:#111;border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:11px;padding:2px 4px">
    `;
    const ICONS = ['📍','💺','🖥','🚪','🛋','🪑','🛏','📺','🚿','📦','🪴','🗑','🖨','🛒','🚗','🐕'];
    return html`
      <div style="background:rgba(0,0,0,0.3);border-radius:4px;padding:6px;margin-bottom:4px">
        <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 8px;font-size:11px;align-items:center">
          <span style="color:var(--text-dim)">X (mm)</span>
          ${numIn(obj.x, v => p.saveObjectField(s, oi, 'x', v))}
          <span style="color:var(--text-dim)">Y (mm)</span>
          ${numIn(obj.y, v => p.saveObjectField(s, oi, 'y', v))}
          <span style="color:var(--text-dim)">Radius</span>
          ${numIn(obj.radius, v => p.saveObjectField(s, oi, 'radius', v))}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin:6px 0 3px">Icon</div>
        <div style="display:flex;flex-wrap:wrap;gap:3px">
          ${ICONS.map(icon => html`
            <button @click=${() => { obj.icon = icon; p.save(); p.emitConfig(); }}
                    style="font-size:15px;padding:2px 3px;border-radius:3px;cursor:pointer;line-height:1.2;
                           background:${obj.icon === icon ? 'var(--accent)' : '#222'};
                           border:1px solid ${obj.icon === icon ? 'var(--accent)' : 'var(--border)'};
                           color:var(--text)">
              ${icon}
            </button>
          `)}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:5px">
          Enable then drag the halo on the 2D view to reposition.
        </div>
      </div>
    `;
  }

  private _sensorCfgBody(s: Sensor, d: { sensorHeight: string|null; mountAngle: string|null;
                                          ghostbuster: string|null; multiTarget: string|null;
                                          upsideDown: string|null }) {
    const p = this.planner;
    const states = p.hass?.states;
    if (!states) return nothing;
    const numRow = (label: string, entityId: string|null, min: number, max: number,
                    step: number, unit?: string) => {
      if (!entityId || !states[entityId]) return nothing;
      const cur = Math.round(parseFloat(states[entityId].state));
      return html`
        <div class="sensor-cfg-row">
          <label>${label}</label>
          <input type="number" min=${min} max=${max} step=${step} .value=${String(cur)}
                 @change=${(e: Event) => p.hass?.callService('number', 'set_value',
                   { entity_id: entityId, value: parseFloat((e.target as HTMLInputElement).value) || 0 })}>
          ${unit ? html`<span style="color:var(--text-dim);font-size:10px;margin-left:2px">${unit}</span>` : nothing}
        </div>
      `;
    };
    const togRow = (label: string, entityId: string|null) => {
      if (!entityId || !states[entityId]) return nothing;
      const isOn = states[entityId].state === 'on';
      return html`
        <div class="sensor-cfg-row">
          <label>${label}</label>
          <label class="mini-toggle">
            <input type="checkbox" .checked=${isOn}
                   @change=${(e: Event) => p.hass?.callService('switch',
                     (e.target as HTMLInputElement).checked ? 'turn_on' : 'turn_off',
                     { entity_id: entityId })}>
            <span></span>
          </label>
        </div>
      `;
    };
    return html`
      <div>
        ${numRow('Height', d.sensorHeight, 0, 5000, 1, 'mm')}
        ${numRow('Tilt Angle', d.mountAngle, -90, 90, 1, '°')}
        ${togRow('Ghostbuster', d.ghostbuster)}
        ${togRow('Multi-Target', d.multiTarget)}
        ${togRow('Upside Down', d.upsideDown)}
      </div>
    `;
  }

  // ── 2D layers section ─────────────────────────────────────────────────
  private _layers2dSection() {
    const p = this.planner;
    const L = p.store.layers2d ?? {};
    const isOn = (k: keyof Layers2D) => (k === 'activity' || k === 'vacuumMap' || k === 'heatmap') ? L[k] === true : L[k] !== false;
    const setLayers = (nl: Layers2D | undefined) => {
      p.store.layers2d = nl; p.save(); p.emitConfig();
    };
    const presets = p.store.layerPresets2d ?? [];
    const defs: { key: keyof Layers2D; label: string }[] = [
      { key: 'bg', label: 'Background image' },
      { key: 'walls', label: 'Walls' },
      { key: 'labels', label: 'Room labels' },
      { key: 'furniture', label: 'Furniture' },
      { key: 'appliances', label: 'Appliances' },
      { key: 'lights', label: 'Lights' },
      { key: 'switches', label: 'Switches' },
      { key: 'sensors', label: 'mmWave sensors' },
      { key: 'motion', label: 'Motion sensors' },
      { key: 'env', label: 'Env sensors' },
      { key: 'info', label: 'Info cards' },
      { key: 'zones', label: 'Zones & halos' },
      { key: 'ground', label: 'Ground / yard' },
      { key: 'vacuumMap', label: 'Vacuum room map' },
      { key: 'heatmap', label: 'Temperature heat-map' },
      { key: 'grid', label: '3D grid' },
      { key: 'targets', label: 'Avatars' },
      { key: 'geo', label: 'Geo landmarks' },
      { key: 'weatherFx', label: 'Weather effects (3D)' },
      { key: 'nameLabels', label: 'Name labels' },
      { key: 'battery', label: 'Battery warnings' },
      { key: 'activity', label: 'Activity glow' },
    ];
    // Display order only: alphabetical by label (locale compare). The preset
    // save loop keys by `d.key`, so display order doesn't affect semantics.
    const sortedDefs = [...defs].sort((a, b) => a.label.localeCompare(b.label));
    return this._section('layers', 'Layers', () => html`
        <div class="row"><label>Preset</label>
          <select @change=${(e: Event) => {
                    const el = e.target as HTMLSelectElement;
                    const v = el.value; el.value = '';
                    if (v === 'full') setLayers(undefined);
                    else if (v === 'simple') setLayers({
                      bg: false, furniture: false, appliances: false, lights: false,
                      switches: false, sensors: false,
                      motion: false, env: false, zones: false, targets: true, activity: true,
                    });
                    else {
                      const pr = presets.find(x => x.id === v);
                      if (pr) setLayers({ ...pr.layers });
                    }
                  }}>
            <option value="">apply…</option>
            <option value="full">Full (everything)</option>
            <option value="simple">Simple floorplan</option>
            ${presets.map(pr => html`<option value=${pr.id}>${pr.name}</option>`)}
          </select>
        </div>
        ${sortedDefs.map(d => html`
          <label class="row" style="padding:0">
            <span style="color:var(--text-dim);font-size:11px;flex:1">${d.label}</span>
            <span class="mini-toggle">
              <input type="checkbox" .checked=${isOn(d.key)}
                     @change=${(e: Event) => {
                       const nl: Layers2D = { ...(p.store.layers2d ?? {}) };
                       nl[d.key] = (e.target as HTMLInputElement).checked;
                       setLayers(nl);
                     }}>
              <span></span>
            </span>
          </label>`)}
        <div style="border-top:1px solid var(--border);margin:6px 0"></div>
        <label class="row" style="padding:0"
               title="Show mmWave sensor coverage cones (2D + 3D)">
          <span style="color:var(--text-dim);font-size:11px;flex:1">mmWave coverage</span>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${p.store.coverage}
                   @change=${(e: Event) => { p.store.coverage = (e.target as HTMLInputElement).checked; p.save(); p.emitConfig(); }}>
            <span></span>
          </span>
        </label>
        <label class="row" style="padding:0"
               title="Show motion sensor coverage zones">
          <span style="color:var(--text-dim);font-size:11px;flex:1">Motion zones</span>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${p.store.showMotionZones !== false}
                   @change=${(e: Event) => { p.store.showMotionZones = (e.target as HTMLInputElement).checked; p.save(); p.emitConfig(); }}>
            <span></span>
          </span>
        </label>
        <label class="row" style="padding:0"
               title="Show the per-target detail overlay">
          <span style="color:var(--text-dim);font-size:11px;flex:1">Target details</span>
          <span class="mini-toggle">
            <input type="checkbox" .checked=${p.showDetails}
                   @change=${(e: Event) => {
                     p.showDetails = (e.target as HTMLInputElement).checked;
                     p.store.showDetails = p.showDetails;
                     p.save(); p.emitConfig();
                   }}>
            <span></span>
          </span>
        </label>
        <div style="display:flex;gap:4px;margin-top:6px">
          <button class="btn" style="flex:1;font-size:11px" @click=${() => {
            const name = prompt('Preset name:', `Layers ${presets.length + 1}`);
            if (!name) return;
            if (!p.store.layerPresets2d) p.store.layerPresets2d = [];
            const cur: Layers2D = {};
            for (const d of defs) cur[d.key] = isOn(d.key);
            p.store.layerPresets2d.push({ id: newId('lp'), name, layers: cur });
            p.save(); p.emitConfig();
          }}>💾 Save preset…</button>
          ${presets.length ? html`
            <button class="btn" style="font-size:11px" title="Delete a saved preset" @click=${() => {
              const name = prompt(`Delete which preset?\n${presets.map(x => x.name).join(', ')}`,
                                  presets[presets.length - 1].name);
              if (!name) return;
              const i = presets.findIndex(x => x.name === name);
              if (i >= 0) { presets.splice(i, 1); p.save(); p.emitConfig(); }
            }}>🗑</button>
          ` : nothing}
        </div>
        <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
          "Simple floorplan" hides fixtures but keeps activity glow: rooms with
          lights on or motion light up on the bare plan.
        </div>
    `);
  }

  // ── GPS / Geo section (Feature G, phase G1) ───────────────────────────────
  // Landmark calibration UI. Runtime-only card state (which landmark's card is
  // open + the chosen tracker/slug/message); the active sampling SESSION lives
  // in Planner.geoCalib so the live sample counter survives re-renders. The
  // whole section (and calibration flow) is edit-only — the sidebar itself only
  // renders in edit mode (see app.ts).
  @state() private _calibLandmarkId: string | null = null;
  // Manual lat/lon entry (per-landmark): which landmark's editor is open + its
  // draft field strings (prefilled from the landmark, or split from a pasted
  // "lat, lon" clipboard string). Runtime-only, edit-mode only.
  @state() private _manualLandmarkId: string | null = null;
  @state() private _manualLat = '';
  @state() private _manualLon = '';
  @state() private _manualErr = '';
  @state() private _calibTrackerId = '';
  @state() private _calibSlug = '';
  @state() private _calibMsg = '';
  @state() private _calibBusy = false;
  // 1 s liveness ticker: while an active session's card is on screen we force a
  // re-render every second so elapsed time / "last fix ago" stay current even
  // when zero samples arrive. Reconciled in updated(); cleared on disconnect.
  private _calibLiveTimer: ReturnType<typeof setInterval> | null = null;
  private _reconcileCalibLiveTimer(): void {
    const gc = this.planner.geoCalib;
    const show = !!gc && !this._collapsed.has('geo') && this._calibLandmarkId === gc.landmarkId;
    if (show && !this._calibLiveTimer) {
      this._calibLiveTimer = setInterval(() => this.requestUpdate(), 1000);
    } else if (!show && this._calibLiveTimer) {
      clearInterval(this._calibLiveTimer);
      this._calibLiveTimer = null;
    }
  }

  private _geoSection() {
    const p = this.planner;
    const landmarks = p.geoLandmarks();
    const fit = p.geoFit();
    const calCount = landmarks.filter(l => l.lat != null && l.lon != null).length;
    const placingNew = p.placingLandmarkId === NEW_LANDMARK;
    const geo = p.store.geo;
    return this._section('geo', 'GPS / Geo', () => html`
        ${placingNew ? html`
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim);padding:4px 0">
            <span style="flex:1">📍 Click on the plan to place the landmark…</span>
            <button class="btn" style="font-size:10px;padding:2px 6px"
                    @click=${() => { p.placingLandmarkId = null; p.emitConfig(); }}>Cancel</button>
          </div>` : nothing}
        ${landmarks.length === 0 && !placingNew ? html`
          <div style="color:var(--text-dim);font-size:11px;padding:4px 0">
            No landmarks yet. Add one, click a known spot on the plan, then calibrate
            it by standing there with your phone (open-sky, away from walls).
          </div>` : nothing}
        ${landmarks.map(lm => this._landmarkItem(lm))}
        <button class="btn" style="width:100%;margin-top:6px"
                @click=${() => { p.placingLandmarkId = NEW_LANDMARK; p.maybeCloseSidebarForPlacement(); p.emitConfig(); }}>
          + Add landmark
        </button>

        ${fit ? this._geoFitReadout(fit) : nothing}
        ${this._gpsPinsPreview()}

        ${calCount === 1 ? html`
          <div class="row" style="margin-top:8px"
               title="Compass bearing (° clockwise from true north) that plan +Y points. 0 = plan +Y faces true north. Used only with a single calibrated landmark.">
            <label>North bearing°</label>
            <input type="number" step="1" .value=${String(geo?.northDeg ?? 0)}
                   @change=${(e: Event) => p.setGeo(g => {
                     const v = parseFloat((e.target as HTMLInputElement).value);
                     g.northDeg = isFinite(v) ? ((v % 360) + 360) % 360 : 0;
                   })}>
          </div>` : nothing}

        <div class="row" style="margin-top:8px"
             title="How far past the floor bounding box GPS pins may render (metres). Used in G2.">
          <label>Boundary (m)</label>
          <input type="number" min="0" step="5" .value=${String(geo?.boundaryM ?? 30)}
                 @change=${(e: Event) => p.setGeo(g => {
                   const v = parseFloat((e.target as HTMLInputElement).value);
                   g.boundaryM = isFinite(v) ? Math.max(0, v) : 30;
                 })}>
        </div>
        <div class="row"
             title="Calibration drops GPS samples worse than this accuracy (metres).">
          <label>Accuracy gate (m)</label>
          <input type="number" min="1" step="5" .value=${String(geo?.accuracyGateM ?? 30)}
                 @change=${(e: Event) => p.setGeo(g => {
                   const v = parseFloat((e.target as HTMLInputElement).value);
                   g.accuracyGateM = isFinite(v) ? Math.max(1, v) : 30;
                 })}>
        </div>
        <div class="row" style="margin-top:8px"
             title="Show geo_location.* event pins (earthquakes, fires…) projected onto the plan through the geo transform. Requires ≥1 calibrated landmark.">
          <label>Nearby events</label>
          <button class="btn" style="font-size:11px;flex:1"
                  @click=${() => p.setGeo(g => { g.showEvents = g.showEvents === false; })}>
            ${p.geoShowEvents() ? '🌐 Showing (quakes, fires…)' : '— Hidden'}
          </button>
        </div>
    `);
  }

  private _landmarkItem(lm: GeoLandmark) {
    const p = this.planner;
    const calibrated = lm.lat != null && lm.lon != null;
    // Manually-entered landmarks have no sampling run (sampleCount absent).
    const manual = calibrated && lm.sampleCount == null;
    const dateStr = lm.sampledAt ? ` · ${new Date(lm.sampledAt).toLocaleDateString()}` : '';
    const status = !calibrated
      ? 'uncalibrated'
      : manual
        ? `manual${dateStr}`
        : `${lm.accuracy != null ? `±${Math.round(lm.accuracy)} m` : 'calibrated'}`
          + ` · ${lm.sampleCount} samples${dateStr}`;
    const cardOpen = this._calibLandmarkId === lm.id;
    const manualOpen = this._manualLandmarkId === lm.id;
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item" style="cursor:default;gap:4px">
          <div class="dot" style="background:${calibrated ? '#4dd0e1' : '#90a4ae'}"></div>
          <input type="text" .value=${lm.name} style="flex:1;min-width:0" placeholder="Landmark name…"
                 @input=${(e: Event) => p.updateLandmark(lm.id, l => { l.name = (e.target as HTMLInputElement).value; })}>
          <button class="icon-btn" title=${lm.hidden ? 'Show pin' : 'Hide pin'}
                  @click=${() => p.updateLandmark(lm.id, l => { l.hidden = !l.hidden; })}>
            ${lm.hidden ? '🙈' : '👁'}</button>
          <button class="icon-btn" title="Re-place pin on the plan"
                  @click=${() => { p.placingLandmarkId = lm.id; p.maybeCloseSidebarForPlacement(); p.emitConfig(); }}>📍</button>
          <button class="icon-btn" title="Delete"
                  @click=${() => { if (this._calibLandmarkId === lm.id) this._calibLandmarkId = null; p.deleteLandmark(lm.id); }}>✕</button>
        </div>
        <div style="font-size:10px;color:${calibrated ? 'var(--text-dim)' : '#ffb74d'};padding:0 0 3px 20px">
          ${status}
        </div>
        <div style="padding:0 0 4px 20px;display:flex;gap:4px;flex-wrap:wrap;align-items:center">
          <button class="btn" style="font-size:10px;padding:2px 8px"
                  @click=${() => {
                    if (cardOpen) { this._calibLandmarkId = null; return; }
                    this._calibLandmarkId = lm.id;
                    this._calibMsg = '';
                    // Default the tracker from a Person's GPS tracker if any.
                    if (!this._calibTrackerId) {
                      const tid = (p.store.people ?? []).map(pe => pe.gpsTrackerId).find(Boolean);
                      if (tid) { this._calibTrackerId = tid; this._calibSlug = p.notifySlugFor(tid); }
                    }
                    this.requestUpdate();
                  }}>
            ${cardOpen ? 'Close' : 'Calibrate…'}
          </button>
          <button class="btn" style="font-size:10px;padding:2px 8px"
                  title="Type or paste lat/lon directly (skips GPS sampling)"
                  @click=${() => {
                    if (manualOpen) { this._manualLandmarkId = null; return; }
                    this._manualLandmarkId = lm.id;
                    this._manualErr = '';
                    this._manualLat = lm.lat != null ? lm.lat.toFixed(6) : '';
                    this._manualLon = lm.lon != null ? lm.lon.toFixed(6) : '';
                    this.requestUpdate();
                  }}>
            ${manualOpen ? 'Close' : '✏️ Set coordinates…'}
          </button>
          ${calibrated ? html`
            <button class="btn" style="font-size:10px;padding:2px 8px"
                    title="Clear lat/lon — return to uncalibrated"
                    @click=${() => {
                      if (this._manualLandmarkId === lm.id) this._manualLandmarkId = null;
                      p.updateLandmark(lm.id, l => {
                        delete l.lat; delete l.lon;
                        delete l.accuracy; delete l.sampleCount; delete l.sampledAt;
                      });
                    }}>✕ clear coords</button>` : nothing}
        </div>
        ${manualOpen ? this._manualCoordCard(lm) : nothing}
        ${cardOpen ? this._calibCard(lm) : nothing}
      </div>
    `;
  }

  // Manual lat/lon entry card. The Latitude field accepts a pasted combined
  // "lat, lon" string (Google/Apple Maps copy format) and splits it across both
  // fields. Apply validates ranges, sets lat/lon + sampledAt, and CLEARS the
  // sampling metadata (accuracy/sampleCount) — those describe a sampling run
  // that didn't happen, so the fit-quality readout stays honest.
  private _manualCoordCard(lm: GeoLandmark) {
    const p = this.planner;
    // Split a pasted "lat, lon" pair across both fields (Latitude field only).
    const trySplit = (raw: string): boolean => {
      const pair = parseLatLon(raw);
      if (!pair) return false;
      this._manualLat = pair.lat.toFixed(6);
      this._manualLon = pair.lon.toFixed(6);
      this._manualErr = '';
      this.requestUpdate();
      return true;
    };
    const apply = () => {
      const lat = Number(this._manualLat.trim());
      const lon = Number(this._manualLon.trim());
      if (!this._manualLat.trim() || !this._manualLon.trim() || !isFinite(lat) || !isFinite(lon)) {
        this._manualErr = 'Enter both latitude and longitude.'; this.requestUpdate(); return;
      }
      if (lat < -90 || lat > 90) { this._manualErr = 'Latitude must be between −90 and 90.'; this.requestUpdate(); return; }
      if (lon < -180 || lon > 180) { this._manualErr = 'Longitude must be between −180 and 180.'; this.requestUpdate(); return; }
      p.updateLandmark(lm.id, l => {
        l.lat = lat; l.lon = lon;
        l.sampledAt = new Date().toISOString();
        delete l.accuracy; delete l.sampleCount;
      });
      this._manualErr = '';
      this._manualLandmarkId = null;
      this.requestUpdate();
    };
    return html`
      <div style="background:rgba(0,0,0,0.28);border-radius:4px;padding:6px;margin:2px 0 6px 20px">
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;line-height:1.35">
          Type or paste coordinates. Pasting a <code>lat, lon</code> pair into Latitude fills both.
        </div>
        <div class="row" style="margin-top:0"><label>Latitude</label>
          <input type="number" step="any" placeholder="e.g. 45.123456" .value=${this._manualLat}
                 @paste=${(e: ClipboardEvent) => {
                   const raw = e.clipboardData?.getData('text') ?? '';
                   if (trySplit(raw)) e.preventDefault();
                 }}
                 @input=${(e: Event) => {
                   const v = (e.target as HTMLInputElement).value;
                   if (!trySplit(v)) this._manualLat = v;
                 }}>
        </div>
        <div class="row"><label>Longitude</label>
          <input type="number" step="any" placeholder="e.g. -93.123456" .value=${this._manualLon}
                 @input=${(e: Event) => { this._manualLon = (e.target as HTMLInputElement).value; }}>
        </div>
        <button class="btn" style="width:100%;margin-top:6px;font-size:11px" @click=${apply}>Apply coordinates</button>
        ${this._manualErr ? html`
          <div style="font-size:11px;margin-top:6px;padding:5px 7px;border-radius:4px;
                      background:rgba(120,0,0,0.35);color:#ff8a80;line-height:1.35">${this._manualErr}</div>` : nothing}
      </div>
    `;
  }

  private _calibCard(lm: GeoLandmark) {
    const p = this.planner;
    const gc = p.geoCalib;
    const active = gc?.landmarkId === lm.id;
    // Platform guidance: both platforms now get a request_location_update pump.
    const guidance = html`<div style="font-size:10px;color:var(--text-dim);line-height:1.35;margin-top:4px">
      Keep the HA app open in the foreground — the panel is requesting fixes every
      25 s, but iOS may still take minutes to answer. Android is also forced to 5 s
      high-accuracy updates.
    </div>`;
    // Live liveness readout (recomputed each render; the 1 s ticker drives it).
    let live = null;
    if (active && gc) {
      const now = Date.now();
      const totalSec = Math.max(0, Math.floor((now - new Date(gc.startedAt).getTime()) / 1000));
      const mmss = `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`;
      const lastFix = gc.lastSeenAt
        ? `last fix: ${Math.max(0, Math.round((now - new Date(gc.lastSeenAt).getTime()) / 1000))}s ago`
        : 'no fixes yet…';
      const excl = gc.exclAccuracy + gc.exclSource;
      live = html`
        <div style="font-size:11px;margin-bottom:4px;display:flex;align-items:center;gap:6px">
          <span class="diorama-calib-dot"></span>
          <span>Sampling <code>${gc.trackerId}</code></span>
        </div>
        <div style="font-size:11px;margin-bottom:2px">
          <b>${mmss}</b> elapsed · ${lastFix}
        </div>
        <div style="font-size:11px;margin-bottom:4px">
          <b>${gc.used}</b> used · ${excl} excluded
          <span style="color:var(--text-dim)">(${gc.exclAccuracy} accuracy · ${gc.exclSource} source)</span>
        </div>`;
    }
    return html`
      <div style="background:rgba(0,0,0,0.28);border-radius:4px;padding:6px;margin:2px 0 6px 20px">
        ${active ? html`
          ${live}
          <div style="font-size:10px;color:var(--text-dim);margin-bottom:4px">
            Stand at the landmark ≥3–5 min, then Finish. The median is pulled from
            history, so you can walk back inside first (closing the panel is fine).
          </div>
          ${guidance}
          <div style="display:flex;gap:4px;margin-top:6px">
            <button class="btn" style="flex:1;font-size:11px" ?disabled=${this._calibBusy}
                    @click=${async () => {
                      this._calibBusy = true; this.requestUpdate();
                      const res = await p.finishGeoCalibration();
                      this._calibBusy = false;
                      this._calibMsg = res.message;
                      this.requestUpdate();
                    }}>${this._calibBusy ? 'Finishing…' : 'Finish'}</button>
            <button class="btn" style="font-size:11px" ?disabled=${this._calibBusy}
                    @click=${() => { p.cancelGeoCalibration(); this._calibMsg = 'Calibration cancelled.'; }}>Cancel</button>
          </div>
        ` : html`
          <div class="row" style="margin-top:0"><label>Tracker</label>
            <span style="font-size:11px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${this._calibTrackerId || '— pick a device_tracker —'}
            </span>
            <button class="btn" style="font-size:10px;padding:2px 6px" @click=${() => {
              this.dispatchEvent(new CustomEvent('open-entity-picker', {
                bubbles: true, composed: true,
                detail: {
                  domain: 'device_tracker',
                  onPick: (id: string) => {
                    this._calibTrackerId = id;
                    this._calibSlug = this.planner.notifySlugFor(id);
                    this.requestUpdate();
                  },
                },
              }));
            }}>🔗</button>
          </div>
          <div class="row"
               title="Companion-app notify service used for the Android high-accuracy command. Auto-derived from the tracker; override if your device's notify slug differs.">
            <label>Notify slug</label>
            <input type="text" placeholder="mobile_app_…" .value=${this._calibSlug}
                   @input=${(e: Event) => { this._calibSlug = (e.target as HTMLInputElement).value; }}>
          </div>
          <button class="btn" style="width:100%;margin-top:6px;font-size:11px"
                  ?disabled=${!this._calibTrackerId}
                  @click=${() => {
                    p.startGeoCalibration(this._calibLandmarkId!, this._calibTrackerId, this._calibSlug);
                    this._calibMsg = '';
                  }}>▶ Start sampling</button>
          ${guidance}
        `}
        ${this._calibMsg ? html`
          <div style="font-size:11px;margin-top:6px;padding:5px 7px;border-radius:4px;
                      background:rgba(0,0,0,0.3);line-height:1.35">${this._calibMsg}</div>` : nothing}
      </div>
    `;
  }

  // Live GPS pin preview: each person with a current fix, with zone glyph +
  // distance/accuracy + staleness. Mirrors what the 2D/3D pins show.
  private _gpsPinsPreview() {
    const pins = this.planner.gpsPins;
    if (!pins.length) {
      // No pins (typically an uncalibrated geo transform). If raw fixes exist,
      // say so — otherwise the empty section looks like nobody is reporting.
      const reporting = (this.planner.store.people ?? [])
        .filter(pe => { const f = this.planner.gpsFixFor(pe); return f?.found && f.lat != null && f.lon != null; }).length;
      if (!reporting) return nothing;
      return html`<div style="margin-top:8px;font-size:10px;color:var(--text-dim)">
        fixes exist but need a calibrated landmark: ${reporting} person${reporting === 1 ? '' : 's'} reporting</div>`;
    }
    return html`
      <div style="margin-top:8px">
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:3px">GPS pins</div>
        ${pins.map(pin => {
          const where = pin.zone === 'indoor'
            ? `indoors ~±${Math.round(pin.accuracyMm / 1000)} m`
            : `${Math.round(pin.distanceM)} m ${compass8(pin.bearingDeg)}`;
          return html`
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;padding:2px 0">
              <span style="width:8px;height:8px;border-radius:50%;background:${pin.color};flex:none"></span>
              <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pin.name}</span>
              <span style="color:${pin.stale ? 'var(--text-dim)' : '#4dd0e1'}">
                ${gpsZoneGlyph(pin.zone)} ${where}${pin.stale ? ' · stale' : ''}</span>
            </div>`;
        })}
      </div>`;
  }

  private _geoFitReadout(fit: NonNullable<ReturnType<Planner['geoFit']>>) {
    const t = fit.transform;
    const scaleWarn = Math.abs(t.fittedScale - 1) > 0.15;
    let worst: { name: string; res: number } | null = null;
    if (t.quality === 'full' && t.residualsMm.length) {
      let mi = 0;
      for (let i = 1; i < t.residualsMm.length; i++) if (t.residualsMm[i] > t.residualsMm[mi]) mi = i;
      worst = { name: fit.landmarks[mi]?.name || 'Landmark', res: t.residualsMm[mi] };
    }
    return html`
      <div style="font-size:11px;margin-top:8px;padding:6px 8px;background:rgba(0,0,0,0.25);border-radius:4px;line-height:1.5">
        <div><b>Fit:</b> ${t.quality === 'single'
          ? '1 landmark + north bearing'
          : `${fit.landmarks.length} landmarks (Procrustes, scale locked at 1)`}</div>
        ${t.quality === 'full' ? html`
          <div>RMS residual: ${(t.rmsMm / 1000).toFixed(2)} m</div>
          <div>Fitted scale: ${t.fittedScale.toFixed(3)}
            ${scaleWarn ? html`<span style="color:#ff8a80"> ⚠ far from 1.0 — a landmark may be bad</span>` : nothing}
          </div>
          ${worst ? html`<div style="color:var(--text-dim)">Worst: ${worst.name} (±${(worst.res / 1000).toFixed(2)} m)</div>` : nothing}
        ` : html`<div style="color:var(--text-dim)">Add a second calibrated landmark to solve rotation from data.</div>`}
      </div>
    `;
  }

  // Per-floor overrides of the global colors/texture — lets each floor keep
  // its own flooring and wall paint while lighting stays global.
  private _floorLookOverrides(sc: { floorColor?: string; floorTex?: string; wallColor?: string }) {
    const p = this.planner;
    const f = p.floor();
    const lk = f.look3d ?? {};
    const upd = (mut: () => void) => {
      if (!f.look3d) f.look3d = {};
      mut();
      if (f.look3d && !Object.keys(f.look3d).length) f.look3d = null;
      p.save(); p.emitConfig();
    };
    const clearBtn = (has: boolean, clear: () => void) => has
      ? html`<button class="btn" style="font-size:10px;padding:2px 6px;margin-left:4px"
                     title="Use global value" @click=${() => upd(clear)}>↺</button>`
      : nothing;
    return html`
      <div class="row"><label>Floor color</label>
        <input type="color" .value=${lk.floorColor ?? sc.floorColor ?? '#101820'}
               style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
               @input=${(e: Event) => upd(() => { f.look3d!.floorColor = (e.target as HTMLInputElement).value; })}>
        ${clearBtn(lk.floorColor !== undefined, () => { delete f.look3d!.floorColor; })}
      </div>
      <div class="row"><label>Floor texture</label>
        <select .value=${lk.floorTex ?? 'inherit'}
                @change=${(e: Event) => upd(() => {
                  const v = (e.target as HTMLSelectElement).value;
                  if (v === 'inherit') delete f.look3d!.floorTex;
                  else f.look3d!.floorTex = v as import('../types.js').FloorTexKind;
                })}>
          <option value="inherit">(global)</option>
          <option value="none">None</option>
          <option value="wood">Wood</option>
          <option value="tile">Tile</option>
          <option value="concrete">Concrete</option>
        </select>
      </div>
      <div class="row"><label>Wall color</label>
        <input type="color" .value=${lk.wallColor ?? sc.wallColor ?? '#bbbbbb'}
               style="width:36px;height:24px;padding:0;border:1px solid var(--border);background:#111"
               @input=${(e: Event) => upd(() => { f.look3d!.wallColor = (e.target as HTMLInputElement).value; })}>
        ${clearBtn(lk.wallColor !== undefined, () => { delete f.look3d!.wallColor; })}
      </div>
    `;
  }

  // ── Imported 3D model (Sweet Home 3D OBJ) ─────────────────────────────
  private _model3dSection() {
    const p = this.planner;
    const f = p.floor();
    const m = f.model3d;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    return this._section('model3d', '3D Model (Sweet Home 3D)', () => html`
        <button class="btn" style="width:100%;margin-bottom:4px" @click=${this._importSh3dStructural}>
          Import .sh3d (structural)…
        </button>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin-bottom:6px">
          Reads a native <code>.sh3d</code> and builds real floors / walls /
          rooms / doors as a NEW configuration. The button below instead imports
          a visual OBJ mesh onto THIS floor (decorative shell, no editable walls).
        </div>
        <button class="btn" style="width:100%;margin-bottom:4px" @click=${this._importObj}>
          Import OBJ (+ MTL)…
        </button>
        ${m ? html`
          <div class="row"><label>File</label>
            <span style="font-size:11px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${m.name}
            </span>
          </div>
          <label class="row" style="padding:0">
            <span style="color:var(--text-dim);font-size:11px;flex:1">Visible</span>
            <span class="mini-toggle">
              <input type="checkbox" .checked=${m.visible}
                     @change=${(e: Event) => upd(() => { m.visible = (e.target as HTMLInputElement).checked; })}>
              <span></span>
            </span>
          </label>
          <div class="row"><label>Scale (mm/unit)</label>
            <input type="number" min="0.1" step="0.1" .value=${String(m.scale)}
                   @input=${(e: Event) => upd(() => {
                     m.scale = Math.max(0.1, parseFloat((e.target as HTMLInputElement).value) || 10);
                   })}>
          </div>
          <div class="row"><label>X offset (mm)</label>
            <input type="number" .value=${String(Math.round(m.x))}
                   @input=${(e: Event) => upd(() => { m.x = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
          </div>
          <div class="row"><label>Y offset (mm)</label>
            <input type="number" .value=${String(Math.round(m.y))}
                   @input=${(e: Event) => upd(() => { m.y = parseFloat((e.target as HTMLInputElement).value) || 0; })}>
          </div>
          <div class="row"><label>Rotation (°)</label>
            <input type="number" step="15" .value=${String(Math.round(m.rotation))}
                   @input=${(e: Event) => upd(() => {
                     const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                     m.rotation = ((Math.round(v / 15) * 15) % 360 + 360) % 360;
                   })}>
          </div>
          <div class="row"><label>Opacity</label>
            <input type="range" min="0.05" max="1" step="0.05" .value=${String(m.opacity)}
                   style="width:90px"
                   @input=${(e: Event) => upd(() => {
                     m.opacity = parseFloat((e.target as HTMLInputElement).value) || 1;
                   })}>
          </div>
          <button class="btn danger" style="width:100%;margin-top:4px" @click=${this._removeObj}>
            Remove model
          </button>
        ` : html`
          <div style="font-size:10px;color:var(--text-dim);line-height:1.4">
            Export from Sweet Home 3D via 3D view → Export to OBJ format.
            Select the .obj (and .mtl for colors). Sweet Home 3D uses cm, so
            the default scale of 10 mm/unit lines up 1:1.
          </div>
        `}
        ${m ? html`
          <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
            Model geometry is stored in this browser (IndexedDB) — re-import
            on other devices. Placement settings sync via HA.
          </div>
        ` : nothing}
    `);
  }

  private _importSh3dStructural = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.sh3d,application/octet-stream';
    inp.onchange = async () => {
      const file = inp.files?.[0]; if (!file) return;
      try {
        const { analyzeSh3dFile } = await import('../sh3d.js');
        const res = await analyzeSh3dFile(file, { importFurniture: true });
        if (!res.ok || !res.floors || !res.counts) {
          alert('Import failed: ' + (res.error ?? 'unknown error'));
          return;
        }
        const c = res.counts;
        const summary =
          `${file.name}: ${c.levels} level${c.levels === 1 ? '' : 's'}, ${c.walls} walls, ` +
          `${c.rooms} rooms, ${c.openings} doors/windows, ${c.furniture} furniture ` +
          `(${c.furnitureSkipped} skipped)\n\nCreate as a new configuration?`;
        if (!confirm(summary)) return;
        const name = res.name || file.name.replace(/\.sh3d$/i, '') || 'Imported home';
        const out = await this.planner.importSh3dConfig(name, res.floors);
        if (!out.ok) { alert('Import failed: ' + (out.error ?? 'unknown error')); return; }
        if (res.warnings && res.warnings.length) {
          alert(`Imported with ${res.warnings.length} warning(s):\n\n` + res.warnings.join('\n'));
        }
      } catch (err) {
        alert('Import failed: ' + (err as Error).message);
      }
    };
    inp.click();
  };

  private _importObj = () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.obj,.mtl';
    inp.multiple = true;
    inp.onchange = async () => {
      const files = [...(inp.files ?? [])];
      const objFile = files.find(f => f.name.toLowerCase().endsWith('.obj'));
      const mtlFile = files.find(f => f.name.toLowerCase().endsWith('.mtl'));
      if (!objFile) { alert('Select a .obj file (optionally with its .mtl).'); return; }
      const obj = await objFile.text();
      const mtl = mtlFile ? await mtlFile.text() : null;
      const p = this.planner;
      const f = p.floor();
      try {
        await saveModel(f.id, { obj, mtl });
      } catch (err) {
        alert('Failed to store model locally: ' + (err as Error).message);
        return;
      }
      f.model3d = {
        name: objFile.name,
        rev: (f.model3d?.rev ?? 0) + 1,
        scale: f.model3d?.scale ?? 10,   // SH3D exports cm
        x: f.model3d?.x ?? 0,
        y: f.model3d?.y ?? 0,
        rotation: f.model3d?.rotation ?? 0,
        opacity: f.model3d?.opacity ?? 1,
        visible: true,
      };
      p.save(); p.emitConfig();
    };
    inp.click();
  };

  private _removeObj = async () => {
    if (!confirm('Remove the imported 3D model from this floor?')) return;
    const p = this.planner;
    const f = p.floor();
    try { await deleteModel(f.id); } catch { /* ignore */ }
    f.model3d = null;
    p.save(); p.emitConfig();
  };

  // ── Background image section ──────────────────────────────────────────
  private _bgSection() {
    const p = this.planner;
    const f = p.floor();
    const bg = f.bg;
    const bgLayerOff = (p.store.layers2d?.bg === false);
    return this._section('bg', 'Background image', () => html`
        <button class="btn" style="width:100%;margin-bottom:4px" @click=${this._uploadBg}>
          Upload image…
        </button>
        ${bg && bgLayerOff ? html`
          <div style="font-size:10px;color:#ffb74d;margin-bottom:4px;line-height:1.3">
            The Background layer is off (2D Layers) — this image won't show until
            it's turned on.
          </div>` : nothing}
        ${bg ? this._bgControls(bg) : nothing}
    `, { style: 'margin-top:auto' });
  }

  private _bgControls(bg: BgImage) {
    const p = this.planner;
    const upd = (mut: () => void) => { mut(); p.save(); p.emitConfig(); };
    return html`
      <label class="row" style="padding:0">
        <span style="color:var(--text-dim);font-size:11px;flex:1">Visible</span>
        <span class="mini-toggle">
          <input type="checkbox" .checked=${bg.visible !== false}
                 @change=${(e: Event) => upd(() => { bg.visible = (e.target as HTMLInputElement).checked; })}>
          <span></span>
        </span>
      </label>
      <label class="row" style="padding:0">
        <span style="color:var(--text-dim);font-size:11px;flex:1">Locked</span>
        <span class="mini-toggle">
          <input type="checkbox" .checked=${!!bg.locked}
                 @change=${(e: Event) => upd(() => { bg.locked = (e.target as HTMLInputElement).checked; })}>
          <span></span>
        </span>
      </label>
      <div class="row"><label>Opacity</label>
        <input type="range" min="0.05" max="1" step="0.05" .value=${String(bg.opacity ?? 1)}
               style="width:90px"
               @input=${(e: Event) => { bg.opacity = parseFloat((e.target as HTMLInputElement).value) || 1; p.emitConfig(); }}
               @change=${() => p.save()}>
      </div>
      <div class="row"><label>Rotation°</label>
        <input type="number" min="-360" max="360" step="1" .value=${String(bg.rotation || 0)}
               @input=${(e: Event) => { bg.rotation = parseFloat((e.target as HTMLInputElement).value) || 0; p.emitConfig(); }}
               @change=${() => p.save()}>
      </div>
      <button class="btn danger" style="width:100%;margin-top:4px" @click=${this._clearBg}>
        Clear image
      </button>
      <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
        Drag to move. Drag corners to scale (Shift = preserve aspect).
      </div>
    `;
  }

  private _uploadBg = () => {
    const inp = document.createElement('input');
    // image/* covers svg in most browsers, but be explicit so Sweet Home 3D
    // SVG plan exports always appear in the picker.
    inp.type = 'file'; inp.accept = 'image/*,.svg,image/svg+xml';
    inp.onchange = () => {
      const file = inp.files?.[0]; if (!file) return;
      const rd = new FileReader();
      rd.onload = () => this._applyBg(rd.result as string);
      rd.readAsDataURL(file);
    };
    inp.click();
  };

  private _applyBg(dataUrl: string) {
    const isSvg = /^data:image\/svg\+xml/i.test(dataUrl);
    const img = new Image();
    img.onload = () => {
      const p = this.planner;
      const f = p.floor();
      let natW = img.naturalWidth, natH = img.naturalHeight;
      // (d) An SVG (or any image) that reports no intrinsic size can't be sized
      // by aspect — fall back to the floor rect so it isn't drawn degenerate.
      const degenerate = !natW || !natH;
      let finalUrl = dataUrl;
      // (c) A multi-MB dataURL bloats HA's user_data table and can fail the WS
      // push SILENTLY (save() only console.warns on error). Downscale big rasters
      // to <=2000 px max dimension (JPEG q0.85) before storing. SVG is vector
      // text with no pixels — exempt.
      if (!isSvg && !degenerate && dataUrl.length > 2_500_000) {
        const scale = Math.min(1, 2000 / Math.max(natW, natH));
        const cw = Math.max(1, Math.round(natW * scale));
        const ch = Math.max(1, Math.round(natH * scale));
        const cv = document.createElement('canvas');
        cv.width = cw; cv.height = ch;
        const cx = cv.getContext('2d');
        if (cx) {
          cx.drawImage(img, 0, 0, cw, ch);
          try { finalUrl = cv.toDataURL('image/jpeg', 0.85); natW = cw; natH = ch; }
          catch { /* keep the original on any toDataURL failure */ }
        }
      }
      const floorRatio = f.w / f.d;
      let bw: number, bh: number;
      if (degenerate) { bw = f.w; bh = f.d; }
      else {
        const ratio = natW / natH;
        if (ratio > floorRatio) { bw = f.w; bh = f.w / ratio; }
        else                    { bh = f.d; bw = f.d * ratio; }
      }
      f.bg = {
        dataUrl: finalUrl, x: f.w / 2, y: f.d / 2, w: bw, h: bh,
        rotation: 0, opacity: 1, visible: true, locked: false,
      };
      // (a) Adding an image is explicit intent to SEE it. If the bg layer is off
      // (e.g. a "Simple floorplan" preset is active) turn it back on, else the
      // new image silently never draws.
      const L = (p.store.layers2d ??= {});
      if (L.bg === false) L.bg = true;
      p.save(); p.emitConfig();
      this.requestUpdate();
    };
    // (b) Name the likely cause: iPhone HEIC/AVIF, TIFF, etc. don't decode.
    img.onerror = () => alert(
      "This image couldn't be decoded. Some camera formats (HEIC / AVIF from " +
      "iPhone, or TIFF) aren't supported by the browser — convert it to PNG, " +
      'JPG, SVG, or WebP and try again.');
    img.src = dataUrl;
  }

  private _clearBg = () => {
    if (!confirm('Remove background image from this floor?')) return;
    this.planner.floor().bg = null;
    this.planner.save();
    this.planner.emitConfig();
  };

}
