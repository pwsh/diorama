// Physical-plausibility checks for floorplan envelopes: doorway clearance,
// furniture-vs-wall overlap, nav reachability, and chair/table alignment.
//
// The nav rasterizer here (`buildNavGrid`) is a deliberate REPLICA of
// three-renderer's `_buildNav` (150 mm grid, PERSON_R = 170, same block/exempt
// rules, same sunken-stairs rails, same 8-neighbour no-corner-cut flood fill)
// so a plan that passes here is a plan avatars can actually walk.
//
// PARITY GUARD: `test-pages/nav-parity-test.html` runs BOTH implementations
// over a fixture matrix and asserts cell-for-cell agreement of the blocked
// bitmap + region structure. **Change `_buildNav` → run that page** (and vice
// versa); it is the only thing keeping these two from silently desyncing.

export const DOOR_CLEAR = 600;        // mm of keep-clear on BOTH sides of a door
export const NAV_CELL = 150;          // nav grid pitch (must match _buildNav)
export const PERSON_R = 170;          // body radius the nav grid inflates by
export const WALL_HALF = 50;          // wall thickness 100 / 2
export const WALL_OVERLAP_TOL = 40;   // mm a footprint may bite into a wall before it's an error
export const SEAT_FACE_TOL_DEG = 35;  // chair front must aim at its table within this
// A room needs at least this many free nav cells (150 mm² each) before we
// insist it be REACHABLE. 16 cells ≈ 0.36 m² — enough for a person to stand and
// turn. Below it the "room" is a reach-in closet / appliance nook nobody walks
// into (the renderer never spawns or paths there either), so demanding
// connectivity would force artificial redesigns.
export const MIN_STANDING_CELLS = 16;
// A properly tucked chair laps its table by ~100 mm (resolveSeatTableCollision
// parks the seat CENTER at the host edge + 150), so only a real "chair sitting
// on the tabletop" overlap is an error.
export const SEAT_TABLE_OVERLAP_TOL = 200;

// ── small geometry helpers (all pure, mm) ───────────────────────────────────

/** Rotated-rect corners. `rotation` = screen-CW degrees (Diorama convention). */
export function rectCorners(cx, cy, w, h, rotationDeg = 0) {
  const r = (rotationDeg || 0) * Math.PI / 180;
  const c = Math.cos(r), s = Math.sin(r);
  // localToWorld: dx = lx·c + ly·s, dy = −lx·s + ly·c  (inverse of furnitureWorldToLocal)
  const hw = w / 2, hh = h / 2;
  return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([lx, ly]) => ({
    x: cx + lx * c + ly * s,
    y: cy - lx * s + ly * c,
  }));
}

/** Piece "front" unit vector in world/plan space (local −Y = functional front). */
export function frontVector(rotationDeg = 0) {
  const r = (rotationDeg || 0) * Math.PI / 180;
  return { x: -Math.sin(r), y: -Math.cos(r) };
}

function axesOf(poly) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ex = b.x - a.x, ey = b.y - a.y;
    const len = Math.hypot(ex, ey);
    if (len < 1e-9) continue;
    out.push({ x: -ey / len, y: ex / len });
  }
  return out;
}

/**
 * SAT overlap of two convex polygons. Returns the minimum penetration depth in
 * mm (0 when they merely touch or are apart).
 */
export function convexPenetration(pa, pb) {
  let best = Infinity;
  for (const ax of [...axesOf(pa), ...axesOf(pb)]) {
    let minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity;
    for (const p of pa) { const d = p.x * ax.x + p.y * ax.y; if (d < minA) minA = d; if (d > maxA) maxA = d; }
    for (const p of pb) { const d = p.x * ax.x + p.y * ax.y; if (d < minB) minB = d; if (d > maxB) maxB = d; }
    const ov = Math.min(maxA, maxB) - Math.max(minA, minB);
    if (ov <= 0) return 0;
    if (ov < best) best = ov;
  }
  return best === Infinity ? 0 : best;
}

// ── shared plan model ───────────────────────────────────────────────────────

