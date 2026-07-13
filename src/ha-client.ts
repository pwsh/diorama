import type { ConnStatus, HassState } from './types.js';

type StateListener = (states: Record<string, HassState>, changedId?: string) => void;
type ConnListener = (status: ConnStatus) => void;
type Pending = (msg: { id: number; success: boolean; result?: unknown }) => void;

interface RawWsMsg {
  id?: number;
  type: string;
  event?: { event_type: string; data: { entity_id: string; new_state: HassState | null } };
  result?: HassState[];
  success?: boolean;
}

// Minimal connection surface the Planner + UI need. Implemented by
// HassClient (standalone WS + token, iframe mode) and HassPanelAdapter
// (native panel_custom mode where HA injects an authenticated `hass`
// object — see ha-panel-adapter.ts).
// A device-registry row. `connections` is HA's list of [type, value] tuples
// (e.g. ["mac", "aa:bb:cc:dd:ee:ff"]) — used to match a BLE proxy fixture's
// bound device to Bermuda scanner MACs.
export interface HaDevice {
  id: string;
  name: string | null;
  name_by_user: string | null;
  connections?: Array<[string, string]>;
}

// An entity-registry row. Extended additively with the fields Bermuda
// discovery needs: `platform` (integration), `unique_id`, `disabled_by`
// (null = enabled), and the naming fields.
export interface HaEntityReg {
  entity_id: string;
  device_id: string | null;
  platform?: string | null;
  unique_id?: string | null;
  disabled_by?: string | null;
  original_name?: string | null;
  name?: string | null;
  original_device_class?: string | null;   // registry-side device_class (battery-badge sibling resolution)
}

// One normalized point of an entity's history (from getHistory). `ts` is epoch
// ms; `attrs` carries lat/lon/gps_accuracy for device_tracker rows (see
// normalizeHistory — HA's compressed rows omit `a` when attributes are
// unchanged, so it's forward-filled from the previous row).
export interface HistoryPoint {
  state: string;
  attrs: Record<string, unknown>;
  ts: number;
}

// One forecast record from weather.get_forecasts (HA 2024.4+; the legacy
// `forecast` state attribute is gone). Subset of the fields providers expose —
// all optional since coverage varies by integration + forecast type.
export interface ForecastRecord {
  datetime?: string;
  condition?: string;
  temperature?: number;
  templow?: number;
  precipitation?: number;
  precipitation_probability?: number | null;
}

// Normalize HA's `history/history_during_period` compressed result. Row keys:
// s = state, a = attributes, lu = last_updated (epoch seconds), lc =
// last_changed. Attributes are forward-filled across rows that omit `a`.
// Tolerates the verbose (uncompressed) shape too.
export function normalizeHistory(raw: unknown): Record<string, HistoryPoint[]> {
  const out: Record<string, HistoryPoint[]> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [eid, rows] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(rows)) continue;
    let lastAttrs: Record<string, unknown> = {};
    out[eid] = rows.map(r => {
      const row = r as Record<string, unknown>;
      const a = (row.a ?? row.attributes) as Record<string, unknown> | undefined;
      if (a && typeof a === 'object') lastAttrs = a;
      const lu = (row.lu ?? row.last_updated ?? row.lc ?? row.last_changed) as number | string | undefined;
      const ts = typeof lu === 'number' ? lu * 1000
               : lu != null ? Date.parse(String(lu)) : 0;
      return { state: String(row.s ?? row.state ?? ''), attrs: { ...lastAttrs }, ts };
    });
  }
  return out;
}

// Normalize the weather.get_forecasts response envelope
// ({ response: { <entity_id>: { forecast: [...] } } }) down to the forecast
// array for `entityId`. Shared by both HaApi implementations. null on any
// missing / malformed piece.
export function normalizeForecasts(raw: unknown, entityId: string): ForecastRecord[] | null {
  const resp = (raw as { response?: Record<string, unknown> } | null)?.response;
  const entry = resp?.[entityId] as { forecast?: unknown } | undefined;
  const fc = entry?.forecast;
  if (!Array.isArray(fc)) return null;
  return fc as ForecastRecord[];
}

