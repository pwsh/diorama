// MQTT bridge transport abstraction (Phase 5). weather.ts-style isolation: the
// rest of the app never cares whether the data arrives via HA's own
// `mqtt/subscribe` relay (Path A) or a direct broker WebSocket (Path B). Both
// converge on the same internal shape — per-filter callbacks fed `{topic,
// payloadString}`.
//
//   Path A (ha-relay): uses HaApi.subscribeMqtt / publishMqtt. Admin-gated on
//     HA's side; a subscription error containing "Unauthorized" surfaces as
//     status 'unauthorized' (the UI then suggests direct mode). HA matches each
//     filter server-side, so each subscription's messages route straight to that
//     filter's callbacks.
//   Path B (direct): lazy-imports mqtt-ws.ts (kept out of the startup graph),
//     owns reconnect backoff (2→30 s) + resubscribe, reads broker credentials
//     from localStorage ONLY (never the synced Store), and dispatches inbound
//     PUBLISHes through matchTopicFilter to every registered filter.
//
// This module is itself lazy-imported by the Planner (only when a bridge mode is
// configured), so 2D-only / non-MQTT users pay zero bytes.

import type { MqttWsClient, MqttStatus } from './mqtt-ws.js';   // type-only — no static value pull

export type BridgeStatus = 'idle' | 'connecting' | 'up' | 'error' | 'unauthorized';

export interface BridgeConfig {
  mode: 'ha-relay' | 'direct';
  brokerHost?: string;
  brokerPort?: number;
  useTls?: boolean;
  // ── test hooks (production leaves these undefined) ──
  WebSocketCtor?: typeof WebSocket;   // direct path: injectable fake socket
  backoffBaseMs?: number;             // direct reconnect base (default 2000)
  backoffMaxMs?: number;              // direct reconnect cap (default 30000)
  stableUpMs?: number;                // 'up' this long before backoff resets (default 30000)
}

// The subset of HaApi the bridge needs. Typed narrowly (not the whole HaApi) so
// the module stays isolated + the test can pass a fake with just these two.
export interface BridgeApi {
  subscribeMqtt(
    topic: string, cb: (m: { topic: string; payload: string }) => void,
  ): Promise<() => void>;
  publishMqtt(topic: string, payload: string, retain?: boolean): Promise<void>;
}

// `payloadString` is always present. On the DIRECT path it is binary-safe: valid
// UTF-8 decodes as text, anything else (Valetudo's zlib map) arrives as a
// byte-per-code-point string (see mqtt-ws.ts payloadToString), and the raw bytes
// ride along in `payloadBytes`. The HA relay only ever hands us a string (HA's
// JSON event serialization), so `payloadBytes` is absent there.
export interface BridgeMessage { topic: string; payloadString: string; payloadBytes?: Uint8Array; }
export type BridgeMessageCb = (m: BridgeMessage) => void;

export interface BridgeHandlers {
  onStatus?: (s: BridgeStatus) => void;
}

export interface BridgeHandle {
  subscribe(filter: string, cb: BridgeMessageCb): void;
  publish(topic: string, payload: string, retain?: boolean): void;
  stop(): void;
  readonly status: BridgeStatus;
}

function isUnauthorized(err: unknown): boolean {
  const e = err as { message?: unknown; code?: unknown } | null;
  const s = String(e?.message ?? e?.code ?? err ?? '').toLowerCase();
  return s.includes('unauthorized') || s.includes('not authorized');
}

// Broker credentials live in localStorage ONLY (device-local, unsynced) —
// mirroring diorama:token/diorama:url. Guarded so private-mode storage errors
// never throw during a connect attempt.
function readBrokerCreds(): { user?: string; pass?: string } {
  try {
    return {
      user: localStorage.getItem('diorama:mqtt:user') || undefined,
      pass: localStorage.getItem('diorama:mqtt:pass') || undefined,
    };
  } catch { return {}; }
}

function buildBrokerUrl(cfg: BridgeConfig): string {
  const scheme = cfg.useTls ? 'wss' : 'ws';
  const host = cfg.brokerHost || 'localhost';
  const port = cfg.brokerPort || 9001;
  return `${scheme}://${host}:${port}/`;   // mosquitto websockets listener default path
}

