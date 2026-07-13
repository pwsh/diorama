// Pure geometry helpers — no DOM, no state.

import type { Vec2, Sensor, BgImage, LightIconKind, FurnitureKind, EnvKind, WallKind,
  ActivityKind, ObjectRecipe, Furniture, Room, Floor, SafetyKind } from './types.js';

export const MM_PER_IN = 25.4;
export const IN_PER_FT = 12;
export const GRID_MM = 100;

export function distMM(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function snap(v: number, g: number): number {
  return Math.round(v / g) * g;
}

export function fmtLen(mm: number, imperial: boolean): string {
  if (imperial) {
    const totIn = mm / MM_PER_IN;
    if (Math.abs(mm) < 3 * IN_PER_FT * MM_PER_IN) return `${totIn.toFixed(1)} in`;
    const ft = Math.trunc(totIn / IN_PER_FT);
    const inR = Math.abs(totIn - ft * IN_PER_FT);
    return `${ft}' ${inR.toFixed(1)}"`;
  }
  if (Math.abs(mm) < 1000) return `${(mm / 10).toFixed(1)} cm`;
  const m = Math.trunc(mm / 1000);
  const cm = Math.abs(mm - m * 1000) / 10;
  return `${m} m ${cm.toFixed(1)} cm`;
}

// ── Floor boundary editing (drag the canvas edges) ─────────────────────────
export interface FloorBox { minX: number; minY: number; maxX: number; maxY: number; }
export type FloorEdge = 'left' | 'right' | 'top' | 'bottom';

// Bounding box of a floor's movable content (wall vertices + item centers),
// world mm. Null when the floor is empty. Used to clamp a shrinking boundary
// edge so no content is stranded outside the plan.
export function floorContentBbox(f: Floor): FloorBox | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, any = false;
  const acc = (x: number, y: number) => {
    any = true;
    if (x < minX) minX = x; if (y < minY) minY = y;
    if (x > maxX) maxX = x; if (y > maxY) maxY = y;
  };
  for (const w of f.walls) for (const pt of w.points) acc(pt.x, pt.y);
  for (const it of f.furniture) acc(it.x, it.y);
  for (const it of f.lights) acc(it.x, it.y);
  for (const it of f.switches) acc(it.x, it.y);
  for (const it of f.sensors) acc(it.x, it.y);
  for (const it of f.motionSensors) acc(it.x, it.y);
  for (const it of f.envSensors ?? []) acc(it.x, it.y);
  for (const it of f.bleProxies ?? []) acc(it.x, it.y);
  for (const it of f.doors ?? []) acc(it.x, it.y);
  for (const it of f.windows ?? []) acc(it.x, it.y);
  for (const rm of f.rooms ?? []) acc(rm.anchor.x, rm.anchor.y);
  return any ? { minX, minY, maxX, maxY } : null;
}

// Resolve a floor-edge drag. `delta` is the grid-snapped world-mm displacement
// of the dragged edge along its axis (world sign: +x = right, +y = up). The
// `right` / `top` edges only resize (w / d); the `left` / `bottom` edges resize
// AND translate the content by `tx` / `ty` so the plan stays glued to the
// opposite edge (`tx`/`ty` are the TOTAL translation from the drag-start
// positions). Enforces a minimum floor size and keeps the content bbox
// (+ `margin`) inside the plan.
export function resolveFloorEdgeDrag(
  edge: FloorEdge, delta: number,
  startW: number, startD: number,
  bbox: FloorBox | null,
  margin = GRID_MM, minSize = 2000,
): { w: number; d: number; tx: number; ty: number } {
  let w = startW, d = startD, tx = 0, ty = 0;
  if (edge === 'right') {
    let min = minSize;
    if (bbox) min = Math.max(min, bbox.maxX + margin);
    w = Math.max(min, startW + delta);
  } else if (edge === 'top') {
    let min = minSize;
    if (bbox) min = Math.max(min, bbox.maxY + margin);
    d = Math.max(min, startD + delta);
  } else if (edge === 'left') {
    // Positive delta shrinks from the left; cap it so width stays >= minSize
    // and content near the left edge keeps its margin. Negative delta (enlarge)
    // is always allowed.
    let maxDelta = startW - minSize;
    if (bbox) maxDelta = Math.min(maxDelta, bbox.minX - margin);
    maxDelta = Math.max(0, maxDelta);
    const dd = Math.min(delta, maxDelta);
    w = startW - dd; tx = -dd;
  } else {  // bottom
    let maxDelta = startD - minSize;
    if (bbox) maxDelta = Math.min(maxDelta, bbox.minY - margin);
    maxDelta = Math.max(0, maxDelta);
    const dd = Math.min(delta, maxDelta);
    d = startD - dd; ty = -dd;
  }
  return { w, d, tx, ty };
}

export function pointToSeg(px: number, py: number, ax: number, ay: number,
                            bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  const qx = ax + t * dx, qy = ay + t * dy;
  return Math.hypot(px - qx, py - qy);
}

