// Low-cost astronomically-correct sky positions — pure + deterministic. Every
// function takes an EXPLICIT epoch (Unix ms) and NEVER reads the clock itself,
// so the test page + the renderer's slow tick supply their own time and results
// are reproducible. The only import is the sibling data module sky-catalog.ts
// (bright-star catalog + planet render info); no three.js, no DOM, no state.
//
// Methods
// ───────
// • Sidereal time / horizontal coordinates: standard IAU formulae.
// • Sun / planets / Moon: Paul Schlyter's low-precision algorithms
//   ("Computing planetary positions", stjarnhimlen.se) — Keplerian elements
//   linear in Schlyter's day number d = JD − 2451543.5, Kepler solved
//   iteratively, heliocentric → geocentric → equatorial. Jupiter/Saturn carry
//   their major mutual perturbation terms (a handful of trig terms); the Moon
//   carries Schlyter's listed lunar perturbations (~arcminute class). Accuracy
//   is a few arcminutes for the Sun/planets and ~1–2 arcminutes (geocentric)
//   for the Moon — far finer than the dome's ~1° render resolution.
//
// Coordinate conventions
// ──────────────────────
// • RA/Dec in RADIANS (equatorial, geocentric, of-date obliquity).
// • Horizontal: altRad (0 = horizon, +up), azRad measured CLOCKWISE from true
//   NORTH (0 = N, π/2 = E, π = S) — matches Diorama's "compass ° CW from true
//   north" sun plumbing, so the renderer maps it through the same geo-θ rotation
//   the sun uses.

import { STARS, LINES, PLANET_INFO } from './sky-catalog.js';

const DEG = Math.PI / 180;
const TWO_PI = Math.PI * 2;
const rev = (x: number): number => x - Math.floor(x / TWO_PI) * TWO_PI; // → [0, 2π)
const revDeg = (x: number): number => x - Math.floor(x / 360) * 360;

// Julian Day from Unix epoch milliseconds. JD 2440587.5 = 1970-01-01T00:00:00Z.
export function julianDay(ms: number): number {
  return ms / 86400000 + 2440587.5;
}

// Schlyter day number: 0.0 at 2000-01-00 0:00 UT (= 1999-12-31.0 = JD 2451543.5).
export function dayNumber(ms: number): number {
  return julianDay(ms) - 2451543.5;
}

// Greenwich Mean Sidereal Time (radians) from Julian Day. IAU 1982 series.
export function gmstRad(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  let deg = 280.46061837 + 360.98564736629 * (jd - 2451545.0)
    + 0.000387933 * T * T - (T * T * T) / 38710000.0;
  deg = revDeg(deg);
  return deg * DEG;
}

// Local (apparent-mean) sidereal time (radians). lonRad EAST-positive.
export function lstRad(ms: number, lonRad: number): number {
  return rev(gmstRad(julianDay(ms)) + lonRad);
}

// Equatorial → horizontal. Returns { altRad, azRad } with az CW from North.
export function raDecToAltAz(raRad: number, decRad: number, latRad: number, lst: number):
    { altRad: number; azRad: number } {
  const H = lst - raRad;                         // hour angle
  const sinAlt = Math.sin(decRad) * Math.sin(latRad)
    + Math.cos(decRad) * Math.cos(latRad) * Math.cos(H);
  const altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  // Azimuth CW from North (0=N, +E). Derived from the standard rotation; verified
  // against Polaris (az≈0, alt≈lat) and an object rising due east (az≈90).
  const y = -Math.cos(decRad) * Math.sin(H);
  const x = Math.sin(decRad) * Math.cos(latRad) - Math.cos(decRad) * Math.sin(latRad) * Math.cos(H);
  const azRad = rev(Math.atan2(y, x));
  return { altRad, azRad };
}

// Obliquity of the ecliptic (radians) at Schlyter day number d.
function obliquity(d: number): number {
  return (23.4393 - 3.563e-7 * d) * DEG;
}

// Solve Kepler's equation for the eccentric anomaly (radians). M in radians,
// e dimensionless. Newton iteration; a handful of steps reaches machine-ish
// precision at these eccentricities.
function eccentricAnomaly(M: number, e: number): number {
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let i = 0; i < 8; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E;
}

