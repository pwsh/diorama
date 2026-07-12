import { switchSize, distMM, pointToSeg, transformVerts, centroid, localToWorld,
         bgLocalToWorld, bgWorldToLocal, furnitureWorldToLocal,
         furnitureCorners, furnitureLocalToWorld, doorEndpoint,
         doorOpenDeltaDeg, windowEndpoints } from './geometry.js';
import type { Planner } from './planner.js';
import type { Vec2, Wall, Sensor, Furniture, BgImage, MotionSensor, EnvSensor, BleProxy, Door, Window as WindowType, Floor } from './types.js';
import type { FloorEdge } from './geometry.js';
import { envChipHalfPx, type View } from './canvas-render.js';

export function hitPx(view: View): number {
  return Math.max(60, 12 / Math.max(view.scale, 1e-9));
}

// Nearest floor boundary edge within ~10 px (screen) of the cursor, or null.
// Only the edge alongside the cursor qualifies (the perpendicular coordinate
// must be within the rect span + tolerance) so a distant corner never grabs.
// Ties (a corner) resolve to the closer edge. Callers gate on edit + select.
export function hitFloorEdge(f: Floor, view: View, mm: Vec2): FloorEdge | null {
  const dpr = window.devicePixelRatio || 1;
  const tol = 10 * dpr / Math.max(view.scale, 1e-9);
  const inX = mm.x >= -tol && mm.x <= f.w + tol;
  const inY = mm.y >= -tol && mm.y <= f.d + tol;
  const cands: { edge: FloorEdge; dist: number }[] = [];
  if (inY && Math.abs(mm.x) <= tol) cands.push({ edge: 'left', dist: Math.abs(mm.x) });
  if (inY && Math.abs(mm.x - f.w) <= tol) cands.push({ edge: 'right', dist: Math.abs(mm.x - f.w) });
  if (inX && Math.abs(mm.y - f.d) <= tol) cands.push({ edge: 'top', dist: Math.abs(mm.y - f.d) });
  if (inX && Math.abs(mm.y) <= tol) cands.push({ edge: 'bottom', dist: Math.abs(mm.y) });
  if (!cands.length) return null;
  cands.sort((a, b) => a.dist - b.dist);
  return cands[0].edge;
}

export function hitSensor(p: Planner, view: View, mm: Vec2): Sensor | null {
  const f = p.floor();
  for (let i = f.sensors.length - 1; i >= 0; i--)
    if (distMM(f.sensors[i], mm) < hitPx(view) * 1.5) return f.sensors[i];
  return null;
}

export function hitSensorRotateHandle(p: Planner, view: View, mm: Vec2): Sensor | null {
  const sa = p.activeSensor(); if (!sa || sa.locked) return null;
  const dpr = window.devicePixelRatio || 1;
  const rPx = 34 * dpr;
  const t = (sa.heading || 0) * Math.PI / 180;
  const hx = sa.x + Math.sin(t) * rPx / view.scale;
  const hy = sa.y + Math.cos(t) * rPx / view.scale;
  return distMM({ x: hx, y: hy }, mm) < hitPx(view) ? sa : null;
}

export function hitWallVert(p: Planner, view: View, mm: Vec2): { wall: Wall; idx: number } | null {
  const f = p.floor();
  const h = hitPx(view);
  // Locked walls expose no vertex anchors (they aren't drawn either).
  for (const w of f.walls) {
    if (w.locked) continue;
    for (let i = 0; i < w.points.length; i++)
      if (distMM(w.points[i], mm) < h) return { wall: w, idx: i };
  }
  return null;
}

export function hitWall(p: Planner, mm: Vec2): Wall | null {
  const f = p.floor();
  for (const w of f.walls)
    for (let i = 0; i < w.points.length - 1; i++)
      if (pointToSeg(mm.x, mm.y, w.points[i].x, w.points[i].y,
                     w.points[i + 1].x, w.points[i + 1].y) < 150) return w;
  return null;
}

