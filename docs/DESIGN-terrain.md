# DESIGN — Terrain enhancements (batches T1–T4)

*Authored 2026-07-18 (Fable). Status: building.*
*Authoritative research: `docs/research/terrain-enhancements.md` (ranked
scope, §3 per-feature designs, §6 build order) — this doc RATIFIES that
plan and pins the open questions. Cross-referenced docs
`irrigation-sprinklers.md` (T3) and `pool-spa.md` (T4) carry their own
authoritative designs.*

## Ratified scope & batch order

- **T1 — Terrain foundation**: `GroundArea.elevationMm` terraces (flat top
  at `elevationMm + 4`, skirt ring down to `groundAreaSkirtBase`; angled
  skirt for grass/mulch/sand, vertical for rock/concrete/blacktop; water
  at negative elevation = sunken basin preview), `_terrain` kind
  `'terrace'` + the one-line `_groundYAt` extension, 2D contour stroke +
  selected elevation caption + sidebar elevation input, PLUS
  `Floor.yardFill?: GroundKind` (opt-in rect-minus-wall-loops fill at
  y=2 / 2D underlay; "Yard fill" dropdown in the Floors section).
- **T2 — Boundaries**: `WallKind` + `fence_picket` / `fence_privacy` /
  `fence_chainlink` / `hedge` (railing-build + solid-wall-extrusion
  precedents per research §3.3), `Door.kind: 'gate'` (picket-styled swing
  panel; `doorOpenFraction` already handles `cover.*`), default new doors
  to `'gate'` when snapped onto a fence/hedge wall.
- **T3 — Yard life**: water-texture shimmer (`_advanceGroundWater`,
  offset drift, per-frame zero-alloc), fountain `THREE.Points` spray
  (weather-precip idiom, always-on v1), sprinkler zones per
  `irrigation-sprinklers.md` (+ the `_groundYAt` head-height hookup),
  `rock_cluster` FurnitureKind (ordinary nav-blocking outdoor piece).
- **T4 — Authoring polish + pool**: path/driveway ribbon tool
  (`bufferPolyline` + `GroundArea.path` cache + `pathVert` drag), then
  `Floor.pools` per `pool-spa.md` §4 with the basin reusing T1's skirt
  builder.

## Pinned decisions (research §8 open questions)

1. **Concave skirt self-intersection**: accepted as a minor visual
   artifact in v1 — no miter clamp. Document in the code comment.
2. **Mower on terraces**: add the `_groundYAt` height hookup for the
   mower rig if the renderer doesn't already re-ground it (verify at
   implementation; one line either way).
3. **Path vertex UX**: path-backed areas show CENTERLINE handles only —
   raw generated-polygon vertices are not draggable while `path` is
   present. Deleting the path (sidebar "Detach shape" button) converts
   to a plain editable polygon.
4. **Chain-link material**: flat `MeshBasicMaterial` from the start (a
   documented `_mat()` exemption — a wire-mesh graphic plane, same class
   as text planes), not toon. Semi-transparent, DoubleSide.
5. **Gate default-on-snap**: keep the silent default (fence/hedge wall →
   new door defaults `'gate'`); one-click override in the Doors Kind
   dropdown (which gains `gate`).
6. **Terrace vs house slab overlap**: no guard v1 (matches GroundArea
   precedent).

## Cross-cutting requirements (binding)

- All persistence is item-level/optional — no `repairFloor` backfills
  needed except NONE; `Floor.yardFill` is optional pass-through (verify
  floors pass whole objects through `_loadFromHa`, per research §3.2).
- Dirty keys: fold `elevationMm`/`yardFill` + wall-kind effects into the
  EXISTING `_keyGround`/`_keyFloor`/`_keyDoors` — no new keys except
  what `irrigation-sprinklers.md` itself specifies for T3.
- Zero per-frame allocation in every `_advance*`; shared textures
  (`_fenceMeshTexture`, `_hedgeTex`, fountain/sprinkler droplet reuse of
  `_rainTexture`) built once, disposed only in `destroy()`.
- Nav: terraces walkable via `_terrain` flat-top (no slope walking);
  fences/hedges block like walls; gates open nav LOS like doors; rock
  cluster blocks like normal furniture. No new nav machinery.
- Each batch ships with a test page (`terrain-test.html` T1,
  `fence-gate-test.html` T2, `yardlife-test.html` T3,
  `path-pool-test.html` T4) following the harness idioms, plus the
  standard typecheck/build gates and regression re-runs of yard-test /
  void-test / robot-test where touched.
