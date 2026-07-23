import { snap, snapVertex15, distMM, worldToLocal, localToWorld, FURNITURE_KINDS, furnitureCorners, furnitureLocalToWorld, furnitureWorldToLocal, resolveFurnitureDef, resolveFurnitureWallCollision, resolveSeatTableCollision, seatBelongsToTable, snapStepLightToSurface, snapFireplaceToWall, snapFloodlightToWall, snapExhaustToWall, snapSwitchToWall, snapAlarmToWall, snapCalendarToWall, snapThermostatToWall, snapPlugToWall, snapInfoCardToWall, snapActionButtonToWall, isBinKind, isSinkKind, defaultFurnitureElevation, nearestAlign, envScale, ENV_SCALE_MIN, ENV_SCALE_MAX, GRID_MM, floorContentBbox, resolveFloorEdgeDrag } from './geometry.js';
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
  hitBleProxy, hitAlarmPanel, hitCalendarPanel, hitThermostat, hitSafetySensor, hitAlertBeacon, hitRobot,
  hitCamera, hitCameraRotateHandle, hitProjector, hitValve, hitSprinklerZone, hitFlagpole, hitPlug, hitInfoCard, hitActionButton, hitPresenceZone, hitPresenceZoneVertex,
  hitGroundArea, hitGroundAreaVertex, hitPathVertex,
  hitPool, hitPoolVertex,
  hitVacuumSegment,
  hitVoidArea, hitVoidAreaVertex,
  hitRulerEnd, hitRulerBody,
  hitDoor, hitDoorEnd, hitDoorLock, hitWindow, hitWindowEnd, hitFloorEdge,
} from './canvas-hit.js';
import type { Planner, Drag } from './planner.js';
import { NEW_ROOM, NEW_LANDMARK } from './planner.js';
import type { Vec2, Furniture, ObjectRecipe, Light, WindowKind, RulerEnd } from './types.js';

// Drag kinds that move a single placeable and therefore get alignment guides
// (Feature C). Wall vertices / doors / windows / zones are excluded.
const ALIGN_MOVE_KINDS = new Set(['sensor', 'motion', 'env', 'ble', 'safety', 'alert', 'robot', 'camera', 'projector', 'fixture', 'furnMove']);

// Peer-center candidates for alignment, snapshotted once at drag start. Same
// category only: lights + switches share one "fixtures" pool; furniture aligns
// with furniture; each sensor kind with its own kind. The dragged item is
// excluded.
function buildAlignCandidates(p: Planner, drag: Drag): { x: number; y: number }[] {
  const f = p.floor();
  const out: { x: number; y: number }[] = [];
  const add = (o: { x: number; y: number }) => out.push({ x: o.x, y: o.y });
  switch (drag.kind) {
    case 'fixture': {
      const draggedId = (drag.fxKind === 'light' ? f.lights : f.switches)[drag.idx]?.id;
      for (const l of f.lights) if (!(drag.fxKind === 'light' && l.id === draggedId)) add(l);
      for (const s of f.switches) if (!(drag.fxKind === 'switch' && s.id === draggedId)) add(s);
      break;
    }
    case 'furnMove': {
      const id = f.furniture[drag.idx]?.id;
      for (const o of f.furniture) if (o.id !== id) add(o);
      break;
    }
    case 'sensor': for (const o of f.sensors) if (o.id !== drag.id) add(o); break;
    case 'motion': for (const o of f.motionSensors) if (o.id !== drag.id) add(o); break;
    case 'env': for (const o of f.envSensors) if (o.id !== drag.id) add(o); break;
    case 'ble': for (const o of (f.bleProxies ?? [])) if (o.id !== drag.id) add(o); break;
    case 'safety': for (const o of (f.safetySensors ?? [])) if (o.id !== drag.id) add(o); break;
    case 'alert': for (const o of (f.alertBeacons ?? [])) if (o.id !== drag.id) add(o); break;
    case 'robot': for (const o of (f.robots ?? [])) if (o.id !== drag.id) add(o); break;
    case 'camera': for (const o of (f.cameras ?? [])) if (o.id !== drag.id) add(o); break;
    case 'projector': for (const o of (f.projectors ?? [])) if (o.id !== drag.id) add(o); break;
    case 'info': for (const o of (f.infoCards ?? [])) if (o.id !== drag.id) add(o); break;
    case 'action': for (const o of (f.actionButtons ?? [])) if (o.id !== drag.id) add(o); break;
  }
  return out;
}

// The (unlocked) item a move-drag is currently moving, or null. Returned by
// reference so alignment can nudge its x / y in place.
function draggedMoveItem(f: ReturnType<Planner['floor']>, drag: Drag)
    : { x: number; y: number; locked?: boolean } | null {
  let it: { x: number; y: number; locked?: boolean } | undefined;
  switch (drag.kind) {
    case 'fixture': it = (drag.fxKind === 'light' ? f.lights : f.switches)[drag.idx]; break;
    case 'furnMove': it = f.furniture[drag.idx]; break;
    case 'sensor': it = f.sensors.find(x => x.id === drag.id); break;
    case 'motion': it = f.motionSensors.find(x => x.id === drag.id); break;
    case 'env': it = f.envSensors.find(x => x.id === drag.id); break;
    case 'ble': it = (f.bleProxies ?? []).find(x => x.id === drag.id); break;
    case 'safety': it = (f.safetySensors ?? []).find(x => x.id === drag.id); break;
    case 'alert': it = (f.alertBeacons ?? []).find(x => x.id === drag.id); break;
    case 'robot': it = (f.robots ?? []).find(x => x.id === drag.id); break;
    case 'camera': it = (f.cameras ?? []).find(x => x.id === drag.id); break;
    case 'projector': it = (f.projectors ?? []).find(x => x.id === drag.id); break;
    case 'info': it = (f.infoCards ?? []).find(x => x.id === drag.id); break;
    case 'action': it = (f.actionButtons ?? []).find(x => x.id === drag.id); break;
  }
  return it && !it.locked ? it : null;
}

// Snap the dragged item's center to a peer center on X / Y independently (8 px
// tolerance in mm) and record the active guides. Takes precedence over grid
// intent — applied after the per-kind move.
function applyAlignSnap(p: Planner, item: { x: number; y: number }, scale: number): void {
  const tolMm = 8 / Math.max(scale, 1e-9);
  const bx = nearestAlign(item.x, p.alignCandidates.map(c => c.x), tolMm);
  const by = nearestAlign(item.y, p.alignCandidates.map(c => c.y), tolMm);
  if (bx !== null) { item.x = bx; p.alignGuides.push({ axis: 'x', mm: bx }); }
  if (by !== null) { item.y = by; p.alignGuides.push({ axis: 'y', mm: by }); }
}

// Auto-snap a mountable piece (coffee maker, toaster, …) onto a counter-height
// `surface` piece it's dropped/dragged over: its center testing inside the
// host footprint raises it to the host's top (`mountOnId` is bookkeeping only —
// NOT live parenting; moving the host re-snaps on the next drag). Leaving every
// surface clears a prior mount back to the floor.
function snapFurnitureToSurface(f: { furniture: Furniture[] }, piece: Furniture,
                                customObjects?: ObjectRecipe[]): void {
  if (!resolveFurnitureDef(piece, customObjects).mountable) return;
  for (const host of f.furniture) {
    if (host.id === piece.id) continue;
    if (!resolveFurnitureDef(host, customObjects).surface) continue;
    const l = furnitureWorldToLocal(host.rotation, piece.x - host.x, piece.y - host.y);
    if (Math.abs(l.x) <= host.w / 2 && Math.abs(l.y) <= host.h / 2) {
      piece.elevation = resolveFurnitureDef(host, customObjects).ht;
      piece.mountOnId = host.id;
      return;
    }
  }
  if (piece.mountOnId) { piece.mountOnId = null; piece.elevation = 0; }
}

// Reverse of `resolveSeatTableCollision`: when a table/desk finishes a MOVE
// drag, carry the chairs that were tucked to its OLD position along by the same
// delta so a dining set moves as a unit. Host predicate matches the seat-resolve
// (a def whose `activity` is 'eat_at_table' | 'work_at_desk' — tables/desks/
// picnic tables, NOT counters/islands). Chair predicate matches the forward path
// (seat-bearing def). Locked chairs stay put. Release-time only. `oldPos` is the
// table's position at drag start; the table's CURRENT x/y is its settled spot.
function carryTuckedSeatsWithTable(f: { furniture: Furniture[] }, table: Furniture,
                                   oldPos: { x: number; y: number },
                                   customObjects?: ObjectRecipe[]): void {
  const act = resolveFurnitureDef(table, customObjects).activity;
  if (act !== 'eat_at_table' && act !== 'work_at_desk') return;
  const dx = table.x - oldPos.x, dy = table.y - oldPos.y;
  if (dx === 0 && dy === 0) return;
  for (const chair of f.furniture) {
    if (chair.id === table.id || chair.locked) continue;
    if (!resolveFurnitureDef(chair, customObjects).seat) continue;
    // Was this seat tucked to the table's OLD position?
    if (!seatBelongsToTable(oldPos.x, oldPos.y, table.rotation, table.w, table.h,
                            chair.x, chair.y)) continue;
    chair.x += dx; chair.y += dy;
    // Re-settle against the table's new position (keeps the tuck clearance clean).
    resolveSeatTableCollision(chair, f.furniture, customObjects);
  }
}

const SENSOR_DEFAULTS = { fov: 120, range: 6000 };

// Zone polys / object halos are only clickable while the zones layer is
// visible — invisible geometry must never capture input (an invisible zone
// edge over a sensor body swallowed the sensor's drag).
function zonesInteractive(p: Planner): boolean {
  return p.store.layers2d?.zones !== false;
}
// Ground areas are only select/vertex-drag interactive while the ground layer
// is visible — a hidden ground layer must never capture input (same rule as zones).
function groundInteractive(p: Planner): boolean {
  return p.store.layers2d?.ground !== false;
}
// Rulers are only endpoint-drag / body-select interactive while the dimensions
// layer is visible (absent = on) — a hidden overlay never captures input.
function dimsInteractive(p: Planner): boolean {
  return p.store.layers2d?.dimensions !== false;
}
// Resolve the ruler END kind for a placement click: a wall body → wall anchor,
// else a furniture body → furniture anchor, else a grid-snapped free point.
function rulerEndAt(p: Planner, mm: Vec2): RulerEnd {
  const wh = hitWall(p, mm);
  if (wh) return { kind: 'wall', wallId: wh.id };
  const fh = hitFurniture(p, mm);
  if (fh) return { kind: 'furniture', furnitureId: fh.item.id };
  return { kind: 'point', x: snap(mm.x, 10), y: snap(mm.y, 10) };
}
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