// Start a bridge in the configured mode. Returns a handle immediately; the
// underlying connection comes up asynchronously and reports via onStatus.
export function startBridge(
  cfg: BridgeConfig, api: BridgeApi, handlers: BridgeHandlers = {},
): BridgeHandle {
  let status: BridgeStatus = 'idle';
  let stopped = false;
  const setStatus = (s: BridgeStatus): void => {
    if (s === status || stopped) return;
    status = s;
    try { handlers.onStatus?.(s); } catch { /* ignore */ }
  };

  // filter → callbacks registered for it.
  const subs = new Map<string, Set<BridgeMessageCb>>();

  const deliver = (filter: string, topic: string, payloadString: string): void => {
    const cbs = subs.get(filter);
    if (!cbs) return;
    for (const cb of cbs) { try { cb({ topic, payloadString }); } catch { /* consumer threw */ } }
  };

  if (cfg.mode === 'ha-relay') {
    // ── Path A: HA relay ──────────────────────────────────────────────────
    const unsubs = new Map<string, () => void>();
    setStatus('connecting');
    // Probe the admin gate up front so the status pill / Test button report even
    // before any consumer subscribes. Subscribing to a benign topic exercises
    // exactly the same `is_admin` check the real subscriptions hit.
    api.subscribeMqtt('diorama/bridge/probe', () => { /* discard */ })
      .then(unsub => { try { unsub(); } catch { /* ignore */ } if (!stopped) setStatus('up'); })
      .catch(err => { if (!stopped) setStatus(isUnauthorized(err) ? 'unauthorized' : 'error'); });

    const startRelaySub = (filter: string): void => {
      api.subscribeMqtt(filter, m => deliver(filter, m.topic, m.payload))
        .then(unsub => {
          if (stopped) { try { unsub(); } catch { /* ignore */ } return; }
          unsubs.set(filter, unsub);
          setStatus('up');
        })
        .catch(err => { if (!stopped) setStatus(isUnauthorized(err) ? 'unauthorized' : 'error'); });
    };

    return {
      subscribe(filter, cb) {
        let entry = subs.get(filter);
        if (!entry) { entry = new Set(); subs.set(filter, entry); startRelaySub(filter); }
        entry.add(cb);
      },
      publish(topic, payload, retain) {
        api.publishMqtt(topic, payload, retain).catch(() => { /* fire-and-forget */ });
      },
      stop() {
        stopped = true;
        for (const u of unsubs.values()) { try { u(); } catch { /* ignore */ } }
        unsubs.clear(); subs.clear();
        status = 'idle';   // final; no onStatus emit needed after stop
      },
      get status() { return status; },
    };
  }

  // ── Path B: direct broker ─────────────────────────────────────────────────
  const backoffBase = cfg.backoffBaseMs ?? 2000;
  const backoffMax = cfg.backoffMaxMs ?? 30000;
  const stableUpMs = cfg.stableUpMs ?? 30000;
  let backoff = backoffBase;
  // The backoff only resets after the link has stayed up for `stableUpMs`. A
  // broker that accepts CONNECT and then drops us immediately (bad ACL, client
  // id clash, flapping proxy) would otherwise reset to the 2 s base on every
  // 'up' and hammer it in a connect/up/close storm.
  let stableTimer: ReturnType<typeof setTimeout> | null = null;
  const clearStable = (): void => { if (stableTimer) { clearTimeout(stableTimer); stableTimer = null; } };
  let client: MqttWsClient | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let matcher: ((f: string, t: string) => boolean) | null = null;

  const scheduleReconnect = (): void => {
    if (stopped || reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect();
    }, backoff);
    backoff = Math.min(backoff * 2, backoffMax);
  };

  const dispatchDirect = (topic: string, payloadString: string, payloadBytes?: Uint8Array): void => {
    if (!matcher) return;
    for (const [filter, cbs] of subs) {
      if (matcher(filter, topic)) {
        for (const cb of cbs) { try { cb({ topic, payloadString, payloadBytes }); } catch { /* consumer threw */ } }
      }
    }
  };

  const connect = async (): Promise<void> => {
    if (stopped) return;
    setStatus('connecting');
    let mine: MqttWsClient | null = null;
    try {
      const mod = await import('./mqtt-ws.js');
      if (stopped) return;
      matcher = mod.matchTopicFilter;
      // Retire any previous client before replacing it (its late onclose is
      // ignored by the identity guard below).
      if (client) { const old = client; client = null; try { old.close(); } catch { /* ignore */ } }
      const creds = readBrokerCreds();
      const c = new mod.MqttWsClient({
        url: buildBrokerUrl(cfg),
        clientId: 'diorama-' + Math.random().toString(16).slice(2, 10),
        username: creds.user,
        password: creds.pass,
        keepalive: 60,
        WebSocketCtor: cfg.WebSocketCtor,
      });
      client = c; mine = c;
      c.onMessage(m => { if (c === client) dispatchDirect(m.topic, m.payload, m.payloadBytes); });
      c.onStatus((s: MqttStatus) => {
        // A retired client's late 'closed' must not knock the CURRENT one down.
        if (stopped || c !== client) return;
        if (s === 'up') {
          setStatus('up');
          clearStable();
          stableTimer = setTimeout(() => { stableTimer = null; backoff = backoffBase; }, stableUpMs);
          for (const filter of subs.keys()) c.subscribe(filter);   // resubscribe everything
        } else if (s === 'error' || s === 'closed') {
          clearStable();                         // dropped before proving stable — keep backing off
          setStatus('error');
          scheduleReconnect();
        }
      });
      await c.connect();
    } catch {
      if (stopped || (mine && mine !== client)) return;
      setStatus('error');
      scheduleReconnect();
    }
  };

  void connect();

  return {
    subscribe(filter, cb) {
      let entry = subs.get(filter);
      const isNew = !entry;
      if (!entry) { entry = new Set(); subs.set(filter, entry); }
      entry.add(cb);
      if (isNew && client && status === 'up') client.subscribe(filter);
    },
    publish(topic, payload, retain) {
      if (client && status === 'up') client.publish(topic, payload, retain);
      // else drop — no offline queue in M-A; reconnect + resubscribe covers reads.
    },
    stop() {
      stopped = true;
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      clearStable();
      try { client?.close(); } catch { /* ignore */ }
      client = null;
      subs.clear();
      status = 'idle';
    },
    get status() { return status; },
  };
}
