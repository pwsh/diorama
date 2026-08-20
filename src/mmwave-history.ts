// mmWave presence history — the PURE data layer (design doc §E).
//
// PURE + deterministic + ZERO imports — the geo.ts / trilateration.ts /
// flights.ts idiom. No DOM, no IndexedDB, no `Date.now()` ANYWHERE: every
// function that needs the clock takes the epoch from its caller. That is a hard
// rule in this codebase because it is what makes results reproducible and
// testable (test-pages/mmwave-history-test.html transpiles this single file
// with `esbuild --format=esm`, no --bundle, and asserts against synthetic
// ground truth).
//
// WHAT THIS RECORDS — and what it deliberately does not
// ────────────────────────────────────────────────────
// Design §E: aggregate, don't log. Per-sample trajectory logging at 2–10 Hz per
// target is 1.5–7.6 GB/month and unbounded. Instead we accumulate DWELL SECONDS
// PER GRID CELL, so storage is a function of *cells touched*, not sample rate —
// identical whether the radar pushes at 2 Hz or 10 Hz.
//
// Weighting is by dwell SECONDS, never visit count: standing somewhere must
// read hotter than walking through it (design §E, "Selective display").
//
// PRIVACY (design §F) — structural properties this module upholds:
//  • There is deliberately NO "serialize all history to JSON" helper here. The
//    only serialization is the per-record sparse encoding consumed by
//    history-store.ts (device-local IndexedDB). History must never reach the
//    synced Store, a config export envelope, or switchConfig.
//  • Retention is expressed as an ACTIVE DELETE selector (expiredHistoryKeys),
//    not a read-time staleness filter. "The UI won't show it" does not satisfy
//    an erase expectation.

// ── Grid ────────────────────────────────────────────────────────────────────
// 200 mm, deliberately NOT the 150 mm nav grid (design §E): that constant is
// tuned for collision precision against furniture and may change for pathing
// reasons, which must never silently reshape already-stored history. 200 mm
// also roughly matches LD2450's real positional noise — finer just renders
// jitter as texture.
export const PRESENCE_CELL_MM = 200;

// Sampling / flush cadence the recorder is expected to use (design §E). Exported
// as data so the wiring layer and this module's docs cannot disagree.
export const PRESENCE_SAMPLE_MS = 1000; // ~1 Hz sample of the RAW LerpSlot goal
export const PRESENCE_FLUSH_MS = 60000; // flush the delta every ~60 s

export const HOUR_MS = 3600000;
export const PRESENCE_RETENTION_DAYS_DEFAULT = 30;

// Hard ceiling on a single range query, so a garbage range can never turn into
// a million get()s. 400 days of hourly buckets.
export const PRESENCE_RANGE_MAX_BUCKETS = 400 * 24;

/** Sparse accumulator: cell index → dwell seconds. */
export type PresenceCellMap = Map<number, number>;

const isFin = (n: unknown): n is number => typeof n === 'number' && isFinite(n);

/** Grid columns spanning a floor `w` mm wide. Always ≥ 1. */
export function presenceGridCols(floorW: number): number {
  if (!isFin(floorW) || floorW <= 0) return 1;
  return Math.max(1, Math.ceil(floorW / PRESENCE_CELL_MM));
}

/** Grid rows spanning a floor `d` mm deep. Always ≥ 1. */
export function presenceGridRows(floorD: number): number {
  if (!isFin(floorD) || floorD <= 0) return 1;
  return Math.max(1, Math.ceil(floorD / PRESENCE_CELL_MM));
}

// World mm → compact integer cell index (row-major: row * cols + col).
//
// Domain is the CLOSED rect [0, w] × [0, d]: a point exactly on the far edge
// folds into the last cell rather than falling into a one-value hole. Anything
// outside the rect — and radar legitimately reports outside it, seeing through
// walls into the yard — returns -1 and is DROPPED by the accumulator. Recording
// a clamped position would invent dwell against a wall that nobody stood at.
export function presenceCellIndex(x: number, y: number, floorW: number, floorD: number): number {
  if (!isFin(x) || !isFin(y) || !isFin(floorW) || !isFin(floorD)) return -1;
  if (floorW <= 0 || floorD <= 0) return -1;
  if (x < 0 || y < 0 || x > floorW || y > floorD) return -1;
  const cols = presenceGridCols(floorW);
  const rows = presenceGridRows(floorD);
  const col = Math.min(cols - 1, Math.floor(x / PRESENCE_CELL_MM));
  const row = Math.min(rows - 1, Math.floor(y / PRESENCE_CELL_MM));
  return row * cols + col;
}

