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

let GEOM = null;
/** Inject the bundled src/geometry.ts namespace (FURNITURE_KINDS, …). */
export function setGeom(g) { GEOM = g; }

function kindDef(kind) {
  const map = GEOM?.FURNITURE_KINDS;
  return (map && map[kind]) || { w: 600, h: 600 };
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
   * plans). `scene3d` / `notes` as given.
   */
  const assembleStore = ({ name, floors, scene3d, roamers: topRoamers, notes, imperial }) => {
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
      customObjects: [],
      people: [],
      bleShowUnknown: true,
      notes: notes ?? '',
    };
  };

  return {
    id, floorRect, wall, room, door, win, furn, light, switchFix, roamer,
    floor, assembleStore,
  };
}
