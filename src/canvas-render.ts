import {
  GRID_MM, mmToCanvas, fmtLen, distMM, transformVerts, centroid,
  pointInPolygon, localToWorld, bgLocalToWorld,
  lightRadius, lightIntensity, lightIconKind, lightRotation, lightLength, switchRotation, switchSize, switchLabelPos,
  isFirepitKind, FIREPIT_SIZE_MM,
  motionColor, motionIntensity, sensorColor, BLE_PROXY_DEFAULTS,
  ALARM_DEFAULTS, alarmStateColor, CALENDAR_DEFAULTS,
  lockGlyphColor, lockGlyphSecured, lockGlyphTransitional, lockGlyphJammed,
  THERMO_DEFAULTS, hvacModeColor, hvacActionColor, hvacActionActive, hvacAirflow, HVAC_VENT_COLORS,
  climateTempUnit, fmtTempNum,
  actionButtonSize, actionButtonColor, actionButtonIcon,
  safetyColor, safetyGlyph, safetyIsFloor, safetyIsPlate, SAFETY_DEFAULTS, leakPuddleRadiusMm,
  robotGlyph, robotColor, robotProgress, dockParkedHeading, ROBOT_DEFAULTS,
  presenceZoneColor, cameraFov, cameraRange, cameraStateColor, cameraColor,
  projectorProjecting, projectorAim, projectorBeamColor, projectorThrow, screenCenterHeight, biasLightColor,
  VALVE_DEFAULTS, valveOpenness, valveFlowing, valveTransitional, valveRotation,
  SPRINKLER_DEFAULTS, sprinklerRunning, sprinklerHeadKind, sprinklerArcDeg, sprinklerRadius, sprinklerRotation,
  FLAGPOLE_DEFAULTS, flagpoleHoistFraction,
  PLUG_DEFAULTS, plugRotation,
  groundAreaColor, groundKindLabel,
  poolWaterColor, POOL_COPING_COLOR,
  powerGlowScale, ALIGN_DRAG_KINDS, IDENTIFY_TTL_MS, IDENTIFY_FADE_MS,
  hexToRgba, lighten, furnitureKind, furnitureCorners, resolveFurnitureDef, isBinKind, isSinkKind, binStateIsFull,
  isClimateApplianceKind, climateApplianceRun,
  isMechanicalApplianceKind, isPumpKind, mechanicalRun, mechanicalGlowColor,
  isRackKind, rackHealth, rackHealthColor,
  isDroopPlant, plantThirsty, PLANT_MOISTURE_DEFAULT_THRESHOLD,
  isVehicleKind, evStatusOf, evStatusColor, evChargePercent, carChargeState,
  isStairsKind, stairChipArrow, stairsRiseMm, stairsTreadCount, FURNITURE_KINDS,
  doorEndpoint, doorOpenDeltaDeg, doorOpenFraction, doorSpanCenter, doorSlideDir,
  windowEndpoints, wallCutsForSegment, wallKind, isBayWindowKind, bayProjectSign, bayPlan,
  ENV_KINDS, envKindOf, envColor, envValueText, envScale,
  infoCardText, infoCardRule, infoCardScale, infoCardMount,
  closedWallLoops, loopContaining, roomLabel, roomsByLoop, roomFloorLook,
  heatmapColor, HEATMAP_COMFORT_LO_DEFAULT, HEATMAP_COMFORT_HI_DEFAULT,
  parseNowPlaying, isMediaPlayerId,
  resolveRulerEnds, outerWallSegments, wallDimSide, structureExtents,
  peekFloors,
  midpointHandles, POLY_VERTEX_CAP_GROUND, POLY_VERTEX_CAP_POOL, POLY_VERTEX_CAP_VOID,
  POLY_VERTEX_CAP_PATH, POLY_VERTEX_CAP_PZONE,
} from './geometry.js';
import { compass8, fmtDistanceM, fmtAccuracyM } from './geo.js';
import { resolveNorth, northMarkerPos, markerScaleOf } from './compass.js';
import { calendarLines, weatherCardLines, resolveScreenContent, CAL_HEADER_COLOR, type ScreenMode } from './surfaces.js';
import { CONDITION_GLYPH, uvBand, demoSunAltAz } from './weather.js';
import {
  SOLAR_DEFAULTS, resolveSunPlan, solarAim, solarRotation,
  solarPowerValue, solarPowerColor, solarPowerText,
} from './solar.js';
import { ALERT_BEACON_DEFAULTS, alertBeaconState, alertBeaconColor, alertBeaconAlarming, isAlertDomain } from './alerts.js';
import { flagDominant } from './flags.js';
import { vehicleRecipe } from './vehicles.js';
import { vacMapAffine, vacSegColor, type ParsedVacMap, type VacSegment } from './valetudo-map.js';
import {
  flightDisplayPos, flightShellMm, sanitizeLabelFields,
  resolveFlightGlow, flightGlowFrame, lerpHexColor, FLIGHT_DEFAULT_BEACON,
  FLIGHT_LABEL_FIELDS_DEFAULT, FLIGHTS_DEFAULT_RADIUS_NM, type FlightPoint,
  flightFieldText, flightLabelLines, flightPointSpeedBand,
} from './flights.js';
// aircraft-types.ts is pure + zero-import like flights.ts. Imported HERE only so
// the 2D speed echo resolves the archetype fallback (used when the feed carries
// no ground speed) through the very same table the 3D rig does — otherwise a
// speed-less turboprop could show band-2 dashes on the plan and a band-3 tail in
// the scene. Type-table only; nothing three.js-shaped comes with it.
import { aircraftArchetype } from './aircraft-types.js';
// The label-text resolvers live in flights.ts (pure, shared with three-renderer
// so the 2D line and the 3D plate can never drift — they used to be mirrored
// copies here). Re-exported because the flights-ui test page consumes them off
// the combined canvas bundle.
export { flightFieldText, flightLabelLines };
import type { Planner } from './planner.js';
import type { Vec2, LightIconKind, Furniture, ObjectRecipe, RecipePrimitive, HassState, FloorTexKind, RobotFixture, Floor } from './types.js';

// ── `objectLabels` layer (absent = ON) ──────────────────────────────────────
// Gates NAME / caption text on fixtures and structural items — door + window
// pills, furniture piece labels, and every "<name> · <state>" fixture caption.
// It deliberately does NOT gate VALUE readouts (env readings, info-card values,
// thermostat temps, power W chips, mail counts, open %): those convey STATE, not
// identity, and stay under their own fixture's layer. Self-gating on the store
// (the drawBatteryBadge idiom) so no draw* signature had to grow a parameter.
function objectLabelsOn(p: Planner): boolean {
  return p.store.layers2d?.objectLabels !== false;
}

// ── `openingStatus` layer (absent = ON) ─────────────────────────────────────
// Gates ONLY the STATE badge on the door + window pills (`OPEN` / `closed` /
// `NN%`) — the name half stays under `objectLabels`, so the two compose into a
// 4-way matrix (see fixtureCaption). Deliberately scoped to openings: every
// other fixture's state badge stays under that fixture's own layer. 2D-only —
// the 3D scene expresses door/window state as GEOMETRY (swing angle, garage
// slats, tilted panes), never as text, so there is no 3D counterpart to gate.
function openingStatusOn(p: Planner): boolean {
  return p.store.layers2d?.openingStatus !== false;
}

// Compose a fixture caption from its NAME and its optional STATE badge under the
// objectLabels layer. With names hidden the badge survives on its own (`Porch ·
// armed away` → `armed away`); with no badge at all the caption disappears
// entirely. Returns '' when nothing should be drawn.
//
// `showBadge` (default true — every caller but the door/window pills leaves it
// alone) is the second, independent switch behind the `openingStatus` layer:
//   names ✓ badge ✓ → `Front · OPEN`      names ✗ badge ✓ → `OPEN`
//   names ✓ badge ✗ → `Front`             names ✗ badge ✗ → ''  (no pill at all)
function fixtureCaption(showNames: boolean, name: string, badge?: string | null,
                        showBadge = true): string {
  const b = showBadge ? (badge ?? '').trim() : '';
  if (!showNames) return b;
  return b ? `${name} · ${b}` : name;
}
export { fixtureCaption };

// Per-sink 2D fill level (0..1), eased toward 1 while the sink runs and 0 when
// off (mirrors the 3D _sinkFill blend, but 2D has no renderer state — track it
// here off the RAF `now` clock). Keyed by fixture id; a subtle blue basin tint
// scales with it. Purely cosmetic accumulator, not persisted.
const _sink2dFill = new Map<string, { v: number; t: number }>();

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
  wall_sconce: '◨', step: '▤', flood: '🔆', inground: '⤒', ground_spot: '⟰',
  heatlamp: '♨', exhaust: '❊', exhaust_wall: '⊛', exhaust_light: '❈',
  firepit_round: '◉', firepit_square: '▣',
};

export interface View {
  ox: number; oy: number; scale: number;
}

// Low-battery warning badge (#7). Self-gating: draws nothing unless the `battery`
// 2D layer is on (absent = on), the entity has a resolvable battery sibling
// (Planner.batteryFor), AND that level is ≤ LOW. A small red battery glyph at
// (x, y) — the corner of the fixture's marker. Cheap map hit per call.
const BATTERY_LOW = 20;
export function drawBatteryBadge(
  ctx: CanvasRenderingContext2D, p: Planner, entityId: string | null | undefined,
  x: number, y: number,
): void {
  if (p.store.layers2d?.battery === false) return;
  drawBatteryGlyph(ctx, p.batteryFor(entityId), x, y);
}
// Device-bound fixtures (BLE proxies) resolve battery from the device directly.
export function drawBatteryBadgeForDevice(
  ctx: CanvasRenderingContext2D, p: Planner, deviceId: string | null | undefined,
  x: number, y: number,
): void {
  if (p.store.layers2d?.battery === false) return;
  drawBatteryGlyph(ctx, p.batteryForDevice(deviceId), x, y);
}
function drawBatteryGlyph(
  ctx: CanvasRenderingContext2D, lvl: number | null, x: number, y: number,
): void {
  if (lvl == null || lvl > BATTERY_LOW) return;
  const dpr = window.devicePixelRatio || 1;
  const w = 11 * dpr, h = 6 * dpr;
  ctx.save();
  ctx.translate(x, y);
  // Body outline.
  ctx.fillStyle = '#b71c1c';
  ctx.strokeStyle = '#ff5252';
  ctx.lineWidth = Math.max(1, dpr);
  ctx.beginPath();
  ctx.rect(-w / 2, -h / 2, w, h);
  ctx.fill(); ctx.stroke();
  // Terminal nub.
  ctx.fillStyle = '#ff5252';
  ctx.fillRect(w / 2, -h / 4, 1.6 * dpr, h / 2);
  // Fill bar proportional to level (min sliver so it reads even near 0).
  const frac = Math.max(0.12, lvl / 100);
  ctx.fillStyle = '#ff8a80';
  ctx.fillRect(-w / 2 + 1 * dpr, -h / 2 + 1 * dpr, (w - 2 * dpr) * frac, h - 2 * dpr);
  ctx.restore();
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

// Small padlock indicator (Feature 2, door lock state). `state` maps to color +
// shackle pose: locked = filled amber/red + closed shackle; unlocked = green
// outline + open (shifted) shackle; anything else = grey. `s` is the screen
// half-size in px (~5). Drawn at (cx, cy). Display only.
function drawPadlock(ctx: CanvasRenderingContext2D, cx: number, cy: number,
                     s: number, state: string | null | undefined,
                     displayOnly = false): void {
  const color = lockGlyphColor(state);          // shared 2D+3D+sidebar resolution
  const secured = lockGlyphSecured(state);      // locked / jammed / locking → filled + closed shackle
  // Display-only locks dim to ~70 % (they don't respond to taps — the "unbound
  // dims" affordance convention). Transitional states dim further (a "moving"
  // cue); jammed pulses so a fault doesn't sit silently (cheap — the RAF
  // redraws every frame).
  let alpha = displayOnly ? 0.7 : 1;
  if (lockGlyphTransitional(state)) alpha *= 0.6;
  if (lockGlyphJammed(state)) { const t = (Math.sin(performance.now() / 300) + 1) / 2; alpha *= 0.55 + 0.45 * t; }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = Math.max(1, s * 0.32);
  ctx.strokeStyle = color;
  // Shackle (arc). Open lock: hinge up on one side so it reads "unlocked".
  const bodyTop = cy - s * 0.1;
  ctx.beginPath();
  if (!secured) {
    ctx.arc(cx + s * 0.55, bodyTop - s * 0.35, s * 0.6, Math.PI * 0.9, Math.PI * 2.05);
  } else {
    ctx.arc(cx, bodyTop - s * 0.35, s * 0.6, Math.PI, Math.PI * 2);
  }
  ctx.stroke();
  // Body.
  const bw = s * 1.5, bh = s * 1.2;
  ctx.beginPath();
  ctx.roundRect(cx - bw / 2, bodyTop, bw, bh, s * 0.2);
  if (secured) { ctx.fillStyle = color; ctx.fill(); }
  else { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fill(); ctx.stroke(); }
  ctx.restore();
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

// Room-name label px half-extents, published per painted label (the
// envChipHalfPx idiom: the room's WORLD anchor is the position, this is the
// screen-space extent). Feeds hitRoomLabel → the `roomAnchor` drag. CLEARED in
// drawAll OUTSIDE the `labels` layer gate, so a hidden layer is undraggable.
export const roomLabelHalfPx = new Map<string, { w: number; h: number }>();

// --- Midpoint vertex-INSERT handles -----------------------------------------
// A dim hollow "+" ghost at the midpoint of every edge of a selected shape.
// Pressing one splices a vertex there and starts the ordinary vertex drag, so
// the user places the new point in the SAME gesture. Deliberately smaller and
// dimmer than the solid vertex handles so the two never read as the same thing.
export const INSERT_HANDLE_MIN_PX = 24;   // edges shorter than this on screen get no handle
export const INSERT_HANDLE_R_PX = 4;      // drawn half-size (px, pre-DPR)

// Screen-px declutter threshold expressed in world mm for the current zoom.
export function insertHandleMinLenMm(view: View): number {
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  return INSERT_HANDLE_MIN_PX * dpr / Math.max(view.scale, 1e-9);
}

// The insert affordance is an EDIT tool: only edit mode + the Select tool (the
// only place mousedown can act on it) ever paints or hit-tests it.
export function insertHandlesEnabled(p: Planner): boolean {
  return p.uiMode === 'edit' && p.tool === 'select';
}

// Per-kind cap resolution: insertion must never push a shape past what a fresh
// draw could produce (the draw latches / finish* handlers enforce these).
export const POLY_CAPS = {
  ground: POLY_VERTEX_CAP_GROUND,
  pool: POLY_VERTEX_CAP_POOL,
  void: POLY_VERTEX_CAP_VOID,
  path: POLY_VERTEX_CAP_PATH,
  pzone: POLY_VERTEX_CAP_PZONE,
} as const;

function drawInsertHandles(ctx: CanvasRenderingContext2D, view: View,
                           pts: { x: number; y: number }[], closed: boolean): void {
  const hs = midpointHandles(pts, closed, insertHandleMinLenMm(view));
  if (!hs.length) return;
  const dpr = window.devicePixelRatio || 1;
  const r = INSERT_HANDLE_R_PX * dpr;
  ctx.save();
  ctx.lineWidth = 1;
  for (const h of hs) {
    const q = mmToPx(view, h.x, h.y);
    ctx.fillStyle = 'rgba(10,16,24,0.45)';
    ctx.strokeStyle = 'rgba(255,255,255,0.42)';
    ctx.beginPath();
    ctx.rect(q.x - r, q.y - r, r * 2, r * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(q.x - r * 0.5, q.y); ctx.lineTo(q.x + r * 0.5, q.y);
    ctx.moveTo(q.x, q.y - r * 0.5); ctx.lineTo(q.x, q.y + r * 0.5);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.stroke();
  }
  ctx.restore();
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
  // Neighborhood overlay (OpenFreeMap) — muted background CONTEXT drawn EARLY
  // (right after bg, before ground paint) so it reads unambiguously as backdrop.
  // Gated on its own layer (default on) AND the FEATURE being enabled with data
  // resolved. Exclusion masks draw dashed-dim in edit mode.
  if (on(L.neighborhood) && p.store.neighborhood?.enabled) drawNeighborhood(ctx, p, view);
  // Ground / yard covering areas — painted right after the floor, under walls /
  // furniture / everything structural.
  if (on(L.ground)) drawGroundAreas(ctx, p, view);
  // Pools / spas — water bodies painted right after ground (rides the same
  // `ground` layer gate; the "wet" sibling of ground paint), under structure.
  if (on(L.ground)) drawPools(ctx, p, view);
  // Floor voids / openings — dark hatched holes, drawn right after ground
  // (rides the same `ground` layer gate).
  if (on(L.ground)) drawVoidAreas(ctx, p, view);
  // Valetudo robot room-map overlay — diagnostic paint, DEFAULT OFF (absent = off,
  // unlike most layers). Drawn as floor paint, under walls / furniture.
  if (L.vacuumMap === true) drawVacuumMaps(ctx, p, view);
  // Per-room temperature heat-map — DEFAULT OFF (opt-in analysis view). Room
  // wall-loop fills + a temp label, drawn as floor paint after ground / before
  // structural. The RAF reads live states so it tracks temperature changes.
  if (L.heatmap === true) drawHeatmap(ctx, p, view);
  // Peek floors — onion-skin reference underlay: other floors flagged `peek2d`
  // (and not disabled) draw their wall outlines as thin ghost strokes, BEFORE
  // the active floor's walls. A display state (like disabled) — all UI modes,
  // and hideable wholesale via its own layer (a card / kiosk preset cannot
  // reach the per-floor `peek2d` flags).
  if (on(L.peekFloors)) drawPeekFloors(ctx, p, view);
  if (on(L.walls)) drawWalls(ctx, p, view);
  // Room labels are draggable anchors — the pick map is rebuilt every frame and
  // cleared HERE, outside the layer gate, so a hidden `labels` layer is also
  // undraggable (the flightHitPx rule).
  roomLabelHalfPx.clear();
  if (on(L.labels)) drawRooms(ctx, p, view);
  // Doors + windows share ONE key: they are a single "openings" concept to a
  // user, and in 3D they share `_doorGroup` (which also carries curtains and
  // lock deadbolts), so a split would need a build-time group split too.
  if (on(L.openings)) { drawDoors(ctx, p, view); drawWindows(ctx, p, view); }
  if (on(L.furniture) || on(L.appliances)) drawFurniture(ctx, p, view, on(L.furniture), on(L.appliances));
  if (L.activity === true) drawActivity(ctx, p, view);
  if (on(L.lights) || on(L.switches)) drawFixtures(ctx, p, view, on(L.lights), on(L.switches));
  if (on(L.switches)) drawActionButtons(ctx, p, view);  // action buttons ride the switches layer (they ARE a control)
  if (on(L.motion)) drawMotionSensors(ctx, p, view);
  if (on(L.env)) drawEnvSensors(ctx, p, view);
  if (L.info !== false) drawInfoCards(ctx, p, view);
  if (on(L.sensors)) drawSensors(ctx, p, view);
  if (on(L.sensors)) drawBleProxies(ctx, p, view);
  if (on(L.sensors)) drawAlarmPanels(ctx, p, view);
  if (on(L.sensors)) drawCalendarPanels(ctx, p, view);
  if (on(L.sensors)) drawThermostats(ctx, p, view);
  if (on(L.sensors)) drawSafetySensors(ctx, p, view);
  if (on(L.sensors)) drawAlertBeacons(ctx, p, view);
  if (on(L.robots)) drawRobots(ctx, p, view);         // robots own their layer (split off `sensors`)
  if (on(L.sensors)) drawCameras(ctx, p, view);
  if (on(L.sensors)) drawProjectors(ctx, p, view);
  if (on(L.sensors)) drawValves(ctx, p, view);       // water valves ride the sensors layer
  if (on(L.ground)) drawSprinklerZones(ctx, p, view); // irrigation heads ride the ground layer
  if (on(L.furniture)) drawFlagpoles(ctx, p, view);   // yard flagpoles are decor → furniture layer
  if (on(L.sensors)) drawSolarPanels(ctx, p, view);   // sun-tracking solar panels ride the sensors layer
  if (on(L.switches)) drawPlugs(ctx, p, view);        // smart plugs ride the switches layer
  // LD2450 inclusion / filter polygons + object halos draw per the zones
  // layer. The Motion toggle only hides motion-sensor cones (drawMotionSensors
  // gates its own cone block).
  if (on(L.zones)) {
    drawPresenceZones(ctx, p, view);
    drawAllZones(ctx, p, view);
    drawActiveOverlay(ctx, p, view);
  }
  drawBgEditOverlay(ctx, p, view, bgImg);
  if (on(L.targets)) drawTargets(ctx, p, view);
  if (on(L.targets)) drawBlePeople(ctx, p, view);
  if (on(L.targets)) drawCamTargets(ctx, p, view);
  // Geo landmark pins + GPS device pins + geo_location event pins (all ride the
  // `geo` layer).
  if (on(L.geo)) { drawGeoLandmarks(ctx, p, view); drawRecordedPins(ctx, p, view); drawGpsPins(ctx, p, view); drawGeoEventPins(ctx, p, view); }
  // Live aircraft (roadmap P4) — darts on the compressed shell, drawn late (over
  // everything structural) but under the screen-fixed overlays. Clicking one
  // opens the flight card, so the pick map is rebuilt every frame; clearing it
  // HERE (outside the layer gate) is what makes a hidden layer untappable.
  flightHitPx.clear();
  if (on(L.flights)) drawFlights(ctx, p, view);
  drawNorthMarker(ctx, p, view);
  drawDoorbellPulses(ctx, p, view);
  // Dimensions overlay (rulers + wall/structure dimension lines) — drawn LATE so
  // it sits above everything. Default ON (absent = on).
  if (on(L.dimensions)) { drawWallDimensions(ctx, p, view); drawRulers(ctx, p, view); }
  drawAlignGuides(ctx, p, view);
  drawFloorEditHandles(ctx, p, view);
  // Live dimension readouts for the in-flight drag / draw latch — LAST, over
  // everything, edit mode only, and gone the moment the anchor is released.
  drawLiveDims(ctx, p, view);
  // Alt+click identify callout — the very last thing painted, so it is never
  // hidden by the item it names.
  drawIdentifyCallout(ctx, p, view);
}

// Glyph per identified kind (the callout's line-1 prefix). A kind with no entry
// falls back to the generic marker — a missing glyph must never blank the plate.
const IDENTIFY_GLYPH: Record<string, string> = {
  wall: '▭', furniture: '🛋', light: '💡', switch: '⏻', sensor: '📡', motion: '👣',
  env: '🌡', info: '🔢', action: '🔘', ble: '📶', alarm: '🚨', calendar: '📅',
  thermostat: '🌡', safety: '⚠️', alert: '🔔', robot: '🤖', camera: '📷',
  projector: '📽', valve: '🚰', plug: '🔌', sprinkler: '🚿', flagpole: '🚩', solar: '☀️',
  door: '🚪', window: '🪟', ruler: '📏', pzone: '⬟', ground: '🟩', pool: '🏊',
  void: '⬛', room: '🏠', landmark: '📍',
};

// Alt+click IDENTIFY callout: a small dark plate beside the named item saying
// what it is and, when locked, why it won't move. Edit mode only; fades out over
// the last IDENTIFY_FADE_MS of the latch's TTL (the RAF redraws every frame, so
// it animates for free) and disappears with the latch. Screen-clamped like the
// other chips so an item near the edge still explains itself.
function drawIdentifyCallout(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  if (p.uiMode !== 'edit') return;
  const fx = p.identifyFx;
  if (!fx) return;
  const age = performance.now() - fx.at;
  if (age >= IDENTIFY_TTL_MS) return;
  const alpha = age > IDENTIFY_TTL_MS - IDENTIFY_FADE_MS
    ? Math.max(0, (IDENTIFY_TTL_MS - age) / IDENTIFY_FADE_MS) : 1;
  const dpr = window.devicePixelRatio || 1;
  const c = mmToPx(view, fx.x, fx.y);
  const line1 = `${IDENTIFY_GLYPH[fx.kind] ?? '◈'}  ${fx.label}`;
  const line2 = fx.locked ? '🔒 locked — unlock in the sidebar' : '';
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `bold ${12 * dpr}px sans-serif`;
  const w1 = ctx.measureText(line1).width;
  ctx.font = `${10 * dpr}px sans-serif`;
  const w2 = line2 ? ctx.measureText(line2).width : 0;
  const padX = 9 * dpr, padY = 6 * dpr;
  const bw = Math.max(w1, w2) + padX * 2;
  const bh = (line2 ? 30 : 17) * dpr + padY * 2;
  // Prefer up-right of the item; clamp fully on screen.
  let bx = c.x + 14 * dpr, by = c.y - bh - 12 * dpr;
  bx = Math.max(4 * dpr, Math.min(ctx.canvas.width - bw - 4 * dpr, bx));
  by = Math.max(4 * dpr, Math.min(ctx.canvas.height - bh - 4 * dpr, by));
  // Leader dot on the item itself.
  ctx.fillStyle = 'rgba(255,213,79,0.95)';
  ctx.beginPath(); ctx.arc(c.x, c.y, 5 * dpr, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(255,213,79,0.6)'; ctx.lineWidth = 1.5 * dpr;
  ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(bx + padX, by + bh / 2); ctx.stroke();
  // Plate.
  ctx.fillStyle = 'rgba(12,18,26,0.94)';
  ctx.strokeStyle = fx.locked ? 'rgba(255,138,128,0.85)' : 'rgba(255,213,79,0.85)';
  ctx.lineWidth = 1.5 * dpr;
  const r = 6 * dpr;
  ctx.beginPath();
  ctx.moveTo(bx + r, by);
  ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
  ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
  ctx.arcTo(bx, by + bh, bx, by, r);
  ctx.arcTo(bx, by, bx + bw, by, r);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = '#eceff1';
  ctx.font = `bold ${12 * dpr}px sans-serif`;
  ctx.fillText(line1, bx + padX, by + padY);
  if (line2) {
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.fillStyle = '#ff8a80';
    ctx.fillText(line2, bx + padX, by + padY + 16 * dpr);
  }
  ctx.restore();
}

// Live aircraft (ADS-B, roadmap P4). Display-only — no hit test, nothing
// selectable. Positions come from the SAME pure flightDisplayPos the 3D shell
// uses, so both views place a given aircraft on the same compressed bearing/
// radius; the shell is anchored on the HOME POINT (the geo fit's plan origin,
// else the floor centre), not on the floor rect.
// ── Flight status beacon (research §2 / §4.2 + flight-glow-rules.md) ─────────
// EXACTLY ONE beacon per aircraft. The resolution ladder — master gate,
// unconditional emergency, first matching USER GLOW RULE, then the shipped
// interesting/military/LADD default — now lives in the pure `resolveFlightGlow`
// in flights.ts, which BOTH views call. The old "deliberately mirrored in ~6
// lines each, keep the two in step" arrangement is retired: flights.ts is
// zero-import and app-graph-safe, so 2D imports it directly and the two can no
// longer drift. This wrapper survives for the default-only callers (and the
// tests) that just want the priority colour.
export const FLIGHT_BEACON_COLORS = FLIGHT_DEFAULT_BEACON;

export function flightBeaconColor(fp: FlightPoint, on: boolean,
                                  rules?: import('./flights.js').FlightGlowRule[]): string | null {
  return resolveFlightGlow(fp, rules, on)?.colorA ?? null;
}

// Where each aircraft's dart landed last frame, for hit-testing (the
// envChipHalfPx idiom: a WORLD anchor + a screen-px extent, so the hit test
// scales with zoom exactly like the glyph does). The anchor is the aircraft's
// COMPUTED display position rather than a stored fixture x/y — there is no
// placed object here — which is why it has to be published from the draw pass.
// Cleared by drawAll every frame, so hiding the layer empties it too.
export const flightHitPx = new Map<string, { x: number; y: number; rPx: number }>();

// NB the 2D glyph is deliberately ABSTRACT — one dart for every aircraft. The
// named military skins (FlightsConfig.militarySkins, vehicle library V3) are a
// 3D-only silhouette swap: at plan scale a fighter and an airliner are the same
// few pixels, so there is nothing to express here, and the label/beacon/privacy
// treatment below is shared with the 3D rig exactly as before.
function drawFlights(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const cfg = p.store.flights;
  if (!cfg?.enabled) return;
  const list = p.flightsNow;
  if (!list || list.length === 0) return;
  const origin = p.flightsOrigin();
  if (!origin) return;
  const f = p.floor();
  const fit = p.geoFit();
  const calibrated = !!fit && fit.transform.quality !== 'none';
  const theta = calibrated ? fit!.transform.thetaRad : 0;
  const ax = calibrated ? fit!.transform.tx : f.w / 2;
  const ay = calibrated ? fit!.transform.ty : f.d / 2;
  const radiusNm = cfg.radiusNm ?? FLIGHTS_DEFAULT_RADIUS_NM;
  // User draw radius → the display shell's rim in mm. The 2D plan and the 3D
  // shell must resolve it identically (both go through flightShellMm), or a
  // dot and its rig would sit at different distances from the house.
  const shellMm = flightShellMm(cfg.shellRadiusM);
  // Display-HEIGHT scale: 2D shows no height, but flightDisplayPos must still be
  // called with it so the two views resolve ONE geometry call the same way (and
  // so a future 2D consumer of dispY can never silently disagree with the shell).
  const vScale = cfg.verticalScale;
  // Banded speed indicator (flightSpeedBand). The 2D echo is deliberately
  // minimal — dashes behind the dart — but it reads the SAME resolver the 3D
  // rigs do, so a plane with a contrail can never show band-2 dashes here.
  // Stateless (no prevBand): this canvas keeps no per-aircraft state, and a dash
  // count flickering for one frame at a threshold is invisible.
  const speedViz = cfg.speedViz !== false;
  const showLabels = cfg.showLabels !== false;
  const fields = sanitizeLabelFields(cfg.labelFields) ?? FLIGHT_LABEL_FIELDS_DEFAULT;
  const beaconsOn = cfg.beacons !== false;
  const privacyDim = cfg.privacyDim !== false;
  const glowRules = cfg.glowRules;
  const dpr = window.devicePixelRatio || 1;
  const R = 9 * dpr;
  // Beacon animation + the appliance-LED idiom: the 2D RAF redraws every frame
  // and keeps NO per-aircraft state, so the clock IS the phase — fed into the
  // SAME pure `flightGlowFrame` the 3D rigs sample from their per-rig
  // accumulator, so one formula serves both views (research §5).
  const tSec = performance.now() / 1000;
  ctx.save();
  for (const fp of list) {
    const d = flightDisplayPos(fp, origin.lat, origin.lon, theta, radiusNm, shellMm, vScale);
    const wx = ax + d.planX, wy = ay + d.planY;
    const pt = mmToPx(view, wx, wy);
    // Publish the pick target: the dart plus a comfortable touch margin (the
    // glyph itself is only ~9 px, far under a finger).
    flightHitPx.set(fp.hex, { x: wx, y: wy, rPx: R * 1.8 });
    // Screen rotation: the glyph is authored pointing SCREEN-UP (0,−1). Canvas y
    // is flipped, so a plan track unit (px, py) points at screen (px, −py); a
    // ctx.rotate(a) sends (0,−1) to (sin a, −cos a) ⇒ a = atan2(px, py).
    let a = 0;
    if (fp.trackDeg != null) {
      const e = Math.sin(fp.trackDeg * Math.PI / 180), n = Math.cos(fp.trackDeg * Math.PI / 180);
      const c = Math.cos(theta), s = Math.sin(theta);
      a = Math.atan2(c * e - s * n, s * e + c * n);
    }
    // PIA/LADD courtesy dimming (research §4.2) — the glyph AND its text fade;
    // the status beacon deliberately does NOT (a LADD aircraft still beacons).
    const dim = privacyDim && (fp.pia === true || fp.ladd === true);
    ctx.save();
    ctx.translate(pt.x, pt.y);
    ctx.rotate(a);
    ctx.globalAlpha = dim ? 0.45 : 1;
    // ── Banded speed echo ────────────────────────────────────────────────────
    // Drawn FIRST, in the rotated glyph frame where +Y is directly astern, so
    // the dart paints over its own trail. Band 1 draws nothing — the absence is
    // the hover cue in 2D exactly as it is in 3D.
    if (speedViz) {
      const band = flightPointSpeedBand(fp, null, aircraftArchetype(fp.typeCode, fp.category));
      if (band >= 2) {
        ctx.save();
        ctx.lineCap = 'round';
        if (band <= 3) {
          // 1 dash (band 2) / 2 dashes (band 3) — the cartoon speed-line echo.
          for (let i = 0; i < band - 1; i++) {
            const y0 = R * (1.25 + i * 0.9);
            ctx.globalAlpha = (dim ? 0.45 : 1) * (0.6 - i * 0.18);
            ctx.strokeStyle = 'rgba(203,213,225,0.9)';
            ctx.lineWidth = 1.6 * dpr;
            ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(0, y0 + R * 0.55); ctx.stroke();
          }
        } else {
          // Bands 4–5: the contrail's 2D analog — one short fading tail stroke,
          // longer at band 5, which also gets the warm afterburner dot.
          const len = R * (band === 5 ? 4.2 : 3);
          const grd = ctx.createLinearGradient(0, R * 0.9, 0, R * 0.9 + len);
          grd.addColorStop(0, 'rgba(226,238,252,0.7)');
          grd.addColorStop(1, 'rgba(226,238,252,0)');
          ctx.strokeStyle = grd;
          ctx.lineWidth = 2.4 * dpr;
          ctx.beginPath(); ctx.moveTo(0, R * 0.9); ctx.lineTo(0, R * 0.9 + len); ctx.stroke();
          if (band === 5) {
            ctx.globalAlpha = (dim ? 0.45 : 1) * 0.85;
            ctx.fillStyle = 'rgba(255,176,84,0.95)';
            ctx.beginPath(); ctx.arc(0, R * 1.1, R * 0.3, 0, Math.PI * 2); ctx.fill();
          }
        }
        ctx.restore();
      }
    }
    ctx.beginPath();
    ctx.moveTo(0, -R);                       // nose
    ctx.lineTo(R * 0.62, R * 0.58);          // right tail
    ctx.lineTo(0, R * 0.22);                 // notch
    ctx.lineTo(-R * 0.62, R * 0.58);         // left tail
    ctx.closePath();
    ctx.fillStyle = fp.military ? 'rgba(139,152,99,0.92)' : 'rgba(203,213,225,0.9)';
    ctx.fill();
    ctx.lineWidth = 1 * dpr;
    ctx.strokeStyle = 'rgba(15,23,32,0.7)';
    ctx.stroke();
    ctx.restore();
    // Status / user-rule glow: a pulsing ring around the dart (research §5).
    // Still at most two ctx.arc strokes — `solid` with a second colour draws a
    // dimmer outer ring as the 2D analog of "bead core + tinted halo";
    // everything else animates one ring's alpha + colour off the shared
    // envelope. `none` resolves to null and draws nothing, exactly like the old
    // no-beacon branch.
    const glow = resolveFlightGlow(fp, glowRules, beaconsOn);
    if (glow) {
      const fr = flightGlowFrame(glow.pattern, tSec);
      // `solid` / `alternate` hold a constant brightness — the colour is the
      // whole signal there, so the ring must not breathe (§5).
      const steady = glow.pattern === 'solid' || glow.pattern === 'alternate';
      const stroke = glow.colorB && !steady
        ? lerpHexColor(glow.colorA, glow.colorB, fr.mix)
        : glow.pattern === 'alternate' && glow.colorB
          ? (fr.mix >= 0.5 ? glow.colorB : glow.colorA)     // hard swap, no lerp
          : glow.colorA;
      ctx.save();
      ctx.globalAlpha = steady ? 0.6 : fr.alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, R * 1.5, 0, Math.PI * 2);
      ctx.lineWidth = 2 * dpr;
      ctx.strokeStyle = stroke;
      ctx.stroke();
      if (glow.pattern === 'solid' && glow.colorB) {
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, R * 1.95, 0, Math.PI * 2);
        ctx.strokeStyle = glow.colorB;
        ctx.stroke();
      }
      ctx.restore();
    }
    if (showLabels) {
      const { top, sub } = flightLabelLines(fp, fields, privacyDim);
      ctx.save();
      ctx.globalAlpha = dim ? 0.5 : 1;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.fillStyle = 'rgba(203,213,225,0.85)';
      ctx.fillText(top, pt.x + R + 3 * dpr, pt.y - 3 * dpr);
      if (sub) {
        ctx.font = `${9 * dpr}px sans-serif`;
        ctx.fillStyle = 'rgba(148,163,184,0.7)';
        ctx.fillText(sub, pt.x + R + 3 * dpr, pt.y + 8 * dpr);
      }
      ctx.restore();
    }
  }
  ctx.restore();
}

// In-plan north icon (compass feature). Gated on Store.compass.showNorthMarker
// — its own config gate, not a 2D layer (it renders in ALL UI modes, like GPS
// pins). Sits just OUTSIDE the floor rect where the ray from the floor centre
// along true north exits (northMarkerPos), drawn screen-fixed (~18 px, the
// battery-badge idiom): a circled arrowhead pointing along north + a bold "N".
function drawNorthMarker(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const cfg = p.store.compass;
  if (!cfg || cfg.showNorthMarker !== true) return;
  const f = p.floor();
  const n = resolveNorth(cfg, p.geoFit());
  const mk = northMarkerPos(f.w, f.d, n.nx, n.ny);
  const s = mmToPx(view, mk.x, mk.y);
  const dpr = window.devicePixelRatio || 1;
  const sc = markerScaleOf(cfg);           // user size multiplier (0.5..4)
  const r = 9 * dpr * sc;                  // ~18 px circle, screen-fixed
  // On-screen arrow angle: world (nx, ny) → screen (nx, −ny); CW-from-up =
  // atan2(nx, ny) — mk.angleRad already is exactly that.
  // Two-tone halo design so the icon reads at every scene preset (day grass,
  // dusk orange, night dark): a saturated red arrow/rim over a slightly larger
  // near-white backing outline. White-on-warm and red-on-pale both contrast.
  const RED = '#e6291a';
  const HALO = 'rgba(245,245,245,0.9)';
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10,14,20,0.55)';
  ctx.fill();
  ctx.lineWidth = 3 * dpr * sc;            // near-white halo ring behind…
  ctx.strokeStyle = HALO;
  ctx.stroke();
  ctx.lineWidth = 1.5 * dpr;               // …the red rim on top
  ctx.strokeStyle = RED;
  ctx.stroke();
  ctx.rotate(mk.angleRad);                 // canvas rotate is CW in screen space
  const arrow = () => {                     // arrowhead pointing screen-up pre-rotation
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.62);
    ctx.lineTo(r * 0.42, r * 0.38);
    ctx.lineTo(0, r * 0.08);
    ctx.lineTo(-r * 0.42, r * 0.38);
    ctx.closePath();
  };
  arrow();                                  // near-white backing stroke behind the red fill
  ctx.lineWidth = 3 * dpr * sc;
  ctx.strokeStyle = HALO;
  ctx.stroke();
  arrow();
  ctx.fillStyle = RED;
  ctx.fill();
  ctx.restore();
}

