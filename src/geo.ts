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