export function hitFurniture(p: Planner, mm: Vec2): { item: Furniture; idx: number } | null {
  const f = p.floor();
  for (let i = f.furniture.length - 1; i >= 0; i--) {
    const piece = f.furniture[i];
    const lp = furnitureWorldToLocal(piece.rotation, mm.x - piece.x, mm.y - piece.y);
    if (Math.abs(lp.x) < piece.w / 2 && Math.abs(lp.y) < piece.h / 2)
      return { item: piece, idx: i };
  }
  return null;
}

export interface FurnCornerHit { idx: number; anchor: Vec2; sx: number; sy: number; }
export function hitFurnitureCorner(p: Planner, view: View, mm: Vec2): FurnCornerHit | null {
  const f = p.floor();
  const h = hitPx(view);
  for (let i = 0; i < f.furniture.length; i++) {
    const piece = f.furniture[i];
    if (piece.locked) continue;  // no anchors on locked pieces
    // Corner positions account for piece.rotation so anchors stay grabbable
    // for rotated pieces too. Anchor is the OPPOSITE corner in world coords.
    const corners = furnitureCorners(piece);
    for (const c of corners) {
      if (Math.hypot(mm.x - c.x, mm.y - c.y) < h) {
        const aw = furnitureLocalToWorld(piece.rotation,
                                         -c.sx * piece.w / 2, -c.sy * piece.h / 2);
        return { idx: i, anchor: { x: piece.x + aw.x, y: piece.y + aw.y },
                 sx: c.sx, sy: c.sy };
      }
    }
  }
  return null;
}

export interface FixtureHit { kind: 'light' | 'switch'; idx: number; }
export function hitFixture(p: Planner, mm: Vec2, hitMM: number): FixtureHit | null {
  const f = p.floor();
  let best: FixtureHit | null = null;
  let bd = (hitMM || 300) ** 2;
  for (let i = 0; i < f.lights.length; i++) {
    const l = f.lights[i];
    const d2 = (l.x - mm.x) ** 2 + (l.y - mm.y) ** 2;
    if (d2 < bd) { bd = d2; best = { kind: 'light', idx: i }; }
  }
  for (let i = 0; i < f.switches.length; i++) {
    const sw = f.switches[i];
    const d2 = (sw.x - mm.x) ** 2 + (sw.y - mm.y) ** 2;
    // Oversized plates stay clickable across their whole face.
    const r2 = Math.max(bd, (switchSize(sw) / 2 + 60) ** 2);
    if (d2 < r2 && (best === null || d2 < bd)) { bd = d2; best = { kind: 'switch', idx: i }; }
  }
  return best;
}

export interface VertOrZoneHit {
  kind: 'vert' | 'zone';
  prefix: 'iz' | 'fz';
  zi: number;
  vi: number;
  startVerts: Vec2[];
}
export function hitVertexOrZone(p: Planner, view: View, mm: Vec2): VertOrZoneHit | null {
  const sa = p.activeSensor(); if (!sa) return null;
  const vHit = Math.max(30, 10 / Math.max(view.scale, 1e-9));
  const cHit = Math.max(50, 14 / Math.max(view.scale, 1e-9));
  const check = (zoneArr: { vertices: Vec2[] }[], expanded: Set<number>,
                 prefix: 'iz' | 'fz'): VertOrZoneHit | null => {
    for (let zi = 0; zi < zoneArr.length; zi++) {
      const z = zoneArr[zi];
      if (!expanded.has(zi) || z.vertices.length === 0) continue;
      const wv = transformVerts(sa, z.vertices);
      for (let vi = 0; vi < wv.length; vi++) {
        if (distMM(mm, wv[vi]) < vHit)
          return { kind: 'vert', prefix, zi, vi, startVerts: z.vertices.map(v => ({ ...v })) };
      }
      if (wv.length >= 3) {
        const c = centroid(wv);
        if (distMM(mm, c) < cHit)
          return { kind: 'zone', prefix, zi, vi: -1, startVerts: z.vertices.map(v => ({ ...v })) };
      }
    }
    return null;
  };
  // An active sensor that was never bound has no live-state slots yet —
  // dereferencing them threw here, which killed EVERY canvas mousedown
  // while such a sensor was selected (the canvas appeared frozen).
  const zl = p.zonesBy[sa.id];
  if (!zl || !p.izExpanded[sa.id] || !p.fzExpanded[sa.id]) return null;
  return check(zl.inclusion, p.izExpanded[sa.id], 'iz') ||
         check(zl.filter,    p.fzExpanded[sa.id], 'fz');
}

