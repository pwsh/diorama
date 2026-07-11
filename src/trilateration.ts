// Pure trilateration solver for BLE proxy distance rings (World Outside arc,
// Feature B). Diorama owns the solver — Bermuda publishes only per-scanner
// distances, never coordinates. All positions/distances in mm.
//
// Deterministic: no Date, no Math.random, no DOM, no module state. Given the
// same inputs it always returns the same output, so it can be exercised by the
// test-pages harness with synthetic ground truth.

export interface ProxyObs {
  x: number;   // proxy plan position, world mm
  y: number;
  d: number;   // measured distance from the proxy to the device, mm
  w: number;   // staleness-decay weight in [0,1] (1 = fresh sample). The
               // geometric near-proxy weighting (1/(d+1m)²) is applied here in
               // the solver; `w` layers the age decay on top of it.
}

export type SolutionKind = 'gn' | 'segment' | 'single';

export interface Solution {
  // Estimated device position, world mm. null ONLY for the single-proxy
  // constraint case (the caller holds its last position and uses `constraint`).
  x: number | null;
  y: number | null;
  rms: number;            // weighted RMS residual (mm) — solver quality / floor pick.
                          // For 'single' this carries the proxy distance (worst-ranked).
  kind: SolutionKind;
  // Single-proxy only: the circle the device sits on. The caller holds its last
  // known position and treats `d` as the confidence radius.
  constraint?: { x: number; y: number; d: number };
}

// Geometric + staleness weight for one observation. Near proxies are far more
// trustworthy than distant ones (RSSI→distance error grows with range), so the
// 1/(d + 1 m)² term down-weights long rings; `w` folds in the age decay.
function obsWeight(p: ProxyObs): number {
  const s = p.d + 1000;
  return p.w / (s * s);
}

// Weighted RMS of the ring residuals (‖p − pᵢ‖ − dᵢ) at a candidate point.
function weightedRms(ps: ProxyObs[], x: number, y: number): number {
  let sw = 0, swr = 0;
  for (const p of ps) {
    const we = obsWeight(p);
    const r = Math.hypot(x - p.x, y - p.y) - p.d;
    sw += we;
    swr += we * r * r;
  }
  return sw > 0 ? Math.sqrt(swr / sw) : 0;
}

// Two fresh proxies: no unique 2D fix (two circles meet at 0/1/2 points), so we
// place the estimate ON the segment between the proxies at the distance-ratio
// split — the closer proxy (smaller d) pulls the point toward itself. Clamped
// to stay inside the segment. Exact when the device truly lies on the segment.
function solveSegment(a: ProxyObs, b: ProxyObs): Solution {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.hypot(dx, dy);
  if (L < 1e-6) {
    // Coincident proxies — nothing to split; return the shared point.
    return { x: a.x, y: a.y, rms: weightedRms([a, b], a.x, a.y), kind: 'segment' };
  }
  let t = a.d / (a.d + b.d);
  if (!isFinite(t)) t = 0.5;
  t = Math.max(0, Math.min(1, t));
  const x = a.x + dx * t, y = a.y + dy * t;
  return { x, y, rms: weightedRms([a, b], x, y), kind: 'segment' };
}

// Weighted Gauss-Newton on the ring residuals for ≥3 proxies. Warm-started from
// the previous solution (or the weighted centroid), step-clamped to ≤1500 mm per
// iteration, ≤8 iterations. Levenberg damping keeps degenerate (collinear)
// geometries from blowing up — the unobservable perpendicular direction simply
// stays at the warm start rather than diverging.
function solveGaussNewton(ps: ProxyObs[], warmStart?: { x: number; y: number }): Solution {
  let px: number, py: number;
  if (warmStart && isFinite(warmStart.x) && isFinite(warmStart.y)) {
    px = warmStart.x; py = warmStart.y;
  } else {
    let sw = 0, sx = 0, sy = 0;
    for (const p of ps) { const we = obsWeight(p); sw += we; sx += we * p.x; sy += we * p.y; }
    px = sw > 0 ? sx / sw : ps[0].x;
    py = sw > 0 ? sy / sw : ps[0].y;
  }

  const MAX_STEP = 1500;
  for (let iter = 0; iter < 8; iter++) {
    let H00 = 0, H01 = 0, H11 = 0, g0 = 0, g1 = 0;
    for (const p of ps) {
      const we = obsWeight(p);
      let ex = px - p.x, ey = py - p.y;
      let dist = Math.hypot(ex, ey);
      if (dist < 1e-6) { dist = 1e-6; ex = 1e-6; ey = 0; }  // guard the 1/dist Jacobian
      const jx = ex / dist, jy = ey / dist;
      const r = dist - p.d;
      H00 += we * jx * jx; H01 += we * jx * jy; H11 += we * jy * jy;
      g0 += we * jx * r;   g1 += we * jy * r;
    }
    // Levenberg damping (relative to the Hessian trace) — makes JᵀWJ invertible
    // even when the proxies are collinear (perpendicular null-direction).
    const damp = 1e-6 * (H00 + H11) + 1e-30;
    H00 += damp; H11 += damp;
    const det = H00 * H11 - H01 * H01;
    if (Math.abs(det) < 1e-30) break;
    // Δ = −H⁻¹ g
    let sx = (-H11 * g0 + H01 * g1) / det;
    let sy = (H01 * g0 - H00 * g1) / det;
    const sl = Math.hypot(sx, sy);
    if (sl > MAX_STEP) { const k = MAX_STEP / sl; sx *= k; sy *= k; }
    px += sx; py += sy;
    if (Math.hypot(sx, sy) < 1) break;  // converged (sub-mm step)
  }
  return { x: px, y: py, rms: weightedRms(ps, px, py), kind: 'gn' };
}

// Main entry. Filters out zero-weight / invalid observations then dispatches on
// the fresh-proxy count:
//   0 → null (nothing to say)
//   1 → constraint-only (caller holds last position, confidence = the distance)
//   2 → segment split between the two proxies
//  ≥3 → weighted Gauss-Newton, warm-started from `warmStart`
export function solvePosition(
  proxies: ProxyObs[],
  warmStart?: { x: number; y: number },
): Solution | null {
  const ps = proxies.filter(p => p.w > 0 && isFinite(p.d) && p.d >= 0 &&
                                 isFinite(p.x) && isFinite(p.y));
  if (ps.length === 0) return null;
  if (ps.length === 1) {
    const p = ps[0];
    return { x: null, y: null, rms: p.d, kind: 'single', constraint: { x: p.x, y: p.y, d: p.d } };
  }
  if (ps.length === 2) return solveSegment(ps[0], ps[1]);
  return solveGaussNewton(ps, warmStart);
}