/** Cell index → its centre in world mm. null when the index is off the grid. */
export function presenceCellCenter(index: number, cols: number, rows: number): { x: number; y: number } | null {
  if (!isFin(index) || index < 0 || !isFin(cols) || !isFin(rows)) return null;
  if (cols < 1 || rows < 1 || index >= cols * rows) return null;
  const i = Math.floor(index);
  const col = i % cols;
  const row = Math.floor(i / cols);
  return {
    x: col * PRESENCE_CELL_MM + PRESENCE_CELL_MM / 2,
    y: row * PRESENCE_CELL_MM + PRESENCE_CELL_MM / 2,
  };
}

/** Cell index → its world-mm bounds. null when the index is off the grid. */
export function presenceCellBounds(
  index: number, cols: number, rows: number,
): { x0: number; y0: number; x1: number; y1: number } | null {
  const c = presenceCellCenter(index, cols, rows);
  if (!c) return null;
  const h = PRESENCE_CELL_MM / 2;
  return { x0: c.x - h, y0: c.y - h, x1: c.x + h, y1: c.y + h };
}

// Re-index a cell recorded against a DIFFERENT column count. The floor rect is
// user-editable (canvas edge drags), so a stored record's `cols` can disagree
// with today's grid; without a remap the same integer would silently mean a
// different place. Cells that fall outside the new grid return -1 and are
// dropped by the summation.
export function remapCellIndex(index: number, fromCols: number, toCols: number, toRows: number): number {
  if (!isFin(index) || index < 0) return -1;
  if (!isFin(fromCols) || fromCols < 1 || !isFin(toCols) || toCols < 1 || !isFin(toRows) || toRows < 1) return -1;
  if (fromCols === toCols) return index < toCols * toRows ? Math.floor(index) : -1;
  const i = Math.floor(index);
  const col = i % fromCols;
  const row = Math.floor(i / fromCols);
  if (col >= toCols || row >= toRows) return -1;
  return row * toCols + col;
}

// ── Hour bucketing ──────────────────────────────────────────────────────────
// Buckets are UTC-derived (floor of epoch ms / 3600000), which makes them
// DST-PROOF BY CONSTRUCTION: a local clock jump neither duplicates nor skips a
// bucket, because absolute hour boundaries do not move. Local-time grouping is
// a rendering concern and belongs in the UI, not in the storage key.
//
// Bucketing lives in the KEY (design §E) so a range query is a handful of
// direct get()s: the store needs no index and does not depart from the existing
// IndexedDB idiom.

/** Epoch ms → hour bucket. NaN-safe: non-finite input → NaN. */
export function hourBucket(epochMs: number): number {
  if (!isFin(epochMs)) return NaN;
  return Math.floor(epochMs / HOUR_MS);
}

/** Hour bucket → the epoch ms at its start. */
export function hourBucketStartMs(bucket: number): number {
  if (!isFin(bucket)) return NaN;
  return Math.floor(bucket) * HOUR_MS;
}

/**
 * Record key: `<floorId>:<hourBucket>`. Parsing splits at the LAST ':' so a
 * floor id containing a colon still round-trips.
 */
export function historyKey(floorId: string, bucket: number): string {
  return `${floorId}:${Math.floor(bucket)}`;
}

export function parseHistoryKey(key: string): { floorId: string; bucket: number } | null {
  if (typeof key !== 'string') return null;
  const i = key.lastIndexOf(':');
  if (i <= 0 || i === key.length - 1) return null;
  const floorId = key.slice(0, i);
  const tail = key.slice(i + 1);
  if (!/^-?\d+$/.test(tail)) return null;
  const bucket = Number(tail);
  if (!isFin(bucket)) return null;
  return { floorId, bucket };
}

