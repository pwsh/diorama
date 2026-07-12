// Geo reference math (the "World Outside" arc, Feature G). PURE + deterministic:
// no DOM, no state, no imports — same shape as trilateration.ts, so the test
// page (test-pages/geo-test.html) transpiles this single file with esbuild (no
// --bundle) and asserts against synthetic ground truth.
//
// Coordinate conventions
// ──────────────────────
// • Geographic: latitude / longitude in degrees (WGS84-ish; sphere model).
// • Local meters (projectLatLon): x = east-positive, y = NORTH-positive. This
//   is a raw ENU-ish tangent plane about an origin lat/lon. It is NOT the plan
//   frame — the caller (fitGeoTransform) absorbs the plan↔north rotation into
//   the fitted transform, so projectLatLon never pre-rotates.
// • Plan world frame (Diorama): +X right, +Y up, units MILLIMETRES.
//
// The fitted GeoTransform maps geo → plan: project lat/lon to local metres about
// (originLat, originLon), scale ×1000 to mm (plan mm are PHYSICAL — scale is
// FIXED at 1 in the fit), then rotate by thetaRad and translate by (tx, ty).

const EARTH_R = 6371000; // m — sphere radius; sub-mm error at house scale
const DEG = Math.PI / 180;

export interface LocalMeters { x: number; y: number; } // x east, y north

// Equirectangular tangent-plane projection about (lat0, lon0). Returns local
// metres with y NORTH-positive; the caller maps into the plan frame.
export function projectLatLon(lat: number, lon: number, lat0: number, lon0: number): LocalMeters {
  const lat0r = lat0 * DEG;
  return {
    x: (lon - lon0) * DEG * Math.cos(lat0r) * EARTH_R,
    y: (lat - lat0) * DEG * EARTH_R,
  };
}

// Inverse of projectLatLon — local metres (about the same origin) → lat/lon.
export function unprojectMeters(x: number, y: number, lat0: number, lon0: number): { lat: number; lon: number } {
  const lat0r = lat0 * DEG;
  return {
    lat: lat0 + (y / EARTH_R) / DEG,
    lon: lon0 + (x / (EARTH_R * Math.cos(lat0r))) / DEG,
  };
}

// One calibrated landmark: its plan position (mm) and real-world lat/lon.
export interface GeoPair { x: number; y: number; lat: number; lon: number; }

export interface GeoTransform {
  originLat: number; originLon: number; // projection origin (first calibrated landmark)
  thetaRad: number;                     // rotation applied to geo-mm before translation
  tx: number; ty: number;               // translation (plan mm)
  rmsMm: number;                        // RMS residual of the fit (mm; 0 for single/none)
  residualsMm: number[];                // per-input-pair residual (mm), aligned to `pairs`
  fittedScale: number;                  // Horn RMS scale ratio — DIAGNOSTIC ONLY (transform uses 1)
  quality: 'full' | 'single' | 'none';
}