// Floor-boundary edit affordance (Task: drag the canvas edges). In edit + select
// mode, small square handles sit at each edge midpoint so the resize is
// discoverable. While a floorEdge drag is live, the dragged edge highlights and
// a dims label follows it. Gated internally; drawn last so it sits on top.
function drawFloorEditHandles(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  if (p.uiMode !== 'edit' || p.tool !== 'select') return;
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  // `f.boundsLocked` is no longer consulted: its toggle was removed with the
  // sidebar floor-size controls, so a stored lock would hide these handles
  // permanently. See the matching note in canvas-interact's mousedown.
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
    // The live `W × D` readout itself comes from the single live-dimension
    // site (liveDimChips / drawLiveDims, end of drawAll).
  }
  ctx.restore();
}

// Smart alignment guides: dashed accent lines through the aligned coordinate,
// spanning the full canvas. Edit mode only, and only while an align-eligible
// drag is in flight (stale guides never paint). The kind set is the SHARED
// `ALIGN_DRAG_KINDS` (geometry.ts) — the snapper and this painter used to keep
// two hand-maintained copies and this one was the smaller, so safety / alert /
// robot / camera / projector drags snapped with no visible line.
function drawAlignGuides(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  if (p.uiMode !== 'edit' || !p.drag || !ALIGN_DRAG_KINDS.has(p.drag.kind)) return;
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
      lines.push({ txt: `${pin.name} · ${fmtDistanceM(pin.distanceM, p.store.imperial)} ${compass8(pin.bearingDeg)}`, color: '#fff' });
    } else {
      lines.push({ txt: pin.name || 'Person', color: '#fff' });
      if (indoor) lines.push({ txt: `~${fmtAccuracyM(pin.accuracyMm / 1000, p.store.imperial)} indoors`, color: '#ffb74d' });
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
    // CSV-imported, awaiting placement: real lat/lon but only a placeholder plan
    // position (excluded from the fit) — draw it in the dashed/dim uncalibrated
    // idiom, tinted amber so it reads as "needs you".
    const pending = lm.pendingPlace === true;
    // Switched off by the user: still a real calibrated pin (KEEPS its colour so
    // it stays recognisable) but it feeds nothing — drawn in the dashed/dim
    // idiom, the same visual grammar as "not participating". Distinct from
    // `hidden`, which skips the draw entirely.
    const excluded = lm.excluded === true;
    const active = p.placingLandmarkId === lm.id || p.geoCalib?.landmarkId === lm.id;
    const solid = calibrated && !pending && !excluded;
    const base = pending ? '#ffb74d' : calibrated ? '#4dd0e1' : '#90a4ae';
    // Highlight ring for active (placing / calibrating) pins.
    if (active) {
      ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(c.x, c.y, 12 * dpr, 0, 2 * Math.PI); ctx.stroke();
    }
    // Pin body.
    ctx.fillStyle = solid ? base
      : pending ? 'rgba(255,183,77,0.6)'
      : excluded && calibrated ? 'rgba(77,208,225,0.45)'
      : 'rgba(144,164,174,0.6)';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    if (!solid) ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(c.x, c.y, 7 * dpr, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    // Pin glyph.
    ctx.fillStyle = '#06232a'; ctx.font = `${9 * dpr}px sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('📍', c.x, c.y);
    // Name + calibration caption below.
    ctx.textBaseline = 'top';
    const txt = lm.name || 'Landmark';
    const cap = pending
      ? 'imported · place me'
      : excluded && calibrated
        ? 'excluded from alignment'
        : calibrated
          ? (lm.accuracy != null ? fmtAccuracyM(lm.accuracy, p.store.imperial) : 'calibrated')
          : 'uncalibrated';
    ctx.font = `${10 * dpr}px sans-serif`;
    const tw = Math.max(ctx.measureText(txt).width, ctx.measureText(cap).width) + 8 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(c.x - tw / 2, c.y + 11 * dpr, tw, 25 * dpr);
    ctx.fillStyle = '#fff';
    ctx.fillText(txt, c.x, c.y + 13 * dpr);
    ctx.fillStyle = pending ? 'rgba(255,183,77,0.9)'
      : excluded && calibrated ? 'rgba(129,212,250,0.55)'
      : calibrated ? 'rgba(129,212,250,0.85)' : 'rgba(176,190,197,0.75)';
    ctx.font = `${9 * dpr}px sans-serif`;
    ctx.fillText(cap, c.x, c.y + 25 * dpr);
  }
  ctx.restore();
  drawLandmarkSuggestion(ctx, p, view);
}

// Ghost pin for the latched landmark's SUGGESTED position (edit mode only — it
// is an authoring affordance, not a display prop). Draws where the current geo
// fit says the pin should sit, a dashed connector from where it actually sits,
// and the gap in metres/feet at the midpoint. Zero latch → zero cost.
function drawLandmarkSuggestion(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  if (p.uiMode !== 'edit') return;
  const s = p.landmarkSuggestion();
  if (!s) return;
  const dpr = window.devicePixelRatio || 1;
  const cur = mmToPx(view, s.curX, s.curY);
  const sug = mmToPx(view, s.x, s.y);
  ctx.save();
  // Dashed connector current → suggested.
  ctx.strokeStyle = 'rgba(77,208,225,0.55)';
  ctx.lineWidth = 1.5 * dpr;
  ctx.setLineDash([5 * dpr, 4 * dpr]);
  ctx.beginPath(); ctx.moveTo(cur.x, cur.y); ctx.lineTo(sug.x, sug.y); ctx.stroke();
  // Ghost pin: hollow dashed ring in the calibrated cyan, plus a faded glyph.
  ctx.strokeStyle = 'rgba(77,208,225,0.9)';
  ctx.lineWidth = 1.8 * dpr;
  ctx.beginPath(); ctx.arc(sug.x, sug.y, 7 * dpr, 0, 2 * Math.PI); ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.55;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${9 * dpr}px sans-serif`;
  ctx.fillText('📍', sug.x, sug.y);
  ctx.globalAlpha = 1;
  // Gap label at the midpoint of the connector.
  const txt = `⇢ ${fmtDistanceM(s.distMm / 1000, p.store.imperial)}`;
  ctx.font = `${10 * dpr}px sans-serif`;
  const tw = ctx.measureText(txt).width + 8 * dpr;
  const mx = (cur.x + sug.x) / 2, my = (cur.y + sug.y) / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(mx - tw / 2, my - 7 * dpr, tw, 14 * dpr);
  ctx.fillStyle = 'rgba(129,212,250,0.95)';
  ctx.fillText(txt, mx, my);
  ctx.restore();
}

// Recorded-position pins (roadmap P2 — the reverse of landmarks): amber diamond
// markers projected through the geo fit, numbered in chain order, connected by a
// dashed route polyline (+ closing segment when recordedClosed), each chain
// segment labelled with its length. Pins whose lat/lon can't project (no fit)
// are simply skipped — the sidebar explains why. Rides the `geo` layer.
const RECORDED_COLOR = '#ffab40'; // amber / route
function drawRecordedPins(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const projected = p.projectedRecordedPins().filter(r => r.ok);
  if (!projected.length) return;
  const dpr = window.devicePixelRatio || 1;
  const closed = p.store.geo?.recordedClosed === true && projected.length >= 3;
  const pts = projected.map(r => mmToPx(view, r.x, r.y));
  ctx.save();

  // Dashed chain polyline through the pins in order (+ closing segment).
  if (pts.length >= 2) {
    ctx.strokeStyle = 'rgba(255,171,64,0.8)';
    ctx.lineWidth = 1.6 * dpr;
    ctx.setLineDash([6 * dpr, 4 * dpr]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    if (closed) ctx.lineTo(pts[0].x, pts[0].y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Segment-length labels at each segment midpoint (boundary walking wants distances).
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${9 * dpr}px sans-serif`;
  const segLabel = (aI: number, bI: number) => {
    const a = projected[aI], b = projected[bI];
    const A = pts[aI], B = pts[bI];
    const len = fmtLen(Math.hypot(a.x - b.x, a.y - b.y), p.store.imperial);
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
    const tw = ctx.measureText(len).width + 6 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(mx - tw / 2, my - 7 * dpr, tw, 14 * dpr);
    ctx.fillStyle = '#ffd8a8';
    ctx.fillText(len, mx, my);
  };
  for (let i = 1; i < pts.length; i++) segLabel(i - 1, i);
  if (closed) segLabel(pts.length - 1, 0);

  // Diamond markers + index numbers + accuracy caption.
  for (let i = 0; i < projected.length; i++) {
    const r = projected[i], c = pts[i];
    const s = 7 * dpr;
    ctx.fillStyle = RECORDED_COLOR;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4 * dpr;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y - s); ctx.lineTo(c.x + s, c.y);
    ctx.lineTo(c.x, c.y + s); ctx.lineTo(c.x - s, c.y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Index number to the right of the pin.
    ctx.fillStyle = '#3a2200';
    ctx.font = `bold ${9 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), c.x, c.y);
    // Name + accuracy caption below.
    const nm = r.name || `Point ${i + 1}`;
    const cap = r.accuracy != null ? fmtAccuracyM(r.accuracy, p.store.imperial) : 'manual';
    ctx.textBaseline = 'top';
    ctx.font = `${9 * dpr}px sans-serif`;
    const tw = Math.max(ctx.measureText(nm).width, ctx.measureText(cap).width) + 8 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(c.x - tw / 2, c.y + s + 2 * dpr, tw, 22 * dpr);
    ctx.fillStyle = '#ffd8a8';
    ctx.fillText(nm, c.x, c.y + s + 3 * dpr);
    ctx.fillStyle = 'rgba(255,171,64,0.8)';
    ctx.fillText(cap, c.x, c.y + s + 13 * dpr);
  }
  ctx.restore();
}

// geo_location event pins (roadmap #9): a warning-diamond marker in a per-source
// color (quake amber, fire red, else violet) + name + distance/magnitude caption.
// Dimmed beyond 50 km. Drawn with landmarks/GPS under the `geo` layer.
function drawGeoEventPins(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const pins = p.geoEventPins;
  if (!pins.length) return;
  ctx.save();
  ctx.textAlign = 'center';
  for (const pin of pins) {
    const at = mmToPx(view, pin.clampedX, pin.clampedY);
    const col = pin.category === 'quake' ? '#ffb300' : pin.category === 'fire' ? '#ef5350' : '#b388ff';
    const far = pin.distanceKm > 50;
    ctx.globalAlpha = far ? 0.45 : 1;
    // Warning diamond marker.
    const R = 9 * dpr;
    ctx.beginPath();
    ctx.moveTo(at.x, at.y - R);
    ctx.lineTo(at.x + R, at.y);
    ctx.lineTo(at.x, at.y + R);
    ctx.lineTo(at.x - R, at.y);
    ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = '#1a1200'; ctx.lineWidth = 1.5 * dpr; ctx.stroke();
    // ! glyph.
    ctx.fillStyle = '#1a1200'; ctx.font = `bold ${10 * dpr}px sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(pin.magnitude != null ? '!' : (pin.category === 'fire' ? '🔥' : '!'), at.x, at.y);
    // Caption: name + distance/magnitude label.
    const lines = [pin.name, pin.label];
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textBaseline = 'top';
    let tw = 0;
    for (const ln of lines) tw = Math.max(tw, ctx.measureText(ln).width);
    tw += 8 * dpr;
    const boxY = at.y + R + 2 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(at.x - tw / 2, boxY, tw, lines.length * 13 * dpr + 2 * dpr);
    ctx.fillStyle = '#fff'; ctx.fillText(lines[0], at.x, boxY + 2 * dpr);
    ctx.fillStyle = hexToRgba(col, 0.95); ctx.fillText(lines[1], at.x, boxY + 15 * dpr);
  }
  ctx.restore();
}

// ── Rulers (measure tool) + wall/structure dimensions (Feature A + B) ───────
const RULER_COLOR = '#ffb74d';   // orange, matches the vertex-handle affordance

// A dark distance chip centered at a px point (screen-fixed size), optionally
// rotated so it reads along a dimension line (upside-down text is flipped).
function drawDimChip(ctx: CanvasRenderingContext2D, dpr: number, px: number, py: number,
                     text: string, color: string, angle = 0, big = false, alpha = 1): void {
  const fs = (big ? 12 : 11) * dpr;
  ctx.save();
  if (alpha !== 1) ctx.globalAlpha = alpha;
  ctx.translate(px, py);
  let a = angle;
  if (a > Math.PI / 2) a -= Math.PI; else if (a < -Math.PI / 2) a += Math.PI;
  ctx.rotate(a);
  ctx.font = `${fs}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 8 * dpr, h = fs + 6 * dpr;
  ctx.fillStyle = 'rgba(10,14,20,0.85)';
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = hexToRgba(color, 0.7); ctx.lineWidth = dpr;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = '#fff';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// ── Live dimension readouts (in-flight drags / draw latches) ───────────────
// One chip family, one draw site. While an EDIT-mode interaction that changes a
// SIZE is in flight — drawing a wall / area, dragging a vertex, resizing a piece
// or the floor rect — the affected lengths are shown as screen-space chips
// formatted with the SAME `fmtLen` the ruler + wall-dimension overlays use, so
// metric / imperial always agree. Nothing persists: the chips exist only while
// `p.drag` / a `drawing*` latch is set, and vanish on release.
//
// `liveDimChips` is the pure computation (world-mm anchors + text); `drawLiveDims`
// is the dumb painter. Keeping them split is what makes the behavior testable
// without a canvas.
export interface LiveDimChip {
  x: number;        // anchor, world mm
  y: number;        // anchor, world mm
  text: string;     // already formatted via fmtLen (respects store.imperial)
  dim?: boolean;    // context (already-committed) rather than the live edge
}

const LIVE_DIM_COLOR = '#90caf9';   // matches the wall/structure dimension family

// Chips for whatever size-changing interaction is currently in flight. Empty
// outside edit mode and whenever nothing is being drawn / resized.
//
// DELIBERATE SKIPS: pure MOVE drags (furniture, fixtures, whole walls, zone
// moves, bg move) — moving isn't resizing; rotate drags — no length changes;
// `rulerEnd` — the ruler already paints its own live measurement chip;
// `envResize` — that handle scales a screen-space chip by a unitless factor,
// not a physical dimension.
export function liveDimChips(p: Planner): LiveDimChip[] {
  const out: LiveDimChip[] = [];
  if (p.uiMode !== 'edit') return out;
  const f = p.floor();
  const imp = p.store.imperial;
  const seg = (a: Vec2, b: Vec2, dim?: boolean) => {
    out.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, text: fmtLen(distMM(a, b), imp), dim });
  };
  // Two edges adjoining vertex `i` of a polygon (`closed` wraps; an open
  // polyline just skips the missing side). n < 3 closed = one edge only.
  const adjoining = (pts: Vec2[], i: number, closed: boolean) => {
    const n = pts.length;
    if (n < 2 || !pts[i]) return;
    const prev = i > 0 ? i - 1 : (closed && n > 2 ? n - 1 : -1);
    const next = i < n - 1 ? i + 1 : (closed && n > 2 ? 0 : -1);
    if (prev >= 0) seg(pts[prev], pts[i]);
    if (next >= 0) seg(pts[i], pts[next]);
  };
  // Rubber-band edge of a draw latch: last committed point → live cursor.
  const rubber = (pts: Vec2[] | undefined) => {
    if (p.cursor && pts && pts.length) seg(pts[pts.length - 1], p.cursor);
  };
  const box = (cx: number, cy: number, w: number, h: number) => {
    out.push({ x: cx, y: cy, text: `${fmtLen(w, imp)} × ${fmtLen(h, imp)}` });
  };

  // ── Draw latches ────────────────────────────────────────────────────────
  const dw = p.drawingWall;
  if (dw?.points.length) {
    // Committed segments stay visible but dimmed; the rubber band is live.
    for (let i = 0; i < dw.points.length - 1; i++) seg(dw.points[i], dw.points[i + 1], true);
    rubber(dw.points);
  }
  rubber(p.drawingPresenceZone?.points);
  rubber(p.drawingGroundArea?.points);
  rubber(p.drawingVoidArea?.points);
  rubber(p.drawingPoolArea?.points);
  rubber(p.drawingPath?.points);
  rubber(p.drawingExclusion?.points);
  // LD2450 zone editor: verts + mousePos are SENSOR-LOCAL mm (distance is
  // rotation-invariant, so only the chip anchor needs mapping to world).
  const ez = p.editZone;
  if (ez?.mousePos && ez.verts.length) {
    const sa = p.activeSensor();
    if (sa) {
      const a = ez.verts[ez.verts.length - 1], b = ez.mousePos;
      const wpt = localToWorld(sa, (a.x + b.x) / 2, (a.y + b.y) / 2);
      out.push({ x: wpt.x, y: wpt.y, text: fmtLen(distMM(a, b), imp) });
    }
  }

  // ── In-flight drags ─────────────────────────────────────────────────────
  const d = p.drag;
  if (!d) return out;
  switch (d.kind) {
    case 'wallv': {
      const w = f.walls.find(x => x.id === d.wallId);
      if (w) {
        // Every segment of the dragged wall; the two the vertex touches read
        // full-strength, the rest stay as dimmed context.
        for (let i = 0; i < w.points.length - 1; i++) {
          seg(w.points[i], w.points[i + 1], i !== d.idx && i !== d.idx - 1);
        }
      }
      break;
    }
    case 'floorEdge': {
      // W × D at the dragged edge's midpoint (world +Y up ⇒ 'top' is y = d).
      const mx = d.edge === 'left' ? 0 : d.edge === 'right' ? f.w : f.w / 2;
      const my = d.edge === 'bottom' ? 0 : d.edge === 'top' ? f.d : f.d / 2;
      box(mx, my, f.w, f.d);
      break;
    }
    case 'furnCorner': {
      const it = f.furniture[d.idx];
      if (it) box(it.x, it.y, it.w, it.h);
      break;
    }
    case 'bgCorner': {
      const bg = f.bg;
      if (bg) box(bg.x, bg.y, bg.w, bg.h);
      break;
    }
    case 'pzoneVert': {
      const z = (f.presenceZones ?? []).find(x => x.id === d.id);
      if (z) adjoining(z.points, d.idx, true);
      break;
    }
    case 'groundVert': {
      const g = (f.groundAreas ?? []).find(x => x.id === d.id);
      if (g) adjoining(g.points, d.idx, true);
      break;
    }
    case 'voidVert': {
      const v = (f.voidAreas ?? []).find(x => x.id === d.id);
      if (v) adjoining(v.points, d.idx, true);
      break;
    }
    case 'poolVert': {
      const pl = (f.pools ?? []).find(x => x.id === d.id);
      if (pl) adjoining(pl.points, d.idx, true);
      break;
    }
    case 'pathVert': {
      // The centerline is an OPEN polyline — no wrap-around edge.
      const g = (f.groundAreas ?? []).find(x => x.id === d.id);
      if (g?.path) adjoining(g.path.centerline, d.idx, false);
      break;
    }
    case 'vert': {
      const sa = p.activeSensor();
      const zs = sa ? p.zonesBy[sa.id] : null;
      const zone = zs ? (d.prefix === 'iz' ? zs.inclusion : zs.filter)[d.zi] : null;
      if (sa && zone) {
        const pts = zone.vertices;
        const n = pts.length;
        if (n >= 2 && pts[d.vi]) {
          const push = (a: Vec2, b: Vec2) => {
            const wpt = localToWorld(sa, (a.x + b.x) / 2, (a.y + b.y) / 2);
            out.push({ x: wpt.x, y: wpt.y, text: fmtLen(distMM(a, b), imp) });
          };
          const prev = d.vi > 0 ? d.vi - 1 : (n > 2 ? n - 1 : -1);
          const next = d.vi < n - 1 ? d.vi + 1 : (n > 2 ? 0 : -1);
          if (prev >= 0) push(pts[prev], pts[d.vi]);
          if (next >= 0) push(pts[d.vi], pts[next]);
        }
      }
      break;
    }
    default: break;
  }
  return out;
}

// Dumb painter for `liveDimChips` — screen-space chips, never scaled by zoom,
// never rotated (they must stay readable at any drag angle), clamped a few px
// inside the canvas so an off-screen anchor still reports.
function drawLiveDims(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const chips = liveDimChips(p);
  if (!chips.length) return;
  const dpr = window.devicePixelRatio || 1;
  const cw = ctx.canvas.width, ch = ctx.canvas.height;
  const mx = 44 * dpr, my = 14 * dpr;
  ctx.save();
  for (const c of chips) {
    const pt = mmToPx(view, c.x, c.y);
    const px = Math.max(mx, Math.min(cw - mx, pt.x));
    const py = Math.max(my, Math.min(ch - my, pt.y));
    drawDimChip(ctx, dpr, px, py, c.text, LIVE_DIM_COLOR, 0, false, c.dim ? 0.5 : 1);
  }
  ctx.restore();
}

// A small inward-pointing arrowhead at `tip` aimed FROM `from` (both px).
function drawDimArrow(ctx: CanvasRenderingContext2D, dpr: number,
                      tip: { x: number; y: number }, from: { x: number; y: number }): void {
  const dx = tip.x - from.x, dy = tip.y - from.y, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;               // toward the tip
  const s = 6 * dpr;
  const bx = tip.x - ux * s, by = tip.y - uy * s;    // base of the head
  const nx = -uy, ny = ux;                           // perpendicular
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(bx + nx * s * 0.5, by + ny * s * 0.5);
  ctx.lineTo(bx - nx * s * 0.5, by - ny * s * 0.5);
  ctx.closePath();
  ctx.fill();
}

// A full CAD dimension: extension ticks from each wall endpoint out to the dim
// line, the dim line itself with inward arrowheads, and a rotated length chip.
function drawDimSegment(ctx: CanvasRenderingContext2D, dpr: number, color: string,
                        wallA: { x: number; y: number }, wallB: { x: number; y: number },
                        dimA: { x: number; y: number }, dimB: { x: number; y: number },
                        label: string, big = false): void {
  ctx.strokeStyle = hexToRgba(color, 0.85);
  ctx.fillStyle = hexToRgba(color, 0.85);
  ctx.lineWidth = Math.max(1, dpr);
  // Extension ticks.
  ctx.beginPath();
  ctx.moveTo(wallA.x, wallA.y); ctx.lineTo(dimA.x, dimA.y);
  ctx.moveTo(wallB.x, wallB.y); ctx.lineTo(dimB.x, dimB.y);
  ctx.stroke();
  // Dim line.
  ctx.beginPath(); ctx.moveTo(dimA.x, dimA.y); ctx.lineTo(dimB.x, dimB.y); ctx.stroke();
  drawDimArrow(ctx, dpr, dimA, dimB);
  drawDimArrow(ctx, dpr, dimB, dimA);
  const mid = { x: (dimA.x + dimB.x) / 2, y: (dimA.y + dimB.y) / 2 };
  const angle = Math.atan2(dimB.y - dimA.y, dimB.x - dimA.x);
  drawDimChip(ctx, dpr, mid.x, mid.y, label, color, angle, big);
}

// Rulers — dashed measurement lines with end ticks / handles + a distance chip.
function drawRulers(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const f = p.floor();
  const list = f.rulers ?? [];
  const dpr = window.devicePixelRatio || 1;
  const imperial = p.store.imperial;
  ctx.save();
  for (const r of list) {
    const sel = p.activeRulerId === r.id;
    const res = resolveRulerEnds(r, f);
    if (!res) {
      // Broken (an object end was deleted) — mark the surviving point end.
      const pt = r.a.kind === 'point' ? r.a : r.b.kind === 'point' ? r.b : null;
      if (!pt) continue;
      const c = mmToPx(view, pt.x, pt.y);
      ctx.setLineDash([4 * dpr, 3 * dpr]);
      ctx.strokeStyle = '#ef5350'; ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath(); ctx.arc(c.x, c.y, 6 * dpr, 0, 2 * Math.PI); ctx.stroke();
      ctx.setLineDash([]);
      drawDimChip(ctx, dpr, c.x, c.y - 16 * dpr, '?', '#ef5350');
      continue;
    }
    const A = mmToPx(view, res.ax, res.ay), B = mmToPx(view, res.bx, res.by);
    // Dashed measurement line.
    ctx.setLineDash([6 * dpr, 4 * dpr]);
    ctx.strokeStyle = hexToRgba(RULER_COLOR, sel ? 1 : 0.85);
    ctx.lineWidth = (sel ? 2 : 1.5) * dpr;
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    ctx.setLineDash([]);
    // Perpendicular end ticks.
    const ang = Math.atan2(B.y - A.y, B.x - A.x);
    const nx = -Math.sin(ang), ny = Math.cos(ang), tk = 7 * dpr;
    ctx.beginPath();
    ctx.moveTo(A.x - nx * tk, A.y - ny * tk); ctx.lineTo(A.x + nx * tk, A.y + ny * tk);
    ctx.moveTo(B.x - nx * tk, B.y - ny * tk); ctx.lineTo(B.x + nx * tk, B.y + ny * tk);
    ctx.stroke();
    // End affordances: point ends → draggable square handle; object ends → ring.
    const endMark = (end: typeof r.a, px: { x: number; y: number }) => {
      if (end.kind === 'point') {
        const s = 5 * dpr;
        ctx.fillStyle = sel ? RULER_COLOR : 'rgba(20,24,30,0.9)';
        ctx.strokeStyle = RULER_COLOR; ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath(); ctx.rect(px.x - s, px.y - s, s * 2, s * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.strokeStyle = RULER_COLOR; ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath(); ctx.arc(px.x, px.y, 5 * dpr, 0, 2 * Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(px.x, px.y, 1.5 * dpr, 0, 2 * Math.PI);
        ctx.fillStyle = RULER_COLOR; ctx.fill();
      }
    };
    endMark(r.a, A); endMark(r.b, B);
    // Distance chip at the midpoint.
    drawDimChip(ctx, dpr, (A.x + B.x) / 2, (A.y + B.y) / 2, fmtLen(res.mm, imperial), RULER_COLOR, ang);
  }
  // Placement preview: from the placed end A to the live cursor.
  if (p.tool === 'ruler' && p.drawingRuler && p.cursor) {
    const tmp = { id: '__preview', a: p.drawingRuler.a,
                  b: { kind: 'point' as const, x: p.cursor.x, y: p.cursor.y } };
    const res = resolveRulerEnds(tmp, f);
    if (res) {
      const A = mmToPx(view, res.ax, res.ay), B = mmToPx(view, res.bx, res.by);
      ctx.setLineDash([6 * dpr, 4 * dpr]);
      ctx.strokeStyle = hexToRgba(RULER_COLOR, 0.7); ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      ctx.setLineDash([]);
      drawDimChip(ctx, dpr, (A.x + B.x) / 2, (A.y + B.y) / 2, fmtLen(res.mm, imperial),
                  RULER_COLOR, Math.atan2(B.y - A.y, B.x - A.x));
    }
  }
  ctx.restore();
}

// Wall / structure dimension lines (Feature B) — CAD dims per wall segment per
// the floor's dimensionMode, plus overall structure extents for all / outside.
function drawWallDimensions(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const f = p.floor();
  const mode = f.dimensionMode;
  if (!mode || mode === 'off') return;
  const dpr = window.devicePixelRatio || 1;
  const imperial = p.store.imperial;
  const loops = floorLoops(f);
  // Select the wall segments to dimension.
  type Seg = { a: Vec2; b: Vec2 };
  let segs: Seg[] = [];
  if (mode === 'all') {
    for (const w of f.walls)
      for (let i = 0; i < w.points.length - 1; i++) segs.push({ a: w.points[i], b: w.points[i + 1] });
  } else if (mode === 'outside') {
    segs = outerWallSegments(f.walls).filter(s => s.exterior).map(s => ({ a: s.a, b: s.b }));
  } else { // custom
    for (const w of f.walls) {
      if (!w.dimension) continue;
      for (let i = 0; i < w.points.length - 1; i++) segs.push({ a: w.points[i], b: w.points[i + 1] });
    }
  }
  ctx.save();
  const OFF = 28 * dpr;
  for (const seg of segs) {
    const len = distMM(seg.a, seg.b);
    if (len < 300) continue;   // skip tiny segments (label soup)
    const side = wallDimSide(seg, loops);
    const sn = { x: side.x, y: -side.y };   // world normal → screen (y flip)
    const A = mmToPx(view, seg.a.x, seg.a.y), B = mmToPx(view, seg.b.x, seg.b.y);
    const dimA = { x: A.x + sn.x * OFF, y: A.y + sn.y * OFF };
    const dimB = { x: B.x + sn.x * OFF, y: B.y + sn.y * OFF };
    drawDimSegment(ctx, dpr, '#90caf9', A, B, dimA, dimB, fmtLen(len, imperial));
  }
  // Overall structure extents (all / outside).
  if (mode === 'all' || mode === 'outside') {
    const ext = structureExtents(f.walls);
    if (ext) {
      const BIG = 48 * dpr;
      // Total width along the south (world minY) edge, pushed DOWN on screen.
      const wa = mmToPx(view, ext.minX, ext.minY), wb = mmToPx(view, ext.maxX, ext.minY);
      drawDimSegment(ctx, dpr, '#a5d6a7', wa, wb,
        { x: wa.x, y: wa.y + BIG }, { x: wb.x, y: wb.y + BIG },
        fmtLen(ext.maxX - ext.minX, imperial), true);
      // Total depth along the west (world minX) edge, pushed LEFT on screen.
      const da = mmToPx(view, ext.minX, ext.minY), db = mmToPx(view, ext.minX, ext.maxY);
      drawDimSegment(ctx, dpr, '#a5d6a7', da, db,
        { x: da.x - BIG, y: da.y }, { x: db.x - BIG, y: db.y },
        fmtLen(ext.maxY - ext.minY, imperial), true);
    }
  }
  ctx.restore();
}

// Activity overlay for the "simple floorplan" style: soft glow pools where
// lights are ON and where motion sensors are firing, so a stripped-down plan
// still shows which rooms are alive. Drawn under fixture markers.
function drawActivity(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const f = p.floor();
  // Room occupancy glow (#1): fill each occupied room's wall-loop polygon with a
  // soft warm wash (Frigate zone / FP2 / any bound occupancy binary_sensor 'on').
  const states0 = p.hass?.states;
  const rooms = f.rooms ?? [];
  if (rooms.some(rm => rm.occupancyEntity)) {
    const loops = floorLoops(f);
    for (const rm of rooms) {
      if (!rm.occupancyEntity) continue;
      if (states0?.[rm.occupancyEntity]?.state !== 'on') continue;
      const loop = loopContaining(loops, rm.anchor.x, rm.anchor.y);
      if (!loop || loop.length < 3) continue;
      ctx.save();
      ctx.beginPath();
      const p0 = mmToPx(view, loop[0].x, loop[0].y);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < loop.length; i++) {
        const pi = mmToPx(view, loop[i].x, loop[i].y);
        ctx.lineTo(pi.x, pi.y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,183,77,0.10)';
      ctx.fill();
      ctx.restore();
    }
  }
  for (const l of f.lights) {
    const st = p.effectiveState(l);
    if (st?.state !== 'on') continue;
    const c = mmToPx(view, l.x, l.y);
    const r = Math.max(20, lightRadius(l) * 1.4 * view.scale);
    const attrs = (st.attributes ?? {}) as Record<string, unknown>;
    const rgb = Array.isArray(attrs.rgb_color) && (attrs.rgb_color as number[]).length === 3
      ? attrs.rgb_color as number[] : [255, 214, 130];
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
    // Logic-light flash (batch DC-B): a matched rule flagged flash → pulse alpha.
    const flashMul = (attrs as Record<string, unknown>)._flash ? 0.4 + 0.6 * Math.abs(Math.sin(performance.now() / 260)) : 1;
    const a = 0.34 * Math.min(1, lightIntensity(l)) * flashMul;
    g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`);
    g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, 2 * Math.PI); ctx.fill();
  }
  const states = p.hass?.states;
  for (const m of f.motionSensors) {
    const st = m.entity_id && states ? states[m.entity_id] : null;
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

// Per-room temperature heat-map (derived visual layer, opt-in). Fills each
// sensor-bearing room's wall-loop polygon with a low-alpha warm/cool wash from
// heatmapColor(mean, comfortLo, comfortHi) and prints the aggregated temperature
// near the room centroid. Rooms with no temperature reading render NOTHING (no
// interpolation — honest). Reads Planner.roomHeatmap() (live states).
function drawHeatmap(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const rooms = p.roomHeatmap();
  if (!rooms.length) return;
  const dpr = window.devicePixelRatio || 1;
  const hm = p.store.heatmap ?? {};
  const lo = hm.comfortLo ?? HEATMAP_COMFORT_LO_DEFAULT;
  const hi = hm.comfortHi ?? HEATMAP_COMFORT_HI_DEFAULT;
  const imperial = p.store.imperial;
  for (const rt of rooms) {
    const { band, color } = heatmapColor(rt.tempC, lo, hi);
    // Comfort band reads as "fine" — keep its fill faint; extremes get a
    // stronger wash so out-of-band rooms stand out.
    const alpha = band === 'comfort' ? 0.10 : 0.22;
    ctx.save();
    ctx.beginPath();
    const p0 = mmToPx(view, rt.loop[0].x, rt.loop[0].y);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < rt.loop.length; i++) {
      const pi = mmToPx(view, rt.loop[i].x, rt.loop[i].y);
      ctx.lineTo(pi.x, pi.y);
    }
    ctx.closePath();
    ctx.fillStyle = hexToRgba(color, alpha);
    ctx.fill();
    ctx.restore();
    // Temperature label near the room centroid (slightly above the room label,
    // which centers there too — labels ride their own layer, so offset up).
    const disp = imperial ? rt.tempC * 9 / 5 + 32 : rt.tempC;
    const txt = `${Math.round(disp)}°${imperial ? 'F' : 'C'}`;
    const c = mmToPx(view, rt.cx, rt.cy);
    ctx.save();
    ctx.font = `bold ${12 * dpr}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(txt).width;
    ctx.fillStyle = 'rgba(10,14,20,0.55)';
    const padX = 5 * dpr, padY = 3 * dpr, yOff = -16 * dpr;
    ctx.fillRect(c.x - w / 2 - padX, c.y + yOff - 8 * dpr - padY, w + padX * 2, 16 * dpr + padY * 2);
    ctx.fillStyle = color;
    ctx.fillText(txt, c.x, c.y + yOff);
    ctx.restore();
  }
}

function drawMotionSensors(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
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
    // Label below (a pure NAME — hidden wholesale by `objectLabels`).
    if (names) {
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textBaseline = 'top';
      const txt = m.label || 'Motion';
      const tw = ctx.measureText(txt).width + 8 * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(c.x - tw / 2, c.y + 11 * dpr, tw, 13 * dpr);
      ctx.fillStyle = isOn ? lit : '#fff';
      ctx.fillText(txt, c.x, c.y + 13 * dpr);
    }
    drawBatteryBadge(ctx, p, m.entity_id, c.x + 8 * dpr, c.y - 8 * dpr);
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
  const names = objectLabelsOn(p);
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
    // Label below (pure NAME).
    if (names) {
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textBaseline = 'top';
      const txt = b.name || 'Proxy';
      const tw = ctx.measureText(txt).width + 8 * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(c.x - tw / 2, c.y + 11 * dpr, tw, 13 * dpr);
      ctx.fillStyle = '#fff';
      ctx.fillText(txt, c.x, c.y + 13 * dpr);
    }
    drawBatteryBadgeForDevice(ctx, p, b.haDeviceId, c.x + 8 * dpr, c.y - 8 * dpr);
  }
}

// Alarm keypads (Feature 3) render as a rounded plate with a state-colored
// screen band + a keypad dot grid. arming/pending pulse amber, triggered pulses
// hard red (RAF redraws each frame — a performance.now() pulse is the
// fireplace-flicker idiom's 2D cousin). Unbound-with-localState reads dimmed.
// Rides the sensors layer (gated by the caller).
function drawAlarmPanels(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const t = performance.now() / 1000;
  for (const a of f.alarmPanels ?? []) {
    const c = mmToPx(view, a.x, a.y);
    const st = p.effectiveState(a);
    const state = st?.state ?? null;
    const unbound = !a.entity_id;
    const selected = p.activeAlarmId === a.id;
    const col = alarmStateColor(state);
    const pulsing = state === 'arming' || state === 'pending' || state === 'triggered';
    let alpha = 1;
    if (pulsing) {
      const freq = state === 'triggered' ? 6 : 2.5;
      alpha = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * freq));
    }
    const rot = (a.rotation || 0) * Math.PI / 180;
    const hw = Math.max(8, ALARM_DEFAULTS.size * 0.36 * view.scale);
    const hh = Math.max(11, ALARM_DEFAULTS.size * 0.5 * view.scale);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(rot);
    // Plate
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, hw * 2, hh * 2, Math.min(hw, hh) * 0.28);
    ctx.fillStyle = 'rgba(18,22,28,0.92)';
    ctx.fill();
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.strokeStyle = selected ? '#fff' : hexToRgba(col, 0.9);
    if (state === 'triggered') { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 14 * alpha; ctx.stroke(); ctx.restore(); }
    else ctx.stroke();
    // Screen band (top)
    ctx.globalAlpha = unbound ? alpha * 0.55 : alpha;
    ctx.beginPath();
    ctx.roundRect(-hw * 0.74, -hh * 0.82, hw * 1.48, hh * 0.56, Math.min(hw, hh) * 0.14);
    ctx.fillStyle = state ? col : 'rgba(120,144,156,0.5)';
    ctx.fill();
    ctx.globalAlpha = 1;
    // Keypad dot grid (3 rows × 3 cols) below the screen.
    ctx.fillStyle = 'rgba(200,210,220,0.5)';
    const dotR = Math.max(1, hw * 0.13);
    for (let ry = 0; ry < 3; ry++) {
      for (let cxi = -1; cxi <= 1; cxi++) {
        ctx.beginPath();
        ctx.arc(cxi * hw * 0.5, hh * 0.02 + ry * hh * 0.33, dotR, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    ctx.restore();
    // Label below (screen space, unrotated).
    const label = a.label?.trim() || 'Alarm';
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const badge = state ? state.replace('armed_', '').replace('_', ' ') : (unbound ? 'unbound' : '—');
    const txt = fixtureCaption(names, label, badge);
    const tw = ctx.measureText(txt).width + 8 * dpr;
    const by = c.y + hh + 4 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(c.x - tw / 2, by, tw, 13 * dpr);
    ctx.fillStyle = state ? hexToRgba(col, 1) : '#cfd8dc';
    ctx.fillText(txt, c.x, by + 1 * dpr);
    drawBatteryBadge(ctx, p, a.entity_id, c.x + hw * 0.9, c.y - hh * 0.9);
  }
}

// Wall calendar plaque (Feature: calendar-on-wall). A compact wall-plate rect
// with a today-accent header (weekday + date) and the next 1–2 upcoming events
// (color dot + time + truncated title). Read-only; reads the polled event cache
// (Planner.calendarEvents), NOT entity state. Rides the sensors layer (gated by
// the caller).
function drawCalendarPanels(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const now = new Date();
  for (const cp of f.calendarPanels ?? []) {
    const c = mmToPx(view, cp.x, cp.y);
    const selected = p.activeCalendarId === cp.id;
    const events = p.calendarEvents[cp.id] ?? [];
    const model = calendarLines(events, now, { maxRows: 2 });
    const rot = (cp.rotation || 0) * Math.PI / 180;
    const hw = Math.max(10, CALENDAR_DEFAULTS.w * 0.5 * 0.5 * view.scale);
    const hh = Math.max(8, CALENDAR_DEFAULTS.h * 0.5 * 0.6 * view.scale);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(rot);
    // Plaque body.
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, hw * 2, hh * 2, Math.min(hw, hh) * 0.2);
    ctx.fillStyle = 'rgba(16,20,26,0.92)';
    ctx.fill();
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.strokeStyle = selected ? '#fff' : hexToRgba(CAL_HEADER_COLOR, 0.9);
    ctx.stroke();
    // Header band (today accent).
    ctx.beginPath();
    ctx.roundRect(-hw * 0.9, -hh * 0.86, hw * 1.8, hh * 0.62, Math.min(hw, hh) * 0.12);
    ctx.fillStyle = CAL_HEADER_COLOR;
    ctx.fill();
    ctx.restore();
    // Label + header text below (screen space, unrotated).
    ctx.font = `${9 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const label = cp.label?.trim() || 'Calendar';
    const line = model.empty ? fixtureCaption(names, label, 'no events')
      : `${model.header}${model.rows[0] ? ' · ' + model.rows[0].time + ' ' + model.rows[0].title.slice(0, 12) : ''}`;
    const txt = line.length > 40 ? line.slice(0, 39) + '…' : line;
    const tw = ctx.measureText(txt).width + 8 * dpr;
    const by = c.y + hh + 3 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(c.x - tw / 2, by, tw, 13 * dpr);
    ctx.fillStyle = model.rows[0]?.today ? '#ff8a80' : '#eceff1';
    ctx.fillText(txt, c.x, by + 1 * dpr);
  }
}

// HVAC thermostat wall control (Feature: climate). A rounded wall plate with a
// mode-colored "screen" band showing current→target temp; while the unit is
// actively heating/cooling/running the fan (hvac_action) the band pulses (RAF
// redraw — the fireplace-flicker idiom's 2D cousin) and a set of airflow arcs in
// the vent color animates below the plate. Unbound reads dimmed. Rides the
// sensors layer (gated by the caller).
function drawThermostats(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const imperial = p.store.imperial;
  const t = performance.now() / 1000;
  for (const th of f.thermostats ?? []) {
    const c = mmToPx(view, th.x, th.y);
    const st = p.effectiveState(th);
    const mode = st?.state ?? null;
    const action = (st?.attributes?.hvac_action as string | undefined) ?? null;
    const unbound = !th.entity_id;
    const selected = p.activeThermoId === th.id;
    const col = hvacModeColor(mode);
    const active = hvacActionActive(action);
    let alpha = 1;
    if (active) alpha = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(t * 3));
    const rot = (th.rotation || 0) * Math.PI / 180;
    const hw = Math.max(9, THERMO_DEFAULTS.size * 0.34 * view.scale);
    const hh = Math.max(11, THERMO_DEFAULTS.size * 0.42 * view.scale);

    // Airflow arcs BELOW the plate (screen space, drawn before the plate so the
    // plate paints over their origin). Direction: heat rises, cool sinks, fan flat.
    const air = hvacAirflow(mode, action);
    const airOn = !!air && (active || unbound);   // unbound demo: local mode drives it
    if (airOn && air) {
      const vcol = HVAC_VENT_COLORS[air];
      const dir = air === 'heat' ? -1 : 1;   // heat drifts UP on screen, cool/fan DOWN
      for (let k = 0; k < 3; k++) {
        const ph = (t * 0.9 + k * 0.34) % 1;
        const yy = c.y + hh + dir * (hh * 0.4 + ph * hh * 1.6) * (air === 'fan' ? 0.3 : 1) + (air === 'fan' ? 0 : 0);
        const xx = air === 'fan' ? c.x + hh + ph * hh * 2.4 : c.x;
        const aa = (1 - ph) * 0.75 * (active ? alpha : 0.6);
        ctx.strokeStyle = hexToRgba(vcol, aa);
        ctx.lineWidth = Math.max(1.2, hw * 0.14);
        ctx.beginPath();
        const r = hw * (0.35 + ph * 0.5);
        if (air === 'fan') ctx.arc(xx, c.y, r, -0.6, 0.6);
        else ctx.arc(xx, yy, r, dir < 0 ? Math.PI * 0.15 : Math.PI * 1.15, dir < 0 ? Math.PI * 0.85 : Math.PI * 1.85);
        ctx.stroke();
      }
    }

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(rot);
    // Plate
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, hw * 2, hh * 2, Math.min(hw, hh) * 0.32);
    ctx.fillStyle = 'rgba(20,24,30,0.92)';
    ctx.fill();
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.strokeStyle = selected ? '#fff' : hexToRgba(col, 0.9);
    if (active) { ctx.save(); ctx.shadowColor = hexToRgba(hvacActionColor(action), 1); ctx.shadowBlur = 12 * alpha; ctx.stroke(); ctx.restore(); }
    else ctx.stroke();
    // Screen band (top): mode color.
    ctx.globalAlpha = unbound ? alpha * 0.55 : alpha;
    ctx.beginPath();
    ctx.roundRect(-hw * 0.78, -hh * 0.82, hw * 1.56, hh * 0.9, Math.min(hw, hh) * 0.16);
    ctx.fillStyle = mode ? col : 'rgba(120,144,156,0.5)';
    ctx.fill();
    ctx.globalAlpha = 1;
    // Temperature readout on the screen (cur→target).
    const cur = fmtTempNum(st?.attributes?.current_temperature);
    let target = fmtTempNum(st?.attributes?.temperature);
    const low = fmtTempNum(st?.attributes?.target_temp_low);
    const high = fmtTempNum(st?.attributes?.target_temp_high);
    if (!target && low && high) target = `${low}–${high}`;
    if (!target && unbound && th.localTemp != null) {
      const d = imperial ? th.localTemp * 9 / 5 + 32 : th.localTemp;
      target = fmtTempNum(d);
    }
    if (hh > 14) {
      const readout = cur && target ? `${cur}→${target}` : (target || cur || (unbound ? 'demo' : '—'));
      ctx.fillStyle = '#0d1013';
      ctx.font = `600 ${Math.max(7, hh * 0.42)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(readout, 0, -hh * 0.37);
    }
    // Dial hint below the screen (cosmetic).
    ctx.fillStyle = 'rgba(200,210,220,0.4)';
    ctx.beginPath(); ctx.arc(0, hh * 0.42, Math.max(2, hw * 0.28), 0, 2 * Math.PI); ctx.stroke();
    ctx.restore();
    // Label below (screen space, unrotated).
    const label = th.label?.trim() || 'Thermostat';
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const unit = climateTempUnit(st, imperial);
    const badge = mode ? `${mode.replace('_', ' ')}${cur ? ` ${cur}${unit}` : ''}` : (unbound ? 'unbound' : '—');
    const txt = fixtureCaption(names, label, badge);
    const tw = ctx.measureText(txt).width + 8 * dpr;
    const by = c.y + hh + 4 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(c.x - tw / 2, by, tw, 13 * dpr);
    ctx.fillStyle = mode ? hexToRgba(col, 1) : '#cfd8dc';
    ctx.fillText(txt, c.x, by + 1 * dpr);
    drawBatteryBadge(ctx, p, th.entity_id, c.x + hw * 0.9, c.y - hh * 0.9);
  }
}

// Action buttons (batch DC-B): a rounded plate with a raised circular "cap" in
// the accent color + the action glyph, plus a label below. On press (a recent
// Planner.actionPressFx entry within ~800 ms) the cap shrinks + brightens for
// ~300 ms, then an expanding ring pulse fades out — the physical depress read.
// A running-glow (bound script state 'on') haloes the plate. Rides the switches
// layer (gated by the caller).
export const actionButtonHalfPx = new Map<string, number>();
function drawActionButtons(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const nowMs = performance.now();
  actionButtonHalfPx.clear();
  for (const b of f.actionButtons ?? []) {
    if (b.hidden) continue;
    const c = mmToPx(view, b.x, b.y);
    const col = actionButtonColor(b);
    const selected = p.activeActionId === b.id;
    const half = Math.max(9, actionButtonSize(b) * 0.5 * view.scale);
    actionButtonHalfPx.set(b.id, half);
    // Press animation phase from the most recent press for this button.
    const press = (p.actionPressFx ?? []).filter(r => r.id === b.id).reduce((a, r) => Math.max(a, r.at), 0);
    const age = press ? nowMs - press : Infinity;
    const depress = age < 300 ? (1 - 0.15 * (1 - age / 300)) : 1;   // cap shrinks 15% then eases back
    // Running glow: a bound script that's currently on.
    const running = actionButtonIsRunning(p, b);
    if (running || age < 800) {
      const glowR = half * (age < 800 ? 1.4 + 1.2 * Math.min(1, age / 800) : 1.6);
      const gAlpha = age < 800 ? 0.4 * (1 - age / 800) : 0.18;
      const g = ctx.createRadialGradient(c.x, c.y, half * 0.6, c.x, c.y, glowR);
      g.addColorStop(0, hexToRgba(col, gAlpha));
      g.addColorStop(1, hexToRgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(c.x, c.y, glowR, 0, 2 * Math.PI); ctx.fill();
    }
    // Plate
    ctx.beginPath();
    ctx.roundRect(c.x - half, c.y - half, half * 2, half * 2, half * 0.32);
    ctx.fillStyle = 'rgba(22,26,32,0.92)';
    ctx.fill();
    ctx.lineWidth = selected ? 2.5 : 1.4;
    ctx.strokeStyle = selected ? '#fff' : hexToRgba(col, 0.9);
    ctx.stroke();
    // Button cap (circle in the accent color, shrinks on press)
    const capR = half * 0.62 * depress;
    ctx.beginPath(); ctx.arc(c.x, c.y, capR, 0, 2 * Math.PI);
    ctx.fillStyle = age < 300 ? lighten(col, 0.35) : col;
    ctx.fill();
    // Glyph on the cap
    ctx.font = `${Math.max(9, half * 0.95)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(actionButtonIcon(b), c.x, c.y + 1 * dpr);
    // Label below
    const label = names ? b.label?.trim() : '';
    if (label) {
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textBaseline = 'top';
      const tw = ctx.measureText(label).width + 8 * dpr;
      const by = c.y + half + 4 * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(c.x - tw / 2, by, tw, 13 * dpr);
      ctx.fillStyle = hexToRgba(col, 1);
      ctx.fillText(label, c.x, by + 1 * dpr);
    }
    drawBatteryBadge(ctx, p, b.entity_id, c.x + half * 0.9, c.y - half * 0.9);
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
}

// Bound script that's currently running → steady plate glow.
function actionButtonIsRunning(p: Planner, b: { entity_id?: string | null }): boolean {
  return !!b.entity_id && b.entity_id.startsWith('script.') && p.effectiveState(b)?.state === 'on';
}

// 2D detector disc radius (mm world). Small — these are ceiling pucks.
const SAFETY_DISC_R_MM = 140;

// Smoke / CO detectors render as a small ceiling-detector disc (white ring +
// center dot; CO gets a "CO" label). When ALARMING (effective state on) they
// erupt into unmissable expanding pulse rings + a strong colored halo (red for
// smoke, amber for CO), time-based via performance.now() so the RAF redraw
// animates it (the alarm keypad's triggered-pulse idiom). Rides the sensors
// layer (gated by the caller).
// Per-leak-detector alarm-onset timestamps (s), so the 2D puddle grows over
// SAFETY_DEFAULTS.leakGrowSec from the moment the leak starts. Cleared when the
// detector stops alarming. Keyed by fixture id.
const _leakAlarmStart = new Map<string, number>();

function drawSafetySensors(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const t = performance.now() / 1000;
  for (const s of f.safetySensors ?? []) {
    const c = mmToPx(view, s.x, s.y);
    const kind: import('./types.js').SafetyKind =
      s.kind === 'co' ? 'co' : s.kind === 'gas' ? 'gas' : s.kind === 'leak' ? 'leak'
      : s.kind === 'siren' ? 'siren' : 'smoke';
    const col = safetyColor(kind);
    const st = p.effectiveState(s);
    const alarming = st?.state === 'on';
    const selected = p.activeSafetyId === s.id;
    const rPx = Math.max(9, SAFETY_DISC_R_MM * view.scale);

    // ── Leak detector: floor puck + spreading blue puddle (no beacon rings) ──
    if (kind === 'leak') {
      if (alarming) {
        if (!_leakAlarmStart.has(s.id)) _leakAlarmStart.set(s.id, t);
        const started = _leakAlarmStart.get(s.id)!;
        const pulse = 0.5 + 0.5 * Math.sin(t * 2.5);
        // Shared ease-out curve with the 3D decal (geometry.leakPuddleRadiusMm)
        // so the two views can never spread at different rates.
        const puddleMm = leakPuddleRadiusMm(t - started);
        const prx = Math.max(rPx * 1.2, puddleMm * view.scale);
        ctx.save();
        // Spreading water ellipse (alpha pulses gently — W3 puddle idiom).
        const grad = ctx.createRadialGradient(c.x, c.y, prx * 0.15, c.x, c.y, prx);
        grad.addColorStop(0, hexToRgba(col, 0.35 + 0.12 * pulse));
        grad.addColorStop(0.7, hexToRgba(col, 0.22 + 0.08 * pulse));
        grad.addColorStop(1, hexToRgba(col, 0));
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, prx, prx * 0.7, 0, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      } else {
        _leakAlarmStart.delete(s.id);
      }
      // Detector puck: small disc, droplet glyph.
      ctx.save();
      ctx.beginPath();
      ctx.arc(c.x, c.y, rPx, 0, 2 * Math.PI);
      ctx.fillStyle = alarming ? hexToRgba(col, 0.9) : 'rgba(236,239,241,0.95)';
      ctx.fill();
      ctx.lineWidth = selected ? 2.5 : 1.5;
      ctx.strokeStyle = selected ? '#fff' : hexToRgba(col, 0.9);
      ctx.stroke();
      ctx.fillStyle = alarming ? '#fff' : hexToRgba(col, 1);
      ctx.font = `${Math.max(8, rPx * 1.1)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('💧', c.x, c.y + 0.5);
      ctx.restore();
      const label = s.label?.trim() || 'Leak';
      const badge = alarming ? 'LEAK' : (st ? 'dry' : (s.entity_id ? '—' : 'unbound'));
      const txt = fixtureCaption(names, label, badge);
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const tw = ctx.measureText(txt).width + 8 * dpr;
      const by = c.y + rPx + 4 * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(c.x - tw / 2, by, tw, 13 * dpr);
      ctx.fillStyle = alarming ? hexToRgba(col, 1) : '#cfd8dc';
      ctx.fillText(txt, c.x, by + 1 * dpr);
      drawBatteryBadge(ctx, p, s.entity_id, c.x + rPx * 0.8, c.y - rPx * 0.8);
      continue;
    }

    // ── Siren: ceiling alert beacon with a spinning police-style light-bar ──
    // sweep + expanding rings + a hard on/off strobe on the lens while sounding.
    if (kind === 'siren') {
      if (alarming) {
        // Two opposite rotating beams (light-bar sweep). Each is a thin wedge
        // fading out radially; angle advances at sirenSweepRevPerS.
        const ang = t * SAFETY_DEFAULTS.sirenSweepRevPerS * Math.PI * 2;
        const reach = rPx * 4.2;
        const half = 0.22;   // half-angle of each beam wedge (rad)
        ctx.save();
        for (const base of [ang, ang + Math.PI]) {
          const grad = ctx.createRadialGradient(c.x, c.y, rPx * 0.5, c.x, c.y, reach);
          grad.addColorStop(0, hexToRgba(col, 0.55));
          grad.addColorStop(1, hexToRgba(col, 0));
          ctx.beginPath();
          ctx.moveTo(c.x, c.y);
          ctx.arc(c.x, c.y, reach, base - half, base + half);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.fill();
        }
        // Expanding rings (reuse the beacon idiom).
        for (let k = 0; k < 3; k++) {
          const ph = (t * 1.4 + k / 3) % 1;
          const rr = rPx * (1 + ph * 3.2);
          ctx.beginPath();
          ctx.arc(c.x, c.y, rr, 0, 2 * Math.PI);
          ctx.lineWidth = Math.max(1.5, 2.5 * dpr) * (1 - ph);
          ctx.strokeStyle = hexToRgba(col, 0.7 * (1 - ph));
          ctx.stroke();
        }
        ctx.restore();
      }
      // Body: white plate, colored ring; lens strobes hard on/off while sounding.
      const strobeOn = alarming && Math.sin(t * SAFETY_DEFAULTS.sirenStrobeHz * 2 * Math.PI) > 0;
      ctx.save();
      ctx.beginPath();
      ctx.arc(c.x, c.y, rPx, 0, 2 * Math.PI);
      ctx.fillStyle = alarming ? hexToRgba(col, 0.9) : 'rgba(236,239,241,0.95)';
      ctx.fill();
      ctx.lineWidth = selected ? 2.5 : 1.5;
      ctx.strokeStyle = selected ? '#fff' : hexToRgba(col, 0.9);
      ctx.stroke();
      // Lens dot: bright white on the strobe peak, dim red-ish otherwise.
      ctx.beginPath();
      ctx.arc(c.x, c.y, Math.max(1.5, rPx * 0.42), 0, 2 * Math.PI);
      ctx.fillStyle = strobeOn ? '#ffffff' : (alarming ? hexToRgba(col, 1) : hexToRgba(col, 0.85));
      ctx.fill();
      ctx.restore();
      const label = s.label?.trim() || 'Siren';
      const badge = alarming ? 'SOUNDING' : (st ? 'idle' : (s.entity_id ? '—' : 'unbound'));
      const txt = fixtureCaption(names, label, badge);
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const tw = ctx.measureText(txt).width + 8 * dpr;
      const by = c.y + rPx + 4 * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(c.x - tw / 2, by, tw, 13 * dpr);
      ctx.fillStyle = alarming ? hexToRgba(col, 1) : '#cfd8dc';
      ctx.fillText(txt, c.x, by + 1 * dpr);
      drawBatteryBadge(ctx, p, s.entity_id, c.x + rPx * 0.8, c.y - rPx * 0.8);
      continue;
    }

    // ── Glass-break detector: SQUARE acoustic mic plate ──
    // Rounded square + grille slots + corner LED (blue-violet), so it never
    // reads as one of the round smoke/CO/gas pucks. Alarming adds the shared
    // rings PLUS a spiky shatter star (the 2D twin of the 3D shard burst).
    if (safetyIsPlate(kind)) {
      const half = rPx * 1.05;
      if (alarming) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 6);
        ctx.save();
        ctx.beginPath();
        ctx.arc(c.x, c.y, rPx * 2.4, 0, 2 * Math.PI);
        ctx.fillStyle = hexToRgba(col, 0.16 + 0.2 * pulse);
        ctx.fill();
        // Shatter star: an 8-point spiky outline snapping outward.
        for (let k = 0; k < 2; k++) {
          const ph = (t * 2.6 + k / 2) % 1;
          const rr = rPx * (0.9 + ph * 3.4);
          ctx.beginPath();
          for (let v = 0; v < 16; v++) {
            const ang = (v / 16) * 2 * Math.PI + ph * 0.9;
            const rad = rr * (v % 2 === 0 ? 1 : 0.42);
            const px = c.x + Math.cos(ang) * rad, py = c.y + Math.sin(ang) * rad;
            if (v === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.lineWidth = Math.max(1.2, 2 * dpr) * (1 - ph);
          ctx.strokeStyle = hexToRgba(col, 0.8 * (1 - ph));
          ctx.stroke();
        }
        // Shared expanding rings.
        for (let k = 0; k < 3; k++) {
          const ph = (t * 1.4 + k / 3) % 1;
          const rr = rPx * (1 + ph * 3.2);
          ctx.beginPath();
          ctx.arc(c.x, c.y, rr, 0, 2 * Math.PI);
          ctx.lineWidth = Math.max(1.2, 2 * dpr) * (1 - ph);
          ctx.strokeStyle = hexToRgba(col, 0.55 * (1 - ph));
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.save();
      // Plate body (square with softened corners).
      const rad = Math.max(2, half * 0.22);
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(c.x - half, c.y - half, half * 2, half * 2, rad);
      else ctx.rect(c.x - half, c.y - half, half * 2, half * 2);
      ctx.fillStyle = alarming ? hexToRgba(col, 0.9) : 'rgba(236,239,241,0.95)';
      ctx.fill();
      ctx.lineWidth = selected ? 2.5 : 1.5;
      ctx.strokeStyle = selected ? '#fff' : hexToRgba(col, 0.9);
      ctx.stroke();
      // Mic grille: 3 slot bars across the plate.
      ctx.strokeStyle = alarming ? 'rgba(255,255,255,0.9)' : hexToRgba(col, 0.75);
      ctx.lineWidth = Math.max(1, half * 0.16);
      for (let k = -1; k <= 1; k++) {
        const gy = c.y + k * half * 0.45;
        ctx.beginPath();
        ctx.moveTo(c.x - half * 0.55, gy); ctx.lineTo(c.x + half * 0.55, gy);
        ctx.stroke();
      }
      ctx.restore();
      const label = s.label?.trim() || 'Glass break';
      const badge = alarming ? 'BREAK' : (st ? 'ok' : (s.entity_id ? '—' : 'unbound'));
      const txt = fixtureCaption(names, label, badge);
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const tw = ctx.measureText(txt).width + 8 * dpr;
      const by = c.y + half + 4 * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(c.x - tw / 2, by, tw, 13 * dpr);
      ctx.fillStyle = alarming ? hexToRgba(col, 1) : '#cfd8dc';
      ctx.fillText(txt, c.x, by + 1 * dpr);
      drawBatteryBadge(ctx, p, s.entity_id, c.x + half * 0.8, c.y - half * 0.8);
      continue;
    }

    // ── Ceiling beacons (smoke / co / gas) ──
    // Alarming: pulsing halo + up to 3 expanding rings dropping outward.
    if (alarming) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 6);
      ctx.save();
      ctx.beginPath();
      ctx.arc(c.x, c.y, rPx * 2.6, 0, 2 * Math.PI);
      ctx.fillStyle = hexToRgba(col, 0.18 + 0.22 * pulse);
      ctx.fill();
      for (let k = 0; k < 3; k++) {
        const ph = (t * 1.4 + k / 3) % 1;               // 0..1 expansion phase
        const rr = rPx * (1 + ph * 3.2);
        ctx.beginPath();
        ctx.arc(c.x, c.y, rr, 0, 2 * Math.PI);
        ctx.lineWidth = Math.max(1.5, 2.5 * dpr) * (1 - ph);
        ctx.strokeStyle = hexToRgba(col, 0.7 * (1 - ph));
        ctx.stroke();
      }
      ctx.restore();
    }
    // Detector body: white disc, colored ring, center dot.
    ctx.save();
    ctx.beginPath();
    ctx.arc(c.x, c.y, rPx, 0, 2 * Math.PI);
    ctx.fillStyle = alarming ? hexToRgba(col, 0.9) : 'rgba(236,239,241,0.95)';
    ctx.fill();
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.strokeStyle = selected ? '#fff' : (alarming ? '#fff' : hexToRgba(col, 0.9));
    ctx.stroke();
    // Center status dot / glyph.
    const bodyGlyph = safetyGlyph(kind);   // '' for smoke, 'CO'/'GAS' otherwise
    if (bodyGlyph) {
      ctx.fillStyle = alarming ? '#fff' : hexToRgba(col, 1);
      ctx.font = `bold ${Math.max(6, rPx * (bodyGlyph.length > 2 ? 0.66 : 0.9))}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(bodyGlyph, c.x, c.y + 0.5);
    } else {
      ctx.beginPath();
      ctx.arc(c.x, c.y, Math.max(1.5, rPx * 0.3), 0, 2 * Math.PI);
      ctx.fillStyle = alarming ? '#fff' : hexToRgba(col, 1);
      ctx.fill();
    }
    ctx.restore();
    // Label below (screen space).
    const label = s.label?.trim() ||
      (kind === 'co' ? 'CO' : kind === 'gas' ? 'Gas' : 'Smoke');
    const badge = alarming ? 'ALARM' : (st ? 'ok' : (s.entity_id ? '—' : 'unbound'));
    const txt = fixtureCaption(names, label, badge);
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const tw = ctx.measureText(txt).width + 8 * dpr;
    const by = c.y + rPx + 4 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(c.x - tw / 2, by, tw, 13 * dpr);
    ctx.fillStyle = alarming ? hexToRgba(col, 1) : '#cfd8dc';
    ctx.fillText(txt, c.x, by + 1 * dpr);
    drawBatteryBadge(ctx, p, s.entity_id, c.x + rPx * 0.8, c.y - rPx * 0.8);
  }
}

// Alert Beacon fixtures (Alert Center, Track B): ceiling puck that pulses red +
// erupts into expanding rings while ACTIVE (unacknowledged), steady amber when
// ACKNOWLEDGED (alert.* 'off'), dim gray when idle. Same performance.now()-based
// animation as drawSafetySensors. Rides the sensors layer (gated at the call
// site). State resolves via effectiveState → alertBeaconState (alert.* domain
// gets the three-state acknowledge semantics; binary_sensor only on/off).
function drawAlertBeacons(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const t = performance.now() / 1000;
  for (const b of f.alertBeacons ?? []) {
    if (b.hidden) continue;
    const c = mmToPx(view, b.x, b.y);
    const st = p.effectiveState(b);
    const bs = alertBeaconState(st?.state, isAlertDomain(b.entity_id));
    const alarming = alertBeaconAlarming(bs);
    const col = alertBeaconColor(bs);
    const selected = p.activeAlertBeaconId === b.id;
    const rPx = Math.max(9, ALERT_BEACON_DEFAULTS.discRadiusMm * view.scale);

    if (alarming) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 6);
      ctx.save();
      ctx.beginPath();
      ctx.arc(c.x, c.y, rPx * 2.6, 0, 2 * Math.PI);
      ctx.fillStyle = hexToRgba(col, 0.18 + 0.22 * pulse);
      ctx.fill();
      for (let k = 0; k < 3; k++) {
        const ph = (t * 1.4 + k / 3) % 1;
        const rr = rPx * (1 + ph * 3.2);
        ctx.beginPath();
        ctx.arc(c.x, c.y, rr, 0, 2 * Math.PI);
        ctx.lineWidth = Math.max(1.5, 2.5 * dpr) * (1 - ph);
        ctx.strokeStyle = hexToRgba(col, 0.7 * (1 - ph));
        ctx.stroke();
      }
      ctx.restore();
    }
    // Beacon body: white disc, colored ring, bell glyph.
    ctx.save();
    ctx.beginPath();
    ctx.arc(c.x, c.y, rPx, 0, 2 * Math.PI);
    ctx.fillStyle = alarming ? hexToRgba(col, 0.9) : (bs === 'ack' ? hexToRgba(col, 0.75) : 'rgba(236,239,241,0.95)');
    ctx.fill();
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.strokeStyle = selected ? '#fff' : hexToRgba(col, 0.9);
    ctx.stroke();
    ctx.fillStyle = (alarming || bs === 'ack') ? '#fff' : hexToRgba(col, 1);
    ctx.font = `${Math.max(8, rPx * 1.05)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🔔', c.x, c.y + 0.5);
    ctx.restore();
    // Label below.
    const label = b.label?.trim() || 'Alert';
    const badge = bs === 'active' ? 'ALERT' : bs === 'ack' ? 'ack'
                : (st ? 'idle' : (b.entity_id ? '—' : 'unbound'));
    const txt = fixtureCaption(names, label, badge);
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const tw = ctx.measureText(txt).width + 8 * dpr;
    const by = c.y + rPx + 4 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(c.x - tw / 2, by, tw, 13 * dpr);
    ctx.fillStyle = alarming ? hexToRgba(col, 1) : '#cfd8dc';
    ctx.fillText(txt, c.x, by + 1 * dpr);
    drawBatteryBadge(ctx, p, b.entity_id, c.x + rPx * 0.8, c.y - rPx * 0.8);
  }
}

// Robot fixtures: a small dock icon at the base (x,y) plus a moving robot dot at
// the live Planner.robotStates position, colored by resolved activity + a heading
// tick. Rides the sensors layer (gated at the call site). Reads robotStates (set
// by Planner.stepRobots from the 2D RAF) — the single source of truth for both
// 2D and 3D so the robot moves even when the 3D view was never opened.
function drawRobots(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  for (const r of f.robots ?? []) {
    const kind = r.kind === 'mower' ? 'mower' : 'vacuum';
    const baseCol = robotColor(kind);
    const rs = p.robotStates[r.id];
    const act = rs?.activity ?? p.robotActivity(r);
    const led = rs?.led ?? '#78909c';
    const phase = rs?.phase ?? 0;
    const selected = p.activeRobotId === r.id;

    // ── Dock / charging base ──
    const dc = mmToPx(view, r.x, r.y);
    const mv = ROBOT_DEFAULTS.mower, vac = ROBOT_DEFAULTS.vacuum;
    const dockW = kind === 'mower' ? mv.dockW : vac.dockW;
    const dockD = kind === 'mower' ? mv.dockD : vac.dockD;
    const dw = Math.max(14, dockW * view.scale);
    const dd = Math.max(10, dockD * view.scale);
    // Dock orientation: `rotation` is screen-CW degrees (0 = local +Y along
    // world +Y), so ctx.rotate takes it verbatim — the furniture idiom. The
    // dock FRONT (the opening) is local −Y = canvas +y after the rotate.
    const dockRot = (r.rotation || 0) * Math.PI / 180;
    ctx.save();
    ctx.translate(dc.x, dc.y);
    if (dockRot) ctx.rotate(dockRot);
    ctx.beginPath();
    ctx.rect(-dw / 2, -dd / 2, dw, dd);
    ctx.fillStyle = hexToRgba(baseCol, 0.25);
    ctx.fill();
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.strokeStyle = selected ? '#fff' : hexToRgba(baseCol, 0.85);
    ctx.setLineDash([3 * dpr, 2 * dpr]);
    ctx.stroke();
    ctx.setLineDash([]);
    // Front indicator: a thin chevron just outside the opening edge, pointing
    // OUT (the direction the robot drives away). Always drawn — the dock is
    // directional and the user needs to see which way it faces.
    const cvW = Math.max(4, Math.min(dw * 0.28, 9 * dpr));
    const cvH = Math.max(3, Math.min(dd * 0.30, 7 * dpr));
    const cvY = dd / 2 + Math.max(2, 2.5 * dpr);
    ctx.beginPath();
    ctx.moveTo(-cvW, cvY);
    ctx.lineTo(0, cvY + cvH);
    ctx.lineTo(cvW, cvY);
    ctx.lineWidth = Math.max(1.2, 1.8 * dpr);
    ctx.strokeStyle = hexToRgba(baseCol, 0.95);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    // ── Moving robot body ──
    // No controller state yet → draw the robot parked in its dock, nose toward
    // the back wall (the same pose _spawnRobot seeds for a mower).
    const bx = rs ? rs.x : r.x, by = rs ? rs.y : r.y;
    const bHead = rs ? rs.heading : dockParkedHeading(r.rotation);
    const bc = mmToPx(view, bx, by);
    // `bodyR` stays the layout radius everything else anchors off (LED dot,
    // progress arc, label, battery badge): the puck radius for a vacuum, half
    // the body diagonal for the mower's rectangle so nothing overlaps the box
    // at any heading.
    const mowRectL = Math.max(9, mv.bodyD * view.scale);   // along travel
    const mowRectW = Math.max(7, mv.bodyW * view.scale);   // across
    const bodyR = kind === 'mower'
      ? Math.hypot(mowRectL, mowRectW) / 2
      : Math.max(7, vac.bodyR * view.scale);
    ctx.save();
    if (kind === 'mower') {
      // Rotated rectangle matching the 3D box rig: bodyW across, bodyD along
      // travel, body-forward = the live plan heading. ctx.rotate is screen-CW
      // and the canvas Y axis is flipped, so rotating by −heading sends local
      // +x onto the heading direction (cos h, −sin h) in screen space.
      ctx.save();
      ctx.translate(bc.x, bc.y);
      ctx.rotate(-bHead);
      const hl = mowRectL / 2, hw = mowRectW / 2;
      const rr = Math.min(hl, hw) * 0.35;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(-hl, -hw, mowRectL, mowRectW, rr);
      else ctx.rect(-hl, -hw, mowRectL, mowRectW);
      ctx.fillStyle = hexToRgba(baseCol, 0.95);
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, 2.5 * dpr);
      ctx.strokeStyle = led;
      ctx.stroke();
      // Brighter nose bar on the leading edge (replaces the puck's centre tick —
      // on a rectangle an edge reads the facing far better than a spoke).
      ctx.beginPath();
      ctx.moveTo(hl, -hw * 0.72);
      ctx.lineTo(hl, hw * 0.72);
      ctx.lineWidth = Math.max(1.5, 2.2 * dpr);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(bc.x, bc.y, bodyR, 0, 2 * Math.PI);
      ctx.fillStyle = hexToRgba(baseCol, 0.95);
      ctx.fill();
      // State ring.
      ctx.lineWidth = Math.max(1.5, 2.5 * dpr);
      ctx.strokeStyle = led;
      ctx.stroke();
      // Heading tick (body-forward = plan heading; canvas Y flips).
      if (rs) {
        const hx = Math.cos(bHead), hy = -Math.sin(bHead);
        ctx.beginPath();
        ctx.moveTo(bc.x, bc.y);
        ctx.lineTo(bc.x + hx * bodyR, bc.y + hy * bodyR);
        ctx.lineWidth = Math.max(1, 1.5 * dpr);
        ctx.strokeStyle = '#fff';
        ctx.stroke();
      }
    }
    // Status LED dot: docked breathes, error blinks, else steady.
    let ledA = 1;
    if (act === 'docked') ledA = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(phase * 2));
    else if (act === 'error') ledA = Math.sin(phase * 8) > 0 ? 1 : 0.1;
    ctx.beginPath();
    ctx.arc(bc.x, bc.y - bodyR - 3 * dpr, Math.max(2, 2.5 * dpr), 0, 2 * Math.PI);
    ctx.fillStyle = hexToRgba(led, ledA);
    ctx.fill();
    // Task-progress arc around the body when a source is known (both kinds): a
    // dim track + a bright green sweep filling clockwise from the top.
    const prog = robotProgress(r, id => p.hass?.states?.[id] ?? null);
    if (prog != null) {
      const pr = bodyR + Math.max(2.5, 3 * dpr);
      const start = -Math.PI / 2;
      ctx.lineWidth = Math.max(2, 3 * dpr);
      ctx.beginPath();
      ctx.arc(bc.x, bc.y, pr, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(bc.x, bc.y, pr, start, start + 2 * Math.PI * (Math.max(0, Math.min(100, prog)) / 100));
      ctx.strokeStyle = '#43a047';
      ctx.stroke();
    }
    ctx.restore();

    // Label: glyph + activity.
    const rName = r.label?.trim() || (kind === 'mower' ? 'Mower' : 'Vacuum');
    const txt = `${robotGlyph(kind)} ${fixtureCaption(names, rName, act)}`;
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const tw = ctx.measureText(txt).width + 8 * dpr;
    const ty = bc.y + bodyR + 4 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(bc.x - tw / 2, ty, tw, 13 * dpr);
    ctx.fillStyle = '#cfd8dc';
    ctx.fillText(txt, bc.x, ty + 1 * dpr);
    // Calibration diagnostic (opt-in per robot) — zero cost when off.
    if (r.showPosInfo) drawRobotPosInfo(ctx, p, view, r, baseCol, bc, bx, by, ty + 14 * dpr, dpr);
    // Battery badge at the dock (the fixture's fixed marker).
    drawBatteryBadge(ctx, p, r.entity_id, dc.x + dw / 2, dc.y - dd / 2);
  }
}

// Below this the reported point and the drawn body count as "the same place" —
// no Δ readout, no connector (the eased body is always a few mm behind a live
// fix and a permanent hairline would be noise).
const ROBOT_POS_DELTA_MM = 50;

// Robot calibration overlay (RobotFixture.showPosInfo, 2D-only): a crosshair at
// the REPORTED position (live map fix / GPS fix / simulated pose — the point the
// alignment offsets move) plus a small monospace readout of raw → projected plan
// mm, and a dashed connector to the drawn body when the two disagree. This is
// the visual the user aligns against while nudging "Align position".
function drawRobotPosInfo(
  ctx: CanvasRenderingContext2D, p: Planner, view: View, r: RobotFixture,
  baseCol: string, bc: Vec2, bodyXmm: number, bodyYmm: number, topY: number, dpr: number,
): void {
  const info = p.robotPosInfo(r);
  if (!info || !isFinite(info.worldX) || !isFinite(info.worldY)) return;
  const tp = mmToPx(view, info.worldX, info.worldY);
  const deltaMm = Math.hypot(info.worldX - bodyXmm, info.worldY - bodyYmm);
  const far = deltaMm > ROBOT_POS_DELTA_MM;

  ctx.save();
  ctx.strokeStyle = hexToRgba(baseCol, 0.95);
  ctx.lineWidth = Math.max(1, 1.4 * dpr);
  // Connector: drawn body → reported point (the offset the nudges close).
  if (far) {
    ctx.save();
    ctx.setLineDash([4 * dpr, 3 * dpr]);
    ctx.lineWidth = Math.max(1, 1 * dpr);
    ctx.strokeStyle = hexToRgba(baseCol, 0.6);
    ctx.beginPath();
    ctx.moveTo(bc.x, bc.y);
    ctx.lineTo(tp.x, tp.y);
    ctx.stroke();
    ctx.restore();
  }
  // Crosshair ⌖: four gapped arms + a small ring on the reported point.
  const cr = Math.max(6, 8 * dpr);
  ctx.beginPath();
  ctx.moveTo(tp.x - cr, tp.y);        ctx.lineTo(tp.x - cr * 0.35, tp.y);
  ctx.moveTo(tp.x + cr * 0.35, tp.y); ctx.lineTo(tp.x + cr, tp.y);
  ctx.moveTo(tp.x, tp.y - cr);        ctx.lineTo(tp.x, tp.y - cr * 0.35);
  ctx.moveTo(tp.x, tp.y + cr * 0.35); ctx.lineTo(tp.x, tp.y + cr);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(tp.x, tp.y, cr * 0.42, 0, 2 * Math.PI);
  ctx.stroke();

  // Readout plate under the robot's own label.
  const lines = [
    `raw: ${info.rawText}`,
    `→ ${Math.round(info.worldX)}, ${Math.round(info.worldY)} mm`,
    `${info.mode}${far ? ` · Δ ${Math.round(deltaMm)} mm` : ''}`,
  ];
  ctx.font = `${9 * dpr}px ui-monospace, Menlo, Consolas, monospace`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  let wMax = 0;
  for (const ln of lines) wMax = Math.max(wMax, ctx.measureText(ln).width);
  const padX = 4 * dpr, lh = 11 * dpr;
  const boxW = wMax + padX * 2, boxH = lines.length * lh + 3 * dpr;
  const boxX = bc.x - boxW / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(boxX, topY, boxW, boxH);
  ctx.strokeStyle = hexToRgba(baseCol, 0.5);
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX + 0.5, topY + 0.5, boxW - 1, boxH - 1);
  ctx.fillStyle = '#b0bec5';
  for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], boxX + padX, topY + 2 * dpr + i * lh);
  ctx.restore();
}

// Camera-snapshot image cache for alert cards (mirrors canvas-2d's _ensureBg
// idiom). Keyed by the full cache-busted URL — a new 3 s refresh bucket mints a
// new key, triggering a fresh load; old entries are pruned. Returns the image
// only once it has finished loading (else null → the card shows the ALERT
// fallback until the first frame is ready).
const _camSnapCache = new Map<string, HTMLImageElement>();
function camSnapshot(url: string): HTMLImageElement | null {
  const hit = _camSnapCache.get(url);
  if (hit) return hit.complete && hit.naturalWidth > 0 ? hit : null;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  _camSnapCache.set(url, img);
  if (_camSnapCache.size > 16) {
    const oldest = _camSnapCache.keys().next().value;
    if (oldest !== undefined) _camSnapCache.delete(oldest);
  }
  return null;
}

// Camera fixtures (roadmap #10): a small camera glyph + a translucent FOV wedge
// (fov / range / rotation — the mmWave coverage-wedge idiom). The wedge tint
// shifts red when the camera entity state is 'recording'. Rides the sensors
// layer (gated at the call site). Rotation convention: 0 = +Y world.
function drawCameras(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const states = p.hass?.states;
  for (const cam of f.cameras ?? []) {
    if (cam.hidden) continue;
    const c = mmToPx(view, cam.x, cam.y);
    const st = cam.entity_id && states ? states[cam.entity_id] : null;
    const recording = st?.state === 'recording';
    const col = cameraStateColor(st?.state);
    const r = cameraRange(cam) * view.scale;
    const base = -Math.PI / 2 + ((cam.rotation || 0) * Math.PI / 180);
    const half = (cameraFov(cam) * Math.PI / 180) / 2;
    const selected = p.activeCameraId === cam.id;
    // Alert: pulse the FOV wedge (alpha oscillation) + snapshot card below.
    const alerting = p.cameraAlerting(cam);
    const now = performance.now() / 1000;
    const pulse = alerting ? 0.5 + 0.5 * Math.sin(now * 5) : 0;
    const wedgeCol = alerting ? '#ef5350' : col;
    // FOV wedge.
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.arc(c.x, c.y, r, base - half, base + half);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(wedgeCol, alerting ? 0.10 + 0.22 * pulse : (recording ? 0.16 : 0.10));
    ctx.strokeStyle = hexToRgba(wedgeCol, alerting ? 0.5 + 0.5 * pulse : 0.55);
    ctx.lineWidth = alerting ? 2 : 1;
    ctx.fill();
    if (!recording && !alerting) ctx.setLineDash([4, 4]);
    ctx.stroke(); ctx.setLineDash([]);
    if (alerting) drawCameraAlertCard(ctx, p, cam, c, st, dpr);
    // Body dot.
    ctx.fillStyle = (recording || alerting) ? '#ef5350' : selected ? lighten(col, 0.2) : col;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(c.x, c.y, 7 * dpr, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `${9 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('📷', c.x, c.y);
    // Label below (pure NAME).
    if (names) {
      const txt = cam.label?.trim() || 'Camera';
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textBaseline = 'top';
      const tw = ctx.measureText(txt).width + 8 * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(c.x - tw / 2, c.y + 11 * dpr, tw, 13 * dpr);
      ctx.fillStyle = recording ? '#ef5350' : '#fff';
      ctx.fillText(txt, c.x, c.y + 13 * dpr);
    }
    drawBatteryBadge(ctx, p, cam.entity_id, c.x + 8 * dpr, c.y - 8 * dpr);
    // Rotate handle when active + unlocked.
    if (selected && !cam.locked) {
      const rhx = c.x + Math.cos(base) * 28 * dpr;
      const rhy = c.y + Math.sin(base) * 28 * dpr;
      ctx.fillStyle = '#ffb74d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(rhx, rhy, 5 * dpr, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
    }
    // Ground-calibration markers (Phase 5): numbered ⌖ crosshairs at each
    // calibrated floor point, shown only while this camera is selected so the
    // user can see where each snapshot pixel maps on the plan.
    if (selected && cam.camCalib?.points?.length) {
      const tint = cameraColor(cam, (f.cameras ?? []).indexOf(cam));
      cam.camCalib.points.forEach((pp, i) => {
        const q = mmToPx(view, pp.x, pp.y);
        const rr = 7 * dpr;
        ctx.strokeStyle = tint; ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath(); ctx.arc(q.x, q.y, rr, 0, 2 * Math.PI); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(q.x - rr - 3 * dpr, q.y); ctx.lineTo(q.x + rr + 3 * dpr, q.y);
        ctx.moveTo(q.x, q.y - rr - 3 * dpr); ctx.lineTo(q.x, q.y + rr + 3 * dpr);
        ctx.stroke();
        ctx.fillStyle = tint; ctx.font = `bold ${9 * dpr}px sans-serif`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(String(i + 1), q.x + rr + 4 * dpr, q.y - rr);
      });
    }
  }
}

// Projector fixtures (home-theater arc): a small dark lens glyph at the mount
// point; while PROJECTING (bound entity on/playing, or unbound localState 'on')
// a translucent dashed throw wedge aims toward the target screen (or along the
// rotation heading when no screen is bound). Rides the sensors layer.
function drawProjectors(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  for (const pr of f.projectors ?? []) {
    if (pr.hidden) continue;
    const c = mmToPx(view, pr.x, pr.y);
    const projecting = projectorProjecting(p.effectiveState(pr)?.state);
    const beamCol = projectorBeamColor(pr);
    const selected = p.activeProjectorId === pr.id;
    // Throw wedge toward the target screen (else heading-based default reach).
    if (projecting) {
      const screen = pr.screenId ? (f.furniture.find(x => x.id === pr.screenId) ?? null) : null;
      const aim = projectorAim(pr, screen ? { x: screen.x, y: screen.y, cy: 0 } : null);
      const a = mmToPx(view, aim.x, aim.y);
      const dx = a.x - c.x, dy = a.y - c.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = dx / len, ny = dy / len;
      // Perpendicular half-spread at the screen from the throw ratio: the image
      // width ≈ throwDist / throwRatio (§2.2), so half-spread in px ≈ len / (2·ratio).
      const half = len / (2 * projectorThrow(pr));
      const px = -ny * half, py = nx * half;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(a.x + px, a.y + py);
      ctx.lineTo(a.x - px, a.y - py);
      ctx.closePath();
      ctx.fillStyle = hexToRgba(beamCol, 0.12);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(beamCol, 0.5);
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Body glyph.
    ctx.fillStyle = projecting ? lighten(beamCol, 0.1) : selected ? '#90caf9' : '#5c6bc0';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(c.x, c.y, 7 * dpr, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `${9 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('📽', c.x, c.y);
    // Label below (pure NAME).
    if (names) {
      const txt = pr.label?.trim() || 'Projector';
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textBaseline = 'top';
      const tw = ctx.measureText(txt).width + 8 * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(c.x - tw / 2, c.y + 11 * dpr, tw, 13 * dpr);
      ctx.fillStyle = projecting ? beamCol : '#fff';
      ctx.fillText(txt, c.x, c.y + 13 * dpr);
    }
    drawBatteryBadge(ctx, p, pr.entity_id ?? null, c.x + 8 * dpr, c.y - 8 * dpr);
  }
}

// Water valve fixtures (Phase 2b): a floor pipe run with a valve wheel. OPEN =
// blue water-flow dashes animating along the pipe (RAF-driven lineDashOffset);
// transitional (opening/closing) = pulsing. The wheel rotates ∝ openness (a
// quarter-turn ball-valve feel). Unbound reads dimmed. Rides the sensors layer.
function drawValves(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const t = performance.now() / 1000;
  for (const v of f.valves ?? []) {
    const c = mmToPx(view, v.x, v.y);
    const st = p.effectiveState(v);
    const open = valveOpenness(st);
    const flowing = valveFlowing(st);
    const trans = valveTransitional(st);
    const unbound = !v.entity_id;
    const selected = p.activeValveId === v.id;
    const rot = valveRotation(v) * Math.PI / 180;
    const halfLen = Math.max(10, VALVE_DEFAULTS.pipeLenMm * 0.5 * view.scale);
    const pipeW = Math.max(3, VALVE_DEFAULTS.pipeRadiusMm * 2 * view.scale);
    const wheelR = Math.max(7, VALVE_DEFAULTS.wheelRadiusMm * view.scale);
    ctx.save();
    ctx.translate(c.x, c.y);
    // 0 = pipe along +Y world (screen up). Canvas Y is flipped, so use -rot for
    // the along-pipe axis: pipe endpoints at (sin, -cos)·halfLen.
    ctx.rotate(rot);
    // Pipe body (vertical in local frame, running ±halfLen along local Y).
    ctx.lineCap = 'round';
    ctx.lineWidth = pipeW;
    ctx.strokeStyle = 'rgba(120,144,156,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -halfLen); ctx.lineTo(0, halfLen);
    ctx.stroke();
    // Animated water flow dashes while open.
    if (flowing) {
      const pulse = trans ? 0.45 + 0.45 * (0.5 + 0.5 * Math.sin(t * 5)) : 0.9;
      ctx.save();
      ctx.lineWidth = Math.max(1.5, pipeW * 0.42);
      ctx.strokeStyle = hexToRgba('#29b6f6', pulse * (0.4 + 0.6 * open));
      const dash = Math.max(4, pipeW * 0.9);
      ctx.setLineDash([dash, dash]);
      ctx.lineDashOffset = -(t * 90) % (dash * 2);   // flow toward +Y
      ctx.beginPath();
      ctx.moveTo(0, -halfLen); ctx.lineTo(0, halfLen);
      ctx.stroke();
      ctx.restore();
    }
    // Valve body (bonnet) at the center.
    ctx.fillStyle = 'rgba(38,50,56,0.95)';
    const bodyR = Math.max(5, VALVE_DEFAULTS.bodyMm * 0.5 * view.scale);
    ctx.beginPath();
    ctx.arc(0, 0, bodyR, 0, 2 * Math.PI);
    ctx.fill();
    // Hand wheel — rotates a quarter-turn from closed (0) to open (1).
    ctx.globalAlpha = unbound ? 0.6 : 1;
    ctx.save();
    ctx.rotate(open * Math.PI / 2);
    ctx.lineWidth = Math.max(1.5, wheelR * 0.16);
    ctx.strokeStyle = flowing ? '#29b6f6' : (open > 0 ? '#4fc3f7' : '#ef5350');
    ctx.beginPath();
    ctx.arc(0, 0, wheelR, 0, 2 * Math.PI);
    ctx.stroke();
    // Spokes.
    ctx.beginPath();
    for (let s = 0; s < 4; s++) {
      const a = s * Math.PI / 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * wheelR, Math.sin(a) * wheelR);
    }
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
    // Selection ring.
    if (selected) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, wheelR + 4, 0, 2 * Math.PI);
      ctx.stroke();
    }
    ctx.restore();
    // Label below (screen space, unrotated).
    const label = v.label?.trim() || 'Valve';
    const badge = st ? (flowing ? (trans ? (st.state) : 'open') : 'closed') : (unbound ? 'unbound' : '—');
    const txt = fixtureCaption(names, label, badge);
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const tw = ctx.measureText(txt).width + 8 * dpr;
    const by = c.y + wheelR + halfLen * 0.15 + 6 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(c.x - tw / 2, by, tw, 13 * dpr);
    ctx.fillStyle = flowing ? '#4fc3f7' : (st ? '#cfd8dc' : '#90a4ae');
    ctx.fillText(txt, c.x, by + 1 * dpr);
    drawBatteryBadge(ctx, p, v.entity_id, c.x + wheelR, c.y - wheelR);
  }
}