export interface ObjectHit { oi: number; startObj: Vec2; }
export function hitObject(p: Planner, view: View, mm: Vec2): ObjectHit | null {
  const sa = p.activeSensor(); if (!sa) return null;
  const objs = p.objectsBy[sa.id]; if (!objs) return null;
  const hit = Math.max(150, 25 / Math.max(view.scale, 1e-9));
  for (let oi = 0; oi < objs.length; oi++) {
    const o = objs[oi]; if (!o.enabled) continue;
    const wp = localToWorld(sa, o.x, o.y);
    if (distMM(mm, wp) < hit) return { oi, startObj: { x: o.x, y: o.y } };
  }
  return null;
}

export interface ObjectRadiusHit { oi: number; startR: number; startMm: Vec2; }
export function hitObjectRadiusHandle(p: Planner, view: View, mm: Vec2): ObjectRadiusHit | null {
  const sa = p.activeSensor(); if (!sa) return null;
  const objs = p.objectsBy[sa.id]; if (!objs) return null;
  const eo = p.editObject[sa.id];
  if (eo === undefined || eo < 0) return null;
  const o = objs[eo]; if (!o?.enabled) return null;
  const wp = localToWorld(sa, o.x + o.radius, o.y);
  const hit = Math.max(100, 15 / Math.max(view.scale, 1e-9));
  return distMM(mm, wp) < hit ? { oi: eo, startR: o.radius, startMm: mm } : null;
}

export function hitDoor(p: Planner, view: View, mm: Vec2): { door: Door; idx: number } | null {
  const f = p.floor();
  const states = p.hass?.states;
  const tol = Math.max(80, 10 / Math.max(view.scale, 1e-9));
  for (let i = f.doors.length - 1; i >= 0; i--) {
    const d = f.doors[i];
    const isOpen = d.entity_id && states ? states[d.entity_id]?.state === 'on' : false;
    const end = doorEndpoint(d, isOpen ? doorOpenDeltaDeg(d) : 0);
    if (pointToSeg(mm.x, mm.y, d.x, d.y, end.x, end.y) < tol)
      return { door: d, idx: i };
  }
  return null;
}

export function hitDoorEnd(p: Planner, view: View, mm: Vec2): { door: Door; idx: number } | null {
  const f = p.floor();
  const states = p.hass?.states;
  const dpr = window.devicePixelRatio || 1;
  const tol = Math.max(80, (10 * dpr) / Math.max(view.scale, 1e-9));
  for (let i = f.doors.length - 1; i >= 0; i--) {
    const d = f.doors[i];
    if (d.locked) continue;  // no rotate anchor on locked doors
    const isOpen = d.entity_id && states ? states[d.entity_id]?.state === 'on' : false;
    const end = doorEndpoint(d, isOpen ? doorOpenDeltaDeg(d) : 0);
    if (distMM(end, mm) < tol) return { door: d, idx: i };
  }
  return null;
}

export function hitWindow(p: Planner, view: View, mm: Vec2): { win: WindowType; idx: number } | null {
  const f = p.floor();
  const tol = Math.max(80, 10 / Math.max(view.scale, 1e-9));
  for (let i = f.windows.length - 1; i >= 0; i--) {
    const w = f.windows[i];
    const ends = windowEndpoints(w);
    if (pointToSeg(mm.x, mm.y, ends.a.x, ends.a.y, ends.b.x, ends.b.y) < tol)
      return { win: w, idx: i };
  }
  return null;
}

export function hitWindowEnd(p: Planner, view: View, mm: Vec2):
    { win: WindowType; idx: number; end: 'a' | 'b' } | null {
  const f = p.floor();
  const dpr = window.devicePixelRatio || 1;
  const tol = Math.max(80, (10 * dpr) / Math.max(view.scale, 1e-9));
  for (let i = f.windows.length - 1; i >= 0; i--) {
    const w = f.windows[i];
    if (w.locked) continue;  // no rotate anchors on locked windows
    const ends = windowEndpoints(w);
    if (distMM(ends.a, mm) < tol) return { win: w, idx: i, end: 'a' };
    if (distMM(ends.b, mm) < tol) return { win: w, idx: i, end: 'b' };
  }
  return null;
}

