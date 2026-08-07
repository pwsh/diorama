// Shared authoring helpers for the built-in vehicle packs.
//
// Pure data builders — imported ONLY by the lazy pack bodies (never by the
// eager manifest), so they ride the same code-split chunk the packs do.
//
// Model-local frame (the repo furniture convention, shared with Custom Objects):
//   +X = right (across the vehicle)   −Z = FRONT / nose   +Y = up, y = 0 = ground
// Sizes are mm. Nothing here uses Math.random — every model is deterministic.
import type { VehiclePrimitive } from '../vehicles.js';

type C = VehiclePrimitive['color'];

/** Axis-aligned box: size [w, ht, d] centred at `pos`. */
export function box(
  size: [number, number, number], pos: [number, number, number], color: C,
  rot?: [number, number, number],
): VehiclePrimitive {
  return { shape: 'box', size, pos, color, ...(rot ? { rot } : {}) };
}

/** Vertical cylinder: size [rTop, rBot, ht]; the axis runs along local +Y. */
export function cyl(
  size: [number, number, number], pos: [number, number, number], color: C,
  rot?: [number, number, number],
): VehiclePrimitive {
  return { shape: 'cylinder', size, pos, color, ...(rot ? { rot } : {}) };
}

/** Sphere of radius r. */
export function sph(r: number, pos: [number, number, number], color: C): VehiclePrimitive {
  return { shape: 'sphere', size: [r, r, r], pos, color };
}

/** Cone: size [r, ht], tip UP; rotate to aim it elsewhere. */
export function cone(
  size: [number, number], pos: [number, number, number], color: C,
  rot?: [number, number, number],
): VehiclePrimitive {
  return { shape: 'cone', size: [size[0], size[1], 0], pos, color, ...(rot ? { rot } : {}) };
}

/**
 * A road wheel: a dark cylinder whose axis is rotated onto local X (across the
 * vehicle) by a 90° roll, sitting ON the ground (centre at y = r).
 *   x  — lateral offset (± half the track)
 *   z  — longitudinal offset (negative = toward the nose)
 *   r  — radius; `w` — tyre width along X
 */
export function wheel(x: number, z: number, r: number, w = 240): VehiclePrimitive {
  return { shape: 'cylinder', size: [r, r, w], pos: [x, r, z], rot: [0, 0, 90], color: 'dark' };
}

/** Four road wheels at ±`track/2`, front at `zF`, rear at `zR`. */
export function wheels4(
  track: number, zF: number, zR: number, r: number, w = 240,
): VehiclePrimitive[] {
  const x = track / 2;
  return [wheel(-x, zF, r, w), wheel(x, zF, r, w), wheel(-x, zR, r, w), wheel(x, zR, r, w)];
}

/** Six road wheels (bus / fire engine / semi): one front axle + a rear pair. */
export function wheels6(
  track: number, zF: number, zR1: number, zR2: number, r: number, w = 260,
): VehiclePrimitive[] {
  const x = track / 2;
  return [
    wheel(-x, zF, r, w), wheel(x, zF, r, w),
    wheel(-x, zR1, r, w), wheel(x, zR1, r, w),
    wheel(-x, zR2, r, w), wheel(x, zR2, r, w),
  ];
}

/**
 * Headlight / tail-light pair — small flat plates proud of the nose or tail
 * face so they never sit coplanar with the body (the coincident-face gotcha).
 *
 * `size` describes the VISIBLE plate. The built prim is then grown INWARD along
 * the vehicle axis by `LAMP_SINK`, keeping the outer face exactly where the
 * caller put it: a lamp authored a few tens of mm ahead of the bumper used to
 * hang in mid-air (a real floating-headlight artifact on nine shipped models),
 * and the fix must not move the one face anybody sees. Everything the sink adds
 * is buried inside opaque bodywork, so silhouettes are untouched. `z === 0` has
 * no inward direction and is left alone.
 */
export const LAMP_SINK = 220;

export function lamps(
  x: number, y: number, z: number, color: C, size: [number, number, number] = [220, 130, 40],
): VehiclePrimitive[] {
  const outward = Math.sign(z);                      // the face the viewer sees
  const d = size[2] + (outward ? LAMP_SINK : 0);
  const zc = z - outward * LAMP_SINK / 2;            // grow back toward the centre
  const s: [number, number, number] = [size[0], size[1], d];
  return [box(s, [-x, y, zc], color), box(s, [x, y, zc], color)];
}

// ── Aircraft / spacecraft helpers (V2) ──────────────────────────────────────
// Same frame: −Z = nose, +Y = up. Aircraft models are centred VERTICALLY on the
// origin too (they never touch a ground plane), which is the BG_CRAFTS
// convention the banner-tow builder expects.

/** A barrel along the FLIGHT axis (fuselage tube, engine pod, boom). */
export function tube(
  r: number, len: number, pos: [number, number, number], color: C,
): VehiclePrimitive {
  return { shape: 'cylinder', size: [r, r, len], pos, rot: [90, 0, 0], color };
}