/** Inclusive list of hour buckets covering [fromMs, toMs]. [] on bad input. */
export function hourBucketRange(fromMs: number, toMs: number): number[] {
  if (!isFin(fromMs) || !isFin(toMs)) return [];
  const a = hourBucket(Math.min(fromMs, toMs));
  const b = hourBucket(Math.max(fromMs, toMs));
  if (b - a + 1 > PRESENCE_RANGE_MAX_BUCKETS) return [];
  const out: number[] = [];
  for (let k = a; k <= b; k++) out.push(k);
  return out;
}

/** The record keys a [fromMs, toMs] query on one floor must read. */
export function historyKeysForRange(floorId: string, fromMs: number, toMs: number): string[] {
  return hourBucketRange(fromMs, toMs).map(b => historyKey(floorId, b));
}

// ── Accumulator ─────────────────────────────────────────────────────────────

/** Additive. Ignores off-grid indices and non-positive / non-finite seconds. */
export function accumulateDwell(map: PresenceCellMap, cellIndex: number, seconds: number): void {
  if (!isFin(cellIndex) || cellIndex < 0) return;
  if (!isFin(seconds) || seconds <= 0) return;
  const i = Math.floor(cellIndex);
  map.set(i, (map.get(i) ?? 0) + seconds);
}

/** Convenience: sample a raw world position for `seconds` of dwell. */
export function accumulateSample(
  map: PresenceCellMap, x: number, y: number, floorW: number, floorD: number, seconds: number,
): void {
  accumulateDwell(map, presenceCellIndex(x, y, floorW, floorD), seconds);
}

/** Additive merge of `src` INTO `target` (mutates target, returns it). */
export function mergePresenceMaps(target: PresenceCellMap, src: PresenceCellMap): PresenceCellMap {
  for (const [i, s] of src) accumulateDwell(target, i, s);
  return target;
}

/** Largest dwell in the map (0 when empty) — the renderer's normalization max. */
export function presenceMaxSeconds(map: PresenceCellMap): number {
  let m = 0;
  for (const s of map.values()) if (isFin(s) && s > m) m = s;
  return m;
}

export function presenceTotalSeconds(map: PresenceCellMap): number {
  let t = 0;
  for (const s of map.values()) if (isFin(s) && s > 0) t += s;
  return t;
}

// ── Sparse encoding ─────────────────────────────────────────────────────────
// Two parallel typed arrays, index-sorted for determinism (byte-identical
// output for an equal map, so an unchanged flush is detectable by comparison).
// Typed arrays structured-clone natively into IndexedDB.
//
// SIZE: exactly 8 BYTES PER TOUCHED CELL — Int32 index (4) + Float32 seconds
// (4) — plus a small fixed per-record header (floorId / bucket / cols / rows /
// updatedAt). Design §E predicts ~2 KB for an occupied hour, i.e. ~256 touched
// cells = ~10.2 m² of floor visited in that hour. Seconds are kept as Float32
// rather than quantized to a Uint16 (which would be 6 bytes/cell) precisely
// because records are MERGED repeatedly: a quantization error would compound on
// every flush.
export interface PresenceCells {
  cells: Int32Array;
  seconds: Float32Array;
}

/** Bytes the cell payload of an n-cell record occupies. */
export function presenceEncodedBytes(cellCount: number): number {
  if (!isFin(cellCount) || cellCount <= 0) return 0;
  return Math.floor(cellCount) * 8;
}

export function encodePresenceCells(map: PresenceCellMap): PresenceCells {
  const idx: number[] = [];
  for (const [i, s] of map) if (isFin(i) && i >= 0 && isFin(s) && s > 0) idx.push(Math.floor(i));
  idx.sort((a, b) => a - b);
  const cells = new Int32Array(idx.length);
  const seconds = new Float32Array(idx.length);
  for (let k = 0; k < idx.length; k++) {
    cells[k] = idx[k];
    seconds[k] = map.get(idx[k]) as number;
  }
  return { cells, seconds };
}

export function decodePresenceCells(enc: PresenceCells | null | undefined): PresenceCellMap {
  const out: PresenceCellMap = new Map();
  if (!enc || !enc.cells || !enc.seconds) return out;
  const n = Math.min(enc.cells.length, enc.seconds.length);
  for (let k = 0; k < n; k++) accumulateDwell(out, enc.cells[k], enc.seconds[k]);
  return out;
}

