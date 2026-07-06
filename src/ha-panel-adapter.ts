// Adapter that satisfies the HaApi surface using the `hass` object Home
// Assistant injects into custom panels (panel_custom). No token, no separate
// WebSocket — we ride HA frontend's existing authenticated connection.
//
// HA calls `set hass(h)` on the panel element on every state change; we only
// need the first one to grab `h.connection`, then we subscribe to
// state_changed ourselves and maintain our own states map exactly like
// HassClient does (keeps Planner's change-detection semantics identical
// across both modes).

import type { ConnStatus, HassState } from './types.js';
import type { HaApi, StateListener, ConnListener } from './ha-client.js';

// Loose typing for HA frontend's hass object — we only touch a small,
// long-stable subset (connection.sendMessagePromise / subscribeEvents).
interface HassLike {
  states: Record<string, HassState>;
  connection: {
    sendMessagePromise<T = unknown>(msg: Record<string, unknown>): Promise<T>;
    subscribeEvents(
      cb: (ev: { data: { entity_id: string; new_state: HassState | null } }) => void,
      eventType: string,
    ): Promise<() => void>;
  };
}

export class HassPanelAdapter implements HaApi {
  states: Record<string, HassState> = {};

  private _conn: HassLike['connection'] | null = null;
  private _stateListeners: StateListener[] = [];
  private _connListeners: ConnListener[] = [];
  private _attached = false;

  // Called by the panel element every time HA pushes a new hass object.
  // Only the first call does setup; later calls are ignored because we track
  // state via our own state_changed subscription.
  attach(hass: HassLike): void {
    if (this._attached) return;
    this._attached = true;
    this._conn = hass.connection;
    this.states = { ...hass.states };
    this._emitConn('connected');
    this._emitState();
    this._conn.subscribeEvents(ev => {
      const { entity_id, new_state } = ev.data;
      if (new_state) this.states[entity_id] = new_state;
      else delete this.states[entity_id];
      this._emitState(entity_id);
    }, 'state_changed').catch(err => {
      console.error('diorama panel: subscribeEvents failed', err);
      this._emitConn('error');
    });
  }

  connect(): void { /* no-op — HA owns the connection */ }
  onState(fn: StateListener): void { this._stateListeners.push(fn); }
  onConn(fn: ConnListener): void { this._connListeners.push(fn); }

  callService(domain: string, service: string, data: Record<string, unknown>): unknown {
    return this._conn?.sendMessagePromise({
      type: 'call_service', domain, service, service_data: data,
    });
  }

  async getDevices(): Promise<Array<{ id: string; name: string | null; name_by_user: string | null }>> {
    if (!this._conn) return [];
    try {
      const res = await this._conn.sendMessagePromise<Array<Record<string, unknown>>>(
        { type: 'config/device_registry/list' });
      return (res ?? []).map(d => ({
        id: String(d.id),
        name: typeof d.name === 'string' ? d.name : null,
        name_by_user: typeof d.name_by_user === 'string' ? d.name_by_user : null,
      }));
    } catch { return []; }
  }

  async getEntityRegistry(): Promise<Array<{ entity_id: string; device_id: string | null }>> {
    if (!this._conn) return [];
    try {
      const res = await this._conn.sendMessagePromise<Array<Record<string, unknown>>>(
        { type: 'config/entity_registry/list' });
      return (res ?? []).map(e => ({
        entity_id: String(e.entity_id),
        device_id: typeof e.device_id === 'string' ? e.device_id : null,
      }));
    } catch { return []; }
  }

  async getUserData<T = unknown>(key: string): Promise<T | null> {
    if (!this._conn) return null;
    try {
      const res = await this._conn.sendMessagePromise<{ value?: unknown } | null>(
        { type: 'frontend/get_user_data', key });
      return ((res?.value) ?? null) as T | null;
    } catch { return null; }
  }

  async setUserData(key: string, value: unknown): Promise<boolean> {
    if (!this._conn) return false;
    try {
      await this._conn.sendMessagePromise({ type: 'frontend/set_user_data', key, value });
      return true;
    } catch { return false; }
  }

  async refreshStates(): Promise<void> {
    if (!this._conn) return;
    const res = await this._conn.sendMessagePromise<HassState[]>({ type: 'get_states' });
    if (Array.isArray(res)) {
      this.states = {};
      for (const s of res) this.states[s.entity_id] = s;
      this._emitState();
    }
  }

  private _emitState(changedId?: string): void {
    for (const fn of this._stateListeners) fn(this.states, changedId);
  }
  private _emitConn(s: ConnStatus): void {
    for (const fn of this._connListeners) fn(s);
  }
}
