// Floorplan authoring toolkit — pure JS helpers for building a complete,
// valid Diorama `Store` in code. Each plan module (scripts/floorplans/plans/*.mjs)
// exports `{ id, name, build() }`; `build()` uses these helpers to assemble a
// Store that imports through the real export envelope.
//
// USAGE (in a plan module):
//
//   import { floorplan } from '../lib.mjs';
//   export const id = 'studio-apartment';
//   export const name = 'Studio Apartment';
//   export function build() {
//     const b = floorplan(id);
//     const { floorRect, wall, room, door, win, furn, light, switchFix, roamer,
//             floor, assembleStore } = b;
//     const f = floor({ w: 6600, d: 6350, walls: [...], rooms: [...], ... });
//     return assembleStore({ name, floors: [f], scene3d: {...}, notes: '...' });
//   }
//
// All ids are deterministic per plan: `${planId}-${prefix}${n}` (w1, rm1, dr1,
// win1, fn1, lt1, sw1, ro1, floor ids fl1…). Re-running build() yields byte-
// identical output (used to keep committed JSONs stable).
//
// Furniture default footprints (w/h) come from the REAL FURNITURE_KINDS once
// `setGeom()` has been called (build.mjs does this before importing plans). A
// tiny fallback (600×600) keeps the helpers usable if geom is absent.

import { rectCorners, convexPenetration, solidWallRuns, wallCollidable, WALL_HALF } from './physical.mjs';

let GEOM = null;
/** Inject the bundled src/geometry.ts namespace (FURNITURE_KINDS, …). */
export function setGeom(g) { GEOM = g; }

function kindDef(kind) {
  const map = GEOM?.FURNITURE_KINDS;
  return (map && map[kind]) || { w: 600, h: 600 };
}

// ── Build-time settle pass ──────────────────────────────────────────────────
// The APP auto-settles fixtures on drop (snapFireplaceToWall, snapSwitchToWall,
// snapFurnitureToSurface, resolveSeatTableCollision). `floor()` runs the same
// idea at build time for the two MECHANICAL alignment classes so plan authors
// can write round "against the north wall" coordinates and still get physically
// clean geometry:
//
//   1. seat facing  — a chair/stool captured by a table/desk is rotated so its
//      functional front (local −Y in plan, i.e. −Z in 3D) points across the
//      host's nearest edge, and tucked to that edge + SEAT_TUCK_CLEAR when it
//      was sitting ON the tabletop.
//   2. wall push-out — a nav-blocking piece whose footprint bites into a solid
//      wall run is nudged straight out along that wall's normal.
//
// Both are deterministic and idempotent (re-running build() is byte-stable).
// Layout DECISIONS (doorway clearance, room connectivity) are NOT auto-fixed —
// those belong in the plan source and the validator fails loudly on them.
// Pass `settle: false` on a floor spec to opt out.

const SEAT_TUCK_CLEAR = 150;   // matches geometry.ts resolveSeatTableCollision
const SEAT_LAP_TOL = 200;      // a tucked chair laps its table ~100 mm by design

