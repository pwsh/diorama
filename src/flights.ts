// Live aircraft (ADS-B) normalization + display geometry — PURE and
// deterministic. ZERO imports: no three.js, no DOM, no network, no Planner —
// this module is shared by BOTH the app graph and the lazy renderer chunk (the
// avatars.ts precedent), so it must never reach for either side's dependencies.
// Every function is a pure transform; no function reads the clock or Math.random
// (callers pass epochs). Network lives exclusively in src/adsb-sources.ts.
//
// Parser discipline (the mqtt-decode / mvt-decode rule): normalizeAircraftList
// NEVER throws. Garbage in → [] or a skipped entry, never an exception into the
// poll/RAF path.
//
// ── The display shell is deliberately NOT TO SCALE ─────────────────────────
// An aircraft 20 nm out sits ≈37,040,000 mm from the house in real units, while
// the camera far plane is 150,000 mm and the sky dome radius is 30,000 mm. A
// literal geo projection would place it ~250× beyond the dome. Both the
// horizontal radius and the altitude are therefore compressed by INDEPENDENT
// non-linear curves into a bounded display shell inside the dome. Consequence,
// stated plainly (the neighborhood overlay's verticalScale honesty precedent):
// aircraft do NOT render at a consistent scale relative to each other or to the
// house — only in a rough, decorative, "that one is farther / higher" sense.
// TRUE BEARING is preserved exactly; only the radius is compressed.

// ── Normalized aircraft ────────────────────────────────────────────────────
// The field set local dump1090/readsb `aircraft.json` and the cloud
// `{ac:[...]}` responses (airplanes.live / adsb.lol / adsb.fi) genuinely share.
export interface FlightPoint {
  hex: string;                 // ICAO 24-bit address, lowercased
  callsign: string | null;     // `flight`, trimmed; null when absent/blank
  lat: number;
  lon: number;
  altFt: number;               // alt_baro preferred, alt_geom fallback (feet)
  gsKt: number | null;         // ground speed, knots
  trackDeg: number | null;     // true track over ground, 0–359
  vertRateFpm: number | null;  // baro_rate ?? geom_rate (feet/minute)
  category: string | null;     // ADS-B emitter category, 'A1'..'D7'
  seenPosS: number | null;     // seconds since the last position update
  military: boolean;           // dbFlags bit 1
  distNm?: number;             // filled by the planner's filter step (nm from home)
}

// Hard render cap — a 50 nm query near a busy hub returned 139 aircraft in the
// research pass. Nearest-first, mirroring the neighborhood overlay's
// capBuildings safety valve.
export const MAX_AIRCRAFT = 50;

// Finite-number coercion. Deliberately STRICT: a numeric-looking STRING is
// rejected, because the one documented string sentinel in this data
// (`alt_baro: "ground"`) must not silently parse as a number.
function num(v: unknown): number | null {
  return typeof v === 'number' && isFinite(v) ? v : null;
}

// Pull the aircraft array out of whichever envelope this payload uses:
//   • local readsb / dump1090-fa  → { aircraft: [...] }
//   • cloud (airplanes.live / adsb.lol / adsb.fi) → { ac: [...] }
//   • HA rest-sensor proxy attribute → a bare array (or { flights: [...] })
// Anything else → null (caller returns []).
function aircraftArray(json: unknown): unknown[] | null {
  if (Array.isArray(json)) return json;
  if (!json || typeof json !== 'object') return null;
  const o = json as Record<string, unknown>;
  for (const key of ['aircraft', 'ac', 'flights']) {
    if (Array.isArray(o[key])) return o[key] as unknown[];
  }
  return null;
}

// Normalize ANY supported ADS-B payload into FlightPoints. Airborne-only:
// entries whose `alt_baro` is the literal string "ground" are DROPPED (a
// taxiing/parked aircraft is not a flight overhead), as are entries with no
// usable numeric position or altitude. Never throws.
export function normalizeAircraftList(json: unknown): FlightPoint[] {
  const arr = aircraftArray(json);
  if (!arr) return [];
  const out: FlightPoint[] = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const a = raw as Record<string, unknown>;

    const hexRaw = a.hex ?? a.icao ?? a.icao24;
    if (typeof hexRaw !== 'string' || !hexRaw.trim()) continue;

    const lat = num(a.lat ?? a.latitude);
    const lon = num(a.lon ?? a.longitude);
    if (lat === null || lon === null) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;

    // alt_baro === 'ground' is the on-ground sentinel — filter, don't fall back.
    if (a.alt_baro === 'ground') continue;
    const altFt = num(a.alt_baro) ?? num(a.alt_geom) ?? num(a.altitude);
    if (altFt === null) continue;

    const flight = typeof a.flight === 'string' ? a.flight.trim()
      : typeof a.callsign === 'string' ? a.callsign.trim() : '';
    const dbFlags = num(a.dbFlags);

    out.push({
      hex: hexRaw.trim().toLowerCase(),
      callsign: flight ? flight : null,
      lat, lon, altFt,
      gsKt: num(a.gs),
      trackDeg: num(a.track) ?? num(a.true_heading),
      vertRateFpm: num(a.baro_rate) ?? num(a.geom_rate),
      category: typeof a.category === 'string' && a.category ? a.category : null,
      seenPosS: num(a.seen_pos),
      military: dbFlags !== null && (dbFlags & 1) === 1,
      ...(num(a.dst) !== null ? { distNm: num(a.dst) as number } : {}),
    });
  }
  return out;
}