/** A barrel along local X (spanwise: wing spars, cross-shafts). */
export function tubeX(
  r: number, len: number, pos: [number, number, number], color: C,
): VehiclePrimitive {
  return { shape: 'cylinder', size: [r, r, len], pos, rot: [0, 0, 90], color };
}

/** A cone whose APEX points FORWARD (−Z) — the standard nose / spinner pose. */
export function noseCone(
  r: number, len: number, pos: [number, number, number], color: C,
): VehiclePrimitive {
  return { shape: 'cone', size: [r, len, 0], pos, rot: [-90, 0, 0], color };
}

/** A cone whose apex points AFT (+Z) — tail cones, jet nozzles. */
export function tailCone(
  r: number, len: number, pos: [number, number, number], color: C,
): VehiclePrimitive {
  return { shape: 'cone', size: [r, len, 0], pos, rot: [90, 0, 0], color };
}

/** A rocket engine bell: apex UP, mouth down, self-lit. */
export function engineBell(
  r: number, len: number, pos: [number, number, number], color: C,
): VehiclePrimitive {
  return { shape: 'cone', size: [r, len, 0], pos, rot: [180, 0, 0], color, emissive: true };
}

/** Per-blade thickness stagger that keeps crossing blades off one plane. */
export const BLADE_STAGGER = 4;

/**
 * Propeller blades: `n` boxes crossing in the XY plane at ONE position, tagged
 * `spin:'prop'` so the sky builder collects them into a group spun about the
 * flight axis. `n = 1` is deliberate on multi-engine models — a single blade
 * sweeps the same disc and keeps a four-engine bomber inside the prim budget.
 */
export function propBlades(
  pos: [number, number, number], span: number, n = 2, color: C = 'dark',
  chord = 90, th = 14,
): VehiclePrimitive[] {
  const out: VehiclePrimitive[] = [];
  for (let k = 0; k < n; k++) {
    // Blades cross AT the hub, so a shared thickness puts two identical faces on
    // one plane (and at n = 2 the pair is the SAME solid drawn twice). Staggering
    // the thickness by BLADE_STAGGER per blade buries each inside the next — the
    // coincident-face idiom, invisible at any viewing distance. The `pos` must
    // stay identical: the renderer keys its spin group on `spin|pos`.
    out.push({ shape: 'box', size: [chord, span, th + k * BLADE_STAGGER], pos,
               rot: [0, 0, (k * 180) / n], color, spin: 'prop' });
  }
  return out;
}

/** Rotorcraft MAIN rotor: `n` flat blades in the XZ plane, spun about +Y. */
export function rotorBlades(
  pos: [number, number, number], span: number, n = 2, color: C = 'dark',
  chord = 120, th = 20,
): VehiclePrimitive[] {
  const out: VehiclePrimitive[] = [];
  for (let k = 0; k < n; k++) {
    out.push({ shape: 'box', size: [span, th + k * BLADE_STAGGER, chord], pos,
               rot: [0, (k * 180) / n, 0], color, spin: 'rotor' });   // see propBlades
  }
  return out;
}

/** Helicopter TAIL rotor: `n` blades in the YZ plane, spun about local X. */
export function tailRotorBlades(
  pos: [number, number, number], span: number, n = 2, color: C = 'dark',
): VehiclePrimitive[] {
  const out: VehiclePrimitive[] = [];
  for (let k = 0; k < n; k++) {
    out.push({ shape: 'box', size: [16 + k * BLADE_STAGGER, span, 60], pos,
               rot: [(k * 180) / n, 0, 0], color, spin: 'tail' });    // see propBlades
  }
  return out;
}

/**
 * Mirror a run of prims across the centreline: returns the originals PLUS
 * X-negated copies (a rotation's Y and Z components flip with the handedness,
 * X does not). Wings, tails, nacelles and legs are all authored once with this.
 */
export function mirrorX(prims: VehiclePrimitive[]): VehiclePrimitive[] {
  const out: VehiclePrimitive[] = [...prims];
  for (const p of prims) {
    out.push({
      ...p,
      pos: [-p.pos[0], p.pos[1], p.pos[2]],
      ...(p.rot ? { rot: [p.rot[0], -p.rot[1], -p.rot[2]] as [number, number, number] } : {}),
    });
  }
  return out;
}

/** A continuous track unit (tank): a long slab + two rounded end drums. */
export function trackUnit(
  x: number, len: number, r: number, w: number, zc = 0,
): VehiclePrimitive[] {
  return [
    box([w, r * 2, len], [x, r, zc], 'dark'),
    { shape: 'cylinder', size: [r, r, w], pos: [x, r, zc - len / 2], rot: [0, 0, 90], color: 'dark' },
    { shape: 'cylinder', size: [r, r, w], pos: [x, r, zc + len / 2], rot: [0, 0, 90], color: 'dark' },
  ];
}