// Fit a rigid (rotation + translation, SCALE FIXED AT 1) transform mapping
// geo → plan from calibrated landmark pairs.
//   • ≥2 pairs → 2D Procrustes closed form. `fittedScale` (the scale that WOULD
//     best fit) is computed as a quality diagnostic; a value far from 1 means a
//     bad landmark (or a units/projection mistake). The transform ignores it.
//   • 1 pair → translation + rotation from `northDeg` (compass bearing, deg CW
//     from true north, of plan +Y; default 0 → plan +Y faces true north).
//   • 0 pairs → quality 'none' (identity placeholder; not usable).
export function fitGeoTransform(pairs: GeoPair[], northDeg?: number): GeoTransform {
  if (pairs.length === 0) {
    return { originLat: 0, originLon: 0, thetaRad: 0, tx: 0, ty: 0,
             rmsMm: 0, residualsMm: [], fittedScale: 1, quality: 'none' };
  }

  const originLat = pairs[0].lat, originLon = pairs[0].lon;
  // Source points p_i = geo projected to mm; target points q_i = plan mm.
  const P = pairs.map(pr => {
    const m = projectLatLon(pr.lat, pr.lon, originLat, originLon);
    return { x: m.x * 1000, y: m.y * 1000 };
  });
  const Q = pairs.map(pr => ({ x: pr.x, y: pr.y }));

  if (pairs.length === 1) {
    // Single landmark: rotation from northDeg, translation pins the landmark.
    // Plan +Y points at compass bearing northDeg, so the geo→plan rotation is a
    // CCW rotation by northDeg (see the derivation note): [[c,-s],[s,c]].
    const theta = (northDeg ?? 0) * DEG;
    const c = Math.cos(theta), s = Math.sin(theta);
    // P[0] is (0,0) by construction (origin === the landmark), so t = Q[0].
    const tx = Q[0].x - (c * P[0].x - s * P[0].y);
    const ty = Q[0].y - (s * P[0].x + c * P[0].y);
    return { originLat, originLon, thetaRad: theta, tx, ty,
             rmsMm: 0, residualsMm: [0], fittedScale: 1, quality: 'single' };
  }

  // ── 2D Procrustes (rigid, scale forced to 1) ──────────────────────────────
  const n = pairs.length;
  const pBar = { x: P.reduce((a, v) => a + v.x, 0) / n, y: P.reduce((a, v) => a + v.y, 0) / n };
  const qBar = { x: Q.reduce((a, v) => a + v.x, 0) / n, y: Q.reduce((a, v) => a + v.y, 0) / n };
  let sxy = 0, sxx = 0, normP = 0, normQ = 0;
  for (let i = 0; i < n; i++) {
    const px = P[i].x - pBar.x, py = P[i].y - pBar.y;
    const qx = Q[i].x - qBar.x, qy = Q[i].y - qBar.y;
    // θ = atan2(Σ(px·qy − py·qx), Σ(px·qx + py·qy))
    sxy += px * qy - py * qx;
    sxx += px * qx + py * qy;
    normP += px * px + py * py;
    normQ += qx * qx + qy * qy;
  }
  const theta = Math.atan2(sxy, sxx);
  const c = Math.cos(theta), s = Math.sin(theta);
  const tx = qBar.x - (c * pBar.x - s * pBar.y);
  const ty = qBar.y - (s * pBar.x + c * pBar.y);

  // Per-pair residuals (mm) at the FIXED-scale (=1) fit + RMS.
  const residualsMm: number[] = [];
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const mx = c * P[i].x - s * P[i].y + tx;
    const my = s * P[i].x + c * P[i].y + ty;
    const d = Math.hypot(Q[i].x - mx, Q[i].y - my);
    residualsMm.push(d);
    sse += d * d;
  }
  const rmsMm = Math.sqrt(sse / n);
  // Horn RMS scale ratio (diagnostic only): √(Σ‖q'‖² / Σ‖p'‖²).
  const fittedScale = normP > 0 ? Math.sqrt(normQ / normP) : 1;

  return { originLat, originLon, thetaRad: theta, tx, ty,
           rmsMm, residualsMm, fittedScale, quality: 'full' };
}

// Geo → plan world mm. Returns null if the transform is unusable (quality none).
export function latLonToPlan(t: GeoTransform, lat: number, lon: number): { x: number; y: number } | null {
  if (t.quality === 'none') return null;
  const m = projectLatLon(lat, lon, t.originLat, t.originLon);
  const px = m.x * 1000, py = m.y * 1000;
  const c = Math.cos(t.thetaRad), s = Math.sin(t.thetaRad);
  return { x: c * px - s * py + t.tx, y: s * px + c * py + t.ty };
}

// Plan world mm → geo (inverse; used by G2 / debug). Null if unusable.
export function planToLatLon(t: GeoTransform, x: number, y: number): { lat: number; lon: number } | null {
  if (t.quality === 'none') return null;
  const c = Math.cos(t.thetaRad), s = Math.sin(t.thetaRad);
  // Inverse rotation (transpose) of the translated point.
  const dx = x - t.tx, dy = y - t.ty;
  const px = c * dx + s * dy;   // R⁻¹ = Rᵀ
  const py = -s * dx + c * dy;
  return unprojectMeters(px / 1000, py / 1000, t.originLat, t.originLon);
}

