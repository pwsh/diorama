import { switchSize, distMM, pointToSeg, transformVerts, centroid, localToWorld,
         bgLocalToWorld, bgWorldToLocal, furnitureWorldToLocal,
         furnitureCorners, furnitureLocalToWorld, doorEndpoint,
         doorOpenDeltaDeg, windowEndpoints, pointInPolygon, SPRINKLER_DEFAULTS } from './geometry.js';
import type { Planner } from './planner.js';
import type { Vec2, Wall, Sensor, Furniture, BgImage, MotionSensor, EnvSensor, BleProxy, AlarmPanel, CalendarPanel, ThermostatFixture, SafetySensor, AlertBeacon, RobotFixture, CameraFixture, ProjectorFixture, ValveFixture, PlugFixture, SprinklerZone, PresenceZone, InfoCard, ActionButton, Door, Window as WindowType, Floor } from './types.js';
import type { FloorEdge } from './geometry.js';
import { envChipHalfPx, infoCardHalfPx, actionButtonHalfPx, type View } from './canvas-render.js';
import { vacMapAffine, vacWorldToPixel, vacSegHasPixel } from './valetudo-map.js';

export function hitPx(view: View): number {
  return Math.max(60, 12 / Math.max(view.scale, 1e-9));
}

// Tap-to-clean hit: which Valetudo room segment (if any) sits under the world
// point. Low-priority — callers run it AFTER every fixture hit (like ground
// areas). Only vacuum robots with a valetudoId + a parsed map are considered.
export function hitVacuumSegment(p: Planner, mm: Vec2):
    { robot: RobotFixture; segId: string; name: string } | null {
  const f = p.floor();
  for (const ro of f.robots ?? []) {
    if (ro.kind !== 'vacuum' || !ro.valetudoId) continue;
    const map = p.vacuumMaps[ro.id];
    if (!map) continue;
    const aff = vacMapAffine(map.pixelSize, ro);
    const px = vacWorldToPixel(mm.x, mm.y, aff);
    if (!px) continue;
    const ix = Math.floor(px.x), iy = Math.floor(px.y);
    for (const seg of map.segments) {
      if (vacSegHasPixel(seg, ix, iy)) {
        return { robot: ro, segId: seg.id, name: seg.name?.trim() || `Room ${seg.id}` };
      }
    }
  }
  return null;
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

// The small padlock glyph near a swing door's hinge (drawn at screen offset
// (-9, -11) dpr from the hinge). Only clickable when the door carries a lock
// binding (bound lockEntity OR unbound lockLocalState). Wins over the door-panel
// hit within its small radius so a lock toggle doesn't also open the door.
export function hitDoorLock(p: Planner, view: View, mm: Vec2): { door: Door; idx: number } | null {
  const f = p.floor();
  const dpr = window.devicePixelRatio || 1;
  const tol = Math.max(60, (11 * dpr) / Math.max(view.scale, 1e-9));
  for (let i = f.doors.length - 1; i >= 0; i--) {
    const d = f.doors[i];
    if ((d.kind ?? 'swing') === 'garage') continue;   // garage doors draw no padlock
    if (!d.lockEntity && !d.lockLocalState) continue;
    // Display-only locks are passive indicators: drop them from hit-testing so
    // the padlock loses its click-priority over the door panel (clicks fall
    // through to open/close) and the hover cursor stays 'grab', not 'pointer'.
    if (d.lockControl === 'display') continue;
    // Screen +Y is world −Y, so the (-9, -11) px screen offset is (−9, +11) px world.
    const cx = d.x - (9 * dpr) / Math.max(view.scale, 1e-9);
    const cy = d.y + (11 * dpr) / Math.max(view.scale, 1e-9);
    if (Math.hypot(mm.x - cx, mm.y - cy) < tol) return { door: d, idx: i };
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

export function hitAlarmPanel(p: Planner, view: View, mm: Vec2): AlarmPanel | null {
  const f = p.floor();
  const h = hitPx(view) * 1.4;
  const list = f.alarmPanels ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (distMM(list[i], mm) < h) return list[i];
  }
  return null;
}

export function hitCalendarPanel(p: Planner, view: View, mm: Vec2): CalendarPanel | null {
  const f = p.floor();
  const h = hitPx(view) * 1.4;
  const list = f.calendarPanels ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (distMM(list[i], mm) < h) return list[i];
  }
  return null;
}

export function hitThermostat(p: Planner, view: View, mm: Vec2): ThermostatFixture | null {
  const f = p.floor();
  const h = hitPx(view) * 1.4;
  const list = f.thermostats ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (distMM(list[i], mm) < h) return list[i];
  }
  return null;
}

