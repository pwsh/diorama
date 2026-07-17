// Planar homography math (Phase 5 — Frigate ground-truth targets). PURE +
// deterministic: no DOM, no state, ZERO imports — the same shape as geo.ts /
// trilateration.ts, so the test page (test-pages/homography-test.html)
// transpiles this single file with esbuild (no --bundle) and asserts against
// synthetic ground truth.
//
// A camera looking at a flat floor sees the ground plane through a projective
// transform. Given ≥4 correspondences between image pixels (u, v) and floor
// positions (x, y in mm), the Direct Linear Transform (DLT) recovers the 3×3
// homography H mapping pixel → floor:
//
//     [ x' ]   [ h11 h12 h13 ] [ u ]              x = x'/w
//     [ y' ] = [ h21 h22 h23 ] [ v ]     with     y = y'/w
//     [ w  ]   [ h31 h32  1  ] [ 1 ]
//
// h33 is fixed to 1 (8 DOF). Each correspondence contributes 2 linear rows:
//     h11·u + h12·v + h13 − h31·u·x − h32·v·x = x
//     h21·u + h22·v + h23 − h31·u·y − h32·v·y = y
// unknown order: [h11, h12, h13, h21, h22, h23, h31, h32].
//
// Exactly 4 points → an 8×8 system solved directly. N > 4 → the least-squares
// normal equations (AᵀA h = Aᵀb), still 8×8. Collinear / degenerate inputs make
// the system singular → null (never a garbage matrix).
//
// The solved matrix is DERIVED, never persisted — CameraFixture stores only the
// raw {u,v,x,y} calibration points so adding/removing a point re-solves cleanly.

// One image↔floor correspondence. u,v = image pixels at the camera's DETECT
// resolution (the frame Frigate reports boxes against). x,y = floor mm.
export interface HgPair { u: number; v: number; x: number; y: number; }

// Solve a dense N×N linear system (A x = b) by Gaussian elimination with partial
// pivoting. Returns null if the matrix is singular (a pivot collapses relative to
// the matrix scale — degenerate/collinear correspondences land here). A is row-
// major and is CONSUMED (mutated) in place; b likewise.
function solveLinear(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  // Reference scale for the singularity test — the largest |coefficient| seen.
  let scale = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const a = Math.abs(A[i][j]); if (a > scale) scale = a;
  }
  if (scale === 0) return null;
  const eps = 1e-12 * scale;

  for (let col = 0; col < n; col++) {
    // Partial pivot: pick the row with the largest magnitude in this column.
    let piv = col, best = Math.abs(A[col][col]);
    for (let r = col + 1; r < n; r++) {
      const a = Math.abs(A[r][col]);
      if (a > best) { best = a; piv = r; }
    }
    if (best <= eps) return null;                    // singular / degenerate
    if (piv !== col) { const t = A[piv]; A[piv] = A[col]; A[col] = t; const tb = b[piv]; b[piv] = b[col]; b[col] = tb; }
    // Eliminate below.
    const pv = A[col][col];
    for (let r = col + 1; r < n; r++) {
      const factor = A[r][col] / pv;
      if (factor === 0) continue;
      for (let c = col; c < n; c++) A[r][c] -= factor * A[col][c];
      b[r] -= factor * b[col];
    }
  }
  // Back-substitution.
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j];
    x[i] = s / A[i][i];
  }
  return x;
}

// Solve the ground-plane homography from calibration pairs. Returns the 9-element
// row-major matrix [h11..h33] with h33 = 1, or null on <4 points or a
// singular/degenerate (e.g. collinear) system.
export function solveHomography(pairs: HgPair[]): number[] | null {
  if (!pairs || pairs.length < 4) return null;

  // Build the 2N×8 design matrix M and RHS r (M h = r, h the 8 unknowns).
  const rows: number[][] = [];
  const rhs: number[] = [];
  for (const p of pairs) {
    const { u, v, x, y } = p;
    if (![u, v, x, y].every(Number.isFinite)) return null;
    rows.push([u, v, 1, 0, 0, 0, -u * x, -v * x]); rhs.push(x);
    rows.push([0, 0, 0, u, v, 1, -u * y, -v * y]); rhs.push(y);
  }

  let h: number[] | null;
  if (pairs.length === 4) {
    // Exactly determined: 8×8 solve directly.
    h = solveLinear(rows.map(r => r.slice()), rhs.slice());
  } else {
    // Over-determined: normal equations AᵀA h = Aᵀb (8×8).
    const ata: number[][] = Array.from({ length: 8 }, () => new Array<number>(8).fill(0));
    const atb: number[] = new Array<number>(8).fill(0);
    for (let k = 0; k < rows.length; k++) {
      const row = rows[k], rv = rhs[k];
      for (let i = 0; i < 8; i++) {
        atb[i] += row[i] * rv;
        for (let j = 0; j < 8; j++) ata[i][j] += row[i] * row[j];
      }
    }
    h = solveLinear(ata, atb);
  }
  if (!h) return null;
  if (!h.every(Number.isFinite)) return null;
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

// Project an image pixel (u, v) through a solved homography to floor mm. Returns
// null when the projective denominator collapses toward 0 (a point mapping to the
// camera's horizon / behind the plane — no valid ground intersection).
export function applyHomography(h: number[], u: number, v: number): { x: number; y: number } | null {
  if (!h || h.length < 9) return null;
  const w = h[6] * u + h[7] * v + h[8];
  if (!Number.isFinite(w) || Math.abs(w) < 1e-9) return null;
  const x = (h[0] * u + h[1] * v + h[2]) / w;
  const y = (h[3] * u + h[4] * v + h[5]) / w;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

// Per-pair reprojection residual (mm): the distance between each calibration
// point's real floor position and where its pixel projects through h. A point
// that fails to project (null) reports Infinity so the caller's max-residual
// readout flags it. Aligned to `pairs`.
export function homographyResidualsMm(h: number[], pairs: HgPair[]): number[] {
  return pairs.map(p => {
    const q = applyHomography(h, p.u, p.v);
    if (!q) return Infinity;
    return Math.hypot(q.x - p.x, q.y - p.y);
  });
}
