import { snap, snapVertex15, distMM, worldToLocal, localToWorld, FURNITURE_KINDS, furnitureCorners, envScale, ENV_SCALE_MIN, ENV_SCALE_MAX } from './geometry.js';
import { newId } from './storage.js';
import {
  pxToMm, type View,
} from './canvas-render.js';
import {
  hitPx, hitSensor, hitSensorRotateHandle, hitWallVert, hitWall,
  hitFurniture, hitFurnitureCorner, hitFixture,
  hitVertexOrZone, hitObject, hitObjectRadiusHandle,
  hitBgBody, hitBgCorner, bgEditable,
  hitMotionSensor, hitMotionRotateHandle, hitEnvSensor, hitEnvResizeHandle,
  hitDoor, hitDoorEnd, hitWindow, hitWindowEnd,
} from './canvas-hit.js';
import type { Planner } from './planner.js';
import type { Vec2 } from './types.js';

const SENSOR_DEFAULTS = { fov: 120, range: 6000 };
const MOTION_DEFAULTS = { fov: 110, range: 5000 };

// Wall endpoints auto-weld when they land within this of another wall's
// endpoint (and neither wall is locked).
const WALL_SNAP_MM = 250;

type WeldWalls = { walls: { id: string; points: Vec2[]; locked?: boolean }[] };

function closestOnSegment(pt: Vec2, a: Vec2, b: Vec2): Vec2 {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / len2)) : 0;
  return { x: a.x + t * dx, y: a.y + t * dy };
}

// Best weld target for one wall endpoint: another unlocked wall's endpoint
// (corner join) or the nearest point anywhere along its segments
// (T-junction). Corner joins win when both are in range. `selfOpposite`
// lets a wall close onto its own far endpoint (room loops) — its own
// segments are never targets (the adjacent one always matches trivially).
function bestWeldTarget(f: WeldWalls,
                        excludeId: string | undefined,
                        pt: Vec2,
                        selfOpposite: Vec2 | null): { p: Vec2; d: number } | null {
  let bestEnd: { p: Vec2; d: number } | null = null;
  let bestSeg: { p: Vec2; d: number } | null = null;
  for (const w of f.walls) {
    if (w.id === excludeId || w.locked || w.points.length === 0) continue;
    for (const e of [w.points[0], w.points[w.points.length - 1]]) {
      const d = distMM(pt, e);
      if (d < WALL_SNAP_MM && (!bestEnd || d < bestEnd.d)) bestEnd = { p: e, d };
    }
    for (let i = 0; i < w.points.length - 1; i++) {
      const q = closestOnSegment(pt, w.points[i], w.points[i + 1]);
      const d = distMM(pt, q);
      if (d < WALL_SNAP_MM && (!bestSeg || d < bestSeg.d)) bestSeg = { p: q, d };
    }
  }
  if (selfOpposite) {
    const d = distMM(pt, selfOpposite);
    if (d < WALL_SNAP_MM && (!bestEnd || d < bestEnd.d)) bestEnd = { p: selfOpposite, d };
  }
  return bestEnd ?? bestSeg;
}

// Stairs / landings lock edges with each other: after a drop, move, or
// resize, the piece's nearest corner within 250 mm of another stair-family
// piece's corner snaps onto it, so flight → landing → flight compositions
// sit flush without pixel-nudging. Position-only — elevation stays manual.
const STAIR_KINDS = new Set(['stairs', 'stairs_half', 'stair_landing']);

export function snapStairEdges(
  f: { furniture: { id: string; x: number; y: number; w: number; h: number;
                    kind?: string; rotation?: number; locked?: boolean }[] },
  piece: { id: string; x: number; y: number; w: number; h: number;
           kind?: string; rotation?: number; locked?: boolean },
): boolean {
  if (piece.locked || !STAIR_KINDS.has(piece.kind ?? '')) return false;
  const mine = furnitureCorners(piece);
  let best: { d: number; dx: number; dy: number } | null = null;
  for (const other of f.furniture) {
    if (other.id === piece.id || !STAIR_KINDS.has(other.kind ?? '')) continue;
    for (const oc of furnitureCorners(other)) {
      for (const mc of mine) {
        const d = Math.hypot(oc.x - mc.x, oc.y - mc.y);
        if (d < 250 && (!best || d < best.d)) best = { d, dx: oc.x - mc.x, dy: oc.y - mc.y };
      }
    }
  }
  if (!best) return false;
  piece.x = Math.round(piece.x + best.dx);
  piece.y = Math.round(piece.y + best.dy);
  return true;
}

// Remove one vertex from a wall; a wall reduced below 2 points is removed
// entirely. Returns false for locked walls.
export function deleteWallVertex(
  f: { walls: { id: string; points: Vec2[]; locked?: boolean }[] },
  wall: { id: string; points: Vec2[]; locked?: boolean },
  idx: number,
): boolean {
  if (wall.locked || idx < 0 || idx >= wall.points.length) return false;
  wall.points.splice(idx, 1);
  if (wall.points.length < 2) f.walls = f.walls.filter(x => x.id !== wall.id);
  return true;
}

