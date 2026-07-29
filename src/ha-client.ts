import type { ConnStatus, HassState } from './types.js';
import type { NotificationsUpdate, RepairIssue } from './alerts.js';
import { normalizeCalendarEvents, type CalEvent } from './surfaces.js';

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
  area_id?: string | null;     // HA area this device belongs to (area-filtered pickers)
}

// A floor-registry row (HA 2024.4+ `config/floor_registry/list`). Diorama
// floors bind to one of these (Floor.haFloorId) so the room ↔ area picker can
// scope its area list to the story you're editing.
export interface HaFloorReg {
  floor_id: string;
  name: string;
  level?: number | null;
  icon?: string | null;
}

// An area-registry row (`config/area_registry/list`). `floor_id` is present
// only when the user assigned the area to a floor in HA.
export interface HaAreaReg {
  area_id: string;
  name: string;
  floor_id?: string | null;
  icon?: string | null;
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
  area_id?: string | null;   // entity-level area override; absent ⇒ inherit the device's area
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

// Normalize a repairs/list_issues result into RepairIssue[]. `dismissed_version`
// present ⇒ the user ignored it (surfaced as `ignored`). Tolerant of the raw
// row shape (HA doesn't formally version this endpoint). Shared by both clients.
export function normalizeRepairs(raw: unknown): RepairIssue[] {
  const issues = (raw as { issues?: unknown } | null)?.issues;
  if (!Array.isArray(issues)) return [];
  return issues.map(i => {
    const r = i as Record<string, unknown>;
    return {
      issue_id: String(r.issue_id ?? ''),
      domain: String(r.domain ?? ''),
      severity: String(r.severity ?? 'warning'),
      translation_key: typeof r.translation_key === 'string' ? r.translation_key : undefined,
      translation_placeholders: (r.translation_placeholders as Record<string, unknown>) ?? undefined,
      is_fixable: r.is_fixable === true,
      issue_domain: typeof r.issue_domain === 'string' ? r.issue_domain : null,
      created: typeof r.created === 'string' ? r.created : undefined,
      breaks_in_ha_version: typeof r.breaks_in_ha_version === 'string' ? r.breaks_in_ha_version : null,
      learn_more_url: typeof r.learn_more_url === 'string' ? r.learn_more_url : null,
      ignored: r.dismissed_version != null || r.ignored === true,
    };
  });
}

// Normalize a `config/floor_registry/list` result. Rows without a usable
// floor_id are dropped; a missing name falls back to the id so a dropdown is
// never blank. Shared by both real clients (never throws).
export function normalizeFloorRegistry(raw: unknown): HaFloorReg[] {
  if (!Array.isArray(raw)) return [];
  const out: HaFloorReg[] = [];
  for (const r of raw as Array<Record<string, unknown>>) {
    const id = typeof r?.floor_id === 'string' ? r.floor_id : '';
    if (!id) continue;
    out.push({
      floor_id: id,
      name: typeof r.name === 'string' && r.name ? r.name : id,
      level: typeof r.level === 'number' ? r.level : null,
      icon: typeof r.icon === 'string' ? r.icon : null,
    });
  }
  return out;
}

// Normalize a `config/area_registry/list` result. Same tolerance as the floor
// registry; `floor_id` stays null when the area isn't assigned to a floor.
export function normalizeAreaRegistry(raw: unknown): HaAreaReg[] {
  if (!Array.isArray(raw)) return [];
  const out: HaAreaReg[] = [];
  for (const r of raw as Array<Record<string, unknown>>) {
    const id = typeof r?.area_id === 'string' ? r.area_id : '';
    if (!id) continue;
    out.push({
      area_id: id,
      name: typeof r.name === 'string' && r.name ? r.name : id,
      floor_id: typeof r.floor_id === 'string' ? r.floor_id : null,
      icon: typeof r.icon === 'string' ? r.icon : null,
    });
  }
  return out;
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
  // Fetch upcoming events for one or more calendar.* entities via the
  // `calendar.get_events` action (return_response) over [startISO, endISO].
  // Returns a flat, chronologically merged CalEvent[] (empty on any failure /
  // no events). Calendars don't push their full agenda over state_changed, so
  // this is a poll path (Planner._refreshCalendars), like weather forecasts.
  getCalendarEvents(entityIds: string[], startISO: string, endISO: string): Promise<CalEvent[]>;
  getDevices(): Promise<Array<HaDevice>>;
  getEntityRegistry(): Promise<Array<HaEntityReg>>;
  // HA floor + area registries (area binding: Floor.haFloorId / Room.haAreaId).
  // Both resolve to [] on any failure / offline — a missing registry just means
  // no area binding is offered, never a broken panel.
  getFloorRegistry(): Promise<Array<HaFloorReg>>;
  getAreaRegistry(): Promise<Array<HaAreaReg>>;
  // Update an entity-registry entry (e.g. { disabled_by: null } to enable a
  // disabled entity). Resolves true on success.
  updateEntityRegistry(entityId: string, changes: Record<string, unknown>): Promise<boolean>;
  // ── MQTT bridge (Phase 5, Path A) ──
  // Subscribe to a broker topic (wildcards allowed) via HA's own `mqtt/subscribe`
  // WS command. HA pushes `{topic, payload, qos, retain}` events; the callback
  // receives the topic + payload string. Resolves to an unsubscribe handle.
  // REJECTS (never swallows) so the caller can surface an admin-gate Unauthorized
  // error as a distinct status. Admin-only on HA's side.
  subscribeMqtt(topic: string, cb: (m: { topic: string; payload: string }) => void): Promise<() => void>;
  // Publish to a broker topic via the `mqtt.publish` service (not admin-gated).
  publishMqtt(topic: string, payload: string, retain?: boolean): Promise<void>;
  getUserData<T = unknown>(key: string): Promise<T | null>;
  setUserData(key: string, value: unknown): Promise<boolean>;
  refreshStates(): Promise<void>;
  // ── Alert Center ──
  // Live-subscribe to persistent notifications (WS persistent_notification/
  // subscribe — non-admin-safe, pushes a `current` snapshot then add/update/
  // remove deltas). Resolves to an unsubscribe handle. NEVER throws — offline /
  // unsupported resolves to a no-op unsubscribe.
  subscribePersistentNotifications(cb: (u: NotificationsUpdate) => void): Promise<() => void>;
  // Poll the Repairs issue registry (WS repairs/list_issues — ADMIN-only; a
  // non-admin user errors). Catches and returns [] so a non-admin viewer just
  // sees no repairs instead of a broken panel.
  listRepairsIssues(): Promise<RepairIssue[]>;
  // Ignore / un-ignore a Repairs issue (WS repairs/ignore_issue). Resolves true
  // on success; false on any error (incl. non-admin).
  ignoreRepairsIssue(domain: string, issueId: string, ignore: boolean): Promise<boolean>;
}

export type { StateListener, ConnListener };

export class HassClient implements HaApi {
  states: Record<string, HassState> = {};

