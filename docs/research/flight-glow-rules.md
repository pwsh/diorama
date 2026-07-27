# User-Configurable Flight Glow Rules — Build-Ready Research

Status: research complete, not yet implemented. Extends the shipped Flight &
Satellite Tracking feature (`docs/research/flight-tracking.md`, "Flight &
satellite tracking (roadmap P4)" in `CLAUDE.md`) with a **user-authored rule
list** that assigns a glow color pattern to matching aircraft — on top of the
existing hard-coded status beacon (emergency/interesting/military/LADD).
Written in the same voice as `docs/research/flight-tracking.md` /
`sirens-beacons.md`: concrete field names, exact formulas, and file-level
integration points, not open design questions.

---

## Pinned recommendation summary

**Pattern enum** (7 values — the user's 4 named patterns + 2 well-justified
additions from real aircraft-lighting prior art, §1):

| Pattern | Reads as | Rate | 2 colors map to |
|---|---|---|---|
| `none` | glow off | — | n/a (disables, does not just "not match") |
| `solid` | steady-on | — | A = bead, B = halo (static two-tone, no B ⇒ halo repeats A) |
| `flash` | single sharp pop (today's shipped beacon) | 1.2 Hz | alternate whole-cycles: A on odd, B on even |
| `strobe` | aviation double-flash ("chirp-chirp … chirp-chirp") | 1.0 Hz twin-pop | first pop = A, second pop = B |
| `rotate` | rotating beacon sweep (brightness breathes, never fully dark) | 0.9 Hz | color eases A→B→A in lockstep with brightness |
| `fade` | slow breathing glow | 0.2 Hz (5 s period) | smooth crossfade A→B→A |
| `alternate` | hard color swap, constant brightness (wig-wag) | 0.8 s hold each | hard-swap A/B, no easing |

All 7 render through the **existing bead-sphere + additive glow-sprite pair**
(`_syncFlightBeacon`/`_removeFlightBeacon` in `three-renderer.ts`) — no new
geometry, no new texture. Only the opacity/color computed per frame changes.
Exact formulas: §2.

**Matching fields** (AND within one rule; unset field = wildcard "any"):
`operator`, `typeCode`, `typeDesc`, `reg`, `callsign`, `category` (wildcard
strings, §3), `minSpeedKt`/`maxSpeedKt`, `minAltFt`/`maxAltFt`,
`minDistNm`/`maxDistNm` (numeric ranges), `military`/`interesting`/`ladd`/`pia`
(tri-state booleans). Rule list is **first-match-wins**, exactly the
`evalRules`/`ValueRule` idiom already shipped in `src/value-rules.ts`.

**Wildcard semantics** (§3.1): one rule for every string field. `*` = any run
of characters, `?` = exactly one character, case-insensitive. If the user's
pattern contains **neither** `*` nor `?`, it is auto-wrapped as `*pattern*`
(friendly substring default); if it contains either, it is matched
**anchored** start-to-end (precise glob). Compiled by hand-walking the string
(never `new RegExp(raw)` on unescaped input) — mirrors the existing regex
`ValueRule` op's try/catch discipline plus the mvt/mqtt "never throws" rule.

**Precedence** (§4): `isEmergency(fp)` **always** wins, unconditionally,
before any user rule is even evaluated. Otherwise the first matching enabled
rule **replaces** the whole default beacon resolution (pattern **and**
colors); no match falls through to today's unmodified default ladder
(interesting > military > LADD > none). `pattern: 'none'` on a matched rule
is a legal, supported way to silence the glow for a class of aircraft.

**Schema** (§6): `FlightsConfig.glowRules?: FlightGlowRule[]`, cap 30 rules,
sanitized in `Planner.setFlights` exactly where `labelFields`/`modelScale`/
watch-list are sanitized today. New pure module surface lives entirely in
`src/flights.ts` (zero-import, shared by app graph + lazy renderer chunk —
the established discipline for this file).

**Performance** (§7): matching runs at **poll cadence** (already how
`_syncFlightBeacon` is invoked, once per `_applyFlightFix` per aircraft per
poll — 8 s default), never per animation frame. ≤50 aircraft × ≤30 rules ×
~15 field checks per poll ≈ trivial. Per-frame work (glow animation) stays
zero-allocation: one persistent phase accumulator + 3 persistent `THREE.Color`
scratch objects per rig, mutated in place — the same idiom `rig.beaconPhase`
already uses.

---

## 1. Real-world aircraft lighting vocabulary

Sources: [Anti-collision light (Wikipedia)](https://en.wikipedia.org/wiki/Anti-collision_light),
[Simple Flying — anti-collision light types](https://simpleflying.com/beacon-strobe-lights-answer/),
[Pilot Institute — airplane lights](https://pilotinstitute.com/airplane-lights/),
[Kitplanes — "Two Flash or Not Two Flash"](https://www.kitplanes.com/two-flash-or-not-two-flash/),
plus several aviation-lighting patents cross-checked for frequency figures
(USPTO 11260989, 7079041 — LED beacon/strobe frequency claims).

Five real fixture types, and how each reads as a **pattern** at toy-model
scale:

1. **Rotating beacon** — a red (sometimes amber) lamp on the top and/or
   bottom of the fuselage, behind a rotating lens/reflector (older aircraft)
   or an LED ring that fake-rotates electronically (modern retrofits).
   **40–45 rev/min**, and because most beacons carry **two lenses 180° apart**,
   that's **80–90 apparent flashes/min ≈ 1.3–1.5 Hz** of brightness modulation
   as *seen by a ground observer* — but critically, a rotating beacon does
   **not** go fully dark between pulses the way a strobe does; the lens keeps
   scattering some light through the whole revolution, so it reads as a
   **breathing sweep**, not an on/off pop. This is the key visual
   discriminator from `flash`/`strobe` (§2's `rotate` formula never reaches
   zero).
2. **Anti-collision strobes** — bright white flashes at the wingtips and
   tail, the fixture most modern jets have **replaced the rotating beacon
   with** (no moving parts, longer service life, higher output). Documented
   rate: **40–100 flashes/min**, most sources converging on **~60–70/min ≈
   1.0–1.2 Hz**. Distinctively, wingtip strobes commonly **double-flash** —
   two very tight pulses back-to-back, then a long dark gap, repeating about
   once per second (Airbus wingtip strobes flash twice per cycle while the
   tail strobe flashes once — the "two flash" convention Kitplanes discusses
   as a homebuilder wiring choice). This is the aviation-authentic pattern the
   research brief calls `strobe`, distinct from a plain single `flash`.
3. **Steady navigation/position lights** — red on the left (port) wingtip,
   green on the right (starboard), white on the tail — **always on** while
   the aircraft operates, never flashing. This is `solid`.
4. **Landing lights** — very bright, forward-facing, steady white, used only
   near the ground. Not a distinct pattern from `solid` at toy-model scale
   (no directionality worth modeling); folded into `solid`'s "bright, no
   animation" character.
5. **Logo light** — a steady white spot illuminating the tail livery/logo at
   night. Also `solid` in character; not worth a separate pattern.

None of the five real fixtures **breathe slowly** (multi-second fade) or
**hard-swap two colors** — those two (`fade`, `alternate`) are decorative
additions with real-world analogs elsewhere (obstruction-light slow fades on
towers; automotive/emergency-vehicle "wig-wag" alternating headlights), added
because the brief explicitly asks for "fade in/out" and for 2-color patterns
to have a genuine two-color use beyond a strobe's alternation. They are
included in the pinned set as **decorative, not aviation-literal** — flagged
as such in the UI copy (mirroring the neighborhood overlay's "deliberately not
to scale" honesty precedent already established in this codebase for the
flight-shell compression).

**Frequency choices are not arbitrary**: `flash` reuses the EXACT existing
`FLIGHT_BEACON_HZ = 1.2` (three-renderer.ts:717) constant, which already sits
inside the real 55–65/min strobe band — no regression risk, and the existing
sharp-cubic envelope (`three-renderer.ts:13452-13460`) is kept verbatim as
`flash`'s formula. `strobe`'s 1.0 Hz twin-pop is the double-flash-per-second
reading the Kitplanes/Quora sources describe. `rotate`'s 0.9 Hz sits inside
the 80–90/min beacon-flash band but is expressed as a **never-dark** envelope
(the physical distinguisher, above). `fade` and `alternate` have no aviation
source — their rates (5 s breathing period, 0.8 s color hold) were picked
purely for legibility at the existing camera distances (fast enough to
notice within a few seconds of looking, slow enough to read as "breathing"/
"swapping" rather than "flashing").

---

## 2. Pattern math for the renderer

One pure function, `flightGlowFrame(pattern, tSec) → { alpha, mix }`, added to
`src/flights.ts` (zero-import, zero-alloc, deterministic — the module's
existing discipline; `tSec` is a **per-rig accumulated phase**, exactly how
`rig.beaconPhase` is already advanced in `_advanceFlights`:
`rig.beaconPhase = (rig.beaconPhase + dt * HZ * 2π) % 2π` — never read from an
absolute clock, so a material rebuild triggered by a rule/color change never
"pops" the animation; only spawning a genuinely new rig starts phase at 0).

`alpha` is the bead/glow opacity multiplier (0..1); `mix` is a 0..1 crossfade
weight toward `colorB` (`0` = pure `colorA`). Callers derive the displayed
color via `THREE.Color.lerpColors(colorA, colorB, mix)` (3D, in-place, zero
alloc) or the new pure `lerpHexColor(a, b, mix)` (2D, string in/out).

```ts
export type FlightGlowPattern =
  'none' | 'solid' | 'flash' | 'strobe' | 'rotate' | 'fade' | 'alternate';

export interface FlightGlowFrame { alpha: number; mix: number; }

const TWO_PI = Math.PI * 2;

export function flightGlowFrame(pattern: FlightGlowPattern, tSec: number): FlightGlowFrame {
  switch (pattern) {
    case 'solid':
      return { alpha: 1, mix: 0 };   // §2 note: solid's 2nd color is NOT a mix — see below

    case 'flash': {                  // reuses the EXISTING shipped beacon envelope verbatim
      const F = 1.2;                 // FLIGHT_BEACON_HZ, unchanged
      const s = Math.max(0, Math.sin(TWO_PI * F * tSec));
      const cycle = Math.floor(F * tSec) % 2;      // whole cycles alternate color
      return { alpha: 0.28 + 0.72 * s ** 3, mix: cycle };
    }

    case 'strobe': {                 // aviation double-flash: two narrow pops per second
      const F = 1.0, GAP = 0.12, WIDTH = 0.05;     // GAP/WIDTH are cycle FRACTIONS
      const phase = ((F * tSec) % 1 + 1) % 1;
      const pop = (center: number) => {
        let d = Math.abs(phase - center);
        d = Math.min(d, 1 - d);                    // wrap around the cycle
        return d >= WIDTH ? 0 : Math.cos((d / WIDTH) * (Math.PI / 2)) ** 2;
      };
      const a = pop(0), b = pop(GAP);
      return { alpha: 0.15 + 0.85 * Math.max(a, b), mix: b > a ? 1 : 0 };
    }

    case 'rotate': {                 // rotating beacon sweep — NEVER fully dark
      const F = 0.9;
      const w = 0.5 + 0.5 * Math.cos(TWO_PI * F * tSec);   // 0..1
      return { alpha: 0.35 + 0.65 * w, mix: 1 - w };       // color eases with brightness
    }

    case 'fade': {                   // slow smooth breathe, no sharpening
      const F = 0.2;                 // 5 s period
      const w = 0.5 + 0.5 * Math.sin(TWO_PI * F * tSec);
      return { alpha: 0.15 + 0.85 * w, mix: w };
    }

    case 'alternate': {               // hard color swap, constant brightness
      const T = 0.8;                  // seconds held per color
      return { alpha: 1, mix: Math.floor(tSec / T) % 2 };
    }

    case 'none':
    default:
      return { alpha: 0, mix: 0 };
  }
}
```

**`solid`'s 2-color exception**: every other pattern has a time axis to
crossfade over; `solid` doesn't. Its second color is used differently — the
bead (core) stays `colorA`, the glow-sprite **halo** is tinted `colorB` (or
`colorA` again when `colorB` is unset) — a static two-tone look, not an
animation. This is the one place a caller does **not** call
`lerpColors(A, B, mix)`; it assigns `colorA` to the bead material and
`colorB ?? colorA` to the glow-sprite material directly, once, at rebuild.

**Rotating beacon renderer options considered** (per the research brief's
(a)/(b)/(c)):
- **(a) glow-sprite opacity follows a rotating-lobe function — RECOMMENDED.**
  Reuses the existing bead+glow objects verbatim; zero new geometry, zero new
  texture, zero per-frame allocation beyond the existing phase accumulator.
  The `rotate` formula above is exactly this, generalized to also crossfade
  color (a stylized abstraction: "the lens tint appears to rotate with the
  brightness" — not literally physically accurate, but reads convincingly at
  toy-model scale and costs nothing extra).
- **(b) a small emissive bead orbiting the model** — rejected for v1. The
  existing beacon bead is a 46 mm sphere (`three-renderer.ts:12660`); at the
  camera distances this feature operates at (aircraft already read as a few
  screen-pixels wide for rim traffic, per `flights.ts`'s own "shell is
  deliberately not to scale" header), a bead orbiting at a small radius would
  be sub-pixel and invisible most of the time — worse legibility than (a) for
  more code (extra `Object3D`, per-rig orbit-angle state, still needs the
  same phase-continuity care). Note it as a possible future flourish, not the
  v1 recommendation.
- **(c) sprite rotation of an asymmetric texture** — rejected. `THREE.Sprite`
  always faces the camera; rotating it about its own view-axis just spins a
  flat glyph face-on toward the viewer, which does not read as "a beam
  sweeping past" (a real rotating beacon's directionality is only meaningful
  in 3D around the aircraft, not in 2D screen-space around the sprite's own
  normal). It would look like a spinning pinwheel, not a sweeping light.

---

## 3. Matching criteria design

### 3.1 Wildcard semantics — one rule for every string field

Every string field (`operator`, `typeCode`, `typeDesc`, `reg`, `callsign`,
`category`) uses the **same** case-insensitive matcher:

- `*` matches any run of characters (including empty).
- `?` matches exactly one character.
- If the pattern contains **neither** `*` nor `?`, it is implicitly treated
  as `*pattern*` — a friendly **substring** default, so a user typing
  `Southwest` matches the operator string `"Southwest Airlines Co."` without
  needing to know to wrap it.
- If the pattern contains **either**, it is matched **anchored**
  (`^pattern$` after wildcard expansion) — precise control for power users
  (`SWA*` matches only callsigns starting with `SWA`; `N*` matches only
  US-registered aircraft; `B73?` matches `B737`/`B738`/`B739` but not
  `B73` alone or `B7378` — `?` is exactly one character).

**Why hybrid, not pure substring (ADSBExchange highlight boxes) or pure regex
(tar1090)**: tar1090 exposes raw JS regex (`filterType=B738` structured, but
family matching is real regex: `filterCallSign=^(UAL|DAL)`,
`^(?!(A32.|B73.))` for exclusions) — precise but requires regex literacy
from every user, and a hand-typed regex is a genuine footgun (a small typo
like an unescaped `.` silently over-matches; a pathological pattern can hang
on catastrophic backtracking). FlightRadar24's alert UI goes the opposite
way — dedicated pickers per field (airline dropdown, aircraft-type dropdown,
registration text box), no wildcard syntax exposed at all, which is safe but
inflexible (can't express "any Boeing 737 variant" without enumerating every
`typeCode`). The hybrid (implicit substring for plain text, explicit
anchored glob when the user opts in with `*`/`?`) gets tar1090's flexibility
for the fields that benefit from it (`typeCode` family matching, `reg`/
`callsign` prefix matching by carrier or country) without requiring regex
knowledge for the common case (typing an airline name), and it fully replaces
regex with a controlled two-character wildcard vocabulary — safe to compile
without ever handing user input straight to `new RegExp()`.

**Anchored, not substring, once a wildcard is present** — because `typeCode`/
`reg`/`callsign`/`category` are short, structured codes where a bare
substring match would produce **false positives that are hard to predict**:
an unanchored substring search for `"32"` would match `A320`, `A321`,
`A322`, but also (if typed against `typeDesc`) `"Airbus A320neo"` *and*
`"Douglas DC-3-2"` *and* any registration containing "32" anywhere. Anchoring
by default once the user is clearly building a pattern (they typed a
wildcard character) keeps behavior predictable: `A32*` means "starts with
A32", not "contains 32 anywhere."

### 3.2 Compilation (never `new RegExp(raw)`)

Hand-walk the pattern, translating only `*`→`.*` and `?`→`.`, escaping every
other character that is a regex metacharacter — never pass the user's raw
string into `RegExp` unescaped (the `ValueRule` `'regex'` op's `try/catch`
precedent in `src/value-rules.ts` is a *different* discipline — that op is
explicitly "the user typed real regex, on their own risk, wrapped so it
never throws." This feature must not silently become a second real-regex
surface — a user pasting `"AAL.*"` intending a literal string with `.`
shouldn't get regex behavior by accident):

```ts
const _wcCache = new Map<string, RegExp | null>();

function compileWildcard(pattern: string): RegExp | null {
  const key = pattern.toLowerCase();
  const hit = _wcCache.get(key);
  if (hit !== undefined) return hit;
  let out = '', hasWildcard = false;
  for (const ch of key) {
    if (ch === '*') { out += '.*'; hasWildcard = true; }
    else if (ch === '?') { out += '.'; hasWildcard = true; }
    else out += ch.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  }
  const body = hasWildcard ? out : `.*${out}.*`;
  let re: RegExp | null;
  try { re = new RegExp(`^${body}$`, 'i'); } catch { re = null; }   // never throws upstream
  _wcCache.set(key, re);
  return re;
}
```

The cache is a module-level `Map` keyed by the raw pattern string, bounded
implicitly by the rule cap (≤30 patterns per field across ≤30 rules) — cheap
insurance, not load-bearing (§7 shows the uncached cost is already trivial).

### 3.3 Numeric & boolean criteria

`{minSpeedKt?, maxSpeedKt?, minAltFt?, maxAltFt?, minDistNm?, maxDistNm?}` —
each pair independent (either bound alone = open-ended threshold, both = a
range), mirroring `FlightsConfig.minAltFt`/`maxAltFt`'s existing shape (so
the mental model — and the sanitizer's min/max swap-if-inverted rule — is
already established in this codebase, not invented new). A `null` live field
(`fp.gsKt` can be `null` when the source doesn't report ground speed) makes a
speed criterion **not match** rather than silently passing — consistent with
`ValueRule`'s NaN-never-matches numeric-op discipline.

`{military?, interesting?, ladd?, pia?, emergency?}` — tri-state: `undefined`
= don't care, `true`/`false` = must equal. Multiple set fields on one rule
are **AND**ed (all must hold); an empty `criteria: {}` object matches every
aircraft — a legitimate way to author a catch-all "default glow for anything
else" rule at the end of the list.

### 3.4 Prior-art survey (brief)

- **tar1090 / ADSBExchange** (same lineage — ADSBX's map is tar1090-derived):
  real JS regex on `filterCallSign`/`filterType`/`filterDescription`, plus
  `filterDbFlag` for the exact military/PIA/LADD bits this app's
  `dbFlags`-derived booleans already surface. Dot = wildcard-one-char is the
  convention `?` mirrors here (chosen over `.` to avoid colliding with actual
  literal dots in e.g. registrations). No altitude/speed/distance range UI —
  those exist as separate map-level filter controls, not part of the
  highlight-pattern syntax. ([README-query.md](https://github.com/wiedehopf/tar1090/blob/master/README-query.md), [ADSBExchange Map Help](https://support.adsbexchange.com/hc/en-us/articles/44653064937741-Map-Help))
- **FlightRadar24 custom alerts**: trigger on flight number/callsign,
  registration, airline, **or** aircraft type (one primary trigger), then AND
  additional conditions (altitude, destination). Airline filtering
  distinguishes "painted as" vs "operating as" — a livery/operator
  distinction this feature's flat `operator` string field does not attempt to
  split (the `ownOp` field the aggregator provides is a single string; no
  livery data exists in the feed). Category filters (passenger/cargo/
  military) and squawk-based emergency filtering (7700/7600) are built in —
  this feature's `military`/`emergency` booleans are the direct analog.
  ([FlightRadar24 alerts tutorial](https://www.flightradar24.com/blog/tutorial/tutorial-adding-custom-alerts-android/))
- **Takeaway**: no surveyed tool combines free-text wildcard fields *and* a
  first-match-wins ordered rule list *and* a visual pattern/color assignment
  — this feature's shape (closest to `value-rules.ts`'s `evalRules`, applied
  to a richer multi-field criteria object instead of one entity's raw state)
  has no direct precedent to copy; the wildcard *syntax* borrows tar1090's
  vocabulary, the *field set* borrows FlightRadar24's alert trigger list, and
  the *rule-list mechanics* borrow this codebase's own `ValueRule` engine.

---

## 4. Interaction with the existing status beacons

**Precedence, three tiers, evaluated in this order:**

1. **`isEmergency(fp)` — always wins, unconditionally, before any rule runs.**
   A 7500/7600/7700 squawk or an `emergency` attribute is safety-relevant
   information; a decorative preference must never be able to suppress or
   recolor it, even by accident (e.g., a rule "military → dim green" that
   happens to also match a military aircraft that has just squawked 7700).
   This mirrors the existing `_flightBeaconColor`'s own ordering (emergency
   is already first in that ladder) — this feature does not touch that
   check, it only extends what happens **after** it returns false.
2. **First matching enabled user rule — REPLACES the whole default
   resolution.** Not layered, not blended: the matched rule's `pattern` +
   `colorA`/`colorB` become the aircraft's entire glow, full stop. Rationale:
   the user configured this rule specifically because the default treatment
   (interesting/military/LADD/none) wasn't what they wanted for this class of
   aircraft — replacing keeps the result unambiguous and matches the
   established `evalRules` semantics (`ValueRule` returns exactly the matched
   rule's fields, never merges across rules).
3. **No rule matches — fall through to today's UNCHANGED default**:
   `interesting > military > ladd > none` (`FLIGHT_BEACON_INTERESTING`
   `0xffd400` / `FLIGHT_BEACON_MILITARY` `0x2ee56a` / `FLIGHT_BEACON_LADD`
   `0xf2f6fb`, all `flash` pattern at 1.2 Hz — exactly as shipped). A fresh
   install with zero configured rules is **byte-for-byte** identical to
   today's behavior.

**`pattern: 'none'` is a legal, recommended rule outcome.** Yes — allow it.
It costs nothing extra (`'none'` is already in the same enum as the other 6),
and it gives a real, useful escape hatch: e.g. a user who lives near a
regional airport wants to mute the default white LADD beacon for a specific
corporate operator they recognize and don't want flagged as "privacy
program" every time it flies over ("`operator = "Acme Corp*"` → `none`").
Without it, the only way to quiet a class of aircraft would be to turn off
status beacons *entirely* (`beacons: false`), which throws away the default
treatment for everything else too.

**Honesty note — an `emergency: true` criterion is unreachable in v1.**
Because tier 1 intercepts every emergency aircraft before the rule list is
even consulted, a rule that sets `criteria.emergency = true` can never fire
(harmless — it simply never matches, same as a `ValueRule` whose threshold
never crosses). The field is kept in the schema anyway for forward
compatibility (a future revision might let a rule override even the
emergency treatment, an explicit product decision this doc deliberately does
not make) and because omitting it from `FlightGlowCriteria` while allowing
`military`/`interesting`/`ladd`/`pia` would look like an inconsistent gap
rather than a deliberate one. The sanitizer does **not** need to special-case
it (an unreachable-but-well-formed criterion is not an error) — but the
settings UI should show a small inline hint ("aircraft squawking an
emergency always show the red emergency beacon, regardless of this
condition") the same way `docs/research/neighborhood-openfreemap.md`'s
"most OSM buildings carry no height data" hint sets the precedent for
proactive UI honesty about a limitation.

**Should the master `beacons` toggle also gate user rules?** Yes — reuse
`FlightsConfig.beacons !== false` as the single gate for **all** glow,
default or user-ruled. Turning off "Status beacons" in Settings ▸ Flight
tracking means no glow at all, full stop; this avoids a confusing
in-between state ("I turned off beacons but my custom rules still glow") and
needs no new config field.

---

## 5. 2D mapping

`drawFlights` (canvas-render.ts) redraws every animation frame from
`p.flightsNow` with **no persistent per-aircraft object** (unlike 3D's `rig`),
so `flightBeaconColor`/`flightBeaconAlpha` are already recomputed every frame
today — this feature keeps that shape, just widening what gets recomputed.
`performance.now()/1000` is the time source (already used for the existing
`beat` calc at canvas-render.ts:435) fed as `tSec` into the SAME
`flightGlowFrame(pattern, tSec)` pure function 3D uses — one formula, two
call sites, exactly the documented `flightBeaconColor`/`_flightBeaconColor`
"keep the two in step" pairing already commented in both files.

Per pattern, drawn as the existing single stroked ring (canvas-render.ts
~468-478) unless noted:

- **`none`** — draw nothing (today's `bc == null` branch, unchanged).
- **`solid`** — ring alpha constant ~0.6, stroke `colorA`. If `colorB` set,
  draw a **second, slightly larger** ring in `colorB` at lower alpha
  (~0.35) just outside the first — the 2D analog of "bead core + halo",
  reusing the exact same `ctx.arc` call with a bigger radius, no new drawing
  primitive.
- **`flash`** — identical shape to today's pulsing ring (the existing
  `beaconAlpha` formula IS `flightGlowFrame('flash', t).alpha`, unchanged
  numerically), stroke color alternates `colorA`/`colorB` by whole cycle via
  `.mix`.
- **`strobe`** — same ring, alpha from the twin-pop envelope; stroke color
  picks `colorA` during the first pop, `colorB` during the second (`mix`
  rounds to 0/1 already, so no color-lerp math needed here — a plain ternary
  is enough since strobe's `mix` is binary by construction).
- **`rotate`** / **`fade`** — ring alpha from the respective envelope; stroke
  color from a new tiny pure helper `lerpHexColor(colorA, colorB, mix)`
  (linear RGB lerp on parsed hex triples, returns a hex string) — added to
  `flights.ts` rather than reusing `geometry.ts`'s `lighten`/`hexToRgba`
  because `flights.ts` is zero-import by design and must not reach into
  `geometry.ts`; a ~10-line self-contained hex parser is cheap and keeps the
  module's isolation.
- **`alternate`** — ring alpha constant ~0.6 (no breathing), stroke color
  hard-swaps `colorA`/`colorB` per `.mix` (0 or 1, no lerp).

No new 2D primitive is introduced (still one `ctx.arc` stroke, occasionally
two for `solid`+B) — the existing `flightHitPx` hit-target publishing and
label-line drawing are untouched.

---

## 6. Config schema & UI

### 6.1 Types (`src/flights.ts` additions)

```ts
export type FlightGlowPattern =
  'none' | 'solid' | 'flash' | 'strobe' | 'rotate' | 'fade' | 'alternate';

export interface FlightGlowCriteria {
  operator?: string; typeCode?: string; typeDesc?: string;
  reg?: string; callsign?: string; category?: string;      // wildcard strings, §3.1
  minSpeedKt?: number; maxSpeedKt?: number;
  minAltFt?: number; maxAltFt?: number;
  minDistNm?: number; maxDistNm?: number;
  military?: boolean; interesting?: boolean; ladd?: boolean; pia?: boolean;
  emergency?: boolean;   // unreachable in v1 — §4 honesty note
}

export interface FlightGlowRule {
  id: string;                 // 'fgr_' + random, generated once, stable across edits
  label?: string;             // optional user-facing name for the summary row
  enabled?: boolean;          // absent = true
  criteria: FlightGlowCriteria;
  pattern: FlightGlowPattern;
  colorA?: string;            // hex; required whenever pattern !== 'none'
  colorB?: string;            // hex; optional
}

export const MAX_FLIGHT_GLOW_RULES = 30;
```

`FlightsConfig` (types.ts) gains one field:

```ts
export interface FlightsConfig {
  // …unchanged…
  glowRules?: FlightGlowRule[];   // user-defined glow rules, first-match-wins (§4)
}
```

### 6.2 Matcher + resolver (`src/flights.ts`)

```ts
function wildcardMatch(pattern: string | undefined, value: string | null): boolean {
  if (!pattern) return true;               // unset criterion = wildcard "any"
  if (value == null) return false;
  const re = compileWildcard(pattern);
  return re ? re.test(value) : false;
}

export function matchesGlowCriteria(fp: FlightPoint, c: FlightGlowCriteria): boolean {
  if (!wildcardMatch(c.operator, fp.operator)) return false;
  if (!wildcardMatch(c.typeCode, fp.typeCode)) return false;
  if (!wildcardMatch(c.typeDesc, fp.typeDesc)) return false;
  if (!wildcardMatch(c.reg, fp.reg)) return false;
  if (!wildcardMatch(c.callsign, fp.callsign)) return false;
  if (!wildcardMatch(c.category, fp.category)) return false;
  if (c.minSpeedKt != null && (fp.gsKt == null || fp.gsKt < c.minSpeedKt)) return false;
  if (c.maxSpeedKt != null && (fp.gsKt == null || fp.gsKt > c.maxSpeedKt)) return false;
  if (c.minAltFt != null && fp.altFt < c.minAltFt) return false;
  if (c.maxAltFt != null && fp.altFt > c.maxAltFt) return false;
  if (c.minDistNm != null && (fp.distNm == null || fp.distNm < c.minDistNm)) return false;
  if (c.maxDistNm != null && (fp.distNm == null || fp.distNm > c.maxDistNm)) return false;
  if (c.military    != null && fp.military    !== c.military)    return false;
  if (c.interesting != null && fp.interesting !== c.interesting) return false;
  if (c.ladd        != null && fp.ladd        !== c.ladd)        return false;
  if (c.pia         != null && fp.pia         !== c.pia)         return false;
  if (c.emergency   != null && isEmergency(fp) !== c.emergency)  return false;
  return true;
}

export interface ResolvedGlow { pattern: FlightGlowPattern; colorA: string; colorB?: string; }

// Folds §4's three-tier precedence into ONE call site (three-renderer.ts and
// canvas-render.ts both call this — never re-derive the ladder locally).
export function resolveFlightGlow(
  fp: FlightPoint, rules: FlightGlowRule[] | undefined, beaconsOn: boolean,
): ResolvedGlow | null {
  if (!beaconsOn) return null;
  if (isEmergency(fp)) return { pattern: 'flash', colorA: '#ff2a1a' };  // unchanged default
  for (const r of rules ?? []) {
    if (r.enabled === false) continue;
    if (!matchesGlowCriteria(fp, r.criteria)) continue;
    if (r.pattern === 'none') return null;
    return { pattern: r.pattern, colorA: r.colorA ?? '#ffffff', colorB: r.colorB };
  }
  if (fp.interesting) return { pattern: 'flash', colorA: '#ffd400' };
  if (fp.military)    return { pattern: 'flash', colorA: '#2ee56a' };
  if (fp.ladd)         return { pattern: 'flash', colorA: '#f2f6fb' };
  return null;
}
```

### 6.3 Sanitizer (`Planner.setFlights`, mirroring the `labelFields`/watch-list
site exactly — `planner.ts:5220-5245`)

```ts
export function sanitizeFlightGlowRules(v: unknown): FlightGlowRule[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const PATTERNS = new Set<FlightGlowPattern>(
    ['none', 'solid', 'flash', 'strobe', 'rotate', 'fade', 'alternate']);
  const HEX = /^#[0-9a-f]{6}$/i;
  const str = (x: unknown) => { const s = typeof x === 'string' ? x.trim() : ''; return s || undefined; };
  const num = (x: unknown) => (typeof x === 'number' && isFinite(x) ? x : undefined);
  const bool = (x: unknown) => (typeof x === 'boolean' ? x : undefined);
  const clamp = (n: number | undefined, lo: number, hi: number) =>
    n === undefined ? undefined : Math.max(lo, Math.min(hi, n));
  const swap = (a?: number, b?: number): [number | undefined, number | undefined] =>
    a != null && b != null && a > b ? [b, a] : [a, b];

  const seen = new Set<string>();
  const out: FlightGlowRule[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const pattern = typeof r.pattern === 'string' && PATTERNS.has(r.pattern as FlightGlowPattern)
      ? (r.pattern as FlightGlowPattern) : null;
    if (!pattern) continue;                       // unknown pattern → drop the rule entirely
    const colorA = typeof r.colorA === 'string' && HEX.test(r.colorA) ? r.colorA : undefined;
    const colorB = typeof r.colorB === 'string' && HEX.test(r.colorB) ? r.colorB : undefined;
    if (pattern !== 'none' && !colorA) continue;   // a visible pattern needs ≥1 valid color

    let id = typeof r.id === 'string' && r.id ? r.id : `fgr_${Math.random().toString(36).slice(2, 9)}`;
    while (seen.has(id)) id = `fgr_${Math.random().toString(36).slice(2, 9)}`;
    seen.add(id);

    const c = (r.criteria ?? {}) as Record<string, unknown>;
    const [minAlt, maxAlt] = swap(clamp(num(c.minAltFt), 0, 60000), clamp(num(c.maxAltFt), 0, 60000));
    const [minSp,  maxSp ] = swap(clamp(num(c.minSpeedKt), 0, 800), clamp(num(c.maxSpeedKt), 0, 800));
    const [minDs,  maxDs ] = swap(clamp(num(c.minDistNm), 0, 500), clamp(num(c.maxDistNm), 0, 500));

    out.push({
      id, label: str(r.label), enabled: r.enabled !== false, pattern, colorA, colorB,
      criteria: {
        operator: str(c.operator), typeCode: str(c.typeCode)?.toUpperCase(),
        typeDesc: str(c.typeDesc), reg: str(c.reg)?.toUpperCase(),
        callsign: str(c.callsign)?.toUpperCase(), category: str(c.category)?.toUpperCase(),
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
```

Called from `Planner.setFlights` the same way `sanitizeLabelFields` already
is (`planner.ts:5236`):

```ts
if (this.store.flights.glowRules !== undefined) {
  this.store.flights.glowRules = sanitizeFlightGlowRules(this.store.flights.glowRules);
}
```

**Pitfall this sanitizer must guard (call out explicitly in the doc + a code
comment at the call site)**: an emptied text input naively left as `''`
would, under the §3.1 hybrid rule, compile to `**` — matching **every**
aircraft on that field. `str()` above already collapses a blank/whitespace
string to `undefined` (unset = wildcard "any" on that ONE field, which is
the intended no-op — not "match everything via an accidental empty
pattern"). This mirrors the same trap `sanitizeLabelFields`'s
trim-then-filter-blank discipline already avoids for a different reason.

### 6.4 UI sketch — Settings ▸ Flight tracking, new "Glow rules" sub-block

Below the existing "Status beacons" checkbox (`modals.ts` `_flightsBlock`,
~line 1315), add a block styled like the "Alerts" sub-group already there
(dashed top border, `font-size:11px;font-weight:600` header):

```
┌─ Glow rules ──────────────────────────────────────────────┐
│ Custom glow color & pattern per matching aircraft (first   │
│ match wins; falls back to the default beacon above).       │
│                                                             │
│ [≡] Southwest 737s          flash 🟡●⚪         ▲▼ ✎ ✕     │
│ [≡] Below 2,000 ft nearby   fade  🔴            ▲▼ ✎ ✕     │
│ [≡] (unnamed rule)          solid 🔵●⚪ [off]    ▲▼ ✎ ✕     │
│                                                             │
│                    [ + Add rule ]                          │
└──────────────────────────────────────────────────────────┘
```

- Each row is a **collapsed summary line** by default (label or an
  auto-generated criteria digest like `operator=Southwest*`, the pattern name
  + a small color-swatch pair, an `[off]` tag when `enabled === false`) —
  NOT the full 15-field form, mirroring the sidebar's collapsible-section
  idiom rather than the always-expanded `_ruleRows` (value-rules rows are
  short — one op/value/color — so always-expanded is fine there; a flight
  glow rule has ~15 possible fields, which would make an always-expanded list
  of 10+ rules unusably tall).
- `✎` expands the row in place into the full criteria form: one text input
  per wildcard string field (with a placeholder hint like `e.g. SWA* or
  *Southwest*`), paired min/max number inputs for speed/alt/dist (blank =
  no bound, matching the existing altitude-filter inputs' `placeholder="off"`
  convention), and a tri-state select (`Any` / `Yes` / `No`) per boolean flag
  — then the pattern `<select>` (7 options) + two `<input type="color">`
  swatches (the second disabled/greyed when the pattern doesn't use a second
  color meaningfully, though it's still stored if set) + the enable
  checkbox.
- **`▲`/`▼` reorder buttons** — recommended explicitly (unlike the
  value-rules editor, which has no reorder control) because **rule order
  materially changes behavior far more here**: a value-rule list scores one
  entity's own numeric state (rules rarely overlap in practice — a
  temperature is either `< 0` or `between 0 and 100`, not both); a flight
  glow rule list is much more likely to have **overlapping matches** across
  independent dimensions (e.g. "all Boeing 737s" and "anything above 30,000
  ft" can both be true of the same aircraft), so which rule is authored
  first genuinely changes the result. Mirrors the existing "Move floor"
  ▲/▼ nudge-button idiom (`floorsDisplayOrder`/`moveFloor`) rather than
  introducing drag-and-drop.
- `✕` deletes the row (with the existing `confirm()`-free instant-delete
  convention `_ruleRows` already uses — rules are cheap to re-add, no
  confirmation needed).
- `+ Add rule` appends a new rule in **expanded** state (empty criteria =
  matches everything until narrowed, pattern defaults to `flash`, `colorA`
  defaults to a placeholder like `#ffd400`) — mirrors `_ruleRows`' "+ Add
  rule" append-with-sane-defaults behavior.

---

## 7. Performance guardrails

**Matching runs at poll cadence, not per frame — already true by
construction.** `_syncFlightBeacon` is called once per aircraft from
`_applyFlightFix`, which `updateFlights` calls once per aircraft **per poll**
(three-renderer.ts:12545-12574; poll cadence is `FlightsConfig.pollSeconds`,
default 8 s). `resolveFlightGlow` replaces `_flightBeaconColor` at exactly
that call site — no new call frequency is introduced. Cost bound: ≤50
aircraft (`MAX_AIRCRAFT`) × ≤30 rules (`MAX_FLIGHT_GLOW_RULES`) × ~15 field
checks per rule ≈ 22,500 comparisons per poll — sub-millisecond on any
target hardware, no memoization strictly required (the wildcard-compile
cache in §3.2 is cheap insurance, not load-bearing). **Do not** call
`resolveFlightGlow` from `_advanceFlights` (the per-frame method) — that
would re-run matching ~60×/s for no benefit, since a `FlightPoint`'s
matchable fields (operator/type/reg/…) don't change between polls. The
existing rebuild-on-change guard (`if (want === rig.beaconColor) return;` at
three-renderer.ts:12652) generalizes cleanly: widen the comparison key from
a single color number to a small tuple/string
(`` `${pattern}|${colorA}|${colorB ?? ''}` ``) so the bead/glow objects are
only rebuilt when the RESOLVED glow actually changes, not every poll.

**2D is the one place matching runs every frame** — `drawFlights` has no
persistent per-aircraft state (everything is recomputed from `p.flightsNow`
each RAF tick already, including today's single-hex `flightBeaconColor`
call), so `resolveFlightGlow` is simply called inline there too, at the SAME
per-frame cost the existing beacon-color lookup already pays. This is an
intentional asymmetry, not an oversight: 3D caches at poll cadence because it
owns a persistent `rig` object worth not rebuilding gratuitously (material
churn = GC pressure + a visible material-swap seam); 2D has no such object to
protect and already recomputes its equivalent every frame, so there is
nothing new to guard against.

**Per-frame animation stays zero-allocation.** Each `FlightRig` gains:
`glowPattern: FlightGlowPattern`, `glowPhase: number` (seconds, advanced
`+= dt` every frame regardless of rebuilds — the existing `beaconPhase`
continuity idiom), and three **persistent** `THREE.Color` objects created
once at rebuild time (`glowColorA`, `glowColorB`, `glowColorCur` — the last
one is scratch, mutated via `.lerpColors(rig.glowColorA, rig.glowColorB, mix)`
every frame and then copied onto the bead/glow materials'
`.color`/`SpriteMaterial.color` in place). No `new THREE.Color` and no string
parsing happens inside `_advanceFlights` — only inside the (poll-cadence)
rebuild path, matching the file's existing "zero-alloc after build" family
of comments (weather particles, flags, sprinklers, etc.).

**Material/texture sharing is unaffected — no new opt-out needed.** The
bead (`MeshBasicMaterial`) and glow (`SpriteMaterial`) are **already
per-rig, not shared** — confirmed at `_syncFlightBeacon`
(three-renderer.ts:12651-12674): each rig gets its own material instances so
today's single-hex color can already differ per aircraft. This feature's
richer color pair fits the existing per-rig-material shape with zero
structural change. The **glow texture** (`_beaconGlowTexture()`, a single
white radial-gradient `CanvasTexture` tinted per-material via
`SpriteMaterial.color`) stays the ONE shared resource, already tagged
`userData.sharedMap = true` and already excluded from per-rig disposal
(`_removeFlightBeacon` disposes the material but not the shared map) — no
new texture, no new sharing decision to make. Every pattern in §2 is
expressible as an opacity/color function over the SAME two existing objects;
none requires new geometry or a differently-shaped glow.

---

## 8. Integration checklist

- **`src/flights.ts`** (pure additions, zero-import, shared app+renderer
  chunk — the file's existing discipline): `FlightGlowPattern`,
  `FlightGlowCriteria`, `FlightGlowRule`, `MAX_FLIGHT_GLOW_RULES`,
  `flightGlowFrame`, `matchesGlowCriteria`, `resolveFlightGlow`,
  `compileWildcard` (module-private + a cache), `lerpHexColor`,
  `sanitizeFlightGlowRules`.
- **`src/types.ts`**: `FlightsConfig.glowRules?: FlightGlowRule[]`.
- **`src/planner.ts`**: `setFlights` sanitizes `glowRules` via
  `sanitizeFlightGlowRules`, next to the existing `labelFields`/`modelScale`/
  watch-list normalization block (`planner.ts:5220-5245`).
- **`src/three-renderer.ts`**:
  - `FlightRig` interface gains `glowPattern`, `glowPhase`, `glowColorA`,
    `glowColorB`, `glowColorCur` (persistent `THREE.Color`s).
  - `_flightBeaconColor` is replaced by a call to `resolveFlightGlow(fp,
    this._flightsGlowRules, this._flightsBeacons)` (new instance field
    `_flightsGlowRules` set from `updateFlights`'s `opts`, mirroring how
    `_flightsBeacons`/`_flightsPrivacyDim` are already threaded through).
  - `_syncFlightBeacon`'s rebuild-key check widens from a single color number
    to the `pattern|colorA|colorB` tuple string (§7); the bead/glow build
    stays otherwise unchanged (still one sphere + one additive sprite).
  - `_advanceFlights`'s beacon-phase block (three-renderer.ts:13449-13460)
    is replaced by: advance `rig.glowPhase`, call `flightGlowFrame(pattern,
    rig.glowPhase)`, `lerpColors` into `glowColorCur`, write
    opacity/color onto the bead + glow materials. `solid`'s two-tone
    exception (§2) is a small `if (pattern === 'solid')` branch that skips
    the lerp and just assigns `colorA`/`colorB` once at rebuild time
    instead.
- **`src/canvas-render.ts`**: `flightBeaconColor` (2D helper,
  canvas-render.ts:360-367) is replaced by a call into the same
  `resolveFlightGlow` + `flightGlowFrame` + `lerpHexColor` trio; `drawFlights`
  widens its single-ring draw to the per-pattern shapes in §5 (still at most
  two `ctx.arc` strokes).
- **`src/ui/modals.ts`**: `_flightsBlock` gains the "Glow rules" sub-block
  (§6.4) — a new private method (e.g. `_flightGlowRulesBlock`) called
  alongside the existing "Alerts" sub-group; a per-row expand/collapse local
  component state (mirrors how other modals track an "active" id) and a
  criteria-summary formatter (`summarizeGlowCriteria(c): string`, a small
  pure UI-only helper, NOT in `flights.ts` — it's presentation text, not
  matching logic).
- **Tests**:
  - `test-pages/flights-test.html` (currently `FLIGHTS PASS 160/160`) grows
    a new section covering: `flightGlowFrame` sampled at known `t` values
    against the hand-derived formulas above (envelope shape, never-negative,
    bounds 0..1), `matchesGlowCriteria` field-by-field matrix (each field
    isolated + AND combinations + wildcard substring vs anchored vs `?`
    single-char), `compileWildcard` safety (metacharacter-laden literal
    input never throws and matches literally, `*`/`?` expand correctly,
    empty pattern after trim → unset not match-all), `resolveFlightGlow`'s
    three-tier precedence (emergency always wins even with a matching user
    rule present; first-match-wins across an ordered rule list; `'none'`
    suppresses; no-match falls through to the unchanged default ladder),
    and `sanitizeFlightGlowRules` (cap enforcement, invalid pattern/color
    drops the rule, min/max swap, id de-dup, blank-string-criterion →
    `undefined` not `**`). The existing 94-aircraft airplanes.live LAX
    fixture is directly reusable here (real operator/typeCode/reg diversity
    to exercise wildcard matching against).
  - `test-pages/flights-render-test.html` (currently `FLIGHTSRENDER PASS
    80/80`): bead/glow rebuild fires only on a resolved-glow change (not
    every poll with an unchanged result); `solid` builds a two-tone
    bead/halo without any lerp; `strobe`'s twin-pop timing produces two
    separate opacity peaks per second (sampled at several `dt` steps); a
    `'none'`-resolving rule removes the bead+glow exactly like today's
    zero-color case; emergency overrides a matching user rule end-to-end
    through a real `Planner` + fake aircraft feed.
  - `test-pages/flights-ui-test.html` (currently `FLIGHTSUI 55/55`): the new
    Glow rules block renders, add/expand/reorder/delete round-trip through
    `Planner.setFlights`, and the alert-center's `flights-ui-test` 67/67
    stays green (regression guard already called out in `CLAUDE.md`).

---

## Open questions / risks (not resolved here — product calls for the implementer)

- Whether a rule's numeric criteria (speed/alt/dist) should be able to key
  off **rate of change** (e.g. "just started climbing") rather than a static
  snapshot — out of scope; `vertRateFpm` already exists on `FlightPoint` and
  could be added as an eighth criterion trivially if wanted later, but the
  brief's field list (operator/model/registration/callsign/type/speed/
  altitude/distance) doesn't ask for it.
- Whether `typeDesc` wildcarding is worth exposing at all given `typeCode`
  already covers precise family matching more reliably (`typeDesc` is a long
  free-text string like `"BOEING 737 MAX 8"` with inconsistent casing/
  formatting across data sources) — kept in the schema since it's "free" (one
  more wildcard string field, same matcher) but the UI could reasonably hide
  it behind an "advanced" disclosure if the row gets too busy.
- Should a rule be exportable/importable independently of the whole config
  (a "glow rule preset" sharable between users, e.g. "here's my military
  spotting rule set")? Out of scope for v1; `glowRules` rides the existing
  whole-store export/import envelope for free, no separate mechanism needed
  unless requested later.
