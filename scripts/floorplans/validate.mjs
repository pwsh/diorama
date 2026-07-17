// Validator for floorplan export envelopes. Bundles the REAL src/geometry.ts
// (via geom.mjs — regenerated every run) and asserts geometric + structural
// invariants against each plan JSON. Exit is decided by the caller (build.mjs);
// validatePlan returns a { pass, checks } report.
import { loadGeom } from './geom.mjs';

// Perpendicular distance from (px,py) to segment (ax,ay)-(bx,by).
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function nearestWallDist(cx, cy, walls) {
  let best = Infinity;
  for (const w of walls) {
    const pts = w.points || [];
    for (let i = 0; i < pts.length - 1; i++) {
      const d = segDist(cx, cy, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
      if (d < best) best = d;
    }
  }
  return best;
}

/**
 * Validate ONE export envelope. Returns { pass:boolean, checks:[{ok,msg}] }.
 * `geom` = bundled src/geometry.ts namespace.
 */
export function validatePlan(env, geom) {
  const checks = [];
  const ok = (cond, msg) => { checks.push({ ok: !!cond, msg }); return !!cond; };
  const { FURNITURE_KINDS, closedWallLoops, pointInPolygon, doorSpanCenter } = geom;

  // 1. Envelope shape.
  ok(env && env.diorama === 2, 'envelope: diorama === 2');
  ok(typeof env?.name === 'string' && env.name.length > 0, 'envelope: name non-empty string');
  ok(typeof env?.exportedAt === 'string' && env.exportedAt.length > 0, 'envelope: exportedAt present');
  const store = env?.store;
  ok(store && Array.isArray(store.floors) && store.floors.length > 0, 'store: has ≥1 floor');
  if (!store || !Array.isArray(store.floors)) return { pass: false, checks };

  // 2. Unique ids across every item + floor.
  const ids = [];
  const collect = (arr) => { for (const it of (arr || [])) if (it && it.id) ids.push(it.id); };
  for (const f of store.floors) {
    ids.push(f.id);
    collect(f.walls); collect(f.rooms); collect(f.doors); collect(f.windows);
    collect(f.furniture); collect(f.lights); collect(f.switches); collect(f.roamers);
    collect(f.sensors); collect(f.motionSensors); collect(f.envSensors);
    collect(f.bleProxies); collect(f.alarmPanels); collect(f.safetySensors);
    collect(f.robots); collect(f.presenceZones); collect(f.cameras);
    collect(f.groundAreas); collect(f.voidAreas);
  }
  collect(store.people); collect(store.customObjects);
  const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
  ok(dupes.length === 0, `ids unique (${ids.length} total)` + (dupes.length ? ` — dupes: ${[...new Set(dupes)].join(', ')}` : ''));

  // 3. Notes non-empty (store-level).
  ok(typeof store.notes === 'string' && store.notes.trim().length > 0, 'store.notes non-empty');

  // Per-floor geometric checks.
  const EPS = 1;              // mm slack for on-boundary wall points
  const OPENING_TOL = 500;    // mm door/window center → nearest wall
  for (const f of store.floors) {
    const tag = `floor "${f.name}"`;

    // 4. Wall points within the floor rect.
    let outOfRect = 0;
    for (const w of (f.walls || [])) for (const p of (w.points || [])) {
      if (p.x < -EPS || p.x > f.w + EPS || p.y < -EPS || p.y > f.d + EPS) outOfRect++;
    }
    ok(outOfRect === 0, `${tag}: all wall points within 0..${f.w} × 0..${f.d}` + (outOfRect ? ` (${outOfRect} outside)` : ''));

    // 5. Room anchors inside some closed wall loop.
    const loops = closedWallLoops(f.walls || []);
    ok(loops.length > 0 || (f.rooms || []).length === 0, `${tag}: ${loops.length} closed wall loop(s) traced`);
    let orphanRooms = [];
    for (const rm of (f.rooms || [])) {
      const inside = loops.some(lp => pointInPolygon(rm.anchor.x, rm.anchor.y, lp));
      if (!inside) orphanRooms.push(rm.name || rm.id);
    }
    ok(orphanRooms.length === 0, `${tag}: every room anchor inside a loop` + (orphanRooms.length ? ` — outside: ${orphanRooms.join(', ')}` : ''));

    // 6. Door / window centers within OPENING_TOL of a wall segment.
    let farDoors = [];
    for (const d of (f.doors || [])) {
      const c = doorSpanCenter(d);
      const dist = nearestWallDist(c.x, c.y, f.walls || []);
      if (dist > OPENING_TOL) farDoors.push(`${d.id}(${Math.round(dist)}mm)`);
    }
    ok(farDoors.length === 0, `${tag}: all doors ≤${OPENING_TOL}mm from a wall` + (farDoors.length ? ` — far: ${farDoors.join(', ')}` : ''));
    let farWins = [];
    for (const wdw of (f.windows || [])) {
      const dist = nearestWallDist(wdw.x, wdw.y, f.walls || []);
      if (dist > OPENING_TOL) farWins.push(`${wdw.id}(${Math.round(dist)}mm)`);
    }
    ok(farWins.length === 0, `${tag}: all windows ≤${OPENING_TOL}mm from a wall` + (farWins.length ? ` — far: ${farWins.join(', ')}` : ''));

    // 6b. Furniture kinds ∈ FURNITURE_KINDS (custom recipes exempt).
    let badKinds = [];
    for (const fn of (f.furniture || [])) {
      if (fn.customKindId) continue;
      const k = fn.kind ?? 'block';
      if (!FURNITURE_KINDS[k]) badKinds.push(k);
    }
    ok(badKinds.length === 0, `${tag}: all furniture kinds valid` + (badKinds.length ? ` — bad: ${[...new Set(badKinds)].join(', ')}` : ''));

    // 8. Roamer avatarKinds are non-empty string pools.
    let badRoamers = [];
    for (const r of (f.roamers || [])) {
      const pool = r.avatarKinds || (r.avatarKind ? [r.avatarKind] : []);
      const good = Array.isArray(pool) && pool.length > 0 && pool.every(a => typeof a === 'string' && a.length > 0);
      if (!good) badRoamers.push(r.name || r.id);
    }
    ok(badRoamers.length === 0, `${tag}: roamer avatar pools non-empty strings` + (badRoamers.length ? ` — bad: ${badRoamers.join(', ')}` : ''));
  }

  // 7. Multi-floor: stairs stairLinkId pairs match exactly across floors.
  if (store.floors.length > 1) {
    const linkFloors = new Map(); // stairLinkId -> [floorId,…]
    for (const f of store.floors) for (const fn of (f.furniture || [])) {
      if (fn.stairLinkId) {
        if (!linkFloors.has(fn.stairLinkId)) linkFloors.set(fn.stairLinkId, []);
        linkFloors.get(fn.stairLinkId).push(f.id);
      }
    }
    let badLinks = [];
    for (const [lid, fls] of linkFloors) {
      // exactly two pieces, on two DIFFERENT floors
      if (fls.length !== 2 || fls[0] === fls[1]) badLinks.push(lid);
    }
    ok(badLinks.length === 0, `stairLinkId pairs valid (${linkFloors.size} link(s))` + (badLinks.length ? ` — bad: ${badLinks.join(', ')}` : ''));
  }

  const pass = checks.every(c => c.ok);
  return { pass, checks };
}

export { loadGeom };
