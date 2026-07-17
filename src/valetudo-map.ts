// Valetudo MapData parsing (Phase 5, batch M-C). ISOLATED module — pure/zero
// imports (same discipline as geo.ts / trilateration.ts), so it stays testable
// headlessly and never drags three.js or the renderer into a chunk. The only
// non-pure surface is `decodeMapDataPayload`, which wraps the pure
// `parseValetudoMap` with an async decompression attempt.
//
// Wire shape (`<valetudoNs>/<id>/MapData/map-data`): the ValetudoMap JSON, EITHER
// raw (older senders / `provideMapData` plain) OR zlib-deflate-compressed. We try
// JSON.parse first, then native DecompressionStream in the order Valetudo most
// commonly emits: 'deflate' (zlib-wrapped, RFC 1950 — what Hypfer/Valetudo's
// backend produces via zlib.deflate), then 'gzip', then 'deflate-raw'. All-fail
// or unsupported browser → null (quiet give-up).
//
// ValetudoMap JSON (backend/lib/entities/map/ValetudoMap.js):
//   { pixelSize, size:{x,y}, metaData:{ nonce, version },
//     layers:[ { type:'segment'|'wall'|'floor'|…,
//                pixels|compressedPixels, metaData:{ segmentId?, name?, … } } ],
//     entities:[…] }
// A `segment` layer's geometry is a run-length pixel set:
//   compressedPixels: flat [xStart, y, count, xStart, y, count, …] — each triple
//     is a horizontal run of `count` pixels beginning at (xStart, y).
//   pixels:           flat [x, y, x, y, …] — individual pixel coords.
// (Verified against Hypfer/Valetudo MapLayer.js.) Pixel coords are in the map's
// own grid; multiply by pixelSize to reach the robot's raw map units, then feed
// the OWNING RobotFixture's vacuumRawToWorld calibration to reach Diorama mm.

export interface VacRun { x: number; y: number; count: number; }   // horizontal run: [x..x+count) at row y

export interface VacSegment {
  id: string;                 // segmentId (string)
  name: string;               // segment name (from metaData.name; '' when absent — caller may fall back to segments topic)
  runs: VacRun[];             // horizontal pixel runs (map-grid coords)
  pixelCount: number;         // total pixels in the segment
  bbox: { minX: number; minY: number; maxX: number; maxY: number };  // inclusive pixel bbox
  centroidPx: { x: number; y: number };   // pixel-space centroid (mean of pixel centers)
}

export interface ParsedVacMap {
  pixelSize: number;          // map units per pixel
  sizeX: number;              // map extent (units), best-effort
  sizeY: number;
  nonce: string;              // map-revision hint (metaData.nonce, else a content hash)
  segments: VacSegment[];
}

// Calibration params — the SAME fields RobotFixture already carries for the dock
// position (posScale/posOffsetX/Y/posFlipY/posRotDeg). Kept structurally
// identical to geometry.ts's VacuumCal so a RobotFixture passes directly.
export interface VacCal {
  posScale?: number; posOffsetX?: number; posOffsetY?: number;
  posFlipY?: boolean; posRotDeg?: number;
}

// Affine mapping a map PIXEL (px, py) → Diorama world mm:
//   worldX = A·px + C·py + E ; worldY = B·px + D·py + F
// Derived to be IDENTICAL to geometry.vacuumRawToWorld({x:px·pixelSize,
// y:py·pixelSize}, cal) — scale (with optional Y-flip) → rotate(posRotDeg) →
// translate(offset). Because vacuumRawToWorld is affine in the raw point, the
// whole pixel→world map is affine, so a segment's pixel bbox maps to a
// parallelogram we can texture with one quad / one setTransform.
export interface VacAffine { A: number; B: number; C: number; D: number; E: number; F: number; }
export function vacMapAffine(pixelSize: number, cal: VacCal): VacAffine {
  const scale = cal.posScale ?? 1;
  const k = pixelSize * scale;
  const fy = cal.posFlipY ? -1 : 1;
  const th = (cal.posRotDeg ?? 0) * Math.PI / 180;
  const c = Math.cos(th), s = Math.sin(th);
  return {
    A: c * k,        B: s * k,
    C: -s * k * fy,  D: c * k * fy,
    E: cal.posOffsetX ?? 0,
    F: cal.posOffsetY ?? 0,
  };
}
export function vacPixelToWorld(px: number, py: number, aff: VacAffine): { x: number; y: number } {
  return { x: aff.A * px + aff.C * py + aff.E, y: aff.B * px + aff.D * py + aff.F };
}
// Inverse: world mm → map pixel (for hit-testing a click against segment runs).
// Returns null on a degenerate (zero-determinant) transform.
export function vacWorldToPixel(wx: number, wy: number, aff: VacAffine): { x: number; y: number } | null {
  const det = aff.A * aff.D - aff.B * aff.C;
  if (Math.abs(det) < 1e-9) return null;
  const dx = wx - aff.E, dy = wy - aff.F;
  return { x: (aff.D * dx - aff.C * dy) / det, y: (-aff.B * dx + aff.A * dy) / det };
}
// Is integer pixel (px, py) covered by a run of this segment?
export function vacSegHasPixel(seg: VacSegment, px: number, py: number): boolean {
  if (px < seg.bbox.minX || px > seg.bbox.maxX || py < seg.bbox.minY || py > seg.bbox.maxY) return false;
  for (const r of seg.runs) if (r.y === py && px >= r.x && px < r.x + r.count) return true;
  return false;
}