// Doors / windows lock onto the nearest wall: position snaps onto the wall
// axis and rotation aligns to it, picking whichever of the two directions is
// closer to the current rotation (so a door keeps its hinge side). Locked
// walls are still valid snap targets — snapping doesn't modify the wall.
export function snapOpeningToWall(
  f: WeldWalls,
  item: { x: number; y: number; rotation: number },
  maxDist = 500,
): boolean {
  let best: { q: Vec2; angDeg: number; d: number } | null = null;
  for (const w of f.walls) {
    for (let i = 0; i < w.points.length - 1; i++) {
      const A = w.points[i], B = w.points[i + 1];
      const q = closestOnSegment(item, A, B);
      const d = distMM(item, q);
      if (d < maxDist && (!best || d < best.d)) {
        best = { q, angDeg: Math.atan2(-(B.y - A.y), B.x - A.x) * 180 / Math.PI, d };
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

// Weld `wall`'s endpoints onto other unlocked walls — endpoint-to-endpoint
// (corner) or endpoint-to-anywhere-along-a-segment (T-junction), corners
// preferred. translate=true shifts the whole wall by the best
// single-endpoint delta (used after a whole-wall move so the shape isn't
// distorted); otherwise each endpoint welds independently (vertex drag /
// finishing a drawing).
export function connectWallEnds(
  f: WeldWalls,
  wall: { id?: string; points: Vec2[]; locked?: boolean },
  translate = false,
): boolean {
  if (wall.locked || wall.points.length < 2) return false;
  const ends = [0, wall.points.length - 1];
  // A wall with 3+ points may close onto its own far endpoint.
  const selfOppositeFor = (ei: number): Vec2 | null =>
    wall.points.length >= 3 ? wall.points[ei === 0 ? wall.points.length - 1 : 0] : null;
  if (translate) {
    let best: { d: number; dx: number; dy: number } | null = null;
    for (const ei of ends) {
      const pt = wall.points[ei];
      const t = bestWeldTarget(f, wall.id, pt, null);  // no self-weld when translating
      if (t && (!best || t.d < best.d)) best = { d: t.d, dx: t.p.x - pt.x, dy: t.p.y - pt.y };
    }
    if (!best) return false;
    const { dx, dy } = best;
    wall.points = wall.points.map(pt => ({ x: pt.x + dx, y: pt.y + dy }));
    return true;
  }
  let changed = false;
  for (const ei of ends) {
    const pt = wall.points[ei];
    const t = bestWeldTarget(f, wall.id, pt, selfOppositeFor(ei));
    if (t) { wall.points[ei] = { x: t.p.x, y: t.p.y }; changed = true; }
  }
  return changed;
}

export function onCanvasMouseDown(p: Planner, canvas: HTMLCanvasElement, view: View, e: MouseEvent): void {
  if (p.editZone) return;
  const mm = pxToMm(canvas, view, e);
  if (p.tool !== 'select') return;

  // Bg corner — top priority for unlocked bg
  const bgc = hitBgCorner(p, view, mm);
  if (bgc) {
    const bg = bgEditable(p);
    if (!bg) return;
    p.drag = {
      kind: 'bgCorner', sx: bgc.sx, sy: bgc.sy,
      startBg: { x: bg.x, y: bg.y, w: bg.w, h: bg.h, rotation: bg.rotation || 0 },
    };
    canvas.style.cursor = (bgc.sx * bgc.sy > 0) ? 'nwse-resize' : 'nesw-resize';
    e.preventDefault(); return;
  }

  // Motion-sensor rotate handle (only when one is active)
  const mRot = hitMotionRotateHandle(p, view, mm);
  if (mRot) {
    p.drag = { kind: 'motionRotate', id: mRot.id };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  if (hitSensorRotateHandle(p, view, mm)) {
    p.drag = { kind: 'rotate', sensorId: p.store.activeSensorId! };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  const orh = hitObjectRadiusHandle(p, view, mm);
  if (orh) {
    p.drag = { kind: 'objR', oi: orh.oi, startMm: mm, startR: orh.startR };
    canvas.style.cursor = 'ew-resize'; e.preventDefault(); return;
  }
  const oh = hitObject(p, view, mm);
  if (oh) {
    p.drag = { kind: 'obj', oi: oh.oi, startMm: mm, startObj: oh.startObj };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  const vh = hitVertexOrZone(p, view, mm);
  if (vh) {
    p.drag = vh.kind === 'vert'
      ? { kind: 'vert', prefix: vh.prefix, zi: vh.zi, vi: vh.vi, startMm: mm, startVerts: vh.startVerts }
      : { kind: 'zonemove', prefix: vh.prefix, zi: vh.zi, startMm: mm, startVerts: vh.startVerts };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  const wv = hitWallVert(p, view, mm);
  if (wv) {
    p.drag = { kind: 'wallv', wallId: wv.wall.id, idx: wv.idx,
               startMm: mm, startPts: wv.wall.points.map(pt => ({ ...pt })) };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  const fc = hitFurnitureCorner(p, view, mm);
  if (fc) {
    p.drag = { kind: 'furnCorner', idx: fc.idx, anchor: fc.anchor };
    canvas.style.cursor = (fc.sx * fc.sy > 0) ? 'nwse-resize' : 'nesw-resize';
    e.preventDefault(); return;
  }
  const fx = hitFixture(p, mm, Math.max(250, hitPx(view) * 3));
  if (fx) {
    const arr = fx.kind === 'light' ? p.floor().lights : p.floor().switches;
    const item = arr[fx.idx];
    p.drag = { kind: 'fixture', fxKind: fx.kind, idx: fx.idx,
               startMm: mm, start: { x: item.x, y: item.y } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  const fhi = hitFurniture(p, mm);
  if (fhi) {
    p.drag = { kind: 'furnMove', idx: fhi.idx, startMm: mm,
               start: { x: fhi.item.x, y: fhi.item.y } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  // Door endpoint takes priority over door body so the rotate-handle works
  // even when the panel sits on top of it.
  const dEnd = hitDoorEnd(p, view, mm);
  if (dEnd) {
    p.drag = { kind: 'doorRotate', idx: dEnd.idx, startMm: mm,
               start: { rotation: dEnd.door.rotation } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  const dHit = hitDoor(p, view, mm);
  if (dHit) {
    p.drag = { kind: 'doorMove', idx: dHit.idx, startMm: mm,
               start: { x: dHit.door.x, y: dHit.door.y } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  // Windows
  const wEnd = hitWindowEnd(p, view, mm);
  if (wEnd) {
    p.drag = { kind: 'windowRotate', idx: wEnd.idx, startMm: mm,
               start: { rotation: wEnd.win.rotation } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  const wHit = hitWindow(p, view, mm);
  if (wHit) {
    p.drag = { kind: 'windowMove', idx: wHit.idx, startMm: mm,
               start: { x: wHit.win.x, y: wHit.win.y } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  const wh = hitWall(p, mm);
  if (wh) {
    p.drag = { kind: 'wallMove', wallId: wh.id, startMm: mm,
               startPts: wh.points.map(pt => ({ ...pt })) };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  const erh = hitEnvResizeHandle(p, view, mm);
  if (erh) {
    p.drag = { kind: 'envResize', id: erh.id,
               startDist: Math.max(1, distMM(erh, mm)), startScale: envScale(erh) };
    canvas.style.cursor = 'ew-resize'; e.preventDefault(); return;
  }
  const eh = hitEnvSensor(p, view, mm);
  if (eh) {
    if (p.activeEnvId !== eh.id) p.activeEnvId = eh.id;
    p.drag = { kind: 'env', id: eh.id, startMm: mm, start: { x: eh.x, y: eh.y } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const mh = hitMotionSensor(p, view, mm);
  if (mh) {
    if (p.activeMotionId !== mh.id) p.activeMotionId = mh.id;
    p.drag = { kind: 'motion', id: mh.id, startMm: mm, start: { x: mh.x, y: mh.y } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const sh = hitSensor(p, view, mm);
  if (sh) {
    if (p.store.activeSensorId !== sh.id) p.setActiveSensor(sh.id);
    p.drag = { kind: 'sensor', id: sh.id, startMm: mm, start: { x: sh.x, y: sh.y } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  const bgBody = hitBgBody(p, mm);
  if (bgBody) {
    p.drag = { kind: 'bgMove', startMm: mm, start: { x: bgBody.x, y: bgBody.y } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
}

export function onCanvasMouseMove(p: Planner, canvas: HTMLCanvasElement, view: View, e: MouseEvent): void {
  const raw = pxToMm(canvas, view, e);
  // While drawing a wall and at least one vertex is placed, snap the live
  // cursor preview to a 15° increment from the previous vertex so the
  // segment angle matches what gets committed on click.
  let mm = raw;
  if (p.tool === 'wall' && p.drawingWall && p.drawingWall.points.length >= 1) {
    const prev = p.drawingWall.points[p.drawingWall.points.length - 1];
    mm = snapVertex15(prev, null, raw);
  }
  p.cursor = mm;

  if (p.editZone) {
    const sa = p.activeSensor();
    if (sa) {
      const local = worldToLocal(sa, mm.x, mm.y);
      const verts = p.editZone.verts;
      let snapped = local;
      if (verts.length >= 1) {
        const prev = verts[verts.length - 1];
        const first = verts[0];
        const closing = verts.length >= 2 &&
          distMM(local, first) < Math.max(200, 25 / Math.max(view.scale, 1e-9));
        snapped = closing ? snapVertex15(prev, first, local) : snapVertex15(prev, null, local);
      }
      p.editZone.mousePos = snapped;
    }
    return;
  }

  if (p.drag) {
    const f = p.floor();
    const drag = p.drag;
    switch (drag.kind) {
      case 'sensor': {
        const s = f.sensors.find(x => x.id === drag.id);
        if (s && !s.locked) {
          s.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          s.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'motion': {
        const m = f.motionSensors.find(x => x.id === drag.id);
        if (m && !m.locked) {
          m.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          m.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'env': {
        const en = f.envSensors.find(x => x.id === drag.id);
        if (en && !en.locked) {
          en.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          en.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'envResize': {
        const en = f.envSensors.find(x => x.id === drag.id);
        if (en && !en.locked) {
          // Scale follows the handle's distance from the chip center.
          const ratio = distMM(en, mm) / drag.startDist;
          en.scale = Math.max(ENV_SCALE_MIN, Math.min(ENV_SCALE_MAX, drag.startScale * ratio));
        }
        break;
      }
      case 'motionRotate': {
        const m = f.motionSensors.find(x => x.id === drag.id);
        if (m && !m.locked) {
          const ang = Math.atan2(mm.x - m.x, mm.y - m.y);
          const deg = Math.round(ang * 180 / Math.PI);
          m.heading = ((deg % 360) + 360) % 360;
        }
        break;
      }
      case 'bgMove': {
        const bg = f.bg;
        if (bg) {
          bg.x = drag.start.x + (mm.x - drag.startMm.x);
          bg.y = drag.start.y + (mm.y - drag.startMm.y);
        }
        break;
      }
      case 'bgCorner': {
        const bg = f.bg;
        if (bg) {
          const sb = drag.startBg;
          const t = sb.rotation * Math.PI / 180;
          const c = Math.cos(t), si = Math.sin(t);
          const dx = mm.x - sb.x, dy = mm.y - sb.y;
          const lx = dx * c - dy * si, ly = dx * si + dy * c;
          const ax = -drag.sx * sb.w / 2;
          const ay = -drag.sy * sb.h / 2;
          let newW = Math.max(50, Math.abs(lx - ax));
          let newH = Math.max(50, Math.abs(ly - ay));
          if (e.shiftKey) {
            const aspect = sb.w / sb.h;
            if (newW / newH > aspect) newW = newH * aspect; else newH = newW / aspect;
          }
          const cx = ax + drag.sx * newW / 2;
          const cy = ay + drag.sy * newH / 2;
          bg.w = newW; bg.h = newH;
          bg.x = sb.x + cx * c + cy * si;
          bg.y = sb.y - cx * si + cy * c;
        }
        break;
      }
      case 'rotate': {
        const s = f.sensors.find(x => x.id === drag.sensorId);
        if (s && !s.locked) {
          const ang = Math.atan2(mm.x - s.x, mm.y - s.y);
          const deg = Math.round(ang * 180 / Math.PI);
          s.heading = ((deg % 360) + 360) % 360;
        }
        break;
      }
      case 'wallv': {
        const w = f.walls.find(x => x.id === drag.wallId);
        if (w && !w.locked) {
          // Hold 15° increments while editing, same as drawing: an endpoint
          // snaps its one segment's angle (length follows the cursor); a
          // middle vertex intersects both neighbors' snapped rays so BOTH
          // segments stay on-angle.
          const prev = drag.idx > 0 ? w.points[drag.idx - 1] : null;
          const next = drag.idx < w.points.length - 1 ? w.points[drag.idx + 1] : null;
          const sv = snapVertex15(prev, next, mm);
          w.points[drag.idx] = { x: snap(sv.x, 10), y: snap(sv.y, 10) };
        }
        break;
      }
      case 'wallMove': {
        const w = f.walls.find(x => x.id === drag.wallId);
        if (w && !w.locked) {
          const dx = mm.x - drag.startMm.x, dy = mm.y - drag.startMm.y;
          w.points = drag.startPts.map(pt => ({ x: pt.x + dx, y: pt.y + dy }));
        }
        break;
      }
      case 'furnMove': {
        const item = f.furniture[drag.idx];
        if (item && !item.locked) {
          const dx = mm.x - drag.startMm.x, dy = mm.y - drag.startMm.y;
          item.x = drag.start.x + dx; item.y = drag.start.y + dy;
        }
        break;
      }
      case 'doorMove': {
        const door = f.doors[drag.idx];
        if (door && !door.locked) {
          door.x = drag.start.x + (mm.x - drag.startMm.x);
          door.y = drag.start.y + (mm.y - drag.startMm.y);
        }
        break;
      }
      case 'doorRotate': {
        const door = f.doors[drag.idx];
        if (door && !door.locked) {
          // Screen-CW degrees: world endpoint at hinge + (cos θ, -sin θ).
          // Inverse: θ = atan2(-(my - hy), mx - hx), in degrees, snapped 15°.
          const ang = Math.atan2(-(mm.y - door.y), mm.x - door.x);
          const deg = Math.round(ang * 180 / Math.PI / 15) * 15;
          door.rotation = ((deg % 360) + 360) % 360;
        }
        break;
      }
      case 'windowMove': {
        const win = f.windows[drag.idx];
        if (win && !win.locked) {
          win.x = drag.start.x + (mm.x - drag.startMm.x);
          win.y = drag.start.y + (mm.y - drag.startMm.y);
        }
        break;
      }
      case 'windowRotate': {
        const win = f.windows[drag.idx];
        if (win && !win.locked) {
          // Rotate around window center (x, y) so the dragged endpoint
          // follows the cursor. Snap 15°.
          const ang = Math.atan2(-(mm.y - win.y), mm.x - win.x);
          const deg = Math.round(ang * 180 / Math.PI / 15) * 15;
          win.rotation = ((deg % 360) + 360) % 360;
        }
        break;
      }
      case 'furnCorner': {
        const item = f.furniture[drag.idx];
        if (item && !item.locked) {
          const a = drag.anchor;
          // Convert the world delta from anchor → cursor into piece-local
          // (rotation-aware). The local extents become the new width/depth;
          // center is the world midpoint of anchor and cursor regardless of
          // rotation (midpoint of two opposite rectangle corners is the
          // center).
          const rotR = (item.rotation || 0) * Math.PI / 180;
          const c = Math.cos(rotR), s = Math.sin(rotR);
          const dxW = mm.x - a.x, dyW = mm.y - a.y;
          const lx = dxW * c - dyW * s;
          const ly = dxW * s + dyW * c;
          item.w = Math.max(50, Math.abs(lx));
          item.h = Math.max(50, Math.abs(ly));
          item.x = (mm.x + a.x) / 2;
          item.y = (mm.y + a.y) / 2;
        }
        break;
      }
      case 'fixture': {
        const arr = drag.fxKind === 'light' ? f.lights : f.switches;
        const it = arr[drag.idx];
        if (it && !it.locked) {
          const dx = mm.x - drag.startMm.x, dy = mm.y - drag.startMm.y;
          it.x = drag.start.x + dx; it.y = drag.start.y + dy;
        }
        break;
      }
      case 'obj': {
        const sa = p.activeSensor();
        if (sa) {
          const o = p.objectsBy[sa.id][drag.oi];
          const localStart = drag.startObj;
          const dWorldX = mm.x - drag.startMm.x;
          const dWorldY = mm.y - drag.startMm.y;
          const t = (sa.heading || 0) * Math.PI / 180;
          const c = Math.cos(t), si = Math.sin(t);
          const dxL = dWorldX * c - dWorldY * si;
          const dyL = dWorldX * si + dWorldY * c;
          o.x = localStart.x + dxL;
          o.y = localStart.y + dyL;
        }
        break;
      }
      case 'objR': {
        const sa = p.activeSensor();
        if (sa) {
          const o = p.objectsBy[sa.id][drag.oi];
          const dWorldX = mm.x - drag.startMm.x;
          const dWorldY = mm.y - drag.startMm.y;
          const t = (sa.heading || 0) * Math.PI / 180;
          const dLocalX = dWorldX * Math.cos(t) - dWorldY * Math.sin(t);
          o.radius = Math.max(50, Math.round((drag.startR + dLocalX) / 10) * 10);
        }
        break;
      }
      case 'vert': {
        const sa = p.activeSensor();
        if (sa) {
          const arr = drag.prefix === 'iz' ? p.zonesBy[sa.id].inclusion : p.zonesBy[sa.id].filter;
          const local = worldToLocal(sa, mm.x, mm.y);
          const sv = drag.startVerts;
          const n = sv.length;
          const prev = n > 1 ? sv[(drag.vi - 1 + n) % n] : null;
          const next = n > 1 && (drag.vi + 1) % n !== (drag.vi - 1 + n) % n
                        ? sv[(drag.vi + 1) % n] : null;
          arr[drag.zi].vertices[drag.vi] = snapVertex15(prev, next, local);
        }
        break;
      }
      case 'zonemove': {
        const sa = p.activeSensor();
        if (sa) {
          const arr = drag.prefix === 'iz' ? p.zonesBy[sa.id].inclusion : p.zonesBy[sa.id].filter;
          const dWorldX = mm.x - drag.startMm.x;
          const dWorldY = mm.y - drag.startMm.y;
          const t = (sa.heading || 0) * Math.PI / 180;
          const c = Math.cos(t), si = Math.sin(t);
          const dxL = dWorldX * c - dWorldY * si;
          const dyL = dWorldX * si + dWorldY * c;
          arr[drag.zi].vertices = drag.startVerts.map(v => ({ x: v.x + dxL, y: v.y + dyL }));
        }
        break;
      }
    }
    return;
  }

  // Cursor hint
  if (p.tool === 'select') {
    const bgc = hitBgCorner(p, view, mm);
    if (bgc) canvas.style.cursor = (bgc.sx * bgc.sy > 0) ? 'nwse-resize' : 'nesw-resize';
    else if (hitMotionRotateHandle(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitEnvResizeHandle(p, view, mm)) canvas.style.cursor = 'ew-resize';
    else if (hitEnvSensor(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitMotionSensor(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitSensorRotateHandle(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitObjectRadiusHandle(p, view, mm)) canvas.style.cursor = 'ew-resize';
    else if (hitObject(p, view, mm) || hitVertexOrZone(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitWallVert(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitFurnitureCorner(p, view, mm)) canvas.style.cursor = 'nwse-resize';
    else if (hitDoorEnd(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitDoor(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitWindowEnd(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitWindow(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitFixture(p, mm, Math.max(250, hitPx(view) * 3))) canvas.style.cursor = 'grab';
    else if (hitFurniture(p, mm) || hitWall(p, mm) || hitSensor(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitBgBody(p, mm)) canvas.style.cursor = 'grab';
    else canvas.style.cursor = 'default';
  } else { canvas.style.cursor = 'crosshair'; }
}

export function onCanvasMouseUp(p: Planner, canvas: HTMLCanvasElement): void {
  if (!p.drag) return;
  const f = p.floor();
  const sa = p.activeSensor();
  const drag = p.drag;
  p.drag = null;
  p.dragJustEnded = true;
  canvas.style.cursor = 'default';

  if (drag.kind === 'sensor') {
    const s = f.sensors.find(x => x.id === drag.id);
    if (s) { s.x = snap(s.x, 10); s.y = snap(s.y, 10); }
    p.save();
  } else if (drag.kind === 'motion') {
    const m = f.motionSensors.find(x => x.id === drag.id);
    if (m) { m.x = snap(m.x, 10); m.y = snap(m.y, 10); }
    p.save();
  } else if (drag.kind === 'env') {
    const en = f.envSensors.find(x => x.id === drag.id);
    if (en) { en.x = snap(en.x, 10); en.y = snap(en.y, 10); }
    p.save();
  } else if (drag.kind === 'envResize') {
    p.save();
  } else if (drag.kind === 'motionRotate') {
    p.save();
  } else if (drag.kind === 'rotate') {
    p.save();
  } else if (drag.kind === 'wallv') {
    const w = f.walls.find(x => x.id === drag.wallId);
    if (w) {
      w.points = w.points.map(pt => ({ x: snap(pt.x, 10), y: snap(pt.y, 10) }));
      connectWallEnds(f, w);
    }
    p.save();
  } else if (drag.kind === 'fixture') {
    // Differentiate click (toggle) from drag (move): if the fixture barely
    // moved, restore its original position and trigger the toggle action.
    const arr = drag.fxKind === 'light' ? f.lights : f.switches;
    const it = arr[drag.idx];
    if (it) {
      const moved = Math.hypot(it.x - drag.start.x, it.y - drag.start.y);
      if (moved < 30) {
        // Treat as click — restore exact start position; toggle if bound.
        it.x = drag.start.x; it.y = drag.start.y;
        p.toggleEntity(it.entity_id);
      } else {
        p.save();
      }
    }
  } else if (drag.kind === 'wallMove') {
    const w = f.walls.find(x => x.id === drag.wallId);
    if (w) connectWallEnds(f, w, true);
    p.save();
  } else if (drag.kind === 'furnMove' || drag.kind === 'furnCorner') {
    const piece = f.furniture[drag.idx];
    if (piece) snapStairEdges(f, piece);
    p.save();
  } else if (drag.kind === 'bgMove' || drag.kind === 'bgCorner') {
    p.save();
  } else if (drag.kind === 'doorMove') {
    const door = f.doors[drag.idx];
    if (door) {
      // Click-vs-drag: tiny movement on a bound door toggles its entity.
      const moved = Math.hypot(door.x - drag.start.x, door.y - drag.start.y);
      if (moved < 30 && door.entity_id) {
        door.x = drag.start.x; door.y = drag.start.y;
        p.toggleEntity(door.entity_id);
      } else {
        door.x = snap(door.x, 10); door.y = snap(door.y, 10);
        snapOpeningToWall(f, door);
        p.save();
      }
    }
  } else if (drag.kind === 'doorRotate') {
    p.save();
  } else if (drag.kind === 'windowMove') {
    const win = f.windows[drag.idx];
    if (win) {
      const moved = Math.hypot(win.x - drag.start.x, win.y - drag.start.y);
      if (moved < 30 && win.entity_id) {
        win.x = drag.start.x; win.y = drag.start.y;
        p.toggleEntity(win.entity_id);
      } else {
        win.x = snap(win.x, 10); win.y = snap(win.y, 10);
        snapOpeningToWall(f, win);
        p.save();
      }
    }
  } else if (drag.kind === 'windowRotate') {
    p.save();
  } else if (drag.kind === 'obj' && sa) {
    const o = p.objectsBy[sa.id][drag.oi];
    o.x = Math.round(o.x / 10) * 10; o.y = Math.round(o.y / 10) * 10;
    p.fenceObjectWrite(sa.id, drag.oi);
    p.saveObjectField(sa, drag.oi, 'x', o.x);
    p.saveObjectField(sa, drag.oi, 'y', o.y);
  } else if (drag.kind === 'objR' && sa) {
    const o = p.objectsBy[sa.id][drag.oi];
    p.saveObjectField(sa, drag.oi, 'radius', o.radius);
  } else if ((drag.kind === 'vert' || drag.kind === 'zonemove') && sa) {
    const arr = drag.prefix === 'iz' ? p.zonesBy[sa.id].inclusion : p.zonesBy[sa.id].filter;
    arr[drag.zi].vertices = arr[drag.zi].vertices.map(v => ({
      x: Math.round(v.x / 10) * 10, y: Math.round(v.y / 10) * 10,
    }));
    p.saveAllZoneVertices(sa, drag.prefix, drag.zi, arr[drag.zi].vertices);
  }
  p.emitConfig();
}

export function onCanvasClick(p: Planner, canvas: HTMLCanvasElement, view: View, e: MouseEvent): void {
  if (p.dragJustEnded) { p.dragJustEnded = false; return; }
  const mm = pxToMm(canvas, view, e);
  const f = p.floor();

  if (p.editZone) {
    const sa = p.activeSensor(); if (!sa) return;
    const local = worldToLocal(sa, mm.x, mm.y);
    const verts = p.editZone.verts;
    let nx = local.x, ny = local.y;
    if (verts.length >= 1) {
      const prev = verts[verts.length - 1];
      const first = verts[0];
      const closing = verts.length >= 2 &&
        distMM(local, first) < Math.max(200, 25 / Math.max(view.scale, 1e-9));
      const snapped = closing ? snapVertex15(prev, first, local) : snapVertex15(prev, null, local);
      nx = snapped.x; ny = snapped.y;
    }
    verts.push({ x: Math.round(nx), y: Math.round(ny) });
    p.emitConfig();
    return;
  }

  if (p.tool === 'sensor') {
    const id = newId('s');
    f.sensors.push({
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      heading: 0, fov: SENSOR_DEFAULTS.fov, range: SENSOR_DEFAULTS.range,
      label: `Sensor ${f.sensors.length + 1}`, deviceSlug: null,
    });
    p.store.activeSensorId = id;
    p.ensureLiveState(id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'motion') {
    const id = newId('m');
    f.motionSensors.push({
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      heading: 0, fov: MOTION_DEFAULTS.fov, range: MOTION_DEFAULTS.range,
      label: `Motion ${f.motionSensors.length + 1}`, entity_id: null,
    });
    p.activeMotionId = id;
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'env') {
    const id = newId('e');
    f.envSensors.push({
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      label: `Env ${f.envSensors.length + 1}`, entity_id: null,
    });
    p.activeEnvId = id;
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'wall') {
    // First vertex: free placement. Subsequent vertices snap to a 15°
    // increment from the previous vertex via snapVertex15 (preserves cursor
    // distance along the snapped ray).
    let v: Vec2;
    if (!p.drawingWall || p.drawingWall.points.length === 0) {
      v = { x: snap(mm.x, 10), y: snap(mm.y, 10) };
    } else {
      const prev = p.drawingWall.points[p.drawingWall.points.length - 1];
      const snapped = snapVertex15(prev, null, mm);
      v = { x: snap(snapped.x, 10), y: snap(snapped.y, 10) };
    }
    if (!p.drawingWall) p.drawingWall = { points: [v] };
    else p.drawingWall.points.push(v);
    p.emitConfig();
    return;
  }
  if (p.tool === 'furniture') {
    const kind = p.pendingFurnitureKind;
    const def = FURNITURE_KINDS[kind];
    const piece = {
      id: newId('fu'),
      x: snap(mm.x, 10), y: snap(mm.y, 10),
      w: def.w, h: def.h, label: '', kind,
    };
    f.furniture.push(piece);
    snapStairEdges(f, piece);
    p.save(); p.setTool('select'); p.emitConfig(); return;
  }
  if (p.tool === 'light') {
    f.lights.push({ id: newId('lt'), x: snap(mm.x, 10), y: snap(mm.y, 10), entity_id: null, label: '' });
    p.save(); p.setTool('select'); p.emitConfig(); return;
  }
  if (p.tool === 'switch') {
    f.switches.push({ id: newId('sw'), x: snap(mm.x, 10), y: snap(mm.y, 10), entity_id: null, label: '' });
    p.save(); p.setTool('select'); p.emitConfig(); return;
  }
  if (p.tool === 'door') {
    const d = {
      id: newId('dr'),
      x: snap(mm.x, 10), y: snap(mm.y, 10),
      w: 800, rotation: 0, entity_id: null, label: '',
    };
    snapOpeningToWall(f, d);
    f.doors.push(d);
    p.save(); p.setTool('select'); p.emitConfig(); return;
  }
  if (p.tool === 'window') {
    const wn = {
      id: newId('wn'),
      x: snap(mm.x, 10), y: snap(mm.y, 10),
      w: 1000, rotation: 0, entity_id: null, label: '',
    };
    snapOpeningToWall(f, wn);
    f.windows.push(wn);
    p.save(); p.setTool('select'); p.emitConfig(); return;
  }
  if (p.tool === 'delete') {
    const ehit = hitEnvSensor(p, view, mm);
    if (ehit) {
      if (ehit.locked) return;
      f.envSensors = f.envSensors.filter(x => x.id !== ehit.id);
      if (p.activeEnvId === ehit.id) p.activeEnvId = null;
      p.save(); p.emitConfig(); return;
    }
    const mh = hitMotionSensor(p, view, mm);
    if (mh) {
      if (mh.locked) return;
      f.motionSensors = f.motionSensors.filter(x => x.id !== mh.id);
      if (p.activeMotionId === mh.id) p.activeMotionId = null;
      p.save(); p.emitConfig(); return;
    }
    const sh = hitSensor(p, view, mm);
    if (sh) {
      if (sh.locked) return;
      f.sensors = f.sensors.filter(x => x.id !== sh.id);
      if (p.store.activeSensorId === sh.id) p.store.activeSensorId = null;
      p.save(); p.emitConfig(); return;
    }
    const fx = hitFixture(p, mm, 300);
    if (fx) {
      const arr = fx.kind === 'light' ? f.lights : f.switches;
      if (arr[fx.idx]?.locked) return;
      arr.splice(fx.idx, 1);
      p.save(); p.emitConfig(); return;
    }
    const fhi = hitFurniture(p, mm);
    if (fhi) {
      if (fhi.item.locked) return;
      f.furniture.splice(fhi.idx, 1);
      p.save(); p.emitConfig(); return;
    }
    const dHit = hitDoor(p, view, mm);
    if (dHit) {
      if (dHit.door.locked) return;
      f.doors.splice(dHit.idx, 1);
      p.save(); p.emitConfig(); return;
    }
    const winHit = hitWindow(p, view, mm);
    if (winHit) {
      if (winHit.win.locked) return;
      f.windows.splice(winHit.idx, 1);
      p.save(); p.emitConfig(); return;
    }
    const wvHit = hitWallVert(p, view, mm);
    if (wvHit) {
      if (deleteWallVertex(f, wvHit.wall, wvHit.idx)) { p.save(); p.emitConfig(); }
      return;
    }
    const wh = hitWall(p, mm);
    if (wh) {
      if (wh.locked) return;
      f.walls = f.walls.filter(x => x.id !== wh.id);
      p.save(); p.emitConfig(); return;
    }
  }
  if (p.tool === 'select') {
    // Fixture toggle is handled in mouseup (small-movement = click). The
    // click event itself is suppressed by `dragJustEnded`. So here we just
    // handle the empty-space deselect.
    if (!hitSensor(p, view, mm) && !hitVertexOrZone(p, view, mm) && !hitObject(p, view, mm) &&
        !hitFixture(p, mm, Math.max(250, 18 / Math.max(view.scale, 1e-9)))) {
      const sa = p.activeSensor();
      if (sa) {
        let changed = false;
        if (p.editObject[sa.id] >= 0) { p.editObject[sa.id] = -1; changed = true; }
        if (p.izExpanded[sa.id]?.size > 0) { p.izExpanded[sa.id].clear(); changed = true; }
        if (p.fzExpanded[sa.id]?.size > 0) { p.fzExpanded[sa.id].clear(); changed = true; }
        if (changed) p.emitConfig();
      }
    }
  }
}

export function onCanvasDblClick(p: Planner, canvas: HTMLCanvasElement, view: View, e: MouseEvent): void {
  const mm = pxToMm(canvas, view, e);
  if (p.editZone) { finishZoneEdit(p); return; }
  if (p.tool === 'wall' && p.drawingWall && p.drawingWall.points.length >= 2) {
    p.drawingWall.id = newId('w');
    const fl = p.floor();
    fl.walls.push({ ...(p.drawingWall as { id: string; points: Vec2[] }), kind: p.pendingWallKind });
    connectWallEnds(fl, fl.walls[fl.walls.length - 1]);
    p.drawingWall = null;
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  // Env sensor: dblclick opens the entity picker (bind or rebind — env
  // fixtures have no toggle action, so the picker is the natural default).
  const envHit = hitEnvSensor(p, view, mm);
  if (envHit) {
    canvas.dispatchEvent(new CustomEvent('open-entity-picker', {
      bubbles: true, composed: true,
      detail: {
        domain: 'sensor',
        onPick: (id: string) => {
          envHit.entity_id = id;
          p.save(); p.emitConfig();
        },
      },
    }));
    return;
  }
  const fx = hitFixture(p, mm, Math.max(250, 18 / Math.max(view.scale, 1e-9)));
  if (fx) {
    const arr = fx.kind === 'light' ? p.floor().lights : p.floor().switches;
    const it = arr[fx.idx];
    if (!it) {
      // ignore
    } else if (p.isLightEntity(it.entity_id)) {
      // Any fixture (light *or* switch) bound to a light.* entity opens the
      // color/brightness/temperature config on dblclick.
      canvas.dispatchEvent(new CustomEvent('open-light-config', {
        bubbles: true, composed: true, detail: { entityId: it.entity_id },
      }));
      return;
    } else if (!it.entity_id) {
      // Unbound: dbl-click opens entity picker so the user can bind it.
      canvas.dispatchEvent(new CustomEvent('open-entity-picker', {
        bubbles: true, composed: true,
        detail: {
          domain: fx.kind,
          onPick: (id: string) => {
            it.entity_id = id;
            p.save(); p.emitConfig();
          },
        },
      }));
      return;
    }
  }
  const sa = p.activeSensor();
  if (sa) {
    const oh = hitObject(p, view, mm);
    if (oh) {
      p.editObject[sa.id] = (p.editObject[sa.id] === oh.oi) ? -1 : oh.oi;
      p.emitConfig();
      return;
    }
    const wv = hitVertexOrZone(p, view, mm);
    if (wv) {
      const expanded = wv.prefix === 'iz' ? p.izExpanded[sa.id] : p.fzExpanded[sa.id];
      if (expanded.has(wv.zi)) expanded.delete(wv.zi); else expanded.add(wv.zi);
      p.emitConfig();
      return;
    }
  }
  // Select mode: double-click a wall vertex to remove it (delete tool's
  // vertex click does the same). A wall left with <2 points goes entirely.
  if (p.tool === 'select') {
    const wvd = hitWallVert(p, view, mm);
    if (wvd) {
      const fl = p.floor();
      if (deleteWallVertex(fl, wvd.wall, wvd.idx)) { p.save(); p.emitConfig(); }
      return;
    }
    // Double-click a wall BODY to cycle its kind: full → half → railing →
    // invisible → full. (Wall kinds have no editor panel; this plus the
    // new-wall kind picker in the tools area covers them.)
    const wb = hitWall(p, mm);
    if (wb && !wb.locked) {
      const order: import('./types.js').WallKind[] = ['full', 'half', 'railing', 'invisible'];
      const cur = order.indexOf((wb.kind ?? 'full'));
      wb.kind = order[(cur + 1) % order.length];
      p.save(); p.emitConfig();
      return;
    }
  }
}

// Zone-edit helpers
export function startZoneEdit(p: Planner, sensorId: string, prefix: 'iz' | 'fz', zi: number): void {
  const arr = prefix === 'iz' ? p.zonesBy[sensorId].inclusion : p.zonesBy[sensorId].filter;
  p.editZone = { sensorId, prefix, zi, verts: [...arr[zi].vertices], mousePos: null };
  p.setView('2d');
  p.emitConfig();
}

export function finishZoneEdit(p: Planner): void {
  if (!p.editZone) return;
  const { sensorId, prefix, zi, verts } = p.editZone;
  const s = p.floor().sensors.find(x => x.id === sensorId);
  if (!s) { cancelZoneEdit(p); return; }
  if (verts.length >= 3) {
    const n = verts.length;
    const snapped = snapVertex15(verts[n - 2], verts[0], verts[n - 1]);
    verts[n - 1] = { x: Math.round(snapped.x), y: Math.round(snapped.y) };
  }
  p.editZone = null;
  p.saveAllZoneVertices(s, prefix, zi, verts);
}

export function cancelZoneEdit(p: Planner): void {
  p.editZone = null;
  p.emitConfig();
}