/**
 * Does this piece block nav? Mirrors _buildNav's furniture skip list exactly
 * (rug → stairs family → bed → riser → elevation ≥ 300), including the custom
 * -recipe def resolution.
 */
export function blocksNav(fu, geom, customObjects) {
  const def = geom.resolveFurnitureDef(fu, customObjects);
  if (!def) return true;
  if (def.rug) return false;
  if (geom.isStairsKind(fu.kind)) return false;
  if (fu.kind === 'bed') return false;
  if (geom.isRiserKind(fu.kind)) return false;
  if ((fu.elevation ?? 0) >= 300) return false;
  return true;
}

/** Solid wall runs (openings excised) as {a,b} segments — the nav/collision walls. */
export function solidWallRuns(f, geom) {
  const runs = [];
  for (const wall of (f.walls ?? [])) {
    const pts = wall.points ?? [];
    if (pts.length < 2) continue;
    if ((wall.kind ?? 'full') === 'invisible') continue;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      if (len < 1) continue;
      const ux = dx / len, uy = dy / len;
      const { solids } = geom.wallCutsForSegment(a, b, f.doors ?? [], f.windows ?? []);
      for (const s of solids) {
        if (s.t1 - s.t0 < 1) continue;
        runs.push({
          a: { x: a.x + ux * s.t0, y: a.y + uy * s.t0 },
          b: { x: a.x + ux * s.t1, y: a.y + uy * s.t1 },
        });
      }
    }
  }
  return runs;
}

const fmt = (n) => Math.round(n);
const fname = (fu) => fu.label || fu.kind || fu.id;

// ── 1. Doorway clearance ────────────────────────────────────────────────────

/**
 * A nav-blocking piece may not overlap the door's opening span nor the
 * DOOR_CLEAR-deep approach zone on EITHER side of the wall. The zone is one OBB
 * centred on the door span: door width along the wall axis, 2·DOOR_CLEAR deep
 * across it.
 */
export function doorwayBlockers(f, geom, customObjects) {
  const bad = [];
  for (const d of (f.doors ?? [])) {
    const c = geom.doorSpanCenter(d);
    // Door span runs along `rotation`; the clearance rect is that span rotated
    // into the furniture rect convention (front = local −Y ⇒ same rotation).
    const zone = rectCorners(c.x, c.y, d.w, 2 * DOOR_CLEAR, d.rotation ?? 0);
    for (const fu of (f.furniture ?? [])) {
      if (!blocksNav(fu, geom, customObjects)) continue;
      const pen = convexPenetration(zone, rectCorners(fu.x, fu.y, fu.w, fu.h, fu.rotation));
      if (pen > 1) bad.push(`${d.label || d.id} ↔ ${fname(fu)}(${fu.id}) ${fmt(pen)}mm`);
    }
  }
  return bad;
}

// ── 2. Furniture vs solid wall ──────────────────────────────────────────────

/** Kinds that legitimately sit ON / against a wall plane and may lap it. */
const WALL_HUGGING_KINDS = new Set([
  'wall_tv', 'wall_heater', 'wall_radiator', 'towel_warmer', 'mini_split',
  'window_ac', 'shower', 'ev_charger',
]);

// An ELEVATED piece is only excused from the wall test when it is shallow
// enough to READ as a wall-mounted plate (a flat TV, a radiator panel). A deep
// elevated body — a stacked dryer at elevation 990, 700 mm front-to-back — is
// free-standing volume at head height and sinks visibly into the wall, so the
// old blanket `elevation >= 300` pass let real intersections through (found by
// the strict audit: 2 stacked dryers, 100 / 50 mm deep). Wall-plane KINDS keep
// their own exemption above regardless of depth (a window AC is 400 deep by
// definition — it lives IN the wall).
export const WALL_MOUNT_MAX_DEPTH = 300;
// A rug is 5 mm of cloth on the floor: lapping a wall is invisible while the
// overlap stays inside the wall's own 100 mm volume. Past that it pokes out the
// far face into the next room, which IS an artifact.
export const RUG_OVERLAP_TOL = 2 * WALL_HALF;

