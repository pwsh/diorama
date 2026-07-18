// Sweet Home 3D STRUCTURAL importer — read a native `.sh3d` file and produce
// real Diorama data (floors / walls / rooms / doors / windows / furniture).
//
// This is a SEPARATE path from the OBJ/MTL visual-shell import (see
// model-store.ts + the "Imported 3D model" flow). Here we parse the model
// itself: a `.sh3d` is a ZIP archive whose `Home.xml` entry (SweetHome3D ≥ 5.3)
// holds the plan. Older saves are Java-serialized only (no Home.xml) → we
// detect and fail clearly.
//
// Design notes / conventions:
//  - Zero third-party deps. The ZIP reader is hand-rolled (EOCD → central
//    directory → local headers; stored + deflate-raw via DecompressionStream).
//  - SweetHome3D coordinates are in CENTIMETRES with plan Y growing DOWNWARD
//    (screen convention). We ×10 → mm and flip Y into Diorama's +Y-up world by
//    y' = (globalMaxY − y). The translate is SHARED across all levels + a fixed
//    margin, so stacked levels register (a real-world point lands at the same
//    plan x/y on every floor), and every floor gets the SAME w/d.
//  - Everything is optional-safe: unknown/absent attributes fall back to
//    defaults and every anomaly appends to `warnings` (this module never throws
//    out of convertSh3dHome).

import type { Floor, Wall, Room, Door, Window as DioramaWindow, Furniture, Vec2, FurnitureKind } from './types.js';
import { closedWallLoops, loopContaining, pointInPolygon, WINDOW_DEFAULTS, FURNITURE_KINDS } from './geometry.js';

// ── Minimal ZIP reader ──────────────────────────────────────────────────────

const SIG_EOCD = 0x06054b50;
const SIG_CDIR = 0x02014b50;
const SIG_LOCAL = 0x04034b50;

/** Inflate a raw DEFLATE stream (method 8) via the native DecompressionStream. */
async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Blob([data as unknown as BlobPart]).stream().pipeThrough(ds);
  const ab = await new Response(stream).arrayBuffer();
  return new Uint8Array(ab);
}

/**
 * Parse a ZIP archive into { entryName → inflated bytes }. Supports method 0
 * (stored) and method 8 (deflate). Throws a clear Error for encryption / zip64
 * / a missing central directory. Reads sizes + method from the central
 * directory (the local header may carry a zeroed data descriptor).
 */