export interface HaApi {
  states: Record<string, HassState>;
  connect(): void;
  onState(fn: StateListener): void;
  onConn(fn: ConnListener): void;
  callService(domain: string, service: string, data: Record<string, unknown>): unknown;
  // Pull recorder history for the given entities over [startISO, endISO].
  // Returns normalized points per entity (empty map on failure / no data).
  getHistory(entityIds: string[], startISO: string, endISO: string): Promise<Record<string, HistoryPoint[]>>;
  // Fetch a weather entity's forecast via the modern service call (the legacy
  // `forecast` state attribute was removed in HA 2024.4). Returns the forecast
  // records for the requested type, or null on any failure / no data.
  getWeatherForecasts(entityId: string, type: 'daily' | 'hourly'): Promise<ForecastRecord[] | null>;
  getDevices(): Promise<Array<HaDevice>>;
  getEntityRegistry(): Promise<Array<HaEntityReg>>;
  // Update an entity-registry entry (e.g. { disabled_by: null } to enable a
  // disabled entity). Resolves true on success.
  updateEntityRegistry(entityId: string, changes: Record<string, unknown>): Promise<boolean>;
  getUserData<T = unknown>(key: string): Promise<T | null>;
  setUserData(key: string, value: unknown): Promise<boolean>;
  refreshStates(): Promise<void>;
}

export type { StateListener, ConnListener };

export class HassClient implements HaApi {
  states: Record<string, HassState> = {};

  private _url: string;
  private _token: string;
  private _ws: WebSocket | null = null;
  private _id = 1;
  private _pending = new Map<number, Pending>();
  private _stateListeners: StateListener[] = [];
  private _connListeners: ConnListener[] = [];
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _alive = false;

  constructor(baseUrl: string, token: string) {
    this._url = (baseUrl.replace(/\/$/, '') || window.location.origin)
                  .replace(/^http/, 'ws') + '/api/websocket';
    this._token = token;
  }

  connect(): void {
    if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
    if (this._ws) { try { this._ws.close(); } catch (_) {} }
    this._ws = new WebSocket(this._url);
    this._ws.onmessage = e => this._onMsg(JSON.parse(e.data));
    this._ws.onclose = () => {
      this._alive = false; this._emitConn('disconnected');
      this._reconnectTimer = setTimeout(() => this.connect(), 5000);
    };
    this._ws.onerror = () => { this._alive = false; this._emitConn('error'); };
  }

  onState(fn: StateListener): void { this._stateListeners.push(fn); }
  onConn(fn: ConnListener): void { this._connListeners.push(fn); }

  callService(domain: string, service: string, data: Record<string, unknown>) {
    return this._send({ type: 'call_service', domain, service, service_data: data });
  }

  async getHistory(entityIds: string[], startISO: string, endISO: string): Promise<Record<string, HistoryPoint[]>> {
    if (!entityIds.length) return {};
    const res = await this._send({
      type: 'history/history_during_period',
      start_time: startISO,
      end_time: endISO,
      entity_ids: entityIds,
      significant_changes_only: false,
      minimal_response: false,
      no_attributes: false,
    });
    if (!res.success) return {};
    return normalizeHistory(res.result);
  }

  async getWeatherForecasts(entityId: string, type: 'daily' | 'hourly'): Promise<ForecastRecord[] | null> {
    if (!entityId) return null;
    try {
      const res = await this._send({
        type: 'call_service', domain: 'weather', service: 'get_forecasts',
        service_data: { type }, target: { entity_id: entityId },
        return_response: true,
      });
      if (!res.success) return null;
      return normalizeForecasts(res.result, entityId);
    } catch { return null; }
  }

