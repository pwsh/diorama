import { LitElement, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from './define.js';
import { startZoneEdit } from '../canvas-interact.js';
import { repairFloor } from '../storage.js';
import type { Planner, Tool } from '../planner.js';
import { NEW_ROOM, NEW_LANDMARK } from '../planner.js';
import { compass8, parseLatLon } from '../geo.js';
import type {
  Sensor, Zone, ObjectHalo, BgImage, MotionSensor, EnvSensor, EnvKind, Light, SwitchFixture, LightIconKind,
  Furniture, FurnitureKind, Door, Window as WindowType, WindowKind, Layers2D, Floor, Room,
  ObjectRecipe, RecipePrimitive, RecipeShape, ActivityKind, AvatarKind,
  BleProxy, DioramaPerson, GeoLandmark,
} from '../types.js';
import type { BermudaDevice } from '../planner.js';
import { CONDITION_GLYPH, CONDITION_LABEL, tempText } from '../weather.js';

// Avatar model options (shared by the mmWave + motion checkbox grids). All 22
// concrete kinds; the old 'Random' entry is gone — checking MULTIPLE kinds is
// the new way to randomize (each target stably hash-picks from the checked set).
const AVATAR_OPTIONS: ReadonlyArray<[AvatarKind, string]> = [
  ['adult', 'Adult'], ['child', 'Child'], ['robot', 'Robot'], ['alien', 'Alien'],
  ['professional', 'Professional'], ['hacker', 'Hacker'], ['movie_star', 'Movie star'],
  ['ninja', 'Ninja'], ['cyborg', 'Cyborg'], ['ninja_cyborg', 'Ninja cyborg'],
  ['athlete', 'Athlete'], ['teddy_bear', 'Teddy bear'], ['cartoon_mouse', 'Cartoon mouse'],
  ['cartoon_dog', 'Cartoon dog'], ['cartoon_duck', 'Cartoon duck'], ['cowboy', 'Cowboy'],
  ['magician', 'Magician'], ['farmer', 'Farmer'], ['tech_expert', 'Tech expert'],
  ['supermodel', 'Supermodel'], ['wise_oracle', 'Wise oracle'], ['astronaut', 'Astronaut'],
  ['cat', '🐱 Cat'], ['dog', '🐶 Dog'],
];
import {
  fmtLen,
  motionColor, motionIntensity, sensorColor, lightIconKind, MOTION_DEFAULTS,
  BLE_PROXY_DEFAULTS, bleProxyHeight,
  FURNITURE_KINDS, furnitureKind, resolveFurnitureDef, WINDOW_DEFAULTS,
  ENV_KINDS, ENV_DEFAULTS, ENV_SCALE_MIN, ENV_SCALE_MAX,
  envKindOf, envColor, envValueText, envHeight, envScale,
  furnitureCat, type FurnitureCat,
  closedWallLoops, loopContaining, resolveRoomForPointFuzzy, roomLabel,
} from '../geometry.js';
import type { Vec2 } from '../types.js';

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
  { id: 'bleproxy', label: 'BLE' },
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
      people: p.activePersonId ?? null,
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
        ${this._bleProxiesSection()}
        ${this._peopleSection()}
        ${this._doorsSection()}
        ${this._windowsSection()}
        ${this._furnitureSection()}
        ${this._customObjectsSection()}
        ${this._roomsSection()}
        ${this._fixturesSection()}
        ${this._layers2dSection()}
        ${this._scene3dSection()}
        ${this._weatherSection()}
        ${this._geoSection()}
        ${this._model3dSection()}
        ${this._bgSection()}

        ${this._section('data', 'Data', () => html`
          <button class="btn" style="width:100%;margin-bottom:4px" @click=${this._exportJson}>
            Export JSON
          </button>
          <button class="btn" style="width:100%" @click=${this._importJson}>Import JSON</button>
        `)}
      </div>
    `;
  }

  // ── Floors section ────────────────────────────────────────────────────
  private _floorsSection() {
    const p = this.planner;
    return this._section('floors', 'Floors', () => html`
        <div class="row" style="margin-bottom:6px">
          <select title="Current floor" style="flex:1;min-width:0"
                  .value=${p.store.currentFloorId}
                  @change=${(e: Event) => p.switchFloor((e.target as HTMLSelectElement).value)}>
            ${p.store.floors.map(f => html`
              <option value=${f.id}>
                ${f.name} — ${fmtLen(f.w, p.store.imperial)} × ${fmtLen(f.d, p.store.imperial)}
              </option>
            `)}
          </select>
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
    if (confirm('Export a backup before deleting?')) this._exportJson();
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
      case 'bleproxy': return 'Click to drop a BLE scanner (Bluetooth proxy) puck. Bind it to the physical proxy device.';
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
          <div class="nm">${s.label || 'Sensor'}</div>
          <div class="badge ${bound ? 'bound' : ''}">${bound ? 'HA' : '—'}</div>
        </div>
        ${sel ? html`${this._activeSensorSection()}${this._haSections()}` : nothing}
      </div>
    `;
  }

  // Shared lock toggle row. Locked items can't be moved / rotated / resized /
  // deleted on the canvas — sidebar editing (including unlock) stays available.
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
    return html`
      <div class="row" title="3D character models for this sensor's targets. Check several — each person stably picks one. None checked = Adult.">
        <label>Avatars</label>
        <span style="flex:1;text-align:right;font-size:10px">
          <button class="btn" style="font-size:10px;padding:1px 6px"
                  @click=${() => write(new Set(AVATAR_OPTIONS.map(([v]) => v)))}>All</button>
          <button class="btn" style="font-size:10px;padding:1px 6px;margin-left:4px"
                  @click=${() => write(new Set())}>None</button>
        </span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1px 6px;
                  background:rgba(0,0,0,0.2);border-radius:4px;padding:4px 6px;margin:2px 0 4px">
        ${AVATAR_OPTIONS.map(([val, lbl]) => html`
          <label style="display:flex;align-items:center;gap:4px;font-size:10px;
                        color:var(--text);cursor:pointer;white-space:nowrap;overflow:hidden">
            <input type="checkbox" style="margin:0;flex:none"
                   .checked=${checked.has(val)}
                   @change=${() => toggle(val)}>
            ${lbl}
          </label>
        `)}
      </div>
    `;
  }

  // Furniture kind options grouped by category. `selected` is either a
  // FurnitureKind or `custom:<recipeId>` for a custom object.
  private _kindOptions(selected: string) {
    const cats: { cat: FurnitureCat; label: string }[] = [
      { cat: 'furniture', label: 'Furniture' },
      { cat: 'appliance', label: 'Appliances' },
      { cat: 'bathroom', label: 'Bathroom' },
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
          <div class="nm">${m.label || 'Motion'}</div>
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
        ${m.avatar ? this._avatarGrid(m, upd) : nothing}
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
          <div class="nm">${en.label || 'Env'}</div>
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
          <div class="nm">${b.name || 'Proxy'}</div>
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
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item ${sel ? 'sel' : ''}" @click=${() => p.setActivePerson(pe.id)}>
          <div class="dot" style="background:${color}"></div>
          <div class="nm">${pe.name || 'Person'}${pe.isPet ? ' 🐾' : ''}</div>
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
    const pin = this.planner.gpsPins.find(g => g.personId === pe.id);
    if (!pin) {
      return html`<div style="font-size:10px;color:var(--text-dim);padding:0 0 3px 20px">
        GPS: no current fix</div>`;
    }
    const where = pin.zone === 'indoor'
      ? `indoors ~±${Math.round(pin.accuracyMm / 1000)} m`
      : `${Math.round(pin.distanceM)} m ${compass8(pin.bearingDeg)}`;
    const stale = pin.stale ? ` · ${gpsAgeText(pin.lastUpdated)}` : '';
    return html`<div style="font-size:10px;color:${pin.stale ? 'var(--text-dim)' : '#4dd0e1'};padding:0 0 3px 20px">
      ${gpsZoneGlyph(pin.zone)} ${where}${stale}</div>`;
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
            ${AVATAR_OPTIONS.map(([val, lbl]) => html`
              <option value=${val} ?selected=${pe.avatarKind === val}>${lbl}</option>`)}
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
          return html`
            <div class="sensor-item" style="cursor:default;gap:4px">
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

  private _doorsSection() {
    const p = this.planner;
    const f = p.floor();
    if (f.doors.length === 0) return nothing;
    return this._section('doors', 'Doors', () =>
      this._groupedList('doors', f.doors, d => this._doorItem(d, f.doors.indexOf(d))));
  }

  private _doorItem(d: Door, idx: number) {
    const p = this.planner;
    const exp = this._doorExpanded.has(d.id);
    const states = p.hass?.states;
    const st = d.entity_id && states ? states[d.entity_id] : null;
    const isOpen = st?.state === 'on';
    const unavail = st && (st.state === 'unavailable' || st.state === 'unknown');
    const bound = !!d.entity_id;
    const badge = !bound ? '—' : unavail ? 'n/a' : isOpen ? 'OPEN' : 'closed';
    const badgeClass = bound && !unavail && isOpen ? 'bound' : '';
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item" style="cursor:default">
          <div class="dot" style="background:${isOpen ? '#66bb6a' : '#90a4ae'}"></div>
          <div class="nm">${d.label?.trim() || 'Door'}</div>
          ${bound ? html`
            <button class="badge ${badgeClass}" style="cursor:pointer;border:none;font-family:inherit"
                    ?disabled=${unavail || !p.hass}
                    title=${isOpen ? 'Click to toggle (close)' : 'Click to toggle (open)'}
                    @click=${() => p.toggleEntity(d.entity_id)}>
              ${badge}
            </button>
          ` : html`<span class="badge">${badge}</span>`}
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
        domain: 'binary_sensor',
        onPick: (id: string) => {
          d.entity_id = id;
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
        </div>
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
        <div style="font-size:10px;color:var(--text-dim);margin-top:6px;line-height:1.3">
          Hinge at (X,Y). Panel extends along rotation (15° snap). Bind to a
          binary_sensor (state "on" = open).
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
    const badge = !bound ? '—' : unavail ? 'n/a' : isOpen ? 'OPEN' : 'closed';
    const badgeClass = bound && !unavail && isOpen ? 'bound' : '';
    return html`
      <div style="border-bottom:1px solid var(--border)">
        <div class="sensor-item" style="cursor:default">
          <div class="dot" style="background:${isOpen ? '#66bb6a' : '#64b5f6'}"></div>
          <div class="nm">${w.label?.trim() || 'Window'}</div>
          ${bound ? html`
            <button class="badge ${badgeClass}" style="cursor:pointer;border:none;font-family:inherit"
                    ?disabled=${unavail || !p.hass}
                    title=${isOpen ? 'Click to toggle' : 'Click to toggle'}
                    @click=${() => p.toggleEntity(w.entity_id)}>
              ${badge}
            </button>
          ` : html`<span class="badge">${badge}</span>`}
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
        <div style="font-size:10px;color:var(--text-dim);margin-top:6px;line-height:1.3">
          Pane center at (X, Y). Rotation is wall axis (15° snap). Bind to a
          binary_sensor (state "on" = open).
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

  // Entity binding for activity-anchoring pieces (appliances) + the TV. Mirrors
  // the env-sensor bind row. TV binds a media_player; everything else a switch
  // (the picker still lets the user change domains).
  private _furnitureBindRow(piece: Furniture, upd: (mut: () => void) => void) {
    const p = this.planner;
    const def = resolveFurnitureDef(piece, p.store.customObjects);
    if (!def.activity && furnitureKind(piece) !== 'tv') return nothing;
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

  private _pickFurnitureEntity(piece: Furniture): void {
    const domain = furnitureKind(piece) === 'tv' ? 'media_player' : 'switch';
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
          ` : html`<span class="badge">${badge}</span>`}
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
          ${['fireplace', 'strip', 'sconce', 'string', 'under_cabinet', 'wall_sconce', 'step'].includes(curKind) ? html`
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
          ${numRow('Height (mm)', l.height ?? (curKind === 'under_cabinet' ? 1350 : curKind === 'wall_sconce' ? 1700 : curKind === 'step' ? 300 : 2500), -3000, 6000, 50, v => upd(() => { l.height = v; }))}
          ${numRow('Radius (mm)', l.radius ?? 900, 100, 5000, 50, v => upd(() => { l.radius = v; }))}
          ${numRow('Intensity', l.intensity ?? 1, 0, 2, 0.05, v => upd(() => { l.intensity = v; }))}
          <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.3">
            Type sets the 3D body shape (and forces fireplace warm + flicker).
            Height = ceiling distance. Radius = pool of light on floor.
          </div>
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
    const isOn = (k: keyof Layers2D) => k === 'activity' ? L.activity === true : L[k] !== false;
    const setLayers = (nl: Layers2D | undefined) => {
      p.store.layers2d = nl; p.save(); p.emitConfig();
    };
    const presets = p.store.layerPresets2d ?? [];
    const defs: { key: keyof Layers2D; label: string }[] = [
      { key: 'bg', label: 'Background image' },
      { key: 'walls', label: 'Walls' },
      { key: 'labels', label: 'Room labels' },
      { key: 'furniture', label: 'Furniture' },
      { key: 'lights', label: 'Light / switch markers' },
      { key: 'sensors', label: 'mmWave sensors' },
      { key: 'motion', label: 'Motion sensors' },
      { key: 'env', label: 'Env sensors' },
      { key: 'zones', label: 'Zones & halos' },
      { key: 'targets', label: 'Targets' },
      { key: 'geo', label: 'Geo landmarks' },
      { key: 'weatherFx', label: 'Weather effects (3D)' },
      { key: 'nameLabels', label: 'Name labels' },
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
                      bg: false, furniture: false, lights: false, sensors: false,
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

  // ── 3D scene appearance ───────────────────────────────────────────────
  // ── Weather section (Feature W) ───────────────────────────────────────
  private _weatherSection() {
    const p = this.planner;
    const w = p.store.weather;
    const src = w?.source ?? 'openmeteo';
    const now = p.weatherNow;
    const set = (mut: (x: import('../types.js').WeatherConfig) => void) => p.setWeather(mut);

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

    // Live preview / source-health line.
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

    return this._section('weather', 'Weather', () => html`
        <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:6px">
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
        <label class="row"><span style="flex:1">Affect lighting</span>
          <input type="checkbox" .checked=${w?.affectLighting !== false}
                 @change=${(e: Event) => set(x => { x.affectLighting = (e.target as HTMLInputElement).checked; })}>
        </label>
        <div style="font-size:10px;color:var(--text-dim);line-height:1.3;margin:2px 0 6px">
          (3D effects arrive in the next phase)
        </div>

        <div style="font-size:11px;padding:6px 8px;background:rgba(0,0,0,0.25);border-radius:4px;line-height:1.4">
          ${preview}
        </div>
    `, { id: 'diorama-weather-section' });
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
    if (!pins.length) return nothing;
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

  private _scene3dSection() {
    const p = this.planner;
    const sc = p.store.scene3d ?? { preset: 'night' as const };
    const upd = (mut: () => void) => {
      if (!p.store.scene3d) p.store.scene3d = { preset: 'night' };
      mut(); p.save(); p.emitConfig();
    };
    return this._section('scene3d', '3D Scene', () => html`
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
                      p.store.scene3d!.preset =
                        (e.target as HTMLSelectElement).value as import('../types.js').ScenePreset;
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
                detail: {
                  domain: 'sensor',
                  onPick: (id: string) => upd(() => { p.store.scene3d!.luxEntity = id; }),
                },
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
                 @input=${(e: Event) => upd(() => {
                   p.store.scene3d!.floorColor = (e.target as HTMLInputElement).value;
                 })}>
        </div>
        <div class="row"><label>Floor texture</label>
          <select .value=${sc.floorTex ?? 'none'}
                  @change=${(e: Event) => upd(() => {
                    p.store.scene3d!.floorTex =
                      (e.target as HTMLSelectElement).value as import('../types.js').FloorTexKind;
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
                 @input=${(e: Event) => upd(() => {
                   p.store.scene3d!.wallColor = (e.target as HTMLInputElement).value;
                 })}>
        </div>
        <div class="row"><label>Glass house</label>
          <input type="checkbox" .checked=${!!sc.glassHouse}
                 @change=${(e: Event) => upd(() => {
                   p.store.scene3d!.glassHouse = (e.target as HTMLInputElement).checked;
                 })}>
        </div>
        <div class="row"><label>Wall cutaway</label>
          <input type="checkbox" .checked=${sc.wallCutaway !== false}
                 @change=${(e: Event) => upd(() => {
                   p.store.scene3d!.wallCutaway = (e.target as HTMLInputElement).checked;
                 })}>
        </div>
        <div class="row"><label>Auto-follow camera</label>
          <input type="checkbox" .checked=${!!sc.autoFollow}
                 @change=${(e: Event) => upd(() => {
                   p.store.scene3d!.autoFollow = (e.target as HTMLInputElement).checked;
                 })}>
        </div>
        <div class="row"><label>Plumbobs</label>
          <input type="checkbox" .checked=${sc.plumbobs !== false}
                 @change=${(e: Event) => upd(() => {
                   p.store.scene3d!.plumbobs = (e.target as HTMLInputElement).checked;
                 })}>
        </div>
        ${this._floorLookOverrides(sc)}
    `);
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
      <div style="font-size:10px;color:var(--text-dim);margin:8px 0 2px;border-top:1px solid var(--border);padding-top:6px">
        This floor only (overrides global)
      </div>
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
    return this._section('bg', 'Background image', () => html`
        <button class="btn" style="width:100%;margin-bottom:4px" @click=${this._uploadBg}>
          Upload image…
        </button>
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
    const img = new Image();
    img.onload = () => {
      const p = this.planner;
      const f = p.floor();
      const natW = img.naturalWidth || 1, natH = img.naturalHeight || 1;
      const ratio = natW / natH;
      let bw, bh;
      if (ratio > f.w / f.d) { bw = f.w; bh = f.w / ratio; }
      else                   { bh = f.d; bw = f.d * ratio; }
      f.bg = {
        dataUrl, x: f.w / 2, y: f.d / 2, w: bw, h: bh,
        rotation: 0, opacity: 1, visible: true, locked: false,
      };
      p.save(); p.emitConfig();
    };
    img.onerror = () => alert('Failed to load image.');
    img.src = dataUrl;
  }

  private _clearBg = () => {
    if (!confirm('Remove background image from this floor?')) return;
    this.planner.floor().bg = null;
    this.planner.save();
    this.planner.emitConfig();
  };

  // ── Export / import ───────────────────────────────────────────────────
  private _exportJson = () => {
    const blob = new Blob([JSON.stringify(this.planner.store, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `floor-plan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  private _importJson = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json';
    inp.onchange = () => {
      const file = inp.files?.[0]; if (!file) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const obj = JSON.parse(rd.result as string);
          if (!obj.floors || !Array.isArray(obj.floors)) throw new Error('missing floors');
          if (!confirm('Replace current floor plan with imported data?')) return;
          obj.floors = obj.floors.map((f: { id: string; name: string; w: number; d: number }) => repairFloor(f));
          this.planner.store = obj;
          this.planner.store.activeSensorId = null;
          this.planner.save();
          this.planner.emitConfig();
        } catch (err) {
          alert('Import failed: ' + (err as Error).message);
        }
      };
      rd.readAsText(file);
    };
    inp.click();
  };
}
