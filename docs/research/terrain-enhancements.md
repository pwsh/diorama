# Terrain Enhancements — Build-Ready Research

Status: research complete, not yet implemented. Scopes an open-ended "take the
yard/outdoor terrain further" brief into a concrete, ranked feature set that
extends the shipped **yard arc (batch K)** — `Floor.groundAreas` (grass/rock/
concrete/blacktop/mulch/sand/water polygons), the `outdoor` furniture cat
(trees/bushes/fountain/lawn furniture/bins), the ground-plane `THREE.GridHelper`,
and the "no yard slab in v1" pinned decision in `src/geo.ts` — plus the
`docs/ROADMAP.md` "architectural prerequisite #4: yard/terrain concept" that
gated pool, irrigation-arc animation, and gates.

## 1. Summary

Diorama's yard today is **flat paint on a void**: `GroundArea` polygons are
textured `ShapeGeometry` patches at a fixed `y≈4`, the floor rect
(`0..w × 0..d` mm) extends past the house walls (the simulated lawn-mower
already sweeps it), but nothing renders there by default, and every outdoor
surface — grass, driveway, pond — is perfectly flat. Three research docs
already exist for specific yard fixtures that were explicitly deferred pending
"a yard/terrain concept" (`irrigation-sprinklers.md`, `pool-spa.md`, and the
vehicle/mailbox items already shipped from `moon-uv-vehicle.md` /
`peripheral-fixtures.md`). This doc is the missing prerequisite layer: it
proposes **elevation, boundary fences/gates, moving water, and a couple of
authoring conveniences (default yard fill, path/driveway ribbons)**, all
designed to slot into the *existing* `GroundArea`/`Wall`/`Door` pipelines
rather than invent parallel machinery — consistent with how every other batch
in this codebase reuses a shipped recipe (canvas-fixture, wall-kind,
door-opening, `_terrain`/`_groundYAt`) instead of a new one.

**Headline recommendation, ranked by wow-per-effort:**

| # | Feature | Effort | Wow | Verdict |
|---|---|---|---|---|
| 1 | Terraced ground elevation (`GroundArea.elevationMm`) | M | 5 | **Build first** — unlocks hills/berms/sunken ponds and is the literal "terrain" ask |
| 2 | Fences + gates (`WallKind` + `Door.kind`) | S–M | 4 | **Build** — almost free, reuses the railing-build precedent nearly verbatim |
| 3 | Default yard fill (opt-in flat grass outside walls) | S | 3 | **Build** — cheap, fixes the "void yard" first impression |
| 4 | Animated water shimmer + fountain particles | S | 3 | **Build** — a few lines on shipped code |
| 5 | Sprinkler/irrigation arcs | (already researched) | 4 | **Build now** — `irrigation-sprinklers.md` was blocked on exactly this doc |
| 6 | Path/driveway ribbon authoring | M | 3 | Build — nice authoring UX, zero new rendering |
| 7 | Hedge (`WallKind`) + rock cluster (`FurnitureKind`) | S | 3 | Build — trivial additions once fences ship |
| 8 | Pool/spa (sunken basin) | (already researched) | 4 | **Build after** #1 — reuses the terrace-skirt technique this doc introduces |
| — | Yard slab / property-extent GROWTH beyond the floor rect | — | — | **Reject** — the floor rect already IS the property extent (see §3.2) |

## 2. What Diorama already has (grounding)

Read directly from the codebase before designing anything new:

- **`GroundArea`** (`src/types.ts`, `Floor.groundAreas`): `{id, name?, points:
  Vec2[3..20], kind: GroundKind, locked?, hidden?}`. `GroundKind` = `grass |
  rock | concrete | blacktop | mulch | sand | water`. Drawn as a flat
  `ShapeGeometry` patch at world `y = 4` (`updateGroundAreas`,
  `three-renderer.ts:2484`) with a cached 256×256 `CanvasTexture`
  (`_groundTexture(kind)`, `:2404`, `_groundTexCache`), `repeat 1/800` (one
  tile per 800 mm). 2D: flat kind-colored fill (`drawGroundAreas`,
  `canvas-render.ts:1910`), drawn right after the floor, **low-priority hit
  test** (`hitGroundArea`, after every fixture hit — paint never swallows a
  fixture click). Draw latch `p.drawingGroundArea` mirrors the wall-draw /
  presence-zone idiom (click verts, dblclick/Enter finish, ESC cancel);
  vertex drag is `groundVert`. Rides the `ground` layer (absent = on). **Pure
  paint — never blocks nav** (`_buildNav` never reads `groundAreas` at all).
- **Floor rect vs. wall loops**: the 3D floor slab is clipped to
  `closedWallLoops(walls)` — "no closed loops → classic full-rectangle
  floor" (CLAUDE.md, "Wall kinds & clipped floor"). This means **the area
  outside every wall loop but inside the floor rect renders NOTHING by
  default** (no slab, no texture) — the "void yard" the brief is reacting to.
  Only a painted `GroundArea` (or the `THREE.GridHelper`, which is suppressed
  once a bg image is visible) puts anything there today.
