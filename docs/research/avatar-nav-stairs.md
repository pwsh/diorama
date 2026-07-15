# Avatar nav over void → route to stairs

Research doc for a Diorama feature. Written to be build-ready: every claim about
Diorama's existing code cites a file + approximate line so an implementer can
jump straight there; every HA claim is flagged core/custom and cited.

## Summary

Today, Diorama's 3D avatars (mmWave radar targets, AI/demo avatars, BLE
trilaterated people) are confined to **one floor at a time** — `Planner` and
`ThreeDRenderer` simulate exactly one live `Floor`'s nav grid, sensors, and rig
set (`src/three-renderer.ts`'s `_buildNav`, `updateTargets`, etc.), and
everything else is either invisible (other floors just aren't rendered) or a
cheap non-interactive "ghost" (glass-house mode's translucent stacked stories,
`updateGhostFloors`). Stairs (`FurnitureKind` `stairs` / `stairs_half` /
`stair_landing`) already exist as a **within-floor** terrain feature: a
negative `Furniture.elevation` sinks a flight below the current floor's slab
and cuts a matching hole in the floor mesh (`updateFloor`'s `wellCuts` /
`wellRectWorld`, `src/three-renderer.ts` ~L1955–2075), and a persistent
humanoid rig standing on that footprint gets its Y position quantized to the
tread it's over (`_groundYAt`, ~L1587–1604). But there is **no concept, today,
of two stair pieces on two different `Floor` entries being "the same
stairwell"** — nothing links them, and the nav grid (`_buildNav`, ~L2745) has
no notion of a hole that ISN'T also walkable stair terrain (every hole today
is authored as exactly a stairs/landing footprint, which is deliberately
excluded from the `blocked` grid because it's climbable).

This feature has two independently-shippable tiers:

- **Tier 1 — confine avatars to real floor (hardening, low risk).** Give
  Diorama a way to author a floor opening that is **not** walkable (a
  mezzanine rail, a skylight over a great room, a stairwell whose guard-railed
  opening is bigger than the flight underneath it) and make the nav grid treat
  it as impassable, the same way it already treats walls. This closes the gap
  the research prompt names directly: "when an avatar path would cross where
  there is NO floor... it should route to and descend/ascend stairs instead
  of walking over emptiness" — today that specific failure mode is latent
  (every hole happens to be covered by walkable terrain by construction) but
  nothing stops a future void from NOT being covered.
- **Tier 2 — stairs as inter-floor portals (the ambitious version).** Link a
  stair fixture on floor N to its counterpart on floor N±1 and let Diorama's
  *existing* per-floor BLE identity solve (`Planner._solveBle` already ranks
  every enabled floor and records which one "wins" for a tracked device —
  `src/planner.ts` ~L1998–2041) drive a visible walk-to-the-stairs-and-fade
  transition instead of a silent floor-render swap. This is the natural
  payoff of two things Diorama already built for other reasons: STORY_H
  ghost-floor stacking (a real vertical scene coordinate every floor could
  share) and continuous per-floor BLE floor-ranking (real data about which
  floor a real person is on, currently computed and then thrown away outside
  the current floor).

Both fit Diorama's identity as a *spatial* HA panel — the whole point of the
product is "see live device state in spatial context"; a person's avatar
popping between disconnected floor renders (or, hypothetically, gliding over
a stairwell hole) breaks the spatial illusion the rest of the renderer works
hard to sell (blob shadows, carrot-chaser nav, region-aware snapping, seat
claims). Stairs are the one place in the house where "spatial continuity"
literally means "connects two rooms in two different Y-coordinate spaces."

## Home Assistant data model

This is fundamentally an **internal** rendering/pathfinding feature — no HA
service call moves an avatar up a staircase, and the core mechanism (Tier 1)
needs **no HA data at all**. The HA layer only matters as an optional *signal
source* for Tier 2 (deciding *when* a floor-transition should visibly happen)
and as optional polish (real floor names/ordering). Nothing here is required
to ship Tier 1.

### What is available

| Source | Domain / attribute | Kind | Notes |
|---|---|---|---|
| Bermuda BLE per-floor solve (already in Diorama) | `Planner.bleSolves[deviceKey].floorId` | Internal, not HA | Already computed every ~0.1 Hz solve by ranking every enabled `Store.floors` entry's proxy set by weighted RMS (`_solveBle`, `src/planner.ts` ~L1998–2041). This is the **primary, zero-new-wiring signal** — the gap is purely that `three-view.ts` currently discards a BLE person whose `floorId` isn't the floor being viewed (`if (bp.floorId !== f.id) continue;`, `src/ui/three-view.ts` ~L1011–1012) instead of doing anything with the transition. |
| HA Companion App `device_tracker.*` | attribute `floor` (unit: "floors") | Core-adjacent (mobile app integration), read-only, LIVE `state_changed` | Confirmed present in the Companion docs' attribute table for the auto-created `device_tracker` entity, alongside `latitude`/`longitude`/`gps_accuracy`/`altitude`/`vertical_accuracy`/`course`/`speed` — "may provide some of the following attributes depending on your operating system" ([companion.home-assistant.io/docs/core/location/](https://companion.home-assistant.io/docs/core/location/)). Backed by the OS's floor-relative altitude API (iOS `CLFloor`, which is relative to the building's ground/entrance level, not an absolute value comparable across buildings). **Opportunistic** — iOS is the more reliable source; not guaranteed present at all. Would read through the *same* per-person GPS binding path Diorama already has (`Store.people[i].gpsTrackerId`/`haPersonId`, `Planner.gpsFixFor`) — no new HA plumbing, just an unread attribute on an entity Diorama already subscribes to. |
| HA Floor Registry | WS `config/floor_registry/list` / `/create` / `/update` / `/delete` / `/reorder` | Core (HA frontend "Floors" organizational feature, shipped 2024.4 — [home-assistant.io/docs/organizing/floors/](https://www.home-assistant.io/docs/organizing/floors/)) | **Confirmed** directly against HA core source (`homeassistant/components/config/floor_registry.py`, dev branch): five commands — `list`, `create {name, aliases?, icon?, level?}`, `update {floor_id, name?, aliases?, icon?, level?}`, `delete {floor_id}`, `reorder {floor_ids: string[]}`. A list entry (`_entry_dict()`) carries `floor_id`, `name`, `aliases[]`, `icon`, `level` (signed int, negative = below grade, used purely as a sort key), `created_at`, `modified_at`. Areas point at a floor via `area_registry`'s own `floor_id` field (assigned indirectly — devices/entities → areas → floors, never directly). This mirrors the exact command shape Diorama already calls for `device_registry`/`entity_registry` (`ha-client.ts`'s `getDevices`/`getEntityRegistry`), so adding `getFloors`/`getAreas` would be a same-pattern, low-risk addition to `HaApi`. Purely cosmetic for this feature (auto-sort/auto-name `Store.floors`), not a dependency. |
| Presence zones / cameras at stair top/bottom (already shipped) | `binary_sensor.*` (FP2/Frigate zone), camera entity | Whatever the user already has bound | A zone or camera placed at the head/foot of a real staircase firing in temporal sequence is a plausible corroborating "someone used the stairs" heuristic. No new HA capability — just a new way to *use* `Floor.presenceZones`/`Floor.cameras`, which already exist. |

### What is NOT available over the HA WebSocket API

- **There is no HA concept of "stairs"** or of vertical adjacency between
  floors. HA's Floor Registry is a flat organizational *label* (closer to a
  tag than a graph) — `level` is a sort key a human assigns, not a verified
  "floor 2 sits directly above floor 1" relationship, and it carries **no
  spatial (x, y) alignment** between floors at all.
- No HA integration reports "occupant walked from floor A to floor B" as a
  single event; the closest things are the two independent, imprecise
  per-entity signals above (BLE per-floor RMS ranking is Diorama's own math,
  not HA's; `device_tracker.floor` is a raw barometric reading, not a
  transition event).
- No service/action is invoked anywhere in this feature — it is 100% reads
  (state_changed) plus client-side geometry/animation. This is a rare case in
  Diorama where the "features that call `call_service`" pattern used
  elsewhere (light/switch/lock/alarm toggles, `vacuum.start`, etc.) does not
  apply.
- If `getFloors` is added to `HaApi` for the cosmetic HA Floor Registry tie-in,
  it must land in **both** `HassClient` (WS `sendMessagePromise`) and
  `HassPanelAdapter` (`hass.connection.sendMessagePromise`), per the existing
  house rule, and should be defensive (try/catch, tolerate older HA cores
  that predate the Floor Registry, matching how `getWeatherForecasts` already
  tolerates a missing capability).

## Real-world / visual reference

Diorama already models stairs with reasonable real-world fidelity for a
stylized toon renderer; the numbers below are for consistency checks, not new
authoring:

- **Diorama's existing defaults** (`geometry.ts` `FURNITURE_KINDS`, ~L1234–1236):
  - `stairs` (full flight): 1000 mm wide × 3600 mm run × 2743 mm rise (one
    story).
  - `stairs_half`: 1000 × 1800 × 1372 mm (half rise/run — combine two of
    these + a landing for an L or U flight).
  - `stair_landing`: 1000 × 1000 mm square, sits at 1372 mm (mid-story).
  - Color: warm wood brown `0x8d6e63`, matching the rest of the furniture
    palette.
  - `snapStairEdges` (`canvas-interact.ts` ~L168–230) already composes these
    into L/U runs by corner- and parallel-edge-snapping — no new authoring
    tool needed for basic multi-flight stairs.
- **US residential code reference** (IRC §R311.7 — cited for sanity-checking
  proportions, not a requirement Diorama enforces): minimum clear stair width
  36 in (914 mm); maximum riser height 7¾ in (196 mm); minimum tread depth
  10 in (254 mm); minimum headroom 6 ft 8 in (2032 mm) measured vertically
  from the tread nosing / landing surface
  ([IRC R311.7 residential stair guide, PDF](https://timnath.org/wp-content/uploads/2022/03/2018-RESIDENTIAL-STAIR-GUIDE.pdf)).
  Diorama's 1000 mm width is close to code minimum; its 2743 mm one-piece
  "flight" abstracts what would really be ~14 risers at 196 mm — the 3D
  builder already stylizes this (`_groundYAt` quantizes `n = round(h/280)`
  tread bands purely for terrain purposes, not literal geometry) consistent
  with the rest of the Sims-toon aesthetic (no attempt at literal riser-count
  realism, same spirit as blob shadows standing in for real shadow maps).
- **Why the stairwell hole == the stair footprint today is actually
  correct**: code requires headroom over the *entire* run, which in practice
  means the opening in the floor above is sized to the stair run below it
  (so a descending person's head clears) — Diorama's `wellRectWorld` being
  exactly the furniture's own bounding rect is therefore not a simplification
  that needs fixing, it's already structurally right for the common case.
  The gap is only the LESS common (but real) case of an intentionally larger
  opening — a landing with a guarded balustrade wider than the flight, a
  stairwell that opens onto a two-story great room, a mezzanine — which is
  what Tier 1's `voidAreas` addresses.
- **Guardrails**: code requires a guard ~34–38 in (860–965 mm) around any
  stairwell opening / open stair edge. Diorama's stairs pieces have no rail
  geometry today — a plausible visual add-on (see Additional Features), not
  required for nav correctness.
- **Cross-floor spatial fact that drives the Tier 2 data model**: in a real
  house, the floor-above's stairwell opening sits at the *same* plan (x, y)
  as the stair run below — literally the same hole cut through two
  consecutive slabs. This is the physical justification for linking two
  Floor entries' stair fixtures by position — and exposes that Diorama's
  current per-floor independent origin (see Open Questions) doesn't actually
  guarantee that alignment is representable today.

## Diorama visualization & animation design

### Tier 1 — impassable floor voids (confinement)

- **New authoring primitive**: `Floor.voidAreas?: VoidArea[]` — a polygon,
  modeled as a near-clone of `Floor.groundAreas` / `Floor.presenceZones`
  (`{id, points: Vec2[], hidden?, locked?}`). Mirrors the "parallel latch
  field" convention the codebase already uses for drawn-polygon fixtures
  (`drawingGroundArea` / `drawingPresenceZone` are separate fields, not a
  shared-kind refactor) — so this gets `drawingVoidArea`.
- **2D**: `drawVoidAreas` — a dark hatched/void fill, drawn low-priority
  (after item hits, like ground areas — "a big area captures select-mode
  left-clicks — hide the layer to click through" applies identically). Gated
  by a new `Layers2D.void` (absent = on).
- **3D**: generalize the existing `wellCuts` mechanism in `updateFloor`
  (`three-renderer.ts` ~L1955–2075). Today `wellCuts` is `f.furniture`
  filtered to `elevation < 0` stairs-family pieces, and `wellRectWorld(fu)`
  derives a rect straight from the furniture's own w/h/rotation. Generalize
  to also accept `Floor.voidAreas` polygons directly (they're already
  arbitrary point lists, so this is actually *simpler* than the furniture
  case — no rect derivation needed) feeding the same
  `intersectLoopWithRect`/hole-push code path (~L2041–2069) and the same
  dark `voidPlane` trick below it (~L1996–2005; for a void with no stairs
  under it, just default "deepest" to one `STORY_H` — 3000 mm — below the
  slab so the hole still reads as depth rather than a black hairline).
- **Nav grid — the actual fix**: in `_buildNav` (`three-renderer.ts`
  ~L2745), rasterize `voidArea` cells into `blocked` **unconditionally** —
  unlike the stairs-family exclusion at ~L2767 (`if (fu.kind === 'stairs' ||
  ... ) continue;`, because that terrain IS walkable), a void area is real
  empty space and must always block. Because blocked cells feed straight into
  the existing BFS region flood-fill (~L2837–2863), the void automatically
  fragments `_nav.region` correctly, and every existing region-aware
  consumer (`_nearestFreeCellInRegion`, the largest-region-preferring
  `_nearestFreeCell`, the wall-LOS filter added for the bookcase-passthrough
  fix) routes around it **with no new pathfinding code** — this is the
  concrete payoff of the region system already being general-purpose.
- **Dirty key**: fold `voidAreas` (ids + point hash) into three-view's
  `_keyFloor`, exactly like `groundAreas` already is.

### Tier 2 — stairs as inter-floor portals

- **Data model** (`types.ts`): extend `Furniture` with
  `stairLinkId?: string` (an opaque id shared by exactly two stairs-family
  pieces on two *different* `Floor`s — "this is the same physical
  stairwell"), `stairLinkRole?: 'top' | 'bottom'` (explicit, since two
  independently-elevationed pieces' `elevation` signs aren't directly
  comparable across floors), and `stairLinkOffset?: {dx: number; dy: number}`
  stored on one side — the (x, y) translation a rig's position needs when it
  crosses from one floor's coordinate frame into the other's, captured
  **once, at link-authoring time** from the two pieces' current positions
  (see Open Questions on why this can't be computed live).
- **Sidebar** (`sidebar.ts`, next to the existing `elevation` input at
  ~L2700–2704): a stairs sub-editor "Link to another floor's stairs" picker
  — lists stair-family furniture on *other* floors (label by floor name +
  kind + elevation, e.g. "Upstairs Hall — stairs, elev 0" so the user can
  tell top from bottom), plus the top/bottom role.
- **Runtime state** (`planner.ts`, not persisted — mirrors the existing
  `Fusion`/`bleSolves` runtime-map idiom): `Planner.floorTransits:
  Record<deviceKey, {fromFloorId, toFloorId, stairLinkId, phase:
  'approaching'|'crossing'|'arrived', startedAt}>`. Populated by watching
  `_solveBle`'s per-device `floorId` (`planner.ts` ~L1998–2041) for a
  **change**, gated to devices with a resolved `Store.people` identity
  (`bleSolves`→`bleDeviceInfo`→`Store.people.find(bermudaDeviceId ===
  ...)`) — an unmapped/unknown device shouldn't trigger a full dollhouse
  walk animation, mirroring the existing `bleShowUnknown` UX line. Requires
  hysteresis before committing to a visible transit (see Open Questions) —
  the `fusion.ts` continuous-hold-before-commit idiom
  (`FUSE_HOLD_MS`/`RELEASE_HOLD_MS`) is the right template to copy, not
  invent fresh.
- **Rendering** (`three-renderer.ts`): add a third `AiState.mode` value
  (today `'wander' | 'goal'`, ~L268) — `'transit'`. On entry, the controller
  walks the rig to the *source* floor's linked stair fixture using the
  **already-existing** A*/carrot nav (stairs/landings are already walkable
  terrain with correct tread-height snapping via `_groundYAt`, so
  climbing/descending visually already works with zero new code), then
  triggers the **same** `slow`-fade despawn already used for
  out-of-coverage radar targets (`TargetWorld.edge`, ~10 s opacity fade,
  scale held) once the rig reaches the top/bottom-most tread. On the
  *destination* floor — only if the user is currently viewing it, since
  Diorama simulates one live floor at a time — spawn the rig already
  mid-fade-**in** at the linked stair's far end, walking away from it
  (mirrors the existing "re-acquire mid-fade restores" rule verbatim). If
  neither floor is being viewed when the transit completes, just flip
  `floorTransits[...].phase` to `'arrived'` silently — no need to animate a
  walk nobody sees.
- **Glass-house stretch (the compelling demo case)**: when
  `scene3d.glassHouse` is on, ghost floors already share the live scene at
  `y = (floorIndex - currentIndex) * STORY_H` (`updateGhostFloors`,
  `three-renderer.ts` ~L2608–2694, `STORY_H = 3000`). A transiting rig could
  render as a fully-posed (non-ghost) humanoid at true 3D
  `y = groundY + transitProgress · STORY_H`, interpolated between the two
  floors' Y offsets, so a glass-house viewer watches someone visibly climb
  from one translucent story into the next in one continuous shot. This
  rig must live in its own always-on group (`_transitGroup`), updated every
  frame independent of `_keyFloor`/`_keyGhost`, since it straddles two
  floors' dirty keys at once — a genuinely new category of "cross-floor live
  state" for this codebase (see Open Questions).
- **2D companion**: a small stairs-direction chip (▲/▼, reusing the existing
  arrow-and-"DN"-label idiom near `drawFurniturePrimitive`'s stairs case,
  `canvas-render.ts` ~L2044–2060) plus a one-line sidebar status
  ("Eric is on the floor above, near the stairs") when a known person's
  `floorId` differs from the floor currently shown — reuse the existing
  "honest status line" convention from `Planner.gpsFixFor` rather than
  inventing new chrome.
- **Layer/dirty-key plumbing**: `stairLinkId`/`stairLinkRole`/
  `stairLinkOffset` are plain per-item fields needing **no** new dirty key
  (only the Planner-side transit state machine and the sidebar picker read
  them, never a per-frame rebuild) — but do need `repairFloor`-style
  tolerance (optional/absent = unlinked) and must be preserved wherever
  `Furniture` arrays pass through unchanged (a grep of the current codebase
  shows item arrays already pass through Planner untouched field-by-field,
  same reasoning as the `localState` note in CLAUDE.md — no risk found, just
  confirm it stays true).

## Integration steps

**Tier 1** (ship first — small, self-contained, no data-model risk beyond one
new optional array):

1. `types.ts` — add `VoidArea` (`{id, points: Vec2[], hidden?, locked?}`,
   mirroring `PresenceZone`/`GroundArea`) + `Floor.voidAreas?: VoidArea[]`.
2. `repairFloor`/`defaultFloor` — backfill `voidAreas: []`.
3. `geometry.ts` — feed void-area points into whatever bbox helper
   (`floorContentBbox`) backs floor-edge-drag clamping, so a void area counts
   as content like every other placeable.
4. `canvas-render.ts` — `drawVoidAreas` (dark/hatched fill) + gate in
   `drawAll` under new `Layers2D.void` (absent = on).
5. `canvas-hit.ts` — low-priority hit test appended after all existing item
   hits (mirror `groundAreas`).
6. `canvas-interact.ts` — `drawingVoidArea` latch (parallel field, not a
   shared-kind refactor, per codebase convention), `void` tool entry, vertex
   drag case, delete-tool case, ESC/dblclick-to-finish (wall-draw idiom).
7. `sidebar.ts` — `_section('void', 'Floor openings', …)`, "+ Add opening"
   draw-latch button (mirror Ground Areas' section UI); add to `TOOLS`.
8. `three-renderer.ts` — generalize `wellCuts`/`wellRectWorld` in
   `updateFloor` to also fold in `Floor.voidAreas` polygons through the same
   hole-cutting path; in `_buildNav`, rasterize void-area cells into
   `blocked` unconditionally (no walkable-terrain exception).
9. `three-view.ts` — fold `voidAreas` into `_keyFloor`.
10. New test page (clone the `bookcase-los-test.html` harness style): a
    floor with a void area that has NO stairs under it; assert nav never
    crosses it and rigs route around, matching the existing
    `BOOKCASE-LOS PASS N/N` convention.

**Tier 2** (sequence after Tier 1 lands and the void-blocking primitive is
proven):

1. `types.ts` — `Furniture.stairLinkId?`, `stairLinkRole?: 'top'|'bottom'`,
   `stairLinkOffset?: {dx: number; dy: number}`.
2. `sidebar.ts` — stairs sub-editor "Link to another floor's stairs" picker
   (new modal listing other floors' stair furniture, not an `EntityPicker`
   HA-domain instance — different data source, same modal *pattern*) + role
   radio; capture `stairLinkOffset` from the two pieces' current positions
   at authoring time.
3. `planner.ts` — `Planner.floorTransits` runtime map; state machine driven
   off `_solveBle`'s per-device `floorId` bookkeeping, gated to
   `Store.people`-identified devices, with a hysteresis hold before
   committing (borrow `fusion.ts`'s hold/release-timer idiom rather than
   inventing new constants).
4. `three-renderer.ts` — new `AiState.mode = 'transit'`; carrot/A* walk to
   the linked stair fixture; reuse the existing `slow` despawn fade; a
   symmetric mid-fade-in spawn on the destination floor's matching stair.
5. Glass-house stretch — `_transitGroup` + per-frame cross-`STORY_H`
   Y-interpolation, independent of `_keyFloor`/`_keyGhost`.
6. Sidebar status line (section 4) + 2D directional chip.
7. New test page driving a synthetic two-floor store + fake BLE `floorId`
   flip, asserting the transit phase machine deterministically — extract the
   phase-transition logic into a small pure module (à la `fusion.ts`,
   `trilateration.ts`) specifically so it's testable without a live
   three.js scene.

## Potential additional features

- **Elevators/lifts** as an alternate portal kind sharing the same
  `stairLinkId` mechanism but a different traversal animation (wait-in-place
  fade rather than a walk cycle) — useful for accessibility-themed builds or
  literal home elevators.
- **Auto-suggest links**: when two stair pieces on floors adjacent in
  `Store.floors` array order (or by HA Floor Registry `level`, once wired)
  sit within some XY tolerance of the same footprint, prompt "link these?"
  instead of requiring the manual picker every time.
- **HA Floor Registry sync** (data-model section 2) — auto-order
  `Store.floors` and label them with the user's real HA floor names/icons
  instead of Diorama's own free-text `Floor.name`, purely cosmetic.
- **`device_tracker.floor` as a secondary/fallback signal** for homes
  without Bermuda BLE deployed at all — coarser and opportunistic, but zero
  extra hardware.
- **Presence-zone/camera stair-crossing heuristic** — a zone or camera at
  the stair top/bottom firing in sequence as a corroborating "someone used
  the stairs" signal, entirely internal (binary_sensor timing), no new HA
  capability.
- **Ambient AI-avatar stair use with no real signal at all** — a demo/AI
  avatar occasionally walks to the stairs and "goes to bed upstairs" on a
  timer, purely as a life-simulation flourish (same spirit as idle fidgets /
  thought bubbles), independent of any HA data.
- **Guardrail geometry** on stair/landing pieces (real code requires one
  around any stairwell opening) — a visual completeness item, not required
  for nav.
- **True simultaneous multi-floor 3D simulation** — the natural end-state
  this feature gestures toward (more than one floor "live" at once, not just
  ghosted) is a substantially larger architecture change; flagged here as
  the ceiling this feature approaches but does not need to reach.

## Open questions & risks

- **Floor coordinate alignment is undefined today — the single biggest
  risk.** `updateGhostFloors` centers each ghost floor independently by its
  OWN `w/2, d/2` (`three-renderer.ts` ~L2619–2620: "Each ghost floor uses ITS
  OWN w/d for coordinate mapping but is centered on the scene origin, so all
  stories line up" — i.e., they line up by *center*, not by any authored
  real-world alignment). Two floors are not guaranteed to share an origin,
  a footprint size, or even a consistent north. A stair link therefore
  cannot assume the linked pieces share plan coordinates — the proposed
  `stairLinkOffset` (captured once, author-time) is a workaround, not a
  guarantee: dragging either linked piece afterward silently desyncs it
  (no live constraint keeps them in sync). The more correct fix — a
  first-class `Floor.originOffset` shared coordinate frame across all
  floors — is a bigger, more invasive change that would *also* fix
  ghost-floor visual alignment, arguably a prerequisite for trustworthy
  glass-house dollhousing generally, not just this feature. Decide which
  level of correctness this feature actually needs before building Tier 2.
- **Single-live-floor architecture.** Planner/three-view fundamentally
  simulate one floor's nav/rigs/sensors at a time. The glass-house stretch
  (rendering a transiting rig continuously across two floors' Y-space) asks
  the renderer to animate something *outside* that single-floor model for
  the transit's duration. Scoped to its own small group and update loop it
  should be containable, but it is a genuinely new category of "cross-floor
  live state," and edge cases need explicit answers: what happens if the
  user switches floors mid-transit? If the destination floor is deleted or
  disabled mid-transit? If `glassHouse` is toggled off mid-transit?
- **BLE per-floor solve stability.** `_solveBle` re-ranks floors by weighted
  RMS roughly every ~0.1 Hz; a device physically near a stairwell (weak
  signal to both floors' proxies) could flip-flop `floorId` a few times
  before settling. Starting a visible walk-to-stairs animation and then
  reversing it mid-flight would look worse than doing nothing — this needs
  a hysteresis hold (borrow the `fusion.ts` continuous-hold-before-commit
  pattern) before a `floorId` change is trusted enough to start a transit.
- **`device_tracker.floor` reliability.** Opportunistic (companion app +
  supporting OS only), and relative to the building's entrance level, not
  necessarily aligned to Diorama's floor index 0 — would need a one-time
  user-set offset/mapping if used at all, and should only ever be a
  corroborating signal, never a sole trigger.
- **HA Floor Registry's WS surface is now confirmed** (against
  `homeassistant/components/config/floor_registry.py` on the core `dev`
  branch — see Sources) — command names and entry fields are accurate as of
  this research pass, but core is a moving target; re-check on the HA
  version actually targeted before shipping `HaApi.getFloors()`. Still
  optional polish, not a dependency of the core nav feature.
- **Scope-check the original ask.** "Route to and descend/ascend stairs
  instead of walking over emptiness" is plausibly read two ways: (a) Tier 1
  only — never let a nav path cross an uncovered floor void, full stop — or
  (b) Tier 2 — actual visible cross-floor stair traversal. These are
  independently valuable and very different sizes of work; recommend
  confirming ambition level before implementation. Tier 1 alone already
  fully answers "at least confine avatars to real floor," which is the
  fallback the research prompt explicitly allows for.
- **No multi-floor test fixtures exist today.** Everything in
  `test-pages/` is single-floor. Tier 2 needs new ≥2-floor fixture data with
  linked stairs from scratch.
- **Perf/complexity budget.** Tier 1 adds one new dirty-key input and one
  new nav-grid case — cheap. Tier 2 adds a whole new always-on per-frame
  group (glass-house stretch) and a new Planner-side state machine — worth
  sequencing strictly after Tier 1 ships and proves out, not building both
  at once.

## Sources

- [Home Assistant WebSocket API](https://developers.home-assistant.io/docs/api/websocket/) — developer docs, confirms the general registry-command category exists but does not itemize `floor_registry` commands.
- [Floors — Home Assistant docs](https://www.home-assistant.io/docs/organizing/floors/) — Floor concept, `name`/`level`/`icon`/`aliases` fields, area→floor assignment, `level` as signed sort key.
- [Location — Home Assistant Companion docs](https://companion.home-assistant.io/docs/core/location/) — confirms the Companion-app `device_tracker` attribute table includes `floor` (unit "floors") alongside `latitude`/`longitude`/`altitude`/`gps_accuracy`/`vertical_accuracy`/`course`/`speed`.
- [Device Tracker — Home Assistant integrations docs](https://www.home-assistant.io/integrations/device_tracker/) — general device_tracker attribute baseline (latitude/longitude/gps_accuracy).
- [2018 Residential Stair Guide, IRC §R311.7 (PDF)](https://timnath.org/wp-content/uploads/2022/03/2018-RESIDENTIAL-STAIR-GUIDE.pdf) — stair width/riser/tread/headroom minimums used for the real-world reference section.
- [Section 1009 Stairways and Handrails — up.codes (IBC)](https://up.codes/s/stairways-and-handrails) — handrail height (34–38 in) / guard height / handrail-required threshold, cross-checked against the IRC figures above.
- [HA core source: `homeassistant/components/config/floor_registry.py`](https://github.com/home-assistant/core/blob/dev/homeassistant/components/config/floor_registry.py) — confirms the exact `config/floor_registry/list|create|update|delete|reorder` WS command names and entry field names (`floor_id`, `name`, `aliases`, `icon`, `level`, `created_at`, `modified_at`), upgrading the Floor Registry row above from inferred to confirmed.
- [NavMesh.CalculatePath and OffMesh-Links — Unity Discussions](https://discussions.unity.com/t/navmesh-calculatepath-and-offmesh-links/606117) and [Recast & Detour — Unreal Engine Code Analysis](https://www.unrealdoc.com/p/navigation-mesh) — general prior-art pattern (game-engine "off-mesh link" / manually authored portal edge bridging a pathfinding gap) that the proposed `stairLinkId` mechanism is a domain-specific instance of; useful framing for an implementer, not itself part of Diorama's stack.
- Diorama source (internal, cited inline by file + line throughout): `src/three-renderer.ts` (`updateFloor`, `_buildNav`, `_groundYAt`, `updateGhostFloors`, `AiState`), `src/planner.ts` (`_solveBle`, `blePeople`), `src/ui/three-view.ts` (BLE floor filter), `src/geometry.ts` (`FURNITURE_KINDS` stairs defaults), `src/canvas-interact.ts` (`snapStairEdges`), `src/sidebar.ts` (stairs elevation editor), `src/fusion.ts` (hysteresis idiom referenced for Tier 2).