function settleSeats(spec) {
  const { FURNITURE_KINDS, furnitureWorldToLocal, seatBelongsToTable, TABLE_CARRY_MARGIN_MM } = GEOM;
  const items = spec.furniture ?? [];
  const isHost = (fu) => {
    const a = FURNITURE_KINDS[fu.kind ?? 'block']?.activity;
    return a === 'eat_at_table' || a === 'work_at_desk';
  };
  for (const seat of items) {
    if (!FURNITURE_KINDS[seat.kind ?? 'block']?.seat) continue;
    let host = null, hostD = Infinity;
    for (const h of items) {
      if (h === seat || !isHost(h)) continue;
      if (!seatBelongsToTable(h.x, h.y, h.rotation, h.w, h.h, seat.x, seat.y, TABLE_CARRY_MARGIN_MM)) continue;
      const d = Math.hypot(h.x - seat.x, h.y - seat.y);
      if (d < hostD) { hostD = d; host = h; }
    }
    if (!host) continue;
    // Which host edge is this seat parked at? Compare normalized local offsets
    // so a chair at the short end faces along the table, not diagonally at it.
    const l = furnitureWorldToLocal(host.rotation, seat.x - host.x, seat.y - host.y);
    const hx = host.w / 2, hy = host.h / 2;
    const useX = Math.abs(l.x) / hx >= Math.abs(l.y) / hy;
    // Host-local unit vector pointing from the seat toward the table.
    const lfx = useX ? -Math.sign(l.x || 1) : 0;
    const lfy = useX ? 0 : -Math.sign(l.y || 1);
    // Host-local → world (inverse of furnitureWorldToLocal).
    const hr = (host.rotation ?? 0) * Math.PI / 180;
    const c = Math.cos(hr), s = Math.sin(hr);
    const fx = lfx * c + lfy * s, fy = -lfx * s + lfy * c;
    // front = (−sin r, −cos r) ⇒ r = atan2(−fx, −fy)
    const rot = (Math.round(Math.atan2(-fx, -fy) * 180 / Math.PI) + 360) % 360;
    if (rot) seat.rotation = rot; else delete seat.rotation;

    // Tuck out if the chair is sitting ON the tabletop.
    const lap = convexPenetration(
      rectCorners(seat.x, seat.y, seat.w, seat.h, seat.rotation),
      rectCorners(host.x, host.y, host.w, host.h, host.rotation));
    if (lap > SEAT_LAP_TOL) {
      const nlx = useX ? Math.sign(l.x || 1) * (hx + SEAT_TUCK_CLEAR) : l.x;
      const nly = useX ? l.y : Math.sign(l.y || 1) * (hy + SEAT_TUCK_CLEAR);
      seat.x = Math.round(host.x + nlx * c + nly * s);
      seat.y = Math.round(host.y - nlx * s + nly * c);
    }
  }
}

function settleWalls(spec) {
  const f = { walls: spec.walls ?? [], doors: spec.doors ?? [], windows: spec.windows ?? [] };
  const runs = solidWallRuns(f, GEOM);
  const items = spec.furniture ?? [];
  for (let pass = 0; pass < 3; pass++) {
    let moved = false;
    for (const fu of items) {
      if (!wallCollidable(fu, GEOM)) continue;
      let bestPush = 0, bestNx = 0, bestNy = 0;
      const poly = rectCorners(fu.x, fu.y, fu.w, fu.h, fu.rotation);
      for (const r of runs) {
        const dx = r.b.x - r.a.x, dy = r.b.y - r.a.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        const nx = -uy, ny = ux;
        const mx = (r.a.x + r.b.x) / 2, my = (r.a.y + r.b.y) / 2;
        const wallPoly = [
          { x: r.a.x - nx * WALL_HALF, y: r.a.y - ny * WALL_HALF },
          { x: r.b.x - nx * WALL_HALF, y: r.b.y - ny * WALL_HALF },
          { x: r.b.x + nx * WALL_HALF, y: r.b.y + ny * WALL_HALF },
          { x: r.a.x + nx * WALL_HALF, y: r.a.y + ny * WALL_HALF },
        ];
        if (convexPenetration(poly, wallPoly) <= 0) continue;
        // Overlap depth measured along the wall NORMAL (not SAT's min axis) so
        // a long counter parallel to a wall is pushed off it, never along it.
        let lo = Infinity, hi = -Infinity;
        for (const p of poly) {
          const d = (p.x - mx) * nx + (p.y - my) * ny;
          if (d < lo) lo = d; if (d > hi) hi = d;
        }
        const side = ((fu.x - mx) * nx + (fu.y - my) * ny) >= 0 ? 1 : -1;
        const push = side > 0 ? WALL_HALF - lo : hi + WALL_HALF;
        if (push > bestPush) { bestPush = push; bestNx = nx * side; bestNy = ny * side; }
      }
      if (bestPush > 0.5) {
        fu.x = Math.round(fu.x + bestNx * (bestPush + 2));
        fu.y = Math.round(fu.y + bestNy * (bestPush + 2));
        moved = true;
      }
    }
    if (!moved) break;
  }
}