export function pointInPolygon(px: number, py: number, verts: Vec2[]): boolean {
  let inside = false;
  const n = verts.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = verts[i].x, yi = verts[i].y;
    const xj = verts[j].x, yj = verts[j].y;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

export function centroid(verts: Vec2[]): Vec2 {
  const s = verts.reduce((a, v) => ({ x: a.x + v.x, y: a.y + v.y }), { x: 0, y: 0 });
  return { x: s.x / verts.length, y: s.y / verts.length };
}

// 15° edge snap; with one neighbor length is preserved along the snapped ray;
// with two neighbors we intersect the two snapped rays (angle-only edit).
export function snapVertex15(prev: Vec2 | null, next: Vec2 | null, cursor: Vec2): Vec2 {
  const STEP = Math.PI / 12;
  const snapA = (a: number) => Math.round(a / STEP) * STEP;
  if (prev && next) {
    const a1 = snapA(Math.atan2(cursor.y - prev.y, cursor.x - prev.x));
    const a2 = snapA(Math.atan2(cursor.y - next.y, cursor.x - next.x));
    const dx1 = Math.cos(a1), dy1 = Math.sin(a1);
    const dx2 = Math.cos(a2), dy2 = Math.sin(a2);
    const det = dx1 * (-dy2) - dy1 * (-dx2);
    if (Math.abs(det) > 1e-6) {
      const rx = next.x - prev.x, ry = next.y - prev.y;
      const t1 = (rx * (-dy2) - ry * (-dx2)) / det;
      return { x: prev.x + t1 * dx1, y: prev.y + t1 * dy1 };
    }
    const d = Math.hypot(cursor.x - prev.x, cursor.y - prev.y);
    return { x: prev.x + d * dx1, y: prev.y + d * dy1 };
  }
  const ref = prev ?? next;
  if (!ref) return cursor;
  const a = snapA(Math.atan2(cursor.y - ref.y, cursor.x - ref.x));
  const d = Math.hypot(cursor.x - ref.x, cursor.y - ref.y);
  return { x: ref.x + d * Math.cos(a), y: ref.y + d * Math.sin(a) };
}

// Sensor pose transforms.
//   world.x = sx + xL·cos(θ) + yL·sin(θ)
//   world.y = sy − xL·sin(θ) + yL·cos(θ)
export function localToWorld(s: Sensor, xL: number, yL: number): Vec2 {
  const t = (s.heading || 0) * Math.PI / 180;
  const c = Math.cos(t), si = Math.sin(t);
  return { x: s.x + xL * c + yL * si, y: s.y - xL * si + yL * c };
}

export function worldToLocal(s: Sensor, wx: number, wy: number): Vec2 {
  const t = (s.heading || 0) * Math.PI / 180;
  const c = Math.cos(t), si = Math.sin(t);
  const dx = wx - s.x, dy = wy - s.y;
  return { x: dx * c - dy * si, y: dx * si + dy * c };
}

export function transformVerts(s: Sensor, verts: Vec2[]): Vec2[] {
  return verts.map(v => localToWorld(s, v.x, v.y));
}

// Bg-image local frame: same convention as sensor.
export function bgLocalToWorld(bg: BgImage, lx: number, ly: number): Vec2 {
  const t = (bg.rotation || 0) * Math.PI / 180;
  const c = Math.cos(t), si = Math.sin(t);
  return { x: bg.x + lx * c + ly * si, y: bg.y - lx * si + ly * c };
}

export function bgWorldToLocal(bg: BgImage, wx: number, wy: number): Vec2 {
  const t = (bg.rotation || 0) * Math.PI / 180;
  const c = Math.cos(t), si = Math.sin(t);
  const dx = wx - bg.x, dy = wy - bg.y;
  return { x: dx * c - dy * si, y: dx * si + dy * c };
}

// Canvas mapping helper (operates in world mm). Y is flipped so world +Y is up.
export function mmToCanvas(wx: number, wy: number, ox: number, oy: number, scale: number) {
  return { x: ox + wx * scale, y: oy - wy * scale };
}

export function slugToName(slug: string): string {
  return slug.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── Wall kinds ────────────────────────────────────────────────────────────
export const WALL_KINDS: Record<WallKind, { label: string; h: number }> = {
  full:      { label: 'Full wall',  h: 2743 },  // 9 ft
  half:      { label: 'Half wall',  h: 1372 },  // pony wall, half of full
  railing:   { label: 'Railing',    h: 914 },   // 3 ft banister
  invisible: { label: 'Invisible',  h: 0 },     // planning boundary; closes floor loops
};
export function wallKind(w: { kind?: WallKind }): WallKind { return w.kind ?? 'full'; }

export function polygonArea(pts: Vec2[]): number {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += (pts[j].x + pts[i].x) * (pts[j].y - pts[i].y);
  }
  return a / 2;
}

// Extract the closed floor regions bounded by the walls, as CCW polygons
// (loops smaller than ~0.5 m² are noise and dropped). This is a proper planar
// face decomposition, NOT plain chain-following: it welds nearby endpoints
// (clustered within 25 mm), SPLITS walls where another wall's endpoint lands on their
// interior (T-junctions) or where two walls cross, then traces the minimal
// interior faces of the resulting planar graph. That means an interior wall
// (e.g. an INVISIBLE planning boundary drawn across an already-closed area, or
// meeting existing walls mid-segment) subdivides the enclosing region into
// separate rooms — a plain single-cycle trace could not. Invisible walls
// participate fully: they exist precisely to close / subdivide floor regions
// without rendering anything. Callers must treat the returned arrays as owned
// (resolveRoomForPoint relies on reference equality within one call).
export function closedWallLoops(walls: { points: Vec2[] }[]): Vec2[][] {
  // 25 mm tolerance heals small gaps already baked into saved plans (measured
  // 3–22 mm) without merging genuinely distinct walls: the 2D grid snap is
  // 100 mm and walls are 80+ mm thick, so no legitimate plan has two DISTINCT
  // parallel walls within 25 mm. Node welding uses nearest-existing clustering
  // (NOT grid-bucket rounding — a bucket boundary would split a near pair).
  const WELD = 25;  // mm: cluster an endpoint onto an already-registered node
  const EPS = 25;   // mm: on-segment / crossing coincidence tolerance
  const nodeMap = new Map<string, Vec2>();
  const nodes: { x: number; y: number; k: string }[] = [];
  const node = (x: number, y: number): string => {
    let bestK = '', bestD = WELD * WELD;
    for (const nd of nodes) {
      const dx = nd.x - x, dy = nd.y - y, d = dx * dx + dy * dy;
      if (d <= bestD) { bestD = d; bestK = nd.k; }  // greedy nearest within WELD
    }
    if (bestK) return bestK;
    const k = `n${nodes.length}`;
    const nd = { x, y, k };
    nodes.push(nd);
    nodeMap.set(k, { x, y });
    return k;
  };
  // 1. Break every polyline into its individual segments (welded endpoints).
  const segs: { ax: number; ay: number; bx: number; by: number }[] = [];
  for (const w of walls) {
    const pts = w.points;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = node(pts[i].x, pts[i].y), b = node(pts[i + 1].x, pts[i + 1].y);
      if (a === b) continue;
      const A = nodeMap.get(a)!, B = nodeMap.get(b)!;
      segs.push({ ax: A.x, ay: A.y, bx: B.x, by: B.y });
    }
  }
  // 2. Strict interior crossings (e.g. two invisible chords forming a +) become
  //    split nodes so both segments break at the crossing point.
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      const p = segs[i], q = segs[j];
      const r1x = p.bx - p.ax, r1y = p.by - p.ay;
      const r2x = q.bx - q.ax, r2y = q.by - q.ay;
      const den = r1x * r2y - r1y * r2x;
      if (Math.abs(den) < 1e-6) continue;  // parallel / collinear
      const t = ((q.ax - p.ax) * r2y - (q.ay - p.ay) * r2x) / den;
      const u = ((q.ax - p.ax) * r1y - (q.ay - p.ay) * r1x) / den;
      const e = 1e-4;
      if (t <= e || t >= 1 - e || u <= e || u >= 1 - e) continue;  // endpoints handled elsewhere
      node(p.ax + t * r1x, p.ay + t * r1y);
    }
  }
  // 3. Build the undirected graph: split each segment at every node lying on it
  //    (its own endpoints, T-junctions, crossings), edge between neighbours.
  const allNodes = [...nodeMap.entries()];  // [key, pos]
  const adj = new Map<string, Set<string>>();
  const edgeSet = new Set<string>();
  const addEdge = (ka: string, kb: string) => {
    if (ka === kb) return;
    const e = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    if (edgeSet.has(e)) return;
    edgeSet.add(e);
    (adj.get(ka) ?? adj.set(ka, new Set()).get(ka)!).add(kb);
    (adj.get(kb) ?? adj.set(kb, new Set()).get(kb)!).add(ka);
  };
  for (const s of segs) {
    const dx = s.bx - s.ax, dy = s.by - s.ay, len2 = dx * dx + dy * dy;
    if (len2 === 0) continue;
    const on: { t: number; k: string }[] = [];
    for (const [nk, n] of allNodes) {
      const t = ((n.x - s.ax) * dx + (n.y - s.ay) * dy) / len2;
      if (t < -1e-6 || t > 1 + 1e-6) continue;
      const px = s.ax + t * dx, py = s.ay + t * dy;
      if (Math.hypot(n.x - px, n.y - py) <= EPS)
        on.push({ t: Math.max(0, Math.min(1, t)), k: nk });
    }
    on.sort((a, b) => a.t - b.t);
    for (let i = 0; i < on.length - 1; i++)
      if (on[i].k !== on[i + 1].k) addEdge(on[i].k, on[i + 1].k);
  }
  // 4. Trace minimal faces. At each node keep neighbours sorted CCW by angle;
  //    walking (u→v) then taking the neighbour just CCW of the reverse edge at v
  //    traces one minimal face per lap. Interior faces come out clockwise
  //    (negative signed area); the single outer boundary comes out CCW.
  const pos = (k: string) => nodeMap.get(k)!;
  const sortedAdj = new Map<string, string[]>();
  for (const [k, set] of adj) {
    const P = pos(k);
    sortedAdj.set(k, [...set].sort((a, b) => {
      const A = pos(a), B = pos(b);
      return Math.atan2(A.y - P.y, A.x - P.x) - Math.atan2(B.y - P.y, B.x - P.x);
    }));
  }
  const signed = (f: Vec2[]) => {
    let a = 0;
    for (let i = 0, j = f.length - 1; i < f.length; j = i++)
      a += f[j].x * f[i].y - f[i].x * f[j].y;
    return a / 2;  // >0 CCW (y-up)
  };
  const visited = new Set<string>();
  const out: Vec2[][] = [];
  for (const [k, set] of adj) {
    for (const v0 of set) {
      if (visited.has(`${k}>${v0}`)) continue;
      const face: string[] = [];
      let u = k, cur = v0, guard = 0;
      while (guard++ < 100000) {
        visited.add(`${u}>${cur}`);
        face.push(cur);
        const arr = sortedAdj.get(cur)!;
        const w = arr[(arr.indexOf(u) + 1) % arr.length];
        u = cur; cur = w;
        if (u === k && cur === v0) break;
      }
      if (face.length < 3) continue;
      const poly = face.map(kk => ({ x: pos(kk).x, y: pos(kk).y }));
      // Keep interior (CW) faces above the noise threshold, oriented CCW.
      if (signed(poly) < -5e5) out.push(poly.reverse());
    }
  }
  return out;
}

// ── Rooms ────────────────────────────────────────────────────────────────
// A room is a name + anchor point; the room IS whichever closed wall loop
// currently contains the anchor. These two helpers resolve that live.

// First loop (in order) that geometrically contains (x, y), or null.
export function loopContaining(loops: Vec2[][], x: number, y: number): Vec2[] | null {
  for (const loop of loops) if (pointInPolygon(x, y, loop)) return loop;
  return null;
}

// The named room that owns (x, y): find the loop containing the point, then
// return the room whose anchor resolves to that SAME loop. Reference equality
// on the loop array holds within one loops computation (both lookups use the
// same array instances), so two points share a room iff they share a loop.
export function resolveRoomForPoint(rooms: Room[], loops: Vec2[][], x: number, y: number): Room | null {
  const loop = loopContaining(loops, x, y);
  if (!loop) return null;
  for (const rm of rooms) {
    if (loopContaining(loops, rm.anchor.x, rm.anchor.y) === loop) return rm;
  }
  return null;
}

// Like resolveRoomForPoint, but tolerant of points sitting exactly ON a wall
// line — doors, windows, and flush-mounted fixtures (switches, fireplaces) land
// on the boundary, which pointInPolygon excludes, so an exact resolve would drop
// them into "no room". Try the exact point first, then probe a small ring of
// offsets and return the first room hit. Deterministic probe order: +y, -y, +x,
// -x, then the four diagonals. A boundary point touching two rooms goes to
// whichever probe lands first — deterministic and acceptable.
export function resolveRoomForPointFuzzy(
  rooms: Room[], loops: Vec2[][], x: number, y: number, probeMm = 250,
): Room | null {
  const exact = resolveRoomForPoint(rooms, loops, x, y);
  if (exact) return exact;
  const d = probeMm;
  const offsets: Vec2[] = [
    { x: 0, y: d }, { x: 0, y: -d }, { x: d, y: 0 }, { x: -d, y: 0 },
    { x: d, y: d }, { x: -d, y: d }, { x: d, y: -d }, { x: -d, y: -d },
  ];
  for (const o of offsets) {
    const rm = resolveRoomForPoint(rooms, loops, x + o.x, y + o.y);
    if (rm) return rm;
  }
  return null;
}

// Display text for a room label. Rooms are created unnamed (placeholder shows
// immediately so the user sees the loop was detected); `placeholder` lets
// renderers style the fallback text dimmer / italic.
export function roomLabel(rm: Room): { text: string; placeholder: boolean } {
  const t = rm.name.trim();
  return t ? { text: t, placeholder: false } : { text: 'Unnamed room', placeholder: true };
}

