// MQTT 3.1.1 packet codec + a tiny browser client over native WebSocket.
// Phase 5 "direct-MQTT bridge" (Path B) — the fallback transport when the panel
// user isn't an HA admin (Path A rides HA's own `mqtt/subscribe` WS command,
// see mqtt-bridge.ts). Hand-rolled instead of pulling in mqtt.js so the chunk
// stays small; QoS 0 only, clean session, no persistent session.
//
// ISOLATION: this module has ZERO imports. The codec half (encode*/decode*/
// matchTopicFilter) is pure and MUST run under node for the test page — it
// touches no `window`/`document`/`WebSocket` at module scope. Only the
// MqttWsClient class references WebSocket, and only inside its methods, so the
// codec can be esbuild-transpiled and unit-tested headlessly. mqtt-bridge.ts
// lazy-`import()`s this file only when `mode === 'direct'`, keeping it out of
// the startup graph entirely (like the three.js chunk).

// ── Control packet types (MQTT 3.1.1 §2.1) ──────────────────────────────────
const PKT_CONNECT = 1;
const PKT_CONNACK = 2;
const PKT_PUBLISH = 3;
const PKT_SUBSCRIBE = 8;
const PKT_SUBACK = 9;
const PKT_PINGREQ = 12;
const PKT_PINGRESP = 13;
const PKT_DISCONNECT = 14;

// ── Low-level encode helpers ────────────────────────────────────────────────

// Remaining Length variable byte integer (MQTT §2.2.3). Encodes 0..268435455
// into 1–4 bytes, 7 bits per byte + continuation flag.
export function encodeRemainingLength(len: number): number[] {
  const out: number[] = [];
  let x = Math.max(0, Math.floor(len));
  do {
    let b = x % 128;
    x = Math.floor(x / 128);
    if (x > 0) b |= 0x80;
    out.push(b);
  } while (x > 0);
  return out;
}

// Push a length-prefixed UTF-8 string (2-byte big-endian length + bytes).
function pushString(arr: number[], bytes: Uint8Array): void {
  arr.push((bytes.length >> 8) & 0xff, bytes.length & 0xff);
  for (let i = 0; i < bytes.length; i++) arr.push(bytes[i]);
}

// Assemble a full packet: fixed-header first byte + remaining-length varint + body.
function assemble(firstByte: number, body: number[]): Uint8Array {
  const rl = encodeRemainingLength(body.length);
  const out = new Uint8Array(1 + rl.length + body.length);
  out[0] = firstByte;
  out.set(rl, 1);
  out.set(body, 1 + rl.length);
  return out;
}

// ── Encoders ────────────────────────────────────────────────────────────────

export interface ConnectOptions {
  clientId: string;
  username?: string;
  password?: string;
  keepalive?: number;   // seconds; default 60, clamped 0..65535
}

// CONNECT (MQTT §3.1). Clean session always set; optional username/password.
// No will message. Protocol level 4 (3.1.1).
export function encodeConnect(opts: ConnectOptions): Uint8Array {
  const enc = new TextEncoder();
  const hasUser = opts.username != null && opts.username !== '';
  const hasPass = opts.password != null && opts.password !== '';
  const keepalive = Math.max(0, Math.min(65535, Math.floor(opts.keepalive ?? 60)));

  let flags = 0x02; // clean session
  if (hasUser) flags |= 0x80;
  if (hasPass) flags |= 0x40;

  const body: number[] = [];
  pushString(body, enc.encode('MQTT'));   // protocol name
  body.push(0x04);                        // protocol level (3.1.1)
  body.push(flags);
  body.push((keepalive >> 8) & 0xff, keepalive & 0xff);
  // Payload: client id, then username, then password (order matters).
  pushString(body, enc.encode(opts.clientId ?? ''));
  if (hasUser) pushString(body, enc.encode(opts.username!));
  if (hasPass) pushString(body, enc.encode(opts.password!));

  return assemble(PKT_CONNECT << 4, body);
}

// SUBSCRIBE (MQTT §3.8). Fixed-header flags MUST be 0b0010. QoS 0 for every
// filter. `id` is the packet identifier echoed in the SUBACK.
export function encodeSubscribe(id: number, filters: string[]): Uint8Array {
  const enc = new TextEncoder();
  const body: number[] = [];
  body.push((id >> 8) & 0xff, id & 0xff);
  for (const f of filters) {
    pushString(body, enc.encode(f));
    body.push(0x00);   // requested QoS 0
  }
  return assemble((PKT_SUBSCRIBE << 4) | 0x02, body);
}

