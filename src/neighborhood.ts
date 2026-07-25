// Neighborhood overlay — pure geometry pipeline (OpenFreeMap / OpenMapTiles).
// Turns decoded MVT tile layers into PLAN-frame features (buildings / roads /
// water / landuse), all in Diorama's world mm frame via the SAME landmark-fitted
// GeoTransform every GPS pin already uses.
//
// ISOLATION: imports only geo.ts helpers + TYPE-only from types.ts / mvt-decode.ts
// (esbuild strips those), so this stays light and standalone-bundleable. It does
// NOT import geometry.ts — the small polygon predicates it needs (point-in-poly,
// segment cross, signed area) are inlined here to keep the module dependency-free
// (the geo.ts idiom). Web-Mercator tile math is angle-only (no Earth radius) —
// see docs/research/neighborhood-openfreemap.md §5. All deterministic.

import { latLonToPlan, type GeoTransform } from './geo.js';
import type { Vec2 } from './types.js';
import type { MvtLayer } from './mvt-decode.js';

export const DEFAULT_TILE_ZOOM = 14;      // OpenMapTiles building layer is present at z13–14; z14 = full detail
export const MAX_BUILDINGS = 400;         // nearest-by-centroid cap at the REFERENCE radius (see CAP_REF_RADIUS_M)
export const MAX_ROADS = 600;             // road-ribbon cap at the reference radius (renderer default)

// Reference radius the two base caps were tuned against. Bigger fetch radii
// scale their caps LINEARLY off this (not by area — the caps exist to bound
// mesh count, and a linear ramp keeps a 3 km overlay drawable on a tablet while
// still letting far content through; the hard ceilings below are the real
// guard). Both helpers are pure + monotonic.
export const CAP_REF_RADIUS_M = 500;
export const MAX_BUILDINGS_CEIL = 1600;
export const MAX_ROADS_CEIL = 1800;

// Nearest-N building cap for a fetch radius (m). Never below MAX_BUILDINGS.
export function buildingCapForRadius(radiusM: number): number {
  const r = isFinite(radiusM) ? radiusM : CAP_REF_RADIUS_M;
  const n = Math.round((MAX_BUILDINGS * r) / CAP_REF_RADIUS_M);
  return Math.max(MAX_BUILDINGS, Math.min(MAX_BUILDINGS_CEIL, n));
}

// Road-ribbon cap for a fetch radius (m). Never below MAX_ROADS.
export function roadCapForRadius(radiusM: number): number {
  const r = isFinite(radiusM) ? radiusM : CAP_REF_RADIUS_M;
  const n = Math.round((MAX_ROADS * r) / CAP_REF_RADIUS_M);
  return Math.max(MAX_ROADS, Math.min(MAX_ROADS_CEIL, n));
}

export interface TileAddr { z: number; x: number; y: number; }

export interface NbBuilding { points: Vec2[]; heightMm: number; baseMm: number; }
export interface NbRoad { points: Vec2[]; widthMm: number; cls: string; bridge: boolean; }
export interface NbPatch { points: Vec2[]; cls: string; }

export interface NeighborhoodFeatures {
  buildings: NbBuilding[];
  roads: NbRoad[];
  water: NbPatch[];
  landuse: NbPatch[];
  fetchedAt: number;
  tileCount: number;
  tileAddrs: TileAddr[];
}

// ── Web-Mercator tile math (angle-only; no Earth-radius constant) ────────────
const DEG = Math.PI / 180;

// (lat, lon, zoom) → the z/x/y tile containing that point.
export function lonLatToTile(lat: number, lon: number, zoom: number): TileAddr {
  const n = Math.pow(2, zoom);
  const latR = clampLat(lat) * DEG;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.asinh(Math.tan(latR)) / Math.PI) / 2) * n);
  return { z: zoom, x: wrapX(x, n), y: clampInt(y, 0, n - 1) };
}

// Fractional position (fracX, fracY) in [0..1] within tile t → lat/lon. The
// inverse Gudermannian is the literal projection definition — exact, not an
// approximation (§5).
export function tileToLonLat(t: TileAddr, fracX: number, fracY: number): { lat: number; lon: number } {
  const n = Math.pow(2, t.z);
  const lon = ((t.x + fracX) / n) * 360 - 180;
  const lat = Math.atan(Math.sinh(Math.PI * (1 - (2 * (t.y + fracY)) / n))) / DEG;
  return { lat, lon };
}

