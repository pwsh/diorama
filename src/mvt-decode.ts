// Minimal Mapbox Vector Tile (MVT 2.1) protobuf decoder — the neighborhood
// overlay's leaf wire-format codec (OpenFreeMap serves unmodified OpenMapTiles
// vector tiles as protobuf .pbf bytes).
//
// ISOLATION: ZERO imports, standalone-transpilable (esbuild --format=esm, no
// --bundle), exactly like mqtt-ws.ts / geo.ts. It touches no DOM / window /
// three.js and MUST run headless under node for the test page.
//
// DISCIPLINE (mqtt-ws.ts decodePackets contract): NEVER THROWS. A malformed /
// truncated / non-tile buffer yields an empty (or partial) result — an unknown
// protobuf field is skipped by its wire type, a byte-cursor overrun aborts the
// current sub-message and returns what was already decoded. Callers get {} /
// [] and carry on.
//
// Wire format needed (verified against the official 2.1 vector_tile.proto):
//   Tile         { repeated Layer layers = 3 }
//   Layer        { string name=1; repeated Feature features=2;
//                  repeated string keys=3; repeated Value values=4;
//                  uint32 extent=5 [default=4096]; uint32 version=15 }
//   Feature      { uint64 id=1; repeated uint32 tags=2 [packed];
//                  GeomType type=3; repeated uint32 geometry=4 [packed] }
//   Value        { string=1; float=2; double=3; int64=4; uint64=5; sint64=6; bool=7 }
//   GeomType     { UNKNOWN=0; POINT=1; LINESTRING=2; POLYGON=3 }
// Protobuf wire types: 0 varint, 1 fixed64, 2 length-delimited, 5 fixed32.

export type MvtGeomType = 'point' | 'line' | 'polygon' | 'unknown';

export interface MvtFeature {
  id: number;
  type: MvtGeomType;
  tags: Record<string, string | number | boolean>;
  // One entry per ring (polygon) / line (linestring). Vertices are in
  // tile-LOCAL 0..extent integer coords, already cursor-integrated (absolute,
  // not delta-encoded). Points come through as one-vertex rings.
  geometry: Array<Array<{ x: number; y: number }>>;
}

export interface MvtLayer {
  name: string;
  extent: number;
  features: MvtFeature[];
}

export interface DecodedTile {
  layers: Record<string, MvtLayer>;
}

