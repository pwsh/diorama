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
import type { HaApi, StateListener, ConnListener, HaDevice, HaEntityReg, HaFloorReg, HaAreaReg, HistoryPoint, ForecastRecord, ServiceCallResult } from './ha-client.js';
import { normalizeHistory, normalizeForecasts, normalizeRepairs, normalizeFloorRegistry, normalizeAreaRegistry } from './ha-client.js';
import { normalizeCalendarEvents, type CalEvent } from './surfaces.js';
import type { NotificationsUpdate, RepairIssue } from './alerts.js';

// Loose typing for HA frontend's hass object — we only touch a small,
// long-stable subset (connection.sendMessagePromise / subscribeEvents).
interface HassLike {
  states: Record<string, HassState>;
  // The logged-in HA user (HA's frontend hass object always carries it).
  user?: { is_admin?: boolean; name?: string } | null;
  connection: {
    sendMessagePromise<T = unknown>(msg: Record<string, unknown>): Promise<T>;
    subscribeEvents(
      cb: (ev: { data: { entity_id: string; new_state: HassState | null } }) => void,
      eventType: string,
    ): Promise<() => void>;
    // Generic subscription (home-assistant-js-websocket) — used for mqtt/subscribe.
    subscribeMessage<T = unknown>(
      cb: (ev: T) => void, msg: Record<string, unknown>,
    ): Promise<() => void>;
    // home-assistant-js-websocket Connection lifecycle events. 'ready' fires on
    // EVERY (re)connect; 'disconnected' when the socket drops. Optional in the
    // typing so a test fake without them still attaches.
    addEventListener?(ev: 'ready' | 'disconnected' | 'reconnect-error', cb: () => void): void;
    removeEventListener?(ev: 'ready' | 'disconnected' | 'reconnect-error', cb: () => void): void;
  };
}

export class HassPanelAdapter implements HaApi {
  states: Record<string, HassState> = {};

  private _conn: HassLike['connection'] | null = null;
  private _stateListeners: StateListener[] = [];
  private _connListeners: ConnListener[] = [];
  private _attached = false;
  private _closed = false;
  // state_changed unsubscribe handle (resolves async) — kept so close() can
  // release HA's subscription instead of leaking it for the tab's lifetime.
  private _unsubState: (() => void) | null = null;
  private _connEvents: HassLike['connection'] | null = null;
  // After HA's own reconnect the library re-subscribes state_changed for us,
  // but any change that happened while we were down is lost — resync the whole
  // map so a kiosk left running for days can't drift from HA's truth.
  private _onReady = (): void => {
    if (this._closed) return;
    this._emitConn('connected');
    void this.refreshStates().catch(() => { /* next ready / visibility refresh retries */ });
  };
  private _onDisconnected = (): void => {
    if (!this._closed) this._emitConn('disconnected');
  };

  // Called by the panel element every time HA pushes a new hass object.
  // Only the first call does setup; later calls are ignored because we track
  // state via our own state_changed subscription.
  attach(hass: HassLike): void {
    if (this._attached || this._closed) return;
    this._attached = true;
    this._conn = hass.connection;
    this._isAdmin = typeof hass.user?.is_admin === 'boolean' ? hass.user.is_admin : undefined;
    this._userName = typeof hass.user?.name === 'string' && hass.user.name ? hass.user.name : undefined;
    this.states = { ...hass.states };
    this._emitConn('connected');
    this._emitState();
    this._conn.subscribeEvents(ev => {
      if (this._closed) return;
      const { entity_id, new_state } = ev.data;
      if (new_state) this.states[entity_id] = new_state;
      else delete this.states[entity_id];
      this._emitState(entity_id);
    }, 'state_changed').then(unsub => {
      if (this._closed) { try { unsub(); } catch { /* ignore */ } return; }
      this._unsubState = unsub;
    }).catch(err => {
      console.error('diorama panel: subscribeEvents failed', err);
      this._emitConn('error');
    });
    // Registered once per adapter (attach is one-shot above), so a later
    // hass push can never double-register.
    try {
      this._conn.addEventListener?.('ready', this._onReady);
      this._conn.addEventListener?.('disconnected', this._onDisconnected);
      this._connEvents = this._conn;
    } catch { /* not a real Connection — resync falls back to visibility refreshes */ }
  }