// ── Wall openings (doors / windows cut gaps into wall segments) ──────────
// A door's (x, y) is its HINGE; its span runs w mm along its rotation.
// doorSpanCenter gives the midpoint used for wall cutting. Windows' (x, y)
// is already the pane center.
export function doorSpanCenter(d: { x: number; y: number; w: number; rotation: number }): Vec2 {
  const t = (d.rotation || 0) * Math.PI / 180;
  return { x: d.x + Math.cos(t) * d.w / 2, y: d.y - Math.sin(t) * d.w / 2 };
}

// Window opening geometry defaults (mm). `sill` = bottom of glass above floor;
// `height` = glass height (the 3D header derives as sill + height). Shared by the
// 3D wall cut and the pane builder so the solid runs and the glass line up.
export const WINDOW_DEFAULTS = { sill: 900, height: 800 };

// A window cut also carries its sill/height so the 3D wall builder can size the
// sub-sill and header runs per-window (doors leave these undefined). A door cut
// may carry `head` — the opening-top height where its lintel starts (garage doors
// use the taller GARAGE_DOOR_H; swing doors leave it undefined → the DOOR_HEAD default).
export interface WallOpeningCut { t0: number; t1: number; kind: 'door' | 'window'; sill?: number; height?: number; head?: number; }

// For one wall segment a→b: which door/window openings cut it, and what
// solid sub-intervals remain. t values are mm along the segment. An opening
// counts when its center projects onto the segment within `tol` of the axis.
export function wallCutsForSegment(
  a: Vec2, b: Vec2,
  doors: { x: number; y: number; w: number; rotation: number; kind?: 'swing' | 'garage' }[],
  windows: { x: number; y: number; w: number; sill?: number; height?: number }[],
  tol = 150,
): { solids: { t0: number; t1: number }[]; openings: WallOpeningCut[] } {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return { solids: [], openings: [] };
  const ux = dx / len, uy = dy / len;
  const openings: WallOpeningCut[] = [];
  const collect = (cx: number, cy: number, w: number, kind: 'door' | 'window',
                   extra?: { sill?: number; height?: number; head?: number }) => {
    const px = cx - a.x, py = cy - a.y;
    const t = px * ux + py * uy;
    const perp = Math.abs(-uy * px + ux * py);
    if (perp > tol || t < -w / 2 || t > len + w / 2) return;
    const t0 = Math.max(0, t - w / 2), t1 = Math.min(len, t + w / 2);
    if (t1 - t0 > 10) openings.push({ t0, t1, kind, ...extra });
  };
  for (const d of doors) {
    const c = doorSpanCenter(d);
    collect(c.x, c.y, d.w, 'door', d.kind === 'garage' ? { head: GARAGE_DOOR_H } : undefined);
  }
  for (const w of windows) collect(w.x, w.y, w.w, 'window', { sill: w.sill, height: w.height });
  if (!openings.length) return { solids: [{ t0: 0, t1: len }], openings };
  const sorted = [...openings].sort((c1, c2) => c1.t0 - c2.t0);
  const solids: { t0: number; t1: number }[] = [];
  let cursor = 0;
  for (const c of sorted) {
    if (c.t0 > cursor + 1) solids.push({ t0: cursor, t1: c.t0 });
    cursor = Math.max(cursor, c.t1);
  }
  if (cursor < len - 1) solids.push({ t0: cursor, t1: len });
  return { solids, openings };
}

// Default visual properties for fixtures.
export const LIGHT_DEFAULTS = { height: 2500, radius: 900, intensity: 1, iconKind: 'bulb' as LightIconKind };
export const SWITCH_DEFAULTS = { height: 1200, rotation: 0, size: 320, labelPos: 'bottom' as const };
export const MOTION_DEFAULTS = { color: '#ba68c8', intensity: 1 };
export const BLE_PROXY_DEFAULTS = { height: 2400, color: '#26c6da' };

export function bleProxyHeight(b: { height?: number }): number {
  return b.height ?? BLE_PROXY_DEFAULTS.height;
}
// Normalize a MAC / bluetooth connection value to bare lowercase hex for
// comparison (strips colons / dashes so `aa:bb…` and `aabb…` match).
export function normMac(v: string | null | undefined): string {
  return (v ?? '').toLowerCase().replace(/[^0-9a-f]/g, '');
}

// Per-sensor target tint palette. Sensor index in floor.sensors picks the
// default; users can override via Sensor.color.
export const SENSOR_PALETTE = [
  '#4fc3f7', '#81c784', '#ffb74d', '#ba68c8',
  '#f06292', '#4dd0e1', '#aed581', '#ff8a65',
];

export function lightHeight(l: { height?: number }): number   { return l.height ?? LIGHT_DEFAULTS.height; }
export function lightRadius(l: { radius?: number }): number   { return l.radius ?? LIGHT_DEFAULTS.radius; }
export function lightIntensity(l: { intensity?: number }): number { return l.intensity ?? LIGHT_DEFAULTS.intensity; }
export function lightRotation(l: { rotation?: number }): number { return l.rotation ?? 0; }
export function lightLength(l: { length?: number }): number {
  return Math.max(300, Math.min(15000, l.length ?? 2000));
}
export function lightIconKind(l: { iconKind?: LightIconKind }): LightIconKind {
  return l.iconKind ?? LIGHT_DEFAULTS.iconKind;
}

// Stairs-family kinds a step light can mount flush against.
export const STEP_LIGHT_EDGE_KINDS = new Set<FurnitureKind>(['stairs', 'stairs_half', 'stair_landing']);

// Snap a 'step' light flush to the nearest wall face or stairs-family footprint
// edge (whichever is nearer within `maxDist`). On a WALL: the position lands on
// the wall FACE (the axis offset by wallThick/2 = 50 mm toward the light's
// original side) and the rotation orients the emitting face AWAY from the wall.
// On a STAIR edge: the position lands ON the edge and the face points outward
// from the footprint. Mutates x / y / rotation; returns true iff it snapped.
// No-op for any non-step light.
//
// Front-direction convention: the 3D body faces local -Z with
// body.rotation.y = -rotation·π/180, and `_w` mirrors X, so a world-2D front
// vector (fx, fy) maps to rotation = atan2(-fx, -fy) degrees (see setFront).
export function snapStepLightToSurface(
  light: { x: number; y: number; rotation?: number; iconKind?: LightIconKind },
  walls: { points: Vec2[]; kind?: WallKind }[],
  furniture: { x: number; y: number; w: number; h: number; kind?: FurnitureKind; rotation?: number }[],
  maxDist = 500,
): boolean {
  if ((light.iconKind ?? LIGHT_DEFAULTS.iconKind) !== 'step') return false;
  const WALL_HALF = 50;  // wallThick / 2

  const closest = (a: Vec2, b: Vec2): Vec2 => {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0
      ? Math.max(0, Math.min(1, ((light.x - a.x) * dx + (light.y - a.y) * dy) / len2))
      : 0;
    return { x: a.x + t * dx, y: a.y + t * dy };
  };

  type Cand = { d: number; qx: number; qy: number; fx: number; fy: number };
  let best: Cand | null = null;

  // 1. Wall faces (skip invisible walls — they're loop-closers, not surfaces).
  for (const w of walls) {
    if ((w.kind ?? 'full') === 'invisible') continue;
    for (let i = 0; i < w.points.length - 1; i++) {
      const A = w.points[i], B = w.points[i + 1];
      const q = closest(A, B);
      const d = Math.hypot(light.x - q.x, light.y - q.y);
      if (d > maxDist || (best && d >= best.d)) continue;
      const ex = B.x - A.x, ey = B.y - A.y;
      const eLen = Math.hypot(ex, ey) || 1;
      let nx = -ey / eLen, ny = ex / eLen;               // wall normal
      if ((light.x - q.x) * nx + (light.y - q.y) * ny < 0) { nx = -nx; ny = -ny; }
      best = { d, qx: q.x + nx * WALL_HALF, qy: q.y + ny * WALL_HALF, fx: nx, fy: ny };
    }
  }

  // 2. Stairs-family footprint edges (front points outward from the footprint).
  for (const fp of furniture) {
    if (!STEP_LIGHT_EDGE_KINDS.has(fp.kind ?? ('' as FurnitureKind))) continue;
    const corners = ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as [number, number][]).map(([sx, sy]) => {
      const l = furnitureLocalToWorld(fp.rotation, sx * fp.w / 2, sy * fp.h / 2);
      return { x: fp.x + l.x, y: fp.y + l.y };
    });
    for (let i = 0; i < 4; i++) {
      const A = corners[i], B = corners[(i + 1) % 4];
      const q = closest(A, B);
      const d = Math.hypot(light.x - q.x, light.y - q.y);
      if (d > maxDist || (best && d >= best.d)) continue;
      const ex = B.x - A.x, ey = B.y - A.y;
      const eLen = Math.hypot(ex, ey) || 1;
      let nx = -ey / eLen, ny = ex / eLen;               // edge normal
      if ((q.x - fp.x) * nx + (q.y - fp.y) * ny < 0) { nx = -nx; ny = -ny; }  // outward
      best = { d, qx: q.x, qy: q.y, fx: nx, fy: ny };
    }
  }

  if (!best) return false;
  light.x = Math.round(best.qx);
  light.y = Math.round(best.qy);
  light.rotation = Math.atan2(-best.fx, -best.fy) * 180 / Math.PI;
  return true;
}