// Irrigation / sprinkler zones (T3): a small flush head disc (grey at rest,
// blue running) + — while the bound entity is RUNNING — a translucent spray
// wedge (arc `arcDeg` centered on `rotation`, radius `radius`) with a fast
// pulse (spray) or a sweeping bright sub-arc (rotor). Drip heads show no wedge.
// Head hit-test is a point-in-circle; the wedge is non-interactive (clicking
// toggles the head, not the water). Rides the `ground` layer.
function drawSprinklerZones(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const t = performance.now() / 1000;
  for (const z of f.sprinklerZones ?? []) {
    const c = mmToPx(view, z.x, z.y);
    const st = p.effectiveState(z);
    const running = sprinklerRunning(st);
    const unbound = !z.entity_id;
    const selected = p.activeSprinklerId === z.id;
    const kind = sprinklerHeadKind(z);
    const arc = sprinklerArcDeg(z) * Math.PI / 180;
    const rot = sprinklerRotation(z) * Math.PI / 180;
    const R = sprinklerRadius(z) * view.scale;
    ctx.save();
    ctx.translate(c.x, c.y);
    // Spray wedge while running (drip = no wedge). Center on world +Y (screen up
    // = canvas -π/2), rotated by rot.
    if (running && kind !== 'drip') {
      const base = -Math.PI / 2 + rot;
      const a0 = base - arc / 2, a1 = base + arc / 2;
      const pulse = 0.20 + 0.12 * (0.5 + 0.5 * Math.sin(t * 6));
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, a0, a1);
      ctx.closePath();
      ctx.fillStyle = hexToRgba('#4fc3f7', pulse);
      ctx.fill();
      ctx.strokeStyle = hexToRgba('#29b6f6', 0.5);
      ctx.lineWidth = 1;
      ctx.stroke();
      // Rotor head: a bright narrow sub-arc sweeping across the envelope ~3 s.
      if (kind === 'rotor') {
        const sweep = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 3));   // 0..1
        const w = Math.min(arc, 0.35);
        const sc = a0 + w / 2 + sweep * Math.max(0, arc - w);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R, sc - w / 2, sc + w / 2);
        ctx.closePath();
        ctx.fillStyle = hexToRgba('#b3e5fc', 0.34);
        ctx.fill();
      }
    }
    // Head disc (flush, small).
    const hr = Math.max(3, SPRINKLER_DEFAULTS.headRadiusMm * view.scale);
    ctx.globalAlpha = unbound ? 0.7 : 1;
    ctx.fillStyle = running ? '#4fc3f7' : '#6b7075';
    ctx.beginPath(); ctx.arc(0, 0, hr, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = running ? '#29b6f6' : '#4a4e52';
    ctx.lineWidth = 1; ctx.stroke();
    ctx.globalAlpha = 1;
    if (selected) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, hr + 4, 0, 2 * Math.PI); ctx.stroke();
    }
    ctx.restore();
    // Optional label (zone number / name) below the head.
    const labelTxt = names ? (z.zoneNumber != null ? `Zone ${z.zoneNumber}` : (z.label?.trim() || '')) : '';
    if (names && (selected || labelTxt)) {
      const txt = labelTxt || 'Sprinkler';
      ctx.font = `${9 * dpr}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const tw = ctx.measureText(txt).width + 8 * dpr;
      const by = c.y + hr + 5 * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(c.x - tw / 2, by, tw, 12 * dpr);
      ctx.fillStyle = running ? '#4fc3f7' : '#90a4ae';
      ctx.fillText(txt, c.x, by + 1 * dpr);
    }
    drawBatteryBadge(ctx, p, z.entity_id, c.x + hr, c.y - hr);
  }
}

// Yard flagpoles (furniture layer): a small base dot + a short pole line + a
// tiny waving-flag glyph tinted by the flag's dominant color, hoisted to the
// resolved fraction (full / half / lowered). A ⯪ half-mast caption when hoisted
// to ~0.5. The 3D view carries the real waving cloth; 2D is a glanceable marker.
function drawFlagpoles(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const dpr = window.devicePixelRatio || 1;
  const t = performance.now() / 1000;
  const f = p.floor();
  for (const fp of f.flagpoles ?? []) {
    if (fp.hidden) continue;
    const c = mmToPx(view, fp.x, fp.y);
    const sel = p.activeFlagpoleId === fp.id;
    const dom = flagDominant(fp.flag);
    const frac = flagpoleHoistFraction(fp, fp.entityId ? p.hass?.states?.[fp.entityId] ?? null : null);
    // Pole drawn upward on screen (toward -y). Length scales a little with height.
    const poleLen = Math.max(24 * dpr, ((fp.height ?? FLAGPOLE_DEFAULTS.height) / 6000) * 46 * dpr);
    const topY = c.y - poleLen;
    // Base dot.
    ctx.fillStyle = '#9aa0a6';
    ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(3, 4 * dpr), 0, 2 * Math.PI); ctx.fill();
    // Pole.
    ctx.strokeStyle = sel ? '#fff' : '#c8ccd0';
    ctx.lineWidth = Math.max(1.5, 2 * dpr);
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x, topY); ctx.stroke();
    // Gold finial.
    ctx.fillStyle = '#ffcf40';
    ctx.beginPath(); ctx.arc(c.x, topY, Math.max(2, 2.5 * dpr), 0, 2 * Math.PI); ctx.fill();
    // Flag: a small rect just below the hoist point, waving via a sine on the fly.
    const fh = 10 * dpr, fwid = 16 * dpr;
    const hoistY = topY + (1 - frac) * (poleLen - fh - 2 * dpr) + 2 * dpr;
    ctx.save();
    ctx.beginPath();
    const wave = 2 * dpr * Math.sin(t * 4);
    ctx.moveTo(c.x, hoistY);
    ctx.lineTo(c.x + fwid, hoistY + wave);
    ctx.lineTo(c.x + fwid, hoistY + fh + wave);
    ctx.lineTo(c.x, hoistY + fh);
    ctx.closePath();
    ctx.fillStyle = dom;
    ctx.globalAlpha = 0.92;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(1, dpr); ctx.stroke();
    ctx.restore();
    // Half-mast indicator.
    if (fp.halfMast || (frac > 0.35 && frac < 0.65)) {
      ctx.fillStyle = '#ffb74d'; ctx.font = `${8 * dpr}px sans-serif`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('½', c.x + fwid + 3 * dpr, hoistY + fh / 2);
    }
    if (sel) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      ctx.strokeRect(c.x - 6 * dpr, topY - 4 * dpr, fwid + 14 * dpr, poleLen + 10 * dpr);
    }
    const nm = names ? fp.label?.trim() : '';
    if (nm) {
      ctx.fillStyle = '#ddd'; ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(nm, c.x, c.y + 6 * dpr);
    }
  }
}

// Sun-tracking solar panels (sensors layer): the array drawn from above,
// FORESHORTENED by its live tilt (an along-slope length L reads L·cos(tilt) in
// plan) and rotated to the tracked sun azimuth composed with the fixture's base
// yaw. The frame stroke carries the WHO UV band color (weather.ts uvBand — the
// same ladder the weather chip's UV row uses); a bound power sensor adds a
// wattage chip (amber when NEGATIVE = grid draw on a signed monitor). Parked
// (sun down) panels dim and lose the sun arrow.
function drawSolarPanels(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const f = p.floor();
  const list = f.solarPanels ?? [];
  if (!list.length) return;
  const names = objectLabelsOn(p);
  const dpr = window.devicePixelRatio || 1;
  const states = p.hass?.states ?? {};
  // Same sun as the 3D array + the scene's sun light (solar.ts is the one home
  // for that resolution); θ maps the compass bearing into the plan frame.
  const fit = p.geoFit();
  const theta = fit && fit.transform.quality !== 'none' ? fit.transform.thetaRad : 0;
  // A demo weather source's authored sun overrides `sun.sun` here exactly as it
  // does for the 3D array + the scene sun light (weather.ts demoSunAltAz is the
  // single override helper), so 2D and 3D can never aim differently.
  const { sun } = resolveSunPlan(states['sun.sun'] ?? null, theta, Date.now(),
    demoSunAltAz(p.store.weather));
  const uvRaw = p.weatherNow?.uvIndex;
  const uv = (typeof uvRaw === 'number' && isFinite(uvRaw)) ? uvBand(Math.round(uvRaw)) : null;
  for (const sp of list) {
    if (sp.hidden) continue;
    const c = mmToPx(view, sp.x, sp.y);
    const sel = p.activeSolarId === sp.id;
    const aim = solarAim(sun.azDeg, sun.elevDeg, solarRotation(sp));
    const tiltRad = aim.tiltDeg * Math.PI / 180;
    const halfW = Math.max(6, SOLAR_DEFAULTS.panelW * 0.5 * view.scale);
    const halfD = Math.max(2.5, SOLAR_DEFAULTS.panelH * 0.5 * view.scale * Math.cos(tiltRad));
    const watts = sp.powerEntity ? solarPowerValue(states[sp.powerEntity] ?? null) : null;
    const glow = (watts != null && watts > 5) ? powerGlowScale(watts) : 0;
    const frame = uv ? uv.color : '#78909c';
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(aim.yawDeg * Math.PI / 180);   // local -Y now points along the plan azimuth
    ctx.globalAlpha = aim.parked ? 0.55 : 1;
    // Generation halo behind the array.
    if (glow > 0) {
      ctx.save();
      ctx.shadowColor = solarPowerColor(watts);
      ctx.shadowBlur = 14 * glow;
      ctx.fillStyle = hexToRgba(solarPowerColor(watts), 0.16 * glow);
      ctx.beginPath();
      ctx.ellipse(0, 0, halfW * 1.25, Math.max(halfD * 1.6, halfW * 0.5), 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
    // PV face.
    ctx.beginPath();
    ctx.rect(-halfW, -halfD, halfW * 2, halfD * 2);
    ctx.fillStyle = aim.parked ? 'rgba(20,32,46,0.9)' : 'rgba(24,52,84,0.95)';
    ctx.fill();
    ctx.lineWidth = sel ? 2.5 : 1.5;
    ctx.strokeStyle = sel ? '#fff' : frame;
    ctx.stroke();
    // Cell grid lines (along the slope), skipped when the array is edge-on.
    if (halfD > 3) {
      ctx.strokeStyle = 'rgba(140,180,220,0.35)';
      ctx.lineWidth = Math.max(0.6, dpr * 0.6);
      ctx.beginPath();
      for (const k of [-0.5, 0, 0.5]) {
        ctx.moveTo(k * halfW, -halfD);
        ctx.lineTo(k * halfW, halfD);
      }
      ctx.moveTo(-halfW, 0); ctx.lineTo(halfW, 0);
      ctx.stroke();
    }
    // HIGH edge bar (up-slope, local +Y) — the visual cue for which way it leans.
    ctx.fillStyle = frame;
    ctx.fillRect(-halfW, halfD - Math.max(1.2, dpr), halfW * 2, Math.max(1.2, dpr) * 2);
    // Sun arrow out the FACE (local -Y = the tracked azimuth) while tracking.
    if (!aim.parked) {
      const aLen = halfD + 10 * dpr;
      ctx.strokeStyle = hexToRgba('#ffd54f', 0.9);
      ctx.lineWidth = Math.max(1.2, dpr);
      ctx.beginPath();
      ctx.moveTo(0, -halfD); ctx.lineTo(0, -aLen);
      ctx.moveTo(-3 * dpr, -aLen + 4 * dpr); ctx.lineTo(0, -aLen);
      ctx.lineTo(3 * dpr, -aLen + 4 * dpr);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // Pedestal base dot (screen space).
    ctx.fillStyle = '#90a4ae';
    ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(2.5, 3 * dpr), 0, 2 * Math.PI); ctx.fill();
    // Label + tilt badge + optional W chip (screen space, unrotated).
    const label = sp.label?.trim() || 'Solar panel';
    const badge = aim.parked ? 'parked' : `${Math.round(aim.tiltDeg)}° tilt`;
    let txt = fixtureCaption(names, label, badge);
    const wt = solarPowerText(watts);
    if (wt) txt += `${txt ? ' · ' : ''}${wt}`;
    if (txt) {
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const tw = ctx.measureText(txt).width + 8 * dpr;
      const by = c.y + Math.max(halfD, halfW * 0.4) + 6 * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(c.x - tw / 2, by, tw, 13 * dpr);
      ctx.fillStyle = watts != null ? solarPowerColor(watts) : (aim.parked ? '#90a4ae' : '#cfd8dc');
      ctx.fillText(txt, c.x, by + 1 * dpr);
    }
  }
}

// Smart plug / outlet fixtures (Phase 2b): a wall outlet plate with two socket
// slots + a plugged-in cord hint. ON = green energized glow (scaled by the
// optional power draw) + a W readout chip when a powerEntity is bound. Unbound
// reads dimmed. Rides the switches layer.
function drawPlugs(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  for (const pl of f.plugs ?? []) {
    const c = mmToPx(view, pl.x, pl.y);
    const st = p.effectiveState(pl);
    const on = st?.state === 'on' || st?.state === 'playing';
    const unbound = !pl.entity_id;
    const selected = p.activePlugId === pl.id;
    const rot = plugRotation(pl) * Math.PI / 180;
    const powerW = pl.powerEntity && p.hass?.states
      ? parseFloat(p.hass.states[pl.powerEntity]?.state ?? '') : NaN;
    const glow = on ? (isFinite(powerW) && powerW > 5 ? powerGlowScale(powerW) : 1) : 0;
    const half = Math.max(7, PLUG_DEFAULTS.size * 0.5 * view.scale);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(rot);
    // Energized halo behind the plate.
    if (glow > 0) {
      ctx.save();
      ctx.shadowColor = '#4caf50';
      ctx.shadowBlur = 12 * glow;
      ctx.fillStyle = hexToRgba('#4caf50', 0.18 * glow);
      ctx.beginPath();
      ctx.arc(0, 0, half * 1.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
    // Plate.
    ctx.beginPath();
    ctx.roundRect(-half, -half, half * 2, half * 2, half * 0.3);
    ctx.fillStyle = 'rgba(236,239,241,0.95)';
    ctx.fill();
    ctx.lineWidth = selected ? 2.5 : 1.4;
    ctx.strokeStyle = selected ? '#fff' : (on ? '#4caf50' : hexToRgba('#607d8b', 0.9));
    ctx.stroke();
    // Two socket slots.
    ctx.globalAlpha = unbound ? 0.6 : 1;
    ctx.fillStyle = on ? '#2e7d32' : '#546e7a';
    for (const sx of [-0.32, 0.32]) {
      ctx.fillRect(sx * half - half * 0.06, -half * 0.34, half * 0.12, half * 0.42);
    }
    // Ground pin.
    ctx.beginPath();
    ctx.arc(0, half * 0.42, half * 0.11, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;
    // LED dot (top-right).
    ctx.beginPath();
    ctx.arc(half * 0.66, -half * 0.66, Math.max(1.5, half * 0.14), 0, 2 * Math.PI);
    ctx.fillStyle = on ? '#69f0ae' : 'rgba(120,144,156,0.5)';
    ctx.fill();
    ctx.restore();
    // Label + optional W chip below (screen space, unrotated).
    const label = pl.label?.trim() || 'Plug';
    let txt = fixtureCaption(names, label, st ? (on ? 'on' : 'off') : (unbound ? 'unbound' : '—'));
    if (isFinite(powerW) && on) txt += `${txt ? ' · ' : ''}${Math.round(powerW)}W`;
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const tw = ctx.measureText(txt).width + 8 * dpr;
    const by = c.y + half + 5 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(c.x - tw / 2, by, tw, 13 * dpr);
    ctx.fillStyle = on ? '#69f0ae' : (st ? '#cfd8dc' : '#90a4ae');
    ctx.fillText(txt, c.x, by + 1 * dpr);
    drawBatteryBadge(ctx, p, pl.entity_id, c.x + half * 0.9, c.y - half * 0.9);
  }
}

// Camera alert snapshot card (#10 extension): a screen-fixed ~220×140 px thumb
// of the camera's entity_picture with an alert-red border, anchored beside the
// camera marker and clamped on-canvas. The image is cache-busted every ~3 s
// while alerting (camSnapshot); a text "ALERT" fallback draws until the first
// frame loads or if the image errors. drawImage is try/caught (cross-origin
// taint tolerated).
function drawCameraAlertCard(
  ctx: CanvasRenderingContext2D, p: Planner, cam: { entity_id: string | null; label?: string },
  c: { x: number; y: number }, st: HassState | null, dpr: number,
): void {
  const CW = 220 * dpr, CH = 140 * dpr;
  const gap = 14 * dpr;
  const cv = ctx.canvas;
  // Prefer the right side of the marker; flip left if it would overflow.
  let cardX = c.x + gap;
  if (cardX + CW > cv.width) cardX = c.x - gap - CW;
  cardX = Math.max(4 * dpr, Math.min(cardX, cv.width - CW - 4 * dpr));
  let cardY = c.y - CH / 2;
  cardY = Math.max(4 * dpr, Math.min(cardY, cv.height - CH - 4 * dpr));
  // Card background.
  ctx.save();
  ctx.fillStyle = 'rgba(8,10,16,0.9)';
  ctx.beginPath(); ctx.roundRect(cardX, cardY, CW, CH, 6 * dpr); ctx.fill();
  // Snapshot image (refreshed every ~3 s via a cache-bust bucket).
  const pic = cam.entity_id && st ? (st.attributes as Record<string, unknown> | undefined)?.entity_picture : null;
  let drew = false;
  if (typeof pic === 'string' && pic) {
    const bucket = Math.floor(Date.now() / 3000);
    const url = p.haBaseUrl + pic + (pic.includes('?') ? '&' : '?') + '_cb=' + bucket;
    const img = camSnapshot(url);
    if (img) {
      try {
        ctx.save();
        ctx.beginPath(); ctx.roundRect(cardX + 3 * dpr, cardY + 3 * dpr, CW - 6 * dpr, CH - 24 * dpr, 4 * dpr); ctx.clip();
        ctx.drawImage(img, cardX + 3 * dpr, cardY + 3 * dpr, CW - 6 * dpr, CH - 24 * dpr);
        ctx.restore();
        drew = true;
      } catch { /* taint → fall through to text */ }
    }
  }
  if (!drew) {
    ctx.fillStyle = '#ef5350';
    ctx.font = `700 ${16 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('⚠ ALERT', cardX + CW / 2, cardY + (CH - 20 * dpr) / 2);
  }
  // Caption bar with the camera name.
  ctx.fillStyle = '#ffcdd2';
  ctx.font = `${11 * dpr}px sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(fixtureCaption(objectLabelsOn(p), cam.label?.trim() || 'Camera', 'ALERT'),
               cardX + 8 * dpr, cardY + CH - 11 * dpr);
  // Alert-red border on top.
  ctx.lineWidth = 2.5 * dpr;
  ctx.strokeStyle = '#ef5350';
  ctx.beginPath(); ctx.roundRect(cardX, cardY, CW, CH, 6 * dpr); ctx.stroke();
  ctx.restore();
}

// FP2-style presence zones (roadmap #5): world-mm polygons bound to occupancy
// binary_sensors. Outline in the zone color (dashed when unbound); when bound +
// ON, a filled glow (inclusion-zone glow idiom). Draggable vertex handles show
// on the active zone. In-progress draw preview mirrors the wall-draw latch.
// Gated on the `zones` layer at the call site.
// Ground / yard covering areas (the "yard" arc). Flat kind-colored fill + a
// dashed selection outline; drawn early (under everything) as pure paint. In
// edit mode the active area shows orange vertex handles + the in-progress
// draw preview (mirrors the presence-zone latch).
// ── Valetudo room-map overlay ─────────────────────────────────────────────
// Per-segment tinted raster canvas cache. Keyed `<robotId>:<rev>:<segId>` so a
// republished map (new rev) rebuilds; the tint is glow-INDEPENDENT (glow rides
// draw-time alpha, never a re-tint). Evicted per robot when its rev advances.
const _vacTintCache = new Map<string, HTMLCanvasElement>();

function _vacSegTint(robotId: string, rev: number, seg: VacSegment, segIdx: number): HTMLCanvasElement {
  const key = `${robotId}:${rev}:${seg.id}`;
  const hit = _vacTintCache.get(key);
  if (hit) return hit;
  // Drop stale-rev entries for this robot+segment to bound the cache.
  const stalePrefix = `${robotId}:`;
  for (const k of _vacTintCache.keys()) {
    if (k.startsWith(stalePrefix) && k.endsWith(`:${seg.id}`) && k !== key) _vacTintCache.delete(k);
  }
  const w = Math.max(1, seg.bbox.maxX - seg.bbox.minX + 1);
  const h = Math.max(1, seg.bbox.maxY - seg.bbox.minY + 1);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const cx = cv.getContext('2d');
  if (cx) {
    cx.fillStyle = vacSegColor(segIdx);
    for (const run of seg.runs) cx.fillRect(run.x - seg.bbox.minX, run.y - seg.bbox.minY, run.count, 1);
  }
  _vacTintCache.set(key, cv);
  return cv;
}

function drawVacuumMaps(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const robots = f.robots ?? [];
  // Slow glow pulse (RAF-driven — never re-tints, just modulates alpha).
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 500);
  for (const ro of robots) {
    if (ro.kind !== 'vacuum' || !ro.valetudoId) continue;
    const map: ParsedVacMap | undefined = p.vacuumMaps[ro.id];
    if (!map) continue;
    const rev = p.vacuumMapRev[ro.id] ?? 0;
    const glow = p.vacuumGlowSegments(ro.id);   // Set of glowing seg ids, or null
    const aff = vacMapAffine(map.pixelSize, ro);
    map.segments.forEach((seg, i) => {
      const tint = _vacSegTint(ro.id, rev, seg, i);
      // Pixel(i,j)→screen affine (composes the pixel→world affine with the view).
      const s = view.scale;
      const a = s * aff.A, b = -s * aff.B, c = s * aff.C, d = -s * aff.D;
      const e = view.ox + s * (aff.A * seg.bbox.minX + aff.C * seg.bbox.minY + aff.E);
      const fY = view.oy - s * (aff.B * seg.bbox.minX + aff.D * seg.bbox.minY + aff.F);
      const glowing = glow?.has(seg.id) ?? false;
      ctx.save();
      ctx.globalAlpha = glowing ? 0.35 + 0.4 * pulse : 0.34;
      ctx.imageSmoothingEnabled = false;
      ctx.setTransform(a, b, c, d, e, fY);
      ctx.drawImage(tint, 0, 0);
      ctx.restore();
      // Name label at the world centroid (normal screen space).
      const cw = { x: aff.A * seg.centroidPx.x + aff.C * seg.centroidPx.y + aff.E,
                   y: aff.B * seg.centroidPx.x + aff.D * seg.centroidPx.y + aff.F };
      const cp = mmToPx(view, cw.x, cw.y);
      const label = seg.name?.trim() || `Room ${seg.id}`;
      ctx.font = `${11 * dpr}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = hexToRgba('#000000', 0.55);
      ctx.fillText(label, cp.x + dpr, cp.y + dpr);
      ctx.fillStyle = hexToRgba('#ffffff', 0.92);
      ctx.fillText(label, cp.x, cp.y);
    });
  }
}