// Deterministic per-segment color palette (indexed by segment order). Bright,
// well-separated hues so adjacent rooms read distinctly as translucent paint.
export const VAC_SEG_PALETTE = [
  '#4fc3f7', '#81c784', '#ffb74d', '#ba68c8', '#e57373',
  '#4db6ac', '#fff176', '#9575cd', '#f06292', '#a1887f',
  '#7986cb', '#aed581', '#ff8a65', '#4dd0e1', '#dce775',
];
export function vacSegColor(index: number): string {
  return VAC_SEG_PALETTE[((index % VAC_SEG_PALETTE.length) + VAC_SEG_PALETTE.length) % VAC_SEG_PALETTE.length];
}

// The command payload for MapSegmentationCapability/clean/set. Valetudo's MQTT
// handle (MapSegmentationCapabilityMqttHandle) parses a JSON object with a
// required `segment_ids` string array plus optional `iterations` (default 1) and
// `customOrder` (default true). We send the explicit full shape so a strict
// handler never rejects it.
export function cleanSegmentPayload(segmentIds: string | string[]): string {
  const ids = Array.isArray(segmentIds) ? segmentIds : [segmentIds];
  return JSON.stringify({ segment_ids: ids.map(String), iterations: 1, customOrder: false });
}

// ── Pure parse ──────────────────────────────────────────────────────────────
// Parse an already-decoded ValetudoMap JS object into ParsedVacMap. Deterministic;
// returns null on anything unrecognizable (never throws).
export function parseValetudoMap(json: unknown): ParsedVacMap | null {
  if (!json || typeof json !== 'object') return null;
  const m = json as Record<string, unknown>;
  const layers = m.layers;
  if (!Array.isArray(layers)) return null;
  const pixelSize = Number(m.pixelSize);
  const ps = isFinite(pixelSize) && pixelSize > 0 ? pixelSize : 5;   // Valetudo default is 5
  const size = (m.size ?? {}) as Record<string, unknown>;
  let sizeX = Number(size.x); let sizeY = Number(size.y);

  const segments: VacSegment[] = [];
  for (const layerU of layers) {
    if (!layerU || typeof layerU !== 'object') continue;
    const layer = layerU as Record<string, unknown>;
    if (layer.type !== 'segment') continue;
    const meta = (layer.metaData ?? {}) as Record<string, unknown>;
    const segId = meta.segmentId != null ? String(meta.segmentId) : '';
    if (!segId) continue;   // a segment layer with no id is unusable
    const runs = decodeRuns(layer);
    if (!runs.length) continue;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0, n = 0;
    for (const r of runs) {
      const x0 = r.x, x1 = r.x + r.count - 1;
      if (x0 < minX) minX = x0;
      if (x1 > maxX) maxX = x1;
      if (r.y < minY) minY = r.y;
      if (r.y > maxY) maxY = r.y;
      // Sum of pixel-center X over the run: count·(x0 + x1 + 1)/2 → use cell centers (+0.5).
      sumX += r.count * (x0 + x1 + 1) / 2;
      sumY += r.count * (r.y + 0.5);
      n += r.count;
    }
    if (!n) continue;
    segments.push({
      id: segId,
      name: typeof meta.name === 'string' ? meta.name : '',
      runs,
      pixelCount: n,
      bbox: { minX, minY, maxX, maxY },
      centroidPx: { x: sumX / n, y: sumY / n },
    });
  }
  if (!segments.length) return null;

  // Fill missing size from segment extents so downstream code always has a grid.
  if (!isFinite(sizeX) || sizeX <= 0) {
    let mx = 0; for (const s of segments) mx = Math.max(mx, s.bbox.maxX + 1);
    sizeX = mx * ps;
  }
  if (!isFinite(sizeY) || sizeY <= 0) {
    let my = 0; for (const s of segments) my = Math.max(my, s.bbox.maxY + 1);
    sizeY = my * ps;
  }

  const nonceRaw = (m.metaData as Record<string, unknown> | undefined)?.nonce;
  const nonce = nonceRaw != null ? String(nonceRaw) : contentHash(segments);
  return { pixelSize: ps, sizeX, sizeY, nonce, segments };
}

