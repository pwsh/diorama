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
// band was comparable to the radial shell, which put a cruise-altitude jet
// 40–60° up whether it was 2 nm or 30 nm away — every aircraft read as
// "directly above the property". See `flightDisplayPos`.
//
// ── Shell SIZE: why 120 m and not 24 m (user-reported, 2026-07) ────────────
// The shell was originally sized to sit inside the 30,000 mm sky dome, back
// when nothing in the scene rendered beyond the yard. Two later changes made
// that cramped: (a) the neighborhood overlay draws REAL-scale streets out to
// kilometres, so a 7 nm airliner parked 15 m from the house read as absurd;
// (b) the elevation-true altitude cap above correctly flattened distant
// traffic into a narrow vertical band, removing the vertical spread that had
// been disguising the horizontal cramming. Everything then read as a crowded
// shelf hovering over the property. `rMaxMm` is therefore 120,000 — at the
// default 15 nm search radius a 7 nm aircraft lands 35 % of the way out
// (42 m on the base shell, 105 m on the shipped 300 m one), clearly beyond the
// property, and `yMaxMm` scales with it so the ELEVATION branch (not the log
// curve) governs cruise traffic well inside the configured radius.
//
// The shell is now LARGER than the 30,000 mm sky dome, and that is fine: the
// dome is camera-centered, `depthWrite:false`, `renderOrder −10`, so it writes
// no depth and paints first — an aircraft outside it simply draws over it and
// can never be occluded by it. The camera frustum is the real constraint, and
// aircraft join the neighborhood overlay's dynamic-frustum requirement (see
// `FLIGHT_SHELL_REACH_MM` + the renderer's `_recordFrustumReq`).
//
// ── Shell RADIUS is now user-definable (FlightsConfig.shellRadiusM) ────────
// 120 m is the AUTHORED reference scale (`FLIGHT_SHELL_BASE_MM`), not a fixed
// ceiling. Every shell-geometry function takes a trailing `shellMm`, and the
// POSITION geometry is a similarity transform of that reference by
//
//   s = shellMm / FLIGHT_SHELL_BASE_MM
//
// i.e. planX / planY / dispY all multiply by s. The default is 300 m, 2.5× the
// reference. Three things deliberately do NOT scale:
//   • the MODEL SCALE (`flightDisplayScale`) — scaling size along with position
//     would preserve every apparent angle and size, making the user's draw-
//     radius knob a perceptual no-op (user-reported; see that function).
//   • `clearMm` — an absolute physical property-clearance floor (see below).
//   • `altRefFt` / `altMaxFt` — real-world altitude anchors, not geometry.
// See `flightShellMm`, `flightShellReachMm` and each function's `shellMm` note.

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
// `airline` is the OPERATING CARRIER resolved from the callsign prefix
// (src/airlines.ts) rather than a field the feed carries — which is exactly why
// its text is INJECTED (see flightFieldText's trailing `airline` parameter):
// this module stays zero-import, so it never performs the lookup itself.
export const FLIGHT_LABEL_FIELDS = [
  'callsign', 'reg', 'type', 'operator', 'airline',
  'alt', 'speed', 'trend', 'squawk', 'dist',
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

// ── Label text resolution — ONE home for 2D + 3D ───────────────────────────
// three-renderer paints these onto the camera-facing plate; canvas-render draws
// them under the 2D dart. They were mirrored ~20-line copies (the last such
// pair after the glow ladder moved here); both now delegate, so the 2D label
// and the 3D plate cannot drift. Pure + zero-import, like the rest of this file.

// Privacy gates (research §4.2). LADD keeps its identity and only gets the
// 🔒 badge; PIA is a Privacy ICAO Address, so its identity is WITHHELD
// everywhere — the hex is all it legitimately has.
export function flightPrivacyDimmed(fp: FlightPoint, privacyDim: boolean): boolean {
  return privacyDim && (fp.pia === true || fp.ladd === true);
}
export function flightIdentitySuppressed(fp: FlightPoint, privacyDim: boolean): boolean {
  return privacyDim && fp.pia === true;
}

// What identifies an aircraft: callsign → registration → hex.
export function flightIdentifier(fp: FlightPoint, suppress: boolean): string {
  if (suppress) return fp.hex.toUpperCase();
  const cs = (fp.callsign ?? '').trim();
  if (cs) return cs;
  const reg = (fp.reg ?? '').trim();
  return reg || fp.hex.toUpperCase();
}

// One label FIELD's text. Numeric fields are BUCKETED (alt 100 ft, speed 10 kt,
// distance 0.5 nm) so a live aircraft doesn't repaint its plate every poll.
// `suppress` is the PIA identity gate; a field it withholds returns '' and
// simply drops out of the line.
//
// `airline` is INJECTED (trailing, optional, default ''): the operating carrier
// is resolved from the callsign prefix by src/airlines.ts, and this module is
// zero-import by contract — so the CALLER (three-renderer / canvas-render) does
// the lookup and hands the resolved short name over. A stale caller omitting it
// simply renders the `airline` field empty, which drops out of the line exactly
// like a missing registration does.
export function flightFieldText(field: string, fp: FlightPoint,
                                ident: string, suppress: boolean,
                                airline = ''): string {
  switch (field) {
    case 'callsign': return ident;
    case 'reg':      return suppress ? '' : (fp.reg ?? '');
    case 'type':     return suppress ? '' : (fp.typeCode ?? '');
    case 'operator': return suppress || !fp.operator ? '' : fp.operator.slice(0, 22);
    case 'airline':  return suppress ? '' : (airline || '').slice(0, 22);
    case 'alt':      return `${(Math.round(fp.altFt / 100) * 100).toLocaleString('en-US')} ft`;
    case 'speed':    return fp.gsKt == null ? '' : `${Math.round(fp.gsKt / 10) * 10} kt`;
    case 'trend': {
      const v = fp.vertRateFpm ?? 0;
      return v >= 300 ? '↑ climb' : v <= -300 ? '↓ descend' : '';
    }
    case 'squawk':   return fp.squawk ? `sq ${fp.squawk}` : '';
    case 'dist':     return fp.distNm == null ? ''
      : `${(Math.round(fp.distNm * 2) / 2).toFixed(1)} nm`;
    default:         return '';
  }
}

// The label's two lines: the FIRST resolved field is the headline, the rest
// join into a detail line. Empty fields (no registration, level flight, …)
// drop out; if EVERY field resolves empty the identifier stands alone.
export function flightLabelLines(
  fp: FlightPoint, fields: string[], privacyDim: boolean, airline = '',
): { top: string; sub: string } {
  const suppress = flightIdentitySuppressed(fp, privacyDim);
  const badge = flightPrivacyDimmed(fp, privacyDim) ? '🔒 ' : '';
  const ident = badge + flightIdentifier(fp, suppress);
  const parts: string[] = [];
  for (const f of fields) {
    const t = flightFieldText(f, fp, ident, suppress, airline);
    if (t) parts.push(t);
  }
  if (!parts.length) parts.push(ident);
  return { top: parts[0], sub: parts.slice(1).join(' · ') };
}

// ── Fuselage & banner text customization ───────────────────────────────────
// What the aircraft carries down its own flanks, and what a piston single's
// towed banner says. Both are pure resolvers over an INJECTED airline lookup
// (the `airline` parameter above, same reason) plus the layout the shipped
// `auto` behavior already produced, so 'auto' is byte-identical by construction
// rather than by re-derivation.
export const FLIGHT_SIDE_TEXT_MODES = [
  'auto', 'operator', 'airline', 'slogan', 'callsign', 'none',
] as const;
export type FlightSideTextMode = typeof FLIGHT_SIDE_TEXT_MODES[number];

export const FLIGHT_BANNER_TEXT_MODES = [
  'auto', 'airline', 'slogan', 'callsign',
] as const;
export type FlightBannerTextMode = typeof FLIGHT_BANNER_TEXT_MODES[number];

// The airline strings a caller injects. Deliberately a plain shape rather than
// airlines.ts's AirlineInfo — importing that type would break the zero-import
// contract, and these two strings are all the resolvers need.
export interface FlightAirlineText { shortName?: string; slogan?: string }

// Normalize a stored/imported mode. Unknown values AND the default itself
// collapse to `undefined` — "use the shipped behavior" — the labelFields /
// modelScale "exactly the default clears" idiom applied to an enum.
export function sanitizeSideText(v: unknown): FlightSideTextMode | undefined {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
  return s && s !== 'auto' && (FLIGHT_SIDE_TEXT_MODES as readonly string[]).includes(s)
    ? (s as FlightSideTextMode) : undefined;
}

export function sanitizeBannerText(v: unknown): FlightBannerTextMode | undefined {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
  return s && s !== 'auto' && (FLIGHT_BANNER_TEXT_MODES as readonly string[]).includes(s)
    ? (s as FlightBannerTextMode) : undefined;
}

// Resolve the fuselage marking pair.
//
// `base` is the AUTO layout the renderer already computed (operator broadside +
// identity along the spine on a big fuselage, identity on the flanks otherwise)
// — passing it in rather than re-deriving it is what makes `'auto'` provably
// byte-identical to the shipped path.
//
// PIA gate: a suppressed aircraft's identity is withheld on every surface, so
// only `'none'` (strictly less information) is honored; every other mode falls
// back to `base`, which under suppression is already the bare hex.
//
// Each non-auto mode replaces the FLANK text and keeps `base.top` — so a big
// airliner showing its slogan broadside still reads its identity from above,
// and a small airframe (whose base.top is empty) simply carries the one
// marking it has room for. An unresolvable choice (no airline, no slogan, no
// operator) falls back to `base` rather than blanking the airframe.
export function resolveFlightSideText(
  mode: FlightSideTextMode | undefined,
  base: { flank: string; top: string },
  fp: { operator?: string | null },
  ident: string, suppress: boolean,
  airline?: FlightAirlineText | null,
): { flank: string; top: string } {
  const m = sanitizeSideText(mode);
  if (!m) return base;
  if (m === 'none') return { flank: '', top: '' };
  if (suppress) return base;
  switch (m) {
    case 'callsign':
      return { flank: ident, top: '' };
    case 'operator': {
      const op = (fp?.operator ?? '').trim();
      return op ? { flank: op, top: base.top } : base;
    }
    case 'airline': {
      const s = (airline?.shortName ?? '').trim();
      return s ? { flank: s, top: base.top } : base;
    }
    case 'slogan': {
      const sl = (airline?.slogan ?? '').trim();
      if (sl) return { flank: sl, top: base.top };
      const s = (airline?.shortName ?? '').trim();
      return s ? { flank: s, top: base.top } : base;
    }
    default:
      return base;
  }
}

// What the towed banner says. `'auto'`/`'callsign'` are the shipped identity;
// the other two fall back through shortName to the identity, so a banner is
// never blank. (A PIA aircraft never tows a banner in the first place — the
// renderer's `wantBanner` requires `!suppress` — but the gate is repeated here
// so the pure resolver is safe on its own.)
export function resolveFlightBannerText(
  mode: FlightBannerTextMode | undefined,
  ident: string, suppress: boolean,
  airline?: FlightAirlineText | null,
): string {
  const m = sanitizeBannerText(mode);
  if (!m || suppress) return ident;
  if (m === 'callsign') return ident;
  if (m === 'airline') return (airline?.shortName ?? '').trim() || ident;
  // 'slogan'
  return (airline?.slogan ?? '').trim()
    || (airline?.shortName ?? '').trim()
    || ident;
}

// ── User-configurable glow rules (research docs/research/flight-glow-rules.md) ─
// An ordered, FIRST-MATCH-WINS rule list (the value-rules.ts `evalRules` idiom)
// assigning a glow colour + animation pattern to matching aircraft, layered on
// top of the shipped status-beacon ladder. Everything here is pure and lives in
// this module so the 3D renderer, the 2D canvas and the settings UI all read one
// implementation — the "keep the two beacon ladders in step" comment pair that
// used to be duplicated across three-renderer.ts and canvas-render.ts is now
// this single home (§8).
//
// Seven patterns (§1): five have real aviation-lighting analogs, two (`fade`,
// `alternate`) are deliberately DECORATIVE additions with no aviation source —
// the same honesty the neighborhood overlay's verticalScale hint sets.
export type FlightGlowPattern =
  'none' | 'solid' | 'flash' | 'strobe' | 'rotate' | 'fade' | 'alternate';

export const FLIGHT_GLOW_PATTERNS: readonly FlightGlowPattern[] =
  ['none', 'solid', 'flash', 'strobe', 'rotate', 'fade', 'alternate'] as const;

// AND across every PRESENT criterion; an absent field is a wildcard "any", and
// an entirely empty object matches every aircraft (a legitimate catch-all rule
// at the end of the list).
export interface FlightGlowCriteria {
  operator?: string; typeCode?: string; typeDesc?: string;
  reg?: string; callsign?: string; category?: string;   // wildcard strings, §3.1
  minSpeedKt?: number; maxSpeedKt?: number;
  minAltFt?: number; maxAltFt?: number;
  minDistNm?: number; maxDistNm?: number;               // distNm is planner-filled
  military?: boolean; interesting?: boolean; ladd?: boolean; pia?: boolean;
  // UNREACHABLE in v1 by design (§4): an emergency aircraft is intercepted by
  // tier 1 before the rule list is consulted, so a rule keyed on it can never
  // fire. Kept in the schema for forward compatibility and so the flag set does
  // not look like it has an accidental gap.
  emergency?: boolean;
}

export interface FlightGlowRule {
  id: string;                 // 'fgr_…', stable across edits
  label?: string;             // optional user-facing name for the summary row
  enabled?: boolean;          // absent = true
  criteria: FlightGlowCriteria;
  pattern: FlightGlowPattern;
  colorA?: string;            // '#rrggbb'; required whenever pattern !== 'none'
  colorB?: string;            // '#rrggbb'; optional second colour
}

export const MAX_FLIGHT_GLOW_RULES = 30;

// The shipped default ladder, as hex strings — the ONE home for the four
// constants three-renderer's FLIGHT_BEACON_* numbers and canvas-render's
// FLIGHT_BEACON_COLORS strings both encode.
export const FLIGHT_DEFAULT_BEACON = {
  emergency: '#ff2a1a',
  interesting: '#ffd400',
  military: '#2ee56a',
  ladd: '#f2f6fb',
} as const;

// ── Wildcard matching (§3.1 / §3.2) ────────────────────────────────────────
// `*` = any run, `?` = exactly one character, case-insensitive. A pattern with
// NEITHER wildcard is a friendly SUBSTRING match; a pattern with either is
// matched ANCHORED start-to-end. The pattern is hand-walked and every other
// character escaped — the user's raw string is NEVER handed to `new RegExp`, so
// this can never become a second real-regex surface (a user typing `AAL.*`
// means a literal dot) and a pathological input cannot backtrack.
const _wcCache = new Map<string, RegExp | null>();

function compileWildcard(pattern: string): RegExp | null {
  const key = pattern.toLowerCase();
  const hit = _wcCache.get(key);
  if (hit !== undefined) return hit;
  let out = '', hasWildcard = false;
  for (const ch of key) {
    if (ch === '*') { out += '.*'; hasWildcard = true; }
    else if (ch === '?') { out += '.'; hasWildcard = true; }
    else out += ch.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&');
  }
  const body = hasWildcard ? out : `.*${out}.*`;
  let re: RegExp | null;
  try { re = new RegExp(`^${body}$`, 'is'); } catch { re = null; }
  // Bounded implicitly by the rule cap; cheap insurance, not load-bearing (§7).
  if (_wcCache.size > 512) _wcCache.clear();
  _wcCache.set(key, re);
  return re;
}

// Does `text` satisfy the user's glob? A blank/absent PATTERN is "any" (true —
// the unset-criterion semantics); a null TEXT can only satisfy a blank pattern
// (an aircraft with no registration must not match `N*`). Never throws.
export function globMatch(pattern: string | null | undefined, text: string | null | undefined): boolean {
  const pat = typeof pattern === 'string' ? pattern.trim() : '';
  if (!pat) return true;
  if (typeof text !== 'string' || text === '') return false;
  const re = compileWildcard(pat);
  return re ? re.test(text) : false;
}

// AND across every present criterion (§3.3). A null LIVE field fails a numeric
// criterion rather than silently passing — ValueRule's NaN-never-matches rule.
export function matchesGlowCriteria(fp: FlightPoint, c: FlightGlowCriteria | undefined): boolean {
  if (!c) return true;
  if (!globMatch(c.operator, fp.operator)) return false;
  if (!globMatch(c.typeCode, fp.typeCode)) return false;
  if (!globMatch(c.typeDesc, fp.typeDesc)) return false;
  if (!globMatch(c.reg, fp.reg)) return false;
  if (!globMatch(c.callsign, fp.callsign)) return false;
  if (!globMatch(c.category, fp.category)) return false;
  if (c.minSpeedKt != null && (fp.gsKt == null || fp.gsKt < c.minSpeedKt)) return false;
  if (c.maxSpeedKt != null && (fp.gsKt == null || fp.gsKt > c.maxSpeedKt)) return false;
  if (c.minAltFt != null && !(fp.altFt >= c.minAltFt)) return false;
  if (c.maxAltFt != null && !(fp.altFt <= c.maxAltFt)) return false;
  if (c.minDistNm != null && (fp.distNm == null || fp.distNm < c.minDistNm)) return false;
  if (c.maxDistNm != null && (fp.distNm == null || fp.distNm > c.maxDistNm)) return false;
  if (c.military != null && fp.military !== c.military) return false;
  if (c.interesting != null && fp.interesting !== c.interesting) return false;
  if (c.ladd != null && fp.ladd !== c.ladd) return false;
  if (c.pia != null && fp.pia !== c.pia) return false;
  if (c.emergency != null && isEmergency(fp) !== c.emergency) return false;
  return true;
}

// One rule against one aircraft, INCLUDING the enable flag — the predicate the
// resolver walks the list with (and the one a UI preview should call).
export function flightGlowRuleMatch(rule: FlightGlowRule | null | undefined, fp: FlightPoint): boolean {
  if (!rule || rule.enabled === false) return false;
  return matchesGlowCriteria(fp, rule.criteria);
}

export interface ResolvedGlow { pattern: FlightGlowPattern; colorA: string; colorB?: string; }

// §4's three tiers, folded into ONE call site so 2D and 3D can never disagree:
//   1. `beacons` off  → no glow at all (the single master gate, user rules included).
//   2. EMERGENCY      → the red flash, unconditionally, before any rule is read.
//                       A decorative preference must never be able to recolour or
//                       silence safety-relevant information, even by accident.
//   3. first matching ENABLED rule → REPLACES the whole default resolution
//                       (pattern AND colours; never blended, the evalRules
//                       semantics). `pattern: 'none'` resolves to null — a
//                       supported way to mute a class of aircraft.
//   4. otherwise      → today's UNCHANGED ladder. Zero rules configured is
//                       byte-for-byte identical to the shipped behavior.
export function resolveFlightGlow(
  fp: FlightPoint, rules: FlightGlowRule[] | undefined, beaconsOn: boolean,
): ResolvedGlow | null {
  if (!beaconsOn) return null;
  if (isEmergency(fp)) return { pattern: 'flash', colorA: FLIGHT_DEFAULT_BEACON.emergency };
  if (rules) {
    for (const r of rules) {
      if (!flightGlowRuleMatch(r, fp)) continue;
      if (r.pattern === 'none') return null;
      return { pattern: r.pattern, colorA: r.colorA ?? '#ffffff', colorB: r.colorB };
    }
  }
  if (fp.interesting) return { pattern: 'flash', colorA: FLIGHT_DEFAULT_BEACON.interesting };
  if (fp.military) return { pattern: 'flash', colorA: FLIGHT_DEFAULT_BEACON.military };
  if (fp.ladd) return { pattern: 'flash', colorA: FLIGHT_DEFAULT_BEACON.ladd };
  return null;
}

// ── Pattern math (§2) ──────────────────────────────────────────────────────
// `tSec` is a PER-RIG ACCUMULATED phase (never an absolute clock), so a rebuild
// triggered by a rule/colour change cannot pop the animation; only a genuinely
// new rig starts at 0. Pure, zero-alloc apart from the returned literal, and
// deterministic.
//
//   alpha — the BEAD (core) opacity 0..1
//   glow  — the additive HALO sprite's opacity 0..1
//   mix   — crossfade weight toward colorB (0 = pure colorA)
//
// DELIVERING BOTH `alpha` AND `glow` is a deliberate extension of §2's
// `{alpha, mix}`: the shipped beacon drives the bead and the halo from two
// DIFFERENT envelopes (0.28 + 0.72·f vs 0.10 + 0.85·f), and `flash` must stay
// byte-identical to it. §2's alpha formulas are reproduced verbatim.
export interface FlightGlowFrame { alpha: number; glow: number; mix: number; }

const GLOW_TWO_PI = Math.PI * 2;

export function flightGlowFrame(pattern: FlightGlowPattern, tSec: number): FlightGlowFrame {
  const t = isFinite(tSec) ? tSec : 0;
  switch (pattern) {
    case 'solid':
      // No time axis to crossfade over — `solid`'s second colour tints the HALO
      // instead (assigned once at build, §2's documented exception), so mix is
      // meaningless here and the caller must not lerp.
      return { alpha: 1, glow: 0.6, mix: 0 };

    case 'flash': {                    // the EXISTING shipped envelope, verbatim
      const F = 1.2;                   // FLIGHT_BEACON_HZ, unchanged
      const s = Math.max(0, Math.sin(GLOW_TWO_PI * F * t));
      const f = s * s * s;             // sharp on, long off
      return {
        alpha: 0.28 + 0.72 * f,
        glow: 0.10 + 0.85 * f,
        mix: Math.floor(F * t) % 2,    // whole cycles alternate colour
      };
    }

    case 'strobe': {                   // aviation double-flash: two narrow pops
      const F = 1.0, GAP = 0.12, WIDTH = 0.05;      // cycle FRACTIONS
      const phase = ((F * t) % 1 + 1) % 1;
      const pop = (center: number) => {
        let d = Math.abs(phase - center);
        d = Math.min(d, 1 - d);                     // wrap around the cycle
        return d >= WIDTH ? 0 : Math.cos((d / WIDTH) * (Math.PI / 2)) ** 2;
      };
      const a = pop(0), b = pop(GAP);
      const peak = Math.max(a, b);
      return { alpha: 0.15 + 0.85 * peak, glow: 0.06 + 0.90 * peak, mix: b > a ? 1 : 0 };
    }

    case 'rotate': {                   // rotating beacon sweep — NEVER fully dark
      const F = 0.9;
      const w = 0.5 + 0.5 * Math.cos(GLOW_TWO_PI * F * t);       // 0..1
      return { alpha: 0.35 + 0.65 * w, glow: 0.20 + 0.70 * w, mix: 1 - w };
    }

    case 'fade': {                     // slow breathe, 5 s period
      const F = 0.2;
      const w = 0.5 + 0.5 * Math.sin(GLOW_TWO_PI * F * t);
      return { alpha: 0.15 + 0.85 * w, glow: 0.08 + 0.75 * w, mix: w };
    }

    case 'alternate': {                // hard colour swap, constant brightness
      const T = 0.8;                   // seconds held per colour
      return { alpha: 1, glow: 0.6, mix: Math.floor(t / T) % 2 };
    }

    case 'none':
    default:
      return { alpha: 0, glow: 0, mix: 0 };
  }
}

// Linear RGB lerp between two '#rrggbb' strings, returning '#rrggbb'. Lives
// here rather than reaching for geometry.ts's lighten/hexToRgba because this
// module is zero-import by design; ~10 lines is cheaper than breaking that.
// Garbage in → `a` (never throws, never emits a malformed colour).
export function lerpHexColor(a: string, b: string | undefined, mix: number): string {
  const pa = parseHex6(a);
  if (!pa) return typeof a === 'string' ? a : '#ffffff';
  const pb = b ? parseHex6(b) : null;
  if (!pb) return a;
  const t = Math.max(0, Math.min(1, isFinite(mix) ? mix : 0));
  const ch = (x: number, y: number) => Math.round(x + (y - x) * t);
  const hx = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hx(ch(pa[0], pb[0]))}${hx(ch(pa[1], pb[1]))}${hx(ch(pa[2], pb[2]))}`;
}

function parseHex6(v: unknown): [number, number, number] | null {
  if (typeof v !== 'string') return null;
  const m = /^#?([0-9a-f]{6})$/i.exec(v.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ── Sanitizer (§6.3) ───────────────────────────────────────────────────────
// Run from `Planner.setFlights` (the labelFields / watch-list precedent) so a
// settings edit, an import and a hand-edited config all land in the same shape.
//
// PITFALL this guards: an emptied text input naively kept as `''` would, under
// §3.1's hybrid rule, compile to `**` and match EVERY aircraft on that field.
// `str()` collapses blank/whitespace to `undefined` — an unset criterion, which
// is the intended no-op.
export function sanitizeFlightGlowRules(v: unknown): FlightGlowRule[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const patterns = new Set<string>(FLIGHT_GLOW_PATTERNS as readonly string[]);
  const str = (x: unknown) => {
    const s = typeof x === 'string' ? x.trim() : '';
    return s ? s : undefined;
  };
  const hex = (x: unknown) => {
    const p = parseHex6(x);
    if (!p) return undefined;
    const hx = (n: number) => n.toString(16).padStart(2, '0');
    return `#${hx(p[0])}${hx(p[1])}${hx(p[2])}`.toLowerCase();
  };
  const num = (x: unknown) => (typeof x === 'number' && isFinite(x) ? x : undefined);
  const clamp = (n: number | undefined, lo: number, hi: number) =>
    n === undefined ? undefined : Math.max(lo, Math.min(hi, n));
  const swap = (a?: number, b?: number): [number | undefined, number | undefined] =>
    a != null && b != null && a > b ? [b, a] : [a, b];
  const bool = (x: unknown) => (typeof x === 'boolean' ? x : undefined);

  const seen = new Set<string>();
  const out: FlightGlowRule[] = [];
  let auto = 0;
  for (const raw of v) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const r = raw as Record<string, unknown>;
    const pattern = typeof r.pattern === 'string' && patterns.has(r.pattern)
      ? (r.pattern as FlightGlowPattern) : null;
    if (!pattern) continue;                 // unknown pattern → drop the rule
    const colorA = hex(r.colorA);
    const colorB = hex(r.colorB);
    // A VISIBLE pattern needs at least one usable colour; 'none' needs none.
    if (pattern !== 'none' && !colorA) continue;

    // Ids stay stable across edits, but a missing/duplicate one is repaired
    // DETERMINISTICALLY (no Math.random — this module never rolls dice, and a
    // stable id keeps an import byte-reproducible).
    let id = typeof r.id === 'string' && r.id.trim() ? r.id.trim() : '';
    while (!id || seen.has(id)) id = `fgr_${++auto}_${out.length}`;
    seen.add(id);

    const c = (r.criteria && typeof r.criteria === 'object'
      ? r.criteria : {}) as Record<string, unknown>;
    const [minAlt, maxAlt] = swap(clamp(num(c.minAltFt), 0, 60000), clamp(num(c.maxAltFt), 0, 60000));
    const [minSp, maxSp] = swap(clamp(num(c.minSpeedKt), 0, 800), clamp(num(c.maxSpeedKt), 0, 800));
    const [minDs, maxDs] = swap(clamp(num(c.minDistNm), 0, 500), clamp(num(c.maxDistNm), 0, 500));

    out.push({
      id,
      label: str(r.label),
      enabled: r.enabled !== false,
      pattern,
      colorA, colorB,
      criteria: {
        // Uppercased ONLY where the live data is uppercase (typeCode/reg/
        // callsign/category are uppercase by construction in the normalizer);
        // operator and typeDesc are free text and matched case-insensitively.
        operator: str(c.operator),
        typeCode: str(c.typeCode)?.toUpperCase(),
        typeDesc: str(c.typeDesc),
        reg: str(c.reg)?.toUpperCase(),
        callsign: str(c.callsign)?.toUpperCase(),
        category: str(c.category)?.toUpperCase(),
        minSpeedKt: minSp, maxSpeedKt: maxSp,
        minAltFt: minAlt, maxAltFt: maxAlt,
        minDistNm: minDs, maxDistNm: maxDs,
        military: bool(c.military), interesting: bool(c.interesting),
        ladd: bool(c.ladd), pia: bool(c.pia), emergency: bool(c.emergency),
      },
    });
    if (out.length >= MAX_FLIGHT_GLOW_RULES) break;
  }
  return out.length ? out : undefined;
}

