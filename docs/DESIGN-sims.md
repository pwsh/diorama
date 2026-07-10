# Sims-2000 Restyle + Character Activity System — Design & Plan

Status tracker for the largest feature arc in Diorama: re-rendering the 3D view
in the style of the 2000-era Sims game and making tracked people behave like
Sims — contextual activities near objects, named rooms, and thought bubbles.

## Goals (user requirements)

1. Objects, furniture, and people render in one cohesive Sims-era style.
2. An extensible, customizable object library. Every object has a clearly
   defined **front**; objects like coffee makers flag that they sit **on a
   surface** (counter) rather than the floor.
3. Contextual activities driven by target proximity / idle detection:
   | Trigger | Behavior |
   |---|---|
   | Person in shower | figure rendered blurred |
   | Idle in bathtub | blurred, bathing |
   | Idle at toilet | blurred, seated |
   | At sink | washing hands |
   | At dishwasher | loading the dishwasher |
   | At coffee maker | making coffee |
   | At refrigerator | looking for food |
   | Seated in a room whose TV is ON | watching TV |
   | Seated at a table | eating a meal |
   | Seated at a desk | working |
   | Near exercise equipment | working out |
   | 2 people in a bed | hidden under covers, sheets moving |
4. Rooms have names so activities reflect location.
5. Thought bubbles above heads, context- and time-aware (late night in the
   kitchen → snack; couch at night → reading; in bed awake → phone).

## Decisions made (with the user)

- **Full replacement** of the realistic PBR renderer — no classic/sims toggle.
- **All look extras**: cartoon inverted-hull outlines, rotating plumbob above
  targets, locked dimetric "Sims cam" preset.
- **Form-based custom-object editor** (primitive parts with numeric fields; the
  live scene is the preview) — not a JSON textarea.
- **Rooms = closed wall loops + a name.** `Room {id, name, anchor}`; the anchor
  point is resolved to whichever live wall loop contains it, so room identity
  survives wall edits.

## Architecture (see CLAUDE.md for the load-bearing details)

- **Rendering** (`src/three-renderer.ts`): `_mat()` toon-material factory +
  shared gradient map; `NoToneMapping`; shadow maps replaced by `_blobShadow`
  decals; `_addOutlines` inverted-hull shells; Sims-proportioned humanoids with
  plumbobs.
- **Object metadata** (`src/geometry.ts` `FurnitureKindDef`): gains
  `activity?`, `surface?`, `mountable?`, `frontArrow?`. Custom objects are
  `ObjectRecipe` (def fields + a `primitives[]` list of box/cylinder/sphere/
  cone parts) stored in `Store.customObjects`, built by a generic recipe
  builder in 3D, labeled rects in 2D.
- **Activity system** (`three-renderer.ts` + `src/ui/three-view.ts`): activity
  anchors collected in `updateFloor` beside `_sitSpots`; per-frame
  `ActivityContext` (bound-entity on/off, room names, time bucket) built in
  `three-view._tickOnce` and passed to `updateTargets(targets, ctx)` — never
  dirty-keyed. Poses reuse the sit-blend idiom
  (`joint = walkValue*(1-blend) + POSE*blend`); triggers always read the RAW
  target position.
- **Rooms**: `Floor.rooms` (persisted via `repairFloor`/`defaultFloor`);
  `resolveRoomForPoint(rooms, loops, x, y)` in geometry.ts.
- **Time of day**: `src/time-of-day.ts` — `resolveScenePreset` (moved from
  three-view) + `resolveTimeBucket` (morning/day/evening/night/late_night)
  shared by lighting, activities, and bubbles.
- **Privacy blur**: shared static pixel-silhouette sprite textures (standing +
  seated variants), per-humanoid sprite swapped in above ~0.5 privacy blend.
- **Bed covers**: per-bed occupancy count (footprint containment, raw
  positions); at ≥2 settled occupants the rigs hide and a vertex-displaced
  blanket plane breathes.

## Phase plan & status

- [x] **Phase 1 — Sims rendering core.** Toon material factory + shared
  gradient map, saturated palette, NoToneMapping, PMREM removed, blob shadows
  replace shadow maps, inverted-hull outlines, plumbob, bigger head/hands.
  Fixed pre-existing coincident-face z-fights the flat shading exposed (sofa
  plinth/armrest, bed blanket/mattress).
- [x] **Phase 2 — Object library.** `FurnitureKindDef` metadata
  (activity/surface/mountable/frontArrow), `ObjectRecipe` + generic 3D recipe
  builder, `Store.customObjects` + form-based sidebar editor, new kinds
  (`coffee_maker`, `toaster`, `exercise_equipment`), 2D front chevron,
  surface auto-snap on drop, `Furniture.entity_id` binding UI.
- [x] **Phase 3 — Rooms + plumbing.** `Floor.rooms` + click-to-name UI + 2D/3D
  labels, `src/time-of-day.ts`, activity-anchor collection, SitSpot roomId /
  host-activity tagging, `_floorGroup` sprite-disposal pairing fix.
- [x] **Phase 4 — Solo activities.** ActivityContext per tick; dwell-triggered
  activities; poses for wash_hands / load_dishwasher / make_coffee /
  forage_fridge / exercise; privacy blur for shower / bathtub / toilet;
  `_disposeHumanoid` sprite branch.
- [x] **Phase 5 — Contextual seated activities + shared bed.** watch_tv
  (room-scoped TV state), eat_at_table / work_at_desk (seat-adjacency), 2-in-a-
  bed covers with breathing displacement.
- [x] **Phase 6 — Thought bubbles.** Bubble sprite per humanoid, priority
  rules (suppressed during activities; snack / reading / phone / coffee
  heuristics on time bucket + room name substring), 2.5 s hysteresis.
- [x] **Phase 7 — Sims cam + docs + release.** Dimetric camera preset with 45°
  azimuth snap (`applyViewPreset('sims')` + `setSimsCam`), GUIDE.md / info.md /
  CLAUDE.md refresh with new Sims-style screenshots. (Release cut handled
  outside this repo.)

## Verification

No test suite. Gates per phase: `npm run typecheck` + `npm run build`, then
headless-Chrome screenshots of the built bundle (served from a scratch dir via
`python3 -m http.server`) using small scripted test pages that drive
`ThreeDRenderer` directly with a synthesized `performance.now` clock (walk /
sit / activity states are deterministic). Deploy to live HA with
`npm run deploy`.

## Known deferrals

- Mounted items (coffee maker on counter) are not live-parented; moving the
  counter leaves them behind (re-snap on next drag).
- Custom recipes draw as labeled rects in 2D.
- Bathtub uses a reclined blur silhouette, not a lying-down rig pose.
- 3D front-arrow indicator deferred (no 3D selection highlight exists).
- Imported OBJ/MTL models keep their own materials (not toon-converted).
