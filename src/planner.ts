import { HassClient, type HaApi } from './ha-client.js';
import { SensorDiscovery } from './sensor-discovery.js';
import { loadStore, saveStore, newId, repairFloor } from './storage.js';
import { slugToName } from './geometry.js';
import type {
  Store, Floor, Sensor, ZonesLive, ObjectHalo, LerpSlot,
  HassState, ConnStatus, DiscoveredDevice, Vec2,
} from './types.js';

// Drag state covers every interaction kind. Only active during a mousedown→up.
export type Drag =
  | { kind: 'sensor'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'rotate'; sensorId: string }
  | { kind: 'wallv'; wallId: string; idx: number; startMm: Vec2; startPts: Vec2[] }
  | { kind: 'wallMove'; wallId: string; startMm: Vec2; startPts: Vec2[] }
  | { kind: 'furnMove'; idx: number; startMm: Vec2; start: Vec2 }
  | { kind: 'furnCorner'; idx: number; anchor: Vec2 }
  | { kind: 'fixture'; fxKind: 'light' | 'switch'; idx: number; startMm: Vec2; start: Vec2 }
  | { kind: 'obj'; oi: number; startMm: Vec2; startObj: Vec2 }
  | { kind: 'objR'; oi: number; startMm: Vec2; startR: number }
  | { kind: 'vert'; prefix: 'iz' | 'fz'; zi: number; vi: number; startMm: Vec2; startVerts: Vec2[] }
  | { kind: 'zonemove'; prefix: 'iz' | 'fz'; zi: number; startMm: Vec2; startVerts: Vec2[] }
  | { kind: 'bgMove'; startMm: Vec2; start: Vec2 }
  | { kind: 'bgCorner'; sx: number; sy: number; startBg: { x: number; y: number; w: number; h: number; rotation: number } }
  | { kind: 'motion'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'motionRotate'; id: string }
  | { kind: 'env'; id: string; startMm: Vec2; start: Vec2 }
  | { kind: 'envResize'; id: string; startDist: number; startScale: number }
  | { kind: 'doorMove'; idx: number; startMm: Vec2; start: Vec2 }
  | { kind: 'doorRotate'; idx: number; startMm: Vec2; start: { rotation: number } }
  | { kind: 'windowMove'; idx: number; startMm: Vec2; start: Vec2 }
  | { kind: 'windowRotate'; idx: number; startMm: Vec2; start: { rotation: number } };

export interface EditZone {
  sensorId: string;
  prefix: 'iz' | 'fz';
  zi: number;
  verts: Vec2[];        // sensor-local mm
  mousePos: Vec2 | null;
}

export type Tool = 'select' | 'wall' | 'sensor' | 'motion' | 'env' | 'furniture' | 'light' | 'switch' | 'door' | 'window' | 'delete';

// Single-source-of-truth Planner. Lit components subscribe via addEventListener.
export class Planner extends EventTarget {
  store: Store;
  hass: HaApi | null = null;
  disc = new SensorDiscovery();

  // Per-bound-sensor live state, keyed by sensor.id
  discBy: Record<string, DiscoveredDevice> = {};
  zonesBy: Record<string, ZonesLive> = {};
  objectsBy: Record<string, ObjectHalo[]> = {};
  lerpBy: Record<string, LerpSlot[]> = {};
  objWritePending: Record<string, boolean[]> = {};
  objWriteTimer: Record<string, (ReturnType<typeof setTimeout> | null)[]> = {};
  izExpanded: Record<string, Set<number>> = {};
  fzExpanded: Record<string, Set<number>> = {};
  editObject: Record<string, number> = {};
  drawingWall: { points: Vec2[]; id?: string } | null = null;

  // Interaction state
  view: '2d' | '3d' = '2d';
  tool: Tool = 'select';
  cursor: Vec2 | null = null;
  drag: Drag | null = null;
  dragJustEnded = false;
  editZone: EditZone | null = null;

  conn: ConnStatus | 'connecting' = 'connecting';
  showDetails: boolean;
  useRawTargets: boolean;
  lastDevices: string[] = [];

  // Active motion sensor (for selection / rotate-handle visibility on canvas)
  activeMotionId: string | null = null;

  // Active environmental sensor (sidebar selection / canvas highlight)
  activeEnvId: string | null = null;

  // Active furniture piece (last grabbed/dropped) — drives the 2D front-arrow
  // chevron. Runtime only.
  activeFurnitureId: string | null = null;

