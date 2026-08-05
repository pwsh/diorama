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
export function flightFieldText(field: string, fp: FlightPoint,
                                ident: string, suppress: boolean): string {
  switch (field) {
    case 'callsign': return ident;
    case 'reg':      return suppress ? '' : (fp.reg ?? '');
    case 'type':     return suppress ? '' : (fp.typeCode ?? '');
    case 'operator': return suppress || !fp.operator ? '' : fp.operator.slice(0, 22);
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
  fp: FlightPoint, fields: string[], privacyDim: boolean,
): { top: string; sub: string } {
  const suppress = flightIdentitySuppressed(fp, privacyDim);
  const badge = flightPrivacyDimmed(fp, privacyDim) ? '🔒 ' : '';
  const ident = badge + flightIdentifier(fp, suppress);
  const parts: string[] = [];
  for (const f of fields) {
    const t = flightFieldText(f, fp, ident, suppress);
    if (t) parts.push(t);
  }
  if (!parts.length) parts.push(ident);
  return { top: parts[0], sub: parts.slice(1).join(' · ') };
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
