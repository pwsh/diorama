# Project status & pick-up guide

Last updated: 2026-07-12, at **v0.11.0**. This is the single document to read
(alongside `CLAUDE.md`) to resume work with full context.

## Where things stand

Diorama is feature-complete through TWO arcs — the Sims-2000 arc
(`docs/DESIGN-sims.md`, 7 phases) and the World Outside arc
(`docs/DESIGN-world.md`, 8 phases: BLE identity/trilateration/fusion, pet
rigs, GPS geo-calibration + pins, weather core + 3D effects) — plus the
post-arc batches listed below. Everything is merged to `main`, pushed to
**both remotes**, released through **v0.11.0**, and deployed to the live HA
instance (batches after the v0.11.0 tag ship in the next release the user
asks for).

### Remotes, releases, deploy

- Two remotes: `origin` (private Gitea) and `github`
  (https://github.com/pwsh/diorama.git, gh CLI authenticated as `pwsh`).
  Push **both** on every ship. Private hostnames/IPs live ONLY in the
  gitignored `docs/STATUS.local.md` (and `git remote -v`) — keep them out
  of every tracked file.
- Release runbook: bump `package.json` version → commit `vX.Y.Z` → tag →
  `git push origin main vX.Y.Z && git push github main vX.Y.Z` →
  `gh release create vX.Y.Z --repo pwsh/diorama --title … --notes …` → the
  `release.yml` workflow builds and attaches `diorama.zip` (HACS asset) —
  poll `gh run list --workflow=release.yml` until success and verify the
  asset. Gitea releases optional (v0.4.0 has one; later ones GitHub-only).
- Deploy to live HA: `npm run deploy` (haDeploy plugin → the GVFS SMB
  share configured in the gitignored `deploy.local.json`; host details in
  the gitignored `docs/STATUS.local.md`). User must hard-refresh / reset
  the companion-app frontend cache afterwards.
- Releases so far: v0.4.0 Sims era → v0.5.0 pathfinding/glass house/cutaway
  → v0.6.0 living avatars (AI avatars, despawn fades, beds, auto-follow) →
  v0.7.0 polish & reachability (UI reorg, sectional fix, colors, step
  lights) → v0.8.0 the cast expands (22 avatars, planar rooms, device
  controls) → v0.9.0 room-label layer, unnamed-room placeholders +
  enclosure feedback, settings version stamp → v0.10.0 the World Outside
  arc (BLE identity + trilateration + fusion, pet rigs, GPS landmarks +
  pins, weather core + 3D effects) → v0.11.0 editor & polish (room-loop +
  sliver-spawn fixes, wall snapping/ganging/smart guides, collapsible
  sidebar + Bermuda toggle, window types + rendering fixes, floor-boundary
  editing, iOS tap fix, manual landmark coords + calibration UX, full docs
  refresh).

### Shipped since the DESIGN-sims arc (reverse order)

- **Avatar appearance + behavior batch** (4 user requests, `src/three-renderer.ts`
  + test pages; no Store changes; typecheck + build clean; regression titles
  green). Builds on the pants change (kept, not reverted):
  1. *Faces + hats/hair off the eyes*: every rig now has readable features
     scaled to the oversized head — white-sclera eye + proud dark iris/pupil
     (`makeEye`), angled brow (`makeBrow`), a small darkened-skin nose bump
     (`noseMat`), and a slim smile (mid + up-turned corners). Skin ears
     (`makeEar`) on the sides except side-covered kinds (`EAR_SKIP`); cyborg gets
     only its organic ear. Kind-specific eyes (visor/almond/shades/slit/redvisor/
     halfred) keep their look. The **hacker hood** and **supermodel hair cap**
     were raised + tilted back with trimmed `phiLength` so their front rim rides
     above the brow instead of draping to eye level. Verified per-kind in
     front-view lineup screenshots (all 24 kinds).
  2. *Bubble variety + un-rigid rules*: the contextual bubble tiers now pick from
     weighted **pools** (`BUBBLE_POOL_*`, ~15 new glyphs) instead of one fixed
     glyph — a seated evening avatar is no longer locked to 📖. `_pickCtxBubble`
     rolls once per engagement and holds (`ctxBubbleTier`/`ctxBubbleGlyph`) so the
     2.5 s commit hysteresis still works. Weather-aware bubbles skipped
     (ActivityContext carries no weather). Role bubbles + priority unchanged.
  3. *More idle actions*: the fidget picker grew from stretch/phone to eight
     one-shots (`IDLE_FIDGETS`: + yawn / scratch_head / check_watch / cross_arms /
     foot_tap / glance), each composed from existing joints with a trapezoid
     blend. Wave-on-spawn + ambient look-around/weight-shift unchanged.
  4. *BUG: forearms ghosting through the seated table*: short rigs (child) put the
     seated shoulder ≈16 mm above a normal tabletop, forcing the elbow-above-slab
     `shMin` past the 1.4 rad clamp → elbow dropped through the slab. Fixed by
     (a) lifting `seatYeff` so the seated shoulder clears the top by 150 mm
     (derived from the rig's torso-sit height, generalizing the old bar/island
     barstool cheat) and (b) letting `shMin` win over the 1.4 ceiling.
     `tabletest.html` now asserts elbow AND hand above `top − 10` for
     adult+child × eat/work/tall (child eat went dElb −16 → +30).
  Tests: tabletest / fidget / phase6 / avatar-bubble / mega / pet / fusion /
  phase4 / phase5 / ai / bubble-anchor / newkinds all green (phase6 +
  avatar-bubble + fidget assertions rewritten for pool/variety semantics).
  `docs/images/avatars.png` re-captured.

- **Avatar pants** (user-reported "avatars all look like they're missing
  pants", `src/three-renderer.ts` materials-only; no Store changes; typecheck
  + build clean): plain rigs whose legs rendered in the raw identity tint read
  as a head-to-toe unitard. `_buildHumanoid` now derives a trouser tone (tint ×
  ~0.5) for both leg segments (shoes keep `spec.shoe`) whenever
  `spec.legColor == null && spec.skin === color` — adult / child / professional
  / movie_star / cowboy / farmer / athlete / cyborg (left leg; steel right kept)
  / magician / tech_expert / supermodel. Derived from the passed-in `color`, so
  it rides every recolor path (per-sensor tint, fused person, BLE person).
  Costumed kinds with a fixed non-tint skin or explicit `legColor` (robot /
  alien / hacker / ninja / ninja_cyborg / wise_oracle / astronaut / mascots /
  duck) untouched; pets untouched; pose math untouched. `docs/images/avatars.png`
  re-captured; mega/pet/fusion regression titles green.

- **Sidebar mmWave batch** (3 user-reported, `src/ui/sidebar.ts` +
  `src/geometry.ts`; no Store changes; typecheck + build clean):
  - *Collapse-on-change*: `_autoExpandActive()` re-expanded any section whose
    active id was set on **every** render; because `activeSensorId` is persisted
    (essentially always set), the mmWave section could never be collapsed while a
    sensor stayed selected. It now keeps `_lastActiveSnapshot` and expands a
    section **only when its active id differs** from the prior render — select →
    expands once, collapse → sticks, select a different item → expands again. The
    latent same-bug for `motion`/`env`/`ble`/`people`/`furniture` is fixed too.
  - *Inline mmWave detail*: the per-sensor config editor (`_activeSensorSection`)
    and HA-data block (`_haSections` — zones/objects/targets/sensor config) moved
    from two standalone far-away `_section`s into plain bordered **sub-blocks**
    rendered inline beneath the selected sensor's row inside the `sensors`
    section, matching the Motion section's inline-edit pattern. Handlers/inputs
    unchanged (a move, not a rewrite); the `active-sensor`/`ha-sensor` slugs are
    retired (stale collapsed keys harmless).
  - *Fuzzy room grouping*: new pure `resolveRoomForPointFuzzy(rooms, loops, x, y,
    probeMm=250)` in geometry.ts (exact, then probe +y/-y/+x/-x + 4 diagonals);
    `_groupByRoom` uses it so doors/windows/flush fixtures sitting ON a wall line
    (which `pointInPolygon` excludes) bucket into the room they touch instead of
    "— No room —". `rooms-test.html` now **ROOMS PASS 10/10** (4 new fuzzy cases:
    on-wall → adjacent room, exact→null, far-outside→null). wallsnap-test 36/36 +
    mega-test seating baseline unregressed.
- **Touch tap synthesis (iOS/HA-app fix)** + **draggable floor boundaries**
  (2 interaction-layer tasks):
  - *Tap fix*: on iOS in the HA companion app the canvas `touchend` never
    produced a browser `click` (our touch handlers `preventDefault` to keep
    HA's drawer out), so every flow living only in `onCanvasClick` — geo-landmark
    placement, room-anchor placement, kiosk tap-to-toggle, AND tap-to-place for
    every tool — silently never fired. `canvas-2d.ts` now records a single-finger
    tap candidate (invalidated by a 2nd finger, >12 px move, or >600 ms) and, on
    a clean lift, synthesizes a click through the shared `_dispatchClick` (native
    listener guards a 700 ms window to drop any Android compatibility click).
    Runs AFTER `onCanvasMouseUp` so `dragJustEnded` swallows the synthetic click
    exactly like the mouse `mouseup→click` order. Double-tap (2 taps <350 ms /
    <24 px) synthesizes `dblclick` (light-config on tablets). Arming a placement
    latch on a narrow screen auto-closes the overlay sidebar
    (`maybeCloseSidebarForPlacement`, 900 px breakpoint) so the first tap lands
    on the map. Not headless-testable (touch synthesis).
  - *Floor-edge editing*: EDIT + Select, hovering ~10 px from a boundary edge
    shows a resize cursor + always-drawn mid-edge handles; dragging resizes
    `floor.w/d`. Left/bottom edges also translate all content
    (`Planner.translateFloorContent`) so the plan stays glued to the opposite
    edge. Grid-snapped, min 2000 mm, clamped against the content bbox + 100 mm
    margin (`resolveFloorEdgeDrag`/`floorContentBbox` in geometry.ts, pure —
    `floor-edge-test.html` FLOOREDGE PASS 19/19). Input measured in frozen
    start-scale screen space so the fit-view rescale can't feed back. Geo
    landmarks translate only for single-floor plans.
- **Rendering/model fixes batch** (4 user-reported): (1) thought bubbles +
  B3 name labels now anchor per-rig off `h.plumbob.position.y`
  (`BUBBLE_ABOVE_PLUMBOB` 460 / `NAME_ABOVE_PLUMBOB` 318) instead of fixed
  constants, so they track child/teddy/supermodel proportions and drop with
  the root when seated (`bubble-anchor-test.html`, BUBBLE PASS). (2) Vertical
  jamb seams at door/window openings fixed — each sub-sill/header/lintel is
  extended ~3 mm INTO the abutting jamb runs (`JAMB_OVL`) so their end caps
  aren't coplanar with the jamb (the coincident-face gotcha on transparent
  toon walls). (3) `Window` gains item-level `kind` (single/double_hung/
  casement_pair/sliding/picture) + `sill`/`height` (`WINDOW_DEFAULTS` 900/800);
  `wallCutsForSegment` threads sill/height onto the cut so the 3D sub-sill/
  header size per-window, `_buildWindows` builds per-kind panes (opaque
  overlapping mullions to avoid new coincident faces), sidebar adds a kind
  dropdown + sill/height inputs (`window-test.html`, WINDOW PASS 14/14).
  (4) Fireplace mantel back aligned FLUSH with the firebox back plane (`D2/2`),
  overhang moved to the FRONT, so a wall-snapped fireplace no longer pokes the
  shelf through the wall; 2D hearth footprint bumped to 1000×450 to match
  `W2`×`D2`/the flush-snap assumption (`fireplace-wall-test.html`, FIREPLACE
  PASS). Regression: mega/pet/phase4-6/glass/fusion/rooms/wallsnap all green.
- **Sidebar UX + Bermuda disable** (UI-only batch): (1) every sidebar `.section`
  is collapsible via `Sidebar._section(slug, title, bodyThunk, opts?)` — a
  clickable `<h3 class="collapsible-header">` with a `▸`/rotated arrow; collapsed
  keys persist device-local in `localStorage['diorama:sidebar:collapsed']` (JSON
  array, NOT the HA store), default expanded. Room-grouped lists get per-room
  collapse rows keyed `<sectionSlug>/<roomId>` (`/none` bucket). `_autoExpandActive()`
  (top of `render`) expands the section holding the active/selected item so
  canvas selection reveals its editor; it only ever expands. Body thunks fire
  only while expanded, so Lit's config-channel reconciliation (focused-input
  survival) is unchanged. (2) 2D Layers rows now sort alphabetically by label for
  display only (preset save loop keys by `d.key`, so semantics are untouched).
  (3) `Store.bermudaEnabled` (absent/true = on) — a Settings-drawer "Integrations"
  checkbox (edit-mode only). When false the whole Bermuda BLE path is inert
  (`scanBermuda` early-return, no auto-scan, no sample recording/`_solveBle`,
  `blePeople → []`), and the People Bermuda subsection / unknown-BLE toggle /
  per-person device-binding row hide while BLE Proxies shows a dim disabled hint.
  Added to `_loadFromHa`'s explicit field list.
