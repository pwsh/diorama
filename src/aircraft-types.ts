// ICAO type designator → aircraft ARCHETYPE (the silhouette family a toy model
// should be built from). PURE and deterministic, with ZERO imports — the same
// discipline `flights.ts` keeps, because this module is likewise shared by BOTH
// the app graph and the lazy renderer chunk (the avatars.ts precedent). No
// three.js, no DOM, no network, no clock, no Math.random.
//
// Research: docs/research/flight-fields-models.md §3 (the archetype set, the
// full designator table §3.5, and the category fallback ladder §3.6).
//
// Why 8 archetypes and not 3: the shipped `aircraftModelKind()` (flights.ts)
// branches on the ADS-B emitter `category` ALONE, which cannot see the two
// distinctions that actually change a silhouette — high-wing vs. low-wing GA
// singles (both self-report `A1`) and underwing-pod vs. rear-fuselage-engine
// jets (both self-report `A3`). The `t` (type designator) field, present on
// ~85% of live traffic, resolves both. See §3.3: the Bombardier CRJ family and
// the older Embraer ERJ135/145 share the BIZJET geometry (rear-mounted engines
// + T-tail), NOT the narrowbody's — while the newer E-Jets (E170/175/190/195)
// really are underwing-pod narrowbodies.
export type AircraftArchetype =
  | 'ga-high'      // high wing, single engine (Cessna 172/182/208 …)
  | 'ga-low'       // low wing, single engine (Cherokee, Cirrus, Bonanza, PC-12, TBM …)
  | 'twin-prop'    // low wing, two wing-mounted props (Baron, King Air, Seneca …)
  | 'turboprop'    // HIGH wing, two turboprops, T-tail (ATR, Dash 8, C-130 …)
  | 'narrowbody'   // low swept wing, 2 underwing pods, conventional tail
  | 'widebody'     // same family, bigger, 2 or 4 pods
  | 'bizjet'       // rear-fuselage engines + T-tail (Learjet … and CRJ/ERJ, §3.3)
  | 'heli';        // rotorcraft

