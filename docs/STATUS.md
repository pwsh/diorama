# Project status & pick-up guide

Last updated: 2026-07-11, at **v0.9.0**. This is the single document to read
(alongside `CLAUDE.md`) to resume work with full context.

## Where things stand

Diorama is feature-complete through the Sims-2000 arc (`docs/DESIGN-sims.md`,
all 7 phases shipped) plus five post-arc batches. Everything below is merged
to `main`, pushed to **both remotes**, released through **v0.9.0**, and
deployed to the live HA instance.

### Remotes, releases, deploy

- `origin` = https://repo.holzhueter.us/eric/diorama.git (Gitea, token in the
  remote URL). `github` = https://github.com/pwsh/diorama.git (gh CLI is
  authenticated as `pwsh`). Push **both** on every ship.
- Release runbook: bump `package.json` version → commit `vX.Y.Z` → tag →
  `git push origin main vX.Y.Z && git push github main vX.Y.Z` →
  `gh release create vX.Y.Z --repo pwsh/diorama --title … --notes …` → the
  `release.yml` workflow builds and attaches `diorama.zip` (HACS asset) —
  poll `gh run list --workflow=release.yml` until success and verify the
  asset. Gitea releases optional (v0.4.0 has one; later ones GitHub-only).
- Deploy to live HA: `npm run deploy` (haDeploy plugin → GVFS SMB share at
  10.0.0.6, `www/community/diorama`, config in gitignored
  `deploy.local.json`). User must hard-refresh / reset the companion-app
  frontend cache afterwards.
- Releases so far: v0.4.0 Sims era → v0.5.0 pathfinding/glass house/cutaway
  → v0.6.0 living avatars (AI avatars, despawn fades, beds, auto-follow) →
  v0.7.0 polish & reachability (UI reorg, sectional fix, colors, step
  lights) → v0.8.0 the cast expands (22 avatars, planar rooms, device
  controls) → v0.9.0 room-label layer, unnamed-room placeholders +
  enclosure feedback, settings version stamp.

### Shipped since the DESIGN-sims arc (reverse order)

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

## Next arc (planned, not started)

`docs/DESIGN-world.md` (2026-07-11): BLE identity + panel-side trilateration
via Bermuda per-scanner distances, GPS landmark calibration + device pins,
weather displays + outdoor 3D effects. Phases B1→B2→W1→G1→G2→W2→B3; model
assignments per phase are recorded in the doc (Fable plans/reviews, Opus 4.8
implements, Sonnet 5 researches).

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
- GUIDE.md/info.md were refreshed at v0.4.0; features since then
  (pathfinding, glass house, avatars, device controls, rooms grouping, UI
  reorg) are **not yet in the user guide** — a docs refresh pass is the most
  obvious next chore if the user asks for one.

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
