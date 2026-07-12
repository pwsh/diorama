import {
  GRID_MM, mmToCanvas, fmtLen, distMM, transformVerts, centroid,
  pointInPolygon, localToWorld, bgLocalToWorld,
  lightRadius, lightIntensity, lightIconKind, lightRotation, lightLength, switchRotation, switchSize, switchLabelPos,
  motionColor, motionIntensity, sensorColor, BLE_PROXY_DEFAULTS,
  hexToRgba, lighten, furnitureKind, furnitureCorners, resolveFurnitureDef,
  doorEndpoint, doorOpenDeltaDeg, windowEndpoints, wallCutsForSegment, wallKind,
  ENV_KINDS, envKindOf, envColor, envValueText, envScale,
  closedWallLoops, loopContaining, roomLabel,
} from './geometry.js';
import { compass8 } from './geo.js';
import type { Planner } from './planner.js';
import type { Vec2, LightIconKind, Furniture, ObjectRecipe } from './types.js';

// Default per-target color palette (kept for back-compat; actual color now
// comes from sensorColor(s, idx)).
export const TARGET_COLORS = ['#4fc3f7', '#81c784', '#ffb74d'];
export const COLORS = {
  inclusionFill:   'rgba(33,150,243,0.12)',
  inclusionStroke: 'rgba(33,150,243,0.75)',
  inclusionActive: 'rgba(33,150,243,0.50)',
  filterFill:      'rgba(244,67,54,0.10)',
  filterStroke:    'rgba(244,67,54,0.65)',
  filterActive:    'rgba(244,67,54,0.40)',
  haloIdle:        'rgba(255,152,0,0.30)',
  haloActive:      'rgba(255,152,0,0.70)',
  gridLine:        'rgba(255,255,255,0.06)',
};

const LIGHT_GLYPH: Record<LightIconKind, string> = {
  bulb: '💡', spot: '🔦', pendant: '⚪', sconce: '◐',
  strip: '▬', fireplace: '🔥', lamp: '🪔',
  bowl: '🥣', tiered: '☰', round: '⭕', recessed: '⊙',
  jar: '🫙', oval: '🥚', fan: '❋', fan_light: '✺', string: '✨', under_cabinet: '▂',
  wall_sconce: '◨', step: '▤',
};

export interface View {
  ox: number; oy: number; scale: number;
}

interface PolyOpt {
  fill: string; stroke: string; activeFill: string; occupied: boolean;
}

function drawPolygonWorld(ctx: CanvasRenderingContext2D, worldVerts: Vec2[],
                          v: View, opt: PolyOpt): void {
  if (worldVerts.length < 3) return;
  const pts = worldVerts.map(p => mmToCanvas(p.x, p.y, v.ox, v.oy, v.scale));
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = opt.occupied ? opt.activeFill : opt.fill;
  ctx.fill();
  if (opt.occupied) {
    ctx.save();
    ctx.shadowColor = opt.stroke; ctx.shadowBlur = 12;
    ctx.strokeStyle = opt.stroke; ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.strokeStyle = opt.stroke; ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
  }
}

function drawTargetDot(ctx: CanvasRenderingContext2D, cx: number, cy: number,
                       color: string, label: string, speed: number,
                       canvasAngle: number, resPx: number): void {
  if (resPx > 4) {
    ctx.beginPath(); ctx.arc(cx, cy, resPx, 0, 2 * Math.PI);
    ctx.strokeStyle = color + '44'; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
  ctx.fillStyle = color; ctx.fill();
  if (speed && speed !== 0) {
    const len = Math.min(50, Math.abs(speed) * 1.5);
    const dir = speed >= 0 ? canvasAngle : canvasAngle + Math.PI;
    const ex = cx + Math.cos(dir) * len, ey = cy + Math.sin(dir) * len;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 8 * Math.cos(dir - 0.4), ey - 8 * Math.sin(dir - 0.4));
    ctx.lineTo(ex - 8 * Math.cos(dir + 0.4), ey - 8 * Math.sin(dir + 0.4));
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }
  if (label) {
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(label, cx, cy - 8);
  }
}

// Compute screen view from canvas extents + floor extents + user pan/zoom.
// viewCenter is the world-mm point shown at canvas center; null = floor center.
// zoom multiplies the fit-to-canvas base scale.
export function computeView(canvas: HTMLCanvasElement, fw: number, fd: number,
                            viewCenter: { x: number; y: number } | null = null,
                            zoom = 1): View {
  const dpr = window.devicePixelRatio || 1;
  const pad = 40 * dpr;
  const w = Math.max(canvas.width, 1), h = Math.max(canvas.height, 1);
  const baseScale = Math.min((w - 2 * pad) / fw, (h - 2 * pad) / fd);
  const scale = baseScale * Math.max(0.05, zoom);
  const cx = viewCenter ? viewCenter.x : fw / 2;
  const cy = viewCenter ? viewCenter.y : fd / 2;
  const ox = w / 2 - cx * scale;
  const oy = h / 2 + cy * scale;  // y is flipped vs world
  return { ox, oy, scale };
}

export function pxToMm(canvas: HTMLCanvasElement, view: View, e: { clientX: number; clientY: number }): Vec2 {
  const r = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const px = (e.clientX - r.left) * dpr;
  const py = (e.clientY - r.top) * dpr;
  return { x: (px - view.ox) / view.scale, y: (view.oy - py) / view.scale };
}

export function mmToPx(view: View, wx: number, wy: number) {
  return mmToCanvas(wx, wy, view.ox, view.oy, view.scale);
}

export function drawAll(ctx: CanvasRenderingContext2D, p: Planner, view: View,
                        bgImg: HTMLImageElement | null): void {
  const c = ctx.canvas;
  ctx.clearRect(0, 0, c.width, c.height);
  // 2D layer flags (store.layers2d). Absent flag = layer on, except
  // `activity` which defaults off — so an old store renders the classic
  // full view. Doors / windows always draw (placed relative to walls but
  // still inspectable when the Walls layer is off).
  const L = p.store.layers2d ?? {};
  const on = (v: boolean | undefined) => v !== false;
  drawFloor(ctx, p, view, on(L.bg) ? bgImg : null);
  if (on(L.walls)) drawWalls(ctx, p, view);
  if (on(L.labels)) drawRooms(ctx, p, view);
  drawDoors(ctx, p, view);
  drawWindows(ctx, p, view);
  if (on(L.furniture)) drawFurniture(ctx, p, view);
  if (L.activity === true) drawActivity(ctx, p, view);
  if (on(L.lights)) drawFixtures(ctx, p, view);
  if (on(L.motion)) drawMotionSensors(ctx, p, view);
  if (on(L.env)) drawEnvSensors(ctx, p, view);
  if (on(L.sensors)) drawSensors(ctx, p, view);
  if (on(L.sensors)) drawBleProxies(ctx, p, view);
  // LD2450 inclusion / filter polygons + object halos draw per the zones
  // layer. The Motion toggle only hides motion-sensor cones (drawMotionSensors
  // gates its own cone block).
  if (on(L.zones)) {
    drawAllZones(ctx, p, view);
    drawActiveOverlay(ctx, p, view);
  }
  drawBgEditOverlay(ctx, p, view, bgImg);
  if (on(L.targets)) drawTargets(ctx, p, view);
  if (on(L.targets)) drawBlePeople(ctx, p, view);
  // Geo landmark pins + GPS device pins (both ride the `geo` layer).
  if (on(L.geo)) { drawGeoLandmarks(ctx, p, view); drawGpsPins(ctx, p, view); }
  drawAlignGuides(ctx, p, view);
  drawFloorEditHandles(ctx, p, view);
}