// §3.5's full designator table, transcribed grouped-by-archetype. Keys are
// UPPERCASE ICAO type designators exactly as the `t` field carries them.
// Fixture-confirmed entries are noted in the research doc, not repeated here.
export const TYPE_ARCHETYPE: Record<string, AircraftArchetype> = {
  // ── ga-high: high wing, single engine ────────────────────────────────────
  C172: 'ga-high', C152: 'ga-high', C150: 'ga-high', C182: 'ga-high',
  C170: 'ga-high', C180: 'ga-high', C185: 'ga-high', C206: 'ga-high',
  C207: 'ga-high', C208: 'ga-high',   // Caravan — big, but the SHAPE matches (§3.4)
  C210: 'ga-high', P210: 'ga-high', C72R: 'ga-high', C177: 'ga-high',
  PA18: 'ga-high', A188: 'ga-high', MAUL: 'ga-high', M7: 'ga-high',
  KODI: 'ga-high',

  // ── ga-low: low wing, single engine ──────────────────────────────────────
  P28A: 'ga-low', P28B: 'ga-low', P28R: 'ga-low', PA28: 'ga-low',
  P46T: 'ga-low', M500: 'ga-low', M600: 'ga-low',     // Malibu/Meridian/M-series (§3.4)
  SR20: 'ga-low', SR22: 'ga-low',
  BE33: 'ga-low', BE35: 'ga-low', BE36: 'ga-low',     // Bonanza
  M20P: 'ga-low', M20T: 'ga-low',                     // Mooney
  DA40: 'ga-low',
  PC12: 'ga-low',                                     // LOW wing + T-tail, not a Caravan (§3.4)
  TBM7: 'ga-low', TBM8: 'ga-low', TBM9: 'ga-low',
  // Van's RV homebuilts — §3.5 writes these as `RV\d`; enumerated here so the
  // table stays a plain lookup (the resolver also prefix-matches, see below).
  RV3: 'ga-low', RV4: 'ga-low', RV6: 'ga-low', RV7: 'ga-low', RV8: 'ga-low',
  RV9: 'ga-low', RV10: 'ga-low', RV12: 'ga-low', RV14: 'ga-low',

  // ── twin-prop: low wing, two wing-mounted props ──────────────────────────
  PA34: 'twin-prop', BE58: 'twin-prop', BE55: 'twin-prop', DA42: 'twin-prop',
  BE9L: 'twin-prop', BE20: 'twin-prop', B350: 'twin-prop',   // King Air — LOW wing (§3.4)
  SF34: 'twin-prop',                                          // Saab 340 (§3.4, wing position UNVERIFIED)
  SW4: 'twin-prop',                                           // Metroliner
  PAY2: 'twin-prop', PAY3: 'twin-prop',
  C310: 'twin-prop', C340: 'twin-prop', C414: 'twin-prop', C421: 'twin-prop',
  BE76: 'twin-prop',

  // ── turboprop: HIGH wing, two turboprops, T-tail ─────────────────────────
  AT43: 'turboprop', AT44: 'turboprop', AT45: 'turboprop',
  AT72: 'turboprop', AT75: 'turboprop', AT76: 'turboprop',
  DH8A: 'turboprop', DH8B: 'turboprop', DH8C: 'turboprop', DH8D: 'turboprop',
  SB20: 'turboprop',
  C130: 'turboprop', C30J: 'turboprop',   // Hercules — explicit shape compromise (§3.4)
  A400: 'turboprop',                      // A400M Atlas — same compromise

  // ── narrowbody: low swept wing, 2 underwing pods, conventional tail ──────
  A318: 'narrowbody', A319: 'narrowbody', A320: 'narrowbody', A321: 'narrowbody',
  A20N: 'narrowbody', A21N: 'narrowbody',
  B737: 'narrowbody', B738: 'narrowbody', B739: 'narrowbody',
  B37M: 'narrowbody', B38M: 'narrowbody', B39M: 'narrowbody',
  BCS1: 'narrowbody', BCS3: 'narrowbody',                    // A220
  B752: 'narrowbody', B753: 'narrowbody',                    // 757 — narrowbody DESPITE category A4 (§0.7)
  E170: 'narrowbody', E175: 'narrowbody', E190: 'narrowbody', E195: 'narrowbody',
  E75L: 'narrowbody', E75S: 'narrowbody', E290: 'narrowbody', E295: 'narrowbody',

  // ── widebody: 2 or 4 underwing pods, big ─────────────────────────────────
  A332: 'widebody', A333: 'widebody', A339: 'widebody',
  A343: 'widebody', A345: 'widebody', A346: 'widebody',
  A359: 'widebody', A35K: 'widebody',
  A388: 'widebody',                                          // A380 — biggest scale in the bucket (§3.4)
  B744: 'widebody', B748: 'widebody',
  B763: 'widebody', B764: 'widebody',
  B772: 'widebody', B77L: 'widebody', B77W: 'widebody',
  B788: 'widebody', B789: 'widebody', B78X: 'widebody',
  // Large military JET transports/tankers — explicit shape compromise (§3.4):
  // the turboprop ones (C130/A400) live in `turboprop` above.
  C17: 'widebody', C5M: 'widebody', K35R: 'widebody',

  // ── bizjet: rear-fuselage engines + T-tail — INCLUDING CRJ/ERJ (§3.3) ────
  CRJ1: 'bizjet', CRJ2: 'bizjet', CRJ7: 'bizjet', CRJ9: 'bizjet',
  E135: 'bizjet', E145: 'bizjet', E35L: 'bizjet',
  C25A: 'bizjet', C25B: 'bizjet', C525: 'bizjet', C56X: 'bizjet',
  C680: 'bizjet', C68A: 'bizjet', C700: 'bizjet',
  CL30: 'bizjet', CL35: 'bizjet', CL60: 'bizjet',
  GLF4: 'bizjet', GLF5: 'bizjet', GLF6: 'bizjet',
  G280: 'bizjet', GA5C: 'bizjet', GA6C: 'bizjet',
  LJ35: 'bizjet', LJ45: 'bizjet', LJ60: 'bizjet',
  F2TH: 'bizjet', FA7X: 'bizjet', FA8X: 'bizjet',
  H25B: 'bizjet',
  E50P: 'bizjet', E55P: 'bizjet',                            // Phenom 100/300
  GL5T: 'bizjet', GL7T: 'bizjet',                            // Global 5000/7500
  // Fighters: no archetype fits (§3.4) — bizjet is the nearest small-fast-jet
  // shape, and `category:'A6'` catches the rest in the ladder below.
  F15: 'bizjet', F16: 'bizjet', F18: 'bizjet', F35: 'bizjet',

  // ── heli ─────────────────────────────────────────────────────────────────
  R22: 'heli', R44: 'heli', R66: 'heli',
  B06: 'heli', B407: 'heli', B429: 'heli', H500: 'heli',
  EC30: 'heli', EC35: 'heli', EC45: 'heli', EC75: 'heli',
  H145: 'heli', H175: 'heli',
  AS50: 'heli', AS55: 'heli', AS65: 'heli',
  A139: 'heli',
  S76: 'heli', S92: 'heli',
  UH60: 'heli', H60: 'heli', MH60: 'heli',
  CH47: 'heli',
};

