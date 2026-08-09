// Pure geometry helpers — no DOM, no state.

import type { Vec2, Sensor, BgImage, LightIconKind, FurnitureKind, EnvKind, WallKind,
  ActivityKind, ObjectRecipe, Furniture, Room, Floor, SafetyKind, GroundKind, GroundArea,
  InfoCard, InfoCardMount, ActionKind, SprinklerHeadKind, Pool,
  Wall, Ruler, RulerEnd, DoorKind, WindowKind, FloorTexKind, OutdoorArea } from './types.js';
import { formatEntityValue, formatClock, evalRules, ruleMatches, relTimeText,
  type HassStateLike, type ClockMode, type ValueRule } from './value-rules.js';
// Vehicle model packs (pure, three-free). vehicles.ts imports NOTHING at runtime
// — in particular it must never import geometry.ts back (that would be a cycle).
import { vehicleRecipe } from './vehicles.js';

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

// ---------------------------------------------------------------------------
// Midpoint vertex-INSERT handles (the map-editor idiom). Every polyline /
// polygon that already has draggable vertices exposes a small "+" ghost at the
// midpoint of each edge; pressing one splices a vertex there and immediately
// starts the ordinary vertex drag for it, so an insert + placement is ONE
// gesture (and therefore ONE undo step — the drag release saves).
//
// `closed` distinguishes the two families: an OPEN polyline (walls, path
// centerlines) with N points has N−1 edges; a CLOSED polygon (ground / pool /
// void / presence zone) has N edges including the wrap-around N−1 → 0.
// `idx` is the SPLICE index — `pts.splice(h.idx, 0, {x, y})` puts the new
// vertex between the edge's two endpoints in both families (the wrap edge
// appends at the end, which is the same ring position).
//
// `minLenMm` drops midpoints on edges too short to be worth a handle (callers
// pass a screen-px threshold converted through view.scale, so the declutter is
// zoom-relative). Pure — no view / DOM knowledge.
export interface VertexInsertHandle { idx: number; x: number; y: number }

export function midpointHandles(pts: Vec2[], closed: boolean, minLenMm = 0): VertexInsertHandle[] {
  const out: VertexInsertHandle[] = [];
  const n = pts.length;
  if (n < 2) return out;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    if (!a || !b) continue;
    if (minLenMm > 0 && Math.hypot(b.x - a.x, b.y - a.y) < minLenMm) continue;
    out.push({ idx: i + 1, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  }
  return out;
}

// Vertex caps as ACTUALLY enforced by the draw latches / finish* handlers —
// insertion must never push a shape past what a fresh draw could produce.
// (Presence zones have no cap in either path; POLY_VERTEX_CAP_PZONE is
// Infinity to say so explicitly rather than by omission.)
export const POLY_VERTEX_CAP_GROUND = 20;
export const POLY_VERTEX_CAP_POOL = 20;
export const POLY_VERTEX_CAP_VOID = 12;
export const POLY_VERTEX_CAP_PATH = 40;
export const POLY_VERTEX_CAP_PZONE = Infinity;

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

// ── Building envelope vs yard boundary ───────────────────────────────────────
// Wall kinds that enclose OUTDOOR space rather than house interior: the four
// fence kinds, a hedge, and a railing (a 914 mm banister fences a deck, it does
// not roof a room). They are still SOLID to a walker/driver — segCrossesSolidWall
// blocks every one of them and a gate is the only way through — but the region
// they enclose is yard, which is exactly where a lawn mower belongs.
// `canvas-interact.isFenceLikeKind` (which kinds default a dropped door to
// 'gate') delegates here so the two can never disagree.
export const BOUNDARY_WALL_KINDS = new Set<WallKind>([
  'fence_picket', 'fence_privacy', 'fence_chainlink', 'hedge', 'railing',
]);
export function isBoundaryWallKind(k: string | null | undefined): boolean {
  return k != null && BOUNDARY_WALL_KINDS.has(k as WallKind);
}

// Closed loops that count as BUILDING INTERIOR — `closedWallLoops` over the
// non-boundary walls only. Invisible walls stay in (they exist to close/subdivide
// floor regions), fences/hedges/railings drop out (a fenced yard must not read as
// "indoors" or the mower would have nowhere legal to stand). Pure.
export function buildingWallLoops(walls: { points: Vec2[]; kind?: WallKind }[]): Vec2[][] {
  return closedWallLoops(walls.filter(w => !isBoundaryWallKind(wallKind(w))));
}

// Is (x, y) inside ANY of `loops`? The shared spelling of the containment test
// the mower's sweep-waypoint generator and its per-step containment guard both
// run, so they can never disagree about what "indoors" means. Pure.
export function pointInAnyLoop(loops: Vec2[][], x: number, y: number): boolean {
  for (const lp of loops) if (pointInPolygon(x, y, lp)) return true;
  return false;
}

// Nearest point OUTSIDE every loop, for a point that currently sits inside one:
// project onto the containing loop's boundary, then step `margin` mm out along
// that edge's normal, taking whichever side is genuinely outside. Returns the
// input UNCHANGED when it is already outside (the common case — callers may call
// it unconditionally). Falls back to the boundary point itself when neither side
// is free (a corridor thinner than 2·margin). Pure.
export function nearestPointOutsideLoops(
  loops: Vec2[][], x: number, y: number, margin = 300,
): { x: number; y: number } {
  if (!pointInAnyLoop(loops, x, y)) return { x, y };
  let best: { x: number; y: number; nx: number; ny: number } | null = null;
  let bd = Infinity;
  for (const lp of loops) {
    for (let i = 0, n = lp.length; i < n; i++) {
      const a = lp[i], b = lp[(i + 1) % n];
      const dx = b.x - a.x, dy = b.y - a.y, len2 = dx * dx + dy * dy;
      if (len2 < 1) continue;
      let t = ((x - a.x) * dx + (y - a.y) * dy) / len2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = a.x + t * dx, py = a.y + t * dy;
      const d = Math.hypot(px - x, py - y);
      if (d < bd) {
        const L = Math.sqrt(len2);
        bd = d; best = { x: px, y: py, nx: -dy / L, ny: dx / L };
      }
    }
  }
  if (!best) return { x, y };
  for (const s of [1, -1]) {
    const cx = best.x + best.nx * margin * s, cy = best.y + best.ny * margin * s;
    if (!pointInAnyLoop(loops, cx, cy)) return { x: cx, y: cy };
  }
  return { x: best.x, y: best.y };
}

// Is the wall SEGMENT a→b part of the building envelope, i.e. does it bound one
// of the closed wall loops `closedWallLoops` traced? Pure; loops are the ones
// that function returned (vertices are welded node positions, no repeated first
// point — adjacency wraps).
//
// Used by the 3D wall builder to decide whether a wall follows the surroundings
// grade (free-standing yard structure) or stays on the slab (house structure).
// It must run BEFORE any "is the midpoint outdoors" test: a perimeter wall's own
// midpoint lies exactly ON its loop boundary, and pointInPolygon EXCLUDES the
// boundary, so an outdoors-only predicate would read the whole house envelope as
// "outside" and sink it to the grade.
//
// Two ways a segment can be a member:
//  1. Exact edge match — some adjacent loop pair (u, v) has a≈u and b≈v (either
//     direction), within the same 25 mm weld closedWallLoops uses to heal the
//     small gaps baked into saved plans.
//  2. Boundary coverage — closedWallLoops SPLITS a wall at every T-junction and
//     crossing node, so a perimeter wall carrying an interior partition tee
//     appears as two or more shorter edges (often in DIFFERENT loops: the tee
//     splits the room in two, and each half-wall bounds its own room) and can
//     never match (1). A segment whose whole extent runs along the UNION of the
//     loop boundaries (sampled) is a member too. (1) is a strict subset of (2);
//     it is kept as the cheap exact path.
export function wallSegmentInLoops(
  a: Vec2, b: Vec2, loops: Vec2[][], weldMm = 25,
): boolean {
  if (!loops.length) return false;
  const w2 = weldMm * weldMm;
  const d2 = (p: Vec2, q: Vec2) => {
    const dx = p.x - q.x, dy = p.y - q.y;
    return dx * dx + dy * dy;
  };
  // Squared distance from (px, py) to the closed polyline `lp`.
  const distToLoop2 = (px: number, py: number, lp: Vec2[]): number => {
    let best = Infinity;
    for (let i = 0, n = lp.length; i < n; i++) {
      const u = lp[i], v = lp[(i + 1) % n];
      const dx = v.x - u.x, dy = v.y - u.y, len2 = dx * dx + dy * dy;
      let t = len2 > 0 ? ((px - u.x) * dx + (py - u.y) * dy) / len2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = u.x + t * dx - px, qy = u.y + t * dy - py;
      const d = qx * qx + qy * qy;
      if (d < best) best = d;
    }
    return best;
  };
  for (const lp of loops) {
    if (lp.length < 3) continue;
    for (let i = 0, n = lp.length; i < n; i++) {
      const u = lp[i], v = lp[(i + 1) % n];
      if ((d2(a, u) <= w2 && d2(b, v) <= w2) || (d2(a, v) <= w2 && d2(b, u) <= w2)) return true;
    }
  }
  const SAMPLES = 16;   // 17 points t = 0, 1/16 … 1 along the segment
  for (let k = 0; k <= SAMPLES; k++) {
    const t = k / SAMPLES;
    const px = a.x + (b.x - a.x) * t, py = a.y + (b.y - a.y) * t;
    let nearAny = false;
    for (const lp of loops) {
      if (lp.length < 3) continue;
      if (distToLoop2(px, py, lp) <= w2) { nearAny = true; break; }
    }
    if (!nearAny) return false;
  }
  return true;
}

// Convenience: does ANY segment of this wall polyline bound a closed loop?
// (A wall is "free-standing" only when none of its segments does.)
export function wallInLoops(
  wall: { points: Vec2[] }, loops: Vec2[][], weldMm = 25,
): boolean {
  const pts = wall.points ?? [];
  for (let i = 0; i < pts.length - 1; i++) {
    if (wallSegmentInLoops(pts[i], pts[i + 1], loops, weldMm)) return true;
  }
  return false;
}

// ── Rooms ────────────────────────────────────────────────────────────────
// A room is a name + anchor point; the room IS whichever closed wall loop
// currently contains the anchor. These two helpers resolve that live.

// First loop (in order) that geometrically contains (x, y), or null.
export function loopContaining(loops: Vec2[][], x: number, y: number): Vec2[] | null {
  for (const loop of loops) if (pointInPolygon(x, y, loop)) return loop;
  return null;
}

// Pull a point INTO a closed wall loop (`Sensor.confineToRoom`). mmWave radar
// sees through drywall — multipath / overshoot puts the reported target a metre
// or two past the wall, so the avatar legitimately materialises in the next
// room. This is the opt-in clamp: a point already inside the loop is returned
// unchanged (identity in VALUE — a fresh Vec2, callers never rely on identity),
// anything outside lands on the nearest boundary point nudged `insetMm` inward
// so `pointInPolygon` (which excludes the edge itself) accepts the result.
//
// The inward nudge is DERIVED, never assumed: try the p→q push-back direction
// first (correct for any convex approach), then aim at the loop centroid (which
// rescues a concave notch where the push-back would exit again), then the
// centroid itself (a loop too small to hold the inset). Each candidate is
// verified with pointInPolygon; the boundary point q is the last-ditch answer,
// so the function NEVER returns a point further out than the wall.
//
// Degenerate input (fewer than 3 verts, non-finite coords) → the input point
// unchanged: confinement is a refinement, never a source of NaN.
export function clampPointToLoop(loop: Vec2[], x: number, y: number, insetMm = 60): Vec2 {
  const n = loop?.length ?? 0;
  if (n < 3 || !Number.isFinite(x) || !Number.isFinite(y)) return { x, y };
  if (pointInPolygon(x, y, loop)) return { x, y };
  // Nearest point on the closed ring (the wrap edge included).
  let qx = loop[0].x, qy = loop[0].y, bd = Infinity;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const ax = loop[j].x, ay = loop[j].y, bx = loop[i].x, by = loop[i].y;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2)) : 0;
    const px = ax + t * dx, py = ay + t * dy;
    const d = (x - px) * (x - px) + (y - py) * (y - py);
    if (d < bd) { bd = d; qx = px; qy = py; }
  }
  if (!Number.isFinite(qx) || !Number.isFinite(qy)) return { x, y };
  if (!(insetMm > 0)) return { x: qx, y: qy };
  const c = centroid(loop);
  const cands: Vec2[] = [];
  const pdx = qx - x, pdy = qy - y, pl = Math.hypot(pdx, pdy);
  if (pl > 1e-6) cands.push({ x: qx + (pdx / pl) * insetMm, y: qy + (pdy / pl) * insetMm });
  const cdx = c.x - qx, cdy = c.y - qy, cl = Math.hypot(cdx, cdy);
  if (cl > 1e-6) cands.push({ x: qx + (cdx / cl) * insetMm, y: qy + (cdy / cl) * insetMm });
  cands.push(c);
  for (const cd of cands)
    if (Number.isFinite(cd.x) && Number.isFinite(cd.y) && pointInPolygon(cd.x, cd.y, loop)) return cd;
  return { x: qx, y: qy };
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
//
// Resolution order: the user's typed `name` → the bound HA area's name (passed
// in by the caller — geometry.ts never reaches into the registry) → the
// placeholder. Binding an area therefore NAMES a room without overwriting
// anything the user typed. `areaName` is optional so every pre-existing caller
// (and any stale chunk) keeps today's two-step behaviour verbatim.
export function roomLabel(
  rm: Room, areaName?: string | null,
): { text: string; placeholder: boolean } {
  const t = rm.name.trim();
  if (t) return { text: t, placeholder: false };
  const a = (areaName ?? '').trim();
  if (a) return { text: a, placeholder: false };
  return { text: 'Unnamed room', placeholder: true };
}

// Map each closed wall loop to the room that owns it (the room whose anchor
// falls inside it). The loop→room direction is what per-loop RENDERING needs
// (per-room flooring, occupancy wash): iterate loops, ask "whose is this?".
// First room wins when two anchors share a loop — the same rule
// resolveRoomForPoint applies from the other direction. Keyed by loop array
// IDENTITY, so the caller must pass the SAME loops array it renders from.
export function roomsByLoop(rooms: Room[], loops: Vec2[][]): Map<Vec2[], Room> {
  const out = new Map<Vec2[], Room>();
  for (const rm of rooms) {
    const lp = loopContaining(loops, rm.anchor.x, rm.anchor.y);
    if (lp && !out.has(lp)) out.set(lp, rm);
  }
  return out;
}