// Normalize a segment layer's compressedPixels / pixels into horizontal runs.
function decodeRuns(layer: Record<string, unknown>): VacRun[] {
  const cp = layer.compressedPixels;
  if (Array.isArray(cp) && cp.length >= 3) {
    const out: VacRun[] = [];
    for (let i = 0; i + 2 < cp.length; i += 3) {
      const x = Number(cp[i]), y = Number(cp[i + 1]), count = Number(cp[i + 2]);
      if (!isFinite(x) || !isFinite(y) || !isFinite(count) || count <= 0) continue;
      out.push({ x, y, count });
    }
    return out;
  }
  const px = layer.pixels;
  if (Array.isArray(px) && px.length >= 2) {
    // Flat [x,y,x,y,…] → coalesce consecutive same-row, adjacent-x pixels into runs.
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i + 1 < px.length; i += 2) {
      const x = Number(px[i]), y = Number(px[i + 1]);
      if (isFinite(x) && isFinite(y)) pts.push({ x, y });
    }
    pts.sort((a, b) => (a.y - b.y) || (a.x - b.x));
    const out: VacRun[] = [];
    for (const p of pts) {
      const last = out[out.length - 1];
      if (last && last.y === p.y && p.x === last.x + last.count) last.count++;
      else out.push({ x: p.x, y: p.y, count: 1 });
    }
    return out;
  }
  return [];
}

// Cheap deterministic content hash (djb2 over segment ids + run geometry) — a
// stand-in map revision when the payload carries no nonce.
function contentHash(segments: VacSegment[]): string {
  let h = 5381;
  for (const s of segments) {
    for (let i = 0; i < s.id.length; i++) h = ((h << 5) + h + s.id.charCodeAt(i)) | 0;
    h = ((h << 5) + h + s.pixelCount) | 0;
    h = ((h << 5) + h + s.bbox.minX * 31 + s.bbox.minY) | 0;
  }
  return (h >>> 0).toString(16);
}

// ── Async decode wrapper ─────────────────────────────────────────────────────
// Try to turn an MQTT payload string into a ParsedVacMap. Order: plain JSON,
// then deflate / gzip / deflate-raw decompression (best-effort). Any failure
// short of a successful parse yields null — never throws.
export async function decodeMapDataPayload(payloadString: string): Promise<ParsedVacMap | null> {
  // 1) Plain JSON (uncompressed sender / test fixtures).
  const direct = tryParseJson(payloadString);
  if (direct) { const p = parseValetudoMap(direct); if (p) return p; }

  // 2) Compressed. MQTT delivers bytes; the transport handed us a string, so
  //    reconstruct the byte view latin1-style (each char is one byte).
  const bytes = stringToBytes(payloadString);
  const DS = (globalThis as { DecompressionStream?: typeof DecompressionStream }).DecompressionStream;
  if (!DS || !bytes.length) return null;
  for (const fmt of ['deflate', 'gzip', 'deflate-raw'] as const) {
    try {
      const text = await inflate(bytes, fmt, DS);
      const obj = tryParseJson(text);
      if (obj) { const p = parseValetudoMap(obj); if (p) return p; }
    } catch { /* try next format */ }
  }
  return null;
}

function tryParseJson(s: string): unknown | null {
  const t = s.trim();
  if (!t || (t[0] !== '{' && t[0] !== '[')) return null;
  try { return JSON.parse(t); } catch { return null; }
}

function stringToBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

async function inflate(
  bytes: Uint8Array, fmt: 'deflate' | 'gzip' | 'deflate-raw', DS: typeof DecompressionStream,
): Promise<string> {
  const stream = new DS(fmt);
  const writer = stream.writable.getWriter();
  void writer.write(bytes as unknown as BufferSource);
  void writer.close();
  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  let total = 0; for (const c of chunks) total += c.length;
  const merged = new Uint8Array(total);
  let off = 0; for (const c of chunks) { merged.set(c, off); off += c.length; }
  return new TextDecoder().decode(merged);
}