// Task-facing alias — the sanitizer is referred to by both names in the design
// notes; ONE implementation, two exports.
export const sanitizeGlowRules = sanitizeFlightGlowRules;

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

// ── Military SKINS for the live display (vehicle library, batch V3) ─────────
// docs/research/vehicle-model-library.md §4.4–4.5's "cheapest win in this whole
// doc": six military silhouettes ALREADY EXIST in the renderer's banner tow-craft
// roster (BG_CRAFTS), so a live ADS-B aircraft that really is one of them can be
// drawn with that shape instead of the generic archetype body — no new geometry,
// just a new consumption path.
//
// What this DOES NOT change (the §4.1 envelope contract): the aircraft's
// ARCHETYPE. TYPE_ARCHETYPE (aircraft-types.ts) is untouched — an `F16` still
// resolves to the `bizjet` bucket, and every attachment point the bucket owns
// (label height, beacon position, fuselage-marking layout, wing/fuselage envelope)
// still comes from `_flightArchetypeMetrics`. A skin changes the SHAPE DRAWN
// INSIDE that envelope, never the envelope itself.
export type BgCraftMilitarySkin = 'f16' | 'f22' | 'a10' | 'b2' | 'b52' | 'apache';

export const FLIGHT_MILITARY_SKINS: readonly BgCraftMilitarySkin[] =
  ['f16', 'f22', 'a10', 'b2', 'b52', 'apache'] as const;