// ── Sun ──────────────────────────────────────────────────────────────────
// Returns geocentric ecliptic rectangular (xs, ys; zs = 0), true longitude,
// distance r (AU), and the Sun's mean anomaly Ms (deg) — the last needed by the
// planet/Moon perturbation terms.
function sunPosition(d: number): { xs: number; ys: number; lonRad: number; r: number; MsDeg: number } {
  const w = 282.9404 + 4.70935e-5 * d;           // deg — longitude of perihelion
  const e = 0.016709 - 1.151e-9 * d;
  const MsDeg = revDeg(356.0470 + 0.9856002585 * d);
  const M = MsDeg * DEG;
  const E = eccentricAnomaly(M, e);
  const xv = Math.cos(E) - e;
  const yv = Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const lonRad = rev(v + w * DEG);
  return { xs: r * Math.cos(lonRad), ys: r * Math.sin(lonRad), lonRad, r, MsDeg };
}

export function sunRaDec(ms: number): { raRad: number; decRad: number } {
  const d = dayNumber(ms);
  const { xs, ys } = sunPosition(d);
  const ecl = obliquity(d);
  const xe = xs;
  const ye = ys * Math.cos(ecl);
  const ze = ys * Math.sin(ecl);
  return { raRad: rev(Math.atan2(ye, xe)), decRad: Math.atan2(ze, Math.hypot(xe, ye)) };
}

// ── Planets ─────────────────────────────────────────────────────────────
interface Elements { N: number; i: number; w: number; a: number; e: number; M: number } // deg / AU
function planetElements(name: string, d: number): Elements {
  switch (name) {
    case 'mercury': return {
      N: 48.3313 + 3.24587e-5 * d, i: 7.0047 + 5.00e-8 * d, w: 29.1241 + 1.01444e-5 * d,
      a: 0.387098, e: 0.205635 + 5.59e-10 * d, M: 168.6562 + 4.0923344368 * d };
    case 'venus': return {
      N: 76.6799 + 2.46590e-5 * d, i: 3.3946 + 2.75e-8 * d, w: 54.8910 + 1.38374e-5 * d,
      a: 0.723330, e: 0.006773 - 1.302e-9 * d, M: 48.0052 + 1.6021302244 * d };
    case 'mars': return {
      N: 49.5574 + 2.11081e-5 * d, i: 1.8497 - 1.78e-8 * d, w: 286.5016 + 2.92961e-5 * d,
      a: 1.523688, e: 0.093405 + 2.516e-9 * d, M: 18.6021 + 0.5240207766 * d };
    case 'jupiter': return {
      N: 100.4542 + 2.76854e-5 * d, i: 1.3030 - 1.557e-7 * d, w: 273.8777 + 1.64505e-5 * d,
      a: 5.20256, e: 0.048498 + 4.469e-9 * d, M: 19.8950 + 0.0830853001 * d };
    case 'saturn': return {
      N: 113.6634 + 2.38980e-5 * d, i: 2.4886 - 1.081e-7 * d, w: 339.3939 + 2.97661e-5 * d,
      a: 9.55475, e: 0.055546 - 9.499e-9 * d, M: 316.9670 + 0.0334442282 * d };
    default: throw new Error('unknown planet ' + name);
  }
}

// Geocentric equatorial RA/Dec + geocentric ecliptic latitude (rad) for a planet.
export function planetRaDec(name: string, ms: number):
    { raRad: number; decRad: number; eclLatRad: number } {
  const d = dayNumber(ms);
  const el = planetElements(name, d);
  const N = revDeg(el.N) * DEG, iR = el.i * DEG, wR = revDeg(el.w) * DEG;
  const M = revDeg(el.M) * DEG;
  const E = eccentricAnomaly(M, el.e);
  const xv = el.a * (Math.cos(E) - el.e);
  const yv = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.hypot(xv, yv);
  // Heliocentric ecliptic rectangular.
  let xh = r * (Math.cos(N) * Math.cos(v + wR) - Math.sin(N) * Math.sin(v + wR) * Math.cos(iR));
  let yh = r * (Math.sin(N) * Math.cos(v + wR) + Math.cos(N) * Math.sin(v + wR) * Math.cos(iR));
  let zh = r * (Math.sin(v + wR) * Math.sin(iR));
  let lon = Math.atan2(yh, xh);
  let lat = Math.atan2(zh, Math.hypot(xh, yh));

  // Jupiter/Saturn mutual perturbations (Schlyter) — added to lon/lat (deg).
  if (name === 'jupiter' || name === 'saturn') {
    const Mj = revDeg(planetElements('jupiter', d).M);
    const Msa = revDeg(planetElements('saturn', d).M);
    const S = (x: number) => Math.sin(x * DEG);
    const C = (x: number) => Math.cos(x * DEG);
    let dlon = 0, dlat = 0;
    if (name === 'jupiter') {
      dlon = -0.332 * S(2 * Mj - 5 * Msa - 67.6)
        - 0.056 * S(2 * Mj - 2 * Msa + 21)
        + 0.042 * S(3 * Mj - 5 * Msa + 21)
        - 0.036 * S(Mj - 2 * Msa)
        + 0.022 * C(Mj - Msa)
        + 0.023 * S(2 * Mj - 3 * Msa + 52)
        - 0.016 * S(Mj - 5 * Msa - 69);
    } else {
      dlon = 0.812 * S(2 * Mj - 5 * Msa - 67.6)
        - 0.229 * C(2 * Mj - 4 * Msa - 2)
        + 0.119 * S(Mj - 2 * Msa - 3)
        + 0.046 * S(2 * Mj - 6 * Msa - 69)
        + 0.014 * S(Mj - 3 * Msa + 32);
      dlat = -0.020 * C(2 * Mj - 4 * Msa - 2)
        + 0.018 * S(2 * Mj - 6 * Msa - 49);
    }
    lon += dlon * DEG; lat += dlat * DEG;
    // Rebuild heliocentric rectangular from perturbed lon/lat (r unchanged).
    xh = r * Math.cos(lon) * Math.cos(lat);
    yh = r * Math.sin(lon) * Math.cos(lat);
    zh = r * Math.sin(lat);
  }

  // Geocentric ecliptic = heliocentric planet + geocentric Sun.
  const sun = sunPosition(d);
  const xg = xh + sun.xs, yg = yh + sun.ys, zg = zh;
  const ecl = obliquity(d);
  const xe = xg;
  const ye = yg * Math.cos(ecl) - zg * Math.sin(ecl);
  const ze = yg * Math.sin(ecl) + zg * Math.cos(ecl);
  return {
    raRad: rev(Math.atan2(ye, xe)),
    decRad: Math.atan2(ze, Math.hypot(xe, ye)),
    eclLatRad: lat,
  };
}