// Per-room flooring resolution (task: per-room flooring). A room may override
// the floor colour / texture for its own loop; absent OR null = inherit the
// floor-wide look the caller already resolved (Floor.look3d → Store.scene3d →
// defaults). Pure so 2D and 3D can never disagree.
export function roomFloorLook(
  rm: Room | null | undefined, baseColor: string, baseTex: FloorTexKind,
): { color: string; tex: FloorTexKind } {
  return {
    color: rm?.floorColor ?? baseColor,
    tex: (rm?.floorTex ?? baseTex) as FloorTexKind,
  };
}

// Display label for the OUTDOOR pseudo-area: typed name → bound HA area name
// (resolved by the caller — geometry.ts never reaches into the registry) →
// "Outdoors".
export function outdoorLabel(
  od: OutdoorArea | null | undefined, areaName?: string | null,
): string {
  const t = (od?.name ?? '').trim();
  if (t) return t;
  const a = (areaName ?? '').trim();
  if (a) return a;
  return 'Outdoors';
}

// True when the floor's outdoor pseudo-area carries anything the user set (a
// name or an HA-area binding). An untouched floor keeps today's behaviour
// everywhere (no ladder step 3, "— No room —" bucket label unchanged).
export function outdoorConfigured(od: OutdoorArea | null | undefined): boolean {
  return !!od && (!!(od.name ?? '').trim() || !!od.haAreaId);
}

// Resolve the HA area a plan point belongs to. PINNED LADDER:
//   1. the FUZZY-resolved room (boundary-tolerant, the same rule the sidebar's
//      room grouping uses) — a room hit ENDS the ladder even when that room is
//      unbound (haAreaId null), which is today's behaviour;
//   2. else the SMALLEST bound GroundArea containing the point (the enclosure
//      idiom groundAreaSkirtBase uses — a small patch drawn inside a big lawn
//      wins); hidden areas are skipped, unbound ones are not candidates;
//   3. else the floor's `outdoor` pseudo-area when the point lies outside every
//      closed wall loop AND the user configured it;
//   4. else null (unfiltered — today's behaviour).
// `areaName` maps an HA area_id → display name (Planner.areaName).
export function resolveAreaBindingForPoint(
  floor: { rooms?: Room[]; groundAreas?: GroundArea[]; outdoor?: OutdoorArea },
  loops: Vec2[][], x: number, y: number,
  areaName?: (areaId: string) => string | null,
): { haAreaId: string | null; label: string; source: 'room' | 'ground' | 'outdoor' } | null {
  const nameOf = (id: string | null | undefined) => (id && areaName ? areaName(id) : null);
  const rm = resolveRoomForPointFuzzy(floor.rooms ?? [], loops, x, y);
  if (rm) {
    return {
      haAreaId: rm.haAreaId ?? null,
      label: roomLabel(rm, nameOf(rm.haAreaId)).text,
      source: 'room',
    };
  }
  let best: GroundArea | null = null, bestArea = Infinity;
  for (const g of floor.groundAreas ?? []) {
    if (g.hidden || !g.haAreaId || g.points.length < 3) continue;
    if (!pointInPolygon(x, y, g.points)) continue;
    const a = Math.abs(polygonArea(g.points));
    if (a < bestArea) { bestArea = a; best = g; }
  }
  if (best) {
    return {
      haAreaId: best.haAreaId ?? null,
      label: (best.name ?? '').trim() || nameOf(best.haAreaId) || groundKindLabel(best.kind),
      source: 'ground',
    };
  }
  if (outdoorConfigured(floor.outdoor) && !loopContaining(loops, x, y)) {
    return {
      haAreaId: floor.outdoor!.haAreaId ?? null,
      label: outdoorLabel(floor.outdoor, nameOf(floor.outdoor!.haAreaId)),
      source: 'outdoor',
    };
  }
  return null;
}

// ── Wall openings (doors / windows cut gaps into wall segments) ──────────
// A door's (x, y) is its HINGE; its span runs w mm along its rotation.
// doorSpanCenter gives the midpoint used for wall cutting. Windows' (x, y)
// is already the pane center.
export function doorSpanCenter(d: { x: number; y: number; w: number; rotation: number }): Vec2 {
  const t = (d.rotation || 0) * Math.PI / 180;
  return { x: d.x + Math.cos(t) * d.w / 2, y: d.y - Math.sin(t) * d.w / 2 };
}

// Normalize a degrees value into [0, 360) — shared by the opening-rotation
// helpers so a round trip (+180 twice) lands on the SAME number, hence the same
// cos/sin bits, hence a bit-exact anchor restore.
function normDeg360(deg: number): number {
  const n = deg % 360;
  return n < 0 ? n + 360 : n;
}

// ── Rotating an opening ABOUT ITS SPAN CENTRE ───────────────────────────────
// A door's stored (x, y) is its HINGE, so mutating `rotation` alone sweeps the
// whole panel AROUND that hinge: turning a door 180° (to flip which side is
// "inside") teleports it to the far side of the hinge instead of leaving it on
// the same wall. Every SIDEBAR rotation edit therefore re-anchors so the span
// keeps its centre — the panel occupies the SAME two endpoints (swapped).
// Formulated as an anchor DELTA (`x + (cos t0 − cos t1)·w/2`) rather than
// "centre, then back off" so a +180/+180 round trip cancels EXACTLY in real
// arithmetic: the second call normalizes to the same two angles, recomputes
// the identical cos/sin pair, and adds the exact negation of the first delta.
// It is NOT bit-exact — `(x + d) − d` re-associates, so the anchor can land
// one double ULP off (measured max 4.6e-13 mm over an exhaustive
// width × rotation × position sweep; see door-kinds-test §14). That is a
// picometre: it can never accumulate into a visible drift, and the SPAN
// ENDPOINTS + centre are preserved to the same bound. Do not "fix" this by
// quantizing the output to a grid — real exactness needs compensated
// (error-free) arithmetic with state we deliberately do not store.
//
// NB the CANVAS endpoint drag (`doorRotate` in canvas-interact) deliberately
// keeps pivoting about the grabbed hinge — that gesture IS "swing this end
// around", and the grabbed handle must stay under the cursor. Do not unify.
export function rotateDoorAboutCenter(
    d: { x: number; y: number; w: number; rotation: number }, newRotationDeg: number)
    : { x: number; y: number; rotation: number } {
  const rot = normDeg360(newRotationDeg);
  const t0 = normDeg360(d.rotation || 0) * Math.PI / 180;
  const t1 = rot * Math.PI / 180;
  const h = d.w / 2;
  return {
    x: d.x + (Math.cos(t0) - Math.cos(t1)) * h,
    y: d.y - (Math.sin(t0) - Math.sin(t1)) * h,
    rotation: rot,
  };
}

// Windows are ALREADY centre-anchored ((x, y) is the pane centre — see
// `windowEndpoints`), so rotating one about its centre only touches
// `rotation`. The helper exists so both sidebar editors read the same and so
// the invariant is test-pinned: nobody should "fix" the window path by
// re-anchoring it like a door.
export function rotateWindowAboutCenter(
    w: { x: number; y: number; w: number; rotation: number }, newRotationDeg: number)
    : { x: number; y: number; rotation: number } {
  return { x: w.x, y: w.y, rotation: normDeg360(newRotationDeg) };
}

// Window opening geometry defaults (mm). `sill` = bottom of glass above floor;
// `height` = glass height (the 3D header derives as sill + height). Shared by the
// 3D wall cut and the pane builder so the solid runs and the glass line up.
export const WINDOW_DEFAULTS = { sill: 900, height: 800 };
// Bay windows (kind 'bay' / 'bay_bench') read best sitting LOWER and TALLER than
// a punched opening: the bay's own base board runs floor→sill, and for
// `bay_bench` that sill IS the bench seat, so it must land at real seat height.
// `sideFrac` = each angled return's along-wall run as a fraction of the opening
// width; the projection depth is capped at `depth` AND at that run, so the
// returns always splay at ≤45° from the wall (a real bay reads 30–45°).
export const BAY_WINDOW_DEFAULTS = { sill: 450, height: 1500, w: 1800, depth: 600, sideFrac: 0.28 };
// Resolved bay plan for an opening of width W: how far each return runs along
// the wall, the projection depth, and the resulting centre-pane width.
export function bayPlan(W: number): { sideRun: number; depth: number; centerW: number; angleDeg: number } {
  const sideRun = Math.max(120, W * BAY_WINDOW_DEFAULTS.sideFrac);
  const depth = Math.min(BAY_WINDOW_DEFAULTS.depth, sideRun);
  return {
    sideRun, depth,
    centerW: Math.max(200, W - 2 * sideRun),
    angleDeg: Math.atan2(depth, sideRun) * 180 / Math.PI,
  };
}
export function isBayWindowKind(kind: WindowKind | undefined): boolean {
  return kind === 'bay' || kind === 'bay_bench';
}
// Kind-aware sill / glass-height resolution. Every consumer (the wall cut, the
// 3D pane builder, the sidebar inputs) routes through these so a bay can never
// be cut at one height and glazed at another.
export function windowSillMm(w: { kind?: WindowKind; sill?: number }): number {
  return w.sill ?? (isBayWindowKind(w.kind) ? BAY_WINDOW_DEFAULTS.sill : WINDOW_DEFAULTS.sill);
}
export function windowGlassHMm(w: { kind?: WindowKind; height?: number }): number {
  return w.height ?? (isBayWindowKind(w.kind) ? BAY_WINDOW_DEFAULTS.height : WINDOW_DEFAULTS.height);
}
// Default pane length for a NEWLY placed window of `kind` (the doorDefaultWidth
// idiom). A bay needs a wide opening for its three-pane splay to read.
export function windowDefaultWidth(kind: WindowKind | undefined): number {
  return isBayWindowKind(kind) ? BAY_WINDOW_DEFAULTS.w : 1000;
}

// Which side of a window's wall does a BAY project toward? Returns the sign of
// the window's LOCAL Z axis to build the bay on: +1 = local +Z, −1 = local −Z.
//
// Local +Z is the INTERIOR face by convention — roller shades and curtain rods
// hang there — so a bay must project the OTHER way. When closed wall loops are
// available we resolve it honestly: probe both normals and pick the side that
// falls OUTSIDE every loop (outdoors). When nothing decides it (open plan, a
// free-standing wall, no loops at all) we fall back to −1, the side opposite
// the interior face. World normal for local +Z is (sin θ, cos θ).
export function bayProjectSign(
  w: { x: number; y: number; rotation: number },
  loops: Vec2[][] | null | undefined,
  probeMm = 700,
): 1 | -1 {
  const th = (w.rotation || 0) * Math.PI / 180;
  const nx = Math.sin(th), ny = Math.cos(th);
  if (loops && loops.length) {
    const inside = (sx: number, sy: number) => loops.some(lp => pointInPolygon(sx, sy, lp));
    const plusIn = inside(w.x + nx * probeMm, w.y + ny * probeMm);
    const minusIn = inside(w.x - nx * probeMm, w.y - ny * probeMm);
    if (minusIn && !plusIn) return 1;    // −Z is the room ⇒ project +Z
    if (plusIn && !minusIn) return -1;   // +Z is the room ⇒ project −Z
  }
  return -1;
}

// A window cut also carries its sill/height so the 3D wall builder can size the
// sub-sill and header runs per-window (doors leave these undefined). A door cut
// may carry `head` — the opening-top height where its lintel starts (garage doors
// use their own garageDoorHeightMm — GARAGE_DOOR_H unless Door.garageHeight overrides
// it; swing doors leave it undefined → the DOOR_HEAD default).
export interface WallOpeningCut { t0: number; t1: number; kind: 'door' | 'window'; sill?: number; height?: number; head?: number; }

// Merge a sorted-by-t0 opening list into the solid complement of [0, len].
function solidComplement(cuts: { t0: number; t1: number }[], len: number): { t0: number; t1: number }[] {
  if (!cuts.length) return [{ t0: 0, t1: len }];
  const sorted = [...cuts].sort((c1, c2) => c1.t0 - c2.t0);
  const solids: { t0: number; t1: number }[] = [];
  let cursor = 0;
  for (const c of sorted) {
    if (c.t0 > cursor + 1) solids.push({ t0: cursor, t1: c.t0 });
    cursor = Math.max(cursor, c.t1);
  }
  if (cursor < len - 1) solids.push({ t0: cursor, t1: len });
  return solids;
}

// For one wall segment a→b: which door/window openings cut it, and what
// solid sub-intervals remain. t values are mm along the segment. An opening
// counts when its center projects onto the segment within `tol` of the axis.
//
// THREE outputs, deliberately distinct (all ADDITIVE — existing consumers that
// destructure `solids` / `openings` are untouched):
//   solids     — complement of ALL openings. The VISUAL truth: what the 2D
//                stroke paints and what the 3D builder extrudes as full-height
//                wall. Both doors and windows are holes here.
//   openings   — every cut, tagged `kind` (+ per-window sill/height, per-garage
//                head) so the 3D builder can size sub-sill / header / lintel runs.
//   navSolids  — complement of the DOOR openings only, i.e. windows count as
//                SOLID. This is the WALKABLE truth: a window has a ~900 mm sill
//                (bays higher still), so a person cannot step through it. Nav
//                used to share `solids`, which let AI/demo/roamer avatars walk
//                out of the house through a window (user-reported). Consumed by
//                `_buildNav`'s rasterizer + `_nav.wallSolids` (the snap LOS
//                filter — a snap must not see through a window either) and
//                mirrored by scripts/floorplans/physical.mjs's nav replica.
//                With no windows on the segment this is === `solids` by value.
export function wallCutsForSegment(
  a: Vec2, b: Vec2,
  doors: { x: number; y: number; w: number; rotation: number; kind?: DoorKind;
           garageHeight?: number }[],
  windows: { x: number; y: number; w: number; sill?: number; height?: number; kind?: WindowKind }[],
  tol = 150,
): { solids: { t0: number; t1: number }[]; openings: WallOpeningCut[];
     navSolids: { t0: number; t1: number }[] } {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return { solids: [], openings: [], navSolids: [] };
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
    // A garage cut's lintel follows the door's OWN opening height (absent =
    // GARAGE_DOOR_H, so untouched doors cut exactly the same hole as before).
    collect(c.x, c.y, d.w, 'door',
            d.kind === 'garage' ? { head: garageDoorHeightMm(d) } : undefined);
  }
  // Resolve sill/height through the KIND-AWARE helpers (a bay is cut lower and
  // taller than a punched opening) so the wall cut can never disagree with the
  // pane builder. For every non-bay window these resolve to WINDOW_DEFAULTS —
  // the same values the 3D builder's SILL_TOP / WINDOW_GLASS_H fallbacks used.
  for (const w of windows)
    collect(w.x, w.y, w.w, 'window', { sill: windowSillMm(w), height: windowGlassHMm(w) });
  const solids = solidComplement(openings, len);
  // Windows are not walkable (sill height) — nav only opens DOOR spans.
  const doorCuts = openings.filter(c => c.kind === 'door');
  const navSolids = doorCuts.length === openings.length
    ? solids                                       // no windows → identical by value
    : solidComplement(doorCuts, len);
  return { solids, openings, navSolids };
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