// Pools / spas (T4) — water-body polygon fill + a lighter coping ring, a warm
// heater-glow wash while heating, an animated pump ripple, and (when selected) a
// water-quality chip. Rides the `ground` layer; drawn in the low-priority ground
// slot so it never swallows fixture clicks. Mirrors drawGroundAreas' selection
// handles + drawingPoolArea preview.
function drawPools(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const areaLabels = p.store.layers2d?.labels !== false;
  for (const pl of f.pools ?? []) {
    if (pl.hidden || pl.points.length < 3) continue;
    const active = p.activePoolId === pl.id;
    const water = poolWaterColor(pl);
    const pts = pl.points.map(v => mmToPx(view, v.x, v.y));
    // Water fill.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(water, 0.7);
    ctx.fill();
    // Pump-on ripple: moving light highlight bands clipped to the water.
    if (p.poolPumpOnOf(pl)) {
      ctx.save();
      ctx.clip();
      let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
      for (const pt of pts) { if (pt.x < minx) minx = pt.x; if (pt.x > maxx) maxx = pt.x; if (pt.y < miny) miny = pt.y; if (pt.y > maxy) maxy = pt.y; }
      const off = (now / 40) % 60;
      ctx.strokeStyle = hexToRgba('#ffffff', 0.18);
      ctx.lineWidth = 2 * dpr;
      for (let y = miny - 60 + off; y < maxy; y += 30) {
        ctx.beginPath(); ctx.moveTo(minx, y); ctx.lineTo(maxx, y - 8 * dpr); ctx.stroke();
      }
      ctx.restore();
    }
    // Heater glow: warm amber wash pulsing while actively heating (dim when idle).
    const hs = p.poolHeaterStateOf(pl);
    if (hs !== 'off') {
      const base = hs === 'heating' ? 0.22 : 0.1;
      const a = base + (hs === 'heating' ? 0.12 * (0.5 + 0.5 * Math.sin(now / 500)) : 0);
      ctx.fillStyle = hexToRgba('#ff8a4c', a);
      ctx.fill();
    }
    // Coping rim (inset lighter ring).
    if (pts.length >= 3) {
      let cx = 0, cy = 0; for (const pt of pts) { cx += pt.x; cy += pt.y; } cx /= pts.length; cy /= pts.length;
      const inset = 4 * dpr;
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const dx = pts[i].x - cx, dy = pts[i].y - cy, len = Math.hypot(dx, dy) || 1;
        const ix = pts[i].x - (dx / len) * inset, iy = pts[i].y - (dy / len) * inset;
        if (i === 0) ctx.moveTo(ix, iy); else ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      ctx.strokeStyle = hexToRgba(POOL_COPING_COLOR, 0.85);
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();
    }
    // Outer edge stroke.
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.strokeStyle = hexToRgba(water, active ? 0.95 : 0.6);
    ctx.lineWidth = active ? 2 : 1;
    ctx.stroke();
    ctx.restore();
    // Name label at centroid — an AREA name, so it rides `labels` with the room
    // and ground-area names (the water-quality chip below is a VALUE and stays).
    const ctr = centroid(pl.points);
    const cp = mmToPx(view, ctr.x, ctr.y);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (areaLabels) {
      ctx.fillStyle = hexToRgba('#ffffff', 0.9);
      ctx.font = `${11 * dpr}px sans-serif`;
      ctx.fillText(pl.name?.trim() || (pl.kind === 'spa' ? 'Spa' : 'Pool'), cp.x, cp.y);
    }
    // Water-quality chip (temp · pH · ORP · salt) from whichever sensors bound.
    const st = (id?: string) => id ? (p.hass?.states?.[id] ?? null) : null;
    const parts: string[] = [];
    const tSt = st(pl.waterTempEntity);
    if (tSt) parts.push(`${tSt.state}${(tSt.attributes?.['unit_of_measurement'] as string) ?? '°'}`);
    const phSt = st(pl.phEntity); if (phSt) parts.push(`pH ${phSt.state}`);
    const orpSt = st(pl.orpEntity); if (orpSt) parts.push(`${orpSt.state} ORP`);
    const saltSt = st(pl.saltEntity); if (saltSt) parts.push(`${saltSt.state} ppm`);
    if (parts.length) {
      const chip = parts.join(' · ');
      ctx.font = `${10 * dpr}px sans-serif`;
      const w = ctx.measureText(chip).width + 10 * dpr;
      const chy = cp.y + 15 * dpr;
      ctx.fillStyle = hexToRgba('#0a1418', active ? 0.85 : 0.55);
      ctx.fillRect(cp.x - w / 2, chy - 8 * dpr, w, 16 * dpr);
      ctx.fillStyle = hexToRgba('#bfe9f5', active ? 0.95 : 0.7);
      ctx.fillText(chip, cp.x, chy);
    }
    // Vertex handles on the active (unlocked) pool.
    if (active && !pl.locked) {
      for (const pt of pts) {
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 5 * dpr, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffb74d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        ctx.fill(); ctx.stroke();
      }
      if (insertHandlesEnabled(p) && pl.points.length < POLY_CAPS.pool)
        drawInsertHandles(ctx, view, pl.points, true);
    }
  }
  // In-progress draw preview (drawingPoolArea) — mirrors the ground latch.
  const dp = p.drawingPoolArea;
  if (dp?.points.length) {
    const col = poolWaterColor({});
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    ctx.beginPath();
    const a = mmToPx(view, dp.points[0].x, dp.points[0].y);
    ctx.moveTo(a.x, a.y);
    for (let i = 1; i < dp.points.length; i++) { const pt = mmToPx(view, dp.points[i].x, dp.points[i].y); ctx.lineTo(pt.x, pt.y); }
    if (p.cursor) { const c2 = mmToPx(view, p.cursor.x, p.cursor.y); ctx.lineTo(c2.x, c2.y); }
    ctx.stroke(); ctx.setLineDash([]);
    for (const v of dp.points) {
      const pt = mmToPx(view, v.x, v.y);
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 4 * dpr, 0, 2 * Math.PI);
      ctx.fillStyle = col; ctx.fill();
    }
    ctx.restore();
  }
}