// Floor-boundary edit affordance (Task: drag the canvas edges). In edit + select
// mode, small square handles sit at each edge midpoint so the resize is
// discoverable. While a floorEdge drag is live, the dragged edge highlights and
// a dims label follows it. Gated internally; drawn last so it sits on top.
function drawFloorEditHandles(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  if (p.uiMode !== 'edit' || p.tool !== 'select') return;
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  if (f.boundsLocked) return;   // canvas-layout editing locked → no anchors
  const dragging = p.drag?.kind === 'floorEdge' ? p.drag.edge : null;
  const a = mmToPx(view, 0, 0);       // world (0,0) → screen bottom-left
  const b = mmToPx(view, f.w, f.d);   // world (w,d) → screen top-right
  const left = Math.min(a.x, b.x), right = Math.max(a.x, b.x);
  const topS = Math.min(a.y, b.y), botS = Math.max(a.y, b.y);
  const midX = (left + right) / 2, midY = (topS + botS) / 2;
  const edges: { e: 'left' | 'right' | 'top' | 'bottom'; x: number; y: number }[] = [
    { e: 'left',   x: left,  y: midY },
    { e: 'right',  x: right, y: midY },
    { e: 'top',    x: midX,  y: topS },   // world +Y (depth) is screen-up
    { e: 'bottom', x: midX,  y: botS },
  ];
  ctx.save();
  for (const ed of edges) {
    const active = dragging === ed.e;
    const s = (active ? 6 : 4.5) * dpr;
    ctx.fillStyle = active ? '#ffb74d' : 'rgba(120,170,220,0.9)';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    ctx.fillRect(ed.x - s, ed.y - s, 2 * s, 2 * s);
    ctx.strokeRect(ed.x - s, ed.y - s, 2 * s, 2 * s);
  }
  if (dragging) {
    ctx.strokeStyle = '#ffb74d'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (dragging === 'left') { ctx.moveTo(left, topS); ctx.lineTo(left, botS); }
    else if (dragging === 'right') { ctx.moveTo(right, topS); ctx.lineTo(right, botS); }
    else if (dragging === 'top') { ctx.moveTo(left, topS); ctx.lineTo(right, topS); }
    else { ctx.moveTo(left, botS); ctx.lineTo(right, botS); }
    ctx.stroke();
    const label = `${fmtLen(f.w, p.store.imperial)} × ${fmtLen(f.d, p.store.imperial)}`;
    ctx.font = `${12 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let lx = midX, ly = midY;
    const off = 18 * dpr;
    if (dragging === 'left') lx = left + off * 3;
    else if (dragging === 'right') lx = right - off * 3;
    else if (dragging === 'top') ly = topS + off;
    else ly = botS - off;
    const tw = ctx.measureText(label).width + 10 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(lx - tw / 2, ly - 9 * dpr, tw, 18 * dpr);
    ctx.fillStyle = '#ffd54f';
    ctx.fillText(label, lx, ly);
  }
  ctx.restore();
}

// Smart alignment guides (Feature C): dashed accent lines through the aligned
// coordinate, spanning the full canvas. Edit mode only, and only while a
// move-kind drag is in flight (stale guides never paint).
const ALIGN_MOVE_KINDS = new Set(['sensor', 'motion', 'env', 'ble', 'fixture', 'furnMove']);
function drawAlignGuides(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  if (p.uiMode !== 'edit' || !p.drag || !ALIGN_MOVE_KINDS.has(p.drag.kind)) return;
  if (!p.alignGuides.length) return;
  const c = ctx.canvas;
  ctx.save();
  ctx.strokeStyle = 'rgba(79,195,247,0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 5]);
  for (const g of p.alignGuides) {
    ctx.beginPath();
    if (g.axis === 'x') {
      const px = mmToPx(view, g.mm, 0).x;
      ctx.moveTo(px, 0); ctx.lineTo(px, c.height);
    } else {
      const py = mmToPx(view, 0, g.mm).y;
      ctx.moveTo(0, py); ctx.lineTo(c.width, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// GPS device pins (Feature G, phase G2). Person-colored teardrop + initials,
// positioned at the pin's render coords (true position, or the boundary edge for
// 'beyond'). indoor pins dim + caution (GPS indoors is lost-device grade); yard
// pins draw an accuracy ring (capped so a huge ±m circle can't blow up); beyond
// pins sit on the boundary with a "Name · 320 m NE" bearing label; stale pins
// extra-dimmed with an age caption.
function ageText(ts: number): string {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return `${Math.round(s)}s ago`;
  const m = s / 60;
  if (m < 60) return `${Math.round(m)} min ago`;
  const h = m / 60;
  if (h < 24) return `${Math.round(h)} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

function drawGpsPins(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const pins = p.gpsPins;
  if (!pins.length) return;
  const boundaryMm = p.geoBoundaryM() * 1000;
  ctx.save();
  ctx.textAlign = 'center';
  for (const pin of pins) {
    const at = mmToPx(view, pin.clampedX, pin.clampedY);
    const beyond = pin.zone === 'beyond';
    const indoor = pin.zone === 'indoor';
    const alpha = pin.stale ? 0.32 : indoor ? 0.6 : 1;
    ctx.globalAlpha = alpha;
    const col = pin.color;
    // Accuracy ring (not for beyond — the true pos is off-screen). Cap the mm
    // radius at the boundary so an indoor ±74 m circle stays sane.
    if (!beyond && pin.accuracyMm > 0) {
      const r = Math.min(pin.accuracyMm, boundaryMm) * view.scale;
      if (r > 2) {
        ctx.beginPath(); ctx.arc(at.x, at.y, r, 0, 2 * Math.PI);
        ctx.fillStyle = hexToRgba(col, indoor ? 0.05 : 0.09); ctx.fill();
        ctx.strokeStyle = hexToRgba(col, 0.30); ctx.lineWidth = 1 * dpr;
        ctx.setLineDash([4 * dpr, 4 * dpr]); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // Teardrop pin: head circle above the anchor + a tapering tail down to it.
    const R = 9 * dpr;
    const headCy = at.y - 3 * R;
    ctx.beginPath();
    ctx.moveTo(at.x, at.y);
    ctx.lineTo(at.x - R * 0.72, headCy);
    ctx.lineTo(at.x + R * 0.72, headCy);
    ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
    ctx.beginPath(); ctx.arc(at.x, headCy, R, 0, 2 * Math.PI);
    ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 * dpr;
    if (pin.stale) ctx.setLineDash([2 * dpr, 2 * dpr]);
    ctx.stroke(); ctx.setLineDash([]);
    // Initials in the head.
    const initials = pin.name.trim().split(/\s+/).map(w => w[0] || '')
      .join('').slice(0, 2).toUpperCase() || '?';
    ctx.fillStyle = '#fff'; ctx.font = `bold ${9 * dpr}px sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(pin.isPet ? '🐾' : initials, at.x, headCy);
    // Caption lines below the anchor.
    const lines: { txt: string; color: string }[] = [];
    if (beyond) {
      lines.push({ txt: `${pin.name} · ${Math.round(pin.distanceM)} m ${compass8(pin.bearingDeg)}`, color: '#fff' });
    } else {
      lines.push({ txt: pin.name || 'Person', color: '#fff' });
      if (indoor) lines.push({ txt: `~±${Math.round(pin.accuracyMm / 1000)} m indoors`, color: '#ffb74d' });
    }
    if (pin.stale) lines.push({ txt: ageText(pin.lastUpdated), color: 'rgba(255,255,255,0.7)' });
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textBaseline = 'top';
    let tw = 0;
    for (const ln of lines) tw = Math.max(tw, ctx.measureText(ln.txt).width);
    tw += 8 * dpr;
    const boxY = at.y + 4 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(at.x - tw / 2, boxY, tw, lines.length * 13 * dpr + 2 * dpr);
    let ly = boxY + 2 * dpr;
    for (const ln of lines) {
      ctx.fillStyle = ln.color;
      ctx.fillText(ln.txt, at.x, ly);
      ly += 13 * dpr;
    }
  }
  ctx.restore();
}

// Geo landmark pins (Feature G). Store-level (property-wide), so drawn on every
// floor. Calibrated pins render solid with a ±accuracy caption; uncalibrated
// pins render dashed + dim. A pin pending (re)placement or active calibration
// gets a highlight ring.
function drawGeoLandmarks(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const landmarks = p.geoLandmarks();
  if (!landmarks.length) return;
  ctx.save();
  ctx.textAlign = 'center';
  for (const lm of landmarks) {
    if (lm.hidden) continue;
    const c = mmToPx(view, lm.x, lm.y);
    const calibrated = lm.lat != null && lm.lon != null;
    const active = p.placingLandmarkId === lm.id || p.geoCalib?.landmarkId === lm.id;
    const base = calibrated ? '#4dd0e1' : '#90a4ae';
    // Highlight ring for active (placing / calibrating) pins.
    if (active) {
      ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(c.x, c.y, 12 * dpr, 0, 2 * Math.PI); ctx.stroke();
    }
    // Pin body.
    ctx.fillStyle = calibrated ? base : 'rgba(144,164,174,0.6)';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    if (!calibrated) ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(c.x, c.y, 7 * dpr, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    // Pin glyph.
    ctx.fillStyle = '#06232a'; ctx.font = `${9 * dpr}px sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('📍', c.x, c.y);
    // Name + calibration caption below.
    ctx.textBaseline = 'top';
    const txt = lm.name || 'Landmark';
    const cap = calibrated
      ? (lm.accuracy != null ? `±${Math.round(lm.accuracy)} m` : 'calibrated')
      : 'uncalibrated';
    ctx.font = `${10 * dpr}px sans-serif`;
    const tw = Math.max(ctx.measureText(txt).width, ctx.measureText(cap).width) + 8 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(c.x - tw / 2, c.y + 11 * dpr, tw, 25 * dpr);
    ctx.fillStyle = '#fff';
    ctx.fillText(txt, c.x, c.y + 13 * dpr);
    ctx.fillStyle = calibrated ? 'rgba(129,212,250,0.85)' : 'rgba(176,190,197,0.75)';
    ctx.font = `${9 * dpr}px sans-serif`;
    ctx.fillText(cap, c.x, c.y + 25 * dpr);
  }
  ctx.restore();
}

// Activity overlay for the "simple floorplan" style: soft glow pools where
// lights are ON and where motion sensors are firing, so a stripped-down plan
// still shows which rooms are alive. Drawn under fixture markers.
function drawActivity(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const f = p.floor();
  const states = p.hass?.states;
  if (!states) return;
  for (const l of f.lights) {
    const st = l.entity_id ? states[l.entity_id] : null;
    if (st?.state !== 'on') continue;
    const c = mmToPx(view, l.x, l.y);
    const r = Math.max(20, lightRadius(l) * 1.4 * view.scale);
    const attrs = (st.attributes ?? {}) as Record<string, unknown>;
    const rgb = Array.isArray(attrs.rgb_color) && (attrs.rgb_color as number[]).length === 3
      ? attrs.rgb_color as number[] : [255, 214, 130];
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
    const a = 0.34 * Math.min(1, lightIntensity(l));
    g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`);
    g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, 2 * Math.PI); ctx.fill();
  }
  for (const m of f.motionSensors) {
    const st = m.entity_id ? states[m.entity_id] : null;
    if (st?.state !== 'on') continue;
    const c = mmToPx(view, m.x, m.y);
    const r = Math.max(20, m.range * 0.55 * view.scale);
    const hex = motionColor(m);
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
    g.addColorStop(0, hexToRgba(hex, 0.30 * motionIntensity(m)));
    g.addColorStop(1, hexToRgba(hex, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, 2 * Math.PI); ctx.fill();
  }
}

function drawMotionSensors(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const states = p.hass?.states;
  const showZones = p.store.showMotionZones !== false;
  for (const m of f.motionSensors) {
    const c = mmToPx(view, m.x, m.y);
    const r = m.range * view.scale;
    const base = -Math.PI / 2 + (m.heading * Math.PI / 180);
    const half = (m.fov * Math.PI / 180) / 2;
    const st = m.entity_id && states ? states[m.entity_id] : null;
    const isOn = st?.state === 'on';
    const unavail = st && (st.state === 'unavailable' || st.state === 'unknown');
    const fov360 = m.fov >= 359.99;
    const baseHex = motionColor(m);
    const intensity = motionIntensity(m);
    const idleFill   = hexToRgba(baseHex, Math.min(1, 0.10 * intensity));
    const idleStroke = hexToRgba(baseHex, 0.55);
    const activeFill   = hexToRgba(baseHex, Math.min(1, 0.45 * intensity));
    const activeStroke = lighten(baseHex, 0.35);
    // Coverage cone (gated by store.showMotionZones)
    if (showZones) {
      ctx.fillStyle = isOn ? activeFill : idleFill;
      ctx.strokeStyle = isOn ? activeStroke : idleStroke;
      ctx.lineWidth = isOn ? 2.5 : 1;
      ctx.beginPath();
      if (fov360) {
        ctx.arc(c.x, c.y, r, 0, 2 * Math.PI);
      } else {
        ctx.moveTo(c.x, c.y);
        ctx.arc(c.x, c.y, r, base - half, base + half);
        ctx.closePath();
      }
      if (isOn) {
        ctx.save(); ctx.shadowColor = activeStroke; ctx.shadowBlur = 16 * intensity;
        ctx.fill(); ctx.stroke(); ctx.restore();
      } else {
        ctx.fill();
        if (!fov360) ctx.setLineDash([4, 4]);
        ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // Body dot
    const selected = p.activeMotionId === m.id;
    const lit = lighten(baseHex, 0.25);
    ctx.fillStyle = unavail ? '#c62828' : isOn ? lit : selected ? lit : baseHex;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(c.x, c.y, 7 * dpr, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke();
    // PIR icon
    ctx.fillStyle = '#fff'; ctx.font = `${9 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('◓', c.x, c.y);
    // Label below
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textBaseline = 'top';
    const txt = m.label || 'Motion';
    const tw = ctx.measureText(txt).width + 8 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(c.x - tw / 2, c.y + 11 * dpr, tw, 13 * dpr);
    ctx.fillStyle = isOn ? lit : '#fff';
    ctx.fillText(txt, c.x, c.y + 13 * dpr);
    // Rotate handle when active and not omnidirectional (locked = no anchor)
    if (selected && !fov360 && !m.locked) {
      const rhx = c.x + Math.cos(base) * 28 * dpr;
      const rhy = c.y + Math.sin(base) * 28 * dpr;
      ctx.fillStyle = '#ffb74d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(rhx, rhy, 5 * dpr, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
    }
  }
}

// BLE proxies (Bluetooth scanners) render as a small antenna puck: a filled
// dot with a broadcast glyph and the name below. Bound (haDeviceId set) pucks
// read solid; unbound ones read dashed. Rides the sensors layer (gated by
// the caller).
function drawBleProxies(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const base = BLE_PROXY_DEFAULTS.color;
  for (const b of f.bleProxies ?? []) {
    if (b.hidden) continue;
    const c = mmToPx(view, b.x, b.y);
    const selected = p.activeBleId === b.id;
    const bound = !!b.haDeviceId;
    // Body dot
    ctx.fillStyle = selected ? lighten(base, 0.25) : base;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    if (!bound) ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(c.x, c.y, 7 * dpr, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    // Broadcast glyph
    ctx.fillStyle = '#04252b'; ctx.font = `${9 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('📶', c.x, c.y);
    // Label below
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textBaseline = 'top';
    const txt = b.name || 'Proxy';
    const tw = ctx.measureText(txt).width + 8 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(c.x - tw / 2, c.y + 11 * dpr, tw, 13 * dpr);
    ctx.fillStyle = '#fff';
    ctx.fillText(txt, c.x, c.y + 13 * dpr);
  }
}

// Environmental sensors render as a value chip: kind glyph + live reading,
// tinted by the kind's base color (escalated to amber/red past the alert
// thresholds in ENV_KINDS). The chip is the fixture — no coverage geometry.
// Chip half-extent (px) per env id from the last draw. canvas-hit reads this
// for body / resize-handle hit tests (text metrics need a 2D ctx, which hit
// code doesn't have). Repopulated every RAF, so it's always fresh.
export const envChipHalfPx = new Map<string, { w: number; h: number }>();

function drawEnvSensors(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const states = p.hass?.states;
  envChipHalfPx.clear();
  for (const e of f.envSensors) {
    const c = mmToPx(view, e.x, e.y);
    const st = e.entity_id && states ? states[e.entity_id] : null;
    const kind = envKindOf(e, st);
    const value = st ? parseFloat(st.state) : NaN;
    const color = envColor(kind, value);
    const unavail = !!st && (st.state === 'unavailable' || st.state === 'unknown');
    const selected = p.activeEnvId === e.id;
    const sc = envScale(e);

    const glyph = ENV_KINDS[kind].glyph;
    const text = e.entity_id ? envValueText(st) : 'unbound';
    const fontVal = `${10 * sc * dpr}px sans-serif`;
    const fontGlyph = `${9 * sc * dpr}px sans-serif`;
    ctx.font = fontVal;
    const valW = ctx.measureText(text).width;
    ctx.font = fontGlyph;
    const glyphW = ctx.measureText(glyph).width;
    const padX = 5 * sc * dpr, gap = 3 * sc * dpr;
    const w = padX * 2 + glyphW + gap + valW;
    const h = 16 * sc * dpr;
    envChipHalfPx.set(e.id, { w: w / 2, h: h / 2 });

    // Chip
    ctx.beginPath();
    ctx.roundRect(c.x - w / 2, c.y - h / 2, w, h, 8 * sc * dpr);
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fill();
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeStyle = unavail ? '#c62828' : selected ? '#fff' : hexToRgba(color, 0.9);
    ctx.stroke();

    // Glyph + value
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = fontGlyph;
    ctx.fillStyle = color;
    ctx.fillText(glyph, c.x - w / 2 + padX, c.y + 0.5 * dpr);
    ctx.font = fontVal;
    ctx.fillStyle = unavail ? '#ef9a9a' : '#fff';
    ctx.fillText(text, c.x - w / 2 + padX + glyphW + gap, c.y + 0.5 * dpr);
    ctx.textAlign = 'center';

    // Resize handle on the chip's right edge when selected (locked = none)
    if (selected && !e.locked) {
      ctx.fillStyle = '#ffb74d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(c.x + w / 2 + 6 * dpr, c.y, 4.5 * dpr, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
    }

    // Label below when selected
    if (selected && e.label) {
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textBaseline = 'top';
      const tw = ctx.measureText(e.label).width + 8 * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(c.x - tw / 2, c.y + h / 2 + 3 * dpr, tw, 13 * dpr);
      ctx.fillStyle = '#fff';
      ctx.fillText(e.label, c.x, c.y + h / 2 + 5 * dpr);
    }
  }
}

function drawFloor(ctx: CanvasRenderingContext2D, p: Planner, view: View,
                   bgImg: HTMLImageElement | null): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const p0 = mmToPx(view, 0, 0);
  const p1 = mmToPx(view, f.w, f.d);
  ctx.fillStyle = '#101020';
  ctx.fillRect(p1.x, p1.y, p0.x - p1.x, p0.y - p1.y);
  ctx.strokeStyle = '#2e3a55'; ctx.lineWidth = 1.5;
  ctx.strokeRect(p1.x, p1.y, p0.x - p1.x, p0.y - p1.y);

  // Background image (replaces grid when visible)
  const bg = f.bg;
  const bgVisible = !!(bg && bg.visible !== false && bg.dataUrl);
  const showImg = bgVisible && bgImg && bgImg.complete && bg;
  if (showImg && bg) {
    const cp = mmToPx(view, bg.x, bg.y);
    const wPx = bg.w * view.scale, hPx = bg.h * view.scale;
    const ang = (bg.rotation || 0) * Math.PI / 180;
    ctx.save();
    ctx.beginPath();
    ctx.rect(p1.x, p1.y, p0.x - p1.x, p0.y - p1.y);
    ctx.clip();
    ctx.translate(cp.x, cp.y);
    ctx.rotate(ang);
    ctx.globalAlpha = bg.opacity ?? 1;
    try { ctx.drawImage(bgImg, -wPx / 2, -hPx / 2, wPx, hPx); } catch (_) { /* ignore */ }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Grid
  if (!showImg) {
    ctx.strokeStyle = COLORS.gridLine; ctx.lineWidth = 0.5;
    const stepPx = GRID_MM * view.scale;
    if (stepPx > 4) {
      for (let x = 0; x <= f.w; x += GRID_MM) {
        const { x: px } = mmToPx(view, x, 0);
        ctx.beginPath(); ctx.moveTo(px, p1.y); ctx.lineTo(px, p0.y); ctx.stroke();
      }
      for (let y = 0; y <= f.d; y += GRID_MM) {
        const { y: py } = mmToPx(view, 0, y);
        ctx.beginPath(); ctx.moveTo(p1.x, py); ctx.lineTo(p0.x, py); ctx.stroke();
      }
    }
  }

  // Dimension labels
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = `${11 * dpr}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(fmtLen(f.w, p.store.imperial), (p0.x + p1.x) / 2, p0.y + 4 * dpr);
  ctx.save();
  ctx.translate(p1.x - 10 * dpr, (p0.y + p1.y) / 2);
  ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'bottom';
  ctx.fillText(fmtLen(f.d, p.store.imperial), 0, 0);
  ctx.restore();
}

// Dim small-caps room-name labels at the centroid of each room's containing
// wall loop. The room IS whichever closed loop currently holds its anchor, so
// labels track wall edits. Unnamed rooms show an italic placeholder; anchors
// outside every loop get an amber "not enclosed" marker at the anchor. Loops
// are recomputed here (cheap) only when the floor actually has rooms.
function drawRooms(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const f = p.floor();
  const rooms = f.rooms;
  if (!rooms || rooms.length === 0) return;
  const dpr = window.devicePixelRatio || 1;
  const loops = closedWallLoops(f.walls ?? []);
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const rm of rooms) {
    const { text, placeholder } = roomLabel(rm);
    const loop = loopContaining(loops, rm.anchor.x, rm.anchor.y);
    if (loop) {
      // Label at the loop centroid confirms the walls enclose the anchor.
      // Placeholder (unnamed) rooms draw italic + dimmer.
      const c = centroid(loop);
      const px = mmToPx(view, c.x, c.y);
      ctx.fillStyle = placeholder ? 'rgba(207,216,230,0.32)' : 'rgba(207,216,230,0.5)';
      ctx.font = `${placeholder ? 'italic ' : ''}600 ${11 * dpr}px sans-serif`;
      ctx.fillText(text.toUpperCase(), px.x, px.y);
    } else {
      // No enclosing loop: amber marker at the anchor itself so the user can
      // see the room exists but its walls don't close around it.
      const px = mmToPx(view, rm.anchor.x, rm.anchor.y);
      ctx.fillStyle = 'rgba(255,183,77,0.8)';
      ctx.font = `${placeholder ? 'italic ' : ''}600 ${11 * dpr}px sans-serif`;
      ctx.fillText(`⚠ ${text.toUpperCase()}`, px.x, px.y);
      ctx.fillStyle = 'rgba(255,183,77,0.55)';
      ctx.font = `${9 * dpr}px sans-serif`;
      ctx.fillText('not enclosed by walls', px.x, px.y + 12 * dpr);
    }
  }
  ctx.restore();
}

function drawWalls(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const wallW = Math.max(4, 80 * view.scale);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([]);
  for (const w of f.walls) {
    if (w.points.length < 2) continue;
    const kind = wallKind(w);
    ctx.setLineDash([]);
    if (kind === 'half') { ctx.strokeStyle = '#93a2b4'; ctx.lineWidth = wallW * 0.75; }
    else if (kind === 'railing') { ctx.strokeStyle = '#a4b6c9'; ctx.lineWidth = Math.max(3, wallW * 0.3); }
    else if (kind === 'invisible') {
      ctx.strokeStyle = 'rgba(160,175,192,0.4)'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
    } else { ctx.strokeStyle = '#bfc9d6'; ctx.lineWidth = wallW; }
    // Doors / windows sitting on a segment cut visible breaks into it —
    // stroke only the solid sub-intervals.
    for (let i = 0; i < w.points.length - 1; i++) {
      const A = w.points[i], B = w.points[i + 1];
      const { solids } = wallCutsForSegment(A, B, f.doors ?? [], f.windows ?? []);
      const dxs = B.x - A.x, dys = B.y - A.y;
      const L = Math.hypot(dxs, dys) || 1;
      const ux = dxs / L, uy = dys / L;
      for (const sv of solids) {
        const p1 = mmToPx(view, A.x + ux * sv.t0, A.y + uy * sv.t0);
        const p2 = mmToPx(view, A.x + ux * sv.t1, A.y + uy * sv.t1);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      }
      // Railings get baluster tick marks across the line.
      if (kind === 'railing') {
        const tickHalf = Math.max(3, wallW * 0.45);
        const nx = -uy, ny = ux;
        for (let t = 400; t < L; t += 500) {
          const c1 = mmToPx(view, A.x + ux * t + nx * 0, A.y + uy * t);
          ctx.beginPath();
          ctx.moveTo(c1.x - ny * tickHalf, c1.y - nx * tickHalf);
          ctx.lineTo(c1.x + ny * tickHalf, c1.y + nx * tickHalf);
          ctx.stroke();
        }
      }
    }
    ctx.setLineDash([]);
    // Locked walls draw no vertex anchors (nothing is draggable).
    if (!w.locked) {
      ctx.fillStyle = '#64b5f6'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      for (const v of w.points) {
        const pt = mmToPx(view, v.x, v.y);
        ctx.fillRect(pt.x - 4, pt.y - 4, 8, 8);
        ctx.strokeRect(pt.x - 4, pt.y - 4, 8, 8);
      }
    }
    if (p.drag?.kind === 'wallv' && p.drag.wallId === w.id) {
      ctx.fillStyle = '#90caf9'; ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = 0; i < w.points.length - 1; i++) {
        const a2 = w.points[i], b2 = w.points[i + 1];
        const mid = mmToPx(view, (a2.x + b2.x) / 2, (a2.y + b2.y) / 2);
        const len = distMM(a2, b2);
        const txt = fmtLen(len, p.store.imperial);
        const w2 = ctx.measureText(txt).width + 6;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(mid.x - w2 / 2, mid.y - 9, w2, 18);
        ctx.fillStyle = '#90caf9';
        ctx.fillText(txt, mid.x, mid.y + 1);
      }
    }
  }
  // In-progress wall
  if (p.drawingWall?.points.length) {
    ctx.strokeStyle = '#90caf9'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    ctx.beginPath();
    const a = mmToPx(view, p.drawingWall.points[0].x, p.drawingWall.points[0].y);
    ctx.moveTo(a.x, a.y);
    for (let i = 1; i < p.drawingWall.points.length; i++) {
      const pt = mmToPx(view, p.drawingWall.points[i].x, p.drawingWall.points[i].y);
      ctx.lineTo(pt.x, pt.y);
    }
    if (p.cursor) {
      const c2 = mmToPx(view, p.cursor.x, p.cursor.y);
      ctx.lineTo(c2.x, c2.y);
    }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#90caf9';
    for (const v of p.drawingWall.points) {
      const pt = mmToPx(view, v.x, v.y);
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, 2 * Math.PI); ctx.fill();
    }
  }
}

function drawDoors(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const states = p.hass?.states;
  if (!f.doors) return;
  for (const d of f.doors) {
    const st = d.entity_id && states ? states[d.entity_id] : null;
    const isOpen = st?.state === 'on';
    const unavail = st && (st.state === 'unavailable' || st.state === 'unknown');
    const closedColor = unavail ? '#c62828' : '#90a4ae';
    const openColor = '#66bb6a';
    const color = isOpen ? openColor : closedColor;
    const hinge = mmToPx(view, d.x, d.y);
    // Closed end: along rotation. Open end: rotation + doorOpenDeltaDeg
    // (left-hinge = +90° canvas-CW; right-hinge = -90° canvas-CCW).
    const openDelta = doorOpenDeltaDeg(d);
    const closedEnd = doorEndpoint(d);
    const openEnd = doorEndpoint(d, openDelta);
    const cep = mmToPx(view, closedEnd.x, closedEnd.y);
    const oep = mmToPx(view, openEnd.x, openEnd.y);
    // Faded swing arc between closed and open. `openDelta` is in world
    // screen-CW degrees; canvas frame is the same screen-CW sense for X but
    // Y is flipped, so the canvas angular delta is `-openDelta * π/180`.
    const rPx = d.w * view.scale;
    const closedA = Math.atan2(cep.y - hinge.y, cep.x - hinge.x);
    const openA = closedA + (-openDelta * Math.PI / 180);
    ctx.strokeStyle = 'rgba(144,164,174,0.35)';
    ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(hinge.x, hinge.y, rPx, Math.min(closedA, openA), Math.max(closedA, openA));
    ctx.stroke(); ctx.setLineDash([]);
    // Active panel
    const endPt = isOpen ? oep : cep;
    ctx.strokeStyle = color; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(hinge.x, hinge.y); ctx.lineTo(endPt.x, endPt.y); ctx.stroke();
    // Hinge marker
    ctx.fillStyle = color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(hinge.x, hinge.y, 5 * dpr, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke();
    // Endpoint handle (drag to rotate) — hidden when locked
    if (!d.locked) {
      ctx.fillStyle = '#ffb74d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(endPt.x, endPt.y, 5 * dpr, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
    }
    // Label + state pill
    const pillX = (hinge.x + endPt.x) / 2;
    const pillY = (hinge.y + endPt.y) / 2 - 12 * dpr;
    const txt = (d.label?.trim() || 'Door') + (d.entity_id ? ` · ${isOpen ? 'OPEN' : 'closed'}` : '');
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(txt).width + 8 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(pillX - tw / 2, pillY - 7 * dpr, tw, 14 * dpr);
    ctx.fillStyle = isOpen ? openColor : '#cfd8dc';
    ctx.fillText(txt, pillX, pillY);
  }
}

function drawWindows(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const states = p.hass?.states;
  if (!f.windows) return;
  for (const w of f.windows) {
    const st = w.entity_id && states ? states[w.entity_id] : null;
    const isOpen = st?.state === 'on';
    const unavail = st && (st.state === 'unavailable' || st.state === 'unknown');
    const closedColor = unavail ? '#c62828' : '#64b5f6';
    const openColor = '#66bb6a';
    const color = isOpen ? openColor : closedColor;
    const ends = windowEndpoints(w);
    const a = mmToPx(view, ends.a.x, ends.a.y);
    const b = mmToPx(view, ends.b.x, ends.b.y);
    // Pane: thick line. Closed = solid; open = dashed (visual "ajar" hint).
    ctx.strokeStyle = color; ctx.lineWidth = 6;
    if (isOpen) ctx.setLineDash([10, 6]);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.setLineDash([]);
    // Inner thinner glass line for the typical floor-plan window symbol.
    ctx.strokeStyle = isOpen ? 'rgba(102,187,106,0.45)' : 'rgba(187,222,251,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    // Open indicator: short perpendicular dashed line off the midpoint into +Y world.
    if (isOpen) {
      const mid = mmToPx(view, w.x, w.y);
      const perpRot = (w.rotation - 90) * Math.PI / 180;
      const lenPx = w.w * 0.35 * view.scale;
      const cdx = lenPx * Math.cos(perpRot);
      const cdy = -lenPx * Math.sin(perpRot);
      ctx.strokeStyle = openColor; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(mid.x, mid.y); ctx.lineTo(mid.x + cdx, mid.y + cdy);
      ctx.stroke(); ctx.setLineDash([]);
    }
    // End handles (drag to rotate) — hidden when locked
    if (!w.locked) {
      ctx.fillStyle = '#ffb74d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      for (const ep of [a, b]) {
        ctx.beginPath(); ctx.arc(ep.x, ep.y, 4 * dpr, 0, 2 * Math.PI);
        ctx.fill(); ctx.stroke();
      }
    }
    // Center dot (drag to move)
    const c = mmToPx(view, w.x, w.y);
    ctx.fillStyle = color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(c.x, c.y, 4 * dpr, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke();
    // Label + state pill
    const txt = (w.label?.trim() || 'Window') + (w.entity_id ? ` · ${isOpen ? 'OPEN' : 'closed'}` : '');
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(txt).width + 8 * dpr;
    const py = c.y - 14 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(c.x - tw / 2, py - 7 * dpr, tw, 14 * dpr);
    ctx.fillStyle = isOpen ? openColor : '#cfd8dc';
    ctx.fillText(txt, c.x, py);
  }
}

function drawFurniture(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const f = p.floor();
  const customObjects = p.store.customObjects;
  const isEdit = p.uiMode === 'edit';
  for (const piece of f.furniture) {
    const center = mmToPx(view, piece.x, piece.y);
    const halfW = (piece.w / 2) * view.scale;
    const halfH = (piece.h / 2) * view.scale;
    const rotR = (piece.rotation || 0) * Math.PI / 180;  // ctx.rotate is screen-CW, matching our convention
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(rotR);
    // Local rect: -halfW..+halfW (X), -halfH..+halfH (canvas Y). Canvas-Y top
    // (-halfH) corresponds to world +Y after the canvas Y-flip — the BACK-side
    // decorations edge (backrest, headboard, pillows). The functional FRONT
    // (cabinet doors/pulls, TV screens, seat openings, faces — local -Z = world
    // -Y) is at canvas-Y +halfH.
    drawFurniturePrimitiveLocal(ctx, piece, halfW, halfH, customObjects);
    if (piece.label) {
      ctx.fillStyle = '#ddd'; ctx.font = '10px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(piece.label, 0, 0);
    }
    // Front chevron: subtle orange arrow just past the functional front edge
    // (canvas-Y +halfH, local -Z = world -Y — where doors/screens/seats/faces
    // live), pointing outward, for the active selection in edit mode.
    const def = resolveFurnitureDef(piece, customObjects);
    if (isEdit && p.activeFurnitureId === piece.id && def.frontArrow !== false) {
      const s = Math.max(5, Math.min(12, halfW * 0.4));
      ctx.strokeStyle = '#ffb74d';
      ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-s, halfH);
      ctx.lineTo(0, halfH + s * 0.9);
      ctx.lineTo(s, halfH);
      ctx.stroke();
    }
    ctx.restore();
    // Corner handles drawn at rotation-aware world positions so resize stays
    // grabbable when the piece is rotated. Locked pieces show none.
    if (!piece.locked) {
      ctx.fillStyle = '#64b5f6'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      for (const c of furnitureCorners(piece)) {
        const px = mmToPx(view, c.x, c.y);
        ctx.fillRect(px.x - 4, px.y - 4, 8, 8);
        ctx.strokeRect(px.x - 4, px.y - 4, 8, 8);
      }
    }
  }
}

// Plan-view shape per furniture kind, drawn in piece-local canvas frame
// after `ctx.translate(center)` and `ctx.rotate(rotation)`. `halfW` and
// `halfH` are half extents in canvas px. Canvas-Y top (-halfH) is the
// piece's BACK — backrests, headboards, and pillows live there; the functional
// front (doors/seats/screens/faces, local -Z) is at canvas-Y +halfH.
function drawFurniturePrimitiveLocal(
  ctx: CanvasRenderingContext2D,
  piece: Furniture,
  halfW: number,
  halfH: number,
  customObjects?: ObjectRecipe[],
): void {
  const kind = furnitureKind(piece);
  const x = -halfW, y = -halfH, w = halfW * 2, h = halfH * 2;
  const fill = (c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const stroke = (c: string) => { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h); };
  // Body fill honours a per-piece color override (Furniture.color); with no
  // override the kind's tuned default constant is kept so the plan look is
  // unchanged. Glyphs that hardcode a material (porcelain white, steel) opt out.
  const bodyFill = (fallback: string, alpha: number) =>
    piece.color ? hexToRgba(piece.color, alpha) : fallback;
  // Custom object recipes draw as a generic rect tinted by the recipe color
  // (grey when the recipe is missing). The piece label is drawn by the caller.
  if (piece.customKindId) {
    const rec = customObjects?.find(o => o.id === piece.customKindId);
    const hex = piece.color ?? ('#' + ((rec?.color ?? 0x8a8a8a) & 0xffffff).toString(16).padStart(6, '0'));
    fill(hexToRgba(hex, 0.5));
    stroke(hex);
    return;
  }
  // "+Y side" (the implied front of the piece) is the TOP edge in canvas px
  // because canvas Y is flipped. Backrest, headboard, pillows live there.
  switch (kind) {
    case 'rug':
      fill(bodyFill('rgba(141,110,99,0.30)', 0.30));
      ctx.strokeStyle = '#8d6e63';
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      break;
    case 'table':
    case 'desk':
    case 'coffee_table':
      fill(bodyFill('rgba(120,90,70,0.45)', 0.45));
      stroke('#a1887f');
      // Leg dots at corners.
      ctx.fillStyle = '#5d4037';
      for (const [lx, ly] of [[x + 6, y + 6], [x + w - 12, y + 6], [x + 6, y + h - 12], [x + w - 12, y + h - 12]]) {
        ctx.fillRect(lx, ly, 6, 6);
      }
      break;
    case 'chair':
    case 'rocking_chair': {
      fill('rgba(109,76,65,0.55)');
      stroke('#a1887f');
      // Backrest line on +Y (top) edge.
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(x, y, w, Math.max(3, Math.min(8, h * 0.18)));
      if (kind === 'rocking_chair') {
        // Curved rocker arc beneath.
        ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.5, w * 0.7, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }
      break;
    }
    case 'chaise':
      fill('rgba(121,85,72,0.55)');
      stroke('#a1887f');
      // Low back on +Y side (top), spans only first 1/3 along X (head end).
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(x, y, Math.min(w, w * 0.35), Math.max(3, h * 0.2));
      break;
    case 'bench':
      fill('rgba(109,76,65,0.55)');
      stroke('#a1887f');
      // Plank line down middle.
      ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 4, y + h / 2); ctx.lineTo(x + w - 4, y + h / 2); ctx.stroke();
      break;
    case 'sofa_l_left':
    case 'sofa_l_right':
    case 'sofa_u': {
      // Sectionals: main run along the back (top) + return arm(s) reaching
      // forward. Same back-at-top convention as chairs/sofas.
      const mainH = h * 0.5;
      const retW = kind === 'sofa_u' ? w * 0.3 : w * 0.35;
      ctx.fillStyle = bodyFill('rgba(55,71,79,0.65)', 0.65);
      ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1;
      const rects: [number, number, number, number][] = [[x, y, w, mainH]];
      if (kind !== 'sofa_l_right') rects.push([x, y + mainH, retW, h - mainH]);           // left return
      if (kind !== 'sofa_l_left') rects.push([x + w - retW, y + mainH, retW, h - mainH]); // right return
      for (const [rx, ry, rw2, rh2] of rects) { ctx.fillRect(rx, ry, rw2, rh2); ctx.strokeRect(rx, ry, rw2, rh2); }
      // Back band along the top edge.
      ctx.fillStyle = '#263238';
      ctx.fillRect(x, y, w, Math.max(4, mainH * 0.3));
      // Arm band down the full outer edge of each return side.
      const armW2 = Math.max(3, w * 0.05);
      if (kind !== 'sofa_l_right') ctx.fillRect(x, y, armW2, h);
      if (kind !== 'sofa_l_left') ctx.fillRect(x + w - armW2, y, armW2, h);
      break;
    }
    case 'sofa':
      fill(bodyFill('rgba(55,71,79,0.65)', 0.65));
      stroke('#90a4ae');
      // Back band on +Y edge.
      ctx.fillStyle = '#263238';
      ctx.fillRect(x, y, w, Math.max(4, h * 0.22));
      // Armrests on left/right ends.
      ctx.fillRect(x, y, Math.min(w, w * 0.10), h);
      ctx.fillRect(x + w - Math.min(w, w * 0.10), y, Math.min(w, w * 0.10), h);
      break;
    case 'bed':
      fill(bodyFill('rgba(84,110,122,0.55)', 0.55));
      stroke('#b0bec5');
      // Headboard on +Y edge.
      ctx.fillStyle = '#37474f';
      ctx.fillRect(x, y, w, Math.max(6, h * 0.12));
      // Two pillows just below headboard.
      ctx.fillStyle = '#eceff1';
      const pillowH = Math.max(8, h * 0.16), pillowY = y + h * 0.14;
      const pillowW = w * 0.42, gap = w * 0.05;
      ctx.fillRect(x + (w - 2 * pillowW - gap) / 2, pillowY, pillowW, pillowH);
      ctx.fillRect(x + (w - 2 * pillowW - gap) / 2 + pillowW + gap, pillowY, pillowW, pillowH);
      break;
    case 'bookshelf':
      fill('rgba(62,39,35,0.7)');
      stroke('#a1887f');
      // Horizontal shelf lines.
      ctx.strokeStyle = '#a1887f'; ctx.lineWidth = 1;
      for (const t of [0.33, 0.66]) {
        ctx.beginPath();
        ctx.moveTo(x + 2, y + h * t);
        ctx.lineTo(x + w - 2, y + h * t);
        ctx.stroke();
      }
      break;
    case 'stairs':
    case 'stairs_half': {
      // Classic plan symbol: tread lines + an "up" arrow toward the top
      // (stairs rise toward the piece's back).
      fill('rgba(141,110,99,0.4)');
      stroke('#a1887f');
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 1;
      const nSteps = Math.max(3, Math.round(piece.h / 280));
      for (let i = 1; i < nSteps; i++) {
        const ty = y + (h * i) / nSteps;
        ctx.beginPath(); ctx.moveTo(x + 2, ty); ctx.lineTo(x + w - 2, ty); ctx.stroke();
      }
      // Ascending: arrow points to the back (top). Sunk flights (negative
      // elevation = going downstairs) flip the arrow and label it DN.
      const down = (piece.elevation ?? 0) < 0;
      ctx.strokeStyle = '#eceff1'; ctx.lineWidth = 1.5;
      const ax = x + w / 2;
      ctx.beginPath();
      if (down) {
        ctx.moveTo(ax, y + h * 0.14); ctx.lineTo(ax, y + h * 0.86);
        ctx.moveTo(ax - 5, y + h * 0.86 - 7); ctx.lineTo(ax, y + h * 0.86);
        ctx.lineTo(ax + 5, y + h * 0.86 - 7);
      } else {
        ctx.moveTo(ax, y + h * 0.86); ctx.lineTo(ax, y + h * 0.14);
        ctx.moveTo(ax - 5, y + h * 0.14 + 7); ctx.lineTo(ax, y + h * 0.14);
        ctx.lineTo(ax + 5, y + h * 0.14 + 7);
      }
      ctx.stroke();
      if (down) {
        ctx.fillStyle = '#eceff1'; ctx.font = '9px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('DN', ax, y + h * 0.5);
      }
      break;
    }
    case 'stair_landing':
      fill('rgba(141,110,99,0.4)');
      stroke('#a1887f');
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 2, y + 2); ctx.lineTo(x + w - 2, y + h - 2); ctx.stroke();
      break;
    case 'tv_stand':
    case 'dresser':
    case 'nightstand':
    case 'wardrobe':
    case 'cabinet':
    case 'counter':
    case 'island': {
      fill(bodyFill('rgba(109,76,65,0.5)', 0.5));
      stroke('#a1887f');
      ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 1;
      if (kind === 'dresser' || kind === 'nightstand') {
        // Drawer lines.
        for (const t of kind === 'dresser' ? [0.33, 0.66] : [0.5]) {
          ctx.beginPath(); ctx.moveTo(x + 3, y + h * t); ctx.lineTo(x + w - 3, y + h * t); ctx.stroke();
        }
      } else if (kind === 'wardrobe' || kind === 'cabinet') {
        // Double-door split.
        ctx.beginPath(); ctx.moveTo(x + w / 2, y + 3); ctx.lineTo(x + w / 2, y + h - 3); ctx.stroke();
      } else if (kind === 'tv_stand' || kind === 'counter' || kind === 'island') {
        // Door-run splits matching the 3D panel count (one door per ~600 mm).
        const nd = Math.max(2, Math.round(piece.w / 600));
        for (let i = 1; i < nd; i++) {
          const sx3 = x + (w * i) / nd;
          ctx.beginPath(); ctx.moveTo(sx3, y + 3); ctx.lineTo(sx3, y + h - 3); ctx.stroke();
        }
      }
      break;
    }
    case 'ottoman':
      ctx.fillStyle = 'rgba(96,125,139,0.55)';
      ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.3); ctx.fill();
      ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1; ctx.stroke();
      break;
    case 'stool':
      ctx.fillStyle = 'rgba(109,76,65,0.6)';
      ctx.beginPath(); ctx.ellipse(0, 0, halfW, halfH, 0, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#a1887f'; ctx.lineWidth = 1; ctx.stroke();
      break;
    case 'plant': {
      ctx.fillStyle = 'rgba(51,105,30,0.5)';
      ctx.beginPath(); ctx.ellipse(0, 0, halfW, halfH, 0, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = 'rgba(124,179,66,0.65)';
      for (const [ox2, oy2] of [[-0.3, -0.2], [0.3, -0.1], [0, 0.3]] as const) {
        ctx.beginPath();
        ctx.ellipse(ox2 * halfW, oy2 * halfH, halfW * 0.38, halfH * 0.38, 0, 0, 2 * Math.PI);
        ctx.fill();
      }
      break;
    }
    case 'fridge':
    case 'dishwasher':
    case 'washer':
    case 'dryer':
    case 'microwave': {
      fill('rgba(158,168,178,0.45)');
      stroke('#cfd8dc');
      ctx.strokeStyle = '#78909c'; ctx.lineWidth = 1;
      if (kind === 'fridge') {
        ctx.beginPath(); ctx.moveTo(x + w / 2, y + 2); ctx.lineTo(x + w / 2, y + h - 2); ctx.stroke();
      } else if (kind === 'washer' || kind === 'dryer') {
        ctx.beginPath(); ctx.arc(0, 0, Math.min(halfW, halfH) * 0.55, 0, 2 * Math.PI); ctx.stroke();
      }
      break;
    }
    case 'stove': {
      fill('rgba(144,151,158,0.5)');
      stroke('#cfd8dc');
      ctx.strokeStyle = '#37474f'; ctx.lineWidth = 1.2;
      for (const [sx2, sy2] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        ctx.beginPath();
        ctx.arc(sx2 * w * 0.22, sy2 * h * 0.2, Math.min(w, h) * 0.12, 0, 2 * Math.PI);
        ctx.stroke();
      }
      break;
    }
    case 'tv':
      fill('rgba(33,37,41,0.8)');
      stroke('#78909c');
      break;
    case 'wall_tv':
      // Thin dark screen rect + a heavier accent line along the front (screen)
      // edge. Front = local -Z = the -Y / BOTTOM edge in canvas px.
      fill('rgba(28,31,35,0.85)');
      stroke('#78909c');
      ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x + 2, y + h); ctx.lineTo(x + w - 2, y + h); ctx.stroke();
      break;
    case 'kitchen_sink': {
      // Counter-tone rect + two steel basin rects + faucet dot at the back
      // (+Z = TOP edge in canvas).
      fill('rgba(109,76,65,0.5)');
      stroke('#a1887f');
      ctx.fillStyle = 'rgba(176,190,197,0.85)';
      ctx.strokeStyle = '#607d8b'; ctx.lineWidth = 1;
      const kbw = w * 0.32, kbh = h * 0.5, kby = -kbh / 2 + h * 0.04;
      ctx.fillRect(-kbw - w * 0.03, kby, kbw, kbh); ctx.strokeRect(-kbw - w * 0.03, kby, kbw, kbh);
      ctx.fillRect(w * 0.03, kby, kbw, kbh); ctx.strokeRect(w * 0.03, kby, kbw, kbh);
      ctx.fillStyle = '#607d8b';
      ctx.beginPath(); ctx.arc(0, y + h * 0.15, 3.5, 0, 2 * Math.PI); ctx.fill();
      break;
    }
    case 'toilet': {
      // Tank on +Y (back) edge + bowl ellipse.
      ctx.fillStyle = 'rgba(245,245,240,0.75)';
      ctx.fillRect(x, y, w, h * 0.3);
      ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h * 0.3);
      ctx.beginPath();
      ctx.ellipse(0, h * 0.18, halfW * 0.75, halfH * 0.62, 0, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
      break;
    }
    case 'sink':
      fill('rgba(245,245,240,0.6)');
      stroke('#b0bec5');
      ctx.strokeStyle = '#78909c'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, halfW * 0.6, halfH * 0.6, 0, 0, 2 * Math.PI); ctx.stroke();
      break;
    case 'sink_vanity': {
      // Painted cabinet rect (door split) + inset basin oval + faucet dot at
      // the back (+Z = TOP edge in canvas).
      fill('rgba(215,204,200,0.6)');
      stroke('#a1887f');
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, y + h * 0.28); ctx.lineTo(0, y + h - 3); ctx.stroke();
      ctx.fillStyle = 'rgba(236,239,241,0.9)';
      ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, h * 0.06, halfW * 0.55, halfH * 0.5, 0, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#78909c';
      ctx.beginPath(); ctx.arc(0, y + h * 0.14, 3, 0, 2 * Math.PI); ctx.fill();
      break;
    }
    case 'bathtub':
      fill('rgba(245,245,240,0.6)');
      stroke('#b0bec5');
      ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x + w * 0.08, y + h * 0.12, w * 0.84, h * 0.76, Math.min(w, h) * 0.18);
      ctx.stroke();
      break;
    case 'shower':
      fill('rgba(227,230,232,0.35)');
      stroke('#b0bec5');
      ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 3, y + 3); ctx.lineTo(x + w - 3, y + h - 3); ctx.stroke();
      ctx.fillStyle = '#90a4ae';
      ctx.beginPath(); ctx.arc(x + w * 0.15, y + h * 0.15, 3, 0, 2 * Math.PI); ctx.fill();
      break;
    case 'coffee_maker': {
      // Small rounded body + carafe circle at the front.
      ctx.fillStyle = 'rgba(55,71,79,0.6)';
      ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.25); ctx.fill();
      ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = '#cfd8dc';
      ctx.beginPath(); ctx.arc(0, h * 0.18, Math.min(halfW, halfH) * 0.42, 0, 2 * Math.PI); ctx.stroke();
      break;
    }
    case 'toaster': {
      // Rounded body + two slot lines on top (back/+Y edge).
      ctx.fillStyle = 'rgba(176,190,197,0.6)';
      ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(w, h) * 0.3); ctx.fill();
      ctx.strokeStyle = '#78909c'; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = '#37474f'; ctx.lineWidth = 1.5;
      for (const sx of [-0.22, 0.22]) {
        ctx.beginPath(); ctx.moveTo(x + w * (0.5 + sx) - w * 0.12, y + h * 0.32);
        ctx.lineTo(x + w * (0.5 + sx) + w * 0.12, y + h * 0.32); ctx.stroke();
      }
      break;
    }
    case 'exercise_equipment': {
      // Treadmill: deck rect + a console band along the front (-Y / top) edge.
      fill('rgba(66,66,66,0.55)');
      stroke('#9e9e9e');
      ctx.fillStyle = '#212121';
      ctx.fillRect(x + w * 0.12, y + h * 0.28, w * 0.76, h * 0.62);  // running belt
      ctx.fillStyle = '#546e7a';
      ctx.fillRect(x, y, w, Math.max(4, h * 0.16));                  // console band at front
      break;
    }
    default:
      // Covers `block` and any unhandled kind; the override recolors the body.
      fill(bodyFill('rgba(140,140,140,0.25)', 0.35));
      stroke('#888');
  }
}