export async function readZipEntries(buf: Uint8Array): Promise<Map<string, Uint8Array>> {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const u16 = (o: number) => dv.getUint16(o, true);
  const u32 = (o: number) => dv.getUint32(o, true);

  // Locate the End Of Central Directory record (scan back over the max comment).
  let eocd = -1;
  const minStart = Math.max(0, buf.length - 22 - 0xffff);
  for (let i = buf.length - 22; i >= minStart; i--) {
    if (u32(i) === SIG_EOCD) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a ZIP archive (no end-of-central-directory record) — the .sh3d file may be corrupt.');

  const total = u16(eocd + 10);
  let cdOffset = u32(eocd + 16);
  if (total === 0xffff || cdOffset === 0xffffffff) {
    throw new Error('This .sh3d uses ZIP64 — unsupported. Re-save from Sweet Home 3D.');
  }

  const out = new Map<string, Uint8Array>();
  let p = cdOffset;
  const dec = new TextDecoder('utf-8');
  for (let n = 0; n < total; n++) {
    if (p + 46 > buf.length || u32(p) !== SIG_CDIR) {
      throw new Error('Corrupt ZIP central directory.');
    }
    const flags = u16(p + 8);
    const method = u16(p + 10);
    const compSize = u32(p + 20);
    const nameLen = u16(p + 28);
    const extraLen = u16(p + 30);
    const commentLen = u16(p + 32);
    const localOff = u32(p + 42);
    if (flags & 0x1) throw new Error('This .sh3d is encrypted — unsupported.');
    if (compSize === 0xffffffff || localOff === 0xffffffff) {
      throw new Error('This .sh3d uses ZIP64 — unsupported. Re-save from Sweet Home 3D.');
    }
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nameLen));

    // Jump to the local header to find where the data actually starts (its
    // name/extra lengths can differ from the central directory's).
    if (localOff + 30 > buf.length || u32(localOff) !== SIG_LOCAL) {
      throw new Error(`Corrupt ZIP local header for "${name}".`);
    }
    const lNameLen = u16(localOff + 26);
    const lExtraLen = u16(localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const comp = buf.subarray(dataStart, dataStart + compSize);
    let bytes: Uint8Array;
    if (method === 0) bytes = comp.slice();
    else if (method === 8) bytes = await inflateRaw(comp);
    else throw new Error(`Unsupported ZIP compression method ${method} for "${name}".`);
    out.set(name, bytes);

    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

export interface Sh3dReadResult {
  ok: boolean;
  xml?: string;
  entries: string[];
  error?: string;
}

/** Read a `.sh3d` archive and return its `Home.xml` text (if present). */
export async function readSh3dHomeXml(buf: Uint8Array): Promise<Sh3dReadResult> {
  let entries: Map<string, Uint8Array>;
  try {
    entries = await readZipEntries(buf);
  } catch (err) {
    return { ok: false, entries: [], error: (err as Error).message };
  }
  const names = [...entries.keys()];
  const homeKey = names.find(n => n === 'Home.xml')
    ?? names.find(n => /(^|\/)Home\.xml$/i.test(n));
  if (!homeKey) {
    return {
      ok: false, entries: names,
      error: 'No Home.xml inside the archive — this looks like an older Sweet Home 3D save (Java-serialized only). Re-save with a recent Sweet Home 3D (5.3+).',
    };
  }
  const xml = new TextDecoder('utf-8').decode(entries.get(homeKey)!);
  return { ok: true, xml, entries: names };
}

// ── XML → Diorama conversion ─────────────────────────────────────────────────

const CM_TO_MM = 10;
const FLOOR_MARGIN_MM = 500;
const OPENING_SNAP_MM = 500;

export interface Sh3dCounts {
  levels: number;
  walls: number;
  rooms: number;
  openings: number;
  furniture: number;
  furnitureSkipped: number;
}

export interface Sh3dConvertResult {
  name?: string;
  floors: Floor[];
  warnings: string[];
  counts: Sh3dCounts;
}

export interface Sh3dConvertOptions {
  importFurniture?: boolean;   // default true
  idPrefix?: string;           // id namespace; default 'sh'
}

// Furniture keyword → Diorama kind. First matching regex wins, so order the
// SPECIFIC entries before the generic ones (coffee table before table). Tested
// against `name` + `catalogId`, both lower-cased. Unmatched pieces are SKIPPED
// (no blocks) so we never spam the plan with mystery boxes.
const FURNITURE_KEYWORDS: [RegExp, FurnitureKind][] = [
  [/coffee\s*table|table\s*basse/, 'coffee_table'],
  [/night\s*stand|bedside|table\s*de\s*(nuit|chevet)/, 'nightstand'],
  [/dining\s*table|kitchen\s*table|table\b|table\s*à?\s*manger/, 'table'],
  [/desk|bureau/, 'desk'],
  [/book\s*(shelf|case)|shelf|shelving|biblioth/, 'bookshelf'],
  [/dresser|chest\s*of\s*draw|commode/, 'dresser'],
  [/wardrobe|armoire|closet|penderie/, 'wardrobe'],
  [/night|bed\b|double\s*bed|lit\b/, 'bed'],
  [/sofa|couch|loveseat|settee|canap/, 'sofa'],
  [/arm\s*chair|recliner|fauteuil/, 'chair'],
  [/bar\s*stool|stool|tabouret/, 'stool'],
  [/bench|banc/, 'bench'],
  [/ottoman|pouf|footstool/, 'ottoman'],
  [/dining\s*chair|chair|chaise/, 'chair'],
  [/kitchen\s*island|island|îlot/, 'island'],
  [/counter|worktop|plan\s*de\s*travail/, 'counter'],
  [/cabinet|cupboard|placard/, 'cabinet'],
  [/refriger|fridge|réfrig|frigo/, 'fridge'],
  [/dish\s*washer|lave.?vaisselle/, 'dishwasher'],
  [/stove|oven|range|cooktop|cuisinière|four\b/, 'stove'],
  [/microwave|micro.?onde/, 'microwave'],
  [/washer|washing\s*machine|lave.?linge/, 'washer'],
  [/dryer|sèche.?linge/, 'dryer'],
  [/television|\btv\b|téléviseur/, 'tv'],
  [/toilet|\bwc\b|water\s*closet|toilette/, 'toilet'],
  [/bath\s*tub|bathtub|\btub\b|baignoire/, 'bathtub'],
  [/shower|douche/, 'shower'],
  [/sink|wash\s*basin|basin|lavatory|lavabo|évier/, 'sink'],
  [/rug|carpet|tapis/, 'rug'],
  [/\bplant|flower|plante/, 'plant'],
  [/wardrobe|cabinet/, 'cabinet'],
  [/\bcar\b|vehicle|voiture/, 'car'],
];

function mapFurnitureKind(name: string, catalogId: string): FurnitureKind | null {
  const hay = `${name} ${catalogId}`.toLowerCase();
  for (const [re, kind] of FURNITURE_KEYWORDS) if (re.test(hay)) return kind;
  return null;
}

function numAttr(el: Element, attr: string, dflt = NaN): number {
  const raw = el.getAttribute(attr);
  if (raw == null || raw.trim() === '') return dflt;
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : dflt;
}

// Area centroid of a simple polygon (world mm). Falls back to the vertex mean
// for a degenerate (zero-area) ring.
function polygonCentroid(poly: Vec2[]): Vec2 {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const cross = poly[j].x * poly[i].y - poly[i].x * poly[j].y;
    a += cross;
    cx += (poly[j].x + poly[i].x) * cross;
    cy += (poly[j].y + poly[i].y) * cross;
  }
  if (Math.abs(a) < 1e-6) {
    const mx = poly.reduce((s, p) => s + p.x, 0) / poly.length;
    const my = poly.reduce((s, p) => s + p.y, 0) / poly.length;
    return { x: mx, y: my };
  }
  a *= 0.5;
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

// A point guaranteed inside a simple polygon: the area centroid when it lands
// inside (convex / most concave rings), else the first interior midpoint of a
// vertex-pair diagonal (a simple polygon always has one). Falls back to the
// centroid with the caller warning.
function interiorPoint(poly: Vec2[]): { pt: Vec2; inside: boolean } {
  const c = polygonCentroid(poly);
  if (pointInPolygon(c.x, c.y, poly)) return { pt: c, inside: true };
  for (let i = 0; i < poly.length; i++) {
    for (let j = i + 2; j < poly.length; j++) {
      if (i === 0 && j === poly.length - 1) continue;   // adjacent (closing) edge
      const m = { x: (poly[i].x + poly[j].x) / 2, y: (poly[i].y + poly[j].y) / 2 };
      if (pointInPolygon(m.x, m.y, poly)) return { pt: m, inside: true };
    }
  }
  return { pt: c, inside: false };
}

// Project (item.x, item.y) onto the nearest wall segment within maxDist and
// align its rotation to that segment (keeping the nearer of the two axis
// directions). MIRRORS canvas-interact.ts `snapOpeningToWall` (kept dependency-
// free so this module and the test harness stay UI-free). Mutates item.
function snapOpeningToWallLocal(
  walls: { points: Vec2[] }[],
  item: { x: number; y: number; rotation: number },
  maxDist = OPENING_SNAP_MM,
): boolean {
  let best: { q: Vec2; angDeg: number; d: number } | null = null;
  for (const w of walls) {
    for (let i = 0; i < w.points.length - 1; i++) {
      const A = w.points[i], B = w.points[i + 1];
      const dx = B.x - A.x, dy = B.y - A.y;
      const len2 = dx * dx + dy * dy;
      if (len2 < 1) continue;
      const t = Math.max(0, Math.min(1, ((item.x - A.x) * dx + (item.y - A.y) * dy) / len2));
      const qx = A.x + t * dx, qy = A.y + t * dy;
      const d = Math.hypot(item.x - qx, item.y - qy);
      if (d < maxDist && (!best || d < best.d)) {
        best = { q: { x: qx, y: qy }, angDeg: Math.atan2(-(B.y - A.y), B.x - A.x) * 180 / Math.PI, d };
      }
    }
  }
  if (!best) return false;
  item.x = Math.round(best.q.x);
  item.y = Math.round(best.q.y);
  const cur = ((item.rotation % 360) + 360) % 360;
  const c0 = ((Math.round(best.angDeg) % 360) + 360) % 360;
  const c1 = (c0 + 180) % 360;
  const diff = (m: number, n: number) => { const dd = Math.abs(m - n) % 360; return Math.min(dd, 360 - dd); };
  item.rotation = diff(c0, cur) <= diff(c1, cur) ? c0 : c1;
  return true;
}

interface LevelBucket {
  id: string | null;
  name: string;
  elevation: number;
  walls: Element[];
  rooms: Element[];
  openings: Element[];
  furniture: Element[];
}

/**
 * Convert a parsed Home.xml Document into Diorama floors. Never throws — every
 * anomaly appends to `warnings`.
 */
export function convertSh3dHome(doc: Document, opts: Sh3dConvertOptions = {}): Sh3dConvertResult {
  const importFurniture = opts.importFurniture !== false;
  const prefix = opts.idPrefix ?? 'sh';
  const warnings: string[] = [];
  let idc = 0;
  const nextId = (p: string) => `${prefix}_${p}${++idc}`;

  const home = doc.querySelector('home') ?? doc.documentElement;
  const homeName = home?.getAttribute('name') || undefined;

  const levelEls = Array.from(doc.getElementsByTagName('level'));
  const wallEls = Array.from(doc.getElementsByTagName('wall'));
  const roomEls = Array.from(doc.getElementsByTagName('room'));
  const dowEls = Array.from(doc.getElementsByTagName('doorOrWindow'));
  // `pieceOfFurniture` and `light` are furniture subtypes; `doorOrWindow` is
  // ALSO a subtype but is a distinct element name, so it never appears here.
  const pieceEls = Array.from(doc.getElementsByTagName('pieceOfFurniture'));

  // Build level buckets. No <level> elements → a single implicit floor.
  const buckets: LevelBucket[] = [];
  const bucketById = new Map<string | null, LevelBucket>();
  if (levelEls.length) {
    const sorted = [...levelEls].sort(
      (a, b) => numAttr(a, 'elevation', 0) - numAttr(b, 'elevation', 0),
    );
    sorted.forEach((lv, i) => {
      const b: LevelBucket = {
        id: lv.getAttribute('id'),
        name: lv.getAttribute('name') || `Floor ${i + 1}`,
        elevation: numAttr(lv, 'elevation', 0),
        walls: [], rooms: [], openings: [], furniture: [],
      };
      buckets.push(b);
      bucketById.set(b.id, b);
    });
  } else {
    const b: LevelBucket = {
      id: null, name: 'Floor 1', elevation: 0,
      walls: [], rooms: [], openings: [], furniture: [],
    };
    buckets.push(b);
    bucketById.set(null, b);
  }
  const fallback = buckets[0];
  const assign = (el: Element, list: (b: LevelBucket) => Element[]) => {
    const lvl = el.getAttribute('level');
    const b = (lvl != null && bucketById.get(lvl)) || fallback;
    list(b).push(el);
  };
  wallEls.forEach(e => assign(e, b => b.walls));
  roomEls.forEach(e => assign(e, b => b.rooms));
  dowEls.forEach(e => assign(e, b => b.openings));
  if (importFurniture) pieceEls.forEach(e => assign(e, b => b.furniture));

  // ── Global bbox (mm, pre-flip) over every geometric point across ALL levels
  //    so the shared transform registers stacked floors. ─────────────────────
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const acc = (xCm: number, yCm: number) => {
    if (!Number.isFinite(xCm) || !Number.isFinite(yCm)) return;
    const x = xCm * CM_TO_MM, y = yCm * CM_TO_MM;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  };
  for (const w of wallEls) {
    acc(numAttr(w, 'xStart', 0), numAttr(w, 'yStart', 0));
    acc(numAttr(w, 'xEnd', 0), numAttr(w, 'yEnd', 0));
  }
  for (const r of roomEls) {
    for (const pt of Array.from(r.getElementsByTagName('point'))) {
      acc(numAttr(pt, 'x', 0), numAttr(pt, 'y', 0));
    }
  }
  for (const d of dowEls) acc(numAttr(d, 'x', 0), numAttr(d, 'y', 0));
  if (importFurniture) for (const f of pieceEls) acc(numAttr(f, 'x', 0), numAttr(f, 'y', 0));

  if (!Number.isFinite(minX)) {
    warnings.push('No geometry found in Home.xml — the plan appears empty.');
    minX = 0; minY = 0; maxX = 0; maxY = 0;
  }

  // Shared transform (SAME across every level so a real point lands at the same
  // plan x/y on each floor). Y is flipped into +Y-up world.
  const tx = (xCm: number) => Math.round((xCm * CM_TO_MM - minX) + FLOOR_MARGIN_MM);
  const ty = (yCm: number) => Math.round((maxY - yCm * CM_TO_MM) + FLOOR_MARGIN_MM);
  const roundUp100 = (v: number) => Math.max(2000, Math.ceil(v / 100) * 100);
  const floorW = roundUp100((maxX - minX) + 2 * FLOOR_MARGIN_MM);
  const floorD = roundUp100((maxY - minY) + 2 * FLOOR_MARGIN_MM);

  const counts: Sh3dCounts = { levels: buckets.length, walls: 0, rooms: 0, openings: 0, furniture: 0, furnitureSkipped: 0 };
  const floors: Floor[] = [];

  for (const b of buckets) {
    // Walls
    const walls: Wall[] = [];
    for (const wEl of b.walls) {
      const p0 = { x: tx(numAttr(wEl, 'xStart', 0)), y: ty(numAttr(wEl, 'yStart', 0)) };
      const p1 = { x: tx(numAttr(wEl, 'xEnd', 0)), y: ty(numAttr(wEl, 'yEnd', 0)) };
      if (Math.hypot(p1.x - p0.x, p1.y - p0.y) < 1) continue;   // skip zero-length
      walls.push({ id: nextId('w'), points: [p0, p1], kind: 'full' });
    }
    counts.walls += walls.length;

    // Rooms
    const rooms: Room[] = [];
    for (const rEl of b.rooms) {
      const ptEls = Array.from(rEl.getElementsByTagName('point'));
      if (ptEls.length < 3) continue;
      const poly: Vec2[] = ptEls.map(pt => ({ x: tx(numAttr(pt, 'x', 0)), y: ty(numAttr(pt, 'y', 0)) }));
      const name = rEl.getAttribute('name') || '';
      const { pt, inside } = interiorPoint(poly);
      if (!inside) {
        warnings.push(`Room "${name || 'unnamed'}" on ${b.name}: concave outline — anchor placed at the polygon centroid (may sit near an edge).`);
      }
      rooms.push({ id: nextId('rm'), name, anchor: pt });
    }
    counts.rooms += rooms.length;

    // Doors / windows
    const doors: Door[] = [];
    const windows: DioramaWindow[] = [];
    for (const dEl of b.openings) {
      const cx = tx(numAttr(dEl, 'x', 0));
      const cy = ty(numAttr(dEl, 'y', 0));
      const width = Math.max(100, Math.round(numAttr(dEl, 'width', 80) * CM_TO_MM));
      const elevationCm = numAttr(dEl, 'elevation', 0);
      const name = (dEl.getAttribute('name') || '').toLowerCase();
      const catalog = (dEl.getAttribute('catalogId') || '').toLowerCase();
      const angleDeg = numAttr(dEl, 'angle', 0);
      // SH3D angle is CW in the down-Y plan; our Y-flip mirrors it → negate.
      const provisional = ((Math.round(-angleDeg) % 360) + 360) % 360;
      const isWindow = /window|fenetre|fenêtre/.test(name) || /window|fenetre|fenêtre/.test(catalog) || elevationCm > 0;

      if (isWindow) {
        // Window (x, y) is the pane CENTER — snap the center onto the wall.
        const win: DioramaWindow = {
          id: nextId('win'), x: cx, y: cy, w: width,
          rotation: provisional, entity_id: null,
          sill: elevationCm > 0 ? Math.round(elevationCm * CM_TO_MM) : WINDOW_DEFAULTS.sill,
          height: Math.round(Math.max(300, numAttr(dEl, 'height', 80) * CM_TO_MM)) || WINDOW_DEFAULTS.height,
        };
        const snapped = snapOpeningToWallLocal(walls, win);
        if (!snapped) warnings.push(`Window on ${b.name} has no wall within ${OPENING_SNAP_MM} mm — placed loose (won't cut an opening).`);
        windows.push(win);
      } else {
        // Door (x, y) is the HINGE. SH3D x/y is the piece CENTER; snap the
        // center to the wall (also sets rotation to the wall axis), then offset
        // back by w/2 along the wall so doorSpanCenter(hinge) === the center.
        const center = { x: cx, y: cy, rotation: provisional };
        const snapped = snapOpeningToWallLocal(walls, center);
        if (!snapped) warnings.push(`Door on ${b.name} has no wall within ${OPENING_SNAP_MM} mm — placed loose (won't cut an opening).`);
        const t = center.rotation * Math.PI / 180;
        const door: Door = {
          id: nextId('dr'),
          x: Math.round(center.x - Math.cos(t) * width / 2),
          y: Math.round(center.y + Math.sin(t) * width / 2),
          w: width, rotation: center.rotation, entity_id: null,
        };
        doors.push(door);
      }
    }
    counts.openings += doors.length + windows.length;

    // Furniture (best-effort keyword mapping; unmatched skipped)
    const furniture: Furniture[] = [];
    for (const fEl of b.furniture) {
      const name = fEl.getAttribute('name') || '';
      const catalog = fEl.getAttribute('catalogId') || '';
      const kind = mapFurnitureKind(name, catalog);
      if (!kind) { counts.furnitureSkipped++; continue; }
      const def = FURNITURE_KINDS[kind];
      const w = Math.max(100, Math.round(numAttr(fEl, 'width', def.w / CM_TO_MM) * CM_TO_MM));
      const h = Math.max(100, Math.round(numAttr(fEl, 'depth', def.h / CM_TO_MM) * CM_TO_MM));
      const angleDeg = numAttr(fEl, 'angle', 0);
      const rotation = ((Math.round(-angleDeg) % 360) + 360) % 360;   // mirror the Y-flip
      const fu: Furniture = {
        id: nextId('fn'), x: tx(numAttr(fEl, 'x', 0)), y: ty(numAttr(fEl, 'y', 0)),
        w, h, kind,
      };
      if (rotation) fu.rotation = rotation;
      if (name) fu.label = name;
      furniture.push(fu);
    }
    counts.furniture += furniture.length;

    // Validation: rooms whose anchor lands outside every closed wall loop.
    const loops = closedWallLoops(walls);
    for (const rm of rooms) {
      if (!loopContaining(loops, rm.anchor.x, rm.anchor.y)) {
        warnings.push(`Room "${rm.name || 'unnamed'}" on ${b.name} is not enclosed by walls (open plan) — the label is placed but no floor loop was detected.`);
      }
    }

    floors.push({
      id: nextId('fl'), name: b.name, w: floorW, d: floorD,
      walls, furniture, lights: [], switches: [], sensors: [], motionSensors: [],
      roamers: [], envSensors: [], doors, windows, bg: null, rooms,
    } as Floor);
  }

  return { name: homeName, floors, warnings, counts };
}

// ── UI convenience: File → parse → convert ───────────────────────────────────

export interface Sh3dAnalysis {
  ok: boolean;
  name?: string;
  floors?: Floor[];
  warnings?: string[];
  counts?: Sh3dCounts;
  error?: string;
}

/**
 * Read a `.sh3d` File (or ArrayBuffer) end to end: unzip → Home.xml → convert.
 * Returns floors + counts + warnings for the caller to confirm, or a readable
 * error. Never throws.
 */
export async function analyzeSh3dFile(
  src: File | ArrayBuffer | Uint8Array,
  opts: Sh3dConvertOptions = {},
): Promise<Sh3dAnalysis> {
  let buf: Uint8Array;
  try {
    if (src instanceof Uint8Array) buf = src;
    else if (src instanceof ArrayBuffer) buf = new Uint8Array(src);
    else buf = new Uint8Array(await src.arrayBuffer());
  } catch (err) {
    return { ok: false, error: 'Could not read the file: ' + (err as Error).message };
  }
  const read = await readSh3dHomeXml(buf);
  if (!read.ok || !read.xml) return { ok: false, error: read.error ?? 'Could not read Home.xml.' };
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(read.xml, 'application/xml');
    if (doc.querySelector('parsererror')) return { ok: false, error: 'Home.xml is not valid XML.' };
  } catch (err) {
    return { ok: false, error: 'Failed to parse Home.xml: ' + (err as Error).message };
  }
  const res = convertSh3dHome(doc, opts);
  return { ok: true, name: res.name, floors: res.floors, warnings: res.warnings, counts: res.counts };
}