  // UI mode. Runtime + URL-driven, never persisted.
  //   edit  — full editor (default)
  //   kiosk — views + device interaction only; nothing editable, nothing saved
  //   view  — pure visualization; no device interaction either
  uiMode: 'edit' | 'kiosk' | 'view' = 'edit';
  // ?lock=1 hides the mode switcher (wall tablets).
  uiModeLocked = false;
  // Parsed ?floor/?layers/?view3d/?cam template args (applied by app/three-view
  // with fallback to defaults when the named things no longer exist).
  urlTemplate: { floor?: string; layers?: string; view3d?: string; cam?: number[] } = {};
  // Live 3D camera pose (scene coords), updated by three-view each tick so
  // the topbar can mint kiosk links that reproduce the current view.
  lastCam3d: { pos: [number, number, number]; target: [number, number, number] } | null = null;

  setUiMode(m: 'edit' | 'kiosk' | 'view'): void {
    this.uiMode = m;
    if (m !== 'edit') {
      // Leave no edit affordances dangling.
      this.drag = null; this.editZone = null; this.drawingWall = null;
      this.tool = 'select';
    }
    this.emitConfig();
  }

  // Which furniture kind the next drop should create. Runtime only.
  pendingFurnitureKind: import('./types.js').FurnitureKind = 'block';

  // When set, the next furniture drop creates an instance of this custom
  // object recipe (kind stays 'block' as the fallback). Runtime only.
  pendingCustomObjectId: string | null = null;

  // Which wall kind the next drawn wall gets. Runtime only.
  pendingWallKind: import('./types.js').WallKind = 'full';