/** Should this piece keep clear of solid walls? (shared by check + settle) */
export function wallCollidable(fu, geom) {
  const def = geom.FURNITURE_KINDS[fu.kind ?? 'block'];
  if (!def) return false;
  if (def.mountable) return false;                   // rides a surface host
  if (WALL_HUGGING_KINDS.has(fu.kind)) return false; // built into the wall plane
  // Shallow + elevated = a wall-mounted plate; deep + elevated is still a body.
  if ((fu.elevation ?? 0) >= 300 && (fu.h ?? def.h) <= WALL_MOUNT_MAX_DEPTH) return false;
  // Stairs are structure, not an obstacle — a flight legitimately runs from wall
  // face to wall face inside its shaft (and _buildNav treats it as terrain).
  if (geom.isStairsKind ? geom.isStairsKind(fu.kind) : false) return false;
  if (def.rug) return false;                         // flat floor covering (see rugWallOverlaps)
  return true;
}

/** A solid wall run as an OBB polygon: `len` along its axis, 100 mm thick. */
export function wallRunPoly(r) {
  const dx = r.b.x - r.a.x, dy = r.b.y - r.a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const mx = (r.a.x + r.b.x) / 2, my = (r.a.y + r.b.y) / 2;
  return [
    { x: mx + ux * len / 2 - uy * -WALL_HALF, y: my + uy * len / 2 + ux * -WALL_HALF },
    { x: mx + ux * len / 2 - uy * WALL_HALF, y: my + uy * len / 2 + ux * WALL_HALF },
    { x: mx - ux * len / 2 - uy * WALL_HALF, y: my - uy * len / 2 + ux * WALL_HALF },
    { x: mx - ux * len / 2 - uy * -WALL_HALF, y: my - uy * len / 2 + ux * -WALL_HALF },
  ];
}

/** Deepest penetration of one footprint rect into any solid wall run (mm). */
export function worstWallPenetration(poly, runs) {
  let worst = 0;
  for (const r of runs) {
    const pen = convexPenetration(poly, wallRunPoly(r));
    if (pen > worst) worst = pen;
  }
  return worst;
}

export function wallOverlaps(f, geom) {
  const runs = solidWallRuns(f, geom);
  const bad = [];
  for (const fu of (f.furniture ?? [])) {
    if (!wallCollidable(fu, geom)) continue;
    const worst = worstWallPenetration(rectCorners(fu.x, fu.y, fu.w, fu.h, fu.rotation), runs);
    if (worst > WALL_OVERLAP_TOL) bad.push(`${fname(fu)}(${fu.id}) ${fmt(worst)}mm`);
  }
  // Rugs are exempt from the body test but may not cross CLEAR THROUGH a wall.
  for (const fu of (f.furniture ?? [])) {
    if (!geom.FURNITURE_KINDS[fu.kind ?? 'block']?.rug) continue;
    const worst = worstWallPenetration(rectCorners(fu.x, fu.y, fu.w, fu.h, fu.rotation), runs);
    if (worst > RUG_OVERLAP_TOL) bad.push(`${fname(fu)}(${fu.id}) rug through wall ${fmt(worst)}mm`);
  }
  return bad;
}

// ── 2b. LIGHT fixtures with a real 3D body vs solid walls ───────────────────
//
// Check 10 covers FURNITURE only, so a `fireplace` LightIconKind — a 1000×450
// masonry firebox, the biggest single volume any light fixture builds — could
// sit clean through a wall and nothing complained (the strict audit found three
// such fireplaces, one of them facing its opening INTO the wall). The app snaps
// a dropped fireplace flush (snapFireplaceToWall: back on the wall face,
// opening into the room) and `floor()`'s settle pass now does the same at build
// time, so a compliant plan penetrates 0 mm.
//
// The other bodied light kinds — sconce / flood / exhaust_wall — are wall
// PLATES whose whole point is to occupy the wall plane, exactly like
// WALL_HUGGING_KINDS furniture, so they are deliberately not listed.
export const LIGHT_BODY_FOOTPRINT = {
  fireplace: { w: 1000, d: 450 },   // three-renderer W2 × D2
};
export const LIGHT_WALL_OVERLAP_TOL = 5;   // mm — rounding only; the snap is exact