// ── Records ─────────────────────────────────────────────────────────────────
// One record per (floorId, hourBucket). `cols`/`rows` are stamped at write time
// so a later floor resize is detectable and remappable rather than silently
// reinterpreting stored indices; `cellMm` is stamped for the same reason at the
// grid-constant level.
export interface PresenceRecord {
  floorId: string;
  bucket: number;
  cellMm: number;
  cols: number;
  rows: number;
  cells: Int32Array;
  seconds: Float32Array;
  updatedAt: number; // caller-supplied epoch ms — never read from the clock here
}

export function makePresenceRecord(
  floorId: string, bucket: number, map: PresenceCellMap, cols: number, rows: number, nowMs: number,
): PresenceRecord {
  const enc = encodePresenceCells(map);
  return {
    floorId,
    bucket: Math.floor(bucket),
    cellMm: PRESENCE_CELL_MM,
    cols: Math.max(1, Math.floor(cols)),
    rows: Math.max(1, Math.floor(rows)),
    cells: enc.cells,
    seconds: enc.seconds,
    updatedAt: isFin(nowMs) ? nowMs : 0,
  };
}

/** Actual cell-payload bytes of a record (header excluded). */
export function presenceRecordBytes(rec: PresenceRecord | null | undefined): number {
  if (!rec || !rec.cells || !rec.seconds) return 0;
  return rec.cells.byteLength + rec.seconds.byteLength;
}

// Additive record merge — the flush path. A flush must ADD to whatever is
// already stored for that hour, never overwrite it (design §E: "merged
// additively"). The DELTA's grid wins; a prior record written against a
// different column count is remapped onto it.
export function mergePresenceRecords(prev: PresenceRecord, delta: PresenceRecord): PresenceRecord {
  const cols = Math.max(1, Math.floor(delta.cols));
  const rows = Math.max(1, Math.floor(delta.rows));
  const map: PresenceCellMap = new Map();
  const prevCols = Math.max(1, Math.floor(prev?.cols ?? cols));
  const prevMap = decodePresenceCells(prev);
  for (const [i, s] of prevMap) {
    const mapped = remapCellIndex(i, prevCols, cols, rows);
    if (mapped >= 0) accumulateDwell(map, mapped, s);
  }
  mergePresenceMaps(map, decodePresenceCells(delta));
  const out = makePresenceRecord(
    delta.floorId, delta.bucket, map, cols, rows,
    Math.max(isFin(prev?.updatedAt) ? prev.updatedAt : 0, isFin(delta.updatedAt) ? delta.updatedAt : 0),
  );
  return out;
}

// ── Range summation ─────────────────────────────────────────────────────────
// Sum a set of hour records into ONE cell→seconds map for rendering. Every
// record is remapped onto the CURRENT grid; cells that no longer fit are
// dropped rather than folded onto a wrong cell. Records whose `cellMm` differs
// from today's constant are skipped entirely — a different grid resolution is
// not remappable by index arithmetic, and inventing a resampling would fabricate
// dwell that was never observed.
export function sumPresenceRecords(
  records: readonly (PresenceRecord | null | undefined)[], cols: number, rows: number,
): PresenceCellMap {
  const out: PresenceCellMap = new Map();
  const c = Math.max(1, Math.floor(isFin(cols) ? cols : 1));
  const r = Math.max(1, Math.floor(isFin(rows) ? rows : 1));
  for (const rec of records ?? []) {
    if (!rec || !rec.cells || !rec.seconds) continue;
    if (isFin(rec.cellMm) && rec.cellMm !== PRESENCE_CELL_MM) continue;
    const from = Math.max(1, Math.floor(isFin(rec.cols) ? rec.cols : c));
    const n = Math.min(rec.cells.length, rec.seconds.length);
    for (let k = 0; k < n; k++) {
      const mapped = remapCellIndex(rec.cells[k], from, c, r);
      if (mapped >= 0) accumulateDwell(out, mapped, rec.seconds[k]);
    }
  }
  return out;
}