export function hitValve(p: Planner, view: View, mm: Vec2): ValveFixture | null {
  const f = p.floor();
  const h = hitPx(view) * 1.8;
  const list = f.valves ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (distMM(list[i], mm) < h) return list[i];
  }
  return null;
}

// Sprinkler head — point-in-circle on the head position (small radius, free
// placement). The running spray wedge is NOT clickable (clicking toggles the
// head, not the water). A fixed-mm floor keeps a tiny head clickable when zoomed out.
export function hitSprinklerZone(p: Planner, view: View, mm: Vec2): SprinklerZone | null {
  const f = p.floor();
  const h = Math.max(hitPx(view) * 1.2, SPRINKLER_DEFAULTS.hitRadiusMm);
  const list = f.sprinklerZones ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (distMM(list[i], mm) < h) return list[i];
  }
  return null;
}

export function hitPlug(p: Planner, view: View, mm: Vec2): PlugFixture | null {
  const f = p.floor();
  const h = hitPx(view) * 1.4;
  const list = f.plugs ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (distMM(list[i], mm) < h) return list[i];
  }
  return null;
}

export function hitActionButton(p: Planner, view: View, mm: Vec2): ActionButton | null {
  const f = p.floor();
  const list = f.actionButtons ?? [];
  const fallback = hitPx(view) * 1.6;
  for (let i = list.length - 1; i >= 0; i--) {
    const b = list[i];
    if (b.hidden) continue;
    // Square plate test against the half-extent (px) drawn last frame; falls back
    // to a radius before the first draw.
    const half = actionButtonHalfPx.get(b.id);
    if (half != null) {
      const pad = 4 * (window.devicePixelRatio || 1);
      const dxPx = Math.abs(mm.x - b.x) * view.scale;
      const dyPx = Math.abs(mm.y - b.y) * view.scale;
      if (dxPx < half + pad && dyPx < half + pad) return b;
    } else if (distMM(b, mm) < fallback) return b;
  }
  return null;
}

export function hitSafetySensor(p: Planner, view: View, mm: Vec2): SafetySensor | null {
  const f = p.floor();
  const h = hitPx(view) * 1.4;
  const list = f.safetySensors ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (distMM(list[i], mm) < h) return list[i];
  }
  return null;
}

export function hitAlertBeacon(p: Planner, view: View, mm: Vec2): AlertBeacon | null {
  const f = p.floor();
  const h = hitPx(view) * 1.4;
  const list = f.alertBeacons ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].hidden) continue;
    if (distMM(list[i], mm) < h) return list[i];
  }
  return null;
}

// Robot fixtures: hit either the DOCK (x,y — the fixture / drag anchor) or the
// live robot body (Planner.robotStates position — moves), so a click lands on
// whichever the user aimed at.
export function hitRobot(p: Planner, view: View, mm: Vec2): RobotFixture | null {
  const f = p.floor();
  const h = hitPx(view) * 1.6;
  const list = f.robots ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    const r = list[i];
    if (distMM(r, mm) < h) return r;
    const rs = p.robotStates[r.id];
    if (rs && Math.hypot(rs.x - mm.x, rs.y - mm.y) < h) return r;
  }
  return null;
}

export function hitCamera(p: Planner, view: View, mm: Vec2): CameraFixture | null {
  const f = p.floor();
  const h = hitPx(view) * 1.4;
  const list = f.cameras ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].hidden) continue;
    if (distMM(list[i], mm) < h) return list[i];
  }
  return null;
}

// Orange rotate handle for the active camera (mirrors the motion-sensor handle).
export function hitCameraRotateHandle(p: Planner, view: View, mm: Vec2): CameraFixture | null {
  const id = p.activeCameraId; if (!id) return null;
  const c = (p.floor().cameras ?? []).find(x => x.id === id);
  if (!c || c.locked) return null;
  const dpr = window.devicePixelRatio || 1;
  const rPx = 28 * dpr;
  const t = (c.rotation || 0) * Math.PI / 180;
  const hx = c.x + Math.sin(t) * rPx / view.scale;
  const hy = c.y + Math.cos(t) * rPx / view.scale;
  return distMM({ x: hx, y: hy }, mm) < hitPx(view) ? c : null;
}

