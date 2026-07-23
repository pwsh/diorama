const EARTH_R = 6371e3;
const DEG = Math.PI / 180;
function projectLatLon(lat, lon, lat0, lon0) {
  const lat0r = lat0 * DEG;
  return {
    x: (lon - lon0) * DEG * Math.cos(lat0r) * EARTH_R,
    y: (lat - lat0) * DEG * EARTH_R
  };
}
function unprojectMeters(x, y, lat0, lon0) {
  const lat0r = lat0 * DEG;
  return {
    lat: lat0 + y / EARTH_R / DEG,
    lon: lon0 + x / (EARTH_R * Math.cos(lat0r)) / DEG
  };
}
function fitGeoTransform(pairs, northDeg) {
  if (pairs.length === 0) {
    return {
      originLat: 0,
      originLon: 0,
      thetaRad: 0,
      tx: 0,
      ty: 0,
      rmsMm: 0,
      residualsMm: [],
      fittedScale: 1,
      quality: "none"
    };
  }
  const originLat = pairs[0].lat, originLon = pairs[0].lon;
  const P = pairs.map((pr) => {
    const m = projectLatLon(pr.lat, pr.lon, originLat, originLon);
    return { x: m.x * 1e3, y: m.y * 1e3 };
  });
  const Q = pairs.map((pr) => ({ x: pr.x, y: pr.y }));
  if (pairs.length === 1) {
    const theta2 = (northDeg ?? 0) * DEG;
    const c2 = Math.cos(theta2), s2 = Math.sin(theta2);
    const tx2 = Q[0].x - (c2 * P[0].x - s2 * P[0].y);
    const ty2 = Q[0].y - (s2 * P[0].x + c2 * P[0].y);
    return {
      originLat,
      originLon,
      thetaRad: theta2,
      tx: tx2,
      ty: ty2,
      rmsMm: 0,
      residualsMm: [0],
      fittedScale: 1,
      quality: "single"
    };
  }
  const n = pairs.length;
  const pBar = { x: P.reduce((a, v) => a + v.x, 0) / n, y: P.reduce((a, v) => a + v.y, 0) / n };
  const qBar = { x: Q.reduce((a, v) => a + v.x, 0) / n, y: Q.reduce((a, v) => a + v.y, 0) / n };
  let sxy = 0, sxx = 0, normP = 0, normQ = 0;
  for (let i = 0; i < n; i++) {
    const px = P[i].x - pBar.x, py = P[i].y - pBar.y;
    const qx = Q[i].x - qBar.x, qy = Q[i].y - qBar.y;
    sxy += px * qy - py * qx;
    sxx += px * qx + py * qy;
    normP += px * px + py * py;
    normQ += qx * qx + qy * qy;
  }
  const theta = Math.atan2(sxy, sxx);
  const c = Math.cos(theta), s = Math.sin(theta);
  const tx = qBar.x - (c * pBar.x - s * pBar.y);
  const ty = qBar.y - (s * pBar.x + c * pBar.y);
  const residualsMm = [];
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const mx = c * P[i].x - s * P[i].y + tx;
    const my = s * P[i].x + c * P[i].y + ty;
    const d = Math.hypot(Q[i].x - mx, Q[i].y - my);
    residualsMm.push(d);
    sse += d * d;
  }
  const rmsMm = Math.sqrt(sse / n);
  const fittedScale = normP > 0 ? Math.sqrt(normQ / normP) : 1;
  return {
    originLat,
    originLon,
    thetaRad: theta,
    tx,
    ty,
    rmsMm,
    residualsMm,
    fittedScale,
    quality: "full"
  };
}
function latLonToPlan(t, lat, lon) {
  if (t.quality === "none") return null;
  const m = projectLatLon(lat, lon, t.originLat, t.originLon);
  const px = m.x * 1e3, py = m.y * 1e3;
  const c = Math.cos(t.thetaRad), s = Math.sin(t.thetaRad);
  return { x: c * px - s * py + t.tx, y: s * px + c * py + t.ty };
}
function planToLatLon(t, x, y) {
  if (t.quality === "none") return null;
  const c = Math.cos(t.thetaRad), s = Math.sin(t.thetaRad);
  const dx = x - t.tx, dy = y - t.ty;
  const px = c * dx + s * dy;
  const py = -s * dx + c * dy;
  return unprojectMeters(px / 1e3, py / 1e3, t.originLat, t.originLon);
}
function projectRecordedPins(pins, fit) {
  return pins.map((p) => {
    const plan = fit ? latLonToPlan(fit, p.lat, p.lon) : null;
    return plan ? { id: p.id, name: p.name, x: plan.x, y: plan.y, accuracy: p.accuracy, ok: true } : { id: p.id, name: p.name, x: 0, y: 0, accuracy: p.accuracy, ok: false };
  });
}
function recordedChainLengthMm(pins, closed) {
  const pts = pins.filter((p) => p.ok);
  if (pts.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  if (closed && pts.length >= 3) {
    const a = pts[0], b = pts[pts.length - 1];
    total += Math.hypot(a.x - b.x, a.y - b.y);
  }
  return total;
}
function clampToBoundary(fw, fd, boundaryMm, x, y) {
  const cx = fw / 2, cy = fd / 2;
  const minX = -boundaryMm, maxX = fw + boundaryMm;
  const minY = -boundaryMm, maxY = fd + boundaryMm;
  const dx = x - cx, dy = y - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  let t = Infinity;
  if (dx > 0) t = Math.min(t, (maxX - cx) / dx);
  else if (dx < 0) t = Math.min(t, (minX - cx) / dx);
  if (dy > 0) t = Math.min(t, (maxY - cy) / dy);
  else if (dy < 0) t = Math.min(t, (minY - cy) / dy);
  if (!isFinite(t)) return { x, y };
  return { x: cx + t * dx, y: cy + t * dy };
}
function planBearingDeg(thetaRad, dx, dy) {
  const c = Math.cos(thetaRad), s = Math.sin(thetaRad);
  const east = c * dx + s * dy;
  const north = -s * dx + c * dy;
  return (Math.atan2(east, north) * 180 / Math.PI % 360 + 360) % 360;
}
function compass8(deg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round((deg % 360 + 360) % 360 / 45) % 8];
}
function parseLatLon(text) {
  if (typeof text !== "string") return null;
  const toks = text.trim().replace(/,/g, " ").split(/\s+/).filter(Boolean);
  if (toks.length !== 2) return null;
  if (!toks.every((t) => /^[+-]?(\d+\.?\d*|\.\d+)$/.test(t))) return null;
  const lat = Number(toks[0]), lon = Number(toks[1]);
  if (!isFinite(lat) || !isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}
const M_PER_MILE = 1609.344;
const M_PER_FOOT = 0.3048;
function fmtDistanceM(meters, imperial) {
  if (!isFinite(meters)) meters = 0;
  const m = Math.max(0, meters);
  if (imperial) {
    if (m < 1e3) return `${Math.round(m / M_PER_FOOT)} ft`;
    return `${(m / M_PER_MILE).toFixed(2)} mi`;
  }
  if (m < 1e3) return `${Math.round(m)} m`;
  return `${(m / 1e3).toFixed(1)} km`;
}
function fmtAccuracyM(meters, imperial) {
  if (!isFinite(meters)) meters = 0;
  const m = Math.max(0, meters);
  if (imperial) return `\xB1${Math.round(m / M_PER_FOOT)} ft`;
  return `\xB1${Math.round(m)} m`;
}
function medianLatLon(samples) {
  if (samples.length === 0) return null;
  const med = (arr) => {
    const s = [...arr].sort((a, b) => a - b);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const accs = samples.map((s) => s.accuracy).filter((a) => typeof a === "number" && isFinite(a));
  return {
    lat: med(samples.map((s) => s.lat)),
    lon: med(samples.map((s) => s.lon)),
    count: samples.length,
    accuracy: accs.length ? med(accs) : null
  };
}
export {
  clampToBoundary,
  compass8,
  fitGeoTransform,
  fmtAccuracyM,
  fmtDistanceM,
  latLonToPlan,
  medianLatLon,
  parseLatLon,
  planBearingDeg,
  planToLatLon,
  projectLatLon,
  projectRecordedPins,
  recordedChainLengthMm,
  unprojectMeters
};