  // Detach from HA's connection for good (Planner.dispose → hass.close). HA
  // owns the socket, so this only releases OUR subscriptions/listeners.
  // Idempotent; a closed adapter ignores further attach() calls.
  close(): void {
    if (this._closed) return;
    this._closed = true;
    try { this._unsubState?.(); } catch { /* ignore */ }
    this._unsubState = null;
    try {
      this._connEvents?.removeEventListener?.('ready', this._onReady);
      this._connEvents?.removeEventListener?.('disconnected', this._onDisconnected);
    } catch { /* ignore */ }
    this._connEvents = null;
    this._conn = null;
  }

  private _isAdmin: boolean | undefined = undefined;
  private _userName: string | undefined = undefined;
  isAdmin(): boolean | undefined { return this._isAdmin; }
  userName(): string | undefined { return this._userName; }

  connect(): void { /* no-op — HA owns the connection */ }
  onState(fn: StateListener): void { this._stateListeners.push(fn); }
  onConn(fn: ConnListener): void { this._connListeners.push(fn); }

  // sendMessagePromise REJECTS on `success:false`; normalize to the resolved
  // ServiceCallResult shape HassClient returns so a refused call (bad entity,
  // HA error, dropped socket) never becomes an unhandled rejection at a bare
  // fire-and-forget call site.
  callService(domain: string, service: string, data: Record<string, unknown>): Promise<ServiceCallResult> {
    if (!this._conn) return Promise.resolve({ success: false, error: { code: 'not_connected' } });
    try {
      return this._conn.sendMessagePromise({
        type: 'call_service', domain, service, service_data: data,
      }).then(() => ({ success: true }), (error: unknown) => ({ success: false, error }));
    } catch (error) { return Promise.resolve({ success: false, error }); }
  }

  async getHistory(entityIds: string[], startISO: string, endISO: string): Promise<Record<string, HistoryPoint[]>> {
    if (!this._conn || !entityIds.length) return {};
    try {
      const raw = await this._conn.sendMessagePromise({
        type: 'history/history_during_period',
        start_time: startISO,
        end_time: endISO,
        entity_ids: entityIds,
        significant_changes_only: false,
        minimal_response: false,
        no_attributes: false,
      });
      return normalizeHistory(raw);
    } catch { return {}; }
  }

  // Generic "service that returns data" call — see the HaApi doc comment. Both
  // methods below ride it, as does the flight feature's server-side ADS-B proxy
  // (a user-defined rest_command; the browser cannot reach those providers).
  async callServiceWithResponse(
    domain: string, service: string, data: Record<string, unknown>,
    target?: Record<string, unknown>,
  ): Promise<unknown | null> {
    if (!this._conn || !domain || !service) return null;
    try {
      const raw = await this._conn.sendMessagePromise({
        type: 'call_service', domain, service, service_data: data,
        ...(target ? { target } : {}),
        return_response: true,
      });
      return raw ?? null;
    } catch { return null; }
  }

  async getWeatherForecasts(entityId: string, type: 'daily' | 'hourly'): Promise<ForecastRecord[] | null> {
    if (!this._conn || !entityId) return null;
    return normalizeForecasts(
      await this.callServiceWithResponse(
        'weather', 'get_forecasts', { type }, { entity_id: entityId }),
      entityId);
  }

  async getCalendarEvents(entityIds: string[], startISO: string, endISO: string): Promise<CalEvent[]> {
    if (!this._conn || !entityIds.length) return [];
    return normalizeCalendarEvents(
      await this.callServiceWithResponse(
        'calendar', 'get_events',
        { start_date_time: startISO, end_date_time: endISO },
        { entity_id: entityIds }),
      entityIds);
  }

  async getDevices(): Promise<Array<HaDevice>> {
    if (!this._conn) return [];
    try {
      const res = await this._conn.sendMessagePromise<Array<Record<string, unknown>>>(
        { type: 'config/device_registry/list' });
      return (res ?? []).map(d => ({
        id: String(d.id),
        name: typeof d.name === 'string' ? d.name : null,
        name_by_user: typeof d.name_by_user === 'string' ? d.name_by_user : null,
        connections: Array.isArray(d.connections)
          ? (d.connections as unknown[]).filter(c => Array.isArray(c) && c.length === 2)
              .map(c => [String((c as unknown[])[0]), String((c as unknown[])[1])] as [string, string])
          : undefined,
        area_id: typeof d.area_id === 'string' ? d.area_id : null,
      }));
    } catch { return []; }
  }