export function lightWallOverlaps(f, geom) {
  const runs = solidWallRuns(f, geom);
  const bad = [];
  for (const l of (f.lights ?? [])) {
    const body = LIGHT_BODY_FOOTPRINT[geom.lightIconKind(l)];
    if (!body) continue;
    const worst = worstWallPenetration(
      rectCorners(l.x, l.y, body.w, body.d, l.rotation), runs);
    if (worst > LIGHT_WALL_OVERLAP_TOL) {
      bad.push(`${l.label || geom.lightIconKind(l)}(${l.id}) ${fmt(worst)}mm`);
    }
  }
  return bad;
}

// ── 3. Nav reachability ─────────────────────────────────────────────────────

/**
 * Rasterize + flood-fill exactly like _buildNav. Returns
 * `{nx, ny, cell, blocked, region, regionSize}`.
 *
 * Cell-for-cell parity with the renderer is asserted by
 * `test-pages/nav-parity-test.html` — keep them in step.
 */
export function buildNavGrid(f, geom, customObjects) {
  const cell = NAV_CELL;
  const nx = Math.max(1, Math.ceil(f.w / cell));
  const ny = Math.max(1, Math.ceil(f.d / cell));
  const blocked = new Uint8Array(nx * ny);
  const clampX = (c) => Math.max(0, Math.min(nx - 1, c));
  const clampY = (c) => Math.max(0, Math.min(ny - 1, c));
  const { furnitureWorldToLocal, pointInPolygon } = geom;

  for (const fu of (f.furniture ?? [])) {
    if (!blocksNav(fu, geom, customObjects)) continue;
    const halfW = fu.w / 2 + PERSON_R, halfH = fu.h / 2 + PERSON_R;
    const reach = Math.hypot(halfW, halfH);
    for (let cy = clampY(Math.floor((fu.y - reach) / cell)); cy <= clampY(Math.floor((fu.y + reach) / cell)); cy++) {
      for (let cx = clampX(Math.floor((fu.x - reach) / cell)); cx <= clampX(Math.floor((fu.x + reach) / cell)); cx++) {
        const wx = (cx + 0.5) * cell, wy = (cy + 0.5) * cell;
        const l = furnitureWorldToLocal(fu.rotation, wx - fu.x, wy - fu.y);
        if (Math.abs(l.x) <= halfW && Math.abs(l.y) <= halfH) blocked[cy * nx + cx] = 1;
      }
    }
  }

  const rad = WALL_HALF + PERSON_R;
  for (const r of solidWallRuns(f, geom)) {
    const dx = r.b.x - r.a.x, dy = r.b.y - r.a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const minx = Math.min(r.a.x, r.b.x) - rad, maxx = Math.max(r.a.x, r.b.x) + rad;
    const miny = Math.min(r.a.y, r.b.y) - rad, maxy = Math.max(r.a.y, r.b.y) + rad;
    for (let cy = clampY(Math.floor(miny / cell)); cy <= clampY(Math.floor(maxy / cell)); cy++) {
      for (let cx = clampX(Math.floor(minx / cell)); cx <= clampX(Math.floor(maxx / cell)); cx++) {
        const wx = (cx + 0.5) * cell, wy = (cy + 0.5) * cell;
        const t = Math.max(0, Math.min(len, (wx - r.a.x) * ux + (wy - r.a.y) * uy));
        if (Math.hypot(wx - (r.a.x + ux * t), wy - (r.a.y + uy * t)) <= rad) blocked[cy * nx + cx] = 1;
      }
    }
  }

  const stairsFamily = (f.furniture ?? []).filter(fu => geom.isStairsKind(fu.kind));
  const sunkenStairs = stairsFamily.filter(fu => (fu.elevation ?? 0) < 0);
  const onStairTerrain = (wx, wy) => stairsFamily.some(st => {
    const l = furnitureWorldToLocal(st.rotation, wx - st.x, wy - st.y);
    return Math.abs(l.x) <= st.w / 2 && Math.abs(l.y) <= st.h / 2;
  });

  for (const vd of (f.voidAreas ?? [])) {
    if (vd.hidden || (vd.points ?? []).length < 3) continue;
    for (let cy = 0; cy < ny; cy++) for (let cx = 0; cx < nx; cx++) {
      const wx = (cx + 0.5) * cell, wy = (cy + 0.5) * cell;
      if (!pointInPolygon(wx, wy, vd.points)) continue;
      if (onStairTerrain(wx, wy)) continue;
      blocked[cy * nx + cx] = 1;
    }
  }
  for (const pl of (f.pools ?? [])) {
    if (pl.hidden || (pl.points ?? []).length < 3) continue;
    for (let cy = 0; cy < ny; cy++) for (let cx = 0; cx < nx; cx++) {
      const wx = (cx + 0.5) * cell, wy = (cy + 0.5) * cell;
      if (pointInPolygon(wx, wy, pl.points)) blocked[cy * nx + cx] = 1;
    }
  }

  // Nav rails for SUNKEN (elevation < 0) stairs-family flights: a one-cell band
  // (thickened to 1.5 cells so rotation can't leak a gap) hugging the two long
  // (±x) sides and the deep (−y) end, leaving the shallow (+y) top edge open —
  // so a descending flight is a dead-end corridor you can only enter from the
  // top. Cells that are another flight's walkable terrain are never railed
  // (chained flight → landing → flight stays connected).
  const railBand = cell * 1.5;
  for (const fu of sunkenStairs) {
    const halfW = fu.w / 2, halfH = fu.h / 2;
    const reach = Math.hypot(halfW, halfH) + railBand + cell;
    for (let cy = clampY(Math.floor((fu.y - reach) / cell)); cy <= clampY(Math.floor((fu.y + reach) / cell)); cy++) {
      for (let cx = clampX(Math.floor((fu.x - reach) / cell)); cx <= clampX(Math.floor((fu.x + reach) / cell)); cx++) {
        const wx = (cx + 0.5) * cell, wy = (cy + 0.5) * cell;
        const l = furnitureWorldToLocal(fu.rotation, wx - fu.x, wy - fu.y);
        if (Math.abs(l.x) <= halfW && Math.abs(l.y) <= halfH) continue;  // tread
        const rightSide = l.x > halfW && l.x <= halfW + railBand &&
                          l.y <= halfH && l.y >= -halfH - railBand;
        const leftSide  = l.x < -halfW && l.x >= -halfW - railBand &&
                          l.y <= halfH && l.y >= -halfH - railBand;
        const deepEnd   = l.y < -halfH && l.y >= -halfH - railBand &&
                          l.x <= halfW + railBand && l.x >= -halfW - railBand;
        if (!(rightSide || leftSide || deepEnd)) continue;
        if (onStairTerrain(wx, wy)) continue;
        blocked[cy * nx + cx] = 1;
      }
    }
  }

  // 8-neighbour flood fill, diagonals only through open orthogonals.
  const region = new Int32Array(nx * ny).fill(-1);
  const queue = new Int32Array(nx * ny);
  const regionSize = [];
  let next = 0;
  for (let s = 0; s < blocked.length; s++) {
    if (blocked[s] || region[s] !== -1) continue;
    const id = next++;
    let head = 0, tail = 0, size = 0;
    queue[tail++] = s; region[s] = id;
    while (head < tail) {
      const cur = queue[head++]; size++;
      const cx = cur % nx, cy = (cur / nx) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const ncx = cx + dx, ncy = cy + dy;
        if (ncx < 0 || ncy < 0 || ncx >= nx || ncy >= ny) continue;
        const ni = ncy * nx + ncx;
        if (blocked[ni] || region[ni] !== -1) continue;
        if (dx !== 0 && dy !== 0 && (blocked[cy * nx + ncx] || blocked[ncy * nx + cx])) continue;
        region[ni] = id; queue[tail++] = ni;
      }
    }
    regionSize[id] = size;
  }
  return { nx, ny, cell, blocked, region, regionSize };
}