// PUBLISH (MQTT §3.3), QoS 0 (no packet identifier). Payload may be a UTF-8
// string or raw bytes (binary-safe). `retain` sets the retain flag.
export function encodePublish(
  topic: string, payload: string | Uint8Array, retain = false,
): Uint8Array {
  const enc = new TextEncoder();
  const body: number[] = [];
  pushString(body, enc.encode(topic));
  const pl = typeof payload === 'string' ? enc.encode(payload) : payload;
  for (let i = 0; i < pl.length; i++) body.push(pl[i]);
  const firstByte = (PKT_PUBLISH << 4) | (retain ? 0x01 : 0);   // dup=0, qos=0
  return assemble(firstByte, body);
}

export function encodePingReq(): Uint8Array {
  return Uint8Array.from([PKT_PINGREQ << 4, 0x00]);
}
export function encodeDisconnect(): Uint8Array {
  return Uint8Array.from([PKT_DISCONNECT << 4, 0x00]);
}

// ── Decoders ────────────────────────────────────────────────────────────────

export interface ConnackPacket { type: 'connack'; sessionPresent: boolean; returnCode: number; }
export interface SubackPacket { type: 'suback'; packetId: number; returnCodes: number[]; }
export interface PublishPacket {
  type: 'publish'; topic: string; payload: Uint8Array;
  qos: number; retain: boolean; dup: boolean;
}
export interface PingrespPacket { type: 'pingresp'; }
export interface OtherPacket { type: 'other'; packetType: number; }
export interface ErrorPacket { type: 'error'; error: string; }
export type MqttPacket =
  | ConnackPacket | SubackPacket | PublishPacket
  | PingrespPacket | OtherPacket | ErrorPacket;

function decodeBody(
  packetType: number, flags: number, body: Uint8Array, dec: TextDecoder,
): MqttPacket {
  switch (packetType) {
    case PKT_CONNACK: {
      const sessionPresent = body.length > 0 ? (body[0] & 0x01) === 1 : false;
      const returnCode = body.length > 1 ? body[1] : -1;
      return { type: 'connack', sessionPresent, returnCode };
    }
    case PKT_SUBACK: {
      const packetId = body.length >= 2 ? (body[0] << 8) | body[1] : -1;
      const returnCodes = Array.from(body.subarray(2));
      return { type: 'suback', packetId, returnCodes };
    }
    case PKT_PUBLISH: {
      const retain = (flags & 0x01) === 1;
      const qos = (flags >> 1) & 0x03;
      const dup = (flags & 0x08) === 0x08;
      if (body.length < 2) throw new Error('short publish header');
      const topicLen = (body[0] << 8) | body[1];
      let p = 2 + topicLen;
      if (p > body.length) throw new Error('topic length overruns packet');
      const topic = dec.decode(body.subarray(2, p));
      if (qos > 0) {
        if (p + 2 > body.length) throw new Error('missing packet identifier');
        p += 2;   // skip packet id (QoS > 0)
      }
      // .slice copies — the returned payload owns its bytes independent of the rx buffer.
      const payload = body.slice(p);
      return { type: 'publish', topic, payload, qos, retain, dup };
    }
    case PKT_PINGRESP:
      return { type: 'pingresp' };
    default:
      // CONNECT/SUBSCRIBE/PUBACK/UNSUB* etc. — not expected inbound; skip gracefully.
      return { type: 'other', packetType };
  }
}

// Incrementally decode as many whole packets as are buffered. Returns the parsed
// packets plus the `rest` — bytes of a partial trailing packet to prepend to the
// next chunk. NEVER throws: an over-long remaining-length varint yields a single
// `error` packet and drops the (unresyncable) rest; a per-packet body decode
// failure yields an `error` packet but still advances past that packet so the
// stream continues.
export function decodePackets(buffer: Uint8Array): { packets: MqttPacket[]; rest: Uint8Array } {
  const packets: MqttPacket[] = [];
  const dec = new TextDecoder();
  let off = 0;
  while (off < buffer.length) {
    const firstByte = buffer[off];
    // Remaining-length varint starting at off+1.
    let multiplier = 1, value = 0, i = off + 1, bytes = 0;
    let incomplete = false, malformed = false;
    for (;;) {
      if (i >= buffer.length) { incomplete = true; break; }
      const b = buffer[i];
      value += (b & 0x7f) * multiplier;
      multiplier *= 128;
      i++; bytes++;
      if ((b & 0x80) === 0) break;
      if (bytes >= 4) { malformed = true; break; }   // >4 continuation bytes = protocol violation
    }
    if (incomplete) break;              // need more data — leave this packet in rest
    if (malformed) {
      packets.push({ type: 'error', error: 'malformed remaining length' });
      off = buffer.length;             // cannot reliably resync — drop the rest
      break;
    }
    const headerLen = 1 + bytes;
    const total = headerLen + value;
    if (off + total > buffer.length) break;   // body not fully arrived yet
    const body = buffer.subarray(off + headerLen, off + total);
    try {
      packets.push(decodeBody(firstByte >> 4, firstByte & 0x0f, body, dec));
    } catch (e) {
      packets.push({ type: 'error', error: 'decode failed: ' + (e as Error).message });
    }
    off += total;
  }
  return { packets, rest: buffer.slice(off) };
}