// Fire pits (round + square) — outdoor ground fire features built on the
// FIREPLACE pattern: forced warm orange-red regardless of the bound entity's
// colour, per-frame flame flicker (three-view forces the rebuild while one is
// ON, like a fireplace / heatlamp), and GROUND-STANDING (they follow the yard
// grade, see GROUND_STANDING_LIGHT_KINDS in three-renderer.ts). Unlike a
// fireplace they never wall-snap — a fire pit stands in the open.
// FIREPIT_SIZE_MM is the shared footprint (outer diameter / square side) the
// 3D build, the 2D plan glyph and the 2D hit radius all key off, so they can
// never disagree.
export const FIREPIT_SIZE_MM = 900;
export const FIREPIT_KINDS = new Set<LightIconKind>(['firepit_round', 'firepit_square']);
export function isFirepitKind(kind: string | undefined): boolean {
  return kind != null && FIREPIT_KINDS.has(kind as LightIconKind);
}

// Stairs-family kinds a step light can mount flush against.
export const STEP_LIGHT_EDGE_KINDS = new Set<FurnitureKind>(['stairs', 'stairs_half', 'stair_landing']);

// Stairs-family kinds (floor transitions). Shared by the cross-floor stair-link
// feature: only these kinds may carry a Furniture.stairLinkId and take part in a
// transit portal. Superset of STEP_LIGHT_EDGE_KINDS (which is treads-only —
// a step light has nothing to mount to on a ramp). Membership grants the whole
// stairs contract: nav-footprint exemption, slab-relative elevation (never
// auto-grounded), no blob shadow, glass-house translucency + cutaway, stairwell
// hole + shaft walls when sunk, the per-piece Rise override and Fit-between-levels.
export const STAIRS_KINDS = new Set<FurnitureKind>(['stairs', 'stairs_half', 'stair_landing', 'ramp']);
export function isStairsKind(kind?: FurnitureKind): kind is FurnitureKind {
  return kind != null && STAIRS_KINDS.has(kind);
}

// ── Stairs rise & tread count ────────────────────────────────────────────────
// Shortest rise a stairs-family piece may be given (one very shallow step).
export const STAIRS_MIN_RISE_MM = 50;
// Shortest sensible RISER. Divides the rise into treads: a 200 mm patio step is
// ONE step, not the three the depth-only rule used to force. Deliberately below
// code minimums (a real riser is ~150–200 mm) so the cap only ever bites on
// SHORT rises and every default flight keeps the tread count it always had.
export const STAIRS_MIN_RISER_MM = 130;
// Nominal tread depth — the historical depth-only rule, kept verbatim.
export const STAIRS_TREAD_DEPTH_MM = 280;

/**
 * The RISE (total height, mm) of a stairs-family piece.
 *
 * `Furniture.ht` is an item-level per-piece override so a flight can bridge a
 * short level change (a +50 patio step, a −950 sunken yard, an 800 mm entrance
 * slab) instead of being stuck at its kind's storey-sized default. Only the
 * stairs family honours it — every other kind reads its `FurnitureKindDef.ht`
 * exactly as before, so this is a no-op for the rest of the catalogue.
 *
 * An absent / non-finite / below-STAIRS_MIN_RISE_MM value falls back to the
 * kind default, which is what makes untouched flights byte-identical.
 */
export function stairsRiseMm(fu: { kind?: FurnitureKind; ht?: number }, defHt: number): number {
  if (!isStairsKind(fu?.kind)) return defHt;
  const v = fu?.ht;
  if (typeof v !== 'number' || !isFinite(v) || v < STAIRS_MIN_RISE_MM) return defHt;
  return v;
}

/**
 * How many treads a flight of run `depthMm` and rise `riseMm` gets.
 *
 * THE ONE RULE — consumed by the 3D builder (`case 'stairs'`), the nav/rig
 * ground truth (`_groundYAt`'s tread quantization) and the 2D plan glyph, so
 * what you walk on can never disagree with what you see.
 *
 *   min( max(3, round(depth / 280)),  max(1, floor(rise / 130)) )
 *
 * The depth term IS the historical formula. The rise cap only bites when the
 * rise is short (≤ ~390 mm for a normal run), so every default flight keeps its
 * exact tread count: stairs 3600/2743 → 13, stairs_half 1800/1372 → 6.
 */
export function stairsTreadCount(depthMm: number, riseMm: number): number {
  const d = (typeof depthMm === 'number' && isFinite(depthMm)) ? depthMm : 0;
  const r = (typeof riseMm === 'number' && isFinite(riseMm)) ? Math.abs(riseMm) : 0;
  const byDepth = Math.max(3, Math.round(d / STAIRS_TREAD_DEPTH_MM));
  const byRise = Math.max(1, Math.floor(r / STAIRS_MIN_RISER_MM));
  return Math.min(byDepth, byRise);
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
    case 'glass_break': return '#7e6bf5';  // cool blue-violet (acoustic)
    default: return '#ef5350';      // smoke red
  }
}
export function safetyGlyph(kind: SafetyKind): string {
  switch (kind) {
    case 'co': return 'CO';
    case 'gas': return 'GAS';
    case 'leak': return '💧';
    case 'siren': return '📢';
    case 'glass_break': return 'GB';
    default: return '';
  }
}
// leak sits on the floor; smoke/co/gas/siren/glass_break mount at ceiling height.
export function safetyIsFloor(kind: SafetyKind): boolean { return kind === 'leak'; }
// glass-break is a SQUARE mic plate (not a round beacon puck) — shared 2D + 3D
// so the two views can never disagree about the silhouette.
export function safetyIsPlate(kind: SafetyKind): boolean { return kind === 'glass_break'; }

// ── Leak puddle growth (shared 2D + 3D) ────────────────────────────────────
// `ageS` = seconds since the leak alarm STARTED. Growth is deliberately
// EASE-OUT (sqrt), not linear: a linear 30 s ramp spends its first seconds
// invisibly small, which read as "the puddle never spreads". The curve also
// starts at a visible floor (LEAK_PUDDLE_MIN of the max radius) so the wet
// patch appears immediately and then visibly creeps outward to the full radius
// at SAFETY_DEFAULTS.leakGrowSec.
export const LEAK_PUDDLE_MIN = 0.18;
export function leakPuddleGrow(ageS: number): number {
  const t = Math.max(0, Math.min(1, (isFinite(ageS) ? ageS : 0) / SAFETY_DEFAULTS.leakGrowSec));
  return Math.sqrt(t);
}
export function leakPuddleRadiusMm(ageS: number): number {
  const g = leakPuddleGrow(ageS);
  return SAFETY_DEFAULTS.leakMaxRadiusMm * (LEAK_PUDDLE_MIN + (1 - LEAK_PUDDLE_MIN) * g);
}
// siren is a controllable alert beacon (togglable), distinct from the passive
// detectors — clicking it toggles the bound entity / flips localState.
export function safetyIsSiren(kind: SafetyKind): boolean { return kind === 'siren'; }

// ── Siren capabilities (research/sirens-beacons.md §2.1) ───────────────────
// HA's `SirenEntityFeature` IntFlag, exact values from siren/const.py. Read off
// the standard `supported_features` attribute — it rides every get_states
// snapshot + state_changed event, so no extra plumbing.
export const SIREN_FEATURE = { TURN_ON: 1, TURN_OFF: 2, TONES: 4, VOLUME_SET: 8, DURATION: 16 } as const;
// Does this RESOLVED state envelope advertise a feature? Defensive: a missing /
// non-numeric supported_features reads as "no optional features" (turn_on and
// turn_off are always attempted — every real siren supports at least one, and a
// rejected call is fire-and-forget anyway).
export function sirenSupports(
  st: { attributes?: Record<string, unknown> } | null | undefined,
  flag: number,
): boolean {
  const f = st?.attributes?.supported_features;
  const n = typeof f === 'number' ? f : parseFloat(String(f ?? ''));
  return isFinite(n) && (n & flag) !== 0;
}
// `available_tones` is a CAPABILITY attribute, either a list[int|str] or a
// dict[int, str] (id → human name); either the key or the value is a valid
// `tone` service param. Normalized to {value,label} rows for the sidebar select.
// Anything unparseable → [] (never throws — the mqtt-ws/evStatusOf discipline).
export function sirenTones(
  st: { attributes?: Record<string, unknown> } | null | undefined,
): { value: string; label: string }[] {
  const raw = st?.attributes?.available_tones;
  if (Array.isArray(raw)) {
    const out: { value: string; label: string }[] = [];
    for (const t of raw) {
      if (t == null || typeof t === 'object') continue;
      const v = String(t);
      if (v !== '') out.push({ value: v, label: v });
    }
    return out;
  }
  if (raw && typeof raw === 'object') {
    const out: { value: string; label: string }[] = [];
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (v == null || typeof v === 'object') continue;
      out.push({ value: k, label: String(v) });
    }
    return out;
  }
  return [];
}
// Service data for `siren.turn_on`, gated per-param by the feature flag (§2.2).
// A param the entity doesn't advertise is NEVER sent (some firmware rejects an
// unsupported key outright — tuya-local #2980). entity_id is added by the caller.
export function sirenTurnOnData(
  s: { tone?: string | number | null; volume?: number | null; duration?: number | null },
  st: { attributes?: Record<string, unknown> } | null | undefined,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (s.tone != null && s.tone !== '' && sirenSupports(st, SIREN_FEATURE.TONES)) data.tone = s.tone;
  if (s.volume != null && isFinite(s.volume) && sirenSupports(st, SIREN_FEATURE.VOLUME_SET))
    data.volume_level = Math.max(0, Math.min(1, s.volume));
  if (s.duration != null && isFinite(s.duration) && s.duration > 0 && sirenSupports(st, SIREN_FEATURE.DURATION))
    data.duration = Math.max(1, Math.round(s.duration));
  return data;
}

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

// Plan heading (radians, atan2(dy, dx)) a robot takes while PARKED in its dock.
// `RobotFixture.rotation` is the repo-standard screen-CW degrees where 0 = the
// piece's local +Y faces world +Y, and the dock's functional FRONT (the opening
// the robot drives out of) is local −Y — exactly the furniture convention, so
// `frontVectorPlan(rotation)` is the outward direction. A parked robot points
// the other way, INTO the dock: world direction of dock-local +Y = (sinθ, cosθ),
// hence heading = atan2(cosθ, sinθ). Checks: 0 → +π/2 (+Y), 90 → 0 (+X),
// 180 → −π/2 (−Y), 270 → π (−X).
export function dockParkedHeading(rotationDeg?: number): number {
  const t = (rotationDeg ?? 0) * Math.PI / 180;
  return Math.atan2(Math.cos(t), Math.sin(t));
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

// Does the segment (x0,y0)→(x1,y1) cross any wall run a DRIVING ROBOT cannot
// pass? Invisible walls (planning boundaries) are passable; fences, hedges and
// railings are NOT (they are ordinary solid runs here, exactly as the avatar
// nav rasterizer treats them — a fenced yard therefore contains the mower and a
// GATE, being a door, is the one way through).
//
// Run source = `wallCutsForSegment(...).navSolids` — the DOOR-only complement.
// A WINDOW is a hole in the visual `solids` but SOLID here: a ~900 mm sill is
// not something a vacuum or a mower drives through, and sharing `solids` used to
// let a simulated vacuum plot straight lines out of a window (the avatar-nav
// twin of this bug was fixed in _buildNav first; this is the robot half). With
// no windows on a segment `navSolids` is `solids` by value, so a window-free
// plan is byte-identical.
//
// Pure — shared by the robot controller (Planner._segCrossesWall) and its test
// page. There is no visual-semantics consumer; if one ever appears it must ask
// for `solids` explicitly rather than flipping this back.
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
      const { navSolids } = wallCutsForSegment(a, b, doors, windows);
      for (const s of navSolids) {
        const sa = { x: a.x + ux * s.t0, y: a.y + uy * s.t0 };
        const sb = { x: a.x + ux * s.t1, y: a.y + uy * s.t1 };
        if (segmentsIntersect(p1, p2, sa, sb)) return true;
      }
    }
  }
  return false;
}

// Coarse outdoor sweep waypoints for a simulated mower: grid cells inside the
// floor rect (0..w × 0..d) but OUTSIDE every BUILDING loop, ordered
// boustrophedon (alternate rows reversed). Empty → the caller orbits an ellipse
// ring. Pure — shared by Planner._mowerWaypoints and its test page.
// `rowCell` (defaults to `cell`, so every legacy caller is byte-identical) is the
// ROW pitch — the perpendicular spacing between consecutive sweep lanes. It must
// be ≥ 2·MOWER_KINEMATICS.turnRadiusMm for a car-like mower to complete the
// row-end U-turn as ONE continuous arc; the Planner passes MOWER_ROW_MM.
export function mowerSweepWaypoints(
  walls: { points: Vec2[]; kind?: WallKind }[],
  w: number, d: number, cell = 800, margin = 300, rowCell = cell,
): Vec2[] {
  // BUILDING loops, not every closed loop: a fenced/hedged yard is a closed loop
  // too, and excluding it would leave a fenced property with zero mowable cells
  // (the ellipse fallback) instead of the lawn it actually is. Same rule the
  // Planner's per-step containment guard uses.
  const loops = buildingWallLoops(walls);
  const wps: Vec2[] = [];
  let row = 0;
  for (let gy = margin; gy <= d - margin; gy += rowCell, row++) {
    const cells: Vec2[] = [];
    for (let gx = margin; gx <= w - margin; gx += cell) {
      if (!pointInAnyLoop(loops, gx, gy)) cells.push({ x: gx, y: gy });
    }
    if (row % 2) cells.reverse();
    for (const c of cells) wps.push(c);
  }
  return wps;
}

