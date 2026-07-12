// Pure geometry helpers — no DOM, no state.

import type { Vec2, Sensor, BgImage, LightIconKind, FurnitureKind, EnvKind, WallKind,
  ActivityKind, ObjectRecipe, Furniture, Room } from './types.js';

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

export interface WallOpeningCut { t0: number; t1: number; kind: 'door' | 'window'; }

// For one wall segment a→b: which door/window openings cut it, and what
// solid sub-intervals remain. t values are mm along the segment. An opening
// counts when its center projects onto the segment within `tol` of the axis.
export function wallCutsForSegment(
  a: Vec2, b: Vec2,
  doors: { x: number; y: number; w: number; rotation: number }[],
  windows: { x: number; y: number; w: number }[],
  tol = 150,
): { solids: { t0: number; t1: number }[]; openings: WallOpeningCut[] } {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return { solids: [], openings: [] };
  const ux = dx / len, uy = dy / len;
  const openings: WallOpeningCut[] = [];
  const collect = (cx: number, cy: number, w: number, kind: 'door' | 'window') => {
    const px = cx - a.x, py = cy - a.y;
    const t = px * ux + py * uy;
    const perp = Math.abs(-uy * px + ux * py);
    if (perp > tol || t < -w / 2 || t > len + w / 2) return;
    const t0 = Math.max(0, t - w / 2), t1 = Math.min(len, t + w / 2);
    if (t1 - t0 > 10) openings.push({ t0, t1, kind });
  };
  for (const d of doors) { const c = doorSpanCenter(d); collect(c.x, c.y, d.w, 'door'); }
  for (const w of windows) collect(w.x, w.y, w.w, 'window');
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