// ICAO TYPE DESIGNATOR → skin. Keys are uppercase `t` values (FlightPoint.typeCode
// is already uppercased by the normalizer; the resolver re-normalizes anyway so a
// hand-fed fixture cannot slip through).
//
// The `B2` trap, named because it looks like a bug: ADS-B also has an emitter
// CATEGORY `B2` (lighter-than-air — a balloon). These are DIFFERENT AXES and this
// table is only ever consulted with `typeCode`, never `category`, so a balloon can
// never be painted as a Northrop B-2. Only `A6` / `A7` are read off `category`.
export const MILITARY_SKIN_TYPE_CODES: Readonly<Record<string, BgCraftMilitarySkin>> = {
  F16: 'f16', F22: 'f22', A10: 'a10', B2: 'b2', B52: 'b52', AH64: 'apache',
};

// `FlightsConfig.militarySkins` resolution — ABSENT = ON (the beacons/privacyDim
// idiom). One home so the renderer, the settings drawer and the tests agree.
export function militarySkinsEnabled(v: boolean | null | undefined): boolean {
  return v !== false;
}

// Which named military silhouette (if any) an aircraft should be drawn with.
// PURE, never throws, null = "use the generic archetype body" (today's shipped
// behavior for everything).
//
// Priority — first match wins:
//   1. EXACT type-designator match (the six BG_CRAFTS military builds). No
//      military-dbFlag gate: an `F16` designator IS an F-16 whatever the feed's
//      flags say, and a hobbyist source that labels the type but not the flag
//      should still get the fighter.
//   2. `category === 'A6'` (high-performance / fighter, §3.6's ladder) → f16.
//      That bucket renders as a generic BIZJET today, which is the shape this
//      case exists to improve.
//   3. A MILITARY ROTORCRAFT → apache. Rotorcraft-ness is the caller's resolved
//      ARCHETYPE when it has one (a `UH60` carries no category but IS a heli via
//      TYPE_ARCHETYPE); with no archetype passed — a stale caller — it falls back
//      to `category === 'A7'`, the only heli signal this zero-import module has.
//      The `military` dbFlag IS required here: civil helicopters are the common
//      case and must keep the civil body.
//
// `archetype` is a trailing OPTIONAL string rather than an `AircraftArchetype`
// import because flights.ts stays genuinely ZERO-import (the shared-chunk rule);
// the renderer already has the resolved archetype in hand and passes it.
export function militarySkinFor(fp: FlightPoint,
                                archetype?: string | null): BgCraftMilitarySkin | null {
  if (!fp) return null;
  const t = typeof fp.typeCode === 'string' ? fp.typeCode.trim().toUpperCase() : '';
  if (t) {
    const exact = MILITARY_SKIN_TYPE_CODES[t];
    if (exact) return exact;
  }
  const c = typeof fp.category === 'string' ? fp.category.trim().toUpperCase() : '';
  if (c === 'A6') return 'f16';
  const heli = archetype != null && archetype !== '' ? archetype === 'heli' : c === 'A7';
  if (heli && fp.military === true) return 'apache';
  return null;
}

// ── Display shell geometry ─────────────────────────────────────────────────
// The shell EXCEEDS the 30,000 mm sky dome by design (see the header): the dome
// is camera-centered + depthWrite:false + renderOrder −10, so it can never
// occlude an aircraft drawn outside it. Reach is a CAMERA FRUSTUM concern, not
// a dome one — see FLIGHT_SHELL_REACH_MM.
//
// Every mm figure here is a BASE (reference-scale) value, authored at
// FLIGHT_SHELL_BASE_MM. The live shell multiplies them by
// `s = shellMm / FLIGHT_SHELL_BASE_MM` — with the sole, deliberate exception of
// `clearMm`, which is absolute (see its comment).
export const FLIGHT_SHELL = {
  rMaxMm: 120000,    // BASE horizontal display shell rim — REACHED exactly at d = radiusNm
  yMinMm: 2500,      // BASE altitude-curve band bottom (0 ft anchor — NOT the render floor)
  yMaxMm: 66000,     // BASE display altitude at altMaxFt and above
  altRefFt: 3000,    // log knee — detail is spent on low, visually interesting traffic
  altMaxFt: 45000,   // above this the altitude curve saturates
  // Hard render floor: no aircraft may EVER draw lower than this, whatever the
  // curves say — it must clear the property (2-story house ≈ 6000 mm + margin).
  // The elevation-true cap made this reachable for ALL distant low traffic
  // (approach traffic at 1500–2000 ft was skimming the yard at the old
  // 2500 mm yMinMm floor — user-reported); the clearance floor is the fix.
  // It does NOT scale with rMaxMm — and now that the shell radius is
  // user-definable (FLIGHT_SHELL_BASE_MM / flightShellMm), that is a LOAD-
  // BEARING exception rather than a hypothetical: `clearMm` is a physical
  // clearance over a physical house, so it stays 6,500 mm on a 60 m shell and
  // on a 1,000 m one alike. On a bigger shell the floored elevation angles
  // simply get shallower, which is exactly the far-off-in-the-sky read.
  clearMm: 6500,
  // Radial mapping ANCHORS — see compressRadiusMm. The two points the user
  // specified: "an aircraft at the configured radius renders AT the rim"
  // (f(1) = 1, implicit) and "one at 10 of 15 nm renders half way out"
  // (f(2/3) = 1/2). The mapping is the PIECEWISE-LINEAR curve through
  // (0,0) → (radialMidU, radialMidF) → (1,1); its two slopes are DERIVED from
  // these anchors, not tuned:
  //   below the midpoint  f′ = radialMidF / radialMidU          = 0.75
  //   above the midpoint  f′ = (1 − radialMidF)/(1 − radialMidU) = 1.5
  // (The previous power law u^P hit the same two anchors but collapsed the
  // near field — see the compressRadiusMm comment for the user report.)
  radialMidU: 2 / 3,
  radialMidF: 0.5,
  // How far PAST the configured radius the mapping keeps expanding before it
  // pins. The planner already filters aircraft beyond the radius, so this is
  // purely slack for boundary jitter + dead reckoning between polls: without it
  // a rig drifting past the rim would freeze its radius and slide along the rim
  // instead of continuing outward. 5 % of the radius, i.e. ≤ f(1.05) = 1.075×
  // rMaxMm — comfortably inside the frustum widen that FLIGHT_SHELL_REACH_MM
  // already requests (1.25 × req + 30,000).
  radialHeadroom: 1.05,
} as const;

// ── User-definable shell radius ────────────────────────────────────────────
// The scale FLIGHT_SHELL's millimetre figures are authored at. Every live shell
// is this reference times `s = shellMm / FLIGHT_SHELL_BASE_MM`, so a shellMm of
// exactly 120,000 reproduces the pre-2026-07 geometry byte-for-byte.
export const FLIGHT_SHELL_BASE_MM = 120000;

// Default user-facing shell radius, in METRES: 300 m = 2.5× the authored
// reference. The old 120 m shell put the whole visible fleet close enough to the
// property that it read as a shelf hovering over the yard once the neighborhood
// overlay drew real-scale streets around it (user-reported). 300 m spreads the
// same traffic properly toward the horizon while — because the model scale
// rides the same similarity factor — every aircraft keeps its apparent size.
export const FLIGHT_SHELL_DEFAULT_RADIUS_M = 300;

// Clamp window for FlightsConfig.shellRadiusM, in metres. The lower bound keeps
// the shell clear of the house + yard; the upper stays far inside CAM_FAR_CEIL
// (a 1,000 m shell reaches ≈1.14e6 mm, vs the renderer's 13.5e6 ceiling).
export const FLIGHT_SHELL_MIN_RADIUS_M = 60;
export const FLIGHT_SHELL_MAX_RADIUS_M = 1000;

// Resolve a configured shell radius (metres) to the display shell's rim, in mm.
// Absent / non-finite / non-positive → the 300 m default, so an omitted config
// field, a stale caller and a hand-edited store all land on the same shell.
export function flightShellMm(shellRadiusM?: number | null): number {
  const m = typeof shellRadiusM === 'number' && isFinite(shellRadiusM) && shellRadiusM > 0
    ? Math.min(FLIGHT_SHELL_MAX_RADIUS_M, Math.max(FLIGHT_SHELL_MIN_RADIUS_M, shellRadiusM))
    : FLIGHT_SHELL_DEFAULT_RADIUS_M;
  return m * 1000;
}

// How far from the shell's own centre (the home anchor) anything may be drawn —
// the far corner of the (rMaxMm × yMaxMm) shell. The renderer records this as a
// camera-frustum reach requirement while aircraft are on screen, exactly as the
// neighborhood overlay records its tile extent; the stock 150,000 mm far plane
// is measured FROM THE CAMERA, so a rim aircraft on the far side of the shell
// would otherwise clip whenever the overlay is off. Derived, never configured.
// This constant is the BASE (120 m shell) reach — kept exported unchanged for
// stale-chunk back-compat. Live callers must use `flightShellReachMm(shellMm)`,
// which scales it by the similarity factor.
export const FLIGHT_SHELL_REACH_MM =
  Math.hypot(FLIGHT_SHELL.rMaxMm, FLIGHT_SHELL.yMaxMm);   // ≈136,953 mm

