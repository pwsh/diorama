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
// horizontal radius and the altitude are therefore compressed by non-linear
// curves into a bounded display shell inside the dome. Consequence, stated
// plainly (the neighborhood overlay's verticalScale honesty precedent):
// aircraft do NOT render at a consistent scale relative to each other or to the
// house — only in a rough, decorative, "that one is farther / higher" sense.
// TRUE BEARING is preserved exactly; only the radius is compressed.
//
// The two curves are NOT independent: `flightDisplayPos` caps the compressed
// altitude at the TRUE elevation angle (`r · alt/dist`), so a distant aircraft
// hugs the horizon instead of hanging overhead. Before that cap, the altitude
// band (2,500–22,000 mm) was comparable to the radial shell (24,000 mm), which
// put a cruise-altitude jet 40–60° up whether it was 2 nm or 30 nm away — every
// aircraft read as "directly above the property". See `flightDisplayPos`.

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

  // ── Registry enrichment (research §1.5) ──────────────────────────────────
  // The aggregator's OWN database lookup layered on the raw Mode-S feed — an
  // aircraft never transmits its tail number or owner over the air. Present
  // whenever the source has a match; a bare local receiver with no --db-file
  // delivers none of them, so every one is nullable by design.
  reg: string | null;          // `r` — registration / tail number
  typeCode: string | null;     // `t` — ICAO type designator, uppercased
  typeDesc: string | null;     // `desc` — long type name ("BOEING 737 MAX 8")
  operator: string | null;     // `ownOp` — registered owner/operator

  // ── Status (research §1.4) ───────────────────────────────────────────────
  // `emergency` is a SUPERSET of the 7×00 squawks (it also carries lifeguard /
  // minfuel / downed, which have no squawk of their own) — normalized to null
  // for the overwhelmingly common `"none"`, so a non-null value always means
  // something is actually wrong. See `isEmergency`.
  emergency: string | null;    // `emergency`, minus the "none" no-op
  squawk: string | null;       // `squawk` — Mode A code, 4 octal digits

  // ── dbFlags bits (research §1.3): military=1, interesting=2, PIA=4, LADD=8 ─
  // `interesting` is the aggregator's own curated "noteworthy" tag (criteria
  // undocumented — §2). PIA/LADD are the two FAA privacy programs; the data
  // source deliberately does NOT enforce them (§0.2), so honoring them at all
  // is the CONSUMER's courtesy call.
  interesting: boolean;
  pia: boolean;
  ladd: boolean;

  distNm?: number;             // filled by the planner's filter step (nm from home)
}

// Hard render cap — a 50 nm query near a busy hub returned 139 aircraft in the
// research pass. Nearest-first, mirroring the neighborhood overlay's
// capBuildings safety valve.
export const MAX_AIRCRAFT = 50;

// Default search + display radius (nm) when `FlightsConfig.radiusNm` is absent.
// ONE number for the query radius, the display-shell knee K and the settings
// input's placeholder, so the compressed shell can never disagree with the set
// of aircraft that was actually fetched. Planner-side clamp stays 5..100; a
// stored radiusNm is untouched by a change here.
export const FLIGHTS_DEFAULT_RADIUS_NM = 15;

// Finite-number coercion. Deliberately STRICT: a numeric-looking STRING is
// rejected, because the one documented string sentinel in this data
// (`alt_baro: "ground"`) must not silently parse as a number.
function num(v: unknown): number | null {
  return typeof v === 'number' && isFinite(v) ? v : null;
}

