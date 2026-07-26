# Flight Fields & Aircraft Models — Build-Ready Research (P4 enhancement)

Status: research complete, not yet implemented. This is a **follow-on** pass to
`docs/research/flight-tracking.md` (the source-landscape research that shipped
as `Store.flights` / `src/flights.ts` / `src/adsb-sources.ts` /
`three-renderer.ts`'s `_buildAircraftModel` — see CLAUDE.md's "Flight &
satellite tracking (roadmap P4)" section). That feature is **live today** and
deliberately minimal: `aircraftModelKind()` (`src/flights.ts`) picks exactly
**three** toy models — `'prop' | 'jet' | 'heli'` — from the ADS-B `category`
field alone (`A7`→heli, `A1`/`A2`→prop, else jet), and the only `dbFlags` bit
consumed is bit 1 (military → an olive tint). This doc scopes the next step:
a richer aircraft-archetype set keyed off the `t` (ICAO type designator) field
with a `category` fallback, plus a fuller inventory of what airplanes.live/
readsb actually send that Diorama isn't using yet (registration, operator,
type name, wind-at-altitude, emergency status, …). Written in the same voice
as `flight-tracking.md` and `neighborhood-openfreemap.md`: every external
claim was checked against a live fetch, a primary doc, or Diorama's own
committed 94-aircraft fixture (`test-pages/fixtures/adsb/airplanes-live-lax.json`,
a real airplanes.live LAX-area capture) during this pass (2026-07-25) unless
marked **UNVERIFIED**.

## 0. Summary — the 10 decision-relevant facts

1. **The field inventory is settled and cross-confirmed three ways**: readsb's
   own `README-json.md`, ADS-B Exchange's "Version 2 API Fields" page (a
   sibling implementation of the same DO-260B-derived shape), and Diorama's
   own live fixture agree field-for-field. `dbFlags` is a 4-bit field:
   `military=1, interesting=2, PIA=4, LADD=8` — all four confirmed from two
   independent docs; the fixture only exercises bit `8` (LADD, 4 occurrences),
   never `1`/`2`/`4`, so those three remain **doc-verified but
   fixture-unverified**.
2. **airplanes.live is explicitly "unfiltered" by design — LADD/PIA flags are
   informational, not enforcement.** All 4 LADD-flagged aircraft in the
   fixture (2 Cessnas, an E50P, a C72R) carry their real `r` registration
   anyway. Verified against airplanes.live's own tagline ("Unfiltered ADS-B
   Map") and its dedicated `/v2/ladd/`, `/v2/pia/`, `/v2/mil/` endpoints
   (web-search-sourced, not independently fetched — see §8) — the point of
   those endpoints is to let users find the very aircraft LADD/PIA are
   *supposed* to hide from commercial trackers like FlightAware/FR24. **A
   privacy-respecting consumer, not the API, has to choose to dim/omit that
   data** — a concrete, low-cost courtesy Diorama could add (§4.2).
3. **`emergency` is a superset of the 7×00 squawks, not identical to them.**
   Values: `none, general, lifeguard, minfuel, nordo, unlawful, downed,
   reserved` (confirmed identically by both readsb and ADS-B Exchange docs).
   `7700`→`general`, `7600`→`nordo` ("no radio"), `7500`→`unlawful`
   (hijack/unlawful interference) are the classic mappings, but `emergency`
   also carries `lifeguard`/`minfuel`/`downed` states that have **no**
   dedicated squawk code of their own — `emergency` is the richer field;
   don't reduce it back to a squawk lookup.
4. **`alert`/`spi` are single bits of the 3-bit Mode-S Flight Status field**,
   confirmed with an exact value table from a primary technical source
   (mode-s.org, Junzi Sun's "1090MHz Riddle"): `000` no-alert/no-SPI/airborne
   … `100` alert+SPI. SPI = the pilot's "Ident" button (a on-screen
   "blossom," not an emergency). **`alert`'s trigger condition (widely cited
   as "the Mode A/squawk code just changed") could not be pinned to one
   primary-source sentence in this pass** — flagged UNVERIFIED, treat as
   "probably identity-change, not itself an emergency signal" rather than
   fact.
5. **Registry enrichment (`r`/`t`/`desc`/`ownOp`/`year`) is present in the
   live cloud response** — confirmed directly in the fixture (86/94 entries
   carry `t`; `ownOp`/`year` appear whenever the aircraft is in
   airplanes.live's own database) — this is airplanes.live's own DB lookup
   layered onto the raw Mode-S feed, not something `aircraft.json` alone
   would have from a bare local receiver (a local dump1090/readsb box CAN
   carry the same fields from its own `--db-file`, but only if the operator
   has loaded one).
6. **`t` (type designator) is missing on ~15% of live traffic even in a busy,
   database-rich sample** — 14/94 fixture entries have no `t` (and no
   `desc`), including several identifiable mainline flights (`DAL1142`,
   `UAL2372`, `SKW5744`) whose tail number simply isn't in that lookup. A
   `category`-only fallback ladder is not an edge case — it fires on roughly
   1 in 7 aircraft.
7. **`category` alone cannot distinguish wing position** (Diorama's real
   design fork — high-wing Cessnas vs. low-wing Pipers/Cirruses are BOTH
   `A1`) and **is not a clean narrowbody/widebody split either** — the
   fixture directly confirms the textbook exception: a Delta 757
   (`DAL507`/`B752`) reports `A4` ("high vortex large"), not `A5`, despite
   being a narrowbody. Category-only fallback should read `A5`→widebody,
   `A4`→narrowbody (never widebody), `A3`→narrowbody-as-default (large
   bizjets like a Global 5000 also self-report `A3` — the fixture's `GL5T`
   confirms it — so this bucket is a real mix, resolved correctly whenever
   `t` is present).
8. **The fixture also surfaces a gap in the SHIPPED code**: three fixture
   entries (`B00`, `B19`, `B02`, category `C2`) are **airport ground
   vehicles** ("surface vehicle – service vehicle" per the DO-260B emitter
   category table), not aircraft at all — `aircraftModelKind()` today would
   still render one as a `'jet'` toy model (it only special-cases `A7`/`A1`/
   `A2`), which is a real, fixture-provable bug worth a one-line fix
   (`category.startsWith('C')` → skip or render a ground-vehicle glyph)
   independent of the archetype-richness question this doc mostly addresses.
9. **Recommend 8 archetypes** (matching the brief's 7±1 target): ga-high-wing,
   ga-low-wing, twin-prop, turboprop-regional, narrowbody-jet, widebody-jet,
   bizjet, helicopter. The one genuinely non-obvious call: **Bombardier
   CRJ / Embraer ERJ135-145 share the bizjet archetype's SHAPE** (rear-
   fuselage-mounted engines + T-tail), not narrowbody-jet's (underwing pods +
   conventional tail) — confirmed via Wikipedia (E-Jet family, underwing
   CF34s) vs. web-search-sourced CRJ/ERJ-family descriptions (rear-mounted +
   T-tail) — **today's shipped code gets this wrong**: the current 3-way
   `aircraftModelKind()` puts every non-A1/A2/A7 aircraft, CRJs included,
   through the underwing-pod `'jet'` shape.