// Every tile covering the axis-aligned lat/lon bbox of `radiusM` around
// (lat, lon), at `zoom`. A few hundred metres at z14 = 1–4 tiles.
export function tilesForRadius(lat: number, lon: number, radiusM: number, zoom: number): TileAddr[] {
  const r = Math.max(0, radiusM);
  const dLat = r / 111320;
  const dLon = r / (111320 * Math.max(0.05, Math.cos(clampLat(lat) * DEG)));
  const nw = lonLatToTile(lat + dLat, lon - dLon, zoom);
  const se = lonLatToTile(lat - dLat, lon + dLon, zoom);
  const minX = Math.min(nw.x, se.x), maxX = Math.max(nw.x, se.x);
  const minY = Math.min(nw.y, se.y), maxY = Math.max(nw.y, se.y);
  const out: TileAddr[] = [];
  for (let x = minX; x <= maxX; x++)
    for (let y = minY; y <= maxY; y++)
      out.push({ z: zoom, x, y });
  return out;
}

function clampLat(lat: number): number { return Math.max(-85.05112878, Math.min(85.05112878, lat)); }
function wrapX(x: number, n: number): number { return ((x % n) + n) % n; }
function clampInt(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }

// ── Road class → ribbon width (mm) ──────────────────────────────────────────
// Ordinary real-world lane norms (not surveyed per-road — same honesty caveat as
// building height). The renderer wave buffers a centerline to this width.
export const ROAD_WIDTH_MM: Record<string, number> = {
  motorway: 11000, trunk: 11000,
  primary: 7000, secondary: 7000,
  tertiary: 6000, minor: 6000, residential: 6000, unclassified: 6000, living_street: 6000,
  service: 3000, track: 3000, raceway: 3000,
  path: 1200, footway: 1200, pedestrian: 1200, steps: 1200, cycleway: 1200,
};
export function roadWidthMm(cls: string): number {
  return ROAD_WIDTH_MM[cls] ?? 4000;
}

// ── Building height resolution (ORCHESTRATOR PIN) ───────────────────────────
// render_height when present (>0) → else building:levels × defaultLevelHeightM →
// else defaultLevelHeightM (one storey). We do NOT try to detect OpenMapTiles'
// internal fallbacks. Returns METRES.
export function resolveBuildingHeightM(tags: Record<string, unknown>, defaultLevelHeightM: number): number {
  const rh = num(tags.render_height);
  if (rh != null && rh > 0) return rh;
  const levels = num(tags['building:levels']);
  if (levels != null && levels > 0) return levels * defaultLevelHeightM;
  return defaultLevelHeightM;
}

// render_min_height (podium base) in METRES; 0 when absent.
export function resolveBuildingBaseM(tags: Record<string, unknown>): number {
  const mh = num(tags.render_min_height);
  return mh != null && mh > 0 ? mh : 0;
}

function num(v: unknown): number | null {
  if (typeof v === 'number') return isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') { const n = Number(v); return isFinite(n) ? n : null; }
  return null;
}

// ── Inlined polygon predicates (keeps this module geometry.ts-free) ──────────
export function pointInPolygon(px: number, py: number, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    const hit = (yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

// Signed area via the MVT 2.1 "surveyor's formula" on TILE coords (y-down):
// exterior rings are POSITIVE, interior rings (holes) NEGATIVE. Used to keep
// exterior footprints and drop holes at the data layer (renderer wave revisits
// holes). Exported so the test can assert winding directly.
export function signedArea(ring: Vec2[]): number {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], q = ring[(i + 1) % ring.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

// Do segments AB and CD cross? (proper + collinear-overlap tolerant enough).
function segCross(a: Vec2, b: Vec2, c: Vec2, d: Vec2): boolean {
  const o = (p: Vec2, q: Vec2, r: Vec2) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  const o1 = o(a, b, c), o2 = o(a, b, d), o3 = o(c, d, a), o4 = o(c, d, b);
  return o1 !== o2 && o3 !== o4;
}

// ── Exclusion helpers (data-layer support this wave; PIN) ────────────────────
// (a) A building footprint (plan-mm polygon) intersects an exclusion polygon:
//     any vertex of one inside the other, or any edges cross. → drop it.
export function polygonIntersectsAny(points: Vec2[], exclusions: Vec2[][]): boolean {
  if (!exclusions || exclusions.length === 0 || points.length < 3) return false;
  for (const ex of exclusions) {
    if (!ex || ex.length < 3) continue;
    if (points.some(p => pointInPolygon(p.x, p.y, ex))) return true;
    if (ex.some(p => pointInPolygon(p.x, p.y, points))) return true;
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      for (let k = 0; k < ex.length; k++) {
        const c = ex[k], d = ex[(k + 1) % ex.length];
        if (segCross(a, b, c, d)) return true;
      }
    }
  }
  return false;
}

// (b) Drop road SEGMENTS whose midpoint falls inside any exclusion; reassemble
//     the surviving contiguous segments into sub-runs (each ≥2 points). A road
//     split in two by an exclusion returns two runs.
export function filterPolylineByExclusions(points: Vec2[], exclusions: Vec2[][]): Vec2[][] {
  if (points.length < 2) return [];
  if (!exclusions || exclusions.length === 0) return [points];
  const midIn = (a: Vec2, b: Vec2) => {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    return exclusions.some(ex => ex && ex.length >= 3 && pointInPolygon(mx, my, ex));
  };
  const runs: Vec2[][] = [];
  let cur: Vec2[] | null = null;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    if (midIn(a, b)) { if (cur) { runs.push(cur); cur = null; } continue; }
    if (!cur) { cur = [a]; }
    cur.push(b);
  }
  if (cur) runs.push(cur);
  return runs.filter(r => r.length >= 2);
}

// ── Nearest-N building cap (PIN) ─────────────────────────────────────────────
export function centroidOf(points: Vec2[]): Vec2 {
  let sx = 0, sy = 0;
  for (const p of points) { sx += p.x; sy += p.y; }
  const n = points.length || 1;
  return { x: sx / n, y: sy / n };
}
// `n` defaults to the reference cap so an old call site (and the renderer's own
// defensive path) keeps today's behavior; the Planner passes the radius-derived
// cap from buildingCapForRadius.
export function capBuildings(list: NbBuilding[], origin: Vec2, n: number = MAX_BUILDINGS): NbBuilding[] {
  if (list.length <= n) return list;
  const scored = list.map(b => ({ b, d: dist2(centroidOf(b.points), origin) }));
  scored.sort((p, q) => p.d - q.d);
  return scored.slice(0, n).map(s => s.b);
}
function dist2(a: Vec2, b: Vec2): number { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }

// ── Custom tile-URL validation + templating ─────────────────────────────────
// Accept only http(s) schemes for a custom source (PIN); everything else rejects.
export function tileTemplateSchemeOk(url: string | undefined | null): boolean {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim());
}
export function tileUrl(template: string, addr: TileAddr): string {
  return template
    .replace(/\{z\}/g, String(addr.z))
    .replace(/\{x\}/g, String(addr.x))
    .replace(/\{y\}/g, String(addr.y));
}