// ── Wall-edge snap (fireplaces flush to a wall, switches ganged on a wall) ──
// The 3D solid wall run is 100 mm thick (three-renderer `wallThick`), so each
// wall FACE sits 50 mm off the polyline axis. A firebox is 450 mm deep
// (three-renderer firebox `D2`, opening on local −Z); a switch plate box is
// 40 mm deep (three-renderer switch `BoxGeometry` Z). Flush offsets from the
// axis are therefore wallT/2 + halfDepth: 50 + 225 = 275 for a fireplace,
// 50 + 20 = 70 for a switch.
const WALL_HALF_MM = 50;                 // wallThick(100) / 2
export const FIREBOX_DEPTH_MM = 450;     // three-renderer firebox D2
export const SWITCH_PLATE_DEPTH_MM = 40; // three-renderer switch BoxGeometry Z

export interface WallEdgeSnap {
  x: number; y: number;          // nearest point ON the wall axis
  wallAngleDeg: number;          // segment direction, screen-CW degrees
  side: 1 | -1;                  // which perpendicular side the query point is on
  nx: number; ny: number;        // unit normal pointing TOWARD the query point
  dist: number;
  segment: { a: Vec2; b: Vec2 };
}

// Nearest point on any (non-invisible) wall segment to (x, y), within maxMm.
// Locked walls stay valid targets — snapping never mutates the wall. Invisible
// walls (planning boundaries with no 3D geometry) are skipped: a fixture can't
// sit flush against a wall that doesn't render. Returns the axis point, the
// segment's screen-CW angle, and the outward (cursor-side) normal.
export function snapToWallEdge(
  walls: { points: Vec2[]; kind?: WallKind }[],
  x: number, y: number,
  maxMm = 500,
): WallEdgeSnap | null {
  let best: WallEdgeSnap | null = null;
  for (const w of walls) {
    if ((w.kind ?? 'full') === 'invisible') continue;
    for (let i = 0; i < w.points.length - 1; i++) {
      const A = w.points[i], B = w.points[i + 1];
      const dx = B.x - A.x, dy = B.y - A.y;
      const len2 = dx * dx + dy * dy;
      if (len2 < 1) continue;
      const t = Math.max(0, Math.min(1, ((x - A.x) * dx + (y - A.y) * dy) / len2));
      const qx = A.x + t * dx, qy = A.y + t * dy;
      const d = Math.hypot(x - qx, y - qy);
      if (d > maxMm || (best && d >= best.dist)) continue;
      const len = Math.sqrt(len2);
      let nx = -dy / len, ny = dx / len;                 // canonical normal
      const sideSign = (x - qx) * nx + (y - qy) * ny;
      const side: 1 | -1 = sideSign < 0 ? -1 : 1;
      if (side < 0) { nx = -nx; ny = -ny; }              // point toward the query
      best = {
        x: qx, y: qy,
        wallAngleDeg: Math.atan2(-dy, dx) * 180 / Math.PI,
        side, nx, ny, dist: d,
        segment: { a: { x: A.x, y: A.y }, b: { x: B.x, y: B.y } },
      };
    }
  }
  return best;
}

// Fireplace lights lock flush to the nearest wall: the firebox BACK sits on the
// wall face and the opening (local −Z) faces the room (the cursor's side).
// Center = axis + normal·(wallT/2 + FIREBOX_DEPTH/2) = axis + normal·275.
// Rotation follows the light front-axis convention (front = local −Z ⇒
// rotation = atan2(−fx, −fy); see snapStepLightToSurface). No-op for
// non-fireplace lights or when no wall is within maxMm. Mutates x / y /
// rotation; returns whether it snapped.
export function snapFireplaceToWall(
  light: { x: number; y: number; rotation?: number; iconKind?: LightIconKind },
  walls: { points: Vec2[]; kind?: WallKind }[],
  maxMm = 500,
): boolean {
  if ((light.iconKind ?? LIGHT_DEFAULTS.iconKind) !== 'fireplace') return false;
  const hit = snapToWallEdge(walls, light.x, light.y, maxMm);
  if (!hit) return false;
  const off = WALL_HALF_MM + FIREBOX_DEPTH_MM / 2;   // 275
  light.x = Math.round(hit.x + hit.nx * off);
  light.y = Math.round(hit.y + hit.ny * off);
  light.rotation = Math.atan2(-hit.nx, -hit.ny) * 180 / Math.PI;
  return true;
}

// Gang spacing between two switch plates: the larger plate size + a fixed gap.
// Defaults 320 + 75 = 395 (matches the user's hand-built bank pitch).
export const SWITCH_GANG_GAP_MM = 75;
export function gangPitch(sizeA: number, sizeB: number): number {
  return Math.max(sizeA, sizeB) + SWITCH_GANG_GAP_MM;
}

// Nearest FREE along-wall slot for a new gang member. `existingAlongWall` are
// the along-wall coordinates (mm) of switches already in the gang; `pitch` the
// center spacing; `dropAlongWall` where the user dropped along the wall.
// Returns dropAlongWall unchanged when the gang is empty; otherwise steps one
// pitch off the nearest member on the drop side and walks outward past any
// occupied slots (multi-gang). Pure — exported for testing.
export function gangSlot(existingAlongWall: number[], pitch: number, dropAlongWall: number): number {
  if (!existingAlongWall.length) return dropAlongWall;
  let nearest = existingAlongWall[0];
  for (const a of existingAlongWall) {
    if (Math.abs(a - dropAlongWall) < Math.abs(nearest - dropAlongWall)) nearest = a;
  }
  const dir = dropAlongWall >= nearest ? 1 : -1;
  const tol = pitch * 0.5;
  const occupied = (s: number) => existingAlongWall.some(a => Math.abs(a - s) < tol);
  let slot = nearest + dir * pitch;
  let guard = 0;
  while (occupied(slot) && guard++ < 64) slot += dir * pitch;
  return Math.round(slot);
}

// Switches lock onto the nearest wall (plate flush: center = axis + normal·70)
// and GANG with other switches already on the same wall segment. A gang member
// shares this switch's snapped rotation (±5°) and perpendicular offset (±50 mm)
// and sits within 2.5 gang pitches along the wall; the new switch aligns into
// that gang (its offset + rotation) at the nearest free slot on the drop side.
// No wall within maxMm ⇒ no snap (free placement stays possible). Mutates
// sw.x / y / rotation; returns whether it snapped.
//
// Rotation convention: the 2D plate tick / 3D plate front faces local +Z, so
// with the cursor-side normal (nx, ny) the plate rotation is atan2(nx, ny)
// (0 = +Y world; a vertical wall ⇒ 90).
export function snapSwitchToWall(
  sw: { id: string; x: number; y: number; rotation?: number; size?: number },
  switches: { id: string; x: number; y: number; rotation?: number; size?: number }[],
  walls: { points: Vec2[]; kind?: WallKind }[],
  maxMm = 500,
): boolean {
  const hit = snapToWallEdge(walls, sw.x, sw.y, maxMm);
  if (!hit) return false;
  const A = hit.segment.a, B = hit.segment.b;
  const dx = B.x - A.x, dy = B.y - A.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;          // along the wall
  const cx = -dy / len, cy = dx / len;         // canonical normal (matches snapToWallEdge)
  const off = WALL_HALF_MM + SWITCH_PLATE_DEPTH_MM / 2;   // 70
  const rotW = Math.atan2(hit.nx, hit.ny) * 180 / Math.PI;
  const myPerp = hit.side * off;               // signed offset from the axis
  const myAlong = (sw.x - A.x) * ux + (sw.y - A.y) * uy;
  const mySize = switchSize(sw);

  const rotDiff = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180);
  const members: { along: number; perp: number; rot: number; size: number }[] = [];
  for (const o of switches) {
    if (o.id === sw.id) continue;
    const operp = (o.x - A.x) * cx + (o.y - A.y) * cy;
    const oalong = (o.x - A.x) * ux + (o.y - A.y) * uy;
    const orot = switchRotation(o);
    if (rotDiff(orot, rotW) > 5) continue;
    // Same SIDE of this wall and reasonably near it — NOT compared against the
    // flush offset: hand-placed banks sit farther off-axis (the user's at
    // ~230 mm), and joining their gang adopts THEIR offset (below) instead of
    // demanding they match the flush constant.
    if (Math.sign(operp) !== hit.side || Math.abs(operp) > 400) continue;
    if (Math.abs(oalong - myAlong) > 2.5 * gangPitch(mySize, switchSize(o))) continue;
    members.push({ along: oalong, perp: operp, rot: orot, size: switchSize(o) });
  }

  let along = myAlong, perp = myPerp, rot = rotW;
  if (members.length) {
    let closest = members[0];
    for (const m of members) {
      if (Math.abs(m.along - myAlong) < Math.abs(closest.along - myAlong)) closest = m;
    }
    along = gangSlot(members.map(m => m.along), gangPitch(mySize, closest.size), myAlong);
    perp = closest.perp;   // align the whole bank onto the gang's offset + rotation
    rot = closest.rot;
  }

  sw.x = Math.round(A.x + ux * along + cx * perp);
  sw.y = Math.round(A.y + uy * along + cy * perp);
  sw.rotation = rot;
  return true;
}