export function hitMotionSensor(p: Planner, view: View, mm: Vec2): MotionSensor | null {
  const f = p.floor();
  const h = hitPx(view) * 1.4;
  for (let i = f.motionSensors.length - 1; i >= 0; i--) {
    if (distMM(f.motionSensors[i], mm) < h) return f.motionSensors[i];
  }
  return null;
}

export function hitBleProxy(p: Planner, view: View, mm: Vec2): BleProxy | null {
  const f = p.floor();
  const h = hitPx(view) * 1.4;
  const list = f.bleProxies ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].hidden) continue;
    if (distMM(list[i], mm) < h) return list[i];
  }
  return null;
}

export function hitEnvSensor(p: Planner, view: View, mm: Vec2): EnvSensor | null {
  const f = p.floor();
  const fallback = hitPx(view) * 2;
  for (let i = f.envSensors.length - 1; i >= 0; i--) {
    const e = f.envSensors[i];
    // Rect test against the chip actually drawn last frame (px extents from
    // canvas-render); falls back to a radius before the first draw.
    const half = envChipHalfPx.get(e.id);
    if (half) {
      const pad = 4 * (window.devicePixelRatio || 1);
      const dxPx = Math.abs(mm.x - e.x) * view.scale;
      const dyPx = Math.abs(mm.y - e.y) * view.scale;
      if (dxPx < half.w + pad && dyPx < half.h + pad) return e;
    } else if (distMM(e, mm) < fallback) return e;
  }
  return null;
}

// Orange dot on the selected chip's right edge — drag to scale the chip.
export function hitEnvResizeHandle(p: Planner, view: View, mm: Vec2): EnvSensor | null {
  const id = p.activeEnvId; if (!id) return null;
  const e = p.floor().envSensors.find(x => x.id === id);
  if (!e || e.locked) return null;
  const half = envChipHalfPx.get(e.id);
  if (!half) return null;
  const dpr = window.devicePixelRatio || 1;
  const hx = e.x + (half.w + 6 * dpr) / view.scale;
  return distMM({ x: hx, y: e.y }, mm) < hitPx(view) ? e : null;
}

export function hitMotionRotateHandle(p: Planner, view: View, mm: Vec2): MotionSensor | null {
  const id = p.activeMotionId; if (!id) return null;
  const m = p.floor().motionSensors.find(x => x.id === id);
  if (!m || m.fov >= 359.99 || m.locked) return null;
  const dpr = window.devicePixelRatio || 1;
  const rPx = 28 * dpr;
  const t = (m.heading || 0) * Math.PI / 180;
  const hx = m.x + Math.sin(t) * rPx / view.scale;
  const hy = m.y + Math.cos(t) * rPx / view.scale;
  return distMM({ x: hx, y: hy }, mm) < hitPx(view) ? m : null;
}

export function bgEditable(p: Planner): BgImage | null {
  const bg = p.floor().bg;
  return (bg && bg.visible !== false && bg.dataUrl && !bg.locked) ? bg : null;
}

export interface BgCornerHit { sx: number; sy: number; }
export function hitBgCorner(p: Planner, view: View, mm: Vec2): BgCornerHit | null {
  const bg = bgEditable(p); if (!bg) return null;
  const hit = Math.max(80, 12 / Math.max(view.scale, 1e-9));
  const signs: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [sx, sy] of signs) {
    const wp = bgLocalToWorld(bg, sx * bg.w / 2, sy * bg.h / 2);
    if (distMM(mm, wp) < hit) return { sx, sy };
  }
  return null;
}

export function hitBgBody(p: Planner, mm: Vec2): BgImage | null {
  const bg = bgEditable(p); if (!bg) return null;
  const lp = bgWorldToLocal(bg, mm.x, mm.y);
  return (Math.abs(lp.x) <= bg.w / 2 && Math.abs(lp.y) <= bg.h / 2) ? bg : null;
}