// ── Robot mower kinematics (car-like bicycle model) ─────────────────────────
// A robot MOWER is a wheeled vehicle, not a hovering puck: it can only travel
// along its own heading and turn at a bounded rate. The vacuum keeps the old
// point-chasing controller (a round puck genuinely does pivot in place) — this
// model is the mower branch ONLY.
//
// State: (x, y, heading θ, speed v). Per step:
//   • bearing error  e = wrap(atan2(ty−y, tx−x) − θ)
//   • target speed   v* = max(minSpeed, maxSpeed·max(0,cos e)) — slow into a
//     turn, floor so it never stalls mid-arc — additionally capped by an
//     arrival ramp so it eases onto the dock instead of overshooting.
//   • v  ← v accel-limited toward v*
//   • ω  = clamp(steerGain·e, ±v/turnRadiusMm)  — the turn-RATE bound is what
//     makes the minimum turning circle exactly `turnRadiusMm` at any speed.
//   • θ ← θ + ω·dt, then  (x,y) += v·dt·(cos θ, sin θ)   ← STRICTLY along θ.
// The position update never uses the target direction, so lateral (strafing)
// displacement is identically zero — the property the tests pin.
export const MOWER_KINEMATICS = {
  maxSpeedMm: ROBOT_DEFAULTS.mower.speed,   // mm/s cruising (0.42 m/s)
  minSpeedMm: 100,      // mm/s floor — 0.10 m/s, never stalls mid-turn
  accelMm: 700,         // mm/s² speed ramp (both directions)
  turnRadiusMm: 500,    // tightest turning circle radius
  steerGain: 2.4,       // rad/s of yaw rate per rad of bearing error
  arriveMm: 420,        // waypoint capture radius
  brakeMm: 900,         // start easing speed down inside this range of a STOP goal
};
// ── Mower outdoor containment ────────────────────────────────────────────────
// A mower is an OUTDOOR machine: nothing may drive it through the house. The
// sweep waypoints were already generated outdoors, but the PATH between them —
// and above all the GPS carrot chase, which follows a fix that can land anywhere
// GPS error puts it — was unconstrained. `Planner._mowerAdvance` guards every
// step against (a) the new position landing inside a building loop and (b) the
// step segment crossing a nav-solid wall run, and on a violation re-steers along
// the smallest OPEN deflection from the current heading instead of teleporting.
//   lookaheadMm — forward clearance probe. A violation is predicted this far
//     ahead so the mower begins its arc while it still has room: ≈ the turning
//     radius plus a body length, so a 90° escape arc (which advances ~R) fits.
//   escapeFanDeg — candidate deflections, smallest first, left before right on a
//     tie. Deterministic (no Math.random in a per-frame path) and ordered so the
//     mower grazes ALONG a wall rather than veering off it.
//   clampMarginMm — how far outside a loop boundary an indoor GPS fix / indoor
//     dock is pulled (nearestPointOutsideLoops).
export const MOWER_CONTAINMENT = {
  lookaheadMm: 800,
  escapeFanDeg: [0, 15, -15, 30, -30, 45, -45, 60, -60, 80, -80, 100, -100,
                 120, -120, 145, -145, 180],
  clampMarginMm: 400,
  // How close a door's SPAN CENTRE must sit to a building loop's boundary to
  // count as that loop's entry (Planner.mowerDockIndoors' reachability
  // heuristic). Openings snap onto the wall axis, so the residual is only the
  // snap tolerance plus half a wall thickness.
  dockDoorReachMm: 200,
  // Stand-off distance for the doorway routing waypoint (Planner's
  // _mowerDoorWaypoint): the mower steers at a point this far off the door's
  // span centre, on the side it is heading TO, before aiming at the real target.
  // 700 sits just inside `lookaheadMm` (800), so from the waypoint the final
  // approach through the opening is ONE clear probe-length leg — the greedy
  // deflection steerer never has to discover the door on its own (which it
  // provably cannot when the straight line meets the wall far from it).
  dockDoorWaypointMm: 700,
};

// Row pitch for the simulated boustrophedon sweep: ≥ 2·turnRadiusMm (1000 mm)
// so the row-end 180° reversal fits as one continuous arc instead of an instant
// heading flip. 1200 leaves headroom for the approach/exit tangents.
export const MOWER_ROW_MM = 1200;

// Wrap an angle into (−π, π].
export function wrapAngle(a: number): number {
  let x = (a + Math.PI) % (2 * Math.PI);
  if (x <= 0) x += 2 * Math.PI;
  return x - Math.PI;
}

export interface BicycleState { x: number; y: number; heading: number; speed: number }

// Advance one bicycle-model step toward (tx, ty). `stop` = the target is a
// parking spot (dock / hold): speed ramps to 0 on arrival instead of cruising
// through. Returns the post-step state MUTATED IN PLACE (zero alloc) plus the
// applied yaw rate so callers/tests can inspect it. Pure apart from the mutation.
export function stepBicycle(
  s: BicycleState, tx: number, ty: number, dt: number,
  opts?: { maxSpeed?: number; stop?: boolean; k?: typeof MOWER_KINEMATICS },
): { omega: number; dist: number; err: number } {
  const K = opts?.k ?? MOWER_KINEMATICS;
  const h = Math.max(0, Math.min(0.2, dt));            // clamp a tab-resume gap
  const dx = tx - s.x, dy = ty - s.y;
  const dist = Math.hypot(dx, dy);
  const err = dist > 1 ? wrapAngle(Math.atan2(dy, dx) - s.heading) : 0;
  const maxV = Math.max(0, opts?.maxSpeed ?? K.maxSpeedMm);
  // Speed shaping: full when aligned, floored while turning; a STOP goal also
  // brakes linearly inside `brakeMm` and commands 0 at the capture radius.
  let want = Math.max(Math.min(K.minSpeedMm, maxV), maxV * Math.max(0, Math.cos(err)));
  if (opts?.stop) {
    if (dist <= K.arriveMm) want = 0;
    else want = Math.min(want, maxV * Math.min(1, dist / K.brakeMm));
  }
  const dv = want - s.speed, lim = K.accelMm * h;
  s.speed += Math.max(-lim, Math.min(lim, dv));
  if (s.speed < 0) s.speed = 0;
  // Steering: bounded yaw rate ⇒ turning radius ≥ turnRadiusMm at any speed.
  const wMax = s.speed / K.turnRadiusMm;
  let omega = Math.max(-wMax, Math.min(wMax, K.steerGain * err));
  // A goal INSIDE the tightest turning circle can never be reached by steering
  // toward it (the arc orbits around it forever). Hold the wheel straight until
  // it falls outside, then turn in — exactly what a car does after overshooting
  // a driveway. Without this the mower endlessly circles a nearby waypoint.
  if (dist < 2 * K.turnRadiusMm && Math.abs(err) > 1.3) omega = 0;
  s.heading = wrapAngle(s.heading + omega * h);
  const step = s.speed * h;
  s.x += Math.cos(s.heading) * step;
  s.y += Math.sin(s.heading) * step;
  return { omega, dist, err };
}

// Should the mower advance past this sweep waypoint? Either it is inside the
// capture radius, or it has been PASSED (behind us and inside the turning
// circle, so steering back would just loop) — the latter keeps rows smooth
// instead of sprawling a circle at every clipped corner.
export function mowerWaypointReached(
  s: { x: number; y: number; heading: number }, tx: number, ty: number,
  k: typeof MOWER_KINEMATICS = MOWER_KINEMATICS,
): boolean {
  const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy);
  if (d <= k.arriveMm) return true;
  return d < 2 * k.turnRadiusMm &&
         Math.abs(wrapAngle(Math.atan2(dy, dx) - s.heading)) > Math.PI / 2;
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

// The smallest-magnitude shift that brings ONE of `values` onto a candidate
// within `tol` (else null). Generalizes `nearestAlign` from "snap this point" to
// "translate this shape" — a whole-wall move offers all of its vertices, a
// polygon body move offers its bbox centre, and the winner is the least
// disturbing of them. `mm` is the matched candidate coordinate (what the guide
// line is drawn through); `delta` is what the caller adds to every point. Pure.
export function bestAlignShift(
  values: number[], candidates: number[], tol: number,
): { mm: number; delta: number } | null {
  let best: { mm: number; delta: number } | null = null;
  let bd = tol;
  for (const v of values) {
    for (const c of candidates) {
      const d = Math.abs(c - v);
      if (d < bd) { bd = d; best = { mm: c, delta: c - v }; }
    }
  }
  return best;
}

// Drag kinds that get the smart alignment guides (universal cross-category
// pool). ONE shared set so the snapper (canvas-interact) and the painter
// (canvas-render) can never disagree about which drags show guides — they used
// to keep two hand-maintained copies, and the painter's was the smaller of the
// two (safety / alert / robot / camera / projector snapped with no visible
// line). Deliberately EXCLUDED: door / window drags (they wall-snap), the
// LD2450 zone editor (firmware-local coords), ruler ends (object-anchored),
// bg corner/resize, and the click-vs-drag control fixtures (alarm / calendar /
// thermostat / action) whose tiny "click" movement must never be nudged past
// their 30 mm open-the-modal threshold.
export const ALIGN_DRAG_KINDS: ReadonlySet<string> = new Set([
  // single-point fixture / furniture moves
  'sensor', 'motion', 'env', 'ble', 'safety', 'alert', 'robot', 'camera',
  'projector', 'fixture', 'furnMove', 'info',
  // structure + room anchors
  'wallv', 'wallMove', 'roomAnchor',
  // polygon vertices
  'groundVert', 'pzoneVert', 'voidVert', 'poolVert', 'pathVert',
  // whole-shape body moves (bbox centre)
  'groundMove', 'pzoneMove', 'poolMove', 'voidMove',
]);

// The subset of ALIGN_DRAG_KINDS that is editing a polygon / centerline. Only
// these pull OTHER shapes' vertices into the candidate pool — a fixture drag
// aligns to corners and centres, not to every terrace vertex on the floor.
export const ALIGN_POLY_DRAG_KINDS: ReadonlySet<string> = new Set([
  'groundVert', 'pzoneVert', 'voidVert', 'poolVert', 'pathVert',
  'groundMove', 'pzoneMove', 'poolMove', 'voidMove',
]);

