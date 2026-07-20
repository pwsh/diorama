// On-screen compass + north-marker math (pure + deterministic: no DOM, no
// state, no three.js — imports GeoTransform from geo.ts only, so the test page
// bundles compass.ts + geo.ts with esbuild and asserts against ground truth).
//
// Conventions (locked here + in test-pages/compass-test.html)
// ───────────────────────────────────────────────────────────
// • Plan world frame: +X right, +Y up (mm) — the 2D canvas draws plan +Y as
//   screen-up.
// • `manualNorthDeg` uses the SAME convention as Store.geo.northDeg: the
//   compass bearing (° CW from true north) that plan +Y faces. geo.ts's
//   single-landmark fit builds the geo→plan rotation as CCW-by-northDeg
//   ([[c,−s],[s,c]]), so geo north (0,1) lands at plan (−sin B, cos B) — the
//   manual path here reproduces exactly that vector, and
//   planBearingDeg(B·DEG, nx, ny) === 0 for it.
// • Screen needle angle is measured CW from screen-up (matching compass
//   bearings): 0 = needle up, +π/2 = needle right.
import type { GeoTransform } from './geo.js';
import type { CompassConfig } from './types.js';

const DEG = Math.PI / 180;

export interface NorthVec {
  nx: number; ny: number;                       // unit vector of TRUE NORTH in the plan frame
  source: 'landmarks' | 'manual' | 'default';
}

// Resolve where true north points in the plan frame.
//   source 'manual'          → from manualNorthDeg (?? 0).
//   'auto' (default): landmark fit when usable (quality !== 'none'), else
//   manualNorthDeg when set, else the default plan-up (0,1).
// Landmark path: the fitted transform rotates geo (east, north) metres into the
// plan by thetaRad, so plan-north = R(θ)·(0,1) = (−sin θ, cos θ). The manual
// path is the same formula with θ = manualNorthDeg·DEG (geo.ts's own
// single-landmark handling), so the two sources agree by construction.
export function resolveNorth(
  cfg: CompassConfig | undefined,
  fit: { transform: GeoTransform } | null,
): NorthVec {
  const fromDeg = (deg: number, source: 'manual' | 'landmarks'): NorthVec =>
    ({ nx: -Math.sin(deg * DEG), ny: Math.cos(deg * DEG), source });
  if (cfg?.source === 'manual') return fromDeg(cfg.manualNorthDeg ?? 0, 'manual');
  if (fit && fit.transform.quality !== 'none') {
    const th = fit.transform.thetaRad;
    return { nx: -Math.sin(th), ny: Math.cos(th), source: 'landmarks' };
  }
  if (cfg?.manualNorthDeg != null) return fromDeg(cfg.manualNorthDeg, 'manual');
  return { nx: 0, ny: 1, source: 'default' };
}

// Camera azimuth (rad) in the SCENE frame: α = atan2(camX − tgtX, camZ − tgtZ).
// α = 0 → camera sits at scene +Z of its target (looking toward −Z);
// α = π → camera at scene −Z (the 'front' preset, which matches the 2D plan
// orientation). Null pose (3D never opened) → 0.
export function camAzimuthOf(
  cam: { pos: [number, number, number]; target: [number, number, number] } | null,
): number {
  if (!cam) return 0;
  const dx = cam.pos[0] - cam.target[0];
  const dz = cam.pos[2] - cam.target[2];
  if (dx === 0 && dz === 0) return 0;
  return Math.atan2(dx, dz);
}

// The screen angle (rad, CW from screen-up) at which the needle points at
// north (nx, ny).
//
// 2D: canvas Y is flipped so plan +Y is screen-up and plan +X screen-right ⇒
//     angle = atan2(nx, ny).
//
// 3D derivation (locked by the test matrix): the renderer maps plan→scene as
// (fw/2 − wx, h, wy − fd/2), so a plan direction (dx, dy) becomes scene
// (−dx, 0, +dy). For a camera at azimuth α (see camAzimuthOf) with world-up
// +Y, the ground projection of camera-forward is f = (−sin α, −cos α) (scene
// xz) and camera-right is r = (cos α, −sin α). A ground vector's screen-up
// component is v·f (farther away = higher on screen for an elevated camera)
// and screen-right is v·r. With v = (−nx, ny):
//   right = −nx·cos α − ny·sin α = −sin(α + β)
//   up    =  nx·sin α − ny·cos α = −cos(α + β)      (β = atan2(nx, ny))
//   angle = atan2(right, up) = α + β + π  (mod 2π)
// Sanity: α = π (the 'front' preset = the 2D orientation) → angle = β, same
// as the 2D case. α = 0 (camera at scene +Z = plan north side, looking south)
// with north (0,1) → angle = π (needle straight down: north is behind you).
export function compassScreenAngle(
  nx: number, ny: number, view: '2d' | '3d', camAzimuthRad: number,
): number {
  const beta = Math.atan2(nx, ny);
  const a = view === '3d' ? camAzimuthRad + beta + Math.PI : beta;
  // Normalize to (−π, π] so redraw-guard comparisons never straddle a 2π jump.
  const t = ((a % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  return t === -Math.PI ? Math.PI : t;
}

// Where the in-plan north icon sits: the ray from the floor centre
// (fw/2, fd/2) along (nx, ny) exits the floor rect, pushed marginMm OUTSIDE it
// so the icon rides just off the slab edge. angleRad rotates the glyph to
// point along north (CW from plan +Y — the same convention as the 2D screen
// angle). Degenerate zero vector → the top edge (plan-up default).
export function northMarkerPos(
  fw: number, fd: number, nx: number, ny: number, marginMm = 900,
): { x: number; y: number; angleRad: number } {
  const cx = fw / 2, cy = fd / 2;
  let dx = nx, dy = ny;
  if (dx === 0 && dy === 0) { dx = 0; dy = 1; }
  // Smallest t ≥ 0 where the ray reaches a rect edge (clampToBoundary idiom
  // with boundary 0), then push marginMm farther along the ray.
  let t = Infinity;
  if (dx > 0) t = Math.min(t, (fw - cx) / dx);
  else if (dx < 0) t = Math.min(t, (0 - cx) / dx);
  if (dy > 0) t = Math.min(t, (fd - cy) / dy);
  else if (dy < 0) t = Math.min(t, (0 - cy) / dy);
  if (!isFinite(t)) t = 0;
  const len = Math.hypot(dx, dy);
  const push = len > 0 ? marginMm / len : 0;
  return {
    x: cx + (t + push) * dx,
    y: cy + (t + push) * dy,
    angleRad: Math.atan2(dx, dy),
  };
}