// Best weld target for one wall endpoint: any other wall's endpoint (corner
// join) or the nearest point anywhere along its segments (T-junction). Corner
// joins win when both are in range. `selfOpposite` lets a wall close onto its
// own far endpoint (room loops) — its own segments are never targets (the
// adjacent one always matches trivially). LOCKED walls stay valid TARGETS: the
// welding wall snaps ONTO them without mutating them, so a user who locks
// structural walls can still weld room-divider chords onto them. (Locked walls
// can't be weld SOURCES — that guard lives in the caller's drag/move flow.)
function bestWeldTarget(f: WeldWalls,
                        excludeId: string | undefined,
                        pt: Vec2,
                        selfOpposite: Vec2 | null): { p: Vec2; d: number } | null {
  let bestEnd: { p: Vec2; d: number } | null = null;
  let bestSeg: { p: Vec2; d: number } | null = null;
  for (const w of f.walls) {
    if (w.id === excludeId || w.points.length === 0) continue;
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

// Stairs / landings lock edges with each other after a drop, whole-piece
// move, or resize (no corner-handle dragging needed):
//   1. Corner snap — a corner within 250 mm of another stair piece's corner
//      pulls exactly onto it (square compositions).
//   2. Parallel-edge snap — otherwise, an edge near-parallel (≤6°) to
//      another stair piece's edge with ≥150 mm of overlap closes just the
//      perpendicular gap, preserving your placement ALONG the edge — so a
//      flight can meet a wider landing mid-edge.
// Position-only — elevation stays manual. Locked pieces never move.
const STAIR_KINDS = new Set(['stairs', 'stairs_half', 'stair_landing']);

type StairPiece = { id: string; x: number; y: number; w: number; h: number;
                    kind?: string; rotation?: number; locked?: boolean };

function perimeterCorners(p: StairPiece): { x: number; y: number }[] {
  const cs: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  return cs.map(([sx, sy]) => {
    const l = furnitureLocalToWorld(p.rotation, sx * p.w / 2, sy * p.h / 2);
    return { x: p.x + l.x, y: p.y + l.y };
  });
}

export function snapStairEdges(
  f: { furniture: StairPiece[] },
  piece: StairPiece,
): boolean {
  if (piece.locked || !STAIR_KINDS.has(piece.kind ?? '')) return false;
  const mine = perimeterCorners(piece);
  const others = f.furniture.filter(o => o.id !== piece.id && STAIR_KINDS.has(o.kind ?? ''));
  // 1. Corner-to-corner.
  let best: { d: number; dx: number; dy: number } | null = null;
  for (const other of others) {
    for (const oc of perimeterCorners(other)) {
      for (const mc of mine) {
        const d = Math.hypot(oc.x - mc.x, oc.y - mc.y);
        if (d < 250 && (!best || d < best.d)) best = { d, dx: oc.x - mc.x, dy: oc.y - mc.y };
      }
    }
  }
  // 2. Parallel-edge gap closing.
  if (!best) {
    for (const other of others) {
      const theirs = perimeterCorners(other);
      for (let i = 0; i < 4; i++) {
        const p1 = mine[i], p2 = mine[(i + 1) % 4];
        const eLen = Math.hypot(p2.x - p1.x, p2.y - p1.y) || 1;
        const dax = (p2.x - p1.x) / eLen, day = (p2.y - p1.y) / eLen;
        const nx = -day, ny = dax;  // edge normal
        for (let j = 0; j < 4; j++) {
          const q1 = theirs[j], q2 = theirs[(j + 1) % 4];
          const bLen = Math.hypot(q2.x - q1.x, q2.y - q1.y) || 1;
          const dbx = (q2.x - q1.x) / bLen, dby = (q2.y - q1.y) / bLen;
          if (Math.abs(dax * dby - day * dbx) > 0.105) continue;  // >6° off-parallel
          const gap = (q1.x - p1.x) * nx + (q1.y - p1.y) * ny;
          if (Math.abs(gap) > 250) continue;
          // Overlap along the edge direction.
          const tb1 = (q1.x - p1.x) * dax + (q1.y - p1.y) * day;
          const tb2 = (q2.x - p1.x) * dax + (q2.y - p1.y) * day;
          const lo = Math.min(tb1, tb2), hi = Math.max(tb1, tb2);
          if (Math.min(eLen, hi) - Math.max(0, lo) < 150) continue;
          const d = Math.abs(gap);
          if (!best || d < best.d) best = { d, dx: nx * gap, dy: ny * gap };
        }
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

// The WallKind (as a string) of the wall an opening at (x,y) would snap onto
// (nearest within maxDist), or null if none. Used to silently default a new
// door to a 'gate' when it lands on a fence/hedge run (pinned decision 5).
export function nearestWallKind(
  f: WeldWalls,
  x: number, y: number,
  maxDist = 500,
): string | null {
  let best: { d: number; kind: string } | null = null;
  for (const w of f.walls) {
    for (let i = 0; i < w.points.length - 1; i++) {
      const A = w.points[i], B = w.points[i + 1];
      const q = closestOnSegment({ x, y }, A, B);
      const d = distMM({ x, y }, q);
      if (d < maxDist && (!best || d < best.d)) best = { d, kind: (w as { kind?: string }).kind ?? 'full' };
    }
  }
  return best ? best.kind : null;
}

// True when a wall kind is a fence/hedge boundary (→ new doors default to gate).
function isFenceLikeKind(k: string | null): boolean {
  return k != null && (k.startsWith('fence_') || k === 'hedge');
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

// Open the alarm control modal for a panel id (bubbles to app.ts). Used from
// both the edit click-vs-drag path and the kiosk click branch.
function openAlarmModal(canvas: HTMLCanvasElement, id: string): void {
  canvas.dispatchEvent(new CustomEvent('open-alarm', {
    bubbles: true, composed: true, detail: { id },
  }));
}

// Open the thermostat control modal for a fixture id (bubbles to app.ts). Used
// from both the edit click-vs-drag path and the kiosk click branch.
function openThermostatModal(canvas: HTMLCanvasElement, id: string): void {
  canvas.dispatchEvent(new CustomEvent('open-thermostat', {
    bubbles: true, composed: true, detail: { id },
  }));
}

// Tap-to-clean a Valetudo room segment. Low-priority (callers run it AFTER all
// fixture hits). Only active when the vacuumMap overlay layer is on. Returns true
// when the click landed on a segment (handled — even if the user declined the
// confirm), so the caller stops. View mode is refused inside cleanVacuumSegment.
function tryVacuumSegmentClean(p: Planner, mm: Vec2): boolean {
  if (p.store.layers2d?.vacuumMap !== true) return false;
  const hit = hitVacuumSegment(p, mm);
  if (!hit) return false;
  if (typeof confirm === 'function' && !confirm(`Clean ${hit.name}?`)) return true;
  p.cleanVacuumSegment(hit.robot, hit.segId);
  return true;
}

export function onCanvasMouseDown(p: Planner, canvas: HTMLCanvasElement, view: View, e: MouseEvent): void {
  if (p.uiMode !== 'edit') return;  // kiosk/view: no drags, no selections
  if (p.editZone) return;
  if (p.placingRoomId) return;  // room-placement latch: let the click set the anchor
  if (p.placingLandmarkId) return;  // geo-landmark latch: let the click place the pin
  if (p.placingCamCalibId) return;  // camera-calib latch: let the click record the floor point
  const mm = pxToMm(canvas, view, e);
  if (p.tool !== 'select') return;
  // Dimension wall-pick latch (Feature B custom mode): a select-mode press on a
  // wall toggles its custom dimension flag instead of selecting / dragging. Stay
  // armed for more picks; a press on empty space is a no-op (stays armed).
  if (p.pickingDimWalls) {
    const wh = hitWall(p, mm);
    if (wh) p.toggleWallDimension(wh.id);
    e.preventDefault(); return;
  }
  // A fresh select-tool press resets the selected-vertex latch; a vertex hit
  // below re-sets it. Delete keys off this (deleteSelection prioritizes it).
  p.selectedVertex = null;

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
  const camRot = hitCameraRotateHandle(p, view, mm);
  if (camRot) {
    p.drag = { kind: 'cameraRotate', id: camRot.id };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  // Presence-zone vertex handles (active zone, zones layer visible) — drag to
  // reshape. Mirrors wall-vertex editing (world-mm points).
  if (zonesInteractive(p)) {
    const pzv = hitPresenceZoneVertex(p, view, mm);
    if (pzv) {
      p.drag = { kind: 'pzoneVert', id: pzv.zone.id, idx: pzv.idx,
                 startMm: mm, startPts: pzv.zone.points.map(pt => ({ ...pt })) };
      p.selectedVertex = { kind: 'pzone', itemId: pzv.zone.id, index: pzv.idx }; p.markSelectionHot();
      canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
    }
  }
  // Ground-area vertex handles (active area, ground layer visible) — drag to
  // reshape. Mirrors the presence-zone vertex path.
  if (groundInteractive(p)) {
    const gv = hitGroundAreaVertex(p, view, mm);
    if (gv) {
      p.drag = { kind: 'groundVert', id: gv.area.id, idx: gv.idx,
                 startMm: mm, startPts: gv.area.points.map(pt => ({ ...pt })) };
      p.selectedVertex = { kind: 'ground', itemId: gv.area.id, index: gv.idx }; p.markSelectionHot();
      canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
    }
  }
  // Path centerline handles (active path-backed ground area) — drag to reshape,
  // regenerating the derived polygon on release (pinned decision 3).
  if (groundInteractive(p)) {
    const pv = hitPathVertex(p, view, mm);
    if (pv && pv.area.path) {
      p.drag = { kind: 'pathVert', id: pv.area.id, idx: pv.idx,
                 startMm: mm, startPts: pv.area.path.centerline.map(pt => ({ ...pt })) };
      p.selectedVertex = { kind: 'path', itemId: pv.area.id, index: pv.idx }; p.markSelectionHot();
      canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
    }
  }
  // Pool vertex handles (active pool, ground layer visible) — drag to reshape.
  if (groundInteractive(p)) {
    const pv = hitPoolVertex(p, view, mm);
    if (pv) {
      p.drag = { kind: 'poolVert', id: pv.pool.id, idx: pv.idx,
                 startMm: mm, startPts: pv.pool.points.map(pt => ({ ...pt })) };
      p.selectedVertex = { kind: 'pool', itemId: pv.pool.id, index: pv.idx }; p.markSelectionHot();
      canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
    }
  }
  // Void-area vertex handles (active void, ground layer visible) — drag to
  // reshape. Mirrors the ground-area vertex path.
  if (groundInteractive(p)) {
    const vv = hitVoidAreaVertex(p, view, mm);
    if (vv) {
      p.drag = { kind: 'voidVert', id: vv.area.id, idx: vv.idx,
                 startMm: mm, startPts: vv.area.points.map(pt => ({ ...pt })) };
      p.selectedVertex = { kind: 'void', itemId: vv.area.id, index: vv.idx }; p.markSelectionHot();
      canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
    }
  }
  // Ruler endpoint handles (point ends only) — high priority small targets.
  // Only while the dimensions layer is on.
  if (dimsInteractive(p)) {
    const reh = hitRulerEnd(p, view, mm);
    if (reh) {
      if (p.activeRulerId !== reh.ruler.id) { p.activeRulerId = reh.ruler.id; p.emitConfig(); }
      p.drag = { kind: 'rulerEnd', rulerId: reh.ruler.id, end: reh.end };
      canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
    }
  }
  // Zone polys / object halos capture input ONLY while the zones layer is
  // visible — an invisible zone edge crossing a sensor body used to swallow
  // the sensor's drag (mirrors the 3D rule: hidden lights stop being raycast
  // targets).
  if (zonesInteractive(p)) {
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
  }
  const wv = hitWallVert(p, view, mm);
  if (wv) {
    p.drag = { kind: 'wallv', wallId: wv.wall.id, idx: wv.idx,
               startMm: mm, startPts: wv.wall.points.map(pt => ({ ...pt })) };
    p.selectedVertex = { kind: 'wall', itemId: wv.wall.id, index: wv.idx }; p.markSelectionHot();
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  const fc = hitFurnitureCorner(p, view, mm);
  if (fc) {
    p.drag = { kind: 'furnCorner', idx: fc.idx, anchor: fc.anchor };
    p.activeFurnitureId = p.floor().furniture[fc.idx]?.id ?? null; p.markSelectionHot();
    canvas.style.cursor = (fc.sx * fc.sy > 0) ? 'nwse-resize' : 'nesw-resize';
    e.preventDefault(); return;
  }
  const fx = hitFixture(p, mm, Math.max(250, hitPx(view) * 3));
  if (fx) {
    const arr = fx.kind === 'light' ? p.floor().lights : p.floor().switches;
    const item = arr[fx.idx];
    p.drag = { kind: 'fixture', fxKind: fx.kind, idx: fx.idx,
               startMm: mm, start: { x: item.x, y: item.y } };
    p.alignCandidates = buildAlignCandidates(p, p.drag);
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  const fhi = hitFurniture(p, mm);
  if (fhi) {
    p.drag = { kind: 'furnMove', idx: fhi.idx, startMm: mm,
               start: { x: fhi.item.x, y: fhi.item.y } };
    p.activeFurnitureId = fhi.item.id; p.markSelectionHot();
    p.alignCandidates = buildAlignCandidates(p, p.drag);
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  // Door lock padlock wins over the endpoint + body (small radius near the
  // hinge) so a lock toggle doesn't rotate or open the door.
  const dLock = hitDoorLock(p, view, mm);
  if (dLock) {
    p.drag = { kind: 'doorLock', idx: dLock.idx };
    canvas.style.cursor = 'pointer'; e.preventDefault(); return;
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
    if (p.activeEnvId !== eh.id) p.activeEnvId = eh.id; p.markSelectionHot();
    p.drag = { kind: 'env', id: eh.id, startMm: mm, start: { x: eh.x, y: eh.y } };
    p.alignCandidates = buildAlignCandidates(p, p.drag);
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const ich = hitInfoCard(p, view, mm);
  if (ich) {
    if (p.activeInfoId !== ich.id) p.activeInfoId = ich.id; p.markSelectionHot();
    p.drag = { kind: 'info', id: ich.id, startMm: mm, start: { x: ich.x, y: ich.y } };
    p.alignCandidates = buildAlignCandidates(p, p.drag);
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const abh = hitActionButton(p, view, mm);
  if (abh) {
    if (p.activeActionId !== abh.id) p.activeActionId = abh.id; p.markSelectionHot();
    p.drag = { kind: 'action', id: abh.id, startMm: mm, start: { x: abh.x, y: abh.y } };
    p.alignCandidates = buildAlignCandidates(p, p.drag);
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const mh = hitMotionSensor(p, view, mm);
  if (mh) {
    if (p.activeMotionId !== mh.id) p.activeMotionId = mh.id; p.markSelectionHot();
    p.drag = { kind: 'motion', id: mh.id, startMm: mm, start: { x: mh.x, y: mh.y } };
    p.alignCandidates = buildAlignCandidates(p, p.drag);
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const bh = hitBleProxy(p, view, mm);
  if (bh) {
    if (p.activeBleId !== bh.id) p.activeBleId = bh.id; p.markSelectionHot();
    p.drag = { kind: 'ble', id: bh.id, startMm: mm, start: { x: bh.x, y: bh.y } };
    p.alignCandidates = buildAlignCandidates(p, p.drag);
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const ah = hitAlarmPanel(p, view, mm);
  if (ah) {
    if (p.activeAlarmId !== ah.id) p.activeAlarmId = ah.id; p.markSelectionHot();
    p.drag = { kind: 'alarm', id: ah.id, startMm: mm, start: { x: ah.x, y: ah.y } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const cph = hitCalendarPanel(p, view, mm);
  if (cph) {
    if (p.activeCalendarId !== cph.id) p.activeCalendarId = cph.id; p.markSelectionHot();
    p.drag = { kind: 'calendar', id: cph.id, startMm: mm, start: { x: cph.x, y: cph.y } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const th = hitThermostat(p, view, mm);
  if (th) {
    if (p.activeThermoId !== th.id) p.activeThermoId = th.id; p.markSelectionHot();
    p.drag = { kind: 'thermostat', id: th.id, startMm: mm, start: { x: th.x, y: th.y } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const safeH = hitSafetySensor(p, view, mm);
  if (safeH) {
    if (p.activeSafetyId !== safeH.id) p.activeSafetyId = safeH.id; p.markSelectionHot();
    p.drag = { kind: 'safety', id: safeH.id, startMm: mm, start: { x: safeH.x, y: safeH.y } };
    p.alignCandidates = buildAlignCandidates(p, p.drag);
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const abH = hitAlertBeacon(p, view, mm);
  if (abH) {
    if (p.activeAlertBeaconId !== abH.id) p.activeAlertBeaconId = abH.id; p.markSelectionHot();
    p.drag = { kind: 'alert', id: abH.id, startMm: mm, start: { x: abH.x, y: abH.y } };
    p.alignCandidates = buildAlignCandidates(p, p.drag);
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const roboH = hitRobot(p, view, mm);
  if (roboH) {
    if (p.activeRobotId !== roboH.id) p.activeRobotId = roboH.id; p.markSelectionHot();
    // Drag anchor is the DOCK (roboH.x/y); the live body follows separately.
    p.drag = { kind: 'robot', id: roboH.id, startMm: mm, start: { x: roboH.x, y: roboH.y } };
    p.alignCandidates = buildAlignCandidates(p, p.drag);
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const camH = hitCamera(p, view, mm);
  if (camH) {
    if (p.activeCameraId !== camH.id) p.activeCameraId = camH.id; p.markSelectionHot();
    p.drag = { kind: 'camera', id: camH.id, startMm: mm, start: { x: camH.x, y: camH.y } };
    p.alignCandidates = buildAlignCandidates(p, p.drag);
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const projH = hitProjector(p, view, mm);
  if (projH) {
    if (p.activeProjectorId !== projH.id) p.activeProjectorId = projH.id; p.markSelectionHot();
    p.drag = { kind: 'projector', id: projH.id, startMm: mm, start: { x: projH.x, y: projH.y } };
    p.alignCandidates = buildAlignCandidates(p, p.drag);
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const valH = hitValve(p, view, mm);
  if (valH) {
    if (p.activeValveId !== valH.id) p.activeValveId = valH.id; p.markSelectionHot();
    p.drag = { kind: 'valve', id: valH.id, startMm: mm, start: { x: valH.x, y: valH.y } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const plugH = hitPlug(p, view, mm);
  if (plugH) {
    if (p.activePlugId !== plugH.id) p.activePlugId = plugH.id; p.markSelectionHot();
    p.drag = { kind: 'plug', id: plugH.id, startMm: mm, start: { x: plugH.x, y: plugH.y } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const sprH = hitSprinklerZone(p, view, mm);
  if (sprH) {
    if (p.activeSprinklerId !== sprH.id) p.activeSprinklerId = sprH.id; p.markSelectionHot();
    p.drag = { kind: 'sprinkler', id: sprH.id, startMm: mm, start: { x: sprH.x, y: sprH.y } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  const flagH = hitFlagpole(p, view, mm);
  if (flagH) {
    if (p.activeFlagpoleId !== flagH.id) p.activeFlagpoleId = flagH.id; p.markSelectionHot();
    p.drag = { kind: 'flagpole', id: flagH.id, startMm: mm, start: { x: flagH.x, y: flagH.y } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); p.emitConfig(); return;
  }
  // Ruler body — select it (no whole-ruler drag; move via endpoint handles).
  // Low priority (after fixtures/furniture) so a thin line never swallows their
  // clicks. Only when the dimensions layer is on.
  if (dimsInteractive(p)) {
    const rbH = hitRulerBody(p, view, mm);
    if (rbH) {
      if (p.activeRulerId !== rbH.id) { p.activeRulerId = rbH.id; p.emitConfig(); p.markSelectionHot(); }
      e.preventDefault(); return;
    }
  }
  // Presence zone body — select it (shows vertex handles); no whole-zone drag in
  // v1 (reshape via vertex handles or Redraw). Only when the zones layer is on.
  if (zonesInteractive(p)) {
    const pzH = hitPresenceZone(p, view, mm);
    if (pzH) {
      if (p.activePZoneId !== pzH.id) { p.activePZoneId = pzH.id; p.emitConfig(); p.markSelectionHot(); }
      e.preventDefault(); return;
    }
  }
  const sh = hitSensor(p, view, mm);
  if (sh) {
    if (p.store.activeSensorId !== sh.id) p.setActiveSensor(sh.id);
    p.drag = { kind: 'sensor', id: sh.id, startMm: mm, start: { x: sh.x, y: sh.y } };
    p.alignCandidates = buildAlignCandidates(p, p.drag);
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  const bgBody = hitBgBody(p, mm);
  if (bgBody) {
    p.drag = { kind: 'bgMove', startMm: mm, start: { x: bgBody.x, y: bgBody.y } };
    canvas.style.cursor = 'grabbing'; e.preventDefault(); return;
  }
  // Pool body — select it (shows vertex handles). Checked BEFORE ground so a
  // pool drawn over a grass area selects the pool (pools draw on top of ground).
  // Clears any stale ground/void selection so Delete targets the pool. Only when
  // the ground layer is on. No whole-area drag in v1.
  if (groundInteractive(p)) {
    const plH = hitPool(p, view, mm);
    if (plH) {
      if (p.activePoolId !== plH.id) { p.activePoolId = plH.id; p.markSelectionHot(); }
      p.activeGroundAreaId = null; p.activeVoidAreaId = null;
      p.emitConfig();
      e.preventDefault(); return;
    }
  }
  // Ground-area body — select it (shows vertex handles); low priority (after
  // every item hit) so ground paint never swallows a click meant for something
  // resting on it. Only when the ground layer is on. No whole-area drag in v1.
  if (groundInteractive(p)) {
    const gH = hitGroundArea(p, view, mm);
    if (gH) {
      if (p.activeGroundAreaId !== gH.id) { p.activeGroundAreaId = gH.id; p.markSelectionHot(); }
      p.activePoolId = null; p.activeVoidAreaId = null;
      p.emitConfig();
      e.preventDefault(); return;
    }
  }
  // Void-area body — select it (shows vertex handles); low priority (after every
  // item hit, alongside ground paint). Only when the ground layer is on. No
  // whole-area drag in v1 (reshape via vertex handles or Redraw).
  if (groundInteractive(p)) {
    const vH = hitVoidArea(p, view, mm);
    if (vH) {
      if (p.activeVoidAreaId !== vH.id) { p.activeVoidAreaId = vH.id; p.markSelectionHot(); }
      p.activeGroundAreaId = null; p.activePoolId = null;
      p.emitConfig();
      e.preventDefault(); return;
    }
  }
  // Floor boundary edge — lowest priority (after every item hit, before the
  // canvas-2d pan fallback). Drag to resize the canvas space; left/bottom edges
  // also reposition the plan (see resolveFloorEdgeDrag / translateFloorContent).
  // boundsLocked hides the handles and disables the drag entirely.
  const fe = p.floor().boundsLocked ? null : hitFloorEdge(p.floor(), view, mm);
  if (fe) {
    const f = p.floor();
    p.drag = {
      kind: 'floorEdge', edge: fe,
      startClient: { x: e.clientX, y: e.clientY }, startScale: view.scale,
      startW: f.w, startD: f.d, startBbox: floorContentBbox(f), applied: { x: 0, y: 0 },
    };
    canvas.style.cursor = (fe === 'left' || fe === 'right') ? 'ew-resize' : 'ns-resize';
    e.preventDefault(); return;
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
    // Live-parent: remember a moved surface host's pre-frame position so its
    // mounted pieces can follow the EXACT frame delta (computed after the align
    // snap below, so they stay glued while the host snaps to a guide).
    const furnHostPrev = drag.kind === 'furnMove'
      ? (() => { const it = f.furniture[drag.idx]; return it ? { x: it.x, y: it.y } : null; })()
      : null;
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
      case 'info': {
        const ic = (f.infoCards ?? []).find(x => x.id === drag.id);
        if (ic && !ic.locked) {
          ic.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          ic.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'action': {
        const ab = (f.actionButtons ?? []).find(x => x.id === drag.id);
        if (ab && !ab.locked) {
          ab.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          ab.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'ble': {
        const bp = (f.bleProxies ?? []).find(x => x.id === drag.id);
        if (bp && !bp.locked) {
          bp.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          bp.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'safety': {
        const ss = (f.safetySensors ?? []).find(x => x.id === drag.id);
        if (ss && !ss.locked) {
          ss.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          ss.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'alert': {
        const ab = (f.alertBeacons ?? []).find(x => x.id === drag.id);
        if (ab && !ab.locked) {
          ab.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          ab.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'alarm': {
        const ap = (f.alarmPanels ?? []).find(x => x.id === drag.id);
        if (ap && !ap.locked) {
          ap.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          ap.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'calendar': {
        const cp = (f.calendarPanels ?? []).find(x => x.id === drag.id);
        if (cp && !cp.locked) {
          cp.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          cp.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'thermostat': {
        const th = (f.thermostats ?? []).find(x => x.id === drag.id);
        if (th && !th.locked) {
          th.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          th.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'robot': {
        const ro = (f.robots ?? []).find(x => x.id === drag.id);
        if (ro && !ro.locked) {
          // Free placement — a mower dock lives OUTSIDE the wall loops / rect.
          ro.x = drag.start.x + mm.x - drag.startMm.x;
          ro.y = drag.start.y + mm.y - drag.startMm.y;
        }
        break;
      }
      case 'camera': {
        const cam = (f.cameras ?? []).find(x => x.id === drag.id);
        if (cam && !cam.locked) {
          cam.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          cam.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'cameraRotate': {
        const cam = (f.cameras ?? []).find(x => x.id === drag.id);
        if (cam && !cam.locked) {
          const ang = Math.atan2(mm.x - cam.x, mm.y - cam.y);
          const deg = Math.round(ang * 180 / Math.PI);
          cam.rotation = ((deg % 360) + 360) % 360;
        }
        break;
      }
      case 'projector': {
        const pr = (f.projectors ?? []).find(x => x.id === drag.id);
        if (pr && !pr.locked) {
          pr.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          pr.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'valve': {
        const vv = (f.valves ?? []).find(x => x.id === drag.id);
        if (vv && !vv.locked) {
          vv.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          vv.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'plug': {
        const pg = (f.plugs ?? []).find(x => x.id === drag.id);
        if (pg && !pg.locked) {
          pg.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          pg.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'sprinkler': {
        const sz = (f.sprinklerZones ?? []).find(x => x.id === drag.id);
        if (sz && !sz.locked) {
          sz.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          sz.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'flagpole': {
        const fpz = (f.flagpoles ?? []).find(x => x.id === drag.id);
        if (fpz && !fpz.locked) {
          fpz.x = Math.max(0, Math.min(f.w, drag.start.x + mm.x - drag.startMm.x));
          fpz.y = Math.max(0, Math.min(f.d, drag.start.y + mm.y - drag.startMm.y));
        }
        break;
      }
      case 'pzoneVert': {
        const z = (f.presenceZones ?? []).find(x => x.id === drag.id);
        if (z && !z.locked && z.points[drag.idx]) {
          z.points[drag.idx] = { x: snap(mm.x, 10), y: snap(mm.y, 10) };
        }
        break;
      }
      case 'groundVert': {
        const g = (f.groundAreas ?? []).find(x => x.id === drag.id);
        if (g && !g.locked && g.points[drag.idx]) {
          g.points[drag.idx] = { x: snap(mm.x, 10), y: snap(mm.y, 10) };
        }
        break;
      }
      case 'pathVert': {
        const g = (f.groundAreas ?? []).find(x => x.id === drag.id);
        if (g && !g.locked && g.path && g.path.centerline[drag.idx]) {
          g.path.centerline[drag.idx] = { x: snap(mm.x, 10), y: snap(mm.y, 10) };
          p.regenGroundAreaPath(g);   // live-preview the ribbon while dragging
        }
        break;
      }
      case 'poolVert': {
        const pl = (f.pools ?? []).find(x => x.id === drag.id);
        if (pl && !pl.locked && pl.points[drag.idx]) {
          pl.points[drag.idx] = { x: snap(mm.x, 10), y: snap(mm.y, 10) };
        }
        break;
      }
      case 'voidVert': {
        const vd = (f.voidAreas ?? []).find(x => x.id === drag.id);
        if (vd && !vd.locked && vd.points[drag.idx]) {
          vd.points[drag.idx] = { x: snap(mm.x, 10), y: snap(mm.y, 10) };
        }
        break;
      }
      case 'rulerEnd': {
        const r = (f.rulers ?? []).find(x => x.id === drag.rulerId);
        const end = r ? r[drag.end] : null;
        if (r && !r.locked && end && end.kind === 'point') {
          end.x = snap(mm.x, 10); end.y = snap(mm.y, 10);
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
      case 'floorEdge': {
        // Measure the cursor delta in FROZEN start-of-drag screen space so the
        // fit-view rescale that follows a resize can't feed back. Screen +Y is
        // down; world +Y is up → invert for the top/bottom (vertical) edges.
        const dpr = window.devicePixelRatio || 1;
        const horiz = drag.edge === 'left' || drag.edge === 'right';
        const screenDelta = horiz
          ? (e.clientX - drag.startClient.x)
          : (e.clientY - drag.startClient.y);
        let worldDelta = screenDelta * dpr / Math.max(drag.startScale, 1e-9);
        if (!horiz) worldDelta = -worldDelta;
        const r = resolveFloorEdgeDrag(drag.edge, snap(worldDelta, GRID_MM),
                                       drag.startW, drag.startD, drag.startBbox);
        f.w = r.w; f.d = r.d;
        // `tx`/`ty` are TOTAL translation from drag start; apply only the delta
        // since last frame so live mutation stays consistent.
        const needX = r.tx - drag.applied.x, needY = r.ty - drag.applied.y;
        if (needX !== 0 || needY !== 0) {
          p.translateFloorContent(needX, needY);
          drag.applied.x = r.tx; drag.applied.y = r.ty;
        }
        break;
      }
    }
    // Smart alignment guides (Feature C): snap the moved placeable's center to
    // peer centers on X / Y (edit mode, move-kinds only). Applied AFTER the
    // per-kind move so guideline snap wins over grid intent.
    p.alignGuides = [];
    if (p.uiMode === 'edit' && ALIGN_MOVE_KINDS.has(drag.kind)) {
      const it = draggedMoveItem(f, drag);
      if (it) applyAlignSnap(p, it, view.scale);
    }
    // Live-parent: a moved surface host carries its mounted pieces by the exact
    // frame delta (post align-snap). Locked mounted pieces stay put and keep
    // their mountOnId (they re-snap on their next drag).
    if (furnHostPrev && drag.kind === 'furnMove') {
      const host = f.furniture[drag.idx];
      if (host && !host.locked && resolveFurnitureDef(host, p.store.customObjects).surface) {
        const fdx = host.x - furnHostPrev.x, fdy = host.y - furnHostPrev.y;
        if (fdx !== 0 || fdy !== 0) {
          for (const m of f.furniture) {
            if (m.mountOnId === host.id && !m.locked) { m.x += fdx; m.y += fdy; }
          }
        }
      }
    }
    return;
  }

  // Cursor hint
  if (p.uiMode === 'view') { canvas.style.cursor = 'default'; return; }
  if (p.uiMode === 'kiosk') {
    const safeHit = hitSafetySensor(p, view, mm);
    const overDevice =
      hitFixture(p, mm, Math.max(250, hitPx(view) * 3)) ||
      hitActionButton(p, view, mm) ||      // action buttons fire in kiosk
      hitAlarmPanel(p, view, mm) ||
      hitThermostat(p, view, mm) ||        // thermostats open the control modal
      (safeHit && (safeHit.kind === 'siren' || !safeHit.entity_id)) ||  // sirens (bound too) + unbound detectors are clickable
      hitAlertBeacon(p, view, mm) ||       // alert beacons acknowledge / demo-toggle in kiosk
      hitRobot(p, view, mm) ||             // robots are always click-toggleable
      hitProjector(p, view, mm) ||         // projectors toggle on/off in kiosk
      hitValve(p, view, mm) ||             // valves open/close in kiosk
      hitSprinklerZone(p, view, mm) ||     // sprinkler heads toggle in kiosk
      hitPlug(p, view, mm) ||              // plugs toggle in kiosk
      hitDoor(p, view, mm) || hitWindow(p, view, mm);
    canvas.style.cursor = overDevice ? 'pointer' : 'default';
    return;
  }
  if (p.tool === 'select') {
    const bgc = hitBgCorner(p, view, mm);
    if (bgc) canvas.style.cursor = (bgc.sx * bgc.sy > 0) ? 'nwse-resize' : 'nesw-resize';
    else if (p.pickingDimWalls) canvas.style.cursor = hitWall(p, mm) ? 'pointer' : 'crosshair';
    else if (dimsInteractive(p) && hitRulerEnd(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitMotionRotateHandle(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitEnvResizeHandle(p, view, mm)) canvas.style.cursor = 'ew-resize';
    else if (hitEnvSensor(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitInfoCard(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitActionButton(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitMotionSensor(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitBleProxy(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitAlarmPanel(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitCalendarPanel(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitThermostat(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitSafetySensor(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitAlertBeacon(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitRobot(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitCameraRotateHandle(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitCamera(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitProjector(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitValve(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitSprinklerZone(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitFlagpole(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitPlug(p, view, mm)) canvas.style.cursor = 'grab';
    else if (zonesInteractive(p) && hitPresenceZoneVertex(p, view, mm)) canvas.style.cursor = 'grab';
    else if (groundInteractive(p) && hitGroundAreaVertex(p, view, mm)) canvas.style.cursor = 'grab';
    else if (groundInteractive(p) && hitPathVertex(p, view, mm)) canvas.style.cursor = 'grab';
    else if (groundInteractive(p) && hitPoolVertex(p, view, mm)) canvas.style.cursor = 'grab';
    else if (groundInteractive(p) && hitVoidAreaVertex(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitSensorRotateHandle(p, view, mm)) canvas.style.cursor = 'grab';
    else if (zonesInteractive(p) && hitObjectRadiusHandle(p, view, mm)) canvas.style.cursor = 'ew-resize';
    else if (zonesInteractive(p) && (hitObject(p, view, mm) || hitVertexOrZone(p, view, mm))) canvas.style.cursor = 'grab';
    else if (hitWallVert(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitFurnitureCorner(p, view, mm)) canvas.style.cursor = 'nwse-resize';
    else if (hitDoorLock(p, view, mm)) canvas.style.cursor = 'pointer';
    else if (hitDoorEnd(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitDoor(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitWindowEnd(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitWindow(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitFixture(p, mm, Math.max(250, hitPx(view) * 3))) canvas.style.cursor = 'grab';
    else if (hitFurniture(p, mm) || hitWall(p, mm) || hitSensor(p, view, mm)) canvas.style.cursor = 'grab';
    else if (hitBgBody(p, mm)) canvas.style.cursor = 'grab';
    else {
      const fe = p.floor().boundsLocked ? null : hitFloorEdge(p.floor(), view, mm);
      canvas.style.cursor = fe
        ? ((fe === 'left' || fe === 'right') ? 'ew-resize' : 'ns-resize')
        : 'default';
    }
  } else { canvas.style.cursor = 'crosshair'; }
}

export function onCanvasMouseUp(p: Planner, canvas: HTMLCanvasElement): void {
  if (!p.drag) return;
  const f = p.floor();
  const sa = p.activeSensor();
  const drag = p.drag;
  p.drag = null;
  p.dragJustEnded = true;
  p.alignGuides = [];
  p.alignCandidates = [];
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
  } else if (drag.kind === 'info') {
    const ic = (f.infoCards ?? []).find(x => x.id === drag.id);
    if (ic) {
      ic.x = snap(ic.x, 10); ic.y = snap(ic.y, 10);
      snapInfoCardToWall(ic, f.walls);   // wall mount → flush on release (no-op for surface/floor)
    }
    p.save();
  } else if (drag.kind === 'rulerEnd') {
    const r = (f.rulers ?? []).find(x => x.id === drag.rulerId);
    const end = r ? r[drag.end] : null;
    if (end && end.kind === 'point') { end.x = snap(end.x, 10); end.y = snap(end.y, 10); }
    p.save();
  } else if (drag.kind === 'ble') {
    const bp = (f.bleProxies ?? []).find(x => x.id === drag.id);
    if (bp) { bp.x = snap(bp.x, 10); bp.y = snap(bp.y, 10); }
    p.save();
  } else if (drag.kind === 'alarm') {
    const ap = (f.alarmPanels ?? []).find(x => x.id === drag.id);
    if (ap) {
      // Click-vs-drag: a tiny movement opens the alarm modal; a real move snaps
      // the plate flush to the nearest wall (like a switch, no ganging).
      const moved = Math.hypot(ap.x - drag.start.x, ap.y - drag.start.y);
      if (moved < 30) {
        ap.x = drag.start.x; ap.y = drag.start.y;
        openAlarmModal(canvas, ap.id);
      } else {
        ap.x = snap(ap.x, 10); ap.y = snap(ap.y, 10);
        snapAlarmToWall(ap, f.walls);
        p.save();
      }
    }
  } else if (drag.kind === 'calendar') {
    const cp = (f.calendarPanels ?? []).find(x => x.id === drag.id);
    if (cp) {
      // Click-vs-drag: a tiny movement just selects (read-only fixture — the
      // sidebar section is the detail view); a real move snaps the plaque flush
      // to the nearest wall (like a switch/alarm, no ganging).
      const moved = Math.hypot(cp.x - drag.start.x, cp.y - drag.start.y);
      if (moved < 30) {
        cp.x = drag.start.x; cp.y = drag.start.y;
      } else {
        cp.x = snap(cp.x, 10); cp.y = snap(cp.y, 10);
        snapCalendarToWall(cp, f.walls);
        p.save();
      }
    }
  } else if (drag.kind === 'thermostat') {
    const th = (f.thermostats ?? []).find(x => x.id === drag.id);
    if (th) {
      // Click-vs-drag: a tiny movement opens the thermostat modal; a real move
      // snaps the plate flush to the nearest wall (like a switch, no ganging).
      const moved = Math.hypot(th.x - drag.start.x, th.y - drag.start.y);
      if (moved < 30) {
        th.x = drag.start.x; th.y = drag.start.y;
        openThermostatModal(canvas, th.id);
      } else {
        th.x = snap(th.x, 10); th.y = snap(th.y, 10);
        snapThermostatToWall(th, f.walls);
        p.save();
      }
    }
  } else if (drag.kind === 'action') {
    const ab = (f.actionButtons ?? []).find(x => x.id === drag.id);
    if (ab) {
      // Click-vs-drag: a tiny movement FIRES the action (control fixtures fire in
      // edit + kiosk, like alarm/lock); a real move snaps flush to the nearest
      // wall when wallMount (like a switch, no ganging), free otherwise.
      const moved = Math.hypot(ab.x - drag.start.x, ab.y - drag.start.y);
      if (moved < 30) {
        ab.x = drag.start.x; ab.y = drag.start.y;
        p.fireAction(ab);
      } else {
        ab.x = snap(ab.x, 10); ab.y = snap(ab.y, 10);
        snapActionButtonToWall(ab, f.walls);
        p.save();
      }
    }
  } else if (drag.kind === 'safety') {
    const ss = (f.safetySensors ?? []).find(x => x.id === drag.id);
    if (ss) {
      // Click-vs-drag: a tiny movement is a click (unbound → manual test
      // trigger via toggleItem; bound → display-only no-op). A real move just
      // snaps to grid — ceiling-mounted, so NO wall snap.
      const moved = Math.hypot(ss.x - drag.start.x, ss.y - drag.start.y);
      if (moved < 30) {
        ss.x = drag.start.x; ss.y = drag.start.y;
        if (!ss.entity_id) p.toggleItem(ss);
      } else {
        ss.x = snap(ss.x, 10); ss.y = snap(ss.y, 10);
        p.save();
      }
    }
  } else if (drag.kind === 'alert') {
    const ab = (f.alertBeacons ?? []).find(x => x.id === drag.id);
    if (ab) {
      // Click-vs-drag: a tiny movement is a click → acknowledge (bound alert.*)
      // or demo-flip (unbound). A real move snaps to grid — ceiling-mounted, NO
      // wall snap (like the safety detector).
      const moved = Math.hypot(ab.x - drag.start.x, ab.y - drag.start.y);
      if (moved < 30) {
        ab.x = drag.start.x; ab.y = drag.start.y;
        p.acknowledgeAlertBeacon(ab);
      } else {
        ab.x = snap(ab.x, 10); ab.y = snap(ab.y, 10);
        p.save();
      }
    }
  } else if (drag.kind === 'robot') {
    const ro = (f.robots ?? []).find(x => x.id === drag.id);
    if (ro) {
      // Click-vs-drag: a tiny move is a click → run/dock (bound) or toggle the
      // demo (unbound). A real move relocates the DOCK (free placement) + shifts
      // the live robot state by the same delta so the body moves with its base.
      const dx = ro.x - drag.start.x, dy = ro.y - drag.start.y;
      if (Math.hypot(dx, dy) < 30) {
        ro.x = drag.start.x; ro.y = drag.start.y;
        p.toggleRobot(ro);
      } else {
        ro.x = snap(ro.x, 10); ro.y = snap(ro.y, 10);
        const rs = p.robotStates[ro.id];
        if (rs) {
          const sdx = ro.x - drag.start.x, sdy = ro.y - drag.start.y;
          rs.x += sdx; rs.y += sdy; rs.goalX += sdx; rs.goalY += sdy;
        }
        p.save();
      }
    }
  } else if (drag.kind === 'camera') {
    const cam = (f.cameras ?? []).find(x => x.id === drag.id);
    if (cam) { cam.x = snap(cam.x, 10); cam.y = snap(cam.y, 10); }
    p.save();
  } else if (drag.kind === 'cameraRotate') {
    p.save();
  } else if (drag.kind === 'projector') {
    const pr = (f.projectors ?? []).find(x => x.id === drag.id);
    if (pr) {
      // Click-vs-drag: a tiny move is a click → toggle projecting (bound entity
      // or unbound localState). A real move relocates the ceiling mount (free
      // placement — no wall snap). toggleItem refuses in view mode.
      const moved = Math.hypot(pr.x - drag.start.x, pr.y - drag.start.y);
      if (moved < 30) {
        pr.x = drag.start.x; pr.y = drag.start.y;
        p.toggleItem(pr);
      } else {
        pr.x = snap(pr.x, 10); pr.y = snap(pr.y, 10);
        p.save();
      }
    }
  } else if (drag.kind === 'valve') {
    const vv = (f.valves ?? []).find(x => x.id === drag.id);
    if (vv) {
      // Click-vs-drag: a tiny move is a click → open/close (valve.* open_valve/
      // close_valve by state, switch.toggle, or unbound localState flip). A real
      // move relocates the floor pipe (free placement — no wall snap).
      const moved = Math.hypot(vv.x - drag.start.x, vv.y - drag.start.y);
      if (moved < 30) {
        vv.x = drag.start.x; vv.y = drag.start.y;
        p.toggleValve(vv);
      } else {
        vv.x = snap(vv.x, 10); vv.y = snap(vv.y, 10);
        p.save();
      }
    }
  } else if (drag.kind === 'plug') {
    const pg = (f.plugs ?? []).find(x => x.id === drag.id);
    if (pg) {
      // Click-vs-drag: a tiny move is a click → toggle (bound entity or unbound
      // localState). A real move snaps the plate flush to the nearest wall (like
      // a switch, no ganging).
      const moved = Math.hypot(pg.x - drag.start.x, pg.y - drag.start.y);
      if (moved < 30) {
        pg.x = drag.start.x; pg.y = drag.start.y;
        if (pg.allowControl !== false) p.toggleItem(pg);
      } else {
        pg.x = snap(pg.x, 10); pg.y = snap(pg.y, 10);
        snapPlugToWall(pg, f.walls);
        p.save();
      }
    }
  } else if (drag.kind === 'sprinkler') {
    const sz = (f.sprinklerZones ?? []).find(x => x.id === drag.id);
    if (sz) {
      // Click-vs-drag: a tiny move is a click → toggle the head (bound entity via
      // toggleItem/toggleEntity, or unbound localState flip). A real move relocates
      // the head (free placement — no wall snap).
      const moved = Math.hypot(sz.x - drag.start.x, sz.y - drag.start.y);
      if (moved < 30) {
        sz.x = drag.start.x; sz.y = drag.start.y;
        p.toggleItem(sz);
      } else {
        sz.x = snap(sz.x, 10); sz.y = snap(sz.y, 10);
        p.save();
      }
    }
  } else if (drag.kind === 'flagpole') {
    // Display-only fixture (no click-to-toggle): a release just grid-snaps the
    // base (free placement, no wall snap).
    const fpz = (f.flagpoles ?? []).find(x => x.id === drag.id);
    if (fpz) { fpz.x = snap(fpz.x, 10); fpz.y = snap(fpz.y, 10); p.save(); }
  } else if (drag.kind === 'pzoneVert') {
    const z = (f.presenceZones ?? []).find(x => x.id === drag.id);
    if (z && z.points[drag.idx]) z.points[drag.idx] = { x: snap(z.points[drag.idx].x, 10), y: snap(z.points[drag.idx].y, 10) };
    p.save();
  } else if (drag.kind === 'groundVert') {
    const g = (f.groundAreas ?? []).find(x => x.id === drag.id);
    if (g && g.points[drag.idx]) g.points[drag.idx] = { x: snap(g.points[drag.idx].x, 10), y: snap(g.points[drag.idx].y, 10) };
    p.save();
  } else if (drag.kind === 'pathVert') {
    const g = (f.groundAreas ?? []).find(x => x.id === drag.id);
    if (g && g.path && g.path.centerline[drag.idx]) {
      g.path.centerline[drag.idx] = { x: snap(g.path.centerline[drag.idx].x, 10), y: snap(g.path.centerline[drag.idx].y, 10) };
      p.regenGroundAreaPath(g);   // final ribbon regen on release
    }
    p.save();
  } else if (drag.kind === 'poolVert') {
    const pl = (f.pools ?? []).find(x => x.id === drag.id);
    if (pl && pl.points[drag.idx]) pl.points[drag.idx] = { x: snap(pl.points[drag.idx].x, 10), y: snap(pl.points[drag.idx].y, 10) };
    p.save();
  } else if (drag.kind === 'voidVert') {
    const vd = (f.voidAreas ?? []).find(x => x.id === drag.id);
    if (vd && vd.points[drag.idx]) vd.points[drag.idx] = { x: snap(vd.points[drag.idx].x, 10), y: snap(vd.points[drag.idx].y, 10) };
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
        // Treat as click — restore exact start position; toggle bound entity
        // or (unbound) the item's local control state.
        it.x = drag.start.x; it.y = drag.start.y;
        p.toggleItem(it);
      } else {
        // Fixtures snap on release (like doors/windows snapOpeningToWall):
        // step lights flush to a wall face / stair edge; fireplaces flush to a
        // wall face (back to the wall, opening to the room); switches to a wall
        // + gang with neighbours. Each is a no-op unless the fixture qualifies.
        if (drag.fxKind === 'light') {
          if (!snapStepLightToSurface(it as Light, f.walls, f.furniture) &&
              !snapFireplaceToWall(it as Light, f.walls) &&
              !snapFloodlightToWall(it as Light, f.walls))
            snapExhaustToWall(it as Light, f.walls);
        } else {
          snapSwitchToWall(it, f.switches, f.walls);
        }
        p.save();
      }
    }
  } else if (drag.kind === 'wallMove') {
    const w = f.walls.find(x => x.id === drag.wallId);
    if (w) connectWallEnds(f, w, true);
    p.save();
  } else if (drag.kind === 'furnMove' || drag.kind === 'furnCorner') {
    const piece = f.furniture[drag.idx];
    if (piece) {
      // Stove/oven click-vs-drag: a barely-moved single click toggles the oven
      // door (persistent doorOpen) instead of nudging the piece.
      const barelyMoved = drag.kind === 'furnMove' &&
        Math.hypot(piece.x - drag.start.x, piece.y - drag.start.y) < 30;
      const stoveClick = drag.kind === 'furnMove' && piece.kind === 'stove' && barelyMoved;
      // Curbside bins: a barely-moved click toggles full/empty (bound entity or
      // unbound localState) instead of nudging the piece.
      const binClick = drag.kind === 'furnMove' && isBinKind(piece.kind) && barelyMoved;
      // Sinks: a barely-moved click runs/stops the water (bound entity or unbound
      // localState) instead of nudging the piece.
      const sinkClick = drag.kind === 'furnMove' && isSinkKind(piece.kind) && barelyMoved;
      if (stoveClick && drag.kind === 'furnMove') {
        piece.x = drag.start.x; piece.y = drag.start.y;
        piece.doorOpen = !piece.doorOpen;
      } else if ((binClick || sinkClick) && drag.kind === 'furnMove') {
        piece.x = drag.start.x; piece.y = drag.start.y;
        p.toggleItem(piece);
      } else {
        snapStairEdges(f, piece);
        snapFurnitureToSurface(f, piece, p.store.customObjects);
        // Keep the piece off wall slabs (edge locks flush to the wall face).
        // Mounted-on-surface items follow their host; locked pieces never move.
        if (!piece.locked && !piece.mountOnId) {
          resolveFurnitureWallCollision(piece, f.walls);
          // Then keep a tucked seat from sinking into the tabletop it serves.
          resolveSeatTableCollision(piece, f.furniture, p.store.customObjects);
        }
        if (drag.kind === 'furnMove') {
          // Group-move: a moved table/desk carries the chairs tucked to it.
          carryTuckedSeatsWithTable(f, piece, drag.start, p.store.customObjects);
          // Live-parent: re-settle a moved surface host's mounted pieces onto
          // its top (they followed the host live; this re-affirms elevation /
          // mountOnId). Locked mounted pieces stayed put — skip them.
          if (resolveFurnitureDef(piece, p.store.customObjects).surface) {
            for (const m of f.furniture) {
              if (m.mountOnId === piece.id && !m.locked) {
                snapFurnitureToSurface(f, m, p.store.customObjects);
              }
            }
          }
        }
      }
    }
    p.save();
  } else if (drag.kind === 'bgMove' || drag.kind === 'bgCorner') {
    p.save();
  } else if (drag.kind === 'floorEdge') {
    // Round the final dims to the grid (translation already applied live). The
    // 100 mm content margin absorbs the <=50 mm rounding so nothing strands.
    // configRev (emitConfig below) flows to _keyFloor → 3D + nav rebuild.
    f.w = snap(f.w, GRID_MM); f.d = snap(f.d, GRID_MM);
    p.save();
  } else if (drag.kind === 'doorMove') {
    const door = f.doors[drag.idx];
    if (door) {
      // Click-vs-drag: tiny movement toggles the door's bound entity (or, when
      // unbound, its local control state).
      const moved = Math.hypot(door.x - drag.start.x, door.y - drag.start.y);
      if (moved < 30) {
        door.x = drag.start.x; door.y = drag.start.y;
        p.toggleItem(door);
      } else {
        door.x = snap(door.x, 10); door.y = snap(door.y, 10);
        snapOpeningToWall(f, door);
        // Silent gate default when a still-kindless door lands on a fence/hedge.
        if (door.kind == null && isFenceLikeKind(nearestWallKind(f, door.x, door.y))) door.kind = 'gate';
        p.save();
      }
    }
  } else if (drag.kind === 'doorLock') {
    const door = f.doors[drag.idx];
    if (door) p.toggleDoorLock(door);
  } else if (drag.kind === 'doorRotate') {
    p.save();
  } else if (drag.kind === 'windowMove') {
    const win = f.windows[drag.idx];
    if (win) {
      const moved = Math.hypot(win.x - drag.start.x, win.y - drag.start.y);
      if (moved < 30) {
        win.x = drag.start.x; win.y = drag.start.y;
        p.toggleItem(win);
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

  // View-only: pure visualization, clicks do nothing.
  if (p.uiMode === 'view') return;
  // Kiosk: clicks interact with devices (toggle) but never edit.
  if (p.uiMode === 'kiosk') {
    const fx2 = hitFixture(p, mm, Math.max(250, hitPx(view) * 3));
    if (fx2) {
      const it = (fx2.kind === 'light' ? f.lights : f.switches)[fx2.idx];
      if (it) p.toggleItem(it);
      return;
    }
    // Action button → fire the configured HA service (kiosk fires; view refuses).
    const abHit2 = hitActionButton(p, view, mm);
    if (abHit2) { p.fireAction(abHit2); return; }
    // Alarm keypad → open the control/status modal (device interaction, not edit).
    const aHit2 = hitAlarmPanel(p, view, mm);
    if (aHit2) { openAlarmModal(canvas, aHit2.id); return; }
    // Thermostat → open the climate control modal.
    const tHit2 = hitThermostat(p, view, mm);
    if (tHit2) { openThermostatModal(canvas, tHit2.id); return; }
    // Siren → toggle (bound siren.*/switch.* or unbound localState). Smoke/CO/
    // gas/leak detector → unbound: manual test trigger; bound: display-only.
    const safe2 = hitSafetySensor(p, view, mm);
    if (safe2) {
      if (safe2.kind === 'siren') p.triggerSiren(safe2);
      else if (!safe2.entity_id) p.toggleItem(safe2);
      return;
    }
    // Alert beacon → acknowledge (bound alert.*) or demo-flip (unbound).
    const ab2 = hitAlertBeacon(p, view, mm);
    if (ab2) { p.acknowledgeAlertBeacon(ab2); return; }
    // Robot → run/dock (bound) or demo toggle (unbound).
    const robo2 = hitRobot(p, view, mm);
    if (robo2) { p.toggleRobot(robo2); return; }
    // Projector → toggle projecting (bound entity / unbound localState).
    const proj2 = hitProjector(p, view, mm);
    if (proj2) { p.toggleItem(proj2); return; }
    // Water valve → open/close (toggleValve gates allowControl + domain dispatch).
    const val2 = hitValve(p, view, mm);
    if (val2) { p.toggleValve(val2); return; }
    // Sprinkler head → toggle (bound switch/valve via toggleEntity, or unbound flip).
    const spr2 = hitSprinklerZone(p, view, mm);
    if (spr2) { p.toggleItem(spr2); return; }
    // Smart plug → toggle the outlet (like a switch), gated by allowControl.
    const plug2 = hitPlug(p, view, mm);
    if (plug2) { if (plug2.allowControl !== false) p.toggleItem(plug2); return; }
    // Door lock padlock → toggle the lock (bound service / unbound session flag).
    const dLock2 = hitDoorLock(p, view, mm);
    if (dLock2) { p.toggleDoorLock(dLock2.door); return; }
    const dHit2 = hitDoor(p, view, mm);
    if (dHit2) { p.toggleItem(dHit2.door); return; }
    const wHit2 = hitWindow(p, view, mm);
    if (wHit2) { p.toggleItem(wHit2.win); return; }
    // Stove/oven → toggle the oven door (session-only in kiosk; save() no-ops).
    const fu2 = hitFurniture(p, mm);
    if (fu2 && fu2.item.kind === 'stove') {
      fu2.item.doorOpen = !fu2.item.doorOpen; p.save(); p.emitConfig(); return;
    }
    // Bins → toggle full/empty (session-only in kiosk; save() no-ops).
    if (fu2 && isBinKind(fu2.item.kind)) { p.toggleItem(fu2.item); return; }
    // Sinks → run/stop the water (session-only in kiosk; save() no-ops).
    if (fu2 && isSinkKind(fu2.item.kind)) { p.toggleItem(fu2.item); return; }
    // Valetudo room segment → tap-to-clean (lowest priority, after all fixtures).
    if (tryVacuumSegmentClean(p, mm)) return;
    return;
  }

  // Room-placement latch: the next click sets a room's anchor (Rooms UI). New
  // rooms are created UNNAMED — the canvas immediately shows an "Unnamed room"
  // placeholder at the enclosing loop's centroid (or a "not enclosed" warning
  // at the anchor), so the user gets instant feedback on wall enclosure and
  // names the room in the sidebar. Re-placing an existing room just moves its
  // anchor.
  if (p.placingRoomId) {
    const anchor = { x: Math.round(mm.x), y: Math.round(mm.y) };
    if (p.placingRoomId === NEW_ROOM) {
      if (!f.rooms) f.rooms = [];
      f.rooms.push({ id: newId('rm'), name: '', anchor });
    } else {
      const rm = (f.rooms ?? []).find(r => r.id === p.placingRoomId);
      if (rm) rm.anchor = anchor;
    }
    p.placingRoomId = null;
    p.save(); p.emitConfig();
    return;
  }

  // Geo-landmark placement latch (GPS / Geo UI): the next click places a pin.
  // NEW_LANDMARK creates a fresh (uncalibrated) landmark; an existing id
  // re-places that pin. Landmarks are store-level (property-wide).
  if (p.placingLandmarkId) {
    if (p.placingLandmarkId === NEW_LANDMARK) {
      p.addGeoLandmark(mm.x, mm.y);
    } else {
      const id = p.placingLandmarkId;
      p.updateLandmark(id, l => { l.x = Math.round(mm.x); l.y = Math.round(mm.y); });
    }
    p.placingLandmarkId = null;
    p.emitConfig();
    return;
  }

  // Camera ground-calibration latch (Phase 5): the sidebar staged a pixel (u,v)
  // by clicking the snapshot; this click records the matching floor (x,y) and
  // pushes the {u,v,x,y} correspondence onto the camera's camCalib.points.
  if (p.placingCamCalibId && p.pendingCamCalibUV) {
    const cam = (f.cameras ?? []).find(c => c.id === p.placingCamCalibId);
    if (cam) {
      if (!cam.camCalib) cam.camCalib = { points: [] };
      cam.camCalib.points.push({
        u: p.pendingCamCalibUV.u, v: p.pendingCamCalibUV.v,
        x: Math.round(mm.x), y: Math.round(mm.y),
      });
      p.save();
      p.ensureFrigateSub();
    }
    p.placingCamCalibId = null; p.pendingCamCalibUV = null;
    p.emitConfig();
    return;
  }

  // Valetudo room segment → tap-to-clean (edit + select). Low priority: draggable
  // fixtures start a drag on mousedown, so their click is swallowed by
  // dragJustEnded and never reaches here — the segment tap only fires on a click
  // that hit no draggable item. Only active when the vacuumMap overlay is on.
  if (p.tool === 'select' && tryVacuumSegmentClean(p, mm)) return;

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
    p.store.activeSensorId = id; p.markNewlyPlaced("sensor", id);
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
    p.activeMotionId = id; p.markNewlyPlaced("motion", id);
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
    p.activeEnvId = id; p.markNewlyPlaced("env", id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'infocard') {
    const id = newId('ic');
    const ic = {
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      mount: 'wall' as const, displayMode: 'entity' as const, entity_id: null,
      label: `Info ${(f.infoCards ?? []).length + 1}`,
    };
    snapInfoCardToWall(ic, f.walls);   // flush to a wall on drop (default wall mount)
    (f.infoCards ??= []).push(ic);
    p.activeInfoId = id; p.markNewlyPlaced("info", id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'action') {
    const id = newId('act');
    const ab = {
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      wallMount: true, actionKind: 'toggle' as const, entity_id: null,
      label: `Action ${(f.actionButtons ?? []).length + 1}`,
    };
    snapActionButtonToWall(ab, f.walls);   // flush to a wall on drop (default wall mount)
    (f.actionButtons ??= []).push(ab);
    p.activeActionId = id; p.markNewlyPlaced("action", id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'bleproxy') {
    if (!f.bleProxies) f.bleProxies = [];
    const id = newId('ble');
    f.bleProxies.push({
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      name: `Proxy ${f.bleProxies.length + 1}`, haDeviceId: null,
    });
    p.activeBleId = id; p.markNewlyPlaced("ble", id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'alarm') {
    if (!f.alarmPanels) f.alarmPanels = [];
    const id = newId('al');
    const ap = {
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      entity_id: null, label: `Alarm ${f.alarmPanels.length + 1}`,
    };
    snapAlarmToWall(ap, f.walls);   // flush to a wall on drop, like a switch
    f.alarmPanels.push(ap);
    p.activeAlarmId = id; p.markNewlyPlaced("alarm", id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'calendar') {
    if (!f.calendarPanels) f.calendarPanels = [];
    const id = newId('cal');
    const cp = {
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      calendarIds: [] as string[], label: `Calendar ${f.calendarPanels.length + 1}`,
    };
    snapCalendarToWall(cp, f.walls);   // flush to a wall on drop, like a switch
    f.calendarPanels.push(cp);
    p.activeCalendarId = id; p.markNewlyPlaced("calendar", id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'thermostat') {
    if (!f.thermostats) f.thermostats = [];
    const id = newId('th');
    const th = {
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      entity_id: null, allowControl: true, label: `Thermostat ${f.thermostats.length + 1}`,
    };
    snapThermostatToWall(th, f.walls);   // flush to a wall on drop, like a switch
    f.thermostats.push(th);
    p.activeThermoId = id; p.markNewlyPlaced("thermo", id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'safety') {
    if (!f.safetySensors) f.safetySensors = [];
    const id = newId('sf');
    // Ceiling-mounted: free placement (no wall snap). Defaults to a SMOKE
    // detector; the sidebar row switches kind to CO.
    f.safetySensors.push({
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      kind: 'smoke', entity_id: null,
      label: `Detector ${f.safetySensors.length + 1}`,
    });
    p.activeSafetyId = id; p.markNewlyPlaced("safety", id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'alertbeacon') {
    if (!f.alertBeacons) f.alertBeacons = [];
    const id = newId('ab');
    // Ceiling-mounted: free placement (no wall snap), like the safety detector.
    f.alertBeacons.push({
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      entity_id: null,
      label: `Alert ${f.alertBeacons.length + 1}`,
    });
    p.activeAlertBeaconId = id; p.markNewlyPlaced("alertbeacon", id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'robot') {
    if (!f.robots) f.robots = [];
    const id = newId('ro');
    // Free placement — the click point is the DOCK. Defaults to a VACUUM; the
    // sidebar kind dropdown switches to a mower (typically placed outside walls).
    f.robots.push({
      id,
      x: snap(mm.x, 10), y: snap(mm.y, 10),
      kind: 'vacuum', entity_id: null,
      label: `Robot ${f.robots.length + 1}`,
    });
    p.activeRobotId = id; p.markNewlyPlaced("robot", id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'camera') {
    if (!f.cameras) f.cameras = [];
    const id = newId('cam');
    // Free placement (wall/eave-mount). Rotate via the handle afterward.
    f.cameras.push({
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      rotation: 0, entity_id: null,
      label: `Camera ${f.cameras.length + 1}`,
    });
    p.activeCameraId = id; p.markNewlyPlaced("camera", id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'projector') {
    if (!f.projectors) f.projectors = [];
    const id = newId('proj');
    // Free ceiling/shelf placement. Aim it via the sidebar screen picker / rotation.
    f.projectors.push({
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      rotation: 0, entity_id: null,
      label: `Projector ${f.projectors.length + 1}`,
    });
    p.activeProjectorId = id; p.markNewlyPlaced("projector", id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'valve') {
    if (!f.valves) f.valves = [];
    const id = newId('vl');
    // Free placement — the click point is the valve on a floor pipe run.
    f.valves.push({
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      rotation: 0, entity_id: null, allowControl: true,
      label: `Valve ${f.valves.length + 1}`,
    });
    p.activeValveId = id; p.markNewlyPlaced("valve", id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'sprinkler') {
    if (!f.sprinklerZones) f.sprinklerZones = [];
    const id = newId('spr');
    // Free placement — the click point is the head (sits inside a lawn area).
    f.sprinklerZones.push({
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      entity_id: null,
      zoneNumber: f.sprinklerZones.length + 1,
    });
    p.activeSprinklerId = id; p.markNewlyPlaced("sprinkler", id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'flagpole') {
    if (!f.flagpoles) f.flagpoles = [];
    const id = newId('flag');
    // Free placement — the click point is the pole base (a yard prop).
    f.flagpoles.push({
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      flag: 'usa',
      label: `Flagpole ${f.flagpoles.length + 1}`,
    });
    p.activeFlagpoleId = id; p.markNewlyPlaced("flagpole", id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'plug') {
    if (!f.plugs) f.plugs = [];
    const id = newId('pg');
    const pg = {
      id,
      x: snap(Math.max(0, Math.min(f.w, mm.x)), 10),
      y: snap(Math.max(0, Math.min(f.d, mm.y)), 10),
      entity_id: null, allowControl: true,
      label: `Plug ${f.plugs.length + 1}`,
    };
    snapPlugToWall(pg, f.walls);   // flush to a wall on drop, like a switch
    f.plugs.push(pg);
    p.activePlugId = id; p.markNewlyPlaced("plug", id);
    p.save();
    p.setTool('select');
    p.emitConfig();
    return;
  }
  if (p.tool === 'pzone') {
    // Polygon draw latch (mirrors the wall tool): each click appends a world-mm
    // vertex; double-click finishes (≥3 pts). No angle snap — presence zones are
    // free-form regions.
    const v = { x: snap(mm.x, 10), y: snap(mm.y, 10) };
    if (!p.drawingPresenceZone) p.drawingPresenceZone = { points: [v] };
    else p.drawingPresenceZone.points.push(v);
    p.emitConfig();
    return;
  }
  if (p.tool === 'ground') {
    // Ground-area polygon draw latch (mirrors the pzone tool): each click appends
    // a world-mm vertex; double-click / Enter finishes (≥3 pts, capped at 20).
    const v = { x: snap(mm.x, 10), y: snap(mm.y, 10) };
    if (!p.drawingGroundArea) p.drawingGroundArea = { points: [v] };
    else if (p.drawingGroundArea.points.length < 20) p.drawingGroundArea.points.push(v);
    p.emitConfig();
    return;
  }
  if (p.tool === 'path') {
    // Path/driveway CENTERLINE draw latch (T4): each click appends a centerline
    // point; double-click / Enter finishes (≥2 pts). finishPath() then buffers it
    // into a plain path-backed GroundArea polygon.
    const v = { x: snap(mm.x, 10), y: snap(mm.y, 10) };
    if (!p.drawingPath) p.drawingPath = { points: [v] };
    else if (p.drawingPath.points.length < 40) p.drawingPath.points.push(v);
    p.emitConfig();
    return;
  }
  if (p.tool === 'pool') {
    // Pool/spa polygon draw latch (mirrors the ground tool): each click appends a
    // world-mm vertex; double-click / Enter finishes (≥3 pts, capped at 20).
    const v = { x: snap(mm.x, 10), y: snap(mm.y, 10) };
    if (!p.drawingPoolArea) p.drawingPoolArea = { points: [v] };
    else if (p.drawingPoolArea.points.length < 20) p.drawingPoolArea.points.push(v);
    p.emitConfig();
    return;
  }
  if (p.tool === 'void') {
    // Void-area polygon draw latch (mirrors the ground tool): each click appends
    // a world-mm vertex; double-click / Enter finishes (≥3 pts, capped at 12).
    const v = { x: snap(mm.x, 10), y: snap(mm.y, 10) };
    if (!p.drawingVoidArea) p.drawingVoidArea = { points: [v] };
    else if (p.drawingVoidArea.points.length < 12) p.drawingVoidArea.points.push(v);
    p.emitConfig();
    return;
  }
  if (p.tool === 'nbhd_excl') {
    // Neighborhood exclusion polygon draw latch (mirrors the void tool): each
    // click appends a world-mm vertex; double-click / Enter finishes (3–12 pts).
    const v = { x: snap(mm.x, 10), y: snap(mm.y, 10) };
    if (!p.drawingExclusion) p.drawingExclusion = { points: [v] };
    else if (p.drawingExclusion.points.length < 12) p.drawingExclusion.points.push(v);
    p.emitConfig();
    return;
  }
  if (p.tool === 'ruler') {
    // Two-click placement latch. Each click resolves to a wall / furniture
    // anchor or a free point (rulerEndAt). First click sets end A; second click
    // sets B + creates the ruler, staying armed for the next ruler.
    const end = rulerEndAt(p, mm);
    if (!p.drawingRuler) { p.drawingRuler = { a: end }; p.emitConfig(); }
    else { p.addRuler(p.drawingRuler.a, end); p.drawingRuler = null; }
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
    // A pending custom object drops a recipe instance (kind stays 'block' as a
    // fallback); otherwise the built-in pending kind.
    const rec = p.pendingCustomObjectId
      ? p.store.customObjects?.find(o => o.id === p.pendingCustomObjectId)
      : undefined;
    const kind = p.pendingFurnitureKind;
    const def = rec ?? FURNITURE_KINDS[kind];
    const elev0 = rec ? 0 : defaultFurnitureElevation(kind);
    const piece: Furniture = {
      id: newId('fu'),
      x: snap(mm.x, 10), y: snap(mm.y, 10),
      w: def.w, h: def.h, label: '', kind: rec ? 'block' : kind,
      ...(rec ? { customKindId: rec.id } : {}),
      ...(elev0 ? { elevation: elev0 } : {}),
    };
    f.furniture.push(piece);
    p.activeFurnitureId = piece.id; p.markSelectionHot();
    snapStairEdges(f, piece);
    snapFurnitureToSurface(f, piece, p.store.customObjects);
    if (!piece.locked && !piece.mountOnId) {
      resolveFurnitureWallCollision(piece, f.walls);
      resolveSeatTableCollision(piece, f.furniture, p.store.customObjects);
    }
    p.save(); p.setTool('select'); p.emitConfig(); return;
  }
  if (p.tool === 'light') {
    const lt: Light = { id: newId('lt'), x: snap(mm.x, 10), y: snap(mm.y, 10), entity_id: null, label: '' };
    // Visual toolbar can pre-pick a light icon kind; default 'bulb' = the
    // classic drop (the snap helpers below only bite for step/fireplace/etc).
    if (p.pendingLightKind && p.pendingLightKind !== 'bulb') lt.iconKind = p.pendingLightKind;
    // Both no-op unless the fixture is a step light / fireplace (freshly dropped
    // lights default to 'bulb', so these bite once the kind is set + the piece
    // is dragged; kept here so a directly-typed kind snaps on drop too).
    if (!snapStepLightToSurface(lt, f.walls, f.furniture) && !snapFireplaceToWall(lt, f.walls) &&
        !snapFloodlightToWall(lt, f.walls))
      snapExhaustToWall(lt, f.walls);
    f.lights.push(lt);
    p.save(); p.setTool('select'); p.emitConfig(); return;
  }
  if (p.tool === 'switch') {
    const swt = { id: newId('sw'), x: snap(mm.x, 10), y: snap(mm.y, 10), entity_id: null, label: '' };
    snapSwitchToWall(swt, f.switches, f.walls);  // wall snap + gang on drop
    f.switches.push(swt);
    p.save(); p.setTool('select'); p.emitConfig(); return;
  }
  if (p.tool === 'door') {
    const d: { id: string; x: number; y: number; w: number; rotation: number;
               entity_id: null; label: string; kind?: 'swing' | 'garage' | 'gate' } = {
      id: newId('dr'),
      x: snap(mm.x, 10), y: snap(mm.y, 10),
      w: 800, rotation: 0, entity_id: null, label: '',
    };
    // Visual toolbar can pre-pick a door kind (swing/garage/gate); default
    // 'swing' keeps the classic drop (incl. the fence→gate auto below).
    if (p.pendingDoorKind && p.pendingDoorKind !== 'swing') {
      d.kind = p.pendingDoorKind;
      if (p.pendingDoorKind === 'garage') d.w = 2400;   // garage default span
    }
    snapOpeningToWall(f, d);
    // A fresh door snapped onto a fence/hedge run defaults to a gate (silent;
    // one-click override in the Doors Kind dropdown). Pinned decision 5.
    if (!d.kind && isFenceLikeKind(nearestWallKind(f, d.x, d.y))) d.kind = 'gate';
    f.doors.push(d);
    p.save(); p.setTool('select'); p.emitConfig(); return;
  }
  if (p.tool === 'window') {
    const wn: { id: string; x: number; y: number; w: number; rotation: number;
                entity_id: null; label: string; kind?: WindowKind } = {
      id: newId('wn'),
      x: snap(mm.x, 10), y: snap(mm.y, 10),
      w: 1000, rotation: 0, entity_id: null, label: '',
    };
    // Visual toolbar can pre-pick a window kind; default 'single' = classic.
    if (p.pendingWindowKind && p.pendingWindowKind !== 'single') wn.kind = p.pendingWindowKind;
    snapOpeningToWall(f, wn);
    f.windows.push(wn);
    p.save(); p.setTool('select'); p.emitConfig(); return;
  }
  if (p.tool === 'delete') {
    const ichit = hitInfoCard(p, view, mm);
    if (ichit) {
      if (ichit.locked) return;
      f.infoCards = (f.infoCards ?? []).filter(x => x.id !== ichit.id);
      if (p.activeInfoId === ichit.id) p.activeInfoId = null;
      p.save(); p.emitConfig(); return;
    }
    const abhit = hitActionButton(p, view, mm);
    if (abhit) {
      if (abhit.locked) return;
      f.actionButtons = (f.actionButtons ?? []).filter(x => x.id !== abhit.id);
      if (p.activeActionId === abhit.id) p.activeActionId = null;
      p.save(); p.emitConfig(); return;
    }
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
    const bhit = hitBleProxy(p, view, mm);
    if (bhit) {
      if (bhit.locked) return;
      f.bleProxies = (f.bleProxies ?? []).filter(x => x.id !== bhit.id);
      if (p.activeBleId === bhit.id) p.activeBleId = null;
      p.save(); p.emitConfig(); return;
    }
    const ahit = hitAlarmPanel(p, view, mm);
    if (ahit) {
      if (ahit.locked) return;
      f.alarmPanels = (f.alarmPanels ?? []).filter(x => x.id !== ahit.id);
      if (p.activeAlarmId === ahit.id) p.activeAlarmId = null;
      p.save(); p.emitConfig(); return;
    }
    const cphit = hitCalendarPanel(p, view, mm);
    if (cphit) {
      if (cphit.locked) return;
      f.calendarPanels = (f.calendarPanels ?? []).filter(x => x.id !== cphit.id);
      if (p.activeCalendarId === cphit.id) p.activeCalendarId = null;
      p.save(); p.emitConfig(); return;
    }
    const thit = hitThermostat(p, view, mm);
    if (thit) {
      if (thit.locked) return;
      f.thermostats = (f.thermostats ?? []).filter(x => x.id !== thit.id);
      if (p.activeThermoId === thit.id) p.activeThermoId = null;
      p.save(); p.emitConfig(); return;
    }
    const safeHit = hitSafetySensor(p, view, mm);
    if (safeHit) {
      if (safeHit.locked) return;
      f.safetySensors = (f.safetySensors ?? []).filter(x => x.id !== safeHit.id);
      if (p.activeSafetyId === safeHit.id) p.activeSafetyId = null;
      p.save(); p.emitConfig(); return;
    }
    const abHit = hitAlertBeacon(p, view, mm);
    if (abHit) {
      if (abHit.locked) return;
      f.alertBeacons = (f.alertBeacons ?? []).filter(x => x.id !== abHit.id);
      if (p.activeAlertBeaconId === abHit.id) p.activeAlertBeaconId = null;
      p.save(); p.emitConfig(); return;
    }
    const roHit = hitRobot(p, view, mm);
    if (roHit) {
      if (roHit.locked) return;
      f.robots = (f.robots ?? []).filter(x => x.id !== roHit.id);
      delete p.robotStates[roHit.id];
      if (p.activeRobotId === roHit.id) p.activeRobotId = null;
      p.save(); p.emitConfig(); return;
    }
    const camHit = hitCamera(p, view, mm);
    if (camHit) {
      if (camHit.locked) return;
      f.cameras = (f.cameras ?? []).filter(x => x.id !== camHit.id);
      if (p.activeCameraId === camHit.id) p.activeCameraId = null;
      p.save(); p.emitConfig(); return;
    }
    const projHit = hitProjector(p, view, mm);
    if (projHit) {
      if (projHit.locked) return;
      f.projectors = (f.projectors ?? []).filter(x => x.id !== projHit.id);
      if (p.activeProjectorId === projHit.id) p.activeProjectorId = null;
      p.save(); p.emitConfig(); return;
    }
    const valHit = hitValve(p, view, mm);
    if (valHit) {
      if (valHit.locked) return;
      f.valves = (f.valves ?? []).filter(x => x.id !== valHit.id);
      if (p.activeValveId === valHit.id) p.activeValveId = null;
      p.save(); p.emitConfig(); return;
    }
    const plugHit = hitPlug(p, view, mm);
    if (plugHit) {
      if (plugHit.locked) return;
      f.plugs = (f.plugs ?? []).filter(x => x.id !== plugHit.id);
      if (p.activePlugId === plugHit.id) p.activePlugId = null;
      p.save(); p.emitConfig(); return;
    }
    const sprDel = hitSprinklerZone(p, view, mm);
    if (sprDel) {
      if (sprDel.locked) return;
      f.sprinklerZones = (f.sprinklerZones ?? []).filter(x => x.id !== sprDel.id);
      if (p.activeSprinklerId === sprDel.id) p.activeSprinklerId = null;
      p.save(); p.emitConfig(); return;
    }
    const flagDel = hitFlagpole(p, view, mm);
    if (flagDel) {
      if (flagDel.locked) return;
      f.flagpoles = (f.flagpoles ?? []).filter(x => x.id !== flagDel.id);
      if (p.activeFlagpoleId === flagDel.id) p.activeFlagpoleId = null;
      p.save(); p.emitConfig(); return;
    }
    if (zonesInteractive(p)) {
      const pzHit = hitPresenceZone(p, view, mm);
      if (pzHit) {
        if (pzHit.locked) return;
        f.presenceZones = (f.presenceZones ?? []).filter(x => x.id !== pzHit.id);
        if (p.activePZoneId === pzHit.id) p.activePZoneId = null;
        p.save(); p.emitConfig(); return;
      }
    }
    // Ruler — delete via its endpoint handle or its body (thin overlay, so it
    // wins early). Only while the dimensions layer is on.
    if (dimsInteractive(p)) {
      const reHit = hitRulerEnd(p, view, mm);
      const rbHit = reHit ? reHit.ruler : hitRulerBody(p, view, mm);
      if (rbHit) {
        if (rbHit.locked) return;
        p.deleteRuler(rbHit.id);
        return;
      }
    }
    const sh = hitSensor(p, view, mm);
    // (ground-area delete is handled lower, after item hits, so the delete tool
    // still reaches items resting on a ground area first.)
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
    // Pools / ground / voids — lowest delete priority (paint under everything).
    // Pool BEFORE ground so a pool drawn over a grass area deletes the pool first
    // (matches the select-hit order).
    if (groundInteractive(p)) {
      const plHit = hitPool(p, view, mm);
      if (plHit) {
        if (plHit.locked) return;
        f.pools = (f.pools ?? []).filter(x => x.id !== plHit.id);
        if (p.activePoolId === plHit.id) p.activePoolId = null;
        p.save(); p.emitConfig(); return;
      }
      const gHit = hitGroundArea(p, view, mm);
      if (gHit) {
        if (gHit.locked) return;
        f.groundAreas = (f.groundAreas ?? []).filter(x => x.id !== gHit.id);
        if (p.activeGroundAreaId === gHit.id) p.activeGroundAreaId = null;
        p.save(); p.emitConfig(); return;
      }
      // Void areas — same lowest delete priority.
      const vHit = hitVoidArea(p, view, mm);
      if (vHit) {
        if (vHit.locked) return;
        f.voidAreas = (f.voidAreas ?? []).filter(x => x.id !== vHit.id);
        if (p.activeVoidAreaId === vHit.id) p.activeVoidAreaId = null;
        p.save(); p.emitConfig(); return;
      }
    }
  }
  if (p.tool === 'select') {
    // Fixture toggle is handled in mouseup (small-movement = click). The
    // click event itself is suppressed by `dragJustEnded`. So here we just
    // handle the empty-space deselect.
    if (!hitSensor(p, view, mm) &&
        !(zonesInteractive(p) && (hitVertexOrZone(p, view, mm) || hitObject(p, view, mm))) &&
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

// Dblclick on a TV / wall_tv furniture piece with a bound entity → open the
// media control modal. Returns true if it consumed the event. Unbound TVs (and
// non-TV furniture) return false so the caller keeps its normal handling.
function dblClickMediaFurniture(p: Planner, canvas: HTMLCanvasElement, mm: Vec2): boolean {
  const fh = hitFurniture(p, mm);
  if (!fh) return false;
  const fu = fh.item;
  if ((fu.kind !== 'tv' && fu.kind !== 'wall_tv') || !fu.entity_id) return false;
  canvas.dispatchEvent(new CustomEvent('open-media-config', {
    bubbles: true, composed: true, detail: { entityId: fu.entity_id },
  }));
  return true;
}

export function onCanvasDblClick(p: Planner, canvas: HTMLCanvasElement, view: View, e: MouseEvent): void {
  const mm = pxToMm(canvas, view, e);
  if (p.uiMode === 'view') return;
  if (p.uiMode === 'kiosk') {
    // Device interaction only: dblclick a bound light opens its
    // color/brightness config (an HA control, not an edit). Nothing else.
    const fx3 = hitFixture(p, mm, Math.max(250, 18 / Math.max(view.scale, 1e-9)));
    if (fx3) {
      const it = (fx3.kind === 'light' ? p.floor().lights : p.floor().switches)[fx3.idx];
      if (it && p.isLightEntity(it.entity_id)) {
        canvas.dispatchEvent(new CustomEvent('open-light-config', {
          bubbles: true, composed: true, detail: { entityId: it.entity_id },
        }));
      }
      return;
    }
    // Bound TV furniture → media controls.
    if (dblClickMediaFurniture(p, canvas, mm)) return;
    return;
  }
  if (p.editZone) { finishZoneEdit(p); return; }
  if (p.tool === 'pzone' && p.drawingPresenceZone) {
    if (p.drawingPresenceZone.points.length >= 3) p.finishPresenceZone();
    else { p.drawingPresenceZone = null; p.emitConfig(); }
    p.setTool('select');
    return;
  }
  if (p.tool === 'ground' && p.drawingGroundArea) {
    if (p.drawingGroundArea.points.length >= 3) p.finishGroundArea();
    else { p.drawingGroundArea = null; p.emitConfig(); }
    p.setTool('select');
    return;
  }
  if (p.tool === 'path' && p.drawingPath) {
    if (p.drawingPath.points.length >= 2) p.finishPath();
    else { p.drawingPath = null; p.emitConfig(); }
    p.setTool('select');
    return;
  }
  if (p.tool === 'pool' && p.drawingPoolArea) {
    if (p.drawingPoolArea.points.length >= 3) p.finishPoolArea();
    else { p.drawingPoolArea = null; p.emitConfig(); }
    p.setTool('select');
    return;
  }
  if (p.tool === 'void' && p.drawingVoidArea) {
    if (p.drawingVoidArea.points.length >= 3) p.finishVoidArea();
    else { p.drawingVoidArea = null; p.emitConfig(); }
    p.setTool('select');
    return;
  }
  if (p.tool === 'nbhd_excl' && p.drawingExclusion) {
    if (p.drawingExclusion.points.length >= 3) p.finishExclusion();
    else { p.drawingExclusion = null; p.emitConfig(); }
    p.setTool('select');
    return;
  }
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
  // Bound TV furniture → media controls (same modal as kiosk). Non-TV
  // furniture falls through to the existing sensor/wall dblclick behavior.
  if (dblClickMediaFurniture(p, canvas, mm)) return;
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
  if (sa && zonesInteractive(p)) {
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