export function planetAltAz(name: string, ms: number, latRad: number, lonRad: number):
    { altRad: number; azRad: number; mag: number } {
  const { raRad, decRad } = planetRaDec(name, ms);
  const h = raDecToAltAz(raRad, decRad, latRad, lstRad(ms, lonRad));
  return { ...h, mag: PLANET_INFO[name]?.mag ?? 0 };
}

// ── Moon ────────────────────────────────────────────────────────────────
// Geocentric RA/Dec + geocentric ecliptic lon/lat (rad). Schlyter's lunar
// theory with his listed perturbation terms.
export function moonRaDec(ms: number):
    { raRad: number; decRad: number; eclLonRad: number; eclLatRad: number } {
  const d = dayNumber(ms);
  const N = revDeg(125.1228 - 0.0529538083 * d) * DEG;
  const iR = 5.1454 * DEG;
  const w = revDeg(318.0634 + 0.1643573223 * d) * DEG;
  const a = 60.2666;                              // Earth radii
  const e = 0.054900;
  const MdEg = revDeg(115.3654 + 13.0649929509 * d);
  const M = MdEg * DEG;
  const E = eccentricAnomaly(M, e);
  const xv = a * (Math.cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  let r = Math.hypot(xv, yv);
  const xh = r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(iR));
  const yh = r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(iR));
  const zh = r * (Math.sin(v + w) * Math.sin(iR));
  let lon = Math.atan2(yh, xh);
  let lat = Math.atan2(zh, Math.hypot(xh, yh));

  // Perturbation arguments (degrees).
  const sun = sunPosition(d);
  const Ls = revDeg(sun.MsDeg + 282.9404 + 4.70935e-5 * d);   // Sun mean longitude
  const Lm = revDeg(125.1228 - 0.0529538083 * d + 318.0634 + 0.1643573223 * d + MdEg); // Moon mean lon
  const Ms = sun.MsDeg;                            // Sun mean anomaly
  const Mm = MdEg;                                 // Moon mean anomaly
  const Dm = revDeg(Lm - Ls);                      // Moon mean elongation
  const F = revDeg(Lm - (125.1228 - 0.0529538083 * d)); // argument of latitude
  const S = (x: number) => Math.sin(x * DEG);

  let dlonDeg = -1.274 * S(Mm - 2 * Dm)
    + 0.658 * S(2 * Dm)
    - 0.186 * S(Ms)
    - 0.059 * S(2 * Mm - 2 * Dm)
    - 0.057 * S(Mm - 2 * Dm + Ms)
    + 0.053 * S(Mm + 2 * Dm)
    + 0.046 * S(2 * Dm - Ms)
    + 0.041 * S(Mm - Ms)
    - 0.035 * S(Dm)
    - 0.031 * S(Mm + Ms)
    - 0.015 * S(2 * F - 2 * Dm)
    + 0.011 * S(Mm - 4 * Dm);
  let dlatDeg = -0.173 * S(F - 2 * Dm)
    - 0.055 * S(Mm - F - 2 * Dm)
    - 0.046 * S(Mm + F - 2 * Dm)
    + 0.033 * S(F + 2 * Dm)
    + 0.017 * S(2 * Mm + F);
  const drEr = -0.58 * Math.cos((Mm - 2 * Dm) * DEG) - 0.46 * Math.cos(2 * Dm * DEG);

  lon = rev(lon + dlonDeg * DEG);
  lat += dlatDeg * DEG;
  r += drEr;

  const xg = r * Math.cos(lon) * Math.cos(lat);
  const yg = r * Math.sin(lon) * Math.cos(lat);
  const zg = r * Math.sin(lat);
  const ecl = obliquity(d);
  const xe = xg;
  const ye = yg * Math.cos(ecl) - zg * Math.sin(ecl);
  const ze = yg * Math.sin(ecl) + zg * Math.cos(ecl);
  return {
    raRad: rev(Math.atan2(ye, xe)),
    decRad: Math.atan2(ze, Math.hypot(xe, ye)),
    eclLonRad: lon,
    eclLatRad: lat,
  };
}