  // Sidebar visibility. Persisted locally (not in HA store — it's a
  // per-device preference). Defaults open on wide screens, closed on phones.
  sidebarOpen: boolean = (() => {
    try {
      const saved = localStorage.getItem('diorama:sidebarOpen');
      if (saved !== null) return saved === '1';
    } catch { /* ignore */ }
    return typeof window === 'undefined' || window.innerWidth > 900;
  })();

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    try { localStorage.setItem('diorama:sidebarOpen', this.sidebarOpen ? '1' : '0'); } catch { /* ignore */ }
    this.emitConfig();
  }

  // 2D view pan/zoom — runtime only, reset on reload.
  // viewCenter is the world-mm point shown at canvas center; zoom is the
  // multiplier on top of fit-to-canvas scale.
  viewCenter: { x: number; y: number } | null = null; // null = auto-fit center
  zoom = 1;

  private _lastDevKey: string | null = null;
  private _initialSyncDone = false;
  private _retrySyncTimers: ReturnType<typeof setTimeout>[] = [];
  // HA-side JSON storage state (frontend/user_data).
  private static readonly HA_STORE_KEY = 'diorama';
  private _haStoreLoaded = false;
  private _haSaveTimer: ReturnType<typeof setTimeout> | null = null;
  // Suppress save-back to HA when we're applying a freshly-loaded HA payload.
  private _suppressHaSave = false;

  constructor() {
    super();
    this.store = loadStore();
    this.showDetails = this.store.showDetails === true;
    this.useRawTargets = this.store.useRawTargets === true;
  }

  // ── Persistence ─────────────────────────────────────────────────────────
  floor(): Floor {
    return this.store.floors.find(f => f.id === this.store.currentFloorId) || this.store.floors[0];
  }
  activeSensor(): Sensor | null {
    if (!this.store.activeSensorId) return null;
    return this.floor().sensors.find(s => s.id === this.store.activeSensorId) || null;
  }
  save(): void {
    // Kiosk / view-only modes never persist anything — a wall tablet must
    // not write its runtime view tweaks (or anything else) back to HA or
    // even its own localStorage cache.
    if (this.uiMode !== 'edit') return;
    // Local cache is always written immediately so it survives reload.
    saveStore(this.store);
    // HA is the source of truth: debounce a push so rapid edits (drag, slider)
    // don't hammer the WS. Skip while applying an HA payload to avoid a save
    // loop right after fetching.
    if (this._suppressHaSave) return;
    if (this._haSaveTimer) clearTimeout(this._haSaveTimer);
    this._haSaveTimer = setTimeout(() => {
      this._haSaveTimer = null;
      if (!this.hass) return;
      this.hass.setUserData(Planner.HA_STORE_KEY, this.store).catch(err => {
        console.warn('HA storage save failed (kept local cache):', err);
      });
    }, 600);
  }

  // ── Eventing ────────────────────────────────────────────────────────────
  // 'live' = ~10 Hz HA updates + lerp; canvas listens
  // 'config' = structural / slow entity changes; sidebar listens
  // Monotonic config revision. Cheap dirty-key source for renderers that
  // want to rebuild only when structural state changed (3D scene graph).
  configRev = 0;

  emitLive(): void { this.dispatchEvent(new CustomEvent('live')); }
  emitConfig(): void { this.configRev++; this.dispatchEvent(new CustomEvent('config')); }
  emitConn(): void { this.dispatchEvent(new CustomEvent('conn')); }

  // ── HA connection ───────────────────────────────────────────────────────
  // Standalone (iframe) mode: own WS + long-lived token.
  connect(url: string, token: string): void {
    this.connectWith(new HassClient(url, token));
  }

  // Shared wiring for both modes. Native panel mode passes a
  // HassPanelAdapter riding HA frontend's authenticated connection.
  connectWith(api: HaApi): void {
    this.hass = api;
    this.hass.onConn(s => { this.conn = s; this.emitConn(); });
    this.hass.onState((states, changedId) => this._onStates(states, changedId));
    this.hass.connect();
    // Auto-poll when the tab regains focus. WS state_changed events can be
    // missed while the page is backgrounded (browsers throttle WS on hidden
    // tabs); a fresh get_states resyncs everything cheaply.
    if (typeof document !== 'undefined' && !this._visListenerBound) {
      this._visListenerBound = true;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.hass) {
          this.hass.refreshStates().catch(err =>
            console.warn('visibility refreshStates failed:', err));
        }
      });
    }
  }

  // Manual full state re-poll (also wired to a topbar button).
  async refreshStates(): Promise<void> {
    if (!this.hass) return;
    // Drop discovery cache: bound sensors may have new entity slugs (e.g.
    // filter zones renamed `fz1`/`fz2`/`fz3`) that an older cached
    // DiscoveredDevice doesn't reflect. Re-running discovery is cheap.
    this.disc.invalidate();
    // Force per-sensor discovery to re-run on the next _onStates so cached
    // discBy entries refresh too.
    for (const sid of Object.keys(this.discBy)) delete this.discBy[sid];
    await this.hass.refreshStates();
    this.emitConfig();
  }

  private _visListenerBound = false;

  private _onStates(states: Record<string, HassState>, changedId?: string): void {
    if (changedId === undefined) {
      const devices = this.disc.listDevices(states);
      const devKey = devices.join('\x00');
      if (devKey !== this._lastDevKey) {
        this._lastDevKey = devKey;
        this.lastDevices = devices;
        this.emitConfig();
      }
    }

    const f = this.floor();
    for (const s of f.sensors) {
      if (!s.deviceSlug) continue;
      if (!this.discBy[s.id]) this.discBy[s.id] = this.disc.discoverForDevice(states, s.deviceSlug);
      this.ensureLiveState(s.id);
    }
    this._syncOccupancy(states);
    this.emitLive();

    const slow = changedId === undefined || this._isSlowEntity(changedId);
    if (!slow) return;
    if (this.drag || this.editZone) return;

    this._runFullSync(states);

    // After the first state load, schedule a couple of follow-up syncs.
    // ESPHome can trickle entities in after `get_states` returned, so the
    // initial discovery may be incomplete. Retries cover that window without
    // requiring the user to click on the sensor to force it.
    if (!this._initialSyncDone && changedId === undefined) {
      this._initialSyncDone = true;
      for (const ms of [500, 2000, 5000]) {
        this._retrySyncTimers.push(setTimeout(() => {
          if (!this.hass) return;
          this.disc.invalidate();
          this._runFullSync(this.hass.states);
        }, ms));
      }
      // Load diorama from HA (source of truth). Localstorage is a cache.
      void this._loadFromHa();
    }
  }

  // Pull the persisted store from HA's frontend/user_data. If HA has data,
  // replace local store with it. If HA is empty, push the local cache up so
  // future devices/browsers see it. Falls back silently to the localStorage
  // copy already loaded in the constructor on any failure.
  private async _loadFromHa(): Promise<void> {
    if (!this.hass || this._haStoreLoaded) return;
    this._haStoreLoaded = true;
    try {
      const remote = await this.hass.getUserData<Store>(Planner.HA_STORE_KEY);
      if (remote && Array.isArray(remote.floors) && remote.floors.length > 0) {
        // Apply remote store. Repair each floor + default top-level fields so
        // older payloads (or partial schemas) load cleanly.
        this._suppressHaSave = true;
        try {
          const floors = remote.floors.map(f => repairFloor(f));
          this.store = {
            v: 2,
            floors,
            currentFloorId: remote.currentFloorId && floors.some(f => f.id === remote.currentFloorId)
              ? remote.currentFloorId : floors[0].id,
            activeSensorId: null,
            coverage:      remote.coverage      ?? true,
            imperial:      remote.imperial      ?? false,
            showDetails:   remote.showDetails   ?? false,
            useRawTargets: remote.useRawTargets ?? false,
            showMotionZones: remote.showMotionZones ?? true,
            // Pass-through settings objects. scene3d was silently DROPPED
            // here for a while (3D appearance reset on every load) — keep
            // every new top-level Store field in this list.
            scene3d:        remote.scene3d        ?? undefined,
            views3d:        remote.views3d        ?? undefined,
            layers2d:       remote.layers2d       ?? undefined,
            layerPresets2d: remote.layerPresets2d ?? undefined,
            customObjects:  remote.customObjects  ?? undefined,
          };
          // Reset transient view state to match the loaded store.
          this.activeMotionId = null;
          this.viewCenter = null;
          this.zoom = 1;
          this.drag = null;
          this.editZone = null;
          this.drawingWall = null;
          this.showDetails = this.store.showDetails === true;
          this.useRawTargets = this.store.useRawTargets === true;
          // Mirror to localStorage as the local cache.
          saveStore(this.store);
        } finally {
          this._suppressHaSave = false;
        }
        this.emitConfig();
      } else {
        // HA is empty — promote the local cache to be the source of truth.
        await this.hass.setUserData(Planner.HA_STORE_KEY, this.store);
      }
    } catch (err) {
      console.warn('HA storage load failed (using local cache):', err);
    }
  }

  private _runFullSync(states: Record<string, HassState>): void {
    if (this.drag || this.editZone) return;
    const f = this.floor();
    for (const s of f.sensors) {
      if (!s.deviceSlug) continue;
      this.discBy[s.id] = this.disc.discoverForDevice(states, s.deviceSlug);
      this.ensureLiveState(s.id);
      this._syncZonesObjects(s, states);
    }
    this.emitConfig();
  }

  // Slow vs live classification: number/switch are config, everything else is
  // ~10 Hz live data.
  private _isSlowEntity(id: string): boolean {
    if (!id) return false;
    if (id.startsWith('number.') || id.startsWith('switch.')) return true;
    // Bound environmental sensor entities route through the config channel so
    // the sidebar's live readings re-render. Only entities actually bound on
    // the current floor qualify — a blanket sensor.* rule would emit config
    // for every sensor state change in HA.
    return this.floor().envSensors.some(e => e.entity_id === id);
  }

  // Cheap occupancy refresh — runs on every state event so live data stays current.
  private _syncOccupancy(states: Record<string, HassState>): void {
    const f = this.floor();
    for (const s of f.sensors) {
      if (!s.deviceSlug) continue;
      const d = this.discBy[s.id]; const z = this.zonesBy[s.id]; const o = this.objectsBy[s.id];
      if (!d) continue;
      if (z) {
        for (let i = 0; i < d.inclusionZoneSlugs.length && i < 3; i++) {
          const tcId = d.zoneTargetCount[i];
          const tc = tcId ? parseInt(states[tcId]?.state ?? '') : NaN;
          z.inclusion[i].occupied = !isNaN(tc) && tc > 0;
          z.inclusion[i].targetCount = !isNaN(tc) ? tc : 0;
        }
      }
      if (o) {
        for (let i = 0; i < d.objectSlugs.length && i < 3; i++) {
          const oc = d.haloOccupied[i] ? states[d.haloOccupied[i]!] : null;
          o[i].occupied = oc?.state === 'on';
        }
      }
    }
  }

  ensureLiveState(sensorId: string): void {
    if (!this.zonesBy[sensorId]) {
      this.zonesBy[sensorId] = {
        inclusion: [
          { name: 'Zone A', vertices: [], enabled: false, occupied: false },
          { name: 'Zone B', vertices: [], enabled: false, occupied: false },
          { name: 'Zone C', vertices: [], enabled: false, occupied: false },
        ],
        filter: [
          { name: 'Filter 1', vertices: [], enabled: false, occupied: false },
          { name: 'Filter 2', vertices: [], enabled: false, occupied: false },
          { name: 'Filter 3', vertices: [], enabled: false, occupied: false },
        ],
      };
      // Restore last-known-good polygons from the persisted cache so a fresh
      // page load shows zones immediately, before HA's first state push
      // arrives — and so a partial / zeroed firmware push during reconnect
      // doesn't visually wipe them.
      const sensor = this.floor().sensors.find(s => s.id === sensorId);
      const cache = sensor?.zoneCache;
      if (cache) {
        for (let i = 0; i < this.zonesBy[sensorId].inclusion.length; i++) {
          const cached = cache.inclusion?.[i];
          if (cached && cached.length >= 3) {
            this.zonesBy[sensorId].inclusion[i].vertices = cached.map(v => ({ x: v.x, y: v.y }));
          }
        }
        for (let i = 0; i < this.zonesBy[sensorId].filter.length; i++) {
          const cached = cache.filter?.[i];
          if (cached && cached.length >= 3) {
            this.zonesBy[sensorId].filter[i].vertices = cached.map(v => ({ x: v.x, y: v.y }));
          }
        }
      }
    }
    if (!this.objectsBy[sensorId]) this.objectsBy[sensorId] = [
      { name: 'Object A', x: 0, y: 0, radius: 500, icon: '📍', enabled: false, occupied: false },
      { name: 'Object B', x: 0, y: 0, radius: 500, icon: '📍', enabled: false, occupied: false },
      { name: 'Object C', x: 0, y: 0, radius: 500, icon: '📍', enabled: false, occupied: false },
    ];
    if (!this.lerpBy[sensorId]) this.lerpBy[sensorId] = [
      { cx: 0, cy: 0, tx: 0, ty: 0, vx: 0, vy: 0, active: false },
      { cx: 0, cy: 0, tx: 0, ty: 0, vx: 0, vy: 0, active: false },
      { cx: 0, cy: 0, tx: 0, ty: 0, vx: 0, vy: 0, active: false },
    ];
    if (!this.objWritePending[sensorId]) this.objWritePending[sensorId] = [false, false, false];
    if (!this.objWriteTimer[sensorId])   this.objWriteTimer[sensorId]   = [null, null, null];
    if (!this.izExpanded[sensorId]) this.izExpanded[sensorId] = new Set();
    if (!this.fzExpanded[sensorId]) this.fzExpanded[sensorId] = new Set();
    if (this.editObject[sensorId] === undefined) this.editObject[sensorId] = -1;
  }

  // ── HA sync (slow path) ─────────────────────────────────────────────────
  private _readCoord(entityId: string | null): number | null {
    if (!entityId || !this.hass) return null;
    const s = this.hass.states[entityId];
    if (!s) return null;
    const v = parseFloat(s.state);
    return isNaN(v) ? null : v;
  }

  writeCoord(entityId: string | null, value: number): void {
    if (!entityId || !this.hass) return;
    this.hass.callService('number', 'set_value', { entity_id: entityId, value });
  }

  // Length unit normalization for HA-published distances.
  stateMm(entityId: string | null, nativeToMM: number): number {
    if (!entityId || !this.hass) return NaN;
    const s = this.hass.states[entityId];
    if (!s) return NaN;
    const v = parseFloat(s.state);
    if (isNaN(v)) return NaN;
    const u = String((s.attributes as Record<string, unknown>)?.unit_of_measurement ?? '').toLowerCase().trim();
    switch (u) {
      case 'in': case 'inch': case 'inches': case '"': return v * 25.4;
      case 'ft': case 'feet':                          return v * 304.8;
      case 'yd': case 'yard': case 'yards':            return v * 914.4;
      case 'mm': return v;
      case 'cm': return v * 10;
      case 'm':  return v * 1000;
      case 'km': return v * 1_000_000;
    }
    return v * (nativeToMM || 1);
  }

  zoneEntityId(s: Sensor, prefix: 'iz' | 'fz', zi: number, vi: number, axis: 'x' | 'y'): string | null {
    const d = this.discBy[s.id]; if (!d) return null;
    const slug = (prefix === 'iz' ? d.inclusionZoneSlugs : d.filterZoneSlugs)[zi];
    if (!slug) return null;
    return `number.${s.deviceSlug}_${slug}_v${vi + 1}_${axis}`;
  }

  objEntityId(s: Sensor, oi: number, field: 'x' | 'y' | 'radius'): string | null {
    const d = this.discBy[s.id]; if (!d) return null;
    const slug = d.objectSlugs[oi]; if (!slug) return null;
    const suffix = field === 'radius' ? 'halo_radius' : field;
    return `number.${s.deviceSlug}_${slug}_${suffix}`;
  }

  private _syncZonesObjects(s: Sensor, states: Record<string, HassState>): void {
    const d = this.discBy[s.id]; if (!d) return;
    const dp = s.deviceSlug;
    const slugGroups = [d.inclusionZoneSlugs, d.filterZoneSlugs];
    const zoneArrays = [this.zonesBy[s.id].inclusion, this.zonesBy[s.id].filter];
    const prefixes = ['iz', 'fz'] as const;
    let cacheChanged = false;
    for (let gi = 0; gi < 2; gi++) {
      for (let z = 0; z < slugGroups[gi].length; z++) {
        const slug = slugGroups[gi][z];
        const zone = zoneArrays[gi][z];
        zone.name = slugToName(slug);
        const enId = `switch.${dp}_${slug}_enable`;
        if (states[enId]) zone.enabled = states[enId].state === 'on';
        const verts: Vec2[] = [];
        for (let vi = 0; vi < 8; vi++) {
          const x = this._readCoord(this.zoneEntityId(s, prefixes[gi], z, vi, 'x'));
          const y = this._readCoord(this.zoneEntityId(s, prefixes[gi], z, vi, 'y'));
          if (x === null || y === null) break;
          if (vi > 0 && x === 0 && y === 0) break;
          verts.push({ x, y });
        }
        // Only adopt firmware values when they form a coherent polygon. Keep
        // existing runtime vertices otherwise — protects user-configured
        // shapes from being wiped during partial state pushes / reconnects.
        if (verts.length >= 3) {
          zone.vertices = verts;
          // Persist to the sensor's zoneCache so the next page reload paints
          // the last-known-good polygon immediately instead of waiting for
          // (or losing data to) the firmware re-publish cycle.
          if (!s.zoneCache) s.zoneCache = { inclusion: [], filter: [] };
          const cacheArr = gi === 0 ? s.zoneCache.inclusion : s.zoneCache.filter;
          const prev = cacheArr[z];
          const same = prev && prev.length === verts.length &&
            prev.every((v, i) => v.x === verts[i].x && v.y === verts[i].y);
          if (!same) {
            cacheArr[z] = verts.map(v => ({ x: v.x, y: v.y }));
            cacheChanged = true;
          }
        }
      }
    }
    if (cacheChanged) this.save();
    for (let i = 0; i < d.inclusionZoneSlugs.length && i < 3; i++) {
      const tcId = d.zoneTargetCount[i];
      const tc = tcId ? parseInt(states[tcId]?.state ?? '') : NaN;
      this.zonesBy[s.id].inclusion[i].occupied = !isNaN(tc) && tc > 0;
      this.zonesBy[s.id].inclusion[i].targetCount = !isNaN(tc) ? tc : 0;
    }
    for (let i = 0; i < d.objectSlugs.length && i < 3; i++) {
      const slug = d.objectSlugs[i];
      const obj = this.objectsBy[s.id][i];
      obj.name = slugToName(slug);
      const x = this._readCoord(this.objEntityId(s, i, 'x'));
      const y = this._readCoord(this.objEntityId(s, i, 'y'));
      const rv = this._readCoord(this.objEntityId(s, i, 'radius'));
      const en = states[`switch.${dp}_${slug}_halo_enable`];
      const oc = d.haloOccupied[i] ? states[d.haloOccupied[i]!] : null;
      if (!this.objWritePending[s.id][i]) {
        if (x !== null) obj.x = x;
        if (y !== null) obj.y = y;
      }
      if (rv !== null) obj.radius = rv;
      if (en) obj.enabled = en.state === 'on';
      obj.occupied = oc?.state === 'on';
    }
  }

  // ── HA writes ───────────────────────────────────────────────────────────
  setZoneEnabled(s: Sensor, prefix: 'iz' | 'fz', zi: number, enabled: boolean, enId: string | null): void {
    const arr = prefix === 'iz' ? this.zonesBy[s.id].inclusion : this.zonesBy[s.id].filter;
    arr[zi].enabled = enabled;
    if (this.hass && enId && this.hass.states[enId]) {
      this.hass.callService('switch', enabled ? 'turn_on' : 'turn_off', { entity_id: enId });
    }
    this.emitConfig();
  }

  setObjectEnabled(s: Sensor, oi: number, enabled: boolean, enId: string | null): void {
    this.objectsBy[s.id][oi].enabled = enabled;
    if (this.hass && enId && this.hass.states[enId]) {
      this.hass.callService('switch', enabled ? 'turn_on' : 'turn_off', { entity_id: enId });
    }
    this.emitConfig();
  }

  saveAllZoneVertices(s: Sensor, prefix: 'iz' | 'fz', zi: number, verts: Vec2[]): void {
    const arr = prefix === 'iz' ? this.zonesBy[s.id].inclusion : this.zonesBy[s.id].filter;
    arr[zi].vertices = verts.filter(v => v.x !== 0 || v.y !== 0);
    for (let vi = 0; vi < 8; vi++) {
      const v = verts[vi] || { x: 0, y: 0 };
      this.writeCoord(this.zoneEntityId(s, prefix, zi, vi, 'x'), v.x);
      this.writeCoord(this.zoneEntityId(s, prefix, zi, vi, 'y'), v.y);
    }
    this.emitConfig();
  }

  saveZoneVertex(s: Sensor, prefix: 'iz' | 'fz', zi: number, vi: number, x: number, y: number): void {
    const arr = prefix === 'iz' ? this.zonesBy[s.id].inclusion : this.zonesBy[s.id].filter;
    while (arr[zi].vertices.length <= vi) arr[zi].vertices.push({ x: 0, y: 0 });
    arr[zi].vertices[vi] = { x, y };
    this.writeCoord(this.zoneEntityId(s, prefix, zi, vi, 'x'), x);
    this.writeCoord(this.zoneEntityId(s, prefix, zi, vi, 'y'), y);
  }

  saveObjectField(s: Sensor, oi: number, field: 'x' | 'y' | 'radius', val: number): void {
    this.objectsBy[s.id][oi][field] = val;
    this.writeCoord(this.objEntityId(s, oi, field), val);
  }

  // ── Active sensor / tool ────────────────────────────────────────────────
  // Bind / re-bind a sensor to an HA device, running discovery + sync
  // immediately (and a few retries) so zones and objects load without the
  // user having to wait for the next slow-path state event.
  bindSensor(sensorId: string, deviceSlug: string | null): void {
    const f = this.floor();
    const s = f.sensors.find(x => x.id === sensorId);
    if (!s) return;
    s.deviceSlug = deviceSlug;
    // Wipe stale per-sensor live state from the previous binding so old
    // zones/objects from another device don't bleed across.
    delete this.discBy[sensorId];
    delete this.zonesBy[sensorId];
    delete this.objectsBy[sensorId];
    delete this.lerpBy[sensorId];
    delete this.objWritePending[sensorId];
    delete this.objWriteTimer[sensorId];
    delete this.izExpanded[sensorId];
    delete this.fzExpanded[sensorId];
    delete this.editObject[sensorId];
    this.ensureLiveState(sensorId);
    this.save();

    if (deviceSlug && this.hass) {
      // Force the discovery cache to re-scan in case entities just appeared.
      this.disc.invalidate();
      this._runFullSyncForSensor(s, this.hass.states);
      // Retries cover the case where the device is still publishing entities.
      for (const ms of [500, 2000, 5000]) {
        setTimeout(() => {
          if (!this.hass) return;
          const cur = this.floor().sensors.find(x => x.id === sensorId);
          if (!cur || cur.deviceSlug !== deviceSlug) return;  // user re-bound elsewhere
          this.disc.invalidate();
          this._runFullSyncForSensor(cur, this.hass.states);
        }, ms);
      }
    }
    this.emitConfig();
  }

  private _runFullSyncForSensor(s: Sensor, states: Record<string, HassState>): void {
    if (!s.deviceSlug || this.drag || this.editZone) return;
    this.discBy[s.id] = this.disc.discoverForDevice(states, s.deviceSlug);
    this.ensureLiveState(s.id);
    this._syncZonesObjects(s, states);
    this.emitConfig();
  }

  setActiveSensor(id: string | null): void {
    this.store.activeSensorId = (this.store.activeSensorId === id) ? null : id;
    // Unbound sensors have no discovery-driven init path — make sure the
    // live-state slots exist the moment one becomes active so hit tests and
    // renderers can rely on them.
    if (this.store.activeSensorId) this.ensureLiveState(this.store.activeSensorId);
    this.save();
    if (this.store.activeSensorId) {
      const s = this.activeSensor();
      if (s && s.deviceSlug && this.hass) {
        this.discBy[s.id] = this.disc.discoverForDevice(this.hass.states, s.deviceSlug);
        this.ensureLiveState(s.id);
        this._syncZonesObjects(s, this.hass.states);
      }
    }
    this.emitConfig();
  }

  setTool(t: Tool): void {
    this.tool = t;
    if (t !== 'wall') this.drawingWall = null;
    this.emitConfig();
  }

  setActiveMotion(id: string | null): void {
    this.activeMotionId = (this.activeMotionId === id) ? null : id;
    this.emitConfig();
  }

  setActiveEnv(id: string | null): void {
    this.activeEnvId = (this.activeEnvId === id) ? null : id;
    this.emitConfig();
  }

  // ── View ────────────────────────────────────────────────────────────────
  setView(v: '2d' | '3d'): void { this.view = v; this.emitConfig(); }

  // Toggle whatever entity is bound — chooses the correct domain service
  // based on the entity_id, so a "switch" fixture wired to a light entity
  // calls light.toggle (not switch.toggle, which would 404).
  toggleEntity(entity_id: string | null | undefined): void {
    if (this.uiMode === 'view') return;  // visualization only — no control
    if (!this.hass || !entity_id) return;
    const dot = entity_id.indexOf('.');
    const domain = dot > 0 ? entity_id.slice(0, dot) : '';
    // homeassistant.toggle is a generic fallback for any toggleable entity.
    this.hass.callService(domain || 'homeassistant', 'toggle', { entity_id });
  }

  // Whether the bound entity is something the LightConfig modal can handle.
  isLightEntity(entity_id: string | null | undefined): boolean {
    return !!entity_id && entity_id.startsWith('light.');
  }

  resetView(): void {
    this.viewCenter = null;
    this.zoom = 1;
    this.emitConfig();
  }

  // ── Floor management ────────────────────────────────────────────────────
  switchFloor(id: string): void {
    this.store.currentFloorId = id;
    this.store.activeSensorId = null;
    this.activeMotionId = null;
    this.activeEnvId = null;
    this.activeFurnitureId = null;
    // Reset pan/zoom — viewCenter is in world mm and a different floor has
    // a different coord space; keeping it would leave the new floor offscreen.
    this.viewCenter = null;
    this.zoom = 1;
    // Clear in-flight interactions
    this.drag = null;
    this.editZone = null;
    this.drawingWall = null;
    this.save();
    this.emitConfig();
  }

  saveFloorEdit(editingId: string | null, name: string, w: number, d: number): void {
    if (editingId) {
      const f = this.store.floors.find(x => x.id === editingId);
      if (f) { f.name = name; f.w = w; f.d = d; }
    } else {
      const id = newId('f');
      this.store.floors.push(repairFloor({ id, name, w, d }));
      this.store.currentFloorId = id;
      this.store.activeSensorId = null;
    }
    this.save();
    this.emitConfig();
  }

  deleteFloor(id: string): boolean {
    if (this.store.floors.length <= 1) return false;
    this.store.floors = this.store.floors.filter(f => f.id !== id);
    this.store.currentFloorId = this.store.floors[0].id;
    this.store.activeSensorId = null;
    this.save();
    this.emitConfig();
    return true;
  }

  // ── Lerp tick (called from canvas RAF) ──────────────────────────────────
  updateLerpGoals(): void {
    if (!this.hass) return;
    const states = this.hass.states;
    const f = this.floor();
    for (const s of f.sensors) {
      if (!s.deviceSlug) continue;
      const d = this.discBy[s.id]; if (!d) continue;
      const lerp = this.lerpBy[s.id]; if (!lerp) continue;
      for (let i = 0; i < 3; i++) {
        const useAvg = !this.useRawTargets && !!d.avgX[i];
        const xId = useAvg ? d.avgX[i] : d.targets[i]?.x_id;
        const yId = useAvg ? d.avgY[i] : d.targets[i]?.y_id;
        const toMM = useAvg ? 1 : 10;
        if (!xId || !yId) { lerp[i].active = false; continue; }
        const x = this.stateMm(xId, toMM);
        const y = this.stateMm(yId, toMM);
        if (isNaN(x) || isNaN(y)) { lerp[i].active = false; continue; }
        let active: boolean;
        if (d.targetActive[i]) active = states[d.targetActive[i]!]?.state === 'on';
        else                   active = (x !== 0 || y !== 0);
        if (active) {
          if (!lerp[i].active) { lerp[i].cx = x; lerp[i].cy = y; lerp[i].vx = 0; lerp[i].vy = 0; }
          lerp[i].tx = x; lerp[i].ty = y; lerp[i].active = true;
        } else { lerp[i].active = false; }
      }
    }
  }

  stepLerp(dt: number): void {
    this.updateLerpGoals();
    // Critically damped spring toward the latest HA goal. HA pushes LD2450
    // coordinates at only a few Hz; the previous exponential ease made the
    // position surge right after every push and stall before the next, so
    // velocity pulsed at the HA update rate — the 3D walk cycle inherited
    // the lurch. The spring keeps velocity continuous across goal updates.
    // ω = 9 rad/s: ~0.6 s settle, trails a walking target by ~0.3 m.
    // Substep big frames (tab-switch resume, GC hiccup): one semi-implicit
    // Euler step at the caller's 0.1 s dt clamp puts ω·dt at 0.9, where the
    // velocity update coefficient (1 − 2ω·dt) goes negative and the spring
    // rings before settling. ω·h ≤ ~0.36 keeps it monotone.
    const w = 9;
    const steps = Math.max(1, Math.ceil(dt / 0.04));
    const h = dt / steps;
    for (const id of Object.keys(this.lerpBy)) {
      for (const sl of this.lerpBy[id]) {
        if (!sl.active) continue;
        for (let k = 0; k < steps; k++) {
          sl.vx += ((sl.tx - sl.cx) * w * w - 2 * w * sl.vx) * h;
          sl.vy += ((sl.ty - sl.cy) * w * w - 2 * w * sl.vy) * h;
          sl.cx += sl.vx * h;
          sl.cy += sl.vy * h;
        }
      }
    }
  }

  // ── Object write fence (ack window: HA echoes back our value, suppress overwrite) ─
  fenceObjectWrite(sensorId: string, oi: number): void {
    this.objWritePending[sensorId][oi] = true;
    const t = this.objWriteTimer[sensorId][oi];
    if (t) clearTimeout(t);
    this.objWriteTimer[sensorId][oi] = setTimeout(() => {
      this.objWritePending[sensorId][oi] = false;
    }, 3000);
  }
}