// ── Byte-cursor protobuf reader ─────────────────────────────────────────────
// Throws a plain Error on an out-of-range read; every boundary that walks a
// sub-message catches it so the public API never throws.
class Reader {
  buf: Uint8Array;
  pos: number;
  len: number;
  private _dv: DataView;
  constructor(buf: Uint8Array) {
    this.buf = buf;
    this.pos = 0;
    this.len = buf.length;
    this._dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  // Unsigned varint → JS number. Exact to 2^53; higher bits (rare — 64-bit ids)
  // silently lose precision, which nothing here depends on.
  varint(): number {
    let result = 0, shift = 0, b: number;
    do {
      if (this.pos >= this.len) throw new Error('eof');
      b = this.buf[this.pos++];
      if (shift < 28) result |= (b & 0x7f) << shift;
      else result += (b & 0x7f) * Math.pow(2, shift);
      shift += 7;
      // Guard a runaway varint (malformed) — 10 bytes is the 64-bit max.
      if (shift > 70) throw new Error('varint');
    } while (b & 0x80);
    // The low-28-bit path ORed into a signed int32; coerce back to unsigned.
    return result < 0 ? result >>> 0 : result;
  }
  float(): number {
    if (this.pos + 4 > this.len) throw new Error('eof');
    const v = this._dv.getFloat32(this.pos, true);
    this.pos += 4;
    return v;
  }
  double(): number {
    if (this.pos + 8 > this.len) throw new Error('eof');
    const v = this._dv.getFloat64(this.pos, true);
    this.pos += 8;
    return v;
  }
  // A length-delimited field's byte slice.
  bytes(): Uint8Array {
    const l = this.varint();
    if (this.pos + l > this.len) throw new Error('eof');
    const out = this.buf.subarray(this.pos, this.pos + l);
    this.pos += l;
    return out;
  }
  string(): string {
    return utf8(this.bytes());
  }
  // Skip one field's payload given its wire type.
  skip(wire: number): void {
    if (wire === 0) this.varint();
    else if (wire === 1) { if (this.pos + 8 > this.len) throw new Error('eof'); this.pos += 8; }
    else if (wire === 2) { const l = this.varint(); if (this.pos + l > this.len) throw new Error('eof'); this.pos += l; }
    else if (wire === 5) { if (this.pos + 4 > this.len) throw new Error('eof'); this.pos += 4; }
    else throw new Error('wire'); // unknown wire type → abort this sub-message
  }
}

function utf8(bytes: Uint8Array): string {
  try {
    // TextDecoder is available in browsers + node; fall back to a manual pass.
    if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(bytes);
  } catch { /* fall through */ }
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

function zigzag(n: number): number {
  return (n >>> 1) ^ -(n & 1);
}

// ── Value decode ────────────────────────────────────────────────────────────
function decodeValue(bytes: Uint8Array): string | number | boolean {
  const r = new Reader(bytes);
  let out: string | number | boolean = '';
  while (r.pos < r.len) {
    const tag = r.varint();
    const field = tag >> 3, wire = tag & 7;
    try {
      switch (field) {
        case 1: out = r.string(); break;
        case 2: out = r.float(); break;
        case 3: out = r.double(); break;
        case 4: out = r.varint(); break;                 // int64
        case 5: out = r.varint(); break;                 // uint64
        case 6: out = zigzag(r.varint()); break;         // sint64
        case 7: out = r.varint() !== 0; break;           // bool
        default: r.skip(wire); break;
      }
    } catch { break; }
  }
  return out;
}

// ── Geometry command-stream decode ──────────────────────────────────────────
// The packed uint32 command array → rings/lines of absolute tile-local coords.
// commandInteger = (id & 0x7) | (count << 3); id 1=MoveTo, 2=LineTo, 7=Close.
function decodeGeometry(cmds: number[], type: MvtGeomType): Array<Array<{ x: number; y: number }>> {
  const out: Array<Array<{ x: number; y: number }>> = [];
  let cur: Array<{ x: number; y: number }> | null = null;
  let x = 0, y = 0;
  let i = 0;
  while (i < cmds.length) {
    const cmd = cmds[i++];
    const id = cmd & 0x7;
    const count = cmd >> 3;
    if (id === 1) {
      // MoveTo: starts a new ring/line. Each MoveTo param begins its own run.
      for (let k = 0; k < count; k++) {
        if (i + 2 > cmds.length) break;
        x += zigzag(cmds[i++]);
        y += zigzag(cmds[i++]);
        cur = [{ x, y }];
        out.push(cur);
      }
    } else if (id === 2) {
      // LineTo: extend the current run.
      if (!cur) { cur = [{ x, y }]; out.push(cur); }
      for (let k = 0; k < count; k++) {
        if (i + 2 > cmds.length) break;
        x += zigzag(cmds[i++]);
        y += zigzag(cmds[i++]);
        cur.push({ x, y });
      }
    } else if (id === 7) {
      // ClosePath: polygon ring closes back to its MoveTo (implicit — we leave
      // the ring open; consumers close it / use signed area).
      cur = null;
    } else {
      break; // unknown command → stop
    }
  }
  // POINT geometry: each MoveTo param is a standalone point (already one-vertex runs).
  if (type === 'point') return out.filter(r => r.length >= 1);
  return out.filter(r => r.length >= 2);
}

// ── Feature decode (needs the layer's keys/values already collected) ─────────
function decodeFeature(bytes: Uint8Array, keys: string[], values: Array<string | number | boolean>): MvtFeature | null {
  const r = new Reader(bytes);
  let id = 0;
  let type: MvtGeomType = 'unknown';
  let tagsRaw: number[] = [];
  let geomRaw: number[] = [];
  try {
    while (r.pos < r.len) {
      const tag = r.varint();
      const field = tag >> 3, wire = tag & 7;
      if (field === 1 && wire === 0) id = r.varint();
      else if (field === 2 && wire === 2) tagsRaw = readPackedVarints(r);
      else if (field === 2 && wire === 0) tagsRaw.push(r.varint());
      else if (field === 3 && wire === 0) {
        const t = r.varint();
        type = t === 1 ? 'point' : t === 2 ? 'line' : t === 3 ? 'polygon' : 'unknown';
      } else if (field === 4 && wire === 2) geomRaw = readPackedVarints(r);
      else if (field === 4 && wire === 0) geomRaw.push(r.varint());
      else r.skip(wire);
    }
  } catch { /* return whatever decoded */ }

  const tags: Record<string, string | number | boolean> = {};
  for (let k = 0; k + 1 < tagsRaw.length; k += 2) {
    const ki = tagsRaw[k], vi = tagsRaw[k + 1];
    const key = keys[ki];
    if (key === undefined) continue;
    const val = values[vi];
    if (val === undefined) continue;
    tags[key] = val;
  }
  let geometry: Array<Array<{ x: number; y: number }>> = [];
  try { geometry = decodeGeometry(geomRaw, type); } catch { geometry = []; }
  return { id, type, tags, geometry };
}

// Read a packed repeated-varint field (length-delimited) into a number[].
function readPackedVarints(r: Reader): number[] {
  const slice = r.bytes();
  const inner = new Reader(slice);
  const out: number[] = [];
  while (inner.pos < inner.len) {
    try { out.push(inner.varint()); } catch { break; }
  }
  return out;
}

// ── Layer decode ────────────────────────────────────────────────────────────
function decodeLayer(bytes: Uint8Array): MvtLayer | null {
  const r = new Reader(bytes);
  let name = '';
  let extent = 4096;
  const keys: string[] = [];
  const values: Array<string | number | boolean> = [];
  const featureSlices: Uint8Array[] = [];
  try {
    while (r.pos < r.len) {
      const tag = r.varint();
      const field = tag >> 3, wire = tag & 7;
      if (field === 1 && wire === 2) name = r.string();
      else if (field === 2 && wire === 2) featureSlices.push(r.bytes());
      else if (field === 3 && wire === 2) keys.push(r.string());
      else if (field === 4 && wire === 2) values.push(decodeValue(r.bytes()));
      else if (field === 5 && wire === 0) extent = r.varint();
      else r.skip(wire);
    }
  } catch { /* keep what decoded so far */ }
  if (!name) return null;
  const features: MvtFeature[] = [];
  for (const fs of featureSlices) {
    const f = decodeFeature(fs, keys, values);
    if (f) features.push(f);
  }
  return { name, extent: extent || 4096, features };
}

// ── Public API ──────────────────────────────────────────────────────────────
// Decode a whole tile. Never throws — garbage / truncated / empty input yields
// { layers: {} }. Layer name collisions keep the first (spec disallows dupes).
export function decodeTile(bytes: Uint8Array): DecodedTile {
  const out: DecodedTile = { layers: {} };
  if (!bytes || bytes.length === 0) return out;
  const r = new Reader(bytes);
  try {
    while (r.pos < r.len) {
      const tag = r.varint();
      const field = tag >> 3, wire = tag & 7;
      if (field === 3 && wire === 2) {
        const slice = r.bytes();
        const layer = decodeLayer(slice);
        if (layer && !(layer.name in out.layers)) out.layers[layer.name] = layer;
      } else {
        r.skip(wire);
      }
    }
  } catch { /* return whatever decoded before the fault */ }
  return out;
}

// Array convenience (research shape) — the same decode, layers as a list.
export function decodeTileLayers(bytes: Uint8Array): MvtLayer[] {
  return Object.values(decodeTile(bytes).layers);
}