// ── Topic-filter matching (MQTT §4.7) ───────────────────────────────────────
// Practical subset:
//   • `+`  matches exactly ONE topic level.
//   • `#`  matches zero-or-more remaining levels; MUST be the last character of
//          the filter (a `#` that isn't the final level = invalid → no match).
//          `sport/#` matches the parent `sport` too (spec §4.7.1.2).
//   • `$`  topics (e.g. `$SYS/...`) are excluded from filters whose FIRST level
//          is a wildcard (`#` or `+`) — spec §4.7.2.
// Non-wildcard levels compare literally. Empty levels are compared as-is.
export function matchTopicFilter(filter: string, topic: string): boolean {
  if (filter === topic) return true;   // fast exact path (also covers wildcard-free)
  const f = filter.split('/');
  const t = topic.split('/');

  // A '#' is only a wildcard as the final level; reject a misplaced one.
  const hashIdx = f.indexOf('#');
  if (hashIdx !== -1 && hashIdx !== f.length - 1) return false;

  // $-topic guard: a first-level wildcard never matches a $-prefixed topic.
  if (topic.startsWith('$') && (f[0] === '#' || f[0] === '+')) return false;

  for (let i = 0; i < f.length; i++) {
    const fp = f[i];
    if (fp === '#') return true;                  // absorbs the remainder (incl. none)
    if (i >= t.length) return false;              // filter longer than topic, no '#'
    if (fp === '+') continue;                      // single-level wildcard
    if (fp !== t[i]) return false;
  }
  return f.length === t.length;                    // all levels consumed exactly
}

// ── Browser client over native WebSocket (Path B transport) ─────────────────

export type MqttStatus = 'connecting' | 'up' | 'error' | 'closed';

export interface MqttWsOptions {
  url: string;                    // ws:// or wss:// broker URL
  clientId: string;
  username?: string;
  password?: string;
  keepalive?: number;             // seconds; default 60
  connectTimeoutMs?: number;      // default 10000
  // Injectable WebSocket constructor (native default). The bridge test passes a
  // scripted fake here; production leaves it undefined → global WebSocket.
  WebSocketCtor?: typeof WebSocket;
}

// Minimal MQTT-over-WebSocket client. QoS 0, clean session. Handshake +
// keepalive only — RECONNECT IS NOT THIS CLASS'S JOB (mqtt-bridge.ts owns the
// backoff and re-subscribe). Delivers decoded PUBLISHes via onMessage; surfaces
// lifecycle via onStatus.
export class MqttWsClient {
  private _opts: MqttWsOptions;
  private _ws: WebSocket | null = null;
  private _rx: Uint8Array = new Uint8Array(0);
  private _packetId = 1;
  private _keepaliveTimer: ReturnType<typeof setInterval> | null = null;
  private _connectTimer: ReturnType<typeof setTimeout> | null = null;
  private _connectResolve: (() => void) | undefined;
  private _connectReject: ((e: Error) => void) | undefined;
  private _onMessage: ((m: { topic: string; payload: string }) => void) | undefined;
  private _onStatus: ((s: MqttStatus) => void) | undefined;
  private _status: MqttStatus = 'connecting';
  private _dec = new TextDecoder();
  private _closed = false;

  constructor(opts: MqttWsOptions) { this._opts = opts; }

  onMessage(cb: (m: { topic: string; payload: string }) => void): void { this._onMessage = cb; }
  onStatus(cb: (s: MqttStatus) => void): void { this._onStatus = cb; }
  get status(): MqttStatus { return this._status; }