10. **Fighters/bombers/large military transports don't fit any of the 8
    archetypes well** and are rare on a residential feed regardless — best
    v1 answer is graceful degradation (fighters/attack aircraft self-report
    `A6`, "high performance >5g/400kt," a real fallback hook; map to bizjet
    as the nearest available small-fast-jet shape), not a 9th/10th archetype
    for aircraft a home ADS-B radius will see maybe a few times a year.

## 1. Full field inventory (verified against readsb + ADS-B Exchange + the fixture)

### 1.1 Where this was checked

`airplanes.live`'s own field-description page
(`https://airplanes.live/rest-api-adsb-data-field-descriptions/`) **403'd on
direct fetch again** in this pass (same result `flight-tracking.md`'s §8
recorded) and Wayback Machine access is not available from this environment.
Cross-checked instead against its two closest kin, exactly as the brief
suggested:

- **`wiedehopf/readsb`'s `README-json.md`** — fetched directly
  (`https://github.com/wiedehopf/readsb/blob/dev/README-json.md`). readsb is
  the upstream decoder airplanes.live's own feeder stack and most home
  dump1090/tar1090 installs run; airplanes.live's `{ac:[...]}` shape is
  field-identical to its `aircraft.json` (established fact, `flight-tracking.md`
  §4).
- **ADS-B Exchange's "Version 2 API Fields" page** — fetched directly
  (`https://www.adsbexchange.com/version-2-api/`). ADS-B Exchange runs the
  same DO-260B-derived field set (its own docs cite `2.2.3.2.3.2` /
  `2.2.3.2.5.2` DO-260B section numbers for `alert`/`spi`/`category`) and is
  useful as a SECOND independent transcription of the same underlying spec —
  where the two docs disagree in wording, that's noted below; they never
  disagreed on a field's existence or unit.
- **The committed fixture** (`test-pages/fixtures/adsb/airplanes-live-lax.json`,
  94 real aircraft, a live airplanes.live `/v2/point/` capture near LAX) —
  read directly and cross-tabulated in this pass (Python one-liners over the
  raw JSON) to confirm which fields ACTUALLY appear, with what value shapes,
  in a real busy-airspace response — not just what the docs claim exists.

### 1.2 The complete field table