// Alt+click IDENTIFY latch timings. Lives here (pure) rather than on the
// Planner because canvas-render must read them and imports Planner TYPE-only —
// a value import would drag the whole planner into the 2D-render bundle.
export const IDENTIFY_TTL_MS = 3000;
export const IDENTIFY_FADE_MS = 600;   // fade over the last stretch of the TTL

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
// Sidebar / toolbar grouping. The original single `furniture` bucket grew to
// 33 kinds (user: "the 'furniture' category has grown too inclusive"), so it is
// SPLIT into seating / tables / bedroom / storage / stairs / decor. `furniture`
// itself stays in the union as the LEGACY FALLBACK — `furnitureCat()` still
// defaults to it, so a user ObjectRecipe carrying no `cat` (or an older one
// carrying `cat:'furniture'`) keeps resolving. Every built-in def now sets its
// cat explicitly (pinned by toolbar-test).
// NB every consumer outside the pickers tests `=== 'appliance'` / `!== 'appliance'`
// (layer gating, the three-view appliance-state hash, ghost-floor gates), so the
// new cats fall through to the FURNITURE side automatically. Never write a
// positive `cat === 'furniture'` test — it would silently drop the new cats.
export type FurnitureCat =
  | 'furniture'   // legacy / custom-object fallback (furnitureCat's default)
  | 'seating' | 'tables' | 'bedroom' | 'storage' | 'stairs' | 'decor'
  | 'appliance' | 'bathroom' | 'outdoor' | 'theater' | 'vehicle';

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
  block:         { label: 'Block',         w: 600,  h: 600,  ht: 600,  back: 'none', color: 0x8d6e63, cat: 'decor', frontArrow: false },
  table:         { label: 'Table',         w: 1500, h: 900,  ht: 750,  back: 'none', color: 0x8d6e63, cat: 'tables', activity: 'eat_at_table' },
  chair:         { label: 'Chair',         w: 500,  h: 500,  ht: 900,  seat: 450, back: 'tall', color: 0x6d4c41, cat: 'seating' },
  rocking_chair: { label: 'Rocking chair', w: 600,  h: 800,  ht: 1000, seat: 450, back: 'tall', color: 0x5d4037, cat: 'seating' },
  // Chair styles for different rooms/uses. All plain seat-bearing kinds: the
  // seat↔table tuck (resolveSeatTableCollision), the table group-move
  // (seatBelongsToTable) and the renderer's SitSpot registration all gate on
  // `def.seat` being set, so these ride along with no membership list. None
  // carries its own `activity` — an eat/work activity is resolved from the
  // ADJACENT host table/desk exactly like a plain `chair` (counters/islands are
  // deliberately not hosts, so a bar_stool at an island perches without one).
  armchair:      { label: 'Armchair',      w: 900,  h: 850,  ht: 750,  seat: 420, back: 'low',  color: 0x96685c, cat: 'seating' },
  office_chair:  { label: 'Office chair',  w: 660,  h: 660,  ht: 1150, seat: 480, back: 'tall', color: 0x3a3d43, cat: 'seating' },
  bar_stool:     { label: 'Bar stool',     w: 420,  h: 420,  ht: 1000, seat: 750, back: 'none', color: 0x6d4c41, cat: 'seating' },
  wingback_chair:{ label: 'Wingback chair',w: 820,  h: 850,  ht: 1150, seat: 430, back: 'tall', color: 0x4a5d52, cat: 'seating' },
  folding_chair: { label: 'Folding chair', w: 470,  h: 500,  ht: 800,  seat: 440, back: 'tall', color: 0x8b9199, cat: 'seating' },
  gaming_chair:  { label: 'Gaming chair',  w: 700,  h: 700,  ht: 1300, seat: 470, back: 'tall', color: 0x26282e, cat: 'seating' },
  chaise:        { label: 'Chaise',        w: 1800, h: 750,  ht: 600,  seat: 400, back: 'low',  color: 0x795548, cat: 'seating' },
  bench:         { label: 'Bench',         w: 1500, h: 400,  ht: 450,  seat: 440, back: 'none', color: 0x6d4c41, cat: 'seating' },
  desk:          { label: 'Desk',          w: 1400, h: 700,  ht: 750,  back: 'none', color: 0x4e342e, cat: 'tables', surface: true, activity: 'work_at_desk' },
  sofa:          { label: 'Sofa',          w: 2000, h: 900,  ht: 850,  seat: 450, back: 'tall', color: 0x37474f, cat: 'seating' },
  sofa_l_left:   { label: 'Sofa · L (left)',  w: 2600, h: 1800, ht: 850, seat: 450, back: 'tall', color: 0x37474f, cat: 'seating' },
  sofa_l_right:  { label: 'Sofa · L (right)', w: 2600, h: 1800, ht: 850, seat: 450, back: 'tall', color: 0x37474f, cat: 'seating' },
  sofa_u:        { label: 'Sofa · U',         w: 3200, h: 2000, ht: 850, seat: 450, back: 'tall', color: 0x37474f, cat: 'seating' },
  // Beds. `bed` keeps its legacy id AND dims (existing plans must not move);
  // the three sized kinds carry real mattress footprints (width × length) and
  // differ visually by pillow count — see bedPillowLayout(). Everything
  // downstream (lie lanes floor(w/700), shared covers, the nav-occupiable
  // exemption) keys off dimensions or isBedKind(), never a literal.
  bed:           { label: 'Bed · queen',   w: 2000, h: 1500, ht: 500,  back: 'low',  color: 0x546e7a, cat: 'bedroom', activity: 'sleep_shared' },
  bed_twin:      { label: 'Bed · twin',    w: 990,  h: 1910, ht: 500,  back: 'low',  color: 0x546e7a, cat: 'bedroom', activity: 'sleep_shared' },
  bed_full:      { label: 'Bed · full',    w: 1370, h: 1910, ht: 500,  back: 'low',  color: 0x546e7a, cat: 'bedroom', activity: 'sleep_shared' },
  bed_king:      { label: 'Bed · king',    w: 1930, h: 2030, ht: 500,  back: 'low',  color: 0x546e7a, cat: 'bedroom', activity: 'sleep_shared' },
  rug:           { label: 'Rug',           w: 2000, h: 1400, ht: 5,    back: 'none', color: 0x5d4037, cat: 'decor', rug: true, frontArrow: false },
  bookshelf:     { label: 'Bookshelf',     w: 800,  h: 350,  ht: 1800, back: 'none', color: 0x3e2723, cat: 'storage', activity: 'browse_bookshelf' },
  // Stairs rise toward the piece's back (plan-top); rotate to aim. Full run
  // climbs a 9 ft storey; half run + landing + rotated half run composes an
  // L or U staircase.
  stairs:        { label: 'Stairs (full flight)', w: 1000, h: 3600, ht: 2743, back: 'none', color: 0x8d6e63, cat: 'stairs' },
  stairs_half:   { label: 'Stairs (half flight)', w: 1000, h: 1800, ht: 1372, back: 'none', color: 0x8d6e63, cat: 'stairs' },
  stair_landing: { label: 'Stair landing',        w: 1000, h: 1000, ht: 1372, back: 'none', color: 0x8d6e63, cat: 'stairs' },
  // Ramp: the no-tread member of the stairs family (STAIRS_KINDS), rising
  // toward local +Z exactly like a flight. Default 400 mm rise over 2400 mm of
  // run (~1:6) — a short accessible slope; use the per-piece Rise override /
  // "Fit between levels" to bridge any real level change.
  ramp:          { label: 'Ramp',                 w: 1000, h: 2400, ht: 400,  back: 'none', color: 0x8d6e63, cat: 'stairs' },
  coffee_table:  { label: 'Coffee table',  w: 1100, h: 600,  ht: 450,  back: 'none', color: 0x795548, cat: 'tables' },
  tv_stand:      { label: 'TV stand',      w: 1600, h: 450,  ht: 550,  back: 'none', color: 0x4e342e, cat: 'storage', surface: true },
  dresser:       { label: 'Dresser',       w: 1200, h: 500,  ht: 900,  back: 'none', color: 0x6d4c41, cat: 'bedroom', surface: true },
  nightstand:    { label: 'Nightstand',    w: 500,  h: 400,  ht: 600,  back: 'none', color: 0x6d4c41, cat: 'bedroom', surface: true },
  wardrobe:      { label: 'Wardrobe',      w: 1200, h: 600,  ht: 2000, back: 'none', color: 0x5d4037, cat: 'bedroom' },
  ottoman:       { label: 'Ottoman',       w: 700,  h: 700,  ht: 400,  seat: 380, back: 'none', color: 0x607d8b, cat: 'seating', frontArrow: false },
  stool:         { label: 'Stool',         w: 400,  h: 400,  ht: 650,  seat: 620, back: 'none', color: 0x6d4c41, cat: 'seating', frontArrow: false },
  plant:         { label: 'Plant',         w: 400,  h: 400,  ht: 1400, back: 'none', color: 0x33691e, cat: 'decor', frontArrow: false, activity: 'tend_plant' },
  counter:       { label: 'Counter',       w: 1800, h: 650,  ht: 900,  back: 'none', color: 0x8d6e63, cat: 'tables', surface: true },
  island:        { label: 'Island',        w: 2000, h: 1000, ht: 900,  back: 'none', color: 0x8d6e63, cat: 'tables', surface: true, frontArrow: false },
  cabinet:       { label: 'Cabinet',       w: 900,  h: 400,  ht: 2000, back: 'none', color: 0x5d4037, cat: 'storage' },
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
  exercise_equipment: { label: 'Exercise equipment', w: 700, h: 1600, ht: 1300, back: 'none', color: 0x424242, cat: 'decor', activity: 'exercise' },
  // Home theater — speakers/sub/center are a new `theater` cat (own optgroup).
  // Sizes are illustrative real-world defaults (ELAC DF52 tower, Klipsch R-12SW
  // sub); every field stays per-fixture editable like all other kinds. Speakers
  // bound to a media_player show the shipped now-playing card + a driver pulse
  // while playing. Bookshelf/center are `mountable` (land on a surface host).
  speaker_tower:     { label: 'Speaker (tower)',     w: 250, h: 350, ht: 1050, back: 'none', color: 0x1a1a1a, cat: 'theater' },
  speaker_bookshelf: { label: 'Speaker (bookshelf)', w: 200, h: 280, ht: 350,  back: 'none', color: 0x1c1c1c, cat: 'theater', mountable: true },
  subwoofer:         { label: 'Subwoofer',           w: 400, h: 450, ht: 450,  back: 'none', color: 0x111111, cat: 'theater' },
  center_channel:    { label: 'Center channel',      w: 450, h: 160, ht: 180,  back: 'none', color: 0x161616, cat: 'theater', mountable: true, frontArrow: false },
  // Recliners moved to the `theater` cat in the 2026-08 category split (they had
  // ridden the default `furniture` cat, grouped with sofas); the riser platform
  // joined `stairs` (it is a walkable deck, and Structure hosts that cat).
  // Recliner leaves `activity` undefined so `watch_tv` resolves from the room's
  // TV via the seated-context SitSpot path (never a standing anchor).
  theater_recliner:  { label: 'Theater recliner',    w: 950,  h: 1000, ht: 1050, seat: 450, back: 'tall', color: 0x2b2320, cat: 'theater' },
  recliner_row3:     { label: 'Recliner row (3)',    w: 2900, h: 1000, ht: 1050, seat: 450, back: 'tall', color: 0x2b2320, cat: 'theater' },
  // Walkable tiered-seating deck. Low (220 mm) flat platform — does NOT block
  // nav (see isRiserKind in three-renderer's _buildNav skip + _groundYAt); place
  // recliners on top with their `elevation` set to the riser height.
  riser_platform:    { label: 'Riser platform',      w: 3600, h: 1800, ht: 220,  back: 'none', color: 0x2a2622, cat: 'stairs', frontArrow: false },
  // Outdoor — wheeled curbside bins. Entity 'on'/'full' = FULL (lid propped, overflow
  // hint); unbound → localState click-toggle. Front (lid hinge, wheels at back = +Z).
  trash_bin:     { label: 'Trash bin',     w: 600,  h: 700,  ht: 1100, back: 'none', color: 0x3a3f45, cat: 'outdoor', frontArrow: false },
  recycle_bin:   { label: 'Recycling bin', w: 600,  h: 700,  ht: 1100, back: 'none', color: 0x1f6fb2, cat: 'outdoor', frontArrow: false },
  // Outdoor — yard objects (the "yard" arc). Symmetric pieces skip the front chevron.
  tree:          { label: 'Tree',          w: 900,  h: 900,  ht: 3000, back: 'none', color: 0x4c8c2b, cat: 'outdoor', frontArrow: false },
  pine_tree:     { label: 'Pine tree',     w: 800,  h: 800,  ht: 3200, back: 'none', color: 0x2f6d3a, cat: 'outdoor', frontArrow: false },
  // Additional species. Every tree kind is built PARAMETRICALLY from (w, h, HT)
  // where HT = treeHeightMm(piece, def.ht) — so the sidebar "Height (mm)" row
  // grows a bigger tree rather than stretching the default one.
  oak_tree:      { label: 'Oak tree',      w: 3000, h: 3000, ht: 5500, back: 'none', color: 0x4a7c2f, cat: 'outdoor', frontArrow: false },
  birch_tree:    { label: 'Birch tree',    w: 1800, h: 1800, ht: 5000, back: 'none', color: 0x7fbf4d, cat: 'outdoor', frontArrow: false },
  palm_tree:     { label: 'Palm tree',     w: 2200, h: 2200, ht: 5000, back: 'none', color: 0x4f9e3a, cat: 'outdoor', frontArrow: false },
  willow_tree:   { label: 'Willow tree',   w: 3200, h: 3200, ht: 4500, back: 'none', color: 0x6a9c47, cat: 'outdoor', frontArrow: false },
  spruce_tree:   { label: 'Spruce tree',   w: 2000, h: 2000, ht: 6000, back: 'none', color: 0x2c5f52, cat: 'outdoor', frontArrow: false },
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
  // Post-mounted curbside mail box — a traditional tunnel box (arched roof,
  // arched front door) proportioned like the real thing: ~2.4× longer than wide,
  // near-black (pure black would kill the toon bands). Front (door) = -Z.
  // mailCount.countEntity > 0 floats a count badge; flagEntity 'on' stands the
  // side flag UP (arm vertical) — otherwise it lies horizontal along the side.
  mailbox:       { label: 'Mailbox',       w: 220,  h: 520,  ht: 1150, back: 'none', color: 0x23272b, cat: 'outdoor' },
  // Vehicle / garage. Car binds a binary_sensor (presence): bound off = ghosted
  // "away", on = solid, unbound = always solid. ev_charger is a wall-post EVSE.
  car:           { label: 'Car',           w: 1850, h: 4800, ht: 1450, back: 'none', color: 0x37516b, cat: 'vehicle' },
  ev_charger:    { label: 'EV charger',     w: 350,  h: 250,  ht: 1200, back: 'none', color: 0x2f3237, cat: 'vehicle' },
  // Mechanical / utility plant. All cat 'appliance' so they ride the appliances
  // layer + the three-view appliance-state hash for free. Sizes follow common
  // residential spec sheets (50 gal tank ⌀560×1500, 3-ton condenser 900², a
  // 1500 mm baseboard run, an Ender-class printer 420²×480). Front (control
  // face / grille / print bed opening) = -Z. Symmetric pieces skip the chevron.
  water_heater:  { label: 'Water heater',  w: 560,  h: 560,  ht: 1500, back: 'none', color: 0xd6dade, cat: 'appliance', frontArrow: false },
  air_handler:   { label: 'Air handler',   w: 600,  h: 750,  ht: 1350, back: 'none', color: 0xb6bec4, cat: 'appliance' },
  floor_radiator:{ label: 'Floor radiator', w: 1500, h: 150,  ht: 250,  back: 'none', color: 0xd7dce0, cat: 'appliance', frontArrow: false },
  wall_radiator: { label: 'Wall radiator', w: 800,  h: 110,  ht: 600,  back: 'none', color: 0xe3e7ea, cat: 'appliance', frontArrow: false },
  boiler:        { label: 'Boiler',        w: 600,  h: 650,  ht: 900,  back: 'none', color: 0x9aa4ad, cat: 'appliance' },
  ac_condenser:  { label: 'AC condenser',  w: 900,  h: 900,  ht: 700,  back: 'none', color: 0xa8b0b6, cat: 'appliance', frontArrow: false },
  heat_pump:     { label: 'Heat pump',     w: 950,  h: 400,  ht: 800,  back: 'none', color: 0x9fa8ae, cat: 'appliance' },
  sump_pump:     { label: 'Sump pump',     w: 350,  h: 350,  ht: 450,  back: 'none', color: 0x546e7a, cat: 'appliance', frontArrow: false },
  recirc_pump:   { label: 'Recirc pump',   w: 300,  h: 180,  ht: 220,  back: 'none', color: 0x7a5c3a, cat: 'appliance', frontArrow: false },
  printer_3d:    { label: '3D printer',    w: 420,  h: 420,  ht: 480,  back: 'none', color: 0x37474f, cat: 'appliance', mountable: true },
  // Home network rack: a short floor cabinet (19" gear needs ~600 mm of width;
  // home racks run 400–600 mm deep and a few U tall — 1200 mm ≈ a 12U cabinet,
  // NOT a 42U datacentre tower). Front (vented door / drive bays) = -Z.
  network_rack:  { label: 'Network rack',  w: 600,  h: 500,  ht: 1200, back: 'none', color: 0x2b3238, cat: 'appliance' },
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
// Ink for GROUND WRITING (BgTextEntry mode 'grass'). BOTH placements — the
// user-chosen GroundArea and the automatic yard margin strip — paint the
// lettering onto a fully TRANSPARENT canvas so whatever surface lies under the
// decal (the area's patch, the yardFill, the bare lawn) IS the backdrop. The
// writing never brings a background of its own, so the ink is the only thing
// carrying contrast and has to read against each surface unaided. `fill` is the
// cut/engraved letter body, `stroke` the relief edge painted behind it (offset
// down-right) — the pair is a two-tone relief, so on every kind at least one of
// the two contrasts strongly with the material beneath. The mowed-lawn pair is
// the shipped grass one, kept bit-identical.
export const GROUND_TEXT_INK: Record<GroundKind, { fill: string; stroke: string }> = {
  grass:    { fill: '#31521d', stroke: '#7bab52' },   // dark cut / light mow relief
  rock:     { fill: '#3c4249', stroke: '#c3c9cf' },   // slate etch / pale chip
  concrete: { fill: '#4a4a4f', stroke: '#e6e6ea' },   // charcoal etch / light grey
  // Blacktop is the ONE kind whose relief is inverted: a near-black letter body
  // on a near-black surface (#2e3236) has no backdrop left to separate it now
  // that the box is gone, so blacktop reads as CHALK — a pale letter body over a
  // darker relief edge. Every other kind keeps dark-cut / light-relief.
  blacktop: { fill: '#d3d8dd', stroke: '#0e1113' },   // chalk body / near-black relief
  mulch:    { fill: '#33200f', stroke: '#b58a58' },   // dark bark / tan
  sand:     { fill: '#8a6f3c', stroke: '#f4e8c6' },   // wet-sand groove / dry crest
  water:    { fill: '#0f3459', stroke: '#a8e2ff' },   // deep blue / pale cyan
};
export function groundTextInk(k: GroundKind): { fill: string; stroke: string } {
  return GROUND_TEXT_INK[k] ?? GROUND_TEXT_INK.grass;
}
// Dirty-key term for GROUND WRITING ink. The decal has no backdrop, so its ink
// is resolved from whatever is painted under it (containing GroundArea kind →
// yardFill → grass) — which means a yard-paint edit must repaint the writing,
// while three-view's _keyBgText deliberately carries NO configRev (unrelated
// config churn must never rebuild the bg-text rigs and snap the plane/train back
// to their build angle). This is that middle ground: a COARSE hash of exactly
// the inputs the ink resolution consumes — each area's kind + its bbox rounded
// to 100 mm, plus the floor's yardFill kind. Moving an area within 100 mm or
// editing anything else on the floor leaves it untouched. Pure + total.
export function bgGroundInkKey(
  floor: { yardFill?: GroundKind; groundAreas?: { kind: GroundKind; points?: Vec2[] }[] },
): string {
  const parts: string[] = [];
  for (const a of floor.groundAreas ?? []) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of a.points ?? []) {
      if (p.x < x0) x0 = p.x;
      if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y;
      if (p.y > y1) y1 = p.y;
    }
    const r = (v: number) => (isFinite(v) ? Math.round(v / 100) : 'n');
    parts.push(`${a.kind}@${r(x0)},${r(y0)},${r(x1)},${r(y1)}`);
  }
  return `${floor.yardFill ?? '-'};${parts.join(',')}`;
}
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

