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
 */
export function lamps(
  x: number, y: number, z: number, color: C, size: [number, number, number] = [220, 130, 40],
): VehiclePrimitive[] {
  return [box(size, [-x, y, z], color), box(size, [x, y, z], color)];
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