- **The floor rect already IS "the property"**: `mowerSweepWaypoints(walls,
  w, d)` (`geometry.ts:1516`) already treats the WHOLE `0..w × 0..d` rect
  minus wall-loop interiors as sweepable yard for the simulated lawn mower —
  users already resize the floor rect via the boundary-drag feature ("Floor
  boundary editing", CLAUDE.md) to make it bigger than the house footprint.
  There is no separate "property boundary" concept missing; the floor rect
  already plays that role for every yard feature shipped so far (ground
  areas, outdoor furniture, geo landmarks, GPS pins).
- **`geo.boundaryM`** (`src/types.ts:977`, default 30 m): the GPS-pin render
  boundary — floor rect inflated by `boundaryM`, pins beyond it clamp to the
  edge. `clampToBoundary`'s own comment states the design intent explicitly:
  *"there is no yard slab in v1"* (`src/geo.ts:153`). This doc's §3.2 answers
  that directly: add an **opt-in flat default fill**, not a boundary/geometry
  change — `clampToBoundary` and the floor rect are untouched.
- **Terrain height today**: `_terrain: {x,y,w,h,rotation,ht,elevation,kind}[]`
  (three-renderer.ts) is populated ONLY by stairs/landings and
  `riser_platform` pieces; `_groundYAt(wx,wy)` (`:2275`) walks it and returns
  the highest matching flat top (stairs quantize into N treads along their
  local length; landings/risers are a single flat top = `elevation + ht`).
  `_buildNav` (`:3879`) rasterizes a 150 mm blocked-cell grid from furniture
  footprints + solid walls + void-area polygons; risers/stairs are
  **exempted from blocking** (`isRiserKind`, `geometry.ts:2032`) because
  they're walkable terrain, not obstacles. Blob shadows re-ground every
  frame off `_groundYAt` (CLAUDE.md, Sims-rendering section) — this is the
  exact mechanism new terrain height needs to hook into, and it does so for
  free once `_terrain` gains new entries (see §3.1).
- **Floor voids** (`Floor.voidAreas`): the closest existing precedent for
  "a GroundArea-shaped polygon that changes the nav grid and cuts a hole in
  the floor patch" — proves the earcut-hole + nav-block techniques this doc
  reuses for sunken terrain are already load-bearing, not speculative.
- **`Wall.kind`** = `full | half | railing | invisible` (`types.ts:12`,
  `WALL_KINDS: Record<WallKind, {label, h}>`, `geometry.ts:201`). The
  `railing` build (`three-renderer.ts:3103`) is the exact precedent §3.3
  reuses: per-segment top rail + bottom rail + evenly-spaced posts +
  evenly-spaced thin balusters, all `_mat()` boxes, no new geometry
  technique.
- **`Door.kind`** = `swing | garage` (`types.ts:527`); `entity_id` doc
  comment already reads *"binary_sensor (\"on\" = open) OR cover.\*
  (\'open\'/\'closed\', current_position for partial)"* — i.e. **the
  existing Door already accepts a `cover.*` binding and resolves it through
  `doorOpenFraction`**. A gate needs no new state-resolution code at all.
- **Already-shipped outdoor pieces relevant here**: `fountain` (currently "a
  static translucent water column — no particles v1", per the yard-arc
  section), `flower_bed`/`plant` (already `isDroopPlant` — bindable soil-
  moisture droop, see "Device-state bindings… Plant droop" — a raised garden
  bed needs **zero new code**, just user placement + optional `elevationMm`
  from §3.1), `car`/`ev_charger`/`mailbox` (shipped Phase 1b — vehicle
  presence and mail badge are DONE; this doc does not revisit them despite
  ROADMAP's old "vehicle" framing).
- **Water valves already shipped** (`ValveFixture`, "Water valves & smart
  plugs" section): free-placement pipe+wheel fixture bindable to `valve.*`/
  `switch.*`/`binary_sensor.*` with animated flow dashes. This is NOT the
  irrigation-sprinkler fixture (no spray arc, no ground-area association)
  but is the generic plumbing-control precedent `irrigation-sprinklers.md`
  already cites and this doc's §3.5 defers to.

## 3. Candidate scope evaluation

### 3.1 Height-varying terrain — **recommend, build first** (Effort M, Wow 5)

This is the literal "terrain" ask and the one item with no existing partial
implementation. The design goal is a hill/berm/swale that (a) looks right in
the Sims-toon style, (b) avatars/mowers can walk on top of, and (c) costs
**zero new three.js technique** — it's a generalization of the riser-platform
/ pool-basin-recess idioms already proven in this codebase.

**Real-world reference** (residential landscaping): a **berm** (mounded
earth, typically 300–900 mm / 1–3 ft tall, gentle 3:1 to 4:1 slope) is the
common "add interest to a flat yard" feature; a **retaining-wall terrace**
(vertical or near-vertical stepped cut, common in sloped-lot landscaping)
uses timber/block/stone walls at each level change, typical rise 200–600 mm
per tier; a **swale** (shallow drainage depression) is the inverse, typically
150–450 mm deep. Low-poly/toon game terrain conventionally renders elevation
change as **discrete terraces** rather than a smooth heightfield — this is a
well-known stylization technique (banded/terraced low-poly terrain), and it
happens to be exactly what Diorama's existing flat-`ShapeGeometry`-patch +
toon-gradient-band aesthetic wants: a smooth continuous heightfield mesh
would need per-vertex lighting normals and a wholly new mesh-authoring path,
while a stack of flat terraces reuses the shape-patch-plus-skirt
`ShapeGeometry` technique verbatim per tier.

**Diorama data model** — one new optional field on the EXISTING type, fully
backward compatible (absent = 0 = today's flat behavior, zero migration):

```ts
export interface GroundArea {
  id: string;
  name?: string;
  points: Vec2[];
  kind: GroundKind;
  elevationMm?: number;   // NEW: +raise / −sink relative to grade (0); default 0
  locked?: boolean;
  hidden?: boolean;
}
```

No `repairFloor` change needed (optional field, arrays pass through
unchanged — the same reasoning already documented for `Furniture.doorEntity`/
`localState`-style item-level additions). **Authoring a hill = drawing
multiple nested `GroundArea` polygons by hand**, each with its own
`elevationMm` (e.g. a 6000 mm-wide grass polygon at `elevationMm: 0`, a
4000 mm polygon nested inside it at `600`, a 2000 mm polygon nested inside
that at `1200` — a 3-tier hill). This deliberately avoids inventing a
polygon-offset/buffering algorithm: the user places tiers the same way they
already place any ground area, and the skirt-base logic below makes nesting
render correctly without cross-area geometry math.

**Skirt-base resolution** (the one piece of new logic, pure and cheap): for
area A, the skirt (the sloped/vertical side connecting A's elevated top down
to grade) should stop at the elevation of whatever it's sitting ON, not
always at 0 — otherwise a small nested tier cuts a visible cliff through the
larger tier beneath it. Resolve once per area at build time:

```ts
// geometry.ts — pure, testable like closedWallLoops/pointInPolygon
export function groundAreaSkirtBase(area: GroundArea, all: GroundArea[]): number {
  const rep = polygonCentroid(area.points);   // existing/new tiny helper
  let base = 0;
  for (const other of all) {
    if (other.id === area.id || other.hidden) continue;
    const oe = other.elevationMm ?? 0;
    if (oe <= (area.elevationMm ?? 0) && oe > base && pointInPolygon(rep.x, rep.y, other.points)) {
      base = oe;
    }
  }
  return base;
}
```

This is a small `O(areas²)` loop over a per-floor array that's realistically
under a few dozen entries — computed once per `_keyGround` rebuild, never
per-frame. `pointInPolygon` already exists (used by `mowerSweepWaypoints`,
`resolveRoomForPoint`, void-area nav blocking).

**2D representation** (`canvas-render.ts` `drawGroundAreas`): unchanged fill
for `elevationMm === 0`. For a non-zero tier, additionally stroke a lighter
(raised) or darker (sunk) inset ring a few px in from the polygon boundary —
a cheap "contour line" read, and (when the area is selected) a small
`+600 mm`/`−450 mm` caption near the centroid, matching the existing
selected-chip convention (env sensor value chip, oven temp chip). No new hit
priority — still the lowest-priority paint hit.

**3D representation** (`three-renderer.ts`, extends `updateGroundAreas`):
for each area, build the flat top patch (unchanged shape/texture logic) at
`y = elevationMm + 4` instead of the hard-coded 4, **plus a skirt ring**
between the polygon's own edge and `y = groundAreaSkirtBase(area, areas)`:
a per-edge quad strip exactly like the wall-segment extrusion already builds
per-edge geometry (`_buildSolidWallSegment`'s per-edge approach, generalized
from a rectangular wall run to an arbitrary closed polygon) — connecting
each `(x,z)` edge vertex at the top elevation down to the same `(x,z)` at
the skirt-base elevation. Two skirt styles selected by `kind`:
- **Angled/sloped** (grass, mulch, sand — reads as a natural berm): outset
  the BASE ring outward along each edge's outward normal by
  `|elevationMm − skirtBase| × 1.5` (a ~34° slope) before dropping to the
  base height, giving a raked "hillside" silhouette instead of a cliff.
- **Vertical** (rock, concrete — reads as a retaining wall/raised bed):
  no outward offset, a straight vertical quad ring — this is *also* the
  natural rendering for a raised concrete garden bed or a rock-terrace cut.
- `water` at negative `elevationMm` is a preview of the pool basin-recess
  technique `pool-spa.md` already designed in detail (§4.3 of that doc) —
  this doc's skirt code is written generically enough that `Pool` can reuse
  it directly when built (see §3.4).

Materials: same `_mat()` toon factory, same `_groundTexture(kind)` cache —
zero new texture work. Outline shells are skipped on the skirt ring (like
ground patches today, `userData.outlineSkip = true`) since a wrapped
inverted-hull shell around a terrain skirt would read as a weird halo.

**Nav & avatar implications** — the deliberately simple, consistent choice:
- Register each area's TOP polygon into `_terrain` as a new flat-entry kind
  (`'terrace'`), extending `_groundYAt`'s existing flat-top branch
  (`t.kind === 'stair_landing' || t.kind === 'riser_platform'` →
  `|| t.kind === 'terrace'`) — **this is the entire nav-height change**, a
  one-line extension of code that already exists and is already exercised by
  risers/landings.
- `_buildNav`'s blocked-cell rasterizer never touches `GroundArea` at all
  today (confirmed above) — terraces need **no new exemption**, they simply
  continue to not block, exactly like risers/stairs are explicitly exempted
  from furniture blocking today. Avatars can walk directly onto/off a
  terrace top; there is no continuous slope-walking (no rig root pitch
  change while crossing the skirt) — this matches how stepping onto a
  `stair_landing` or `riser_platform` already works today (an instant flat-
  height read at the top polygon's boundary, sold visually by the skirt
  mesh, not by foot-by-foot slope tracking). Generalizing `_groundYAt` into
  a continuous local-slope query (and pitching the rig root to match) is
  flagged as deliberately NOT proposed (§8) — meaningfully more engineering
  for a marginal gain the dimetric "Sims cam" rarely exposes.
- **Known v1 approximation**: a nav cell whose CENTER lands exactly on the
  thin skirt ring (rather than inside the top polygon or fully outside it)
  reads as `elevation = 0`/base while the skirt mesh visually rises around
  it — a minor boundary-only artifact, the same class of quantization
  tradeoff already accepted for stair-edge cells today. Not a regression.
- Mower sweep (`mowerSweepWaypoints`) is unaffected (it only tests wall-loop
  containment, never ground-area/elevation) — a simulated mower will
  currently drive straight over a berm at grade height in its 2D-only sweep
  math; feeding elevation into the mower's height easing is a cheap
  follow-up (read `_groundYAt` the same way avatar rigs do) but not required
  for v1 since the mower render already re-grounds via the shared
  `_groundYAt` call the renderer makes for it (verify at implementation
  time — flagged in Open Questions).

**Dirty key**: fold into the existing `_keyGround` (configRev + per-area
`elevationMm` hashed in) — no new key needed, this is purely a richer build
of an already-dirty-keyed group.

**Effort**: **M** — one new field, one pure helper + tests, extend one
renderer function (build the skirt ring — a per-edge quad strip, the same
technique used three other places in this codebase), one `_groundYAt`
one-liner, 2D contour stroke + caption. **Wow: 5** — visually the single
biggest "this yard finally looks like terrain" win, and the base primitive
`pool-spa.md`'s sunken basin and any future retaining-wall/planter-box work
builds on directly.

### 3.2 Yard slab / property extent — **recommend a small opt-in default-fill, reject growing the floor rect** (Effort S, Wow 3)

As established in §2, **there is no missing "property boundary" concept** —
the floor rect already is the property extent used by the mower, geo
landmarks, and GPS-pin clamping. The actual gap is purely visual: nothing
paints the yard outside wall loops by default, so a fresh floor with walls
looks like a house floating in a void until the user manually paints
`GroundArea` polygons over the whole lot.

**Design**: one new optional per-floor field:

```ts
export interface Floor {
  // ...
  yardFill?: GroundKind;   // NEW: auto-paint this ground kind over the floor
                            // rect MINUS every closed wall loop. Undefined = off
                            // (today's void behavior — opt-in, no surprise regressions
                            // on existing plans).
}
```

`repairFloor`/`defaultFloor`: no backfill needed (optional, undefined =
inert) — but it DOES need to be read wherever `Floor` fields are
reconstructed if `Planner._loadFromHa` ever special-cases floor fields (today
it doesn't — floors pass through as full objects per-floor, only `Store`
top-level fields need the explicit list per CLAUDE.md's gotcha note; verify
at implementation time that per-floor optional fields truly need no
`_loadFromHa` change, matching how `Floor.disabled`/`Floor.look3d` already
work as plain pass-through fields).

**Rendering**: `updateFloor` builds ONE extra `ShapeGeometry` patch — the
floor rect (`0,0`–`w,d`) with each closed wall loop subtracted as an earcut
hole (the exact technique already used for the floor slab's stairwell/void
holes — this is the SAME hole-punching code, just applied to the whole rect
instead of "the floor slab minus voids") — textured via the same
`_groundTexture(kind)` cache, at **`y = 2`** (below the `y = 4` of explicit
`GroundArea` patches, so any user-painted area — grass replaced by a sand
patch, a driveway — simply draws on top with zero boolean-subtraction
complexity; no need to also punch holes for user paint). Terraces (§3.1)
still rise correctly above this base fill since their own top sits above
`y = 4` already. 2D: analogous flat low-priority background fill, drawn
before `GroundArea`s and after the floor slab. Cost: one extra cached patch,
rebuilt only under the SAME `configRev`/wall-loop-hash `_keyGround`/`_keyFloor`
already gating the slab — no new dirty key.

**Sidebar**: a "Yard fill" dropdown (None / Grass / …) in the per-floor
Floors section (next to `look3d`), or the Ground-area tools area — a
one-line addition.

**Nav/GPS interplay — unchanged**: `clampToBoundary`, `geo.boundaryM`, and
the mower sweep all already operate purely in floor-rect coordinate space;
this feature changes rendering only, never geometry, so nothing downstream
needs to change. This directly and conservatively answers geo.ts's pinned
"no yard slab in v1" comment: **yes to a flat default-color fill, no to
growing the modeled world**.

**Effort: S** (one field, one extra cached patch reusing 100% existing
texture/hole-punch code). **Wow: 3** (fixes first impressions, not a
showpiece). **Recommend building alongside §3.1** since both touch
`updateFloor`'s ground-related section in the same pass.

### 3.3 Fences & gates — **recommend** (Effort S–M, Wow 4)

**HA data model** (the one candidate here with a real binding): a gate is a
`cover.*` entity with **`device_class: gate`** — confirmed current HA core
vocabulary (`Cover` integration docs, home-assistant.io/integrations/cover/):
states `open | opening | closed | closing | (stopped)`, actions
`cover.open_cover` / `cover.close_cover` / `cover.stop_cover` /
`cover.toggle`, optional `current_position` (0–100) when
`SET_POSITION`/`CoverEntityFeature.SET_POSITION` is supported. There is also
a small dedicated **Gate integration** (home-assistant.io/integrations/gate/)
that layers convenience triggers/conditions (`gate.is_open`) over exactly
this same `cover` entity — informational only, no new entity shape to design
around. **This is precisely the shape `Door.entity_id`'s doc comment already
declares support for** (`binary_sensor` OR `cover.*`) — a gate needs **zero
new state-resolution code**, `doorOpenFraction` already handles `cover.*`
open/opening/closed/closing + `current_position`.

**Diorama data model**:

```ts
export type WallKind = 'full' | 'half' | 'railing' | 'invisible'
                      | 'fence_picket' | 'fence_privacy' | 'fence_chainlink' | 'hedge';  // NEW

export const WALL_KINDS: Record<WallKind, { label: string; h: number }> = {
  // ...existing four...
  fence_picket:    { label: 'Picket fence',     h: 1100 },
  fence_privacy:   { label: 'Privacy fence',    h: 1800 },
  fence_chainlink: { label: 'Chain-link fence', h: 1200 },
  hedge:           { label: 'Hedge',            h: 900 },  // see §3.7 — bundled here since it's the same WallKind mechanism
};

export type DoorKind = 'swing' | 'garage' | 'gate';   // NEW
```

New `Wall.kind` values ride the EXACT existing per-wall picker
(`planner.pendingWallKind`, shown in the tools area when the Wall tool is
active — already how `railing`/`invisible`/`half` are chosen) and the
EXISTING double-click-to-cycle-kind interaction. No new tool, no new
sidebar section, no `repairFloor` change (wall kind is already an optional
per-wall field).

**3D build** (`three-renderer.ts`, extends the `kind === 'railing'` branch
at `:3103` — same per-segment loop, same `bar()` local helper already used
to place rectangular box members along a wall segment):
- `fence_picket`: top rail + bottom rail (thin, like railing) + posts every
  ~1800 mm + **pickets** every ~100 mm (flat narrow boards, not round
  balusters — same `bar()` call with a wider/flatter box), wood-brown
  `_mat()` color (or `scene3d.wallColor` override, matching railing).
  `h = 1100` (~43 in, standard picket height).
- `fence_privacy`: reuses the SOLID wall extrusion path
  (`_buildSolidWallSegment`, the same one `full`/`half` already use) at
  `h = 1800`, opaque, thin (60 mm vs. the house's 100 mm), wood-tone
  material — visually a shorter, thinner version of a `half` wall. This is
  the cheapest variant: literally the existing solid-wall builder called
  with different height/thickness/color constants.
  Note: because door OPENINGS punch through whatever wall builder handles
  the segment (`wallCutsForSegment` is kind-agnostic), a gate on a
  `fence_privacy` run gets a real gap for free.
- `fence_chainlink`: posts only (thin poles) + a semi-transparent diamond-
  mesh `CanvasTexture` plane spanning each segment at fence height — a new,
  small addition to the procedural-texture cache family (`_fenceMeshTexture`,
  same build-once/dispose-in-`destroy()` pattern as `_groundTexCache`) drawn
  as light grey crossing diagonal lines on transparent background.
  `transparent: true`, low opacity backing so it reads as see-through wire.
- `hedge`: NOT a rail composite — a solid green boxy extruded run (reuse the
  solid-wall extrusion at `h = 900`, thickness ~450 mm, bumpy/rounded top
  via a couple of stacked slightly-narrower boxes for a "trimmed shrub" 
  silhouette) with the ground-texture-style speckle canvas applied as the
  material (reuse `_groundTexture('grass')`-style speckle generation, tinted
  darker green, cached separately as `_hedgeTex`). See §3.7 — bundled here
  because it's the same `WallKind` code path, not a separate feature.

**2D**: each new kind gets its own stroke style in the existing wall-kind
switch (`canvas-render.ts` wall drawing already branches on `wallKind(wall)`
for `railing`'s tick-mark rendering and `invisible`'s dashed line) — picket
= evenly spaced tick marks (denser than railing's baluster ticks), privacy =
solid thick line in a brown tone, chain-link = a fine cross-hatch stroke,
hedge = a thick textured green band. No new hit-test/interaction code (wall
hit-testing is kind-agnostic already).

**Gates**: `Door.kind: 'gate'` — visually a subset of the picket-fence
composite (pivoting on the hinge like a swing door, using the SAME
`doorOpenDeltaDeg` swing math already shared by every door), just built from
picket-style flat boards instead of a solid house-door panel, and thinner/
shorter to match whichever fence kind it sits on. Practical wiring: when a
`Door` snaps onto a wall whose `kind` starts with `fence_`/is `hedge`
(`snapOpeningToWall` already resolves the nearest wall), **default the new
door's `kind` to `'gate'`** (still user-overridable in the sidebar Doors
editor's existing Kind dropdown, which already offers `swing`/`garage` and
gains `gate` as a third option). Binding: the existing entity picker's
`Door.entity_id` field simply accepts `cover.*` (device_class `gate`) or
`binary_sensor.*` as documented — no picker changes. `Door.lockEntity`/
`lockControl`, `doorbellEntity`, and `hinge` all continue to work unchanged
on a gate (a driveway gate with a lock/intercom is a completely reasonable
real setup) — this is the strongest "reuse nearly everything" result in the
whole doc.

**Nav**: fence/hedge walls block `_buildNav` exactly like any other solid
wall segment today (the rasterizer is kind-agnostic except for skipping
`invisible`) — this is CORRECT behavior (you can't walk through a fence) and
needs no new code. Gate openings pass nav LOS exactly like a house door
opening already does (`wallCutsForSegment` excises the opening regardless of
which wall kind it's cut into).

**Effort: S–M** (four new `WallKind`/`WALL_KINDS` entries + one new small
procedural texture for chain-link + one new `Door.kind` value + a
default-kind-on-snap nicety). **Wow: 4** — fences are one of the most
immediately recognizable "this looks like a real yard" visual cues, and
gates riding the existing door/cover pipeline means the HA-integration
payoff (a real `cover.gate` shown open/closed with a lock badge) comes
essentially for free.

### 3.4 Water features v2 — **split recommendation** (Effort S for shimmer/fountain, defer pool to its own doc)

Three sub-items, evaluated separately since they differ hugely in scope:

**3.4a Animated water shimmer on the existing `water` GroundKind — build, S/3.**
Today's `water` ground texture (`_groundTexture('water')`, `:2459`) bakes
static sine-wave ripple lines into the CanvasTexture once and never touches
it again. Cheapest possible upgrade: advance `tex.offset.y` a small amount
per frame for every water-kind ground patch while any are on-screen (a
`_advanceGroundWater(dt)` called unconditionally-but-cheaply from `_animate`,
mirroring the "zero work when nothing's happening" early-return idiom
already used by weather/vents/bed-covers) — the tiled ripple texture appears
to drift, reading as gentle water motion with **zero new geometry, zero new
texture, one texture-offset mutation per frame**. No dirty-key change (this
is pure per-frame motion like `_advanceWeather`).

**3.4b Fountain gets real particles — build, S–M/3.** The shipped `fountain`
`FurnitureKind` is explicitly "static translucent water column — no
particles v1" (yard-arc section). Reuse the weather precipitation idiom
exactly (`_buildPrecipCloud`/`_advanceWeather`'s zero-alloc position-buffer
mutation, `PointsMaterial` — a documented `_mat()` exemption already
established for rain/snow/hail/dust): a small `THREE.Points` cloud (~30–60
pts) arcing up from the fountain's top and falling back into the basin,
recycled on a short cycle, using a new tiny shared `_fountainTex` (or reuse
`_rainTexture()` as `irrigation-sprinklers.md` already recommends for its
own spray heads — same droplet sprite, one more consumer). Gate the
per-frame advance on "any fountain exists on this floor" like vents/weather
already do. No entity binding needed (fountains are decorative, always-on)
— OR, optionally, bind an existing `switch.*`/`pump` entity the same way a
water valve fixture would, to turn the spray on/off; v1 can ship
always-flowing and treat binding as a stretch goal.

**3.4c Pool/spa — do NOT re-derive here, build after §3.1, S3.4c effort as scoped in `pool-spa.md`, Wow 4.**
`docs/research/pool-spa.md` already contains a complete, build-ready design
(HA data model for ScreenLogic/iAquaLink/OmniLogic, real-world pool/spa/
equipment-pad dimensions, `Floor.pools`, 2D/3D rendering, equipment-pad
furniture kinds, integration checklist, open questions) — re-litigating it
here would drift out of sync. The one update this doc contributes: that
doc's §7 open question *"Sunken-basin 3D geometry is new… the stairwell-hole
precedent should be checked directly… to confirm it generalizes cleanly to
an arbitrary polygon"* is now **answered** — §3.1 of this doc builds and
tests exactly that generalization (arbitrary-polygon skirt ring down from a
`GroundArea`'s top to a resolved base elevation) for terraces, and a
negative-`elevationMm` terrace IS a sunken basin. Recommend: once §3.1 ships,
`pool-spa.md`'s basin/skirt implementation step becomes "call the same skirt
builder §3.1 introduces" instead of inventing new recess geometry — a
concrete effort reduction on that doc's build, not just a nice-to-have.

### 3.5 Sprinkler/irrigation arcs — **already researched; recommend building now** (Effort per `irrigation-sprinklers.md`, Wow 4)

`docs/research/irrigation-sprinklers.md` is a complete, build-ready doc
(HA `switch`/`valve`/`binary_sensor` data model across Rachio/Rain
Bird/B-hyve/Irrigation Unlimited, real pop-up-head dimensions, `Floor.
sprinklerZones`, 2D wedge + 3D `THREE.Points` spray animation reusing the
weather-rain idiom, integration checklist). `docs/ROADMAP.md`'s own Tier-4
entry for irrigation states verbatim: *"yard sprinkler-arc animation gated
on a bound switch is easy **once a yard concept exists**"* — this doc is
that yard concept. No redesign needed; the only genuinely new interplay
worth noting:
- Sprinkler heads (free-placed, no wall snap per that doc) sit naturally
  inside a `grass`-kind `GroundArea` — with §3.1's `elevationMm`, a head on
  a raised terrace/berm should spray from that terrace's `_groundYAt`
  height, not grade 0. `updateSprinklerZones`'s head-nub Y position should
  resolve via `_groundYAt(x, y)` (the same call every humanoid rig and blob
  shadow already makes) instead of a hard-coded ~15–40 mm, a one-line change
  once §3.1 lands.
- The "wet-ground decal linger" nice-to-have that doc already flags (§6,
  reusing the weather-puddle `_puddleFade` survives-rebuild mechanism) pairs
  naturally with §3.4a's animated water — both are "make the yard feel
  alive" touches using the same puddle-texture asset.

Recommend building this NOW that §3.1–3.3 exist, per that doc's own
integration checklist, unmodified except the one `_groundYAt` height hookup
above.

### 3.6 Paths / driveways — **recommend, moderate authoring convenience** (Effort M, Wow 3)

**Do the existing kinds suffice?** For a straight driveway or a rectangular
patio, yes — draw an ordinary `concrete`/`blacktop` `GroundArea` polygon
(4–6 vertices), done today with zero new code. The real gap is a **winding
garden path**: a narrow (300–1200 mm), constant-width, curved ribbon is
tedious to author as a raw 12–20-vertex polygon by hand (placing left/right
edge points alternately and keeping the width visually consistent).

**Design**: a lightweight authoring convenience layered ONLY on top of the
existing `GroundArea` — no new rendering, hit-testing, or 3D pipeline:

```ts
export interface GroundArea {
  // ...existing fields, plus §3.1's elevationMm...
  path?: { centerline: Vec2[]; width: number };  // NEW: when present, `points`
                                                   // is DERIVED (regenerated on
                                                   // every centerline/width edit
                                                   // via bufferPolyline) — the
                                                   // stored polygon is a cache,
                                                   // not authoritative.
}
```

One new pure geometry helper, `bufferPolyline(centerline: Vec2[], width:
number): Vec2[]` (mitered-offset ribbon — offset each segment left/right by
`width/2` along its perpendicular, join adjacent segments at the miter
point, cap the two ends flat) — genuinely new pure math (no exact existing
precedent; the closest conceptual cousin is the per-edge wall-segment
extrusion, but that builds 3D geometry directly rather than a 2D point
list). Testable in isolation like every other pure geometry helper
(`nearestAlign`, `mowerSweepWaypoints`).

**Authoring UI**: a new tool `path` (glyph suggestion: `〰️`) using the SAME
click-points/dblclick-or-Enter-finish/ESC-cancel latch idiom as every other
polygon-drawing tool, but recording **centerline clicks** instead of polygon
vertices, plus a width control (sidebar number input, live-previewed).
Finishing calls `bufferPolyline` once to populate `points`, then the result
is stored and rendered as an ORDINARY `GroundArea` (kind defaults to
`concrete`, user-editable to any kind — a mulch garden path is just as
valid) — **zero changes to `drawGroundAreas`, `hitGroundArea`, 3D patch
building, or the `ground` layer gate**. Editing: dragging a centerline
vertex (new drag kind `pathVert`, parallel to `groundVert`) regenerates
`points` via `bufferPolyline` on release; dragging a raw polygon vertex on a
path-backed area is disallowed (or silently converts it to a plain
polygon by clearing `path` — a product call, flagged in Open Questions).

**Effort: M** (one new pure helper + tests, one new tool + draw latch + drag
case, sidebar width control — but the rendering/hit-test/3D side is 100%
reused). **Wow: 3** — a genuine authoring-quality-of-life win, not a visual
showpiece (the RESULT looks identical to a hand-drawn concrete polygon).

### 3.7 Garden/landscaping props — **recommend a small, mostly-already-covered set** (Effort S, Wow 3)

Audit against what's already shipped:
- **Vegetable/garden bed tied to plant-moisture droop**: **already fully
  covered** — `flower_bed` is already `isDroopPlant` (bindable
  `moistureEntity` + threshold + wilt/perk animation, per "Device-state
  bindings… Plant droop"). No new code; the only gap is cosmetic variety
  (today's single `flower_bed` box def) — a `garden_bed` kind with a
  slightly larger footprint and a "rows" texture variant is a trivial
  `FURNITURE_KINDS` copy-paste, not worth its own line item.
- **Hedge**: covered under §3.3 as a `WallKind` (bundled there since it's
  the identical linear-run mechanism, not worth a separate integration
  pass).
- **Rock cluster**: genuinely new — a small decorative outdoor
  `FurnitureKind` (`rock_cluster`, ~800×600×500 mm, 2–4 overlapping
  irregular boxes/low-poly rounded shapes in grey tones, non-nav-blocking
  is WRONG here — a boulder cluster should block like normal furniture,
  i.e. no special nav exemption needed, it's just an ordinary outdoor piece)
  — this is the ONE truly new furniture kind this doc proposes, and it's a
  trivial `FURNITURE_KINDS` entry + a `three-renderer.ts` `_buildFurniture`
  case (a handful of boxes) + a `canvas-render.ts` primitive case (an
  irregular blob fill). No moisture/state binding, no activity anchor.
- **Garden border edging**: considered and cut — a thin low border around a
  flower bed is already visually implied by the `GroundArea`/furniture
  outline itself; a dedicated edging primitive would be a decorative
  rounding error not worth a data-model addition. Listed under §8
  (deliberately not proposed) rather than scoped.

**Effort: S** (one new `FurnitureKind` entry, reuses 100% of the existing
furniture pipeline per the "Adding a new FurnitureKind" gotcha recipe in
CLAUDE.md). **Wow: 3** — a nice finishing touch, appropriately small in
scope since most of the "garden prop" surface area turned out to already
exist.

## 4. Cross-cutting data model & rendering summary

| File | Change |
|---|---|
| `src/types.ts` | `GroundArea.elevationMm?`, `GroundArea.path?`, `Floor.yardFill?`, `WallKind` +4 values, `DoorKind` +`'gate'` |
| `src/geometry.ts` | `groundAreaSkirtBase()`, `bufferPolyline()`, `WALL_KINDS` +4 entries, new `FURNITURE_KINDS.rock_cluster` |
| `src/canvas-render.ts` | `drawGroundAreas` contour stroke + elevation caption; new wall-kind 2D strokes (picket/privacy/chainlink/hedge); path/driveway looks identical to existing ground fill (no change); rock-cluster primitive case |
| `src/canvas-hit.ts` | no changes (elevation/path/fence/gate all reuse existing hit tests) |
| `src/canvas-interact.ts` | new `path` tool draw latch + `pathVert` drag kind; default `Door.kind` to `'gate'` on fence-wall snap |
| `src/ui/sidebar.ts` | elevation input on Ground-area editor; path width input; `yardFill` dropdown (Floors section); `gate` added to the Door Kind dropdown; new `path` tool entry; wall-kind picker gains 4 entries (automatic — enumerates `WALL_KINDS`) |
| `src/three-renderer.ts` | `updateGroundAreas` skirt-ring build + `y` offset by `elevationMm`; `_groundYAt` gains `'terrace'` to its flat-top kind check; `_terrain` gains terrace entries in `updateFloor`; yard-fill patch (new small builder, reuses hole-punch + `_groundTexture`); water shimmer `_advanceGroundWater(dt)`; fountain particle cloud + advance; fence/hedge wall-kind branches (extends the `railing` switch) |
| `src/three-view.ts` | fold `elevationMm`/`yardFill`/wall-kind hashes into `_keyGround`/`_keyFloor` (no new dirty key) |

## 5. Nav & avatar implications (consolidated)

- **Terraces**: walkable, flat-top "step onto it" semantics via `_terrain`/
  `_groundYAt` — no slope-walking, consistent with stairs/risers/landings
  today. Blob shadows re-ground for free.
- **Fences/hedges**: block nav like any solid wall (correct — you can't walk
  through a fence); gates pass nav LOS through their opening like a door.
- **Yard fill / paths**: pure paint, zero nav effect, exactly like
  `GroundArea` today.
- **Water shimmer/fountain particles**: zero nav effect (fountains already
  block as ordinary furniture; the `water` ground kind is decorative paint,
  never a nav blocker, matching every other `GroundArea` kind).
- **Sprinklers**: no nav effect (per `irrigation-sprinklers.md`, free-placed
  small ground fixture, not a nav obstacle).
- **Rock cluster**: blocks nav like normal furniture (footprint inflated by
  `PERSON_R`, same as any other non-rug, non-exempted piece) — no special
  case needed.
- **AI/roamer goal picking**: none of the above need new goal-bias logic —
  a terrace top is just another walkable region cell; a gate opening is
  just another nav-passable gap. The existing region/largest-region/
  wall-LOS snap machinery (`_nearestFreeCell`, `_buildNav.wallSolids`)
  handles all of it without modification.

## 6. Proposed build order

Sized and sequenced like past batches (`docs/ROADMAP.md`'s "Staged build
plan"), smallest-first-unlocks-largest:

- **Batch T1 — Terrain foundation** (§3.1 + §3.2): `GroundArea.elevationMm`
  + skirt-ring build + `_terrain`/`_groundYAt` hookup + 2D contour stroke,
  bundled with `Floor.yardFill` (touches the same `updateFloor`
  ground-section code path). This is the doc's core deliverable and the
  prerequisite for T3.
- **Batch T2 — Boundaries** (§3.3): fence `WallKind`s (picket/privacy/
  chainlink) + `hedge` + `Door.kind: 'gate'` + `cover.gate` binding
  (already-generic `doorOpenFraction`) + default-kind-on-snap. Independent
  of T1 — could ship in either order, grouped after T1 only because fences
  read better once a yard fill (T1's `yardFill`) exists to fence something in.
- **Batch T3 — Yard life** (§3.4a/b + §3.5 + rock cluster from §3.7):
  animated water shimmer, fountain particles, sprinkler zones (per the
  existing `irrigation-sprinklers.md` doc, minus one `_groundYAt` hookup
  line), rock cluster furniture kind. All small, independent, parallelizable.
- **Batch T4 — Authoring polish + pool** (§3.6 + §3.4c): path/driveway
  ribbon authoring tool, then `pool-spa.md`'s `Floor.pools` build (now
  cheaper — reuses T1's skirt-ring builder instead of inventing sunken-basin
  geometry from scratch).

## 7. Deliberately NOT proposed

- **Smooth continuous heightfield terrain mesh** (per-vertex displaced
  ground, real slope-following avatar locomotion). Rejected: clashes with
  the flat-patch toon aesthetic, requires an entirely new mesh-authoring +
  per-vertex-normal + continuous-slope-nav pipeline for a visual gain the
  dimetric camera rarely sells over discrete terraces. Terraced elevation
  (§3.1) is the deliberate, stylistically-correct substitute.
- **Freehand terrain "sculpting brush"** (paint a heightmap with a brush
  tool across an unbounded canvas). Rejected for the same reason as above,
  plus it doesn't fit the polygon-based `GroundArea` authoring model every
  other yard feature uses — would be a second, inconsistent authoring
  paradigm.
- **Growing the floor rect / a separate "property boundary" polygon
  distinct from the floor rect.** Rejected — see §3.2; the floor rect
  already serves this role for every shipped yard feature (mower sweep, geo
  boundary, GPS clamp), and a second boundary concept would fork that
  meaning for no benefit.
- **Real GPS-derived topography** (importing actual elevation-API data for
  the user's real address). Out of scope — Diorama's whole geo/GPS system
  is deliberately a flat local tangent-plane projection (`geo.ts`); mixing
  in real elevation data would need a geodetic vertical datum and a mapping
  from real elevation deltas (often tens of meters over a property) down to
  a stylized few-hundred-mm terrace scale, which is an editorial/artistic
  translation, not a data import — better left to manual terrace authoring.
- **Seasonal/weather-driven terrain state** (snow accumulation depth on
  terrain, mud/erosion after rain, drought-browned grass). Interesting but
  a distinct "seasonal decoration" feature orthogonal to terrain geometry;
  the existing frost-icicle and rain-puddle weather-FX precedents are the
  right place to extend this later, not this doc.
- **True underwater swim animation for avatars in a pool.** `pool-spa.md`
  scopes the pool as a visual/equipment feature; avatars do not swim
  (no swim gait, no underwater pose) — matches that doc's own restraint and
  this codebase's general rule of not inventing new humanoid gaits without
  a concrete trigger.
- **Garden border edging as a dedicated primitive** (§3.7) — visually
  redundant with existing polygon/furniture outlines.
- **Chlorination/spillover/pool-specific stretch goals** — already correctly
  deferred inside `pool-spa.md` itself; not re-litigated here.
- **Automatic polygon-offset "hill generator"** (auto-derive nested terrace
  rings from a single polygon + a peak height, à la a paint-bucket hill
  tool). Rejected for v1 in favor of manual nested-polygon authoring (§3.1)
  — revisit only if manual nesting proves too tedious in practice; the
  skirt-base resolution logic would carry over unchanged either way.

## 8. Open questions & risks

- **Skirt ring geometry complexity for concave/self-intersecting
  polygons.** `GroundArea` polygons are user-drawn freehand (3–20 verts) and
  not guaranteed convex; the per-edge outward-normal offset for the angled
  skirt style can self-intersect on a sharply concave polygon (a visual
  glitch, not a crash — worth a `bufferPolyline`-style miter clamp, or
  simply accepting minor artifacts on pathological shapes since most
  terrain polygons drawn by hand are gently convex "hill/blob" shapes in
  practice).
- **Mower + terrace elevation**: confirm at implementation time whether the
  robot-mower renderer already calls `_groundYAt` for its Y position (this
  doc assumes it should but did not trace `Planner.stepRobots`/
  `updateRobotRigs` in depth) — if not, add the same one-line hookup
  sprinklers get in §3.5.
- **`path` drag-vertex UX**: whether dragging a raw generated polygon vertex
  on a path-backed `GroundArea` should be disallowed outright or silently
  detach `path` (converting it to a plain polygon) is a product call, not
  resolved here.
- **Chain-link transparency + toon banding**: a semi-transparent diamond-
  mesh plane through a `MeshToonMaterial` may read oddly under the 4-step
  gradient band at grazing angles — worth a quick visual check; falling
  back to a flat `MeshBasicMaterial` (a documented exemption already used
  for other flat/graphic surfaces like now-playing text planes) is the
  fallback if toon shading looks wrong on a wire-mesh texture.
- **Gate default-kind-on-snap** could surprise a user who wants a normal
  swing door on a fence-kind wall (e.g. a fenced trash-can enclosure with a
  full-size access door) — the override is one dropdown click, but the
  auto-default heuristic (wall kind starts with `fence_`/is `hedge` →
  default `gate`) should be double-checked against real authoring flows
  before shipping as a silent default rather than an explicit prompt.
- **Elevation vs. wall-loop floor clipping interaction**: a terrace tier
  whose polygon partially overlaps a wall loop (terrain butting up against
  the house foundation) is unaddressed here — v1 assumes terraces live
  purely in yard space, outside wall loops; overlapping the house slab is
  an authoring mistake the user can make but this doc doesn't design a
  guard against it (matches how `GroundArea` today has no such guard
  either).

## 9. Sources

- Diorama repo internals (read directly, cited inline above with file:line):
  `src/types.ts` (`GroundArea`, `VoidArea`, `Wall`, `Door`, `Floor`,
  `GeoConfig`), `src/geometry.ts` (`WALL_KINDS`, `GROUND_KINDS`,
  `mowerSweepWaypoints`, `isRiserKind`, `FURNITURE_KINDS` outdoor cat),
  `src/geo.ts` (`clampToBoundary`, the "no yard slab in v1" comment),
  `src/three-renderer.ts` (`_groundYAt`, `_buildNav`, `updateGroundAreas`,
  `_groundTexture`, the `railing`/solid-wall build branches, `_terrain`),
  `src/canvas-render.ts` / `canvas-hit.ts` / `canvas-interact.ts`
  (`drawGroundAreas`, `hitGroundArea`, `drawingGroundArea` latch), `src/ui/
  sidebar.ts` (`TOOLS`, `WINDOW_KINDS` pattern used as the model for a
  `DoorKind`/`WallKind` dropdown addition).
- `docs/research/irrigation-sprinklers.md`, `docs/research/pool-spa.md` —
  existing build-ready docs this doc cross-references rather than duplicates.
- `docs/ROADMAP.md` — "Architectural prerequisites" #4 (yard/terrain
  concept) and Tier-4 pool/irrigation entries this doc unblocks.
- [Cover — Home Assistant integration docs](https://www.home-assistant.io/integrations/cover/) —
  `device_class: gate` confirmed in the current device-class list.
- [Gate — Home Assistant integration docs](https://www.home-assistant.io/integrations/gate/) —
  convenience triggers/conditions over a `cover` entity with device_class
  gate; no new entity shape.
- [Cover entity — Home Assistant Developer Docs](https://developers.home-assistant.io/docs/core/entity/cover/) —
  state machine (`open/opening/closed/closing/stopped`), `current_position`,
  `CoverEntityFeature`.
- General landscaping reference for berm/terrace/swale dimensions (typical
  300–900 mm berm height, 200–600 mm per retaining-wall tier, 150–450 mm
  swale depth) and residential picket/privacy/chain-link fence height norms
  (~1100 mm picket, ~1800 mm privacy, ~1200 mm chain-link) — standard,
  widely-repeated landscaping/fencing industry figures, consistent with the
  precedent set by `pool-spa.md`'s equipment-pad and `irrigation-
  sprinklers.md`'s pop-up-head dimension sourcing; not independently
  re-verified against a single primary spec sheet in this pass (flagged
  per this doc's own §8 the same way those docs flag their own
  industry-norm figures).
- Low-poly/toon terrain stylization precedent: terraced/banded elevation as
  a recognized low-poly game-terrain technique (informs the "nested
  GroundArea tiers, not a smooth heightfield" recommendation in §3.1) —
  general game-dev terrain literature (heightmap→mesh, terracing for
  procedural low-poly terrain), not a single canonical source.
