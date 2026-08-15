# Flight & Satellite Tracking — Build-Ready Research (Roadmap P4)

Status: research complete, not yet implemented. Scopes "render live aircraft
(and satellite passes, especially the ISS) in Diorama's existing 3D sky" into
concrete, VERIFIED facts about the available data sources, then a design
sketch that slots into the established geo/weather/sky-astro/renderer
patterns. Written in the same voice as `docs/research/neighborhood-openfreemap.md`:
every external claim below was checked against a live endpoint or a primary
doc page during this research pass (2026-07-24/25) unless explicitly marked
**UNVERIFIED**. Live JSON/HTTP responses were captured with `curl` directly
against the real services — not reconstructed from memory or blog posts.

## 1. Summary — the decision-relevant facts up front

- **Local LAN receivers (dump1090-fa / readsb / tar1090 / ultrafeeder) do NOT
  serve `aircraft.json` with CORS headers by default.** Verified by fetching
  tar1090's own shipped `88-tar1090.conf` — it sets
  `Access-Control-Allow-Origin: *` ONLY on the historical `chunks/*.gz` replay
  files, never on `data/aircraft.json` itself. A user must add one lighttpd
  block themselves (exact syntax in §1). This is the single most important
  "make or break" fact for the local path, and it does not appear to be
  documented anywhere as prominently as it should be.
- **Of the three keyless cloud ADS-B APIs, only `airplanes.live` supports a
  plain browser `fetch()`.** Verified live via `curl -D -` with an `Origin`
  header: `api.airplanes.live` returns `access-control-allow-origin: *`;
  `api.adsb.lol` and `opendata.adsb.fi` return **no CORS header at all** on
  both a plain GET and an OPTIONS preflight (405) — a browser `fetch()`
  against them fails today, full stop, regardless of what their docs pages
  say about being "open." **OpenSky's `states/all` REST endpoint sends
  `access-control-allow-origin: https://opensky-network.org` UNCONDITIONALLY**
  (verified with two different `Origin` headers, both echoed back the fixed
  value) — it is CORS-locked to OpenSky's own web frontend and cannot be
  fetched from Diorama's origin at all, independent of the ToS problem below.
- **OpenSky's data license forbids this use case anyway**, CORS aside: free
  API access is licensed for "non-profit research and non-profit education"
  only, and the docs state that **any "operational" integration into a live
  product or service — even non-profit — requires a prior written agreement**.
  A Home Assistant dashboard panel reads as exactly that. Recommend: do not
  use OpenSky's REST API at all.
- **Recommended default: `airplanes.live`** — CORS-open, keyless, 1 req/s
  documented limit, `dst`/`dir` (distance/bearing from the query point) come
  pre-computed in the response, and the response shape is field-identical to
  local dump1090/readsb `aircraft.json` (`hex`/`flight`/`lat`/`lon`/
  `alt_baro`/`gs`/`track`/…) — one normalizer handles both. `adsb.lol` /
  `adsb.fi` remain useful as **HA-side proxy sources** (a `rest`/template
  sensor that HA's Python backend fetches server-side, sidestepping CORS
  entirely) but not as a direct browser fetch target without the user running
  their own CORS-adding proxy.
- **ISS-only, zero-code option**: `api.wheretheiss.at` — CORS open (verified),
  documented + measured rate limit (`X-Rate-Limit-Limit: 350` per 5 min,
  observed live), returns real-time lat/lon/alt/velocity for the ISS with no
  math required. It can show "where is the ISS right now" but **cannot do
  pass prediction** (no propagation, only current position).
- **SGP4 verdict: don't hand-roll it, and think twice before vendoring
  `satellite.js`.** The modern `satellite.js` (npm `v7.1.0`, verified) is now
  a WASM build compiled from C++ — a materially heavier, async-init dependency
  that cuts against Diorama's zero-npm-dependency, synchronous-pure-module
  house style. The last pure-JS release (`v4.1.4`) measures 22.3 KB minified /
  10.7 KB gzipped (measured directly). A hand-rolled TS port of the real SGP4
  algorithm (drag model, secular perturbations, deep-space resonance terms) is
  a meaningfully harder, more error-prone piece of code than the Keplerian
  two-body + named-perturbation-term math `sky-astro.ts` already ships for the
  Sun/Moon/planets — SGP4 is a specific, well-known-to-be-easy-to-get-subtly-
  wrong algorithm, which is *why* dedicated libraries persist instead of
  everyone reimplementing it. **v1 recommendation: `wheretheiss.at` for a live
  ISS dot, reusing `sky-astro.ts`'s existing az/alt + observer-resolution
  code.** Multi-satellite tracking and real pass prediction are a v2 decision
  point between vendoring the WASM `satellite.js` (breaks the zero-dep
  precedent, needs explicit product sign-off) or a hand-rolled simplified
  circular-orbit propagator (cheaper to build, honestly worse accuracy) — not
  resolved here, flagged as an open question in §7.
- **Coordinate math is the real design fork, not the network fetch.** An
  aircraft 20 nm out sits ≈37,040,000 mm from the house in real units — the
  camera far plane is 150,000 mm and the sky dome radius is 30,000 mm (both
  verified live in `three-renderer.ts`). Both horizontal distance AND
  altitude need independent non-linear compression curves into a small
  "display shell," not a literal `latLonToPlan` feed. Diorama already has a
  precedent for exactly this kind of "clamp real-world position into a
  bounded display shell along the true bearing" trick — `geo.ts`'s
  `clampToBoundary` (used for GPS pins beyond the yard boundary) — cited
  directly as the pattern to generalize.

## 2. Local ADS-B receivers (LAN)

### 2.1 Endpoint & field inventory