// Resolve an archetype from the type designator, falling back to the ADS-B
// emitter category ladder (§3.6) when `t` is absent or unknown — which is
// roughly 1 in 7 live aircraft (§0.6), not an edge case.
//
// NEVER throws and always returns an archetype: a display pipeline must always
// have something to draw. Callers pre-filter the non-aircraft categories
// (`normalizeAircraftList` drops `C*`/`B3` outright, §0.8), but the ladder
// still handles them defensively rather than trusting that.
export function aircraftArchetype(
  typeCode: string | null | undefined,
  category: string | null | undefined,
): AircraftArchetype {
  const t = typeof typeCode === 'string' ? typeCode.trim().toUpperCase() : '';
  if (t) {
    const hit = TYPE_ARCHETYPE[t];
    if (hit) return hit;
    // Van's RV homebuilts: the family is open-ended (`RV\d` in §3.5) — a
    // designator the enumerated keys missed still resolves by prefix.
    if (/^RV\d/.test(t)) return 'ga-low';
  }

  const c = typeof category === 'string' ? category.trim().toUpperCase() : '';
  // §3.6, in order. Note A4 is narrowbody, NEVER widebody — the 757's
  // "high vortex large" self-report is the textbook (fixture-confirmed) case.
  if (c === 'A7') return 'heli';
  if (c.startsWith('C') || c === 'B3') return 'narrowbody';  // not an aircraft; caller should have skipped it
  if (c === 'A5') return 'widebody';
  if (c === 'A4') return 'narrowbody';
  if (c === 'A3') return 'narrowbody';
  if (c === 'A2') return 'twin-prop';
  if (c === 'A1') return 'ga-high';
  if (c === 'A6') return 'bizjet';
  // No category at all (TIS-B ghost tracks) → the commonest thing overhead,
  // exactly what the shipped 3-way fallback already does.
  return 'narrowbody';
}

// The 8 archetypes collapsed back onto the 3 toy models the CURRENT renderer
// chunk builds (`aircraftModelKind` in flights.ts). Kept here — beside the
// table that produces the archetypes — so a stale renderer chunk, or any
// consumer that only has the three bodies, has ONE documented mapping instead
// of re-deriving it.
export function legacyModelKind(a: AircraftArchetype): 'prop' | 'jet' | 'heli' {
  if (a === 'heli') return 'heli';
  if (a === 'ga-high' || a === 'ga-low' || a === 'twin-prop' || a === 'turboprop') return 'prop';
  return 'jet';
}