// Projector fixture hit (small point fixture, like a BLE proxy / camera body).
export function hitProjector(p: Planner, view: View, mm: Vec2): ProjectorFixture | null {
  const f = p.floor();
  const h = hitPx(view) * 1.4;
  const list = f.projectors ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].hidden) continue;
    if (distMM(list[i], mm) < h) return list[i];
  }
  return null;
}

// A presence zone is hit when the point is inside its polygon (respect hidden).
export function hitPresenceZone(p: Planner, view: View, mm: Vec2): PresenceZone | null {
  void view;
  const list = p.floor().presenceZones ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    const z = list[i];
    if (z.hidden) continue;
    if (z.points.length >= 3 && pointInPolygon(mm.x, mm.y, z.points)) return z;
  }
  return null;
}

// A draggable vertex handle of the ACTIVE presence zone (mirrors wall-vertex
// editing — vertices are world-mm like wall points). Returns the zone + index.
export function hitPresenceZoneVertex(p: Planner, view: View, mm: Vec2): { zone: PresenceZone; idx: number } | null {
  const id = p.activePZoneId; if (!id) return null;
  const z = (p.floor().presenceZones ?? []).find(x => x.id === id);
  if (!z || z.locked || z.hidden) return null;
  const h = hitPx(view);
  for (let i = 0; i < z.points.length; i++) {
    if (distMM(z.points[i], mm) < h) return { zone: z, idx: i };
  }
  return null;
}

// A ground area is hit when the point is inside its polygon (respect hidden).
// Mirrors hitPresenceZone.
export function hitGroundArea(p: Planner, view: View, mm: Vec2): import('./types.js').GroundArea | null {
  void view;
  const list = p.floor().groundAreas ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    const g = list[i];
    if (g.hidden) continue;
    if (g.points.length >= 3 && pointInPolygon(mm.x, mm.y, g.points)) return g;
  }
  return null;
}

// A draggable vertex handle of the ACTIVE ground area. Mirrors hitPresenceZoneVertex.
export function hitGroundAreaVertex(p: Planner, view: View, mm: Vec2): { area: import('./types.js').GroundArea; idx: number } | null {
  const id = p.activeGroundAreaId; if (!id) return null;
  const g = (p.floor().groundAreas ?? []).find(x => x.id === id);
  if (!g || g.locked || g.hidden) return null;
  const h = hitPx(view);
  for (let i = 0; i < g.points.length; i++) {
    if (distMM(g.points[i], mm) < h) return { area: g, idx: i };
  }
  return null;
}

// A void area is hit when the point is inside its polygon (respect hidden).
// Mirrors hitGroundArea. Low priority — called after all item hits.
export function hitVoidArea(p: Planner, view: View, mm: Vec2): import('./types.js').VoidArea | null {
  void view;
  const list = p.floor().voidAreas ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    const vd = list[i];
    if (vd.hidden) continue;
    if (vd.points.length >= 3 && pointInPolygon(mm.x, mm.y, vd.points)) return vd;
  }
  return null;
}

// A draggable vertex handle of the ACTIVE void area. Mirrors hitGroundAreaVertex.
export function hitVoidAreaVertex(p: Planner, view: View, mm: Vec2): { area: import('./types.js').VoidArea; idx: number } | null {
  const id = p.activeVoidAreaId; if (!id) return null;
  const vd = (p.floor().voidAreas ?? []).find(x => x.id === id);
  if (!vd || vd.locked || vd.hidden) return null;
  const h = hitPx(view);
  for (let i = 0; i < vd.points.length; i++) {
    if (distMM(vd.points[i], mm) < h) return { area: vd, idx: i };
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

export function hitInfoCard(p: Planner, view: View, mm: Vec2): InfoCard | null {
  const f = p.floor();
  const list = f.infoCards ?? [];
  const fallback = hitPx(view) * 2;
  for (let i = list.length - 1; i >= 0; i--) {
    const ic = list[i];
    if (ic.hidden) continue;
    // Rect test against the chip drawn last frame (px extents from canvas-render);
    // falls back to a radius before the first draw.
    const half = infoCardHalfPx.get(ic.id);
    if (half) {
      const pad = 4 * (window.devicePixelRatio || 1);
      const dxPx = Math.abs(mm.x - ic.x) * view.scale;
      const dyPx = Math.abs(mm.y - ic.y) * view.scale;
      if (dxPx < half.w + pad && dyPx < half.h + pad) return ic;
    } else if (distMM(ic, mm) < fallback) return ic;
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