// ── Alarm keypad fixture (Feature 3) ──────────────────────────────────────
export const ALARM_DEFAULTS = { height: 1400, size: 320 };
export const ALARM_PLATE_DEPTH_MM = 30;     // three-renderer keypad BoxGeometry Z
// Arm-state screen colors (shared 2D + 3D). arming/pending pulse amber;
// triggered pulses red; the rest are steady.
export const ALARM_STATE_COLORS: Record<string, string> = {
  disarmed:            '#66bb6a',
  armed_home:          '#42a5f5',
  armed_night:         '#5c6bc0',
  armed_away:          '#7e57c2',
  armed_vacation:      '#7e57c2',
  armed_custom_bypass: '#7e57c2',
  arming:              '#ffb74d',
  pending:             '#ffb74d',
  triggered:           '#ef5350',
  disabled:            '#78909c',
};
export function alarmStateColor(state: string | null | undefined): string {
  return (state && ALARM_STATE_COLORS[state]) || '#90a4ae';
}
// Alarm plates wall-snap flush like a switch (plate BACK on the wall face,
// screen facing the room), but NEVER gang. Center = axis + normal·(wallT/2 +
// plateDepth/2) = axis + normal·65. Rotation = atan2(nx, ny) (plate front =
// local +Z; 0 = +Y world), matching the switch convention. Mutates x/y/rotation;
// returns whether it snapped.
export function snapAlarmToWall(
  ap: { x: number; y: number; rotation?: number },
  walls: { points: Vec2[]; kind?: WallKind }[],
  maxMm = 500,
): boolean {
  const hit = snapToWallEdge(walls, ap.x, ap.y, maxMm);
  if (!hit) return false;
  const off = WALL_HALF_MM + ALARM_PLATE_DEPTH_MM / 2;   // 65
  ap.x = Math.round(hit.x + hit.nx * off);
  ap.y = Math.round(hit.y + hit.ny * off);
  ap.rotation = Math.atan2(hit.nx, hit.ny) * 180 / Math.PI;
  return true;
}
export function alarmHeight(a: { height?: number }): number { return a.height ?? ALARM_DEFAULTS.height; }

// ── Smoke / CO safety detectors (Feature: safety sensors) ──────────────────
// Ceiling-mounted disc; the 3D puck hangs just below ceiling height. No wall
// snap (free placement like a motion sensor).
export const SAFETY_DEFAULTS = {
  ceilingMm: 2743, discRadiusMm: 120,
  leakFloorMm: 15,        // leak detectors sit ON the floor (small puck)
  leakMaxRadiusMm: 600,   // puddle grows to this radius while alarming
  leakGrowSec: 30,        // seconds to reach full puddle radius
};
// Beacon / puck color per kind. Shared 2D + 3D: red smoke, amber CO, amber-green
// gas, blue leak (its puddle).
export function safetyColor(kind: SafetyKind): string {
  switch (kind) {
    case 'co': return '#ff9800';
    case 'gas': return '#c0ca33';   // amber-green
    case 'leak': return '#42a5f5';  // water blue
    default: return '#ef5350';      // smoke red
  }
}
export function safetyGlyph(kind: SafetyKind): string {
  switch (kind) {
    case 'co': return 'CO';
    case 'gas': return 'GAS';
    case 'leak': return '💧';
    default: return '';
  }
}
// leak sits on the floor; smoke/co/gas hang from the ceiling.
export function safetyIsFloor(kind: SafetyKind): boolean { return kind === 'leak'; }

// ── Robot fixtures (vacuum / mower) ────────────────────────────────────────
// Dock footprint (mm) + robot body dims + roam speeds. The dock is the parked
// charging base; the robot body roams away and returns.
export const ROBOT_DEFAULTS = {
  vacuum: { bodyR: 170, bodyH: 95, speed: 300, dockW: 420, dockD: 260 },   // ~340 mm dia puck; 0.30 m/s
  mower:  { bodyW: 600, bodyD: 450, bodyH: 260, speed: 420, dockW: 720, dockD: 520 }, // 0.42 m/s
};
export function robotGlyph(kind: 'vacuum' | 'mower'): string {
  return kind === 'mower' ? '🌱' : '🧹';
}
// Color of the status LED for a resolved robot activity string (shared 2D + 3D).
export function robotLedColor(activity: string): string {
  switch (activity) {
    case 'cleaning': case 'mowing': return '#43a047';  // green — working
    case 'returning':               return '#2196f3';  // blue — heading to dock
    case 'error':                   return '#e53935';  // red — fault (blinks)
    case 'paused':                  return '#ffb300';  // amber — stopped
    case 'docked':                  return '#ffca28';  // amber — charging (breathes)
    default:                        return '#78909c';  // idle — dim
  }
}
export function robotColor(kind: 'vacuum' | 'mower'): string {
  return kind === 'mower' ? '#66bb6a' : '#455a64';
}

// Do segments p1→p2 and p3→p4 properly intersect? Pure, deterministic. Used by
// the robot movement controller for straight-line wall avoidance (test a
// proposed move segment against solid wall runs). Colinear/touching-endpoint
// cases return false (treated as non-blocking — good enough for a puck).
export function segmentsIntersect(
  p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2,
): boolean {
  const d = (a: Vec2, b: Vec2, c: Vec2) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2);
  const d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
         ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// Does the segment (x0,y0)→(x1,y1) cross any SOLID wall run? Invisible walls
// (planning boundaries) are passable; door/window spans are gaps (via
// wallCutsForSegment) so a robot walks through openings. Pure — shared by the
// robot controller (Planner._segCrossesWall) and its test page.
export function segCrossesSolidWall(
  walls: { points: Vec2[]; kind?: WallKind }[],
  doors: { x: number; y: number; w: number; rotation: number }[],
  windows: { x: number; y: number; w: number; sill?: number; height?: number }[],
  x0: number, y0: number, x1: number, y1: number,
): boolean {
  const p1 = { x: x0, y: y0 }, p2 = { x: x1, y: y1 };
  for (const w of walls) {
    if (wallKind(w) === 'invisible') continue;
    const pts = w.points;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < 1) continue;
      const ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
      const { solids } = wallCutsForSegment(a, b, doors, windows);
      for (const s of solids) {
        const sa = { x: a.x + ux * s.t0, y: a.y + uy * s.t0 };
        const sb = { x: a.x + ux * s.t1, y: a.y + uy * s.t1 };
        if (segmentsIntersect(p1, p2, sa, sb)) return true;
      }
    }
  }
  return false;
}

// Coarse outdoor sweep waypoints for a simulated mower: grid cells inside the
// floor rect (0..w × 0..d) but OUTSIDE every closed wall loop, ordered
// boustrophedon (alternate rows reversed). Empty → the caller orbits an ellipse
// ring. Pure — shared by Planner._mowerWaypoints and its test page.
export function mowerSweepWaypoints(
  walls: { points: Vec2[]; kind?: WallKind }[],
  w: number, d: number, cell = 800, margin = 300,
): Vec2[] {
  const loops = closedWallLoops(walls);
  const wps: Vec2[] = [];
  let row = 0;
  for (let gy = margin; gy <= d - margin; gy += cell, row++) {
    const cells: Vec2[] = [];
    for (let gx = margin; gx <= w - margin; gx += cell) {
      let inside = false;
      for (const lp of loops) { if (pointInPolygon(gx, gy, lp)) { inside = true; break; } }
      if (!inside) cells.push({ x: gx, y: gy });
    }
    if (row % 2) cells.reverse();
    for (const c of cells) wps.push(c);
  }
  return wps;
}