/**
 * Every room anchor's enclosing loop must resolve to the SAME nav region — the
 * interior is one connected walkable space. Returns { groups, empties }.
 */
export function roomRegions(f, geom, customObjects) {
  const grid = buildNavGrid(f, geom, customObjects);
  const loops = geom.closedWallLoops(f.walls ?? []);
  const out = [];
  for (const rm of (f.rooms ?? [])) {
    const loop = loops.find(lp => geom.pointInPolygon(rm.anchor.x, rm.anchor.y, lp));
    const counts = new Map();
    if (loop) {
      for (let cy = 0; cy < grid.ny; cy++) for (let cx = 0; cx < grid.nx; cx++) {
        const i = cy * grid.nx + cx;
        if (grid.blocked[i]) continue;
        const wx = (cx + 0.5) * grid.cell, wy = (cy + 0.5) * grid.cell;
        if (!geom.pointInPolygon(wx, wy, loop)) continue;
        counts.set(grid.region[i], (counts.get(grid.region[i]) ?? 0) + 1);
      }
    }
    let bestR = -1, bestN = 0;
    for (const [r, n] of counts) if (n > bestN) { bestN = n; bestR = r; }
    out.push({ name: rm.name || rm.id, region: bestR, cells: bestN });
  }
  return out;
}