function drawGroundAreas(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const areaLabels = p.store.layers2d?.labels !== false;
  // Yard fill (opt-in): a flat low-priority underlay of the floor rect MINUS
  // every closed wall loop (even-odd), drawn after the floor slab / before the
  // ground areas so painted patches + structure sit on top. Gated by the caller
  // on the `ground` layer (mirrors the 3D y=2 underlay patch).
  if (f.yardFill) {
    const col = groundAreaColor({ kind: f.yardFill });
    const loops = floorLoops(f);
    ctx.save();
    ctx.beginPath();
    const c0 = mmToPx(view, 0, 0), c1 = mmToPx(view, f.w, 0);
    const c2 = mmToPx(view, f.w, f.d), c3 = mmToPx(view, 0, f.d);
    ctx.moveTo(c0.x, c0.y); ctx.lineTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(c3.x, c3.y); ctx.closePath();
    for (const loop of loops) {
      if (loop.length < 3) continue;
      const a0 = mmToPx(view, loop[0].x, loop[0].y);
      ctx.moveTo(a0.x, a0.y);
      for (let i = 1; i < loop.length; i++) { const pt = mmToPx(view, loop[i].x, loop[i].y); ctx.lineTo(pt.x, pt.y); }
      ctx.closePath();
    }
    ctx.fillStyle = hexToRgba(col, f.yardFill === 'water' ? 0.35 : 0.45);
    ctx.fill('evenodd');
    ctx.restore();
  }
  for (const g of f.groundAreas ?? []) {
    if (g.hidden || g.points.length < 3) continue;
    const col = groundAreaColor(g);
    const active = p.activeGroundAreaId === g.id;
    const pts = g.points.map(v => mmToPx(view, v.x, v.y));
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(col, g.kind === 'water' ? 0.55 : 0.72);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(col, active ? 0.95 : 0.6);
    ctx.lineWidth = active ? 2 : 1;
    ctx.stroke();
    // Terrace contour: an inset ring, lighter for a raised tier / darker for a
    // sunk one — a cheap "this reads as elevation" cue (mirrors the 3D skirt).
    const elev = g.elevationMm ?? 0;
    if (elev !== 0 && pts.length >= 3) {
      let cx = 0, cy = 0;
      for (const pt of pts) { cx += pt.x; cy += pt.y; }
      cx /= pts.length; cy /= pts.length;
      const inset = 4 * dpr;
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const dx = pts[i].x - cx, dy = pts[i].y - cy, len = Math.hypot(dx, dy) || 1;
        const ix = pts[i].x - (dx / len) * inset, iy = pts[i].y - (dy / len) * inset;
        if (i === 0) ctx.moveTo(ix, iy); else ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      ctx.strokeStyle = elev > 0 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();
    }
    // Name / kind label at the centroid. An AREA name is the same "what is this
    // space called" text a room label is, so it rides the `labels` layer (which
    // is why that layer is called "Room & area labels") rather than `ground`.
    const ctr = centroid(g.points);
    const cp = mmToPx(view, ctr.x, ctr.y);
    if (areaLabels) {
      ctx.fillStyle = hexToRgba('#ffffff', 0.85);
      ctx.font = `${11 * dpr}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(g.name?.trim() || groundKindLabel(g.kind), cp.x, cp.y);
    }
    // Elevation caption on the selected non-zero tier (existing chip idiom).
    // Selection UI, not a name — un-gated, and it sets its own text alignment
    // now that the label block above may not have run.
    if (active && elev !== 0) {
      ctx.fillStyle = hexToRgba(elev > 0 ? '#ffe0a0' : '#a0c4ff', 0.95);
      ctx.font = `bold ${11 * dpr}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`${elev > 0 ? '+' : '−'}${Math.abs(elev)} mm`, cp.x, cp.y + 14 * dpr);
    }
    // Vertex handles on the active (unlocked) area. A PATH-backed area shows its
    // CENTERLINE handles (+ the polyline) instead of the derived polygon vertices
    // (pinned decision 3 — the generated verts are not draggable).
    if (active && !g.locked) {
      if (g.path && g.path.centerline.length) {
        const cl = g.path.centerline.map(v => mmToPx(view, v.x, v.y));
        ctx.save();
        ctx.strokeStyle = 'rgba(255,183,77,0.85)'; ctx.lineWidth = 1.5 * dpr; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(cl[0].x, cl[0].y);
        for (let i = 1; i < cl.length; i++) ctx.lineTo(cl[i].x, cl[i].y);
        ctx.stroke(); ctx.setLineDash([]);
        for (const pt of cl) {
          ctx.beginPath(); ctx.arc(pt.x, pt.y, 5 * dpr, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffb74d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
          ctx.fill(); ctx.stroke();
        }
        ctx.restore();
        // Insert handles ride the CENTERLINE (the polygon is derived — pinned
        // decision 3): an OPEN polyline, so N points → N−1 midpoints.
        if (insertHandlesEnabled(p) && g.path.centerline.length < POLY_CAPS.path)
          drawInsertHandles(ctx, view, g.path.centerline, false);
      } else {
        for (const pt of pts) {
          ctx.beginPath(); ctx.arc(pt.x, pt.y, 5 * dpr, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffb74d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
          ctx.fill(); ctx.stroke();
        }
        if (insertHandlesEnabled(p) && g.points.length < POLY_CAPS.ground)
          drawInsertHandles(ctx, view, g.points, true);
      }
    }
  }
  // In-progress path centerline preview (drawingPath) — records centerline clicks;
  // the ribbon is only realized on finish via bufferPolyline.
  const dpath = p.drawingPath;
  if (dpath?.points.length) {
    ctx.save();
    ctx.strokeStyle = '#b8b8bc'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.beginPath();
    const a0 = mmToPx(view, dpath.points[0].x, dpath.points[0].y);
    ctx.moveTo(a0.x, a0.y);
    for (let i = 1; i < dpath.points.length; i++) {
      const pt = mmToPx(view, dpath.points[i].x, dpath.points[i].y);
      ctx.lineTo(pt.x, pt.y);
    }
    if (p.cursor) { const c2 = mmToPx(view, p.cursor.x, p.cursor.y); ctx.lineTo(c2.x, c2.y); }
    ctx.stroke(); ctx.setLineDash([]);
    for (const v of dpath.points) {
      const pt = mmToPx(view, v.x, v.y);
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 4 * dpr, 0, 2 * Math.PI);
      ctx.fillStyle = '#b8b8bc'; ctx.fill();
    }
    ctx.restore();
  }
  // In-progress draw preview (drawingGroundArea) — mirrors the pzone latch.
  const dg = p.drawingGroundArea;
  if (dg?.points.length) {
    const col = '#4c7a34';
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    ctx.beginPath();
    const a = mmToPx(view, dg.points[0].x, dg.points[0].y);
    ctx.moveTo(a.x, a.y);
    for (let i = 1; i < dg.points.length; i++) {
      const pt = mmToPx(view, dg.points[i].x, dg.points[i].y);
      ctx.lineTo(pt.x, pt.y);
    }
    if (p.cursor) {
      const c2 = mmToPx(view, p.cursor.x, p.cursor.y);
      ctx.lineTo(c2.x, c2.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    for (const v of dg.points) {
      const pt = mmToPx(view, v.x, v.y);
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 4 * dpr, 0, 2 * Math.PI);
      ctx.fillStyle = col; ctx.fill();
    }
    ctx.restore();
  }
}

// Floor voids / openings — dark hatched holes cut from the slab (stairwell
// well, atrium). Dark fill + diagonal hatch lines + dashed outline; dim when
// unselected. Rides the `ground` layer. Edit mode shows orange vertex handles +
// the in-progress draw preview (mirrors the ground-area latch).
function drawVoidAreas(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  for (const vd of f.voidAreas ?? []) {
    if (vd.hidden || vd.points.length < 3) continue;
    const active = p.activeVoidAreaId === vd.id;
    const pts = vd.points.map(v => mmToPx(view, v.x, v.y));
    // Bounding box for the hatch clip.
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const pt of pts) {
      if (pt.x < minX) minX = pt.x; if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x; if (pt.y > maxY) maxY = pt.y;
    }
    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
    };
    // Dark base fill.
    trace();
    ctx.fillStyle = hexToRgba('#0a0d12', active ? 0.82 : 0.62);
    ctx.fill();
    // Diagonal hatch lines, clipped to the polygon.
    ctx.save();
    trace();
    ctx.clip();
    ctx.strokeStyle = hexToRgba('#8aa0b8', active ? 0.55 : 0.32);
    ctx.lineWidth = 1;
    const step = 12 * dpr;
    ctx.beginPath();
    for (let x = minX - (maxY - minY); x < maxX; x += step) {
      ctx.moveTo(x, minY);
      ctx.lineTo(x + (maxY - minY), maxY);
    }
    ctx.stroke();
    ctx.restore();
    // Dashed outline.
    trace();
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = hexToRgba('#c8d4e2', active ? 0.95 : 0.55);
    ctx.lineWidth = active ? 2 : 1.5;
    ctx.stroke();
    ctx.restore();
    // Vertex handles on the active (unlocked) void.
    if (active && !vd.locked) {
      for (const pt of pts) {
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 5 * dpr, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffb74d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        ctx.fill(); ctx.stroke();
      }
      if (insertHandlesEnabled(p) && vd.points.length < POLY_CAPS.void)
        drawInsertHandles(ctx, view, vd.points, true);
    }
  }
  // In-progress draw preview (drawingVoidArea) — mirrors the ground-area latch.
  const dv = p.drawingVoidArea;
  if (dv?.points.length) {
    const col = '#c8d4e2';
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    ctx.beginPath();
    const a = mmToPx(view, dv.points[0].x, dv.points[0].y);
    ctx.moveTo(a.x, a.y);
    for (let i = 1; i < dv.points.length; i++) {
      const pt = mmToPx(view, dv.points[i].x, dv.points[i].y);
      ctx.lineTo(pt.x, pt.y);
    }
    if (p.cursor) {
      const c2 = mmToPx(view, p.cursor.x, p.cursor.y);
      ctx.lineTo(c2.x, c2.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    for (const v of dv.points) {
      const pt = mmToPx(view, v.x, v.y);
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 4 * dpr, 0, 2 * Math.PI);
      ctx.fillStyle = col; ctx.fill();
    }
    ctx.restore();
  }
}

function drawPresenceZones(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const states = p.hass?.states;
  for (const z of f.presenceZones ?? []) {
    if (z.hidden || z.points.length < 3) continue;
    const col = presenceZoneColor(z);
    const st = z.entity_id && states ? states[z.entity_id] : null;
    const occupied = st?.state === 'on';
    const bound = !!z.entity_id;
    const active = p.activePZoneId === z.id;
    const pts = z.points.map(v => mmToPx(view, v.x, v.y));
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = occupied ? hexToRgba(col, 0.42) : hexToRgba(col, 0.10);
    ctx.fill();
    if (occupied) {
      ctx.save();
      ctx.shadowColor = col; ctx.shadowBlur = 12;
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = hexToRgba(col, 0.8); ctx.lineWidth = active ? 2.5 : 1.5;
      if (!bound) ctx.setLineDash([6, 4]);
      ctx.stroke(); ctx.setLineDash([]);
    }
    // Label + occupancy badge at the centroid.
    const ctr = centroid(z.points);
    const cp = mmToPx(view, ctr.x, ctr.y);
    const label = z.name?.trim() || 'Zone';
    const badge = occupied ? 'occupied' : bound ? 'clear' : 'unbound';
    ctx.fillStyle = col; ctx.font = `${11 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(fixtureCaption(names, label, badge), cp.x, cp.y);
    // Vertex handles on the active (unlocked) zone.
    if (active && !z.locked) {
      for (const pt of pts) {
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 5 * dpr, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffb74d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        ctx.fill(); ctx.stroke();
      }
      if (insertHandlesEnabled(p) && z.points.length < POLY_CAPS.pzone)
        drawInsertHandles(ctx, view, z.points, true);
    }
  }
  // In-progress draw preview (drawingPresenceZone) — mirrors the wall-draw latch.
  const dz = p.drawingPresenceZone;
  if (dz?.points.length) {
    const col = '#26c6da';
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    ctx.beginPath();
    const a = mmToPx(view, dz.points[0].x, dz.points[0].y);
    ctx.moveTo(a.x, a.y);
    for (let i = 1; i < dz.points.length; i++) {
      const pt = mmToPx(view, dz.points[i].x, dz.points[i].y);
      ctx.lineTo(pt.x, pt.y);
    }
    if (p.cursor) {
      const c2 = mmToPx(view, p.cursor.x, p.cursor.y);
      ctx.lineTo(c2.x, c2.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    for (const v of dz.points) {
      const pt = mmToPx(view, v.x, v.y);
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 4 * dpr, 0, 2 * Math.PI);
      ctx.fillStyle = col; ctx.fill();
    }
    ctx.restore();
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
  const names = objectLabelsOn(p);
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

    // Name caption below when selected — a NAME, so `objectLabels` hides it.
    // The value chip itself is a READOUT and stays under the `env` layer.
    if (selected && e.label && names) {
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textBaseline = 'top';
      const tw = ctx.measureText(e.label).width + 8 * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(c.x - tw / 2, c.y + h / 2 + 3 * dpr, tw, 13 * dpr);
      ctx.fillStyle = '#fff';
      ctx.fillText(e.label, c.x, c.y + h / 2 + 5 * dpr);
    }
    drawBatteryBadge(ctx, p, e.entity_id, c.x + w / 2, c.y - h / 2);
  }
}

// Px half-extents of each info-card chip drawn last frame (for hit-testing).
export const infoCardHalfPx = new Map<string, { w: number; h: number }>();

function drawInfoCards(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const states = p.hass?.states;
  const now = new Date();
  infoCardHalfPx.clear();
  for (const ic of f.infoCards ?? []) {
    if (ic.hidden) continue;
    const c = mmToPx(view, ic.x, ic.y);
    const st = ic.entity_id && states ? states[ic.entity_id] : null;
    const text = infoCardText(ic, st ?? null, { now, imperial: p.store.imperial });
    const hit = infoCardRule(ic, st ?? null);
    const unbound = (ic.displayMode ?? 'entity') === 'entity' && !ic.entity_id;
    const unavail = !!st && (st.state === 'unavailable' || st.state === 'unknown');
    const selected = p.activeInfoId === ic.id;
    const sc = infoCardScale(ic);
    const color = hit.color ?? '#7fd4ff';
    // Flash phase: while a matched rule flags flash, pulse the text alpha.
    const flashA = hit.flash ? 0.5 + 0.5 * Math.abs(Math.sin(performance.now() / 260)) : 1;
    const label = hit.label ?? text;

    const font = `600 ${11 * sc * dpr}px system-ui, sans-serif`;
    ctx.font = font;
    const valW = ctx.measureText(label || '—').width;
    const padX = 7 * sc * dpr;
    const w = padX * 2 + valW;
    const h = 20 * sc * dpr;
    infoCardHalfPx.set(ic.id, { w: w / 2, h: h / 2 });

    // Bezel
    ctx.beginPath();
    ctx.roundRect(c.x - w / 2, c.y - h / 2, w, h, 5 * sc * dpr);
    ctx.fillStyle = 'rgba(14,18,26,0.86)';
    ctx.fill();
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeStyle = unavail ? '#c62828' : selected ? '#fff' : hexToRgba(color, 0.9);
    ctx.stroke();

    // Value text
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = unbound ? 'rgba(255,255,255,0.4)' : hexToRgba(unavail ? '#ef9a9a' : color, flashA);
    ctx.fillText(unbound ? 'unbound' : (label || '—'), c.x, c.y + 0.5 * dpr);

    // Name caption below when selected — a NAME (the card's value text above is
    // a READOUT and stays under the `info` layer).
    if (selected && ic.label && names) {
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textBaseline = 'top';
      const tw = ctx.measureText(ic.label).width + 8 * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(c.x - tw / 2, c.y + h / 2 + 3 * dpr, tw, 13 * dpr);
      ctx.fillStyle = '#fff';
      ctx.fillText(ic.label, c.x, c.y + h / 2 + 5 * dpr);
      ctx.textBaseline = 'middle';
    }
    // Mount hint tick (wall/surface/floor) — subtle, only when selected.
    if (selected) {
      ctx.font = `${8 * dpr}px sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.textBaseline = 'bottom';
      ctx.fillText(infoCardMount(ic), c.x, c.y - h / 2 - 2 * dpr);
      ctx.textBaseline = 'middle';
    }
    drawBatteryBadge(ctx, p, ic.entity_id, c.x + w / 2, c.y - h / 2);
  }
  ctx.textAlign = 'center';
}

// ── 2D floor colour + texture ───────────────────────────────────────────────
// `Scene3D.floorColor` / `floorTex` (and the per-floor `Floor.look3d` override)
// drove ONLY the 3D slab until now — the 2D plan painted a hard-coded slate
// rect, so a user who picked a wood floor saw it in one view and not the other.
//
// The 2D rendition is NOT a port of the 3D CanvasTexture: it is a cheap tiled
// pattern whose 256 px tile covers the same 800 mm the 3D material's
// `repeat = 1/800` maps, so the two read at the same physical scale. The tile
// BASE is the floor colour itself (cache key = kind + colour) with the kind's
// detail — plank seams, grout, speckle — painted over it in translucent
// black/white, so the chosen colour always reads through instead of being
// multiplied into mud the way a faithful colour × map would on a dark default.
// Deterministic (a tiny LCG, never Math.random): a cached tile must not flicker.
const FLOOR_COLOR_DEFAULT = '#101820';
const FLOOR_TEX_MM = 800;    // world mm covered by one 256 px tile (matches the 3D repeat)
const FLOOR_TILE_PX = 256;
const _floorPatCache = new Map<string, CanvasPattern | null>();

function floorPatternTile(ctx: CanvasRenderingContext2D,
                          kind: FloorTexKind, color: string): CanvasPattern | null {
  if (kind === 'none') return null;
  const key = `${kind}|${color}`;
  const hit = _floorPatCache.get(key);
  if (hit !== undefined) return hit;
  let pat: CanvasPattern | null = null;
  try {
    const c = document.createElement('canvas');
    c.width = FLOOR_TILE_PX; c.height = FLOOR_TILE_PX;
    const g = c.getContext('2d');
    if (g) {
      g.fillStyle = color;
      g.fillRect(0, 0, FLOOR_TILE_PX, FLOOR_TILE_PX);
      // Deterministic pseudo-random: the 3D builder uses Math.random, but this
      // tile is cached and re-blitted every frame — a re-seeded tile would make
      // the plan crawl on any cache miss.
      let seed = 0x9e3779b1;
      const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; };
      if (kind === 'wood') {
        // Plank bands + seam lines + a few grain streaks (3D's 32 px courses).
        for (let y = 0; y < FLOOR_TILE_PX; y += 32) {
          g.fillStyle = `rgba(0,0,0,${(0.06 + (y / 32 % 2) * 0.05).toFixed(3)})`;
          g.fillRect(0, y, FLOOR_TILE_PX, 32);
          g.strokeStyle = 'rgba(0,0,0,0.42)'; g.lineWidth = 1.5;
          g.beginPath(); g.moveTo(0, y); g.lineTo(FLOOR_TILE_PX, y); g.stroke();
          for (let i = 0; i < 4; i++) {
            g.strokeStyle = `rgba(0,0,0,${(0.08 + rnd() * 0.08).toFixed(3)})`;
            g.lineWidth = 0.8;
            const yy = y + 5 + rnd() * 22;
            g.beginPath(); g.moveTo(0, yy);
            g.bezierCurveTo(64, yy + rnd() * 4 - 2, 192, yy + rnd() * 4 - 2, FLOOR_TILE_PX, yy);
            g.stroke();
          }
        }
      } else if (kind === 'tile') {
        // 64 px grout grid + mild per-tile shade variance (mirrors the 3D tile).
        g.strokeStyle = 'rgba(0,0,0,0.38)'; g.lineWidth = 3;
        for (let i = 0; i <= FLOOR_TILE_PX; i += 64) {
          g.beginPath(); g.moveTo(i, 0); g.lineTo(i, FLOOR_TILE_PX); g.stroke();
          g.beginPath(); g.moveTo(0, i); g.lineTo(FLOOR_TILE_PX, i); g.stroke();
        }
        for (let x = 0; x < FLOOR_TILE_PX; x += 64) for (let y = 0; y < FLOOR_TILE_PX; y += 64) {
          g.fillStyle = `rgba(255,255,255,${(rnd() * 0.05).toFixed(3)})`;
          g.fillRect(x, y, 64, 64);
        }
      } else {
        // Concrete: fine two-tone speckle. Drawn as dots rather than a
        // getImageData round-trip — cheaper and works on a tainted-free tile.
        for (let i = 0; i < 2600; i++) {
          const x = rnd() * FLOOR_TILE_PX, y = rnd() * FLOOR_TILE_PX;
          const up = rnd() < 0.5;
          g.fillStyle = up ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.09)';
          g.fillRect(x, y, 1.6, 1.6);
        }
      }
      pat = ctx.createPattern(c, 'repeat');
    }
  } catch (_) { pat = null; }   // never let a texture break the frame
  _floorPatCache.set(key, pat);
  return pat;
}

// ── Shared wall-loop cache (2D) ───────────────────────────────────────────
// drawAll runs every RAF frame and FIVE painters need the current floor's
// closed wall loops (floor fill, dimensions, activity/occupancy, yard fill,
// room labels). closedWallLoops welds nodes pairwise (O(n²)) and traces faces
// — far too hot to run five times a frame on a big plan. One module-level
// single-slot cache keyed by floor id + a CHEAP linear hash of the wall
// geometry (NOT configRev: walls move live during a vertex drag, which never
// save()s until release, and the dims/labels must track that). Returned arrays
// are shared, so callers must treat them as read-only — loop ARRAY IDENTITY is
// what resolveRoomForPoint / roomsByLoop key on, and a shared cache keeps that
// identity consistent across painters within a frame.
let _loopCacheKey = '';
let _loopCacheVal: Vec2[][] = [];
function floorLoops(f: Floor): Vec2[][] {
  const walls = f.walls ?? [];
  let h = 2166136261;
  for (const w of walls) {
    const pts = w.points;
    h = Math.imul(h ^ pts.length, 16777619);
    for (const pt of pts) {
      h = Math.imul(h ^ Math.round(pt.x), 16777619);
      h = Math.imul(h ^ Math.round(pt.y), 16777619);
    }
  }
  const key = `${f.id}|${walls.length}|${h >>> 0}`;
  if (key !== _loopCacheKey) {
    _loopCacheKey = key;
    _loopCacheVal = closedWallLoops(walls);
  }
  return _loopCacheVal;
}

// `region` (px, optional) narrows the painted area — the per-room path clips to
// one loop, so filling the whole floor rect would rasterize the same pattern
// once per room. The tiling ANCHOR stays world (0,0) either way, so the grain
// runs continuously across rooms and doesn't swim while panning.
function drawFloorTexture(ctx: CanvasRenderingContext2D, view: View,
                          kind: FloorTexKind, color: string,
                          p0: { x: number; y: number }, p1: { x: number; y: number },
                          region?: { x0: number; y0: number; x1: number; y1: number }): void {
  if (kind === 'none') return;
  // One tile spans FLOOR_TEX_MM of world, so the pattern scale follows zoom.
  const k = (FLOOR_TEX_MM * view.scale) / FLOOR_TILE_PX;
  if (!isFinite(k) || k < 0.02) return;   // zoomed so far out the detail is sub-pixel
  const pat = floorPatternTile(ctx, kind, color);
  if (!pat) return;
  const rx0 = region ? region.x0 : Math.min(p0.x, p1.x);
  const ry0 = region ? region.y0 : Math.min(p0.y, p1.y);
  const rx1 = region ? region.x1 : Math.max(p0.x, p1.x);
  const ry1 = region ? region.y1 : Math.max(p0.y, p1.y);
  if (rx1 <= rx0 || ry1 <= ry0) return;
  ctx.save();
  // Anchor the tiling at world (0,0) so the grain doesn't swim while panning.
  ctx.translate(p0.x, p0.y);
  ctx.scale(k, k);
  ctx.fillStyle = pat;
  ctx.fillRect((rx0 - p0.x) / k, (ry0 - p0.y) / k, (rx1 - rx0) / k, (ry1 - ry0) / k);
  ctx.restore();
}