// Trimmed non-empty string, or null. A NUMBER is accepted (some proxies emit a
// numeric `squawk`) and stringified; anything else is null.
function str(v: unknown): string | null {
  if (typeof v === 'string') { const t = v.trim(); return t ? t : null; }
  if (typeof v === 'number' && isFinite(v)) return String(v);
  return null;
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

    // NOT AN AIRCRAFT (research §0.8 / §3.6 step 2): the DO-260B emitter
    // category table reserves `C*` for surface vehicles + fixed obstacles and
    // `B3` for parachutists. The committed LAX fixture carries three real `C2`
    // airport service vehicles — without this they would be rendered as toy
    // jets. Drop them before anything else looks at the entry.
    const catRaw = typeof a.category === 'string' ? a.category.trim().toUpperCase() : '';
    if (catRaw.startsWith('C') || catRaw === 'B3') continue;

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
    const dbFlags = num(a.dbFlags) ?? 0;
    const emerg = str(a.emergency);

    out.push({
      hex: hexRaw.trim().toLowerCase(),
      callsign: flight ? flight : null,
      lat, lon, altFt,
      gsKt: num(a.gs),
      trackDeg: num(a.track) ?? num(a.true_heading),
      vertRateFpm: num(a.baro_rate) ?? num(a.geom_rate),
      category: typeof a.category === 'string' && a.category ? a.category : null,
      seenPosS: num(a.seen_pos),
      military: (dbFlags & 1) === 1,
      reg: str(a.r),
      typeCode: str(a.t)?.toUpperCase() ?? null,
      typeDesc: str(a.desc),
      operator: str(a.ownOp),
      // "none" is the overwhelmingly common value — collapse it to null so a
      // non-null `emergency` always means something is genuinely wrong.
      emergency: emerg && emerg.toLowerCase() !== 'none' ? emerg : null,
      squawk: str(a.squawk),
      interesting: (dbFlags & 2) === 2,
      pia: (dbFlags & 4) === 4,
      ladd: (dbFlags & 8) === 8,
      ...(num(a.dst) !== null ? { distNm: num(a.dst) as number } : {}),
    });
  }
  return out;
}

// ── Emergency status (research §1.4 / §2) ──────────────────────────────────
// The three universal Mode A codes. `emergency` supersedes them (it carries
// lifeguard/minfuel/downed too), but plenty of transponders only squawk.
export const EMERGENCY_SQUAWKS = ['7500', '7600', '7700'] as const;

// Is this aircraft declaring an emergency? Takes a partial so a caller can ask
// about a hand-built point. `emergency` is already "none"-collapsed by the
// normalizer; the explicit re-check keeps hand-built inputs honest.
export function isEmergency(
  fp: { emergency?: string | null; squawk?: string | null },
): boolean {
  const e = typeof fp.emergency === 'string' ? fp.emergency.trim().toLowerCase() : '';
  if (e !== '' && e !== 'none') return true;
  return emergencySquawk(fp) !== null;
}

// The squawk, but only when it is one of the three emergency codes — so a
// routine 1200/VFR code never gets announced as "squawking 1200".
export function emergencySquawk(fp: { squawk?: string | null }): string | null {
  const s = typeof fp.squawk === 'string' ? fp.squawk.trim()
    : typeof fp.squawk === 'number' ? String(fp.squawk) : '';
  return (EMERGENCY_SQUAWKS as readonly string[]).includes(s) ? s : null;
}

// ── Label plate field selection (research §4.1) ────────────────────────────
// Which lines a flight's label plate may carry. The default (an absent
// `FlightsConfig.labelFields`) is today's shipped two-line plate —
// callsign + real altitude — so the field is purely additive.
export const FLIGHT_LABEL_FIELDS = [
  'callsign', 'reg', 'type', 'operator', 'alt', 'speed', 'trend', 'squawk', 'dist',
] as const;
export type FlightLabelField = typeof FLIGHT_LABEL_FIELDS[number];
export const FLIGHT_LABEL_FIELDS_DEFAULT: FlightLabelField[] = ['callsign', 'alt'];