- **Editor snapping (fireplace / switch wall lock + smart guides)**: fireplace
  lights (`snapFireplaceToWall`) and switches (`snapSwitchToWall`) now lock flush
  to the nearest wall on drop + move-release via a shared `snapToWallEdge`
  helper (firebox back flush at axis+275; switch plate at axis+70, rotation
  aligned, 0=+Y / vertical→90). Switches also **gang** with same-wall neighbours
  at `gangPitch = max(size)+75` (`gangSlot` walks to the nearest free slot).
  Plus **smart alignment guides**: dragging any single placeable snaps its
  center to peer centers (same category) on X/Y within 8 px, dashed accent
  guide lines drawn while active (`nearestAlign`, `Planner.alignGuides`
  runtime-only). Pinned by `test-pages/wallsnap-test.html` (`WALLSNAP PASS
  36/36`). No Store schema change.
- **Fixes (rooms + avatar spawn)**: (1) rooms all resolving to one loop — locked
  walls are now valid weld **targets** (`bestWeldTarget` dropped the `w.locked`
  skip) so invisible room-divider chords snap onto locked structural walls, and
  `closedWallLoops` node welding / `EPS` raised 1.5 → **25 mm** (nearest-node
  clustering) to heal the 3–22 mm gaps already saved in real plans. Pinned by
  `test-pages/rooms-test.html` (real export fixture → `ROOMS PASS 6/6`). (2) AI
  avatars spawning in the sliver behind furniture — `_buildNav` now records
  `regionSize` and `_nearestFreeCell` scans `r0..r0+4` rings preferring the
  LARGEST region, so spawns/retargets pick the open room over a tiny sliver.
  Pinned by `test-pages/sliver-test.html` (`SLIVER PASS 7/7`); pathfind/ai/
  ble-walk/mega baselines unaffected.