  // Open the socket, send CONNECT, resolve on a successful CONNACK. Rejects on
  // timeout, a refused CONNACK, or an early close.
  connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._connectResolve = resolve;
      this._connectReject = reject;
      const WS = this._opts.WebSocketCtor
        ?? (typeof WebSocket !== 'undefined' ? WebSocket : undefined);
      if (!WS) { this._settleReject(new Error('WebSocket unavailable')); return; }
      this._setStatus('connecting');
      let ws: WebSocket;
      try { ws = new WS(this._opts.url, 'mqtt'); }
      catch (e) { this._settleReject(e as Error); return; }
      this._ws = ws;
      try { ws.binaryType = 'arraybuffer'; } catch { /* fake sockets may lack it */ }
      this._connectTimer = setTimeout(
        () => this._fail(new Error('connect timeout')),
        this._opts.connectTimeoutMs ?? 10000,
      );
      ws.onopen = () => {
        this._send(encodeConnect({
          clientId: this._opts.clientId,
          username: this._opts.username,
          password: this._opts.password,
          keepalive: this._opts.keepalive ?? 60,
        }));
      };
      ws.onmessage = (ev: MessageEvent) => this._onWsData(ev.data);
      ws.onerror = () => { /* onclose does the teardown */ };
      ws.onclose = () => {
        this._clearTimers();
        this._setStatus('closed');
        // A close before CONNACK is a connect failure.
        if (this._connectReject) this._settleReject(new Error('closed before CONNACK'));
      };
    });
  }

  subscribe(filter: string): void {
    this._send(encodeSubscribe(this._nextId(), [filter]));
  }
  publish(topic: string, payload: string | Uint8Array, retain = false): void {
    this._send(encodePublish(topic, payload, retain));
  }

  close(): void {
    this._closed = true;
    this._clearTimers();
    try { this._send(encodeDisconnect()); } catch { /* ignore */ }
    try { this._ws?.close(); } catch { /* ignore */ }
    this._ws = null;
  }

  // ── internals ──
  private _onWsData(data: unknown): void {
    const chunk = data instanceof Uint8Array
      ? data
      : new Uint8Array(data as ArrayBuffer);
    // Append to the rx carry-over, decode whole packets, keep the partial rest.
    const merged = new Uint8Array(this._rx.length + chunk.length);
    merged.set(this._rx, 0);
    merged.set(chunk, this._rx.length);
    const { packets, rest } = decodePackets(merged);
    this._rx = rest;
    for (const p of packets) this._handle(p);
  }

  private _handle(p: MqttPacket): void {
    switch (p.type) {
      case 'connack':
        this._clearConnectTimer();
        if (p.returnCode === 0) {
          this._setStatus('up');
          this._startKeepalive();
          this._settleResolve();
        } else {
          this._fail(new Error('CONNACK refused, code ' + p.returnCode));
        }
        break;
      case 'publish':
        try { this._onMessage?.({ topic: p.topic, payload: this._dec.decode(p.payload) }); }
        catch { /* consumer threw — never break the socket loop */ }
        break;
      case 'pingresp':
      case 'suback':
      case 'other':
      case 'error':
      default:
        break;   // nothing actionable
    }
  }

  private _send(bytes: Uint8Array): void {
    // Every packet is built over a plain ArrayBuffer (`new Uint8Array(n)`);
    // TS 6's dom lib narrows WebSocket.send to ArrayBufferView<ArrayBuffer>,
    // so restate that fact here rather than re-typing every encoder.
    try { this._ws?.send(bytes as Uint8Array<ArrayBuffer>); } catch { /* socket not open */ }
  }
  private _nextId(): number {
    const id = this._packetId;
    this._packetId = this._packetId >= 0xffff ? 1 : this._packetId + 1;
    return id;
  }
  private _startKeepalive(): void {
    const ka = this._opts.keepalive ?? 60;
    if (ka <= 0) return;
    this._clearKeepalive();
    this._keepaliveTimer = setInterval(() => this._send(encodePingReq()), ka * 1000);
  }
  private _fail(err: Error): void {
    this._clearTimers();
    this._setStatus('error');
    this._settleReject(err);
    try { this._ws?.close(); } catch { /* ignore */ }
  }
  private _setStatus(s: MqttStatus): void {
    this._status = s;
    try { this._onStatus?.(s); } catch { /* ignore */ }
  }
  private _settleResolve(): void {
    const r = this._connectResolve;
    this._connectResolve = undefined; this._connectReject = undefined;
    r?.();
  }
  private _settleReject(err: Error): void {
    const r = this._connectReject;
    this._connectResolve = undefined; this._connectReject = undefined;
    r?.(err);
  }
  private _clearTimers(): void { this._clearConnectTimer(); this._clearKeepalive(); }
  private _clearConnectTimer(): void {
    if (this._connectTimer) { clearTimeout(this._connectTimer); this._connectTimer = null; }
  }
  private _clearKeepalive(): void {
    if (this._keepaliveTimer) { clearInterval(this._keepaliveTimer); this._keepaliveTimer = null; }
  }
}