// ── align post-transform (dx/dy mm + rotDeg about the geo origin) ────────────
// Fine nudge ON TOP of the landmark GeoTransform. rotDeg uses the app's screen-CW
// convention ([[c, s], [-s, c]] — matches geometry.rotPointDeg) so a UI ↻ button
// reads intuitively later. Applied per-point during projection (i.e. "last",
// after the geo projection) so exclusions test the nudged plan geometry.
// Pure single-point align (exported for the golden test). Rotate p about origin
// by rotDeg (screen-CW: [[c, s], [-s, c]]), then translate by (dx, dy).
export function alignPlanPoint(p: Vec2, origin: Vec2, align?: { dx?: number; dy?: number; rotDeg?: number }): Vec2 {
  const dx = align?.dx ?? 0, dy = align?.dy ?? 0, rot = (align?.rotDeg ?? 0) * DEG;
  const c = Math.cos(rot), s = Math.sin(rot);
  const rx = p.x - origin.x, ry = p.y - origin.y;
  return { x: origin.x + (c * rx + s * ry) + dx, y: origin.y + (-s * rx + c * ry) + dy };
}
function makeAlign(origin: Vec2, align?: { dx?: number; dy?: number; rotDeg?: number }): (p: Vec2) => Vec2 {
  return (p: Vec2): Vec2 => alignPlanPoint(p, origin, align);
}

// ── The whole pipeline ───────────────────────────────────────────────────────
export interface BuildOpts {
  align?: { dx?: number; dy?: number; rotDeg?: number };
  exclusions?: Vec2[][];
  verticalScale?: number;         // clamp 0.2..3 by the caller; multiplies resolved heights
  defaultLevelHeightM?: number;   // clamp 2..5 by the caller
  layers?: { buildings?: boolean; roads?: boolean; water?: boolean; landuse?: boolean };
  fetchedAt?: number;
  maxBuildings?: number;
}

export interface DecodedTileInput { addr: TileAddr; layers: Record<string, MvtLayer>; }