export function moonAltAz(ms: number, latRad: number, lonRad: number):
    { altRad: number; azRad: number } {
  const { raRad, decRad } = moonRaDec(ms);
  return raDecToAltAz(raRad, decRad, latRad, lstRad(ms, lonRad));
}

// ── Snapshot ──────────────────────────────────────────────────────────────
export const PLANETS = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'] as const;

export interface SnapStar { i: number; altRad: number; azRad: number; mag: number }
export interface SnapPlanet { name: string; altRad: number; azRad: number; mag: number; tint: number }
export interface SkySnapshot {
  stars: SnapStar[];         // above-horizon catalog stars (alt ≥ MIN_ALT)
  visible: Set<number>;      // catalog indices in `stars` (for line filtering)
  lines: number[][];         // raw catalog line index pairs (renderer filters by `visible`)
  planets: SnapPlanet[];     // all five, regardless of altitude (renderer hides below horizon)
  moon: { altRad: number; azRad: number };
}

// Everything below this altitude is dropped from `stars` (and, via `visible`,
// from drawn lines) so neither the stars nor the figures pile onto the horizon.
export const MIN_STAR_ALT = 0.03; // rad ≈ 1.7°

// Area-uniform sample of points on the spherical CAP above `minAltRad`, using a
// deterministic LCG (same PRNG the renderer's decorative starfield uses). The
// horizon-ring cleanup: sampling sin(alt) uniformly over [sin(minAlt), 1] is
// exactly area-uniform on the cap, so points never pile onto the horizon (the
// old code CLAMPED the lower hemisphere to a fixed low altitude, ringing every
// below-horizon draw onto one latitude). Returns {altRad, azRad}; az uniform.
export function capSampleAltAz(n: number, minAltRad: number, seed = 0x51ed):
    { altRad: number; azRad: number }[] {
  let s = seed & 0x7fffffff;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const sinMin = Math.sin(minAltRad);
  const out: { altRad: number; azRad: number }[] = [];
  for (let i = 0; i < n; i++) {
    const sinAlt = sinMin + rnd() * (1 - sinMin);   // uniform in sin(alt) ⇒ area-uniform
    const altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
    const azRad = rnd() * TWO_PI;
    out.push({ altRad, azRad });
  }
  return out;
}

// Compute the whole sky for one instant + observer. Zero external state.
export function skySnapshot(ms: number, latDeg: number, lonDeg: number): SkySnapshot {
  const latRad = latDeg * DEG, lonRad = lonDeg * DEG;
  const lst = lstRad(ms, lonRad);
  const stars: SnapStar[] = [];
  const visible = new Set<number>();
  for (let i = 0; i < STARS.length; i++) {
    const s = STARS[i];
    const raRad = (s[0] / 24) * TWO_PI;
    const decRad = s[1] * DEG;
    const { altRad, azRad } = raDecToAltAz(raRad, decRad, latRad, lst);
    if (altRad < MIN_STAR_ALT) continue;
    stars.push({ i, altRad, azRad, mag: s[2] });
    visible.add(i);
  }
  const planets: SnapPlanet[] = PLANETS.map((name) => {
    const { altRad, azRad, mag } = planetAltAz(name, ms, latRad, lonRad);
    return { name, altRad, azRad, mag, tint: PLANET_INFO[name]?.tint ?? 0xffffff };
  });
  return { stars, visible, lines: LINES, planets, moon: moonAltAz(ms, latRad, lonRad) };
}