// Nearest candidate coordinate to `v` within `tol` (else null). Drives the
// smart alignment guides (Feature C) — applied per-axis independently. Pure,
// exported for testing.
export function nearestAlign(v: number, candidates: number[], tol: number): number | null {
  let best: number | null = null, bd = tol;
  for (const c of candidates) {
    const d = Math.abs(c - v);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

// Per-device power glow (#8). Maps a live power reading (W) to a 0..1 intensity
// multiplier for the in-use appliance glow / LED: sqrt ramp, full at ~1500 W,
// floored at 0.25 so a barely-on device still reads. A non-finite / ≤5 W reading
// returns 1 (no scaling — the caller uses this only when a reading exists). Pure.
export function powerGlowScale(watts: number): number {
  if (!isFinite(watts) || watts <= 5) return 1;
  return Math.max(0.25, Math.min(1, Math.sqrt(watts / 1500)));
}

export function switchHeight(s: { height?: number }): number  { return s.height ?? SWITCH_DEFAULTS.height; }
export function switchRotation(s: { rotation?: number }): number { return s.rotation ?? SWITCH_DEFAULTS.rotation; }
export function switchSize(s: { size?: number }): number {
  return Math.max(100, Math.min(1500, s.size ?? SWITCH_DEFAULTS.size));
}
export function switchLabelPos(s: { labelPos?: 'bottom' | 'top' | 'left' | 'right' | 'hide' }): 'bottom' | 'top' | 'left' | 'right' | 'hide' {
  return s.labelPos ?? SWITCH_DEFAULTS.labelPos;
}
export function motionColor(m: { color?: string }): string { return m.color ?? MOTION_DEFAULTS.color; }
export function motionIntensity(m: { intensity?: number }): number {
  return m.intensity ?? MOTION_DEFAULTS.intensity;
}
export function sensorColor(s: { color?: string }, idx: number): string {
  return s.color ?? SENSOR_PALETTE[idx % SENSOR_PALETTE.length];
}

// Effective 3D/2D tint for a furniture piece: per-piece `color` override (hex)
// wins, else the resolved kind/recipe default. Returns an int (0xRRGGBB) so it
// drops straight into the material factories / hexToRgba call sites.
export function furnitureColor(
  f: { color?: string; kind?: FurnitureKind; customKindId?: string },
  customObjects?: ObjectRecipe[],
): number {
  if (f.color) return hexToInt(f.color);
  return resolveFurnitureDef(f as Furniture, customObjects).color;
}

// ── Environmental sensor kinds ────────────────────────────────────────────
// Glyph + base color per kind, plus alert thresholds (value ≥ warn → amber,
// ≥ danger → red) for the kinds where the reading has a health meaning.
// Thresholds assume the entity's native unit (ppm for CO₂/CO, µg/m³ for PM).
export const ENV_DEFAULTS = { height: 1500, scale: 1 };
export const ENV_SCALE_MIN = 0.4, ENV_SCALE_MAX = 4;

export interface EnvKindDef {
  glyph: string;
  color: string;
  warn?: number;
  danger?: number;
}

export const ENV_KINDS: Record<EnvKind, EnvKindDef> = {
  temperature: { glyph: '🌡', color: '#ff8a65' },
  humidity:    { glyph: '💧', color: '#4fc3f7' },
  co2:         { glyph: 'CO₂', color: '#81c784', warn: 1000, danger: 1500 },
  co:          { glyph: 'CO', color: '#81c784', warn: 9, danger: 35 },
  pm:          { glyph: '⁂', color: '#9575cd', warn: 12, danger: 35 },
  voc:         { glyph: '⌬', color: '#9ccc65', warn: 500, danger: 1500 },
  pressure:    { glyph: '◉', color: '#b0bec5' },
  illuminance: { glyph: '☀', color: '#ffd54f' },
  // radon (Bq/m³): WHO reference level ~100, EPA action ≈148 — use 100 warn / 300 danger.
  radon:       { glyph: '☢', color: '#7e57c2', warn: 100, danger: 300 },
  // sound (dB, device_class sound_pressure): 70 warn / 85 danger (OSHA hearing-risk band).
  sound:       { glyph: '🔊', color: '#4dd0e1', warn: 70, danger: 85 },
  // NO₂ (µg/m³): WHO 1-h ~200, annual ~40 — 40 warn / 200 danger.
  no2:         { glyph: 'NO₂', color: '#a1887f', warn: 40, danger: 200 },
  // O₃ (µg/m³): WHO 8-h ~100, 1-h high ~180 — 100 warn / 180 danger.
  o3:          { glyph: 'O₃', color: '#4db6ac', warn: 100, danger: 180 },
  // AQI (unitless US bands): 100 = moderate/unhealthy-for-sensitive edge, 150 = unhealthy.
  aqi:         { glyph: 'AQI', color: '#7986cb', warn: 100, danger: 150 },
  generic:     { glyph: '◈', color: '#90a4ae' },
};

// Derive the kind from HA's device_class attribute (or the sensor's manual
// override). Falls back to 'generic' for anything unrecognized.
export function envKindOf(
  e: { kind?: EnvKind },
  st: { attributes: Record<string, unknown> } | null,
): EnvKind {
  if (e.kind) return e.kind;
  const dc = String(st?.attributes?.device_class ?? '');
  switch (dc) {
    case 'temperature': return 'temperature';
    case 'humidity': case 'moisture': return 'humidity';
    case 'carbon_dioxide': return 'co2';
    case 'carbon_monoxide': return 'co';
    case 'pm1': case 'pm10': case 'pm25': return 'pm';
    case 'volatile_organic_compounds':
    case 'volatile_organic_compounds_parts': return 'voc';
    case 'pressure': case 'atmospheric_pressure': return 'pressure';
    case 'illuminance': return 'illuminance';
    case 'radon': return 'radon';
    case 'sound_pressure': return 'sound';
    case 'nitrogen_dioxide': return 'no2';
    case 'ozone': return 'o3';
    case 'aqi': return 'aqi';
    default: return 'generic';
  }
}

export function envHeight(e: { height?: number }): number { return e.height ?? ENV_DEFAULTS.height; }
export function envScale(e: { scale?: number }): number {
  const s = e.scale ?? ENV_DEFAULTS.scale;
  return Math.max(ENV_SCALE_MIN, Math.min(ENV_SCALE_MAX, s));
}

// Display color for a reading: kind base color, escalated by alert thresholds.
export function envColor(kind: EnvKind, value: number): string {
  const def = ENV_KINDS[kind];
  if (isFinite(value) && def.danger !== undefined && value >= def.danger) return '#ef5350';
  if (isFinite(value) && def.warn !== undefined && value >= def.warn) return '#ffb74d';
  return def.color;
}

// "21.4 °C" / "612 ppm" / "—" from an HA state envelope.
export function envValueText(st: { state: string; attributes: Record<string, unknown> } | null): string {
  if (!st || st.state === 'unavailable' || st.state === 'unknown') return '—';
  const v = parseFloat(st.state);
  const unit = String(st.attributes?.unit_of_measurement ?? '').trim();
  if (isNaN(v)) return st.state;
  const num = Math.abs(v) >= 100 ? Math.round(v).toString() : (Math.round(v * 10) / 10).toString();
  return unit ? `${num} ${unit}` : num;
}

// Furniture kind defaults: footprint (mm) + 3D height (mm) + tint.
// `back` flags whether the kind has an implied backrest on the +Y edge.
export type FurnitureCat = 'furniture' | 'appliance' | 'bathroom';

export interface FurnitureKindDef {
  label: string;
  w: number; h: number;            // default footprint mm (h = depth in plan)
  ht: number;                      // 3D height mm (top of body)
  seat?: number;                   // 3D seat-top height for chair-like pieces.
                                   // Presence also marks the piece SITTABLE
                                   // for humanoid seating (three-renderer).
  back?: 'none' | 'tall' | 'low';  // backrest size
  color: number;                   // 3D tint
  rug?: boolean;                   // flat-on-floor flag
  cat?: FurnitureCat;              // sidebar grouping; default 'furniture'
  activity?: ActivityKind;         // contextual activity this piece anchors (Sims behavior)
  surface?: boolean;               // counter-height top other pieces can sit ON (auto-snap host)
  mountable?: boolean;             // sits on a `surface` piece rather than the floor (auto-snap subject)
  frontArrow?: boolean;            // show the 2D front chevron when selected; default true, set false on symmetric kinds
}

export const FURNITURE_KINDS: Record<FurnitureKind, FurnitureKindDef> = {
  block:         { label: 'Block',         w: 600,  h: 600,  ht: 600,  back: 'none', color: 0x8d6e63, frontArrow: false },
  table:         { label: 'Table',         w: 1500, h: 900,  ht: 750,  back: 'none', color: 0x8d6e63, activity: 'eat_at_table' },
  chair:         { label: 'Chair',         w: 500,  h: 500,  ht: 900,  seat: 450, back: 'tall', color: 0x6d4c41 },
  rocking_chair: { label: 'Rocking chair', w: 600,  h: 800,  ht: 1000, seat: 450, back: 'tall', color: 0x5d4037 },
  chaise:        { label: 'Chaise',        w: 1800, h: 750,  ht: 600,  seat: 400, back: 'low',  color: 0x795548 },
  bench:         { label: 'Bench',         w: 1500, h: 400,  ht: 450,  seat: 440, back: 'none', color: 0x6d4c41 },
  desk:          { label: 'Desk',          w: 1400, h: 700,  ht: 750,  back: 'none', color: 0x4e342e, surface: true, activity: 'work_at_desk' },
  sofa:          { label: 'Sofa',          w: 2000, h: 900,  ht: 850,  seat: 450, back: 'tall', color: 0x37474f },
  sofa_l_left:   { label: 'Sofa · L (left)',  w: 2600, h: 1800, ht: 850, seat: 450, back: 'tall', color: 0x37474f },
  sofa_l_right:  { label: 'Sofa · L (right)', w: 2600, h: 1800, ht: 850, seat: 450, back: 'tall', color: 0x37474f },
  sofa_u:        { label: 'Sofa · U',         w: 3200, h: 2000, ht: 850, seat: 450, back: 'tall', color: 0x37474f },
  bed:           { label: 'Bed',           w: 2000, h: 1500, ht: 500,  back: 'low',  color: 0x546e7a, activity: 'sleep_shared' },
  rug:           { label: 'Rug',           w: 2000, h: 1400, ht: 5,    back: 'none', color: 0x5d4037, rug: true, frontArrow: false },
  bookshelf:     { label: 'Bookshelf',     w: 800,  h: 350,  ht: 1800, back: 'none', color: 0x3e2723, activity: 'browse_bookshelf' },
  // Stairs rise toward the piece's back (plan-top); rotate to aim. Full run
  // climbs a 9 ft storey; half run + landing + rotated half run composes an
  // L or U staircase.
  stairs:        { label: 'Stairs (full flight)', w: 1000, h: 3600, ht: 2743, back: 'none', color: 0x8d6e63 },
  stairs_half:   { label: 'Stairs (half flight)', w: 1000, h: 1800, ht: 1372, back: 'none', color: 0x8d6e63 },
  stair_landing: { label: 'Stair landing',        w: 1000, h: 1000, ht: 1372, back: 'none', color: 0x8d6e63 },
  coffee_table:  { label: 'Coffee table',  w: 1100, h: 600,  ht: 450,  back: 'none', color: 0x795548 },
  tv_stand:      { label: 'TV stand',      w: 1600, h: 450,  ht: 550,  back: 'none', color: 0x4e342e, surface: true },
  dresser:       { label: 'Dresser',       w: 1200, h: 500,  ht: 900,  back: 'none', color: 0x6d4c41, surface: true },
  nightstand:    { label: 'Nightstand',    w: 500,  h: 400,  ht: 600,  back: 'none', color: 0x6d4c41, surface: true },
  wardrobe:      { label: 'Wardrobe',      w: 1200, h: 600,  ht: 2000, back: 'none', color: 0x5d4037 },
  ottoman:       { label: 'Ottoman',       w: 700,  h: 700,  ht: 400,  seat: 380, back: 'none', color: 0x607d8b, frontArrow: false },
  stool:         { label: 'Stool',         w: 400,  h: 400,  ht: 650,  seat: 620, back: 'none', color: 0x6d4c41, frontArrow: false },
  plant:         { label: 'Plant',         w: 400,  h: 400,  ht: 1400, back: 'none', color: 0x33691e, frontArrow: false, activity: 'tend_plant' },
  counter:       { label: 'Counter',       w: 1800, h: 650,  ht: 900,  back: 'none', color: 0x8d6e63, surface: true },
  island:        { label: 'Island',        w: 2000, h: 1000, ht: 900,  back: 'none', color: 0x8d6e63, surface: true, frontArrow: false },
  cabinet:       { label: 'Cabinet',       w: 900,  h: 400,  ht: 2000, back: 'none', color: 0x5d4037 },
  // Appliances — footprints follow common US spec sizes.
  fridge:        { label: 'Refrigerator',  w: 910,  h: 760,  ht: 1780, back: 'none', color: 0x9fa8b3, cat: 'appliance', activity: 'forage_fridge' },
  stove:         { label: 'Stove / range', w: 760,  h: 660,  ht: 910,  back: 'none', color: 0x90979e, cat: 'appliance' },
  dishwasher:    { label: 'Dishwasher',    w: 610,  h: 620,  ht: 860,  back: 'none', color: 0x9fa8b3, cat: 'appliance', activity: 'load_dishwasher' },
  washer:        { label: 'Washer',        w: 690,  h: 700,  ht: 990,  back: 'none', color: 0xcfd8dc, cat: 'appliance' },
  dryer:         { label: 'Dryer',         w: 690,  h: 700,  ht: 990,  back: 'none', color: 0xcfd8dc, cat: 'appliance' },
  microwave:     { label: 'Microwave',     w: 520,  h: 390,  ht: 320,  back: 'none', color: 0x37474f, cat: 'appliance', mountable: true },
  tv:            { label: 'TV',            w: 1450, h: 250,  ht: 1100, back: 'none', color: 0x212529, cat: 'appliance', activity: 'watch_tv' },
  wall_tv:       { label: 'Wall-mount TV', w: 1300, h: 180,  ht: 1550, back: 'none', color: 0x1c1f23, cat: 'appliance', activity: 'watch_tv' },
  kitchen_sink:  { label: 'Kitchen sink',  w: 900,  h: 650,  ht: 900,  back: 'none', color: 0x8d6e63, cat: 'appliance', surface: true, activity: 'wash_hands' },
  coffee_maker:  { label: 'Coffee maker',  w: 250,  h: 250,  ht: 350,  back: 'none', color: 0x37474f, cat: 'appliance', activity: 'make_coffee', mountable: true },
  toaster:       { label: 'Toaster',       w: 300,  h: 200,  ht: 220,  back: 'none', color: 0xb0bec5, cat: 'appliance', mountable: true },
  // Bathroom
  toilet:        { label: 'Toilet',        w: 480,  h: 700,  ht: 780,  seat: 420, back: 'none', color: 0xf5f5f0, cat: 'bathroom', activity: 'toilet' },
  sink:          { label: 'Sink',          w: 560,  h: 470,  ht: 860,  back: 'none', color: 0xf5f5f0, cat: 'bathroom', activity: 'wash_hands' },
  sink_vanity:   { label: 'Sink vanity',   w: 760,  h: 550,  ht: 860,  back: 'none', color: 0xd7ccc8, cat: 'bathroom', activity: 'wash_hands' },
  bathtub:       { label: 'Bathtub',       w: 1520, h: 760,  ht: 560,  back: 'none', color: 0xf5f5f0, cat: 'bathroom', activity: 'bathe' },
  shower:        { label: 'Shower',        w: 910,  h: 910,  ht: 2000, back: 'none', color: 0xe3e6e8, cat: 'bathroom', activity: 'shower' },
  // Fitness
  exercise_equipment: { label: 'Exercise equipment', w: 700, h: 1600, ht: 1300, back: 'none', color: 0x424242, cat: 'furniture', activity: 'exercise' },
};

export function furnitureCat(def: FurnitureKindDef): FurnitureCat { return def.cat ?? 'furniture'; }

export function furnitureKind(f: { kind?: FurnitureKind }): FurnitureKind {
  return f.kind ?? 'block';
}
export function furnitureDef(f: { kind?: FurnitureKind }): FurnitureKindDef {
  return FURNITURE_KINDS[furnitureKind(f)];
}

// Resolve the effective def for a piece: a custom recipe when `customKindId`
// points to one, else the built-in kind def. A dangling customKindId (recipe
// deleted) falls back to `block` so orphaned instances still render.
export function resolveFurnitureDef(f: Furniture, customObjects?: ObjectRecipe[]): FurnitureKindDef {
  if (f.customKindId) {
    const rec = customObjects?.find(o => o.id === f.customKindId);
    return rec ?? FURNITURE_KINDS.block;
  }
  return furnitureDef(f);
}

// Convert a world delta (dx, dy) into the piece-local frame, where rotation
// is screen-CW degrees. local +Y stays the "front" (backrest / headboard side).
export function furnitureWorldToLocal(rotationDeg: number | undefined, dx: number, dy: number): Vec2 {
  const rotR = (rotationDeg ?? 0) * Math.PI / 180;
  const c = Math.cos(rotR), s = Math.sin(rotR);
  return { x: dx * c - dy * s, y: dx * s + dy * c };
}

// Door endpoint in world mm. `rotation` is degrees screen-CW; closed door
// panel runs from (x, y) (the hinge) to this endpoint along the wall axis.
export function doorEndpoint(d: { x: number; y: number; w: number; rotation: number },
                              extraDeg = 0): Vec2 {
  const rotR = (d.rotation + extraDeg) * Math.PI / 180;
  return { x: d.x + d.w * Math.cos(rotR), y: d.y - d.w * Math.sin(rotR) };
}

// Open-state extra degrees off `rotation`. Right-hinge = swing CCW on screen
// (open is rotation−90°); left-hinge = swing CW on screen (open is rotation+90°).
export function doorOpenDeltaDeg(d: { hinge?: 'right' | 'left' }): number {
  return d.hinge === 'left' ? +90 : -90;
}

// Garage-door opening height (mm). Slats fill 0..GARAGE_DOOR_H when closed; the
// wall opening's lintel starts here (see wallCutsForSegment's `head`). Slightly
// taller than the swing-door lintel (DOOR_HEAD 2050) — a garage is ~7 ft.
export const GARAGE_DOOR_H = 2100;

// Shared open-state → 0..1 resolver for doors AND window covers/blinds. Takes the
// already-RESOLVED state (from Planner.effectiveState / itemState — which fold a
// local unbound state into a synthetic {state}), so `localState: 'on'` arrives
// here as state 'on' → 1 for free.
//   binary_sensor  on → 1,  off/unknown/unavailable → 0
//   cover          open → position/100 (else 1); closed → position/100 (else 0);
//                  opening/closing → position/100 (else 0.5)
// For a window blind this is `coverFraction`: 1 = open (shade UP, HA position 100),
// 0 = closed (shade fully DOWN). A garage cover uses it as the roll-up fraction.
export function doorOpenFraction(
  st: { state: string; attributes?: Record<string, unknown> } | null | undefined,
): number {
  if (!st) return 0;
  const rawPos = st.attributes ? st.attributes['current_position'] : undefined;
  const pos = typeof rawPos === 'number' && isFinite(rawPos)
    ? Math.max(0, Math.min(1, rawPos / 100)) : null;
  switch (st.state) {
    case 'on':      return 1;
    case 'open':    return pos != null ? pos : 1;
    case 'closed':  return pos != null ? pos : 0;
    case 'opening':
    case 'closing': return pos != null ? pos : 0.5;
    default:        return 0;   // off / unknown / unavailable → closed
  }
}

// Window endpoints in world mm. (x, y) is the pane CENTER; pane runs ±w/2
// along the wall axis (rotation, screen-CW degrees).
export function windowEndpoints(win: { x: number; y: number; w: number; rotation: number })
    : { a: Vec2; b: Vec2 } {
  const rotR = win.rotation * Math.PI / 180;
  const dx = (win.w / 2) * Math.cos(rotR);
  const dy = -(win.w / 2) * Math.sin(rotR);
  return {
    a: { x: win.x - dx, y: win.y - dy },
    b: { x: win.x + dx, y: win.y + dy },
  };
}

// Inverse of `furnitureWorldToLocal`: piece-local delta back to world delta.
export function furnitureLocalToWorld(rotationDeg: number | undefined, lx: number, ly: number): Vec2 {
  const rotR = (rotationDeg ?? 0) * Math.PI / 180;
  const c = Math.cos(rotR), s = Math.sin(rotR);
  return { x: lx * c + ly * s, y: -lx * s + ly * c };
}

// World-frame corner positions of a furniture piece, accounting for
// rotation. sx / sy ∈ {-1, +1} encode which corner each entry represents in
// the piece's local frame (sx = -1: -x edge, sy = -1: -y / "back" edge).
export interface FurnitureCorner { x: number; y: number; sx: number; sy: number; }
export function furnitureCorners(piece: { x: number; y: number; w: number; h: number;
                                          rotation?: number }): FurnitureCorner[] {
  const out: FurnitureCorner[] = [];
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    const w = furnitureLocalToWorld(piece.rotation, sx * piece.w / 2, sy * piece.h / 2);
    out.push({ x: piece.x + w.x, y: piece.y + w.y, sx, sy });
  }
  return out;
}

// ── Furniture ↔ wall collision (keep pieces off wall slabs) ───────────────
// Walls are 100 mm thick, so each face sits 50 mm off the polyline axis.
// A dropped / moved piece whose rotated footprint straddles a wall segment is
// pushed out perpendicular to that segment so its near edge sits flush against
// the wall face (+5 mm clearance). The same push also acts "magnetically":
// when the piece isn't overlapping but its near edge is within 150 mm of the
// wall face, it snaps flush. Doors/windows are ON walls and never call this;
// invisible walls (planning boundaries) are skipped. Two passes resolve the
// common case where clearing one wall creates a small overlap with a
// perpendicular neighbour. Mutates piece.x / piece.y; returns whether it moved.
const WALL_FACE_MM = 50;      // half of the 100 mm wall thickness
const WALL_CLEAR_MM = 5;      // small gap so the edge isn't exactly coincident
const WALL_MAGNET_MM = 150;   // pull-to-flush range measured from the wall face

export function resolveFurnitureWallCollision(
  piece: { x: number; y: number; w: number; h: number; rotation?: number },
  walls: { points: Vec2[]; kind?: WallKind }[],
  passes = 2,
): boolean {
  const FLUSH = WALL_FACE_MM + WALL_CLEAR_MM;   // 55: resting distance of the near edge
  const REACH = WALL_FACE_MM + WALL_MAGNET_MM;  // 200: act when the near edge is closer than this
  let movedAny = false;
  for (let pass = 0; pass < passes; pass++) {
    let passMoved = false;
    for (const wall of walls) {
      if (wallKind(wall) === 'invisible') continue;
      const pts = wall.points;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) continue;
        const ux = dx / len, uy = dy / len;   // along the wall
        const nx = -uy, ny = ux;              // wall normal (unit)
        const corners = furnitureCorners(piece);
        let pmin = Infinity, pmax = -Infinity, tmin = Infinity, tmax = -Infinity;
        for (const c of corners) {
          const rx = c.x - a.x, ry = c.y - a.y;
          const pp = rx * nx + ry * ny;   // perp offset from axis
          const tt = rx * ux + ry * uy;   // distance along the segment
          if (pp < pmin) pmin = pp;
          if (pp > pmax) pmax = pp;
          if (tt < tmin) tmin = tt;
          if (tt > tmax) tmax = tt;
        }
        // No overlap with the segment span along the wall → this wall's face
        // isn't beside the piece; ignore it entirely.
        if (tmax <= 0 || tmin >= len) continue;
        // Which side is the piece's center on? That side wins (push outward).
        const cpp = (piece.x - a.x) * nx + (piece.y - a.y) * ny;
        if (cpp >= 0) {
          // Near edge is pmin; act if it's overlapping the slab or within magnet
          // range of the +face, then set it flush at +FLUSH.
          if (pmin < REACH) {
            const delta = FLUSH - pmin;
            piece.x += nx * delta; piece.y += ny * delta;
            passMoved = true; movedAny = true;
          }
        } else {
          // Symmetric on the − side: near edge is pmax.
          if (pmax > -REACH) {
            const delta = -FLUSH - pmax;
            piece.x += nx * delta; piece.y += ny * delta;
            passMoved = true; movedAny = true;
          }
        }
      }
    }
    if (!passMoved) break;
  }
  if (movedAny) { piece.x = Math.round(piece.x); piece.y = Math.round(piece.y); }
  return movedAny;
}

