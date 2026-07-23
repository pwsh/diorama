// src/geo.ts
var EARTH_R = 6371e3;
var DEG = Math.PI / 180;
function projectLatLon(lat, lon, lat0, lon0) {
  const lat0r = lat0 * DEG;
  return {
    x: (lon - lon0) * DEG * Math.cos(lat0r) * EARTH_R,
    y: (lat - lat0) * DEG * EARTH_R
  };
}
function latLonToPlan(t, lat, lon) {
  if (t.quality === "none") return null;
  const m = projectLatLon(lat, lon, t.originLat, t.originLon);
  const px = m.x * 1e3, py = m.y * 1e3;
  const c = Math.cos(t.thetaRad), s = Math.sin(t.thetaRad);
  return { x: c * px - s * py + t.tx, y: s * px + c * py + t.ty };
}

// src/neighborhood.ts
var DEFAULT_TILE_ZOOM = 14;
var MAX_BUILDINGS = 400;
var DEG2 = Math.PI / 180;
function lonLatToTile(lat, lon, zoom) {
  const n = Math.pow(2, zoom);
  const latR = clampLat(lat) * DEG2;
  const x = Math.floor((lon + 180) / 360 * n);
  const y = Math.floor((1 - Math.asinh(Math.tan(latR)) / Math.PI) / 2 * n);
  return { z: zoom, x: wrapX(x, n), y: clampInt(y, 0, n - 1) };
}
function tileToLonLat(t, fracX, fracY) {
  const n = Math.pow(2, t.z);
  const lon = (t.x + fracX) / n * 360 - 180;
  const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (t.y + fracY) / n))) / DEG2;
  return { lat, lon };
}
function tilesForRadius(lat, lon, radiusM, zoom) {
  const r = Math.max(0, radiusM);
  const dLat = r / 111320;
  const dLon = r / (111320 * Math.max(0.05, Math.cos(clampLat(lat) * DEG2)));
  const nw = lonLatToTile(lat + dLat, lon - dLon, zoom);
  const se = lonLatToTile(lat - dLat, lon + dLon, zoom);
  const minX = Math.min(nw.x, se.x), maxX = Math.max(nw.x, se.x);
  const minY = Math.min(nw.y, se.y), maxY = Math.max(nw.y, se.y);
  const out = [];
  for (let x = minX; x <= maxX; x++)
    for (let y = minY; y <= maxY; y++)
      out.push({ z: zoom, x, y });
  return out;
}
function clampLat(lat) {
  return Math.max(-85.05112878, Math.min(85.05112878, lat));
}
function wrapX(x, n) {
  return (x % n + n) % n;
}
function clampInt(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
var ROAD_WIDTH_MM = {
  motorway: 11e3,
  trunk: 11e3,
  primary: 7e3,
  secondary: 7e3,
  tertiary: 6e3,
  minor: 6e3,
  residential: 6e3,
  unclassified: 6e3,
  living_street: 6e3,
  service: 3e3,
  track: 3e3,
  raceway: 3e3,
  path: 1200,
  footway: 1200,
  pedestrian: 1200,
  steps: 1200,
  cycleway: 1200
};
function roadWidthMm(cls) {
  return ROAD_WIDTH_MM[cls] ?? 4e3;
}
function resolveBuildingHeightM(tags, defaultLevelHeightM) {
  const rh = num(tags.render_height);
  if (rh != null && rh > 0) return rh;
  const levels = num(tags["building:levels"]);
  if (levels != null && levels > 0) return levels * defaultLevelHeightM;
  return defaultLevelHeightM;
}
function resolveBuildingBaseM(tags) {
  const mh = num(tags.render_min_height);
  return mh != null && mh > 0 ? mh : 0;
}
function num(v) {
  if (typeof v === "number") return isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return isFinite(n) ? n : null;
  }
  return null;
}
function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    const hit = yi > py !== yj > py && px < (xj - xi) * (py - yi) / (yj - yi) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}
function signedArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], q = ring[(i + 1) % ring.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}
function segCross(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  const o1 = o(a, b, c), o2 = o(a, b, d), o3 = o(c, d, a), o4 = o(c, d, b);
  return o1 !== o2 && o3 !== o4;
}
function polygonIntersectsAny(points, exclusions) {
  if (!exclusions || exclusions.length === 0 || points.length < 3) return false;
  for (const ex of exclusions) {
    if (!ex || ex.length < 3) continue;
    if (points.some((p) => pointInPolygon(p.x, p.y, ex))) return true;
    if (ex.some((p) => pointInPolygon(p.x, p.y, points))) return true;
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      for (let k = 0; k < ex.length; k++) {
        const c = ex[k], d = ex[(k + 1) % ex.length];
        if (segCross(a, b, c, d)) return true;
      }
    }
  }
  return false;
}
function filterPolylineByExclusions(points, exclusions) {
  if (points.length < 2) return [];
  if (!exclusions || exclusions.length === 0) return [points];
  const midIn = (a, b) => {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    return exclusions.some((ex) => ex && ex.length >= 3 && pointInPolygon(mx, my, ex));
  };
  const runs = [];
  let cur = null;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    if (midIn(a, b)) {
      if (cur) {
        runs.push(cur);
        cur = null;
      }
      continue;
    }
    if (!cur) {
      cur = [a];
    }
    cur.push(b);
  }
  if (cur) runs.push(cur);
  return runs.filter((r) => r.length >= 2);
}
function centroidOf(points) {
  let sx = 0, sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  const n = points.length || 1;
  return { x: sx / n, y: sy / n };
}
function capBuildings(list, origin, n) {
  if (list.length <= n) return list;
  const scored = list.map((b) => ({ b, d: dist2(centroidOf(b.points), origin) }));
  scored.sort((p, q) => p.d - q.d);
  return scored.slice(0, n).map((s) => s.b);
}
function dist2(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx * dx + dy * dy;
}
function tileTemplateSchemeOk(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url.trim());
}
function tileUrl(template, addr) {
  return template.replace(/\{z\}/g, String(addr.z)).replace(/\{x\}/g, String(addr.x)).replace(/\{y\}/g, String(addr.y));
}
function alignPlanPoint(p, origin, align) {
  const dx = align?.dx ?? 0, dy = align?.dy ?? 0, rot = (align?.rotDeg ?? 0) * DEG2;
  const c = Math.cos(rot), s = Math.sin(rot);
  const rx = p.x - origin.x, ry = p.y - origin.y;
  return { x: origin.x + (c * rx + s * ry) + dx, y: origin.y + (-s * rx + c * ry) + dy };
}
function makeAlign(origin, align) {
  return (p) => alignPlanPoint(p, origin, align);
}
function buildNeighborhoodFeatures(tiles, transform, opts = {}) {
  const fetchedAt = opts.fetchedAt ?? 0;
  const tileAddrs = tiles.map((t) => t.addr);
  const empty = { buildings: [], roads: [], water: [], landuse: [], fetchedAt, tileCount: tiles.length, tileAddrs };
  if (transform.quality === "none") return empty;
  const origin = latLonToPlan(transform, transform.originLat, transform.originLon) ?? { x: transform.tx, y: transform.ty };
  const align = makeAlign(origin, opts.align);
  const exclusions = opts.exclusions ?? [];
  const vScale = opts.verticalScale ?? 1;
  const levelH = opts.defaultLevelHeightM ?? 3;
  const want = {
    buildings: opts.layers?.buildings !== false,
    roads: opts.layers?.roads !== false,
    water: opts.layers?.water !== false,
    landuse: opts.layers?.landuse === true
    // default OFF
  };
  const projectRun = (addr, extent, run) => {
    const out = [];
    for (const v of run) {
      const ll = tileToLonLat(addr, v.x / extent, v.y / extent);
      const plan = latLonToPlan(transform, ll.lat, ll.lon);
      if (!plan) return null;
      out.push(align(plan));
    }
    return out;
  };
  const buildings = [];
  const roads = [];
  const water = [];
  const landuse = [];
  for (const tile of tiles) {
    if (want.buildings) extractBuildings(tile, projectRun, vScale, levelH, exclusions, buildings);
    if (want.roads) extractRoads(tile, projectRun, exclusions, roads);
    if (want.water) extractPolygons(tile.layers.water, tile.addr, projectRun, water);
    if (want.landuse) extractPolygons(tile.layers.landuse, tile.addr, projectRun, landuse);
  }
  const cap = opts.maxBuildings ?? MAX_BUILDINGS;
  const capped = capBuildings(buildings, origin, cap);
  return { buildings: capped, roads, water, landuse, fetchedAt, tileCount: tiles.length, tileAddrs };
}
function extractBuildings(tile, project, vScale, levelH, exclusions, out) {
  const layer = tile.layers.building;
  if (!layer) return;
  for (const f of layer.features) {
    if (f.type !== "polygon") continue;
    if (f.tags.hide_3d === true) continue;
    const heightMm = resolveBuildingHeightM(f.tags, levelH) * 1e3 * vScale;
    const baseMm = resolveBuildingBaseM(f.tags) * 1e3 * vScale;
    for (const ring of f.geometry) {
      if (ring.length < 3) continue;
      if (signedArea(ring) <= 0) continue;
      const pts = project(tile.addr, layer.extent, ring);
      if (!pts || pts.length < 3) continue;
      if (polygonIntersectsAny(pts, exclusions)) continue;
      out.push({ points: pts, heightMm, baseMm });
    }
  }
}
function extractRoads(tile, project, exclusions, out) {
  const layer = tile.layers.transportation;
  if (!layer) return;
  for (const f of layer.features) {
    if (f.type !== "line") continue;
    const cls = typeof f.tags.class === "string" ? f.tags.class : "unknown";
    const bridge = f.tags.brunnel === "bridge";
    const widthMm = roadWidthMm(cls);
    for (const line of f.geometry) {
      if (line.length < 2) continue;
      const pts = project(tile.addr, layer.extent, line);
      if (!pts || pts.length < 2) continue;
      for (const run of filterPolylineByExclusions(pts, exclusions)) {
        out.push({ points: run, widthMm, cls, bridge });
      }
    }
  }
}
function extractPolygons(layer, addr, project, out) {
  if (!layer) return;
  for (const f of layer.features) {
    if (f.type !== "polygon") continue;
    const cls = typeof f.tags.class === "string" ? f.tags.class : "unknown";
    for (const ring of f.geometry) {
      if (ring.length < 3) continue;
      if (signedArea(ring) <= 0) continue;
      const pts = project(addr, layer.extent, ring);
      if (!pts || pts.length < 3) continue;
      out.push({ points: pts, cls });
    }
  }
}
export {
  DEFAULT_TILE_ZOOM,
  MAX_BUILDINGS,
  ROAD_WIDTH_MM,
  alignPlanPoint,
  buildNeighborhoodFeatures,
  capBuildings,
  centroidOf,
  filterPolylineByExclusions,
  lonLatToTile,
  pointInPolygon,
  polygonIntersectsAny,
  resolveBuildingBaseM,
  resolveBuildingHeightM,
  roadWidthMm,
  signedArea,
  tileTemplateSchemeOk,
  tileToLonLat,
  tileUrl,
  tilesForRadius
};