- **World Outside — B3 (identity fusion + name labels)**: the arc's payoff —
  mmWave precision wearing BLE identity. New pure `src/fusion.ts` (`stepFusion`,
  deterministic, no Date/random) matches each BLE person to at most one live
  radar target with two-sided hysteresis: a UNIQUE in-gate pair (person's nearest
  target ∧ target's nearest person, no 2nd candidate within `gate×1.25`) held
  continuously 4 s fuses; releases only after separating past `gate×2` for 6 s, or
  instantly on target-gone / person-stale. Gate = `max(1500 mm, confidenceMm)`.
  `Planner._fuseIdentities` (on each BLE solve + a 2 s timer, no-op without BLE
  people) runs it against the LERPED radar positions and exposes
  `Planner.fusions` (targetKey→person) + `fusedPersonIds` + `bleUnfused` (a fused
  person's ghost rig hides — nobody renders twice). 3D: fused radar targets adopt
  the person's avatar (incl. humanoid⇄quadruped for a fused pet) + color; new
  camera-facing **name label** sprite above the plumbob, shown only when confident
  (fused target OR identified BLE rig), on a new `Layers2D.nameLabels` layer
  (default on) — canvas repainted only on name change, freed via `_disposeHumanoid`
  like the bubble sprite, faded with the rig by `_fadeRig`. 2D: fused dots draw the
  person initials chip + name line (shared helpers). Runtime-only; `nameLabels` is
  the sole schema addition. Test page `test-pages/fusion-test.html`
  (`FUSION PASS 11/11` — 6 matcher scenarios + 5 renderer assertions).
- **World Outside — W2 (3D weather effects)**: renderer `_weatherGroup` +
  `updateWeather(fx)` driven by `Planner.weatherNow` — precipitation `THREE.Points`
  clouds (rain streaks / snow flakes / hail dots / wind dust; count
  `600 + intensity·1900`, DPR-capped, 0..4000 mm recycle band, wind drift +
  wobble, buffers mutated in place = zero per-frame alloc), scene `FogExp2` eased
  in/out over ~2 s + scrolling ground planes, and a lightning flash
  `DirectionalLight` with a double-flash decay envelope (8–25 s gaps, no audio).
  Rebuilt under three-view's `_keyWeather`; per-frame motion in `_advanceWeather`
  from `_animate`. New `Layers2D.weatherFx` (default on; sidebar layer + 3D group
  visibility). Lighting modulation: `resolveScenePreset(sc, states, weather?)`
  downgrades a day preset to dusk under overcast/precip/fog/lightning (single
  mechanism; folds into `_keyFloor`). `conditionIntensity` in `weather.ts`
  (pure). `PointsMaterial`/`SpriteMaterial` documented exempt from the `_mat`
  toon factory; shared particle maps disposed only in `destroy()`. Test page
  `weather-fx-test.html` (`WFX PASS` for `?c=pouring|fog|lightning|sunny`).
- **Geo-calibration UX (iOS liveness)**: from live iOS testing (one fix in ~5 min; card looked frozen; filter exclusions invisible). `startGeoCalibration` now pumps the documented `request_location_update` notify (works iOS + Android) immediately and every **25 s** on `geoCalib.reqTimer`, cleared in finish + cancel (`_clearGeoCalibTimer`) and re-guarded at the top of any new start. Session accounting gained `seen`/`used`/`exclAccuracy`/`exclSource`/`lastSeenAt` (classified once by `_geoSampleClass`; `_geoSamplePasses` now delegates so the median filter is byte-identical); the finish summary — success OR the <5-sample failure — reads "N used / M excluded (accuracy: k, source: j)". The card shows a CSS-pulsing dot (`.diorama-calib-dot` in styles.ts), `m:ss` elapsed, "last fix Ns ago", and the live counts, refreshed by a 1 s `_calibLiveTimer` on the sidebar (reconciled in `updated()` while the active card is visible; cleared on disconnect/collapse/finish) so a zero-sample window never looks hung. Guidance line rewritten for both platforms. No Store fields (session stays runtime-only); median math untouched. typecheck + build green.
- **Manual landmark coordinates**: GPS/Geo sidebar landmarks can now be calibrated by typing/pasting lat/lon (new pure `parseLatLon` in `src/geo.ts`, splits a pasted `lat, lon` pair into both fields, range-validated) instead of GPS sampling — Apply sets `lat`/`lon`+`sampledAt` and **clears** `accuracy`/`sampleCount` (absent `sampleCount` + present `lat` = "manual", shown `manual · <date>`); `✕ clear coords` returns a landmark to uncalibrated. `geo-test.html` now `GEO PASS 53/53`.
- **World Outside — G2 (GPS device pins)**: `Planner.gpsPins` resolves each
  `Store.people` GPS source (person entity preferred, else device_tracker) to a
  pin — projects lat/lon via the `geoFit()` transform and classifies vs the
  current floor rect: `indoor` (lost-device hint, dimmed), `yard` (true pos +
  accuracy ring), `beyond` (clamped to the floor-bbox+`boundaryM` ring along the
  true bearing, `Name · 320 m NE` label). New pure geo helpers `clampToBoundary`
  / `planBearingDeg` / `compass8` (tested in `test-pages/gps-test.html`). 2D
  `drawGpsPins` (teardrop + initials + ring + staleness) and 3D camera-facing
  sprite pins + 3D landmark pins in a new `_gpsGroup` (`updateGpsPins`, dirty key
  `_keyGps`; `_disposeSpriteMaps` pairing kept). Bound GPS source ids are
  config-path so the sidebar GPS status line (People section) + GPS-pins preview
  (GPS/Geo section) refresh on a new fix. Kiosk/view-safe. `HassState` gained
  optional `last_updated`/`last_changed` (staleness). Test page
  `test-pages/gps-test.html` (`GPS PASS 28/28`).
- **World Outside — G1 (geo calibration)**: `Store.geo` (`GeoConfig` —
  property-wide landmarks, `northDeg`/`boundaryM`/`accuracyGateM`) + new pure
  `src/geo.ts` (equirectangular projection, 2D Procrustes fit with scale FIXED
  at 1 + `fittedScale` diagnostic, 1-landmark `northDeg` path, `latLonToPlan`/
  `planToLatLon`, independent lat/lon median). Landmarks placed on the 2D plan
  via the room-latch pattern (`placingLandmarkId`/`NEW_LANDMARK`), rendered as
  📍 pins under a new `Layers2D.geo` layer (default on, 2D-only this phase — the
  3D fold-in point is commented at `three-view._keyFloor`). Sidebar "GPS / Geo"
  section: per-landmark calibrate flow (pick a `device_tracker`, fire the
  Android `command_high_accuracy_mode` notify commands fire-and-forget, live
  sample counter, Finish pulls the window from `history/history_during_period`
  and stores the median of `source_type==='gps'` samples within the accuracy
  gate, ≥5 required) + fit-quality readout. New `HaApi.getHistory` in both
  `HassClient` and `HassPanelAdapter` (`normalizeHistory` shared). Test page
  `test-pages/geo-test.html` (`GEO PASS 38/38`). GPS device pins deferred to G2.
- **World Outside — W1 (weather core)**: `Store.weather` + `src/weather.ts`
  (pure normalization to `WeatherNow` over HA's 15-condition vocabulary; three
  sources — a `weather.*` entity, local station sensors via a derive heuristic,
  or keyless Open-Meteo with the HA-core WMO→HA table + zip geocoding). First
  third-party network call in the repo — isolated, try/catch'd, offline-tolerant
  (holds last value, stale after 45 min). `Planner.weatherNow` recomputes on
  bound-entity `state_changed` (added to `_isSlowEntity`) or a 15-min Open-Meteo
  poll. New `<diorama-weather-chip>` corner overlay (both views, kiosk-safe,
  °F-aware) + sidebar "Weather" section with a live preview. `effects3d` /
  `affectLighting` persist now, consumed in W2. Test page
  `test-pages/weather-test.html` (`WEATHER PASS 48/48`).
- **World Outside — P1 (pet rigs)**: quadruped cat/dog avatar kinds with a
  dedicated `_buildQuadruped` builder (4-leg body, ears/snout, 2-segment tail;
  cat ≈ 58% of the dog) and `_applyQuadPose` trot gait + sit (haunches) / curl
  (lie) blends off the shared humanoid dwell triggers (soft SitSpots → curl).
  Reuses all shared rig bookkeeping (nav/carrot/spring, scale/fade, blob,
  outline, plumbob@0.7×); pets skip privacy blur / activity anchors / bubbles.
  `cat`/`dog` are selectable (sidebar) but out of the random-human pool; a
  `DioramaPerson.isPet` with no avatarKind renders as `cat`. Test page
  `test-pages/pet-test.html` (PET PASS: legs animate, no NaN, plumbob spins,
  blob grounded, sofa curl engages).
- **World Outside — B2 (BLE trilateration)**: panel-side solver
  `src/trilateration.ts` (pure weighted Gauss-Newton, warm-started, step-clamped,
  Levenberg-damped; 2-proxy segment + 1-proxy constraint degenerate cases;
  deterministic test page `test-pages/trilateration.html`, 10/10). `Planner`
  tracks live per-scanner Bermuda distances (`stateMm`, >30 s drop), re-solves
  per floor on new samples (~0.1 Hz), picks the best-RMS floor, resolves identity
  via `Store.people.bermudaDeviceId` (unknown gated by `bleShowUnknown`), and
  exposes `Planner.blePeople` through per-device lerp slots. BLE people render as
  full goal-walk rigs (`TargetWorld.ble`, AI-controller GOAL mode — A* to the
  solve at human speed, no wander/room-confinement; smoke test
  `ble-walk-test.html`) plus 2D dot + initials chip + confidence circle.
- **World Outside — B1**: `Store.people` registry + sidebar CRUD, `Floor.bleProxies`
  fixtures, Bermuda discovery + consent-gated entity enable, `HaApi` registry
  additions.
- **Avatar system**: 22 selectable models (multi-select checkbox grid per
  mmWave/motion sensor; stable djb2-per-target resolution; legacy
  single/'random' fields still read). Per-kind walk personalities
  (waddle/lumber/strut/moon-bounce) and periodic role thought-bubbles
  (lowest bubble priority, fire while walking too). One parametric rig —
  per-rig proportion fields (`h.hipY` etc.) drive seat/lie/table-IK math.
- **Rooms**: `closedWallLoops` is a planar face extractor (T-junctions,
  crossing chords) — invisible walls subdivide open plans. Sidebar sections
  group items by containing room.
- **Device controls**: fans (dblclick → power + % slider in the light modal;
  `fanEntity` binding), TVs `tv`/`wall_tv` (raycastable `_mediaClickables`;
  click toggles, dblclick → `<diorama-media-config>`: play/pause, volume,
  source, now-playing — only what the entity exposes).
- **Table realism**: seat-center placement clearance 150 mm; pose-side root
  clamp ≥190 mm from host edge; arm IK with elbow-height lower bound
  (`≥ top + 30`); tall-host "sit taller" cheat.
- **Step lights**: forward-only cone (1.0 rad, 60° down, origin 120 mm proud
  of the face), half-disc pools, wall/stair-edge snap, negative heights
  (sunken wash-cone height bug fixed — cylinder took raw negative height).
- **Editor batch**: sectional L/R mirror fix (2D plan is the orientation
  contract; 3D `_w` mirrors X — builders need opposite local-X signs),
  furniture color override + picker, arrow-key nudge (25/100 mm, bypasses
  solvers), wall-collision snap for all placeables except doors/windows,
  chair↔table constraint, stairwell holes clipped per-loop
  (Sutherland–Hodgman, 3 mm inset), Layers section (walls toggle, coverage,
  motion zones, target details), top-bar reorg (floors + imperial in
  sidebar; single 2D/3D toggle at left; delete-floor export-offer+confirm).
- **Motion/nav**: 150 mm nav grid with connectivity regions; carrot-chaser +
  critically damped spring (ω=9, substepped) walking; A* with string-pull;
  stuck-goal respawn-in-region after 3 s; edge-aware despawn (fast drop at
  coverage edge vs 10 s opacity fade — per-rig outline material clones);
  mutual separation with the coincident-pair fix.
- **AI avatars** (`MotionSensor.avatar`): renderer-side wander controller
  drives a virtual raw position through the normal pipeline (sits, uses
  anchors, lies in beds, fades on presence loss).
- **Views**: glass house (`scene3d.glassHouse`, ghost stories in
  `_ghostGroup`), wall cutaway (default on, `_updateWallCutaway` per frame),
  auto-follow camera (`scene3d.autoFollow`, activity-bbox framing, 6 s
  manual-orbit pause), Sims cam (dimetric + 45° azimuth snap), plumbob
  toggle, device-local view memory (`localStorage['diorama:view']`),
  touch-drawer suppression with 24 px left-edge exception.
- **iOS hardening**: `webglcontextrestored` re-render, persistent-tick-error
  overlay, `?debug3d=1` on-screen console. iOS companion-app 3D failure was
  never conclusively reproduced — if it recurs, ask for a `?debug3d=1`
  screenshot and suggest Settings → Companion App → Debugging → Reset
  frontend cache.

## Working practices (established with the user)

- **Model routing** (explicit user directive): Fable = architecture,
  tiebreaking, orchestration, root-cause diagnosis. **Opus 4.8 agents write
  all substantive code** (spawn with `model: 'opus'`, detailed specs, no git
  access). **Sonnet agents do research.** Resume prior agents via
  SendMessage to keep their context.
- **Verification gates**: `npm run typecheck` && `npm run build` (no test
  suite), then headless-Chrome screenshots/title-assertions from the
  deterministic pages in `test-pages/` (see its README for the exact
  commands and baselines). Coordinator independently spot-checks agent
  screenshots before shipping.
- **Ship cadence**: every user-visible batch = one commit (imperative
  subject + wrapped body + `Co-Authored-By: Claude Fable 5`), push both
  remotes, `npm run deploy`. Releases only when the user asks ("cut",
  "push release").
- Every commit message and doc change keeps `CLAUDE.md` load-bearing
  sections current (rendering, activity system, pathfinding, gotchas).

## Next arc

The "World Outside" arc (`docs/DESIGN-world.md`, 2026-07-11) is **shipped
through B3** — every phase landed (B1 people/proxies → B2 trilateration → P1
pet rigs → W1 weather core → G1 geo calibration → G2 GPS pins → W2 weather
effects → **B3 identity fusion + name labels**). BLE identity + panel-side
trilateration, GPS landmark calibration + device pins, weather displays +
outdoor 3D effects, and the mmWave↔BLE identity fusion that ties precision to
identity are all in `main`. No successor arc is planned yet.

## Open threads / known deferrals

- Dragging a **table** onto chairs doesn't push the table (only dragged
  seats resolve); documented out of scope.
- Ghost floors (glass house) always show walls regardless of the Walls
  layer (intentional; user hasn't objected).
- Custom recipes draw as labeled rects in 2D; 3D front-arrow indicator
  deferred; mounted items not live-parented (re-snap on next drag).
- Privacy blur is a shared static censor sprite; throttled render-to-texture
  mosaic documented as a stretch upgrade.
- Idle activities ranked "consider next" from research: warming hands at a
  lit fireplace (needs Light-fixture anchors, new plumbing), dance-near-TV
  (conflicts with watch_tv, needs disambiguation), window gazing.
- Imported OBJ/MTL models keep their own materials (not toon-converted).
- iOS 3D load failure unconfirmed — see hardening notes above.
- Docs refreshed in full 2026-07-12 (GUIDE.md/README.md/info.md rewritten to
  the current feature set; screenshots regenerated via
  `test-pages/docs-shots.html` — 12 new modes; keep the generator's modes in
  sync when features change their look).
- Live-HA smoke tests still outstanding for: Bermuda discovery + entity
  enable against a real instance, a landmark calibration walk with a phone,
  and the Open-Meteo zip search (all code-verified only).

## Key architecture pointers

`CLAUDE.md` is authoritative. The dense center of the codebase is
`src/three-renderer.ts` (~5.5k lines): toon material factory `_mat`,
outlines `_addOutlines`, blob shadows, humanoid rig + `updateTargets`
(gait/sit/lie/activities/bubbles/nav/despawn — read its inline gotchas:
raw-vs-nav speeds, anti-feedback rule, per-rig constants), nav grid
`_buildNav` + regions, `updateFloor` (walls/floor clipping/anchors/
sit-spots/beds/TVs/rooms), `updateLightsSwitches` (per-kind bodies, fan
rotors, step spotlights), ghost floors, wall cutaway, auto-follow.
`src/ui/three-view.ts` owns the dirty keys — any new renderer input joins a
key or rides the every-frame calls. Persistence gotchas: new top-level
Store fields → `Planner._loadFromHa` list; per-floor fields → `repairFloor`
+ `defaultFloor`.