// Terraced-ground skirt base: the elevation the skirt of `area` should reach —
// the surface the tier is BUILT ON (raised) or CUT INTO (sunken). A small tier
// nested on a larger, lower tier must stop at that tier's elevation (not always
// grade 0), else it cuts a visible cliff through the tier beneath. Resolved once
// per area at build time (never per frame) by testing `area`'s representative
// interior point against every OTHER area's polygon. Pure/O(areas²) over a small
// per-floor array — the same idiom closedWallLoops / mowerSweepWaypoints use.
//
// The reference tier is picked by ENCLOSURE, not by elevation: the containing
// area with the SMALLEST polygon area among those strictly LARGER than this one
// — the immediate enclosing tier. Its elevation is the base, whatever its sign;
// no enclosing tier → 0 (grade). This reads correctly in BOTH directions:
//   • Raised on raised: concentric tiers all share a centroid, so every inner
//     tier "contains" the outer one's rep point — the larger-area requirement is
//     what stops an outer tier's skirt from climbing to the innermost tier.
//   • Raised in sunken (the reported case): a patio pedestal drawn inside a
//     sunken lawn drops its skirt to that lawn instead of stopping at grade and
//     floating a metre over its own yard, where it read as a thicker slab.
//   • Sunken in sunken / sunken in raised: a pit inside a pit stops at the outer
//     pit's floor; a pit cut into a patio rises to the patio, not to grade.
// Equal-area overlaps enclose nothing (strict >) and fall through to 0.
export function groundAreaSkirtBase(area: GroundArea, all: GroundArea[]): number {
  const rep = polygonCentroid(area.points);
  const own = Math.abs(polygonArea(area.points));
  let base = 0, bestArea = Infinity;
  for (const other of all) {
    if (other.id === area.id || other.hidden || (other.points?.length ?? 0) < 3) continue;
    const oa = Math.abs(polygonArea(other.points));
    if (oa <= own || oa >= bestArea) continue;             // not the immediate encloser
    if (!pointInPolygon(rep.x, rep.y, other.points)) continue;
    base = other.elevationMm ?? 0; bestArea = oa;
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
    case 'wall_radiator': return 200;   // hydronic panel sits just off the floor
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

// ── Mechanical / utility appliances (this batch) ───────────────────────────
// Water heater, air handler, radiators, boiler, outdoor condenser / heat pump,
// sump + recirculating pumps, 3D printer. All cat 'appliance' — they ride the
// appliances layer + the three-view appliance-state hash with no predicate
// change. This helper is the gate for: the mechanical GLOW (2D halo + 3D
// emissive), the generic green in-use LED EXCLUSION (glow is their state
// language), the 'media' click tag (unbound pieces flip localState), and the
// sidebar bind row / per-kind picker domains.
export function isMechanicalApplianceKind(kind: FurnitureKind | undefined): boolean {
  return kind === 'water_heater' || kind === 'air_handler' ||
         kind === 'floor_radiator' || kind === 'wall_radiator' || kind === 'boiler' ||
         kind === 'ac_condenser' || kind === 'heat_pump' ||
         kind === 'sump_pump' || kind === 'recirc_pump' || kind === 'printer_3d';
}
// The two pumps — their "running" cue is WATER MOVING through the pipe run
// (a scrolling flow texture), not an emissive glow.
export function isPumpKind(kind: FurnitureKind | undefined): boolean {
  return kind === 'sump_pump' || kind === 'recirc_pump';
}
// Per-kind entity-picker domains. Deliberately DOMAIN-FLEXIBLE (the pool /
// EV-charger precedent): design around the common shape, never one vendor's
// entity ids. Unknown kind → the generic switch list.
export function mechanicalBindDomains(kind: FurnitureKind | undefined): string[] {
  switch (kind) {
    case 'water_heater':   return ['water_heater', 'climate', 'switch', 'binary_sensor'];
    case 'air_handler':
    case 'heat_pump':      return ['climate', 'fan', 'switch'];
    case 'ac_condenser':
    case 'floor_radiator':
    case 'wall_radiator':
    case 'boiler':         return ['climate', 'switch', 'binary_sensor'];
    case 'sump_pump':
    case 'recirc_pump':    return ['switch', 'binary_sensor'];
    case 'printer_3d':     return ['switch', 'binary_sensor', 'sensor'];
    default:               return ['switch', 'binary_sensor'];
  }
}
// Glow color language, shared 2D + 3D. 'none' = no glow (pumps show flow, an
// idle unit stays dark). heat/cool/fan reuse the HVAC vent palette so the whole
// climate story reads with one color vocabulary.
export type MechanicalGlow = 'heat' | 'cool' | 'fan' | 'none';
export const MECH_GLOW_COLORS: Record<'heat' | 'cool' | 'fan', string> = {
  heat: HVAC_VENT_COLORS.heat, cool: HVAC_VENT_COLORS.cool, fan: '#f2f5f7',
};
export function mechanicalGlowColor(g: MechanicalGlow): string | null {
  return g === 'none' ? null : MECH_GLOW_COLORS[g];
}
// States that mean "not running" across every domain we accept (climate mode,
// water_heater operation mode, switch/binary_sensor, unbound localState).
const MECH_OFF_STATES = new Set(['', 'off', 'unavailable', 'unknown', 'none',
                                 'idle', 'standby', 'closed', 'false', 'paused']);
// Print progress 0..100 from a RESOLVED state envelope. The state itself wins
// when it is a bare number; otherwise the common progress-shaped attributes are
// tried in order. Anything unparseable → null (never throws, never guesses a
// vendor's key set — the evStatusOf discipline).
export function printerProgress(
  st: { state?: string; attributes?: Record<string, unknown> } | null | undefined,
): number | null {
  const clamp = (n: number): number | null =>
    isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
  const raw = String(st?.state ?? '').trim();   // String(): a non-string state must never throw
  if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(raw)) return clamp(parseFloat(raw));
  const a = st?.attributes;
  if (a) {
    for (const key of ['progress', 'print_progress', 'completion', 'percentage', 'percent_complete']) {
      const v = a[key];
      const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
      if (isFinite(n)) return clamp(n);
    }
  }
  return null;
}
export interface MechanicalRun {
  running: boolean;         // the unit is doing work right now
  glow: MechanicalGlow;     // emissive/halo color language ('none' = dark / pumps)
  progress: number | null;  // printer_3d only: 0..100, else null
}
// Resolve running + glow (+ print progress) for a mechanical appliance from its
// RESOLVED state envelope (Planner.effectiveState / the renderer's itemState —
// localState already folded). Pure + defensive: every branch tolerates a missing
// state, a missing attribute bag, and a vendor-specific state string.
//
// Climate-bound units resolve airflow through the shared `hvacAirflow` (action
// wins over mode, exactly like the thermostat vent), so a unit sitting in mode
// `heat` with action `idle` reads as NOT running — an honest dark radiator.
// Units with no action reported and a non-off state run at their kind's natural
// color (a water heater in `eco` heats; an air handler in `auto` is "some other
// mode" → white).
export function mechanicalRun(
  st: { state?: string; attributes?: Record<string, unknown> } | null | undefined,
  kind: FurnitureKind | undefined,
): MechanicalRun {
  const s = String(st?.state ?? '').trim().toLowerCase();   // String(): never throw on a non-string state
  if (kind === 'printer_3d') {
    const progress = printerProgress(st);
    const running = progress != null
      ? progress > 0 && progress < 100
      : (s === 'printing' || s === 'on' || s === 'busy' || s === 'running' || s === 'playing');
    return { running, glow: 'none', progress };
  }
  if (isPumpKind(kind)) {
    const running = s === 'on' || s === 'open' || s === 'opening' ||
                    s === 'running' || s === 'playing' || s === 'true';
    return { running, glow: 'none', progress: null };
  }
  // Natural color for a running unit whose mode carries no airflow hint.
  const natural: MechanicalGlow =
    kind === 'ac_condenser' ? 'cool'
    : kind === 'air_handler' || kind === 'heat_pump' ? 'fan'
    : 'heat';   // water_heater / radiators / boiler
  if (!s || MECH_OFF_STATES.has(s)) return { running: false, glow: 'none', progress: null };
  const action = st?.attributes?.hvac_action as string | undefined;
  const air = hvacAirflow(s, action);
  if (air) {
    // Single-purpose plant can only do its one job: a condenser never heats,
    // a radiator/boiler/water heater never cools.
    const glow: MechanicalGlow =
      kind === 'ac_condenser' ? 'cool'
      : (kind === 'floor_radiator' || kind === 'wall_radiator' ||
         kind === 'boiler' || kind === 'water_heater') ? 'heat'
      : air;
    return { running: true, glow, progress: null };
  }
  // An explicit action that maps to no airflow (idle / drying / defrosting) is
  // the physical truth — the unit is NOT moving heat.
  if (action) return { running: false, glow: 'none', progress: null };
  return { running: true, glow: natural, progress: null };
}

// ── Network / server rack (research/peripheral-fixtures.md §2.3) ───────────
// A deliberately MODEST fixture: a dark cabinet + ONE aggregate health LED. The
// underlying data (CPU %, disk counters, bandwidth) is dashboard material, not
// spatial — §2.3.1 notes almost all of it is diagnostic + disabled-by-default.
export function isRackKind(kind: FurnitureKind | undefined): boolean {
  return kind === 'network_rack';
}
export type RackHealth = 'ok' | 'update' | 'problem' | 'unknown';
export const RACK_HEALTH_COLORS: Record<RackHealth, string> = {
  ok: '#4caf50', update: '#ffb300', problem: '#e53935', unknown: '#5c6a72',
};
export function rackHealthColor(h: RackHealth): string { return RACK_HEALTH_COLORS[h] ?? RACK_HEALTH_COLORS.unknown; }
// States that mean "nothing is wrong" for a bound problem entity. Anything
// present-but-not-here (a text status like 'degraded'/'failed'/'attention', or a
// binary_sensor 'on') reads as a PROBLEM; an absent/unknown reading reads as
// UNKNOWN, never as a problem (the heat-map rule: unknown ≠ bad).
const RACK_GOOD_STATES = new Set(['off', 'false', 'ok', 'normal', 'good', 'healthy',
                                  'online', 'connected', 'up', 'idle', 'clear', 'safe']);
const RACK_UNKNOWN_STATES = new Set(['', 'unknown', 'unavailable', 'none', 'null']);
// Aggregate health from the bound entity list, precedence problem > update > ok
// > unknown (§2.3.4). An `update.*` entity in 'on' means "firmware update
// available" = amber, NOT a fault — every other domain's 'on' is a fault.
export function rackHealth(entries: { id: string; state: string | null | undefined }[]): RackHealth {
  let sawOk = false, sawUpdate = false;
  for (const e of entries ?? []) {
    const id = String(e?.id ?? '');
    if (!id) continue;
    const s = String(e?.state ?? '').trim().toLowerCase();
    if (RACK_UNKNOWN_STATES.has(s)) continue;                 // no reading → no opinion
    if (id.startsWith('update.')) {
      if (s === 'on' || s === 'true') sawUpdate = true; else sawOk = true;
      continue;
    }
    if (RACK_GOOD_STATES.has(s)) { sawOk = true; continue; }
    return 'problem';
  }
  if (sawUpdate) return 'update';
  return sawOk ? 'ok' : 'unknown';
}

// ── UV parasol (research/moon-uv-vehicle.md §UV flourish) ──────────────────
// The chip readout is the core UV feature; the parasol is the flourish. It is a
// PASSIVE weather garment on the avatar-prop system (the umbrella precedent —
// class 3, all rigs incl. radar/BLE), wanted while the sun is genuinely harsh:
// UV ≥ 8 ("very high" on the WHO band, where shade is the standard advice) AND
// a clear DAY condition. HA's day-clear condition is 'sunny' ('clear-night' is
// its night twin, and rain always wins — the caller checks the umbrella first).
export const UV_PARASOL_MIN = 8;
const UV_SUN_CONDITIONS = new Set(['sunny']);
export function uvParasolWanted(
  uvIndex: number | null | undefined,
  condition: string | null | undefined,
): boolean {
  if (typeof uvIndex !== 'number' || !isFinite(uvIndex) || uvIndex < UV_PARASOL_MIN) return false;
  return !!condition && UV_SUN_CONDITIONS.has(condition);
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
// Every "wet" bathroom piece that carries a WATER ANIMATION driven by its run
// state: the five sink kinds + the bathtub (fill/drain), the shower (falling
// spray) and the toilet (flush one-shot). This is the single predicate behind
//   • the three-view appliance-state hash (so a bound/local flip rebuilds),
//   • the 'media' raycast click tag + the switch/binary_sensor dblclick binder,
//   • the 2D click-to-run paths and water hints,
// so those four surfaces can never drift apart. `isSinkKind` stays the narrower
// basin-only test (fill plane + faucet stream geometry).
export function isWetBathKind(kind: FurnitureKind | undefined): boolean {
  return isSinkKind(kind) || kind === 'bathtub' || kind === 'shower' || kind === 'toilet';
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

// ── Beds ─────────────────────────────────────────────────────────────────────
// THE canonical bed-family membership test (the isStairsKind precedent — never
// scatter literal `kind === 'bed'` lists). Membership grants the whole bed
// contract: the occupiable nav-footprint exemption, the `_beds` registry that
// drives lie lanes (capacity floor(w / 700)) + the two-in-bed shared-covers
// effect, the soft-lounge pet curl, and the sized 3D/2D pillow row.
export const BED_KINDS = new Set<FurnitureKind>(['bed', 'bed_twin', 'bed_full', 'bed_king']);
export function isBedKind(kind?: FurnitureKind): kind is FurnitureKind {
  return kind != null && BED_KINDS.has(kind);
}
// Pillows across the head end, per kind. Unknown/absent → 2 (the legacy build).
export const BED_PILLOWS: Partial<Record<FurnitureKind, number>> = {
  bed_twin: 1, bed_full: 2, bed: 2, bed_king: 3,
};
export function bedPillowCount(kind?: FurnitureKind): number {
  return (kind && BED_PILLOWS[kind]) ?? 2;
}
// Pillow row geometry, shared by the 3D builder and the 2D glyph so the two can
// never disagree. `pitch` is the centre-to-centre spacing; the row is centred on
// the bed, so pillow i sits at x = (i − (n−1)/2)·pitch. The 2-pillow case
// reproduces today's queen build EXACTLY (pitch 0.44·W ⇒ centres ±0.22·W,
// pw 0.42·W); a single pillow occupies a narrower 0.60·W span so a twin gets a
// realistic standard pillow rather than a bolster.
export function bedPillowLayout(kind: FurnitureKind | undefined, widthMm: number):
    { count: number; pitch: number; pw: number } {
  const count = bedPillowCount(kind);
  const pitch = widthMm * (count === 1 ? 0.60 : 0.88) / count;
  // 21/22 is the EXACT legacy ratio: at count 2 the pitch is 0.44·W, so this
  // yields pw = 0.42·W bit-for-bit (a rounded 0.9545 would not).
  return { count, pitch, pw: pitch * 21 / 22 };
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
  // A vehicle-pack model resolves into the SAME ObjectRecipe shape (memoized in
  // vehicles.ts). Null = the pack is unloaded / deactivated / the member is
  // excluded → fall through to the plain-kind fallback (the avatar precedent).
  if (f.vehicleModelId) {
    const veh = vehicleRecipe(f.vehicleModelId);
    if (veh) return veh;
  }
  if (f.customKindId) {
    const rec = customObjects?.find(o => o.id === f.customKindId);
    return rec ?? FURNITURE_KINDS.block;
  }
  return furnitureDef(f);
}

// ── Functional front (approach side) ─────────────────────────────────────────
//
// A piece has a FUNCTIONAL FRONT when one face is the working face: a fridge
// door, an oven, a TV screen, a desk knee-hole, a washer drum. Those pieces must
// be approached from that side — an avatar that walks up to the BACK of a fridge
// and plays the "peer into the fridge" pose clips straight through the carcass
// (user-reported).
//
// The signal ALREADY EXISTS in the kind table: `frontArrow` gates the 2D front
// chevron and is authored `false` on exactly the pieces that have no meaningful
// front (blocks, rugs, tables, plants, trees, bins, ottomans, stools, fountains,
// wall plates). Default (absent) = true. So `frontArrow !== false` IS the
// orientation predicate — reuse it rather than growing a second, divergent list.
//
// Front direction is **local −Z** (the documented convention shared by the 2D
// chevron, the SitSpot entry normal and humanoid facing), which in the WORLD
// PLAN frame is (−sin r, −cos r) for a screen-CW rotation r.
export function hasFunctionalFront(def: FurnitureKindDef | null | undefined): boolean {
  return !!def && def.frontArrow !== false;
}

/** Unit vector of a piece's functional front (local −Z) in the world PLAN frame. */
export function frontVectorPlan(rotationDeg: number | undefined): Vec2 {
  const r = (rotationDeg ?? 0) * Math.PI / 180;
  return { x: -Math.sin(r), y: -Math.cos(r) };
}

/**
 * Is (px, py) on the FRONT side of the piece at (cx, cy)? Signed distance from
 * the piece's lateral mid-plane along the front normal, compared to `marginMm`
 * (0 = the plane itself; a positive margin demands genuine clearance).
 */
export function inFrontHalfspace(cx: number, cy: number, rotationDeg: number | undefined,
                                 px: number, py: number, marginMm = 0): boolean {
  const f = frontVectorPlan(rotationDeg);
  return (px - cx) * f.x + (py - cy) * f.y > marginMm;
}

// ── Tree species & per-piece height ───────────────────────────────────────────
// Every tree kind (NOT `bush` — a shrub is not a tree, and its build has no
// trunk/canopy split to scale). Membership grants exactly one thing: the
// per-piece `Furniture.ht` HEIGHT override honoured by treeHeightMm below, and
// the sidebar "Height (mm)" row that writes it. Nav / terrain / grounding are
// untouched — a tree blocks nav by its footprint exactly as before.
export const TREE_KINDS = new Set<FurnitureKind>([
  'tree', 'pine_tree', 'oak_tree', 'birch_tree', 'palm_tree', 'willow_tree', 'spruce_tree',
]);
export function isTreeKind(kind?: FurnitureKind): kind is FurnitureKind {
  return kind != null && TREE_KINDS.has(kind);
}

// A tree may be anywhere from a 1 m sapling to a 15 m specimen.
export const TREE_MIN_HEIGHT_MM = 1000;
export const TREE_MAX_HEIGHT_MM = 15000;

/**
 * The overall HEIGHT (mm, ground to crown) of a tree piece.
 *
 * `Furniture.ht` is an item-level per-piece override — the same field the
 * stairs family uses for its RISE (`stairsRiseMm`), and the two consumers are
 * disjoint by kind (STAIRS_KINDS ∩ TREE_KINDS = ∅), so neither can read the
 * other's value. Every other kind still reads its `FurnitureKindDef.ht`.
 *
 * Clamped to [TREE_MIN_HEIGHT_MM, TREE_MAX_HEIGHT_MM]; absent / non-finite
 * falls back to the kind default, which is what keeps untouched trees
 * byte-identical to the pre-feature build.
 */
export function treeHeightMm(fu: { kind?: FurnitureKind; ht?: number }, defHt: number): number {
  if (!isTreeKind(fu?.kind)) return defHt;
  const v = fu?.ht;
  if (typeof v !== 'number' || !isFinite(v)) return defHt;
  return Math.min(TREE_MAX_HEIGHT_MM, Math.max(TREE_MIN_HEIGHT_MM, v));
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

// ── Door kind families ─────────────────────────────────────────────────────
// Sliding kinds TRANSLATE their panel along the wall instead of swinging; the
// existing `hinge` field is re-read as the SLIDE SIDE (see doorSlideDir).
export function isSlidingDoorKind(kind?: DoorKind): boolean {
  return kind === 'sliding' || kind === 'pocket' || kind === 'sliding_glass';
}
// Two mirrored half-width leaves meeting at the span centre. `hinge` is IGNORED
// (the pair is symmetric — leaf A hinges at (x,y), leaf B at the endpoint).
export function isDoubleLeafDoorKind(kind?: DoorKind): boolean {
  return kind === 'double' || kind === 'french';
}
// Kinds whose leaves are GLAZED (window-glass idiom in 3D, blue-grey in 2D).
export function isGlassDoorKind(kind?: DoorKind): boolean {
  return kind === 'french' || kind === 'sliding_glass';
}
// Slide direction along the span, in the door's own frame: +1 = the panel
// retracts toward the (x, y) HINGE end (default), −1 = toward the endpoint.
export function doorSlideDir(d: { hinge?: 'right' | 'left' }): number {
  return d.hinge === 'left' ? -1 : 1;
}
// Default opening span per kind (mm). The sidebar / toolbar drop bump a
// still-default 800 mm opening when the kind changes (garage 800→2400 idiom).
export const DOOR_DEFAULT_W = 800;
export function doorDefaultWidth(kind?: DoorKind): number {
  switch (kind) {
    case 'garage':        return 2400;
    case 'double':
    case 'french':
    case 'sliding_glass': return 1500;
    default:              return DOOR_DEFAULT_W;
  }
}

// Garage-door opening height (mm). Slats fill 0..GARAGE_DOOR_H when closed; the
// wall opening's lintel starts here (see wallCutsForSegment's `head`). Slightly
// taller than the swing-door lintel (DOOR_HEAD 2050) — a garage is ~7 ft.
export const GARAGE_DOOR_H = 2100;

// Per-door opening-height override (Door.garageHeight). Absent / non-finite →
// GARAGE_DOOR_H, so an untouched garage door is byte-identical everywhere. The
// clamp spans a low single-car head (1800) up to an RV bay (4200); the slat
// COUNT never changes (5) — the sections simply scale with H. Consumed by BOTH
// wallCutsForSegment (the lintel `head`) and the 3D leaf builder, so the wall
// opening and the drawn door can never disagree about how tall the hole is.
export const GARAGE_HEIGHT_MIN = 1800;
export const GARAGE_HEIGHT_MAX = 4200;
export function garageDoorHeightMm(d: { garageHeight?: number }): number {
  const v = d.garageHeight;
  return typeof v === 'number' && isFinite(v)
    ? Math.max(GARAGE_HEIGHT_MIN, Math.min(GARAGE_HEIGHT_MAX, v))
    : GARAGE_DOOR_H;
}

// Shared hex-colour validator for optional user-set tints (Door.color,
// Window.frameColor). Anything that isn't a literal `#rgb` / `#rrggbb` resolves
// to null = "use the shipped default", so a hand-edited config can never hand a
// canvas a garbage fillStyle (which silently keeps the previous fill) nor THREE
// a NaN colour. Mirrors the renderer's private bgHex for the bg-text palette.
const VALID_HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
export function validHexColor(v: unknown): string | null {
  return typeof v === 'string' && VALID_HEX_RE.test(v.trim()) ? v.trim() : null;
}

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
// the wall face (+5 mm clearance).
//
// PUSH-OUT ONLY — this is NOT a magnet (user: "when placing a bed, it is getting
// sucked into the wall instead of being placed near it"). It used to act
// "magnetically" over a 150 mm WALL_MAGNET_MM reach beyond the face, so a piece
// deliberately dropped with a small gap was yanked flush — the drop teleported.
// Now it acts only when the near edge is INSIDE the keep-out band (overlapping
// the slab or within the 5 mm clearance), pushing out to exactly FLUSH. A piece
// placed with a gap stays exactly where the user put it, and flush is still ONE
// gesture away: drop the piece ON the wall and the push-out settles it flush.
// Doors/windows are ON walls and never call this;
// invisible walls (planning boundaries) are skipped. Two passes resolve the
// common case where clearing one wall creates a small overlap with a
// perpendicular neighbour. Mutates piece.x / piece.y; returns whether it moved.
const WALL_FACE_MM = 50;      // half of the 100 mm wall thickness
const WALL_CLEAR_MM = 5;      // small gap so the edge isn't exactly coincident
// (WALL_MAGNET_MM is GONE — see the push-out-only note above.)

export function resolveFurnitureWallCollision(
  piece: { x: number; y: number; w: number; h: number; rotation?: number },
  walls: { points: Vec2[]; kind?: WallKind }[],
  passes = 2,
): boolean {
  const FLUSH = WALL_FACE_MM + WALL_CLEAR_MM;   // 55: resting distance of the near edge
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
          // Near edge is pmin; act ONLY when it has entered the keep-out band
          // (pmin < FLUSH — overlapping the slab or inside the clearance), then
          // push out to exactly +FLUSH. A gap of 56 mm or more is left alone.
          if (pmin < FLUSH) {
            const delta = FLUSH - pmin;
            piece.x += nx * delta; piece.y += ny * delta;
            passMoved = true; movedAny = true;
          }
        } else {
          // Symmetric on the − side: near edge is pmax.
          if (pmax > -FLUSH) {
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
//
// CONVEX-CLIPPER LIMIT (load-bearing — see clipVoidToLoop): Sutherland–Hodgman
// intersects the subject with the HALF-PLANE of every clipper edge in turn, so
// when the CLIPPER is concave the result collapses to the subject ∩ the
// clipper's convex kernel. Stairwell wells are rects (convex) so they are
// exact; a user-drawn CONCAVE void used as the clipper is NOT — an 8-point
// L-shaped void loses the whole re-entrant part. Floor voids therefore go
// through `clipVoidToLoop`, which returns a contained void verbatim and only
// falls back here for the (rare, accepted-approximate) straddling case.
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

// ── Floor-void clipping ──────────────────────────────────────────────────────
// How far a void vertex may sit OUTSIDE a wall loop and still count as
// contained. Voids are drawn against the plan, so their vertices are routinely
// snapped ONTO the wall centerlines the loop is traced from — `pointInPolygon`
// is strict and reports those as outside. 30 mm is well under the 100 mm grid
// snap and under WALL_HALF (50), so it can only ever absorb "on the wall line",
// never a genuinely-outside vertex.
//
// NB no inset is applied to a contained void: earcut tolerates a hole edge
// lying exactly on the containing contour here (the shipped behaviour for
// convex on-boundary voids, which have always cut correctly) — unlike the
// well-rect path, which insets 3 mm because a rect corner can land exactly on
// a loop CORNER.
export const VOID_BOUNDARY_TOL_MM = 30;

// Signed perpendicular distance (mm) of p from the INFINITE line a→b.
// NaN-free: a degenerate (zero-length) segment returns 0.
function _perpDist(a: Vec2, b: Vec2, p: Vec2): number {
  const ex = b.x - a.x, ey = b.y - a.y;
  const len = Math.hypot(ex, ey);
  if (!(len > 1e-9)) return 0;
  return (ex * (p.y - a.y) - ey * (p.x - a.x)) / len;
}

// Do segments a→b and c→d cross PROPERLY (interiors intersect)? Touching —
// an endpoint on the other segment's line within `tol` mm — is deliberately
// NOT a crossing: a void vertex snapped onto a wall line must read as
// contained, not straddling.
function _segCrossesProper(a: Vec2, b: Vec2, c: Vec2, d: Vec2, tol: number): boolean {
  const d1 = _perpDist(a, b, c), d2 = _perpDist(a, b, d);
  if (Math.abs(d1) <= tol || Math.abs(d2) <= tol || (d1 > 0) === (d2 > 0)) return false;
  const d3 = _perpDist(c, d, a), d4 = _perpDist(c, d, b);
  if (Math.abs(d3) <= tol || Math.abs(d4) <= tol || (d3 > 0) === (d4 > 0)) return false;
  return true;
}

/**
 * Clip a floor-VOID polygon to the wall loop (or floor rect) that will carry it
 * as a hole. Pure; world mm in, world mm out; null when nothing is left.
 *
 * CONTAINMENT FAST PATH (the case that matters): when every void vertex is
 * inside the loop — or within `VOID_BOUNDARY_TOL_MM` of its boundary — AND no
 * void edge properly crosses a loop edge, the void is returned VERBATIM. That
 * is exact for ANY concavity, which `intersectLoopWithRect` is not: with the
 * void as a Sutherland–Hodgman clipper a concave void is butchered down to its
 * convex kernel (a real 8-point L-shaped opening measured a 58 % area loss —
 * the "voids don't render as open areas" report).
 *
 * FALLBACK: a genuinely STRADDLING void still routes through
 * `intersectLoopWithRect`, which stays APPROXIMATE for a concave subject (see
 * that function's note). Accepted for v1 — containment is the norm and the
 * result is always ⊆ the loop, so a straddling void can never bleed a hole
 * outside its floor patch.
 */
export function clipVoidToLoop(loop: Vec2[], poly: Vec2[]): Vec2[] | null {
  if (loop.length < 3 || poly.length < 3) return null;
  const tol = VOID_BOUNDARY_TOL_MM;
  let contained = true;
  for (const p of poly) {
    if (pointInPolygon(p.x, p.y, loop)) continue;
    let near = false;
    for (let i = 0; i < loop.length && !near; i++) {
      const a = loop[i], b = loop[(i + 1) % loop.length];
      if (pointToSeg(p.x, p.y, a.x, a.y, b.x, b.y) <= tol) near = true;
    }
    if (!near) { contained = false; break; }
  }
  if (contained) {
    let crosses = false;
    for (let i = 0; i < poly.length && !crosses; i++) {
      const p0 = poly[i], p1 = poly[(i + 1) % poly.length];
      for (let j = 0; j < loop.length; j++) {
        if (_segCrossesProper(p0, p1, loop[j], loop[(j + 1) % loop.length], tol)) {
          crosses = true; break;
        }
      }
    }
    if (!crosses) return poly;
  }
  return intersectLoopWithRect(loop, poly);
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

// Scene3D.groundLevelMm — the USER's offset of the world ground plane relative
// to the floor stack. Clamped so a fat-fingered value can't fling the backdrop
// grid past the far plane; the house-on-a-foundation case lives in the first
// metre of the negative range. NOTE this bounds the USER value ONLY — the
// EFFECTIVE level the renderer consumes is this minus the active floor's
// elevation and is deliberately unbounded (see three-view's injection point and
// three-renderer's sanitizeGroundLevelMm). Lives here (pure, three-free) so
// three-view can clamp without static-importing the lazy renderer chunk;
// three-renderer re-exports it as its historical public home.
const GROUND_LEVEL_LIMIT = 10000;
export function resolveGroundLevelMm(v: number | null | undefined): number {
  if (typeof v !== 'number' || !isFinite(v)) return 0;
  return Math.max(-GROUND_LEVEL_LIMIT, Math.min(GROUND_LEVEL_LIMIT, v));
}

// ── Floor elevation above the WORLD GROUND PLANE ─────────────────────────────
// Nominal story height (2743 mm wall + slab). The single source of truth: the
// renderer's ghost-floor stacking, the glass-house transit puppet's Y sweep and
// the AUTO elevation below all read it, so a change lands everywhere at once.
export const STORY_H_MM = 3000;

/**
 * A floor slab's height above the world ground plane, in mm.
 *
 * The ground plane is FIXED in the world; floors sit at their own elevations
 * relative to it (this is what makes the grade stop riding whichever story
 * happens to be selected). `Floor.elevationMm` is the explicit value; when it is
 * absent the elevation is AUTO = `indexInFloorsArray × STORY_H_MM`, which
 * reproduces the historical ghost-floor stack exactly and puts floors[0] — the
 * lowest story — ON the ground plane. Negative is legal (a basement), and the
 * ground plane may bisect a floor (e.g. a walk-out lower level at −1300).
 *
 * `floors` MUST be the FULL `Store.floors` array (canonical story order): the
 * AUTO value is index-derived, so resolving against a filtered list (e.g. the
 * enabled-only list the ghost builder renders) would re-stack the autos every
 * time an unrelated floor was disabled.
 *
 * Unknown id → 0 (the ground plane itself) — never throws, never NaN.
 */
export function floorElevationMm(
  floors: readonly { id: string; elevationMm?: number }[] | null | undefined,
  floorId: string,
): number {
  if (!floors) return 0;
  for (let i = 0; i < floors.length; i++) {
    const f = floors[i];
    if (!f || f.id !== floorId) continue;
    const e = f.elevationMm;
    return (typeof e === 'number' && isFinite(e)) ? e : i * STORY_H_MM;
  }
  return 0;
}

// ── Void shaft depth ─────────────────────────────────────────────────────────
// A floor opening must never bottom out flush with its own slab: at least this
// much drop, so even two floors authored a few mm apart read as a real hole.
export const VOID_DEPTH_MIN_MM = 600;

/**
 * How deep a floor VOID's shaft should be drawn on the active floor, in mm.
 *
 * The drop to the next storey down: `activeElevation − nearestLowerElevation`,
 * clamped at `VOID_DEPTH_MIN_MM`. Only ENABLED floors count as "below" — a
 * disabled floor isn't part of the live experience, so its slab must not
 * shorten the shaft. With nothing below (single floor, or the active floor IS
 * the lowest) the shaft falls a nominal storey, `STORY_H_MM`.
 *
 * `floors` MUST be the FULL `Store.floors` array — AUTO elevations are
 * index-derived (see `floorElevationMm`), so a pre-filtered list would re-stack
 * them. The disabled filter is applied here, per-candidate, instead.
 *
 * Pure; unknown id → resolves against elevation 0; never throws, never NaN.
 */
export function voidDepthBelowMm(
  floors: readonly { id: string; elevationMm?: number; disabled?: boolean }[] | null | undefined,
  activeId: string,
): number {
  if (!floors || !floors.length) return STORY_H_MM;
  const active = floorElevationMm(floors, activeId);
  let below: number | null = null;
  for (const fl of floors) {
    if (!fl || fl.id === activeId || fl.disabled) continue;
    const e = floorElevationMm(floors, fl.id);
    if (!isFinite(e) || e >= active) continue;
    if (below === null || e > below) below = e;
  }
  if (below === null) return STORY_H_MM;
  return Math.max(VOID_DEPTH_MIN_MM, active - below);
}

// ── Item ground level, app-side ──────────────────────────────────────────────
// A pure MIRROR of the renderer's `_itemGroundY` (three-renderer.ts) so the app
// graph can answer "what height is the ground at this plan point?" without
// touching the lazy three.js chunk. The two MUST agree — terrain-test pins them
// against each other at grade / terrace / indoor points. If you change one, and
// only one, avatars will stand somewhere the geometry says they don't.
//
// THE RULE, in order (see _itemGroundY's own comment for the full rationale):
//   1. TERRACE — the highest `GroundArea` with a non-zero `elevationMm` whose
//      polygon contains the point wins: its top is `elevationMm + grade(at the
//      area's CENTROID)`. Terrace tops are authored against the grade, never
//      against another terrace, so nesting can't double-count. Skipped for a
//      point INSIDE a closed wall loop (indoors never moves).
//   2. Otherwise the surroundings GRADE when the point lies outside every closed
//      wall loop, else the slab (0). A loop-less floor has no interior, so the
//      grade never applies there — but terraces still do.
//
// The grade itself is the EFFECTIVE one: the user's `Scene3D.groundLevelMm`
// (clamped) minus this floor's elevation above the fixed world ground plane,
// exactly the value three-view injects into the renderer.
export interface ItemGroundFloor {
  id: string;
  walls?: readonly { points: Vec2[] }[];
  groundAreas?: readonly { points: Vec2[]; elevationMm?: number; hidden?: boolean }[];
}
export function resolveItemGroundMm(
  floor: ItemGroundFloor | null | undefined,
  floors: readonly { id: string; elevationMm?: number }[] | null | undefined,
  groundLevelMmUser: number | null | undefined,
  x: number, y: number,
): number {
  if (!floor) return 0;
  const grade = resolveGroundLevelMm(groundLevelMmUser) - floorElevationMm(floors, floor.id);
  const loops = closedWallLoops((floor.walls ?? []) as { points: Vec2[] }[]);
  const inside = (px: number, py: number) => loops.some(lp => pointInPolygon(px, py, lp));
  // _gradeY: outdoors = outside every loop, and a floor with NO loops reads as
  // indoors (we can't tell) — the same asymmetry `_outdoors` documents.
  const gradeAt = (px: number, py: number) =>
    (grade !== 0 && loops.length > 0 && !inside(px, py)) ? grade : 0;

  if (!inside(x, y)) {
    let g = 0, found = false;
    for (const a of floor.groundAreas ?? []) {
      const elev = a.elevationMm ?? 0;
      if (a.hidden || elev === 0 || !a.points || a.points.length < 3) continue;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const pt of a.points) {
        if (pt.x < minX) minX = pt.x; if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y; if (pt.y > maxY) maxY = pt.y;
      }
      if (x < minX || x > maxX || y < minY || y > maxY) continue;   // bbox pre-filter
      if (!pointInPolygon(x, y, a.points)) continue;
      const c = centroid(a.points);
      const gy = elev + gradeAt(c.x, c.y);
      if (!found || gy > g) { g = gy; found = true; }
    }
    if (found) return g;
  }
  return gradeAt(x, y);
}

// Centre of the union of every given floor's rect, in world mm. All floors share
// ONE world frame and every rect is anchored at the origin (0..w × 0..d), so the
// union is simply 0..max(w) × 0..max(d) and its centre is max/2. Used by the 3D
// camera-pivot enforcement to orbit the whole stack under glass house instead of
// just the active story. Empty list → the origin.
export function floorsUnionCenter(floors: readonly { w: number; d: number }[]): { x: number; y: number } {
  let maxW = 0, maxD = 0;
  for (const f of floors) {
    const w = Number(f?.w), d = Number(f?.d);
    if (isFinite(w) && w > maxW) maxW = w;
    if (isFinite(d) && d > maxD) maxD = d;
  }
  return { x: maxW / 2, y: maxD / 2 };
}

// 3D camera pivot / movement policy, resolved from the two INDEPENDENT booleans
// `Scene3D.pivotLocked` (absent = TRUE) and `Scene3D.freeMovement` (absent =
// FALSE), with a back-compat read of the DEPRECATED `Scene3D.cameraPivot` enum
// for stores written before the split. Either new field being present means the
// store is in the new world and the legacy enum is ignored entirely (so a stale
// `cameraPivot:'free'` can never override an explicit new setting).
//
//   locked   free    behaviour
//   ------   ----    --------------------------------------------------------
//   true     false   the DEFAULT: pan disabled, target eased back to the plan
//                    centre (`_updateCameraPivot`).
//   true     true    pan enabled, but rotation rigidly spins the camera+target
//                    pair about the plan centre (custom gesture in the
//                    renderer; OrbitControls' own rotate is turned off).
//   false    true    classic OrbitControls — pan enabled, pivot follows.
//   false    false   degenerate but defined: pan disabled, stock rotate, no
//                    enforcement — the pivot simply stays wherever it is.
export function resolvePivotMode(
  sc3: { pivotLocked?: boolean; freeMovement?: boolean; cameraPivot?: 'center' | 'free' } | undefined | null,
): { locked: boolean; free: boolean } {
  if (sc3 && (sc3.pivotLocked !== undefined || sc3.freeMovement !== undefined)) {
    return { locked: sc3.pivotLocked !== false, free: sc3.freeMovement === true };
  }
  if (sc3 && sc3.cameraPivot === 'free') return { locked: false, free: true };
  return { locked: true, free: false };
}

// Floors whose 2D wall outline should draw as a reference underlay while some
// OTHER floor is the active one: peek2d && !disabled, excluding the current
// floor. Pure selection helper (consumed by canvas-render's onion-skin pass).
export function peekFloors(floors: readonly Floor[], currentId: string): Floor[] {
  return floors.filter(f => f.id !== currentId && f.peek2d && !f.disabled);
}