// Plan-view fireplace: stone surround + firebox + logs, with layered flames
// swaying on slow sines while the bound light is ON (the canvas redraws every
// RAF, so time-based motion is free — smooth by design, no per-frame random
// jitter). OFF shows faintly pulsing embers.
function drawFireplace2D(ctx: CanvasRenderingContext2D, cx0: number, cy0: number,
                         view: View, isOn: boolean, unavail: boolean, bound: boolean,
                         rotationDeg = 0): void {
  const t = performance.now() / 1000;
  ctx.save();
  ctx.translate(cx0, cy0);
  ctx.rotate(rotationDeg * Math.PI / 180);  // ctx.rotate is screen-CW, matching the convention
  const cx = 0, cy = 0;
  const hw = Math.max(14, 500 * view.scale);   // half width (1000 mm — matches 3D firebox W2)
  const hh = Math.max(7, 225 * view.scale);    // half depth (450 mm — matches 3D firebox D2 / flush-snap)
  // Stone surround
  ctx.beginPath();
  ctx.roundRect(cx - hw, cy - hh, hw * 2, hh * 2, Math.min(hw, hh) * 0.25);
  ctx.fillStyle = '#3a3532';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = unavail ? '#c62828' : bound ? '#6b625c' : '#888';
  ctx.stroke();
  // Firebox
  const fx0 = cx - hw * 0.72, fw = hw * 1.44, fy0 = cy - hh * 0.55, fh = hh * 1.3;
  ctx.beginPath();
  ctx.roundRect(fx0, fy0, fw, fh, Math.min(hw, hh) * 0.18);
  ctx.fillStyle = '#14100e';
  ctx.fill();
  // Logs
  ctx.fillStyle = '#4e342e';
  const logY = fy0 + fh * 0.72, logH = Math.max(1.5, fh * 0.14);
  ctx.beginPath(); ctx.roundRect(fx0 + fw * 0.12, logY, fw * 0.76, logH, logH / 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(fx0 + fw * 0.24, logY - logH * 0.9, fw * 0.52, logH, logH / 2); ctx.fill();
  const baseY = logY - logH * 0.4;
  if (isOn) {
    // Three flame tongues, tallest centered. Each breathes and sways at its
    // own low frequency so the ensemble reads as one gentle fire.
    const flames: { ox: number; w: number; h: number; om: number; ph: number; color: string }[] = [
      { ox: -0.32, w: 0.30, h: 0.55, om: 1.7, ph: 0.0, color: 'rgba(230,81,0,0.85)' },
      { ox:  0.30, w: 0.28, h: 0.50, om: 2.1, ph: 2.1, color: 'rgba(239,108,0,0.85)' },
      { ox:  0.00, w: 0.40, h: 0.85, om: 1.4, ph: 4.2, color: 'rgba(255,152,0,0.9)' },
    ];
    for (const fl of flames) {
      const bx = cx + fl.ox * fw * 0.5;
      const w2 = fl.w * fw * (1 + 0.06 * Math.sin(t * fl.om * 1.3 + fl.ph));
      const h2 = fl.h * fh * (1 + 0.16 * Math.sin(t * fl.om + fl.ph));
      const sway = w2 * 0.28 * Math.sin(t * fl.om * 0.8 + fl.ph * 1.7);
      ctx.beginPath();
      ctx.moveTo(bx - w2 / 2, baseY);
      ctx.quadraticCurveTo(bx - w2 * 0.55, baseY - h2 * 0.45, bx + sway, baseY - h2);
      ctx.quadraticCurveTo(bx + w2 * 0.55, baseY - h2 * 0.45, bx + w2 / 2, baseY);
      ctx.closePath();
      ctx.fillStyle = fl.color;
      ctx.fill();
    }
    // Inner hot core on the center flame
    const coreH = fh * 0.45 * (1 + 0.14 * Math.sin(t * 1.9 + 1.1));
    const coreSway = fw * 0.03 * Math.sin(t * 1.5 + 2.6);
    ctx.beginPath();
    ctx.moveTo(cx - fw * 0.08, baseY);
    ctx.quadraticCurveTo(cx - fw * 0.09, baseY - coreH * 0.5, cx + coreSway, baseY - coreH);
    ctx.quadraticCurveTo(cx + fw * 0.09, baseY - coreH * 0.5, cx + fw * 0.08, baseY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,213,79,0.95)';
    ctx.fill();
  } else {
    // Faint embers, slow half-hertz pulse.
    const pulse = 0.25 + 0.12 * Math.sin(t * 0.9);
    ctx.fillStyle = `rgba(255,112,67,${pulse.toFixed(3)})`;
    for (const ex of [-0.25, 0.05, 0.3]) {
      ctx.beginPath();
      ctx.arc(cx + ex * fw, baseY - fh * 0.05, Math.max(1.2, fw * 0.035), 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawFixtures(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const stateOf = (id: string) => p.hass?.states?.[id] || null;
  const fxBodyR = Math.max(6, 180 * view.scale);

  for (const l of f.lights) {
    const pt = mmToPx(view, l.x, l.y);
    const st = l.entity_id ? stateOf(l.entity_id) : null;
    const isOn = st?.state === 'on';
    const unavail = st && (st.state === 'unavailable' || st.state === 'unknown');
    const attrs = (st?.attributes || {}) as Record<string, unknown>;
    const rgb = Array.isArray(attrs.rgb_color) && (attrs.rgb_color as number[]).length === 3
      ? attrs.rgb_color as number[] : null;
    const bri = typeof attrs.brightness === 'number' ? attrs.brightness as number : 255;
    const kelvin = typeof attrs.color_temp_kelvin === 'number' ? attrs.color_temp_kelvin as number : null;
    const kind = lightIconKind(l);
    let r = 255, g = 230, b = 180;
    if (kind === 'fireplace' && isOn) {
      // Hearth always glows warm; flicker tint via mild noise.
      const f1 = 0.85 + Math.random() * 0.15;
      r = Math.round(255 * f1); g = Math.round(120 * f1); b = Math.round(40 * f1);
    } else if (rgb && isOn) [r, g, b] = rgb;
    else if (kelvin && isOn) {
      const t = Math.max(0, Math.min(1, (kelvin - 2000) / 4500));
      r = 255; g = Math.round(180 + 75 * t); b = Math.round(110 + 145 * t);
    }
    if (isOn) {
      const intensity = lightIntensity(l);
      const alpha = Math.min(1, (0.25 + 0.45 * (bri / 255)) * intensity);
      const glowR = lightRadius(l) * view.scale;  // user-controlled pool of light
      const grd = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, glowR);
      grd.addColorStop(0, `rgba(${r},${g},${b},${alpha.toFixed(3)})`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, glowR, 0, 2 * Math.PI); ctx.fill();
    }
    if (kind === 'fireplace') {
      drawFireplace2D(ctx, pt.x, pt.y, view, isOn, !!unavail, !!l.entity_id, lightRotation(l));
    } else if (kind === 'under_cabinet') {
      // Slim bar along the rotation; warm glow stroke when on.
      const rotR = lightRotation(l) * Math.PI / 180;
      const ux2 = Math.cos(rotR), uy2 = -Math.sin(rotR);
      const Lmm = lightLength(l);
      const p1 = mmToPx(view, l.x - ux2 * Lmm / 2, l.y - uy2 * Lmm / 2);
      const p2 = mmToPx(view, l.x + ux2 * Lmm / 2, l.y + uy2 * Lmm / 2);
      if (isOn) {
        ctx.save();
        ctx.strokeStyle = `rgba(${r},${g},${b},0.35)`;
        ctx.lineWidth = Math.max(6, 220 * view.scale);
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = isOn ? `rgb(${r},${g},${b})` : unavail ? '#c62828' : '#7a7a8a';
      ctx.lineWidth = Math.max(3, 60 * view.scale);
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    } else if (kind === 'string') {
      // LED string: a run of small dots along the fixture's rotation.
      const rotR = lightRotation(l) * Math.PI / 180;
      const ux2 = Math.cos(rotR), uy2 = -Math.sin(rotR);  // screen-CW → world dir
      const Lmm = lightLength(l);
      const n = Math.max(4, Math.round(Lmm / 250));
      const dotR = Math.max(2, 45 * view.scale);
      ctx.fillStyle = isOn ? `rgb(${r},${g},${b})` : unavail ? 'rgba(120,60,60,0.8)' : 'rgba(90,90,110,0.9)';
      for (let i2 = 0; i2 < n; i2++) {
        const t2 = (i2 / (n - 1) - 0.5) * Lmm;
        const dp = mmToPx(view, l.x + ux2 * t2, l.y + uy2 * t2);
        ctx.beginPath(); ctx.arc(dp.x, dp.y, dotR, 0, 2 * Math.PI); ctx.fill();
      }
    } else {
      ctx.beginPath(); ctx.arc(pt.x, pt.y, fxBodyR, 0, 2 * Math.PI);
      if (isOn) ctx.fillStyle = `rgb(${r},${g},${b})`;
      else if (unavail) ctx.fillStyle = 'rgba(120,60,60,0.7)';
      else ctx.fillStyle = 'rgba(60,60,80,0.85)';
      ctx.fill();
      ctx.strokeStyle = !l.entity_id ? '#888' : isOn ? '#fff' : unavail ? '#c62828' : '#555';
      ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = `${Math.max(9, fxBodyR * 1.1)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = isOn ? '#2a2a2a' : '#d0d0d0';
      ctx.fillText(LIGHT_GLYPH[kind] || '💡', pt.x, pt.y);
    }
    if (l.label) {
      ctx.fillStyle = '#ddd'; ctx.font = `${10 * dpr}px sans-serif`;
      ctx.fillText(l.label, pt.x, pt.y + fxBodyR + 10 * dpr);
    }
  }

  for (const sw of f.switches) {
    const pt = mmToPx(view, sw.x, sw.y);
    const st = sw.entity_id ? stateOf(sw.entity_id) : null;
    const isOn = st?.state === 'on';
    const unavail = st && (st.state === 'unavailable' || st.state === 'unknown');
    const half = (switchSize(sw) / 2) * view.scale;
    const halfPx = Math.max(8, half);
    const rot = switchRotation(sw) * Math.PI / 180;
    ctx.save();
    ctx.translate(pt.x, pt.y);
    ctx.rotate(rot);
    ctx.fillStyle = isOn ? 'rgba(76,175,80,0.55)' : unavail ? 'rgba(120,60,60,0.6)' : 'rgba(100,100,120,0.45)';
    ctx.fillRect(-halfPx, -halfPx, 2 * halfPx, 2 * halfPx);
    ctx.strokeStyle = !sw.entity_id ? '#888' : isOn ? '#4caf50' : unavail ? '#c62828' : '#777';
    ctx.lineWidth = 2;
    ctx.strokeRect(-halfPx, -halfPx, 2 * halfPx, 2 * halfPx);
    // Tiny tick on the "front" face so rotation is visible
    ctx.beginPath(); ctx.moveTo(0, -halfPx); ctx.lineTo(0, -halfPx - 4 * dpr);
    ctx.stroke();
    ctx.fillStyle = isOn ? '#e8f5e9' : '#bbb';
    ctx.font = `${Math.max(9, halfPx * 1.1)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('⏻', 0, 0);
    ctx.restore();
    if (sw.label && switchLabelPos(sw) !== 'hide') {
      const pos = switchLabelPos(sw);
      const off = halfPx + 10 * dpr;
      let lx = pt.x, ly = pt.y;
      ctx.fillStyle = '#ddd'; ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (pos === 'bottom') ly += off;
      else if (pos === 'top') ly -= off;
      else if (pos === 'left') { lx -= off; ctx.textAlign = 'right'; }
      else { lx += off; ctx.textAlign = 'left'; }
      ctx.fillText(sw.label, lx, ly);
    }
  }
}

function drawSensors(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const f = p.floor();
  // Cov toggle alone controls the LD2450 coverage wedge. Motion toggle is
  // kept independent so it controls the inclusion / filter polys + halos +
  // motion-sensor cones (handled elsewhere). This way the wedge and zones
  // can be hidden / shown independently.
  if (p.store.coverage) for (const s of f.sensors) drawCoverage(ctx, view, s);
  for (const s of f.sensors) drawSensorBody(ctx, p, view, s);
}

function drawCoverage(ctx: CanvasRenderingContext2D, view: View,
                      s: { x: number; y: number; range: number; heading: number; fov: number }): void {
  const c = mmToPx(view, s.x, s.y);
  const r = s.range * view.scale;
  const base = -Math.PI / 2 + (s.heading * Math.PI / 180);
  const half = (s.fov * Math.PI / 180) / 2;
  ctx.fillStyle = 'rgba(79,195,247,0.13)';
  ctx.strokeStyle = 'rgba(79,195,247,0.55)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(c.x, c.y);
  ctx.arc(c.x, c.y, r, base - half, base + half);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
}

function drawSensorBody(ctx: CanvasRenderingContext2D, p: Planner, view: View,
                        s: { id: string; x: number; y: number; heading: number; label: string; locked?: boolean }): void {
  const dpr = window.devicePixelRatio || 1;
  const c = mmToPx(view, s.x, s.y);
  const selected = p.store.activeSensorId === s.id;
  const base = -Math.PI / 2 + (s.heading * Math.PI / 180);
  ctx.fillStyle = selected ? '#90caf9' : '#4fc3f7';
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(c.x, c.y, 9 * dpr, 0, 2 * Math.PI);
  ctx.fill(); ctx.stroke();
  const hx = c.x + Math.cos(base) * 18 * dpr;
  const hy = c.y + Math.sin(base) * 18 * dpr;
  ctx.strokeStyle = selected ? '#fff' : '#bbdefb'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.save();
  ctx.translate(hx, hy); ctx.rotate(base);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.lineTo(-6 * dpr, -4 * dpr); ctx.lineTo(-6 * dpr, 4 * dpr);
  ctx.closePath();
  ctx.fillStyle = selected ? '#fff' : '#bbdefb'; ctx.fill();
  ctx.restore();
  ctx.font = `${11 * dpr}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const txt = s.label || 'Sensor';
  const tw = ctx.measureText(txt).width + 8 * dpr;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(c.x - tw / 2, c.y + 14 * dpr, tw, 15 * dpr);
  ctx.fillStyle = '#fff';
  ctx.fillText(txt, c.x, c.y + 16 * dpr);
  if (selected && !s.locked) {
    const rhx = c.x + Math.cos(base) * 34 * dpr;
    const rhy = c.y + Math.sin(base) * 34 * dpr;
    ctx.fillStyle = '#ffb74d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(rhx, rhy, 6 * dpr, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke();
  }
}

function drawAllZones(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const multipleBound = f.sensors.filter(s => s.deviceSlug).length > 1;

  for (const s of f.sensors) {
    if (!s.deviceSlug) continue;
    const zones = p.zonesBy[s.id]; const objs = p.objectsBy[s.id];
    if (!zones || !objs) continue;
    const prefixLabel = (txt: string) => multipleBound ? `${s.label || 'Sensor'} · ${txt}` : txt;

    for (let zi = 0; zi < zones.inclusion.length; zi++) {
      const z = zones.inclusion[zi];
      if (!z.enabled || z.vertices.length < 3) continue;
      const wv = transformVerts(s, z.vertices);
      // Visual occupancy is computed locally from displayed (lerped) target
      // positions rather than the HA `target_count`. The firmware reports
      // true counts but state events arrive interleaved with target X/Y
      // updates, so the highlight can briefly fire before the dot has moved
      // — or stay on after a target left if that update is delayed. Local
      // testing keeps the polygon glow in sync with the dot the user sees.
      const lerp = p.lerpBy[s.id];
      let occ = false;
      if (lerp) for (const sl of lerp) {
        if (sl.active && pointInPolygon(sl.cx, sl.cy, z.vertices)) { occ = true; break; }
      }
      drawPolygonWorld(ctx, wv, view, {
        fill: COLORS.inclusionFill, stroke: COLORS.inclusionStroke,
        activeFill: COLORS.inclusionActive, occupied: occ,
      });
      const ctr = centroid(wv);
      const cp = mmToPx(view, ctr.x, ctr.y);
      ctx.fillStyle = COLORS.inclusionStroke;
      ctx.font = `${11 * dpr}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(prefixLabel(z.name), cp.x, cp.y - 22);
    }
    for (let zi = 0; zi < zones.filter.length; zi++) {
      const z = zones.filter[zi];
      if (!z.enabled || z.vertices.length < 3) continue;
      const wv = transformVerts(s, z.vertices);
      const lerp = p.lerpBy[s.id];
      let occ = false;
      if (lerp) for (const sl of lerp) {
        if (sl.active && pointInPolygon(sl.cx, sl.cy, z.vertices)) { occ = true; break; }
      }
      drawPolygonWorld(ctx, wv, view, {
        fill: COLORS.filterFill, stroke: COLORS.filterStroke,
        activeFill: COLORS.filterActive, occupied: occ,
      });
      const ctr = centroid(wv);
      const cp = mmToPx(view, ctr.x, ctr.y);
      ctx.fillStyle = COLORS.filterStroke;
      ctx.font = `${11 * dpr}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(prefixLabel(z.name), cp.x, cp.y - 22);
    }
    for (let oi = 0; oi < objs.length; oi++) {
      const obj = objs[oi];
      if (!obj.enabled) continue;
      const wp = localToWorld(s, obj.x, obj.y);
      const cp = mmToPx(view, wp.x, wp.y);
      const rPx = obj.radius * view.scale;
      // Local occupancy: any displayed target inside the halo radius.
      // Same rationale as inclusion zones — keep the glow in sync with the
      // dot. (HA's binary_sensor.*_halo_occupied is firmware-correct but
      // can race target X/Y events on the WS feed.)
      const lerp = p.lerpBy[s.id];
      let occ = false;
      if (lerp) for (const sl of lerp) {
        if (!sl.active) continue;
        const dx = sl.cx - obj.x, dy = sl.cy - obj.y;
        if (dx * dx + dy * dy <= obj.radius * obj.radius) { occ = true; break; }
      }
      ctx.beginPath(); ctx.arc(cp.x, cp.y, rPx, 0, 2 * Math.PI);
      ctx.fillStyle = occ ? COLORS.haloActive : COLORS.haloIdle; ctx.fill();
      if (occ) {
        ctx.save();
        ctx.shadowColor = '#ff9800'; ctx.shadowBlur = 14;
        ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 3; ctx.stroke();
        ctx.restore();
      } else {
        ctx.strokeStyle = '#777'; ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.font = `${16 * dpr}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(obj.icon, cp.x, cp.y);
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(prefixLabel(obj.name), cp.x, cp.y - 22);
    }
  }
}

function drawActiveOverlay(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const sa = p.activeSensor(); if (!sa) return;
  const dpr = window.devicePixelRatio || 1;
  const zones = p.zonesBy[sa.id]; const objs = p.objectsBy[sa.id];
  if (!zones || !objs) return;

  for (let oi = 0; oi < objs.length; oi++) {
    const obj = objs[oi];
    if (!obj.enabled) continue;
    if (p.editObject[sa.id] !== oi) continue;
    const wp = localToWorld(sa, obj.x, obj.y);
    const pt = mmToPx(view, wp.x, wp.y);
    const rPx = obj.radius * view.scale;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, rPx, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ffb74d'; ctx.lineWidth = 2; ctx.setLineDash([]); ctx.stroke();
    const wHandle = localToWorld(sa, obj.x + obj.radius, obj.y);
    const hp = mmToPx(view, wHandle.x, wHandle.y);
    ctx.fillStyle = '#ffb74d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(hp.x, hp.y, 6, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffb74d'; ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`r=${Math.round(obj.radius)}mm`, hp.x + 9, hp.y);
  }

  const drawHandles = (zoneArr: typeof zones.inclusion, expanded: Set<number>,
                       prefix: 'iz' | 'fz', hColor: string) => {
    zoneArr.forEach((z, zi) => {
      if (!expanded.has(zi) || z.vertices.length === 0) return;
      const wv = transformVerts(sa, z.vertices);
      wv.forEach((v, vi) => {
        const pt = mmToPx(view, v.x, v.y);
        const active = p.drag?.kind === 'vert' &&
                       p.drag.prefix === prefix && p.drag.zi === zi && p.drag.vi === vi;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, active ? 8 : 6, 0, 2 * Math.PI);
        ctx.fillStyle = active ? '#fff' : hColor; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = active ? '#000' : '#fff';
        ctx.font = `bold ${9 * dpr}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(vi + 1), pt.x, pt.y);
      });
      if (wv.length >= 3) {
        const ctr = centroid(wv);
        const cp = mmToPx(view, ctr.x, ctr.y);
        ctx.beginPath(); ctx.arc(cp.x, cp.y, 9, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
        ctx.strokeStyle = hColor; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#111'; ctx.font = `${11 * dpr}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('⊹', cp.x, cp.y);
      }
    });
  };
  if (!p.editZone) {
    drawHandles(zones.inclusion, p.izExpanded[sa.id], 'iz', '#42a5f5');
    drawHandles(zones.filter,    p.fzExpanded[sa.id], 'fz', '#ef5350');
  }

  if (p.editZone && p.editZone.sensorId === sa.id) {
    const ez = p.editZone;
    const isInc = ez.prefix === 'iz';
    const strokeColor = isInc ? '#42a5f5' : '#ef5350';
    const fillColor = isInc ? 'rgba(33,150,243,0.22)' : 'rgba(244,67,54,0.18)';
    if (ez.verts.length > 0) {
      const wv = transformVerts(sa, ez.verts);
      const pts = wv.map(v => mmToPx(view, v.x, v.y));
      const mptLocal = ez.mousePos;
      const mptWorld = mptLocal ? localToWorld(sa, mptLocal.x, mptLocal.y) : null;
      const mpt = mptWorld ? mmToPx(view, mptWorld.x, mptWorld.y) : null;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
      if (mpt) ctx.lineTo(mpt.x, mpt.y);
      if (ez.verts.length >= 3) { ctx.closePath(); ctx.fillStyle = fillColor; ctx.fill(); }
      ctx.strokeStyle = strokeColor; ctx.lineWidth = 2; ctx.setLineDash([7, 4]);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = strokeColor;
      for (const pt of pts) { ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI); ctx.fill(); }
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, 8, 0, 2 * Math.PI); ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawBgEditOverlay(ctx: CanvasRenderingContext2D, p: Planner, view: View,
                           bgImg: HTMLImageElement | null): void {
  const f = p.floor();
  const bg = f.bg;
  if (!bg || bg.visible === false || !bg.dataUrl || bg.locked) return;
  if (!bgImg || !bgImg.complete) return;
  if (p.tool !== 'select') return;
  const corners = [
    bgLocalToWorld(bg, -bg.w / 2, -bg.h / 2),
    bgLocalToWorld(bg,  bg.w / 2, -bg.h / 2),
    bgLocalToWorld(bg,  bg.w / 2,  bg.h / 2),
    bgLocalToWorld(bg, -bg.w / 2,  bg.h / 2),
  ].map(c => mmToPx(view, c.x, c.y));
  ctx.save();
  ctx.strokeStyle = '#ffb74d'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 4; i++) ctx.lineTo(corners[i].x, corners[i].y);
  ctx.closePath(); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffb74d'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
  for (const c of corners) {
    ctx.beginPath(); ctx.rect(c.x - 5, c.y - 5, 10, 10);
    ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

// Up to 2 initials from a name (uppercased), '?' fallback.
function nameInitials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0] || '')
    .join('').slice(0, 2).toUpperCase() || '?';
}

// Person-colored initials chip just below a dot (shared by BLE dots + fused
// radar dots — B3). Returns the chip's bottom Y so a name label can stack under.
function drawInitialsChip(ctx: CanvasRenderingContext2D, dpr: number,
                          cx: number, cy: number, name: string, color: string): number {
  const initials = nameInitials(name);
  ctx.font = `bold ${10 * dpr}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const cw = ctx.measureText(initials).width + 8 * dpr;
  const top = cy + 10 * dpr;
  ctx.fillStyle = hexToRgba(color, 0.85);
  ctx.fillRect(cx - cw / 2, top, cw, 14 * dpr);
  ctx.fillStyle = '#fff';
  ctx.fillText(initials, cx, top + 2 * dpr);
  return top + 14 * dpr;
}

// Small dim person-colored name label under a dot (B3, `nameLabels` layer).
function drawNameLabel(ctx: CanvasRenderingContext2D, dpr: number,
                       cx: number, topY: number, name: string, color: string): void {
  ctx.font = `${9 * dpr}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = hexToRgba(color, 0.9);
  ctx.fillText(name.slice(0, 24), cx, topY + 2 * dpr);
}

// BLE-trilaterated people: a person-colored dot + an initials chip + a faint
// confidence circle (radius = the solve's uncertainty). Only people whose
// winning floor is the active floor draw here; stale fixes dim. Gated by the
// `targets` layer (same as radar dots). Only UNFUSED people draw — a person
// fused onto a radar target is drawn there instead (B3), via p.bleUnfused.
function drawBlePeople(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const nameLabelsOn = (p.store.layers2d?.nameLabels) !== false;
  for (const bp of p.bleUnfused) {
    if (bp.floorId !== f.id) continue;
    const pt = mmToPx(view, bp.x, bp.y);
    const alpha = bp.stale ? 0.4 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    // Confidence circle
    if (bp.confidenceMm > 0) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, bp.confidenceMm * view.scale, 0, 2 * Math.PI);
      ctx.strokeStyle = hexToRgba(bp.color, 0.30); ctx.lineWidth = 1.5 * dpr;
      ctx.setLineDash([4 * dpr, 4 * dpr]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = hexToRgba(bp.color, 0.06); ctx.fill();
    }
    // Dot
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 6 * dpr, 0, 2 * Math.PI);
    ctx.fillStyle = bp.color; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 * dpr;
    if (bp.stale) ctx.setLineDash([2 * dpr, 2 * dpr]);
    ctx.stroke(); ctx.setLineDash([]);
    const chipBottom = drawInitialsChip(ctx, dpr, pt.x, pt.y, bp.name, bp.color);
    // Name label only for identified people, when the layer is on (decision #4).
    if (bp.personId != null && nameLabelsOn)
      drawNameLabel(ctx, dpr, pt.x, chipBottom, bp.name, bp.color);
    ctx.restore();
  }
}

function drawTargets(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const states = p.hass?.states;
  const f = p.floor();
  if (!states) return;
  for (let si = 0; si < f.sensors.length; si++) {
    const s = f.sensors[si];
    if (!s.deviceSlug) continue;
    const d = p.discBy[s.id]; if (!d) continue;
    const lerp = p.lerpBy[s.id]; if (!lerp) continue;
    const baseColor = sensorColor(s, si);
    for (let i = 0; i < 3; i++) {
      const sl = lerp[i]; if (!sl.active) continue;
      const wp = localToWorld(s, sl.cx, sl.cy);
      const pt = mmToPx(view, wp.x, wp.y);
      const speed = parseFloat(states[d.targets[i]?.speed_id ?? '']?.state ?? '') || 0;
      const res = parseFloat(states[d.targets[i]?.resolution_id ?? '']?.state ?? '') || 500;
      const dist = Math.hypot(sl.cx, sl.cy);
      const dxW = wp.x - s.x, dyW = wp.y - s.y;
      const canvasAngle = dist > 0 ? Math.atan2(-dyW, dxW) : -Math.PI / 2;
      // Slight per-target shading so T1/T2/T3 within one sensor stay
      // distinguishable while sharing the sensor's hue.
      // Identity fusion (B3): a fused radar dot adopts the person's color, an
      // initials chip, and (layer-gated) a name label — mmWave precision wearing
      // the BLE person's identity.
      const fusion = p.fusions[`${s.id}_${i}`];
      const tintColor = fusion ? fusion.color
        : (i === 0 ? baseColor : lighten(baseColor, i === 1 ? 0.20 : 0.40));
      drawTargetDot(ctx, pt.x, pt.y, tintColor, fusion ? '' : `T${i + 1}`,
        speed, canvasAngle, res * view.scale);
      if (fusion) {
        const dpr2 = window.devicePixelRatio || 1;
        ctx.save();
        const chipBottom = drawInitialsChip(ctx, dpr2, pt.x, pt.y, fusion.name, fusion.color);
        if (fusion.personId != null && (p.store.layers2d?.nameLabels) !== false)
          drawNameLabel(ctx, dpr2, pt.x, chipBottom, fusion.name, fusion.color);
        ctx.restore();
      }
      if (p.showDetails) {
        const angDeg = (Math.atan2(sl.cx, Math.max(sl.cy, 0.0001)) * 180 / Math.PI);
        const dirs = ['N','NE','E','SE','S','SW','W','NW'];
        const dirIdx = ((Math.round(angDeg / 45) % 8) + 8) % 8;
        const lines = [
          `pos  ${Math.round(sl.cx)}, ${Math.round(sl.cy)} mm`,
          `dist ${(dist / 1000).toFixed(2)} m`,
          `dir  ${dirs[dirIdx]} (${angDeg.toFixed(0)}°)`,
          `spd  ${speed >= 0 ? '↗' : '↙'}${Math.abs(speed).toFixed(0)} cm/s`,
          `res  ${Math.round(res)} mm`,
        ];
        const fs = 10 * dpr;
        ctx.font = `${fs}px sans-serif`;
        const tw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 10 * dpr;
        const th = lines.length * (fs + 2) + 8 * dpr;
        let bx = pt.x + 28 * dpr;
        let by = pt.y - th - 22 * dpr;
        const c = ctx.canvas;
        if (bx + tw > c.width - 4 * dpr) bx = pt.x - tw - 28 * dpr;
        if (by < 4 * dpr) by = pt.y + 22 * dpr;
        if (bx < 4 * dpr) bx = 4 * dpr;
        if (by + th > c.height - 4 * dpr) by = c.height - th - 4 * dpr;
        ctx.strokeStyle = hexToRgba(tintColor, 0.53); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(bx + tw / 2, by + th / 2); ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.fillRect(bx, by, tw, th);
        ctx.strokeStyle = hexToRgba(tintColor, 0.80); ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, tw, th);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        lines.forEach((l, li) => ctx.fillText(l, bx + 5 * dpr, by + 4 * dpr + li * (fs + 2)));
      }
    }
  }
}