// ── 4. Chair / seat alignment ───────────────────────────────────────────────

export function seatAlignment(f, geom) {
  const { FURNITURE_KINDS, seatBelongsToTable, TABLE_CARRY_MARGIN_MM } = geom;
  const items = f.furniture ?? [];
  const isHost = (fu) => {
    const a = FURNITURE_KINDS[fu.kind ?? 'block']?.activity;
    return a === 'eat_at_table' || a === 'work_at_desk';
  };
  const bad = [];
  for (const seat of items) {
    const def = FURNITURE_KINDS[seat.kind ?? 'block'];
    if (!def?.seat) continue;
    // Nearest host this seat belongs to (capture rect, rotation-aware).
    let host = null, hostD = Infinity;
    for (const h of items) {
      if (h.id === seat.id || !isHost(h)) continue;
      const belongs = seatBelongsToTable
        ? seatBelongsToTable(h.x, h.y, h.rotation, h.w, h.h, seat.x, seat.y, TABLE_CARRY_MARGIN_MM ?? 450)
        : false;
      if (!belongs) continue;
      const d = Math.hypot(h.x - seat.x, h.y - seat.y);
      if (d < hostD) { hostD = d; host = h; }
    }
    if (!host) continue;
    // Aim at the NEAREST POINT of the tabletop, not its centre — a chair at the
    // end of a long table faces straight across the edge in front of it, which
    // is correct even though the table's centre is well off to one side.
    const l = geom.furnitureWorldToLocal(host.rotation, seat.x - host.x, seat.y - host.y);
    const hx = host.w / 2, hy = host.h / 2;
    const inside = Math.abs(l.x) < hx && Math.abs(l.y) < hy;
    if (!inside) {
      const clx = Math.max(-hx, Math.min(hx, l.x)), cly = Math.max(-hy, Math.min(hy, l.y));
      const hr = (host.rotation ?? 0) * Math.PI / 180;
      const c = Math.cos(hr), s = Math.sin(hr);
      const tx = host.x + clx * c + cly * s - seat.x;
      const ty = host.y - clx * s + cly * c - seat.y;
      const fv = frontVector(seat.rotation);
      const tl = Math.hypot(tx, ty);
      // Seat centre sits ON the tabletop edge (a fully tucked stool) — there is
      // no meaningful bearing; the overlap test below governs.
      if (tl < 50) continue;
      const cos = (fv.x * tx + fv.y * ty) / tl;
      const ang = Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
      if (ang > SEAT_FACE_TOL_DEG) {
        bad.push(`${fname(seat)}(${seat.id}) faces ${fmt(ang)}° off ${fname(host)}`);
        continue;
      }
    }
    const pen = convexPenetration(
      rectCorners(seat.x, seat.y, seat.w, seat.h, seat.rotation),
      rectCorners(host.x, host.y, host.w, host.h, host.rotation));
    if (pen > SEAT_TABLE_OVERLAP_TOL) {
      bad.push(`${fname(seat)}(${seat.id}) laps ${fname(host)} by ${fmt(pen)}mm`);
    }
  }
  return bad;
}