// ── Seat ↔ table tuck limit ──────────────────────────────────────────────
// A seat-bearing piece (resolved def has `seat` — chair / bench / stool / …)
// may tuck under an eat/work host (a table or desk: resolved def.activity
// 'eat_at_table' | 'work_at_desk', incl. custom recipes carrying those) only
// until its CENTER reaches the host footprint edge — a sitting body still needs
// to clear the tabletop. If the seat's center lands INSIDE a host's rotation-
// aware footprint, push it OUT along the host-local minimal-translation axis so
// the center rests on the host edge + 150 mm outward — a seated torso extends
// ~70 mm forward of the root (TORSO_D 140) with the belly toward the table, so
// a mere edge-touch still buried the stomach in the slab. Only the DRAGGED seat
// moves (matches the drag-the-seat UX); dragging a table onto chairs is out of
// scope — the table has no `seat`, so this no-ops on it, leaving those seats
// swallowed. Counters / islands are intentionally NOT hosts (only eat/work).
// Runs after resolveFurnitureWallCollision at the same two hooks; the caller's
// `!piece.locked` guard keeps locked seats put. Mutates piece.x/y; returns
// whether it moved.
const SEAT_TUCK_CLEAR_MM = 150;  // outward gap so a seated torso clears the slab
export function resolveSeatTableCollision(
  piece: Furniture,
  furniture: Furniture[],
  customObjects?: ObjectRecipe[],
  passes = 2,
): boolean {
  if (!resolveFurnitureDef(piece, customObjects).seat) return false;
  let movedAny = false;
  for (let pass = 0; pass < passes; pass++) {
    let passMoved = false;
    for (const host of furniture) {
      if (host.id === piece.id) continue;
      const ha = resolveFurnitureDef(host, customObjects).activity;
      if (ha !== 'eat_at_table' && ha !== 'work_at_desk') continue;
      // Seat center in the host's local frame (rotation-aware).
      const l = furnitureWorldToLocal(host.rotation, piece.x - host.x, piece.y - host.y);
      const hx = host.w / 2, hy = host.h / 2;
      if (Math.abs(l.x) >= hx || Math.abs(l.y) >= hy) continue;  // center already outside
      const penX = hx - Math.abs(l.x);   // depth to the ±x edges
      const penY = hy - Math.abs(l.y);   // depth to the ±y edges
      let nlx = l.x, nly = l.y;
      if (penX <= penY) {                 // shallower along local x → push out on x
        nlx = (l.x >= 0 ? 1 : -1) * (hx + SEAT_TUCK_CLEAR_MM);
      } else {                            // push out on local y
        nly = (l.y >= 0 ? 1 : -1) * (hy + SEAT_TUCK_CLEAR_MM);
      }
      const w = furnitureLocalToWorld(host.rotation, nlx, nly);
      piece.x = host.x + w.x;
      piece.y = host.y + w.y;
      passMoved = true; movedAny = true;
    }
    if (!passMoved) break;
  }
  if (movedAny) { piece.x = Math.round(piece.x); piece.y = Math.round(piece.y); }
  return movedAny;
}