Verified against `wiedehopf/readsb`'s own `README-json.md`
([source](https://github.com/wiedehopf/readsb/blob/dev/README-json.md)) and
the FlightAware `dump1090-fa` fork's identical doc
([source](https://github.com/flightaware/dump1090/blob/master/README-json.md)).
Both projects (readsb is the actively-maintained fork most images now use;
dump1090-fa is FlightAware's PiAware-bundled fork) serve the same file shape:

| Flavor | Typical URL | Notes |
|---|---|---|
| dump1090-fa (PiAware) | `http://<host>:8080/data/aircraft.json` | PiAware's SD-card image conventionally mounts its web UI under the `/skyaware/` alias (the roadmap brief's `/skyaware/data/aircraft.json`), but a manual `apt install dump1090-fa` serves it at webroot on port 8080 by default — **the exact path is install-dependent; there is no single canonical URL**, always check the specific box. |
| readsb / tar1090 | `http://<host>/tar1090/data/aircraft.json` (or webroot `data/aircraft.json` if tar1090 is the primary vhost) | tar1090 is the modern, actively-maintained web frontend for readsb; installers alias it under `/tar1090/` alongside a legacy dump1090-fa mount, or as the sole vhost. |
| Ultrafeeder (`sdr-enthusiasts/docker-adsb-ultrafeeder`) / adsb.im images | container-exposed port, `.../data/aircraft.json` | Bundles readsb + tar1090 internally — **same field shape**, confirmed via the project's own docs; exact host/port is whatever the docker-compose / adsb.im image maps ([docker-tar1090 README](https://github.com/sdr-enthusiasts/docker-tar1090)). |

**Verified full per-aircraft field inventory** (readsb `README-json.md`,
fetched directly):

| Field | Meaning | Unit |
|---|---|---|
| `hex` | ICAO 24-bit aircraft address (6 hex digits) | — |
| `flight` | Callsign (≤8 chars) | — |
| `r` | Registration (database lookup) | — |
| `t` | Type code (database lookup) | — |
| `desc` | Long type name (database, optional) | — |
| `lat`, `lon` | Position | decimal degrees |
| `alt_baro` | Barometric altitude — **can be the literal string `"ground"`** instead of a number when the aircraft reports on-ground | **feet** |
| `alt_geom` | GNSS/INS altitude (WGS84 ellipsoid) | feet |
| `gs` | Ground speed | **knots** |
| `ias` / `tas` | Indicated / true airspeed | knots |
| `mach` | Mach number | — |
| `track` | True track over ground | **degrees, 0–359** |
| `track_rate` | Track change rate | deg/s |
| `roll` | Roll angle (negative = left) | degrees |
| `baro_rate` / `geom_rate` | Vertical rate | **feet/minute** |
| `mag_heading` / `true_heading` | Heading | degrees |
| `squawk` | Mode A code | 4 octal digits |
| `nav_*` | Selected altitude/heading/QNH/modes from the autopilot/FMS | mixed |
| `emergency`, `alert`, `spi` | Status flags/bits | — |
| `category` | ADS-B emitter category (A0–D7 — light aircraft, large, rotorcraft, UAV, etc.) | — |
| `nic`, `rc`, `nic_baro`, `nac_p`, `nac_v`, `sil`, `sil_type`, `gva`, `sda`, `version` | Integrity/accuracy metadata (ADS-B version 0/1/2) | — |
| `messages` | Total Mode S messages seen from this aircraft | count |
| `seen` | **Seconds since the last message of ANY kind** — staleness/freshness gate | seconds |
| `seen_pos` | **Seconds since the last position update** — the field to gate "is this dot still moving" | seconds |
| `rssi` | Recent signal power | dBFS (negative) |
| `type` | Message source (`adsb_icao`, `mlat`, `tisb_icao`, …) | — |
| `mlat` / `tisb` | Which fields were derived via multilateration / TIS-B rather than ADS-B | array of field names |
| `dbFlags` | Bitfield: military=1, interesting=2, PIA=4, LADD=8 | — |

Update cadence: **≈1 Hz** (readsb docs: "typically once a second").

### 2.2 CORS reality — verified, not assumed

Fetched the live, currently-shipped `88-tar1090.conf` lighttpd config from
`wiedehopf/tar1090` directly
([source](https://raw.githubusercontent.com/wiedehopf/tar1090/master/88-tar1090.conf)).
It sets `Access-Control-Allow-Origin: *` on exactly two path patterns —
`chunks/chunk_*.gz` and `chunks/current_*.gz` (the historical trace-replay
files tar1090's own web UI fetches for globe-history playback) — and
**nowhere else**. `data/aircraft.json`, the file Diorama actually needs, gets
**no CORS header at all** in the stock config. A browser `fetch()` from
Diorama's own origin (typically the HA frontend's origin, a different
host/port than the receiver's web server) will be **blocked by the browser**
even though the receiver's own web page can read it fine (same-origin).

**The honest fix** is a small lighttpd addition, in the exact syntax pattern
the shipped file already uses elsewhere (verified working syntax, generalized
to the missing path — this exact block was not found copy-pasted anywhere,
it is constructed here from the verified-working pattern):

```lighttpd
$HTTP["url"] =~ "^/tar1090/data/aircraft\.json$" {
    setenv.add-response-header = ( "Access-Control-Allow-Origin" => "*" )
}
```

dropped into a new file under `/etc/lighttpd/conf-enabled/` (or appended to
`88-tar1090.conf` and restarting lighttpd). Nginx/Apache-fronted installs
need the equivalent `add_header Access-Control-Allow-Origin *;` /
`Header set Access-Control-Allow-Origin "*"` directive on that location block
— same idea, different syntax, not independently verified against a live
Apache/nginx dump1090-fa install in this pass.

**Mixed content**: if the HA panel is served over `https://` (a reverse
proxy, Nextcloud/Cloudflare tunnel, etc.) and the LAN receiver is plain
`http://` (the overwhelming default for a Raspberry Pi ADS-B box), the
browser will **block the fetch outright as mixed content**, independent of
CORS — no header fixes this; the receiver itself needs TLS (self-signed +
user-trusted, or a local reverse proxy that terminates TLS) or the user needs
to fall back to a cloud source. This should be surfaced plainly in the UI
when a `local` source is configured and the panel's own origin is `https:`.

## 3. Home Assistant integrations (the HA-native path)

### 3.1 OpenSky core integration — poor fit, confirmed

Verified against the official docs
([home-assistant.io/integrations/opensky](https://www.home-assistant.io/integrations/opensky/)).
It is fundamentally an **entry/exit zone watcher**, not a live position feed:
it fires `opensky_entry` / `opensky_exit` **events** (not a continuously
updated multi-aircraft sensor) when a flight crosses into/out of a
configured circular region, with 4 attributes per event (`altitude` (m),
`latitude`, `longitude`, `icao24`). Default poll interval is **15 minutes**
— far too coarse for a live radar-style overlay, and the event model (not a
queryable "who's up there right now" state) doesn't fit "render every
aircraft currently in range" at all. **Confirmed poor fit for this feature.**

### 3.2 HACS: `AlexandrErohin/home-assistant-flightradar24` — a real (if fragile) option

Verified via the project's `README.md`
([source](https://github.com/AlexandrErohin/home-assistant-flightradar24)).
This one is more capable than expected: sensors like
`sensor.flightradar24_current_in_area` carry a **`flights` attribute holding
an array of full flight objects — including `latitude`/`longitude` — for
every aircraft currently in the configured area**, roughly 50 fields per
aircraft (callsign, registration, altitude, speed, heading, route,
photos, …). This genuinely IS a usable multi-aircraft position feed via HA,
contradicting a blanket "HA integrations can't do this" assumption. There is
also a single `device_tracker.flightradar24` entity, but it tracks only ONE
flight at a time (not one tracker per aircraft) — the `flights` attribute
array on the sensor entities is the real data source, not the device
tracker.

Caveats, all from the same source: it rides the **unofficial**
`FlightRadarAPI` library scraping flightradar24.com rather than an official
real-time feed (fragility risk if FR24 changes their site); the README states
*"This integration should only be used for your own educational purposes. If
you are interested in accessing Flightradar24 data commercially, please
contact business@fr24.com"* — an explicit non-commercial/educational-use
framing that a homeowner's private dashboard likely satisfies but is worth
surfacing to the user; the poll cadence is a configurable `scan_interval` with
no single verified default value (**UNVERIFIED** exact default). Net
verdict: a legitimate "let HA do the fetching, sidestep the browser CORS
problem entirely" path, at the cost of scrape-based fragility and an
educational-use framing — reasonable as a documented alternate ingestion
mode, not the recommended default.

### 3.3 HACS: `vingerha/ha_adsb_lol` — deprecated

Verified via the project's `README.md`
([source](https://github.com/vingerha/ha_adsb_lol)) — the README's own
banner states *"This project is no longer actively maintained. No further
updates, bug fixes, or security patches will be provided."* It appears to
track specific watched aircraft (by ICAO/callsign/registration filter) rather
than exposing a full-area position feed; the exact entity/attribute shape
was **not confirmed** in this pass because the doc doesn't show one. Given
the deprecation notice alone, **do not recommend building against it.**

### 3.4 Conclusion + a general-purpose HA-side proxy idea

HA-native integrations are a mixed bag, not a uniform "poor fit" — OpenSky
core is genuinely unusable for this feature; the deprecated adsb.lol
component is a dead end; but the fr24 HACS integration DOES expose real
per-aircraft positions, just with scraping fragility and softer ToS framing.
**None of the three is the recommended default** (§4 covers why
`airplanes.live` direct-fetch wins), but there's a more general pattern worth
designing for: HA's own `rest`/template sensor platform runs **server-side**
(no browser, no CORS) — a user could point an HA `rest` sensor at *any* of
the local-receiver or cloud JSON endpoints (including the CORS-blocked
`adsb.lol`/`adsb.fi`) and expose the (filtered/trimmed) result as one
entity's state+attributes; Diorama would then read it over the existing HA
WebSocket state channel exactly like every other bound entity — zero CORS
exposure, matching the "entity source" branch `weather.ts` already
implements for `WeatherConfig.source === 'entity'`. This is worth offering
as a genuine third `source` option (§7's `Store.flights.source`), not just a
workaround footnote — it's the only way to use `adsb.lol`/`adsb.fi` from the
browser without the user running a separate CORS proxy.

## 4. Cloud ADS-B APIs — verified comparison

All four rows below were tested LIVE with `curl -D - -H "Origin:
https://example.com" <url>` during this research pass (2026-07-25) against a
real query point (33.9425, -118.408 — near LAX, a busy-airspace stress test:
139 aircraft returned within 50 nm). Response bodies were also inspected
directly.

| Source | Endpoint | Response shape | Auth | Rate limit | **CORS (verified live)** | License / ToS |
|---|---|---|---|---|---|---|
| **airplanes.live** | `GET https://api.airplanes.live/v2/point/{lat}/{lon}/{radius_nm}` (≤250 nm) | `{ac:[...], msg, now, total, ctime, ptime}`; each aircraft object is **field-identical to `aircraft.json`** (`hex`/`flight`/`lat`/`lon`/`alt_baro`/`gs`/`track`/…) **plus two bonus fields**: `dst` (distance from the query point, nm) and `dir` (bearing from the query point, degrees) — pre-computed, no local math needed | none | **1 req/s** (documented; not independently load-tested) | **`access-control-allow-origin: *`** — open, browser-usable, verified via direct `curl` | Non-commercial use, "no SLA, no uptime guarantee" (per the official docs — the specific `api-guide`/`api-docs` pages 403'd a direct fetch in this pass; these figures come from web-search summaries of those pages, not a page I read myself — the URL/response-shape/CORS facts in this row ARE independently verified) |
| **adsb.lol** | `GET https://api.adsb.lol/v2/point/{lat}/{lon}/{radius_nm}` | same `{ac:[...]}` shape, same per-aircraft fields, confirmed byte-for-byte field-compatible via live sample | none today; docs say an API key will be required "in the future," issued to data contributors | "dynamic based on environment load" — **no documented number** | **NO `access-control-allow-origin` header** on GET or an OPTIONS preflight (which returns 405) — **browser `fetch()` is blocked today**, verified both ways | Data: ODbL 1.0 (per the `adsb.lol/docs/open-data/api/` page); API code: BSD-3-Clause |
| **adsb.fi** | `GET https://opendata.adsb.fi/api/v3/lat/{lat}/lon/{lon}/dist/{dist}` (≤250 nm; the `v2/lat/.../dist` path is explicitly deprecated with a DIFFERENT response shape — use v3) | same `{ac:[...]}` ADSBExchange-v2-compatible shape, confirmed via live sample | none | **1 req/s** (public); feeder endpoints 1/30s | **NO `access-control-allow-origin` header** — same verified-blocked result as adsb.lol | "Personal, non-commercial use only," **mandatory attribution to adsb.fi**; commercial use requires contacting the maintainers |
| **OpenSky `states/all`** | `GET https://opensky-network.org/api/states/all?lamin=&lomin=&lamax=&lomax=` | `{time, states:[[18-field array]...]}` — icao24/callsign/country/timestamps/lon/lat/baro_alt/on_ground/velocity/track/vertical_rate/sensors/geo_alt/squawk/spi/position_source/category | none (anon) or OAuth2 client-credentials (registered) | **anon 400 credits/day, registered 4000/day**, 1–4 credits per query scaled by bbox area (2024+ credit system) | **`access-control-allow-origin: https://opensky-network.org` — fixed, does NOT reflect the caller's Origin** (tested with two different Origin headers, got the same locked value both times) — cross-origin fetch from any other site is blocked by design | **Free tier is licensed for non-profit research/education only; "operational" integration into ANY product or service — even non-profit — requires a prior written agreement** with OpenSky |
| adsb.one (bonus, not in the original brief) | `GET https://api.adsb.one/v2/point/{lat}/{lon}/{radius}` | ADSBExchange-v2-compatible per its (now-archived) README | none | 1 req/s (documented) | **Returned live `HTTP 403`** on this pass's test request — service is either rate-limiting/blocking or has changed posture since its `api-archive` repo was archived (April 2026 per the repo). **Status unreliable/UNVERIFIED — do not recommend.** | — |

### 4.1 Recommendation

**Priority order:**

1. **A local receiver the user already owns**, if the CORS header is added
   (§2.2) and TLS/mixed-content is handled — freshest data, zero external
   dependency, no ToS to worry about, no per-request cost to anyone.
2. **`airplanes.live` direct browser fetch** — the only cloud API that works
   out of the box with zero extra infrastructure; recommend as the default
   `source: 'cloud'` implementation.
3. **`adsb.lol` / `adsb.fi` via an HA `rest`-sensor proxy** (§3.4) — same
   data quality, just needs the indirection since direct fetch is CORS-
   blocked; a reasonable "I don't want to hit a third party from the
   browser directly" or attribution-diversification option.
4. **OpenSky's REST API — do not use.** Blocked by both CORS and ToS.

**Poll cadence**: the brief's own suggestion of **5–10 s** at a **20–50 nm**
radius is well inside `airplanes.live`'s 1 req/s ceiling (a poll every 5 s is
0.2 req/s) and is a sensible freshness/politeness balance for a single-home
panel — no reason to poll faster than that for a decorative sky overlay.
(1 nm = 1852 m = 1,852,000 mm — needed for the radius↔plan-mm conversions in
§5.) Near a busy hub (LAX-adjacent, this pass's test point) a 50 nm radius
returned **139 aircraft** — worth a hard render cap (§7) the way the
neighborhood overlay caps building count.

## 5. Satellites (ISS + bright passes)

### 5.1 TLE sources

**Celestrak GP API** — `https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE`
(or `FORMAT=JSON`). Verified live: CORS is wide open
(`access-control-allow-origin: *`, confirmed via `curl`). Both response
shapes were fetched directly for the ISS:

```
ISS (ZARYA)
1 25544U 98067A   26205.47558714  .00010646  00000+0  20005-3 0  9992
2 25544  51.6316 115.5643 0006921 332.7863  27.2762 15.49141208577537
```

```json
[{"OBJECT_NAME":"ISS (ZARYA)","OBJECT_ID":"1998-067A","EPOCH":"2026-07-24T11:24:50.728896",
  "MEAN_MOTION":15.49141208,"ECCENTRICITY":0.00069219,"INCLINATION":51.6316,
  "RA_OF_ASC_NODE":115.5643,"ARG_OF_PERICENTER":332.7863,"MEAN_ANOMALY":27.2762,
  "EPHEMERIS_TYPE":0,"CLASSIFICATION_TYPE":"U","NORAD_CAT_ID":25544,
  "ELEMENT_SET_NO":999,"REV_AT_EPOCH":57753,"BSTAR":0.00020005445,
  "MEAN_MOTION_DOT":0.00010646,"MEAN_MOTION_DDOT":0}]
```

The JSON form is the standard CCSDS OMM field set — worth using over raw TLE
text since it avoids re-deriving mean elements from the fixed-column TLE
format. **Etiquette** (verified from Celestrak's own docs pages, fetched
directly): GP data is refreshed roughly **every 2 hours**; the official
guidance is explicit — *"CelesTrak only checks for new GP data once every 2
hours, so there is no need for you to check more often,"* cache locally,
never re-download identical data more than once per update cycle, and back
off immediately on any 403 (repeat offenders get firewalled; high-volume
groups now carry an enforced 250 MB/day cap). **A 6–12 h client cache TTL is
comfortably good citizenship** — well above their own 2 h floor.

**ivanstanojevic tle-api / N2YO**: not independently investigated in depth.
N2YO requires an API key (registration) and is rejected on that basis alone,
consistent with the precedent `weather.ts`/OpenFreeMap set of preferring
keyless, CORS-open services — Celestrak already covers the TLE-source need
with no registration, so there's no reason to add a second, key-gated source.
**UNVERIFIED / not pursued further.**

### 5.2 Position-API alternative: `wheretheiss.at`

`GET https://api.wheretheiss.at/v1/satellites/25544` — verified live via
`curl`. Response fields (12, verified from the official developer docs page):
`name`, `id`, `latitude`, `longitude`, `altitude`, `velocity`, `visibility`,
`footprint`, `timestamp`, `solar_lat`, `solar_lon`, `units`. **CORS**:
`access-control-allow-origin: *`, verified live. **Rate limit**: verified
directly from the live response's own headers — `X-Rate-Limit-Limit: 350`,
`X-Rate-Limit-Interval: 5 minutes` (≈1.17 req/s sustained average, consistent
with the docs' own "roughly 1 per second" description). **Coverage**:
currently **ISS only** — the docs state plainly *"Currently, there is only
one [satellite]… But in the future, we plan to provide more,"* discoverable
via `GET /v1/satellites`. Zero client-side math required — genuinely the
cheapest possible "put a dot where the ISS really is right now" integration.

### 5.3 SGP4 cost analysis

**(a) Full SGP4 port.** The algorithm (Vallado's reference implementation,
the common ancestor of essentially every SGP4 library) models secular
gravitational perturbations, a specific atmospheric-drag density model tied
to the TLE's own `BSTAR` term, and — for deep-space/high-altitude objects —
resonance terms (the SDP4 branch; irrelevant for LEO/ISS but relevant if
"satellites" ever means more than the ISS). This is meaningfully more
intricate than the Keplerian two-body + a handful of named perturbation
terms `sky-astro.ts` already implements for the Sun/Moon/planets (§5.3's
"Methods" comment in that file cites Schlyter's few-arcminute-accuracy
low-precision formulas) — SGP4 is a SPECIFIC, well-known-to-be-easy-to-
subtly-break algorithm; that is *why* dedicated, heavily-tested libraries
persist rather than everyone hand-rolling their own. **Recommend against a
from-scratch SGP4 port for v1** — the effort/risk is out of proportion to a
decorative sky feature, unlike `sky-astro.ts`'s Schlyter port which is a much
gentler, more forgiving algorithm family.

**(b) `satellite.js`.** Verified via the live npm registry: the current
release is **v7.1.0**, and its `package.json` (fetched directly) shows it is
now built from **C++ source compiled to WebAssembly via emscripten**
(`src-cpp/SGP4.cpp`, `wasm:build` scripts) — a real architectural shift from
the historical pure-JS library most existing writeups describe. A WASM
dependency means an async instantiation step, a binary blob to fetch/cache,
and (for any multi-threaded build variant) potential COOP/COEP header
requirements — real integration friction against Diorama's synchronous,
zero-npm-dependency pure-module conventions. **The last pure-JS release is
`v4.1.4`** (verified via the npm version list — everything from `v6.0.0`
onward is the WASM rewrite); measured directly by downloading and gzipping
it: **22,873 bytes minified / 10,930 bytes gzipped**. Either way — WASM or
the old pure-JS build — this would be Diorama's **first runtime npm
dependency beyond `lit` and `three`**, a real precedent change worth an
explicit product decision, not something to slip in quietly.

**(c) `wheretheiss.at` + dead reckoning (ISS only).** Zero code, live-truth
accurate at request time (bounded only by wheretheiss.at's own backend
quality, not by TLE staleness Diorama would have to manage), and a
constant-velocity extrapolation between the ~5 s polls is reasonable given
the ISS's near-constant ~7.66 km/s orbital speed. **Real limitations**: ISS
only, and — critically — **it can only answer "where is it right now," never
"where will it be in 3 hours,"** so it cannot support pass prediction (§5.4)
without either polling continuously while the panel happens to be open
(impractical — an ISS orbit is ~92 min, a visible pass lasts a few minutes,
you'd need the panel open at exactly the right moment) or being paired with
*some* propagator anyway.

**Honest error-budget note** (general SGP4/TLE literature, web-search
sourced — not independently re-derived or benchmarked in this pass, flagged
as **weaker sourcing than the directly-verified facts above**): published
TLE-vs-truth studies report SGP4 position error growing from roughly 1–5 km
at 24 h since epoch to tens of km after a week for LEO objects, driven mostly
by the TLE's fixed drag term not tracking real-time atmospheric density
changes. Celestrak refreshes ISS elements multiple times daily (its own
"check every 2 h" cadence, §5.1), so a same-day-fresh TLE propagated with a
FULL, correct SGP4 implementation should stay in the low single-digit-km
range for several hours — good enough for a sky dot and a pass-timing
estimate accurate to roughly a minute, nowhere near good enough for precise
telescope pointing. A **simplified, non-SGP4** propagator (see below) adds
some further unquantified error on top of that baseline; this doc cannot
give a defensible number for that gap without actually building and
benchmarking one — flagged as an open question, §7.

**(d) A "poor man's SGP4"** — mean-anomaly-only linear propagation from the
TLE's `MEAN_MOTION`/`EPOCH`, treating inclination/RAAN/argument-of-pericenter
as constant (optionally adding the well-known basic J2 nodal-regression
term), reusing `sky-astro.ts`'s existing Kepler-equation solver and
heliocentric→geocentric machinery almost unchanged. For the ISS specifically
this is unusually well-suited: its live-fetched TLE (§5.1) has
`ECCENTRICITY: 0.00069219` — essentially circular, so the eccentricity-
dependent error terms that make elliptical-orbit propagation hard are
close to a non-issue. **Not built or benchmarked in this pass** — flagged as
the concrete v2 candidate if multi-satellite support is wanted without
adopting `satellite.js`.

### 5.4 Pass prediction basics

Given ANY propagator that can answer "alt/az at time T" (i.e., NOT
`wheretheiss.at` alone, which only answers "at time now"), a pass-prediction
scan is straightforward and cheap: step forward in small time increments
(e.g., 30–60 s) over the next several hours, compute the satellite's
altitude above the observer's horizon at each step (reusing `sky-astro.ts`'s
existing `raDecToAltAz` machinery once the propagator yields RA/Dec or
alt/az directly), and report windows where `altitude > 10°` (a common
"worth looking up for" threshold) as pass start/peak/end. **Visibility/
brightness** (is the pass actually visible, i.e. is the satellite sunlit
while the observer is in twilight/darkness) is a standard, if slightly
fiddly, follow-on computation — test whether the observer's local sun
altitude is below some threshold (dusk/dark) AND whether the satellite's
position lies outside Earth's shadow cylinder (a satellite well above the
observer's horizon is *usually* still sunlit at ISS altitude ~400 km even
when the ground is dark, except right around the pass's very start/end) —
entirely reusable existing `sunRaDec` math from `sky-astro.ts`, no new
dependency. **Recommend deferring both** to a v2 gated on the §5.3
propagator decision — neither is buildable against `wheretheiss.at` alone,
and building a propagator JUST to unlock pass prediction (rather than
starting from "we already have one for multi-satellite support") is a
weaker cost/benefit case.

## 6. Diorama design sketch (facts feeding the design — not the final architecture)

### 6.1 Coordinate mapping — the real fork, verified against the live renderer

`geo.ts`'s `latLonToPlan(transform, lat, lon)` already converts any lat/lon
into plan-frame millimetres through the calibrated `GeoTransform` — but it
was built for GPS pins and neighborhood buildings, both within tens to a few
hundred metres of the house. An aircraft at a modest 20 nm range sits
**≈37,040,000 mm** away in real units (1 nm = 1852 m, verified conversion).
Verified directly in `three-renderer.ts`: the camera's far clip plane is
`150,000` mm (`new THREE.PerspectiveCamera(50, w/h, 10, 150000)`, line 1986)
and the sky dome is a `SphereGeometry(30000, …)` (line 11798) — so a literal
`latLonToPlan` feed would place a 20 nm-out aircraft **~250× past the sky
dome itself**, useless without compression.

**Two independent compression curves are needed** (radius and altitude are
different domains — don't conflate them into one function):

- **Horizontal**: map the TRUE bearing (preserve exactly — `dir`, already
  provided by the cloud APIs per §4, or derivable from `planBearingDeg` in
  `geo.ts`) at a COMPRESSED radius. An asymptotic curve
  (`displayR = maxR · dist / (dist + k)`, never exceeding `maxR`) or a log
  curve (`displayR = maxR · log(1+dist/scale) / log(1+maxDist/scale)`) both
  work; `maxR` should land comfortably inside the 30,000 mm sky dome (e.g.
  20,000–26,000 mm) so aircraft never visually clip through the dome
  geometry. **Diorama already has an established idiom for exactly this
  "real position clamped into a bounded display shell along the true
  bearing" trick** — `geo.ts`'s `clampToBoundary` (built for GPS pins beyond
  the yard boundary, ray-from-centre clamp to a rect edge) — cite it
  directly as prior art for the pattern, even though the aircraft case needs
  a smooth compression curve rather than a hard clamp (aircraft should
  visibly get closer as they approach, not snap to a fixed ring).
- **Vertical (altitude)**: `alt_baro` feet → mm is a literal `× 304.8`
  conversion (1000 ft = 304,800 mm; 40,000 ft = 12,192,000 mm) — needs its
  own compression into a display band, e.g. 3,000–25,000 mm via a log or
  clamped-linear curve, independent of the horizontal curve's domain/range.
  The `alt_baro === "ground"` sentinel (§2.1) should almost certainly be
  filtered out entirely (a taxiing/parked aircraft isn't a "flight overhead"
  — treat "airborne only" as the v1 scope, matching the feature's own
  framing).
- **Honesty caveat, matching the neighborhood doc's §3 precedent**: once both
  curves are non-linear and independent, aircraft will NOT render at a
  consistent, comparable scale to each other or to the house — a 737 at
  20,000 ft and a Cessna at 3,000 ft will not "look right" relative to real
  physics, only relative to each other in a rough, decorative sense. This
  needs the same explicit "not to scale — decorative" user-facing framing
  the neighborhood building-height dial already establishes as house style.

### 6.2 Existing reuse points (read directly from the live codebase)

- **`_buildBgAircraft` / `_buildBanner` / `_advanceBgAircraft`**
  (`three-renderer.ts`, ~line 10722 onward) — the shipped toy tow-plane/news-
  chopper rig that already builds a small toon airplane from primitive
  boxes/cones via `_mat()` and animates it along a path per frame. It's the
  closest existing precedent for "a small toy-scale aircraft object moving
  through the scene," but its motion model is a FIXED circular orbit — real
  ADS-B-driven aircraft need position/heading driven by actual polled deltas,
  not an authored loop. Reuse the primitive-composition style, the
  `_mat()`/outline-skip/no-blob-shadow conventions (aircraft, like weather
  particles, are compressed/decorative, not "real" scaled furniture — treat
  them the same way the weather `PointsMaterial`/`SpriteMaterial` exemptions
  are documented), and the per-instance-rig-in-an-array pattern (`BgRig`) —
  not the fixed-orbit math itself.
- **Sky-astro observer resolution** (`three-view.ts`, ~lines 591–610,
  read directly): `geoFit()`'s calibrated landmark origin is preferred, with
  a fallback to `weather.lat/lon` when no geo landmark is calibrated. This
  EXACT fallback chain is the right one to reuse for both the aircraft
  radar's ground-truth origin (bearing/distance math needs a real lat/lon
  centre) and the satellite pass-observer math — don't invent a second
  "where is the house" resolution path.
- **`alerts.ts`'s `PanelAlert`** (read directly, lines 1–76) — a clean
  existing "things that need a human's attention" sink
  (`id`/`source`/`severity`/`title`/`message`/`createdAt`/`dismissible`) with
  its own topbar bell/badge/drawer UI already built. A new `AlertSource`
  variant (e.g. `'flight'`) is a natural home for "low overflight" / "ISS
  pass starting" notifications, reusing the existing UI rather than building
  a parallel notification surface.
- **`_isSlowEntity` config-path idiom** (read directly, `planner.ts` ~line
  2035) — relevant ONLY if a bound-entity ingestion source is added (§3.4's
  HA `rest`-sensor-proxy option); a bound flight-data entity id would join
  the growing list of scoped-to-current-floor/feature config-path checks
  there. The direct-fetch cloud/local sources (§4) are poll-based, like
  weather — no `_isSlowEntity` involvement.
- **`_reconfigureWeather` poll lifecycle** (read directly, `planner.ts`
  ~line 4690) — the exact shape to mirror: clear any existing timer, branch
  on the configured source, `setInterval` a poll function, and wire a
  one-time init guard (`_weatherInited`-style boolean) into
  `_applyLoadedStore`. Flights should get an equivalent `_reconfigureFlights`
  / `_flightsInited` pair; satellites can either share it (if bundled under
  one `Store.sky` field) or get their own, much slower (hours-cadence) timer
  given the TLE refresh etiquette in §5.1.

### 6.3 Alerting triggers worth v1

- **Low overflight**: filter the already-polled aircraft list for altitude
  below a user threshold within the configured radius — cheap, no new fetch.
- **Watched callsign/hex list**: string match against `flight`/`hex`, already
  present in the normalized poll data — cheap.
- **ISS visible pass starting**: with the §5.2 `wheretheiss.at`-only v1, this
  reduces to a live EDGE-DETECTOR — "ISS altitude (from `sky-astro.ts`'s
  `raDecToAltAz` given the polled lat/lon) just crossed above the horizon
  threshold" — not a pre-computed prediction, avoiding the need for a
  propagator in v1. True advance-notice pass prediction needs §5.4's
  propagator and is a v2 feature.
- **Surface**: `alerts.ts`'s `PanelAlert` feed (§6.2) is the natural sink. A
  thought-bubble tier (CLAUDE.md's "recent-trigger" `BUBBLE_POOL_TRIGGER`
  idiom — avatars glancing up at a low flyover) is a plausible, low-cost v2
  nice-to-have, not required for v1. An HA `notify.*` fire-and-forget service
  call (mirroring the existing geo-calibration notify pattern already in
  `planner.ts`) is a reasonable opt-in "ping my phone for an ISS pass"
  affordance for a genuinely rare event.

## 7. Integration checklist

1. **`Store.flights?: FlightTrackingConfig`** (opt-in, store-level like
   `Store.weather`/`Store.neighborhood` — not per-floor; add to
   `Planner._loadFromHa`'s explicit field list and `_applyHistorySnapshot`'s
   field set, per the CLAUDE.md "any new top-level field resets on load if
   you forget this" gotcha): `enabled?`, `source?: 'local' | 'cloud' |
   'ha_entity'`, `localUrl?` (LAN receiver's `aircraft.json` URL), `cloudProvider?:
   'airplanes_live' | 'adsb_lol' | 'adsb_fi'` (default `airplanes_live`),
   `haEntityId?` (the `source: 'ha_entity'` rest-sensor-proxy id),
   `radiusNm?` (default ~30, clamp e.g. 5–250), `minAltFt?`/`maxAltFt?`
   filters, `pollSeconds?` (default 5–10, clamp against the provider's rate
   limit), `alerts?: { lowOverflightFt?, watchList?: string[] }`,
   `verticalScaleMode?`/compression-curve tuning knobs per §6.1.
2. **`Store.satellites?: SatelliteConfig`** (or fold into the same
   `flights`/`sky` object if the product call is "one feature") — `enabled?`,
   `issOnly?: true` (v1 hard default), `pollSeconds?` (default 5, well under
   wheretheiss.at's ~1.17 req/s measured ceiling), pass-alert threshold.
3. **Pure normalization module** — `src/flights.ts` (three.js-free, mirrors
   `weather.ts`'s shape): a `FlightPoint` type covering the fields §2.1/§4
   both share (`hex`/`flight`/`lat`/`lon`/`altFt`/`gsKt`/`trackDeg`/
   `vertRateFpm`/`category`/`squawk`/`onGround`/`seenS`), one normalizer per
   source (local `aircraft.json`, airplanes.live/adsb.lol/adsb.fi's shared
   `{ac:[...]}` shape — genuinely one parser given the confirmed field
   compatibility, §4's live-verified sample — and OpenSky's positional array
   shape ONLY if the `ha_entity` proxy route ever exposes it), plus the pure
   §6.1 compression-curve math (`compressRadiusMm(distNm, maxR)`,
   `compressAltitudeMm(altFt, band)`) so it's independently testable.
4. **Fetch isolation** — `src/adsb-sources.ts` (weather.ts-style: the ONLY
   file that calls `fetch()` for this feature, try/catch, null-on-failure,
   never throws into the RAF/tick path), covering local + each cloud
   provider. Keep it separate from `flights.ts` so the pure normalizer stays
   dependency-free and fixture-testable without network mocking.
5. **Satellite math** — extend `sky-astro.ts` (it already owns Sun/Moon/
   planet ephemerides and the RA/Dec↔alt/az + observer machinery) with an
   ISS-position consumer of `wheretheiss.at`'s already-lat/lon/alt output
   (no propagation needed for v1 — just az/alt from a live-fetched position,
   reusing `raDecToAltAz`-adjacent geometry or a simpler direct-from-lat/lon-
   alt/az conversion). Keep any FUTURE propagator (§5.3d) in a sibling pure
   module (`src/sgp4-lite.ts` or similar) rather than bolting drag/secular-
   perturbation math into `sky-astro.ts`'s Keplerian code — different
   algorithm family, don't blur the two.
6. **Planner wiring** — `_reconfigureFlights()` / `_flightsInited`,
   `_reconfigureSatellites()` / `_satInited`, both mirroring
   `_reconfigureWeather()`'s exact shape (§6.2): clear timer, branch on
   source, `setInterval` poll, one-time init guard wired into
   `_applyLoadedStore`. Runtime-only results (`Planner.flightsNow`,
   `Planner.issNow`) — never persisted, like `weatherNow`/`blePeople`.
   `emitConfig()` on each successful poll (bumps `configRev` for the dirty
   key, §7's next item) or on no-op when nothing changed, matching the
   weather idiom.
7. **Renderer group + dirty key + per-frame advance** — a new
   `_flightsGroup`/`_satGroup` in `three-renderer.ts` (NOT part of
   `clearTransientGroups` if aircraft should persist visually across a floor
   switch — they're not floor-relative, more like `_skyGroup`; a genuine
   design call, not resolved here). Dirty key folds `configRev` + a coarse
   hash of the polled aircraft list (hex + bucketed position/altitude,
   mirroring the neighborhood overlay's `fetchedAt`-changed idiom) so a
   completed poll triggers exactly one rebuild. Per-frame motion (position
   interpolation between polls, since a 5–10 s poll cadence would otherwise
   look like a jump-cut) should be a `_advanceFlights(dt)` call from
   `_animate`, zero-allocation, mutating persistent per-aircraft rig
   transforms in place — the same "dead reckoning between polls" pattern
   `wheretheiss.at`'s use case needs anyway (§5.3c), reusable for BOTH
   satellites and aircraft.
8. **Settings ▸ Integrations block** — enable/source/provider/radius/poll
   controls (mirrors the `mqttBridge`/`neighborhood` Integrations-tab
   precedent), with an explicit privacy/network-cost disclosure line (the
   OpenFreeMap-precedent pattern: "sends your configured location to
   `<provider>`, a third-party service — see their terms"). Sidebar controls
   for altitude filters, watch-list entries, and the alert thresholds (§6.3).
9. **Test pages** — fixture JSON captured from a REAL `aircraft.json`/
   `airplanes.live` response (this research pass already has a verified,
   real 139-aircraft LAX-area sample that could seed the fixture) for the
   normalizer; a synthetic TLE + known-truth alt/az fixture (mirroring
   `sky-astro-test.html`'s golden-value approach) for any propagator work;
   pure compression-curve math tested in isolation (never-exceeds-maxR,
   monotonic, ground-sentinel filtering).
10. **Offline/demo inert** — `Store.flights.enabled`/`Store.satellites.enabled`
    default `false`/absent, matching every other opt-in network-calling
    `Store` field (`weather`, `neighborhood`, `mqttBridge`) — a fresh/demo
    config never fetches anything unprompted; `LocalApi`/offline mode is
    irrelevant to this feature the same way it's irrelevant to
    `weather.ts`'s Open-Meteo calls (§7.9 of the neighborhood doc's
    reasoning applies verbatim: "offline" means no HA backend, not no
    internet — a real browser with internet still fetches fine).
11. **Licensing/attribution obligations** — `adsb.fi` REQUIRES attribution
    (verified, §4); `adsb.lol`'s data carries an ODbL 1.0 license (verified)
    which itself has share-alike/attribution norms; `airplanes.live`'s
    non-commercial framing (per its docs, not independently re-verified page
    text in this pass) should be surfaced to the user even though Diorama
    itself isn't reselling the data. Recommend a small, persistent credit
    line whenever a cloud provider is active — reusing the OpenFreeMap
    attribution-chip design precedent (§7.8 of that doc) rather than
    inventing new UI for it. Celestrak's usage policy (§5.1) has no
    attribution requirement found, but the caching-etiquette obligations
    (≥6–12 h TTL) are a real compliance-adjacent constraint worth enforcing
    in code, not just documenting.

## 8. Open questions & risks

- **Compression-curve tuning is a genuine design/product call**, not a math
  problem — what `maxR`/altitude band "looks right" against a given house's
  scale is subjective and will need iteration against the real renderer, not
  something this research pass can pin down from first principles.
- **Simplified-propagator error budget is unquantified.** §5.3's honest
  statement ("good enough for a dot and rough pass timing, not for precision
  pointing") is as far as this pass could verify without actually building
  and benchmarking a propagator against a real high-fidelity reference — a
  concrete "expect ± N km / ± M seconds" number needs real implementation
  work, not just more research.
- **`airplanes.live`'s exact ToS/rate-limit page could not be fetched
  directly** in this pass (403 on `api-guide`/`api-docs`) — the 1 req/s and
  non-commercial figures come from web-search-summarized excerpts of those
  pages, not a page this pass read itself, even though the URL/response-
  shape/CORS facts in the same row ARE independently `curl`-verified. Worth
  a direct re-check (perhaps via a different fetch path / the Wayback
  Machine) before shipping copy that quotes their ToS verbatim.
  **adsb.one's live `403`** during this pass is also unresolved — possibly a
  transient block from the multiple rapid test requests made here, possibly
  a genuine service-status change since its GitHub repo was archived; not
  chased further given `airplanes.live` already covers the "one open-CORS
  cloud source" need.
  **fr24 HACS integration's default `scan_interval`** was not confirmed to a
  specific number.
- **Aircraft density performance ceiling.** 139 aircraft in a single 50 nm
  query (LAX-adjacent test point) suggests a busy-airspace worst case needs
  the same "hard cap + nearest-first" safety valve the neighborhood overlay
  applies to building counts (its own §10 flags this as unresolved/needs-
  profiling too) — not sized here.
- **Where the aircraft/satellite groups sit relative to `clearTransientGroups`
  and floor switches** (persist across floors like `_skyGroup`, or rebuild
  like `_neighborhoodGroup`'s ground-floor-only precedent) is a real
  architectural fork the neighborhood doc had to make explicitly and this
  one should too — not resolved here, flagged for the implementer.
- **Whether to build the §5.3d simplified propagator at all**, versus staying
  ISS-only + `wheretheiss.at`-only indefinitely, versus taking the WASM
  `satellite.js` dependency — a genuine three-way product decision this
  research pass surfaces but does not make.

## 9. Sources

- [wiedehopf/readsb `README-json.md`](https://github.com/wiedehopf/readsb/blob/dev/README-json.md) — full `aircraft.json` field inventory, units, `alt_baro:"ground"` sentinel, update cadence (fetched directly).
- [flightaware/dump1090 `README-json.md`](https://github.com/flightaware/dump1090/blob/master/README-json.md) — dump1090-fa's equivalent field doc.
- [wiedehopf/tar1090 `88-tar1090.conf`](https://raw.githubusercontent.com/wiedehopf/tar1090/master/88-tar1090.conf) — the live shipped lighttpd config, fetched directly; source of the verified "no CORS on aircraft.json by default" finding.
- [sdr-enthusiasts/docker-adsb-ultrafeeder](https://github.com/sdr-enthusiasts/docker-adsb-ultrafeeder) / [docker-tar1090](https://github.com/sdr-enthusiasts/docker-tar1090) — ultrafeeder/adsb.im bundles readsb+tar1090, same shape.
- [Home Assistant OpenSky integration docs](https://www.home-assistant.io/integrations/opensky/) — event model, 15 min default poll, 4-attribute entry events.
- [AlexandrErohin/home-assistant-flightradar24 `README.md`](https://github.com/AlexandrErohin/home-assistant-flightradar24) — `flights` attribute array shape, educational-use ToS line, `device_tracker` single-flight caveat (fetched directly).
- [vingerha/ha_adsb_lol `README.md`](https://github.com/vingerha/ha_adsb_lol) — deprecation notice (fetched directly).
- Live `curl` tests against `api.airplanes.live`, `api.adsb.lol`,
  `opendata.adsb.fi`, `opensky-network.org/api/states/all`,
  `api.adsb.one`, `celestrak.org/NORAD/elements/gp.php`,
  `api.wheretheiss.at/v1/satellites/25544` (this research pass, 2026-07-25) —
  source of every CORS-header, rate-limit-header, and response-shape claim
  marked "verified live" above.
- [adsb.lol open-data API docs](https://www.adsb.lol/docs/open-data/api/) — ODbL 1.0 license line.
- [adsbfi/opendata `README.md`](https://github.com/adsbfi/opendata/blob/main/README.md) — endpoint list, v2-deprecated note, 1 req/s limit, attribution requirement.
- [airplanes-live/api-archive `README.md`](https://github.com/airplanes-live/api-archive/blob/main/README.md) — endpoint shape (this is actually the adsb.one archived repo content, cross-referenced; see §8's caveat on ToS-page sourcing).
- [OpenSky Network REST API docs](https://openskynetwork.github.io/opensky-api/rest.html) — `states/all` field order, OAuth2 credit system.
- [OpenSky Network Terms of Use](https://opensky-network.org/about/terms-of-use) — non-profit-only license, "operational use requires a written agreement" clause.
- [CelesTrak GP data formats](https://celestrak.org/NORAD/documentation/gp-data-formats.php) — `gp.php` query parameters, format options (fetched directly).
- [CelesTrak Usage Policy](https://celestrak.org/usage-policy.php) (referenced via search) — 2 h refresh cadence, caching etiquette, abuse-enforcement note.
- ["Where the ISS at?" REST API docs](https://wheretheiss.at/w/developer) — field list, "currently ISS only" statement.
- `npm` registry `satellite.js` package metadata (fetched directly) — v7.1.0, WASM/emscripten build scripts, version history back to v1.2.0.
- Direct measurement of `unpkg.com/satellite.js@4.1.4/dist/satellite.min.js` (downloaded + gzipped in this pass) — 22,873 B minified / 10,930 B gzipped.
- General SGP4/TLE accuracy-degradation literature (web-search-sourced summaries of academic/technical sources — ResearchGate, AMOS technical papers, arXiv; not independently re-derived) — the "1–5 km at 24 h → tens of km after a week" LEO error-growth figures, flagged as secondary sourcing in §5.3.
- Diorama repo internals (read directly): `src/geo.ts` (`latLonToPlan`,
  `clampToBoundary`, `planBearingDeg`), `src/weather.ts` (the 3-source
  config pattern, fetch isolation, poll-lifecycle idiom this doc's §6.2/§7
  mirror), `src/sky-astro.ts` (Schlyter ephemerides, `raDecToAltAz`,
  epoch-ms-parameterized pure-module convention), `src/alerts.ts`
  (`PanelAlert` shape), `src/three-renderer.ts` (camera far plane = 150000,
  sky dome radius = 30000, `_buildBgAircraft`/`_buildBanner` tow-plane rig —
  all read directly at their live line numbers), `src/ui/three-view.ts`
  (sky-astro observer-resolution fallback chain), `src/planner.ts`
  (`_reconfigureWeather`, `_isSlowEntity` — read directly),
  `docs/research/neighborhood-openfreemap.md` (structure/rigor precedent,
  the `clampToBoundary`/attribution-chip/opt-in-Store-field/phased-build
  patterns this doc reuses), CLAUDE.md ("Sky backdrop, sun & moon props",
  "Playful background text", "Weather core", "Geo reference & GPS device
  pins", the `_isSlowEntity`/dirty-key/lazy-3D-chunk conventions).

---

## §2.9 — CORRECTION, re-probed 2026-08-15 (supersedes §2's source landscape)

The 2026-07 conclusion — "airplanes.live is the only CORS-open keyless ADS-B
API; never add OpenSky" — **no longer holds, and the browser-direct transport
for cloud sources is retired.** All three were re-probed with curl AND a real
headless browser fetching from a foreign origin.

| provider | curl | `access-control-allow-origin` | browser fetch |
|---|---|---|---|
| airplanes.live | **403** for everyone | — | fails |
| adsb.lol | 200 + data | **absent entirely** | `TypeError: Failed to fetch` |
| OpenSky | 200 + data | `https://opensky-network.org` only | `TypeError: Failed to fetch` |

airplanes.live's 403 body: `{"error": "Please contact us at
contact@airplanes.live. Your email MUST include a link to your project if you
have one, a description of the project, and what your user base is."}` — a
POLICY change, not an outage; a browser User-Agent does not change it. adsb.fi's
v2 path 404s and adsb.one 403s.

**The distinction that governs the design**: CORS is enforced by the *browser*,
never by curl. A URL that returns perfect JSON in a terminal can still be
unreadable to the panel's JavaScript. Anyone reporting "but this URL works" is
correct and is not contradicting the finding.

**OpenSky's "ToS-forbidden" note is withdrawn.** Their terms cover personal,
non-commercial use, which is what a private home panel is. Anonymous access is
metered in credits (~400/day; ~4000 with an account; 1–4 credits per bounding-box
request) — hence the 60 s default poll for that source.

### §2.10 — the `rest_command` proxy transport

Both new sources are fetched by Home Assistant, not the browser, via a
user-defined `rest_command` called with `return_response: true` (the same
mechanism `weather.get_forecasts` and `calendar.get_events` already use).

```yaml
rest_command:
  diorama_opensky:
    url: >-
      https://opensky-network.org/api/states/all?lamin={{ lamin }}&lomin={{ lomin }}&lamax={{ lamax }}&lomax={{ lomax }}
    method: GET
    timeout: 20
    # Optional but recommended (raises the credit budget):
    # username: !secret opensky_user      # legacy basic-auth accounts
    # password: !secret opensky_pass
    # headers:                            # newer OAuth2 client-credential accounts
    #   Authorization: !secret opensky_bearer
```

adsb.lol is the same with `url: https://api.adsb.lol/v2/lat/{{ lat }}/lon/{{ lon }}/dist/{{ dist }}`.

The URL is templated rather than baked so changing the radius never means
editing YAML. HA's `rest_command` does basic auth natively; an OAuth2
client-credentials account needs a token minted outside HA and passed as an
`Authorization` header, which is why the emitted YAML comments both forms.

**Shape note:** adsb.lol returns the readsb `{ac:[…]}` structure and reuses
`normalizeAircraftList` unchanged. OpenSky returns POSITIONAL state arrays in SI
units and needs `normalizeOpenSkyStates` (m→ft, m/s→kt, m/s→ft/min, trimmed
callsign), and carries no registry enrichment or dbFlags — so registration, type,
operator and the military/PIA/LADD flags are unavailable on that source.

### §2.11 — the same proxy retires the §2.2 CORS problem (2026-08-15)

§2.2 above solves the LAN-receiver CORS gap by adding a header to the receiver,
and correctly notes that **no header fixes mixed content** — an HTTPS panel can
never fetch an HTTP receiver. Once the `rest_command` transport of §2.10 exists,
both restrictions have a second, better answer: point the proxy at the
receiver's own URL and let Home Assistant fetch it.

```yaml
rest_command:
  diorama_local_adsb:
    url: http://192.168.1.50/tar1090/data/aircraft.json
    method: GET
    timeout: 10
```

No coordinates are involved, so unlike the OpenSky/adsb.lol blocks this one
needs no Jinja — it is static. A server-side fetch sends no `Origin` and
triggers no preflight, so the §2.2 lighttpd block becomes unnecessary and the
receiver is not touched at all; and HA↔receiver is server-to-server while
panel↔HA is same-origin, so mixed content does not arise. **§2.2's fix is still
correct and still useful** for an HTTP panel whose owner would rather not depend
on HA — which is why the local proxy is OPTIONAL in the implementation (an empty
service name means "keep fetching directly"), unlike the cloud sources where it
is mandatory.

Two caveats worth stating to the user, both surfaced in the settings UI: HA must
be able to reach the receiver itself (fine for ordinary Docker bridge
networking), and the poll now costs an HA service round-trip per cycle.

Also better than the `entity`-sensor workaround §3.4 sketches: a REST sensor
pushes the whole aircraft list through HA's state machine and recorder as
attributes every poll, whereas `return_response` bypasses the state machine
entirely.

**Offline consequence.** Every source that routes through HA — `opensky`,
`adsblol`, `entity`, and a proxied `local` — is unreachable in an offline or
gh-pages panel. The implementation reports that as a distinct `needs-ha` status
rather than a fetch error (nothing was ever fetched, so an error would be a
lie). The two sources that genuinely work with no Home Assistant are the
synthetic `demo` source and `local` with a browser-reachable URL — and a local
config that names a proxy command demotes to the direct fetch when offline
rather than refusing. The ISS is unaffected throughout: separate CORS-open feed.