// The same reach for a shell of the given rim, i.e. the base reach × s. At the
// 300 m default that is ≈342,383 mm; at the 1,000 m maximum ≈1,141,275 mm —
// both comfortably inside the renderer's CAM_FAR_CEIL (13.5e6 mm).
// `verticalScale` (FlightsConfig.verticalScale, resolved by flightVerticalScale)
// multiplies the display HEIGHT, so a shell driven above 1 genuinely reaches
// higher than the authored (rMaxMm × yMaxMm) corner and the frustum requirement
// must grow with it — the governing invariant is `far ≥ camDist + 1.25·req +
// 30000`, measured FROM THE CAMERA, so under-requesting drags the far-clip
// boundary in through the traffic band (the same failure the neighborhood
// overlay hit on zoom-out). `max(1, vs)` because LOWERING the band never
// shrinks the RADIAL term, which dominates the reach — a smaller request there
// would buy nothing and could only under-serve a rim aircraft.
export function flightShellReachMm(shellMm: number = flightShellMm(),
                                   verticalScale = 1): number {
  const s = (isFinite(shellMm) && shellMm > 0 ? shellMm : flightShellMm())
    / FLIGHT_SHELL_BASE_MM;
  const vs = Math.max(1, flightVerticalScale(verticalScale));
  return vs === 1
    ? s * FLIGHT_SHELL_REACH_MM                      // byte-identical default
    : s * Math.hypot(FLIGHT_SHELL.rMaxMm, FLIGHT_SHELL.yMaxMm * vs);
}

// ── Independent vertical (height) scale ────────────────────────────────────
// FlightsConfig.verticalScale — a display-height multiplier that is DELIBERATELY
// independent of the horizontal shell: the whole point is to bring high-altitude
// traffic DOWN toward the horizon band without pulling it any closer to the
// house. The horizontal mapping (compressRadiusMm) is untouched, so bearing and
// distance read exactly as before; only the height above the shell floor moves.
//
// Composed at the ONE place display height is composed — flightDisplayAltitudeMm
// — and AFTER the elevation-true cap but BEFORE the clearMm floor, which stays
// ABSOLUTE (see that function). Absent / garbage → 1, so a stale caller and a
// hand-edited config both reproduce the shipped geometry exactly.
export const FLIGHT_VSCALE_MIN = 0.2;
export const FLIGHT_VSCALE_MAX = 2;
export const FLIGHT_VSCALE_DEFAULT = 1;

export function flightVerticalScale(v?: number | null): number {
  const n = typeof v === 'number' && isFinite(v) && v > 0 ? v : FLIGHT_VSCALE_DEFAULT;
  return Math.min(FLIGHT_VSCALE_MAX, Math.max(FLIGHT_VSCALE_MIN, n));
}

// Horizontal compression: RADIUS-ANCHORED PIECEWISE-LINEAR mapping. The shell
// is a scale model of the user's configured search radius —
//
//   u = clamp(distNm / radiusNm, 0, radialHeadroom)
//   f(u) = 0.75·u              for u ≤ 2/3     (radialMidF / radialMidU)
//   f(u) = 1.5·u − 0.5         for u > 2/3     ((1−radialMidF)/(1−radialMidU))
//   r = shellMm · f(u)
//
// so the mapping is defined entirely by "where does the configured radius
// render": at the RIM, exactly. Both slopes are DERIVED from the two anchors
// the user asked for (see FLIGHT_SHELL.radialMidU / radialMidF): d = radiusNm
// lands on the rim, d = ⅔·radiusNm lands at the halfway point — EXACTLY, and
// for ANY configured radius. 10 of 15 nm and 20 of 30 nm read identically,
// which is what "the drawing distance should match the radius entry" means.
//
// ── Why linear and not the previous power law (user-reported, 2026-07) ──────
// The mapping used to be u^P with P = ln2/ln1.5 ≈ 1.7095, the unique power
// through those same two anchors. The anchors held, but a superlinear curve
// COLLAPSES everything below the midpoint: at radius 15 on the 300 m default
// shell, 6.5 nm landed at u^P = 0.239 → ≈72 m ("renders this plane in the
// backyard") and 2 nm at 0.032 → ≈10 m ("at 2 nm it is rendering over the
// house"). The piecewise-linear curve keeps both anchors but makes the NEAR
// FIELD PROPORTIONAL (f′(0) = 0.75 instead of 0): 6.5 of 15 nm now lands at
// 32.5 % of the shell (≈97 m at 300 m) and 2 nm at 10 % (30 m).
//
// Properties: monotonic, continuous (the kink at u = 2/3 is imperceptible —
// the slope only changes from 0.75 to 1.5 at the halfway point), f(0) = 0,
// bounded by shellMm · f(radialHeadroom) = 1.075 · shellMm, and a pure
// function of u — so the shell stays a scale model of whatever radius is
// typed. The earlier asymptotic curve (rMax·d/(d+K)) satisfied none of this:
// it front-loaded distance and never reached the rim, putting a 10 nm aircraft
// 71 % of the way out at radius 15 (user-reported: "flights 10 miles away
// still appear close to the property line").
//
// `shellMm` is the shell RIM (the user's draw radius, resolved by
// flightShellMm) and takes the place of the authored FLIGHT_SHELL.rMaxMm — the
// mapping's SHAPE is untouched, only its overall size, so the result is exactly
// `s ×` the base value for `s = shellMm / FLIGHT_SHELL_BASE_MM`.
export function compressRadiusMm(
  distNm: number, radiusNm: number, shellMm: number = flightShellMm(),
): number {
  const { radialMidU, radialMidF, radialHeadroom } = FLIGHT_SHELL;
  const rMax = isFinite(shellMm) && shellMm > 0 ? shellMm : flightShellMm();
  const d = isFinite(distNm) && distNm > 0 ? distNm : 0;
  // A missing / garbage / non-positive radius falls back to the shipped default
  // rather than dividing by zero — the shell must always have a scale.
  const R = isFinite(radiusNm) && radiusNm > 0 ? radiusNm : FLIGHTS_DEFAULT_RADIUS_NM;
  const u = Math.min(d / R, radialHeadroom);
  const f = u <= radialMidU
    ? (radialMidF / radialMidU) * u
    : radialMidF + ((1 - radialMidF) / (1 - radialMidU)) * (u - radialMidU);
  return rMax * f;
}

// Altitude compression: log curve over [0, altMaxFt] → [yMinMm, yMaxMm].
// Monotonic and bounded at both ends; altitudes above altMaxFt clamp to yMaxMm,
// below-sea-level readings clamp to yMinMm.
//
// This is the OVERHEAD/near-traffic branch only — it knows nothing about
// distance, so `flightDisplayPos` caps its output at the true elevation angle
// before using it. Do not read it as "the display altitude".
//
// BOTH band ends scale with the shell (`s = shellMm / FLIGHT_SHELL_BASE_MM`) so
// the vertical stays in proportion with the horizontal — the altitude ANCHORS
// (altRefFt / altMaxFt) are real-world feet and never scale.
export function compressAltitudeMm(
  altFt: number, shellMm: number = flightShellMm(),
): number {
  const { yMinMm, yMaxMm, altRefFt, altMaxFt } = FLIGHT_SHELL;
  const s = (isFinite(shellMm) && shellMm > 0 ? shellMm : flightShellMm())
    / FLIGHT_SHELL_BASE_MM;
  const a = Math.max(0, Math.min(altMaxFt, isFinite(altFt) ? altFt : 0));
  const t = Math.log(1 + a / altRefFt) / Math.log(1 + altMaxFt / altRefFt);
  return s * (yMinMm + (yMaxMm - yMinMm) * t);
}

// ── Distance-compensated model scale ───────────────────────────────────────
// The toy aircraft models are authored at a fixed size, so on the 120 m shell a
// rim aircraft is a few pixels of nothing. This grows the rig linearly with its
// compressed display radius — a decorative legibility aid in exactly the spirit
// of the shell itself (NOT perspective correction, which would be 1/z and would
// make near traffic vanish). Monotonic, bounded, and 1 at the origin so nothing
// nearby changes size vs. today.
//
//   scale = 1 + FLIGHT_SCALE_GAIN · (rMm / rMaxMm)      → [1, 1 + gain]
//
// The renderer COMPOSES this with the spawn/despawn fade scale (multiplicative),
// so a dying rim aircraft still shrinks to nothing from its enlarged size.
//
// The gain is deliberately GENTLE (0.8 → 1.8× at the rim). It was 2.2 (3.2×)
// while the old asymptotic radial curve bunched everything into the outer
// shell and rim growth was the only thing keeping distant traffic legible. The
// radius-anchored mapping spreads the band properly, and a rim aircraft should
// read "fairly small" (the user's word) — natural perspective does most of the
// work now, and this only stops the model dissolving into a pixel. Personal
// taste rides FlightsConfig.modelScale (0.5–4) on top of it.
//
// ── Why there is NO shell factor here (2026-07, the SECOND reversal) ───────
// This function briefly returned `s · (1 + gain · r/shellMm)` for
// `s = shellMm / FLIGHT_SHELL_BASE_MM`, on the reasoning that a user-definable
// shell should be a full SIMILARITY transform (position and size scaling
// together, so a given aircraft keeps its apparent angular size). That is
// geometrically true and is exactly the problem: scaling POSITION and SIZE by
// the same factor preserves every apparent angle and apparent size from the
// house viewpoint, so the "Draw radius (m)" setting became a perceptual
// NO-OP. User-reported, verbatim: "setting the draw distance larger or smaller
// doesn't change how far it is away."
//
// Without the factor the knob does what it says: a bigger draw radius genuinely
// pushes traffic away and ordinary perspective shrinks it. Do NOT reintroduce
// the leading `s` — if models read too small at a large shell, the size lever
// is `FlightsConfig.modelScale` (0.5–4), which is the user's own control.
//
// The scale therefore depends only on u = r/shellMm — invariant across shell
// sizes, unlike the POSITION, which still scales (the shell is a similarity in
// position only; see flightShellReachMm, which is unaffected).
export const FLIGHT_SCALE_GAIN = 0.8;

