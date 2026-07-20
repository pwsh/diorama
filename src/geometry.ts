// Pure geometry helpers — no DOM, no state.

import type { Vec2, Sensor, BgImage, LightIconKind, FurnitureKind, EnvKind, WallKind,
  ActivityKind, ObjectRecipe, Furniture, Room, Floor, SafetyKind, GroundKind, GroundArea,
  InfoCard, InfoCardMount, ActionKind, SprinklerHeadKind, Pool,
  Wall, Ruler, RulerEnd } from './types.js';
import { formatEntityValue, formatClock, evalRules, ruleMatches, relTimeText,
  type HassStateLike, type ClockMode, type ValueRule } from './value-rules.js';

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
  for (const vd of f.voidAreas ?? []) for (const pt of vd.points) acc(pt.x, pt.y);
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

// Rotate a plan point (x, y) about the pivot (cx, cy) by `phiDeg` degrees
// SCREEN-CLOCKWISE. World +Y is drawn screen-up, so screen-CW is the sense in
// which the top of the plan swings toward +X as phi grows: the matrix is
//   [x']   [ cosφ  sinφ] [x−cx]   [cx]
//   [y'] = [−sinφ  cosφ] [y−cy] + [cy]
// (i.e. R_std(−φ) — a standard CCW rotation by −φ in the y-up math frame). A
// point at (cx, cy+r) — plan-up of the pivot — maps to (cx + r·sinφ, cy + r·cosφ)
// for φ>0, moving toward +X, so what was "up" rotates clockwise on screen.
// Exact 0/1/−1 factors on the quarter turns keep integer coords drift-free
// (a 90° round-trip is bit-exact). This is THE plan-rotation primitive;
// Planner.rotateFloorContent rotates every placeable through it, and the vacuum
// calibration offset + geo landmarks reuse it (their angle terms subtract φ —
// see rotateFloorContent).
export function rotPointDeg(x: number, y: number, cx: number, cy: number, phiDeg: number): Vec2 {
  const p = ((phiDeg % 360) + 360) % 360;
  let c: number, s: number;
  if (p === 0) { c = 1; s = 0; }
  else if (p === 90) { c = 0; s = 1; }
  else if (p === 180) { c = -1; s = 0; }
  else if (p === 270) { c = 0; s = -1; }
  else { const r = p * Math.PI / 180; c = Math.cos(r); s = Math.sin(r); }
  const dx = x - cx, dy = y - cy;
  return { x: cx + dx * c + dy * s, y: cy - dx * s + dy * c };
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
  fence_picket:    { label: 'Picket fence',     h: 1100 },  // ~43 in
  fence_privacy:   { label: 'Privacy fence',    h: 1800 },  // solid, ~6 ft
  fence_chainlink: { label: 'Chain-link fence', h: 1200 },
  hedge:           { label: 'Hedge',            h: 900 },   // trimmed shrub run
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
  doors: { x: number; y: number; w: number; rotation: number; kind?: 'swing' | 'garage' | 'gate' }[],
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
// Aim tilt above the horizon, degrees (ground_spot only). Default 35°; clamped
// 5..85 so a beam never sits perfectly flat (grazes the ground forever) nor
// perfectly vertical (no ground pool to place). Low tilt → long throw.
export const LIGHT_TILT_DEFAULT = 35;
export function lightTilt(l: { tilt?: number }): number {
  return Math.max(5, Math.min(85, l.tilt ?? LIGHT_TILT_DEFAULT));
}
export function lightLength(l: { length?: number }): number {
  return Math.max(300, Math.min(15000, l.length ?? 2000));
}
export function lightIconKind(l: { iconKind?: LightIconKind }): LightIconKind {
  return l.iconKind ?? LIGHT_DEFAULTS.iconKind;
}

// Stairs-family kinds a step light can mount flush against.
export const STEP_LIGHT_EDGE_KINDS = new Set<FurnitureKind>(['stairs', 'stairs_half', 'stair_landing']);

// Stairs-family kinds (floor transitions). Shared by the cross-floor stair-link
// feature: only these kinds may carry a Furniture.stairLinkId and take part in a
// transit portal. Same membership as STEP_LIGHT_EDGE_KINDS, named for its own use.
export const STAIRS_KINDS = new Set<FurnitureKind>(['stairs', 'stairs_half', 'stair_landing']);
export function isStairsKind(kind?: FurnitureKind): boolean {
  return kind != null && STAIRS_KINDS.has(kind);
}

// Direction glyph for a linked-stairs chip: '▲' when the partner piece sits on a
// HIGHER story (its floor index in Store.floors is greater — canonical story
// order, lower index = lower story), else '▼'. Pure — drives the 2D chip + tests.
export function stairChipArrow(partnerIndex: number, currentIndex: number): '▲' | '▼' {
  return partnerIndex > currentIndex ? '▲' : '▼';
}

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
export const FLOOD_PLATE_DEPTH_MM = 40;  // three-renderer floodlight mount-plate Z

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

// Floodlights lock flush to the nearest wall (like a fireplace, but a thin plate):
// the mount plate's back sits on the wall face and the twin heads (local −Z) aim
// into the room. Center = axis + normal·(wallT/2 + FLOOD_PLATE_DEPTH/2) = axis +
// normal·70. Rotation follows the light front-axis convention (front = local −Z ⇒
// rotation = atan2(−nx, −ny)). NO ganging. No-op for non-flood lights or when no
// wall is within maxMm. Mutates x / y / rotation; returns whether it snapped.
export function snapFloodlightToWall(
  light: { x: number; y: number; rotation?: number; iconKind?: LightIconKind },
  walls: { points: Vec2[]; kind?: WallKind }[],
  maxMm = 500,
): boolean {
  if ((light.iconKind ?? LIGHT_DEFAULTS.iconKind) !== 'flood') return false;
  const hit = snapToWallEdge(walls, light.x, light.y, maxMm);
  if (!hit) return false;
  const off = WALL_HALF_MM + FLOOD_PLATE_DEPTH_MM / 2;   // 70
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

// ── Door-lock state → visual resolution (shared 2D + 3D + sidebar) ─────────
// HA's lock domain has a fuller vocabulary than the locked/unlocked pair the
// early code handled: locking/unlocking/opening (transitional), open (a "more
// unlocked" latch-released state), jammed (a security-relevant FAULT), plus the
// generic unavailable/unknown. This is the single mapping (mirrors
// alarmStateColor) consumed by drawPadlock (2D), the 3D deadbolt material, and
// the sidebar badge — keep the resolution here so all three agree.
export type LockGlyphState =
  | 'locked' | 'unlocked' | 'jammed'
  | 'locking' | 'unlocking' | 'opening' | 'open'
  | 'unavailable' | undefined;

// Normalize a raw HA lock.* state (or the unbound lockLocalState flag) to the
// glyph vocabulary. Unknown / null / absent → undefined (grey bucket).
export function normalizeLockState(s: string | null | undefined): LockGlyphState {
  switch (s) {
    case 'locked': case 'unlocked': case 'jammed':
    case 'locking': case 'unlocking': case 'opening': case 'open':
      return s;
    case 'unavailable': return 'unavailable';
    default: return undefined;
  }
}

// jammed = amber ALERT (distinct from locked red); locking/unlocking/opening
// resolve to their target-state color (the renderer dims it as a transitional
// cue); open = unlocked-green (latch released); unavailable/unknown/absent =
// grey. Accepts either a raw HA state or a normalized glyph state.
const LOCK_GLYPH_COLORS: Record<string, string> = {
  locked:    '#ef5350',
  unlocked:  '#66bb6a',
  open:      '#66bb6a',
  jammed:    '#ffb300',
  locking:   '#ef5350',
  unlocking: '#66bb6a',
  opening:   '#66bb6a',
};
export function lockGlyphColor(state: string | null | undefined): string {
  const g = normalizeLockState(state);
  return (g && LOCK_GLYPH_COLORS[g]) || '#90a4ae';
}
// Transitional (in-progress) states render at reduced intensity — a "moving" cue.
export function lockGlyphTransitional(state: string | null | undefined): boolean {
  const g = normalizeLockState(state);
  return g === 'locking' || g === 'unlocking' || g === 'opening';
}
// A jammed lock is a fault worth calling out (a subtle pulse in 2D).
export function lockGlyphJammed(state: string | null | undefined): boolean {
  return normalizeLockState(state) === 'jammed';
}
// "Secured" reading (closed-shackle / filled body in 2D): a bolt engaged or
// trying to engage. Everything else draws as an open shackle outline.
export function lockGlyphSecured(state: string | null | undefined): boolean {
  const g = normalizeLockState(state);
  return g === 'locked' || g === 'jammed' || g === 'locking';
}

// "fired N ago" caption for an action button's bound entity. scene.* / button.*
// / input_button.* report the last-activation TIMESTAMP as their state;
// script.* / automation.* carry it in attributes.last_triggered. Returns null
// when no usable timestamp is present. `now` defaults to Date.now().
export function actionLastFired(
  st: { state?: string; attributes?: Record<string, unknown> } | null | undefined,
  now: number = Date.now(),
): string | null {
  if (!st) return null;
  const attrTs = st.attributes?.last_triggered;
  let ms = NaN;
  if (typeof attrTs === 'string') ms = Date.parse(attrTs);
  if (isNaN(ms) && typeof st.state === 'string') ms = Date.parse(st.state);
  if (isNaN(ms)) return null;
  return `fired ${relTimeText(now - ms)}`;
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

// ── Wall calendar plaque ────────────────────────────────────────────────────
// A picture-height wall plaque (350 × 250 mm face). Wall-snaps flush like the
// alarm panel (plate BACK on the wall, face into the room, no ganging).
export const CALENDAR_DEFAULTS = { height: 1600, w: 350, h: 250 };
export const CALENDAR_PLATE_DEPTH_MM = 40;   // three-renderer plaque BoxGeometry Z
export function calendarHeight(c: { height?: number }): number { return c.height ?? CALENDAR_DEFAULTS.height; }

// Wall-snap the calendar plaque flush to the nearest wall. Center = axis +
// normal·(wallT/2 + plateDepth/2). Rotation = atan2(nx, ny) (plate face = local
// +Z; 0 = +Y world), matching the switch/alarm convention. Mutates x/y/rotation;
// returns whether it snapped.
export function snapCalendarToWall(
  cp: { x: number; y: number; rotation?: number },
  walls: { points: Vec2[]; kind?: WallKind }[],
  maxMm = 500,
): boolean {
  const hit = snapToWallEdge(walls, cp.x, cp.y, maxMm);
  if (!hit) return false;
  const off = WALL_HALF_MM + CALENDAR_PLATE_DEPTH_MM / 2;
  cp.x = Math.round(hit.x + hit.nx * off);
  cp.y = Math.round(hit.y + hit.ny * off);
  cp.rotation = Math.atan2(hit.nx, hit.ny) * 180 / Math.PI;
  return true;
}

// ── HVAC / thermostat wall control fixture ─────────────────────────────────
export const THERMO_DEFAULTS = { height: 1500, size: 340 };
export const THERMO_PLATE_DEPTH_MM = 26;    // three-renderer plate BoxGeometry Z
export function thermostatHeight(t: { height?: number }): number { return t.height ?? THERMO_DEFAULTS.height; }

// climate.* HVAC modes (the entity STATE string is the mode) → the plate/screen
// band color. Shared 2D + 3D (like ALARM_STATE_COLORS). heat amber/red, cool
// blue, heat_cool magenta (both), auto green, dry teal, fan_only white/grey,
// off dim.
export const HVAC_MODE_COLORS: Record<string, string> = {
  off:       '#78909c',
  heat:      '#ff7043',
  cool:      '#42a5f5',
  heat_cool: '#ab47bc',
  auto:      '#66bb6a',
  dry:       '#26a69a',
  fan_only:  '#b0bec5',
};
export function hvacModeColor(mode: string | null | undefined): string {
  return (mode && HVAC_MODE_COLORS[mode]) || '#90a4ae';
}

// climate `hvac_action` (the RUNTIME truth) → an accent color. heating/preheating
// warm, cooling cool-blue, fan white/grey, drying teal, idle/off dim. Drives the
// 2D pulse + the 3D vent airflow color. Shared 2D + 3D.
export const HVAC_ACTION_COLORS: Record<string, string> = {
  heating:     '#ff6d4d',
  preheating:  '#ff8a65',
  cooling:     '#4dd0ff',
  drying:      '#26a69a',
  fan:         '#e0e0e0',
  defrosting:  '#90caf9',
  idle:        '#90a4ae',
  off:         '#78909c',
};
export function hvacActionColor(action: string | null | undefined): string {
  return (action && HVAC_ACTION_COLORS[action]) || '#90a4ae';
}

// Resolve the VENT airflow cue from mode + hvac_action. Prefer the runtime
// action (the physical truth: a unit in mode `heat` with action `idle` blows
// nothing); fall back to the mode when the integration reports no action (many
// don't) OR when unbound demo drives only a local mode. Returns the airflow kind
// (drives particle color/direction) or null = no airflow (no particles).
export type HvacAirflowKind = 'heat' | 'cool' | 'fan';
export function hvacAirflow(
  mode: string | null | undefined, action: string | null | undefined,
): HvacAirflowKind | null {
  if (action) {
    switch (action) {
      case 'heating': case 'preheating': return 'heat';
      case 'cooling': return 'cool';
      case 'fan': return 'fan';
      default: return null;   // idle / off / drying / defrosting → no airflow
    }
  }
  // No action reported → infer from the mode (bound integrations without
  // hvac_action + unbound demo local modes).
  switch (mode) {
    case 'heat': return 'heat';
    case 'cool': return 'cool';
    case 'fan_only': return 'fan';
    default: return null;   // off / auto / dry / heat_cool are ambiguous w/o action
  }
}
// Airflow particle color per kind (heat red/orange, cool blue, fan white/grey).
export const HVAC_VENT_COLORS: Record<HvacAirflowKind, string> = {
  heat: '#ff6d4d', cool: '#4dd0ff', fan: '#e0e0e0',
};

// HA climate attributes come in the SYSTEM's configured unit (°C/°F). Prefer the
// entity's own `temperature_unit` attribute; else fall back to the store flag.
export function climateTempUnit(
  st: { attributes?: Record<string, unknown> } | null | undefined, imperial: boolean,
): string {
  const u = st?.attributes?.temperature_unit;
  if (typeof u === 'string' && u.trim()) return u;
  return imperial ? '°F' : '°C';
}
// Round a numeric temp attribute for display; non-finite → null.
export function fmtTempNum(v: unknown): string | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (!isFinite(n)) return null;
  return (Math.round(n * 10) / 10).toString();
}
// True while the unit is physically running (drives the 2D pulse / vent alpha).
export function hvacActionActive(action: string | null | undefined): boolean {
  return action === 'heating' || action === 'cooling' || action === 'preheating'
      || action === 'fan' || action === 'drying' || action === 'defrosting';
}

// ── Per-room temperature heat-map (derived visual layer) ──────────────────
// A crude toon-flat diverging ramp anchored on a comfort BAND [comfortLo,
// comfortHi] (°C). Within the band = comfortable (near-neutral, low-key fill);
// below it steps cool → cold blue, above it steps warm → hot red. Discrete
// bands (NOT a smooth gradient) to match the Sims-flat aesthetic — research
// §4.5 calls for "2–3 color bands, not a smooth gradient" (generalized here to a
// 5-band comfort model so the settings comfort band + tests read cleanly; see
// the brief delta). Colors reuse the existing palette: cool = the HVAC vent-cool
// blue, warm = the env `warn` amber, hot = the env `danger` red.
export const HEATMAP_COMFORT_LO_DEFAULT = 20;   // °C
export const HEATMAP_COMFORT_HI_DEFAULT = 24;   // °C
// How far past the band edge before jumping to the EXTREME band (cold / hot).
export const HEATMAP_BAND_SPREAD = 3;           // °C
export type HeatmapBand = 'cold' | 'cool' | 'comfort' | 'warm' | 'hot';
export const HEATMAP_BAND_COLORS: Record<HeatmapBand, string> = {
  cold:    '#1e5fd0',  // deep blue
  cool:    '#4dd0ff',  // light blue (= HVAC_VENT_COLORS.cool)
  comfort: '#7ec87e',  // soft green (rendered at a lower alpha — "comfortable")
  warm:    '#ffb74d',  // amber (= env warn)
  hot:     '#ef5350',  // red (= env danger)
};
// Classify a Celsius reading into a heat-map band + its flat toon color.
export function heatmapColor(
  tempC: number,
  comfortLo: number = HEATMAP_COMFORT_LO_DEFAULT,
  comfortHi: number = HEATMAP_COMFORT_HI_DEFAULT,
  spread: number = HEATMAP_BAND_SPREAD,
): { band: HeatmapBand; color: string } {
  let band: HeatmapBand;
  if (!isFinite(tempC)) band = 'comfort';
  else if (tempC < comfortLo - spread) band = 'cold';
  else if (tempC < comfortLo) band = 'cool';
  else if (tempC <= comfortHi) band = 'comfort';
  else if (tempC <= comfortHi + spread) band = 'warm';
  else band = 'hot';
  return { band, color: HEATMAP_BAND_COLORS[band] };
}

// Normalize a raw reading + its HA unit string to Celsius. Accepts '°F'/'F'
// (and 'fahrenheit'); everything else (°C, K-less bare number, blank) passes
// through as Celsius. Non-finite → NaN.
export function tempToCelsius(value: number, unit: string | null | undefined): number {
  if (!isFinite(value)) return NaN;
  const u = String(unit ?? '').trim().toLowerCase();
  if (u === '°f' || u === 'f' || u === 'fahrenheit') return (value - 32) * 5 / 9;
  return value;
}

// A placed temperature reading (world mm) in Celsius.
export interface TempSample { x: number; y: number; tempC: number; }
// A room's aggregated temperature for the heat-map.
export interface RoomTemp { roomId: string; loop: Vec2[]; cx: number; cy: number; tempC: number; }

// Aggregate temperature samples into per-room means. Each sample is resolved to
// its room via the boundary-tolerant fuzzy resolver (a puck sitting on a wall
// line still counts); the mean of all samples landing in a room is that room's
// reading. Rooms with ZERO samples are omitted (unknown ≠ cold — no shading, no
// interpolation in v1). Deterministic: rooms come out in `rooms` order.
export function aggregateRoomTemps(
  rooms: Room[], loops: Vec2[][], samples: TempSample[],
): RoomTemp[] {
  const acc = new Map<string, { sum: number; n: number }>();
  for (const s of samples) {
    if (!isFinite(s.tempC)) continue;
    const rm = resolveRoomForPointFuzzy(rooms, loops, s.x, s.y);
    if (!rm) continue;
    const a = acc.get(rm.id) ?? { sum: 0, n: 0 };
    a.sum += s.tempC; a.n += 1;
    acc.set(rm.id, a);
  }
  const out: RoomTemp[] = [];
  for (const rm of rooms) {
    const a = acc.get(rm.id);
    if (!a || a.n === 0) continue;
    const loop = loopContaining(loops, rm.anchor.x, rm.anchor.y);
    if (!loop || loop.length < 3) continue;
    const c = centroid(loop);
    out.push({ roomId: rm.id, loop, cx: c.x, cy: c.y, tempC: a.sum / a.n });
  }
  return out;
}

// Snap a setpoint to the nearest `step` and clamp into [min, max] — the shared
// thermostat-modal stepper math (extracted so it's unit-testable).
export function clampSetpoint(v: number, min: number, max: number, step: number): number {
  const s = step > 0 ? step : 0.5;
  return Math.min(max, Math.max(min, Math.round(v / s) * s));
}

// climate supported_features bitmask (ClimateEntityFeature IntFlag, core).
export const CLIMATE_FEATURE = {
  TARGET_TEMPERATURE: 1,
  TARGET_TEMPERATURE_RANGE: 2,
  TARGET_HUMIDITY: 4,
  FAN_MODE: 8,
  PRESET_MODE: 16,
  SWING_MODE: 32,
  TURN_OFF: 128,
  TURN_ON: 256,
} as const;
export function climateFeature(supported: number | null | undefined, flag: number): boolean {
  return ((supported || 0) & flag) !== 0;
}

// Thermostat plates wall-snap flush like a switch / alarm panel — plate BACK on
// the wall face, screen into the room, NO ganging. Center = axis + normal·(wallT/2
// + plateDepth/2) = axis + normal·63. Rotation = atan2(nx, ny) (plate front =
// local +Z; 0 = +Y world). Mutates x/y/rotation; returns whether it snapped.
export function snapThermostatToWall(
  th: { x: number; y: number; rotation?: number },
  walls: { points: Vec2[]; kind?: WallKind }[],
  maxMm = 500,
): boolean {
  const hit = snapToWallEdge(walls, th.x, th.y, maxMm);
  if (!hit) return false;
  const off = WALL_HALF_MM + THERMO_PLATE_DEPTH_MM / 2;   // 63
  th.x = Math.round(hit.x + hit.nx * off);
  th.y = Math.round(hit.y + hit.ny * off);
  th.rotation = Math.atan2(hit.nx, hit.ny) * 180 / Math.PI;
  return true;
}

// ── Water valve fixture (Phase 2b) ─────────────────────────────────────────
// Floor pipe-run body + valve wheel. Free placement with a rotation (pipe-run
// direction). No wall snap.
export const VALVE_DEFAULTS = {
  pipeLenMm: 640,      // total pipe run length (2D + 3D)
  pipeRadiusMm: 55,    // pipe radius
  wheelRadiusMm: 150,  // hand-wheel radius
  bodyMm: 170,         // valve body (bonnet) half-extent
};
// Resolved openness 0..1 for a valve fixture. Takes the already-RESOLVED state
// (Planner.effectiveState / itemState fold localState first), mirroring
// doorOpenFraction conventions:
//   valve   open → current_position/100 (else 1); closed → position/100 (else 0);
//           opening/closing → position/100 (else 0.5)
//   switch  on → 1; off → 0
//   binary_sensor  on → 1; off/unknown/unavailable → 0
export function valveOpenness(
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
// "Open enough to be commanded closed" — drives the click open/close pick + the
// water-flow animation. open/opening/on OR any position > 0 reads as open.
export function valveIsOpen(
  st: { state: string; attributes?: Record<string, unknown> } | null | undefined,
): boolean {
  if (!st) return false;
  if (st.state === 'open' || st.state === 'opening' || st.state === 'on') return true;
  return valveOpenness(st) > 0.001;
}
// Water flows (spray/pulse animation) whenever openness > a small threshold.
export function valveFlowing(
  st: { state: string; attributes?: Record<string, unknown> } | null | undefined,
): boolean {
  return valveOpenness(st) > 0.02;
}
// Valve is mid-travel (pulse cue) — opening/closing.
export function valveTransitional(
  st: { state: string } | null | undefined,
): boolean {
  return st?.state === 'opening' || st?.state === 'closing';
}
export function valveRotation(v: { rotation?: number }): number { return v.rotation ?? 0; }

// ── Irrigation / sprinkler zone (T3) ───────────────────────────────────────
// A ground-embedded head + a user-configured spray arc (arc/radius/rotation are
// pure visual props — HA exposes no nozzle geometry). Bound to a switch/valve/
// binary_sensor entity; the spray animates ONLY while the entity is RUNNING.
export const SPRINKLER_DEFAULTS = {
  headKind: 'spray' as SprinklerHeadKind,
  arcDeg: 180,        // half-circle
  radius: 3000,       // ≈10 ft throw
  rotation: 0,        // arc center faces +Y world
  headRadiusMm: 90,   // 2D head disc / 3D nub radius
  hitRadiusMm: 240,   // 2D point-in-circle hit test (small, free placement)
};
export function sprinklerHeadKind(z: { headKind?: SprinklerHeadKind }): SprinklerHeadKind {
  return z.headKind ?? SPRINKLER_DEFAULTS.headKind;
}
export function sprinklerArcDeg(z: { arcDeg?: number }): number {
  const a = z.arcDeg ?? SPRINKLER_DEFAULTS.arcDeg;
  return Math.max(10, Math.min(360, a));
}
export function sprinklerRadius(z: { radius?: number }): number {
  return Math.max(300, z.radius ?? SPRINKLER_DEFAULTS.radius);
}
export function sprinklerRotation(z: { rotation?: number }): number { return z.rotation ?? 0; }
// Is the zone actively watering? Takes the already-RESOLVED state (effectiveState
// / itemState fold localState first), mirroring valveIsOpen / doorOpenFraction:
//   switch        on → running
//   valve         open / opening → running (or current_position > 0)
//   binary_sensor on → running (read-only)
export function sprinklerRunning(
  st: { state: string; attributes?: Record<string, unknown> } | null | undefined,
): boolean {
  if (!st) return false;
  if (st.state === 'on' || st.state === 'open' || st.state === 'opening') return true;
  const pos = st.attributes ? st.attributes['current_position'] : undefined;
  return typeof pos === 'number' && isFinite(pos) && pos > 0;
}

// ── Yard flagpole fixture ──────────────────────────────────────────────────
// A tapered pole + finial + waving flag. Free placement (no wall snap). The
// hoist FRACTION (1 = full mast, 0.5 = half mast, 0 = fully lowered) resolves
// from the bound entity, else the halfMast flag, else full. Flag design is the
// pure flag library (src/flags.ts). All render metrics scale with pole height.
export const FLAGPOLE_DEFAULTS = {
  height: 6000,        // pole height mm
  flagW: 1200,         // flag cloth width (fly) mm at default height
  flagH: 720,          // flag cloth height (hoist) mm at default height
  hitRadiusMm: 300,    // 2D point-in-circle hit test on the base
};
export function flagpoleHeight(fp: { height?: number }): number {
  return Math.max(1000, fp.height ?? FLAGPOLE_DEFAULTS.height);
}
// Resolve the hoist fraction 0..1 from the RESOLVED HA state (or null). A
// cover.* uses its position (open→100, closed→0 when no current_position); any
// other entity (sensor.*/number.*/input_number.*) parses its state as a 0..100
// percent. Unbound → halfMast ? 0.5 : 1. Never throws / NaN (bad reads → 1).
export function flagpoleHoistFraction(
  fp: { entityId?: string; halfMast?: boolean },
  st: { state: string; attributes?: Record<string, unknown> } | null | undefined,
): number {
  if (fp.entityId) {
    if (!st) return fp.halfMast ? 0.5 : 1;   // bound but no reading yet → fall through
    if (fp.entityId.startsWith('cover.')) {
      const pos = st.attributes ? st.attributes['current_position'] : undefined;
      if (typeof pos === 'number' && isFinite(pos)) return clamp01(pos / 100);
      if (st.state === 'open') return 1;
      if (st.state === 'closed') return 0;
      return 0.5;
    }
    const v = parseFloat(st.state);
    return isFinite(v) ? clamp01(v / 100) : (fp.halfMast ? 0.5 : 1);
  }
  return fp.halfMast ? 0.5 : 1;
}
function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }

// ── Smart plug / outlet fixture (Phase 2b) ─────────────────────────────────
// Wall outlet plate. Wall-snaps flush like a switch (plate BACK on the wall
// face, socket into the room), NO ganging. Default outlet height 300 mm.
export const PLUG_DEFAULTS = { height: 300, size: 160 };
export const PLUG_PLATE_DEPTH_MM = 35;   // three-renderer outlet BoxGeometry Z
export function plugHeight(pl: { height?: number }): number { return pl.height ?? PLUG_DEFAULTS.height; }
export function plugRotation(pl: { rotation?: number }): number { return pl.rotation ?? 0; }
// Plate BACK flush on the wall face, socket into the room, NO ganging. Center =
// axis + normal·(wallT/2 + plateDepth/2). Rotation = atan2(nx, ny) (plate front
// = local +Z; 0 = +Y world), the switch convention. Mutates x/y/rotation.
export function snapPlugToWall(
  pl: { x: number; y: number; rotation?: number },
  walls: { points: Vec2[]; kind?: WallKind }[],
  maxMm = 500,
): boolean {
  const hit = snapToWallEdge(walls, pl.x, pl.y, maxMm);
  if (!hit) return false;
  const off = WALL_HALF_MM + PLUG_PLATE_DEPTH_MM / 2;
  pl.x = Math.round(hit.x + hit.nx * off);
  pl.y = Math.round(hit.y + hit.ny * off);
  pl.rotation = Math.atan2(hit.nx, hit.ny) * 180 / Math.PI;
  return true;
}

// ── Smoke / CO safety detectors (Feature: safety sensors) ──────────────────
// Ceiling-mounted disc; the 3D puck hangs just below ceiling height. No wall
// snap (free placement like a motion sensor).
export const SAFETY_DEFAULTS = {
  ceilingMm: 2743, discRadiusMm: 120,
  leakFloorMm: 15,        // leak detectors sit ON the floor (small puck)
  leakMaxRadiusMm: 600,   // puddle grows to this radius while alarming
  leakGrowSec: 30,        // seconds to reach full puddle radius
  sirenSweepRevPerS: 1.3, // siren rotating-beacon sweep speed (revolutions/s)
  sirenStrobeHz: 2.4,     // siren lens hard on/off strobe (square wave)
};
// Beacon / puck color per kind. Shared 2D + 3D: red smoke, amber CO, amber-green
// gas, blue leak (its puddle), emergency blue siren (rotating beacon).
export function safetyColor(kind: SafetyKind): string {
  switch (kind) {
    case 'co': return '#ff9800';
    case 'gas': return '#c0ca33';   // amber-green
    case 'leak': return '#42a5f5';  // water blue
    case 'siren': return '#2979ff'; // emergency blue
    default: return '#ef5350';      // smoke red
  }
}
export function safetyGlyph(kind: SafetyKind): string {
  switch (kind) {
    case 'co': return 'CO';
    case 'gas': return 'GAS';
    case 'leak': return '💧';
    case 'siren': return '📢';
    default: return '';
  }
}
// leak sits on the floor; smoke/co/gas/siren hang from the ceiling.
export function safetyIsFloor(kind: SafetyKind): boolean { return kind === 'leak'; }
// siren is a controllable alert beacon (togglable), distinct from the passive
// detectors — clicking it toggles the bound entity / flips localState.
export function safetyIsSiren(kind: SafetyKind): boolean { return kind === 'siren'; }

// ── Presence zones (FP2-style occupancy polygons, roadmap #5) ───────────────
export const PRESENCE_ZONE_DEFAULTS = { color: '#26c6da', maxVerts: 12 };
export function presenceZoneColor(z: { color?: string }): string {
  return z.color ?? PRESENCE_ZONE_DEFAULTS.color;
}

// ── Camera fixtures (FOV frustum + snapshot, roadmap #10) ───────────────────
export const CAMERA_DEFAULTS = { fov: 90, range: 6000, height: 2200 };
export function cameraFov(c: { fov?: number }): number {
  return Math.max(5, Math.min(180, c.fov ?? CAMERA_DEFAULTS.fov));
}
export function cameraRange(c: { range?: number }): number {
  return Math.max(200, c.range ?? CAMERA_DEFAULTS.range);
}
export function cameraHeight(c: { height?: number }): number {
  return c.height ?? CAMERA_DEFAULTS.height;
}
// Camera tint for Frigate-derived target dots (Phase 5). Explicit override wins;
// otherwise a stable pick from the shared sensor palette by fixture index, so
// targets from different cameras are visually distinguishable without config.
export function cameraColor(c: { color?: string }, idx: number): string {
  return c.color ?? SENSOR_PALETTE[idx % SENSOR_PALETTE.length];
}
// Slugify a camera label into a default Frigate camera name (lowercase, spaces/
// punctuation → underscores) — the fallback when CameraFixture.frigateName is
// unset. Matches Frigate's own camera-name conventions loosely; users override
// the exact string in the sidebar when it doesn't match.
export function slugifyFrigateName(label: string): string {
  return (label || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
// Wedge tint by camera entity state: recording = red hint; streaming/idle = the
// neutral camera cyan. Shared 2D + 3D.
export function cameraStateColor(state: string | null | undefined): string {
  return state === 'recording' ? '#ef5350' : '#4dd0e1';
}

// ── Projector fixtures (home-theater arc) ──────────────────────────────────
// Ceiling body ≈ Epson HC 2150 scale (§2.2 research). `reachImgW` is the
// reference 120" 16:9 image width (mm) used to derive a heading-only default
// throw distance from the throw ratio. Beam color = cool white-blue.
export const PROJECTOR_DEFAULTS = {
  height: 2600, throwRatio: 1.5, beamColor: '#dfe8ff',
  bodyW: 310, bodyH: 122, bodyD: 284, reachImgW: 2657,
};
export function projectorHeight(p: { height?: number }): number { return p.height ?? PROJECTOR_DEFAULTS.height; }
export function projectorThrow(p: { throwRatio?: number }): number {
  return Math.max(0.2, p.throwRatio ?? PROJECTOR_DEFAULTS.throwRatio);
}
export function projectorBeamColor(p: { beamColor?: string }): string { return p.beamColor ?? PROJECTOR_DEFAULTS.beamColor; }
// THE projecting resolver (shared 2D + 3D): a projector's RESOLVED state string
// ('on'/'playing' = projecting). Callers pass Planner.effectiveState(proj)?.state.
export function projectorProjecting(state: string | null | undefined): boolean {
  return state === 'on' || state === 'playing';
}
// Beam aim: the world-plan point (+ its 3D height) the beam points at. When a
// screen is given, aim at its center; else a heading-based default throw whose
// distance = throwRatio × the reference image width. Heading 0 = +Y world, CW
// on screen (plan dir = (sin θ, cos θ)), matching the camera/motion convention.
// Pure + deterministic (test-driven in theater-test.html).
export function projectorAim(
  proj: { x: number; y: number; rotation?: number; throwRatio?: number },
  screen: { x: number; y: number; cy: number } | null,
): { x: number; y: number; y3: number } {
  if (screen) return { x: screen.x, y: screen.y, y3: screen.cy };
  const t = (proj.rotation ?? 0) * Math.PI / 180;
  const reach = projectorThrow(proj) * PROJECTOR_DEFAULTS.reachImgW;
  return { x: proj.x + Math.sin(t) * reach, y: proj.y + Math.cos(t) * reach, y3: 1350 };
}
// Screen center height (mm above floor) of the piece the projector aims at.
// Matches the 3D build: wall_tv screen sits at ~1350; freestanding tv panel
// centers around 700; anything else falls back to 1350.
export function screenCenterHeight(kind: string | undefined): number {
  return kind === 'wall_tv' ? 1350 : kind === 'tv' ? 700 : 1350;
}

// ── Screen bias lighting (home-theater arc) ────────────────────────────────
// Warm-white (~6500K look) default glow color behind a tv/wall_tv screen.
export const BIAS_LIGHT_DEFAULT_COLOR = '#fff1d6';
export function biasLightColor(b: { color?: string } | undefined): string {
  return b?.color ?? BIAS_LIGHT_DEFAULT_COLOR;
}

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

// Task-progress percent (0..100) for a robot's body progress strip/ring, or null
// when no source is known. Shared 2D + 3D + tests. `stateOf` returns a minimal HA
// state envelope (state + attributes). Resolution order (entity field WINS):
//   1. `progressEntity` — its numeric state, parseFloat + clamp 0..100.
//   2. best-effort: the bound vacuum/mower entity's own attributes, scanning the
//      common progress-percent keys (Roborock/Valetudo/generic) in order.
// Non-numeric / missing everywhere → null (strip hidden).
export interface RobotStateLike { state?: string; attributes?: Record<string, unknown> | null; }
const ROBOT_PROGRESS_ATTRS = [
  'cleaned_area_percent', 'progress', 'cleaning_progress', 'clean_percent',
  'percent', 'percentage', 'completion',
];
export function robotProgress(
  r: { progressEntity?: string | null; entity_id?: string | null },
  stateOf: (id: string) => RobotStateLike | null | undefined,
): number | null {
  if (r.progressEntity) {
    const n = parseFloat(String(stateOf(r.progressEntity)?.state));
    if (isFinite(n)) return Math.max(0, Math.min(100, n));
  }
  if (r.entity_id) {
    const attrs = stateOf(r.entity_id)?.attributes;
    if (attrs) {
      for (const k of ROBOT_PROGRESS_ATTRS) {
        const v = attrs[k];
        if (v == null) continue;
        const n = parseFloat(String(v));
        if (isFinite(n)) return Math.max(0, Math.min(100, n));
      }
    }
  }
  return null;
}

// ── Roborock live vacuum position (#6) ─────────────────────────────────────
// The core Roborock integration's map camera/image entity carries a live
// `vacuum_position` attribute (x/y/angle in the robot's internal map units).
// Parse it robustly: accept an object `{x,y,a?}`, an array `[x,y,a?]`, or a JSON
// string of either; fall back to `robot_position` then `position`. `a`/`angle`
// is the optional heading in map degrees. Null on anything unparseable.
export interface VacuumPos { x: number; y: number; a?: number; }
export function parseVacuumPosition(
  attrs: Record<string, unknown> | null | undefined,
): VacuumPos | null {
  if (!attrs) return null;
  for (const key of ['vacuum_position', 'robot_position', 'position']) {
    let v: unknown = attrs[key];
    if (v == null) continue;
    if (typeof v === 'string') {
      try { v = JSON.parse(v); } catch { continue; }
    }
    const p = _coerceVacuumPos(v);
    if (p) return p;
  }
  return null;
}
function _coerceVacuumPos(v: unknown): VacuumPos | null {
  if (Array.isArray(v)) {
    const x = Number(v[0]), y = Number(v[1]);
    if (!isFinite(x) || !isFinite(y)) return null;
    const a = Number(v[2]);
    return isFinite(a) && v.length > 2 ? { x, y, a } : { x, y };
  }
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    const x = Number(o.x), y = Number(o.y);
    if (!isFinite(x) || !isFinite(y)) return null;
    const araw = o.a ?? o.angle;
    const a = Number(araw);
    return araw != null && isFinite(a) ? { x, y, a } : { x, y };
  }
  return null;
}

// Calibration transform mapping a raw map-unit vacuum position → plan world mm:
//   world = R(posRotDeg) · S(posScale, posFlipY) · raw + offset
// i.e. scale first (optionally mirroring Y for a flipped map frame), then rotate
// by posRotDeg (screen-standard CCW about the origin), then translate by the
// offset. Defaults are identity (scale 1, rot 0, no flip, zero offset).
export interface VacuumCal {
  posScale?: number; posOffsetX?: number; posOffsetY?: number;
  posFlipY?: boolean; posRotDeg?: number;
}
export function vacuumRawToWorld(raw: VacuumPos, cal: VacuumCal): Vec2 {
  const scale = cal.posScale ?? 1;
  const sx = raw.x * scale;
  const sy = raw.y * scale * (cal.posFlipY ? -1 : 1);
  const th = (cal.posRotDeg ?? 0) * Math.PI / 180;
  const c = Math.cos(th), s = Math.sin(th);
  return {
    x: c * sx - s * sy + (cal.posOffsetX ?? 0),
    y: s * sx + c * sy + (cal.posOffsetY ?? 0),
  };
}
// Plan-frame heading (radians, atan2(dy,dx) convention) for a raw map angle
// `a` (degrees), applying the same flip + rotation as the position transform.
// Flip mirrors Y → negates the angle; rotation adds posRotDeg. Best-effort — the
// robot's angle convention varies, so callers fall back to the motion vector.
export function vacuumRawHeadingRad(a: number, cal: VacuumCal): number {
  const deg = (cal.posFlipY ? -a : a) + (cal.posRotDeg ?? 0);
  return deg * Math.PI / 180;
}
// One-click dock-reference solve: given the RAW position read while the vacuum is
// parked on its dock and the dock's world coords, solve posOffsetX/posOffsetY so
// vacuumRawToWorld(rawDock) lands exactly on the dock — holding scale/rot/flip.
export function solveVacuumDockOffset(
  rawDock: VacuumPos, dock: Vec2, cal: VacuumCal,
): { posOffsetX: number; posOffsetY: number } {
  const scale = cal.posScale ?? 1;
  const sx = rawDock.x * scale;
  const sy = rawDock.y * scale * (cal.posFlipY ? -1 : 1);
  const th = (cal.posRotDeg ?? 0) * Math.PI / 180;
  const c = Math.cos(th), s = Math.sin(th);
  const rx = c * sx - s * sy, ry = s * sx + c * sy;
  return { posOffsetX: dock.x - rx, posOffsetY: dock.y - ry };
}

// ── Media now-playing (#11) ────────────────────────────────────────────────
// Resolve a media_player entity's state into a now-playing card model, or null
// when nothing should show. Only playing/buffering ('playing' tier) and paused
// ('paused' tier, rendered dimmed) qualify AND a media_title must be present.
export interface NowPlaying { tier: 'playing' | 'paused'; title: string; artist: string; picture: string; }
export function parseNowPlaying(
  st: { state: string; attributes?: Record<string, unknown> } | null | undefined,
): NowPlaying | null {
  if (!st) return null;
  const s = st.state;
  const tier: 'playing' | 'paused' | null =
    (s === 'playing' || s === 'buffering') ? 'playing' : (s === 'paused' ? 'paused' : null);
  if (!tier) return null;
  const a = st.attributes ?? {};
  const title = typeof a.media_title === 'string' ? a.media_title : '';
  if (!title) return null;
  const artist = typeof a.media_artist === 'string' ? a.media_artist : '';
  const picture = typeof a.entity_picture === 'string' ? a.entity_picture : '';
  return { tier, title, artist, picture };
}
export function isMediaPlayerId(id: string | null | undefined): boolean {
  return !!id && id.startsWith('media_player.');
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

// ── Info card fixture (Display & Controls arc) ────────────────────────────
// Default plaque size + text-center height per mount. Mirrors FURNITURE_KINDS
// defaults; the sidebar lets the user override w/h/height per instance.
export const INFO_CARD_SCALE_MIN = 0.4, INFO_CARD_SCALE_MAX = 4;
export interface InfoCardMountDef { w: number; h: number; height: number; }
export const INFO_CARD_MOUNT_DEFAULTS: Record<InfoCardMount, InfoCardMountDef> = {
  wall:    { w: 200, h: 120, height: 1450 },   // flush wall plaque (~thermostat height)
  surface: { w: 150, h: 100, height: 40 },     // sits on a desk/counter, tilted back
  floor:   { w: 250, h: 150, height: 1000 },   // pedestal / A-frame sign
};
export function infoCardMount(ic: { mount?: InfoCardMount }): InfoCardMount { return ic.mount ?? 'wall'; }
export function infoCardW(ic: InfoCard): number { return ic.w ?? INFO_CARD_MOUNT_DEFAULTS[infoCardMount(ic)].w; }
export function infoCardH(ic: InfoCard): number { return ic.h ?? INFO_CARD_MOUNT_DEFAULTS[infoCardMount(ic)].h; }
export function infoCardHeight(ic: InfoCard): number { return ic.height ?? INFO_CARD_MOUNT_DEFAULTS[infoCardMount(ic)].height; }
export function infoCardScale(ic: InfoCard): number {
  const s = ic.fontScale ?? 1;
  return Math.max(INFO_CARD_SCALE_MIN, Math.min(INFO_CARD_SCALE_MAX, s));
}

// Resolved display TEXT for an info card. Clock/date modes bypass the entity
// entirely (formatClock, driven by the caller-supplied `now`); entity mode runs
// the generic value formatter. Pure — `now`/`imperial` come from the caller.
export function infoCardText(
  ic: InfoCard, st: HassStateLike | null,
  opts?: { now?: Date; imperial?: boolean },
): string {
  const mode = ic.displayMode ?? 'entity';
  if (mode !== 'entity') {
    return formatClock(mode as ClockMode, opts?.now ?? new Date(0),
      { clockFormat: ic.clockFormat, dateFormat: ic.dateFormat, timeZone: ic.timeZone });
  }
  if (!ic.entity_id) return '—';
  return formatEntityValue(st, ic.format, { imperial: opts?.imperial, now: opts?.now });
}

// Resolved rule result (color/flash/label) for an info card's current raw
// state. Clock/date modes never carry rules. Returns {} when nothing matches.
export function infoCardRule(ic: InfoCard, st: HassStateLike | null) {
  if ((ic.displayMode ?? 'entity') !== 'entity') return {};
  return evalRules(ic.rules, st?.state ?? '');
}

// Info cards with mount 'wall' lock flush to the nearest wall like a switch /
// floodlight (no ganging — stacking two readouts on one spot isn't a real use
// case, mirroring the alarm-panel precedent). The plaque back sits on the wall
// face; center = axis + normal·(wallT/2 + plaqueDepth/2). Plaque depth ~20 mm.
// Rotation follows the plate convention (front = local +Z ⇒ rotation atan2(nx,
// ny), 0 = +Y world). No-op for non-wall mounts or when no wall is in range.
export const INFO_CARD_PLATE_DEPTH_MM = 20;
export function snapInfoCardToWall(
  ic: { x: number; y: number; rotation?: number; mount?: InfoCardMount },
  walls: { points: Vec2[]; kind?: WallKind }[],
  maxMm = 500,
): boolean {
  if ((ic.mount ?? 'wall') !== 'wall') return false;
  const hit = snapToWallEdge(walls, ic.x, ic.y, maxMm);
  if (!hit) return false;
  const off = WALL_HALF_MM + INFO_CARD_PLATE_DEPTH_MM / 2;   // 60
  ic.x = Math.round(hit.x + hit.nx * off);
  ic.y = Math.round(hit.y + hit.ny * off);
  ic.rotation = Math.atan2(hit.nx, hit.ny) * 180 / Math.PI;
  return true;
}

// ── Generic action / trigger button (batch DC-B) ──────────────────────────
// Wall-plate / table / floor button that fires a configurable HA service. Wall
// mount snaps flush like a switch (no ganging — a single-purpose button, so the
// alarm-panel precedent applies); free mount is a table/floor puck. Rides the
// `switches` layer.
export const ACTION_BUTTON_DEFAULTS = { height: 1200, size: 220, color: '#4fa8ff', plateDepth: 30 };
export function actionButtonHeight(b: { height?: number }): number { return b.height ?? ACTION_BUTTON_DEFAULTS.height; }
export function actionButtonSize(b: { size?: number }): number {
  return Math.max(80, Math.min(600, b.size ?? ACTION_BUTTON_DEFAULTS.size));
}
export function actionButtonColor(b: { color?: string }): string { return b.color || ACTION_BUTTON_DEFAULTS.color; }
export function actionButtonKind(b: { actionKind?: ActionKind }): ActionKind { return b.actionKind ?? 'toggle'; }
// Default on-plate glyph per action kind (overridable via ActionButton.icon).
export const ACTION_ICON: Record<ActionKind, string> = {
  button_press: '🔔', scene: '🎬', script: '▶️',
  automation_trigger: '⚡', toggle: '🔀', custom: '🛠️',
};
export function actionButtonIcon(b: { actionKind?: ActionKind; icon?: string }): string {
  return b.icon || ACTION_ICON[actionButtonKind(b)];
}
// Wall-mounted action buttons snap flush to the nearest wall like a switch /
// alarm panel — plate BACK on the wall face, cap facing the room, NO ganging.
// Center = axis + normal·(wallT/2 + plateDepth/2). Rotation follows the plate
// convention (front = local +Z ⇒ rotation atan2(nx, ny), 0 = +Y world). No-op
// for free-placement buttons or when no wall is in range.
export function snapActionButtonToWall(
  b: { x: number; y: number; rotation?: number; wallMount?: boolean },
  walls: { points: Vec2[]; kind?: WallKind }[],
  maxMm = 500,
): boolean {
  if (b.wallMount === false) return false;
  const hit = snapToWallEdge(walls, b.x, b.y, maxMm);
  if (!hit) return false;
  const off = WALL_HALF_MM + ACTION_BUTTON_DEFAULTS.plateDepth / 2;   // 65
  b.x = Math.round(hit.x + hit.nx * off);
  b.y = Math.round(hit.y + hit.ny * off);
  b.rotation = Math.atan2(hit.nx, hit.ny) * 180 / Math.PI;
  return true;
}

// ── Logical-state light resolution (batch DC-B) ───────────────────────────
// A Light.logic derives ON / color / flash from ANY entity's raw state through
// the SHARED value-rules engine (ruleMatches, first-match-wins). Pure — the
// caller supplies the raw state string. resolveLightLogic returns the abstract
// decision (test-paged); logicLightState packages it as a synthetic HA state
// envelope so it flows through the EXISTING light render paths unchanged
// (Planner.effectiveState + the renderer's itemState both route through here).
export interface LightLogicResolved { on: boolean; color?: string; flash?: boolean; }
export function resolveLightLogic(logic: { rules?: ValueRule[]; offColor?: string }, raw: string | null): LightLogicResolved {
  const rules = logic.rules ?? [];
  const r = raw ?? '';
  for (const rule of rules) {
    if (ruleMatches(rule, r)) return { on: true, color: rule.color, flash: rule.flash };
  }
  return { on: false, color: logic.offColor };
}
// Synthetic HA state envelope for a logic light. Matched rule → 'on' with the
// rule color as rgb_color (+ `_flash` marker when the rule flashes). No match +
// offColor → 'on' but DIM (brightness 40) in offColor so it reads as an idle
// indicator. No match + no offColor → 'off' (fully dark). The `_flash` / `_dim`
// attributes are Diorama-private markers the light renderers honor.
export function logicLightState(logic: { rules?: ValueRule[]; offColor?: string }, raw: string | null): HassStateLike {
  const res = resolveLightLogic(logic, raw);
  const attrs: Record<string, unknown> = {};
  const setRgb = (hex?: string) => { if (hex) { const c = hexToRgb(hex); if (c) attrs.rgb_color = [c.r, c.g, c.b]; } };
  if (res.on) {
    setRgb(res.color);
    if (res.flash) attrs._flash = true;
    return { state: 'on', attributes: attrs };
  }
  if (res.color) {   // offColor dim indicator
    setRgb(res.color);
    attrs.brightness = 40;
    attrs._dim = true;
    return { state: 'on', attributes: attrs };
  }
  return { state: 'off', attributes: attrs };
}

// Furniture kind defaults: footprint (mm) + 3D height (mm) + tint.
// `back` flags whether the kind has an implied backrest on the +Y edge.
export type FurnitureCat = 'furniture' | 'appliance' | 'bathroom' | 'outdoor' | 'theater' | 'vehicle';

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
  kitchen_sink:  { label: 'Kitchen sink',  w: 800,  h: 550,  ht: 900,  back: 'none', color: 0x8d6e63, cat: 'appliance', surface: true, activity: 'wash_hands' },
  coffee_maker:  { label: 'Coffee maker',  w: 250,  h: 250,  ht: 350,  back: 'none', color: 0x37474f, cat: 'appliance', activity: 'make_coffee', mountable: true },
  toaster:       { label: 'Toaster',       w: 300,  h: 200,  ht: 220,  back: 'none', color: 0xb0bec5, cat: 'appliance', mountable: true },
  // Climate / airflow appliances. All bindable via the generic entity_id
  // (climate/fan/switch). Running units vent airflow / spin blades / glow warm.
  // Wall-hung units carry a default elevation (window AC in a sash, mini-split
  // head high on the wall, wall heater near the floor). Front (grille/blades) = -Z.
  window_ac:     { label: 'Window AC',     w: 600,  h: 400,  ht: 250,  back: 'none', color: 0xeceff1, cat: 'appliance', frontArrow: false },
  mini_split:    { label: 'Mini-split head', w: 800, h: 300, ht: 200,  back: 'none', color: 0xf7f9fa, cat: 'appliance', frontArrow: false },
  portable_ac:   { label: 'Portable AC',   w: 450,  h: 400,  ht: 750,  back: 'none', color: 0xcfd8dc, cat: 'appliance', frontArrow: false },
  floor_fan:     { label: 'Floor fan',     w: 450,  h: 450,  ht: 1100, back: 'none', color: 0x9aa2a8, cat: 'appliance' },
  retro_fan:     { label: 'Retro desk fan', w: 350, h: 300,  ht: 450,  back: 'none', color: 0xb08d57, cat: 'appliance', mountable: true },
  modern_fan:    { label: 'Modern stand fan', w: 400, h: 380, ht: 950, back: 'none', color: 0xd7dce0, cat: 'appliance' },
  tower_fan:     { label: 'Tower fan',     w: 300,  h: 300,  ht: 1000, back: 'none', color: 0x54585e, cat: 'appliance', frontArrow: false },
  bladeless_fan: { label: 'Bladeless fan', w: 350,  h: 250,  ht: 900,  back: 'none', color: 0xcfd8dc, cat: 'appliance', frontArrow: false },
  space_heater:  { label: 'Space heater',  w: 350,  h: 350,  ht: 600,  back: 'none', color: 0x3a3f45, cat: 'appliance', frontArrow: false },
  wall_heater:   { label: 'Wall heater',   w: 600,  h: 120,  ht: 800,  back: 'none', color: 0xd7dce0, cat: 'appliance', frontArrow: false },
  // Bathroom
  toilet:        { label: 'Toilet',        w: 480,  h: 700,  ht: 780,  seat: 420, back: 'none', color: 0xf5f5f0, cat: 'bathroom', activity: 'toilet' },
  sink:          { label: 'Sink',          w: 560,  h: 470,  ht: 860,  back: 'none', color: 0xd7ccc8, cat: 'bathroom', activity: 'wash_hands' },
  sink_vanity:   { label: 'Sink vanity',   w: 760,  h: 550,  ht: 860,  back: 'none', color: 0xd7ccc8, cat: 'bathroom', activity: 'wash_hands' },
  pedestal_sink: { label: 'Pedestal sink', w: 500,  h: 450,  ht: 850,  back: 'none', color: 0xf5f5f0, cat: 'bathroom', activity: 'wash_hands', frontArrow: false },
  utility_sink:  { label: 'Utility sink',  w: 600,  h: 500,  ht: 900,  back: 'none', color: 0x9aa2a8, cat: 'bathroom', activity: 'wash_hands' },
  bathtub:       { label: 'Bathtub',       w: 1520, h: 760,  ht: 560,  back: 'none', color: 0xf5f5f0, cat: 'bathroom', activity: 'bathe' },
  shower:        { label: 'Shower',        w: 910,  h: 910,  ht: 2000, back: 'none', color: 0xe3e6e8, cat: 'bathroom', activity: 'shower' },
  // Wall-hung ladder-rack radiator; bars glow warm (eased) while running. Bathroom
  // cat, so the appliance-state hash predicate is extended for it in three-view.
  towel_warmer:  { label: 'Towel warmer',  w: 600,  h: 120,  ht: 800,  back: 'none', color: 0xb0bec5, cat: 'bathroom', frontArrow: false },
  // Fitness
  exercise_equipment: { label: 'Exercise equipment', w: 700, h: 1600, ht: 1300, back: 'none', color: 0x424242, cat: 'furniture', activity: 'exercise' },
  // Home theater — speakers/sub/center are a new `theater` cat (own optgroup).
  // Sizes are illustrative real-world defaults (ELAC DF52 tower, Klipsch R-12SW
  // sub); every field stays per-fixture editable like all other kinds. Speakers
  // bound to a media_player show the shipped now-playing card + a driver pulse
  // while playing. Bookshelf/center are `mountable` (land on a surface host).
  speaker_tower:     { label: 'Speaker (tower)',     w: 250, h: 350, ht: 1050, back: 'none', color: 0x1a1a1a, cat: 'theater' },
  speaker_bookshelf: { label: 'Speaker (bookshelf)', w: 200, h: 280, ht: 350,  back: 'none', color: 0x1c1c1c, cat: 'theater', mountable: true },
  subwoofer:         { label: 'Subwoofer',           w: 400, h: 450, ht: 450,  back: 'none', color: 0x111111, cat: 'theater' },
  center_channel:    { label: 'Center channel',      w: 450, h: 160, ht: 180,  back: 'none', color: 0x161616, cat: 'theater', mountable: true, frontArrow: false },
  // Recliners + riser ride the default `furniture` cat (grouped with sofas).
  // Recliner leaves `activity` undefined so `watch_tv` resolves from the room's
  // TV via the seated-context SitSpot path (never a standing anchor).
  theater_recliner:  { label: 'Theater recliner',    w: 950,  h: 1000, ht: 1050, seat: 450, back: 'tall', color: 0x2b2320, cat: 'furniture' },
  recliner_row3:     { label: 'Recliner row (3)',    w: 2900, h: 1000, ht: 1050, seat: 450, back: 'tall', color: 0x2b2320, cat: 'furniture' },
  // Walkable tiered-seating deck. Low (220 mm) flat platform — does NOT block
  // nav (see isRiserKind in three-renderer's _buildNav skip + _groundYAt); place
  // recliners on top with their `elevation` set to the riser height.
  riser_platform:    { label: 'Riser platform',      w: 3600, h: 1800, ht: 220,  back: 'none', color: 0x2a2622, cat: 'furniture', frontArrow: false },
  // Outdoor — wheeled curbside bins. Entity 'on'/'full' = FULL (lid propped, overflow
  // hint); unbound → localState click-toggle. Front (lid hinge, wheels at back = +Z).
  trash_bin:     { label: 'Trash bin',     w: 600,  h: 700,  ht: 1100, back: 'none', color: 0x3a3f45, cat: 'outdoor', frontArrow: false },
  recycle_bin:   { label: 'Recycling bin', w: 600,  h: 700,  ht: 1100, back: 'none', color: 0x1f6fb2, cat: 'outdoor', frontArrow: false },
  // Outdoor — yard objects (the "yard" arc). Symmetric pieces skip the front chevron.
  tree:          { label: 'Tree',          w: 900,  h: 900,  ht: 3000, back: 'none', color: 0x4c8c2b, cat: 'outdoor', frontArrow: false },
  pine_tree:     { label: 'Pine tree',     w: 800,  h: 800,  ht: 3200, back: 'none', color: 0x2f6d3a, cat: 'outdoor', frontArrow: false },
  bush:          { label: 'Bush',          w: 700,  h: 700,  ht: 700,  back: 'none', color: 0x5a9e35, cat: 'outdoor', frontArrow: false },
  flower_bed:    { label: 'Flower bed',    w: 900,  h: 450,  ht: 300,  back: 'none', color: 0x6b4a2b, cat: 'outdoor', frontArrow: false },
  bird_bath:     { label: 'Bird bath',     w: 450,  h: 450,  ht: 950,  back: 'none', color: 0xb0b6bb, cat: 'outdoor', frontArrow: false },
  fountain:      { label: 'Fountain',      w: 1200, h: 1200, ht: 1400, back: 'none', color: 0xa8aeb4, cat: 'outdoor', frontArrow: false },
  swingset:      { label: 'Swing set',     w: 2800, h: 1600, ht: 2200, seat: 350, back: 'none', color: 0x6d7378, cat: 'outdoor', frontArrow: false },
  lawn_chair:    { label: 'Lawn chair',    w: 700,  h: 1200, ht: 900,  seat: 380, back: 'low', color: 0x2e8b8b, cat: 'outdoor' },
  // picnic_table is a `surface` table (eat_at_table host); no `seat` — its centered
  // seat spot would land ON the tabletop. Sit AT it via adjacent lawn_chairs.
  picnic_table:  { label: 'Picnic table',  w: 1800, h: 1500, ht: 750,  back: 'none', color: 0x8a6a44, cat: 'outdoor', surface: true, activity: 'eat_at_table', frontArrow: false },
  // Decorative boulder cluster — ordinary nav-blocking outdoor piece (no binding,
  // no activity, no special nav exemption). 2–4 overlapping grey shapes.
  rock_cluster:  { label: 'Rock cluster',  w: 800,  h: 600,  ht: 500,  back: 'none', color: 0x8b8f93, cat: 'outdoor', frontArrow: false },
  // Post-mounted mail/parcel box. mailCount.countEntity > 0 raises the flag +
  // floats a count badge; flagEntity 'on' tilts the lid open. Front (door) = -Z.
  mailbox:       { label: 'Mailbox',       w: 250,  h: 350,  ht: 1100, back: 'none', color: 0x37474f, cat: 'outdoor' },
  // Vehicle / garage. Car binds a binary_sensor (presence): bound off = ghosted
  // "away", on = solid, unbound = always solid. ev_charger is a wall-post EVSE.
  car:           { label: 'Car',           w: 1850, h: 4800, ht: 1450, back: 'none', color: 0x37516b, cat: 'vehicle' },
  ev_charger:    { label: 'EV charger',     w: 350,  h: 250,  ht: 1200, back: 'none', color: 0x2f3237, cat: 'vehicle' },
};

// Ground / yard covering kinds (the "yard" arc): a flat display color for the 2D
// fill + a base tint for the 3D toon material under the procedural texture. Water
// is drawn translucent. Textures are built procedurally in three-renderer.
export const GROUND_KINDS: Record<GroundKind, { label: string; color: string; opacity?: number }> = {
  grass:    { label: 'Grass',    color: '#4c7a34' },
  rock:     { label: 'Rock',     color: '#8a8f95' },
  concrete: { label: 'Concrete', color: '#b8b8bc' },
  blacktop: { label: 'Blacktop', color: '#2e3236' },
  mulch:    { label: 'Mulch',    color: '#6b4a2b' },
  sand:     { label: 'Sand',     color: '#d8c69a' },
  water:    { label: 'Water',    color: '#3d7bb8', opacity: 0.85 },
};
export function groundKindLabel(k: GroundKind): string { return GROUND_KINDS[k]?.label ?? k; }
export function groundAreaColor(g: { kind: GroundKind }): string { return GROUND_KINDS[g.kind]?.color ?? '#4c7a34'; }

// Area-weighted polygon centroid — a representative interior point for a simple
// polygon (used by groundAreaSkirtBase to test which lower tier an area sits
// on). Falls back to the vertex average when the signed area is ~0 (degenerate).
export function polygonCentroid(verts: Vec2[]): Vec2 {
  const n = verts.length;
  if (n === 0) return { x: 0, y: 0 };
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const cross = verts[j].x * verts[i].y - verts[i].x * verts[j].y;
    a += cross;
    cx += (verts[j].x + verts[i].x) * cross;
    cy += (verts[j].y + verts[i].y) * cross;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-6) return centroid(verts);
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

// Terraced-ground skirt base: the elevation the skirt of `area` should drop
// DOWN to. A small tier nested on a larger, lower tier must stop at that tier's
// elevation (not always grade 0), else it cuts a visible cliff through the tier
// beneath. Resolved once per area at build time (never per frame) by testing
// `area`'s representative interior point against every OTHER area's polygon and
// taking the highest elevation that is (a) at or below `area`'s own elevation
// and (b) contains the point. Pure/O(areas²) over a small per-floor array — the
// same idiom closedWallLoops / mowerSweepWaypoints use. A single sunken area
// (negative elevation, no lower sibling) returns 0 → its skirt rises to grade.
export function groundAreaSkirtBase(area: GroundArea, all: GroundArea[]): number {
  const ae = area.elevationMm ?? 0;
  const rep = polygonCentroid(area.points);
  let base = 0;
  for (const other of all) {
    if (other.id === area.id || other.hidden || (other.points?.length ?? 0) < 3) continue;
    const oe = other.elevationMm ?? 0;
    if (oe <= ae && oe > base && pointInPolygon(rep.x, rep.y, other.points)) base = oe;
  }
  return base;
}

// ── Path / driveway ribbon (T4, research §3.6) ─────────────────────────────
// Pure mitered-offset ribbon: offset each centerline segment left/right by
// width/2 along its perpendicular, join adjacent segments at the miter point,
// cap the two ends FLAT. Returns a closed polygon (left side forward, right
// side backward) suitable to store as a plain GroundArea.points — the whole
// rendering / hit-test / 3D pipeline then treats it as an ordinary polygon.
// Degenerate (<2 points) → []. Width is clamped to PATH_MIN_WIDTH. Sharp
// interior angles clamp the miter to PATH_MITER_LIMIT so a near-reversal can't
// blow the offset to infinity (concave self-intersection on the inside of a
// tight bend is an accepted v1 artifact, same class as the terrace-skirt one).
export const PATH_MIN_WIDTH = 100;
export const PATH_DEFAULT_WIDTH = 1000;
const PATH_MITER_LIMIT = 4;
export function bufferPolyline(centerline: Vec2[], width: number): Vec2[] {
  if (!centerline || centerline.length < 2) return [];
  const n = centerline.length;
  const halfW = Math.max(PATH_MIN_WIDTH, width) / 2;
  // Unit direction of segment i (points[i] → points[i+1]).
  const segDir = (i: number): Vec2 => {
    const a = centerline[i], b = centerline[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  };
  const left: Vec2[] = [], right: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    let mx: number, my: number, scale = 1;
    if (i === 0) {
      const d = segDir(0); mx = -d.y; my = d.x;                 // start cap: seg-0 left normal
    } else if (i === n - 1) {
      const d = segDir(n - 2); mx = -d.y; my = d.x;             // end cap: last-seg left normal
    } else {
      const d0 = segDir(i - 1), d1 = segDir(i);
      const n0x = -d0.y, n0y = d0.x, n1x = -d1.y, n1y = d1.x;   // adjacent-edge left normals
      const sx = n0x + n1x, sy = n0y + n1y, slen = Math.hypot(sx, sy);
      if (slen < 1e-6) { mx = n0x; my = n0y; }                  // 180° reversal — use one normal
      else {
        mx = sx / slen; my = sy / slen;
        const cos = mx * n0x + my * n0y;                        // cos(half-angle)
        scale = cos > 1e-3 ? Math.min(PATH_MITER_LIMIT, 1 / cos) : PATH_MITER_LIMIT;
      }
    }
    const off = halfW * scale;
    left.push({ x: centerline[i].x + mx * off, y: centerline[i].y + my * off });
    right.push({ x: centerline[i].x - mx * off, y: centerline[i].y - my * off });
  }
  const out: Vec2[] = [];
  for (let i = 0; i < n; i++) out.push({ x: Math.round(left[i].x), y: Math.round(left[i].y) });
  for (let i = n - 1; i >= 0; i--) out.push({ x: Math.round(right[i].x), y: Math.round(right[i].y) });
  return out;
}

// ── Pool / spa (T4, docs/research/pool-spa.md) ─────────────────────────────
export const POOL_WATER_COLOR = '#1ca3c6';   // toon aqua (§3 plaster blue)
export const POOL_COPING_COLOR = '#cbc6b6';   // buff/travertine rim
export const POOL_HEAT_GLOW = '#ff8a4c';      // warm heater wash
export const POOL_DEFAULTS = { depthPool: 1200, depthSpa: 900, minWater: 300 };
export type PoolHeaterState = 'off' | 'idle' | 'heating';
export function poolWaterColor(pl: { waterColor?: string }): string { return pl.waterColor ?? POOL_WATER_COLOR; }
export function poolDepthMm(pl: { kind: 'pool' | 'spa'; depthMm?: number }): number {
  return Math.max(POOL_DEFAULTS.minWater, pl.depthMm ?? (pl.kind === 'spa' ? POOL_DEFAULTS.depthSpa : POOL_DEFAULTS.depthPool));
}
export function poolRaisedMm(pl: { raisedMm?: number }): number { return Math.max(0, pl.raisedMm ?? 0); }
export const POOL_WATERLINE_DROP = 100;   // mm the waterline sits below the rim
// The rim is grade (0) for in-ground, or raisedMm for a raised spa. The basin
// FLOOR is that rim minus the depth; the WATER SURFACE sits just below the rim.
export function poolRimY(pl: { raisedMm?: number }): number { return poolRaisedMm(pl); }
export function poolBasinFloorY(pl: { kind: 'pool' | 'spa'; depthMm?: number; raisedMm?: number }): number {
  return poolRaisedMm(pl) - poolDepthMm(pl);
}
export function poolWaterSurfaceY(pl: { raisedMm?: number }): number {
  return poolRaisedMm(pl) - POOL_WATERLINE_DROP;
}
// Three-state heater resolution from the RESOLVED state (effectiveState folds the
// localState map first). climate/water_heater 'off' → off; hvac_action 'heating'
// → heating; hvac_action 'idle' (iAquaLink ENABLED) → armed-but-not-firing dim
// glow; any other non-off state → heating (best-effort for integrations with no
// hvac_action). Mirrors the doc's §4.3 three-state glow.
export function poolHeaterState(
  st: { state: string; attributes?: Record<string, unknown> } | null | undefined,
): PoolHeaterState {
  if (!st) return 'off';
  const s = (st.state || '').toLowerCase();
  const action = st.attributes ? String(st.attributes['hvac_action'] ?? '').toLowerCase() : '';
  if (action === 'heating') return 'heating';
  if (action === 'idle') return 'idle';
  if (s === 'off' || s === 'unavailable' || s === 'unknown' || s === '') return 'off';
  return 'heating';
}
export function poolPumpOn(st: { state: string } | null | undefined): boolean {
  return !!st && (st.state === 'on' || st.state === 'open' || st.state === 'opening' || st.state === 'playing');
}
export function poolLightOn(st: { state: string } | null | undefined): boolean {
  return !!st && st.state === 'on';
}

export function furnitureCat(def: FurnitureKindDef): FurnitureCat { return def.cat ?? 'furniture'; }

// Curbside bins (trash_bin / recycle_bin) carry a full/empty state via the
// standard entity_id (or unbound localState). 'on' OR 'full' = FULL.
export function isBinKind(kind: FurnitureKind | undefined): boolean {
  return kind === 'trash_bin' || kind === 'recycle_bin';
}

// ── Climate / airflow appliances (this batch) ──────────────────────────────
// Every new furniture kind added by the climate batch. All bindable via the
// generic entity_id (climate/fan/switch). Used to widen the three-view
// appliance-state hash (so towel_warmer — a BATHROOM-cat piece — folds its
// running state into _keyFloor) and to gate the running-glow in 2D.
export function isClimateApplianceKind(kind: FurnitureKind | undefined): boolean {
  return kind === 'window_ac' || kind === 'mini_split' || kind === 'portable_ac' ||
         kind === 'floor_fan' || kind === 'retro_fan' || kind === 'modern_fan' ||
         kind === 'tower_fan' || kind === 'bladeless_fan' ||
         kind === 'space_heater' || kind === 'wall_heater' || kind === 'towel_warmer';
}
// Bladed floor/desk/stand fans — the kinds with a visible spinning blade rotor
// AND the optional oscillation sweep (Furniture.oscillate). Tower/bladeless fans
// have no blades (slot shimmer / air-disc instead) and never oscillate.
export function isBladedFanKind(kind: FurnitureKind | undefined): boolean {
  return kind === 'floor_fan' || kind === 'retro_fan' || kind === 'modern_fan';
}
// Default base elevation (mm) for a freshly-dropped wall-hung climate piece.
// window AC sits in a sash, the mini-split head rides high on the wall, the wall
// heater near the floor, the towel warmer mid-wall. Everything else = 0 (floor).
export function defaultFurnitureElevation(kind: FurnitureKind | undefined): number {
  switch (kind) {
    case 'window_ac':   return 900;
    case 'mini_split':  return 2100;
    case 'wall_heater': return 200;
    case 'towel_warmer': return 800;
    default: return 0;
  }
}
// Resolve running + airflow for a climate appliance from its RESOLVED state
// envelope (effectiveState / itemState — localState already folded). A climate.*
// entity runs only while actively heating/cooling/fanning (hvacAirflow ≠ null);
// a fan.*/switch.*/localState piece runs on 'on'/'playing'. `airFallback` is the
// airflow kind for a non-climate (or actionless) run — 'cool' for ACs, 'heat'
// for heaters. Returns {running, air} — `air` drives particle color/direction.
export function climateApplianceRun(
  st: { state?: string; attributes?: Record<string, unknown> } | null | undefined,
  airFallback: HvacAirflowKind,
): { running: boolean; air: HvacAirflowKind } {
  const s = (st?.state ?? '').trim().toLowerCase();
  if (!s || s === 'off' || s === 'unavailable' || s === 'unknown' ||
      s === 'none' || s === 'idle' || s === 'standby') return { running: false, air: airFallback };
  // A climate entity reports an HVAC mode (heat/cool/heat_cool/auto/dry/fan_only);
  // resolve airflow from mode + hvac_action and treat it as running only when air ≠ null.
  if (s === 'heat' || s === 'cool' || s === 'heat_cool' || s === 'auto' ||
      s === 'dry' || s === 'fan_only') {
    const action = st?.attributes?.hvac_action as string | undefined;
    const air = hvacAirflow(s, action);
    return { running: air != null, air: air ?? airFallback };
  }
  // fan.* / switch.* / localState — 'on'/'playing' runs at the fallback airflow.
  return { running: s === 'on' || s === 'playing', air: airFallback };
}

// Floodlight/exhaust wall-plate depth (three-renderer housing Z). Wall-mount
// exhaust snaps flush like a floodlight (plate back on the wall face, front into
// the room), offset = wallT/2 + plateDepth/2 = 70.
export const EXHAUST_PLATE_DEPTH_MM = 40;
// Wall-mount exhaust fans lock flush to the nearest wall (the floodlight
// precedent): the round housing's back sits on the wall face and the grille
// (local −Z) faces the room. Center = axis + normal·(wallT/2 + plateDepth/2) =
// axis + normal·70; rotation = atan2(−nx, −ny) (front = local −Z). NO ganging.
// No-op for non-exhaust_wall lights or when no wall is within maxMm.
export function snapExhaustToWall(
  light: { x: number; y: number; rotation?: number; iconKind?: LightIconKind },
  walls: { points: Vec2[]; kind?: WallKind }[],
  maxMm = 500,
): boolean {
  if ((light.iconKind ?? LIGHT_DEFAULTS.iconKind) !== 'exhaust_wall') return false;
  const hit = snapToWallEdge(walls, light.x, light.y, maxMm);
  if (!hit) return false;
  const off = WALL_HALF_MM + EXHAUST_PLATE_DEPTH_MM / 2;   // 70
  light.x = Math.round(hit.x + hit.nx * off);
  light.y = Math.round(hit.y + hit.ny * off);
  light.rotation = Math.atan2(-hit.nx, -hit.ny) * 180 / Math.PI;
  return true;
}

// Sink family — a visible recessed basin + faucet + running water (fill/stream/
// ripple). All sink kinds RUN off their effectiveState (bound entity / unbound
// localState) OR while a rig is engaged in a wash_hands activity anchored to
// them. Used by the three-view appliance-state hash predicate (so a bound flip
// rebuilds), the 2D running/fill draw, and the click-to-toggle tagging.
export function isSinkKind(kind: FurnitureKind | undefined): boolean {
  return kind === 'sink' || kind === 'sink_vanity' || kind === 'pedestal_sink' ||
         kind === 'kitchen_sink' || kind === 'utility_sink';
}
export function binStateIsFull(state: string | null | undefined): boolean {
  return state === 'on' || state === 'full';
}

// Garage-bay vehicle. A car binds a binary_sensor presence entity via the
// generic entity_id; bound + not-'on' renders GHOSTED (empty bay), else solid.
export function isVehicleKind(kind: FurnitureKind | undefined): boolean {
  return kind === 'car';
}

// EV charging status — resolved from ANY vendor's status entity by mapping the
// state STRING defensively (never one vendor's ids; see docs/research/ev-charger.md
// "common shape"). Charging (green pulse) / full (steady green) / error (red) /
// idle (dim). A car adjacent to a charging charger shows a charge indicator.
export type EvStatus = 'charging' | 'full' | 'error' | 'idle';
export function evStatusOf(state: string | null | undefined): EvStatus {
  const s = (state ?? '').trim().toLowerCase();
  if (!s || s === 'unknown' || s === 'unavailable' || s === 'none') return 'idle';
  if (/error|fault|alarm|problem/.test(s)) return 'error';
  if (/full|complete|finish|done|ready_charged/.test(s)) return 'full';
  if (/charg|plugged|connect|occupied|active|busy|on\b|suspended_ev|preparing/.test(s)) return 'charging';
  return 'idle';
}
export const EV_STATUS_COLORS: Record<EvStatus, string> = {
  charging: '#00e676',   // bright green — pulsing while drawing power
  full:     '#43a047',   // steady green — complete
  error:    '#ff5252',   // red — fault
  idle:     '#78909c',   // dim slate — plugged idle / powered
};
export function evStatusColor(st: EvStatus): string { return EV_STATUS_COLORS[st]; }
// Battery % from a status entity's common attribute names (charger/vehicle SoC),
// clamped 0..100; null when absent (don't imply a capability that isn't bound).
export function evChargePercent(st: { attributes?: Record<string, unknown> } | null | undefined): number | null {
  const a = st?.attributes ?? {};
  for (const k of ['battery_level', 'battery', 'state_of_charge', 'soc', 'charge']) {
    const v = parseFloat(String((a as Record<string, unknown>)[k] ?? ''));
    if (isFinite(v)) return Math.max(0, Math.min(100, v));
  }
  return null;
}

// A car shows a charge indicator when its OWN evCharger binding is charging OR
// any charger piece (ev_charger kind, or any piece carrying an evCharger binding)
// within EV_CAR_RANGE_MM of it is charging. Returns the SoC %/watts of the first
// charging source, else null. Shared by 2D (canvas-render) + 3D (three-view opts).
export const EV_CAR_RANGE_MM = 1500;
type EvBind = { statusEntity?: string; powerEntity?: string };
type EvPiece = { x: number; y: number; kind?: FurnitureKind; evCharger?: EvBind };
export function carChargeState(
  car: EvPiece,
  furniture: EvPiece[],
  stateOf: (id: string) => { state: string; attributes?: Record<string, unknown> } | null,
): { pct: number | null; watts: number | null } | null {
  const sources: EvBind[] = [];
  if (car.evCharger?.statusEntity) sources.push(car.evCharger);
  const r2 = EV_CAR_RANGE_MM * EV_CAR_RANGE_MM;
  for (const fu of furniture) {
    if (fu === car || !fu.evCharger?.statusEntity) continue;
    if (fu.kind !== 'ev_charger' && !fu.evCharger) continue;
    const dx = fu.x - car.x, dy = fu.y - car.y;
    if (dx * dx + dy * dy <= r2) sources.push(fu.evCharger);
  }
  for (const c of sources) {
    const st = c.statusEntity ? stateOf(c.statusEntity) : null;
    if (evStatusOf(st?.state) !== 'charging') continue;
    const w = c.powerEntity ? parseFloat(stateOf(c.powerEntity)?.state ?? '') : NaN;
    return { pct: evChargePercent(st), watts: isFinite(w) ? w : null };
  }
  return null;
}

// Home-theater speakers (cat 'theater'). Bound to a media_player, a 'playing'
// state drives the emissive driver pulse — three-view folds their state into the
// _keyFloor appliance hash exactly like TVs so the pulse rebuilds on a change.
export function isSpeakerKind(kind: FurnitureKind | undefined): boolean {
  return kind === 'speaker_tower' || kind === 'speaker_bookshelf' ||
         kind === 'subwoofer' || kind === 'center_channel';
}
// Walkable tiered-seating deck — exempt from nav footprint-blocking (like
// rugs/beds) and registered as flat terrain so avatars climb onto it.
export function isRiserKind(kind: FurnitureKind | undefined): boolean {
  return kind === 'riser_platform';
}

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

// ── Plant health (soil-moisture droop) ────────────────────────────────────────
// Default "thirsty" threshold, matching HA's core plant integration min_moisture.
export const PLANT_MOISTURE_DEFAULT_THRESHOLD = 20;

// Which furniture pieces support the moisture-bind / droop feature: the indoor
// `plant` kind, the outdoor `flower_bed`, and any custom recipe that opts in via
// `activity: 'tend_plant'`. (bush/tree/pine_tree deliberately excluded in v1 —
// garden soil is usually a zone/irrigation-level reading, not per-plant.)
export function isDroopPlant(f: Furniture, customObjects?: ObjectRecipe[]): boolean {
  if (f.kind === 'plant' || f.kind === 'flower_bed') return true;
  return resolveFurnitureDef(f, customObjects).activity === 'tend_plant';
}

// Is the plant thirsty right now? A finite reading below its threshold, OR (only
// when nothing is bound) the manual demo toggle. Pure — shared by 2D/3D/key.
export function plantThirsty(reading: number, threshold: number): boolean {
  return isFinite(reading) && reading < threshold;
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
// moves here (matches the drag-the-seat UX); this no-ops on a table (no `seat`).
// The REVERSE — dragging a table carries its tucked chairs — is handled by the
// caller via `seatBelongsToTable` + a delta translate (see canvas-interact).
// Counters / islands are intentionally NOT hosts (only eat/work).
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

// Reverse of the seat-tuck: does a seat "belong to" a table for group-move?
// True when the seat CENTER (world) lies within the host's rotation-aware
// footprint inflated by captureMm — i.e. it's tucked to (or right beside) the
// table. `resolveSeatTableCollision` parks a tucked seat's center at the host
// edge + SEAT_TUCK_CLEAR_MM (150), so TABLE_CARRY_MARGIN_MM (450) comfortably
// captures a tucked chair plus slack without grabbing chairs across the room.
// The caller measures against the table's OLD position so dragging a dining
// table carries only the chairs that were actually set at it. Pure.
export const TABLE_CARRY_MARGIN_MM = 450;
export function seatBelongsToTable(
  hostX: number, hostY: number, hostRotation: number | undefined,
  hostW: number, hostH: number,
  seatX: number, seatY: number, captureMm = TABLE_CARRY_MARGIN_MM,
): boolean {
  const l = furnitureWorldToLocal(hostRotation, seatX - hostX, seatY - hostY);
  return Math.abs(l.x) <= hostW / 2 + captureMm && Math.abs(l.y) <= hostH / 2 + captureMm;
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

// ── Ruler (measure) + wall/structure dimensions (Feature A + B, pure math) ──
// All 2D. Distances/points are world-mm. WALL_HALF (50) = wallThick(100)/2, so
// a wall's FACE sits WALL_HALF off its centerline — the "inside/clear" distance
// between two walls is centerline distance − 100.
const RULER_WALL_HALF = 50;

export interface ClosestPair { ax: number; ay: number; bx: number; by: number; mm: number; }

// Closest points between two segments (Ericson, ClosestPtSegmentSegment).
// Returns both closest points + the distance. Handles crossing (mm≈0),
// parallel, collinear, and point-degenerate (a1==a2 and/or b1==b2) inputs.
function segSegClosest(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): ClosestPair {
  const d1x = a2.x - a1.x, d1y = a2.y - a1.y;   // seg A direction
  const d2x = b2.x - b1.x, d2y = b2.y - b1.y;   // seg B direction
  const rx = a1.x - b1.x, ry = a1.y - b1.y;
  const a = d1x * d1x + d1y * d1y;              // |A|²
  const e = d2x * d2x + d2y * d2y;              // |B|²
  const f = d2x * rx + d2y * ry;
  const EPS = 1e-9;
  const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
  let s: number, t: number;
  if (a <= EPS && e <= EPS) { s = 0; t = 0; }          // both points
  else if (a <= EPS) { s = 0; t = clamp01(f / e); }    // A is a point
  else {
    const c = d1x * rx + d1y * ry;
    if (e <= EPS) { t = 0; s = clamp01(-c / a); }      // B is a point
    else {
      const b = d1x * d2x + d1y * d2y;
      const denom = a * e - b * b;
      s = denom !== 0 ? clamp01((b * f - c * e) / denom) : 0;
      t = (b * s + f) / e;
      if (t < 0) { t = 0; s = clamp01(-c / a); }
      else if (t > 1) { t = 1; s = clamp01((b - c) / a); }
    }
  }
  const ax = a1.x + d1x * s, ay = a1.y + d1y * s;
  const bx = b1.x + d2x * t, by = b1.y + d2y * t;
  return { ax, ay, bx, by, mm: Math.hypot(ax - bx, ay - by) };
}

// Plain distance between two segments.
export function segSegDistance(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): number {
  return segSegClosest(a1, a2, b1, b2).mm;
}

// Closest pair of points between two polylines (each a list of ≥1 points). A
// single-point list is treated as a degenerate segment. Iterates every segment
// pair and keeps the minimum.
export function polylineClosestPair(ptsA: Vec2[], ptsB: Vec2[]): ClosestPair {
  const segsOf = (pts: Vec2[]): [Vec2, Vec2][] => {
    if (pts.length === 0) return [];
    if (pts.length === 1) return [[pts[0], pts[0]]];
    const out: [Vec2, Vec2][] = [];
    for (let i = 0; i < pts.length - 1; i++) out.push([pts[i], pts[i + 1]]);
    return out;
  };
  const A = segsOf(ptsA), B = segsOf(ptsB);
  let best: ClosestPair = { ax: 0, ay: 0, bx: 0, by: 0, mm: Infinity };
  for (const [a1, a2] of A)
    for (const [b1, b2] of B) {
      const c = segSegClosest(a1, a2, b1, b2);
      if (c.mm < best.mm) best = c;
    }
  if (!isFinite(best.mm)) {
    // Both empty — degenerate; report a zero-length pair at the origin.
    const pa = ptsA[0] ?? { x: 0, y: 0 }, pb = ptsB[0] ?? { x: 0, y: 0 };
    return { ax: pa.x, ay: pa.y, bx: pb.x, by: pb.y, mm: Math.hypot(pa.x - pb.x, pa.y - pb.y) };
  }
  return best;
}

// Pull each end of a closest pair TOWARD the other by its inset (mm), and reduce
// the reported distance by the two insets (clamped ≥ 0). Used to convert a
// centerline pair into a FACE-to-FACE pair.
function pullPair(pair: ClosestPair, insetA: number, insetB: number): ClosestPair {
  const dx = pair.bx - pair.ax, dy = pair.by - pair.ay;
  const len = Math.hypot(dx, dy);
  const ux = len > 1e-9 ? dx / len : 1, uy = len > 1e-9 ? dy / len : 0;
  return {
    ax: pair.ax + ux * insetA, ay: pair.ay + uy * insetA,
    bx: pair.bx - ux * insetB, by: pair.by - uy * insetB,
    mm: Math.max(0, pair.mm - insetA - insetB),
  };
}

// Inside/clear dimension between two walls: closest pair of their centerlines,
// pulled WALL_HALF toward each other on both sides (→ face-to-face points), with
// mm = centerline distance − 100, clamped ≥ 0. Overlapping walls → mm 0.
export function wallClearance(a: { points: Vec2[] }, b: { points: Vec2[] }): ClosestPair {
  return pullPair(polylineClosestPair(a.points, b.points), RULER_WALL_HALF, RULER_WALL_HALF);
}

// A furniture piece's world-mm footprint as a CLOSED polyline (5 pts, last ==
// first) so polyline routines see all four edges.
function furnitureRectClosed(it: { x: number; y: number; w: number; h: number; rotation?: number }): Vec2[] {
  const c = furnitureCorners(it).map(k => ({ x: k.x, y: k.y }));
  return [...c, c[0]];
}

// Separating-axis overlap test for two convex polygons (rect footprints).
function polysOverlap(polyA: Vec2[], polyB: Vec2[]): boolean {
  const axes = (poly: Vec2[]): Vec2[] => {
    const out: Vec2[] = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const ex = b.x - a.x, ey = b.y - a.y, len = Math.hypot(ex, ey);
      if (len > 1e-9) out.push({ x: -ey / len, y: ex / len });
    }
    return out;
  };
  const proj = (poly: Vec2[], ax: Vec2): [number, number] => {
    let lo = Infinity, hi = -Infinity;
    for (const p of poly) { const d = p.x * ax.x + p.y * ax.y; if (d < lo) lo = d; if (d > hi) hi = d; }
    return [lo, hi];
  };
  for (const ax of [...axes(polyA), ...axes(polyB)]) {
    const [aLo, aHi] = proj(polyA, ax), [bLo, bHi] = proj(polyB, ax);
    if (aHi < bLo || bHi < aLo) return false;   // a separating axis → no overlap
  }
  return true;
}

// Min distance between two rotated-rect furniture footprints (0 when
// overlapping). Returns the closest pair points for drawing.
export function furnitureClearance(
  a: { x: number; y: number; w: number; h: number; rotation?: number },
  b: { x: number; y: number; w: number; h: number; rotation?: number },
): ClosestPair {
  const pa = furnitureRectClosed(a), pb = furnitureRectClosed(b);
  if (polysOverlap(pa.slice(0, 4), pb.slice(0, 4)))
    return { ax: a.x, ay: a.y, bx: b.x, by: b.y, mm: 0 };
  return polylineClosestPair(pa, pb);
}

// Resolve one ruler end into a measurement shape: a polyline + a face inset
// (WALL_HALF for walls, 0 for point/furniture). Null when an object end dangles
// (deleted item).
function rulerEndShape(end: RulerEnd, f: Floor): { pts: Vec2[]; inset: number } | null {
  if (end.kind === 'point') return { pts: [{ x: end.x, y: end.y }], inset: 0 };
  if (end.kind === 'wall') {
    const w = f.walls.find(x => x.id === end.wallId);
    return w && w.points.length ? { pts: w.points, inset: RULER_WALL_HALF } : null;
  }
  const it = f.furniture.find(x => x.id === end.furnitureId);
  return it ? { pts: furnitureRectClosed(it), inset: 0 } : null;
}

// Resolve a ruler's two ends to drawable endpoints + the measured distance.
// point↔point = plain distance; an object end measures to that object's FACE
// (wall, offset WALL_HALF) / footprint edge (furniture); object↔object measures
// the inside clearance (the dedicated clearance fns). A dangling object id → null.
export function resolveRulerEnds(ruler: Ruler, f: Floor): ClosestPair | null {
  const { a, b } = ruler;
  if (a.kind === 'point' && b.kind === 'point')
    return { ax: a.x, ay: a.y, bx: b.x, by: b.y, mm: Math.hypot(a.x - b.x, a.y - b.y) };
  if (a.kind === 'wall' && b.kind === 'wall') {
    const wa = f.walls.find(x => x.id === a.wallId), wb = f.walls.find(x => x.id === b.wallId);
    return wa && wb ? wallClearance(wa, wb) : null;
  }
  if (a.kind === 'furniture' && b.kind === 'furniture') {
    const ia = f.furniture.find(x => x.id === a.furnitureId), ib = f.furniture.find(x => x.id === b.furnitureId);
    return ia && ib ? furnitureClearance(ia, ib) : null;
  }
  // Mixed (point↔object, wall↔furniture): general closest pair + per-side inset.
  const sa = rulerEndShape(a, f), sb = rulerEndShape(b, f);
  if (!sa || !sb) return null;
  return pullPair(polylineClosestPair(sa.pts, sb.pts), sa.inset, sb.inset);
}

// Move a ruler's end `b` (ONLY when b is a free point) along the current a→b
// bearing to the given length (mm). Mutates ruler.b and returns the new point,
// or null when b is object-anchored / the ruler can't resolve. Degenerate
// (a==b) bearing → +X.
export function rulerSetLength(ruler: Ruler, f: Floor, mm: number): Vec2 | null {
  if (ruler.b.kind !== 'point') return null;
  const r = resolveRulerEnds(ruler, f);
  if (!r) return null;
  const dx = r.bx - r.ax, dy = r.by - r.ay, len = Math.hypot(dx, dy);
  const ux = len > 1e-9 ? dx / len : 1, uy = len > 1e-9 ? dy / len : 0;
  const nx = r.ax + ux * mm, ny = r.ay + uy * mm;
  ruler.b = { kind: 'point', x: nx, y: ny };
  return { x: nx, y: ny };
}

// One classified wall SEGMENT (a consecutive point pair on one wall).
export interface WallSegment { wallId: string; index: number; a: Vec2; b: Vec2; exterior: boolean; }

const DIM_EDGE_TOL = 30;   // mm: a segment midpoint "lies on" a loop edge within this
// Does (mid) lie on any edge of the closed loop within DIM_EDGE_TOL?
function midpointOnLoop(mid: Vec2, loop: Vec2[]): boolean {
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i], b = loop[(i + 1) % loop.length];
    if (pointToSeg(mid.x, mid.y, a.x, a.y, b.x, b.y) <= DIM_EDGE_TOL) return true;
  }
  return false;
}
// Outer loops = closed wall loops not geometrically contained inside another
// loop. closedWallLoops returns minimal interior faces (disjoint rooms), so in
// practice every loop is "outer"; the filter is defensive for future nesting.
function outerLoops(loops: Vec2[][]): Vec2[][] {
  return loops.filter((L, i) => !loops.some((M, j) =>
    j !== i && Math.abs(polygonArea(M)) > Math.abs(polygonArea(L)) &&
    pointInPolygon(centroid(L).x, centroid(L).y, M)));
}

// Classify every wall segment as exterior or not. A segment borders a room when
// its midpoint lies on that room loop's path; a segment on exactly ONE loop is
// exterior (room on one side, outside on the other), on TWO loops it's an
// interior partition, on ZERO loops (standalone wall) it's NOT exterior.
export function outerWallSegments(walls: Wall[]): WallSegment[] {
  const loops = outerLoops(closedWallLoops(walls));
  const out: WallSegment[] = [];
  for (const w of walls) {
    for (let i = 0; i < w.points.length - 1; i++) {
      const a = w.points[i], b = w.points[i + 1];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      let count = 0;
      for (const L of loops) if (midpointOnLoop(mid, L)) count++;
      out.push({ wallId: w.id, index: i, a, b, exterior: count === 1 });
    }
  }
  return out;
}

// Outward unit normal for placing a dimension line beside a segment. For a
// segment bordering exactly one loop the normal points AWAY from that loop's
// interior (its centroid); otherwise a consistent +normal side.
export function wallDimSide(seg: { a: Vec2; b: Vec2 }, loops: Vec2[][]): Vec2 {
  const dx = seg.b.x - seg.a.x, dy = seg.b.y - seg.a.y, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;             // +90° normal
  const mid = { x: (seg.a.x + seg.b.x) / 2, y: (seg.a.y + seg.b.y) / 2 };
  const home = loops.find(L => midpointOnLoop(mid, L));
  if (home) {
    const c = centroid(home);
    const toward = nx * (mid.x - c.x) + ny * (mid.y - c.y);   // >0 ⇒ +normal points outward
    return toward >= 0 ? { x: nx, y: ny } : { x: -nx, y: -ny };
  }
  return { x: nx, y: ny };
}

// Axis-aligned bounding box of every wall point, or null when there are no walls.
export function structureExtents(walls: Wall[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, any = false;
  for (const w of walls) for (const p of w.points) {
    any = true;
    if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
  }
  return any ? { minX, minY, maxX, maxY } : null;
}

// ── Floor list display order & peek underlay (Change 1 + 3) ──────────────────
// Store.floors array order is CANONICAL (index 0 = lowest story; stair links,
// BLE floor ranking, ghost stacking all depend on it). The USER-FACING list is
// shown highest-story-first (elevator-panel intuition), so both the sidebar
// Floors list and the kiosk/view topbar select render this reversed SHALLOW
// copy. Never mutates the input array.
export function floorsDisplayOrder<T>(floors: readonly T[]): T[] {
  return floors.slice().reverse();
}

// Floors whose 2D wall outline should draw as a reference underlay while some
// OTHER floor is the active one: peek2d && !disabled, excluding the current
// floor. Pure selection helper (consumed by canvas-render's onion-skin pass).
export function peekFloors(floors: readonly Floor[], currentId: string): Floor[] {
  return floors.filter(f => f.id !== currentId && f.peek2d && !f.disabled);
}