  async getFloorRegistry(): Promise<Array<HaFloorReg>> {
    if (!this._conn) return [];
    try {
      return normalizeFloorRegistry(
        await this._conn.sendMessagePromise({ type: 'config/floor_registry/list' }));
    } catch { return []; }
  }

  async getAreaRegistry(): Promise<Array<HaAreaReg>> {
    if (!this._conn) return [];
    try {
      return normalizeAreaRegistry(
        await this._conn.sendMessagePromise({ type: 'config/area_registry/list' }));
    } catch { return []; }
  }

  async getEntityRegistry(): Promise<Array<HaEntityReg>> {
    if (!this._conn) return [];
    try {
      const res = await this._conn.sendMessagePromise<Array<Record<string, unknown>>>(
        { type: 'config/entity_registry/list' });
      return (res ?? []).map(e => ({
        entity_id: String(e.entity_id),
        device_id: typeof e.device_id === 'string' ? e.device_id : null,
        platform: typeof e.platform === 'string' ? e.platform : null,
        unique_id: typeof e.unique_id === 'string' ? e.unique_id : null,
        disabled_by: typeof e.disabled_by === 'string' ? e.disabled_by : null,
        original_name: typeof e.original_name === 'string' ? e.original_name : null,
        name: typeof e.name === 'string' ? e.name : null,
        original_device_class: typeof e.original_device_class === 'string' ? e.original_device_class : null,
        area_id: typeof e.area_id === 'string' ? e.area_id : null,
      }));
    } catch { return []; }
  }

  async updateEntityRegistry(entityId: string, changes: Record<string, unknown>): Promise<boolean> {
    if (!this._conn) return false;
    try {
      await this._conn.sendMessagePromise({
        type: 'config/entity_registry/update', entity_id: entityId, ...changes,
      });
      return true;
    } catch { return false; }
  }

  // ── MQTT bridge (Phase 5, Path A) ──
  // Deliberately NOT try/catch-swallowed: a rejection (e.g. the admin gate's
  // Unauthorized) must propagate so the bridge can surface status 'unauthorized'.
  async subscribeMqtt(
    topic: string, cb: (m: { topic: string; payload: string }) => void,
  ): Promise<() => void> {
    if (!this._conn) throw new Error('not connected');
    return this._conn.subscribeMessage<{ topic?: unknown; payload?: unknown }>(ev => {
      try { cb({ topic: String(ev?.topic ?? ''), payload: ev?.payload == null ? '' : String(ev.payload) }); }
      catch { /* consumer threw */ }
    }, { type: 'mqtt/subscribe', topic });
  }

  async publishMqtt(topic: string, payload: string, retain = false): Promise<void> {
    // Same resolve-never-reject contract as HassClient.publishMqtt.
    await this.callService('mqtt', 'publish', { topic, payload, qos: 0, retain });
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

  // ── Alert Center ──
  async subscribePersistentNotifications(cb: (u: NotificationsUpdate) => void): Promise<() => void> {
    if (!this._conn) return () => {};
    try {
      return await this._conn.subscribeMessage<{ type?: unknown; notifications?: unknown }>(ev => {
        try {
          cb({
            type: (ev?.type as NotificationsUpdate['type']) ?? 'current',
            notifications: (ev?.notifications as NotificationsUpdate['notifications']) ?? {},
          });
        } catch { /* consumer threw */ }
      }, { type: 'persistent_notification/subscribe' });
    } catch { return () => {}; }
  }

  async listRepairsIssues(): Promise<RepairIssue[]> {
    if (!this._conn) return [];
    try {
      const raw = await this._conn.sendMessagePromise({ type: 'repairs/list_issues' });
      return normalizeRepairs(raw);
    } catch { return []; }
  }

  async ignoreRepairsIssue(domain: string, issueId: string, ignore: boolean): Promise<boolean> {
    if (!this._conn) return false;
    try {
      await this._conn.sendMessagePromise({
        type: 'repairs/ignore_issue', domain, issue_id: issueId, ignore,
      });
      return true;
    } catch { return false; }
  }

  async refreshStates(): Promise<void> {
    if (!this._conn) return;
    const res = await this._conn.sendMessagePromise<HassState[]>({ type: 'get_states' });
    if (this._closed) return;
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