// Clip a simple polygon `loop` against the convex quad `rect` (Sutherland–
// Hodgman, rect as the clipper). Returns the intersection polygon (world mm),
// or null when the overlap is empty. Exact for a convex rect clipper against
// any simple subject — used to trim a stairwell well-rect to the part that
// actually lies inside a given floor loop before punching it as a hole.
export function intersectLoopWithRect(loop: Vec2[], rect: Vec2[]): Vec2[] | null {
  if (loop.length < 3 || rect.length < 3) return null;
  // Orient the rect CCW so "inside" is consistently the left of each edge.
  // NOTE: polygonArea here returns the NEGATIVE of the standard shoelace area,
  // so a CCW ring yields a negative value — reverse when it's positive (CW).
  const clip = polygonArea(rect) > 0 ? [...rect].reverse() : rect;
  let output: Vec2[] = loop.slice();
  for (let e = 0; e < clip.length; e++) {
    if (output.length === 0) break;
    const A = clip[e], B = clip[(e + 1) % clip.length];
    const ex = B.x - A.x, ey = B.y - A.y;    // edge direction
    // Signed side: >0 means left of A→B (inside for a CCW clipper).
    const side = (p: Vec2) => ex * (p.y - A.y) - ey * (p.x - A.x);
    const input = output;
    output = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i], prev = input[(i + input.length - 1) % input.length];
      const dCur = side(cur), dPrev = side(prev);
      const curIn = dCur >= 0, prevIn = dPrev >= 0;
      if (curIn) {
        if (!prevIn) {
          const t = dPrev / (dPrev - dCur);
          output.push({ x: prev.x + t * (cur.x - prev.x), y: prev.y + t * (cur.y - prev.y) });
        }
        output.push(cur);
      } else if (prevIn) {
        const t = dPrev / (dPrev - dCur);
        output.push({ x: prev.x + t * (cur.x - prev.x), y: prev.y + t * (cur.y - prev.y) });
      }
    }
  }
  return output.length >= 3 ? output : null;
}

// Hex (#rgb / #rrggbb) → {r,g,b} 0..255. Returns null on parse failure.
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (!isFinite(n)) return null;
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}
export function hexToRgba(hex: string, a: number): string {
  const c = hexToRgb(hex) ?? { r: 186, g: 104, b: 200 };
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}
export function hexToInt(hex: string): number {
  const c = hexToRgb(hex);
  return c ? (c.r << 16) | (c.g << 8) | c.b : 0xba68c8;
}
// Lighten by a 0..1 factor toward white. Returns hex so the result can flow
// back into hexToRgba / hexToInt without re-parsing.
export function lighten(hex: string, t: number): string {
  const c = hexToRgb(hex) ?? { r: 186, g: 104, b: 200 };
  const r = Math.round(c.r + (255 - c.r) * t);
  const g = Math.round(c.g + (255 - c.g) * t);
  const b = Math.round(c.b + (255 - c.b) * t);
  const hh = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hh(r)}${hh(g)}${hh(b)}`;
}