  // HA registry helpers — used by the entity picker so users can search by
  // device name. The result type uses 'unknown' since HA doesn't formally
  // version this WS endpoint and we only read a few well-known fields.
  async getDevices(): Promise<Array<HaDevice>> {
    const res = await this._send({ type: 'config/device_registry/list' });
    if (!res.success || !Array.isArray(res.result)) return [];
    return (res.result as Array<Record<string, unknown>>).map(d => ({
      id: String(d.id),
      name: typeof d.name === 'string' ? d.name : null,
      name_by_user: typeof d.name_by_user === 'string' ? d.name_by_user : null,
      connections: Array.isArray(d.connections)
        ? (d.connections as unknown[]).filter(c => Array.isArray(c) && c.length === 2)
            .map(c => [String((c as unknown[])[0]), String((c as unknown[])[1])] as [string, string])
        : undefined,
    }));
  }
  async getEntityRegistry(): Promise<Array<HaEntityReg>> {
    const res = await this._send({ type: 'config/entity_registry/list' });
    if (!res.success || !Array.isArray(res.result)) return [];
    return (res.result as Array<Record<string, unknown>>).map(e => ({
      entity_id: String(e.entity_id),
      device_id: typeof e.device_id === 'string' ? e.device_id : null,
      platform: typeof e.platform === 'string' ? e.platform : null,
      unique_id: typeof e.unique_id === 'string' ? e.unique_id : null,
      disabled_by: typeof e.disabled_by === 'string' ? e.disabled_by : null,
      original_name: typeof e.original_name === 'string' ? e.original_name : null,
      name: typeof e.name === 'string' ? e.name : null,
      original_device_class: typeof e.original_device_class === 'string' ? e.original_device_class : null,
    }));
  }

  async updateEntityRegistry(entityId: string, changes: Record<string, unknown>): Promise<boolean> {
    const res = await this._send({
      type: 'config/entity_registry/update', entity_id: entityId, ...changes,
    });
    return res.success;
  }

  // Per-user JSON storage backed by HA's `frontend.user_data.<userid>` table.
  // Same plumbing HA's own UI uses for sidebar order, themes, etc. Survives
  // browser data clear, syncs across devices, included in HA backups.
  async getUserData<T = unknown>(key: string): Promise<T | null> {
    const res = await this._send({ type: 'frontend/get_user_data', key });
    if (!res.success) return null;
    const v = (res.result as { value?: unknown } | null)?.value;
    return (v ?? null) as T | null;
  }

  async setUserData(key: string, value: unknown): Promise<boolean> {
    const res = await this._send({ type: 'frontend/set_user_data', key, value });
    return res.success;
  }

  private _onMsg(msg: RawWsMsg): void {
    switch (msg.type) {
      case 'auth_required':
        this._sendRaw({ type: 'auth', access_token: this._token });
        break;
      case 'auth_ok':
        this._alive = true; this._emitConn('connected');
        this._getStates(); this._subscribeEvents();
        break;
      case 'auth_invalid':
        this._alive = false; this._emitConn('auth_invalid');
        break;
      case 'result': {
        const cb = this._pending.get(msg.id ?? -1);
        if (cb) { this._pending.delete(msg.id ?? -1); cb(msg as any); }
        break;
      }
      case 'event':
        if (msg.event?.event_type === 'state_changed') {
          const { entity_id, new_state } = msg.event.data;
          if (new_state) this.states[entity_id] = new_state;
          else delete this.states[entity_id];
          this._emitState(entity_id);
        }
        break;
    }
  }

  private _send(obj: Record<string, unknown>): Promise<{ success: boolean; result?: unknown }> {
    const id = this._id++;
    return new Promise(resolve => {
      this._pending.set(id, m => resolve({ success: !!m.success, result: m.result }));
      this._sendRaw({ id, ...obj });
    });
  }

  private _sendRaw(obj: Record<string, unknown>): void {
    try { this._ws?.send(JSON.stringify(obj)); } catch (_) { /* ignore */ }
  }

  private async _getStates(): Promise<void> {
    const res = await this._send({ type: 'get_states' });
    if (res.success && Array.isArray(res.result)) {
      this.states = {};
      for (const s of res.result as HassState[]) this.states[s.entity_id] = s;
      this._emitState();
    }
  }

  // Public re-fetch hook. Useful after page refresh or when bound entities
  // appear to drift from HA's truth (rare, but state_changed events can be
  // missed during reconnects). Replaces the entire `states` map and emits a
  // full-state event so subscribers can resync.
  async refreshStates(): Promise<void> {
    await this._getStates();
  }

  private _subscribeEvents(): void {
    this._send({ type: 'subscribe_events', event_type: 'state_changed' });
  }

  // changedId === undefined → initial full state load.
  private _emitState(changedId?: string): void {
    for (const fn of this._stateListeners) fn(this.states, changedId);
  }

  private _emitConn(s: ConnStatus): void {
    for (const fn of this._connListeners) fn(s);
  }
}