// 3. wall-fixture snap — the LIGHT kinds the app locks onto a wall on drop
//    (fireplace / floodlight / wall exhaust) are run through the REAL
//    geometry.ts snap functions, so a plan author writes the round "on the west
//    wall" coordinate and gets the flush pose the renderer expects: back on the
//    wall face, front (local −Z) into the room. Without this a hand-placed
//    fireplace could sit clear through the wall with its opening facing OUT —
//    the strict wall audit found exactly that in three plans. No-ops when no
//    wall is within the snap reach (500 mm), so a free-standing fireplace in the
//    middle of a room is left alone.
function settleLights(spec) {
  const { snapFireplaceToWall, snapFloodlightToWall, snapExhaustToWall } = GEOM;
  const walls = spec.walls ?? [];
  if (!walls.length) return;
  for (const l of (spec.lights ?? [])) {
    const snapped = !!(snapFireplaceToWall?.(l, walls) | snapFloodlightToWall?.(l, walls)
                       | snapExhaustToWall?.(l, walls));
    // atan2 yields −0 / −90 style floats; normalize to a stable 0..360 integer
    // when the wall is axis-aligned so the committed JSON stays byte-identical.
    // ONLY for a light the snap actually touched — never rewrite an untouched
    // fixture's authored rotation.
    if (snapped && typeof l.rotation === 'number') {
      const r = (Math.round(l.rotation * 1e6) / 1e6 + 360) % 360;
      if (r === 0) delete l.rotation; else l.rotation = Number.isInteger(r) ? r : Number(r.toFixed(4));
    }
  }
}

/**
 * Create a plan builder bound to `planId`. Returns all authoring helpers with a
 * shared, deterministic id counter. Call once per plan `build()`.
 */