// ── GPS device-pin geometry (Feature G, phase G2) ─────────────────────────
// The GPS render boundary is the floor rect (0..fw, 0..fd) inflated by
// boundaryMm on every side. A pin BEYOND that inflated rect is clamped back
// onto its edge along the ray from the floor CENTRE, so a far-away device sits
// on the boundary in its true direction instead of rendering hundreds of metres
// out over the void (there is no yard slab in v1). Pure + deterministic — the
// gps-test page transpiles this file and asserts the clamp/bearing math.
export function clampToBoundary(fw: number, fd: number, boundaryMm: number,
                                x: number, y: number): { x: number; y: number } {
  const cx = fw / 2, cy = fd / 2;
  const minX = -boundaryMm, maxX = fw + boundaryMm;
  const minY = -boundaryMm, maxY = fd + boundaryMm;
  const dx = x - cx, dy = y - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  // Parametric ray C + t·(dx,dy); smallest t≥0 that reaches a rect edge.
  let t = Infinity;
  if (dx > 0) t = Math.min(t, (maxX - cx) / dx);
  else if (dx < 0) t = Math.min(t, (minX - cx) / dx);
  if (dy > 0) t = Math.min(t, (maxY - cy) / dy);
  else if (dy < 0) t = Math.min(t, (minY - cy) / dy);
  if (!isFinite(t)) return { x, y };
  return { x: cx + t * dx, y: cy + t * dy };
}

// Compass bearing (° clockwise from true north, 0..360) of a PLAN-frame vector
// (dx, dy) — plan +X right, +Y up. Uses the fitted transform's rotation
// (thetaRad) so plan north is recovered from calibration data (≥2 landmarks) or,
// for the single-landmark path, from northDeg (thetaRad === northDeg·π/180).
// Inverse-rotates the vector back to geo local metres (x east, y north) and
// takes atan2(east, north). northDeg=0 ⇒ plan +Y bears 0° (north); plan +X 90°.
export function planBearingDeg(thetaRad: number, dx: number, dy: number): number {
  const c = Math.cos(thetaRad), s = Math.sin(thetaRad);
  const east  =  c * dx + s * dy;   // R(−θ)·(dx,dy)
  const north = -s * dx + c * dy;
  return ((Math.atan2(east, north) * 180 / Math.PI) % 360 + 360) % 360;
}

// 8-point compass label (N/NE/E/…/NW) for a bearing in degrees.
export function compass8(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

// Parse a manually typed/pasted coordinate string into a validated {lat, lon}
// pair, or null. Accepts the "lat, lon" clipboard format that Google / Apple
// Maps produce (comma- and/or whitespace-separated); requires EXACTLY two
// numeric tokens and enforces lat ∈ [−90, 90], lon ∈ [−180, 180]. A single
// number, junk, or a 3+ token string returns null. Pure (no DOM / state).
export function parseLatLon(text: string): { lat: number; lon: number } | null {
  if (typeof text !== 'string') return null;
  const toks = text.trim().replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  if (toks.length !== 2) return null;
  if (!toks.every(t => /^[+-]?(\d+\.?\d*|\.\d+)$/.test(t))) return null;
  const lat = Number(toks[0]), lon = Number(toks[1]);
  if (!isFinite(lat) || !isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

export interface LatLonSample { lat: number; lon: number; accuracy?: number; }
export interface MedianLatLon { lat: number; lon: number; count: number; accuracy: number | null; }

// Independent median of lat and lon (robust to a few wild outliers), plus the
// sample count and the median gps_accuracy of the winning samples.
export function medianLatLon(samples: LatLonSample[]): MedianLatLon | null {
  if (samples.length === 0) return null;
  const med = (arr: number[]): number => {
    const s = [...arr].sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const accs = samples.map(s => s.accuracy).filter((a): a is number => typeof a === 'number' && isFinite(a));
  return {
    lat: med(samples.map(s => s.lat)),
    lon: med(samples.map(s => s.lon)),
    count: samples.length,
    accuracy: accs.length ? med(accs) : null,
  };
}