// Normalize a stored/imported label-field list: keep only known keys, in the
// user's order, de-duplicated. An empty or unusable result → undefined, i.e.
// "fall back to the default plate" — the same trim-and-drop-blanks discipline
// `setFlights` already applies to the watch list.
export function sanitizeLabelFields(v: unknown): FlightLabelField[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const allowed = FLIGHT_LABEL_FIELDS as readonly string[];
  const out: FlightLabelField[] = [];
  for (const raw of v) {
    if (typeof raw !== 'string') continue;
    const k = raw.trim().toLowerCase();
    if (!allowed.includes(k) || out.includes(k as FlightLabelField)) continue;
    out.push(k as FlightLabelField);
  }
  return out.length ? out : undefined;
}

// LEGACY 3-way model pick — the three toy bodies the shipped renderer chunk
// builds. Kept EXACTLY as-is (category-only) for stale-chunk safety: a fresh
// app paired with a cached renderer must keep resolving a model.
//
// The richer 8-archetype resolution lives in `src/aircraft-types.ts`
// (`aircraftArchetype(typeCode, category)` + `legacyModelKind()` for the
// mapping back onto these three) — deliberately a SEPARATE module so this one
// stays genuinely zero-import.
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
//
// This is the OVERHEAD/near-traffic branch only — it knows nothing about
// distance, so `flightDisplayPos` caps its output at the true elevation angle
// before using it. Do not read it as "the display altitude".
export function compressAltitudeMm(altFt: number): number {
  const { yMinMm, yMaxMm, altRefFt, altMaxFt } = FLIGHT_SHELL;
  const a = Math.max(0, Math.min(altMaxFt, isFinite(altFt) ? altFt : 0));
  const t = Math.log(1 + a / altRefFt) / Math.log(1 + altMaxFt / altRefFt);
  return yMinMm + (yMaxMm - yMinMm) * t;
}

const EARTH_R_M = 6371000;   // sphere radius (matches geo.ts)
const NM_M = 1852;           // 1 nautical mile in metres
const FT_M = 0.3048;         // 1 foot in metres
const DEG = Math.PI / 180;
const TWO_PI = Math.PI * 2;

// ── Display altitude: the elevation-true cap ───────────────────────────────
// THE one place the display height is composed, from an aircraft's real
// altitude + real distance and the ALREADY-COMPRESSED radius it will be drawn
// at. Both `flightDisplayPos` (2D + the planner) and the renderer's zero-alloc
// scene-space projection call it, so the two views can never disagree about how
// high a plane hangs.
//
//   dispY = max(yMinMm, min(compressAltitudeMm(altFt), rMm · altM / distM))
//
// The second term is the height that reproduces the aircraft's TRUE elevation
// angle on the compressed radius: `atan2(dispY, rMm)` then equals
// `atan2(altM, distM)` exactly. Since rMm = rMax·d/(d+K), it simplifies to
// `rMax · altM / (NM_M · (d + K))` — for a fixed altitude, strictly DECREASING
// in distance, so a farther aircraft always sits lower in the sky. The min()
// leaves the log curve in charge of near/overhead traffic (where the elevation
// term is the larger of the two), so a plane genuinely overhead still reads
// overhead, and everywhere else the display angle can only be ≤ the true one.
// The yMinMm floor is the single exception: it lifts a very distant, very low
// aircraft clear of rooftops / neighborhood buildings instead of burying it.
export function flightDisplayAltitudeMm(altFt: number, distNm: number, rMm: number): number {
  const altM = (isFinite(altFt) ? altFt : 0) * FT_M;
  // distM floored at 1 m so an aircraft sitting exactly on the origin (r = 0
  // anyway) can never divide by zero.
  const distM = Math.max((isFinite(distNm) && distNm > 0 ? distNm : 0) * NM_M, 1);
  const r = isFinite(rMm) && rMm > 0 ? rMm : 0;
  return Math.max(FLIGHT_SHELL.yMinMm,
                  Math.min(compressAltitudeMm(altFt), r * (altM / distM)));
}

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
//
// The display ALTITUDE is capped at the true elevation angle — see
// `flightDisplayAltitudeMm`, which owns that composition for both views.
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
    dispY: flightDisplayAltitudeMm(fp.altFt, distNm, r),
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