export function floorplan(planId) {
  const counts = Object.create(null);
  const id = (prefix) => {
    counts[prefix] = (counts[prefix] || 0) + 1;
    return `${planId}-${prefix}${counts[prefix]}`;
  };

  /** Closed rectangle point-list for a floor perimeter: pass to wall(). */
  const floorRect = (w, d) => [
    { x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: d }, { x: 0, y: d }, { x: 0, y: 0 },
  ];

  /** A wall run. `points` = [{x,y}, …] mm (world). `kind` default 'full'. */
  const wall = (points, kind = 'full') => {
    const w = { id: id('w'), points: points.map(p => ({ x: p.x, y: p.y })) };
    if (kind && kind !== 'full') w.kind = kind;
    return w;
  };

  /** A named room pinned to whichever wall loop contains (ax, ay). */
  const room = (name, ax, ay, opts = {}) => {
    const r = { id: id('rm'), name, anchor: { x: ax, y: ay } };
    if (opts.occupancyEntity !== undefined) r.occupancyEntity = opts.occupancyEntity;
    return r;
  };

  /**
   * A door. (x, y) = the HINGE point (world mm); the panel spans `w` mm along
   * `rotation` (screen-CW deg, 0 = panel along +X world). See doorSpanCenter.
   * opts: { w=800, kind='swing'|'garage', hinge, entity_id, lockEntity, doorbellEntity, label }
   */
  const door = (x, y, rotation, opts = {}) => {
    const d = {
      id: id('dr'), x, y, w: opts.w ?? (opts.kind === 'garage' ? 2400 : 800),
      rotation, entity_id: opts.entity_id ?? null,
    };
    if (opts.kind && opts.kind !== 'swing') d.kind = opts.kind;
    if (opts.hinge) d.hinge = opts.hinge;
    if (opts.lockEntity !== undefined) d.lockEntity = opts.lockEntity;
    if (opts.doorbellEntity !== undefined) d.doorbellEntity = opts.doorbellEntity;
    if (opts.label) d.label = opts.label;
    if (opts.localState) d.localState = opts.localState;
    return d;
  };

  /**
   * A window. (x, y) = pane CENTER (world mm); pane spans `w` mm along
   * `rotation` (screen-CW deg, 0 = pane along +X world).
   * opts: { w=1000, sill=900, height=800, kind='single', coverEntity, label }
   */
  const win = (x, y, rotation, opts = {}) => {
    const wd = GEOM?.WINDOW_DEFAULTS ?? { sill: 900, height: 800 };
    const o = {
      id: id('win'), x, y, w: opts.w ?? 1000, rotation, entity_id: opts.entity_id ?? null,
      sill: opts.sill ?? wd.sill, height: opts.height ?? wd.height,
    };
    if (opts.kind && opts.kind !== 'single') o.kind = opts.kind;
    if (opts.coverEntity !== undefined) o.coverEntity = opts.coverEntity;
    if (opts.label) o.label = opts.label;
    return o;
  };

  /**
   * A furniture piece. `kind` ∈ FURNITURE_KINDS. (x, y) = center (world mm).
   * Default w/h come from the kind's real footprint.
   * opts: { rotation=0, w, h, elevation, label, color, entity_id, stairLinkId,
   *         mountable/mountOnId, sharedBedCovers, doorEntity, tempEntity, localState }
   */
  const furn = (kind, x, y, opts = {}) => {
    const def = kindDef(kind);
    const f = {
      id: id('fn'), x, y,
      w: opts.w ?? def.w, h: opts.h ?? def.h, kind,
    };
    if (opts.rotation) f.rotation = opts.rotation;
    if (opts.elevation) f.elevation = opts.elevation;
    if (opts.label) f.label = opts.label;
    if (opts.color) f.color = opts.color;
    if (opts.entity_id !== undefined) f.entity_id = opts.entity_id;
    if (opts.localState) f.localState = opts.localState;
    if (opts.stairLinkId) f.stairLinkId = opts.stairLinkId;
    if (opts.mountOnId !== undefined) f.mountOnId = opts.mountOnId;
    if (opts.sharedBedCovers !== undefined) f.sharedBedCovers = opts.sharedBedCovers;
    if (opts.doorEntity !== undefined) f.doorEntity = opts.doorEntity;
    if (opts.tempEntity !== undefined) f.tempEntity = opts.tempEntity;
    if (opts.doorOpen !== undefined) f.doorOpen = opts.doorOpen;
    return f;
  };

  /**
   * A ceiling / accent light. (x, y) = center (world mm).
   * opts: { iconKind='bulb', color, radius, height, intensity, rotation, length,
   *         entity_id, localState, label }
   */
  const light = (x, y, opts = {}) => {
    const l = { id: id('lt'), x, y, entity_id: opts.entity_id ?? null };
    if (opts.iconKind) l.iconKind = opts.iconKind;
    if (opts.color) l.color = opts.color;
    if (opts.radius !== undefined) l.radius = opts.radius;
    if (opts.height !== undefined) l.height = opts.height;
    if (opts.intensity !== undefined) l.intensity = opts.intensity;
    if (opts.rotation !== undefined) l.rotation = opts.rotation;
    if (opts.length !== undefined) l.length = opts.length;
    if (opts.localState) l.localState = opts.localState;
    if (opts.label) l.label = opts.label;
    return l;
  };

  /**
   * A light switch plate. (x, y) = center (world mm).
   * opts: { rotation=0, height, size, entity_id, localState, label }
   */
  const switchFix = (x, y, opts = {}) => {
    const s = { id: id('sw'), x, y, entity_id: opts.entity_id ?? null };
    if (opts.rotation !== undefined) s.rotation = opts.rotation;
    if (opts.height !== undefined) s.height = opts.height;
    if (opts.size !== undefined) s.size = opts.size;
    if (opts.localState) s.localState = opts.localState;
    if (opts.label) s.label = opts.label;
    return s;
  };

  /**
   * A roaming AI avatar (display-only presence). `avatarKinds` = pool of avatar
   * ids (use REAL builtin ids: adult/child/teen/elder/professional/athlete/…).
   * opts: { color, plumbobColor, enabled }
   */
  const roamer = (name, avatarKinds, opts = {}) => {
    const r = { id: id('ro'), name, avatarKinds: [...avatarKinds] };
    if (opts.color) r.color = opts.color;
    if (opts.plumbobColor) r.plumbobColor = opts.plumbobColor;
    if (opts.enabled !== undefined) r.enabled = opts.enabled;
    return r;
  };

  /**
   * Assemble ONE complete Floor object with EVERY array repairFloor backfills
   * present explicitly (so validity never depends on runtime repair).
   * spec: { name?, w, d, walls, rooms, doors, windows, furniture, lights,
   *         switches, roamers, sensors, motionSensors, envSensors, bleProxies,
   *         alarmPanels, safetySensors, robots, presenceZones, cameras,
   *         groundAreas, voidAreas, look3d, bg, model3d, disabled }
   */
  const floor = (spec) => {
    const fid = id('fl');
    // Walls first (so seats measure against a host's FINAL position), then
    // seats, then walls again in case a tuck pushed a chair into a wall.
    if (GEOM && spec.settle !== false) {
      settleWalls(spec); settleSeats(spec); settleWalls(spec); settleLights(spec);
    }
    return {
      id: fid, name: spec.name ?? `Floor ${counts.fl}`,
      w: spec.w, d: spec.d,
      walls: spec.walls ?? [],
      furniture: spec.furniture ?? [],
      lights: spec.lights ?? [],
      switches: spec.switches ?? [],
      sensors: spec.sensors ?? [],
      motionSensors: spec.motionSensors ?? [],
      roamers: spec.roamers ?? [],
      envSensors: spec.envSensors ?? [],
      look3d: spec.look3d ?? null,
      doors: spec.doors ?? [],
      windows: spec.windows ?? [],
      bg: spec.bg ?? null,
      model3d: spec.model3d ?? null,
      rooms: spec.rooms ?? [],
      bleProxies: spec.bleProxies ?? [],
      alarmPanels: spec.alarmPanels ?? [],
      safetySensors: spec.safetySensors ?? [],
      robots: spec.robots ?? [],
      presenceZones: spec.presenceZones ?? [],
      cameras: spec.cameras ?? [],
      groundAreas: spec.groundAreas ?? [],
      voidAreas: spec.voidAreas ?? [],
      ...(spec.boundsLocked !== undefined ? { boundsLocked: spec.boundsLocked } : {}),
      ...(spec.disabled !== undefined ? { disabled: spec.disabled } : {}),
    };
  };

  /**
   * Assemble the full Store. `floors` = Floor[] (from floor()). Optional
   * top-level `roamers` attach to the FIRST floor (convenience for single-floor
   * plans). `scene3d` / `notes` as given. `customObjects` = ObjectRecipe[] for
   * plans that author their own primitive-built pieces (default []).
   * `avatarPacks` = Record<packId, {loaded?, active?, members?}> for plans that
   * need a non-default (franchise) avatar pack; omitted entirely when absent so
   * plans that don't use it stay byte-identical.
   */
  const assembleStore = ({
    name, floors, scene3d, roamers: topRoamers, notes, imperial,
    customObjects, avatarPacks,
  }) => {
    if (!floors || !floors.length) throw new Error(`${planId}: assembleStore needs ≥1 floor`);
    if (topRoamers && topRoamers.length) {
      floors[0].roamers = [...(floors[0].roamers ?? []), ...topRoamers];
    }
    return {
      v: 2,
      floors,
      currentFloorId: floors[0].id,
      activeSensorId: null,
      coverage: true,
      imperial: !!imperial,
      showDetails: false,
      useRawTargets: false,
      showMotionZones: true,
      scene3d: scene3d ?? { preset: 'day' },
      customObjects: customObjects ?? [],
      people: [],
      bleShowUnknown: true,
      ...(avatarPacks ? { avatarPacks } : {}),
      notes: notes ?? '',
    };
  };

  return {
    id, floorRect, wall, room, door, win, furn, light, switchFix, roamer,
    floor, assembleStore,
  };
}