// Decoded tiles (from cache/fetch) → plan-mm features. The align nudge is folded
// into the per-vertex projection; exclusion polygons drop whole buildings (by
// intersection) and split roads (by segment midpoint); buildings are capped to
// the nearest maxBuildings by centroid distance to the geo origin.
export function buildNeighborhoodFeatures(
  tiles: DecodedTileInput[],
  transform: GeoTransform,
  opts: BuildOpts = {},
): NeighborhoodFeatures {
  const fetchedAt = opts.fetchedAt ?? 0;
  const tileAddrs = tiles.map(t => t.addr);
  const empty: NeighborhoodFeatures = { buildings: [], roads: [], water: [], landuse: [], fetchedAt, tileCount: tiles.length, tileAddrs };
  if (transform.quality === 'none') return empty;

  const origin = latLonToPlan(transform, transform.originLat, transform.originLon) ?? { x: transform.tx, y: transform.ty };
  const align = makeAlign(origin, opts.align);
  const exclusions = opts.exclusions ?? [];
  const vScale = opts.verticalScale ?? 1;
  const levelH = opts.defaultLevelHeightM ?? 3;
  const want = {
    buildings: opts.layers?.buildings !== false,
    roads: opts.layers?.roads !== false,
    water: opts.layers?.water !== false,
    landuse: opts.layers?.landuse === true, // default OFF
  };

  // Project a tile-local ring/line to nudged plan mm. Returns null if the geo
  // transform can't project (quality none — already guarded above).
  const projectRun = (addr: TileAddr, extent: number, run: Array<{ x: number; y: number }>): Vec2[] | null => {
    const out: Vec2[] = [];
    for (const v of run) {
      const ll = tileToLonLat(addr, v.x / extent, v.y / extent);
      const plan = latLonToPlan(transform, ll.lat, ll.lon);
      if (!plan) return null;
      out.push(align(plan));
    }
    return out;
  };

  const buildings: NbBuilding[] = [];
  const roads: NbRoad[] = [];
  const water: NbPatch[] = [];
  const landuse: NbPatch[] = [];

  for (const tile of tiles) {
    if (want.buildings) extractBuildings(tile, projectRun, vScale, levelH, exclusions, buildings);
    if (want.roads) extractRoads(tile, projectRun, exclusions, roads);
    if (want.water) extractPolygons(tile.layers.water, tile.addr, projectRun, water);
    if (want.landuse) extractPolygons(tile.layers.landuse, tile.addr, projectRun, landuse);
  }

  const cap = opts.maxBuildings ?? MAX_BUILDINGS;
  const capped = capBuildings(buildings, origin, cap);

  return { buildings: capped, roads, water, landuse, fetchedAt, tileCount: tiles.length, tileAddrs };
}

type ProjectFn = (addr: TileAddr, extent: number, run: Array<{ x: number; y: number }>) => Vec2[] | null;

function extractBuildings(
  tile: DecodedTileInput, project: ProjectFn,
  vScale: number, levelH: number, exclusions: Vec2[][], out: NbBuilding[],
): void {
  const layer = tile.layers.building;
  if (!layer) return;
  for (const f of layer.features) {
    if (f.type !== 'polygon') continue;
    if (f.tags.hide_3d === true) continue;   // outline-only building parts (§3) — don't extrude
    const heightMm = resolveBuildingHeightM(f.tags, levelH) * 1000 * vScale;
    const baseMm = resolveBuildingBaseM(f.tags) * 1000 * vScale;
    // Emit one building per EXTERIOR ring (holes dropped this wave; handled at
    // render). Exterior = positive signed area in tile space (MVT y-down, CW).
    for (const ring of f.geometry) {
      if (ring.length < 3) continue;
      if (signedArea(ring) <= 0) continue;   // hole / degenerate
      const pts = project(tile.addr, layer.extent, ring);
      if (!pts || pts.length < 3) continue;
      if (polygonIntersectsAny(pts, exclusions)) continue;
      out.push({ points: pts, heightMm, baseMm });
    }
  }
}

function extractRoads(tile: DecodedTileInput, project: ProjectFn, exclusions: Vec2[][], out: NbRoad[]): void {
  const layer = tile.layers.transportation;
  if (!layer) return;
  for (const f of layer.features) {
    if (f.type !== 'line') continue;
    const cls = typeof f.tags.class === 'string' ? f.tags.class : 'unknown';
    const bridge = f.tags.brunnel === 'bridge';
    const widthMm = roadWidthMm(cls);
    for (const line of f.geometry) {
      if (line.length < 2) continue;
      const pts = project(tile.addr, layer.extent, line);
      if (!pts || pts.length < 2) continue;
      for (const run of filterPolylineByExclusions(pts, exclusions)) {
        out.push({ points: run, widthMm, cls, bridge });
      }
    }
  }
}

function extractPolygons(layer: MvtLayer | undefined, addr: TileAddr, project: ProjectFn, out: NbPatch[]): void {
  if (!layer) return;
  for (const f of layer.features) {
    if (f.type !== 'polygon') continue;
    const cls = typeof f.tags.class === 'string' ? f.tags.class : 'unknown';
    for (const ring of f.geometry) {
      if (ring.length < 3) continue;
      if (signedArea(ring) <= 0) continue;   // exterior rings only
      const pts = project(addr, layer.extent, ring);
      if (!pts || pts.length < 3) continue;
      out.push({ points: pts, cls });
    }
  }
}
