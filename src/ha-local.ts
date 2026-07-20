// Offline / standalone HaApi implementation. Backs the whole panel with NO
// Home Assistant connection: user_data lives in localStorage, there are no
// entity states, service calls are inert. Because the multi-configuration
// layer (Batch B) rides only HaApi.get/setUserData, configurations work
// offline unchanged — they just live in this browser instead of HA.
//
// Lives in the app graph only. NEVER import this into the renderer chunk
// (three-renderer.js) — it would collapse the lazy 3D code-split.

import type { HaApi, StateListener, ConnListener, HaDevice, HaEntityReg, HistoryPoint, ForecastRecord } from './ha-client.js';
import type { CalEvent } from './surfaces.js';
import type { NotificationsUpdate, RepairIssue } from './alerts.js';
import type { HassState, ConnStatus } from './types.js';

// localStorage namespace for offline user_data. One key per user_data key, so
// the config index (`diorama-configs`) and each body (`diorama-cfg-<id>`) get
// their own `diorama:local:<key>` slot.
const LOCAL_PREFIX = 'diorama:local:';

// Persistent flag that routes the standalone entry straight into offline mode
// on reload (set by the auth screen's "Use offline" button, cleared by the
// Settings ▸ Connection "Exit offline mode" action).
export const OFFLINE_FLAG_KEY = 'diorama:offline';

// Pure startup decision for the STANDALONE entry: start offline iff the flag is
// set OR the URL asks for it (`?offline=1`, or any `?demo=…` — the hosted demo
// auto-starts offline for a first-time visitor with no flag set). Both inputs
// are guarded so a storage exception (private mode, disabled cookies) or a bad
// query never throws during boot. Panel mode never consults this (panel.ts
// adopts a Planner before the app's startup check runs).
export function shouldStartOffline(
  storage?: Pick<Storage, 'getItem'> | null,
  search?: string,
): boolean {
  try {
    if ((storage ?? localStorage).getItem(OFFLINE_FLAG_KEY) === '1') return true;
  } catch { /* storage unavailable — fall through to the URL check */ }
  try {
    const s = search ?? (typeof window !== 'undefined' ? window.location.search : '');
    const q = new URLSearchParams(s);
    if (q.get('offline') === '1') return true;
    if (q.has('demo')) return true;
  } catch { /* ignore */ }
  return false;
}

export class LocalApi implements HaApi {
  // Marker the Planner's `isOffline` getter reads to branch UI (topbar pill,
  // Settings exit button) without a duplicate flag lookup.
  readonly offline = true;

  states: Record<string, HassState> = {};

  private _stateListeners: StateListener[] = [];
  private _connListeners: ConnListener[] = [];

  // Mirror HassClient's boot shape: announce "connected" and deliver one
  // initial full-state snapshot (empty, changedId === undefined) so the
  // Planner's one-time _loadFromHa → config-registry load fires. Deferred to a
  // microtask so onState/onConn (registered right after connectWith calls this)
  // are wired before the emit, matching the real WS's async arrival.
  connect(): void {
    const emit = () => { this._emitConn('connected'); this._emitState(); };
    if (typeof queueMicrotask === 'function') queueMicrotask(emit);
    else Promise.resolve().then(emit);
  }

  onState(fn: StateListener): void { this._stateListeners.push(fn); }
  onConn(fn: ConnListener): void { this._connListeners.push(fn); }

  callService(domain: string, service: string, data: Record<string, unknown>): unknown {
    console.debug('[diorama offline] callService no-op:', `${domain}.${service}`, data);
    return undefined;
  }

  async getHistory(): Promise<Record<string, HistoryPoint[]>> { return {}; }
  async getWeatherForecasts(): Promise<ForecastRecord[] | null> { return null; }
  async getCalendarEvents(): Promise<CalEvent[]> { return []; }
  async getDevices(): Promise<Array<HaDevice>> { return []; }
  async getEntityRegistry(): Promise<Array<HaEntityReg>> { return []; }
  async updateEntityRegistry(entityId: string, changes: Record<string, unknown>): Promise<boolean> {
    console.debug('[diorama offline] updateEntityRegistry no-op:', entityId, changes);
    return false;
  }

  // ── MQTT bridge (Phase 5) — inert offline (no broker, no relay) ──
  async subscribeMqtt(): Promise<() => void> { return () => {}; }
  async publishMqtt(): Promise<void> { /* no-op */ }

  // ── user_data over localStorage ───────────────────────────────────────────
  // null on absence (matching HassClient). A tombstone write (Batch B's
  // deleteConfig sets a body to `{}`) is stored verbatim and reads back as `{}`
  // — `_loadBody` rejects it (no `floors` array) exactly as with HA. A null/
  // undefined value REMOVES the slot (clean absence; no current caller relies
  // on reading null back).
  async getUserData<T = unknown>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(LOCAL_PREFIX + key);
      if (raw == null) return null;
      return JSON.parse(raw) as T;
    } catch { return null; }
  }

  async setUserData(key: string, value: unknown): Promise<boolean> {
    try {
      if (value == null) { localStorage.removeItem(LOCAL_PREFIX + key); return true; }
      localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(value));
      return true;
    } catch { return false; }
  }

  async refreshStates(): Promise<void> { /* no HA to re-fetch */ }

  // ── Alert Center — inert offline (no HA to surface notifications/repairs) ──
  async subscribePersistentNotifications(_cb: (u: NotificationsUpdate) => void): Promise<() => void> { return () => {}; }
  async listRepairsIssues(): Promise<RepairIssue[]> { return []; }
  async ignoreRepairsIssue(): Promise<boolean> { return false; }

  private _emitState(changedId?: string): void {
    for (const fn of this._stateListeners) fn(this.states, changedId);
  }
  private _emitConn(s: ConnStatus): void {
    for (const fn of this._connListeners) fn(s);
  }
}