  private _url: string;
  private _token: string;
  private _ws: WebSocket | null = null;
  private _id = 1;
  private _pending = new Map<number, Pending>();
  // Generic subscription callbacks keyed by the subscribe command's message id
  // (mqtt/subscribe rides this). HA delivers ongoing `{type:'event', id, event}`
  // messages for the subscription's lifetime.
  private _subscriptions = new Map<number, (event: unknown) => void>();
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

  async getCalendarEvents(entityIds: string[], startISO: string, endISO: string): Promise<CalEvent[]> {
    if (!entityIds.length) return [];
    try {
      const res = await this._send({
        type: 'call_service', domain: 'calendar', service: 'get_events',
        service_data: { start_date_time: startISO, end_date_time: endISO },
        target: { entity_id: entityIds },
        return_response: true,
      });
      if (!res.success) return [];
      return normalizeCalendarEvents(res.result, entityIds);
    } catch { return []; }
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
      area_id: typeof d.area_id === 'string' ? d.area_id : null,
    }));
  }

  async getFloorRegistry(): Promise<Array<HaFloorReg>> {
    try {
      const res = await this._send({ type: 'config/floor_registry/list' });
      if (!res.success || !Array.isArray(res.result)) return [];
      return normalizeFloorRegistry(res.result);
    } catch { return []; }
  }

  async getAreaRegistry(): Promise<Array<HaAreaReg>> {
    try {
      const res = await this._send({ type: 'config/area_registry/list' });
      if (!res.success || !Array.isArray(res.result)) return [];
      return normalizeAreaRegistry(res.result);
    } catch { return []; }
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
      area_id: typeof e.area_id === 'string' ? e.area_id : null,
    }));
  }

  async updateEntityRegistry(entityId: string, changes: Record<string, unknown>): Promise<boolean> {
    const res = await this._send({
      type: 'config/entity_registry/update', entity_id: entityId, ...changes,
    });
    return res.success;
  }

  // ── MQTT bridge (Phase 5, Path A) ──
  subscribeMqtt(
    topic: string, cb: (m: { topic: string; payload: string }) => void,
  ): Promise<() => void> {
    const id = this._id++;
    return new Promise<() => void>((resolve, reject) => {
      // Ongoing event handler for this subscription's lifetime.
      this._subscriptions.set(id, ev => {
        const e = (ev ?? {}) as { topic?: unknown; payload?: unknown };
        try { cb({ topic: String(e.topic ?? ''), payload: e.payload == null ? '' : String(e.payload) }); }
        catch { /* consumer threw — never break the socket loop */ }
      });
      // First `result` confirms the subscribe (or rejects — admin gate lands here).
      this._pending.set(id, m => {
        const raw = m as { success?: boolean; error?: { code?: string; message?: string } };
        if (raw.success) {
          resolve(() => this._unsubscribeId(id));
        } else {
          this._subscriptions.delete(id);
          const err = raw.error;
          reject(new Error(err?.message || err?.code || 'mqtt/subscribe failed'));
        }
      });
      this._sendRaw({ id, type: 'mqtt/subscribe', topic });
    });
  }

  async publishMqtt(topic: string, payload: string, retain = false): Promise<void> {
    await this._send({
      type: 'call_service', domain: 'mqtt', service: 'publish',
      service_data: { topic, payload, qos: 0, retain },
    });
  }

  private _unsubscribeId(id: number): void {
    this._subscriptions.delete(id);
    // Generic cancel — HA's websocket_api unsubscribes any subscription by id.
    this._sendRaw({ id: this._id++, type: 'unsubscribe_events', subscription: id });
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
      case 'event': {
        // Generic subscription events (mqtt/subscribe) route by message id first.
        const sub = msg.id != null ? this._subscriptions.get(msg.id) : undefined;
        if (sub) { sub((msg as { event?: unknown }).event); break; }
        if (msg.event?.event_type === 'state_changed') {
          const { entity_id, new_state } = msg.event.data;
          if (new_state) this.states[entity_id] = new_state;
          else delete this.states[entity_id];
          this._emitState(entity_id);
        }
        break;
      }
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

  // ── Alert Center ──
  subscribePersistentNotifications(cb: (u: NotificationsUpdate) => void): Promise<() => void> {
    const id = this._id++;
    return new Promise<() => void>(resolve => {
      this._subscriptions.set(id, ev => {
        const e = (ev ?? {}) as { type?: unknown; notifications?: unknown };
        try {
          cb({
            type: (e.type as NotificationsUpdate['type']) ?? 'current',
            notifications: (e.notifications as NotificationsUpdate['notifications']) ?? {},
          });
        } catch { /* consumer threw — never break the socket loop */ }
      });
      this._pending.set(id, m => {
        // Non-admin-safe command — a failure (unsupported HA) just resolves to a
        // no-op unsubscribe so the caller never has to try/catch.
        if (!(m as { success?: boolean }).success) this._subscriptions.delete(id);
        resolve(() => this._unsubscribeId(id));
      });
      this._sendRaw({ id, type: 'persistent_notification/subscribe' });
    });
  }

  async listRepairsIssues(): Promise<RepairIssue[]> {
    try {
      const res = await this._send({ type: 'repairs/list_issues' });
      if (!res.success) return [];
      return normalizeRepairs(res.result);
    } catch { return []; }
  }

  async ignoreRepairsIssue(domain: string, issueId: string, ignore: boolean): Promise<boolean> {
    try {
      const res = await this._send({
        type: 'repairs/ignore_issue', domain, issue_id: issueId, ignore,
      });
      return res.success;
    } catch { return false; }
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