function drawFloor(ctx: CanvasRenderingContext2D, p: Planner, view: View,
                   bgImg: HTMLImageElement | null): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const p0 = mmToPx(view, 0, 0);
  const p1 = mmToPx(view, f.w, f.d);
  // Floor colour + texture — the SAME two fields the 3D slab reads, resolved
  // identically (per-floor look3d override wins over the global scene3d). The
  // 2D plan hard-coded '#101020' here from the beginning, so these settings
  // simply never reached this view; see floorPatternTile for the texture.
  const sc3 = p.store.scene3d;
  const floorColor = f.look3d?.floorColor ?? sc3?.floorColor ?? FLOOR_COLOR_DEFAULT;
  const floorTex = (f.look3d?.floorTex ?? sc3?.floorTex ?? 'none') as FloorTexKind;
  // FLOOR = ROOMS. When the walls trace closed loop(s) the floor colour/texture
  // paints ONLY those loops — matching 3D, where the slab has always been
  // clipped to the loops. Outside them is GROUND, not floor: it keeps the
  // canvas background (yard fill / ground areas paint over it in
  // drawGroundAreas). No loops (open-plan / wall-less floor) → the classic
  // full-rect fill, unchanged. Per-loop look: the room owning that loop may
  // override colour/texture (room → look3d → scene3d → defaults).
  const loops = floorLoops(f);
  if (loops.length) {
    const roomOfLoop = roomsByLoop(f.rooms ?? [], loops);
    for (const loop of loops) {
      if (loop.length < 3) continue;
      const look = roomFloorLook(roomOfLoop.get(loop), floorColor, floorTex);
      ctx.save();
      ctx.beginPath();
      const q0 = mmToPx(view, loop[0].x, loop[0].y);
      ctx.moveTo(q0.x, q0.y);
      let bx0 = q0.x, by0 = q0.y, bx1 = q0.x, by1 = q0.y;
      for (let i = 1; i < loop.length; i++) {
        const qi = mmToPx(view, loop[i].x, loop[i].y);
        ctx.lineTo(qi.x, qi.y);
        if (qi.x < bx0) bx0 = qi.x; if (qi.x > bx1) bx1 = qi.x;
        if (qi.y < by0) by0 = qi.y; if (qi.y > by1) by1 = qi.y;
      }
      ctx.closePath();
      ctx.fillStyle = look.color;
      ctx.fill();               // colour: the path itself, no clip needed
      ctx.clip();
      // The pattern stays world-anchored (continuous grain across rooms); the
      // clip + bbox keep the rasterization to this loop.
      drawFloorTexture(ctx, view, look.tex, look.color, p0, p1,
                       { x0: bx0, y0: by0, x1: bx1, y1: by1 });
      ctx.restore();
    }
  } else {
    ctx.fillStyle = floorColor;
    ctx.fillRect(p1.x, p1.y, p0.x - p1.x, p0.y - p1.y);
    drawFloorTexture(ctx, view, floorTex, floorColor, p0, p1);
  }
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
  const loops = floorLoops(f);
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const rm of rooms) {
    // A room bound to an HA area shows the area's name when nothing was typed.
    const { text, placeholder } = roomLabel(rm, p.roomAreaName(rm));
    const loop = loopContaining(loops, rm.anchor.x, rm.anchor.y);
    if (loop) {
      // The label sits AT THE ANCHOR — the point the user clicked when placing
      // the room (and can drag). The loop centroid was the old position; it
      // ignored the user's intent and drifted with every wall edit. The room ↔
      // loop pairing is unchanged (the anchor still picks the loop), so the
      // heat-map label, occupancy glow and activity zones (all loop-keyed) are
      // untouched. Placeholder (unnamed) rooms draw italic + dimmer.
      const px = mmToPx(view, rm.anchor.x, rm.anchor.y);
      ctx.fillStyle = placeholder ? 'rgba(207,216,230,0.32)' : 'rgba(207,216,230,0.5)';
      ctx.font = `${placeholder ? 'italic ' : ''}600 ${11 * dpr}px sans-serif`;
      const label = text.toUpperCase();
      ctx.fillText(label, px.x, px.y);
      // Publish px half-extents so the label itself becomes a drag target
      // (the envChipHalfPx idiom — world anchor + screen extent).
      const tw = ctx.measureText(label).width;
      roomLabelHalfPx.set(rm.id, {
        w: Math.max(tw / 2 + 6 * dpr, 14 * dpr), h: 9 * dpr,
      });
    } else {
      // No enclosing loop: amber marker at the anchor itself so the user can
      // see the room exists but its walls don't close around it.
      const px = mmToPx(view, rm.anchor.x, rm.anchor.y);
      ctx.fillStyle = 'rgba(255,183,77,0.8)';
      ctx.font = `${placeholder ? 'italic ' : ''}600 ${11 * dpr}px sans-serif`;
      const warn = `⚠ ${text.toUpperCase()}`;
      ctx.fillText(warn, px.x, px.y);
      ctx.fillStyle = 'rgba(255,183,77,0.55)';
      ctx.font = `${9 * dpr}px sans-serif`;
      ctx.fillText('not enclosed by walls', px.x, px.y + 12 * dpr);
      // The un-enclosed marker is draggable too (that IS how you fix it).
      ctx.font = `${placeholder ? 'italic ' : ''}600 ${11 * dpr}px sans-serif`;
      const tw = ctx.measureText(warn).width;
      roomLabelHalfPx.set(rm.id, {
        w: Math.max(tw / 2 + 6 * dpr, 14 * dpr), h: 9 * dpr,
      });
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
    }
    else if (kind === 'fence_picket') { ctx.strokeStyle = '#b98a52'; ctx.lineWidth = Math.max(3, wallW * 0.35); }
    else if (kind === 'fence_privacy') { ctx.strokeStyle = '#9c7248'; ctx.lineWidth = wallW; }
    else if (kind === 'fence_chainlink') { ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = Math.max(2, wallW * 0.25); }
    else if (kind === 'hedge') { ctx.strokeStyle = '#3a6a2c'; ctx.lineWidth = wallW * 1.1; }
    else { ctx.strokeStyle = '#bfc9d6'; ctx.lineWidth = wallW; }
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
      // A run's decorative marks must respect the SAME cut intervals the base
      // stroke does — running the balusters / pickets / mesh hatch through a
      // gate's span made the gap invisible (the line broke, the slats didn't).
      const inSolid = (t: number) => solids.some(sv => t >= sv.t0 && t <= sv.t1);
      // Railings get baluster tick marks across the line.
      if (kind === 'railing') {
        const tickHalf = Math.max(3, wallW * 0.45);
        const nx = -uy, ny = ux;
        for (let t = 400; t < L; t += 500) {
          if (!inSolid(t)) continue;
          const c1 = mmToPx(view, A.x + ux * t + nx * 0, A.y + uy * t);
          ctx.beginPath();
          ctx.moveTo(c1.x - ny * tickHalf, c1.y - nx * tickHalf);
          ctx.lineTo(c1.x + ny * tickHalf, c1.y + nx * tickHalf);
          ctx.stroke();
        }
      }
      // Picket fence: dense pale tick marks (denser than railing) → the "slats".
      if (kind === 'fence_picket') {
        const tickHalf = Math.max(2, wallW * 0.3);
        const nx = -uy, ny = ux;
        ctx.lineWidth = Math.max(1, wallW * 0.15);
        for (let t = 100; t < L; t += 160) {
          if (!inSolid(t)) continue;
          const c1 = mmToPx(view, A.x + ux * t, A.y + uy * t);
          ctx.beginPath();
          ctx.moveTo(c1.x - ny * tickHalf, c1.y - nx * tickHalf);
          ctx.lineTo(c1.x + ny * tickHalf, c1.y + nx * tickHalf);
          ctx.stroke();
        }
        ctx.lineWidth = Math.max(3, wallW * 0.35);
      }
      // Chain-link: a fine cross-hatch (small X marks) → wire mesh.
      if (kind === 'fence_chainlink') {
        const pA = mmToPx(view, A.x, A.y), pB = mmToPx(view, B.x, B.y);
        const pdx = pB.x - pA.x, pdy = pB.y - pA.y, pl = Math.hypot(pdx, pdy) || 1;
        const sux = pdx / pl, suy = pdy / pl;     // along-wall (pixels)
        const snx = -suy, sny = sux;              // perpendicular (pixels)
        const h = Math.max(2, wallW * 0.35);
        ctx.lineWidth = 1;
        // Sample every 180 mm; draw an X (two crossed short diagonals).
        for (let t = 90; t < L; t += 180) {
          if (!inSolid(t)) continue;
          const c1 = mmToPx(view, A.x + ux * t, A.y + uy * t);
          const d1x = (sux + snx) * h * 0.5, d1y = (suy + sny) * h * 0.5;
          const d2x = (sux - snx) * h * 0.5, d2y = (suy - sny) * h * 0.5;
          ctx.beginPath();
          ctx.moveTo(c1.x - d1x, c1.y - d1y); ctx.lineTo(c1.x + d1x, c1.y + d1y);
          ctx.moveTo(c1.x - d2x, c1.y - d2y); ctx.lineTo(c1.x + d2x, c1.y + d2y);
          ctx.stroke();
        }
        ctx.lineWidth = Math.max(2, wallW * 0.25);
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
      // Midpoint insert ghosts. A wall is an OPEN polyline (N points → N−1
      // edges) and has no "selected wall" concept — its vertex anchors already
      // show on every unlocked wall, so the inserts follow the same rule (and
      // are edit+Select only, so kiosk/view stay clean).
      if (insertHandlesEnabled(p)) drawInsertHandles(ctx, view, w.points, false);
    }
    // (Wall-vertex drag length chips moved to the single live-dimension site —
    // see liveDimChips / drawLiveDims at the end of drawAll.)
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

// Onion-skin reference underlay: every OTHER floor flagged `peek2d && !disabled`
// draws its wall polylines as thin muted ghost strokes in the SAME world
// coordinates (stacked stories register when dims match — no transform), plus a
// dim name tag near the floor's wall bbox. Structure outline only (no doors /
// windows / furniture in v1). Cheap per-frame loop; the RAF redraws each frame.
// Neighborhood overlay (OpenFreeMap) — a muted, non-interactive backdrop drawn
// early (after bg, before ground). Buildings = thin dim outlines + faint fill;
// roads = thin grey centerlines at their real width (px-clamped); water =
// translucent fill; landuse skipped in 2D v1. Exclusion masks (edit mode only)
// draw dashed-dim with vertex dots so the clip regions are visible while
// authoring. Same visual weight as drawPeekFloors — context, not content.
function drawNeighborhood(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const data = p.neighborhoodData;
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (data) {
    const cfg = p.store.neighborhood;
    // Water first (lowest), then buildings, then roads on top.
    ctx.fillStyle = hexToRgba(cfg?.colorWater ?? '#3d7bb8', 0.28);
    for (const w of data.water) {
      if (w.points.length < 3) continue;
      ctx.beginPath();
      const a = mmToPx(view, w.points[0].x, w.points[0].y);
      ctx.moveTo(a.x, a.y);
      for (let i = 1; i < w.points.length; i++) { const pt = mmToPx(view, w.points[i].x, w.points[i].y); ctx.lineTo(pt.x, pt.y); }
      ctx.closePath(); ctx.fill();
    }
    // Buildings: faint fill + thin outline.
    const bCol = cfg?.colorBuildings ?? '#9aa2ab';
    ctx.lineWidth = 1 * dpr;
    for (const b of data.buildings) {
      if (b.points.length < 3) continue;
      ctx.beginPath();
      const a = mmToPx(view, b.points[0].x, b.points[0].y);
      ctx.moveTo(a.x, a.y);
      for (let i = 1; i < b.points.length; i++) { const pt = mmToPx(view, b.points[i].x, b.points[i].y); ctx.lineTo(pt.x, pt.y); }
      ctx.closePath();
      ctx.fillStyle = hexToRgba(bCol, 0.10); ctx.fill();
      ctx.strokeStyle = hexToRgba(bCol, 0.45); ctx.stroke();
    }
    // Roads: thin grey centerlines, width scaled to the real mm (px-clamped).
    const rCol = cfg?.colorRoads ?? '#6b7078';
    for (const road of data.roads) {
      if (road.points.length < 2) continue;
      ctx.strokeStyle = hexToRgba(rCol, 0.5);
      ctx.lineWidth = Math.max(1 * dpr, Math.min(10 * dpr, road.widthMm * view.scale));
      ctx.beginPath();
      const a = mmToPx(view, road.points[0].x, road.points[0].y);
      ctx.moveTo(a.x, a.y);
      for (let i = 1; i < road.points.length; i++) { const pt = mmToPx(view, road.points[i].x, road.points[i].y); ctx.lineTo(pt.x, pt.y); }
      ctx.stroke();
    }
  }
  // Exclusion masks — edit mode only. Dashed red outline + vertex dots (both
  // committed polygons and the in-progress draw latch).
  if (p.uiMode === 'edit') {
    const excls = p.store.neighborhood?.exclusions ?? [];
    ctx.setLineDash([5 * dpr, 4 * dpr]);
    ctx.strokeStyle = 'rgba(255,82,82,0.7)';
    ctx.lineWidth = 1.5 * dpr;
    for (const poly of excls) {
      if (poly.length < 2) continue;
      ctx.beginPath();
      const a = mmToPx(view, poly[0].x, poly[0].y);
      ctx.moveTo(a.x, a.y);
      for (let i = 1; i < poly.length; i++) { const pt = mmToPx(view, poly[i].x, poly[i].y); ctx.lineTo(pt.x, pt.y); }
      ctx.closePath(); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,82,82,0.85)';
      for (const v of poly) { const pt = mmToPx(view, v.x, v.y); ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.5 * dpr, 0, Math.PI * 2); ctx.fill(); }
      ctx.setLineDash([5 * dpr, 4 * dpr]);
    }
    // In-progress draw latch: open polyline + vertex dots.
    const drawing = p.drawingExclusion;
    if (drawing && drawing.points.length) {
      ctx.strokeStyle = 'rgba(255,138,128,0.9)';
      ctx.beginPath();
      const a = mmToPx(view, drawing.points[0].x, drawing.points[0].y);
      ctx.moveTo(a.x, a.y);
      for (let i = 1; i < drawing.points.length; i++) { const pt = mmToPx(view, drawing.points[i].x, drawing.points[i].y); ctx.lineTo(pt.x, pt.y); }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,138,128,0.95)';
      for (const v of drawing.points) { const pt = mmToPx(view, v.x, v.y); ctx.beginPath(); ctx.arc(pt.x, pt.y, 3 * dpr, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawPeekFloors(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const peeks = peekFloors(p.store.floors, p.store.currentFloorId);
  if (!peeks.length) return;
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const f of peeks) {
    ctx.strokeStyle = 'rgba(148,163,184,0.35)';
    ctx.lineWidth = 1.5 * dpr;
    ctx.setLineDash([6 * dpr, 4 * dpr]);
    for (const w of f.walls) {
      if (w.points.length < 2) continue;
      ctx.beginPath();
      const a = mmToPx(view, w.points[0].x, w.points[0].y);
      ctx.moveTo(a.x, a.y);
      for (let i = 1; i < w.points.length; i++) {
        const pt = mmToPx(view, w.points[i].x, w.points[i].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }
    // Dim name tag near the top-left corner of this floor's wall bbox.
    const ext = structureExtents(f.walls);
    if (ext) {
      const tag = mmToPx(view, ext.minX, ext.maxY);   // world +Y is screen-up → maxY is the top
      ctx.setLineDash([]);
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(148,163,184,0.75)';
      ctx.fillText(f.name, tag.x + 2 * dpr, tag.y - 2 * dpr);
    }
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function drawDoors(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const status = openingStatusOn(p);
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  if (!f.doors) return;
  for (const d of f.doors) {
    const st = p.effectiveState(d);
    // Fractional open (0..1): binary → 0|1; a cover binding gives partial.
    const frac = doorOpenFraction(st);
    const isOpen = frac > 0.02;
    const unavail = st && (st.state === 'unavailable' || st.state === 'unknown');
    const closedColor = unavail ? '#c62828' : '#90a4ae';
    const openColor = '#66bb6a';
    const color = isOpen ? openColor : closedColor;
    const hinge = mmToPx(view, d.x, d.y);
    const kind = d.kind ?? 'swing';
    // Closed span endpoint (px) + its vector — every kind's plan glyph is laid
    // out along it. `dir` (+1 default) is the SLIDE side in the door's own
    // frame: the panel retracts toward the (x, y) hinge end, i.e. along −v.
    const spanEnd = doorEndpoint(d);
    const sep = mmToPx(view, spanEnd.x, spanEnd.y);
    const vX = sep.x - hinge.x, vY = sep.y - hinge.y;
    const dir = doorSlideDir(d);
    const at = (t: number) => ({ x: hinge.x + vX * t, y: hinge.y + vY * t });
    const vLen = Math.hypot(vX, vY) || 1;
    const pX = -vY / vLen, pY = vX / vLen;           // unit perpendicular (px)
    const line = (ax: number, ay: number, bx: number, by: number) => {
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    };
    // "Where the closed panel belongs" hint — drawn whenever the door is OPEN so
    // the user can see (and click) the closed position to shut it (hitDoor
    // accepts the closed span for exactly this reason). Dimmed grey dashes,
    // painted BEFORE the live panel so the panel wins wherever they overlap.
    const closedHint = (ax: number, ay: number, bx: number, by: number) => {
      if (!isOpen) return;
      ctx.strokeStyle = 'rgba(144,164,174,0.55)'; ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]); line(ax, ay, bx, by); ctx.setLineDash([]);
    };
    // Endpoint handle (drag to rotate) — hidden when locked.
    const endHandle = (px: { x: number; y: number }) => {
      if (d.locked) return;
      ctx.fillStyle = '#ffb74d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(px.x, px.y, 5 * dpr, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    };
    // Lock-state padlock near the hinge (+ low-battery badge). Same click target
    // as the swing door (hitDoorLock); garage doors deliberately draw none.
    const lockGlyph = () => {
      if (!d.lockEntity && !d.lockLocalState) return;
      const lst = p.doorLockState(d);
      drawPadlock(ctx, hinge.x - 9 * dpr, hinge.y - 11 * dpr, 5 * dpr, lst, d.lockControl === 'display');
      if (d.lockEntity) drawBatteryBadge(ctx, p, d.lockEntity, hinge.x + 9 * dpr, hinge.y - 11 * dpr);
    };
    // Label + state pill at a given anchor. `pct` kinds report a percentage
    // while partially open (fraction-driven glyphs); the rest say OPEN/closed.
    const pill = (ax: number, ay: number, fallback: string, pct: boolean) => {
      const pctN = Math.round(frac * 100);
      const stateStr = !st ? ''
        : isOpen ? (pct ? (pctN >= 99 ? 'OPEN' : `${pctN}%`) : 'OPEN') : 'closed';
      const txt = fixtureCaption(names, d.label?.trim() || fallback, stateStr, status);
      if (!txt) return;
      ctx.font = `${10 * dpr}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const tw = ctx.measureText(txt).width + 8 * dpr;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(ax - tw / 2, ay - 7 * dpr, tw, 14 * dpr);
      ctx.fillStyle = isOpen ? openColor : '#cfd8dc';
      ctx.fillText(txt, ax, ay);
    };

    // Garage door: no swing arc — a dashed line across the opening (hinge →
    // endpoint along rotation) that RETRACTS toward the hinge as it opens (the
    // drawn length is the still-closed fraction). Segments vanish as it rolls up.
    if (kind === 'garage') {
      const covered = 1 - frac;                     // still-covering fraction
      const c = at(covered);
      // Full-span guide (the opening extent). Once OPEN it becomes the shared
      // dimmed-dash "closed position" hint rather than a second faint line.
      if (isOpen) closedHint(hinge.x, hinge.y, sep.x, sep.y);
      else {
        ctx.strokeStyle = 'rgba(144,164,174,0.30)'; ctx.lineWidth = 1;
        line(hinge.x, hinge.y, sep.x, sep.y);
      }
      // The closed portion as a dashed panel.
      if (covered > 0.01) {
        ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.setLineDash([7, 5]);
        line(hinge.x, hinge.y, c.x, c.y);
        ctx.setLineDash([]);
      }
      endHandle(sep);
      pill((hinge.x + sep.x) / 2, (hinge.y + sep.y) / 2 - 12 * dpr, 'Garage', true);
      continue;
    }

    // ── Sliding family: the slab TRANSLATES along the span ──────────────────
    // px displacement = −dir·frac·v (local +X, the retract direction, points
    // from the endpoint back toward the hinge).
    if (kind === 'sliding' || kind === 'pocket' || kind === 'sliding_glass') {
      const shift = -dir * frac;
      // Track / guide: the opening span, plus (barn slide) the parking run the
      // slab retracts over. Open → the span reads as the dashed closed hint.
      ctx.strokeStyle = 'rgba(144,164,174,0.28)'; ctx.lineWidth = 1;
      if (kind === 'sliding') {
        const t0 = at(dir > 0 ? -1 : 0), t1 = at(dir > 0 ? 1 : 2);
        line(t0.x, t0.y, t1.x, t1.y);
      }
      if (isOpen) closedHint(hinge.x, hinge.y, sep.x, sep.y);
      else { ctx.strokeStyle = 'rgba(144,164,174,0.30)'; line(hinge.x, hinge.y, sep.x, sep.y); }

      if (kind === 'sliding_glass') {
        // Two parallel thin panes: one FIXED on the stack side, one sliding
        // behind it (drawn on the other side of the centreline so they read).
        const pwT = 0.5 + 60 / Math.max(1, d.w);   // pane length as a span fraction
        const travelT = 1 - pwT;
        const fixed0 = dir > 0 ? 0 : 1 - pwT;
        const move0 = (dir > 0 ? 1 - pwT : 0) + shift * travelT;
        const glassTint = isOpen ? openColor : (unavail ? '#c62828' : '#9fb8c6');
        const paneLine = (t0: number, off: number, w2: number) => {
          const a = at(t0), b = at(t0 + pwT);
          ctx.strokeStyle = glassTint; ctx.lineWidth = w2;
          line(a.x + pX * off, a.y + pY * off, b.x + pX * off, b.y + pY * off);
        };
        paneLine(fixed0, 2.6 * dpr, 3);
        paneLine(move0, -2.6 * dpr, 4);
        // Leading-stile tick on the moving pane.
        const lead = at(move0 + (dir > 0 ? 0 : pwT));
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        line(lead.x - pX * 5 * dpr, lead.y - pY * 5 * dpr,
             lead.x + pX * 5 * dpr, lead.y + pY * 5 * dpr);
      } else {
        // Solid slab, offset one line-width to the panel side. A pocket slab
        // dims where it has slid PAST the mouth (into the wall cavity).
        const off = (kind === 'pocket' ? 0 : 3.5 * dpr);
        const s0 = shift, s1 = shift + 1;
        const seg = (t0: number, t1: number, style: string, w2: number, dash: number[]) => {
          if (t1 - t0 < 0.01) return;
          const a = at(t0), b = at(t1);
          ctx.strokeStyle = style; ctx.lineWidth = w2; ctx.setLineDash(dash);
          line(a.x + pX * off, a.y + pY * off, b.x + pX * off, b.y + pY * off);
          ctx.setLineDash([]);
        };
        if (kind === 'pocket') {
          // Cavity hint: a short dashed run beyond the mouth (where the slab goes).
          const m0 = dir > 0 ? 0 : 1, m1 = dir > 0 ? -0.85 : 1.85;
          const a = at(m0), b = at(m1);
          ctx.strokeStyle = 'rgba(144,164,174,0.30)'; ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          line(a.x + pX * 4 * dpr, a.y + pY * 4 * dpr, b.x + pX * 4 * dpr, b.y + pY * 4 * dpr);
          line(a.x - pX * 4 * dpr, a.y - pY * 4 * dpr, b.x - pX * 4 * dpr, b.y - pY * 4 * dpr);
          ctx.setLineDash([]);
          // In-opening portion solid; retracted portion dimmed.
          seg(Math.max(s0, 0), Math.min(s1, 1), color, 5, []);
          if (s0 < 0) seg(s0, 0, 'rgba(144,164,174,0.35)', 4, [4, 3]);
          if (s1 > 1) seg(1, s1, 'rgba(144,164,174,0.35)', 4, [4, 3]);
        } else {
          seg(s0, s1, color, 5, []);
        }
        // Leading-edge tick (the edge the slab travels toward).
        const lead = at(dir > 0 ? s0 : s1);
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        line(lead.x + pX * (off - 5 * dpr), lead.y + pY * (off - 5 * dpr),
             lead.x + pX * (off + 5 * dpr), lead.y + pY * (off + 5 * dpr));
      }
      lockGlyph();
      endHandle(sep);
      pill((hinge.x + sep.x) / 2, (hinge.y + sep.y) / 2 - 12 * dpr,
           kind === 'pocket' ? 'Pocket' : kind === 'sliding' ? 'Sliding' : 'Sliding glass', true);
      continue;
    }

    // ── Double / french: two mirrored quarter arcs ──────────────────────────
    // Leaf A hinges at (x, y) and swings like a RIGHT-hand door (canvas delta
    // −90°); leaf B hinges at the span endpoint, its closed panel points back
    // toward the centre (canvas angle rotation+180) and it swings +90° so both
    // leaves end up on the SAME side. Same signed-sweep arc technique as the
    // single swing door (anticlockwise flag from the delta's sign).
    if (kind === 'double' || kind === 'french') {
      const mid = at(0.5);
      const rPx = (d.w / 2) * view.scale;
      // Rotate a point about a pivot by `deg` in CANVAS space (y-down ⇒ the
      // standard matrix turns clockwise on screen, matching arc's angle sense).
      const rotAbout = (hx: number, hy: number, ex: number, ey: number, deg: number) => {
        const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
        const ddx = ex - hx, ddy = ey - hy;
        return { x: hx + ddx * c - ddy * s, y: hy + ddx * s + ddy * c };
      };
      const leaf = (piv: { x: number; y: number }, deltaDeg: number) => {
        const closedA = Math.atan2(mid.y - piv.y, mid.x - piv.x);
        const openA = closedA + deltaDeg * Math.PI / 180;
        ctx.strokeStyle = 'rgba(144,164,174,0.35)';
        ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(piv.x, piv.y, rPx, closedA, openA, deltaDeg < 0);
        ctx.stroke(); ctx.setLineDash([]);
        // Closed-position hint under the live panel (click here to shut it).
        closedHint(piv.x, piv.y, mid.x, mid.y);
        const tip = isOpen ? rotAbout(piv.x, piv.y, mid.x, mid.y, deltaDeg * frac) : mid;
        ctx.strokeStyle = color; ctx.lineWidth = 4;
        line(piv.x, piv.y, tip.x, tip.y);
        // French leaves are glazed: two short cross-ticks near the leaf middle.
        if (kind === 'french') {
          const mx = (piv.x + tip.x) / 2, my = (piv.y + tip.y) / 2;
          const ux = (tip.x - piv.x) / (Math.hypot(tip.x - piv.x, tip.y - piv.y) || 1);
          const uy = (tip.y - piv.y) / (Math.hypot(tip.x - piv.x, tip.y - piv.y) || 1);
          ctx.strokeStyle = 'rgba(187,222,251,0.7)'; ctx.lineWidth = 1.5;
          for (const s of [-4 * dpr, 4 * dpr]) {
            const cx2 = mx + ux * s, cy2 = my + uy * s;
            line(cx2 - uy * 4 * dpr, cy2 + ux * 4 * dpr, cx2 + uy * 4 * dpr, cy2 - ux * 4 * dpr);
          }
        }
        // Pivot marker.
        ctx.fillStyle = color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(piv.x, piv.y, 4 * dpr, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      };
      leaf(hinge, -90);
      leaf(sep, +90);
      lockGlyph();
      endHandle(sep);
      pill(mid.x, mid.y - 12 * dpr, kind === 'french' ? 'French' : 'Double', false);
      continue;
    }
    // Closed end: along rotation. Open end: rotation + doorOpenDeltaDeg
    // (left-hinge = +90° canvas-CW; right-hinge = -90° canvas-CCW).
    const openDelta = doorOpenDeltaDeg(d);
    const closedEnd = doorEndpoint(d);
    const openEnd = doorEndpoint(d, openDelta);
    const cep = mmToPx(view, closedEnd.x, closedEnd.y);
    const oep = mmToPx(view, openEnd.x, openEnd.y);
    // Faded swing arc between closed and open. `openDelta` is world screen-CW
    // degrees, and a doorEndpoint offset lands at CANVAS angle +rotation
    // (world (cos r, −sin r) → canvas (cos r, +sin r) through mmToCanvas's
    // y-flip) — so the canvas delta is `+openDelta`, the SAME sign, ending
    // exactly at `oep`. (The old `−openDelta` mirrored the dashed hint to the
    // wrong side of the panel — user-reported.) Sweep the SIGNED 90° from the
    // closed panel with the anticlockwise flag rather than min→max endpoints:
    // min/max drew the long 270° way round whenever the two angles straddled
    // the atan2 ±π seam.
    const rPx = d.w * view.scale;
    const closedA = Math.atan2(cep.y - hinge.y, cep.x - hinge.x);
    const openA = closedA + openDelta * Math.PI / 180;
    ctx.strokeStyle = 'rgba(144,164,174,0.35)';
    ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(hinge.x, hinge.y, rPx, closedA, openA, openDelta < 0);
    ctx.stroke(); ctx.setLineDash([]);
    // Closed-position hint: while OPEN, dash in the panel's closed span so the
    // user can see (and click — hitDoor accepts it) where to shut the door.
    closedHint(hinge.x, hinge.y, cep.x, cep.y);
    // Active panel
    const endPt = isOpen ? oep : cep;
    ctx.strokeStyle = color; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(hinge.x, hinge.y); ctx.lineTo(endPt.x, endPt.y); ctx.stroke();
    // Hinge marker
    ctx.fillStyle = color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(hinge.x, hinge.y, 5 * dpr, 0, 2 * Math.PI);
    ctx.fill(); ctx.stroke();
    // Lock-state padlock near the hinge, offset so it clears the hinge dot +
    // swing arc. Clickable: toggles lock.lock/unlock (bound) or lockLocalState
    // (unbound). State resolves from the bound entity OR the local flag.
    if (d.lockEntity || d.lockLocalState) {
      const lst = p.doorLockState(d);
      drawPadlock(ctx, hinge.x - 9 * dpr, hinge.y - 11 * dpr, 5 * dpr, lst, d.lockControl === 'display');
      // Low-battery badge for the lock (locks are commonly battery-powered).
      if (d.lockEntity) drawBatteryBadge(ctx, p, d.lockEntity, hinge.x + 9 * dpr, hinge.y - 11 * dpr);
    }
    // Endpoint handle (drag to rotate) — hidden when locked
    if (!d.locked) {
      ctx.fillStyle = '#ffb74d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(endPt.x, endPt.y, 5 * dpr, 0, 2 * Math.PI);
      ctx.fill(); ctx.stroke();
    }
    // Label + state pill
    const pillX = (hinge.x + endPt.x) / 2;
    const pillY = (hinge.y + endPt.y) / 2 - 12 * dpr;
    const txt = fixtureCaption(names, d.label?.trim() || 'Door',
                               st ? (isOpen ? 'OPEN' : 'closed') : '', status);
    if (!txt) continue;
    ctx.font = `${10 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(txt).width + 8 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(pillX - tw / 2, pillY - 7 * dpr, tw, 14 * dpr);
    ctx.fillStyle = isOpen ? openColor : '#cfd8dc';
    ctx.fillText(txt, pillX, pillY);
  }
}

// Doorbell transient ring pulses (the generic flash-then-decay primitive). For
// each ring younger than ~4 s, draw 2–3 expanding, fading circles + a 🔔 glyph at
// the door's span centre. Time-based off Planner.doorbellRings[].at (Date.now()
// ms); RAF-driven so it animates for free.
function drawDoorbellPulses(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const rings = p.doorbellRings;
  if (!rings.length) return;
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const now = Date.now();
  for (const ring of rings) {
    const age = (now - ring.at) / 1000;
    if (age > 4) continue;
    const d = f.doors.find(x => x.id === ring.doorId);
    if (!d) continue;
    const c = doorSpanCenter(d);
    const cp = mmToPx(view, c.x, c.y);
    for (let i = 0; i < 3; i++) {
      const a = age - i * 0.45;
      if (a < 0 || a > 1.4) continue;
      const t = a / 1.4;
      const rad = (10 + t * 42) * dpr;
      ctx.strokeStyle = `rgba(255,213,79,${(1 - t) * 0.85})`;
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath(); ctx.arc(cp.x, cp.y, rad, 0, 2 * Math.PI); ctx.stroke();
    }
    if (age < 3.5) {
      ctx.font = `${16 * dpr}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = Math.max(0, 1 - age / 3.5);
      ctx.fillText('🔔', cp.x, cp.y - 2 * dpr);
      ctx.globalAlpha = 1;
    }
  }
}

function drawWindows(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const names = objectLabelsOn(p);
  const status = openingStatusOn(p);
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  if (!f.windows) return;
  // Bay windows need the closed wall loops to resolve which side is exterior.
  // Computed at most ONCE per frame, and only when a bay is actually present.
  let bayLoops: Vec2[][] | null = null;
  const loopsForBay = () => (bayLoops ??= floorLoops(f));
  for (const w of f.windows) {
    const st = p.effectiveState(w);
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
    // ── Bay: a protruding trapezoid notch OUTSIDE the wall line ─────────────
    // Same plan the 3D builder extrudes (bayPlan) on the same exterior side
    // (bayProjectSign), so the plan symbol and the model can never disagree.
    if (isBayWindowKind(w.kind)) {
      const sgn = bayProjectSign(w, loopsForBay());
      const plan = bayPlan(w.w);
      const th = (w.rotation || 0) * Math.PI / 180;
      // World along-wall unit (a→b) and the local +Z world normal (sin θ, cos θ).
      const aux = Math.cos(th), auy = -Math.sin(th);
      const nx = Math.sin(th) * sgn, ny = Math.cos(th) * sgn;
      const pt = (along: number, out: number) =>
        mmToPx(view, w.x + aux * along + nx * out, w.y + auy * along + ny * out);
      const c0 = pt(-w.w / 2, 0), c1 = pt(-plan.centerW / 2, plan.depth);
      const c2 = pt(plan.centerW / 2, plan.depth), c3 = pt(w.w / 2, 0);
      ctx.beginPath();
      ctx.moveTo(c0.x, c0.y); ctx.lineTo(c1.x, c1.y);
      ctx.lineTo(c2.x, c2.y); ctx.lineTo(c3.x, c3.y);
      ctx.fillStyle = isOpen ? 'rgba(102,187,106,0.14)' : 'rgba(100,181,246,0.14)';
      ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.stroke();
      // bay_bench: a cushion bar across the projection, inside the notch.
      if (w.kind === 'bay_bench') {
        const b0 = pt(-plan.centerW / 2 * 0.92, plan.depth * 0.45);
        const b1 = pt(plan.centerW / 2 * 0.92, plan.depth * 0.45);
        ctx.strokeStyle = 'rgba(201,143,116,0.95)';
        ctx.lineWidth = Math.max(3, 140 * view.scale);
        ctx.beginPath(); ctx.moveTo(b0.x, b0.y); ctx.lineTo(b1.x, b1.y); ctx.stroke();
      }
    }
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
    // Blind / shade indicator (Window.coverEntity): a thin parallel line offset
    // just inside the pane whose drawn length reflects how CLOSED the shade is
    // (1 − coverFraction; full span = fully down). Subtle — windows are thin in plan.
    if (w.coverEntity) {
      const cst = p.hass?.states?.[w.coverEntity] ?? null;
      const closed = 1 - doorOpenFraction(cst);   // 0 open (up) … 1 closed (down)
      if (closed > 0.01) {
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;       // perpendicular unit (screen)
        const off = 4 * dpr;                        // inset toward +perp
        const ex = a.x + dx * closed, ey = a.y + dy * closed;
        ctx.strokeStyle = 'rgba(205,196,180,0.9)'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(a.x + nx * off, a.y + ny * off);
        ctx.lineTo(ex + nx * off, ey + ny * off);
        ctx.stroke();
      }
    }
    // Interior curtain tick (Window.curtain): a thin line along the interior side
    // of the span in the fabric color — SOLID when closed (covering), DASHED when
    // open (gathered aside). Openness from the bound entity or the curtainPos slider.
    if (w.curtain) {
      const cn = w.curtain;
      const frac = cn.entityId
        ? doorOpenFraction(p.hass?.states?.[cn.entityId] ?? null)
        : Math.max(0, Math.min(1, (w.curtainPos ?? 0) / 100));
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;     // perpendicular unit (screen)
      const off = 8 * dpr;                      // interior side, outside the blind tick
      ctx.strokeStyle = cn.color ?? '#b9a58c'; ctx.lineWidth = 3;
      if (frac > 0.5) ctx.setLineDash([6, 5]);  // open (gathered) → dashed
      ctx.beginPath();
      ctx.moveTo(a.x + nx * off, a.y + ny * off);
      ctx.lineTo(b.x + nx * off, b.y + ny * off);
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
    const txt = fixtureCaption(names, w.label?.trim() || 'Window',
                               st ? (isOpen ? 'OPEN' : 'closed') : '', status);
    if (!txt) continue;
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

function drawFurniture(ctx: CanvasRenderingContext2D, p: Planner, view: View,
                       showFurniture = true, showAppliances = true): void {
  const f = p.floor();
  const names = objectLabelsOn(p);
  const customObjects = p.store.customObjects;
  const isEdit = p.uiMode === 'edit';
  const dpr = window.devicePixelRatio || 1;
  const now = performance.now() / 1000;
  const curFloorIdx = p.store.floors.indexOf(f);
  for (const piece of f.furniture) {
    const center = mmToPx(view, piece.x, piece.y);
    const halfW = (piece.w / 2) * view.scale;
    const halfH = (piece.h / 2) * view.scale;
    const rotR = (piece.rotation || 0) * Math.PI / 180;  // ctx.rotate is screen-CW, matching our convention
    // Appliance in-use indicator (Feature 1): effective on/off (bound entity or
    // unbound localState) + a fridge's bound door sensor. Applies to all
    // appliance-category kinds incl. TVs (which have no other 2D on-state).
    const fdef = resolveFurnitureDef(piece, customObjects);
    const isAppliance = (fdef.cat ?? 'furniture') === 'appliance';
    // Appliances ride their own layer; everything else the furniture layer.
    if (isAppliance ? !showAppliances : !showFurniture) continue;
    // Curbside bins carry a full/empty visual off their effective state.
    const binFull = isBinKind(piece.kind) && binStateIsFull(p.effectiveState(piece)?.state);
    // Garage-bay vehicle: a BOUND car whose presence sensor isn't 'on' renders
    // GHOSTED (empty bay, dim dashed outline). Unbound cars are always solid.
    const vehicleGhost = isVehicleKind(piece.kind) && !!piece.entity_id &&
      p.effectiveState(piece)?.state !== 'on';
    const appSt = isAppliance ? p.effectiveState(piece) : null;
    const stateOn = appSt?.state === 'on' || appSt?.state === 'playing';
    // Per-device power glow (#8): a bound power sensor scales the in-use glow/LED;
    // an UNBOUND appliance reading > 10 W counts as in-use (visual only — power
    // never feeds effectiveState/activities).
    const powerW = isAppliance && piece.powerEntity && p.hass?.states
      ? parseFloat(p.hass.states[piece.powerEntity]?.state ?? '') : NaN;
    const powerInUse = !piece.entity_id && isFinite(powerW) && powerW > 10;
    // Climate/airflow appliances: RUNNING (green glow/LED) resolved from the HVAC
    // mode/action or an 'on' state — a climate.* unit in 'cool'/'heat' never reads
    // 'on', so the generic appliance on-check misses it. towel_warmer is bathroom-
    // cat (isAppliance false) but still shows the run glow (the gate is widened).
    const climateHeater = piece.kind === 'space_heater' || piece.kind === 'wall_heater' || piece.kind === 'towel_warmer';
    const climateOn = isClimateApplianceKind(piece.kind) &&
      climateApplianceRun(p.effectiveState(piece), climateHeater ? 'heat' : 'cool').running;
    // Mechanical / utility plant (water heater, air handler, radiators, boiler,
    // condenser, heat pump, pumps, 3D printer): its heat/cool/fan GLOW (or the
    // pumps' moving water) IS the state language, so these kinds opt OUT of the
    // generic green in-use halo — exactly like the 3D LED exclusion.
    const mech = isMechanicalApplianceKind(piece.kind)
      ? mechanicalRun(p.effectiveState(piece), piece.kind) : null;
    const applianceOn = !mech && (stateOn || powerInUse || climateOn);
    // Intensity multiplier: scale by power when a reading > 5 W exists, else full.
    const glowScale = isFinite(powerW) && powerW > 5 ? powerGlowScale(powerW) : 1;
    const doorOpen = !!piece.doorEntity &&
      p.effectiveState({ entity_id: piece.doorEntity })?.state === 'on';
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(rotR);
    // Soft green glow behind an active appliance (drawn under the body).
    if (applianceOn) {
      ctx.save();
      ctx.shadowColor = `rgba(0,200,83,${(0.85 * glowScale).toFixed(3)})`;
      ctx.shadowBlur = 14 * dpr * glowScale;
      ctx.fillStyle = `rgba(0,200,83,${(0.13 * glowScale).toFixed(3)})`;
      ctx.fillRect(-halfW, -halfH, halfW * 2, halfH * 2);
      ctx.restore();
    }
    // Mechanical/utility running cue, in the SAME color language as the 3D glow:
    // a pulsing halo tinted heat red / cool blue / fan white (time-based alpha —
    // the RAF redraws every frame). Pumps + the printer carry no glow color; they
    // get a cool "water/working" wash instead, with the pumps' flow direction
    // shown as marching dashes along the piece's long (X) axis.
    if (mech?.running) {
      const gc = mechanicalGlowColor(mech.glow) ?? '#4aa8d8';
      const pulse = 0.5 + 0.5 * Math.sin(now * 2.4);
      ctx.save();
      ctx.shadowColor = hexToRgba(gc, 0.5 + 0.35 * pulse);
      ctx.shadowBlur = 16 * dpr;
      ctx.fillStyle = hexToRgba(gc, 0.1 + 0.09 * pulse);
      ctx.fillRect(-halfW, -halfH, halfW * 2, halfH * 2);
      ctx.restore();
      if (isPumpKind(piece.kind)) {
        ctx.save();
        ctx.strokeStyle = 'rgba(130,208,238,0.95)';
        ctx.lineWidth = Math.max(1.5, 2 * dpr);
        const ph = (now * 1.6) % 1;
        for (let i = 0; i < 3; i++) {
          const f = (ph + i / 3) % 1;
          const tx = -halfW * 0.8 + f * halfW * 1.6;
          ctx.beginPath();
          ctx.moveTo(tx, 0); ctx.lineTo(tx + halfW * 0.22, 0);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    // Network rack: the aggregate health LED, in a front corner of the cabinet.
    // Same pure resolver the 3D bead uses, so the two views can never disagree.
    // A 'problem' band pulses (it wants a human); ok/update/unknown sit steady.
    if (isRackKind(piece.kind)) {
      const hs = rackHealth((piece.rack?.problemEntities ?? []).map(id => ({
        id, state: p.hass?.states?.[id]?.state ?? null,
      })));
      const col = rackHealthColor(hs);
      const r = Math.max(2, 2.6 * dpr);
      const lx = -halfW + r * 2.4, ly = -halfH + r * 2.4;
      ctx.save();
      if (hs === 'problem') {
        const pulse = 0.5 + 0.5 * Math.sin(now * 4);
        ctx.shadowColor = hexToRgba(col, 0.55 + 0.4 * pulse);
        ctx.shadowBlur = 10 * dpr;
      } else if (hs !== 'unknown') {
        ctx.shadowColor = hexToRgba(col, 0.5);
        ctx.shadowBlur = 6 * dpr;
      }
      ctx.fillStyle = hs === 'unknown' ? hexToRgba(col, 0.5) : col;
      ctx.beginPath(); ctx.arc(lx, ly, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // 3D printer: a live progress chip beside the frame when a numeric progress
    // is bound (0/100 included — the number is the point).
    if (piece.kind === 'printer_3d' && mech?.progress != null) {
      ctx.save();
      ctx.font = `${Math.max(8, Math.round(9 * dpr))}px system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const txt = `${Math.round(mech.progress)}%`;
      const tw = ctx.measureText(txt).width + 8;
      ctx.fillStyle = 'rgba(12,16,20,0.82)';
      ctx.fillRect(-tw / 2, -halfH - 16 * dpr, tw, 13 * dpr);
      ctx.fillStyle = '#2ec5b6';
      ctx.fillText(txt, 0, -halfH - 16 * dpr + 6.5 * dpr);
      ctx.restore();
    }
    // Screen bias lighting (home-theater arc): a subtle colored halo ring around
    // the TV footprint while the bias source is on — bound bias entity 'on', or
    // (no entityId) AUTO while the TV itself is playing/on.
    if ((piece.kind === 'tv' || piece.kind === 'wall_tv') && piece.biasLight) {
      const bl = piece.biasLight;
      const biasOn = bl.entityId
        ? p.effectiveState({ entity_id: bl.entityId })?.state === 'on'
        : stateOn;
      if (biasOn) {
        ctx.save();
        ctx.shadowColor = hexToRgba(biasLightColor(bl), 0.85);
        ctx.shadowBlur = 20 * dpr;
        ctx.strokeStyle = hexToRgba(biasLightColor(bl), 0.55);
        ctx.lineWidth = 3;
        ctx.strokeRect(-halfW - 3, -halfH - 3, halfW * 2 + 6, halfH * 2 + 6);
        ctx.restore();
      }
    }
    // Local rect: -halfW..+halfW (X), -halfH..+halfH (canvas Y). Canvas-Y top
    // (-halfH) corresponds to world +Y after the canvas Y-flip — the BACK-side
    // decorations edge (backrest, headboard, pillows). The functional FRONT
    // (cabinet doors/pulls, TV screens, seat openings, faces — local -Z = world
    // -Y) is at canvas-Y +halfH.
    // Mailbox: flagEntity 'on' raises the flag (outgoing-mail semantics — the
    // SAME resolution three-renderer's updateFloor uses; countEntity only drives
    // the badge, and nothing opens the door). The old 2D read had these swapped,
    // so 2D and 3D disagreed on the flag whenever only one binding was set.
    let mailFlagUp = false;
    const mailLidOpen = false; // door stays closed (furniture-polish reconciliation)
    if (piece.kind === 'mailbox') {
      const mc = piece.mailCount;
      // Bound flag sensor is authoritative; else the click-toggled localState
      // raises the flag (unbound-interactive pattern — same resolve as 3D).
      if (mc?.flagEntity) mailFlagUp = p.effectiveState({ entity_id: mc.flagEntity })?.state === 'on';
      else mailFlagUp = piece.localState === 'on' || piece.localState === 'playing';
    }
    drawFurniturePrimitiveLocal(ctx, piece, halfW, halfH, customObjects, binFull,
                                { ghost: vehicleGhost, mailFlagUp, mailLidOpen });
    // Sink running water: a blue basin tint ∝ an eased fill level + animated flow
    // ticks at the faucet while the sink runs (bound entity / unbound localState
    // on). Fill eases here on the RAF `now` clock (2D has no renderer state), so
    // it rises ~8 s and drains ~6 s just like the 3D water. Basin center ≈ y 0,
    // faucet at the back (top, -halfH). The 3D avatar-triggered run isn't visible
    // to 2D — the entity/local run-state is.
    if (isSinkKind(piece.kind)) {
      const running = (() => { const s = p.effectiveState(piece)?.state; return s === 'on' || s === 'playing'; })();
      const rec = _sink2dFill.get(piece.id) ?? { v: 0, t: now };
      const dt = Math.max(0, Math.min(0.1, now - rec.t));
      rec.v += ((running ? 1 : 0) - rec.v) * (1 - Math.exp(-dt / (running ? 2.7 : 2.0)));
      rec.t = now;
      _sink2dFill.set(piece.id, rec);
      if (rec.v > 0.02) {
        ctx.save();
        ctx.fillStyle = `rgba(74,168,216,${(0.14 + 0.42 * rec.v).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(0, halfH * 0.05, halfW * 0.42, halfH * 0.42, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }
      if (running) {
        ctx.save();
        ctx.strokeStyle = 'rgba(130,208,238,0.9)';
        ctx.lineWidth = Math.max(1.5, 2 * dpr);
        const span = halfH * 0.55;                 // faucet (top) → bowl (center)
        const y0 = -halfH * 0.42;
        const ph = (now * 2.2) % 1;                // downward-marching dashes
        for (let i = 0; i < 3; i++) {
          const f = (ph + i / 3) % 1;
          const ty = y0 + f * span;
          ctx.beginPath();
          ctx.moveTo(0, ty);
          ctx.lineTo(0, ty + Math.min(span * 0.22, 6 * dpr));
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    // Bathtub / shower / toilet running-water hints (2D analogues of the 3D
    // fill / spray / flush). Same `_sink2dFill` eased-level map (2D has no
    // renderer state), same run source — the entity / local state; the 3D
    // avatar-triggered runs aren't visible to 2D.
    if (piece.kind === 'bathtub' || piece.kind === 'shower' || piece.kind === 'toilet') {
      const running = (() => { const s = p.effectiveState(piece)?.state; return s === 'on' || s === 'playing'; })();
      const rec = _sink2dFill.get(piece.id) ?? { v: 0, t: now };
      const dt = Math.max(0, Math.min(0.1, now - rec.t));
      // Tub fills/drains slowly; shower + toilet snap (they are not levels).
      const tau = piece.kind === 'bathtub' ? (running ? 4.0 : 3.3) : 0.3;
      rec.v += ((running ? 1 : 0) - rec.v) * (1 - Math.exp(-dt / tau));
      rec.t = now;
      _sink2dFill.set(piece.id, rec);
      ctx.save();
      if (piece.kind === 'bathtub' && rec.v > 0.02) {
        ctx.fillStyle = `rgba(74,168,216,${(0.12 + 0.40 * rec.v).toFixed(3)})`;
        ctx.fillRect(-halfW * 0.80, -halfH * 0.80, halfW * 1.60, halfH * 1.60 * rec.v);
      } else if (piece.kind === 'shower' && rec.v > 0.02) {
        // Concentric spray rings pulsing outward from the head (3D head is at
        // +0.3·W / +0.3·D → canvas (+0.6·halfW, −0.6·halfH)).
        const hx = halfW * 0.6, hy = -halfH * 0.6;
        ctx.strokeStyle = `rgba(150,215,240,${(0.75 * rec.v).toFixed(3)})`;
        ctx.lineWidth = Math.max(1, 1.5 * dpr);
        for (let i = 0; i < 3; i++) {
          const f = ((now * 1.5) + i / 3) % 1;
          ctx.beginPath();
          ctx.arc(hx, hy, Math.min(halfW, halfH) * (0.15 + 0.7 * f), 0, 2 * Math.PI);
          ctx.stroke();
        }
      } else if (piece.kind === 'toilet' && rec.v > 0.02) {
        // Flush swirl: a rotating arc in the bowl (bowl sits at −0.12·D → +y).
        const cy = halfH * 0.24, rr = Math.min(halfW, halfH) * 0.42;
        ctx.strokeStyle = `rgba(110,195,232,${(0.9 * rec.v).toFixed(3)})`;
        ctx.lineWidth = Math.max(1.5, 2 * dpr);
        const a0 = (now * 5) % (2 * Math.PI);
        ctx.beginPath(); ctx.arc(0, cy, rr, a0, a0 + Math.PI * 1.2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, cy, rr * 0.55, a0 + Math.PI, a0 + Math.PI * 2.1); ctx.stroke();
      }
      ctx.restore();
    }
    // Fridge open-door wedge (amber): a mini door-swing arc at the front-right
    // corner (the 3D hinge is on the +X edge). Front = canvas-Y +halfH.
    if (doorOpen) {
      const hx = halfW, hy = halfH;                     // hinge = front-right corner
      const rr = Math.min(halfW * 1.7, halfH * 2.2, 44 * dpr) + 4;
      const aClosed = Math.PI;                          // leaf lies along the front edge (-X)
      const aOpen = Math.PI - 70 * Math.PI / 180;       // swung ~70° outward (+Y canvas)
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.arc(hx, hy, rr, aOpen, aClosed);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,183,77,0.16)';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + rr * Math.cos(aOpen), hy + rr * Math.sin(aOpen));
      ctx.strokeStyle = 'rgba(255,183,77,0.95)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    // Pulsing green LED at the front-left corner of an active appliance.
    if (applianceOn) {
      const pulse = (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(now * 3))) * glowScale;
      const r = Math.max(2.5, 4 * dpr);
      ctx.save();
      ctx.fillStyle = `rgba(0,230,118,${pulse.toFixed(3)})`;
      ctx.shadowColor = 'rgba(0,230,118,0.9)';
      ctx.shadowBlur = 6 * dpr * glowScale;
      ctx.beginPath();
      ctx.arc(-halfW + r + 2, halfH - r - 2, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
    // "Job done" badge (event-focused thought bubbles): a distinct BLUE pulsing
    // LED at the front-RIGHT corner while an appliance is within its finished
    // window (green already means "running", so a separate color/corner reads as
    // "done, not running"). Reuses the RAF-driven pulse — no new per-frame cost.
    if (isAppliance && p.applianceJustFinished(piece)) {
      const pulse = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(now * 4));
      const r = Math.max(2.5, 4 * dpr);
      ctx.save();
      ctx.fillStyle = `rgba(41,182,246,${pulse.toFixed(3)})`;
      ctx.shadowColor = 'rgba(41,182,246,0.9)';
      ctx.shadowBlur = 7 * dpr;
      ctx.beginPath();
      ctx.arc(halfW - r - 2, halfH - r - 2, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
    // The piece NAME rides objectLabels; the now-playing / TV-screen lines
    // below are live CONTENT and stay. `labelShown` (not `piece.label`) drives
    // their offset so they close the gap when the name is hidden.
    const labelShown = names && !!piece.label;
    if (labelShown) {
      ctx.fillStyle = '#ddd'; ctx.font = '10px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(piece.label!, 0, 0);
    }
    // Now-playing (#11): a `♪ title` line under the label for a media_player-bound
    // piece that is playing. Reads live state (LIVE-path; the RAF redraws every
    // frame). Paused/idle → nothing in 2D (the 3D card shows paused dimmed).
    if (isMediaPlayerId(piece.entity_id) && p.hass?.states) {
      const np = parseNowPlaying(p.hass.states[piece.entity_id!]);
      if (np && np.tier === 'playing') {
        let txt = `♪ ${np.title}`;
        if (txt.length > 30) txt = txt.slice(0, 29) + '…';
        ctx.fillStyle = 'rgba(0,230,118,0.95)'; ctx.font = '9px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(txt, 0, (labelShown ? 11 : 0));
      }
    }
    // TV screen surfaces (calendar-tv feature): a glanceable 📰/⛅ line under the
    // label when a tv/wall_tv shows a news/weather screen (no scrolling in 2D).
    // Now-playing precedence: only when no media is presenting. Reads live state.
    if ((piece.kind === 'tv' || piece.kind === 'wall_tv') && p.hass?.states) {
      const mode = (piece.screenMode as ScreenMode | undefined) ?? 'auto';
      if (mode === 'news' || mode === 'weather') {
        const media = isMediaPlayerId(piece.entity_id) ? parseNowPlaying(p.hass.states[piece.entity_id!]) : null;
        const st = p.effectiveState(piece);
        const s = st?.state;
        const tvOn = !(s === 'off' || s === 'standby' || s === 'unavailable');
        const content = resolveScreenContent(mode, !!media, tvOn);
        let scr = '';
        if (content === 'news') {
          const h = p.headlinesFor(piece.newsEntity);
          scr = `📰 ${h[0] ? h[0].slice(0, 26) : '—'}`;
        } else if (content === 'weather') {
          const wn = p.weatherNow;
          const g = wn ? (CONDITION_GLYPH[wn.condition] ?? '') : '';
          const tc = wn?.tempC;
          scr = `${g || '⛅'} ${typeof tc === 'number' ? Math.round(p.store.imperial ? tc * 9 / 5 + 32 : tc) + '°' : '—'}`;
        }
        if (scr) {
          ctx.fillStyle = 'rgba(127,212,255,0.95)'; ctx.font = '9px sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(scr, 0, (labelShown ? 11 : 0) + 11);
        }
      }
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
    // Temperature chip (stove/oven/fridge): a small upright N° pill above the
    // piece (drawn in screen space so it stays readable under any rotation).
    if (piece.tempEntity && p.hass?.states) {
      const tv = parseFloat(p.hass.states[piece.tempEntity]?.state ?? '');
      if (isFinite(tv)) {
        const unit = String(p.hass.states[piece.tempEntity]?.attributes?.unit_of_measurement ?? '');
        const txt = `${Math.round(tv)}°${/F/i.test(unit) ? 'F' : ''}`;
        const cy = center.y - Math.max(halfW, halfH) - 8 * dpr;
        ctx.font = `${10 * dpr}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const tw = ctx.measureText(txt).width + 8 * dpr;
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(center.x - tw / 2, cy - 7 * dpr, tw, 14 * dpr);
        ctx.fillStyle = '#ff8a65';
        ctx.fillText(txt, center.x, cy);
      }
    }
    // Plant thirsty chip (soil moisture): a small 💧 chip near the pot when the
    // bound moisture reading is below threshold (self-gating like the battery
    // badge — drawn only when thirsty). Unbound plants show it only via the demo
    // toggle. Screen-upright like the temp chip.
    if (isDroopPlant(piece, customObjects)) {
      let thirsty = false, pctTxt = '';
      if (piece.moistureEntity && p.hass?.states) {
        const rd = parseFloat(p.hass.states[piece.moistureEntity]?.state ?? '');
        const thr = piece.moistureThreshold ?? PLANT_MOISTURE_DEFAULT_THRESHOLD;
        if (plantThirsty(rd, thr)) { thirsty = true; pctTxt = `${Math.round(rd)}%`; }
      } else if (!piece.moistureEntity && piece.plantDemoThirsty) {
        thirsty = true;
      }
      if (thirsty) {
        const label = pctTxt ? `💧${pctTxt}` : '💧';
        const cy = center.y - Math.max(halfW, halfH) - 8 * dpr;
        ctx.font = `${11 * dpr}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const tw = ctx.measureText(label).width + 10 * dpr;
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(center.x - tw / 2, cy - 8 * dpr, tw, 16 * dpr);
        ctx.fillStyle = '#ffca28';
        ctx.fillText(label, center.x, cy);
      }
    }
    // EV charge indicator: a bolt (+ SoC % or kW) above a car that is charging —
    // its own bound charger OR a charging charger piece within ~1500 mm. Drawn
    // screen-upright like the temp chip.
    if (piece.kind === 'car' && p.hass?.states) {
      const chg = carChargeState(piece, f.furniture, id => p.hass!.states[id] ?? null);
      if (chg) {
        const label = chg.pct != null ? `⚡${Math.round(chg.pct)}%`
          : chg.watts != null ? `⚡${(chg.watts / 1000).toFixed(1)}kW` : '⚡';
        const cy = center.y - Math.max(halfW, halfH) - 8 * dpr;
        ctx.font = `${11 * dpr}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const tw = ctx.measureText(label).width + 10 * dpr;
        const pulse = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(now * 4));
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(center.x - tw / 2, cy - 8 * dpr, tw, 16 * dpr);
        ctx.fillStyle = hexToRgba(evStatusColor('charging'), pulse);
        ctx.fillText(label, center.x, cy);
      }
    }
    // Mailbox count badge: a small chip above the box when the bound count
    // sensor reads > 0 (Mail-and-Packages style). Zero/unbound = no badge.
    if (piece.kind === 'mailbox' && piece.mailCount?.countEntity && p.hass?.states) {
      const cnt = parseInt(p.hass.states[piece.mailCount.countEntity]?.state ?? '', 10);
      if (isFinite(cnt) && cnt > 0) {
        const cy = center.y - Math.max(halfW, halfH) - 8 * dpr;
        const r = 9 * dpr;
        ctx.fillStyle = '#e53935';
        ctx.beginPath(); ctx.arc(center.x, cy, r, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = `bold ${10 * dpr}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(cnt > 99 ? '99+' : cnt), center.x, cy + 0.5 * dpr);
      }
    }
    // Linked-stairs chip (Tier 2): a small ▲/▼ near the top edge showing which
    // way the linked partner leads (partner's story order vs this floor —
    // higher Store.floors index = above). Drawn screen-upright, edit + view.
    if (isStairsKind(piece.kind) && piece.stairLinkId) {
      let partnerIdx = -1;
      for (let fi = 0; fi < p.store.floors.length && partnerIdx < 0; fi++) {
        if (fi === curFloorIdx) continue;
        for (const fu of p.store.floors[fi].furniture) {
          if (fu.id !== piece.id && fu.stairLinkId === piece.stairLinkId && isStairsKind(fu.kind)) {
            partnerIdx = fi; break;
          }
        }
      }
      if (partnerIdx >= 0) {
        const arrow = stairChipArrow(partnerIdx, curFloorIdx);
        const cy = center.y - Math.max(halfW, halfH) - 9 * dpr;
        ctx.font = `bold ${11 * dpr}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const r = 8 * dpr;
        ctx.fillStyle = 'rgba(20,28,36,0.85)';
        ctx.beginPath(); ctx.arc(center.x, cy, r, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = '#7fb4ff'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = '#cfe3ff';
        ctx.fillText(arrow, center.x, cy + 0.5 * dpr);
      }
    }
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
// Exported for the deterministic test harness (a pure per-kind primitive draw —
// no Planner / DOM state beyond the passed ctx). Not used elsewhere in the app.
export function drawFurniturePrimitiveLocal(
  ctx: CanvasRenderingContext2D,
  piece: Furniture,
  halfW: number,
  halfH: number,
  customObjects?: ObjectRecipe[],
  binFull = false,
  extra?: { ghost?: boolean; mailFlagUp?: boolean; mailLidOpen?: boolean },
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
  // Custom object recipes: a top-down projection of the recipe's primitives.
  // Each primitive draws its plan footprint (box → rotated rect; cylinder /
  // cone / sphere → circle) at its local x/z offset — local +X → canvas +X,
  // local +Z = world +Y = the BACK edge, which the canvas Y-flip puts at
  // canvas -Y (the SAME numeric local frame the 3D `_buildFromRecipe` uses).
  // The piece rotation is already applied by the caller's ctx.rotate; a
  // primitive's own Y-rotation spins its own footprint in place. Parts paint
  // bottom-up (by vertical center) so taller / upper parts draw over lower
  // ones. Falls back to the labeled rect when the recipe carries no primitives.
  if (piece.customKindId || piece.vehicleModelId) {
    // A vehicle-pack model converts into the SAME ObjectRecipe shape (memoized);
    // an unloaded / deactivated pack yields null → the plain labeled-rect fallback.
    const rec = piece.vehicleModelId
      ? vehicleRecipe(piece.vehicleModelId)
      : customObjects?.find(o => o.id === piece.customKindId);
    const defHex = piece.color ?? ('#' + ((rec?.color ?? 0x8a8a8a) & 0xffffff).toString(16).padStart(6, '0'));
    const prims = rec?.primitives;
    if (!prims || prims.length === 0) {
      fill(hexToRgba(defHex, 0.5));
      stroke(defHex);
      return;
    }
    // mm → px (uniform scale; recovered from the px half-extents the caller
    // already derived from view.scale, so `view` needn't be threaded in).
    const sc = piece.w ? (halfW * 2) / piece.w : (piece.h ? (halfH * 2) / piece.h : 1);
    // Vertical center used ONLY for paint order: pos.y + half the part height.
    const vmid = (pr: RecipePrimitive): number => {
      const [a, b, c] = pr.size;
      const hh = pr.shape === 'cylinder' ? c / 2
        : pr.shape === 'sphere' ? a
        : b / 2;                       // box / cone: height is size[1]
      return pr.pos[1] + hh;
    };
    const order = prims.map((_, i) => i).sort((i, j) => vmid(prims[i]) - vmid(prims[j]));
    ctx.lineWidth = 1;
    for (const idx of order) {
      const pr = prims[idx];
      const [a, b, c] = pr.size;
      const cx = pr.pos[0] * sc;
      const cy = -pr.pos[2] * sc;       // +Z (back) → canvas up
      const pc = pr.color ?? defHex;    // primitive color, else the piece/recipe tint
      ctx.fillStyle = hexToRgba(pc, 0.5);
      ctx.strokeStyle = pc;
      if (pr.shape === 'box') {
        const bw = a * sc, bd = c * sc; // footprint = size[0] (X) × size[2] (Z)
        const theta = pr.rot ? pr.rot[1] * Math.PI / 180 : 0;  // primitive yaw
        ctx.save();
        ctx.translate(cx, cy);
        if (theta) ctx.rotate(theta);
        ctx.fillRect(-bw / 2, -bd / 2, bw, bd);
        ctx.strokeRect(-bw / 2, -bd / 2, bw, bd);
        ctx.restore();
      } else {
        // cylinder [rTop,rBot,ht] / cone [r,ht] / sphere [r] → plan circle.
        const rmm = pr.shape === 'cylinder' ? Math.max(a, b) : a;
        const rr = Math.max(0.5, rmm * sc);
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
    }
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
      // Same shared rule the 3D builder + _groundYAt use, so the plan symbol
      // never shows a different number of treads than you can walk on.
      const nSteps = stairsTreadCount(piece.h, stairsRiseMm(piece, FURNITURE_KINDS[kind].ht));
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
    case 'ramp': {
      // Plan symbol: the footprint plus evenly spaced chevrons pointing at the
      // HIGH end (local +Z = plan-top, the same rise direction as a flight).
      fill('rgba(141,110,99,0.4)');
      stroke('#a1887f');
      const down = (piece.elevation ?? 0) < 0;
      ctx.strokeStyle = '#eceff1'; ctx.lineWidth = 1.5;
      const cxr = x + w / 2, half = Math.min(w * 0.28, 9);
      for (let i = 0; i < 3; i++) {
        // t runs foot → head; a sunk ramp flips so the chevrons point DOWN.
        const t = 0.28 + i * 0.22;
        const cy = down ? y + h * (1 - t) : y + h * t;
        const tip = down ? cy + 7 : cy - 7;
        ctx.beginPath();
        ctx.moveTo(cxr - half, cy); ctx.lineTo(cxr, tip); ctx.lineTo(cxr + half, cy);
        ctx.stroke();
      }
      if (down) {
        ctx.fillStyle = '#eceff1'; ctx.font = '9px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('DN', cxr, y + h * 0.86);
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
    case 'sink': {
      // Compact vanity: counter rect + recessed bowl ellipse (darker inset) +
      // faucet dot at the back (+Z = TOP edge in canvas).
      fill(bodyFill('rgba(215,204,200,0.6)', 0.6));
      stroke('#a1887f');
      ctx.fillStyle = 'rgba(207,210,207,0.9)';
      ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, h * 0.04, halfW * 0.5, halfH * 0.5, 0, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#78909c';
      ctx.beginPath(); ctx.arc(0, y + h * 0.14, 3, 0, 2 * Math.PI); ctx.fill();
      break;
    }
    case 'pedestal_sink': {
      // Round porcelain basin + recessed bowl + faucet dot at the back.
      fill('rgba(245,245,240,0.4)');
      ctx.fillStyle = 'rgba(245,245,240,0.85)';
      ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, halfW * 0.7, halfH * 0.7, 0, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(207,210,207,0.9)'; ctx.strokeStyle = '#90a4ae';
      ctx.beginPath(); ctx.ellipse(0, h * 0.04, halfW * 0.48, halfH * 0.48, 0, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#78909c';
      ctx.beginPath(); ctx.arc(0, y + h * 0.16, 3, 0, 2 * Math.PI); ctx.fill();
      break;
    }
    case 'utility_sink': {
      // Deep rectangular tub + recessed inner well + faucet dot at the back.
      fill(bodyFill('rgba(154,162,168,0.6)', 0.6));
      stroke('#78848c');
      ctx.fillStyle = 'rgba(207,210,207,0.9)';
      ctx.strokeStyle = '#607d8b'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x + w * 0.12, y + h * 0.14, w * 0.76, h * 0.72, Math.min(w, h) * 0.08);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#546e7a';
      ctx.beginPath(); ctx.arc(0, y + h * 0.16, 3.5, 0, 2 * Math.PI); ctx.fill();
      break;
    }
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
    // ── Climate / airflow appliances (top-down; front = -Y / bottom edge) ──
    case 'window_ac':
    case 'mini_split': {
      // White box + front grille slats + a front louver line.
      fill(bodyFill('rgba(236,239,241,0.7)', 0.7));
      stroke('#90a4ae');
      ctx.strokeStyle = '#607d8b'; ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        const gy = y + h * (0.35 + i * 0.14);
        ctx.beginPath(); ctx.moveTo(x + w * 0.12, gy); ctx.lineTo(x + w * 0.88, gy); ctx.stroke();
      }
      break;
    }
    case 'portable_ac': {
      // Rounded tower + a top vent band (back/+Y) + a hose stub off the -X side.
      fill(bodyFill('rgba(207,216,220,0.6)', 0.6));
      stroke('#90a4ae');
      ctx.fillStyle = 'rgba(55,71,79,0.7)';
      ctx.fillRect(x + w * 0.14, y + 2, w * 0.72, h * 0.2);
      ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x - 2, y + h * 0.3, Math.min(halfW, halfH) * 0.5, -Math.PI * 0.4, Math.PI * 0.4); ctx.stroke();
      break;
    }
    case 'floor_fan':
    case 'retro_fan':
    case 'modern_fan': {
      // Cage circle + 4-spoke blade cross + hub dot.
      const rr = Math.min(halfW, halfH) * 0.85;
      ctx.fillStyle = bodyFill('rgba(154,162,168,0.35)', 0.35);
      ctx.strokeStyle = kind === 'retro_fan' ? '#b08d57' : '#8a9096'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 2;
      const nb = kind === 'modern_fan' ? 3 : 4;
      for (let i = 0; i < nb; i++) {
        const a = (i * 2 * Math.PI) / nb;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * rr * 0.85, Math.sin(a) * rr * 0.85); ctx.stroke();
      }
      ctx.fillStyle = '#455a64';
      ctx.beginPath(); ctx.arc(0, 0, Math.max(2, rr * 0.18), 0, 2 * Math.PI); ctx.fill();
      break;
    }
    case 'tower_fan': {
      // Slim oval body + a vertical vent slot at the front (-Y edge).
      ctx.fillStyle = bodyFill('rgba(84,88,94,0.6)', 0.6);
      ctx.strokeStyle = '#78848c'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, halfW, halfH, 0, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#4dd0ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, y + h * 0.2); ctx.lineTo(0, y + h * 0.8); ctx.stroke();
      break;
    }
    case 'bladeless_fan': {
      // Ring (annulus) on an oval base.
      ctx.fillStyle = bodyFill('rgba(207,216,220,0.5)', 0.5);
      ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 2;
      const rr = Math.min(halfW, halfH) * 0.9;
      ctx.beginPath(); ctx.arc(0, -h * 0.05, rr, 0, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, h * 0.3, halfW * 0.5, halfH * 0.25, 0, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      break;
    }
    case 'space_heater': {
      // Squat body + a warm-toned front grille (front = -Y / bottom).
      fill(bodyFill('rgba(58,63,69,0.6)', 0.6));
      stroke('#8a9096');
      ctx.strokeStyle = '#ff6a1a'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const gy = y + h * (0.4 + i * 0.16);
        ctx.beginPath(); ctx.moveTo(x + w * 0.16, gy); ctx.lineTo(x + w * 0.84, gy); ctx.stroke();
      }
      break;
    }
    case 'wall_heater':
    case 'towel_warmer': {
      // Slim wall panel + horizontal warm bars (front = -Y / bottom).
      fill(bodyFill(kind === 'towel_warmer' ? 'rgba(176,190,197,0.6)' : 'rgba(215,220,224,0.6)', 0.6));
      stroke('#90a4ae');
      ctx.strokeStyle = kind === 'towel_warmer' ? '#c08040' : '#ff6a1a'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const bx = x + w * (0.14 + i * 0.18);
        ctx.beginPath(); ctx.moveTo(bx, y + h * 0.14); ctx.lineTo(bx, y + h * 0.86); ctx.stroke();
      }
      break;
    }
    // ── Mechanical / utility plant (top-down; front = -Y / bottom edge) ────
    case 'water_heater': {
      // Tank circle + a flue dot + a burner flame tick at the front.
      const rr = Math.min(halfW, halfH) * 0.92;
      ctx.fillStyle = bodyFill('rgba(214,218,222,0.7)', 0.7);
      ctx.strokeStyle = '#8d959b'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#78848c';
      ctx.beginPath(); ctx.arc(0, 0, Math.max(2, rr * 0.2), 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#ff6a1a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-rr * 0.3, rr * 0.55); ctx.lineTo(rr * 0.3, rr * 0.55); ctx.stroke();
      break;
    }
    case 'air_handler': {
      // Cabinet rect + louver lines on the front + a plenum band at the back.
      fill(bodyFill('rgba(182,190,196,0.65)', 0.65));
      stroke('#78848c');
      ctx.fillStyle = 'rgba(141,149,155,0.8)';
      ctx.fillRect(x, y, w, Math.max(3, h * 0.18));                  // plenum (back / +Y)
      ctx.strokeStyle = '#4dd0ff'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const gy = y + h * (0.45 + i * 0.13);
        ctx.beginPath(); ctx.moveTo(x + w * 0.18, gy); ctx.lineTo(x + w * 0.82, gy); ctx.stroke();
      }
      break;
    }
    case 'floor_radiator': {
      // Long finned strip: body bar + a fin comb across it.
      fill(bodyFill('rgba(215,220,224,0.65)', 0.65));
      stroke('#90a4ae');
      ctx.strokeStyle = '#b0b8be'; ctx.lineWidth = 1;
      const nf = Math.max(5, Math.min(24, Math.round(w / 8)));
      for (let i = 0; i < nf; i++) {
        const fx = x + w * ((i + 0.5) / nf);
        ctx.beginPath(); ctx.moveTo(fx, y + h * 0.2); ctx.lineTo(fx, y + h * 0.8); ctx.stroke();
      }
      ctx.strokeStyle = '#ff6a1a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x + w * 0.04, y + h * 0.92); ctx.lineTo(x + w * 0.96, y + h * 0.92); ctx.stroke();
      break;
    }
    case 'wall_radiator': {
      // Slim ribbed wall panel + a warm bar along the room-facing edge.
      fill(bodyFill('rgba(227,231,234,0.65)', 0.65));
      stroke('#90a4ae');
      ctx.strokeStyle = '#aeb6bc'; ctx.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        const rx = x + w * (0.08 + i * 0.14);
        ctx.beginPath(); ctx.moveTo(rx, y + h * 0.18); ctx.lineTo(rx, y + h * 0.82); ctx.stroke();
      }
      ctx.strokeStyle = '#ff6a1a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x + w * 0.06, y + h * 0.9); ctx.lineTo(x + w * 0.94, y + h * 0.9); ctx.stroke();
      break;
    }
    case 'boiler': {
      // Jacket circle + a gauge dot at the front + two pipe stubs at the back.
      const rr = Math.min(halfW, halfH) * 0.9;
      ctx.fillStyle = bodyFill('rgba(154,164,173,0.65)', 0.65);
      ctx.strokeStyle = '#6f787f'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#8d959b'; ctx.lineWidth = 2;
      for (const sx of [-0.5, 0.5]) {
        ctx.beginPath(); ctx.moveTo(rr * sx, -rr * 0.8); ctx.lineTo(rr * sx, -rr * 1.25); ctx.stroke();
      }
      ctx.fillStyle = '#eceff1';
      ctx.beginPath(); ctx.arc(rr * 0.28, rr * 0.5, Math.max(2, rr * 0.17), 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#ff6a1a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-rr * 0.55, rr * 0.55); ctx.lineTo(-rr * 0.05, rr * 0.55); ctx.stroke();
      break;
    }
    case 'ac_condenser': {
      // Square cabinet + a top fan circle with a 4-spoke cross.
      fill(bodyFill('rgba(168,176,182,0.6)', 0.6));
      stroke('#6f787f');
      const rr = Math.min(halfW, halfH) * 0.66;
      ctx.strokeStyle = '#596066'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, 2 * Math.PI); ctx.stroke();
      ctx.strokeStyle = '#4dd0ff'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 6;
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * rr * 0.86, Math.sin(a) * rr * 0.86); ctx.stroke();
      }
      ctx.fillStyle = '#455a64';
      ctx.beginPath(); ctx.arc(0, 0, Math.max(2, rr * 0.16), 0, 2 * Math.PI); ctx.fill();
      break;
    }
    case 'heat_pump': {
      // Slim cabinet + a fan circle toward the front (-Y) + a control block.
      fill(bodyFill('rgba(159,168,174,0.6)', 0.6));
      stroke('#6f787f');
      const rr = Math.min(halfW * 0.5, halfH * 0.9);
      ctx.strokeStyle = '#4dd0ff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(-halfW * 0.2, 0, rr, 0, 2 * Math.PI); ctx.stroke();
      ctx.strokeStyle = '#8d959b'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const a = (i * 2 * Math.PI) / 3;
        ctx.beginPath(); ctx.moveTo(-halfW * 0.2, 0);
        ctx.lineTo(-halfW * 0.2 + Math.cos(a) * rr * 0.85, Math.sin(a) * rr * 0.85); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(106,114,120,0.9)';
      ctx.fillRect(halfW * 0.14, y + h * 0.24, halfW * 0.5, h * 0.52);
      break;
    }
    case 'sump_pump': {
      // Basin circle + lid ring + a riser pipe stub off the +X side.
      const rr = Math.min(halfW, halfH) * 0.88;
      ctx.fillStyle = bodyFill('rgba(84,110,122,0.6)', 0.6);
      ctx.strokeStyle = '#455a64'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#78909c'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, rr * 0.62, 0, 2 * Math.PI); ctx.stroke();
      ctx.strokeStyle = '#4aa8d8'; ctx.lineWidth = Math.max(2, rr * 0.22);
      ctx.beginPath(); ctx.moveTo(rr * 0.25, 0); ctx.lineTo(rr * 1.35, 0); ctx.stroke();
      break;
    }
    case 'recirc_pump': {
      // Inline unit: a pipe run across X + a volute circle + a motor square.
      ctx.strokeStyle = '#8d959b'; ctx.lineWidth = Math.max(2, halfH * 0.42);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.stroke();
      ctx.strokeStyle = '#4aa8d8'; ctx.lineWidth = Math.max(1, halfH * 0.18);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.stroke();
      const rr = Math.min(halfW, halfH) * 0.72;
      ctx.fillStyle = bodyFill('rgba(122,92,58,0.75)', 0.75);
      ctx.strokeStyle = '#5d4526'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(60,66,72,0.9)';
      ctx.fillRect(-rr * 0.5, -rr * 0.5, rr, rr);
      break;
    }
    case 'printer_3d': {
      // Open frame square + a bed rect + the gantry rail across the back.
      ctx.fillStyle = bodyFill('rgba(55,71,79,0.55)', 0.55);
      ctx.strokeStyle = '#78848c'; ctx.lineWidth = 1.5;
      ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = 'rgba(27,31,35,0.95)';
      ctx.fillRect(x + w * 0.14, y + h * 0.22, w * 0.72, h * 0.62);   // print bed
      ctx.strokeStyle = '#9aa2a8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + w * 0.06, y + h * 0.12); ctx.lineTo(x + w * 0.94, y + h * 0.12); ctx.stroke();
      ctx.fillStyle = '#2ec5b6';
      ctx.fillRect(-w * 0.09, -h * 0.09, w * 0.18, h * 0.18);          // the print
      break;
    }
    case 'network_rack': {
      // Cabinet rect + a stack of thin rack-unit / drive-bay dashes toward the
      // front (-Y / top) edge. The health LED is drawn by drawFurniture (it
      // needs live state, which this pure primitive painter never sees).
      const tower = piece.rack?.shape === 'tower';
      ctx.fillStyle = bodyFill('rgba(43,50,56,0.62)', 0.62);
      ctx.strokeStyle = '#78848c'; ctx.lineWidth = 1.5;
      ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = 'rgba(15,20,23,0.95)';
      const rows = tower ? 4 : 5;
      for (let i = 0; i < rows; i++) {
        const ry = y + h * (0.12 + 0.155 * i);
        if (tower) ctx.fillRect(x + w * 0.3, ry, w * 0.4, Math.max(1.5, h * 0.085));
        else ctx.fillRect(x + w * 0.12, ry, w * 0.76, Math.max(1.5, h * 0.075));
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
    case 'trash_bin':
    case 'recycle_bin': {
      // Wheeled curbside bin (plan view): body rect + lid line at the front
      // (hinge on the -Y/front edge), two wheel ticks at the back (+Y/top).
      // EMPTY → desaturated body, closed lid; FULL → brighter + a fill dot.
      const isRecycle = kind === 'recycle_bin';
      const baseHex = piece.color ?? (isRecycle ? '#1f6fb2' : '#3a3f45');
      fill(hexToRgba(baseHex, binFull ? 0.72 : 0.42));
      stroke(isRecycle ? '#4fa3dd' : '#9aa0a6');
      // Lid line across the body near the front (hinge) edge.
      ctx.strokeStyle = binFull ? '#ffd54f' : (isRecycle ? '#4fa3dd' : '#9aa0a6');
      ctx.lineWidth = binFull ? 2.5 : 1.5;
      ctx.beginPath(); ctx.moveTo(x + 3, y + h * 0.24); ctx.lineTo(x + w - 3, y + h * 0.24); ctx.stroke();
      // Recycle emblem hint: a small ♻ triangle glyph on the front panel.
      if (isRecycle) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = `${Math.max(8, Math.min(halfW, halfH) * 0.9)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('♻', 0, h * 0.12);
      }
      // Wheel ticks at the back edge.
      ctx.fillStyle = '#20242a';
      ctx.fillRect(x + w * 0.14, y + h - 5, w * 0.12, 5);
      ctx.fillRect(x + w * 0.74, y + h - 5, w * 0.12, 5);
      // FULL fill dot at the front-right corner.
      if (binFull) {
        ctx.fillStyle = 'rgba(255,213,79,0.95)';
        ctx.beginPath(); ctx.arc(x + w - 8, y + 8, 4, 0, 2 * Math.PI); ctx.fill();
      }
      break;
    }
    // ── outdoor / yard objects ──
    case 'tree':
    case 'bush': {
      // Canopy circle + trunk dot.
      const r = Math.min(halfW, halfH);
      ctx.fillStyle = bodyFill(kind === 'bush' ? 'rgba(79,145,48,0.6)' : 'rgba(63,125,46,0.6)', 0.6);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = kind === 'bush' ? '#3f7d2e' : '#2f6d3a'; ctx.lineWidth = 1; ctx.stroke();
      if (kind === 'tree') {
        ctx.fillStyle = 'rgba(107,74,43,0.9)';
        ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, 2 * Math.PI); ctx.fill();
      }
      break;
    }
    case 'pine_tree': {
      // Concentric triangle hint (top-down cone stack).
      const r = Math.min(halfW, halfH);
      ctx.fillStyle = bodyFill('rgba(47,109,58,0.6)', 0.6);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#2f6d3a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, 2 * Math.PI); ctx.stroke();
      ctx.fillStyle = 'rgba(107,74,43,0.9)';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.16, 0, 2 * Math.PI); ctx.fill();
      break;
    }
    // Additional tree species — same top-down language as tree/pine_tree
    // (canopy disc + trunk dot) with one distinguishing touch each.
    case 'oak_tree': {
      // Broad canopy with three overlapping lobes read as scallops.
      const r = Math.min(halfW, halfH);
      ctx.fillStyle = bodyFill('rgba(74,124,47,0.6)', 0.6);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#3d6828'; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = 'rgba(61,104,40,0.85)';
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * 2 * Math.PI - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36, r * 0.44, 0, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(107,74,43,0.9)';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.16, 0, 2 * Math.PI); ctx.fill();
      break;
    }
    case 'birch_tree': {
      // Airy LIGHT canopy + a white trunk dot.
      const r = Math.min(halfW, halfH);
      ctx.fillStyle = bodyFill('rgba(143,201,90,0.55)', 0.55);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#7fbf4d'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(232,228,220,0.95)';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = 'rgba(58,58,56,0.9)';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, 2 * Math.PI); ctx.stroke();
      break;
    }
    case 'palm_tree': {
      // Frond star radiating from the crown.
      const r = Math.min(halfW, halfH);
      ctx.fillStyle = bodyFill('rgba(79,158,58,0.4)', 0.4);
      ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#4f9e3a'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(138,107,69,0.95)';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.16, 0, 2 * Math.PI); ctx.fill();
      break;
    }
    case 'willow_tree': {
      // Dome + a dashed fringe ring for the hanging drapes.
      const r = Math.min(halfW, halfH);
      ctx.fillStyle = bodyFill('rgba(106,156,71,0.55)', 0.55);
      ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#6a9c47'; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = 'rgba(127,174,82,0.9)';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 2 * Math.PI;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72, r * 0.14, 0, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(107,84,57,0.9)';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, 2 * Math.PI); ctx.fill();
      break;
    }
    case 'spruce_tree': {
      // Like the pine hint but denser + a dark blue-green outer ring.
      const r = Math.min(halfW, halfH);
      ctx.fillStyle = bodyFill('rgba(44,95,82,0.6)', 0.6);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#1f4a40'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = 'rgba(31,74,64,0.85)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.68, 0, 2 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, 2 * Math.PI); ctx.stroke();
      ctx.fillStyle = 'rgba(92,70,48,0.9)';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, 2 * Math.PI); ctx.fill();
      break;
    }
    case 'flower_bed': {
      fill(bodyFill('rgba(92,61,34,0.5)', 0.5));
      stroke('#5c3d22');
      const cols = ['#e23b6d', '#f2c53d', '#e07be0', '#ff8c42'];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = cols[i % cols.length];
        const fx = x + w * (0.15 + 0.7 * (i / 4));
        ctx.beginPath(); ctx.arc(fx, 0, Math.min(halfW, halfH) * 0.22, 0, 2 * Math.PI); ctx.fill();
      }
      break;
    }
    case 'bird_bath':
    case 'fountain': {
      const r = Math.min(halfW, halfH);
      ctx.fillStyle = bodyFill('rgba(168,174,180,0.55)', 0.55);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#8a9096'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(61,123,184,0.75)';
      ctx.beginPath(); ctx.arc(0, 0, r * (kind === 'fountain' ? 0.5 : 0.65), 0, 2 * Math.PI); ctx.fill();
      break;
    }
    case 'rock_cluster': {
      // A few overlapping grey boulder blobs (deterministic offsets so the RAF
      // redraw doesn't flicker). Larger stones in back, smaller in front.
      const base = piece.color ?? '#8b8f93';
      const blobs: [number, number, number, string][] = [
        [-0.22, -0.10, 0.42, '#7c8085'],
        [0.20, 0.08, 0.46, base],
        [-0.05, 0.24, 0.30, '#9aa0a5'],
        [0.30, -0.22, 0.24, '#83878c'],
      ];
      for (const [ox, oy, rr, col] of blobs) {
        ctx.fillStyle = piece.color ? hexToRgba(piece.color, 0.85) : col;
        ctx.beginPath();
        ctx.ellipse(ox * w, oy * h, rr * halfW, rr * halfH, 0, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.strokeStyle = '#5f6469'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0.20 * w, 0.08 * h, 0.46 * halfW, 0.46 * halfH, 0, 0, 2 * Math.PI); ctx.stroke();
      break;
    }
    case 'swingset': {
      fill(bodyFill('rgba(138,90,43,0.22)', 0.22));
      ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 1.5;
      // A-frame diagonals from top-center to both end corners.
      ctx.beginPath();
      ctx.moveTo(x, y + h); ctx.lineTo(0, y); ctx.lineTo(x + w, y + h);
      ctx.moveTo(x, y); ctx.lineTo(0, y + h); ctx.lineTo(x + w, y); ctx.stroke();
      // top beam
      ctx.beginPath(); ctx.moveTo(x + 3, y + h * 0.5); ctx.lineTo(x + w - 3, y + h * 0.5); ctx.stroke();
      // two swing seats
      ctx.fillStyle = '#2e6da4';
      ctx.fillRect(x + w * 0.28 - 6, y + h * 0.5, 12, h * 0.28);
      ctx.fillRect(x + w * 0.72 - 6, y + h * 0.5, 12, h * 0.28);
      break;
    }
    case 'lawn_chair': {
      fill(bodyFill('rgba(46,139,139,0.4)', 0.4));
      stroke('#2e8b8b');
      // backrest bar at the back (+Y/top) edge, slat lines across.
      ctx.strokeStyle = '#1f6b6b'; ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const yy = y + h * (0.25 + 0.18 * i);
        ctx.beginPath(); ctx.moveTo(x + 3, yy); ctx.lineTo(x + w - 3, yy); ctx.stroke();
      }
      break;
    }
    case 'picnic_table': {
      fill(bodyFill('rgba(138,106,68,0.45)', 0.45));
      stroke('#8a6a44');
      // bench strips along both long edges.
      ctx.fillStyle = 'rgba(138,106,68,0.7)';
      ctx.fillRect(x, y + 1, w, h * 0.14);
      ctx.fillRect(x, y + h - h * 0.14 - 1, w, h * 0.14);
      break;
    }
    // ── home theater ──
    case 'speaker_tower':
    case 'speaker_bookshelf': {
      // Slim dark cabinet + stacked driver circles down the front (-Y/bottom edge
      // is the functional front). Tower gets 3 drivers, bookshelf 2.
      fill(bodyFill('rgba(26,26,26,0.8)', 0.8));
      stroke('#5a5a5a');
      const n = kind === 'speaker_tower' ? 3 : 2;
      ctx.strokeStyle = '#8a8a8a'; ctx.fillStyle = 'rgba(10,10,10,0.9)'; ctx.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        const dy = y + h * (0.72 - 0.42 * (i / Math.max(1, n - 1)));
        const dr = Math.min(halfW, halfH) * (0.5 - 0.11 * i);
        ctx.beginPath(); ctx.arc(0, dy, Math.max(1.5, dr), 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      }
      break;
    }
    case 'subwoofer': {
      // Squat cube + one large front driver circle.
      fill(bodyFill('rgba(17,17,17,0.85)', 0.85));
      stroke('#555');
      ctx.strokeStyle = '#8a8a8a'; ctx.fillStyle = 'rgba(8,8,8,0.92)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, y + h * 0.62, Math.min(halfW, halfH) * 0.72, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      break;
    }
    case 'center_channel': {
      // Wide short horizontal cabinet + 2 flanking drivers + a center tweeter dot.
      fill(bodyFill('rgba(22,22,22,0.82)', 0.82));
      stroke('#555');
      ctx.strokeStyle = '#8a8a8a'; ctx.fillStyle = 'rgba(8,8,8,0.92)'; ctx.lineWidth = 1;
      const cr = Math.min(halfW * 0.5, halfH) * 0.72;
      for (const dx of [-0.34, 0.34]) {
        ctx.beginPath(); ctx.arc(dx * w, y + h * 0.6, cr, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, y + h * 0.6, cr * 0.45, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
      break;
    }
    case 'theater_recliner':
    case 'recliner_row3': {
      // Sofa-like plush seating: back band on the +Y (top) edge, thick arms on
      // the outer ends, and per-seat cushion splits (row = 3 seats).
      fill(bodyFill('rgba(43,35,32,0.7)', 0.7));
      stroke('#7a6a60');
      const nSeats = kind === 'recliner_row3' ? 3 : 1;
      // Back band along the top.
      ctx.fillStyle = '#1c1714';
      ctx.fillRect(x, y, w, Math.max(4, h * 0.2));
      // Thick arms on left/right ends.
      const armW = Math.max(4, w * (kind === 'recliner_row3' ? 0.045 : 0.15));
      ctx.fillRect(x, y, armW, h);
      ctx.fillRect(x + w - armW, y, armW, h);
      // Inner seat-divider ticks.
      ctx.strokeStyle = '#4a3f39'; ctx.lineWidth = 1.5;
      for (let i = 1; i < nSeats; i++) {
        const sx = x + (w * i) / nSeats;
        ctx.beginPath(); ctx.moveTo(sx, y + h * 0.22); ctx.lineTo(sx, y + h - 3); ctx.stroke();
      }
      break;
    }
    case 'riser_platform': {
      // Walkable tiered deck: dark carpeted fill with a lighter step-edge lip on
      // the front (-Y/bottom) edge and corner ticks.
      fill(bodyFill('rgba(42,38,34,0.55)', 0.55));
      stroke('#6b625c');
      ctx.strokeStyle = '#8d837b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 3, y + h - 2); ctx.lineTo(x + w - 3, y + h - 2); ctx.stroke();
      // Step tick marks along the front lip.
      ctx.lineWidth = 1;
      const nTicks = Math.max(4, Math.round(w / (halfW > 0 ? Math.max(30, halfW * 0.5) : 60)));
      for (let i = 1; i < nTicks; i++) {
        const sx = x + (w * i) / nTicks;
        ctx.beginPath(); ctx.moveTo(sx, y + h - 2); ctx.lineTo(sx, y + h - 2 - Math.min(8, h * 0.14)); ctx.stroke();
      }
      break;
    }
    // ── mailbox ──
    case 'mailbox': {
      // Curbside tunnel box (plan view): body rect + the door seam at the FRONT
      // (-Y/bottom) edge + the red side flag on the +X side.
      const ghost = extra?.ghost;
      fill(bodyFill('rgba(35,39,43,0.55)', 0.5));
      stroke('#78909c');
      // Door seam ON the front edge (the door is a panel proud of that face).
      ctx.strokeStyle = extra?.mailLidOpen ? '#ffb74d' : '#90a4ae';
      ctx.lineWidth = extra?.mailLidOpen ? 2.5 : 1.5;
      const seamY = y + h - Math.max(2, h * 0.08);
      ctx.beginPath(); ctx.moveTo(x + 3, seamY); ctx.lineTo(x + w - 3, seamY); ctx.stroke();
      // Signal flag on the +x (right) side. NB the 3D builder hangs its rig off
      // local −X: the 3D scene mirrors X (`_w` = fw/2 − wx), so builder-local −X
      // and plan-local +x are the SAME world flank (world +X = the box's left as
      // you face the door). The arm hinges about a quarter back from the front
      // and swings in the side plane between HORIZONTAL-REARWARD (DOWN — the
      // user-directed 180° X flip of the earlier forward-pointing pose) and
      // VERTICAL (UP):
      //   DOWN → the arm lies in the plan: a red line running from the pivot
      //          toward the REAR (top), flag head at the far end.
      //   UP   → the arm stands out of the plan, so it foreshortens to a bright
      //          blob at the pivot. (A plan view genuinely cannot show "up" as
      //          length — the inverse of what a lowered flag shows.)
      const flagX = x + w + 2, flagPivotY = y + h * 0.76;
      const flagUp2d = extra?.mailFlagUp === true;
      if (!flagUp2d) {
        const armEndY = flagPivotY - h * 0.45;
        const padW = Math.max(3, halfW * 0.22), padLen = Math.max(3, h * 0.19);
        ctx.strokeStyle = '#c62828';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(flagX, flagPivotY); ctx.lineTo(flagX, armEndY); ctx.stroke();
        ctx.fillStyle = '#c62828';
        ctx.fillRect(flagX - padW / 2, armEndY, padW, padLen);
      }
      // Pivot marker (always); raised, it is ALL the plan can show of the flag.
      ctx.fillStyle = flagUp2d ? '#e53935' : '#c62828';
      ctx.beginPath();
      ctx.arc(flagX, flagPivotY, Math.max(1.6, halfW * (flagUp2d ? 0.22 : 0.12)), 0, 2 * Math.PI);
      ctx.fill();
      if (ghost) { /* mailbox is never ghosted; kept for signature symmetry */ }
      break;
    }
    // ── vehicle / garage ──
    case 'car': {
      // Sedan silhouette (plan view): body rect + narrower cabin band + 4 wheel
      // ticks + light hints. Ghosted (empty bay) → dim dashed outline only.
      const ghost = extra?.ghost;
      const baseHex = piece.color ?? '#37516b';
      if (ghost) {
        ctx.save();
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = hexToRgba(baseHex, 0.35);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
        // faint "away" caption
        ctx.fillStyle = hexToRgba(baseHex, 0.4);
        ctx.font = `${Math.max(8, Math.min(halfW, halfH) * 0.3)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('away', 0, 0);
        break;
      }
      fill(hexToRgba(baseHex, 0.72));
      stroke(lighten(baseHex, 0.3));
      // Cabin band (greenhouse) — a lighter inset rect around the middle.
      ctx.fillStyle = 'rgba(20,28,36,0.65)';
      ctx.fillRect(x + w * 0.14, y + h * 0.28, w * 0.72, h * 0.32);
      // Wheel ticks at the four corners (short bars along the sides).
      ctx.fillStyle = '#15181c';
      const ww = w * 0.1, wl = h * 0.16;
      for (const sy of [y + h * 0.16, y + h - h * 0.16 - wl]) {
        ctx.fillRect(x - 2, sy, ww * 0.6, wl);
        ctx.fillRect(x + w - ww * 0.6 + 2, sy, ww * 0.6, wl);
      }
      // Headlight hints at the front (-Y/bottom) edge.
      ctx.fillStyle = 'rgba(255,244,194,0.9)';
      ctx.fillRect(x + w * 0.18 - 4, y + h - 4, 8, 3);
      ctx.fillRect(x + w * 0.82 - 4, y + h - 4, 8, 3);
      break;
    }
    case 'ev_charger': {
      // Wall-post EVSE: post rect + head-unit rect + a state-colored LED port on
      // the front (-Y) edge + a short coiled-cable doodle beside it.
      fill(bodyFill('rgba(47,50,55,0.6)', 0.6));
      stroke('#8a9096');
      // Head unit (brighter band near the top/back).
      ctx.fillStyle = 'rgba(70,74,80,0.85)';
      ctx.fillRect(x + 2, y + 2, w - 4, h * 0.42);
      // LED / port dot on the front-center.
      ctx.fillStyle = '#00e676';
      ctx.beginPath(); ctx.arc(0, y + h * 0.62, Math.max(3, Math.min(halfW, halfH) * 0.28), 0, 2 * Math.PI); ctx.fill();
      // Coiled-cable doodle: two nested arcs off the -X side.
      ctx.strokeStyle = '#20242a'; ctx.lineWidth = 1.5;
      for (const rr of [0.5, 0.75]) {
        ctx.beginPath(); ctx.arc(x - 2, 0, Math.min(halfW, halfH) * rr, -Math.PI * 0.4, Math.PI * 0.4); ctx.stroke();
      }
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

// Plan-view fire pit (round + square): a real-scale FIREPIT_SIZE_MM footprint —
// stone rim + ash basin + crossed logs — with a warm flickering inner glow while
// the bound light is ON and a cold dark basin while off. Same idioms as
// drawFireplace2D: true mm scale (never a fixed-px icon) and time-based sines,
// since the canvas redraws every RAF. Stone jitter is index-hashed, mirroring
// the 3D builder's determinism.
function drawFirepit2D(ctx: CanvasRenderingContext2D, cx0: number, cy0: number,
                       view: View, square: boolean, isOn: boolean,
                       unavail: boolean, bound: boolean): void {
  const t = performance.now() / 1000;
  const R = Math.max(9, (FIREPIT_SIZE_MM / 2) * view.scale);   // outer half-extent, px
  const rimW = R * 0.245;                                      // rim thickness (110/450)
  ctx.save();
  ctx.translate(cx0, cy0);
  // Ash basin (the pit interior) — drawn first, the rim overlaps its edge.
  ctx.beginPath();
  if (square) ctx.rect(-R, -R, R * 2, R * 2);
  else ctx.arc(0, 0, R, 0, 2 * Math.PI);
  ctx.fillStyle = '#17120f';
  ctx.fill();
  // Stone rim.
  ctx.lineWidth = rimW;
  ctx.strokeStyle = unavail ? '#7a3a3a' : bound ? '#7c756c' : '#6a6a72';
  ctx.beginPath();
  if (square) ctx.rect(-R + rimW / 2, -R + rimW / 2, (R - rimW / 2) * 2, (R - rimW / 2) * 2);
  else ctx.arc(0, 0, R - rimW / 2, 0, 2 * Math.PI);
  ctx.stroke();
  // Stone joints — nine ticks around the ring for the round pit, four corner
  // marks for the square one. Deterministic, no per-frame jitter.
  ctx.lineWidth = Math.max(0.7, rimW * 0.13);
  ctx.strokeStyle = 'rgba(20,18,16,0.55)';
  const joints = square ? 4 : 9;
  for (let i = 0; i < joints; i++) {
    const a = (i / joints) * Math.PI * 2 + (square ? Math.PI / 4 : 0);
    const ux = Math.cos(a), uy = Math.sin(a);
    ctx.beginPath();
    ctx.moveTo(ux * (R - rimW), uy * (R - rimW));
    ctx.lineTo(ux * R, uy * R);
    ctx.stroke();
  }
  const inner = R - rimW;
  if (isOn) {
    // Ember bed: a warm radial wash filling the basin, breathing slowly.
    const emberA = 0.45 + 0.12 * Math.sin(t * 1.6);
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(1, inner));
    grd.addColorStop(0, `rgba(255,196,86,${(emberA + 0.25).toFixed(3)})`);
    grd.addColorStop(0.55, `rgba(255,112,26,${emberA.toFixed(3)})`);
    grd.addColorStop(1, 'rgba(191,54,12,0.05)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(0, 0, inner, 0, 2 * Math.PI); ctx.fill();
  }
  // Crossed logs over the basin (drawn over the embers, like the 3D pile).
  ctx.strokeStyle = isOn ? '#5a3c2c' : '#4e342e';
  ctx.lineWidth = Math.max(1.2, inner * 0.19);
  ctx.lineCap = 'round';
  for (const a of [0.40, -0.75, 1.45]) {
    const ux = Math.cos(a), uy = Math.sin(a), L = inner * 0.78;
    ctx.beginPath();
    ctx.moveTo(-ux * L, -uy * L);
    ctx.lineTo(ux * L, uy * L);
    ctx.stroke();
  }
  if (isOn) {
    // Flame tongues seen from above: three swaying blobs + a hot core.
    for (const fl of [
      { ox: -0.32, oz: 0.16, rad: 0.34, om: 1.7, ph: 0.0, col: '230,81,0' },
      { ox: 0.30, oz: -0.14, rad: 0.30, om: 2.1, ph: 2.1, col: '239,108,0' },
      { ox: 0.02, oz: 0.27, rad: 0.28, om: 2.4, ph: 3.6, col: '245,124,0' },
    ]) {
      const rr = inner * fl.rad * (1 + 0.18 * Math.sin(t * fl.om + fl.ph));
      const sway = inner * 0.08 * Math.sin(t * fl.om * 0.8 + fl.ph * 1.7);
      ctx.fillStyle = `rgba(${fl.col},0.8)`;
      ctx.beginPath();
      ctx.arc(inner * fl.ox + sway, inner * fl.oz, Math.max(0.8, rr), 0, 2 * Math.PI);
      ctx.fill();
    }
    const coreR = inner * 0.30 * (1 + 0.14 * Math.sin(t * 1.9 + 1.1));
    ctx.fillStyle = 'rgba(255,213,79,0.95)';
    ctx.beginPath(); ctx.arc(0, 0, Math.max(0.8, coreR), 0, 2 * Math.PI); ctx.fill();
  } else {
    // Cold pit: a few faint embers pulsing at half a hertz (the hearth idiom).
    const pulse = 0.22 + 0.10 * Math.sin(t * 0.9);
    ctx.fillStyle = `rgba(255,112,67,${pulse.toFixed(3)})`;
    for (const [ex, ey] of [[-0.34, 0.12], [0.08, -0.28], [0.30, 0.22]] as const) {
      ctx.beginPath();
      ctx.arc(inner * ex, inner * ey, Math.max(0.9, inner * 0.09), 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawFixtures(ctx: CanvasRenderingContext2D, p: Planner, view: View,
                      showLights = true, showSwitches = true): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const names = objectLabelsOn(p);
  const fxBodyR = Math.max(6, 180 * view.scale);

  if (showLights) for (const l of f.lights) {
    const pt = mmToPx(view, l.x, l.y);
    const st = p.effectiveState(l);
    const isOn = st?.state === 'on';
    const unavail = st && (st.state === 'unavailable' || st.state === 'unknown');
    const attrs = (st?.attributes || {}) as Record<string, unknown>;
    const rgb = Array.isArray(attrs.rgb_color) && (attrs.rgb_color as number[]).length === 3
      ? attrs.rgb_color as number[] : null;
    const bri = typeof attrs.brightness === 'number' ? attrs.brightness as number : 255;
    const kelvin = typeof attrs.color_temp_kelvin === 'number' ? attrs.color_temp_kelvin as number : null;
    const kind = lightIconKind(l);
    let r = 255, g = 230, b = 180;
    if ((kind === 'fireplace' || isFirepitKind(kind)) && isOn) {
      // Hearth / fire pit always glows warm; flicker tint via mild noise.
      const f1 = 0.85 + Math.random() * 0.15;
      r = Math.round(255 * f1); g = Math.round(120 * f1); b = Math.round(40 * f1);
    } else if (rgb && isOn) [r, g, b] = rgb;
    else if (kelvin && isOn) {
      const t = Math.max(0, Math.min(1, (kelvin - 2000) / 4500));
      r = 255; g = Math.round(180 + 75 * t); b = Math.round(110 + 145 * t);
    }
    if (isOn) {
      const intensity = lightIntensity(l);
      const flashMul = (attrs as Record<string, unknown>)._flash ? 0.4 + 0.6 * Math.abs(Math.sin(performance.now() / 260)) : 1;
      const alpha = Math.min(1, (0.25 + 0.45 * (bri / 255)) * intensity) * flashMul;
      const glowR = lightRadius(l) * view.scale;  // user-controlled pool of light
      const grd = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, glowR);
      grd.addColorStop(0, `rgba(${r},${g},${b},${alpha.toFixed(3)})`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, glowR, 0, 2 * Math.PI); ctx.fill();
    }
    if (kind === 'fireplace') {
      drawFireplace2D(ctx, pt.x, pt.y, view, isOn, !!unavail, !!st, lightRotation(l));
    } else if (isFirepitKind(kind)) {
      // Real-scale plan footprint (no rotation — a fire pit has no front).
      drawFirepit2D(ctx, pt.x, pt.y, view, kind === 'firepit_square', isOn, !!unavail, !!st);
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
      ctx.strokeStyle = !st ? '#888' : isOn ? '#fff' : unavail ? '#c62828' : '#555';
      ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = `${Math.max(9, fxBodyR * 1.1)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = isOn ? '#2a2a2a' : '#d0d0d0';
      ctx.fillText(LIGHT_GLYPH[kind] || '💡', pt.x, pt.y);
    }
    if (l.label && names) {
      ctx.fillStyle = '#ddd'; ctx.font = `${10 * dpr}px sans-serif`;
      ctx.fillText(l.label, pt.x, pt.y + fxBodyR + 10 * dpr);
    }
  }

  if (showSwitches) for (const sw of f.switches) {
    const pt = mmToPx(view, sw.x, sw.y);
    const st = p.effectiveState(sw);
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
    ctx.strokeStyle = !st ? '#888' : isOn ? '#4caf50' : unavail ? '#c62828' : '#777';
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
    if (sw.label && names && switchLabelPos(sw) !== 'hide') {
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
  // Battery: an LD2450 device is usually mains-powered, but honor a battery
  // sibling if HA exposes one — resolve via any discovered entity on the device.
  const dpr = window.devicePixelRatio || 1;
  for (const s of f.sensors) {
    const disc = p.discBy[s.id];
    const repEnt = disc?.hasTarget ?? disc?.targetCount ?? disc?.sensorHeight ?? null;
    if (!repEnt) continue;
    const c = mmToPx(view, s.x, s.y);
    drawBatteryBadge(ctx, p, repEnt, c.x + 10 * dpr, c.y - 10 * dpr);
  }
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
  if (objectLabelsOn(p)) {
    const txt = s.label || 'Sensor';
    const tw = ctx.measureText(txt).width + 8 * dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(c.x - tw / 2, c.y + 14 * dpr, tw, 15 * dpr);
    ctx.fillStyle = '#fff';
    ctx.fillText(txt, c.x, c.y + 16 * dpr);
  }
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
    // The sensor-NAME prefix (only used when several sensors are bound) rides
    // objectLabels; the zone/object label itself is content under `zones`.
    const prefixLabel = (txt: string) =>
      (multipleBound && objectLabelsOn(p)) ? `${s.label || 'Sensor'} · ${txt}` : txt;

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

// Frigate ground-truth camera targets (Phase 5): a camera-tinted dot with a
// small 📷 badge, distinguishing it from mmWave/BLE dots. Only targets whose
// owning camera is on the active floor draw here; gated by the `targets` layer.
// Fused people are drawn as identified radar/cam dots via drawTargets — but cam
// keys are radar-pool candidates in fusion, so a fused cam target adopts the
// person color + name label here (person label carried by p.fusions[key]).
function drawCamTargets(ctx: CanvasRenderingContext2D, p: Planner, view: View): void {
  const dpr = window.devicePixelRatio || 1;
  const f = p.floor();
  const nameLabelsOn = (p.store.layers2d?.nameLabels) !== false;
  for (const ct of p.camPeople) {
    if (ct.floorId !== f.id) continue;
    const fusion = p.fusions[ct.key];
    const color = fusion ? fusion.color : ct.color;
    const pt = mmToPx(view, ct.x, ct.y);
    ctx.save();
    // Dot.
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 6 * dpr, 0, 2 * Math.PI);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 * dpr; ctx.stroke();
    // 📷 badge above-right of the dot.
    ctx.font = `${9 * dpr}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('📷', pt.x + 9 * dpr, pt.y - 8 * dpr);
    if (fusion) {
      const chipBottom = drawInitialsChip(ctx, dpr, pt.x, pt.y, fusion.name, fusion.color);
      if (fusion.personId != null && nameLabelsOn)
        drawNameLabel(ctx, dpr, pt.x, chipBottom, fusion.name, fusion.color);
    }
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