// ── Retention (design §F — an ACTIVE delete sweep, not a read-time filter) ──

/** The oldest hour bucket that is still KEPT at `nowMs` under `retentionDays`. */
export function retentionCutoffBucket(nowMs: number, retentionDays: number = PRESENCE_RETENTION_DAYS_DEFAULT): number {
  const days = isFin(retentionDays) && retentionDays > 0 ? retentionDays : PRESENCE_RETENTION_DAYS_DEFAULT;
  const now = isFin(nowMs) ? nowMs : 0;
  return hourBucket(now - days * 24 * HOUR_MS);
}

/**
 * True when this key is outside the retention window and must be DELETED.
 *
 * An UNPARSEABLE key counts as expired. This store holds nothing but presence
 * history: anything unreadable is dead weight in a privacy-sensitive store, and
 * leaving un-erasable residue behind would defeat the retention guarantee.
 */
export function isExpiredHistoryKey(
  key: string, nowMs: number, retentionDays: number = PRESENCE_RETENTION_DAYS_DEFAULT,
): boolean {
  const p = parseHistoryKey(key);
  if (!p) return true;
  return p.bucket < retentionCutoffBucket(nowMs, retentionDays);
}

/** The subset of `keys` the sweep must delete. */
export function expiredHistoryKeys(
  keys: readonly string[], nowMs: number, retentionDays: number = PRESENCE_RETENTION_DAYS_DEFAULT,
): string[] {
  return (keys ?? []).filter(k => isExpiredHistoryKey(k, nowMs, retentionDays));
}

// ── Colour ramp ─────────────────────────────────────────────────────────────
// NAMING (design §E): this is `presenceHeatColor`, NOT `heatmapColor`.
// geometry.ts's `heatmapColor` is the room TEMPERATURE map's diverging ramp and
// `Layers2D.heatmap` is that feature's layer key. Presence history is a
// different feature with a different layer key (`presenceHistory`), and it uses
// a deliberately different, sequential (never diverging) ramp so the two are
// never confusable on screen: deep indigo → violet → magenta → orange → pale
// yellow, monotonically increasing in luminance so "hotter" reads as "brighter"
// at a glance and survives greyscale.
const PRESENCE_RAMP: readonly (readonly [number, number, number])[] = [
  [0x2a, 0x1a, 0x54],
  [0x6b, 0x2a, 0x7a],
  [0xb5, 0x36, 0x79],
  [0xef, 0x6b, 0x45],
  [0xf7, 0xe2, 0x6b],
];

const hex2 = (n: number) => n.toString(16).padStart(2, '0');

/** Normalized 0..1 → {r,g,b} (0..255 ints). Out-of-range / NaN clamps. */
export function presenceHeatRgb(t01: number): { r: number; g: number; b: number } {
  const t = !isFin(t01) ? 0 : t01 < 0 ? 0 : t01 > 1 ? 1 : t01;
  const segs = PRESENCE_RAMP.length - 1;
  const p = t * segs;
  const i = Math.min(segs - 1, Math.floor(p));
  const f = p - i;
  const a = PRESENCE_RAMP[i];
  const b = PRESENCE_RAMP[i + 1];
  return {
    r: Math.round(a[0] + (b[0] - a[0]) * f),
    g: Math.round(a[1] + (b[1] - a[1]) * f),
    b: Math.round(a[2] + (b[2] - a[2]) * f),
  };
}

/** Normalized 0..1 → `#rrggbb`. */
export function presenceHeatColor(t01: number): string {
  const { r, g, b } = presenceHeatRgb(t01);
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
}

// Dwell seconds → the 0..1 the ramp takes. `gamma` < 1 lifts the low end so a
// single very hot cell (someone asleep in one spot for eight hours) does not
// flatten every corridor to black; 0.5 is a sqrt curve.
export function presenceNormalize(seconds: number, maxSeconds: number, gamma = 0.5): number {
  if (!isFin(seconds) || seconds <= 0) return 0;
  if (!isFin(maxSeconds) || maxSeconds <= 0) return 0;
  const t = Math.min(1, seconds / maxSeconds);
  const g = isFin(gamma) && gamma > 0 ? gamma : 1;
  return Math.pow(t, g);
}
