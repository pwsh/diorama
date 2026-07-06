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
export interface HaApi {
  states: Record<string, HassState>;
  connect(): void;
  onState(fn: StateListener): void;
  onConn(fn: ConnListener): void;
  callService(domain: string, service: string, data: Record<string, unknown>): unknown;
  getDevices(): Promise<Array<{ id: string; name: string | null; name_by_user: string | null }>>;
  getEntityRegistry(): Promise<Array<{ entity_id: string; device_id: string | null }>>;
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

  // HA registry helpers — used by the entity picker so users can search by
  // device name. The result type uses 'unknown' since HA doesn't formally
  // version this WS endpoint and we only read a few well-known fields.
  async getDevices(): Promise<Array<{ id: string; name: string | null; name_by_user: string | null }>> {
    const res = await this._send({ type: 'config/device_registry/list' });
    if (!res.success || !Array.isArray(res.result)) return [];
    return (res.result as Array<Record<string, unknown>>).map(d => ({
      id: String(d.id),
      name: typeof d.name === 'string' ? d.name : null,
      name_by_user: typeof d.name_by_user === 'string' ? d.name_by_user : null,
    }));
  }
  async getEntityRegistry(): Promise<Array<{ entity_id: string; device_id: string | null }>> {
    const res = await this._send({ type: 'config/entity_registry/list' });
    if (!res.success || !Array.isArray(res.result)) return [];
    return (res.result as Array<Record<string, unknown>>).map(e => ({
      entity_id: String(e.entity_id),
      device_id: typeof e.device_id === 'string' ? e.device_id : null,
    }));
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