// Which toy model the renderer builds. ADS-B emitter categories: A7 = rotorcraft,
// A1/A2 = light/small (prop). Everything else — including an absent category —
// falls back to a jet, the commonest thing overhead.
export function aircraftModelKind(fp: FlightPoint): 'prop' | 'jet' | 'heli' {
  const c = fp.category;
  if (c === 'A7') return 'heli';
  if (c === 'A1' || c === 'A2') return 'prop';
  return 'jet';
}

// ── Display shell geometry ─────────────────────────────────────────────────
// rMaxMm sits comfortably inside the 30,000 mm sky dome so aircraft never clip
// through it; the altitude band is a separate domain with its own curve.
export const FLIGHT_SHELL = {
  rMaxMm: 24000,     // horizontal display shell ceiling (asymptote — never reached)
  yMinMm: 2500,      // display altitude at 0 ft
  yMaxMm: 22000,     // display altitude at altMaxFt and above
  altRefFt: 3000,    // log knee — detail is spent on low, visually interesting traffic
  altMaxFt: 45000,   // above this the altitude curve saturates
} as const;

// Horizontal compression: asymptotic, so a nearer aircraft is always visibly
// nearer (monotonic) and NOTHING ever reaches rMaxMm. K sets the knee — a
// quarter of the configured search radius, floored at 4 nm so a tiny radius
// still spreads its traffic instead of pinning everything to the rim.
export function compressRadiusMm(distNm: number, radiusNm: number): number {
  const d = isFinite(distNm) && distNm > 0 ? distNm : 0;
  const r = isFinite(radiusNm) ? radiusNm : 0;
  const K = Math.max(4, r / 4);
  return FLIGHT_SHELL.rMaxMm * d / (d + K);
}

// Altitude compression: log curve over [0, altMaxFt] → [yMinMm, yMaxMm].
// Monotonic and bounded at both ends; altitudes above altMaxFt clamp to yMaxMm,
// below-sea-level readings clamp to yMinMm.
export function compressAltitudeMm(altFt: number): number {
  const { yMinMm, yMaxMm, altRefFt, altMaxFt } = FLIGHT_SHELL;
  const a = Math.max(0, Math.min(altMaxFt, isFinite(altFt) ? altFt : 0));
  const t = Math.log(1 + a / altRefFt) / Math.log(1 + altMaxFt / altRefFt);
  return yMinMm + (yMaxMm - yMinMm) * t;
}

const EARTH_R_M = 6371000;   // sphere radius (matches geo.ts)
const NM_M = 1852;           // 1 nautical mile in metres
const DEG = Math.PI / 180;
const TWO_PI = Math.PI * 2;

// True bearing + great-circle-ish distance from the home origin to an aircraft.
// Equirectangular tangent plane — the same math geo.ts's projectLatLon uses
// (cosine taken at the ORIGIN latitude), re-derived here rather than imported so
// this module stays zero-import. Bearing is TRUE compass, radians CW from north.
export function flightBearingDistance(
  originLat: number, originLon: number, lat: number, lon: number,
): { bearingRad: number; distNm: number } {
  const east = (lon - originLon) * DEG * Math.cos(originLat * DEG) * EARTH_R_M;
  const north = (lat - originLat) * DEG * EARTH_R_M;
  const bearing = Math.atan2(east, north);
  return {
    bearingRad: bearing - Math.floor(bearing / TWO_PI) * TWO_PI,   // → [0, 2π)
    distNm: Math.hypot(east, north) / NM_M,
  };
}

// Where to draw this aircraft. Returns plan-frame millimetres RELATIVE TO THE
// HOME ORIGIN (0,0 = the observer point) — NOT floor-rect coordinates; the
// renderer places the shell about the origin itself. The unit geo vector
// (east, north) derived from the TRUE bearing is rotated by thetaRad exactly as
// geo.ts's latLonToPlan rotates projected metres, so the shell shares the plan
// frame's north with landmarks, the compass and the neighborhood overlay. Only
// the RADIUS is compressed — the bearing survives untouched.
export function flightDisplayPos(
  fp: FlightPoint, originLat: number, originLon: number, thetaRad: number, radiusNm: number,
): { planX: number; planY: number; dispY: number; distNm: number; bearingRad: number } {
  const { bearingRad, distNm } = flightBearingDistance(originLat, originLon, fp.lat, fp.lon);
  const e = Math.sin(bearingRad), n = Math.cos(bearingRad);   // unit geo vector
  const c = Math.cos(thetaRad), s = Math.sin(thetaRad);
  const r = compressRadiusMm(distNm, radiusNm);
  return {
    planX: (c * e - s * n) * r,
    planY: (s * e + c * n) * r,
    dispY: compressAltitudeMm(fp.altFt),
    distNm, bearingRad,
  };
}

// ── ISS ────────────────────────────────────────────────────────────────────
// Live ISS position as reported by wheretheiss.at (a position feed, NOT a
// propagator — it can only answer "where is it right now"). Units normalized:
// altitude km, velocity km/s (the API reports km/h), timestamp epoch ms.
export interface IssNow {
  lat: number; lon: number; altKm: number; velKmS: number; tsMs: number;
}
