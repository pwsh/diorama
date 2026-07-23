# Neighborhood Overlay via OpenFreeMap — Build-Ready Research

Status: research complete, not yet implemented. Scopes the brief "render the
surrounding neighborhood (buildings + roads) around the house, sourced from
OpenFreeMap, aligned to the existing GPS landmarks, user-tunable" into a
concrete design that slots into Diorama's established geo/yard/renderer
patterns rather than inventing a parallel mapping stack.

## 1. Summary

OpenFreeMap is a free, no-signup, no-rate-limit vector-tile hosting service
serving unmodified **OpenMapTiles**-schema data extracted from OpenStreetMap
(OSM), refreshed weekly. Its data model already carries per-building
`render_height`/`render_min_height` (metres, pre-computed from OSM
`height`/`building:levels` tags with a documented fallback constant), road
centerlines classified by type, water polygons, and land-use polygons — i.e.
almost exactly the layers the brief asks for ("buildings + roads + other
elements, depending on OpenFreeMap's limits").

The one real design fork is **how to consume it**. Diorama has a hard rule
against pulling heavy client libraries into the startup graph (the whole
three.js renderer is already lazy-chunked) and a hard *aesthetic* rule (no
PBR, no external map styling — everything is `MeshToonMaterial` via `_mat()`).
MapLibre GL JS — the library every OpenFreeMap example uses — is a second
full WebGL renderer with its own styling engine and a real Mercator-projected
camera; running it *and* three.js side by side, or trying to make its output
match the Sims-toon look, is a bad fit on every axis (bundle size,
GPU-context contention, visual clash, no code reuse with the geo/pure-module
conventions this codebase already has). This doc recommends instead: **fetch
the raw vector tiles directly, decode the small slice of Mapbox Vector Tile
(MVT) wire format Diorama actually needs with a hand-rolled zero-dependency
decoder (mirroring the existing `mqtt-ws.ts` codec precedent), and extrude
the results into ordinary toon-material three.js meshes** using the exact
`ShapeGeometry`/skirt/ribbon techniques already shipped for terraces, ground
areas, and paths. This keeps the whole feature inside Diorama's existing
"pure module + renderer builder + dirty key" recipe, adds zero npm
dependencies (the repo currently has exactly two runtime deps: `lit` and
`three`), and gives full control over the toon look.

Positioning reuses `src/geo.ts`'s existing landmark-calibrated
`GeoTransform` unchanged — a vector-tile vertex is converted to lat/lon by
the *exact, radius-free* inverse Web Mercator tile formula, then fed through
the SAME `latLonToPlan` every GPS pin and geo landmark already uses. The one
approximation in that path (Diorama's own equirectangular local-tangent-plane
fit) is already in production for GPS pins and is provably negligible at
neighborhood scale (see §5) — there is no meaningful "Mercator vs. flat-plane"
error to fight.

## 2. OpenFreeMap: what it serves, its limits, its licensing

[OpenFreeMap](https://openfreemap.org/) is a free vector-tile hosting service
built and run by Zsolt Erő ([hyperknot/openfreemap](https://github.com/hyperknot/openfreemap),
MIT-licensed infrastructure). Verified directly against the live service:

- **Data**: unmodified [OpenMapTiles](https://openmaptiles.org/) schema,
  generated from the full OSM planet. The public style JSONs
  (`https://tiles.openfreemap.org/styles/{liberty,bright,positron,dark}`,
  plus a 3D-tilted "Fiord" style) all point at one shared vector source:
  ```json
  "openmaptiles": { "type": "vector", "url": "https://tiles.openfreemap.org/planet" }
  ```
  Fetching that TileJSON directly (`curl https://tiles.openfreemap.org/planet`)
  returns the real tile URL template, zoom range, and the exact attribution
  string:
  ```json
  {
    "tilejson": "3.0.0",
    "tiles": ["https://tiles.openfreemap.org/planet/20260621_080001_pt/{z}/{x}/{y}.pbf"],
    "minzoom": 0, "maxzoom": 14,
    "bounds": [-180.0, -85.05113, 180.0, 85.05113],
    "attribution": "<a href=\"https://openfreemap.org\">OpenFreeMap</a> <a href=\"https://www.openmaptiles.org/\">© OpenMapTiles</a> Data from <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
  }
  ```
  (the version-stamped path segment — `20260621_080001_pt` above — changes
  weekly; a client should treat it as opaque and always fetch the TileJSON
  first rather than hardcoding a path). A raw tile fetch
  (`.../planet/{ts}/0/0/0.pbf`) returns `content-type:
  application/vnd.mapbox-vector-tile`, `access-control-allow-origin: *` —
  **CORS is wide open**, so a plain browser `fetch()` works from any origin,
  including a GitHub Pages static build.
- **Zoom range**: 0–14 tileset-wide. Individual layers cap their own
  `minzoom`/`maxzoom` inside that range (fetched live from the TileJSON's
  `vector_layers`): `building` is **minzoom 13, maxzoom 14** (building
  footprints simply don't exist below z13 — this is the schema's own
  generalization threshold, not an OpenFreeMap restriction), `transportation`
  (roads) 4–14, `water` 0–14, `landuse` 0–14, `park` 4–14, `poi` 11–14,
  `housenumber` 14 only. **Requesting z15+ is pointless** — 14 is the
  tileset's true maximum resolution (the standard "overzoom" behavior any
  MapLibre client already relies on — z14 tile data is simply scaled up past
  its native zoom, never re-fetched finer). At z14 a tile spans roughly
  40 075 016 m / 2¹⁴ ≈ 2446 m at the equator, narrowing by `cos(lat)` — around
  1.8–2.0 km per side at most US/European latitudes — so **a single z14 tile
  (or at most a 2×2 set straddling a boundary) comfortably covers a
  several-hundred-metre neighborhood radius.**
- **Licensing / attribution — not optional.** OSM data is
  [ODbL](https://www.openstreetmap.org/copyright)-licensed; OpenMapTiles adds
  its own attribution requirement on top. OpenFreeMap's own quick-start page
  states the rule plainly: MapLibre clients get the credit line inserted
  automatically; **any other client (which Diorama is, per §4) must display
  it itself** — exact required text: *"OpenFreeMap © OpenMapTiles Data from
  OpenStreetMap"* with links to openfreemap.org, openmaptiles.org, and
  openstreetmap.org/copyright respectively
  ([Quick Start Guide](https://openfreemap.org/quick_start/)). This is a
  hard compliance requirement, not a design nicety — see §7.8.
- **Usage policy**: no API keys, no registration, no documented request
  quota — "there are no limits on the number of map views or requests"
  ([openfreemap.org](https://openfreemap.org/)). In practice the service
  runs behind Cloudflare with aggressive edge caching; when the collaborative
  drawing site Wplace.live drove ~3 billion requests in 24 h (peaking over
  100 000 req/s), OpenFreeMap held a 96% success rate at a 99.38% CDN
  cache-hit rate, and the operator noted he'd add **referrer-based bandwidth
  limits** as a future safeguard against exactly that kind of unbounded surge
  ([Zsolt Erő, "OpenFreeMap survived 100,000 requests per second"](https://blog.hyperknot.com/p/openfreemap-survived-100000-requests)).
  The practical takeaway for Diorama: **fetch a handful of tiles once per
  house and cache them hard** (§7.3) — a house's coordinates never move, so
  there is no legitimate reason to re-request the same z14 tile more than
  roughly once every OpenFreeMap planet-refresh cycle (weekly). This is good
  citizenship, not merely a Diorama nicety.
- **Self-hosting**: full planet exports (Btrfs images and MBTiles) are
  published weekly for anyone who wants to run their own instance
  ([hyperknot/openfreemap self-hosting docs](https://github.com/hyperknot/openfreemap/blob/main/docs/self_hosting.md)).
  Notably, OpenFreeMap's own infrastructure **deliberately does not use
  PMTiles** for serving — the operator found HTTP range-request latency
  against cloud object storage too high and instead serves tiles straight
  off an nginx-mounted Btrfs filesystem. Self-hosting the FULL planet needs
  a serious box (≥300 GB SSD). For Diorama's purposes this rules out
  "recommend self-hosting the whole planet" as a realistic user ask — but a
  *much* smaller, genuinely practical alternative exists for privacy-minded
  or offline users: generate a tiny **custom-extent PMTiles archive** for
  just the user's own block using third-party extract tools (e.g.
  [Protomaps'](https://docs.protomaps.com/) own `pmtiles`/`planetiler`
  toolchain — a wholly separate project from OpenFreeMap's own stack) and
  serve that single small file locally. This is exactly what `NeighborhoodConfig.source
  = 'custom'` (§7.1) is for — Diorama doesn't need to build that toolchain,
  just accept a pointable tile-URL template.

## 3. Building height data in the OpenMapTiles schema

Diorama needs building *height*, not just footprint. OpenMapTiles' `building`
layer schema
([openmaptiles/layers/building/building.yaml](https://github.com/openmaptiles/openmaptiles/blob/master/layers/building/building.yaml))
carries exactly two numeric fields for this, confirmed live against the
OpenFreeMap TileJSON (`vector_layers[building].fields`):

| Field | Type | Meaning |
|---|---|---|
| `render_height` | Number (metres) | "An approximated height from levels and height of the building or building:part" |
| `render_min_height` | Number (metres) | "An approximated height from minimum levels or minimum height of the bottom of the building or building:part" |
| `colour` | String | OSM `building:colour`/`roof:colour` passthrough, when tagged (rare) |
| `hide_3d` | Boolean | flags outline-only building *parts* that shouldn't be extruded (avoids double-height artifacts on multi-part buildings) |

This is the schema MapLibre's own official "Display buildings in 3D" example
extrudes directly:
`fill-extrusion-height: ['get','render_height']`,
`fill-extrusion-base: ['get','render_min_height']`
([MapLibre GL JS — Display buildings in 3D](https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/)) —
i.e. Diorama's own extrusion (§7.4) is not inventing a new interpretation of
these fields, it's reproducing the one every MapLibre-based 3D-buildings demo
already uses, just in three.js instead of MapLibre's GPU fill-extrusion
paint property.

**The fallback constant is verified, not guessed**: OpenMapTiles' own
`building.sql` computes the minimum-height fallback as
`floor(COALESCE(min_height, min_level * 3.66, 0))` — **3.66 m per level**
(≈12 ft) is the schema's own OSM-levels→metres conversion factor
([openmaptiles/layers/building/building.sql](https://github.com/openmaptiles/openmaptiles/blob/master/layers/building/building.sql);
discussed in [openmaptiles/openmaptiles#19](https://github.com/openmaptiles/openmaptiles/issues/19)).
The equivalent full-height formula (not directly quoted in the SQL excerpts
available, but consistent with the same constant and the OSM community's own
convention) is `height ?? levels * 3.66 ?? <small default>`.

**How much of OSM actually carries this data — the honest number**: a 2023
peer-reviewed global quality assessment of OSM building attributes found
**only 4.6% of buildings tagged `building:levels`, 2.9% tagged `height`, ~7%
with either** ([Quality of crowdsourced geospatial building information: a
global assessment of OpenStreetMap attributes — ScienceDirect, 2023](https://www.sciencedirect.com/science/article/pii/S0360132323003220)).
Concretely: **over 90% of the buildings Diorama draws will have NO real
height data at all** — `render_height` will be whatever OpenMapTiles' own
`est_height`-style fallback resolves to (frequently a small flat default for
an untagged building, not a per-level estimate, since there's no level count
either). **Diorama must not trust `render_height` as gospel per-building
truth; it must apply its own visible, user-tunable default** (§7.1's
`defaultLevelHeightM`, default **3 m/level**, matching the OSM community's
own everyday convention — [Key:building:levels — OSM Wiki](https://wiki.openstreetmap.org/wiki/Key:building:levels))
whenever a feature's `render_height` looks suspiciously small/absent (a
simple heuristic: treat `render_height < 1` as "unknown", not "one-storey
shed" — a firm number belongs in the Open Questions list, §10). This is
precisely why `verticalScale` (§7.1) is a first-class, prominent sidebar
control and not a buried setting: **most houses on the block will render at
a genuinely made-up height**, and the user needs an easy dial to make the
whole overlay "look about right" against their own real house model, not a
false promise of surveyed accuracy.

**Roads / water / land-use** (confirmed live from the same TileJSON, all
present in the public OpenFreeMap feed, "depending on OpenFreeMap's limits"
per the brief — none of these are limited beyond the standard OpenMapTiles
schema):

| Layer | Zoom | Key fields (from the live schema) |
|---|---|---|
| `transportation` | 4–14 | `class` (motorway/trunk/primary/secondary/tertiary/minor/service/track/path/steps…), `subclass`, `brunnel` (bridge/tunnel/ford), `layer`, `oneway`, `surface`, `service` |
| `water` | 0–14 | `class` (ocean/lake/river…), `brunnel`, `intermittent` — polygon geometry |
| `waterway` | 3–14 | streams/canals as LineStrings (not needed for a house-scale overlay; polygonal `water` is sufficient v1) |
| `landuse` | 0–14 | `class` only (residential/commercial/industrial/forest/cemetery/…) — polygon, low information density but cheap ambient tinting |
| `landcover` | 0–14 | `class` (wood/grass/ice/wetland/sand…) — Natural-Earth-backed at low zoom, OSM-backed at high zoom |
| `building` | 13–14 | see above |
| `park` | 4–14 | polygon, `class` |
| `place`/`poi` | varies | name labels — optional, deferred (§9) |

## 4. Client library evaluation

**(a) MapLibre GL JS rendering into Diorama, texture-composited or
side-by-side.** MapLibre's minimal bundle (Map + basic controls) is
reported around **~210 kB gzipped**, with the full default build closer to
**~750 kB gzipped** and growing release over release
([MapLibre bundle-size tracking issue #7255](https://github.com/maplibre/maplibre-gl-js/issues/7255);
[bundlephobia](https://bundlephobia.com/package/maplibre-gl)) — i.e.
**heavier than three.js itself** (CLAUDE.md's own figure: ~157 kB gzip for
the three.js chunk). It is a second, independent WebGL renderer with its own
canvas, its own camera/projection math (a real Web Mercator globe/plane
hybrid, not Diorama's dimetric Sims camera), its own GPU context, and its own
styling language (Mapbox GL Style Spec) aimed at photoreal/flat cartographic
rendering — visually the exact opposite of the toon `MeshToonMaterial` +
inverted-hull-outline aesthetic this whole codebase is built around. Getting
it to *look* like a Diorama scene would mean fighting its renderer, not using
it; getting two independent WebGL contexts to composite cleanly on an HA
tablet (already DPR-capped for exactly this class of device) is a real
robustness risk on top of the aesthetic mismatch. **Recommendation: reject.**
This is the "if it's a bad fit, say so plainly" case the brief asked for.

**(b) Decode vector tiles directly, extrude into ordinary three.js/`_mat()`
meshes.** Diorama already has zero runtime npm dependencies beyond `lit` and
`three` — the codebase's convention for anything wire-protocol-shaped is to
hand-roll a minimal decoder rather than pull in a library (`src/mqtt-ws.ts`
is the exact precedent: a from-scratch MQTT 3.1.1 packet codec, "ZERO
imports", used instead of an `mqtt` npm package). MVT is a **much smaller**
protobuf surface than MQTT's framing — the whole spec needed is four
messages and one enum (§7.2 has the exact field numbers, verified against
[the official `vector_tile.proto`](https://raw.githubusercontent.com/mapbox/vector-tile-spec/master/2.1/vector_tile.proto)).
A hand-rolled decoder is on the order of 150–250 lines, adds no dependency,
and — critically — plugs directly into Diorama's existing "pure module →
renderer builder → dirty key" recipe with **zero new architectural concepts**:
tile extrusion reuses the *exact* `ShapeGeometry`-rotated-−π/2 technique
already used for ground-area patches and the ghost-floor loop-slab (CLAUDE.md
explicitly documents the sign gotcha there — it applies here too, see §7.4),
and road ribbons reuse the **already-shipped** `bufferPolyline()` helper
(`geometry.ts`, built for the driveway/path authoring tool). The library
alternative (`@mapbox/vector-tile` + `pbf`, ~2.5 kB gzip for `pbf` alone per
its own README) is *smaller* than a hand-rolled decoder in bytes, but it
would be the first third-party runtime dependency in this codebase's history
and doesn't buy anything the codebase's own established idiom doesn't already
solve just as well. **Recommendation: build this.**

**(c) Hybrid — static raster tile image underlay + our own building
extrusion.** Considered and rejected as unnecessary complexity: it would
mean juggling TWO fetch/cache pipelines (an XYZ *raster* tile source for
roads/ground context, a *vector* one for buildings) for no real benefit —
option (b) already gets roads/water/landuse from the same vector fetch with
one more small `bufferPolyline`/`ShapeGeometry` call each. The only case
hybrid would matter is wanting photoreal ground texture (satellite
imagery) — explicitly out of scope; Diorama's whole aesthetic is
stylized toon, not photoreal.

**Verdict, with the caveats stated plainly**: build (b). Cost is real but
bounded — a genuinely new pure module plus a genuinely new (if small)
protobuf decoder, not a glue layer over an existing library. Risk is real
too: OSM data quality varies wildly by region (§3), and a hand-rolled decoder
must be defensive against malformed/truncated tiles exactly like
`mqtt-ws.ts`'s codec already is ("never throws"). Both are named explicitly
in §10.

## 5. Tile → plan-frame math (and why the projection "mismatch" is a non-issue)

**Slippy-map tile math is angle-only, not radius-dependent.** A common
misconception is that "Web Mercator distortion" corrupts the underlying
data — it doesn't. The z/x/y tile pyramid's mapping to longitude/latitude is
a pure angular relation with **no Earth-radius constant anywhere in it**:

```
n = 2^zoom
lon = xtile / n * 360 − 180
lat = atan(sinh(π · (1 − 2 · ytile / n))) · 180/π       // inverse Gudermannian
```

Within one tile, an MVT vertex is an integer pair `(px, py)` in the tile's
local `0..extent` space (`extent` defaults to 4096, §7.2). Its fractional
position inside the tile pyramid is `xtile + px/extent`, `ytile + py/extent`
— feed that into the two formulas above and you get an **exact** lat/lon,
because the Mercator y-fraction ↔ latitude relation above is the literal
definition of the projection, not an approximation of it. So: **there is no
residual Mercator warp left over once a tile vertex has been inverted back
to lat/lon** — the distortion everyone associates with Mercator lives
entirely in the tile *pixel grid* (how much ground one tile pixel covers,
which shrinks toward the poles), never in the coordinates a vertex actually
encodes.

**The one real approximation is Diorama's own**, and it's already shipping.
`geo.ts`'s `projectLatLon` is a local equirectangular tangent-plane fit
(`x = Δlon · cos(lat0) · R`, `y = Δlat · R`, evaluated at the ORIGIN
landmark's latitude, `R = 6 371 000 m`) — the same approximation every GPS
pin and geo landmark already uses today, just newly pushed a few hundred
metres further out for the neighborhood overlay instead of tens of metres
for a GPS pin. Its dominant error term is the fixed `cos(lat0)` factor not
tracking a point's own latitude as it moves north/south of the origin; to
first order this scales with `Δlon · Δlat · R · sin(lat0)`. At a
**neighborhood radius of a few hundred metres**, `Δlon` and `Δlat` are each
on the order of `radius / R ≈ 500/6 371 000 ≈ 8×10⁻⁵ rad`, so the error term
is on the order of **centimetres, at most low single-digit metres at the
outer edge of a very large (multi-kilometre) radius** — two to three orders
of magnitude below the GPS/landmark calibration accuracy Diorama already
budgets for (`GeoConfig.accuracyGateM` defaults to 30 m; a good phone fix is
typically 5–15 m). **Conclusion: extend the existing `latLonToPlan` pipeline
unchanged. There is nothing here worth a special-cased projection or a
second coordinate system** — the neighborhood overlay is simply "GPS pins,
but for building footprints, at a bigger radius," using the identical
math path.

## 6. Prior art

- **MapLibre/Mapbox's own "3D buildings" example** is the direct ancestor of
  this design's extrusion technique — `fill-extrusion-height`/
  `fill-extrusion-base` from `render_height`/`render_min_height`
  ([MapLibre GL JS docs](https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/);
  also replicated by [MapTiler SDK](https://docs.maptiler.com/sdk-js/examples/3d-buildings/)
  and various framework wrappers). Diorama reproduces the same two-field
  extrusion contract, just via a hand-built `ShapeGeometry` extrude instead
  of MapLibre's GPU paint property.
- **OSMBuildings** (the long-running standalone "extrude every OSM
  building" project that predates MapLibre's own fill-extrusion support) is
  the spiritual precedent for "a dedicated, lightweight, non-MapLibre client
  that only extrudes buildings" — validating that a narrow, purpose-built
  client (rather than a full map-rendering engine) is a reasonable, proven
  shape for this exact problem.
- **Cesium / Cesium ion "OSM Buildings" global 3D tileset** is the
  photogrammetry-scale, whole-planet version of this idea — explicitly out
  of scope: it targets aerial/city-scale visualization, not a single house's
  block, and pulls in a much heavier 3D-tiles streaming engine for no
  benefit at Diorama's scale.
- **Smart-home dashboards generally do not do this.** Home Assistant's own
  Map card (Leaflet-based) and most HACS dashboard cards show a flat 2D
  map, never a 3D neighborhood model — this is a genuinely novel feature for
  the HA dashboard space, not a "catch up to what others already do" ask.

## 7. Diorama design

### 7.1 Data model — `Store.neighborhood`

Store-level (property-wide), **not** per-floor — it mirrors `Store.geo` and
`Store.weather` exactly: one physical address, one real-world context. Must
be added to `Planner._loadFromHa`'s explicit field list (the CLAUDE.md
"any new top-level `Store` field resets on load if you forget this" gotcha)
and to `_applyHistorySnapshot`'s field set for undo/redo round-trips.

```ts
export interface NeighborhoodConfig {
  enabled?: boolean;             // absent = OFF. This calls a third-party network
                                  // service on every load once on — opt-in only,
                                  // never default-on like geo/weather.
  source?: 'openfreemap' | 'custom';   // default 'openfreemap'
  tileUrlTemplate?: string;      // 'custom' only — a {z}/{x}/{y}.pbf template
                                  // (self-hosted OpenFreeMap, a small Protomaps
                                  // PMTiles-backed extract server, etc.)

  radiusM?: number;              // fetch radius around the geo origin landmark,
                                  // default 350 (m) — clamp 100..1000
  layers?: {                     // which vector layers to draw; buildings/roads
    buildings?: boolean;         // default true
    roads?: boolean;             // default true
    water?: boolean;             // default true
    landuse?: boolean;           // default false — ambient-only, low value, opt-in
    labels?: boolean;            // default false — deferred, see §9
  };

  verticalScale?: number;        // multiplies every resolved building height,
                                  // default 1, clamp 0.2..3 — see §3's honesty note
  defaultLevelHeightM?: number;  // fallback per-level height when OSM has no
                                  // height/levels tag, default 3 (m), clamp 2..5

  align?: { dx?: number; dy?: number; rotDeg?: number }; // fine nudge ON TOP of
                                  // the landmark-fitted GeoTransform — see §7.6
  opacity?: number;              // building/road/water alpha, default 1, clamp 0.3..1
  colorBuildings?: string; colorRoads?: string; colorWater?: string; colorLanduse?: string; // hex overrides

  exclusions?: Vec2[][];         // plan-mm polygons (SAME shared frame as
                                  // Store.geo.landmarks — inherits that frame's
                                  // "translates only when floors.length===1"
                                  // caveat, CLAUDE.md "Floor boundary editing").
                                  // Neighborhood geometry is CLIPPED OUT of these
                                  // — the mechanism for "don't collide with my
                                  // own house/yard".
}
```

`repairFloor`/`defaultFloor` are untouched (this is a `Store`-level field,
not per-floor). No migration needed — absent/undefined is fully inert,
matching every other opt-in `Store` field added this way (`weather`,
`geo`, `compass`, `mqttBridge`).

### 7.2 Pure modules — `src/mvt-decode.ts` + `src/neighborhood.ts`

Two files, mirroring the `homography.ts` / `mqtt-ws.ts` split between "leaf
wire-format codec, truly zero imports" and "feature module that imports the
leaf plus other pure modules, tested via `--bundle`":

**`src/mvt-decode.ts`** — zero imports, standalone-transpilable
(`esbuild --format=esm`, no `--bundle`, exactly like `mqtt-ws.ts`/`geo.ts`).
A minimal protobuf reader plus the four MVT messages actually needed,
field numbers verified against
[the official `vector_tile.proto`](https://raw.githubusercontent.com/mapbox/vector-tile-spec/master/2.1/vector_tile.proto):

```
Tile             { repeated Layer layers = 3 }
Tile.Layer       { string name = 1; repeated Feature features = 2;
                   repeated string keys = 3; repeated Value values = 4;
                   uint32 extent = 5 [default=4096] }
Tile.Feature     { uint64 id = 1; repeated uint32 tags = 2 [packed];
                   GeomType type = 3; repeated uint32 geometry = 4 [packed] }
Tile.Value       { string string_value=1; float float_value=2; double double_value=3;
                   int64 int_value=4; uint64 uint_value=5; sint64 sint_value=6;
                   bool bool_value=7 }
GeomType         { UNKNOWN=0; POINT=1; LINESTRING=2; POLYGON=3 }
```

Geometry decode is the one genuinely fiddly bit, also standard/stable and
unchanged for years: the `geometry` field is a flat varint array of drawing
*commands* — each command word packs `(id | count<<3)` where `id=1` is
MoveTo, `id=2` is LineTo, `id=7` is ClosePath; a MoveTo/LineTo command is
followed by `count` `(dx, dy)` parameter pairs, each **zigzag-varint encoded**
and **cursor-relative** (add to a running `(x, y)`). Decoding this requires
no external library — it's ~40 lines of varint/zigzag arithmetic once you
have a byte-cursor reader.

```ts
// src/mvt-decode.ts — zero imports
export interface MvtFeature {
  id: number;
  type: 'point' | 'line' | 'polygon' | 'unknown';
  tags: Record<string, string | number | boolean>;
  // rings (polygon) / lines (line) in tile-LOCAL 0..extent integer coords,
  // already cursor-integrated (absolute, not delta-encoded)
  geometry: Array<Array<{ x: number; y: number }>>;
}
export interface MvtLayer { name: string; extent: number; features: MvtFeature[]; }
export function decodeMvtTile(buf: ArrayBuffer): MvtLayer[]; // never throws — a
  // malformed/truncated tile yields [] plus (in a debug build) a console.warn,
  // matching mqtt-ws.ts's decodePackets() "never throws" contract
```

Fetched tile bytes need **no manual decompression** — unlike the
Valetudo/MQTT raw-socket payloads (`valetudo-map.ts`'s `DecompressionStream`
dance), a plain `fetch()` GET request auto-decompresses standard HTTP
`Content-Encoding` transparently; OpenFreeMap's response already carries
`vary: accept-encoding` and serves through Cloudflare, so `resp.arrayBuffer()`
already yields raw, uncompressed protobuf bytes.

**`src/neighborhood.ts`** — imports `mvt-decode.ts`, `geo.ts`
(`GeoTransform`, `latLonToPlan`), and `geometry.ts` (`bufferPolyline`,
`pointInPolygon`). Its own test harness therefore bundles with
`esbuild --bundle` (the `weather.ts`/`mqtt-bridge.ts` precedent), not the
single-file leaf transpile.

```ts
export interface TileAddr { z: number; x: number; y: number; }

// Web Mercator tile math — angle-only, no Earth-radius constant (§5).
export function lonLatToTile(lat: number, lon: number, zoom: number): TileAddr;
export function tileToLonLat(t: TileAddr, fracX: number, fracY: number): { lat: number; lon: number };
export function tilesForRadius(lat: number, lon: number, radiusM: number, zoom: number): TileAddr[];

// Height resolution — the §3 honesty rule: a suspiciously-small/absent
// render_height is treated as "unknown" and falls back to defaultLevelHeightM
// via levels (when present) else a flat 1-storey default, never trusted blindly.
export function resolveBuildingHeightM(
  tags: Record<string, unknown>, defaultLevelHeightM: number
): number;

export interface NbBuilding { points: Vec2[]; heightMm: number; baseMm: number; }
export interface NbRoad { points: Vec2[]; widthMm: number; cls: string; bridge: boolean; }
export interface NbPatch { points: Vec2[]; cls: string; } // water / landuse

export interface NeighborhoodFeatures {
  buildings: NbBuilding[]; roads: NbRoad[]; water: NbPatch[]; landuse: NbPatch[];
  fetchedAt: number; tileAddrs: TileAddr[];
}

// The whole pipeline: raw decoded layers (from cache/fetch) → plan-mm features,
// with the align nudge applied ON TOP of the landmark GeoTransform, exclusion
// polygons subtracted (point-in-polygon test per feature CENTROID — a cheap,
// good-enough clip; see §10 for the "partial overlap" edge case), and road
// centerlines buffered into ribbon polygons via the ALREADY-SHIPPED
// bufferPolyline() from geometry.ts (built for the driveway/path tool).
export function buildNeighborhoodFeatures(
  layersByTile: Map<string, MvtLayer[]>, tileAddrs: TileAddr[],
  transform: GeoTransform, align: { dx: number; dy: number; rotDeg: number },
  exclusions: Vec2[][], cfg: { verticalScale: number; defaultLevelHeightM: number }
): NeighborhoodFeatures;
```

Road class → ribbon width (mm), a small fixed table mirroring the "real
mm" convention every other Diorama fixture uses (values are ordinary
real-world lane-width norms, not surveyed per-road — same honesty caveat as
building height): `motorway/trunk` 11000, `primary/secondary` 7000,
`tertiary/minor/residential` 6000, `service/track` 3000, `path/footway/steps`
1200; `unknown` falls back to 4000.

### 7.3 Fetch & caching — `src/neighborhood-store.ts` + Planner wiring

IndexedDB cache mirroring `model-store.ts`/`avatar-store.ts` exactly (same
`openDb`/`get`/`put` shape, own database so a rebuild never touches the
model/avatar stores):

```ts
// src/neighborhood-store.ts
const DB_NAME = 'diorama-neighborhood';
export interface CachedTile { bytes: ArrayBuffer; fetchedAt: number; }
export function getTile(key: string): Promise<CachedTile | null>;   // key = `${source}:${z}:${x}:${y}`
export function putTile(key: string, tile: CachedTile): Promise<void>;
export function clearTiles(): Promise<void>;                        // Settings "reset cache" affordance
```

Fetch/decode/cache is **Planner-side**, following the `weather.ts`-style
isolation `CLAUDE.md` already documents for `mqtt-bridge.ts` — Planner owns
network/data acquisition broadly, renderers/canvases only consume already-
resolved data:

- `Planner._reconfigureNeighborhood()` (mirrors `_reconfigureWeather` /
  `_reconfigureMqtt`): no-ops when `!neighborhood?.enabled` or
  `geoFit().quality === 'none'` (there is nothing to align to without at
  least one calibrated landmark — same gate the GPS-pin system already
  enforces). Otherwise computes `tilesForRadius(originLat, originLon,
  radiusM, 14)`, checks the IDB cache per tile (TTL: OpenFreeMap's own
  planet refresh is weekly, so a **30-day** cache lifetime is generously
  conservative and a good citizen — re-fetching a house's own unchanging
  block daily would be pointless load on a free service), fetches only the
  misses (`fetch()`, try/caught exactly like `weather.ts`'s `fetchOpenMeteo`
  — **a fetch failure must never throw into the RAF/tick path**, it just
  leaves that tile's data absent), decodes with `decodeMvtTile`, and calls
  `buildNeighborhoodFeatures`. Result lands in a runtime-only
  `Planner.neighborhoodFeatures: NeighborhoodFeatures | null` (never
  persisted — same rule as `weatherNow`/`blePeople`/`fusions`), followed by
  one `emitConfig()`.
- Re-run triggers: `_applyLoadedStore` (once, on load/switch), a config
  change to `neighborhood.{enabled,source,tileUrlTemplate,radiusM,align,
  verticalScale,defaultLevelHeightM,exclusions}` (`setNeighborhood(mut)`
  mutator, mirrors `setWeather`/`setCompass`), and a **materially changed**
  geo fit — debounced/coarse-gated (e.g. only re-run when the fitted origin
  moves more than ~20 m or `quality` flips to/from `'none'`) so recalibrating
  a landmark doesn't hammer the network on every intermediate sample.
- Recomputing `buildNeighborhoodFeatures` from ALREADY-cached tile bytes
  (e.g. after only `align`/`verticalScale`/`exclusions` change, no new
  tiles needed) is cheap and synchronous-ish (pure geometry math over data
  already in memory) — no need to re-fetch or even re-decode the MVT layers,
  just re-run the projection/clip/height step. Cache the *decoded* `MvtLayer[]`
  per tile in a `Planner`-side `Map` (not IndexedDB — IDB holds raw bytes for
  cross-session reuse; the decoded-layer cache is a warm, in-memory,
  per-session convenience) so an alignment-nudge slider genuinely feels live.

### 7.4 Renderer — `_neighborhoodGroup`

Added to `scene.add`, **but like `_skyGroup`, NOT part of
`clearTransientGroups`** — the overlay's geometry is anchored to the real
geo frame (calibrated once against the landmarks), not to "whichever floor
is currently active," so a floor switch should not tear it down and rebuild
it. Built lazily (`_ensureNeighborhood()`), disposed only in `destroy()`.

- **Visibility, not rebuild, on floor switch.** The overlay only makes
  physical sense at grade — v1 shows it **only when the current floor is
  `store.floors[0]`** (the lowest story; the floor the geo landmarks are
  practically calibrated against) and simply sets `_neighborhoodGroup.visible
  = false` on every other floor. This is a deliberate, documented v1
  simplification (see §10) rather than solving general cross-story
  registration — CLAUDE.md's own ghost-floor section shows that problem is
  solvable (the `asx`/`asz` world-frame mapping + per-story Y offset by
  `STORY_H`), but it's real added complexity this doc defers rather than
  smuggles in as an afterthought.
- **Dirty key** `_keyNeighborhood` = `configRev` + a coarse hash of
  `(enabled, align.dx/dy/rotDeg, verticalScale, defaultLevelHeightM, layers
  flags, exclusion count+hash, colorOverrides, opacity)` **plus**
  `Planner.neighborhoodFeatures?.fetchedAt` (so a completed async fetch
  triggers exactly one rebuild, the `Floor.model3d`-style `rev`-changed
  idiom) — **not** re-evaluated per frame beyond the existing tick-key
  comparison; zero per-frame allocation once built.
- **Buildings**: one `THREE.Shape` per footprint polygon (already earcut-
  friendly, same family as ground-area/void-area/ghost-floor-loop shapes),
  extruded via `ExtrudeGeometry({ depth: heightMm − baseMm })`, then
  `rotation.x = −π/2` to stand it upright — **the exact ghost-floor
  loop-slab sign convention CLAUDE.md documents applies again here**: a
  shape rotated −π/2 maps local `(sx, sy)` → scene `(sx, 0, −sy)`, so
  footprint polygons must be authored/projected with that same
  `sy = −asz(wy)`-style negation or the whole neighborhood mirrors
  front-to-back exactly like the documented ghost-slab bug did — call this
  out explicitly in the implementation (and cover it in the test page, §8).
  Positioned at `y = baseMm` (≈ grade), material via `_mat({ color:
  colorBuildings ?? toonDefaultGrey })` (the standard toon factory — **never**
  a second material system); OSM `colour` tag used when present (rare, per
  §3) with the usual `_simsColor` saturation push. No inverted-hull outline
  shell by default (hundreds of buildings × an extra shell mesh each is a
  real cost for a background-context feature; flag as a possible follow-up,
  not v1).
- **Roads**: each `transportation` LineString + its class-derived width
  (§7.2's table) run through the **already-shipped** `bufferPolyline()` to
  get a flat ribbon polygon, drawn as a `ShapeGeometry` patch at
  `y ≈ 3` (between `Floor.yardFill`'s `y=2` and user-painted `GroundArea`'s
  `y=4`, so a user's own driveway/`GroundArea` always visually wins at the
  property edge with zero boolean-subtraction complexity — the exact
  layering precedent `terrain-enhancements.md`'s yard-fill design already
  established). Color by class (`colorRoads` override, else a neutral toon
  asphalt/concrete grey, arterial roads slightly darker/wider than
  residential).
- **Water**: `water`-layer polygons as flat patches at the same `y≈3`,
  reusing the **already-cached** `_groundTexture('water')` CanvasTexture for
  visual consistency with the user's own yard ponds (one more consumer of
  an existing shared, `destroy()`-only-disposed texture — zero new asset
  work).
- **Landuse** (opt-in, default off per §7.1): very low-key flat tinted
  patches at `y≈2.5` (park pale green, residential faint warm grey,
  commercial faint blue-grey) — genuinely optional ambient dressing, the
  lowest-value layer per §3's table, cheap to add once buildings/roads/water
  are proven out.
- **Exclusions**: each `Store.neighborhood.exclusions` polygon is subtracted
  at the `buildNeighborhoodFeatures` step (§7.2), not at render time — a
  feature whose centroid falls inside any exclusion polygon is dropped
  entirely before it ever reaches the renderer. (A polygon-boolean partial
  clip — cutting a building that straddles the exclusion boundary in half —
  is explicitly NOT attempted in v1; see §10.)
- **Shared resources**: any new CanvasTexture/material (e.g. a road-asphalt
  toon material, distinct from `_groundTexture`) is built once, cached,
  disposed only in `destroy()` — the same discipline as every other shared
  texture in this codebase (`_blobTex`, `_gradientMapTex`, `_groundTexCache`,
  `_fenceMeshTexture`…).

### 7.5 2D representation

Deliberately minimal — the brief's "wow" ask is 3D, and the 2D plan is a
**working editing surface** where clutter has a real cost (accidental hits,
visual noise around drag handles). Proposal: a NEW, separately-gated
`Layers2D.neighborhood?: boolean` (**default OFF even when the 3D feature is
enabled** — genuinely opt-in-on-top-of-opt-in), drawn as **thin dashed grey
building outlines + thin grey road centerlines**, same visual weight and
non-interactivity as the existing `drawPeekFloors` onion-skin — no fill, no
hit-testing (mirrors the "peek floor" precedent exactly: pure paint,
lowest possible priority, purely a "does my alignment look right" sanity
aid during calibration, not a feature meant to be left on during normal
editing). Drawn early (right after the ground layer, before walls) so it
reads unambiguously as background context, never confusable with the user's
own drawn walls.

### 7.6 Sidebar UI — "Neighborhood" section

Per the brief's explicit ask, the tuning controls that actually matter for
getting alignment/scale right live in the **sidebar** (edit-mode only, like
every other sidebar section), placed directly after the existing "GPS / Geo"
section since it's a hard dependency on that section's calibration:

- **Status line**: `geoFit().quality === 'none'` → dim "Calibrate a GPS
  landmark above first" (mirrors the existing GPS-pin sidebar honesty
  pattern in `Planner.gpsFixFor`'s status strings); else "aligned via N
  landmark(s) · fit RMS ±X m" (reusing the geo section's own `fmtDistanceM`
  readout) plus a tile-cache line ("N tiles cached · last fetched <date>" /
  "fetching…" / "fetch failed — will retry").
- **Layer checkboxes**: Buildings / Roads / Water / Landuse — plain toggles
  on `Store.neighborhood.layers`.
- **Vertical-scale slider**: `verticalScale` 0.2–3× (labeled plainly, e.g.
  "Building height ×N" with the §3 honesty caveat as helper text: "most
  buildings don't have real height data — this is a look-right dial, not a
  survey").
- **Default level height**: a small mm/m input for `defaultLevelHeightM`
  (advanced; collapsible or a secondary row under the vertical-scale
  slider).
- **Alignment nudge** — mirrors the EXISTING "Move plan"/"Rotate plan"
  idiom in the Floors section almost verbatim (CLAUDE.md, "Floor ordering &
  per-floor disable" → "Move plan nudges"): ↑↓←→ buttons at a selectable
  step (reuse the SAME device-local `localStorage['diorama:moveStep']`
  metric step-size convention, or a dedicated
  `diorama:nbhdMoveStep`) mutating `align.dx/dy`, plus ↺1°/↻1°/↺15°/↻15°
  buttons mutating `align.rotDeg` — applied entirely client-side on top of
  the fitted `GeoTransform`, never touching the landmark calibration itself
  (so "nudge the neighborhood to line up better" and "recalibrate my GPS
  landmark" stay two clearly separate actions, exactly like the existing
  Floors section keeps "rotate the plan" and "recalibrate geo" separate
  operations today).
- **Exclusion-polygon draw tool**: mirrors the `pzone`/`ground`/`void`
  draw-latch idiom exactly (`Planner.drawingNeighborhoodExclusion: {points:
  Vec2[]} | null`, a new tool `nbhd_excl`, click-vertices / dblclick-or-Enter
  finish / ESC cancel, low-priority non-interactive once placed — it's a
  clip mask, not a clickable fixture). A "+ Add exclusion" button arms the
  tool; a numbered list below shows each polygon with a delete button (the
  presence-zone list precedent).
- Everything here writes through the SAME `Store.neighborhood` object the
  Settings drawer edits (§7.7) — no split state, exactly like `geo`/`weather`
  are edited from one place with one field owner.

### 7.7 Settings drawer — Integrations block

The **enable/disable + source** decision (a privacy/network-cost call, not a
visual-tuning one) belongs in Settings ▸ Integrations, mirroring the
`mqttBridge`/`bermudaEnabled` precedent exactly:

- Master **enabled** checkbox with adjacent disclosure copy: *"Fetches map
  data for your address from OpenFreeMap (openfreemap.org), a free public
  service. Your address is sent to their servers as tile coordinates. See
  their [privacy/usage info]."* — an honest, upfront network-privacy note,
  matching the Weather/MQTT tabs' own "stored on this device only"-style
  disclosures.
- **Source** radio: OpenFreeMap (default) / Custom tile URL (reveals the
  `tileUrlTemplate` input + the same self-host guidance summarized in §2's
  "small custom-extent PMTiles extract" note).
- **"Clear tile cache"** button (→ `neighborhood-store.clearTiles()` +
  force a re-fetch) — a debugging/reset affordance, same shape as the MQTT
  tab's "Test connection".
- A live status pill mirroring the MQTT bridge's `idle|connecting|up|error`
  ladder: `off | needs-geo | fetching | ready | error`.

### 7.8 Attribution (compliance, not a design choice)

Because Diorama is NOT a MapLibre client, §2's attribution requirement does
**not** happen automatically — Diorama must render it. Design: a small,
persistent, non-dismissible credit line (visually similar weight to the
weather chip, but plain text — this is a legal/license requirement, not a
brand moment) shown in a fixed screen corner **whenever
`neighborhood.enabled` is true and at least one sub-layer is actually
drawing**, reading *"OpenFreeMap · © OpenMapTiles · Data from
OpenStreetMap contributors"* with the three links live (`target="_blank"`),
matching OpenFreeMap's own required text verbatim
([Quick Start Guide](https://openfreemap.org/quick_start/)). It disappears
only when the whole feature is switched off — hiding it via a layer checkbox
while the feature stays enabled would defeat its purpose, so it is **not**
wired to `Layers2D`/3D layer visibility toggles, only to the master
`enabled` flag and "is anything currently rendered" (e.g. don't show it on
a floor where the overlay is hidden per §7.4's ground-floor-only rule).
`source: 'custom'` still needs it — the underlying data is still OSM/
OpenMapTiles-derived even through a self-hosted or third-party endpoint,
so the disclosure copy should note that plainly rather than assume a custom
source is exempt.

### 7.9 Offline / demo behavior

"Offline mode" in this codebase means **no Home Assistant backend**, not
"no internet" — `LocalApi` only stubs out the HA WebSocket surface. A plain
browser `fetch()` to `tiles.openfreemap.org` is unrelated to `HaApi` and
will succeed exactly as normal **as long as the browser genuinely has
internet access** (true for a real offline-panel deployment on a tablet
with Wi-Fi, true for the GitHub Pages live demo visited by a real browser;
false only in a fully air-gapped kiosk, in which case the fetch fails soft
per §7.3's try/catch and the feature simply shows nothing, no crash). The
real gate is **geo calibration, not connectivity**: the shipped demo
floorplans (`docs/floorplans/*.json`) have no calibrated GPS landmarks today,
so `geoFit().quality === 'none'` for every one of them and the feature
correctly shows its "calibrate a landmark first" state out of the box — a
demo author COULD seed one of the showcase homes with a real address's
landmark to show off a genuinely populated neighborhood, but that's an
explicit content decision for whoever builds the demo seed data, not
something this feature needs to force. `Store.neighborhood.enabled`
defaults to `false`/absent regardless, so a fresh demo config never fetches
anything unprompted.

## 8. Phased build order

Sized like every other multi-part arc in this repo (terrain's T1–T4, MQTT's
M-A/B/C) — smallest-first, each phase independently shippable and testable:

- **N1 — Tile pipeline + pure math (no rendering yet).** `mvt-decode.ts`
  (protobuf/MVT decoder), `neighborhood.ts` (tile-address math, height
  resolution, `buildNeighborhoodFeatures`), `neighborhood-store.ts` (IDB
  cache). Test page `neighborhood-mvt-test.html` bundling both files:
  decode a real captured OpenFreeMap tile fixture (checked into the test
  page like other fixture-driven tests), assert feature counts/geometry/
  tags match a hand-checked reference; tile-math round-trip against known
  lat/lon↔tile pairs; height-fallback matrix; `bufferPolyline` road-ribbon
  reuse sanity check. **No `Store` field, no UI, no renderer yet** — purely
  provable math, the same "prove the primitive in isolation first" approach
  `homography-test.html` took before `frigate-target-test.html` wired it
  into the real Planner.
- **N2 — Data model + Planner wiring + fetch/cache, still no rendering.**
  `Store.neighborhood`, `_loadFromHa` field-list entry, `setNeighborhood`,
  `_reconfigureNeighborhood`, the fetch/cache/debounce logic,
  `Planner.neighborhoodFeatures`. Testable via a fake-`fetch` harness
  (mirrors `config-test.html`'s fake-`HaApi` pattern) asserting: gate on
  `geoFit().quality`, cache-hit vs. miss fetch counts, 30-day TTL,
  debounced re-fetch on config change, graceful failure on a bad/timeout
  fetch.
- **N3 — Renderer: buildings only.** `_neighborhoodGroup`, the
  `ExtrudeGeometry` building build (with the −π/2 sign-convention check
  called out in §7.4 asserted explicitly), `_keyNeighborhood`, ground-floor-
  only visibility gate, the attribution credit line (§7.8 — ship it in the
  SAME phase buildings first render, never a "we'll add attribution later"
  gap). This is the single biggest visual payoff and the natural first
  shippable slice.
- **N4 — Roads + water + exclusions + sidebar alignment/scale UI.** Road
  ribbons via `bufferPolyline`, water patches via the shared water texture,
  exclusion-polygon draw tool + clipping, the sidebar "Neighborhood" section
  (§7.6) end to end (status line, layer checkboxes, vertical-scale slider,
  alignment nudge). This is the phase that makes the feature actually
  *usable* day-to-day (buildings alone with no alignment control is a demo,
  not a feature).
- **N5 — Settings drawer + polish.** The Integrations-tab enable/source/
  cache-clear block (§7.7), landuse layer (opt-in, lowest value per §3),
  2D peek-outline representation (§7.5), custom `tileUrlTemplate` source
  path exercised against a small self-generated Protomaps extract as a
  smoke test.
- **Deferred / not part of this build order at all**: place/road name
  labels (§9), any cross-story Y-offset generalization beyond "ground floor
  only" (§7.4/§10), partial-polygon exclusion clipping (§10).

## 9. Deliberately not proposed / cut from v1

- **Rendering on non-ground floors with correct story offset.** Real, but a
  materially larger problem (needs the ghost-floor `asx`/`asz` world-frame
  generalization plus a per-story `STORY_H` Y-shift) for a feature whose
  entire value proposition is "what does my house look like sitting in its
  real neighborhood" — a value proposition that's arguably strongest from
  outside/aerial-ish views anyway, which already default toward the ground
  floor. Ground-floor-only is the honest v1 cut (§7.4); flagged as a
  named follow-up, not silently dropped.
- **Place/road name labels.** OpenMapTiles' `place`/`transportation_name`
  layers exist and could feed the `_makeTextSprite` idiom, but they add a
  second text-rendering concern (font stack, multilingual `name:xx` field
  selection, label collision/decluttering — a genuinely hard sub-problem
  MapLibre itself spends enormous effort on) for comparatively low value
  next to "buildings exist and roads exist." Left as a config flag
  (`layers.labels`) that simply does nothing until a future phase implements
  it, rather than removed from the schema — cheap to reserve, expensive to
  build well.
- **Terrain/elevation for the surrounding land** (hills, real ground slope
  around the property). OpenMapTiles doesn't carry this at all (`terain-
  enhancements.md`'s own terraced-elevation work is Diorama's own
  authored/flat-terrace system, not sourced from any external elevation
  API — that doc's own "Deliberately NOT proposed" section already rejects
  importing real elevation data for exactly the reasons that would apply
  here too: a geodetic vertical datum and an artistic down-scaling
  translation, not a data import).
- **Real-time traffic / live road conditions.** OpenFreeMap serves static
  planet-snapshot map data, not live traffic — out of scope by construction,
  not a design choice to revisit.
- **Partial polygon-boolean clipping against exclusion areas.** v1 does a
  centroid-in-polygon test (drop the whole feature or keep it whole) rather
  than actually cutting a building/road that straddles an exclusion
  boundary in half — a real polygon-clipping library/algorithm is a
  meaningfully bigger dependency than anything else in this doc for a
  cosmetic edge case (a building whose footprint happens to exactly
  straddle the user's yard boundary). Flagged, not solved.
- **Self-hosting OpenFreeMap's full planet FOR the user.** Explicitly out
  of scope for Diorama itself (300 GB+ SSD, a whole separate deploy — see
  §2) — the `source: 'custom'` escape hatch exists precisely so a user who
  wants this can point Diorama at their own small extract without Diorama
  needing to build or document the extraction toolchain itself.

## 10. Open questions & risks

- **Building-height honesty threshold.** §3 established that ~93%+ of
  buildings will have no real height/level tag and OpenMapTiles' own
  fallback for THOSE is unclear from public docs (the `render_height`
  full-height formula, unlike the confirmed `render_min_height`
  `min_level*3.66` fallback, wasn't independently verified against the raw
  `building.sql` in this pass — flagged, not asserted). The concrete
  product call needed before implementation: what exact `render_height`
  value counts as "clearly a real per-building estimate" vs. "OpenMapTiles'
  own generic non-data fallback," so Diorama's own `defaultLevelHeightM`
  substitution kicks in at the right threshold rather than either double-
  applying a fallback on top of OpenMapTiles' fallback, or trusting a
  meaningless flat number as if it were real.
- **Hand-rolled MVT decoder robustness.** A genuinely new wire-format
  parser needs the same "never throws, degrades to empty" discipline
  `mqtt-ws.ts`'s codec already has, PLUS defensive handling of the packed-
  varint / zigzag geometry decode specifically (the fiddliest part of the
  spec) — needs a real fixture corpus (a handful of captured real
  OpenFreeMap tiles from varied areas: dense urban, suburban, rural/sparse)
  in the test page, not just synthetic hand-built protobuf bytes.
  Regional data-quality variance (§3) means "works great in one test
  neighborhood" is not sufficient evidence it's robust everywhere.
- **Building count / performance ceiling.** A single z14 tile in a dense
  urban core could carry many hundreds of building footprints; no profiling
  was done in this research pass on realistic worst-case extrusion mesh
  counts/vertex budgets for a Sims-tablet-class GPU. Recommend a hard cap
  (e.g. render at most N nearest buildings by centroid distance from the
  geo origin, silently dropping the rest — or a coarser detail tier for
  buildings past some inner radius) as a v1 safety valve, sized empirically
  during N3 rather than guessed here.
- **`tileUrlTemplate` custom-source trust.** Accepting an arbitrary
  user-entered tile URL means `fetch()`ing arbitrary attacker-influenced
  content if a shared/imported config carries a malicious template — the
  decoder's "never throws" discipline mitigates a crash, but consider
  whether custom-source URLs need a same-origin-ish sanity check or just
  rely on the existing "you trust configs you import" posture the rest of
  the store already has (custom objects, background-text entity bindings,
  etc. all carry similar "the config is as trusted as whoever gave it to
  you" posture already).
- **Exclusion polygons vs. the single-floor geo-frame caveat.** Per §7.1,
  exclusion polygons ride the same shared world-mm frame as
  `Store.geo.landmarks`, which CLAUDE.md documents as translating "ONLY
  when `store.floors.length === 1`" during floor-boundary edits — multi-
  floor homes editing floor 0's boundary could desync exclusion polygons
  from the geo frame exactly as landmarks already can. Inherited risk, not
  a new one, but worth confirming behaves sanely (or is explicitly called
  out to the user) rather than silently drifting.
- **Attribution placement finalization.** §7.8 proposes a fixed always-on
  corner credit line; whether it should share the weather-chip's anchor
  system (`chipAnchorStyle`) for user repositioning, or stay deliberately
  non-configurable (since it's a compliance requirement, not a preference),
  is a real product call — leaning toward "non-configurable position, but
  small/unobtrusive" but not resolved here.
- **Refresh cadence vs. "don't hammer OpenFreeMap."** 30-day tile-cache TTL
  (§7.3) is this doc's own conservative proposal, not something OpenFreeMap
  publishes as a required minimum — confirm it's comfortably good-citizen
  behavior (it should be: a handful of tiles per house, refetched roughly
  monthly, is negligible against a service that survived 100k req/s) rather
  than over- or under-conservative once real usage patterns are known.

## 11. Sources

- [OpenFreeMap](https://openfreemap.org/) — service overview, styles, no
  usage limits, self-hosting summary.
- [OpenFreeMap Quick Start Guide](https://openfreemap.org/quick_start/) —
  style URLs, required attribution text.
- [hyperknot/openfreemap](https://github.com/hyperknot/openfreemap) — MIT
  license, Btrfs+nginx architecture, deliberate non-use of PMTiles, weekly
  planet refresh cadence, self-hosting hardware requirements.
- [hyperknot/openfreemap self-hosting docs](https://github.com/hyperknot/openfreemap/blob/main/docs/self_hosting.md)
- [Zsolt Erő — "OpenFreeMap survived 100,000 requests per second"](https://blog.hyperknot.com/p/openfreemap-survived-100000-requests) —
  real-world load behavior, Cloudflare cache-hit rate, planned referrer-based
  bandwidth limits.
- Live TileJSON fetched directly from `https://tiles.openfreemap.org/planet`
  (2026-07-23) — authoritative minzoom/maxzoom, `vector_layers` field lists,
  attribution string, CORS headers, tile URL template — all quoted verbatim
  in §2/§3.
- [OpenMapTiles schema](https://openmaptiles.org/schema/) — full 16-layer
  list.
- [openmaptiles/layers/building/building.yaml](https://github.com/openmaptiles/openmaptiles/blob/master/layers/building/building.yaml) —
  `render_height`/`render_min_height`/`colour`/`hide_3d` field definitions.
- [openmaptiles/layers/building/building.sql](https://github.com/openmaptiles/openmaptiles/blob/master/layers/building/building.sql) +
  [openmaptiles/openmaptiles#19](https://github.com/openmaptiles/openmaptiles/issues/19) —
  the `min_level * 3.66` fallback constant.
- [Key:building:levels — OSM Wiki](https://wiki.openstreetmap.org/wiki/Key:building:levels) —
  community ~3 m/level convention.
- ["Quality of crowdsourced geospatial building information: A global
  assessment of OpenStreetMap attributes" — ScienceDirect, 2023](https://www.sciencedirect.com/science/article/pii/S0360132323003220) —
  4.6%/2.9%/~7% height-tag coverage statistics.
- [Mapbox Vector Tile Specification — `vector_tile.proto`](https://raw.githubusercontent.com/mapbox/vector-tile-spec/master/2.1/vector_tile.proto) —
  exact message/field numbers used in §7.2.
- [MapLibre GL JS — Display buildings in 3D](https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/) —
  the `fill-extrusion-height`/`fill-extrusion-base` ↔ `render_height`/
  `render_min_height` contract this design reproduces.
- [MapLibre GL JS bundle-size tracking issue #7255](https://github.com/maplibre/maplibre-gl-js/issues/7255) +
  [bundlephobia: maplibre-gl](https://bundlephobia.com/package/maplibre-gl) —
  ~210 kB (minimal) to ~750+ kB (full) gzipped bundle size figures.
- [Protomaps / PMTiles docs](https://docs.protomaps.com/pmtiles/) — HTTP
  range-request tile access model, referenced for the `source: 'custom'`
  small-extract alternative.
- Diorama repo internals (read directly): `src/geo.ts` (`GeoTransform`,
  `latLonToPlan`, `projectLatLon`, `clampToBoundary` and its "no yard slab
  in v1" precedent), `src/geometry.ts` (`bufferPolyline`, `pointInPolygon`,
  `WALL_KINDS`), `src/mqtt-ws.ts` (the zero-import wire-codec precedent this
  doc's `mvt-decode.ts` mirrors), `src/model-store.ts` / `src/avatar-store.ts`
  (the IndexedDB cache precedent `neighborhood-store.ts` mirrors),
  `docs/research/terrain-enhancements.md` (yard-fill/ground-area layering
  `y` conventions, the ghost-floor `ShapeGeometry` sign gotcha this doc
  reuses verbatim), `docs/research/pool-spa.md` (doc structure/precision
  precedent), CLAUDE.md ("Geo reference & GPS device pins", "Sky backdrop",
  "Yard arc: ground coverings", the lazy 3D chunk rule, "HA = source of
  truth" `_loadFromHa` field-list gotcha).