export function flightDisplayScale(
  rMm: number, shellMm: number = flightShellMm(),
): number {
  const shell = isFinite(shellMm) && shellMm > 0 ? shellMm : flightShellMm();
  const r = isFinite(rMm) && rMm > 0 ? rMm : 0;
  const t = Math.min(1, r / shell);
  return 1 + FLIGHT_SCALE_GAIN * t;
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
//   dispY = max(clearMm, min(compressAltitudeMm(altFt), rMm · altM / distM))
//
// The second term is the height that reproduces the aircraft's TRUE elevation
// angle on the compressed radius: `atan2(dispY, rMm)` then equals
// `atan2(altM, distM)` exactly. Under the piecewise-linear radial mapping the
// sub-midpoint branch is r = shellMm · 0.75 · d/R, so the elevation term
// reduces to `shellMm · 0.75 · altM / (NM_M · R)` — CONSTANT in d for a fixed
// altitude, because radius and height grow together there. Above the midpoint
// (slope 1.5) it grows with d. Either way "farther = lower in the sky" is an
// ANGLE property, never a dispY one: atan2(dispY, rMm) is exactly the true
// elevation angle on this branch, and the true angle falls with distance.
//
// Relative to the previous power-law radius, the near-field r is now much
// LARGER, so the elevation term is larger too and FEWER aircraft bottom out on
// the clearMm floor — strictly more of them display at their true elevation
// angle, i.e. strictly more honest. The min() still
// leaves the log curve in charge of near/overhead traffic (where the elevation
// term is the larger of the two), so a plane genuinely overhead still reads
// overhead, and everywhere else the display angle can only be ≤ the true one.
// The clearMm floor is the single exception to angle-honesty: NOTHING renders
// below the property-clearance height (a plane must never be able to hit the
// house), so distant low approach traffic rides the floor instead of the yard.
//
// Under a shell rescale (`shellMm`) BOTH inner terms are exactly `s ×` their
// base values — the log curve because compressAltitudeMm scales, the elevation
// term because `rMm` does — so dispY is `s ×` the base dispY *except* where the
// ABSOLUTE clearMm floor engages. There the display elevation angle gets
// shallower on a bigger shell, which is the correct far-off-in-the-sky read.
//
// ── verticalScale (FlightsConfig.verticalScale) ────────────────────────────
// The trailing optional multiplier is applied to the composed height and NOTHING
// else — the radial mapping never sees it, so lowering the band drops traffic
// toward the horizon without bringing it one millimetre closer to the house.
// ORDER IS LOAD-BEARING: the scale multiplies the elevation-capped curve, and
// the ABSOLUTE clearMm floor is applied AFTER it, so a scaled-down aircraft can
// never be pushed into (or below) the property. Scaling UP simply raises the
// band; the floor is then irrelevant. Absent = 1 ⇒ byte-identical to the
// shipped composition for every existing caller.
export function flightDisplayAltitudeMm(
  altFt: number, distNm: number, rMm: number, shellMm: number = flightShellMm(),
  verticalScale = 1,
): number {
  const altM = (isFinite(altFt) ? altFt : 0) * FT_M;
  // distM floored at 1 m so an aircraft sitting exactly on the origin (r = 0
  // anyway) can never divide by zero.
  const distM = Math.max((isFinite(distNm) && distNm > 0 ? distNm : 0) * NM_M, 1);
  const r = isFinite(rMm) && rMm > 0 ? rMm : 0;
  const vs = flightVerticalScale(verticalScale);
  const raw = Math.min(compressAltitudeMm(altFt, shellMm), r * (altM / distM));
  return Math.max(FLIGHT_SHELL.clearMm, raw * vs);
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
//
// `shellMm` (the user's draw radius, resolved by flightShellMm) rescales the
// whole result as a similarity: planX / planY / dispY are all exactly `s ×`
// their 120 m-reference values, except where dispY's absolute clearMm floor
// engages. Absent = the 300 m default.
//
// `verticalScale` rides through to flightDisplayAltitudeMm and touches ONLY
// dispY — planX / planY are untouched by construction, which is exactly the
// "lower it without bringing it closer" contract.
export function flightDisplayPos(
  fp: FlightPoint, originLat: number, originLon: number, thetaRad: number, radiusNm: number,
  shellMm: number = flightShellMm(), verticalScale = 1,
): { planX: number; planY: number; dispY: number; distNm: number; bearingRad: number } {
  const { bearingRad, distNm } = flightBearingDistance(originLat, originLon, fp.lat, fp.lon);
  const e = Math.sin(bearingRad), n = Math.cos(bearingRad);   // unit geo vector
  const c = Math.cos(thetaRad), s = Math.sin(thetaRad);
  const r = compressRadiusMm(distNm, radiusNm, shellMm);
  return {
    planX: (c * e - s * n) * r,
    planY: (s * e + c * n) * r,
    dispY: flightDisplayAltitudeMm(fp.altFt, distNm, r, shellMm, verticalScale),
    distNm, bearingRad,
  };
}

// ── Banded visual speed indicator ──────────────────────────────────────────
// Ground speed → one of FIVE display bands, each with its own visual language
// (hover / short comet tail / medium tail + motion lines / contrail / contrail +
// afterburner + ghosts). A BAND rather than a continuous curve on purpose: the
// display shell is decorative and deliberately not to scale, so a band is an
// honest "roughly this fast" read that also lets each tier own a distinct,
// cheap, buildable effect set instead of one parameter smeared across all of
// them. Pure + zero-import like everything else here; the renderer and the 2D
// canvas both call it, so a dart and its rig can never disagree about a band.
export type FlightSpeedBand = 1 | 2 | 3 | 4 | 5;

// Band UPPER edges in km/h — band n covers [T[n−2], T[n−1]).
//   1 <60      hover / rotorcraft / very slow
//   2 60–200   light piston
//   3 200–450  turboprop / fast piston
//   4 450–700  jet cruise
//   5 700+     high-subsonic and above
export const FLIGHT_SPEED_THRESHOLDS_KMH = [60, 200, 450, 700] as const;

// Boundary-flicker guard (the codebase's hysteresis idiom): a live aircraft
// hovering ON a threshold would otherwise rebuild its whole effect set several
// times a minute. The band only changes once the speed clears the edge it is
// leaving by this margin, in whichever direction it is moving.
export const FLIGHT_BAND_HYSTERESIS_KMH = 15;

export const KT_TO_KMH = 1.852;

// Fallback when the feed carries NO usable ground speed (a Mode-S-only or
// position-only target). An archetype implies a cruise regime well enough to
// pick a plausible band — far better than defaulting everything to "hover" (no
// trail at all) or to band 5 (afterburners on a Cessna). Anything unrecognized
// falls to 4, matching aircraftArchetype's own narrowbody default.
export const FLIGHT_BAND_FALLBACK: Readonly<Record<string, FlightSpeedBand>> = {
  'heli': 1,
  'ga-high': 2, 'ga-low': 2,
  'turboprop': 3, 'twin-prop': 3,
  'narrowbody': 4, 'widebody': 4, 'bizjet': 4,
};
export const FLIGHT_BAND_FALLBACK_DEFAULT: FlightSpeedBand = 4;

function rawSpeedBand(kmh: number): FlightSpeedBand {
  let b = 1;
  for (const t of FLIGHT_SPEED_THRESHOLDS_KMH) if (kmh >= t) b++;
  return b as FlightSpeedBand;
}

// Resolve a display band. `prevBand` (the rig's current band) engages the
// hysteresis; omit it for a stateless read (the 2D canvas keeps no per-aircraft
// state, so it always asks statelessly — a dash count flickering for one frame
// at a boundary is invisible, whereas a 3D effect REBUILD is not).
// `archetype` is only consulted when the speed is unusable.
export function flightSpeedBand(
  gsKmh: number | null | undefined,
  prevBand?: FlightSpeedBand | null,
  archetype?: string | null,
): FlightSpeedBand {
  if (typeof gsKmh !== 'number' || !isFinite(gsKmh) || gsKmh < 0) {
    // Deterministic per archetype, so it cannot oscillate — no hysteresis needed
    // and `prevBand` is deliberately ignored (a rig that LOSES its speed field
    // settles onto its airframe's regime rather than freezing on a stale band).
    return (archetype != null && FLIGHT_BAND_FALLBACK[archetype])
      || FLIGHT_BAND_FALLBACK_DEFAULT;
  }
  const raw = rawSpeedBand(gsKmh);
  if (prevBand == null || raw === prevBand) return raw;
  const T = FLIGHT_SPEED_THRESHOLDS_KMH;
  if (raw > prevBand) {
    // Leaving prevBand UPWARD: clear its upper edge by the margin. (prevBand 5
    // has no upper edge and can never take this branch.)
    const upper = T[prevBand - 1];
    return upper != null && gsKmh >= upper + FLIGHT_BAND_HYSTERESIS_KMH ? raw : prevBand;
  }
  // Leaving prevBand DOWNWARD: drop below its lower edge by the margin.
  const lower = T[prevBand - 2];
  return lower != null && gsKmh <= lower - FLIGHT_BAND_HYSTERESIS_KMH ? raw : prevBand;
}

// Convenience for callers holding a FlightPoint: knots → km/h, with the
// archetype fallback threaded through. `gsKt` is null on a surprising share of
// live traffic, which is exactly what FLIGHT_BAND_FALLBACK is for.
export function flightPointSpeedBand(
  fp: { gsKt?: number | null }, prevBand?: FlightSpeedBand | null,
  archetype?: string | null,
): FlightSpeedBand {
  const kt = fp?.gsKt;
  const kmh = typeof kt === 'number' && isFinite(kt) && kt >= 0 ? kt * KT_TO_KMH : null;
  return flightSpeedBand(kmh, prevBand, archetype);
}

// ── ISS ────────────────────────────────────────────────────────────────────
// Live ISS position as reported by wheretheiss.at (a position feed, NOT a
// propagator — it can only answer "where is it right now"). Units normalized:
// altitude km, velocity km/s (the API reports km/h), timestamp epoch ms.
export interface IssNow {
  lat: number; lon: number; altKm: number; velKmS: number; tsMs: number;
}

// ── Sources: which feed, and how it reaches the browser ────────────────────
// (2026-08 source wave — see docs/research/flight-tracking.md §2.)
//
// THE BROWSER-DIRECT TRANSPORT IS DEAD AS A CONCEPT, not just as a provider.
// Measured 2026-08-15 from a foreign origin in a real headless browser:
//   • airplanes.live  → HTTP 403 for everyone, with a body asking you to email
//     contact@airplanes.live with a description of your project before they
//     re-open access. A policy change, not an outage; a browser User-Agent does
//     not change it. It was the ONLY keyless cloud feed that ever sent
//     `access-control-allow-origin: *`.
//   • adsb.lol        → HTTP 200 to curl, NO CORS header at all → browser block.
//   • opensky-network → HTTP 200 to curl, `access-control-allow-origin:
//     https://opensky-network.org` only → browser block.
// So there is no longer any keyless CORS-open ADS-B API. `opensky` and `adsblol`
// are therefore fetched SERVER-SIDE by Home Assistant through a user-defined
// `rest_command` (which returns its response body when called with
// `return_response: true`), exactly the mechanism `weather.get_forecasts` and
// `calendar.get_events` already ride. No CORS applies to HA's own outbound HTTP.
export const FLIGHT_SOURCES =
  ['opensky', 'adsblol', 'cloud', 'local', 'entity', 'demo'] as const;
export type FlightSource = typeof FLIGHT_SOURCES[number];

// DEFAULT = OpenSky. It is the one source that (a) still answers, (b) is
// documented and stable, and (c) needs no permission email. Absent/unknown
// resolves here; a stored explicit source is NEVER rewritten (an existing
// `cloud` user keeps `cloud` and is told in the settings UI why it is failing).
export const FLIGHTS_DEFAULT_SOURCE: FlightSource = 'opensky';

export function resolveFlightSource(v: unknown): FlightSource {
  return (FLIGHT_SOURCES as readonly string[]).includes(v as string)
    ? v as FlightSource : FLIGHTS_DEFAULT_SOURCE;
}

// The two sources that cannot be fetched by the browser and must go through the
// HA rest_command proxy. `local` may ALSO be routed through HA (which is how a
// receiver without a CORS header, or an http receiver behind an https panel, is
// reached) but that is the user's CHOICE, not a requirement — so `local` is
// deliberately absent here and can never report `needs-proxy`.
export function flightSourceNeedsProxy(src: unknown): boolean {
  const s = resolveFlightSource(src);
  return s === 'opensky' || s === 'adsblol';
}

// Sources that cannot work AT ALL without a Home Assistant connection — the
// gate for the offline `needs-ha` status. A SUPERSET of needsProxy: `entity`
// uses no rest_command, but its whole premise is an HA sensor whose attributes
// carry the aircraft array, and offline there are no states to read. Reporting
// a generic fetch `error` for either would be a lie — nothing is being fetched
// and nothing can be.
//
// Deliberately EXCLUDED, because each is genuinely reachable from a browser
// with no Home Assistant behind it:
//   • `cloud`   — a direct browser fetch. airplanes.live now 403s everyone, so
//                 it will fail — but it fails as an honest HTTP error from a
//                 request that really was made, which is what `error` means.
//   • `local`   — a direct fetch of the user's own LAN receiver. This is the
//                 one FETCHED source that can genuinely serve a
//                 Home-Assistant-less panel, so it must never be suppressed.
//   • `demo`    — synthesized in-process from the clock (`demoFlightPoints`).
//                 It makes NO request of any kind, so it is the one source that
//                 is always available: gh-pages, kiosk, air-gapped, no HA.
export function flightSourceNeedsHa(src: unknown): boolean {
  const s = resolveFlightSource(src);
  return flightSourceNeedsProxy(s) || s === 'entity';
}

// Suggested `rest_command:` service name per source that CAN be proxied. The
// user may pick any name; this is what the generated YAML uses and what the
// settings UI offers as a one-click fill.
export const FLIGHT_PROXY_DEFAULT_COMMAND: Readonly<Record<string, string>> = {
  opensky: 'diorama_opensky',
  adsblol: 'diorama_adsblol',
  local: 'diorama_local_adsb',
};

// Sanitize a user-typed rest_command service name to what HA will actually
// accept: lowercase, [a-z0-9_], and with a pasted `rest_command.` domain prefix
// stripped (the settings field asks for the service name, and pasting the full
// service id is the obvious mistake). Blank / all-invalid → undefined, which is
// the "not configured yet" sentinel the planner reports as `needs-proxy`.
export function sanitizeFlightProxyCommand(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const bare = v.trim().replace(/^rest_command\./i, '');
  const clean = bare.toLowerCase().replace(/[^a-z0-9_]/g, '');
  return clean ? clean : undefined;
}

// Poll cadence default, per source. OpenSky meters access in CREDITS: an
// anonymous caller gets ~400/day and an authenticated one ~4000/day, and one
// bounding-box request costs 1–4 credits. At the shipped 8 s default a day is
// ~10,800 requests — orders of magnitude over either allowance — so OpenSky
// defaults to the 60 s clamp ceiling (~1,440/day, which fits an authenticated
// account). The user can still choose anything in the 5..60 clamp; the settings
// UI states the arithmetic rather than silently deciding for them. Dead
// reckoning covers the gap between polls (the renderer already extrapolates
// from gs/track), so a slower poll costs smoothness, not correctness.
export const FLIGHT_POLL_DEFAULT_S = 8;
export const FLIGHT_POLL_DEFAULT_OPENSKY_S = 60;

export function flightDefaultPollSeconds(src: unknown): number {
  return resolveFlightSource(src) === 'opensky'
    ? FLIGHT_POLL_DEFAULT_OPENSKY_S : FLIGHT_POLL_DEFAULT_S;
}

// ── Attribution (compliance, NOT configurable) ─────────────────────────────
// Every third-party feed we display requires crediting. `local` (the user's own
// receiver) and `entity` (an HA sensor whose upstream we cannot know) return
// null — we have nobody to credit and inventing one would be worse. Consumed by
// the fixed bottom-left chip in app.ts, which shows it whenever the feed is
// enabled AND data is resolved AND the flights layer is visible.
export interface FlightAttribution { text: string; name: string; url: string }

export function flightAttribution(src: unknown): FlightAttribution | null {
  switch (resolveFlightSource(src)) {
    case 'opensky':
      return { text: 'Flight data', name: '© The OpenSky Network', url: 'https://opensky-network.org' };
    case 'adsblol':
      return { text: 'Flight data', name: '© adsb.lol', url: 'https://adsb.lol' };
    case 'cloud':
      return { text: 'Flight data', name: '© airplanes.live', url: 'https://airplanes.live' };
    default:
      return null;
  }
}

// ── OpenSky bounding box ───────────────────────────────────────────────────
// OpenSky's /states/all takes a lat/lon BOX, not a point + radius (adsb.lol and
// airplanes.live both take point + radius). Derive the smallest box containing
// the search circle: the latitude half-span is the arc angle, and the longitude
// half-span is that same arc divided by cos(lat) because a degree of longitude
// SHRINKS toward the poles — at 60°N a degree of longitude is half a degree of
// latitude in metres, and near the pole it collapses entirely.
//
// Two degenerate cases, both widened rather than clipped (over-fetching is
// harmless — the planner filters every point by true great-circle distance
// afterwards, whereas clipping would silently lose aircraft):
//   • very high latitude, where the longitude span exceeds the whole globe;
//   • a box straddling the ±180° antimeridian, which OpenSky cannot express.
export interface OpenSkyBox { lamin: number; lomin: number; lamax: number; lomax: number }

export function openSkyBoundingBox(lat: number, lon: number, radiusNm: number): OpenSkyBox {
  const la = typeof lat === 'number' && isFinite(lat) ? Math.max(-90, Math.min(90, lat)) : 0;
  const lo = typeof lon === 'number' && isFinite(lon) ? Math.max(-180, Math.min(180, lon)) : 0;
  const r = typeof radiusNm === 'number' && isFinite(radiusNm) && radiusNm > 0
    ? Math.min(500, radiusNm) : FLIGHTS_DEFAULT_RADIUS_NM;

  const dLat = (r * NM_M) / EARTH_R_M / DEG;          // arc angle, degrees
  const cosLat = Math.cos(la * DEG);
  const dLon = cosLat > 1e-9 ? dLat / cosLat : 360;   // pole → "everything"

  // Round OUTWARD (floor the minima, ceil the maxima) at 5 dp — rounding to
  // NEAREST could shave up to ~1 m off an edge and clip an aircraft sitting
  // exactly at the search radius. Over-fetching is free; clipping is a silent
  // data loss.
  const dn = (v: number): number => Math.floor(v * 1e5) / 1e5;
  const up = (v: number): number => Math.ceil(v * 1e5) / 1e5;
  const lamin = Math.max(-90, dn(la - dLat));
  const lamax = Math.min(90, up(la + dLat));

  if (!(dLon < 180) || lo - dLon < -180 || lo + dLon > 180) {
    return { lamin, lomin: -180, lamax, lomax: 180 };
  }
  return { lamin, lomin: dn(lo - dLon), lamax, lomax: up(lo + dLon) };
}

// Template variables the generated `rest_command` YAML consumes, i.e. the
// service data the planner passes. One place builds them so the YAML shown in
// the settings drawer and the call actually made can never disagree.
export function flightProxyVars(
  src: unknown, lat: number, lon: number, radiusNm: number,
): Record<string, number> {
  const s = resolveFlightSource(src);
  // A proxied LOCAL receiver takes NO parameters: the URL is the user's own
  // `localUrl`, a fixed LAN address, so the YAML is static and there is nothing
  // to template. Sending coordinates HA would ignore would only invite a
  // mismatch between the generated block and the call.
  if (s === 'local') return {};
  if (s === 'opensky') {
    return openSkyBoundingBox(lat, lon, radiusNm) as unknown as Record<string, number>;
  }
  const r4 = (v: number): number =>
    Math.round((typeof v === 'number' && isFinite(v) ? v : 0) * 1e4) / 1e4;
  const dist = Math.max(1, Math.min(250, Math.round(
    typeof radiusNm === 'number' && isFinite(radiusNm) ? radiusNm : FLIGHTS_DEFAULT_RADIUS_NM)));
  return { lat: r4(lat), lon: r4(lon), dist };
}

// The exact request the user's HA will make with their current settings —
// shown as a comment in the generated YAML so a failing proxy can be debugged
// by pasting one URL into a browser.
export function flightProxyUrlPreview(
  src: unknown, lat: number, lon: number, radiusNm: number,
): string {
  const v = flightProxyVars(src, lat, lon, radiusNm);
  return resolveFlightSource(src) === 'opensky'
    ? `https://opensky-network.org/api/states/all?lamin=${v.lamin}&lomin=${v.lomin}&lamax=${v.lamax}&lomax=${v.lomax}`
    : `https://api.adsb.lol/v2/lat/${v.lat}/lon/${v.lon}/dist/${v.dist}`;
}

// The `configuration.yaml` block the user must paste. Pure + testable: the
// settings drawer only renders what this returns. The URL is TEMPLATED on the
// variables above rather than baked with today's coordinates, so changing the
// radius (or moving the home landmark) never means editing YAML again — and HA
// only ever fetches the one provider endpoint, never an arbitrary URL the panel
// hands it.
//
// `localUrl` is a TRAILING OPTIONAL argument used only by the `local` branch
// (the receiver address is the URL, and no caller for the other sources has one
// to give) — absent, every other source's output is unchanged.
export function flightProxyYaml(
  src: unknown, command: string | undefined,
  origin: { lat: number; lon: number } | null, radiusNm: number,
  localUrl?: string,
): string {
  const s = resolveFlightSource(src);
  const name = sanitizeFlightProxyCommand(command)
    ?? FLIGHT_PROXY_DEFAULT_COMMAND[s] ?? 'diorama_flights';

  if (s === 'local') {
    // Static URL, no Jinja: HA fetches exactly the address the user typed into
    // the panel. With no address yet there is nothing honest to emit, so the
    // line becomes a clearly-marked placeholder rather than a block that would
    // silently fail if pasted.
    const url = typeof localUrl === 'string' && localUrl.trim() ? localUrl.trim() : null;
    return '# Diorama flight tracking — local receiver via Home Assistant.\n'
      + '# Home Assistant fetches your receiver and hands the panel the response.\n'
      + '# This avoids BOTH browser limits: no CORS header is needed on the\n'
      + '# receiver, and an https panel can reach an http receiver.\n'
      + '# Home Assistant itself must be able to reach this address.\n'
      + 'rest_command:\n'
      + `  ${name}:\n`
      + `    url: ${url ?? '# SET THE RECEIVER URL IN THE PANEL FIRST — it goes here'}\n`
      + '    method: GET\n'
      + '    timeout: 10\n';
  }

  const preview = origin
    ? `#   ${flightProxyUrlPreview(s, origin.lat, origin.lon, radiusNm)}\n`
    : '#   (calibrate a GPS landmark or set a weather location to preview the URL)\n';

  if (s === 'opensky') {
    return '# Diorama flight tracking — OpenSky proxy.\n'
      + '# The browser cannot call OpenSky directly (it is CORS-locked to its own\n'
      + '# site), so Home Assistant fetches it and hands the panel the response.\n'
      + '# Your current request:\n'
      + preview
      + 'rest_command:\n'
      + `  ${name}:\n`
      + '    url: >-\n'
      + '      https://opensky-network.org/api/states/all?lamin={{ lamin }}&lomin={{ lomin }}&lamax={{ lamax }}&lomax={{ lomax }}\n'
      + '    method: GET\n'
      + '    timeout: 20\n'
      + '    # Credentials are OPTIONAL but strongly recommended: anonymous access is\n'
      + '    # ~400 credits/day, an account ~4000 (one box request costs 1-4 credits).\n'
      + '    # Legacy username/password accounts:\n'
      + '    # username: !secret opensky_user\n'
      + '    # password: !secret opensky_pass\n'
      + '    # Newer OAuth2 client-credential accounts — mint a bearer token and send it:\n'
      + '    # headers:\n'
      + '    #   Authorization: !secret opensky_bearer\n';
  }
  return '# Diorama flight tracking — adsb.lol proxy.\n'
    + '# adsb.lol answers fine but sends no CORS header, so the browser cannot\n'
    + '# call it; Home Assistant fetches it and hands the panel the response.\n'
    + '# Your current request:\n'
    + preview
    + 'rest_command:\n'
    + `  ${name}:\n`
    + '    url: >-\n'
    + '      https://api.adsb.lol/v2/lat/{{ lat }}/lon/{{ lon }}/dist/{{ dist }}\n'
    + '    method: GET\n'
    + '    timeout: 20\n';
}

// ── rest_command response unwrapping ───────────────────────────────────────
// A `call_service` with `return_response: true` resolves to
// `{ context, response }`, and rest_command's own response is
// `{ status, content }` — where `content` is already-parsed JSON when the
// endpoint answered with an application/json content type, and a raw STRING
// otherwise. Peel all of that (defensively, in any combination, since a caller
// may hand us an already-peeled payload) down to the aircraft envelope. Never
// throws: a JSON string that fails to parse comes back as null.
export function unwrapRestCommandPayload(raw: unknown): unknown {
  let v: unknown = raw;
  for (let i = 0; i < 4; i++) {
    if (typeof v === 'string') {
      try { v = JSON.parse(v); } catch { return null; }
      continue;
    }
    if (!v || typeof v !== 'object' || Array.isArray(v)) break;
    const o = v as Record<string, unknown>;
    if ('response' in o) { v = o.response; continue; }
    if ('content' in o) { v = o.content; continue; }
    break;
  }
  return v ?? null;
}

// ── OpenSky /states/all → FlightPoint[] ────────────────────────────────────
// OpenSky delivers `{time, states: [[...], ...]}` where each state is a
// POSITIONAL ARRAY, not an object, and in SI units. Rather than build
// FlightPoints here (a second construction site that would drift from the
// readsb one), each row is mapped onto the readsb/tar1090 field names and
// handed to `normalizeAircraftList` — so the ground filter, the C*/B3
// non-aircraft drop, the lat/lon sanity range, the hex lowercasing and the
// never-throws discipline are all inherited, by construction.
//
// Index order (opensky-api docs, verified against a live capture 2026-08-15):
//   0 icao24 · 1 callsign (space-PADDED) · 2 origin_country · 3 time_position
//   4 last_contact · 5 longitude · 6 latitude · 7 baro_altitude (m)
//   8 on_ground · 9 velocity (m/s) · 10 true_track (deg) · 11 vertical_rate (m/s)
//   12 sensors · 13 geo_altitude (m) · 14 squawk · 15 spi · 16 position_source
//   17 category (OPTIONAL — absent from many responses)
//
// Capability gap, stated plainly: /states/all carries NO registry enrichment
// (no registration, type code, operator) and no dbFlags, so `reg` / `typeCode` /
// `typeDesc` / `operator` are null and `military` / `interesting` / `pia` /
// `ladd` are false on every OpenSky point. Military skins, privacy dimming and
// type-driven archetypes therefore do not fire on this source; the
// callsign-derived airline livery still does.
const OPENSKY_STATE_LEN = 17;

// OpenSky's numeric emitter-category enum → the DO-260B code strings the rest
// of the feature speaks ('A1'..'D7'). The two enums are the same table, so this
// is a relabel, not a guess. 0 (no information) and 13 (reserved) → null.
// Mapping C1..C5 through means `normalizeAircraftList` drops surface vehicles
// and obstacles for OpenSky exactly as it does for readsb.
const OPENSKY_CATEGORY: Readonly<Record<number, string>> = {
  1: 'A0', 2: 'A1', 3: 'A2', 4: 'A3', 5: 'A4', 6: 'A5', 7: 'A6', 8: 'A7',
  9: 'B1', 10: 'B2', 11: 'B3', 12: 'B4', 14: 'B6', 15: 'B7',
  16: 'C1', 17: 'C2', 18: 'C3', 19: 'C4', 20: 'C5',
};

const M_TO_FT = 1 / FT_M;                 // 3.28084
const MS_TO_KT = 3600 / NM_M;             // 1.943844
const MS_TO_FPM = 60 / FT_M;              // 196.850394

export function normalizeOpenSkyStates(json: unknown): FlightPoint[] {
  const src: unknown = Array.isArray(json)
    ? json
    : (json && typeof json === 'object' ? (json as Record<string, unknown>).states : null);
  if (!Array.isArray(src)) return [];
  const nowS = (json && typeof json === 'object' && !Array.isArray(json))
    ? num((json as Record<string, unknown>).time) : null;

  const rows: Record<string, unknown>[] = [];
  for (const raw of src) {
    if (!Array.isArray(raw) || raw.length < OPENSKY_STATE_LEN) continue;
    const icao = raw[0];
    if (typeof icao !== 'string' || !icao.trim()) continue;

    const baroM = num(raw[7]);
    const geoM = num(raw[13]);
    const onGround = raw[8] === true;
    const vel = num(raw[9]);
    const vert = num(raw[11]);
    const tPos = num(raw[3]);
    const catNum = num(raw.length > 17 ? raw[17] : null);
    const callsign = typeof raw[1] === 'string' ? raw[1].trim() : '';

    rows.push({
      hex: icao,
      flight: callsign,
      lat: num(raw[6]),
      lon: num(raw[5]),
      // The on-ground sentinel is the SAME string readsb emits, so the existing
      // "a taxiing aircraft is not a flight overhead" drop applies unchanged.
      alt_baro: onGround ? 'ground' : (baroM !== null ? baroM * M_TO_FT : null),
      alt_geom: geoM !== null ? geoM * M_TO_FT : null,
      gs: vel !== null ? vel * MS_TO_KT : null,
      track: num(raw[10]),
      baro_rate: vert !== null ? vert * MS_TO_FPM : null,
      squawk: typeof raw[14] === 'string' ? raw[14] : null,
      category: catNum !== null ? (OPENSKY_CATEGORY[catNum] ?? null) : null,
      seen_pos: nowS !== null && tPos !== null ? Math.max(0, nowS - tPos) : null,
    });
  }
  return normalizeAircraftList(rows);
}

// The one dispatch point every source's raw payload goes through, so the
// planner has a single call site and no source `switch` of its own.
export function normalizeFlightPayload(src: unknown, json: unknown): FlightPoint[] {
  return resolveFlightSource(src) === 'opensky'
    ? normalizeOpenSkyStates(json)
    : normalizeAircraftList(json);
}

// ── Source: demo (synthetic traffic) ────────────────────────────────────────
// The sixth source: no network, no Home Assistant, no receiver — the aircraft
// are SYNTHESIZED from the clock. It exists because live flight tracking is
// structurally unavailable in exactly the place the feature most needs to be
// seen: the hosted gh-pages demo and any offline / air-gapped panel. OpenSky
// and adsb.lol require an HA `rest_command` proxy, airplanes.live now 403s
// every browser, and `entity` needs HA states. `flightSourceNeedsHa` and
// `flightSourceNeedsProxy` therefore BOTH exclude 'demo' (see their notes).
//
// PURE + DETERMINISTIC, following the `demoWeatherNow` precedent (weather.ts):
// the caller passes the epoch (`nowMs`) — this module never reads the clock —
// and there is no `Math.random` anywhere, so the same `nowMs` always yields
// byte-identical output. That is what makes the whole fleet test-pinnable and
// what keeps it safe under the house rule banning randomness in anything that
// reruns under a dirty key.
//
// MOTION IS FREE. `_advanceFlights` in three-renderer already dead-reckons from
// `latPerS`/`lonPerS` (derived from `gs` + `track`) and eases the display
// position at 60 fps between polls. This source only has to answer "where is
// everyone at time T" on the ordinary poll cadence, with a `gs`/`track` pair
// that genuinely matches its own motion — which is why both are DERIVED by
// central-differencing the analytic position rather than declared independently.
// Aircraft fly closed CIRCUITS about the observer, so the sky never empties and
// the demo is watchable indefinitely.

// The synthetic observer, used ONLY when nothing real resolves (see
// `demoFlightsOrigin` and `Planner.flightsOrigin`). Every rendered position is
// relative to the origin — a bearing + a compressed radius — so the absolute
// coordinates are invisible in the output and any origin yields the same sky.
// It matters for exactly one thing: the ISS's alt/az, which is a real
// astronomical calculation about a real point on Earth.
export const DEMO_FLIGHT_ORIGIN: Readonly<{ lat: number; lon: number }> =
  { lat: 47.6062, lon: -122.3321 };

// Central-difference half-step (seconds) used to derive `gs` / `track` /
// `vertRate` from the analytic position. Small enough that the chord/arc
// shortfall is under 0.02 % at the fastest orbit this roster produces, large
// enough to stay far from double-precision cancellation.
const DEMO_DIFF_S = 1;

// Hand-authored aircraft. Each entry is chosen to light up a DIFFERENT render
// path, so the demo doubles as a live fixture for the whole flight subsystem —
// see the `note` on each row. Everything is real-world plausible: real ICAO
// type designators (so `aircraftArchetype` resolves a real silhouette), real
// airline ICAO callsign prefixes present in src/airlines.ts (so liveries and
// the flight card's Airline block light up), real speeds and altitudes.
interface DemoFleetMember {
  hex: string;                 // ICAO 24-bit, lowercase. AE0000–AFFFFF for US military.
  callsign: string | null;
  typeCode: string | null;
  category: string | null;     // ADS-B emitter category (archetype FALLBACK only)
  reg: string | null;
  operator: string | null;
  typeDesc: string | null;
  gsKt: number;                // nominal ground speed; the derived value matches to <0.5 %
  distFrac: number;            // orbit radius as a FRACTION of the configured radiusNm
  bearing0Deg: number;         // orbit phase at epoch 0
  dir: 1 | -1;                 // orbit direction (mixed, so it never reads as a carousel)
  altFt: number;
  altAmpFt?: number;           // gentle climb/descent → a real vertRate + trend + pitch
  altPeriodS?: number;
  radialFracAmp?: number;      // radial breathing, fraction of radiusNm → shell compression over TIME
  radialPeriodS?: number;
  squawk?: string;
  military?: boolean;
  interesting?: boolean;
  pia?: boolean;
  ladd?: boolean;
  // Rows the user can switch off without leaving the demo source. Only the
  // emergency aircraft has one: it is the single fleet member with a side
  // effect outside the sky (a persistent `error` row in the Alert Center).
  optional?: 'emergency';
}

// ORDER IS LOAD-BEARING. `fleet` slices from the FRONT, so the highest-value
// coverage is front-loaded and the two DELIBERATELY OUT-OF-RANGE aircraft sit
// at indices 6 and 11 — early enough that even a small fleet still exercises
// the radius filter in `_applyFlights`. Their distance is a MULTIPLE of the
// configured radius (not an absolute nm figure) so they stay outside it at any
// radius setting, exactly as the in-range rows stay inside at any setting.
const DEMO_FLEET: readonly DemoFleetMember[] = [
  // 0 — widebody · United livery · band 5 contrail · operator-on-spine text
  { hex: 'a1b2c3', callsign: 'UAL512', typeCode: 'B77W', category: 'A5',
    reg: 'N2749U', operator: 'United Airlines', typeDesc: 'BOEING 777-300ER',
    gsKt: 470, distFrac: 0.92, bearing0Deg: 35, dir: 1, altFt: 37000 },
  // 1 — narrowbody · Delta livery · band 4
  { hex: 'a2c4e6', callsign: 'DAL1522', typeCode: 'B738', category: 'A3',
    reg: 'N3751B', operator: 'Delta Air Lines', typeDesc: 'BOEING 737-800',
    gsKt: 290, distFrac: 0.66, bearing0Deg: 200, dir: -1, altFt: 14000 },
  // 2 — GA high-wing piston WITH a callsign → the towed BANNER path · band 2
  { hex: 'a5e7c9', callsign: 'N172SP', typeCode: 'C172', category: 'A1',
    reg: 'N172SP', operator: null, typeDesc: 'CESSNA 172 SKYHAWK',
    gsKt: 105, distFrac: 0.22, bearing0Deg: 120, dir: 1, altFt: 3500,
    altAmpFt: 400, altPeriodS: 420 },
  // 3 — helicopter · band 1 (rotor blur + station-keeping bob), low and slow
  { hex: 'a6f8da', callsign: 'N911LF', typeCode: 'EC35', category: 'A7',
    reg: 'N911LF', operator: null, typeDesc: 'AIRBUS H135',
    gsKt: 22, distFrac: 0.10, bearing0Deg: 250, dir: -1, altFt: 1400 },
  // 4 — MILITARY SKIN: typeCode F16 hits MILITARY_SKIN_TYPE_CODES exactly, and
  //     the AE-range hex also trips `usMilitaryHexHeuristic` in the card.
  { hex: 'ae1f2c', callsign: 'VIPER11', typeCode: 'F16', category: 'A6',
    reg: null, operator: null, typeDesc: 'GENERAL DYNAMICS F-16',
    gsKt: 430, distFrac: 0.75, bearing0Deg: 80, dir: 1, altFt: 22000,
    military: true },
  // 5 — EMERGENCY squawk 7700: red beacon at the top of the priority ladder +
  //     the `flight:emerg:` alert lifecycle. Descending, which is what a 7700
  //     usually is. The ONE optional row (see `optional` above).
  { hex: 'a8b1c2', callsign: 'AAL1580', typeCode: 'A320', category: 'A3',
    reg: 'N106US', operator: 'American Airlines', typeDesc: 'AIRBUS A320',
    gsKt: 250, distFrac: 0.35, bearing0Deg: 285, dir: 1, altFt: 7000,
    altAmpFt: 2500, altPeriodS: 900, squawk: '7700', optional: 'emergency' },
  // 6 — OUT OF RANGE (1.6× the radius): proves the `_applyFlights` filter is live.
  { hex: 'ac9203', callsign: 'FDX1290', typeCode: 'B763', category: 'A5',
    reg: 'N178FE', operator: 'FedEx Express', typeDesc: 'BOEING 767-300F',
    gsKt: 450, distFrac: 1.60, bearing0Deg: 220, dir: 1, altFt: 35000 },
  // 7 — PIA privacy address: dimming, identity SUPPRESSION, and the kind:'pia'
  //     livery veto (DCM = FLTPLAN, a privacy pseudo-airline in src/airlines.ts).
  { hex: 'a9c3d4', callsign: 'DCM523', typeCode: 'C68A', category: 'A2',
    reg: null, operator: null, typeDesc: 'CESSNA CITATION LATITUDE',
    gsKt: 220, distFrac: 0.60, bearing0Deg: 340, dir: -1, altFt: 28000,
    pia: true },
  // 8 — RADIAL BREATHING + climb: the only row whose DISTANCE changes over
  //     time, so the shell-compression curve is exercised across u, not just
  //     sampled at one u per aircraft. Southwest livery. Because the angular
  //     rate is constant, the tangential speed scales with the breathing radius
  //     — so this is ALSO the one aircraft that changes SPEED BAND in flight
  //     (220–380 kt ⇒ bands 3→4→5 and back), which is the only live exercise of
  //     the band hysteresis. Both are deliberate.
  { hex: 'a3d5f7', callsign: 'SWA2210', typeCode: 'B38M', category: 'A3',
    reg: 'N8712L', operator: 'Southwest Airlines', typeDesc: 'BOEING 737 MAX 8',
    gsKt: 300, distFrac: 0.45, bearing0Deg: 300, dir: 1, altFt: 9500,
    altAmpFt: 1500, altPeriodS: 600, radialFracAmp: 0.12, radialPeriodS: 900 },
  // 9 — turboprop archetype · band 3 motion lines. Horizon is a REGIONAL, so
  //     like member 13 it deliberately carries no livery colours.
  { hex: 'ab2c81', callsign: 'QXE2405', typeCode: 'DH8D', category: 'A2',
    reg: 'N440QX', operator: 'Horizon Air', typeDesc: 'DE HAVILLAND DASH 8-400',
    gsKt: 230, distFrac: 0.28, bearing0Deg: 155, dir: -1, altFt: 12000 },
  // 10 — MILITARY CALLSIGN WORD (RCH → REACH, the AMC airlift alias) with a
  //      typeCode that is NOT in the skin table: olive tint, generic widebody.
  //      The negative control for member 4's skin, flying in the same fleet.
  { hex: 'ae4b70', callsign: 'RCH431', typeCode: 'C17', category: 'A5',
    reg: null, operator: 'UNITED STATES AIR FORCE', typeDesc: 'BOEING C-17A GLOBEMASTER III',
    gsKt: 320, distFrac: 0.85, bearing0Deg: 160, dir: -1, altFt: 26000,
    military: true },
  // 11 — OUT OF RANGE (2.5× the radius), a second and much farther one.
  { hex: 'ad4415', callsign: 'KLM602', typeCode: 'B789', category: 'A5',
    reg: 'PH-BHA', operator: 'KLM Royal Dutch Airlines', typeDesc: 'BOEING 787-9',
    gsKt: 480, distFrac: 2.50, bearing0Deg: 10, dir: -1, altFt: 38000 },
  // 12 — LADD: privacy dimming + the WHITE beacon, but identity KEPT (the
  //      deliberate PIA/LADD asymmetry — research §4.2).
  { hex: 'aa5e6f', callsign: 'N88XR', typeCode: 'GLF5', category: 'A2',
    reg: 'N88XR', operator: null, typeDesc: 'GULFSTREAM V',
    gsKt: 410, distFrac: 0.50, bearing0Deg: 55, dir: 1, altFt: 39000,
    ladd: true },
  // 13 — `interesting` YELLOW beacon + a REGIONAL carrier, whose livery is its
  //      mainline partner's — so `resolveAirlineLivery` deliberately paints NO
  //      colours and the card shows "operates as" instead. CRJ9 is also the
  //      §3.3 rule: a regional jet with the BIZJET silhouette.
  { hex: 'ab7180', callsign: 'SKW3411', typeCode: 'CRJ9', category: 'A3',
    reg: 'N221SW', operator: 'SkyWest Airlines', typeDesc: 'BOMBARDIER CRJ-900',
    gsKt: 265, distFrac: 0.30, bearing0Deg: 100, dir: -1, altFt: 17000,
    interesting: true },
  // 14 — twin-prop archetype (low wing, two wing-mounted props)
  { hex: 'a4a930', callsign: 'N400KA', typeCode: 'BE20', category: 'A2',
    reg: 'N400KA', operator: null, typeDesc: 'BEECHCRAFT KING AIR 200',
    gsKt: 210, distFrac: 0.18, bearing0Deg: 15, dir: 1, altFt: 11000 },
  // 15 — ga-low archetype (low wing single, T-tail), completing all EIGHT
  //      archetypes across the roster.
  { hex: 'a7091b', callsign: 'N912TS', typeCode: 'PC12', category: 'A1',
    reg: 'N912TS', operator: null, typeDesc: 'PILATUS PC-12',
    gsKt: 250, distFrac: 0.55, bearing0Deg: 240, dir: -1, altFt: 19000 },
];

// Fleet-size bounds. The maximum IS the roster length — there is nothing beyond
// it to generate, and silently repeating aircraft under fresh hexes would make
// the sky read as a bug. The default is the whole roster, because every row
// exists to cover a render path.
export const DEMO_FLEET_MAX = DEMO_FLEET.length;
export const DEMO_FLEET_MIN = 1;
export const DEMO_FLEET_DEFAULT = DEMO_FLEET_MAX;

// Deterministic [0,1) from a (seed, index) pair — the mulberry32 mixing step
// the renderer's `_rndFrom` uses, re-derived here because this module is
// zero-import. Used ONLY to offset orbit phases when the user sets a seed; a
// seed of 0 / absent leaves the roster's authored bearings exactly as written.
function demoRand01(seed: number, index: number): number {
  let a = (Math.imul(seed | 0, 0x9e3779b1) + Math.imul(index + 1, 0x85ebca6b)) | 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// EXACT inverse of `flightBearingDistance`'s equirectangular tangent plane —
// same earth radius, same cosine taken at the ORIGIN latitude — so a point
// placed here at (bearing, distance) reads back as exactly that bearing and
// distance. The whole demo depends on that round trip: `_applyFlights`
// recomputes `distNm` from lat/lon and filters on it.
function demoDestination(
  originLat: number, originLon: number, bearingRad: number, distNm: number,
): { lat: number; lon: number } {
  const d = distNm * NM_M;
  const north = d * Math.cos(bearingRad);
  const east = d * Math.sin(bearingRad);
  const cosLat = Math.cos(originLat * DEG);
  return {
    lat: originLat + north / (EARTH_R_M * DEG),
    // Guard the pole, where a degree of longitude collapses. A demo observer
    // that close to a pole degenerates to a north/south line rather than
    // dividing by ~0 and flinging aircraft off the planet.
    lon: originLon + (Math.abs(cosLat) > 1e-6 ? east / (EARTH_R_M * DEG * cosLat) : 0),
  };
}

// Analytic position of one member at absolute time `tSec`. Everything else —
// ground speed, track, vertical rate — is DERIVED from this by central
// difference, so the reported motion can never disagree with the actual path.
function demoStateAt(
  m: DemoFleetMember, tSec: number, radiusNm: number,
  origin: { lat: number; lon: number }, phaseRad: number,
): { lat: number; lon: number; altFt: number } {
  const baseR = Math.max(0.05, m.distFrac * radiusNm);
  // Angular rate from the NOMINAL ground speed and the BASE radius: a circuit
  // of circumference 2πR flown at `gsKt` knots. Taken from the base radius (not
  // the breathing one) so ω is constant and the orbit stays a clean circuit.
  const omegaPerS = (m.gsKt / baseR) / 3600;
  const theta = m.bearing0Deg * DEG + phaseRad + m.dir * omegaPerS * tSec;
  const r = m.radialFracAmp && m.radialPeriodS
    ? baseR + m.radialFracAmp * radiusNm
        * Math.sin(TWO_PI * tSec / m.radialPeriodS + phaseRad)
    : baseR;
  const alt = m.altAmpFt && m.altPeriodS
    ? m.altFt + m.altAmpFt * Math.sin(TWO_PI * tSec / m.altPeriodS + phaseRad)
    : m.altFt;
  const p = demoDestination(origin.lat, origin.lon, theta, Math.max(0.01, r));
  return { lat: p.lat, lon: p.lon, altFt: alt };
}

// Hand-authored config for the `demo` source. EVERY field is optional;
// `demoFleetSize` / `demoFlightsOrigin` / `sanitizeDemoFlights` own all of the
// defaults + clamps, so nothing else has to know the shape (the
// `DemoWeatherConfig` / `demoWeatherNow` discipline). Lives HERE rather than in
// types.ts because this module is zero-import; types.ts re-exports it, exactly
// as it does for FlightGlowRule.
export interface DemoFlightsConfig {
  // How many roster members to generate. Clamp 1..DEMO_FLEET_MAX (= the roster
  // length); absent = the whole roster. The count is aircraft GENERATED — the
  // two deliberately-distant rows are then dropped by the ordinary radius
  // filter, so the number actually in the sky is smaller.
  fleet?: number;
  // Synthetic observer, used ONLY when no real origin resolves (a calibrated
  // geo fit and a weather location both win — see `Planner.flightsOrigin`).
  // Both must be present and in range or neither is used. Purely relative
  // rendering means this changes nothing about the aircraft; it changes where
  // the ISS is computed to be.
  lat?: number;
  lon?: number;
  // Deterministic rearrangement: rotates each aircraft's circuit by its own
  // fixed amount. 0 / absent = the authored arrangement.
  seed?: number;
  // The emergency (squawk 7700) aircraft. ABSENT = ON. It is the only fleet
  // member with an effect outside the sky — a persistent `error` row in the
  // Alert Center — so it gets an opt-out that does not mean leaving the demo.
  emergency?: boolean;
}

// The synthetic observer. Falls back to DEMO_FLIGHT_ORIGIN unless the config
// supplies a COMPLETE, in-range pair — half a coordinate is not a location.
// NB this is the BOTTOM of `Planner.flightsOrigin`'s ladder: a calibrated geo
// fit or a weather location always wins, so someone with a real home sees the
// synthetic traffic centred on their actual house.
export function demoFlightsOrigin(
  demo?: DemoFlightsConfig | null,
): { lat: number; lon: number } {
  const la = Number(demo?.lat), lo = Number(demo?.lon);
  if (demo && demo.lat != null && demo.lon != null
    && isFinite(la) && isFinite(lo)
    && la >= -90 && la <= 90 && lo >= -180 && lo <= 180) {
    return { lat: la, lon: lo };
  }
  return { lat: DEMO_FLIGHT_ORIGIN.lat, lon: DEMO_FLIGHT_ORIGIN.lon };
}

// How many aircraft to generate, clamped to the roster.
export function demoFleetSize(demo?: DemoFlightsConfig | null): number {
  const n = Number(demo?.fleet);
  if (demo?.fleet == null || !isFinite(n)) return DEMO_FLEET_DEFAULT;
  return Math.max(DEMO_FLEET_MIN, Math.min(DEMO_FLEET_MAX, Math.round(n)));
}

// Normalize a stored / imported demo block, the `setFlights` discipline: clamp
// every number, drop an incomplete coordinate pair, and collapse an
// all-defaults block back to `undefined` so the stored config stays minimal and
// the default path is byte-identical to having no block at all.
export function sanitizeDemoFlights(v: unknown): DemoFlightsConfig | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const o = v as Record<string, unknown>;
  const out: DemoFlightsConfig = {};

  const fleetN = Number(o.fleet);
  if (o.fleet != null && isFinite(fleetN)) {
    const n = Math.max(DEMO_FLEET_MIN, Math.min(DEMO_FLEET_MAX, Math.round(fleetN)));
    if (n !== DEMO_FLEET_DEFAULT) out.fleet = n;
  }

  const la = Number(o.lat), lo = Number(o.lon);
  if (o.lat != null && o.lon != null && isFinite(la) && isFinite(lo)
    && la >= -90 && la <= 90 && lo >= -180 && lo <= 180) {
    out.lat = la; out.lon = lo;
  }

  const seedN = Number(o.seed);
  if (o.seed != null && isFinite(seedN)) {
    const s = Math.trunc(seedN) | 0;
    if (s !== 0) out.seed = s;
  }

  // Absent = ON (the militarySkins / airlineColors idiom): an explicit `true` is
  // redundant and normalizes away; `false` is meaningful and stays.
  if (o.emergency === false) out.emergency = false;

  return Object.keys(out).length ? out : undefined;
}

// THE synthetic feed. Returns FlightPoints in exactly the shape every other
// source's normalizer produces, so the planner hands them to the SAME
// `_applyFlights` (distance / altitude / cap filtering) and every downstream
// consumer — archetypes, liveries, beacons, privacy, speed bands, the label
// plate, the flight card, the alert triggers — is reached by the ordinary path.
//
// `distNm` is deliberately LEFT UNSET: `_applyFlights` recomputes it from
// lat/lon for every source, and setting it here would create a second number
// that could drift from the one the filter and the shell actually use.
export function demoFlightPoints(
  nowMs: number,
  origin: { lat: number; lon: number } | null | undefined,
  radiusNm: number,
  cfg?: DemoFlightsConfig | null,
): FlightPoint[] {
  const o = origin && isFinite(Number(origin.lat)) && isFinite(Number(origin.lon))
    ? { lat: Number(origin.lat), lon: Number(origin.lon) }
    : { lat: DEMO_FLIGHT_ORIGIN.lat, lon: DEMO_FLIGHT_ORIGIN.lon };
  const r = typeof radiusNm === 'number' && isFinite(radiusNm) && radiusNm > 0
    ? radiusNm : FLIGHTS_DEFAULT_RADIUS_NM;
  const t = typeof nowMs === 'number' && isFinite(nowMs) ? nowMs / 1000 : 0;
  const n = demoFleetSize(cfg);
  const seed = typeof cfg?.seed === 'number' && isFinite(cfg.seed) ? cfg.seed | 0 : 0;
  const skipEmergency = cfg?.emergency === false;

  const out: FlightPoint[] = [];
  for (let i = 0; i < n; i++) {
    const m = DEMO_FLEET[i];
    if (m.optional === 'emergency' && skipEmergency) continue;

    // A seed rotates each member's circuit by its own deterministic amount, so
    // two seeded demos differ in arrangement without differing in composition.
    const phaseRad = seed ? demoRand01(seed, i) * TWO_PI : 0;

    const here = demoStateAt(m, t, r, o, phaseRad);
    const before = demoStateAt(m, t - DEMO_DIFF_S, r, o, phaseRad);
    const after = demoStateAt(m, t + DEMO_DIFF_S, r, o, phaseRad);

    // Central difference through the SAME projection the display uses, so the
    // reported track/speed is the true tangent of the drawn path — which is
    // what makes the renderer's dead reckoning land on the next fix instead of
    // fighting it.
    const d = flightBearingDistance(before.lat, before.lon, after.lat, after.lon);
    const dtH = (2 * DEMO_DIFF_S) / 3600;

    out.push({
      hex: m.hex,
      callsign: m.callsign,
      lat: here.lat,
      lon: here.lon,
      altFt: here.altFt,
      gsKt: d.distNm / dtH,
      trackDeg: (d.bearingRad / DEG) % 360,
      vertRateFpm: ((after.altFt - before.altFt) / (2 * DEMO_DIFF_S)) * 60,
      category: m.category,
      seenPosS: 0,
      military: m.military === true,
      reg: m.reg,
      typeCode: m.typeCode,
      typeDesc: m.typeDesc,
      operator: m.operator,
      emergency: null,
      squawk: m.squawk ?? null,
      interesting: m.interesting === true,
      pia: m.pia === true,
      ladd: m.ladd === true,
    });
  }
  return out;
}

// The flight config the HOSTED DEMO seeds into each floorplan it imports
// (src/demo-seed.ts). Every committed demo floorplan is GENERATED by
// scripts/floorplans, which knows nothing about flight tracking, so they all
// ship with the feature off — and in the hosted demo every fetched source is
// structurally unavailable anyway. The synthetic source is the only one that
// can put aircraft in that sky.
//
// A REDUCED fleet on purpose: the published demo runs on whatever device a
// visitor happens to open it with, and eight rows already cover the widebody,
// narrowbody, GA-banner, helicopter, military-skin, emergency, out-of-range and
// privacy paths. Raising it is one number in the settings drawer.
export const DEMO_SEED_FLIGHTS = Object.freeze({
  enabled: true, source: 'demo' as FlightSource, demo: Object.freeze({ fleet: 8 }),
});

// Turn on demo flights in an export envelope on its way into the hosted demo.
// Pure and text-in/text-out so the seeder stays a thin caller and this stays
// testable. Deliberately conservative:
//   • unparseable text is returned VERBATIM (importConfig will report the real
//     error; corrupting it here would only obscure that);
//   • an envelope that ALREADY authored `flights` is left alone, so a future
//     floorplan can opt out or configure its own source and this never fights it;
//   • both envelope shapes are handled — `{diorama:2, store:{…}}` and the
//     legacy bare store.
export function withDemoFlightsEnvelope(envText: string): string {
  if (typeof envText !== 'string' || !envText) return envText;
  try {
    const env = JSON.parse(envText) as Record<string, unknown> | null;
    if (!env || typeof env !== 'object' || Array.isArray(env)) return envText;
    const store = (env.store && typeof env.store === 'object' && !Array.isArray(env.store))
      ? env.store as Record<string, unknown> : env;
    if (!Array.isArray(store.floors)) return envText;          // not a store at all
    if (store.flights !== undefined) return envText;           // authored — leave it
    store.flights = JSON.parse(JSON.stringify(DEMO_SEED_FLIGHTS));
    return JSON.stringify(env);
  } catch {
    return envText;
  }
}