| Field | Meaning | Unit | In fixture? |
|---|---|---|---|
| `hex` | ICAO 24-bit address, 6 hex digits (a `~`-prefixed hex like `~2998aa` marks a **non-ICAO / TIS-B-only track** — no real Mode-S address, seen twice in the fixture, both `type:"tisb_other"`) | — | yes, 94/94 |
| `flight` | Callsign / tail (≤8 chars, space-padded) | — | yes, most entries |
| `r` | Registration (DB lookup) | — | yes, whenever DB has it |
| `t` | ICAO type designator (DB lookup) | — | 86/94 (see §0.6) |
| `desc` | Long type name (DB lookup, optional) | — | present whenever `t` is |
| `ownOp` | Registered owner/operator name | — | present whenever DB has it (airline name, LLC, trustee bank, "CITY OF LOS ANGELES," …) |
| `year` | Manufacture year (DB lookup) | — | present whenever DB has it |
| `lat`, `lon` | Position | decimal degrees | yes |
| `alt_baro` | Barometric altitude, **or the literal string `"ground"`** | feet | yes — 40/94 fixture entries are `"ground"` (parked/taxiing at/near LAX) |
| `alt_geom` | GNSS/INS geometric altitude (WGS84) | feet | yes |
| `gs` | Ground speed | knots | yes |
| `ias` | Indicated airspeed | knots | not present in this fixture (needs a higher-DO-260-version transponder feeding it) |
| `tas` | True airspeed | knots | not present |
| `mach` | Mach number | — | not present |
| `track` | True track over ground, 0–359 | degrees | yes |
| `track_rate` | Rate of change of track | deg/s | not present |
| `roll` | Roll angle, negative = left | degrees | not present |
| `baro_rate` / `geom_rate` | Vertical rate | ft/min | yes |
| `mag_heading` / `true_heading` | Heading | degrees | both appear (ground/taxi entries favor `true_heading`) |
| `squawk` | Mode A code | 4 octal digits | yes |
| `emergency` | ADS-B emergency/priority status | enum, §2.2 | yes — always `"none"` in this sample (86/94; 8 entries omit it) |
| `alert` | Flight-status alert bit | 0/1 | yes — `0` in 85, `1` in 3 |
| `spi` | Flight-status SPI ("Ident") bit | 0/1 | yes — `0` in 87, `1` in 1 |
| `category` | ADS-B emitter category, `A0`–`D7` | enum, §3.5 | yes, on all but a handful |
| `nic`, `rc`, `nic_baro`, `nac_p`, `nac_v`, `sil`, `sil_type`, `gva`, `sda`, `version` | Position/velocity integrity + accuracy metadata (ADS-B version 0/1/2) | mixed | yes, on every ADS-B-sourced (not TIS-B) entry |
| `nav_qnh` | Selected altimeter setting | hPa | yes, on entries broadcasting DO-260B nav data |
| `nav_altitude_mcp` | Selected altitude, Mode Control Panel/FCU | feet | yes |
| `nav_altitude_fms` | Selected altitude, FMS | feet | not present in this fixture |
| `nav_heading` | Selected heading (true or magnetic — **not defined** which, per DO-260B itself) | degrees | yes |
| `nav_modes` | Engaged autopilot modes: `autopilot, vnav, althold, approach, lnav, tcas` | set | yes — e.g. `["vnav","lnav","tcas"]`, `["approach"]` |
| `messages` | Total Mode S messages received from this aircraft | count | yes |
| `seen` | Seconds since ANY message | seconds | yes |
| `seen_pos` | Seconds since the last POSITION update | seconds | yes |
| `rssi` | Recent average signal power, always negative | dBFS | yes |
| `type` | Message source: `adsb_icao`, `adsr_icao`, `mlat`, `tisb_icao`, `tisb_other`, … | — | yes — 3 distinct values seen (`adsb_icao` 86, `adsr_icao` 6, `tisb_other` 2) |
| `mlat` | Which fields were MLAT-derived | array of field names | yes, always `[]` in this ADS-B-only capture |
| `tisb` | Which fields were TIS-B-derived | array of field names | yes — e.g. `["baro_rate"]`, `["geom_rate"]`, or the full 13-field list on the two `tisb_other` tracks |
| `dbFlags` | Bitfield: `military=1, interesting=2, PIA=4, LADD=8` | bitfield | yes — only `8` seen, 4×, §2.1 |
| `wd`, `ws` | Wind direction/speed, **derived** from ground track + true heading + TAS + GS (NOT a direct sensor reading) | deg / knots | yes — exactly ONE fixture entry (`GTI9849`, a 747-8) carries `wd:71, ws:21` — needs `tas`/`true_heading` simultaneously present, which is rare |
| `oat`, `tat` | Outer/static and total air temperature, derived from Mach + TAS | °C | yes, same single entry (`oat:-15, tat:-24`) |
| `nic_baro` | NIC for barometric altitude | 0/1 | yes |
| `version` | ADS-B version (0/1/2; 3–7 reserved) | — | yes, always `2` when present |
| `rr_lat`, `rr_lon` | **Rough receiver-based** estimated position, used only when regular lat/lon is unavailable | decimal degrees | not present (this fixture's positions are all live ADS-B, not receiver-estimate fallback) |
| `lastPosition` | `{lat,lon,nic,rc,seen_pos}` snapshot when the regular lat/lon is >60 s stale | object | not present |
| `gpsOkBefore` | **Experimental.** Aircraft lost/degraded GPS; shown only for 15 min after | — | not present |
| `acas_ra` | **Experimental.** TCAS/ACAS Resolution Advisory info | — | not present |

### 1.3 `dbFlags` — bit semantics, confirmed two ways + fixture cross-check

Both readsb's README and ADS-B Exchange's field page state the SAME bitwise
formula, verbatim:

```
military    = dbFlags & 1
interesting = dbFlags & 2
PIA         = dbFlags & 4
LADD        = dbFlags & 8
```

`interesting` (bit 2) is airplanes.live/ADS-B-Exchange's own curated
"noteworthy" tag (e.g. historic airframes, notable owners) — a database
editorial flag, not an ADS-B protocol field; **its exact curation criteria
were not documented in either source fetched this pass** (UNVERIFIED beyond
"a flag the aggregator's own database assigns").

The fixture confirms `dbFlags` behaves exactly as documented where it
appears — 4 occurrences, all value `8` (LADD), on:

| hex | reg | type | desc |
|---|---|---|---|
| `a8bb3b` | N66168 | C172 | Cessna 172 Skyhawk |
| `ad42fa` | N9536D | C72R | Cessna 172R Cutlass RG |
| `a7d588` | N60354 | C150 | Cessna 150 |
| `a3dc32` | N348N | E50P | Embraer Phenom 100 |

All four keep full registration/type/owner-operator data despite the LADD
flag (§0.2/§4.2) — a direct, fixture-provable confirmation that airplanes.live
does not itself enforce the FAA program the flag names. Bits `1`/`2`/`4`
never appear in this particular 94-aircraft, single-moment sample — expected
(military and PIA-enrolled aircraft are a small minority of any local
airspace snapshot) but means those three bits are **doc-verified, not
independently fixture-verified**, in this pass. Diorama's own `garbage.json` /
`local-aircraft.json` synthetic test fixtures (`test-pages/fixtures/adsb/`)
already encode `dbFlags:1` (military) and `dbFlags:8` (LADD) test cases —
confirming the shipped code's own test-authoring already understood the bit
semantics correctly, independent of this research pass.

### 1.4 `emergency` vs. squawk 7500/7600/7700, and `alert`/`spi`

**`emergency`** values, confirmed identically in both readsb and ADS-B
Exchange docs: `none, general, lifeguard, minfuel, nordo, unlawful, downed,
reserved`. ADS-B Exchange's page adds the framing directly: *"ADS-B
emergency/priority status, a superset of the 7×00 squawks"* — i.e. this field
is the richer, protocol-native encoding; the three universal squawk codes
(confirmed via general aviation training sources — Pilot Institute, FAA ATC
handbook chapter 5 references, multiple flight-training sites, consistent
across all of them) are the historical Mode-A-only mechanism it supersedes:

| Squawk | Meaning | Corresponding `emergency` value |
|---|---|---|
| 7700 | General emergency (engine failure, fire, medical, any serious situation) | `general` |
| 7600 | Lost two-way radio communication | `nordo` |
| 7500 | Unlawful interference / hijacking | `unlawful` |
| — | (no squawk equivalent) | `lifeguard` (medical-priority flight), `minfuel` (fuel emergency), `downed` (aircraft down) |

None of these appear as anything but `"none"` in the fixture — expected,
emergencies are rare — so **the enum itself is doc-verified, not
fixture-verified** in this pass.

**`alert`/`spi`** are two of the three bits of Mode S's 3-bit **Flight
Status (FS)** field. Verified with an exact value table from a primary
technical source (`mode-s.org`, Junzi Sun's freely-hosted "1090MHz Riddle"):

```
000: no alert, no SPI, airborne
001: no alert, no SPI, on-ground
010: alert,    no SPI, airborne
011: alert,    no SPI, on-ground
100: alert,    SPI,    airborne or on-ground
101: no alert, SPI,    airborne or on-ground
110: reserved
111: not assigned
```

SPI is the pilot's **"Ident"** button — a one-shot squawk highlighting a
target on a controller's scope ("blossoming"), confirmed via general ADS-B
literature; it is NOT an emergency signal. **What specifically sets the
`alert` bit could not be pinned to one primary-source sentence in this
pass** — the commonly repeated claim across secondary ADS-B writeups is "the
Mode A/squawk identity code has recently changed," which is plausible and
internally consistent with FS existing as a *transponder* status word rather
than a pilot-emergency word, but no authoritative doc fetched here states it
in those exact terms. **Flag as UNVERIFIED**; safe design posture: treat
`alert` as "something about this transponder's identity just changed,"
never as an emergency indicator on its own (that's `emergency`'s and
squawk 7500/7600/7700's job).

### 1.5 Identity/registry enrichment — present live, confirmed in the fixture

`r`, `t`, `desc`, `ownOp`, `year` are exactly the fields the brief flagged
for a live-response check. All five are present in the airplanes.live
`{ac:[...]}` response whenever airplanes.live's own aircraft database has a
match for that ICAO hex — confirmed directly: 86/94 fixture entries carry
`t`+`desc` together, and `ownOp`/`year` appear on most (not all) of those —
e.g. `ownOp` is present for a Cessna owned by an LLC but absent for a
British Airways A380 (`BAW4E`) in the same fixture, meaning the DB coverage
is real-world incomplete even for `t`-resolved aircraft, not merely for the
14 with no `t` at all. This enrichment is airplanes.live's OWN aggregator
database layered on top of the raw Mode-S broadcast (the aircraft itself
transmits only `hex`/position/velocity/squawk/category — never its own tail
number or owner over the air) — a local dump1090/readsb box gets the SAME
fields only if its operator has loaded a `--db-file`/`--db-file-lt` aircraft
database of their own (readsb's own README documents `desc` as "optional
with --db-file-lt"), which is worth a note in Diorama's `local` source docs
(a bare LAN receiver may deliver `hex`/position only, with none of §3's
richer type-driven archetyping available).

### 1.6 Other fields Diorama isn't using yet — practicality notes

| Field(s) | Practicality for a decorative wall/sky panel |
|---|---|
| `ias`/`tas`/`mach` | Rare in a home-radius sample (needs a higher-tier transponder); not worth a label line — **skip**. |
| `oat`/`tat` | Same rarity (needs simultaneous mach+tas); a "cool" easter-egg stat, not a mainstream label — **v2 nice-to-have, not v1**. |
| `wd`/`ws` (wind aloft) | Genuinely interesting (real weather data, for free, from a plane already being rendered) but exactly as rare as `oat`/`tat` in this fixture (1/94) — pairs well with the existing weather-chip's "wind" concept if ever surfaced, but too sparse to be a reliable per-aircraft label. |
| `nav_altitude_mcp`/`nav_heading`/`nav_modes` | What the AUTOPILOT is doing, not what the plane IS doing — genuinely fun for an aviation-enthusiast audience ("descending to FL80, LNAV+VNAV+TCAS engaged") but jargon-heavy for a casual glance-at-the-wall panel — **opt-in detail tier only**, not the default label. |
| `track_rate`/`roll` | Turn-rate/bank telemetry — would only matter for a much higher-fidelity animated bank, and neither appeared even once in the 94-aircraft fixture — **skip for now**. |
| `rr_lat`/`rr_lon`/`lastPosition` | Fallback-position plumbing for when regular `lat`/`lon` goes stale — matters for FEED ROBUSTNESS (don't drop an aircraft from the display the instant its position field goes briefly stale), not for display content. Worth a `normalizeAircraftList` follow-up: fall back to `lastPosition`'s `{lat,lon}` before dropping an entry whose top-level `lat`/`lon` are momentarily absent. |
| `gpsOkBefore` | Experimental per both docs — a "this aircraft's GPS just degraded" badge is a neat but speculative alert-center candidate; not stable enough to build against yet. |
| `acas_ra` | Experimental, and exactly the kind of field where getting the interpretation wrong is actively alarming (a false "collision alert" glyph on a home dashboard is a bad failure mode) — **do not surface without a much deeper, dedicated read of DO-185B semantics; out of scope here.** |
| `messages`/`rssi` | Feed-quality diagnostics (how solid is this specific track), useful for a debug/status view, not a passenger-facing label. |
| `version`/`nic`/`rc`/`nac_p`/`nac_v`/`sil`/`sil_type`/`gva`/`sda` | Pure integrity/accuracy metadata for the position itself — useful only for filtering out low-confidence tracks (e.g. don't trust a `nic:0` position as tightly as a `nic:9`), never a display field. |

## 2. Beacon-semantics accuracy check (the brief's specific ask)

- **`dbFlags` bit 2 ("interesting")**: confirmed as airplanes.live/ADS-B
  Exchange's own curated tag, but its exact selection criteria are
  undocumented in either source fetched here — treat as "the aggregator
  flagged this one for some reason," not a defined category. Safe framing
  for a UI tooltip: *"flagged as noteworthy by the data source."*
- **LADD = "Limiting Aircraft Data Displayed"** — confirmed via FAA's own
  `faa.gov/pilots/ladd` page and NBAA's privacy FAQ (both web-search-surfaced,
  not independently fetched full-text in this pass): an FAA program (recently
  formalized by the 2024 FAA Reauthorization Act §803, per NBAA) letting
  owners request their ADS-B data be filtered from FAA's own SWIM feed and
  from participating public-display websites.
- **PIA = "Privacy ICAO Address"** — confirmed same sources: an alternate,
  temporary ICAO 24-bit address not tied to the aircraft's real registration
  in the civil registry, specifically so casual receivers can't map the
  transmitted hex back to a tail number at all (a stronger measure than
  LADD, which still broadcasts the real address but asks *displays* to
  suppress it).
- **The FAA's own intent for both programs is "commercial/public trackers
  should hide this," and airplanes.live's entire premise is refusing to do
  that** (confirmed via its own "Unfiltered ADS-B Map" tagline + dedicated
  `/v2/mil/`, `/v2/ladd/`, `/v2/pia/` endpoints found via web search, not an
  independently-fetched README in this pass — flagged accordingly). **Net
  recommendation for Diorama**: since Diorama is a private single-home panel,
  not a public tracker, there's no legal/ToS obligation to suppress
  LADD/PIA-flagged data — but a courtesy "dim the registration/operator line
  and show a small 🔒 badge on PIA/LADD-flagged aircraft" is cheap, matches
  the spirit of the FAA programs, and costs nothing given the bits are
  already in-hand (`dbFlags & 4`, `dbFlags & 8`) even though Diorama's own
  upstream (airplanes.live) won't enforce it for you.
- **`emergency` precedence** (no source stated an explicit conflict-resolution
  rule; this is a reasoned recommendation, not a verified fact): if
  `emergency !== 'none'`, it should visually **outrank** everything else
  discussed in this doc (archetype, dbFlags, category) — a red flash /
  distinct beacon glyph regardless of aircraft type. This is consistent with
  §6.3 of `flight-tracking.md`'s already-shipped `_computeFlightAlerts()`
  design (low-overflight / watch-list / ISS-rise), which this doc's alert
  surface should extend with a 4th trigger — "any polled aircraft's
  `emergency` is not `'none'`" — a cheap addition (the field is already
  normalized into nothing today; `FlightPoint` doesn't carry it yet, see
  §5's checklist) with an obvious, high-value payoff (a real squawk-7700 10
  miles out is exactly the kind of thing a home dashboard should surface
  loudly).

## 3. Aircraft archetypes

### 3.1 Most-produced ≠ most-flying — the caveat the brief anticipated

Wikipedia's "List of most-produced aircraft" (fetched directly) is dominated,
as expected, by WWII-era military types (Il-2, Bf 109, Spitfire, P-51, …) —
historic, essentially never on ADS-B today. Filtering to types still
genuinely common in living airspace leaves a short, familiar list: **Cessna
172/152/182/150** (piston GA, all high-wing), **Piper PA-28** (piston GA,
low-wing), **Beechcraft Bonanza** (piston GA, low-wing), **Mooney M20**
(piston GA, low-wing), and — the only TRULY modern entries on a
total-production list — the **Airbus A320 family** and **Boeing 737 family**,
confirmed via web search to have recently swapped the "most-delivered
commercial jetliner" crown (A320 family surpassing 737 in cumulative
deliveries in late 2025, per aviation trade press summarized in this pass —
**UNVERIFIED against a single primary source**, but consistent across
multiple independent search results). Regional jets/turboprops and
GA-turboprops (ATR72, Dash-8/Q400, King Air, PC-12, Caravan) don't crack a
total-PRODUCTION top-40 at all (their whole-model-family production runs are
in the hundreds-to-low-thousands, not tens of thousands) despite being
extremely common on a real ADS-B feed — **current fleet composition, not
historical production volume, is what actually matters for archetype
coverage**, exactly as the brief anticipated. The rest of this section is
built from current-fleet reality (general aviation knowledge + the fixture's
own real-world sample, which is itself a fair cross-section: 17× A1-light,
1× A2-small, 42× A3-large, 2× A4, 21× A5-heavy, 5× A7-rotorcraft, 3× C2-ground
vehicle, per §0.7's category counts), not the Wikipedia production list.

### 3.2 The 8-archetype set

| Archetype | Silhouette | Why this bucket exists |
|---|---|---|
| `ga-high-wing` | High wing (often strut-braced), single piston/small-turboprop engine, fixed or simple retractable gear | The Cessna 172/152/182/150 family alone accounts for a huge share of light GA traffic (confirmed: 6 distinct Cessna singles appear across the 94-aircraft fixture — more of any single family than anything else except mainline jets) |
| `ga-low-wing` | Low wing, single piston/turboprop engine | Piper PA-28 (fixture: 3×), Cirrus SR20/22, Beechcraft Bonanza, Mooney M20, Piper Malibu/Meridian (`P46T`, low wing — confirmed via web search), Pilatus PC-12 (low wing, **confirmed via web search** — a common assumption error, see §3.4), Daher TBM |
| `twin-prop` | Low wing, TWO wing-mounted piston or turboprop engines, conventional tail | Piper Seneca/Aztec, Beechcraft Baron, Diamond DA42, Beechcraft King Air / B300/B350 (low wing — confirmed via web search, NOT the high-wing turboprop-regional shape a naive reading of "regional turboprop" might suggest), Fairchild Metroliner |
| `turboprop-regional` | HIGH wing, TWO wing-mounted turboprops, T-tail | ATR 42/72 (confirmed high-wing + **T-tail** via web search — not the conventional tail this pass initially assumed), De Havilland Dash 8 / Q400 (confirmed high-wing + T-tail, well-established) |
| `narrowbody-jet` | Low swept wing, 2 underwing turbofan pods, conventional (non-T) tail | A319/320/321(neo), 737(-MAX), A220/BCS3, and — the archetype-assignment finding of this pass — the **Embraer E-Jet family** (E170/175/190/195), confirmed via Wikipedia to use underwing CF34 pylons, unlike its own ERJ predecessor |
| `widebody-jet` | Same family as narrowbody but bigger, 2 or 4 underwing pods | 747, 767, 777, 787, A330/340/350/380 — `A5` ("heavy") is a reliable category-only signal for this bucket (§0.7) |
| `bizjet` | Low swept wing, engines mounted on the REAR FUSELAGE (not underwing), T-tail | Learjet, Citation, Challenger, Gulfstream, Falcon, Hawker, Phenom, Global — **and, the non-obvious call of this pass, the Bombardier CRJ family and the older Embraer ERJ135/140/145** (confirmed via web search: CRJ's own manufacturer-facing descriptions state rear-fuselage-mounted engines + T-tail "inherited" across the whole CRJ100/200/700/900 line, explicitly contrasted with the E-Jet's underwing redesign) |
| `helicopter` | Rotorcraft | Anything reporting `category:'A7'` — Robinson R22/R44/R66, Bell 206/407/429, Airbus/Eurocopter EC130/135/145/175, AS350 (fixture: 2× `AS50` at `A7`), Sikorsky S-76, Black Hawk |

### 3.3 The genuinely non-obvious finding: CRJ/ERJ share bizjet geometry

This is the one archetype call that ISN'T just "look at the wing/tail and
sort it," and it directly contradicts what today's shipped code does. A
naive read of "regional jet" groups CRJs with E-Jets as one family because
they serve the same routes at similar seat counts — but their actual
AIRFRAME shape is a fork:

- **CRJ100/200/700/900 and the older ERJ135/140/145**: low wing, **twin
  turbofans slung on the rear fuselage** (not the wings), **T-tail** —
  confirmed via web search summarizing manufacturer/enthusiast sources
  describing the CRJ family as retaining this configuration across every
  generation, explicitly because a T-tail keeps the horizontal stabilizer
  clear of the rear engines' jet exhaust. This is IDENTICAL geometry to a
  Learjet/Challenger/Falcon bizjet, just scaled up — not a coincidence, it's
  the same 1960s-DC-9/Learjet-lineage design choice.
- **E170/175/190/195**: low wing, **twin turbofans on underwing pylons**,
  conventional tail — confirmed directly from Wikipedia's Embraer E-Jet
  family article ("underwing-mounted General Electric CF34" for the E190/
  E195, and CF34-8E for the smaller variants) — a deliberate Embraer design
  departure from its OWN older ERJ135/145, specifically to look and fly more
  like a scaled-down mainline jet.

**Today's shipped `aircraftModelKind()` cannot see this distinction at all**
— it only branches on `category` (`A7`/`A1`/`A2`/else), and both CRJs and
E-Jets self-report `category:'A3'` (confirmed: the fixture's own CRJ-family-
adjacent entries and E-Jet-family entries — e.g. `SKW5636`/`E75L` at `A3` —
share the exact category every mainline narrowbody uses). **The `t`-keyed
archetype table below is what actually fixes this** — it's a real, concrete
visual-accuracy improvement over the status quo, not a theoretical one.

### 3.4 Ambiguous designators — explicit calls

| Designator | Ambiguity | Call made here | Why |
|---|---|---|---|
| `C208` (Cessna Caravan) | High-wing but a genuinely BIG single (comparable in length to some twins) | `ga-high-wing`, scaled up | Shape (high wing, single tractor engine) matches the archetype; only SIZE is off, and Diorama's whole display shell is already explicitly "not to scale, decorative" (§ of `flight-tracking.md` — the same honesty precedent applies here) |
| `PC12` (Pilatus PC-12) | Easy to assume high-wing (like the Caravan, a similar-market turboprop single) — **it is not** | `ga-low-wing`, scaled up | Confirmed via web search: "a cantilever LOW-wing monoplane with a cantilever T-tail" — a common mental mix-up with the Caravan this pass corrects |
| `P46T`/`M500`/`M600` (Piper Malibu/Meridian/M-series) | Could be mistaken for a high-wing Cessna-class single given the "personal turboprop" market overlap | `ga-low-wing` | Low-wing, retractable gear, pressurized — same family shape as a Bonanza/Cirrus, just turboprop-powered |
| `SF34` (Saab 340) | Regional-turboprop market position suggests it might belong with ATR/Dash-8 in `turboprop-regional` | `twin-prop` (low wing) — **UNVERIFIED**, based on general aviation-photo recollection, not independently confirmed in this pass (a web search this pass ran came back inconclusive on wing position) | If verified low-wing, it's shape-identical to a big King Air, not an ATR — flagged for a follow-up check before shipping copy that states it definitively |
| `SW4` (Swearingen/Fairchild Metroliner) | Same regional-turboprop confusion as Saab 340 | `twin-prop` (low wing) | Long thin fuselage, low wing, conventional tail — visually a stretched King Air, not an ATR-style regional |
| `A388` (Airbus A380) | Its sheer size + 4 engines could tempt a "needs its own archetype" call | `widebody-jet`, scaled up (biggest scale in the bucket) | Same underwing-pod-and-conventional-tail family as every other widebody, just bigger and with 4 pods instead of 2 — the archetype's dimension parameters (not its geometry family) should carry the size, matching how this doc treats `C208` |
| `GL5T`/`GLF4`/`GLF5`/`GLF6`/`G280` (Global/Gulfstream) | Large, expensive, could read as "not really a bizjet" | `bizjet` | Same rear-fuselage-engine + T-tail family as a Learjet, just a bigger cabin — confirmed present at `category:'A3'` in the fixture (`GL5T`), same bucket every other large-cabin bizjet reports |
| Fighters (`F16`/`F15`/`F18`/`F35`) | No archetype fits (fuselage-buried engines, low/no T-tail, tiny wing) | `bizjet` as the closest available "small fast jet" shape (explicit compromise) | `category:'A6'` ("high performance, >5g/400kt") is a clean, documented fallback signal (§3.5) even with no `t` match; true fidelity would need a 9th archetype this doc recommends AGAINST building for something a home radius sees rarely |
| Large military transports (`C17`/`C5M`/`A400`/`C130`/`C30J`) | High wing + 4 engines + T-tail (C-17, C-130, A400M) doesn't match ANY of the 8 (closest is `turboprop-regional`'s high-wing-T-tail shape, but scaled to 4 engines and often jet not turboprop power) | `turboprop-regional` for the turboprop ones (C-130/A400M), `widebody-jet` for the pure-jet ones (C-17) — both explicit shape mismatches, accepted | Rare sightings, and a home ADS-B radius that DOES see one is more likely to appreciate "a big grey plane showed up" than demand geometric precision for a type that will show up a handful of times a year |
| `B00`/`B19`/`B02`-style hexless-callsign, `category:'C2'` entries | These are not aircraft — confirmed via the fixture directly (airport ramp/service vehicles at LAX, `category:'C2'` = "surface vehicle – service vehicle" per the DO-260B table) | **Exclude entirely** from the archetype ladder (skip, don't render as any aircraft shape) | A real, fixture-caught gap in the currently shipped `aircraftModelKind()` (§0.8) — worth its own one-line fix regardless of archetype richness |

### 3.5 The full type-designator → archetype table

`t` (or, when absent, `category`) resolves to one of the 8 archetypes below.
Designators are grouped by archetype; where a fixture example exists it's
noted. This table intentionally covers the designators the brief listed
plus every one the fixture itself contains that wasn't already named.

**`ga-high-wing`**: `C172`, `C152`, `C150`, `C182`, `C170`, `C180`, `C185`,
`C206`, `C207`, `C208` (Caravan, scaled up — §3.4), `C210`/`P210` (Centurion —
fixture: `P210`), `C72R` (172R Cutlass RG, fixture-confirmed), `C177`
(Cardinal), `PA18` (Super Cub, high wing), `A188` (Ag-Wagon), `MAUL`/`M7`
(Maule), `KODI` (Kodiak 100, high-wing turboprop single).

**`ga-low-wing`**: `P28A`/`P28B`/`P28R`/`PA28` (Piper Cherokee/Warrior/Archer/
Arrow family, fixture-confirmed `P28A` ×2), `P46T`/`M500`/`M600` (Malibu/
Meridian family, fixture-confirmed `P46T` — §3.4), `SR20`/`SR22` (Cirrus),
`BE33`/`BE35`/`BE36` (Bonanza), `M20P`/`M20T` (Mooney), `DA40` (Diamond
Star, low wing), `PC12` (Pilatus PC-12 — §3.4), `TBM7`/`TBM8`/`TBM9` (Daher
TBM series), `RV\d` (Van's RV homebuilts, low wing).

**`twin-prop`**: `PA34` (Seneca), `BE58` (Baron), `BE55` (Baron 55), `DA42`
(Diamond DA42, low wing twin), `BE9L`/`BE20`/`B350` (King Air family, low
wing — §3.4), `SF34` (Saab 340 — §3.4, unverified wing position),
`SW4` (Metroliner — §3.4), `PAY2`/`PAY3` (Piper Cheyenne), `C310`/`C340`/
`C414`/`C421` (Cessna piston twins), `BE76` (Duchess).

**`turboprop-regional`**: `AT43`/`AT44`/`AT45`/`AT72`/`AT75`/`AT76` (ATR 42/
72 family — confirmed high-wing + T-tail this pass, §3.2), `DH8A`/`DH8B`/
`DH8C`/`DH8D` (Dash 8 / Q100-Q400 family, confirmed high-wing + T-tail),
`SB20` (Saab 2000, high wing regional turboprop), `C130`/`C30J` (Hercules —
explicit shape-mismatch compromise, §3.4), `A400` (Airbus A400M Atlas — same
compromise).

**`narrowbody-jet`**: `A319`/`A320`/`A321`/`A20N`/`A21N` (fixture-confirmed
`A21N` ×3), `B737`/`B738`/`B739`/`B37M`/`B38M`/`B39M` (fixture-confirmed
`B38M` ×5, `B739` ×3), `BCS1`/`BCS3` (A220, fixture-confirmed `BCS3`),
`A321` (base, fixture-confirmed), `B752`/`B753` (757-200/757-300 — **stays
narrowbody despite `category:'A4'`**, §0.7/§3.4, fixture-confirmed `B752`,
`B753`), `E170`/`E175`/`E190`/`E195`/`E75L`/`E75S`/`E290`/`E295` (E-Jet
family, fixture-confirmed `E75L` ×2), `A318` (baby Airbus).

**`widebody-jet`**: `A332`/`A333`/`A339` (A330 family, fixture-confirmed
`A332`, `A333`), `A343`/`A345`/`A346` (A340 family), `A359`/`A35K` (A350
family, fixture-confirmed `A359`), `A388` (A380, fixture-confirmed, §3.4),
`B744`/`B748` (747-400/747-8, fixture-confirmed `B748` ×2), `B752` — *no,
narrowbody, see above*, `B763`/`B764` (767-300/-400, fixture-confirmed
`B763` ×2), `B772`/`B77L`/`B77W` (777 family, fixture-confirmed `B77L`,
`B77W`), `B788`/`B789`/`B78X` (787 family, fixture-confirmed `B789`, `B78X`
×2).

**`bizjet`** (incl. the CRJ/ERJ family, §3.3): `CRJ1`/`CRJ2`/`CRJ7`/`CRJ9`
(Bombardier CRJ family), `E135`/`E145`/`E35L` (older Embraer ERJ,
fixture-confirmed `E135`), `C25A`/`C25B`/`C525`/`C56X`/`C680`/`C68A`/`C700`
(Cessna Citation family, various sizes), `CL30`/`CL35`/`CL60` (Challenger
300/350/605), `GLF4`/`GLF5`/`GLF6`/`G280`/`GA5C`/`GA6C` (Gulfstream family),
`LJ35`/`LJ45`/`LJ60` (Learjet family), `F2TH`/`FA7X`/`FA8X` (Dassault Falcon
family), `H25B` (Hawker/BAe 125 — **not present in the fixture**, listed from
general knowledge, unverified in this pass), `E50P`/`E55P` (Embraer Phenom 100/300, fixture-confirmed
`E50P`), `GL5T`/`GL7T` (Global 5000/5500/7500, fixture-confirmed `GL5T`,
§3.4), F-15/F-16/F-18/F-35 fighters (compromise mapping, §3.4).

**`helicopter`**: `R22`/`R44`/`R66` (Robinson), `B06`/`B407`/`B429`/`H500`
(Bell family), `EC30`/`EC35`/`EC45`/`EC75`/`H145`/`H175` (Airbus Helicopters/
Eurocopter family), `AS50`/`AS55`/`AS65` (AS350/355/365 Ecureuil/Dauphin
family, fixture-confirmed `AS50` ×2), `A139` (AgustaWestland AW139,
fixture-confirmed), `S76`/`S92` (Sikorsky), `UH60`/`H60`/`MH60` (Black Hawk
family), `CH47` (Chinook).

### 3.6 Category + speed fallback ladder (when `t` is absent)

Applies to the ~15% of live traffic with no type designator (§0.6):

1. `category === 'A7'` → `helicopter`. Clean, unambiguous (fixture-confirmed:
   every `A7` entry in the sample is a real rotorcraft).
2. `category` starts with `'C'` or `'B3'` → **not an aircraft** (surface
   vehicle / obstacle / parachutist per the DO-260B table, §0.8) — skip
   entirely, don't force through any archetype.
3. `category === 'A5'` → `widebody-jet`. Reliable in the fixture — every
   `A5` entry is a genuine wide-body (747/767/777/787/A330/A350/A380 family).
4. `category === 'A4'` → `narrowbody-jet`, **never** widebody — the 757
   "high-vortex large" exception is the textbook case and is directly
   fixture-confirmed (§0.7).
5. `category === 'A3'` → `narrowbody-jet` as the statistical default. This
   bucket genuinely mixes mainline narrowbodies, large bizjets (`GL5T`
   confirmed `A3`), and (per the ADS-B category spec) large piston/turboprop
   aircraft — accept the imprecision; it's the single most homogeneous
   reasonable default (42/94 fixture entries are `A3`, and the overwhelming
   majority of those ARE ordinary mainline narrowbodies).
6. `category === 'A2'` → `twin-prop` (small twin-engine aircraft, 15,500–
   75,000 lbs) as the statistical default — no way to tell high-wing
   regional-turboprop from low-wing GA twin from `category` alone; the
   `twin-prop` archetype (generic low-wing twin) is the safer single guess
   since it also plausibly reads as a small regional jet at a glance.
7. `category === 'A1'` → the genuinely unresolvable case: **cannot
   distinguish high-wing from low-wing from `category` alone** (both
   Cessnas and Pipers self-report `A1`), and `gs` (ground speed) doesn't
   discriminate wing position either — it discriminates piston-vs-turboprop
   speed at best. Default to `ga-high-wing`: the Cessna 172/150/152/182
   family is both the single most-produced GA type in history (§3.1) and
   directly the PLURALITY of unresolved-`t` or resolved-`t`-but-`A1`
   aircraft in the fixture itself, making it the best available single
   statistical guess, not an arbitrary tie-break.
8. `category === 'A6'` (high-performance, fighters/aerobatic) → `bizjet` as
   the nearest available small-fast-jet shape (§3.4, explicit compromise).
9. No `category` at all (2 fixture entries, both `tisb_other` TIS-B-only
   ghost tracks with no type, category, or callsign) → keep the existing
   shipped fallback (today's `else → 'jet'`, i.e. `narrowbody-jet` in the new
   scheme) — a position-only ghost track is the right time to fall back to
   the commonest thing overhead, exactly as the current code's own comment
   states.

## 4. Display/config notes

### 4.1 Label-line field practicality (for a small painted plate/plaque)

Today's shipped label (`_makeFlightLabel`, `three-renderer.ts`) is a
two-line plate: callsign (or hex) + REAL altitude in feet — deliberately
honest where the compressed display shell is not (CLAUDE.md, "Flight &
satellite tracking"). Candidate additional lines, ranked by how well they
fit a SHORT plate:

| Field | Fits a short plate? | Notes |
|---|---|---|
| Callsign (`flight`) | Yes — already shown | Primary line; falls back to `hex` when blank (a stripped-callsign entry, 1 fixture example: `EEEEEE`/blank flight in `local-aircraft.json`'s synthetic fixture) |
| Registration (`r`) | Yes, short (≤7 chars in the US `N`-prefix scheme) | A good SECOND identity line for GA aircraft where the callsign often duplicates the registration anyway (fixture: `N66168`'s `flight` field IS `"N66168  "`) — for airline flights it's genuinely NEW info (`AAL266` vs. `N454AL`) |
| Type code/name (`t`/`desc`) | `t` yes (≤4 chars); `desc` often too long (`"BOEING 737 MAX 8"`, `"AIRBUS A-321neo"`) for a plate line without wrapping/truncation | Recommend `t` for a compact plate, `desc` only in an expanded/hover detail view |
| Operator (`ownOp`) | Sometimes (airline names are short — `"DELTA AIR LINES INC"` is not, but a truncate-at-N-chars rule handles it); LLC/trustee-bank ownership strings for GA aircraft are often UNHELPFUL noise (`"WILMINGTON TRUST CO TRUSTEE"` tells a viewer nothing about the plane) | Recommend showing `ownOp` only when it looks like an airline (a short allow-list or a heuristic like "contains AIRLINES/AIR LINES/AIRWAYS") — the raw field is genuinely present but genuinely mixed-quality in the fixture |
| Altitude (`alt_baro`/`alt_geom`) | Yes — already shown | Ground-sentinel-filtered already (only airborne aircraft render at all, §0's inherited design) |
| Ground speed (`gs`) | Yes, short | Not currently shown; cheap addition, genuinely informative ("320 kt" reads instantly) |
| Vertical trend arrow | Yes — a single glyph (↑/↓/→) from `baro_rate`/`geom_rate` sign, thresholded (e.g. ±300 fpm deadband) | Cheaper than a number; recommend over a raw fpm figure for a glance-readable plate |
| Squawk | Yes, 4 digits | Low everyday value UNLESS it's 7500/7600/7700 — recommend showing it ONLY when `emergency !== 'none'` or squawk is one of the three universal codes, as an alert-adjacent detail, not a routine label field |
| Distance from home (`dst`, pre-computed by airplanes.live, or `distNm` from `flights.ts`'s own bearing math) | Yes, short ("14 nm") | Already computed (`FlightPoint.distNm`) but not currently in the label — cheap, genuinely useful addition ("how close is that") |

**Recommendation**: keep the plate itself to 2–3 lines max (callsign/reg,
type code, one of {altitude, speed, distance} — rotate or pick by user
preference) and move everything else (`desc`, `ownOp`, `nav_*`, squawk,
`wd`/`ws`/`oat`/`tat` when present) into an opt-in expanded detail view or
tooltip, mirroring how Diorama's info-card / entity-value-display research
already treats "compact plate vs. expanded detail" for other fixtures.

### 4.2 Beacon/privacy semantics — final recommendation

Restated from §2 in one place for the checklist: `dbFlags`'s bits are
accurately named (`military`/`interesting`/`PIA`/`LADD`) and airplanes.live's
own design philosophy is to surface them WITHOUT enforcing the privacy
programs they describe. Diorama, as a private single-home display, has no
obligation to suppress anything — but a low-cost, spirit-respecting default
worth building: dim the registration/operator text and show a small privacy
badge on `PIA`/`LADD`-flagged aircraft, with a settings toggle to turn even
that dimming off (some users will WANT to see exactly which "hidden" aircraft
are overhead — that is precisely airplanes.live's whole value proposition).
`emergency !== 'none'` should be the loudest possible signal in the entire
feature (§2's alert-precedence recommendation) — squawk 7500/7600/7700 and
the `emergency` enum are the one place in this whole field inventory where
getting the UI treatment right actually matters beyond "looks nice."

## 5. Integration checklist (delta against what's already shipped)

1. **`FlightPoint` (`src/flights.ts`) gains**: `reg` (`r`), `typeCode` (`t`),
   `typeDesc` (`desc`), `operator` (`ownOp`), `emergency` (string enum),
   `squawk`, `interesting`/`pia`/`ladd` (booleans, alongside the existing
   `military`), `distNm` (already present). All optional/nullable, mirroring
   `military`'s existing `dbFlags &` pattern — zero new imports, stays pure.
2. **`aircraftModelKind` → a new `aircraftArchetype(fp)`** (or rename in
   place) resolving §3.5/§3.6's ladder: `t` lookup table first (a plain
   `Record<string, Archetype>`, ~120 entries, generated from §3.5), then the
   §3.6 category+shape fallback, then the existing hexless-ghost `'jet'`
   (now `'narrowbody-jet'`) default. Add the §0.8/§3.6 `category`-starts-
   with-`'C'` exclusion as its own early return (skip the aircraft entirely)
   — a real bug fix, independent of archetype richness.
3. **`three-renderer.ts`'s `_buildAircraftModel`** grows from a 3-way switch
   to an 8-way one. The existing `prop`/`jet`/`heli` bodies are good starting
   points for `ga-high-wing`/`narrowbody-jet`/`helicopter` respectively (the
   shipped geometry already IS roughly those three shapes) — the NEW builds
   needed are `ga-low-wing` (low-wing variant of the existing prop body),
   `twin-prop` (twin-engine variant), `turboprop-regional` (high-wing twin +
   T-tail), `widebody-jet` (scaled-up jet body, 4 pods for the biggest
   types), and `bizjet` (rear-fuselage-engine + T-tail variant — this one is
   genuinely a new silhouette family, not a resize of an existing body).
4. **Label plate** (`_makeFlightLabel`): add `reg`/`typeCode` as an optional
   second identity line and a vertical-trend glyph, per §4.1; gate `desc`/
   `ownOp`/`nav_*`/squawk behind an expanded-detail toggle, not the default
   plate.
5. **Emergency alerting**: extend `Planner._computeFlightAlerts()` with a
   4th trigger — any polled aircraft's `emergency !== 'none'` OR squawk is
   7500/7600/7700 — severity `error` (louder than the existing low-overflight
   `warning`), no cooldown suppression beyond the existing per-hex dedupe
   (an active emergency shouldn't go quiet after 10 minutes the way a routine
   low-overflight alert does).
6. **PIA/LADD courtesy dimming**: a `Store.flights` boolean (default ON,
   matching the "respect privacy programs by default" framing of §4.2) that
   dims registration/operator text and shows a small badge when
   `pia || ladd` is true on a polled aircraft.
7. **Test-page delta**: extend `flights-test.html`'s existing 160-assertion
   fixture-driven suite (already built against the SAME real 94-aircraft
   fixture this doc analyzed) with the new field-extraction assertions,
   the full `t`→archetype table (a golden-value matrix, one row per §3.5
   entry), the §3.6 fallback ladder (category-only inputs), and the §0.8
   ground-vehicle exclusion (`B00`/`B19`/`B02` should be filtered, not
   rendered).

## 6. Open questions & risks

- **`SF34` (Saab 340) wing position was not independently confirmed in this
  pass** — a web search came back inconclusive. Verify against a primary
  spec sheet (Saab's own type certificate data sheet, or a detailed
  enthusiast reference like Jane's/flugzeuginfo.net) before shipping copy
  that asserts it definitively; the `twin-prop` archetype assignment is a
  reasoned guess (low-wing regional turboprop family), not a verified fact.
- **`alert`'s exact trigger condition remains unverified** (§1.4) — worth a
  deeper primary-source dig (ICAO Annex 10 Vol IV, or RTCA DO-260B itself,
  neither of which was accessible in this pass) before any UI copy claims
  to explain WHY a given aircraft's alert bit is lit.
- **`dbFlags` bits 1/2/4 (military/interesting/PIA) are doc-verified but not
  independently fixture-verified** in this pass — the committed 94-aircraft
  fixture happens to contain zero examples of any of the three. If a
  fresher/different-airspace fixture capture is ever taken (e.g. near a
  military base), it would be worth re-confirming all three bits appear and
  behave as documented, the way this pass could for bit 8 (LADD).
- **`interesting`'s curation criteria are genuinely undocumented** anywhere
  found in this pass — if Diorama ever wants to explain the flag to a user
  beyond "the data source flagged it," that would need a dedicated support
  request to airplanes.live or a close read of their (403-blocked-in-this-
  pass) own field-description page via some other access path.
- **airplanes.live's own field-description page remains inaccessible by
  direct fetch** (403, both this pass and `flight-tracking.md`'s prior pass)
  and Wayback Machine access is unavailable from this environment — every
  fact in this doc attributed to that page instead came from readsb/ADS-B
  Exchange's kin documentation or the live fixture. Worth a retry from a
  different network path before any copy claims to quote that specific page
  verbatim.
- **The 8-archetype set is a judgment call, not a derived fact** — like
  `flight-tracking.md`'s compression-curve tuning, "does this look right"
  is something to validate against the real renderer once built, not
  something this research pass can fully pin down from first principles.

## 7. Sources

- [wiedehopf/readsb `README-json.md`](https://github.com/wiedehopf/readsb/blob/dev/README-json.md) — full field inventory, `dbFlags`/`emergency`/`category` definitions (fetched directly).
- [ADS-B Exchange "Version 2 API Fields"](https://www.adsbexchange.com/version-2-api/) — independent transcription of the same DO-260B-derived field set, DO-260B section citations for `alert`/`spi`/`category` (fetched directly).
- `test-pages/fixtures/adsb/airplanes-live-lax.json` — Diorama's own committed 94-aircraft real airplanes.live capture (read + cross-tabulated directly in this pass).
- `test-pages/fixtures/adsb/local-aircraft.json`, `garbage.json` — Diorama's own synthetic local-format + malformed-input test fixtures (read directly; confirm the `{aircraft:[...]}` local-format envelope and the shipped code's existing `dbFlags` bit-1/bit-8 test cases).
- [mode-s.org, "The 1090MHz Riddle" (Junzi Sun)](https://mode-s.org/1090mhz/content/mode-s/3-surveillance.html) — exact Mode S Flight Status (FS) 3-bit value table (fetched directly).
- [Virtual Radar Server `EmitterCategory` enumeration](https://www.virtualradarserver.co.uk/SourceHelp/html/0d447530-d1c5-ae07-199c-299c31678c23.htm) — cross-check for the A0–A7/B1–B7/C1–C5 category table (fetched directly).
- `kreklow.us/go/go-adsb/adsbtype` Go package docs — second independent cross-check of the A/B/C category table incl. C4/C5/C6/C7 (web-search-sourced excerpt).
- Web search summaries (not independently fetched in full) for: airplanes.live's "unfiltered" positioning and `/v2/mil/`/`/v2/ladd/`/`/v2/pia/` endpoints; FAA LADD/NBAA privacy-program descriptions; squawk 7500/7600/7700 conventions; CRJ/E-Jet engine-mounting comparison (the CRJ side); ATR 72 T-tail confirmation; Pilatus PC-12 low-wing confirmation; A320-vs-737 cumulative-delivery crossover.
- [Wikipedia, "List of most-produced aircraft"](https://en.wikipedia.org/wiki/List_of_most-produced_aircraft) — production-volume figures, cross-referenced against current-fleet reality (fetched directly).
- [Wikipedia, "Embraer E-Jet family"](https://en.wikipedia.org/wiki/Embraer_E-Jet_family) — confirmed underwing CF34 engine mounting for E170/175/190/195 (fetched directly).
- Diorama repo internals (read directly): `src/flights.ts` (`FlightPoint`, `aircraftModelKind`, display-shell compression — the exact baseline this doc extends), `src/adsb-sources.ts` (fetch isolation, confirms the shipped `{ac:[...]}`/local envelope handling), `src/three-renderer.ts` lines ~11600–11780 (`_buildFlightRig`, `_buildAircraftModel`, `_makeFlightLabel` — the exact 3-way prop/jet/heli geometry this doc's §3/§5 propose extending), `src/types.ts` (`FlightsConfig`), CLAUDE.md ("Flight & satellite tracking (roadmap P4)" section — the authoritative summary of what's shipped today), `docs/research/flight-tracking.md` (the prior research pass this doc extends — source-landscape decisions, compression-curve design, and the honesty/rigor precedent this doc follows).
